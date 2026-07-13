# U-go Support Hub — studio site

Multi-page studio site for U-go Support Hub. Static HTML/CSS/JS, no build step.
Warm charcoal + cream + amber identity; Space Grotesk / Inter / IBM Plex Mono.

## Structure

```
index.html                        Home (hero, ticker, story, pillars, stats, case cards, FAQ)
services.html                     Translate / Build / Teach expanded (#translate #build #teach)
about.html                        Founder, operating rules, platforms
work-with-us.html                 Lead form → /api/lead → thank-you with Calendly
case-study/aios.html              Case study 01
case-study/prospect-scoring.html  Case study 02
case-study/client-workflows.html  Case study 03
privacy.html / terms.html         Legal
assets/site.css                   Design system (all pages)
assets/site.js                    Reveals, menu, ticker, counters, accordion
api/lead.js                       Serverless: emails form submissions via Resend
```

Internal links use clean URLs (`/services`, `/case-study/aios`) — `vercel.json`
sets `cleanUrls: true`. For local preview use `vercel dev`, or any static server
if you don't need clean URLs/the API.

## Lead form (Resend)

`/api/lead` needs two environment variables in Vercel → Project → Settings →
Environment Variables (Production + Preview):

- `RESEND_API_KEY` — resend.com → API Keys (free tier)
- `LEAD_TO_EMAIL` — the inbox that receives leads

Until they're set the endpoint returns 503 and the page shows an honest
fallback (direct email + Calendly link), so no lead is silently lost.

## Deploy

```bash
vercel login
vercel --prod
```

Framework preset: "Other" / static. Add a custom domain under
Project → Settings → Domains when ready.
