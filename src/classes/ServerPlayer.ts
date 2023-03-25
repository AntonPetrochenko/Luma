import { Socket } from "net";
import { PlayerIdentification } from "../packet_wrappers/IncomingPackets";
import { BlockFractionUnit, MVec3 } from "../util/Vectors/MVec3";
import { Orientation } from "../util/Vectors/Orientation";
import { Mobile } from "./Entity/EntityBase";

/**
 * ServerPlayer describes a player connected to the server. It is bound to a `Player` entity in some `World`. This class can be used to send packets to a specific client.
 */
export class ServerPlayer implements Mobile {
  
  public sendPacket(packet: Buffer): Promise<void> {
    return new Promise((resolve) => {
      this.socket.write(packet, () => {
        //TODO: handle packet loss
        resolve()
      })
    })
  }

  public position: MVec3<BlockFractionUnit>
  public orientation = new Orientation(0,0)

  public socket: Socket
  public username = 'TESTIFICATE'

  private gameModeStorage = new Map<string, object>()

  public getStorage(identifier: string, defaultState: () => object) {
    if (this.gameModeStorage.has(identifier)) {
      return this.gameModeStorage.get(identifier)
    } else {
      const newState = defaultState()
      this.gameModeStorage.set(identifier, newState)
      return newState
    }
  }

  constructor(socket: Socket, player: PlayerIdentification, position: MVec3<BlockFractionUnit>) {
    this.socket = socket
    this.username = player.username
    this.position = position
  }
  
}