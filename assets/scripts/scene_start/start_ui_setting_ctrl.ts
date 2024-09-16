import { _decorator, Component, EventTouch, Node, Toggle } from 'cc'
import { mainSceneData } from '../runtime/main_scene_data'
import { util_stopNodeEventBubbling } from '../util/event'
import { db } from '../runtime/db'
const { ccclass, property } = _decorator

@ccclass('StartUiSettingCtrl')
export class StartUiSettingCtrl extends Component {

  @property(Node) toggle: Node = null;
  @property(Node) closeBtn: Node = null;

  protected start(): void {
    util_stopNodeEventBubbling(this.node)
    util_stopNodeEventBubbling(this.closeBtn)
    util_stopNodeEventBubbling(this.toggle)

    this.closeBtn.on(Node.EventType.TOUCH_END, this.onCloseBtnClick, this)
    this.toggle.on(Node.EventType.TOUCH_END, this.onToggleClick, this)
    this.toggle.getComponent(Toggle).isChecked = db.isPlayBGAudio
  }

  private onCloseBtnClick(event: EventTouch): void {
    this.node.active = false
  }

  private onToggleClick(event: EventTouch): void {
    db.isPlayBGAudio = !this.toggle.getComponent(Toggle).isChecked
    db.isPlayBGAudio ? mainSceneData.audioSourceBackground.play() : mainSceneData.audioSourceBackground.stop()
  }
}
