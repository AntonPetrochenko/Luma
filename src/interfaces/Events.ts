import { MinecraftClassicServer } from "../classes/MinecraftClassicServer"
import { ServerPlayer } from "../classes/ServerPlayer"
import { World } from "../classes/World"

export interface PlayerInitiatedEvent {
  player: ServerPlayer
  deny(): void
}

export interface WorldEvent {
  world: World
}

export interface ServerEvent {
  server: MinecraftClassicServer
}