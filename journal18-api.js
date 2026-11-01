'use strict';
const JOURNAL18_ENDPOINT='https://script.google.com/macros/s/AKfycbyN5Gzjrzvf_hnewWGnFdeQpl0YpSbcR8aRsW8BGQbOsd2_ajsuAkwD228JwyccQj1h/exec';
async function journal18Api(path,method='GET',data){
 let writerToken;try{writerToken=localStorage.getItem('journal18-writer');if(!writerToken){writerToken=crypto.randomUUID()+crypto.randomUUID();localStorage.setItem('journal18-writer',writerToken);}}catch{throw Error('기록을 수정할 권한을 기억하려면 브라우저 저장을 허용해 줘. 기록 본문은 구글 시트에 저장돼.');}
 const response=await fetch(JOURNAL18_ENDPOINT,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({season:18,path,method,data,writerToken,adminToken:sessionStorage.getItem('journal18-admin')||''})});
 if(!response.ok)throw Error('연결을 확인하지 못했어. 잠시 뒤 다시 시도해 줘.');
 const value=await response.json();if(!value.ok){const e=Error(value.error||'저장소에 연결하지 못했어.');e.status=value.status;throw e;}
 if(path==='admin/login'&&value.adminToken)sessionStorage.setItem('journal18-admin',value.adminToken);
 if(path==='admin/logout')sessionStorage.removeItem('journal18-admin');
 return value;
}
