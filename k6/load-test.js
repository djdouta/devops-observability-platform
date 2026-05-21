import http from 'k6/http'
import { sleep } from 'k6'

export const options = {
  vus: 10,
  duration: '30s',
}

export default function () {
  const routes = ['/orders', '/login', '/logout', '/shop', '/checkout']

  const route = routes[Math.floor(Math.random() * routes.length)]

  http.get(`http://node-app:3000${route}`)

  sleep(1)
}
