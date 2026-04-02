export default function handler(req, res) {
  res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"')
  return res.status(401).send('Authentication required.')
}
