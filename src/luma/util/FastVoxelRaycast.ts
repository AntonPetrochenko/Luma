import {default as raycast} from 'fast-voxel-raycast'
import { MVec3, BlockUnit, MVec3BlockToFraction } from './Vectors/MVec3'
import { World } from '../classes/World'
import { Orientation } from './Vectors/Orientation'
import { globalParticleEffect } from '../cpe_modules/CustomParticles'

interface IGetterOpts {
  skipList?: Set<number>
  skipPositions?: MVec3<BlockUnit>[]
}

export const SUBVOXEL_SCALE = 8
export const SLABS = new Set<number>([ Block.Vanilla.Slab ])

export function makeVoxelGetter(world: World, opts: IGetterOpts)  {
  return function (x: number, y: number, z: number) {
    
    const xScaled = Math.floor(x/SUBVOXEL_SCALE)
    const yScaled = Math.floor(y/SUBVOXEL_SCALE)
    const zScaled = Math.floor(z/SUBVOXEL_SCALE)

    const xSubVoxel = x%SUBVOXEL_SCALE
    const ySubVoxel = y%SUBVOXEL_SCALE
    const zSubVoxel = z%SUBVOXEL_SCALE
    
    if (opts.skipPositions && opts.skipPositions.find( (m) => { return m.clientX == x && m.clientY == y && m.clientZ == z })) return 0

    // verify subvoxel...

    
    const foundId = world.getBlockAtXYZ(xScaled,yScaled,zScaled)

    if (SLABS.has(foundId) && ySubVoxel > 3) {
      return 0
    }
    
    if (opts.skipList && opts.skipList.has(foundId)) return 0

    return foundId
  }
}

export interface RaycastResult {
  result: number
  position: MVec3<BlockUnit>
  normal: [number, number, number],
  distance: number
}

/** Wrapped Fast Voxel Raycast */
export function castAlong(world: World, origin: MVec3<BlockUnit>, direction: MVec3<BlockUnit>, distance = 128, getterOpts: IGetterOpts = {}): RaycastResult | undefined {

  const originScaled = origin.scaled(SUBVOXEL_SCALE)
  const out_position: [number, number, number] = [0,0,0]
  const out_normal: [number, number, number] = [0,0,0]
  const result = raycast( makeVoxelGetter(world, getterOpts), originScaled.toArray(), direction.normalized().toArray(), distance*SUBVOXEL_SCALE, out_position, out_normal)

  const resultPosition = new MVec3(...out_position as [BlockUnit,BlockUnit,BlockUnit]).divRound(SUBVOXEL_SCALE)

  

  const resultDistance = resultPosition.delta(origin).magnitude/SUBVOXEL_SCALE
  if (result > 0) {
    return {
      result, position: resultPosition, normal: out_normal, distance: resultDistance
    } 
  }
} 

export function castTowards(world: World, origin: MVec3<BlockUnit>, direction: Orientation) {
  const directionVector = direction.toNormalVec3() as MVec3<BlockUnit> // it's a normal, we don't care about the units :)
  return castAlong(world, origin, directionVector)
}