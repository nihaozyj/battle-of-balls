class GlobalData {
  /** start 场景是否第一次加载 */
  startSceneLoaded = true
}

/** 全局数据单例对象，用来存放跨场景的全局数据 */
const globalData = new GlobalData()

export { globalData }
