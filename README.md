# Euro Pizza & Sfizi — Ordini Online

Interfaccia web mobile-first per la pizzeria Euro Pizza & Sfizi. Permette ai
clienti di sfogliare il menu, comporre il carrello e inviare l'ordine
direttamente su WhatsApp.

## Funzionalità

- Menu suddiviso in quattro categorie: Pizze, Sfizi, Dolci e Bevande.
- Tasto Aggiungi su ogni prodotto e, per le sole pizze, tasto Modifica per
  inserire richieste particolari.
- Carrello con quantità modificabili e totale indicativo comprensivo del costo
  di spedizione. Il totale definitivo viene calcolato dalla pizzeria, poiché le
  modifiche possono variare il prezzo.
- Checkout con nome, cognome e indirizzo e informativa GDPR: i dati inseriti non
  vengono salvati né su server né sul sito, restano solo sul dispositivo
  dell'utente e servono unicamente a comporre il messaggio WhatsApp.
- Invio dell'ordine tramite WhatsApp con messaggio già formattato.
- Modale di conferma che avvisa l'utente che l'ordine è stato inviato ma è in
  attesa di conferma da parte della pizzeria.

## Tecnologie utilizzate

- HTML5 per la struttura della pagina.
- CSS3 per lo stile e il layout responsive mobile-first, senza framework esterni.
- JavaScript (Vanilla, ES6) per la logica di menu, carrello e composizione del
  messaggio. Il rendering dei contenuti avviene esclusivamente tramite
  textContent e createElement, per prevenire attacchi di tipo XSS.
- JSON per il menu, esterno al codice (menu.json), così da modificare prodotti e
  prezzi senza intervenire sull'HTML.
- Content Security Policy e validazione degli input come misure di sicurezza
  aggiuntive.
- Google Fonts per la tipografia.
- API WhatsApp Click-to-Chat (wa.me) per l'invio dell'ordine.

## Configurazione

I parametri principali si trovano in cima allo `<script>` del file `index.html`,
nell'oggetto `CONFIG`.

- `WHATSAPP_NUMBER`: il numero su cui arrivano gli ordini, con prefisso
  internazionale e senza segni o spazi. Attualmente impostato su `393342900638`.
- `DELIVERY_FEE`: il costo di spedizione aggiunto al totale indicativo.
- `CLOSED_DAYS`: i giorni di chiusura settimanale. I numeri vanno da 0 a 6, dove
  0 è Domenica, 1 Lunedì, 2 Martedì e così via. Attualmente è `[2]`, quindi ogni
  martedì il sito mostra in alto l'avviso che la pizzeria è chiusa. Per cambiare
  giorno basta sostituire il numero; per più giorni si elencano separati da
  virgola, ad esempio `[1, 2]`.
- `OPEN_EXCEPTIONS`: elenco di date specifiche in cui la pizzeria è aperta anche
  se cade in un giorno di chiusura. Le date vanno nel formato `"AAAA-MM-GG"`, ad
  esempio `["2026-06-16"]` per restare aperti quel martedì.
- `CLOSED_EXCEPTIONS`: elenco di date in cui la pizzeria è chiusa anche se non è
  un giorno di chiusura abituale, utile per le festività.
- `ORDER_FROM` e `ORDER_TO`: la fascia oraria (formato 24 ore `"HH:MM"`) entro
  cui è possibile ordinare. Attualmente dalle `09:00` alle `22:30`. Fuori da
  questa fascia compare un modale che avvisa che la pizzeria è chiusa. Questa
  fascia determina anche gli orari selezionabili per la consegna.
- `OPEN_FROM` e `OPEN_TO`: gli orari di apertura mostrati all'utente nel modale
  di chiusura. Attualmente dalle `19:00` alle `23:00`.

All'apertura del sito, se il giorno è di chiusura o l'ora è fuori dalla fascia di
ordinazione, compare un modale informativo. Il menu resta comunque sfogliabile.
Nella schermata dei dati il cliente seleziona inoltre un orario di consegna, che
viene incluso nel messaggio WhatsApp inviato alla pizzeria.

---

Sito creato da Vito Marchionna.
