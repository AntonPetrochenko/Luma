import { unpack } from "python-struct"
import { BlockFractionUnit, BlockUnit, MVec3 } from "../util/Vectors/MVec3"
import { Orientation } from "../util/Vectors/Orientation"

//THIS MODULE MAY ONLY CONTAIN INCOMING PACKET HELPER CLASSES
//ALL CLASSES IN THIS FILE MUST CONTAIN ID AND BYTES STATIC PROPERTIES
//IT IS LATER USED TO AUTOMATE THE PROCESS OF PACKET IDENTIFICATION
//TODO: make it so the above is not required. Probably refactor this whole file...

export class PlayerIdentification {
  constructor(
    public username: string,
    public verificationKey: string,
    public wantsCPE: boolean
  ) {}
  static from(packet: Buffer) {
    const data = unpack('>BB64s64sB', packet) as [number, number, string, string, number]
    return new this(data[2].trimEnd(), data[3].trimEnd(), data[4] == 0x42)
  }
  static id = 0x00
  static bytes = 131
}

export class PositionAndOrientation{
  constructor(
    public playerId: number,
    public position: MVec3<BlockFractionUnit>,
    public orientation: Orientation
  ) {}
  
  static from(packet: Buffer) {
    const data = unpack('>BBHHHBB', packet) as [number, number, BlockFractionUnit, BlockFractionUnit, BlockFractionUnit, number, number]
    return new this(data[1], new MVec3<BlockFractionUnit>( data[2], data[3], data[4] ), new Orientation(data[5], data[6])) 
  }

  static id = 0x08
  static bytes = 10
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

  static id = 0x05
  static bytes = 9
}

export class Message {
  constructor (
    public text: string
  ) {}
  
  static from(packet: Buffer) {
    const data = unpack('>BB64s', packet) as [number, number, string]
    return new this(data[2].trimEnd())
  }

  static id = 0x0d
  static bytes = 66
}

export class CPE_ExtInfo {
  constructor (
    public appName: string,
    public extensionCount: number
  ) {}

  static from(packet: Buffer) {
    const data = unpack('>B64sH', packet) as [number, string, number]
    return new this(data[1].trimEnd(), data[2])
  }

  static id = 0x10
  static bytes = 67
}

export class CPE_ExtEntry {
  constructor (
    public extName: string,
    public version: number
  ) {}

  static from(packet: Buffer) {
    const data = unpack('>B64si', packet) as [number, string, number]
    return new this(data[1].trimEnd(), data[2])
  }

  static id = 0x11
  static bytes = 69
}