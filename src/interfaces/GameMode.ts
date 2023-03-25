import { MinecraftClassicServer } from "../classes/MinecraftClassicServer";
import { World } from "../classes/World";

export interface GameMode {
  setup(world: World, server: MinecraftClassicServer): void
  destroy(): void
}