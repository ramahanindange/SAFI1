/* ===== SAFI data layer: product catalogue, reviews and orders live in the artifact's database ===== */
(function(){
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const say=m=>window.__say&&window.__say(m);
  const NAME={charcoal:'Charcoal',aloe:'Aloe Vera',wine:'Red Wine'};
  const IDOF={'Charcoal':'charcoal','Aloe Vera':'aloe','Red Wine':'wine'};
  const BG={charcoal:'#55565a',aloe:'#8fae7b',wine:'#c56b62'};
  // built-in defaults: shown until (or unless) the database catalogue loads
  const CAT={
    charcoal:{name:'Charcoal',kicker:'01 · Oil control',tag:'Effective oil-control cleanser for oily & combination skin.',desc:'Activated charcoal draws out excess oil and everyday grime while niacinamide helps keep pores looking refined. Leaves skin clear and matte without that tight feeling.',size:'150 ml',price:null,
      facts:[['72h','Shine control'],['pH 5.5','Balanced'],['Oily','Best for'],['AM & PM','Daily use']],
      ingredients:[['Activated charcoal','Draws out oil and impurities'],['Niacinamide','Refines the look of pores'],['Salicylic acid 0.5%','Gently clears congestion'],['Glycerin','Keeps skin comfortable']],
      howto:['Wet your face with lukewarm water.','Massage one pump in circles for 60 seconds, focusing on the T-zone.','Rinse well and pat dry. Use morning and night.']},
    aloe:{name:'Aloe Vera',kicker:'02 · Hydration',tag:'Hydrating, soothing cleanser for dry & sensitive skin.',desc:'Aloe vera and hyaluronic acid cleanse gently while locking in moisture, so skin feels soft, calm and bright after every wash.',size:'150 ml',price:null,
      facts:[['24h','Hydration'],['98%','Natural origin'],['Dry','Best for'],['Fragrance-free','Gentle']],
      ingredients:[['Aloe vera leaf juice','Soothes and calms'],['Hyaluronic acid','Draws in moisture'],['Panthenol','Supports the skin barrier'],['Glycerin','Softens and hydrates']],
      howto:['Splash your face with lukewarm water.','Lather one pump between your palms and massage for 60 seconds.','Rinse and pat dry, then follow with moisturiser.']},
    wine:{name:'Red Wine',kicker:'03 · Radiance',tag:'Antioxidant radiance cleanser for dull, tired-looking skin.',desc:'Grape resveratrol and red berry extracts help fight dullness so skin looks fresher, firmer and more radiant after every wash.',size:'150 ml',price:null,
      facts:[['3×','Antioxidants'],['28 d','Visible glow'],['Dull','Best for'],['Vitamin E','Nourishing']],
      ingredients:[['Grape resveratrol','Antioxidant protection'],['Red berry extract','Brightens the look of skin'],['Vitamin E','Nourishes'],['Glycerin','Keeps skin comfortable']],
      howto:['Wet your face with lukewarm water.','Massage one pump in circles for 60 seconds.','Rinse well. Use daily, ideally in the evening.']}};
  let db=null,user=null,uid=null,isOwner=false,reviews={},myOrders=[],allOrders=[],current='aloe',qty=1,myStars=5;
  const esc=t=>String(t==null?'':t);
  const priceText=p=>p&&p.price?('TSh '+Number(p.price).toLocaleString()):'Price on request';
  function bottleImg(k){return (window.__BOT&&window.__BOT[k]&&window.__BOT[k].img)||''}

  // ---------- product sheet ----------
  const sheet=$('#sheet');let lastFocus=null;
  function ratingOf(k){const list=Object.values(reviews).map(r=>r&&r[k]).filter(Boolean);const n=list.length;const avg=n?list.reduce((a,b)=>a+(+b.r||0),0)/n:0;return {n,avg,list}}
  function starStr(v){const f=Math.round(v);return '★★★★★'.slice(0,f)+'☆☆☆☆☆'.slice(0,5-f)}
  function fillSheet(){const p=CAT[current];if(!p)return;
    $('#shImg').src=bottleImg(current);$('#shImg').alt=p.name+' face cleanser bottle';$('#shMedia').style.setProperty('--shbg',BG[current]);
    $('#shBadge').textContent=p.size;$('#shKick').textContent=p.kicker;$('#shName').textContent=p.name;$('#shTag').textContent=p.tag;$('#shDesc').textContent=p.desc;
    $('#shPrice').textContent=priceText(p);$('#shSize').textContent=p.size;
    const F=$('#shFacts');F.innerHTML='';p.facts.forEach(([a,b])=>{const li=document.createElement('li');const B=document.createElement('b');B.textContent=a;li.append(B,document.createTextNode(b));F.appendChild(li)});
    const I=$('#shIng');I.innerHTML='';p.ingredients.forEach(([a,b])=>{const li=document.createElement('li');const A=document.createElement('b');A.textContent=a;const S=document.createElement('span');S.textContent=b;li.append(A,S);I.appendChild(li)});
    const U=$('#shUse');U.innerHTML='';p.howto.forEach(t=>{const li=document.createElement('li');li.textContent=t;U.appendChild(li)});
    renderReviews()}
  async function renderReviews(){const {n,avg,list}=ratingOf(current);
    $('#shStars').textContent=n?starStr(avg):'☆☆☆☆☆';$('#shRate').textContent=n?(avg.toFixed(1)+' · '+n+' review'+(n>1?'s':'')):'No reviews yet';$('#shRc').textContent=n?'('+n+')':'';
    const L=$('#rvList');L.innerHTML='';
    if(!n){const d=document.createElement('div');d.className='rv-empty';d.textContent='Be the first to review '+CAT[current].name+'.';L.appendChild(d)}
    else{const ids=Object.keys(reviews).filter(id=>reviews[id]&&reviews[id][current]);let ps={};try{ps=user?await user.profiles(ids):{}}catch(e){}
      ids.sort((a,b)=>(reviews[b][current].at||'').localeCompare(reviews[a][current].at||'')).forEach(id=>{const r=reviews[id][current],P=ps[id]||{};
        const el=document.createElement('article');el.className='rvw';const h=document.createElement('header');
        if(P.avatarUrl){const im=document.createElement('img');im.src=P.avatarUrl;im.alt='';h.appendChild(im)}
        const nm=document.createElement('b');nm.textContent=(P.name||'Verified customer');const st=document.createElement('span');st.className='stars';st.textContent=starStr(r.r);
        const tm=document.createElement('time');tm.textContent=r.at?new Date(r.at).toLocaleDateString():'';h.append(nm,st,tm);
        const tx=document.createElement('p');tx.textContent=r.text;el.append(h,tx);L.appendChild(el)})}
    const mine=uid&&reviews[uid]&&reviews[uid][current];if(mine){$('#rvText').value=mine.text;myStars=mine.r}else{$('#rvText').value='';myStars=5}paintStars();
    $('#rvNote').textContent=db&&uid?(mine?'You can update your review any time.':''):'Reviews can be posted by signed-in team members with access to this page.';
    $('#rvForm').querySelector('button.btn').disabled=!(db&&uid)}
  function paintStars(){$$('.rv-stars button').forEach((b,i)=>{b.classList.toggle('on',i<myStars);b.setAttribute('aria-checked',i+1===myStars)})}
  (function mkStars(){const w=$('.rv-stars');for(let i=1;i<=5;i++){const b=document.createElement('button');b.type='button';b.textContent='★';b.setAttribute('role','radio');b.setAttribute('aria-label',i+' star'+(i>1?'s':''));b.onclick=()=>{myStars=i;paintStars()};w.appendChild(b)}})();
  function tab(t){$$('.sh-tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===t));['ov','in','use','rv'].forEach(k=>$('#pane-'+k).hidden=k!==t)}
  $$('.sh-tabs button').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
  function openSheet(k){current=k;qty=1;$('#shQty').textContent=1;tab('ov');fillSheet();lastFocus=document.activeElement;sheet.hidden=false;document.body.style.overflow='hidden';
    $('#shSaveNote').textContent=db&&uid?'Your order is saved to your account and our team confirms price and delivery.':'Your order opens in your email app, ready to send to SAFI.';
    setTimeout(()=>sheet.querySelector('[data-sclose]').focus(),60)}
  function closeSheet(){if(sheet.hidden)return;sheet.hidden=true;document.body.style.overflow='';lastFocus&&lastFocus.focus()}
  sheet.querySelector('[data-sclose]').onclick=closeSheet;sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet()});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-product]');if(b){e.preventDefault();openSheet(b.dataset.product)}const c=e.target.closest('[data-card]');if(c&&!e.target.closest('button')){const k=c.querySelector('[data-product]');k&&openSheet(k.dataset.product)}});
  $$('.qty button').forEach(b=>b.onclick=()=>{qty=Math.max(1,Math.min(20,qty+ +b.dataset.q));$('#shQty').textContent=qty});
  $('#shOrder').onclick=()=>{closeSheet();window.__openO&&window.__openO(NAME[current]);const q=$('#oQ');if(q)q.value=qty};
  $('#rvForm').addEventListener('submit',async e=>{e.preventDefault();if(!(db&&uid))return;const text=$('#rvText').value.trim();if(!text)return;
    const ref=db.doc('reviews/'+uid);const body={};body[current]={r:myStars,text:text.slice(0,400),at:new Date().toISOString()};
    try{const s=await ref.get();if(s.exists)await ref.update(body);else await ref.set(body);say('Thanks, your review is posted.')}catch(err){say(err&&err.code==='invalid_argument'?'Reviews are open to team members with contributor access.':'Could not save your review right now.')}});
  addEventListener('keydown',e=>{if(e.key==='Escape'){closeSheet();closeOrders()}});

  // ---------- orders ----------
  async function placeOrder(o){if(!(db&&uid))return false;
    const order={id:'SF'+Date.now().toString(36).toUpperCase(),product:o.product,qty:o.qty,name:String(o.name).slice(0,80),contact:String(o.contact).slice(0,120),status:'new',at:new Date().toISOString()};
    try{const ref=db.doc('orders/'+uid);const s=await ref.get();const list=s.exists&&Array.isArray(s.data().orders)?s.data().orders.slice():[];list.unshift(order);await ref.set({orders:list.slice(0,100),updated:order.at});return true}
    catch(err){return false}}
  window.SAFI={placeOrder,openSheet};
  const panel=$('#ordersPanel');let mode='mine',opLast=null;
  function swatch(p){const id=IDOF[p]||'aloe';const d=document.createElement('span');d.className='sw';d.style.background=BG[id]||'#ddd';if(IDOF[p]){const im=document.createElement('img');im.src=bottleImg(id);im.alt='';d.appendChild(im)}else d.textContent='3';return d}
  function renderOrders(){const L=$('#opList');L.innerHTML='';const owner=mode==='all';
    $('#opTitle').textContent=owner?'Orders dashboard':'My orders';$('#opKick').textContent=owner?'Owner only':'Your account';$('#opLead').textContent=owner?'Every order placed on the site, newest first.':'Everything you\'ve ordered from SAFI.';
    $('#opTools').hidden=!owner;$('#opStats').hidden=!owner;
    let list=owner?allOrders:myOrders;
    if(owner){const q=$('#opSearch').value.toLowerCase(),f=$('#opFilter').value;
      const S=$('#opStats');S.innerHTML='';[['Orders',allOrders.length],['New',allOrders.filter(o=>o.status==='new').length],['Units',allOrders.reduce((a,o)=>a+(+o.qty||0),0)],['Reviews',Object.values(reviews).reduce((a,r)=>a+Object.keys(r||{}).length,0)]].forEach(([k,v])=>{const d=document.createElement('div');const b=document.createElement('b');b.textContent=v;const s2=document.createElement('span');s2.textContent=k;d.append(b,s2);S.appendChild(d)});
      list=list.filter(o=>(!f||o.status===f)&&(!q||[o.name,o.product,o.contact,o.id].join(' ').toLowerCase().includes(q)))}
    if(!db||!uid){L.innerHTML='';const d=document.createElement('div');d.className='op-empty';d.textContent='Order history is available to signed-in members with access to this page. Orders you send by email are confirmed by our team directly.';L.appendChild(d);return}
    if(!list.length){const d=document.createElement('div');d.className='op-empty';d.textContent=owner?'No orders match.':'No orders yet.';if(!owner){const b=document.createElement('button');b.className='btn';b.textContent='Find your cleanser';b.onclick=()=>{closeOrders();location.hash='';document.getElementById('quiz').scrollIntoView({behavior:'smooth'})};d.append(document.createElement('br'),b)}L.appendChild(d);return}
    list.forEach((o,i)=>{const el=document.createElement('article');el.className='op';el.style.animationDelay=(i*40)+'ms';
      const mid=document.createElement('div');const b=document.createElement('b');b.textContent=o.product+' × '+o.qty;const sm=document.createElement('small');sm.textContent=(owner?(o.name+' · '+o.contact+' · '):'')+'#'+o.id+' · '+new Date(o.at).toLocaleString();mid.append(b,sm);
      let right;if(owner){right=document.createElement('select');right.setAttribute('aria-label','Status of order '+o.id);['new','confirmed','delivered','cancelled'].forEach(s2=>{const op=document.createElement('option');op.textContent=s2;op.selected=o.status===s2;right.appendChild(op)});right.onchange=()=>setStatus(o,right.value)}
      else{right=document.createElement('span');right.className='st '+o.status;right.textContent=o.status}
      el.append(swatch(o.product),mid,right);L.appendChild(el)})}
  async function setStatus(o,status){try{const ref=db.doc('orders/'+o._owner);const s=await ref.get();if(!s.exists)return;const list=s.data().orders.map(x=>x.id===o.id?Object.assign({},x,{status}):x);await ref.update({orders:list});say('Order '+o.id+' marked '+status+'.')}catch(e){say('Could not update that order.')}}
  function openOrders(m){mode=m;opLast=document.activeElement;renderOrders();panel.hidden=false;document.body.style.overflow='hidden';setTimeout(()=>panel.querySelector('[data-opclose]').focus(),60)}
  function closeOrders(){if(panel.hidden)return;panel.hidden=true;document.body.style.overflow='';opLast&&opLast.focus()}
  panel.querySelector('[data-opclose]').onclick=closeOrders;panel.addEventListener('click',e=>{if(e.target===panel)closeOrders()});
  document.addEventListener('click',e=>{if(e.target.closest('[data-myorders]')){e.preventDefault();openOrders('mine')}});
  $('#dashBtn').onclick=()=>openOrders('all');$('#opSearch').oninput=renderOrders;$('#opFilter').onchange=renderOrders;
  function refreshPrices(){$$('[data-price]').forEach(el=>{const p=CAT[el.dataset.price];el.textContent=p&&p.price?priceText(p):p.size})}

  // ---------- connect to the database (when this view has it) ----------
  (async()=>{if(!window.claude||!window.claude.use)return;
    try{user=await window.claude.use('user');db=await window.claude.use('db')}catch(e){db=null}
    if(!db)return;
    uid=user?await user.id():null;isOwner=user?await user.isOwner():false;
    db.collection('catalog').onSnapshot(s=>{s.docs.forEach(d=>{const v=d.data();if(v&&CAT[d.id])Object.assign(CAT[d.id],v)});refreshPrices();if(!sheet.hidden)fillSheet()},()=>{});
    db.collection('reviews').onSnapshot(s=>{reviews={};s.docs.forEach(d=>reviews[d.id]=d.data());if(!sheet.hidden)renderReviews();if(!panel.hidden)renderOrders()},()=>{});
    if(uid)db.doc('orders/'+uid).onSnapshot(s=>{myOrders=s.exists&&Array.isArray(s.data().orders)?s.data().orders:[];$('#bagN').textContent=myOrders.reduce((a,o)=>a+(+o.qty||0),0);if(!panel.hidden&&mode==='mine')renderOrders()},()=>{});
    if(isOwner){$('#dashBtn').hidden=false;db.collection('orders').onSnapshot(s=>{allOrders=[];s.docs.forEach(d=>{const v=d.data();(v&&v.orders||[]).forEach(o=>allOrders.push(Object.assign({_owner:d.id},o)))});allOrders.sort((a,b)=>(b.at||'').localeCompare(a.at||''));if(!panel.hidden&&mode==='all')renderOrders()},()=>{})}
    $('#oNote').textContent=uid?'Your order is saved to your account. We confirm price and delivery by phone or email.':'Your email app opens with the order ready to send. We confirm price and delivery by phone or email.';
  })();
})();
