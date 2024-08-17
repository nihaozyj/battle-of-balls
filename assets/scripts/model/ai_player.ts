import { Node, Vec2, v2 } from "cc"
import { mainSceneData } from "../runtime/main_scene_data"
import { lcgRandom } from "../util"
import Ball from "./ball"
import Player from "./player"
import { randomName } from "../util/random_name"

export class AIPlayer extends Player {

  /** 距离上次更改策略的时间 */
  lastStrategyChangeTime = 0

  constructor(parent: Node) {
    super(randomName(), parent)
    this.autoMove()
  }

  /** 自动行走 */
  autoMove() {
    let direction: Vec2 = null
    if (lcgRandom.next() < 0.5) {
      direction = v2(0, 1).rotate(lcgRandom.next() * 2 * Math.PI).normalize()
    }
    else {
      let ball: Ball = mainSceneData.players[lcgRandom.randomInt(0, mainSceneData.players.length)][0]
      if (!ball) {
        direction = v2(0, 1).rotate(lcgRandom.next() * 2 * Math.PI).normalize()
      } else {
        direction = ball.position.clone().subtract(this.balls[0].position).normalize()
      }
    }
    this.tdwp = { direction, length: 1 }
  }


  destroy() {
    super.destroy()
  }

  update(dt: number): void {
    super.update(dt)
    this.lastStrategyChangeTime += dt
    if (this.balls.length === 0) return
    if (this.lastStrategyChangeTime < 5) return
    this.lastStrategyChangeTime = 0
    if (lcgRandom.next() < 0.5) return
    this.autoMove()
  }

  getBall(): Ball {
    const ball = super.getBall()
    ball.drawArrow = false
    return ball
  }
}
