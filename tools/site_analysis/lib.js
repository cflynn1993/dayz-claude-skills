// Shared readers: config, PBO, rapified config.bin, ODOL bounding box.
const fs = require('fs'); const path = require('path'); const os = require('os');

const SERVER = process.env.DAYZ_SERVER || 'C:/Program Files (x86)/Steam/steamapps/common/DayZServer';
const WORLD = (process.env.DAYZ_WORLD || 'chernarusplus').toLowerCase();
const MISSION = process.env.DAYZ_MISSION || path.resolve(__dirname, '..', '..');
const CACHE = process.env.DAYZ_CACHE || path.join(os.homedir(), '.dayz-site-cache', WORLD);
fs.mkdirSync(CACHE, { recursive: true });
const cachePath = f => path.join(CACHE, f);

function readPbo(file) {
  const fd = fs.openSync(file, 'r');
  const head = Buffer.alloc(Math.min(fs.fstatSync(fd).size, 8 * 1024 * 1024));
  fs.readSync(fd, head, 0, head.length, 0);
  let p = 0; const entries = [], props = {}; let first = true;
  const cstr = () => { const e = head.indexOf(0, p); const s = head.toString('latin1', p, e); p = e + 1; return s; };
  for (;;) {
    const name = cstr(); const method = head.readUInt32LE(p), orig = head.readUInt32LE(p + 4), size = head.readUInt32LE(p + 16); p += 20;
    if (first && name === '' && method === 0x56657273) { for (;;) { const k = cstr(); if (!k) break; props[k] = cstr(); } first = false; continue; }
    first = false; if (name === '') break;
    entries.push({ name: name.replace(/\\/g, '/'), method, orig, size });
  }
  let off = p; for (const e of entries) { e.offset = off; off += e.size; }
  const find = n => entries.find(x => x.name.toLowerCase() === n.toLowerCase());
  return {
    file, props, entries, fd, find,
    read(n) {
      const e = typeof n === 'string' ? find(n) : n; if (!e) return null;
      if (e.method === 0x43707273 && e.orig !== e.size) throw new Error('compressed PBO entry ' + e.name);
      const b = Buffer.alloc(e.size); fs.readSync(fd, b, 0, e.size, e.offset); return b;
    },
  };
}

function parseRap(buf) {
  if (buf.toString('latin1', 0, 4) !== '\0raP') throw new Error('not raP');
  const cint = st => { let v = 0, s = 0, b; do { b = buf[st.p++]; v |= (b & 0x7f) << s; s += 7; } while (b & 0x80); return v; };
  const cstr = st => { const e = buf.indexOf(0, st.p); const s = buf.toString('latin1', st.p, e); st.p = e + 1; return s; };
  const arr = st => {
    const n = cint(st), out = [];
    for (let i = 0; i < n; i++) {
      const t = buf[st.p++];
      if (t === 0 || t === 4) out.push(cstr(st)); else if (t === 1) { out.push(buf.readFloatLE(st.p)); st.p += 4; }
      else if (t === 2) { out.push(buf.readInt32LE(st.p)); st.p += 4; } else if (t === 3) out.push(arr(st)); else throw new Error('arr type ' + t);
    }
    return out;
  };
  const cls = off => {
    const st = { p: off }; const node = { __parent: cstr(st), __classes: {}, __values: {} }; const n = cint(st);
    for (let i = 0; i < n; i++) {
      const t = buf[st.p++];
      if (t === 0) { const nm = cstr(st); node.__classes[nm] = { off: buf.readUInt32LE(st.p) }; st.p += 4; }
      else if (t === 1) { const sub = buf[st.p++]; const nm = cstr(st); if (sub === 0 || sub === 4) node.__values[nm] = cstr(st); else if (sub === 1) { node.__values[nm] = buf.readFloatLE(st.p); st.p += 4; } else { node.__values[nm] = buf.readInt32LE(st.p); st.p += 4; } }
      else if (t === 2) { const nm = cstr(st); node.__values[nm] = arr(st); }
      else if (t === 3 || t === 4) cstr(st);
      else if (t === 5) { st.p += 4; const nm = cstr(st); node.__values[nm] = arr(st); }
      else throw new Error('entry type ' + t);
    }
    return node;
  };
  const root = cls(16);
  const get = (node, nm) => { const k = Object.keys(node.__classes).find(x => x.toLowerCase() === nm.toLowerCase()); if (!k) return null; const c = node.__classes[k]; if (!c.node) { c.node = cls(c.off); c.node.__name = k; } return c.node; };
  return { root, get };
}

// ODOL bbox: min corner at 12 + 4*LODcount + 48, max 12 bytes after
function odolBBox(buf) {
  if (buf.toString('latin1', 0, 4) !== 'ODOL') return null;
  const o = 12 + 4 * buf.readUInt32LE(8) + 48, r = i => buf.readFloatLE(o + i * 4);
  return { min: [r(0), r(1), r(2)], max: [r(3), r(4), r(5)] };
}

function allPbos() {
  const out = [];
  for (const d of ['addons', 'nasdara/addons', 'sakhal/addons'].map(d => path.join(SERVER, d)))
    if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (/\.pbo$/i.test(f)) out.push(path.join(d, f));
  return out;
}
const worldPbo = suffix => readPbo(path.join(SERVER, 'addons', `worlds_${WORLD}${suffix}.pbo`));

module.exports = { SERVER, WORLD, MISSION, CACHE, cachePath, readPbo, parseRap, odolBBox, allPbos, worldPbo };
