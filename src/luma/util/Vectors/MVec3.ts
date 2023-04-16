import { Nominal } from "../Helpers/Nominal"

export type BlockUnit = Nominal<number, 'BlockUnit'>
export type BlockFractionUnit = Nominal<number, 'BlockFractionUnit'>

type MinecraftLengthUnit = BlockUnit | BlockFractionUnit

/** A nominally typed vec3 in Minecraft space. Immutable, methods return new MVec3. */
export class MVec3<NumberType extends MinecraftLengthUnit> {

  public readonly identity: string  
  constructor(
    public internalX: NumberType,
    public internalY: NumberType,
    public internalZ: NumberType
  ) {
    this.identity = `${this.internalX} ${this.internalY} ${this.internalZ}`
  }

  //As far as Minecraft is concerned, these are integers. Let's treat them appropriately.
  //We'll see how well this design decision goes
  public get x(): NumberType { return Math.floor(this.internalX) as NumberType }
  public get y(): NumberType { return Math.floor(this.internalY) as NumberType }
  public get z(): NumberType { return Math.floor(this.internalZ) as NumberType }

  //For internal calculations, private values are used for extra precision
  copy() {
   return new MVec3<NumberType>(this.internalX, this.internalY, this.internalZ) 
  }

  sum(other: MVec3<NumberType>) {
    return new MVec3<NumberType> (
      this.internalX + other.internalX as NumberType, // i know "as NumberType" doesn't really make sense here
      this.internalY + other.internalY as NumberType, // but we're dealing with make-believe nominal types in ts
      this.internalZ + other.internalZ as NumberType, // so this is kind of required
    )
  }

  offset(x: number,y: number,z: number) {
    return new MVec3<NumberType>(
      this.internalX + x as NumberType,
      this.internalY + y as NumberType,
      this.internalZ + z as NumberType
    )
  }

  delta(towards: MVec3<NumberType>) {
    return new MVec3<NumberType> (
      towards.internalX - this.internalX as NumberType,
      towards.internalY - this.internalY as NumberType,
      towards.internalZ - this.internalZ as NumberType,
    )
  }

  scaled(scale: number) {
    return new MVec3<NumberType> (
      this.internalX * scale as NumberType, 
      this.internalY * scale as NumberType, 
      this.internalZ * scale as NumberType  
    )
  }

  public get magnitude(): NumberType {
    return Math.sqrt(this.internalX^2 + this.internalY^2 + this.internalZ^2) as NumberType
  }

  public normalized() {
    return new MVec3<NumberType> (
      this.internalX / this.magnitude as NumberType,
      this.internalX / this.magnitude as NumberType,
      this.internalX / this.magnitude as NumberType,
    ) 
  }

  
  /** Whether or not the two vectors point to the same point in Minecraft space */
  public isEqualTo(other: MVec3<NumberType>) {
    return (
      this.x == other.x && this.y == other.y && this.z == other.z
    )
  }

  /** 
   * Whether or not this MVec3 lands within the bounds created by a pair of other MVec3 
   * */
  public boundedBy(start: MVec3<NumberType>, end: MVec3<NumberType>) {
    return (
      this.internalX >= start.internalX && this.internalX <= end.internalX &&
      this.internalY >= start.internalY && this.internalY <= end.internalY &&
      this.internalZ >= start.internalZ && this.internalZ <= end.internalZ 
    )
  }

  static zeroBlock = new MVec3<BlockUnit>(0 as BlockUnit,0 as BlockUnit,0 as BlockUnit)
  static zeroFraction = new MVec3<BlockFractionUnit>(0 as BlockFractionUnit,0 as BlockFractionUnit,0 as BlockFractionUnit)
}

export function MVec3FractionToBlock(v: MVec3<BlockFractionUnit>){
  return v.scaled(32) as unknown as MVec3<BlockUnit>
}

export function MVec3BlockToFraction(v: MVec3<BlockUnit>){
  return v.scaled(1/32) as unknown as MVec3<BlockFractionUnit>
}