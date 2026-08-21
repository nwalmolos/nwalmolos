(() => {
  const style = document.createElement("style");
  style.id = "polish-bruno-detail-rail-style";
  style.textContent = `
    @media (min-width: 901px) {
      .polish-project-detail__featured-shell {
        grid-template-columns: minmax(0, 1.12fr) minmax(0, .88fr);
        gap: clamp(24px, 2.15vw, 34px);
      }
      .polish-project-detail__featured-content {
        padding-right: clamp(30px, 3.2vw, 48px);
      }
      .polish-project-detail__featured-summary .polish-project-detail__lead {
        max-width: 34ch;
      }
      .polish-project-detail__featured-story,
      .polish-project-detail__featured-content > .polish-project-detail__body-action {
        width: min(100%, 40ch);
        max-width: 40ch;
      }
      .polish-project-detail__featured-story .polish-project-detail__body {
        line-height: 1.92;
      }
      .polish-project-detail__featured-story .polish-project-detail__body-wrap {
        padding-right: clamp(18px, 1.8vw, 24px);
      }
      .polish-project-detail__featured-shell.is-compact-copy .polish-project-detail__body-wrap {
        padding-right: 0;
      }
      .polish-project-detail__desktop-media-viewport[data-bruno-rail="true"] {
        position: relative;
        overflow: hidden;
        cursor: none;
        touch-action: none;
      }
      .polish-project-detail__desktop-media-viewport[data-bruno-rail="true"] .polish-project-detail__desktop-media-canvas {
        position: absolute;
        inset: 0;
        z-index: 2;
        display: block;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      .polish-project-detail__desktop-media-viewport[data-bruno-rail="true"].is-webgl .polish-project-detail__desktop-media-track {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }
      .polish-project-detail__desktop-media-viewport[data-bruno-rail="true"] .polish-project-detail__desktop-media-card {
        aspect-ratio: 1.36 / 1 !important;
      }
      .polish-project-detail__featured-shell.is-compact-copy .polish-project-detail__featured-story {
        margin-top: clamp(42px, 6.4vh, 64px);
      }
      .polish-project-detail__featured-shell.is-compact-copy .polish-project-detail__featured-content > .polish-project-detail__body-action {
        margin: auto 0 0 !important;
        padding-top: clamp(24px, 3vh, 32px);
        padding-bottom: clamp(8px, 1.2vh, 14px);
      }
    }
  `;
  document.head.appendChild(style);

  function start(viewport) {
  if (!viewport || viewport.dataset.brunoRail || window.innerWidth < 901) return;
  const track = viewport.querySelector("[data-polish-detail-rail-track]");
  const firstGroup = track && track.querySelector("[data-polish-detail-rail-group]");
  const cards = firstGroup ? Array.from(firstGroup.querySelectorAll("[data-polish-detail-rail-card]")) : [];
  const media = cards.map(card => {
    const image = card.querySelector("img");
    if (image) return image.currentSrc || image.src;
    const video = card.querySelector("video");
    return video ? video.poster : "";
  });
  if (!track || !media.length || media.some(src => !src)) return;
  viewport.dataset.brunoRail = "true";
  const canvas = document.createElement("canvas");
  canvas.className = "polish-project-detail__desktop-media-canvas";
  canvas.setAttribute("data-polish-detail-rail-canvas", "");
  canvas.setAttribute("aria-hidden", "true");
  viewport.prepend(canvas);
  window.__BRUNO_VERTICAL_RAIL__ = true;

  const groups = Array.from(track.children).filter(node => node.classList.contains("polish-project-detail__desktop-media-group"));

  const scroll = { current: 0, target: 0, last: 0, velocity: 0, ease: 0.1 };
  const effect = { current: 0, target: 0 };
  const direction = { current: 1, target: 1 };
  const metrics = { width: 1, height: 1, cardWidth: 1, cardHeight: 1, gap: 22, spacing: 1, period: 4, fallbackPeriod: 1 };
  let pointerY = 0;
  let dragging = false;
  let webgl = null;
  let effectTimer = 0;

  const vertexShader = `
    precision highp float;
    attribute vec2 aPosition;
    attribute vec2 aUv;
    uniform vec2 uViewport;
    uniform vec2 uCardSize;
    uniform float uCenterY;
    uniform float uDistortion;
    uniform float uFlip;
    varying vec2 vUv;

    void main() {
      vUv = aUv;
      vec2 local = aPosition * uCardSize;
      float edgeX = pow(abs(aPosition.x * 2.0), 1.7);
      float edgeY = pow(abs(aPosition.y * 2.0), 2.0);
      float rotateCos = cos(uFlip);
      float rotateSin = sin(uFlip);
      float pivotY = -uCardSize.y * 0.5;
      float rotatedY = (local.y - pivotY) * rotateCos + pivotY;
      float z = (local.y - pivotY) * rotateSin;
      float paperBend = (1.0 - cos(aPosition.y * 3.14159265)) * uDistortion * 24.0;
      z += paperBend - uDistortion * (3.0 + (edgeX + edgeY) * 7.0);
      float perspective = 1180.0 / (1180.0 - z);
      vec2 screenPosition = vec2(local.x, rotatedY + uCenterY) * perspective;
      gl_Position = vec4(
        screenPosition.x / (uViewport.x * 0.5),
        screenPosition.y / (uViewport.y * 0.5),
        clamp(-z / 1000.0, -0.9, 0.9),
        1.0
      );
    }
  `;

  const fragmentShader = `
    precision highp float;
    uniform sampler2D uTexture;
    uniform vec2 uUvScale;
    uniform vec2 uCardSize;
    uniform float uDisplacement;
    uniform float uDirection;
    uniform float uTime;
    uniform float uRadius;
    varying vec2 vUv;

    float hash31(vec3 p) {
      p = fract(p * 0.1031);
      p += dot(p, p.yzx + 33.33);
      return fract((p.x + p.y) * p.z);
    }

    float noise3(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
      float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
      float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
      float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
      float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
      float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
      float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
      float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
      float nx00 = mix(n000, n100, f.x);
      float nx10 = mix(n010, n110, f.x);
      float nx01 = mix(n001, n101, f.x);
      float nx11 = mix(n011, n111, f.x);
      return mix(mix(nx00, nx10, f.y), mix(nx01, nx11, f.y), f.z) * 2.0 - 1.0;
    }

    float roundedBox(vec2 p, vec2 halfSize, float radius) {
      vec2 q = abs(p) - halfSize + radius;
      return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
    }

    void main() {
      vec2 uv = (vUv - 0.5) * uUvScale + 0.5;
      float time = uTime * 0.42;
      float broad = noise3(vec3(uv * vec2(4.5, 5.5), time));
      float columns = noise3(vec3(uv.x * 11.0, uv.y * 1.35, time * 0.72));
      float detail = noise3(vec3(uv * vec2(16.0, 9.0) + columns * 0.8, time * 1.35));
      float streaks = sin(uv.x * 38.0 + broad * 5.0 + time * 0.7) * 0.58
                    + sin(uv.x * 73.0 - time * 0.42) * 0.24
                    + columns * 0.46;
      float displacement = uDisplacement * (broad * 0.22 + streaks * 0.60 + detail * 0.18);
      float columnScale = 1.0 + streaks * uDisplacement * 0.72;
      uv.y = 0.5 + (uv.y - 0.5) * columnScale;
      uv.y += displacement * uDirection * 0.42;
      uv.x += displacement * 0.025;
      uv = 0.5 + (uv - 0.5) * (1.0 - uDisplacement * 0.06);
      uv = clamp(uv, vec2(0.002), vec2(0.998));

      float sdf = roundedBox((vUv - 0.5) * uCardSize, uCardSize * 0.5, uRadius);
      float alpha = 1.0 - smoothstep(-1.1, 1.1, sdf);
      if (alpha < 0.01) discard;
      vec3 color = texture2D(uTexture, uv).rgb;
      gl_FragColor = vec4(color, alpha);
    }
  `;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed");
    }
    return shader;
  }

  function createProgram(gl) {
    const program = gl.createProgram();
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertexShader));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragmentShader));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "Shader link failed");
    }
    return program;
  }

  function createPlane(gl, xSegments = 100, ySegments = 50) {
    const vertices = [];
    const indices = [];
    for (let y = 0; y <= ySegments; y += 1) {
      for (let x = 0; x <= xSegments; x += 1) {
        const u = x / xSegments;
        const v = y / ySegments;
        vertices.push(u - 0.5, v - 0.5, u, 1.0 - v);
      }
    }
    for (let y = 0; y < ySegments; y += 1) {
      for (let x = 0; x < xSegments; x += 1) {
        const a = y * (xSegments + 1) + x;
        const b = a + 1;
        const c = a + xSegments + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return { vertexBuffer, indexBuffer, count: indices.length };
  }

  function makeTexture(gl, src) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([16, 17, 20, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const entry = { texture, width: 16, height: 9 };
    const image = new Image();
    image.decoding = "async";
    image.addEventListener("load", () => {
      entry.width = image.naturalWidth;
      entry.height = image.naturalHeight;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      if (/^data:image\/svg\+xml/i.test(src)) {
        // Rasterize the generated SVG project art before uploading it. Direct
        // SVG-to-WebGL uploads render black in some Chromium builds.
        const surface = document.createElement("canvas");
        const railWidth = viewport.getBoundingClientRect().width || 600;
        const rasterSize = Math.min(
          2048,
          Math.max(1024, Math.ceil(railWidth * Math.min(window.devicePixelRatio || 1, 2)))
        );
        surface.width = rasterSize;
        surface.height = rasterSize;
        const context = surface.getContext("2d");
        if (context) {
          context.drawImage(image, 0, 0, surface.width, surface.height);
          entry.width = surface.width;
          entry.height = surface.height;
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, surface);
        }
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      }
    }, { once: true });
    image.src = src;
    return entry;
  }

  function initialiseWebGL() {
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      depth: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance"
    });
    if (!gl) return null;
    try {
      const program = createProgram(gl);
      const plane = createPlane(gl);
      const locations = {
        position: gl.getAttribLocation(program, "aPosition"),
        uv: gl.getAttribLocation(program, "aUv"),
        viewport: gl.getUniformLocation(program, "uViewport"),
        cardSize: gl.getUniformLocation(program, "uCardSize"),
        centerY: gl.getUniformLocation(program, "uCenterY"),
        distortion: gl.getUniformLocation(program, "uDistortion"),
        flip: gl.getUniformLocation(program, "uFlip"),
        texture: gl.getUniformLocation(program, "uTexture"),
        uvScale: gl.getUniformLocation(program, "uUvScale"),
        displacement: gl.getUniformLocation(program, "uDisplacement"),
        direction: gl.getUniformLocation(program, "uDirection"),
        time: gl.getUniformLocation(program, "uTime"),
        radius: gl.getUniformLocation(program, "uRadius")
      };
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, plane.vertexBuffer);
      gl.enableVertexAttribArray(locations.position);
      gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(locations.uv);
      gl.vertexAttribPointer(locations.uv, 2, gl.FLOAT, false, 16, 8);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, plane.indexBuffer);
      gl.uniform1i(locations.texture, 0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.CULL_FACE);
      viewport.classList.add("is-webgl");
      viewport.dataset.renderer = "webgl-bruno-vertical";
      return { gl, program, plane, locations, textures: media.map(src => makeTexture(gl, src)), started: performance.now() };
    } catch (error) {
      console.error("Bruno WebGL rail could not start", error);
      viewport.dataset.renderer = "dom-fallback";
      return null;
    }
  }

  function wrap(value, period) {
    return ((value % period) + period) % period;
  }

  function measure() {
    const rect = viewport.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    metrics.width = Math.max(1, rect.width);
    metrics.height = Math.max(1, rect.height);
    metrics.cardWidth = metrics.width;
    metrics.cardHeight = metrics.width / 1.36;
    metrics.gap = Math.max(18, Math.min(24, metrics.width * 0.032));
    metrics.spacing = metrics.cardHeight + metrics.gap;
    metrics.period = metrics.spacing * media.length;
    metrics.fallbackPeriod = groups[0].getBoundingClientRect().height || 1;
    track.dataset.loopHeight = metrics.period.toFixed(2);
    if (canvas.width !== Math.round(metrics.width * dpr) || canvas.height !== Math.round(metrics.height * dpr)) {
      canvas.width = Math.round(metrics.width * dpr);
      canvas.height = Math.round(metrics.height * dpr);
    }
    if (webgl) webgl.gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function drawWebGL(time) {
    if (!webgl) return;
    const { gl, locations, plane, textures } = webgl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(webgl.program);
    gl.uniform2f(locations.viewport, metrics.width, metrics.height);
    gl.uniform2f(locations.cardSize, metrics.cardWidth, metrics.cardHeight);
    gl.uniform1f(locations.distortion, effect.current * 0.30);
    const directionBlend = 0.38 + Math.abs(direction.current) * 0.62;
    gl.uniform1f(locations.displacement, effect.current * directionBlend * 0.064);
    gl.uniform1f(locations.direction, direction.current);
    gl.uniform1f(locations.time, (time - webgl.started) * 0.001);
    gl.uniform1f(locations.radius, Math.min(10, metrics.width * 0.014));
    gl.bindBuffer(gl.ARRAY_BUFFER, plane.vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, plane.indexBuffer);

    const position = wrap(scroll.current, metrics.period);
    const firstCenter = metrics.cardHeight * 0.5;
    const cards = [];
    for (let cycle = -1; cycle <= 1; cycle += 1) {
      media.forEach((_, index) => {
        const documentY = firstCenter + index * metrics.spacing + cycle * metrics.period - position;
        const centerY = metrics.height * 0.5 - documentY;
        if (documentY > -metrics.cardHeight && documentY < metrics.height + metrics.cardHeight) {
          cards.push({ index, centerY, documentY });
        }
      });
    }
    cards.sort((a, b) => Math.abs(b.documentY - metrics.height * 0.5) - Math.abs(a.documentY - metrics.height * 0.5));
    cards.forEach(({ index, centerY }) => {
      const entry = textures[index];
      const imageAspect = entry.width / entry.height;
      const planeAspect = metrics.cardWidth / metrics.cardHeight;
      let scaleX = 1;
      let scaleY = 1;
      if (imageAspect > planeAspect) scaleX = planeAspect / imageAspect;
      else scaleY = imageAspect / planeAspect;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, entry.texture);
      gl.uniform2f(locations.uvScale, scaleX, scaleY);
      gl.uniform1f(locations.centerY, centerY);
      const positionFlip = Math.max(-1, Math.min(1, centerY / (metrics.height * 0.58)));
      const velocityFlip = Math.max(-1, Math.min(1, scroll.velocity));
      gl.uniform1f(locations.flip, effect.current * (positionFlip * 0.76 + velocityFlip * 0.18));
      gl.drawElements(gl.TRIANGLES, plane.count, gl.UNSIGNED_SHORT, 0);
    });
  }

  function drawFallback() {
    const position = wrap(scroll.current, metrics.fallbackPeriod);
    track.style.transform = `translate3d(0,${(-position).toFixed(3)}px,0)`;
  }

  function tick(time) {
    if (!viewport.isConnected) {
      window.removeEventListener("resize", measure);
      return;
    }
    scroll.last = scroll.current;
    scroll.current += (scroll.target - scroll.current) * scroll.ease;
    if (Math.abs(scroll.target - scroll.current) < 0.01) scroll.current = scroll.target;
    const frameDelta = scroll.current - scroll.last;
    const velocityTarget = Math.max(-1, Math.min(1, frameDelta / 22));
    scroll.velocity += (velocityTarget - scroll.velocity) * 0.2;
    if (Math.abs(frameDelta) < 0.01) scroll.velocity *= 0.88;
    // Preserve the last direction inside a small dead zone, then ease through
    // zero when the pointer reverses instead of mirroring the UVs in one frame.
    if (scroll.velocity > 0.035) direction.target = 1;
    else if (scroll.velocity < -0.035) direction.target = -1;
    direction.current += (direction.target - direction.current) * 0.095;
    if (Math.abs(direction.target - direction.current) < 0.001) direction.current = direction.target;
    effect.current += (effect.target - effect.current) * (effect.target > effect.current ? 0.16 : 0.08);
    const velocityEffect = Math.min(1, Math.abs(scroll.velocity) * 1.55);
    if (velocityEffect > effect.current) effect.current += (velocityEffect - effect.current) * 0.22;
    track.dataset.current = scroll.current.toFixed(2);
    track.dataset.target = scroll.target.toFixed(2);
    track.dataset.velocity = scroll.velocity.toFixed(4);
    track.dataset.distortion = effect.current.toFixed(4);
    track.dataset.direction = direction.current.toFixed(4);
    drawWebGL(time);
    if (!webgl) drawFallback();
    if (metrics.period && Math.abs(scroll.current) > metrics.period * 64) {
      const cycles = Math.trunc(scroll.current / metrics.period);
      scroll.current -= cycles * metrics.period;
      scroll.target -= cycles * metrics.period;
    }
    requestAnimationFrame(tick);
  }

  function activateEffect() {
    effect.target = 1;
    window.clearTimeout(effectTimer);
    effectTimer = window.setTimeout(() => { if (!dragging) effect.target = 0; }, 170);
  }

  function move(delta) {
    scroll.target += delta;
    activateEffect();
  }

  viewport.addEventListener("wheel", event => {
    event.preventDefault();
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    move(Math.max(-180, Math.min(180, delta)) * 0.88);
  }, { passive: false });
  viewport.addEventListener("pointerdown", event => {
    dragging = true;
    pointerY = event.clientY;
    effect.target = 1;
    viewport.classList.add("is-dragging");
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener("pointermove", event => {
    if (!dragging) return;
    const delta = pointerY - event.clientY;
    pointerY = event.clientY;
    scroll.target += delta * 1.15;
  });
  const release = () => {
    dragging = false;
    effect.target = 0;
    viewport.classList.remove("is-dragging");
  };
  viewport.addEventListener("pointerup", release);
  viewport.addEventListener("pointercancel", release);

  const copy = document.getElementById("detail-copy");
  copy?.addEventListener("scroll", () => {
    const max = Math.max(1, copy.scrollHeight - copy.clientHeight);
    document.getElementById("copy-thumb")?.style.setProperty("--thumb-y", `${copy.scrollTop / max * (copy.clientHeight * 0.54 - 12)}px`);
  }, { passive: true });

  webgl = initialiseWebGL();
  if (!webgl) {
    canvas.remove();
    viewport.dataset.brunoRail = "fallback";
    return;
  }
  window.addEventListener("resize", measure);
  measure();
  requestAnimationFrame(tick);
  }

  function scan() {
    document.querySelectorAll("[data-polish-detail-rail-viewport]").forEach(start);
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("resize", scan, { passive: true });
  scan();
})();
