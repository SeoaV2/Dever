const socket = io()

function login () {
  document.cookie = ''
  if (!document.getElementById('uname').value || !document.getElementById('upasswd').value)
    alert('아이디와 비밀번호를 입력해 주세요')

  const query = { uname: document.getElementById('uname').value, upasswd: document.getElementById('upasswd').value }
  socket.emit('login', query)
  socket.on('login', (res) => {
    if (!res.success) return alert('아이디 혹은 비밀번호가 틀렸어요!')
    if (res.regist) {
      const cfm = confirm('없는 아이디입니다!\n새로운 계정을 만들까요?')
      if (cfm) socket.emit('regist', query)
      return
    }
    
    document.cookie = 'token=' + res.token
    document.cookie = 'me=' + document.getElementById('uname').value
    window.location.assign('/')
  })

  return false
}
