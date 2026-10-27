const CONFIG = Object.freeze({
  WHATSAPP_NUMBER: "393342900638",
  DELIVERY_FEE: 1.00,
  // Giorni di chiusura settimanale: 0=Domenica, 1=Lunedì, 2=Martedì, 3=Mercoledì, 4=Giovedì, 5=Venerdì, 6=Sabato
  CLOSED_DAYS: [2],
  // Eccezioni: date (formato "AAAA-MM-GG") in cui la pizzeria è APERTA anche se cade in un giorno di chiusura
  OPEN_EXCEPTIONS: ["2026-10-27"],
  // Eccezioni: date (formato "AAAA-MM-GG") in cui la pizzeria è CHIUSA anche se non è un giorno di chiusura abituale (es. festività)
  CLOSED_EXCEPTIONS: [],
  // Fascia oraria entro cui è possibile ORDINARE (formato 24h "HH:MM"). Fuori da questa fascia compare il modale.
  ORDER_FROM: "09:00",
  ORDER_TO: "22:30",
  // Orari di apertura MOSTRATI nel modale all'utente
  OPEN_FROM: "19:00",
  OPEN_TO: "23:00",
  // Fascia oraria selezionabile per la CONSEGNA al checkout
  DELIVERY_FROM: "19:30",
  DELIVERY_TO: "23:00"
});

