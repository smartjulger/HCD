## 🔍 UX Review — wat is er nu al gemaakt en wat kan beter?

### ✅ Wat werkt al

- Ondertitelgrootte aanpasbaar (10–48px)
- Font-keuze: sans-serif of monospace
- Taalwissel: Nederlands ↔ Engels (inclusief geluidsbeschrijvingen)
- Witte tekst op semi-transparante zwarte balk = goed contrast ongeacht videoachtergrond (WCAG AA)
- Geluidsbeschrijvingen visueel onderscheiden via grijs + italic

---

### 🔴 Kritieke problemen (WCAG-overtredingen)

| # | Probleem | Impact |
|---|---------|--------|
| 1 | `lang="en"` terwijl interface Nederlands is | Screenreader spreekt alles in het Engels uit |
| 2 | Paginatitel is `"Document"` | Tabblad en screenreader zeggen niets zinvols |
| 3 | Knoppen zijn 32×32px — te klein | WCAG 2.2 vereist 44×44px voor touch targets |
| 4 | Geen zichtbare focus-indicator | Toetsenbordgebruikers kunnen UI niet navigeren |
| 5 | Labels niet gekoppeld via `for`/`id` | Screenreaders koppelen label niet aan control |

### 🟠 Hoge prioriteit (UX)

| # | Probleem | Impact |
|---|---------|--------|
| 6 | Controls niet gecentreerd onder video | Visueel losgekoppeld van de video |
| 7 | Wit blok op zwart achtergrond | Felle klap in het gezicht, past niet bij dark theme |
| 8 | Geen visuele scheiding tussen control-groepen | Onduidelijke structuur: grootte / font / taal door elkaar |

### 🟡 Medium prioriteit

| # | Probleem | Impact |
|---|---------|--------|
| 9 | CSS default 16px vs JS start 30px | Ondertitels flikkeren bij laden |
| 10 | Geen bevestiging bij taal-/fontwissel | Gebruiker weet niet of de actie gelukt is |

---

## 🛠️ Concreet verbeterplan

| # | Wat | Bestand | Prioriteit |
|---|-----|---------|-----------|
| 1 | `lang="nl"` + zinvolle `<title>` | `index.html` | 🔴 Kritiek |
| 2 | `id` op selects/spans + `for` op labels | `index.html` | 🔴 Kritiek |
| 3 | Knoppen naar 44×44px | `style.css` | 🔴 Kritiek |
| 4 | `:focus-visible` stijlen toevoegen | `style.css` | 🔴 Kritiek |
| 5 | Controls centreren onder video | `style.css` | 🟠 Hoog |
| 6 | Controls dark theme (donker i.p.v. wit) | `style.css` | 🟠 Hoog |
| 7 | Visuele scheiding tussen groepen | `style.css` | 🟠 Hoog |
| 8 | CSS default naar 30px (geen flicker) | `style.css` | 🟡 Medium |
