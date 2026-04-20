# Prerender.io – Bubble (Cloudflare Worker)

A Cloudflare Worker that proxies your Bubble app and routes bot traffic through Prerender.io for SEO rendering.

## How it works

- Regular users are proxied transparently to your Bubble app (`BUBBLE_UPSTREAM`)
- Search engine bots and crawlers are routed to Prerender.io for server-side rendered HTML
- Canonical tags are injected/replaced to point to the public URL
- Redirects from the upstream are rewritten to use your public hostname

## Setup

1. Deploy `worker.js` as a Cloudflare Worker
2. Set the following environment variables in your Worker settings:

| Variable | Description |
|----------|-------------|
| `BUBBLE_UPSTREAM` | Your Bubble app URL (e.g. `https://yourapp.bubbleapps.io`) |
| `PRERENDER_TOKEN` | Your Prerender.io token |

## Requirements

- Cloudflare Workers (supports `HTMLRewriter`)
