import path from "node:path";
import { defineConfig } from "vitest/config";

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: [
      { find: "@/lib/db", replacement: path.resolve(root, "tests/stubs/db.ts") },
      { find: "server-only", replacement: path.resolve(root, "tests/stubs/server-only.ts") },
      { find: "@", replacement: path.resolve(root, "src") },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
