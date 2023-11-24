import { pack } from "python-struct";
import { Mobile } from "../classes/Entity/EntityBase";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { dumpBufferToString } from "../util/Helpers/HexDumper";
import { BlockFractionUnit, BlockUnit, MVec3 } from "../util/Vectors/MVec3";
import { Orientation } from "../util/Vectors/Orientation";
import { clamp } from "../util/Helpers/Clamp";

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
export function SpawnPlayer(playerId: number, playerName: string, player: Mobile) {
  const packet = pack('>Bb64sHHHBB', [
    0x07,
    playerId,
    mcstring(playerName),
    player.position.clientX,
    player.position.clientY,
    player.position.clientZ,
    player.orientation.yaw,
    player.orientation.pitch
  ])
  // console.log(`Created SpawnPlayer${dumpBufferToString(packet)}`)
  return packet
}

export function DespawnPlayer(playerId: number) {
  return pack('>Bb', [
    0x0c, playerId
  ])
}

export function SetPositionAndOrientation(playerId: number, player: Mobile) {
  return pack('>BbHHHBB', [
    0x08,
    playerId,
    player.position.clientX,
    clamp(player.position.clientY + player.eyeLevel, 0, 65535),
    player.position.clientZ,
    player.orientation.yaw,
    player.orientation.pitch
  ]) 
}

export function PositionUpdate(playerId: number, deltaPosition: MVec3<BlockFractionUnit>) {
  return pack('>BbBBB', [
    0x0a,
    playerId,
    deltaPosition.clientX,
    deltaPosition.clientY,
    deltaPosition.clientZ
  ])
}

export function OrientationUpdate(playerId: number, orientation: Orientation) {
  return pack('>BbBB', [
    0x0b,
    playerId,
    orientation.yaw,
    orientation.pitch
  ])
}

export function SetBlock(position: MVec3<BlockUnit>, blockId: number) {
  return pack('>BHHHB', [
    0x06,
    position.clientX,
    position.clientY,
    position.clientZ,
    blockId
  ])
}

export function Message(text: string) {
  return pack('>BB64s', [
    0x0d,
    0x00,
    text.substring(0,64)
  ])
}

export function Ping() {
  return pack('>B', [0x01])
}

export function CPE_ExtInfo(extensionCount: number) {
  const a = pack('>B64sH',[
    0x10,
    'Luma',
    extensionCount
  ])
  console.log(dumpBufferToString(a))
  return a
}

export function CPE_ExtEntry(name: string, version: number) {
  const a = pack('>B64si', [ 
    0x11, 
    name, 
    version
  ])
  console.log(dumpBufferToString(a))
  return a
}