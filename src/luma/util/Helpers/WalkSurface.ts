
const surfaceStepSize = 0.5

export function walkSurface(fromU: number, fromV: number, toU: number, toV: number, cb: (u: number, v: number) => void) {
  for (let ui = fromU; ui < toU; ui+=surfaceStepSize) {
    for (let vi = fromV; vi < toV; vi+=surfaceStepSize) {
      cb(ui, vi)
    }
    cb(ui, toV)
  } 
  for (let vi = fromV; vi < toV; vi+=surfaceStepSize) {
    cb(toU, vi)
  }
  cb(toU, toV)
}