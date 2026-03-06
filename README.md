# iEarn.Bot Official Website

Official landing page for [iEarn.Bot](https://iearn.bot) — AI-powered Polymarket prediction market bot.

## Stack

- Pure HTML/CSS/JS — no build step, no dependencies
- Deployed on Vercel → iearn.bot
- Logo: `/public/logo.jpg`

## Local Preview

```bash
# Any static file server works
npx serve public
# → http://localhost:3000
```

## Deploy

Push to `main` → Vercel auto-deploys via GitHub integration.

## Structure

```
public/
  index.html   ← single-page website
  logo.jpg     ← brand logo
vercel.json    ← Vercel config
```
