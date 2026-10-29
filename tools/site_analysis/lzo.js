// LZO1X safe decompressor. Returns {out, ip} or throws.
function lzo1x(inb, ip, outLen) {
  const out = Buffer.alloc(outLen); let op = 0, t, m;
  const need = n => { if (op + n > outLen) throw new Error('out overrun'); };
  const lit = n => { need(n); if (ip + n > inb.length) throw new Error('in overrun'); inb.copy(out, op, ip, ip + n); op += n; ip += n; };
  const cpy = (pos, n) => { if (pos < 0) throw new Error('lookbehind'); need(n); for (let i = 0; i < n; i++) out[op++] = out[pos + i]; };
  const ext = (base) => { let v = 0; while (inb[ip] === 0) { v += 255; ip++; if (v > outLen) throw new Error('bad ext'); } return v + base + inb[ip++]; };
  let state;
  if (inb[ip] > 17) { t = inb[ip++] - 17; if (t < 4) { lit(t); t = inb[ip++]; state = 'match'; } else { lit(t); state = 'first'; } }
  else state = 'loop';
  for (;;) {
    if (state === 'loop') {
      t = inb[ip++];
      if (t >= 16) { state = 'match'; continue; }
      if (t === 0) t = ext(15);
      lit(t + 3); state = 'first'; continue;
    }
    if (state === 'first') {
      t = inb[ip++];
      if (t >= 16) { state = 'match'; continue; }
      m = op - 0x801 - (t >> 2) - (inb[ip++] << 2);
      cpy(m, 3); state = 'done'; continue;
    }
    if (state === 'match') {
      if (t >= 64) { m = op - 1 - ((t >> 2) & 7) - (inb[ip++] << 3); cpy(m, (t >> 5) + 1); }
      else if (t >= 32) { t &= 31; if (t === 0) t = ext(31); m = op - 1 - ((inb[ip] | (inb[ip + 1] << 8)) >> 2); ip += 2; cpy(m, t + 2); }
      else if (t >= 16) {
        m = op - ((t & 8) << 11); t &= 7; if (t === 0) t = ext(7);
        m -= (inb[ip] | (inb[ip + 1] << 8)) >> 2; ip += 2;
        if (m === op) return { out, op, ip };
        m -= 0x4000; cpy(m, t + 2);
      } else { m = op - 1 - (t >> 2) - (inb[ip++] << 2); cpy(m, 2); }
      state = 'done'; continue;
    }
    if (state === 'done') {
      t = inb[ip - 2] & 3;
      if (t === 0) { state = 'loop'; continue; }
      lit(t); t = inb[ip++]; state = 'match'; continue;
    }
  }
}
module.exports = { lzo1x };
