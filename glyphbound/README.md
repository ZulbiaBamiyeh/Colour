# Glyphbound: puzzle-ladder prototype

The first playable test of the Glyphbound design: you never control your hero; you write the scroll it reads.
Open `index.html` in a browser (no build step; fonts come from Google Fonts).

It answers one question: **is writing a scroll and watching it play fun on its own?** There's no shop, backpack or map yet.

## What's in it
- **9 levels.** Each one is a fixed enemy scroll that beats a naive plan (Attack spam into Thorns, Burn into Shield, and so on), plus a small glyph pouch to answer it. The last level makes one scroll beat three enemies.
- **Scroll editor:** tap a dashed slot to inscribe a verb, target, `If`/`Unless` condition or `Channel`. Each line shows its mana cost and cast time.
- **Playback:** the cursor glows on the line being read. Lines flash green when cast, dim when skipped, and outline red while waiting for mana. Speeds are 0.5× to 4×, with pause and skip.
- **Fight report:** damage by source, mana spent and wasted, and cast/skip counts on every line of both scrolls.

## Files
| File | What it is |
| --- | --- |
| `engine.js` | Deterministic sim in 0.1s ticks, seeded RNG, statuses, Fatigue (from Zereshktopia's rules), plus the scroll cursor and mana. Runs in the browser and in Node. |
| `levels.js` | Levels, the player hero and a text parser for scroll lines (`"If Self HP < 50: Channel Heal Self"`). |
| `tools/solve.js` | `node tools/solve.js [samples] [levelId]` plays thousands of random legal scrolls per level. It reports the win rate, the best scrolls found and fight length. Use it after any tuning change. |

## Tuning notes
- Burn per Ignite dropped from 4 to 2, and Ward from 15 to 12 Shield. At the doc's numbers, `Ignite + Attack` beat almost every level and Ward loops out-healed weapon damage.
- Current solver curve (random scrolls winning): about 93% on level 1, 40–60% on levels 2–5, and 2–6% on levels 6–9. Plain Attack spam loses every level after the first.
