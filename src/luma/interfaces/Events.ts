import { MinecraftClassicServer } from "../classes/MinecraftClassicServer"
import { UnsafePlayer } from "../classes/ServerPlayer"
import { World } from "../classes/World"



export interface PlayerInitiatedEvent {
  player: UnsafePlayer 
  deny(): void
}

export interface WorldEvent {
  world: World
}

export interface ServerEvent {
  server: MinecraftClassicServer
}