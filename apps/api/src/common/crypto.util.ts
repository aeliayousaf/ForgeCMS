import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// AES-256-GCM encryption for sensitive settings (e.g. AI API keys) at rest.
// Key derived from SETTINGS_ENCRYPTION_KEY env var.
function key(): Buffer {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY ?? "forgecms-dev-insecure-key";
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), enc.toString("hex")].join(":");
}

export function decryptSecret(payload: string): string {
  try {
    const [ivHex, tagHex, dataHex] = payload.split(":");
    if (!ivHex || !tagHex || !dataHex) return "";
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}
