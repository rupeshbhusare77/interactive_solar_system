import { SATURN_RINGS, saturnRingOpacity } from '../astronomy/rings';
/**
 * 3D Solar System Simulator — Comprehensive Dedicated Planetary Texture Suite
 * Handcrafted illustrative procedural textures for all dwarf planets,
 * major moons, comets, and terrestrial bodies.
 */

import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();

function createNoise2D(width: number, height: number): Float32Array {
  const size = width * height;
  const noise = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    noise[i] = Math.random();
  }
  return noise;
}

function sampleNoise(noise: Float32Array, width: number, height: number, x: number, y: number): number {
  const x0 = Math.floor(x) % width;
  const y0 = Math.floor(y) % height;
  const x1 = (x0 + 1) % width;
  const y1 = (y0 + 1) % height;

  const tx = x - Math.floor(x);
  const ty = y - Math.floor(y);

  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);

  const top = noise[y0 * width + x0] * (1 - sx) + noise[y0 * width + x1] * sx;
  const bottom = noise[y1 * width + x0] * (1 - sx) + noise[y1 * width + x1] * sx;

  return top * (1 - sy) + bottom * sy;
}

function fbm(
  noise: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
  octaves: number = 5
): number {
  let val = 0;
  let freq = 1;
  let amp = 0.5;
  let maxAmp = 0;

  for (let o = 0; o < octaves; o++) {
    val += sampleNoise(noise, width, height, x * freq, y * freq) * amp;
    maxAmp += amp;
    freq *= 2;
    amp *= 0.5;
  }

  return val / maxAmp;
}

/**
 * Generate dedicated, scientifically accurate texture for each unique celestial body
 */
export function getCelestialTexture(type: string): THREE.CanvasTexture {
  if (textureCache.has(type)) {
    return textureCache.get(type)!;
  }

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  const rawNoise = createNoise2D(256, 128);

  switch (type) {
    // ==================== DWARF PLANETS ====================

    case 'ceres': {
      // Dark grey asteroid body with bright white Occator Crater reflective salt deposits!
      const occatorX = 0.62;
      const occatorY = 0.48;

      for (let y = 0; y < height; y++) {
        const v = y / height;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const n = fbm(rawNoise, 256, 128, u * 16, v * 8, 4);

          // Distance to Occator Crater
          const dx = (u - occatorX) * 3;
          const dy = (v - occatorY) * 3;
          const distToOccator = Math.sqrt(dx * dx + dy * dy);
          const isOccatorSalt = distToOccator < 0.055;

          const idx = (y * width + x) * 4;

          if (isOccatorSalt) {
            // Brilliant white sodium carbonate salt spots
            data[idx] = 250;
            data[idx + 1] = 252;
            data[idx + 2] = 255;
          } else {
            // Dark carbonaceous grey surface
            const shade = Math.floor(75 + n * 45);
            data[idx] = shade;
            data[idx + 1] = shade;
            data[idx + 2] = shade + 2;
          }
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'eris': {
      // Extremely reflective, brilliant white methane-ice frost
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const n = fbm(rawNoise, 256, 128, (x / width) * 12, (y / height) * 6, 3);
          const idx = (y * width + x) * 4;
          const val = Math.floor(235 + n * 20);
          data[idx] = val;
          data[idx + 1] = val + 2;
          data[idx + 2] = 255;
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'haumea': {
      // Crystalline water-ice with subtle darker tholin spot
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const v = y / height;
          const n = fbm(rawNoise, 256, 128, u * 10, v * 5, 3);
          const idx = (y * width + x) * 4;

          // Subtle reddish tholin spot
          const isSpot = Math.abs(u - 0.4) < 0.08 && Math.abs(v - 0.5) < 0.15;
          if (isSpot) {
            data[idx] = 210;
            data[idx + 1] = 165;
            data[idx + 2] = 145;
          } else {
            const val = Math.floor(220 + n * 30);
            data[idx] = val - 5;
            data[idx + 1] = val;
            data[idx + 2] = val + 5;
          }
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'makemake': {
      // Soft reddish-brown methane-ice surface
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const n = fbm(rawNoise, 256, 128, (x / width) * 12, (y / height) * 6, 4);
          const idx = (y * width + x) * 4;
          data[idx] = Math.floor(185 + n * 40);
          data[idx + 1] = Math.floor(95 + n * 30);
          data[idx + 2] = Math.floor(65 + n * 20);
          data[idx + 3] = 255;
        }
      }
      break;
    }

    // ==================== MAJOR MOONS ====================

    case 'io': {
      // "Pizza moon" - bright sulfur yellow/orange with dark volcanic calderas
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const v = y / height;
          const n = fbm(rawNoise, 256, 128, u * 16, v * 8, 4);
          const ventNoise = sampleNoise(rawNoise, 256, 128, u * 24, v * 12);
          const isVent = ventNoise > 0.88;
          const isLavaRing = ventNoise > 0.82 && ventNoise <= 0.88;

          const idx = (y * width + x) * 4;

          if (isVent) {
            // Dark black/brown volcanic caldera (Pele/Loki)
            data[idx] = 45;
            data[idx + 1] = 25;
            data[idx + 2] = 15;
          } else if (isLavaRing) {
            // Reddish sulfur dioxide frost ring around volcanoes
            data[idx] = 215;
            data[idx + 1] = 60;
            data[idx + 2] = 20;
          } else {
            // Vivid sulfur yellow and white plains
            data[idx] = Math.floor(235 + n * 20);
            data[idx + 1] = Math.floor(185 + n * 45);
            data[idx + 2] = Math.floor(40 + n * 35);
          }
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'europa': {
      // Pure white ice crust crisscrossed with dark red-brown tectonic fracture lines (lineae)
      for (let y = 0; y < height; y++) {
        const v = y / height;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const lineae1 = Math.abs(Math.sin(u * 28 + v * 15));
          const lineae2 = Math.abs(Math.cos(u * 18 - v * 32));
          const n = fbm(rawNoise, 256, 128, u * 12, v * 6, 4);
          const idx = (y * width + x) * 4;

          const isLineae = (lineae1 < 0.08 || lineae2 < 0.08) && n > 0.38;

          if (isLineae) {
            // Red-brown mineral fracture seam
            data[idx] = 165;
            data[idx + 1] = 80;
            data[idx + 2] = 50;
          } else {
            // Smooth brilliant reflective ice
            data[idx] = Math.floor(240 + n * 15);
            data[idx + 1] = Math.floor(235 + n * 20);
            data[idx + 2] = Math.floor(230 + n * 25);
          }
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'ganymede': {
      // Mottled two-tone grooved ice terrain with dark Galileo Regio and bright impact rays
      for (let y = 0; y < height; y++) {
        const v = y / height;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const darkTerrain = fbm(rawNoise, 256, 128, u * 6, v * 3, 3);
          const grooveNoise = fbm(rawNoise, 256, 128, u * 24, v * 12, 4);
          const crater = sampleNoise(rawNoise, 256, 128, u * 32, v * 16);
          const idx = (y * width + x) * 4;

          if (crater > 0.88) {
            // Bright white ice crater ray
            data[idx] = 240;
            data[idx + 1] = 245;
            data[idx + 2] = 255;
          } else if (darkTerrain < 0.45) {
            // Ancient dark cratered terrain (Galileo Regio)
            const d = Math.floor(75 + grooveNoise * 35);
            data[idx] = d;
            data[idx + 1] = d - 2;
            data[idx + 2] = d - 5;
          } else {
            // Lighter grooved terrain
            const l = Math.floor(155 + grooveNoise * 50);
            data[idx] = l;
            data[idx + 1] = l - 2;
            data[idx + 2] = l - 5;
          }
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'callisto': {
      // Dark charcoal-grey ancient cratered crust covered in white impact craters (Valhalla basin)
      for (let y = 0; y < height; y++) {
        const v = y / height;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const n = fbm(rawNoise, 256, 128, u * 16, v * 8, 4);
          const crater = sampleNoise(rawNoise, 256, 128, u * 36, v * 18);
          const idx = (y * width + x) * 4;

          if (crater > 0.84) {
            // Bright white ice-excavated crater
            data[idx] = 230;
            data[idx + 1] = 235;
            data[idx + 2] = 245;
          } else {
            // Ancient dark charcoal rock/ice crust
            const c = Math.floor(65 + n * 40);
            data[idx] = c;
            data[idx + 1] = c;
            data[idx + 2] = c;
          }
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'titan': {
      // Opaque fuzzy deep golden-orange nitrogen/methane smog
      for (let y = 0; y < height; y++) {
        const v = y / height;
        const pole = Math.abs(v - 0.5) * 2;
        for (let x = 0; x < width; x++) {
          const n = fbm(rawNoise, 256, 128, (x / width) * 4, v * 2, 2);
          const idx = (y * width + x) * 4;
          data[idx] = Math.floor(225 - pole * 20 + n * 15);
          data[idx + 1] = Math.floor(135 - pole * 25 + n * 15);
          data[idx + 2] = Math.floor(25 + n * 10);
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'enceladus': {
      // 99% reflective pure snowy white ice with blue-tinted tiger stripe fractures at south pole
      for (let y = 0; y < height; y++) {
        const v = y / height;
        const isSouthPole = v > 0.82;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const n = fbm(rawNoise, 256, 128, u * 8, v * 4, 3);
          const tigerStripe = Math.sin(u * 40) * (isSouthPole ? 1 : 0);
          const idx = (y * width + x) * 4;

          if (isSouthPole && Math.abs(tigerStripe) > 0.6) {
            // Cyan-blue tiger stripe hydrothermal fracture
            data[idx] = 160;
            data[idx + 1] = 210;
            data[idx + 2] = 245;
          } else {
            // Pure blinding snowy white ice
            data[idx] = Math.floor(248 + n * 7);
            data[idx + 1] = Math.floor(250 + n * 5);
            data[idx + 2] = 255;
          }
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'triton': {
      // Cantaloupe melon textured pinkish-grey nitrogen ice frost with dark cryovolcanic geyser plumes
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const v = y / height;
          // Cantaloupe dimple texture
          const cantaloupe = Math.sin(u * 45) * Math.sin(v * 45);
          const n = fbm(rawNoise, 256, 128, u * 12, v * 6, 4);
          const geyser = sampleNoise(rawNoise, 256, 128, u * 20, v * 10);
          const isGeyser = geyser > 0.92 && v > 0.55;

          const idx = (y * width + x) * 4;

          if (isGeyser) {
            // Dark nitrogen cryovolcanic plume streak
            data[idx] = 40;
            data[idx + 1] = 35;
            data[idx + 2] = 35;
          } else {
            // Pinkish-nitrogen frost cantaloupe terrain
            const dimple = cantaloupe * 15;
            data[idx] = Math.floor(215 + dimple + n * 20);
            data[idx + 1] = Math.floor(185 + dimple + n * 15);
            data[idx + 2] = Math.floor(190 + dimple + n * 15);
          }
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'charon': {
      // Grey icy surface with dark reddish-brown north polar cap (Mordor Macula)
      for (let y = 0; y < height; y++) {
        const v = y / height;
        const isNorthPole = v < 0.22;
        for (let x = 0; x < width; x++) {
          const n = fbm(rawNoise, 256, 128, (x / width) * 12, v * 6, 4);
          const idx = (y * width + x) * 4;

          if (isNorthPole && n > 0.3) {
            // Mordor Macula reddish-brown tholin cap
            data[idx] = 145 + Math.floor(n * 25);
            data[idx + 1] = 85 + Math.floor(n * 15);
            data[idx + 2] = 65;
          } else {
            // Grey water-ice crust
            const g = Math.floor(140 + n * 40);
            data[idx] = g;
            data[idx + 1] = g;
            data[idx + 2] = g + 2;
          }
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'phobos': {
      // Dark grey-brown carbonaceous asteroid rock with heavy pitting and Stickney crater grooves
      for (let y = 0; y < height; y++) {
        const v = y / height;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const n = fbm(rawNoise, 256, 128, u * 16, v * 8, 4);
          const pit = sampleNoise(rawNoise, 256, 128, u * 32, v * 16);
          // Stickney crater feature at u ~ 0.35, v ~ 0.45
          const sDist = Math.hypot((u - 0.35) * 2, v - 0.45);
          const isStickney = sDist < 0.18;
          const isStickneyRim = Math.abs(sDist - 0.18) < 0.025;
          const grooves = Math.sin(u * 50 + v * 20) * (sDist < 0.4 ? 1 : 0);

          const idx = (y * width + x) * 4;
          let p = Math.floor(65 + n * 35 - (pit > 0.78 ? 20 : 0));
          if (isStickneyRim) p += 25;
          else if (isStickney) p -= 15;
          p += Math.floor(grooves * 8);

          data[idx] = Math.max(20, Math.min(240, p + 4));
          data[idx + 1] = Math.max(20, Math.min(240, p + 2));
          data[idx + 2] = Math.max(20, Math.min(240, p));
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'deimos': {
      // Smaller, smoother reddish-grey asteroid blanketed in thick powdery regolith
      for (let y = 0; y < height; y++) {
        const v = y / height;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const n = fbm(rawNoise, 256, 128, u * 10, v * 5, 3);
          const softPit = sampleNoise(rawNoise, 256, 128, u * 20, v * 10);
          const idx = (y * width + x) * 4;

          const p = Math.floor(82 + n * 25 - (softPit > 0.85 ? 12 : 0));
          data[idx] = p + 10;
          data[idx + 1] = p + 4;
          data[idx + 2] = p;
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'mimas': {
      // Saturn's "Death Star" moon dominated by the colossal Herschel Crater with central peak
      const hx = 0.50;
      const hy = 0.50;
      for (let y = 0; y < height; y++) {
        const v = y / height;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const n = fbm(rawNoise, 256, 128, u * 18, v * 9, 4);
          const dx = (u - hx) * 2;
          const dy = v - hy;
          const distHerschel = Math.sqrt(dx * dx + dy * dy);

          const idx = (y * width + x) * 4;
          let val = Math.floor(150 + n * 45);

          if (distHerschel < 0.04) {
            // Central mountain peak inside Herschel crater
            val = 215 + Math.floor(n * 25);
          } else if (distHerschel < 0.16) {
            // Sunken crater floor
            val = Math.floor(85 + n * 30);
          } else if (distHerschel < 0.20) {
            // Elevated crater rim wall
            val = 225 + Math.floor(n * 20);
          }

          data[idx] = val;
          data[idx + 1] = val + 2;
          data[idx + 2] = val + 6;
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'miranda': {
      // Uranus's "Frankenstein moon" with chevron fault scarps and grooved corona terrain
      for (let y = 0; y < height; y++) {
        const v = y / height;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const n = fbm(rawNoise, 256, 128, u * 12, v * 6, 4);
          // Chevron fault lines and concentric ovoid grooves
          const chevron = Math.abs(Math.sin(u * 22 + Math.abs(v - 0.5) * 18));
          const ovoid = Math.sin(Math.hypot(u - 0.65, v - 0.5) * 40);
          const idx = (y * width + x) * 4;

          let val = Math.floor(140 + n * 35);
          if (chevron < 0.12) {
            // High-albedo cliff rim (Verona Rupes fault scarps)
            val = 220 + Math.floor(n * 30);
          } else if (ovoid > 0.5) {
            // Grooved terrain band
            val = 90 + Math.floor(n * 25);
          }

          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val + 3;
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'iapetus': {
      // Saturn's famous "yin-yang" moon with extreme dual black-and-white coloration
      for (let y = 0; y < height; y++) {
        const v = y / height;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const n = fbm(rawNoise, 256, 128, u * 14, v * 7, 4);
          // Leading hemisphere (dark Cassini Regio) vs trailing hemisphere (bright Roncevaux Terra)
          const isEquatorialRidge = Math.abs(v - 0.5) < 0.025;
          const darkHemisphere = Math.cos((u - 0.25) * Math.PI * 2);
          const blendFactor = (darkHemisphere + 1) * 0.5; // 1 = darkest center, 0 = bright ice

          const idx = (y * width + x) * 4;

          if (blendFactor > 0.45 + n * 0.15) {
            // Pitch-black carbonaceous Cassini Regio
            const d = Math.floor(25 + n * 20);
            data[idx] = d + 5;
            data[idx + 1] = d + 2;
            data[idx + 2] = d;
          } else {
            // Brilliant bright white/cream water-ice Roncevaux Terra
            const b = Math.floor(220 + n * 30);
            data[idx] = b;
            data[idx + 1] = b + 2;
            data[idx + 2] = b + 5;
          }

          // Dark equatorial ridge
          if (isEquatorialRidge && blendFactor > 0.2) {
            data[idx] = Math.max(20, data[idx] - 40);
            data[idx + 1] = Math.max(20, data[idx + 1] - 40);
            data[idx + 2] = Math.max(20, data[idx + 2] - 40);
          }

          data[idx + 3] = 255;
        }
      }
      break;
    }

    case 'titania': {
      // Largest moon of Uranus with the colossal Messina Chasma rift canyon system
      for (let y = 0; y < height; y++) {
        const v = y / height;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const n = fbm(rawNoise, 256, 128, u * 12, v * 6, 4);
          // Messina Chasma graben canyon traversing across the surface
          const canyon = Math.abs(v - 0.52 - Math.sin(u * 8) * 0.08);
          const isCanyonFloor = canyon < 0.035;
          const isCanyonRim = canyon >= 0.035 && canyon < 0.06;

          const idx = (y * width + x) * 4;
          let val = Math.floor(135 + n * 40);

          if (isCanyonRim) {
            // High-albedo fresh icy canyon cliff rim
            val = 225 + Math.floor(n * 25);
          } else if (isCanyonFloor) {
            // Dark sunken canyon trench floor
            val = 75 + Math.floor(n * 20);
          }

          data[idx] = val;
          data[idx + 1] = val + 2;
          data[idx + 2] = val + 5;
          data[idx + 3] = 255;
        }
      }
      break;
    }

    // ==================== DEFAULT ROCKY MOON ====================
    default: {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const n = fbm(rawNoise, 256, 128, (x / width) * 14, (y / height) * 7, 5);
          const idx = (y * width + x) * 4;
          const val = Math.floor(130 + n * 50);
          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val + 2;
          data[idx + 3] = 255;
        }
      }
      break;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set(type, texture);

  return texture;
}

/**
 * Generate 3D Elevation / Bump Map for high-fidelity surface relief
 */
export function getCelestialBumpMap(type: string): THREE.CanvasTexture {
  const bumpKey = `bump-${type}`;
  if (textureCache.has(bumpKey)) {
    return textureCache.get(bumpKey)!;
  }

  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  const rawNoise = createNoise2D(128, 64);

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      let heightVal = 0;

      if (type === 'earth') {
        const cont = fbm(rawNoise, 128, 64, u * 6, v * 3, 4);
        if (cont > 0.46) {
          const detail = fbm(rawNoise, 128, 64, u * 18, v * 9, 3);
          heightVal = 100 + detail * 155;
        } else {
          heightVal = 30;
        }
      } else if (type === 'moon' || type === 'mercury') {
        const n = fbm(rawNoise, 128, 64, u * 16, v * 8, 4);
        const crater = sampleNoise(rawNoise, 128, 64, u * 32, v * 16);
        heightVal = Math.floor(n * 200 + (crater > 0.8 ? 55 : 0));
      } else if (type === 'mars') {
        const n = fbm(rawNoise, 128, 64, u * 10, v * 5, 4);
        heightVal = Math.floor(n * 255);
      } else if (type === 'mimas') {
        const hx = 0.50;
        const hy = 0.50;
        const dx = (u - hx) * 2;
        const dy = v - hy;
        const distHerschel = Math.sqrt(dx * dx + dy * dy);
        if (distHerschel < 0.04) {
          heightVal = 235; // Central mountain peak
        } else if (distHerschel < 0.16) {
          heightVal = 35; // Deep crater depression
        } else if (distHerschel < 0.20) {
          heightVal = 215; // Crater rim
        } else {
          heightVal = Math.floor(128 + fbm(rawNoise, 128, 64, u * 12, v * 6, 3) * 60);
        }
      } else if (type === 'miranda') {
        const chevron = Math.abs(Math.sin(u * 22 + Math.abs(v - 0.5) * 18));
        heightVal = chevron < 0.12 ? 240 : Math.floor(100 + fbm(rawNoise, 128, 64, u * 10, v * 5, 3) * 80);
      } else if (type === 'iapetus') {
        const isRidge = Math.abs(v - 0.5) < 0.025;
        heightVal = isRidge ? 245 : Math.floor(90 + fbm(rawNoise, 128, 64, u * 10, v * 5, 3) * 90);
      } else if (type === 'titania') {
        const canyon = Math.abs(v - 0.52 - Math.sin(u * 8) * 0.08);
        heightVal = canyon < 0.035 ? 40 : canyon < 0.06 ? 220 : Math.floor(120 + fbm(rawNoise, 128, 64, u * 10, v * 5, 3) * 70);
      } else {
        heightVal = Math.floor(fbm(rawNoise, 128, 64, u * 8, v * 4, 3) * 128);
      }

      const idx = (y * width + x) * 4;
      data[idx] = heightVal;
      data[idx + 1] = heightVal;
      data[idx + 2] = heightVal;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set(bumpKey, texture);

  return texture;
}

/**
 * Generate 4096-sample ultra-high-definition Saturn radial ring texture
 * Uses sourced circular D–F ring boundaries with representative optical depths.
 */
export function getSaturnRingTexture(): THREE.CanvasTexture {
  const cached=textureCache.get('saturn-rings');
  if(cached)return cached;
  const canvas=document.createElement('canvas');canvas.width=8192;canvas.height=1;
  const context=canvas.getContext('2d');if(!context)throw new Error('Cannot generate ring profile');
  const image=context.createImageData(canvas.width,1);
  for(let index=0;index<canvas.width;index++) {
    const radius=SATURN_RINGS.innerKm+(SATURN_RINGS.outerKm-SATURN_RINGS.innerKm)*(index+0.5)/canvas.width;
    image.data.set([220,210,190,Math.round(saturnRingOpacity(radius)*255)],index*4);
  }
  context.putImageData(image,0,0);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;textureCache.set('saturn-rings',texture);
  return texture;
}

/** Illustrative Uranus ring appearance. */
export function getUranusRingTexture(): THREE.CanvasTexture {
  if (textureCache.has('uranus-ring')) {
    return textureCache.get('uranus-ring')!;
  }

  const width = 1024;
  const height = 64;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // Discrete narrow rings (6, 5, 4, alpha, beta, eta, gamma, delta, lambda, epsilon)
  for (let x = 0; x < width; x++) {
    const r = x / width;
    let alpha = 0;
    let brightness = 70;

    const isEpsilon = r > 0.88 && r < 0.94; // Brightest outer ring
    const isDelta = r > 0.72 && r < 0.75;
    const isGamma = r > 0.64 && r < 0.67;
    const isEta = r > 0.56 && r < 0.58;
    const isBeta = r > 0.46 && r < 0.49;
    const isAlpha = r > 0.38 && r < 0.41;
    const isInnerRings = (r > 0.20 && r < 0.23) || (r > 0.26 && r < 0.28) || (r > 0.31 && r < 0.33);

    if (isEpsilon) {
      alpha = 0.85;
      brightness = 110;
    } else if (isDelta || isGamma) {
      alpha = 0.65;
      brightness = 95;
    } else if (isAlpha || isBeta || isEta) {
      alpha = 0.55;
      brightness = 85;
    } else if (isInnerRings) {
      alpha = 0.4;
      brightness = 75;
    } else {
      alpha = 0.03; // Very faint dust background
      brightness = 40;
    }

    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      data[idx] = brightness;
      data[idx + 1] = Math.floor(brightness * 1.05); // Slate/cyan-grey tint
      data[idx + 2] = Math.floor(brightness * 1.15);
      data[idx + 3] = Math.floor(alpha * 255);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('uranus-ring', texture);

  return texture;
}

/**
 * Generate Haumea's thin crystalline water-ice ring
 */
export function getHaumeaRingTexture(): THREE.CanvasTexture {
  if (textureCache.has('haumea-ring')) {
    return textureCache.get('haumea-ring')!;
  }

  const width = 512;
  const height = 64;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let x = 0; x < width; x++) {
    const r = x / width;
    let alpha = 0;
    if (r > 0.45 && r < 0.85) {
      const bell = Math.sin(((r - 0.45) / 0.4) * Math.PI);
      alpha = bell * 0.6;
    }

    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      data[idx] = 205;
      data[idx + 1] = 220;
      data[idx + 2] = 235;
      data[idx + 3] = Math.floor(alpha * 255);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('haumea-ring', texture);

  return texture;
}

/** Transfer procedural cache ownership to the scene manager on final teardown. */
export function clearProceduralTextureCache(): THREE.Texture[] {
  const textures = [...textureCache.values()];
  textureCache.clear();
  return textures;
}
