import Suwss from '../server.js'

let wss = new Suwss({port: 8181})
global.wss = wss
let name

// must use function () {} instead of () => {}
wss.on('echo0', function (data) {
  let name = 'echo0'
  let that = wss
  let id = name
  console.log(`on ${name}:`, data)
  let subscribes = that.subscribes.get(id)
  if (!subscribes) return
  subscribes.forEach(ws => {
    ws.sequence += 1
    ws.subscribeCount[id] += 1
    let configs = ws.subscribeConfigs[id]
    ws.send(JSON.stringify({
      ok: true,
      sequence: ws.sequence,
      subsequence: ws.subscribeCount[id],
      configs,
      id,
      res: data
    }))
  })
})

wss.on('echo1', function (data) {
  let name = 'echo1'
  let that = wss
  let id = name
  console.log(`on ${name}:`, data)
  let subscribes = that.subscribes.get(id)
  if (!subscribes) return
  subscribes.forEach(ws => {
    ws.sequence += 1
    ws.subscribeCount[id] += 1
    let configs = ws.subscribeConfigs[id]
    ws.send(JSON.stringify({
      ok: true,
      sequence: ws.sequence,
      subsequence: ws.subscribeCount[id],
      configs,
      id,
      res: data
    }))
  })
})
