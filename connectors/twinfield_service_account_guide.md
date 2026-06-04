# Twinfield service-account voor Quorima — stap voor stap

**Doel:** een dedicated user in Twinfield die alleen voor Quorima wordt gebruikt om financiële data te lezen. Geen mens-gebruiker, geen mailbox, alleen API-rol op de drie administraties.

**Tijd:** ~10 minuten via de Twinfield UI.
**Wie kan het:** elke gebruiker met `Administrator`-rol op de organisatie KUBUSALKMAAR. Als jij Wolters Kluwer SSO gebruikt en de oprichter bent, is dat jij.

> **Waarom een dedicated service-account en niet jouw eigen login?**
> 1. Veiligheid — wachtwoord wordt opgeslagen in een server-config (`.env`), niet door een mens gebruikt.
> 2. Audit-trail — alle geautomatiseerde reads in Twinfield log staan onder één duidelijke gebruiker.
> 3. Rotation — als je later van Quorima-versie wisselt of andere developer toevoegt: je rouleert dit ene wachtwoord, raakt jouw eigen account niet aan.
> 4. Minimaal privilege — service-account krijgt alleen `Webservices` (read-only), niet de volledige `Adviser`-rechten die jij hebt.

---

## Stap 1 — Inloggen als administrator

1. Ga naar https://login.twinfield.com
2. Log in zoals normaal (Wolters Kluwer SSO)
3. Selecteer organisatie **KUBUSALKMAAR** als je een organisatie-keuze krijgt

---

## Stap 2 — Naar gebruikersbeheer

In de Twinfield interface:
- Klik linksboven op je **organisatienaam** (KUBUSALKMAAR) → **Beheer** of **Settings**
- In het beheermenu: **Gebruikers** (of **Users** in EN-modus)

Als je ze niet ziet:
- Probeer rechtsboven het tandwiel-icoon ⚙️ → **Settings** → **Users**
- Of via de URL direct: `https://accounting.twinfield.com/UI/User/User.aspx`

Je ziet nu een lijst met bestaande gebruikers (waaronder jezelf).

---

## Stap 3 — Nieuwe gebruiker aanmaken

Klik **Toevoegen** / **+ New User** / **Nieuw**.

Vul de volgende velden in:

| Veld | Waarde | Toelichting |
|---|---|---|
| **Code** of **Username** | `quorima-svc` | Korte code; wordt onderdeel van login. Geen spaties. |
| **Naam** of **Display name** | `Quorima Service Account` | Beschrijvende naam — handig voor audit-log later |
| **Email** | `armand.parris@sirrapagroup.com` of een nieuwe `quorima@sirrapagroup.com` | Email-validatie kan vereist zijn; een door jou beheerde inbox is voldoende |
| **Wachtwoord** | Genereer een sterk wachtwoord (≥ 24 tekens, mix) | Opslag direct in 1Password / Bitwarden — je gaat dit nooit handmatig typen |
| **Active** of **Status** | Aan | Anders kan de account niet inloggen |

**Wachtwoord genereren:** in 1Password / Bitwarden → New password → 32 chars, alle types. Of in terminal: `openssl rand -base64 32`.

---

## Stap 4 — Rollen toekennen (kritiek)

Dit is waar het werkt of niet werkt. Het service-account heeft **één** rol nodig: **Webservices** (in NL: vaak ook **API-toegang** of **Webdiensten**).

In het rollen-tab van de nieuwe user:
1. Selecteer rol **Webservices** (of equivalent)
2. **Niet** geven: Adviser, Administrator, Boekhouder — die heeft het account niet nodig en het is veiliger om het minimum te geven
3. Save

> **Als je geen "Webservices"-rol ziet in de dropdown:** dat betekent dat het API-pakket niet geactiveerd is op KUBUSALKMAAR. Bel Twinfield support op +31 (0)20 718 8484 of mail support@twinfield.com met: *"Wij willen op organisatie KUBUSALKMAAR de Webservices/API-rol activeren voor service-account quorima-svc."* Dat is meestal binnen 1-2 werkdagen geregeld zonder extra kosten als je een actief pakket hebt.

---

## Stap 5 — Toegang per administratie

In Twinfield werkt rolbeheer **per office (administratie)**. Het service-account moet toegang krijgen tot alle drie:
- **21006** Sirrapa Group Holding B.V.
- **21005** Sirrapa (ICT) B.V.
- **21007** Sirrapa Vastgoed B.V.

In het user-detail scherm:
1. Tab **Offices** of **Administraties**
2. Voeg alle drie toe en geef per office de **Webservices**-rol

Als je per ongeluk het service-account als Adviser op een office zet: niet erg, gewoon downgraden naar Webservices.

---

## Stap 6 — Test login

Snel de credentials valideren — twee opties:

### Optie A — Snelle handmatige test
1. Log uit als jezelf
2. Probeer in te loggen met de service-account credentials
3. Als je succesvol inlogt en alle drie de administraties ziet: ✅ klaar
4. Log direct weer uit (je gaat dit account niet voor handmatig werk gebruiken)

### Optie B — Quorima credentials test script (aanbevolen)
Het MVP-project heeft een dedicated test-script dat alleen de SOAP Logon doet en de offices listt. Geen volledige flash run, geen LLM-call — gewoon: werkt het of werkt het niet.

```bash
cd quorima-mvp
cp .env.example .env
# Vul in .env in:
#   TWINFIELD_ORGANISATION=KUBUSALKMAAR
#   TWINFIELD_USER=quorima-svc
#   TWINFIELD_PASSWORD=[het zojuist gegenereerde wachtwoord]
npm run twinfield:test
```

Output bij success:
```
✓ Logon successful
✓ Cluster: https://accounting.twinfield.com
✓ Offices found: 3
    21005  Sirrapa (ICT) B.V.
    21006  Sirrapa Group Holding B.V.
    21007  Sirrapa Vastgoed B.V.
✓ Webservices role: confirmed
✓ Ready to run npm run flash
```

Output bij fout — dan weet je precies wat er mis is:
```
✗ Logon failed: InvalidCredentials
  → check user/password match in Twinfield → Beheer → Gebruikers
✗ Logon failed: NoAccess
  → user heeft geen Webservices-rol — zie Stap 4 hierboven
✗ Logon successful, but only 1 office visible
  → user heeft Webservices op slechts één administratie — zie Stap 5
```

---

## Stap 7 — Wachtwoord opslag

**Niet** in:
- ❌ Cleartext in een document of email
- ❌ Slack of WhatsApp
- ❌ Een README die in git komt

**Wel** in:
- ✅ 1Password / Bitwarden / KeePass — vault-entry "Quorima Twinfield service-account"
- ✅ Voor productie deployment: in een secrets manager (AWS Secrets Manager / Doppler / Hashicorp Vault) — niet in `.env` op een server
- ✅ Voor lokale dev: `.env` file die in `.gitignore` staat (al geconfigureerd in MVP)

---

## Stap 8 — Rotation policy

Plan om dit wachtwoord elke 6 maanden te roteren. In Twinfield UI: gebruiker → Reset password. Update in je secrets manager. Geen downtime nodig — alleen Quorima draait erop.

---

## Veelgestelde fouten en oplossingen

| Symptoom | Oorzaak | Oplossing |
|---|---|---|
| `Logon failed: InvalidCredentials` | Wachtwoord verkeerd | Check exacte wachtwoord in 1Password — special chars correct ge-escaped? |
| `Logon failed: NoOffice` of `Cluster=null` | User heeft nog geen office-toewijzing | Stap 5 — voeg Office 21005/6/7 toe aan user |
| Logon werkt maar `getPnL` geeft `403` | Webservices-rol mist op specifieke office | Stap 5 — controleer rol per office |
| `MultiFactor required` | MFA aan voor service-accounts | Twinfield Beheer → Security → schakel MFA uit voor `quorima-svc` (alleen voor service-accounts; jouw eigen login houdt MFA aan) |
| HTTP 500 na lange tijd | Cluster URL veranderd | Logon haalt cluster opnieuw op bij elke run; meestal automatisch opgelost |

---

## Wat je daarna kunt doen

Met een werkend service-account:

```bash
cd quorima-mvp
npm run twinfield:test       # ✓ werkt het
npm run flash                # echte daily flash met live Twinfield data
```

En om dit elke werkdag automatisch te draaien:
```bash
# in crontab -e:
0 8 * * 1-5 cd /path/to/quorima-mvp && /usr/local/bin/npm run flash >> ~/quorima-cron.log 2>&1
```
