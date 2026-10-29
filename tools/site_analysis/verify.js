// Verify installed event groups by reading the mission XML back: references, classes, loot tables, terrain fit,
// world collisions, road/rail clearance, overlaps. CLI: node verify.js <GroupName> [...]   Exit code 1 on errors.
const fs = require('fs'); const path = require('path'); const { MISSION } = require('./lib');
const { build, segDist } = require('./site'); const { height, cls, bboxClass } = require('./world'); const { rect, samples, overlap, FLAT } = require('./layout');
const rd = f => fs.readFileSync(path.join(MISSION, f), 'utf8');
const G = rd('cfgeventgroups.xml'), SP = rd('cfgeventspawns.xml'), EV = rd('db/events.xml'), TY = rd('db/types.xml'), PR = rd('mapgroupproto.xml');
const FOOT = { FireplaceTandoor: { min: [-.6, -.08, -.6], max: [.6, 1.2, .6] } };
let errors = 0, warns = 0; const E = m => { errors++; console.log('ERROR', m); }, W = m => { warns++; console.log('WARN ', m); };
for (const name of process.argv.slice(2)) {
  const gm = G.match(new RegExp(`(<!--pos ([^>]*)-->\\s*)?<group name="${name}">([\\s\\S]*?)</group>`)); if (!gm) { E(`no group ${name}`); continue; }
  const ev = [...SP.matchAll(/<event name="([^"]+)"\s*(?:\/>|>([\s\S]*?)<\/event>)/g)].find(m => (m[2] || '').includes(`group="${name}"`)); if (!ev) { E(`${name}: no <pos group="${name}"> in cfgeventspawns.xml`); continue; }
  const pm = ev[2].match(new RegExp(`<pos x="([-\\d.]+)" z="([-\\d.]+)" a="([-\\d.]+)" y="([-\\d.]+)" group="${name}"`)); if (!pm) { E(`${name}: pos needs x z a y attributes`); continue; }
  if (pm[3] !== '0') E(`${name}: pos a must be 0`);
  if (!gm[1]) W(`${name}: missing vanilla <!--pos .../--> header above the group`); else if (!gm[2].includes(`x="${pm[1]}" z="${pm[2]}"`)) W(`${name}: header does not match the pos line`);
  const em = EV.match(new RegExp(`<event name="${ev[1]}">([\\s\\S]*?)</event>`)); if (!em) E(`${name}: event ${ev[1]} missing from db/events.xml`);
  else { const sec = (em[1].match(/<secondary>([^<]+)</) || [])[1]; if (sec && !EV.includes(`<event name="${sec}">`)) E(`${ev[1]}: secondary ${sec} not defined`);
    const nominal = +(em[1].match(/<nominal>(\d+)/) || [])[1], dr = +(em[1].match(/<distanceradius>(\d+)/) || [])[1], npos = (ev[2].match(/<pos /g) || []).length;
    if (nominal > npos) W(`${ev[1]}: nominal ${nominal} > ${npos} positions`); if (nominal > 1 && !dr) E(`${ev[1]}: nominal > 1 with distanceradius 0 can stack instances`); }
  const AX = +pm[1], AZ = +pm[2], AY = +pm[4];
  const kids = [...gm[3].matchAll(/<child ([^>]*)\/>/g)].map(m => Object.fromEntries([...m[1].matchAll(/(\w+)="([^"]*)"/g)].map(k => [k[1], k[2]])));
  const items = [];
  for (const k of kids) {
    const c = cls(k.type); if (!c || c.name !== k.type) { E(`${name}: class ${k.type} ${c ? 'has wrong case (' + c.name + ')' : 'not in game'}`); continue; }
    if (+k.lootmax > 0) { const pg = PR.match(new RegExp(`<group name="${k.type}"[^>]*lootmax="(\\d+)">([\\s\\S]*?)</group>`)); if (!pg) E(`${name}: ${k.type} has loot but no case-exact mapgroupproto group`);
      else { const caps = [...pg[2].matchAll(/<container name="[^"]+"( lootmax="(\d+)")?/g)].reduce((s, m) => s + (m[2] ? +m[2] : 4), 0); if (+k.lootmax > caps) E(`${name}: ${k.type} lootmax ${k.lootmax} > container total ${caps} (no container lootmax = 4)`); } }
    if (c.scope === 2 && !/_DE$/.test(k.type) && !TY.includes(`<type name="${k.type}">`)) E(`${name}: spawnable ${k.type} missing from types.xml`);
    items.push({ cls: k.type, x: AX + +k.x, z: AZ + +k.z, y: AY + +(k.y || 0), yaw: +k.a, bb: FOOT[k.type] || bboxClass(k.type), tent: /^Land_TradTent/.test(k.type) });
  }
  if (!items.length) continue;
  const cx = items.reduce((s, o) => s + o.x, 0) / items.length, cz = items.reduce((s, o) => s + o.z, 0) / items.length, R = Math.max(...items.map(o => Math.hypot(o.x - cx, o.z - cz))) + 25, S = build(cx, cz, R, .5);
  let maxFloat = 0, minRoad = 1e9, minRail = 1e9; const segs = S.feats.filter(f => f.k === 'road' || f.k === 'rail');
  items.forEach((o, i) => {
    if (!o.bb) return; const P = o.P = rect(o.bb, o.x, o.z, o.yaw), Pf = o.tent ? rect(o.bb, o.x, o.z, o.yaw, .72) : P;
    for (const [sx, sz] of samples(P)) { const c = S.codeAt(sx, sz); if (c >= 2) { E(`${name}: ${o.cls} hits world obstacle code ${c} at ${sx.toFixed(1)},${sz.toFixed(1)}`); break; } }
    const hs = samples(Pf).map(([sx, sz]) => height(sx, sz)), fl = o.y + o.bb.min[1] - Math.min(...hs); maxFloat = Math.max(maxFloat, fl); if (fl > .05) W(`${name}: ${o.cls} floats ${fl.toFixed(2)} m`);
    if (o.tent && Math.max(...hs) - Math.min(...hs) > .6) W(`${name}: ${o.cls} floor height range ${(Math.max(...hs) - Math.min(...hs)).toFixed(2)} m`);
    for (let j = 0; j < i; j++) { const q = items[j]; if (!q.P || (!o.tent && !q.tent && FLAT.test(o.cls) !== FLAT.test(q.cls))) continue; if (overlap(P, q.P)) W(`${name}: ${o.cls} overlaps ${q.cls}`); }
    for (const [sx, sz] of samples(P, 1)) for (const s of segs) { const d = segDist(sx, sz, s.a, s.b); if (s.k === 'road') minRoad = Math.min(minRoad, d); else minRail = Math.min(minRail, d); }
  });
  if (minRoad < 8) E(`${name}: object ${minRoad.toFixed(1)} m from a road centre line`); if (minRail < 7) E(`${name}: object ${minRail.toFixed(1)} m from a rail line`);
  console.log(`${name}: event ${ev[1]}, ${items.length} objects, max float ${maxFloat.toFixed(3)} m, nearest road ${minRoad > 1e8 ? '>' + Math.round(R) : minRoad.toFixed(1)} m, rail ${minRail > 1e8 ? '>' + Math.round(R) : minRail.toFixed(1)} m`);
}
console.log(`${errors} errors, ${warns} warnings`); process.exit(errors ? 1 : 0);
