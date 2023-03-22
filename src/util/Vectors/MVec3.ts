import { Nominal } from "../Nominal"

export type BlockUnit = Nominal<number, 'BlockUnit'>
export type BlockFractionUnit = Nominal<number, 'BlockFractionUnit'>

type MinecraftLengthUnit = BlockUnit | BlockFractionUnit

/** A vec3 in Minecraft space. Immutable, methods return new MVec3. */
export class MVec3<NumberType extends MinecraftLengthUnit> {
  constructor(
    private _x: NumberType,
    private _y: NumberType,
    private _z: NumberType
  ) {}

  //As far as Minecraft is concerned, these are integers. Let's treat them appropriately.
  //We'll see how well this design decision goes
  public get x(): NumberType { return Math.floor(this._x) as NumberType }
  public get y(): NumberType { return Math.floor(this._y) as NumberType }
  public get z(): NumberType { return Math.floor(this._z) as NumberType }

  //For internal calculations, private values are used for extra precision
  copy() {
   return new MVec3<NumberType>(this._x, this._y, this._z) 
  }

  sum(other: MVec3<NumberType>) {
    return new MVec3<NumberType> (
      this._x + other._x as NumberType,
      this._y + other._y as NumberType,
      this._z + other._z as NumberType,
    )
  }

  scaled(scale: number) {
    return new MVec3<NumberType> (
      this._x * scale as NumberType, // i know "as TypedNumber" doesn't really make sense here
      this._y * scale as NumberType, // but we're dealing with make-believe nominal types in ts
      this._z * scale as NumberType  // so this is kind of required
    )
  }

  public get magnitude(): number {
    return Math.sqrt(this._x^2 + this._y^2 + this._z^2)
  }

  public normalized() {
    return new MVec3<NumberType> (
      this._x / this.magnitude as NumberType,
      this._x / this.magnitude as NumberType,
      this._x / this.magnitude as NumberType,
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