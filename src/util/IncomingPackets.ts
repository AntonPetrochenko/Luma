/* eslint-disable @typescript-eslint/no-explicit-any */
import { unpack } from "python-struct"

export class PlayerIdentification {
  public username: string
  public verificationKey: string
  public wantsCPE: boolean
  constructor(packet: Buffer) {
    const data = unpack('>BB64s64sB', packet) as Array<any>
    this.username = data[2]
    this.verificationKey = data[3]
    this.wantsCPE = data[4] == 0x42
  }
}

export class PositionAndOrientation {
  public playerId: number
  public fX: number
  public fY: number
  public fZ: number
  public yaw: number
  public pitch: number
  constructor(packet: Buffer) {
    const data = unpack('>BBHHHBB', packet) as Array<any>
    this.playerId = data[1]
    this.fX = data[2]
    this.fY = data[3]
    this.fZ = data[4]
    this.yaw = data[5]
    this.pitch = data[6]
  }
}