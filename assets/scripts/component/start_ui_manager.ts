import { _decorator, Component, director, EditBox, Node, ProgressBar, resources } from 'cc'
import { globalData } from '../runtime'
import { mainSceneData } from '../runtime/main_scene_data'
import { randomName } from '../util/random_name'
import { lcgRandom } from '../util'
import { delay } from '../util/others'
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

  // mainScene: SceneAsset = null

  start() {
    if (localStorage.name) {
      mainSceneData.playerName = localStorage.name
    } else {
      mainSceneData.playerName = randomName()
    }

    localStorage.name = mainSceneData.playerName
    this.inputBox.getComponent(EditBox).string = mainSceneData.playerName

    this.startBtn.once('click', () => {
      const pname = this.inputBox.getComponent(EditBox).string.replace(/\s+/g, '')
      if (pname.length > 0) {
        localStorage.name = mainSceneData.playerName = pname
        this.inputBox.getComponent(EditBox).string = pname
      } else {
        return this.inputBox.getComponent(EditBox).string = localStorage.name
      }
      resources.loadScene('scenes/main', (err, sceneAsset) => {
        if (err) {
          console.error(err)
        } else {
          director.runScene(sceneAsset)
        }
      })
    })

    this.settingBtn.on('click', () => {
      this.settingNode.active = true
    })

    this.rankingsBtn.on('click', () => {

    })

    if (localStorage.isPlayBGAudio) {
      localStorage.isPlayBGAudio === 'true' && mainSceneData.audioSourceBackground.play()
    }
  }

}
