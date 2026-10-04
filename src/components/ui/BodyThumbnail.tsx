import type { CelestialBody } from '../../astronomy/types';
import { SURFACE_MAPS } from '../../astronomy/generated/surfaceMaps';

const BODY_TEXTURES = new Set([
  'sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'moon', ...SURFACE_MAPS.map(map => map.id),
]);

export function BodyThumbnail({ body }: { body: CelestialBody }) {
  return (
    <div
      aria-hidden="true"
      className={`body-thumbnail body-thumbnail-${body.id} ${body.type === 'comet' ? 'body-thumbnail-comet' : ''}`}
    >
      <div className="body-thumbnail-sphere" style={{ backgroundColor: body.physical.color }}>
        {BODY_TEXTURES.has(body.textureType) && (
          <img
            src={`${import.meta.env.BASE_URL}textures/${body.textureType}.jpg`}
            alt=""
            draggable={false}
            onError={event => { event.currentTarget.hidden = true; }}
          />
        )}
      </div>
    </div>
  );
}
