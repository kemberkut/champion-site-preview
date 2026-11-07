/* Original location data and map behavior, assembled with the current UI KIT. */
(() => {
  'use strict';
  const locations = {
    moscow: {
      city: 'Москва', type: 'ГОЛОВНОЙ ОФИС', name: '«Красносельская»',
      address: ['3-й Красносельский переулок,', 'д. 19, стр. 11'],
      hours: 'По будням · 10:00–18:00', phone: '+7 (495) 109-23-00',
      tel: '+74951092300', email: 'order@championled.ru', point: [55.784859, 37.656071],
      photo: '../assets/contacts/moscow.webp',
      photoAlt: 'Головной офис — Москва. Фото с действующего сайта ChampionLED',
      mapUrl: 'https://yandex.ru/maps/213/moscow/?ll=37.656071%2C55.784859&mode=whatshere&whatshere%5Bpoint%5D=37.656071%2C55.784859&whatshere%5Bzoom%5D=19&z=17'
    },
    spb: {
      city: 'Санкт-Петербург', type: 'ДИСТРИБЬЮТОР', name: '«Василеостровский»',
      address: ['ул. Железноводская, д. 3,', 'секция 37'],
      hours: 'Ежедневно · 10:00–19:00', phone: '+7 (812) 646-50-88',
      tel: '+78126465088', email: 'spb@championled.ru', point: [59.952638, 30.256897],
      photo: '../assets/contacts/spb.webp',
      photoAlt: 'Пространство дистрибьютора — Санкт-Петербург. Фото с действующего сайта ChampionLED',
      mapUrl: 'https://yandex.ru/maps/org/ledmonster/1554111611/'
    }
  };
  const validCity = key => Object.prototype.hasOwnProperty.call(locations, key);
  const initialCity = new URLSearchParams(location.search).get('city');
  let current = validCity(initialCity) ? initialCity : 'moscow';
  let map = null;
  let mapMode = 'city';
  let availabilityTimer;
  const markers = {};
  const buttons = [...document.querySelectorAll('[data-city]')];
  const mapElement = document.getElementById('contact-map');
  const preview = document.getElementById('map-preview');
  const fallback = document.getElementById('map-fallback');
  const showAllButton = document.getElementById('map-show-all');
  const photo = document.getElementById('location-photo');

  function updateMapAvailability() {
    const visibleTiles = [...mapElement.querySelectorAll('img.leaflet-tile-loaded')];
    const hasTiles = visibleTiles.some(tile => tile.complete && tile.naturalWidth > 0);
    preview.hidden = hasTiles || current !== 'moscow' || mapMode !== 'city';
    fallback.hidden = hasTiles;
    mapElement.dataset.mapState = hasTiles ? 'ready' : 'fallback';
  }

  function selectCity(key, {updateUrl = true, focusMap = true} = {}) {
    if (!validCity(key)) key = 'moscow';
    current = key;
    mapMode = 'city';
    const data = locations[key];
    buttons.forEach(button => {
      const active = button.dataset.city === key;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('ch-tab--active', active);
    });
    ['type', 'city', 'name', 'hours'].forEach(field => {
      document.querySelector(`[data-location-field="${field}"]`).textContent = data[field];
    });
    const address = document.querySelector('[data-location-field="address"]');
    address.replaceChildren(document.createTextNode(data.address[0]), document.createElement('br'), document.createTextNode(data.address[1]));
    const phone = document.querySelector('[data-location-phone]');
    phone.textContent = data.phone;
    phone.href = `tel:${data.tel}`;
    const email = document.querySelector('[data-location-email]');
    email.textContent = data.email;
    email.href = `mailto:${data.email}`;
    document.querySelectorAll('[data-location-route]').forEach(link => { link.href = data.mapUrl; });
    document.getElementById('visit-call').href = `tel:${data.tel}`;
    photo.src = data.photo;
    photo.alt = data.photoAlt;
    document.getElementById('photo-city').textContent = data.city;
    document.getElementById('photo-location').textContent = data.name;
    mapElement.setAttribute('aria-label', `Интерактивная карта: ${data.city} — ${data.name}`);
    preview.hidden = key !== 'moscow';
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('city', key);
      history.replaceState(null, '', url);
    }
    if (map) {
      Object.entries(markers).forEach(([city, marker]) => {
        marker.getElement()?.classList.toggle('is-selected', city === key);
        marker.closeTooltip();
      });
      if (focusMap) {
        map.setView(data.point, 16, {animate: false});
        markers[key].openPopup();
      }
      clearTimeout(availabilityTimer);
      availabilityTimer = setTimeout(updateMapAvailability, 4000);
    }
  }

  buttons.forEach(button => button.addEventListener('click', () => selectCity(button.dataset.city)));
  window.addEventListener('popstate', () => {
    selectCity(new URLSearchParams(location.search).get('city'), {updateUrl: false});
  });
  selectCity(current, {updateUrl: false});

  if (!window.L) {
    updateMapAvailability();
    showAllButton.hidden = true;
    return;
  }

  map = L.map(mapElement, {scrollWheelZoom: false, zoomControl: false, attributionControl: true}).setView(locations[current].point, 16);
  L.control.zoom({position: 'topright', zoomInTitle: 'Приблизить', zoomOutTitle: 'Отдалить'}).addTo(map);
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  });
  tiles.on('load', updateMapAvailability);
  tiles.addTo(map);
  availabilityTimer = setTimeout(updateMapAvailability, 4000);

  Object.entries(locations).forEach(([key, data], index) => {
    const icon = L.divIcon({
      className: 'ch-contact-marker' + (key === current ? ' is-selected' : ''),
      html: `<span><b>${index + 1}</b></span>`,
      iconSize: [36, 42], iconAnchor: [18, 42], popupAnchor: [0, -38]
    });
    const marker = L.marker(data.point, {icon, title: `${data.city} — ${data.name}`, alt: `Выбрать локацию: ${data.city}`, keyboard: true}).addTo(map);
    const popup = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = `${data.city} · ${data.name}`;
    popup.append(title, document.createTextNode(data.address.join(' ')), document.createElement('br'), document.createTextNode(data.hours));
    marker.bindPopup(popup, {maxWidth: 280, autoPan: false});
    marker.on('popupopen', () => {
      const close = marker.getPopup()?.getElement()?.querySelector('.leaflet-popup-close-button');
      if (close) { close.setAttribute('aria-label', 'Закрыть подсказку'); close.title = 'Закрыть подсказку'; }
    });
    marker.bindTooltip(data.city, {direction: 'bottom', offset: [0, 7]});
    marker.getElement()?.setAttribute('aria-label', `Выбрать локацию: ${data.city}`);
    marker.on('click', () => selectCity(key));
    markers[key] = marker;
  });

  showAllButton.disabled = false;
  showAllButton.addEventListener('click', () => {
    mapMode = 'all';
    preview.hidden = true;
    map.closePopup();
    map.fitBounds(Object.values(locations).map(data => data.point), {padding: [60, 60], animate: false});
    Object.values(markers).forEach(marker => marker.openTooltip());
    clearTimeout(availabilityTimer);
    availabilityTimer = setTimeout(updateMapAvailability, 4000);
  });
  if (window.ResizeObserver) {
    new ResizeObserver(() => map.invalidateSize({animate: false})).observe(mapElement);
  }
})();
