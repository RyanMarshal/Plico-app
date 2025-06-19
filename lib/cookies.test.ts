import { setVotedCookie, hasVoted, clearVotedCookie } from "./cookies";

describe("Cookie utility functions", () => {
  beforeEach(() => {
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.trim().split("=");
      if (name.startsWith("plico_voted_")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      }
    });
  });

  describe("setVotedCookie", () => {
    it("should set a cookie for the given poll ID", () => {
      const pollId = "test-poll-123";
      setVotedCookie(pollId);

      expect(document.cookie).toContain(`plico_voted_${pollId}=true`);
    });
  });

  describe("hasVoted", () => {
    it("should return false if no cookie exists", () => {
      expect(hasVoted("test-poll-123")).toBe(false);
    });

    it("should return true if cookie exists", () => {
      const pollId = "test-poll-123";
      setVotedCookie(pollId);

      expect(hasVoted(pollId)).toBe(true);
    });

    it("should not conflict with other poll cookies", () => {
      setVotedCookie("poll-1");
      setVotedCookie("poll-2");

      expect(hasVoted("poll-1")).toBe(true);
      expect(hasVoted("poll-2")).toBe(true);
      expect(hasVoted("poll-3")).toBe(false);
    });
  });

  describe("clearVotedCookie", () => {
    it("should remove the cookie for the given poll ID", () => {
      const pollId = "test-poll-123";
      setVotedCookie(pollId);
      expect(hasVoted(pollId)).toBe(true);

      clearVotedCookie(pollId);
      expect(hasVoted(pollId)).toBe(false);
    });
  });
});
