import { pack } from "python-struct";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { dumpBufferToString } from "./HexDumper";

/** Helper to format strings in Classic's bizarre format */
function mcstring(s: string): string {
  return s.padEnd(64, ' ')
}

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
    mcstring(serverName),
    mcstring(serverMOTD),
    Number(isAdmin)
  ])
}

export function LevelInitialize() {
  return pack('>B', [0x02])
}

export function LevelDataChunk(buf: Buffer, idx: number, total: number) {
  const header = pack('>BH', [0x03, buf.length])
  const footer = pack('B', [Math.floor((idx/total)*100)])
  const padding = Buffer.alloc(1024-buf.length)
  
  return Buffer.concat([header, buf, padding, footer])
}

export function LevelFinalize(sizeX: number, sizeY: number, sizeZ: number) {
  return pack('>BHHH', [0x04, sizeX, sizeY, sizeZ])
}
export function SpawnPlayer(playerId: number, playerName: string, fX: number, fY: number, fZ: number, yaw: number, pitch: number) {
  const packet = pack('>Bb64sHHHBB', [
    0x07,
    playerId,
    mcstring(playerName),
    fX,
    fY,
    fZ,
    yaw,
    pitch
  ])
  // console.log(`Created SpawnPlayer${dumpBufferToString(packet)}`)
  return packet
}

export function DespawnPlayer(playerId: number) {
  return pack('>Bb', [
    0x0c, playerId
  ])
}

export function SetPositionAndOrientation(playerId: number, fX: number, fY: number, fZ: number, yaw: number, pitch: number) {
  return pack('>BbHHHBB', [
    0x08,
    playerId,
    fX,
    fY,
    fZ,
    yaw,
    pitch
  ]) 
}

export function Ping() {
  return pack('>B', [0x01])
}