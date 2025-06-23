import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

const CSRF_COOKIE_NAME = "plico-csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generates a new CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Sets CSRF token in response cookies
 */
export function setCSRFToken(response: NextResponse): string {
  const token = generateCSRFToken();

  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Client needs to read this
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return token;
}

/**
 * Gets CSRF token from request cookies
 */
export function getCSRFTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Gets CSRF token from request header
 */
export function getCSRFTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_HEADER_NAME);
}

/**
 * Validates CSRF token for a request
 */
export function validateCSRFToken(request: NextRequest): boolean {
  const cookieToken = getCSRFTokenFromCookie(request);
  const headerToken = getCSRFTokenFromHeader(request);

  // Both must exist and match
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return cookieToken === headerToken;
}

/**
 * Middleware to check CSRF token - returns error response if invalid
 */
export function requireCSRFToken(request: NextRequest): NextResponse | null {
  if (!validateCSRFToken(request)) {
    return NextResponse.json(
      {
        error: "Invalid CSRF token",
        message:
          "This request requires a valid CSRF token. Please refresh the page and try again.",
      },
      { status: 403 },
    );
  }

  return null; // Token is valid
}
