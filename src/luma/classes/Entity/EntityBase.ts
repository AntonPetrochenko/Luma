import { BlockFractionUnit, MVec3 } from "../../util/Vectors/MVec3";
import { Orientation } from "../../util/Vectors/Orientation";

export interface Mobile {
  position: MVec3<BlockFractionUnit>
  orientation: Orientation
}

export abstract class EntityBase implements Mobile {
  /** May be -1 to identify an entity that has not yet been added to a world */
  constructor(
    public position: MVec3<BlockFractionUnit>,
    public orientation: Orientation,
    public velocity: MVec3<BlockFractionUnit>
  ) {}

  private hasGravity = true
  

  public physicsUpdate(dt: number) {
    this.position = this.position.sum(this.velocity.scaled(dt))
  }
  
}