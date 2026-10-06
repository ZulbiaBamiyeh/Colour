// Glyphbound puzzle ladder. Each level is a fixed enemy scroll that beats one naive plan, and a pouch of glyphs to
// answer it with. Scroll lines are written as text ("If Self HP < 50: Channel Heal Self") and parsed by parseLine.
(function (root, factory) {
  const L = factory(typeof module === 'object' && module.exports ? require('./engine.js') : root.GB);
  if (typeof module === 'object' && module.exports) module.exports = L;
  else root.GB_LEVELS = L;
})(typeof self !== 'undefined' ? self : this, function (GB) {
  'use strict';

  function parseLine(s) {
    if (!s) return null;
    let condPart = null, body = s.trim();
    const colon = body.indexOf(':');
    if (colon >= 0) { condPart = body.slice(0, colon).trim(); body = body.slice(colon + 1).trim(); }
    const line = {};
    if (condPart) {
      // "If Self HP < 50" or "If Enemy Has Frozen"
      const w = condPart.toLowerCase().split(/\s+/);
      line.cond = w[2] === 'has' ? { op: w[0], subj: w[1], stat: w[3], cmp: 'has' }
        : { op: w[0], subj: w[1], stat: w[2], cmp: w[3], val: Number(w[4]) };
      if (GB.lineIssue({ ...line, verb: 'attack', target: 'enemy' })) throw new Error('Bad condition in "' + s + '"');
    }
    const w = body.split(/\s+/).map(x => x.toLowerCase());
    if (w[0] === 'channel') { line.channel = true; w.shift(); }
    line.verb = w[0]; line.target = w[1];
    if (!GB.VERBS[line.verb]) throw new Error('Unknown verb in "' + s + '"');
    return line;
  }
  const scroll = lines => lines.map(parseLine);

  const PLAYER = { name: 'Scribe', hp: 100, mana: { max: 100, start: 30, regen: 6 }, weapon: { name: 'Quill Knife', dmg: 4, speed: 1.0 } };
  const ALL_STATS = ['hp', 'mana', 'shield', 'burn', 'poison', 'frost', 'heat', 'thorns', 'frozen'];

  // pouch: verbs you may inscribe (with counts); cond: condition glyphs unlocked; channel: Channel glyphs; lines: scroll size.
  const LEVELS = [
    {
      id: 'straw', title: 'The Straw Effigy', seed: 11,
      lesson: 'Your hero reads its scroll top to bottom, on loop. Lines it cannot afford are skipped.',
      hint: 'Try adding Ignite Enemy. Burn never wears off, so stacking it early pays off.',
      enemy: { name: 'Straw Effigy', hp: 80, weapon: { name: 'Pitchfork', dmg: 4, speed: 1.2 }, scroll: scroll(['Attack Enemy']) },
      pouch: { verbs: { attack: 2, ignite: 1 }, cond: false, channel: 0, lines: 3 },
    },
    {
      id: 'briar', title: 'The Briar Knight', seed: 23,
      lesson: 'Thorns hurt whoever hits them with a weapon. Spells never trigger Thorns.',
      hint: 'Every Attack into the Knight costs you its Thorns. Let Burn and Poison do the work.',
      enemy: { name: 'Briar Knight', hp: 130, weapon: { name: 'Thorned Flail', dmg: 4, speed: 1.3 }, scroll: scroll(['Bramble Self', 'Attack Enemy', 'Attack Enemy']) },
      pouch: { verbs: { attack: 2, ignite: 2, venom: 2, meditate: 1 }, cond: false, channel: 0, lines: 4 },
    },
    {
      id: 'bulwark', title: 'The Bulwark', seed: 37,
      lesson: 'Shield absorbs weapon hits and Burn. Poison goes straight through it.',
      hint: 'The Bulwark Wards over and over. What ignores Shield?',
      enemy: { name: 'Bulwark', hp: 120, shield: 10, weapon: { name: 'Tower Mace', dmg: 5, speed: 1.4 }, scroll: scroll(['Ward Self', 'Attack Enemy', 'Ward Self', 'Attack Enemy']) },
      pouch: { verbs: { attack: 2, ignite: 2, venom: 2, meditate: 1 }, cond: false, channel: 0, lines: 4 },
    },
    {
      id: 'mender', title: 'Sister Mend', seed: 41,
      lesson: 'Channel makes the cursor wait for mana instead of skipping. Burn cuts all healing by 20%.',
      hint: 'Sister Mend heals whenever she drops under 75%. Make sure your big spells actually happen.',
      enemy: { name: 'Sister Mend', hp: 110, mana: { max: 100, start: 50, regen: 7 }, weapon: { name: 'Censer', dmg: 4, speed: 1.1 },
        scroll: scroll(['If Self HP < 75: Heal Self', 'Attack Enemy']) },
      pouch: { verbs: { attack: 2, ignite: 2, venom: 1, ward: 1 }, cond: false, channel: 2, lines: 4 },
    },
    {
      id: 'rime', title: 'The Rime Witch', seed: 53,
      lesson: 'Frost fills a meter. At 10 you are Frozen for 3s and your cursor stops. After a thaw you cannot be frosted for 2s.',
      hint: 'Conditions are unlocked. A line like "If Self Frost > 5" lets you react before the freeze.',
      enemy: { name: 'Rime Witch', hp: 140, mana: { max: 100, start: 60, regen: 9 }, weapon: { name: 'Icicle', dmg: 6, speed: 1.2 },
        scroll: scroll(['Chill Enemy', 'Chill Enemy', 'If Enemy Has Frozen: Attack Enemy', 'Attack Enemy']) },
      pouch: { verbs: { attack: 2, ignite: 2, stoke: 1, ward: 2, heal: 1 }, cond: true, stats: ['hp', 'mana', 'frost', 'frozen', 'shield'], channel: 1, lines: 5 },
    },
    {
      id: 'dune', title: 'The Dune Duelist', seed: 67,
      lesson: 'Sand makes weapon attacks miss. A miss triggers nothing.',
      hint: 'The Duelist hits hard and only with its sword. Blind it.',
      enemy: { name: 'Dune Duelist', hp: 120, weapon: { name: 'Khopesh', dmg: 8, speed: 1.3 },
        scroll: scroll(['Stoke Self', 'Attack Enemy', 'Attack Enemy', 'Attack Enemy']) },
      pouch: { verbs: { attack: 2, dust: 2, ignite: 1, ward: 1, hinder: 1 }, cond: true, stats: ['hp', 'mana', 'heat', 'shield'], channel: 1, lines: 5 },
    },
    {
      id: 'plague', title: 'The Plague Doctor', seed: 79,
      lesson: 'Poison is slow but never stops. Purify removes stacks of your worst debuff.',
      hint: 'Purify only when it is worth it. "If Self Poison > 5" saves mana.',
      enemy: { name: 'Plague Doctor', hp: 105, mana: { max: 100, start: 30, regen: 6 }, weapon: { name: 'Bonesaw', dmg: 3, speed: 1.0 },
        scroll: scroll(['Venom Enemy', 'Venom Enemy', 'Ward Self', 'Attack Enemy']) },
      pouch: { verbs: { attack: 2, venom: 1, ignite: 1, purify: 2, moonwell: 1, heal: 1 }, cond: true, stats: ['hp', 'mana', 'poison', 'shield'], channel: 1, lines: 5 },
    },
    {
      id: 'pyre', title: 'The Pyre Priest', seed: 83,
      lesson: 'Shield soaks Burn before it reaches your health. Burn on you also weakens your healing.',
      hint: 'Burn ticks every moment. A Ward in front of it buys a lot of time.',
      enemy: { name: 'Pyre Priest', hp: 105, mana: { max: 100, start: 40, regen: 7 }, weapon: { name: 'Brand', dmg: 3, speed: 1.1 },
        scroll: scroll(['Ignite Enemy', 'Stoke Self', 'If Self HP < 50: Heal Self', 'Ignite Enemy', 'Attack Enemy']) },
      pouch: { verbs: { attack: 2, ward: 2, purify: 1, venom: 2, heal: 1, chill: 1 }, cond: true, stats: ['hp', 'mana', 'burn', 'shield', 'heat'], channel: 2, lines: 6 },
    },
    {
      id: 'examiners', title: 'The Three Examiners', seed: 97,
      lesson: 'One scroll, three opponents. You must beat all of them without editing in between.',
      hint: 'Conditions let one scroll answer different threats.',
      enemies: [
        { name: 'Examiner of Thorns', hp: 120, weapon: { name: 'Briar Rod', dmg: 4, speed: 1.2 }, scroll: scroll(['Bramble Self', 'Attack Enemy', 'Attack Enemy']) },
        { name: 'Examiner of Embers', hp: 110, mana: { max: 100, start: 45, regen: 8 }, weapon: { name: 'Ember Rod', dmg: 3, speed: 1.1 }, scroll: scroll(['Ignite Enemy', 'If Self HP < 50: Heal Self', 'Attack Enemy']) },
        { name: 'Examiner of Rime', hp: 100, mana: { max: 100, start: 40, regen: 7 }, weapon: { name: 'Rime Rod', dmg: 5, speed: 1.2 }, scroll: scroll(['Chill Enemy', 'Chill Enemy', 'Attack Enemy']) },
      ],
      pouch: { verbs: { attack: 2, ignite: 2, venom: 2, ward: 2, heal: 1, purify: 1, meditate: 1 }, cond: true, stats: ALL_STATS, channel: 2, lines: 7 },
    },
  ];
  for (const lv of LEVELS) if (!lv.enemies) lv.enemies = [lv.enemy];

  return { LEVELS, PLAYER, parseLine, VALUES: [3, 5, 10, 25, 50, 75] };
});
