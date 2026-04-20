// User agents handled by Prerender
const BOT_AGENTS = [
  "googlebot", "yahoo! slurp", "bingbot", "yandex", "baiduspider", "facebookexternalhit",
  "twitterbot", "rogerbot", "linkedinbot", "embedly", "quora link preview", "showyoubot",
  "outbrain", "pinterest/0.", "developers.google.com/+/web/snippet", "slackbot", "vkshare",
  "w3c_validator", "redditbot", "applebot", "whatsapp", "flipboard", "tumblr", "bitlybot",
  "skypeuripreview", "nuzzel", "discordbot", "google page speed", "qwantify", "pinterestbot",
  "bitrix link preview", "xing-contenttabreceiver", "chrome-lighthouse", "telegrambot",
  "oai-searchbot", "chatgpt", "gptbot", "claudebot", "amazonbot", "perplexity",
  "google-inspectiontool", "integration-test",
];

const IGNORE_EXTENSIONS = [
  ".js", ".css", ".xml", ".less", ".png", ".jpg", ".jpeg", ".gif", ".pdf", ".doc", ".txt", ".ico",
  ".rss", ".zip", ".mp3", ".rar", ".exe", ".wmv", ".avi", ".ppt", ".mpg", ".mpeg", ".tif", ".wav",
  ".mov", ".psd", ".ai", ".xls", ".mp4", ".m4a", ".swf", ".dat", ".dmg", ".iso", ".flv", ".m4v",
  ".torrent", ".woff", ".ttf", ".svg", ".webmanifest",
];

function isRedirect(status) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function injectCanonical(response, canonicalUrl) {
  const contentType = (response.headers.get("Content-Type") || "").toLowerCase();
  if (!contentType.includes("text/html")) return response;

  return new HTMLRewriter()
    .on('link[rel="canonical"]', { element(el) { el.remove(); } })
    .on("head", {
      element(el) {
        el.append(`<link rel="canonical" href="${canonicalUrl}" />`, { html: true });
      },
    })
    .transform(response);
}

export default {
  async fetch(request, env) {
    try {
      if (!env?.BUBBLE_UPSTREAM) return new Response("Missing BUBBLE_UPSTREAM variable", { status: 500 });
      if (!env?.PRERENDER_TOKEN) return new Response("Missing PRERENDER_TOKEN secret", { status: 500 });
      return await handleRequest(request, env);
    } catch (err) {
      return new Response(err?.stack || String(err), { status: 500 });
    }
  },
};

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const PUBLIC_HOST = url.host;
  const userAgent = (request.headers.get("User-Agent") || "").toLowerCase();
  const isPrerender = request.headers.get("X-Prerender");
  const pathName = url.pathname.toLowerCase();
  const dot = pathName.lastIndexOf(".");
  const extension = dot >= 0 ? pathName.substring(dot).toLowerCase() : "";
  const isBot = BOT_AGENTS.some((bot) => userAgent.includes(bot.toLowerCase()));
  const isGetLike = request.method === "GET" || request.method === "HEAD";
  const isIgnoredExt = extension && IGNORE_EXTENSIONS.includes(extension);
  const canonicalUrl = url.toString();

  if (isGetLike && !isPrerender && isBot && !isIgnoredExt) {
    const prerenderUrl = `https://service.prerender.io/${encodeURIComponent(url.href)}`;
    const newHeaders = new Headers(request.headers);
    newHeaders.set("X-Prerender-Token", env.PRERENDER_TOKEN);
    newHeaders.set("X-Prerender-Int-Type", "CloudFlare-Bubble");
    newHeaders.delete("Host");

    const prerenderResp = await fetch(new Request(prerenderUrl, { headers: newHeaders, redirect: "manual" }));
    return injectCanonical(prerenderResp, canonicalUrl);
  }

  const upstreamBase = new URL(env.BUBBLE_UPSTREAM);
  const upstreamUrl = new URL(request.url);
  upstreamUrl.protocol = upstreamBase.protocol;
  upstreamUrl.hostname = upstreamBase.hostname;

  const h = new Headers(request.headers);
  h.set("Host", upstreamBase.hostname);
  h.set("X-Forwarded-Host", PUBLIC_HOST);
  h.set("X-Forwarded-Proto", "https");
  h.delete("cf-connecting-ip");
  h.delete("x-forwarded-for");
  h.delete("forwarded");

  const resp = await fetch(new Request(upstreamUrl.toString(), {
    method: request.method,
    headers: h,
    body: isGetLike ? undefined : request.body,
    redirect: "manual",
  }));

  if (isRedirect(resp.status)) {
    const loc = resp.headers.get("Location") || "";
    const newHeaders = new Headers(resp.headers);
    if (loc) {
      // Only rewrite Location if it points back to the upstream.
      // External redirects (e.g. OAuth providers) must pass through unchanged —
      // rewriting them would corrupt the redirect_uri param and break OAuth.
      let newLoc = loc;
      try {
        const locUrl = new URL(loc);
        if (locUrl.hostname === upstreamBase.hostname) {
          newLoc = loc.replace(/^http:\/\//i, "https://").replaceAll(upstreamBase.hostname, PUBLIC_HOST);
        }
      } catch {
        newLoc = loc.replaceAll(upstreamBase.hostname, PUBLIC_HOST);
      }
      newHeaders.set("Location", newLoc);
    }
    return new Response(resp.body, { status: resp.status, headers: newHeaders });
  }

  return injectCanonical(resp, canonicalUrl);
}
