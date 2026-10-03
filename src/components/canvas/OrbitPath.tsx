/**
 * 3D Solar System Simulator — Keplerian Orbit Path Component
 * Renders exact 3D elliptical orbits calculated from Keplerian elements.
 */

import React, { useMemo } from 'react';
import { CelestialBody } from '../../astronomy/types';
import { generateOrbitPathPoints } from '../../astronomy/kepler';
import { scalePosition } from '../../astronomy/scaling';
import { useSimulation } from '../../state/simulationContext';

interface OrbitPathProps {
  body: CelestialBody;
}

export const OrbitPath: React.FC<OrbitPathProps> = ({ body }) => {
  const { scaleMode, selectedBodyId, hoveredBodyId, viewToggles } = useSimulation();

  const isSelected = selectedBodyId === body.id;
  const isHovered = hoveredBodyId === body.id;

  // Generate 3D geometry points along the Keplerian ellipse
  const linePoints = useMemo(() => {
    if (!body.orbitalElements) return null;

    // More points for high-eccentricity comets to ensure smooth curvature near perihelion
    const pointCount = body.type === 'comet' ? 360 : 180;
    const rawPoints = generateOrbitPathPoints(body.orbitalElements, pointCount);

    const positions = new Float32Array(rawPoints.length * 3);
    for (let i = 0; i < rawPoints.length; i++) {
      const scaled = scalePosition(rawPoints[i], scaleMode);
      positions[i * 3] = scaled.x;
      positions[i * 3 + 1] = scaled.y;
      positions[i * 3 + 2] = scaled.z;
    }

    return positions;
  }, [body.orbitalElements, body.type, scaleMode]);

  if (!viewToggles.showOrbits || !linePoints) return null;

  // Opacity and color based on focus/type
  let opacity = 0.28;
  if (isSelected) opacity = 0.85;
  else if (isHovered) opacity = 0.6;
  else if (body.type === 'comet') opacity = 0.45;
  else if (body.type === 'dwarf') opacity = 0.22;

  const color = isSelected ? '#38bdf8' : body.physical.color;

  return (
    <lineLoop>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[linePoints, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </lineLoop>
  );
};
