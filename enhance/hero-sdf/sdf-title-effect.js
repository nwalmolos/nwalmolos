(function () {
  'use strict';

  const HERO_FRAME_RATE = 24;
  const HERO_FRAME_INTERVAL = 1000 / HERO_FRAME_RATE;

  const DEFAULTS = {
    lineSelector: '[data-sdf-line], .polish-title-word',
    pointerTarget: null,
    centerLines: false,
    lensRadius: 0.085,
    strength: 1,
    deformation: 0.1,
    sdfBias: 0.04,
    blurSoftness: 0.06,
    dispersion: 3.75,
    chromaIntensity: 1,
    grainStrength: 0.85,
    trailTextureSize: 1024,
    trailMaxAge: 600,
    trailBlend: 'difference',
    trailRadius: 0.095,
    trailIntensity: 0.1,
    trailMinForce: 0.5,
    trailInfluence: 0.6,
    filmGrain: 0.34,
    uvDisplacement: 18,
    morphAmount: 0,
    chromaticMode: 0.22,
    chromaticSpread: 1,
    followStrength: 0.62,
    followDamping: 14.1,
    filmTransition: 0.82,
    centerSteer: 0.55,
    // Center response keeps the middle of the title from filling in while
    // making the caustic color reveal intentional and controllable.
    centerRange: 0.34,
    centerFeather: 0.14,
    centerResponse: 0.62,
    causticOnset: 0.18,
    causticIntensity: 1.25,
    causticColorLink: 0.72,
    positionColorFlow: 0.92,
    fontLightDominance: 0.84,
    intercolorMix: 0.94,
    projectionLength: 1.0,
    projectionBrightness: 1.0,
    projectionFalloff: 1.65,
    projectionHue: 0.22,
    pointerFollow: 14.1,
    radiusFollow: 20,
    // Release uses a slower critically-damped response so the lens and its
    // title distortion settle together instead of disappearing in one frame.
    recoveryRadiusFollow: 8.6,
    recoveryVelocityDamping: 7.2,
    maxTextureWidth: 5120,
    texturePixelRatio: 3,
    // Render the interactive pass below the idle SDF resolution. The canvas
    // still covers the Hero, so its soft optical field upscales cleanly while
    // the video keeps compositor time.
    // Keep one stable drawing-buffer size across hover and scroll. Resizing a
    // WebGL canvas clears its buffer; if that happens while scroll rendering
    // is suspended, the title stays blank until the resume timer fires.
    interactionPixelRatio: 1,
    coarsePointerHoldMs: 640,
    respectReducedMotion: true
  };

  const VERTEX_SHADER = `#version 300 es
    precision highp float;

    #define PI 3.14159265358979323846
    #define TWO_PI 6.28318530717958647692
    out vec2 vUv;

    void main() {
      vec2 position = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
      vUv = position;
      gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
    }
  `;

  const FRAGMENT_SHADER = `#version 300 es
    precision highp float;

    #define PI 3.14159265358979323846
    #define TWO_PI 6.28318530717958647692
    // Keep the volumetric projection affordable while preserving its three
    // interleaved colour lanes. Nine samples keep three balanced colour lanes
    // while offsetting the cost of restoring the full, uncropped projection.
    #define RAY_SAMPLE_COUNT 9
    #define RAY_LANE_NORMALIZER 3.0

    uniform sampler2D uSdf;
    uniform sampler2D uTrail;
    uniform vec2 uPointer;
    uniform vec2 uPointerVelocity;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uRadius;
    uniform float uStrength;
    uniform float uDeformation;
    uniform float uSdfBias;
    uniform float uBlurSoftness;
    uniform float uDispersion;
    uniform float uChromaIntensity;
    uniform float uGrainStrength;
    uniform float uTrailInfluence;
    uniform float uFilmGrain;
    uniform float uUvDisplacement;
    uniform float uMorphAmount;
    uniform float uChromaticMode;
    uniform float uChromaticSpread;
    uniform float uFollowStrength;
    uniform float uFilmTransition;
    uniform float uCenterSteer;
    uniform float uCenterRange;
    uniform float uCenterFeather;
    uniform float uCenterResponse;
    uniform float uCausticOnset;
    uniform float uCausticIntensity;
    uniform float uCausticColorLink;
    uniform float uPositionColorFlow;
    uniform float uFontLightDominance;
    uniform float uIntercolorMix;
    uniform float uProjectionLength;
    uniform float uProjectionBrightness;
    uniform float uProjectionFalloff;
    uniform float uProjectionHue;
    uniform vec3 uTextColor;

    in vec2 vUv;
    out vec4 outColor;

    float readSdf(vec2 uv) {
      return texture(uSdf, clamp(uv, vec2(0.0), vec2(1.0))).r - 0.5;
    }

    float fillAlpha(float sdf, float softness) {
      return smoothstep(-softness, softness, sdf);
    }

    float sdPoly(vec2 point, float width, float sides) {
      float angle = atan(point.x, point.y) + PI;
      float sector = TWO_PI / sides;
      float distanceToEdge = cos(floor(0.5 + angle / sector) * sector - angle) * length(point);
      return distanceToEdge * 2.0 - width;
    }

    float chromaBlur(vec2 uv, vec2 tangentStep, float bias, float softness) {
      float alpha = fillAlpha(readSdf(uv) + bias, softness) * 0.5;
      alpha += fillAlpha(readSdf(uv + tangentStep) + bias, softness) * 0.25;
      alpha += fillAlpha(readSdf(uv - tangentStep) + bias, softness) * 0.25;
      return alpha;
    }

    float sdfEdgeEnergy(vec2 uv, float width) {
      float distanceToEdge = abs(readSdf(uv));
      return 1.0 - smoothstep(width * 0.18, width, distanceToEdge);
    }

    float hash12(vec2 point) {
      vec3 p3 = fract(vec3(point.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float filmNoise(vec2 pixel, float time) {
      float frame = floor(time * 24.0);
      float fine = hash12(floor(pixel) + vec2(frame * 19.17, frame * 7.31));
      float clump = hash12(floor(pixel * 0.42) + vec2(frame * 3.73, -frame * 5.91));
      float scratch = hash12(vec2(floor(pixel.x * 0.16), floor(pixel.y * 1.7)) + frame);
      return clamp(fine * 0.84 + clump * 0.12 + scratch * 0.04, 0.0, 1.0);
    }

    vec3 filmPalette(float t) {
      // Harmonised film stocks: deep indigo, oxidised teal, lichen olive,
      // burnt amber and oxblood. Adjacent hues share similar luminance so a
      // mouse-driven palette shift does not flash or produce traffic-light
      // red/green/blue collisions.
      t = clamp(t, 0.0, 1.0);
      vec3 indigo = vec3(0.094, 0.188, 0.337);
      vec3 cyan = vec3(0.141, 0.486, 0.525);
      vec3 olive = vec3(0.420, 0.455, 0.263);
      vec3 amber = vec3(0.753, 0.416, 0.173);
      vec3 red = vec3(0.561, 0.176, 0.165);
      vec3 color = mix(indigo, cyan, smoothstep(0.0, 0.28, t));
      color = mix(color, olive, smoothstep(0.22, 0.52, t));
      color = mix(color, amber, smoothstep(0.46, 0.76, t));
      return mix(color, red, smoothstep(0.70, 1.0, t));
    }

    float wrappedBand(float t, float center, float width) {
      float distanceToBand = abs(fract(t - center + 0.5) - 0.5);
      float band = clamp(1.0 - distanceToBand / width, 0.0, 1.0);
      return band * band * (3.0 - 2.0 * band);
    }

    vec3 filmSpectrum(float t) {
      // A circular, overlapping film-stock spectrum. Unlike filmPalette,
      // this never collapses a beam to one mouse-selected colour: adjacent
      // indigo/cyan/olive/amber/red stocks remain present at every phase.
      vec3 indigo = vec3(0.094, 0.188, 0.337);
      vec3 cyan = vec3(0.141, 0.486, 0.525);
      vec3 olive = vec3(0.420, 0.455, 0.263);
      vec3 amber = vec3(0.753, 0.416, 0.173);
      vec3 red = vec3(0.561, 0.176, 0.165);
      float indigoWeight = wrappedBand(t, 0.02, 0.32);
      float cyanWeight = wrappedBand(t, 0.22, 0.32);
      float oliveWeight = wrappedBand(t, 0.44, 0.32);
      float amberWeight = wrappedBand(t, 0.67, 0.32);
      float redWeight = wrappedBand(t, 0.88, 0.32);
      float totalWeight = max(
        indigoWeight + cyanWeight + oliveWeight + amberWeight + redWeight,
        0.001
      );
      return (
        indigo * indigoWeight +
        cyan * cyanWeight +
        olive * oliveWeight +
        amber * amberWeight +
        red * redWeight
      ) / totalWeight;
    }

    // Map a screen-space point back into the moving glyph texture. Both the
    // visible title and the volumetric ray source use this exact structural
    // transform, so the projection cannot keep sampling a stale, static copy
    // of the letters while the title is being pulled or reverse-followed.
    vec2 warpGlyphUv(
      vec2 pointUv,
      float aspect,
      float presence,
      float centerProximity,
      float centerModulation
    ) {
      vec2 localDelta = pointUv - uPointer;
      vec2 localMetricDelta = vec2(localDelta.x * aspect, localDelta.y);
      float localNormalizedDistance = length(localMetricDelta) / max(0.0001, uRadius);
      float localMouseField = (
        1.0 - smoothstep(0.12, 1.0, localNormalizedDistance)
      ) * presence;
      float localTrailRaw = texture(
        uTrail,
        clamp(pointUv, vec2(0.0), vec2(1.0))
      ).r;
      float localTrailField = smoothstep(0.038, 0.19, localTrailRaw) *
                              clamp(uTrailInfluence, 0.0, 1.2) * 0.58;
      float localInteraction = clamp(
        max(localMouseField, localTrailField),
        0.0,
        1.0
      );

      vec2 fallbackSteer = normalize(vec2(0.86, -0.28));
      vec2 velocitySteer = normalize(uPointerVelocity + fallbackSteer * 0.12);
      vec2 centerSteer = velocitySteer * 0.20 * centerProximity *
                         clamp(uCenterSteer, 0.0, 1.0);
      vec2 pullUv = (uPointer - vec2(0.5)) +
                    centerSteer * vec2(1.0 / max(aspect, 0.35), 1.0);
      float localDeformation = pow(localMouseField, 1.6) *
                               uDeformation * uStrength *
                               mix(1.0, 0.72, centerModulation);
      vec2 followVector = uPointerVelocity * max(0.0, uFollowStrength) *
                          vec2(0.88, 1.0) * presence *
                          mix(1.0, 0.78, centerModulation);

      vec2 localMorphPoint = pointUv - uPointer;
      localMorphPoint.x *= aspect;
      float localTriangleSdf = sdPoly(
        localMorphPoint + vec2(0.0, 0.025),
        0.24,
        3.0
      );
      float localMorphField = (
        1.0 - smoothstep(-0.075, 0.055, localTriangleSdf)
      ) * clamp(uMorphAmount, 0.0, 1.0) * presence;
      vec2 localMorphOffset = normalize(localMorphPoint + vec2(0.0001)) *
                              localMorphField * 0.012;

      // Separate the small uniform follow from the locally varying warp. At
      // high pointer speed an uncapped local offset can become wider than the
      // lens transition itself; the inverse UV map then folds and samples the
      // same source letter twice. Limit only that varying component, using an
      // aspect-correct distance, so ordinary motion keeps its full response.
      vec2 globalFollowOffset = followVector * 0.24;
      vec2 localWarpOffset = -pullUv * localDeformation +
                             followVector * localInteraction * 0.76 +
                             localMorphOffset;
      vec2 metricWarpOffset = vec2(
        localWarpOffset.x * aspect,
        localWarpOffset.y
      );
      float maxLocalTransport = max(0.002, uRadius * 0.34);
      float transportSafety = min(
        1.0,
        maxLocalTransport / max(length(metricWarpOffset), 0.0001)
      );

      return pointUv + globalFollowOffset +
             localWarpOffset * transportSafety;
    }

    void main() {
      vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
      float aspect = max(0.35, uResolution.x / max(1.0, uResolution.y));
      vec2 delta = uv - uPointer;
      vec2 metricDelta = vec2(delta.x * aspect, delta.y);
      float distanceToPointer = length(metricDelta);
      float radius = max(0.0001, uRadius);
      float normalizedDistance = distanceToPointer / radius;
      float mouseField = 1.0 - smoothstep(0.12, 1.0, normalizedDistance);
      float presence = smoothstep(0.0, 0.08, uRadius);
      mouseField *= presence;

      // The trail is painted into an offscreen texture with difference blending.
      // Overlapping stamps invert one another, leaving a crisp, imperfect trace.
      float trailRaw = texture(uTrail, uv).r;
      // Keep the difference trail as a narrow halo. A low-alpha stamp can
      // otherwise read as a solid grainy disc over the whole glyph.
      float trailField = smoothstep(0.038, 0.19, trailRaw) *
                         clamp(uTrailInfluence, 0.0, 1.2) * 0.58;
      float interactionField = clamp(max(mouseField, trailField), 0.0, 1.0);
      float blurField = max(pow(mouseField, 0.72), pow(trailField, 0.84) * 0.26);

      // Variation 4 from Codrops: use a triangle SDF as a local aperture
      // around the pointer to reshape the original glyph SDF, rather than
      // swapping the typeface or drawing a separate geometric layer.
      vec2 morphPoint = uv - uPointer;
      morphPoint.x *= aspect;
      float triangleSdf = sdPoly(morphPoint + vec2(0.0, 0.025), 0.24, 3.0);
      float morphField = (1.0 - smoothstep(-0.075, 0.055, triangleSdf)) *
                         clamp(uMorphAmount, 0.0, 1.0) * presence;

      vec2 pointerCenter = vec2((uPointer.x - 0.5) * aspect, uPointer.y - 0.5);
      float centerRange = clamp(uCenterRange, 0.08, 0.62);
      float centerFeather = min(clamp(uCenterFeather, 0.01, 0.30), centerRange * 0.92);
      float centerInner = max(0.0, centerRange - centerFeather);
      float centerProximity = 1.0 - smoothstep(
        centerInner,
        centerRange,
        length(pointerCenter)
      );
      float centerResponse = clamp(uCenterResponse, 0.0, 1.0);
      // At zero the caustic behaves uniformly across the lens. At one the
      // color waits for the cursor to approach the title center, which keeps
      // a center hit from turning into a solid white/color-filled disc.
      float centerColorGate = mix(1.0, centerProximity, centerResponse);
      // Edge positions retain enough color energy for position-driven hue to
      // remain legible; the center still receives the strongest response.
      float colorTimingGate = mix(0.62, 1.0, centerColorGate);
      float centerModulation = centerProximity * centerResponse;
      // Mouse position becomes a stable film-palette coordinate: left is
      // cool, right is warm, and vertical movement adds a smaller drift.
      // Projection hue remains the base when position flow is reduced.
      float pointerPalette = clamp(
        mix(0.08, 0.92, uPointer.x) + (uPointer.y - 0.5) * 0.18,
        0.0,
        1.0
      );
      float positionFlow = clamp(uPositionColorFlow, 0.0, 1.0);
      float dynamicCausticHue = mix(
        clamp(uProjectionHue, 0.0, 1.0),
        pointerPalette,
        positionFlow
      );
      float pointerSpectrumShift = (pointerPalette - 0.5) *
                                   positionFlow * 0.92;
      float baseSpectrumShift = (clamp(uProjectionHue, 0.0, 1.0) - 0.5) *
                                (1.0 - positionFlow) * 0.38;
      float pointerWarmth = smoothstep(0.12, 0.88, pointerPalette);
      vec3 coolPositionGrade = vec3(0.68, 1.08, 1.32);
      vec3 warmPositionGrade = vec3(1.28, 0.96, 0.68);
      vec3 positionColorGrade = mix(
        vec3(1.0),
        mix(coolPositionGrade, warmPositionGrade, pointerWarmth),
        positionFlow * 0.76
      );
      vec3 textLightColor = clamp(uTextColor, vec3(0.0), vec3(1.0));
      float fontLightDominance = clamp(uFontLightDominance, 0.0, 1.0);
      float film = filmNoise(gl_FragCoord.xy, uTime);
      vec2 noiseVector = vec2(
        hash12(gl_FragCoord.xy + floor(uTime * 31.0) * 13.7),
        hash12(gl_FragCoord.yx - floor(uTime * 29.0) * 9.2)
      ) - 0.5;
      vec2 trailTexel = 1.0 / max(uResolution, vec2(1.0));
      float trailRight = texture(uTrail, clamp(uv + vec2(trailTexel.x * 3.0, 0.0), 0.0, 1.0)).r;
      float trailLeft = texture(uTrail, clamp(uv - vec2(trailTexel.x * 3.0, 0.0), 0.0, 1.0)).r;
      float trailUp = texture(uTrail, clamp(uv + vec2(0.0, trailTexel.y * 3.0), 0.0, 1.0)).r;
      float trailDown = texture(uTrail, clamp(uv - vec2(0.0, trailTexel.y * 3.0), 0.0, 1.0)).r;
      vec2 trailNormal = vec2(trailRight - trailLeft, trailUp - trailDown);
      vec2 grainOffset = (noiseVector * (0.35 + film * 1.55) + trailNormal * 2.2) *
                         trailTexel * uUvDisplacement * trailField;
      // Positive pointer velocity samples ahead of the cursor, leaving the
      // visible title disturbance behind it (the CodePen-style reverse trail).
      // The grain stays a tiny surface-only offset; the large structural
      // movement comes from warpGlyphUv and is shared with the ray source.
      vec2 structuralWarpedUv = warpGlyphUv(
        uv,
        aspect,
        presence,
        centerProximity,
        centerModulation
      );
      vec2 warpedUv = structuralWarpedUv + grainOffset;
      vec2 structuralDisplacement = structuralWarpedUv - uv;
      structuralDisplacement.x *= aspect;
      float transportedMotion = smoothstep(
        0.0015,
        0.022,
        length(structuralDisplacement)
      ) * interactionField;
      float sdfBias = (
        pow(mouseField, 1.1) + pow(trailField, 1.18) * 0.2 + morphField * 0.48
      ) * uSdfBias * uStrength;
      float sdf = readSdf(warpedUv) + sdfBias;
      // Slightly wider derivative coverage smooths the curved Pilowlava
      // outline without reintroducing the broad blur used by the VFX field.
      float aa = max(fwidth(sdf) * 1.45, 0.0021);
      vec2 texel = 1.0 / max(uResolution, vec2(1.0));

      // Continuous analytic SDF blur: no sparse tap copies or layer boundary.
      float blurSoftness = mix(aa, max(aa, uBlurSoftness * uStrength), blurField);
      blurSoftness *= mix(1.0, 0.62, morphField);
      float softAlpha = fillAlpha(sdf, blurSoftness);

      // A stable optical axis puts anaglyph red and cyan on opposite sides.
      // Like Creatura, separation grows away from the optical center. Fade it
      // out at the end of the lens so no colored ring survives outside it.
      vec2 spectralAxis = normalize(vec2(1.0, 0.18));
      float opticalEdge = max(
        pow(clamp(normalizedDistance, 0.0, 1.0), 0.7) * mouseField,
        trailField * 0.66
      );
      float chromaPresence = smoothstep(0.0, 0.38, interactionField) *
                             colorTimingGate;
      float dispersion = mix(uDispersion * 0.0666667, uDispersion, opticalEdge) *
                         chromaPresence * uStrength;
      vec2 spectralOffset = spectralAxis * texel * dispersion * max(0.0, uChromaticSpread);
      vec2 spectralTangent = vec2(-spectralAxis.y, spectralAxis.x);
      vec2 chromaStep = spectralTangent * texel *
                        mix(0.75, 1.6, opticalEdge) * chromaPresence;

      // Give the chromatic samples their own slightly wider reconstruction
      // width so a sub-pixel offset cannot turn into a serrated color edge.
      float chromaSoftness = max(blurSoftness, aa * 1.5) +
                             opticalEdge * chromaPresence * 0.01;

      float alphaR = chromaBlur(
        warpedUv + spectralOffset,
        chromaStep,
        sdfBias,
        chromaSoftness
      );
      float alphaCyan = chromaBlur(
        warpedUv - spectralOffset,
        chromaStep,
        sdfBias,
        chromaSoftness
      );
      float signedSeparation = alphaR - alphaCyan;
      float spectralDifference = abs(signedSeparation);

      // Canonical red/cyan anaglyph primaries: #ff0000 and #00ffff.
      // Their maximum contribution is deliberately kept barely perceptible.
      vec3 redGlass = vec3(1.0, 0.0, 0.0);
      vec3 cyanGlass = vec3(0.0, 1.0, 1.0);
      float chromaTransition = max(fwidth(signedSeparation) * 3.5, 0.024);
      float redCyanBlend = smoothstep(
        -chromaTransition,
        chromaTransition,
        signedSeparation
      );
      vec3 fringeTint = mix(cyanGlass, redGlass, redCyanBlend);
      float causticColorLink = clamp(uCausticColorLink, 0.0, 1.0);
      vec3 sharedCausticTint = filmPalette(dynamicCausticHue);
      sharedCausticTint *= positionColorGrade;
      sharedCausticTint = mix(sharedCausticTint, vec3(1.0), 0.04);
      // The glyph-edge caustic and the volumetric projection share the same
      // palette anchor. The link control keeps some red/cyan optical identity
      // available instead of replacing it with a flat single color.
      fringeTint = mix(
        fringeTint,
        sharedCausticTint,
        causticColorLink * colorTimingGate * 0.68
      );
      float glyphEdge = 1.0 - smoothstep(0.52, 0.96, softAlpha);
      float radialTint = mix(0.005, 0.18, opticalEdge);
      float tintStrength = smoothstep(0.008, 0.08, spectralDifference) *
                           chromaPresence * glyphEdge * radialTint * uChromaIntensity;
      float edgeTintStrength = clamp(
        tintStrength * mix(1.18, 0.58, fontLightDominance),
        0.0,
        1.0
      );
      vec3 dispersedLight = mix(
        textLightColor * softAlpha,
        fringeTint * softAlpha,
        edgeTintStrength
      );
      vec3 spectralLight = textLightColor * vec3(alphaR, softAlpha, alphaCyan);
      float spectralMix = clamp(uChromaticMode * chromaPresence, 0.0, 1.0);
      dispersedLight = mix(dispersedLight, spectralLight, spectralMix);

      // Drive the liquified color from actual transport distance. Do not use
      // readSdf(uv) here: that static source-space mask remains visible as a
      // translucent copy of the original letter inside a moving light cloud.
      float spillOpacityBand = smoothstep(0.035, 0.32, softAlpha) *
                               (1.0 - smoothstep(0.58, 0.88, softAlpha));
      float displacedLightMask = softAlpha *
                                 transportedMotion;
      float displacedSpill = spillOpacityBand *
                             transportedMotion;
      float lensIntercolorFlow = 0.5 + 0.5 * sin(
        (normalizedDistance * 2.8 +
         trailRaw * 1.4 +
         film * 0.16) * PI
      );
      vec3 lensCool = filmPalette(clamp(dynamicCausticHue - 0.18, 0.0, 1.0));
      vec3 lensWarm = filmPalette(clamp(dynamicCausticHue + 0.18, 0.0, 1.0));
      vec3 lensIntercolor = mix(
        lensCool,
        lensWarm,
        smoothstep(0.08, 0.92, lensIntercolorFlow)
      );
      lensIntercolor *= positionColorGrade;
      float lensLuminance = dot(
        lensIntercolor,
        vec3(0.2126, 0.7152, 0.0722)
      );
      lensIntercolor *= clamp(
        0.42 / max(lensLuminance, 0.05),
        0.88,
        1.9
      );
      lensIntercolor = clamp(lensIntercolor, vec3(0.0), vec3(1.0));
      float lensColorStrength = displacedSpill *
                                clamp(uIntercolorMix, 0.0, 1.0) *
                                mix(0.82, 0.52, fontLightDominance);
      dispersedLight = mix(
        dispersedLight,
        lensIntercolor * softAlpha,
        clamp(lensColorStrength, 0.0, 0.76)
      );
      float lensDistanceFalloff = pow(
        1.0 - smoothstep(0.04, 1.0, clamp(normalizedDistance, 0.0, 1.0)),
        mix(1.05, 1.65, clamp(uProjectionFalloff / 3.0, 0.0, 1.0))
      );
      // Transported light must not become a grey absorption patch. Keep its
      // luminance neutral at the far edge and add a restrained lift near the
      // pointer; distance is expressed by the projection falloff instead.
      float spillBrightness = mix(1.0, 1.08, lensDistanceFalloff);
      dispersedLight *= mix(
        1.0,
        spillBrightness,
        clamp(displacedLightMask, 0.0, 1.0)
      );

      float dither = fract(52.9829189 * fract(dot(
        gl_FragCoord.xy,
        vec2(0.06711056, 0.00583715)
      ))) - 0.5;
      float fineNoise = fract(sin(dot(
        gl_FragCoord.xy,
        vec2(12.9898, 78.233)
      )) * 43758.5453) - 0.5;
      float softEdgeBand = smoothstep(0.015, 0.28, softAlpha) *
                           (1.0 - smoothstep(0.9, 1.0, softAlpha));
      float grain = (dither * 0.68 + fineNoise * 0.32) * interactionField *
                    softEdgeBand * uGrainStrength / 255.0;

      // Film stock response: the trail gates a high-frequency salt-and-pepper
      // pattern instead of spawning geometric particles. A little noise spills
      // beyond the SDF edge, giving the trace a photographic, dry texture.
      float grainGate = smoothstep(0.8, 0.96, film);
      float grainField = clamp(max(trailField, mouseField * 0.92), 0.0, 1.0);
      float filmMix = clamp(
        uFilmTransition * mix(0.06, 1.0, smoothstep(0.02, 0.68, interactionField)),
        0.0,
        1.0
      ) * mix(1.0, 0.86, centerModulation);
      float porousAmount = clamp(grainField * uFilmGrain * filmMix * 0.34, 0.0, 0.28);
      // The moving trail used to mix softAlpha with a mostly-zero binary
      // grain mask. That reduced coverage across the entire cursor stamp and
      // produced the grey patch which vanished as soon as the trail faded.
      // Preserve glyph coverage and express film stock as positive micro-light.
      float filmAlpha = softAlpha;
      float filmSparkle = softAlpha * grainGate * porousAmount * 0.075;
      // Keep the film grain in the volumetric field; do not draw a dust line
      // directly on the glyph perimeter (that reads as a 2D outline).
      float outsideBand = smoothstep(0.018, 0.085, sdf) * (1.0 - softAlpha);
      float dust = outsideBand * grainField * step(0.96, film) * uFilmGrain * filmMix * 0.004;
      float alphaScale = softAlpha > 0.0001 ? filmAlpha / softAlpha : 0.0;
      dispersedLight = dispersedLight * alphaScale +
                       textLightColor * filmSparkle + vec3(dust);

      // VFX-JS style shadow scattering. For every pixel outside the glyph,
      // march from that pixel toward the actual mouse position and accumulate
      // the source mask encountered on the way. This is the CodePen mechanism:
      // the shadow follows in the opposite direction of the cursor without
      // drawing a second DOM/SDF copy of the text.
      float reflectionActivity = clamp(
        max(uFilmGrain * 0.92, uTrailInfluence * 0.68),
        0.0,
        1.0
      ) * presence;
      float aspectRatio = max(0.35, uResolution.x / max(1.0, uResolution.y));
      vec2 p = uv * 2.0 - 1.0;
      p.x *= aspectRatio;
      vec2 mousePoint = uPointer * 2.0 - 1.0;
      mousePoint.x *= aspectRatio;
      // Projection length controls both the sampled shadow reach and the
      // visible sphere falloff. The default maps to the previous 1× span.
      float projectionLength = clamp(uProjectionLength, 0.55, 1.45);
      float distanceToMouse = length(p - mousePoint);
      float projectionRadius = max(0.001, 2.35 * projectionLength);
      float normalizedLightDistance = clamp(distanceToMouse / projectionRadius, 0.0, 1.0);
      vec2 rayStep = (mousePoint - p) * projectionLength /
                     float(RAY_SAMPLE_COUNT);
      vec2 rayPoint = p;
      vec2 rayDirection = normalize(mousePoint - p + vec2(0.0001));
      vec2 rayNormal = vec2(-rayDirection.y, rayDirection.x);
      vec2 rayNormalUv = vec2(
        rayNormal.x / max(aspectRatio, 0.35),
        rayNormal.y
      ) * 0.5;
      float intercolorMix = clamp(uIntercolorMix, 0.0, 1.0);
      float beamColorSplit = 0.022 * intercolorMix *
                             mix(0.72, 1.42, clamp(uChromaticSpread / 2.2, 0.0, 1.0)) *
                             mix(0.72, 1.18, normalizedLightDistance);
      float coolAccumulation = 0.0;
      float middleAccumulation = 0.0;
      float warmAccumulation = 0.0;
      for (int raySample = 0; raySample < RAY_SAMPLE_COUNT; raySample += 1) {
        rayPoint += rayStep;
        vec2 rayNoise = vec2(
          hash12(gl_FragCoord.xy + vec2(float(raySample) * 17.31, 4.7)),
          hash12(gl_FragCoord.yx + vec2(float(raySample) * 9.13, 21.4))
        ) - 0.5;
        vec2 samplePoint = rayPoint + rayNoise * (0.020 + float(raySample) * 0.00034);
        vec2 sampleUv = samplePoint;
        sampleUv.x /= aspectRatio;
        sampleUv = sampleUv * 0.5 + 0.5;
        int spectralLane = raySample - (raySample / 3) * 3;
        float laneOffset = spectralLane == 0 ? -beamColorSplit :
                           (spectralLane == 2 ? beamColorSplit : 0.0);
        vec2 raySourceUv = warpGlyphUv(
          sampleUv + rayNormalUv * laneOffset,
          aspect,
          presence,
          centerProximity,
          centerModulation
        );
        // Keep the projected grain optically soft without letting every ray
        // inherit a wide low-frequency blur from the glyph reconstruction.
        float sourceMask = fillAlpha(
          readSdf(raySourceUv),
          max(aa * 2.2, 0.009)
        );
        if (spectralLane == 0) {
          coolAccumulation += sourceMask / RAY_LANE_NORMALIZER;
        } else if (spectralLane == 1) {
          middleAccumulation += sourceMask / RAY_LANE_NORMALIZER;
        } else {
          warmAccumulation += sourceMask / RAY_LANE_NORMALIZER;
        }
      }

      float sourceAccumulation = (
        coolAccumulation + middleAccumulation + warmAccumulation
      ) / 3.0;
      float falloffExponent = clamp(uProjectionFalloff, 0.45, 3.0);
      float distanceFalloff = pow(
        1.0 - smoothstep(0.02, 0.94, normalizedLightDistance),
        falloffExponent
      );
      float inverseFalloff = 1.0 / (1.0 + normalizedLightDistance * normalizedLightDistance * 4.8);
      float sphereDepth = 0.68 + 0.32 * (1.0 - normalizedLightDistance);
      float centerGlowDampen = mix(1.0, 0.70, centerModulation);
      float lightMask = distanceFalloff *
                        mix(1.0, inverseFalloff, 0.74) *
                        sphereDepth * centerGlowDampen;
      float rayField = clamp(sourceAccumulation * 2.7, 0.0, 1.0);
      float beamDensity = 1.0 - exp(-sourceAccumulation * 5.2);
      float outerLayer = smoothstep(0.01, 0.22, beamDensity) *
                         (1.0 - smoothstep(0.78, 1.0, beamDensity) * 0.25);
      float middleLayer = smoothstep(0.12, 0.50, beamDensity) *
                          (1.0 - smoothstep(0.78, 1.0, beamDensity) * 0.45);
      float coreLayer = smoothstep(0.45, 0.90, beamDensity);
      float filmRayNoise = filmNoise(gl_FragCoord.xy * 0.68 + vec2(113.0, 7.0), uTime + 5.0);
      float causticGrain = mix(0.52, filmRayNoise, filmMix);
      float spectralReflection = mix(0.58, 1.05, smoothstep(0.12, 0.84, uChromaticMode));
      float causticStart = mix(0.001, 0.18, clamp(uCausticOnset, 0.0, 1.0));
      float causticWindow = mix(0.025, 0.14, clamp(uCausticOnset, 0.0, 1.0));
      float causticProgress = smoothstep(
        causticStart,
        causticStart + causticWindow,
        sourceAccumulation
      );
      float causticDisplay = causticProgress * colorTimingGate;
      // Start the volume outside the signed edge with a continuous distance
      // fade.  Using softAlpha here created a dark/color contour when a beam
      // landed directly over a letter.
      float outsideGlyph = smoothstep(0.56, 0.94, 1.0 - softAlpha);
      float sourcePresence = smoothstep(0.001, 0.026, sourceAccumulation);
      float localScattering = outsideGlyph * reflectionActivity * lightMask * sourcePresence;
      float phase = fract(
        0.08 +
        sourceAccumulation * 3.5 +
        normalizedLightDistance * 0.62 +
        (causticGrain - 0.5) * 0.10 +
        pointerSpectrumShift +
        baseSpectrumShift
      );
      // The reference maps ray accumulation through a spectrum. Here the
      // same mechanism is split into three interleaved, laterally offset ray
      // lanes. Adjacent pixels therefore resolve different stocks inside one
      // beam instead of recolouring the whole beam with a single mouse hue.
      vec3 laneAccumulations = vec3(
        coolAccumulation,
        middleAccumulation,
        warmAccumulation
      );
      float strongestLane = max(
        max(coolAccumulation, middleAccumulation),
        warmAccumulation
      );
      float laneSharpness = mix(1.15, 2.35, intercolorMix);
      vec3 laneWeights = pow(
        clamp(laneAccumulations / max(strongestLane, 0.001), 0.0, 1.0),
        vec3(laneSharpness)
      );
      laneWeights *= smoothstep(
        vec3(0.001),
        vec3(0.065),
        laneAccumulations
      );
      float laneWeightTotal = max(
        laneWeights.x + laneWeights.y + laneWeights.z,
        0.001
      );
      vec3 coolLaneColor = filmSpectrum(phase - 0.21 * intercolorMix);
      vec3 middleLaneColor = filmSpectrum(phase);
      vec3 warmLaneColor = filmSpectrum(phase + 0.21 * intercolorMix);
      vec3 paletteLayers = (
        coolLaneColor * laneWeights.x +
        middleLaneColor * laneWeights.y +
        warmLaneColor * laneWeights.z
      ) / laneWeightTotal;
      vec3 accumulationSpectrum = filmSpectrum(
        phase + (beamDensity - 0.5) * 0.28
      );
      paletteLayers = mix(
        paletteLayers,
        accumulationSpectrum,
        intercolorMix * 0.24
      );
      vec3 laneContrasts = abs(laneAccumulations - laneAccumulations.yzx);
      vec3 spectralLayerWeights = smoothstep(
        vec3(0.0015),
        vec3(0.055),
        laneContrasts
      );
      float spectralLayerTotal = max(
        spectralLayerWeights.x + spectralLayerWeights.y + spectralLayerWeights.z,
        0.001
      );
      vec3 beamLayerColor = (
        coolLaneColor * spectralLayerWeights.x +
        middleLaneColor * spectralLayerWeights.y +
        warmLaneColor * spectralLayerWeights.z
      ) / spectralLayerTotal;
      float beamLayerContrast = max(
        max(spectralLayerWeights.x, spectralLayerWeights.y),
        spectralLayerWeights.z
      ) * intercolorMix;
      paletteLayers = mix(
        paletteLayers,
        beamLayerColor,
        beamLayerContrast * 0.40
      );
      // Apply one controlled colour grade to the complete spectral set. The
      // whole field visibly follows the cursor from cool to warm while the
      // three lane colours keep their relative separation inside each beam.
      paletteLayers *= positionColorGrade;
      float causticIntensity = clamp(uCausticIntensity, 0.0, 2.0);
      vec3 dynamicProjectionTint = filmSpectrum(
        phase + 0.10
      );
      vec3 projectionTint = mix(
        dynamicProjectionTint,
        sharedCausticTint,
        causticColorLink * 0.32
      );
      projectionTint *= mix(
        vec3(1.0),
        positionColorGrade,
        positionFlow * 0.34
      );
      projectionTint = mix(projectionTint, vec3(1.0), 0.04) *
                       mix(0.82, 1.22, causticIntensity * 0.5);
      // The closer a ray gets to the sampled glyph, the more it inherits the
      // current title edge colour instead of switching to a hard palette band.
      vec3 textTint = mix(
        textLightColor,
        fringeTint,
        clamp(uChromaticMode * 0.28 * (1.0 - fontLightDominance * 0.35), 0.0, 0.28)
      );
      float textLink = smoothstep(0.015, 0.44, sourceAccumulation) * causticDisplay;
      float layerTotal = max(outerLayer + middleLayer + coreLayer, 0.001);
      // Lift chroma luminance without adding white. Dark indigo would
      // otherwise disappear first when projection brightness is reduced,
      // making every surviving ray look grey.
      float paletteLuminance = dot(
        paletteLayers,
        vec3(0.2126, 0.7152, 0.0722)
      );
      float paletteLift = clamp(
        0.40 / max(paletteLuminance, 0.05),
        0.85,
        1.9
      );
      paletteLayers *= mix(1.0, paletteLift, intercolorMix * 0.76);
      paletteLayers = clamp(paletteLayers, vec3(0.0), vec3(1.0));
      // Spatially anchor the spectrum to the actual font colour. Dense beam
      // cores inherit paper white from the glyph, then continuously release
      // into the coloured outer lanes. The control changes the anchor area,
      // not the saturation of the whole projection.
      float fontAnchorExponent = mix(1.65, 0.85, fontLightDominance);
      float fontColorAnchor = pow(
        clamp(beamDensity, 0.0, 1.0),
        fontAnchorExponent
      ) * fontLightDominance;
      paletteLayers = mix(
        paletteLayers,
        textLightColor,
        clamp(fontColorAnchor * 0.64, 0.0, 0.64)
      );
      // The font color remains the body of the light. Color is inserted most
      // strongly in the outer/middle scattering layers and kept restrained in
      // the core, so the ray never becomes a flat single-color projection.
      float edgeLayerWeight = clamp(
        (outerLayer * 0.90 + middleLayer * 0.56 + coreLayer * 0.18) / layerTotal,
        0.0,
        1.0
      );
      float colorInsert = clamp(
        causticDisplay * (0.40 + edgeLayerWeight * 0.56) * causticIntensity *
        mix(0.94, 0.66, fontLightDominance),
        0.0,
        0.86
      );
      float rayColorStrength = clamp(
        mix(0.88, 0.72, fontLightDominance) + colorInsert * 0.20,
        0.0,
        0.90
      );
      vec3 layeredColor = mix(textLightColor, paletteLayers, rayColorStrength);
      layeredColor = mix(layeredColor, projectionTint, rayColorStrength * 0.10);
      // Keep the same white/chromatic edge identity as the glyph and only
      // tint the farther field; this removes the pasted-on two-system look.
      vec3 linkedColor = mix(
        layeredColor,
        textTint,
        textLink * mix(0.24, 0.52, fontLightDominance)
      );
      linkedColor = mix(
        linkedColor,
        projectionTint,
        rayColorStrength * 0.06
      );
      vec3 vfxScatter = linkedColor * (outerLayer * 0.24 +
                                      middleLayer * 0.34 +
                                      coreLayer * 0.48);
      vfxScatter += beamLayerColor * beamLayerContrast *
                    (outerLayer * 0.10 + middleLayer * 0.16);
      // This is an emitted/reflected light field. Do not subtract accumulated
      // coverage: under normal alpha compositing that subtraction reads as a
      // moving grey shadow rather than optical depth.
      float projectionBrightness = clamp(uProjectionBrightness, 0.0, 4.0);
      vfxScatter += vec3((lightMask * 0.012) * (0.5 + rayField * 0.5));
      float granularRay = (causticGrain - 0.5) * 0.10 * rayField;
      float chromaGain = mix(0.52, 1.24, clamp(uChromaticMode, 0.0, 1.0));
      vec3 causticEmission = (
        textLightColor * (0.05 + fontColorAnchor * 0.10) +
        projectionTint * colorInsert * 0.34
      ) * causticDisplay * causticIntensity;
      vec3 scatterContribution = (
        (vfxScatter + vec3(granularRay)) * spectralReflection * chromaGain +
        causticEmission
      ) * localScattering * projectionBrightness;
      // Compress only the projected field. The glyph keeps its paper-white
      // identity, while nearby rays remain bright and distant rays roll off
      // instead of flattening at the same clipped value.
      scatterContribution = scatterContribution /
                            (vec3(1.0) + max(scatterContribution, vec3(0.0)) * 0.82);
      dispersedLight += scatterContribution;
      dispersedLight = clamp(dispersedLight + vec3(grain), 0.0, 1.0);
      float finalAlpha = max(dispersedLight.r, max(dispersedLight.g, dispersedLight.b));

      outColor = vec4(dispersedLight, finalAlpha);
    }
  `;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function numberOption(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function parseCssColor(value, fallback) {
    const safeFallback = Array.isArray(fallback) ? fallback : [0.94, 0.937, 0.914];
    const match = String(value || '').trim().match(/^rgba?\((.*)\)$/i);
    if (!match) return safeFallback.slice();
    const channels = match[1].match(/-?(?:\d+\.?\d*|\.\d+)%?/g) || [];
    if (channels.length < 3) return safeFallback.slice();
    const parseChannel = (channel) => channel.endsWith('%')
      ? Number(channel.slice(0, -1)) * 2.55
      : Number(channel);
    const parseAlpha = (channel) => channel && channel.endsWith('%')
      ? Number(channel.slice(0, -1)) / 100
      : Number(channel);
    // The production hero's first line uses background-clip text, so its
    // computed CSS color is rgba(0, 0, 0, 0). A transparent source must not
    // turn the reflected-light palette black; use the paper-white fallback.
    if (channels.length > 3 && parseAlpha(channels[3]) <= 0.05) {
      return safeFallback.slice();
    }
    return [
      clamp(parseChannel(channels[0]) / 255, 0, 1),
      clamp(parseChannel(channels[1]) / 255, 0, 1),
      clamp(parseChannel(channels[2]) / 255, 0, 1)
    ];
  }

  // Exact critically-damped spring integration.  Unlike a simple lerp this
  // preserves momentum while the pointer is moving, then eases to rest with
  // no snap or overshoot when the pointer stops or leaves the hero.
  function criticallyDampedStep(position, target, velocity, response, deltaSeconds) {
    const omega = Math.max(0.1, response);
    const offset = position - target;
    const decay = Math.exp(-omega * deltaSeconds);
    const helper = velocity + omega * offset;
    return {
      position: target + (offset + helper * deltaSeconds) * decay,
      velocity: (velocity - omega * helper * deltaSeconds) * decay
    };
  }

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'Unknown shader compile error';
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  function createProgram(gl) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) || 'Unknown program link error';
      gl.deleteProgram(program);
      throw new Error(message);
    }
    return program;
  }

  class DifferenceTrailTexture {
    constructor(gl, options) {
      this.gl = gl;
      this.options = options;
      this.size = Math.round(clamp(numberOption(options.trailTextureSize, 1024), 256, 1024));
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.size;
      this.canvas.height = this.size;
      this.context = this.canvas.getContext('2d', { alpha: false });
      this.context.fillStyle = '#000';
      this.context.fillRect(0, 0, this.size, this.size);
      this.texture = gl.createTexture();
      this.lastPoint = null;
      this.lastTime = 0;
      this.energy = 0;
      this.aspect = 1;
      this.dirty = true;
      this.lastUploadTime = -Infinity;
      this.uploadInterval = 33;

      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        this.canvas
      );
    }

    setOptions(options) {
      this.options = options;
    }

    setAspect(aspect) {
      this.aspect = clamp(numberOption(aspect, 1), 0.5, 5);
    }

    resetPoint() {
      this.lastPoint = null;
    }

    paintStamp(x, y, force) {
      const context = this.context;
      const radius = clamp(numberOption(this.options.trailRadius, 0.095), 0.015, 0.25) * this.size;
      const intensity = clamp(numberOption(this.options.trailIntensity, 0.1), 0.01, 0.8);
      const alpha = clamp(intensity * (0.72 + force * 0.28), 0.01, 0.92);
      context.save();
      context.translate(x, y);
      context.scale(1 / this.aspect, 1);
      const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
      gradient.addColorStop(0.38, `rgba(255,255,255,${alpha * 0.82})`);
      gradient.addColorStop(0.76, `rgba(255,255,255,${alpha * 0.28})`);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      context.globalCompositeOperation = String(this.options.trailBlend || 'difference');
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
      this.energy = 1;
      this.dirty = true;
    }

    addPoint(pointer) {
      const point = {
        x: clamp(pointer[0], 0, 1) * this.size,
        y: clamp(pointer[1], 0, 1) * this.size
      };
      if (!this.lastPoint) {
        this.paintStamp(point.x, point.y, 1);
        this.lastPoint = point;
        return;
      }

      const dx = point.x - this.lastPoint.x;
      const dy = point.y - this.lastPoint.y;
      const distance = Math.hypot(dx, dy);
      const minForce = Math.max(0, numberOption(this.options.trailMinForce, 0.5));
      if (distance < minForce) return;

      const radius = clamp(numberOption(this.options.trailRadius, 0.095), 0.015, 0.25) * this.size;
      const steps = Math.max(1, Math.ceil(distance / Math.max(5, radius * 0.18)));
      const force = clamp(distance / Math.max(1, radius * 0.72), 0.5, 2.4);
      for (let step = 1; step <= steps; step += 1) {
        const amount = step / steps;
        this.paintStamp(
          this.lastPoint.x + dx * amount,
          this.lastPoint.y + dy * amount,
          force
        );
      }
      this.lastPoint = point;
    }

    fade(deltaMs) {
      if (this.energy <= 0.001 || deltaMs <= 0) return;
      const maxAge = Math.max(80, numberOption(this.options.trailMaxAge, 600));
      const fadeAlpha = clamp(1 - Math.exp((-deltaMs / maxAge) * 4.8), 0, 0.38);
      this.context.save();
      this.context.globalCompositeOperation = 'source-over';
      this.context.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
      this.context.fillRect(0, 0, this.size, this.size);
      this.context.restore();
      this.energy *= Math.exp((-deltaMs / maxAge) * 4.8);
      this.dirty = true;
    }

    update(pointer, time, active) {
      const deltaMs = this.lastTime > 0 ? clamp(time - this.lastTime, 0, 50) : 16.67;
      this.lastTime = time;
      this.fade(deltaMs);
      if (active) this.addPoint(pointer);
      else this.resetPoint();
      if (!this.dirty || time - this.lastUploadTime < this.uploadInterval) return;
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
      this.lastUploadTime = time;
      this.dirty = false;
    }

    isAlive() {
      return this.energy > 0.002;
    }

    destroy() {
      if (this.texture) this.gl.deleteTexture(this.texture);
      this.texture = null;
    }
  }

  function edt1d(source, length, output, sites, boundaries) {
    let k = 0;
    sites[0] = 0;
    boundaries[0] = -Infinity;
    boundaries[1] = Infinity;

    for (let q = 1; q < length; q += 1) {
      let separation = ((source[q] + q * q) -
        (source[sites[k]] + sites[k] * sites[k])) /
        (2 * q - 2 * sites[k]);
      while (separation <= boundaries[k]) {
        k -= 1;
        separation = ((source[q] + q * q) -
          (source[sites[k]] + sites[k] * sites[k])) /
          (2 * q - 2 * sites[k]);
      }
      k += 1;
      sites[k] = q;
      boundaries[k] = separation;
      boundaries[k + 1] = Infinity;
    }

    k = 0;
    for (let q = 0; q < length; q += 1) {
      while (boundaries[k + 1] < q) k += 1;
      const distance = q - sites[k];
      output[q] = distance * distance + source[sites[k]];
    }
  }

  function edt2d(grid, width, height) {
    const maxLength = Math.max(width, height);
    const source = new Float64Array(maxLength);
    const output = new Float64Array(maxLength);
    const sites = new Int32Array(maxLength);
    const boundaries = new Float64Array(maxLength + 1);
    const columnPass = new Float32Array(width * height);
    const result = new Float32Array(width * height);

    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < height; y += 1) source[y] = grid[y * width + x];
      edt1d(source, height, output, sites, boundaries);
      for (let y = 0; y < height; y += 1) columnPass[y * width + x] = output[y];
    }

    for (let y = 0; y < height; y += 1) {
      const offset = y * width;
      for (let x = 0; x < width; x += 1) source[x] = columnPass[offset + x];
      edt1d(source, width, output, sites, boundaries);
      for (let x = 0; x < width; x += 1) result[offset + x] = output[x];
    }

    return result;
  }

  function buildSignedDistanceField(alpha, width, height) {
    const far = 1e20;
    const toGlyph = new Float32Array(width * height);
    const toBackground = new Float32Array(width * height);

    for (let index = 0; index < alpha.length; index += 1) {
      const inside = alpha[index] >= 128;
      toGlyph[index] = inside ? 0 : far;
      toBackground[index] = inside ? far : 0;
    }

    const glyphDistance = edt2d(toGlyph, width, height);
    const backgroundDistance = edt2d(toBackground, width, height);
    const encoded = new Float32Array(width * height);
    const spread = Math.max(96, Math.min(360, Math.min(width, height) * 0.36));

    for (let index = 0; index < encoded.length; index += 1) {
      const inside = alpha[index] >= 128;
      let signedDistance = inside
        ? Math.sqrt(backgroundDistance[index])
        : -Math.sqrt(glyphDistance[index]);
      signedDistance += alpha[index] / 255 - 0.5;
      encoded[index] = clamp(0.5 + signedDistance / (spread * 2), 0, 1);
    }

    return encoded;
  }

  class SDFTitleEffect {
    constructor(title, options) {
      if (!(title instanceof HTMLElement)) throw new Error('SDFTitleEffect requires a title element.');

      this.title = title;
      this.options = Object.assign({}, DEFAULTS, options || {});
      this.pointerTarget = this.resolvePointerTarget(this.options.pointerTarget);
      this.lines = Array.from(title.querySelectorAll(this.options.lineSelector))
        .filter((line) => line instanceof HTMLElement && (line.textContent || '').trim());
      if (!this.lines.length) throw new Error('SDFTitleEffect could not find title lines.');
      this.textColor = parseCssColor(getComputedStyle(this.lines[0]).color);

      this.lines.forEach((line) => line.classList.add('sdf-title-source'));
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'sdf-title-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.canvas.dataset.sdfCanvasState = 'loading';
      // The interaction surface is the whole hero, not just the title box.
      // Keeping the canvas on pointerTarget lets pointer coordinates map to
      // empty regions while the rebuild still places the glyph at its source
      // line's measured position.
      const canvasHost = this.pointerTarget instanceof HTMLElement &&
        this.pointerTarget !== this.title
        ? this.pointerTarget
        : this.title;
      canvasHost.appendChild(this.canvas);

      this.currentPointer = [0.5, 0.5];
      this.targetPointer = [0.5, 0.5];
      this.previousPointer = [0.5, 0.5];
      this.pointerSpringVelocity = [0, 0];
      this.pointerVelocity = [0, 0];
      this.currentRadius = 0;
      this.targetRadius = 0;
      this.radiusSpringVelocity = 0;
      this.pointerInitialized = false;
      this.trailPointerActive = false;
      this.running = false;
      this.frame = 0;
      this.suspended = false;
      this.lastFrameTime = 0;
      this.lastRenderTime = 0;
      this.destroyed = false;
      this.rebuildTimer = 0;
      this.coarseReleaseTimer = 0;
      this.pointerLeaveTimer = 0;
      this.previewTimer = 0;
      this.lastScrollInputAt = 0;
      this.canvasRect = null;
      this.baseCanvasWidth = 0;
      this.baseCanvasHeight = 0;
      this.renderScale = 1;
      this.interactionPixelRatio = clamp(
        numberOption(this.options.interactionPixelRatio, 1),
        0.5,
        1
      );
      this.restoreRenderTimer = 0;
      this.canvas.dataset.sdfSuspended = 'false';
      this.isCoarsePointer = matchMedia('(hover: none), (pointer: coarse)').matches;

      if (this.options.respectReducedMotion && matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.canvas.dataset.sdfCanvasState = 'static';
        this.title.dataset.sdfState = 'static';
        return;
      }

      this.gl = this.canvas.getContext('webgl2', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance'
      });

      if (!this.gl) {
        this.canvas.dataset.sdfCanvasState = 'fallback';
        this.title.dataset.sdfState = 'fallback';
        return;
      }

      try {
        this.setupWebGL();
      } catch (error) {
        console.warn('SDF title WebGL setup failed:', error);
        this.title.dataset.sdfError = String(error && error.message ? error.message : error);
        this.canvas.dataset.sdfCanvasState = 'fallback';
        this.title.dataset.sdfState = 'fallback';
        return;
      }

      this.boundPointerEnter = (event) => this.onPointerEnter(event);
      this.boundPointerMove = (event) => this.onPointerMove(event);
      this.boundPointerLeave = (event) => this.onPointerLeave(event);
      this.boundPointerDown = (event) => this.onPointerDown(event);
      this.boundResize = () => this.scheduleRebuild();
      this.boundScrollActivity = () => {
        this.lastScrollInputAt = performance.now();
      };
      this.boundContextLost = (event) => {
        event.preventDefault();
        this.canvas.dataset.sdfCanvasState = 'fallback';
        this.title.dataset.sdfState = 'fallback';
      };

      this.pointerTarget.addEventListener('pointerenter', this.boundPointerEnter, { passive: true });
      this.pointerTarget.addEventListener('pointermove', this.boundPointerMove, { passive: true });
      this.pointerTarget.addEventListener('pointerleave', this.boundPointerLeave, { passive: true });
      this.pointerTarget.addEventListener('pointerdown', this.boundPointerDown, { passive: true });
      // Capture wheel/scroll before the browser re-hit-tests a stationary
      // pointer. That re-hit-test can emit pointerleave one event before the
      // site's bubble-phase scroll listener adds its debounce class.
      window.addEventListener('wheel', this.boundScrollActivity, { passive: true, capture: true });
      window.addEventListener('scroll', this.boundScrollActivity, { passive: true, capture: true });
      this.canvas.addEventListener('webglcontextlost', this.boundContextLost, false);
      window.addEventListener('resize', this.boundResize, { passive: true });

      this.title.dataset.sdfState = 'loading';
      const fontReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      fontReady.then(() => this.rebuild()).catch(() => this.rebuild());
    }

    resolvePointerTarget(target) {
      if (typeof target === 'string') return document.querySelector(target) || this.title;
      return target && typeof target.addEventListener === 'function' ? target : this.title;
    }

    isTouchEvent(event) {
      return event && event.pointerType === 'touch';
    }

    setupWebGL() {
      const gl = this.gl;
      this.program = createProgram(gl);
      this.vao = gl.createVertexArray();
      this.texture = gl.createTexture();
      this.trail = new DifferenceTrailTexture(gl, this.options);

      gl.bindVertexArray(this.vao);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      this.useFloatSdf = Boolean(gl.getExtension('OES_texture_float_linear'));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

      this.uniforms = {
        sdf: gl.getUniformLocation(this.program, 'uSdf'),
        trail: gl.getUniformLocation(this.program, 'uTrail'),
        pointer: gl.getUniformLocation(this.program, 'uPointer'),
        pointerVelocity: gl.getUniformLocation(this.program, 'uPointerVelocity'),
        resolution: gl.getUniformLocation(this.program, 'uResolution'),
        time: gl.getUniformLocation(this.program, 'uTime'),
        radius: gl.getUniformLocation(this.program, 'uRadius'),
        strength: gl.getUniformLocation(this.program, 'uStrength'),
        deformation: gl.getUniformLocation(this.program, 'uDeformation'),
        sdfBias: gl.getUniformLocation(this.program, 'uSdfBias'),
        blurSoftness: gl.getUniformLocation(this.program, 'uBlurSoftness'),
        dispersion: gl.getUniformLocation(this.program, 'uDispersion'),
        chromaIntensity: gl.getUniformLocation(this.program, 'uChromaIntensity'),
        grainStrength: gl.getUniformLocation(this.program, 'uGrainStrength'),
        trailInfluence: gl.getUniformLocation(this.program, 'uTrailInfluence'),
        filmGrain: gl.getUniformLocation(this.program, 'uFilmGrain'),
        uvDisplacement: gl.getUniformLocation(this.program, 'uUvDisplacement'),
        morphAmount: gl.getUniformLocation(this.program, 'uMorphAmount'),
        chromaticMode: gl.getUniformLocation(this.program, 'uChromaticMode'),
        chromaticSpread: gl.getUniformLocation(this.program, 'uChromaticSpread'),
        followStrength: gl.getUniformLocation(this.program, 'uFollowStrength'),
        filmTransition: gl.getUniformLocation(this.program, 'uFilmTransition'),
        centerSteer: gl.getUniformLocation(this.program, 'uCenterSteer'),
        centerRange: gl.getUniformLocation(this.program, 'uCenterRange'),
        centerFeather: gl.getUniformLocation(this.program, 'uCenterFeather'),
        centerResponse: gl.getUniformLocation(this.program, 'uCenterResponse'),
        causticOnset: gl.getUniformLocation(this.program, 'uCausticOnset'),
        causticIntensity: gl.getUniformLocation(this.program, 'uCausticIntensity'),
        causticColorLink: gl.getUniformLocation(this.program, 'uCausticColorLink'),
        positionColorFlow: gl.getUniformLocation(this.program, 'uPositionColorFlow'),
        fontLightDominance: gl.getUniformLocation(this.program, 'uFontLightDominance'),
        intercolorMix: gl.getUniformLocation(this.program, 'uIntercolorMix'),
        projectionLength: gl.getUniformLocation(this.program, 'uProjectionLength'),
        projectionBrightness: gl.getUniformLocation(this.program, 'uProjectionBrightness'),
        projectionFalloff: gl.getUniformLocation(this.program, 'uProjectionFalloff'),
        projectionHue: gl.getUniformLocation(this.program, 'uProjectionHue'),
        textColor: gl.getUniformLocation(this.program, 'uTextColor')
      };
    }

    scheduleRebuild() {
      if (this.destroyed || !this.gl) return;
      this.canvasRect = null;
      clearTimeout(this.rebuildTimer);
      this.rebuildTimer = window.setTimeout(() => this.rebuild(), 120);
    }

    applyRenderScale() {
      if (this.destroyed || !this.gl || !this.baseCanvasWidth || !this.baseCanvasHeight) return;
      const scale = clamp(numberOption(this.renderScale, 1), 0.5, 1);
      const width = Math.max(2, Math.round(this.baseCanvasWidth * scale));
      const height = Math.max(2, Math.round(this.baseCanvasHeight * scale));
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
      }
      this.gl.viewport(0, 0, width, height);
      this.canvas.dataset.sdfRenderScale = String(Number(scale.toFixed(2)));
      this.lastRenderTime = 0;
    }

    setInteractionQuality(active) {
      if (this.destroyed || !this.gl) return;
      clearTimeout(this.restoreRenderTimer);
      if (active) {
        const nextScale = this.interactionPixelRatio;
        if (Math.abs(this.renderScale - nextScale) > 0.001) {
          this.renderScale = nextScale;
          this.applyRenderScale();
        }
      } else {
        if (this.renderScale >= 0.999) return;
        this.restoreRenderTimer = window.setTimeout(() => {
          this.restoreRenderTimer = 0;
          if (this.destroyed) return;
          this.renderScale = 1;
          this.applyRenderScale();
        }, 180);
      }
    }

    rebuild() {
      if (this.destroyed || !this.gl) return;
      const canvasRect = this.canvas.getBoundingClientRect();
      if (canvasRect.width < 2 || canvasRect.height < 2) return;

      const requestedScale = clamp(Number(this.options.texturePixelRatio) || 3, 0.75, 3.0);
      const widthLimitScale = (Number(this.options.maxTextureWidth) || 1120) / canvasRect.width;
      const scale = Math.max(0.55, Math.min(requestedScale, widthLimitScale));
      const width = Math.max(2, Math.round(canvasRect.width * scale));
      const height = Math.max(2, Math.round(canvasRect.height * scale));

      this.baseCanvasWidth = width;
      this.baseCanvasHeight = height;
      this.canvas.width = width;
      this.canvas.height = height;
      this.canvasRect = {
        left: canvasRect.left,
        top: canvasRect.top,
        width: canvasRect.width,
        height: canvasRect.height
      };
      if (this.trail) this.trail.setAspect(width / Math.max(1, height));

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const context = maskCanvas.getContext('2d', { willReadFrequently: true });
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#fff';
      context.textAlign = 'left';
      context.textBaseline = 'middle';
      this.textColor = parseCssColor(getComputedStyle(this.lines[0]).color, this.textColor);

      const lineRects = this.lines.map((line) => line.getBoundingClientRect());
      this.lines.forEach((line, lineIndex) => {
        const lineRect = lineRects[lineIndex];
        const style = getComputedStyle(line);
        const fontSize = parseFloat(style.fontSize) || 120;
        const fontStyle = style.fontStyle && style.fontStyle !== 'normal' ? style.fontStyle + ' ' : '';
        const fontWeight = style.fontWeight || '800';
        context.font = fontStyle + fontWeight + ' ' + (fontSize * scale) + 'px ' + style.fontFamily;
        const parsedLetterSpacing = style.letterSpacing !== 'normal'
          ? parseFloat(style.letterSpacing)
          : 0;
        const letterSpacing = Number.isFinite(parsedLetterSpacing)
          ? parsedLetterSpacing * scale
          : 0;
        if ('letterSpacing' in context) context.letterSpacing = '0px';
        const centerX = this.options.centerLines
          ? width * 0.5
          : (lineRect.left + lineRect.width * 0.5 - canvasRect.left) * scale;
        const y = (lineRect.top + lineRect.height * 0.5 - canvasRect.top) * scale;
        const glyphs = Array.from((line.textContent || '').trim());
        const advances = glyphs.map((glyph) => context.measureText(glyph).width);
        const textWidth = advances.reduce((total, advance) => total + advance, 0) +
          Math.max(0, glyphs.length - 1) * letterSpacing;
        let cursorX = centerX - textWidth * 0.5;
        glyphs.forEach((glyph, index) => {
          context.fillText(glyph, cursorX, y);
          cursorX += advances[index] + letterSpacing;
        });
      });

      const pixels = context.getImageData(0, 0, width, height).data;
      const alpha = new Uint8Array(width * height);
      for (let sourceIndex = 3, targetIndex = 0; sourceIndex < pixels.length; sourceIndex += 4) {
        alpha[targetIndex] = pixels[sourceIndex];
        targetIndex += 1;
      }

      const sdf = buildSignedDistanceField(alpha, width, height);
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      if (this.useFloatSdf) {
        for (let attempt = 0; attempt < 8; attempt += 1) {
          if (gl.getError() === gl.NO_ERROR) break;
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, width, height, 0, gl.RED, gl.FLOAT, sdf);
        if (gl.getError() !== gl.NO_ERROR) this.useFloatSdf = false;
      }
      if (!this.useFloatSdf) {
        const sdf8 = new Uint8Array(sdf.length);
        for (let index = 0; index < sdf.length; index += 1) {
          sdf8[index] = Math.round(sdf[index] * 255);
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, width, height, 0, gl.RED, gl.UNSIGNED_BYTE, sdf8);
      }
      this.title.dataset.sdfPrecision = this.useFloatSdf ? 'float16' : 'unorm8';
      gl.viewport(0, 0, width, height);
      this.applyRenderScale();
      this.canvas.dataset.sdfCanvasState = 'ready';
      this.title.dataset.sdfState = 'ready';
      this.render(performance.now());
      this.title.dispatchEvent(new CustomEvent('sdf:rebuild-complete', {
        detail: { width, height, precision: this.title.dataset.sdfPrecision }
      }));
    }

    pointerFromEvent(event) {
      if (!this.canvasRect || !this.canvasRect.width || !this.canvasRect.height) {
        const rect = this.canvas.getBoundingClientRect();
        this.canvasRect = {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        };
      }
      const rect = this.canvasRect;
      return [
        clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1),
        // The fragment shader samples the uploaded canvas texture in
        // top-origin UV space (vUv.y is flipped there). Keep pointer Y in the
        // same space so the lens follows the hand instead of mirroring it.
        clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1)
      ];
    }

    updateSourceMask() {
      this.title.dataset.sdfActive = 'true';
    }

    clearSourceMask() {
      delete this.title.dataset.sdfActive;
    }

    initializePointerAtTarget() {
      if (this.pointerInitialized) return false;
      this.currentPointer = this.targetPointer.slice();
      this.previousPointer = this.targetPointer.slice();
      this.pointerSpringVelocity = [0, 0];
      this.pointerVelocity = [0, 0];
      this.pointerInitialized = true;
      return true;
    }

    onPointerEnter(event) {
      if (this.isTouchEvent(event)) return;
      clearTimeout(this.pointerLeaveTimer);
      this.pointerLeaveTimer = 0;
      clearTimeout(this.previewTimer);
      this.targetPointer = this.pointerFromEvent(event);
      this.targetRadius = clamp(numberOption(this.options.lensRadius, 0.25), 0, 1);
      this.setInteractionQuality(true);
      this.trailPointerActive = true;
      if (this.initializePointerAtTarget()) {
        this.currentRadius = this.targetRadius * 0.55;
      }
      this.updateSourceMask(event);
      this.start();
    }

    onPointerMove(event) {
      if (this.isTouchEvent(event)) return;
      clearTimeout(this.pointerLeaveTimer);
      this.pointerLeaveTimer = 0;
      clearTimeout(this.previewTimer);
      this.targetPointer = this.pointerFromEvent(event);
      this.targetRadius = clamp(numberOption(this.options.lensRadius, 0.25), 0, 1);
      this.setInteractionQuality(true);
      this.trailPointerActive = true;
      this.updateSourceMask(event);
      this.start();
    }

    onPointerLeave(event) {
      if (this.isTouchEvent(event)) return;
      clearTimeout(this.pointerLeaveTimer);
      this.pointerLeaveTimer = 0;
      const release = () => {
        if (this.destroyed) return;
        this.targetRadius = 0;
        this.setInteractionQuality(false);
        this.trailPointerActive = false;
        this.clearSourceMask();
        this.start();
      };
      // Scrolling moves the Hero out from under a stationary pointer and
      // briefly emits pointerleave before the Hero returns on the way back.
      // Keep the lens/trail alive through that compositor hand-off so the
      // title never blanks for one or two frames during the reverse scroll.
      const root = document.documentElement;
      const recentScroll = performance.now() - this.lastScrollInputAt < 320;
      if (recentScroll || root && root.classList.contains('polish-hover-sync-scrolling')) {
        const releaseWhenIdle = () => {
          if (this.destroyed) return;
          if (document.documentElement.classList.contains('polish-hover-sync-scrolling')) {
            this.pointerLeaveTimer = window.setTimeout(releaseWhenIdle, 80);
            return;
          }
          this.pointerLeaveTimer = 0;
          release();
        };
        this.pointerLeaveTimer = window.setTimeout(releaseWhenIdle, 240);
        return;
      }
      release();
    }

    onPointerDown(event) {
      clearTimeout(this.pointerLeaveTimer);
      this.pointerLeaveTimer = 0;
      clearTimeout(this.previewTimer);
      this.targetPointer = this.pointerFromEvent(event);
      this.targetRadius = clamp(numberOption(this.options.lensRadius, 0.25), 0, 1);
      this.setInteractionQuality(true);
      this.trailPointerActive = true;
      if (this.initializePointerAtTarget()) {
        this.currentRadius = this.targetRadius * 0.55;
      }
      this.updateSourceMask(event);
      clearTimeout(this.coarseReleaseTimer);
      if (this.isTouchEvent(event)) {
        this.coarseReleaseTimer = window.setTimeout(() => {
          this.targetRadius = 0;
          this.setInteractionQuality(false);
          this.trailPointerActive = false;
          this.clearSourceMask();
          this.start();
        }, Math.max(0, numberOption(this.options.coarsePointerHoldMs, 640)));
      }
      this.start();
    }

    start() {
      if (this.running || this.suspended || this.destroyed || !this.gl) return;
      this.running = true;
      this.lastFrameTime = 0;
      this.lastRenderTime = 0;
      this.frame = requestAnimationFrame((time) => this.tick(time));
    }

    setSuspended(suspended) {
      this.suspended = Boolean(suspended);
      this.canvas.dataset.sdfSuspended = this.suspended ? 'true' : 'false';
      if (this.suspended) {
        if (this.frame) cancelAnimationFrame(this.frame);
        this.frame = 0;
        this.running = false;
        this.lastFrameTime = 0;
        this.lastRenderTime = 0;
        this.pointerVelocity[0] = 0;
        this.pointerVelocity[1] = 0;
        if (this.trail) this.trail.resetPoint();
      } else if (this.trailPointerActive || this.currentRadius > 0.001 || (this.trail && this.trail.isAlive())) {
        this.start();
      }
      return this;
    }

    tick(time) {
      this.frame = 0;
      if (this.suspended) {
        this.running = false;
        return;
      }
      if (this.destroyed || !this.gl) {
        this.running = false;
        return;
      }

      const deltaSeconds = this.lastFrameTime > 0
        ? clamp((time - this.lastFrameTime) / 1000, 1 / 240, 0.05)
        : 1 / 60;
      this.lastFrameTime = time;
      const pointerFollow = clamp(
        numberOption(this.options.followDamping, numberOption(this.options.pointerFollow, 14.1)),
        0.1,
        40
      );
      const radiusFollow = clamp(numberOption(this.options.radiusFollow, 20), 0.1, 40);
      const isRecovering = this.targetRadius <= 0.0001;
      const recoveryRadiusFollow = clamp(
        numberOption(this.options.recoveryRadiusFollow, 8.6),
        0.1,
        40
      );
      const recoveryVelocityDamping = clamp(
        numberOption(this.options.recoveryVelocityDamping, 7.2),
        0.8,
        30
      );
      const previousX = this.currentPointer[0];
      const previousY = this.currentPointer[1];
      const pointerResponse = pointerFollow * 1.18;
      const pointerX = criticallyDampedStep(
        this.currentPointer[0],
        this.targetPointer[0],
        this.pointerSpringVelocity[0],
        pointerResponse,
        deltaSeconds
      );
      const pointerY = criticallyDampedStep(
        this.currentPointer[1],
        this.targetPointer[1],
        this.pointerSpringVelocity[1],
        pointerResponse,
        deltaSeconds
      );
      this.currentPointer[0] = clamp(pointerX.position, 0, 1);
      this.currentPointer[1] = clamp(pointerY.position, 0, 1);
      this.pointerSpringVelocity[0] = pointerX.velocity;
      this.pointerSpringVelocity[1] = pointerY.velocity;
      const radiusResponse = isRecovering ? recoveryRadiusFollow : radiusFollow;
      const radiusStep = criticallyDampedStep(
        this.currentRadius,
        this.targetRadius,
        this.radiusSpringVelocity,
        radiusResponse,
        deltaSeconds
      );
      this.currentRadius = clamp(radiusStep.position, 0, 1);
      this.radiusSpringVelocity = radiusStep.velocity;

      const velocityDamping = isRecovering
        ? recoveryVelocityDamping
        : clamp(pointerFollow * 0.72, 1.2, 30);
      const velocityBlend = 1 - Math.exp(-velocityDamping * deltaSeconds);
      const rawVelocity = [
        clamp((this.currentPointer[0] - previousX) / Math.max(deltaSeconds, 1 / 240), -0.14, 0.14),
        clamp((this.currentPointer[1] - previousY) / Math.max(deltaSeconds, 1 / 240), -0.14, 0.14)
      ];
      this.pointerVelocity[0] += (rawVelocity[0] - this.pointerVelocity[0]) * velocityBlend;
      this.pointerVelocity[1] += (rawVelocity[1] - this.pointerVelocity[1]) * velocityBlend;
      this.previousPointer[0] = this.currentPointer[0];
      this.previousPointer[1] = this.currentPointer[1];

      /* Pace the expensive full-screen pass to the Hero's shared 24fps
         cadence.  Pointer physics can continue sampling at display refresh
         rate, while visible SDF frames land on predictable compositor slots. */
      const shouldRender = !this.lastRenderTime ||
        time - this.lastRenderTime >= HERO_FRAME_INTERVAL;
      if (shouldRender) {
        const previousRenderTime = this.lastRenderTime;
        if (this.trail) {
          this.trail.update(this.currentPointer, time, this.trailPointerActive);
        }
        this.render(time);
        /* Preserve the fractional remainder instead of resetting the clock to
           the current rAF. This alternates two- and three-vsync gaps on 60Hz
           displays and averages to 24fps instead of collapsing to 20fps. */
        this.lastRenderTime = previousRenderTime
          ? time - ((time - previousRenderTime) % HERO_FRAME_INTERVAL)
          : time;
      }

      const pointerDelta = Math.abs(this.targetPointer[0] - this.currentPointer[0]) +
        Math.abs(this.targetPointer[1] - this.currentPointer[1]);
      const radiusDelta = Math.abs(this.targetRadius - this.currentRadius);
      const springVelocity = Math.abs(this.pointerSpringVelocity[0]) +
        Math.abs(this.pointerSpringVelocity[1]);
      const needsNextFrame = pointerDelta > 0.00015 || radiusDelta > 0.00015 ||
        springVelocity > 0.0002 || Math.abs(this.radiusSpringVelocity) > 0.0002 ||
        this.currentRadius > 0.001 || (this.trail && this.trail.isAlive());

      if (needsNextFrame) {
        this.frame = requestAnimationFrame((nextTime) => this.tick(nextTime));
      } else {
        this.running = false;
      }
    }

    render(time) {
      if (!this.gl || !this.program || !this.canvas.width || !this.canvas.height) return;
      const gl = this.gl;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(this.program);
      gl.bindVertexArray(this.vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(this.uniforms.sdf, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.trail ? this.trail.texture : null);
      gl.uniform1i(this.uniforms.trail, 1);
      gl.uniform2f(this.uniforms.pointer, this.currentPointer[0], this.currentPointer[1]);
      gl.uniform2f(this.uniforms.pointerVelocity, this.pointerVelocity[0], this.pointerVelocity[1]);
      gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
      gl.uniform1f(this.uniforms.time, time * 0.001);
      gl.uniform1f(this.uniforms.radius, this.currentRadius);
      gl.uniform1f(this.uniforms.strength, Math.max(0, numberOption(this.options.strength, 1)));
      gl.uniform1f(this.uniforms.deformation, Math.max(0, numberOption(this.options.deformation, 0.1)));
      gl.uniform1f(this.uniforms.sdfBias, numberOption(this.options.sdfBias, 0.04));
      gl.uniform1f(this.uniforms.blurSoftness, Math.max(0, numberOption(this.options.blurSoftness, 0.06)));
      gl.uniform1f(this.uniforms.dispersion, Math.max(0, numberOption(this.options.dispersion, 3.75)));
      gl.uniform1f(this.uniforms.chromaIntensity, Math.max(0, numberOption(this.options.chromaIntensity, 1)));
      gl.uniform1f(this.uniforms.grainStrength, Math.max(0, numberOption(this.options.grainStrength, 2)));
      gl.uniform1f(this.uniforms.trailInfluence, Math.max(0, numberOption(this.options.trailInfluence, 1)));
      gl.uniform1f(this.uniforms.filmGrain, Math.max(0, numberOption(this.options.filmGrain, 0.92)));
      gl.uniform1f(this.uniforms.uvDisplacement, Math.max(0, numberOption(this.options.uvDisplacement, 18)));
      gl.uniform1f(this.uniforms.morphAmount, Math.max(0, numberOption(this.options.morphAmount, 0)));
      gl.uniform1f(this.uniforms.chromaticMode, Math.max(0, numberOption(this.options.chromaticMode, 0.22)));
      gl.uniform1f(this.uniforms.chromaticSpread, Math.max(0, numberOption(this.options.chromaticSpread, 1)));
      gl.uniform1f(this.uniforms.followStrength, Math.max(0, numberOption(this.options.followStrength, 0.62)));
      gl.uniform1f(this.uniforms.filmTransition, clamp(numberOption(this.options.filmTransition, 0.82), 0, 1));
      gl.uniform1f(this.uniforms.centerSteer, clamp(numberOption(this.options.centerSteer, 0.55), 0, 1));
      gl.uniform1f(this.uniforms.centerRange, clamp(numberOption(this.options.centerRange, 0.34), 0.08, 0.62));
      gl.uniform1f(this.uniforms.centerFeather, clamp(numberOption(this.options.centerFeather, 0.14), 0.01, 0.30));
      gl.uniform1f(this.uniforms.centerResponse, clamp(numberOption(this.options.centerResponse, 0.62), 0, 1));
      gl.uniform1f(this.uniforms.causticOnset, clamp(numberOption(this.options.causticOnset, 0.18), 0, 1));
      gl.uniform1f(this.uniforms.causticIntensity, clamp(numberOption(this.options.causticIntensity, 1.25), 0, 2));
      gl.uniform1f(this.uniforms.causticColorLink, clamp(numberOption(this.options.causticColorLink, 0.72), 0, 1));
      gl.uniform1f(this.uniforms.positionColorFlow, clamp(numberOption(this.options.positionColorFlow, 0.92), 0, 1));
      gl.uniform1f(this.uniforms.fontLightDominance, clamp(numberOption(this.options.fontLightDominance, 0.84), 0, 1));
      gl.uniform1f(this.uniforms.intercolorMix, clamp(numberOption(this.options.intercolorMix, 0.94), 0, 1));
      gl.uniform1f(this.uniforms.projectionLength, clamp(numberOption(this.options.projectionLength, 1), 0.55, 1.45));
      gl.uniform1f(this.uniforms.projectionBrightness, clamp(numberOption(this.options.projectionBrightness, 1), 0, 4));
      gl.uniform1f(this.uniforms.projectionFalloff, clamp(numberOption(this.options.projectionFalloff, 1.65), 0.45, 3));
      gl.uniform1f(this.uniforms.projectionHue, clamp(numberOption(this.options.projectionHue, 0.22), 0, 1));
      const textColor = Array.isArray(this.textColor) ? this.textColor : [0.94, 0.937, 0.914];
      gl.uniform3f(this.uniforms.textColor, textColor[0], textColor[1], textColor[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    setPointer(x, y, active) {
      if (this.destroyed || !this.gl) return this;
      clearTimeout(this.previewTimer);
      const isActive = active !== false;
      this.targetPointer = [
        clamp(numberOption(x, 0.5), 0, 1),
        clamp(numberOption(y, 0.5), 0, 1)
      ];
      this.targetRadius = isActive
        ? clamp(numberOption(this.options.lensRadius, 0.12), 0, 1)
        : 0;
      this.trailPointerActive = isActive;
      if (isActive) this.updateSourceMask();
      else this.clearSourceMask();
      if (isActive && this.initializePointerAtTarget()) {
        this.currentRadius = this.targetRadius * 0.55;
      }
      this.start();
      return this;
    }

    previewAt(x, y, duration) {
      if (this.destroyed || !this.gl) return this;
      clearTimeout(this.previewTimer);
      this.targetPointer = [
        clamp(numberOption(x, 0.5), 0, 1),
        clamp(numberOption(y, 0.5), 0, 1)
      ];
      this.targetRadius = clamp(numberOption(this.options.lensRadius, 0.12), 0, 1);
      this.trailPointerActive = true;
      if (this.initializePointerAtTarget()) {
        this.currentRadius = this.targetRadius * 0.55;
      }
      this.updateSourceMask();
      this.start();
      this.previewTimer = window.setTimeout(() => {
        this.targetRadius = 0;
        this.trailPointerActive = false;
        this.clearSourceMask();
        this.start();
      }, Math.max(120, numberOption(duration, 900)));
      return this;
    }

    setOptions(nextOptions, settings) {
      if (this.destroyed || !nextOptions || typeof nextOptions !== 'object') return this;
      const previousTextureRatio = this.options.texturePixelRatio;
      const previousMaxTextureWidth = this.options.maxTextureWidth;
      Object.assign(this.options, nextOptions);
      if (this.trail) this.trail.setOptions(this.options);

      if (Object.prototype.hasOwnProperty.call(nextOptions, 'lensRadius') && this.targetRadius > 0) {
        this.targetRadius = clamp(numberOption(this.options.lensRadius, 0.12), 0, 1);
      }

      const rebuildRequested = Boolean(settings && settings.rebuild) ||
        previousTextureRatio !== this.options.texturePixelRatio ||
        previousMaxTextureWidth !== this.options.maxTextureWidth;
      if (rebuildRequested) this.scheduleRebuild();
      else {
        this.render(performance.now());
        this.start();
      }
      this.title.dispatchEvent(new CustomEvent('sdf:options-change', {
        detail: { options: this.getOptions(), rebuild: rebuildRequested }
      }));
      return this;
    }

    getOptions() {
      return Object.assign({}, this.options);
    }

    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = 0;
      clearTimeout(this.rebuildTimer);
      clearTimeout(this.coarseReleaseTimer);
      clearTimeout(this.pointerLeaveTimer);
      clearTimeout(this.previewTimer);
      clearTimeout(this.restoreRenderTimer);
      if (this.boundPointerEnter) {
        this.pointerTarget.removeEventListener('pointerenter', this.boundPointerEnter);
        this.pointerTarget.removeEventListener('pointermove', this.boundPointerMove);
        this.pointerTarget.removeEventListener('pointerleave', this.boundPointerLeave);
        this.pointerTarget.removeEventListener('pointerdown', this.boundPointerDown);
        window.removeEventListener('wheel', this.boundScrollActivity, true);
        window.removeEventListener('scroll', this.boundScrollActivity, true);
        this.canvas.removeEventListener('webglcontextlost', this.boundContextLost);
        window.removeEventListener('resize', this.boundResize);
      }
      if (this.gl) {
        if (this.trail) this.trail.destroy();
        if (this.texture) this.gl.deleteTexture(this.texture);
        if (this.vao) this.gl.deleteVertexArray(this.vao);
        if (this.program) this.gl.deleteProgram(this.program);
      }
      this.lines.forEach((line) => line.classList.remove('sdf-title-source'));
      this.lines.forEach((line) => {
        line.style.removeProperty('--sdf-hole-x');
        line.style.removeProperty('--sdf-hole-y');
        line.style.removeProperty('--sdf-hole-radius');
      });
      this.canvas.remove();
      delete this.title.dataset.sdfState;
      delete this.title.dataset.sdfActive;
      delete this.title.dataset.sdfPrecision;
      delete this.canvas.dataset.sdfCanvasState;
    }

    static mount(title, options) {
      return new SDFTitleEffect(title, options);
    }
  }

  window.SDFTitleEffect = SDFTitleEffect;
})();
