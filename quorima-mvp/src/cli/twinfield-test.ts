#!/usr/bin/env node
// Quorima — Twinfield OAuth2 connectie-test.
//
// Verifieert de hele keten read-only: refresh_token → access_token →
// cluster discovery → processxml offices-lijst. Geen LLM, geen schrijfacties.
//
// Vereist dat `npm run twinfield:auth` ooit een refresh_token heeft opgeslagen.
//
// Usage:  npm run twinfield:test

import "dotenv/config";
import { resolve } from "node:path";
import * as soap from "soap";
import { getValidAccessContext, type OAuthClientConfig } from "../adapters/twinfield/oauth.js";

const COLOR = {
  reset: "\x1b[0m",
  ok: "\x1b[32m",
  fail: "\x1b[31m",
  warn: "\x1b[33m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};
const ok = (m: string): void => console.log(`${COLOR.ok}✓${COLOR.reset} ${m}`);
const fail = (m: string): void => console.log(`${COLOR.fail}✗${COLOR.reset} ${m}`);
const info = (m: string): void => console.log(`  ${COLOR.dim}${m}${COLOR.reset}`);
const warn = (m: string): void => console.log(`${COLOR.warn}!${COLOR.reset} ${m}`);

interface OfficeRecord {
  code: string;
  name: string;
}

async function main(): Promise<void> {
  console.log(`${COLOR.bold}Quorima — Twinfield OAuth2 connectie-test${COLOR.reset}\n`);

  // 1. Client-config uit env
  const clientId = process.env.TWINFIELD_CLIENT_ID;
  const clientSecret = process.env.TWINFIELD_CLIENT_SECRET;
  const redirectUri = process.env.TWINFIELD_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    fail("Ontbrekende OAuth-config in .env");
    if (!clientId) info("TWINFIELD_CLIENT_ID is leeg");
    if (!clientSecret) info("TWINFIELD_CLIENT_SECRET is leeg");
    if (!redirectUri) info("TWINFIELD_REDIRECT_URI is leeg");
    info("");
    info("Registreer een OAuth-app bij Twinfield, vul .env, draai dan: npm run twinfield:auth");
    process.exit(1);
  }
  const cfg: OAuthClientConfig = { clientId, clientSecret, redirectUri };
  const storePath = process.env.TWINFIELD_TOKEN_STORE ?? resolve(".twinfield-tokens.json");
  ok(`OAuth-config geladen — client_id=${clientId.slice(0, 6)}… redirect=${redirectUri}`);

  // 2. Token refresh + cluster discovery
  let accessToken: string;
  let clusterUrl: string;
  try {
    const ctx = await getValidAccessContext(cfg, storePath);
    accessToken = ctx.accessToken;
    clusterUrl = ctx.clusterUrl;
  } catch (e) {
    fail(`Kon geen geldig access_token verkrijgen: ${(e as Error).message}`);
    info("→ Heb je de eenmalige autorisatie al gedaan? Draai: npm run twinfield:auth");
    process.exit(1);
  }
  ok("Access token verkregen (refresh werkt)");
  ok(`Cluster: ${clusterUrl}`);

  // 3. Offices ophalen via processxml
  let client: soap.Client;
  try {
    client = await soap.createClientAsync(`${clusterUrl}/webservices/processxml.asmx?wsdl`);
    client.addSoapHeader({ Header: { AccessToken: accessToken } }, "", "tw", "http://www.twinfield.com/");
  } catch (e) {
    fail(`Kan processxml-WSDL niet laden: ${(e as Error).message}`);
    process.exit(1);
  }

  let offices: OfficeRecord[] = [];
  try {
    const [resp] = await client.ProcessXmlStringAsync({
      xmlRequest: "<list><type>offices</type></list>",
    });
    offices = parseOfficesFromXml(resp.ProcessXmlStringResult ?? "");
  } catch (e) {
    fail(`Offices ophalen mislukt: ${(e as Error).message}`);
    info("→ access_token werkt maar de scope/rechten dekken processxml niet.");
    info("  Controleer scopes (twf.organisationUser) en dat de user toegang heeft tot de admins.");
    process.exit(1);
  }

  if (offices.length === 0) {
    fail("0 offices zichtbaar voor deze user");
    process.exit(1);
  }
  ok(`Offices gevonden: ${offices.length}`);
  for (const o of offices) info(`  ${o.code.padEnd(8)}${o.name}`);

  // 4. Verwachte Sirrapa-offices
  const expected: Record<string, string> = {
    [process.env.TWINFIELD_OFFICE_VASTGOED ?? "21007"]: "Sirrapa Vastgoed B.V.",
    [process.env.TWINFIELD_OFFICE_ICT ?? "21005"]: "Sirrapa (ICT) B.V.",
    [process.env.TWINFIELD_OFFICE_HOLDING ?? "21006"]: "Sirrapa Group Holding B.V.",
  };
  const found = new Set(offices.map((o) => o.code));
  const missing = Object.keys(expected).filter((c) => !found.has(c));
  if (missing.length > 0) {
    warn("Niet alle verwachte offices zichtbaar:");
    for (const m of missing) info(`  ${m} (${expected[m]})`);
  } else {
    ok("Alle drie Sirrapa-offices zichtbaar — Quorima is volledig gekoppeld");
  }

  console.log("");
  console.log(`${COLOR.bold}Resultaat:${COLOR.reset} ${COLOR.ok}OAuth2-koppeling werkend${COLOR.reset}`);
  console.log(`\nVolgende stap: ${COLOR.bold}npm run flash${COLOR.reset} voor de eerste live daily flash.`);
}

function parseOfficesFromXml(xml: string): OfficeRecord[] {
  const out: OfficeRecord[] = [];
  const officeRe = /<office[^>]*?(?:code="([^"]+)")?[^>]*>([\s\S]*?)<\/office>/g;
  let match: RegExpExecArray | null;
  while ((match = officeRe.exec(xml)) !== null) {
    const codeAttr = match[1];
    const inner = match[2] ?? "";
    const codeInner = /<code>([^<]+)<\/code>/.exec(inner)?.[1];
    const nameInner = /<name>([^<]+)<\/name>/.exec(inner)?.[1];
    const nameAttr = /name="([^"]+)"/.exec(match[0])?.[1];
    const code = codeAttr ?? codeInner ?? "";
    const name = nameInner ?? nameAttr ?? code;
    if (code) out.push({ code, name });
  }
  return out;
}

main().catch((err) => {
  fail(`Onverwachte fout: ${(err as Error).message}`);
  process.exit(1);
});
