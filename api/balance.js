/**
 * api/balance.js — Check SkillPay balance
 * GET /api/balance?user_id=xxx
 */
const SKILLPAY_API = 'https://skillpay.me/api/v1/billing'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).set(CORS).end()
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))

  const { user_id } = req.query
  if (!user_id) return res.status(400).json({ ok: false, error: 'user_id required' })

  try {
    const r = await fetch(`${SKILLPAY_API}/balance?user_id=${encodeURIComponent(user_id)}`, {
      headers: { 'X-API-Key': process.env.SKILLPAY_API_KEY },
    })
    const data = await r.json()
    return res.status(200).json({ ok: true, balance: data.balance ?? 0 })
  } catch (err) {
    return res.status(502).json({ ok: false, error: err.message })
  }
}
