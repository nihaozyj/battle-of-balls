import { Color, Rect, Vec2, v2 } from "cc"
import Ball from "../model/ball"
import { mainSceneData } from "../runtime/main_scene_data"
import { lcgRandom } from "./lcg_random"

/** 执行一个函数并且返回一个结果,用来执行匿名函数 */
const executeFunc = (fun: Function) => fun()

/** 
 * 通过已知的方向、距离和原点，计算出目标点坐标 
 * @param direction 已经归一化的方向向量
 * @param distance 在方向上的投影长度
 * @param origin 原点
 */
const calculateTargetPoint: (out: Vec2, direction: Vec2, distance: number, origin: Vec2) => Vec2 = executeFunc(function () {
  // 使用闭包的方式来声明一个临时变量
  const targetVec2 = new Vec2()
  // 返回所需的函数
  return function (out: Vec2, direction: Vec2, distance: number, origin: Vec2): Vec2 {
    // 获得带长度的向量
    Vec2.multiplyScalar(targetVec2, direction, distance)
    // 向量相加获取目标点
    return Vec2.add(out, origin, targetVec2)
  }
})

/** 生成一种随机的颜色 */
function randomColor(): Color {
  const r = Math.floor(lcgRandom.randomInt(0, 256))
  const g = Math.floor(lcgRandom.randomInt(0, 256))
  const b = Math.floor(lcgRandom.randomInt(0, 256))
  return new Color(r, g, b)
}

/** 通过球体的分数计算球体半径 */
const calculateBallRadius: (score: number) => number = executeFunc(function () {
  // 维护一个字典，计算之前先查字典后计算
  const cache = Object.create(null)
  return function (score: number): number {
    // 球体越大压迫感越大，1500分为一个阶段，每个阶段增加一倍的半径 (score / 1500 + 1)
    //分数越大，半径的加成越大，无上限，可以使视觉效果更好，因为分数的增加不会因为球体越大而使分数增加的更快，因此调整体积比例
    return cache[score] || Math.floor(cache[score] = mainSceneData.minRadius + Math.sqrt(score) * 3)
    // return cache[score_5] || Math.floor(cache[score_5] = mainSceneData.minRadius + score / 20)
  }
})

/** 将回调函数执行固定次数 */
function executeCallback(count: number, callback: (index?: number) => void): void {
  for (let i = 0; i < count; i++) {
    callback(i)
  }
}

/** 
 * 获取多个球的外切矩形的中心点和大小，用于计算摄像机的位置
 * 该方法用于计算多个球体的外切矩形的中心点，其中包含了球体大小对中心点的影响
 */
const getCircleRectCenter: (out: Rect, balls: Ball[]) => Rect = executeFunc(function () {
  const lb = v2(), rt = v2()
  return function (out: Rect, balls: Ball[]): Rect {
    if (balls.length === 0) return out

    lb.set(balls[0].position.x - balls[0].radius, balls[0].position.y + balls[0].radius)
    rt.set(balls[0].position.x + balls[0].radius, balls[0].position.y + balls[0].radius)

    balls.forEach(ball => {
      if (ball.position.x - ball.radius < lb.x) lb.x = ball.position.x - ball.radius
      if (ball.position.y - ball.radius < lb.y) lb.y = ball.position.y - ball.radius
      if (ball.position.x + ball.radius > rt.x) rt.x = ball.position.x + ball.radius
      if (ball.position.y + ball.radius > rt.y) rt.y = ball.position.y + ball.radius
    })
    return out.set((lb.x + rt.x) / 2, (lb.y + rt.y) / 2, (rt.x - lb.x), (rt.y - lb.y))
  }
})

/**
 * 获取多个球体组成多边形后的中心点，用来计算中心点的位置，该计算可能不够准确，但是性能好
 */
const getPolygonCenter: (out: Vec2, balls: Ball[]) => void = executeFunc(function () {
  const center = v2()
  return function (out: Vec2, balls: Ball[]): void {
    center.set(0, 0)
    if (balls.length === 0) return
    balls.forEach(ball => {
      center.x += ball.position.x
      center.y += ball.position.y
    })
    center.x /= balls.length
    center.y /= balls.length
    out.set(center.x, center.y)
  }
})

export {
  calculateBallRadius, calculateTargetPoint, executeCallback, executeFunc, getCircleRectCenter,
  getPolygonCenter, lcgRandom, randomColor
}
