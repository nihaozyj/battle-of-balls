import { _decorator, Component, director, EditBox, Node, ProgressBar, resources, SceneAsset } from 'cc'
import { mainSceneData } from '../runtime/main_scene_data'
import { randomName } from '../util/random_name'
const { ccclass, property } = _decorator

/**  */
@ccclass('StartUiManager')
export class StartUiManager extends Component {

  @property(Node) inputBox: Node = null
  @property(Node) startBtn: Node = null
  @property(Node) mainUINode: Node = null
  @property(Node) settingNode: Node = null
  @property(Node) settingBtn: Node = null
  @property(Node) rankingsBtn: Node = null

  start() {
    this.inputBox.getComponent(EditBox).string = localStorage.name = mainSceneData.playerName = (
      localStorage.name || randomName()
    )
    // 提前加载场景资源，避免切换场景时卡顿
    const sceneAssetPromise = new Promise<SceneAsset>((resolve, reject) => resources.loadScene('scenes/main', (err, sceneAsset) => {
      err ? reject(err) : resolve(sceneAsset)
    }))

    localStorage.isPlayBGAudio === 'true' && mainSceneData.audioSourceBackground.play()

    this.startBtn.once('click', () => this.switchScene(sceneAssetPromise))
    this.settingBtn.on('click', () => this.settingNode.active = true)
    this.rankingsBtn.on('click', () => { })
  }

  /** 切换场景 */
  switchScene(sceneAssetPromise: Promise<SceneAsset>) {
    const pname = this.inputBox.getComponent(EditBox).string.replace(/\s+/g, '')
    this.inputBox.getComponent(EditBox).string = localStorage.name = mainSceneData.playerName = (
      pname.length ? pname : localStorage.name || randomName()
    )
    sceneAssetPromise.then(sceneAsset => director.runScene(sceneAsset)).catch(err => console.error(err))
  }
}

