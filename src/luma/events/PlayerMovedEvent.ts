import { WorldSafePlayer } from "../classes/ServerPlayer";

export class PlayerMovedEvent {
  constructor(public player: WorldSafePlayer) {}
}