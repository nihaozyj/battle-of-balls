import { _decorator, Component, Node } from 'cc'
import { util_stopNodeEventBubbling } from '../../scripts/util/event'
const { ccclass, property } = _decorator

/** 弹出层控制器 */
@ccclass('PopupsCtrl')
export class PopupsCtrl extends Component {

  @property(Node) bgNode: Node = null
  @property(Node) contentNode: Node = null
  @property(Node) closeBtn: Node = null

  /** 弹窗关闭时的回调方法列表 */
  public onCloseCallbacks: ((popNode: Node) => void)[] = []

  protected start(): void {
    util_stopNodeEventBubbling(this.bgNode)
    util_stopNodeEventBubbling(this.contentNode)

    this.closeBtn.on('click', this.close, this)
    this.bgNode.on('click', this.close, this)
  }

  /** 关闭弹出层 */
  close(): void {
    this.onCloseCallbacks.forEach(callback => callback(this.node))
    this.node.active = false
  }
}
