import { logInfo } from "./src/lib/logger";

/** Called once per Next.js server instance (Node.js and Edge runtimes). */
export function register() {
  logInfo("instrumentation", "server startup", {
    runtime: process.env.NEXT_RUNTIME ?? "unknown",
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  });
}
