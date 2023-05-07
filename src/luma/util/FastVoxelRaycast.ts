import {default as raycast} from 'fast-voxel-raycast'
import { MVec3, BlockUnit, BlockFractionUnit } from './Vectors/MVec3'
import { World } from '../classes/World'
import { Orientation } from './Vectors/Orientation'

export function makeVoxelGetter(world: World) {
  return function (x: number, y: number, z: number) {
    return world.getBlockAtXYZ(x,y,z)
  }
}

/** Wrapped Fast Voxel Raycast */
export function castAlong(world: World, origin: MVec3<BlockUnit | BlockFractionUnit>, direction: MVec3<BlockUnit | BlockFractionUnit>, distance = 128): number {
  const out_position: [number, number, number] = [0,0,0]
  const out_normal: [number, number, number] = [0,0,0]
  return raycast( makeVoxelGetter(world), origin.toArray(), direction.normalized().toArray(), distance, out_position, out_normal)
} 

export function castTowards(world: World, origin: MVec3<BlockUnit | BlockFractionUnit>, direction: Orientation) {
  const directionVector = direction.toNormalVec3()
  return castAlong(world, origin, directionVector)
}