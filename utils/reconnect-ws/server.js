import EventEmitter from './event-emitter'
let WebSocketServer = require('ws').Server

class Subwss extends EventEmitter {
  constructor (configs, ...args) {
    super()
    this.subscribes = new Map()
    this.clients = []
    this.previous_clients = []
    let port = configs.port || 8181
    this.wss = new WebSocketServer({ port})
    this.wss.on('connection', ws => {
      console.log('client connected');
      /* response format
      {
        ok: true or false,
        msg: info message, if necessary,
        error: should have this if ok is false
        sequence: number of reply from server, remember to increate them in your message function
        req: the raw requests data (except for the 'data' key as there may be bulk data in it)
        res: the returning result data
      }
      */
      ws.sequence = 0
      ws.on('message', message => {
        try {
          message = JSON.parse(message)
        } catch (e) {
          ws.sequence += 1
          ws.send(JSON.stringify({ok: false, error: 'data must be json', sequence: ws.sequence}))
          return
        }
        console.log('server receive:', message)
        if (!ws._initData) {
          ws.sequence += 1
          ws._initData = message
          ws.send(JSON.stringify({
            id: message.id,
            sequence: ws.sequence,
            ok: true,
            message: 'init ok'
          }))
          return
        }
        // do subscribe
        if (message.command === 'subscribe') {
          if (!message.id) {
            ws.sequence += 1
            ws.send(JSON.stringify({
              ok: false,
              error: "must have id when subscribe",
              sequence: ws.sequence
            }))
            return
          }
          let id = message.id
          if (!this.listeners.has(id)) {
            ws.sequence += 1
            ws.send(JSON.stringify({
              ok: false,
              error: `can not subscribe ${id}, no callback`,
              sequence: ws.sequence
            }))
            return
          }
          if (!this.subscribes.has(id)) {
            this.subscribes.set(id, [ws])
          } else {
            this.subscribes.get(id).push(ws)
          }
          // do subscribe successfully

          // ws.subscribeCount record the number of message reply for this subscription
          if (!ws.subscribeCount) {
            ws.subscribeCount = {
              [id]: 1
            }
          } else {
            ws.subscribeCount[id] = 1
          }
          // config for each subscription
          if (!ws.subscribeConfigs) {
            ws.subscribeConfigs = {
              [id]: message.configs
            }
          } else {
            ws.subscribeConfigs[id] = message.configs
          }
          // return good message (MUST have, or it will cause a infinite reconnecting)
          ws.sequence += 1
          ws.send(JSON.stringify({
            ok: true,
            id,
            configs,
            subsequence: ws.subscribeCount[id],
            sequence: ws.sequence,
          }))
          console.log(`register a subscribe ${id} from `, ws._initData)
        }
      })
      this.clients.push(ws)
      ws.on('close', (code, reason) => {
        let index = this.clients.indexOf(ws)
        let last = this.clients.splice(index, 1)[0]
        this.previous_clients.push(last)
        // remove subscribe
        this.subscribes.forEach(array => {
          let index = array.indexOf(ws)
          array.splice(index, 1)
        })
        console.log('client closed', ws)
      })
      ws.on('error', event => {
        console.log('error', event)
      })
    })
  }
}

export default Subwss
