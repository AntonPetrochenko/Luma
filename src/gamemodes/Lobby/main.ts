import { Socket } from "net";
import { MinecraftClassicServer } from "../../luma/classes/MinecraftClassicServer";
import { World } from "../../luma/classes/World";
import { CommandEvent } from "../../luma/events/CommandEvent";
import { SetBlockEvent } from "../../luma/events/SetBlockEvent";
import { GameMode, GameModeMeta } from "../../luma/interfaces/GameMode";
import * as OutgoingPackets from '../../luma/packet_wrappers/OutgoingPackets'
import { createReadStream } from "fs";
import { dumpBufferToString } from "../../luma/util/Helpers/HexDumper";

export const meta: GameModeMeta = {
  identifier: 'luma-lobby',
  name: 'Lobby',
  description: `Fallback game mode. You can't really do anything here.`
}

export default class implements GameMode {
  setup(world: World, server: MinecraftClassicServer) {
    world.generateSimple((x, y, z, sx, sy) => {
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
        default: {
          evt.deny('&cNo dice.')
          break;
        }
      }
    }) 
  }
}