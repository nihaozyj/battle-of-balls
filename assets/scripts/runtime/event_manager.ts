import { EventTarget, Vec2 } from "cc"

/** 事件目标实例 */
const eventTarget = new EventTarget()

/** 轮盘方向事件所传递的参数类型 */
type TDirectionWheelUpdateParams = {
  /** 方向,已经归一化后的向量 */
  direction: Vec2
  /** 长度,取值范围[0,1]，该值表示当前轮盘控制球到(0,0)位置 / 轮盘半径的比例 */
  length: number
}

/** 事件类型 */
enum EVENT_TYPE {
  /** 方向轮盘事件，方向改变时触发，回调参数为 `(dwup: TDirectionWheelUpdateParams)` */
  DIRECTION_WHEEL_UPDATE = "direction_wheel_update",
  /** 资源和数据加载完毕时 */
  DATA_LOAD_COMPLETE = "data_load_complete",
  /** 玩家按下操作按钮时，回调参数为 `(active: '0' | '1' | '2')` 玩家按下的按钮分别有三种，分别是 ‘0’ 代表停止，‘1’ 代表吐球，‘2’ 代表分身 */
  PLAYER_ACTION = "player_action",
  /** 玩家吐一颗孢子, 触发该事件时先填写 `sporeParams` 参数数据 */
  PLAYER_THROW_BALL = "player_throw_ball",
}

export type { TDirectionWheelUpdateParams }

export { EVENT_TYPE, eventTarget }

