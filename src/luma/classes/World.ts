import { pack } from "python-struct";
import { EventEmitter } from "stream";
import { gzipSync } from "zlib";
import { GameMode } from "../interfaces/GameMode";
import { EntityIdTracker } from "../util/EntityIdTracker";
import { BlockFractionUnit, BlockUnit, MVec3 } from "../util/Vectors/MVec3";
import { EntityBase } from "./Entity/EntityBase";
import { UnsafePlayer, WorldSafePlayer  } from "./ServerPlayer";
import * as OutgoingPackets from "../packet_wrappers/OutgoingPackets"
import { WorldJoinProcedure } from "../packet_wrappers/ComplexProcedures";
import { PositionedBlockMap } from "../data_structures/BlockCollection";
import { TickEvent } from "../events/TickEvent";

interface WorldOptions {
  sizeX?: number,
  sizeY?: number,
  sizeZ?: number,
}

type SimpleWorldgenCallback = (x: number, y: number, z: number, sizeX: number, sizeY: number, sizeZ: number) => number

interface TickInfo {
  updatedBlocks: PositionedBlockMap,
}

export class World extends EventEmitter {

  /** Properly zero-filled in the constructor via generateSimple */
  private blocks: Uint8Array;
  public players = new Set<UnsafePlayer>()
  public entities = new Set<EntityBase>()
  private gamemode: GameMode | undefined

  private idTracker = new EntityIdTracker(128)

  private blockUpdatesThisTick = new PositionedBlockMap()

  public async bindPlayer(boundPlayer: UnsafePlayer) {
    //Deliberately letting next line crash. Game modes are gonna need to set up player and entity limits on their own
    const newId = this.idTracker.take()

    boundPlayer.entityId = newId
    boundPlayer.world = this

    this.players.add(boundPlayer)

    WorldJoinProcedure(boundPlayer, this)

    return newId
  }

  public unbindPlayer(player: WorldSafePlayer) {
      this.players.delete(player)
      this.idTracker.return(player.entityId)
      
      this.broadcast(OutgoingPackets.DespawnPlayer(player.entityId));
      (player as UnsafePlayer).entityId = undefined
      this.broadcast(OutgoingPackets.Message(`&b${player.username} left the world`))
  }

  public tick(dt: number): TickInfo {
    this.emit('tick', new TickEvent(dt))

    const previousUpdates = this.blockUpdatesThisTick
    this.blockUpdatesThisTick = new PositionedBlockMap()
    return {
      updatedBlocks: previousUpdates
    }
  }

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

  private setBlockInternal(blockID: number, x: number, y: number, z: number) {
    this.blocks[this.blockIndex(x,y,z)] = blockID
  }

  public setBlockAtMVec3(blockID: number, position: MVec3<BlockUnit>) {
    this.blocks[this.blockIndex(position.x, position.y, position.z)] = blockID
    this.blockUpdatesThisTick.setBlock(position, blockID)
  }

  /**
   * @returns Itself for chaining
   */
  generateSimple(cb: SimpleWorldgenCallback): World {
    for (let xPos = 0; xPos < this.sizeX; xPos++) {
      for (let yPos = 0; yPos < this.sizeY; yPos++) {
        for (let zPos = 0; zPos < this.sizeZ; zPos++) {
          this.setBlockInternal(cb(xPos, yPos, zPos, this.sizeX, this.sizeY, this.sizeZ), xPos, yPos, zPos)
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


  broadcastNotSelf(excludePlayer: UnsafePlayer, packet: Buffer) {
    this.players.forEach( (targetPlayer) => {
      if (targetPlayer != excludePlayer) {
        targetPlayer.sendPacket(packet)
      }
    })
  }

  broadcast(packet: Buffer) {
    this.players.forEach( (player) => {
      player.sendPacket(packet)
    })
  }
}