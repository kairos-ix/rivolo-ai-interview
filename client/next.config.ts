import type { NextConfig } from "next";

const securityHeaders = [
  // Enforce HTTPS (1 year)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Prevent MIME type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Prevent Clickjacking
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Control referrer info
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Disable unused browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Allow Next.js inline scripts and scripts from trusted CDNs (Google Fonts)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Allow styles from self, Google Fonts, and inline styles
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Allow fonts from Google
      "font-src 'self' https://fonts.gstatic.com",
      // Allow images from self and data URIs (for SVGs/favicon)
      "img-src 'self' data: blob:",
      // Allow API connections to own domain and backend
      "connect-src 'self' https://rivolo.onrender.com https://*.onrender.com http://localhost:5000",
      // Block all objects/embeds
      "object-src 'none'",
      // Block framing
      "frame-ancestors 'none'",
      // Upgrade insecure requests in production
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  // Reduce attack surface by removing the X-Powered-By header
  poweredByHeader: false,
};

export default nextConfig;
