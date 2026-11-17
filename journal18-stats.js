'use strict';
// Pure calculations: persisted attendance only, never the unsaved editor or reading plan.
function season18Statistics(records, members, today, target = 388, first = 1) {
 if(!Number.isInteger(target) || target < 1 || target > 10000) target = 388;
 const days = [...new Map(records.filter(r => r.date >= '2026-11-02' && r.date <= '2026-11-30' && r.date <= today).map(r => [r.date, r])).values()].sort((a,b) => a.date.localeCompare(b.date));
 const names = new Set(members);
 days.forEach(r => (r.present || []).forEach(n => names.add(n)));
 const ranking = [...names].map(name => {
  const dates = days.filter(r => (r.present || []).includes(name)).map(r => r.date);
  return {name, dates, rate: days.length ? dates.length / days.length * 100 : null};
 }).sort((a,b) => b.dates.length - a.dates.length || a.name.localeCompare(b.name, 'ko'));
 const validPage = n => Number.isInteger(n) && n > 0 && n <= 10000;
 if(!Number.isInteger(first) || first < 1 || first > target) first = 1;
 const read = new Set(), sessionsRead = [];
 const valid = days.filter(r => validPage(r.page_start) && validPage(r.page_end) && r.page_end >= r.page_start);
 for(const record of valid) {
  const start = Math.max(first, record.page_start), end = Math.min(target, record.page_end);
  if(start > end) continue;
  let newPages = 0;
  for(let page = start; page <= end; page++) { if(!read.has(page)) newPages++; read.add(page); }
  sessionsRead.push({...record, newPages});
 }
 const unread = [];
 for(let page = first; page <= target; page++) {
  if(read.has(page)) continue;
  const last = unread.at(-1);
  if(last && last[1] === page - 1) last[1] = page;
  else unread.push([page,page]);
 }
 const total = target - first + 1;
 const current = valid.length ? read.size : null;
 const remaining = current === null ? null : total - read.size;
 const samples = sessionsRead.slice(-5);
 const average = samples.length ? samples.reduce((sum,r) => sum + r.newPages, 0) / samples.length : null;
 const sessions = remaining === 0 ? 0 : remaining !== null && samples.length >= 2 && average > 0 ? Math.ceil(remaining / average) : null;
 let finish = null;
 if(sessions !== null && remaining !== null && sessions > 0) {
  const date = new Date(today + 'T12:00:00Z');
  let left = sessions;
  while(left > 0) { date.setUTCDate(date.getUTCDate()+1); if(date.getUTCDay() !== 0 && date.getUTCDay() !== 6) left--; }
  finish = date.toISOString().slice(0,10);
 }
 return {days, ranking, current, samples, average, remaining, sessions, finish, latest: valid.at(-1)?.date, first, total, unread, incomplete: days.filter(r => (r.page_start != null || r.page_end != null) && !valid.includes(r)).length};
}
if(typeof module !== 'undefined') module.exports = {season18Statistics};
