import { Graphics, Node, UITransform, Vec2, tween, v2, v3 } from "cc"
import Player from "./player"
import { sporeParams } from "../scene_main/spore_manager"
import Ball from "./ball"

const out = v2()
const in_ = v2()

/** 孢子 */
class Spore {
  node: Node = null
  /** 默认半径，暂定为 15 */
  readonly size: number = 15
  /* 所属玩家 */
  player: Player = null
  /** 绘图组件 */
  graphics: Graphics = null

  /** 自身所处位置 */
  get position() { return in_.set(this.node.position.x, this.node.position.y) }

  constructor() {
    this.node = new Node("spore")
    this.graphics = this.node.addComponent(Graphics)
    const uiTransform = this.node.addComponent(UITransform)
    uiTransform.setContentSize(this.size * 2, this.size * 2)
    uiTransform.setAnchorPoint(0.5, 0.5)
  }

  /** 
   * 设置孢子基本属性并且绘制到地图中
   * @param parent 父节点
   * @param begin 起始位置
   * @param end 终止位置
   * @param color 颜色
   */
  create(parent: Node) {
    const { begin, end, color } = sporeParams
    this.node.setParent(parent)
    this.graphics.clear()
    this.graphics.fillColor = color
    this.graphics.circle(0, 0, this.size)
    this.graphics.fill()
    this.node.setPosition(begin.x, begin.y)
    tween(this.node).to(0.3, { position: v3(end.x, end.y) }).start()
  }

  /** 判断球体是否碰撞到孢子 */
  checkCollision(ball: Ball): boolean {
    // 计算球体到孢子的距离
    const lenSqr = Vec2.subtract(out, ball.position, this.position).lengthSqr()
    // 孢子肯定比球体小，且球体覆盖全部孢子时判定为可以吞噬
    return lenSqr <= ball.radius ** 2
  }
}

export { Spore }