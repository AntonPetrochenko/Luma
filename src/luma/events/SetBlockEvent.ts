import { UnsafePlayer } from "../classes/ServerPlayer"
import { PlayerInitiatedEvent } from "../interfaces/Events"
import { BlockUnit, MVec3 } from "../util/Vectors/MVec3"

interface SetBlockOverrideData {
  blockId?: number,
  position?: MVec3<BlockUnit>
}

export class SetBlockEvent implements PlayerInitiatedEvent {
  public overrideData: SetBlockOverrideData = {}
  private denied = false
  public get status() { return {
    denied: this.denied,
    overridden: this.overridden,
    overrideData: this.overrideData
  }}

  public overridden = false
  constructor(
    public readonly player: UnsafePlayer,
    public readonly blockId: number,
    public readonly position: MVec3<BlockUnit>,
    public readonly placeMode: boolean
  ) {}

  deny() {
    this.denied = true
  }

  override(blockId?: number, position?: MVec3<BlockUnit>) {
    this.overridden = true

    this.overrideData.blockId = blockId ?? this.overrideData.blockId
    this.overrideData.position = position ?? this.overrideData.position
  }

  
}