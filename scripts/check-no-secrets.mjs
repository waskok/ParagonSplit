#!/usr/bin/env node
/**
 * Sprawdza, czy w śledzonych plikach git nie ma przypadkowych sekretów.
 * Uruchom przed push na publiczny repo: node scripts/check-no-secrets.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const patterns = [
  { name: "Google API key", regex: /AIza[0-9A-Za-z_-]{20,}/ },
  {
    name: "Neon/Postgres URL with password",
    regex: /postgresql:\/\/[^:]+:[^@\s]+@(?!localhost|127\.0\.0\.1)/i
  },
  { name: "Private key block", regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ }
];

const blockedFiles = [".env", "backend/.env", "frontend/.env"];

const trackedSet = new Set(
  execSync("git ls-files", { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
);

for (const file of blockedFiles) {
  if (trackedSet.has(file)) {
    console.error(`❌ Plik ${file} jest śledzony przez git — usuń go: git rm --cached ${file}`);
    process.exit(1);
  }
}

const trackedFiles = [...trackedSet]
  .filter((file) => !file.endsWith(".env.example") && !file.includes("check-no-secrets"));

let failed = false;

for (const file of trackedFiles) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const { name, regex } of patterns) {
    if (regex.test(content)) {
      console.error(`❌ ${name} — podejrzana treść w: ${file}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error("\nPush zablokowany — usuń sekrety z plików lub dodaj do .gitignore.");
  process.exit(1);
}

console.log("✅ Brak oczywistych sekretów w śledzonych plikach git.");
