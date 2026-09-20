(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const tags = new Set(['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse']);
  const attributes = new Set(['d', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'width', 'height', 'rx', 'ry', 'points']);
  function safeHref(value) {
    const href = String(value || '').trim();
    if (!href || /[\u0000-\u0020]/.test(href)) return '';
    if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
    return !/^[^/?#]*:/.test(href) && !href.startsWith('//') && !href.includes('\\') ? href : '';
  }
  function makeIcon(icon, base) {
    icon = icon || { type: 'text', text: '↗' };
    let node;
    const brandAsset = icon.type === 'brand' && window.NM_SOCIAL_ICONS?.icons[icon.name]?.src;
    if (brandAsset) {
      node = document.createElement('img');
      const url = new URL(brandAsset, base || new URL('../../', document.querySelector('script[src*="site-polish/contact-library.js"]').src)).href;
      node.alt = '';
      node.style.cssText = 'display:block;object-fit:contain;filter:grayscale(1);border-radius:2px';
      node.src = url;
    } else if (icon.type === 'image' && (safeHref(icon.src) || /^blob:/.test(icon.src || ''))) {
      node = document.createElement('img');
      node.src = new URL(icon.src, base || location.href).href;
      node.alt = '';
      node.style.objectFit = 'contain';
    } else if (icon.type === 'brand' || icon.type === 'lucide') {
      node = document.createElementNS(NS, 'svg');
      node.setAttribute('viewBox', '0 0 24 24');
      const brand = window.NM_SOCIAL_ICONS?.icons[icon.name];
      const nodes = icon.type === 'brand' && brand ? [['path', {d:brand.path}]] : icon.nodes;
      node.setAttribute('fill', icon.type === 'brand' ? 'currentColor' : 'none');
      if (icon.type !== 'brand') {
        node.setAttribute('stroke', 'currentColor');
        node.setAttribute('stroke-width', '1.75');
        node.setAttribute('stroke-linecap', 'round');
        node.setAttribute('stroke-linejoin', 'round');
      }
      (Array.isArray(nodes) ? nodes : []).slice(0, 80).forEach(([tag, attrs]) => {
        if (!tags.has(tag)) return;
        const child = document.createElementNS(NS, tag);
        Object.entries(attrs || {}).forEach(([key, value]) => { if (attributes.has(key)) child.setAttribute(key, String(value)); });
        node.appendChild(child);
      });
    } else {
      node = document.createElement('span');
      node.textContent = String(icon.text || '↗').slice(0, 6);
      node.style.cssText = 'display:inline-grid;place-items:center;font:600 12px/1 sans-serif;letter-spacing:0';
    }
    node.classList.add('contact-custom-icon');
    node.style.width = '18px'; node.style.height = '18px'; node.style.flexShrink = '0';
    node.setAttribute('aria-hidden', 'true');
    return node;
  }
  window.NM_CONTACT_LIBRARY = Object.freeze({makeIcon, safeHref, contactAction: link => link.action === 'copy' || link.action === 'link' ? link.action : link.icon?.name === 'wechat' ? 'copy' : 'link'});
})();
