import {
  geoMercator,
  geoOrthographic,
  geoEqualEarth,
  geoEquirectangular,
} from 'd3-geo';
import { geoRobinson, geoWinkel3, geoMollweide } from 'd3-geo-projection';

export const PROJECTIONS = [
  {
    id: 'mercator',
    label: 'Mercator',
    description: 'Standard cylindrical baseline — conformal, inflates area toward the poles.',
    property: 'Conformal cylindrical',
    create: () => geoMercator(),
  },
  {
    id: 'orthographic',
    label: 'Orthographic (3D Globe)',
    description: 'Perspective globe showing a single hemisphere.',
    property: 'Azimuthal perspective',
    globe: true,
    clipAngle: 90,
    create: () => geoOrthographic().clipAngle(90),
  },
  {
    id: 'robinson',
    label: 'Robinson',
    description: 'Compromise reference projection used in many 20th-century atlases.',
    property: 'Compromise',
    create: () => geoRobinson(),
  },
  {
    id: 'winkel-tripel',
    label: 'Winkel Tripel',
    description: 'National Geographic’s world map standard since 1998.',
    property: 'Compromise (NGS)',
    create: () => geoWinkel3(),
  },
  {
    id: 'equal-earth',
    label: 'Equal Earth',
    description: 'Equal-area compromise designed as a visually familiar alternative to Mercator.',
    property: 'Equal-area',
    create: () => geoEqualEarth(),
  },
  {
    id: 'mollweide',
    label: 'Mollweide',
    description: 'Elliptical equal-area projection that preserves true relative size.',
    property: 'Equal-area elliptical',
    create: () => geoMollweide(),
  },
  {
    id: 'equirectangular',
    label: 'Equirectangular',
    description: 'Plate Carrée — equidistant cylindrical, the simplest geographic grid.',
    property: 'Equidistant cylindrical',
    create: () => geoEquirectangular(),
  },
];

export const DEFAULT_PROJECTION_ID = 'equal-earth';

export function getProjection(id) {
  return PROJECTIONS.find((item) => item.id === id) ?? PROJECTIONS[0];
}
