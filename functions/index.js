// ─────────────────────────────────────────────────────────────────────────────
// Royal Boutique · Firebase Cloud Functions
// Razorpay Webhook Handler
// Env vars loaded from functions/.env (bundled at deploy time)
// ─────────────────────────────────────────────────────────────────────────────

const { onRequest } = require('firebase-functions/v2/https')
const { setGlobalOptions } = require('firebase-functions/v2')
const admin  = require('firebase-admin')
const crypto = require('crypto')

// ── Init ──────────────────────────────────────────────────────────────────────
admin.initializeApp()
const db = admin.firestore()

setGlobalOptions({ region: 'us-central1', maxInstances: 10 })

// ── Env vars (from functions/.env, never hardcoded) ───────────────────────────
function getWebhookSecret() {
  const s = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!s) throw new Error('RAZORPAY_WEBHOOK_SECRET env var not set')
  return s
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /razorpayWebhook
//
// Register in Razorpay Dashboard → Settings → Webhooks:
//   https://us-central1-royalboutiquebti.cloudfunctions.net/razorpayWebhook
//
// Subscribe events: payment.captured · payment.failed
// ─────────────────────────────────────────────────────────────────────────────
exports.razorpayWebhook = onRequest(
  { invoker: 'public' },
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed')
    }

    try {
      // ── 1. Verify Razorpay HMAC-SHA256 signature ──────────────────────────
      const razorpaySignature = req.headers['x-razorpay-signature']
      if (!razorpaySignature) {
        console.error('[webhook] Missing x-razorpay-signature header')
        return res.status(400).json({ error: 'Missing signature header' })
      }

      // Cloud Functions provides req.rawBody (Buffer) automatically
      const rawBody = req.rawBody
      if (!rawBody) {
        console.error('[webhook] Empty raw body')
        return res.status(400).json({ error: 'Empty body' })
      }

      const WEBHOOK_SECRET = getWebhookSecret()

      const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex')

      // Timing-safe comparison prevents timing attacks
      let isValid = false
      try {
        isValid = crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'hex'),
          Buffer.from(razorpaySignature, 'hex')
        )
      } catch {
        isValid = false
      }

      if (!isValid) {
        console.error('[webhook] ❌ Signature mismatch — possible spoofing attempt')
        return res.status(400).json({ error: 'Invalid webhook signature' })
      }

      // ── 2. Parse event ────────────────────────────────────────────────────
      const event     = req.body     // Firebase parses JSON after rawBody check
      const eventType = event?.event

      console.log(`[webhook] ✅ Verified — event: ${eventType}`)

      // Respond 200 immediately — Razorpay retries if it doesn't get 200 quickly
      res.status(200).json({ received: true })

      // ── 3. Process event asynchronously ──────────────────────────────────
      if (eventType === 'payment.captured') {
        await handlePaymentCaptured(event)
      } else if (eventType === 'payment.failed') {
        await handlePaymentFailed(event)
      } else {
        console.log(`[webhook] Unhandled event type: ${eventType} — ignoring`)
      }

    } catch (err) {
      console.error('[webhook] Unhandled error:', err)
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: payment.captured
// ─────────────────────────────────────────────────────────────────────────────
async function handlePaymentCaptured(event) {
  const payment           = event.payload?.payment?.entity
  const razorpayOrderId   = payment?.order_id
  const razorpayPaymentId = payment?.id
  const amountPaise       = payment?.amount       // in paise
  const firestoreOrderId  = payment?.notes?.orderId
  const userId            = payment?.notes?.userId

  console.log(`[webhook] payment.captured — payment_id: ${razorpayPaymentId}  firestoreOrderId: ${firestoreOrderId}`)

  if (!firestoreOrderId) {
    console.warn('[webhook] No firestoreOrderId in payment notes — cannot update order')
    return
  }

  const orderRef  = db.collection('orders').doc(firestoreOrderId)
  const orderSnap = await orderRef.get()

  if (!orderSnap.exists) {
    console.error(`[webhook] Order ${firestoreOrderId} not found in Firestore`)
    return
  }

  const order = orderSnap.data()

  // ── Idempotency guard: skip if already paid ───────────────────────────────
  if (order.paymentStatus === 'paid' && order.webhookVerified === true) {
    console.log(`[webhook] Order ${firestoreOrderId} already confirmed — skipping duplicate`)
    return
  }

  // ── Update order document ─────────────────────────────────────────────────
  await orderRef.update({
    paymentStatus:      'paid',
    orderStatus:        'placed',
    status:             'pending',          // field MyOrders uses for display
    razorpayPaymentId:  razorpayPaymentId || null,
    razorpayOrderId:    razorpayOrderId   || null,
    amountPaid:         amountPaise ? amountPaise / 100 : null,
    paidAt:             admin.firestore.FieldValue.serverTimestamp(),
    webhookVerified:    true,
    webhookProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  console.log(`[webhook] ✅ Order ${firestoreOrderId} updated → paid / placed`)

  // ── Clear user's cart ─────────────────────────────────────────────────────
  const uid = userId || order.userId
  if (uid) {
    await clearUserCart(uid)
  } else {
    console.warn('[webhook] No userId found — cart not cleared')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: payment.failed
// ─────────────────────────────────────────────────────────────────────────────
async function handlePaymentFailed(event) {
  const payment           = event.payload?.payment?.entity
  const razorpayOrderId   = payment?.order_id
  const razorpayPaymentId = payment?.id
  const firestoreOrderId  = payment?.notes?.orderId
  const errorDesc         = payment?.error_description
  const errorCode         = payment?.error_code

  console.log(`[webhook] payment.failed — payment_id: ${razorpayPaymentId}  firestoreOrderId: ${firestoreOrderId}`)

  if (!firestoreOrderId) {
    console.warn('[webhook] No firestoreOrderId in payment notes')
    return
  }

  await db.collection('orders').doc(firestoreOrderId).update({
    paymentStatus:      'failed',
    orderStatus:        'failed',
    status:             'cancelled',
    failureReason:      errorDesc || 'Payment failed',
    failureCode:        errorCode || null,
    razorpayPaymentId:  razorpayPaymentId || null,
    razorpayOrderId:    razorpayOrderId   || null,
    failedAt:           admin.firestore.FieldValue.serverTimestamp(),
    webhookVerified:    true,
    webhookProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
  }).catch(e => console.error(`[webhook] Failed to update order ${firestoreOrderId}:`, e))

  console.log(`[webhook] ✅ Order ${firestoreOrderId} updated → failed`)
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: Batch-delete all items in user's Firestore cart sub-collection
// ─────────────────────────────────────────────────────────────────────────────
async function clearUserCart(userId) {
  try {
    const cartRef  = db.collection('users').doc(userId).collection('cart')
    const cartSnap = await cartRef.get()

    if (cartSnap.empty) {
      console.log(`[webhook] Cart already empty for user ${userId}`)
      return
    }

    // Batch delete — max 500 writes per batch
    const chunks = []
    let batch = db.batch()
    let count = 0

    cartSnap.docs.forEach(doc => {
      batch.delete(doc.ref)
      count++
      if (count % 500 === 0) {
        chunks.push(batch.commit())
        batch = db.batch()
      }
    })
    chunks.push(batch.commit())
    await Promise.all(chunks)

    console.log(`[webhook] ✅ Cart cleared for user ${userId} (${cartSnap.size} items deleted)`)
  } catch (err) {
    // Never block payment confirmation because of cart clearing
    console.error(`[webhook] Cart clear failed for user ${userId}:`, err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK  →  GET /health
// ─────────────────────────────────────────────────────────────────────────────
exports.health = onRequest({ invoker: 'public' }, (req, res) => {
  res.status(200).json({
    status:    'ok',
    service:   'Royal Boutique Cloud Functions',
    timestamp: new Date().toISOString(),
  })
})
