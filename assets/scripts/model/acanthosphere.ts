import { Node, Sprite, UITransform, Vec2, v2 } from 'cc'
import { calculateBallRadius, lcgRandom } from '../util'
import { mainSceneData } from '../runtime/main_scene_data'
import Ball from './ball'

/** 缓存池 */
const cachePool: Acanthosphere[] = []

/** 多个球体分裂方向表 */
const splitDirectionList = [
  [],
  /** 剩余数量为1时分裂1球体 */
  [v2(0, 1)],
  /** 剩余数量为2时分裂2球体 */
  [v2(0, 1), v2(0, 1).rotate(Math.PI)],
  /** 剩余数量为3时分裂3球体 */
  [v2(0, 1), v2(0, 1).rotate(Math.PI * 0.6), v2(0, 1).rotate(Math.PI * 1.2)],
  /** 剩余数量为4时分裂4球体 */
  [v2(0, 1), v2(0, 1).rotate(Math.PI * 0.5), v2(0, 1).rotate(Math.PI), v2(0, 1).rotate(Math.PI * 1.5)],
  /** 剩余数量为5时分裂5球体 */
  [v2(0, 1), v2(0, 1).rotate(Math.PI * 0.4), v2(0, 1).rotate(Math.PI * 0.8), v2(0, 1).rotate(Math.PI * 1.2), v2(0, 1).rotate(Math.PI * 1.6)],
  /** 剩余数量为6时分裂6球体 */
  [v2(0, 1), v2(0, 1).rotate(Math.PI * 0.33), v2(0, 1).rotate(Math.PI * 0.66), v2(0, 1).rotate(Math.PI * 0.99), v2(0, 1).rotate(Math.PI * 1.32), v2(0, 1).rotate(Math.PI * 1.65)],
]


/**
 * 刺球类
 */
class Acanthosphere {
  /** 自身所在的节点 */
  node: Node = null
  /** 自身分数 */
  mass: number = 0
  /** 自身尺寸 */
  size: number = 0
  /** 分数取值列表 */
  static readonly scoreList: number[] = [100, 140, 180, 220]
  /** 球体分裂最大数量 */
  static readonly maxSplitCount: number = 6
  /** 扎刺后分裂球体的最大积分数量 */
  static readonly maxSplitMass: number = mainSceneData.minScoreForDigest * 3


  /** 获取球体分裂的数量、分数以及方向 */
  static getSplitInfo(ball: Ball): { count: number, vs: Vec2[] } {
    const count = Math.min(mainSceneData.maxSplitCount - ball.player.balls.length, Acanthosphere.maxSplitCount)
    return { count, vs: splitDirectionList[count] }
  }

  static create(parent: Node): Acanthosphere {
    const acanthosphere = cachePool.pop() || new Acanthosphere()
    acanthosphere.mass = Acanthosphere.scoreList[lcgRandom.randomInt(0, Acanthosphere.scoreList.length)]
    acanthosphere.node.setPosition(
      lcgRandom.randomInt(200, mainSceneData.mapSize - 200),
      lcgRandom.randomInt(200, mainSceneData.mapSize - 200)
    )
    // 此处将刺球的大小减少2像素，使其看起来更小，玩家更容易分辨
    acanthosphere.size = calculateBallRadius(acanthosphere.mass) * 2
    acanthosphere.node.getComponent(UITransform).setContentSize(acanthosphere.size, acanthosphere.size)
    acanthosphere.setParent(parent)
    return acanthosphere
  }

  constructor() {
    this.node = new Node('Acanthosphere')
    this.node.addComponent(UITransform).setAnchorPoint(0.5, 0.5)
    const sprite = this.node.addComponent(Sprite)
    sprite.spriteFrame = mainSceneData.shutiaFrames
    sprite.sizeMode = Sprite.SizeMode.CUSTOM
    sprite.type = Sprite.Type.SIMPLE
  }

  /** 设置父节点 */
  setParent(parent: Node) {
    this.node.parent = parent
  }

  /** 从父节点移除 */
  removeFromParent() {
    this.node.removeFromParent()
    cachePool.push(this)
  }

  /** 检测是否和球体重合 */
  isIntersectWith(ball: Ball) {
    const squaredDistance = Vec2.squaredDistance(this.node.position, ball.node.position)
    return squaredDistance < (Math.abs(this.size / 2 - ball.radius) * 1.2) ** 2
  }
}

export { Acanthosphere }
