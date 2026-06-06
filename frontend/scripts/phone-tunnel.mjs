import { spawn } from "node:child_process";

console.log(`
ParagonSplit — tunel HTTPS na telefon (PWA standalone)

Wymagane w osobnych terminalach:
  1) cd backend  && npm run dev
  2) cd frontend && npm run dev:phone
     (frontend/.env → VITE_API_URL=  puste, albo zakomentowane)
  3) ten skrypt (tunel)

Po starcie skopiuj link https://....trycloudflare.com na telefon.
Chrome Android → menu → „Zainstaluj aplikację” (nie sam skrót).
Uruchamiaj potem z ikonki — bez paska adresu.

`);

const child = spawn(
  "npx",
  ["--yes", "cloudflared", "tunnel", "--url", "http://127.0.0.1:5173"],
  { stdio: "inherit", shell: true }
);

child.on("exit", (code) => process.exit(code ?? 0));
