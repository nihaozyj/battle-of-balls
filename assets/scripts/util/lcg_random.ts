class LCG {
  private readonly a = 1664525
  private readonly c = 1013904223
  private readonly m = Math.pow(2, 32)
  private seed = 0

  constructor() { this.seed = Date.now() % this.m }

  /** 设置随机数种子 */
  setSeed(seed: number): void {
    this.seed = seed % this.m
  }

  /** 返回一个[0,1)之间的随机数 */
  next(): number {
    this.seed = (this.a * this.seed + this.c) % this.m
    return this.seed / this.m
  }

  /** 给定一个种子，返回一个随机数 */
  seedRandom(seed: number): number {
    this.setSeed(seed)
    return this.next()
  }

  /**
   * 生成指定范围内的随机整数
   * @param min 最小值
   * @param max 最大值
   * @returns 随机整数 [min, max)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min
  }
}

/** LCG随机数生成器 */
export const lcgRandom = new LCG()