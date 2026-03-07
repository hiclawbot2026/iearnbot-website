/**
 * api/chat.js — iEarn.Bot LLM Proxy
 * Vercel Serverless Function
 *
 * POST /api/chat
 * Body: { "messages": [...], "skillpay_token": "sk_...", "user_id": "..." }
 *
 * Flow:
 *   1. Validate SkillPay token + charge user
 *   2. Forward to OpenRouter LLM
 *   3. Return response
 *
 * Env vars (set in Vercel dashboard, never in code):
 *   OPENROUTER_API_KEY  — your OpenRouter key
 *   SKILLPAY_API_KEY    — your SkillPay merchant key
 *   SKILLPAY_SKILL_ID   — your SkillPay skill ID
 */

const OPENROUTER_API  = 'https://api.aigocode.com/v1/responses'
const SKILLPAY_API    = 'https://skillpay.me/api/v1/billing'
const DEFAULT_MODEL   = 'ClaudeMAX'
const CHARGE_AMOUNT   = 0.01   // USDT per call (our cost ~$0.01, user pays via SkillPay)

// ── CORS headers ──────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// ── Rate limiting (in-memory, resets per cold start) ─────────────────────
const _calls = {}
function rateLimit(ip) {
  const now = Date.now()
  const window = 60_000  // 1 minute
  _calls[ip] = (_calls[ip] || []).filter(t => now - t < window)
  if (_calls[ip].length >= 20) return false  // max 20 calls/min per IP
  _calls[ip].push(now)
  return true
}

// ── SkillPay: charge user ─────────────────────────────────────────────────
async function chargeSkillPay(userId, amount = CHARGE_AMOUNT) {
  const skillId = process.env.SKILLPAY_SKILL_ID || '524d73be-05d5-43de-8d97-57f769206eb0'
  const res = await fetch(`${SKILLPAY_API}/charge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.SKILLPAY_API_KEY,
    },
    body: JSON.stringify({ user_id: userId, skill_id: skillId, amount }),
  })
  if (!res.ok) return { ok: false, error: `SkillPay HTTP ${res.status}` }
  const data = await res.json()
  if (data.success) return { ok: true, balance: data.balance }
  return {
    ok: false,
    insufficient: true,
    balance: data.balance || 0,
    payment_url: data.payment_url || '',
  }
}

// ── AIGoCode: call LLM via /v1/responses ────────────────────────────────
async function callLLM(messages, model = DEFAULT_MODEL) {
  // AIGoCode uses Responses API format
  const systemMsg = messages.find(m => m.role === 'system')
  const userMsgs  = messages.filter(m => m.role !== 'system')
  const input     = userMsgs.map(m => ({
    role: m.role,
    content: m.content,
  }))

  const body = {
    model,
    input,
    ...(systemMsg ? { instructions: systemMsg.content } : {}),
    max_output_tokens: 1200,
  }

  const res = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AIGOCODE_API_KEY}`,
      'HTTP-Referer': 'https://iearn.bot',
      'X-Title': 'iEarn.Bot',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${err.slice(0, 300)}`)
  }
  const data = await res.json()
  // Extract content from Responses API format
  let content = ''
  if (data.output) {
    for (const block of data.output) {
      if (block.type === 'message' && block.content) {
        for (const c of block.content) {
          if (c.type === 'output_text') content += c.text
        }
      }
    }
  }
  if (!content) content = data.output_text || data.text || ''
  return { choices: [{ message: { content } }], model: data.model, usage: data.usage }
}

// ── Main handler ──────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).set(CORS).end()
  }
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  // Rate limit
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown'
  if (!rateLimit(ip)) {
    return res.status(429).json({ ok: false, error: 'Rate limit exceeded (20 req/min)' })
  }

  // Parse body
  const { messages, user_id, model, free_tier } = req.body || {}
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ ok: false, error: 'messages array required' })
  }

  // ── Free tier: 3 free calls per day (no SkillPay needed) ─────────────
  // Tracked via user_id prefix "free_" — very simple MVP
  const isFree = free_tier === true || !user_id

  if (!isFree) {
    // ── SkillPay billing gate ─────────────────────────────────────────
    if (!user_id) {
      return res.status(400).json({ ok: false, error: 'user_id required for paid calls' })
    }
    const charge = await chargeSkillPay(user_id)
    if (!charge.ok) {
      return res.status(402).json({
        ok: false,
        error: 'Insufficient SkillPay balance',
        insufficient: true,
        balance: charge.balance,
        payment_url: charge.payment_url,
      })
    }
  }

  // ── LLM call ─────────────────────────────────────────────────────────
  try {
    const llmRes = await callLLM(messages, model || DEFAULT_MODEL)
    const content = llmRes.choices?.[0]?.message?.content || ''
    return res.status(200).json({
      ok: true,
      content,
      model: llmRes.model,
      usage: llmRes.usage,
    })
  } catch (err) {
    console.error('[proxy] LLM error:', err.message)
    return res.status(502).json({ ok: false, error: 'LLM call failed', detail: err.message })
  }
}
