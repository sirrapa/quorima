# Twinfield connector — Path A gekozen

**Datum:** 27 april 2026
**Beslissing:** Sirrapa Group gebruikt de **APARRIS user** met Webservice key voor Quorima — geen aparte service-account.

---

## Waarom Path A

Tijdens browser-onderzoek in Twinfield UI ontdekt:

1. **Geen multi-user self-service** — het Twinfield-pakket op organisatie `KUBUSALKMAAR` heeft geen UI om een 2e gebruiker zelf aan te maken. Alleen je eigen user-instellingen zijn editable; geen lijst-view of toevoeg-knop.
2. **Pakket-uplift nodig voor Path B** — een 2e gebruiker (`quorima-svc`) toevoegen vereist contact met Twinfield support (`+31 (0)20 718 8484` of `support@twinfield.com`), met mogelijke meerkosten (~€10–25/mnd).
3. **APARRIS heeft al alle benodigde toegang**:
   - ✓ Webservices-rechten geactiveerd (Webservice key bestaat al)
   - ✓ Toegang tot alle 3 admins (21005 ICT, 21006 Holding, 21007 Vastgoed)
   - ✓ Geen actieve 3rd-party OAuth-integraties die kunnen breken bij key-wissel
4. **Sirrapa is een solo-operator** — het audit-trail-voordeel van een aparte service-account is hier marginaal omdat er maar één eindgebruiker is.

## Risico's en mitigatie

| Risico | Likelihood | Mitigatie |
|---|---|---|
| Wijzigen Webservice key breekt een onbekende oude integratie | Laag | "Externe applicatie toegang"-lijst is gecheckt en bevat alleen Twinfield-eigen apps |
| Quorima reads worden gelogd als "APARRIS" ipv aparte service-account | Medium voor audit, laag voor functie | Alle Quorima reads zijn read-only en hebben eigen audit-trail in Quorima zelf (immutable, hash-chained log) |
| Wachtwoord-rotation policy minder schoon | Laag | Webservice key is een apart wachtwoord van je SSO; rotation kan los gepland worden |

## Vervolg-traject (later, niet blocking)

Als Quorima naar productie of multi-tenant gaat (Sprint 5+), is een aparte service-account alsnog wenselijk:
- Mail naar `support@twinfield.com`: *"Voor organisatie KUBUSALKMAAR willen we een 2e gebruiker `quorima-svc` aanmaken met alleen Webservices-rol op administraties 21005, 21006 en 21007. Wat zijn de kosten en doorlooptijd?"*
- Verwacht 1–3 werkdagen + mogelijke €10–25/mnd extra.
- Wanneer aangemaakt: alleen `TWINFIELD_USER` waarde wijzigen in `.env` — rest van Quorima hoeft niet aangepast.

## Actie nu — om vandaag live te kunnen

### Stap 1 — Webservice key vaststellen

Drie scenarios:

**A. Je hebt de huidige Webservice key in 1Password staan**
→ Direct gebruiken, ga naar Stap 2.

**B. Je weet de huidige Webservice key niet**
→ Wijzig hem naar een nieuw, sterk wachtwoord (32 chars):
1. Open `https://accounting2.twinfield.com/UI/#/Settings/User/Security` (de Webservice key wijzigen pagina)
2. *Probleem*: het formulier vraagt naar de huidige key. Als je hem echt niet hebt: **scenario C**.

**C. Reset noodzakelijk (geen huidige key beschikbaar)**
→ Bel Twinfield support: `+31 (0)20 718 8484` of mail `support@twinfield.com`
→ Vraag: *"Reset Webservice key voor user APARRIS op organisatie KUBUSALKMAAR. Ik wil hem zelf instellen na de reset."*
→ Doorlooptijd: 5–30 minuten via telefoon, ~half dag via email.

### Stap 2 — Genereer een sterk nieuw wachtwoord

In 1Password / Bitwarden / terminal:
```bash
openssl rand -base64 32
# voorbeeld output: kJ8xYz2pLqWsVnMbR4tHfGdEuY7iOaSdDfGhJkLzXc=
```
Sla op als nieuwe entry **"Quorima Twinfield Webservice key"** in je vault.

### Stap 3 — Quorima `.env` invullen

```env
ANTHROPIC_API_KEY=sk-ant-...           # van claude.com/console
TWINFIELD_ORGANISATION=KUBUSALKMAAR
TWINFIELD_USER=APARRIS
TWINFIELD_PASSWORD=<de Webservice key>
TWINFIELD_OFFICE_VASTGOED=21007
TWINFIELD_OFFICE_ICT=21005
TWINFIELD_OFFICE_HOLDING=21006
```

### Stap 4 — Test

```bash
cd quorima-mvp
npm run twinfield:test
```

Bij groen: `npm run flash` voor de eerste live daily flash digest met Sirrapa Vastgoed data.

---

## Audit-trail: hoe Quorima dit compenseert

Omdat alle reads onder APARRIS in Twinfield's log staan, registreert **Quorima zelf** elke API-call met meer detail:

```
AgentRun {
  run_id: uuid,
  agent: "cfo",
  model: "claude-opus-4-6",
  tool_calls: [
    { tool: "twinfield.getPnL", entity: "sirrapa-vastgoed", period: "2026-FY",
      timestamp: "2026-04-27T08:01:23Z", duration_ms: 412 },
    ...
  ],
  output_hash: "sha256:abc...",
  prompt_hash: "sha256:def..."
}
```

Deze log is immutable + hash-chained (Sprint 1 lever in). Voor de externe boekhouder is APARRIS de identiteit; voor intern is de Quorima audit-trail veel granularer dan wat een aparte Twinfield service-account zou geven.
