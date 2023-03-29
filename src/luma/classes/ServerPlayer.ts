import { Socket } from "net";
import { BlockFractionUnit, MVec3 } from "../util/Vectors/MVec3";
import { Orientation } from "../util/Vectors/Orientation";
import { Mobile } from "./Entity/EntityBase";
import { MinecraftClassicServer } from "./MinecraftClassicServer";
import { World } from "./World";



export function verifyNetworkSafe(player: UnsafePlayer): player is NetworkSafePlayer {
  return player.entityId !== undefined && player.world !== undefined && player.world.players.has(player)
}
/**
 * - Helper type: Make sure the player is in the world it claims to be in, and it connected to the server
 * - Verify via `verifyNetworkSafe`
 */
export interface NetworkSafePlayer extends UnsafePlayer {
  entityId: number,
  world: World,
  connected: true
}


export function verifyWorldSafe(player: UnsafePlayer, world: World): player is WorldSafePlayer {
  return player.entityId !== undefined && world.players.has(player) && player.world == world
}

/**
 * - Helper type: Make sure player is in the world you want them to be in, and is connected to the server
 * - Check via verifyWorldSafe
 */
export interface WorldSafePlayer extends UnsafePlayer {
  entityId: number
  world: World
  connected: true
}


export class UnsafePlayer implements Mobile {
  
  public sendPacket(packet: Buffer): Promise<void> {
    return new Promise((resolve) => {
      const w = () => {
        this.socket.write(packet, () => {
          //TODO: handle packet loss
          resolve()
        })
      }
      if (this.simuLatency > 0) {
        setTimeout(w, this.simuLatency)
      } else {
        w()
      }
    })
  }


  public handleClose = true
  public connected = true

  public entityId: undefined | number

  public world: undefined | World
  public position = new MVec3<BlockFractionUnit>(32*16 as BlockFractionUnit, 32*36 as BlockFractionUnit, 32*16 as BlockFractionUnit)
  public orientation = new Orientation(0,0)


  public socket: Socket
  public username = 'TESTIFICATE'

  private gameModeStorage = new Map<string, object>()

  public simuLatency = 0

  public getStorage(identifier: string, defaultState: () => object) {
    if (this.gameModeStorage.has(identifier)) {
      return this.gameModeStorage.get(identifier)
    } else {
      const newState = defaultState()
      this.gameModeStorage.set(identifier, newState)
      return newState
    }
  }

  constructor(socket: Socket, world: World) {
    this.socket = socket
    this.world = world
  }

  public async sendToWorld(targetWorld: World) {

    //Enforce redundant data is correct: unbind player from all worlds, if able
    const server = await MinecraftClassicServer.getInstance()
    server.worlds.forEach( (serverWorld) => {
      if (verifyWorldSafe(this, serverWorld)) serverWorld.unbindPlayer(this)
    } )

    const newId: number = await targetWorld.bindPlayer(this)
    console.log(`Bound new player to world, id ${newId}`)

  }
  
  
}