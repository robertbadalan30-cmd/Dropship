
// Lightweight store logic (no backend) – uses localStorage
const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('cart') || '[]')
};

function fmt(n){
  return new Intl.NumberFormat('ro-RO',{style:'currency',currency:'RON'}).format(n);
}

function saveCart(){
  localStorage.setItem('cart', JSON.stringify(state.cart));
  updateCartCount();
}

function updateCartCount(){
  const el = document.querySelector('[data-cart-count]');
  if(!el) return;
  const count = state.cart.reduce((a,i)=>a+i.qty,0);
  el.textContent = count;
}

async function loadProducts(){
  const res = await fetch('products.json');
  state.products = await res.json();
  renderProducts(state.products);
  updateCartCount();
}

function renderProducts(items){
  const grid = document.querySelector('[data-grid]');
  if(!grid) return;
  grid.innerHTML = items.map(p=> `
    <article class="card">
      <a href="product.html?id=${encodeURIComponent(p.id)}">
        <img src="${p.image}" alt="${p.title}">
      </a>
      <div class="content">
        <div>${(p.badges||[]).map(b=>`<span class="badge">${b}</span>`).join('')}</div>
        <a href="product.html?id=${encodeURIComponent(p.id)}"><strong>${p.title}</strong></a>
        <div class="price"><span class="now">${fmt(p.price)}</span> ${p.compare_at_price?`<span class="compare">${fmt(p.compare_at_price)}</span>`:''}</div>
        <div class="rating">★ ${p.rating || '4.5'} <small class="helper">(${p.reviews || 0} recenzii)</small></div>
        <button class="btn primary" onclick="addToCart('${p.id}')">Adaugă în coș</button>
      </div>
    </article>
  `).join('');
}

function addToCart(id){
  const p = state.products.find(x=>x.id===id);
  if(!p) return;
  const found = state.cart.find(x=>x.id===id);
  if(found){ found.qty += 1; } else { state.cart.push({id, qty:1}); }
  saveCart();
  showToast('Produs adăugat în coș');
}

function showToast(msg){
  const t = document.querySelector('.toast');
  if(!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(()=>t.style.display='none',1600);
}

function searchProducts(q){
  q = q.toLowerCase();
  const res = state.products.filter(p=> (p.title+p.description+p.category).toLowerCase().includes(q));
  renderProducts(res);
}

function loadCartTable(){
  const tbody = document.querySelector('[data-cart-body]');
  const totalEl = document.querySelector('[data-cart-total]');
  if(!tbody) return;
  tbody.innerHTML = state.cart.map(item=>{
    const p = state.products.find(x=>x.id===item.id) || {};
    return `<tr>
      <td style="width:60px"><img src="${p.image || ''}" alt="" style="width:52px;height:52px;object-fit:cover;border-radius:8px;border:1px solid #eee"></td>
      <td>${p.title || ''}</td>
      <td>${fmt(p.price||0)}</td>
      <td>
        <button class="btn" onclick="decQty('${item.id}')">-</button>
        <span class="kbd">${item.qty}</span>
        <button class="btn" onclick="incQty('${item.id}')">+</button>
      </td>
      <td>${fmt((p.price||0)*item.qty)}</td>
      <td><button class="btn" onclick="removeItem('${item.id}')">Șterge</button></td>
    </tr>`
  }).join('');
  const total = state.cart.reduce((a,i)=>{
    const p = state.products.find(x=>x.id===i.id) || {price:0};
    return a + i.qty * (p.price || 0);
  },0);
  if(totalEl) totalEl.textContent = fmt(total);
}

function incQty(id){
  const it = state.cart.find(x=>x.id===id); if(!it) return;
  it.qty += 1; saveCart(); loadCartTable();
}
function decQty(id){
  const it = state.cart.find(x=>x.id===id); if(!it) return;
  it.qty = Math.max(1, it.qty - 1); saveCart(); loadCartTable();
}
function removeItem(id){
  state.cart = state.cart.filter(x=>x.id!==id); saveCart(); loadCartTable();
}

document.addEventListener('DOMContentLoaded', ()=>{
  if(document.body.dataset.page === 'home'){
    loadProducts();
    const s = document.querySelector('[data-search]');
    if(s){ s.addEventListener('input', e=> searchProducts(e.target.value)) }
  }
  if(document.body.dataset.page === 'cart'){
    loadProducts().then(loadCartTable);
  }
});
