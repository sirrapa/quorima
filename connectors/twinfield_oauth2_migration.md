# Twinfield connector — migratie naar OAuth2 (vervangt Path A)

**Datum:** 14 juni 2026
**Aanleiding:** De live `twinfield:test` met de oude SOAP `Session.Logon` (user `APARRIS` + Webservice key) werd geweigerd met `OAuth2AuthenticationRequired`. Twinfield/Wolters Kluwer heeft de legacy username/password-logon voor organisatie `KUBUSALKMAAR` uitgezet. **Path A (Webservice key via SOAP-logon) is daarmee dood.** Alle toegang loopt nu via OpenID Connect.

> De Webservice key is niet meer bruikbaar en hoeft niet bewaard te blijven. Niets in `.env` kan dit fixen zonder OAuth.

---

## Wat er technisch verandert

Niet veel — de refactor is bewust contained. Alle `ProcessXmlString`-queries en parsers blijven 1-op-1 staan; alleen de **auth-laag** is omgezet:

| Oud (dood) | Nieuw (OAuth2) |
|---|---|
| `Session.Logon(user, password, org)` → SessionID | authorization-code grant → refresh_token → access_token |
| cluster uit logon-respons | `accesstokenvalidation` → `twf.clusterUrl` |
| SOAP-header `SessionID` | SOAP-header `AccessToken` + `CompanyCode` (= office) |

Bestanden: `src/adapters/twinfield/oauth.ts` (nieuw), `adapter.ts` (auth-laag om), `cli/twinfield-auth.ts` (nieuw, eenmalige consent), `cli/twinfield-test.ts` (herschreven).

### OpenID Connect endpoints (uit de discovery van login.twinfield.com)
- Authorize: `https://login.twinfield.com/auth/authentication/connect/authorize`
- Token: `https://login.twinfield.com/auth/authentication/connect/token`
- Token-validatie (cluster): `https://login.twinfield.com/auth/authentication/connect/accesstokenvalidation?token=…`
- Scopes: `openid twf.organisationUser twf.organisation offline_access`
- Grant: `authorization_code` (eenmalig, interactief) + `refresh_token` (headless, elke run)

---

## De enige horde: een OAuth-app registreren bij Twinfield

OAuth2 vereist een geregistreerde client (`client_id` + `client_secret`) met een vaste `redirect_uri`. Dit moet bij Twinfield/Wolters Kluwer aangevraagd worden — dat is de doorlooptijd-stap.

**Aanvraag (developer-portal of mail naar `support@twinfield.com`):**

> Onderwerp: Aanvraag OAuth2-client voor organisatie KUBUSALKMAAR
>
> Graag een OAuth2 (OpenID Connect) client registreren voor een eigen, read-only integratie (Quorima) op organisatie **KUBUSALKMAAR**.
> - Redirect URI: `http://localhost:8080/callback` (lokaal); later ook een productie-URI
> - Grant type: authorization code + refresh token (offline_access)
> - Scopes: `openid twf.organisationUser twf.organisation offline_access`
> - Toegang tot administraties: 21005 (ICT), 21006 (Holding), 21007 (Vastgoed)
> Graag `client_id` + `client_secret` retour.

Verwacht een paar werkdagen. (De discovery toont ook `client_credentials` als grant; dat vereist server-to-server provisioning zonder user-context — voor onze read-flow is authorization-code + refresh de standaard en betrouwbaarste route.)

---

## Live gaan zodra client_id/secret binnen zijn

1. Vul in `quorima-mvp/.env`:
   ```env
   TWINFIELD_CLIENT_ID=...
   TWINFIELD_CLIENT_SECRET=...
   TWINFIELD_REDIRECT_URI=http://localhost:8080/callback
   ```
2. Eenmalige autorisatie (opent browser, login als APARRIS, consent):
   ```bash
   cd quorima-mvp && npm run twinfield:auth
   ```
   → slaat het refresh_token op in `.twinfield-tokens.json` (gitignored).
3. Verifieer de koppeling (read-only: refresh → cluster → offices):
   ```bash
   npm run twinfield:test
   ```
4. Bij groen — eerste **live** Vastgoed daily flash (vereist ook `ANTHROPIC_API_KEY`):
   ```bash
   npm run flash
   ```

De daily flash refresht daarna zelf het access_token; her-autoriseren is alleen nodig als het refresh_token verloopt of wordt ingetrokken.

---

## Fallback blijft beschikbaar

Als de OAuth-registratie lang duurt en er eerder echte cijfers nodig zijn, staat de gelaagde route uit `twinfield_fallback_options.md` klaar (bank-feed Ponto + maandelijkse PDF van Hilleke + eenmalige UI-export). Het port-adapter pattern maakt dat een config-switch, geen rewrite.
