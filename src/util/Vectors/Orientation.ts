import { lerp } from "../Helpers/Lerp"

/** 
 * Minecraft yaw/pitch pair. Immutable. 
 * In Minecraft Classic, radians map as [0,255] -> [0,2pi]
 * */
export class Orientation {
  public get yaw() { return Math.floor(this._yaw)%256 }
  public get pitch() { return Math.floor(this._pitch)%256 }

  //Lerp helper to wrap a radian angle (in Minecraft units, 0-255)
  static lerpAxisToClosest(oStart: number, oEnd: number, amt: number) {
    const oEndShifted = oEnd - 256

    const distanceReal = Math.abs(oEnd - oStart)
    const distanceShifted = Math.abs(oEndShifted - oStart)

    if (distanceReal > distanceShifted) {
      return Math.floor( lerp( oStart, oEndShifted, amt ) )%256
    } else {
      return Math.floor( lerp( oStart, oEnd, amt ) )%256
    }
  }

  //Interpolate towards another angle
  public lerp(goalYaw: number, goalPitch: number, amt: number) {
    return new Orientation(
      Orientation.lerpAxisToClosest( this.yaw, goalYaw, amt ),
      Orientation.lerpAxisToClosest( this.pitch, goalPitch, amt )
    )
  }

  public isEqualTo(other: Orientation) {
    return this.yaw == other.yaw && this.pitch == other.pitch
  }
  private _yaw: number
  private _pitch: number
  constructor(yaw: number, pitch: number) {
    this._yaw = yaw,
    this._pitch = pitch
  }
}