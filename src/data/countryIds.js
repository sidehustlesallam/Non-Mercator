export const SYNTHETIC_COUNTRY_IDS = {
  'N. Cyprus': 'ncy',
  'Somaliland': 'sml',
  'Kosovo': '983',
};

export function geometryCountryId(geometry) {
  const raw = geometry.id;
  if (
    raw != null &&
    String(raw) !== '' &&
    String(raw) !== 'undefined' &&
    String(raw) !== 'null'
  ) {
    return String(raw).padStart(3, '0');
  }
  const name = geometry.properties?.name;
  return SYNTHETIC_COUNTRY_IDS[name] ?? name ?? 'unk';
}
