// Called inside the existing j18Handle script lock. No participant identity is exposed.
function j18LikesTable(create) {
 var book=SpreadsheetApp.getActiveSpreadsheet(),sheet=book.getSheetByName('Likes_18');
 if(!sheet){if(!create)return {rows:[]};sheet=book.insertSheet('Likes_18');sheet.getRange(1,1,1,4).setValues([['record_id','visitor_hash','active','updated']]);}
 return j18Rows('Likes_18');
}
function j18LikeSummary(rows,id,owner) {
 var voters={};rows.forEach(function(r){if(r.record_id===id){if(r.active==='1')voters[r.visitor_hash]=true;else delete voters[r.visitor_hash];}});
 return {likeCount:Object.keys(voters).length,liked:!!owner&&!!voters[owner]};
}
function j18LikesDispatch(b) {
 var path=String(b.path||'records'),method=b.method||'GET',d=b.data||{},owner=/^[\w-]{30,100}$/.test(b.writerToken||'')?j18Hash(b.writerToken):'';
 if(path!=='likes'){
  var result=j18Dispatch(b);
  if(path==='records'&&method==='GET'){var likes=j18LikesTable(false).rows;result.entries.forEach(function(r){Object.assign(r,j18LikeSummary(likes,r.id,owner));});}
  return result;
 }
 if(method!=='PUT')j18Fail('지원하지 않는 요청이야.',405);
 if(!owner)j18Fail('좋아요를 기억하려면 브라우저 저장을 허용해 줘.',400);
 if(typeof d.liked!=='boolean')j18Fail('좋아요 상태를 확인해 줘.',400);
 var id=j18Text(d.id,80);if(!/^[\w-]{20,80}$/.test(id))j18Fail('기록 번호를 확인해 줘.',400);
 var exists=j18Rows('Journal_18').rows.some(function(r){return r.id===id&&r.deleted!=='1';});if(!exists)j18Fail('기록을 찾지 못했어. 새로 불러와 줘.',404);
 var table=j18LikesTable(true),old=table.rows.filter(function(r){return r.record_id===id&&r.visitor_hash===owner;})[0];
 // Setting an explicit state keeps retries idempotent; counts cannot become negative.
 if(d.liked||old){var item={record_id:id,visitor_hash:owner,active:d.liked?'1':'0',updated:new Date().toISOString()};j18Write(table,item,old&&old._row);if(old)Object.assign(old,item);else table.rows.push(item);}
 return Object.assign({id:id},j18LikeSummary(table.rows,id,owner));
}
