(function () {
  const text = (value) => typeof value === 'string' ? value : '';
  const trim = (value) => text(value).trim();

  function listenForEditorSync() {
    let reloadQueued = false;
    const reload = () => {
      if (reloadQueued) return;
      reloadQueued = true;
      setTimeout(() => location.reload(), 80);
    };
    try {
      const channel = new BroadcastChannel('site-content-sync');
      channel.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'site-content-updated') reload();
      });
    } catch {}
    window.addEventListener('storage', (event) => {
      if (event.key === 'site-content-sync' && event.newValue) reload();
    });
  }

  listenForEditorSync();

  function fetchJson(path) {
    return fetch(path, { cache: 'no-store' }).then((res) => res.ok ? res.json() : null).catch(() => null);
  }

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
      script.src = 'enhance/site-polish/social-icons.js?v=20260812-simple-icons-2';
      script.defer = true;
      script.dataset.localSocialIcons = 'true';
      script.addEventListener('load', () => resolve(window.NM_SOCIAL_ICONS || null), { once: true });
      script.addEventListener('error', () => resolve(null), { once: true });
      (document.head || document.documentElement).appendChild(script);
    });
    return localSocialIconsReady;
  }

  function setMeta(name, value) {
    if (!value) return;
    if (name === 'title') document.title = value;
    const selectors = {
      description: 'meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]',
      author: 'meta[name="author"]',
      ogTitle: 'meta[property="og:title"], meta[name="twitter:title"]'
    };
    const selector = selectors[name];
    if (selector) document.querySelectorAll(selector).forEach((node) => node.setAttribute('content', value));
  }

  function setSingleText(oldText, newText) {
    if (!newText || oldText === newText) return;
    const all = Array.from(document.body.querySelectorAll('a,span,p,h1,h2,h3,div,strong,blockquote'));
    const target = all.find((node) => trim(node.textContent) === oldText && node.children.length === 0);
    if (target) target.textContent = newText;
  }

  function setByExactText(oldText, newText) {
    if (!newText || oldText === newText) return;
    const nodes = Array.from(document.body.querySelectorAll('a,span,p,h1,h2,h3,div,blockquote'));
    nodes.filter((node) => trim(node.textContent) === oldText).slice(0, 3).forEach((node) => {
      if (node.children.length === 0) node.textContent = newText;
    });
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

  function setSplitText(oldLabel, newText) {
    if (!newText || oldLabel === newText) return;
    const el = document.querySelector('[aria-label="' + CSS.escape(oldLabel) + '"]');
    if (!el) return;
    el.setAttribute('aria-label', newText);
    el.replaceChildren(...makeLetterSpans(newText));
  }

  function setHrefByText(label, href) {
    if (!href) return;
    Array.from(document.querySelectorAll('a')).forEach((a) => {
      if (trim(a.textContent) === label) a.href = href;
    });
  }

  function updateEmailLinks(email) {
    if (!email) return;
    document.querySelectorAll('a[href^="mailto:"]').forEach((anchor) => {
      const visibleText = trim(anchor.textContent);
      anchor.href = 'mailto:' + email;
      if (!visibleText.includes('@')) return;
      const directText = Array.from(anchor.childNodes).find((node) => node.nodeType === 3 && trim(node.nodeValue));
      if (directText) {
        directText.nodeValue = email;
      } else {
        anchor.insertBefore(document.createTextNode(email), anchor.firstChild);
      }
    });
  }

  function setDirectText(node, value) {
    if (!node || !value) return;
    const directText = Array.from(node.childNodes).find((child) => child.nodeType === 3 && trim(child.nodeValue));
    if (directText) {
      if (trim(directText.nodeValue) !== value) directText.nodeValue = value;
      return;
    }
    if (trim(node.textContent) === value) return;
    node.insertBefore(document.createTextNode(value), node.firstChild);
  }

  function setBrandText(node, value) {
    if (!node || !value || trim(node.textContent) === value) return;
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
    if (!node || !value) return;
    const markupKey = key + ':' + value;
    if (node.dataset.editableSplitKey === markupKey && node.getAttribute('aria-label') === value) return;
    node.dataset.editableSplitKey = markupKey;
    node.setAttribute('aria-label', value);
    node.replaceChildren(...makeLetterSpans(value));
  }

  function setHeroHeading(heading, line1, line2) {
    if (!heading) return;
    let first = typeof line1 === 'string' ? line1.trim() : '';
    const second = typeof line2 === 'string' ? line2.trim() : '';
    if (!first && !second) first = 'Creative';
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

  function setTwoLineHeading(heading, line1, line2, key) {
    if (!heading || !line1 || !line2) return;
    const markupKey = key + ':' + line1 + '|' + line2;
    if (heading.dataset.editableHeadingKey === markupKey) return;
    const first = document.createElement('span');
    first.textContent = line1;
    const second = document.createElement('span');
    second.className = 'text-foreground/30';
    second.textContent = line2;
    heading.replaceChildren(first, document.createElement('br'), second);
    heading.dataset.editableHeadingKey = markupKey;
  }

  function setNavContent(content) {
    if (!content || !content.nav) return;
    const nav = document.querySelector('nav');
    if (nav) {
      const byRole = (role) => nav.querySelector('[data-polish-nav-role="' + role + '"]');
      const byTarget = (target) => nav.querySelector('[data-polish-nav-target="' + target + '"]');
      setBrandText(byRole('brand') || nav.querySelector('a[href="#"]'), content.nav.brand);
      const hasPolishIdentity = !!nav.querySelector('[data-polish-nav-role], [data-polish-nav-target]');
      if (hasPolishIdentity) {
        setDirectText(byRole('works') || byTarget('#gallery'), content.nav.contact);
        setDirectText(byRole('trajectory') || byTarget('#projects'), content.nav.projects);
        setDirectText(byRole('statement') || byTarget('#about'), content.nav.about);
        setDirectText(byRole('cta') || byTarget('#contact'), content.nav.cta);
      } else {
        setDirectText(nav.querySelector('a[href="#about"]'), content.nav.about);
        setDirectText(nav.querySelector('a[href="#projects"]'), content.nav.projects);
        const contactLinks = Array.from(nav.querySelectorAll('a[href="#contact"]'));
        setDirectText(contactLinks[0], content.nav.contact);
        setDirectText(contactLinks[contactLinks.length - 1], content.nav.cta);
      }
    }
    document.querySelectorAll('.polish-mobile-nav-brand').forEach((node) => setBrandText(node, content.nav.brand));
    document.querySelectorAll('.polish-mobile-menu-panel, div.fixed.inset-0').forEach((panel) => {
      const byRole = (role) => panel.querySelector('[data-polish-nav-role="' + role + '"]');
      const byTarget = (target) => panel.querySelector('[data-polish-nav-target="' + target + '"]');
      setDirectText(byRole('works') || byTarget('#gallery'), content.nav.contact);
      setDirectText(byRole('trajectory') || byTarget('#projects'), content.nav.projects);
      setDirectText(byRole('statement') || byTarget('#about'), content.nav.about);
      setDirectText(byRole('cta') || byTarget('#contact'), content.nav.cta);
    });
  }

  function applyStructuralContent(content) {
    if (!content) return;
    setNavContent(content);

    const heroTitle = document.querySelector('main h1');
    const hero = heroTitle && heroTitle.closest('section');
    if (hero && content.hero) {
      setHeroHeading(heroTitle, content.hero.line1, content.hero.line2);
      const subtitle = heroTitle.parentElement && heroTitle.parentElement.querySelector('p');
      if (subtitle && content.hero.subtitle) subtitle.textContent = content.hero.subtitle;
      const status = hero.querySelector('.mb-8 .inline-flex');
      setDirectText(status, content.hero.status);
      if (status && content.hero.status && content.hero.status !== 'Available for work') {
        const holder = status.closest('.mb-8') || status.parentElement;
        if (holder) {
          holder.classList.remove('polish-hero-availability-hidden');
          holder.removeAttribute('aria-hidden');
          ['display', 'opacity', 'visibility', 'pointer-events'].forEach((name) => holder.style.removeProperty(name));
        }
      }
    }

    const about = document.querySelector('#about');
    if (about && content.about) {
      setDirectText(about.querySelector('.text-xs.font-mono'), content.about.label);
      setTwoLineHeading(about.querySelector('h2'), content.about.titleLine1, content.about.titleLine2, 'about-title');
      const paragraphs = Array.from(about.querySelectorAll('p')).slice(0, 2);
      if (paragraphs[0] && content.about.paragraph1) paragraphs[0].textContent = content.about.paragraph1;
      if (paragraphs[1] && content.about.paragraph2) paragraphs[1].textContent = content.about.paragraph2;
      const statsGrid = about.querySelector('.grid.grid-cols-3');
      if (statsGrid && Array.isArray(content.about.stats)) {
        Array.from(statsGrid.children).slice(0, content.about.stats.length).forEach((wrap, index) => {
          const item = content.about.stats[index];
          const box = wrap.querySelector('.text-center') || wrap;
          const number = box.querySelector('.text-3xl');
          const label = box.querySelector('.text-xs');
          if (number && item.number) number.textContent = item.number;
          if (label && item.label) label.textContent = item.label;
        });
      }
    }

    const contact = document.querySelector('#contact');
    if (contact && content.contact) {
      setDirectText(contact.querySelector('.text-xs.font-mono'), content.contact.label);
      const titleWords = Array.from(contact.querySelectorAll('h2 [aria-label]'));
      setSplitNode(titleWords[0], content.contact.titleLine1, 'contact-line-1');
      setSplitNode(titleWords[1], content.contact.titleLine2, 'contact-line-2');
      const paragraph = contact.querySelector('p');
      if (paragraph && content.contact.paragraph) paragraph.textContent = content.contact.paragraph;
      updateEmailLinks(content.contact.email);
      if (window.NM_SOCIAL_ICONS) window.NM_SOCIAL_ICONS.apply(content.contact);
    }

    const footer = document.querySelector('footer');
    if (footer && content.footer) {
      const labels = Array.from(footer.querySelectorAll('span'));
      if (labels[0]) labels[0].textContent = '© ' + new Date().getFullYear() + ' ' + (content.footer.name || '') + '. All rights reserved.';
      if (labels[1] && content.footer.credit) labels[1].textContent = content.footer.credit;
    }
  }

  function applyContent(content) {
    if (!content) return;
    setMeta('title', content.meta && content.meta.title);
    setMeta('description', content.meta && content.meta.description);
    setMeta('author', content.meta && content.meta.author);
    setMeta('ogTitle', content.meta && content.meta.title);

    if (content.hero) {
      setByExactText('Available for work', content.hero.status);
      setSplitText('Creative', content.hero.line1);
      setSplitText('Developer', content.hero.line2);
      setSingleText('Designing and building digital experiences at the intersection of art and technology.', content.hero.subtitle);
    }

    if (content.about) {
      setByExactText('01 — About', content.about.label);
      setByExactText('Crafting digitalexperiences', [content.about.titleLine1, content.about.titleLine2].filter(Boolean).join(''));
      setSingleText("I'm a creative developer with a passion for building beautiful, functional, and accessible digital products. I believe great design is invisible — it just works.", content.about.paragraph1);
      setSingleText("My approach combines technical precision with creative exploration, always pushing the boundaries of what's possible on the web. Every project is an opportunity to create something meaningful.", content.about.paragraph2);
      if (Array.isArray(content.about.stats)) {
        ['Years Experience', 'Projects Completed', 'Happy Clients'].forEach((label, index) => {
          const item = content.about.stats[index];
          if (!item) return;
          setByExactText(label, item.label);
          const numberNode = Array.from(document.querySelectorAll('div')).find((node) => trim(node.textContent) === ['3+', '20+', '10+'][index] && node.children.length === 0);
          if (numberNode && item.number) numberNode.textContent = item.number;
        });
      }
    }

    if (content.contact) {
      setByExactText('03 — Contact', content.contact.label);
      setSplitText("Let's work", content.contact.titleLine1);
      setSplitText('together', content.contact.titleLine2);
      setSingleText("Have a project in mind or just want to chat? I'm always open to discussing new ideas and opportunities.", content.contact.paragraph);
      setByExactText('hello@yourdomain.com', content.contact.email);
      updateEmailLinks(content.contact.email);
      setHrefByText('GitHub', content.contact.github);
      setHrefByText('Twitter', content.contact.twitter);
      setHrefByText('Email', content.contact.email ? 'mailto:' + content.contact.email : '');
    }

    if (content.footer) {
      setByExactText('© 2026 Your Name. All rights reserved.', '© 2026 ' + (content.footer.name || 'Your Name') + '. All rights reserved.');
      setByExactText('Built with Next.js & Tailwind CSS', content.footer.credit);
    }
    applyStructuralContent(content);
  }

  function applyMedia(media) {
    if (!media) return;
    if (media.favicon) {
      document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]').forEach((link) => link.href = media.favicon);
    }
    if (media.logo) {
      document.querySelectorAll('img[data-editable-logo]').forEach((img) => img.src = media.logo);
    }
    if (media.showDemoPanel && media.demoVideo) {
      const panel = document.createElement('section');
      panel.style.cssText = 'position:relative;z-index:10;max-width:960px;margin:0 auto 96px;padding:0 24px;color:inherit';
      panel.innerHTML = '<video controls playsinline preload="metadata" style="width:100%;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:#000" src="' + media.demoVideo + '" poster="' + (media.demoPoster || '') + '"></video>';
      document.querySelector('footer')?.before(panel);
    }
  }

  function loadEditableContent() {
    Promise.all([fetchJson('editable/content.json'), fetchJson('editable/media.json'), loadLocalSocialIcons()]).then(([content, media]) => {
      window.__EDITABLE_SITE_CONTENT__ = content || {};
      applyContent(content);
      applyMedia(media);
      window.dispatchEvent(new CustomEvent('editable:content-ready', { detail: { content: content || {} } }));
      [350, 1200, 2400].forEach((delay) => setTimeout(() => applyContent(content), delay));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadEditableContent, { once: true });
  } else {
    loadEditableContent();
  }
})();
