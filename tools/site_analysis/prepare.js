// Build the derived-data cache for one map (run once per map / after a DayZ update): node prepare.js [--force]
// Outputs in CACHE: meta.json, models.json, objects.bin, elev.bin, navindex.json, towns.json, classes.json, p3dindex.json
const fs = require('fs'); const path = require('path');
const { WORLD, CACHE, cachePath, readPbo, parseRap, allPbos, worldPbo } = require('./lib');
const { lzo1x } = require('./lzo');
const force = process.argv.includes('--force');
const have = f => !force && fs.existsSync(cachePath(f));
const BS = String.fromCharCode(92);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const wp = worldPbo('');
const wrpEntry = wp.entries.find(e => /\.wrp$/i.test(e.name)); if (!wrpEntry) throw new Error('no .wrp in worlds_' + WORLD);
const meta = fs.existsSync(cachePath('meta.json')) && !force ? JSON.parse(fs.readFileSync(cachePath('meta.json'))) : {};

// towns + map size from config.bin
if (!have('towns.json') || !meta.mapSize) {
  const r = parseRap(wp.read('config.bin'));
  const cw = r.get(r.root, 'CfgWorlds'); const wk = Object.keys(cw.__classes).find(k => k.toLowerCase() === WORLD || k.toLowerCase() === WORLD.replace('plus', '') + 'plus');
  const w = r.get(cw, wk || WORLD); const names = w && r.get(w, 'Names');
  const towns = names ? Object.keys(names.__classes).map(k => { const n = r.get(names, k); return { cls: k, type: n.__values.type, x: n.__values.position[0], z: n.__values.position[1] }; }) : [];
  fs.writeFileSync(cachePath('towns.json'), JSON.stringify(towns));
  meta.worldClass = w && w.__name; meta.mapSize = (w && (w.__values.mapSize || w.__values.mapsize)) || meta.mapSize;
  log('towns', towns.length, 'mapSize', meta.mapSize);
}

if (!have('objects.bin') || !have('elev.bin') || !have('models.json')) {
  log('reading', wrpEntry.name, (wrpEntry.size / 1e6).toFixed(0), 'MB');
  const b = wp.read(wrpEntry);
  if (b.toString('latin1', 0, 4) !== 'OPRW') throw new Error('not OPRW');
  // model list: first "dz\plants\" string, preceded by its u32 count
  const i0 = b.indexOf('dz' + BS + 'plants' + BS, 0, 'latin1');
  let p = i0 - 4; const nModels = b.readUInt32LE(p); p += 4; const models = [];
  for (let i = 0; i < nModels; i++) { const e = b.indexOf(0, p); models.push(b.toString('latin1', p, e)); p = e + 1; }
  fs.writeFileSync(cachePath('models.json'), JSON.stringify(models));
  // classed object list: count, then (class\0 model\0 x y z, 8 bytes)
  const nCls = b.readUInt32LE(p); p += 4;
  for (let i = 0; i < nCls; i++) { p = b.indexOf(0, p) + 1; p = b.indexOf(0, p) + 1; p += 20; }
  log('models', nModels, 'classed objects', nCls);
  // object records: id, model, 9 rot floats, x y z, flags, 0 (64 bytes, arbitrary alignment)
  const N = nModels; const recs = [];
  const rec = o => {
    const m = b.readUInt32LE(o + 4); if (m >= N) return false;
    const x = b.readFloatLE(o + 44), z = b.readFloatLE(o + 52), y = b.readFloatLE(o + 48);
    if (!(x > -50 && x < 40000 && z > -50 && z < 40000 && y > -100 && y < 2000)) return false;
    const r = []; for (let j = 0; j < 9; j++) r.push(b.readFloatLE(o + 8 + j * 4));
    const n0 = Math.hypot(r[0], r[1], r[2]), n1 = Math.hypot(r[3], r[4], r[5]), n2 = Math.hypot(r[6], r[7], r[8]);
    if (!(n0 > 0.05 && n0 < 30) || Math.abs(n1 - n0) > 0.05 * n0 || Math.abs(n2 - n0) > 0.05 * n0) return false;
    if (Math.abs((r[0] * r[3] + r[1] * r[4] + r[2] * r[5]) / (n0 * n1)) > 0.05 || Math.abs((r[0] * r[6] + r[1] * r[7] + r[2] * r[8]) / (n0 * n2)) > 0.05) return false;
    return true;
  };
  const out = []; for (let o = p; o < b.length - 64;) { if (rec(o)) { out.push(o); o += 64; } else o++; }
  const ob = Buffer.alloc(out.length * 56); out.forEach((o, i) => b.copy(ob, i * 56, o, o + 56));
  fs.writeFileSync(cachePath('objects.bin'), ob);
  log('objects', out.length);
  // heightmap: LZO1X float grid ending just before the terrain material (.rvmat) list
  const grids = {}; for (let o = 8; o < 64; o++) { const v = b.readUInt32LE(o); if ([512, 1024, 2048, 4096, 8192].includes(v)) grids[v] = (grids[v] || 0) + 1; }
  const grid = +Object.keys(grids).filter(k => grids[k] >= 2).sort((a, c) => c - a)[0];
  const layers = b.indexOf(BS + 'data' + BS + 'layers' + BS, 0, 'latin1');
  const SZ = grid * grid * 4; let elev = null;
  const cands = [37, 38, 39, 40, 41]; for (let q = 37; q < layers - 3; q++) if (b[q] === 0x11 && b[q + 1] === 0 && b[q + 2] === 0) cands.push(q + 3);
  outer: for (const c of cands) for (let d = 0; d < 9; d++) { try { const r = lzo1x(b, c + d, SZ); if (r.op === SZ) { elev = r.out; break outer; } } catch (e) { } }
  if (!elev) throw new Error('heightmap stream not found (grid ' + grid + ')');
  fs.writeFileSync(cachePath('elev.bin'), elev);
  // map size: config value, DAYZ_MAPSIZE, or the smallest grid*cell that covers every object
  let maxXZ = 0; for (let i = 0; i < ob.length; i += 56) maxXZ = Math.max(maxXZ, ob.readFloatLE(i + 44), ob.readFloatLE(i + 52));
  if (!meta.mapSize) meta.mapSize = +process.env.DAYZ_MAPSIZE || [1, 2, 2.5, 3, 4, 5, 6.25, 7.5, 10, 12.5, 15, 20].map(c => grid * c).find(s => s >= maxXZ);
  meta.grid = grid; meta.cell = meta.mapSize / grid;
  log('heightmap', grid + 'x' + grid, 'cell', meta.cell, 'm');
}

if (!have('navindex.json')) {
  const np = worldPbo('_nav'); const e = np.entries.find(x => /\.nm$/i.test(x.name));
  log('indexing navmesh', (e.size / 1e6).toFixed(0), 'MB');
  const b = np.read(e); const idx = {}; let j = -1;
  while ((j = b.indexOf('VAND', j + 1)) >= 0) { const k = b.readInt32LE(j + 8) + ',' + b.readInt32LE(j + 12); (idx[k] = idx[k] || []).push(j); }
  fs.writeFileSync(cachePath('navindex.json'), JSON.stringify({ pbo: np.file, entry: e.name, tiles: idx }));
  log('nav tiles', Object.keys(idx).length);
}

if (!have('classes.json') || !have('p3dindex.json')) {
  const norm = s => s.split(BS).join('/').toLowerCase().replace(/^\//, '');
  const classes = {}, p3d = {};
  for (const f of allPbos()) {
    let p; try { p = readPbo(f); } catch (e) { continue; }
    const prefix = norm(p.props.prefix || '');
    for (const e of p.entries) {
      const full = (prefix ? prefix + '/' : '') + e.name.toLowerCase();
      if (full.endsWith('.p3d')) p3d[full] = f;
      if (!/config\.bin$/i.test(e.name)) continue;
      try {
        const r = parseRap(p.read(e));
        for (const root of ['CfgVehicles', 'CfgWeapons', 'CfgMagazines']) {
          const cv = r.get(r.root, root); if (!cv) continue;
          for (const k of Object.keys(cv.__classes)) {
            const c = r.get(cv, k), v = c.__values, key = k.toLowerCase(), prev = classes[key] || {};
            classes[key] = Object.assign(prev, { name: k, root, pbo: path.basename(f) }, c.__parent ? { parent: c.__parent } : {},
              v.model ? { model: v.model } : {}, v.scope !== undefined ? { scope: v.scope } : {},
              v.inventorySlot ? { inventorySlot: v.inventorySlot } : {}, v.itemSize ? { itemSize: v.itemSize } : {},
              v.itemsCargoSize ? { itemsCargoSize: v.itemsCargoSize } : {}, v.attachments ? { attachments: v.attachments } : {},
              v.magazines ? { magazines: v.magazines } : {}, v.chamberableFrom ? { chamberableFrom: v.chamberableFrom } : {});
          }
        }
      } catch (err) { }
    }
  }
  fs.writeFileSync(cachePath('classes.json'), JSON.stringify(classes));
  fs.writeFileSync(cachePath('p3dindex.json'), JSON.stringify(p3d));
  log('classes', Object.keys(classes).length, 'models', Object.keys(p3d).length);
}
fs.writeFileSync(cachePath('meta.json'), JSON.stringify(meta, null, 1));
log('cache ready:', CACHE);
