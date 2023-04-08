import { Nominal } from "../Helpers/Nominal"

export type BlockUnit = Nominal<number, 'BlockUnit'>
export type BlockFractionUnit = Nominal<number, 'BlockFractionUnit'>

type MinecraftLengthUnit = BlockUnit | BlockFractionUnit

/** A vec3 in Minecraft space. Immutable, methods return new MVec3. */
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
      this.internalX + other.internalX as NumberType,
      this.internalY + other.internalY as NumberType,
      this.internalZ + other.internalZ as NumberType,
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
      this.internalX * scale as NumberType, // i know "as TypedNumber" doesn't really make sense here
      this.internalY * scale as NumberType, // but we're dealing with make-believe nominal types in ts
      this.internalZ * scale as NumberType  // so this is kind of required
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
}

export function MVec3FractionToBlock(v: MVec3<BlockFractionUnit>){
  return v.scaled(32) as unknown as MVec3<BlockUnit>
}

export function MVec3BlockToFraction(v: MVec3<BlockUnit>){
  return v.scaled(1/32) as unknown as MVec3<BlockFractionUnit>
}