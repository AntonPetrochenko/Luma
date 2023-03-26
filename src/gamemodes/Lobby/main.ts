import { MinecraftClassicServer } from "../../luma/classes/MinecraftClassicServer";
import { World } from "../../luma/classes/World";
import { CommandEvent } from "../../luma/events/CommandEvent";
import { SetBlockEvent } from "../../luma/events/SetBlockEvent";
import { GameMode, GameModeMeta } from "../../luma/interfaces/GameMode";

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
        return Block.Vanilla.Dirt
      }
      if (y==waterLevel) {
        return Block.Vanilla.Stone
      }
      return Block.Vanilla.Air
    })
    world.on('setblock', (evt: SetBlockEvent) => {
      console.log(`Denied block placement for ${evt.player}`)
      evt.deny()
    })
    server.on('command-lobby', (evt: CommandEvent) => {
      evt.deny(`Lobby gamemode handled a command! Params: ${evt.args.join(', ')}`)
    })
  }
}