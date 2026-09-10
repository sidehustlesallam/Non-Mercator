/**
 * One-shot generator used to build public/data/country-meta.json and cities.json.
 * Requires temporary copies of world-countries and country-by-population JSON
 * in this folder; those sources are not committed.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { geometryCountryId } from '../src/data/countryIds.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const topo = JSON.parse(readFileSync(join(root, 'public/data/countries.json'), 'utf8'));
const world = JSON.parse(readFileSync(join(root, 'scripts/world-countries.json'), 'utf8'));
const populationRows = JSON.parse(readFileSync(join(root, 'scripts/population.json'), 'utf8'));

const byCcn3 = new Map();
const byCca2 = new Map();
const byName = new Map();

for (const country of world) {
  byCcn3.set(String(country.ccn3).padStart(3, '0'), country);
  byCca2.set(country.cca2, country);
  byName.set(country.name.common.toLowerCase(), country);
  byName.set(country.name.official.toLowerCase(), country);
}

const popByName = new Map();
for (const row of populationRows) {
  popByName.set(row.country.toLowerCase(), row.population);
}

const NAME_ALIASES = {
  'united states of america': 'united states',
  'w. sahara': 'western sahara',
  'timor-leste': 'east timor',
  'dr congo': 'congo',
  'dem. rep. congo': 'congo',
  'fiji': 'fiji',
  'central african rep.': 'central african republic',
  's. sudan': 'south sudan',
  "côte d'ivoire": "cote d'ivoire",
  'bosnia and herz.': 'bosnia and herzegovina',
  'czech republic': 'czechia',
  'eq. guinea': 'equatorial guinea',
  'solomon is.': 'solomon islands',
  'falkland is.': 'falkland islands',
  'fr. s. antarctic lands': 'french southern territories',
  'eSwatini': 'swaziland',
  'eswatini': 'swaziland',
  'n. cyprus': 'cyprus',
  'somaliland': 'somalia',
  'kosovo': 'kosovo',
  'palestine': 'palestine',
  'myanmar': 'myanmar',
  'laos': "lao people's democratic republic",
  'north korea': "korea (democratic people's republic of)",
  'south korea': 'korea (republic of)',
  'russia': 'russian federation',
  'syria': 'syrian arab republic',
  'venezuela': 'venezuela (bolivarian republic of)',
  'tanzania': 'tanzania, united republic of',
  'bolivia': 'bolivia (plurinational state of)',
  'iran': 'iran (islamic republic of)',
  'moldova': 'moldova (republic of)',
  'macedonia': 'north macedonia',
  'north macedonia': 'north macedonia',
  'brunei': 'brunei darussalam',
  'vietnam': 'viet nam',
  'taiwan': 'taiwan',
  'dominican rep.': 'dominican republic',
};

function lookupPopulation(names) {
  for (const name of names) {
    if (!name) continue;
    const key = name.toLowerCase();
    if (popByName.has(key)) return popByName.get(key);
    if (NAME_ALIASES[key] && popByName.has(NAME_ALIASES[key])) {
      return popByName.get(NAME_ALIASES[key]);
    }
  }
  return null;
}

/**
 * Accurate capital city coordinates [lng, lat] keyed by ISO 3166-1 alpha-2.
 * Used for city markers; country re-centering still uses polygon centroids.
 */
const CAPITAL_COORDS = {
  AF: [69.1723, 34.5553], AL: [19.8189, 41.3275], DZ: [3.0588, 36.7538], AO: [13.2344, -8.8383],
  AR: [-58.3816, -34.6037], AM: [44.5152, 40.1872], AU: [149.1300, -35.2809], AT: [16.3738, 48.2082],
  AZ: [49.8671, 40.4093], BH: [50.5832, 26.2235], BD: [90.4125, 23.8103], BY: [27.5615, 53.9045],
  BE: [4.3517, 50.8503], BZ: [-88.7713, 17.2510], BJ: [2.3158, 6.3703], BT: [89.6339, 27.4712],
  BO: [-68.1193, -16.4897], BA: [18.4131, 43.8563], BW: [25.9231, -24.6282], BR: [-47.8825, -15.7942],
  BN: [114.9425, 4.9031], BG: [23.3219, 42.6977], BF: [-1.5197, 12.3714], BI: [29.3639, -3.3614],
  KH: [104.9282, 11.5564], CM: [11.5021, 3.8480], CA: [-75.6972, 45.4215], CF: [18.5582, 4.3947],
  TD: [15.0444, 12.1348], CL: [-70.6693, -33.4489], CN: [116.4074, 39.9042], CO: [-74.0721, 4.7110],
  CG: [15.2663, -4.2634], CD: [15.2663, -4.4419], CR: [-84.0907, 9.9281], CI: [-5.5471, 6.8276],
  HR: [15.9819, 45.8150], CU: [-82.3666, 23.1136], CY: [33.3823, 35.1856], CZ: [14.4378, 50.0755],
  DK: [12.5683, 55.6761], DJ: [43.1456, 11.5721], DO: [-69.9312, 18.4861], EC: [-78.4678, -0.1807],
  EG: [31.2357, 30.0444], SV: [-89.2182, 13.6929], GQ: [8.7742, 3.7504], ER: [38.9251, 15.3229],
  EE: [24.7536, 59.4370], SZ: [31.1367, -26.3054], ET: [38.7578, 9.0320], FJ: [178.4419, -18.1416],
  FI: [24.9384, 60.1699], FR: [2.3522, 48.8566], GA: [9.4537, 0.3901], GM: [-16.5790, 13.4549],
  GE: [44.7833, 41.7151], DE: [13.4050, 52.5200], GH: [-0.1870, 5.6037], GR: [23.7275, 37.9838],
  GL: [-51.7216, 64.1814], GT: [-90.5069, 14.6349], GN: [-13.5784, 9.6412], GW: [-15.5982, 11.8816],
  GY: [-58.1551, 6.8013], HT: [-72.3074, 18.5944], HN: [-87.2068, 14.0723], HU: [19.0402, 47.4979],
  IS: [-21.9426, 64.1466], IN: [77.2090, 28.6139], ID: [106.8456, -6.2088], IR: [51.3890, 35.6892],
  IQ: [44.3661, 33.3152], IE: [-6.2603, 53.3498], IL: [35.2137, 31.7683], IT: [12.4964, 41.9028],
  JM: [-76.7936, 18.0179], JP: [139.6503, 35.6762], JO: [35.9106, 31.9539], KZ: [71.4704, 51.1605],
  KE: [36.8219, -1.2921], KP: [125.7625, 39.0392], KR: [126.9780, 37.5665], XK: [21.1655, 42.6629],
  KW: [47.9774, 29.3759], KG: [74.5698, 42.8746], LA: [102.6331, 17.9757], LV: [24.1052, 56.9496],
  LB: [35.5018, 33.8938], LS: [27.5144, -29.3151], LR: [-10.7605, 6.2907], LY: [13.1913, 32.8872],
  LT: [25.2797, 54.6872], LU: [6.1319, 49.6116], MG: [47.5079, -18.8792], MW: [33.7741, -13.9626],
  MY: [101.6869, 3.1390], ML: [-8.0029, 12.6392], MR: [-15.9657, 18.0735], MX: [-99.1332, 19.4326],
  MD: [28.8638, 47.0105], MN: [106.9057, 47.8864], ME: [19.2594, 42.4304], MA: [-6.8498, 33.9716],
  MZ: [32.6051, -25.9692], MM: [96.1951, 16.8409], NA: [17.0658, -22.5609], NP: [85.3240, 27.7172],
  NL: [4.9041, 52.3676], NC: [166.4580, -22.2758], NZ: [174.7787, -41.2865], NI: [-86.2362, 12.1150],
  NE: [2.1098, 13.5137], NG: [7.4951, 9.0765], MK: [21.4254, 41.9981], NO: [10.7522, 59.9139],
  OM: [58.4059, 23.5859], PK: [73.0479, 33.6844], PA: [-79.5199, 8.9824], PG: [147.1803, -9.4438],
  PY: [-57.5759, -25.2637], PE: [-77.0428, -12.0464], PH: [120.9842, 14.5995], PL: [21.0122, 52.2297],
  PT: [-9.1393, 38.7223], PR: [-66.1057, 18.4655], QA: [51.5310, 25.2854], RO: [26.1025, 44.4268],
  RU: [37.6173, 55.7558], RW: [30.0619, -1.9441], SA: [46.6753, 24.7136], SN: [-17.4467, 14.7167],
  RS: [20.4489, 44.7866], SL: [-13.2317, 8.4657], SK: [17.1077, 48.1486], SI: [14.5058, 46.0569],
  SB: [159.9729, -9.4456], SO: [45.3182, 2.0469], ZA: [28.2293, -25.7479], SS: [31.5820, 4.8594],
  ES: [-3.7038, 40.4168], LK: [79.8612, 6.9271], SD: [32.5599, 15.5007], SR: [-55.2038, 5.8520],
  SE: [18.0686, 59.3293], CH: [7.4474, 46.9480], SY: [36.2765, 33.5138], TW: [121.5654, 25.0330],
  TJ: [68.7870, 38.5598], TZ: [35.7516, -6.1630], TH: [100.5018, 13.7563], TL: [125.5736, -8.5569],
  TG: [1.2255, 6.1256], TT: [-61.5086, 10.6600], TN: [10.1815, 36.8065], TR: [32.8597, 39.9334],
  TM: [58.3833, 37.9601], UG: [32.5825, 0.3476], UA: [30.5234, 50.4501], AE: [54.3773, 24.4539],
  GB: [-0.1276, 51.5074], US: [-77.0369, 38.9072], UY: [-56.1645, -34.9011], UZ: [69.2401, 41.2995],
  VU: [168.3273, -17.7333], VE: [-66.9036, 10.4806], VN: [105.8342, 21.0278], EH: [-13.2033, 27.1536],
  YE: [44.1910, 15.3694], ZM: [28.3228, -15.3875], ZW: [31.0530, -17.8292],
  PS: [35.2033, 31.8980], SG: [103.8198, 1.3521], FK: [-57.85, -51.7],
  BS: [-77.3554, 25.0443], MV: [73.5093, 4.1755], MT: [14.5146, 35.8989],
};

const MAJOR_CITIES = [
  { name: 'New York', iso2: 'US', lng: -74.006, lat: 40.7128 },
  { name: 'Los Angeles', iso2: 'US', lng: -118.2437, lat: 34.0522 },
  { name: 'Chicago', iso2: 'US', lng: -87.6298, lat: 41.8781 },
  { name: 'Houston', iso2: 'US', lng: -95.3698, lat: 29.7604 },
  { name: 'Toronto', iso2: 'CA', lng: -79.3832, lat: 43.6532 },
  { name: 'Vancouver', iso2: 'CA', lng: -123.1207, lat: 49.2827 },
  { name: 'São Paulo', iso2: 'BR', lng: -46.6333, lat: -23.5505 },
  { name: 'Rio de Janeiro', iso2: 'BR', lng: -43.1729, lat: -22.9068 },
  { name: 'Mexico City', iso2: 'MX', lng: -99.1332, lat: 19.4326 },
  { name: 'Shanghai', iso2: 'CN', lng: 121.4737, lat: 31.2304 },
  { name: 'Guangzhou', iso2: 'CN', lng: 113.2644, lat: 23.1291 },
  { name: 'Hong Kong', iso2: 'CN', lng: 114.1694, lat: 22.3193 },
  { name: 'Mumbai', iso2: 'IN', lng: 72.8777, lat: 19.076 },
  { name: 'Kolkata', iso2: 'IN', lng: 88.3639, lat: 22.5726 },
  { name: 'Bengaluru', iso2: 'IN', lng: 77.5946, lat: 12.9716 },
  { name: 'Osaka', iso2: 'JP', lng: 135.5023, lat: 34.6937 },
  { name: 'Sydney', iso2: 'AU', lng: 151.2093, lat: -33.8688 },
  { name: 'Melbourne', iso2: 'AU', lng: 144.9631, lat: -37.8136 },
  { name: 'Johannesburg', iso2: 'ZA', lng: 28.0473, lat: -26.2041 },
  { name: 'Lagos', iso2: 'NG', lng: 3.3792, lat: 6.5244 },
  { name: 'Cairo', iso2: 'EG', lng: 31.2357, lat: 30.0444 },
  { name: 'Istanbul', iso2: 'TR', lng: 28.9784, lat: 41.0082 },
  { name: 'Dubai', iso2: 'AE', lng: 55.2708, lat: 25.2048 },
  { name: 'Karachi', iso2: 'PK', lng: 67.0011, lat: 24.8607 },
  { name: 'Moscow', iso2: 'RU', lng: 37.6173, lat: 55.7558 },
  { name: 'Saint Petersburg', iso2: 'RU', lng: 30.3609, lat: 59.9311 },
  { name: 'London', iso2: 'GB', lng: -0.1276, lat: 51.5074 },
  { name: 'Paris', iso2: 'FR', lng: 2.3522, lat: 48.8566 },
  { name: 'Frankfurt', iso2: 'DE', lng: 8.6821, lat: 50.1109 },
  { name: 'Milan', iso2: 'IT', lng: 9.19, lat: 45.4642 },
  { name: 'Barcelona', iso2: 'ES', lng: 2.1734, lat: 41.3851 },
  { name: 'Singapore', iso2: 'SG', lng: 103.8198, lat: 1.3521 },
];

const POPULATION_OVERRIDES = {
  '010': 4400, // Antarctica (seasonal)
  '732': 582000, // Western Sahara
  '275': 5483000, // Palestine
  '158': 23400000, // Taiwan
  '408': 26160000, // North Korea
  '728': 11190000, // South Sudan
  '090': 734000, // Solomon Islands
  '304': 56600, // Greenland
  '540': 271000, // New Caledonia
  '630': 3260000, // Puerto Rico
  '180': 105700000, // DR Congo
  '242': 926276, // Fiji
  '626': 1343872, // Timor-Leste
  '983': 1873000, // Kosovo
  ncy: 382830, // Northern Cyprus
  sml: 5700000, // Somaliland
};

const geometries = topo.objects.countries.geometries;
const meta = {};
const cities = [];
const usedCityKeys = new Set();

function addCity(city) {
  const key = `${city.name}|${city.iso2}`;
  if (usedCityKeys.has(key)) {
    const existing = cities.find((row) => `${row.name}|${row.iso2}` === key);
    if (existing && city.major) existing.major = true;
    return;
  }
  usedCityKeys.add(key);
  cities.push(city);
}

for (const geometry of geometries) {
  const id = geometryCountryId(geometry);
  const topoName = geometry.properties?.name ?? 'Unknown';
  const record =
    byCcn3.get(id) ??
    byName.get(topoName.toLowerCase()) ??
    byName.get(
      { 'n. cyprus': 'northern cyprus', somaliland: 'somalia', kosovo: 'kosovo' }[
        topoName.toLowerCase()
      ],
    );

  const iso2 = record?.cca2 ?? null;
  const iso3 = record?.cca3 ?? null;
  const capital = record?.capital?.[0] ?? null;
  const area = record?.area ?? null;
  const region = record?.region ?? null;
  const subregion = record?.subregion ?? null;
  const flag = record?.flag ?? null;
  const official = record?.name?.official ?? topoName;

  const population =
    POPULATION_OVERRIDES[id] ??
    lookupPopulation([
      record?.name?.common,
      record?.name?.official,
      topoName,
      NAME_ALIASES[topoName.toLowerCase()],
    ]);

  meta[id] = {
    id,
    name: record?.name?.common ?? topoName,
    official,
    iso2,
    iso3,
    capital,
    area,
    population,
    region,
    subregion,
    flag,
    topoName,
  };

  if (iso2 && capital) {
    const coords = CAPITAL_COORDS[iso2];
    const lngLat = coords ?? (
      Array.isArray(record?.latlng)
        ? [record.latlng[1], record.latlng[0]]
        : null
    );
    if (lngLat) {
      addCity({
        name: capital,
        iso2,
        countryId: id,
        lng: lngLat[0],
        lat: lngLat[1],
        capital: true,
        major: false,
      });
    }
  }
}

if (meta.ncy) {
  Object.assign(meta.ncy, {
    name: 'Northern Cyprus',
    official: 'Turkish Republic of Northern Cyprus',
    capital: 'North Nicosia',
    area: 3355,
    region: 'Asia',
    subregion: 'Western Asia',
  });
  addCity({
    name: 'North Nicosia',
    iso2: 'CY',
    countryId: 'ncy',
    lng: 33.364,
    lat: 35.197,
    capital: true,
    major: false,
  });
}
if (meta.sml) {
  Object.assign(meta.sml, {
    name: 'Somaliland',
    official: 'Republic of Somaliland',
    capital: 'Hargeisa',
    area: 176120,
    region: 'Africa',
    subregion: 'Eastern Africa',
  });
  addCity({
    name: 'Hargeisa',
    iso2: 'SO',
    countryId: 'sml',
    lng: 44.065,
    lat: 9.56,
    capital: true,
    major: false,
  });
}

for (const city of MAJOR_CITIES) {
  const record = byCca2.get(city.iso2);
  const countryId = record?.ccn3 ? String(record.ccn3).padStart(3, '0') : null;
  if (!countryId || !meta[countryId]) continue;
  addCity({
    name: city.name,
    iso2: city.iso2,
    countryId,
    lng: city.lng,
    lat: city.lat,
    capital: city.name === meta[countryId].capital,
    major: true,
  });
}

cities.sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(join(root, 'public/data/country-meta.json'), JSON.stringify(meta));
writeFileSync(join(root, 'public/data/cities.json'), JSON.stringify(cities));

const missingPop = Object.values(meta).filter((row) => row.population == null).map((row) => row.name);
const missingIso = Object.values(meta).filter((row) => !row.iso2).map((row) => row.name);
console.log(`Wrote ${Object.keys(meta).length} countries, ${cities.length} cities.`);
console.log(`Missing population (${missingPop.length}):`, missingPop.join(', ') || 'none');
console.log(`Missing ISO (${missingIso.length}):`, missingIso.join(', ') || 'none');
