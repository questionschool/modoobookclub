const vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const tables={Journal_18:[['id','date','alias','quote','mind','page','created','owner_hash','revision','deleted']],Attendance_18:[['date','present','note','page_start','page_end','page_count','updated','revision']],Members_18:[['alias','created'],['지평','2026-11-01']]};const cache=new Map();
const ctx={console,Utilities:{DigestAlgorithm:{SHA_256:1},computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()],formatDate:()=> '2026-11-02',getUuid:()=>crypto.randomUUID()},PropertiesService:{getScriptProperties:()=>({getProperty:()=>crypto.createHash('sha256').update('test').digest('hex')})},CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},jsonResponse:x=>x,SpreadsheetApp:{flush(){},getActiveSpreadsheet:()=>({getSheetByName:name=>({getDataRange:()=>({getDisplayValues:()=>tables[name].map(r=>[...r])}),getLastRow:()=>tables[name].length,getRange:(row)=>({setNumberFormat(){},setValues(v){tables[name][row-1]=v[0]}})})})}};
ctx.SpreadsheetApp.getActiveSpreadsheet=()=>({getSheetByName:name=>tables[name]?sheet(name):null,insertSheet:name=>{tables[name]=[];return sheet(name);}});
function sheet(name){return {getDataRange:()=>({getDisplayValues:()=>tables[name].map(r=>[...r])}),getLastRow:()=>tables[name].length,getRange:row=>({setNumberFormat(){},setValues(v){tables[name][row-1]=v[0];}})};}
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/../journal18-server.gs','utf8'),ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../journal18-likes.gs','utf8'),ctx);
let admin='',writer=crypto.randomUUID()+crypto.randomUUID();const api=(path,method='GET',data={},w=writer)=>ctx.j18Handle({path,method,data,writerToken:w,adminToken:admin});
assert.equal(api('records').entries.length,0);assert.equal(api('attendance/all').status,401);assert.equal(api('admin/login','POST',{password:'bad'}).status,401);admin=api('admin/login','POST',{password:'test'}).adminToken;assert.ok(admin);
assert.equal(api('attendance','POST',{date:'2026-11-01'}).status,400);
const d={id:crypto.randomUUID(),date:'2026-11-02',alias:'지평',mind:'test',quote:'=SUM(1,2)',page:'1'};assert.ok(api('records','POST',d).ok);assert.equal(tables.Journal_18[1][3],"'=SUM(1,2)");assert.ok(api('records','POST',d).ok);assert.equal(tables.Journal_18.length,2);
admin='';
const other='x'.repeat(40),like=(liked,w=writer)=>api('likes','PUT',{id:d.id,liked},w);
assert.equal(api('records').entries[0].likeCount,0);assert.equal(tables.Likes_18,undefined);
assert.equal(like(true).likeCount,1);assert.equal(like(true).likeCount,1);
assert.equal(like(true,other).likeCount,2);assert.equal(api('records').entries[0].liked,true);
assert.equal(like(false).likeCount,1);assert.equal(like(false).likeCount,1);
assert.equal(api('records').entries[0].liked,false);assert.equal(api('records','GET',{},other).entries[0].liked,true);
assert.equal(api('records').entries[0].revision,1);assert.equal(JSON.stringify(api('records')).includes('visitor_hash'),false);
assert.equal(like('yes').status,400);assert.equal(like(true,'bad').status,400);
assert.equal(api('likes','PUT',{id:'missing-record-1234567890',liked:true}).status,404);
assert.equal(api('likes','DELETE',{id:d.id}).status,405);
assert.equal(api('records','PUT',{...d,revision:1},'x'.repeat(40)).status,403);assert.equal(api('records','PUT',{...d,revision:2}).status,409);assert.ok(api('records','PUT',{...d,revision:1,mind:'updated'}).ok);assert.ok(api('records','DELETE',{id:d.id,revision:2}).ok);assert.equal(api('records').entries.length,0);assert.equal(like(true).status,404);
admin=api('admin/login','POST',{password:'test'}).adminToken;const at={date:'2026-11-02',revision:0,present:['지평'],page_start:5,page_end:29,note:'private'};assert.ok(api('attendance','POST',at).ok);assert.equal(api('attendance/all').records[0].page_count,25);assert.equal(api('attendance','POST',at).status,409);assert.equal(api('attendance','POST',{...at,date:'2026-11-03'}).status,400);assert.equal(api('attendance','POST',{...at,revision:1,page_start:50}).status,400);api('admin/logout','POST');assert.equal(api('attendance/all').status,401);console.log('PASS: journal CRUD, ownership, retries, conflict, formula escaping, login/logout, private attendance, page count, season/future dates');

console.log('PASS: shared likes, retries, unlike, visitor isolation, validation, deleted entries, revision preservation');
