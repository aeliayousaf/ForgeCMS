import { encryptSecret, decryptSecret } from "../src/common/crypto.util";

describe("settings encryption", () => {
  it("round-trips a secret value", () => {
    const secret = "sk-super-secret-api-key";
    const enc = encryptSecret(secret);
    expect(enc).not.toEqual(secret);
    expect(decryptSecret(enc)).toEqual(secret);
  });

  it("returns empty string for malformed payloads", () => {
    expect(decryptSecret("garbage")).toEqual("");
  });
});
