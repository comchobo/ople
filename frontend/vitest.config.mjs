import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.{test,spec}.{js,jsx,ts,tsx,mjs,cjs}"],
    exclude: ["**/node_modules/**", "**/.venv/**", "**/dist/**"],
  },
});
