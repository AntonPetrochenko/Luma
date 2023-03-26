import { Socket } from "net";
import { BlockFractionUnit, MVec3 } from "../util/Vectors/MVec3";
import { Orientation } from "../util/Vectors/Orientation";
import { Mobile } from "./Entity/EntityBase";
import { World } from "./World";
import * as OutgoingPackets from '../packet_wrappers/OutgoingPackets'

/**
 * ServerPlayer describes a player connected to the server. It is bound to a `Player` entity in some `World`. This class can be used to send packets to a specific client.
 */
export class ServerPlayer implements Mobile {
  
  public sendPacket(packet: Buffer): Promise<void> {
    return new Promise((resolve) => {
      this.socket.write(packet, () => {
        //TODO: handle packet loss
        resolve()
      })
    })
  }


  public handleClose = true

  public entityId = 0

  public world: World
  public position = new MVec3<BlockFractionUnit>(32*16 as BlockFractionUnit, 32*36 as BlockFractionUnit, 32*16 as BlockFractionUnit)
  public orientation = new Orientation(0,0)


  public socket: Socket
  public username = 'TESTIFICATE'

  private gameModeStorage = new Map<string, object>()

  

  public getStorage(identifier: string, defaultState: () => object) {
    if (this.gameModeStorage.has(identifier)) {
      return this.gameModeStorage.get(identifier)
    } else {
      const newState = defaultState()
      this.gameModeStorage.set(identifier, newState)
      return newState
    }
  }

  constructor(socket: Socket, world: World) {
    this.socket = socket
    this.world = world
  }

  public async sendToWorld(targetWorld: World) {

    const newId = targetWorld.bindPlayer(this)
    console.log(`Bound new player to world, id ${newId}`)

    //Spawn the new player for others
    targetWorld.broadcastNotSelf(this, OutgoingPackets.SpawnPlayer(newId, this.username, this))

    await this.sendPacket(OutgoingPackets.LevelInitialize())
    
    
    const worldChunks = targetWorld.packageForSending()
    for (let chunkIdx = 0; chunkIdx < worldChunks.length; chunkIdx++) {
      const dataChunk = worldChunks[chunkIdx]
      await this.sendPacket(OutgoingPackets.LevelDataChunk(dataChunk, chunkIdx, worldChunks.length))
    }

    
    //Set player's spawn point
    await this.sendPacket(OutgoingPackets.SpawnPlayer(-1, this.username, this))

    await this.sendPacket(OutgoingPackets.LevelFinalize(targetWorld.sizeX, targetWorld.sizeY, targetWorld.sizeZ))

    //Spawn others for the new player
    targetWorld.players.forEach( (existingPlayer) => {
      if (this != existingPlayer) {
        console.log(`Telling ${this.username} that ${existingPlayer.username} is ${existingPlayer.entityId}`)
        this.sendPacket(OutgoingPackets.SpawnPlayer(existingPlayer.entityId, existingPlayer.username, existingPlayer))
      }
    })
    
    targetWorld.broadcast(OutgoingPackets.Message(`&b${this.username} joined the world`))
      
  }
  
  
}