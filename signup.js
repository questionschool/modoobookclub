(() => {
  'use strict';
  const form = document.querySelector('#season18-form');
  if (!form) return;
  const endpoint = 'https://script.google.com/macros/s/AKfycbw1rjT7UzjWMMea5UdmD8AxwDLsVNjMH-bdnKLxlJNPaa15xTT80yZlRuTBEthoX3rIbA/exec';
  const status = document.querySelector('#signup-status');
  const button = document.querySelector('#signup-submit');
  const board = document.querySelector('#season18-greetings');
  const refresh = document.querySelector('#greetings-refresh');
  const notice = document.querySelector('#greetings-notice');
  const adminLink = document.querySelector('#greetings-admin');
  const logout = document.querySelector('#greetings-logout');
  const dialog = document.querySelector('#greeting-editor');
  const editor = document.querySelector('#greeting-edit-form');
  const editStatus = document.querySelector('#greeting-edit-status');
  const save = document.querySelector('#greeting-save');
  const remove = document.querySelector('#greeting-delete');
  const passwordField = document.querySelector('#edit-password-field');
  const resetField = document.querySelector('#edit-reset-field');
  let pending = null, busy = false, completed = false, editing = null, mutating = false, uncertain = null;
  let entries = [], adminToken = '', admin = false, focusBeforeEdit = null;
  const el = (tag, cls, text) => { const n = document.createElement(tag); n.className = cls; n.textContent = text; return n; };
  const uuid = () => crypto.randomUUID();
  const errors = {
    wrong_password: '비밀번호가 맞지 않습니다. 작성할 때 정하신 비밀번호를 확인해 주세요.',
    password_not_set: '이전에 작성된 글이라 수정 비밀번호가 없습니다. 진행자에게 비밀번호 지정을 요청해 주세요.',
    password_length: '수정 비밀번호는 8자 이상 128자 이하로 입력해 주세요.',
    rate_limited: '비밀번호 확인이 여러 번 실패했습니다. 5분 뒤 다시 시도해 주세요.',
    conflict: '다른 곳에서 글이 변경되었습니다. 창을 닫고 새로고침한 뒤 다시 수정해 주세요.',
    not_found: '글을 찾을 수 없습니다. 새로고침해 주세요.',
    admin_expired: '관리자 인증이 만료되었습니다. 관리자 버튼에서 다시 확인해 주세요.',
    invalid_fields: '필수 내용과 글자 수를 확인해 주세요.',
    forbidden: '이 작업을 할 권한이 없습니다.',
    request_conflict: '접수 정보를 확인할 수 없습니다. 진행자에게 문의해 주세요.'
  };
  function messageFor(data) { return errors[data.error] || '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'; }
  async function post(payload) {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...payload, season: 18 }), signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error('unconfirmed');
    const data = await res.json();
    if (typeof data.ok !== 'boolean') throw new Error('unconfirmed');
    return data;
  }
  function setAdmin(token, active) {
    adminToken = token; admin = active;
    try { if (token) sessionStorage.setItem('modoo-greetings-admin', token); else sessionStorage.removeItem('modoo-greetings-admin'); } catch {}
    logout.hidden = !active; adminLink.hidden = active;
    notice.textContent = active ? '관리자 모드입니다. 모든 인사글을 수정·삭제하고 수정 비밀번호를 지정할 수 있습니다.' : '';
    notice.className = active ? 'greeting-notice is-admin' : 'greeting-notice';
  }
  adminLink.href = 'https://script.google.com/a/macros/questionschool.net/s/AKfycbwkHgX_KY0vr-5FRzGmkoXmaL_ybY5G_bM7vGX_nIElUw8DvXv79rguwVEi-xQZNT8ZYA/exec?action=admin';
  const fragment = new URLSearchParams(location.hash.slice(1));
  const incoming = fragment.get('admin');
  if (incoming) history.replaceState(null, '', location.pathname + location.search + '#greeting-title');
  try { adminToken = incoming || sessionStorage.getItem('modoo-greetings-admin') || ''; } catch { adminToken = incoming || ''; }
  async function initAdmin() {
    if (!adminToken) return;
    try {
      const data = await post({ action: 'adminCheck', adminToken });
      if (data.ok) setAdmin(adminToken, true);
      else { setAdmin('', false); notice.textContent = messageFor(data); }
    } catch { notice.textContent = '관리자 확인을 완료하지 못했습니다. 잠시 후 페이지를 새로고침해 주세요.'; }
  }
  logout.addEventListener('click', async () => {
    const token = adminToken; setAdmin('', false);
    if (dialog.open) dialog.close();
    try { await post({ action: 'adminLogout', adminToken: token }); } catch {}
  });
  const pencil = '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15l-1 6Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function render() {
    board.replaceChildren();
    if (!entries.length) { board.append(el('p', 'greeting-empty', '아직 남겨진 인사가 없습니다. 첫 번째 인사를 남겨 주세요.')); return; }
    entries.forEach(entry => {
      const card = el('article', 'greeting-entry', '');
      const head = el('header', 'greeting-entry-head', '');
      const name = el('div', 'greeting-author', '');
      name.append(el('span', 'greeting-avatar', Array.from(String(entry.alias || '참가자'))[0]));
      name.append(el('h4', '', String(entry.alias || '참가자')));
      head.append(name);
      if (entry.id) {
        const edit = el('button', 'greeting-edit-button', '');
        edit.type = 'button'; edit.innerHTML = pencil;
        edit.append(el('span', '', '수정'));
        edit.setAttribute('aria-label', `${entry.alias || '참가자'} 님의 인사 수정 또는 삭제`);
        edit.addEventListener('click', () => openEditor(entry, edit)); head.append(edit);
      }
      card.append(head);
      if (entry.intro) { const section = el('div', 'greeting-part', ''); section.append(el('p', 'greeting-label', '저를 소개합니다'), el('p', 'greeting-intro', String(entry.intro))); card.append(section); }
      if (entry.message) { const section = el('div', 'greeting-part greeting-letter', ''); section.append(el('p', 'greeting-label', '『뉴런하우스』를 기다리며'), el('p', 'greeting-message', String(entry.message))); card.append(section); }
      board.append(card);
    });
  }
  async function readEntries() {
    const res = await fetch(endpoint + '?action=list&season=18', { signal: AbortSignal.timeout(20000), cache: 'no-store' });
    if (!res.ok) throw new Error('read-failed');
    const data = await res.json();
    if (data.error || !Array.isArray(data.entries)) throw new Error('unexpected-response');
    return data.entries;
  }
  async function loadEntries() {
    refresh.disabled = true;
    try { entries = await readEntries(); render(); }
    catch { if (!entries.length) board.replaceChildren(el('p', 'small', '인사를 불러오지 못했습니다. 잠시 후 새로고침해 주세요. 작성 중인 내용은 그대로 유지됩니다.')); else notice.textContent = '목록을 새로 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'; }
    finally { refresh.disabled = false; }
  }
  function finish() {
    completed = true; pending = null; form.reset();
    button.textContent = '신청 접수 완료'; button.disabled = true;
    status.className = 'success';
    status.textContent = '신청과 인사를 받았습니다. 인사 카드의 연필 버튼과 정하신 비밀번호로 글을 수정·삭제할 수 있습니다. 신청과 입금이 확인되면 참여가 확정됩니다.';
    loadEntries();
  }
  async function confirmPending() {
    try { const data = await post({ action: 'receipt', requestId: pending.requestId, password: pending.password }); if (data.ok) { finish(); return; } } catch {}
    status.className = 'error';
    status.textContent = '아직 접수 결과를 확인하지 못했습니다. 중복 신청을 막기 위해 다시 전송하지 않았습니다. 잠시 후 접수 결과를 확인하거나 카카오톡 채널로 문의해 주세요.';
    button.textContent = '접수 결과 다시 확인';
  }
  refresh.addEventListener('click', loadEntries);
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy || completed) return;
    if (!pending && !form.reportValidity()) return;
    busy = true; button.disabled = true; status.className = ''; status.textContent = '';
    if (pending) { button.textContent = '접수 확인 중…'; await confirmPending(); busy = false; button.disabled = completed; return; }
    const payload = { action: 'add', requestId: uuid(), password: form.elements.password.value };
    for (const key of ['name', 'alias', 'contact', 'intro', 'message']) payload[key] = form.elements[key].value.trim();
    if (['name', 'alias', 'intro', 'message'].some(key => !payload[key])) { status.textContent = '필수 항목에 내용을 적어 주세요.'; status.className = 'error'; busy = false; button.disabled = false; return; }
    pending = payload; button.textContent = '신청을 보내고 있습니다…';
    try {
      const data = await post(payload);
      if (data.ok) finish();
      else { pending = null; status.className = 'error'; status.textContent = messageFor(data); button.textContent = '시즌 18 신청하고 인사 남기기 →'; }
    } catch { await confirmPending(); }
    finally { busy = false; button.disabled = completed; }
  });
  function openEditor(entry, trigger) {
    editing = entry; uncertain = null; focusBeforeEdit = trigger; editor.reset();
    editor.elements.alias.value = entry.alias; editor.elements.intro.value = entry.intro; editor.elements.message.value = entry.message;
    passwordField.hidden = admin; resetField.hidden = !admin;
    editor.elements.password.required = !admin;
    document.querySelector('#greeting-edit-help').textContent = admin ? '공개된 별칭·자기소개·인사말을 수정합니다. 신청자의 이름과 연락처는 그대로 보관됩니다.' : (entry.hasPassword ? '글을 작성할 때 정하신 수정 비밀번호를 입력해 주세요.' : '이전에 작성된 글은 진행자에게 수정 비밀번호를 지정받은 뒤 편집하실 수 있습니다.');
    editStatus.textContent = ''; editStatus.className = '';
    save.textContent = '수정 내용 저장'; save.disabled = false; remove.disabled = false;
    dialog.showModal();
    (!admin ? editor.elements.password : editor.elements.alias).focus();
  }
  function closeEditor() { if (!mutating) dialog.close(); }
  document.querySelectorAll('[data-close-greeting]').forEach(b => b.addEventListener('click', closeEditor));
  dialog.addEventListener('cancel', event => { if (mutating) event.preventDefault(); });
  dialog.addEventListener('close', () => { editor.reset(); editing = null; uncertain = null; focusBeforeEdit?.focus(); });
  function editorBusy(value) {
    mutating = value; save.disabled = value; remove.disabled = value || !!uncertain;
    editor.querySelectorAll('input,textarea,[data-close-greeting]').forEach(n => n.disabled = value);
  }
  async function mutationFinished(data, action) {
    uncertain = null; editorBusy(false); dialog.close();
    await loadEntries();
    notice.textContent = action === 'delete' ? '인사글을 삭제했습니다. 참가 신청 정보는 유지됩니다.' : '인사글을 수정했습니다.';
    notice.className = 'greeting-notice success'; notice.focus();
  }
  async function confirmMutation() {
    const data = await post({ ...uncertain, action: 'mutationStatus' });
    if (data.ok && data.applied) { await mutationFinished(data, uncertain.action); return true; }
    if (!data.ok) editStatus.textContent = messageFor(data);
    else editStatus.textContent = '아직 저장 결과를 확인하지 못했습니다. 잠시 후 다시 확인하거나 창을 닫고 목록을 새로고침해 주세요.';
    return false;
  }
  async function mutate(action) {
    if (mutating || !editing) return;
    if (!uncertain && action === 'update' && !editor.reportValidity()) return;
    if (!uncertain && action === 'delete') {
      if (!admin && !editor.elements.password.reportValidity()) return;
      if (!window.confirm('이 인사글을 삭제하시겠어요? 공개 목록에서 사라집니다. 참가 신청 정보는 유지됩니다.')) return;
    }
    editorBusy(true); editStatus.className = ''; editStatus.textContent = '저장하고 있습니다…';
    try {
      if (uncertain) { await confirmMutation(); return; }
      const payload = { action, id: editing.id, revision: editing.revision, mutationId: uuid(), ...(admin ? { adminToken } : { password: editor.elements.password.value }) };
      if (action === 'update') {
        for (const key of ['alias', 'intro', 'message']) payload[key] = editor.elements[key].value.trim();
        if (admin && editor.elements.newPassword.value) payload.newPassword = editor.elements.newPassword.value;
      }
      uncertain = payload;
      const data = await post(payload);
      if (data.ok) await mutationFinished(data, action);
      else { uncertain = null; editStatus.className = 'error'; editStatus.textContent = messageFor(data); if (data.error === 'admin_expired') { editorBusy(false); dialog.close(); setAdmin('', false); notice.textContent = messageFor(data); } }
    } catch {
      try { if (uncertain && await confirmMutation()) return; } catch {}
      editStatus.className = 'error'; editStatus.textContent = '연결이 끊겨 저장 결과를 확인하지 못했습니다. 입력 내용은 유지했습니다. 결과 확인 버튼을 눌러 주세요.';
    } finally {
      editorBusy(false); save.textContent = uncertain ? '저장 결과 다시 확인' : '수정 내용 저장';
    }
  }
  editor.addEventListener('submit', event => { event.preventDefault(); mutate('update'); });
  remove.addEventListener('click', () => mutate('delete'));
  Promise.all([initAdmin(), loadEntries()]);
})();
