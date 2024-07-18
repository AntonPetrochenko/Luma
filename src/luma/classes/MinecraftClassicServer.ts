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
import '../enums/MinecraftBlockID'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { dumpBufferToString } from '../util/Helpers/HexDumper'
import { UnsafePlayer, verifyNetworkSafe, verifyWorldSafe } from './ServerPlayer'
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
import { PlayerJoinEvent } from '../events/PlayerJoinEvent'
import { PlayerMovedEvent } from '../events/PlayerMovedEvent'
import { SetBlockEvent } from '../events/SetBlockEvent'
import { WriteStream, createWriteStream } from 'fs'
import { CPE_IncomingPacket, LumaCPESupportInfo } from '../cpe_modules/CPE'

const defaultConfig =
  {
    name: 'Luma Test Server',
    motd: 'Test server for Luma server software',
    defaultWorld: 'lobby',
    tickInterval: 1000/20,
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

const packetLengthLookupTable: number[] = []

//TODO: This is dumb and stupid and dumb. Undo this, find a better solution
Object.values(IncomingPackets).forEach( (classDef) => {
  packetLengthLookupTable[classDef.id] = classDef.bytes
})

export class MinecraftClassicServer extends EventEmitter { //extending EventEmitter is a surprise tool that'll help us later
  private server: Net.Server

  public extensionSupport = LumaCPESupportInfo

  public config: Config<typeof defaultConfig>

  private players = new Set<UnsafePlayer | UnsafePlayer>

  public readonly defaultWorld: World;

  public worlds: Map<string, World> = new Map()

  private demoRecordMode = false
  private demoFile: WriteStream | undefined

  private worldTickingInterval: NodeJS.Timer | undefined
  
  private constructor(config: Config<typeof defaultConfig>, gamemodes: Map<string, GameModeModule>) {
    super()
    this.config = config
    
    
    //Create TCP server
    if (this.demoRecordMode) {
      this.demoFile = createWriteStream('./demo.bin')
    }
    this.server = Net.createServer((clientSocket: Socket) => {
      
      const joinedPlayer = new UnsafePlayer(clientSocket, this.defaultWorld)
      this.players.add(joinedPlayer)

      clientSocket.on('data', (dataBuffer) => {
        if (this.demoFile) {
          this.demoFile.write(dataBuffer)
        }
        //One of two things may happen here.
        //One, we're in our normal state where we just read packets and handle them
        //Other, we're in the state where just got a partial packet and to glue more data on it
        let packetBuffer
        if (joinedPlayer.partialPacketBuffer) {
          packetBuffer = Buffer.concat([joinedPlayer.partialPacketBuffer, dataBuffer])
          joinedPlayer.partialPacketBuffer = undefined
        } else {
          packetBuffer = dataBuffer
        }

        //Parse incoming data
        const recvdPackets: {buffer: Buffer, expectedLength: number}[] = []
        let cursor = 0
        while (cursor < packetBuffer.length) {
          //The first byte we encounter is definitely a packetId
          const packetId = packetBuffer[cursor]
          let packetLength: number | undefined = packetLengthLookupTable[packetId]

          if (!packetLength) {
            console.log(Array.from(this.registeredCPEPackets.entries()))
            packetLength = this.registeredCPEPackets.get(packetId)?.length
          }

          if (packetLength) {
            //This handles reads after buffer length, so we're safe
            //In case we get a partial packet at the end of the incomingBuffer,
            //we'll just get a Buffer instance that is shorter than expected
            const foundPacket = packetBuffer.subarray( cursor, cursor + packetLength )
            recvdPackets.push({
              buffer: foundPacket,
              expectedLength: packetLength //Store expected length for a check down the line
            })
            cursor += packetLength
          } else {
            //Can't check length of a packet we don't know
            console.error(`We got a bad packet ${packetId} from ${joinedPlayer.username}`)
            console.error(dumpBufferToString(packetBuffer))
            clientSocket.write(OutgoingPackets.Message(`&cYour client had sent a bad packet ${packetId}`))
            clientSocket.write(OutgoingPackets.Message(`&cIf you see this message, you've probably desynced. :(`))
            return
          }
        }

        recvdPackets.forEach( (packetInfo) => {
          if (packetInfo.buffer.length == packetInfo.expectedLength) {
            //We're safe, handle
            this.handlePacket(packetInfo.buffer, clientSocket)
          } else {
            //This should only really happen to the last packet in the array
            //Partial packet, Use it as basis for the next recv
            joinedPlayer.partialPacketBuffer = packetInfo.buffer
          }
        })
      })

      const disconnect = (reason = '') => {
        // clearInterval(pingInterval)
        const player = this.findPlayerBySocket(clientSocket)
        if (verifyNetworkSafe(player)) {
          player.world.unbindPlayer(player)
        }
        this.players.delete(player)
        this.broadcast(OutgoingPackets.Message(`&b${player.username} left the game ${reason}`))
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
        sizeZ: worldInfo.size[2]
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
    
    //Start ticking worlds
    //TODO: Use delta time
    this.worldTickingInterval = setInterval(this.worldTick.bind(this), 50)

    // Setup CPE
    LumaCPESupportInfo.forEach( (e) => {
      if (e.mod.setup) {
        e.mod.setup(this)
      }
    })
  }

  private worldTick() {
    const dt = this.config.settings.tickInterval/1000
    this.worlds.forEach( (world) => {
      //TODO: Use delta time
      const worldTickInfo = world.tick(dt)
      world.players.forEach( player => {
        if (player.supports('BulkBlockUpdate')) {
          //Brew BulkBlockUpdate packets
          throw new Error('Unimplemented...')
        } else {
          worldTickInfo.updatedBlocks.forEach( (update) => {
            player.sendPacket(OutgoingPackets.SetBlock(update.position, update.blockId))
          })
        }
      })
    })
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

  broadcastNotSelf(player: UnsafePlayer, packet: Buffer) {
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

  private async finishHandshake(sender: UnsafePlayer) {
    sender.sendPacket(OutgoingPackets.ServerIdentification(this.config.settings.name, this.config.settings.motd, true)) 
    await sender.sendToWorld(this.defaultWorld)

    if (verifyWorldSafe(sender, this.defaultWorld)) {
      const evt = new PlayerJoinEvent(sender)
      this.defaultWorld.emit('player-join', evt)
      this.emit('player-join', evt)
    }
  }
  private async handlePacket(packet: Buffer, clientSocket: Socket): Promise<void> {
    
    const packetID = this.identifyIncomingPacket(packet)
    const sender = this.findPlayerBySocket(clientSocket)

    switch (packetID) {
      case IncomingPackets.PlayerIdentification.id: {
        const data = IncomingPackets.PlayerIdentification.from(packet)
        sender.username = data.username
        

        if (data.wantsCPE) {
          //Not a drill! This player wants CLASSIC PROTOCOL EXTENSIONS!
          //Gotta let them know we speak that too!
          console.log(`CPE Handshake for ${sender.username}`)
          sender.sendPacket(OutgoingPackets.CPE_ExtInfo(this.extensionSupport.length))
          for (const extension of this.extensionSupport) {
            sender.sendPacket(OutgoingPackets.CPE_ExtEntry(extension.extName, extension.version))
          }
          //Now hold your horses! We are NOT proceeding to the rest of the init!
          //It is now continued in CPE_ExtInfo and CPE_ExtEntry handlers
          // await this.finishHandshake(sender)
        } else {
          //Otherwise, finish init. 
          await this.finishHandshake(sender)
        }
        break;
      }

      case IncomingPackets.PositionAndOrientation.id: {
        if (verifyNetworkSafe(sender)) {
          const data = IncomingPackets.PositionAndOrientation.from(packet)
          let orientationNeedsUpdate = false
          if ( ! data.position.isEqualTo(sender.position)) {
            //Update everything at once with a teleport packet
            orientationNeedsUpdate = true
            sender.world.broadcastNotSelf(sender, OutgoingPackets.SetPositionAndOrientation(sender.entityId, sender))
            sender.orientation = data.orientation
            
            sender.position = data.position

            const evt = new PlayerMovedEvent(sender)
            sender.world.emit('player-moved',evt)
          }
  
          if ( (! orientationNeedsUpdate) && (! data.orientation.isEqualTo(sender.orientation)) ) {
            sender.orientation = data.orientation
            sender.world.broadcastNotSelf(sender, OutgoingPackets.OrientationUpdate(sender.entityId, sender.orientation))

            //TODO: Event for looking around 
          }

        }
        break;
      }

      case IncomingPackets.SetBlock.id: {
        if (verifyNetworkSafe(sender)) {
          const data = IncomingPackets.SetBlock.from(packet)
          const evt = new SetBlockEvent(sender, data.blockId, data.position, data.placed)
          sender.world.emit('block-modified', evt)
          

          if (evt.denied) {
            sender.sendPacket(OutgoingPackets.SetBlock(evt.position, sender.world.getBlockAtMVec3(evt.position)))
            break;
          }
          if (evt.overridden) {
            if ( evt.overrideData.position ) {
              //Position overridden. Therefore, block at original position should be restored no matter what
              sender.sendPacket(OutgoingPackets.SetBlock(evt.position, sender.world.getBlockAtMVec3(evt.position)))
            }
            if ( evt.overrideData.blockId ) {
              //Block ID changed. Place it at either the override position or event position
              sender.sendPacket(OutgoingPackets.SetBlock(evt.overrideData.position ?? evt.position, evt.overrideData.blockId))
            }
          } else {
            //Proceed like normal
            if (data.placed) {
              sender.world.setBlockAtMVec3(data.blockId, data.position)
              // sender.world.broadcast(OutgoingPackets.SetBlock(data.position, data.blockId))
            } else {
              sender.world.setBlockAtMVec3(Block.Vanilla.Air, data.position)
              // sender.world.broadcast(OutgoingPackets.SetBlock(data.position, Block.Vanilla.Air))
            }
          }
        }
        
        break;
      }

      case IncomingPackets.Message.id: {
        const data = IncomingPackets.Message.from(packet)
        //Recognize whether or not the message is a command
        if (data.text.match(/^\//)) {
          //Is a command. Consume the message, raise an event on the server.
          const argv = data.text.split(' ')
          const commandName = argv[0].replace('/', '')
          const commandArgs = argv.slice(1)
          const evt = new CommandEvent(sender, commandName, commandArgs )
          this.emit(`command-${commandName}`, evt)
          sender.world?.emit(`command-${commandName}`, evt)
          console.log(`Consumed command. Fired event "command-${commandName}". ${commandName} ${commandArgs.join(', ')}`)

          if (evt.denied) {
            sender.sendPacket(OutgoingPackets.Message(evt.deniedMessage))
          }

          if ( ! (evt.handled || evt.denied) ) {
            sender.sendPacket(OutgoingPackets.Message('&cUnknown command!'))
          }
          
        } else {
          //It's a message. Send it
          this.broadcast(OutgoingPackets.Message(`${sender.username}: ${data.text}`))
        }
        break;
      }

      case (IncomingPackets.CPE_ExtInfo.id): {
        const data = IncomingPackets.CPE_ExtInfo.from(packet)
        console.log(`${sender.username} is running ${data.appName} with ${data.extensionCount} mods`)
        //We ballin!
        sender.extensionCount = data.extensionCount
        break;
      }

      case (IncomingPackets.CPE_ExtEntry.id): {
        const data = IncomingPackets.CPE_ExtEntry.from(packet)
        console.log(`${sender.username} supports ${data.extName} version ${data.version}`)
        
        const supportedEntry = this.extensionSupport.find((entry) => {
          return entry.extName == data.extName && entry.version == data.version
        })

        if (supportedEntry) {
          sender.CPESupport.push(supportedEntry)
          if (supportedEntry.mod && supportedEntry.mod.hydrate) {
            supportedEntry.mod.hydrate(sender)
          }
          console.log(`Caught ${sender.CPESupport.length} extensions`)
        } else {
          sender.CPESkipped.push(data)
          console.log(`Skipped ${sender.CPESkipped.length} extensions`)
        }
        

        //Was this the last one? If so, continue handshake...
        if ((sender.CPESupport.length + sender.CPESkipped.length ) == sender.extensionCount) {
          console.log('Done handshaking!')
          console.log(sender.CPESupport)
          this.finishHandshake(sender)
        }
        break;
      }

      default: 
        this.tryHandleCPEPacket(packet, sender)
      break;
    }
  }

  
  private registeredCPEPackets: Map<number, CPE_IncomingPacket> = new Map()

  private tryHandleCPEPacket(inPacket: Buffer, sender: UnsafePlayer) {
    const packetId = inPacket.readInt8(0)
    const packInfo = this.registeredCPEPackets.get(packetId)
    if (packInfo) {
      packInfo.handler(inPacket, sender)
    } else {
      throw new Error('Handled unknown packet. This can no longer happen. You win!')
    }
  }

  public registerCPEPacket(id: number, packInfo: CPE_IncomingPacket) {
    this.registeredCPEPackets.set(id, packInfo)
  }
}