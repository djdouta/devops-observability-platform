import express from 'express'

const app = express()
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK || null

app.use(express.json())

async function sendToSlack(alert, level) {
  if (!SLACK_WEBHOOK) return

  const payload = {
    text: `${level} ALERT`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${alert.labels.alertname}*`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Route:*\n${alert.labels.route}` },
          { type: 'mrkdwn', text: `*Severity:*\n${alert.labels.severity}` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Summary:*\n${alert.annotations.summary || 'Sin resumen'}`,
        },
      },
    ],
  }

  try {
    await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('Slack error:', err)
  }
}

// Helper para imprimir alertas de forma legible
function logAlerts(alerts, receiverLabel) {
  if (!alerts || alerts.length === 0) {
    console.log(`⚠️ ${receiverLabel}: payload sin alertas`)
    return
  }

  alerts.forEach((alert) => {
    console.log(`🚨 [${alert.labels.severity}] ${alert.labels.alertname}`)
    console.log(`📍 Route: ${alert.labels.route}`)
    console.log(`🧾 ${alert.annotations.summary || 'Sin resumen'}`)
    console.log('---')
  })
}

// Default alerts
app.post('/alerts', (req, res) => {
  console.log('🚨 ALERTA RECIBIDA:')
  logAlerts(req.body.alerts, 'Default')
  res.sendStatus(200)
})

// Critical alerts
app.post('/critical', async (req, res) => {
  console.log('💥 ALERTA CRÍTICA RECIBIDA:')

  const alerts = req.body.alerts
  logAlerts(alerts, 'Critical')

  for (const alert of alerts || []) {
    await sendToSlack(alert, '🚨 CRITICAL')
  }

  res.sendStatus(200)
})

// Warning alerts
app.post('/warning', async (req, res) => {
  console.log('⚠️ ALERTA DE ADVERTENCIA RECIBIDA:')

  const alerts = req.body.alerts
  logAlerts(alerts, 'Warning')

  for (const alert of alerts || []) {
    await sendToSlack(alert, '⚠️ WARNING')
  }

  res.sendStatus(200)
})

// Logsa
app.post('/log', (req, res) => {
  console.log('📋 LOG RECIBIDO:')
  if (req.body.alerts) {
    logAlerts(req.body.alerts, 'Log')
  } else {
    console.log('Contenido:', JSON.stringify(req.body, null, 2))
  }
  res.sendStatus(200)
})

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.listen(5001, () => {
  console.log('Alert receiver en puerto 5001')
})
