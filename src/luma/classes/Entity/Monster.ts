import { mod } from "../../util/Helpers/Modulo";
import { randInt } from "../../util/Helpers/RandInt";
import { BlockUnit } from "../../util/Vectors/MVec3";
import { Orientation } from "../../util/Vectors/Orientation";
import { EntityBase } from "./EntityBase";

export class Monster extends EntityBase {
  public setupModern(): void {
    /** */
  }

  public representLegacy(): void {
    /** */
  }

  timer = 1;
  timer_jump = 1;


  goalYaw = 0
  goalPitch = 0

  public think(dt: number): void {
    this.timer -= dt;
    this.timer_jump -= dt;

    if (this.timer < 0) {
      this.timer = 0.2
      this.goalYaw = randInt(255)
      this.goalPitch = mod(-50 + randInt(100), 255)
    }

    if (this.timer_jump < 0 && this.grounded) {
      this.timer_jump = Math.random()*2
      this.velocity.y = 9 as BlockUnit
    }

    const walkVector = new Orientation(this.orientation.yaw, 0).toNormalVec3<BlockUnit>().scaled(3)
    walkVector.y = this.velocity.y

    this.velocity = walkVector

    this.velocity.x = this.velocity.x * 0.9 as BlockUnit
    this.velocity.z = this.velocity.z * 0.9 as BlockUnit

    this.orientation = this.orientation.lerp(this.goalYaw, this.goalPitch, 0.2)  }
}