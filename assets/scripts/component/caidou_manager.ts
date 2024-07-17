import { Color, Component, Graphics, Node, Vec3, v2, v3 } from "cc"
import Ball from "../model/ball"
import { Caidou } from "../model/caidou"
import { mainSceneData } from "../runtime/main_scene_data"
import { lcgRandom } from "../util"

/** 管理彩豆的生成、销毁等 */
export class CaidouManager extends Component {
  /** 彩豆列表，使用二维数组存储方便查找 */
  private caidous: Caidou[][] = []
  /** 待生成的彩豆列表 */
  private pendingCaidous: Caidou[] = []
  /** 彩豆所处的节点 */
  private caidouNode: Node = null
  /** 彩豆平均分布时的间距 */
  private margin: number = 0

  /** 背景的画布 */
  backgroundGraphics: Graphics = null

  protected start(): void {
    const backgroundNode = new Node("background")
    backgroundNode.setParent(this.node)
    this.backgroundGraphics = backgroundNode.addComponent(Graphics)
    this.initDrawBackground()
    this.caidouNode = new Node('caidous')
    this.caidouNode.setParent(this.node)

    this.caidous = Array(mainSceneData.beanColumnCount)
      .fill(0)
      .map(() => Array(mainSceneData.beanColumnCount)
        .fill(0)
        .map(() => {
          const caidou = new Caidou()
          this.pendingCaidous.push(caidou)
          return caidou
        })
      )

    // 打乱待刷新的彩豆顺序
    this.pendingCaidous.sort(() => lcgRandom.next() - 0.5)
    // 彩豆平均分布时的间距
    this.margin = mainSceneData.mapSize / mainSceneData.beanColumnCount
    // 彩豆位置抖动范围
    const jitter = mainSceneData.beanJitter
    // 设置彩豆位置
    this.caidous.forEach((column, x) => {
      column.forEach((caidou, y) => {
        caidou.setPosition(x * this.margin + lcgRandom.randomInt(-jitter, jitter), y * this.margin + lcgRandom.randomInt(-jitter, jitter))
      })
    })
    // 刷新四分之一的彩豆到地图上
    const halfCount = Math.floor(this.pendingCaidous.length / 4)
    this.pendingCaidous.splice(0, halfCount).forEach(caidou => {
      caidou.active = true
      caidou.node.setParent(this.caidouNode)
    })
    // 彩豆刷新
    this.schedule(this.refreshCaidous.bind(this), mainSceneData.beanRefreshInterval)
    // 彩豆碰撞检测
    this.schedule(this.checkCaidouCollision.bind(this), mainSceneData.beanCheckInterval)
  }

  /** 绘制背景 */
  initDrawBackground() {
    const size = mainSceneData.mapSize
    this.backgroundGraphics.clear()
    this.backgroundGraphics.strokeColor = new Color(255, 255, 255, 25)
    this.backgroundGraphics.lineWidth = 4
    this.backgroundGraphics.rect(0, 0, size, size)
    this.backgroundGraphics.stroke()
    for (let i = 100; i < size; i += 100) {
      this.backgroundGraphics.moveTo(i, 0)
      this.backgroundGraphics.lineTo(i, size)
      this.backgroundGraphics.moveTo(0, i)
      this.backgroundGraphics.lineTo(size, i)
      this.backgroundGraphics.stroke()
    }
  }

  protected onDestroy(): void {
    this.unschedule(this.refreshCaidous)
    this.unschedule(this.checkCaidouCollision)
  }

  /** 刷新彩豆 */
  refreshCaidous() {
    this.pendingCaidous.splice(0, mainSceneData.beanRefreshCount).forEach(caidou => {
      caidou.active = true
      caidou.node.setParent(this.caidouNode)
    })
  }

  /** 
   * 彩豆碰撞检测
   * 检测前会对所有玩家得球体进行排序，实际中得球球大作战应该是按照注册时间进行排序得，此处使用球体得质量进行排序
   * 当球体重合在一起时，彩豆生成得位置如果处于重合球体内，此时彩豆和发生碰撞的球体中质量最低的球体发生碰撞，彩豆消失
   * 因为质量低的球体会被质量高的球体压在身下，从直觉上来说生成的彩豆应该被下面的球体吃掉
   * 同样的，如果生成棘刺球，也会优先和质量低的进行碰撞
   */
  checkCaidouCollision() {
    if (!mainSceneData.players || mainSceneData.players.length === 0) return
    const balls: Ball[] = [].concat(...mainSceneData.players.map(player => player.balls))
    // 按照质量从小到大排序，此时球体的顺序就是碰撞检测的顺序，同时由于越末尾的节点越后渲染，以此实现大球压小球的效果
    balls.sort((a, b) => a.mass - b.mass)
    // 检测碰撞
    balls.forEach(ball => {
      // 计算该球体大概需要检测的范围
      // 由于彩豆的分布是均匀的，一次对球体做外切矩形，然后矩形检测其位置是否在球体范围内即可，由于彩豆位置有固定距离内的随机抖动，一次检测范围需要扩大一格（半径扩大一格）
      // 先计算球体位置对应的彩豆矩形中心位置
      const p = ball.node.position
      const center = v2(Math.floor(p.x / this.margin), Math.floor(p.y / this.margin))
      // 根据球体半径计算矩形范围
      const radius = Math.floor(ball.radius / this.margin) + 2
      const rect = { x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2 }
      rect.x = Math.max(0, rect.x)
      rect.y = Math.max(0, rect.y)
      // 遍历矩形范围内的坐标的彩豆
      const _v3 = v3()
      const radiusSqr = ball.radius * ball.radius
      // 统计参与碰撞的节点
      const caidous = []
      for (let x = rect.x; x < rect.x + rect.width && x < mainSceneData.beanColumnCount; x++) {
        for (let y = rect.y; y < rect.y + rect.height && y < mainSceneData.beanColumnCount; y++) {
          const caidou = this.caidous[x][y]
          caidous.push({ x, y, position: { x: caidou.position.x, y: caidou.position.y } })
          if (!caidou.active) continue
          // 计算彩豆到球体位置的平方距离是否小于球体半径的平方
          const result = Vec3.subtract(_v3, caidou.position, p).lengthSqr() <= radiusSqr
          // 如果为真，则说明球体和彩豆发生碰撞，彩豆消失，球体加分
          if (result) {
            ball.addScore(caidou.score)
            caidou.active = false
            caidou.node.removeFromParent()
            this.pendingCaidous.push(caidou)
          }
        }
      }
    })
  }
}