// ─────────────────────────────────────────────────────────────────────────────
// Royal Boutique · Express API Server
// Endpoints: create-order · verify-payment · webhook · simulate-webhook
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

// Load .env.local in local dev — Railway sets env vars directly, no file needed
import { existsSync } from 'fs'
const envPath = path.resolve(__dirname, '../.env.local')
if (existsSync(envPath)) dotenv.config({ path: envPath })
else dotenv.config()  // picks up .env if present

const KEY_ID          = process.env.VITE_RAZORPAY_KEY_ID
const KEY_SECRET      = process.env.RAZORPAY_KEY_SECRET
const WEBHOOK_SECRET  = process.env.RAZORPAY_WEBHOOK_SECRET
const FIREBASE_API_KEY  = process.env.VITE_FIREBASE_API_KEY
const FIREBASE_PROJECT  = process.env.VITE_FIREBASE_PROJECT_ID

if (!KEY_ID || !KEY_SECRET) {
  console.error('[server] ❌  VITE_RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing')
  process.exit(1)
}
if (!WEBHOOK_SECRET) {
  console.warn('[server] ⚠️  RAZORPAY_WEBHOOK_SECRET not set')
}

const razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET })

const app  = express()
const PORT = process.env.PORT || process.env.SERVER_PORT || 4000  // Railway sets PORT

// ── CORS — allow localhost (dev) + Firebase Hosting (prod) ───────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://royalboutiquebti.web.app',
  'https://royalboutiquebti.firebaseapp.com',
]
app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin (curl / server-to-server)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

// ── JSON body (all routes EXCEPT /api/webhook which needs raw bytes) ──────────
app.use((req, res, next) => {
  if (req.path === '/api/webhook') return next()   // skip — raw body needed
  express.json()(req, res, next)
})

// ── Raw body capture for Razorpay webhook signature verification ──────────────
app.use('/api/webhook', express.raw({ type: 'application/json' }))

// ── Utility: update a Firestore document via REST API ────────────────────────
// Uses PATCH /v1/projects/{proj}/databases/(default)/documents/{col}/{doc}
// This lets the backend update Firestore without Firebase Admin SDK.
async function firestorePatch(collection, docId, fields) {
  if (!FIREBASE_PROJECT || !FIREBASE_API_KEY) {
    console.warn('[server] Firestore env vars missing — skipping Firestore update')
    return
  }

  // Build Firestore field map
  const firestoreFields = {}
  for (const [k, v] of Object.entries(fields)) {
    if (v === null)             firestoreFields[k] = { nullValue: null }
    else if (typeof v === 'boolean') firestoreFields[k] = { booleanValue: v }
    else if (typeof v === 'number')  firestoreFields[k] = { integerValue: String(Math.round(v)) }
    else                        firestoreFields[k] = { stringValue: String(v) }
  }
  // serverTimestamp via transform — we'll include it separately via a write
  firestoreFields['webhookProcessedAt'] = { stringValue: new Date().toISOString() }

  const url =
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}` +
    `/databases/(default)/documents/${collection}/${docId}` +
    `?key=${FIREBASE_API_KEY}` +
    `&updateMask.fieldPaths=${Object.keys(firestoreFields).join('&updateMask.fieldPaths=')}`

  const body = JSON.stringify({ fields: firestoreFields })

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    if (!res.ok) {
      const err = await res.text()
      console.error(`[server] Firestore PATCH failed for ${collection}/${docId}:`, err)
    } else {
      console.log(`[server] ✅  Firestore updated — ${collection}/${docId}`)
    }
  } catch (e) {
    console.error('[server] Firestore fetch error:', e)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  service: 'Royal Boutique API',
  endpoints: ['/api/create-order', '/api/verify-payment', '/api/webhook', '/api/simulate-webhook'],
}))

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/create-order
// Body: { amount: number (INR), receipt?: string }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, receipt } = req.body

    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ error: 'amount (number, INR) is required' })
    }
    const amountInPaise = Math.round(amount * 100)
    if (amountInPaise < 100) {
      return res.status(400).json({ error: 'Minimum order amount is ₹1 (100 paise)' })
    }

    const order = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: 'INR',
      receipt:  receipt || `rb_${Date.now()}`,
    })

    console.log(`[server] ✅  Order created — ${order.id}  ₹${amount}`)
    return res.status(200).json({
      razorpayOrderId: order.id,
      amount:          order.amount,
      currency:        order.currency,
    })
  } catch (err) {
    console.error('[server] /api/create-order error:', err?.error || err)
    return res.status(err?.statusCode === 401 ? 401 : 500)
      .json({ error: err?.error?.description || 'Failed to create Razorpay order' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/verify-payment
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'All three Razorpay fields are required' })
    }

    const expected = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(razorpay_signature, 'hex')
    )

    if (!isValid) {
      console.warn(`[server] ⚠️  Signature mismatch — order: ${razorpay_order_id}`)
      return res.status(400).json({ error: 'Payment signature verification failed' })
    }

    console.log(`[server] ✅  Payment verified — order: ${razorpay_order_id}  payment: ${razorpay_payment_id}`)
    return res.status(200).json({ verified: true, razorpay_payment_id })
  } catch (err) {
    console.error('[server] /api/verify-payment error:', err)
    return res.status(500).json({ error: 'Verification error' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhook   ← Real Razorpay webhook endpoint
//
// Razorpay calls this URL after every payment event.
// Register this URL in: Razorpay Dashboard → Settings → Webhooks
// For prod use ngrok / deploy URL. For dev, use /api/simulate-webhook.
//
// Verifies: x-razorpay-signature = HMAC-SHA256(rawBody, WEBHOOK_SECRET)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/webhook', async (req, res) => {
  if (!WEBHOOK_SECRET) {
    return res.status(501).json({ error: 'Webhook secret not configured' })
  }

  try {
    const razorpaySignature = req.headers['x-razorpay-signature']
    if (!razorpaySignature) {
      return res.status(400).json({ error: 'Missing x-razorpay-signature header' })
    }

    // Raw body is a Buffer thanks to express.raw()
    const rawBody = req.body
    const expected = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex')

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(razorpaySignature, 'hex')
    )

    if (!isValid) {
      console.warn('[server] ⚠️  Webhook signature mismatch')
      return res.status(400).json({ error: 'Invalid webhook signature' })
    }

    // Parse the event
    const event = JSON.parse(rawBody.toString())
    const eventType = event.event

    console.log(`[server] 📦  Webhook received — event: ${eventType}`)

    // ── Handle payment.captured ─────────────────────────────────────────────
    if (eventType === 'payment.captured') {
      const payment    = event.payload?.payment?.entity
      const razorpayOrderId   = payment?.order_id
      const razorpayPaymentId = payment?.id
      const firestoreOrderId  = payment?.notes?.orderId   // saved in notes during checkout

      console.log(`[server]   payment_id: ${razorpayPaymentId}  order_id: ${razorpayOrderId}  firestoreId: ${firestoreOrderId}`)

      if (firestoreOrderId) {
        await firestorePatch('orders', firestoreOrderId, {
          paymentStatus:     'paid',
          orderStatus:       'placed',
          status:            'pending',
          razorpayPaymentId: razorpayPaymentId || '',
          razorpayOrderId:   razorpayOrderId   || '',
          webhookVerified:   'true',
        })
      }
    }

    // ── Handle payment.failed ───────────────────────────────────────────────
    if (eventType === 'payment.failed') {
      const payment           = event.payload?.payment?.entity
      const firestoreOrderId  = payment?.notes?.orderId

      if (firestoreOrderId) {
        await firestorePatch('orders', firestoreOrderId, {
          paymentStatus: 'failed',
          orderStatus:   'failed',
          status:        'cancelled',
          webhookVerified: 'true',
        })
      }
    }

    // Always respond 200 quickly so Razorpay doesn't retry
    return res.status(200).json({ received: true })

  } catch (err) {
    console.error('[server] /api/webhook error:', err)
    return res.status(500).json({ error: 'Webhook processing error' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/simulate-webhook   ← DEV ONLY
//
// Called by the frontend immediately after /api/verify-payment succeeds.
// Simulates what Razorpay would call on /api/webhook in production.
// Generates a valid HMAC so the webhook handler can process it normally.
//
// Body: { event, firestoreOrderId, razorpayOrderId, razorpayPaymentId }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/simulate-webhook', async (req, res) => {
  try {
    const {
      event = 'payment.captured',
      firestoreOrderId,
      razorpayOrderId,
      razorpayPaymentId,
    } = req.body

    if (!firestoreOrderId || !razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({ error: 'firestoreOrderId, razorpayOrderId, razorpayPaymentId required' })
    }

    // Build a minimal Razorpay-like event payload
    const payload = JSON.stringify({
      event,
      payload: {
        payment: {
          entity: {
            id:       razorpayPaymentId,
            order_id: razorpayOrderId,
            notes:    { orderId: firestoreOrderId },
          },
        },
      },
    })

    // Generate the HMAC the same way Razorpay would
    const signature = WEBHOOK_SECRET
      ? crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex')
      : 'no-secret'

    // Self-call /api/webhook
    const webhookRes = await fetch(`http://localhost:${PORT}/api/webhook`, {
      method:  'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-razorpay-signature': signature,
      },
      body: payload,
    })

    const result = await webhookRes.json()
    console.log(`[server] 🔁  Simulated webhook — event: ${event}  result:`, result)
    return res.status(200).json({ simulated: true, webhookResult: result })

  } catch (err) {
    console.error('[server] /api/simulate-webhook error:', err)
    return res.status(500).json({ error: 'Simulation failed' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n[server] 🚀  Royal Boutique API  →  http://localhost:${PORT}`)
  console.log(`[server]     POST /api/create-order`)
  console.log(`[server]     POST /api/verify-payment`)
  console.log(`[server]     POST /api/webhook         (real Razorpay webhook)`)
  console.log(`[server]     POST /api/simulate-webhook (dev simulation)\n`)
})
