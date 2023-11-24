import {default as raycast} from 'fast-voxel-raycast'
import { MVec3, BlockUnit, BlockFractionUnit } from './Vectors/MVec3'
import { World } from '../classes/World'
import { Orientation } from './Vectors/Orientation'

export function makeVoxelGetter(world: World) {
  return function (x: number, y: number, z: number) {
    return world.getBlockAtXYZ(x,y,z)
  }
}

export interface RaycastResult {
  result: number
  position: MVec3<BlockUnit>
  normal: [number, number, number]
}

/** Wrapped Fast Voxel Raycast */
export function castAlong(world: World, origin: MVec3<BlockUnit>, direction: MVec3<BlockUnit>, distance = 128): RaycastResult {
  const out_position: [number, number, number] = [0,0,0]
  const out_normal: [number, number, number] = [0,0,0]
  const result = raycast( makeVoxelGetter(world), origin.toArray(), direction.normalized().toArray(), distance, out_position, out_normal)
  return {
    result, position: new MVec3(...out_position as [BlockUnit, BlockUnit, BlockUnit]), normal: out_normal
  } 
} 

export function castTowards(world: World, origin: MVec3<BlockUnit>, direction: Orientation) {
  const directionVector = direction.toNormalVec3() as MVec3<BlockUnit> // it's a normal, we don't care about the units :)
  return castAlong(world, origin, directionVector)
}