/**
 * api/topup.js — Generate SkillPay top-up link
 * POST /api/topup  Body: { user_id, amount }
 */
const SKILLPAY_API = 'https://skillpay.me/api/v1/billing'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).set(CORS).end()
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))

  const { user_id, amount = 9.9 } = req.body || {}
  if (!user_id) return res.status(400).json({ ok: false, error: 'user_id required' })

  try {
    const r = await fetch(`${SKILLPAY_API}/payment-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.SKILLPAY_API_KEY,
      },
      body: JSON.stringify({ user_id, amount }),
    })
    const data = await r.json()
    return res.status(200).json({ ok: true, payment_url: data.payment_url })
  } catch (err) {
    return res.status(502).json({ ok: false, error: err.message })
  }
}
