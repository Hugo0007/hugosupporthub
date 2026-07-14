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
newsletter/index.html             Newsletter archive + hero signup
newsletter/issue-1.html           Issue 01 (copy this file for new issues)
newsletter/feed.xml               RSS feed (hand-maintained)
privacy.html / terms.html         Legal
sitemap.xml / robots.txt          SEO (update sitemap when pages are added)
og-image.png                      1200×630 social share image (all pages)
assets/site.css                   Design system (all pages)
assets/site.js                    Reveals, menu, ticker, counters, accordion, newsletter form
api/lead.js                       Serverless: emails form submissions via Resend
api/subscribe.js                  Serverless: adds signups to the Resend audience
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

## Newsletter (Resend Audiences)

`/api/subscribe` adds signups to the Resend audience. Env vars (Production + Preview):

- `NEWS` — **full-access** Resend API key (audience endpoints reject send-only keys;
  falls back to `RESEND_API_KEY` if unset)
- `RESEND_AUDIENCE_ID` — optional; pins the audience and skips the runtime lookup

Signup forms live in the footer of every main page plus the `/newsletter` hero.

### Publishing a new issue

1. Copy the latest `newsletter/issue-N.html` → `issue-N+1.html`. Update: `<title>`,
   meta description, canonical, `og:*`/`twitter:*` URLs and text,
   `article:published_time`, the Article JSON-LD block (headline/description/dates/
   mainEntityOfPage), the hero (`Issue NN`, date, read time, topic), and the body.
2. Add a card for it at the top of the archive grid in `newsletter/index.html`
   (and bump the older cards' `rv-d*` delays if you care about the stagger).
3. Append a `<url>` to `sitemap.xml` and an `<item>` to `newsletter/feed.xml`
   (update `<lastBuildDate>` too).
4. Deploy (`vercel --prod`), then commit + push.

### Sending the email edition

Resend's free tier only delivers to the account owner's address until a custom
domain is verified, so **email sends are locked until a domain is bought and
verified in Resend** (then: Resend dashboard → Broadcasts → write → send to the
audience — no code needed). Interim for a small early list: Audience → export
CSV → BCC from Gmail with a link to the issue URL. Don't promise a send
schedule in on-site copy until sending is unlocked.

## Deploy

```bash
vercel login
vercel --prod
```

Framework preset: "Other" / static. Add a custom domain under
Project → Settings → Domains when ready.
