import { MinecraftClassicServer } from "../classes/MinecraftClassicServer";
import { World } from "../classes/World";

export interface GameMode {
  setup(world: World, server: MinecraftClassicServer): void
}

export interface GameModeMeta {
  /** Program-readable name of the gamemode */
  identifier: string
  /** Human-readable name of the gamemode */
  name: string
  /** Human-readable description of the gamemode */
  description: string
}

export interface GameModeModule {
  meta: GameModeMeta,
  default: { new(): GameMode }
}