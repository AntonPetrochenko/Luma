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
import { dumpBufferToString } from '../util/HexDumper'
import { ServerPlayer } from './ServerPlayer'
import { World } from './World'
import { Socket } from "net"
import * as OutgoingPackets from "../util/OutgoingPackets"
import * as IncomingPackets from "../util/IncomingPackets"

type forEachPlayerCb = (player: ServerPlayer, index: number) => void
export class MinecraftClassicServer {
  private server: Net.Server
  public serverName: string
  public serverMOTD: string

  private players: (ServerPlayer | undefined)[] = []

  private _defaultWorld: World;
  public get defaultWorld(): World { return this._defaultWorld }
  constructor() {
    this.serverName = `Metoot's Playground`
    this.serverMOTD = 'Node.js/TypeScript shenaniganry'
    this.server = Net.createServer((clientSocket) => {
      const pingInterval = setInterval(() => {
        clientSocket.write(OutgoingPackets.Ping())
      },100)
      clientSocket.on('data', (incomingBuffer) => {
        this.handlePacket(incomingBuffer, clientSocket, this.findPlayerIdBySocket(clientSocket))
      })
      clientSocket.on('close', () => {
        clearInterval(pingInterval)
        const id = this.findPlayerIdBySocket(clientSocket)

        delete this.players[id]
        this.broadcast(OutgoingPackets.DespawnPlayer(id))
      })
    })

    this._defaultWorld = new World({}).generateSimple((x,y,z) => {
      
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

  broadcastNotSelf(packet: Buffer, playerId: number) {
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

  identifyIncomingPacket(packet: Buffer): IncomingPacketType {
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

    switch (packetID) {
      case IncomingPacketType.PlayerIdentification: {
        const data = new IncomingPackets.PlayerIdentification(packet)
        console.log('Handing player connection')
        console.log(data)
        clientSocket.write(OutgoingPackets.ServerIdentification('A test server', 'We test!', true)) 

        const joinedPlayer = new ServerPlayer(clientSocket, data)
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
        this.broadcastNotSelf(OutgoingPackets.SpawnPlayer(newId, data.username, (16+newId)*32, 16*32, 16*32, 0, 0), newId)
        //Set player's spawn point
        joinedPlayer.sendPacket(OutgoingPackets.SpawnPlayer(-1, data.username, (16+newId)*32, 16*32, 16*32, 0, 0))



        clientSocket.write(OutgoingPackets.LevelInitialize(), () => {
          const world = MinecraftClassicServer.Instance.defaultWorld
          const worldChunks = world.packageForSending()
  
          /// callback hell.. thanks, node!
          worldChunks.forEach((dataChunk, chunkIdx) => {
            clientSocket.write(OutgoingPackets.LevelDataChunk(dataChunk, chunkIdx, worldChunks.length), () => {
              if (chunkIdx == worldChunks.length-1) {
                clientSocket.write(OutgoingPackets.LevelFinalize(world.sizeX, world.sizeY, world.sizeZ), () => {
                  //Spawn others for the new player
                  this.forEachPlayer((player, playerIdx) => {
                    if (playerIdx != newId) {
                      clientSocket.write(OutgoingPackets.SpawnPlayer(playerIdx, player.username, (16+playerIdx)*32, 16*32, 16*32, 0, 0))
                    }
                  })
                })
              }
            })
          })
        })
        break;
      }

      case IncomingPacketType.PositionAndOrientation: {
        const data = new IncomingPackets.PositionAndOrientation(packet)
        this.broadcastNotSelf(OutgoingPackets.SetPositionAndOrientation(playerId, data.fX, data.fY, data.fZ, data.yaw, data.pitch), playerId)
        break;
      }
      default: 
        console.log(`Received unknown packet ${packetID.toString(16)} ${dumpBufferToString(packet)}`)
        break;
    }
  }
}