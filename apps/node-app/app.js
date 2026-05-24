import express from 'express'
import client from 'prom-client'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const register = new client.Registry()

// Métricas por defecto (CPU, memoria, etc.)
client.collectDefaultMetrics({ register })

function log(level, event, extra = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...extra,
  }

  console.log(JSON.stringify(logEntry))
}
// Counter: total de requests
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de requests',
  labelNames: ['method', 'route', 'status'],
})

const ordersCreated = new client.Counter({
  name: 'orders_created_total',
  help: 'Total de órdenes creadas',
})

const ordersFailed = new client.Counter({
  name: 'orders_failed_total',
  help: 'Total de órdenes fallidas',
})

const loginFailures = new client.Counter({
  name: 'login_failures_total',
  help: 'Total de intentos de login fallidos',
})

// Histogram: duración
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de requests en segundos',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
})

const checkoutDuration = new client.Histogram({
  name: 'checkout_duration_seconds',
  help: 'Tiempo de respuesta del checkout',
  buckets: [0.1, 0.3, 0.5, 1, 2, 5], // rangos en segundos
})
//Gauge: usuarios online

const usersOnline = new client.Gauge({
  name: 'users_online',
  help: 'Usuarios conectados actualmente',
})
//register de métricas
register.registerMetric(httpRequestsTotal)
register.registerMetric(httpRequestDuration)
register.registerMetric(ordersCreated)
register.registerMetric(ordersFailed)
register.registerMetric(loginFailures)
register.registerMetric(usersOnline)
register.registerMetric(checkoutDuration)

// Middleware de métricas
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer()

  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: req.path,
      status: res.statusCode,
    }

    httpRequestsTotal.inc(labels)
    end(labels)
  })

  next()
})

// Middleware de correlación
app.use((req, res, next) => {
  req.correlationId = uuidv4()
  res.setHeader('X-Correlation-ID', req.correlationId)
  next()
})

app.use((req, res, next) => {
  const start = Date.now()
  req.correlationId = uuidv4()

  res.on('finish', () => {
    const duration = Date.now() - start
    const isError = res.statusCode >= 400

    log(isError ? 'error' : 'info', 'request_completed', {
      correlationId: req.correlationId,
      method: req.method,
      route: req.path,
      status: res.statusCode,
      duration,
    })
  })

  next()
})

// Endpoints
app.get('/shop', (req, res) => {
  log('info', 'request_start', {
    correlationId: req.correlationId,
    method: req.method,
    route: req.path,
  })

  setTimeout(() => {
    res.status(200).json({ ordern: [] })
  }, Math.random() * 800)
})

app.get('/checkout', (req, res) => {
  const end = checkoutDuration.startTimer()
  log('info', 'request_start', {
    correlationId: req.correlationId,
    method: req.method,
    route: req.path,
  })

  setTimeout(() => {
    res.status(200).json({ ordern: [] })
  }, Math.random() * 800)
  end()
})

app.get('/login', (req, res) => {
  log('info', 'request_start', {
    correlationId: req.correlationId,
    method: req.method,
    route: req.path,
  })
  const random = Math.random()
  // 10% error
  if (random < 0.1) {
    loginFailures.inc()
    res.status(500).send('Internal error')
  } else {
    usersOnline.inc() // cuando entra un usuario
    res.status(200).send({ login: 'success' })
  }
})

app.get('/logout', (req, res) => {
  const random = Math.random()

  log('info', 'request_start', {
    correlationId: req.correlationId,
    method: req.method,
    route: req.path,
  })

  if (random < 0.5) {
    usersOnline.dec() // cuando sale un usuario

    return res.status(200).json({
      message: 'User logged out',
    })
  } else {
    return res.status(401).json({
      message: 'User already logged out',
    })
  }
})

app.get('/orders', async (req, res) => {
  log('info', 'request_start', {
    correlationId: req.correlationId,
    method: req.method,
    route: req.path,
  })

  const random = Math.random()
  // 10% error
  if (random < 0.1) {
    ordersFailed.inc()
    return res.status(500).send('Internal error')
  } else {
    ordersCreated.inc()
  }

  // 30% lento
  if (random < 0.4) {
    await new Promise((r) => setTimeout(r, 800))
  }

  res.json({ orders: [] })
})

// Endpoint de métricas
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

app.listen(3000, () => {
  console.log('Server corriendo en puerto 3000')
})
