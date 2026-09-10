import { json } from 'd3';
import { feature as topoFeature, mesh as topoMesh } from 'topojson-client';
import { geometryCountryId } from './countryIds.js';

export async function loadAtlas() {
  const base = import.meta.env.BASE_URL;
  const [topology, meta, cities] = await Promise.all([
    json(`${base}data/countries.json`),
    json(`${base}data/country-meta.json`),
    json(`${base}data/cities.json`),
  ]);

  const countries = topoFeature(topology, topology.objects.countries);
  for (const item of countries.features) {
    item.id = geometryCountryId(item);
  }

  const borders = topoMesh(
    topology,
    topology.objects.countries,
    (a, b) => a !== b,
  );

  return { topology, countries, borders, meta, cities };
}

export function flagEmoji(iso2) {
  if (!iso2 || iso2.length !== 2) return '';
  return [...iso2.toUpperCase()]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
    Number(value),
  );
}
