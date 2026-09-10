import { flagEmoji, formatNumber } from '../data/loadAtlas.js';

export function createTooltip(root) {
  function hide() {
    root.hidden = true;
    root.innerHTML = '';
  }

  function show({ event, meta, name }) {
    if (!meta && !name) {
      hide();
      return;
    }

    const countryName = meta?.name ?? name ?? 'Unknown';
    const iso = meta?.iso2 ?? '—';
    const flag = meta?.flag || flagEmoji(meta?.iso2);
    const capital = meta?.capital ?? '—';
    const area = formatNumber(meta?.area);
    const population = formatNumber(meta?.population);

    root.hidden = false;
    root.innerHTML = `
      <div class="tooltip-head">
        <span class="tooltip-flag" aria-hidden="true">${flag || '•'}</span>
        <div>
          <strong>${countryName}</strong>
          <span class="tooltip-iso">${iso}</span>
        </div>
      </div>
      <dl class="tooltip-stats">
        <div><dt>Capital</dt><dd>${capital}</dd></div>
        <div><dt>Land area</dt><dd>${area} km²</dd></div>
        <div><dt>Population</dt><dd>${population}</dd></div>
      </dl>
    `;

    const pad = 16;
    const x = event.clientX + pad;
    const y = event.clientY + pad;
    const rect = root.getBoundingClientRect();
    const left = Math.min(x, window.innerWidth - rect.width - 12);
    const top = Math.min(y, window.innerHeight - rect.height - 12);
    root.style.transform = `translate(${Math.max(8, left)}px, ${Math.max(8, top)}px)`;
  }

  hide();
  return { show, hide };
}
