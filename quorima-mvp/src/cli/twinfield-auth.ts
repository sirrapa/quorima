#!/usr/bin/env node
// Quorima — Twinfield OAuth2 eenmalige autorisatie.
//
// Doet de authorization-code grant: opent de Twinfield-consent in de browser,
// vangt de callback op localhost op, wisselt de code in voor tokens en slaat
// het refresh_token op in de lokale token-store. Daarna draait alles headless
// (de daily flash refresht zelf het access_token).
//
// Vereist in .env: TWINFIELD_CLIENT_ID, TWINFIELD_CLIENT_SECRET,
// TWINFIELD_REDIRECT_URI (moet exact matchen met wat bij Twinfield is
// geregistreerd, bv. http://localhost:8080/callback).
//
// Usage:  npm run twinfield:auth

import "dotenv/config";
import * as http from "node:http";
import { randomUUID } from "node:crypto";
import { exec } from "node:child_process";
import { resolve } from "node:path";
import {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  getClusterUrl,
  saveTokenStore,
  type OAuthClientConfig,
} from "../adapters/twinfield/oauth.js";

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) {
    console.error(`✗ Ontbrekende env: ${key} (vul .env in)`);
    process.exit(1);
  }
  return v;
}

async function main(): Promise<void> {
  const cfg: OAuthClientConfig = {
    clientId: requireEnv("TWINFIELD_CLIENT_ID"),
    clientSecret: requireEnv("TWINFIELD_CLIENT_SECRET"),
    redirectUri: requireEnv("TWINFIELD_REDIRECT_URI"),
  };
  const storePath = process.env.TWINFIELD_TOKEN_STORE ?? resolve(".twinfield-tokens.json");

  const redirect = new URL(cfg.redirectUri);
  const port = Number(redirect.port || "80");
  const state = randomUUID();
  const nonce = randomUUID();
  const authorizeUrl = buildAuthorizeUrl(cfg, { state, nonce });

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const returnedState = url.searchParams.get("state");

    if (!code && !error) {
      // favicon o.i.d. — negeer stil
      res.statusCode = 204;
      res.end();
      return;
    }

    void (async () => {
      try {
        if (error) throw new Error(`Twinfield consent geweigerd: ${error}`);
        if (returnedState !== state) throw new Error("state komt niet overeen (mogelijk CSRF) — afgebroken");

        const tokens = await exchangeCodeForTokens(cfg, code!);
        tokens.clusterUrl = await getClusterUrl(tokens.accessToken);
        await saveTokenStore(storePath, tokens);

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h2>Quorima ↔ Twinfield gekoppeld ✓</h2><p>Je kunt dit tabblad sluiten.</p>");

        console.log(`\n✓ Tokens opgeslagen in ${storePath}`);
        console.log(`✓ Cluster: ${tokens.clusterUrl}`);
        console.log(`\nVolgende stap: npm run twinfield:test`);
        server.close();
        process.exit(0);
      } catch (e) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`Fout: ${(e as Error).message}`);
        console.error(`\n✗ ${(e as Error).message}`);
        server.close();
        process.exit(1);
      }
    })();
  });

  server.listen(port, () => {
    console.log("Quorima — Twinfield OAuth2 autorisatie\n");
    console.log(`Luistert op ${cfg.redirectUri}`);
    console.log("\nOpen deze URL in je browser en log in als APARRIS:\n");
    console.log(authorizeUrl + "\n");
    // Probeer automatisch te openen (macOS); faalt stil op andere platforms.
    exec(`open "${authorizeUrl}"`, () => {});
  });
}

main().catch((err) => {
  console.error(`✗ Onverwachte fout: ${(err as Error).message}`);
  process.exit(1);
});
