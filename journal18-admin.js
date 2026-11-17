'use strict';const $=id=>document.getElementById(id);let overviewRecords=null,memberNames=[],overviewRequest=0;let revision=0,loadedDate='',dirty=false,loading=false,loadedReading='',pageCount=null;
async function api(path,method='GET',data){try{return await journal18Api(path,method,data);}catch(e){if(e.status===401){clearStatistics();$('dashboard').hidden=true;$('login').hidden=false;}throw e;}}
function count(){const checked=$('attendance-list').querySelectorAll('input:checked').length;const all=$('attendance-list').querySelectorAll('input').length;$('attendance-count').textContent=checked+' / '+all+'명 출석';}
function lock(on){loading=on;$('dashboard').querySelectorAll('input,textarea,button').forEach(n=>n.disabled=on);}
async function loadDate(date){if(loading)return;if(date<'2026-11-02')date='2026-11-02';if(date>'2026-11-30')date='2026-11-30';if(dirty&&!confirm('아직 저장하지 않은 변경이 있어. 날짜를 바꿀까?')){$('admin-date').value=loadedDate;return;}lock(true);try{const d=await api('attendance?date='+encodeURIComponent(date));memberNames=d.members;$('attendance-list').replaceChildren();for(const alias of [...d.members].sort((a,b)=>a.localeCompare(b,'ko'))){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=alias;input.checked=d.record.present.includes(alias);label.append(input,document.createTextNode(alias));$('attendance-list').append(label);}revision=d.record.revision;loadedDate=date;dirty=false;$('admin-note').value=d.record.note;$('admin-date').value=date;loadedReading=d.record.reading||'';pageCount=d.record.page_count??null;renderPageCount();for(const [id,key] of [['page-start','page_start'],['page-end','page_end']])$(id).value=d.record[key]??'';$('saved-at').textContent=d.record.updated?'마지막 저장 · '+new Date(d.record.updated).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'아직 저장하지 않은 날짜야.';$('admin-status').textContent='';count();}catch(e){$('admin-status').textContent=e.message;if(loadedDate)$('admin-date').value=loadedDate;}finally{lock(false);if(!loadedDate)$('save-attendance').disabled=true;}}
async function show(){ $('login').hidden=true;$('dashboard').hidden=false;if(!$('admin-date').value)$('admin-date').value=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());if($('admin-date').value<'2026-11-02')$('admin-date').value='2026-11-02';await loadDate($('admin-date').value);await loadOverview();}
$('login').onsubmit=async e=>{e.preventDefault();const b=$('login').querySelector('button');b.disabled=true;try{await api('admin/login','POST',{password:$('password').value});$('password').value='';await show();}catch(e){$('admin-status').textContent=e.message;}finally{b.disabled=false;}};
$('admin-date').onchange=()=>loadDate($('admin-date').value);function step(n){if(loading)return;const date=new Date(($('admin-date').value||loadedDate)+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+n);$('admin-date').value=date.toISOString().slice(0,10);loadDate($('admin-date').value);}$('prev').onclick=()=>step(-1);$('next').onclick=()=>step(1);
$('attendance-form').oninput=()=>{dirty=true;count();};for(const [id,value]of [['select-all',true],['select-none',false]])$(id).onclick=()=>{$('attendance-list').querySelectorAll('input').forEach(i=>i.checked=value);dirty=true;count();};
$('attendance-form').onsubmit=async e=>{e.preventDefault();if(loading||!loadedDate)return;lock(true);try{const d=await api('attendance','POST',{date:loadedDate,present:[...$('attendance-list').querySelectorAll('input:checked')].map(i=>i.value),note:$('admin-note').value,reading:loadedReading,page_start:numberValue('page-start'),page_end:numberValue('page-end'),page_count:pageCount,revision});revision=d.revision;dirty=false;await loadOverview();$('admin-status').textContent='출석 기록을 저장했어. 전체 목록에도 반영했어.';$('saved-at').textContent='마지막 저장 · '+new Date().toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});}catch(e){$('admin-status').textContent=e.message;}finally{lock(false);}};
$('logout').onclick=async()=>{if(dirty&&!confirm('저장하지 않은 변경이 있어. 로그아웃할까?'))return;try{await api('admin/logout','POST',{});dirty=false;overviewRequest++;clearStatistics();$('dashboard').hidden=true;$('login').hidden=false;$('attendance-list').replaceChildren();$('attendance-overview-list').replaceChildren();$('overview-summary').textContent='';$('admin-note').value='';$('admin-status').textContent='로그아웃했어.';}catch(e){$('admin-status').textContent=e.message;}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});api('admin/session').then(d=>{if(d.authenticated)show();}).catch(e=>$('admin-status').textContent=e.message);

function renderPageCount(){$('page-count-display').textContent=pageCount===null?'':('읽은 쪽수 · '+pageCount+'쪽');}
function numberValue(id){return $(id).value===''?null:Number($(id).value);}
for(const id of ['page-start','page-end'])$(id).addEventListener('input',()=>{const a=numberValue('page-start'),b=numberValue('page-end');pageCount=a!==null&&b!==null&&b>=a?b-a+1:null;renderPageCount();});
function element(tag,text,cls){const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;}
const scheduled=[];for(let n=2;n<=30;n++){const d=new Date(Date.UTC(2026,10,n));if(d.getUTCDay()!==0&&d.getUTCDay()!==6)scheduled.push(d.toISOString().slice(0,10));}
async function loadOverview(){const request=++overviewRequest;clearStatistics();try{const data=await api('attendance/all');if(request!==overviewRequest||$('dashboard').hidden)return;overviewRecords=data.records;renderStatistics();const records=new Map(data.records.map(r=>[r.date,r]));const dates=[...new Set([...scheduled,...[...records.keys()].filter(d=>d>='2026-11-02'&&d<='2026-11-30')])].sort();$('attendance-overview-list').replaceChildren();$('overview-summary').textContent='저장된 기록 '+data.records.length+'회 · 예정 '+scheduled.length+'회';
 for(const date of dates){const r=records.get(date),day=scheduled.indexOf(date),row=element('button','',r?'attendance-row recorded':'attendance-row planned');row.type='button';row.setAttribute('aria-label',date+' '+(r?'기록 수정':'기록 남기기'));const datebox=element('div','','attendance-date');datebox.append(element('span',day>=0?'Day '+(day+1):'추가 기록','day-number'),element('strong',new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'short',timeZone:'Asia/Seoul'}).format(new Date(date+'T12:00:00Z'))));
 const reading=element('div','','attendance-reading');reading.append(element('span',r?.reading||(r?'읽은 쪽':'낭독 예정')));let pages='';if(r?.page_start!=null&&r?.page_end!=null)pages='p.'+r.page_start+'~'+r.page_end;else if(r?.page_start!=null)pages='p.'+r.page_start+'부터';else if(r?.page_end!=null)pages='p.'+r.page_end+'까지';if(r?.page_count!=null)pages+=(pages?' · ':'')+r.page_count+'쪽';reading.append(element('small',pages||(r?'쪽수 미입력':'실제 기록을 기다리고 있어')));
 const people=element('div','','attendance-people');people.append(element('strong',r?r.present.length+'명':'미기록','attendance-total'));const names=element('div','','attendee-tags');if(r&&r.present.length)for(const name of [...r.present].sort((a,b)=>a.localeCompare(b,'ko')))names.append(element('span',name));else names.append(element('small',r?'저장된 출석자 없음':'아직 출석을 남기지 않았어'));people.append(names);row.append(datebox,reading,people,element('span','↗','row-arrow'));
 row.onclick=async()=>{if(loading)return;await loadDate(date);if(loadedDate===date){$('day-editor').open=true;$('day-editor').scrollIntoView({behavior:'smooth',block:'start'});}};$('attendance-overview-list').append(row);}
 }catch(e){if(request!==overviewRequest)return;clearStatistics();$('ranking-summary').textContent='출석 통계를 불러오지 못했어. 새로 불러오기를 눌러 줘.';$('overview-summary').textContent='전체 기록을 불러오지 못했어. '+e.message;}}
$('refresh-overview').onclick=loadOverview;


function clearStatistics(){overviewRecords=null;$('attendance-ranking').replaceChildren();$('ranking-summary').textContent='';$('reading-forecast').replaceChildren();}
function statisticsToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function renderStatistics(){
 if(!overviewRecords)return;
 const today=statisticsToday(), target=Number($('reading-target').value);
 const stats=season18Statistics(overviewRecords,memberNames,today,target);
 $('ranking-summary').textContent=today+' 기준 · 저장된 '+stats.days.length+'회 중 출석 비율이야. 미기록·미래 날짜는 제외하고, 같은 출석 횟수는 공동 순위로 표시해.';
 const list=$('attendance-ranking');list.replaceChildren();
 if(!stats.days.length){list.append(element('p','아직 저장된 출석 기록이 없어.','admin-status'));}
 else {
 let rank=0,previous=-1;
 stats.ranking.forEach((person,index)=>{
  if(person.dates.length!==previous)rank=index+1;previous=person.dates.length;
  const row=element('article','','member-stat');
  row.append(element('span',rank+'위','member-rank'),element('strong',person.name));
  const score=element('div','','member-score');score.append(element('strong',person.dates.length+'회 · '+person.rate.toFixed(1)+'%'));
  const bar=element('progress','');bar.max=100;bar.value=person.rate;bar.setAttribute('aria-label',person.name+' 출석률');score.append(bar);row.append(score);
  const details=element('details','','member-dates');details.append(element('summary','출석일 '+person.dates.length+'일 보기'));
  details.append(element('p',person.dates.length?person.dates.map(d=>Number(d.slice(5,7))+'/'+Number(d.slice(8))).join(' · '):'아직 출석한 날이 없어.'));row.append(details);list.append(row);
 });
 }
 renderForecast(stats,target,today);
}
function renderForecast(stats,target,today){
 const box=$('reading-forecast');box.replaceChildren();
 if(!Number.isInteger(target)||target<1||target>10000){box.append(element('p','마지막 쪽을 1~10000 사이의 정수로 입력해 줘.'));return;}
 if(stats.current===null){box.append(element('p','실제 읽은 끝 쪽을 저장하면 낭독 진도와 완독 예상을 보여 줄게.'));return;}
 const cards=element('div','','forecast-grid');
 for(const [title,value] of [['도달한 쪽',stats.current+' / '+target+'쪽'],['남은 쪽',stats.remaining+'쪽'],['최근 평균',stats.average===null?'자료 없음':stats.average.toFixed(1)+'쪽 / 회']]){
  const card=element('div','','forecast-card');card.append(element('span',title),element('strong',value));cards.append(card);
 }
 box.append(cards);
 const headline=stats.remaining===0?'목표 쪽까지 읽었어!':stats.sessions===null?'속도를 계산하려면 시작·끝 쪽이 있는 기록이 2회 이상 필요해.':'약 '+stats.sessions+'회 더 읽으면 · '+stats.finish+' 완독 예상';
 box.append(element('p',headline,'forecast-result'));
 box.append(element('p','최근 쪽수 기록 '+stats.samples.length+'회'+(stats.samples.length?' ('+stats.samples[0].date+' ~ '+stats.samples.at(-1).date+')':'')+'의 회당 평균 (끝 쪽 − 시작 쪽 + 1)으로 계산해. 도달한 쪽은 저장된 끝 쪽 중 가장 큰 값이며, 건너뛴 구간이나 다시 읽기는 별도로 보정하지 않아.','admin-status'));
 box.append(element('p','마지막 진도 입력 '+stats.latest+' · '+today+' 다음 날부터 평일에 하루 한 번 읽는다고 가정해. 오늘의 미입력 기록·휴강·공휴일은 반영하지 않은 추정이야.','admin-status'));
 if(stats.finish && stats.finish>'2026-11-30')box.append(element('p','시즌 예정 종료일 (11/30) 이후에도 같은 평일 일정으로 계속 읽는다는 가정이야.','admin-status'));
 if(stats.current>target)box.append(element('p','기록된 끝 쪽이 목표보다 커. 완독 목표와 입력한 쪽수를 확인해 줘.','admin-status'));
}
$('reading-target').addEventListener('input',renderStatistics);
