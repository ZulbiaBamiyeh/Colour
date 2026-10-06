// Headless level check: node glyphbound/tools/solve.js [samples] [levelId]
// For each level, plays naive scrolls and thousands of random legal scrolls built from the pouch, then reports how
// often random scrolls win, the best ones found, and fight length. Use it to spot levels that are trivial or unwinnable.
const GB = require('../engine.js');
const { LEVELS, PLAYER, VALUES } = require('../levels.js');

const N = Number(process.argv[2] || 4000);
const only = process.argv[3];
const SELF_VERBS = new Set(['stoke', 'heal', 'ward', 'bramble', 'moonwell', 'purify', 'meditate']);

let s = 12345;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = a => a[Math.floor(rnd() * a.length)];

function randomScroll(p) {
  const counts = { ...p.verbs };
  let channels = p.channel;
  const n = 1 + Math.floor(rnd() * p.lines);
  const out = [];
  for (let i = 0; i < n; i++) {
    const avail = Object.keys(counts).filter(v => counts[v] > 0);
    if (!avail.length) break;
    const verb = pick(avail); counts[verb]--;
    const line = { verb, target: SELF_VERBS.has(verb) ? 'self' : 'enemy' };
    if (rnd() < 0.05) line.target = line.target === 'self' ? 'enemy' : 'self';
    if (channels > 0 && rnd() < 0.35) { line.channel = true; channels--; }
    if (p.cond && rnd() < 0.4) {
      const stat = pick(p.stats);
      const cmp = stat === 'frozen' ? 'has' : pick(['<', '>', '>', 'has']);
      line.cond = { op: rnd() < 0.8 ? 'if' : 'unless', subj: pick(['self', 'enemy']), stat, cmp };
      if (cmp !== 'has') line.cond.val = stat === 'hp' || stat === 'mana' ? pick([25, 50, 75]) : pick([3, 5, 10]);
    }
    out.push(line);
  }
  return out;
}
const fmt = sc => sc.map(l => (l.cond ? `${l.cond.op} ${l.cond.subj} ${l.cond.stat} ${l.cond.cmp}${l.cond.val != null ? ' ' + l.cond.val : ''}: ` : '') + (l.channel ? 'channel ' : '') + `${l.verb} ${l.target}`).join(' | ');

// Score: wins across all enemies; margin = remaining HP share. seeds: robustness check.
function play(lv, sc, seeds = [lv.seed]) {
  let wins = 0, total = 0, margin = 0, time = 0;
  for (const seed of seeds) for (const en of lv.enemies) {
    const r = GB.simulate({ ...PLAYER, scroll: sc }, en, seed);
    total++; time += r.time;
    if (r.winner === 'A') { wins++; margin += r.frames.at(-1).A.hp / PLAYER.hp; }
  }
  return { wins, total, margin, time: time / total };
}

for (const lv of LEVELS) {
  if (only && lv.id !== only) continue;
  const p = lv.pouch;
  const atk = Array.from({ length: Math.min(p.verbs.attack || 1, p.lines) }, () => ({ verb: 'attack', target: 'enemy' }));
  const naive = play(lv, atk);
  const allWin = [];
  let winning = 0, times = 0;
  for (let i = 0; i < N; i++) {
    const sc = randomScroll(p);
    const r = play(lv, sc);
    times += r.time;
    if (r.wins === r.total) { winning++; allWin.push({ sc, ...r }); }
  }
  allWin.sort((a, b) => b.margin - a.margin);
  const robust = allWin.slice(0, 40).map(w => ({ ...w, rob: play(lv, w.sc, [1, 2, 3, 4, 5, 6, 7, 8]) }))
    .sort((a, b) => b.rob.wins - a.rob.wins || b.margin - a.margin);
  console.log(`\n== ${lv.title} (${lv.id})`);
  console.log(`  attack-only: ${naive.wins}/${naive.total} wins, avg ${naive.time.toFixed(1)}s`);
  console.log(`  random scrolls winning: ${(100 * winning / N).toFixed(1)}%   avg fight ${(times / N).toFixed(1)}s`);
  for (const w of robust.slice(0, 3)) console.log(`  best: [${fmt(w.sc)}]  hp left ${(100 * w.margin / w.total).toFixed(0)}%  robust ${w.rob.wins}/${w.rob.total}`);
}
