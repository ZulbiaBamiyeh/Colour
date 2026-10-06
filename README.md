# Bonk Blob

A cute home-run-contest roguelike built with three.js. Bat a squishy blob as far as you can, grow the field with cards, discover combos and buy upgrades so every run goes further.

Everything lives in one self-contained file: [`index.html`](index.html). Open it in a browser (three.js r160 loads from cdnjs). All models, faces, card art, music and sound effects are generated at runtime. Progress saves to the browser's local storage.

## The loop
- **Run:** 5 swings (more with *Extra Innings*). Before each swing you pick 1 of 3 **field cards**.
- **Swing:** the blob hops in. Tap (or press Space) when the shrinking ring meets the target ring. Perfect timing gives a hit-stop, a slow-mo crack and the best launch angle. Early hits pop up and late hits go low. Three misses is a strike-out.
- **Flight:** no steering. The field you built does the work: mushrooms, springs, frogs, ponds, rockets, balloons, birds, clouds, wind and coin arcs. Bushes and snails slow you down. Helpers in a row build a **chain** worth bonus coins.
- **Combos:** own both cards of a pair in one run and they fuse into a new kind of terrain, such as Mushroom Patch + Rain = **Mega Mushrooms**. There are 8 to discover in the Combo Book.
- **Meta progression:** coins from distance, pickups, chains and records buy permanent upgrades (Big Bat, Sweet Spot, Springy Socks, Slippy Skin, Piggy Bank, Green Thumb, Card Shark, Extra Innings, Seed Packet) and unlock new blobs (Plum, Puff, Boing, Lucky).
- **Areas:** the world changes as you fly further: Meadow, Sunset Shore (600 m), Frosty Peaks (1.5 km), Candy Clouds (3 km) and the Moon (6 km, low gravity).

## Code map (inside `index.html`)
| Section | What it is |
| --- | --- |
| `DATA` | Characters, upgrades, field cards, combos and biomes. Add a card or combo by adding an entry. |
| `SOUND` | Web Audio synth: music loop, bat crack, boings, coins, wind. |
| `MODELS` | Toon-shaded models with ink outlines (blob with jelly wobble and canvas faces, batter, every field object). |
| `SKY, GROUND` / `SCENERY` / `BIOME PALETTE` | Gradient sky, striped field shader, recycled parallax scenery, colours that blend by distance. |
| `PARTICLES` / `TRAIL` | One shared point cloud (discs, stars, confetti, rain) and the flight ribbon. |
| `PITCH` / `FLIGHT` | Timing windows and launch maths, then fixed-substep physics, spawning on the predicted landing spot, collisions and effects. |
| `RESULTS` / `HUB` | Coin tally, run summary, upgrade shop, character select, Combo Book. |

## Balance notes
- Launch speed is `24 m/s × 1.11^BigBat × character × timing`.
- Helpers get rarer as one flight uses more of them (`0.8^hits`), and speed boosts shrink at high speed, so every flight ends.
- Flights longer than 12 s speed up gradually, and the 2× button doubles that.
