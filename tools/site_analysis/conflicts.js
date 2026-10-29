// Mission features near points: event spawns, player spawns, effect areas, territories, object spawners.
// CLI: node conflicts.js <x,z> [<x,z> ...]   (env R = search radius, default 300)
const fs = require('fs'); const path = require('path'); const { MISSION } = require('./lib');
const R = +(process.env.R || 300), rd = f => fs.readFileSync(path.join(MISSION, f), 'utf8'), feats = [];
for (const m of rd('cfgeventspawns.xml').matchAll(/<event name="([^"]+)"\s*(?:\/>|>([\s\S]*?)<\/event>)/g))
  for (const p of (m[2] || '').matchAll(/<pos x="([-\d.]+)" z="([-\d.]+)"[^>]*?(?:group="([^"]+)")?\s*\/>/g)) feats.push({ src: 'eventspawn', name: m[1] + (p[3] ? ` [${p[3]}]` : ''), x: +p[1], z: +p[2] });
for (const p of rd('cfgplayerspawnpoints.xml').matchAll(/<pos x="([-\d.]+)" z="([-\d.]+)"/g)) feats.push({ src: 'playerspawn', name: '', x: +p[1], z: +p[2] });
try { for (const a of JSON.parse(rd('cfgeffectarea.json')).Areas || []) feats.push({ src: 'effectarea', name: a.AreaName, x: a.Data.Pos[0], z: a.Data.Pos[2], r: a.Data.Radius }); } catch (e) { }
const envDir = path.join(MISSION, 'env');
if (fs.existsSync(envDir)) for (const f of fs.readdirSync(envDir)) for (const p of fs.readFileSync(path.join(envDir, f), 'utf8').matchAll(/<zone name="([^"]+)"[^>]*x="([-\d.]+)" z="([-\d.]+)" r="([-\d.]+)"/g)) feats.push({ src: 'territory:' + f.replace('_territories.xml', ''), name: p[1], x: +p[2], z: +p[3], r: +p[4] });
try { const gp = JSON.parse(rd('cfggameplay.json')); for (const f of (gp.WorldsData || {}).objectSpawnersArr || []) for (const o of JSON.parse(rd(f)).Objects || []) feats.push({ src: 'objspawner', name: o.name, x: o.pos[0], z: o.pos[2] }); } catch (e) { }
for (const a of process.argv.slice(2)) {
  const [x, z] = a.split(',').map(Number); console.log(`\n== ${x},${z} (within ${R} m; negative = inside the zone radius)`);
  feats.map(f => ({ ...f, d: Math.hypot(f.x - x, f.z - z) - (f.r || 0) })).filter(f => f.d < R).sort((a, b) => a.d - b.d)
    .forEach(f => console.log(f.d.toFixed(0).padStart(5), f.src.padEnd(30), f.name, f.r ? 'r' + f.r : ''));
}
