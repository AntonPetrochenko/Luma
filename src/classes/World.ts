import { pack } from "python-struct";
import { EventEmitter } from "stream";
import { gzipSync } from "zlib";
import { BlockFractionUnit, BlockUnit, MVec3 } from "../util/Vectors/MVec3";
import { EntityBase } from "./Entity/EntityBase";

interface WorldOptions {
  sizeX?: number,
  sizeY?: number,
  sizeZ?: number,
}

type SimpleWorldgenCallback = (x: number, y: number, z: number) => number

export class World extends EventEmitter {

  /** Properly zero-filled in the constructor via generateSimple */
  private blocks: Uint8Array;
  private entities: EntityBase[] = []

  private blockIndex(x: number, y: number, z: number) {
    //height is Y
    //width is X
    //depth is Z
    //XZY order (thanks, notch!)
    return this.sizeY*this.sizeX*z + this.sizeX*y + x
  }

  public getBlockAtPos(x: number, y: number, z: number): number {
    return this.blocks[this.blockIndex(x,y,z)]
  }
  public getBlockAtMVec3(position: MVec3<BlockUnit>): number {
    return this.blocks[this.blockIndex(position.x, position.y, position.z)]
  }

  public setBlockAtPos(blockID: number, x: number, y: number, z: number) {
    this.blocks[this.blockIndex(x,y,z)] = blockID
  }
  public setBlockAtMVec3(blockID: number, position: MVec3<BlockUnit>) {
    this.blocks[this.blockIndex(position.x, position.y, position.z)] = blockID
  }

  /**
   * @returns Itself for chaining
   */
  generateSimple(cb: SimpleWorldgenCallback): World {
    for (let xPos = 0; xPos < this.sizeX; xPos++) {
      for (let yPos = 0; yPos < this.sizeY; yPos++) {
        for (let zPos = 0; zPos < this.sizeZ; zPos++) {
          this.setBlockAtPos(cb(xPos, yPos, zPos), xPos, yPos, zPos)
        }
      }  
    }
    return this
  }

  /*
    map_volume = w*h*d
    map_data = map_volume + block + block + block + block + block + block ...
    map_sendable = gzip(map_data)
    map_packet_1 = 0x03 + 1024 + map_sendable(1024 bytes)
    map_packet_x = 0x03 + 1024 + map_sendable(1024 bytes)
    map_packet_last = 0x03 + 100 + map_sendable(100 bytes) + 0(924 of it)
  */
  public packageForSending(): Buffer[] {
    const values: number[] = []
    for (let yPos = 0; yPos < this.sizeY; yPos++) {
      for (let zPos = 0; zPos < this.sizeZ; zPos++) {
        for (let xPos = 0; xPos < this.sizeX; xPos++) {
          values.push(this.getBlockAtPos(xPos, yPos, zPos))
        }
      }
    }
    
    values.unshift(this.volume)
    const mapBuffer = pack(`>I${this.volume}B`, values)
    const outgoingMapDataBuffer = gzipSync(mapBuffer)
    const mapParts: Buffer[] = []

    let offset = 0
    while (offset < outgoingMapDataBuffer.length) {
      mapParts.push(outgoingMapDataBuffer.subarray(offset, offset+1024))
      offset+=1024
    }
    return mapParts
  }

  public readonly sizeX: number;
  public readonly sizeY: number;
  public readonly sizeZ: number;
  public readonly volume: number;

  public spawnPoint: MVec3<BlockFractionUnit>

  constructor(options: WorldOptions) {
    super()
    
    this.sizeX = options.sizeX || 64
    this.sizeY = options.sizeY || 64
    this.sizeZ = options.sizeZ || 64
    

    this.spawnPoint = new MVec3<BlockFractionUnit>(16*32 as BlockFractionUnit, 16*32 as BlockFractionUnit, 16*32 as BlockFractionUnit)

    this.volume = this.sizeX * this.sizeY * this.sizeZ

    this.blocks = new Uint8Array(this.volume)

    console.log(`Created a new world with size ${this.sizeX}x${this.sizeY}x${this.sizeZ} (volume is ${this.volume})`)
  }
}