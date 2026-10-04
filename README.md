# Ember & Hex

A playable prototype of a portrait mobile **autobattler deckbuilder**, built with three.js.
Everything lives in one self-contained file: [`index.html`](index.html). Open it in a browser (three.js r160 loads from cdnjs). All textures, icons and sounds are generated at runtime.

## The loop
- Win **10 fights** before you lose **3**.
- **Shop:** gold every round, 3–5 offers. Tap a card to Buy, Sell or Merge (two copies of the same card and level make one stronger card, up to ★★★). Reroll costs 1 gold. Decks hold 8–15 cards. Tap and hold any card for full details.
- **Battle:** fully automatic. Sides alternate playing the top card of their seeded, shuffled decks. When a deck runs out it reshuffles and its owner takes escalating Fatigue damage (5, 15, 45…). The only controls are 1× / 2× / Skip.

## Code map (inside `index.html`)
| Section | What it is |
| --- | --- |
| `CARD DEFINITIONS` (classic `<script>`) | All 45 cards plus 3 curse tokens, in one commented list. Add a card by adding an entry. |
| `simulate(deckA, deckB, seed)` | Pure and deterministic: returns `{ events, winner, buffs }`. Decks are plain JSON (`{ name, hp, cards: [{ id, lvl, bonus }] }`), ready for async PvP. |
| `ARCHETYPES` / `makeOpponent` | Procedural opponents (aggro, poison, burn/freeze, curse, junk, shield/heal) that scale with the round. |
| `CANVAS ART` | Glyphs, card faces (full and compact), card back, medallions, HUD icons, particle atlas. |
| `ENGINE` | three.js scene, tweens, 3D card meshes, pooled particles, animated background shader, Web Audio synth. |
| `GAME` | Run state, shop, battle playback (the renderer only animates simulator events), HUD, modals, input. |
