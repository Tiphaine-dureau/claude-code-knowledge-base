// Lance un serveur MCP via npx, sur Windows comme sur Linux (cloud).
// Usage : node scripts/run-mcp.mjs <paquet> [arguments…]
import { spawn } from "node:child_process";

const child = spawn("npx", ["-y", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (err) => {
  console.error(err.message);
  process.exit(1);
});
