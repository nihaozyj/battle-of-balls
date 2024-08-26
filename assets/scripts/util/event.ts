import { EventTouch, Node } from 'cc'

/** 阻止节点事件冒泡 */
function util_stopNodeEventBubbling(node: Node) {
  const callback = (event: EventTouch) => event.propagationStopped = true
  node.on(Node.EventType.TOUCH_START, callback, node)
  node.on(Node.EventType.TOUCH_END, callback, node)
  node.on(Node.EventType.TOUCH_CANCEL, callback, node)
  node.on(Node.EventType.TOUCH_MOVE, callback, node)
}

export { util_stopNodeEventBubbling }