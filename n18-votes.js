'use strict';
// Public endpoint only. No OAuth token or ChatGPT service is used in this page.
(()=>{
 const key='neuron-house-heart-v1';
 const status=document.querySelector('#vote-status');
 const buttons=[...document.querySelectorAll('[data-vote]')];
 const ids=buttons.map(b=>b.dataset.vote);
 let saved,storageOK=true,busy=false,counts=null,serverRevision=-1,uncertain=false;
 try{
  saved=JSON.parse(localStorage.getItem(key)||'null');
  if(!saved||!/^[a-f0-9]{64}$/.test(saved.voter||''))saved={voter:Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join(''),choice:'',seq:0};
  localStorage.setItem(key,JSON.stringify(saved));
 }catch{storageOK=false;saved={choice:'',seq:0};}
 function persist(){try{localStorage.setItem(key,JSON.stringify(saved));return true;}catch{storageOK=false;return false;}}
 function paint(){
  buttons.forEach(b=>{const active=b.dataset.vote===saved.choice;b.setAttribute('aria-pressed',String(active));b.disabled=busy||uncertain||!storageOK||counts===null;b.querySelector('.heart-icon').textContent=active?'♥':'♡';b.querySelector('.heart-count').textContent=counts===null?'—':String(counts[b.dataset.vote]);});
 }
 function accept(data){
  if(!data||data.ok!==true||!Number.isSafeInteger(data.revision)||!ids.every(id=>Number.isSafeInteger(data.counts?.[id])&&data.counts[id]>=0))throw Error('invalid_response');
  if(data.revision>=serverRevision){counts=data.counts;serverRevision=data.revision;}
 }
 function summary(){
  const total=ids.reduce((n,id)=>n+counts[id],0);
  const selected=buttons.find(b=>b.dataset.vote===saved.choice);
  const alias=selected?.getAttribute('aria-label').replace(' 하트 투표','');
  status.textContent=`함께 남긴 하트 ${total}개${alias?` · 나의 선택: ${alias}`:''}${storageOK?'':' · 브라우저 저장을 허용하면 투표할 수 있어요.'}`;
 }
 async function request(payload){
  const response=await fetch(window.NEURON_VOTE_ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({...payload,voter:saved.voter}),redirect:'follow',signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw Error('network');return response.json();
 }
 async function reconcile(){
  const data=await request({action:'status'});accept(data);
  if(!Number.isSafeInteger(data.seq)||typeof data.choice!=='string'||(data.choice!==''&&!ids.includes(data.choice)))throw Error('invalid_response');
  saved.seq=Math.max(saved.seq||0,data.seq);saved.choice=data.choice;delete saved.pending;persist();uncertain=false;summary();paint();
 }
 async function refresh(){
  if(busy)return;
  try{
   if(uncertain||saved.pending){uncertain=true;paint();await reconcile();return;}
   const response=await fetch(window.NEURON_VOTE_ENDPOINT,{cache:'no-store',signal:AbortSignal.timeout(25000)});
   if(!response.ok)throw Error('network');accept(await response.json());summary();paint();
  }catch{status.textContent=uncertain?'저장 결과를 확인하지 못했습니다. 결과 새로고침으로 확인해주세요.':'전체 선택 수를 불러오지 못했습니다. 결과 새로고침을 눌러주세요.';paint();}
 }
 async function vote(id){
  if(busy||uncertain||!storageOK||counts===null)return;
  busy=true;paint();
  // Re-read the server's sequence to avoid stale tabs double-counting one browser.
  try{
   const before=await request({action:'status'});accept(before);
   const choice=before.choice===id?'':id;
   const seq=Math.max(saved.seq||0,before.seq||0)+1;
   saved.seq=seq;saved.pending={choice,seq};
   if(!persist())throw Error('storage');
   status.textContent='하트를 저장하고 있습니다…';
   const data=await request({action:'vote',choice,seq});accept(data);
   if(data.seq!==seq||data.choice!==choice)throw Error('uncertain');
   saved.choice=choice;delete saved.pending;persist();summary();
  }catch{
   if(saved.pending){uncertain=true;try{await reconcile();}catch{status.textContent='저장 결과를 확인 중입니다. 결과 새로고침을 눌러 확인해주세요.';}}
   else status.textContent=storageOK?'연결이 잠시 끊겼습니다. 결과 새로고침 후 다시 시도해주세요.':'브라우저 저장을 허용하면 투표할 수 있어요.';
  }finally{busy=false;paint();}
 }
 buttons.forEach(b=>b.addEventListener('click',()=>vote(b.dataset.vote)));
 document.querySelector('#refresh-votes').addEventListener('click',refresh);
 addEventListener('storage',e=>{if(e.key===key&&!busy){try{const next=JSON.parse(e.newValue);if(next?.voter===saved.voter){saved=next;paint();refresh();}}catch{}}});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
 setInterval(()=>{if(document.visibilityState==='visible')refresh();},60000);
 uncertain=!!saved.pending;paint();refresh();
})();
