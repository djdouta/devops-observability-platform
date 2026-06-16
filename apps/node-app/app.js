import express from 'express'
import client from 'prom-client'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const register = new client.Registry()

// Métricas por defecto (CPU, memoria, etc.)
client.collectDefaultMetrics({ register })

// ✅ MEJORADO: Logging estructurado
function log(level, event, extra = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...extra,
  }

  console.log(JSON.stringify(logEntry))
}

// ============ MÉTRICAS ============

// Counter: total de requests
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
})

const ordersCreated = new client.Counter({
  name: 'orders_created_total',
  help: 'Total de órdenes creadas',
  registers: [register],
})

const ordersFailed = new client.Counter({
  name: 'orders_failed_total',
  help: 'Total de órdenes fallidas',
  registers: [register],
})

const loginFailures = new client.Counter({
  name: 'login_failures_total',
  help: 'Total de intentos de login fallidos',
  registers: [register],
})

// Histogram: duración
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de requests en segundos',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
})

const checkoutDuration = new client.Histogram({
  name: 'checkout_duration_seconds',
  help: 'Tiempo de respuesta del checkout',
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
})

// Gauge: usuarios online
const usersOnline = new client.Gauge({
  name: 'users_online',
  help: 'Usuarios conectados actualmente',
  registers: [register],
})

// ============ MIDDLEWARES ============

// Middleware de correlación (debe ir primero)
app.use((req, res, next) => {
  req.correlationId = uuidv4()
  res.setHeader('X-Correlation-ID', req.correlationId)
  log('debug', 'request_received', {
    correlationId: req.correlationId,
    method: req.method,
    route: req.path,
    ip: req.ip,
  })
  next()
})

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

// Middleware de logging de request completado
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    const isError = String(res.statusCode) >= '400'

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

// ============ ENDPOINTS ============

app.get('/shop', (req, res) => {
  log('info', 'shop_request', {
    correlationId: req.correlationId,
  })

  setTimeout(() => {
    res.status(200).json({ orders: [] })
  }, Math.random() * 800)
})

app.get('/checkout', (req, res) => {
  const end = checkoutDuration.startTimer()
  log('info', 'checkout_request', {
    correlationId: req.correlationId,
  })

  setTimeout(() => {
    res.status(200).json({ orders: [] })
    end()
  }, Math.random() * 800)
})

app.get('/login', (req, res) => {
  log('info', 'login_request', {
    correlationId: req.correlationId,
  })

  const random = Math.random()
  // 10% error
  if (random < 0.1) {
    loginFailures.inc()
    log('error', 'login_failed', {
      correlationId: req.correlationId,
      reason: 'random_error',
    })
    res.status(500).send('Internal error')
  } else {
    usersOnline.inc()
    log('info', 'login_success', {
      correlationId: req.correlationId,
      usersOnline: usersOnline.get(),
    })
    res.status(200).json({ login: 'success' })
  }
})

app.get('/logout', (req, res) => {
  const random = Math.random()

  log('info', 'logout_request', {
    correlationId: req.correlationId,
  })

  if (random < 0.5) {
    usersOnline.dec()
    log('info', 'logout_success', {
      correlationId: req.correlationId,
      usersOnline: usersOnline.get(),
    })
    return res.status(200).json({
      message: 'User logged out',
    })
  } else {
    log('warn', 'logout_failed', {
      correlationId: req.correlationId,
      reason: 'already_logged_out',
    })
    return res.status(401).json({
      message: 'User already logged out',
    })
  }
})

app.get('/orders', async (req, res) => {
  log('info', 'orders_request', {
    correlationId: req.correlationId,
  })

  const random = Math.random()
  // 10% error
  if (random < 0.1) {
    ordersFailed.inc()
    log('error', 'orders_failed', {
      correlationId: req.correlationId,
      reason: 'internal_error',
    })
    return res.status(500).send('Internal error')
  } else {
    ordersCreated.inc()
  }

  // 30% lento
  if (random < 0.4) {
    log('debug', 'slow_response', {
      correlationId: req.correlationId,
      delay: 800,
    })
    await new Promise((r) => setTimeout(r, 800))
  }

  res.json({ orders: [] })
})

// Endpoint de métricas (para Prometheus)
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  log('info', 'server_started', {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
  })
})
