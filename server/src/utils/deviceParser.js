/**
 * Enterprise-grade User-Agent parser & IP resolver — zero external dependencies.
 * Supports version extraction, comprehensive browser/OS/device matching,
 * and multi-header IP verification with IPv6 normalization.
 */

// ─── Browser Detection (ordered by specificity) ────────────────────────────
const BROWSER_RULES = [
  // Must check specific browsers BEFORE generic Chrome/Safari
  { name: "Samsung Internet", pattern: /SamsungBrowser\/(\d+[\.\d]*)/ },
  { name: "UC Browser",       pattern: /UCBrowser\/(\d+[\.\d]*)/ },
  { name: "Brave",            pattern: /Brave\/(\d+[\.\d]*)/ },
  { name: "Vivaldi",          pattern: /Vivaldi\/(\d+[\.\d]*)/ },
  { name: "Yandex Browser",   pattern: /YaBrowser\/(\d+[\.\d]*)/ },
  { name: "Opera GX",         pattern: /OPR\/(\d+[\.\d]*).*GX/ },
  { name: "Opera",            pattern: /OPR\/(\d+[\.\d]*)/ },
  { name: "Opera",            pattern: /Opera\/(\d+[\.\d]*)/ },
  { name: "Edge",             pattern: /Edg(?:e|A|iOS)?\/(\d+[\.\d]*)/ },
  { name: "Firefox",          pattern: /Firefox\/(\d+[\.\d]*)/ },
  { name: "Chrome",           pattern: /(?!Chromium)Chrome\/(\d+[\.\d]*)/ },
  { name: "Chromium",         pattern: /Chromium\/(\d+[\.\d]*)/ },
  { name: "Safari",           pattern: /Version\/(\d+[\.\d]*).*Safari/ },
  { name: "IE",               pattern: /(?:MSIE |rv:)(\d+[\.\d]*)/ },
];

// ─── OS Detection (ordered by specificity) ──────────────────────────────────
const OS_RULES = [
  // Windows versions (check specific before generic)
  { name: "Windows 11",    pattern: /Windows NT 10\.0.*Build\/(2[2-9]\d{3}|[3-9]\d{4})/ },
  { name: "Windows 11",    pattern: /Windows NT 10\.0.*Win64/ },
  { name: "Windows 10",    pattern: /Windows NT 10\.0/ },
  { name: "Windows 8.1",   pattern: /Windows NT 6\.3/ },
  { name: "Windows 8",     pattern: /Windows NT 6\.2/ },
  { name: "Windows 7",     pattern: /Windows NT 6\.1/ },
  { name: "Windows Vista",  pattern: /Windows NT 6\.0/ },
  { name: "Windows XP",    pattern: /Windows NT 5\.[12]/ },
  { name: "Windows",       pattern: /Windows/ },
  // Apple
  { name: "iPadOS",        pattern: /iPad.*OS (\d+[_\.\d]*)/ },
  { name: "iOS",           pattern: /iPhone OS (\d+[_\.\d]*)/ },
  { name: "macOS",         pattern: /Mac OS X (\d+[_\.\d]*)/ },
  // Mobile
  { name: "Android",       pattern: /Android (\d+[\.\d]*)/ },
  { name: "HarmonyOS",     pattern: /HarmonyOS/ },
  // Desktop Linux
  { name: "Ubuntu",        pattern: /Ubuntu/ },
  { name: "Fedora",        pattern: /Fedora/ },
  { name: "Chrome OS",     pattern: /CrOS/ },
  { name: "Linux",         pattern: /Linux/ },
  // Other
  { name: "FreeBSD",       pattern: /FreeBSD/ },
];

// ─── Device Type Detection ──────────────────────────────────────────────────
const DEVICE_PATTERNS = {
  mobile: [
    /Mobile/i, /iPhone/i, /iPod/i, /Android.*Mobile/i,
    /Windows Phone/i, /BlackBerry/i, /BB10/i,
    /Opera Mini/i, /IEMobile/i,
  ],
  tablet: [
    /iPad/i, /Android(?!.*Mobile)/i, /Tablet/i,
    /Kindle/i, /Silk/i, /PlayBook/i,
  ],
  bot: [
    /bot/i, /crawl/i, /spider/i, /slurp/i,
    /mediapartners/i, /Googlebot/i, /Bingbot/i,
  ],
};

/**
 * Parse a User-Agent string into structured device information.
 * Returns: { browser, browserVersion, os, osVersion, device, raw }
 */
const parseUserAgent = (ua = "") => {
  const result = {
    browser: "Unknown",
    browserVersion: "",
    os: "Unknown",
    osVersion: "",
    device: "Desktop",
    raw: ua,
  };
  if (!ua) return result;

  // ── Browser ──
  for (const rule of BROWSER_RULES) {
    const match = ua.match(rule.pattern);
    if (match) {
      result.browser = rule.name;
      result.browserVersion = match[1] || "";
      break;
    }
  }

  // ── OS ──
  for (const rule of OS_RULES) {
    const match = ua.match(rule.pattern);
    if (match) {
      result.os = rule.name;
      // Normalize version (replace underscores with dots)
      result.osVersion = (match[1] || "").replace(/_/g, ".");
      break;
    }
  }

  // ── Device Type ──
  if (DEVICE_PATTERNS.bot.some(p => p.test(ua))) {
    result.device = "Bot";
  } else if (DEVICE_PATTERNS.mobile.some(p => p.test(ua))) {
    result.device = "Mobile";
  } else if (DEVICE_PATTERNS.tablet.some(p => p.test(ua))) {
    result.device = "Tablet";
  } else {
    result.device = "Desktop";
  }

  return result;
};

// ─── IP Address Resolution ──────────────────────────────────────────────────

/**
 * Validate that a string looks like a real IPv4 or IPv6 address.
 */
const isValidIP = (ip) => {
  if (!ip || typeof ip !== "string") return false;
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return ip.split(".").every(octet => parseInt(octet, 10) <= 255);
  }
  // IPv6 (simplified check — allows :: shorthand)
  if (/^[0-9a-fA-F:]+$/.test(ip) && ip.includes(":")) return true;
  return false;
};

/**
 * Normalize an IPv6-mapped IPv4 address (e.g. "::ffff:192.168.1.1" → "192.168.1.1").
 */
const normalizeIP = (ip) => {
  if (!ip) return "unknown";
  ip = ip.trim();
  // Strip IPv6-mapped IPv4 prefix
  if (ip.startsWith("::ffff:")) {
    ip = ip.slice(7);
  }
  return ip;
};

/**
 * Extract the real client IP from the request using multiple verification sources.
 * Checks headers in priority order, validates each, and normalizes the result.
 */
const getClientIP = (req) => {
  // Headers to check, in priority order (most trustworthy first for reverse proxies)
  const headerSources = [
    req.headers["cf-connecting-ip"],          // Cloudflare
    req.headers["x-real-ip"],                 // Nginx
    req.headers["x-client-ip"],               // Apache
    req.headers["true-client-ip"],            // Akamai / CDN
    req.headers["x-forwarded-for"],           // Standard proxy (may contain chain)
    req.headers["x-cluster-client-ip"],       // Cluster setups
    req.headers["fastly-client-ip"],          // Fastly CDN
    req.headers["x-appengine-user-ip"],       // Google App Engine
  ];

  for (const source of headerSources) {
    if (!source) continue;
    // x-forwarded-for can be a comma-separated list — take the first (original client)
    const candidate = normalizeIP(source.split(",")[0]);
    if (isValidIP(candidate)) {
      return formatIP(candidate);
    }
  }

  // Fallback to socket-level addresses
  const socketSources = [
    req.connection?.remoteAddress,
    req.socket?.remoteAddress,
    req.info?.remoteAddress, // Hapi
  ];

  for (const source of socketSources) {
    if (!source) continue;
    const candidate = normalizeIP(source);
    if (isValidIP(candidate)) {
      return formatIP(candidate);
    }
  }

  return "unknown";
};

/**
 * Format IP for display. Maps loopback addresses to human-readable "Localhost".
 */
const formatIP = (ip) => {
  if (ip === "::1" || ip === "127.0.0.1") {
    return "Localhost (127.0.0.1)";
  }
  return ip;
};

module.exports = { parseUserAgent, getClientIP, isValidIP, normalizeIP };
