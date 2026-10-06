# YoGabbaGabba — Gabba After Dark

A mobile-first 3D fan-game prototype: Slender-style collecting with a FNAF-ish CRT/horror atmosphere.

DJ Lance is trapped inside the Super Music Friends Show TV box. Find the five friend figurines and five song-power music notes, survive the corrupted hunters they wake, then return to the TV box after all 10 collectibles are recovered.

Fan-project note: this repository intentionally ships no copyrighted character artwork, show models, logos, music recordings, or ripped audio. The current game uses original geometric stand-ins.

## Current loop

- Mobile left-thumb joystick and right-side drag-to-look
- Hold RUN to sprint
- Desktop WASD, mouse drag, Shift, and number keys 1–5
- Plex, Muno, Foofa, Toodie, and Brobee figurines
- Every rescued friend wakes a corrupted hunter based on that character
- Five named music-note power pickups; the songs themselves do not play
- Health, damage, cooldowns, proximity static, win and loss states
- DJ Lance is visible inside the TV box throughout the run
- At 10/10, the TV unlocks and you must physically return to DJ Lance
- At 3:30 there is a warning; at 4:00 Gooble joins as the slowest hunter

## Song powers

| Character | Song | Power |
| --- | --- | --- |
| Brobee | Party in My Tummy | Restores 45 health |
| Foofa | I Love Flowers | Flower/dizzy effects stun nearby hunters for 5.5 seconds |
| Muno | I Like Bugs | A giant beetle appears under the first-person view and gives an 8-second speed boost |
| Toodie | I Like Fish | Creates a little fish/scent trail toward the nearest still-missing Toodie figurine, Brobee figurine, or Party in My Tummy pickup |
| Plex | Give Baby Space | Sends every active hunter to the far side of the map |

## Put it online

Open this repository on GitHub, go to Settings → Pages, choose Deploy from a branch, then choose main and /(root), and Save.

GitHub will give you the Pages URL. Open that URL on iPhone or Android. Landscape gives the controls more room, although portrait is supported.

## Local testing

Serve the repository root with any simple HTTP server. For example, Python can serve it on port 8080 with python3 -m http.server 8080.

The current version imports Three.js directly from jsDelivr, so there is no npm install and no build step.

## Main tuning

The CONFIG block at the top of src/main.js contains movement, health, damage, mobile render scale, and the Gooble timers. The CHARACTERS and POWERS arrays contain collectible positions, song names, cooldowns, and colors.

Good next upgrades: real monster navigation around walls, a larger themed map, original/authorized GLB models, footsteps and proximity sound design, and more elaborate chase animations.
