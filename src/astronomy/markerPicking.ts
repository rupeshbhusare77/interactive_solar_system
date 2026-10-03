/** Choose the nearest visible marker within six screen pixels; display scale cannot enlarge its hit area. */
export function nearestProjectedMarker(points:ArrayLike<number>,x:number,y:number):number|null {
  let nearest:number|null=null,best=36;
  for(let index=0;index<points.length;index+=3) {
    const distance=(points[index]-x)**2+(points[index+1]-y)**2;
    if(points[index+2]>0 && Number.isFinite(distance) && distance<best){best=distance;nearest=index/3;}
  }
  return nearest;
}
