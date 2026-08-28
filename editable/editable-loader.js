(function () {
  'use strict';

  const LANGUAGES = ['zh', 'en'];
  const CONTENT_GROUPS = ['meta', 'nav', 'hero', 'works', 'trajectory', 'about', 'contact', 'footer'];
  const CONTACT_METHODS = ['email', 'github', 'twitter', 'discord', 'instagram', 'bilibili', 'douban'];
  const text = (value) => typeof value === 'string' ? value : '';
  const trim = (value) => text(value).trim();
  const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
  let lastRawContent = null;
  let lastResolvedContent = null;
  let lastMedia = null;
  let lastVisibility = { modules: {}, fields: {} };
  let applyQueued = false;
  let isApplying = false;
  let contentObserver = null;

  function deepMerge(base, extra) {
    if (Array.isArray(extra)) return clone(extra);
    if (!isObject(extra)) return extra === undefined ? clone(base) : extra;
    const output = isObject(base) ? clone(base) : {};
    Object.keys(extra).forEach((key) => { output[key] = isObject(extra[key]) ? deepMerge(output[key], extra[key]) : clone(extra[key]); });
    return output;
  }

  function listenForEditorSync() {
    let reloadQueued = false;
    const reload = () => {
      if (reloadQueued) return;
      reloadQueued = true;
      setTimeout(() => location.reload(), 60);
    };
    try {
      const channel = new BroadcastChannel('site-content-sync');
      channel.addEventListener('message', (event) => { if (event.data?.type === 'site-content-updated') reload(); });
    } catch {}
    window.addEventListener('storage', (event) => { if (event.key === 'site-content-sync' && event.newValue) reload(); });
  }

  function fetchJson(path) { return fetch(path, { cache: 'no-store' }).then((res) => res.ok ? res.json() : null).catch(() => null); }

  let localSocialIconsReady;
  function loadLocalSocialIcons() {
    if (window.NM_SOCIAL_ICONS) return Promise.resolve(window.NM_SOCIAL_ICONS);
    if (localSocialIconsReady) return localSocialIconsReady;
    localSocialIconsReady = new Promise((resolve) => {
      const existing = document.querySelector('script[data-local-social-icons]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.NM_SOCIAL_ICONS || null), { once: true });
        existing.addEventListener('error', () => resolve(null), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'enhance/site-polish/social-icons.js?v=20260821-editable-5';
      script.defer = true;
      script.dataset.localSocialIcons = 'true';
      script.addEventListener('load', () => resolve(window.NM_SOCIAL_ICONS || null), { once: true });
      script.addEventListener('error', () => resolve(null), { once: true });
      (document.head || document.documentElement).appendChild(script);
    });
    return localSocialIconsReady;
  }

  function getBaseContent(raw) {
    const output = {};
    CONTENT_GROUPS.forEach((key) => { output[key] = isObject(raw?.[key]) ? clone(raw[key]) : {}; });
    return output;
  }

  function getLanguageSettings(raw) {
    const language = isObject(raw?.language) ? raw.language : {};
    return {
      default: LANGUAGES.includes(language.default) ? language.default : 'en',
      zh: Object.assign({ label: '中', enabled: true }, isObject(language.zh) ? language.zh : {}),
      en: Object.assign({ label: 'EN', enabled: true }, isObject(language.en) ? language.en : {})
    };
  }

  function resolveLanguage(raw) {
    const settings = getLanguageSettings(raw);
    const enabled = LANGUAGES.filter((language) => settings[language].enabled !== false);
    const query = new URLSearchParams(location.search).get('lang');
    if (LANGUAGES.includes(query)) return query;
    if (enabled.includes(settings.default)) return settings.default;
    return enabled[0] || settings.default;
  }

  function resolveContent(raw, language) {
    const base = getBaseContent(raw || {});
    const entry = raw?.translations?.[language];
    const localized = isObject(entry?.content) ? entry.content : (isObject(entry) && (entry.meta || entry.nav) ? entry : {});
    const resolved = deepMerge(base, localized || {});
    const languageOrder = [language].concat(LANGUAGES.filter((candidate) => candidate !== language));
    CONTACT_METHODS.forEach((key) => {
      const candidates = languageOrder.map((candidate) => raw?.translations?.[candidate]?.content?.contact?.[key]).concat(raw?.contact?.[key]);
      resolved.contact[key] = candidates.find((value) => typeof value === 'string' && value.trim() && !/your(?:username|userid|uid)|hello@yourdomain\.com/i.test(value)) ||
        candidates.find((value) => typeof value === 'string' && value.trim()) || '';
    });
    return resolved;
  }

  function resolveVisibility(raw, language) {
    const entry = raw?.translations?.[language];
    return deepMerge({ modules: {}, fields: {} }, entry?.visibility || {});
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function setMeta(name, value) {
    if (typeof value !== 'string') return;
    if (name === 'title' && value) document.title = value;
    const selectors = {
      description: 'meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]',
      author: 'meta[name="author"]',
      keywords: 'meta[name="keywords"]',
      ogTitle: 'meta[property="og:title"], meta[name="twitter:title"]'
    };
    const selector = selectors[name];
    if (selector) document.querySelectorAll(selector).forEach((node) => node.setAttribute('content', value));
  }

  function makeLetterSpans(word) {
    return Array.from(word).map((char) => {
      const span = document.createElement('span');
      span.className = 'inline-block';
      span.style.opacity = '1';
      span.style.transform = 'translateY(0px)';
      span.textContent = char === ' ' ? '\u00a0' : char;
      return span;
    });
  }

  function setDirectText(node, value) {
    if (!node || typeof value !== 'string') return;
    const directText = Array.from(node.childNodes).find((child) => child.nodeType === 3 && trim(child.nodeValue));
    if (directText) {
      if (trim(directText.nodeValue) !== trim(value)) directText.nodeValue = value;
      return;
    }
    if (trim(node.textContent) === value) return;
    node.insertBefore(document.createTextNode(value), node.firstChild);
  }

  function setBrandText(node, value) {
    if (!node || typeof value !== 'string' || trim(node.textContent) === value) return;
    const hasDot = value.endsWith('.');
    node.replaceChildren(document.createTextNode(hasDot ? value.slice(0, -1) : value));
    if (hasDot) {
      const dot = document.createElement('span');
      dot.className = 'text-foreground/30';
      dot.textContent = '.';
      node.appendChild(dot);
    }
  }

  function setSplitNode(node, value, key) {
    if (!node || typeof value !== 'string') return;
    const markupKey = key + ':' + value;
    if (node.dataset.editableSplitKey === markupKey && node.getAttribute('aria-label') === value) return;
    node.dataset.editableSplitKey = markupKey;
    node.setAttribute('aria-label', value);
    node.replaceChildren(...makeLetterSpans(value));
  }

  function setHeroHeading(heading, line1, line2) {
    if (!heading) return;
    const first = typeof line1 === 'string' ? line1.trim() : '';
    const second = typeof line2 === 'string' ? line2.trim() : '';
    const markupKey = 'hero|' + first + '|' + second;
    const expectedWords = (first ? 1 : 0) + (second ? 1 : 0);
    if (heading.dataset.polishTitleMarkupKey === markupKey && heading.querySelectorAll('.polish-title-word').length === expectedWords) return;
    const fragment = document.createDocumentFragment();
    if (first) {
      const firstLine = document.createElement('span');
      firstLine.className = 'polish-title-word gradient-text text-glow';
      firstLine.style.setProperty('--polish-word-index', '0');
      firstLine.textContent = first;
      fragment.appendChild(firstLine);
    }
    if (first && second) fragment.appendChild(document.createElement('br'));
    if (second) {
      const secondLine = document.createElement('span');
      secondLine.className = 'polish-title-word text-foreground text-glow';
      secondLine.style.setProperty('--polish-word-index', first ? '1' : '0');
      secondLine.textContent = second;
      fragment.appendChild(secondLine);
    }
    heading.replaceChildren(fragment);
    heading.dataset.polishHeroTitleNormalized = 'true';
    heading.dataset.polishTitleMarkupKey = markupKey;
    heading.classList.add('polish-hero-title-normalized');
    heading.style.opacity = '1';
    heading.style.transform = 'none';
    heading.style.filter = 'none';
  }

  function setTwoLineHeading(heading, line1, line2, key, secondClass) {
    if (!heading || typeof line1 !== 'string' || typeof line2 !== 'string') return;
    const markupKey = key + ':' + line1 + '|' + line2;
    if (heading.dataset.editableHeadingKey === markupKey) return;
    const first = document.createElement('span'); first.textContent = line1;
    const second = document.createElement('span'); second.className = secondClass || 'text-foreground/30'; second.textContent = line2;
    heading.replaceChildren(first, document.createElement('br'), second);
    heading.dataset.editableHeadingKey = markupKey;
  }

  function updateEmailLinks(email) {
    if (typeof email !== 'string') return;
    document.querySelectorAll('a[href^="mailto:"]').forEach((anchor) => {
      const visibleText = trim(anchor.textContent);
      anchor.href = 'mailto:' + email;
      if (!visibleText.includes('@')) return;
      const directText = Array.from(anchor.childNodes).find((node) => node.nodeType === 3 && trim(node.nodeValue));
      if (directText) {
        if (trim(directText.nodeValue) !== email) directText.nodeValue = email;
      } else anchor.insertBefore(document.createTextNode(email), anchor.firstChild);
    });
  }

  function setNavContent(content) {
    if (!content?.nav) return;
    document.querySelectorAll('nav, .polish-mobile-menu-panel').forEach((nav) => {
      const byRole = (role) => nav.querySelector('[data-polish-nav-role="' + role + '"]');
      const byTarget = (target) => nav.querySelector('[data-polish-nav-target="' + target + '"]');
      const links = Array.from(nav.querySelectorAll('a'));
      const brand = byRole('brand') || nav.querySelector('a[href="#"]');
      if (brand) brand.dataset.polishNavRole = 'brand';
      setBrandText(brand, content.nav.brand);

      let works = byRole('works') || byTarget('#gallery');
      let trajectory = byRole('trajectory') || byTarget('#projects') || links.find((link) => link.getAttribute('href') === '#projects');
      let statement = byRole('statement') || byTarget('#about') || links.find((link) => link.getAttribute('href') === '#about');
      let cta = byRole('cta') || links.find((link) => link.classList.contains('rounded-full')) || links.filter((link) => link.getAttribute('href') === '#contact').pop();
      if (!works) works = links.find((link) => link !== cta && link.getAttribute('href') === '#contact');
      const setItem = (node, role, target, value) => {
        if (!node) return;
        node.dataset.polishNavRole = role;
        node.dataset.polishNavTarget = target;
        node.href = target;
        setDirectText(node, value);
      };
      setItem(works, 'works', '#gallery', content.nav.contact);
      setItem(trajectory, 'trajectory', '#projects', content.nav.projects);
      setItem(statement, 'statement', '#about', content.nav.about);
      setItem(cta, 'cta', '#contact', content.nav.cta);

      if (nav.matches('nav')) {
        const group = [works, trajectory, statement, cta].map((link) => link && Array.from(link.parentElement?.parentElement?.children || []).find((item) => item.contains(link))).filter(Boolean);
        const holder = group[0]?.parentElement;
        if (holder && group.every((item) => item.parentElement === holder)) group.forEach((item) => holder.appendChild(item));
      }
    });
    document.querySelectorAll('.polish-mobile-nav-brand').forEach((node) => setBrandText(node, content.nav.brand));
  }

  function applyTrajectory(content) {
    const section = document.querySelector('#projects');
    if (!section || !content?.trajectory) return;
    setDirectText(section.querySelector('.text-xs.font-mono'), content.trajectory.label);
    setTwoLineHeading(section.querySelector('h2'), content.trajectory.titleLine1, content.trajectory.titleLine2, 'trajectory');
    const rows = Array.from(section.querySelectorAll('[data-polish-trajectory-row], [data-cursor="pointer"]'));
    const items = Array.isArray(content.trajectory.items) ? content.trajectory.items : [];
    rows.forEach((row, index) => {
      const item = items[index] || items[index % Math.max(1, items.length)] || {};
      setDirectText(row.querySelector('[data-polish-trajectory-title], h3'), text(item.title));
      setDirectText(row.querySelector('[data-polish-trajectory-type], .text-xs.font-mono.text-foreground\\/30'), text(content.trajectory.itemType));
      setDirectText(row.querySelector('[data-polish-trajectory-description], p'), text(item.description));
      const year = row.querySelector('[data-polish-trajectory-year]') || row.firstElementChild?.children?.[2]?.querySelector(':scope > span') || Array.from(row.querySelectorAll('.text-xs.font-mono')).find((node) => /^\d{4}$/.test(trim(node.textContent)));
      setDirectText(year, text(item.year));
      const tags = Array.from(row.querySelectorAll('[data-polish-trajectory-tag], .flex.flex-wrap span'));
      tags.forEach((tag, tagIndex) => {
        const value = text(item.tags?.[tagIndex] || '');
        setDirectText(tag, value);
        tag.hidden = !trim(value);
      });
    });
  }

  function applyWorks(content) {
    const section = document.querySelector('#gallery');
    if (!section || !content?.works) return;
    setDirectText(section.querySelector('.polish-gallery-kicker'), content.works.label);
    setTwoLineHeading(section.querySelector('.polish-gallery-title'), content.works.titleLine1, content.works.titleLine2, 'works', 'polish-gallery-title-muted');
    const hints = section.querySelectorAll('.polish-works-hint span');
    setDirectText(hints[0], content.works.hintHover);
    setDirectText(hints[1], content.works.hintNavigate);
    document.querySelectorAll('.polish-works-view').forEach((node) => setDirectText(node, content.works.viewProject));
    document.querySelectorAll('.polish-project-detail__body-link').forEach((node) => setDirectText(node, content.works.detailView + ' '));
    document.querySelectorAll('.polish-project-detail__back-label').forEach((node) => setDirectText(node, content.works.detailClose));
    document.querySelectorAll('[data-polish-copy-toggle-label]').forEach((node) => {
      const toggle = node.closest('[data-polish-copy-toggle]');
      const moreLabel = text(content.works.detailReadMore) || toggle?.getAttribute('data-polish-copy-label-more') || 'Read more';
      const lessLabel = toggle?.getAttribute('data-polish-copy-label-less') || (/[\u3400-\u9fff]/.test(moreLabel) ? '收起内容' : 'Show less');
      if (toggle) toggle.setAttribute('data-polish-copy-label-more', moreLabel);
      setDirectText(node, toggle?.getAttribute('aria-expanded') === 'true' ? lessLabel : moreLabel);
    });
  }

  function applyAbout(content) {
    const section = document.querySelector('#about');
    if (!section || !content?.about) return;
    setDirectText(section.querySelector('.text-xs.font-mono'), content.about.label);
    setTwoLineHeading(section.querySelector('h2'), content.about.titleLine1, content.about.titleLine2, 'about');
    const paragraphs = Array.from(section.querySelectorAll('p')).slice(0, 2);
    if (paragraphs[0] && typeof content.about.paragraph1 === 'string' && paragraphs[0].textContent !== content.about.paragraph1) paragraphs[0].textContent = content.about.paragraph1;
    if (paragraphs[1] && typeof content.about.paragraph2 === 'string' && paragraphs[1].textContent !== content.about.paragraph2) paragraphs[1].textContent = content.about.paragraph2;
    const statsGrid = section.querySelector('.grid.grid-cols-3');
    if (statsGrid && Array.isArray(content.about.stats)) {
      Array.from(statsGrid.children).slice(0, content.about.stats.length).forEach((wrap, index) => {
        const box = wrap.querySelector('.text-center') || wrap;
        setDirectText(box.querySelector('.text-3xl'), text(content.about.stats[index]?.number));
        setDirectText(box.querySelector('.text-xs'), text(content.about.stats[index]?.label));
      });
    }
    const services = Array.isArray(content.about.services) ? content.about.services : [];
    const cards = Array.from(section.querySelectorAll('.group')).slice(0, services.length);
    cards.forEach((card, index) => {
      const headings = card.querySelectorAll('h3, h4');
      const body = card.querySelector('p');
      setDirectText(headings[0] || Array.from(card.querySelectorAll('div,span')).find((node) => node.children.length === 0), text(services[index]?.title));
      if (body && body.textContent !== text(services[index]?.description)) body.textContent = text(services[index]?.description);
    });
  }

  function applyContact(content) {
    const section = document.querySelector('#contact');
    if (!section || !content?.contact) return;
    setDirectText(section.querySelector('.text-xs.font-mono'), content.contact.label);
    const titleWords = Array.from(section.querySelectorAll('h2 [aria-label]'));
    setSplitNode(titleWords[0], content.contact.titleLine1, 'contact-line-1');
    setSplitNode(titleWords[1], content.contact.titleLine2, 'contact-line-2');
    const paragraph = section.querySelector('p');
    if (paragraph && paragraph.textContent !== content.contact.paragraph) paragraph.textContent = content.contact.paragraph;
    updateEmailLinks(content.contact.email);
    const socialKey = JSON.stringify([content.contact.github, content.contact.twitter, content.contact.discord, content.contact.instagram, content.contact.bilibili, content.contact.douban, content.contact.socialLabels]);
    const row = section.querySelector('[data-local-social-icons]');
    if (window.NM_SOCIAL_ICONS && (!row || row.dataset.editableSocialKey !== socialKey)) {
      window.NM_SOCIAL_ICONS.apply(content.contact);
      const nextRow = section.querySelector('[data-local-social-icons]');
      if (nextRow) nextRow.dataset.editableSocialKey = socialKey;
    }
  }

  function applyContent(content) {
    if (!content) return;
    setMeta('title', content.meta?.title);
    setMeta('description', content.meta?.description);
    setMeta('author', content.meta?.author);
    setMeta('keywords', content.meta?.keywords);
    setMeta('ogTitle', content.meta?.title);
    setNavContent(content);

    const heroTitle = document.querySelector('main h1');
    const hero = heroTitle?.closest('section');
    if (hero && content.hero) {
      setHeroHeading(heroTitle, content.hero.line1, content.hero.line2);
      const subtitle = heroTitle.parentElement?.querySelector('p');
      if (subtitle && subtitle.textContent !== content.hero.subtitle) subtitle.textContent = content.hero.subtitle;
      const status = hero.querySelector('.mb-8 .inline-flex');
      setDirectText(status, content.hero.status);
      const statusHolder = status?.closest('.mb-8') || status?.parentElement;
      if (statusHolder) {
        statusHolder.classList.toggle('editable-content-empty', !trim(content.hero.status));
        if (trim(content.hero.status)) {
          statusHolder.classList.remove('polish-hero-availability-hidden');
          statusHolder.removeAttribute('aria-hidden');
          ['display', 'opacity', 'visibility', 'pointer-events'].forEach((name) => statusHolder.style.removeProperty(name));
        }
      }
      const scrollLabel = hero.querySelector('.polish-scroll-indicator span, a[href="#about"] span, a[data-polish-scroll-link] span');
      setDirectText(scrollLabel, content.hero.scrollLabel);
    }

    applyWorks(content);
    applyTrajectory(content);
    applyAbout(content);
    applyContact(content);

    const footer = document.querySelector('footer');
    if (footer && content.footer) {
      const labels = Array.from(footer.querySelectorAll('span'));
      const rights = text(content.footer.rights) || 'All rights reserved.';
      const copyright = '© ' + new Date().getFullYear() + ' ' + text(content.footer.name) + '. ' + rights;
      if (labels[0] && labels[0].textContent !== copyright) labels[0].textContent = copyright;
      if (labels[1] && labels[1].textContent !== text(content.footer.credit)) labels[1].textContent = text(content.footer.credit);
    }
  }

  function cssString(value) { return '"' + String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; }
  function cssUrl(value) { return 'url(' + cssString(value) + ')'; }
  function applyFonts(fonts) {
    if (!isObject(fonts)) return;
    const roles = {
      body: '--polish-font-sans', heading: '--polish-font-subtitle', accent: '--polish-font-accent',
      labels: '--polish-font-mono', email: '--polish-font-email', stats: '--polish-font-stats', hero: '--polish-font-hero'
    };
    const faces = [];
    const stacks = {};
    Object.keys(roles).forEach((role) => {
      const font = isObject(fonts[role]) ? fonts[role] : {};
      const family = text(font.family) || 'system-ui';
      let stack = cssString(family) + ', sans-serif';
      if (font.src) {
        const editableFamily = 'Editable ' + role;
        faces.push('@font-face{font-family:' + cssString(editableFamily) + ';src:' + cssUrl(font.src) + ';font-style:' + (font.style || 'normal') + ';font-weight:' + (font.weight || '400') + ';font-display:swap;}');
        stack = cssString(editableFamily) + ',' + stack;
      }
      stacks[role] = stack;
      document.documentElement.style.setProperty(roles[role], stack, 'important');
    });
    let style = document.querySelector('style[data-editable-fonts]');
    if (!style) { style = document.createElement('style'); style.dataset.editableFonts = 'true'; (document.head || document.documentElement).appendChild(style); }
    const f = (role) => fonts[role] || {};
    const css = faces.join('\n') + '\n' +
      'html body,html nav a,html main section p,html footer{font-family:var(--polish-font-sans)!important;font-weight:' + (f('body').weight || '400') + '!important;font-style:' + (f('body').style || 'normal') + '!important}' +
      'html main section h2,html main>section:first-of-type p.mt-8{font-family:var(--polish-font-subtitle)!important;font-weight:' + (f('heading').weight || '400') + '!important;font-style:' + (f('heading').style || 'normal') + '!important}' +
      'html nav [data-polish-nav-role="brand"],html #projects h3,html .polish-works-name,html .polish-project-detail__title{font-family:var(--polish-font-accent)!important;font-weight:' + (f('accent').weight || '650') + '!important;font-style:' + (f('accent').style || 'normal') + '!important}' +
      'html .font-mono,html .polish-gallery-kicker,html .polish-works-kind{font-family:var(--polish-font-mono)!important;font-weight:' + (f('labels').weight || '400') + '!important;font-style:' + (f('labels').style || 'normal') + '!important}' +
      'html #contact a[href^="mailto:"]{font-family:var(--polish-font-email)!important;font-weight:' + (f('email').weight || '500') + '!important;font-style:' + (f('email').style || 'normal') + '!important}' +
      'html #about .text-3xl{font-family:var(--polish-font-stats)!important;font-weight:' + (f('stats').weight || '700') + '!important;font-style:' + (f('stats').style || 'normal') + '!important}' +
      'html .polish-hero-title-normalized{font-family:var(--polish-font-hero,"Pilowlava",sans-serif)!important;font-weight:' + (f('hero').weight || '400') + '!important;font-style:' + (f('hero').style || 'normal') + '!important}';
    if (style.textContent !== css) style.textContent = css;
  }

  function applyMedia(media) {
    if (!media) return;
    if (media.favicon) document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]').forEach((link) => { link.href = media.favicon; });

    const brandNodes = document.querySelectorAll('[data-polish-nav-role="brand"], .polish-mobile-nav-brand');
    if (media.useLogo && media.logo) {
      brandNodes.forEach((node) => {
        const key = media.logo;
        if (node.dataset.editableLogoKey === key) return;
        const image = document.createElement('img');
        image.src = media.logo; image.alt = trim(lastResolvedContent?.nav?.brand) || 'Logo'; image.dataset.editableLogo = 'true';
        image.style.cssText = 'display:block;width:auto;height:1.55em;max-width:8rem;object-fit:contain';
        node.replaceChildren(image); node.dataset.editableLogoKey = key;
      });
    } else {
      brandNodes.forEach((node) => { delete node.dataset.editableLogoKey; });
    }

    const video = document.querySelector('.polish-hero-video');
    if (video) {
      const source = video.querySelector('source');
      if (media.heroVideo && source?.getAttribute('src') !== media.heroVideo) { source.src = media.heroVideo; video.load(); }
      if (media.heroPoster) video.poster = media.heroPoster;
      video.closest('.polish-hero-video-wrap, .polish-hero-video-shell')?.classList.toggle('editable-module-hidden', media.heroEnabled === false);
    }

    let demo = document.querySelector('[data-editable-demo-panel]');
    if (media.showDemoPanel && media.demoVideo) {
      if (!demo) {
        demo = document.createElement('section');
        demo.dataset.editableDemoPanel = 'true';
        demo.style.cssText = 'position:relative;z-index:10;max-width:960px;margin:0 auto 96px;padding:0 24px;color:inherit';
        document.querySelector('footer')?.before(demo);
      }
      const key = media.demoVideo + '|' + (media.demoPoster || '');
      if (demo.dataset.mediaKey !== key) {
        demo.dataset.mediaKey = key;
        demo.innerHTML = '<video controls playsinline preload="metadata" style="width:100%;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:#000" src="' + escapeHtml(media.demoVideo) + '" poster="' + escapeHtml(media.demoPoster || '') + '"></video>';
      }
    } else demo?.remove();
  }

  function setShown(nodes, shown) {
    Array.from(nodes || []).filter(Boolean).forEach((node) => node.classList.toggle('editable-field-hidden', !shown));
  }
  function isFieldShown(path) { return lastVisibility.fields?.[path] !== false; }
  function isModuleShown(module) { return lastVisibility.modules?.[module] !== false; }
  function isContactMethodShown(key) {
    return LANGUAGES.every((language) => {
      const fields = lastRawContent?.translations?.[language]?.visibility?.fields || {};
      return fields['contact.' + key] !== false && fields['contact.socialLabels.' + key] !== false;
    });
  }

  function applyFieldVisibility() {
    const roleNodes = (role) => document.querySelectorAll('[data-polish-nav-role="' + role + '"]');
    const setNavRoleShown = (role, shown) => {
      const nodes = roleNodes(role);
      setShown(nodes, shown);
      nodes.forEach((node) => {
        const item = node.closest('.polish-shared-nav-home-item');
        if (item) item.classList.toggle('editable-nav-item-hidden', !shown);
      });
    };
    setNavRoleShown('brand', isFieldShown('nav.brand'));
    setNavRoleShown('works', isFieldShown('nav.contact') && isModuleShown('works'));
    setNavRoleShown('trajectory', isFieldShown('nav.projects') && isModuleShown('trajectory'));
    setNavRoleShown('statement', isFieldShown('nav.about') && isModuleShown('statement'));
    setNavRoleShown('cta', isFieldShown('nav.cta') && isModuleShown('contact'));

    const heroTitle = document.querySelector('main h1');
    const hero = heroTitle?.closest('section');
    setShown([heroTitle], isFieldShown('hero.line1') || isFieldShown('hero.line2'));
    if (heroTitle) {
      const words = heroTitle.querySelectorAll('.polish-title-word');
      setShown([words[0]], isFieldShown('hero.line1'));
      setShown([words[1]], isFieldShown('hero.line2'));
    }
    setShown([heroTitle?.parentElement?.querySelector('p')], isFieldShown('hero.subtitle'));
    setShown([hero?.querySelector('.mb-8')], isFieldShown('hero.status'));
    setShown(hero?.querySelectorAll('.polish-scroll-indicator, a[data-polish-scroll-link]') || [], isFieldShown('hero.scrollLabel'));

    const works = document.querySelector('#gallery');
    setShown([works?.querySelector('.polish-gallery-kicker')], isFieldShown('works.label'));
    const worksTitle = works?.querySelector('.polish-gallery-title');
    const worksTitleSpans = worksTitle?.querySelectorAll(':scope > span');
    setShown([worksTitleSpans?.[0]], isFieldShown('works.titleLine1'));
    setShown([worksTitleSpans?.[1]], isFieldShown('works.titleLine2'));
    const hints = works?.querySelectorAll('.polish-works-hint span');
    setShown([hints?.[0]], isFieldShown('works.hintHover'));
    setShown([hints?.[1]], isFieldShown('works.hintNavigate'));
    setShown(document.querySelectorAll('.polish-works-view'), isFieldShown('works.viewProject'));
    setShown(document.querySelectorAll('.polish-project-detail__body-link'), isFieldShown('works.detailView'));
    setShown(document.querySelectorAll('.polish-project-detail__back-label'), isFieldShown('works.detailClose'));
    setShown(document.querySelectorAll('[data-polish-copy-toggle-label]'), isFieldShown('works.detailReadMore'));

    const trajectory = document.querySelector('#projects');
    setShown([trajectory?.querySelector('.text-xs.font-mono')], isFieldShown('trajectory.label'));
    const trajectoryTitle = trajectory?.querySelector('h2')?.querySelectorAll(':scope > span');
    setShown([trajectoryTitle?.[0]], isFieldShown('trajectory.titleLine1'));
    setShown([trajectoryTitle?.[1]], isFieldShown('trajectory.titleLine2'));
    Array.from(trajectory?.querySelectorAll('[data-polish-trajectory-row], [data-cursor="pointer"]') || []).forEach((row, index) => {
      setShown([row.querySelector('[data-polish-trajectory-title], h3')], isFieldShown('trajectory.items.' + index + '.title'));
      setShown([row.querySelector('[data-polish-trajectory-description], p')], isFieldShown('trajectory.items.' + index + '.description'));
      setShown([row.querySelector('[data-polish-trajectory-type], .text-xs.font-mono.text-foreground\\/30')], isFieldShown('trajectory.itemType'));
      const year = row.querySelector('[data-polish-trajectory-year]') || Array.from(row.querySelectorAll('.text-xs.font-mono')).find((node) => /^\d{4}$/.test(trim(node.textContent)));
      setShown([year], isFieldShown('trajectory.items.' + index + '.year'));
      Array.from(row.querySelectorAll('[data-polish-trajectory-tag], .flex.flex-wrap span')).forEach((tag, tagIndex) => setShown([tag], isFieldShown('trajectory.items.' + index + '.tags.' + tagIndex)));
    });

    const about = document.querySelector('#about');
    setShown([about?.querySelector('.text-xs.font-mono')], isFieldShown('about.label'));
    const aboutTitle = about?.querySelector('h2')?.querySelectorAll(':scope > span');
    setShown([aboutTitle?.[0]], isFieldShown('about.titleLine1'));
    setShown([aboutTitle?.[1]], isFieldShown('about.titleLine2'));
    const aboutParagraphs = about?.querySelectorAll('p');
    setShown([aboutParagraphs?.[0]], isFieldShown('about.paragraph1'));
    setShown([aboutParagraphs?.[1]], isFieldShown('about.paragraph2'));
    const stats = about?.querySelector('.grid.grid-cols-3')?.children || [];
    Array.from(stats).forEach((wrap, index) => {
      setShown([wrap.querySelector('.text-3xl')], isFieldShown('about.stats.' + index + '.number'));
      setShown([wrap.querySelector('.text-xs')], isFieldShown('about.stats.' + index + '.label'));
    });
    Array.from(about?.querySelectorAll('.group') || []).forEach((card, index) => {
      setShown([card.querySelector('h3, h4')], isFieldShown('about.services.' + index + '.title'));
      setShown([card.querySelector('p')], isFieldShown('about.services.' + index + '.description'));
    });

    const contact = document.querySelector('#contact');
    setShown([contact?.querySelector('.text-xs.font-mono')], isFieldShown('contact.label'));
    const contactTitle = contact?.querySelectorAll('h2 [aria-label]');
    setShown([contactTitle?.[0]], isFieldShown('contact.titleLine1'));
    setShown([contactTitle?.[1]], isFieldShown('contact.titleLine2'));
    setShown([contact?.querySelector('p')], isFieldShown('contact.paragraph'));
    setShown([contact?.querySelector('a[href^="mailto:"]')], isContactMethodShown('email'));
    CONTACT_METHODS.filter((key) => key !== 'email').forEach((key) => {
      const shown = isContactMethodShown(key);
      const anchors = contact?.querySelectorAll('[data-social-key="' + key + '"]') || [];
      setShown(anchors, shown);
      anchors.forEach((anchor) => {
        const item = anchor.closest('[data-social-item-key]');
        if (item) item.classList.toggle('editable-contact-item-hidden', !shown);
      });
    });

    const footer = document.querySelector('footer');
    const footerSpans = footer?.querySelectorAll(':scope span');
    setShown([footerSpans?.[0]], isFieldShown('footer.name') || isFieldShown('footer.rights'));
    setShown([footerSpans?.[1]], isFieldShown('footer.credit'));
  }

  function applyModuleVisibility() {
    const targets = {
      navigation: document.querySelectorAll('nav, .polish-mobile-nav-dock'),
      hero: [document.querySelector('main > section:first-of-type')],
      works: [document.querySelector('#gallery')],
      trajectory: [document.querySelector('#projects')],
      statement: [document.querySelector('#about')],
      contact: [document.querySelector('#contact')],
      footer: [document.querySelector('footer')]
    };
    Object.keys(targets).forEach((module) => Array.from(targets[module] || []).filter(Boolean).forEach((node) => node.classList.toggle('editable-module-hidden', !isModuleShown(module))));
    const nextTarget = [['works', '#gallery'], ['trajectory', '#projects'], ['statement', '#about'], ['contact', '#contact']].find(([module]) => isModuleShown(module));
    document.querySelectorAll('.polish-scroll-indicator a, a[data-polish-scroll-link]').forEach((link) => {
      if (!nextTarget) { link.classList.add('editable-field-hidden'); return; }
      link.href = nextTarget[1]; link.dataset.polishNavTarget = nextTarget[1];
    });
  }

  function applyVisibility() {
    applyModuleVisibility();
    applyFieldVisibility();
  }

  function installRuntimeStyles() {
    if (document.querySelector('style[data-editable-runtime]')) return;
    const style = document.createElement('style');
    style.dataset.editableRuntime = 'true';
    style.textContent = 'html:not(.editable-content-ready) nav{opacity:0!important;visibility:hidden!important}.editable-module-hidden,.editable-field-hidden,.editable-content-empty,.editable-nav-item-hidden,.editable-contact-item-hidden{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important}';
    (document.head || document.documentElement).appendChild(style);
  }

  function applyAll() {
    if (!lastResolvedContent || isApplying) return;
    const reconnectObserver = !!contentObserver;
    if (reconnectObserver) contentObserver.disconnect();
    isApplying = true;
    try {
      document.querySelector('[data-editable-language-switcher]')?.remove();
      applyFonts(lastRawContent?.fonts || {});
      applyContent(lastResolvedContent);
      applyMedia(lastMedia || {});
      applyVisibility();
      const navReady = !isModuleShown('navigation') || [
        ['brand', lastResolvedContent.nav?.brand],
        ['works', lastResolvedContent.nav?.contact],
        ['trajectory', lastResolvedContent.nav?.projects],
        ['statement', lastResolvedContent.nav?.about],
        ['cta', lastResolvedContent.nav?.cta]
      ].every(([role, expected]) => {
        const node = document.querySelector('nav [data-polish-nav-role="' + role + '"]');
        return node && trim(node.textContent) === trim(expected);
      });
      document.documentElement.classList.toggle('editable-content-ready', navReady);
    } finally {
      isApplying = false;
      if (reconnectObserver && document.body) contentObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }

  function scheduleApply() {
    if (applyQueued || isApplying) return;
    applyQueued = true;
    applyAll();
    applyQueued = false;
  }

  function watchDynamicContent() {
    if (window.__EDITABLE_SITE_OBSERVER__) return;
    contentObserver = new MutationObserver(scheduleApply);
    contentObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.__EDITABLE_SITE_OBSERVER__ = contentObserver;
  }

  function loadEditableContent() {
    installRuntimeStyles();
    watchDynamicContent();
    Promise.all([fetchJson('editable/content.json'), fetchJson('editable/media.json'), loadLocalSocialIcons()]).then(([rawContent, media]) => {
      const language = resolveLanguage(rawContent || {});
      const resolved = resolveContent(rawContent || {}, language);
      lastRawContent = rawContent || {};
      lastResolvedContent = resolved;
      lastMedia = media || {};
      lastVisibility = resolveVisibility(rawContent || {}, language);
      window.__EDITABLE_SITE_RAW__ = lastRawContent;
      window.__EDITABLE_SITE_LANGUAGE__ = language;
      window.__EDITABLE_SITE_CONTENT__ = resolved;
      window.__EDITABLE_SITE_MEDIA__ = lastMedia;
      document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
      const finish = () => {
        applyAll();
        window.dispatchEvent(new CustomEvent('editable:content-ready', { detail: { content: resolved, raw: lastRawContent, media: lastMedia, language } }));
      };
      const scheduleFinish = () => requestAnimationFrame(() => requestAnimationFrame(finish));
      if (document.readyState === 'complete') scheduleFinish();
      else window.addEventListener('load', scheduleFinish, { once: true });
    });
  }

  listenForEditorSync();
  loadEditableContent();
})();
