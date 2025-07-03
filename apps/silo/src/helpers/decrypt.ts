import crypto from "crypto";
import { env } from "@/env";

// AES-256-GCM
const deriveKey = (): Buffer => {
  if (!env.AES_SECRET_KEY || !env.AES_SALT) {
    throw new Error("AES Secret or Salt is not set");
  }
  return crypto.pbkdf2Sync(env.AES_SECRET_KEY, env.AES_SALT, 100000, 32, "sha256");
};

type Encrypted = {
  iv: string;
  ciphertext: string;
  tag: string;
};

export function decryptAES(encrypted: Encrypted): string {
  const key = deriveKey();
  const iv = Buffer.from(encrypted.iv, "base64");
  const tag = Buffer.from(encrypted.tag, "base64");
  const ciphertext = Buffer.from(encrypted.ciphertext, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
