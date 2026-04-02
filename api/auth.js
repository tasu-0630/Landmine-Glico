module.exports = (req, res) => {
  const auth = req.headers.authorization

  const username = 'glico'
  const password = '2024'

  if (!auth) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"')
    return res.status(401).end('Authentication required.')
  }

  const [user, pwd] = Buffer.from(auth.split(' ')[1], 'base64')
    .toString()
    .split(':')

  if (user === username && pwd === password) {
    return res.status(200).end()
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"')
  return res.status(401).end('Authentication failed.')
}
