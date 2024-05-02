class GlobalData {
  private static _instance: GlobalData = null

  /** 获取全局数据的唯一单例 */
  static getInstance(): GlobalData {
    if (!GlobalData._instance) GlobalData._instance = new GlobalData()
    return GlobalData._instance
  }
}

/** 全局数据单例对象，用来存放跨场景的全局数据 */
const globalData = GlobalData.getInstance()

export { globalData }