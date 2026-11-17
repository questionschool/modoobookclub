'use strict';
// Pure calculations: persisted attendance only, never the unsaved editor or reading plan.
function season18Statistics(records, members, today, target = 388) {
 if(!Number.isInteger(target) || target < 1 || target > 10000) target = 388;
 const days = [...new Map(records.filter(r => r.date >= '2026-11-02' && r.date <= '2026-11-30' && r.date <= today).map(r => [r.date, r])).values()].sort((a,b) => a.date.localeCompare(b.date));
 const names = new Set(members);
 days.forEach(r => (r.present || []).forEach(n => names.add(n)));
 const ranking = [...names].map(name => {
  const dates = days.filter(r => (r.present || []).includes(name)).map(r => r.date);
  return {name, dates, rate: days.length ? dates.length / days.length * 100 : null};
 }).sort((a,b) => b.dates.length - a.dates.length || a.name.localeCompare(b.name, 'ko'));
 const validPage = n => Number.isInteger(n) && n > 0 && n <= 10000;
 const endpoints = days.filter(r => validPage(r.page_end) && (r.page_start == null || validPage(r.page_start) && r.page_start <= r.page_end));
 const current = endpoints.length ? Math.max(...endpoints.map(r => r.page_end)) : null;
 const samples = days.filter(r => validPage(r.page_start) && validPage(r.page_end) && r.page_end >= r.page_start).slice(-5);
 const average = samples.length ? samples.reduce((sum,r) => sum + r.page_end - r.page_start + 1, 0) / samples.length : null;
 const remaining = current === null ? null : Math.max(0, target - current);
 const sessions = remaining === 0 ? 0 : samples.length >= 2 ? Math.ceil(remaining / average) : null;
 let finish = null;
 if(sessions !== null && remaining !== null && sessions > 0) {
  const date = new Date(today + 'T12:00:00Z');
  let left = sessions;
  while(left > 0) { date.setUTCDate(date.getUTCDate()+1); if(date.getUTCDay() !== 0 && date.getUTCDay() !== 6) left--; }
  finish = date.toISOString().slice(0,10);
 }
 return {days, ranking, current, samples, average, remaining, sessions, finish, latest: endpoints.at(-1)?.date};
}
if(typeof module !== 'undefined') module.exports = {season18Statistics};
