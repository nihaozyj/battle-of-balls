import { AudioClip, AudioSource, Node, SpriteAtlas, SpriteFrame, resources } from 'cc'
import { UiDieCtrl } from '../scene_main/ui_die_ctrl'
import Player from '../model/player'
import { EVENT_TYPE, eventTarget } from './event_manager'

class UICtrl {
  /** 死亡界面 */
  deathUI: UiDieCtrl = null
}

/** main 游戏所需的数据 */
class MainData {
  /** 地图的大小,地图是个正方形，因此只需要一个数字表示边长 */
  readonly mapSize = 3000
  /** 彩豆的单方向列数，由于地图是正方形，彩豆需要平均分布，因此只需要一个数字表示列数 */
  readonly beanColumnCount = 50
  /** 彩豆 xy 方向的抖动范围, 这里规定抖动分为为间隔的一半，为了防止彩豆重叠，因此减去 5 */
  readonly beanJitter = this.mapSize / this.beanColumnCount / 2 - 5
  /** 玩家初始分数，最小分数和初始分数相同 */
  readonly startScore = 10
  /** 球体的最大速度，每秒移动的距离 */
  readonly maxSpeed = 200
  /** 球体的最小速度，每秒移动的距离 */
  readonly minSpeed = 50
  /** 彩豆在地图上刷新得间隔，单位秒 */
  readonly beanRefreshInterval = 1
  /** 彩豆每次刷新得数量, 此处每次刷新出二百分之一 */
  readonly beanRefreshCount = Math.floor(this.beanColumnCount ** 2 / 200)
  /** 彩豆检测碰撞得间隔，单位秒 */
  readonly beanCheckInterval = 0.2
  /** 球体积分为10时的半径（最小半径） */
  readonly minRadius = 10
  /** 球体每秒积分衰减率 */
  readonly scoreDecayRate = 0.0005
  /** 玩家吞噬孢子要求的最低积分值 */
  readonly minScoreForDigest = 18
  /** 玩家吐球要求的最低积分值 */
  readonly minScoreForThrust = 29
  /** 玩家分身所要求的最低积分值 */
  readonly minScoreForSplit = 18 * 2 + 1
  /** 玩家分身最大数量 */
  readonly maxSplitCount = 16
  /** 孢子所包含的积分值 */
  readonly beanScore = 10
  /** 球体分身后自动合体所需要的时间单位毫秒 */
  readonly mergeTime = 30 * 1000
  /** 球体节点池 */
  private _ballPool: Node[] = []
  /** 单局游戏时间（秒） */
  readonly gameTime = 60 * 6


  /** 所有玩家 */
  players: Player[] = []
  /** 当前玩家 */
  player: Player = null


  /** 背景音乐播放组件 */
  audioSourceBackground: AudioSource = new AudioSource()
  /** 吞噬音效播放组件 */
  audioSourceEffect: AudioSource = new AudioSource()
  /** 球体分身音效播放组件 */
  audioSourceSplit: AudioSource = new AudioSource()
  /** 吐球音效播放组件 */
  audioSourceThrust: AudioSource = new AudioSource()


  /** 彩豆的图片 */
  caidouFrames: SpriteFrame[] = null
  /** 刺球的图片 */
  shutiaFrames: SpriteFrame = null

  /** 根据分数获取当前的速度 */
  getSpeedByScore(score: number): number {
    return Math.max(this.minSpeed, this.maxSpeed - score * 0.01)
  }

  /** 获取一个球体节点 */
  getBallNode(): Node {
    if (this._ballPool.length > 0) return this._ballPool.pop()
    const node = new Node('Ball')
    return node
  }

  async init() {
    await Promise.all([
      new Promise((resolve) => resources.load('sprite/cion', SpriteAtlas, (err, frames) => {
        this.caidouFrames = frames.getSpriteFrames()
        return resolve(null)
      })),
      new Promise((resolve) => resources.load('sprite/ci/spriteFrame', SpriteFrame, (err, frames) => {
        this.shutiaFrames = frames
        return resolve(null)
      })),
      new Promise((resolve) => resources.load('audio/背景旋律', AudioClip, (err, audio) => {
        this.audioSourceBackground.clip = audio
        this.audioSourceBackground.playOnAwake = true
        this.audioSourceBackground.loop = true
        this.audioSourceBackground.volume = 0.5
        return resolve(null)
      })),
      new Promise((resolve) => resources.load('audio/吞噬', AudioClip, (err, audio) => {
        this.audioSourceEffect.clip = audio
        return resolve(null)
      })),
      new Promise((resolve) => resources.load('audio/分身', AudioClip, (err, audio) => {
        this.audioSourceSplit.clip = audio
        return resolve(null)
      })),
      new Promise((resolve) => resources.load('audio/吐球', AudioClip, (err, audio) => {
        this.audioSourceThrust.clip = audio
        return resolve(null)
      }))
    ])
  }
}

/** 游戏主场景所需的数据 */
const mainSceneData = new MainData()
/** UI 控制器 */
const uiCtrl = new UICtrl()


export { mainSceneData, uiCtrl }
