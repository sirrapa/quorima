# Quorima — Twinfield & Xero connector setup

**Versie:** v0.1 · 26 april 2026
**Voor wie:** Integrator die een nieuwe Quorima tenant aanmaakt en de boekhoud-connectors live moet krijgen.
**Scope:** Twinfield (NL administraties) + Xero (UK Ltd) — de twee accounting-systemen die Sirrapa gebruikt.

---

## 1. Twinfield connector

Twinfield is een online boekhoudpakket van Wolters Kluwer met een SOAP + REST API. Voor Quorima gebruiken we de REST API waar mogelijk.

### 1.1 Wat de integrator nodig heeft van de klant

| Item | Waar te vinden | Voorbeeld |
|---|---|---|
| **Twinfield administratie-code** per BV | Twinfield → Settings → Office | `S0001234`, `S0005678` |
| **Twinfield organisatie-code** | Twinfield → Settings → Organisation | `sirrapa-group` |
| **Toegang als API-gebruiker** | Twinfield admin moet API-rol toekennen aan een service-account | n.v.t. |
| **OAuth client credentials** | Door Quorima tijdens onboarding aangemaakt; klant tekent permission consent | `client_id` + `client_secret` |

> **Sirrapa-specifiek:** verzoek om de twee administratie-codes voor (a) Sirrapa (ICT) B.V. en (b) Sirrapa Vastgoed B.V. — beide draaien op dezelfde Twinfield organisatie maar zijn aparte administraties.

### 1.2 OAuth2 setup

Twinfield gebruikt OAuth2 met **autorisatiecode-flow**.

```
Authorize URL: https://login.twinfield.com/auth/authentication/connect/authorize
Token URL:     https://login.twinfield.com/auth/authentication/connect/token
Scopes:        openid twf.user twf.organisationUser twf.organisation offline_access
```

Stappen tijdens wizard stap 3 (Werkmaatschappij koppelen):
1. Quorima genereert state-token + redirect URL.
2. Integrator klikt "Verbinden met Twinfield" → klant wordt naar Twinfield login geleid.
3. Klant accepteert scopes voor de organisatie.
4. Twinfield redirect terug met `code` → Quorima wisselt om voor `access_token` (60 min) + `refresh_token` (1 jaar).
5. Quorima test connection door `GET /api/list/offices` (= alle administraties die deze gebruiker mag zien).
6. Integrator selecteert per BV welke Twinfield administratie hoort.
7. Quorima slaat de mapping op in `tenant_config.entities[].connectors.accounting.office_code`.

### 1.3 Endpoints die Quorima gebruikt

| Endpoint | Doel | Frequentie | Sirrapa-relevantie |
|---|---|---|---|
| `GET /api/list/offices` | Welke administraties is deze user gemachtigd voor | 1× setup | beide NL BV's vinden |
| `GET /api/{office}/dimensions/DEB` | Debiteuren | dagelijks | ICT klant-concentratie · Vastgoed huurders |
| `GET /api/{office}/dimensions/CRD` | Crediteuren (incl. lenders) | dagelijks | Vastgoed: rente-leveranciers / banken |
| `GET /api/{office}/dimensions/BAS` | Grootboekrekeningen | 1× per dag (caching) | mapping naar Quorima canonical CoA |
| `GET /api/{office}/transactions` | Memorial entries / journals | dagelijks (incrementeel via timestamp) | rente-boekingen, NOI berekening |
| `GET /api/{office}/browse-data` | Predefined views (bv. trial balance, P&L) | wekelijks | snelle KPI calculatie |
| `POST /api/{office}/processxml` (SOAP fallback) | Specifieke balans- of resultatenrekening per periode | maandelijks (period close) | maandafsluiting CFO |

### 1.4 Vastgoed-data afleiden uit Twinfield (geen extra CSV)

De CFO-agent moet voor Sirrapa Vastgoed B.V. KPI's berekenen die **niet als kant-en-klare rapportage** in Twinfield zitten. Strategie: lees uit grootboek + dimensies en synthetiseer.

| KPI | Twinfield-bron |
|---|---|
| **Bruto huurinkomsten** | Grootboekrekening(en) onder code-prefix `8xxx` (omzet-rekeningen) — alle huur-omzet entries. Pre-condition: integrator mapt deze rekeningen in setup. |
| **Operationele kosten** | Grootboekrekeningen `4xxx` (kostenrekeningen) — onderhoud, beheer, energie, verzekering. |
| **Rentelasten** | Grootboekrekening `4400`-range (rentelasten) — gesplitst per lening via dimensie of cost-center. |
| **Aflossingen** | Boekingen met tegenrekening = leningrekening (`07xx` of `08xx` schuld-account) — afname schuld + cash uit. |
| **Lening-saldi** | Eindstand crediteuren-dimensie (CRD) per bank/lender + grootboeksaldo schuld-rekening. |
| **Huurregister (rent roll)** | Via debiteuren-dimensie (DEB) gefilterd op huurder-flag of klant-classificatie + recurring invoice patterns. |
| **WAULT** | Niet in Twinfield. Wel via metadata op huurcontracten — kan in Twinfield "memo's" of in een aparte module. **Te bevestigen of klant Twinfield "Vastgoed-module" gebruikt** — anders manual one-time input. |

### 1.5 Mapping setup (eenmalig per tenant)

Tijdens wizard stap 3d (KPI's accepteren / customizen) moet de integrator per Vastgoed-entiteit aangeven welke grootboekrekeningen welke functie hebben:

```yaml
sirrapa-vastgoed:
  account_mapping:
    rental_income: ["8000", "8001", "8010", "8020"]
    operating_expenses:
      maintenance: ["4100", "4110"]
      property_management: ["4150"]
      utilities: ["4200", "4210"]
      insurance: ["4300"]
    interest_expense: ["4400", "4410", "4420"]
    loans_payable: ["0700", "0710", "0720"]
    cash_accounts: ["1000", "1010", "1020"]
```

Quorima biedt een **AI-suggestion** (Sonnet) die op basis van rekeningnamen een eerste mapping voorstelt; de integrator review't en bevestigt.

### 1.6 Rate limits & operationele aandachtspunten

- Twinfield API: ~60 requests/minuut per token (soft cap). Worker batched calls.
- Refresh token rotatie: bij elke refresh wordt nieuwe refresh issued — oude is invalid.
- Multi-administratie throughput: gebruik aparte tokens per office als parallel processing nodig is.
- Foutmodi: 401 (token expired → refresh), 403 (geen permissie op office), 429 (rate limit → exponential backoff).

### 1.7 Opensource clients als basis

- Python: [`pytwinfield`](https://github.com/Drvanon/pytwinfield) of [`twinfield-cli`](https://github.com/Yer1k/twinfield)
- TypeScript: geen volwassen lib bekend → eigen wrapper rond `axios` + OAuth2.
- Onze MCP-server wrapt deze in een TypeScript Port-implementatie (`TwinfieldAccountingPort`).

---

## 2. Xero connector

Xero is het UK-equivalent — gebruikt voor Sirrapa Property Group Ltd. Xero heeft een mature REST API met OAuth2.

### 2.1 Wat de integrator nodig heeft van de klant

| Item | Waar te vinden | Voorbeeld |
|---|---|---|
| **Xero Organisation ID (UUID)** | Xero → Settings → Organisation | `9c...` UUID |
| **Toegang voor user** met "Standard" of "Advisor" rol | Xero → Settings → Users | n.v.t. |
| **OAuth client** (door Quorima tijdens app-registratie) | https://developer.xero.com/myapps | `client_id` + `client_secret` |

### 2.2 OAuth2 setup

```
Authorize URL: https://login.xero.com/identity/connect/authorize
Token URL:     https://identity.xero.com/connect/token
Scopes:        openid profile email accounting.transactions accounting.contacts.read
               accounting.reports.read accounting.settings.read offline_access
```

Stappen identiek aan Twinfield (autorisatiecode-flow); klant kiest welke organisatie verbonden wordt indien meerdere beschikbaar.

### 2.3 Endpoints die Quorima gebruikt

| Endpoint | Doel | Frequentie |
|---|---|---|
| `GET /Organisation` | Currency, country, CoA-type | 1× setup |
| `GET /Accounts` | Chart of Accounts | 1× per dag (caching) |
| `GET /Reports/ProfitAndLoss` | P&L per periode | wekelijks + maandelijks |
| `GET /Reports/BalanceSheet` | Balance sheet | wekelijks + maandelijks |
| `GET /Reports/TrialBalance` | Trial balance | maandelijks |
| `GET /Invoices?statuses=AUTHORISED,PAID` | Facturen / debiteuren | dagelijks |
| `GET /BankTransactions` | Cash beweging | dagelijks |
| `GET /Contacts?ContactStatus=ACTIVE` | Klanten + leveranciers | wekelijks |

### 2.4 UK Property C2R-specifieke setup

Voor Sirrapa Property Group Ltd. heeft Xero een specifieke setup nodig:

- **SPV per project** (zoals beschreven in de C2R thesis): elke acquisitie krijgt een eigen Xero-organisatie OF een eigen tracking-category.
- Aanbevolen: één Xero-organisatie voor de holding-laag (Sirrapa Property Group Ltd.) + per acquisitie een "Tracking Category" (Xero feature) i.p.v. aparte SPV's tot project ≥ £1M.
- Boven £1M project: aparte Xero-organisatie per SPV met intercompany-mapping naar holding.
- Voor de **acquisition-fase** (huidige situatie, geen projecten): één Xero is voldoende.

### 2.5 Rate limits & best practices

- Xero API: 60 calls/minute per organisation, 5,000 calls/day.
- Pagination: `page` parameter; default 100 records/page (max).
- Webhooks beschikbaar voor real-time updates (invoices, contacts) — gebruiken voor cash-in alerts.
- Multi-org: één refresh token per organisation; Quorima slaat tokens per `xero_org_id` op.

---

## 3. Hoe Quorima intern de data normaliseert

Beide connectors implementeren dezelfde `AccountingPort`:

```typescript
interface AccountingPort {
  // Discovery
  listEntities(): Promise<Entity[]>;

  // Reporting
  getPnL(entityId: string, period: Period, opts?: PnLOptions): Promise<PnLReport>;
  getBalanceSheet(entityId: string, asOf: Date): Promise<BalanceSheet>;
  getTrialBalance(entityId: string, asOf: Date): Promise<AccountLine[]>;
  getCashflow(entityId: string, period: Period): Promise<CashflowReport>;

  // Granular
  listTransactions(entityId: string, filter: TxFilter): Promise<Transaction[]>;
  listAccounts(entityId: string): Promise<Account[]>;
  listContacts(entityId: string, type?: 'customer' | 'supplier'): Promise<Contact[]>;

  // Sirrapa-specifiek voor real estate
  deriveLoanRegister(entityId: string): Promise<Loan[]>;
  deriveRentRoll(entityId: string): Promise<Tenancy[]>;
}
```

Implementaties:
- `TwinfieldAccountingPort` — wraps Twinfield API
- `XeroAccountingPort` — wraps Xero API
- `ExactAccountingPort` (toekomst) — voor andere klanten dan Sirrapa

Agents (CFO, CEO, CMO) praten alleen tegen de Port — niet tegen Twinfield/Xero direct. Dat houdt prompts portable.

---

## 4. Sirrapa-onboarding checklist (Sprint 1)

Concrete dingen die ik nodig heb om de CFO-agent live te zetten voor Vastgoed NL eerst (Sprint 1):

- [ ] Twinfield organisatie-code (van Sirrapa Group Holding bij Twinfield)
- [ ] Twinfield administratie-code voor Sirrapa (ICT) B.V.
- [ ] Twinfield administratie-code voor Sirrapa Vastgoed B.V.
- [ ] OAuth consent door iemand met admin-rechten op de Twinfield organisatie
- [ ] Bevestiging: gebruikt Sirrapa Vastgoed de Twinfield "Vastgoed-module"? (Bepaalt of WAULT en huurcontracten gestructureerd of in memo's staan)
- [ ] Xero organisation ID voor Sirrapa Property Group Ltd.
- [ ] OAuth consent op Xero
- [ ] Bevestiging Xero rol: minimum "Standard" voor reporting-API toegang
- [ ] Welke Xero CoA wordt gebruikt: standaard UK template of custom?

Met deze items is Sprint 1 (CFO MVP, Vastgoed-eerst) volledig unblocked.

---

## 5. Toekomstige uitbreidingen

- **Exact Online connector** voor andere klanten dan Sirrapa (komt in template-library als alternatief voor Twinfield).
- **QuickBooks Online** voor andere UK klanten dan Sirrapa.
- **DATEV / Lexware** voor DE klanten.
- **Bank-feed agreggators** (Ponto, Tink, TrueLayer) als secundaire bron als sub-administratie incompleet is.
- **Webhooks** in plaats van polling voor near-real-time daily flash digest.
