// Twinfield OAuth2 / OpenID Connect helper.
//
// Twinfield heeft de oude SOAP Session.Logon (user + Webservice key) uitgezet;
// een logon-poging geeft nu `OAuth2AuthenticationRequired`. Alle toegang loopt
// via OpenID Connect (authorization-code grant + refresh-token).
//
// Flow:
//   1. (eenmalig) Authorization-code grant in de browser → refresh_token.
//      Zie `npm run twinfield:auth`.
//   2. (elke run) refresh_token → access_token (geldig ~1u).
//   3. access_token → `accesstokenvalidation` geeft de twf.clusterUrl terug.
//   4. SOAP processxml-call op die cluster met AccessToken + CompanyCode in
//      de SOAP-header (zie adapter.ts).
//
// Endpoints uit de OpenID discovery van login.twinfield.com.

import { readFile, writeFile } from "node:fs/promises";

const BASE = "https://login.twinfield.com/auth/authentication/connect";
export const AUTHORIZE_ENDPOINT = `${BASE}/authorize`;
export const TOKEN_ENDPOINT = `${BASE}/token`;
export const VALIDATION_ENDPOINT = `${BASE}/accesstokenvalidation`;

// twf.organisationUser is verplicht om in te loggen; twf.organisation bevat de
// cluster/org-claims; offline_access levert het refresh_token.
export const SCOPES = "openid twf.organisationUser twf.organisation offline_access";

export interface OAuthClientConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  /** epoch ms waarop het access_token verloopt */
  expiresAt: number;
  /** gecachte cluster-URL hoort bij dit access_token */
  clusterUrl?: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface AccessContext {
  accessToken: string;
  clusterUrl: string;
}

// ─── Authorization-code grant (eenmalig, interactief) ──────────────────

export function buildAuthorizeUrl(
  cfg: OAuthClientConfig,
  opts: { state: string; nonce: string },
): string {
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: SCOPES,
    state: opts.state,
    nonce: opts.nonce,
  });
  return `${AUTHORIZE_ENDPOINT}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  cfg: OAuthClientConfig,
  code: string,
): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUri,
  });
  const res = await postToken(cfg, body);
  if (!res.refresh_token) {
    throw new Error(
      "Geen refresh_token terug — vraag de 'offline_access' scope aan en herhaal consent.",
    );
  }
  return {
    accessToken: res.access_token,
    refreshToken: res.refresh_token,
    expiresAt: Date.now() + res.expires_in * 1000,
  };
}

// ─── Refresh-token grant (elke run, headless) ──────────────────────────

export async function refreshTokens(
  cfg: OAuthClientConfig,
  refreshToken: string,
): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await postToken(cfg, body);
  return {
    accessToken: res.access_token,
    // Twinfield kan een geroteerd refresh_token teruggeven; val terug op het oude.
    refreshToken: res.refresh_token ?? refreshToken,
    expiresAt: Date.now() + res.expires_in * 1000,
  };
}

async function postToken(cfg: OAuthClientConfig, body: URLSearchParams): Promise<TokenResponse> {
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Twinfield token-endpoint ${res.status}: ${text}`);
  }
  return JSON.parse(text) as TokenResponse;
}

// ─── Access-token validatie → cluster discovery ────────────────────────

export async function getClusterUrl(accessToken: string): Promise<string> {
  const url = `${VALIDATION_ENDPOINT}?token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Twinfield accesstokenvalidation ${res.status}: ${text}`);
  }
  const cluster = extractClaim(JSON.parse(text), "twf.clusterUrl");
  if (!cluster) {
    throw new Error("accesstokenvalidation gaf geen twf.clusterUrl terug");
  }
  return cluster.replace(/\/+$/, "");
}

/**
 * De validation-respons is afhankelijk van de Twinfield-versie ofwel een plat
 * claims-object ({ "twf.clusterUrl": "..." }) ofwel een array van
 * { type, value }. Beide vormen worden hier ondersteund.
 */
function extractClaim(payload: unknown, claim: string): string | undefined {
  if (Array.isArray(payload)) {
    const hit = payload.find(
      (c) => c && typeof c === "object" && (c as { type?: string }).type === claim,
    ) as { value?: string } | undefined;
    return hit?.value;
  }
  if (payload && typeof payload === "object") {
    const v = (payload as Record<string, unknown>)[claim];
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}

// ─── Token-store (lokaal, gitignored) ──────────────────────────────────

export async function loadTokenStore(path: string): Promise<TokenSet | null> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as TokenSet;
  } catch {
    return null;
  }
}

export async function saveTokenStore(path: string, tokens: TokenSet): Promise<void> {
  await writeFile(path, JSON.stringify(tokens, null, 2), { mode: 0o600 });
}

/**
 * Levert een geldig access_token + clusterUrl op. Refresht headless wanneer het
 * access_token (bijna) verlopen is en persisteert het resultaat. Vereist dat
 * `npm run twinfield:auth` ooit een refresh_token heeft opgeslagen.
 */
export async function getValidAccessContext(
  cfg: OAuthClientConfig,
  storePath: string,
): Promise<AccessContext> {
  const stored = await loadTokenStore(storePath);
  if (!stored) {
    throw new Error(
      `Geen token-store op ${storePath}. Draai eerst eenmalig: npm run twinfield:auth`,
    );
  }

  const stillValid = stored.accessToken && stored.expiresAt - Date.now() > 60_000;
  if (stillValid && stored.clusterUrl) {
    return { accessToken: stored.accessToken, clusterUrl: stored.clusterUrl };
  }

  const refreshed = await refreshTokens(cfg, stored.refreshToken);
  refreshed.clusterUrl = await getClusterUrl(refreshed.accessToken);
  await saveTokenStore(storePath, refreshed);
  return { accessToken: refreshed.accessToken, clusterUrl: refreshed.clusterUrl };
}
