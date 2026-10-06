// Glyphbound battle engine. Pure and deterministic: simulate(heroA, heroB, seed) runs the whole fight up front and
// returns per-tick frames plus an event list for playback. Status rules follow Zereshktopia's engine.js; item cooldowns
// are replaced by a scroll cursor that spends mana. Works as a browser global (window.GB) and as a CommonJS module.
(function (root, factory) {
  const GB = factory();
  if (typeof module === 'object' && module.exports) module.exports = GB;
  else root.GB = GB;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const DT = 0.1;
  const RULES = {
    FATIGUE_AT: 30, MAX_TIME: 90, FATIGUE_PCT: 0.006,
    BURN_PER: 0.4, BURN_HEAL_CUT: 0.8, POISON_EVERY: 4, REGEN_EVERY: 4,
    FREEZE_AT: 10, FREEZE_TIME: 3, THAW_TIME: 2,
    SLOW_MAX: 0.75, SLOW_K: 15, SAND_MAX: 0.85, SAND_K: 10, HEAT_MAX: 1.2, HEAT_K: 30,
    SPEED_MIN: 0.4, SPEED_MAX: 2.5, BASE_CRIT: 0.05, LUCK_PER: 0.03, STALL: 0.5,
  };
  const slowMult = n => 1 - (RULES.SLOW_MAX * n) / (n + RULES.SLOW_K);
  const heatBonus = n => (RULES.HEAT_MAX * n) / (n + RULES.HEAT_K);
  const sandMiss = n => (RULES.SAND_MAX * n) / (n + RULES.SAND_K);

  // Verbs. fx says what lands on the target: a status to add, or heal / mana / cleanse. Cast 'weapon' uses weapon speed.
  const VERBS = {
    attack:   { name: 'Attack',   school: 'weapon', mana: 0,  cast: 'weapon', weapon: true, text: 'Hit with your weapon. Free. Can miss to Sand and triggers Thorns.' },
    ignite:   { name: 'Ignite',   school: 'fire',   mana: 15, cast: 0.8, fx: ['burn', 2],    text: 'Apply 2 Burn.' },
    stoke:    { name: 'Stoke',    school: 'fire',   mana: 20, cast: 0.6, fx: ['heat', 5],    text: 'Gain 5 Heat (faster casts).' },
    chill:    { name: 'Chill',    school: 'frost',  mana: 15, cast: 0.8, fx: ['frost', 4],   text: 'Apply 4 Frost. 10 Frost freezes for 3s.' },
    hinder:   { name: 'Hinder',   school: 'frost',  mana: 20, cast: 1.0, fx: ['slow', 5],    text: 'Apply 5 Slow (slower casts).' },
    venom:    { name: 'Venom',    school: 'venom',  mana: 15, cast: 0.8, fx: ['poison', 3],  text: 'Apply 3 Poison. Ignores Shield.' },
    dust:     { name: 'Dust',     school: 'desert', mana: 20, cast: 1.0, fx: ['sand', 5],    text: 'Apply 5 Sand (weapon misses).' },
    heal:     { name: 'Heal',     school: 'holy',   mana: 25, cast: 1.2, fx: ['heal', 15],   text: 'Heal 15.' },
    ward:     { name: 'Ward',     school: 'shield', mana: 20, cast: 1.0, fx: ['shield', 12], text: 'Gain 12 Shield.' },
    bramble:  { name: 'Bramble',  school: 'thorn',  mana: 20, cast: 0.8, fx: ['thorns', 3],  text: 'Gain 3 Thorns.' },
    moonwell: { name: 'Moonwell', school: 'lunar',  mana: 25, cast: 1.0, fx: ['regen', 3],   text: 'Gain 3 Regen.' },
    purify:   { name: 'Purify',   school: 'lunar',  mana: 20, cast: 0.6, fx: ['cleanse', 4], text: 'Remove 4 stacks of your biggest debuff.' },
    meditate: { name: 'Meditate', school: 'mana',   mana: 0,  cast: 1.5, fx: ['mana', 20],   text: 'Gain 20 mana.' },
  };
  const STATS = ['hp', 'mana', 'shield', 'burn', 'poison', 'frost', 'slow', 'sand', 'heat', 'thorns', 'regen', 'frozen'];
  const DEBUFFS = ['burn', 'poison', 'slow', 'sand'];
  const STATUS_KEYS = ['burn', 'poison', 'frost', 'slow', 'sand', 'heat', 'thorns', 'regen', 'luck'];

  // A line: { cond?: { op:'if'|'unless', subj:'self'|'enemy', stat, cmp:'<'|'>'|'has', val }, channel?, verb, target }
  function lineIssue(line) {
    if (!line) return 'empty';
    const c = line.cond;
    if (!line.verb && !line.target && !c && !line.channel) return 'empty';
    if (!line.verb) return 'Needs a verb';
    if (!line.target) return 'Needs a target';
    if (c) {
      if (!c.op || !c.subj || !c.stat || !c.cmp) return 'Condition is unfinished';
      if (c.stat === 'frozen' && c.cmp !== 'has') return 'Frozen only works with Has';
      if (c.cmp !== 'has' && c.val == null) return 'Condition needs a value';
    }
    return null;
  }

  function simulate(heroA, heroB, seed = 1) {
    const rng = mulberry32(seed >>> 0);
    let t = 0;
    const events = [];
    const frames = [];
    const ev = (side, kind, data = {}) => events.push({ t: Math.round(t * 10) / 10, side, kind, ...data });

    function make(side, h) {
      const scroll = (h.scroll || []).map(l => (lineIssue(l) ? null : l));
      return {
        side, name: h.name, maxHp: h.hp, hp: h.hp, shield: h.shield || 0,
        maxMana: h.mana?.max ?? 100, mana: h.mana?.start ?? 30, manaRegen: h.mana?.regen ?? 6,
        weapon: h.weapon || { name: 'Fists', dmg: 3, speed: 1.2 },
        st: Object.fromEntries(STATUS_KEYS.map(k => [k, (h.statuses && h.statuses[k]) || 0])),
        frozen: 0, thaw: 0,
        scroll, lines: scroll.length, cur: 0, cast: null, idle: 0, waiting: -1, castThisPass: false, pass: 0,
        dotAcc: { burn: 0, poison: 0, regen: 0 },
        rep: { dealt: {}, taken: 0, shieldAbsorbed: 0, healed: 0, manaWasted: 0, manaSpent: 0,
               cast: scroll.map(() => 0), skip: scroll.map(() => 0), stalls: 0 },
      };
    }
    const A = make('A', heroA), B = make('B', heroB);
    const other = f => (f === A ? B : A);

    function hurt(f, amt, src, by, { pierce = false } = {}) {
      if (amt <= 0) return 0;
      let left = amt;
      if (!pierce && f.shield > 0) {
        const a = Math.min(f.shield, left);
        f.shield -= a; left -= a; f.rep.shieldAbsorbed += a;
      }
      f.hp -= left;
      f.rep.taken += amt;
      if (by) by.rep.dealt[src] = (by.rep.dealt[src] || 0) + amt;
      return amt;
    }
    function heal(f, amt) {
      if (f.st.burn > 0) amt *= RULES.BURN_HEAL_CUT;
      const real = Math.min(amt, f.maxHp - f.hp);
      f.hp += real; f.rep.healed += real;
      return real;
    }
    function speed(f) {
      const net = f.st.heat - f.st.slow;
      const m = net >= 0 ? 1 + heatBonus(net) : slowMult(-net);
      return Math.max(RULES.SPEED_MIN, Math.min(RULES.SPEED_MAX, m));
    }
    function addStatus(f, k, n, by) {
      if (k === 'frost') {
        if (f.thaw > 0 || f.frozen > 0) return 0;
        f.st.frost += n;
        if (f.st.frost >= RULES.FREEZE_AT) {
          f.st.frost = 0; f.frozen = RULES.FREEZE_TIME;
          ev(f.side, 'freeze');
        }
        return n;
      }
      f.st[k] += n;
      return n;
    }
    function cond(f, c) {
      if (!c) return true;
      const s = c.subj === 'self' ? f : other(f);
      let v;
      if (c.stat === 'hp') v = (s.hp / s.maxHp) * 100;
      else if (c.stat === 'mana') v = s.mana;
      else if (c.stat === 'shield') v = s.shield;
      else if (c.stat === 'frozen') v = s.frozen > 0 ? 1 : 0;
      else v = s.st[c.stat] || 0;
      let ok = c.cmp === 'has' ? v > 0 : c.cmp === '<' ? v < c.val : v > c.val;
      return c.op === 'unless' ? !ok : ok;
    }

    function resolve(f, line) {
      const V = VERBS[line.verb];
      const tgt = line.target === 'self' ? f : other(f);
      const data = { line: f.cur, verb: line.verb, target: line.target };
      if (V.weapon) {
        if (rng() < sandMiss(f.st.sand)) { ev(f.side, 'miss', data); return; }
        const crit = rng() < RULES.BASE_CRIT + f.st.luck * RULES.LUCK_PER;
        const dmg = f.weapon.dmg * (crit ? 2 : 1);
        hurt(tgt, dmg, 'attack', f);
        ev(f.side, crit ? 'crit' : 'hit', { ...data, amount: dmg });
        if (tgt !== f && tgt.st.thorns > 0) {
          hurt(f, tgt.st.thorns, 'thorns', tgt);
          ev(tgt.side, 'thorns', { amount: tgt.st.thorns });
        }
        return;
      }
      const [k, n] = V.fx;
      if (k === 'heal') data.amount = Math.round(heal(tgt, n) * 10) / 10;
      else if (k === 'shield') { tgt.shield += n; data.amount = n; }
      else if (k === 'mana') { const g = Math.min(n, tgt.maxMana - tgt.mana); tgt.mana += g; tgt.rep.manaWasted += n - g; data.amount = n; }
      else if (k === 'cleanse') {
        let big = null;
        for (const d of DEBUFFS) if (tgt.st[d] > 0 && (!big || tgt.st[d] > tgt.st[big])) big = d;
        if (big) { const r = Math.min(n, tgt.st[big]); tgt.st[big] -= r; data.amount = r; data.status = big; }
        else data.amount = 0;
      } else { data.amount = addStatus(tgt, k, n, f); data.status = k; }
      ev(f.side, 'effect', data);
    }

    function advance(f) {
      f.cur++;
      f.waiting = -1;
      if (f.cur >= f.lines) {
        f.cur = 0; f.pass++;
        if (!f.castThisPass) { f.idle = RULES.STALL; f.rep.stalls++; ev(f.side, 'stall'); }
        f.castThisPass = false;
        return true;
      }
      return false;
    }

    function act(f) {
      if (f.frozen > 0) return;
      if (f.idle > 0) { f.idle -= DT; return; }
      if (f.cast) {
        f.cast.t += DT * speed(f);
        if (f.cast.t + 1e-9 >= f.cast.total) {
          const line = f.scroll[f.cur];
          f.cast = null;
          resolve(f, line);
          advance(f);
        }
        return;
      }
      // Walk the scroll until a line starts casting, the cursor waits, or it wraps.
      for (let guard = 0; guard <= f.lines; guard++) {
        const i = f.cur, line = f.scroll[i];
        if (!line) { if (advance(f)) return; continue; }
        if (!cond(f, line.cond)) {
          f.rep.skip[i]++; ev(f.side, 'skip', { line: i, reason: 'cond' });
          if (advance(f)) return; continue;
        }
        const V = VERBS[line.verb];
        if (f.mana + 1e-9 < V.mana) {
          if (line.channel) {
            if (f.waiting !== i) { f.waiting = i; ev(f.side, 'wait', { line: i }); }
            return;
          }
          f.rep.skip[i]++; ev(f.side, 'skip', { line: i, reason: 'mana' });
          if (advance(f)) return; continue;
        }
        f.mana -= V.mana; f.rep.manaSpent += V.mana;
        f.rep.cast[i]++; f.castThisPass = true; f.waiting = -1;
        f.cast = { line: i, t: 0, total: V.cast === 'weapon' ? f.weapon.speed : V.cast };
        ev(f.side, 'cast', { line: i, verb: line.verb, target: line.target });
        return;
      }
    }

    function dots(f) {
      const bA = f.st.burn * RULES.BURN_PER * DT;
      if (bA > 0) { hurt(f, bA, 'burn', other(f)); f.dotAcc.burn += bA; }
      const pA = (f.st.poison / RULES.POISON_EVERY) * DT;
      if (pA > 0) { hurt(f, pA, 'poison', other(f), { pierce: true }); f.dotAcc.poison += pA; }
      if (f.st.regen > 0) f.dotAcc.regen += heal(f, (f.st.regen / RULES.REGEN_EVERY) * DT);
      const g = f.manaRegen * DT, room = f.maxMana - f.mana;
      f.mana += Math.min(g, room);
      if (g > room) f.rep.manaWasted += g - room;
      if (f.frozen > 0) { f.frozen -= DT; if (f.frozen <= 1e-9) { f.frozen = 0; f.thaw = RULES.THAW_TIME; ev(f.side, 'thaw'); } }
      else if (f.thaw > 0) f.thaw = Math.max(0, f.thaw - DT);
    }
    function flushDots(f) {
      for (const k of ['burn', 'poison', 'regen']) {
        if (f.dotAcc[k] >= 0.05) ev(f.side, 'dot', { status: k, amount: Math.round(f.dotAcc[k] * 10) / 10 });
        f.dotAcc[k] = 0;
      }
    }
    function snap(f) {
      return {
        hp: f.hp, maxHp: f.maxHp, shield: f.shield, mana: f.mana, maxMana: f.maxMana,
        st: { ...f.st }, frozen: f.frozen, thaw: f.thaw, cur: f.cur, waiting: f.waiting, idle: f.idle > 0,
        cast: f.cast ? { line: f.cast.line, p: Math.min(1, f.cast.t / f.cast.total) } : null, speed: speed(f),
      };
    }

    let winner = null, fatigueStep = 0, nextFatigue = RULES.FATIGUE_AT;
    frames.push({ t: 0, A: snap(A), B: snap(B) });
    while (true) {
      t = Math.round((t + DT) * 10) / 10;
      dots(A); dots(B);
      if (t >= nextFatigue - 1e-9) {
        fatigueStep++; nextFatigue += 1;
        for (const f of [A, B]) {
          const d = fatigueStep * RULES.FATIGUE_PCT * f.maxHp;
          hurt(f, d, 'fatigue', null, { pierce: true });
          ev(f.side, 'fatigue', { amount: Math.round(d * 10) / 10 });
        }
      }
      if (Math.abs(t - Math.round(t)) < 1e-6) { flushDots(A); flushDots(B); }
      if (A.hp > 0 && B.hp > 0) { act(A); act(B); }
      frames.push({ t, A: snap(A), B: snap(B) });
      const aDead = A.hp <= 0, bDead = B.hp <= 0;
      if (aDead || bDead) { flushDots(A); flushDots(B); winner = aDead && bDead ? 'draw' : aDead ? 'B' : 'A'; break; }
      if (t >= RULES.MAX_TIME - 1e-9) { winner = 'draw'; break; }
    }
    ev(null, 'end', { winner });
    return { winner, time: t, frames, events, report: { A: A.rep, B: B.rep } };
  }

  return { simulate, mulberry32, VERBS, STATS, RULES, DT, lineIssue, speed: { slowMult, heatBonus, sandMiss } };
});
