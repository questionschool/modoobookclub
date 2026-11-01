// Season 18 isolated API. Route season=18 from the existing doGet/doPost.
// Set J18_ADMIN_HASH in Script Properties; never commit the password.
function j18Hash(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s)).map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join(''); }
function j18Fail(message,status){var e=new Error(message);e.status=status||400;throw e;}
function j18Rows(name){var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);if(!s)j18Fail('저장소 설정을 확인해 줘.',503);var v=s.getDataRange().getDisplayValues(),h=v.shift();return {sheet:s,headers:h,rows:v.map(function(r,i){var o={_row:i+2};h.forEach(function(k,n){o[k]=r[n];});return o;})};}
function j18Write(table,obj,row){var values=table.headers.map(function(k){var v=obj[k];if(v===null||v===undefined)return '';v=String(v);return /^[=+@-]/.test(v)?"'"+v:v;});var range=table.sheet.getRange(row||table.sheet.getLastRow()+1,1,1,values.length);range.setNumberFormat('@');range.setValues([values]);SpreadsheetApp.flush();}
function j18Date(s,writing){if(!/^2026-11-\d{2}$/.test(s)||s<'2026-11-02'||s>'2026-11-30')j18Fail('시즌 기록은 11월 2일부터 30일까지 남길 수 있어.');if(writing&&s>Utilities.formatDate(new Date(),'Asia/Seoul','yyyy-MM-dd'))j18Fail('아직 시작하지 않은 날짜야. 해당 날짜부터 기록할 수 있어.');return s;}
function j18Text(v,max){var s=String(v||'').trim();if(s.length>max)j18Fail('입력한 내용이 너무 길어.');return s;}
function j18Handle(b){
 var lock=LockService.getScriptLock();if(!lock.tryLock(15000))return jsonResponse({ok:false,error:'잠시 뒤 다시 저장해 줘.',status:503});
 try{return jsonResponse(Object.assign({ok:true},j18LikesDispatch(b)));}catch(e){return jsonResponse({ok:false,error:e.status?e.message:'저장소 연결을 확인하지 못했어. 잠시 뒤 다시 시도해 줘.',status:e.status||500});}finally{lock.releaseLock();}
}
function j18Dispatch(b){
 var path=String(b.path||'records'),method=b.method||'GET',d=b.data||{},cache=CacheService.getScriptCache(),session=j18Hash(b.adminToken||''),admin=!!b.adminToken&&cache.get('j18session:'+session)==='1',now=new Date().toISOString();
 if(path==='admin/login'){
  var attempts=Number(cache.get('j18loginAttempts')||0);if(attempts>=30)j18Fail('로그인 시도가 많아. 잠시 뒤 다시 시도해 줘.',429);
  var hash=PropertiesService.getScriptProperties().getProperty('J18_ADMIN_HASH');if(!hash)j18Fail('관리자 설정을 먼저 완료해 줘.',503);
  if(j18Hash(d.password||'')!==hash){cache.put('j18loginAttempts',String(attempts+1),300);j18Fail('비밀번호가 맞지 않아.',401);}
  var token=Utilities.getUuid()+Utilities.getUuid();cache.put('j18session:'+j18Hash(token),'1',21600);return {authenticated:true,adminToken:token};
 }
 if(path==='admin/session')return {authenticated:admin};
 if(path==='admin/logout'){cache.remove('j18session:'+session);return {authenticated:false};}
 var mt=j18Rows('Members_18'),members=mt.rows.map(function(r){return r.alias;}).filter(Boolean);
 if(path==='members'){
  if(method==='POST'){var alias=j18Text(d.alias,24);if(!alias)j18Fail('별칭을 입력해 줘.');if(members.indexOf(alias)<0){j18Write(mt,{alias:alias,created:now});members.push(alias);}return {members:members,alias:alias};}return {members:members};
 }
 if(path.indexOf('attendance')===0){
  if(!admin)j18Fail('관리자로 로그인해 줘.',401);
  var at=j18Rows('Attendance_18');var records=at.rows.filter(function(r){return r.date>='2026-11-02'&&r.date<='2026-11-30';}).map(function(r){return {date:r.date,present:JSON.parse(r.present||'[]'),note:r.note,reading:'',page_start:r.page_start===''?null:Number(r.page_start),page_end:r.page_end===''?null:Number(r.page_end),page_count:r.page_count===''?null:Number(r.page_count),updated:r.updated,revision:Number(r.revision),_row:r._row};});
  if(path==='attendance/all')return {records:records.map(function(r){delete r._row;return r;})};
  var date=j18Date(String(d.date||path.split('date=')[1]||''),method!=='GET'),old=records.filter(function(r){return r.date===date;})[0];
  if(method==='GET'){if(old)delete old._row;return {members:members,record:old||{date:date,present:[],note:'',reading:'',page_start:null,page_end:null,page_count:null,updated:null,revision:0}};}
  if(Number(d.revision)!==Number(old?old.revision:0))j18Fail('다른 곳에서 수정됐어. 새로 불러온 뒤 다시 저장해 줘.',409);
  if(!Array.isArray(d.present)||d.present.some(function(n){return members.indexOf(n)<0;}))j18Fail('참여자 별칭을 확인해 줘.');
  var start=d.page_start,end=d.page_end;if((start!=null&&(!Number.isInteger(start)||start<1||start>10000))||(end!=null&&(!Number.isInteger(end)||end<1||end>10000))||(start!=null&&end!=null&&end<start))j18Fail('시작 쪽과 끝 쪽을 확인해 줘.');
  var rev=(old?old.revision:0)+1;j18Write(at,{date:date,present:JSON.stringify(Array.from(new Set(d.present))),note:j18Text(d.note,10000),page_start:start,page_end:end,page_count:start!=null&&end!=null?end-start+1:null,updated:now,revision:rev},old&&old._row);return {revision:rev};
 }
 if(path!=='records')j18Fail('요청을 찾지 못했어.',404);
 var jt=j18Rows('Journal_18'),owner=/^[\w-]{30,100}$/.test(b.writerToken||'')?j18Hash(b.writerToken):'',rows=jt.rows.filter(function(r){return r.deleted!=='1';});
 function publicRow(r){return {id:r.id,date:r.date,alias:r.alias,quote:r.quote,mind:r.mind,page:r.page,created:r.created,revision:Number(r.revision),canEdit:admin||!!owner&&r.owner_hash===owner};}
 if(method==='GET')return {members:members,entries:rows.map(publicRow)};
 if(!owner)j18Fail('이 브라우저의 저장 권한을 확인해 줘.');
 var id=j18Text(d.id,80);if(!/^[\w-]{20,80}$/.test(id))j18Fail('기록 번호를 확인해 줘.');var existing=jt.rows.filter(function(r){return r.id===id;})[0];
 if(existing){if(!admin&&existing.owner_hash!==owner)j18Fail('이 기록을 남긴 브라우저에서 수정할 수 있어.',403);if(method==='POST'){if(existing.deleted==='1')j18Fail('삭제된 기록이야.',409);return {entry:publicRow(existing)};}if(existing.deleted==='1'||Number(d.revision)!==Number(existing.revision))j18Fail('기록이 바뀌었어. 새로 불러온 뒤 다시 시도해 줘.',409);}else if(method!=='POST')j18Fail('기록을 찾지 못했어.',404);
 if(method==='DELETE'){existing.deleted='1';existing.revision=Number(existing.revision)+1;j18Write(jt,existing,existing._row);return {deleted:true};}
 if(method!=='POST'&&method!=='PUT')j18Fail('지원하지 않는 요청이야.');
 var item={id:id,date:j18Date(String(d.date||''),true),alias:j18Text(d.alias,24),quote:j18Text(d.quote,10000),mind:j18Text(d.mind,10000),page:j18Text(d.page,40),created:existing?existing.created:now,owner_hash:existing?existing.owner_hash:owner,revision:existing?Number(existing.revision)+1:1,deleted:'0'};
 if(members.indexOf(item.alias)<0)j18Fail('별칭을 먼저 선택해 줘.');if(!item.quote&&!item.mind)j18Fail('문장이나 마음 중 하나를 남겨 줘.');j18Write(jt,item,existing&&existing._row);return {entry:publicRow(item)};
}
