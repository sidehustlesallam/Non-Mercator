import { geoInterpolate } from 'd3-geo';
import { transition, easeCubicInOut } from 'd3';

const DURATION = 900;

/**
 * Spherical rotation interpolator. `from` / `to` are geographic [lon, lat]
 * of the point that should sit at the projection center.
 */
export function createAnimator({ getProjection, onFrame, onRest }) {
  let generation = 0;
  let active = null;

  function stop() {
    generation += 1;
    if (active) {
      active.interrupt();
      active = null;
    }
  }

  function centerOn(destination, { duration = DURATION } = {}) {
    const projection = getProjection();
    const rotation = projection.rotate();
    const origin = [-rotation[0], -rotation[1]];
    const interpolate = geoInterpolate(origin, destination);
    const token = generation + 1;
    stop();
    generation = token;

    active = transition()
      .duration(duration)
      .ease(easeCubicInOut)
      .tween('rotate', () => (t) => {
        if (token !== generation) return;
        const point = interpolate(t);
        const nextRotation = [-point[0], -point[1]];
        getProjection().rotate(nextRotation);
        onFrame(nextRotation);
      })
      .on('end', () => {
        if (token !== generation) return;
        const point = interpolate(1);
        const nextRotation = [-point[0], -point[1]];
        onRest?.(nextRotation);
        active = null;
      });

    return active;
  }

  return { centerOn, stop };
}
