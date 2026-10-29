// Layout solver: nudges design intents to valid poses (terrain fit, world obstacles, each other), then exports
// an event group (vanilla <!--pos--> header + children), the cfgeventspawns <pos>, a .dze and a PNG plan.
// Usage: see example_design.js.
const fs = require('fs');
const { build, render, inPoly } = require('./site');
const { height, bboxClass } = require('./world');

const FLAT = /Carpet[123]$|carpet_|old_mattress|Sleeping_bag|Garbage_GroundSq|Medical_Tarp/i;   // things may sit on these
const FOOT_OVERRIDE = { FireplaceTandoor: { min: [-.6, -.08, -.6], max: [.6, 1.2, .6] } };          // item with a misleading bbox
const rect = (bb, x, z, yaw, shrink = 1, pad = 0) => {
  const t = yaw * Math.PI / 180, ax = [Math.cos(t), -Math.sin(t)], dz = [Math.sin(t), Math.cos(t)];
  const cx = (bb.min[0] + bb.max[0]) / 2, cz = (bb.min[2] + bb.max[2]) / 2, hx = (bb.max[0] - bb.min[0]) / 2 * shrink + pad, hz = (bb.max[2] - bb.min[2]) / 2 * shrink + pad;
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => { const lx = cx + sx * hx, lz = cz + sz * hz; return [x + lx * ax[0] + lz * dz[0], z + lx * ax[1] + lz * dz[1]]; });
};
const samples = (P, step = .5) => { const xs = P.map(p => p[0]), zs = P.map(p => p[1]), out = [...P]; for (let x = Math.min(...xs); x <= Math.max(...xs); x += step) for (let z = Math.min(...zs); z <= Math.max(...zs); z += step) if (inPoly(x, z, P)) out.push([x, z]); return out; };
const overlap = (A, B) => { for (const P of [A, B]) for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], n = [b[1] - a[1], a[0] - b[0]], pa = A.map(p => p[0] * n[0] + p[1] * n[1]), pb = B.map(p => p[0] * n[0] + p[1] * n[1]); if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false; } return true; };
const f3 = v => String(Math.round(v * 1000) / 1000);

class Camp {
  constructor(cx, cz, R) { this.S = build(cx, cz, R, .5); this.items = []; this.log = []; }
  // spec: {cls, x, z, yaw, tent?, j (search radius m), yj (yaw range deg), maxRange?, allowCanopy?, on:[idx], loot:[max,min], sec?, role?}
  eval(spec, x, z, yaw) {
    const bb = FOOT_OVERRIDE[spec.cls] || bboxClass(spec.cls); if (!bb) throw new Error('no bbox/class ' + spec.cls);
    const tent = !!spec.tent, flat = FLAT.test(spec.cls), P = rect(bb, x, z, yaw), Pf = tent ? rect(bb, x, z, yaw, .72) : P;
    for (const [sx, sz] of samples(P)) { const c = this.S.codeAt(sx, sz); if (c >= 2) return { bad: 'world:' + c }; }
    if (tent && !spec.allowCanopy) for (const [sx, sz] of samples(Pf)) if (this.S.codeAt(sx, sz) === 1) return { bad: 'canopy' };
    let mn = Infinity, mx = -Infinity; for (const [sx, sz] of samples(Pf, tent ? 1 : .25)) { const h = height(sx, sz); mn = Math.min(mn, h); mx = Math.max(mx, h); }
    const range = mx - mn; if (range > (spec.maxRange ?? (tent ? .6 : flat ? .12 : .2))) return { bad: 'slope ' + range.toFixed(2) };
    const Pp = rect(bb, x, z, yaw, 1, tent ? .6 : .15);
    for (let k = 0; k < this.items.length; k++) { const o = this.items[k]; if (spec.on && spec.on.includes(k)) continue; if (!tent && !o.tent && FLAT.test(o.cls) !== flat) continue; if (overlap(Pp, o.P)) return { bad: 'overlap ' + o.cls }; }
    const base = tent ? mn : (flat && range < .04 ? mx - .02 : mn + .01);   // never float
    return { P, bb, range, y: base - bb.min[1] };
  }
  add(spec) {
    const j = spec.j ?? 3, yj = spec.yj ?? 20, yaws = [0]; for (let d = 5; d <= yj; d += 5) yaws.push(d, -d);
    let best = null, lastBad = '';
    for (let r = 0; r <= j + 1e-9; r += .5) {
      if (best && r * r > best.score) break;
      const n = r === 0 ? 1 : Math.max(6, Math.round(2 * Math.PI * r / .5));
      for (let q = 0; q < n; q++) { const x = spec.x + r * Math.cos(2 * Math.PI * q / n), z = spec.z + r * Math.sin(2 * Math.PI * q / n);
        for (const dy of yaws) { const e = this.eval(spec, x, z, spec.yaw + dy); if (e.bad) { lastBad = e.bad; continue; }
          const score = r * r + (dy / 10) ** 2 + e.range * (spec.tent ? 20 : 4); if (!best || score < best.score) best = Object.assign(e, { x, z, yaw: spec.yaw + dy, score, moved: r, dyaw: dy }); } }
    }
    if (!best) { this.log.push(`FAILED ${spec.cls} near ${spec.x},${spec.z}: ${lastBad}`); return -1; }
    this.items.push(Object.assign({}, spec, best, { yaw: ((best.yaw + 540) % 360) - 180 })); return this.items.length - 1;
  }
  report() { return this.items.map((o, i) => `${String(i).padStart(2)} ${o.cls.padEnd(40)} ${o.x.toFixed(2)},${o.z.toFixed(2)} yaw ${o.yaw.toFixed(0)} y ${o.y.toFixed(3)} range ${o.range.toFixed(2)} moved ${o.moved.toFixed(1)}m/${o.dyaw}deg ${o.role || ''}`).concat(this.log).join('\n'); }
  render(file) { render(this.S, file, this.items.map(o => ({ P: o.P, col: o.tent ? [20, 40, 200] : FLAT.test(o.cls) ? [200, 120, 20] : [200, 20, 160] }))); }
  // event group XML (first item = anchor) with the vanilla header, and the matching cfgeventspawns pos line
  toEventGroup(group) {
    const A = this.items[0], pos = `x="${f3(A.x)}" z="${f3(A.z)}" a="0" y="${f3(A.y)}"`;
    const kids = this.items.map(o => `        <child ${o.sec ? '' : 'spawnsecondary="false" '}type="${o.cls}" deloot="1" lootmax="${o.loot ? o.loot[0] : 0}" lootmin="${o.loot ? o.loot[1] : 0}" x="${f3(o.x - A.x)}" z="${f3(o.z - A.z)}" a="${Math.round(o.yaw)}" y="${f3(o.y - A.y)}"/>`);
    return { groupXml: `    <!--pos ${pos} group="${group}"/-->\n    <group name="${group}">\n${kids.join('\n')}\n    </group>\n`, posXml: `\t\t<pos ${pos} group="${group}"/>\n` };
  }
  toDze(file, mapName = 'ChernarusPlus') {
    const A = this.items[0];
    fs.writeFileSync(file, JSON.stringify({ MapName: mapName, AuthorId: '', CreditIds: [], CameraPosition: [A.x, A.y + 45, A.z - 40],
      EditorObjects: this.items.map(o => ({ Type: o.cls, DisplayName: o.cls, Position: [+o.x.toFixed(3), +o.y.toFixed(4), +o.z.toFixed(3)], Orientation: [Math.round(o.yaw), 0, 0], Scale: 1, AttachmentMap: {}, Model: '', Flags: 30 })),
      EditorHiddenObjects: [], CameraTracks: [] }, null, 4));
  }
}
module.exports = { Camp, rect, samples, overlap, FLAT };
