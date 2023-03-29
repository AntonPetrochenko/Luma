import { UnsafePlayer } from "../classes/ServerPlayer";
import { PlayerInitiatedEvent } from "../interfaces/Events";

export class PlayerJoinEvent implements PlayerInitiatedEvent {
  public denied = false
  constructor(public player: UnsafePlayer) { }
  deny() {
    this.denied = true
  }
}