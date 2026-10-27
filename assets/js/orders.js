const MENU = {};                 // riempito dal fetch, contenuto non fidato per il rendering
let cart = [];                   // {id, name, price, qty, note}
let pendingEdit = null;

const currency = new Intl.NumberFormat('it-IT', {style: 'currency', currency: 'EUR'});
const fmt = n => currency.format(Number(n));
const $ = s => document.querySelector(s);

/* Crea un elemento con testo sicuro (mai innerHTML su dati esterni) */
function el(tag, cls, text){
  const e = document.createElement(tag);
  if(cls) e.className = cls;
  if(text != null) e.textContent = text;     // textContent neutralizza qualsiasi HTML/script
  return e;
}

/* Normalizza un prezzo proveniente dal JSON in numero valido >= 0 */
function safePrice(v){
  const n = Number(v);
  return (Number.isFinite(n) && n >= 0) ? n : 0;
}

/* ---- Gestione giorni di chiusura ---- */
// Restituisce la data odierna come "AAAA-MM-GG" in orario locale
function todayISO(){
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

// Decide se oggi la pizzeria è chiusa, tenendo conto delle eccezioni
function isClosedToday(){
  const iso = todayISO();
  if(CONFIG.OPEN_EXCEPTIONS.includes(iso)) return false;     // aperto per eccezione
  if(CONFIG.CLOSED_EXCEPTIONS.includes(iso)) return true;    // chiuso per eccezione (es. festività)
  return CONFIG.CLOSED_DAYS.includes(new Date().getDay());   // chiusura settimanale abituale
}

// Converte "HH:MM" in minuti dall'inizio della giornata
function toMinutes(hhmm){
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
}

// Vero se l'ora attuale è fuori dalla fascia in cui si può ordinare
function isOutsideHours(){
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur < toMinutes(CONFIG.ORDER_FROM) || cur > toMinutes(CONFIG.ORDER_TO);
}

// Mostra il modale di chiusura, dando priorità al giorno di chiusura sull'orario
function checkOpenState(){
  const dayClosed = isClosedToday();
  const timeClosed = isOutsideHours();
  if(!dayClosed && !timeClosed) return;

  if(dayClosed){
    $('#closedTitle').textContent = 'Oggi siamo chiusi';
    $('#closedMsg').textContent = 'Oggi la pizzeria è chiusa. Puoi comunque sfogliare il menu; gli ordini ripartono alla prossima apertura.';
    $('#closedHours').textContent = '';
    $('#closedHours').hidden = true;
  } else {
    $('#closedTitle').textContent = 'Siamo chiusi in questo momento';
    $('#closedMsg').textContent = 'In questo momento siamo fuori orario. Puoi sfogliare il menu, ma gli ordini vengono presi solo durante l\'orario di apertura.';
    $('#closedHours').textContent = 'Orario di apertura: ' + CONFIG.OPEN_FROM + ' – ' + CONFIG.OPEN_TO;
    $('#closedHours').hidden = false;
  }
  openOverlay('closedOverlay');
}

/* Carica il menu */
fetch('menu.json')
  .then(r => { if(!r.ok) throw new Error('Menu non disponibile'); return r.json(); })
  .then(data => {
    Object.assign(MENU, data);
    const requested = new URLSearchParams(location.search).get('categoria');
    const category = ['pizze', 'sfizi', 'dolci', 'bevande'].includes(requested) ? requested : 'pizze';
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.cat === category);
      tab.setAttribute('aria-pressed', String(tab.dataset.cat === category));
    });
    renderMenu(category);
  })
  .catch(() => {
    const m = $('#menuList');
    m.textContent = '';
    m.appendChild(el('p', 'empty', 'Impossibile caricare il menu. Ricarica la pagina oppure chiama lo 0809934688 per ordinare.'));
  });

/* Tab */
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-pressed', String(x === t)));
    renderMenu(t.dataset.cat);
    history.replaceState(null, '', '?categoria=' + t.dataset.cat);
    window.scrollTo({ top: 0 });
  });
});

/* Le sole pizze hanno il tasto Modifica */
const EDITABLE = new Set(['pizze']);

function renderMenu(cat){
  const node = MENU[cat] || {};
  const list = $('#menuList');
  list.textContent = '';                       // svuota in modo sicuro

  const categories = Array.isArray(node.categories) ? node.categories : [];
  let idx = 0;
  categories.forEach(group => {
    list.appendChild(el('h2', 'section-title', String(group.title || '')));
    const items = Array.isArray(group.items) ? group.items : [];
    items.forEach(it => {
      const name = String(it.nome || '');
      const price = safePrice(it.prezzo);

      const card = el('article', 'card');
      // ritardo d'ingresso scaglionato, limitato così le liste lunghe non "aspettano"
      card.style.animationDelay = Math.min(idx, 12) * 0.03 + 's';
      idx++;
      const info = el('div', 'info');
      info.appendChild(el('h3', 'name', name));
      if(it.descrizione) info.appendChild(el('div', 'desc', String(it.descrizione)));
      info.appendChild(el('div', 'price', fmt(price)));

      const actions = el('div', 'actions');
      const add = el('button', 'btn-add', 'Aggiungi');
      add.setAttribute('aria-label', 'Aggiungi ' + name);
      add.addEventListener('click', () => addItem(name, price));
      actions.appendChild(add);

      if(EDITABLE.has(cat)){
        const edit = el('button', 'btn-edit', 'Personalizza');
        edit.addEventListener('click', () => openEdit(name, price));
        actions.appendChild(edit);
      }

      card.appendChild(info);
      card.appendChild(actions);
      list.appendChild(card);
    });
  });
}

/* Aggiunge un prodotto semplice (accorpa se senza note) */
function addItem(name, price){
  const existing = cart.find(c => c.name === name && c.price === price && !c.note);
  if(existing){ existing.qty++; }
  else { cart.push({ name, price, qty: 1, note: '' }); }
  updateCart(); bump();
  showToast(name + ' aggiunto');
}

/* Modale modifica */
let editSupps = [];                              // supplementi selezionati nella sessione del modale

function openEdit(name, price){
  pendingEdit = { name, price };
  editSupps = [];
  $('#editTitle').textContent = name;            // textContent: niente injection dal nome
  $('#editNote').value = '';

  // Costruisce i chip dei supplementi (solo per le pizze)
  const box = $('#editSupp');
  box.textContent = '';
  const supps = Array.isArray((MENU.pizze || {}).supplementi) ? MENU.pizze.supplementi : [];
  supps.forEach(s => {
    const sName = String(s.nome || '');
    const sPrice = safePrice(s.prezzo);
    const sGroup = s.gruppo ? String(s.gruppo) : '';
    const chip = el('button', 'supp-chip');
    if(sGroup) chip.dataset.group = sGroup;
    chip.setAttribute('aria-pressed', 'false');
    chip.appendChild(el('span', null, sName));
    chip.appendChild(el('span', 'pp', '+' + fmt(sPrice)));
    chip.addEventListener('click', () => {
      const i = editSupps.findIndex(x => x.nome === sName);
      if(i >= 0){
        // già selezionato: lo tolgo
        editSupps.splice(i, 1);
        chip.classList.remove('on'); chip.setAttribute('aria-pressed', 'false');
      } else {
        // se appartiene a un gruppo, deseleziono prima gli altri dello stesso gruppo
        if(sGroup){
          editSupps = editSupps.filter(x => x.gruppo !== sGroup);
          box.querySelectorAll('.supp-chip[data-group="' + CSS.escape(sGroup) + '"]').forEach(c => { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
        }
        editSupps.push({ nome: sName, prezzo: sPrice, gruppo: sGroup });
        chip.classList.add('on'); chip.setAttribute('aria-pressed', 'true');
      }
    });
    box.appendChild(chip);
  });

  openOverlay('editOverlay');
  if(matchMedia('(pointer: fine)').matches) setTimeout(() => $('#editNote').focus(), 200);
}

$('#editConfirm').addEventListener('click', () => {
  if(!pendingEdit) return;
  const note = $('#editNote').value.trim().slice(0, 300);
  const suppTotal = editSupps.reduce((s, x) => s + x.prezzo, 0);
  // Etichetta dei supplementi da mostrare nel carrello e nel messaggio
  const suppLabel = editSupps.map(x => x.nome).join(', ');
  let fullNote = suppLabel;
  if(note) fullNote = suppLabel ? (suppLabel + ' — ' + note) : note;

  cart.push({
    name: pendingEdit.name,
    price: pendingEdit.price + suppTotal,        // prezzo comprensivo dei supplementi
    qty: 1,
    note: fullNote
  });
  pendingEdit = null;
  editSupps = [];
  closeOverlay('editOverlay');
  updateCart(); bump();
  showToast('Aggiunto al carrello');
});
$('#editCancel').addEventListener('click', () => { pendingEdit = null; editSupps = []; closeOverlay('editOverlay'); });

/* Logica carrello */
function subtotal(){ return cart.reduce((s, c) => s + c.price * c.qty, 0); }
function totalQty(){ return cart.reduce((s, c) => s + c.qty, 0); }

function updateCart(){
  const q = totalQty();
  $('#cartCount').textContent = q;
  $('#cartTotalMini').textContent = fmt(subtotal() + (q > 0 ? CONFIG.DELIVERY_FEE : 0));
  $('#cartBar').classList.toggle('hidden', q === 0);
  renderCartItems();
}

function renderCartItems(){
  const box = $('#cartItems');
  box.textContent = '';
  const totals = $('#cartTotals');
  totals.textContent = '';

  if(cart.length === 0){
    box.appendChild(el('div', 'empty', 'Il carrello è vuoto'));
    $('#goCheckout').style.display = 'none';
    return;
  }
  $('#goCheckout').style.display = '';

  cart.forEach((c, i) => {
    const item = el('div', 'citem');
    const info = el('div', 'ci-info');
    info.appendChild(el('div', 'ci-name', c.name));
    if(c.note) info.appendChild(el('div', 'ci-note', '✎ ' + c.note));
    info.appendChild(el('div', 'ci-price', fmt(c.price * c.qty)));

    const qty = el('div', 'qty');
    const minus = el('button', null, '−');
    minus.setAttribute('aria-label', 'Rimuovi una unità di ' + c.name);
    minus.addEventListener('click', () => chQty(i, -1));
    const span = el('span', null, String(c.qty));
    const plus = el('button', null, '+');
    plus.setAttribute('aria-label', 'Aggiungi una unità di ' + c.name);
    plus.addEventListener('click', () => chQty(i, 1));
    qty.appendChild(minus); qty.appendChild(span); qty.appendChild(plus);

    item.appendChild(info);
    item.appendChild(qty);
    box.appendChild(item);
  });

  const sub = subtotal();
  const rows = [
    ['Subtotale', fmt(sub)],
    ['Spedizione', fmt(CONFIG.DELIVERY_FEE)]
  ];
  rows.forEach(([k, v]) => {
    const r = el('div', 'row');
    r.appendChild(el('span', null, k));
    r.appendChild(el('span', null, v));
    totals.appendChild(r);
  });
  const grand = el('div', 'grand');
  grand.appendChild(el('span', null, 'Totale indicativo'));
  grand.appendChild(el('span', null, fmt(sub + CONFIG.DELIVERY_FEE)));
  totals.appendChild(grand);
  totals.appendChild(el('div', 'note-disc',
    'Il totale è indicativo: eventuali modifiche o aggiunte verranno conteggiate dalla pizzeria al momento della conferma.'));
}

function chQty(i, d){
  cart[i].qty += d;
  if(cart[i].qty <= 0) cart.splice(i, 1);
  updateCart();
}

function bump(){
  const bar = $('#cartBar');
  bar.style.transform = 'scale(1.03)';
  setTimeout(() => bar.style.transform = '', 150);
  const count = $('#cartCount');
  count.classList.remove('pulse');
  void count.offsetWidth;            // forza il reflow per riavviare l'animazione
  count.classList.add('pulse');
}

let toastTimer = null;
function showToast(text){
  const t = $('#toast');
  t.textContent = text;              // textContent: sicuro contro XSS
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
}

/* Dialoghi: focus, tastiera e blocco dello scorrimento. */
let lastFocus = null;
function openOverlay(id){
  lastFocus = document.activeElement;
  const overlay = document.getElementById(id);
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.querySelectorAll('.app, .cartbar').forEach(node => node.inert = true);
  overlay.querySelector('a[href], button, input, textarea, select')?.focus();
}
function closeOverlay(id){
  document.getElementById(id).classList.remove('open');
  if(!document.querySelector('.overlay.open')) {
    document.body.style.overflow = '';
    document.querySelectorAll('.app, .cartbar').forEach(node => node.inert = false);
  }
  if(lastFocus?.isConnected) lastFocus.focus();
}
document.addEventListener('keydown', e => {
  const overlay = [...document.querySelectorAll('.overlay.open')].at(-1);
  if(!overlay) return;
  if(e.key === 'Escape'){ closeOverlay(overlay.id); return; }
  if(e.key !== 'Tab') return;
  const controls = [...overlay.querySelectorAll('button, input, textarea, select, a[href]')].filter(x => x.getClientRects().length && !x.disabled);
  const first = controls[0], last = controls.at(-1);
  if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
});
$('#cartBar').addEventListener('click', () => openOverlay('cartOverlay'));
document.querySelectorAll('[data-close]').forEach(b =>
  b.addEventListener('click', () => closeOverlay(b.dataset.close)));
document.querySelectorAll('.overlay').forEach(o =>
  o.addEventListener('click', e => { if(e.target === o) closeOverlay(o.id); }));
$('#goCheckout').addEventListener('click', () => { closeOverlay('cartOverlay'); openOverlay('checkoutOverlay'); });

/* Validazione input: niente caratteri di controllo, lunghezza limitata */
function cleanField(v, max){
  return String(v).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
}

/* Invio WhatsApp */
$('#sendWhatsapp').addEventListener('click', () => {
  const name = cleanField($('#fName').value, 60);
  const surname = cleanField($('#fSurname').value, 60);
  const addr = cleanField($('#fAddr').value, 120);
  const time = $('#fTime').value;

  if(!name || !surname || !addr){ alert('Compila nome, cognome e indirizzo.'); return; }
  if(!time){ alert('Seleziona un orario di consegna.'); return; }
  if(CONFIG.WHATSAPP_NUMBER.includes('X')){
    alert('Il numero WhatsApp non è ancora stato configurato in assets/js/config.js (CONFIG.WHATSAPP_NUMBER).');
    return;
  }
  // Il numero deve contenere solo cifre: previene URL malformati o manomissioni
  if(!/^\d{8,15}$/.test(CONFIG.WHATSAPP_NUMBER)){
    alert('Il numero WhatsApp configurato non è valido.');
    return;
  }
  // Accetta soltanto gli slot di consegna configurati, estremi inclusi.
  const deliveryMinutes = toMinutes(time);
  const firstSlot = toMinutes(CONFIG.DELIVERY_FROM);
  const lastSlot = toMinutes(CONFIG.DELIVERY_TO);
  if(!/^\d{2}:\d{2}$/.test(time) || deliveryMinutes < firstSlot || deliveryMinutes > lastSlot || (deliveryMinutes - firstSlot) % 15 !== 0){
    alert('Orario di consegna non valido. Seleziona uno degli orari disponibili.'); return;
  }
  if(!cart.length){ alert('Aggiungi almeno un prodotto al carrello.'); return; }
  // Se oggi è giorno di chiusura, chiede conferma prima di inviare
  if(isClosedToday()){
    const proceed = confirm('Oggi la pizzeria è chiusa. L\'ordine potrebbe non essere preso in carico fino alla prossima apertura. Vuoi inviarlo comunque?');
    if(!proceed) return;
  }

  const lines = [];
  lines.push('*NUOVO ORDINE*');
  lines.push('');
  lines.push('*Cliente:* ' + name + ' ' + surname);
  lines.push('*Indirizzo:* ' + addr);
  lines.push('*Orario di consegna:* ' + time);
  lines.push('');
  lines.push('*Ordine:*');
  cart.forEach(c => {
    let line = '• ' + c.qty + 'x ' + c.name;
    if(c.note) line += '  _(' + c.note + ')_';
    lines.push(line);
  });

  const url = 'https://wa.me/' + CONFIG.WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
  // Link reale: il cliente lo apre con un nuovo tocco, anche dopo la conferma di chiusura.
  // Non è possibile sapere dal sito se WhatsApp ha inviato il messaggio.
  $('#whatsappLink').setAttribute('href', url);

  closeOverlay('checkoutOverlay');
  openOverlay('successOverlay');
});

/* Chiusura modale info chiusura + popolamento orari + verifica all'avvio */
$('#closedDone').addEventListener('click', () => closeOverlay('closedOverlay'));

/* Popola il selettore dell'orario di consegna con slot da 15 minuti
   entro la fascia di consegna configurata */
function buildTimeOptions(){
  const sel = $('#fTime');
  sel.textContent = '';
  const placeholder = el('option', null, 'Seleziona un orario');
  placeholder.value = '';
  sel.appendChild(placeholder);
  const start = toMinutes(CONFIG.DELIVERY_FROM);
  const end = toMinutes(CONFIG.DELIVERY_TO);
  for(let m = start; m <= end; m += 15){
    const h = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    const label = h + ':' + mm;
    const opt = el('option', null, label);
    opt.value = label;
    sel.appendChild(opt);
  }
}
buildTimeOptions();
checkOpenState();

updateCart();

/* Mantiene il campo nella parte alta del contenitore, senza far scorrere la pagina. */
function keepFocusedFieldVisible(){
  const field = document.activeElement;
  if(!field?.matches('input, textarea, select') || !field.closest('.overlay.open')) return;
  const scroller = field.closest('.sheet-body, .modal-box');
  if(!scroller) return;
  requestAnimationFrame(() => {
    const top = field.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    scroller.scrollTop += top - 32;
  });
}
if(window.visualViewport){
  const viewport = window.visualViewport;
  const syncViewport = () => {
    document.documentElement.style.setProperty('--visual-height', viewport.height + 'px');
    document.documentElement.style.setProperty('--visual-top', viewport.offsetTop + 'px');
    keepFocusedFieldVisible();
  };
  viewport.addEventListener('resize', syncViewport);
  viewport.addEventListener('scroll', syncViewport);
  syncViewport();
}
document.addEventListener('focusin', event => {
  if(!event.target.matches('input, textarea, select')) return;
  const overlay = event.target.closest('.overlay');
  overlay?.classList.add('is-typing');
  // Copre anche l’animazione della tastiera, che su alcuni telefoni non
  // coincide con il primo evento resize.
  [0, 150, 400, 750].forEach(delay => setTimeout(keepFocusedFieldVisible, delay));
});
document.addEventListener('focusout', event => {
  const overlay = event.target.closest('.overlay');
  setTimeout(() => {
    if(!overlay?.contains(document.activeElement) || !document.activeElement?.matches('input, textarea, select')){
      overlay?.classList.remove('is-typing');
    }
  }, 0);
});
