import { BlockFractionUnit, BlockUnit, MVec3, MVec3BlockToFraction, MVec3FractionToBlock } from "../../util/Vectors/MVec3";
import { Orientation } from "../../util/Vectors/Orientation";
import { World } from "../World";
import { RaycastResult, castAlong } from "../../util/FastVoxelRaycast";
import { walkSurface } from "../../util/Helpers/WalkSurface";

export interface Mobile {
  position: MVec3<BlockFractionUnit>
  orientation: Orientation
  eyeLevel: BlockFractionUnit
}

export abstract class EntityBase implements Mobile {
  public world: World | undefined

  private entityId = -1
  
  getEntityId() { return this.entityId }
  addToWorld(world: World, id: number) { 
    if (this.entityId == -1) {
      this.world = world
      this.entityId = id
    } else {
      throw new Error('Entity ID can only be set once!')
    }
  }

  public readonly eyeLevel = 51 as BlockFractionUnit
  
  //Size of the hitbox
  public readonly hitboxSize = new MVec3(0.6 as BlockUnit, 1.8 as BlockUnit, 0.6 as BlockUnit)

  //Point of the hitbox closest to 0,0,0
  public readonly hitboxOrigin = new MVec3<BlockUnit>(-0.3 as BlockUnit, 0 as BlockUnit, -0.3 as BlockUnit)

  //Point of the hitbox furthest from 0,0,0
  public readonly hitboxFarPoint = this.hitboxOrigin.sum(this.hitboxSize)

  //hitbox data in fraction units, useful later

    //Size of the hitbox
    public readonly hitboxSizeFraction = MVec3BlockToFraction(this.hitboxSize)

    //Point of the hitbox closest to 0,0,0
    public readonly hitboxOriginFraction = MVec3BlockToFraction(this.hitboxOrigin)
  
    //Point of the hitbox furthest from 0,0,0
    public readonly hitboxFarPointFraction = MVec3BlockToFraction(this.hitboxFarPoint)

  public velocity = new MVec3(0 as BlockUnit, 0 as BlockUnit, 0 as BlockUnit)

  public orientation: Orientation;
  public position: MVec3<BlockFractionUnit>

  constructor(
    position: MVec3<BlockFractionUnit>,
    orientation?: Orientation
  ) {
    this.position = position
    this.orientation = orientation ?? new Orientation(0,0)
  }
  public hasGravity = true  
  public hasPhysics = true

  public move(dt: number) {
    if (!this.world) {
      throw new Error('Entity cannot be updated before being assigned a world')
    }

    this.position = this.position.sum(MVec3BlockToFraction(this.velocity.scaled(dt)))

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

    
    //We're calculating strictly in block units because the world operates in block units
    const blockPosition = MVec3FractionToBlock(this.position)


    
    //Position the hitbox and it's far point at the entity's position
    const localHitbox = blockPosition.sum(this.hitboxOrigin)
    //...and it's far point
    const localHitboxFarPoint = blockPosition.sum(this.hitboxFarPoint)
    
    
    //Given a surface corresponding to an axis, iterate on the other axes while keeping the surface axis constant
    //X surface

    let xCollision: RaycastResult | undefined
    let yCollision: RaycastResult | undefined
    let zCollision: RaycastResult | undefined
    
    const pickedXSurface = motionThisTick.x < 0 ? localHitbox.x : localHitboxFarPoint.x
    walkSurface(localHitbox.z, localHitbox.y, localHitboxFarPoint.z, localHitboxFarPoint.y, (zWorldPosition, yWorldPosition) => {
      xCollision = castAlong(
        world, 
        new MVec3<BlockUnit>(
          pickedXSurface as BlockUnit, 
          yWorldPosition as BlockUnit, 
          zWorldPosition as BlockUnit
        ),
        motionThisTick
      )
    })
    
    const pickedYSurface = motionThisTick.y < 0 ? localHitbox.y : localHitboxFarPoint.y
    walkSurface(localHitbox.x, localHitbox.z, localHitboxFarPoint.x, localHitboxFarPoint.z, (xWorldPosition, zWorldPosition) => {
      yCollision = castAlong(
        world, 
        new MVec3<BlockUnit>(
          xWorldPosition as BlockUnit, 
          pickedYSurface as BlockUnit, 
          zWorldPosition as BlockUnit
        ),
        motionThisTick
      )
    })
    
    const pickedZSurface = motionThisTick.z < 0 ? localHitbox.z : localHitboxFarPoint.z
    walkSurface(localHitbox.x, localHitbox.y, localHitboxFarPoint.x, localHitboxFarPoint.y, (xWorldPosition, yWorldPosition) => {
      zCollision = castAlong(
        world, 
        new MVec3<BlockUnit>(
          xWorldPosition as BlockUnit, 
          yWorldPosition as BlockUnit, 
          pickedZSurface as BlockUnit
        ),
        motionThisTick
      )
    })

    if (zCollision) {
      const zCollisionFraction = MVec3BlockToFraction(zCollision.position)
      if (zCollision.normal[2] > 0) {
        this.position.z = zCollisionFraction.z
      } else {
        this.position.z = (zCollisionFraction.z - this.hitboxFarPointFraction.z) as BlockFractionUnit
      }
    }


    

  }

  public update(dt: number) {
    //Add gravity to velocity
    this.velocity = this.velocity.offset(0,-3.92*dt,0)
  
    this.think(dt)
    this.move(dt)


    //invisible walls

    if (this.position.x < 0) this.position.x = 0 as BlockFractionUnit
    if (this.position.y < 0) this.position.y = 0 as BlockFractionUnit
    if (this.position.z < 0) this.position.z = 0 as BlockFractionUnit

    if (this.position.x > 65535) this.position.x = 65535 as BlockFractionUnit
    if (this.position.y > 65535) this.position.y = 65535 as BlockFractionUnit
    if (this.position.z > 65535) this.position.z = 65535 as BlockFractionUnit
  }

  /** 
   * Spawn a representation of this entity to the modern clients, e.g. ClassiCube. 
   * For instance, here you can set the entity's custom model 
   * */
  public abstract setupModern(): void

  /**
   * This function is called in place of sending position packets for legacy clients, e.g. Notchian
   */
  public abstract representLegacy(): void


  public abstract think(dt: number): void
  
}