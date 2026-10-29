// Site raster (terrain, slope, obstacle footprints, road/rail corridors), PNG maps and flat-patch finder.
// CLI: node site.js map <x> <z> <radius> <out.png> [res=0.5]
//      node site.js patches <x> <z> <radius> <out.png> [floorRadius=5] [maxRange=0.6]
const fs = require('fs'); const zlib = require('zlib');
const { query, kind, yawOf, height, bboxModel, navRegion } = require('./world');

const footprint = (o, bb, shrink = 1) => {
  const ax = [o.r[0], o.r[2]], dz = [o.r[6], o.r[8]], cx = (bb.min[0] + bb.max[0]) / 2, cz = (bb.min[2] + bb.max[2]) / 2;
  const hx = (bb.max[0] - bb.min[0]) / 2 * shrink, hz = (bb.max[2] - bb.min[2]) / 2 * shrink;
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => { const lx = cx + sx * hx, lz = cz + sz * hz; return [o.x + lx * ax[0] + lz * dz[0], o.z + lx * ax[1] + lz * dz[1]]; });
};
const inPoly = (px, pz, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > pz) !== (P[j][1] > pz) && px < (P[j][0] - P[i][0]) * (pz - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
const segDist = (px, pz, a, b) => { const vx = b[0] - a[0], vz = b[1] - a[1], L = vx * vx + vz * vz; const t = L ? Math.max(0, Math.min(1, ((px - a[0]) * vx + (pz - a[1]) * vz) / L)) : 0; return Math.hypot(px - a[0] - t * vx, pz - a[1] - t * vz); };

// codes: 0 free, 1 canopy (soft), 2 bush, 3 trunk, 4 rock, 5 wall, 6 structure, 7 road corridor, 8 road surface, 9 rail corridor, 10 water
function build(cx, cz, R, res = 0.5, { roadBuf = 8, railBuf = 7 } = {}) {
  const x0 = cx - R, z0 = cz - R, W = Math.ceil(2 * R / res), H = W, code = new Uint8Array(W * H), h = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) h[j * W + i] = height(x0 + (i + .5) * res, z0 + (j + .5) * res);
  const box = (xs, zs, pad) => [Math.max(0, Math.floor((Math.min(...xs) - pad - x0) / res)), Math.min(W - 1, Math.ceil((Math.max(...xs) + pad - x0) / res)), Math.max(0, Math.floor((Math.min(...zs) - pad - z0) / res)), Math.min(H - 1, Math.ceil((Math.max(...zs) + pad - z0) / res))];
  const fill = (bx, c, test) => { for (let j = bx[2]; j <= bx[3]; j++) for (let i = bx[0]; i <= bx[1]; i++) { const k = j * W + i; if (code[k] < c && test(x0 + (i + .5) * res, z0 + (j + .5) * res)) code[k] = c; } };
  const feats = [];
  for (const o of query(x0 - 40, z0 - 40, x0 + 2 * R + 40, z0 + 2 * R + 40)) {
    const kd = kind(o.model);
    if (kd === 'clutter' || /power_wire|power_hv_line|wire_|_wire|decal|sidewalk|lamp_rail|rail_polet|hiddenpath|path_rock/.test(o.model)) continue;
    const bb = bboxModel(o.model); if (!bb) continue;
    if (kd === 'tree') {
      const can = Math.min(bb.max[0] - bb.min[0], bb.max[2] - bb.min[2]) / 2 * Math.hypot(o.r[0], o.r[2]), rc = Math.max(1.5, can * .55);
      fill(box([o.x], [o.z], rc), 1, (x, z) => Math.hypot(x - o.x, z - o.z) <= rc); fill(box([o.x], [o.z], .9), 3, (x, z) => Math.hypot(x - o.x, z - o.z) <= .9);
      feats.push({ k: 'tree', x: o.x, z: o.z, r: can, m: o.model });
    } else if (kd === 'road' || kd === 'rail') {
      const n = Math.hypot(o.r[6], o.r[8]), u = [o.r[6] / n, o.r[8] / n];
      const a = [o.x + bb.min[2] * u[0], o.z + bb.min[2] * u[1]], b = [o.x + bb.max[2] * u[0], o.z + bb.max[2] * u[1]], buf = kd === 'road' ? roadBuf : railBuf;
      fill(box([a[0], b[0]], [a[1], b[1]], buf), kd === 'road' ? 7 : 9, (x, z) => segDist(x, z, a, b) <= buf);
      if (kd === 'road') { const P = footprint(o, bb); fill(box(P.map(p => p[0]), P.map(p => p[1]), 0), 8, (x, z) => inPoly(x, z, P)); }
      feats.push({ k: kd, a, b, m: o.model });
    } else if (kd === 'water') {
      feats.push({ k: 'water', x: o.x, z: o.z, m: o.model });   // stream/pond boxes are far wider than the water: use the navmesh below
    } else {
      const c = { bush: 2, rock: 4, wall: 5 }[kd] || 6, P = footprint(o, bb, kd === 'bush' ? .6 : 1);
      fill(box(P.map(p => p[0]), P.map(p => p[1]), 0), c, (x, z) => inPoly(x, z, P));
      feats.push({ k: kd, x: o.x, z: o.z, yaw: yawOf(o), P, m: o.model, size: [0, 1, 2].map(i => bb.max[i] - bb.min[i]) });
    }
  }
  const nav = navRegion(x0, z0, x0 + W * res, z0 + H * res, res);   // real water surfaces (navmesh area 5: sea, rivers, ponds)
  for (let k = 0; k < W * H; k++) if (nav.area[k] === 5) code[k] = 10;
  const slope = new Float32Array(W * H);
  for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) { const k = j * W + i; slope[k] = Math.hypot((h[k + 1] - h[k - 1]) / (2 * res), (h[k + W] - h[k - W]) / (2 * res)); }
  const codeAt = (x, z) => { const i = Math.floor((x - x0) / res), j = Math.floor((z - z0) / res); return i < 0 || j < 0 || i >= W || j >= H ? 255 : code[j * W + i]; };
  return { x0, z0, res, W, H, code, h, slope, feats, codeAt };
}

function png(file, W, H, rgb) {
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) rgb.copy(raw, y * (W * 3 + 1) + 1, (H - 1 - y) * W * 3, (H - y) * W * 3);   // north up
  const T = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
  const crc = b => { let x = 0xffffffff; for (const v of b) x = T[(x ^ v) & 255] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 2;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
const COL = { 1: [70, 130, 60], 2: [40, 100, 40], 3: [20, 60, 20], 4: [120, 120, 120], 5: [150, 90, 50], 6: [200, 60, 60], 7: [230, 200, 120], 8: [120, 100, 80], 9: [180, 120, 220], 10: [60, 120, 220], 11: [40, 220, 90] };
// slope: <4% pale, 4-7% yellow, 7-12% orange, >12% red-brown; black grid every 50 m; outlines: [{P, col}]
function render(S, file, outlines = [], highlight = null) {
  const { W, H } = S, rgb = Buffer.alloc(W * H * 3);
  for (let k = 0; k < W * H; k++) {
    const i = k % W, j = (k / W) | 0, s = S.slope[k];
    let c = s < .04 ? [235, 240, 225] : s < .07 ? [240, 225, 150] : s < .12 ? [235, 180, 110] : [190, 120, 100];
    const cd = highlight && highlight[k] ? 11 : S.code[k];
    if (cd) { const a = [1, 7, 9].includes(cd) ? .45 : .9; c = c.map((v, q) => v * (1 - a) + COL[cd][q] * a); }
    if ((i && Math.floor(S.h[k]) !== Math.floor(S.h[k - 1])) || (j && Math.floor(S.h[k]) !== Math.floor(S.h[k - W]))) c = c.map(v => v * .8);
    const wx = S.x0 + i * S.res, wz = S.z0 + j * S.res; if (Math.abs(wx % 50) < S.res * .6 || Math.abs(wz % 50) < S.res * .6) c = [0, 0, 0];
    rgb[k * 3] = c[0]; rgb[k * 3 + 1] = c[1]; rgb[k * 3 + 2] = c[2];
  }
  for (const { P, col = [20, 40, 200] } of outlines) for (let e = 0; e < P.length; e++) {
    const a = P[e], b = P[(e + 1) % P.length], n = Math.max(1, Math.hypot(b[0] - a[0], b[1] - a[1]) / (S.res / 2));
    for (let s = 0; s <= n; s++) { const i = Math.floor((a[0] + (b[0] - a[0]) * s / n - S.x0) / S.res), j = Math.floor((a[1] + (b[1] - a[1]) * s / n - S.z0) / S.res); if (i >= 0 && j >= 0 && i < W && j < H) col.forEach((v, q) => { rgb[(j * W + i) * 3 + q] = v; }); }
  }
  png(file, W, H, rgb);
}

// flat, clear patches: every cell with no hard obstacle within `rad` m and terrain range <= maxRange
function patches(S, rad = 5, maxRange = .6) {
  const { W, H, code, h, res } = S, ok = new Uint8Array(W * H), rr = Math.round(rad / res);
  for (let j = rr; j < H - rr; j++) for (let i = rr; i < W - rr; i++) {
    if (code[j * W + i] >= 2) continue; let mn = Infinity, mx = -Infinity, bad = false;
    for (let dj = -rr; dj <= rr && !bad; dj++) for (let di = -rr; di <= rr; di++) { if (di * di + dj * dj > rr * rr) continue; const q = (j + dj) * W + i + di; if (code[q] >= 2) { bad = true; break; } mn = Math.min(mn, h[q]); mx = Math.max(mx, h[q]); }
    if (!bad && mx - mn <= maxRange) ok[j * W + i] = 1;
  }
  const lab = new Int32Array(W * H).fill(-1), comps = [], trees = S.feats.filter(f => f.k === 'tree'), roads = S.feats.filter(f => f.k === 'road');
  for (let k = 0; k < W * H; k++) if (ok[k] && lab[k] < 0) {
    const st = [k]; lab[k] = comps.length; let n = 0, sx = 0, sz = 0;
    while (st.length) { const q = st.pop(), i = q % W, j = (q / W) | 0; n++; sx += i; sz += j; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const r = (j + b) * W + i + a; if (i + a >= 0 && i + a < W && j + b >= 0 && j + b < H && ok[r] && lab[r] < 0) { lab[r] = comps.length; st.push(r); } } }
    const x = S.x0 + (sx / n + .5) * res, z = S.z0 + (sz / n + .5) * res;
    comps.push({ x: Math.round(x), z: Math.round(z), areaM2: Math.round(n * res * res), trees30m: trees.filter(t => Math.hypot(t.x - x, t.z - z) < 30).length, roadDist: Math.round(Math.min(9999, ...roads.map(r => segDist(x, z, r.a, r.b)))), h: +height(x, z).toFixed(1) });
  }
  return { ok, list: comps.filter(c => c.areaM2 >= 30).sort((a, b) => b.areaM2 - a.areaM2) };
}

module.exports = { build, render, patches, footprint, inPoly, segDist, png };
if (require.main === module) {
  const [mode, x, z, R, out, a, b] = process.argv.slice(2);
  if (mode === 'map') {
    const S = build(+x, +z, +R, +(a || .5)); render(S, out);
    for (const f of S.feats.filter(f => f.k === 'struct' || f.k === 'wall')) console.log(f.m.split('/').pop(), f.x.toFixed(1), f.z.toFixed(1), 'yaw', f.yaw.toFixed(0), 'size', f.size.map(v => v.toFixed(1)).join('x'));
  } else if (mode === 'patches') {
    const S = build(+x, +z, +R, 1), P = patches(S, +(a || 5), +(b || .6)); render(S, out, [], P.ok); console.log(JSON.stringify(P.list.slice(0, 30), null, 0).split('},{').join('},\n{'));
  } else console.log('usage: node site.js map|patches <x> <z> <radius> <out.png> [...]');
}
