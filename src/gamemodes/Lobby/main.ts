import { Socket } from "net";
import { MinecraftClassicServer } from "../../luma/classes/MinecraftClassicServer";
import { World } from "../../luma/classes/World";
import { CommandEvent } from "../../luma/events/CommandEvent";
import { GameMode, GameModeMeta } from "../../luma/interfaces/GameMode";
import * as OutgoingPackets from '../../luma/packet_wrappers/OutgoingPackets'
import { createReadStream } from "fs";
import { dumpBufferToString } from "../../luma/util/Helpers/HexDumper";
import { TickEvent } from "../../luma/events/TickEvent";
import { randInt } from "../../luma/util/Helpers/RandInt";
import { BlockUnit, MVec3 } from "../../luma/util/Vectors/MVec3";
import { MessageType, Mod_MessageTypes } from "../../luma/cpe_modules/MessageType";
import { UnsafePlayer } from "../../luma/classes/ServerPlayer";
import { BlockTickEvent } from "../../luma/events/BlockTickEvent";

export const meta: GameModeMeta = {
  identifier: 'luma-lobby',
  name: 'Lobby',
  description: `Fallback game mode. You can't really do anything here.`
}

export default class implements GameMode {
  setup(world: World, server: MinecraftClassicServer) {
    world.generateSimple((x, y, z, sx, sy) => {
      if (x==z) return Block.Vanilla.Glass
      const waterLevel = sy/2
      if (y<waterLevel) {
        return Block.Vanilla.Stone
      }
      if (y==waterLevel) {
        return Block.Vanilla.GrassBlock
      }
      return Block.Vanilla.Air
    })
    // world.on('block-modified', (evt: SetBlockEvent) => {
    //   console.log(`Denied block placement for ${evt.player}`)
    //   evt.deny()
    // })

    world.on('tick', () => {
    // console.log('ticked')
      const pos = new MVec3<BlockUnit>(
        randInt(world.sizeX) as BlockUnit,
        randInt(world.sizeY) as BlockUnit,
        randInt(world.sizeZ) as BlockUnit
      )

      const b = world.getBlockAtMVec3(pos)
        if (b != Block.Vanilla.Air) {
          world.setBlockAtMVec3(
            Block.Vanilla.Dirt,
            pos
          ) 
        }
    })

    world.on('block-tick', (evt: BlockTickEvent) => {
      switch (evt.blockId) {
        case Block.Vanilla.Wood: {
          world.setBlockAtMVec3(Block.Vanilla.Wood, evt.position.offset(0,1,0)) 
          break;
        }
        case Block.Vanilla.GrassBlock: {
          world.setBlockAtMVec3(Block.Vanilla.Glass, evt.position) 
          break;
        }
      }
    })

    server.on('command-lobby', (evt: CommandEvent) => {
      evt.deny(`Lobby gamemode handled a command! Params: ${evt.args.join(', ')}`)
    })
    server.on('command-debug', (evt: CommandEvent) => {
      evt.markHandled()
      switch (evt.args[0]) {
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
        default: {
          evt.deny('&cNo dice.')
          break;
        }
      }
    }) 
  }
}