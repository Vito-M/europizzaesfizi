**Sito online:** https://vito-m.github.io/europizzaesfizi/

# Euro Pizza & Sfizi — Sito e Ordini Online

Sito web responsive e mobile-first per la pizzeria Euro Pizza & Sfizi. La homepage presenta il locale, le recensioni, la posizione e i contatti. La pagina dedicata agli ordini permette di consultare il menu, personalizzare le pizze e comporre un messaggio da inviare alla pizzeria tramite WhatsApp.

Il sito è statico: non richiede un backend, un database o una procedura di compilazione.

## Funzionalità

- Homepage con collegamento agli ordini, recensioni, invito a lasciare una recensione e mappa Google Maps.
- Ordinazione telefonica tramite collegamenti chiamabili ai numeri **080 993 4688** e **334 290 0638**.
- Menu suddiviso in quattro categorie: **Pizze, Sfizi, Dolci e Bevande**.
- Pulsante **Aggiungi** su ogni prodotto e **Personalizza** sulle pizze, per selezionare supplementi e inserire richieste particolari.
- Carrello con quantità modificabili, rimozione dei prodotti e totale indicativo comprensivo di supplementi e consegna. Il totale definitivo viene confermato dalla pizzeria.
- Checkout con nome, cognome, indirizzo e orario di consegna desiderato.
- Orari di consegna dalle **19:30 alle 23:00**, inclusi, ogni **15 minuti**.
- Avvisi di chiusura basati su giorni, date eccezionali e fascia oraria configurabili.
- Riepilogo WhatsApp con cliente, indirizzo, orario, prodotti, quantità e personalizzazioni.

### Come funziona il passaggio a WhatsApp

Il cliente compone il carrello, inserisce i propri dati e seleziona **Prepara ordine WhatsApp**. Il sito mostra il riepilogo pronto con il collegamento **Apri WhatsApp**. Il cliente apre la chat e preme **Invia** all’interno di WhatsApp.

**Il sito non invia messaggi automaticamente e non può verificare se il cliente li ha effettivamente inviati.** L’ordine deve inoltre essere confermato dalla pizzeria nella chat. Chiudere il riepilogo non svuota il carrello, che resta disponibile per correggere o riprovare.

### Gestione dei dati

Dati del checkout e carrello sono mantenuti in memoria durante l’utilizzo della pagina: il sito non li salva su un proprio server, in un database o nel localStorage. Servono a comporre il messaggio; vengono condivisi con la pizzeria quando il cliente lo invia tramite WhatsApp. Un ricaricamento della pagina azzera il carrello.

## Tecnologie utilizzate

- **HTML5** per la struttura delle pagine.
- **CSS3** per stile, layout responsive, focus visibile e adattamento dei dialoghi allo spazio disponibile con la tastiera mobile.
- **JavaScript Vanilla** per menu, personalizzazioni, carrello, validazione e composizione del collegamento WhatsApp, senza framework o librerie di runtime.
- **JSON** per mantenere prodotti, prezzi, supplementi e recensioni separati dall’interfaccia.
- **Content Security Policy**, validazione degli input e rendering dei dati del menu e delle recensioni con `createElement` e `textContent` come misure di sicurezza.
- **Bree Serif e DM Sans**, provenienti da Google Fonts ma ospitati localmente nella cartella `assets/fonts`, insieme alle licenze OFL.
- **WhatsApp Click-to-Chat** (`wa.me`) per aprire la chat con il testo precompilato.
- **Google Maps** per la mappa e le indicazioni stradali.
- **GitHub Pages** per la pubblicazione del sito statico.

## Struttura dei file

```text
index.html              Homepage
ordina.html             Pagina delle ordinazioni
menu.json               Prodotti, prezzi e supplementi
data/reviews.json       Recensioni mostrate in homepage
assets/css/site.css     Stili condivisi e homepage
assets/css/orders.css   Stili della pagina ordini
assets/js/config.js     Configurazione della pizzeria
assets/js/home.js       Caricamento e visualizzazione recensioni
assets/js/orders.js     Logica delle ordinazioni
assets/fonts/           Font locali e licenze
assets/                 Immagini e favicon
```

## Configurazione

**La configurazione è ancora presente nell’oggetto `CONFIG` del file `assets/js/config.js`. Non si trova più dentro lo script di `index.html`.** La pagina `ordina.html` carica questo file prima della logica degli ordini.

Per cambiare un parametro, modificare il file, salvarlo e pubblicare la versione aggiornata nel repository. Dopo la pubblicazione, ricaricare la pagina; se il browser conserva una vecchia copia, aggiornare anche il parametro `?v=...` del relativo riferimento allo script in `ordina.html`.

La configurazione attuale è:

```js
const CONFIG = Object.freeze({
  WHATSAPP_NUMBER: "393342900638",
  DELIVERY_FEE: 1.00,
  CLOSED_DAYS: [2],
  OPEN_EXCEPTIONS: [],
  CLOSED_EXCEPTIONS: [],
  ORDER_FROM: "09:00",
  ORDER_TO: "22:30",
  OPEN_FROM: "19:00",
  OPEN_TO: "23:00",
  DELIVERY_FROM: "19:30",
  DELIVERY_TO: "23:00"
});
```

`Object.freeze` non impedisce di modificare manualmente il file: i nuovi valori vengono letti al successivo caricamento della pagina. Mantenere la sintassi JavaScript valida, comprese virgolette, parentesi e virgole.

### Numero WhatsApp e consegna

- **`WHATSAPP_NUMBER`**: destinatario degli ordini, con prefisso internazionale e senza `+`, spazi o altri segni. Attualmente `393342900638`.
- **`DELIVERY_FEE`**: costo di consegna aggiunto una sola volta al totale di un carrello non vuoto. Attualmente **1,00 €**. Nel codice usare il punto decimale, per esempio `1.50`.

I numeri dei collegamenti telefonici sono scritti nelle pagine HTML: cambiare `WHATSAPP_NUMBER` non modifica automaticamente i pulsanti **Chiama** o i contatti della homepage.

### Giorni di chiusura ed eccezioni

- **`CLOSED_DAYS`**: giorni di chiusura settimanale. `0` = domenica, `1` = lunedì, `2` = martedì, `3` = mercoledì, `4` = giovedì, `5` = venerdì, `6` = sabato. Il valore attuale `[2]` indica il martedì. Per due giorni usare, per esempio, `[1, 2]`; per nessuna chiusura settimanale usare `[]`.
- **`OPEN_EXCEPTIONS`**: date di apertura straordinaria, anche durante un giorno normalmente chiuso. Formato `"AAAA-MM-GG"`, per esempio `["2026-12-08"]`.
- **`CLOSED_EXCEPTIONS`**: date di chiusura straordinaria, per esempio `["2026-12-25", "2027-01-01"]`.

Se la stessa data compare in entrambi gli elenchi, **l’eccezione di apertura ha precedenza**: evitare duplicazioni involontarie.

### Fasce orarie

Gli orari si scrivono nel formato 24 ore `"HH:MM"`. Le tre coppie hanno funzioni distinte:

| Parametri | Valori attuali | Funzione |
| --- | --- | --- |
| `ORDER_FROM` / `ORDER_TO` | `09:00` / `22:30` | Fascia usata per mostrare l’avviso di ordinazione fuori orario. |
| `OPEN_FROM` / `OPEN_TO` | `19:00` / `23:00` | Orari di apertura riportati nel messaggio informativo. |
| `DELIVERY_FROM` / `DELIVERY_TO` | `19:30` / `23:00` | Estremi degli orari di consegna selezionabili nel checkout. |

**La fascia `ORDER_FROM`–`ORDER_TO` non determina gli orari del menu a tendina:** questi dipendono esclusivamente da `DELIVERY_FROM` e `DELIVERY_TO`.

L’intervallo di **15 minuti** è definito in `assets/js/orders.js`, sia nella generazione degli slot sia nella loro validazione; non è un parametro dell’oggetto `CONFIG`. Con la configurazione attuale sono disponibili 15 orari, dalle 19:30 alle 23:00.

Quando si apre la pagina ordini in un giorno di chiusura o fuori fascia, compare un avviso. Il menu resta consultabile. Nel giorno di chiusura, preparare il messaggio richiede una conferma aggiuntiva; l’avviso fuori orario non costituisce un blocco assoluto all’apertura di WhatsApp. Data e ora utilizzate sono quelle locali del dispositivo del cliente.

## Aggiornare menu e supplementi

Modificare **`menu.json`** per aggiornare prodotti e prezzi, mantenendo la struttura esistente. Le categorie principali sono `pizze`, `sfizi`, `dolci` e `bevande`; i prodotti usano i campi `nome`, `prezzo` e, quando presente, `descrizione`.

I supplementi si trovano in `pizze.supplementi`:

```json
{
  "nome": "Mozzarella di Bufala DOP",
  "prezzo": 1.5,
  "gruppo": "mozzarella"
}
```

I supplementi dello stesso `gruppo` sono mutuamente esclusivi: si può scegliere una sola alternativa per la mozzarella e una sola per l’impasto, combinando liberamente gruppi diversi. I supplementi senza gruppo non si escludono tra loro. Il loro prezzo si aggiunge a quello della pizza; le richieste libere vengono riportate nelle note dell’ordine.

## Aggiornare recensioni e contatti

Le tre recensioni visualizzate sono in **`data/reviews.json`**. Nomi e stelle provengono dalle immagini fornite dal proprietario; i testi sono stati rivisti solo nella forma.

Il punteggio complessivo **4,7 su 66 recensioni** è impostato separatamente in `index.html`: non viene calcolato dalle tre recensioni selezionate né aggiornato automaticamente da Google. Per modificarlo, aggiornare anche il testo accessibile delle stelle e il numero di recensioni.

Collegamenti Maps, invito a recensire e contatti sono in `index.html`; il collegamento telefonico della pagina ordini è in `ordina.html`. La mappa si carica automaticamente e mantiene un collegamento esterno alternativo. L’integrazione attuale non richiede una API key configurata nel progetto.

---

Sito creato da **Vito Marchionna**, dottore in **Informatica e Tecnologie per la Produzione del Software** presso l’**Università degli Studi di Bari Aldo Moro**.
