import { _decorator, Color, Component, director, EventKeyboard, EventTouch, Input, input, KeyCode, Label, Layers, Layout, Node } from 'cc'
import PlayerModel from '../model/player'
import { EVENT_TYPE, eventTarget } from '../runtime'
import { mainSceneData } from '../runtime/main_scene_data'
import { AcanthosphereManager } from './acanthosphere_manager'
import { CaidouManager } from './caidou_manager'
import { directionZero } from './direction_wheel'
import { PlayerManager } from './player_manager'
import { SporeManager } from './spore_manager'
const { ccclass, property } = _decorator

@ccclass('MainSceneManager')
export class MainSceneManager extends Component {
  @property(Node) rankingListNode: Node = null
  @property(Node) timeNode: Node = null
  @property(Node) settineNode: Node = null
  @property(Node) settingWindowNode: Node = null

  /** 存放球体的节点 */
  ballNode: Node = null
  /** 存放彩豆节点,彩豆节点是一个二维数组，使用二维数组是为了优化碰撞检测 */
  coinNode: Node = null
  /** 存放孢子的节点 */
  sporeNode: Node = null
  /** 玩家列表 */
  playerList: PlayerModel[] = []
  /** 本局游戏剩余时间 */
  time: number = 0

  timeLabel: Label = null

  start() {
    // 添加彩豆节点
    this.coinNode = new Node('coinNode')
    this.coinNode.setParent(this.node)
    /** 添加孢子节点 */
    this.sporeNode = new Node('sporeNode')
    this.sporeNode.setParent(this.node)
    // 添加球体节点
    this.ballNode = new Node('ballNode')
    this.ballNode.setParent(this.node)
    /** 监听按键事件 */
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this)
    input.on(Input.EventType.KEY_UP, this.onKeyUp, this)

    this.time = Date.now()

    this.initRankingListNode()
    this.init()

    this.timeLabel = this.timeNode.getComponent(Label)
    this.schedule(this.updateTime, 0.5)

    this.settineNode.on(Node.EventType.TOUCH_END, (e: EventTouch) => this.settingWindowNode.active = true)
  }

  updateTime() {
    const remainingTime = mainSceneData.gameTime - Math.floor((Date.now() - this.time) / 1000)
    this.timeLabel.string = `${Math.floor(remainingTime / 60)} : ${Math.floor(remainingTime % 60)}`
    // 游戏结束
    if (remainingTime <= 0) this.gameOver()
  }

  gameOver() {
    localStorage.lastScore = mainSceneData.player.score
    const leaderboard = JSON.parse(localStorage.leaderboard) as any[]
    leaderboard.push({ name: mainSceneData.player.name, score: mainSceneData.player.score, time: Date.now() })
    localStorage.leaderboard = JSON.stringify(leaderboard)
    director.loadScene('start')
  }

  /** 初始化排行榜 */
  initRankingListNode() {
    // 排行榜显示前10名得信息
    const layout = this.rankingListNode.getComponent(Layout)
    for (let i = 0; i < 10; i++) {
      const labelNode = new Node('label')
      labelNode.layer = Layers.BitMask.UI_2D
      const label = labelNode.addComponent(Label)
      label.fontSize = 24
      label.lineHeight = 30
      this.rankingListNode.addChild(labelNode)
    }
    layout.type = Layout.Type.VERTICAL
  }

  updateRankingList() {
    if (mainSceneData.players.length === 0) return
    mainSceneData.players.sort((a, b) => b.score - a.score)
    const nodes = this.rankingListNode.children
    for (let i = 0; i < 10; i++) {
      const player = mainSceneData.players[i]
      const labelNode = nodes[i]
      const label = labelNode.getComponent(Label)
      if (player === mainSceneData.player) {
        label.color = Color.RED
      } else {
        label.color = Color.WHITE
      }
      label.string = `${i + 1}. ${player.name} ${player.score}`
      this.rankingListNode.addChild(labelNode)
    }
  }

  protected update(dt: number): void {
    this.updateRankingList()
  }

  protected onDestroy(): void {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this)
    input.off(Input.EventType.KEY_UP, this.onKeyUp, this)
  }

  /** 按键按下事件 */
  onKeyDown(event: EventKeyboard) {
    switch (event.keyCode) {
      case KeyCode.KEY_Q:
        this.onSpore()
        // 每秒吐25个孢子 1 / 25 === 0.04
        this.schedule(this.onSpore, 0.04)
        break

      case KeyCode.KEY_E:
        this.onSplit()
        break

      case KeyCode.KEY_W:
        this.onSplit
        // 每秒分身25次，这个速度够用了
        this.schedule(this.onSplit, 0.04)
        break

      case KeyCode.SPACE:
        eventTarget.emit(EVENT_TYPE.DIRECTION_WHEEL_UPDATE, directionZero)
        break
    }
  }

  /** 按键抬起事件 */
  onKeyUp(event: EventKeyboard) {
    switch (event.keyCode) {
      case KeyCode.KEY_Q:
        // 取消吐孢子
        this.unschedule(this.onSpore)
        break

      case KeyCode.KEY_W:
        // 取消分身
        this.unschedule(this.onSplit)
        break
    }
  }

  /** 玩家点击吐孢子 */
  onSpore() {
    eventTarget.emit(EVENT_TYPE.PLAYER_ACTION, '1')
  }

  /** 玩家点击分身 */
  onSplit() {
    eventTarget.emit(EVENT_TYPE.PLAYER_ACTION, '2')
  }

  /** 按钮点击事件的回调函数 */
  onButtonClick(e: EventTouch, active: string) {
    eventTarget.emit(EVENT_TYPE.PLAYER_ACTION, active)
  }

  init() {
    this.coinNode.addComponent(CaidouManager)
    this.sporeNode.addComponent(SporeManager)
    this.ballNode.addComponent(PlayerManager)
    this.ballNode.addComponent(AcanthosphereManager)
  }
}
