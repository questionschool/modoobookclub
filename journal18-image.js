'use strict';
// One entry per PNG, following the season 17 printable-card layout.
async function downloadEntryImage(entry,button){
 if(button.disabled)return;
 const caption=button.textContent;button.disabled=true;button.textContent='이미지 만드는 중…';
 let wrapper;
 try{
  if(typeof html2canvas!=='function')throw Error('이미지 도구를 불러오지 못했어. 연결을 확인하고 다시 시도해 줘.');
  wrapper=document.createElement('div');wrapper.style.cssText='position:fixed;left:-10000px;top:0;width:680px;pointer-events:none';wrapper.setAttribute('aria-hidden','true');
  const card=document.createElement('article');card.style.cssText="all:initial;display:block;box-sizing:border-box;width:680px;padding:26px 26px 20px;background:#078f8b;color:#254650;font-family:'Gowun Batang',serif;line-height:1.85;overflow-wrap:anywhere";
  // Reset every printable element so the website's blockquote and heading rules cannot leak in.
  const add=(tag,text,style,parent=card)=>{const node=document.createElement(tag);node.textContent=text;node.style.cssText='all:initial;display:block;box-sizing:border-box;color:inherit;font-family:inherit;overflow-wrap:anywhere;'+style;parent.append(node);return node;};
  const header=add('div','','display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 5px 19px');
  add('div','모두의 새벽 + 낭만북클럽','font:500 12px "Noto Sans KR",sans-serif;letter-spacing:1.5px;color:#effcf8',header);
  add('div','독서 노트','font:500 12px "Noto Sans KR",sans-serif;letter-spacing:2px;color:#effcf8',header);
  const body=add('div','','background:#fffcf7;border:1px solid #d3e5dc;padding:30px 30px 0');
  if(entry.quote){
   add('div','오늘 담아둔 문장','font:500 11px "Noto Sans KR",sans-serif;letter-spacing:1px;color:#28766f;margin-bottom:16px',body);
   const quote=String(entry.quote).trim();
   const quoted=(quote.startsWith('“')&&quote.endsWith('”'))||(quote.startsWith('"')&&quote.endsWith('"'));
   add('div',quoted?quote:'“'+quote+'”','font-size:22px;line-height:1.85;white-space:pre-wrap;word-break:keep-all;color:#244550',body);
   add('div','— 김정규 · 『뉴런하우스』'+(entry.page?' · p. '+entry.page:''),'font-size:13px;line-height:1.7;text-align:right;color:#28766f;margin-top:18px;padding-bottom:25px',body);
  }
  if(entry.mind){
   const mind=add('div','','background:#edf4f1;border-top:1px solid #ccdfd9;padding:23px 24px 24px;margin:0 -12px',body);
   add('div','남기고 싶은 나의 마음','font:500 11px "Noto Sans KR",sans-serif;letter-spacing:.7px;color:#257f79;margin-bottom:13px',mind);
   add('div',entry.mind,'font-size:18px;line-height:1.95;white-space:pre-wrap;word-break:keep-all;color:#315354',mind);
  }
  if(!entry.quote)add('div','김정규 · 『뉴런하우스』'+(entry.page?' · p. '+entry.page:''),'font-size:12px;text-align:right;color:#28766f;margin-top:18px',body);
  const signature=add('div','','display:flex;align-items:center;justify-content:space-between;gap:24px;padding:21px 0 22px;margin-top:8px',body);
  add('div',entry.date.replaceAll('-','. '),'font:12px "Noto Sans KR",sans-serif;letter-spacing:.8px;color:#8b8b7f;flex-shrink:0',signature);
  add('div',entry.alias,'font-size:19px;font-weight:700;color:#28766f;text-align:right',signature);
  const footer=add('div','','display:flex;align-items:center;justify-content:center;gap:12px;padding-top:17px');
  add('div','bookclub.questionschool.net','font:11px "Noto Sans KR",sans-serif;letter-spacing:.8px;color:#e1f6f0',footer);
  wrapper.append(card);document.body.append(wrapper);
  if(document.fonts){await Promise.all([document.fonts.load('22px "Gowun Batang"'),document.fonts.load('700 19px "Gowun Batang"'),document.fonts.load('12px "Noto Sans KR"')]);await document.fonts.ready;}
  // Keep long entries inside common mobile canvas memory and dimension limits.
  const height=Math.ceil(card.getBoundingClientRect().height),scale=Math.min(2,16000/height,Math.sqrt(15000000/(680*height)));
  const canvas=await html2canvas(card,{scale,backgroundColor:'#078f8b',logging:false,useCORS:true,windowWidth:1000,scrollX:0,scrollY:0});
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('이미지를 만들지 못했어. 다시 시도해 줘.')),'image/png'));
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;
  const safe=value=>String(value).replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_').slice(0,60);
  link.download='뉴런하우스_오늘의기록_'+safe(entry.date)+'_'+safe(entry.alias)+'_'+safe(entry.id).slice(0,8)+'.png';
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  likeStatus().textContent='이 글을 이미지로 저장했어.';
 }catch(error){likeStatus().textContent=error.message||'이미지 저장에 실패했어. 다시 시도해 줘.';}
 finally{wrapper?.remove();button.disabled=false;button.textContent=caption;}
}
