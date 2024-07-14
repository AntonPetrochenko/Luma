export function walkSurface(fromU: number, fromV: number, toU: number, toV: number, cbb: (u: number, v: number) => void) {
  let count = 0;
  const cb = (a: number,b: number) => { count+=1; cbb(a,b) }
  for (let ui = fromU; ui < toU; ui++) {
    for (let vi = fromV; vi < toV; vi++) {
      cb(ui, vi)
    }
    cb(ui, toV)
  } 
  for (let vi = fromV; vi < toV; vi++) {
    cb(toU, vi)
  }
  cb(toU, toV)
}