import { ServerPlayer } from "../classes/ServerPlayer";
import { PlayerInitiatedEvent } from "../interfaces/Events";

export class CommandEvent implements PlayerInitiatedEvent {
  public deniedMessage = ''
  public denied = false
  constructor(
    public player: ServerPlayer,
    public command: string,
    public args: string[]
  ) {}
  deny(message?: string): void {
    this.denied = true
    this.deniedMessage = message ?? '&cPermission denied.'
  }

}