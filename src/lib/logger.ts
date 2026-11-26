export type LogLevel = "error" | "warn" | "info";
export type LogContext = Record<string, unknown>;
export type NormalizedError = {
  name: string;
  message: string;
  stack?: string;
};

export const REQUEST_ID_HEADER = "x-request-id";

const SENSITIVE_KEY =
  /(authorization|cookie|secret|token|password|passwd|api[-_]?key|access[-_]?key|private[-_]?key|credential|session)/i;
const HEADER_KEY = /^(headers?|requestheaders|responseheaders)$/i;
const REDACTED = "[redacted]";

/** Server- and client-safe correlation id (Node 20+/modern browsers). */
export function createRequestId(): string {
  return globalThis.crypto.randomUUID();
}

/** Accept any thrown value and reduce it to a stable, loggable shape. */
export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || "Unknown error",
      ...(error.stack ? { stack: error.stack } : {}),
    };
  }

  if (typeof error === "object" && error !== null) {
    const value = error as Record<string, unknown>;
    const name = typeof value.name === "string" && value.name ? value.name : "Error";
    const message =
      typeof value.message === "string" && value.message ? value.message : "Unknown error";
    const stack = typeof value.stack === "string" && value.stack ? value.stack : undefined;
    return { name, message, ...(stack ? { stack } : {}) };
  }

  const message =
    typeof error === "string" && error ? error : String(error) || "Unknown error";
  return { name: "Error", message };
}

function sanitize(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) return value;

  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean") return value;
  if (type === "bigint" || type === "symbol" || type === "function") return String(value);
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    if (seen.has(value)) return "[circular]";
    seen.add(value);
    if (depth >= 3) return "[truncated]";
    const result = value.slice(0, 50).map((item) => sanitize(item, depth + 1, seen));
    seen.delete(value);
    return result;
  }

  if (type === "object") {
    const object = value as object;
    if (seen.has(object)) return "[circular]";
    seen.add(object);
    if (depth >= 3) return "[truncated]";
    const result: LogContext = {};
    for (const [key, item] of Object.entries(value as LogContext)) {
      // Never emit full header bags, even if a caller passes one in.
      if (HEADER_KEY.test(key)) continue;
      if (SENSITIVE_KEY.test(key)) {
        result[key] = REDACTED;
        continue;
      }
      result[key] = sanitize(item, depth + 1, seen);
    }
    seen.delete(object);
    return result;
  }

  return String(value);
}

function write(level: LogLevel, scope: string, message: string, context?: LogContext): void {
  const base = { timestamp: new Date().toISOString(), level, scope, message };
  let entry: Record<string, unknown> = base;
  if (context && Object.keys(context).length > 0) {
    entry = { ...base, context: sanitize(context, 0, new WeakSet()) };
  }

  let line: string;
  try {
    // JSON.stringify escapes newlines, so each record stays on one line.
    line = JSON.stringify(entry);
  } catch {
    line = JSON.stringify({ ...base, context: "[unserializable context omitted]" });
  }

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function logError(scope: string, error: unknown, context?: LogContext): void {
  const normalized = normalizeError(error);
  write("error", scope, normalized.message, { ...context, error: normalized });
}

export function logWarn(scope: string, message: string, context?: LogContext): void {
  write("warn", scope, message, context);
}

export function logInfo(scope: string, message: string, context?: LogContext): void {
  write("info", scope, message, context);
}
