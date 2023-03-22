import { unpack } from "python-struct"
import { BlockFractionUnit, BlockUnit, MVec3 } from "../util/Vectors/MVec3"

export class PlayerIdentification{
  constructor(
    public username: string,
    public verificationKey: string,
    public wantsCPE: boolean
  ) {}
  static from(packet: Buffer) {
    const data = unpack('>BB64s64sB', packet) as [number, number, string, string, number]
    return new this(data[2].trimEnd(), data[3].trimEnd(), data[4] == 0x42)
  }
}

export class PositionAndOrientation{
  constructor(
    public playerId: number,
    public position: MVec3<BlockFractionUnit>,
    public yaw: number,
    public pitch: number
  ) {}
  
  static from(packet: Buffer) {
    const data = unpack('>BBHHHBB', packet) as [number, number, BlockFractionUnit, BlockFractionUnit, BlockFractionUnit, number, number]
    return new this(data[1], new MVec3<BlockFractionUnit>( data[2], data[3], data[4] ), data[5], data[6]) 
  }
}

export class SetBlock{
  constructor(
    public position: MVec3<BlockUnit>,
    public placed: boolean,
    public blockId: number
  ) {}

  static from(packet: Buffer) {
    const data = unpack('>BHHHBB', packet) as [number, BlockUnit, BlockUnit, BlockUnit, number, number]
    return new this(new MVec3<BlockUnit>(data[1], data[2], data[3]), data[4] == 1, data[5])
  }
}

export class Message {
  constructor (
    public text: string
  ) {}
  
  static from(packet: Buffer) {
    const data = unpack('>BB64s', packet) as [number, number, string]
    return new this(data[2])
  }
}