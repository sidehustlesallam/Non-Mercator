import { flagEmoji, formatNumber } from '../data/loadAtlas.js';

export function createSidebar(root) {
  function hide() {
    root.hidden = true;
    root.innerHTML = '';
  }

  function show(meta) {
    if (!meta) {
      hide();
      return;
    }

    const flag = meta.flag || flagEmoji(meta.iso2);
    root.hidden = false;
    root.innerHTML = `
      <div class="sidebar-head">
        <span class="sidebar-flag">${flag || '•'}</span>
        <div>
          <p class="sidebar-kicker">${meta.region ?? 'World'}${meta.subregion ? ` · ${meta.subregion}` : ''}</p>
          <h2>${meta.name}</h2>
          <p class="sidebar-official">${meta.official}</p>
        </div>
      </div>
      <dl class="sidebar-stats">
        <div>
          <dt>ISO</dt>
          <dd>${meta.iso2 ?? '—'} / ${meta.iso3 ?? '—'}</dd>
        </div>
        <div>
          <dt>Capital</dt>
          <dd>${meta.capital ?? '—'}</dd>
        </div>
        <div>
          <dt>Land area</dt>
          <dd>${formatNumber(meta.area)} km²</dd>
        </div>
        <div>
          <dt>Population</dt>
          <dd>${formatNumber(meta.population)}</dd>
        </div>
      </dl>
      <p class="sidebar-foot">Centered with a great-circle interpolation so the country sits on the projection origin.</p>
    `;
  }

  hide();
  return { show, hide };
}
