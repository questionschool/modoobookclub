'use strict';
const $=id=>document.getElementById(id),legacyKey='neuron-journal-18-review-v1';
let members=[],entries=[],editing=null,pendingId=null,filter=new URLSearchParams(location.search).get('alias')||'',busy=false;
const pendingLikes=new Map();
let likesVersion=0;
function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function el(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;}
const api=journal18Api;
function setMembers(next){members=next;const selected=$('alias').value;$('alias').replaceChildren(new Option('별칭 선택',''));for(const name of members)$('alias').append(new Option(name,name));$('alias').value=selected;$('member-count').textContent=members.length;}
function choose(name){filter=name;const url=new URL(location.href);if(name)url.searchParams.set('alias',name);else url.searchParams.delete('alias');history.replaceState(null,'',url);render();}
function reset(){editing=null;pendingId=null;$('quote').value='';$('mind').value='';$('page').value='';$('date').value=today()<'2026-11-02'?'2026-11-02':today();$('save').textContent='기록 남기기 ↗';$('cancel').hidden=true;}
function render(){
 $('filters').replaceChildren();for(const name of ['',...members]){const b=el('button',name||'모두');b.type='button';b.setAttribute('aria-pressed',String(filter===name));b.onclick=()=>choose(name);$('filters').append(b);}
 $('journal-title').textContent=filter?filter+'의 기록':'차곡차곡, 모두의 기록';
 const list=entries.filter(e=>!filter||e.alias===filter).sort((a,b)=>($('sort').value==='asc'?1:-1)*(a.date.localeCompare(b.date)||a.created.localeCompare(b.created)));
 $('count').textContent=(filter?filter+'의 ':'')+'기록 '+list.length+'개';$('entries').replaceChildren();
 if(!list.length){const box=el('div','','empty');box.append(el('div','〰','symbol'),el('h3',filter?filter+'의 첫 페이지를 기다리고 있어.':'우리의 첫 페이지는 아직 비어 있어.'),el('p','마음에 남은 문장이나 오늘의 마음으로 시작해 봐.'));const a=el('a','첫 기록 남기기 ↗');a.href='#write';a.onclick=()=>{if(filter)$('alias').value=filter;};box.append(a);$('entries').append(box);}
 for(const e of list){const card=el('article','','entry'),head=el('div','','entry-meta');const who=el('button',e.alias,'text-button');who.onclick=()=>choose(e.alias);head.append(who,el('time',e.date.replaceAll('-','. ')));card.append(head);if(e.quote){card.append(el('blockquote',e.quote));card.append(el('small','김정규 · 『뉴런하우스』'+(e.page?' · '+e.page+'쪽':'')));}if(e.mind)card.append(el('p',e.mind));
 const actions=el('div','','entry-actions');actions.append(likeButton(e));const download=el('button','↓ 이미지로 저장','entry-download');download.type='button';download.setAttribute('aria-label',e.alias+'의 '+e.date+' 기록 이미지로 저장');download.onclick=()=>downloadEntryImage(e,download);actions.append(download);card.append(actions);
 if(e.canEdit){const edit=el('button','수정'),del=el('button','삭제');edit.onclick=()=>{if(busy)return;editing=e;for(const field of ['alias','date','quote','page','mind'])$(field).value=e[field]||'';$('save').textContent='수정 저장';$('cancel').hidden=false;$('status').textContent='기록을 수정하고 있어.';$('write').scrollIntoView({behavior:'smooth'});$('quote').focus({preventScroll:true});};del.onclick=async()=>{if(busy||!confirm('이 기록을 모두의 기록장에서 삭제할까?'))return;del.disabled=true;try{await api('records','DELETE',{id:e.id,revision:e.revision});if(editing?.id===e.id)reset();await load();$('status').textContent='기록을 삭제했어.';}catch(err){$('status').textContent=err.message;alert(err.message);}finally{del.disabled=false;}};actions.append(edit,del);}$('entries').append(card);}
}
function likeButton(entry){
 const button=el('button','','entry-like'),icon=el('span','','heart'),label=el('span','좋아요'),count=el('span','','like-count');
 button.type='button';icon.setAttribute('aria-hidden','true');button.append(icon,label,count);
 function update(){const current=entries.find(e=>e.id===entry.id)||entry;const liked=!!current.liked;icon.textContent=liked?'♥':'♡';count.textContent=String(current.likeCount||0);button.setAttribute('aria-pressed',String(liked));button.setAttribute('aria-label',current.alias+'의 기록 좋아요'+(liked?' 취소':'')+', '+count.textContent+'개');button.disabled=pendingLikes.has(entry.id);button.setAttribute('aria-busy',String(button.disabled));}
 update();
 button.onclick=async()=>{
  if(pendingLikes.has(entry.id))return;
  const current=entries.find(e=>e.id===entry.id)||entry,target=!current.liked;
  pendingLikes.set(entry.id,true);likesVersion++;update();
  try{const result=await api('likes','PUT',{id:entry.id,liked:target});const latest=entries.find(e=>e.id===entry.id);if(latest){latest.liked=result.liked;latest.likeCount=result.likeCount;}entry.liked=result.liked;entry.likeCount=result.likeCount;likeStatus().textContent=result.liked?'좋아요를 남겼어.':'좋아요를 취소했어.';}
  catch(err){likeStatus().textContent=err.message;}
  finally{pendingLikes.delete(entry.id);update();if(!button.isConnected)render();}
 };
 return button;
}
function likeStatus(){let status=$('like-status');if(!status){status=el('p','','like-status');status.id='like-status';status.setAttribute('role','status');$('entries').before(status);}return status;}
async function load(){if(pendingLikes.size)return false;const version=likesVersion;try{const data=await api('records');if(pendingLikes.size||version!==likesVersion)return false;setMembers(data.members);entries=data.entries;render();return true;}catch(e){$('count').textContent='기록을 불러오지 못했어.';$('status').textContent=e.message;return false;}}
$('date').value=today()<'2026-11-02'?'2026-11-02':today();
$('entry-form').onsubmit=async e=>{e.preventDefault();if(busy)return;const quote=$('quote').value.trim(),mind=$('mind').value.trim();if(!quote&&!mind){$('status').textContent='문장이나 마음 중 하나를 남겨 줘.';$('mind').focus();return;}if(!pendingId)pendingId=crypto.randomUUID();const item={id:editing?.id||pendingId,revision:editing?.revision,alias:$('alias').value,date:$('date').value,quote,mind,page:$('page').value.trim()};busy=true;const fields=[...$('entry-form').querySelectorAll('input,textarea,select,button')];fields.forEach(x=>x.disabled=true);$('status').textContent='기록을 저장하고 있어…';try{await api('records',editing?'PUT':'POST',item);reset();try{localStorage.setItem(legacyKey+'-alias',item.alias);}catch{}if(filter&&filter!==item.alias)filter=item.alias;const loaded=await load();$('status').textContent=loaded?'모두의 기록장에 남겼어. 함께 읽을 수 있어.':'기록은 저장됐어. 목록은 새 기록 불러오기로 확인해 줘.';}catch(err){$('status').textContent=err.message;}finally{busy=false;fields.forEach(x=>x.disabled=false);}};
$('cancel').onclick=()=>{reset();$('status').textContent='수정을 취소했어.';};$('sort').onchange=render;$('reload').onclick=load;
$('add-alias').onclick=()=>{$('alias-dialog').showModal();$('new-alias').focus();};$('close-alias').onclick=()=>$('alias-dialog').close();
$('alias-form').onsubmit=async e=>{e.preventDefault();const submit=$('alias-form').querySelector('[type=submit]');submit.disabled=true;try{const data=await api('members','POST',{alias:$('new-alias').value.trim()});setMembers(data.members);$('alias').value=data.alias;render();$('alias-dialog').close();$('new-alias').value='';$('alias-status').textContent='';}catch(err){$('alias-status').textContent=err.message;}finally{submit.disabled=false;}};
$('export').onclick=()=>{const list=entries.filter(e=>!filter||e.alias===filter).sort((a,b)=>a.date.localeCompare(b.date));if(!list.length){$('count').textContent='내려받을 기록이 아직 없어.';return;}const text=['뉴런하우스 — '+(filter||'모두')+'의 기록','',...list.map(e=>e.date+' · '+e.alias+'\n\n'+(e.quote?'[담아둔 문장]\n'+e.quote+'\n김정규 · 『뉴런하우스』'+(e.page?' · '+e.page+'쪽':'')+'\n\n':'')+(e.mind?'[나의 마음]\n'+e.mind:'')+'\n\n──────────\n')].join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='뉴런하우스_'+(filter||'모두')+'의기록.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
let legacy=[];try{legacy=JSON.parse(localStorage.getItem(legacyKey)||'[]');if(!Array.isArray(legacy))legacy=[];}catch{}$('legacy').hidden=!legacy.length;
$('import-legacy').onclick=async()=>{if(!confirm('이 브라우저의 이전 기록을 모두가 볼 수 있게 옮길까?'))return;$('import-legacy').disabled=true;try{for(const e of legacy){if(!members.includes(e.alias)){const d=await api('members','POST',{alias:e.alias});setMembers(d.members);}await api('records','POST',{...e,id:e.id});}$('legacy-status').textContent='이전 기록을 공동 기록장으로 옮겼어.';localStorage.removeItem(legacyKey);await load();}catch(e){$('legacy-status').textContent=e.message;$('import-legacy').disabled=false;}};
window.addEventListener('popstate',()=>{filter=new URLSearchParams(location.search).get('alias')||'';render();});
load().then(()=>{try{$('alias').value=localStorage.getItem(legacyKey+'-alias')||'';}catch{}});
setInterval(()=>{if(!document.hidden&&!busy&&!editing)load();},120000);
