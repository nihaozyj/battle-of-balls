import { _decorator, Component, director, EditBox, Node, ProgressBar, resources, SceneAsset } from 'cc'
import { mainSceneData } from '../runtime/main_scene_data'
import { randomName } from '../util/random_name'
import { db } from '../runtime/db'
import { PopupsCtrl } from '../../prefabs/scripts/popups_ctrl'
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
  @property(Node) aboutBtn: Node = null

  @property(Node) popSettingNode: Node = null
  @property(Node) popAboutNode: Node = null
  @property(Node) popRankingsNode: Node = null

  popByRankingList: PopupsCtrl = null
  popByAbout: PopupsCtrl = null
  popBySetting: PopupsCtrl = null

  start() {
    this.inputBox.getComponent(EditBox).string = db.playerName = db.playerName || randomName()
    // 提前加载场景资源，避免切换场景时卡顿
    const sceneAssetPromise = new Promise<SceneAsset>((resolve, reject) => {
      resources.loadScene('scenes/main', (err, sceneAsset) => err ? reject(err) : resolve(sceneAsset))
    })

    db.isPlayBGAudio && mainSceneData.audioSourceBackground.play()

    this.popByRankingList = this.popRankingsNode.getComponent(PopupsCtrl)
    this.popByAbout = this.popAboutNode.getComponent(PopupsCtrl)
    this.popBySetting = this.popSettingNode.getComponent(PopupsCtrl)

    this.startBtn.once('click', () => this.switchScene(sceneAssetPromise))
    this.settingBtn.on('click', () => this.popBySetting.show())
    this.rankingsBtn.on('click', () => this.popByRankingList.show())
    this.aboutBtn.on('click', () => this.popByAbout.show())

  }

  /** 切换场景 */
  switchScene(sceneAssetPromise: Promise<SceneAsset>) {
    const pname = this.inputBox.getComponent(EditBox).string.replace(/\s+/g, '')
    this.inputBox.getComponent(EditBox).string = db.playerName = pname.length ? pname : db.playerName
    sceneAssetPromise.then(sceneAsset => director.runScene(sceneAsset)).catch(err => console.error(err))
  }
}

