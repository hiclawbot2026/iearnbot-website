// api/fetch-url.js — Server-side URL fetch (bypass CORS for PWA)
// Deployed as a Vercel serverless function

export default async function handler(req, res) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const { url } = req.body || {}
  if (!url) {
    return res.status(400).json({ ok: false, error: 'url required' })
  }

  // Validate URL
  let parsedUrl
  try {
    parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ ok: false, error: 'Only http/https URLs allowed' })
    }
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'Invalid URL' })
  }

  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; iEarnBot/0.4; +https://iearn.bot)',
        'Accept': 'text/html,text/plain,*/*',
      },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    })

    const html = await r.text()

    // Strip HTML tags, collapse whitespace, trim to 8000 chars
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)

    return res.status(200).json({ ok: true, content: text, url })
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message, content: '' })
  }
}
