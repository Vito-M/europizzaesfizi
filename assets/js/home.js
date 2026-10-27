'use strict';
fetch('data/reviews.json').then(response => {
  if(!response.ok) throw new Error('Recensioni non disponibili');
  return response.json();
}).then(reviews => {
  const list = document.getElementById('reviewList');
  list.replaceChildren();
  if(!Array.isArray(reviews) || !reviews.length) { list.textContent = 'Le recensioni saranno disponibili a breve.'; return; }
  reviews.forEach(review => {
    const article = document.createElement('article'); article.className = 'review';
    const name = document.createElement('h3'); name.textContent = review.name;
    const stars = document.createElement('span'); stars.className = 'stars'; stars.setAttribute('role', 'img');
    const rating = Math.min(5, Math.max(0, Number(review.rating) || 0));
    stars.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating); stars.setAttribute('aria-label', rating + ' stelle su 5');
    const quote = document.createElement('blockquote'); quote.textContent = review.text;
    const note = document.createElement('small'); note.textContent = 'Da Google Maps · Testo rivisto nella forma';
    article.append(name, stars, quote, note); list.append(article);
  });
}).catch(() => { document.getElementById('reviewList').textContent = 'Non è stato possibile caricare le recensioni. Ricarica la pagina per riprovare.'; });

