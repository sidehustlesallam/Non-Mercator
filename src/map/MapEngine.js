import * as d3 from 'd3';
import { getProjection } from './Projections.js';
import { createAnimator } from './Animator.js';

const PAD = 28;

function landTint(id) {
  const n = Number(id) || 0;
  const hue = 152 + (n % 20) - 8;
  const light = 20 + (n % 7);
  return `hsl(${hue} 22% ${light}%)`;
}

export function createMapEngine({
  container,
  store,
  countries,
  borders,
  meta,
  cities,
}) {
  const svg = d3
    .select(container)
    .append('svg')
    .attr('class', 'map-svg')
    .attr('role', 'img')
    .attr('aria-label', 'World map');

  const defs = svg.append('defs');
  const oceanGrad = defs
    .append('radialGradient')
    .attr('id', 'ocean-glow')
    .attr('cx', '50%')
    .attr('cy', '42%')
    .attr('r', '65%');
  oceanGrad.append('stop').attr('offset', '0%').attr('stop-color', '#163042');
  oceanGrad.append('stop').attr('offset', '70%').attr('stop-color', '#0c1822');
  oceanGrad.append('stop').attr('offset', '100%').attr('stop-color', '#070d12');

  const root = svg.append('g').attr('class', 'map-root');
  const spherePath = root.append('path').attr('class', 'sphere');
  const graticulePath = root.append('path').attr('class', 'graticule');
  const countryLayer = root.append('g').attr('class', 'countries');
  const borderPath = root.append('path').attr('class', 'borders');
  const cityLayer = root.append('g').attr('class', 'cities');

  const graticule = d3.geoGraticule10();
  const sphere = { type: 'Sphere' };
  const featuresById = new Map(countries.features.map((item) => [item.id, item]));

  let projection = getProjection(store.getState().projectionId).create();
  let path = d3.geoPath(projection);
  let width = 0;
  let height = 0;

  const animator = createAnimator({
    getProjection: () => projection,
    onFrame(rotation) {
      store.setState({ rotation });
      render();
    },
    onRest(rotation) {
      store.setState({ rotation });
    },
  });

  function size() {
    const bounds = container.getBoundingClientRect();
    width = Math.max(320, Math.floor(bounds.width));
    height = Math.max(240, Math.floor(bounds.height));
    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);
  }

  function fitCurrent() {
    const spec = getProjection(store.getState().projectionId);
    projection = spec.create();
    if (spec.clipAngle) projection.clipAngle(spec.clipAngle);
    projection.fitExtent(
      [
        [PAD, PAD],
        [width - PAD, height - PAD],
      ],
      sphere,
    );
    projection.rotate(store.getState().rotation);
    if (spec.id === 'mercator') {
      projection.clipExtent([
        [0, 0],
        [width, height],
      ]);
    }
    path = d3.geoPath(projection);
  }

  function renderCountries() {
    const { centeredCountryId, hoveredCountryId } = store.getState();
    countryLayer
      .selectAll('path.country')
      .data(countries.features, (d) => d.id)
      .join('path')
      .attr('class', 'country')
      .attr('data-id', (d) => d.id)
      .classed('is-active', (d) => d.id === centeredCountryId)
      .classed('is-hovered', (d) => d.id === hoveredCountryId)
      .attr('fill', (d) =>
        d.id === centeredCountryId ? 'var(--land-active)' : landTint(d.id),
      )
      .attr('d', path);
  }

  function renderCities() {
    const state = store.getState();
    const show =
      state.flags.cities && state.layers.cities && state.flags.capitals !== false;
    const visible = show ? cities : [];

    cityLayer
      .selectAll('circle.city')
      .data(visible, (d) => `${d.iso2}:${d.name}`)
      .join('circle')
      .attr('class', (d) => `city${d.capital ? ' is-capital' : ''}${d.major ? ' is-major' : ''}`)
      .attr('r', (d) => (d.capital ? 3.4 : 2.1))
      .attr('cx', (d) => {
        const point = projection([d.lng, d.lat]);
        return point ? point[0] : -999;
      })
      .attr('cy', (d) => {
        const point = projection([d.lng, d.lat]);
        return point ? point[1] : -999;
      })
      .attr('display', (d) => (projection([d.lng, d.lat]) ? null : 'none'))
      .attr('aria-label', (d) => d.name);
  }

  function render() {
    const state = store.getState();
    spherePath.attr('d', path(sphere));
    graticulePath
      .attr('d', path(graticule))
      .attr('display', state.flags.graticule && state.layers.graticule ? null : 'none');
    renderCountries();
    borderPath.attr('d', path(borders));
    renderCities();
    svg.classed('is-globe', Boolean(getProjection(state.projectionId).globe));
  }

  countryLayer
    .selectAll('path.country')
    .data(countries.features, (d) => d.id)
    .join('path')
    .attr('class', 'country')
    .on('pointerenter', function onEnter(event, feature) {
      this.parentNode.appendChild(this);
      store.setState({ hoveredCountryId: feature.id });
      container.dispatchEvent(
        new CustomEvent('map:hover', {
          bubbles: true,
          detail: { id: feature.id, event, meta: meta[feature.id] },
        }),
      );
    })
    .on('pointermove', (event, feature) => {
      container.dispatchEvent(
        new CustomEvent('map:hover', {
          bubbles: true,
          detail: { id: feature.id, event, meta: meta[feature.id] },
        }),
      );
    })
    .on('pointerleave', () => {
      store.setState({ hoveredCountryId: null });
      container.dispatchEvent(new CustomEvent('map:leave', { bubbles: true }));
    })
    .on('click', (event, feature) => {
      event.preventDefault();
      selectCountry(feature.id);
    });

  svg.call(
    d3
      .drag()
      .clickDistance(6)
      .on('start', () => {
        animator.stop();
        container.dispatchEvent(new CustomEvent('map:leave', { bubbles: true }));
      })
      .on('drag', (event) => {
        const rotation = projection.rotate();
        const next = [rotation[0] + event.dx * 0.35, rotation[1] - event.dy * 0.35];
        projection.rotate(next);
        store.setState({ rotation: next, centeredCountryId: null });
        render();
      }),
  );

  function selectCountry(id) {
    const feature = featuresById.get(id);
    if (!feature) return;
    const centroid = d3.geoCentroid(feature);
    store.setState({ centeredCountryId: id, hoveredCountryId: id });
    container.dispatchEvent(
      new CustomEvent('map:select', {
        bubbles: true,
        detail: { id, meta: meta[id], centroid },
      }),
    );
  }

  function applyProjection(id) {
    const rotation = projection.rotate();
    store.setState({ rotation, projectionId: id });
    fitCurrent();
    render();
  }

  size();
  fitCurrent();
  render();

  const resizeObserver = new ResizeObserver(() => {
    size();
    fitCurrent();
    render();
  });
  resizeObserver.observe(container);

  let lastProjection = store.getState().projectionId;
  let lastCentered = store.getState().centeredCountryId;

  const unsubscribe = store.subscribe((state) => {
    if (state.projectionId !== lastProjection) {
      animator.stop();
      lastProjection = state.projectionId;
      fitCurrent();
    }
    if (state.centeredCountryId !== lastCentered) {
      lastCentered = state.centeredCountryId;
      if (state.centeredCountryId) {
        const feature = featuresById.get(state.centeredCountryId);
        if (feature) animator.centerOn(d3.geoCentroid(feature));
      }
    }
    render();
  });

  return {
    selectCountry,
    applyProjection,
    render,
    destroy() {
      unsubscribe();
      resizeObserver.disconnect();
      animator.stop();
      svg.remove();
    },
  };
}
