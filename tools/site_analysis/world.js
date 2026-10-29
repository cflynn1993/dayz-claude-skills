// Cached map data: terrain height, WRP objects, navmesh raster, bounding boxes, towns. Run prepare.js first.
const fs = require('fs');
const { cachePath, readPbo, odolBBox } = require('./lib');
const load = f => { if (!fs.existsSync(cachePath(f))) throw new Error(`missing cache ${f}: run node prepare.js`); return fs.readFileSync(cachePath(f)); };
const BS = String.fromCharCode(92);
const meta = JSON.parse(load('meta.json'));

// ---- terrain (exact heightmap, row = z, triangle interpolation)
const elev = load('elev.bin'); const G = meta.grid, C = meta.cell;
const g = (ix, iz) => elev.readFloatLE((Math.min(G - 1, Math.max(0, iz)) * G + Math.min(G - 1, Math.max(0, ix))) * 4);
function height(x, z) {
  const fx = x / C, fz = z / C, ix = Math.floor(fx), iz = Math.floor(fz), u = fx - ix, v = fz - iz;
  const h00 = g(ix, iz), h10 = g(ix + 1, iz), h01 = g(ix, iz + 1), h11 = g(ix + 1, iz + 1);
  return u >= v ? h00 + (h10 - h00) * u + (h11 - h10) * v : h00 + (h01 - h00) * v + (h11 - h01) * u;
}

// ---- WRP objects
let ob, models;
function query(x0, z0, x1, z1) {
  ob = ob || load('objects.bin'); models = models || JSON.parse(load('models.json')).map(m => m.split(BS).join('/').toLowerCase());
  const out = [];
  for (let q = 0; q < ob.length; q += 56) {
    const x = ob.readFloatLE(q + 44), z = ob.readFloatLE(q + 52); if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    const r = []; for (let j = 0; j < 9; j++) r.push(ob.readFloatLE(q + 8 + j * 4));
    out.push({ model: models[ob.readUInt32LE(q + 4)], r, x, y: ob.readFloatLE(q + 48), z });
  }
  return out;
}
const yawOf = o => Math.atan2(o.r[6], o.r[8]) * 180 / Math.PI;        // 0 = north, 90 = east
const kind = m => /plants\/tree/.test(m) ? 'tree' : /plants\/bush/.test(m) ? 'bush' : /plants\/clutter|decals/.test(m) ? 'clutter'
  : /roads\/parts/.test(m) ? 'road' : /rail\/tracks|rail_track/.test(m) ? 'rail' : /rocks/.test(m) ? 'rock' : /walls/.test(m) ? 'wall' : /water/.test(m) ? 'water' : 'struct';

// ---- navmesh (Detour tiles, 104-byte header, no detail meshes): walkable area type per cell
let nav, navBuf;
function navRegion(x0, z0, x1, z1, res = 1) {
  nav = nav || JSON.parse(load('navindex.json'));
  if (!navBuf) { const p = readPbo(nav.pbo); navBuf = p.read(nav.entry); }
  const b = navBuf, W = Math.ceil((x1 - x0) / res), H = Math.ceil((z1 - z0) / res);
  const h = new Float32Array(W * H).fill(NaN), area = new Uint8Array(W * H);
  const tri = (a, c, d, ar) => {
    const den = (c[2] - d[2]) * (a[0] - d[0]) + (d[0] - c[0]) * (a[2] - d[2]); if (Math.abs(den) < 1e-9) return;
    const i0 = Math.max(0, Math.floor((Math.min(a[0], c[0], d[0]) - x0) / res)), i1 = Math.min(W - 1, Math.ceil((Math.max(a[0], c[0], d[0]) - x0) / res));
    const j0 = Math.max(0, Math.floor((Math.min(a[2], c[2], d[2]) - z0) / res)), j1 = Math.min(H - 1, Math.ceil((Math.max(a[2], c[2], d[2]) - z0) / res));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const px = x0 + (i + .5) * res, pz = z0 + (j + .5) * res;
      const l1 = ((c[2] - d[2]) * (px - d[0]) + (d[0] - c[0]) * (pz - d[2])) / den, l2 = ((d[2] - a[2]) * (px - d[0]) + (a[0] - d[0]) * (pz - d[2])) / den, l3 = 1 - l1 - l2;
      if (l1 < -1e-4 || l2 < -1e-4 || l3 < -1e-4) continue;
      const y = l1 * a[1] + l2 * c[1] + l3 * d[1], k = j * W + i; if (isNaN(h[k]) || y > h[k]) { h[k] = y; area[k] = ar; }
    }
  };
  for (let tx = Math.floor(x0 / 50); tx <= Math.floor((x1 - .01) / 50); tx++) for (let tz = Math.floor(z0 / 50); tz <= Math.floor((z1 - .01) / 50); tz++)
    for (const o of nav.tiles[tx + ',' + tz] || []) {
      const pc = b.readInt32LE(o + 24), vc = b.readInt32LE(o + 28); let p = o + 104; const V = []; for (let i = 0; i < vc; i++) V.push([b.readFloatLE(p + i * 12), b.readFloatLE(p + i * 12 + 4), b.readFloatLE(p + i * 12 + 8)]);
      p += vc * 12;
      for (let i = 0; i < pc; i++) { const q = p + i * 32, n = b[q + 30], ar = b[q + 31] & 0x3f; if (b[q + 31] >> 6 === 1) continue; const v = []; for (let k = 0; k < n; k++) v.push(V[b.readUInt16LE(q + 4 + k * 2)]); for (let k = 1; k + 1 < n; k++) tri(v[0], v[k], v[k + 1], ar); }
    }
  return { x0, z0, res, W, H, h, area };   // area 1 = ground, 5 = water
}

// ---- classes and bounding boxes
let classes, p3d; const bbCache = fs.existsSync(cachePath('bbox_cache.json')) ? JSON.parse(fs.readFileSync(cachePath('bbox_cache.json'))) : {}; const pbos = {};
const norm = s => s.split(BS).join('/').toLowerCase().replace(/^\//, '');
function cls(name) { classes = classes || JSON.parse(load('classes.json')); return classes[name.toLowerCase()]; }
function cfgVal(name, key) { let c = cls(name), n = 0; while (c && c[key] === undefined && c.parent && n++ < 30) c = cls(c.parent); return c && c[key]; }   // follows inheritance
const modelOf = name => cfgVal(name, 'model');
function bboxModel(m) {
  m = norm(m); if (!m.endsWith('.p3d')) m += '.p3d'; if (bbCache[m]) return bbCache[m];
  p3d = p3d || JSON.parse(load('p3dindex.json')); const f = p3d[m]; if (!f) return null;
  const p = pbos[f] = pbos[f] || readPbo(f); const buf = p.read(m.slice(norm(p.props.prefix || '').length + 1)); const bb = buf && odolBBox(buf);
  if (bb) { bbCache[m] = bb; fs.writeFileSync(cachePath('bbox_cache.json'), JSON.stringify(bbCache)); }
  return bb;
}
const bboxClass = name => { const m = modelOf(name); return m ? bboxModel(m) : null; };
const towns = () => JSON.parse(load('towns.json'));

module.exports = { meta, height, query, yawOf, kind, navRegion, cls, cfgVal, modelOf, bboxModel, bboxClass, towns };
