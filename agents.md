# AGENTS.md — Non-Mercator Project Guidelines

## Core System Overview
This project, titled **Non-Mercator**, is a high-performance, static web application hosted on GitHub Pages. It renders an interactive, customizable world map featuring 7 versatile projections (including Mercator and 6 major alternative projections), smooth spherical rotation animations, country re-centering capabilities, city markers, and rich geographical metadata.

## Repository & Project Name
- **Project Name:** Non-Mercator
- **Repository Name:** `non-mercator`
- **Deployment URL:** `https://<username>.github.io/non-mercator/`

## Tech Stack & Dependencies
- **Build Tool:** Vite (Vanilla JS ES6 Modules)
- **Visualization:** D3.js (`d3-geo`, `d3-geo-projection`, `d3-selection`, `d3-transition`, `d3-interpolate`, `d3-fetch`)
- **Topography Data:** TopoJSON Client (`topojson-client`) using `world-110m` or `world-50m` datasets.
- **Styling:** Vanilla CSS3 (CSS Variables for modular design/theming).

## Code & Design Principles
1. **Zero Framework Overhead:** Do NOT install React, Vue, or Svelte unless requested. Keep state clean in a centralized JavaScript event/store architecture.
2. **Modular Architecture:**
   - `src/map/`: Rendering logic, projection definitions, D3 generators.
   - `src/state/`: Centralized application state (active projection, centered country, active layers, feature flags).
   - `src/ui/`: Sidebar, controls, tooltips, legend, and search bars.
   - `src/data/`: Data fetching and TopoJSON parsing.
3. **Premium Architecture (Extensibility):**
   - Implement a modular `FeatureRegistry` or plugin architecture to easily hook in future premium features and overlays.
   - Base features (map render, projection switch, tooltips) must remain strictly decoupled from optional feature add-ons.
4. **Animation Standards:**
   - Projection re-centering and rotation changes MUST use `d3.transition()` with `d3.geoInterpolate()` for fluid transitions (750ms - 1200ms ease).
   - Use SVG vector paths (`d3.geoPath`) with responsive viewport handling (`viewBox`).

## Projections List (7 Total)
1. **Mercator** (Standard Cylindrical Baseline)
2. **Orthographic** (3D Globe)
3. **Robinson** (Compromise Reference)
4. **Winkel Tripel** (National Geographic Standard)
5. **Equal Earth** (Equal-Area Compromise)
6. **Mollweide** (Elliptical Equal-Area)
7. **Equirectangular / Plate Carrée** (Equidistant Cylindrical)

## File Structure Layout
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deployment action
├── public/
│   └── data/
│       ├── countries.json       # TopoJSON geometry + country ISO codes
│       ├── country-meta.json   # Metadata (population, land area sq km, capital, etc.)
│       └── cities.json         # Capitals & major city coordinates
├── src/
│   ├── map/
│   │   ├── MapEngine.js        # Main D3 rendering and projection engine
│   │   ├── Projections.js     # 7 Projections registry
│   │   └── Animator.js         # Spherical rotation & projection transition logic
│   ├── state/
│   │   └── Store.js            # Modular state manager with feature flags
│   ├── ui/
│   │   ├── Controls.js         # Projection dropdowns & country search UI
│   │   ├── Tooltip.js          # Hover card with geography stats
│   │   └── Sidebar.js          # Extended metadata drawer
│   ├── styles/
│   │   └── main.css            # Responsive layout & theme variables
│   └── main.js                 # Application bootstrap
├── index.html
├── package.json
└── vite.config.js              # Configured with base: '/non-mercator/'

## GitHub Pages Build Constraints
- Vite `base` config MUST be set to `'/non-mercator/'` (or relative `'./'`) so all static asset paths resolve properly when deployed.
- Production build outputs to `/dist`.
