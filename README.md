# Bonk Blob

A cute roguelike about bonking a squishy blob as far as possible, built with three.js. Each run starts from zero. Build up a field and gear over ten rounds and try to bonk your blob all the way to the Moon.

Everything lives in one self-contained file: [`index.html`](index.html). Open it in a browser (three.js r160 loads from cdnjs). All models, faces, icons, music and sound effects are generated at runtime. Unlocks save to the browser's local storage.

## Bonking
- The blob hops in and lobs itself down through the **strike bar**.
- **Hold** (finger, mouse or Space) to wind up the squeaky mallet. A power meter swings up and down while you hold, and time slows a little.
- **Let go** to swing. The blob's height when you let go sets the **launch angle**: high on the bar for a steep launch, low for a line drive. The meter sets the **launch speed**, and letting go at the top of the meter gives *MAX POWER*.
- A live arrow on the blob shows the angle and power you would get right now. Three whiffs count as a missed round.

## A run
- **Ten rounds** with growing distance goals (35 m up to 3.2 km, which is the Moon). Missing a goal costs one of 3 hearts.
- **Camp** between rounds:
  - **Field card:** free, pick 1 of 3. Cards change what grows in the field, such as mushrooms, frogs, ponds, balloons, birds, clouds, rockets and wind. Own both cards of a pair and they fuse into a combo, e.g. Mushroom Patch + Rain = **Mega Mushrooms**.
  - **Gear:** bought with this run's coins. Most gear trades something away, e.g. *Bigger Mallet* hits harder but speeds up the power meter, and *Lead Boots* hit hard but bounce poorly.
- Reach the Moon to win, then keep going into bonus rounds if you like.

## Between runs (sidegrades only)
No permanent stat upgrades. Milestones unlock:
- **Blobs**, each with a different feel: Plum (heavy), Puff (floaty), Boing (springy), Lucky (rich).
- **Starting fields**, each with its own starting deck, rule twist and colours: Lily Lake, Windy Cliffs, Candy Cove and Moon Base.

The Combo Book remembers every combo you have discovered.

## Code map (inside `index.html`)
| Section | What it is |
| --- | --- |
| `DATA` | Blobs, fields, gear, round goals, field cards, combos, biomes. Add content by adding an entry. |
| `SOUND` | Web Audio synth: music loop, mallet squeak, wind-up, boings, coins, wind. |
| `MODELS` | Toon-shaded models with ink outlines: jelly blob with canvas faces, batter with sprout and mallet, every field object. |
| `PITCH` | Lob path, strike bar, hold-to-charge power meter, aim arrow, angle from contact height. |
| `updateBatter` | Spring-driven wind-up, swing, impact squash, follow-through and lunge. |
| `FLIGHT` | Fixed-substep physics, spawning on the predicted landing spot, collisions and helper effects. |
| `RUN FLOW` / `RESULTS` / `HUB` | Camp (card + gear shop), round results and hearts, run summary, unlock checks, character and field select. |
