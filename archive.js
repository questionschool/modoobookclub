(() => {
  function openHash() {
    const id = location.hash.slice(1);
    if (!/^season-\d{2}$/.test(id)) return;
    const row = document.getElementById(id);
    const details = row?.querySelector('.season-details');
    if (details) { details.open = true; row.scrollIntoView({block: 'start'}); }
  }
  window.addEventListener('hashchange', openHash);
  openHash();
})();
