import { Socket } from "net";
import { unpack } from "python-struct";
import IncomingPacketType from "../enums/IncomingPacketType";
import { dumpBufferToString } from "../util/HexDumper";
import { MinecraftClassicServer } from "./MinecraftClassicServer";
import * as OutgoingPackets from "./OutgoingPackets";



export class MinecraftPacketHandler {
  /**
   * 
   * @param packetID PacketID of the incoming packet
   * @param packetBuffer Buffer containing the incoming packet
   * @returns Buffer containing an immediate response, in case one is required, or nothing
   */
  static handlePacket(packetID: IncomingPacketType, packetBuffer: Buffer, clientSocket: Socket): void {
    switch (packetID) {
      case IncomingPacketType.PlayerIdentification:
        let data = unpack('BB64s64sB', packetBuffer)
        console.log('Handing player connection')
        console.log(data)
        clientSocket.write(OutgoingPackets.ServerIdentification('A test server', 'We test!', true)) 


        clientSocket.write(OutgoingPackets.LevelInitialize(), () => {
          let world = MinecraftClassicServer.Instance.defaultWorld
          let worldChunks = world.packageForSending()
  
          worldChunks.forEach((dataChunk, idx) => {
            console.log(`Sending chunk ${idx}`)
            clientSocket.write(OutgoingPackets.LevelDataChunk(dataChunk, idx, worldChunks.length), () => {
              if (idx == worldChunks.length-1) {
                console.log(`Sending finalize`)
                clientSocket.write(OutgoingPackets.LevelFinalize(world.sizeX, world.sizeY, world.sizeZ))
              }
            })
          })
        })
        
        


        break;
      default: 
        console.log(`Received unknown packet ${packetID} ${dumpBufferToString(packetBuffer)}`)
        break;
    }
  }
}