import { SURFACE_MAPS } from '../astronomy/generated/surfaceMaps';
/**
 * Shared scene textures with explicit color/data roles and in-place failure recovery.
 */
import * as THREE from 'three';
import {
  getCelestialTexture, getCelestialBumpMap, getSaturnRingTexture,
  getUranusRingTexture, getHaumeaRingTexture, clearProceduralTextureCache,
} from './proceduralTextures';

const loader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();
const states = new Map<string, 'loading' | 'ready' | 'fallback'>();
const listeners = new Set<() => void>();
let snapshot = { loading: 0, fallbacks: [] as string[] };
let notificationPending = false;
let generation = 0;
let owners = 0;
let disposalTimer: ReturnType<typeof setTimeout> | undefined;

const LOCAL_TEXTURES = new Set([
  ...SURFACE_MAPS.map(map=>map.id+'.jpg'),
  'earth.jpg', 'earth_clouds.png', 'earth_lights.png', 'earth_normal.jpg',
  'earth_specular.jpg', 'jupiter.jpg', 'mars.jpg', 'mars_bump.jpg',
  'mercury.jpg', 'mercury_bump.jpg', 'milkyway-eso.jpg', 'moon.jpg',
  'neptune.jpg', 'pluto.jpg', 'saturn.jpg', 'saturn_ring.jpg', 'sun.jpg',
  'uranus.jpg', 'venus.jpg', 'venus_bump.jpg',
]);

export const getTextureStatus = () => snapshot;
export function subscribeTextureStatus(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function setStatus(key: string, state: 'loading' | 'ready' | 'fallback') {
  states.set(key, state);
  snapshot = {
    loading: [...states.values()].filter(value => value === 'loading').length,
    fallbacks: [...states].filter(([, value]) => value === 'fallback').map(([name]) => name),
  };
  // Loads can begin during canvas rendering; notify React after that render completes.
  if (!notificationPending) {
    notificationPending = true;
    queueMicrotask(() => { notificationPending = false; listeners.forEach(listener => listener()); });
  }
}
function configure(texture: THREE.Texture, color: boolean, radial = false) {
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = radial ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  if (texture.image) texture.needsUpdate = true;
  return texture;
}
function flatTexture(red: number, green = red, blue = red, alpha = 255) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Cannot create a fallback texture.');
  context.putImageData(new ImageData(new Uint8ClampedArray([red, green, blue, alpha]), 1, 1), 0, 0);
  return new THREE.CanvasTexture(canvas);
}
function loadTexture(
  key: string, filename: string | null, fallback: () => THREE.Texture,
  color: boolean, radial = false, transform?: (texture: THREE.Texture) => void,
): THREE.Texture {
  const existing = cache.get(key);
  if (existing) return existing;
  if (!filename || !LOCAL_TEXTURES.has(filename)) {
    const texture = configure(fallback(), color, radial);
    cache.set(key, texture);
    setStatus(key, 'ready');
    return texture;
  }

  const requestGeneration = generation;
  setStatus(key, 'loading');
  const texture = loader.load(
    `${import.meta.env.BASE_URL}textures/${filename}`,
    loaded => {
      if (generation !== requestGeneration) return;
      try {
        transform?.(loaded);
        configure(loaded, color, radial);
        setStatus(key, 'ready');
      } catch {
        recover();
      }
    },
    undefined,
    () => recover(),
  );
  function recover() {
    if (generation !== requestGeneration) return;
    // Keep the original object held by mounted materials and concurrent consumers.
    const replacement = fallback();
    texture.image = replacement.image;
    texture.format = replacement.format;
    texture.type = replacement.type;
    configure(texture, color, radial);
    setStatus(key, 'fallback');
  }
  configure(texture, color, radial);
  cache.set(key, texture);
  return texture;
}

export function loadPlanetTexture(filename: string, proceduralKey: string): THREE.Texture {
  return loadTexture(`color:${filename}`, filename, () => {
    if (filename === 'milkyway-eso.jpg' || filename === 'earth_lights.png') return flatTexture(0);
    if (filename === 'earth_clouds.png') return flatTexture(255, 255, 255, 0);
    return getCelestialTexture(proceduralKey);
  }, true);
}
export function loadPlanetBumpMap(filename: string, proceduralKey: string): THREE.Texture {
  return loadTexture(`bump:${filename}`, filename, () => getCelestialBumpMap(proceduralKey), false);
}
export function loadEarthNormalMap(): THREE.Texture {
  return loadTexture('normal:earth_normal.jpg', 'earth_normal.jpg', () => flatTexture(128, 128, 255), false);
}
export function loadEarthRoughnessMap(): THREE.Texture {
  return loadTexture('roughness:earth_specular.jpg', 'earth_specular.jpg', () => flatTexture(191), false, false, texture => {
    const image = texture.image as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Cannot convert the ocean reflectivity map.');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      // Bright specular ocean pixels become smooth; dark land pixels remain rough.
      const roughness = Math.round(230 - pixels.data[index + 1] * (210 / 255));
      pixels.data[index] = pixels.data[index + 1] = pixels.data[index + 2] = roughness;
    }
    context.putImageData(pixels, 0, 0);
    texture.image = canvas;
  });
}

const ringProfile = (bodyId: string) => bodyId === 'uranus' ? getUranusRingTexture()
  : bodyId === 'haumea' ? getHaumeaRingTexture() : getSaturnRingTexture();
export function loadRingTexture(bodyId: string): THREE.Texture {
  return loadTexture(`ring-color:${bodyId}`, null,
    () => ringProfile(bodyId), true, true);
}
export function loadRingDensity(bodyId: string): THREE.Texture {
  return loadTexture(`ring-density:${bodyId}`, null, () => {
    const source = ringProfile(bodyId).image as HTMLCanvasElement;
    const context = source.getContext('2d');
    if (!context) throw new Error('Cannot generate ring density.');
    const pixels = context.getImageData(0, 0, source.width, 1).data;
    const density = new Uint8Array(source.width * 4);
    for (let index = 0; index < source.width; index++) {
      density[index * 4] = density[index * 4 + 1] = density[index * 4 + 2] = pixels[index * 4 + 3];
      density[index * 4 + 3] = 255;
    }
    return new THREE.DataTexture(density, source.width, 1, THREE.RGBAFormat);
  }, false, true);
}

/** Scene owners retain shared maps through panel/moon toggles and Strict Mode effect replay. */
export function retainTextureCache() {
  owners++;
  if (disposalTimer !== undefined) clearTimeout(disposalTimer);
  return () => {
    owners--;
    if (owners === 0) disposalTimer = setTimeout(() => {
      if (owners !== 0) return;
      generation++;
      const textures = new Set([...cache.values(), ...clearProceduralTextureCache()]);
      textures.forEach(texture => texture.dispose());
      cache.clear(); states.clear();
      snapshot = { loading: 0, fallbacks: [] };
      listeners.forEach(listener => listener());
    }, 0);
  };
}

/** R3F 8 assigns sRGB to every RGBA8 texture prop; restore data roles after applying material props. */
export function restoreDataTextureRoles(material: THREE.MeshStandardMaterial) {
  for (const texture of [material.normalMap, material.bumpMap, material.roughnessMap]) {
    if (texture) texture.colorSpace = THREE.NoColorSpace;
  }
}
