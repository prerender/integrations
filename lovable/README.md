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

## Authentication / OAuth

Lovable uses Supabase for authentication. When your app is served from a custom domain via this worker, the OAuth callback URL seen by the browser will be your custom domain (e.g. `https://example.com/auth/callback`), not the original Lovable URL.

For auth to work correctly you need to add your custom domain to the **allowed redirect URLs** in the Supabase project that backs your Lovable app:

1. Go to your [Supabase dashboard](https://supabase.com/dashboard)
2. Open the project linked to your Lovable app
3. Navigate to **Authentication → URL Configuration**
4. Add your custom domain to **Redirect URLs** (e.g. `https://example.com/**`)

Without this step, Supabase will reject the OAuth callback and users will not be able to log in.

> **Note:** You cannot do this through Lovable's UI directly — you need access to the underlying Supabase project.

## Requirements

- Cloudflare Workers (supports `HTMLRewriter`)
