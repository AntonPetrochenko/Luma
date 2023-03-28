import { UnsafePlayer } from "../classes/ServerPlayer";
import { PlayerInitiatedEvent } from "../interfaces/Events";

export class CommandEvent implements PlayerInitiatedEvent {
  public deniedMessage = ''
  public denied = false
  public handled = false
  constructor(
    public player: UnsafePlayer,
    public command: string,
    public args: string[]
  ) {}
  deny(message?: string): void {
    this.denied = true
    this.deniedMessage = message ?? '&cPermission denied.'
  }
  markHandled() {
    this.handled = true
  }

}