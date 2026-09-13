import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/server/env-schema";

describe("server environment", () => {
  it("accepts the minimum secure configuration", () => {
    expect(
      parseServerEnv({
        DATABASE_URL: "postgresql://localhost:5432/dealer",
        SESSION_SECRET: "a-secure-secret-with-at-least-32-characters",
      }),
    ).toMatchObject({ STORAGE_PROVIDER: "local" });
  });

  it("rejects a short session secret", () => {
    expect(() =>
      parseServerEnv({ DATABASE_URL: "postgresql://localhost/dealer", SESSION_SECRET: "short" }),
    ).toThrow("SESSION_SECRET");
  });
});
