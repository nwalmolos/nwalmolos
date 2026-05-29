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
    galleryReplacement: true,
    galleryPageSize: 'auto',
    galleryRevealEffect: 'randomGrid',
    galleryMinPages: 2,
    galleryDemoPlaceholders: true,
    diffusionBoot: false,
    projectsUrl: PROJECTS_URL,
    progressiveBlur: false,
    progressiveBlurStrength: 1,
    respectReducedMotion: false
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
      .polish-scroll-indicator {
        position: absolute !important;
        left: 50% !important;
        right: auto !important;
        top: auto !important;
        bottom: clamp(54px, 9vh, 96px) !important;
        transform: translate3d(-50%, 0, 0) !important;
        opacity: .54 !important;
        z-index: 12;
        width: max-content;
        max-width: 120px;
      }
      .polish-scroll-indicator a {
        align-items: center !important;
        gap: 6px !important;
        text-align: center;
        transform: none !important;
      }
      .polish-scroll-indicator span {
        font-size: 9px !important;
        letter-spacing: .24em !important;
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
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='3' fill='white'/%3E%3C/svg%3E") 8 8, auto !important;
      }
      @media (hover: none), (pointer: coarse) {
        .polish-hide-system-cursor,
        .polish-hide-system-cursor *,
        html:not(.polish-custom-cursor-ready) main.cursor-none,
        html:not(.polish-custom-cursor-ready) main.cursor-none * {
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
        display: none !important;
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
        box-shadow: 0 0 10px rgba(255,255,255,.26), 0 0 2px rgba(255,255,255,.76);
        transform: translate3d(-80px, -80px, 0) scale(.9);
        transition: opacity .16s ease, box-shadow .16s ease;
        mix-blend-mode: screen;
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
      .polish-click-cursor.is-active {
        opacity: 1;
        box-shadow: 0 0 20px rgba(255,255,255,.34), 0 0 4px rgba(255,255,255,.9);
      }
      .polish-click-ring {
        position: fixed;
        left: 0;
        top: 0;
        --polish-ring-size: 35px;
        --polish-ring-dot: 3px;
        --polish-ring-radius: 17.5px;
        --polish-ring-dot-half: 1.5px;
        --polish-ring-dot-offset: -1.5px;
        --polish-ring-origin-y: 19px;
        width: var(--polish-ring-size);
        height: var(--polish-ring-size);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9997;
        opacity: 0;
        border: 1px solid rgba(255,255,255,.32);
        box-shadow: 0 0 14px rgba(255,255,255,.08), inset 0 0 8px rgba(255,255,255,.03);
        transform: translate3d(-90px, -90px, 0) scale(.92);
        transition: opacity .2s ease, border-color .18s ease, box-shadow .18s ease, width .18s ease, height .18s ease;
        mix-blend-mode: screen;
        will-change: transform, opacity;
      }
      .polish-click-ring.is-visible {
        opacity: .58;
      }
      .polish-click-ring.is-active {
        opacity: .86;
        border-color: rgba(255,255,255,.58);
        box-shadow: 0 0 18px rgba(255,255,255,.13), inset 0 0 9px rgba(255,255,255,.045);
      }
      .polish-click-ring::after {
        content: "";
        position: absolute;
        left: 50%;
        top: var(--polish-ring-dot-offset);
        width: var(--polish-ring-dot);
        height: var(--polish-ring-dot);
        margin-left: var(--polish-ring-dot-offset);
        border-radius: 50%;
        opacity: 0;
        background: rgba(255,255,255,.92);
        box-shadow: 0 0 6px rgba(255,255,255,.35);
        transform: rotate(0deg);
        transform-origin: var(--polish-ring-dot-half) var(--polish-ring-origin-y);
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
        to {
          transform: rotate(360deg);
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
      .polish-gallery-section {
        position: relative;
        z-index: 10;
        padding: clamp(128px, 13vw, 160px) 24px;
      }
      .polish-gallery-shell {
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
        margin: 0;
        max-width: 780px;
        font-size: clamp(40px, 5.1vw, 64px);
        font-weight: 700;
        line-height: 1.08;
        letter-spacing: 0;
        color: rgba(255,255,255,.90);
        text-shadow: 0 0 26px rgba(255,255,255,.08);
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
      .polish-gallery-transition-layer {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 120;
        overflow: visible;
        contain: layout style;
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
        transform: none !important;
        transition: none !important;
      }
      .polish-gallery-grid.is-changing .polish-layer-tile {
        opacity: 0;
      }
      .polish-layer-tile:hover {
        border-color: rgba(255,255,255,.10);
        background: rgba(255,255,255,.025);
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
        transform: none !important;
        transition: none !important;
        filter: saturate(.9) contrast(1.04) brightness(.78);
      }
      .polish-layer-tile:hover .polish-layer-media {
        filter: saturate(.9) contrast(1.04) brightness(.78);
      }
      .polish-random-grid-media {
        display: block;
      }
      .polish-random-grid-media image {
        filter: saturate(.9) contrast(1.04) brightness(.78);
      }
      .polish-layer-tile:hover .polish-random-grid-media image {
        filter: saturate(.9) contrast(1.04) brightness(.78);
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
        transform: none !important;
      }
      .polish-layer-index {
        display: block;
        margin-bottom: 8px;
        font: 10px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        letter-spacing: .24em;
        color: rgba(255,255,255,.34);
      }
      .polish-layer-name {
        display: block;
        font-size: clamp(16px, 1.6vw, 22px);
        line-height: 1.05;
        color: rgba(255,255,255,.86);
        overflow-wrap: anywhere;
      }
      .polish-layer-meta {
        display: block;
        margin-top: 8px;
        font: 10px/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        letter-spacing: .16em;
        text-transform: uppercase;
        color: rgba(255,255,255,.36);
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
        transition: none !important;
      }
      .polish-layer-tile:hover .polish-layer-summary,
      .polish-layer-tile:focus-visible .polish-layer-summary {
        max-height: 2.9em;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        color: rgba(255,255,255,.66);
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
      }
      .polish-layer-link::after {
        content: "";
        width: 16px;
        height: 1px;
        background: currentColor;
        opacity: .72;
        transform-origin: left center;
        transition: none !important;
      }
      .polish-layer-tile:hover .polish-layer-link::after {
        transform: none;
      }
      .polish-project-detail {
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
      .polish-project-detail__scroll {
        height: 100%;
        overflow: auto;
        padding: clamp(72px, 8vw, 112px) clamp(18px, 5vw, 72px) clamp(110px, 12vw, 150px);
      }
      .polish-project-detail__shell {
        width: min(1240px, 100%);
        margin: 0 auto;
      }
      .polish-project-detail__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: clamp(34px, 6vw, 72px);
      }
      .polish-project-detail__eyebrow,
      .polish-project-detail__meta,
      .polish-project-detail__link,
      .polish-project-detail__back {
        font: 11px/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        letter-spacing: .22em;
        text-transform: uppercase;
      }
      .polish-project-detail__eyebrow {
        color: rgba(255,255,255,.34);
      }
      .polish-project-detail__back {
        position: relative;
        z-index: 3;
        flex: 0 0 auto;
        min-width: 42px;
        height: 42px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,.18);
        background: rgba(255,255,255,.04);
        color: rgba(255,255,255,.72);
        display: inline-grid;
        place-items: center;
        -webkit-backdrop-filter: blur(14px);
        backdrop-filter: blur(14px);
        transition: border-color .22s ease, background-color .22s ease, color .22s ease;
      }
      .polish-project-detail__back:hover {
        border-color: rgba(255,255,255,.42);
        background: rgba(255,255,255,.08);
        color: rgba(255,255,255,.96);
      }
      .polish-project-detail__hero {
        display: block;
        max-width: 920px;
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
        max-height: clamp(210px, 32vh, 340px);
        overflow: auto;
        padding: 0 14px 0 0;
        color: rgba(255,255,255,.54);
        font-size: 15px;
        line-height: 1.9;
        -webkit-mask-image: linear-gradient(to bottom, #000 82%, rgba(0,0,0,.2));
        mask-image: linear-gradient(to bottom, #000 82%, rgba(0,0,0,.2));
        transition: max-height .28s ease, -webkit-mask-image .28s ease, mask-image .28s ease;
      }
      .polish-project-detail__body-wrap {
        position: relative;
        max-width: 780px;
      }
      .polish-project-detail__body-wrap::after {
        content: "";
        position: absolute;
        left: 0;
        right: 10px;
        bottom: 0;
        height: 54px;
        pointer-events: none;
        background: linear-gradient(180deg, transparent, rgba(3,4,6,.72));
        opacity: 0;
        transition: opacity .22s ease;
      }
      .polish-project-detail__body-cue {
        position: absolute;
        right: 20px;
        bottom: 8px;
        width: 16px;
        height: 16px;
        pointer-events: none;
        opacity: 0;
        color: rgba(255,255,255,.42);
        transition: opacity .22s ease, transform .22s ease;
        animation: polish-text-scroll-cue 1.35s ease-in-out infinite;
      }
      .polish-project-detail__body-wrap.has-more::after,
      .polish-project-detail__body-wrap.has-more .polish-project-detail__body-cue {
        opacity: 1;
      }
      .polish-project-detail__body-wrap.is-at-end::after,
      .polish-project-detail__body-wrap.is-at-end .polish-project-detail__body-cue {
        opacity: 0;
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
        max-height: clamp(210px, 32vh, 340px);
        -webkit-mask-image: none;
        mask-image: none;
      }
      .polish-project-detail__body p {
        margin: 0 0 1.15em;
      }
      .polish-project-detail__body::-webkit-scrollbar {
        width: 4px;
      }
      .polish-project-detail__body::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,.18);
        border-radius: 999px;
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
        margin-top: clamp(42px, 7vw, 88px);
      }
      .polish-project-detail__image {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      .polish-project-detail__image-frame {
        flex: 1 1 auto;
        min-height: 0;
        overflow: hidden;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(255,255,255,.03);
        cursor: none;
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
      .polish-project-detail__image-frame img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scale(1.04);
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
        transition: opacity .24s ease;
      }
      .polish-lightbox.is-open {
        opacity: 1;
        pointer-events: auto;
      }
      .polish-lightbox img {
        max-width: min(94vw, 1360px);
        max-height: 82vh;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 26px 90px rgba(0,0,0,.44);
      }
      .polish-lightbox__caption {
        margin-top: 16px;
        max-width: min(760px, 90vw);
        text-align: center;
        font: 12px/1.6 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        letter-spacing: .08em;
        color: rgba(255,255,255,.56);
      }
      .polish-project-detail.is-open .polish-project-detail__title,
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
      @media (max-width: 860px) {
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
      @media (max-width: 860px) {
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
          grid-template-columns: 1fr;
        }
      }
      [data-polish-elastic] {
        will-change: translate, scale;
        transform-origin: 50% 52%;
      }
      .polish-scroll-indicator,
      .polish-scroll-indicator * {
        will-change: auto !important;
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

  function setupNav(config) {
    const nav = document.querySelector('nav');
    if (!nav) return;
    keepNavVisuals(config);

    if (!config.separateContactCta) return;
    const links = Array.from(nav.querySelectorAll('a'));
    const cta = links.find((link) => /get in touch|email me|start a project/i.test((link.textContent || '').trim()));
    const email = document.querySelector('a[href^="mailto:"]')?.getAttribute('href') || 'mailto:hello@yourdomain.com';
    if (cta) {
      cta.textContent = config.ctaText || 'Email Me';
      cta.setAttribute('href', email);
      cta.setAttribute('aria-label', 'Email directly');
    }
  }

  function setupScrollIndicator(config) {
    if (!config.fixScrollIndicator) return;
    const scrollLink = Array.from(document.querySelectorAll('a[href="#about"]'))
      .find((link) => /scroll/i.test(link.textContent || ''));
    const holder = scrollLink && scrollLink.closest('.absolute');
    if (!holder) return;
    const hero = holder.closest('section');
    if (hero && holder.parentElement !== hero) hero.appendChild(holder);
    holder.className = 'polish-scroll-indicator';
    holder.dataset.polishNoElastic = 'true';
    scrollLink.dataset.polishNoElastic = 'true';
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
    window.addEventListener('resize', positionSafely, { passive: true });
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
    if (!config.clickHover || matchMedia('(pointer: coarse)').matches) return;
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
      ringState.x += (pointer.x - ringState.x) * 0.18;
      ringState.y += (pointer.y - ringState.y) * 0.18;
      const ringSize = sizes.ring * (pointer.active ? sizes.activeScale : 1);
      const ringDot = sizes.ringDot * (pointer.active ? sizes.activeScale : 1);
      const ringDotHalf = ringDot / 2;
      ring.style.setProperty('--polish-ring-size', ringSize + 'px');
      ring.style.setProperty('--polish-ring-dot', ringDot + 'px');
      ring.style.setProperty('--polish-ring-radius', (ringSize / 2) + 'px');
      ring.style.setProperty('--polish-ring-dot-half', ringDotHalf + 'px');
      ring.style.setProperty('--polish-ring-dot-offset', (-ringDotHalf) + 'px');
      ring.style.setProperty('--polish-ring-origin-y', (ringSize / 2 + ringDotHalf) + 'px');
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
      ring.classList.add('is-priming', 'is-handoff-hidden');
      ringState.x = pointer.x;
      ringState.y = pointer.y;
      ringState.ready = true;
      document.documentElement.classList.add('polish-custom-cursor-ready', 'polish-hide-system-cursor');
      updateFromElement(source || document.elementFromPoint(pointer.x, pointer.y));
      requestAnimationFrame(() => {
        cursor.classList.remove('is-priming');
        ring.classList.remove('is-priming');
        setTimeout(() => {
          ring.classList.remove('is-handoff-hidden');
        }, 80);
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
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      lastPointerMoveAt = performance.now();
      if (!customCursorReady) {
        scheduleInitialHandoff(event.target);
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
      if (performance.now() - lastPointerMoveAt > 80) {
        pointer.active = false;
        setTarget(null);
        paintCursor();
      }
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
    if (!config.magneticButtons || matchMedia('(pointer: coarse)').matches) return;
    const selector = 'a, button, [role="button"], [data-cursor="pointer"], summary';
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
      state.x += (state.tx - state.x) * 0.32;
      state.y += (state.ty - state.y) * 0.32;
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

    document.addEventListener('pointermove', (event) => {
      const target = event.target && event.target.closest && event.target.closest(selector);
      if (!target || !document.body.contains(target)) {
        if (active) {
          release(active);
          active = null;
        }
        return;
      }
      if (active && active !== target) release(active);
      active = target;

      const rect = target.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width * 0.5);
      const dy = event.clientY - (rect.top + rect.height * 0.5);
      const sizeFactor = clamp(Math.min(rect.width, rect.height) / 80, 0.55, 1);
      const maxX = 14 * sizeFactor;
      const maxY = 10 * sizeFactor;
      tweenTo(target, clamp(dx * 0.16, -maxX, maxX), clamp(dy * 0.2, -maxY, maxY));
    }, { passive: true });

    document.addEventListener('pointerleave', () => {
      release(active);
      active = null;
    }, { passive: true });
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
      'main section h1',
      'main section h1 span[aria-label]',
      'main section h2',
      'main section h2 span[aria-label]',
      '#projects [data-cursor="pointer"] h3',
      '.polish-gallery-title',
      '.polish-layer-name'
    ].join(',');
    const seen = new Set();
    const groups = Array.from(document.querySelectorAll('nav, main > section, footer'));

    function getDepth(el) {
      if (el.matches('h1, h1 span[aria-label]')) return 0.92;
      if (el.matches('h2, h2 span[aria-label]')) return 0.78;
      if (el.matches('h3, .polish-layer-name')) return 0.50;
      if (el.matches('.polish-gallery-title')) return 0.70;
      return 0.46;
    }

    return Array.from(document.querySelectorAll(selector)).filter((el) => {
      if (seen.has(el) || !el.textContent || !el.textContent.trim()) return false;
      if (el.closest('footer')) return false;
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

    function updateTargets() {
      const scrollY = window.scrollY || 0;
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

  function makeGalleryImage(item, index) {
    const accents = [
      ['#10131a', '#5057ff', '#ff365d'],
      ['#07090d', '#26d3b4', '#b7d1ff'],
      ['#0c0b12', '#8e5cff', '#f0f0ff'],
      ['#090b10', '#ff6848', '#324cff'],
      ['#080808', '#d6d6d6', '#585858'],
      ['#0a0f12', '#42b6ff', '#dff8ff'],
      ['#0b0810', '#e94691', '#533dff'],
      ['#070a08', '#a7ff75', '#d7ffe0']
    ];
    const palette = accents[index % accents.length];
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
      { title: 'Contact Path', short: 'MAIL', meta: 'Link', externalHref: 'mailto:hello@yourdomain.com', summary: 'A direct route for collaboration, feedback, or project conversations.', detail: 'A contact flow that keeps the final action direct. The page avoids a heavy form and gives the visitor a clear route after reviewing visual work.' },
      { title: 'Motion Index', short: 'IDX', meta: 'Grid', externalHref: 'https://tympanus.net/codrops/tag/grid/', summary: 'A paged visual index where each tile behaves like a moving layer.', detail: 'A navigation pattern for many small works. The index uses thumbnails first, then short context, then deeper project detail so the browsing rhythm stays fast.' },
      { title: 'Interface Pulse', short: 'PUL', meta: 'Signal', externalHref: 'https://tympanus.net/codrops/tag/mouse/', summary: 'Small interaction pulses that make links feel tactile without noise.', detail: 'A cursor and click feedback study. The treatment is restrained: visual signals are noticeable enough to guide interaction but short enough not to compete with the work.' },
      { title: 'Release Frame', short: 'REL', meta: 'Preview', externalHref: 'https://pages.github.com/', summary: 'A framed checkpoint for testing layout, motion, links, and assets.', detail: 'A project detail frame for pre-release review. It collects layout notes, visual assets, and external destinations into one place before publishing.' },
      { title: 'Archive Light', short: 'ARC', meta: 'Study', externalHref: 'https://tympanus.net/codrops/tag/case-study/', summary: 'Low-key visual treatments for reflective, gallery-like presentation.', detail: 'A quiet archive treatment for visual work. It uses deep black, mild glow, and structured writing to keep the work legible without flattening its atmosphere.' },
      { title: 'Build Contact', short: 'CTA', meta: 'Next', externalHref: '#contact', summary: 'A final call-to-action route after browsing the visual index.', detail: 'A conversion-oriented ending for a portfolio journey. It connects the project browsing experience back to a clear collaboration path.' }
    ];
  }

  function normalizeProjectImage(value, fallbackSrc, fallbackCaption) {
    if (typeof value === 'string') {
      return { src: value, ratio: 'square', fit: 'cover', caption: fallbackCaption || '' };
    }
    const image = value && typeof value === 'object' ? value : {};
    return {
      src: image.src || fallbackSrc,
      ratio: /^(wide|portrait|square)$/.test(image.ratio || '') ? image.ratio : 'square',
      fit: image.fit === 'contain' ? 'contain' : 'cover',
      caption: image.caption || fallbackCaption || ''
    };
  }

  function resolveGalleryPageSize(config, itemCount) {
    if (config.galleryPageSize !== 'auto') return clamp(Number(config.galleryPageSize) || 6, 2, 8);
    if (itemCount <= 4) return itemCount || 1;
    if (window.innerWidth < 560) return 3;
    if (window.innerWidth < 860) return 4;
    return 6;
  }

  function normalizeGalleryItems(config, projectItems) {
    const source = Array.isArray(projectItems) && projectItems.length ? projectItems : getGalleryItems(config);
    return source.map((item, index) => {
      const base = Object.assign({}, item);
      base.slug = slugify(base.slug || base.title, 'project-' + (index + 1));
      const cover = normalizeProjectImage(base.image || base.cover, makeGalleryImage(base, index), base.title);
      base.image = cover.src;
      base.imageRatio = cover.ratio;
      base.externalHref = base.externalHref || (/^https?:|^mailto:/i.test(base.href || '') ? base.href : '#projects');
      base.detail = base.detail || base.summary || ['A project detail page with more context, related visuals, and a link to the full work.'];
      const images = Array.isArray(base.images) && base.images.length ? base.images : [
        cover,
        { src: makeGalleryImage(base, index + 12), ratio: 'wide', caption: 'Extended visual frame' },
        { src: makeGalleryImage(base, index + 24), ratio: 'portrait', caption: 'Motion study crop' }
      ];
      base.images = images.map((image, imageIndex) => normalizeProjectImage(image, imageIndex === 0 ? base.image : makeGalleryImage(base, index + imageIndex * 12), imageIndex === 0 ? 'Cover image' : 'Related image'));
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

  function setupGalleryReplacement(config, projectItems) {
    if (!config.galleryReplacement) return;
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
    section.removeAttribute('style');
    section.innerHTML = '<div class="polish-gallery-shell">' +
      '<div class="polish-gallery-head">' +
      '<div><span class="polish-gallery-kicker">03 — Gallery</span><h2 class="polish-gallery-title">Selected<br/><span class="polish-gallery-title-muted">visual paths</span></h2></div>' +
      '<div class="polish-gallery-controls">' +
      '<button class="polish-gallery-button" type="button" data-polish-gallery-prev aria-label="Previous page"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<span class="polish-gallery-count" data-polish-gallery-count></span>' +
      '<button class="polish-gallery-button" type="button" data-polish-gallery-next aria-label="Next page"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '</div></div><div class="polish-gallery-grid" data-polish-gallery-grid></div></div>';

    const grid = section.querySelector('[data-polish-gallery-grid]');
    const count = section.querySelector('[data-polish-gallery-count]');
    const prev = section.querySelector('[data-polish-gallery-prev]');
    const next = section.querySelector('[data-polish-gallery-next]');
    const transitionLayer = document.createElement('div');
    transitionLayer.className = 'polish-gallery-transition-layer';
    transitionLayer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(transitionLayer);
    const detail = document.createElement('section');
    detail.className = 'polish-project-detail';
    detail.setAttribute('aria-hidden', 'true');
    detail.innerHTML = '<div class="polish-project-detail__scroll"><div class="polish-project-detail__shell">' +
      '<div class="polish-project-detail__top"><span class="polish-project-detail__eyebrow">Project detail</span>' +
      '<button class="polish-project-detail__back" type="button" data-polish-detail-close data-cursor="pointer" aria-label="Close project detail"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></button></div>' +
      '<div data-polish-detail-content></div></div></div>';
    document.body.appendChild(detail);
    const lightbox = document.createElement('div');
    lightbox.className = 'polish-lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = '<div><img alt="Expanded project image"/><div class="polish-lightbox__caption"></div></div>';
    document.body.appendChild(lightbox);
    const detailContent = detail.querySelector('[data-polish-detail-content]');
    const detailScroll = detail.querySelector('.polish-project-detail__scroll');
    const lightboxImage = lightbox.querySelector('img');
    const lightboxCaption = lightbox.querySelector('.polish-lightbox__caption');
    let transitioning = false;
    const revealTimers = new WeakMap();

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
      const gridCount = 24;
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
        '<image href="' + escapeHtml(item.image) + '" width="100" height="100" preserveAspectRatio="xMidYMid slice" mask="url(#' + maskId + ')"></image>' +
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

    function showRandomGridTilesImmediately() {
      const tiles = Array.from(grid.querySelectorAll('[data-polish-layer-tile]'));
      tiles.forEach((tile) => {
        const oldTimer = revealTimers.get(tile);
        if (oldTimer) clearTimeout(oldTimer);
        tile.classList.remove('is-random-grid-revealing');
        tile.classList.add('is-random-grid-revealed');
        tile.querySelectorAll('.polish-random-grid-cell').forEach((cell) => {
          cell.getAnimations().forEach((animation) => animation.cancel());
          cell.style.opacity = '';
          cell.setAttribute('opacity', '1');
        });
      });
    }

    function revealRandomGridTiles() {
      Array.from(grid.querySelectorAll('[data-polish-layer-tile]')).forEach(revealRandomGridTile);
    }

    function openLightbox(src, caption) {
      if (!src) return;
      lightboxImage.src = src;
      lightboxCaption.textContent = caption || '';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      setTimeout(() => {
        if (!lightbox.classList.contains('is-open')) lightboxImage.removeAttribute('src');
      }, 260);
    }

    function updateTextScrollCue() {
      const body = detail.querySelector('.polish-project-detail__body');
      const wrap = detail.querySelector('.polish-project-detail__body-wrap');
      if (!body || !wrap) return;
      const hasMore = body.scrollHeight > body.clientHeight + 6;
      const atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 8;
      wrap.classList.toggle('has-more', hasMore);
      wrap.classList.toggle('is-at-end', !hasMore || atEnd);
    }

    function closeDetail(pushState) {
      detail.classList.remove('is-open');
      detail.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('polish-detail-open');
      if (pushState && location.hash.indexOf('#work-') === 0) {
        history.pushState(null, '', location.pathname + location.search);
      }
    }

    function openDetail(slug, pushState) {
      const item = itemsBySlug.get(slug);
      if (!item) return false;
      const title = escapeHtml(item.title || 'Untitled');
      const meta = escapeHtml(item.meta || 'Project');
      const summary = escapeHtml(item.summary || '');
      const paragraphs = Array.isArray(item.detail) ? item.detail : String(item.detail || item.summary || '').split(/\n{2,}/);
      const body = paragraphs.filter(Boolean).map((paragraph) => '<p>' + escapeHtml(paragraph).replace(/\n/g, '<br/>') + '</p>').join('');
      const facts = Array.isArray(item.facts) && item.facts.length ? '<span class="polish-project-detail__meta">' + item.facts.map(escapeHtml).join(' / ') + '</span>' : '';
      const externalHref = escapeHtml(item.externalHref || '#projects');
      const externalAttrs = /^https?:/i.test(item.externalHref || '') ? 'target="_blank" rel="noopener noreferrer"' : '';
      const images = item.images || [normalizeProjectImage(item.image, item.image, item.title)];
      detailContent.innerHTML = '<div class="polish-project-detail__hero">' +
        '<div><h2 class="polish-project-detail__title">' + title + '</h2><span class="polish-project-detail__meta">' + meta + '</span>' +
        facts + '<p class="polish-project-detail__lead">' + summary + '</p><div class="polish-project-detail__body-wrap"><div class="polish-project-detail__body">' + body + '</div><span class="polish-project-detail__body-cue" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>' +
        '<div class="polish-project-detail__actions"><a class="polish-project-detail__link" href="' + externalHref + '" ' + externalAttrs + ' data-cursor="pointer">Visit external link</a></div></div></div>' +
        '<div class="polish-project-detail__gallery">' + images.map((image, imgIndex) => (
          '<figure class="polish-project-detail__image polish-project-detail__image--' + escapeHtml(image.ratio || 'square') + (image.fit === 'contain' ? ' polish-project-detail__image--contain' : '') + '"><div class="polish-project-detail__image-frame" data-polish-lightbox-src="' + escapeHtml(image.src) + '" data-polish-lightbox-caption="' + escapeHtml(image.caption || title) + '"><img src="' + escapeHtml(image.src) + '" alt="' + title + ' related image ' + (imgIndex + 1) + '" loading="lazy" decoding="async"/></div>' + (image.caption ? '<figcaption>' + escapeHtml(image.caption) + '</figcaption>' : '') + '</figure>'
        )).join('') + '</div>';
      detailScroll.scrollTop = 0;
      detail.classList.add('is-open');
      detail.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('polish-detail-open');
      const bodyEl = detail.querySelector('.polish-project-detail__body');
      if (bodyEl) bodyEl.addEventListener('scroll', updateTextScrollCue, { passive: true });
      requestAnimationFrame(updateTextScrollCue);
      setTimeout(updateTextScrollCue, 250);
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

    function render(direction, animate) {
      const start = page * pageSize;
      const visible = items.slice(start, start + pageSize);
      if (animate) animateRepeatingTransition(direction || 1);
      grid.classList.remove('is-page-entering');
      grid.classList.add('is-changing');
      setTimeout(() => {
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
        prev.disabled = totalPages < 2;
        next.disabled = totalPages < 2;
        showRandomGridTilesImmediately();
        requestAnimationFrame(() => {
          grid.classList.remove('is-changing');
          if (animate) grid.classList.add('is-page-entering');
        });
        setTimeout(() => {
          grid.classList.remove('is-page-entering');
          transitioning = false;
        }, animate ? 980 : 80);
      }, 0);
    }

    function setPage(nextPage) {
      if (transitioning || totalPages < 2) return;
      const currentPage = page;
      page = (nextPage + totalPages) % totalPages;
      const direction = page >= currentPage ? 1 : -1;
      transitioning = true;
      render(direction, true);
    }

    prev.addEventListener('click', () => setPage(page - 1));
    next.addEventListener('click', () => setPage(page + 1));
    grid.addEventListener('click', (event) => {
      const tile = event.target.closest('[data-polish-layer-tile]');
      if (!tile) return;
      const slug = tile.getAttribute('data-project-slug');
      if (!slug) return;
      event.preventDefault();
      openDetail(slug, true);
    });
    detail.addEventListener('click', (event) => {
      if (event.target.closest('[data-polish-detail-close]')) closeDetail(true);
      const lightboxTarget = event.target.closest('[data-polish-lightbox-src]');
      if (lightboxTarget) openLightbox(lightboxTarget.getAttribute('data-polish-lightbox-src'), lightboxTarget.getAttribute('data-polish-lightbox-caption'));
    });
    lightbox.addEventListener('click', closeLightbox);
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (lightbox.classList.contains('is-open')) closeLightbox();
      else if (detail.classList.contains('is-open')) closeDetail(true);
    });
    window.addEventListener('hashchange', syncDetailFromHash);
    grid.addEventListener('mousemove', (event) => {
      const tile = event.target.closest('[data-polish-layer-tile]');
      if (!tile) return;
      grid.querySelectorAll('[data-polish-layer-tile].is-polish-hover').forEach((node) => {
        if (node !== tile) node.classList.remove('is-polish-hover');
      });
      tile.classList.add('is-polish-hover');
      const rect = tile.getBoundingClientRect();
      const x = clamp(event.clientX - rect.left, 0, rect.width);
      const y = clamp(event.clientY - rect.top, 0, rect.height);
      const nx = (x / rect.width - 0.5) * 2;
      const ny = (y / rect.height - 0.5) * 2;
      tile.style.setProperty('--polish-tile-x', (nx * 100).toFixed(2) + '%');
      tile.style.setProperty('--polish-tile-y', (ny * 100).toFixed(2) + '%');
      tile.style.setProperty('--polish-tile-shift-x', (nx * 18).toFixed(2) + 'px');
      tile.style.setProperty('--polish-tile-shift-y', (ny * 18).toFixed(2) + 'px');
    }, { passive: true });
    grid.addEventListener('mouseleave', () => {
      grid.querySelectorAll('[data-polish-layer-tile]').forEach((tile) => {
        tile.classList.remove('is-polish-hover');
        tile.style.setProperty('--polish-tile-x', '0px');
        tile.style.setProperty('--polish-tile-y', '0px');
        tile.style.setProperty('--polish-tile-shift-x', '0px');
        tile.style.setProperty('--polish-tile-shift-y', '0px');
      });
    }, { passive: true });
    grid.addEventListener('focusin', (event) => {
      const tile = event.target.closest('[data-polish-layer-tile]');
      if (tile) tile.classList.add('is-polish-hover');
    });
    grid.addEventListener('focusout', (event) => {
      const tile = event.target.closest('[data-polish-layer-tile]');
      if (tile) tile.classList.remove('is-polish-hover');
    });

    render(1, false);
    syncDetailFromHash();
  }

  function collectParallaxItems(maxParallax) {
    const items = [];
    const hero = document.querySelector('main > section');
    if (hero) {
      Array.from(hero.querySelectorAll(':scope > .absolute')).slice(0, 6).forEach((el, index) => {
        if (el.closest('.polish-scroll-indicator') || el.closest('[data-polish-no-elastic]')) return;
        items.push({ el, speed: [-0.16, 0.10, -0.08, 0.14, -0.12, 0.07][index] || 0.08 });
      });
      const titleBlock = Array.from(hero.querySelectorAll('div'))
        .find((node) => node.className && String(node.className).includes('relative') && String(node.className).includes('z-[10]'));
      if (titleBlock) items.push({ el: titleBlock, speed: -0.045 });
    }

    document.querySelectorAll('main > section').forEach((section, index) => {
      if (section === hero) return;
      if (section.id === 'contact') return;
      items.push({ el: section, speed: index % 2 === 0 ? -0.035 : 0.028 });
    });

    document.querySelectorAll('#projects [data-cursor="pointer"]').forEach((row, index) => {
      items.push({ el: row, speed: 0.018 + index * 0.006 });
    });

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

  function start(config, projectItems) {
    if (!config.enabled) return;
    injectStyles();
    setupNav(config);
    setupScrollIndicator(config);
    removeMarqueeStrip(config);
    setupClickHover(config);
    setupMagneticButtons(config);
    setupGalleryReplacement(config, projectItems);
    setupParallax(config);
    setupElasticText(config);
    setupNavReflection(config);
    document.querySelectorAll('.polish-progressive-blur').forEach((node) => node.remove());
  }

  if (DEFAULTS.bootSettle) installBootSettle(DEFAULTS.bootSettleMs, DEFAULTS.diffusionBoot);

  window.addEventListener('load', function () {
    setTimeout(function () {
      loadConfig().then((config) => {
        if (config.bootSettle) installBootSettle(config.bootSettleMs, config.diffusionBoot);
        loadProjectItems(config).then((projectItems) => start(config, projectItems));
      }).catch(() => {});
    }, 1500);
  });
})();
