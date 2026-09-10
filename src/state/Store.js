const DEFAULT_FLAGS = {
  cities: true,
  capitals: true,
  tooltips: true,
  countrySearch: true,
  projectionSwitch: true,
  sidebar: true,
  graticule: true,
  climateOverlay: false,
  timeZones: false,
  shippingLanes: false,
  populationChoropleth: false,
};

const DEFAULT_STATE = {
  projectionId: 'equal-earth',
  centeredCountryId: null,
  hoveredCountryId: null,
  rotation: [0, -12],
  layers: {
    cities: true,
    graticule: true,
  },
  flags: { ...DEFAULT_FLAGS },
};

export { DEFAULT_FLAGS };

/**
 * Lightweight pub/sub store. Feature flags live on `state.flags` so premium
 * overlays can be switched on later without rewriting the map engine.
 */
export function createStore(initial = {}) {
  let state = {
    ...DEFAULT_STATE,
    ...initial,
    flags: { ...DEFAULT_FLAGS, ...(initial.flags ?? {}) },
    layers: { ...DEFAULT_STATE.layers, ...(initial.layers ?? {}) },
  };
  const listeners = new Set();

  function notify(prev) {
    for (const listener of listeners) listener(state, prev);
  }

  return {
    getState() {
      return state;
    },
    setState(patch) {
      const prev = state;
      const nextFlags =
        patch.flags != null ? { ...state.flags, ...patch.flags } : state.flags;
      const nextLayers =
        patch.layers != null ? { ...state.layers, ...patch.layers } : state.layers;
      state = { ...state, ...patch, flags: nextFlags, layers: nextLayers };
      notify(prev);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    isFeatureEnabled(id) {
      return Boolean(state.flags[id]);
    },
    enableFeature(id) {
      this.setState({ flags: { [id]: true } });
    },
    disableFeature(id) {
      this.setState({ flags: { [id]: false } });
    },
  };
}

/**
 * Plugin registry for optional / premium map features.
 * Base rendering never imports plugins directly — it only reads flags.
 */
export function createFeatureRegistry(store) {
  const plugins = new Map();

  return {
    register(plugin) {
      if (!plugin?.id) {
        throw new Error('Feature plugins require an id');
      }
      plugins.set(plugin.id, plugin);
      if (plugin.init) plugin.init(store);
      if (store.isFeatureEnabled(plugin.id) && plugin.onEnable) {
        plugin.onEnable(store);
      }
      return () => this.unregister(plugin.id);
    },
    unregister(id) {
      const plugin = plugins.get(id);
      plugin?.onDisable?.(store);
      plugin?.destroy?.(store);
      plugins.delete(id);
    },
    get(id) {
      return plugins.get(id);
    },
    list() {
      return [...plugins.values()];
    },
    activate(id) {
      const plugin = plugins.get(id);
      store.enableFeature(id);
      plugin?.onEnable?.(store);
    },
    deactivate(id) {
      const plugin = plugins.get(id);
      store.disableFeature(id);
      plugin?.onDisable?.(store);
    },
  };
}
