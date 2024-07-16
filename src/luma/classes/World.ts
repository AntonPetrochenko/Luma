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
import { BlockTickEvent } from "../events/BlockTickEvent";
import { randInt } from "../util/Helpers/RandInt";
import { clamp } from "../util/Helpers/Clamp";

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

  public tickPerChunk = 10;

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
    //Update entities
    let entityUpdatePackets = Buffer.alloc(0);
    this.entities.forEach((entity) => {
      entity.update(dt)
      entityUpdatePackets = Buffer.concat([entityUpdatePackets, OutgoingPackets.SetPositionAndOrientation(entity.getEntityId(), entity)])
    })
    this.broadcast(entityUpdatePackets)
    //Emit global tick
    this.emit('tick', new TickEvent(dt))
    //Emit dedicated block tick events
    for (let xPos = 0; xPos < this.sizeX; xPos+=16) {
      for (let yPos = 0; yPos < this.sizeY; yPos+=16) {
        for (let zPos = 0; zPos < this.sizeZ; zPos+=16) {

          const tickPosition = new MVec3<BlockUnit>(
            (xPos + randInt(16)) as BlockUnit,
            (yPos + randInt(16)) as BlockUnit,
            (zPos + randInt(16)) as BlockUnit
          )

          if (tickPosition.boundedBy(
            MVec3.zeroBlock,
            this.sizeMVec3
          )) {
            const blockId = this.getBlockAtMVec3(tickPosition)
  
            this.emit('block-tick', new BlockTickEvent(tickPosition, blockId))
          }
        }
      }  
    }

    const previousUpdates = this.blockUpdatesThisTick
    this.blockUpdatesThisTick = new PositionedBlockMap()
    return {
      updatedBlocks: previousUpdates
    }
  }

  private blockIndex(x: number, y: number, z: number) {
    x = clamp(0,x,this.sizeX)
    y = clamp(0,y,this.sizeY)
    z = clamp(0,z,this.sizeZ)
    //height is Y
    //width is X
    //depth is Z
    //Unwronged (still thanks, Notch!)
    return x + this.sizeX * (y + this.sizeY * z);
  }

  public getBlockAtXYZ(x: number, y: number, z: number): number {
    return this.blocks[this.blockIndex(
      x,
      y,
      z
    )]
  }
  public getBlockAtMVec3(position: MVec3<BlockUnit>): number {
    if (
      position.clientX >= 0 && position.clientX < this.sizeX,
      position.clientY >= 0 && position.clientY < this.sizeY,
      position.clientZ >= 0 && position.clientX < this.sizeZ
    ) {
      return this.blocks[this.blockIndex(position.clientX, position.clientY, position.clientZ)]
    } else {
      return Block.Vanilla.Bedrock
    }
  }

  public setBlockInternal(blockID: number, x: number, y: number, z: number) {
    this.blocks[this.blockIndex(x,y,z)] = blockID
  }

  public setBlockAtMVec3(blockID: number, position: MVec3<BlockUnit>) {
    if (
      position.clientX >= 0 && position.clientX < this.sizeX,
      position.clientY >= 0 && position.clientY < this.sizeY,
      position.clientZ >= 0 && position.clientX < this.sizeZ
    ) {
      this.blocks[this.blockIndex(position.clientX, position.clientY, position.clientZ)] = blockID
      this.blockUpdatesThisTick.setBlock(position, blockID)
    }
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
          values.push(this.getBlockAtXYZ(xPos, yPos, zPos))
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

  public readonly sizeMVec3: MVec3<BlockUnit>

  public spawnPoint: MVec3<BlockFractionUnit>

  constructor(options: WorldOptions) {
    super()
    
    this.sizeX = options.sizeX || 64
    this.sizeY = options.sizeY || 64
    this.sizeZ = options.sizeZ || 64
    
    this.sizeMVec3 = new MVec3<BlockUnit>(
      this.sizeX as BlockUnit,
      this.sizeY as BlockUnit,
      this.sizeZ as BlockUnit
    )

    this.spawnPoint = new MVec3<BlockFractionUnit>(16*32 as BlockFractionUnit, 16*32 as BlockFractionUnit, 16*32 as BlockFractionUnit)

    this.volume = this.sizeX * this.sizeY * this.sizeZ

    this.blocks = new Uint8Array(this.volume)

    console.log(`Created a new world with size ${this.sizeX}x${this.sizeY}x${this.sizeZ} (volume is ${this.volume})`)
  }

  /** Given an entity, spawn it in the world, make it visible to players and begin updating it */
  spawnEntity(entity: EntityBase) {

    const newId = this.idTracker.take()

    this.entities.add(entity)
    entity.addToWorld(this, newId)

    this.broadcast(OutgoingPackets.SpawnPlayer(newId, 'TESTIFICATE', entity))

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