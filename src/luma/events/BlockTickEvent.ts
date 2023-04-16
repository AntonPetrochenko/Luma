import { BlockUnit, MVec3 } from "../util/Vectors/MVec3"

export class BlockTickEvent {
  constructor(
    public position: MVec3<BlockUnit>,
    public blockId: number
  ) {}
}