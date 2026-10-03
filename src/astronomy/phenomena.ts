import { Vector3D } from './types';
const subtract=(a:Vector3D,b:Vector3D)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot=(a:Vector3D,b:Vector3D)=>a.x*b.x+a.y*b.y+a.z*b.z;
const length=(a:Vector3D)=>Math.hypot(a.x,a.y,a.z);
export function illuminatedFraction(body:Vector3D,sun:Vector3D,observer:Vector3D) {
  const light=subtract(sun,body),view=subtract(observer,body),denominator=length(light)*length(view);
  return denominator>0 ? (1+Math.max(-1,Math.min(1,dot(light,view)/denominator)))/2 : null;
}
/** Angular disk overlap at an observer, using physical coordinates and spherical radii in matching units. */
export function diskOverlap(observer:Vector3D,target:Vector3D,targetRadius:number,occluder:Vector3D,occluderRadius:number):'none'|'partial'|'total'|'annular'|'unavailable' {
  const t=subtract(target,observer),o=subtract(occluder,observer),td=length(t),od=length(o);
  if(![td,od,targetRadius,occluderRadius].every(Number.isFinite)||td<=targetRadius||od<=occluderRadius||targetRadius<=0||occluderRadius<=0)return 'unavailable';
  if(od>=td)return 'none';
  const separation=Math.acos(Math.max(-1,Math.min(1,dot(t,o)/(td*od))));
  const tr=Math.asin(targetRadius/td),or=Math.asin(occluderRadius/od);
  if(separation>=tr+or)return 'none';
  if(separation+tr<=or)return 'total';
  if(separation+or<=tr)return 'annular';
  return 'partial';
}
export function barycenter(a:Vector3D,massA:number,b:Vector3D,massB:number):Vector3D|null {
  if(!(massA>0&&massB>0&&Number.isFinite(massA+massB)))return null;
  const fraction=massB/(massA+massB);
  return {x:a.x+(b.x-a.x)*fraction,y:a.y+(b.y-a.y)*fraction,z:a.z+(b.z-a.z)*fraction};
}
