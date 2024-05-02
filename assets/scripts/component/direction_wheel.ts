import { _decorator, Color, Component, EventTouch, Graphics, Input, Node, v2, Vec2 } from 'cc'
import { EVENT_TYPE, eventTarget, TDirectionWheelUpdateParams } from '../runtime'
import { calculateTargetPoint } from '../util'
const { ccclass } = _decorator

/** 代表一个为方向为0， 长度为 1 的轮盘信息 */
export const directionZero = { direction: v2(0, 0), length: 0.3 }

/** 方向轮盘，用于控制角色的方向 */
@ccclass('DirectionWheel')
export class DirectionWheel extends Component {
  private _background: Node = null
  private _control: Node = null

  /** 轮盘的半径 */
  private _size: number = 60
  /** 轮盘半径的平方 */
  private _sizeSqr: number = 0
  /** 轮盘控制球的大小 */
  private _controlSize: number = 0.4
  /** 轮盘获取方向的频率 */
  private _frequency: number = 0.01
  /** 方向获取的频率，储存dt的时间累加 */
  private _controlFrequency: number = 0
  /** 鼠标首次放下的位置 */
  private _startLocation: Vec2 = null
  /** 轮盘背景色 */
  private _backgroundColor: Color = new Color(100, 100, 100)
  /** 轮盘控制球颜色 */
  private _controlColor: Color = new Color(255, 255, 255)
  /** 轮盘透明度，取值范围 0-1 */
  private _opacity: number = 0.2
  /** 如果用户只单击表示停止，该属性记录用户是否移动过鼠标 */
  private _isTouchMove: boolean = false
  /** 储存当前方向的向量 */
  out: Vec2 = new Vec2()

  /** 设置轮盘的大小 */
  setSize(value: number) {
    this._size = value
    this._sizeSqr = value ** 2
    this.drawCircle()
  }

  /** 设置轮盘控制球的大小，这是一个 <= 1 的数字，表示控制球的半径占轮盘的比例 */
  setControlSize(value: number) {
    this._controlSize = value
    this.drawCircle()
  }

  /** 设置轮盘获取方向的频率，单位为秒 */
  setFrequency(value: number) {
    this._frequency = value
  }

  /** 设置轮盘背景色 */
  setBackgroundColor(color: Color) {
    this._backgroundColor = color
    this.drawCircle()
  }

  /** 设置轮盘控制球颜色 */
  setControlColor(color: Color) {
    this._controlColor = color
    this.drawCircle()
  }

  /** 设置轮盘透明度，取值范围 0-1 */
  setOpacity(value: number) {
    this._opacity = value
    this._controlColor.a = 255 * value
    this._backgroundColor.a = 255 * value
    this.drawCircle()
  }

  start() {
    this._sizeSqr = this._size ** 2
    this._background = this.node.getChildByName('Backgroud')
    this._control = this.node.getChildByName('ControlBall')
    this._background.active = false
    this._control.active = false
    this._background.addComponent(Graphics)
    this._control.addComponent(Graphics)
    this.node.on(Input.EventType.TOUCH_START, this.onTouchStart, this)
    this.setOpacity(this._opacity)
    this.drawCircle()
  }

  onTouchStart(event: EventTouch) {
    this.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this.node.on(Input.EventType.TOUCH_END, this.onTouchCancel, this)
    this.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this)
    this._startLocation = event.getUILocation()
    this._background.active = true
    this._control.active = true
    this._background.setPosition(this._startLocation.x, this._startLocation.y)
    this._control.setPosition(this._startLocation.x, this._startLocation.y)
    this._isTouchMove = false
  }

  onTouchMove(event: EventTouch) {
    const direction = event.getUILocation().subtract(this._startLocation)
    // 长度限制在 0-1, 值向下取整，保留2位小数
    const length = Math.min(Math.floor(direction.lengthSqr() / this._sizeSqr * 100) / 100, 1)
    // 计算轮盘所指向的方向和控制球所处位置的比例
    const arg: TDirectionWheelUpdateParams = { direction: direction.normalize(), length }

    // 为了控制球表现得流畅，轮盘每一帧都很进行计算，但是事件得触发会受到频率限制
    if (this._controlFrequency > this._frequency) {
      // 向事件管理器发送方向轮盘更新事件
      eventTarget.emit(EVENT_TYPE.DIRECTION_WHEEL_UPDATE, arg)
      // 更新 _controlFrequency 使得下一次更新频率生效
      this._controlFrequency = 0
    }

    // 获取控制球的位置, 如果玩家手指位置超出控制球最大范围，则控制球位置为最大范围边缘线上，反之则为手指位置
    const controlPos = arg.length < 1 ? event.getUILocation() : calculateTargetPoint(this.out, arg.direction, this._size, this._startLocation)
    // 更新控制球的位置
    this._control.setPosition(controlPos.x, controlPos.y)
    this._isTouchMove = true
  }

  onTouchCancel() {
    this._background.active = false
    this._control.active = false
    this.node.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this.node.off(Input.EventType.TOUCH_END, this.onTouchCancel, this)
    this.node.off(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this)
    if (!this._isTouchMove) eventTarget.emit(EVENT_TYPE.DIRECTION_WHEEL_UPDATE, directionZero)
  }

  /** 使用 Graphics 绘制指定颜色的圆 */
  private drawCircle() {
    const bGraphics = this._background.getComponent(Graphics)
    const cGraphics = this._control.getComponent(Graphics)
    bGraphics.fillColor = this._backgroundColor
    bGraphics.circle(0, 0, this._size)
    bGraphics.fill()
    cGraphics.fillColor = this._controlColor
    cGraphics.circle(0, 0, this._size * this._controlSize)
    cGraphics.fill()
  }

  protected update(dt: number): void {
    this._controlFrequency += dt
  }
}