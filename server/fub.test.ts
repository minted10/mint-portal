import { describe, it, expect } from "vitest";

describe("FUB API Key Validation", () => {
  it("should authenticate with FUB API and return user data", async () => {
    const apiKey = process.env.FUB_API_KEY;
    expect(apiKey).toBeTruthy();

    const res = await fetch("https://api.followupboss.com/v1/me", {
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
      },
    });

    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.email).toBeTruthy();
  });
});
