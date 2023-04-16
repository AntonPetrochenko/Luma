import { UnsafePlayer } from "../classes/ServerPlayer"
import { CPE_ExtEntry } from "../packet_wrappers/IncomingPackets"
import { Mod_MessageTypes } from "./MessageType"

export interface CPE_Mod<T extends UnsafePlayer>{
  hydrate: ((player: UnsafePlayer) => void) | undefined
  supportedBy(player: UnsafePlayer): player is T
}

interface CPESupportEntry<SupportGuard extends UnsafePlayer> extends CPE_ExtEntry {
  mod: CPE_Mod<SupportGuard>
}


//This array lists all CPE modules supported by Luma software
export const LumaCPESupportInfo: CPESupportEntry<unknown & UnsafePlayer>[] = [
  {extName: 'MessageTypes', version: 1, mod: Mod_MessageTypes}
]