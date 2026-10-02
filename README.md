# Interactive Solar System

A browser-based 3D solar system simulator built with React, TypeScript, and Three.js. Explore celestial bodies, control simulation time, compare display scales, and inspect orbital and physical properties through an interactive space-themed interface.

## Features

- Explore the Sun, eight planets, five dwarf planets, 15 moons, and three comets.
- Calculate orbital positions using Kepler's equation and fixed orbital elements referenced to J2000.
- Play, pause, reverse, and step through simulation time, with speed presets from real time to ten simulated years per second.
- Choose a date or jump to historical event dates.
- Switch between educational, hybrid, and real display scales.
- Navigate with free, focus, follow, top, and ecliptic camera modes.
- Search for celestial bodies and inspect their physical properties and orbital telemetry.
- Measure distances and light-travel times between the Sun and bodies with heliocentric orbital elements.
- Toggle orbit paths, labels, moons, lighting, the habitable zone, asteroid and Kuiper belts, and a distance grid.
- View planetary textures, atmospheric glow, Earth clouds and night lights, planetary rings, and comet tails.
- Use an orbital radar to locate and focus on major planets.

## Technology

| Layer | Tools |
| --- | --- |
| Application | React 18, TypeScript |
| 3D rendering | Three.js, React Three Fiber, Drei |
| Styling | Tailwind CSS, PostCSS, Autoprefixer |
| Icons | Lucide React |
| Development and builds | Vite |

The application runs in the browser without a backend or database. Simulation state is held in memory and resets when the page reloads. Texture assets are included in the repository; the page also requests fonts from Google Fonts.

## Getting started

You need Node.js and npm, plus a browser with WebGL support. Node.js 24 was used for the project's initial build verification.

```bash
git clone https://github.com/rupeshbhusare77/interactive_solar_system.git
cd interactive_solar_system
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. Access to the repository is required to clone it while it is private.

### Production build

```bash
npm run build
npm run preview
```

The build command checks TypeScript and generates the production site in `dist/`. The preview command serves that build locally. An alternative local server is available through `node serve.js` after building.

Development, preview, and the custom server are configured to use port 5173. Run one server at a time. Uploading the repository to GitHub stores the source code; hosting the live application requires a separate deployment.

## Controls

| Action | Control |
| --- | --- |
| Rotate the camera | Left-click and drag |
| Pan the camera | Right-click and drag |
| Zoom | Mouse wheel or pinch gesture |
| Select a body | Click its surface or use the search field |
| Focus on a body | Use the quick dock or a focus action |
| Change the viewpoint | Use the camera mode selector |
| Control time | Use the bottom timeline controls |
| Change display options | Use the header's view controls |
| Inspect measurements | Open the measurement panel |
| Read the in-app guide | Open Help |

The simulation initially plays at three simulated days per real second, with Earth selected and educational scale enabled.

## Display scales

| Mode | Behavior |
| --- | --- |
| Educational | Compresses orbital distances and uses calibrated body sizes for easier exploration. |
| Hybrid | Uses logarithmic distance compression with slightly smaller calibrated body sizes. |
| Real | Uses a consistent physical conversion for orbital distances and spherical body radii: 250 world units per AU. |

In real mode, planets are tiny compared with the distances between them. Use Focus to inspect individual bodies. Labels, decorative effects, the distance grid, and belt particle sizes remain illustrative.

## Project structure

```text
public/textures/          Local planetary and sky texture assets
src/
  astronomy/             Body catalog, constants, orbital calculations, and scaling
  components/
    canvas/              3D bodies, orbits, effects, belts, and camera controls
    ui/                  Header, timeline, information panel, radar, and help
  state/                 Shared simulation state and React context
  textures/              Texture loading and procedural texture generation
  App.tsx                Scene and interface composition
  main.tsx               React entry point
  index.css              Global styles and shared interface effects
serve.js                 Optional local server for the production build
```

## Physics verification

The project includes independent assertions in `src/astronomy/verifyPhysics.ts`, invoked by `src/astronomy/runTest.ts`. They check Julian date conversion, Kepler solver accuracy, Earth's orbital-distance range, distance consistency, and retrograde rotation flags.

After installing dependencies, run the existing suite without generating a test bundle on disk:

```bash
node --input-type=module -e "import {build} from 'esbuild'; import {createRequire} from 'node:module'; const result = await build({entryPoints:['src/astronomy/runTest.ts'],bundle:true,platform:'node',format:'cjs',write:false}); new Function('require',result.outputFiles[0].text)(createRequire(import.meta.url));"
```

This command uses esbuild supplied through Vite's dependency tree. There is currently no dedicated `npm test` script. Use `npm run build` to check TypeScript and bundling; browser verification is needed for visual and interaction changes.

## Scientific scope and known limitations

This project is an educational visualization using fixed orbital elements. It does not model gravitational interactions between bodies, orbital perturbations, or a live precision ephemeris. Historical presets select dates and bodies; they do not recreate spacecraft missions.

- Moon rendering and camera tracking include parent-relative positions, but distance measurement and some information-panel calculations do not yet resolve those positions correctly. Moon distance readings should not be treated as accurate.
- Educational and hybrid scales deliberately change visual proportions and spacing. Numerical measurements use physical coordinates before display scaling.
- The measurement line can remain visible when the measurement panel is closed.
- Some texture-load failure paths replace cached textures without updating references already held by materials.
- Stars, procedural textures, and belt particles use random generation, so their appearance can vary between sessions.
- The in-app guide contains some scale descriptions that differ from the current implementation; the values documented above follow `src/astronomy/scaling.ts`.

## Repository contents

Keep application source, `public/` assets, configuration files, `package.json`, and `package-lock.json` in version control. The `.gitignore` excludes installed dependencies, generated builds, coverage, environment files, logs, personal editor settings, and the local project context file. Sanitized `.env.example` files can be tracked if environment configuration is introduced later.
