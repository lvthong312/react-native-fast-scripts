#!/usr/bin/env node
import { fileURLToPath } from "url";
import path from "path";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [, , cmd, ...args] = process.argv;

if (cmd === "gen:theme") {
  const scriptPath = path.join(__dirname, "generate-theme.js");
  spawn("node", [scriptPath, ...args], { stdio: "inherit" });
} else if (cmd === "gen:storage") {
  const scriptPath = path.join(__dirname, "generate-storage.js");
  spawn("node", [scriptPath, ...args], { stdio: "inherit" });
} else if (cmd === "gen:images") {
  const scriptPath = path.join(__dirname, "generate-images.js");
  spawn("node", [scriptPath, ...args], { stdio: "inherit" });
} else if (cmd === "gen:svgs") {
  const scriptPath = path.join(__dirname, "generate-svgs.js");
  spawn("node", [scriptPath, ...args], { stdio: "inherit" });
} else if (cmd === "gen:errors") {
  const scriptPath = path.join(__dirname, "generate-errors.js");
  spawn("node", [scriptPath, ...args], { stdio: "inherit" });
} else {
  console.log(`❌ Unknown command: ${cmd}`);
  console.log(`Available: gen:theme`);
}
