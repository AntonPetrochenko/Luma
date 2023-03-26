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
import { Config } from '../util/Config'
import * as glob from 'glob'
import * as path from 'path'
import { GameModeModule } from '../interfaces/GameMode'
import { CommandEvent } from '../events/CommandEvent'

const defaultConfig =
  {
    name: 'Unnamed server',
    motd: 'Nothing to say about this server',
    defaultWorld: 'lobby',
    worlds: {
      lobby: {
        gamemode: 'luma-lobby',
        size: [64, 64, 64]
      },
      freebuild: {
        gamemode: 'luma-freebuild',
        size: [64, 64, 64]
      }
    }
  }
export class MinecraftClassicServer extends EventEmitter { //extending EventEmitter is a surprise tool that'll help us later
  private server: Net.Server
  public config: Config<typeof defaultConfig>

  private players = new Set<ServerPlayer>

  public readonly defaultWorld: World;

  private readonly worlds: Map<string, World> = new Map()
  
  private constructor(config: Config<typeof defaultConfig>, gamemodes: Map<string, GameModeModule>) {
    super()
    this.config = config
    
    
    //Create TCP server
    this.server = Net.createServer((clientSocket) => {
      clientSocket.setNoDelay(true)

      
      const joinedPlayer = new ServerPlayer(clientSocket, this.defaultWorld)
      this.players.add(joinedPlayer)

      const pingInterval = setInterval(() => {
          clientSocket.write(OutgoingPackets.Ping())
      },100)
      clientSocket.on('data', (incomingBuffer) => {
        this.handlePacket(incomingBuffer, clientSocket)
      })

      const disconnect = (reason = '') => {
        clearInterval(pingInterval)
        const player = this.findPlayerBySocket(clientSocket)

        this.broadcast(OutgoingPackets.Message(`&b${player.username} left the game ${reason}`))

        //TODO: Need a better way of tracking players. This causes problems
        this.players.delete(player)
        this.broadcast(OutgoingPackets.DespawnPlayer(player.entityId))
        
      }
      clientSocket.on('close', () => {
        if (this.tryFindPlayerBySocket(clientSocket)) {
          disconnect()
        }
      })
      clientSocket.on("error", () => {
        disconnect('due to an error')
      })
    })

    //Create worlds according to config

    for (const [worldKey, worldInfo] of Object.entries(this.config.settings.worlds)) {
      if (this.worlds.has(worldKey)) {
        throw new Error(`Error initializing worlds: duplicate entry ${worldKey}`)
      }

      if ( ! gamemodes.has(worldInfo.gamemode) ) {
        throw new Error((`Error initializing world "${worldKey}": missing gamemode ${worldInfo.gamemode}`))
      }

      const newWorld = new World({
        sizeX: worldInfo.size[0],
        sizeY: worldInfo.size[1],
        sizeZ: worldInfo.size[3]
      })

      const worldGameModeModule = gamemodes.get(worldInfo.gamemode)
      //Make TypeScript happy. I guess, map can have a slot set as undefined.
      if (typeof worldGameModeModule == 'undefined') {
        throw new Error('GameMode has loaded, but is undefined. This should never happen. You win!')
      }
      const worldGameModeClass = worldGameModeModule.default
      const worldGameMode = (new worldGameModeClass())

      worldGameMode.setup(newWorld, this)

      this.worlds.set(worldKey, newWorld)
    }

    if ( ! this.worlds.has(this.config.settings.defaultWorld)) {
      throw new Error(`Unable to set default world: no such world ${this.config.settings.defaultWorld}`)
    }

    //Again, to make TypeScript happy
    const worldToSetAsDefault = this.worlds.get(this.config.settings.defaultWorld)
    if ( typeof worldToSetAsDefault == 'undefined') {
      throw new Error('World to be set as default was undefined, despite having been found. This should never happen. You win!')
    }
    this.defaultWorld = worldToSetAsDefault
    

  }

  tryFindPlayerBySocket(socket: Socket) {
    for (const [player] of this.players.entries()) {
      if (player.socket == socket) {
        return player
      }
    }
    return undefined
  }

  findPlayerBySocket(socket: Socket) {
    for (const [player] of this.players.entries()) {
      if (player.socket == socket) {
        return player
      }
    }
    throw new Error('No player found for socket. Something went wrong!')
  }

  broadcast(packet: Buffer) {
    this.players.forEach( (player) => {
      player.sendPacket(packet)
    })
  }

  broadcastNotSelf(player: ServerPlayer, packet: Buffer) {
    this.players.forEach( (targetPlayer) => {
      if (targetPlayer != player) {
        targetPlayer.sendPacket(packet)
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
  public static async getInstance(): Promise<MinecraftClassicServer> {
    if (this._instance) {
      return this._instance
    } else {
      const config = Config.from('../config.json', defaultConfig)
      this._instance = new MinecraftClassicServer(config, await MinecraftClassicServer.loadGameModeModules())
      return this._instance
    }
  }

  private static async loadGameModeModules(): Promise<Map<string, GameModeModule>> {
    console.log('Loading game modes...')
    const loadedGameModes = new Map<string, GameModeModule>()
    const entryPoints = glob.sync('./gamemodes/**/main.js')
    for (const entryPoint of entryPoints) {
      const entryPointPath = path.resolve(entryPoint)
      const gameModeModule = (await require(entryPointPath)) as GameModeModule

      if (loadedGameModes.has(gameModeModule.meta.identifier)) {
        throw new Error(`Module loading conflict: game mode identified as "${gameModeModule.meta.identifier}" has already been loaded!`)
      }

      console.log(`Imported ${gameModeModule.meta.identifier}`)
      loadedGameModes.set(gameModeModule.meta.identifier, gameModeModule)

    }

    return loadedGameModes
  }

  private async handlePacket(packet: Buffer, clientSocket: Socket): Promise<void> {
    
    const packetID = this.identifyIncomingPacket(packet)
    const sender = this.findPlayerBySocket(clientSocket)

    switch (packetID) {
      case IncomingPacketType.PlayerIdentification: {
        const data = IncomingPackets.PlayerIdentification.from(packet)
        clientSocket.write(OutgoingPackets.ServerIdentification(this.config.settings.name, this.config.settings.motd, true)) 

        sender.username = data.username
        sender.sendToWorld(this.defaultWorld)
        
        break;
      }

      case IncomingPacketType.PositionAndOrientation: {
        const data = IncomingPackets.PositionAndOrientation.from(packet)

        let orientationUpdated = false
        if ( ! data.position.isEqualTo(sender.position)) {
          //Update everything at once with a teleport packet
          orientationUpdated = true
          sender.world.broadcastNotSelf(sender, OutgoingPackets.SetPositionAndOrientation(sender.entityId, sender))
          sender.orientation = data.orientation
          
          sender.position = data.position
        }

        if ( (! orientationUpdated) && (! data.orientation.isEqualTo(sender.orientation)) ) {
          sender.orientation = data.orientation
          sender.world.broadcastNotSelf(sender, OutgoingPackets.OrientationUpdate(sender.entityId, sender.orientation))
        }
        break;
      }

      case IncomingPacketType.SetBlock: {
        //TODO: Unlink from default world
        const data = IncomingPackets.SetBlock.from(packet)
        if (data.placed) {
          sender.world.setBlockAtMVec3(data.blockId, data.position)
          sender.world.broadcast(OutgoingPackets.SetBlock(data.position, data.blockId))
        } else {
          this.defaultWorld.setBlockAtMVec3(Block.Vanilla.Air, data.position)
          sender.world.broadcast(OutgoingPackets.SetBlock(data.position, Block.Vanilla.Air))
        }
        
        break;
      }

      case IncomingPacketType.Message: {
        const data = IncomingPackets.Message.from(packet)
        //Recognize whether or not the message is a command
        if (data.text.match(/^\//)) {
          //Is a command. Consume the message, raise an event on the server.
          const argv = data.text.split(' ')
          const commandName = argv[0].replace('/', '')
          const commandArgs = argv.slice(1)
          const evt = new CommandEvent(sender, commandName, commandArgs )
          this.emit(`command-${commandName}`, evt)
          console.log(`Consumed command. Fired event "command-${commandName}". ${commandName} ${commandArgs.join(', ')}`)

          if (evt.denied) {
            sender.sendPacket(OutgoingPackets.Message(evt.deniedMessage))
          }

          if ( ! (evt.handled || evt.denied) ) {
            sender.sendPacket(OutgoingPackets.Message('&cUnknown command!'))
          }
          
        } else {
          this.broadcast(OutgoingPackets.Message(`${sender.username}: ${data.text}`))
        }
        break;
      }

      default: 
        console.log(`Received unknown packet ${packetID.toString(16)} ${dumpBufferToString(packet)}`)
        break;
    }
  }
}