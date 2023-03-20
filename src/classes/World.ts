import { pack } from "python-struct";
import { createGzip, gzip, gzipSync } from "zlib";
import { dumpBufferToString } from "../util/HexDumper";

interface WorldOptions {
  sizeX?: number,
  sizeY?: number,
  sizeZ?: number,
}

type SimpleWorldgenCallback = (x: number, y: number, z: number) => number

export class World {

  /** Initialized via generateSimple */
  private blocks: number[][][] = [];

  public getBlockAt(x: number, y: number, z: number): number {
    return this.blocks[x][y][z];
  }
  public setBlockAt(blockID: number, x: number, y: number, z: number) {
    this.blocks[x][y][z] = blockID
  }

  /**
   * @returns Itself for chaining
   */
  generateSimple(cb: SimpleWorldgenCallback): World {
    for (let xPos = 0; xPos < this.sizeX; xPos++) {
      this.blocks[xPos] = []
      for (let yPos = 0; yPos < this.sizeX; yPos++) {
        this.blocks[xPos][yPos] = []
        for (let zPos = 0; zPos < this.sizeX; zPos++) {
          this.setBlockAt(cb(xPos, yPos, zPos), xPos, yPos, zPos)
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
    console.log('Preparing level')
    console.log('Unrolling...')
    let values: number[] = []
    for (let zPos = 0; zPos < this.sizeZ; zPos++) {
      for (let yPos = 0; yPos < this.sizeY; yPos++) {
        for (let xPos = 0; xPos < this.sizeX; xPos++) {
          values.push(this.getBlockAt(xPos, yPos, zPos))
        }
      }
    }
    
    console.log('Prepending...')
    values.unshift(this.volume)
    console.log(`Volume is ${this.volume}`)

    console.log('Packing...')
    let mapBuffer = pack(`>I${this.volume}B`, values)
    console.log(`Mapbuffer length is ${mapBuffer.length}`)
    console.log('Gzipping...')
    let outgoingMapDataBuffer = gzipSync(mapBuffer)
    console.log(`Gzip length is ${outgoingMapDataBuffer.length}`)

    let mapParts: Buffer[] = []

    let offset = 0
    console.log('Splitting...')
    while (offset < outgoingMapDataBuffer.length) {
      mapParts.push(outgoingMapDataBuffer.subarray(offset, offset+1024))
      offset+=1024
    }
    
    console.log(`Produced ${mapParts.length} chunks`)
    return mapParts
  }

  private _sizeX: number;
  private _sizeY: number;
  private _sizeZ: number;
  private _volume: number;

  public get sizeX() { return this._sizeX }
  public get sizeY() { return this._sizeY }
  public get sizeZ() { return this._sizeZ }
  public get volume() { return this._volume }

  constructor(options: WorldOptions) {
    this._sizeX = options.sizeX || 64
    this._sizeY = options.sizeY || 64
    this._sizeZ = options.sizeZ || 64

    this._volume = this._sizeX * this._sizeY * this._sizeZ

    this.generateSimple(() => 0)
  }
}