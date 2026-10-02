# Interactive Solar System

A browser-based 3D solar system simulator built with React, TypeScript, and Three.js. Explore celestial bodies, control simulation time, compare display scales, and inspect orbital and physical properties through an interactive space-themed interface.

## Features

- Explore the Sun, eight planets, five dwarf planets, 15 moons, and three comets.
- Calculate orbital positions using Kepler's equation, explicit catalog epochs, and fixed orbital elements.
- Play, pause, reverse, and step through simulation time, with speed presets from real time to ten simulated years per second.
- Choose a date or jump to historical event dates.
- Switch between educational, hybrid, and real display scales.
- Navigate with free, focus, follow, top, and ecliptic camera modes.
- Search for celestial bodies and inspect their physical properties and orbital telemetry.
- Measure physical distances and light-travel times between catalog bodies, including parent-relative moons.
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

## Verification

Run `npm run build` to check TypeScript and production bundling. Browser verification is needed for visual and interaction changes. Automated test files and their runner were removed at the project owner's request.

## Scientific scope and known limitations

This project is an educational visualization using fixed orbital elements. It does not model gravitational interactions between bodies, orbital perturbations, or a live precision ephemeris. Historical presets select dates and bodies; they do not recreate spacecraft missions or guarantee observed alignments. The information panel exposes each orbit's epoch, reference plane, provenance, and local model limits.

Dates are entered and displayed in **UTC**. The navigation range is **January 1, 1800 through December 31, 2100**. This is a visualization policy, not a scientific accuracy guarantee. Invalid or out-of-range date submissions retain the previous time and show an error. Calendar changes require **Apply UTC Date**. Playback pauses at either boundary; stepping is clamped to the same limits.

The calculation uses uniform 86,400-second days and treats the UTC timestamp as approximate dynamical time. J2000 is numerically represented by `2000-01-01T12:00:00Z`; the actual astronomical epoch is noon TT. Leap seconds, TT/TDB offsets, and relativistic time corrections are omitted. [JPL's time-scale documentation](https://ssd.jpl.nasa.gov/horizons/manual.html) describes the distinctions required for precision ephemerides.

Orbital arguments are measured from the ascending node, periods are positive, and inclinations encode orbital direction. Physical coordinates use AU in a right-handed world frame `(ecliptic X, ecliptic Z, −ecliptic Y)`. Parent-equator satellite orbits use the parent's static illustrative pole transform; Earth's Moon retains its ecliptic reference. Legacy phases and pole azimuths with no recovered provenance are explicitly marked illustrative. Signed physical rotation periods identify retrograde bodies; rendered rotation uses a directed pole without reversing the direction twice.

Comet propagation is local to the sourced perihelion model. Halley's 1986 and Hale-Bopp's 1997 passages were checked during Stage 1; future returns, including Halley in 2061, remain approximate. Static pole directions and arbitrary texture prime meridians do not reproduce precise surface orientation, seasons, lunar phases, eclipses, or the day/night terminator. Do not use this model for observation or mission planning; use [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) for precision states.

The fixed Earth orbit was compared against an independent implementation of [JPL's Table 1 model](https://ssd.jpl.nasa.gov/planets/approx_pos.html), which includes element rates. The reference is the Earth–Moon barycenter, rather than Earth's center. These samples measure differences between two approximate models; they are not a guaranteed error bound against observations or Horizons.

| UTC sample | Position difference |
| --- | --- |
| January 1, 1900, 12:00 | Approximately 130,873 km |
| January 1, 2000, 12:00 | Approximately 2,310 km |
| October 3, 2026, 00:00 | Approximately 21,081 km |
| January 1, 2050, 12:00 | Approximately 61,968 km |

These comparisons were recorded during Stage 1 verification. The test fixtures and reference generator were subsequently removed at the project owner's request.

- Moon rendering, camera tracking, measurements, and information-panel distances use shared parent-relative positions. Their numerical consistency does not establish observed phase accuracy for illustrative satellite records.
- Educational and hybrid scales deliberately change visual proportions and spacing. Numerical measurements use physical coordinates before display scaling.
- The measurement line can remain visible when the measurement panel is closed.
- Some texture-load failure paths replace cached textures without updating references already held by materials.
- Stars, procedural textures, and belt particles use random generation, so their appearance can vary between sessions.

## Repository contents

Keep application source, `public/` assets, configuration files, `package.json`, and `package-lock.json` in version control. The `.gitignore` excludes installed dependencies, generated builds, coverage, environment files, logs, personal editor settings, and the local project context file. Sanitized `.env.example` files can be tracked if environment configuration is introduced later.
