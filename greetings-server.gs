/**
 * 모두의 새벽 + 낭만북클럽 — 참가자 기록 백엔드 v5
 * Google Apps Script (코드.gs)
 *
 * v5 변경 사항:
 *  - 공개 목록 응답에서 본명 제외 (별칭만 공개)
 *
 * v4 변경 사항:
 *  - G열 '연락처' 컬럼 추가 (처음 참가자가 남기는 연락처/이메일, 옵션)
 *  - doGet은 연락처를 반환하지 않음 (페이지에 노출 X, 안전)
 *  - 이메일 알림 본문에 연락처 포함
 *
 * v3 변경 사항:
 *  - alert 호출 안전 처리 (에디터에서 직접 실행해도 오류 안 남)
 *
 * v2 변경 사항:
 *  - F열 '시즌' 컬럼 추가 (시즌 15 / 16 / 17 ... 분기)
 *  - season 파라미터 없으면 기본 '15'로 처리 (welcome_15.html 호환 유지)
 *  - 신규 등록 시 thomas@questionschool.net 으로 메일 자동 발송
 *
 * 시트 컬럼 구조 (A~G):
 *   A: 타임스탬프 (자동)
 *   B: 이름
 *   C: 별칭
 *   D: 자기소개
 *   E: 시작하기 전에 남기고 싶은 말
 *   F: 시즌 (예: '15', '16')
 *   G: 연락처 (옵션, 처음 참가자만)
 */

// 시트 이름 (탭 이름과 동일하게)
const SHEET_NAME = '참가자';

// 알림 받을 메일 주소
const NOTIFY_EMAIL = 'thomas@questionschool.net';

/**
 * GET 요청 처리 — 엔트리 목록 반환
 * season 파라미터로 시즌별 필터링. 없으면 '15' 기본.
 * 연락처는 의도적으로 반환하지 않음 (페이지 노출 차단).
 */
function legacyDoGet_(e) {
  try {
    const sheet = SpreadsheetApp.openById('1cCTYljHwrG-3jqX9Vb103B88-IB1Zzgpk3_U4f1eLPo').getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonResponse({ entries: [] });
    }

    // season 파라미터 (없으면 '15' 기본 — welcome_15.html 호환)
    const season = (e.parameter && e.parameter.season) ? String(e.parameter.season) : '15';

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return jsonResponse({ entries: [] });
    }

    // A:G 가져오기 (lastCol이 6 이하라도 안전하게 7로)
    const lastCol = Math.max(sheet.getLastColumn(), 7);
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    const entries = data
      .filter(function (row) { return row[2] && row[4]; })  // 별칭/메시지 있는 행만
      .filter(function (row) {
        // F열 비어있으면 기본 '15'로 간주 (마이그레이션 안 한 옛 데이터 호환)
        const rowSeason = row[5] ? String(row[5]) : '15';
        return rowSeason === season;
      })
      .map(function (row) {
        // 이름(B열, row[1])과 연락처(G열, row[6])는 반환하지 않음
        return {
          timestamp: row[0] ? new Date(row[0]).toISOString() : '',
          alias: String(row[2] || ''),
          intro: String(row[3] || ''),
          message: String(row[4] || ''),
          season: row[5] ? String(row[5]) : '15'
        };
      })
      .reverse(); // 최신순

    return jsonResponse({ entries: entries });
  } catch (err) {
    return jsonResponse({ entries: [], error: String(err) });
  }
}

/**
 * POST 요청 처리 — 새 엔트리 추가 + 메일 발송
 */
function legacyDoPost_(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    if (payload.action !== 'add') {
      return jsonResponse({ ok: false, error: 'Unknown action' });
    }

    const name = (payload.name || '').toString().trim();
    const alias = (payload.alias || '').toString().trim();
    const intro = (payload.intro || '').toString().trim();
    const message = (payload.message || '').toString().trim();
    const season = (payload.season || '15').toString().trim();  // 기본 15
    const contact = (payload.contact || '').toString().trim();  // 옵션

    if (!name || !alias || !intro || !message) {
      return jsonResponse({ ok: false, error: 'Missing fields' });
    }

    // 길이 제한
    if (name.length > 50 || alias.length > 50 || intro.length > 2000 || message.length > 2000 || contact.length > 200) {
      return jsonResponse({ ok: false, error: 'Too long' });
    }

    const ss = SpreadsheetApp.openById('1cCTYljHwrG-3jqX9Vb103B88-IB1Zzgpk3_U4f1eLPo');
    let sheet = ss.getSheetByName(SHEET_NAME);

    // 시트가 없으면 자동 생성 (7열 헤더)
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.getRange(1, 1, 1, 7).setValues([['타임스탬프', '이름', '별칭', '자기소개', '시작하기 전에 남기고 싶은 말', '시즌', '연락처']]);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#d8e7f0');
      sheet.setFrozenRows(1);
    } else {
      // 기존 시트에 G열 헤더 없으면 추가
      const headerLastCol = sheet.getLastColumn();
      if (headerLastCol < 7) {
        sheet.getRange(1, 7).setValue('연락처');
        sheet.getRange(1, 7).setFontWeight('bold').setBackground('#d8e7f0');
      }
    }

    sheet.appendRow([new Date(), name, alias, intro, message, season, contact]);

    // 이메일 자동 발송 (실패해도 시트 기록은 성공 처리)
    try {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: '[낭만북클럽 시즌 ' + season + '] 새 인사말 · ' + alias,
        body:
          '시즌 ' + season + ' 인사말이 새로 등록되었어.\n\n' +
          '── 이름 ──\n' + name + '\n\n' +
          '── 별칭 ──\n' + alias + '\n\n' +
          '── 연락처 ──\n' + (contact || '(없음)') + '\n\n' +
          '── 자기소개 ──\n' + intro + '\n\n' +
          '── 남기는 말 ──\n' + message + '\n\n' +
          '— ' + new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) + '\n' +
          'https://bookclub.questionschool.net/welcome_' + season + '.html'
      });
    } catch (mailErr) {
      Logger.log('Mail send failed: ' + mailErr);
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

/**
 * JSON 응답 헬퍼
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * alert 안전 호출 헬퍼
 * - 스프레드시트 UI 컨텍스트가 있으면 알림 팝업
 * - 없으면 (에디터에서 직접 실행 등) 실행 로그에 출력
 */
function safeAlert(msg) {
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    Logger.log(msg);
  }
}

/**
 * 시트 초기 설정 / F열 시즌 + G열 연락처 컬럼 추가
 * Apps Script 에디터에서 직접 실행해도 OK. 결과는 실행 로그에 출력.
 */
function setupSheet() {
  greetingRequireOwner_();
  const ss = SpreadsheetApp.openById('1cCTYljHwrG-3jqX9Vb103B88-IB1Zzgpk3_U4f1eLPo');
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  sheet.getRange(1, 1, 1, 7).setValues([['타임스탬프', '이름', '별칭', '자기소개', '시작하기 전에 남기고 싶은 말', '시즌', '연락처']]);
  sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#d8e7f0');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 400);
  sheet.setColumnWidth(5, 500);
  sheet.setColumnWidth(6, 80);
  sheet.setColumnWidth(7, 200);

  safeAlert('✅ 시트 설정 완료!\n\nF열 "시즌" + G열 "연락처" 컬럼이 추가됐어.\n다음에 [배포 → 배포 관리 → 활성 배포 편집 → 버전 새로 만들기]로 갱신해 줘.');
}

/**
 * 기존 시즌 15 데이터 마이그레이션 (한 번만 실행, 옵션)
 * F열이 비어있는 행에 '15' 채워넣기. 마이그레이션 안 해도 doGet은 자동 fallback으로 동작함.
 */
function migrateSeason15Data() {
  greetingRequireOwner_();
  const ss = SpreadsheetApp.openById('1cCTYljHwrG-3jqX9Vb103B88-IB1Zzgpk3_U4f1eLPo');
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    safeAlert('시트가 없어.');
    return;
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    safeAlert('데이터가 없어.');
    return;
  }

  const seasonRange = sheet.getRange(2, 6, lastRow - 1, 1);
  const values = seasonRange.getValues();
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    if (!values[i][0]) {
      values[i][0] = '15';
      count++;
    }
  }
  seasonRange.setValues(values);

  safeAlert('✅ ' + count + '개 행에 "시즌 15" 표시함.');
}

/**
 * 이메일 발송 테스트 (권한 승인용 / 발송 확인용)
 */
function testMail() {
  greetingRequireOwner_();
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: '[낭만북클럽] 메일 발송 테스트',
    body: '메일 발송이 정상 작동합니다.\n\n— ' + new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  });
  Logger.log('테스트 메일 발송 완료: ' + NOTIFY_EMAIL);
}

/**
 * 시즌 18 인사 카드 편집 API.
 * 기존 v5의 doGet/doPost를 legacyDoGet_/legacyDoPost_로 바꾼 뒤 이 파일을 추가합니다.
 * 비밀값은 Script Properties / Cache에만 보관하며 저장소에 넣지 않습니다.
 */
const GREETING_HEADERS = ['글 ID', '수정 비밀번호 해시', '비밀번호 솔트', '수정 시각', '삭제 시각', '수정 버전', '접수 ID', '변경 ID'];
const GREETING_ADMIN = 'thomas@questionschool.net';
const GREETING_SITE = 'https://bookclub.questionschool.net/welcome_18.html';

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'admin') return greetingAdminPage_();
  if (String(p.season || '15') !== '18') return legacyDoGet_(e);
  try {
    const sheet = greetingSheet_();
    const rows = greetingRows_(sheet);
    return jsonResponse({ entries: rows.filter(r => String(r[5]) === '18' && r[7] && !r[11] && r[2] && r[4]).map(greetingPublic_).reverse() });
  } catch (err) { return jsonResponse({ error: 'server_error' }); }
}

function doPost(e) {
  let p;
  try { p = JSON.parse(e.postData.contents); } catch (err) { return jsonResponse({ok:false,error:'invalid_request'}); }
  if (String(p.season || '15') !== '18') {
    if (p.action === 'add') return legacyDoPost_(e);
    return jsonResponse({ok:false,error:'invalid_request'});
  }
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    return jsonResponse(greetingRequest_(p));
  } catch (err) {
    return jsonResponse({ok:false,error:err.greetingCode || 'server_error'});
  } finally { if (lock.hasLock()) lock.releaseLock(); }
}

function greetingFail_(code) { const e = new Error(code); e.greetingCode = code; throw e; }
function greetingText_(value, max, required) {
  if (value != null && typeof value !== 'string') greetingFail_('invalid_fields');
  const s = (value || '').trim();
  if ((required && !s) || s.length > max) greetingFail_('invalid_fields');
  return s;
}
function greetingPassword_(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) greetingFail_('password_length');
  return value;
}
function greetingSecret_() {
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('GREETING_V6_SECRET');
  if (!key) { key = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('GREETING_V6_SECRET', key); }
  return key;
}
function greetingHash_(salt, password) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(salt + '\n' + password, greetingSecret_()));
}
function greetingEqual_(a, b) {
  a=String(a||''); b=String(b||''); let diff=a.length ^ b.length;
  for(let i=0;i<Math.max(a.length,b.length);i++) diff |= (a.charCodeAt(i)||0) ^ (b.charCodeAt(i)||0);
  return diff === 0;
}
// Escape formula prefixes before writing any user-supplied text to Sheets.
function greetingCell_(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }
function greetingSheet_() {
  const sheet = SpreadsheetApp.openById('1cCTYljHwrG-3jqX9Vb103B88-IB1Zzgpk3_U4f1eLPo').getSheetByName(SHEET_NAME);
  if (!sheet) greetingFail_('not_configured');
  return sheet;
}
function greetingRows_(sheet) { return sheet.getLastRow()<2 ? [] : sheet.getRange(2,1,sheet.getLastRow()-1,15).getValues(); }
function greetingDate_(value) { return value ? new Date(value).toISOString() : ''; }
function greetingPublic_(r) {
  return { id:String(r[7]), alias:String(r[2]||''), intro:String(r[3]||''), message:String(r[4]||''), season:'18', timestamp:greetingDate_(r[0]), updatedAt:greetingDate_(r[10]), revision:Number(r[12])||1, hasPassword:!!r[8] };
}
function greetingAdmin_(token) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return false;
  return CacheService.getScriptCache().get('greeting-admin:' + token) === GREETING_ADMIN;
}
function greetingAuthorize_(r,p) {
  if (p.adminToken) { if (!greetingAdmin_(p.adminToken)) greetingFail_('admin_expired'); return 'admin'; }
  if (!r[8]) greetingFail_('password_not_set');
  const cache=CacheService.getScriptCache(), key='greeting-fail:' + r[7];
  const count=Number(cache.get(key)||0);
  if(count >= 8) greetingFail_('rate_limited');
  if(typeof p.password!=='string' || p.password.length>128 || !greetingEqual_(r[8],greetingHash_(r[9],p.password))) {
    cache.put(key,String(count+1),300); greetingFail_('wrong_password');
  }
  cache.remove(key); return 'author';
}
function greetingRequest_(p) {
  if(p.action==='adminCheck') return {ok:greetingAdmin_(p.adminToken), error:greetingAdmin_(p.adminToken)?undefined:'admin_expired'};
  if(p.action==='adminLogout') { if(greetingAdmin_(p.adminToken)) CacheService.getScriptCache().remove('greeting-admin:'+p.adminToken); return {ok:true}; }
  const sheet=greetingSheet_(), rows=greetingRows_(sheet);
  if(p.action==='add') {
    const name=greetingText_(p.name,50,true), alias=greetingText_(p.alias,40,true), contact=greetingText_(p.contact,160,false);
    const intro=greetingText_(p.intro,2000,true), message=greetingText_(p.message,2000,true);
    // Cached v5 forms remain compatible; their posts can be assigned a password by the administrator.
    const password=p.password == null ? '' : greetingPassword_(p.password);
    const requestId=greetingText_(p.requestId,80,false);
    if(requestId && !/^[a-zA-Z0-9-]{20,80}$/.test(requestId)) greetingFail_('invalid_request');
    if(p.test && !greetingAdmin_(p.adminToken)) greetingFail_('forbidden');
    const existing=requestId && rows.find(r=>String(r[5])==='18' && r[13]===requestId);
    if(existing) {
      if(existing[11] || !password || !greetingEqual_(existing[8],greetingHash_(existing[9],password))) greetingFail_('request_conflict');
      return {ok:true,entry:greetingPublic_(existing)};
    }
    const salt=Utilities.getUuid(), now=new Date();
    const row=[now,greetingCell_(name),greetingCell_(alias),greetingCell_(intro),greetingCell_(message),'18',greetingCell_(contact),Utilities.getUuid(),password?greetingHash_(salt,password):'',salt,now,'',1,requestId,''];
    sheet.appendRow(row);
    if(!p.test) {
      try { MailApp.sendEmail({to:NOTIFY_EMAIL,subject:'[낭만북클럽 시즌 18] 새 인사말 · '+alias,body:'시즌 18 인사말이 새로 등록되었습니다.\n\n이름: '+name+'\n별칭: '+alias+'\n연락처: '+(contact||'(없음)')+'\n\n자기소개\n'+intro+'\n\n남기는 말\n'+message+'\n\n'+GREETING_SITE}); } catch(err) { Logger.log('Signup notification failed'); }
    }
    return {ok:true,entry:greetingPublic_(row)};
  }
  if(p.action==='receipt') {
    const r=rows.find(r=>String(r[5])==='18' && r[13] && r[13]===p.requestId);
    if(!r || r[11]) return {ok:false,error:'not_found'};
    greetingAuthorize_(r,p); return {ok:true,entry:greetingPublic_(r)};
  }
  if(!['update','delete','mutationStatus'].includes(p.action)) greetingFail_('invalid_request');
  const index=rows.findIndex(r=>r[7]===p.id && String(r[5])==='18');
  if(index<0) greetingFail_('not_found');
  const row=rows[index], role=greetingAuthorize_(row,p);
  if(p.action==='mutationStatus') return {ok:true,applied:row[14]===p.mutationId,deleted:!!row[11],entry:row[11]?undefined:greetingPublic_(row)};
  if(row[11]) greetingFail_('not_found');
  if(!/^[a-zA-Z0-9-]{20,80}$/.test(p.mutationId||'')) greetingFail_('invalid_request');
  if(row[14]===p.mutationId) return {ok:true,entry:greetingPublic_(row)};
  if(Number(p.revision)!==(Number(row[12])||1)) greetingFail_('conflict');
  if(p.action==='update') {
    row[2]=greetingCell_(greetingText_(p.alias,40,true));
    row[3]=greetingCell_(greetingText_(p.intro,2000,true));
    row[4]=greetingCell_(greetingText_(p.message,2000,true));
    if(p.newPassword) {
      if(role!=='admin') greetingFail_('forbidden');
      row[9]=Utilities.getUuid();row[8]=greetingHash_(row[9],greetingPassword_(p.newPassword));
    }
  } else { row[11]=new Date(); }
  row[10]=new Date(); row[12]=(Number(row[12])||1)+1; row[14]=p.mutationId;
  // Preserve application name/contact and registration date; edit public fields + metadata only.
  sheet.getRange(index+2,3,1,3).setValues([[row[2],row[3],row[4]]]);
  sheet.getRange(index+2,8,1,8).setValues([row.slice(7,15)]);
  return {ok:true,deleted:!!row[11],entry:row[11]?undefined:greetingPublic_(row)};
}

function greetingRequireOwner_() {
  if (String(Session.getActiveUser().getEmail() || "").toLowerCase() !== GREETING_ADMIN) greetingFail_("forbidden");
}

function setupGreetingsV6() {
  greetingRequireOwner_();
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try {
    const sheet=greetingSheet_();
    sheet.getRange(1,8,1,8).setValues([GREETING_HEADERS]);
    greetingSecret_();
    greetingRows_(sheet).forEach((r,i)=>{
      if(String(r[5])==='18' && !r[7]) sheet.getRange(i+2,8,1,8).setValues([[Utilities.getUuid(),'','',r[0]||new Date(),'',1,'','']]);
    });
    Logger.log('시즌 18 편집 준비 완료. 기존 인사와 신청 정보는 보존했습니다.');
  } finally {lock.releaseLock();}
}

function greetingAdminPage_() {
  // Never use getEffectiveUser() here: public web apps execute as the owner.
  const email=String(Session.getActiveUser().getEmail()||'').toLowerCase();
  let content='<h1>관리자 계정 확인이 필요합니다</h1><p>운영자 Google 계정으로 로그인한 브라우저에서 다시 열어 주세요.</p>';
  if(email===GREETING_ADMIN) {
    const token=(Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,'');
    CacheService.getScriptCache().put('greeting-admin:'+token,GREETING_ADMIN,21600);
    content='<h1>지평님, 안녕하세요.</h1><p>참가자 인사글을 수정·삭제하고, 기존 글에 수정 비밀번호를 지정하실 수 있습니다.</p><a rel="noreferrer" target="_blank" href="'+GREETING_SITE+'#admin='+token+'">관리자 화면 열기 →</a><p class="note">이 브라우저에서 최대 6시간 동안 관리하실 수 있습니다. 사용 후 사이트에서 관리자 나가기를 눌러 주세요.</p>';
  }
  return HtmlService.createHtmlOutput('<!doctype html><html lang="ko"><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>낭만북클럽 관리자 확인</title><style>body{max-width:580px;margin:12vh auto;padding:28px;background:#f6f3e9;color:#193d52;font-family:system-ui,sans-serif;line-height:1.9}h1{font-size:27px}a{display:inline-block;background:#193d52;color:white;padding:14px 22px;text-decoration:none;border-radius:6px}.note{font-size:13px;color:#66766d}</style></head><body>'+content+'</body></html>').setTitle('낭만북클럽 관리자 확인');
}

function verifyGreetingsV6() {
  greetingRequireOwner_();
  const started=Date.now(), sheet=greetingSheet_();
  const count=greetingRows_(sheet).filter(r=>String(r[5])==='18' && r[7] && !r[11]).length;
  Logger.log('참가자 시트 연결 정상 · 시즌 18 공개 인사 '+count+'개 · '+(Date.now()-started)+'ms');
}
