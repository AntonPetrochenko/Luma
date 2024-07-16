import { Socket } from "net";
import { MinecraftClassicServer } from "../../luma/classes/MinecraftClassicServer";
import { World } from "../../luma/classes/World";
import { CommandEvent } from "../../luma/events/CommandEvent";
import { GameMode, GameModeMeta } from "../../luma/interfaces/GameMode";
import * as OutgoingPackets from '../../luma/packet_wrappers/OutgoingPackets'
import { createReadStream } from "fs";
import { dumpBufferToString } from "../../luma/util/Helpers/HexDumper";
import { BlockUnit, MVec3FractionToBlock } from "../../luma/util/Vectors/MVec3";
import { MessageType, Mod_MessageTypes } from "../../luma/cpe_modules/MessageType";
import { verifyWorldSafe } from "../../luma/classes/ServerPlayer";
import { Monster } from "../../luma/classes/Entity/Monster";
import { Mod_CustomParticles } from "../../luma/cpe_modules/CustomParticles";
import { createNoise2D } from "simplex-noise";
import { distance2d } from "../../luma/util/Helpers/Distance";

export const meta: GameModeMeta = {
  identifier: 'luma-lobby',
  name: 'Lobby',
  description: `Fallback game mode. You can't really do anything here.`
}

export default class implements GameMode {
  setup(world: World, server: MinecraftClassicServer) {
    
    const noises = [
      {scale: 128, amplitude: 10},
      {scale: 256, amplitude: 20},
      {scale: 64, amplitude: 5}
    ]

    const noises2 = [
      {scale: 64, amplitude: 10},
      {scale: 32, amplitude: 2}
    ]

    const noiseGen = createNoise2D()
    const noiseGen2 = createNoise2D()
    console.log('Raising...')
    for (let zPos = 0; zPos < world.sizeZ; zPos++) {
      for (let xPos = 0; xPos < world.sizeX; xPos++) {
        

        let heightPoint = 40
        noises.forEach( n => {
          heightPoint += noiseGen(xPos/n.scale,zPos/n.scale)  * n.amplitude
        })

        

        const distanceFromCenter = distance2d(world.sizeX/2, world.sizeZ/2, xPos, zPos)
        heightPoint -= (distanceFromCenter/world.sizeY)*4
        
        if (heightPoint > 32) {
          const raiser = noiseGen2((xPos+noiseGen2(xPos/64, zPos/64)*8)/64, (zPos+noiseGen2(xPos/64, zPos/64)*8)/64)
          if (raiser > 0.5) {

            let heightPoint2 = 0
            noises2.forEach( n => {
              heightPoint2 += noiseGen2(xPos/n.scale,zPos/n.scale)  * n.amplitude
            })

            heightPoint += heightPoint2

            
          }

        }

        // heightPoint = Math.max(heightPoint, 64)
        heightPoint = Math.floor(heightPoint)

        

        for (let yPos = Math.max(heightPoint, 32); yPos > 0; yPos--) {
          if (yPos > heightPoint) {
            world.setBlockInternal(Block.Vanilla.StationaryWater, xPos, yPos, zPos)  
          } else {

            let strataBlock = Block.Vanilla.Dirt

            if (yPos < heightPoint - 3) strataBlock = Block.Vanilla.Stone
            
            world.setBlockInternal(strataBlock, xPos, yPos, zPos)
          }
        }

        let topBlock = Block.Vanilla.GrassBlock
        if (heightPoint < 32) {
          topBlock = Block.Vanilla.Sand
        }
        world.setBlockInternal(topBlock, xPos, heightPoint, zPos)
      }
    }
    console.log('Done')

    server.on('command-lobby', (evt: CommandEvent) => {
      evt.deny(`Lobby gamemode handled a command! Params: ${evt.args.join(', ')}`)
    })
    server.on('command-debug', async (evt: CommandEvent) => {
      evt.markHandled()
      switch (evt.args[0]) {
        case ('standon'): {
          const b = evt.player.world?.getBlockAtMVec3(MVec3FractionToBlock(evt.player.position).offset(0,-2,0))
          if (b) {
            evt.player.sendPacket(OutgoingPackets.Message(`You are standing on ${b}`))
          }
          break;
        }
        case ('world'): {
          const targetWorld = evt.args[1]
          if (server.worlds.has(targetWorld)) {
            evt.player.sendToWorld(server.worlds.get(targetWorld) as World)
          } else {
            server.worlds.forEach( (foundWorld, worldName) => {
              evt.player.sendPacket(OutgoingPackets.Message(worldName))
            })
          }
          break;
        }
        case ('latency'): {
          evt.player.simuLatency = parseInt(evt.args[1])
          break;
        }
        case ('broken-packet-test'): {
          evt.player.sendPacket(OutgoingPackets.Message('Stress testing...'))
          const sock = new Socket()
          sock.connect(9999, 'localhost', () => {
            evt.player.sendPacket(OutgoingPackets.Message('Connected'))
            const demoFile = createReadStream('./demo.bin')
            demoFile.on('readable', () => {
              const lolInterval = setInterval(() => {
                const len = 1 + Math.floor(Math.random()*100)
                const bytes = demoFile.read(len)
                evt.player.sendPacket(OutgoingPackets.Message(`Read ${len}`))
                if (bytes) {
                  evt.player.sendPacket(OutgoingPackets.Message(`Writing`))
                  dumpBufferToString(bytes)
                  sock.write(bytes)
                } else {
                  evt.player.sendPacket(OutgoingPackets.Message('Done'))
                  clearInterval(lolInterval)
                  demoFile.close()
                  sock.end()
                }
              }, 100)
            })
          })
          break;
        }
        case ('announce'): {
          if (Mod_MessageTypes.supportedBy(evt.player)) {
            evt.player.CPE.sendTypedMessage(MessageType.Announcement, evt.args[1])
          }
          break;
        }
        case ('test-o'): {
          if (verifyWorldSafe(evt.player, world)) {
            const directionvec = evt.player.orientation.toNormalVec3<BlockUnit>().scaled(5)
            const targetVec = directionvec.sum(MVec3FractionToBlock(evt.player.position))
            world.setBlockAtMVec3(Block.Vanilla.Obsidian, targetVec)
            // if (Mod_MessageTypes.supportedBy(evt.player)) {
            //   evt.player.CPE.sendTypedMessage(MessageType.BottomRight1, targetVec.identity)
            // }
            evt.player.sendPacket(OutgoingPackets.Message('Testing...'))
            evt.player.sendPacket(OutgoingPackets.Message('Target: ' + targetVec.identity))
            evt.player.sendPacket(OutgoingPackets.Message('Position: ' + evt.player.position.identity))
            evt.player.sendPacket(OutgoingPackets.Message('Direction: ' + directionvec.identity))
          }
          
          break;
        }

        case('particletest'): {
          if (Mod_CustomParticles.supportedBy(evt.player)) {
            await evt.player.CPE.registerParticle({
              effectId: 1,
              uv: [4,4,8,8],
              baseLifetime: 0.05,
              collideFlags: {
                despawnOnFloors: false,
                collideWithFluids: false,
                collideWithLeaves: false,
                collideWithSolids: false,
                padding: false
              },
              particleCount: 16,
              sizeVariation: 0
            })
            await evt.player.CPE.particle(1, evt.player.position.offset(0,32,0))
          }
          break;
        }

        case ('g'): {
          const monster = new Monster(evt.player.position)

          if (evt.player.world) {
            evt.player.world.spawnEntity(monster)
          }
          
          break;
        }
        default: {
          evt.deny('&cNo dice.')
          break;
        }
      }
    }) 
  }
}

