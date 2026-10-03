/** Circular ring boundaries from the NASA PDS Ring-Moon Systems Node; optical depths are representative values within observed ranges. */
export const SATURN_RINGS = { innerKm:66900, outerKm:140612, source:'https://pds-rings.seti.org/saturn/saturn_tables.html' };
export function saturnRingOpacity(radiusKm:number):number {
  if(radiusKm<66900 || radiusKm>140612)return 0;
  if((radiusKm>=133423&&radiusKm<=133745)||(radiusKm>=136487&&radiusKm<=136522)||(radiusKm>=117500&&radiusKm<=117930))return 0;
  const depth=radiusKm<74491?0.0001:radiusKm<91975?0.2:radiusKm<117500?1.5:radiusKm<122050?0.05:radiusKm<136770?0.7:radiusKm<139826?0.0001:0.1;
  return 1-Math.exp(-depth);
}
