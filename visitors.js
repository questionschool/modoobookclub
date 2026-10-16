(() => {
  const widget = document.querySelector('[data-visitor-counter]');
  if (!widget) return;
  const page = /welcome_18(?:\.html|\/)?$/.test(location.pathname) ? 'season18' : 'home';
  const endpoint = 'https://script.google.com/macros/s/AKfycbw1rjT7UzjWMMea5UdmD8AxwDLsVNjMH-bdnKLxlJNPaa15xTT80yZlRuTBEthoX3rIbA/exec';
  const total = widget.querySelector('[data-visitor-total]');
  const daily = widget.querySelector('[data-visitor-daily]');
  const status = widget.querySelector('.visitor-status');
  function render(data) {
    if (data.ok !== true || data.page !== page || !Number.isSafeInteger(data.total) || !Number.isSafeInteger(data.daily)) throw new Error('invalid-counter');
    total.textContent = data.total.toLocaleString('ko-KR');
    daily.textContent = data.daily.toLocaleString('ko-KR');
  }
  async function load() {
    let visitorId;
    try {
      visitorId = localStorage.getItem('bookclub-visitor-id-v1');
      if (!/^[a-zA-Z0-9-]{20,80}$/.test(visitorId || '')) {
        visitorId = crypto.randomUUID();
        localStorage.setItem('bookclub-visitor-id-v1', visitorId);
      }
    } catch { /* Storage unavailable: show shared statistics without inflating visits. */ }
    try {
      const options = {cache:'no-store', signal:AbortSignal.timeout(20000)};
      let url = endpoint + '?action=visitorStats&page=' + page;
      if (visitorId) {
        url = endpoint;
        Object.assign(options, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({action:'visit', page, visitorId})});
      }
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('unavailable');
      render(await response.json());
    } catch { status.textContent = '방문자 수를 잠시 불러올 수 없습니다.'; }
  }
  load();
})();
