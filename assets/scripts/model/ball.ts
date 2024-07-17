import { Color, Graphics, Label, Node, UITransform, Vec2, tween, v2, v3 } from "cc"
import { mainSceneData } from "../runtime/main_scene_data"
import { calculateBallRadius, calculateTargetPoint } from "../util"
import { Acanthosphere } from "./acanthosphere"
import Player from "./player"

/** 储存二维向量的临时变量 */
const out = v2()

/** 玩家所拥有的球体 */
class Ball {
  /** 球所挂载的节点,也就是球体本身,通过`createBallNode`创建 */
  node: Node = null
  /** UITransform 组件 */
  transform: UITransform = null
  /** Graphics 组件 */
  graphics: Graphics = null
  /** 球的半径 */
  radius: number = 10
  /** 球的质量（分数） */
  mass: number = mainSceneData.startScore
  /** 球的当前速度 */
  speed: number = mainSceneData.maxSpeed
  /** 当前球的移动方向 */
  direction: Vec2 = v2()
  /** 当前指示器的方向 */
  targetDirection: Vec2 = v2()
  /** 当前球得位置 */
  _position: Vec2 = v2()
  /** 球体所属玩家 */
  player: Player = null
  /** 上次分身时间,通过 Date.now() 获取的毫秒数 */
  lastSplitTime: number = 0
  /** 是否绘制方向箭头 */
  drawArrow: boolean = false
  /** 标签节点 */
  private _label: Label = null

  setDirection(direction: { x: number, y: number }) {
    this.direction.set(direction.x, direction.y)
    this.targetDirection.set(direction.x, direction.y)
  }

  /** 创建一个球体节点，并添加必要的组件 */
  static createBall(parent: Node, color: Color, player: Player, drawArrow: boolean = true) {
    const ball = new Ball()
    ball.player = player
    ball.node = new Node('ball')
    ball.node.setParent(parent)
    ball.drawArrow = drawArrow
    ball.transform = ball.node.addComponent(UITransform)
    ball.transform.setAnchorPoint(0.5, 0.5)
    ball.graphics = ball.node.addComponent(Graphics)
    ball.graphics.fillColor = color
    ball.updateRadiusAndSpeed()
    const node = new Node('label')
    node.setParent(ball.node)
    node.setPosition(0, 0)
    ball._label = node.addComponent(Label)
    ball._label.string = `${player.name} (${ball.mass})`
    return ball
  }

  get position() {
    this._position.set(this.node.position.x, this.node.position.y)
    return this._position
  }

  /** 设置自身位置 */
  setPosition(x: number, y: number) {
    this.node.setPosition(x, y)
  }

  /** 增加球体分数 */
  addScore(score: number) {
    this.mass += score
  }

  /** 球体死亡 */
  die() {
    this.player.removeBall(this)
  }

  /** 更新球的大小和速度 */
  updateRadiusAndSpeed() {
    this.radius = calculateBallRadius(this.mass)
    this.transform.setContentSize(this.radius * 2, this.radius * 2)
    this.graphics.clear()
    this.speed = Math.max(mainSceneData.maxSpeed - (mainSceneData.maxSpeed * this.mass / 5000), 15)
    // 绘制方向箭头
    if (this.drawArrow) {
      Vec2.multiplyScalar(out, this.targetDirection, this.radius)
      this.graphics.circle(out.x, out.y, Math.max(this.radius * 0.1, 4))
    }
    // 绘制圆形球体
    this.graphics.circle(0, 0, this.radius)
    this.graphics.fill()
  }

  /** 每帧执行的更新逻辑 */
  update(dt: number) {
    if (this.speed <= 0) return
    this.updateRadiusAndSpeed()
    this._label.fontSize = Math.max(this.radius * 0.08, 22)
    this._label.lineHeight = this._label.fontSize * 1.5
    this._label.string = this.player.name
    calculateTargetPoint(out, this.direction, this.speed * this.player.tdwp.length * dt, this.position)
    const { x, y } = out
    if (x < this.radius * 0.73) out.x = this.radius * 0.73
    if (y < this.radius * 0.73) out.y = this.radius * 0.73
    if (x > mainSceneData.mapSize - this.radius * 0.73) out.x = mainSceneData.mapSize - this.radius * 0.73
    if (y > mainSceneData.mapSize - this.radius * 0.73) out.y = mainSceneData.mapSize - this.radius * 0.73
    this.node.setPosition(out.x, out.y)
  }

  /** 两球之间的距离 */
  distanceTo(ball: Ball) {
    return Vec2.distance(this.position, ball.position)
  }

  /** 检测两球是否发生碰撞 */
  collideWith(ball: Ball) {
    return Vec2.distance(this.position, ball.position) <= this.radius + ball.radius
  }

  /** 检测两个球体是否完全重合,distance为球体的最小间距, 对于两个大小不相同的球体，小球被覆盖到剩余半径小于distance时，会判定为重合，distance取值范围为[0,1] */
  isOverlapping(ball: Ball, distance: number = 0.2) {
    return this.distanceTo(ball) <= (Math.abs(this.radius - ball.radius) + Math.min(this.radius, ball.radius) * distance)
  }

  /** 球体分裂, 返回值代表分裂后是否原球体是否消失 */
  split(count: number, vs: Vec2[], mess: number): boolean {
    this.mass += mess

    if (count === 0) return false

    let fsMess = Math.floor(this.mass / count)
    if (fsMess > Acanthosphere.maxSplitMass) fsMess = Acanthosphere.maxSplitMass
    const out = v2()

    const syMess = this.mass - (fsMess * count)
    const balls = []

    for (let i = 0; i < count; i++) {
      const ball = this.player.getBall()
      ball.mass = fsMess
      ball.setDirection(vs[i])
      ball.updateRadiusAndSpeed()
      this.updateRadiusAndSpeed()
      calculateTargetPoint(out, vs[i], this.radius, this.position)
      ball.setPosition(out.x, out.y)
      calculateTargetPoint(out, vs[i], this.radius + 150, this.position)
      ball.clampPosition(out)
      tween(ball.node).to(0.3, { position: v3(out.x, out.y) }).start()
      balls.push(ball)
    }
    if (fsMess * count < this.mass - 10 /** mainSceneData.startScore */) {
      this.mass -= fsMess * count
      return false
    } else {
      for (let i = 0, f = 0; i < balls.length;) {
        if (f === syMess) break
        f++
        balls[i].mass += 1
        i++
        if (i === balls.length) i = 0
      }
      return true
    }
  }

  /** 使球的位置在地图内 */
  clampPosition(out: Vec2) {
    const { x, y } = out
    // 此处使用0.73， 是因为圆的内切正方形边长与球体的直径的比值约0.73:1, 在边界上如果使圆的边缘和边界相等，那么玩家吐孢子在地图的四个角落时，会导致球体无法和孢子接触
    if (x < this.radius * 0.73) out.x = this.radius * 0.8
    if (y < this.radius * 0.73) out.y = this.radius * 0.73
    if (x > mainSceneData.mapSize - this.radius * 0.73) out.x = mainSceneData.mapSize - this.radius * 0.73
    if (y > mainSceneData.mapSize - this.radius * 0.73) out.y = mainSceneData.mapSize - this.radius * 0.73
    return out
  }
}

export default Ball