import { UnsafePlayer, verifyNetworkSafe, verifyWorldSafe } from "../classes/ServerPlayer"
import { World } from "../classes/World"
import * as OutgoingPackets from "../packet_wrappers/OutgoingPackets"

/**
 * Sends level data to the player. Call this after the player already has their entity ID
 * @param joiningPlayer The player who has joined a world
 * @param world The world the player has joined
 */
export async function WorldJoinProcedure(joiningPlayer: UnsafePlayer, world: World) {
  if (verifyWorldSafe(joiningPlayer, world)) {
    //Spawn the new player for others
    world.broadcastNotSelf(joiningPlayer, OutgoingPackets.SpawnPlayer(joiningPlayer.entityId, joiningPlayer.username, joiningPlayer))
  
    await joiningPlayer.sendPacket(OutgoingPackets.LevelInitialize())
    
    
    const worldChunks = world.packageForSending()
    for (let chunkIdx = 0; chunkIdx < worldChunks.length; chunkIdx++) {
      const dataChunk = worldChunks[chunkIdx]
      await joiningPlayer.sendPacket(OutgoingPackets.LevelDataChunk(dataChunk, chunkIdx, worldChunks.length))
    }
  
    
    //Set player's spawn point
    await joiningPlayer.sendPacket(OutgoingPackets.SpawnPlayer(-1, joiningPlayer.username, joiningPlayer))
  
    await joiningPlayer.sendPacket(OutgoingPackets.LevelFinalize(world.sizeX, world.sizeY, world.sizeZ))
  
    //Spawn others for the new player
    world.players.forEach( (existingPlayer) => {
      if (joiningPlayer != existingPlayer && verifyNetworkSafe(existingPlayer)) {
        console.log(`Telling ${joiningPlayer.username} that ${existingPlayer.username} is ${existingPlayer.entityId}`)
        joiningPlayer.sendPacket(OutgoingPackets.SpawnPlayer(existingPlayer.entityId, existingPlayer.username, existingPlayer))
      }
    })
    
    world.broadcast(OutgoingPackets.Message(`&b${joiningPlayer.username} joined the world`))
  }
}