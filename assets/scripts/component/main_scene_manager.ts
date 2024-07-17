import { _decorator, Color, Component, EventKeyboard, EventTouch, Input, input, KeyCode, Label, Layers, Layout, Node, Widget } from 'cc'
import { mainSceneData } from '../runtime/main_scene_data'
import PlayerModel from '../model/player'
import { EVENT_TYPE, eventTarget } from '../runtime'
import { CaidouManager } from './caidou_manager'
import { PlayerManager } from './player_manager'
import { directionZero } from './direction_wheel'
import { SporeManager } from './spore_manager'
import { AcanthosphereManager } from './acanthosphere_manager'
const { ccclass, property } = _decorator

@ccclass('MainSceneManager')
export class MainSceneManager extends Component {
  @property(Node) rankingListNode: Node = null

  /** 存放球体的节点 */
  ballNode: Node = null
  /** 存放彩豆节点,彩豆节点是一个二维数组，使用二维数组是为了优化碰撞检测 */
  coinNode: Node = null
  /** 存放孢子的节点 */
  sporeNode: Node = null
  /** 玩家列表 */
  playerList: PlayerModel[] = []

  private isKeyDownQ: boolean = false
  private isKeyDownW: boolean = false
  private sporeTimer = null

  start() {
    mainSceneData.init()

    // 添加彩豆节点
    this.coinNode = new Node('coinNode')
    this.coinNode.setParent(this.node)
    /** 添加孢子节点 */
    this.sporeNode = new Node('sporeNode')
    this.sporeNode.setParent(this.node)
    // 添加球体节点
    this.ballNode = new Node('ballNode')
    this.ballNode.setParent(this.node)
    // 初始化彩豆地图
    eventTarget.once(EVENT_TYPE.DATA_LOAD_COMPLETE, this.init, this)
    /** 监听按键事件 */
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this)
    input.on(Input.EventType.KEY_UP, this.onKeyUp, this)

    this.initRankingListNode()
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
    const widget = this.rankingListNode.getComponent(Widget)
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
    widget.top = 20
    widget.right = 20
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
        this.isKeyDownQ = true
        this.onSpore()
        // 每秒吐25个孢子 1 / 25 === 0.04
        this.schedule(this.onSpore, 0.04)
        break

      case KeyCode.KEY_E:
        this.onSplit()
        break

      case KeyCode.KEY_W:
        this.isKeyDownW = true
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
        this.isKeyDownQ = false
        // 取消吐孢子
        this.unschedule(this.onSpore)
        break

      case KeyCode.KEY_W:
        this.isKeyDownW = false
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