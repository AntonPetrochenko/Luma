import { MinecraftClassicServer } from "../../luma/classes/MinecraftClassicServer";
import { World } from "../../luma/classes/World";
import { CommandEvent } from "../../luma/events/CommandEvent";
import { SetBlockEvent } from "../../luma/events/SetBlockEvent";
import { GameMode } from "../../luma/interfaces/GameMode";

export default class Freebuild implements GameMode {
  setup(world: World, server: MinecraftClassicServer) {
    world.on('setblock', (evt: SetBlockEvent) => {
      evt
    })
    server.on('command-paint', (evt: CommandEvent) => {
      evt
    })
  }

  destroy(): void {
    return
  }
}