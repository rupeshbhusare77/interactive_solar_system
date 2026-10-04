# Interactive Solar System

RxSolar is a browser-based 3D solar system simulator built with React, TypeScript, and Three.js. Select celestial bodies, control simulation time, inspect orbital data, and measure distances across the solar system.

![RxSolar showing the inner planets, body inspector, radar, and timeline](docs/images/overview.png)

## Features

- **Body navigation:** planets, dwarf planets, moons, and comets, with search, textured thumbnails, moon filters, and satellite-system views.
- **Camera controls:** Free Orbit, Focus, Lock & Follow, Moon System, Top View, and Ecliptic views. Camera flights start from the current view and preserve manual zoom after arrival.
- **Time controls:** UTC dates from 1800 to 2100, playback speeds, reverse motion, day stepping, and mission and astronomical event presets.
- **Measurements and telemetry:** physical distances, light-travel times, orbital properties, and body-specific source and accuracy information.
- **Eclipse models:** solar, annular, and lunar eclipses with shadow alignment and observer views, a phase slider, and play/pause controls.
- **Scene layers:** orbit paths, celestial labels, moons, lighting, the habitable zone, belts, a distance grid, and an orbital radar.
- **Responsive interface:** translucent panels, light and dark themes, keyboard-accessible controls, and layouts for desktop, tablet, and mobile.

The app runs entirely in the browser. No backend, database, or API key is required. Scientific data and textures load from bundled assets; simulation state resets when the page reloads.

## Run locally

Use **Node.js 24** (see [.nvmrc](.nvmrc)), npm, and a browser with WebGL 2 support.

```bash
git clone --branch dev https://github.com/rupeshbhusare77/interactive_solar_system.git
cd interactive_solar_system
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Controls

| Action | Control |
| --- | --- |
| Orbit the camera | Left-drag or one-finger drag |
| Pan | Right-drag or two-finger drag |
| Zoom | Mouse wheel or pinch |
| Select and focus | Click a body, choose a search result, or use the body dock |
| Inspect a body | Use the information panel; tap **Details** on mobile |
| Change time | Use the bottom timeline, **Date**, or **Events** |
| Change the scene | Use **Layers**, the scale selector, and camera modes; open settings on mobile |

The initial view uses Educational scale and Free Orbit, with Earth selected. Playback starts at three simulated days per real second. Pause before comparing dates or measurements. **Help** contains the in-app guide.

Camera animation initially follows the device's reduced-motion preference. Enable or disable **Layers → Smooth camera transitions** to override it.

## Display scales

| Mode | Display behavior |
| --- | --- |
| Educational | Larger calibrated bodies and gently compressed orbital distances. |
| Hybrid | Smaller bodies and logarithmic spacing that compresses outer orbits more strongly. |
| Real (1:1) | Body radii and distances use the same physical conversion: 250 scene units per AU. |

Compare spacing in Free Orbit or Top View. Focus and Follow frame the selected body, so close-ups can look similar across scales. Real-scale bodies are very small compared with their orbital distances; use Focus to inspect them. Numerical measurements always use physical coordinates, independent of display scale.

## Build and test

```bash
npm run build
npm run preview
```

The build checks TypeScript and writes the production site to `dist/`. Preview serves it locally on port 5173. The included `wrangler.json` configures Cloudflare Workers Static Assets to serve this directory. Use the root build above for that deployment.

Run the automated checks with:

```bash
npm run check
npx playwright install chromium
npm run build -- --base=/interactive_solar_system/
npm run test:browser
```

Browser tests expect the subfolder build shown above and start their own server on port 5175. They cover navigation, camera motion, eclipse playback, appearance, responsive layouts, and asset recovery. An installed Edge browser can also be used by setting `PLAYWRIGHT_CHANNEL=msedge`.

## Scientific scope

The catalog combines sourced JPL satellite records, NAIF dimensions and orientation constants, and legacy illustrative data. Bundled JPL Horizons vectors provide reference positions for 44 bodies within October 1–9, 2026, subject to each file's actual coverage. Outside that interval, or when reference data is unavailable, the app uses approximate Keplerian propagation. The inspector identifies the active model and its sources.

This is an educational visualization, not an observation or mission-planning tool. Fixed orbital elements omit gravitational perturbations; surface orientation and visual effects remain approximate. Eclipse viewers demonstrate physical shadow geometry using idealized alignments. Their event dates do not reconstruct exact eclipse paths, contact times, or local visibility.

Source records live in `public/science/` and `src/astronomy/generated/`. Refresh scripts are in `scripts/`; review generated changes and rerun the checks after refreshing data. [Asset sources and credits](docs/ASSET_SOURCES.md) document verified maps and unresolved provenance for legacy assets.

## Contributing

Use `dev` for development and keep changes focused. Preserve physical calculations separately from display scaling. For visual bug reports, include the viewport size, scale and camera modes, and a paused UTC date.

No project license has been selected. Consult the asset source records before redistributing bundled images.
