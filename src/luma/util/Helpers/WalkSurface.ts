import { BlockUnit, MVec3 } from "../Vectors/MVec3"

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

export function walkVolume(min: MVec3<BlockUnit>, max: MVec3<BlockUnit>, cb: (x: number, y: number, z: number) => void) {
  const [minX, minY, minZ] = min.toArray()
  const [maxX, maxY, maxZ] = max.toArray()
  
  for (let xi = minX; xi < maxX; xi += surfaceStepSize*2) {
    for (let yi = minY; yi < maxY; yi += surfaceStepSize*2) {
      for (let zi = minZ; zi < maxZ; zi += surfaceStepSize*2) {
        cb(xi, yi, zi)
      }
      cb(xi, yi, maxZ)
    }
    cb(xi, maxY, maxZ)
  }
}