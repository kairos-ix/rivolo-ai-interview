/**
 * Lightweight User-Agent parser — no external dependencies.
 */

const parseUserAgent = (ua = "") => {
  const result = { browser: "Unknown", os: "Unknown", device: "Desktop" };
  if (!ua) return result;

  // Browser detection
  if (/Edg\//i.test(ua)) result.browser = "Edge";
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) result.browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) result.browser = "Chrome";
  else if (/Firefox\//i.test(ua)) result.browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) result.browser = "Safari";
  else if (/MSIE|Trident/i.test(ua)) result.browser = "Internet Explorer";

  // OS detection
  if (/Windows NT 10/i.test(ua)) result.os = "Windows 10/11";
  else if (/Windows NT/i.test(ua)) result.os = "Windows";
  else if (/Mac OS X/i.test(ua)) result.os = "macOS";
  else if (/Android/i.test(ua)) result.os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) result.os = "iOS";
  else if (/Linux/i.test(ua)) result.os = "Linux";
  else if (/CrOS/i.test(ua)) result.os = "Chrome OS";

  // Device type
  if (/Mobile|Android.*Mobile|iPhone/i.test(ua)) result.device = "Mobile";
  else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) result.device = "Tablet";
  else result.device = "Desktop";

  return result;
};

const getClientIP = (req) => {
  let ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "unknown";
    
  if (ip === "::1" || ip === "127.0.0.1") {
    ip = "Localhost (127.0.0.1)";
  }
  
  return ip;
};

module.exports = { parseUserAgent, getClientIP };
