import { Socket } from "net";
import { PlayerIdentification } from "../util/IncomingPackets";

/**
 * ServerPlayer describes a player connected to the server. It is bound to a `Player` entity in some `World`. This class can be used to send packets to a specific client.
 */
export class ServerPlayer {
  
  public sendPacket(packet: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.write(packet, (err) => {
        if (err) {
          reject('Failed to send packet!')
          return
        } 
        resolve()
      })
    })
  }

  public socket: Socket
  public username = 'TESTIFICATE'

  constructor(socket: Socket, player: PlayerIdentification) {
    this.socket = socket
    this.username = player.username
  }
  
}