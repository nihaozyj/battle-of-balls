import { Node, Sprite, UITransform, Vec3 } from "cc"
import { mainSceneData } from "../runtime/main_scene_data"
import { lcgRandom } from "../util"

/** 一颗彩豆 */
export class Caidou {
  /** 彩豆节点 */
  node: Node
  /** 彩豆分数,吃菜豆获得的分数 */
  score: number = 1

  /** 获取彩豆位置 */
  get position() {
    return this.node.position
  }

  /** 设置彩豆位置 */
  setPosition(x: number, y: number) {
    if (x < 8) x = 8
    if (y < 8) y = 8
    if (x > mainSceneData.mapSize - 8) x = mainSceneData.mapSize - 8
    if (y > mainSceneData.mapSize - 8) y = mainSceneData.mapSize - 8
    this.node.setPosition(x, y)
  }

  /** 彩豆当前状态 */
  get active() {
    return this.node.active
  }

  /** 设置彩豆状态 */
  set active(active: boolean) {
    this.node.active = active
  }

  constructor() {
    this.node = new Node("caidou")
    const sprite = this.node.addComponent(Sprite)
    sprite.spriteFrame = mainSceneData.caidouFrames[lcgRandom.randomInt(0, mainSceneData.caidouFrames.length)]
    const uiTransform = this.node.addComponent(UITransform)
    uiTransform.setContentSize(16, 16)
    uiTransform.setAnchorPoint(0.5, 0.5)
    this.active = false
  }
}