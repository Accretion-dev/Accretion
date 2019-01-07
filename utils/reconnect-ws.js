const isNode=new Function("try {return this===global;}catch(e){return false;}");

if (isNode()) {
  global.WebSocket = require('ws')
  global.Promise = require('promise')
}

// function oneOffWsPromise ({url, data}) {
//   return new Promise((resolve, reject) => {
//     var server = new WebSocket(url)
//     server.onopen = () => {
//       server.send(JSON.stringify(data))
//     }
//     server.onmessage = (message) => {
//       let data = JSON.parse(message.data)
//       server.close()
//       resolve(data)
//     }
//     server.onerror = (error) => {
//       reject(error)
//     }
//   })
// }
// function reuseWSbyIDPromise ({ws, data}) {
//   // must have the id parameter
//   return new Promise((resolve, reject) => {
//     let id = data.id
//     let callback = (event) => {
//       let data = JSON.parse(event.data)
//       if (data.id === id) {
//         ws.removeEventListener('message', callback)
//         resolve(data)
//       }
//     }
//     ws.addEventListener('message', callback)
//     if (ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify(data))
//     } else {
//       let callback = () => {
//         ws.send(JSON.stringify(data))
//         ws.removeEventListener('open', callback)
//       }
//       ws.addEventListener('open', callback)
//     }
//   })
// }
function Sleep (time) {
  let start, end
  start = new Date()
  while (true) {
    end = new Date()
    if (end - start > time) {
      break
    }
  }
  // console.log('sleep ', end - start)
}

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

class ReWebSocket extends EventEmitter {
  constructor (configs, ...args) {
    super()
    this.reconnectMaxCount = configs.reconnectMaxCount === undefined ? 5 : configs.reconnectMaxCount
    this.reconnectTotalMaxCount = configs.reconnectTotalMaxCount === undefined ? 50 : configs.reconnectTotalMaxCount
    this.reconnectTime = configs.reconnectTime || 2
    this.reconnectDelay = configs.reconnectDelay || 0
    this.name = configs.name || ''
    this.forceReconnect = configs.forceReconnect || false
    this._reconnectCount = 0
    this._reconnectTotalCount = 0
    this.subscribe_history = []
    this.raise = configs.raise === undefined ? true : configs.raise === undefined
    // badRate = {time: 600, maxCount: 3}
    this.badRate = configs.badRate
    this.startTime = new Date()
    this.reconnect_history = []
    // on open
    this._onopens = []
    this._onopen = event => {
      if (this._reconnectCount > 0) {
        if (this.subscribe_history) {
          console.info(`${this.name} reconnect ${this.url} successfully!! redo subscribe`, this.subscribe_history, `reconnectMaxCount: ${configs.reconnectMaxCount}`)
          let reconnectCount = this._reconnectCount
          this._subscribe_do()
          setTimeout(() => {
            if (this.ws.subscribe_list_wait.length !== 0) {
              this._reconnectCount = reconnectCount
              this.ws.close()
            }
          }, this.reconnectTime * 1000 + this.reconnectDelay)
        } else {
          console.info(`${this.name} reconnect ${this.url} successfully!!`)
        }
        this._reconnectCount = 0
      }
      if (this._onopens.length) {
        for (let eachCallback of this._onopens) {
          eachCallback(event)
        }
      }
    }
    // on close
    this._oncloses = []
    this._onclose = event => {
      this.ws._meetclose = true
      if (this.forceReconnect || !event.reason) {
        if (!this.ws._meeterror) {
          this._reconnect(event)
        }
      } else {
        console.log(`${this.name}: ${this.url} normal close because`, event.reason)
      }
      if (this._oncloses.length) {
        for (let eachCallback of this._oncloses) {
          eachCallback(event)
        }
      }
    }
    // on error
    this._onerrors = []
    this._onerror = event => {
      this.ws._meeterror = true
      if (!this.ws._meetclose) {
        this._reconnect(event)
      }
      if (this._onerrors.length) {
        for (let eachCallback of this._onerrors) {
          eachCallback(event)
        }
      }
    }
    // on message
    this._onmessages = []
    this._onmessage = event => {
      if (this._onmessages.length) {
        for (let eachCallback of this._onmessages) {
          eachCallback(event)
        }
      }
    }

    this.args = args
    this.ws = new WebSocket(...args)
    this.ws.__rews__ = this.name
    this._config()
    this.url = this.ws.url
  }
  _config () {
    this.ws.onopen = this._onopen
    this.ws.onclose = this._onclose
    this.ws.onerror = this._onerror
    this.ws.onmessage = this._onmessage
    this.ws._meeterror = false
    this.ws._meetclose = false
    this.ws.subscribe_list = []
    this.ws.subscribe_list_wait = []
  }
  _reconnect (event) {
    // console.error(event)
    if (this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
      this._reconnectTotalCount += 1
      console.log(`${this.name}  reconnecting ${this.url} tries: ${this._reconnectCount}|${this.reconnectMaxCount}, total tries: ${this._reconnectTotalCount}|${this.reconnectTotalMaxCount}`)
      if (this._reconnectCount < this.reconnectMaxCount && this._reconnectTotalCount < this.reconnectTotalMaxCount) {
        setTimeout(() => {
          // console.log(this._onopen, this._onclose, this._onerror, this._onmessage)
          this.reconnect_history.push(new Date())
          this._reconnectCount += 1
          this.ws = new WebSocket(...this.args)
          this.ws.__rews__ = this.name
          this._config()
        }, this.reconnectTime * 1000)
      } else {
        if (this.raise) {
          throw Error(`${this.name}  Max reconnect number reached for ${this.url}! with single:${this._reconnectCount}, total: ${this._reconnectTotalCount}`)
        } else {
          console.error(`${this.name}  Max reconnect number reached for ${this.url}!`)
        }
      }
    } else {
      console.error('should not be here', this.ws.readyState, this.ws)
    }
  }
  wson (name, callback, add) {
    switch (name) {
      case 'message':
        if (add) {
          this._onmessages.push(callback)
        } else {
          this._onmessages = [callback]
        }
        break
      case 'error':
        if (add) {
          this._onerrors.push(callback)
        } else {
          this._onerrors = [callback]
        }
        break
      case 'close':
        if (add) {
          this._oncloses.push(callback)
        } else {
          this._oncloses = [callback]
        }
        break
      case 'open':
        if (add) {
          this._onopens.push(callback)
        } else {
          this._onopens = [callback]
        }
        break
      default:
        throw Error(`only support message, close and open event, not ${name}`)
    }
  }
  wsoff (name, callback) {
    switch (name) {
      case 'message':
        if (callback) {
          if (this._onmessages.includes(callback)) {
            this._onmessages.splice(this._onmessages.indexOf(callback), 1)
          }
        } else {
          this._onmessages = []
        }
        break
      case 'close':
        if (callback) {
          if (this._oncloses.includes(callback)) {
            this._oncloses.splice(this._oncloses.indexOf(callback), 1)
          }
        } else {
          this._oncloses = []
        }
        break
      case 'open':
        if (callback) {
          if (this._onopens.includes(callback)) {
            this._onopens.splice(this._onopens.indexOf(callback), 1)
          }
        } else {
          this._onopens = []
        }
        break
      case 'error':
        if (callback) {
          if (this._onerrors.includes(callback)) {
            this._onerrors.splice(this._onerrors.indexOf(callback), 1)
          }
        } else {
          this._onerrors = []
        }
        break
    }
  }
  _subscribe_do (resolve, reject, wsoff) {
    this.subscribe_message_data = {}
    this.subscribe_history.forEach(item => {
      let id = item.id
      if (!this.ws.subscribe_list_wait.includes(id)) {
        this.ws.subscribe_list_wait.push(id)
        try {
          this.ws.send(JSON.stringify(item))
        } catch (error) {
          console.log(item)
          console.error('rews send subscribe error', error)
          this.ws.close()
          // throw error
        }
      }
    })
    if (this.ws.subscribe_list_wait.length) {
      let callback = event => {
        // console.log('one time request', event)
        let data = JSON.parse(event.data)
        if (this.ws.subscribe_list_wait.includes(data.id)) { // finish one
          let index = this.ws.subscribe_list_wait.indexOf(data.id)
          this.ws.subscribe_list_wait.splice(index, 1)
          this.ws.subscribe_list.push(data.id)
          this.subscribe_message_data[data.id] = data
          if (this.ws.subscribe_list_wait.length === 0) {
            this.ws.onmessage = this._onmessage
            console.log(`subscribe successfully!`, this.subscribe_history.map(o => o.id), this.name)
            if (wsoff) {
              this.wsoff('open', wsoff)
            }
            if (resolve) {
              resolve(this.subscribe_message_data)
            }
          }
        }
      }
      this.ws.onmessage = callback
    } else {
      if (wsoff) {
        this.wsoff('open', wsoff)
      }
      if (resolve) {
        resolve({})
      }
    }
  }
  subscribe (data) {
    this.subscribe_history.push(data)
    if (this.ws.readyState === WebSocket.OPEN) {
      return new Promise((resolve, reject) => {
        this._subscribe_do(resolve, reject)
      })
    } else {
      return new Promise((resolve, reject) => {
        let callback = (event) => {
          this._subscribe_do(resolve, reject, callback)
        }
        this.wson('open', callback, true)
      })
    }
  }
  send (data) {
    try {
      this.ws.send(data)
    } catch (error) {
      console.log(data)
      console.error('rews send error', error)
      throw error
    }
  }
  promised (data) {
    return new Promise((resolve, reject) => {
      let id = data.id
      let callback = (event) => {
        let data = JSON.parse(event.data)
        if (data.id === id) {
          this.ws.onmessage = this._onmessage
          resolve(data)
        }
      }
      this.ws.onmessage = callback
      if (this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify(data))
        } catch (error) {
          console.error('send error!', error)
        }
      } else {
        let callback = () => {
          try {
            this.ws.send(JSON.stringify(data))
          } catch (error) {
            console.error('send error!', error)
          }
          this.ws.open = this._onopen
        }
        this.ws.onopen = callback
      }
    })
  }
  static onePromise ({url, data, sleep, config}) {
    return new Promise((resolve, reject) => {
      let callback = () => {
        let timeout = config && config.timeout
        let now = new Date()
        let server = new WebSocket(url)
        let timer
        let timeoutError = false
        if (timeout) {
          timer = setTimeout(() => {
            timeoutError = true
            server.close()
            reject(new Error(`timeout ${timeout}`))
          }, timeout * 1000)
        }
        server.onopen = () => {
          // clearTimeout(timer)
          try {
            server.send(JSON.stringify(data))
          } catch (error) {
            console.log(data)
            console.error('one promise send error', error)
            server.close()
            reject(error)
          }
        }
        server.onmessage = (message) => {
          clearTimeout(timer)
          let data = JSON.parse(message.data)
          server.close()
          resolve(data)
        }
        server.onerror = (error) => {
          if (!timeoutError) {
            clearTimeout(timer)
            server.close()
            reject(error)
          }
        }
      }
      if (sleep) {
        setTimeout(callback, sleep)
      } else {
        callback()
      }
    })
  }
}

export default ReWebSocket
