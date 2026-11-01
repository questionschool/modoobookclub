'use strict';
// One entry per PNG, following the season 17 printable-card layout.
async function downloadEntryImage(entry,button){
 if(button.disabled)return;
 const caption=button.textContent;button.disabled=true;button.textContent='이미지 만드는 중…';
 let wrapper;
 try{
  if(typeof html2canvas!=='function')throw Error('이미지 도구를 불러오지 못했어. 연결을 확인하고 다시 시도해 줘.');
  wrapper=document.createElement('div');wrapper.style.cssText='position:fixed;left:-10000px;top:0;width:680px;pointer-events:none';wrapper.setAttribute('aria-hidden','true');
  const card=document.createElement('article');card.style.cssText="box-sizing:border-box;width:680px;padding:48px 50px;background:#f7f4ee;color:#193d52;font-family:'Gowun Batang',serif;line-height:1.85;overflow-wrap:anywhere";
  const add=(tag,text,style,parent=card)=>{const node=document.createElement(tag);node.textContent=text;node.style.cssText=style;parent.append(node);return node;};
  add('div','모두의 새벽 + 낭만북클럽 · SEASON 18','font:11px sans-serif;letter-spacing:2px;text-align:center;color:#6d7774');
  add('h1','오늘의 기록','font-size:32px;font-weight:400;text-align:center;margin:12px 0');
  add('div','김정규 · 『뉴런하우스』','font-size:15px;text-align:center');
  add('div',entry.date.replaceAll('-','. ')+(entry.page?' · '+entry.page+'쪽':''),'font:12px sans-serif;text-align:center;color:#697674;margin:10px 0 28px');
  const body=add('div','','border:1px solid #dedbd1;border-left:3px solid #d5b557;background:#fffdf7;padding:28px');
  if(entry.quote){add('div','담아두고 싶은 문장','font:11px sans-serif;color:#8a7445;margin-bottom:12px',body);add('blockquote',entry.quote,'margin:0;font-size:21px;line-height:1.85;white-space:pre-wrap;overflow-wrap:anywhere',body);}
  if(entry.mind){add('div','남기고 싶은 나의 마음','font:11px sans-serif;color:#8a7445;margin:'+(entry.quote?'28px':'0')+' 0 12px',body);add('p',entry.mind,'margin:0;font-size:17px;line-height:1.95;white-space:pre-wrap;overflow-wrap:anywhere',body);}
  add('div',entry.alias,'border-top:1px dotted #c8c7ba;margin-top:24px;padding-top:16px;text-align:right;font-size:17px;font-weight:700',body);
  add('div','모두의 새벽 + 낭만북클럽\nbookclub.questionschool.net','white-space:pre-line;text-align:center;margin-top:26px;font:11px/1.8 sans-serif;color:#73807a');
  wrapper.append(card);document.body.append(wrapper);
  if(document.fonts){await document.fonts.load('21px "Gowun Batang"');await document.fonts.ready;}
  // Keep long entries inside common mobile canvas memory and dimension limits.
  const height=Math.ceil(card.getBoundingClientRect().height),scale=Math.min(2,16000/height,Math.sqrt(15000000/(680*height)));
  const canvas=await html2canvas(card,{scale,backgroundColor:'#f7f4ee',logging:false,useCORS:true,windowWidth:1000,scrollX:0,scrollY:0});
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('이미지를 만들지 못했어. 다시 시도해 줘.')),'image/png'));
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;
  const safe=value=>String(value).replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_').slice(0,60);
  link.download='뉴런하우스_오늘의기록_'+safe(entry.date)+'_'+safe(entry.alias)+'_'+safe(entry.id).slice(0,8)+'.png';
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  likeStatus().textContent='이 글을 이미지로 저장했어.';
 }catch(error){likeStatus().textContent=error.message||'이미지 저장에 실패했어. 다시 시도해 줘.';}
 finally{wrapper?.remove();button.disabled=false;button.textContent=caption;}
}
