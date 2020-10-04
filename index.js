const PORT = process.env.port || 8080

const uuid = require('uuid').v4
const sha256 = require('sha256')
const express = require('express')
const socketIO = require('socket.io')
const path = require('path').resolve()
const { createServer } = require('http')
const { Converter } = require('showdown')
const { get, post } = require('superagent')
const cookieParser = require('cookie-parser')
const { client_id, client_secret } = require('./config.json').github
const db = require('knex')({ client: 'mysql', connection: { host: 'localhost', port: 3306, user: 'dever', database: 'dever' } })

const converter = new Converter({
  simplifiedAutoLink: true,
  simpleLineBreaks: true,
  ghMentions: true, emoji: true,
  tasklists: true, tables: true,
  strikethrough: true, parseImgDimensions: true
})

const app = express()
const srv = createServer(app)
const socketio = socketIO(srv)

const tokenList = []
const msglog = []

app.use(cookieParser())
app.get('/login/github', async (req, res, _) => {
  if (!req.query.code) return res.redirect('https://github.com/login/oauth/authorize?scope=read:user&client_id=' + client_id)
  const resp = await post('https://github.com/login/oauth/access_token?client_id=' + client_id + '&client_secret=' + client_secret + '&code=' + req.query.code).set('Accept', 'application/json')
  const acctoken = resp.body.access_token
  
  const user = (await get('https://api.github.com/user').set('user-agent', 'Dever v1').set('Authorization', 'token ' + acctoken)).body
  if (!user) return

  const token = uuid()
  tokenList.push({ token, uname: user.login })
  return res.cookie('me', user.login).cookie('token', token).redirect('/')
})

app.use((req, res, next) => {
  if (req.path !== '/login.html' && !tokenList.find((v) => v.token === req.cookies.token))
    return res.redirect('/login.html')

  next()
})
app.use(express.static(path + '/page'))
srv.listen(PORT, () => console.log('Dever server is now on http://localhost:' + PORT))

socketio.on('connect', (socket) => {
  msglog.forEach((msg) => {
    socket.emit('message', ...msg, true)
  })

  socket.on('message', (token, raw) => {
    const user = tokenList.find((t) => t.token === token)
    if (!user) return socket.emit('reset')
    if (!raw) return
    if (raw.length > 100) return

    raw = escapeOutput(raw)
    const msg = converter.makeHtml(raw)

    socketio.emit('message', user.uname, msg, false, raw)
    msglog.push([user.uname, msg])
  })

  socket.on('login', async (query) => {
    const [user] = await db.select('*').where('uname', query.uname).from('users')
    if (!user) return socket.emit('login', { success: true, regist: true })
    if (user.upasswd !== sha256(query.upasswd)) return socket.emit('login', { success: false })

    const token = uuid()
    tokenList.push({ token, uname: user.uname })
    return socket.emit('login', { success: true, regist: false, token })
  })

  socket.on('regist', async (query) => {
    await db.insert({ uid: uuid(), uname: query.uname, upasswd: sha256(query.upasswd) }).from('users')

    const token = uuid()
    tokenList.push({ token, uname: query.uname })
    return socket.emit('login', { success: true, regist: false, token })
  })
})

function escapeOutput(toOutput){
  return toOutput.replace(/\&/g, '&amp;')
    .replace(/\</g, '&lt;')
    .replace(/\>/g, '&gt;')
    .replace(/\"/g, '&quot;')
}
