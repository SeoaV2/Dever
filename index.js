const path = require('path').resolve()
const { createServer } = require('http')
const express = require('express')
const socketIO = require('socket.io')

const app = express()
const srv = createServer(app)
const socketio = socketIO(srv)

app.use('/', express.static(path + '/page'))
srv.listen(8080)

socketio.on('connect', (socket) => {
  socket.on('message', (msg) => {
    socketio.emit('message', socket.handshake.address + ': ' + msg)
  })
})
