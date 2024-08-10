import { pack } from "python-struct";
import { UnsafePlayer } from "../classes/ServerPlayer";
import { CPE_Mod } from "./CPE";

function packet_ChangeModel(entityId: number, modelName: string) {
    return pack('>BB64s', [
        0x1D,
        entityId,
        modelName
    ])
}

interface ChangeModelSupportingPlayer extends UnsafePlayer {
    CPE: {
        changeModel: (entityId: number, modelName: string) => Promise<void>
    }
}

export const Mod_ChangeModel: CPE_Mod<ChangeModelSupportingPlayer> = {
    supportedBy(player: UnsafePlayer): player is ChangeModelSupportingPlayer {
        return player.supports('ChangeModel', 2)
    },
    hydrate(player: UnsafePlayer) {
        player.CPE.changeModel = (entityId: number, modelName: string) => {
            player.sendPacket(packet_ChangeModel(entityId, modelName))
        }
    },
}