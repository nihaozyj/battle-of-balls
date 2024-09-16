import { _decorator, Component, Label, Node } from 'cc'
import { uiCtrl } from '../runtime/main_scene_data'
const { ccclass } = _decorator

@ccclass('UiDieCtrl')
export class UiDieCtrl extends Component {

  label: Label = null
  button: Node = null
  buttonLabel: Label = null

  private timer: number = 0

  protected start(): void {
    uiCtrl.deathUI = this
    this.node.active = false
    this.label = this.node.getChildByName('Label').getComponent(Label)
    this.button = this.node.getChildByName('Button')
    this.buttonLabel = this.button.getChildByName('Label').getComponent(Label)
  }

  /**
   * 显示死亡信息
   * @param name 死亡角色名称
   * @param time 复活倒计时时间
   */
  show(name: string, time: number = 3): Promise<void> {
    this.node.active = true
    this.label.string = `你被 ${name} 吃掉了！`
    this.timer = time
    this.updateLabel()
    this.schedule(this.updateLabel, 1, 4)
    this.button.once('click', () => this.close())
    return new Promise(resolve =>
      this.node.once('timer_end', () => resolve(void 0))
    )
  }

  updateLabel() {
    this.buttonLabel.string = `立即复活 (${this.timer--})`
    if (this.timer < 0) this.close()
  }

  close() {
    this.unschedule(this.updateLabel)
    this.node.active = false
    this.node.emit('timer_end')
  }

  protected onDestroy(): void {

  }
}
