import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { JPL_CATALOG } from '../src/astronomy/generated/jplCatalog.ts';
const root=new URL('../public/science/',import.meta.url);
await mkdir(root,{recursive:true});
const planets=[['mercury',199],['venus',299],['earth',399],['mars',499],['jupiter',599],['saturn',699],['uranus',799],['neptune',899],['pluto',999]];
const moons=JPL_CATALOG.satellites.filter(row=>(row.radius??0)>=100 || ['Pan','Atlas','Prometheus','Pandora','Janus','Epimetheus','Daphnis','Nix','Hydra','Kerberos','Styx','Phobos','Deimos'].includes(row.name));
const entries=[...planets.map(([id,code])=>({id,code,parent:null,periodDays:365})),...moons.map(row=>({id:row.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,''),code:row.code,parent:row.parent,periodDays:row.periodDays}))];
const parentCodes=Object.fromEntries(planets);
const manifest={source:'https://ssd.jpl.nasa.gov/horizons/',verifiedOn:new Date().toISOString().slice(0,10),start:'2026-10-01T00:00:00Z',stop:'2026-10-09T00:00:00Z',frame:'J2000 ecliptic; geometric, no light-time correction; UT input',bodies:[],failures:[]};
function hermite(a,b,time){const h=b[0]-a[0],t=(time-a[0])/h;return [0,1,2].map(i=>(2*t**3-3*t*t+1)*a[i+1]+(t**3-2*t*t+t)*h*a[i+4]+(-2*t**3+3*t*t)*b[i+1]+(t**3-t*t)*h*b[i+4]);}
for(const entry of entries){
 try {
  const minutes=Math.max(5,Math.min(180,Math.floor(entry.periodDays*1440/64)));
  const parameters={format:'json',COMMAND:String(entry.code),OBJ_DATA:'NO',MAKE_EPHEM:'YES',EPHEM_TYPE:'VECTORS',CENTER:`500@${entry.parent?parentCodes[entry.parent]:10}`,START_TIME:'2026-10-01',STOP_TIME:'2026-10-09',STEP_SIZE:`${minutes} m`,REF_PLANE:'ECLIPTIC',REF_SYSTEM:'ICRF',TIME_TYPE:'UT',OUT_UNITS:'AU-D',VEC_TABLE:'2',VEC_CORR:'NONE',CSV_FORMAT:'YES'};
  const url='https://ssd.jpl.nasa.gov/api/horizons.api?'+new URLSearchParams(Object.entries(parameters).map(([k,v])=>[k,k==='format'?v:`'${v}'`]));
  const response=await fetch(url,{signal:AbortSignal.timeout(60000)});
  const payload=await response.json();
  if(payload.error||!payload.result?.includes('$$SOE')) throw new Error(payload.error??'No vector table');
  const vectors=payload.result.split('$$SOE')[1].split('$$EOE')[0].trim().split('\n').map(line=>{const cells=line.split(',');return [Number(cells[0]),...cells.slice(2,8).map(Number)];});
  if(vectors.some(row=>row.length!==7||row.some(value=>!Number.isFinite(value))))throw new Error('Malformed vectors');
  const samples=vectors.filter((_,i)=>i%2===0);
  let maxErrorKm=0;
  for(let i=1;i+1<vectors.length;i+=2){const p=hermite(vectors[i-1],vectors[i+1],vectors[i][0]);maxErrorKm=Math.max(maxErrorKm,Math.hypot(...p.map((v,j)=>v-vectors[i][j+1]))*149597870.7);}
  const data={id:entry.id,parent:entry.parent,request:parameters,samples,validation:{kind:'Independent withheld JPL midpoint samples',maxErrorKm,checks:Math.floor((vectors.length-1)/2), checkpoints:[vectors[1],vectors[Math.min(vectors.length-2,2*Math.floor(vectors.length/4)+1)]]}};
  if(maxErrorKm>5)throw new Error(`Interpolation error ${maxErrorKm} km exceeds 5 km gate`);
  await writeFile(new URL(entry.id+'.json',root),JSON.stringify(data));
  manifest.bodies.push({id:entry.id,maxErrorKm,samples:samples.length});
  console.log(entry.id, samples.length, maxErrorKm.toFixed(4)+' km');
 }catch(error){manifest.failures.push({id:entry.id,error:String(error.message)});console.log('Unavailable:',entry.id,String(error.message).slice(0,150));}
 await writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2));
}

await writeFile(new URL('../src/astronomy/generated/referenceIndex.ts',import.meta.url), '// Generated reference IDs.\nexport const REFERENCE_IDS = '+JSON.stringify(manifest.bodies.map(x=>x.id))+';\n');
