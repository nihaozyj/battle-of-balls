import { Component } from "cc"

/** 通过 await 等待异步函数执行完成的特性来实现延时的效果 */
async function delay(s: number, thisArg: Component = null) {
  return new Promise(resolve => {
    thisArg.scheduleOnce(() => resolve(null), s)
  })
}

export { delay }
