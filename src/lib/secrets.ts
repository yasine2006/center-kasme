import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

const PLACEHOLDERS = new Set([
  "changer-ceci-par-une-chaine-aleatoire-forte",
  "changer-ceci-par-une-autre-chaine-aleatoire-forte",
  "MotDePasseFort123!",
]);

/** Read a required secret and refuse the weak values shipped in `.env.example`. */
export function requireSecret(name: "AUTH_SECRET" | "CRON_SECRET"): string {
  const secret = process.env[name];
  if (!secret) throw new Error(`${name} is not set`);
  if (secret.length < 32 || PLACEHOLDERS.has(secret)) {
    throw new Error(`${name} must be a random secret of at least 32 characters`);
  }
  return secret;
}

/** Constant-time comparison for bearer tokens / cron secrets. */
export function safeEqual(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}
