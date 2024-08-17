import { _decorator, Camera, Component, Label, Node, Rect, v2, view } from 'cc'
import { AIPlayer } from '../model/ai_player'
import Ball from '../model/ball'
import Player from '../model/player'
import { EVENT_TYPE, eventTarget, TDirectionWheelUpdateParams } from '../runtime'
import { mainSceneData } from '../runtime/main_scene_data'
import { executeCallback, getCircleRectCenter } from '../util'
const { ccclass } = _decorator

@ccclass('PlayerManager')
export class PlayerManager extends Component {
  /** 玩家列表，此处包含玩家自身和AI，因为本游戏不联网，所以AI也在玩家列表中 */
  players: Player[] = []
  /** 玩家自身 */
  player: Player = null
  /** 摄像机节点 */
  cameraNode: Node = null
  /** 摄像机组件 */
  cameraComponent: Camera = null
  /** 展示分数的label */
  scoreLabel: Label = null

  /** 摄像机初始尺寸 */
  cameraInitSize = v2(0, 0)
  /** 摄像机初始视口高度 */
  cameraInitViewportHeight = 0
  /** 初始摄像机边缘和球体边缘的距离XY */
  cameraInitDistance = v2(0, 0)
  /** 摄像机默认高度 */
  readonly cameraDefaultHeight = 360

  /** 储存摄像机位置和最小尺寸 */
  cameraRect = new Rect()

  protected start(): void {
    this.scoreLabel = this.node.scene.getChildByPath('UICanvas/Label').getComponent(Label)
    this.cameraNode = this.node.parent.getChildByName('Camera')
    this.cameraComponent = this.cameraNode.getComponent(Camera)
    const { width, height } = view.getVisibleSize()
    this.cameraInitSize.set(width, height)
    // 摄像机视口的高度为球体高度 + 常数Y，宽度为球体初始高度加上常数X， 此处将球体质量为10时的视口默认大小作为参考计算常数X和Y
    this.cameraInitDistance.set(width / 2 - mainSceneData.minRadius, height / 2 - mainSceneData.minRadius)
    // 初始玩家自身，而后添加AI
    mainSceneData.players = this.players
    mainSceneData.player = this.player = new Player(mainSceneData.playerName, this.node)
    this.players.push(this.player)
    this.player.setScoreUpdateCallback(score => this.scoreLabel.string = `分数：${score}`)
    // 添加 30 个AI
    executeCallback(30, index => {
      this.players.push(new AIPlayer(this.node))
    })
    eventTarget.on(EVENT_TYPE.DIRECTION_WHEEL_UPDATE, this.setDirectionAndSpeed.bind(this))
    /** 所以玩家的球体每秒掉分 */
    this.schedule(this.attenuation.bind(this), 1)
    /** 监听玩家的动作 */
    eventTarget.on(EVENT_TYPE.PLAYER_ACTION, this.onPlayerAction, this)
  }

  protected onDestroy(): void {
    eventTarget.on(EVENT_TYPE.DIRECTION_WHEEL_UPDATE, this.setDirectionAndSpeed.bind(this))
    eventTarget.off(EVENT_TYPE.PLAYER_ACTION, this.onPlayerAction, this)
  }

  /** 处理用户动作事件 */
  onPlayerAction(action: string): void {
    if (action === '1' && this.player.shoot()) {
      mainSceneData.audioSourceThrust.playOneShot(mainSceneData.audioSourceThrust.clip, 1)
    } else if (action === '2' && this.player.split()) {
      mainSceneData.audioSourceSplit.playOneShot(mainSceneData.audioSourceSplit.clip, 1)
    }
  }

  /**
   * 设置方向和速度
   * 当玩家只存在一个球体是，方向不变
   * 当玩家存在多个球体时，取外切矩形的中心点为0方向，该方向向外延申固定值的比例为100，根据长度在该直线上取一个点为最终方向
   */
  setDirectionAndSpeed(tdwp: TDirectionWheelUpdateParams): void {
    this.player.tdwp = tdwp
  }

  /** 处理碰撞 */
  onCollision(): void {
    const balls: Ball[] = [].concat(...this.players.map(player => player.balls))
    // 块大小
    const blockSize = 100
    // 对其按照坐标进行划分区块，每个区块大小为100
    const blockMap = new Map<string, Ball[]>()
    let x = 0, y = 0
    // 遍历所有球体，将其放入对应的区块
    balls.forEach(ball => {
      x = Math.floor(ball.position.x / blockSize)
      y = Math.floor(ball.position.y / blockSize)
      const key = `${x}-${y}`
      if (blockMap.has(key)) blockMap.get(key).push(ball)
      else blockMap.set(key, [ball])
    })
    const lb = v2(), rt = v2()
    // 遍历球体对其进行碰撞检测
    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i]
      // 计算球体所在范围所包含的区块 key
      lb.x = Math.floor((ball.position.x - ball.radius) / blockSize) - 1
      lb.y = Math.floor((ball.position.y - ball.radius) / blockSize) - 1
      rt.x = Math.floor((ball.position.x + ball.radius) / blockSize) + 1
      rt.y = Math.floor((ball.position.y + ball.radius) / blockSize) + 1
      lb.x = Math.max(lb.x, 0)
      lb.y = Math.max(lb.y, 0)
      rt.x = Math.min(rt.x, Math.floor(mainSceneData.mapSize / blockSize))
      rt.y = Math.min(rt.y, Math.floor(mainSceneData.mapSize / blockSize))
      // 获取区块内的所有球体
      const blockBalls: Ball[] = []
      // 范围内的所有区块key
      for (let x = lb.x; x <= rt.x; x++) {
        for (let y = lb.y; y <= rt.y; y++) {
          const key = `${x}-${y}`
          if (blockMap.has(key)) blockBalls.push(...blockMap.get(key))
        }
      }
      // 检测碰撞
      for (let j = 0; j < blockBalls.length; j++) {
        const minMass = Math.min(ball.mass, blockBalls[j].mass)
        if (blockBalls[j].player === ball.player) continue
        // 此处判断大球和小球的质量是否有1.2倍的差距，如果差距太小则不进行碰撞检测,因为此时不会出现吞噬的情况
        if (!(Math.abs(ball.mass - blockBalls[j].mass) > minMass * 0.2 && ball.isOverlapping(blockBalls[j]))) continue
        let removeBall: Ball = null
        // 两球已经成功碰撞，此时大球吞噬小球
        if (ball.mass > blockBalls[j].mass) {
          ball.mass += blockBalls[j].mass
          removeBall = blockBalls[j]
          blockBalls[j].player.removeBall(blockBalls[j], ball.player.name)
        } else {
          blockBalls[j].mass += ball.mass
          removeBall = ball
          ball.player.removeBall(ball, blockBalls[j].player.name)
        }
        const key = `${Math.floor(removeBall.position.x / blockSize)}-${Math.floor(removeBall.position.y / blockSize)}`
        if (blockMap.has(key)) {
          const bs = blockMap.get(key)
          bs.splice(bs.indexOf(removeBall), 1)
          if (bs.length === 0) blockMap.delete(key)
          balls.splice(balls.indexOf(removeBall), 1)
        }
        if (removeBall === ball) break
      }
    }
  }

  /** 球体每秒掉分 */
  attenuation() {
    this.players.forEach(player => {
      // 每增加500分掉分速度翻一倍
      const df = Math.floor(player.score * (mainSceneData.scoreDecayRate * (player.score / 500)))
      if (player.balls.length === 1) return player.balls[0].mass -= df
      for (let i = 0, _df = 0; _df < df; i++, _df++) {
        if (i === player.balls.length) i = 0
        const ball = player.balls[i]
        if (ball.mass > mainSceneData.startScore)
          ball.mass -= 1
      }
    })
  }

  protected update(dt: number): void {
    // 玩家球体的碰撞检测要求较高，因此每一帧都需要检测
    this.onCollision()
    this.players.forEach(player => player.update(dt))
    // 根据玩家位置计算摄像机位置
    getCircleRectCenter(this.cameraRect, this.player.balls)
    // 移动摄像机位置
    this.cameraNode.setPosition(this.cameraRect.x, this.cameraRect.y)
    // 计算获取的矩形尺寸加上球体距离摄像机边缘的固定距离 / 摄像机初始尺寸，得到缩放比例，取最大值对摄像机进行缩放
    const widthScale = (this.cameraInitDistance.x + this.cameraRect.width) / this.cameraInitSize.x
    const heightScale = (this.cameraInitDistance.y + this.cameraRect.height) / this.cameraInitSize.y
    // 取得最大缩放比例
    const scale = Math.max(widthScale, heightScale)
    // 设置相机高度来改变视口大小
    this.cameraComponent.orthoHeight = this.cameraDefaultHeight * scale
  }
}
