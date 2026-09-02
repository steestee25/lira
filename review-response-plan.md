# LIRA — Review CIKM 2026 e piano di revisione

**Paper:** *LIRA: a Personal Finance Chatbot for Italian Language*
**Submission:** CIKM 3548 (Demo track)
**Esito:** ❌ **Reject**

## Punteggi

| Reviewer | Relevance to CIKM | Overall | Best paper |
|---|---|---|---|
| R1 | 3 (fair) | **−2 (reject)** | no |
| R2 | 5 (excellent) | **−2 (reject)** | no |
| R3 | 4 (good) | **+1 (weak accept)** | no |
| R4 | 3 (fair) | **+1 (weak accept)** | no |
| **Metareview** | — | **Reject** | — |

---

## Sintesi metareview

> Demo ben realizzata e socialmente rilevante, ma contributo non abbastanza nuovo/sostanziato tecnicamente.

Tre motivi chiave del reject:
1. **Casi d'uso limitati e poco differenziati** rispetto a soluzioni esistenti (banking app).
2. **Evidenza debole** su trustworthiness (no-hallucination/grounding) ed efficienza on-device.
3. **Accessibilità ridotta** di una demo solo-italiano per una venue internazionale.

---

## Review integrali

### Review 1 — Relevance 3 · Overall −2

**Strengths**
- S1) Paper ben scritto e di facile lettura.
- S2) Related work adeguato.
- S3) Applicazione cross-platform: mobile e web.

**Weaknesses**
- W1) Motivazione insufficiente per il fine-tuning di Gemma3 1B e SmolLM3. Gli esempi riguardano spiegazioni di concetti economico-finanziari, già gestibili da assistenti esistenti senza condividere dati sensibili → la sola privacy non basta; connettività e latenza non sono argomenti forti (per un chatbot una latenza un po' più alta è accettabile).
- W2) La componente di financial tracking non è particolarmente nuova: funzionalità simili esistono in molte app e nell'online banking → chiarire cosa la rende diversa/più utile.
- W3) Nel secondo use case va reso più esplicito **come** avvengono le aggregazioni dei dati e **che tipo di insight** si ottengono.

**Testo**
> Il paper è ben scritto, related work adeguato, cross-platform positivo. Ma il contributo non è abbastanza convincente. Il fine-tuning di modelli molto piccoli per l'assistenza conversazionale non è ben motivato; privacy, connettività e latenza non pienamente persuasivi. La componente di tracking appare simile a soluzioni esistenti e il secondo use case manca di dettagli su aggregazioni e insight.

### Review 2 — Relevance 5 · Overall −2

**Strengths**
- S1) Lavora su un'area chiave per CIKM.
- S2) Chatbot resource-light.
- S3) Implementazione open source.

**Weaknesses**
- W1) Casi d'uso proposti limitati.
- W2) Funzionalità di ricerca rudimentale per l'apprendimento.
- W3) Rivolto solo agli utenti di lingua italiana.

**Testo**
> Demo di uno small language model per l'analisi delle spese personali e l'apprendimento di concetti finanziari, in italiano, con dataset costruito dall'iniziativa "CONSOB Investor Education". Meriti: area chiave per CIKM (applicazioni sociali con AI); dataset curato + chatbot leggero; codice open source. Demeriti: i due use case sono per lo più già supportati dalle app di mobile banking; l'uso del modello sembra rudimentale (solo lookup di concetti, ottenibile con semplici metodi di retrieval); non è immediatamente chiaro che la demo sia solo in italiano — sarebbe stato utile anche per utenti anglofoni. Nel complesso ben confezionata, ma non è chiaro se ci siano solidi risultati tecnici a supporto.

### Review 3 — Relevance 4 · Overall +1

**Strengths**
- S1) Problema chiaro e pratico, target ben definito (utenti italofoni con bassa financial literacy); rilevanza per QA, retrieval, RAG, information management.
- S2) Sistema funzionante e deployato: web app pubblica, app iOS/Android (React Native + Expo), demo video, repo open source.
- S3) Architettura sensata e attuale: RAG su materiali regolatori autorevoli (CONSOB) + fine-tuning LoRA + inferenza SLM on-device che tiene i dati sul dispositivo.
- S4) Nuova risorsa dati riusabile: dataset QA di finanza personale in italiano (1.740 coppie), che colma un gap (prior work centrato su inglese e documenti finanziari corporate).

**Weaknesses**
- W1) **Evidenza minima per le tesi centrali.** Il paper posiziona come punti di forza risposte grounded/affidabili e l'efficienza on-device, ma l'unica valutazione quantitativa è BERTScore-F1 (similarità semantica, non fedeltà all'evidenza né correttezza fattuale). L'unico esempio qualitativo (Tabella 2) non basta. Servirebbero: un piccolo controllo di faithfulness rispetto all'evidenza recuperata + una misura di latenza/memoria su dispositivo reale.
- W2) **Nessuna evidenza della personalizzazione.** La personalizzazione literacy-aware è presentata come feature centrale (abstract, contributi, §3.3/3.4, Use Case 1) ma non verificata. Basterebbe una coppia di risposte alla stessa domanda con profilo *novice* vs *expert*.
- W3) **Esperienza demo limitata per un pubblico internazionale.** UI e risposte sono in italiano (gli esempi nelle Figure 2 e 3 sono in italiano); a una venue internazionale chi non legge l'italiano non può valutare la qualità delle risposte grounded/personalizzate. Utile una modalità bilingue o annotazioni in inglese degli esempi.

**Testo**
> Altamente rilevante per i temi CIKM; sistema deployato e usabile + nuovo dataset. Design allineato ai requisiti reali del dominio. Tuttavia i punti di forza dichiarati (grounding/trustworthiness, efficienza on-device, personalizzazione) non sono supportati nemmeno da evidenza minima. Non fatali per il demo track e risolvibili con evidenza semplice e miglioramenti alla demo → weak accept.

### Review 4 — Relevance 3 · Overall +1

**Strengths**
- Applicazione reale rilevante: financial literacy socialmente utile.
- Target ben definito: la maggior parte dei sistemi di finance QA è English-centric, quindi rilevanza pratica.
- Buona demo: si può interagire, fare domande, ispezionare i profili finanziari personalizzati.

**Weaknesses**
- Novità di ricerca limitata: RAG chatbot + finance QA + LoRA è una pipeline standard.
- La finanza richiede test robusti sulle allucinazioni, attualmente mancanti.
- Perché BERTScore? La similarità semantica non prova che il consiglio finanziario sia corretto.

**Testo**
> Borderline / weak accept. Demo utile e interessante, ma il contributo scientifico non è molto originale.

---

## Temi ricorrenti

| # | Tema | Sollevato da | Frequenza / gravità |
|---|---|---|---|
| 1 | Novità limitata / pipeline standard | R1 (W2), R2 (W1), R4, metareview | 🔴 Alta — motivo primario del reject |
| 2 | Motivazione debole per SLM on-device / fine-tuning | R1 (W1), metareview | 🔴 Alta |
| 3 | Trustworthiness / hallucination non valutata (solo BERTScore) | R3 (W1), R4, metareview | 🔴 Alta |
| 4 | Personalizzazione dichiarata ma non dimostrata | R3 (W2) | 🟠 Media (feature già esiste, manca evidenza) |
| 5 | Aggregazioni/insight poco dettagliati; "ricerca rudimentale" | R1 (W3), R2 (W2) | 🟠 Media |
| 6 | Accessibilità internazionale (solo italiano) | R2 (W3), R3 (W3), metareview | 🟠 Media |

---

## Piano d'azione prioritizzato

Legenda tipo: 🟢 quick win (solo testo/riscrittura) · 🟡 esperimento leggero · 🔴 lavoro sostanziale.

### Tema 1 — Novità / differenziazione
- **Reviewer:** pipeline standard (RAG+QA+LoRA); use case sovrapposti alle banking app.
- **Cosa si può fare:**
  - 🟢 Riformulare il contributo attorno all'**integrazione** (educazione grounded + tracking + personalizzazione literacy-aware, tutto on-device e privacy-preserving in italiano), non ai singoli mattoni. Nessuna banking app combina questi elementi.
  - 🟢 Aggiungere in §3/§5 un confronto esplicito (tabella) LIRA vs banking app vs assistente LLM generalista sulle dimensioni: grounding su fonte regolatoria, privacy on-device, offline, personalizzazione literacy, lingua IT.
  - 🟡 Rafforzare la parte conversazionale oltre il "lookup" (multi-turn coerente, follow-up contestuali) con un esempio che mostri qualcosa che il solo retrieval non fa.

### Tema 2 — Motivazione on-device / fine-tuning
- **Reviewer:** privacy/latenza/connettività non bastano; "già fattibile con assistenti esistenti".
- **Cosa si può fare:**
  - 🟢 Argomentare meglio il *perché on-device*: dati finanziari personali che **non lasciano mai** il dispositivo (non solo "privacy" generica), **assenza di costi ricorrenti per utente** (rilevante per uno strumento educativo/pubblico), funzionamento **offline reale**, e assenza di dipendenza da API di terzi. Contrapporlo esplicitamente agli assistenti cloud generalisti.
  - 🟡/🔴 Fornire **numeri** che dimostrino la fattibilità on-device (vedi Esperimenti E2): latenza per risposta e memoria su dispositivo reale. Questo trasforma "on-device" da claim a fatto.
  - 🟢 Motivare il fine-tuning con i **numeri già presenti** (F1 +7.0%→+11.7% su baseline): un modello piccolo non fine-tunato non è adeguato → il fine-tuning è ciò che rende il modello on-device utilizzabile.

### Tema 3 — Trustworthiness / hallucination
- **Reviewer:** solo BERTScore; manca fedeltà all'evidenza e correttezza fattuale.
- **Cosa si può fare:**
  - 🟡 Aggiungere un **controllo di faithfulness/groundedness** sul test set: quota di risposte supportate dall'evidenza recuperata (vedi Esperimento E1). Anche su un sottoinsieme.
  - 🟢 Motivare BERTScore come *complemento* (fluenza/aderenza) e posizionare faithfulness come metrica di trustworthiness.
  - 🟢 Ampliare gli esempi qualitativi (oltre la Tabella 2) mostrando risposta + evidenza citata.

### Tema 4 — Personalizzazione non dimostrata
- **Reviewer:** literacy-aware personalization dichiarata ma non verificata.
- **Nota:** la feature **è già implementata** (profilo dal questionario di 13 domande che condiziona vocabolario/profondità/terminologia). Il gap è **di evidenza**, non di funzionalità.
- **Cosa si può fare:**
  - 🟡 Generare e includere una **coppia di risposte** alla stessa domanda con profilo *novice* vs *expert* (vedi Esperimento E3). Intervento a basso costo e ad alto impatto (R3 lo indica esplicitamente).

### Tema 5 — Aggregazioni / insight (Use Case #2)
- **Reviewer:** poco chiaro come si aggregano i dati e che insight emergono; interazione "rudimentale".
- **Cosa si può fare:**
  - 🟢 Dettagliare in §3.3/§5.2 la pipeline di aggregazione (per categoria e intervallo temporale) e il **prompt/logica** con cui il modello genera gli insight; elencare i tipi di insight (es. aumento spese ricorrenti, anomalia per categoria).
  - 🟢 Aggiungere un esempio concreto input→aggregazione→insight generato.

### Tema 6 — Accessibilità internazionale
- **Reviewer:** UI e risposte in italiano; pubblico internazionale non valuta la qualità.
- **Cosa si può fare:**
  - 🟢 **Opzione minima (demo):** annotazioni/traduzioni in inglese affiancate agli esempi (Figure 2–3) e nella UI della demo pubblica; chiarire da subito che il sistema è in italiano.
  - 🔴 **Opzione estesa:** modalità bilingue reale (dataset/modello EN) — impegno maggiore, valutare solo se la venue lo richiede.

---

## Esperimenti da eseguire sull'host remoto

> Codice di fine-tuning e server sono sull'host remoto. Per ciascun esperimento: obiettivo, output atteso, e **cosa mi serve da te**.

### E1 — Faithfulness / groundedness (Tema 3)
- **Obiettivo:** misurare quanta parte delle risposte è effettivamente supportata dai passaggi CONSOB recuperati (non solo simile ai reference).
- **Output atteso:** una % di groundedness/faithfulness sul test set (174 esempi) per i modelli fine-tuned, + qualche esempio annotato.
- **Approccio:** LLM-as-judge (giudica se la risposta è supportata dall'evidenza) oppure metrica di groundedness; su tutto il test set o su un campione.
- **Mi serve:** path del test set e delle predizioni (o script di inferenza già usato per la Tabella 1); accesso a un modello giudice (API o locale) e conferma se è ammesso; struttura output (question, retrieved passages, generated answer, reference).

### E2 — Misure on-device: latenza e memoria (Temi 2, 3)
- **Obiettivo:** dimostrare la fattibilità on-device con numeri reali.
- **Output atteso:** per Gemma3 270M, Gemma3 1B, SmolLM3 → latenza per risposta (es. tempo al primo token e/o tempo totale medio) e picco di RAM/memoria; idealmente su un dispositivo mobile reale, in subordine su un profilo rappresentativo.
- **Mi serve:** su quale dispositivo/runtime gira l'inferenza mobile (es. runtime on-device, quantizzazione usata); come si lancia l'inferenza on-device; se possiamo strumentare tempi/memoria o se hai già log da cui estrarre i numeri.

### E3 — Esempio novice vs expert (Tema 4)
- **Obiettivo:** dimostrare che la personalizzazione literacy-aware funziona.
- **Output atteso:** stessa domanda, due risposte generate con profilo *novice* e *expert*, evidenziando le differenze di vocabolario/profondità.
- **Mi serve:** come si imposta il profilo nella pipeline di generazione (campo/prompt che condiziona la risposta); comando per generare con un profilo dato; 1–2 domande rappresentative da usare.

---

## Interventi non sperimentali (checklist quick win)

- [ ] Riscrivere il framing del contributo sull'**integrazione** end-to-end, non sui singoli componenti (Tema 1).
- [ ] Tabella comparativa LIRA vs banking app vs assistente LLM cloud (Tema 1).
- [ ] Rafforzare la motivazione on-device: dati mai in cloud + zero costi ricorrenti + offline reale + no dipendenza API (Tema 2).
- [ ] Motivare il fine-tuning con i guadagni F1 già presenti (Tema 2).
- [ ] Posizionare BERTScore come complemento e introdurre la faithfulness come metrica di trustworthiness (Tema 3).
- [ ] Dettagliare pipeline di aggregazione e generazione insight del Use Case #2 + esempio concreto (Tema 5).
- [ ] Chiarire diff. vs banking app per il tracking (Tema 5/1).
- [ ] Annotazioni/traduzioni EN degli esempi e chiarimento "sistema in italiano" nella demo (Tema 6).
- [ ] Esplicitare fin dall'abstract/contributi che la personalizzazione è **verificata** con esempio (Tema 4).

---

## Sintesi priorità

| Intervento | Tema | Impatto sul reject | Sforzo |
|---|---|---|---|
| E2 — numeri latenza/memoria on-device | 2, 3 | Alto | 🟡🔴 |
| E1 — faithfulness sul test set | 3 | Alto | 🟡 |
| E3 — esempio novice vs expert | 4 | Alto (R3 lo chiede) | 🟡 |
| Re-framing contributo su integrazione + tabella comparativa | 1 | Alto | 🟢 |
| Motivazione on-device rafforzata (costi/offline/no-API) | 2 | Medio-Alto | 🟢 |
| Dettaglio aggregazioni/insight Use Case #2 | 5 | Medio | 🟢 |
| Annotazioni EN / chiarimento lingua nella demo | 6 | Medio | 🟢 |

**Strategia consigliata per re-submission:** i tre esperimenti (E1–E3) chiudono le critiche più gravi e ripetute (trustworthiness, on-device, personalizzazione) con costo contenuto; i quick win di re-framing (Temi 1–2) rispondono al punto più insistito della metareview (novità/differenziazione). Insieme convertono i due weak-accept in accept e attaccano direttamente i due reject.
