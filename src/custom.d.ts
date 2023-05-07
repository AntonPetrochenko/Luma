declare module 'fast-voxel-raycast' {
  export default function raycast<T>( getVoxel: (x: number, y: number, z: number) => T, start: [number, number, number], direction: [number, number, number], distance: number, outHitPosition: [number, number, number], outHitNormal: [number, number, number]): T | 0
}