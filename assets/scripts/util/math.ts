/** 两个数相等的容差 */
const EPSILON = 0.0000001

/** 比较两个数是否相等 */
function numEquals(a: number, b: number): boolean {
  return Math.abs(a - b) < EPSILON
}

export { numEquals }