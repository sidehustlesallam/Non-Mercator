import './styles/main.css';
import { createStore, createFeatureRegistry } from './state/Store.js';
import { DEFAULT_PROJECTION_ID } from './map/Projections.js';
import { createMapEngine } from './map/MapEngine.js';
import { createControls } from './ui/Controls.js';
import { createTooltip } from './ui/Tooltip.js';
import { createSidebar } from './ui/Sidebar.js';
import { loadAtlas } from './data/loadAtlas.js';

function registerFeatures(registry) {
  registry.register({
    id: 'projectionSwitch',
    label: 'Projection switcher',
  });
  registry.register({
    id: 'countrySearch',
    label: 'Country search',
  });
  registry.register({
    id: 'tooltips',
    label: 'Hover tooltips',
  });
  registry.register({
    id: 'cities',
    label: 'City markers',
  });
  registry.register({
    id: 'graticule',
    label: 'Graticule',
  });
  registry.register({
    id: 'sidebar',
    label: 'Country sidebar',
  });
  registry.register({
    id: 'climateOverlay',
    label: 'Climate overlay',
  });
  registry.register({
    id: 'timeZones',
    label: 'Time zones',
  });
  registry.register({
    id: 'shippingLanes',
    label: 'Shipping lanes',
  });
}

async function boot() {
  const mapRoot = document.querySelector('#map');
  mapRoot.innerHTML = '<p class="map-status">Loading atlas…</p>';

  try {
    const atlas = await loadAtlas();
    mapRoot.innerHTML = '';

    const store = createStore({ projectionId: DEFAULT_PROJECTION_ID });
    const registry = createFeatureRegistry(store);
    registerFeatures(registry);
    window.__nonMercator = { store, registry };

    const map = createMapEngine({
      container: mapRoot,
      store,
      countries: atlas.countries,
      borders: atlas.borders,
      meta: atlas.meta,
      cities: atlas.cities,
    });

    createControls({
      root: document.querySelector('#controls-root'),
      store,
      meta: atlas.meta,
      onCenterCountry: (id) => map.selectCountry(id),
    });

    const tooltip = createTooltip(document.querySelector('#tooltip'));
    const sidebar = createSidebar(document.querySelector('#sidebar-root'));

    mapRoot.addEventListener('map:hover', (event) => {
      if (!store.isFeatureEnabled('tooltips')) return;
      tooltip.show(event.detail);
    });
    mapRoot.addEventListener('map:leave', () => tooltip.hide());
    mapRoot.addEventListener('map:select', (event) => {
      if (!store.isFeatureEnabled('sidebar')) return;
      sidebar.show(event.detail.meta);
    });
  } catch (error) {
    console.error(error);
    mapRoot.innerHTML =
      '<p class="map-status is-error">Could not load map data. Check the /data files and reload.</p>';
  }
}

boot();
