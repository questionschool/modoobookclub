const assert = require('node:assert/strict');
const {season18Statistics: stats} = require('../journal18-stats.js');
const r = (date, present, start, end) => ({date,present,page_start:start,page_end:end});
const records=[r('2026-11-02',['가','가','나'],1,10),r('2026-11-03',['가'],11,20),r('2026-11-20',['나'],21,100),r('2026-10-30',['나'],1,90)];
let s=stats(records,['가','나','다'],'2026-11-06',50);
assert.equal(s.days.length,2);assert.equal(s.ranking[0].name,'가');assert.equal(s.ranking[0].rate,100);assert.equal(s.ranking[1].rate,50);assert.equal(s.ranking[2].rate,0);
assert.equal(s.average,10);assert.equal(s.sessions,3);assert.equal(s.finish,'2026-11-11'); // skips weekend
assert.equal(stats([],['가'],'2026-11-06').ranking[0].rate,null);
assert.equal(stats([records[0]],[],'2026-11-06').sessions,null);
assert.equal(stats(records,[],'2026-11-06',20).sessions,0);
assert.equal(stats(records,[],'2026-11-06',10).remaining,0);
assert.equal(stats([r('2026-11-02',[],null,40)],[],'2026-11-06').current,40);
assert.equal(stats([r('2026-11-02',[],50,40)],[],'2026-11-06').current,null);
assert.equal(stats([r('2026-11-02',[],null,null)],[],'2026-11-06').current,null);
assert.equal(stats([records[0],r('2026-11-02',['나'],1,15)],[],'2026-11-06').days.length,1);
assert.equal(stats(records,[],'2026-11-06',Infinity).remaining,368);
const six=Array.from({length:6},(_,i)=>r('2026-11-'+String(i+2).padStart(2,'0'),[],1,i+1));
assert.equal(stats(six,[],'2026-11-10').average,4);
console.log('PASS: attendance denominator, duplicates, ordering, future/season filtering, empty/missing/invalid pages, recent five, completion, weekday forecast, invalid target');
