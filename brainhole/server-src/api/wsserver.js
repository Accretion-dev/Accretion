function brainhole (ws, req) {
  ws.send(JSON.stringify({
    ok: true,
    user: req.user
  }))
  ws.on('message', (msg) => {
    ws.send(`get ${msg} from brainhole`)
  })
}

function echo (ws, req) {
  ws.send(JSON.stringify({
    ok: true,
    user: req.user
  }))
  ws.on('message', (msg) => {
    ws.send(msg)
  })
}

export default {
  echo,
  brainhole
}
