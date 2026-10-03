/**
 * 3D Solar System Simulator — Real NASA Texture Manager with Procedural Fallback
 * Loads authentic high-resolution photographic NASA/JPL maps locally from /textures/,
 * falling back seamlessly to procedural canvas textures if needed.
 */

import * as THREE from 'three';
import {
  getCelestialTexture,
  getCelestialBumpMap,
  getSaturnRingTexture,
  getUranusRingTexture,
  getHaumeaRingTexture,
} from './proceduralTextures';

const loader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();

// Confirmed local NASA textures downloaded on disk
const KNOWN_LOCAL_TEXTURES = new Set([
  'earth.jpg',
  'earth_clouds.png',
  'earth_lights.png',
  'earth_normal.jpg',
  'earth_specular.jpg',
  'jupiter.jpg',
  'mars.jpg',
  'mars_bump.jpg',
  'mercury.jpg',
  'mercury_bump.jpg',
  'milkyway.png',
  'moon.jpg',
  'neptune.jpg',
  'pluto.jpg',
  'saturn.jpg',
  'saturn_ring.jpg',
  'sun.jpg',
  'uranus.jpg',
  'venus.jpg',
  'venus_bump.jpg',
]);

/**
 * Load a texture from local static assets or return a custom procedural texture
 */
export function loadPlanetTexture(filename: string, proceduralKey: string): THREE.Texture {
  if (cache.has(filename)) {
    return cache.get(filename)!;
  }

  // If local file is verified on disk, load it with TextureLoader
  if (KNOWN_LOCAL_TEXTURES.has(filename)) {
    const texture = loader.load(
      `/textures/${filename}`,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
      },
      undefined,
      () => {
        console.warn(`Fallback to procedural texture for ${filename}`);
        const fallback = getCelestialTexture(proceduralKey);
        cache.set(filename, fallback);
      }
    );

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    cache.set(filename, texture);
    return texture;
  }

  // Otherwise, immediately return dedicated high-fidelity procedural canvas texture
  const proceduralTex = getCelestialTexture(proceduralKey);
  cache.set(filename, proceduralTex);
  return proceduralTex;
}

/**
 * Load a bump map texture from local static assets or procedural bump map
 */
export function loadPlanetBumpMap(filename: string, proceduralKey: string): THREE.Texture {
  const cacheKey = `bump-${filename}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  if (KNOWN_LOCAL_TEXTURES.has(filename)) {
    const texture = loader.load(
      `/textures/${filename}`,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
      }
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    cache.set(cacheKey, texture);
    return texture;
  }

  const fallback = getCelestialBumpMap(proceduralKey);
  cache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Load Saturn's ring texture
 */
export function loadSaturnRingTexture(): THREE.Texture {
  if (cache.has('saturn_ring')) {
    return cache.get('saturn_ring')!;
  }

  const texture = loader.load(
    '/textures/saturn_ring.jpg',
    (tex) => {
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
    },
    undefined,
    () => {
      const fallback = getSaturnRingTexture();
      cache.set('saturn_ring', fallback);
    }
  );

  cache.set('saturn_ring', texture);
  return texture;
}

/**
 * Load dedicated ring texture based on celestial body ID
 */
export function loadRingTexture(bodyId: string): THREE.Texture {
  if (bodyId === 'uranus') {
    return getUranusRingTexture();
  }
  if (bodyId === 'haumea') {
    return getHaumeaRingTexture();
  }
  return loadSaturnRingTexture();
}

/**
 * Load Earth's inverted roughness map from earth_specular.jpg
 * In specular maps: oceans are white (reflective), land is black (matte).
 * In Three.js standard roughness maps: oceans must be dark (smooth/glossy), land must be light (rough).
 */
export function loadEarthRoughnessMap(): THREE.Texture {
  const cacheKey = 'earth-roughness';
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const canvasTexture = new THREE.CanvasTexture(canvas);
  canvasTexture.wrapS = THREE.RepeatWrapping;
  canvasTexture.wrapT = THREE.ClampToEdgeWrapping;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    if (!ctx) return;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const spec = data[i]; // 255 = water, 0 = land
      // Invert: Water -> roughness 0.08 (~20); Land -> roughness 0.9 (~230)
      const rough = Math.round(230 - (spec / 255) * 210);
      data[i] = rough;
      data[i + 1] = rough;
      data[i + 2] = rough;
    }
    ctx.putImageData(imgData, 0, 0);
    canvasTexture.needsUpdate = true;
  };
  img.src = '/textures/earth_specular.jpg';

  cache.set(cacheKey, canvasTexture);
  return canvasTexture;
}

/**
 * Load tangent-space normal map
 */
export function loadPlanetNormalMap(filename: string): THREE.Texture {
  const cacheKey = `normal-${filename}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const texture = loader.load(
    `/textures/${filename}`,
    (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
    }
  );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  cache.set(cacheKey, texture);
  return texture;
}
