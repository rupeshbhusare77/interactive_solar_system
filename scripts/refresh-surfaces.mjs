import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const names={saturn:['enceladus','mimas','tethys','dione','rhea','iapetus','phoebe'],jupiter:['io','europa','ganymede','callisto'],uranus:['ariel','umbriel','titania','oberon','miranda'],neptune:['triton']};
const records=[];
for(const [parent,moons] of Object.entries(names)) for(const id of moons) {
 const source=`https://science.nasa.gov/3d-resources/${parent}-${id==='io'?'io-a':id}/`;
 try {
  const response=await fetch(source,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(String(response.status));
  const html=await response.text();
  const links=[...html.matchAll(/href="([^"]+)"/g)].map(match=>match[1]).filter(url=>url.includes('/3d/resources/image/'));
  const belongs=url=>decodeURIComponent(url.split('/').pop()).toLowerCase().includes(id);
  const link=links.find(url=>/\.jpg$/i.test(url)&&belongs(url)) ?? links.find(url=>/\.tif$/i.test(url)&&belongs(url))?.replace(/\.tif$/i,'.jpg');
  if(!link)throw new Error('No photographic map');
  const image=await fetch(link,{signal:AbortSignal.timeout(30000)});if(!image.ok)throw new Error(String(image.status));
  const bytes=Buffer.from(await image.arrayBuffer());if(bytes[0]!==255||bytes[1]!==216)throw new Error('Not a JPEG');
  await writeFile(new URL(`../public/textures/${id}.jpg`,import.meta.url),bytes);
  const credit=(html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').match(/Credit:\s*(.*?)(?:Download|##|JPEG|TIFF|May 30)/i)?.[1]??'See linked NASA resource for contributor credits.').replace(/&amp;/g,'&').trim();
  records.push({id,source,download:link,credit,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,appearance:'Mission-image mosaic; coverage, color processing, and map seams are not a live surface observation.'});
  console.log(id,bytes.length);
 }catch(error){console.log(id,'unavailable:',error.message);}
}
await writeFile(new URL('../src/astronomy/generated/surfaceMaps.ts',import.meta.url),`// NASA mission-image map inventory.\nexport const SURFACE_MAPS = ${JSON.stringify(records)};\n`);
