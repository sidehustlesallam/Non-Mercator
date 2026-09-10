import { PROJECTIONS, getProjection } from '../map/Projections.js';
import { flagEmoji } from '../data/loadAtlas.js';

export function createControls({ root, store, meta, onCenterCountry }) {
  const countries = Object.values(meta).sort((a, b) => a.name.localeCompare(b.name));

  root.innerHTML = `
    <section class="control-block">
      <h2>Projection</h2>
      <label class="field">
        <span class="field-label">Map projection</span>
        <select id="projection-select" class="select"></select>
      </label>
      <p class="control-note" id="projection-note"></p>
    </section>

    <section class="control-block">
      <h2>Find a country</h2>
      <label class="field">
        <span class="field-label">Search and re-center</span>
        <input id="country-search" class="input" type="search" placeholder="e.g. Brazil, Japan, Kenya" autocomplete="off" />
      </label>
      <ul id="country-results" class="country-results" hidden></ul>
    </section>

    <section class="control-block">
      <h2>Layers</h2>
      <label class="check">
        <input type="checkbox" id="layer-cities" />
        <span>Capitals &amp; major cities</span>
      </label>
      <label class="check">
        <input type="checkbox" id="layer-graticule" />
        <span>Graticule</span>
      </label>
    </section>

    <section class="control-block is-premium">
      <h2>Premium overlays</h2>
      <p class="control-note">Registered as feature flags — hook new plugins into the FeatureRegistry without touching the renderer.</p>
      <label class="check is-disabled">
        <input type="checkbox" disabled />
        <span>Climate overlay <em>soon</em></span>
      </label>
      <label class="check is-disabled">
        <input type="checkbox" disabled />
        <span>Time zones <em>soon</em></span>
      </label>
      <label class="check is-disabled">
        <input type="checkbox" disabled />
        <span>Shipping lanes <em>soon</em></span>
      </label>
    </section>
  `;

  const selectEl = root.querySelector('#projection-select');
  const noteEl = root.querySelector('#projection-note');
  const searchEl = root.querySelector('#country-search');
  const resultsEl = root.querySelector('#country-results');
  const citiesEl = root.querySelector('#layer-cities');
  const graticuleEl = root.querySelector('#layer-graticule');
  const metaLine = document.querySelector('#projection-meta');

  for (const projection of PROJECTIONS) {
    const option = document.createElement('option');
    option.value = projection.id;
    option.textContent = projection.label;
    selectEl.append(option);
  }

  function syncProjectionCopy(id) {
    const spec = getProjection(id);
    noteEl.textContent = spec.description;
    if (metaLine) metaLine.textContent = spec.property;
    selectEl.value = id;
  }

  function renderResults(query) {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      resultsEl.hidden = true;
      resultsEl.innerHTML = '';
      return;
    }

    const matches = countries
      .filter((country) => {
        const hay = `${country.name} ${country.official} ${country.iso2 ?? ''} ${country.capital ?? ''}`.toLowerCase();
        return hay.includes(needle);
      })
      .slice(0, 12);

    resultsEl.hidden = matches.length === 0;
    resultsEl.innerHTML = matches
      .map(
        (country) => `
        <li>
          <button type="button" data-id="${country.id}">
            <span class="result-flag">${country.flag || flagEmoji(country.iso2)}</span>
            <span class="result-name">${country.name}</span>
            <span class="result-iso">${country.iso2 ?? ''}</span>
          </button>
        </li>`,
      )
      .join('');
  }

  selectEl.addEventListener('change', () => {
    store.setState({ projectionId: selectEl.value });
    syncProjectionCopy(selectEl.value);
  });

  searchEl.addEventListener('input', () => renderResults(searchEl.value));
  searchEl.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const first = resultsEl.querySelector('button[data-id]');
    if (first) {
      event.preventDefault();
      first.click();
    }
  });

  resultsEl.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    const id = button.dataset.id;
    const country = meta[id];
    searchEl.value = country?.name ?? '';
    resultsEl.hidden = true;
    onCenterCountry(id);
  });

  citiesEl.addEventListener('change', () => {
    store.setState({ layers: { cities: citiesEl.checked } });
  });
  graticuleEl.addEventListener('change', () => {
    store.setState({ layers: { graticule: graticuleEl.checked } });
  });

  function sync() {
    const state = store.getState();
    syncProjectionCopy(state.projectionId);
    citiesEl.checked = state.layers.cities && state.flags.cities;
    graticuleEl.checked = state.layers.graticule && state.flags.graticule;
    if (state.centeredCountryId && meta[state.centeredCountryId]) {
      searchEl.placeholder = meta[state.centeredCountryId].name;
    }
  }

  sync();
  let prev = store.getState();
  store.subscribe((state) => {
    if (
      state.projectionId !== prev.projectionId ||
      state.centeredCountryId !== prev.centeredCountryId ||
      state.layers.cities !== prev.layers.cities ||
      state.layers.graticule !== prev.layers.graticule
    ) {
      sync();
    }
    prev = state;
  });

  return { sync };
}
