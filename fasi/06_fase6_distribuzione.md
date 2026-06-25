# Fase 6 — Distribuzione: APK & store

> Obiettivo: dopo che la PWA gira bene online (Vercel) e installata via "Aggiungi a Home", trasformarla in una vera app Android distribuibile. Step opzionale, da fare solo se la web app funziona e ti serve la presenza sullo store. La PWA resta la base: l'app Android è solo un "guscio" che la mostra a tutto schermo.

## Strategia: prima PWA, poi (eventualmente) app

L'ordine di valore decrescente:

1. **PWA installata** ("Aggiungi a Home") — costo 0, zero burocrazia, funziona già a fine Fase 4. Per uso personale spesso basta questa.
2. **APK sideloaded** — generi il file `.apk` e te lo installi a mano sul telefono. Costo 0, nessuno store. Ottimo per averla come "app vera" sul tuo telefono senza pubblicarla.
3. **Pubblicazione su Google Play** — 25 $ una tantum + un po' di burocrazia. Serve solo se vuoi che altri la scarichino dallo store.
4. **Pubblicazione su Apple App Store** — 99 $/anno. Da valutare solo se serve davvero la presenza su iOS store.

## Come si genera l'app Android (gratis)

La tecnologia si chiama **TWA (Trusted Web Activity)**: l'app Android è un contenitore che apre a tutto schermo la tua PWA online, senza barra del browser. Richiede che il sito sia in HTTPS (Vercel lo è già) e un manifest valido (lo hai dalla Fase 4).

Due strumenti, stesso motore sotto (entrambi usano Bubblewrap di Google):

### Opzione A — PWABuilder (più semplice, via web)

1. Vai su **pwabuilder.com**
2. Incolla l'URL della PWA in produzione (es. `https://gymapp.vercel.app`)
3. Lo strumento analizza manifest e service worker e dà un punteggio
4. Sezione "Package for stores" → Android → genera uno **zip** che contiene:
   - `.apk` → per i test / sideload sul telefono
   - `.aab` (Android App Bundle) → il file da caricare su Google Play
   - il file `assetlinks.json` e le istruzioni di firma

### Opzione B — Bubblewrap (CLI, più controllo)

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://gymapp.vercel.app/manifest.webmanifest
bubblewrap build
```

Genera lo stesso tipo di output. Più adatto se vuoi automatizzare/versionare il progetto Android.

## Digital Asset Links (passaggio obbligatorio)

Perché l'app si apra a tutto schermo (senza la barra di Chrome) deve dimostrare di "possedere" il dominio. Si fa pubblicando un file **`assetlinks.json`** in `https://TUO-DOMINIO/.well-known/assetlinks.json`, contenente l'impronta (SHA-256) della chiave con cui hai firmato l'app. PWABuilder/Bubblewrap te lo generano: basta metterlo nella cartella `public/.well-known/` del progetto Vite e ridepoyare su Vercel.

Senza questo file l'app funziona lo stesso ma mostra una mini-barra di Chrome in alto.

## Costi e regole degli store (giugno 2026)

### Google Play — 25 $ **una tantum**

- Pagamento unico alla registrazione dell'account sviluppatore (carta di credito/debito, no prepagate). Mai più rinnovi, app illimitate.
- ⚠️ **Regola per i nuovi account personali**: prima di pubblicare in produzione devi passare da un **test chiuso con almeno 12 tester per 14 giorni** continuativi. Seccatura nota, ma fattibile (i 12 possono essere account email che inviti).
- Richiesta **verifica d'identità** del developer (documento).
- Carichi il file `.aab`, compili la scheda dello store (descrizione, screenshot, icona, privacy policy) e invii per revisione.

### Apple App Store — 99 $/anno

- Account Apple Developer Program a pagamento, rinnovo annuale.
- Su iOS una PWA "wrappata" è più delicata (storicamente Apple ha rifiutato app che sono solo un contenitore web): valutarla solo se serve davvero. Per uso personale su iPhone, "Aggiungi a Home Screen" copre già tutto.

## Quando passare alle app native vere e proprie

Lo step sopra (TWA) resta una PWA dentro un guscio: stesso codice, stessi limiti del web. Si passa a un'app **nativa** (es. React Native / Expo, che riusa molto del know-how React) solo se servono cose che il web non fa bene:

- integrazione con Apple Watch / wearable
- notifiche push affidabili su iOS
- accesso hardware avanzato
- presenza "seria" su App Store iOS

Per ora non serve: la roadmap resta PWA → (eventuale) APK/Play Store. Le app native si valutano solo se l'app prende piede e questi limiti diventano un problema reale.

## Checklist Fase 6 (se/quando la fai)

- [ ] PWA in produzione su Vercel, HTTPS, manifest e service worker OK (lighthouse PWA verde)
- [ ] Generato `.apk`/`.aab` con PWABuilder o Bubblewrap
- [ ] `assetlinks.json` pubblicato in `/.well-known/` e ridepoyato
- [ ] `.apk` installato sul telefono e testato a tutto schermo (no barra Chrome)
- [ ] (Solo per store) account Google Play creato, identità verificata, 25 $ pagati
- [ ] (Solo per store) test chiuso 12 tester / 14 giorni completato
- [ ] (Solo per store) scheda Play compilata + privacy policy + screenshot, inviata in revisione

## Note per Claude Code

- Non serve toccare il codice dell'app: la TWA punta all'URL già online.
- L'unica modifica al repo è aggiungere `public/.well-known/assetlinks.json` e ridepoyare.
- Conserva con cura il **keystore di firma** (la chiave .jks): se lo perdi non puoi più aggiornare l'app sullo store.
- Aggiorna `AGGIORNAMENTO_PROGETTO.md` con: data generazione APK, eventuale account Play, link store.
