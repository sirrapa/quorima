# Mail aan Hilleke — Twinfield Webservice key

**Aan:** Hilleke (accountantskantoor)
**Van:** Armand Parris
**Onderwerp suggesties:**
- "Twinfield Webservice key voor APARRIS — KUBUSALKMAAR"
- "Vraagje: Twinfield API-key voor onze administratie"

---

## Versie 1 — kort en zakelijk

> **Onderwerp:** Twinfield Webservice key voor APARRIS — KUBUSALKMAAR
>
> Hoi Hilleke,
>
> Voor een nieuwe interne tool willen we **read-only** rapportages uit Twinfield trekken voor Sirrapa Group (organisatie **KUBUSALKMAAR**, gebruiker **APARRIS**, administraties 21005 / 21006 / 21007).
>
> Daar heb ik mijn **Twinfield Webservice key** voor nodig — dat is het aparte API-wachtwoord dat los staat van mijn Wolters Kluwer SSO login. Heb jij die ergens vastgelegd, of kun je hem voor me opzoeken/resetten?
>
> Twee opties zijn voor mij prima:
> 1. **Huidige key delen** als die in jullie kantoor-vault staat — ik vervang hem dan zelf direct na ontvangst.
> 2. **Reset aanvragen** bij Twinfield support en mij de nieuwe key sturen. Dan zet ik hem direct in 1Password.
>
> Het gaat om read-only API-toegang voor financiële KPI-rapportages (DSCR, NOI, cashflow). Geen schrijfacties richting Twinfield. Audit-log loopt op gebruiker APARRIS.
>
> Veilige overdracht graag via 1Password Share, Bitwarden Send, of een andere encrypted route — niet per gewone e-mail.
>
> Alvast bedankt!
>
> Groet,
> Armand

---

## Versie 2 — uitgebreider, met meer context (als zij wat afstand heeft van API-zaken)

> **Onderwerp:** Twinfield API-toegang voor Sirrapa Group — vraag over Webservice key
>
> Hoi Hilleke,
>
> Ik ben bezig met het opzetten van een interne automatisering voor Sirrapa Group: een tool die elke werkdag een korte financiële statusrapportage genereert op basis van de Twinfield-cijfers. Denk aan: dagelijkse cash-positie, DSCR voor Vastgoed, runway-monitoring — alles **alleen lezen**, geen wijzigingen in Twinfield.
>
> Twinfield heeft daarvoor een API met een aparte authenticatie: naast mijn normale Wolters Kluwer login bestaat er een zogenaamde **Webservice key** per gebruiker. Voor mijn account **APARRIS** op organisatie **KUBUSALKMAAR** moet ik die key gebruiken om de tool toegang te geven.
>
> Mijn vraag aan jou:
> - Is de Webservice key voor APARRIS bij jullie bekend (bijvoorbeeld in jullie kantoor-vault)?
> - Zo ja: kun je hem veilig met me delen? Bv via 1Password Share of Bitwarden Send.
> - Zo nee: zou jij — of kan ik via jullie — Twinfield support vragen om een reset, met de nieuwe key naar mij?
>
> Toegang die we nodig hebben: read-only Webservices-rol op alle drie de administraties (21005 Sirrapa B.V., 21006 Sirrapa Group Holding B.V., 21007 Sirrapa Vastgoed B.V.). Voor zover ik kan zien heeft APARRIS al die toegang; alleen de key is nog nodig.
>
> Geen haast als het iets meer tijd kost — kan prima volgende week ook. Stuur me anders een 1Password vault entry.
>
> Bedankt voor je hulp!
>
> Hartelijke groet,
> Armand

---

## Tips voor verzenden

- **Versie 1** als jij en Hilleke vaak in dit soort dingen samenwerken en zij weet wat een API-key is.
- **Versie 2** als zij meer een traditionele accountant is en het concept van "API-toegang" minder dagelijks ziet.

**Veilige overdracht — vermijd:**
- ❌ Key in plain text in een e-mail
- ❌ Key in een Word document of PDF in attachment
- ❌ Key via WhatsApp / SMS

**Wel veilig:**
- ✅ **1Password Share** — gratis link, verloopt na 1–7 dagen, kan je maximum-views op zetten. Als zij geen 1Password heeft kan ze de key zien zonder eigen account.
- ✅ **Bitwarden Send** — vergelijkbaar
- ✅ **Wachtwoord-protected ZIP** met de key als tekst-bestand, en het wachtwoord apart via een ander kanaal (Signal, telefoon)

**Check na ontvangst:**
1. Zet de key direct in jouw 1Password vault als entry "Quorima Twinfield Webservice key APARRIS"
2. Verwijder de Share-link / Send / berichten waarin de key voorkwam
3. Test in Quorima MVP met `npm run twinfield:test` — bij groen weet je zeker dat het de juiste key is
