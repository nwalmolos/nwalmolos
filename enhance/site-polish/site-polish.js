(function () {
  const CONFIG_URL = 'enhance/site-polish/config.json';
  const PROJECTS_URL = 'enhance/site-polish/projects.json';
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

  function installInitialStateGuards() {
    try {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      window.scrollTo(0, 0);
    } catch {}

    if (!document.querySelector('#polish-first-paint-guard, style[data-enhance="site-polish-early"]')) {
      const style = document.createElement('style');
      style.dataset.enhance = 'site-polish-early';
      style.textContent = '#projects + section:not([id]):not(.polish-gallery-section){display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;}main>section:first-of-type>div.relative.text-center>.mb-8{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;}html:not(.polish-first-paint-ready) main>section:first-of-type{opacity:0!important;visibility:hidden!important;}main>section:first-of-type{transition:opacity .36s cubic-bezier(.16,1,.3,1);}html{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.20) rgba(0,0,0,.34);}html::-webkit-scrollbar,body::-webkit-scrollbar{width:10px;height:10px;}html::-webkit-scrollbar-track,body::-webkit-scrollbar-track{background:rgba(0,0,0,.34);border-radius:999px;}html::-webkit-scrollbar-thumb,body::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(255,255,255,.24),rgba(255,255,255,.13));border:2px solid rgba(0,0,0,.48);border-radius:999px;}';
      (document.head || document.documentElement).appendChild(style);
    }

    const reset = () => {
      try { window.scrollTo(0, 0); } catch {}
    };
    window.addEventListener('pageshow', reset, { once: true });
    document.addEventListener('DOMContentLoaded', reset, { once: true });
  }

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

  function isMobileLikeViewport() {
    return window.innerWidth <= 767 || matchMedia('(hover: none), (pointer: coarse)').matches;
  }

  function isCompactNavViewport() {
    const visualWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    return Math.min(window.innerWidth || 9999, visualWidth || 9999) <= 1024 ||
      matchMedia('(hover: none), (pointer: coarse)').matches;
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
      html,
      body {
        background: #020203 !important;
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
      .polish-hero-scroll-motion {
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
      .polish-hero-scroll-motion.is-polish-hero-video-hidden > .polish-hero-video-layer {
        opacity: 0;
        visibility: hidden;
        transition: opacity .16s ease, visibility 0s linear .16s;
      }
      .polish-hero-scroll-content {
        position: relative;
        z-index: 10;
        translate: 0 0 !important;
        transform: none !important;
        opacity: 1 !important;
        will-change: auto !important;
      }
      html.polish-title-entrance-active .polish-hero-scroll-content {
        translate: 0 0 !important;
        transform: none !important;
        opacity: 1 !important;
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
      .polish-hero-cover-first-section {
        background-color: transparent;
        background-image:
          linear-gradient(
            180deg,
            rgba(2,2,3,0) 0px,
            rgba(2,2,3,.22) 70px,
            rgba(2,2,3,.78) 160px,
            #020203 250px,
            #020203 100%
          );
        background-repeat: no-repeat;
        margin-top: clamp(-170px, -16vh, -96px);
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
        position: absolute !important;
        left: 50% !important;
        right: auto !important;
        top: auto !important;
        bottom: clamp(54px, 9vh, 96px) !important;
        transform: translate3d(-50%, 0, 0) !important;
        opacity: .86 !important;
        z-index: 12;
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
          display: none !important;
        }
      }
      [data-polish-parallax] {
        will-change: translate;
      }
      .polish-hide-system-cursor,
      .polish-hide-system-cursor * {
        cursor: none !important;
      }
      html:not(.polish-custom-cursor-ready) main.cursor-none,
      html:not(.polish-custom-cursor-ready) main.cursor-none * {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='3.2' fill='white' stroke='black' stroke-opacity='.58' stroke-width='1.15'/%3E%3C/svg%3E") 8 8, auto !important;
      }
      @media (hover: none), (pointer: coarse) {
        .polish-hide-system-cursor,
        .polish-hide-system-cursor *,
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
        .polish-hero-cover-first-section {
          margin-top: clamp(-132px, -14vh, -76px);
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
        transition: opacity .16s ease, box-shadow .16s ease;
        mix-blend-mode: difference;
        will-change: transform, opacity;
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
        opacity: 0;
        visibility: visible;
        pointer-events: none;
        transform: translate3d(0, -10px, 0) scale(.985);
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
        opacity: 0;
        transform: translate3d(0, 18px, 0) scale(.99);
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
        font-size: clamp(26px, 8vw, 38px);
        font-weight: 300;
        line-height: 1;
        letter-spacing: 0;
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
          filter: blur(8px);
          transform: translate3d(var(--polish-mobile-menu-x, 0px), calc(var(--polish-mobile-menu-y, 0px) - 18px), 0) scale(.972);
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
        --polish-mobile-menu-enter-y: -18px;
        --polish-mobile-menu-scale: .972;
        opacity: 0;
        filter: blur(8px);
        transition-delay: var(--polish-mobile-menu-exit-delay, 0ms);
        animation: polish-mobile-menu-link-out .30s cubic-bezier(.55, 0, .2, 1) both;
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
        font: 11px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        letter-spacing: .18em;
        text-transform: uppercase;
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
        padding: env(safe-area-inset-top, 0px) 22px 0;
        background: rgba(4,5,7,.58);
        border-bottom: 1px solid rgba(255,255,255,.045);
        -webkit-backdrop-filter: blur(20px) saturate(1.14);
        backdrop-filter: blur(20px) saturate(1.14);
        pointer-events: auto;
      }
      html.polish-compact-nav .polish-mobile-nav-brand {
        color: rgba(255,255,255,.72);
        text-decoration: none;
        font: 12px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        letter-spacing: .28em;
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
        transform: translateX(-50%) rotate(42deg);
      }
      html.polish-compact-nav .polish-mobile-menu-fallback.is-open span:nth-child(2) {
        opacity: 0;
      }
      html.polish-compact-nav .polish-mobile-menu-fallback.is-open span:nth-child(3) {
        top: 20px;
        transform: translateX(-50%) rotate(-42deg);
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
      @media (max-width: 767px), (hover: none), (pointer: coarse) {
        html.polish-hide-system-cursor,
        html.polish-hide-system-cursor *,
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
        font: 11px/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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
        text-align: center;
        font: 11px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        letter-spacing: .18em;
        color: rgba(255,255,255,.34);
      }
      .polish-gallery-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: clamp(12px, 1.8vw, 22px);
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
        font: 10px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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
        font: 10px/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        letter-spacing: .16em;
        text-transform: uppercase;
        color: rgba(255,255,255,.36);
        transition: color .22s ease;
      }
      .polish-layer-summary {
        display: -webkit-box;
        margin-top: 10px;
        max-width: 92%;
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
        font: 10px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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
        overflow: auto;
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
        font: 11px/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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
      .polish-project-detail__hero {
        display: block;
        max-width: 920px;
        padding-top: 0;
      }
      .polish-project-detail__title {
        margin: 0;
        max-width: 900px;
        font-size: clamp(44px, 7vw, 96px);
        line-height: .94;
        color: rgba(255,255,255,.92);
        letter-spacing: 0;
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
        font-size: clamp(18px, 2.1vw, 28px);
        line-height: 1.35;
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
          border-color .24s ease,
          background-color .24s ease,
          box-shadow .24s ease;
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
          opacity .18s ease;
        will-change: transform, opacity;
      }
      .polish-project-detail__image-frame::after {
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,0),
          inset 0 -92px 120px rgba(0,0,0,.22);
        opacity: 0;
        transition: opacity .24s ease, box-shadow .24s ease;
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
        --polish-detail-image-scale: 1.06;
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: translate3d(0, var(--polish-inner-parallax-y), 0) scale(var(--polish-detail-image-scale));
        transform-origin: center;
        filter: saturate(.9) contrast(1.04) brightness(.82);
        transition: filter .32s cubic-bezier(.16, 1, .3, 1);
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
        --polish-detail-image-scale: 1.08;
        filter: saturate(.96) contrast(1.08) brightness(.86);
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
        --polish-detail-image-scale: 1.06;
        filter: saturate(.9) contrast(1.04) brightness(.82);
      }
      .polish-project-detail__image figcaption {
        margin-top: 9px;
        font: 11px/1.45 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        letter-spacing: .08em;
        color: rgba(255,255,255,.38);
      }
      .polish-lightbox {
        position: fixed;
        inset: 0;
        z-index: 1005;
        display: grid;
        place-items: center;
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
      .polish-lightbox img {
        max-width: min(94vw, 1360px);
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
        font: 12px/1.6 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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
      .polish-project-detail.is-open .polish-project-detail__hero-media,
      .polish-project-detail.is-open .polish-project-detail__image {
        animation: polish-detail-enter .72s cubic-bezier(.16, 1, .3, 1) both;
      }
      .polish-project-detail.is-open .polish-project-detail__lead { animation-delay: .05s; }
      .polish-project-detail.is-open .polish-project-detail__body { animation-delay: .09s; }
      .polish-project-detail.is-open .polish-project-detail__image:nth-child(1) { animation-delay: .10s; }
      .polish-project-detail.is-open .polish-project-detail__image:nth-child(2) { animation-delay: .16s; }
      .polish-project-detail.is-open .polish-project-detail__image:nth-child(3) { animation-delay: .22s; }
      .polish-project-detail.is-open.is-scroll-ready .polish-project-detail__lead,
      .polish-project-detail.is-open.is-scroll-ready .polish-project-detail__body,
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
            width: 18px;
            height: 1px;
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
            transform: translateX(-50%) rotate(42deg);
          }
          .polish-mobile-menu-fallback.is-open span:nth-child(2) {
            opacity: 0;
          }
          .polish-mobile-menu-fallback.is-open span:nth-child(3) {
            top: 20px;
            transform: translateX(-50%) rotate(-42deg);
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
          padding: calc(84px + env(safe-area-inset-top, 0px)) 16px calc(86px + env(safe-area-inset-bottom, 0px));
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
        .polish-project-detail__title {
          font-size: clamp(38px, 14vw, 68px);
          line-height: .96;
        }
        .polish-project-detail__lead {
          font-size: clamp(16px, 4.8vw, 21px);
          line-height: 1.46;
        }
        .polish-project-detail__body {
          max-height: clamp(150px, 26vh, 220px);
          font-size: 14px;
          line-height: 1.75;
          padding-right: 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .polish-project-detail__body::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
        .polish-project-detail__body-wrap {
          padding-right: 26px;
        }
        .polish-project-detail__body-wrap.has-more .polish-project-detail__body-scrollbar {
          display: block;
          opacity: .92;
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
      }
      @media (max-width: 900px) {
        .polish-gallery-head {
          display: block;
        }
        .polish-gallery-controls {
          margin-top: 22px;
        }
        .polish-gallery-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 560px) {
        .polish-gallery-section {
          padding-left: 16px;
          padding-right: 16px;
        }
        .polish-gallery-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
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
        line-height: 1.04 !important;
        padding: .06em 0 .12em !important;
        margin-top: -.04em !important;
        margin-bottom: -.08em !important;
      }
      .polish-hero-title-normalized .polish-title-word {
        overflow: visible !important;
        line-height: 1.04 !important;
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
        right: 48px;
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
        transform: translate3d(0, 8px, 0) rotate(-5deg) scale(.74);
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
        opacity: 0;
        box-shadow: 0 0 7px rgba(255,255,255,.07);
        transform-origin: 50% 50%;
        transition:
          opacity .24s ease,
          transform .36s cubic-bezier(.16, 1, .3, 1);
      }
      .polish-shared-detail-close__line:first-child {
        transform: translate3d(-50%, -50%, 0) rotate(0deg) scaleX(.38);
      }
      .polish-shared-detail-close__line:last-child {
        transform: translate3d(-50%, -50%, 0) rotate(0deg) scaleX(.38);
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
      html[data-polish-detail-nav-mode="shared"].polish-shared-detail-active nav .polish-shared-nav-home-item {
        opacity: 0 !important;
        filter: blur(8px) !important;
        pointer-events: none !important;
        transform: translate3d(0, -12px, 0) scale(.975) !important;
        transition-delay: var(--polish-shared-nav-exit-delay, 0ms);
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close,
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="open"] nav .polish-shared-detail-close {
        opacity: 1;
        filter: blur(0);
        pointer-events: auto;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close {
        transition-delay: 150ms;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close__glyph,
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="open"] nav .polish-shared-detail-close__glyph {
        opacity: 1;
        filter: drop-shadow(0 0 7px rgba(255,255,255,.07));
        transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close__glyph {
        transition-delay: 145ms;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close__line,
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="open"] nav .polish-shared-detail-close__line {
        opacity: 1;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close__line {
        transition-delay: 180ms;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close__line:first-child,
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="open"] nav .polish-shared-detail-close__line:first-child {
        transform: translate3d(-50%, -50%, 0) rotate(42deg) scaleX(1);
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="entering"] nav .polish-shared-detail-close__line:last-child,
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="open"] nav .polish-shared-detail-close__line:last-child {
        transform: translate3d(-50%, -50%, 0) rotate(-42deg) scaleX(1);
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="closing"] nav .polish-shared-detail-close {
        opacity: 0;
        filter: blur(6px);
        pointer-events: none;
        transition-delay: 0ms;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="closing"] nav .polish-shared-detail-close__glyph {
        opacity: .64;
        filter: drop-shadow(0 0 4px rgba(255,255,255,.03));
        transform: translate3d(0, -7px, 0) rotate(5deg) scale(.78);
        transition-delay: 0ms;
      }
      html[data-polish-detail-nav-mode="shared"][data-polish-detail-nav-state="closing"] nav .polish-shared-nav-home-item {
        opacity: 1 !important;
        filter: blur(0) !important;
        pointer-events: none !important;
        transform: translate3d(0, 0, 0) scale(1) !important;
        transition-delay: calc(76ms + var(--polish-shared-nav-restore-delay, 0ms));
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
      link.style.setProperty('--polish-mobile-menu-exit-delay', ((menuLinks.length - 1 - index) * 34) + 'ms');
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
        }, 560);
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
      if (!isMobileLikeViewport()) return;
      document.documentElement.classList.remove('polish-hide-system-cursor', 'polish-custom-cursor-ready');
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
        item.style.setProperty('--polish-shared-nav-exit-delay', ((orderedItems.length - 1 - index) * 22) + 'ms');
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
          brandItem.style.setProperty('--polish-shared-nav-exit-delay', '88ms');
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
          close.innerHTML = '<span class="polish-shared-detail-close__glyph" aria-hidden="true"><span class="polish-shared-detail-close__line"></span><span class="polish-shared-detail-close__line"></span></span>';
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

    function getActiveCloseControl() {
      if (root.classList.contains('polish-compact-nav')) return document.querySelector('.polish-mobile-menu-fallback');
      return document.querySelector('[data-polish-shared-detail-close]');
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
      if (nextState === 'open') {
        requestAnimationFrame(() => {
          const control = getActiveCloseControl();
          if (!control || !root.classList.contains('polish-shared-detail-active')) return;
          try { control.focus({ preventScroll: true }); } catch { control.focus(); }
        });
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
        }, 360);
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
    const labels = ['Years Experience', 'Projects Completed', 'Happy Clients'];
    const nodes = Array.from(document.querySelectorAll('main section div, main section span'));
    const matched = labels.map((label) => nodes.find((node) => {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      return text === label;
    })).filter(Boolean);
    if (!matched.length) return;

    matched.forEach((labelNode) => {
      const statItem = labelNode.parentElement;
      const statsGrid = labelNode.closest('.grid');
      if (statsGrid) {
        statsGrid.classList.add('polish-static-stats');
        statsGrid.dataset.polishNoElastic = 'true';
      }
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
    if (!config.heroVideo) {
      if (layer) layer.remove();
      document.documentElement.classList.remove('polish-hero-video-active');
      return;
    }

    const src = String(config.heroVideoSrc || '').trim();
    const poster = String(config.heroVideoPoster || '').trim();
    const allowMobile = config.heroVideoMobile !== false;
    if (!src && !poster) return;
    const lazyVideo = config.heroVideoLazy !== false;
    const lazyDelay = clamp(Number(config.heroVideoLazyDelay) || 0, 0, 4000);
    const preloadMode = String(config.heroVideoPreload || (lazyVideo ? 'none' : 'metadata')).trim() || 'none';
    const videoKey = [src, poster, allowMobile ? 'mobile' : 'desktop', lazyVideo ? 'lazy' : 'eager', lazyDelay, preloadMode].join('|');
    if (layer && layer.dataset.polishHeroVideoKey === videoKey) {
      document.documentElement.classList.toggle('polish-hero-video-active', Boolean(src || poster));
      return;
    }

    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'polish-hero-video-layer';
      layer.setAttribute('aria-hidden', 'true');
      hero.insertBefore(layer, hero.firstChild);
    }
    layer.dataset.polishHeroVideoKey = videoKey;
    layer.textContent = '';

    const fallback = document.createElement('div');
    fallback.className = 'polish-hero-video-fallback';
    if (poster) {
      fallback.classList.add('is-polish-hero-poster');
      fallback.style.backgroundImage = 'linear-gradient(rgba(0,0,0,.34), rgba(0,0,0,.34)), url("' + poster.replace(/["\\]/g, '\\$&') + '")';
    }
    layer.appendChild(fallback);

    const canUseVideo = src && (allowMobile || !matchMedia('(hover: none), (pointer: coarse)').matches);
    const mountVideo = () => {
      if (!canUseVideo || !document.body.contains(layer) || layer.querySelector('video')) return;
      const video = document.createElement('video');
      video.className = 'polish-hero-video';
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = preloadMode;
      video.setAttribute('muted', '');
      video.setAttribute('autoplay', '');
      video.setAttribute('loop', '');
      video.setAttribute('playsinline', '');
      if (poster) video.poster = poster;

      const source = document.createElement('source');
      source.src = src;
      source.type = /\.webm(?:$|\?)/i.test(src) ? 'video/webm' : 'video/mp4';
      video.appendChild(source);
      video.addEventListener('canplay', () => {
        layer.classList.add('is-polish-video-ready');
        document.documentElement.classList.add('polish-hero-video-active');
      }, { once: true });
      video.addEventListener('error', () => {
        layer.classList.remove('is-polish-video-ready');
        document.documentElement.classList.remove('polish-hero-video-active');
      }, { once: true });
      layer.insertBefore(video, fallback);
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === 'function') playAttempt.catch(() => {});
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
      heroScrollMotionState.sections.forEach((section) => section.classList.remove('polish-hero-cover-section', 'polish-hero-cover-first-section'));
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
    const state = { hero, main, content, sections, requestUpdate, destroy };

    function update() {
      raf = 0;
      if (!document.body.contains(hero)) {
        destroy();
        return;
      }
      const rect = hero.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight || 1;
      const progress = clamp(-rect.top / Math.max(1, Math.min(rect.height || viewport, viewport)), 0, 1);
      const videoY = clamp(progress * -28, -28, 0);
      const videoScale = 1 + progress * 0.018;
      hero.style.setProperty('--polish-hero-video-y', videoY.toFixed(1) + 'px');
      hero.style.setProperty('--polish-hero-video-scale', videoScale.toFixed(4));
      const bridge = document.querySelector('.polish-marquee-removed');
      const bridgeRect = bridge ? bridge.getBoundingClientRect() : null;
      const hideVideo = bridgeRect ? bridgeRect.bottom <= 2 : (rect.bottom <= 2 || progress >= 0.995);
      hero.classList.toggle('is-polish-hero-video-hidden', hideVideo);
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
      hero.style.removeProperty('--polish-hero-video-y');
      hero.style.removeProperty('--polish-hero-video-scale');
      if (state.main) state.main.classList.remove('polish-hero-cover-main');
      if (state.content) state.content.classList.remove('polish-hero-scroll-content');
      state.sections.forEach((section) => section.classList.remove('polish-hero-cover-section', 'polish-hero-cover-first-section'));
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
    if (!node || !text) return;
    node.textContent = text;
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
    const labels = ['Frontend Development', 'UI/UX Design', 'Full Stack', 'Creative Coding'];
    Array.from(statement.querySelectorAll('.group')).forEach((card) => {
      const text = (card.textContent || '').replace(/\s+/g, ' ').trim();
      if (!labels.some((label) => text.indexOf(label) !== -1)) return;
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
      setPlainText(gallery.querySelector('.polish-gallery-kicker'), '02 - Works');
      const title = gallery.querySelector('.polish-gallery-title');
      if (title) {
        setTitleEntranceMarkup(title, 'Visual<br/><span class="polish-gallery-title-muted">paths</span>', 'gallery|Visual|paths');
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
      setPlainText(trajectory.querySelector('.text-xs.font-mono'), '03 - Trajectory');
      replaceTitleMarkup(trajectory, 'Creative', 'trajectory');
      const titleWrap = trajectory.querySelector('h2') && trajectory.querySelector('h2').closest('.mb-16');
      if (titleWrap) titleWrap.removeAttribute('data-polish-no-elastic');
      const rows = Array.from(trajectory.querySelectorAll('[data-cursor="pointer"]'));
      const milestones = [
        ['2026', 'Portfolio system', 'Static GitHub Pages ready site with local preview, project detail pages, and refined motion direction.'],
        ['2025', 'Motion studies', 'Scroll, hover, image layering, and dark interface experiments shaped into a reusable visual language.'],
        ['2024', 'Visual archive', 'Collected image-led studies, small media tests, and selected references for future project pages.']
      ];
      rows.forEach((row, index) => {
        const data = milestones[index % milestones.length];
        const title = row.querySelector('h3');
        const category = row.querySelector('.text-xs.font-mono.text-foreground\\/30');
        const desc = row.querySelector('p');
        const year = Array.from(row.querySelectorAll('.text-xs.font-mono')).find((node) => /^\d{4}$/.test((node.textContent || '').trim()));
        setPlainText(title, data[1]);
        setPlainText(category, 'Milestone');
        setPlainText(desc, data[2]);
        setPlainText(year, data[0]);
      });
    }

    if (statement) {
      statement.dataset.polishSectionRole = 'statement';
      setPlainText(statement.querySelector('.text-xs.font-mono'), getEditableContentValue('about.label', '04 - Statement'));
      replaceTitleMarkup(statement, getEditableContentValue('about.titleLine1', 'Profile'), getEditableContentValue('about.titleLine2', 'statement'));
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
    if (!config.clickHover || isMobileLikeViewport()) return;
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
      cursor.style.transform = 'translate3d(' + (pointer.x - sizes.dot / 2) + 'px,' + (pointer.y - sizes.dot / 2) + 'px,0) scale(' + (pointer.active ? '1.08' : '1') + ')';
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
      const ringSize = sizes.ring * (pointer.active ? sizes.activeScale : 1);
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
      document.documentElement.classList.add('polish-custom-cursor-ready', 'polish-hide-system-cursor');
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
      const target = source && source.closest && source.closest(clickableSelector);
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

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', spawnClickMotion, { passive: true });
    window.addEventListener('pointerleave', leave, { passive: true });
    window.addEventListener('wheel', scheduleScrollSync, { passive: true });
    window.addEventListener('scroll', scheduleScrollSync, { passive: true });
    document.addEventListener('pointerout', (event) => {
      if (currentTarget && !currentTarget.contains(event.relatedTarget)) {
        pointer.active = false;
        setTarget(null);
        paintCursor();
      }
    }, { passive: true });
  }

  function setupMagneticButtons(config) {
    if (!config.magneticButtons || isMobileLikeViewport()) return;
    const selector = 'a, button, [role="button"], [data-cursor="pointer"], summary';
    const navMagneticReach = 36;
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
        target.closest('.polish-gallery-grid, #projects') ||
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
    if (isMobileLikeViewport()) return;
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
    if (isMobileLikeViewport()) return;
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
      '<text x="58" y="810" fill="#fff" fill-opacity=".62" font-family="Arial, sans-serif" font-size="74" font-weight="700" letter-spacing="4">' + label + '</text>' +
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
      const base = Object.assign({}, item);
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
    });
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
    let pageSize = resolveGalleryPageSize(config, items.length);
    items = ensureGalleryPaginationItems(items, pageSize, config);
    const itemsBySlug = new Map(items.map((item) => [item.slug, item]));
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    let page = 0;

    section.dataset.polishGalleryReady = 'true';
    section.className = 'polish-gallery-section';
    section.id = 'gallery';
    section.removeAttribute('style');
    section.innerHTML = '<div class="polish-gallery-shell">' +
      '<div class="polish-gallery-head">' +
      '<div><span class="polish-gallery-kicker">03 — Gallery</span><div class="polish-gallery-title-lock"><h2 class="polish-gallery-title">Selected<br/><span class="polish-gallery-title-muted">visual paths</span></h2></div></div>' +
      '<div class="polish-gallery-controls">' +
      '<button class="polish-gallery-button" type="button" data-polish-gallery-prev aria-label="Previous page"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<span class="polish-gallery-count" data-polish-gallery-count></span>' +
      '<button class="polish-gallery-button" type="button" data-polish-gallery-next aria-label="Next page"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '</div></div><div class="polish-gallery-grid" data-polish-gallery-grid></div></div>';

    const grid = section.querySelector('[data-polish-gallery-grid]');
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
      '<button class="polish-project-detail__back" type="button" data-polish-detail-close data-cursor="pointer" aria-label="Close project detail"><span class="polish-project-detail__back-label">Close</span><span class="polish-project-detail__back-icon" aria-hidden="true"><span class="polish-project-detail__back-line is-top"></span><span class="polish-project-detail__back-line is-mid"></span><span class="polish-project-detail__back-line is-bottom"></span></span></button></div></div>' +
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
    let navMaterialItems = [];
    let detailNavGutter = 0;
    let detailCloseTimer = 0;
    let detailOpenTimer = 0;
    const detailCloseExitMs = 360;
    let detailReturnScrollY = 0;
    let hasDetailReturnScrollY = false;
    let detailReturnFocus = null;
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

    function updateTextScrollCue() {
      const body = detail.querySelector('.polish-project-detail__body');
      const wrap = detail.querySelector('.polish-project-detail__body-wrap');
      if (!body || !wrap) return;
      const hasMore = body.scrollHeight > body.clientHeight + 6;
      const atStart = body.scrollTop <= 8;
      const atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 8;
      wrap.classList.toggle('has-more', hasMore);
      wrap.classList.toggle('is-at-start', !hasMore || atStart);
      wrap.classList.toggle('is-at-end', !hasMore || atEnd);
      const rail = wrap.querySelector('.polish-project-detail__body-scrollbar');
      if (!rail) return;
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

    function updateDetailNavGutter() {
      const currentGutter = Math.max(0, Math.round(window.innerWidth - document.documentElement.clientWidth));
      if (!document.documentElement.classList.contains('polish-detail-open') || currentGutter > 0) {
        detailNavGutter = currentGutter;
      }
      detail.style.setProperty('--polish-detail-nav-gutter', detailNavGutter + 'px');
      document.documentElement.style.setProperty('--polish-detail-page-gutter', detailNavGutter + 'px');
      document.documentElement.style.setProperty('--polish-shared-nav-gutter', detailNavGutter + 'px');
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
      const scrollbarEdge = Math.max(18, window.innerWidth - document.documentElement.clientWidth + 18);
      if (event.clientX >= window.innerWidth - scrollbarEdge) return false;
      const blocked = event.target.closest(
        '[data-polish-detail-close], [data-polish-lightbox-src], a, button, input, textarea, select, summary, ' +
        '.polish-project-detail__top, .polish-project-detail__hero, .polish-project-detail__body-wrap, ' +
        '.polish-project-detail__actions, .polish-project-detail__gallery, .polish-project-detail__image-frame'
      );
      if (blocked) return false;
      const sideSize = Math.max(72, Math.min(240, window.innerWidth * 0.18));
      return event.clientX <= sideSize || event.clientX >= window.innerWidth - sideSize;
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

    function finishCloseDetail(pushState) {
      if (detailCloseTimer) {
        clearTimeout(detailCloseTimer);
        detailCloseTimer = 0;
      }
      if (detailOpenTimer) {
        clearTimeout(detailOpenTimer);
        detailOpenTimer = 0;
      }
      detail.classList.remove('is-open', 'is-closing', 'is-scroll-ready', 'is-close-icon-ready');
      detail.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('polish-detail-open', 'polish-detail-opening');
      document.documentElement.style.removeProperty('--polish-detail-page-gutter');
      setDetailNavState('closed');
      clearDetailNavMaterialReflection();
      if (pushState && location.hash.indexOf('#work-') === 0) {
        history.pushState(null, '', location.pathname + location.search);
      }
      restoreDetailReturnPosition();
      hasDetailReturnScrollY = false;
      const returnFocus = detailReturnFocus;
      detailReturnFocus = null;
      if (returnFocus && returnFocus.isConnected) {
        requestAnimationFrame(() => {
          try { returnFocus.focus({ preventScroll: true }); } catch { returnFocus.focus(); }
        });
      }
    }

    function closeDetail(pushState) {
      if (!detail.classList.contains('is-open')) {
        finishCloseDetail(pushState);
        return;
      }
      if (detailCloseTimer) return;
      if (detailOpenTimer) {
        clearTimeout(detailOpenTimer);
        detailOpenTimer = 0;
      }
      setDetailNavState('closing');
      detail.classList.add('is-closing');
      detail.classList.remove('is-scroll-ready', 'is-close-icon-ready');
      setDetailCloseIconState(false);
      detail.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('polish-detail-opening');
      restoreDetailReturnPosition();
      detailCloseTimer = setTimeout(() => {
        finishCloseDetail(pushState);
      }, detailCloseExitMs);
    }

    function openDetail(slug, pushState) {
      const item = itemsBySlug.get(slug);
      if (!item) return false;
      if (detailCloseTimer) {
        clearTimeout(detailCloseTimer);
        detailCloseTimer = 0;
      }
      if (detailOpenTimer) {
        clearTimeout(detailOpenTimer);
        detailOpenTimer = 0;
      }
      setDetailNavState('entering');
      if (!detail.classList.contains('is-open') && !detail.classList.contains('is-closing')) {
        captureDetailReturnPosition();
      }
      const title = escapeHtml(item.title || 'Untitled');
      const meta = escapeHtml(item.meta || 'Project');
      const summary = escapeHtml(item.summary || '');
      const paragraphs = Array.isArray(item.detail) ? item.detail : String(item.detail || item.summary || '').split(/\n{2,}/);
      const body = paragraphs.filter(Boolean).map((paragraph) => '<p>' + escapeHtml(paragraph).replace(/\n/g, '<br/>') + '</p>').join('');
      const facts = Array.isArray(item.facts) && item.facts.length ? '<span class="polish-project-detail__meta">' + item.facts.map(escapeHtml).join(' / ') + '</span>' : '';
      const externalHref = escapeHtml(item.externalHref || '#projects');
      const externalAttrs = /^https?:/i.test(item.externalHref || '') ? 'target="_blank" rel="noopener noreferrer"' : '';
      const images = item.images || [normalizeProjectImage(item.image, item.image, item.title)];
      const renderDetailMedia = (image, imgIndex) => {
        const ratio = escapeHtml(image.ratio || 'square');
        const containClass = image.fit === 'contain' ? ' polish-project-detail__image--contain' : '';
        const caption = image.caption ? '<figcaption>' + escapeHtml(image.caption) + '</figcaption>' : '';
        const figureClass = 'polish-project-detail__image polish-project-detail__image--' + ratio + containClass;
        if (image.type === 'video') {
          const poster = image.poster ? ' poster="' + escapeHtml(image.poster) + '"' : '';
          return '<figure class="' + figureClass + '"><div class="polish-project-detail__image-frame polish-project-detail__image-frame--video"><video src="' + escapeHtml(image.src) + '"' + poster + ' controls preload="metadata" playsinline aria-label="' + title + ' related video ' + (imgIndex + 1) + '"></video></div>' + caption + '</figure>';
        }
        return '<figure class="' + figureClass + '"><div class="polish-project-detail__image-frame" data-cursor="pointer" data-polish-lightbox-src="' + escapeHtml(image.src) + '" data-polish-lightbox-caption="' + escapeHtml(image.caption || item.title || 'Untitled') + '"><img src="' + escapeHtml(image.src) + '" alt="' + title + ' related image ' + (imgIndex + 1) + '" loading="lazy" decoding="async"/></div>' + caption + '</figure>';
      };
      document.documentElement.classList.add('polish-detail-opening');
      detail.classList.remove('is-closing', 'is-scroll-ready', 'is-close-icon-ready');
      setDetailCloseIconState(false);
      detailContent.innerHTML = '<div class="polish-project-detail__hero">' +
        '<div><h2 class="polish-project-detail__title">' + title + '</h2><span class="polish-project-detail__meta">' + meta + '</span>' +
        facts + '<p class="polish-project-detail__lead">' + summary + '</p><div class="polish-project-detail__body-wrap"><div id="polish-project-detail-body" class="polish-project-detail__body">' + body + '</div><div class="polish-project-detail__body-scrollbar" role="scrollbar" aria-hidden="true" aria-controls="polish-project-detail-body" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="-1"><span></span></div></div>' +
        '<div class="polish-project-detail__actions"><a class="polish-project-detail__link" href="' + externalHref + '" ' + externalAttrs + ' data-cursor="pointer">Visit external link</a></div></div></div>' +
        '<div class="polish-project-detail__gallery">' + images.map(renderDetailMedia).join('') + '</div>';
      updateDetailNavGutter();
      detailScroll.scrollTop = 0;
      document.documentElement.classList.add('polish-detail-open');
      detail.classList.add('is-open');
      detail.setAttribute('aria-hidden', 'false');
      detail.classList.add('is-scroll-ready');
      requestAnimationFrame(() => {
        if (!detail.classList.contains('is-open')) return;
        detail.classList.add('is-close-icon-ready');
        setDetailCloseIconState(true);
      });
      setTimeout(() => {
        if (!detail.classList.contains('is-open')) return;
        detail.classList.add('is-close-icon-ready');
        setDetailCloseIconState(true);
      }, 40);
      detailOpenTimer = setTimeout(() => {
        detailOpenTimer = 0;
        if (!detail.classList.contains('is-open') || detail.classList.contains('is-closing')) return;
        document.documentElement.classList.remove('polish-detail-opening');
        setDetailNavState('open');
      }, 320);
      try {
        detailScroll.focus({ preventScroll: true });
      } catch {
        detailScroll.focus();
      }
      setupTitleEntrance(detailContent, true);
      const bodyEl = detail.querySelector('.polish-project-detail__body');
      if (bodyEl) {
        bodyEl.addEventListener('scroll', updateTextScrollCue, { passive: true });
        setupTextScrollControl(bodyEl);
      }
      buildDetailNavMaterialReflection();
      requestAnimationFrame(updateTextScrollCue);
      requestAnimationFrame(updateDetailNavMaterialReflection);
      setTimeout(updateTextScrollCue, 250);
      setTimeout(updateDetailNavMaterialReflection, 260);
      if (pushState && location.hash !== '#work-' + slug) history.pushState(null, '', '#work-' + slug);
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

    function render(direction, animate) {
      const start = page * pageSize;
      const visible = items.slice(start, start + pageSize);
      if (animate) {
        animateGalleryTilesOut(direction || 1);
        animatePixelWipe(direction || 1);
      }
      grid.classList.remove('is-page-entering');
      if (!animate) grid.classList.add('is-changing');
      setTimeout(() => {
        unobserveRandomGridTiles();
        grid.innerHTML = visible.map((item, offset) => {
          const number = String(start + offset + 1).padStart(2, '0');
          const href = '#work-' + escapeHtml(item.slug);
          const title = escapeHtml(item.title || 'Untitled');
          const meta = escapeHtml(item.meta || 'Link');
          const summary = escapeHtml(item.summary || item.description || 'A short project note with a direct path to the full work.');
          const enterX = ((offset % 3) - 1) * 18;
          const enterY = Math.floor(offset / 3) * 10;
          const maskId = 'polish-random-grid-' + page + '-' + offset + '-' + String(item.slug || start + offset).replace(/[^a-z0-9_-]/gi, '-');
          const media = buildRandomGridMedia(item, title, maskId, start + offset + 1);
          return '<a class="polish-layer-tile" href="' + href + '" data-project-slug="' + escapeHtml(item.slug) + '" data-cursor="pointer" data-polish-layer-tile style="--polish-tile-order:' + offset + ';--polish-enter-x:' + enterX + 'px;--polish-enter-y:' + enterY + 'px">' +
            media +
            '<span class="polish-layer-sheen"></span><span class="polish-layer-lines"></span>' +
            '<span class="polish-layer-caption"><span class="polish-layer-index">' + number + '</span><span class="polish-layer-name">' + title + '</span><span class="polish-layer-meta">' + meta + '</span><span class="polish-layer-summary">' + summary + '</span><span class="polish-layer-link">View project</span></span>' +
            '</a>';
        }).join('');
        count.textContent = String(page + 1).padStart(2, '0') + ' / ' + String(totalPages).padStart(2, '0');
        setGalleryControlsLocked(!!animate);
        showRandomGridTilesImmediately();
        requestAnimationFrame(() => {
          grid.classList.remove('is-changing');
          if (animate) {
            grid.classList.add('is-page-entering');
            animateGalleryTilesIn(direction || 1);
          }
        });
        setTimeout(() => {
          grid.classList.remove('is-page-entering');
          transitioning = false;
          setGalleryControlsLocked(false);
        }, animate ? 780 : 80);
      }, animate ? 260 : 0);
    }

    function setPage(nextPage) {
      if (transitioning || totalPages < 2) return;
      const currentPage = page;
      page = (nextPage + totalPages) % totalPages;
      const direction = page >= currentPage ? 1 : -1;
      transitioning = true;
      setGalleryControlsLocked(true);
      render(direction, true);
    }

    prev.addEventListener('click', (event) => {
      event.preventDefault();
      if (transitioning) return;
      setPage(page - 1);
    });
    next.addEventListener('click', (event) => {
      event.preventDefault();
      if (transitioning) return;
      setPage(page + 1);
    });
    grid.addEventListener('click', (event) => {
      const tile = event.target.closest('[data-polish-layer-tile]');
      if (!tile) return;
      const slug = tile.getAttribute('data-project-slug');
      if (!slug) return;
      event.preventDefault();
      detailReturnFocus = tile;
      openDetail(slug, true);
    });
    detail.addEventListener('polish:request-close', () => closeDetail(true));
    detail.addEventListener('click', (event) => {
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
    lightbox.addEventListener('click', closeLightbox);
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (lightbox.classList.contains('is-open')) closeLightbox();
      else if (detail.classList.contains('is-open')) closeDetail(true);
    });
    window.addEventListener('resize', scheduleDetailNavMaterialReflection, { passive: true });
    window.addEventListener('resize', updateDetailNavGutter, { passive: true });
    window.addEventListener('hashchange', syncDetailFromHash);

    render(1, false);
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
    setupHeroScrollMotion(config);
    disableStatementBodyMotion();
    disableContactBodyMotion();
    setupParallax(config);
    setupElasticText(config);
    setupTitleEntrance(document, false);
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
    normalizeHeroTitle();
    applySiteArchitecture();
    setupTitleEntrance(document, false);
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
