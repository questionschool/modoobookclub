(() => {
  const form = document.querySelector('#season18-form');
  if (!form) return;
  const endpoint = 'https://script.google.com/macros/s/AKfycbw1rjT7UzjWMMea5UdmD8AxwDLsVNjMH-bdnKLxlJNPaa15xTT80yZlRuTBEthoX3rIbA/exec';
  const status = document.querySelector('#signup-status');
  const button = document.querySelector('#signup-submit');
  const board = document.querySelector('#season18-greetings');
  const refresh = document.querySelector('#greetings-refresh');
  let pending = null;
  let busy = false;
  let completed = false;
  const el = (tag, cls, text) => { const n = document.createElement(tag); n.className = cls; n.textContent = text; return n; };
  const render = entries => {
    board.replaceChildren();
    if (!entries.length) { board.append(el('p', 'greeting-empty', '아직 남겨진 인사가 없습니다. 첫 번째 인사를 남겨 주세요.')); return; }
    entries.forEach(entry => {
      const card = el('article', 'greeting-entry', '');
      card.append(el('h4', '', String(entry.alias || '참가자')));
      if (entry.intro) card.append(el('p', 'greeting-intro', String(entry.intro)));
      if (entry.message) card.append(el('p', 'greeting-message', String(entry.message)));
      // Only the public introduction fields are rendered, never name or contact.
      board.append(card);
    });
  };
  async function readEntries() {
    const res = await fetch(endpoint + '?action=list&season=18', { signal: AbortSignal.timeout(20000), cache: 'no-store' });
    if (!res.ok) throw new Error('read-failed');
    const data = await res.json();
    if (!Array.isArray(data.entries)) throw new Error('unexpected-response');
    return data.entries;
  }
  async function loadEntries() {
    refresh.disabled = true;
    try { render(await readEntries()); }
    catch { board.replaceChildren(el('p', 'small', '인사를 불러오지 못했습니다. 잠시 후 새로고침해 주세요. 작성 중인 신청서는 그대로 유지됩니다.')); }
    finally { refresh.disabled = false; }
  }
  function finish() {
    completed = true;
    pending = null;
    form.reset();
    button.textContent = '신청 접수 완료';
    button.disabled = true;
    status.className = 'success';
    status.textContent = '신청과 인사를 받았습니다. 아래 참가비·채팅방 안내를 확인해 주세요. 신청과 입금이 확인되면 참여가 확정됩니다.';
    loadEntries();
  }
  async function confirmPending() {
    try {
      const entries = await readEntries();
      render(entries);
      const match = entries.some(e => String(e.alias).trim() === pending.alias && String(e.intro).trim() === pending.intro && String(e.message).trim() === pending.message);
      if (match) { finish(); return true; }
    } catch { /* Preserve the uncertain result and all input; do not resubmit. */ }
    status.className = 'error';
    status.textContent = '아직 접수 결과를 확인하지 못했습니다. 중복 신청을 막기 위해 다시 전송하지 않았습니다. 잠시 후 접수 결과를 확인하거나 카카오톡 채널로 문의해 주세요. 입력 내용은 그대로 남아 있습니다.';
    button.textContent = '접수 결과 다시 확인';
    return false;
  }
  refresh.addEventListener('click', loadEntries);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || completed) return;
    if (!pending && !form.reportValidity()) return;
    busy = true; button.disabled = true; status.className = ''; status.textContent = '';
    if (pending) {
      button.textContent = '접수 확인 중…';
      await confirmPending();
      busy = false; button.disabled = completed;
      return;
    }
    const payload = { action: 'add', season: 18 };
    for (const key of ['name', 'alias', 'contact', 'intro', 'message']) payload[key] = form.elements[key].value.trim();
    if (['name', 'alias', 'intro', 'message'].some(key => !payload[key])) {
      status.textContent = '필수 항목에 내용을 적어 주세요.';
      status.className = 'error'; busy = false; button.disabled = false; return;
    }
    pending = payload;
    button.textContent = '신청을 보내고 있습니다…';
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error('unconfirmed');
      const data = await res.json();
      if (data.ok === true) finish();
      else if (data.ok === false || data.error) {
        pending = null;
        status.className = 'error';
        status.textContent = '신청이 접수되지 않았습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요. 계속 문제가 있으면 카카오톡 채널로 문의해 주세요.';
        button.textContent = '시즌 18 신청하고 인사 남기기 →';
      } else throw new Error('unconfirmed');
    } catch { await confirmPending(); }
    finally { busy = false; button.disabled = completed; }
  });
  loadEntries();
})();
