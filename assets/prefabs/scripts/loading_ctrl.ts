import { _decorator, Component, Node, ProgressBar, tween, UIOpacity } from 'cc'
const { ccclass, property } = _decorator

@ccclass('LoadingCtrl')
export class LoadingCtrl extends Component {

  @property(Node) backgroundNode: Node = null
  @property(Node) contentNode: Node = null
  @property(Node) progressNode: Node = null

  private progressBar: ProgressBar = null
  private startTimer: number = 0

  start() {
    const preOpacity = this.progressNode.getComponent(UIOpacity)
    const conPpacity = this.contentNode.getComponent(UIOpacity)
    this.progressBar = this.progressNode.getComponent(ProgressBar)
    this.startTimer = Date.now()
    preOpacity.opacity = conPpacity.opacity = 0
    this.progressBar.progress = 0
    tween(preOpacity).to(1, { opacity: 255 }).start()
    tween(conPpacity).to(1, { opacity: 255 }).start()

    const callback = () => this.progressBar.progress += (1 - this.progressBar.progress) * 0.1
    this.schedule(callback, 0.1, 50)
  }

  /** 关闭loading界面，该界面至少显示2秒 */
  close(callback?: () => void) {
    const time = (Date.now() - this.startTimer) / 1000
    this.scheduleOnce(() => {
      this.progressBar.progress = 1
      const opacity = this.node.getComponent(UIOpacity)
      tween(opacity).to(1, { opacity: 0 }).call(() => {
        this.unscheduleAllCallbacks()
        this.node.destroy()
        callback && callback()
      }).start()
    }, Math.max(2 - time, 0))
  }
}
