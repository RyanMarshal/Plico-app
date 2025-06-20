// Simple in-memory rate limiter for voting
// In production, use Redis or Upstash for distributed rate limiting

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

// Store rate limit data in memory (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  
  rateLimitStore.forEach((entry, key) => {
    if (entry.firstRequest < oneHourAgo) {
      rateLimitStore.delete(key);
    }
  });
}, 5 * 60 * 1000);

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000 // 1 minute
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  if (!entry) {
    // First request
    rateLimitStore.set(identifier, { count: 1, firstRequest: now });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }
  
  const timeSinceFirst = now - entry.firstRequest;
  
  if (timeSinceFirst > windowMs) {
    // Window has passed, reset
    rateLimitStore.set(identifier, { count: 1, firstRequest: now });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }
  
  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetAt: entry.firstRequest + windowMs };
  }
  
  // Increment count
  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.firstRequest + windowMs };
}

// Get client IP address from request headers
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a generic identifier
  return 'anonymous';
}