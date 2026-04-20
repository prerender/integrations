# Prerender.io – Next.js

Next.js middleware that routes bot traffic through Prerender.io for SEO rendering.

## Which file to use

| File | Next.js version | Language |
|------|----------------|----------|
| `proxy.ts` | 16+ | TypeScript |
| `middleware.js` | < 16 | JavaScript |

Use `proxy.ts` for modern Next.js projects. Use `middleware.js` if you are on an older version where `middleware.js` was the convention.

## Setup

1. Copy the appropriate file to the root of your Next.js project as `middleware.ts` (or `middleware.js`)
2. Set the following environment variable:

| Variable | Description |
|----------|-------------|
| `PRERENDER_TOKEN` | Your Prerender.io token |

## Requirements

- Next.js 12+ (middleware support)
- Node.js 18+
