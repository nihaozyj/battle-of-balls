import { sys } from 'cc'

function loadFromLocalStorage(key: string): any {
  const data = sys.localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}

function saveToLocalStorage(key: string, value: any): void {
  sys.localStorage.setItem(key, JSON.stringify(value))
}

class DB {
  /** 玩家游戏中的名称 */
  playerName: string = ''
  /** 玩家游戏中前五的分数记录 */
  scoreboard: number[] = [0, 0, 0, 0, 0]
  /** 是否播放背景音乐 */
  isPlayBGAudio: boolean = true

  /** 更新分数 */
  updateScoreboard(score: number): void {
    this.scoreboard.push(score)
    this.scoreboard.sort((a, b) => b - a)
    this.scoreboard.splice(5)
  }
}

const _db = new DB()

// 初始化时从本地存储加载数据
const storedData = loadFromLocalStorage('db')
if (storedData) {
  Object.assign(_db, storedData)
}

/** DB实例的代理对象，用于监听属性变化并自动保存到本地存储 */
const dbProxy = new Proxy(_db, {
  set(target, prop, value, receiver) {
    const result = Reflect.set(target, prop, value, receiver)
    saveToLocalStorage('db', target)
    return result
  }
})

export { dbProxy as db }

