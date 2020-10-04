const socket = io()
const ping = new Howl({ src: '/src/ping.mp3' })
const me = getCookie('me')

document.getElementById('channel').value = 'lobby'

socket.on('channels', (channels) => {
  channels.forEach((channel) => {
    document.getElementById('channels').innerText += ' #' + channel
  })
})

socket.on('reset', () => {
  document.cookie = ''
  document.location.reload()
})

socket.on('message', (author, msg, log, raw, channel) => {
  console.log(author, msg, log, raw, channel)
  if (document.getElementById('channel').value !== channel) return
  if (!log && (raw + ' ').includes('@' + me + ' ')) ping.play()
  document.getElementById('output').innerHTML += document.getElementById('template').innerHTML.replace('{{ username }}', author).replace('{{ content }}', msg)
  document.getElementById('output').scrollTo(0, 99999)
})

document.getElementById('channel').addEventListener('keydown', () => {
  document.getElementById('output').innerHTML = ''
  socket.emit('loadmsg', document.getElementById('channel').value)
})

document.getElementById('input').addEventListener('keypress', (ev) => {
  if (ev.shiftKey) return
  if (ev.keyCode === 13) {
    ev.preventDefault()
    if (document.getElementById('input').value.length > 300) return alert('글자수는 300자를 넘을 수 없어요')
    socket.emit('message', getCookie('token'), document.getElementById('input').value, document.getElementById('channel').value)
    document.getElementById('input').value = ''
  }
})

function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}
