/* Connect a page to the shared viewer; direct standalone pages stay unchanged. */
(() => {
  'use strict';
  if (window.parent === window) return;
  const channel = 'champion-page-preview';
  const directory = new URL('./', location.href);
  function send(kind, url = location.href, history = 'replace') {
    window.parent.postMessage({channel, kind, url, history}, '*');
  }
  function localPage(url) {
    return url.protocol === directory.protocol && url.host === directory.host &&
      url.pathname.startsWith(directory.pathname) &&
      !url.pathname.slice(directory.pathname.length).includes('/') && url.pathname.endsWith('.html');
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    let url;
    try { url = new URL(link.href, location.href); } catch { return; }
    if (localPage(url)) {
      event.preventDefault();
      send('navigate', url.href, 'push');
    } else if (url.protocol === 'http:' || url.protocol === 'https:') {
      link.target = '_blank';
      link.rel = 'noopener';
    }
  });
  ['pushState', 'replaceState'].forEach(method => {
    const original = history[method];
    history[method] = function(...args) {
      const result = original.apply(this, args);
      send('state', location.href, method === 'pushState' ? 'push' : 'replace');
      return result;
    };
  });
  window.addEventListener('hashchange', () => send('state', location.href, 'push'));
  window.addEventListener('popstate', () => send('state'));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => send('state'), {once: true});
  else send('state');
})();
