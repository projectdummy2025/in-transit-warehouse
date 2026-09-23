import { describe, expect, it } from "bun:test";
import { createLpnCode, validateLpnCode } from "../src/utils/lpn-generator";

// Test suite for LPN Code generator utility
describe("LPN Generator", () => {
  it("should generate valid LPN code matching standard warehouse format", () => {
    const generatedCode = createLpnCode();
    expect(generatedCode).toStartWith("LPN-");
    expect(validateLpnCode(generatedCode)).toBe(true);
  });

  it("should format date segment properly for given date", () => {
    const fixedDate = new Date("2026-05-15T00:00:00Z");
    const generatedCode = createLpnCode(fixedDate);
    expect(generatedCode).toStartWith("LPN-20260515-");
    expect(validateLpnCode(generatedCode)).toBe(true);
  });

  it("should reject invalid LPN strings", () => {
    expect(validateLpnCode("INVALID-LPN-CODE")).toBe(false);
    expect(validateLpnCode("LPN-2026-ABCD")).toBe(false);
    expect(validateLpnCode("LPN-20260923-abc")).toBe(false);
  });
});
