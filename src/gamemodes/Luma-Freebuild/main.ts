import { MinecraftClassicServer } from "../../classes/MinecraftClassicServer";
import { World } from "../../classes/World";
import { CommandEvent } from "../../events/CommandEvent";
import { SetBlockEvent } from "../../events/SetBlockEvent";
import { GameMode } from "../../interfaces/GameMode";

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