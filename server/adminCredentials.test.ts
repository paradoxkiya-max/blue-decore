import { describe, expect, it } from "vitest";
import { getHardcodedAdminEmail, isValidAdminCredentials } from "./adminCredentials";

describe("hardcoded admin credentials", () => {
  it("accepts the configured admin credentials", () => {
    expect(isValidAdminCredentials(getHardcodedAdminEmail(), "12345678")).toBe(true);
    expect(isValidAdminCredentials("TADI@GMAIL.COM", "12345678")).toBe(true);
  });

  it("rejects invalid passwords and email addresses", () => {
    expect(isValidAdminCredentials(getHardcodedAdminEmail(), "wrong-password")).toBe(false);
    expect(isValidAdminCredentials("other@example.com", "12345678")).toBe(false);
  });
});
