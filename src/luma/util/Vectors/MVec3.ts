import { mod } from "../Helpers/Modulo"
import { Nominal } from "../Helpers/Nominal"
import { Orientation } from "./Orientation"

export type BlockUnit = Nominal<number, 'BlockUnit'>
export type BlockFractionUnit = Nominal<number, 'BlockFractionUnit'>

export type MinecraftLengthUnit = BlockUnit | BlockFractionUnit

const hpi = Math.PI / 2

/** A nominally typed vec3 in Minecraft space. Immutable, methods return new MVec3. */
export class MVec3<NumberType extends MinecraftLengthUnit> {

  public readonly identity: string  
  constructor(
    public x: NumberType,
    public y: NumberType,
    public z: NumberType
  ) {
    this.identity = `X: ${Math.floor(this.x)} Y: ${Math.floor(this.y)} Z: ${Math.floor(this.z)}`
  }

  //As far as Minecraft is concerned, these are integers. Let's treat them appropriately.
  //We'll see how well this design decision goes
  public get clientX(): NumberType { return Math.floor(this.x) as NumberType }
  public get clientY(): NumberType { return Math.floor(this.y) as NumberType }
  public get clientZ(): NumberType { return Math.floor(this.z) as NumberType }

  //For internal calculations, private values are used for extra precision
  copy() {
   return new MVec3<NumberType>(this.x, this.y, this.z) 
  }

  sum(other: MVec3<NumberType>) {
    return new MVec3<NumberType> (
      this.x + other.x as NumberType, // i know "as NumberType" doesn't really make sense here
      this.y + other.y as NumberType, // but we're dealing with make-believe nominal types in ts
      this.z + other.z as NumberType, // so this is kind of required
    )
  }

  offset(x: number,y: number,z: number) {
    return new MVec3<NumberType>(
      this.x + x as NumberType,
      this.y + y as NumberType,
      this.z + z as NumberType
    )
  }

  delta(towards: MVec3<NumberType>) {
    return new MVec3<NumberType> (
      towards.x - this.x as NumberType,
      towards.y - this.y as NumberType,
      towards.z - this.z as NumberType,
    )
  }

  scaled(scale: number) {
    return new MVec3<NumberType> (
      this.x * scale as NumberType, 
      this.y * scale as NumberType, 
      this.z * scale as NumberType  
    )
  }

  divRound(d: number) {
    return new MVec3<NumberType> (
      this.x / d as NumberType, 
      this.y / d as NumberType, 
      this.z / d as NumberType  
    )
  }



  public get magnitude(): NumberType {
    return Math.sqrt(this.x**2 + this.y**2 + this.z**2) as NumberType
  }

  public normalized() {

    //just in case
    if (this.x == 0 && this.y == 0 && this.z == 0) {
      return new MVec3<NumberType>(0 as NumberType, 0 as NumberType, -1 as NumberType)
    }

    return new MVec3<NumberType> (
      this.x / this.magnitude as NumberType,
      this.y / this.magnitude as NumberType,
      this.z / this.magnitude as NumberType,
    ) 
  }

  toOrientation(): Orientation {
    const pitch = mod( ( Math.asin (this.y)        ) / Math.PI * 128, 256 );

    const yaw =   mod( ( Math.atan2(this.z, this.x) - hpi ) / Math.PI * 128, 256)

    return new Orientation(yaw, pitch)
  }

  
  /** Whether or not the two vectors point to the same point in Minecraft space */
  public isEqualTo(other: MVec3<NumberType>) {
    return (
      this.clientX == other.clientX && this.clientY == other.clientY && this.clientZ == other.clientZ
    )
  }

  /** 
   * Whether or not this MVec3 lands within the bounds created by a pair of other MVec3 
   * */
  public boundedBy(start: MVec3<NumberType>, end: MVec3<NumberType>) {
    return (
      this.x >= start.x && this.x <= end.x &&
      this.y >= start.y && this.y <= end.y &&
      this.z >= start.z && this.z <= end.z 
    )
  }

  static zeroBlock = new MVec3<BlockUnit>(0 as BlockUnit,0 as BlockUnit,0 as BlockUnit)
  static zeroFraction = new MVec3<BlockFractionUnit>(0 as BlockFractionUnit,0 as BlockFractionUnit,0 as BlockFractionUnit)

  static makeZeroBlock = () => new MVec3<BlockUnit>(0 as BlockUnit,0 as BlockUnit,0 as BlockUnit)
  static makeZeroFraction = () => new MVec3<BlockFractionUnit>(0 as BlockFractionUnit,0 as BlockFractionUnit,0 as BlockFractionUnit)

  static fromArray<NumberType extends MinecraftLengthUnit>(vec: [number, number, number]) {
    return new MVec3<NumberType>(
      vec[0] as NumberType,
      vec[1] as NumberType,
      vec[2] as NumberType
    )
  }

  public toArray(): [number, number, number] {
    return [this.x, this.y, this.z]
  }
}

export function MVec3FractionToBlock(v: MVec3<BlockFractionUnit>){
  return v.scaled(1/32) as unknown as MVec3<BlockUnit>
}

export function MVec3BlockToFraction(v: MVec3<BlockUnit>){
  return v.scaled(32) as unknown as MVec3<BlockFractionUnit>
}