"use client";

/**
 * Gets CSRF token from cookies on the client side
 */
export function getCSRFToken(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  const csrfCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("plico-csrf-token="),
  );

  if (!csrfCookie) return null;

  return csrfCookie.split("=")[1];
}

/**
 * Adds CSRF token to fetch headers
 */
export function addCSRFHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFToken();

  if (!token) {
    console.warn("CSRF token not found. Request may fail.");
    return headers;
  }

  return {
    ...headers,
    "x-csrf-token": token,
  };
}
