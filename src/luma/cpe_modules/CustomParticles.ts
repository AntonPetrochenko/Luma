import { pack } from "python-struct";
import { UnsafePlayer } from "../classes/ServerPlayer";
import { CPE_Mod } from "./CPE";
import { writeBitmask } from "../util/Helpers/ReadBitmask";
import { BlockFractionUnit, MVec3 } from "../util/Vectors/MVec3";
import { World } from "../classes/World";

function packet_DefineEffect(
  effectID: number, 
  u1: number, 
  v1: number, 
  u2: number,
  v2: number,
  redTint: number,
  greenTint: number,
  blueTint: number,
  frameCount: number,
  particleCount: number,
  size: number,
  sizeVariation: number,
  spread: number,
  gravity: number,
  baseLifetme: number,
  lifetimeVariation: number,
  collideFlags: number,
  fullBright: number
  ): Buffer {
    return pack('>BBBBBBBBBBBBiHiiiiBb', [
      48,
      effectID,
      u1,
      v1,
      u2,
      v2,
      redTint,
      greenTint,
      blueTint,
      frameCount,
      particleCount,
      size,
      sizeVariation,
      spread,
      gravity,
      baseLifetme,
      lifetimeVariation,
      collideFlags,
      fullBright])
}


interface ParticleCollideFlags extends Record<string, boolean> {
  collideWithLeaves: boolean
  collideWithSolids: boolean
  collideWithFluids: boolean
  despawnOnFloors: boolean
  padding: false
}
interface EffectDefinition {
  effectId: number,
  uv: [number, number, number, number],
  tint?: [number, number, number],
  frameCount?: number,
  particleCount?: number,
  size?: number,
  sizeVariation?: number,
  spread?: number,
  gravity?: number,
  baseLifetime?: number,
  lifetimeVariation?: number,
  collideFlags?: ParticleCollideFlags,
  fullbright?: boolean
}

function particlePercent(n: number) {
  return Math.floor(n * 10000)
}

function makeParticleDefinition(options: EffectDefinition) {
  const tint = options.tint ?? [255,255,255]
  const sizeVariation = particlePercent(options.sizeVariation ?? 1)
  const gravity = particlePercent(options.gravity ?? 0)
  const baseLifetime = particlePercent(options.baseLifetime ?? 1)
  const lifetimeVariation = particlePercent(options.lifetimeVariation ?? 1)

  let collideFlags = 0xFF
  if (options.collideFlags) {
    collideFlags = writeBitmask(options.collideFlags, ['padding', 'padding', 'padding', 'collideWithLeaves', 'collideWithFluids', 'collideWithSolids', 'despawnOnFloors', 'padding'])
  }
  return packet_DefineEffect(
    options.effectId,                    
    options.uv[0],                       
    options.uv[1],                       
    options.uv[2],                       
    options.uv[3],                       
    tint[0],                             
    tint[1],                             
    tint[2],                             
    options.frameCount ?? 1,
    options.particleCount ?? 1, 
    options.size ?? 4,         
    sizeVariation,              
    options.spread ?? 0,        
    gravity,                    
    baseLifetime,               
    lifetimeVariation,          
    collideFlags,               
    options.fullbright ? 1 : 0  
  )
}

function packet_SpawnEffect(
  effectId: number, 
  positionX: number, 
  positionY: number, 
  positionZ: number, 
  originX: number, 
  originY: number, 
  originZ: number 
  ): Buffer {
  return pack('>BBiiiiii',
    0x31,
    effectId,
    positionX,
    positionY,
    positionZ,
    originX,
    originY,
    originZ
  )
}

interface ParticleSupportingPlayer extends UnsafePlayer {
  CPE: {
    registerParticle(effectType: EffectDefinition): Promise<void>
    particle(effectId: number, position: MVec3<BlockFractionUnit>, origin?: MVec3<BlockFractionUnit>): Promise<void>
  }
}

export const Mod_CustomParticles: CPE_Mod<ParticleSupportingPlayer> = {
  supportedBy(player: UnsafePlayer): player is ParticleSupportingPlayer {
    return player.supports('CustomParticles', 1)
  },
  hydrate(player: UnsafePlayer) {
    player.CPE.registerParticle = async (effectType: EffectDefinition) => {
      await player.sendPacket(makeParticleDefinition(effectType))
    }
    player.CPE.particle = async (effectId: number, position: MVec3<BlockFractionUnit>, origin?: MVec3<BlockFractionUnit>) => {
      if (!origin) {
        origin = position
      }
      await player.sendPacket(packet_SpawnEffect(effectId, position.x, position.y, position.z, origin.x, origin.y, origin.z))
    }
  }
}


export function globalParticleEffect(world: World, effectID: number, position: MVec3<BlockFractionUnit>, origin?: MVec3<BlockFractionUnit>) {
  world.players.forEach( (player) => {
    if (Mod_CustomParticles.supportedBy(player)) {
      player.CPE.particle(effectID, position, origin)
    }
  })
}
