// Example: a small camp designed in code. Copy, edit the intents, run: node example_design.js
// Positions are rough intents; the solver moves each item up to `j` m / `yj` deg to the nearest valid pose.
const { Camp } = require('./layout');
const C = new Camp(2822, 6592, 60);                     // centre x, z and analysis radius (m)
const T = (cls, x, z, yaw, o = {}) => C.add({ cls, x, z, yaw, tent: true, j: 5, yj: 30, ...o });
const P = (cls, x, z, yaw, o = {}) => C.add({ cls, x, z, yaw, j: 2, yj: 30, ...o });

T('Land_TradTent_Medium2', 2831, 6602, -15, { loot: [3, 1], sec: true, role: 'anchor' });   // first item = anchor
T('Land_TradTent_Small', 2810, 6596, 40, { loot: [2, 1] });
P('StaticObj_Furniture_fireplace_grill', 2820, 6588, 25);
const rug = P('StaticObj_Carpet3', 2824, 6590.5, -60);
P('StaticObj_Teapot', 2824, 6590.5, 0, { on: [rug] });   // allowed to overlap the rug

console.log(C.report());
C.render('example_plan.png');
const { groupXml, posXml } = C.toEventGroup('Example_Group');
console.log('\n-- cfgeventgroups.xml (before </eventgroupdef>):\n' + groupXml + '\n-- cfgeventspawns.xml (inside your <event>):\n' + posXml);
// C.toDze('Example_Group.dze');   // optional: review in DayZ Editor
