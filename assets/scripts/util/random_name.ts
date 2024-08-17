import { lcgRandom } from "./lcg_random"

const names = [
  '可恶得坏蛋', '小白兔爱吃糖', '优雅得熊猫', '稳重得大树', '美丽得蝴蝶', '可爱得小狗', '可怕得老虎', '无敌的小兔子', '猫咪爱吃鱼',
  '萌萌的小熊', '调皮的小猴子', '甜甜的小蜜蜂', '快乐的小松鼠', '淘气的小狐狸', '温柔的小绵羊', '勇敢的小狮子', '聪明的小乌龟', '活泼的小鹿'
]

/** 随机生成一个名字 */
function randomName() {
  const index = lcgRandom.randomInt(0, names.length - 1)
  return names[index]
}

export { randomName }
