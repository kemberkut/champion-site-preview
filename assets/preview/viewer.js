(() => {
  'use strict';
  const channel = 'champion-page-preview';
  const select = document.getElementById('preview-page');
  const pages = [...select.options].map(option => ({id: option.value, label: option.textContent, file: option.dataset.file}));
  const byId = new Map(pages.map(page => [page.id, page]));
  const directory = new URL('pages/', location.href);
  const byPath = new Map(pages.map(page => [new URL(page.file, directory).pathname, page]));
  const previous = document.getElementById('preview-previous');
  const next = document.getElementById('preview-next');
  const counter = document.getElementById('preview-count');
  const open = document.getElementById('preview-open');
  let frame = document.getElementById('preview-frame');
  let current;

  function readRoute() {
    const params = new URLSearchParams(location.search);
    const requested = params.get('page');
    const id = byId.has(requested) ? requested : pages[0].id;
    params.delete('page');
    return {id, search: params.size ? '?' + params.toString() : '', hash: location.hash};
  }

  function frameUrl(route) {
    const url = new URL(byId.get(route.id).file, directory);
    url.search = route.search;
    url.hash = route.hash;
    return url;
  }

  function routeFromUrl(value) {
    try {
      const url = new URL(value);
      const page = byPath.get(url.pathname);
      if (!page || url.protocol !== directory.protocol || url.host !== directory.host) return null;
      return {id: page.id, search: url.search, hash: url.hash};
    } catch {
      return null;
    }
  }

  function writeRoute(route, mode) {
    if (mode === 'none') return;
    const url = new URL(location.href);
    const params = new URLSearchParams([['page', route.id]]);
    new URLSearchParams(route.search).forEach((value, key) => {
      if (key !== 'page') params.append(key, value);
    });
    url.search = params.toString();
    url.hash = route.hash;
    if (url.href !== location.href) history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', url);
  }

  function updateBar(route) {
    const index = pages.findIndex(page => page.id === route.id);
    const page = pages[index];
    select.value = route.id;
    counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + pages.length;
    previous.disabled = index === 0;
    next.disabled = index === pages.length - 1;
    previous.title = index > 0 ? 'Предыдущая: ' + pages[index - 1].label : 'Первая страница';
    next.title = index < pages.length - 1 ? 'Следующая: ' + pages[index + 1].label : 'Последняя страница';
    open.href = frameUrl(route).href;
    document.title = page.label + ' — ChampionLED';
  }

  function show(route, mode = 'push') {
    if (!byId.has(route.id)) return;
    current = route;
    updateBar(route);
    writeRoute(route, mode);
    // A new browsing context keeps frame navigation out of the browser's Back stack.
    const replacement = document.createElement('iframe');
    replacement.id = 'preview-frame';
    replacement.name = 'preview-frame';
    replacement.className = 'ch-preview-frame';
    replacement.title = byId.get(route.id).label + ' — ChampionLED';
    replacement.src = frameUrl(route).href;
    frame.replaceWith(replacement);
    frame = replacement;
  }

  select.addEventListener('change', () => show({id: select.value, search: '', hash: ''}));
  previous.addEventListener('click', () => {
    const index = pages.findIndex(page => page.id === current.id);
    if (index > 0) show({id: pages[index - 1].id, search: '', hash: ''});
  });
  next.addEventListener('click', () => {
    const index = pages.findIndex(page => page.id === current.id);
    if (index < pages.length - 1) show({id: pages[index + 1].id, search: '', hash: ''});
  });
  document.getElementById('preview-home').addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    show({id: pages[0].id, search: '', hash: ''});
  });
  window.addEventListener('popstate', () => show(readRoute(), 'none'));
  window.addEventListener('message', event => {
    const data = event.data;
    if (event.source !== frame.contentWindow || !data || data.channel !== channel) return;
    const route = routeFromUrl(data.url);
    if (!route) return;
    if (data.kind === 'navigate') {
      show(route);
    } else if (data.kind === 'state') {
      current = route;
      updateBar(route);
      writeRoute(route, data.history === 'push' ? 'push' : 'replace');
    }
  });
  show(readRoute(), 'replace');
})();
