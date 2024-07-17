import { Color, Node, Vec2, tween, v2, v3 } from "cc"
import { directionZero } from "../component/direction_wheel"
import { sporeParams } from "../component/spore_manager"
import { EVENT_TYPE, TDirectionWheelUpdateParams, eventTarget } from "../runtime"
import { mainSceneData, uiCtrl } from "../runtime/main_scene_data"
import { calculateTargetPoint, getPolygonCenter, lcgRandom, randomColor } from "../util"
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
    this.updateScore()
    if (this.balls.length === 0) {
      /** 玩家死亡 */
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

  /** 销毁 */
  destroy() {

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
    const ball = this.getBall()
    ball.setPosition(lcgRandom.randomInt(200, mainSceneData.mapSize - 200), lcgRandom.randomInt(200, mainSceneData.mapSize - 200))
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
    // 如果分身后球体数量大于 maxSplitCount 则需要排序，优先使用大球分身
    if (balls.length + this.balls.length > mainSceneData.maxSplitCount)
      balls.sort((a, b) => b.mass - a.mass)
    const maxSplitCount = mainSceneData.maxSplitCount - this.balls.length
    // 开始分身
    for (let i = 0; i < balls.length && i < maxSplitCount; i++) {
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
      calculateTargetPoint(out, oldBall.targetDirection, len, oldBall.position)
      newBall.clampPosition(out)
      newBall.setPosition(oldBall.position.x, oldBall.position.y)
      tween(newBall.node).to(0.3, { position: v3(out.x, out.y) }).start()
    }
    return maxSplitCount > 0 && this.balls.length > 0
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
      this.mergeBalls()
      this.handleBallCollision(dt)
    }
  }

  /** 处理球体重合的情况 */
  handleBallCollision(dt: number) {
    const now = Date.now()
    this.balls.forEach((ball, index) => {
      if (now - ball.lastSplitTime > mainSceneData.mergeTime) return
      for (let i = index + 1; i < this.balls.length; i++) {
        if (now - this.balls[i].lastSplitTime > mainSceneData.mergeTime) continue
        // 球体未发生碰撞不处理重合
        if (!ball.collideWith(this.balls[i])) continue
        // 获取两球圆心连线的中心点
        getPolygonCenter(center, [ball, this.balls[i]])
        // 获取碰撞深度
        const depth = ball.radius + this.balls[i].radius - Vec2.distance(ball.position, this.balls[i].position) / 2
        // 设置两球的速度使其移动时不会抖动距离太大
        ball.speed = Math.min(ball.speed, depth / dt)
        this.balls[i].speed = Math.min(this.balls[i].speed, depth / dt)
        // 分别设置两球的方向，使其朝着和中心点相反的方向移动
        const dir = Vec2.subtract(out, ball.position, center).normalize()
        ball.direction.set(dir.x, dir.y)
        dir.multiplyScalar(-1)
        this.balls[i].direction.set(dir.x, dir.y)
      }
    })
  }


  /** 对满足合体要求的球体进行合体操作 */
  mergeBalls() {
    const now = Date.now()
    for (let i = 0; i < this.balls.length; i++) {
      const condition_i = now - this.balls[i].lastSplitTime > mainSceneData.mergeTime
      if (!condition_i) continue
      for (let j = i + 1; j < this.balls.length; j++) {
        const condition_j = now - this.balls[j].lastSplitTime > mainSceneData.mergeTime
        // 只要有一个球体的分身时间满足条件，就可以进行合体操作
        if (!(condition_i || condition_j)) continue
        // 获取球体间的距离
        if (!this.balls[i].isOverlapping(this.balls[j])) continue

        if (this.balls[i].mass > this.balls[j].mass) {
          this.balls[i].mass += this.balls[j].mass
          this.removeBall(this.balls[j])
        } else {
          this.balls[j].mass += this.balls[i].mass
          this.removeBall(this.balls[i])
        }
        if (i === this.balls.length) return
        this.mergeBalls()
      }
      if (i === this.balls.length) return
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