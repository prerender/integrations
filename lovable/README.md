# Prerender.io – Lovable (Cloudflare Worker)

A Cloudflare Worker that proxies your Lovable app and routes bot traffic through Prerender.io for SEO rendering.

## How it works

- Regular users are proxied transparently to your Lovable app (`LOVABLE_UPSTREAM`)
- Search engine bots and crawlers are routed to Prerender.io for server-side rendered HTML
- Canonical tags are injected/replaced to point to the public URL
- Redirects from the upstream are rewritten to use your public hostname

## Setup

1. Deploy `worker.js` as a Cloudflare Worker
2. Set the following environment variables in your Worker settings:

| Variable | Description |
|----------|-------------|
| `LOVABLE_UPSTREAM` | Your Lovable app URL (e.g. `https://yourapp.lovable.app`) |
| `PRERENDER_TOKEN` | Your Prerender.io token |

## Requirements

- Cloudflare Workers (supports `HTMLRewriter`)
