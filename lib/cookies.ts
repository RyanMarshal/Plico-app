const COOKIE_PREFIX = "plico_voted_";

export function setVotedCookie(pollId: string): void {
  if (typeof window === "undefined") return;

  const cookieName = `${COOKIE_PREFIX}${pollId}`;
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  document.cookie = `${cookieName}=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
}

export function hasVoted(pollId: string): boolean {
  if (typeof window === "undefined") return false;

  const cookieName = `${COOKIE_PREFIX}${pollId}`;
  const cookies = document.cookie.split(";");

  return cookies.some((cookie) => {
    const [name] = cookie.trim().split("=");
    return name === cookieName;
  });
}

export function clearVotedCookie(pollId: string): void {
  if (typeof window === "undefined") return;

  const cookieName = `${COOKIE_PREFIX}${pollId}`;
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}
