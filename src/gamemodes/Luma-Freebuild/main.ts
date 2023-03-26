import { MinecraftClassicServer } from "../../luma/classes/MinecraftClassicServer";
import { World } from "../../luma/classes/World";
import { CommandEvent } from "../../luma/events/CommandEvent";
import { SetBlockEvent } from "../../luma/events/SetBlockEvent";
import { GameMode, GameModeMeta } from "../../luma/interfaces/GameMode";

export const meta: GameModeMeta = {
  identifier: 'luma-freebuild',
  name: 'Luma Freebuild',
  description: 'Default game mode of Luma. Build things together with friends!'
}

export default class implements GameMode {
  setup(world: World, server: MinecraftClassicServer) {
    world.on('setblock', (evt: SetBlockEvent) => {
      console.log(`Freebuild block ${evt.blockId}} placed!`)
    })
    server.on('command-freebuild', (evt: CommandEvent) => {
      console.log('Command!')
      evt.deny('Freebuild example command')
    })
  }
}