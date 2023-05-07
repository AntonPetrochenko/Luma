import { BlockFractionUnit, BlockUnit, MVec3 } from "../../util/Vectors/MVec3";
import { Orientation } from "../../util/Vectors/Orientation";
import { World } from "../World";

export interface Mobile {
  position: MVec3<BlockFractionUnit>
  orientation: Orientation
}

export abstract class EntityBase implements Mobile {
  public world: World | undefined
  
  public readonly hitboxOrigin = new MVec3<BlockUnit>(-0.3 as BlockUnit, 0 as BlockUnit, -0.3 as BlockUnit)
  public readonly hitboxSize = new MVec3(0.6 as BlockUnit, 1.8 as BlockUnit, 0.6 as BlockUnit)

  constructor(
    public position: MVec3<BlockFractionUnit>,
    public orientation: Orientation,
    public velocity: MVec3<BlockFractionUnit>
  ) {}
  public hasGravity = true  
  public hasPhysics = true

  public move(dt: number) {
    if (!this.world) {
      throw new Error('Entity cannot be updated before being assigned a world')
    }
    //Precalculate dt-scaled velocity
    const motionThisTick = this.velocity.scaled(dt)
    //For faster referencing. Not sure if this increases performance in any way in JS, but at least iut makes code cleaner
    const world = this.world

    
    //For collision, we need to project this entity onto voxels
    //We can do so by casting rays along this entity's velocity vector from points on it's hitbox's surface

    //For each axis, we only really need one of the surfaces, depending on which direction the entity is moving in.
    //The "-x" surface if we're moving towards -x, x if we move towards x, etc
    //We assume that the entity's bounding box's origin is towards -x,-y,-z from it's center
    //Therefore, the -x surface is the one located at the entity's position
  }

  public physicsUpdate(dt: number) {
    //Add gravity to velocity
    this.velocity = this.velocity.offset(0,-1*dt,0)
    // this.position = this.position.sum(this.velocity.scaled(dt))
  }

  /** 
   * Spawn a representation of this entity to the modern cliengs, e.g. ClassiCube. 
   * For instance, here you can set the entity's custom model 
   * */
  public spawnModern(): void {
    /** */
  }

  /**
   * This function is called in place of sending position packets for legacy clients
   */
  public representLegacy(): void {
    /** */
  }
  
}