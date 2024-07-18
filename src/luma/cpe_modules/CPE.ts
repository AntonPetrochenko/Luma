import { MinecraftClassicServer } from "../classes/MinecraftClassicServer"
import { UnsafePlayer } from "../classes/ServerPlayer"
import { CPE_ExtEntry } from "../packet_wrappers/IncomingPackets"
import { Mod_CustomParticles } from "./CustomParticles"
import { Mod_MessageTypes } from "./MessageType"
import { Mod_PlayerClick } from "./PlayerClick"

export interface CPE_Mod<T extends UnsafePlayer>{
  hydrate?: ((player: UnsafePlayer) => void) | undefined
  supportedBy(player: UnsafePlayer): player is T
  setup?: (server: MinecraftClassicServer) => void
}

interface CPESupportEntry<SupportGuard extends UnsafePlayer> extends CPE_ExtEntry {
  mod: CPE_Mod<SupportGuard>
}

export interface CPE_IncomingPacket {
  handler: (pack: Buffer, sender: UnsafePlayer) => void,
  length: number
}

//This array lists all CPE modules supported by Luma software
export const LumaCPESupportInfo: CPESupportEntry<unknown & UnsafePlayer>[] = [
  {extName: 'MessageTypes', version: 1, mod: Mod_MessageTypes},
  {extName: 'CustomParticles', version: 1, mod: Mod_CustomParticles },
  {extName: 'PlayerClick', version: 1, mod: Mod_PlayerClick}
]