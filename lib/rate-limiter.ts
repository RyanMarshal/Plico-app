// Simple in-memory rate limiter for voting
// In production, use Redis or Upstash for distributed rate limiting

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

// Store rate limit data in memory (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    rateLimitStore.forEach((entry, key) => {
      if (entry.firstRequest < oneHourAgo) {
        rateLimitStore.delete(key);
      }
    });
  },
  5 * 60 * 1000,
);

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000, // 1 minute
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    // First request
    rateLimitStore.set(identifier, { count: 1, firstRequest: now });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  const timeSinceFirst = now - entry.firstRequest;

  if (timeSinceFirst > windowMs) {
    // Window has passed, reset
    rateLimitStore.set(identifier, { count: 1, firstRequest: now });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.firstRequest + windowMs,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.firstRequest + windowMs,
  };
}

// Get client IP address from request headers
export function getClientIp(request: Request): string {
  // Vercel automatically sets the client IP in the 'x-real-ip' header
  // https://vercel.com/docs/edge-network/headers#x-real-ip
  const vercelIp = request.headers.get("x-real-ip");
  if (vercelIp) {
    return vercelIp;
  }

  // Cloudflare sets the client IP in 'cf-connecting-ip'
  const cloudflareIp = request.headers.get("cf-connecting-ip");
  if (cloudflareIp) {
    return cloudflareIp;
  }

  // Standard x-forwarded-for header (used by many proxies)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs: client, proxy1, proxy2, ...
    // The first IP is typically the original client
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    // Filter out private IPs and take the first public IP
    const publicIp = ips.find((ip) => !isPrivateIp(ip));
    return publicIp || ips[0];
  }

  // Fallback to x-forwarded-host for some proxy configurations
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    return forwardedHost.split(",")[0].trim();
  }

  // If all else fails, use a hash of user agent + accept headers as identifier
  // This provides some level of client differentiation even without IP
  const userAgent = request.headers.get("user-agent") || "";
  const accept = request.headers.get("accept") || "";
  const fallbackId = `fallback-${hashString(userAgent + accept)}`;

  return fallbackId;
}

// Check if an IP address is private (RFC 1918)
function isPrivateIp(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;

  const first = parseInt(parts[0], 10);
  const second = parseInt(parts[1], 10);

  // 10.0.0.0 - 10.255.255.255
  if (first === 10) return true;

  // 172.16.0.0 - 172.31.255.255
  if (first === 172 && second >= 16 && second <= 31) return true;

  // 192.168.0.0 - 192.168.255.255
  if (first === 192 && second === 168) return true;

  // 127.0.0.0 - 127.255.255.255 (loopback)
  if (first === 127) return true;

  return false;
}

// Simple hash function for creating identifiers
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Specific rate limiter for poll creation: 5 polls per minute
export function checkRateLimitCreatePoll(request: Request) {
  const clientIp = getClientIp(request);
  const identifier = `create_poll:${clientIp}`;
  
  // 5 polls per minute
  const result = checkRateLimit(identifier, 5, 60 * 1000);
  
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    retryAfter: result.resetAt - Date.now(),
  };
}
