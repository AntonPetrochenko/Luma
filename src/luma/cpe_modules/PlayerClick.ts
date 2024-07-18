import { unpack } from "python-struct";
import { UnsafePlayer, verifyWorldSafe } from "../classes/ServerPlayer";
import { CPE_Mod } from "./CPE";
import { Orientation } from "../util/Vectors/Orientation";
import { BlockUnit, MVec3 } from "../util/Vectors/MVec3";
import { dumpBufferToString } from "../util/Helpers/HexDumper";

export enum PlayerClickedNormal {
    px,
    mx,
    up,
    down,
    pz,
    mz
}

export interface PlayerClickEvent {
    buttonNumber: number,
    pressed: boolean,
    orientation: Orientation
    entityId: number | null
    blockPosition: MVec3<BlockUnit>
    blockNormal: number | null
}

function inpacket_PlayerClicked(packet: Buffer): PlayerClickEvent {
    console.log(dumpBufferToString(packet))
    const data = unpack('>BBBHHbHHHB', packet) as number[]
    const dataDecoded = {
        buttonNumber: data[1],
        pressed: !data[2],
        yawShort: data[3],
        pitchShort: data[4],
        targetEntityId: (data[5] >= 0 && data[5] <= 127) ? data[5] : null, //thanks, random CPE author!
        targetBlockX: data[6],
        targetBlockY: data[7],
        targetBlockZ: data[8],
        targetBlockFace: (data[9] >= 0 && data[9] <= 5) ? data[9] : null //thanks again! any out of range it is!
    }

    return {
        buttonNumber: dataDecoded.buttonNumber,
        pressed: dataDecoded.pressed,
        orientation: new Orientation(dataDecoded.yawShort, dataDecoded.pitchShort, 65536),
        entityId: dataDecoded.targetEntityId,
        blockPosition: new MVec3<BlockUnit>(dataDecoded.targetBlockX as BlockUnit, dataDecoded.targetBlockY as BlockUnit, dataDecoded.targetBlockZ as BlockUnit),
        blockNormal: dataDecoded.targetBlockFace
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface PlayerClickSupportingPlayer extends UnsafePlayer {}

export const Mod_PlayerClick: CPE_Mod<PlayerClickSupportingPlayer> = {
  supportedBy(player: UnsafePlayer): player is PlayerClickSupportingPlayer {
    return player.supports('PlayerClick', 1)
  },
//   hydrate(player: UnsafePlayer) {
//     player.CPE.simulateClick = (msgType: MessageType, text: string) => {
//       not required yet
//     }
//   },
  setup(server) {
    console.log('Registered PlayerClick!')
      server.registerCPEPacket(0x22, {
        length: 15,
        handler: (p: Buffer, s: PlayerClickSupportingPlayer) => {
            const data = inpacket_PlayerClicked(p)
            if (verifyWorldSafe(s, s.world)) {
                s.world.emit('player-click', data)
            }
        }
    })
  },
}

