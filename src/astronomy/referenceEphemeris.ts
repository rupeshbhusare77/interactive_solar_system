import { REFERENCE_IDS } from './generated/referenceIndex';
import { Vector3D } from './types';
export interface ReferenceData { id:string; parent:string|null; samples:number[][]; validation:{maxErrorKm:number;checks:number} }
const records=new Map<string,ReferenceData>();
const requested=new Set<string>();
export let referenceRevision=0;
export function installReference(data:ReferenceData) {
  if(data.samples.length<2 || data.samples.some((row,i)=>row.length!==7 || row.some(v=>!Number.isFinite(v)) || (i>0 && row[0]<=data.samples[i-1][0]))) throw new Error('Invalid reference samples');
  records.set(data.id,data); referenceRevision++;
}
export function referenceStatus(id:string,date:Date) {
  const data=records.get(id), jd=date.getTime()/86400000+2440587.5;
  return data && jd>=data.samples[0][0] && jd<=data.samples[data.samples.length-1][0] ? `JPL reference interpolation; withheld midpoint error ≤ ${data.validation.maxErrorKm.toFixed(3)} km` : 'Approximate mean-element model; reference positions unavailable for this date.';
}
export function referenceState(id:string,date:Date): {position:Vector3D;velocity:Vector3D}|null {
  const jd=date.getTime()/86400000+2440587.5;
  if(!Number.isFinite(jd)) return null;
  const data=records.get(id);
  if(!data && REFERENCE_IDS.includes(id) && !requested.has(id) && typeof window!=='undefined' && jd>=2461314.5 && jd<=2461322.5) {
    requested.add(id);
    fetch(`${import.meta.env.BASE_URL}science/${id}.json`).then(response=>response.ok?response.json():null).then(value=>{if(value)installReference(value);}).catch(()=>{});
  }
  if(!data || jd<data.samples[0][0] || jd>data.samples[data.samples.length-1][0]) return null;
  let low=0,high=data.samples.length-1;
  while(high-low>1){const mid=(low+high)>>1;if(data.samples[mid][0]<=jd)low=mid;else high=mid;}
  const a=data.samples[low],b=data.samples[high],h=b[0]-a[0],t=(jd-a[0])/h;
  const p=[],v=[];
  for(let i=0;i<3;i++) {
    p.push((2*t**3-3*t*t+1)*a[i+1]+(t**3-2*t*t+t)*h*a[i+4]+(-2*t**3+3*t*t)*b[i+1]+(t**3-t*t)*h*b[i+4]);
    v.push((6*t*t-6*t)/h*a[i+1]+(3*t*t-4*t+1)*a[i+4]+(-6*t*t+6*t)/h*b[i+1]+(3*t*t-2*t)*b[i+4]);
  }
  const world=(vector:number[])=>({x:vector[0],y:vector[2],z:-vector[1]});
  return {position:world(p),velocity:world(v)};
}
