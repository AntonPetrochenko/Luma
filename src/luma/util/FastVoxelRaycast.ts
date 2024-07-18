import {default as raycast} from 'fast-voxel-raycast'
import { MVec3, BlockUnit } from './Vectors/MVec3'
import { World } from '../classes/World'
import { Orientation } from './Vectors/Orientation'

interface IGetterOpts {
  skipList?: number[]
  skipPositions?: MVec3<BlockUnit>[]
}

export function makeVoxelGetter(world: World, opts: IGetterOpts)  {
  return function (x: number, y: number, z: number) {
    if (opts.skipPositions && opts.skipPositions.find( (m) => { return m.clientX == x && m.clientY == y && m.clientZ == z })) return 0
    
    const foundId = world.getBlockAtXYZ(x,y,z)
    if (opts.skipList && opts.skipList.includes(foundId)) return 0

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
  const out_position: [number, number, number] = [0,0,0]
  const out_normal: [number, number, number] = [0,0,0]
  const result = raycast( makeVoxelGetter(world, getterOpts), origin.toArray(), direction.normalized().toArray(), distance, out_position, out_normal)

  const resultPosition = new MVec3(...out_position as [BlockUnit, BlockUnit, BlockUnit])

  const resultDistance = resultPosition.delta(origin).magnitude
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