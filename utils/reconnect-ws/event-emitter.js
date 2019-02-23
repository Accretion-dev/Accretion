// simple event emitter that can be use in both js and node
class EventEmitter {
  constructor () {
    this.listeners = new Map()
  }
  on (label, callback) {
    this.listeners.has(label) || this.listeners.set(label, [])
    this.listeners.get(label).push(callback)
  }
  list (label) {
    return this.listeners.get(label)
  }
  off (label, callback) {
    let index = -1
    let functions = this.listeners.get(label) || []
    functions.some(item => {
      if (item === callback) {
        return true
      } else {
        return false
      }
    })
    if (index > -1) {
      return functions.splice(index, 1)
    } else {
      return false
    }
  }
  emit (label, ...args) {
    let listeners = this.listeners.get(label)
    if (listeners && listeners.length) {
      listeners.forEach((listener) => {
        listener(...args)
      })
      return true
    }
    return false
  }
}

export default EventEmitter
