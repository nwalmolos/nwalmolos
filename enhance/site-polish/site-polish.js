(function () {
  const CONFIG_URL = 'enhance/site-polish/config.json';
  const PROJECTS_URL = 'enhance/site-polish/projects.json';
  const HERO_VIDEO_PLAYBACK_RATE = 24 / 25;
  const HERO_SDF_SCRIPT_URL = 'enhance/hero-sdf/sdf-title-effect.js?v=20260821-film-grain-reflection-1';
  const HERO_SDF_STYLE_URL = 'enhance/hero-sdf/hero-sdf-title.css?v=20260821-hero-pin-1';
  const PILOWLAVA_FONT_URL = 'assets/fonts/pilowlava/Pilowlava-Regular.woff2?v=20260728-pilowlava-sdf-6';
  const NOTO_SANS_SC_STYLE_URL = 'assets/fonts/noto-sans-sc/noto-sans-sc.css?v=20260811-noto-sc-1';
  const FRAUNCES_FONT_URL = 'assets/fonts/fraunces/Fraunces-Opsz-500-Latin.woff2?v=20260811-fraunces-1';
  const BIG_SHOULDERS_FONT_URL = 'assets/fonts/big-shoulders-display/BigShouldersDisplay-700-Latin.woff2?v=20260811-big-shoulders-1';

  // The site always boots into Hero, so suppress the standalone fluid trail
  // before the viewport-aware controller is mounted.
  document.documentElement.classList.add('polish-fluid-trail-suppressed');

  function installFluidFirstMoveGuard() {
    if (window.__polishFluidFirstMoveGuardInstalled) return;
    window.__polishFluidFirstMoveGuardInstalled = true;

    const primeFluidPointer = (event) => {
      const canvas = document.getElementById('fluid-canvas');
      const pixelRatio = window.devicePixelRatio || 1;
      const expectedWidth = Math.floor((canvas ? canvas.clientWidth : 0) * pixelRatio);
      const expectedHeight = Math.floor((canvas ? canvas.clientHeight : 0) * pixelRatio);
      const fluidReady = canvas && expectedWidth > 0 && expectedHeight > 0 &&
        canvas.width === expectedWidth && canvas.height === expectedHeight;
      if (!fluidReady) return;

      // The bundled fluid simulation starts its pointer at (0, 0). If the first
      // real mousemove is forwarded directly, it becomes a full-screen velocity
      // impulse. Replay the first position twice in the same task: the first
      // sample initializes the bundled pointer and the second clears its delta
      // before the next animation frame can inject dye.
      event.stopImmediatePropagation();
      window.removeEventListener('mousemove', primeFluidPointer, true);
      const replayOptions = {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        clientX: event.clientX,
        clientY: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY,
        buttons: event.buttons
      };
      window.dispatchEvent(new MouseEvent('mousemove', replayOptions));
      window.dispatchEvent(new MouseEvent('mousemove', replayOptions));
    };

    window.addEventListener('mousemove', primeFluidPointer, true);
  }

  installFluidFirstMoveGuard();

  function installFluidFramebufferGuard() {
    if (window.__polishFluidFramebufferGuardInstalled) return;
    window.__polishFluidFramebufferGuardInstalled = true;

    const guardedCanvases = new WeakSet();
    const attachGuard = () => {
      const canvas = document.getElementById('fluid-canvas');
      if (!canvas || guardedCanvases.has(canvas)) return;

      const contextOptions = {
        alpha: true,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: false
      };
      let gl = null;
      try {
        gl = canvas.getContext('webgl2', contextOptions) ||
          canvas.getContext('webgl', contextOptions) ||
          canvas.getContext('experimental-webgl', contextOptions);
      } catch (error) {
        gl = null;
      }
      if (!gl) return;

      guardedCanvases.add(canvas);
      canvas.dataset.polishFramebufferGuard = 'true';

      let activeFramebuffer = null;
      try {
        activeFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
      } catch (error) {
        activeFramebuffer = null;
      }

      const bindFramebuffer = gl.bindFramebuffer.bind(gl);
      const drawElements = gl.drawElements.bind(gl);
      gl.bindFramebuffer = (target, framebuffer) => {
        if (target === gl.FRAMEBUFFER) activeFramebuffer = framebuffer;
        return bindFramebuffer(target, framebuffer);
      };
      gl.drawElements = (mode, count, type, offset) => {
        // The bundled simulation renders many off-screen passes followed by one
        // default-framebuffer pass. Clear only that final surface so transparent
        // fluid pixels cannot accumulate into a full-screen grey layer.
        if (activeFramebuffer === null && !gl.isContextLost()) {
          gl.colorMask(true, true, true, true);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        return drawElements(mode, count, type, offset);
      };

      canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        canvas.dataset.polishContextLost = 'true';
        canvas.style.setProperty('opacity', '0', 'important');
      }, false);
      canvas.addEventListener('webglcontextrestored', () => {
        canvas.dataset.polishContextLost = 'false';
        const reloadWhenVisible = () => {
          if (document.hidden) return;
          document.removeEventListener('visibilitychange', reloadWhenVisible);
          window.location.reload();
        };
        if (document.hidden) {
          document.addEventListener('visibilitychange', reloadWhenVisible);
        } else {
          window.setTimeout(reloadWhenVisible, 80);
        }
      }, false);
    };

    attachGuard();
    window.setTimeout(attachGuard, 120);
    window.setTimeout(attachGuard, 700);
    window.setTimeout(attachGuard, 1800);
  }

  installFluidFramebufferGuard();

  function installHeroSdfFirstPaintGuard() {
    if (document.querySelector('style[data-enhance="hero-sdf-first-paint"]')) return;
    const style = document.createElement('style');
    style.dataset.enhance = 'hero-sdf-first-paint';
    style.textContent = [
      'html.polish-first-paint-ready main>section:first-of-type h1.polish-hero-title-normalized:not([data-sdf-state="ready"]):not([data-sdf-state="fallback"]):not([data-sdf-state="static"]){opacity:0!important;visibility:hidden!important;transform:none!important;filter:none!important;transition:none!important}',
      'html.polish-first-paint-ready main>section:first-of-type h1.polish-hero-title-normalized[data-sdf-state="ready"],html.polish-first-paint-ready main>section:first-of-type h1.polish-hero-title-normalized[data-sdf-state="fallback"],html.polish-first-paint-ready main>section:first-of-type h1.polish-hero-title-normalized[data-sdf-state="static"]{opacity:1!important;visibility:visible!important;transform:none!important;filter:none!important;transition:opacity .18s cubic-bezier(.16,1,.3,1)!important}'
    ].join('');
    (document.head || document.documentElement).appendChild(style);
  }

  installHeroSdfFirstPaintGuard();

  function installSoftGrainOverlay() {
    if (!document.querySelector('style[data-enhance="soft-grain-overlay"]')) {
      const style = document.createElement('style');
      style.dataset.enhance = 'soft-grain-overlay';
      style.textContent = `
        .grain-overlay {
          position: fixed !important;
          inset: -12% !important;
          width: 124% !important;
          height: 124% !important;
          z-index: 2147481000 !important;
          pointer-events: none !important;
          opacity: .12 !important;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='softNoise' x='-20%25' y='-20%25' width='140%25' height='140%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' seed='7' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23softNoise)' opacity='.9'/%3E%3C/svg%3E") !important;
          background-repeat: repeat !important;
          background-size: 160px 160px !important;
          mix-blend-mode: screen !important;
          transform: translate3d(0, 0, 0);
          transform-origin: center;
          contain: strict;
          will-change: transform;
          animation: polish-soft-grain-flicker .12s steps(1, end) infinite !important;
          animation-play-state: running !important;
        }
        @keyframes polish-soft-grain-flicker {
          0%, 100% { background-position: 0 0; transform: translate3d(0, 0, 0); }
          16% { background-position: -23px 17px; transform: translate3d(-3px, 2px, 0); }
          33% { background-position: 31px -11px; transform: translate3d(2px, -3px, 0); }
          50% { background-position: -7px 29px; transform: translate3d(-2px, -1px, 0); }
          66% { background-position: 19px 7px; transform: translate3d(3px, 1px, 0); }
          83% { background-position: -29px -19px; transform: translate3d(1px, 3px, 0); }
        }
        @media (max-width: 767px) {
          .grain-overlay {
            opacity: .105 !important;
            background-size: 144px 144px !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .grain-overlay { animation-duration: .16s !important; }
        }
        .polish-live-grain {
          position: fixed;
          inset: 0;
          z-index: 2147481000;
          display: block;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          pointer-events: none;
          mix-blend-mode: normal;
          opacity: 1;
          image-rendering: auto;
          contain: strict;
        }
        html.polish-live-grain-ready .grain-overlay {
          opacity: 0 !important;
          animation: none !important;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    }

    const ensureOverlay = () => {
      if (document.querySelector('.grain-overlay')) return;
      const overlay = document.createElement('div');
      overlay.className = 'grain-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.prepend(overlay);
    };

    const setupLiveGrain = () => {
      if (document.querySelector('.polish-live-grain')) return;

      const canvas = document.createElement('canvas');
      canvas.className = 'polish-live-grain';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas);

      const startCanvasGrain = () => {
        const context = canvas.getContext('2d', { alpha: true });
        if (!context) {
          canvas.remove();
          return;
        }

        context.imageSmoothingEnabled = true;
        const tileCanvas = document.createElement('canvas');
        const tileContext = tileCanvas.getContext('2d', { alpha: true });
        if (!tileContext) {
          canvas.remove();
          return;
        }

        // Generate a fresh 512px noise tile, then repeat it with the native
        // canvas compositor. The grain distribution, alpha and refresh cadence
        // remain unchanged while JavaScript touches far fewer pixels.
        const tileSize = window.innerWidth <= 767 ? 384 : 512;
        tileCanvas.width = tileSize;
        tileCanvas.height = tileSize;
        const imageData = tileContext.createImageData(tileSize, tileSize);
        const pixels = imageData.data;
        let seed = 0x9e3779b9;
        const resizeCanvas = () => {
          const width = Math.max(1, Math.round(window.innerWidth));
          const height = Math.max(1, Math.round(window.innerHeight));
          if (canvas.width === width && canvas.height === height) return;
          canvas.width = width;
          canvas.height = height;
          context.imageSmoothingEnabled = true;
          canvas.dataset.bufferPixels = String(width * height);
        };

        const nextRandom = () => {
          seed ^= seed << 13;
          seed ^= seed >>> 17;
          seed ^= seed << 5;
          return seed >>> 0;
        };

        let frame = 0;
        let lastRender = 0;
        let animationFrame = 0;
        let resizeFrame = 0;
        let running = false;
        const renderCanvasGrain = (time) => {
          if (!running) return;
          animationFrame = requestAnimationFrame(renderCanvasGrain);
          if (time - lastRender < 55) return;
          lastRender = time;
          resizeCanvas();
          seed = (seed + 0x6d2b79f5 + frame * 97) >>> 0;
          for (let index = 0; index < pixels.length; index += 4) {
            const random = nextRandom();
            const low = random & 255;
            const high = (random >>> 16) & 255;
            const shade = (low + high) >> 1;
            const alpha = 16 + ((random >>> 24) & 3);
            pixels[index] = shade;
            pixels[index + 1] = shade;
            pixels[index + 2] = shade;
            pixels[index + 3] = alpha;
          }
          tileContext.putImageData(imageData, 0, 0);
          const pattern = context.createPattern(tileCanvas, 'repeat');
          if (pattern) {
            context.save();
            context.globalCompositeOperation = 'copy';
            context.fillStyle = pattern;
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.restore();
          }
          frame += 1;
          canvas.dataset.frame = String(frame);
        };

        const startRendering = () => {
          if (running || document.hidden) return;
          running = true;
          lastRender = 0;
          animationFrame = requestAnimationFrame(renderCanvasGrain);
        };
        const stopRendering = () => {
          running = false;
          if (animationFrame) cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        };
        const handleVisibility = () => {
          if (document.hidden) stopRendering();
          else startRendering();
        };
        const scheduleResize = () => {
          if (resizeFrame) return;
          resizeFrame = requestAnimationFrame(() => {
            resizeFrame = 0;
            resizeCanvas();
          });
        };

        document.documentElement.classList.add('polish-live-grain-ready');
        canvas.dataset.renderer = 'tiled-2d';
        canvas.dataset.tilePixels = String(tileSize * tileSize);
        window.addEventListener('resize', scheduleResize, { passive: true });
        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('pagehide', stopRendering);
        window.addEventListener('pageshow', startRendering);
        resizeCanvas();
        startRendering();
      };

      startCanvasGrain();
      return;

      const gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        powerPreference: 'low-power'
      });
      if (!gl) {
        startCanvasGrain();
        return;
      }

      const vertexSource = `
        attribute vec2 aPosition;
        void main() {
          gl_Position = vec4(aPosition, 0.0, 1.0);
        }
      `;
      const fragmentSource = `
        precision highp float;
        uniform float uFrame;

        float hash(vec2 p) {
          p = fract(p * vec2(0.1031, 0.1030));
          p += dot(p, p.yx + 33.33 + uFrame * 0.013);
          return fract((p.x + p.y) * p.x);
        }

        void main() {
          vec2 pixel = floor(gl_FragCoord.xy);
          float fine = hash(pixel + vec2(uFrame * 37.0, uFrame * -17.0));
          float soft = hash(floor(pixel * 0.57) + vec2(uFrame * -11.0, uFrame * 29.0));
          float grain = mix(fine, soft, 0.18);
          float light = pow(grain, 3.0) * 0.16;
          gl_FragColor = vec4(vec3(light), 1.0);
        }
      `;

      const compile = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vertex = compile(gl.VERTEX_SHADER, vertexSource);
      const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
      if (!vertex || !fragment) {
        canvas.remove();
        return;
      }

      const program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        canvas.remove();
        return;
      }

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.useProgram(program);
      const position = gl.getAttribLocation(program, 'aPosition');
      const frameUniform = gl.getUniformLocation(program, 'uFrame');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      const resize = () => {
        const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
        const width = Math.max(1, Math.round(window.innerWidth * ratio));
        const height = Math.max(1, Math.round(window.innerHeight * ratio));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
      };

      let frame = 0;
      let lastRender = 0;
      const render = (time) => {
        requestAnimationFrame(render);
        if (document.hidden || time - lastRender < 55) return;
        lastRender = time;
        resize();
        frame += 1;
        gl.uniform1f(frameUniform, frame);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        canvas.dataset.frame = String(frame);
      };

      document.documentElement.classList.add('polish-live-grain-ready');
      window.addEventListener('resize', resize, { passive: true });
      resize();
      requestAnimationFrame(render);
    };

    const mount = () => {
      ensureOverlay();
      setTimeout(setupLiveGrain, 900);
      setTimeout(setupLiveGrain, 1900);
    };

    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount, { once: true });
  }

  installSoftGrainOverlay();
  const DEFAULTS = {
    enabled: true,
    navBlur: true,
    fixScrollIndicator: true,
    removeMarqueeStrip: true,
    separateContactCta: true,
    ctaText: 'Email Me',
    detailNavMode: 'legacy',
    clickHover: true,
    cursorClickMotion: true,
    bootSettle: false,
    bootSettleMs: 900,
    elasticText: true,
    elasticStrength: 1.05,
    parallax: true,
    maxParallax: 34,
    magneticButtons: true,
    navReflection: true,
    heroVideo: true,
    heroVideoSrc: 'media/hero-abstract-loop.mp4',
    heroVideoPoster: 'media/hero-abstract-poster.jpg',
    heroVideoMobile: true,
    heroVideoLazy: true,
    heroVideoLazyDelay: 650,
    heroVideoPreload: 'none',
    heroScrollMotion: true,
    heroDecorMotion: false,
    heroSdfTitle: true,
    heroSdfFontSize: 220,
    heroSdfLetterSpacing: 0.08,
    heroSdfLineHeight: 1.25,
    heroSdfCanvasWidth: 300,
    heroSdfCanvasHeight: 520,
    heroSdfLensRadius: 0.069,
    heroSdfStrength: 1,
    heroSdfDeformation: 0.07,
    heroSdfSdfBias: 0.04,
    heroSdfBlurSoftness: 0.014,
    heroSdfDispersion: 3.75,
    heroSdfChromaIntensity: 1,
    heroSdfGrainStrength: 2,
    heroSdfTrailTextureSize: 1024,
    heroSdfTrailMaxAge: 210,
    heroSdfTrailBlend: 'difference',
    heroSdfTrailRadius: 0.113,
    heroSdfTrailIntensity: 0.1,
    heroSdfTrailMinForce: 0.5,
    heroSdfTrailInfluence: 1,
    heroSdfFilmGrain: 0.74,
    heroSdfUvDisplacement: 17,
    heroSdfMorphAmount: 0.2,
    heroSdfChromaticMode: 1,
    heroSdfChromaticSpread: 2.2,
    heroSdfFollowStrength: 1.4,
    heroSdfFollowDamping: 9,
    heroSdfFilmTransition: 0.09,
    heroSdfCenterSteer: 0.68,
    heroSdfCenterRange: 0.62,
    heroSdfCenterFeather: 0.3,
    heroSdfCenterResponse: 0.13,
    heroSdfCausticOnset: 1,
    heroSdfCausticIntensity: 1.8,
    heroSdfCausticColorLink: 0.22,
    heroSdfPositionColorFlow: 1,
    heroSdfFontLightDominance: 0.24,
    heroSdfIntercolorMix: 1,
    heroSdfProjectionLength: 0.74,
    heroSdfProjectionBrightness: 1.05,
    heroSdfProjectionFalloff: 1.52,
    heroSdfProjectionHue: 1,
    heroSdfPointerFollow: 9,
    heroSdfRadiusFollow: 20,
    heroSdfRecoveryRadiusFollow: 8.6,
    heroSdfRecoveryVelocityDamping: 7.2,
    heroSdfCoarsePointerHoldMs: 640,
    heroSdfTexturePixelRatio: 1.5,
    heroSdfMaxTextureWidth: 3840,
    heroSdfRespectReducedMotion: false,
    innerImageParallax: true,
    innerImageParallaxStrength: 0.009,
    innerImageParallaxDamping: 0.16,
    galleryReplacement: true,
    galleryPageSize: 3,
    galleryMobilePageSize: 4,
    galleryRevealEffect: 'randomGrid',
    galleryMinPages: 2,
    galleryDemoPlaceholders: true,
    diffusionBoot: false,
    projectsUrl: PROJECTS_URL,
    progressiveBlur: false,
    progressiveBlurStrength: 1,
    respectReducedMotion: false
  };

  let heroSdfStyleReady = null;

  function preloadHeroTitleAssets() {
    let fontPreload = document.querySelector('link[data-enhance="pilowlava-preload"]');
    if (!fontPreload) {
      fontPreload = document.createElement('link');
      fontPreload.rel = 'preload';
      fontPreload.as = 'font';
      fontPreload.type = 'font/woff2';
      fontPreload.crossOrigin = 'anonymous';
      fontPreload.href = PILOWLAVA_FONT_URL;
      fontPreload.dataset.enhance = 'pilowlava-preload';
      (document.head || document.documentElement).appendChild(fontPreload);
    }

    let notoSansStyle = document.querySelector('link[data-enhance="noto-sans-sc-style"]');
    if (!notoSansStyle) {
      notoSansStyle = document.createElement('link');
      notoSansStyle.rel = 'stylesheet';
      notoSansStyle.href = NOTO_SANS_SC_STYLE_URL;
      notoSansStyle.dataset.enhance = 'noto-sans-sc-style';
      (document.head || document.documentElement).appendChild(notoSansStyle);
    }

    let frauncesPreload = document.querySelector('link[data-enhance="fraunces-preload"]');
    if (!frauncesPreload) {
      frauncesPreload = document.createElement('link');
      frauncesPreload.rel = 'preload';
      frauncesPreload.as = 'font';
      frauncesPreload.type = 'font/woff2';
      frauncesPreload.crossOrigin = 'anonymous';
      frauncesPreload.href = FRAUNCES_FONT_URL;
      frauncesPreload.dataset.enhance = 'fraunces-preload';
      (document.head || document.documentElement).appendChild(frauncesPreload);
    }

    let bigShouldersPreload = document.querySelector('link[data-enhance="big-shoulders-preload"]');
    if (!bigShouldersPreload) {
      bigShouldersPreload = document.createElement('link');
      bigShouldersPreload.rel = 'preload';
      bigShouldersPreload.as = 'font';
      bigShouldersPreload.type = 'font/woff2';
      bigShouldersPreload.crossOrigin = 'anonymous';
      bigShouldersPreload.href = BIG_SHOULDERS_FONT_URL;
      bigShouldersPreload.dataset.enhance = 'big-shoulders-preload';
      (document.head || document.documentElement).appendChild(bigShouldersPreload);
    }

    let styleLink = document.querySelector('link[data-enhance="hero-sdf-style"]');
    if (!styleLink) {
      styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';
      styleLink.href = HERO_SDF_STYLE_URL;
      styleLink.dataset.enhance = 'hero-sdf-style';
      (document.head || document.documentElement).appendChild(styleLink);
    }

    if (!heroSdfStyleReady) {
      heroSdfStyleReady = styleLink.sheet
        ? Promise.resolve()
        : new Promise((resolve) => {
            styleLink.addEventListener('load', resolve, { once: true });
            styleLink.addEventListener('error', resolve, { once: true });
          });
    }
    return heroSdfStyleReady;
  }

  function installInitialStateGuards() {
    try {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      window.scrollTo(0, 0);
    } catch {}

    if (!document.querySelector('#polish-first-paint-guard, style[data-enhance="site-polish-early"]')) {
      const style = document.createElement('style');
      style.dataset.enhance = 'site-polish-early';
      style.textContent = '#projects + section:not([id]):not(.polish-gallery-section){display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;}html:not(.polish-first-paint-ready) main>section:first-of-type{opacity:0!important;visibility:hidden!important;}main>section:first-of-type{transition:opacity .36s cubic-bezier(.16,1,.3,1);}html{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.20) rgba(0,0,0,.34);}html::-webkit-scrollbar,body::-webkit-scrollbar{width:10px;height:10px;}html::-webkit-scrollbar-track,body::-webkit-scrollbar-track{background:rgba(0,0,0,.34);border-radius:999px;}html::-webkit-scrollbar-thumb,body::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(255,255,255,.24),rgba(255,255,255,.13));border:2px solid rgba(0,0,0,.48);border-radius:999px;}';
      (document.head || document.documentElement).appendChild(style);
    }

    const reset = () => {
      try { window.scrollTo(0, 0); } catch {}
    };
    window.addEventListener('pageshow', reset, { once: true });
    document.addEventListener('DOMContentLoaded', reset, { once: true });
  }

  preloadHeroTitleAssets();
  installInitialStateGuards();

  function releaseFirstPaintGuard() {
    if (document.documentElement.classList.contains('polish-first-paint-ready')) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.add('polish-first-paint-ready');
      });
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getEditableContentRaw(path) {
    let value = window.__EDITABLE_SITE_CONTENT__;
    String(path || '').split('.').forEach((key) => {
      value = value == null ? undefined : value[key];
    });
    return value;
  }

  function getEditableContentValue(path, fallback) {
    const value = getEditableContentRaw(path);
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  function getEditableMediaValue(path, fallback) {
    let value = window.__EDITABLE_SITE_MEDIA__;
    String(path || '').split('.').forEach((key) => {
      value = value == null ? undefined : value[key];
    });
    return value === undefined || value === null || value === '' ? fallback : value;
  }

  function isMobileLikeViewport() {
    return window.innerWidth <= 767 || matchMedia('(hover: none), (pointer: coarse)').matches;
  }

  function isCoarsePointerInput() {
    return matchMedia('(hover: none), (pointer: coarse)').matches;
  }

  function isCompactNavViewport() {
    const visualWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    return Math.min(window.innerWidth || 9999, visualWidth || 9999) <= 1024 ||
      matchMedia('(hover: none), (pointer: coarse)').matches;
  }

  const SHARED_DETAIL_CLOSE_MAGNETIC_REACH = 36;
  const GALLERY_BUTTON_POINTER_REACH = 7;

  function pointWithinExpandedControl(control, x, y, reach, offsetX, offsetY) {
    if (!control || !control.isConnected) return false;
    const rect = control.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const dx = Number.isFinite(offsetX) ? offsetX : 0;
    const dy = Number.isFinite(offsetY) ? offsetY : 0;
    const left = rect.left - dx;
    const right = rect.right - dx;
    const top = rect.top - dy;
    const bottom = rect.bottom - dy;
    const outsideX = Math.max(left - x, 0, x - right);
    const outsideY = Math.max(top - y, 0, y - bottom);
    return Math.hypot(outsideX, outsideY) <= reach;
  }

  function getSharedDetailCloseProximityTarget(x, y) {
    const navState = document.documentElement.dataset.polishDetailNavState || 'home';
    if (!/^(entering|open)$/.test(navState)) return null;
    const control = document.querySelector('[data-polish-shared-detail-close]');
    if (!control || control.getAttribute('aria-hidden') === 'true') return null;
    const style = getComputedStyle(control);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < .08) return null;
    const magneticX = parseFloat(style.getPropertyValue('--polish-magnetic-x')) || 0;
    const magneticY = parseFloat(style.getPropertyValue('--polish-magnetic-y')) || 0;
    return pointWithinExpandedControl(
      control,
      x,
      y,
      SHARED_DETAIL_CLOSE_MAGNETIC_REACH,
      magneticX,
      magneticY
    ) ? control : null;
  }

  function getGalleryButtonProximityTarget(x, y) {
    const navState = document.documentElement.dataset.polishDetailNavState || 'home';
    if (navState !== 'home') return null;
    return Array.from(document.querySelectorAll('.polish-gallery-button:not(:disabled):not(.is-locked)')).find((control) => {
      const style = getComputedStyle(control);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < .08) return false;
      return pointWithinExpandedControl(control, x, y, GALLERY_BUTTON_POINTER_REACH);
    }) || null;
  }

  function loadConfig() {
    return fetch(CONFIG_URL, { cache: 'no-store' })
      .then((res) => res.ok ? res.json() : {})
      .catch(() => ({}))
      .then((user) => Object.assign({}, DEFAULTS, user || {}));
  }

  function loadProjectItems(config) {
    return fetch(config.projectsUrl || PROJECTS_URL, { cache: 'no-store' })
      .then((res) => res.ok ? res.json() : null)
      .catch(() => null)
      .then((data) => {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.projects)) return data.projects;
        return null;
      });
  }

  function injectStyles() {
    if (document.querySelector('style[data-enhance="site-polish"]')) return;
    const style = document.createElement('style');
    style.dataset.enhance = 'site-polish';
    style.textContent = `
      @font-face {
        font-family: "Smiley Sans Web";
        src: url("assets/fonts/smiley-sans/SmileySans-Oblique.ttf.woff2?v=20260807-smiley-1") format("woff2");
        font-style: oblique;
        font-weight: 400;
        font-display: swap;
      }
      @font-face {
        font-family: "Fraunces Web";
        src: url("${FRAUNCES_FONT_URL}") format("woff2");
        font-style: normal;
        font-weight: 500;
        font-display: swap;
      }
      @font-face {
        font-family: "Big Shoulders Display Web";
        src: url("${BIG_SHOULDERS_FONT_URL}") format("woff2");
        font-style: normal;
        font-weight: 700;
        font-display: swap;
      }
      :root {
        --polish-font-sans: "Noto Sans SC Web", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
        --polish-font-subtitle: "Smiley Sans Web", "Smiley Sans", "Noto Sans SC Web", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
        --polish-font-accent: "Smiley Sans Web", "Smiley Sans", "Noto Sans SC Web", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
        --polish-font-email: "Fraunces Web", Georgia, "Times New Roman", serif;
        --polish-font-stats: "Big Shoulders Display Web", "Arial Narrow", "Roboto Condensed", sans-serif;
        --polish-font-mono: "Noto Sans SC Web", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
      }
      html,
      body {
        background: #020203 !important;
        font-family: var(--polish-font-sans) !important;
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
        overscroll-behavior-x: none;
      }
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }
      body {
        position: relative;
      }
      button,
      input,
      select,
      textarea,
      nav a,
      main section h2,
      main section h3,
      main section p,
      main section blockquote,
      footer {
        font-family: var(--polish-font-sans) !important;
        font-optical-sizing: auto;
        font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
      }
      .font-mono {
        font-family: var(--polish-font-mono) !important;
        font-variant-numeric: tabular-nums;
        font-feature-settings: "tnum" 1;
      }
      main > section:first-of-type p.mt-8 {
        font-family: var(--polish-font-subtitle) !important;
        font-style: oblique;
        font-weight: 400 !important;
        font-synthesis: none;
        max-width: min(46rem, calc(100vw - 48px)) !important;
        color: rgba(255,255,255,.68) !important;
        letter-spacing: .035em;
        line-height: 1.66 !important;
        text-shadow: 0 1px 18px rgba(0,0,0,.46);
        text-rendering: geometricPrecision;
      }
      main section h2 {
        font-family: var(--polish-font-subtitle) !important;
        font-style: oblique;
        font-weight: 400 !important;
        font-synthesis: none;
        letter-spacing: .012em !important;
        text-rendering: geometricPrecision;
      }
      nav a[href="#"].font-mono {
        font-family: var(--polish-font-accent) !important;
        font-weight: 800;
        letter-spacing: .08em;
      }
      .polish-layer-name {
        font-family: var(--polish-font-accent) !important;
        font-weight: 650;
        letter-spacing: -.018em;
      }
      #projects h3 {
        font-family: var(--polish-font-accent) !important;
        font-weight: 650 !important;
        letter-spacing: -.025em;
      }
      #about .text-3xl {
        font-family: var(--polish-font-stats) !important;
        font-weight: 700 !important;
        line-height: .92;
        letter-spacing: .015em;
        font-feature-settings: "tnum" 1;
        font-synthesis: none;
      }
      #contact a[href^="mailto:"][class*="text-2xl"] {
        font-family: var(--polish-font-email) !important;
        font-weight: 500 !important;
        letter-spacing: -.02em;
        font-optical-sizing: auto;
        font-variation-settings: "opsz" 72;
        font-synthesis: none;
      }
      .polish-project-detail__title {
        font-family: var(--polish-font-accent) !important;
        font-weight: 600 !important;
        letter-spacing: -.035em;
        font-synthesis: none;
      }
      html {
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,.20) rgba(0,0,0,.34);
      }
      html::-webkit-scrollbar,
      body::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      html::-webkit-scrollbar-track,
      body::-webkit-scrollbar-track {
        background: rgba(0,0,0,.34);
        border-radius: 999px;
      }
      html::-webkit-scrollbar-thumb,
      body::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(255,255,255,.24), rgba(255,255,255,.13));
        border: 2px solid rgba(0,0,0,.48);
        border-radius: 999px;
      }
      html::-webkit-scrollbar-thumb:hover,
      body::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(255,255,255,.30), rgba(255,255,255,.17));
      }
      main {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100vw !important;
        overflow-x: clip !important;
      }
      main > section,
      footer {
        width: 100%;
        min-width: 0;
        max-width: 100vw;
      }
      img,
      video,
      canvas {
        max-width: 100%;
      }
      nav.polish-glass-nav,
      nav[data-polish-glass="true"] {
        background: rgba(4, 5, 7, .46) !important;
        border-bottom: 1px solid rgba(255,255,255,.035) !important;
        -webkit-backdrop-filter: blur(18px) saturate(1.18) !important;
        backdrop-filter: blur(18px) saturate(1.18) !important;
      }
      nav.polish-glass-nav::before,
      nav[data-polish-glass="true"]::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(180deg, rgba(255,255,255,.055), transparent);
      }
      nav.polish-key-reflection::after,
      nav[data-polish-key-reflection="true"]::after {
        content: "";
        position: absolute;
        left: clamp(84px, 16vw, 260px);
        right: clamp(84px, 16vw, 260px);
        bottom: -2px;
        height: 3px;
        pointer-events: none;
        background:
          radial-gradient(ellipse at 20% 0%, rgba(255,255,255,.10), transparent 28%),
          radial-gradient(ellipse at 78% 0%, rgba(255,255,255,.07), transparent 26%),
          linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.018) 58%, transparent 100%);
        filter: blur(.3px);
        opacity: .34;
        -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
        mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
        mix-blend-mode: screen;
      }
      .polish-hero-video-layer {
        position: absolute;
        inset: 0;
        z-index: 0;
        overflow: hidden;
        pointer-events: none;
        background: #020203;
        isolation: isolate;
      }
      .polish-hero-video-layer::before,
      .polish-hero-video-layer::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
      }
      .polish-hero-video-layer::before {
        background: linear-gradient(rgba(0,0,0,.34), rgba(0,0,0,.34));
      }
      .polish-hero-video-layer::after {
        opacity: .12;
        mix-blend-mode: screen;
        background-image:
          linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
        background-size: 54px 54px;
        transform: translate3d(0,0,0);
      }
      .polish-hero-video {
        position: absolute;
        inset: 50% auto auto 50%;
        z-index: 1;
        min-width: 100%;
        min-height: 100%;
        width: auto;
        height: auto;
        transform: translate3d(-50%, -50%, 0) scale(1.04);
        object-fit: cover;
        opacity: 0;
        filter: grayscale(.18) saturate(.72) contrast(1.12) brightness(.48);
        transition: opacity .55s ease;
      }
      .polish-hero-video-layer.is-polish-video-ready .polish-hero-video {
        opacity: .42;
      }
      .polish-hero-video-fallback {
        position: absolute;
        inset: 0;
        z-index: 0;
        opacity: .18;
        background:
          radial-gradient(circle at 36% 30%, rgba(150,170,255,.20), transparent 30%),
          radial-gradient(circle at 68% 56%, rgba(255,255,255,.12), transparent 28%),
          linear-gradient(135deg, rgba(255,255,255,.06), rgba(255,255,255,0) 54%);
        transition: opacity .45s ease;
      }
      .polish-hero-video-fallback.is-polish-hero-poster {
        opacity: .26;
        background-size: cover;
        background-position: center;
        transform: scale(1.03);
        filter: grayscale(.12) saturate(.76) contrast(1.08) brightness(.56);
      }
      .polish-hero-video-layer.is-polish-video-ready .polish-hero-video-fallback {
        opacity: 0;
      }
      html.polish-hero-video-active #fluid-canvas {
        position: fixed !important;
        inset: 0 !important;
        z-index: 6 !important;
        opacity: .18 !important;
        mix-blend-mode: screen !important;
        pointer-events: none !important;
      }
      /* Suppress only the standalone colored fluid mouse trail while Hero or
         Works is being browsed. The SDF title canvas remains interactive. */
      html.polish-fluid-trail-suppressed #fluid-canvas {
        display: block !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
      .polish-hero-scroll-motion {
        --polish-hero-content-y: 0px;
        --polish-hero-content-scale: 1;
        --polish-hero-content-opacity: 1;
        --polish-hero-indicator-y: 0px;
        --polish-hero-indicator-opacity: .86;
        position: relative;
        z-index: 1;
        background: transparent !important;
        isolation: isolate;
        overflow-x: clip !important;
        overflow-y: visible !important;
        max-width: 100vw;
        contain: none !important;
      }
      .polish-hero-scroll-motion > .polish-hero-video-layer {
        position: fixed;
        inset: -8svh 0;
        z-index: 0;
        height: auto;
        min-height: 116svh;
        transform: translate3d(0, var(--polish-hero-video-y, 0px), 0) scale(var(--polish-hero-video-scale, 1));
        transform-origin: center center;
        opacity: 1;
        contain: paint;
        will-change: transform, opacity;
      }
      .polish-hero-scroll-motion > .polish-hero-decor {
        position: fixed !important;
      }
      .polish-hero-scroll-motion.is-polish-hero-video-hidden > .polish-hero-video-layer {
        opacity: 0;
        visibility: hidden;
        transition: none;
      }
      .polish-hero-scroll-content {
        position: fixed;
        left: 50%;
        top: 50svh;
        z-index: 8;
        width: min(calc(100vw - 48px), 64rem);
        max-width: calc(100vw - 48px) !important;
        margin: 0 !important;
        translate: none !important;
        transform: translate3d(-50%, calc(-50% + var(--polish-hero-content-y, 0px)), 0) scale(var(--polish-hero-content-scale, 1)) !important;
        transform-origin: 50% 54%;
        opacity: var(--polish-hero-content-opacity, 1) !important;
        pointer-events: none;
        will-change: transform, opacity !important;
      }
      html.polish-title-entrance-active .polish-hero-scroll-content {
        translate: none !important;
        transform: translate3d(-50%, calc(-50% + var(--polish-hero-content-y, 0px)), 0) scale(var(--polish-hero-content-scale, 1)) !important;
        opacity: var(--polish-hero-content-opacity, 1) !important;
      }
      .polish-hero-scroll-motion.is-polish-hero-video-hidden > .polish-hero-scroll-content {
        opacity: 0 !important;
        visibility: hidden;
      }
      .polish-hero-decor {
        backface-visibility: hidden;
        transform-style: flat;
        will-change: auto !important;
        max-width: 100vw;
        overflow: hidden;
        contain: paint;
      }
      html.polish-hero-decor-static .polish-hero-decor,
      html.polish-hero-decor-static .polish-hero-decor * {
        animation: none !important;
        transition: none !important;
        will-change: auto !important;
      }
      html.polish-hero-decor-static .polish-hero-decor:not(.polish-hero-decor-glow) {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }
      .polish-hero-decor-glow {
        left: 0 !important;
        right: 0 !important;
        width: 100vw !important;
        max-width: 100vw !important;
        display: flex;
        justify-content: center;
        transform: translate3d(0, -50%, 0) !important;
      }
      .polish-hero-decor > [class*="w-\\[800px\\]"] {
        width: min(800px, 112vw) !important;
        max-width: 112vw;
        flex: 0 0 auto;
      }
      .polish-hero-decor-circles {
        opacity: .62;
      }
      .polish-hero-decor-circles [class*="rounded-full"] {
        border-color: rgba(255,255,255,.026) !important;
      }
      .polish-hero-decor-corners > [class*="top-8"] {
        top: calc(64px + clamp(16px, 1.6vw, 28px)) !important;
      }
      .polish-hero-decor-strip {
        opacity: .030 !important;
        max-width: 100vw;
        overflow: hidden !important;
        contain: paint;
      }
      .polish-hero-decor-strip > .flex {
        width: 100vw !important;
        max-width: 100vw !important;
        min-width: 0 !important;
        overflow: hidden !important;
        contain: paint;
      }
      html.polish-hero-decor-static .polish-hero-decor-strip > .flex,
      html.polish-hero-decor-static .polish-hero-decor-strip .animate-scroll-horizontal {
        animation: none !important;
        transform: none !important;
      }
      @media (max-width: 900px), (hover: none), (pointer: coarse) {
        .polish-hero-decor-strip {
          display: none !important;
        }
        .polish-hero-decor-corners {
          display: none !important;
        }
        .polish-hero-decor > [class*="w-\\[800px\\]"] {
          width: min(620px, 118vw) !important;
          max-width: 118vw;
        }
      }
      .polish-hero-cover-main {
        position: relative;
        background: #020203;
        isolation: isolate;
      }
      .polish-hero-cover-section {
        position: relative;
        z-index: 4;
        background-color: #020203;
      }
      .polish-hero-cover-section:not(.polish-hero-cover-first-section) {
        opacity: 1 !important;
        transform: none !important;
        translate: none !important;
      }
      .polish-hero-cover-first-section {
        background-color: #020203;
        background-image:
          linear-gradient(
            180deg,
            rgba(255,255,255,.034) 0px,
            rgba(255,255,255,.012) 72px,
            rgba(2,2,3,0) 150px,
            #020203 100%
          );
        background-repeat: no-repeat;
        margin-top: clamp(-170px, -16vh, -96px);
        border-radius: clamp(26px, 2.6vw, 42px) clamp(26px, 2.6vw, 42px) 0 0;
        box-shadow:
          0 -1px 0 rgba(255,255,255,.10),
          0 -34px 90px rgba(0,0,0,.42);
        overflow: clip;
        transform: none;
        will-change: auto;
      }
      .polish-hero-cover-main > footer {
        position: relative;
        z-index: 4;
        background: #020203;
      }
      .polish-static-stats,
      .polish-static-stats *,
      .polish-static-stat,
      .polish-static-stat * {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        animation: none !important;
      }
      .polish-static-stats {
        opacity: 1 !important;
      }
      .polish-static-body-copy,
      .polish-static-body-copy *,
      .polish-static-body-zone,
      .polish-static-body-section,
      .polish-static-statement-copy,
      .polish-static-statement-copy *,
      .polish-static-statement-zone,
      .polish-static-statement-section {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        animation: none !important;
      }
      .polish-static-body-section,
      .polish-static-statement-section {
        opacity: 1 !important;
      }
      .polish-hero-cover-first-section::before {
        display: none;
      }
      .polish-scroll-indicator {
        position: fixed !important;
        left: 50% !important;
        right: auto !important;
        top: auto !important;
        bottom: clamp(54px, 9vh, 96px) !important;
        transform: translate3d(-50%, var(--polish-hero-indicator-y, 0px), 0) !important;
        opacity: var(--polish-hero-indicator-opacity, .86) !important;
        z-index: 7;
        width: max-content;
        max-width: 144px;
        filter: drop-shadow(0 0 16px rgba(255,255,255,.14));
      }
      .polish-scroll-indicator a {
        align-items: center !important;
        gap: 8px !important;
        text-align: center;
        transform: none !important;
        color: rgba(255,255,255,.58) !important;
      }
      .polish-scroll-indicator span {
        font-size: 10px !important;
        letter-spacing: .28em !important;
        color: rgba(255,255,255,.48) !important;
        text-shadow: 0 0 18px rgba(255,255,255,.18);
      }
      .polish-scroll-indicator svg {
        width: 18px !important;
        height: 18px !important;
        opacity: .92;
        color: rgba(255,255,255,.72);
        filter: drop-shadow(0 0 10px rgba(255,255,255,.22));
        animation: polish-scroll-cue-pulse 1.8s cubic-bezier(.16,1,.3,1) infinite;
      }
      @keyframes polish-scroll-cue-pulse {
        0%, 100% {
          opacity: .62;
          transform: translate3d(0, 0, 0);
        }
        48% {
          opacity: 1;
          transform: translate3d(0, 4px, 0);
        }
      }
      @media (max-width: 640px) {
        .polish-scroll-indicator {
          display: block !important;
          bottom: max(30px, calc(env(safe-area-inset-bottom) + 20px)) !important;
          max-width: calc(100vw - 48px);
        }
        .polish-scroll-indicator a {
          display: flex !important;
          flex-direction: column !important;
          gap: 6px !important;
        }
      }
      [data-polish-parallax] {
        will-change: translate;
      }
      .polish-hide-system-cursor,
      .polish-hide-system-cursor * {
        cursor: none !important;
      }
      html.polish-native-dot-cursor,
      html.polish-native-dot-cursor * {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='3.2' fill='white' stroke='black' stroke-opacity='.58' stroke-width='1.15'/%3E%3C/svg%3E") 8 8, auto !important;
      }
      html:not(.polish-custom-cursor-ready) main.cursor-none,
      html:not(.polish-custom-cursor-ready) main.cursor-none * {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='3.2' fill='white' stroke='black' stroke-opacity='.58' stroke-width='1.15'/%3E%3C/svg%3E") 8 8, auto !important;
      }
      @media (hover: none), (pointer: coarse) {
        .polish-hide-system-cursor,
        .polish-hide-system-cursor *,
        .polish-native-dot-cursor,
        .polish-native-dot-cursor *,
        html:not(.polish-custom-cursor-ready) main.cursor-none,
        html:not(.polish-custom-cursor-ready) main.cursor-none * {
          cursor: auto !important;
        }
        .polish-project-detail [data-cursor="pointer"],
        .polish-project-detail [data-cursor="pointer"] * {
          cursor: auto !important;
        }
        .polish-click-cursor,
        .polish-click-ring,
        .polish-click-burst {
          display: none !important;
        }
      }
      .polish-native-cursor-hidden {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
      .polish-marquee-removed {
        position: relative;
        z-index: 6;
        display: block !important;
        height: clamp(280px, 40vh, 540px) !important;
        min-height: clamp(280px, 40vh, 540px) !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        overflow: hidden !important;
        pointer-events: none;
        background:
          linear-gradient(
            180deg,
            rgba(2,2,3,0) 0%,
            rgba(2,2,3,0) 42%,
            rgba(2,2,3,.18) 68%,
            rgba(2,2,3,.68) 88%,
            #020203 100%
          );
      }
      .polish-marquee-removed::before {
        display: none !important;
      }
      .polish-marquee-removed > * {
        display: none !important;
      }
      @media (max-width: 900px) {
        .polish-hero-scroll-content {
          top: 48svh;
          width: min(calc(100vw - 32px), 64rem);
          max-width: calc(100vw - 32px) !important;
        }
        .polish-hero-cover-first-section {
          margin-top: clamp(-132px, -14vh, -76px);
          border-radius: 22px 22px 0 0;
        }
        .polish-marquee-removed {
          height: clamp(240px, 38vh, 420px) !important;
          min-height: clamp(240px, 38vh, 420px) !important;
        }
      }
      .polish-click-cursor {
        position: fixed;
        left: 0;
        top: 0;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        opacity: 0;
        border: 0;
        background: rgba(255,255,255,.94);
        box-shadow:
          0 0 0 1px rgba(0,0,0,.52),
          0 0 10px rgba(255,255,255,.26),
          0 1px 3px rgba(0,0,0,.42);
        transform: translate3d(-80px, -80px, 0) scale(.9);
        transition: opacity .16s ease, background-color .16s ease, box-shadow .16s ease;
        mix-blend-mode: difference;
        will-change: transform, opacity;
      }
      html.polish-native-dot-cursor .polish-click-cursor {
        display: none !important;
      }
      /* The native dot is the normal pointer treatment. While the detail
         curtain exposes its side-close affordance, replace that dot with the
         larger X cursor so the state is visible before the click. */
      html.polish-native-dot-cursor.polish-detail-side-close-hot,
      html.polish-native-dot-cursor.polish-detail-side-close-hot * {
        cursor: none !important;
      }
      html.polish-native-dot-cursor.polish-detail-side-close-hot .polish-click-cursor {
        display: block !important;
      }
      html.polish-native-dot-cursor.polish-cursor-interactive-hot,
      html.polish-native-dot-cursor.polish-cursor-interactive-hot * {
        cursor: none !important;
      }
      html.polish-native-dot-cursor.polish-cursor-interactive-hot .polish-click-cursor {
        display: block !important;
      }
      .polish-click-cursor::before,
      .polish-click-cursor::after {
        content: "";
        position: absolute;
        left: 50%;
        top: 50%;
        width: 12px;
        height: 1.1px;
        border-radius: 999px;
        opacity: 0;
        background: rgba(255,255,255,.92);
        filter: drop-shadow(0 0 3px rgba(255,255,255,.2));
        transform-origin: 50% 50%;
        transition: opacity .16s ease, transform .24s cubic-bezier(.16, 1, .3, 1);
      }
      .polish-click-cursor::before {
        transform: translate3d(-50%, -50%, 0) rotate(42deg) scaleX(.28);
      }
      .polish-click-cursor::after {
        transform: translate3d(-50%, -50%, 0) rotate(-42deg) scaleX(.28);
      }
      .polish-click-cursor.is-visible {
        opacity: .96;
      }
      .polish-click-cursor.is-priming,
      .polish-click-ring.is-priming {
        transition: none !important;
      }
      .polish-click-ring.is-handoff-hidden {
        opacity: 0 !important;
      }
      .polish-click-cursor.is-passive-hidden,
      .polish-click-ring.is-passive-hidden {
        opacity: 0 !important;
      }
      .polish-click-cursor.is-active {
        opacity: 1;
        box-shadow:
          0 0 0 1px rgba(0,0,0,.58),
          0 0 20px rgba(255,255,255,.34),
          0 1px 4px rgba(0,0,0,.48);
      }
      .polish-click-ring {
        position: fixed;
        left: 0;
        top: 0;
        --polish-ring-size: 35px;
        --polish-ring-dot: 3px;
        --polish-ring-orbit-radius: 17px;
        width: var(--polish-ring-size);
        height: var(--polish-ring-size);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9997;
        opacity: 0;
        border: 1px solid rgba(255,255,255,.42);
        box-shadow:
          0 0 0 1px rgba(0,0,0,.34),
          0 0 14px rgba(255,255,255,.08),
          inset 0 0 8px rgba(255,255,255,.03);
        transform: translate3d(-90px, -90px, 0) scale(.92);
        transition: opacity .2s ease, border-color .18s ease, box-shadow .18s ease, width .18s ease, height .18s ease;
        mix-blend-mode: difference;
        will-change: transform, opacity;
      }
      .polish-click-ring.is-visible {
        opacity: .58;
      }
      .polish-click-ring.is-active {
        opacity: .86;
        border-color: rgba(255,255,255,.58);
        box-shadow:
          0 0 0 1px rgba(0,0,0,.38),
          0 0 18px rgba(255,255,255,.13),
          inset 0 0 9px rgba(255,255,255,.045);
      }
      .polish-click-ring::after {
        content: "";
        position: absolute;
        left: 50%;
        top: 50%;
        width: var(--polish-ring-dot);
        height: var(--polish-ring-dot);
        border-radius: 50%;
        opacity: 0;
        background: rgba(255,255,255,.92);
        box-shadow: 0 0 0 1px rgba(0,0,0,.44), 0 0 6px rgba(255,255,255,.35);
        transform: rotate(0deg) translateX(var(--polish-ring-orbit-radius)) translate(-50%, -50%);
        transform-origin: 0 0;
        transition: opacity .16s ease;
        animation: polish-ring-orbit 3.2s linear infinite;
      }
      .polish-click-ring.is-active::after {
        opacity: .9;
      }
      html.polish-detail-side-close-hot .polish-click-cursor {
        background: rgba(255,255,255,0);
        box-shadow: none;
      }
      html.polish-detail-side-close-hot .polish-click-cursor::before,
      html.polish-detail-side-close-hot .polish-click-cursor::after {
        opacity: .96;
      }
      html.polish-detail-side-close-hot .polish-click-cursor::before {
        transform: translate3d(-50%, -50%, 0) rotate(42deg) scaleX(1);
      }
      html.polish-detail-side-close-hot .polish-click-cursor::after {
        transform: translate3d(-50%, -50%, 0) rotate(-42deg) scaleX(1);
      }
      html.polish-detail-side-close-hot .polish-click-ring {
        opacity: .7;
        border-color: rgba(255,255,255,.5);
        box-shadow:
          0 0 0 1px rgba(0,0,0,.36),
          0 0 14px rgba(255,255,255,.09),
          inset 0 0 8px rgba(255,255,255,.035);
      }
      html.polish-detail-side-close-hot .polish-click-ring::after {
        opacity: 0;
        animation-play-state: paused;
      }
      .polish-click-burst {
        position: fixed;
        left: 0;
        top: 0;
        width: 112px;
        height: 112px;
        margin-left: -56px;
        margin-top: -56px;
        pointer-events: none;
        z-index: 9996;
        opacity: .95;
        overflow: visible;
        mix-blend-mode: screen;
        transform: translate3d(var(--polish-burst-x, -120px), var(--polish-burst-y, -120px), 0);
        contain: layout style;
      }
      .polish-click-burst__layer {
        position: absolute;
        inset: 40px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,.72);
        box-shadow: 0 0 12px rgba(255,255,255,.18);
        opacity: 0;
        transform: translate3d(0,0,0) scale(.22);
        animation: polish-click-burst-layer .62s cubic-bezier(.16, 1, .3, 1) forwards;
        animation-delay: var(--polish-burst-delay, 0s);
      }
      .polish-click-burst__layer:nth-child(2) {
        inset: 35px;
        border-color: rgba(255,255,255,.48);
        --polish-burst-delay: .035s;
      }
      .polish-click-burst__layer:nth-child(3) {
        inset: 31px;
        border-color: rgba(255,255,255,.30);
        --polish-burst-delay: .07s;
      }
      .polish-click-burst__layer:nth-child(4) {
        inset: 45px;
        border-color: rgba(255,255,255,.82);
        --polish-burst-delay: .015s;
      }
      .polish-click-burst__core {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 5px;
        height: 5px;
        margin-left: -2.5px;
        margin-top: -2.5px;
        border-radius: 50%;
        background: rgba(255,255,255,.96);
        box-shadow: 0 0 14px rgba(255,255,255,.42);
        animation: polish-click-burst-core .42s cubic-bezier(.16, 1, .3, 1) forwards;
      }
      @keyframes polish-ring-orbit {
        from {
          transform: rotate(0deg) translateX(var(--polish-ring-orbit-radius)) translate(-50%, -50%);
        }
        to {
          transform: rotate(360deg) translateX(var(--polish-ring-orbit-radius)) translate(-50%, -50%);
        }
      }
      @keyframes polish-click-burst-layer {
        0% {
          opacity: 0;
          transform: translate3d(calc(var(--polish-burst-dx, 0px) * -.16), calc(var(--polish-burst-dy, 0px) * -.16), 0) scale(.16);
        }
        18% {
          opacity: .9;
        }
        100% {
          opacity: 0;
          transform: translate3d(var(--polish-burst-dx, 0px), var(--polish-burst-dy, 0px), 0) scale(1.72);
        }
      }
      @keyframes polish-click-burst-core {
        0% {
          opacity: 1;
          transform: scale(1);
        }
        100% {
          opacity: 0;
          transform: scale(3.8);
        }
      }
      .polish-click-target {
        transition: border-color .22s ease, background-color .22s ease, color .22s ease;
        will-change: transform;
      }
      .polish-click-target.is-polish-hot {
        transform: translate3d(var(--polish-magnetic-x, 0px), var(--polish-magnetic-y, 0px), 0);
      }
      .polish-mobile-menu-fallback {
        display: none;
      }
      .polish-mobile-nav-dock {
        display: none;
      }
      @media (min-width: 901px) and (hover: hover) and (pointer: fine) {
        .polish-mobile-nav-dock,
        .polish-mobile-menu-fallback,
        .polish-mobile-menu-panel {
          display: none !important;
        }
      }
      .polish-mobile-menu-panel {
        position: fixed;
        inset: 0;
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 92px 28px 42px;
        overflow-y: auto;
        overscroll-behavior: contain;
        background:
          radial-gradient(circle at 72% 16%, rgba(255,255,255,.105), transparent 32%),
          radial-gradient(circle at 18% 78%, rgba(110,135,255,.045), transparent 36%),
          linear-gradient(180deg, rgba(2,2,3,.58), rgba(2,2,3,.72));
        -webkit-backdrop-filter: blur(34px) saturate(1.22) brightness(.72);
        backdrop-filter: blur(34px) saturate(1.22) brightness(.72);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: translate3d(0, -10px, 0) scale(.985);
        transform-origin: 50% 0;
        transition:
          opacity .28s cubic-bezier(.16, 1, .3, 1),
          transform .34s cubic-bezier(.16, 1, .3, 1),
          visibility 0s linear .34s;
        will-change: opacity, transform;
        contain: paint;
      }
      .polish-mobile-menu-panel.is-open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: translate3d(0, 0, 0) scale(1);
        transition-delay: 0s;
      }
      .polish-mobile-menu-panel.is-closed {
        opacity: 0;
        visibility: hidden !important;
        pointer-events: none;
        transform: translate3d(0, -10px, 0) scale(.985);
      }
      .polish-mobile-menu-panel.is-closing {
        opacity: 1;
        visibility: visible;
        pointer-events: none;
        transform: translate3d(0, 0, 0) scale(1);
        animation: polish-mobile-menu-panel-out .68s cubic-bezier(.55, 0, .2, 1) both;
      }
      @keyframes polish-mobile-menu-panel-out {
        0%, 68% {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate3d(0, -10px, 0) scale(.985);
        }
      }
      .polish-mobile-menu-panel__inner {
        width: min(100%, 340px);
        display: grid;
        gap: 18px;
        opacity: 0;
        transform: translate3d(0, 18px, 0) scale(.99);
        transition:
          opacity .26s cubic-bezier(.16, 1, .3, 1),
          transform .34s cubic-bezier(.16, 1, .3, 1);
        will-change: opacity, transform;
      }
      .polish-mobile-menu-panel.is-open .polish-mobile-menu-panel__inner {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
      }
      .polish-mobile-menu-panel.is-closed .polish-mobile-menu-panel__inner {
        opacity: 0;
        transform: translate3d(0, 18px, 0) scale(.99);
      }
      .polish-mobile-menu-panel.is-closing .polish-mobile-menu-panel__inner {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
        animation: polish-mobile-menu-inner-out .66s cubic-bezier(.55, 0, .2, 1) both;
      }
      @keyframes polish-mobile-menu-inner-out {
        0%, 64% {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate3d(0, 18px, 0) scale(.99);
        }
      }
      .polish-mobile-menu-panel a {
        --polish-mobile-menu-enter-y: 26px;
        --polish-mobile-menu-scale: .965;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 58px;
        padding: 0 2px;
        border-bottom: 1px solid rgba(255,255,255,.10);
        color: rgba(255,255,255,.82);
        text-decoration: none;
        font-family: var(--polish-font-accent);
        font-style: oblique;
        font-size: clamp(26px, 8vw, 38px);
        font-weight: 400;
        line-height: 1;
        letter-spacing: .01em;
        font-synthesis: none;
        text-rendering: geometricPrecision;
        opacity: 0;
        filter: blur(10px);
        transform: translate3d(var(--polish-mobile-menu-x, 0px), calc(var(--polish-mobile-menu-y, 0px) + var(--polish-mobile-menu-enter-y)), 0) scale(var(--polish-mobile-menu-scale));
        transition:
          opacity .34s ease,
          transform .46s cubic-bezier(.16, 1, .3, 1),
          color .22s ease,
          border-color .22s ease,
          filter .38s ease;
        transition-delay: 0ms;
        will-change: opacity, transform;
      }
      @keyframes polish-mobile-menu-link-in {
        0% {
          opacity: 0;
          filter: blur(11px);
          transform: translate3d(var(--polish-mobile-menu-x, 0px), calc(var(--polish-mobile-menu-y, 0px) + 28px), 0) scale(.955);
        }
        62% {
          opacity: 1;
        }
        100% {
          opacity: 1;
          filter: blur(0);
          transform: translate3d(var(--polish-mobile-menu-x, 0px), var(--polish-mobile-menu-y, 0px), 0) scale(1);
        }
      }
      @keyframes polish-mobile-menu-link-out {
        0% {
          opacity: 1;
          filter: blur(0);
          transform: translate3d(var(--polish-mobile-menu-x, 0px), var(--polish-mobile-menu-y, 0px), 0) scale(1);
        }
        100% {
          opacity: 0;
          filter: blur(11px);
          transform: translate3d(var(--polish-mobile-menu-x, 0px), calc(var(--polish-mobile-menu-y, 0px) + 28px), 0) scale(.955);
        }
      }
      .polish-mobile-menu-panel.is-open a {
        --polish-mobile-menu-enter-y: 0px;
        --polish-mobile-menu-scale: 1;
        opacity: 1;
        filter: blur(0);
        transition-delay: var(--polish-mobile-menu-delay, 0ms);
        animation: polish-mobile-menu-link-in .52s cubic-bezier(.16, 1, .3, 1) backwards;
        animation-delay: var(--polish-mobile-menu-delay, 0ms);
      }
      .polish-mobile-menu-panel.is-closed a {
        --polish-mobile-menu-enter-y: 14px;
        --polish-mobile-menu-scale: .985;
        opacity: 0;
        filter: blur(7px);
        transition-delay: 0ms;
        animation: none;
      }
      .polish-mobile-menu-panel.is-closing a {
        --polish-mobile-menu-enter-y: 28px;
        --polish-mobile-menu-scale: .955;
        opacity: 0;
        filter: blur(11px);
        transition-delay: var(--polish-mobile-menu-exit-delay, 0ms);
        animation: polish-mobile-menu-link-out .46s cubic-bezier(.55, 0, .2, 1) both;
        animation-delay: var(--polish-mobile-menu-exit-delay, 0ms);
      }
      .polish-mobile-menu-panel a::before {
        content: "";
        position: absolute;
        left: -18px;
        top: 50%;
        width: 10px;
        height: 1px;
        border-radius: 999px;
        background: rgba(255,255,255,.62);
        opacity: 0;
        transform: translate3d(-4px, -50%, 0) scaleX(.35);
        transform-origin: left center;
        transition:
          opacity .22s ease,
          transform .22s ease;
      }
      .polish-mobile-menu-panel a:hover,
      .polish-mobile-menu-panel a:focus-visible,
      .polish-mobile-menu-panel a.is-polish-menu-hot {
        color: rgba(255,255,255,.98);
        border-color: rgba(255,255,255,.26);
        filter: drop-shadow(0 0 18px rgba(255,255,255,.12));
      }
      .polish-mobile-menu-panel a:hover::before,
      .polish-mobile-menu-panel a:focus-visible::before,
      .polish-mobile-menu-panel a.is-polish-menu-hot::before {
        opacity: 1;
        transform: translate3d(0, -50%, 0) scaleX(1);
      }
      .polish-mobile-menu-panel a:active {
        transform: translate3d(var(--polish-mobile-menu-x, 0px), calc(var(--polish-mobile-menu-y, 0px) + var(--polish-mobile-menu-enter-y)), 0) scale(.985);
      }
      @media (max-height: 620px) and (max-width: 900px) {
        .polish-mobile-menu-panel {
          align-items: flex-start;
          padding: 76px 24px 28px;
        }
        .polish-mobile-menu-panel__inner {
          gap: 10px;
        }
        .polish-mobile-menu-panel a {
          min-height: 48px;
          font-size: clamp(22px, 8vh, 32px);
        }
      }
      .polish-mobile-menu-panel a span {
        font-family: var(--polish-font-mono);
        font-style: normal;
        font-size: 11px;
        font-weight: 500;
        line-height: 1;
        letter-spacing: .18em;
        text-transform: uppercase;
        font-variant-numeric: tabular-nums;
        font-feature-settings: "tnum" 1;
        font-synthesis: none;
        color: rgba(255,255,255,.34);
      }
      html.polish-compact-nav nav {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        transform: none !important;
      }
      html.polish-compact-nav .polish-mobile-nav-dock {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 2147480000;
        display: flex !important;
        align-items: center;
        justify-content: space-between;
        height: calc(64px + env(safe-area-inset-top, 0px));
        padding: env(safe-area-inset-top, 0px) 24px 0;
        background: rgba(4,5,7,.58);
        border-bottom: 1px solid rgba(255,255,255,.045);
        -webkit-backdrop-filter: blur(20px) saturate(1.14);
        backdrop-filter: blur(20px) saturate(1.14);
        pointer-events: auto;
      }
      html.polish-compact-nav .polish-mobile-nav-brand {
        color: rgba(255,255,255,.72);
        text-decoration: none;
        font-family: var(--polish-font-accent);
        font-style: oblique;
        font-size: 13px;
        font-weight: 400;
        line-height: 1;
        letter-spacing: .18em;
        font-synthesis: none;
        text-rendering: geometricPrecision;
        text-transform: uppercase;
      }
      html.polish-compact-nav .polish-mobile-nav-brand span {
        color: rgba(255,255,255,.30);
      }
      html.polish-compact-nav .polish-mobile-menu-fallback {
        position: relative;
        z-index: 3;
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        width: 40px;
        min-width: 40px;
        height: 40px;
        margin-right: -10.5px;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
        color: rgba(255,255,255,.66) !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
        -webkit-appearance: none;
        appearance: none;
        -webkit-backdrop-filter: none;
        backdrop-filter: none;
      }
      html.polish-compact-nav .polish-mobile-menu-fallback span {
        position: absolute;
        left: 50%;
        width: 19px;
        height: 1.5px;
        border-radius: 999px;
        background: currentColor;
        box-shadow: 0 0 7px rgba(255,255,255,.07);
        transform: translateX(-50%);
        transition: transform .22s ease, top .22s ease, opacity .18s ease;
      }
      html.polish-compact-nav .polish-mobile-menu-fallback span:nth-child(1) {
        top: 14px;
      }
      html.polish-compact-nav .polish-mobile-menu-fallback span:nth-child(2) {
        top: 20px;
      }
      html.polish-compact-nav .polish-mobile-menu-fallback span:nth-child(3) {
        top: 26px;
      }
      html.polish-compact-nav .polish-mobile-menu-fallback.is-open span:nth-child(1) {
        top: 20px;
        transform: translateX(calc(-50% + 1.94px)) rotate(42deg);
      }
      html.polish-compact-nav .polish-mobile-menu-fallback.is-open span:nth-child(2) {
        opacity: 0;
      }
      html.polish-compact-nav .polish-mobile-menu-fallback.is-open span:nth-child(3) {
        top: 20px;
        transform: translateX(calc(-50% + 1.94px)) rotate(-42deg);
      }
      html.polish-compact-nav .polish-mobile-menu-panel {
        z-index: 2147479000;
        padding-top: calc(92px + env(safe-area-inset-top, 0px));
      }
      html.polish-detail-open .polish-mobile-nav-dock,
      html.polish-detail-open .polish-mobile-menu-panel {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      html:not(.polish-compact-nav) .polish-mobile-nav-dock,
      html:not(.polish-compact-nav) .polish-mobile-menu-panel {
        display: none !important;
      }
      html.polish-mobile-menu-open .polish-mobile-menu-panel.is-open {
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
        transform: translate3d(0, 0, 0) scale(1) !important;
      }
      html.polish-mobile-menu-open .polish-mobile-menu-panel.is-open .polish-mobile-menu-panel__inner {
        opacity: 1 !important;
        transform: translate3d(0, 0, 0) scale(1) !important;
      }
      html.polish-mobile-menu-open .polish-mobile-menu-panel.is-open a {
        --polish-mobile-menu-enter-y: 0px;
        --polish-mobile-menu-scale: 1;
        opacity: 1;
        filter: blur(0);
        transition-delay: var(--polish-mobile-menu-delay, 0ms);
      }
      @media (hover: none), (pointer: coarse) {
        html.polish-hide-system-cursor,
        html.polish-hide-system-cursor *,
        html.polish-native-dot-cursor,
        html.polish-native-dot-cursor *,
        main.cursor-none,
        main.cursor-none * {
          cursor: auto !important;
        }
        .polish-click-cursor,
        .polish-click-ring,
        .polish-click-burst,
        main.cursor-none > div.fixed.top-0.left-0.z-\\[9999\\],
        main.cursor-none > div.fixed.top-0.left-0.z-\\[9998\\] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
      }
      #projects [data-cursor="pointer"] {
        position: relative;
        overflow: visible;
        isolation: isolate;
        contain: paint;
        padding-left: clamp(18px, 2.3vw, 34px);
        padding-right: clamp(18px, 2.2vw, 30px);
        background:
          linear-gradient(90deg, rgba(255,255,255,.010), transparent 52%),
          rgba(255,255,255,.004);
        transition:
          border-color .26s ease,
          background-color .26s ease,
          box-shadow .26s ease;
        border-color: rgba(255,255,255,.075) !important;
        border-radius: 10px;
        transform: none !important;
      }
      #projects [data-cursor="pointer"] + [data-cursor="pointer"] {
        margin-top: 10px;
      }
      #projects [data-cursor="pointer"]::before,
      #projects [data-cursor="pointer"]::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
      }
      #projects [data-cursor="pointer"]::before {
        left: 0;
        right: auto;
        top: 22%;
        bottom: 22%;
        width: 1px;
        background: linear-gradient(180deg, transparent, rgba(255,255,255,.46), transparent);
        opacity: .13;
        transform: scaleY(.18);
        transform-origin: 50% 0%;
        transition:
          transform .46s cubic-bezier(.16,1,.3,1),
          opacity .18s ease;
        will-change: transform, opacity;
      }
      #projects [data-cursor="pointer"]::after {
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        border-radius: inherit;
        border: 1px solid rgba(255,255,255,.050);
        background:
          radial-gradient(ellipse at 0% 50%, rgba(255,255,255,.032), transparent 58%),
          linear-gradient(90deg, rgba(255,255,255,.014), rgba(255,255,255,.006) 46%, transparent 72%);
        opacity: 0;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.018);
        transition: opacity .24s ease, border-color .24s ease;
      }
      #projects [data-cursor="pointer"] > * {
        position: relative;
        z-index: 1;
      }
      #projects [data-cursor="pointer"]:hover,
      #projects [data-cursor="pointer"]:focus-within,
      #projects [data-cursor="pointer"].is-polish-hot,
      #projects [data-cursor="pointer"].is-polish-hovered {
        border-color: rgba(255,255,255,.18) !important;
        background-color: rgba(255,255,255,.010);
        box-shadow: 0 18px 48px rgba(0,0,0,.12);
      }
      #projects [data-cursor="pointer"]:hover::before,
      #projects [data-cursor="pointer"]:focus-within::before,
      #projects [data-cursor="pointer"].is-polish-hot::before,
      #projects [data-cursor="pointer"].is-polish-hovered::before {
        opacity: .56;
        transform: scaleY(1);
      }
      #projects [data-cursor="pointer"]:hover::after,
      #projects [data-cursor="pointer"]:focus-within::after,
      #projects [data-cursor="pointer"].is-polish-hot::after,
      #projects [data-cursor="pointer"].is-polish-hovered::after {
        opacity: 1;
        border-color: rgba(255,255,255,.090);
      }
      #projects [data-cursor="pointer"] h3,
      #projects [data-cursor="pointer"] p,
      #projects [data-cursor="pointer"] svg,
      #projects [data-cursor="pointer"] span {
        transition:
          color .22s ease,
          border-color .22s ease,
          opacity .22s ease,
          transform .32s cubic-bezier(.16,1,.3,1);
      }
      #projects [data-cursor="pointer"]:hover h3,
      #projects [data-cursor="pointer"]:focus-within h3,
      #projects [data-cursor="pointer"].is-polish-hot h3,
      #projects [data-cursor="pointer"].is-polish-hovered h3 {
        color: rgba(255,255,255,.84) !important;
        transform: none;
      }
      #projects [data-cursor="pointer"]:hover p,
      #projects [data-cursor="pointer"]:focus-within p,
      #projects [data-cursor="pointer"].is-polish-hot p,
      #projects [data-cursor="pointer"].is-polish-hovered p {
        color: rgba(255,255,255,.52) !important;
        transition-delay: .035s;
      }
      #projects [data-cursor="pointer"]:hover span,
      #projects [data-cursor="pointer"]:focus-within span,
      #projects [data-cursor="pointer"].is-polish-hot span,
      #projects [data-cursor="pointer"].is-polish-hovered span {
        color: rgba(255,255,255,.40) !important;
      }
      #projects [data-cursor="pointer"]:hover span[class*="rounded-full"],
      #projects [data-cursor="pointer"]:focus-within span[class*="rounded-full"],
      #projects [data-cursor="pointer"].is-polish-hot span[class*="rounded-full"],
      #projects [data-cursor="pointer"].is-polish-hovered span[class*="rounded-full"] {
        border-color: rgba(255,255,255,.18) !important;
        color: rgba(255,255,255,.48) !important;
        background: rgba(255,255,255,.010);
        transition-delay: .07s;
      }
      #projects [data-cursor="pointer"]:hover svg,
      #projects [data-cursor="pointer"]:focus-within svg,
      #projects [data-cursor="pointer"].is-polish-hot svg,
      #projects [data-cursor="pointer"].is-polish-hovered svg {
        color: rgba(255,255,255,.42) !important;
        opacity: .78;
        transform: translate3d(1px,-2px,0);
      }
      #projects [data-cursor="pointer"]:active::after {
        opacity: .72;
      }
      html.polish-hover-sync-scrolling #projects [data-cursor="pointer"]:hover:not(.is-polish-hovered) {
        border-color: rgba(255,255,255,.075) !important;
        background:
          linear-gradient(90deg, rgba(255,255,255,.010), transparent 52%),
          rgba(255,255,255,.004);
        box-shadow: none;
      }
      html.polish-hover-sync-scrolling #projects [data-cursor="pointer"]:hover:not(.is-polish-hovered)::before {
        opacity: .13;
        transform: scaleY(.18);
      }
      html.polish-hover-sync-scrolling #projects [data-cursor="pointer"]:hover:not(.is-polish-hovered)::after {
        opacity: 0;
      }
      html.polish-hover-sync-scrolling #projects [data-cursor="pointer"]:hover:not(.is-polish-hovered) h3,
      html.polish-hover-sync-scrolling #projects [data-cursor="pointer"]:hover:not(.is-polish-hovered) p,
      html.polish-hover-sync-scrolling #projects [data-cursor="pointer"]:hover:not(.is-polish-hovered) span,
      html.polish-hover-sync-scrolling #projects [data-cursor="pointer"]:hover:not(.is-polish-hovered) svg {
        transform: none;
      }
      #about [data-polish-profile-card] {
        border-color: rgba(255,255,255,.13) !important;
        background-color: rgba(255,255,255,.006) !important;
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,.018),
          0 0 0 1px rgba(0,0,0,.18) !important;
        transition:
          border-color .42s cubic-bezier(.16,1,.3,1),
          background-color .42s cubic-bezier(.16,1,.3,1),
          box-shadow .42s cubic-bezier(.16,1,.3,1),
          color .28s ease !important;
      }
      #about [data-polish-profile-card] svg,
      #about [data-polish-profile-card] [class*="text-foreground/30"] {
        transition:
          color .38s cubic-bezier(.16,1,.3,1),
          opacity .38s cubic-bezier(.16,1,.3,1) !important;
      }
      #about [data-polish-profile-card].is-polish-hovered {
        border-color: rgba(255,255,255,.26) !important;
        background-color: rgba(255,255,255,.018) !important;
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,.032),
          0 0 18px rgba(255,255,255,.034) !important;
      }
      #about [data-polish-profile-card].is-polish-hovered svg {
        color: rgba(255,255,255,.60) !important;
      }
      #about [data-polish-profile-card].is-polish-hovered [class*="text-foreground/30"] {
        color: rgba(255,255,255,.50) !important;
      }
      html.polish-hover-sync-scrolling #about [data-polish-profile-card]:hover:not(.is-polish-hovered) {
        border-color: rgba(255,255,255,.13) !important;
        background-color: rgba(255,255,255,.006) !important;
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,.018),
          0 0 0 1px rgba(0,0,0,.18) !important;
      }
      html.polish-hover-sync-scrolling #about [data-polish-profile-card]:hover:not(.is-polish-hovered) svg {
        color: rgba(255,255,255,.30) !important;
      }
      html.polish-hover-sync-scrolling #about [data-polish-profile-card]:hover:not(.is-polish-hovered) [class*="text-foreground/30"] {
        color: rgba(255,255,255,.30) !important;
      }
      main > section:first-of-type > .relative.z-\\[10\\]:not(.polish-hero-scroll-content) {
        opacity: 1 !important;
        transform: none !important;
      }
      .polish-gallery-controls,
      .polish-gallery-count {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        animation: none !important;
      }
      .polish-gallery-section {
        position: relative;
        z-index: 10;
        padding: clamp(128px, 13vw, 160px) 24px;
        overflow: visible;
      }
      .polish-gallery-section::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: clamp(-260px, -28vh, -128px);
        height: clamp(260px, 34vh, 420px);
        z-index: 0;
        pointer-events: none;
        background:
          linear-gradient(
            180deg,
            #020203 0%,
            rgba(2,2,3,.94) 18%,
            rgba(2,2,3,.72) 46%,
            rgba(2,2,3,.34) 74%,
            rgba(2,2,3,0) 100%
          );
      }
      .polish-gallery-shell {
        position: relative;
        z-index: 1;
        width: min(1280px, 100%);
        margin: 0 auto;
      }
      .polish-gallery-head {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 64px;
      }
      .polish-gallery-kicker {
        display: block;
        margin-bottom: 16px;
        font: 11px/1.2 var(--polish-font-mono);
        letter-spacing: .30em;
        text-transform: uppercase;
        color: rgba(255,255,255,.30);
      }
      .polish-gallery-title {
        display: inline-block;
        margin: 0;
        max-width: 780px;
        font-size: clamp(40px, 5.1vw, 64px);
        font-weight: 700;
        line-height: 1.14;
        letter-spacing: 0;
        color: rgba(255,255,255,.90);
        text-shadow: 0 0 26px rgba(255,255,255,.08);
        transform-origin: left 52%;
        will-change: transform;
      }
      .polish-gallery-title-lock {
        display: block;
        min-height: calc(clamp(40px, 5.1vw, 64px) * 2.38);
        overflow: visible;
        contain: layout;
      }
      .polish-gallery-title-muted {
        color: rgba(255,255,255,.30);
      }
      .polish-gallery-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 0 0 auto;
      }
      .polish-gallery-button {
        position: relative;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,.18);
        background: rgba(255,255,255,.035);
        color: rgba(255,255,255,.72);
        display: inline-grid;
        place-items: center;
        transition: border-color .22s ease, background-color .22s ease, color .22s ease, transform .22s ease;
      }
      .polish-gallery-button::before {
        content: "";
        position: absolute;
        inset: -7px;
        border-radius: 50%;
      }
      .polish-gallery-controls,
      .polish-gallery-controls *,
      .polish-gallery-button,
      .polish-gallery-button::before,
      .polish-gallery-button svg {
        cursor: none !important;
      }
      .polish-gallery-button:hover {
        border-color: rgba(255,255,255,.42);
        background: rgba(255,255,255,.075);
        color: rgba(255,255,255,.95);
      }
      .polish-gallery-button:disabled,
      .polish-gallery-button.is-locked {
        opacity: .38;
        pointer-events: none;
      }
      .polish-gallery-count {
        min-width: 58px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
      }
      .polish-gallery-count > span {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: rgba(255,255,255,.25);
        transition: width .28s cubic-bezier(.16, 1, .3, 1), background-color .28s ease;
      }
      .polish-gallery-count > span.is-active {
        width: 16px;
        border-radius: 999px;
        background: rgba(255,255,255,.72);
      }
      .polish-gallery-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: clamp(12px, 1.8vw, 22px);
      }
      .polish-gallery-section.is-polish-works-rail {
        overflow: visible;
      }
      .is-polish-works-rail .polish-gallery-head {
        margin-bottom: 52px;
      }
      .is-polish-works-rail .polish-gallery-controls {
        height: 44px;
      }
      .is-polish-works-rail .polish-gallery-button svg {
        display: block;
        width: 17px;
        height: 17px;
      }
      .is-polish-works-rail .polish-gallery-button:active {
        transform: scale(.94);
        color: rgba(255,255,255,.62);
      }
      .is-polish-works-rail .polish-gallery-count {
        position: relative;
        width: 48px;
        min-width: 48px;
        height: 18px;
        overflow: hidden;
      }
      .is-polish-works-rail .polish-gallery-count::before {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        height: 2px;
        border-radius: 999px;
        background: rgba(255,255,255,.18);
        transform: translateY(-50%);
      }
      .is-polish-works-rail .polish-gallery-count > span {
        position: absolute;
        left: 0;
        top: calc(50% - 2px);
        width: 15px;
        height: 4px;
        border-radius: 999px;
        background: rgba(255,255,255,.74);
        transform: translate3d(calc(var(--polish-progress-phase, 0px) + var(--polish-progress-copy, 0px)),0,0);
        transition: none;
        will-change: transform;
      }
      .polish-works-viewport {
        position: relative;
        z-index: 2;
        width: 100%;
        overflow: hidden;
        cursor: grab;
        touch-action: pan-y;
        user-select: none;
      }
      .polish-works-viewport.is-dragging {
        cursor: grabbing;
      }
      .polish-gallery-section.is-polish-works-rail .polish-gallery-grid {
        --polish-works-gap: clamp(10px, 1.3vw, 16px);
        height: clamp(392px, 42vw, 600px);
        display: flex;
        gap: var(--polish-works-gap);
        transform: translate3d(0,0,0);
        will-change: transform;
      }
      .polish-works-page {
        flex: 0 0 100%;
        min-width: 0;
        display: flex;
        gap: var(--polish-works-gap);
      }
      .polish-gallery-section.is-polish-works-rail .polish-layer-tile {
        --polish-card-weight: 1;
        --polish-card-mx: 0;
        --polish-card-my: 0;
        --polish-rail-depth: 0px;
        flex: var(--polish-card-weight) 1 0;
        min-width: 0;
        height: 100%;
        aspect-ratio: auto;
        contain: none;
        cursor: inherit;
        will-change: flex-grow, filter, opacity;
        -webkit-user-drag: none;
      }
      .polish-gallery-section.is-polish-works-rail .polish-layer-tile img {
        -webkit-user-drag: none;
        user-select: none;
        pointer-events: none;
      }
      .polish-gallery-section.is-polish-works-rail .polish-layer-tile::before {
        z-index: 5;
        width: 100%;
        background: linear-gradient(105deg, transparent 22%, rgba(255,255,255,.16) 46%, transparent 67%);
        transform: translateX(-130%);
        transition: none;
      }
      .polish-gallery-section.is-polish-works-rail .polish-layer-tile.is-opening::before {
        animation: polish-works-sheen .82s cubic-bezier(.16,1,.3,1) both;
      }
      .polish-gallery-section.is-polish-works-rail .polish-layer-tile::after {
        z-index: 3;
        opacity: 1;
        background: linear-gradient(to bottom, rgba(0,0,0,.02) 28%, rgba(0,0,0,.18) 58%, rgba(0,0,0,.79) 100%);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0);
        transition: box-shadow .35s;
      }
      .polish-gallery-section.is-polish-works-rail .polish-layer-tile.is-visual-open::after {
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.06);
      }
      .polish-gallery-section.is-polish-works-rail .polish-layer-tile.is-settling::after {
        animation: polish-works-frame-settle .58s cubic-bezier(.2,.82,.3,1) both;
      }
      .polish-works-surface {
        position: absolute;
        inset: 0;
        z-index: 1;
        overflow: hidden;
        transform: translateZ(0);
        backface-visibility: hidden;
      }
      .polish-works-image {
        position: absolute;
        inset: -7%;
        width: 114% !important;
        max-width: none !important;
        height: 114% !important;
        object-fit: cover;
        background: #091016;
        filter: saturate(.88) contrast(1.07) brightness(.86);
        transform: translate3d(calc(var(--polish-card-mx) * -9px + var(--polish-rail-depth)), calc(var(--polish-card-my) * -7px), 0) scale(1.05);
        transition: filter .45s ease;
        will-change: transform;
      }
      .polish-layer-tile.is-visual-open .polish-works-image {
        filter: saturate(.98) contrast(1.08) brightness(.86);
      }
      .polish-works-grid-lines {
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
        opacity: .15;
        background-image: linear-gradient(rgba(255,255,255,.2) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px);
        background-size: 25% 25%;
        transform: translate3d(calc(var(--polish-card-mx) * 5px), calc(var(--polish-card-my) * 4px), 0) scale(1.08);
        transition: opacity .38s;
      }
      .polish-layer-tile.is-visual-open .polish-works-grid-lines {
        opacity: .22;
      }
      .polish-works-chrome {
        position: absolute;
        inset: 0;
        z-index: 5;
        pointer-events: none;
        font-family: var(--polish-font-mono);
        text-transform: uppercase;
      }
      .polish-works-index {
        position: absolute;
        top: 15px;
        left: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: rgba(255,255,255,.48);
        font-size: 9px;
        line-height: 1;
        letter-spacing: .16em;
        transform: translate3d(calc(var(--polish-card-mx) * 2px), calc(var(--polish-card-my) * 2px), 0);
        transition: color .45s ease, letter-spacing .72s cubic-bezier(.16,1,.3,1), transform .72s cubic-bezier(.16,1,.3,1);
      }
      .polish-works-index::after {
        content: "";
        width: 13px;
        height: 1px;
        background: rgba(255,255,255,.38);
        transform-origin: left;
        transition: width .72s cubic-bezier(.16,1,.3,1), background-color .4s ease;
      }
      .polish-layer-tile.is-visual-open .polish-works-index {
        color: rgba(255,255,255,.78);
        letter-spacing: .24em;
        transform: translate3d(5px,3px,0);
      }
      .polish-layer-tile.is-visual-open .polish-works-index::after {
        width: 52px;
        background: rgba(255,255,255,.66);
      }
      .polish-works-kind {
        position: absolute;
        top: 14px;
        right: 15px;
        display: flex;
        align-items: center;
        gap: 7px;
        color: rgba(255,255,255,.34);
        font-size: 8px;
        line-height: 1;
        letter-spacing: .15em;
        transform: translate3d(calc(var(--polish-card-mx) * -2px), calc(var(--polish-card-my) * 2px), 0);
        transition: color .4s ease, letter-spacing .68s cubic-bezier(.16,1,.3,1), transform .68s cubic-bezier(.16,1,.3,1);
      }
      .polish-works-kind::before {
        content: "";
        width: 4px;
        height: 4px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,.42);
        transition: background-color .38s ease, transform .68s cubic-bezier(.16,1,.3,1);
      }
      .polish-layer-tile.is-visual-open .polish-works-kind {
        color: rgba(255,255,255,.64);
        letter-spacing: .21em;
        transform: translate3d(-5px,3px,0);
      }
      .polish-layer-tile.is-visual-open .polish-works-kind::before {
        background: rgba(255,255,255,.7);
        transform: scale(.72);
      }
      .polish-works-copy {
        position: absolute;
        z-index: 5;
        left: 18px;
        right: 18px;
        bottom: 20px;
        min-width: 0;
        pointer-events: none;
        -webkit-font-smoothing: antialiased;
        text-rendering: geometricPrecision;
      }
      .polish-works-name {
        margin: 0;
        width: var(--polish-title-lock, 100%);
        max-width: min(var(--polish-title-lock, 100%), 520px);
        color: rgba(255,255,255,.88);
        font-size: clamp(18px,1.9vw,27px);
        font-weight: 500;
        font-style: italic;
        line-height: 1.08;
        letter-spacing: -.035em;
        white-space: normal;
        transition: color .4s;
        backface-visibility: hidden;
      }
      .polish-layer-tile.is-visual-open .polish-works-name {
        color: rgba(255,255,255,.96);
      }
      .polish-works-detail {
        display: grid;
        grid-template-rows: 0fr;
        opacity: 0;
        transform: translateY(8px);
        transition: grid-template-rows .72s cubic-bezier(.22,1,.36,1), opacity .42s .08s, transform .72s cubic-bezier(.22,1,.36,1);
      }
      .polish-works-detail > span {
        display: block;
        overflow: hidden;
      }
      .polish-layer-tile.is-visual-open .polish-works-detail {
        grid-template-rows: 1fr;
        opacity: 1;
        transform: translateY(0);
      }
      .polish-works-summary {
        display: block;
        max-width: 440px;
        margin: 10px 0 0;
        color: rgba(255,255,255,.66);
        font-size: 11px;
        line-height: 1.48;
      }
      .polish-works-view {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        margin-top: 12px;
        color: rgba(255,255,255,.55);
        font: 9px/1 var(--polish-font-mono);
        letter-spacing: .14em;
        text-transform: uppercase;
      }
      .polish-works-view::after {
        content: "";
        width: 20px;
        height: 1px;
        background: currentColor;
        transform-origin: left;
        transition: width .5s cubic-bezier(.16,1,.3,1);
      }
      .polish-layer-tile.is-visual-open .polish-works-view::after {
        width: 42px;
      }
      .polish-works-hint {
        position: relative;
        z-index: 2;
        display: flex;
        justify-content: space-between;
        gap: 20px;
        margin-top: 20px;
        color: rgba(255,255,255,.24);
        font: 9px/1.4 var(--polish-font-mono);
        letter-spacing: .16em;
        text-transform: uppercase;
      }
      @keyframes polish-works-sheen {
        0% { opacity: 0; transform: translateX(-130%); }
        35% { opacity: .56; }
        100% { opacity: 0; transform: translateX(150%); }
      }
      @keyframes polish-works-frame-settle {
        0% { box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); }
        28% { box-shadow: inset 0 0 0 1px rgba(255,255,255,.13); }
        54% { box-shadow: inset 0 0 0 1px rgba(255,255,255,.07); }
        100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0); }
      }
      html.polish-detail-open,
      html.polish-detail-open body {
        overflow: hidden;
      }
      @media (min-width: 901px) {
        html.polish-detail-open body {
          box-sizing: border-box;
          padding-right: var(--polish-detail-page-gutter, 0px);
        }
      }
      .polish-gallery-transition-layer {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 120;
        overflow: visible;
        contain: layout style;
      }
      .polish-gallery-transition-layer.is-detail-transition {
        z-index: 2147480650;
      }
      .polish-detail-shared-clone {
        position: fixed;
        overflow: hidden;
        pointer-events: none;
        border: 1px solid rgba(255,255,255,.12);
        background: #050506;
        box-shadow: 0 28px 90px rgba(0,0,0,.42);
        will-change: left, top, width, height, opacity, filter, border-radius;
      }
      .polish-detail-shared-clone img {
        display: block;
        width: 100%;
        height: 100%;
        max-width: none;
        object-fit: cover;
        filter: saturate(.94) contrast(1.06) brightness(.84);
        transform: scale(1.035);
      }
      .polish-gallery-pixel-wipe {
        position: fixed;
        display: grid;
        grid-template-columns: repeat(var(--polish-pixel-cols), 1fr);
        grid-template-rows: repeat(var(--polish-pixel-rows), 1fr);
        gap: 1px;
        pointer-events: none;
        overflow: hidden;
        border-radius: 8px;
        opacity: 0;
        mix-blend-mode: screen;
        contain: layout paint style;
      }
      .polish-gallery-pixel-cell {
        display: block;
        background:
          radial-gradient(circle at 50% 50%, rgba(255,255,255,.28), rgba(255,255,255,.13) 42%, rgba(255,255,255,.04)),
          rgba(255,255,255,.08);
        opacity: 0;
        transform: scale(.64);
        will-change: opacity, transform;
      }
      .polish-gallery-repeat-clone {
        position: fixed;
        overflow: hidden;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.025);
        box-shadow: 0 16px 44px rgba(0,0,0,.24);
        pointer-events: none;
        will-change: transform, opacity, filter;
        transform-origin: 50% 50%;
      }
      .polish-gallery-repeat-clone img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: saturate(.95) contrast(1.05) brightness(.82);
        transform: scale(1.08);
      }
      .polish-layer-tile {
        --polish-tile-x: 0px;
        --polish-tile-y: 0px;
        --polish-tile-shift-x: 0px;
        --polish-tile-shift-y: 0px;
        position: relative;
        aspect-ratio: 1 / 1;
        display: block;
        overflow: hidden;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(255,255,255,.025);
        isolation: isolate;
        transform: translate3d(0,0,0);
        contain: paint;
        transition:
          border-color .24s ease,
          background-color .24s ease,
          box-shadow .24s ease;
        will-change: opacity, transform;
      }
      .polish-layer-tile::before,
      .polish-layer-tile::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
      }
      .polish-layer-tile::before {
        width: 48%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.20), transparent);
        opacity: 0;
        transform: translate3d(-130%,0,0) skewX(-16deg);
        transition:
          transform .68s cubic-bezier(.16, 1, .3, 1),
          opacity .18s ease;
        will-change: transform, opacity;
      }
      .polish-layer-tile::after {
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,0),
          inset 0 -92px 120px rgba(0,0,0,.26);
        opacity: 0;
        transition: opacity .24s ease, box-shadow .24s ease;
      }
      .polish-gallery-grid.is-changing .polish-layer-tile {
        opacity: 0;
      }
      .polish-layer-tile:hover,
      .polish-layer-tile:focus-visible,
      .polish-layer-tile.is-polish-hovered {
        border-color: rgba(255,255,255,.34);
        background: rgba(255,255,255,.038);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 18px 44px rgba(0,0,0,.18);
      }
      .polish-layer-tile:hover::before,
      .polish-layer-tile:focus-visible::before,
      .polish-layer-tile.is-polish-hovered::before {
        opacity: .82;
        transform: translate3d(280%,0,0) skewX(-16deg);
      }
      .polish-layer-tile:hover::after,
      .polish-layer-tile:focus-visible::after,
      .polish-layer-tile.is-polish-hovered::after {
        opacity: 1;
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,.07),
          inset 0 -102px 128px rgba(0,0,0,.34);
      }
      .polish-layer-media,
      .polish-layer-sheen,
      .polish-layer-lines,
      .polish-layer-caption {
        position: absolute;
        inset: 0;
        pointer-events: none;
        will-change: transform, opacity;
      }
      .polish-gallery-grid.is-page-entering .polish-layer-tile {
        animation: none !important;
      }
      .polish-layer-media {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scale(1);
        transition:
          transform .56s cubic-bezier(.16, 1, .3, 1),
          filter .24s ease;
        filter: saturate(.9) contrast(1.04) brightness(.78);
      }
      .polish-layer-tile:hover .polish-layer-media,
      .polish-layer-tile.is-polish-hovered .polish-layer-media {
        transform: scale(1.025);
        filter: saturate(.96) contrast(1.08) brightness(.86);
      }
      .polish-random-grid-media {
        display: block;
      }
      .polish-random-grid-media image {
        --polish-inner-parallax-y: 0px;
        --polish-media-scale: 1.035;
        filter: saturate(.9) contrast(1.04) brightness(.78);
        transform: translate3d(0, var(--polish-inner-parallax-y), 0) scale(var(--polish-media-scale));
        transform-box: fill-box;
        transform-origin: center;
        transition: filter .24s ease;
        will-change: transform, filter;
      }
      .polish-layer-tile:hover .polish-random-grid-media image,
      .polish-layer-tile.is-polish-hovered .polish-random-grid-media image {
        --polish-media-scale: 1.048;
        filter: saturate(.96) contrast(1.08) brightness(.86);
      }
      .polish-random-grid-cell {
        transform-box: fill-box;
      }
      .polish-layer-tile .polish-layer-sheen,
      .polish-layer-tile .polish-layer-lines {
        opacity: 0;
      }
      .polish-layer-tile .polish-layer-caption {
        opacity: 1;
      }
      .polish-layer-sheen {
        background:
          radial-gradient(circle at calc(50% + var(--polish-tile-x) * .7) calc(50% + var(--polish-tile-y) * .7), rgba(255,255,255,.18), transparent 32%),
          linear-gradient(135deg, rgba(255,255,255,.08), transparent 42%, rgba(255,255,255,.04));
        mix-blend-mode: screen;
        display: none;
        transform: none !important;
      }
      .polish-layer-lines {
        background:
          repeating-linear-gradient(90deg, rgba(255,255,255,.055) 0 1px, transparent 1px 11px),
          linear-gradient(180deg, transparent, rgba(0,0,0,.76));
        display: none;
        transform: none !important;
      }
      .polish-layer-caption {
        inset: auto 0 0 0;
        z-index: 3;
        padding: 18px;
        min-height: 58%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        background: linear-gradient(180deg, transparent, rgba(0,0,0,.62) 34%, rgba(0,0,0,.86));
        transform: translate3d(0,0,0);
        transition: background .24s ease;
      }
      .polish-layer-tile:hover .polish-layer-caption,
      .polish-layer-tile:focus-visible .polish-layer-caption,
      .polish-layer-tile.is-polish-hovered .polish-layer-caption {
        background: linear-gradient(180deg, transparent, rgba(0,0,0,.54) 28%, rgba(0,0,0,.90));
      }
      .polish-layer-index {
        display: block;
        margin-bottom: 8px;
        font: 10px/1 var(--polish-font-mono);
        letter-spacing: .24em;
        color: rgba(255,255,255,.34);
        transition: color .22s ease;
      }
      .polish-layer-name {
        display: block;
        font-size: clamp(16px, 1.6vw, 22px);
        line-height: 1.05;
        color: rgba(255,255,255,.86);
        overflow-wrap: anywhere;
        transition: color .22s ease, transform .32s cubic-bezier(.16, 1, .3, 1);
      }
      .polish-layer-meta {
        display: block;
        margin-top: 8px;
        font: 10px/1.2 var(--polish-font-mono);
        letter-spacing: .16em;
        text-transform: uppercase;
        color: rgba(255,255,255,.36);
        transition: color .22s ease;
      }
      .polish-layer-summary {
        display: -webkit-box;
        margin-top: 10px;
        max-width: 92%;
        min-height: 2.9em;
        font-size: 12px;
        line-height: 1.45;
        color: rgba(255,255,255,.66);
        max-height: 2.9em;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-shadow: 0 1px 14px rgba(0,0,0,.82);
        transition: color .22s ease;
      }
      .polish-layer-tile:hover .polish-layer-name,
      .polish-layer-tile:focus-visible .polish-layer-name,
      .polish-layer-tile.is-polish-hovered .polish-layer-name {
        color: rgba(255,255,255,.96);
        transform: translate3d(0,-2px,0);
      }
      .polish-layer-tile:hover .polish-layer-index,
      .polish-layer-tile:focus-visible .polish-layer-index,
      .polish-layer-tile:hover .polish-layer-meta,
      .polish-layer-tile:focus-visible .polish-layer-meta,
      .polish-layer-tile.is-polish-hovered .polish-layer-index,
      .polish-layer-tile.is-polish-hovered .polish-layer-meta {
        color: rgba(255,255,255,.50);
      }
      .polish-layer-tile:hover .polish-layer-summary,
      .polish-layer-tile:focus-visible .polish-layer-summary,
      .polish-layer-tile.is-polish-hovered .polish-layer-summary {
        max-height: 2.9em;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        color: rgba(255,255,255,.78);
      }
      .polish-layer-link {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 13px;
        font: 10px/1 var(--polish-font-mono);
        letter-spacing: .18em;
        text-transform: uppercase;
        color: rgba(255,255,255,.42);
        transition: color .22s ease, transform .32s cubic-bezier(.16, 1, .3, 1);
      }
      .polish-layer-link::after {
        content: "";
        width: 16px;
        height: 1px;
        background: currentColor;
        opacity: .72;
        transform-origin: left center;
        transition: transform .32s cubic-bezier(.16, 1, .3, 1), opacity .22s ease;
      }
      .polish-layer-tile:hover .polish-layer-link,
      .polish-layer-tile:focus-visible .polish-layer-link,
      .polish-layer-tile.is-polish-hovered .polish-layer-link {
        color: rgba(255,255,255,.70);
        transform: translate3d(0,-1px,0);
      }
      .polish-layer-tile:hover .polish-layer-link::after,
      .polish-layer-tile:focus-visible .polish-layer-link::after,
      .polish-layer-tile.is-polish-hovered .polish-layer-link::after {
        transform: scaleX(1.35);
        opacity: .95;
      }
      html.polish-hover-sync-scrolling .polish-layer-tile:hover:not(.is-polish-hovered) {
        border-color: rgba(255,255,255,.10);
        background: rgba(255,255,255,.025);
        box-shadow: none;
      }
      html.polish-hover-sync-scrolling .polish-layer-tile:hover:not(.is-polish-hovered)::before,
      html.polish-hover-sync-scrolling .polish-layer-tile:hover:not(.is-polish-hovered)::after {
        opacity: 0;
      }
      html.polish-hover-sync-scrolling .polish-layer-tile:hover:not(.is-polish-hovered)::before {
        transform: translate3d(-130%,0,0) skewX(-16deg);
      }
      html.polish-hover-sync-scrolling .polish-layer-tile:hover:not(.is-polish-hovered) .polish-layer-media {
        transform: scale(1);
        filter: saturate(.9) contrast(1.04) brightness(.78);
      }
      html.polish-hover-sync-scrolling .polish-layer-tile:hover:not(.is-polish-hovered) .polish-random-grid-media image {
        --polish-media-scale: 1.035;
        filter: saturate(.9) contrast(1.04) brightness(.78);
      }
      html.polish-hover-sync-scrolling .polish-layer-tile:hover:not(.is-polish-hovered) .polish-layer-caption {
        background: linear-gradient(180deg, transparent, rgba(0,0,0,.62) 34%, rgba(0,0,0,.86));
      }
      html.polish-hover-sync-scrolling .polish-layer-tile:hover:not(.is-polish-hovered) .polish-layer-name,
      html.polish-hover-sync-scrolling .polish-layer-tile:hover:not(.is-polish-hovered) .polish-layer-link {
        transform: none;
      }
      html.polish-hover-sync-scrolling .polish-layer-tile:hover:not(.is-polish-hovered) .polish-layer-link::after {
        transform: none;
        opacity: .72;
      }
      .polish-project-detail {
        --polish-detail-nav-pad: max(48px, calc((100vw - 1280px) / 2 + 48px));
        position: fixed;
        inset: 0;
        z-index: 1002;
        display: block;
        pointer-events: none;
        opacity: 0;
        background:
          radial-gradient(circle at 78% 18%, rgba(74,82,255,.16), transparent 30%),
          radial-gradient(circle at 12% 72%, rgba(255,49,100,.12), transparent 28%),
          rgba(3,4,6,.88);
        -webkit-backdrop-filter: blur(22px) saturate(1.06);
        backdrop-filter: blur(22px) saturate(1.06);
        transition: opacity .34s ease;
      }
      .polish-project-detail.is-open {
        pointer-events: auto;
        opacity: 1;
      }
      .polish-project-detail.is-closing {
        pointer-events: none;
        opacity: 0;
      }
      .polish-project-detail[aria-hidden="true"] {
        pointer-events: none !important;
      }
      .polish-project-detail.is-closing .polish-project-detail__top {
        justify-content: flex-end;
      }
      .polish-project-detail.is-closing .polish-project-detail__top > :not(.polish-project-detail__nav-links),
      .polish-project-detail.is-closing .polish-project-detail__nav-links > :not(.polish-project-detail__back),
      .polish-project-detail.is-closing .polish-project-detail__nav-material-reflection {
        display: none !important;
      }
      .polish-project-detail.is-scroll-ready .polish-project-detail__scroll {
        pointer-events: auto;
        touch-action: pan-y;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }
      .polish-project-detail:not(.is-open) .polish-project-detail__back {
        display: none !important;
        visibility: hidden !important;
      }
      .polish-project-detail.is-open .polish-project-detail__back {
        display: inline-grid !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      .polish-project-detail__scroll {
        position: relative;
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        padding: clamp(96px, 9vw, 128px) clamp(18px, 5vw, 72px) clamp(110px, 12vw, 150px);
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,.20) rgba(0,0,0,.34);
      }
      .polish-project-detail__scroll:focus {
        outline: none;
      }
      .polish-project-detail__scroll::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      .polish-project-detail__scroll::-webkit-scrollbar-track {
        background: rgba(0,0,0,.34);
        border-radius: 999px;
      }
      .polish-project-detail__scroll::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(255,255,255,.24), rgba(255,255,255,.13));
        border: 2px solid rgba(0,0,0,.48);
        border-radius: 999px;
      }
      .polish-project-detail__scroll::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(255,255,255,.30), rgba(255,255,255,.17));
      }
      .polish-project-detail::before {
        content: "";
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        height: 0;
        pointer-events: none;
        z-index: 1009;
        opacity: 0;
      }
      .polish-project-detail__shell {
        width: min(1240px, 100%);
        margin: 0 auto;
      }
      .polish-project-detail__top {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1010;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        height: calc(64px + env(safe-area-inset-top, 0px));
        min-height: calc(64px + env(safe-area-inset-top, 0px));
        max-height: calc(64px + env(safe-area-inset-top, 0px));
        padding: env(safe-area-inset-top, 0px) var(--polish-detail-nav-pad) 0;
        margin: 0;
        overflow: hidden;
        isolation: auto;
        background:
          linear-gradient(180deg, rgba(0,0,0,.94), rgba(0,0,0,.88) 58%, rgba(0,0,0,.82));
        border-bottom: 1px solid rgba(255,255,255,.078);
        box-shadow:
          0 20px 54px rgba(0,0,0,.56),
          inset 0 1px 0 rgba(255,255,255,.11),
          inset 0 -1px 0 rgba(255,255,255,.024);
        -webkit-backdrop-filter: blur(66px) saturate(1.18) brightness(.58) contrast(.92);
        backdrop-filter: blur(66px) saturate(1.18) brightness(.58) contrast(.92);
      }
      .polish-project-detail__nav-material-reflection {
        position: absolute;
        inset: -18px -8vw -10px;
        z-index: 1;
        overflow: hidden;
        pointer-events: none;
        opacity: var(--polish-nav-material-opacity, 0);
        filter: blur(18px) saturate(1.46) brightness(1.06);
        mix-blend-mode: screen;
        transition: opacity .24s ease;
        -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 18%, #000 78%, transparent 100%);
        mask-image: linear-gradient(180deg, transparent 0%, #000 18%, #000 78%, transparent 100%);
      }
      .polish-project-detail__nav-material-reflection span {
        position: absolute;
        left: var(--polish-nav-reflect-x, 0%);
        top: var(--polish-nav-reflect-y, 0px);
        width: var(--polish-nav-reflect-w, 42%);
        height: var(--polish-nav-reflect-h, 96px);
        border-radius: 999px;
        opacity: var(--polish-nav-reflect-opacity, 0);
        overflow: hidden;
        transform: translate3d(var(--polish-nav-reflect-dx, 0px), var(--polish-nav-reflect-dy, 0px), 0) scale(var(--polish-nav-reflect-scale, 1.08));
        transition: opacity .18s ease;
      }
      .polish-project-detail__nav-material-reflection img {
        position: absolute;
        inset: -24%;
        width: 148%;
        height: 148%;
        max-width: none;
        object-fit: cover;
        filter: blur(10px) saturate(1.34) contrast(1.06) brightness(.92);
        transform: scale(1.18);
      }
      .polish-project-detail__top::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
        background: linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.20) 56%, rgba(0,0,0,.28));
        opacity: .78;
      }
      .polish-project-detail__top::after {
        content: "";
        position: absolute;
        left: clamp(58px, 12vw, 220px);
        right: clamp(58px, 12vw, 220px);
        bottom: 0;
        z-index: 3;
        height: 1px;
        pointer-events: none;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.11) 18%, rgba(255,255,255,.04) 52%, rgba(255,255,255,.09) 82%, transparent);
        opacity: .22;
        -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
        mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
        mix-blend-mode: normal;
      }
      .polish-project-detail__meta,
      .polish-project-detail__link,
      .polish-project-detail__back,
      .polish-project-detail__nav-link {
        font: 11px/1.2 var(--polish-font-mono);
        letter-spacing: .22em;
        text-transform: uppercase;
      }
      .polish-project-detail__nav-links {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: clamp(16px, 2.4vw, 30px);
        width: 100%;
        position: relative;
        z-index: 4;
      }
      .polish-project-detail__nav-link {
        color: rgba(255,255,255,.46);
        text-decoration: none;
        transition: color .22s ease;
      }
      .polish-project-detail__nav-link:hover {
        color: rgba(255,255,255,.84);
      }
      .polish-project-detail__back {
        position: relative;
        z-index: 5;
        flex: 0 0 auto;
        width: 40px;
        min-width: 40px;
        height: 40px;
        padding: 0;
        border-radius: 0;
        border: 0;
        background: transparent;
        color: rgba(255,255,255,.66);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        place-items: center;
        box-shadow: none;
        -webkit-backdrop-filter: none;
        backdrop-filter: none;
        transform: translate3d(var(--polish-magnetic-x, 0px), var(--polish-magnetic-y, 0px), 0);
        transition: transform .18s ease-out, border-color .22s ease, background-color .22s ease, color .22s ease, box-shadow .22s ease;
        will-change: transform;
      }
      .polish-project-detail__back:hover,
      .polish-project-detail__back.is-polish-hot {
        border-color: transparent;
        background: transparent;
        background-color: transparent;
        color: rgba(255,255,255,.88);
        box-shadow: none;
      }
      .polish-project-detail__back.polish-click-target.is-polish-hot {
        border-color: transparent;
        background-color: transparent;
        color: rgba(255,255,255,.88);
      }
      .polish-project-detail__back svg {
        width: 16px;
        height: 16px;
        opacity: .94;
        filter: drop-shadow(0 0 8px rgba(255,255,255,.18));
      }
      .polish-project-detail__back-label {
        display: none;
      }
      .polish-project-detail__back-icon {
        position: relative;
        display: block;
        width: 19px;
        height: 20px;
        color: currentColor;
      }
      .polish-project-detail__back-line {
        position: absolute;
        left: 50%;
        width: 19px;
        height: 1.5px;
        border-radius: 999px;
        background: currentColor;
        box-shadow: 0 0 7px rgba(255,255,255,.10);
        transform: translateX(-50%);
        transform-origin: center;
        transition:
          top .24s cubic-bezier(.16, 1, .3, 1),
          transform .24s cubic-bezier(.16, 1, .3, 1),
          opacity .18s ease;
      }
      .polish-project-detail__back-line:nth-child(1) {
        top: 5px;
      }
      .polish-project-detail__back-line:nth-child(2) {
        top: 10px;
      }
      .polish-project-detail__back-line:nth-child(3) {
        top: 15px;
      }
      .polish-project-detail.is-open.is-close-icon-ready .polish-project-detail__back-line:nth-child(1) {
        top: 10px;
        transform: translateX(-50%) rotate(42deg);
      }
      .polish-project-detail.is-open.is-close-icon-ready .polish-project-detail__back-line:nth-child(2) {
        opacity: 0;
      }
      .polish-project-detail.is-open.is-close-icon-ready .polish-project-detail__back-line:nth-child(3) {
        top: 10px;
        transform: translateX(-50%) rotate(-42deg);
      }
      .polish-project-detail__chapter {
        position: relative;
        min-width: 0;
      }
      .polish-project-detail__featured-shell {
        --polish-feature-inset: 0%;
        --polish-feature-overscan: 6.18%;
        --polish-feature-radius: 14px;
        --polish-feature-crossfade: 0;
        --polish-feature-copy-y: 0px;
        --polish-feature-copy-opacity: 1;
        --polish-feature-image-scale: 1.06;
        position: relative;
        min-width: 0;
        overflow: visible;
        isolation: isolate;
        clip-path: none;
      }
      .polish-project-detail__featured-media,
      .polish-project-detail__featured-media .polish-project-detail__image,
      .polish-project-detail__featured-media .polish-project-detail__image-frame {
        width: 100%;
        height: 100%;
        min-height: 0;
      }
      .polish-project-detail__featured-media {
        position: absolute;
        inset: 0 calc(var(--polish-feature-overscan) * -1);
        width: auto;
        overflow: hidden;
        clip-path: inset(var(--polish-feature-inset) round var(--polish-feature-radius));
        transition: clip-path .16s linear;
      }
      .polish-project-detail__featured-media .polish-project-detail__image-frame {
        border: 0;
        border-radius: 0;
        opacity: 1;
        transition: opacity .24s cubic-bezier(.16, 1, .3, 1), filter .24s ease;
      }
      .polish-project-detail__featured-media .polish-project-detail__image-frame--static-cover {
        cursor: none;
        pointer-events: none;
      }
      .polish-project-detail__featured-media .polish-project-detail__image-frame--static-cover::before,
      .polish-project-detail__featured-media .polish-project-detail__image-frame--static-cover::after {
        display: none;
      }
      .polish-project-detail.is-shared-entering .polish-project-detail__featured-media .polish-project-detail__image-frame {
        opacity: 0;
      }
      .polish-project-detail__featured-media .polish-project-detail__image-frame img {
        --polish-detail-image-base-scale: var(--polish-feature-image-scale);
        --polish-detail-image-scale: var(--polish-detail-image-base-scale);
      }
      .polish-project-detail__featured-alt {
        position: absolute;
        inset: 0;
        z-index: 2;
        opacity: var(--polish-feature-crossfade);
        pointer-events: none;
        transition: opacity .10s linear;
        will-change: opacity;
      }
      .polish-project-detail__featured-alt,
      .polish-project-detail__featured-alt .polish-project-detail__image,
      .polish-project-detail__featured-alt .polish-project-detail__image-frame {
        width: 100%;
        height: 100%;
        min-height: 0;
      }
      .polish-project-detail__featured-shade {
        position: absolute;
        inset: 0 calc(var(--polish-feature-overscan) * -1);
        z-index: 2;
        pointer-events: none;
        background:
          linear-gradient(180deg, rgba(0,0,0,.12), transparent 36%),
          linear-gradient(0deg, rgba(0,0,0,.82), rgba(0,0,0,.08) 54%, transparent 72%);
        clip-path: inset(var(--polish-feature-inset) round var(--polish-feature-radius));
        transition: clip-path .16s linear;
      }
      .polish-project-detail__featured-content {
        position: absolute;
        inset: 0;
        z-index: 4;
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(260px, .55fr);
        grid-template-rows: auto 1fr auto;
        align-items: end;
        gap: 20px clamp(28px, 3vw, 42px);
        padding: clamp(32px, 3.8vw, 56px);
        color: rgba(255,255,255,.96);
        pointer-events: auto;
        opacity: var(--polish-feature-copy-opacity);
        transform: translate3d(0, var(--polish-feature-copy-y), 0);
        will-change: transform, opacity;
      }
      .polish-project-detail__featured-eyebrow {
        grid-column: 1;
        align-self: start;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 7px 14px;
        font: 10px/1.4 var(--polish-font-mono);
        letter-spacing: .15em;
        text-transform: uppercase;
      }
      .polish-project-detail__featured-eyebrow .polish-project-detail__meta {
        display: inline-flex;
        margin: 0;
        color: rgba(255,255,255,.58);
      }
      .polish-project-detail__chapter-index {
        grid-column: 2;
        justify-self: end;
        align-self: start;
        font: 10px/1.4 var(--polish-font-mono);
        letter-spacing: .18em;
        color: rgba(255,255,255,.52);
      }
      .polish-project-detail__featured-title {
        grid-column: 1;
        grid-row: 3;
        min-width: 0;
        align-self: end;
        overflow: visible;
      }
      .polish-project-detail__featured-summary {
        grid-column: 2;
        grid-row: 3;
        min-width: 0;
        align-self: end;
      }
      .polish-project-detail__featured-summary .polish-project-detail__lead {
        margin: 0;
        max-width: 430px;
        color: rgba(255,255,255,.72);
      }
      .polish-project-detail__featured-story {
        width: 100%;
        margin-top: clamp(28px, 3vw, 42px);
      }
      .polish-project-detail__featured-shell.is-summary-empty .polish-project-detail__featured-eyebrow {
        margin-bottom: 0;
      }
      .polish-project-detail__featured-shell.is-summary-empty .polish-project-detail__featured-story {
        margin-top: clamp(12px, 1.4vw, 20px);
      }
      .polish-project-detail__featured-reflection {
        position: absolute;
        left: 8%;
        right: 8%;
        bottom: -8%;
        z-index: 3;
        height: 28%;
        overflow: hidden;
        border-radius: 50%;
        opacity: var(--polish-feature-reflection-opacity, .22);
        pointer-events: none;
        filter: blur(14px) saturate(1.22) brightness(.84);
        transform: translate3d(0, var(--polish-feature-reflection-y, 0px), 0) scaleY(-1);
        -webkit-mask-image: linear-gradient(180deg, transparent, #000 34%, transparent 94%);
        mask-image: linear-gradient(180deg, transparent, #000 34%, transparent 94%);
        will-change: transform, opacity;
      }
      .polish-project-detail__featured-reflection img {
        width: 100%;
        height: 180%;
        object-fit: cover;
        transform: translateY(-24%) scale(1.05);
      }
      .polish-project-detail__chapter-marker {
        display: flex;
        flex-direction: column;
        gap: 8px;
        font: 10px/1.45 var(--polish-font-mono);
        letter-spacing: .15em;
        text-transform: uppercase;
        color: rgba(255,255,255,.30);
        transition: color .42s ease, transform .62s cubic-bezier(.16, 1, .3, 1);
      }
      .polish-project-detail__chapter.is-active .polish-project-detail__chapter-marker {
        color: rgba(255,255,255,.70);
      }
      .polish-project-detail__chapter-marker strong {
        font-weight: 400;
        color: rgba(255,255,255,.72);
        line-height: 1.55;
      }
      .polish-project-detail__chapter-visual {
        min-width: 0;
      }
      .polish-project-detail__hero {
        display: block;
        max-width: 920px;
        padding-top: 0;
      }
      .polish-project-detail__title {
        margin: 0;
        max-width: 900px;
        font-size: clamp(42px, 5vw, 74px);
        line-height: 1.02;
        padding-bottom: .12em;
        margin-bottom: -.12em;
        overflow: visible;
        color: rgba(255,255,255,.92);
        letter-spacing: -.025em;
        text-wrap: balance;
        text-shadow: 0 0 30px rgba(255,255,255,.08);
      }
      .polish-project-detail__meta {
        display: block;
        margin-top: 18px;
        color: rgba(255,255,255,.34);
      }
      .polish-project-detail__lead {
        margin: clamp(28px, 4vw, 48px) 0 0;
        max-width: 840px;
        font-size: clamp(17px, 1.55vw, 22px);
        line-height: 1.5;
        color: rgba(255,255,255,.72);
      }
      .polish-project-detail__body {
        position: relative;
        margin-top: 24px;
        max-width: 780px;
        max-height: clamp(170px, 24vh, 260px);
        overflow: auto;
        padding: 0 16px 22px 0;
        background: transparent;
        color: rgba(255,255,255,.54);
        font-size: 15px;
        line-height: 1.9;
        -webkit-mask-image: none;
        mask-image: none;
        transition: max-height .28s ease;
        scrollbar-width: none;
        -ms-overflow-style: none;
        overscroll-behavior: contain;
      }
      .polish-project-detail__body::-webkit-scrollbar {
        width: 0;
        height: 0;
        display: none;
      }
      .polish-project-detail__body::-webkit-scrollbar-track {
        background: rgba(0,0,0,.30);
        border-radius: 999px;
      }
      .polish-project-detail__body::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(255,255,255,.25), rgba(255,255,255,.13));
        border: 1px solid rgba(0,0,0,.50);
        border-radius: 999px;
      }
      .polish-project-detail__body::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(255,255,255,.32), rgba(255,255,255,.17));
      }
      .polish-project-detail__body-wrap {
        position: relative;
        max-width: 780px;
        padding-right: 26px;
      }
      .polish-project-detail__body-scrollbar {
        display: none;
        position: absolute;
        top: 8px;
        right: -6px;
        bottom: 12px;
        width: 22px;
        box-sizing: border-box;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.14), rgba(255,255,255,.08)) center / 3px 100% no-repeat;
        box-shadow: none;
        opacity: 0;
        pointer-events: none;
        z-index: 3;
      }
      .polish-project-detail__body-scrollbar::before,
      .polish-project-detail__body-scrollbar::after {
        content: "";
        position: absolute;
        left: 50%;
        width: 12px;
        height: 18px;
        transform: translateX(-50%);
        border-radius: 999px;
        pointer-events: none;
        opacity: .68;
        filter: blur(6px);
      }
      .polish-project-detail__body-scrollbar::before {
        top: -8px;
        background: radial-gradient(circle, rgba(255,255,255,.22), transparent 66%);
      }
      .polish-project-detail__body-scrollbar::after {
        bottom: -8px;
        background: radial-gradient(circle, rgba(255,255,255,.20), transparent 66%);
      }
      .polish-project-detail__body-scrollbar span {
        position: absolute;
        top: 0;
        left: 50%;
        width: 4px;
        height: var(--polish-body-scroll-thumb-height, 34px);
        min-height: 36px;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(255,255,255,.58), rgba(255,255,255,.28));
        box-shadow:
          0 0 12px rgba(255,255,255,.12),
          inset 0 1px 0 rgba(255,255,255,.18);
        transform: translate3d(-50%, var(--polish-body-scroll-thumb-top, 0px), 0);
        transition: background .12s ease, box-shadow .12s ease;
        will-change: transform;
      }
      @media (hover: hover) and (pointer: fine) {
        .polish-project-detail__body-wrap.has-more .polish-project-detail__body-scrollbar {
          pointer-events: auto;
          cursor: grab;
          touch-action: none;
        }
        .polish-project-detail__body-wrap.has-more .polish-project-detail__body-scrollbar span {
          pointer-events: auto;
          cursor: grab;
        }
        .polish-project-detail__body-scrollbar:hover span,
        .polish-project-detail__body-scrollbar.is-dragging span {
          background: linear-gradient(180deg, rgba(255,255,255,.72), rgba(255,255,255,.36));
          box-shadow:
            0 0 16px rgba(255,255,255,.16),
            inset 0 1px 0 rgba(255,255,255,.24);
        }
        .polish-project-detail__body-scrollbar.is-dragging,
        .polish-project-detail__body-scrollbar.is-dragging span {
          cursor: grabbing;
        }
      }
      .polish-project-detail__body-wrap::after {
        display: none;
      }
      .polish-project-detail__body-cue {
        display: none !important;
      }
      .polish-project-detail__copy-toggle {
        display: none;
      }
      .polish-project-detail__body-wrap.has-more .polish-project-detail__body {
        -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 28px, #000 calc(100% - 32px), transparent 100%);
        mask-image: linear-gradient(180deg, transparent 0%, #000 28px, #000 calc(100% - 32px), transparent 100%);
      }
      .polish-project-detail__body-wrap.has-more .polish-project-detail__body-scrollbar {
        display: block;
        opacity: .92;
      }
      .polish-project-detail__body-wrap.has-more.is-at-start .polish-project-detail__body {
        -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 calc(100% - 32px), transparent 100%);
        mask-image: linear-gradient(180deg, #000 0%, #000 calc(100% - 32px), transparent 100%);
      }
      .polish-project-detail__body-wrap.has-more.is-at-end .polish-project-detail__body {
        -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 28px, #000 100%);
        mask-image: linear-gradient(180deg, transparent 0%, #000 28px, #000 100%);
      }
      @keyframes polish-text-scroll-cue {
        0%, 100% {
          transform: translate3d(0, -2px, 0);
        }
        50% {
          transform: translate3d(0, 3px, 0);
        }
      }
      .polish-project-detail__body.is-expanded {
        max-height: clamp(170px, 24vh, 260px);
        -webkit-mask-image: none;
        mask-image: none;
      }
      .polish-project-detail__body p {
        margin: 0 0 1.15em;
      }
      .polish-project-detail__body-action {
        margin: 1.8em 0 0 !important;
      }
      .polish-project-detail__body-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-height: 40px;
        min-width: min(223px, 100%);
        width: min(223px, 100%);
        box-sizing: border-box;
        padding: 0 20px;
        white-space: nowrap;
        border: 1px solid rgba(255,255,255,.82);
        border-radius: 999px;
        background: rgba(255,255,255,.96);
        color: #08090b;
        font: 10px/1 var(--polish-font-mono);
        letter-spacing: .17em;
        text-transform: uppercase;
        text-decoration: none;
        box-shadow: 0 1px 0 rgba(255,255,255,.12), 0 10px 28px rgba(0,0,0,.14);
        transform: none;
        transition: border-color .22s ease, background-color .22s ease, color .22s ease, box-shadow .22s ease, transform .22s ease;
      }
      .polish-project-detail__body-link:hover,
      .polish-project-detail__body-link.is-polish-hot {
        border-color: rgba(255,255,255,.62);
        background: rgba(255,255,255,.84);
        color: #08090b;
        box-shadow: 0 1px 0 rgba(255,255,255,.18), 0 14px 32px rgba(0,0,0,.24);
        transform: none !important;
      }
      .polish-project-detail__body-link:active {
        transform: scale(.94) !important;
      }
      .polish-project-detail__body-link:focus-visible {
        outline: 2px solid rgba(255,255,255,.76);
        outline-offset: 4px;
      }
      .polish-project-detail__actions {
        margin-top: 34px;
        display: block;
      }
      .polish-project-detail__link {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.18);
        background: rgba(255,255,255,.045);
        color: rgba(255,255,255,.78);
        font: 11px/1.2 var(--polish-font-mono);
        letter-spacing: .09em;
        text-transform: uppercase;
        text-decoration: none;
        transform: translate3d(var(--polish-magnetic-x, 0px), var(--polish-magnetic-y, 0px), 0);
        transition: transform .18s ease-out, border-color .22s ease, background-color .22s ease, color .22s ease;
        will-change: transform;
      }
      .polish-project-detail__link:hover {
        border-color: rgba(255,255,255,.42);
        background: rgba(255,255,255,.085);
        color: rgba(255,255,255,.96);
      }
      .polish-project-detail__gallery {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-auto-rows: clamp(220px, 24vw, 320px);
        grid-auto-flow: dense;
        gap: clamp(12px, 1.6vw, 20px);
        margin-top: clamp(30px, 4.8vw, 62px);
      }
      .polish-project-detail__image {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      .polish-project-detail__image-frame {
        position: relative;
        flex: 1 1 auto;
        min-height: 0;
        overflow: hidden;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(255,255,255,.03);
        cursor: none;
        isolation: isolate;
        transition:
          border-color .46s cubic-bezier(.16, 1, .3, 1),
          background-color .46s cubic-bezier(.16, 1, .3, 1),
          box-shadow .52s cubic-bezier(.16, 1, .3, 1);
      }
      .polish-project-detail__image-frame::before,
      .polish-project-detail__image-frame::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 2;
      }
      .polish-project-detail__image-frame::before {
        width: 48%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.20), transparent);
        opacity: 0;
        transform: translate3d(-130%,0,0) skewX(-16deg);
        transition:
          transform .68s cubic-bezier(.16, 1, .3, 1),
          opacity .34s ease;
        will-change: transform, opacity;
      }
      .polish-project-detail__image-frame::after {
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,0),
          inset 0 -92px 120px rgba(0,0,0,.22);
        opacity: 0;
        transition: opacity .42s ease, box-shadow .52s cubic-bezier(.16, 1, .3, 1);
      }
      .polish-project-detail__image-frame:hover,
      .polish-project-detail__image-frame:focus-visible,
      .polish-project-detail__image-frame.is-polish-hovered {
        border-color: rgba(255,255,255,.34);
        background: rgba(255,255,255,.038);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 18px 44px rgba(0,0,0,.18);
      }
      .polish-project-detail__image-frame:hover::before,
      .polish-project-detail__image-frame:focus-visible::before,
      .polish-project-detail__image-frame.is-polish-hovered::before {
        opacity: .82;
        transform: translate3d(280%,0,0) skewX(-16deg);
      }
      .polish-project-detail__image-frame:hover::after,
      .polish-project-detail__image-frame:focus-visible::after,
      .polish-project-detail__image-frame.is-polish-hovered::after {
        opacity: 1;
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,.07),
          inset 0 -102px 128px rgba(0,0,0,.30);
      }
      .polish-project-detail__image--wide {
        grid-column: span 2;
      }
      .polish-project-detail__image--portrait {
        grid-row: span 2;
      }
      .polish-project-detail__desktop-media-viewport {
        display: none;
      }
      .polish-project-detail__desktop-next {
        display: none;
      }
      @media (min-width: 901px) {
        .polish-project-detail {
          transform: translate3d(0, 0, 0);
          will-change: transform;
        }
        .polish-project-detail.is-open.is-stage-entering {
          animation: polish-detail-curtain-in .48s cubic-bezier(.76, 0, .24, 1) both;
        }
        .polish-project-detail.is-closing {
          opacity: 1;
          animation: polish-detail-curtain-out .46s cubic-bezier(.55, 0, .2, 1) both;
        }
        .polish-project-detail__scroll {
          box-sizing: border-box;
          height: 100%;
          overflow: hidden;
          padding-top: clamp(88px, 8vh, 112px);
          padding-right: clamp(36px, 4.5vw, 80px);
          padding-left: clamp(36px, 4.5vw, 80px);
          padding-bottom: clamp(28px, 4vh, 52px);
        }
        .polish-project-detail__shell {
          --polish-detail-reading-inset: clamp(56px, 18%, 248px);
          width: min(1380px, 100%);
          height: 100%;
        }
        .polish-project-detail [data-polish-detail-content] {
          display: block;
          height: 100%;
        }
        .polish-project-detail__chapter--featured {
          width: 100%;
          height: 100%;
          min-height: 0;
          margin: 0;
        }
        .polish-project-detail__featured-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: clamp(14px, 1.45vw, 22px);
          width: 100%;
          height: 100%;
          min-height: 0;
          aspect-ratio: auto;
          overflow: visible;
          border-radius: 0;
        }
        .polish-project-detail__featured-media {
          display: none;
        }
        .polish-project-detail__desktop-media-viewport {
          position: relative;
          display: block;
          grid-column: 2;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          border-radius: 10px;
          background: transparent;
          isolation: isolate;
          cursor: none;
        }
        .polish-project-detail__desktop-media-viewport::after {
          display: none;
        }
        .polish-project-detail__desktop-media-track {
          position: relative;
          width: 100%;
          will-change: transform;
        }
        .polish-project-detail__desktop-media-group {
          display: grid;
          gap: clamp(14px, 1.45vw, 22px);
          width: 100%;
          padding-bottom: clamp(14px, 1.45vw, 22px);
        }
        .polish-project-detail__desktop-media-card {
          --polish-rail-focus: 1;
          position: relative;
          width: 100%;
          min-height: 0;
          margin: 0;
          grid-column: auto;
          grid-row: auto;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          border-radius: 10px;
          opacity: var(--polish-rail-opacity, .94);
          transform: translate3d(0, 0, 0);
          transition: opacity .38s cubic-bezier(.16, 1, .3, 1), filter .38s cubic-bezier(.16, 1, .3, 1);
          will-change: opacity;
        }
        .polish-project-detail__desktop-media-card.polish-project-detail__image--wide {
          aspect-ratio: 16 / 10;
        }
        .polish-project-detail__desktop-media-card.polish-project-detail__image--portrait {
          aspect-ratio: 4 / 5;
        }
        .polish-project-detail__desktop-media-card .polish-project-detail__image-frame {
          width: 100%;
          height: 100%;
          min-height: 0;
          border: 0;
          border-radius: inherit;
          background: #080a0f;
          box-shadow: none;
          transition: filter .42s cubic-bezier(.16, 1, .3, 1);
        }
        .polish-project-detail__desktop-media-card .polish-project-detail__image-frame::before,
        .polish-project-detail__desktop-media-card .polish-project-detail__image-frame::after {
          display: none;
        }
        .polish-project-detail__desktop-media-card .polish-project-detail__image-frame img,
        .polish-project-detail__desktop-media-card .polish-project-detail__image-frame video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(var(--polish-rail-focus));
          transform-origin: center;
          filter: saturate(.92) contrast(1.035) brightness(.88);
          transition: transform .52s cubic-bezier(.16, 1, .3, 1), filter .42s cubic-bezier(.16, 1, .3, 1);
        }
        .polish-project-detail__desktop-media-card figcaption {
          display: none;
        }
        .polish-project-detail__desktop-media-card.is-rail-active {
          --polish-rail-opacity: 1;
          z-index: 2;
        }
        .polish-project-detail__featured-content {
          position: relative;
          inset: auto;
          z-index: 4;
          grid-column: 1;
          grid-row: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          gap: 0;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          padding: 0 clamp(20px, 2.2vw, 34px) 0 0;
          color: rgba(255,255,255,.96);
          opacity: 1;
          transform: none;
          will-change: auto;
        }
        .polish-project-detail__featured-eyebrow {
          width: 100%;
          margin-bottom: clamp(22px, 2vw, 30px);
        }
        .polish-project-detail__featured-shell.is-summary-empty .polish-project-detail__featured-eyebrow {
          margin-bottom: clamp(22px, 2vw, 30px);
        }
        .polish-project-detail__featured-title,
        .polish-project-detail__featured-summary {
          width: 100%;
        }
        .polish-project-detail__featured-summary {
          margin-top: clamp(16px, 1.6vw, 22px);
        }
        .polish-project-detail__featured-title .polish-project-detail__title {
          max-width: 10.5em;
          font-size: clamp(40px, 3.7vw, 64px);
          line-height: 1.02;
          letter-spacing: -.032em;
          color: rgba(255,255,255,.98);
          text-shadow: 0 18px 54px rgba(0,0,0,.30);
        }
        .polish-project-detail__featured-summary .polish-project-detail__lead {
          max-width: 36ch;
          font-size: clamp(15px, 1.12vw, 18px);
          line-height: 1.58;
        }
        .polish-project-detail__featured-story {
          display: flex;
          flex: 0 1 clamp(230px, 34vh, 340px);
          flex-direction: column;
          height: clamp(230px, 34vh, 340px);
          max-height: clamp(230px, 34vh, 340px);
          min-height: 0;
          width: min(100%, 52ch);
          max-width: 52ch;
          margin: clamp(32px, 4.6vh, 42px) 0 0;
          overflow: hidden;
        }
        .polish-project-detail__featured-shell.is-summary-empty .polish-project-detail__featured-story {
          margin: clamp(32px, 4.6vh, 42px) 0 0;
        }
        .polish-project-detail__featured-story .polish-project-detail__body-wrap {
          display: flex;
          flex: 1 1 auto;
          min-height: 0;
          width: 100%;
          max-width: none;
          padding-right: 26px;
        }
        .polish-project-detail__featured-story .polish-project-detail__body {
          flex: 1 1 auto;
          width: 100%;
          min-width: 0;
          min-height: 0;
          max-height: none;
          overflow: auto;
          padding-right: 0;
        }
        .polish-project-detail__featured-story .polish-project-detail__body-wrap.has-more .polish-project-detail__body {
          -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 calc(100% - 34px), transparent 100%) !important;
          mask-image: linear-gradient(180deg, #000 0%, #000 calc(100% - 34px), transparent 100%) !important;
        }
        .polish-project-detail__featured-story .polish-project-detail__body-wrap.has-more.is-at-start .polish-project-detail__body {
          -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 calc(100% - 34px), transparent 100%) !important;
          mask-image: linear-gradient(180deg, #000 0%, #000 calc(100% - 34px), transparent 100%) !important;
        }
        .polish-project-detail__featured-story .polish-project-detail__body-wrap.has-more:not(.is-at-start):not(.is-at-end) .polish-project-detail__body {
          -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 28px, #000 calc(100% - 34px), transparent 100%) !important;
          mask-image: linear-gradient(180deg, transparent 0%, #000 28px, #000 calc(100% - 34px), transparent 100%) !important;
        }
        .polish-project-detail__featured-story .polish-project-detail__body-wrap.has-more.is-at-end .polish-project-detail__body {
          -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 28px, #000 100%) !important;
          mask-image: linear-gradient(180deg, transparent 0%, #000 28px, #000 100%) !important;
        }
        .polish-project-detail__featured-content > .polish-project-detail__body-action {
          flex: 0 0 auto;
          display: flex;
          align-self: stretch;
          justify-content: flex-start;
          width: 100%;
          max-width: none;
          margin: auto 0 0 !important;
          padding-top: 0;
        }
        .polish-project-detail__featured-content .polish-project-detail__body-link {
          flex: 0 0 auto;
        }
        .polish-project-detail__desktop-next {
          display: inline-flex;
          align-self: flex-start;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-sizing: border-box;
          width: auto;
          max-width: 100%;
          min-height: 40px;
          min-width: min(223px, 100%);
          width: min(223px, 100%);
          margin-top: 14px;
          padding: 0 20px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 999px;
          background: rgba(255,255,255,.035);
          color: rgba(255,255,255,.66);
          font: 10px/1 var(--polish-font-mono);
          letter-spacing: .17em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: none;
          -webkit-tap-highlight-color: transparent;
          -webkit-appearance: none;
          appearance: none;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          transform: none;
          transition: border-color .22s ease, background-color .22s ease, color .22s ease, opacity .22s ease, transform .22s ease;
        }
        .polish-project-detail__desktop-next::before,
        .polish-project-detail__desktop-next::after {
          content: none !important;
          display: none !important;
        }
        .polish-project-detail__desktop-next-label,
        .polish-project-detail__desktop-next-count {
          display: block;
          color: rgba(255,255,255,.34);
          font: inherit;
          letter-spacing: inherit;
          text-transform: uppercase;
          transition: color .22s ease;
        }
        .polish-project-detail__desktop-next-label {
          color: inherit;
          white-space: nowrap;
        }
        .polish-project-detail__desktop-next-title {
          display: block;
          overflow: hidden;
          margin: 0;
          color: inherit;
          font: inherit;
          letter-spacing: .08em;
          text-transform: uppercase;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: color .22s ease;
        }
        .polish-project-detail__desktop-next:hover .polish-project-detail__desktop-next-label,
        .polish-project-detail__desktop-next:hover .polish-project-detail__desktop-next-count,
        .polish-project-detail__desktop-next.is-polish-hot .polish-project-detail__desktop-next-label,
        .polish-project-detail__desktop-next.is-polish-hot .polish-project-detail__desktop-next-count {
          color: rgba(255,255,255,.96);
        }
        .polish-project-detail__desktop-next:hover,
        .polish-project-detail__desktop-next.is-polish-hot {
          border-color: rgba(255,255,255,.42);
          background: rgba(255,255,255,.075);
          color: rgba(255,255,255,.95);
          transform: none !important;
        }
        .polish-project-detail__desktop-next:active {
          transform: scale(.94) !important;
        }
        .polish-project-detail__desktop-next:hover .polish-project-detail__desktop-next-title,
        .polish-project-detail__desktop-next.is-polish-hot .polish-project-detail__desktop-next-title {
          color: rgba(255,255,255,.96);
        }
        .polish-project-detail__desktop-next:focus-visible {
          outline: 1px solid rgba(255,255,255,.42);
          outline-offset: 4px;
        }
        .polish-project-detail__featured-shell.is-compact-copy .polish-project-detail__featured-story {
          flex: 0 0 auto;
          height: auto;
          max-height: none;
          overflow: visible;
        }
        .polish-project-detail__featured-shell.is-compact-copy .polish-project-detail__body-wrap,
        .polish-project-detail__featured-shell.is-compact-copy .polish-project-detail__body {
          flex: 0 0 auto;
          max-height: none;
          overflow: visible;
        }
        .polish-project-detail__featured-shell.is-compact-copy .polish-project-detail__body-wrap {
          padding-right: 0;
        }
        .polish-project-detail__featured-shell.is-compact-copy .polish-project-detail__featured-content > .polish-project-detail__body-action {
          display: flex;
          align-self: stretch;
          justify-content: flex-start;
          width: 100%;
          max-width: none;
          margin: auto 0 0 !important;
          padding: 0 !important;
        }
        .polish-project-detail__featured-story .polish-project-detail__body-scrollbar {
          display: none !important;
          pointer-events: none !important;
        }
        .polish-project-detail__featured-shade {
          display: none;
        }
        .polish-project-detail__featured-reflection {
          display: none;
        }
        .polish-project-detail__featured-story .polish-project-detail__body {
          color: rgba(255,255,255,.62);
        }
        .polish-project-detail__chapter--text {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: clamp(18px, 2vw, 30px);
          align-items: start;
          box-sizing: border-box;
          margin: 0;
          padding-block: clamp(88px, 7.5vw, 116px);
          padding-inline: var(--polish-detail-reading-inset);
        }
        .polish-project-detail__chapter--text .polish-project-detail__chapter-marker {
          grid-column: 1 / span 2;
          position: sticky;
          top: 104px;
        }
        .polish-project-detail__story {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: minmax(0, 760px);
          align-items: start;
          justify-content: start;
          gap: 0;
          width: 100%;
          min-width: 0;
        }
        .polish-project-detail__body-wrap {
          width: 100%;
          max-width: 760px;
          padding-right: 0;
        }
        .polish-project-detail__body {
          max-width: none;
          max-height: none;
          margin-top: 0;
          overflow: visible;
          padding: 0;
          font-size: clamp(15px, .98vw, 16px);
          line-height: 1.84;
          color: rgba(255,255,255,.58);
        }
        .polish-project-detail__actions {
          align-self: start;
          justify-self: end;
          margin-top: 0;
        }
        .polish-project-detail__chapter--media {
          display: none;
          min-width: 0;
          min-height: 0;
          margin: 0;
        }
        .polish-project-detail__chapter--media .polish-project-detail__chapter-marker {
          position: relative;
          top: auto;
          align-self: start;
          padding-top: 6px;
          transform: translate3d(0, 20px, 0);
        }
        .polish-project-detail__chapter--media.is-active .polish-project-detail__chapter-marker {
          transform: translate3d(0, 0, 0);
        }
        .polish-project-detail__chapter--left .polish-project-detail__chapter-marker {
          grid-column: 1 / span 2;
          grid-row: 1;
        }
        .polish-project-detail__chapter--left .polish-project-detail__chapter-visual {
          grid-column: auto;
          grid-row: auto;
        }
        .polish-project-detail__chapter--right .polish-project-detail__chapter-marker {
          grid-column: 11 / -1;
          grid-row: 1;
          align-items: flex-end;
          text-align: right;
        }
        .polish-project-detail__chapter--right .polish-project-detail__chapter-visual {
          grid-column: auto;
          grid-row: auto;
        }
        .polish-project-detail__chapter-visual {
          min-width: 0;
          opacity: .08;
          transform: translate3d(0, 24px, 0) scale(.986);
          filter: blur(2px) brightness(.78);
          transition:
            opacity .68s cubic-bezier(.16, 1, .3, 1),
            transform .82s cubic-bezier(.16, 1, .3, 1),
            filter .68s cubic-bezier(.16, 1, .3, 1);
          will-change: opacity, transform, filter;
        }
        .polish-project-detail__chapter.is-active .polish-project-detail__chapter-visual {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
          filter: blur(0) brightness(1);
        }
        .polish-project-detail.is-open .polish-project-detail__chapter .polish-project-detail__image {
          animation: none;
        }
        .polish-project-detail__chapter-visual .polish-project-detail__image-frame {
          width: 100%;
          max-height: none;
          aspect-ratio: 4 / 3;
          border-radius: 10px;
        }
        .polish-project-detail.is-stage-entering .polish-project-detail__featured-content > * {
          animation: polish-detail-copy-mask-in .36s cubic-bezier(.16, 1, .3, 1) .14s both;
        }
        .polish-project-detail.is-stage-entering .polish-project-detail__featured-content > :nth-child(2) { animation-delay: .17s; }
        .polish-project-detail.is-stage-entering .polish-project-detail__featured-content > :nth-child(3) { animation-delay: .20s; }
        .polish-project-detail.is-stage-entering .polish-project-detail__featured-content > :nth-child(4) { animation-delay: .23s; }
        .polish-project-detail.is-stage-entering .polish-project-detail__featured-content > :nth-child(5) { animation-delay: .26s; }
        .polish-project-detail.is-stage-entering .polish-project-detail__title .polish-title-word {
          opacity: 1 !important;
          animation: none !important;
          transform: none !important;
          filter: none !important;
        }
        .polish-project-detail.is-stage-entering .polish-project-detail__desktop-media-viewport {
          animation: polish-detail-media-stage-in .46s cubic-bezier(.16, 1, .3, 1) .06s both;
        }
        .polish-project-detail.is-open .polish-project-detail__desktop-media-card,
        .polish-project-detail.is-open.is-scroll-ready .polish-project-detail__desktop-media-card {
          animation: none !important;
        }
        .polish-project-detail.is-closing .polish-project-detail__featured-content > * {
          animation: polish-detail-copy-mask-out .26s cubic-bezier(.55, 0, 1, .45) both;
        }
        .polish-project-detail.is-closing .polish-project-detail__desktop-media-viewport {
          animation: polish-detail-media-stage-out .34s cubic-bezier(.55, 0, .2, 1) both;
        }
      }
      @keyframes polish-detail-curtain-in {
        0% { opacity: .92; transform: translate3d(0, 100%, 0); }
        100% { transform: translate3d(0, 0, 0); }
      }
      @keyframes polish-detail-curtain-out {
        0% { opacity: 1; transform: translate3d(0, 0, 0); }
        100% { opacity: 0; transform: translate3d(0, 7vh, 0); }
      }
      @keyframes polish-detail-media-stage-in {
        0% { opacity: 0; transform: translate3d(0, 16px, 0); filter: blur(5px) brightness(.78); clip-path: inset(0 0 8% 0 round 10px); }
        100% { opacity: 1; transform: translate3d(0, 0, 0); filter: blur(0) brightness(1); clip-path: inset(0 round 10px); }
      }
      @keyframes polish-detail-media-stage-out {
        0% { opacity: 1; transform: translate3d(0, 0, 0); filter: blur(0) brightness(1); }
        100% { opacity: 0; transform: translate3d(0, 12px, 0); filter: blur(2px) brightness(.82); }
      }
      @keyframes polish-detail-copy-mask-in {
        0% { opacity: 0; transform: translate3d(0, 24px, 0); filter: blur(7px); }
        100% { opacity: 1; transform: translate3d(0, 0, 0); filter: blur(0); }
      }
      @keyframes polish-detail-copy-mask-out {
        0% { opacity: 1; transform: translate3d(0, 0, 0); filter: blur(0); }
        100% { opacity: 0; transform: translate3d(0, -16px, 0); filter: blur(5px); }
      }
      @media (min-width: 901px) and (max-width: 1199px) {
        .polish-project-detail [data-polish-detail-content] {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (min-width: 901px) and (max-height: 760px) {
        .polish-project-detail__featured-shell {
          height: 100%;
          min-height: 0;
          aspect-ratio: auto;
        }
        .polish-project-detail__featured-media {
          height: 100%;
        }
        .polish-project-detail__featured-content {
          height: 100%;
          min-height: 0;
          padding-block: clamp(24px, 4vh, 34px);
        }
        .polish-project-detail__chapter--media {
          min-height: 0;
        }
      }
      .polish-project-detail__image--contain .polish-project-detail__image-frame img {
        object-fit: contain;
        transform: none;
        padding: 10px;
        background: rgba(0,0,0,.32);
      }
      .polish-project-detail__image--contain .polish-project-detail__image-frame video {
        object-fit: contain;
        background: rgba(0,0,0,.64);
      }
      .polish-project-detail__image-frame img {
        --polish-inner-parallax-y: 0px;
        --polish-detail-image-base-scale: 1.06;
        --polish-detail-image-scale: var(--polish-detail-image-base-scale);
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: translate3d(0, var(--polish-inner-parallax-y), 0) scale(var(--polish-detail-image-scale));
        transform-origin: center;
        filter: saturate(.9) contrast(1.04) brightness(.82);
        transition:
          transform .76s cubic-bezier(.16, 1, .3, 1),
          filter .56s cubic-bezier(.16, 1, .3, 1);
        will-change: transform, filter;
      }
      .polish-project-detail__image-frame video {
        position: relative;
        z-index: 1;
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        background: #050506;
      }
      .polish-project-detail__image-frame--video {
        cursor: auto;
      }
      .polish-project-detail__image-frame--video::before,
      .polish-project-detail__image-frame--video::after {
        display: none;
      }
      .polish-project-detail__image-frame:hover img,
      .polish-project-detail__image-frame.is-polish-hovered img {
        --polish-detail-image-scale: calc(var(--polish-detail-image-base-scale) + .012);
        filter: saturate(.94) contrast(1.055) brightness(.84);
      }
      html.polish-hover-sync-scrolling .polish-project-detail__image-frame:hover:not(.is-polish-hovered) {
        border-color: rgba(255,255,255,.10);
        background: rgba(255,255,255,.03);
        box-shadow: none;
      }
      html.polish-hover-sync-scrolling .polish-project-detail__image-frame:hover:not(.is-polish-hovered)::before,
      html.polish-hover-sync-scrolling .polish-project-detail__image-frame:hover:not(.is-polish-hovered)::after {
        opacity: 0;
      }
      html.polish-hover-sync-scrolling .polish-project-detail__image-frame:hover:not(.is-polish-hovered)::before {
        transform: translate3d(-130%,0,0) skewX(-16deg);
      }
      html.polish-hover-sync-scrolling .polish-project-detail__image-frame:hover:not(.is-polish-hovered) img {
        --polish-detail-image-scale: var(--polish-detail-image-base-scale);
        filter: saturate(.9) contrast(1.04) brightness(.82);
      }
      .polish-project-detail__image figcaption {
        margin-top: 9px;
        font: 11px/1.45 var(--polish-font-mono);
        letter-spacing: .08em;
        color: rgba(255,255,255,.38);
      }
      .polish-project-detail__next {
        display: none;
      }
      .polish-project-detail.is-project-switching [data-polish-next-project] {
        opacity: .5;
      }
      .polish-lightbox {
        position: fixed;
        inset: 0;
        z-index: 1005;
        display: grid;
        place-items: center;
        box-sizing: border-box;
        padding: clamp(18px, 4vw, 54px);
        background: rgba(0,0,0,.82);
        -webkit-backdrop-filter: blur(18px);
        backdrop-filter: blur(18px);
        opacity: 0;
        pointer-events: none;
        transition: opacity .30s ease;
      }
      .polish-lightbox.is-animating {
        pointer-events: none;
      }
      .polish-lightbox.is-animating:not(.is-closing) img {
        opacity: 1;
        filter: blur(0) saturate(.9) brightness(.82);
        transform: scale(1);
      }
      .polish-lightbox.is-closing {
        pointer-events: none;
      }
      .polish-lightbox.is-closing img {
        opacity: 0;
        transform: scale(1);
      }
      .polish-lightbox.is-open {
        opacity: 1;
        pointer-events: auto;
      }
      .polish-lightbox:not(.is-open) img {
        opacity: 0;
        visibility: hidden;
      }
      .polish-lightbox.is-open img {
        visibility: visible;
      }
      .polish-lightbox > div {
        display: grid;
        justify-items: center;
        box-sizing: border-box;
        width: 100%;
        max-width: 1360px;
        min-width: 0;
      }
      .polish-lightbox img {
        display: block;
        width: auto;
        max-width: 100%;
        max-height: 82vh;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 26px 90px rgba(0,0,0,.44);
        opacity: 1;
        transition: opacity .18s ease, filter .18s ease;
      }
      .polish-lightbox__caption {
        margin-top: 16px;
        max-width: min(760px, 90vw);
        text-align: center;
        font: 12px/1.6 var(--polish-font-mono);
        letter-spacing: .08em;
        color: rgba(255,255,255,.56);
      }
      .polish-lightbox.is-closing .polish-lightbox__caption,
      .polish-lightbox:not(.is-open) .polish-lightbox__caption {
        opacity: 0;
      }
      .polish-lightbox-motion-clone {
        display: none !important;
      }
      .polish-lightbox-motion-clone img {
        width: 100%;
        height: 100%;
        object-fit: var(--polish-clone-fit, cover);
        filter: saturate(.94) contrast(1.06) brightness(.88);
      }
      .polish-project-detail.is-open .polish-project-detail__lead,
      .polish-project-detail.is-open .polish-project-detail__body,
      .polish-project-detail.is-open .polish-project-detail__body-action,
      .polish-project-detail.is-open .polish-project-detail__hero-media,
      .polish-project-detail.is-open .polish-project-detail__image {
        animation: polish-detail-enter .72s cubic-bezier(.16, 1, .3, 1) both;
      }
      .polish-project-detail.is-open .polish-project-detail__lead { animation-delay: .05s; }
      .polish-project-detail.is-open .polish-project-detail__body { animation-delay: .09s; }
      .polish-project-detail.is-open .polish-project-detail__body-action { animation-delay: .11s; }
      .polish-project-detail.is-open .polish-project-detail__image:nth-child(1) { animation-delay: .10s; }
      .polish-project-detail.is-open .polish-project-detail__image:nth-child(2) { animation-delay: .16s; }
      .polish-project-detail.is-open .polish-project-detail__image:nth-child(3) { animation-delay: .22s; }
      .polish-project-detail.is-open.is-scroll-ready .polish-project-detail__lead,
      .polish-project-detail.is-open.is-scroll-ready .polish-project-detail__body,
      .polish-project-detail.is-open.is-scroll-ready .polish-project-detail__body-action,
      .polish-project-detail.is-open.is-scroll-ready .polish-project-detail__hero-media,
      .polish-project-detail.is-open.is-scroll-ready .polish-project-detail__image {
        animation: polish-detail-enter-fast .30s cubic-bezier(.22, 1, .36, 1) both;
        animation-delay: 0s !important;
      }
      .polish-project-detail.is-open.is-scroll-ready .polish-project-detail__image:nth-child(2) { animation-delay: .025s !important; }
      .polish-project-detail.is-open.is-scroll-ready .polish-project-detail__image:nth-child(3) { animation-delay: .05s !important; }
      @keyframes polish-detail-enter {
        0% {
          opacity: 0;
          transform: translate3d(0, 28px, 0) scale(.98);
          filter: blur(8px);
        }
        100% {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
          filter: blur(0);
        }
      }
      @keyframes polish-detail-enter-fast {
        0% {
          opacity: .01;
          transform: translate3d(0, 10px, 0);
          filter: blur(2px);
        }
        100% {
          opacity: 1;
          transform: translate3d(0, 0, 0);
          filter: blur(0);
        }
      }
        @media (max-width: 900px) {
          nav {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: auto !important;
            z-index: 1000 !important;
            opacity: 1 !important;
            transform: none !important;
            pointer-events: auto !important;
          }
          nav .hidden.md\\:flex {
            display: none !important;
          }
        @media (max-width: 900px) {
          nav button[class*="md:hidden"]:not(.polish-mobile-menu-fallback) {
            display: none !important;
          }
          .polish-mobile-menu-fallback {
            position: relative;
            z-index: 1001;
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            width: 40px;
            min-width: 40px;
            height: 40px;
            margin-right: -10.5px;
            padding: 0;
            border: 0;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            color: rgba(255,255,255,.66) !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
            -webkit-appearance: none;
            appearance: none;
            -webkit-backdrop-filter: none;
            backdrop-filter: none;
          }
          .polish-mobile-menu-fallback span {
            position: absolute;
            left: 50%;
            width: 19px;
            height: 1.5px;
            border-radius: 999px;
            background: currentColor;
            transform: translateX(-50%);
            transition: transform .22s ease, top .22s ease, opacity .18s ease;
          }
          .polish-mobile-menu-fallback span:nth-child(1) {
            top: 14px;
          }
          .polish-mobile-menu-fallback span:nth-child(2) {
            top: 20px;
          }
          .polish-mobile-menu-fallback span:nth-child(3) {
            top: 26px;
          }
          .polish-mobile-menu-fallback.is-open span:nth-child(1) {
            top: 20px;
            transform: translateX(calc(-50% + 1.94px)) rotate(42deg);
          }
          .polish-mobile-menu-fallback.is-open span:nth-child(2) {
            opacity: 0;
          }
          .polish-mobile-menu-fallback.is-open span:nth-child(3) {
            top: 20px;
            transform: translateX(calc(-50% + 1.94px)) rotate(-42deg);
          }
          nav button[class*="md:hidden"]:not(.polish-mobile-menu-fallback) {
            display: none !important;
          }
          nav button[class*="md:hidden"]:not(.polish-mobile-menu-fallback) svg {
            display: block;
            width: 20px;
            height: 20px;
            opacity: .94;
          }
        }
        nav .text-sm {
          white-space: nowrap;
        }
        body > div.fixed.inset-0.z-\\[99\\] a,
        main > div.fixed.inset-0.z-\\[99\\] a {
          max-width: min(84vw, 340px);
          text-align: center;
          line-height: 1.05;
          overflow-wrap: anywhere;
        }
        html.polish-detail-opening body::after {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 2147480400;
          pointer-events: none;
          background: #020203;
        }
        .polish-project-detail {
          z-index: 2147480500;
          transition: opacity .32s ease;
        }
        .polish-lightbox {
          z-index: 2147480700;
        }
        .polish-project-detail__scroll {
          padding: calc(72px + env(safe-area-inset-top, 0px)) 0 calc(86px + env(safe-area-inset-bottom, 0px));
        }
        .polish-project-detail__shell {
          box-sizing: border-box;
          width: calc(100% - 32px);
          max-width: calc(100% - 32px);
          margin-right: 16px;
          margin-left: 16px;
        }
        .polish-project-detail::before {
          height: 0;
          opacity: 0;
        }
        .polish-project-detail__top {
          position: fixed;
          left: 0;
          right: var(--polish-detail-nav-gutter, 0px);
          top: 0;
          margin: 0;
          height: calc(64px + env(safe-area-inset-top, 0px));
          min-height: calc(64px + env(safe-area-inset-top, 0px));
          max-height: calc(64px + env(safe-area-inset-top, 0px));
          padding: env(safe-area-inset-top, 0px) 22px 0;
          overflow: hidden;
          isolation: auto;
          background:
            linear-gradient(180deg, rgba(0,0,0,.95), rgba(0,0,0,.89) 58%, rgba(0,0,0,.83));
          border-bottom: 1px solid rgba(255,255,255,.07);
          -webkit-backdrop-filter: blur(58px) saturate(1.16) brightness(.58) contrast(.92);
          backdrop-filter: blur(58px) saturate(1.16) brightness(.58) contrast(.92);
        }
        html.polish-detail-open .polish-project-detail__top {
          justify-content: flex-end;
        }
        html.polish-detail-open .polish-project-detail__top > :not(.polish-project-detail__nav-links) {
          display: none !important;
        }
        .polish-project-detail__top::before {
          background: linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.20) 56%, rgba(0,0,0,.30));
          opacity: .78;
        }
        .polish-project-detail__top::after {
          display: block;
          left: 48px;
          right: 48px;
          bottom: 0;
          height: 1px;
          opacity: .20;
        }
        .polish-project-detail__nav-links {
          gap: 0;
          width: auto;
          margin-left: auto;
          flex: 0 0 auto;
          justify-content: flex-end;
        }
        html.polish-detail-open .polish-project-detail__nav-links > :not(.polish-project-detail__back) {
          display: none !important;
        }
        html.polish-detail-open .polish-project-detail__nav-material-reflection {
          display: none !important;
        }
        .polish-project-detail__nav-link {
          display: none;
        }
        .polish-project-detail__back {
          position: relative;
          min-width: 40px;
          width: 40px;
          height: 40px;
          padding: 0;
          border-radius: 0;
          border: 0;
          background: transparent;
          color: rgba(255,255,255,.66);
          display: inline-flex;
          box-shadow: none;
          -webkit-backdrop-filter: none;
          backdrop-filter: none;
        }
        .polish-project-detail__back:hover,
        .polish-project-detail__back.is-polish-hot,
        .polish-project-detail__back.polish-click-target.is-polish-hot {
          background: transparent;
          background-color: transparent;
          border-color: transparent;
          color: rgba(255,255,255,.88);
          box-shadow: none;
        }
        .polish-project-detail__back svg {
          width: 25px;
          height: 25px;
          opacity: 1;
          filter: none;
        }
        .polish-project-detail__back svg path {
          stroke-width: 2;
        }
        .polish-project-detail__back-icon {
          width: 19px;
          height: 20px;
        }
        .polish-project-detail__back-line {
          width: 19px;
          height: 1.5px;
          box-shadow: 0 0 7px rgba(255,255,255,.07);
        }
        .polish-project-detail__back-line:nth-child(1) {
          top: 5px;
        }
        .polish-project-detail__back-line:nth-child(2) {
          top: 10px;
        }
        .polish-project-detail__back-line:nth-child(3) {
          top: 15px;
        }
        .polish-project-detail.is-open.is-close-icon-ready .polish-project-detail__back-line:nth-child(1) {
          top: 10px;
          transform: translateX(-50%) rotate(42deg);
        }
        .polish-project-detail.is-open.is-close-icon-ready .polish-project-detail__back-line:nth-child(3) {
          top: 10px;
          transform: translateX(-50%) rotate(-42deg);
        }
        .polish-project-detail__featured-shell {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: visible;
          aspect-ratio: auto;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          clip-path: none;
        }
        .polish-project-detail__featured-shell::after {
          display: none;
        }
        .polish-project-detail__featured-media {
          position: relative;
          inset: auto;
          order: 2;
          width: 100%;
          height: auto;
          margin-top: clamp(44px, 12vw, 56px);
          overflow: hidden;
          aspect-ratio: 16 / 9;
          border-radius: 9px;
          clip-path: none;
          transition: none;
        }
        .polish-project-detail__featured-alt {
          display: none;
        }
        .polish-project-detail__featured-media .polish-project-detail__image,
        .polish-project-detail__featured-media .polish-project-detail__image-frame {
          height: 100%;
        }
        .polish-project-detail__featured-media .polish-project-detail__image-frame {
          aspect-ratio: auto;
          border-radius: 9px;
        }
        .polish-project-detail__featured-media .polish-project-detail__image-frame img {
          object-position: 64% 50%;
        }
        .polish-project-detail__featured-shade {
          display: none;
        }
        .polish-project-detail__featured-reflection {
          display: none;
        }
        .polish-project-detail__featured-content {
          position: relative;
          inset: auto;
          order: 1;
          z-index: 4;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          box-sizing: border-box;
          width: 100%;
          height: auto;
          min-height: 0;
          overflow: visible;
          padding: clamp(24px, 6.4vw, 30px) 0 0;
          color: rgba(255,255,255,.94);
          opacity: 1;
          transform: none;
          text-align: left !important;
        }
        .polish-project-detail__featured-eyebrow,
        .polish-project-detail__featured-title,
        .polish-project-detail__featured-summary,
        .polish-project-detail__featured-story,
        .polish-project-detail__featured-story .polish-project-detail__body-wrap,
        .polish-project-detail__featured-story .polish-project-detail__body,
        .polish-project-detail__featured-content > .polish-project-detail__body-action {
          box-sizing: border-box;
          min-width: 0;
          max-width: 100%;
          width: 100%;
          margin-left: 0;
          text-align: left !important;
        }
        .polish-project-detail__featured-title {
          box-sizing: border-box;
          padding-right: 0;
        }
        .polish-project-detail__featured-summary,
        .polish-project-detail__featured-story,
        .polish-project-detail__featured-content > .polish-project-detail__body-action {
          width: 86%;
          max-width: 328px;
        }
        .polish-project-detail__featured-title .polish-project-detail__title,
        .polish-project-detail__featured-summary .polish-project-detail__lead,
        .polish-project-detail__featured-story .polish-project-detail__body p,
        .polish-project-detail__featured-content .polish-project-detail__body-link,
        .polish-project-detail__featured-content .polish-title-word {
          max-width: 100%;
          margin-left: 0;
          white-space: normal;
          overflow-wrap: anywhere;
          text-align: left !important;
        }
        .polish-project-detail__featured-content .polish-project-detail__body-link {
          white-space: nowrap;
        }
        .polish-project-detail__featured-eyebrow {
          min-height: 20px;
          gap: 6px 12px;
          margin-bottom: 16px;
          padding-right: 0;
          font-size: 9px;
          letter-spacing: .13em;
        }
        .polish-project-detail__chapter-index {
          display: block;
          position: absolute;
          top: 24px;
          right: 0;
          margin: 0;
          font-size: 9px;
          letter-spacing: .14em;
        }
        .polish-project-detail__featured-summary {
          align-self: flex-start;
          margin-top: 24px;
        }
        .polish-project-detail__featured-story {
          display: flex;
          flex: 0 0 auto;
          flex-direction: column;
          min-height: 0;
          width: 86%;
          max-width: 328px;
          margin-top: 24px;
          overflow: visible;
        }
        .polish-project-detail__featured-story .polish-project-detail__body-wrap {
          display: block;
          flex: 0 0 auto;
          box-sizing: border-box;
          min-height: 0;
          width: 100%;
          max-width: none;
          padding-right: 0;
        }
        .polish-project-detail__featured-story .polish-project-detail__body {
          flex: 0 0 auto;
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          min-height: 0;
          max-height: clamp(190px, 52vw, 218px);
          overflow: hidden;
          padding-right: 0;
          overflow-wrap: anywhere;
          color: rgba(255,255,255,.66);
          -webkit-mask-image: none;
          mask-image: none;
          transition: max-height .38s cubic-bezier(.16, 1, .3, 1);
        }
        .polish-project-detail__featured-story .polish-project-detail__body p,
        .polish-project-detail__featured-summary .polish-project-detail__lead,
        .polish-project-detail__featured-title .polish-project-detail__title {
          box-sizing: border-box;
          min-width: 0;
          max-width: 100%;
          width: 100%;
          white-space: normal;
          overflow-wrap: anywhere;
        }
        .polish-project-detail__copy-toggle {
          align-items: center;
          justify-content: flex-start;
          gap: 0;
          box-sizing: border-box;
          width: 100%;
          margin-top: 12px;
          padding: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
          color: rgba(255,255,255,.72);
          font: 10px/1.4 var(--polish-font-mono);
          letter-spacing: .13em;
          text-transform: uppercase;
          cursor: none;
          -webkit-appearance: none;
          appearance: none;
        }
        .polish-project-detail__body-wrap.has-more + .polish-project-detail__copy-toggle:not([hidden]) {
          display: flex;
        }
        .polish-project-detail__copy-toggle:focus {
          outline: none;
        }
        .polish-project-detail__copy-toggle:focus-visible {
          color: rgba(255,255,255,.92);
        }
        .polish-project-detail__featured-shell.is-copy-expanded .polish-project-detail__featured-story .polish-project-detail__body {
          max-height: none;
          overflow: visible;
          -webkit-mask-image: none !important;
          mask-image: none !important;
        }
        .polish-project-detail__featured-content > .polish-project-detail__body-action {
          flex: 0 0 auto;
          display: flex;
          align-self: stretch;
          justify-content: flex-start;
          width: 100%;
          max-width: none;
          margin: auto 0 0 !important;
          padding-top: 24px;
        }
        .polish-project-detail__featured-shell.is-compact-copy .polish-project-detail__featured-story,
        .polish-project-detail__featured-shell.is-compact-copy .polish-project-detail__body-wrap,
        .polish-project-detail__featured-shell.is-compact-copy .polish-project-detail__body {
          flex: 0 0 auto;
          max-height: none;
          overflow: visible;
        }
        .polish-project-detail__featured-shell.is-compact-copy .polish-project-detail__body-wrap {
          padding-right: 0;
        }
        .polish-project-detail__featured-story .polish-project-detail__body-wrap.has-more .polish-project-detail__body-scrollbar {
          display: none !important;
        }
        .polish-project-detail__featured-story .polish-project-detail__body-scrollbar {
          display: none !important;
        }
        .polish-project-detail__title {
          width: 100%;
          max-width: 10.5ch;
          font-size: clamp(40px, 12vw, 50px);
          line-height: .94;
          letter-spacing: -.036em;
          overflow-wrap: anywhere;
          text-wrap: balance;
        }
        .polish-project-detail__lead {
          margin-top: 0;
          width: 100%;
          max-width: 100%;
          font-size: clamp(15px, 4vw, 17px);
          line-height: 1.55;
          overflow-wrap: anywhere;
        }
        .polish-project-detail__chapter--text,
        .polish-project-detail__chapter--media {
          display: block;
          min-height: 0;
          margin-top: 58px;
        }
        .polish-project-detail__chapter-marker {
          position: relative;
          top: auto;
          flex-direction: row;
          align-items: baseline;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
          padding: 0;
          font-size: 9px;
          letter-spacing: .12em;
          color: rgba(255,255,255,.56);
          transform: none;
        }
        .polish-project-detail__chapter-marker strong {
          max-width: 68%;
          text-align: right;
        }
        .polish-project-detail__story {
          min-width: 0;
        }
        .polish-project-detail__body {
          max-height: none;
          margin-top: 0;
          overflow: auto;
          font-size: clamp(14px, 3.7vw, 15px);
          line-height: 1.7;
          padding: 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .polish-project-detail__body::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
        .polish-project-detail__body-wrap {
          padding-right: 0;
        }
        .polish-project-detail__body-wrap.has-more .polish-project-detail__body-scrollbar {
          display: none;
        }
        .polish-project-detail__chapter-visual {
          opacity: 1;
          transform: none;
          filter: none;
        }
        .polish-project-detail__chapter-visual .polish-project-detail__image-frame {
          aspect-ratio: 16 / 9;
          border-radius: 9px;
        }
        .polish-project-detail__hero {
          grid-template-columns: 1fr;
        }
        .polish-project-detail__gallery {
          grid-template-columns: 1fr;
          grid-auto-rows: auto;
        }
        .polish-project-detail__image--wide {
          grid-column: span 1;
        }
        .polish-project-detail__image--portrait {
          grid-row: span 1;
        }
        .polish-project-detail__image-frame {
          aspect-ratio: 1 / 1;
        }
        .polish-project-detail__image--wide .polish-project-detail__image-frame {
          aspect-ratio: 16 / 9;
        }
        .polish-project-detail__image--portrait .polish-project-detail__image-frame {
          aspect-ratio: 3 / 4;
        }
        .polish-project-detail__chapter--media {
          margin-top: 26px;
        }
        .polish-project-detail__chapter--media .polish-project-detail__image,
        .polish-project-detail__chapter--media .polish-project-detail__image-frame {
          width: 100%;
          aspect-ratio: 16 / 9;
        }
        .polish-project-detail__chapter--media .polish-project-detail__image-frame {
          border-radius: 9px;
        }
        .polish-project-detail__chapter--media figcaption {
          display: none !important;
        }
        .polish-project-detail__next {
          position: relative;
          display: inline-flex;
          align-self: flex-start;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-sizing: border-box;
          width: auto;
          max-width: 100%;
          min-height: 40px;
          min-width: min(223px, 100%);
          width: min(223px, 100%);
          margin-top: clamp(34px, 9vw, 48px);
          margin-right: 0;
          margin-bottom: calc(28px + env(safe-area-inset-bottom, 0px));
          margin-left: 0;
          padding: 0 20px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 999px;
          overflow: visible;
          background: rgba(255,255,255,.035);
          color: rgba(255,255,255,.72);
          font: 10px/1 var(--polish-font-mono);
          letter-spacing: .17em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: none;
          -webkit-tap-highlight-color: transparent;
          -webkit-appearance: none;
          appearance: none;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          transform: none;
          transition: border-color .22s ease, background-color .22s ease, color .22s ease, opacity .22s ease, transform .22s ease;
        }
        .polish-project-detail__next::before,
        .polish-project-detail__next::after {
          content: none !important;
          display: none !important;
        }
        .polish-project-detail__next-head {
          display: contents;
          align-items: baseline;
          justify-content: space-between;
          width: 100%;
        }
        .polish-project-detail__next-label,
        .polish-project-detail__next-count {
          font: inherit;
          letter-spacing: inherit;
          text-transform: uppercase;
        }
        .polish-project-detail__next-label {
          color: inherit;
          white-space: nowrap;
        }
        .polish-project-detail__next-title {
          display: block;
          max-width: 100%;
          margin-top: 0;
          font-family: var(--polish-font-mono);
          font-size: 10px;
          font-weight: 500;
          line-height: 1;
          letter-spacing: .08em;
          text-transform: uppercase;
          overflow-wrap: anywhere;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          text-shadow: none;
          transition: color .24s ease;
        }
        .polish-project-detail__next:hover,
        .polish-project-detail__next.is-polish-hot {
          border-color: rgba(255,255,255,.42);
          background: rgba(255,255,255,.075);
          color: rgba(255,255,255,.95);
          transform: none !important;
        }
        .polish-project-detail__next:active {
          transform: scale(.94) !important;
        }
        .polish-project-detail__next:active .polish-project-detail__next-title {
          color: rgba(255,255,255,.92);
        }
        .polish-project-detail__next:focus-visible {
          outline: none;
        }
        .polish-project-detail__next:focus-visible .polish-project-detail__next-title {
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: .14em;
        }
      }
      @media (max-width: 900px) {
        .polish-gallery-head {
          display: flex;
        }
        .polish-gallery-controls {
          margin-top: 0;
        }
        .polish-gallery-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 760px) {
        .polish-gallery-section.is-polish-works-rail .polish-gallery-grid {
          --polish-works-gap: 9px;
          height: clamp(370px, 68vw, 520px);
        }
        .is-polish-works-rail .polish-gallery-count {
          width: 40px;
          min-width: 40px;
        }
        .is-polish-works-rail .polish-gallery-count > span {
          width: 13px;
        }
        .polish-works-page { gap: var(--polish-works-gap); }
        .polish-works-name {
          font-size: clamp(15px,4.4vw,18px);
        }
        .polish-works-copy {
          left: 13px;
          right: 13px;
          bottom: 15px;
        }
        .polish-works-summary {
          display: none;
        }
        .polish-works-index {
          top: 12px;
          left: 12px;
        }
        .polish-works-kind {
          top: 12px;
          right: 12px;
          max-width: 52%;
          overflow: hidden;
          white-space: nowrap;
        }
      }
      @media (max-width: 560px) {
        .polish-gallery-section {
          padding-left: 24px;
          padding-right: 24px;
        }
        .polish-gallery-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .polish-gallery-section.is-polish-works-rail .polish-gallery-grid {
          gap: var(--polish-works-gap);
        }
        .is-polish-works-rail .polish-gallery-head {
          align-items: center;
          gap: 14px;
        }
        .is-polish-works-rail .polish-gallery-count {
          width: 32px;
          min-width: 32px;
        }
        .polish-works-kind {
          font-size: 7px;
          letter-spacing: .1em;
        }
        .polish-works-name {
          font-size: 15px;
        }
        .polish-layer-caption {
          min-height: 68%;
          padding: 12px;
        }
        .polish-layer-index {
          margin-bottom: 6px;
          font-size: 9px;
          letter-spacing: .18em;
        }
        .polish-layer-name {
          display: -webkit-box;
          overflow: hidden;
          font-size: clamp(13px, 4vw, 16px);
          line-height: 1.08;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          line-clamp: 2;
        }
        .polish-layer-meta {
          overflow: hidden;
          margin-top: 6px;
          font-size: 8px;
          letter-spacing: .12em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .polish-layer-summary,
        .polish-layer-link {
          display: none;
        }
      }
      .polish-title-stagger {
        --polish-title-delay: 0ms;
        text-shadow: 0 0 12px rgba(255,255,255,.08), 0 0 38px rgba(150,170,255,.045);
      }
      .polish-hero-title-normalized {
        opacity: 1 !important;
        transform: none !important;
        filter: none !important;
        clip-path: none !important;
        -webkit-mask-image: none !important;
        mask-image: none !important;
        transition: none !important;
        overflow: visible !important;
        contain: none !important;
        line-height: var(--hero-sdf-line-height, 1.25) !important;
        padding: .06em 0 .12em !important;
        margin-top: -.04em !important;
        margin-bottom: -.08em !important;
      }
      .polish-hero-title-normalized .polish-title-word {
        overflow: visible !important;
        line-height: var(--hero-sdf-line-height, 1.25) !important;
        padding: .06em .018em .14em !important;
        margin: -.06em -.018em -.14em !important;
        transform-origin: 50% 86%;
      }
      .polish-hero-availability-hidden {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      .polish-title-word {
        display: inline-block;
        opacity: 0;
        transform: translate3d(0, .82em, 0) rotateX(10deg);
        transform-origin: 50% 100%;
        filter: blur(8px);
        will-change: transform, opacity, filter;
      }
      .polish-title-stagger.is-polish-title-entered {
        animation: polish-title-glow-pulse 1.35s cubic-bezier(.16, 1, .3, 1) both;
      }
      .polish-title-stagger.is-polish-title-entered .polish-title-word {
        opacity: 1;
        transform: translate3d(0, 0, 0) rotateX(0deg);
        filter: blur(0);
        animation: polish-title-word-enter .82s cubic-bezier(.16, 1, .3, 1) both;
        animation-delay: calc(var(--polish-title-delay, 0ms) + var(--polish-word-index, 0) * 58ms);
      }
      .polish-project-detail__title.polish-title-stagger.is-polish-title-entered:not(.is-polish-title-settled) .polish-title-word {
        animation-duration: .42s;
        animation-delay: calc(var(--polish-title-delay, 0ms) + var(--polish-word-index, 0) * 24ms);
      }
      .polish-title-stagger.is-polish-title-settled .polish-title-word {
        opacity: 1 !important;
        transform: translate3d(0, 0, 0) rotateX(0deg) !important;
        filter: blur(0) !important;
        animation: none !important;
      }
      .polish-title-native-split .polish-title-word > span {
        opacity: 1 !important;
        transform: none !important;
        filter: none !important;
        animation: none !important;
      }
      html.polish-title-entrance-active [data-polish-elastic] {
        translate: 0 0 !important;
        scale: 1 1 !important;
      }
      html.polish-title-entrance-active .polish-gallery-title {
        transform: translate3d(0, 0, 0) scaleY(1) !important;
      }
      [data-polish-elastic] {
        will-change: translate, scale;
        transform-origin: 50% 52%;
      }
      @keyframes polish-title-word-enter {
        0% {
          opacity: 0;
          transform: translate3d(0, .82em, 0) rotateX(10deg);
          filter: blur(8px);
        }
        54% {
          opacity: 1;
          filter: blur(1.6px);
        }
        100% {
          opacity: 1;
          transform: translate3d(0, 0, 0) rotateX(0deg);
          filter: blur(0);
        }
      }
      @keyframes polish-title-glow-pulse {
        0% {
          text-shadow: 0 0 0 rgba(255,255,255,0), 0 0 0 rgba(140,165,255,0);
        }
        42% {
          text-shadow: 0 0 22px rgba(255,255,255,.22), 0 0 58px rgba(145,170,255,.14), 0 0 112px rgba(100,135,255,.06);
        }
        100% {
          text-shadow: 0 0 12px rgba(255,255,255,.10), 0 0 38px rgba(150,170,255,.055);
        }
      }
      .polish-scroll-indicator,
      .polish-scroll-indicator * {
        will-change: auto !important;
      }
      .polish-project-detail.is-open.is-close-icon-ready .polish-project-detail__back-icon > .polish-project-detail__back-line.is-top {
        top: 10px !important;
        opacity: 1 !important;
        transform: translate3d(-50%, 0, 0) rotate(42deg) !important;
      }
      .polish-project-detail.is-open.is-close-icon-ready .polish-project-detail__back-icon > .polish-project-detail__back-line.is-mid {
        top: 10px !important;
        opacity: 0 !important;
        transform: translate3d(-50%, 0, 0) scaleX(.36) !important;
      }
      .polish-project-detail.is-open.is-close-icon-ready .polish-project-detail__back-icon > .polish-project-detail__back-line.is-bottom {
        top: 10px !important;
        opacity: 1 !important;
        transform: translate3d(-50%, 0, 0) rotate(-42deg) !important;
      }
      .polish-shared-nav-frame {
        position: relative;
        width: 100%;
        max-width: none !important;
        margin-inline: 0 !important;
        padding-inline: max(24px, calc((100% - 1280px) / 2)) !important;
      }
      html[data-polish-detail-nav-mode="shared"] nav.polish-shared-nav-controller-ready {
        transition-property: background-color, border-color, -webkit-backdrop-filter, backdrop-filter !important;
      }
      .polish-shared-nav-home-item,
      .polish-mobile-nav-brand {
        transition:
          opacity .42s cubic-bezier(.16, 1, .3, 1),
          transform .56s cubic-bezier(.16, 1, .3, 1),
          filter .48s cubic-bezier(.16, 1, .3, 1);
        transition-delay: var(--polish-shared-nav-restore-delay, 0ms);
        will-change: opacity, transform, filter;
      }
      .polish-shared-detail-close {
        position: absolute;
        top: 50%;
        right: var(--polish-detail-close-right, 48px);
        z-index: 8;
        display: grid;
        place-items: center;
        width: 40px;
        min-width: 40px;
        height: 40px;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        color: rgba(255,255,255,.70);
        cursor: none !important;
        opacity: 0;
        filter: blur(6px);
        pointer-events: none;
        transform: translate3d(var(--polish-magnetic-x, 0px), calc(-50% + var(--polish-magnetic-y, 0px)), 0);
        transition:
          opacity .38s cubic-bezier(.16, 1, .3, 1),
          filter .42s cubic-bezier(.16, 1, .3, 1),
          color .42s cubic-bezier(.16, 1, .3, 1);
        will-change: opacity, transform, filter, color;
      }
      .polish-shared-detail-close *,
      .polish-shared-detail-close.polish-click-target.is-polish-hot {
        cursor: none !important;
      }
      .polish-shared-detail-close.polish-click-target.is-polish-hot {
        transform: translate3d(var(--polish-magnetic-x, 0px), calc(-50% + var(--polish-magnetic-y, 0px)), 0);
      }
      .polish-shared-detail-close__glyph {
        position: relative;
        display: block;
        width: 24px;
        height: 24px;
        opacity: .7;
        filter: drop-shadow(0 0 5px rgba(255,255,255,.04));
        transform: translate3d(0, 8px, 0) scale(.74);
        transition:
          opacity .42s cubic-bezier(.16, 1, .3, 1),
          filter .46s cubic-bezier(.16, 1, .3, 1),
          transform .52s cubic-bezier(.16, 1, .3, 1);
        will-change: opacity, filter, transform;
      }
      .polish-shared-detail-close:hover,
      .polish-shared-detail-close:focus-visible,
      .polish-shared-detail-close.is-polish-hot {
        color: rgba(255,255,255,.82);
      }
      .polish-shared-detail-close:hover .polish-shared-detail-close__glyph,
      .polish-shared-detail-close:focus-visible .polish-shared-detail-close__glyph,
      .polish-shared-detail-close.is-polish-hot .polish-shared-detail-close__glyph {
        opacity: .86;
        filter: drop-shadow(0 0 8px rgba(255,255,255,.12));
      }
      .polish-shared-detail-close:focus-visible {
        outline: 1px solid rgba(255,255,255,.36);
        outline-offset: 2px;
      }
      .polish-shared-detail-close__line {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 19px;
        height: 1.5px;
        border-radius: 999px;
        background: currentColor;
        opacity: 1;
        box-shadow: 0 0 7px rgba(255,255,255,.07);
        transform-origin: 50% 50%;
        transition:
          opacity .24s ease,
          transform .36s cubic-bezier(.16, 1, .3, 1);
      }
      .polish-shared-detail-close__line:nth-child(1) {
        transform: translate3d(-50%, calc(-50% - 6px), 0) scaleX(.82);
      }
      .polish-shared-detail-close__line:nth-child(2) {
        transform: translate3d(-50%, -50%, 0) scaleX(1);
      }
      .polish-shared-detail-close__line:nth-child(3) {
        transform: translate3d(-50%, calc(-50% + 6px), 0) scaleX(.82);
      }
      html[data-polish-detail-nav-mode="shared"] .polish-project-detail {
        z-index: 1002 !important;
      }
      html[data-polish-detail-nav-mode="shared"] .polish-lightbox {
        z-index: 1005 !important;
      }
      html[data-polish-detail-nav-mode="shared"].polish-detail-opening body::after {
        z-index: 1001 !important;
      }
      html[data-polish-detail-nav-mode="shared"] .polish-project-detail__top {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      html[data-polish-detail-nav-mode="shared"].polish-shared-detail-active nav,
      html[data-polish-detail-nav-mode="shared"].polish-shared-detail-active .polish-mobile-nav-dock {
        right: var(--polish-shared-nav-gutter, 0px) !important;
        z-index: 1004 !important;
      }
      html[data-polish-detail-nav-mode="shared"].polish-shared-detail-active main {
        isolation: auto !important;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="open"] nav .polish-shared-nav-home-item {
        opacity: 0 !important;
        visibility: hidden !important;
        filter: blur(7px) !important;
        pointer-events: none !important;
        transform: translate3d(0, -10px, 0) scale(.982) !important;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="closing"] nav .polish-shared-nav-home-item {
        opacity: 1 !important;
        filter: none !important;
        pointer-events: none !important;
        transform: none !important;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-nav-home-item {
        opacity: 0 !important;
        visibility: hidden !important;
        filter: blur(7px) !important;
        pointer-events: none !important;
        transform: translate3d(0, -10px, 0) scale(.982) !important;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-nav-home-item > * {
        opacity: 0 !important;
        visibility: hidden !important;
        filter: blur(7px) !important;
        transform: translate3d(0, -10px, 0) scale(.982) !important;
        animation: none !important;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="open"] nav .polish-shared-nav-home-item > * {
        opacity: 0 !important;
        visibility: hidden !important;
        filter: blur(7px) !important;
        transform: translate3d(0, -10px, 0) scale(.982) !important;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="closing"] nav .polish-shared-nav-home-item > * {
        animation: polish-shared-nav-home-in .34s cubic-bezier(.16, 1, .3, 1) calc(72ms + var(--polish-shared-nav-restore-delay, 0ms)) both;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close,
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="open"] nav .polish-shared-detail-close {
        opacity: 1;
        filter: blur(0);
        pointer-events: auto;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close {
        transition-delay: 0ms;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close__glyph,
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="open"] nav .polish-shared-detail-close__glyph {
        opacity: 1;
        filter: drop-shadow(0 0 7px rgba(255,255,255,.07));
        transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close__glyph {
        animation: polish-shared-detail-close-in .34s cubic-bezier(.16, 1, .3, 1) 120ms both;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close__line,
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="open"] nav .polish-shared-detail-close__line {
        opacity: 1;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close__line:nth-child(2),
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="open"] nav .polish-shared-detail-close__line:nth-child(2) {
        opacity: 0;
        transform: translate3d(-50%, -50%, 0) scaleX(.34);
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close__line {
        transition-delay: 120ms;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close__line:nth-child(1),
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="open"] nav .polish-shared-detail-close__line:nth-child(1) {
        transform: translate3d(-50%, -50%, 0) rotate(42deg) scaleX(1);
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close__line:nth-child(3),
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="open"] nav .polish-shared-detail-close__line:nth-child(3) {
        transform: translate3d(-50%, -50%, 0) rotate(-42deg) scaleX(1);
      }
      @media (min-width: 901px) {
        html[data-polish-detail-nav-mode="shared"] nav .polish-shared-nav-home-item {
          transition: none !important;
        }
        html[data-polish-detail-nav-mode="shared"] nav .polish-shared-detail-close {
          transition: color .28s cubic-bezier(.16, 1, .3, 1);
        }
        html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="home"] nav .polish-shared-detail-close__glyph {
          opacity: 0;
          filter: blur(5px) drop-shadow(0 0 0 rgba(255,255,255,0));
          transform: translate3d(0, -7px, 0) scale(.78);
        }
        html[data-polish-detail-nav-mode="shared"] nav .polish-shared-detail-close__line {
          transition: none;
        }
        html[data-polish-detail-nav-mode="shared"] nav .polish-shared-detail-close__line:nth-child(1) {
          transform: translate3d(-50%, -50%, 0) rotate(42deg) scaleX(1);
        }
        html[data-polish-detail-nav-mode="shared"] nav .polish-shared-detail-close__line:nth-child(2) {
          opacity: 0;
          transform: translate3d(-50%, -50%, 0) scaleX(.34);
        }
        html[data-polish-detail-nav-mode="shared"] nav .polish-shared-detail-close__line:nth-child(3) {
          transform: translate3d(-50%, -50%, 0) rotate(-42deg) scaleX(1);
        }
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="closing"] nav .polish-shared-detail-close {
        opacity: 1;
        filter: blur(0);
        pointer-events: none;
        transition-delay: 0ms;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="closing"] nav .polish-shared-detail-close__glyph {
        animation: polish-shared-detail-close-out .28s cubic-bezier(.55, 0, .2, 1) both;
      }
      @keyframes polish-shared-nav-home-out {
        0% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
        100% { opacity: 0; transform: translate3d(0, -10px, 0) scale(.982); filter: blur(7px); }
      }
      @keyframes polish-shared-nav-home-in {
        0% { opacity: 0; transform: translate3d(0, 9px, 0) scale(.982); filter: blur(7px); }
        100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
      }
      @keyframes polish-shared-detail-close-in {
        0% { opacity: 0; transform: translate3d(0, 8px, 0) scale(.74); filter: blur(5px) drop-shadow(0 0 0 rgba(255,255,255,0)); }
        100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0) drop-shadow(0 0 7px rgba(255,255,255,.07)); }
      }
      @keyframes polish-shared-detail-close-out {
        0% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0) drop-shadow(0 0 7px rgba(255,255,255,.07)); }
        100% { opacity: 0; transform: translate3d(0, -7px, 0) scale(.78); filter: blur(5px) drop-shadow(0 0 0 rgba(255,255,255,0)); }
      }
      html[data-polish-detail-nav-mode="shared"].polish-shared-detail-active .polish-mobile-menu-panel {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      html[data-polish-detail-nav-mode="shared"].polish-shared-detail-active.polish-compact-nav .polish-mobile-nav-dock {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      html[data-polish-detail-nav-mode="shared"].polish-shared-detail-active .polish-mobile-nav-brand {
        opacity: 0;
        filter: blur(7px);
        pointer-events: none;
        transform: translate3d(0, -8px, 0) scale(.985);
        transition-delay: 0ms;
      }
      @media (prefers-reduced-motion: reduce) {
        .polish-shared-nav-home-item,
        .polish-mobile-nav-brand,
        .polish-shared-detail-close,
        .polish-shared-detail-close__glyph,
        .polish-shared-detail-close__line {
          transition-duration: .22s !important;
          transition-delay: 0ms !important;
        }
        html[data-polish-detail-nav-mode="shared"] nav .polish-shared-nav-home-item > *,
        html[data-polish-detail-nav-mode="shared"] nav .polish-shared-detail-close__glyph {
          animation-duration: .22s !important;
          animation-delay: 0ms !important;
        }
      }
      .polish-progressive-blur {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        height: clamp(150px, 30vh, 320px);
        pointer-events: none;
        z-index: 990;
        opacity: 0;
        background:
          linear-gradient(to top, rgba(0,0,0,.56), rgba(0,0,0,.22) 44%, rgba(0,0,0,.04) 72%, transparent),
          linear-gradient(to top, rgba(255,255,255,.055), transparent 68%);
        -webkit-backdrop-filter: blur(18px) saturate(.9);
        backdrop-filter: blur(18px) saturate(.9);
        -webkit-mask-image: linear-gradient(to top, #000 0%, rgba(0,0,0,.95) 34%, rgba(0,0,0,.56) 70%, transparent 100%);
        mask-image: linear-gradient(to top, #000 0%, rgba(0,0,0,.95) 34%, rgba(0,0,0,.56) 70%, transparent 100%);
        transition: opacity .22s ease;
        will-change: opacity;
      }
      .polish-progressive-blur::before,
      .polish-progressive-blur::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .polish-progressive-blur::before {
        bottom: 0;
        height: 64%;
        top: auto;
        background: linear-gradient(to top, rgba(0,0,0,.42), rgba(0,0,0,.12), transparent);
        -webkit-backdrop-filter: blur(34px) saturate(.82);
        backdrop-filter: blur(34px) saturate(.82);
        -webkit-mask-image: linear-gradient(to top, #000 0%, rgba(0,0,0,.86) 54%, transparent 100%);
        mask-image: linear-gradient(to top, #000 0%, rgba(0,0,0,.86) 54%, transparent 100%);
      }
      .polish-progressive-blur::after {
        background: repeating-radial-gradient(circle at 50% 100%, rgba(255,255,255,.052) 0 1px, transparent 1px 7px);
        opacity: .26;
        mix-blend-mode: screen;
      }
    `;
    document.head.appendChild(style);
  }

  function installBootSettle(ms, diffusion) {
    if (document.querySelector('style[data-enhance="boot-settle"]')) return;
    const duration = Math.max(300, Number(ms) || 900);
    const style = document.createElement('style');
    style.dataset.enhance = 'boot-settle';
    style.textContent = `
      :root {
        --polish-boot-ms: ${duration}ms;
      }
      html.polish-boot-settle #fluid-canvas {
        opacity: 0 !important;
        filter: blur(8px) saturate(.82);
        transition: opacity .7s ease, filter .7s ease;
      }
      html.polish-boot-primer #fluid-canvas {
        opacity: 0 !important;
        filter: blur(10px) saturate(.72);
        transition: none !important;
      }
      html.polish-boot-ready #fluid-canvas {
        opacity: .92;
        filter: blur(0) saturate(1);
        transition: opacity .7s ease, filter .7s ease;
      }
      .polish-diffusion-loader {
        position: fixed;
        inset: 0;
        z-index: 2147483000;
        pointer-events: none;
        overflow: hidden;
        background: #020203;
        opacity: 1;
        visibility: visible;
        transition: opacity .72s cubic-bezier(.16, 1, .3, 1), visibility .72s step-end;
      }
      .polish-diffusion-loader::before,
      .polish-diffusion-loader::after {
        content: "";
        position: absolute;
        inset: -8%;
        pointer-events: none;
      }
      .polish-diffusion-loader::before {
        background:
          repeating-conic-gradient(from 12deg, rgba(255,255,255,.42) 0 7deg, transparent 7deg 19deg),
          repeating-linear-gradient(90deg, rgba(255,255,255,.22) 0 2px, transparent 2px 14px),
          radial-gradient(circle at 68% 26%, rgba(255,255,255,.16), transparent 24%),
          radial-gradient(circle at 24% 72%, rgba(255,255,255,.10), transparent 28%),
          rgba(0,0,0,.9);
        mix-blend-mode: screen;
        filter: contrast(1.75) brightness(.58);
        transform: scale(1.04);
        animation: polish-diffusion-noise .44s steps(6, end) infinite, polish-diffusion-decode var(--polish-boot-ms) steps(10, end) forwards;
      }
      .polish-diffusion-loader::after {
        background:
          linear-gradient(90deg, rgba(0,0,0,.86), transparent 28%, transparent 72%, rgba(0,0,0,.72)),
          linear-gradient(180deg, rgba(255,255,255,.08), transparent 34%, rgba(255,255,255,.04));
        opacity: .76;
        animation: polish-diffusion-scan var(--polish-boot-ms) cubic-bezier(.16, 1, .3, 1) forwards;
      }
      html.polish-boot-ready .polish-diffusion-loader {
        opacity: 0;
        visibility: hidden;
      }
      @keyframes polish-diffusion-noise {
        0% {
          transform: translate3d(-1.2%, .8%, 0) scale(1.04);
        }
        33% {
          transform: translate3d(1.4%, -1%, 0) scale(1.055);
        }
        66% {
          transform: translate3d(.2%, 1.3%, 0) scale(1.045);
        }
        100% {
          transform: translate3d(-1.2%, .8%, 0) scale(1.04);
        }
      }
      @keyframes polish-diffusion-decode {
        0% {
          opacity: .95;
          filter: contrast(2.2) brightness(.42) blur(8px);
          background-size: 84px 84px, 28px 28px, auto, auto, auto;
        }
        45% {
          opacity: .72;
          filter: contrast(1.65) brightness(.74) blur(3px);
          background-size: 42px 42px, 18px 18px, auto, auto, auto;
        }
        78% {
          opacity: .38;
          filter: contrast(1.2) brightness(1.02) blur(.8px);
          background-size: 18px 18px, 10px 10px, auto, auto, auto;
        }
        100% {
          opacity: 0;
          filter: contrast(1) brightness(1) blur(0);
          background-size: 8px 8px, 6px 6px, auto, auto, auto;
        }
      }
      @keyframes polish-diffusion-scan {
        0% {
          opacity: .88;
          transform: translate3d(-4%, 0, 0);
        }
        72% {
          opacity: .38;
        }
        100% {
          opacity: 0;
          transform: translate3d(4%, 0, 0);
        }
      }
    `;
    document.head.appendChild(style);
    let loader = null;
    if (diffusion !== false) {
      loader = document.createElement('div');
      loader.className = 'polish-diffusion-loader';
      loader.setAttribute('aria-hidden', 'true');
      (document.body || document.documentElement).appendChild(loader);
    }
    document.documentElement.classList.remove('polish-boot-ready');
    document.documentElement.classList.add('polish-boot-primer');
    document.documentElement.classList.add('polish-boot-settle');
    setTimeout(() => {
      document.documentElement.classList.remove('polish-boot-primer');
      document.documentElement.classList.remove('polish-boot-settle');
      document.documentElement.classList.add('polish-boot-ready');
    }, duration);
    setTimeout(() => {
      document.documentElement.classList.remove('polish-boot-ready');
      if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
    }, Math.max(1400, duration + 900));
  }

  function keepNavVisuals(config) {
    let raf = 0;

    function apply() {
      raf = 0;
      const nav = document.querySelector('nav');
      if (!nav) return;
      if (config.navBlur) {
        nav.classList.add('polish-glass-nav');
        nav.dataset.polishGlass = 'true';
      }
      if (config.navReflection) {
        document.querySelectorAll('.polish-reflection-frame').forEach((node) => node.remove());
        nav.classList.add('polish-key-reflection');
        nav.dataset.polishKeyReflection = 'true';
      }
    }

    function scheduleApply() {
      if (!raf) raf = requestAnimationFrame(apply);
    }

    apply();
    if (document.documentElement.dataset.polishNavWatcher === 'true') return;
    document.documentElement.dataset.polishNavWatcher = 'true';
    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  function setupMobileMenuFallback(config) {
    const nav = document.querySelector('nav');
    if (!nav) return;
    if (document.querySelector('.polish-mobile-nav-dock .polish-mobile-menu-fallback') && document.querySelector('.polish-mobile-menu-panel')) return;
    document.querySelectorAll('.polish-mobile-nav-dock').forEach((node) => node.remove());
    document.querySelectorAll('.polish-mobile-menu-fallback').forEach((node) => {
      if (!node.closest('.polish-mobile-nav-dock')) node.remove();
    });
    document.querySelectorAll('.polish-mobile-menu-panel').forEach((node) => node.remove());

    const dock = document.createElement('div');
    dock.className = 'polish-mobile-nav-dock';
    dock.setAttribute('aria-hidden', 'false');
    const brand = document.createElement('a');
    brand.className = 'polish-mobile-nav-brand';
    brand.dataset.polishNavRole = 'brand';
    brand.href = '#';
    brand.setAttribute('aria-label', 'Return to home');
    const mobileBrandText = getEditableContentValue('nav.brand', 'YN.');
    const mobileBrandBase = mobileBrandText.endsWith('.') ? mobileBrandText.slice(0, -1) : mobileBrandText;
    brand.innerHTML = escapeHtml(mobileBrandBase) + (mobileBrandText.endsWith('.') ? '<span>.</span>' : '');
    const button = document.createElement('button');
    button.className = 'polish-mobile-menu-fallback md:hidden';
    button.dataset.polishNavRole = 'menu-toggle';
    button.type = 'button';
    button.setAttribute('aria-label', 'Open mobile navigation');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<span></span><span></span><span></span>';
    dock.appendChild(brand);
    dock.appendChild(button);
    document.body.appendChild(dock);

    const panel = document.createElement('div');
    panel.className = 'polish-mobile-menu-panel is-closed';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML =
      '<div class="polish-mobile-menu-panel__inner">' +
        '<a href="#gallery" data-polish-nav-role="works" data-polish-nav-target="#gallery" data-polish-nav-gallery="true">' + escapeHtml(getEditableContentValue('nav.contact', 'Works')) + '<span>01</span></a>' +
        '<a href="#projects" data-polish-nav-role="trajectory" data-polish-nav-target="#projects">' + escapeHtml(getEditableContentValue('nav.projects', 'Trajectory')) + '<span>02</span></a>' +
        '<a href="#about" data-polish-nav-role="statement" data-polish-nav-target="#about">' + escapeHtml(getEditableContentValue('nav.about', 'Statement')) + '<span>03</span></a>' +
        '<a href="#contact" data-polish-nav-role="cta" data-polish-nav-target="#contact">' + escapeHtml(getEditableContentValue('nav.cta', config.ctaText || 'Contact')) + '<span>04</span></a>' +
      '</div>';
    document.body.appendChild(panel);
    const menuLinks = Array.from(panel.querySelectorAll('a'));
    menuLinks.forEach((link, index) => {
      link.style.setProperty('--polish-mobile-menu-delay', (index * 62) + 'ms');
      link.style.setProperty('--polish-mobile-menu-exit-delay', ((menuLinks.length - 1 - index) * 62) + 'ms');
    });

    const linkStates = new WeakMap();
    let activeLink = null;
    let closeTimer = 0;

    function getLinkState(link) {
      let state = linkStates.get(link);
      if (!state) {
        state = { x: 0, y: 0, tx: 0, ty: 0, raf: 0 };
        linkStates.set(link, state);
      }
      return state;
    }

    function renderLink(link) {
      const state = getLinkState(link);
      state.raf = 0;
      state.x += (state.tx - state.x) * 0.36;
      state.y += (state.ty - state.y) * 0.36;
      if (Math.abs(state.x) < 0.01) state.x = 0;
      if (Math.abs(state.y) < 0.01) state.y = 0;
      link.style.setProperty('--polish-mobile-menu-x', state.x.toFixed(2) + 'px');
      link.style.setProperty('--polish-mobile-menu-y', state.y.toFixed(2) + 'px');
      if (Math.abs(state.x - state.tx) > 0.03 || Math.abs(state.y - state.ty) > 0.03) {
        state.raf = requestAnimationFrame(() => renderLink(link));
      } else if (state.tx === 0 && state.ty === 0) {
        link.classList.remove('is-polish-menu-hot');
        link.style.removeProperty('--polish-mobile-menu-x');
        link.style.removeProperty('--polish-mobile-menu-y');
      }
    }

    function moveLink(link, x, y) {
      const state = getLinkState(link);
      state.tx = x;
      state.ty = y;
      link.classList.add('is-polish-menu-hot');
      if (!state.raf) state.raf = requestAnimationFrame(() => renderLink(link));
    }

    function releaseLink(link) {
      if (link) moveLink(link, 0, 0);
    }

    function releaseAllLinks() {
      Array.from(panel.querySelectorAll('a')).forEach(releaseLink);
      activeLink = null;
    }

    function setOpen(open) {
      if (open === panel.classList.contains('is-open') && !panel.classList.contains('is-closing')) return;
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = 0;
      }
      button.classList.toggle('is-open', open);
      if (open) {
        panel.classList.remove('is-open', 'is-closing');
        panel.classList.add('is-closed');
        void panel.offsetWidth;
        panel.classList.remove('is-closed');
        panel.classList.add('is-open');
      } else {
        panel.classList.remove('is-open', 'is-closed');
        panel.classList.add('is-closing');
        closeTimer = setTimeout(() => {
          panel.classList.remove('is-closing');
          panel.classList.add('is-closed');
          closeTimer = 0;
        }, 700);
      }
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.setAttribute('aria-label', open ? 'Close mobile navigation' : 'Open mobile navigation');
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.documentElement.classList.toggle('polish-mobile-menu-open', open);
      if (!open) releaseAllLinks();
    }

    function returnHomeFromBlank() {
      setOpen(false);
      const home = document.querySelector('main > section:first-of-type') || document.querySelector('main');
      if (home) home.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (history.pushState) history.pushState(null, '', location.pathname + location.search);
    }

    function closeMenuInPlace() {
      setOpen(false);
    }

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setOpen(!panel.classList.contains('is-open'));
    });
    brand.addEventListener('click', (event) => {
      event.preventDefault();
      returnHomeFromBlank();
    });
    panel.addEventListener('click', (event) => {
      const link = event.target && event.target.closest && event.target.closest('a');
      if (link) {
        setOpen(false);
        return;
      }
      const clickedBlank = event.target === panel || event.target === panel.querySelector('.polish-mobile-menu-panel__inner');
      if (clickedBlank) {
        event.preventDefault();
        event.stopPropagation();
        closeMenuInPlace();
        return;
      }
    });
    function handleMenuLinkMove(event) {
      const link = event.target && event.target.closest && event.target.closest('.polish-mobile-menu-panel a');
      if (!link || !panel.contains(link)) {
        releaseLink(activeLink);
        activeLink = null;
        return;
      }
      if (activeLink && activeLink !== link) releaseLink(activeLink);
      activeLink = link;
      const rect = link.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width * 0.5);
      const dy = event.clientY - (rect.top + rect.height * 0.5);
      moveLink(link, clamp(dx * 0.11, -10, 10), clamp(dy * 0.16, -5, 5));
    }

    panel.addEventListener('pointermove', handleMenuLinkMove, { passive: true });
    panel.addEventListener('mousemove', handleMenuLinkMove, { passive: true });
    panel.addEventListener('mouseover', (event) => {
      const link = event.target && event.target.closest && event.target.closest('.polish-mobile-menu-panel a');
      if (link && panel.contains(link)) {
        activeLink = link;
        moveLink(link, 4, 0);
      }
    }, { passive: true });
    panel.addEventListener('pointerleave', () => {
      releaseAllLinks();
    }, { passive: true });
    panel.addEventListener('pointerdown', (event) => {
      const link = event.target && event.target.closest && event.target.closest('.polish-mobile-menu-panel a');
      if (link) moveLink(link, 3, 0);
    }, { passive: true });
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
    window.addEventListener('polish:mobile-menu-close', () => setOpen(false));
    window.addEventListener('resize', () => {
      if (!isCompactNavViewport()) setOpen(false);
    }, { passive: true });
  }

  function setupCompactNavMode() {
    function apply() {
      const enabled = isCompactNavViewport();
      document.documentElement.classList.toggle('polish-compact-nav', enabled);
      if (!enabled) {
        const panel = document.querySelector('.polish-mobile-menu-panel');
        panel?.classList.remove('is-open');
        panel?.classList.remove('is-closing');
        panel?.classList.add('is-closed');
        document.querySelector('.polish-mobile-menu-fallback')?.classList.remove('is-open');
        document.querySelector('.polish-mobile-menu-fallback')?.setAttribute('aria-expanded', 'false');
        document.documentElement.classList.remove('polish-mobile-menu-open');
      }
    }

    apply();
    window.addEventListener('resize', apply, { passive: true });
    window.visualViewport?.addEventListener('resize', apply, { passive: true });
    window.addEventListener('orientationchange', apply, { passive: true });
  }

  function setupResponsiveViewportGuard() {
    let raf = 0;
    function apply() {
      raf = 0;
      document.documentElement.scrollLeft = 0;
      document.body.scrollLeft = 0;
      if (window.scrollX) window.scrollTo(0, window.scrollY);
      document.documentElement.style.setProperty('--polish-viewport-w', (window.visualViewport?.width || window.innerWidth) + 'px');
    }
    function schedule() {
      if (!raf) raf = requestAnimationFrame(apply);
    }
    apply();
    window.addEventListener('resize', schedule, { passive: true });
    window.visualViewport?.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', () => {
      schedule();
      setTimeout(schedule, 120);
      setTimeout(schedule, 360);
    }, { passive: true });
    setTimeout(schedule, 600);
    setTimeout(schedule, 1600);
  }

  function watchMobileMenuFallback(config) {
    if (document.documentElement.dataset.polishMobileFallbackWatcher === 'true') return;
    document.documentElement.dataset.polishMobileFallbackWatcher = 'true';
    let raf = 0;
    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setupMobileMenuFallback(config);
      });
    }
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', schedule, { passive: true });
    setTimeout(schedule, 600);
    setTimeout(schedule, 1600);
  }

  function setupMobilePointerPolicy() {
    function apply() {
      if (!isCoarsePointerInput()) return;
      document.documentElement.classList.remove('polish-hide-system-cursor', 'polish-native-dot-cursor', 'polish-custom-cursor-ready');
      document.querySelectorAll('.polish-click-cursor, .polish-click-ring, .polish-click-burst').forEach((node) => node.remove());
      document.querySelectorAll('.polish-native-cursor-hidden').forEach((node) => node.classList.remove('polish-native-cursor-hidden'));
    }

    apply();
    window.addEventListener('resize', apply, { passive: true });
    window.addEventListener('orientationchange', apply, { passive: true });
  }

  function setupNav(config) {
    const nav = document.querySelector('nav');
    if (!nav) return;
    keepNavVisuals(config);
    setupMobileMenuFallback(config);
    watchMobileMenuFallback(config);

    if (!config.separateContactCta) return;

    const setDirectNavText = (link, label) => {
      if (!link || !label) return;
      const directText = Array.from(link.childNodes).find((node) => node.nodeType === 3 && String(node.nodeValue || '').trim());
      if (directText) {
        if (String(directText.nodeValue || '').trim() !== label) directText.nodeValue = label;
        return;
      }
      link.insertBefore(document.createTextNode(label), link.firstChild);
    };

    const setNavItem = (link, role, label, href, aria) => {
      if (!link) return;
      link.dataset.polishNavRole = role;
      setDirectNavText(link, label);
      link.setAttribute('href', href);
      link.setAttribute('aria-label', aria || ('Jump to ' + label));
      link.dataset.polishNavTarget = href;
      if (href === '#gallery') link.dataset.polishNavGallery = 'true';
      else delete link.dataset.polishNavGallery;
    };

    function getDesktopNavRoles() {
      const navGroup = nav.querySelector('.hidden.md\\:flex');
      if (!navGroup) return null;
      const links = Array.from(navGroup.querySelectorAll('a'));
      const claimed = new Set();
      const take = (role, fallback) => {
        const existing = links.find((link) => link.dataset.polishNavRole === role && !claimed.has(link));
        const link = existing || links.find((candidate) => !claimed.has(candidate) && fallback(candidate));
        if (!link) return null;
        claimed.add(link);
        link.dataset.polishNavRole = role;
        return link;
      };
      const cta = take('cta', (link) =>
        link.classList.contains('rounded-full') ||
        /get in touch|email me|start a project/i.test((link.textContent || '').trim())
      ) || take('cta', (link) => (link.getAttribute('href') || '') === '#contact');
      const statement = take('statement', (link) =>
        (link.getAttribute('href') || '') === '#about' || /^(about|statement)$/i.test((link.textContent || '').trim())
      );
      const trajectory = take('trajectory', (link) =>
        (link.getAttribute('href') || '') === '#projects' || /^(projects|trajectory)$/i.test((link.textContent || '').trim())
      );
      const works = take('works', (link) =>
        (link.getAttribute('href') || '') === '#gallery' || /^(works)$/i.test((link.textContent || '').trim())
      ) || take('works', (link) => (link.getAttribute('href') || '') === '#contact');
      return { navGroup, works, trajectory, statement, cta };
    }

    function applyDesktopNav() {
      const roles = getDesktopNavRoles();
      if (!roles) return;
      setNavItem(roles.works, 'works', getEditableContentValue('nav.contact', 'Works'), '#gallery', 'Jump to selected works');
      setNavItem(roles.trajectory, 'trajectory', getEditableContentValue('nav.projects', 'Trajectory'), '#projects', 'Jump to trajectory');
      setNavItem(roles.statement, 'statement', getEditableContentValue('nav.about', 'Statement'), '#about', 'Jump to profile statement');
      setNavItem(roles.cta, 'cta', getEditableContentValue('nav.cta', config.ctaText || 'Contact'), '#contact', 'Jump to contact');
      const orderedLinks = [roles.works, roles.trajectory, roles.statement, roles.cta].filter(Boolean);
      const orderedItems = orderedLinks.map((link) => Array.from(roles.navGroup.children).find((item) => item.contains(link))).filter(Boolean);
      orderedItems.forEach((item, index) => {
        item.classList.add('polish-shared-nav-home-item');
        item.dataset.polishNavItemRole = orderedLinks[index].dataset.polishNavRole;
        item.style.setProperty('--polish-shared-nav-exit-delay', ((orderedItems.length - 1 - index) * 8) + 'ms');
        item.style.setProperty('--polish-shared-nav-restore-delay', (index * 30) + 'ms');
      });
      const currentItems = Array.from(roles.navGroup.children).filter((item) => orderedItems.includes(item));
      if (orderedItems.some((item, index) => currentItems[index] !== item)) {
        orderedItems.forEach((item) => roles.navGroup.appendChild(item));
      }
    }

    function applyMobileNav() {
      Array.from(document.querySelectorAll('div.fixed.inset-0')).forEach((panel) => {
        if (panel.closest('.polish-project-detail, .polish-lightbox')) return;
        const links = Array.from(panel.querySelectorAll('a'));
        if (!links.length || !links.some((link) =>
          link.dataset.polishNavRole ||
          /^#(gallery|projects|about|contact)$/.test(link.dataset.polishNavTarget || link.getAttribute('href') || '') ||
          /about|projects|contact|works|trajectory|statement/i.test(link.textContent || '')
        )) return;
        const targetOf = (link) => link.dataset.polishNavTarget || link.getAttribute('href') || '';
        const byTarget = (target) => links.find((link) => targetOf(link) === target);
        const byText = (pattern) => links.find((link) => pattern.test((link.textContent || '').trim()));
        const byRole = (role) => links.find((link) => link.dataset.polishNavRole === role);
        const aboutLink = byRole('statement') || byTarget('#about') || byText(/^(about|statement)$/i);
        const projectsLink = byRole('trajectory') || byTarget('#projects') || byText(/^(projects|trajectory)$/i);
        let worksLink = byRole('works') || byTarget('#gallery') || byText(/^works$/i);
        let contactLink = byRole('cta') || byTarget('#contact') || byText(/^contact$/i);
        if (!worksLink && contactLink) {
          worksLink = contactLink;
          contactLink = null;
        }
        setNavItem(worksLink, 'works', getEditableContentValue('nav.contact', 'Works'), '#gallery', 'Jump to selected works');
        setNavItem(projectsLink, 'trajectory', getEditableContentValue('nav.projects', 'Trajectory'), '#projects', 'Jump to trajectory');
        setNavItem(aboutLink, 'statement', getEditableContentValue('nav.about', 'Statement'), '#about', 'Jump to profile statement');
        if (contactLink) setNavItem(contactLink, 'cta', getEditableContentValue('nav.cta', 'Contact'), '#contact', 'Jump to contact');
        if (!Array.from(panel.querySelectorAll('a')).some((link) => (link.dataset.polishNavTarget || link.getAttribute('href')) === '#contact')) {
          const contact = document.createElement('a');
          contact.className = links[0].className || 'text-3xl font-light text-foreground/70 hover:text-foreground transition-colors';
          setNavItem(contact, 'cta', getEditableContentValue('nav.cta', 'Contact'), '#contact', 'Jump to contact');
          panel.querySelector('.flex.flex-col')?.appendChild(contact);
        }
        const seenTargets = new Set();
        Array.from(panel.querySelectorAll('a')).forEach((link) => {
          const target = link.dataset.polishNavTarget || link.getAttribute('href') || '';
          if (!/^#(gallery|projects|about|contact)$/.test(target)) return;
          if (seenTargets.has(target)) link.remove();
          else seenTargets.add(target);
        });
      });
    }

    applyDesktopNav();
    applyMobileNav();
    if (nav.dataset.polishEditableNavListener !== 'true') {
      nav.dataset.polishEditableNavListener = 'true';
      window.addEventListener('editable:content-ready', () => {
        applyDesktopNav();
        applyMobileNav();
      });
    }
    if (document.documentElement.dataset.polishMobileNavWatcher !== 'true') {
      document.documentElement.dataset.polishMobileNavWatcher = 'true';
      const observer = new MutationObserver(() => requestAnimationFrame(applyMobileNav));
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function resolveDetailNavMode(config) {
    return config && config.detailNavMode === 'shared' ? 'shared' : 'legacy';
  }

  function setupSharedDetailNav(config) {
    const root = document.documentElement;
    const mode = resolveDetailNavMode(config);
    root.dataset.polishDetailNavMode = mode;
    root.dataset.polishDetailNavState = 'home';
    root.classList.remove('polish-shared-detail-active');
    if (mode !== 'shared' || root.dataset.polishSharedDetailNav === 'true') return;
    root.dataset.polishSharedDetailNav = 'true';
    let ensureRaf = 0;

    function ensureControls() {
      ensureRaf = 0;
      const nav = document.querySelector('nav');
      const frame = nav && nav.firstElementChild;
      if (frame) {
        nav.classList.add('polish-shared-nav-controller-ready');
        frame.classList.add('polish-shared-nav-frame');
        const brandItem = frame.firstElementChild;
        if (brandItem) {
          brandItem.classList.add('polish-shared-nav-home-item');
          brandItem.dataset.polishNavItemRole = 'brand';
          brandItem.style.setProperty('--polish-shared-nav-exit-delay', '0ms');
          brandItem.style.setProperty('--polish-shared-nav-restore-delay', '0ms');
          const brandLink = brandItem.querySelector('a');
          if (brandLink) brandLink.dataset.polishNavRole = 'brand';
        }
        let close = frame.querySelector('[data-polish-shared-detail-close]');
        if (!close) {
          close = document.createElement('button');
          close.type = 'button';
          close.className = 'polish-shared-detail-close';
          close.dataset.polishSharedDetailClose = 'true';
          close.dataset.polishNavRole = 'detail-close';
          close.setAttribute('aria-label', 'Close project detail');
          close.setAttribute('aria-hidden', 'true');
          close.tabIndex = -1;
          close.innerHTML = '<span class="polish-shared-detail-close__glyph" aria-hidden="true"><span class="polish-shared-detail-close__line"></span><span class="polish-shared-detail-close__line"></span><span class="polish-shared-detail-close__line"></span></span>';
          frame.appendChild(close);
        }
        close.removeAttribute('data-cursor');
        close.style.setProperty('cursor', 'none', 'important');
      }
      const mobileBrand = document.querySelector('.polish-mobile-nav-brand');
      if (mobileBrand) mobileBrand.dataset.polishNavRole = 'brand';
      const mobileButton = document.querySelector('.polish-mobile-menu-fallback');
      if (mobileButton) mobileButton.dataset.polishNavRole = 'menu-toggle';
    }

    function scheduleEnsure() {
      if (!ensureRaf) ensureRaf = requestAnimationFrame(ensureControls);
    }

    function setHomeContentHidden(hidden) {
      const nav = document.querySelector('nav');
      const navGroup = nav && nav.querySelector('.hidden.md\\:flex');
      const brandItem = nav && nav.firstElementChild && nav.firstElementChild.firstElementChild;
      const mobileBrand = document.querySelector('.polish-mobile-nav-brand');
      [navGroup, brandItem, mobileBrand].forEach((node) => {
        if (!node) return;
        node.inert = hidden;
        if (hidden) {
          node.dataset.polishSharedNavHidden = 'true';
          node.setAttribute('aria-hidden', 'true');
        } else if (node.dataset.polishSharedNavHidden === 'true') {
          delete node.dataset.polishSharedNavHidden;
          node.removeAttribute('aria-hidden');
        }
      });
    }

    function applyState(nextState) {
      ensureControls();
      const active = /^(entering|open|closing)$/.test(nextState);
      root.dataset.polishDetailNavState = active ? nextState : 'home';
      root.classList.toggle('polish-shared-detail-active', active);
      if (!active) root.style.removeProperty('--polish-shared-nav-gutter');
      if (nextState === 'entering') window.dispatchEvent(new CustomEvent('polish:mobile-menu-close'));
      setHomeContentHidden(active);
      const desktopClose = document.querySelector('[data-polish-shared-detail-close]');
      if (desktopClose) {
        desktopClose.setAttribute('aria-hidden', active ? 'false' : 'true');
        desktopClose.tabIndex = active ? 0 : -1;
      }
      const mobileButton = document.querySelector('.polish-mobile-menu-fallback');
      if (mobileButton) {
        const iconOpen = active && nextState !== 'closing';
        mobileButton.classList.toggle('is-open', iconOpen);
        if (active) {
          mobileButton.dataset.polishSharedDetailClose = 'true';
          mobileButton.setAttribute('aria-label', 'Close project detail');
          mobileButton.setAttribute('aria-expanded', 'false');
        } else {
          delete mobileButton.dataset.polishSharedDetailClose;
          mobileButton.setAttribute('aria-label', 'Open mobile navigation');
        }
      }
    }

    document.addEventListener('polish:detail-nav-state', (event) => {
      applyState(event.detail && event.detail.state ? event.detail.state : 'home');
    });
    document.addEventListener('click', (event) => {
      if (!root.classList.contains('polish-shared-detail-active')) return;
      const close = event.target && event.target.closest && event.target.closest('[data-polish-shared-detail-close]');
      if (!close) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      const detail = document.querySelector('.polish-project-detail.is-open');
      if (detail) detail.dispatchEvent(new CustomEvent('polish:request-close'));
    }, true);
    const observer = new MutationObserver(scheduleEnsure);
    observer.observe(document.body, { childList: true, subtree: true });
    ensureControls();
  }

  function setupGalleryNavJump() {
    if (document.documentElement.dataset.polishGalleryNavJump === 'true') return;
    document.documentElement.dataset.polishGalleryNavJump = 'true';
    document.addEventListener('click', (event) => {
      const link = event.target && event.target.closest && event.target.closest('a[data-polish-nav-target], a[href="#gallery"], a[data-polish-nav-gallery="true"]');
      if (!link) return;
      if (link.closest('.polish-project-detail')) return;
      const targetId = link.dataset.polishNavTarget || link.getAttribute('href') || '#gallery';
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      const polishMobilePanel = link.closest('.polish-mobile-menu-panel');
      if (polishMobilePanel) {
        polishMobilePanel.classList.remove('is-open');
        polishMobilePanel.classList.remove('is-closed');
        polishMobilePanel.classList.add('is-closing');
        setTimeout(() => {
          polishMobilePanel.classList.remove('is-closing');
          polishMobilePanel.classList.add('is-closed');
        }, 700);
        polishMobilePanel.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('polish-mobile-menu-open');
        const polishMobileButton = document.querySelector('.polish-mobile-menu-fallback');
        if (polishMobileButton) {
          polishMobileButton.classList.remove('is-open');
          polishMobileButton.setAttribute('aria-expanded', 'false');
          polishMobileButton.setAttribute('aria-label', 'Open mobile navigation');
        }
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (history.pushState) history.pushState(null, '', targetId);
      const mobilePanel = link.closest('div.fixed.inset-0');
      if (mobilePanel && !mobilePanel.closest('.polish-project-detail, .polish-lightbox')) {
        mobilePanel.style.opacity = '0';
        mobilePanel.style.pointerEvents = 'none';
        mobilePanel.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
          if (mobilePanel.parentNode) mobilePanel.parentNode.removeChild(mobilePanel);
        }, 260);
      }
    }, true);
  }

  function setupScrollIndicator(config) {
    if (!config.fixScrollIndicator) return;
    const scrollLink = document.querySelector('.polish-scroll-indicator a[data-polish-scroll-link="true"]') || Array.from(document.querySelectorAll('a[href="#about"], a[href="#gallery"], a[data-polish-scroll-link="true"]'))
      .find((link) => /scroll/i.test(link.textContent || ''));
    const holder = scrollLink && scrollLink.closest('.absolute');
    if (!holder) return;
    const hero = holder.closest('section');
    if (hero && holder.parentElement !== hero) hero.appendChild(holder);
    holder.className = 'polish-scroll-indicator';
    holder.dataset.polishNoElastic = 'true';
    scrollLink.dataset.polishNoElastic = 'true';
    scrollLink.dataset.polishScrollLink = 'true';
    scrollLink.setAttribute('href', '#gallery');
    scrollLink.setAttribute('title', 'Scroll to Visual paths');
    scrollLink.setAttribute('aria-label', 'Scroll to Visual paths');
    scrollLink.dataset.polishNavTarget = '#gallery';
    scrollLink.dataset.polishNavGallery = 'true';
    Array.from(scrollLink.querySelectorAll('*')).forEach((node) => {
      node.dataset.polishNoElastic = 'true';
      node.style.transform = 'none';
    });

    function positionSafely() {
      const subtitle = Array.from(document.querySelectorAll('p'))
        .find((node) => /Designing and building/i.test(node.textContent || ''));
      if (!hero || !subtitle) return;
      const heroRect = hero.getBoundingClientRect();
      const subtitleRect = subtitle.getBoundingClientRect();
      const holderHeight = Math.max(34, holder.getBoundingClientRect().height || 34);
      const desiredTop = subtitleRect.bottom - heroRect.top + 128;
      const minTop = subtitleRect.bottom - heroRect.top + 92;
      const maxTop = heroRect.height - holderHeight - 64;
      const top = clamp(desiredTop, minTop, maxTop);
      holder.style.top = Math.round(top) + 'px';
      holder.style.bottom = 'auto';
      holder.style.left = '50%';
      holder.style.right = 'auto';
      holder.style.transform = 'translate3d(-50%,0,0)';
    }

    positionSafely();
    setTimeout(positionSafely, 400);
    setTimeout(positionSafely, 1200);
    setTimeout(() => {
      scrollLink.setAttribute('href', '#gallery');
      scrollLink.setAttribute('title', 'Scroll to Visual paths');
      scrollLink.setAttribute('aria-label', 'Scroll to Visual paths');
      scrollLink.dataset.polishNavTarget = '#gallery';
      scrollLink.dataset.polishNavGallery = 'true';
    }, 1600);
    window.addEventListener('resize', positionSafely, { passive: true });
  }

  function disableHeroAvailability() {
    const label = Array.from(document.querySelectorAll('main section span, main section div'))
      .find((node) => {
        const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
        return text.length <= 64 && /Available\s+for\s+work/i.test(text);
      });
    if (!label) return;
    const holder = label.closest('.mb-8') || label.parentElement;
    if (!holder) return;
    holder.classList.add('polish-hero-availability-hidden');
    holder.setAttribute('aria-hidden', 'true');
    holder.style.setProperty('display', 'none', 'important');
    holder.style.setProperty('opacity', '0', 'important');
    holder.style.setProperty('visibility', 'hidden', 'important');
    holder.style.setProperty('pointer-events', 'none', 'important');
  }

  function disableStatsMotion() {
    const statsGrid = document.querySelector('#about .grid.grid-cols-3');
    if (!statsGrid) return;
    statsGrid.classList.add('polish-static-stats');
    statsGrid.dataset.polishNoElastic = 'true';
    Array.from(statsGrid.children).forEach((wrap) => {
      const statItem = wrap.querySelector('.text-center') || wrap;
      [statItem, statItem && statItem.parentElement].filter(Boolean).forEach((node) => {
        node.classList.add('polish-static-stat');
        node.dataset.polishNoElastic = 'true';
        node.style.setProperty('transform', 'none', 'important');
        node.style.setProperty('translate', 'none', 'important');
        node.style.setProperty('scale', 'none', 'important');
        node.style.setProperty('animation', 'none', 'important');
      });
    });
  }

  function lockSectionBodyMotion(section, legacyPrefix) {
    if (!section) return;
    section.classList.add('polish-static-body-section');
    if (legacyPrefix) section.classList.add(legacyPrefix + '-section');
    delete section.dataset.polishNoElastic;
    section.style.setProperty('opacity', '1', 'important');
    section.style.setProperty('transform', 'none', 'important');
    section.style.setProperty('translate', 'none', 'important');
    section.style.setProperty('scale', 'none', 'important');

    const title = section.querySelector('h2');
    if (title) {
      title.removeAttribute('data-polish-no-elastic');
      delete title.dataset.polishNoElastic;
    }
    const paragraphs = Array.from(section.querySelectorAll('p'));
    const bodyZone = paragraphs[0] ? paragraphs[0].parentElement : null;
    const bodyColumn = paragraphs[0] ? paragraphs[0].closest('.grid > div') : null;
    [bodyZone, bodyColumn].filter(Boolean).forEach((node) => {
      node.classList.add('polish-static-body-zone');
      if (legacyPrefix) node.classList.add(legacyPrefix + '-zone');
      if (title && node.contains(title)) delete node.dataset.polishNoElastic;
      else node.dataset.polishNoElastic = 'true';
      node.style.setProperty('transform', 'none', 'important');
      node.style.setProperty('translate', 'none', 'important');
      node.style.setProperty('scale', 'none', 'important');
      node.style.setProperty('animation', 'none', 'important');
    });

    paragraphs.forEach((node) => {
      node.classList.add('polish-static-body-copy');
      if (legacyPrefix) node.classList.add(legacyPrefix + '-copy');
      node.dataset.polishNoElastic = 'true';
      node.style.setProperty('opacity', '1', 'important');
      node.style.setProperty('transform', 'none', 'important');
      node.style.setProperty('translate', 'none', 'important');
      node.style.setProperty('scale', 'none', 'important');
      node.style.setProperty('animation', 'none', 'important');
    });
  }

  function disableStatementBodyMotion() {
    lockSectionBodyMotion(document.querySelector('[data-polish-section-role="statement"]') || document.querySelector('#about'), 'polish-static-statement');
  }

  function disableContactBodyMotion() {
    lockSectionBodyMotion(document.querySelector('[data-polish-section-role="contact"]') || document.querySelector('#contact'));
  }

  function freezeHeroDecorNode(node) {
    if (!node) return;
    const targets = [node].concat(Array.from(node.querySelectorAll('*')));
    targets.forEach((target) => {
      target.dataset.polishNoElastic = 'true';
      target.style.setProperty('animation', 'none', 'important');
      target.style.setProperty('transition', 'none', 'important');
      target.style.setProperty('will-change', 'auto', 'important');
      target.style.setProperty('translate', 'none', 'important');
      target.style.setProperty('scale', 'none', 'important');
      target.style.setProperty('rotate', 'none', 'important');
    });
    if (!node.classList.contains('polish-hero-decor-glow')) {
      node.style.setProperty('transform', 'none', 'important');
    }
    node.querySelectorAll('.animate-scroll-horizontal').forEach((target) => {
      target.style.setProperty('animation', 'none', 'important');
      target.style.setProperty('transform', 'none', 'important');
    });
  }

  function markHeroDecorLayers(hero, freezeMotion) {
    if (!hero) return;
    Array.from(hero.querySelectorAll(':scope > .absolute')).forEach((node) => {
      if (node.closest('.polish-scroll-indicator')) return;
      node.classList.add('polish-hero-decor');
      node.dataset.polishNoElastic = 'true';
      if (node.querySelector('[class*="rounded-full"][class*="border"]')) {
        node.classList.add('polish-hero-decor-circles');
      }
      if (node.querySelector('[class*="blur-"]')) {
        node.classList.add('polish-hero-decor-glow');
      }
      if (node.querySelector('[class*="border-l-2"], [class*="border-r-2"], [class*="border-t-2"], [class*="border-b-2"]')) {
        node.classList.add('polish-hero-decor-corners');
      }
      if (node.querySelector('.animate-scroll-horizontal')) {
        node.classList.add('polish-hero-decor-strip');
      }
      if (freezeMotion) freezeHeroDecorNode(node);
    });
  }

  function setupHeroVideo(config) {
    const hero = document.querySelector('main > section');
    if (!hero) return;
    let layer = hero.querySelector(':scope > .polish-hero-video-layer');
    const editableHeroEnabled = getEditableMediaValue('heroEnabled', config.heroVideo);
    if (!editableHeroEnabled) {
      if (layer) {
        if (typeof layer.__polishHeroVideoCleanup === 'function') layer.__polishHeroVideoCleanup();
        layer.remove();
      }
      document.documentElement.classList.remove('polish-hero-video-active');
      return;
    }

    const src = String(getEditableMediaValue('heroVideo', config.heroVideoSrc) || '').trim();
    const poster = String(getEditableMediaValue('heroPoster', config.heroVideoPoster) || '').trim();
    const allowMobile = config.heroVideoMobile !== false;
    if (!src && !poster) return;
    const lazyVideo = config.heroVideoLazy !== false;
    const lazyDelay = clamp(Number(config.heroVideoLazyDelay) || 0, 0, 4000);
    const preloadMode = String(config.heroVideoPreload || (lazyVideo ? 'none' : 'metadata')).trim() || 'none';
    const videoKey = [src, poster, allowMobile ? 'mobile' : 'desktop', lazyVideo ? 'lazy' : 'eager', lazyDelay, preloadMode].join('|');
    const canUseVideo = src && (allowMobile || !matchMedia('(hover: none), (pointer: coarse)').matches);
    if (layer && layer.dataset.polishHeroVideoKey === videoKey) {
      document.documentElement.classList.toggle('polish-hero-video-active', Boolean(src || poster));
      const existingVideo = layer.querySelector('video');
      if (!canUseVideo || existingVideo) {
        if (existingVideo && typeof existingVideo.__polishHeroSetVisible === 'function') {
          existingVideo.__polishHeroSetVisible(!hero.classList.contains('is-polish-hero-video-hidden'));
        } else if (existingVideo && !document.hidden && existingVideo.paused) {
          const playAttempt = existingVideo.play();
          if (playAttempt && typeof playAttempt.catch === 'function') playAttempt.catch(() => {});
        }
        return;
      }
      // A matching layer can survive a framework refresh after its media node
      // was discarded. Rebuild it instead of treating the matching key as a
      // healthy video instance.
      delete layer.dataset.polishHeroVideoScheduled;
    }

    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'polish-hero-video-layer';
      layer.setAttribute('aria-hidden', 'true');
      hero.insertBefore(layer, hero.firstChild);
    }
    if (typeof layer.__polishHeroVideoCleanup === 'function') layer.__polishHeroVideoCleanup();
    layer.__polishHeroVideoCleanup = null;
    layer.dataset.polishHeroVideoKey = videoKey;
    delete layer.dataset.polishHeroVideoScheduled;
    layer.classList.remove('is-polish-video-ready');
    layer.textContent = '';

    const fallback = document.createElement('div');
    fallback.className = 'polish-hero-video-fallback';
    if (poster) {
      fallback.classList.add('is-polish-hero-poster');
      fallback.style.backgroundImage = 'linear-gradient(rgba(0,0,0,.34), rgba(0,0,0,.34)), url("' + poster.replace(/["\\]/g, '\\$&') + '")';
    }
    layer.appendChild(fallback);

    const mountVideo = () => {
      if (!canUseVideo || !document.body.contains(layer) || layer.querySelector('video')) return;
      const video = document.createElement('video');
      video.className = 'polish-hero-video';
      const heroHidden = hero.classList.contains('is-polish-hero-video-hidden');
      video.autoplay = !heroHidden;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = preloadMode;
      video.defaultPlaybackRate = HERO_VIDEO_PLAYBACK_RATE;
      video.playbackRate = HERO_VIDEO_PLAYBACK_RATE;
      video.setAttribute('muted', '');
      if (!heroHidden) video.setAttribute('autoplay', '');
      video.setAttribute('loop', '');
      video.setAttribute('playsinline', '');
      if (poster) video.poster = poster;

      const source = document.createElement('source');
      source.src = src;
      source.type = /\.webm(?:$|\?)/i.test(src) ? 'video/webm' : 'video/mp4';
      video.appendChild(source);

      let destroyed = false;
      let recoveryTimer = 0;
      let watchdogTimer = 0;
      let reloadAttempts = 0;
      let lastMediaTime = 0;
      let lastProgressAt = performance.now();
      let lastPresentedFrameAt = performance.now();
      let frameWatchGeneration = 0;

      const heroVideoVisible = () => !destroyed && !document.hidden &&
        document.body.contains(video) && !hero.classList.contains('is-polish-hero-video-hidden');
      const showFallback = () => layer.classList.remove('is-polish-video-ready');
      const showVideo = () => {
        if (!heroVideoVisible() || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
        layer.classList.add('is-polish-video-ready');
        document.documentElement.classList.add('polish-hero-video-active');
      };
      const startPresentedFrameWatch = () => {
        if (!video.requestVideoFrameCallback) return;
        const generation = ++frameWatchGeneration;
        const watchFrame = () => {
          video.requestVideoFrameCallback(() => {
            if (destroyed || generation !== frameWatchGeneration) return;
            lastPresentedFrameAt = performance.now();
            showVideo();
            watchFrame();
          });
        };
        watchFrame();
      };
      const playVideo = () => {
        if (!heroVideoVisible()) return;
        video.defaultPlaybackRate = HERO_VIDEO_PLAYBACK_RATE;
        video.playbackRate = HERO_VIDEO_PLAYBACK_RATE;
        const playAttempt = video.play();
        if (playAttempt && typeof playAttempt.then === 'function') {
          playAttempt.then(showVideo).catch(showFallback);
        }
      };
      const recoverVideo = (forceReload) => {
        if (!heroVideoVisible()) return;
        showFallback();
        clearTimeout(recoveryTimer);
        recoveryTimer = window.setTimeout(() => {
          recoveryTimer = 0;
          if (!heroVideoVisible()) return;
          if (!forceReload && !video.paused && !video.ended &&
              video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            showVideo();
            return;
          }
          if (forceReload && reloadAttempts < 3) {
            reloadAttempts += 1;
            const resumeAt = Number.isFinite(video.duration) && video.duration > 0
              ? video.currentTime % video.duration
              : 0;
            frameWatchGeneration += 1;
            video.addEventListener('loadedmetadata', () => {
              if (destroyed) return;
              if (resumeAt > 0 && Number.isFinite(video.duration)) {
                try { video.currentTime = Math.min(resumeAt, Math.max(0, video.duration - 0.08)); } catch {}
              }
              lastMediaTime = video.currentTime || 0;
              lastProgressAt = performance.now();
              lastPresentedFrameAt = performance.now();
              startPresentedFrameWatch();
              playVideo();
            }, { once: true });
            video.load();
            return;
          }
          if (video.ended && Number.isFinite(video.duration)) {
            try { video.currentTime = 0; } catch {}
          }
          playVideo();
        }, forceReload ? 80 : 260);
      };
      const handleVisibilityChange = () => {
        if (!document.hidden && heroVideoVisible()) recoverVideo(false);
      };
      const handlePageShow = () => {
        if (heroVideoVisible()) recoverVideo(false);
      };

      video.__polishHeroSetVisible = (visible) => {
        if (!visible) {
          clearTimeout(recoveryTimer);
          frameWatchGeneration += 1;
          video.dataset.polishHeroOffscreenPaused = 'true';
          video.pause();
          return;
        }
        delete video.dataset.polishHeroOffscreenPaused;
        lastMediaTime = video.currentTime || 0;
        lastProgressAt = performance.now();
        lastPresentedFrameAt = performance.now();
        playVideo();
      };
      video.addEventListener('loadeddata', showVideo);
      video.addEventListener('canplay', showVideo);
      video.addEventListener('playing', () => {
        reloadAttempts = 0;
        lastProgressAt = performance.now();
        lastPresentedFrameAt = performance.now();
        startPresentedFrameWatch();
        showVideo();
      });
      video.addEventListener('timeupdate', () => {
        lastMediaTime = video.currentTime || 0;
        lastProgressAt = performance.now();
      });
      video.addEventListener('waiting', () => recoverVideo(false));
      video.addEventListener('stalled', () => recoverVideo(false));
      video.addEventListener('ended', () => recoverVideo(false));
      video.addEventListener('emptied', showFallback);
      video.addEventListener('error', () => recoverVideo(true));
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('pageshow', handlePageShow);

      watchdogTimer = window.setInterval(() => {
        if (!heroVideoVisible()) return;
        const now = performance.now();
        const currentTime = video.currentTime || 0;
        if (Math.abs(currentTime - lastMediaTime) > 0.01 || currentTime < lastMediaTime) {
          lastMediaTime = currentTime;
          lastProgressAt = now;
        }
        const frameStale = Boolean(video.requestVideoFrameCallback) && now - lastPresentedFrameAt > 2800;
        const timeStale = now - lastProgressAt > 2800;
        if (video.paused || video.ended) recoverVideo(false);
        else if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || frameStale || timeStale) recoverVideo(true);
      }, 1200);

      layer.__polishHeroVideoCleanup = () => {
        if (destroyed) return;
        destroyed = true;
        clearTimeout(recoveryTimer);
        window.clearInterval(watchdogTimer);
        frameWatchGeneration += 1;
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pageshow', handlePageShow);
        delete video.__polishHeroSetVisible;
      };
      layer.insertBefore(video, fallback);
      if (heroHidden) {
        video.dataset.polishHeroOffscreenPaused = 'true';
        video.pause();
      } else {
        startPresentedFrameWatch();
        playVideo();
      }
    };

    if (canUseVideo) {
      const scheduleVideo = () => {
        if (!document.body.contains(layer) || layer.dataset.polishHeroVideoScheduled === 'true') return;
        layer.dataset.polishHeroVideoScheduled = 'true';
        window.setTimeout(mountVideo, lazyVideo ? lazyDelay : 0);
      };
      if (lazyVideo) {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(scheduleVideo, { timeout: Math.max(1400, lazyDelay + 700) });
        } else if (document.readyState === 'complete') {
          scheduleVideo();
        } else {
          window.addEventListener('load', scheduleVideo, { once: true });
        }
      } else {
        scheduleVideo();
      }
    }

    document.documentElement.classList.toggle('polish-hero-video-active', Boolean(src || poster));
  }

  let fluidTrailVisibilityState = null;
  function setupFluidTrailVisibility() {
    if (fluidTrailVisibilityState) {
      fluidTrailVisibilityState.refresh();
      return;
    }

    const root = document.documentElement;
    let hero = null;
    let works = null;
    let raf = 0;

    function refresh() {
      hero = document.querySelector('main > section:first-of-type');
      works = document.querySelector('#gallery, [data-polish-section-role="works"]');
      requestUpdate();
    }

    function heroWorksOwnViewport(viewport) {
      if (!hero || !hero.isConnected) return false;
      const heroRect = hero.getBoundingClientRect();
      const worksRect = works && works.isConnected ? works.getBoundingClientRect() : null;
      const focusY = viewport * 0.5;
      const rangeTop = Math.min(heroRect.top, worksRect ? worksRect.top : heroRect.top);
      const rangeBottom = worksRect ? worksRect.bottom : heroRect.bottom;
      return rangeTop <= focusY && rangeBottom > focusY;
    }

    function update() {
      raf = 0;
      const viewport = window.innerHeight || document.documentElement.clientHeight || 1;
      const detailOpen = Boolean(document.querySelector(
        '.polish-project-detail.is-open, .polish-project-detail[data-state="open"]'
      ));
      const suppress = heroWorksOwnViewport(viewport) || detailOpen;
      root.classList.toggle('polish-fluid-trail-suppressed', suppress);
    }

    function requestUpdate() {
      if (!raf) raf = requestAnimationFrame(update);
    }

    const observer = new MutationObserver(refresh);
    const main = document.querySelector('main');
    if (main) observer.observe(main, { childList: true, subtree: true });
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    document.addEventListener('polish:detail-nav-state', requestUpdate);
    fluidTrailVisibilityState = { refresh };
    refresh();
  }

  let heroScrollMotionState = null;
  function setupHeroScrollMotion(config) {
    const hero = document.querySelector('main > section');
    if (!heroScrollMotionState && !hero) return;

    const isEnabled = config.heroScrollMotion !== false;
    const main = hero ? hero.closest('main') : null;
    const title = hero ? hero.querySelector('h1') : null;
    const content = title ? (title.closest('div.relative') || title.parentElement) : null;
    const freezeDecorMotion = config.heroDecorMotion === false;
    document.documentElement.classList.toggle('polish-hero-decor-static', freezeDecorMotion);
    markHeroDecorLayers(hero, freezeDecorMotion);

    if (!isEnabled || !hero || config.respectReducedMotion && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (heroScrollMotionState) heroScrollMotionState.destroy();
      if (config.heroDecorMotion !== false) document.documentElement.classList.remove('polish-hero-decor-static');
      if (hero) hero.classList.remove('polish-hero-scroll-motion');
      if (main) main.classList.remove('polish-hero-cover-main');
      if (content) content.classList.remove('polish-hero-scroll-content');
      return;
    }

    if (heroScrollMotionState && heroScrollMotionState.hero === hero) {
      if (heroScrollMotionState.main && heroScrollMotionState.main !== main) {
        heroScrollMotionState.main.classList.remove('polish-hero-cover-main');
      }
      if (heroScrollMotionState.content && heroScrollMotionState.content !== content) {
        heroScrollMotionState.content.classList.remove('polish-hero-scroll-content');
      }
      heroScrollMotionState.sections.forEach((section) => {
        section.classList.remove('polish-hero-cover-section', 'polish-hero-cover-first-section');
        section.style.removeProperty('--polish-hero-cover-y');
      });
      heroScrollMotionState.main = main;
      heroScrollMotionState.content = content;
      heroScrollMotionState.sections = collectHeroCoverSections(hero);
      if (main) main.classList.add('polish-hero-cover-main');
      if (content) content.classList.add('polish-hero-scroll-content');
      heroScrollMotionState.sections.forEach((section) => section.classList.add('polish-hero-cover-section'));
      if (heroScrollMotionState.sections[0]) heroScrollMotionState.sections[0].classList.add('polish-hero-cover-first-section');
      if (heroScrollMotionState.requestUpdate) heroScrollMotionState.requestUpdate();
      return;
    }

    if (heroScrollMotionState) heroScrollMotionState.destroy();

    hero.classList.add('polish-hero-scroll-motion');
    if (content) content.classList.add('polish-hero-scroll-content');
    const sections = collectHeroCoverSections(hero);
    if (main) main.classList.add('polish-hero-cover-main');
    sections.forEach((section) => section.classList.add('polish-hero-cover-section'));
    if (sections[0]) sections[0].classList.add('polish-hero-cover-first-section');

    let raf = 0;
    let watchTimer = 0;
    const state = { hero, main, content, sections, requestUpdate, destroy, lastHideVideo: null };

    function update() {
      raf = 0;
      if (!document.body.contains(hero)) {
        destroy();
        return;
      }
      const rect = hero.getBoundingClientRect();
      const firstCover = state.sections[0] || null;
      const coverTop = firstCover && document.body.contains(firstCover)
        ? firstCover.getBoundingClientRect().top
        : rect.bottom;

      // The hero is the stationary visual plane. Every following module keeps
      // its native document flow and travels upward over this plane.
      hero.style.setProperty('--polish-hero-content-y', '0px');
      hero.style.setProperty('--polish-hero-content-scale', '1');
      hero.style.setProperty('--polish-hero-content-opacity', '1');
      hero.style.setProperty('--polish-hero-indicator-y', '0px');
      hero.style.setProperty('--polish-hero-indicator-opacity', '.86');
      hero.style.setProperty('--polish-hero-video-y', '0px');
      hero.style.setProperty('--polish-hero-video-scale', '1');
      if (firstCover) firstCover.style.removeProperty('--polish-hero-cover-y');
      const hideVideo = coverTop <= 2;
      if (state.lastHideVideo !== hideVideo) {
        state.lastHideVideo = hideVideo;
        hero.classList.toggle('is-polish-hero-video-hidden', hideVideo);
        const video = hero.querySelector('.polish-hero-video');
        if (video && typeof video.__polishHeroSetVisible === 'function') {
          video.__polishHeroSetVisible(!hideVideo);
        }
      }
    }

    function requestUpdate() {
      update();
      if (!raf) raf = requestAnimationFrame(update);
      startWatch();
    }

    function startWatch() {
      watchHeroEdge();
      if (!watchTimer) watchTimer = window.setInterval(watchHeroEdge, 80);
    }

    function watchHeroEdge() {
      update();
      if (!document.body.contains(hero) || heroScrollMotionState !== state) return;
      const viewport = window.innerHeight || document.documentElement.clientHeight || 1;
      const rect = hero.getBoundingClientRect();
      const bridge = document.querySelector('.polish-marquee-removed');
      const bridgeRect = bridge ? bridge.getBoundingClientRect() : null;
      const heroNear = rect.bottom > -viewport * .4 && rect.top < viewport * 1.15;
      const bridgeNear = bridgeRect ? bridgeRect.bottom > -viewport * .4 && bridgeRect.top < viewport * 1.15 : false;
      if (!heroNear && !bridgeNear && watchTimer) {
        window.clearInterval(watchTimer);
        watchTimer = 0;
      }
    }

    function destroy() {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (raf) cancelAnimationFrame(raf);
      if (watchTimer) window.clearInterval(watchTimer);
      hero.classList.remove('polish-hero-scroll-motion');
      hero.classList.remove('is-polish-hero-video-hidden');
      const video = hero.querySelector('.polish-hero-video');
      if (video && typeof video.__polishHeroSetVisible === 'function') {
        video.__polishHeroSetVisible(true);
      }
      hero.style.removeProperty('--polish-hero-video-y');
      hero.style.removeProperty('--polish-hero-video-scale');
      hero.style.removeProperty('--polish-hero-content-y');
      hero.style.removeProperty('--polish-hero-content-scale');
      hero.style.removeProperty('--polish-hero-content-opacity');
      hero.style.removeProperty('--polish-hero-indicator-y');
      hero.style.removeProperty('--polish-hero-indicator-opacity');
      if (state.main) state.main.classList.remove('polish-hero-cover-main');
      if (state.content) state.content.classList.remove('polish-hero-scroll-content');
      state.sections.forEach((section) => {
        section.classList.remove('polish-hero-cover-section', 'polish-hero-cover-first-section');
        section.style.removeProperty('--polish-hero-cover-y');
      });
      if (heroScrollMotionState === state) heroScrollMotionState = null;
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    heroScrollMotionState = state;
    update();
    startWatch();
  }

  function collectHeroCoverSections(hero) {
    const parent = hero && hero.parentElement;
    if (!parent) return [];
    const children = Array.from(parent.children);
    const heroIndex = children.indexOf(hero);
    if (heroIndex < 0) return [];
    return children.slice(heroIndex + 1).filter((node) => node instanceof HTMLElement && node.tagName === 'SECTION');
  }

  function setPlainText(node, text) {
    if (!node || typeof text !== 'string') return;
    if (node.textContent !== text) node.textContent = text;
  }

  function setTitleEntranceMarkup(title, html, key) {
    if (!title) return false;
    const markupKey = key || html;
    if (title.dataset.polishTitleMarkupKey === markupKey) return false;
    resetTitleEntrance(title);
    title.dataset.polishTitleMarkupKey = markupKey;
    title.innerHTML = html;
    return true;
  }

  function replaceTitleMarkup(section, line1, line2) {
    const title = section && section.querySelector('h2');
    if (!title) return;
    setTitleEntranceMarkup(title, '<span>' + escapeHtml(line1) + '</span><br/><span class="text-foreground/30">' + escapeHtml(line2) + '</span>', line1 + '|' + line2);
    title.removeAttribute('data-polish-no-elastic');
    setupTitleEntrance(section, false);
  }

  function markProfileStatementCards(statement) {
    if (!statement) return;
    Array.from(statement.querySelectorAll('.group')).slice(0, 4).forEach((card) => {
      card.dataset.polishProfileCard = 'true';
      card.removeAttribute('data-cursor');
      const motionWrap = card.parentElement;
      if (motionWrap && motionWrap instanceof HTMLElement) motionWrap.dataset.polishProfileCardWrap = 'true';
    });
  }

  function applySiteArchitecture() {
    const main = document.querySelector('main');
    const gallery = document.querySelector('#gallery');
    const trajectory = document.querySelector('#projects');
    const statement = document.querySelector('#about');
    const contact = document.querySelector('#contact');
    if (!main) return;

    if (gallery) {
      gallery.dataset.polishSectionRole = 'works';
      setPlainText(gallery.querySelector('.polish-gallery-kicker'), getEditableContentValue('works.label', '02 - Works'));
      const title = gallery.querySelector('.polish-gallery-title');
      if (title) {
        const worksLine1 = getEditableContentValue('works.titleLine1', 'Visual');
        const worksLine2 = getEditableContentValue('works.titleLine2', 'paths');
        setTitleEntranceMarkup(title, escapeHtml(worksLine1) + '<br/><span class="polish-gallery-title-muted">' + escapeHtml(worksLine2) + '</span>', 'gallery|' + worksLine1 + '|' + worksLine2);
        if (title.dataset.polishArchitectureMotion !== 'true') {
          if (galleryTitleMotionCleanup) galleryTitleMotionCleanup();
          title.dataset.polishArchitectureMotion = 'true';
          setupGalleryTitleMotion(gallery);
        }
        setupTitleEntrance(gallery, false);
      }
    }

    if (trajectory) {
      trajectory.dataset.polishSectionRole = 'trajectory';
      setPlainText(trajectory.querySelector('.text-xs.font-mono'), getEditableContentValue('trajectory.label', '03 - Trajectory'));
      replaceTitleMarkup(trajectory, getEditableContentValue('trajectory.titleLine1', 'Creative'), getEditableContentValue('trajectory.titleLine2', 'trajectory'));
      const titleWrap = trajectory.querySelector('h2') && trajectory.querySelector('h2').closest('.mb-16');
      if (titleWrap) titleWrap.removeAttribute('data-polish-no-elastic');
      const rows = Array.from(trajectory.querySelectorAll('[data-cursor="pointer"]'));
      const fallbackMilestones = [
        ['2026', 'Portfolio system', 'Static GitHub Pages ready site with local preview, project detail pages, and refined motion direction.'],
        ['2025', 'Motion studies', 'Scroll, hover, image layering, and dark interface experiments shaped into a reusable visual language.'],
        ['2024', 'Visual archive', 'Collected image-led studies, small media tests, and selected references for future project pages.']
      ];
      const editableMilestones = getEditableContentRaw('trajectory.items');
      const itemType = getEditableContentValue('trajectory.itemType', 'Milestone');
      rows.forEach((row, index) => {
        const editable = Array.isArray(editableMilestones) ? editableMilestones[index] : null;
        const data = editable ? [editable.year || '', editable.title || '', editable.description || ''] : fallbackMilestones[index % fallbackMilestones.length];
        const title = row.querySelector('h3');
        const category = row.querySelector('.text-xs.font-mono.text-foreground\\/30');
        const desc = row.querySelector('p');
        const year = Array.from(row.querySelectorAll('.text-xs.font-mono')).find((node) => /^\d{4}$/.test((node.textContent || '').trim()));
        setPlainText(title, data[1]);
        setPlainText(category, itemType);
        setPlainText(desc, data[2]);
        setPlainText(year, data[0]);
        if (editable && Array.isArray(editable.tags)) {
          Array.from(row.querySelectorAll('.flex.flex-wrap span')).forEach((tag, tagIndex) => setPlainText(tag, String(editable.tags[tagIndex] || '')));
        }
      });
    }

    if (statement) {
      statement.dataset.polishSectionRole = 'statement';
      setPlainText(statement.querySelector('.text-xs.font-mono'), getEditableContentValue('about.label', '04 - Statement'));
      replaceTitleMarkup(statement, getEditableContentValue('about.titleLine1', 'Profile'), getEditableContentValue('about.titleLine2', 'statement'));
      const services = getEditableContentRaw('about.services');
      if (Array.isArray(services)) {
        Array.from(statement.querySelectorAll('.group')).slice(0, services.length).forEach((card, index) => {
          setPlainText(card.querySelector('h3, h4'), String(services[index].title || ''));
          setPlainText(card.querySelector('p'), String(services[index].description || ''));
        });
      }
      markProfileStatementCards(statement);
      disableStatementBodyMotion();
    }

    if (contact) {
      contact.dataset.polishSectionRole = 'contact';
      setPlainText(contact.querySelector('.text-xs.font-mono'), getEditableContentValue('contact.label', '05 - Contact'));
      disableContactBodyMotion();
    }

    if (gallery && trajectory && statement && contact) {
      main.insertBefore(gallery, trajectory);
      main.insertBefore(trajectory, statement);
      main.insertBefore(statement, contact);
      document.documentElement.dataset.polishArchitectureApplied = 'true';
    }
  }

  function removeMarqueeStrip(config) {
    if (!config.removeMarqueeStrip) return;
    Array.from(document.querySelectorAll('.animate-marquee')).forEach((marquee) => {
      const text = (marquee.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/CREATE/i.test(text) || !/INNOVATE/i.test(text) || !/BUILD/i.test(text)) return;
      const strip = marquee.closest('main > div') || marquee.parentElement;
      if (strip) {
        strip.classList.add('polish-marquee-removed');
        strip.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function setupClickHover(config) {
    if (!config.clickHover || isCoarsePointerInput()) return;
    hideNativeCursorFollowers();

    const cursor = document.createElement('span');
    cursor.className = 'polish-click-cursor';
    document.body.appendChild(cursor);
    const ring = document.createElement('span');
    ring.className = 'polish-click-ring';
    document.body.appendChild(ring);

    const pointer = { x: -80, y: -80, active: false, inside: false };
    const ringState = { x: -80, y: -80, ready: false, raf: 0 };
    const sizes = { dot: 6, ring: 35, ringDot: 3, activeScale: 1.16 };
    const clickableSelector = 'a,button,[role="button"],[data-cursor="pointer"],input,textarea,select,summary';
    let currentTarget = null;
    let scrollHoverTimer = 0;
    let lastPointerMoveAt = 0;
    let customCursorReady = false;
    let initialHandoffTimer = 0;
    let initialHandoffSource = null;
    const burstNodes = [];

    function setTarget(target) {
      if (currentTarget === target) return;
      if (currentTarget) currentTarget.classList.remove('is-polish-hot');
      currentTarget = target;
      if (currentTarget) {
        currentTarget.classList.add('polish-click-target', 'is-polish-hot');
      }
    }

    function paintCursor() {
      if (!customCursorReady) {
        cursor.classList.remove('is-visible', 'is-active');
        ring.classList.remove('is-visible', 'is-active');
        return;
      }
      const sideCloseHot = document.documentElement.classList.contains('polish-detail-side-close-hot');
      const interactiveHot = pointer.active || sideCloseHot;
      document.documentElement.classList.toggle('polish-cursor-interactive-hot', interactiveHot);
      cursor.style.transform = 'translate3d(' + (pointer.x - sizes.dot / 2) + 'px,' + (pointer.y - sizes.dot / 2) + 'px,0) scale(' + (pointer.active ? sizes.activeScale : '1') + ')';
      cursor.classList.toggle('is-visible', pointer.inside);
      cursor.classList.toggle('is-active', pointer.active);
      ring.classList.toggle('is-visible', pointer.inside);
      ring.classList.toggle('is-active', pointer.active);
      requestRingFrame();
    }

    function paintRing() {
      ringState.raf = 0;
      if (!ringState.ready) {
        ringState.x = pointer.x;
        ringState.y = pointer.y;
        ringState.ready = true;
      }
      ringState.x += (pointer.x - ringState.x) * 0.34;
      ringState.y += (pointer.y - ringState.y) * 0.34;
      const isDetailSideClose = document.documentElement.classList.contains('polish-detail-side-close-hot');
      const ringScale = isDetailSideClose ? .92 : (pointer.active ? sizes.activeScale : 1);
      const ringSize = sizes.ring * ringScale;
      const ringDot = sizes.ringDot * (pointer.active ? sizes.activeScale : 1);
      const ringOrbitRadius = Math.max(0, ringSize / 2 - 0.5);
      ring.style.setProperty('--polish-ring-size', ringSize + 'px');
      ring.style.setProperty('--polish-ring-dot', ringDot + 'px');
      ring.style.setProperty('--polish-ring-orbit-radius', ringOrbitRadius + 'px');
      ring.style.transform = 'translate3d(' + (ringState.x - ringSize / 2) + 'px,' + (ringState.y - ringSize / 2) + 'px,0)';
      if (pointer.inside && (Math.abs(pointer.x - ringState.x) > 0.2 || Math.abs(pointer.y - ringState.y) > 0.2)) {
        requestRingFrame();
      }
    }

    function requestRingFrame() {
      if (!ringState.raf) ringState.raf = requestAnimationFrame(paintRing);
    }

    function finishCursorHandoff(source) {
      if (customCursorReady || !pointer.inside) return;
      customCursorReady = true;
      cursor.classList.add('is-priming');
      ring.classList.add('is-priming');
      ringState.x = pointer.x;
      ringState.y = pointer.y;
      ringState.ready = true;
      document.documentElement.classList.remove('polish-hide-system-cursor');
      document.documentElement.classList.add('polish-custom-cursor-ready', 'polish-native-dot-cursor');
      updateFromElement(source || document.elementFromPoint(pointer.x, pointer.y));
      requestAnimationFrame(() => {
        cursor.classList.remove('is-priming');
        ring.classList.remove('is-priming');
      });
    }

    function scheduleInitialHandoff(source) {
      initialHandoffSource = source || initialHandoffSource;
      clearTimeout(initialHandoffTimer);
      initialHandoffTimer = setTimeout(() => {
        initialHandoffTimer = 0;
        finishCursorHandoff(initialHandoffSource);
      }, 90);
    }

    function updateFromElement(source) {
      const directTarget = source && source.closest && source.closest(clickableSelector);
      const proximityTarget = getSharedDetailCloseProximityTarget(pointer.x, pointer.y) ||
        getGalleryButtonProximityTarget(pointer.x, pointer.y);
      const target = directTarget || proximityTarget;
      pointer.active = !!target;
      setTarget(target || null);
      paintCursor();
    }

    function move(event) {
      cursor.classList.remove('is-passive-hidden');
      ring.classList.remove('is-passive-hidden');
      cursor.style.removeProperty('opacity');
      cursor.style.removeProperty('visibility');
      ring.style.removeProperty('opacity');
      ring.style.removeProperty('visibility');
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      lastPointerMoveAt = performance.now();
      if (!customCursorReady) {
        finishCursorHandoff(event.target);
        return;
      }
      if (!ringState.ready) {
        ringState.x = pointer.x;
        ringState.y = pointer.y;
      }
      updateFromElement(event.target);
    }

    function primeCursor(event) {
      cursor.classList.remove('is-passive-hidden');
      ring.classList.remove('is-passive-hidden');
      cursor.style.removeProperty('opacity');
      cursor.style.removeProperty('visibility');
      ring.style.removeProperty('opacity');
      ring.style.removeProperty('visibility');
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      lastPointerMoveAt = performance.now();
      finishCursorHandoff(event.target);
      paintCursor();
    }

    function leave() {
      clearTimeout(initialHandoffTimer);
      initialHandoffTimer = 0;
      pointer.active = false;
      pointer.inside = false;
      setTarget(null);
      paintCursor();
    }

    function keepVisibleDuringScroll() {
      if (!customCursorReady || !pointer.inside) return;
      cursor.classList.remove('is-passive-hidden');
      ring.classList.remove('is-passive-hidden');
      cursor.style.removeProperty('opacity');
      cursor.style.removeProperty('visibility');
      ring.style.removeProperty('opacity');
      ring.style.removeProperty('visibility');
      paintCursor();
    }

    function syncAfterScroll() {
      if (!pointer.inside) {
        leave();
        return;
      }
      if (pointer.x < 0 || pointer.y < 0 || pointer.x > window.innerWidth || pointer.y > window.innerHeight) {
        leave();
        return;
      }
      requestAnimationFrame(() => {
        const source = document.elementFromPoint(pointer.x, pointer.y);
        if (source) updateFromElement(source);
        else leave();
      });
    }

    function scheduleScrollSync() {
      keepVisibleDuringScroll();
      clearTimeout(scrollHoverTimer);
      scrollHoverTimer = setTimeout(syncAfterScroll, 140);
    }

    function spawnClickMotion(event) {
      if (!config.cursorClickMotion || event.pointerType === 'touch' || event.button > 0) return;
      const burst = document.createElement('span');
      burst.className = 'polish-click-burst';
      burst.setAttribute('aria-hidden', 'true');
      burst.style.setProperty('--polish-burst-x', event.clientX + 'px');
      burst.style.setProperty('--polish-burst-y', event.clientY + 'px');

      [
        ['0px', '0px'],
        ['3px', '-5px'],
        ['-5px', '4px'],
        ['0px', '0px']
      ].forEach(([dx, dy]) => {
        const layer = document.createElement('span');
        layer.className = 'polish-click-burst__layer';
        layer.style.setProperty('--polish-burst-dx', dx);
        layer.style.setProperty('--polish-burst-dy', dy);
        burst.appendChild(layer);
      });

      const core = document.createElement('span');
      core.className = 'polish-click-burst__core';
      burst.appendChild(core);
      document.body.appendChild(burst);
      burstNodes.push(burst);
      while (burstNodes.length > 8) {
        const stale = burstNodes.shift();
        if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
      }
      setTimeout(() => {
        const index = burstNodes.indexOf(burst);
        if (index >= 0) burstNodes.splice(index, 1);
        if (burst.parentNode) burst.parentNode.removeChild(burst);
      }, 760);
    }

    window.addEventListener('pointermove', primeCursor, { once: true, capture: true, passive: true });
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', spawnClickMotion, { passive: true });
    window.addEventListener('pointerleave', leave, { passive: true });
    window.addEventListener('wheel', scheduleScrollSync, { passive: true });
    window.addEventListener('scroll', scheduleScrollSync, { passive: true });
    document.addEventListener('pointerout', (event) => {
      if (currentTarget && !currentTarget.contains(event.relatedTarget)) {
        const proximityTarget = getSharedDetailCloseProximityTarget(pointer.x, pointer.y) ||
          getGalleryButtonProximityTarget(pointer.x, pointer.y);
        if (proximityTarget === currentTarget) return;
        pointer.active = false;
        setTarget(null);
        paintCursor();
      }
    }, { passive: true });
    document.addEventListener('polish:detail-side-close-cursor', paintCursor);
  }

  function setupMagneticButtons(config) {
    if (!config.magneticButtons || isCoarsePointerInput()) return;
    const selector = 'a, button, [role="button"], [data-cursor="pointer"], summary';
    const navMagneticReach = SHARED_DETAIL_CLOSE_MAGNETIC_REACH;
    const states = new WeakMap();
    let active = null;

    function getState(el) {
      let state = states.get(el);
      if (!state) {
        state = { x: 0, y: 0, tx: 0, ty: 0, raf: 0 };
        states.set(el, state);
      }
      return state;
    }

    function render(el) {
      const state = getState(el);
      state.raf = 0;
      const easing = el.matches('nav [data-polish-nav-role]') ? 0.22 : 0.32;
      state.x += (state.tx - state.x) * easing;
      state.y += (state.ty - state.y) * easing;
      if (Math.abs(state.x) < 0.01) state.x = 0;
      if (Math.abs(state.y) < 0.01) state.y = 0;
      el.style.setProperty('--polish-magnetic-x', state.x.toFixed(2) + 'px');
      el.style.setProperty('--polish-magnetic-y', state.y.toFixed(2) + 'px');
      if (Math.abs(state.x - state.tx) > 0.03 || Math.abs(state.y - state.ty) > 0.03) {
        state.raf = requestAnimationFrame(() => render(el));
      } else if (state.tx === 0 && state.ty === 0) {
        el.classList.remove('is-polish-hot');
        el.style.removeProperty('--polish-magnetic-x');
        el.style.removeProperty('--polish-magnetic-y');
      }
    }

    function tweenTo(el, x, y) {
      const state = getState(el);
      state.tx = x;
      state.ty = y;
      el.classList.add('polish-click-target', 'is-polish-hot');
      if (!state.raf) state.raf = requestAnimationFrame(() => render(el));
    }

    function release(el) {
      if (!el) return;
      tweenTo(el, 0, 0);
    }

    function getNavMagneticMatch(x, y) {
      const navState = document.documentElement.dataset.polishDetailNavState || 'home';
      if (navState === 'closing') return null;
      const detailActive = /^(entering|open)$/.test(navState);
      let best = null;
      document.querySelectorAll('nav [data-polish-nav-role]').forEach((control) => {
        const isDetailClose = control.dataset.polishNavRole === 'detail-close';
        if (isDetailClose !== detailActive) return;
        const style = getComputedStyle(control);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < 0.08) return;
        const rect = control.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const controlState = getState(control);
        const left = rect.left - controlState.x;
        const right = rect.right - controlState.x;
        const top = rect.top - controlState.y;
        const bottom = rect.bottom - controlState.y;
        const outsideX = Math.max(left - x, 0, x - right);
        const outsideY = Math.max(top - y, 0, y - bottom);
        const edgeDistance = Math.hypot(outsideX, outsideY);
        if (edgeDistance > navMagneticReach) return;
        const centerDistance = Math.hypot(x - (left + rect.width * 0.5), y - (top + rect.height * 0.5));
        const score = edgeDistance * 1000 + centerDistance;
        if (best && best.score <= score) return;
        const linear = clamp(1 - edgeDistance / navMagneticReach, 0, 1);
        best = {
          control,
          influence: linear * linear * (3 - 2 * linear),
          score
        };
      });
      return best;
    }

    document.addEventListener('pointermove', (event) => {
      let target = event.target && event.target.closest && event.target.closest(selector);
      let navMagneticInfluence = 0;
      const navMatch = getNavMagneticMatch(event.clientX, event.clientY);
      if (navMatch) {
        target = navMatch.control;
        navMagneticInfluence = navMatch.influence;
      }
      const detailMagneticAllowed = target && target.closest('.polish-project-detail__link, .polish-project-detail__back');
      const skipMagnetic = target && (
        target.closest('.polish-gallery-grid, .polish-gallery-controls, #projects') ||
        (target.closest('.polish-project-detail') && !detailMagneticAllowed)
      );
      if (!target || skipMagnetic || !document.body.contains(target)) {
        if (active) {
          release(active);
          active = null;
        }
        return;
      }
      if (active && active !== target) release(active);
      active = target;

      const rect = target.getBoundingClientRect();
      const state = getState(target);
      const isNavControl = target.matches('nav [data-polish-nav-role]');
      const centerX = rect.left + rect.width * 0.5 - (isNavControl ? state.x : 0);
      const centerY = rect.top + rect.height * 0.5 - (isNavControl ? state.y : 0);
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const isDetailClose = target.matches('.polish-project-detail__back, .polish-shared-detail-close');
      const sizeFactor = clamp(Math.min(rect.width, rect.height) / 80, 0.55, 1);
      const maxX = isNavControl ? 6.5 : (isDetailClose ? 7 : 14 * sizeFactor);
      const maxY = isNavControl ? 5.5 : (isDetailClose ? 6 : 10 * sizeFactor);
      const strengthX = isNavControl ? 0.20 * navMagneticInfluence : (isDetailClose ? 0.42 : 0.16);
      const strengthY = isNavControl ? 0.20 * navMagneticInfluence : (isDetailClose ? 0.42 : 0.2);
      tweenTo(target, clamp(dx * strengthX, -maxX, maxX), clamp(dy * strengthY, -maxY, maxY));
    }, { passive: true });

    document.addEventListener('polish:detail-nav-state', (event) => {
      const stateName = event.detail && event.detail.state;
      if (stateName !== 'closing' && stateName !== 'closed') return;
      const close = document.querySelector('.polish-shared-detail-close');
      if (!close) return;
      if (active === close) active = null;
      const state = getState(close);
      state.tx = 0;
      state.ty = 0;
      close.classList.remove('is-polish-hot');
      if (!state.raf) state.raf = requestAnimationFrame(() => render(close));
    });

    document.addEventListener('pointerleave', () => {
      release(active);
      active = null;
    }, { passive: true });
    window.addEventListener('scroll', () => {
      if (!active) return;
      release(active);
      active = null;
    }, { passive: true });
  }

  function setupPointerPerformanceGate() {
    if (isCoarsePointerInput()) return;
    document.addEventListener('mousemove', (event) => {
      const target = event.target;
      if (!target || !target.closest) return;
      if (target.closest('.polish-project-detail__link')) return;
      if (target.closest('.polish-gallery-grid, .polish-project-detail')) {
        event.stopPropagation();
      }
    }, true);
  }

  function setupHoverStateSync() {
    if (isCoarsePointerInput()) return;
    let x = -1;
    let y = -1;
    let raf = 0;
    let scrollTimer = 0;
    const selector = '#projects [data-cursor="pointer"], .polish-layer-tile, .polish-project-detail__image-frame, #about [data-polish-profile-card]';

    function resetProfileCardMotion(card) {
      if (!card || !card.matches || !card.matches('#about [data-polish-profile-card]')) return;
      const wrap = card.closest('[data-polish-profile-card-wrap]') || card.parentElement;
      if (!wrap || !(wrap instanceof HTMLElement)) return;
      wrap.style.transition = 'transform .42s cubic-bezier(.16,1,.3,1)';
      wrap.style.transform = 'perspective(1000px)';
    }

    function clearStale(activeItem) {
      document.querySelectorAll('.is-polish-hovered').forEach((node) => {
        if (node === activeItem) return;
        node.classList.remove('is-polish-hovered');
        resetProfileCardMotion(node);
      });
      document.querySelectorAll('#about [data-polish-profile-card]').forEach((node) => {
        if (node !== activeItem) resetProfileCardMotion(node);
      });
    }

    function sync() {
      raf = 0;
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) {
        clearStale(null);
        return;
      }
      const source = document.elementFromPoint(x, y);
      const activeItem = source && source.closest ? source.closest(selector) : null;
      clearStale(activeItem);
      if (activeItem) activeItem.classList.add('is-polish-hovered');
    }

    function requestSync() {
      if (!raf) raf = requestAnimationFrame(sync);
    }

    function requestScrollSync() {
      document.documentElement.classList.add('polish-hover-sync-scrolling');
      requestSync();
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        requestSync();
      }, 220);
    }

    window.addEventListener('pointermove', (event) => {
      x = event.clientX;
      y = event.clientY;
      document.documentElement.classList.remove('polish-hover-sync-scrolling');
      requestSync();
    }, { passive: true });
    window.addEventListener('mousemove', (event) => {
      x = event.clientX;
      y = event.clientY;
      document.documentElement.classList.remove('polish-hover-sync-scrolling');
      requestSync();
    }, { passive: true });
    window.addEventListener('wheel', requestScrollSync, { passive: true });
    window.addEventListener('scroll', requestScrollSync, { passive: true });
    window.addEventListener('blur', () => {
      clearStale(null);
      document.documentElement.classList.remove('polish-hover-sync-scrolling');
    }, { passive: true });
  }

  let heroSdfScriptPromise = null;
  let heroSdfInstance = null;
  let heroSdfMountGeneration = 0;
  let activeHeroSdfConfig = null;

  function heroSdfNumber(config, key, fallback) {
    const value = Number(config && config[key]);
    return Number.isFinite(value) ? value : fallback;
  }

  function applyHeroSdfLayout(title, config) {
    if (!title) return;
    title.style.setProperty('--hero-sdf-font-size', heroSdfNumber(config, 'heroSdfFontSize', 220) + 'px');
    title.style.setProperty('--hero-sdf-letter-spacing', heroSdfNumber(config, 'heroSdfLetterSpacing', 0.08) + 'em');
    title.style.setProperty('--hero-sdf-line-height', String(heroSdfNumber(config, 'heroSdfLineHeight', 1.25)));
    title.style.setProperty('--hero-sdf-canvas-width', heroSdfNumber(config, 'heroSdfCanvasWidth', 300) + '%');
    title.style.setProperty('--hero-sdf-canvas-height', heroSdfNumber(config, 'heroSdfCanvasHeight', 520) + '%');
  }

  function loadHeroSdfScript() {
    if (window.SDFTitleEffect) return Promise.resolve(window.SDFTitleEffect);
    if (heroSdfScriptPromise) return heroSdfScriptPromise;

    heroSdfScriptPromise = new Promise((resolve, reject) => {
      let script = document.querySelector('script[data-enhance="hero-sdf-script"]');
      const handleLoad = () => {
        if (window.SDFTitleEffect) resolve(window.SDFTitleEffect);
        else reject(new Error('SDFTitleEffect did not initialize.'));
      };
      const handleError = () => reject(new Error('Unable to load the hero SDF script.'));

      if (!script) {
        script = document.createElement('script');
        script.src = HERO_SDF_SCRIPT_URL;
        script.async = true;
        script.dataset.enhance = 'hero-sdf-script';
        script.addEventListener('load', handleLoad, { once: true });
        script.addEventListener('error', handleError, { once: true });
        (document.head || document.documentElement).appendChild(script);
        return;
      }

      script.addEventListener('load', handleLoad, { once: true });
      script.addEventListener('error', handleError, { once: true });
      if (window.SDFTitleEffect) handleLoad();
    });
    return heroSdfScriptPromise;
  }

  function destroyHeroSdfTitle() {
    heroSdfMountGeneration += 1;
    if (heroSdfInstance && typeof heroSdfInstance.destroy === 'function') {
      heroSdfInstance.destroy();
    }
    heroSdfInstance = null;
    delete window.heroSdfTitleEffect;
  }

  function mountHeroSdfTitle(config) {
    activeHeroSdfConfig = config || activeHeroSdfConfig || DEFAULTS;
    if (!activeHeroSdfConfig.heroSdfTitle) {
      destroyHeroSdfTitle();
      return;
    }

    const title = document.querySelector('main section h1');
    if (!title || !title.classList.contains('is-polish-title-settled')) return;
    if (heroSdfInstance && heroSdfInstance.title === title && !heroSdfInstance.destroyed) return;
    applyHeroSdfLayout(title, activeHeroSdfConfig);

    const generation = ++heroSdfMountGeneration;
    const styleReady = preloadHeroTitleAssets();
    const scriptReady = loadHeroSdfScript();
    Promise.all([styleReady, scriptReady])
      .then(() => {
        if (!document.fonts || typeof document.fonts.load !== 'function') return null;
        return document.fonts.load('400 ' + heroSdfNumber(activeHeroSdfConfig, 'heroSdfFontSize', 220) + 'px Pilowlava', (title.textContent || 'nwalmolos').trim());
      })
      .then(() => {
        if (generation !== heroSdfMountGeneration || !title.isConnected) return;
        if (!activeHeroSdfConfig.heroSdfTitle || !title.classList.contains('is-polish-title-settled')) return;
        heroSdfInstance = window.SDFTitleEffect.mount(title, {
          lineSelector: '.polish-title-word',
          pointerTarget: title.closest('section') || title,
          centerLines: true,
          lensRadius: heroSdfNumber(activeHeroSdfConfig, 'heroSdfLensRadius', 0.12),
          strength: heroSdfNumber(activeHeroSdfConfig, 'heroSdfStrength', 1),
          deformation: heroSdfNumber(activeHeroSdfConfig, 'heroSdfDeformation', 0.1),
          sdfBias: heroSdfNumber(activeHeroSdfConfig, 'heroSdfSdfBias', 0.04),
          blurSoftness: heroSdfNumber(activeHeroSdfConfig, 'heroSdfBlurSoftness', 0.06),
          dispersion: heroSdfNumber(activeHeroSdfConfig, 'heroSdfDispersion', 3.75),
          chromaIntensity: heroSdfNumber(activeHeroSdfConfig, 'heroSdfChromaIntensity', 1),
          grainStrength: heroSdfNumber(activeHeroSdfConfig, 'heroSdfGrainStrength', 2),
          trailTextureSize: heroSdfNumber(activeHeroSdfConfig, 'heroSdfTrailTextureSize', 1024),
          trailMaxAge: heroSdfNumber(activeHeroSdfConfig, 'heroSdfTrailMaxAge', 210),
          trailBlend: String(activeHeroSdfConfig.heroSdfTrailBlend || 'difference'),
          trailRadius: heroSdfNumber(activeHeroSdfConfig, 'heroSdfTrailRadius', 0.113),
          trailIntensity: heroSdfNumber(activeHeroSdfConfig, 'heroSdfTrailIntensity', 0.1),
          trailMinForce: heroSdfNumber(activeHeroSdfConfig, 'heroSdfTrailMinForce', 0.5),
          trailInfluence: heroSdfNumber(activeHeroSdfConfig, 'heroSdfTrailInfluence', 1),
          filmGrain: heroSdfNumber(activeHeroSdfConfig, 'heroSdfFilmGrain', 0.74),
          uvDisplacement: heroSdfNumber(activeHeroSdfConfig, 'heroSdfUvDisplacement', 17),
          morphAmount: heroSdfNumber(activeHeroSdfConfig, 'heroSdfMorphAmount', 0.2),
          chromaticMode: heroSdfNumber(activeHeroSdfConfig, 'heroSdfChromaticMode', 1),
          chromaticSpread: heroSdfNumber(activeHeroSdfConfig, 'heroSdfChromaticSpread', 2.2),
          followStrength: heroSdfNumber(activeHeroSdfConfig, 'heroSdfFollowStrength', 1.4),
          followDamping: heroSdfNumber(activeHeroSdfConfig, 'heroSdfFollowDamping', 9),
          filmTransition: heroSdfNumber(activeHeroSdfConfig, 'heroSdfFilmTransition', 0.09),
          centerSteer: heroSdfNumber(activeHeroSdfConfig, 'heroSdfCenterSteer', 0.68),
          centerRange: heroSdfNumber(activeHeroSdfConfig, 'heroSdfCenterRange', 0.62),
          centerFeather: heroSdfNumber(activeHeroSdfConfig, 'heroSdfCenterFeather', 0.3),
          centerResponse: heroSdfNumber(activeHeroSdfConfig, 'heroSdfCenterResponse', 0.13),
          causticOnset: heroSdfNumber(activeHeroSdfConfig, 'heroSdfCausticOnset', 1),
          causticIntensity: heroSdfNumber(activeHeroSdfConfig, 'heroSdfCausticIntensity', 1.8),
          causticColorLink: heroSdfNumber(activeHeroSdfConfig, 'heroSdfCausticColorLink', 0.22),
          positionColorFlow: heroSdfNumber(activeHeroSdfConfig, 'heroSdfPositionColorFlow', 1),
          fontLightDominance: heroSdfNumber(activeHeroSdfConfig, 'heroSdfFontLightDominance', 0.24),
          intercolorMix: heroSdfNumber(activeHeroSdfConfig, 'heroSdfIntercolorMix', 1),
          projectionLength: heroSdfNumber(activeHeroSdfConfig, 'heroSdfProjectionLength', 0.74),
          projectionBrightness: heroSdfNumber(activeHeroSdfConfig, 'heroSdfProjectionBrightness', 1.05),
          projectionFalloff: heroSdfNumber(activeHeroSdfConfig, 'heroSdfProjectionFalloff', 1.52),
          projectionHue: heroSdfNumber(activeHeroSdfConfig, 'heroSdfProjectionHue', 1),
          pointerFollow: heroSdfNumber(activeHeroSdfConfig, 'heroSdfPointerFollow', 9),
          radiusFollow: heroSdfNumber(activeHeroSdfConfig, 'heroSdfRadiusFollow', 20),
          recoveryRadiusFollow: heroSdfNumber(activeHeroSdfConfig, 'heroSdfRecoveryRadiusFollow', 8.6),
          recoveryVelocityDamping: heroSdfNumber(activeHeroSdfConfig, 'heroSdfRecoveryVelocityDamping', 7.2),
          coarsePointerHoldMs: heroSdfNumber(activeHeroSdfConfig, 'heroSdfCoarsePointerHoldMs', 640),
          maxTextureWidth: heroSdfNumber(activeHeroSdfConfig, 'heroSdfMaxTextureWidth', 5120),
          texturePixelRatio: heroSdfNumber(activeHeroSdfConfig, 'heroSdfTexturePixelRatio', 3),
          respectReducedMotion: activeHeroSdfConfig.heroSdfRespectReducedMotion !== false
        });
        window.heroSdfTitleEffect = heroSdfInstance;
      })
      .catch((error) => {
        if (generation !== heroSdfMountGeneration) return;
        title.dataset.sdfState = 'fallback';
        console.warn('Hero SDF title fallback:', error);
      });
  }

  function setupHeroSdfTitle(config) {
    activeHeroSdfConfig = config || activeHeroSdfConfig || DEFAULTS;
    if (!activeHeroSdfConfig.heroSdfTitle) {
      destroyHeroSdfTitle();
      return;
    }
    const title = normalizeHeroTitle();
    if (title && title.classList.contains('is-polish-title-settled')) {
      mountHeroSdfTitle(activeHeroSdfConfig);
    }
  }

  let titleEntranceObserver = null;
  let activeTitleEntrances = 0;

  function isTitleEntranceActive() {
    return document.documentElement.classList.contains('polish-title-entrance-active');
  }

  function resetTitleMotionSurfaces() {
    document.querySelectorAll('[data-polish-elastic]').forEach((node) => {
      node.style.translate = '0 0px';
      node.style.scale = '1 1';
    });
    document.querySelectorAll('.polish-gallery-title').forEach((node) => {
      node.style.transform = 'translate3d(0,0,0) scaleY(1)';
    });
  }

  function setTitleEntranceActive(title, active) {
    if (!title) return;
    if (active) {
      if (title.dataset.polishTitleAnimating === 'true') return;
      title.dataset.polishTitleAnimating = 'true';
      activeTitleEntrances += 1;
      document.documentElement.classList.add('polish-title-entrance-active');
      resetTitleMotionSurfaces();
      window.dispatchEvent(new CustomEvent('polish:title-entrance-lock'));
      return;
    }
    if (title.dataset.polishTitleAnimating !== 'true') return;
    delete title.dataset.polishTitleAnimating;
    activeTitleEntrances = Math.max(0, activeTitleEntrances - 1);
    if (activeTitleEntrances === 0) {
      document.documentElement.classList.remove('polish-title-entrance-active');
    }
  }

  function resetTitleEntrance(title) {
    if (!title) return;
    if (titleEntranceObserver) titleEntranceObserver.unobserve(title);
    setTitleEntranceActive(title, false);
    title.querySelectorAll('[data-polish-title-native-word="true"]').forEach((node) => {
      node.classList.remove('polish-title-word');
      node.style.removeProperty('--polish-word-index');
      delete node.dataset.polishTitleNativeWord;
    });
    delete title.dataset.polishTitlePrepared;
    delete title.dataset.polishTitleEntered;
    delete title.dataset.polishTitleNativeSplit;
    title.classList.remove('polish-title-stagger', 'polish-title-native-split', 'is-polish-title-entered', 'is-polish-title-settled');
  }

  function normalizeHeroTitle() {
    const title = document.querySelector('main section h1');
    if (!title) return null;

    const labelled = Array.from(title.querySelectorAll('span[aria-label]'))
      .map((node) => (node.getAttribute('aria-label') || node.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const compact = (title.textContent || '').replace(/\s+/g, ' ').trim();
    const configuredFirst = getEditableContentRaw('hero.line1');
    const configuredSecond = getEditableContentRaw('hero.line2');
    let first = typeof configuredFirst === 'string'
      ? configuredFirst.trim()
      : (labelled[0] || compact.match(/^Creative/i)?.[0] || 'Creative');
    let second = typeof configuredSecond === 'string'
      ? configuredSecond.trim()
      : (labelled[1] || compact.replace(first, '').trim() || 'Developer');
    if (!first && !second) first = 'Creative';
    const markupKey = 'hero|' + first + '|' + second;
    const expectedWords = (first ? 1 : 0) + (second ? 1 : 0);
    if (title.dataset.polishHeroTitleNormalized === 'true' && title.dataset.polishTitleMarkupKey === markupKey && title.querySelectorAll('.polish-title-word').length === expectedWords) return title;

    resetTitleEntrance(title);
    title.dataset.polishHeroTitleNormalized = 'true';
    title.dataset.polishTitleMarkupKey = markupKey;
    title.classList.add('polish-hero-title-normalized');
    title.style.opacity = '1';
    title.style.transform = 'none';
    title.style.filter = 'none';
    const lines = [];
    if (first) lines.push('<span class="polish-title-word gradient-text text-glow" style="--polish-word-index:0">' + escapeHtml(first) + '</span>');
    if (first && second) lines.push('<br/>');
    if (second) lines.push('<span class="polish-title-word text-foreground text-glow" style="--polish-word-index:' + (first ? '1' : '0') + '">' + escapeHtml(second) + '</span>');
    title.innerHTML = lines.join('');
    return title;
  }

  function prepareTitleEntrance(title) {
    if (!title || !title.textContent || !title.textContent.trim()) return false;
    if (title.closest('nav, footer, .polish-scroll-indicator')) return false;
    if (title.dataset.polishTitlePrepared === 'true' && (title.querySelector('.polish-title-word') || title.dataset.polishTitleNativeSplit === 'true')) return true;
    if (!title.querySelector('.polish-title-word') && title.dataset.polishTitleNativeSplit !== 'true') delete title.dataset.polishTitleEntered;

    title.classList.add('polish-title-stagger');
    title.dataset.polishTitlePrepared = 'true';
    title.classList.remove('is-polish-title-entered');

    const nativeWords = Array.from(title.querySelectorAll('span[aria-label]')).filter((node) => (node.textContent || '').trim());
    if (nativeWords.length) {
      title.dataset.polishTitleNativeSplit = 'true';
      title.classList.add('polish-title-native-split');
      nativeWords.forEach((word, index) => {
        word.classList.add('polish-title-word');
        word.dataset.polishTitleNativeWord = 'true';
        word.style.setProperty('--polish-word-index', String(index));
      });
      return true;
    }

    const textNodes = [];
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentElement && node.parentElement.closest('.polish-title-word')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    if (!textNodes.length) return true;

    let wordIndex = 0;
    textNodes.forEach((node) => {
      const fragment = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach((token) => {
        if (!token) return;
        if (/^\s+$/.test(token)) {
          fragment.appendChild(document.createTextNode(token));
          return;
        }
        const word = document.createElement('span');
        word.className = 'polish-title-word';
        word.style.setProperty('--polish-word-index', String(wordIndex));
        word.textContent = token;
        wordIndex += 1;
        fragment.appendChild(word);
      });
      if (node.parentNode) node.parentNode.replaceChild(fragment, node);
    });
    return true;
  }

  function enterTitle(title) {
    if (!title || title.dataset.polishTitleEntered === 'true') return;
    title.dataset.polishTitleEntered = 'true';
    const wordCount = Math.max(1, title.querySelectorAll('.polish-title-word').length);
    const titleDelay = Number.parseFloat(title.style.getPropertyValue('--polish-title-delay')) || 0;
    const isDetailTitle = Boolean(title.closest('.polish-project-detail'));
    const duration = isDetailTitle
      ? Math.min(680, 460 + wordCount * 24 + titleDelay)
      : Math.min(1900, 980 + wordCount * 58 + titleDelay);
    setTitleEntranceActive(title, true);
    requestAnimationFrame(() => {
      title.classList.add('is-polish-title-entered');
      setTimeout(() => {
        title.classList.add('is-polish-title-settled');
        setTitleEntranceActive(title, false);
        if (title.matches('main section h1') && activeHeroSdfConfig) {
          mountHeroSdfTitle(activeHeroSdfConfig);
        }
      }, duration);
    });
  }

  function isTitleInView(title) {
    if (!title || !title.getBoundingClientRect) return false;
    const rect = title.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight || 0;
    return rect.bottom > viewport * 0.10 && rect.top < viewport * 0.88;
  }

  function getTitleEntranceObserver() {
    if (titleEntranceObserver || !('IntersectionObserver' in window)) return titleEntranceObserver;
    titleEntranceObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        enterTitle(entry.target);
        titleEntranceObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.16 });
    return titleEntranceObserver;
  }

  function setupTitleEntrance(root, immediate) {
    const scope = root || document;
    if (scope === document || scope.contains?.(document.querySelector('main section h1'))) normalizeHeroTitle();
    const titles = Array.from(scope.querySelectorAll('main section h1, main section h2, .polish-gallery-title, .polish-project-detail__title'));
    const observer = getTitleEntranceObserver();
    titles.forEach((title, index) => {
      if (!prepareTitleEntrance(title)) return;
      title.style.setProperty('--polish-title-delay', Math.min(index * 50, 180) + 'ms');
      if (title.matches('main section h1') && title.classList.contains('polish-hero-title-normalized')) {
        title.dataset.polishTitleEntered = 'true';
        title.classList.add('is-polish-title-entered', 'is-polish-title-settled');
        setTitleEntranceActive(title, false);
        if (activeHeroSdfConfig) mountHeroSdfTitle(activeHeroSdfConfig);
        return;
      }
      if (immediate || isTitleInView(title) || !observer) enterTitle(title);
      else if (title.dataset.polishTitleEntered !== 'true') observer.observe(title);
    });
  }

  function hideNativeCursorFollowers() {
    function hide() {
      document.querySelectorAll('main > .fixed.top-0.left-0.pointer-events-none').forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        const inline = (node.getAttribute('style') || '').replace(/\s/g, '').toLowerCase();
        const isNativeDot = inline.includes('width:8px') && inline.includes('height:8px');
        const isNativeRing = inline.includes('width:40px') && inline.includes('height:40px');
        if (!isNativeDot && !isNativeRing) return;
        node.classList.add('polish-native-cursor-hidden');
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('opacity', '0', 'important');
        node.style.setProperty('visibility', 'hidden', 'important');
      });
    }

    hide();
    setTimeout(hide, 250);
    setTimeout(hide, 900);
    setTimeout(hide, 1800);
  }

  function collectElasticTextItems(strength) {
    const selector = [
      'main section h2',
      'main section h2 span[aria-label]'
    ].join(',');
    const seen = new Set();
    const groups = Array.from(document.querySelectorAll('nav, main > section, footer'));

    function getDepth(el) {
      if (el.matches('h2, h2 span[aria-label]')) return 0.78;
      return 0.46;
    }

    return Array.from(document.querySelectorAll(selector)).filter((el) => {
      if (seen.has(el) || !el.textContent || !el.textContent.trim()) return false;
      if (el.closest('footer')) return false;
      if (el.closest('.polish-gallery-section')) return false;
      if (el.closest('.polish-scroll-indicator') || el.closest('[data-polish-no-elastic]')) return false;
      if (el.matches('span') && el.parentElement && el.parentElement.closest('[aria-label]') && !el.hasAttribute('aria-label')) return false;
      if (el.tagName === 'DIV' && Array.from(el.children).some((child) => (child.textContent || '').trim())) return false;
      seen.add(el);
      return true;
    }).map((el) => {
      const group = el.closest('nav, main > section, footer');
      const groupIndex = Math.max(0, groups.indexOf(group));
      el.dataset.polishElastic = 'true';
      return {
        el,
        currentY: 0,
        currentScale: 1,
        targetY: 0,
        targetScale: 1,
        lag: clamp((0.12 + (groupIndex % 3) * 0.018) * strength, 0.07, 0.22),
        depth: getDepth(el)
      };
    });
  }

  function setupElasticText(config) {
    if (!config.elasticText) return;
    const strength = clamp(Number(config.elasticStrength) || 1, 0.25, 2);
    const items = collectElasticTextItems(strength);
    if (!items.length) return;

    let lastY = window.scrollY || 0;
    let velocity = 0;
    let raf = 0;
    let settling = 0;

    function resetItems() {
      items.forEach((item) => {
        item.currentY = 0;
        item.currentScale = 1;
        item.targetY = 0;
        item.targetScale = 1;
        item.el.style.translate = '0 0px';
        item.el.style.scale = '1 1';
      });
      settling = 0;
    }

    function updateTargets() {
      const scrollY = window.scrollY || 0;
      if (isTitleEntranceActive()) {
        lastY = scrollY;
        resetItems();
        return;
      }
      velocity = clamp(scrollY - lastY, -120, 120);
      lastY = scrollY;
      const mid = window.innerHeight * 0.5;
      items.forEach((item) => {
        const rect = item.el.getBoundingClientRect();
        const center = rect.top + rect.height * 0.5;
        const distance = clamp((center - mid) / Math.max(1, window.innerHeight), -1.2, 1.2);
        const visible = rect.bottom > -120 && rect.top < window.innerHeight + 120;
        const force = visible ? velocity * item.depth : 0;
        item.targetY = clamp(-force * (0.22 + Math.abs(distance) * 0.065), -40, 40);
        item.targetScale = 1 + clamp(Math.abs(force) * 0.00055, 0, 0.026);
      });
      settling = 46;
      if (!raf) raf = requestAnimationFrame(render);
    }

    function render() {
      raf = 0;
      if (isTitleEntranceActive()) {
        resetItems();
        return;
      }
      let keepGoing = false;
      items.forEach((item) => {
        item.currentY += (item.targetY - item.currentY) * item.lag;
        item.currentScale += (item.targetScale - item.currentScale) * item.lag;
        item.el.style.translate = '0 ' + item.currentY.toFixed(2) + 'px';
        item.el.style.scale = '1 ' + item.currentScale.toFixed(4);
        if (Math.abs(item.currentY - item.targetY) > 0.06 || Math.abs(item.currentScale - item.targetScale) > 0.002) keepGoing = true;
      });

      if (settling > 0) {
        settling -= 1;
        items.forEach((item) => {
          item.targetY *= 0.88;
          item.targetScale += (1 - item.targetScale) * 0.14;
        });
        keepGoing = true;
      }
      if (keepGoing) raf = requestAnimationFrame(render);
    }

    window.addEventListener('scroll', updateTargets, { passive: true });
    window.addEventListener('resize', updateTargets, { passive: true });
    window.addEventListener('polish:title-entrance-lock', resetItems);
    updateTargets();
  }

  function setupProgressiveBlur(config) {
    if (!config.progressiveBlur) return;
    const strength = clamp(Number(config.progressiveBlurStrength) || 1, 0.35, 1.5);
    const blur = document.createElement('div');
    blur.className = 'polish-progressive-blur';
    blur.setAttribute('aria-hidden', 'true');
    document.body.appendChild(blur);

    let lastY = window.scrollY || 0;
    let current = 0;
    let target = 0;
    let raf = 0;
    let settleTimer = 0;

    function render() {
      raf = 0;
      current += (target - current) * 0.18;
      blur.style.opacity = current.toFixed(3);
      if (Math.abs(current - target) > 0.006) raf = requestAnimationFrame(render);
    }

    function requestRender() {
      if (!raf) raf = requestAnimationFrame(render);
    }

    function onScroll() {
      const y = window.scrollY || 0;
      const velocity = Math.abs(y - lastY);
      lastY = y;
      const page = document.documentElement;
      const maxScroll = Math.max(1, page.scrollHeight - window.innerHeight);
      const edgeFade = y < 24 || y > maxScroll - 24 ? 0.55 : 1;
      target = clamp((0.28 + velocity / 110) * strength * edgeFade, 0, 0.86 * strength);
      requestRender();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        target = y > 24 ? 0.16 * strength : 0;
        requestRender();
      }, 220);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  function setupNavReflection(config) {
    if (!config.navReflection) return;
    keepNavVisuals(config);
  }

  const GALLERY_ACCENTS = [
    ['#10131a', '#5057ff', '#ff365d'],
    ['#07090d', '#26d3b4', '#b7d1ff'],
    ['#0c0b12', '#8e5cff', '#f0f0ff'],
    ['#090b10', '#ff6848', '#324cff'],
    ['#080808', '#d6d6d6', '#585858'],
    ['#0a0f12', '#42b6ff', '#dff8ff'],
    ['#0b0810', '#e94691', '#533dff'],
    ['#070a08', '#a7ff75', '#d7ffe0']
  ];

  function getGalleryAccentPalette(index) {
    return GALLERY_ACCENTS[Math.abs(index || 0) % GALLERY_ACCENTS.length];
  }

  function makeGalleryImage(item, index) {
    const palette = getGalleryAccentPalette(index);
    const label = String(item.short || item.title || 'LINK').toUpperCase().slice(0, 9);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900">' +
      '<defs>' +
      '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + palette[0] + '"/><stop offset=".56" stop-color="#050506"/><stop offset="1" stop-color="' + palette[1] + '"/></linearGradient>' +
      '<radialGradient id="r" cx=".72" cy=".28" r=".62"><stop offset="0" stop-color="' + palette[2] + '" stop-opacity=".86"/><stop offset=".34" stop-color="' + palette[1] + '" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .22"/></feComponentTransfer></filter>' +
      '</defs>' +
      '<rect width="900" height="900" fill="url(#g)"/>' +
      '<rect width="900" height="900" fill="url(#r)"/>' +
      '<g opacity=".32" stroke="#fff" stroke-width="1">' +
      '<path d="M0 236H900M0 451H900M0 666H900M225 0V900M450 0V900M675 0V900"/>' +
      '</g>' +
      '<g fill="none" stroke="#fff" stroke-opacity=".38">' +
      '<circle cx="450" cy="450" r="' + (120 + index * 7) + '"/>' +
      '<circle cx="' + (265 + index * 16) + '" cy="' + (310 + index * 9) + '" r="78"/>' +
      '</g>' +
      '<rect width="900" height="900" filter="url(#n)" opacity=".6"/>' +
      '<text x="58" y="810" fill="#fff" fill-opacity=".62" font-family="Geist, sans-serif" font-size="74" font-weight="700" letter-spacing="4">' + label + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function slugify(value, fallback) {
    const slug = String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return slug || fallback;
  }

  function getGalleryItems(config) {
    if (Array.isArray(config.galleryItems) && config.galleryItems.length) return config.galleryItems;
    return [
      { title: 'Creative Systems', short: 'VBG', meta: 'Motion', externalHref: 'https://tympanus.net/Development/LayerMotionSlideshow/', summary: 'Layered interface studies with responsive motion and fluid input.', detail: 'This project studies how an interface can feel physical without becoming heavy. The visual system uses dark surfaces, repeated media layers, subtle cursor response, and staged transitions to make a compact web experience feel exploratory.' },
      { title: 'Layered Interfaces', short: 'LYO', meta: 'Interactive', externalHref: 'https://tympanus.net/Development/RepeatingImageTransition/', summary: 'A small collection of hover states, depth shifts, and link moments.', detail: 'A focused interaction set built around layered image response. Each state keeps the base layout readable while letting the media react to pointer position, page changes, and link intent.' },
      { title: 'Local Preview', short: 'GP', meta: 'Publish', externalHref: 'https://pages.github.com/', summary: 'Local checks and publish notes for the static GitHub Pages flow.', detail: 'A practical publishing path for a static art site: preview locally, verify links and assets, then ship the same files to GitHub Pages without server-side dependencies.' },
      { title: 'Visual Studies', short: 'STU', meta: 'Archive', externalHref: 'https://www.awwwards.com/inspiration/', summary: 'Exploratory compositions for dark UI, grid rhythm, and motion tone.', detail: 'A set of compact visual directions for image-led portfolio sections. The studies focus on contrast, square crop discipline, and how short written notes can support rather than interrupt browsing.' },
      { title: 'Launch Notes', short: 'GH', meta: 'Pages', externalHref: 'https://github.com/', summary: 'A concise path from prototype review to public project release.', detail: 'A release-oriented case note for moving from local preview into a public static page. It emphasizes repeatable checks, lightweight assets, and simple link ownership.' },
      { title: 'Micro Media', short: 'MOV', meta: 'Small Files', externalHref: 'https://developer.mozilla.org/en-US/docs/Learn/Performance/Multimedia', summary: 'Compact image and motion assets designed for quick static loading.', detail: 'A media handling study for small portfolio pages. The goal is to keep motion rich while keeping files small enough for quick GitHub Pages delivery.' },
      { title: 'Signal Route', short: 'MAIL', meta: 'Link', externalHref: 'mailto:hello@yourdomain.com', summary: 'A direct route for collaboration, feedback, or project conversations.', detail: 'A lightweight response path that keeps the final action direct. The page avoids a heavy form and gives the visitor a clear route after reviewing visual work.' },
      { title: 'Motion Index', short: 'IDX', meta: 'Grid', externalHref: 'https://tympanus.net/codrops/tag/grid/', summary: 'A paged visual index where each tile behaves like a moving layer.', detail: 'A navigation pattern for many small works. The index uses thumbnails first, then short context, then deeper project detail so the browsing rhythm stays fast.' },
      { title: 'Interface Pulse', short: 'PUL', meta: 'Signal', externalHref: 'https://tympanus.net/codrops/tag/mouse/', summary: 'Small interaction pulses that make links feel tactile without noise.', detail: 'A cursor and click feedback study. The treatment is restrained: visual signals are noticeable enough to guide interaction but short enough not to compete with the work.' },
      { title: 'Release Frame', short: 'REL', meta: 'Preview', externalHref: 'https://pages.github.com/', summary: 'A framed checkpoint for testing layout, motion, links, and assets.', detail: 'A project detail frame for pre-release review. It collects layout notes, visual assets, and external destinations into one place before publishing.' },
      { title: 'Archive Light', short: 'ARC', meta: 'Study', externalHref: 'https://tympanus.net/codrops/tag/case-study/', summary: 'Low-key visual treatments for reflective, gallery-like presentation.', detail: 'A quiet archive treatment for visual work. It uses deep black, mild glow, and structured writing to keep the work legible without flattening its atmosphere.' },
      { title: 'Next Signal', short: 'CTA', meta: 'Next', externalHref: 'mailto:hello@yourdomain.com', summary: 'A final call-to-action route after browsing the visual index.', detail: 'A conversion-oriented ending for a portfolio journey. It connects the project browsing experience back to a clear collaboration path.' }
    ];
  }

  function normalizeProjectImage(value, fallbackSrc, fallbackCaption) {
    if (typeof value === 'string') {
      return {
        src: value,
        type: /\.(mp4|webm|ogg|mov|m4v)(?:[?#].*)?$/i.test(value) ? 'video' : 'image',
        ratio: 'square',
        fit: 'cover',
        caption: fallbackCaption || '',
        poster: ''
      };
    }
    const image = value && typeof value === 'object' ? value : {};
    const src = image.src || fallbackSrc;
    return {
      src,
      type: image.type === 'video' || /\.(mp4|webm|ogg|mov|m4v)(?:[?#].*)?$/i.test(src || '') ? 'video' : 'image',
      ratio: /^(wide|portrait|square)$/.test(image.ratio || '') ? image.ratio : 'square',
      fit: image.fit === 'contain' ? 'contain' : 'cover',
      caption: image.caption || fallbackCaption || '',
      poster: image.poster || '',
      palette: Array.isArray(image.palette) ? image.palette : null,
      accent: image.accent || image.color || '',
      accent2: image.accent2 || image.color2 || '',
      glowX: image.glowX,
      glowY: image.glowY
    };
  }

  function resolveLocalizedProjectItem(item) {
    const base = Object.assign({}, item || {});
    const language = window.__EDITABLE_SITE_LANGUAGE__ || 'en';
    const translations = base.translations && typeof base.translations === 'object' ? base.translations : {};
    const localized = translations[language] && typeof translations[language] === 'object' ? translations[language] : {};
    if (localized.visible === false) return null;
    Object.keys(localized).forEach((key) => {
      if (key !== 'visible' && localized[key] !== undefined) base[key] = localized[key];
    });
    if (Array.isArray(base.images)) {
      base.images = base.images.map((image) => {
        if (!image || typeof image !== 'object') return image;
        const next = Object.assign({}, image);
        if (next.captions && typeof next.captions[language] === 'string') next.caption = next.captions[language];
        return next;
      });
    }
    return base;
  }

  function hexToHue(value, fallback) {
    const match = String(value || '').trim().match(/^#?([0-9a-f]{6})$/i);
    if (!match) return fallback;
    const hex = match[1];
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    if (!delta) return fallback;
    let hue = 0;
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
    return hue;
  }

  function cssUrl(value) {
    return 'url("' + String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")';
  }

  function resolveGalleryPageSize(config, itemCount) {
    if (window.innerWidth <= 900) return clamp(Number(config.galleryMobilePageSize) || 4, 2, 8);
    if (config.galleryPageSize !== 'auto') return clamp(Number(config.galleryPageSize) || 6, 2, 8);
    if (itemCount <= 4) return itemCount || 1;
    return 6;
  }

  function normalizeGalleryItems(config, projectItems) {
    const source = Array.isArray(projectItems) && projectItems.length ? projectItems : getGalleryItems(config);
    return source.map((item, index) => {
      const base = resolveLocalizedProjectItem(item);
      if (!base) return null;
      base.slug = slugify(base.slug || base.title, 'project-' + (index + 1));
      base.polishIndex = index;
      if (!Array.isArray(base.palette)) base.palette = getGalleryAccentPalette(index);
      const cover = normalizeProjectImage(base.image || base.cover, makeGalleryImage(base, index), base.title);
      if (!cover.palette) cover.palette = base.palette;
      base.image = cover.src;
      base.imageRatio = cover.ratio;
      base.externalHref = base.externalHref || (/^https?:|^mailto:/i.test(base.href || '') ? base.href : '#projects');
      base.detail = base.detail || base.summary || ['A project detail page with more context, related visuals, and a link to the full work.'];
      const images = Array.isArray(base.images) && base.images.length ? base.images : [
        cover,
        { src: makeGalleryImage(base, index + 12), ratio: 'wide', caption: 'Extended visual frame' },
        { src: makeGalleryImage(base, index + 24), ratio: 'portrait', caption: 'Motion study crop' }
      ];
      base.images = images.map((image, imageIndex) => {
        const normalized = normalizeProjectImage(image, imageIndex === 0 ? base.image : makeGalleryImage(base, index + imageIndex * 12), imageIndex === 0 ? 'Cover image' : 'Related image');
        normalized.palette = normalized.palette || base.palette || getGalleryAccentPalette(index + imageIndex * 12);
        normalized.glowIndex = index + imageIndex * 12;
        return normalized;
      });
      return base;
    }).filter(Boolean);
  }

  function ensureGalleryPaginationItems(items, pageSize, config) {
    const minPages = Math.max(1, Number(config.galleryMinPages) || 1);
    const minCount = Math.max(pageSize, pageSize * minPages);
    if (!config.galleryDemoPlaceholders || items.length >= minCount) return items;
    const output = items.slice();
    while (output.length < minCount) {
      const index = output.length;
      const number = String(index + 1).padStart(2, '0');
      const base = {
        title: 'Preview Slot ' + number,
        short: 'WIP',
        meta: 'Placeholder',
        summary: 'A reserved project slot for testing pagination, detail layout, and scroll-triggered reveal motion.',
        detail: [
          'This placeholder keeps the second gallery page available while you are still replacing demo work with real projects.',
          'When you add more entries in projects.json, these preview slots can be disabled or will stop being needed.'
        ],
        facts: ['Preview', 'Replace in projects.json', 'Static'],
        externalHref: '#projects'
      };
      const cover = makeGalleryImage(base, index + 48);
      output.push(Object.assign(base, {
        slug: 'preview-slot-' + number.toLowerCase(),
        image: cover,
        imageRatio: 'square',
        images: [
          { src: cover, ratio: 'square', fit: 'cover', caption: 'Preview cover' },
          { src: makeGalleryImage(base, index + 60), ratio: 'wide', fit: 'cover', caption: 'Preview wide frame' },
          { src: makeGalleryImage(base, index + 72), ratio: 'portrait', fit: 'cover', caption: 'Preview crop' }
        ]
      }));
    }
    return output;
  }

  function findPhilosophySection() {
    return Array.from(document.querySelectorAll('main > section')).find((section) => {
      const text = section.textContent || '';
      return /Philosophy|best interface|DESIGN PRINCIPLE/i.test(text);
    });
  }

  let galleryTitleMotionCleanup = null;
  function setupGalleryTitleMotion(section) {
    const title = section && section.querySelector('.polish-gallery-title');
    if (!title || title.dataset.polishGalleryMotion === 'true') return;
    if (galleryTitleMotionCleanup) galleryTitleMotionCleanup();
    title.dataset.polishGalleryMotion = 'true';

    let currentY = 0;
    let currentScale = 1;
    let targetY = 0;
    let targetScale = 1;
    let lastY = window.scrollY || 0;
    let raf = 0;
    let settling = 0;

    function resetMotion() {
      currentY = 0;
      currentScale = 1;
      targetY = 0;
      targetScale = 1;
      settling = 0;
      title.style.transform = 'translate3d(0,0,0) scaleY(1)';
    }

    function requestRender() {
      if (!raf) raf = requestAnimationFrame(render);
    }

    function updateTargets() {
      const scrollY = window.scrollY || 0;
      if (isTitleEntranceActive()) {
        lastY = scrollY;
        resetMotion();
        return;
      }
      const velocity = clamp(scrollY - lastY, -100, 100);
      lastY = scrollY;
      const rect = title.getBoundingClientRect();
      const visible = rect.bottom > -120 && rect.top < window.innerHeight + 120;
      targetY = visible ? clamp(-velocity * 0.22, -28, 28) : 0;
      targetScale = visible ? 1 + clamp(Math.abs(velocity) * 0.00048, 0, 0.024) : 1;
      settling = 42;
      requestRender();
    }

    function render() {
      raf = 0;
      if (isTitleEntranceActive()) {
        resetMotion();
        return;
      }
      currentY += (targetY - currentY) * 0.18;
      currentScale += (targetScale - currentScale) * 0.18;
      title.style.transform = 'translate3d(0,' + currentY.toFixed(2) + 'px,0) scaleY(' + currentScale.toFixed(4) + ')';

      if (settling > 0) {
        settling -= 1;
        targetY *= 0.86;
        targetScale += (1 - targetScale) * 0.18;
      }

      if (settling > 0 || Math.abs(currentY - targetY) > 0.05 || Math.abs(currentScale - targetScale) > 0.0015) {
        requestRender();
      }
    }

    window.addEventListener('scroll', updateTargets, { passive: true });
    window.addEventListener('resize', updateTargets, { passive: true });
    window.addEventListener('polish:title-entrance-lock', resetMotion);
    galleryTitleMotionCleanup = () => {
      window.removeEventListener('scroll', updateTargets);
      window.removeEventListener('resize', updateTargets);
      window.removeEventListener('polish:title-entrance-lock', resetMotion);
      if (raf) cancelAnimationFrame(raf);
      title.style.transform = '';
      title.removeAttribute('data-polish-gallery-motion');
      galleryTitleMotionCleanup = null;
    };
    updateTargets();
  }

  function setupGalleryReplacement(config, projectItems) {
    if (!config.galleryReplacement) return;
    const detailNavMode = resolveDetailNavMode(config);
    const section = findPhilosophySection();
    if (!section || section.dataset.polishGalleryReady === 'true') return;
    let items = normalizeGalleryItems(config, projectItems);
    if (!items.length) {
      section.classList.add('editable-module-hidden');
      return;
    }
    let pageSize = window.innerWidth <= 900 ? 2 : 3;
    const itemsBySlug = new Map(items.map((item) => [item.slug, item]));
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    let page = 0;

    section.dataset.polishGalleryReady = 'true';
    section.className = 'polish-gallery-section is-polish-works-rail';
    section.id = 'gallery';
    section.removeAttribute('style');
    section.innerHTML = '<div class="polish-gallery-shell">' +
      '<div class="polish-gallery-head">' +
      '<div><span class="polish-gallery-kicker">' + escapeHtml(getEditableContentValue('works.label', '02 - Works')) + '</span><div class="polish-gallery-title-lock"><h2 class="polish-gallery-title">' + escapeHtml(getEditableContentValue('works.titleLine1', 'Visual')) + '<br/><span class="polish-gallery-title-muted">' + escapeHtml(getEditableContentValue('works.titleLine2', 'paths')) + '</span></h2></div></div>' +
      '<div class="polish-gallery-controls">' +
      '<button class="polish-gallery-button" type="button" data-polish-gallery-prev data-cursor="pointer" aria-label="Previous page"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<span class="polish-gallery-count" data-polish-gallery-count role="status" aria-live="polite"></span>' +
      '<button class="polish-gallery-button" type="button" data-polish-gallery-next data-cursor="pointer" aria-label="Next page"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '</div></div><div class="polish-works-viewport" data-polish-works-viewport><div class="polish-gallery-grid" data-polish-gallery-grid></div></div>' +
      '<div class="polish-works-hint"><span>' + escapeHtml(getEditableContentValue('works.hintHover', 'Hover — expand')) + '</span><span>' + escapeHtml(getEditableContentValue('works.hintNavigate', 'Drag or arrows — shift works')) + '</span></div></div>';

    const grid = section.querySelector('[data-polish-gallery-grid]');
    const worksViewport = section.querySelector('[data-polish-works-viewport]');
    const count = section.querySelector('[data-polish-gallery-count]');
    const prev = section.querySelector('[data-polish-gallery-prev]');
    const next = section.querySelector('[data-polish-gallery-next]');
    setupGalleryTitleMotion(section);
    applySiteArchitecture();
    const transitionLayer = document.createElement('div');
    transitionLayer.className = 'polish-gallery-transition-layer';
    transitionLayer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(transitionLayer);
    const detail = document.createElement('section');
    detail.className = 'polish-project-detail';
    detail.setAttribute('aria-hidden', 'true');
    detail.innerHTML = '<div class="polish-project-detail__scroll" tabindex="-1"><div class="polish-project-detail__shell">' +
      '<div class="polish-project-detail__top"><div class="polish-project-detail__nav-material-reflection" data-polish-nav-material-reflection aria-hidden="true"></div><div class="polish-project-detail__nav-links">' +
      '<button class="polish-project-detail__back" type="button" data-polish-detail-close data-cursor="pointer" aria-label="Close project detail"><span class="polish-project-detail__back-label">' + escapeHtml(getEditableContentValue('works.detailClose', 'Close')) + '</span><span class="polish-project-detail__back-icon" aria-hidden="true"><span class="polish-project-detail__back-line is-top"></span><span class="polish-project-detail__back-line is-mid"></span><span class="polish-project-detail__back-line is-bottom"></span></span></button></div></div>' +
      '<div data-polish-detail-content></div></div></div>';
    document.body.appendChild(detail);
    const lightbox = document.createElement('div');
    lightbox.className = 'polish-lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = '<div><img alt="Expanded project image"/><div class="polish-lightbox__caption"></div></div>';
    document.body.appendChild(lightbox);
    const detailContent = detail.querySelector('[data-polish-detail-content]');
    const detailScroll = detail.querySelector('.polish-project-detail__scroll');
    const detailTop = detail.querySelector('.polish-project-detail__top');
    const detailNavMaterialReflection = detail.querySelector('[data-polish-nav-material-reflection]');
    if (detailTop && detailNavMode === 'shared') detailTop.setAttribute('aria-hidden', 'true');
    const lightboxImage = lightbox.querySelector('img');
    const lightboxCaption = lightbox.querySelector('.polish-lightbox__caption');
    let transitioning = false;
    let lightboxClosing = false;
    let lightboxAnimating = false;
    let lightboxTimer = 0;
    let lastLightboxSourceRect = null;
    let lastLightboxSource = null;
    let navMaterialRaf = 0;
    let detailChapterRaf = 0;
    let detailTransitionTimer = 0;
    let navMaterialItems = [];
    let detailNavGutter = 0;
    let detailCloseTimer = 0;
    let detailOpenTimer = 0;
    let detailProjectSwitchTimer = 0;
    const detailProjectSwitchCooldownMs = 720;
    let detailSideCloseCursorHot = false;
    const getDetailCloseExitMs = () => window.innerWidth >= 901 ? 500 : 360;
    let detailRailRaf = 0;
    let detailRailMeasureRaf = 0;
    let detailRailCurrent = 0;
    let detailRailTarget = 0;
    let detailRailLoopHeight = 0;
    let detailRailViewport = null;
    let detailRailTrack = null;
    let detailRailActiveCard = null;
    let detailRailHintTimer = 0;
    let detailRailUserControlled = false;
    let detailReturnScrollY = 0;
    let hasDetailReturnScrollY = false;
    const revealTimers = new WeakMap();
    let revealObserver = null;

    function setGalleryControlsLocked(locked) {
      [prev, next].forEach((button) => {
        if (!button) return;
        button.disabled = locked || totalPages < 2;
        button.classList.toggle('is-locked', locked);
        button.setAttribute('aria-disabled', String(locked || totalPages < 2));
      });
    }

    function seededRandom(seed) {
      const value = Math.sin(seed * 9301 + 49297) * 233280;
      return value - Math.floor(value);
    }

    function shuffledIndexes(count, seed) {
      const list = Array.from({ length: count }, (_, index) => index);
      for (let index = count - 1; index > 0; index -= 1) {
        const swap = Math.floor(seededRandom(seed + index * 7.13) * (index + 1));
        const temp = list[index];
        list[index] = list[swap];
        list[swap] = temp;
      }
      return list;
    }

    function buildRandomGridMedia(item, title, maskId, seed) {
      const gridCount = 16;
      const cell = 100 / gridCount;
      const order = shuffledIndexes(gridCount * gridCount, seed);
      let cells = '';
      order.forEach((cellIndex, orderIndex) => {
        const x = (cellIndex % gridCount) * cell;
        const y = Math.floor(cellIndex / gridCount) * cell;
        cells += '<rect class="polish-random-grid-cell" data-polish-grid-order="' + orderIndex + '" x="' + x.toFixed(3) + '" y="' + y.toFixed(3) + '" width="' + (cell + 0.08).toFixed(3) + '" height="' + (cell + 0.08).toFixed(3) + '" fill="#fff" opacity="1"></rect>';
      });
      return '<svg class="polish-layer-media polish-random-grid-media" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="' + title + '">' +
        '<defs><mask id="' + maskId + '" maskUnits="userSpaceOnUse"><rect width="100" height="100" fill="#000"></rect>' + cells + '</mask></defs>' +
        '<image href="' + escapeHtml(item.image) + '" x="-8" y="-8" width="116" height="116" preserveAspectRatio="xMidYMid slice" mask="url(#' + maskId + ')"></image>' +
        '</svg>';
    }

    function revealRandomGridTile(tile) {
      const oldTimer = revealTimers.get(tile);
      if (oldTimer) clearTimeout(oldTimer);
      const cells = Array.from(tile.querySelectorAll('.polish-random-grid-cell'));
      if (!cells.length) return;
      tile.classList.remove('is-random-grid-revealing', 'is-random-grid-revealed');
      cells.forEach((cell) => {
        cell.getAnimations().forEach((animation) => animation.cancel());
        cell.style.opacity = '';
        cell.setAttribute('opacity', '0');
      });
      void tile.offsetWidth;
      tile.classList.add('is-random-grid-revealing');
      const tileOrder = Number(tile.style.getPropertyValue('--polish-tile-order')) || 0;
      cells.forEach((cell) => {
        const order = Number(cell.getAttribute('data-polish-grid-order')) || 0;
        cell.animate([
          { opacity: 0 },
          { opacity: 1 }
        ], {
          duration: 55,
          delay: tileOrder * 20 + order * 0.55,
          easing: 'steps(1, end)',
          fill: 'forwards'
        }).finished.catch(() => {}).then(() => {
          cell.style.opacity = '';
          cell.setAttribute('opacity', '1');
        });
      });
      revealTimers.set(tile, setTimeout(() => {
        tile.classList.remove('is-random-grid-revealing');
        tile.classList.add('is-random-grid-revealed');
      }, tileOrder * 20 + cells.length * 0.55 + 120));
    }

    function resetRandomGridTile(tile) {
      const oldTimer = revealTimers.get(tile);
      if (oldTimer) clearTimeout(oldTimer);
      tile.classList.remove('is-random-grid-revealing', 'is-random-grid-revealed');
      tile.querySelectorAll('.polish-random-grid-cell').forEach((cell) => {
        cell.getAnimations().forEach((animation) => animation.cancel());
        cell.style.opacity = '';
        cell.setAttribute('opacity', '0');
      });
    }

    function finishRandomGridTileImmediately(tile) {
      const oldTimer = revealTimers.get(tile);
      if (oldTimer) clearTimeout(oldTimer);
      tile.classList.remove('is-random-grid-revealing');
      tile.classList.add('is-random-grid-revealed');
      tile.querySelectorAll('.polish-random-grid-cell').forEach((cell) => {
        cell.getAnimations().forEach((animation) => animation.cancel());
        cell.style.opacity = '';
        cell.setAttribute('opacity', '1');
      });
    }

    function isTileNearViewport(tile) {
      const rect = tile.getBoundingClientRect();
      return !!rect.width && !!rect.height && rect.bottom >= -160 && rect.top <= window.innerHeight + 160;
    }

    function getRandomGridRevealObserver() {
      if (revealObserver || !('IntersectionObserver' in window)) return revealObserver;
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && entry.intersectionRatio <= 0) return;
          const tile = entry.target;
          revealObserver.unobserve(tile);
          if (tile.dataset.polishRandomGridReveal === 'true') {
            revealRandomGridTile(tile);
          } else {
            finishRandomGridTileImmediately(tile);
          }
          delete tile.dataset.polishRandomGridReveal;
        });
      }, { root: null, rootMargin: '160px 0px', threshold: 0.01 });
      return revealObserver;
    }

    function queueRandomGridTile(tile, reveal) {
      if (isTileNearViewport(tile)) {
        if (reveal) revealRandomGridTile(tile);
        else finishRandomGridTileImmediately(tile);
        return;
      }
      const observer = getRandomGridRevealObserver();
      if (!observer) {
        if (reveal) revealRandomGridTile(tile);
        else finishRandomGridTileImmediately(tile);
        return;
      }
      tile.dataset.polishRandomGridReveal = reveal ? 'true' : 'false';
      observer.observe(tile);
    }

    function unobserveRandomGridTiles() {
      if (!revealObserver) return;
      Array.from(grid.querySelectorAll('[data-polish-layer-tile]')).forEach((tile) => {
        revealObserver.unobserve(tile);
        delete tile.dataset.polishRandomGridReveal;
      });
    }

    function showRandomGridTilesImmediately() {
      Array.from(grid.querySelectorAll('[data-polish-layer-tile]')).forEach((tile) => {
        queueRandomGridTile(tile, false);
      });
    }

    function revealRandomGridTiles() {
      Array.from(grid.querySelectorAll('[data-polish-layer-tile]')).forEach((tile) => {
        queueRandomGridTile(tile, true);
      });
    }

    function cloneRect(rect) {
      if (!rect) return null;
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      };
    }

    function getImageRectFallback(sourceRect) {
      const imageRect = lightboxImage.getBoundingClientRect();
      if (imageRect.width && imageRect.height) return cloneRect(imageRect);
      const maxWidth = Math.min(window.innerWidth * 0.94, 1360);
      const maxHeight = window.innerHeight * 0.82;
      const width = Math.min(maxWidth, Math.max(360, sourceRect ? sourceRect.width * 2.8 : maxWidth * 0.72));
      const height = Math.min(maxHeight, Math.max(260, sourceRect ? sourceRect.height * 2.2 : maxHeight * 0.72));
      return {
        left: (window.innerWidth - width) / 2,
        top: (window.innerHeight - height) / 2,
        width,
        height
      };
    }

    function animateLightboxMotion(src, fromRect, toRect, direction, source) {
      document.querySelectorAll('.polish-lightbox-motion-clone').forEach((node) => node.remove());
    }

    function openLightbox(src, caption, source) {
      if (!src || lightboxAnimating || lightboxClosing) return;
      setDetailSideCloseCursorHot(false);
      lightboxAnimating = true;
      clearTimeout(lightboxTimer);
      const sourceRect = source ? cloneRect(source.getBoundingClientRect()) : null;
      lastLightboxSourceRect = sourceRect;
      lastLightboxSource = source || null;
      lightboxClosing = false;
      lightboxImage.style.visibility = '';
      lightboxImage.src = src;
      if (lightboxImage.decode) lightboxImage.decode().catch(() => {});
      lightboxCaption.textContent = caption || '';
      lightbox.classList.add('is-animating');
      lightbox.classList.add('is-open');
      lightbox.classList.remove('is-closing');
      lightbox.setAttribute('aria-hidden', 'false');
      animateLightboxMotion();
      lightboxTimer = setTimeout(() => {
        lightbox.classList.remove('is-animating');
        lightboxAnimating = false;
      }, 140);
    }

    function closeLightbox() {
      if (lightboxClosing || lightboxAnimating || !lightbox.classList.contains('is-open')) return;
      lightboxAnimating = true;
      clearTimeout(lightboxTimer);
      lightboxClosing = true;
      animateLightboxMotion();
      lightbox.classList.add('is-closing', 'is-animating');
      lightboxCaption.textContent = '';
      setTimeout(() => {
        lightbox.classList.remove('is-open', 'is-closing', 'is-animating');
        lightbox.setAttribute('aria-hidden', 'true');
      }, 180);
      setTimeout(() => {
        lightboxClosing = false;
        lightboxAnimating = false;
        lastLightboxSource = null;
      }, 240);
    }

    function getTextScrollMetrics(body, rail) {
      const railRect = rail.getBoundingClientRect();
      const trackHeight = Math.max(1, railRect.height || rail.clientHeight || body.clientHeight - 24);
      const scrollRange = Math.max(0, body.scrollHeight - body.clientHeight);
      const thumbHeight = clamp(trackHeight * (body.clientHeight / Math.max(body.scrollHeight, 1)), 36, trackHeight);
      const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
      const thumbTop = scrollRange ? clamp((body.scrollTop / scrollRange) * maxThumbTop, 0, maxThumbTop) : 0;
      return { trackHeight, scrollRange, thumbHeight, maxThumbTop, thumbTop };
    }

    function applyTextScrollbarProgress(rail, metrics, progress) {
      const nextProgress = clamp(progress, 0, 1);
      const nextTop = metrics.maxThumbTop ? metrics.maxThumbTop * nextProgress : 0;
      rail.style.setProperty('--polish-body-scroll-thumb-height', metrics.thumbHeight.toFixed(1) + 'px');
      rail.style.setProperty('--polish-body-scroll-thumb-top', nextTop.toFixed(1) + 'px');
      rail.setAttribute('aria-valuenow', String(Math.round(nextProgress * 100)));
    }

    function updateCopyToggleLabel(toggle, expanded) {
      if (!toggle) return;
      const moreLabel = toggle.getAttribute('data-polish-copy-label-more') || 'Read more';
      const lessLabel = toggle.getAttribute('data-polish-copy-label-less') || 'Show less';
      const nextLabel = expanded ? lessLabel : moreLabel;
      const label = toggle.querySelector('[data-polish-copy-toggle-label]');
      if (label) label.textContent = nextLabel;
      toggle.setAttribute('aria-label', nextLabel);
    }

    function updateTextScrollCue() {
      const body = detail.querySelector('.polish-project-detail__body');
      const wrap = detail.querySelector('.polish-project-detail__body-wrap');
      if (!body || !wrap) return;
      const shell = wrap.closest('[data-polish-featured-shell]');
      const toggle = shell && shell.querySelector('[data-polish-copy-toggle]');
      const mobileCopyMode = window.innerWidth <= 900;
      const copyExpanded = Boolean(shell && shell.classList.contains('is-copy-expanded'));
      let hasMore = body.scrollHeight > body.clientHeight + 6;
      if (mobileCopyMode) {
        if (!copyExpanded) wrap.dataset.polishCopyHasMore = hasMore ? 'true' : 'false';
        else hasMore = wrap.dataset.polishCopyHasMore === 'true';
      }
      const atStart = body.scrollTop <= 8;
      const atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 8;
      wrap.classList.toggle('has-more', hasMore);
      wrap.classList.toggle('is-at-start', !hasMore || atStart);
      wrap.classList.toggle('is-at-end', !hasMore || atEnd);
      const rail = wrap.querySelector('.polish-project-detail__body-scrollbar');
      if (toggle) {
        toggle.hidden = !mobileCopyMode || !hasMore;
        toggle.setAttribute('aria-expanded', copyExpanded ? 'true' : 'false');
        updateCopyToggleLabel(toggle, copyExpanded);
      }
      if (!rail) return;
      if (mobileCopyMode) {
        rail.setAttribute('aria-hidden', 'true');
        rail.tabIndex = -1;
        return;
      }
      if (!hasMore) {
        rail.style.setProperty('--polish-body-scroll-thumb-height', '34px');
        rail.style.setProperty('--polish-body-scroll-thumb-top', '0px');
        rail.setAttribute('aria-hidden', 'true');
        rail.setAttribute('aria-valuenow', '0');
        rail.tabIndex = -1;
        return;
      }
      const metrics = getTextScrollMetrics(body, rail);
      const progress = metrics.scrollRange ? clamp(body.scrollTop / metrics.scrollRange, 0, 1) : 0;
      applyTextScrollbarProgress(rail, metrics, progress);
      rail.setAttribute('aria-hidden', 'false');
      rail.tabIndex = 0;
    }

    function setupTextScrollControl(body) {
      const wrap = body && body.closest('.polish-project-detail__body-wrap');
      const rail = wrap && wrap.querySelector('.polish-project-detail__body-scrollbar');
      const thumb = rail && rail.querySelector('span');
      if (!body || !wrap || !rail || !thumb || rail.dataset.polishScrollControl === 'true') return;
      rail.dataset.polishScrollControl = 'true';

      let drag = null;

      function syncWrapState(scrollTop, metrics) {
        const hasMore = metrics.scrollRange > 0;
        wrap.classList.toggle('has-more', hasMore);
        wrap.classList.toggle('is-at-start', !hasMore || scrollTop <= 8);
        wrap.classList.toggle('is-at-end', !hasMore || scrollTop + body.clientHeight >= body.scrollHeight - 8);
        rail.setAttribute('aria-hidden', hasMore ? 'false' : 'true');
        rail.tabIndex = hasMore ? 0 : -1;
      }

      function scrollToProgress(progress) {
        const metrics = getTextScrollMetrics(body, rail);
        if (!metrics.scrollRange || !metrics.maxThumbTop) {
          body.scrollTop = 0;
          updateTextScrollCue();
          return;
        }
        const nextProgress = clamp(progress, 0, 1);
        const nextScrollTop = nextProgress * metrics.scrollRange;
        body.scrollTop = nextScrollTop;
        applyTextScrollbarProgress(rail, metrics, nextProgress);
        syncWrapState(nextScrollTop, metrics);
      }

      function scrollFromClientY(clientY, grabOffset) {
        const rect = rail.getBoundingClientRect();
        let progress = rect.height ? (clientY - rect.top) / rect.height : 0;
        if (Number.isFinite(grabOffset)) {
          const metrics = getTextScrollMetrics(body, rail);
          const nextTop = clamp(clientY - rect.top - grabOffset, 0, metrics.maxThumbTop);
          progress = metrics.maxThumbTop ? nextTop / metrics.maxThumbTop : 0;
        }
        scrollToProgress(progress);
      }

      function normalizeWheelDelta(event) {
        let delta = Math.abs(event.deltaY || 0) >= Math.abs(event.deltaX || 0) ? event.deltaY : event.deltaX;
        if (!delta) return 0;
        if (event.deltaMode === 1) delta *= 18;
        else if (event.deltaMode === 2) delta *= Math.max(1, body.clientHeight * .86);
        return delta;
      }

      function scrollByDelta(delta) {
        const metrics = getTextScrollMetrics(body, rail);
        if (!metrics.scrollRange) return false;
        const nextScrollTop = clamp(body.scrollTop + delta, 0, metrics.scrollRange);
        const progress = metrics.scrollRange ? nextScrollTop / metrics.scrollRange : 0;
        body.scrollTop = nextScrollTop;
        applyTextScrollbarProgress(rail, metrics, progress);
        syncWrapState(nextScrollTop, metrics);
        return true;
      }

      function handleWheel(event) {
        if (isMobileLikeViewport() || event.ctrlKey) return;
        const delta = normalizeWheelDelta(event);
        if (!delta) return;
        if (scrollByDelta(delta)) event.preventDefault();
      }

      rail.addEventListener('pointerdown', (event) => {
        if (event.button > 0 || isMobileLikeViewport()) return;
        const metrics = getTextScrollMetrics(body, rail);
        if (!metrics.scrollRange) return;
        event.preventDefault();
        const thumbRect = thumb.getBoundingClientRect();
        const startedOnThumb = event.target === thumb;
        const grabOffset = startedOnThumb ? event.clientY - thumbRect.top : null;
        drag = { pointerId: event.pointerId, grabOffset };
        rail.classList.add('is-dragging');
        try {
          rail.setPointerCapture(event.pointerId);
        } catch {}
        scrollFromClientY(event.clientY, grabOffset);
      });

      rail.addEventListener('pointermove', (event) => {
        if (!drag || drag.pointerId !== event.pointerId) return;
        event.preventDefault();
        scrollFromClientY(event.clientY, drag.grabOffset);
      });

      function endDrag(event) {
        if (!drag || (event && drag.pointerId !== event.pointerId)) return;
        try {
          rail.releasePointerCapture(drag.pointerId);
        } catch {}
        drag = null;
        rail.classList.remove('is-dragging');
      }

      rail.addEventListener('pointerup', endDrag);
      rail.addEventListener('pointercancel', endDrag);

      body.addEventListener('wheel', handleWheel, { passive: false });
      rail.addEventListener('wheel', handleWheel, { passive: false });

      rail.addEventListener('keydown', (event) => {
        const line = 42;
        const page = Math.max(80, body.clientHeight * 0.82);
        let delta = 0;
        if (event.key === 'ArrowDown') delta = line;
        else if (event.key === 'ArrowUp') delta = -line;
        else if (event.key === 'PageDown') delta = page;
        else if (event.key === 'PageUp') delta = -page;
        else if (event.key === 'Home') body.scrollTop = 0;
        else if (event.key === 'End') body.scrollTop = body.scrollHeight;
        else return;
        event.preventDefault();
        if (delta) scrollByDelta(delta);
        else updateTextScrollCue();
      });
    }

    function clearDetailNavMaterialReflection() {
      navMaterialItems = [];
      if (detailNavMaterialReflection) {
        detailNavMaterialReflection.textContent = '';
        detailNavMaterialReflection.style.setProperty('--polish-nav-material-opacity', '0');
      }
    }

    function buildDetailNavMaterialReflection() {
      clearDetailNavMaterialReflection();
      if (detailNavMode !== 'legacy' || !detailNavMaterialReflection) return;
      const frames = Array.from(detail.querySelectorAll('.polish-project-detail__image-frame'));
      navMaterialItems = frames.slice(0, 6).map((frame, index) => {
        const image = frame.querySelector('img');
        const src = image && (image.currentSrc || image.getAttribute('src'));
        if (!src) return null;
        const patch = document.createElement('span');
        const clone = document.createElement('img');
        clone.alt = '';
        clone.decoding = 'async';
        clone.loading = 'eager';
        clone.src = src;
        clone.addEventListener('load', scheduleDetailNavMaterialReflection, { once: true });
        patch.appendChild(clone);
        detailNavMaterialReflection.appendChild(patch);
        return { frame, patch, index };
      }).filter(Boolean);
    }

    function updateDetailNavMaterialReflection() {
      navMaterialRaf = 0;
      if (detailNavMode !== 'legacy' || !detailNavMaterialReflection || !detail.classList.contains('is-open') || !navMaterialItems.length) return;
      const nav = detail.querySelector('.polish-project-detail__top');
      const navRect = nav ? nav.getBoundingClientRect() : null;
      if (!navRect || !navRect.width || !navRect.height) return;
      const scrollY = detailScroll ? detailScroll.scrollTop || 0 : 0;
      let totalStrength = 0;

      navMaterialItems.forEach((item) => {
        const rect = item.frame.getBoundingClientRect();
        const visible = rect.bottom > navRect.bottom - 180 && rect.top < window.innerHeight + 560;
        const distance = Math.max(0, rect.top - navRect.bottom);
        const proximity = visible ? clamp(1 - distance / Math.max(window.innerHeight * 1.45, 1), 0, 1) : 0;
        const widthPct = clamp((rect.width / navRect.width) * 88, 24, 64);
        const centerPct = ((rect.left + rect.width * 0.5 - navRect.left) / navRect.width) * 100;
        const leftPct = clamp(centerPct - widthPct * 0.5, -12, 100 - widthPct * 0.55);
        const topPx = clamp(navRect.height * 0.12 - distance * 0.10, -navRect.height * 0.56, navRect.height * 0.42);
        const heightPx = clamp(navRect.height * 1.65 + rect.height * 0.10, navRect.height * 1.4, navRect.height * 2.7);
        const opacity = proximity > 0.015 ? (0.07 + proximity * 0.28) * (1 - Math.min(item.index, 4) * 0.09) : 0;
        const driftX = Math.sin(scrollY * 0.009 + item.index * 1.7) * (3 + proximity * 5);
        const driftY = Math.cos(scrollY * 0.007 + item.index * 1.1) * (1.4 + proximity * 2.4);

        item.patch.style.setProperty('--polish-nav-reflect-x', leftPct.toFixed(2) + '%');
        item.patch.style.setProperty('--polish-nav-reflect-y', topPx.toFixed(2) + 'px');
        item.patch.style.setProperty('--polish-nav-reflect-w', widthPct.toFixed(2) + '%');
        item.patch.style.setProperty('--polish-nav-reflect-h', heightPx.toFixed(2) + 'px');
        item.patch.style.setProperty('--polish-nav-reflect-opacity', opacity.toFixed(3));
        item.patch.style.setProperty('--polish-nav-reflect-dx', driftX.toFixed(2) + 'px');
        item.patch.style.setProperty('--polish-nav-reflect-dy', driftY.toFixed(2) + 'px');
        item.patch.style.setProperty('--polish-nav-reflect-scale', (1.05 + proximity * 0.09).toFixed(3));
        totalStrength += opacity;
      });

      detailNavMaterialReflection.style.setProperty('--polish-nav-material-opacity', clamp(totalStrength * 1.15, 0, .72).toFixed(3));
    }

    function scheduleDetailNavMaterialReflection() {
      if (navMaterialRaf) return;
      navMaterialRaf = requestAnimationFrame(updateDetailNavMaterialReflection);
    }

    function clearDetailSharedTransition() {
      if (detailTransitionTimer) {
        clearTimeout(detailTransitionTimer);
        detailTransitionTimer = 0;
      }
      transitionLayer.querySelectorAll('.polish-detail-shared-clone').forEach((node) => node.remove());
      transitionLayer.classList.remove('is-detail-transition');
      detail.classList.remove('is-shared-entering');
    }

    function startDetailSharedTransition(sourceTile, featuredImage) {
      clearDetailSharedTransition();
      if (!sourceTile || !sourceTile.isConnected || !detail.classList.contains('is-open')) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (window.innerWidth >= 901) return;

      const sourceMedia = sourceTile.querySelector('.polish-random-grid-media, .polish-works-surface') || sourceTile;
      const sourceRect = cloneRect(sourceMedia.getBoundingClientRect());
      if (!sourceRect || !sourceRect.width || !sourceRect.height) return;
      const tileImage = sourceTile.querySelector('.polish-random-grid-media image, .polish-works-image');
      const tileSrc = tileImage && (tileImage.getAttribute('href') || tileImage.getAttribute('xlink:href') || tileImage.getAttribute('src'));
      const featuredSrc = featuredImage && (featuredImage.type === 'video' ? featuredImage.poster : featuredImage.src);
      const src = tileSrc || featuredSrc;
      if (!src) return;

      const clone = document.createElement('span');
      clone.className = 'polish-detail-shared-clone';
      clone.style.left = sourceRect.left + 'px';
      clone.style.top = sourceRect.top + 'px';
      clone.style.width = sourceRect.width + 'px';
      clone.style.height = sourceRect.height + 'px';
      clone.style.borderRadius = getComputedStyle(sourceTile).borderRadius || '8px';
      clone.innerHTML = '<img src="' + escapeHtml(src) + '" alt=""/>';
      transitionLayer.classList.add('is-detail-transition');
      transitionLayer.appendChild(clone);
      detail.classList.add('is-shared-entering');

      requestAnimationFrame(() => {
        if (!clone.isConnected || !detail.classList.contains('is-open')) {
          clearDetailSharedTransition();
          return;
        }
        const target = detail.querySelector('.polish-project-detail__featured-media .polish-project-detail__image-frame');
        const targetRect = target && cloneRect(target.getBoundingClientRect());
        if (!targetRect || !targetRect.width || !targetRect.height || !clone.animate) {
          clearDetailSharedTransition();
          return;
        }

        const translateX = targetRect.left - sourceRect.left;
        const translateY = targetRect.top - sourceRect.top;
        const scaleX = targetRect.width / sourceRect.width;
        const scaleY = targetRect.height / sourceRect.height;
        const duration = window.innerWidth <= 900 ? 680 : 820;
        const targetRadius = getComputedStyle(target).borderRadius || '10px';
        const animation = clone.animate([
          {
            transform: 'translate3d(0,0,0) scale(1,1)',
            borderRadius: clone.style.borderRadius,
            filter: 'blur(0px) brightness(1)',
            opacity: 1
          },
          {
            transform: 'translate3d(' + (translateX * .72) + 'px,' + (translateY * .72) + 'px,0) scale(' + (1 + (scaleX - 1) * .72) + ',' + (1 + (scaleY - 1) * .72) + ')',
            borderRadius: targetRadius,
            filter: 'blur(.35px) brightness(1.035)',
            opacity: 1,
            offset: .64
          },
          {
            transform: 'translate3d(' + translateX + 'px,' + translateY + 'px,0) scale(' + scaleX + ',' + scaleY + ')',
            borderRadius: targetRadius,
            filter: 'blur(0px) brightness(1)',
            opacity: 1
          }
        ], {
          duration,
          easing: 'cubic-bezier(.16, 1, .3, 1)',
          fill: 'forwards'
        });
        animation.finished.catch(() => {}).then(() => {
          if (clone.isConnected) clearDetailSharedTransition();
        });
        detailTransitionTimer = setTimeout(clearDetailSharedTransition, duration + 90);
      });
    }

    function updateDetailChapterMotion() {
      detailChapterRaf = 0;
      if (!detail.classList.contains('is-open')) return;
      const viewportHeight = detailScroll.clientHeight || window.innerHeight || 1;
      const chapters = Array.from(detail.querySelectorAll('[data-polish-detail-chapter]'));
      chapters.forEach((chapter) => {
        const rect = chapter.getBoundingClientRect();
        const active = rect.bottom > viewportHeight * .18 && rect.top < viewportHeight * .82;
        chapter.classList.toggle('is-active', active);
      });

      const featuredShell = detail.querySelector('[data-polish-featured-shell]');
      const featuredChapter = featuredShell && featuredShell.closest('[data-polish-detail-chapter]');
      if (!featuredShell || !featuredChapter) return;
      const featuredRect = featuredChapter.getBoundingClientRect();
      const progress = clamp((viewportHeight * .12 - featuredRect.top) / Math.max(featuredRect.height * .88, 1), 0, 1);
      const crossfadeRaw = clamp((progress - .20) / .58, 0, 1);
      const crossfade = crossfadeRaw * crossfadeRaw * (3 - 2 * crossfadeRaw);
      featuredShell.style.setProperty('--polish-feature-inset', '0%');
      featuredShell.style.setProperty('--polish-feature-radius', '10px');
      featuredShell.style.setProperty('--polish-feature-copy-y', '0px');
      featuredShell.style.setProperty('--polish-feature-copy-opacity', '1');
      featuredShell.style.setProperty('--polish-feature-image-scale', '1.04');
      featuredShell.style.setProperty('--polish-feature-crossfade', crossfade.toFixed(3));
      featuredShell.style.setProperty('--polish-feature-reflection-y', '0px');
      featuredShell.style.setProperty('--polish-feature-reflection-opacity', '0');
    }

    function scheduleDetailChapterMotion() {
      if (detailChapterRaf) return;
      detailChapterRaf = requestAnimationFrame(updateDetailChapterMotion);
    }

    function isDesktopDetailRailActive() {
      return window.innerWidth >= 901 && detail.classList.contains('is-open') && !detail.classList.contains('is-closing');
    }

    function wrapDetailRailPosition(value) {
      if (!detailRailLoopHeight) return 0;
      return ((value % detailRailLoopHeight) + detailRailLoopHeight) % detailRailLoopHeight;
    }

    function updateDetailRailCards() {
      if (!detailRailViewport) return;
      const viewportRect = detailRailViewport.getBoundingClientRect();
      const viewportCenter = viewportRect.top + viewportRect.height * .5;
      let activeCard = null;
      let activeDistance = Infinity;
      detailRailViewport.querySelectorAll('[data-polish-detail-rail-card]').forEach((card) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height * .5 - viewportCenter);
        const range = Math.max(viewportRect.height * .82, rect.height, 1);
        const focus = clamp(1 - distance / range, 0, 1);
        card.style.setProperty('--polish-rail-focus', (1 + focus * .008).toFixed(4));
        card.style.setProperty('--polish-rail-opacity', (.78 + focus * .22).toFixed(3));
        if (distance < activeDistance) {
          activeDistance = distance;
          activeCard = card;
        }
      });
      if (detailRailActiveCard && detailRailActiveCard !== activeCard) detailRailActiveCard.classList.remove('is-rail-active');
      if (activeCard) {
        activeCard.classList.add('is-rail-active');
      }
      detailRailActiveCard = activeCard;
    }

    function renderDetailRail() {
      if (!detailRailTrack || !detailRailLoopHeight) return;
      detailRailTrack.style.transform = 'translate3d(0,' + (-wrapDetailRailPosition(detailRailCurrent)).toFixed(3) + 'px,0)';
      updateDetailRailCards();
    }

    function tickDetailRail() {
      detailRailRaf = 0;
      if (!isDesktopDetailRailActive() || !detailRailTrack) return;
      detailRailCurrent += (detailRailTarget - detailRailCurrent) * .18;
      if (Math.abs(detailRailTarget - detailRailCurrent) < .08) detailRailCurrent = detailRailTarget;
      if (detailRailLoopHeight && Math.abs(detailRailCurrent) > detailRailLoopHeight * 128) {
        const cycles = Math.trunc(detailRailCurrent / detailRailLoopHeight);
        detailRailCurrent -= cycles * detailRailLoopHeight;
        detailRailTarget -= cycles * detailRailLoopHeight;
      }
      renderDetailRail();
      if (Math.abs(detailRailTarget - detailRailCurrent) >= .08) detailRailRaf = requestAnimationFrame(tickDetailRail);
    }

    function scheduleDetailRailTick() {
      if (!detailRailRaf) detailRailRaf = requestAnimationFrame(tickDetailRail);
    }

    function measureDetailRail() {
      detailRailMeasureRaf = 0;
      if (!detailRailViewport || !detailRailTrack) return;
      const firstGroup = detailRailTrack.querySelector('[data-polish-detail-rail-group]');
      detailRailLoopHeight = firstGroup ? firstGroup.getBoundingClientRect().height : 0;
      renderDetailRail();
    }

    function scheduleDetailRailMeasure() {
      if (!detailRailMeasureRaf) detailRailMeasureRaf = requestAnimationFrame(measureDetailRail);
    }

    function stopDetailRailMotion(reset) {
      if (detailRailRaf) cancelAnimationFrame(detailRailRaf);
      if (detailRailMeasureRaf) cancelAnimationFrame(detailRailMeasureRaf);
      if (detailRailHintTimer) clearTimeout(detailRailHintTimer);
      detailRailRaf = 0;
      detailRailMeasureRaf = 0;
      detailRailHintTimer = 0;
      if (reset && detailRailTrack) detailRailTrack.style.removeProperty('transform');
      if (reset) {
        detailRailCurrent = 0;
        detailRailTarget = 0;
        detailRailLoopHeight = 0;
        detailRailUserControlled = false;
        detailRailActiveCard = null;
        detailRailViewport = null;
        detailRailTrack = null;
      }
    }

    function startDetailRailMotion() {
      stopDetailRailMotion(true);
      if (!isDesktopDetailRailActive()) return;
      detailRailViewport = detail.querySelector('[data-polish-detail-rail-viewport]');
      detailRailTrack = detail.querySelector('[data-polish-detail-rail-track]');
      if (!detailRailViewport || !detailRailTrack) {
        stopDetailRailMotion(true);
        return;
      }
      detailRailCurrent = 0;
      detailRailTarget = 0;
      detailRailUserControlled = false;
      scheduleDetailRailMeasure();
      requestAnimationFrame(scheduleDetailRailMeasure);
      detailRailViewport.querySelectorAll('img').forEach((image) => {
        if (!image.complete) image.addEventListener('load', scheduleDetailRailMeasure, { once: true });
      });
      renderDetailRail();
      detailRailHintTimer = setTimeout(() => {
        detailRailHintTimer = 0;
        if (!isDesktopDetailRailActive() || detailRailUserControlled || !detailRailLoopHeight) return;
        const firstGroup = detailRailTrack && detailRailTrack.querySelector('[data-polish-detail-rail-group]');
        const cards = firstGroup ? firstGroup.querySelectorAll('[data-polish-detail-rail-card]') : [];
        detailRailTarget = cards.length > 1 ? cards[1].offsetTop : detailRailLoopHeight;
        scheduleDetailRailTick();
      }, 220);
    }

    function shouldKeepWheelInDetailText(event) {
      const body = event.target && event.target.closest && event.target.closest('.polish-project-detail__body');
      if (!body || body.scrollHeight <= body.clientHeight + 6) return false;
      if (event.deltaY < 0) return body.scrollTop > 1;
      if (event.deltaY > 0) return body.scrollTop + body.clientHeight < body.scrollHeight - 1;
      return true;
    }

    function handleDetailRailWheel(event) {
      if (!isDesktopDetailRailActive() || !detailRailTrack || !detailRailLoopHeight) return;
      if (shouldKeepWheelInDetailText(event)) return;
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;
      event.preventDefault();
      detailRailUserControlled = true;
      if (detailRailHintTimer) clearTimeout(detailRailHintTimer);
      detailRailHintTimer = 0;
      detailRailTarget += clamp(delta, -160, 160) * .82;
      scheduleDetailRailTick();
    }

    function handleDetailRailResize() {
      if (!detail.classList.contains('is-open')) return;
      if (window.innerWidth < 901) {
        stopDetailRailMotion(true);
        return;
      }
      if (!detailRailTrack || !detailRailTrack.isConnected) startDetailRailMotion();
      else scheduleDetailRailMeasure();
    }

    function updateDetailNavGutter() {
      const currentGutter = Math.max(0, Math.round(window.innerWidth - document.documentElement.clientWidth));
      if (!document.documentElement.classList.contains('polish-detail-open') || currentGutter > 0) {
        detailNavGutter = currentGutter;
      }
      detail.style.setProperty('--polish-detail-nav-gutter', detailNavGutter + 'px');
      document.documentElement.style.setProperty('--polish-detail-page-gutter', detailNavGutter + 'px');
      document.documentElement.style.setProperty('--polish-shared-nav-gutter', detailNavGutter + 'px');
      const canAlignClose = window.innerWidth >= 901 && (
        detail.classList.contains('is-open') ||
        document.documentElement.classList.contains('polish-detail-opening')
      );
      if (!canAlignClose) {
        document.documentElement.style.removeProperty('--polish-detail-close-right');
        return;
      }
      const navFrame = document.querySelector('nav .polish-shared-nav-frame') || document.querySelector('nav > *');
      const targetNode = window.innerWidth >= 901
        ? (detail.querySelector('[data-polish-detail-rail-viewport]') || detail.querySelector('.polish-project-detail__shell'))
        : (detail.querySelector('.polish-project-detail__featured-media') || detail.querySelector('.polish-project-detail__shell'));
      const targetRect = targetNode && targetNode.getBoundingClientRect();
      const targetRight = targetRect && targetRect.width && targetRect.height ? targetRect.right : 0;
      const navRect = navFrame && navFrame.getBoundingClientRect();
      if (!navRect || !navRect.width || !targetRight) {
        document.documentElement.style.removeProperty('--polish-detail-close-right');
        return;
      }
      document.documentElement.style.setProperty('--polish-detail-close-right', (navRect.right - targetRight).toFixed(2) + 'px');
    }

    function setDetailNavState(state) {
      document.dispatchEvent(new CustomEvent('polish:detail-nav-state', {
        detail: { state, detail }
      }));
    }

    function captureDetailReturnPosition() {
      detailReturnScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      hasDetailReturnScrollY = true;
    }

    function restoreDetailReturnPosition() {
      if (!hasDetailReturnScrollY) return;
      const targetY = detailReturnScrollY;
      const restore = () => {
        if (Math.abs((window.scrollY || 0) - targetY) > 1) {
          window.scrollTo({ left: 0, top: targetY, behavior: 'auto' });
        }
      };
      requestAnimationFrame(restore);
      setTimeout(restore, 80);
    }

    function shouldCloseDetailFromSideBlank(event) {
      if (window.innerWidth < 901) return false;
      if (!detail.classList.contains('is-open') || detail.classList.contains('is-closing')) return false;
      if (lightbox.classList.contains('is-open')) return false;
      if (!event || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return false;
      const blocked = event.target && typeof event.target.closest === 'function' && event.target.closest(
        '[data-polish-detail-close], [data-polish-lightbox-src], a, button, input, textarea, select, summary, ' +
        '.polish-project-detail__top, .polish-project-detail__hero, .polish-project-detail__body-wrap, ' +
        '.polish-project-detail__actions, .polish-project-detail__gallery, .polish-project-detail__image-frame'
      );
      if (blocked) return false;
      // Keep the affordance in the outer gutters. At common desktop widths
      // the detail shell starts about 64px from the viewport edge; using that
      // boundary prevents the close zone from eating into the reading column.
      const sideBand = Math.max(56, Math.min(144, window.innerWidth * .085));
      const shell = detail.querySelector('.polish-project-detail__shell');
      const shellRect = shell && shell.getBoundingClientRect();
      const shellLeft = shellRect && shellRect.width ? shellRect.left : 0;
      const shellRight = shellRect && shellRect.width ? window.innerWidth - shellRect.right : 0;
      const leftBand = shellLeft > 0 ? Math.min(sideBand, shellLeft) : sideBand;
      const rightBand = shellRight > 0 ? Math.min(sideBand, shellRight) : sideBand;
      return event.clientX <= leftBand || event.clientX >= window.innerWidth - rightBand;
    }

    function setDetailSideCloseCursorHot(hot) {
      const next = !!hot;
      if (detailSideCloseCursorHot === next) return;
      detailSideCloseCursorHot = next;
      document.documentElement.classList.toggle('polish-detail-side-close-hot', next);
      document.dispatchEvent(new CustomEvent('polish:detail-side-close-cursor', {
        detail: { hot: next }
      }));
    }

    function updateDetailSideCloseCursor(event) {
      if (window.innerWidth < 901 || !detail.classList.contains('is-open') || detail.classList.contains('is-closing')) {
        setDetailSideCloseCursorHot(false);
        return;
      }
      if (getSharedDetailCloseProximityTarget(event.clientX, event.clientY)) {
        setDetailSideCloseCursorHot(false);
        return;
      }
      setDetailSideCloseCursorHot(shouldCloseDetailFromSideBlank(event));
    }

    function setDetailCloseIconState(ready) {
      const lines = detail.querySelectorAll('.polish-project-detail__back-line');
      if (lines.length < 3) return;
      const states = ready
        ? [
          { top: '10px', opacity: '1', transform: 'translate3d(-50%, 0, 0) rotate(42deg)' },
          { top: '10px', opacity: '0', transform: 'translate3d(-50%, 0, 0) scaleX(.36)' },
          { top: '10px', opacity: '1', transform: 'translate3d(-50%, 0, 0) rotate(-42deg)' }
        ]
        : [
          { top: '5px', opacity: '1', transform: 'translate3d(-50%, 0, 0) rotate(0deg)' },
          { top: '10px', opacity: '1', transform: 'translate3d(-50%, 0, 0) scaleX(1)' },
          { top: '15px', opacity: '1', transform: 'translate3d(-50%, 0, 0) rotate(0deg)' }
        ];
      lines.forEach((line, index) => {
        const state = states[index];
        line.style.top = state.top;
        line.style.opacity = state.opacity;
        line.style.transform = state.transform;
      });
    }

    function clearDetailInteractionState() {
      document.querySelectorAll('.is-polish-hot, .is-polish-hovered').forEach((node) => {
        node.classList.remove('is-polish-hot', 'is-polish-hovered');
      });
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== document.body) active.blur();
    }

    function setDetailProjectSwitchControlsLocked(locked) {
      detail.querySelectorAll('[data-polish-next-project]').forEach((button) => {
        if (!(button instanceof HTMLButtonElement)) return;
        button.disabled = locked;
        button.setAttribute('aria-disabled', String(locked));
      });
    }

    function clearDetailProjectSwitchState() {
      if (detailProjectSwitchTimer) {
        clearTimeout(detailProjectSwitchTimer);
        detailProjectSwitchTimer = 0;
      }
      detail.classList.remove('is-project-switching');
      setDetailProjectSwitchControlsLocked(false);
    }

    function markDetailProjectSwitching() {
      clearDetailProjectSwitchState();
      detail.classList.add('is-project-switching');
      setDetailProjectSwitchControlsLocked(true);
      detailProjectSwitchTimer = setTimeout(() => {
        clearDetailProjectSwitchState();
      }, detailProjectSwitchCooldownMs);
    }

    function updateDetailHistory(slug, replace) {
      const hash = slug ? '#work-' + slug : '';
      const nextUrl = location.pathname + location.search + hash;
      try {
        const method = replace ? History.prototype.replaceState : History.prototype.pushState;
        method.call(history, history.state, '', nextUrl);
      } catch {
        if (slug) location.hash = hash;
      }
    }

    function finishCloseDetail(pushState) {
      setDetailSideCloseCursorHot(false);
      clearDetailProjectSwitchState();
      if (detailCloseTimer) {
        clearTimeout(detailCloseTimer);
        detailCloseTimer = 0;
      }
      if (detailOpenTimer) {
        clearTimeout(detailOpenTimer);
        detailOpenTimer = 0;
      }
      if (detailChapterRaf) {
        cancelAnimationFrame(detailChapterRaf);
        detailChapterRaf = 0;
      }
      stopDetailRailMotion(true);
      clearDetailSharedTransition();
      detail.classList.remove('is-open', 'is-closing', 'is-scroll-ready', 'is-close-icon-ready', 'is-stage-entering');
      detail.setAttribute('aria-hidden', 'true');
      detailContent.replaceChildren();
      detailScroll.scrollTop = 0;
      document.documentElement.classList.remove('polish-detail-open', 'polish-detail-opening');
      document.documentElement.style.removeProperty('--polish-detail-page-gutter');
      document.documentElement.style.removeProperty('--polish-detail-close-right');
      setDetailNavState('closed');
      clearDetailNavMaterialReflection();
      if (pushState && location.hash.indexOf('#work-') === 0) {
        updateDetailHistory('', false);
      }
      restoreDetailReturnPosition();
      hasDetailReturnScrollY = false;
      clearDetailInteractionState();
    }

    function closeDetail(pushState) {
      if (!detail.classList.contains('is-open')) {
        finishCloseDetail(pushState);
        return;
      }
      if (detailCloseTimer) return;
      setDetailSideCloseCursorHot(false);
      clearDetailProjectSwitchState();
      clearDetailInteractionState();
      clearDetailSharedTransition();
      if (detailOpenTimer) {
        clearTimeout(detailOpenTimer);
        detailOpenTimer = 0;
      }
      setDetailNavState('closing');
      stopDetailRailMotion(false);
      detail.classList.remove('is-open', 'is-scroll-ready', 'is-close-icon-ready', 'is-stage-entering');
      detail.classList.add('is-closing');
      setDetailCloseIconState(false);
      detail.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('polish-detail-opening');
      restoreDetailReturnPosition();
      detailCloseTimer = setTimeout(() => {
        finishCloseDetail(pushState);
      }, getDetailCloseExitMs());
    }

    function openDetail(slug, pushState, sourceTile) {
      const item = itemsBySlug.get(slug);
      if (!item) return false;
      const isProjectSwitch = detail.classList.contains('is-open') && !detail.classList.contains('is-closing') && !sourceTile;
      setDetailSideCloseCursorHot(false);
      if (detailCloseTimer) {
        clearTimeout(detailCloseTimer);
        detailCloseTimer = 0;
      }
      if (detailOpenTimer) {
        clearTimeout(detailOpenTimer);
        detailOpenTimer = 0;
      }
      setDetailNavState(isProjectSwitch ? 'open' : 'entering');
      if (!detail.classList.contains('is-open') && !detail.classList.contains('is-closing')) {
        captureDetailReturnPosition();
      }
      const title = escapeHtml(item.title || 'Untitled');
      const metaText = String(item.meta || '').trim();
      const summaryText = String(item.summary || '').trim();
      const meta = escapeHtml(metaText);
      const summary = escapeHtml(summaryText);
      const paragraphs = Array.isArray(item.detail) ? item.detail : String(item.detail || item.summary || '').split(/\n{2,}/);
      const copyLength = paragraphs.filter(Boolean).join('').replace(/\s/g, '').length;
      const copyLayoutClass = copyLength <= 360 ? ' is-compact-copy' : '';
      const factValues = Array.isArray(item.facts) ? item.facts.map((value) => String(value || '').trim()).filter(Boolean) : [];
      const facts = factValues.length ? '<span class="polish-project-detail__meta">' + escapeHtml(factValues[0]) + '</span>' : '';
      const eyebrowContent = (meta ? '<span class="polish-project-detail__meta">' + meta + '</span>' : '') + facts;
      const eyebrowMarkup = eyebrowContent ? '<div class="polish-project-detail__featured-eyebrow">' + eyebrowContent + '</div>' : '';
      const summaryMarkup = summary ? '<div class="polish-project-detail__featured-summary"><p class="polish-project-detail__lead">' + summary + '</p></div>' : '';
      const optionalLayoutClass = (summary ? '' : ' is-summary-empty') + (eyebrowContent ? '' : ' is-eyebrow-empty');
      const externalHref = escapeHtml(item.externalHref || '#projects');
      const externalAttrs = /^https?:/i.test(item.externalHref || '') ? 'target="_blank" rel="noopener noreferrer"' : '';
      const bodyCopy = paragraphs.filter(Boolean).map((paragraph) => '<p>' + escapeHtml(paragraph).replace(/\n/g, '<br/>') + '</p>').join('');
      const copyMoreLabel = String(getEditableContentValue('works.detailReadMore', 'Read more') || 'Read more');
      const copyLessFallback = /[\u3400-\u9fff]/.test(copyMoreLabel) ? '收起内容' : 'Show less';
      const copyLessLabel = String(getEditableContentValue('works.detailShowLess', copyLessFallback) || copyLessFallback);
      const copyToggle = '<button type="button" class="polish-project-detail__copy-toggle" data-polish-copy-toggle data-polish-copy-label-more="' + escapeHtml(copyMoreLabel) + '" data-polish-copy-label-less="' + escapeHtml(copyLessLabel) + '" data-cursor="pointer" aria-label="' + escapeHtml(copyMoreLabel) + '" aria-expanded="false" hidden><span data-polish-copy-toggle-label>' + escapeHtml(copyMoreLabel) + '</span></button>';
      const projectViewValue = String(getEditableContentValue('works.detailView', 'View this project') || 'View this project')
        .replace(/[↗→➜⟶]/g, '')
        .trim() || 'View this project';
      const projectView = escapeHtml(projectViewValue);
      const bodyAction = '<p class="polish-project-detail__body-action"><a class="polish-project-detail__body-link" href="' + externalHref + '" ' + externalAttrs + ' data-cursor="pointer" aria-label="' + projectView + '">' + projectView + '</a></p>';
      const images = Array.isArray(item.images) && item.images.length
        ? item.images
        : [normalizeProjectImage(item.image, item.image, item.title)];
      const currentItemIndex = Math.max(0, items.findIndex((project) => project.slug === item.slug));
      const nextItemIndex = items.length > 1 ? (currentItemIndex + 1) % items.length : -1;
      const nextItem = nextItemIndex >= 0 ? items[nextItemIndex] : null;
      const nextProjectViewValue = String(getEditableContentValue('works.detailNextView', 'View next project') || 'View next project')
        .replace(/[↗→➜⟶]/g, '')
        .replace(/^View\s+the\s+next\s+project$/i, 'View next project')
        .trim() || 'View next project';
      const nextProjectView = escapeHtml(nextProjectViewValue);
      const desktopNextMarkup = nextItem
        ? '<button type="button" class="polish-project-detail__desktop-next" data-polish-next-project="' + escapeHtml(nextItem.slug) + '" data-cursor="pointer" aria-label="' + nextProjectView + '"><span class="polish-project-detail__desktop-next-label">' + nextProjectView + '</span></button>'
        : '';
      const nextProjectMarkup = nextItem
        ? '<button type="button" class="polish-project-detail__next" data-polish-next-project="' + escapeHtml(nextItem.slug) + '" data-cursor="pointer" aria-label="' + nextProjectView + '"><span class="polish-project-detail__next-label">' + nextProjectView + '</span></button>'
        : '';
      const renderDetailMedia = (image, imgIndex, featured, interactiveFeatured) => {
        const ratio = escapeHtml(image.ratio || 'square');
        const containClass = image.fit === 'contain' ? ' polish-project-detail__image--contain' : '';
        const caption = !featured && image.caption ? '<figcaption>' + escapeHtml(image.caption) + '</figcaption>' : '';
        const figureClass = 'polish-project-detail__image polish-project-detail__image--' + ratio + containClass;
        if (image.type === 'video') {
          const poster = image.poster ? ' poster="' + escapeHtml(image.poster) + '"' : '';
          return '<figure class="' + figureClass + '"><div class="polish-project-detail__image-frame polish-project-detail__image-frame--video"><video src="' + escapeHtml(image.src) + '"' + poster + ' controls preload="metadata" playsinline aria-label="' + title + ' related video ' + (imgIndex + 1) + '"></video></div>' + caption + '</figure>';
        }
        const interactive = !featured || Boolean(interactiveFeatured);
        const loading = featured ? 'eager' : 'lazy';
        const priority = featured ? ' fetchpriority="high"' : '';
        const frameClass = featured && !interactive ? 'polish-project-detail__image-frame polish-project-detail__image-frame--static-cover' : 'polish-project-detail__image-frame';
        const interactionAttrs = interactive
          ? ' data-cursor="pointer" data-polish-lightbox-src="' + escapeHtml(image.src) + '" data-polish-lightbox-caption="' + escapeHtml(image.caption || item.title || 'Untitled') + '"'
          : ' aria-hidden="true"';
        const alt = interactive ? title + ' related image ' + (imgIndex + 1) : '';
        return '<figure class="' + figureClass + '"><div class="' + frameClass + '"' + interactionAttrs + '><img src="' + escapeHtml(image.src) + '" alt="' + alt + '" loading="' + loading + '"' + priority + ' decoding="async"/></div>' + caption + '</figure>';
      };
      const firstImage = images[0];
      const alternateImage = images.length > 1 ? images[1] : null;
      const alternateMedia = alternateImage
        ? '<div class="polish-project-detail__featured-alt" aria-hidden="true">' + renderDetailMedia(alternateImage, 1, true) + '</div>'
        : '';
      const mediaChapters = images.slice(1).map((image, imageIndex) => {
        const sideClass = imageIndex % 2 ? 'polish-project-detail__chapter--right' : 'polish-project-detail__chapter--left';
        return '<section class="polish-project-detail__chapter polish-project-detail__chapter--media ' + sideClass + '" data-polish-detail-chapter>' +
          '<div class="polish-project-detail__chapter-visual">' + renderDetailMedia(image, imageIndex + 1, false) + '</div></section>';
      }).join('');
      const desktopRailItems = images.map((image, imageIndex) => {
        return renderDetailMedia(image, imageIndex, true).replace(
          '<figure class="',
          '<figure data-polish-detail-rail-card data-polish-rail-index="' + imageIndex + '" class="polish-project-detail__desktop-media-card '
        );
      }).join('');
      const desktopRail = '<div class="polish-project-detail__desktop-media-viewport" data-polish-detail-rail-viewport>' +
        '<div class="polish-project-detail__desktop-media-track" data-polish-detail-rail-track>' +
        '<div class="polish-project-detail__desktop-media-group" data-polish-detail-rail-group>' + desktopRailItems + '</div>' +
        '<div class="polish-project-detail__desktop-media-group" aria-hidden="true" inert>' + desktopRailItems + '</div>' +
        '</div></div>';
      if (isProjectSwitch) document.documentElement.classList.remove('polish-detail-opening');
      else document.documentElement.classList.add('polish-detail-opening');
      stopDetailRailMotion(true);
      detail.classList.remove('is-closing', 'is-scroll-ready', 'is-stage-entering');
      if (!isProjectSwitch) detail.classList.remove('is-close-icon-ready');
      if (!isProjectSwitch) detail.classList.add('is-stage-entering');
      if (!isProjectSwitch) setDetailCloseIconState(false);
      detailContent.innerHTML = '<section class="polish-project-detail__chapter polish-project-detail__chapter--featured is-active" data-polish-detail-chapter>' +
        '<div class="polish-project-detail__featured-shell' + copyLayoutClass + optionalLayoutClass + '" data-polish-featured-shell>' +
        '<div class="polish-project-detail__featured-media">' + renderDetailMedia(firstImage, 0, true, true) + alternateMedia + '</div>' +
        '<div class="polish-project-detail__featured-shade" aria-hidden="true"></div>' +
        '<div class="polish-project-detail__featured-content">' +
        eyebrowMarkup +
        '<div class="polish-project-detail__featured-title"><h2 class="polish-project-detail__title">' + title + '</h2></div>' +
        summaryMarkup +
        '<div class="polish-project-detail__featured-story"><div class="polish-project-detail__body-wrap is-at-start"><div class="polish-project-detail__body">' + bodyCopy + '</div></div>' + copyToggle + '</div>' + bodyAction + desktopNextMarkup +
        '</div>' + desktopRail + '</div></section>' +
        mediaChapters + nextProjectMarkup;
      const detailBody = detailContent.querySelector('.polish-project-detail__body');
      setupTextScrollControl(detailBody);
      if (detailBody) detailBody.addEventListener('scroll', updateTextScrollCue, { passive: true });
      updateDetailNavGutter();
      detailScroll.scrollTop = 0;
      document.documentElement.classList.add('polish-detail-open');
      detail.classList.add('is-open');
      detail.setAttribute('aria-hidden', 'false');
      detail.classList.add('is-scroll-ready');
      updateTextScrollCue();
      requestAnimationFrame(updateDetailNavGutter);
      requestAnimationFrame(startDetailRailMotion);
      requestAnimationFrame(() => startDetailSharedTransition(sourceTile, firstImage));
      requestAnimationFrame(() => {
        if (!detail.classList.contains('is-open')) return;
        detail.classList.add('is-close-icon-ready');
        setDetailCloseIconState(true);
      });
      if (isProjectSwitch) {
        detail.classList.remove('is-stage-entering');
        document.documentElement.classList.remove('polish-detail-opening');
        setDetailNavState('open');
      } else {
        const detailOpenSettleMs = window.innerWidth >= 901 ? 720 : 320;
        detailOpenTimer = setTimeout(() => {
          detailOpenTimer = 0;
          if (!detail.classList.contains('is-open') || detail.classList.contains('is-closing')) return;
          detail.classList.remove('is-stage-entering');
          document.documentElement.classList.remove('polish-detail-opening');
          setDetailNavState('open');
        }, detailOpenSettleMs);
      }
      try {
        detailScroll.focus({ preventScroll: true });
      } catch {
        detailScroll.focus();
      }
      setupTitleEntrance(detailContent, true);
      buildDetailNavMaterialReflection();
      requestAnimationFrame(updateDetailChapterMotion);
      requestAnimationFrame(updateDetailNavMaterialReflection);
      requestAnimationFrame(updateTextScrollCue);
      setTimeout(updateDetailChapterMotion, 250);
      setTimeout(updateDetailNavMaterialReflection, 260);
      setTimeout(updateTextScrollCue, 260);
      if (pushState && location.hash !== '#work-' + slug) updateDetailHistory(slug, isProjectSwitch);
      return true;
    }

    function switchDetailProject(slug) {
      if (!slug || !itemsBySlug.has(slug) || detail.classList.contains('is-closing') ||
          detail.classList.contains('is-project-switching')) return false;
      markDetailProjectSwitching();
      const opened = openDetail(slug, true);
      if (!opened) {
        clearDetailProjectSwitchState();
        return false;
      }
      // openDetail replaces the button nodes, so lock the newly rendered pair
      // for the remainder of the same project-switch cooldown.
      setDetailProjectSwitchControlsLocked(true);
      if (window.innerWidth < 901 && detailContent.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        detailContent.animate([
          { opacity: .2, transform: 'translate3d(0, 12px, 0)', filter: 'blur(3px)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)', filter: 'blur(0)' }
        ], {
          duration: 320,
          easing: 'cubic-bezier(.16, 1, .3, 1)'
        });
      }
      return true;
    }

    function syncDetailFromHash() {
      if (location.hash.indexOf('#work-') !== 0) {
        closeDetail(false);
        return;
      }
      openDetail(location.hash.replace('#work-', ''), false);
    }

    function animateRepeatingTransition(direction) {
      grid.style.setProperty('--polish-gallery-direction', direction >= 0 ? '1' : '-1');
      const tiles = Array.from(grid.querySelectorAll('[data-polish-layer-tile]'));
      if (!tiles.length || !transitionLayer.animate) return;
      transitionLayer.textContent = '';
      tiles.forEach((tile, tileIndex) => {
        const rect = tile.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > window.innerHeight) return;
        const image = tile.querySelector('.polish-random-grid-media image');
        const src = image && (image.getAttribute('href') || image.getAttribute('xlink:href'));
        if (!src) return;
        [0, 1, 2].forEach((layerIndex) => {
          const clone = document.createElement('span');
          clone.className = 'polish-gallery-repeat-clone';
          clone.style.left = rect.left + 'px';
          clone.style.top = rect.top + 'px';
          clone.style.width = rect.width + 'px';
          clone.style.height = rect.height + 'px';
          clone.style.opacity = String(0.76 - layerIndex * 0.17);
          clone.innerHTML = '<img src="' + escapeHtml(src) + '" alt=""/>';
          transitionLayer.appendChild(clone);

          const driftX = direction * (36 + layerIndex * 42 + (tileIndex % 3) * 12);
          const driftY = -24 + layerIndex * 18 + Math.floor(tileIndex / 3) * 16;
          const delay = tileIndex * 34 + layerIndex * 38;
          const duration = 620 + layerIndex * 90;
          clone.animate([
            { opacity: 0.72 - layerIndex * 0.12, transform: 'translate3d(0,0,0) scale(1)', filter: 'blur(0px) brightness(.95)' },
            { opacity: 0.42 - layerIndex * 0.08, offset: 0.46, transform: 'translate3d(' + (driftX * 0.42) + 'px,' + (driftY * 0.42) + 'px,0) scale(' + (1.02 + layerIndex * 0.025) + ')', filter: 'blur(' + (layerIndex * 1.1) + 'px) brightness(1.06)' },
            { opacity: 0, transform: 'translate3d(' + driftX + 'px,' + driftY + 'px,0) scale(' + (1.08 + layerIndex * 0.045) + ')', filter: 'blur(' + (4 + layerIndex * 1.6) + 'px) brightness(.72)' }
          ], {
            duration,
            delay,
            easing: 'cubic-bezier(.16, 1, .3, 1)',
            fill: 'forwards'
          }).finished.catch(() => {}).then(() => {
            if (clone.parentNode) clone.parentNode.removeChild(clone);
          });
        });
      });
      setTimeout(() => {
        transitionLayer.querySelectorAll('.polish-gallery-repeat-clone').forEach((node) => node.remove());
      }, 1200);
    }

    function animatePixelWipe(direction) {
      if (!transitionLayer.animate) return;
      const rect = grid.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > window.innerHeight) return;
      const cols = window.innerWidth < 720 ? 7 : 10;
      const rows = window.innerWidth < 720 ? 5 : 6;
      const wipe = document.createElement('span');
      wipe.className = 'polish-gallery-pixel-wipe';
      wipe.style.left = rect.left + 'px';
      wipe.style.top = rect.top + 'px';
      wipe.style.width = rect.width + 'px';
      wipe.style.height = rect.height + 'px';
      wipe.style.setProperty('--polish-pixel-cols', cols);
      wipe.style.setProperty('--polish-pixel-rows', rows);
      const order = shuffledIndexes(cols * rows, page + cols * 13 + rows * 7);
      order.forEach((cellIndex, orderIndex) => {
        const cell = document.createElement('span');
        cell.className = 'polish-gallery-pixel-cell';
        cell.style.setProperty('--polish-cell-order', orderIndex);
        wipe.appendChild(cell);
      });
      transitionLayer.appendChild(wipe);
      wipe.animate([
        { opacity: 0, filter: 'blur(0px)' },
        { opacity: .9, offset: .45, filter: 'blur(.2px)' },
        { opacity: 0, filter: 'blur(1px)' }
      ], {
        duration: 520,
        easing: 'cubic-bezier(.16, 1, .3, 1)',
        fill: 'forwards'
      }).finished.catch(() => {}).then(() => {
        if (wipe.parentNode) wipe.parentNode.removeChild(wipe);
      });
      Array.from(wipe.children).forEach((cell, index) => {
        const xDrift = direction * (index % cols - cols / 2) * 0.8;
        cell.animate([
          { opacity: 0, transform: 'translate3d(' + (-direction * 10) + 'px,0,0) scale(.58)' },
          { opacity: .95, offset: .44, transform: 'translate3d(' + xDrift.toFixed(1) + 'px,0,0) scale(1)' },
          { opacity: 0, transform: 'translate3d(' + (direction * 12) + 'px,0,0) scale(.72)' }
        ], {
          duration: 360,
          delay: Math.min(160, Number(cell.style.getPropertyValue('--polish-cell-order')) * 5),
          easing: 'steps(1, end)',
          fill: 'forwards'
        }).finished.catch(() => {});
      });
      setTimeout(() => {
        if (wipe.parentNode) wipe.parentNode.removeChild(wipe);
      }, 760);
    }

    function animateGalleryTilesOut(direction) {
      const tiles = Array.from(grid.querySelectorAll('[data-polish-layer-tile]'));
      tiles.forEach((tile, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const delay = index * 24;
        tile.animate([
          {
            opacity: 1,
            transform: 'translate3d(0,0,0) scale(1)',
            filter: 'blur(0px) brightness(1)'
          },
          {
            opacity: .18,
            transform: 'translate3d(' + (direction * (18 + col * 6)) + 'px,' + (-8 + row * 6) + 'px,0) scale(.975)',
            filter: 'blur(3px) brightness(.72)'
          }
        ], {
          duration: 260,
          delay,
          easing: 'cubic-bezier(.55, .06, .68, .19)',
          fill: 'forwards'
        }).finished.catch(() => {});
      });
    }

    function animateGalleryTilesIn(direction) {
      const tiles = Array.from(grid.querySelectorAll('[data-polish-layer-tile]'));
      tiles.forEach((tile, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const delay = index * 34;
        tile.animate([
          {
            opacity: 0,
            transform: 'translate3d(' + (-direction * (24 + col * 6)) + 'px,' + (16 + row * 8) + 'px,0) scale(.965)',
            filter: 'blur(4px) brightness(.76)'
          },
          {
            opacity: 1,
            transform: 'translate3d(0,0,0) scale(1)',
            filter: 'blur(0px) brightness(1)'
          }
        ], {
          duration: 520,
          delay,
          easing: 'cubic-bezier(.16, 1, .3, 1)',
          fill: 'both'
        }).finished.catch(() => {
          tile.style.opacity = '';
          tile.style.transform = '';
          tile.style.filter = '';
        }).then(() => {
          tile.style.opacity = '';
          tile.style.transform = '';
          tile.style.filter = '';
        });
      });
    }

    let worksGroups = [];
    let worksCards = [];
    let worksGroupSize = 0;
    let worksGroupIndex = 0;
    let worksTargetPage = 0;
    let worksRailX = 0;
    let worksRailTargetX = 0;
    let worksRailVelocity = 0;
    let worksRailFrame = 0;
    let worksRailLast = performance.now();
    let worksSpringFrame = 0;
    let worksSpringLast = performance.now();
    let worksHoveredCard = null;
    let worksDragging = false;
    let worksDragMoved = false;
    let worksDragStartX = 0;
    let worksDragStartRailX = 0;
    let worksDragLastX = 0;
    let worksDragLastTime = 0;
    let worksDragVelocity = 0;
    let worksSuppressClick = false;

    function worksModulo(value, length) {
      return ((value % length) + length) % length;
    }

    function worksViewportWidth() {
      return worksViewport ? worksViewport.getBoundingClientRect().width : 0;
    }

    function worksPageStep() {
      if (!worksViewport || !grid) return worksViewportWidth();
      const gap = parseFloat(getComputedStyle(grid).columnGap || getComputedStyle(grid).gap) || 0;
      return worksViewportWidth() + gap;
    }

    function worksCardMarkup(item, index) {
      const number = String(index + 1).padStart(2, '0');
      const href = '#work-' + escapeHtml(item.slug);
      const title = escapeHtml(item.title || 'Untitled');
      const meta = escapeHtml(String(item.meta || '').trim());
      const summary = escapeHtml(String(item.summary || item.description || '').trim());
      const metaMarkup = meta ? '<span class="polish-works-kind">' + meta + '</span>' : '';
      const summaryMarkup = summary ? '<span class="polish-works-summary">' + summary + '</span>' : '';
      return '<a class="polish-layer-tile" href="' + href + '" data-project-slug="' + escapeHtml(item.slug) + '" data-polish-layer-tile aria-label="' + title + '">' +
        '<span class="polish-works-surface"><img class="polish-works-image" src="' + escapeHtml(item.image) + '" alt="" draggable="false"/><span class="polish-works-grid-lines"></span></span>' +
        '<span class="polish-works-chrome" aria-hidden="true"><span class="polish-works-index">' + number + '</span>' + metaMarkup + '</span>' +
        '<span class="polish-works-copy"><span class="polish-works-name">' + title + '</span><span class="polish-works-detail"><span>' + summaryMarkup + '<span class="polish-works-view">' + escapeHtml(getEditableContentValue('works.viewProject', 'View project')) + '</span></span></span></span>' +
        '</a>';
    }

    function closeWorksCards(runSpring = true) {
      worksHoveredCard = null;
      worksCards.forEach((card) => {
        if (card.classList.contains('is-visual-open')) {
          const titleNode = card.querySelector('.polish-works-name');
          const expandedTitleWidth = titleNode ? titleNode.getBoundingClientRect().width : 0;
          if (expandedTitleWidth > 0) card.style.setProperty('--polish-title-lock', expandedTitleWidth.toFixed(2) + 'px');
          card.classList.remove('is-settling');
          clearTimeout(card._worksSettleTimer);
          clearTimeout(card._worksTitleTimer);
          card._worksTitleTimer = setTimeout(() => {
            if (worksHoveredCard !== card) card.style.removeProperty('--polish-title-lock');
          }, 190);
          card._worksNeedsSettle = true;
        }
        card.classList.remove('is-visual-open', 'is-opening', 'is-polish-hovered');
      });
      if (runSpring) wakeWorksSpring();
    }

    function openWorksCard(card) {
      if (!card || worksHoveredCard === card || worksDragging) return;
      closeWorksCards(false);
      worksHoveredCard = card;
      card._worksOpenWeight = worksExpandedWeight(card);
      clearTimeout(card._worksSettleTimer);
      clearTimeout(card._worksTitleTimer);
      card.classList.remove('is-settling');
      card.style.removeProperty('--polish-title-lock');
      card.classList.add('is-visual-open', 'is-opening', 'is-polish-hovered');
      setTimeout(() => card.classList.remove('is-opening'), 880);
      wakeWorksSpring();
    }

    function worksExpandedWeight(card) {
      const pageNode = card && card.closest('.polish-works-page');
      if (!pageNode) return 1.36;
      const pageCards = Array.from(pageNode.querySelectorAll('[data-polish-layer-tile]'));
      if (pageCards.length < 2) return 1;
      const pageStyle = getComputedStyle(pageNode);
      const gap = parseFloat(pageStyle.columnGap || pageStyle.gap) || 0;
      const pageWidth = pageNode.getBoundingClientRect().width;
      const cardHeight = card.getBoundingClientRect().height;
      const availableWidth = Math.max(1, pageWidth - gap * (pageCards.length - 1));
      const maxPortraitWidth = Math.min(cardHeight / 1.26, availableWidth - 1);
      const denominator = Math.max(1, availableWidth - maxPortraitWidth);
      const portraitWeight = maxPortraitWidth * (pageCards.length - 1) / denominator;
      return Math.max(1, Math.min(2.32, portraitWeight));
    }

    function worksSpringTick(now) {
      const dt = Math.min(32, now - worksSpringLast) / 16.667;
      worksSpringLast = now;
      let moving = false;
      worksCards.forEach((card) => {
        const target = card === worksHoveredCard ? (card._worksOpenWeight || worksExpandedWeight(card)) : 1;
        const delta = target - card._worksWeight;
        const stiffness = target === 1 ? .17 : .1;
        const damping = target === 1 ? .61 : .68;
        card._worksVelocity = (card._worksVelocity + delta * stiffness * dt) * Math.pow(damping, dt);
        card._worksWeight += card._worksVelocity * dt;
        if (target === 1 && card._worksWeight < .9) {
          card._worksWeight = .9;
          card._worksVelocity = 0;
        } else if (target > 1 && card._worksWeight > 2.4) {
          card._worksWeight = 2.4;
          card._worksVelocity *= .35;
        }
        if (Math.abs(delta) > .002 || Math.abs(card._worksVelocity) > .002) moving = true;
        card.style.setProperty('--polish-card-weight', card._worksWeight.toFixed(4));
        if (target === 1 && card._worksNeedsSettle && card._worksWeight <= .985) {
          card._worksNeedsSettle = false;
          card.classList.remove('is-settling');
          void card.offsetWidth;
          card.classList.add('is-settling');
          clearTimeout(card._worksSettleTimer);
          card._worksSettleTimer = setTimeout(() => card.classList.remove('is-settling'), 600);
        }
      });
      worksSpringFrame = moving ? requestAnimationFrame(worksSpringTick) : 0;
    }

    function wakeWorksSpring() {
      if (!worksSpringFrame) {
        worksSpringLast = performance.now();
        worksSpringFrame = requestAnimationFrame(worksSpringTick);
      }
    }

    function renderWorksProgress() {
      const cycle = count.clientWidth;
      const step = worksPageStep();
      if (!cycle || !step || !worksGroups.length) return;
      const phase = worksModulo((-worksRailX / step) * (cycle / worksGroups.length), cycle);
      count.querySelectorAll('span').forEach((segment) => {
        const copy = Number(segment.dataset.copy || 0);
        segment.style.setProperty('--polish-progress-phase', phase + 'px');
        segment.style.setProperty('--polish-progress-copy', (copy * cycle) + 'px');
      });
    }

    function renderWorksRail() {
      grid.style.transform = 'translate3d(' + worksRailX.toFixed(2) + 'px,0,0)';
      const depth = Math.max(-18, Math.min(18, -worksRailVelocity * .012));
      grid.style.setProperty('--polish-rail-depth', depth + 'px');
      renderWorksProgress();
    }

    function rebaseWorksRail() {
      const logicalPage = worksModulo(worksTargetPage, worksGroups.length);
      const centralPage = worksGroups.length * 2 + logicalPage;
      worksTargetPage = centralPage;
      worksRailX = worksRailTargetX = -centralPage * worksPageStep();
      worksRailVelocity = 0;
      renderWorksRail();
    }

    function worksRailTick(now) {
      const dt = Math.min(.032, Math.max(.001, (now - worksRailLast) / 1000));
      worksRailLast = now;
      const acceleration = (worksRailTargetX - worksRailX) * 76 - worksRailVelocity * 13.2;
      worksRailVelocity += acceleration * dt;
      worksRailX += worksRailVelocity * dt;
      renderWorksRail();
      const width = worksPageStep();
      const currentFloatPage = width ? -worksRailX / width : worksTargetPage;
      if (currentFloatPage < worksGroups.length || currentFloatPage > worksGroups.length * 4 - 1) {
        const pageShift = currentFloatPage < worksGroups.length ? worksGroups.length * 2 : -worksGroups.length * 2;
        const pixelShift = -pageShift * width;
        worksRailX += pixelShift;
        worksRailTargetX += pixelShift;
        worksTargetPage += pageShift;
        renderWorksRail();
      }
      if (Math.abs(worksRailTargetX - worksRailX) < .45 && Math.abs(worksRailVelocity) < 5) {
        worksRailX = worksRailTargetX;
        worksRailFrame = 0;
        const currentPage = width ? -worksRailX / width : worksTargetPage;
        if (currentPage < worksGroups.length * 1.5 || currentPage > worksGroups.length * 3.5) rebaseWorksRail();
        else renderWorksRail();
        return;
      }
      worksRailFrame = requestAnimationFrame(worksRailTick);
    }

    function wakeWorksRail() {
      if (!worksRailFrame) {
        worksRailLast = performance.now();
        worksRailFrame = requestAnimationFrame(worksRailTick);
      }
    }

    function shiftWorks(direction) {
      if (worksDragging || !worksGroups.length) return;
      closeWorksCards();
      const width = worksPageStep();
      const currentPageFloat = width ? -worksRailX / width : worksTargetPage;
      if (currentPageFloat < worksGroups.length * .75 || currentPageFloat > worksGroups.length * 4.25) rebaseWorksRail();
      worksTargetPage += direction;
      worksGroupIndex = worksModulo(worksTargetPage, worksGroups.length);
      worksRailTargetX = -worksTargetPage * worksPageStep();
      worksRailVelocity += -direction * Math.min(180, worksViewportWidth() * .2);
      wakeWorksRail();
    }

    function bindWorksCards() {
      worksCards = Array.from(grid.querySelectorAll('[data-polish-layer-tile]'));
      worksCards.forEach((card) => {
        card.draggable = false;
        card._worksWeight = 1;
        card._worksVelocity = 0;
        card._worksSettleTimer = 0;
        card._worksTitleTimer = 0;
        card._worksOpenWeight = 1;
        card.addEventListener('pointerenter', () => {
          if (!worksDragging && matchMedia('(hover:hover) and (pointer:fine)').matches) openWorksCard(card);
        });
        card.addEventListener('pointerleave', () => {
          if (worksHoveredCard === card && !worksDragging) closeWorksCards();
        });
        card.addEventListener('pointermove', (event) => {
          if (!worksDragging && matchMedia('(hover:hover) and (pointer:fine)').matches) openWorksCard(card);
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--polish-card-mx', ((event.clientX - rect.left) / rect.width - .5).toFixed(3));
          card.style.setProperty('--polish-card-my', ((event.clientY - rect.top) / rect.height - .5).toFixed(3));
        });
      });
    }

    function buildWorksRail() {
      const nextSize = window.innerWidth <= 760 ? 2 : 3;
      if (nextSize === worksGroupSize && worksCards.length) return;
      worksGroupSize = nextSize;
      worksGroups = [];
      for (let index = 0; index < items.length; index += worksGroupSize) worksGroups.push(items.slice(index, index + worksGroupSize));
      const pageData = Array.from({ length: 5 }, () => worksGroups).flat();
      grid.innerHTML = pageData.map((group, pageIndex) => {
        const base = (pageIndex % worksGroups.length) * worksGroupSize;
        return '<div class="polish-works-page">' + group.map((item, offset) => worksCardMarkup(item, base + offset)).join('') + '</div>';
      }).join('');
      count.innerHTML = '<span data-copy="-1"></span><span data-copy="0"></span><span data-copy="1"></span>';
      count.setAttribute('aria-label', 'Works browsing progress');
      bindWorksCards();
      worksGroupIndex = Math.min(worksGroupIndex, worksGroups.length - 1);
      worksTargetPage = worksGroups.length * 2 + worksGroupIndex;
      worksRailX = worksRailTargetX = -worksTargetPage * worksPageStep();
      worksRailVelocity = 0;
      renderWorksRail();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        worksRailX = worksRailTargetX = -worksTargetPage * worksPageStep();
        renderWorksRail();
      }));
      transitioning = false;
      setGalleryControlsLocked(false);
    }

    prev.addEventListener('click', (event) => {
      event.preventDefault();
      shiftWorks(-1);
    });
    next.addEventListener('click', (event) => {
      event.preventDefault();
      shiftWorks(1);
    });
    worksViewport.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      worksDragging = true;
      worksDragMoved = false;
      worksSuppressClick = false;
      worksDragStartX = worksDragLastX = event.clientX;
      worksDragStartRailX = worksRailX;
      worksDragLastTime = performance.now();
      worksDragVelocity = 0;
    });
    worksViewport.addEventListener('pointermove', (event) => {
      if (!worksDragging) return;
      const now = performance.now();
      const dx = event.clientX - worksDragStartX;
      if (!worksDragMoved) {
        if (Math.abs(dx) <= 5) return;
        worksDragMoved = true;
        if (worksRailFrame) cancelAnimationFrame(worksRailFrame);
        worksRailFrame = 0;
        worksRailTargetX = worksRailX;
        worksRailVelocity = 0;
        worksDragStartRailX = worksRailX;
        closeWorksCards();
        worksViewport.classList.add('is-dragging');
        try {
          worksViewport.setPointerCapture(event.pointerId);
        } catch {}
      }
      event.preventDefault();
      const stepTime = Math.max(1, now - worksDragLastTime);
      worksDragVelocity = worksDragVelocity * .68 + ((event.clientX - worksDragLastX) / stepTime * 1000) * .32;
      worksDragLastX = event.clientX;
      worksDragLastTime = now;
      worksRailX = worksDragStartRailX + dx;
      worksRailVelocity = worksDragVelocity;
      renderWorksRail();
    });
    function finishWorksDrag(event) {
      if (!worksDragging) return;
      const dx = event.clientX - worksDragStartX;
      worksDragging = false;
      worksSuppressClick = worksDragMoved;
      worksViewport.classList.remove('is-dragging');
      if (worksViewport.hasPointerCapture(event.pointerId)) worksViewport.releasePointerCapture(event.pointerId);
      if (!worksDragMoved) return;
      const width = worksPageStep();
      const threshold = width * .28;
      worksTargetPage = Math.round(-worksDragStartRailX / width);
      if (Math.abs(dx) >= threshold) worksTargetPage += dx < 0 ? 1 : -1;
      worksGroupIndex = worksModulo(worksTargetPage, worksGroups.length);
      worksRailTargetX = -worksTargetPage * width;
      worksRailVelocity = Math.max(-280, Math.min(280, worksDragVelocity * .2));
      wakeWorksRail();
    }
    worksViewport.addEventListener('pointerup', finishWorksDrag);
    worksViewport.addEventListener('pointercancel', finishWorksDrag);
    worksViewport.addEventListener('dragstart', (event) => event.preventDefault());
    worksViewport.addEventListener('pointerleave', () => {
      if (!worksDragging) closeWorksCards();
    });
    worksViewport.addEventListener('click', (event) => {
      if (!worksSuppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      worksSuppressClick = false;
      worksDragMoved = false;
    }, true);
    grid.addEventListener('click', (event) => {
      const tile = event.target.closest('[data-polish-layer-tile]');
      if (!tile) return;
      const slug = tile.getAttribute('data-project-slug');
      if (!slug) return;
      event.preventDefault();
      openDetail(slug, true, tile);
    });
    detail.addEventListener('polish:request-close', () => closeDetail(true));
    detail.addEventListener('wheel', handleDetailRailWheel, { passive: false });
    detail.addEventListener('click', (event) => {
      const target = event.target;
      const nextProject = target && target.closest ? target.closest('[data-polish-next-project]') : null;
      if (!nextProject || !detail.contains(nextProject)) return;
      if (!detail.classList.contains('is-open') || detail.classList.contains('is-closing')) return;
      const slug = nextProject.getAttribute('data-polish-next-project');
      if (!slug) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      switchDetailProject(slug);
    }, true);
    detail.addEventListener('click', (event) => {
      const copyToggle = event.target.closest('[data-polish-copy-toggle]');
      if (copyToggle) {
        event.preventDefault();
        const shell = copyToggle.closest('[data-polish-featured-shell]');
        const wrap = shell && shell.querySelector('.polish-project-detail__body-wrap');
        const body = shell && shell.querySelector('.polish-project-detail__body');
        if (!shell || !wrap || !body) return;
        const expanded = !shell.classList.contains('is-copy-expanded');
        shell.classList.toggle('is-copy-expanded', expanded);
        copyToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        updateCopyToggleLabel(copyToggle, expanded);
        if (!expanded) body.scrollTop = 0;
        requestAnimationFrame(() => {
          updateTextScrollCue();
          scheduleDetailChapterMotion();
        });
        return;
      }
      const nextProject = event.target.closest('[data-polish-next-project]');
      if (nextProject) {
        event.preventDefault();
        switchDetailProject(nextProject.getAttribute('data-polish-next-project'));
        return;
      }
      if (event.target.closest('[data-polish-detail-close]')) {
        event.preventDefault();
        closeDetail(true);
        return;
      }
      const lightboxTarget = event.target.closest('[data-polish-lightbox-src]');
      if (lightboxTarget) {
        openLightbox(lightboxTarget.getAttribute('data-polish-lightbox-src'), lightboxTarget.getAttribute('data-polish-lightbox-caption'), lightboxTarget);
        return;
      }
      if (shouldCloseDetailFromSideBlank(event)) {
        event.preventDefault();
        closeDetail(true);
      }
    });
    detailScroll.addEventListener('scroll', scheduleDetailNavMaterialReflection, { passive: true });
    detailScroll.addEventListener('scroll', scheduleDetailChapterMotion, { passive: true });
    lightbox.addEventListener('click', closeLightbox);
    window.addEventListener('pointermove', updateDetailSideCloseCursor, { passive: true });
    window.addEventListener('pointerleave', () => setDetailSideCloseCursorHot(false), { passive: true });
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      clearDetailInteractionState();
      if (lightbox.classList.contains('is-open')) closeLightbox();
      else if (detail.classList.contains('is-open')) closeDetail(true);
    });
    window.addEventListener('resize', () => {
      setDetailSideCloseCursorHot(false);
      scheduleDetailNavMaterialReflection();
      const nextWorksGroupSize = window.innerWidth <= 760 ? 2 : 3;
      if (nextWorksGroupSize !== worksGroupSize) buildWorksRail();
      else if (!worksDragging && !worksRailFrame && worksViewportWidth() > 0) {
        if (worksHoveredCard) worksHoveredCard._worksOpenWeight = worksExpandedWeight(worksHoveredCard);
        worksRailX = worksRailTargetX = -worksTargetPage * worksPageStep();
        renderWorksRail();
      }
    }, { passive: true });
    window.addEventListener('resize', scheduleDetailChapterMotion, { passive: true });
    window.addEventListener('resize', updateDetailNavGutter, { passive: true });
    window.addEventListener('resize', updateTextScrollCue, { passive: true });
    window.addEventListener('resize', handleDetailRailResize, { passive: true });
    window.addEventListener('hashchange', syncDetailFromHash);

    buildWorksRail();
    syncDetailFromHash();
  }

  function watchGalleryReplacement(config, projectItems) {
    if (!config.galleryReplacement) return;
    if (document.documentElement.dataset.polishGalleryWatcher === 'true') return;
    document.documentElement.dataset.polishGalleryWatcher = 'true';

    let raf = 0;
    let lastRepairAt = 0;
    function repairIfNeeded() {
      raf = 0;
      if (document.querySelector('.polish-gallery-section')) return;
      if (!findPhilosophySection()) return;
      const now = performance.now();
      if (now - lastRepairAt < 120) return;
      lastRepairAt = now;
      document.querySelectorAll('.polish-gallery-transition-layer, .polish-project-detail, .polish-lightbox').forEach((node) => node.remove());
      setupGalleryReplacement(config, projectItems);
    }

    function scheduleRepair() {
      if (!raf) raf = requestAnimationFrame(repairIfNeeded);
    }

    setTimeout(scheduleRepair, 350);
    setTimeout(scheduleRepair, 900);
    setTimeout(scheduleRepair, 1800);
    const main = document.querySelector('main') || document.body;
    const observer = new MutationObserver(scheduleRepair);
    observer.observe(main, { childList: true, subtree: true });
  }

  function collectParallaxItems(maxParallax) {
    const items = [];
    const hero = document.querySelector('main > section');
    if (hero && hero.classList.contains('polish-hero-scroll-motion')) {
      Array.from(hero.querySelectorAll(':scope > .absolute')).forEach((el) => {
        el.style.translate = 'none';
        delete el.dataset.polishParallax;
      });
    } else if (hero) {
      Array.from(hero.querySelectorAll(':scope > .absolute')).slice(0, 6).forEach((el, index) => {
        if (el.closest('.polish-scroll-indicator') || el.closest('[data-polish-no-elastic]')) return;
        items.push({ el, speed: [-0.16, 0.10, -0.08, 0.14, -0.12, 0.07][index] || 0.08 });
      });
    }

    return items.map((item) => {
      item.max = maxParallax;
      item.el.dataset.polishParallax = 'true';
      return item;
    });
  }

  function setupParallax(config) {
    if (!config.parallax) return;
    if (config.respectReducedMotion && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const items = collectParallaxItems(Number(config.maxParallax) || 34);
    if (!items.length) return;

    let ticking = false;
    function update() {
      ticking = false;
      const mid = window.innerHeight * 0.5;
      items.forEach((item) => {
        const rect = item.el.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > window.innerHeight + 120) return;
        const center = rect.top + rect.height * 0.5;
        const offset = clamp((mid - center) * item.speed, -item.max, item.max);
        item.el.style.translate = '0 ' + offset.toFixed(2) + 'px';
      });
    }

    function requestUpdate() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
  }

  function setupInnerImageParallax(config) {
    if (!config.innerImageParallax) return;
    if (document.documentElement.dataset.polishInnerImageParallax === 'true') return;
    document.documentElement.dataset.polishInnerImageParallax = 'true';
    if (config.respectReducedMotion && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const selector = '.polish-project-detail__image-frame img';
    const strength = Number(config.innerImageParallaxStrength) || 0.009;
    const damping = clamp(Number(config.innerImageParallaxDamping) || 0.16, 0.08, 0.28);
    const states = new WeakMap();
    let targets = [];
    let measureRaf = 0;
    let renderRaf = 0;
    let refreshRaf = 0;

    function getFrame(el) {
      return el.closest('.polish-project-detail__image-frame') ||
        el.closest('.polish-layer-tile') ||
        el.parentElement;
    }

    function getState(el) {
      let state = states.get(el);
      if (!state) {
        state = { y: 0, targetY: 0 };
        states.set(el, state);
      }
      return state;
    }

    function collectTargets() {
      refreshRaf = 0;
      targets = Array.from(document.querySelectorAll(selector)).map((el) => ({
        el,
        frame: getFrame(el),
        isDetail: !!el.closest('.polish-project-detail__image-frame'),
        state: getState(el)
      })).filter((item) => item.frame);
      requestMeasure();
    }

    function scheduleCollect() {
      if (!refreshRaf) refreshRaf = requestAnimationFrame(collectTargets);
    }

    function resetTargets() {
      targets.forEach((item) => {
        item.state.y = 0;
        item.state.targetY = 0;
        item.el.style.setProperty('--polish-inner-parallax-y', '0px');
      });
    }

    function measure() {
      measureRaf = 0;
      if (isMobileLikeViewport()) {
        resetTargets();
        return;
      }

      const mid = window.innerHeight * 0.5;
      targets.forEach((item) => {
        if (!item.el.isConnected) return;
        if (!item.frame || !item.frame.isConnected) item.frame = getFrame(item.el);
        if (!item.frame) return;
        if (item.isDetail && item.el.closest('.polish-project-detail__image--contain')) {
          item.state.targetY = 0;
          return;
        }

        const rect = item.frame.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.bottom < -160 || rect.top > window.innerHeight + 160) {
          item.state.y = 0;
          item.state.targetY = 0;
          item.el.style.setProperty('--polish-inner-parallax-y', '0px');
          return;
        }

        const center = rect.top + rect.height * 0.5;
        const maxOffset = item.isDetail ? 3 : 2;
        item.state.targetY = clamp((mid - center) * strength, -maxOffset, maxOffset);
      });
      requestRender();
    }

    function render() {
      renderRaf = 0;
      if (isMobileLikeViewport()) {
        resetTargets();
        return;
      }

      let needsNextFrame = false;
      targets.forEach((item) => {
        if (!item.el.isConnected) return;
        const state = item.state;
        state.y += (state.targetY - state.y) * damping;
        if (Math.abs(state.y - state.targetY) < 0.08) state.y = state.targetY;
        item.el.style.setProperty('--polish-inner-parallax-y', state.y.toFixed(2) + 'px');
        if (Math.abs(state.y - state.targetY) > 0.08) needsNextFrame = true;
      });

      if (needsNextFrame) requestRender();
    }

    function requestMeasure() {
      if (!measureRaf) measureRaf = requestAnimationFrame(measure);
    }

    function requestRender() {
      if (!renderRaf) renderRaf = requestAnimationFrame(render);
    }

    collectTargets();
    const observer = new MutationObserver(scheduleCollect);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', requestMeasure, { passive: true });
    document.addEventListener('scroll', requestMeasure, { passive: true, capture: true });
    window.addEventListener('resize', () => {
      scheduleCollect();
      requestMeasure();
    }, { passive: true });
  }

  function start(config, projectItems) {
    if (!config.enabled) {
      releaseFirstPaintGuard();
      return;
    }
    config.detailNavMode = resolveDetailNavMode(config);
    document.documentElement.dataset.polishDetailNavMode = config.detailNavMode;
    injectStyles();
    setupMobilePointerPolicy();
    setupResponsiveViewportGuard();
    setupCompactNavMode();
    setupNav(config);
    setupSharedDetailNav(config);
    setupGalleryNavJump();
    disableHeroAvailability();
    disableStatsMotion();
    setupHeroVideo(config);
    setupHeroScrollMotion(config);
    setupScrollIndicator(config);
    removeMarqueeStrip(config);
    setupClickHover(config);
    setupMagneticButtons(config);
    setupPointerPerformanceGate();
    setupHoverStateSync();
    setupGalleryReplacement(config, projectItems);
    setupInnerImageParallax(config);
    watchGalleryReplacement(config, projectItems);
    applySiteArchitecture();
    setupFluidTrailVisibility();
    setupHeroScrollMotion(config);
    disableStatementBodyMotion();
    disableContactBodyMotion();
    setupParallax(config);
    setupElasticText(config);
    setupTitleEntrance(document, false);
    setupHeroSdfTitle(config);
    releaseFirstPaintGuard();
    setTimeout(() => {
      disableHeroAvailability();
      disableStatsMotion();
      setupHeroVideo(config);
      setupHeroScrollMotion(config);
      applySiteArchitecture();
      disableStatementBodyMotion();
      disableContactBodyMotion();
      setupTitleEntrance(document, false);
    }, 800);
    setTimeout(() => {
      disableHeroAvailability();
      disableStatsMotion();
      setupHeroVideo(config);
      setupHeroScrollMotion(config);
      applySiteArchitecture();
      disableStatementBodyMotion();
      disableContactBodyMotion();
      setupTitleEntrance(document, false);
    }, 1800);
    setupNavReflection(config);
    document.querySelectorAll('.polish-progressive-blur').forEach((node) => node.remove());
  }

  if (DEFAULTS.bootSettle) installBootSettle(DEFAULTS.bootSettleMs, DEFAULTS.diffusionBoot);

  window.addEventListener('editable:content-ready', () => {
    destroyHeroSdfTitle();
    normalizeHeroTitle();
    applySiteArchitecture();
    setupHeroVideo(activeHeroSdfConfig || DEFAULTS);
    setupTitleEntrance(document, false);
    setupHeroSdfTitle(activeHeroSdfConfig || DEFAULTS);
  });

  let hasStarted = false;
  function boot() {
    if (hasStarted) return;
    hasStarted = true;
    try { window.scrollTo(0, 0); } catch {}
    disableHeroAvailability();
    requestAnimationFrame(disableHeroAvailability);
    loadConfig().then((config) => {
      if (config.bootSettle) installBootSettle(config.bootSettleMs, config.diffusionBoot);
      loadProjectItems(config).then((projectItems) => {
        setTimeout(() => start(config, projectItems), 350);
      });
    }).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
