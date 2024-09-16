import { _decorator, Component, Node, tween, UIOpacity } from 'cc'
import { util_stopNodeEventBubbling } from '../../scripts/util/event'
const { ccclass, property } = _decorator

/** 弹出层控制器 */
@ccclass('PopupsCtrl')
export class PopupsCtrl extends Component {

  @property(Node) bgNode: Node = null
  @property(Node) contentNode: Node = null
  @property(Node) closeBtn: Node = null

  /** 弹窗关闭时的回调方法列表 */
  public closeCallbacks: ((popNode: Node) => void)[] = []

  protected start(): void {
    util_stopNodeEventBubbling(this.bgNode)
    util_stopNodeEventBubbling(this.contentNode)

    this.closeBtn.on('click', this.close, this)
    this.bgNode.on(Node.EventType.TOUCH_END, this.close, this)
    this.node.active = false

    if (!this.getComponent(UIOpacity)) {
      this.addComponent(UIOpacity)
    }
  }

  show() {
    this.node.active = true
    const opacity = this.getComponent(UIOpacity)
    opacity.opacity = 0
    this.node.setPosition(0, 0)
    tween(opacity).to(0.1, { opacity: 255 }).start()
  }

  /** 关闭弹出层 */
  close(): void {
    const opacity = this.getComponent(UIOpacity)
    tween(opacity).to(0.1, { opacity: 0 }).start()
    this.closeCallbacks.forEach(callback => callback(this.node))
    this.node.active = false
  }
}
