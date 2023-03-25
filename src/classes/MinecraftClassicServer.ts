/**
 * 
 * ATTENTION!!!
 * 
 * Most of this file's structure is temporary.
 * It's only meant for testing the protocol implementation,
 * and WILL be spaced out to different parts of the program.
 * 
 * This is not representative of the final architecture of the server.
 * 
 */

import * as Net from 'net'
import IncomingPacketType from '../enums/IncomingPacketType'
import '../enums/MinecraftBlockID'
import { dumpBufferToString } from '../util/Helpers/HexDumper'
import { ServerPlayer } from './ServerPlayer'
import { World } from './World'
import { Socket } from "net"
import * as OutgoingPackets from "../packet_wrappers/OutgoingPackets"
import * as IncomingPackets from "../packet_wrappers/IncomingPackets"
import { EventEmitter } from 'stream'

type forEachPlayerCb = (player: ServerPlayer, index: number) => void
export class MinecraftClassicServer extends EventEmitter { //extending EventEmitter is a surprise tool that'll help us later
  private server: Net.Server
  public serverName: string
  public serverMOTD: string

  private players: (ServerPlayer | undefined)[] = []

  public readonly defaultWorld: World;
  
  constructor() {
    super()
    this.serverName = `Metoot's Playground`
    this.serverMOTD = 'Node.js/TypeScript shenaniganry'
    this.server = Net.createServer((clientSocket) => {
      clientSocket.setNoDelay(true)
      const pingInterval = setInterval(() => {
          clientSocket.write(OutgoingPackets.Ping())
      },100)
      clientSocket.on('data', (incomingBuffer) => {
        this.handlePacket(incomingBuffer, clientSocket, this.findPlayerIdBySocket(clientSocket))
      })

      const disconnect = (reason = '') => {
        clearInterval(pingInterval)
        const id = this.findPlayerIdBySocket(clientSocket)

        this.broadcast(OutgoingPackets.Message(`&b${this.players[id]?.username} left the game ${reason}`))

        //TODO: Need a better way of tracking players. This causes problems
        delete this.players[id]
        this.broadcast(OutgoingPackets.DespawnPlayer(id))
        
      }
      clientSocket.on('close', () => {
        disconnect()
      })
      clientSocket.on("error", () => {
        disconnect('due to an error')
      })
    })

    this.defaultWorld = new World({
      sizeX: 1024,
      sizeZ: 1024,
      sizeY: 64
    }).generateSimple((x,y,z) => {
      
      if (x == 10 && y == 10 && z == 10) return Block.Vanilla.Obsidian

      if (z == 10 && y == 10) return Block.Vanilla.Bricks
      if (x == 10 && z == 10) return Block.Vanilla.Leaves
      if (y == 10 && x == 10) return Block.Vanilla.StationaryWater
      

      if (x == 0) return Block.Vanilla.RedCloth
      if (y == 0) return Block.Vanilla.GreenCloth
      if (z == 0) return Block.Vanilla.UltramarineCloth
      
      return Block.Vanilla.Air
    })
  }

  findPlayerIdBySocket(socket: Socket) {
    return this.players.findIndex((player) => {
      return player?.socket == socket
    })
  }

  forEachPlayer(cb: forEachPlayerCb) {
    this.players.forEach((player, index) => {
      if (player) {
        cb(player, index)
      }
    })
  }

  broadcast(packet: Buffer) {
    this.forEachPlayer((player) => {
      player.sendPacket(packet)
    })
  }

  broadcastNotSelf(playerId: number, packet: Buffer) {
    this.forEachPlayer((player, idx) => {
      if (idx != playerId) {
        player.sendPacket(packet)
      }
    })
  }

  listen(port: number) {
    this.server.listen(port)
    console.log(`Server listening on port ${port}`)
  }

  gracefulShutdown() {
    this.server.close(() => {
      this.server.unref()
    })
  }

  identifyIncomingPacket(packet: Buffer): number {
    return packet.readInt8(0)
  }

  private static _instance: MinecraftClassicServer
  public static get Instance(): MinecraftClassicServer {
    if (this._instance) {
      return this._instance
    } else {
      this._instance = new MinecraftClassicServer()
      return this._instance
    }
  }

  private handlePacket(packet: Buffer, clientSocket: Socket, playerId: number): void {
    
    const packetID = this.identifyIncomingPacket(packet)
    const senderPlayer = this.players[playerId] as ServerPlayer // TODO: "as" shouldn't be necessary here.

    switch (packetID) {
      case IncomingPacketType.PlayerIdentification: {
        const data = IncomingPackets.PlayerIdentification.from(packet)
        console.log('Handing player connection')
        console.log(data)
        clientSocket.write(OutgoingPackets.ServerIdentification('A test server', 'We test!', true)) 

        const joinedPlayer = new ServerPlayer(clientSocket, data, this.defaultWorld.spawnPoint)
        let newId = 0
        for (let idx = 0; idx <= this.players.length; idx++) {
          if (!this.players[idx]) {
            newId = idx
            break
          }
        }
        this.players[newId] = joinedPlayer
        console.log(`Joining player's ID is ${newId}`)

        //Spawn the new player for others
        this.broadcastNotSelf(newId, OutgoingPackets.SpawnPlayer(newId, data.username, joinedPlayer))

        clientSocket.write(OutgoingPackets.LevelInitialize(), () => {
          const world = MinecraftClassicServer.Instance.defaultWorld
          const worldChunks = world.packageForSending()
  
          /// callback hell.. thanks, node!
          worldChunks.forEach((dataChunk, chunkIdx) => {
            clientSocket.write(OutgoingPackets.LevelDataChunk(dataChunk, chunkIdx, worldChunks.length), () => {
              if (chunkIdx == worldChunks.length-1) {
                //Set player's spawn point
                joinedPlayer.sendPacket(OutgoingPackets.SpawnPlayer(-1, data.username, joinedPlayer)).then(() => {
                  clientSocket.write(OutgoingPackets.LevelFinalize(world.sizeX, world.sizeY, world.sizeZ), () => {
                    //Spawn others for the new player
                    this.forEachPlayer((player, playerIdx) => {
                      if (playerIdx != newId) {
                        clientSocket.write(OutgoingPackets.SpawnPlayer(playerIdx, player.username, player))
                        this.broadcast(OutgoingPackets.Message(`&b${player.username} joined the game`))
                      }
                    })
                  })
                })
              }
            })
          })
        })
        break;
      }

      case IncomingPacketType.PositionAndOrientation: {
        const data = IncomingPackets.PositionAndOrientation.from(packet)

        let orientationUpdated = false
        if ( ! data.position.isEqualTo(senderPlayer.position)) {
          //Update everything at once with a teleport packet
          orientationUpdated = true
          this.broadcastNotSelf(playerId, OutgoingPackets.SetPositionAndOrientation(playerId, senderPlayer))
          senderPlayer.orientation = data.orientation
          
          senderPlayer.position = data.position
        }

        if ( (! orientationUpdated) && (! data.orientation.isEqualTo(senderPlayer.orientation)) ) {
          senderPlayer.orientation = data.orientation
          this.broadcastNotSelf(playerId, OutgoingPackets.OrientationUpdate(playerId, senderPlayer.orientation))
        }
        break;
      }

      case IncomingPacketType.SetBlock: {
        //TODO: Unlink from default world
        const data = IncomingPackets.SetBlock.from(packet)
        console.log(`Placed block ${data.position.x} ${data.position.y} ${data.position.z}`)
        if (data.placed) {
          this.defaultWorld.setBlockAtMVec3(data.blockId, data.position)
          this.broadcast(OutgoingPackets.SetBlock(data.position, data.blockId))
        } else {
          this.defaultWorld.setBlockAtMVec3(Block.Vanilla.Air, data.position)
          this.broadcast(OutgoingPackets.SetBlock(data.position, Block.Vanilla.Air))
        }
        
        console.log(`Block is now ${this.defaultWorld.getBlockAtMVec3(data.position)}`)
        
        break;
      }

      case IncomingPacketType.Message: {
        const data = IncomingPackets.Message.from(packet)
        this.broadcast(OutgoingPackets.Message(`${senderPlayer.username}: ${data.text}`))
        break;
      }

      default: 
        console.log(`Received unknown packet ${packetID.toString(16)} ${dumpBufferToString(packet)}`)
        break;
    }
  }
}