import { _decorator, Component, Node } from 'cc'
import { Acanthosphere } from '../model/acanthosphere'
import Ball from '../model/ball'
import { mainSceneData } from '../runtime/main_scene_data'
const { ccclass } = _decorator

@ccclass('AcanthosphereManager')
export class AcanthosphereManager extends Component {

  /** 刺球列表 */
  acanthos: Acanthosphere[] = []
  /** 地图刺球最大数量 */
  readonly maxAcanthos: number = 30
  /** 每次刷新的刺球数量 */
  readonly refreshCount: number = 5

  protected start(): void {
    // 开局刷新一半的刺球
    const half = Math.floor(this.maxAcanthos / 2)
    for (let i = 0; i < half; i++) {

    }
    // 10秒刷新一波刺球
    this.schedule(this.refreshAcanthos, 10)
  }

  onDestroy() {
    this.unschedule(this.refreshAcanthos)
  }

  protected update(dt: number): void {
    this.sortAcanthos()
  }

  sortAcanthos() {
    if (!mainSceneData.players || mainSceneData.players.length === 0) return
    this.onCollisionEnter()
    const balls: Ball[] = [].concat(...mainSceneData.players.map(player => player.balls))
    // 合并数组
    const objs: { node: Node, mass: number }[] = [...balls, ...this.acanthos]
    // 排序
    objs.sort((a, b) => a.mass - b.mass)
    // 按照顺序更改节点所在层级
    objs.forEach((obj, index) => obj.node.setSiblingIndex(index))
  }


  refreshAcanthos() {
    const num = Math.min(this.refreshCount, this.maxAcanthos - this.acanthos.length)
    for (let i = 0; i < num; i++) {
      this.acanthos.push(Acanthosphere.create(this.node))
    }
  }

  /** 碰撞处理 */
  onCollisionEnter(balls: Ball[] = null) {
    if (!balls) {
      balls = [].concat(...mainSceneData.players.map(player => player.balls))
      // 筛选出满足基础扎刺条件的球体
      balls.filter(ball => ball.mass > Acanthosphere.scoreList[0] * 1.2)
      // 排序数组，按照从小到大进行碰撞检测
      balls.sort((a, b) => a.mass - b.mass)
    }

    // 刺球和球体进行碰撞检测，由于刺球+球体最大数量不超过 50 * 16 + 50 = 1200，所以直接检测即可，此处不作优化
    for (let i = 0; i < this.acanthos.length; i++) {
      const acantho = this.acanthos[i]
      for (let j = 0; j < balls.length; j++) {
        const ball = balls[j]
        const isTrue = ball.mass > acantho.mass * 1.2 && acantho.isIntersectWith(ball)
        if (!isTrue) continue
        const { count, vs } = Acanthosphere.getSplitInfo(ball)
        if (ball.split(count, vs, acantho.mass)) balls.splice(j, 1)
        acantho.removeFromParent()
        this.acanthos.splice(i, 1)
        i--
        break
      }
    }
  }
}