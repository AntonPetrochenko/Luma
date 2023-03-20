import { pack } from "python-struct";
import { MinecraftClassicServer } from "./MinecraftClassicServer";

export function ServerIdentification(serverName: string, serverMOTD: string, isAdmin: boolean): Buffer {
  /*
      Packet ID	Byte 0x00
      Protocol version Byte 0x07
      Server name	String
      Server MOTD	String
      User type	Byte
  */
  return pack('BB64s64sB', [
    0x00,
    0x07,
    serverName.padEnd(64,' '),
    serverMOTD.padEnd(64,' '),
    Number(isAdmin)
  ])
}

export function LevelInitialize() {
  return pack('>B', [0x02])
}

export function LevelFinalize(sizeX: number, sizeY: number, sizeZ: number) {
  return pack('>BHHH', [0x04, sizeX, sizeY, sizeZ])
}

export function LevelDataChunk(buf: Buffer, idx: number, total: number) {
  let header = pack('>BH', [0x03, buf.length])
  let footer = pack('B', [Math.floor((idx/total)*100)])

  let padding = Buffer.alloc(1024-buf.length)
  return Buffer.concat([header, buf, padding, footer])
}