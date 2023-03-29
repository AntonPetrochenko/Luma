import { MinecraftClassicServer } from "../../luma/classes/MinecraftClassicServer";
import { World } from "../../luma/classes/World";
import { CommandEvent } from "../../luma/events/CommandEvent";
import { GameMode, GameModeMeta } from "../../luma/interfaces/GameMode";

export const meta: GameModeMeta = {
  identifier: 'luma-freebuild',
  name: 'Luma Freebuild',
  description: 'Default game mode of Luma. Build things together with friends!'
}

export default class implements GameMode {
  setup(world: World, server: MinecraftClassicServer) {
    world.generateSimple((x, y, z, sx, sy) => {
      const waterLevel = sy/2-3
      if (y<=waterLevel) {
        if (Math.random() < 0.5)
          return Block.Vanilla.UltramarineCloth
        else
          return Block.Vanilla.CyanCloth
      }
      return Block.Vanilla.Air
    })
    server.on('command-freebuild', (evt: CommandEvent) => {
      console.log('Command!')
      evt.deny('Freebuild example command')
    })
  }
}