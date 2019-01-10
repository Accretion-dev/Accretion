import Rews from '../index.js'

let ws = new Rews({
  reconnectTime: 5,
  name:'test-ws',
  reconnectMaxCount: 20,
  }, 'ws://127.0.0.1:8181')
global.ws = ws

ws.wson('open', async event => {
  //ws.send('bad data') // test bad data
  await ws.init({
    id: 'init',
    "client-name": ws.name,
    "client-type": 'test client',
  })
  ws.subscribe([
    {id: 'echo0', command: 'subscribe', configs: {from: 'echo0'}},
    {id: 'echo1', command: 'subscribe', configs: {from: 'echo1'}},
  ])
})

ws.wson('message', data => {
  console.log(`client ${ws.name} receive: `, JSON.parse(data.data))
})
