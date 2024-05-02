import { _decorator, Color, Component, Node, v2 } from 'cc'
import { Spore } from '../model/spore'
import { EVENT_TYPE, eventTarget } from '../runtime'
import { mainSceneData } from '../runtime/main_scene_data'
import Ball from '../model/ball'
const { ccclass } = _decorator

/** 吐孢子所需的基本且必须的参数，由于js是单线程的，因此可以直接复用该参数 */
export const sporeParams = {
  /** 起始位置 */
  begin: v2(),
  /** 终止位置 */
  end: v2(),
  /** 孢子颜色 */
  color: new Color()
}

/** 
 * 孢子管理
 * 孢子如果使用图片，可以将每一个玩家的孢子挂载到单独的节点中，这样可以使用图片的自动合批，优化性能
 * 此处暂时不考虑优化，直接放到统一的节点中
 */
@ccclass('SporeManager')
export class SporeManager extends Component {
  /** 孢子合集, 使用坐标作为key, 按照区域划分，暂定区域大小为100x100 */
  spores: Map<string, Spore[]> = new Map()
  /** 玩家孢子所对应的节点 */
  playerSporeNode: Map<String, Node> = new Map()
  /** 孢子缓存 */
  sporeCache: Spore[] = []

  protected start(): void {
    eventTarget.on(EVENT_TYPE.PLAYER_THROW_BALL, this.generateSpore, this)
    this.schedule(this.checkBallCollisions, 0.03)
  }

  protected onDestroy(): void {
    eventTarget.off(EVENT_TYPE.PLAYER_THROW_BALL, this.generateSpore, this)
    this.unschedule(this.checkBallCollisions)
  }

  /** 生成一个孢子并放置到地图上 */
  generateSpore() {
    const spore = this.sporeCache.pop() || new Spore()
    const { end } = sporeParams
    const key = `${Math.floor(end.x / 30)}_${Math.floor(end.y / 30)}`

    if (!this.spores.has(key)) {
      this.spores.set(key, [spore])
    } else {
      this.spores.get(key).push(spore)
    }
    spore.create(this.node)
  }

  /** 
   * 检测球体是否碰撞到孢子
   * 代码架构有问题，应该排序但是重复排序影响性能，因此此处不对球体进行排序，而是直接遍历所有球体
   */
  checkBallCollisions() {
    [].concat(...mainSceneData.players.map(player => player.balls))
      .filter(ball => ball.mass >= mainSceneData.minScoreForDigest)
      .forEach(ball => this.checkCollisions(ball))
  }

  /** 检测碰撞 */
  checkCollisions(ball: Ball) {
    const { position, radius } = ball
    // 此处 +-30 是为了增加碰撞范围，避免孢子被忽略
    const lb = {
      x: Math.max(0, position.x - radius - 30),
      y: Math.max(0, position.y - radius - 30)
    }
    // mainSceneData.mapSize + 30 此处+30是为了增加碰撞范围，避免边缘的孢子被忽略
    const rt = {
      x: Math.min(mainSceneData.mapSize + 30, position.x + radius + 30),
      y: Math.min(mainSceneData.mapSize + 30, position.y + radius + 30)
    }
    lb.x = Math.floor(lb.x / 30)
    lb.y = Math.floor(lb.y / 30)
    rt.x = Math.floor(rt.x / 30)
    rt.y = Math.floor(rt.y / 30)

    for (let x = lb.x; x < rt.x; x++) {
      for (let y = lb.y; y < rt.y; y++) {
        const key = `${x}_${y}`
        const spores = this.spores.get(key)
        if (!spores || spores.length === 0) continue
        spores.forEach(spore => {
          if (!spore.checkCollision(ball)) return
          this.spores.get(key).splice(this.spores.get(key).indexOf(spore), 1)
          spore.node.removeFromParent()
          this.sporeCache.push(spore)
          ball.addScore(mainSceneData.beanScore)
        })
      }
    }
  }
}