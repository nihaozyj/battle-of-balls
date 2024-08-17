import { _decorator, Component, director, Node } from 'cc'
import { mainSceneData } from '../runtime/main_scene_data'
import { LoadingCtrl } from '../../prefabs/scripts/loading_ctrl'
const { ccclass, property } = _decorator

/**  */
@ccclass('LoadingSceneCtrl')
export class LoadingSceneCtrl extends Component {

  @property(Node) loadingNode: Node = null

  async start() {
    await mainSceneData.init()
    this.loadingNode.getComponent(LoadingCtrl).close(() => director.loadScene('start'))
  }
}
