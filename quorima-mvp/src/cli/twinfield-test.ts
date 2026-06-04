#!/usr/bin/env node
// Quorima — Twinfield credentials test
//
// Doet *alleen* SOAP Logon + cluster discovery + listOffices.
// Geen ProcessXmlString, geen LLM call. Resultaat: heel snelle ja/nee
// of de service-account credentials werken, en zo niet: precies waarom.
//
// Usage:  npm run twinfield:test

import "dotenv/config";
import * as soap from "soap";

const LOGON_WSDL = "https://login.twinfield.com/webservices/session.asmx?wsdl";

const COLOR = {
  reset: "\x1b[0m",
  ok: "\x1b[32m",
  fail: "\x1b[31m",
  warn: "\x1b[33m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

const ok = (msg: string): void => console.log(`${COLOR.ok}✓${COLOR.reset} ${msg}`);
const fail = (msg: string): void => console.log(`${COLOR.fail}✗${COLOR.reset} ${msg}`);
const info = (msg: string): void => console.log(`  ${COLOR.dim}${msg}${COLOR.reset}`);
const warn = (msg: string): void => console.log(`${COLOR.warn}!${COLOR.reset} ${msg}`);

interface OfficeRecord {
  code: string;
  name: string;
  shortName?: string;
}

async function main(): Promise<void> {
  console.log(`${COLOR.bold}Quorima — Twinfield credentials test${COLOR.reset}\n`);

  // 1. Check env vars
  const org = process.env.TWINFIELD_ORGANISATION;
  const user = process.env.TWINFIELD_USER;
  const password = process.env.TWINFIELD_PASSWORD;

  if (!org || !user || !password) {
    fail("Missing required environment variables");
    if (!org) info("  TWINFIELD_ORGANISATION is empty (expected: KUBUSALKMAAR)");
    if (!user) info("  TWINFIELD_USER is empty (expected: quorima-svc or your service-account login)");
    if (!password) info("  TWINFIELD_PASSWORD is empty");
    info("");
    info("Fix: copy .env.example to .env and fill in the credentials.");
    process.exit(1);
  }

  ok(`env loaded — organisation=${org} user=${user} password=***`);

  // 2. Try the SOAP Logon
  let client: soap.Client;
  try {
    client = await soap.createClientAsync(LOGON_WSDL);
    ok(`SOAP client created (login.twinfield.com reachable)`);
  } catch (e) {
    fail(`Cannot reach Twinfield Logon WSDL`);
    info(`  ${(e as Error).message}`);
    info(`  → check internet connectivity / firewall rules. login.twinfield.com:443 must be open.`);
    process.exit(1);
  }

  let logonResult: { LogonResult: string; cluster?: string };
  try {
    const [result] = await client.LogonAsync({ user, password, organisation: org });
    logonResult = result;
  } catch (e) {
    fail(`Logon SOAP call failed: ${(e as Error).message}`);
    process.exit(1);
  }

  if (logonResult.LogonResult !== "Ok") {
    fail(`Logon rejected: ${logonResult.LogonResult}`);
    explainLogonError(logonResult.LogonResult);
    process.exit(1);
  }

  ok(`Logon successful`);
  const cluster = logonResult.cluster;
  if (!cluster) {
    fail(`No cluster returned`);
    info(`  → user heeft geen office-toewijzing. Zie service-account guide stap 5.`);
    process.exit(1);
  }
  ok(`Cluster: ${cluster}`);

  // 3. Get session id from response headers
  const headers = (client.lastResponseHeaders ?? "") as string;
  const sessionMatch = /SessionID=([^;]+)/.exec(headers);
  if (!sessionMatch) {
    fail(`Logon ok but no SessionID returned in cookie — unexpected`);
    process.exit(1);
  }
  const sessionId = sessionMatch[1]!;
  ok(`Session ID captured`);

  // 4. List offices via cluster's session.asmx
  const sessionWsdl = `${cluster}/webservices/session.asmx?wsdl`;
  let sessionClient: soap.Client;
  try {
    sessionClient = await soap.createClientAsync(sessionWsdl);
    sessionClient.addSoapHeader(
      { Header: { SessionID: sessionId } },
      "",
      "tw",
      "http://www.twinfield.com/",
    );
  } catch (e) {
    fail(`Cannot reach cluster session WSDL: ${(e as Error).message}`);
    process.exit(1);
  }

  let offices: OfficeRecord[] = [];
  try {
    // SelectCompany list — varies between Twinfield SOAP versions; try the most common
    const [response] = await sessionClient.GetCompaniesAsync({});
    offices = parseOffices(response);
  } catch (e) {
    // Fallback: try ListOffices via processxml
    try {
      const procClient = await soap.createClientAsync(`${cluster}/webservices/processxml.asmx?wsdl`);
      procClient.addSoapHeader(
        { Header: { SessionID: sessionId } },
        "",
        "tw",
        "http://www.twinfield.com/",
      );
      const [resp] = await procClient.ProcessXmlStringAsync({
        xmlRequest: "<list><type>offices</type></list>",
      });
      offices = parseOfficesFromXml(resp.ProcessXmlStringResult ?? "");
    } catch (e2) {
      fail(`Cannot list offices: ${(e2 as Error).message}`);
      info(`  Logon werkte maar offices ophalen niet — meestal:`);
      info(`  → Webservices-rol mist op de offices (zie guide stap 4-5)`);
      info(`  → of het API-pakket is niet geactiveerd op de organisatie (mail support@twinfield.com)`);
      process.exit(1);
    }
  }

  if (offices.length === 0) {
    fail(`Logon ok maar 0 offices zichtbaar`);
    info(`  → user heeft Webservices-rol op geen enkele administratie`);
    info(`  → fix: Twinfield Beheer → Gebruikers → ${user} → Offices tab → voeg 21005/21006/21007 toe`);
    process.exit(1);
  }

  ok(`Offices found: ${offices.length}`);
  for (const o of offices) {
    info(`    ${o.code.padEnd(8)}${o.name}`);
  }

  // 5. Verify expected offices for Sirrapa
  const expected: Record<string, string> = {
    [process.env.TWINFIELD_OFFICE_VASTGOED ?? "21007"]: "Sirrapa Vastgoed B.V.",
    [process.env.TWINFIELD_OFFICE_ICT ?? "21005"]: "Sirrapa (ICT) B.V.",
    [process.env.TWINFIELD_OFFICE_HOLDING ?? "21006"]: "Sirrapa Group Holding B.V.",
  };
  const found = new Set(offices.map((o) => o.code));
  const missing: string[] = [];
  for (const code of Object.keys(expected)) {
    if (!found.has(code)) missing.push(`${code} (${expected[code]})`);
  }

  if (missing.length > 0) {
    warn(`Some expected offices are not visible to this user:`);
    for (const m of missing) info(`    ${m}`);
    info(`  → fix: voeg deze offices toe aan ${user} in Twinfield Beheer (zie guide stap 5)`);
    info(`  → de daily flash kan dan deze entiteiten niet rapporteren`);
  } else {
    ok(`All three Sirrapa offices visible — Quorima is fully unblocked`);
  }

  // 6. Final
  console.log("");
  console.log(`${COLOR.bold}Result:${COLOR.reset} ${COLOR.ok}credentials werkend${COLOR.reset}`);
  console.log("");
  console.log(`Volgende stap: ${COLOR.bold}npm run flash${COLOR.reset} voor de eerste live daily flash digest.`);
  console.log(`(of ${COLOR.bold}npm run flash:dry-run${COLOR.reset} om de logica te testen zonder LLM-credit te gebruiken.)`);
}

function explainLogonError(code: string): void {
  const explanations: Record<string, string> = {
    InvalidCredentials:
      "  → user/password combinatie klopt niet. Check exact wachtwoord (special characters!) in 1Password.",
    NotAuthorised:
      "  → user heeft geen Webservices-rol op de organisatie. Zie guide stap 4.",
    OrganisationNotFound:
      "  → TWINFIELD_ORGANISATION code klopt niet — moet exact KUBUSALKMAAR zijn (case-sensitive?).",
    OrganisationExpired:
      "  → het Twinfield-pakket op deze organisatie is verlopen. Bel Twinfield support.",
  };
  const explanation = explanations[code];
  if (explanation) {
    info(explanation);
  } else {
    info(`  → onbekende code "${code}". Mail Twinfield support op support@twinfield.com.`);
  }
}

function parseOffices(response: unknown): OfficeRecord[] {
  // Twinfield SOAP response is loosely typed; pluck out company/office records
  const out: OfficeRecord[] = [];
  const obj = response as Record<string, unknown>;
  const result = obj.GetCompaniesResult as unknown;
  if (typeof result === "string") {
    return parseOfficesFromXml(result);
  }
  if (result && typeof result === "object") {
    const list = (result as { Company?: Array<{ Code: string; Name: string }> }).Company ?? [];
    for (const c of list) {
      out.push({ code: c.Code, name: c.Name });
    }
  }
  return out;
}

function parseOfficesFromXml(xml: string): OfficeRecord[] {
  const out: OfficeRecord[] = [];
  // Twinfield response: <office shortname="..." name="..." code="...">...</office>
  // also sometimes: <office><code>...</code><name>...</name></office>
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
  fail(`Unexpected error: ${(err as Error).message}`);
  if ((err as Error).stack) {
    info((err as Error).stack as string);
  }
  process.exit(1);
});
