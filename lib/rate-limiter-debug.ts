// Debug utility for rate limiter IP detection
// This helps verify IP detection in production

export function debugClientIp(request: Request): {
  detectedIp: string;
  headers: Record<string, string | null>;
  method: string;
} {
  const headers = {
    "x-real-ip": request.headers.get("x-real-ip"),
    "x-forwarded-for": request.headers.get("x-forwarded-for"),
    "cf-connecting-ip": request.headers.get("cf-connecting-ip"),
    "x-forwarded-host": request.headers.get("x-forwarded-host"),
    "user-agent": request.headers.get("user-agent"),
  };

  // Import the actual function to test it
  const { getClientIp } = require("./rate-limiter");
  const detectedIp = getClientIp(request);

  // Determine which method was used
  let method = "unknown";
  if (headers["x-real-ip"] && detectedIp === headers["x-real-ip"]) {
    method = "x-real-ip (Vercel)";
  } else if (
    headers["cf-connecting-ip"] &&
    detectedIp === headers["cf-connecting-ip"]
  ) {
    method = "cf-connecting-ip (Cloudflare)";
  } else if (
    headers["x-forwarded-for"] &&
    detectedIp.includes(headers["x-forwarded-for"].split(",")[0].trim())
  ) {
    method = "x-forwarded-for";
  } else if (detectedIp.startsWith("fallback-")) {
    method = "fallback (user-agent hash)";
  }

  return {
    detectedIp,
    headers,
    method,
  };
}
