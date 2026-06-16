# FusionDeck — Documento di progettazione

> Tool community, open-source e cross-platform per programmare radio Yaesu System Fusion
> (a partire dalla **FTM-510DE**) unificando l'intero loop: *scopri → vedi cosa è attivo →
> seleziona → scrivi in memoria*. Codename di lavoro: **FusionDeck** (sostituibile).

---

## 1. Visione e tesi del prodotto

Oggi il flusso del radioamatore Fusion è spezzato in cinque strumenti scollegati: liste ponti
(IK2ANE, pagine regionali), mappe WIRES-X, aprs.fi, lista nodi/room Yaesu, e infine ADMS-18 per
scrivere la radio. FusionDeck **fonde questo loop in un'unica esperienza "dalla mappa alla
memoria"**.

Il valore non è accumulare feature, ma chiudere un loop preciso. La proposta di valore difendibile
è duplice:

1. **"CHIRP per i System Fusion"**: CHIRP non copre i Fusion, RT Systems è a pagamento e
   Windows-only, ADMS è funzionale ma isolato e brutto. Esiste uno spazio vuoto.
2. **Unificare il layer "attività live" dentro il momento della programmazione**, e in più
   **unificare le due reti parallele WIRES-X e YSF**, cosa che oggi nessuno fa.

Doppio obiettivo dichiarato: **prodotto per la community** + **strumento che l'autore usa in prima
persona**.

---

## 2. Principio architetturale guida (il cuore della modularità)

> **Requisito chiave:** la logica del backend di discovery deve essere **inclusa nell'app desktop**
> e usata come **fallback** quando il server centrale non è disponibile. Server e client
> **riutilizzano lo stesso codice JS**.

Questo requisito impone una sola disciplina, da cui discende tutto il resto:

**Tutta la logica di dominio (adapter verso le sorgenti, normalizzazione, caching, regole) vive in
un core isomorfo, puro, senza dipendenze specifiche di host.** Lo stesso identico core gira in due
luoghi:

- nel **server centrale** (la API community "stato rete Fusion");
- **embedded nell'app desktop**, come provider locale di fallback.

La differenza tra i due host non è il codice di dominio: è solo **l'iniezione delle dipendenze di
I/O** (client HTTP, storage di cache, clock, logger). È un'applicazione diretta dell'architettura
esagonale (ports & adapters).

```
            ┌─────────────────────────────────────────────────────────┐
            │                    @fusiondeck/core                       │
            │              (TypeScript puro, isomorfo)                  │
            │                                                           │
            │   sources/        normalize/      cache/      domain/     │
            │   - RepeaterBook  - modello       - policy    - entità    │
            │   - WiresX        unificato       - TTL       - regole    │
            │   - YSF (DVRef)   (Repeater/                               │
            │   - YSF Dashboard  Room/Reflector)                        │
            │   - aprs.fi                                               │
            │                                                           │
            │   PORTS (interfacce):  HttpClient · CacheStore ·          │
            │                        Clock · Logger                     │
            └───────────────▲───────────────────────────▲──────────────┘
                            │ implementa ports           │ implementa ports
              ┌─────────────┴───────────┐    ┌───────────┴────────────────┐
              │   @fusiondeck/server     │    │      apps/desktop           │
              │   (host Node)            │    │      (Electron)             │
              │                          │    │                             │
              │  - HttpClient: undici    │    │  EMBEDDED CORE (fallback):  │
              │  - CacheStore: Redis/fs  │    │   - HttpClient: net Electron│
              │  - espone API REST       │    │   - CacheStore: SQLite/fs   │
              │  - rispetta cadenze      │    │                             │
              │    sorgenti (politeness) │    │  DiscoveryGateway:          │
              │  - deploy VPS / RPi      │    │   remote-first → local      │
              └──────────────────────────┘    │                             │
                            ▲                  │  + Codec layer (SD .dat)    │
                            │ REST (preferito) │  + UI (mappa, griglia)      │
                            └──────────────────┤                             │
                                               └─────────────────────────────┘
```

### 2.1 Strategia di fallback (DiscoveryGateway)

Il client non chiama mai direttamente le sorgenti né direttamente il core: passa per un
`DiscoveryGateway` che incapsula due provider intercambiabili.

- **RemoteProvider** → chiama l'API del server centrale (percorso preferito).
- **LocalProvider** → esegue il **medesimo core** in-process (nel main process Electron o, meglio,
  in una *utility process*/worker per non bloccare la UI).

Policy: **remote-first con health-check, timeout e soglia di staleness**, con pattern
*stale-while-revalidate*. Se il server risponde lento, è irraggiungibile, o restituisce dati troppo
vecchi → si commuta su `LocalProvider`. Lo switch è trasparente alla UI.

```ts
interface DiscoveryProvider {
  getRepeaters(area: GeoArea): Promise<Repeater[]>;
  getActiveRooms(): Promise<Room[]>;
  getReflectors(): Promise<Reflector[]>;
  getLastHeard(target: ReflectorRef): Promise<HeardEntry[]>;
}

// Stesso contratto, due implementazioni; il Gateway sceglie a runtime.
class DiscoveryGateway implements DiscoveryProvider {
  constructor(private remote: RemoteProvider, private local: LocalProvider, private opts: Policy) {}
  // remote-first, fallback su local con timeout/staleness/health
}
```

### 2.2 Caveat di politeness sul fallback (da progettare subito)

Il server centrale **non è solo un'ottimizzazione di comodo**: serve anche a non martellare le
sorgenti. Se molti client cadono in fallback contemporaneamente, ognuno scraperebbe Yaesu in
parallelo (effetto *thundering herd*). Mitigazioni obbligatorie nel `LocalProvider`:

- caching locale aggressivo con TTL allineati alle cadenze delle sorgenti (vedi §4);
- **rispetto della disciplina ~72 richieste/giorno** verso Yaesu anche in locale;
- jitter sulle richieste; preferenza per consumare gli host file/JSON già aggregati piuttosto che le
  pagine originali.

Il messaggio architetturale: *remote-first non è solo performance, è anche rispetto delle sorgenti.*

---

## 3. I tre layer funzionali

### 3.1 Discovery layer — *model-independent*

È l'asset principale del progetto: **non dipende dal modello di radio**, è a **basso rischio** (solo
API e parsing, niente reverse engineering) ed è dove sta tutto il "delight". Vive interamente in
`@fusiondeck/core`. Riutilizzabile gratis per qualsiasi radio futura.

### 3.2 Radio codec layer — *plugin per-modello*

È il pezzo che tocca l'hardware e richiede reverse engineering del formato file. Va trattato come un
**codec sostituibile per modello**, dietro un'interfaccia comune. Si spedisce con un solo modello
(FTM-510DE), ma l'interfaccia è definita dal giorno uno.

```ts
interface RadioCodec {
  model: string;                       // es. "FTM-510DE"
  parse(dat: Buffer): Channel[];       // legge MEMFTM510D.dat → canali
  serialize(channels: Channel[]): Buffer; // riscrive + ricalcola checksum
  sdLayout: SdCardLayout;              // path/cartelle attese sulla SD
}
```

**Verità scomoda su "altri device compatibili":** il formato `.dat` cambia tra modelli (il salto
FT3D→FT5D ruppe la compatibilità e bloccò tutti i tool per un periodo). Quindi "compatibile" non è
gratis: ogni radio è un nuovo codec da reverse-engineerare. L'architettura a plugin è ciò che rende
questa espansione sostenibile.

### 3.3 UI / orchestration layer

Mappa, griglia canali, e il gesto chiave **"dalla mappa alla memoria in un click"**. Deve restare
**agnostico rispetto allo shell** (vedi §6): una normale app web che parla con un sottile bridge per
filesystem/SD, così uno swap Electron→Tauri domani costa poco.

---

## 4. Sorgenti dati e modello unificato

### 4.1 Sorgenti

| Sorgente | Tipo accesso | Cosa fornisce | Note / cadenza |
|---|---|---|---|
| **RepeaterBook** | API pubblica | Ponti RF geolocalizzati (IT) | Sorgente primaria ponti; elimina lo scraping manuale delle liste |
| **WIRES-X (Yaesu)** | **Scraping** (no API) | Node/room attivi, popolarità | Pagine HTML, refresh ~20 min; geoloc parziale (dichiarata dal proprietario) |
| **Live-Wires-X** | JSON (community) | Stessi dati WIRES-X riaggregati | Già pensato per essere consumato; cache ~72/die per gentilezza verso Yaesu |
| **YSF — DVRef registry** | Host file | Lista **autorevole** reflector | Da giugno 2025 la registrazione è migrata da YSFReflector Registry a DVRef |
| **YSF — pistar.uk / W0CHP** | Liste strutturate | Mirror reflector | Aggiornati ogni ora; ~1650 reflector; ottimi per cross-check/enrichment |
| **YSF — Dashboard DG9VH** | Scraping / websocket | **Last-heard real-time** per reflector | "Currently TXing" + heard list; legge il logfile del reflector |
| **aprs.fi** | API (con key) | Liveness/last timestamp dei nodi | Conferma che un impianto è "vivo" |

### 4.2 Distinzione critica: WIRES-X ≠ YSF

Sono **due reti Fusion parallele**. WIRES-X è la rete proprietaria Yaesu (solo connettività e
popolarità, niente "chi parla ora", nessuna API). YSF è l'ecosistema **aperto** (lista scaricabile,
mirror orari, e dashboard per-reflector con il last-heard vero). **Per un prodotto community,
il baricentro va su YSF**, con WIRES-X integrato best-effort. Unificare le due reti è la novità.

### 4.3 Limite di onestà tecnica (da esporre in UI)

Nessuna sorgente di rete vede i **QSO puramente locali in RF** non inoltrati a room/reflector. Il
dato va quindi presentato come *"attività di rete"*, da incrociare col **test RF del beacon/ID del
ponte** (se senti l'identificativo, ricevi bene; il silenzio = nessuna attività). Mai spacciare il
dato di rete per "tutto ciò che si sente sul ponte".

### 4.4 Modello normalizzato (esempio)

```ts
type Network = 'wiresx' | 'ysf' | 'fm';

interface FusionEntity {
  id: string;
  name: string;
  callsign?: string;
  network: Network;
  geoloc?: { lat: number; lng: number; accuracy: 'exact' | 'owner-declared' | 'none' };
  connectedCount?: number;     // WIRES-X room popularity
  lastHeard?: HeardEntry[];     // YSF dashboard
  linkedFreq?: RfChannel;       // ponte RF associato (RepeaterBook)
  liveness?: { source: string; lastSeen: string };
}
```

---

## 5. Il codec FTM-510DE: trasporto, formato, reverse engineering

### 5.1 Scelta del trasporto: SD card (non seriale)

Dal manuale ADMS-18 emergono due canali di trasferimento con costi opposti:

- **microSD** — la radio legge/scrive la config su SD da menu (`107 BACKUP → WRITE TO SD`), su
  struttura di cartelle fissa (`FTM510D/BACKUP/CLNFTM510D.dat`,
  `FTM510D_MEMORY-CH/MEMFTM510D.dat`, `FTM510D/BACKUP/SYSFTM510D.dat`). **Nessun protocollo
  seriale**: è solo I/O su filesystem.
- **Cavo seriale SCU-56/SCU-20** — protocollo di clone proprietario, con handshake/checksum, da
  sniffare e ricostruire. Più ostico e più **rischioso** (un errore può lasciare la radio in stato
  incoerente).

**Decisione: SD come trasporto.** Stesso risultato senza protocollo, e un `.dat` malformato
semplicemente non viene caricato (errore reversibile). Tenere sempre un backup `ALL` "buono".

### 5.2 Tiering del formato (rischio crescente)

- **Tier 1 — CSV (zero RE):** ADMS-18 documenta l'import/export CSV. L'MVP genera il CSV che
  ADMS-18 importa. Resta ADMS-18 nel loop, ma nessun reverse engineering.
- **Tier 2 — `.dat` binario (RE solo di formato):** scrittura diretta dei `.dat` sulla SD →
  elimina ADMS-18 e Windows. Richiede RE del formato.

### 5.3 Metodo di RE (diffing controllato)

1. Partire da `MEMFTM510D.dat` (solo memorie): target più piccolo e regolare.
2. Stato noto → BACKUP su SD → copia file.
3. Cambiare **un solo campo** (es. RX ch1 145.000 → 145.025) → nuovo BACKUP → diff byte a byte.
4. Mappare gli offset: frequenze spesso in **BCD**, nomi in **ASCII**, tono/DG-ID/modo come
   flag/indici. Iterare campo per campo.
5. Isolare e **ricalcolare il checksum**. Indizio dal manuale: il warning *"Do not edit the Check
   line…"* sul CSV rivela che esiste un checksum; il `.dat` quasi certamente ne ha uno (somma
   mod 256 o CRC). Senza ricalcolo, la radio rifiuta il file.

**Rischio:** basso (SD, niente bricking). **Stato dell'arte:** nessun supporto CHIRP/community per il
510D; ma la metodologia (hex-diff dei `.dat` su SD) è collaudata su altri Yaesu (es. tool hand-made
per FTM-400). Cercare comunque progetti esistenti su GitHub prima di partire.

---

## 6. Stack tecnologico

- **Monorepo:** pnpm workspaces + Turborepo.
  - `packages/core` — TypeScript puro, isomorfo, ports esagonali. **Zero** dipendenze Node-only /
    Electron-only / browser-only.
  - `packages/server` — host Node sottile (Fastify), implementa i ports (undici, Redis/fs),
    espone REST, rispetta le cadenze, deployabile su **VPS o Raspberry Pi**.
  - `packages/codec-ftm510de` (+ futuri) — implementazioni `RadioCodec`.
  - `apps/desktop` — Electron; embedda `core` come `LocalProvider`; ospita UI + codec + bridge SD.
  - `packages/ui` — frontend web (React/Vue/Svelte) **shell-agnostico**, mappa Leaflet + OSM.
- **Client desktop:** **Electron adesso** (minor attrito, tutto in JS, accesso filesystem SD nativo,
  `electron-builder` per Win/macOS/Linux). **Path di upgrade a Tauri** se il footprint pesa
  (webview di sistema, binari da pochi MB, meno RAM; costo: backend Rust + differenze webview su
  Linux). La UI agnostica rende lo swap economico.
- **Mappa:** Leaflet + OpenStreetMap; marker filtrabili per banda e modo (FM / C4FM / DMR / D-STAR).

### 6.1 Distribuzione "ovunque": i veri ostacoli

Non è il framework, sono i gatekeeper degli OS:
- **macOS:** notarizzazione (Apple Developer ~99$/anno) o l'utente vede "app non verificata".
- **Windows:** SmartScreen → serve certificato di code-signing.
- **Linux:** packaging multiplo (AppImage / deb / Flatpak).

Questi costi sono indipendenti da Electron vs Tauri.

---

## 7. Roadmap a fasi (rischio crescente, valore decrescente)

- **Fase 0 — Fondamenta.** Monorepo + `core` isomorfo + `DiscoveryGateway` (remote/local) +
  RepeaterBook + mappa. Il core gira sia come server sia embedded. *Nessun RE.*
- **Fase 1 — MVP utile.** Generazione **CSV** importabile in ADMS-18. Pubblicabile, già
  differenziante, *zero RE*. Serve a misurare l'interesse prima di spendere il capitale-fatica.
- **Fase 2 — Standalone.** Scrittura diretta `.dat` su SD (RE formato FTM-510DE) → si elimina
  ADMS-18.
- **Fase 3 — Attività live (la killer feature).** Integrazione WIRES-X + YSF + aprs, **unificate**.
  Gesto "questo è attivo, ecco l'ultimo heard, te lo scrivo in memoria".
- **Fase 4 — Hardware tier (prodotto successivo).**
  - **RTL-SDR (~25€) come sentinella** su Raspberry Pi: logga attività/portante su un ponte
    (risolve "non aggancio o non c'è nulla?"). Banale e robusto per **FM** + waterfall.
  - **Muro C4FM:** la decodifica voce Fusion via SDR richiede il vocoder **AMBE, proprietario**
    (soluzioni tipo DSD-FME esistono ma sono terreno grigio/fragile). **Non promettere decodifica
    C4FM software**: progettare il tier per rilevamento attività + FM, non per decodifica.
  - **GPS puck** in mobile: carica i ponti più vicini mentre si guida (si appoggia al discovery
    layer già esistente).
- **Espansione codec:** nuove radio = nuovi plugin `RadioCodec`.

---

## 8. Considerazioni legali ed etiche

- **Reverse engineering:** clean-room del **formato file della radio** per interoperabilità (in UE,
  Direttiva Software art. 6 prevede deroghe per l'interoperabilità). **Non** disassemblare
  l'eseguibile ADMS-18; lavorare **solo** sui file prodotti dalla radio. *(Nota: non è consulenza
  legale.)*
- **Scraping:** caching aggressivo, attribuzione, rispetto di ToS/robots; consumare preferibilmente
  gli host file/JSON pensati per essere consumati (YSF, Live-Wires-X) e onorare la cadenza ~72/die
  verso Yaesu.
- **AMBE:** vocoder proprietario → niente decodifica C4FM software promessa all'utente.

---

## 9. Sintesi delle decisioni architetturali (ADR in pillole)

1. **Core isomorfo + ports esagonali** → un solo codice JS per server e desktop. *(requisito chiave)*
2. **DiscoveryGateway remote-first con fallback locale embedded** → resilienza a server down;
   il server è ottimizzazione + politeness, non dipendenza dura.
3. **SD card come trasporto** (non seriale) → stesso risultato, rischio minimo.
4. **Codec per-modello a plugin** → "compatibile con altri device" sostenibile nel tempo.
5. **Discovery layer model-independent** → asset riutilizzabile, baricentro su **YSF**.
6. **UI shell-agnostica** → Electron ora, opzione Tauri domani senza riscrivere.
7. **CSV-first, .dat-second** → valore pubblicabile prima del reverse engineering.

---

## 10. Domande aperte

- Nome definitivo del progetto e licenza (MIT vs GPL: il GPL è coerente con l'ecosistema G4KLX/CHIRP).
- Il server community è gestito centralmente da te o federabile (ogni sezione ARI un'istanza)?
- Soglie precise di staleness/timeout per il switch remote→local.
- Scope geografico iniziale: solo Italia (RepeaterBook IT + sezioni ARI) o internazionale dal via?
