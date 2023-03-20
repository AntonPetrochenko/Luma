import * as Net from 'net';
import IncomingPacketType from '../enums/IncomingPacketType';
import Block from '../enums/MinecraftBlockID';
import { dumpBufferToString } from '../util/HexDumper';
import { MinecraftPacketHandler } from './MinecraftPacketHandler';
import { World } from './World';
export class MinecraftClassicServer {
  private Server: Net.Server
  public ServerName: string = `Metoot's Playground`
  public ServerMOTD: string = 'Node.js/TypeScript shenaniganry'

  private _defaultWorld: World;
  public get defaultWorld(): World { return this._defaultWorld }
  constructor() {
    this.Server = Net.createServer((ClientSocket) => {
      ClientSocket.on('data', (incomingBuffer) => {
        let packetID = this.IdentifyIncomingPacket(incomingBuffer)

        console.log(`Received packet ${IncomingPacketType[packetID]}: ${dumpBufferToString(incomingBuffer)}`)

        MinecraftPacketHandler.handlePacket(packetID, incomingBuffer, ClientSocket)
      })
    })

    this._defaultWorld = new World({}).generateSimple((x,y,z) => {
      
      if (x == 10 && y == 10 && z == 10) return Block.Obsidian
      
      if (z == 10 && y == 10) return Block.Bricks
      if (x == 10 && z == 10) return Block.Leaves
      if (y == 10 && x == 10) return Block.StationaryWater
      

      if (x == 0) return Block.RedCloth
      if (y == 0) return Block.GreenCloth
      if (z == 0) return Block.UltramarineCloth
      
      return Block.Air
    })
  }

  Listen(port: number) {
    this.Server.listen(port)
    console.log(`Server listening on port ${port}`)
  }

  GracefulShutdown() {
    this.Server.close(() => {
      this.Server.unref()
    })
  }

  IdentifyIncomingPacket(packet: Buffer): IncomingPacketType {
    return packet.readInt8(0)
  }

  private static _instance: MinecraftClassicServer
  public static get Instance(): MinecraftClassicServer {
    if (this._instance) {
      return this._instance
    } else {
      this._instance = new MinecraftClassicServer()
      return this._instance
    }
  }
}