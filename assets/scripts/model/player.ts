import { Color, Node, tween, v2, v3, Vec2 } from "cc"
import { directionZero } from "../scene_main/direction_wheel"
import { sporeParams } from "../scene_main/spore_manager"
import { EVENT_TYPE, eventTarget, TDirectionWheelUpdateParams } from "../runtime"
import { mainSceneData, uiCtrl } from "../runtime/main_scene_data"
import { calculateTargetPoint, getPolygonCenter, lcgRandom, randomColor, util_getCircleCenter } from "../util"
import Ball from "./ball"

/** 二维向量的中间变量，储存向量计算的结果 */
const out = v2()
/** 二维向量的中间变量，储存每个球体的圆心连接为多边形时的中心点坐标 */
const center = v2()
/** 二维向量的中间变量 */
const temp = v2()
/**
 * 一个玩家有多个球体，每局游戏有多个玩家同时存在
 * Player类用于管理玩家的球体，只处理自身的碰撞逻辑和移动等，玩家之间的交互交由PlayerManager管理
 */
class Player {
  /** 存放玩家的所有球体 */
  balls: Ball[] = []
  /** 玩家的名字 */
  name: string = ''
  /** 移动方向 */
  tdwp: TDirectionWheelUpdateParams = directionZero
  /** 节点 */
  node: Node = null
  /** 球体颜色 */
  color: Color = null
  /** 孢子颜色 */
  sporeColor: Color = null
  /** 玩家的分数 */
  score: number = 0
  /** 玩家球体的缓存 */
  ballCache: Ball[] = []
  /** 自身孢子合集 */
  sporeCache: Ball[] = []
  /** 分数更新后的回调函数 */
  scoreUpdateCallback: (score: number) => void = null

  /** 获取一个球体,先在缓存中查找，如果不存在则创建一个新的 */
  getBall() {
    const ball = this.ballCache.pop() || Ball.createBall(this.node, this.color, this)
    ball.mass = mainSceneData.startScore
    ball.node.setParent(this.node)
    ball.lastSplitTime = Date.now()
    this.balls.push(ball)
    return ball
  }

  /** 设置回调方法 */
  setScoreUpdateCallback(callback: (score: number) => void) {
    this.scoreUpdateCallback = callback
    this.updateScore()
  }

  /** 球体被吃掉了，移除球体 */
  removeBall(ball: Ball, name: string = '') {
    this.balls.splice(this.balls.indexOf(ball), 1)
    this.ballCache.push(ball)
    ball.node.removeFromParent()

    // 玩家死亡
    if (!this.balls.length) {
      this.die(name)
    }
  }

  /** 玩家死亡 */
  die(name: string = '') {
    // 死亡逻辑 ......
    this.tdwp = directionZero
    if (mainSceneData.player === this) {
      uiCtrl.deathUI.show(name).then(() => {
        this.birth()
      })
    } else {
      // 复活并且初始化玩家的第一个球体
      this.birth()
    }
  }

  /** 重新统计分数 */
  updateScore() {
    let score = 0
    this.balls.forEach(ball => { score += ball.mass })
    this.score = score
    this.scoreUpdateCallback?.(this.score)
  }

  constructor(name: string, parent: Node) {
    this.node = parent
    this.name = name
    // 给球体设定一个随机的颜色
    this.color = randomColor()
    this.sporeColor = randomColor()
    this.birth()
  }

  /** 初始化第一个球体 */
  birth() {
    this.getBall().setPosition(
      lcgRandom.randomInt(200, mainSceneData.mapSize - 200),
      lcgRandom.randomInt(200, mainSceneData.mapSize - 200)
    )
  }

  /** 吐球 */
  shoot(): boolean {
    // 记录吐球数量
    let count = 0
    this.balls.forEach(ball => {
      // if (ball.mass < mainSceneData.minScoreForThrust) return
      if (ball.mass < 28) return false
      ball.mass -= mainSceneData.beanScore
      /** 30 代表孢子吐出时距离球体的距离，150表示孢子吐出后行走的距离 */
      calculateTargetPoint(sporeParams.begin, ball.targetDirection, ball.radius * 1.15, ball.position)
      calculateTargetPoint(sporeParams.end, ball.targetDirection, 150, sporeParams.begin)
      let { x, y } = sporeParams.end
      if (x < 15) x = 15
      if (y < 15) y = 15
      if (x > mainSceneData.mapSize - 15) x = mainSceneData.mapSize - 15
      if (y > mainSceneData.mapSize - 15) y = mainSceneData.mapSize - 15
      sporeParams.end.set(x, y)
      sporeParams.color.set(this.sporeColor)
      eventTarget.emit(EVENT_TYPE.PLAYER_THROW_BALL)
      count++
    })
    return count > 0
  }

  /** 分身 */
  split(): boolean {
    // 筛选出可以分身的球体
    const balls: Ball[] = this.balls.filter(ball => ball.mass >= mainSceneData.minScoreForSplit)
    // 优先使用大球分身
    balls.sort((a, b) => b.mass - a.mass)
    const splitCount = mainSceneData.maxSplitCount - this.balls.length
    // 开始分身
    for (let i = 0; i < balls.length && i < splitCount; i++) {
      const oldBall = balls[i]
      const newBall = this.getBall()
      const mass = Math.floor(oldBall.mass / 2)
      // 如果出现奇数分数则把大球分给新球体
      newBall.mass = oldBall.mass - mass
      oldBall.mass = mass
      newBall.setDirection(oldBall.targetDirection)
      oldBall.updateRadiusAndSpeed()
      newBall.updateRadiusAndSpeed()
      const len = Math.max(oldBall.radius * 2.3, 200)
      const startPos = oldBall.isMovable ? oldBall.position : oldBall.splitPosition
      calculateTargetPoint(out, oldBall.targetDirection, len, startPos)
      newBall.clampPosition(out)
      newBall.setPosition(oldBall.position.x, oldBall.position.y)
      // 球体分身期间不可移动
      newBall.isMovable = false
      newBall.splitPosition.set(out)
      tween(newBall.node).to(0.3, { position: v3(out.x, out.y) }).call(() => newBall.isMovable = true).start()
    }
    return splitCount > 0 && this.balls.length > 0
  }

  /** 更新球体的方向 */
  updateDirection(dt: number) {
    if (this.balls.length === 0) return
    // 假设固定的长度为 2000
    const _length = 2000 * this.tdwp.length
    if (this.balls.length === 1) {
      this.balls[0].setDirection(this.tdwp.direction)
      return
    }
    // 获取矩形中心点
    getPolygonCenter(center, this.balls)
    // 根据中心点来计算当前的方向
    this.balls.forEach(ball => {
      Vec2.multiplyScalar(out, this.tdwp.direction, _length)
      Vec2.add(temp, center, out)
      ball.setDirection(temp.subtract(v2(ball.position.x, ball.position.y)).normalize())
    })
    if (this.balls.length > 1) {
      this._mergeBalls()
      this.handleBallCollision(dt)
    }
  }

  /** 处理球体重合的情况 */
  handleBallCollision(dt: number) {
    const now = Date.now()
    // 过滤出距离上一次分身时间超过 mergeTime 的球体
    const balls = this.balls.filter(ball => now - ball.lastSplitTime < mainSceneData.mergeTime && ball.isMovable)
    const tag = new Array(balls.length).fill(false)
    // 使这些球体在短时间内分开
    for (let i = 0; i < balls.length; i++) {
      const ball1 = balls[i]
      for (let j = i + 1; j < balls.length; j++) {
        const ball2 = balls[j]
        // 获取碰撞深度
        const depth = (ball1.radius + ball2.radius - ball1.distanceTo(ball2))
        // 两方都已经做出了处理
        if (tag[i] && tag[j]) continue
        // 没有碰撞
        if (depth < 0) continue
        // 获取两球圆心连线的中心点
        center.set(util_getCircleCenter(ball1.position, ball2.position))
        // 按照球的体重来计算碰撞后的速度，质量越大速度越快
        const mass = ball1.mass + ball2.mass
        if (!tag[i]) {
          ball1.speed = ball2.mass / mass * depth
          tag[i] = true
        }
        if (![tag[j]]) {
          ball2.speed = depth - ball1.speed
          tag[j] = true
        }
        // 分别设置两球的方向，使其朝着和中心点相反的方向移动
        const dir = center.subtract(ball1.position).normalize()
        ball1.direction.set(dir)
        ball2.direction.set(dir.multiplyScalar(-1))
        break
      }
    }
  }

  /** 对满足合体要求的球体进行合并操作 */
  private _mergeBalls() {
    const now = Date.now()
    const judging = (ball: Ball) => (now - ball.lastSplitTime > mainSceneData.mergeTime) && ball.isMovable
    // 从大到小进行合球
    this.balls.sort((a, b) => b.mass - a.mass)

    for (let i = 0; i < this.balls.length; i++) {
      const ball1 = this.balls[i]
      for (let j = i + 1; j < this.balls.length; j++) {
        const ball2 = this.balls[j]

        if (!judging(ball1) && !judging(ball2)) continue
        // 获取球体圆心距离
        const depth = ball1.distanceTo(ball2)
        // 完全重合时的碰撞距离, 此处 * 0.1 是为了增加碰撞范围
        const minDepth = Math.abs(ball1.radius - ball2.radius) + Math.min(ball1.radius, ball2.radius) * 0.1
        // 判断是否满足合并条件
        if (minDepth < depth) continue
        // 更新时间
        ball1.lastSplitTime = ball2.lastSplitTime = now
        // 合并操作
        if (ball1.lastSplitTime < ball2.lastSplitTime) {
          ball1.mass += ball2.mass
          this.removeBall(ball2)
          j--
        } else {
          ball2.mass += ball1.mass
          this.removeBall(ball1)
          i--
          break
        }
      }
    }
  }

  /** 每帧要做的事情 */
  update(dt: number) {
    if (this.balls.length !== 0) this.updateDirection(dt)
    this.balls.forEach(ball => ball.update(dt))
    this.updateScore()
  }
}

export default Player
