import { pack } from "python-struct";
import { UnsafePlayer } from "../classes/ServerPlayer";
import { CPE_Mod } from "./CPE";

interface MessageTypeSupportingPlayer extends UnsafePlayer {
  CPE: {sendTypedMessage(msgType: MessageType, text: string): string}
}


export enum MessageType {
  Chat,
  Status1,
  Status2,
  Status3,
  BottomRight1 = 11,
  BottomRight2,
  BottomRight3,
  Announcement = 100
}

function packet_TypedOutgoingMessage(msgType: MessageType, text: string): Buffer {
  return pack('>BB64s', [
    0x0d,
    msgType,
    text.substring(0,64)
  ])
}

export const Mod_MessageTypes: CPE_Mod<MessageTypeSupportingPlayer> = {
  supportedBy(player: UnsafePlayer): player is MessageTypeSupportingPlayer {
    return player.supports('MessageTypes', 1)
  },
  hydrate(player: UnsafePlayer) {
    player.CPE.sendTypedMessage = (msgType: MessageType, text: string) => {
      player.sendPacket(packet_TypedOutgoingMessage(msgType, text))
      return "a"
    }
  }
}

