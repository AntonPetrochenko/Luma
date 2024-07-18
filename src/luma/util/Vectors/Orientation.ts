import { lerp } from "../Helpers/Lerp"
import { BlockFractionUnit, BlockUnit, MVec3 } from "./MVec3"

/** 
 * Minecraft yaw/pitch pair. Immutable. 
 * In Minecraft Classic, radians map as [0,255] -> [0,2pi]
 * */
export class Orientation {
  public precision = 256 
  public get yaw() { return Math.floor(this._yaw)%(this.precision) }
  public get pitch() { return Math.floor(this._pitch)%(this.precision) }

  //Lerp helper to wrap a radian angle (in Minecraft units, 0-255 EXCEPT SOME CPE)
  static lerpAxisToClosest(oStart: number, oEnd: number, amt: number, precision: number) {
    const oEndShifted = oEnd - precision

    const distanceReal = Math.abs(oEnd - oStart)
    const distanceShifted = Math.abs(oEndShifted - oStart)

    if (distanceReal > distanceShifted) {
      return Math.floor( lerp( oStart, oEndShifted, amt ) )%precision
    } else {
      return Math.floor( lerp( oStart, oEnd, amt ) )%precision
    }
  }

  //Interpolate towards another angle
  public lerp(goalYaw: number, goalPitch: number, amt: number) {
    return new Orientation(
      Orientation.lerpAxisToClosest( this.yaw, goalYaw, amt, this.precision ),
      Orientation.lerpAxisToClosest( this.pitch, goalPitch, amt, this.precision )
    )
  }

  public isEqualTo(other: Orientation) {
    return Math.floor(this.yaw) == Math.floor(other.yaw) && Math.floor(this.pitch) == Math.floor(other.pitch)
  }

  public toNormalVec3<T extends BlockUnit | BlockFractionUnit>(): MVec3<T> {
    //minecraft world is y-up, therefore
    // yaw is along x-y
    // pitch is along x-z
    const yawCorrected = Math.PI * ((this.yaw-64)/(this.precision/2))
    const pitchCorrected = Math.PI * (this.pitch/(this.precision/2))
    const xzLen = Math.cos(-pitchCorrected)
    const x = xzLen * Math.cos(-yawCorrected)
    const y = Math.sin(-pitchCorrected)
    const z = xzLen * Math.sin(yawCorrected)

    return new MVec3<T>(x as T, y as T, z as T)

  }
  private _yaw: number
  private _pitch: number
  constructor(yaw: number, pitch: number, precision?: number) {
    this._yaw = yaw,
    this._pitch = pitch
    if (precision)
      this.precision = precision
  }
}