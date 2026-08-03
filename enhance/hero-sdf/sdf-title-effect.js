(function () {
  'use strict';

  const DEFAULTS = {
    lineSelector: '[data-sdf-line], .polish-title-word',
    pointerTarget: null,
    centerLines: false,
    lensRadius: 0.12,
    strength: 1,
    deformation: 0.1,
    sdfBias: 0.04,
    blurSoftness: 0.06,
    dispersion: 3.75,
    chromaIntensity: 1,
    grainStrength: 2,
    pointerFollow: 14.1,
    radiusFollow: 20,
    maxTextureWidth: 5120,
    texturePixelRatio: 3,
    coarsePointerHoldMs: 640,
    respectReducedMotion: true
  };

  const VERTEX_SHADER = `#version 300 es
    precision highp float;
    out vec2 vUv;

    void main() {
      vec2 position = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
      vUv = position;
      gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
    }
  `;

  const FRAGMENT_SHADER = `#version 300 es
    precision highp float;

    uniform sampler2D uSdf;
    uniform vec2 uPointer;
    uniform vec2 uResolution;
    uniform float uRadius;
    uniform float uStrength;
    uniform float uDeformation;
    uniform float uSdfBias;
    uniform float uBlurSoftness;
    uniform float uDispersion;
    uniform float uChromaIntensity;
    uniform float uGrainStrength;

    in vec2 vUv;
    out vec4 outColor;

    float readSdf(vec2 uv) {
      return texture(uSdf, clamp(uv, vec2(0.0), vec2(1.0))).r - 0.5;
    }

    float fillAlpha(float sdf, float softness) {
      return smoothstep(-softness, softness, sdf);
    }

    float chromaBlur(vec2 uv, vec2 tangentStep, float bias, float softness) {
      float alpha = fillAlpha(readSdf(uv) + bias, softness) * 0.5;
      alpha += fillAlpha(readSdf(uv + tangentStep) + bias, softness) * 0.25;
      alpha += fillAlpha(readSdf(uv - tangentStep) + bias, softness) * 0.25;
      return alpha;
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
      float blurField = pow(mouseField, 0.72);

      vec2 pullUv = uPointer - vec2(0.5);
      float deformation = pow(mouseField, 1.6) * uDeformation * uStrength;
      vec2 warpedUv = uv - pullUv * deformation;
      float sdfBias = pow(mouseField, 1.1) * uSdfBias * uStrength;
      float sdf = readSdf(warpedUv) + sdfBias;
      float aa = max(fwidth(sdf) * 1.2, 0.0021);
      vec2 texel = 1.0 / max(uResolution, vec2(1.0));

      // Continuous analytic SDF blur: no sparse tap copies or layer boundary.
      float blurSoftness = mix(aa, max(aa, uBlurSoftness * uStrength), blurField);
      float softAlpha = fillAlpha(sdf, blurSoftness);

      // A stable optical axis puts anaglyph red and cyan on opposite sides.
      // Like Creatura, separation grows away from the optical center. Fade it
      // out at the end of the lens so no colored ring survives outside it.
      vec2 spectralAxis = normalize(vec2(1.0, 0.18));
      float opticalEdge = pow(clamp(normalizedDistance, 0.0, 1.0), 0.7);
      float chromaPresence = smoothstep(0.0, 0.38, mouseField);
      float dispersion = mix(uDispersion * 0.0666667, uDispersion, opticalEdge) *
                         chromaPresence * uStrength;
      vec2 spectralOffset = spectralAxis * texel * dispersion;
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
      float glyphEdge = 1.0 - smoothstep(0.52, 0.96, softAlpha);
      float radialTint = mix(0.005, 0.18, opticalEdge);
      float tintStrength = smoothstep(0.008, 0.08, spectralDifference) *
                           chromaPresence * glyphEdge * radialTint * uChromaIntensity;
      vec3 dispersedLight = mix(
        vec3(softAlpha),
        fringeTint * softAlpha,
        clamp(tintStrength, 0.0, 1.0)
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
      float grain = (dither * 0.68 + fineNoise * 0.32) * mouseField *
                    softEdgeBand * uGrainStrength / 255.0;
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

      this.lines.forEach((line) => line.classList.add('sdf-title-source'));
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'sdf-title-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.title.appendChild(this.canvas);

      this.currentPointer = [0.5, 0.5];
      this.targetPointer = [0.5, 0.5];
      this.currentRadius = 0;
      this.targetRadius = 0;
      this.running = false;
      this.lastFrameTime = 0;
      this.destroyed = false;
      this.rebuildTimer = 0;
      this.coarseReleaseTimer = 0;
      this.previewTimer = 0;
      this.isCoarsePointer = matchMedia('(hover: none), (pointer: coarse)').matches;

      if (this.options.respectReducedMotion && matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
        this.title.dataset.sdfState = 'fallback';
        return;
      }

      try {
        this.setupWebGL();
      } catch (error) {
        console.warn('SDF title WebGL setup failed:', error);
        this.title.dataset.sdfState = 'fallback';
        return;
      }

      this.boundPointerEnter = (event) => this.onPointerEnter(event);
      this.boundPointerMove = (event) => this.onPointerMove(event);
      this.boundPointerLeave = (event) => this.onPointerLeave(event);
      this.boundPointerDown = (event) => this.onPointerDown(event);
      this.boundResize = () => this.scheduleRebuild();
      this.boundContextLost = (event) => {
        event.preventDefault();
        this.title.dataset.sdfState = 'fallback';
      };

      this.pointerTarget.addEventListener('pointerenter', this.boundPointerEnter, { passive: true });
      this.pointerTarget.addEventListener('pointermove', this.boundPointerMove, { passive: true });
      this.pointerTarget.addEventListener('pointerleave', this.boundPointerLeave, { passive: true });
      this.pointerTarget.addEventListener('pointerdown', this.boundPointerDown, { passive: true });
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
        pointer: gl.getUniformLocation(this.program, 'uPointer'),
        resolution: gl.getUniformLocation(this.program, 'uResolution'),
        radius: gl.getUniformLocation(this.program, 'uRadius'),
        strength: gl.getUniformLocation(this.program, 'uStrength'),
        deformation: gl.getUniformLocation(this.program, 'uDeformation'),
        sdfBias: gl.getUniformLocation(this.program, 'uSdfBias'),
        blurSoftness: gl.getUniformLocation(this.program, 'uBlurSoftness'),
        dispersion: gl.getUniformLocation(this.program, 'uDispersion'),
        chromaIntensity: gl.getUniformLocation(this.program, 'uChromaIntensity'),
        grainStrength: gl.getUniformLocation(this.program, 'uGrainStrength')
      };
    }

    scheduleRebuild() {
      if (this.destroyed || !this.gl) return;
      clearTimeout(this.rebuildTimer);
      this.rebuildTimer = window.setTimeout(() => this.rebuild(), 120);
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

      this.canvas.width = width;
      this.canvas.height = height;

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const context = maskCanvas.getContext('2d', { willReadFrequently: true });
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#fff';
      context.textAlign = 'left';
      context.textBaseline = 'middle';

      this.lines.forEach((line) => {
        const lineRect = line.getBoundingClientRect();
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
      this.title.dataset.sdfState = 'ready';
      this.render(performance.now());
      this.title.dispatchEvent(new CustomEvent('sdf:rebuild-complete', {
        detail: { width, height, precision: this.title.dataset.sdfPrecision }
      }));
    }

    pointerFromEvent(event) {
      const rect = this.canvas.getBoundingClientRect();
      return [
        clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1),
        clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1)
      ];
    }

    updateSourceMask() {
      this.title.dataset.sdfActive = 'true';
    }

    clearSourceMask() {
      delete this.title.dataset.sdfActive;
    }

    onPointerEnter(event) {
      if (this.isTouchEvent(event)) return;
      clearTimeout(this.previewTimer);
      this.targetPointer = this.pointerFromEvent(event);
      this.targetRadius = clamp(numberOption(this.options.lensRadius, 0.25), 0, 1);
      if (this.currentRadius < 0.02) {
        this.currentPointer = this.targetPointer.slice();
        this.currentRadius = this.targetRadius * 0.55;
      }
      this.updateSourceMask(event);
      this.start();
    }

    onPointerMove(event) {
      if (this.isTouchEvent(event)) return;
      clearTimeout(this.previewTimer);
      this.targetPointer = this.pointerFromEvent(event);
      this.targetRadius = clamp(numberOption(this.options.lensRadius, 0.25), 0, 1);
      this.updateSourceMask(event);
      this.start();
    }

    onPointerLeave(event) {
      if (this.isTouchEvent(event)) return;
      this.targetRadius = 0;
      this.clearSourceMask();
      this.start();
    }

    onPointerDown(event) {
      clearTimeout(this.previewTimer);
      this.targetPointer = this.pointerFromEvent(event);
      this.targetRadius = clamp(numberOption(this.options.lensRadius, 0.25), 0, 1);
      if (this.currentRadius < 0.02) {
        this.currentPointer = this.targetPointer.slice();
        this.currentRadius = this.targetRadius * 0.55;
      }
      this.updateSourceMask(event);
      clearTimeout(this.coarseReleaseTimer);
      if (this.isTouchEvent(event)) {
        this.coarseReleaseTimer = window.setTimeout(() => {
          this.targetRadius = 0;
          this.clearSourceMask();
          this.start();
        }, Math.max(0, numberOption(this.options.coarsePointerHoldMs, 640)));
      }
      this.start();
    }

    start() {
      if (this.running || this.destroyed || !this.gl) return;
      this.running = true;
      this.lastFrameTime = 0;
      requestAnimationFrame((time) => this.tick(time));
    }

    tick(time) {
      if (this.destroyed || !this.gl) {
        this.running = false;
        return;
      }

      const deltaSeconds = this.lastFrameTime > 0
        ? clamp((time - this.lastFrameTime) / 1000, 1 / 240, 0.05)
        : 1 / 60;
      this.lastFrameTime = time;
      const pointerFollow = clamp(numberOption(this.options.pointerFollow, 14.1), 0.1, 40);
      const radiusFollow = clamp(numberOption(this.options.radiusFollow, 20), 0.1, 40);
      const pointerBlend = 1 - Math.exp(-pointerFollow * deltaSeconds);
      const radiusBlend = 1 - Math.exp(-radiusFollow * deltaSeconds);
      this.currentPointer[0] += (this.targetPointer[0] - this.currentPointer[0]) * pointerBlend;
      this.currentPointer[1] += (this.targetPointer[1] - this.currentPointer[1]) * pointerBlend;
      this.currentRadius += (this.targetRadius - this.currentRadius) * radiusBlend;

      this.render(time);

      const pointerDelta = Math.abs(this.targetPointer[0] - this.currentPointer[0]) +
        Math.abs(this.targetPointer[1] - this.currentPointer[1]);
      const radiusDelta = Math.abs(this.targetRadius - this.currentRadius);
      const needsNextFrame = pointerDelta > 0.00015 || radiusDelta > 0.00015;

      if (needsNextFrame) {
        requestAnimationFrame((nextTime) => this.tick(nextTime));
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
      gl.uniform2f(this.uniforms.pointer, this.currentPointer[0], this.currentPointer[1]);
      gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
      gl.uniform1f(this.uniforms.radius, this.currentRadius);
      gl.uniform1f(this.uniforms.strength, Math.max(0, numberOption(this.options.strength, 1)));
      gl.uniform1f(this.uniforms.deformation, Math.max(0, numberOption(this.options.deformation, 0.1)));
      gl.uniform1f(this.uniforms.sdfBias, numberOption(this.options.sdfBias, 0.04));
      gl.uniform1f(this.uniforms.blurSoftness, Math.max(0, numberOption(this.options.blurSoftness, 0.06)));
      gl.uniform1f(this.uniforms.dispersion, Math.max(0, numberOption(this.options.dispersion, 3.75)));
      gl.uniform1f(this.uniforms.chromaIntensity, Math.max(0, numberOption(this.options.chromaIntensity, 1)));
      gl.uniform1f(this.uniforms.grainStrength, Math.max(0, numberOption(this.options.grainStrength, 2)));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    previewAt(x, y, duration) {
      if (this.destroyed || !this.gl) return this;
      clearTimeout(this.previewTimer);
      this.targetPointer = [
        clamp(numberOption(x, 0.5), 0, 1),
        clamp(numberOption(y, 0.5), 0, 1)
      ];
      this.targetRadius = clamp(numberOption(this.options.lensRadius, 0.12), 0, 1);
      if (this.currentRadius < 0.02) {
        this.currentPointer = this.targetPointer.slice();
        this.currentRadius = this.targetRadius * 0.55;
      }
      this.updateSourceMask();
      this.start();
      this.previewTimer = window.setTimeout(() => {
        this.targetRadius = 0;
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
      clearTimeout(this.rebuildTimer);
      clearTimeout(this.coarseReleaseTimer);
      clearTimeout(this.previewTimer);
      if (this.boundPointerEnter) {
        this.pointerTarget.removeEventListener('pointerenter', this.boundPointerEnter);
        this.pointerTarget.removeEventListener('pointermove', this.boundPointerMove);
        this.pointerTarget.removeEventListener('pointerleave', this.boundPointerLeave);
        this.pointerTarget.removeEventListener('pointerdown', this.boundPointerDown);
        this.canvas.removeEventListener('webglcontextlost', this.boundContextLost);
        window.removeEventListener('resize', this.boundResize);
      }
      if (this.gl) {
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
    }

    static mount(title, options) {
      return new SDFTitleEffect(title, options);
    }
  }

  window.SDFTitleEffect = SDFTitleEffect;
})();
