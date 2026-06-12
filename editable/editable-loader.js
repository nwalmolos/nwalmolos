(function () {
  const text = (value) => typeof value === 'string' ? value : '';
  const trim = (value) => text(value).trim();

  function fetchJson(path) {
    return fetch(path, { cache: 'no-store' }).then((res) => res.ok ? res.json() : null).catch(() => null);
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

  function applyContent(content) {
    if (!content) return;
    setMeta('title', content.meta && content.meta.title);
    setMeta('description', content.meta && content.meta.description);
    setMeta('author', content.meta && content.meta.author);
    setMeta('ogTitle', content.meta && content.meta.title);

    if (content.nav) {
      setByExactText('YN.', content.nav.brand);
      setByExactText('About', content.nav.about);
      setByExactText('Projects', content.nav.projects);
      setByExactText('Contact', content.nav.contact);
      setByExactText('Get in Touch', content.nav.cta);
    }

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
      document.querySelectorAll('a[href^="mailto:"]').forEach((a) => { if (content.contact.email) a.href = 'mailto:' + content.contact.email; });
      setHrefByText('GitHub', content.contact.github);
      setHrefByText('Twitter', content.contact.twitter);
      setHrefByText('Email', content.contact.email ? 'mailto:' + content.contact.email : '');
    }

    if (content.footer) {
      setByExactText('© 2026 Your Name. All rights reserved.', '© 2026 ' + (content.footer.name || 'Your Name') + '. All rights reserved.');
      setByExactText('Built with Next.js & Tailwind CSS', content.footer.credit);
    }
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

  window.addEventListener('load', function () {
    setTimeout(function () {
      Promise.all([fetchJson('editable/content.json'), fetchJson('editable/media.json')]).then(([content, media]) => {
        applyContent(content);
        applyMedia(media);
      });
    }, 1000);
  });
})();
