export function walkSurface(fromU: number, fromV: number, toU: number, toV: number, cb: (u: number, v: number) => void) {
  for (let ui = fromU; ui < toU; ui++) {
    for (let vi = fromV; vi < toV; vi++) {
      cb(ui, vi)
    }
  }
  cb(toU, toV)
}