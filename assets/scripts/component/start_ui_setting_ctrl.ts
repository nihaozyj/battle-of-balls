import { _decorator, Component, EventTouch, Node, Toggle } from 'cc'
import { mainSceneData } from '../runtime/main_scene_data'
const { ccclass, property } = _decorator

@ccclass('StartUiSettingCtrl')
export class StartUiSettingCtrl extends Component {

  @property(Node) toggle: Node = null;
  @property(Node) closeBtn: Node = null;

  protected start(): void {
    // 阻止事件冒泡
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this)

    this.closeBtn.on(Node.EventType.TOUCH_END, this.onCloseBtnClick, this)
    this.toggle.on(Node.EventType.TOUCH_END, this.onToggleClick, this)

    this.toggle.getComponent(Toggle).isChecked = (() => {
      if (!localStorage.isPlayBGAudio) return false
      return this.toggle.getComponent(Toggle).isChecked = localStorage.isPlayBGAudio === 'true' ? true : false
    })()
  }

  private onTouchStart(event: EventTouch): void {
    event.propagationStopped = true
  }

  private onTouchEnd(event: EventTouch): void {
    event.propagationStopped = true
  }

  private onTouchCancel(event: EventTouch): void {
    event.propagationStopped = true
  }

  private onCloseBtnClick(event: EventTouch): void {
    event.propagationStopped = true
    this.node.active = false
  }

  private onToggleClick(event: EventTouch): void {
    event.propagationStopped = true
    this.scheduleOnce(() => {
      if (this.toggle.getComponent(Toggle).isChecked) {
        mainSceneData.audioSourceBackground.play()
      } else {
        mainSceneData.audioSourceBackground.stop()
      }
      localStorage.isPlayBGAudio = this.toggle.getComponent(Toggle).isChecked
    })
  }
}
