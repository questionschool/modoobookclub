'use strict';
const people=JSON.parse(document.querySelector('#people-data').textContent);
const $=s=>document.querySelector(s);
const escapeText=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const portrait=p=>`<div class="portrait"><img src="${window.NEURON_ASSET_BASE||'assets/'}${p.id}.png" alt="${escapeText(p.alias)} 캐릭터 일러스트" width="1254" height="1254" decoding="async"></div>`;
let current=0;
$('#hero-people').innerHTML=people.map(p=>`<div class="hero-person">${portrait(p)}<p>${escapeText(p.alias)}</p></div>`).join('');
$('#roster').innerHTML=people.map((p,i)=>`<article class="person-card" data-card="${i}"><button class="person-open" type="button" data-person="${i}" aria-pressed="false" aria-controls="profile-content" aria-label="${escapeText(p.alias)}, ${escapeText(p.name)} 자세한 소개 읽기">${portrait(p)}<div class="card-copy"><span class="card-num">${String(i+1).padStart(2,'0')} / ${escapeText(p.role)}</span><h3>${escapeText(p.alias)}</h3><span class="card-name">${escapeText(p.name)} · ${p.age}세</span><p class="card-line">${escapeText(p.line)}</p><span class="card-link">자세한 소개 읽기 <span aria-hidden="true">↗</span></span></div></button><button class="heart-button" type="button" data-vote="${p.id}" aria-label="${escapeText(p.alias)} 하트 투표" aria-pressed="false" disabled><span class="heart-icon" aria-hidden="true">♡</span><span class="heart-count" data-count="${p.id}">—</span></button></article>`).join('');
$('#people-tabs').innerHTML=people.map((p,i)=>`<button type="button" data-person="${i}" aria-current="false" aria-controls="profile-content">${escapeText(p.alias)}</button>`).join('');
function render(index,scroll=false){
 current=(index+people.length)%people.length;const p=people[current];
 $('#profile-count').textContent=`${String(current+1).padStart(2,'0')} / 09`;
 $('#profile-content').innerHTML=`<div class="profile-layout"><div class="profile-visual">${portrait(p)}<p class="photo-caption">${escapeText(p.alias)}</p><p class="art-note">${escapeText(p.visual)}</p></div><div class="profile-text"><p class="profile-meta">${escapeText(p.role)} · ${p.age}세 · ${escapeText(p.job)}</p><h2 class="profile-title" id="profile-title" tabindex="-1">${escapeText(p.alias)}<span>${escapeText(p.name)}</span></h2><p class="profile-line">${escapeText(p.line)}</p><div class="tag-list">${p.tags.map(t=>`<span>${escapeText(t)}</span>`).join('')}</div><p>${escapeText(p.intro)}</p><h3>${escapeText(p.motivationTitle)}</h3><p>${escapeText(p.motivation)}</p><h3>이 별칭을 고른 마음</h3><p>${escapeText(p.aliasStory)}</p><blockquote>“${escapeText(p.quote)}”</blockquote><h3>처음 만났을 때</h3><p>${escapeText(p.first)}</p><p class="source-pages">인물이 등장하는 초반 장면 · 《뉴런하우스》 ${p.pages.join(' · ')}쪽</p></div></div><figure class="character-sketch"><h3>선으로 만나는 ${escapeText(p.alias)}</h3><p>희미한 몸짓에서 표정과 색이 또렷해지기까지, 캐릭터를 찾아가는 스케치입니다.</p><img src="n18-sketch-${p.id}-v1.png" alt="${escapeText(p.alias)}의 몸짓과 표정이 점차 선명해지는 아홉 가지 캐릭터 연구 스케치" width="1254" height="1254" loading="lazy" decoding="async"><figcaption>소설 속 첫인상을 바탕으로 창작한 캐릭터 연구 시안입니다.</figcaption></figure>`;
 document.querySelectorAll('[data-person]').forEach(b=>{const selected=Number(b.dataset.person)===current;b.setAttribute(b.classList.contains('person-open')?'aria-pressed':'aria-current',String(selected)); if(b.classList.contains('person-open'))b.closest('.person-card').classList.toggle('selected',selected);});
 $('#prev-label').textContent=people[(current+8)%9].alias;$('#next-label').textContent=people[(current+1)%9].alias;
 if(scroll){history.replaceState(null,'',`#person-${p.id}`);$('#profile').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});$('#profile-title').focus({preventScroll:true});}
}
document.addEventListener('click',event=>{const b=event.target.closest('[data-person]');if(b)render(Number(b.dataset.person),true);});
$('#prev').addEventListener('click',()=>render(current-1,true));$('#next').addEventListener('click',()=>render(current+1,true));
function readHash(){const id=location.hash.replace('#person-','');const i=people.findIndex(p=>p.id===id);if(i>=0)render(i,true);}
render(0);if(location.hash.startsWith('#person-'))readHash();
addEventListener('hashchange',()=>{if(location.hash.startsWith('#person-'))readHash();});
