# Bonk Blob

A cute roguelike about bonking a squishy blob as far as possible, built with three.js. Each run starts from zero. Build up a field and gear over ten rounds and try to bonk your blob all the way to the Moon.

**[Play it in your browser](https://zulbiabamiyeh.github.io/Colour/)** (desktop or phone).

Everything lives in one self-contained file: [`index.html`](index.html), served as-is by GitHub Pages (`.nojekyll` turns off Jekyll processing). To run it locally, open the file in a browser (three.js r160 loads from cdnjs). All models, faces, icons, music and sound effects are generated at runtime. Unlocks save to the browser's local storage.

## Bonking
Two taps (finger, mouse or Space), each doing one thing:
1. **Angle:** a needle sweeps over a fan in front of the batter. Tap to lock it. Higher up the fan means a higher launch.
2. **Power:** the blob hops in with a shrinking ring. Tap when the rings meet. *Perfect* timing gives the most power, *Great* and *Good* give less, and missing the window is a whiff. Three whiffs count as a missed round, and the angle stays locked between whiffs.

## A run
- **Ten rounds** with growing distance goals (35 m up to 3.2 km, which is the Moon). Missing a goal costs one of 3 hearts.
- **Camp** between rounds:
  - **Field card:** free, pick 1 of 3. Cards change what grows in the field, such as mushrooms, frogs, ponds, balloons, birds, clouds, rockets and wind. Own both cards of a pair and they fuse into a combo, e.g. Mushroom Patch + Rain = **Mega Mushrooms**.
  - **Gear:** bought with this run's coins. Most gear trades something away, e.g. *Bigger Mallet* hits harder but shrinks the timing window, and *Lead Boots* hit hard but bounce poorly.
- Reach the Moon to win, then keep going into bonus rounds if you like.

## The Moon
Something has always been up there. At first it is a tiny pale daytime moon you could easily miss. Fly far enough on the late rounds and it grows: an ancient, weathered face with no eyes and no mouth, only two hollow sockets darker than the night, slowly turning to follow your blob as ash trickles out of them. As it gets closer:
- The sky turns dark red and the colour drains from the field.
- The music slows into a sour music box, with a drone, a heartbeat and a tolling bell underneath.
- Your blob panics.

Reaching it on the final round triggers the ending.

**After you have seen it properly, it doesn't go away.** In every later run:
- Lights flicker, the sky flashes black, the music drops out and something whispers.
- The batter's eyes go hollow, and sometimes it swings on its own.
- The field turns its back to look up at the sky, and some critters wear hollow faces.
- The HUD and the sign sometimes read LOOK UP.

The camp shop also starts offering frightening gear. Each piece is free or costs a heart, and each takes something:
- *A Piece of the Moon* hits much harder, but the Moon is always closer.
- *Offering* trades a heart for power and coins.
- *Blindfold* hides the timing rings; you listen for the beat instead.
- *The Batter's Smile* swings for you and never misses.
- *Ash* lowers gravity, and nothing helpful grows in the field.
- *Hollow* makes every bounce keep everything, and your blob's face never comes back.

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
| `PITCH` | Angle fan and needle, hop-in path, timing rings and power from timing. |
| `updateBatter` | Spring-driven wind-up, swing, impact squash, follow-through and lunge. |
| `FLIGHT` | Fixed-substep physics, spawning on the predicted landing spot, collisions and helper effects. |
| `THE MOON` | Shader-sculpted faceless moon with hollow sockets, fissures and grime streaks (`makeMoon`); dread level, sky placement, slow gaze, ash and the ending (`updateMoon`, `updateEnding`). |
| `WRONGNESS` | Random unsettling events once the Moon has been seen (`updateWrong`). |
| `RUN FLOW` / `RESULTS` / `HUB` | Camp (card + gear shop), round results and hearts, run summary, unlock checks, character and field select. |
