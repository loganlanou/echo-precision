# Echo Precision

Precision shooting ballistic calculator, AI range spotter and competition journal — browser build **Beta 1.16.0**.

**Live test site:** https://echo-precision-test.vercel.app/

## What's new in 1.16.0

- **Magnification on the reticle view.** Under the hold reticle in In Action, set the power you're on with the slider or the − / + buttons. "Fit" zooms to the hold, as before. The view shows what you'd see through your scope at that power, using the maker's field of view (e.g. Vortex PST II 24.1 ft at 5x, Trijicon Tenmile 24.7 ft at 4.5x). The power is saved per scope.
- **FFP and SFP handled differently, automatically.**
  - **First focal plane:** the reticle grows and shrinks with the picture, so holds are the same at any power. Lower power shows more of the field around a smaller reticle.
  - **Second focal plane:** the reticle stays the same size to your eye, and its marks are only true at one power (max by default, or the power you set). Below that, Echo scales the hold and tells you which mark to use, e.g. at 7x on a 14x-true scope: "each mark is worth 2×… On the reticle at 7x: 12.5 down".
- If a hold is outside the view at high power, Echo tells you to zoom out.
- **New scope fields:** power range, field of view at lowest power, and (SFP only) the power where holds are true. The power range is read from names like "5-25x50" when left blank. Known scopes fill all of these in.

## What's new in 1.15.1

- **Reticle picker on the hold page.** Under the reticle in In Action there's a "Reticle" menu for the selected rifle's scope: plain grid, Vortex EBR-2C (MRAD) or Trijicon MOA Precision Tree. Your choice is saved to that scope, so the right reticle shows every time you use that rifle. It's also under Armory → Scopes → "Reticle drawing on the hold page".
- **Tenmile is easier to recognize.** Any scope named Tenmile, Ten-Mile or 10 Mile now draws the MOA Precision Tree, even with the reticle and unit fields left blank, unless the reticle says MRAD.

## What's new in 1.15.0

- **Trijicon Tenmile reticle.** The Tenmile 4.5-30x56 FFP with the MOA Precision Tree (TM3056-C-3000012) is drawn on the In Action hold page. It shows tick marks every 1 MOA (numbered every 10), the holdover tree rows every 5 MOA down to 40, wind dots every 1 MOA with a diamond every 5, and the outer bars and post. Echo says the hold in words, e.g. "17.25 MOA down (2.25 below the 15 row) · 4.25 MOA right (4¼ dots)".
- **Tenmile known-scope fill-in.** Armory → Scopes → Known scope now lists the Tenmile: first focal plane, MOA turrets, 1/4 MOA per click, 100 MOA elevation, 50 MOA windage, 34 mm tube.
- The Vortex EBR-2C and the Tenmile now share one reticle drawer, so more reticles can be added from a maker's subtension chart.

## What's new in 1.14.0

- **Real reticle on the hold page.** If your scope uses the Vortex EBR-2C (MRAD) reticle, the In Action hold page draws that reticle, built from Vortex's own measurements. You see the 0.5-mil marks, the fine 0.1 marks from 5 to 7, the numbered holdover tree with wind dots every 0.2 mil (big dot every mil), and the heavy outer bars and post. The orange ring shows where to put the target, and Echo says it in words, e.g. "3.9 down (0.1 above line 4) · 1.3 right (1 big dot + 1½ dots)". Holds past the end of the reticle tell you to dial instead.
- **Known scope fill-in.** Under Armory → Scopes, "Known scope" fills in the Vortex Viper PST Gen II 5-25x50 FFP with the EBR-2C MRAD reticle: first focal plane, MRAD turrets, 0.1 MRAD per click, plus travel and parallax notes.
- **Unit mismatch check.** A scope saved with MOA turrets but an MRAD reticle (or the other way round) gets a warning on its scope and rifle cards, with a one-tap fix. The fix keeps the old settings as a revision and clears a stale MOA setting in In Action.

## What's new in 1.13.0

- New **Sight In** tab (also in More, the In Action menu, and an "⊕ Sight in" button on every rifle under Rifles):
  1. Pick a saved rifle or create a new one (name, caliber, scope).
  2. Tell Echo what one turret click moves: 1/8, 1/4, 1/2 or 1 MOA, 0.05, 0.1 or 0.2 MIL, or any other value.
  3. Set the zero distance (25, 50, 100, 200 yd or any yards/meters) and 1–5 shots per group.
  4. Fire the group, then tap where each shot hit on the target or type it ("2 high 1 left", "center").
  5. Echo finds the group center and says exactly how many clicks to dial up/down and left/right. Repeat until the group is within 0.3 MOA (0.1 MIL) of the bull.
  6. Save the zero: the rifle's zero distance and the scope's click value are stored (with a log of every group), the rifle becomes the selected rifle, and In Action, Competition and the ballistic calculator use it from then on.

## What's new in 1.12.0

- **Install Echo on your phone.** More → "Echo on your phone" shows how: on iPhone, Safari → Share → Add to Home Screen; on Android, the Install button (or Chrome ⋮ → Install app).
- **Works with no signal.** The whole app is saved on the phone when it is first opened. With signal, the newest version still loads; with weak or no signal it opens from the phone after at most 3 seconds.
- New home-screen icons for iPhone and Android, and the app opens full screen without browser bars.
- When there's no signal, Echo says so and skips the weather lookup. If spoken calls need signal on your phone, it switches to tap entry and typed calls.
- Fixed: the range, wind, angle or temperature wheels could jump to their lowest value if the screen redrew mid-scroll.

## What's new in 1.11.0

- The rifle name at the top of In Action is now a dropdown of your saved rifles. Pick one and Echo uses its velocity, BC, zero and scope.
- New **⚡ Quick caliber** button next to it: 62 common hunting, magnum, competition, AR, lever, rimfire and military cartridges with typical factory loads and a search box (7mm-08, 7mm PRC, 7mm WSM, .300 WSM, .300 PRC, 6.8 Western, 6 Dasher, 6mm GT, .22 Creedmoor, .30-30, .45-70 and more).
- Saved rifles in a cartridge Echo doesn't list still work in In Action as long as they have a velocity and BC.
- The bottom navigation bar now stays visible on every screen on phones, including In Action.

## What's new in 1.10.0

- New **Compete** tab:
  - Set the number of targets, the first and last plate size (in even steps, usually 2" smaller each), points per hit (1 each, smaller worth more, or custom), and your round count or no limit.
  - **Shot timer.** Echo says "Shooter ready", then beeps at a random moment within 5 seconds. With gunshot listening on, it records split times, and the clock stops on your last round.
  - **Target calls.** "Hit target one", "missed a little left on four", "two low on T3", or just "hit" for the target you're on. Echo uses each plate's size: a near miss is placed just past the edge, and an impact call with no hit or miss is scored against the plate. It gives the clicks for your next shot.
  - **Score by hand** with ✓ and ✕ on each target, or let the voice calls score it.
  - The stage ends after your last round, or when you say "range clear", "targets clear", "shooting complete" or "stage complete". Echo then reads your time, score and return to zero.
- Return to zero counts every click moved during the session: the first dial, each follow-up correction, and clicks you report ("up two clicks").
- The gunshot detector now checks each loud sound for a sharp start, a low boom, a high crack and enough ring. Claps (no boom), dropped objects (no crack) and voices (slow start) are ignored. Use "Test the shot detector" on the Compete tab to see why each sound counted or not.

## What's new in 1.9.0

- The voice spotter talks less: it says the yardage and the clicks, then "Send it when ready."
- It understands more ways of calling a shot: "a little right", "slightly low", "two inches to the left", "high by three", "three inches at four o'clock", "right on", "rang it".
- "Up two clicks" or "I came left one click" logs a turret move you made yourself.
- Listening is steadier on phones. A pause now ends your call even when the phone never sends a final result. Repeated results are dropped. Gunshot listening starts off on phones, because it competes with speech recognition for the microphone.

## What's new in 1.8.0

- New **reticle hold** page in the clicks card (swipe once from the clicks). It draws a scope picture with an orange dot showing where to put the target if you leave your turrets on zero, for example "Hold 6.75 MOA high · 5.75 MOA left", plus the same correction as clicks. Marks are every 1 MOA (numbered every 5); MIL scopes use 0.5 or 1 mil marks. The view zooms out for bigger holds.

## What's new in 1.7.0

- New **Compass** button next to Shooting on the wind card. It opens a live compass: point the top of your phone at the target, watch the needle and degrees (for example W 268°) update, then tap **Lock direction**. Echo sets your shooting direction to the exact degree and fills the wind clock from local weather.
- It tells you to hold steady, tilt the phone flatter, or recalibrate (figure-8, away from the rifle and vehicle) when the reading isn't reliable. On iPhone, Safari asks for motion access the first time; without a compass it offers the N–NW buttons instead.

## What's new in 1.6.1

- Temperature (and humidity) now fill in from local weather. Before, the Temp wheel locked itself at the 59°F default the first time the screen drew, so weather never replaced it.
- A temperature you set by hand is kept for 3 hours, then local weather takes over again. The orange weather button refreshes temperature and humidity straight away.

## What's new in 1.6.0

- Echo keeps track of your turret during a spotter session. A starting note records the first dial from zero, and every click change (after a called shot, a range or wind change, or a new shooting direction) is logged as a note on that shot: what you clicked and where you are now from zero.
- Undo takes back a shot's click change too.
- Range clear shows a **Return to zero** card with the clicks to come back (for example 27 clicks DOWN, 24 clicks RIGHT) until you tap "I'm back on zero". Echo also says it out loud.
- Say "back to zero" during a session to hear the clicks to return.

## What's new in 1.5.0

- The wind card's direction button is now **Shooting**, with a small arrow pointing the way you picked.
- If no shooting direction is saved, In Action asks "Which way are you shooting?" once, with N–NW buttons and the phone compass. Tap **Later** to hide it.
- Say "shooting west" (or "facing northeast", "shooting toward the south") to the voice spotter: Echo sets the direction, refills the wind from local weather and reads back the new clicks.

## What's new in 1.4.0

- In Action uses the Echo colors (dark panels, orange accents).
- Wind fills itself in: set which way you're facing (pick N–NW or use the phone compass) and Echo turns the local weather wind into speed and a clock direction. You can still drag the ring or spin the wheel; a hand-set wind isn't overwritten for 45 minutes. The orange button refills from weather any time.
- Hands-free spotter keeps listening the whole time: say "hit", "two low one left", "miss", or any note ("flinched on that one") and Echo logs each shot and its notes without a tap.
- Fewer false shots: the gunshot detector needs a near-instant, very loud onset and no speech around it, so talking no longer counts as a shot. The mic and recognizer pause while Echo speaks, which stops it hearing itself and looping.
- Manual mode: skip the voice entirely, tap where the shot landed (or Hit / Miss), submit it, and get a recommended correction to apply or skip.
- All adjustments are spoken and shown in clicks ("come up 4 clicks and left 2 clicks").

## What's new in 1.3.1

- Every screen now calculates even when a saved rifle has no muzzle velocity or BC, using a typical factory load for its caliber and grain (clearly labeled).
- In Action restyled: header bar with menu, wind button and clock box, white ring with draggable wind marker, swipeable wheel pages (range / wind / angle, then temperature / altitude / humidity), and swipeable result pages (clicks, MOA/MIL values, flight details). Phone tab bar replaced by the ☰ menu on this screen.

## What's new in 1.3.0

- **One-screen In Action:** rifle/cartridge header, a wind-direction ring (drag to where the wind comes from, read as a clock), range / wind speed / angle wheels, and big click readouts (e.g. "31 clicks UP · 26 clicks LEFT").
- **Minimal input:** pick caliber and bullet weight; Echo uses your matching saved rifle or a built-in table of typical factory loads (15 calibers), adjusted for barrel length. Local weather is used when available.
- **Hands-free spotter:** listens for the shot, asks "Call it", understands calls like "two low one right", "low 2 left 1", "hit", "miss", asks follow-ups ("How many inches low?"), and speaks the click correction plus your new dial. Voice commands: undo, distance 500, wind 10 from 3 o'clock, what's my dial, range clear.
- Simplified navigation: In Action, History, Rifles, More (detailed tools moved under More).

## What's new in 1.2.1

- MIL output now uses 0.1 MIL clicks when the scope is set up in MOA (previously reused the ¼-MOA click value).
- Spotter corrections now show your **new total dial** after each called shot, and "Use computed solution" fills in that corrected dial.
- Visiting Quick Acquire no longer switches the Ballistics and In Action screens to the quick load.
- "Edit rifle data" on the Ballistics screen opens the rifle editor; assistant understands "how stable is my bullet?"; sub-click corrections read "hold"; clearer dial sign labels and chart zero label.
- Verified against py-ballisticcalc: within 0.014 MOA from 100–1,000 yd (.308 150 gr, G1).

## What's new in 1.2.0

- **Ballistic engine** (`ballistics.js`): point-mass 3-DOF solver (RK4) with standard G1/G7 drag tables, air density from temperature / station pressure / humidity / elevation, wind resolved against your facing heading, inclined fire, Litz spin drift with Miller stability, and Coriolis/Eötvös.
- **Ballistics screen**: firing solution (elevation and windage in MOA, MIL and scope clicks), trajectory chart, a printable dope card with CSV export, and **true velocity** solving from an observed come-up at distance.
- **Firing solutions throughout**: Quick Acquire and In Action now show the dial for the current distance and conditions. The solution at session start is saved with the session.
- **AI spotter**: call impacts by voice or text ("two inches low and one right", "0.3 mil high", "dead center"). Echo logs the impact, calculates the dial correction and can read it aloud. Voice commands: "distance 600", "what's my dope", "range clear".
- **Echo assistant**: answers dope at any range ("what's my dial at 800 yards?"), last correction, transonic range, stability, equipment, weather and session questions.
- **Analytics**: per-session extreme spread, mean radius, mean point of impact with the correction to center the group, plus a cross-session progress chart (score % and group size in MOA).
- **Armory**: bullet diameter/length and twist direction on rifles; click value on scopes.
- **Offline / installable**: web app manifest and a network-first service worker, so the app still opens on a range with no signal.

## Source

- `index.html` — responsive single-page interface: armory, Quick Acquire, Ballistics, In Action, environment, competition sessions and analytics.
- `ballistics.js` — ballistic engine (UMD: `window.EchoBallistics` in the browser, `require()` in Node).
- `api/weather.js` — Vercel Node.js function proxying Open-Meteo weather by GPS coordinates or city/ZIP (returns station pressure, humidity, elevation and approximate latitude for Coriolis).
- `sw.js`, `manifest.webmanifest`, `icon.svg` — PWA support.
- `tests/ballistics.test.js` — engine tests (`node --test tests/`).

The build uses browser localStorage for saved profiles and sessions. **There is no hosted account database or cross-device sync yet.** Export a JSON backup in the app before clearing browser data or changing devices.

## Vercel setup

Connect this GitHub repository to the **existing** Vercel project `echo-precision-test` (team: `loganlanous-projects`).

- Production branch: `main`
- Framework Preset: **Other**
- Root Directory: repository root
- No build command or output directory

## Accuracy and limitations

- Solutions are model predictions and are only as good as your inputs. Chronograph your muzzle velocity, use the bullet maker's BC, enter your facing heading, and use **True velocity** at long range to calibrate. Always confirm with live fire.
- Results are less reliable once the bullet goes transonic (the app warns you). The engine uses standard drag curves, not custom drag models (CDMs).
- Forecast weather is a model estimate. An on-site weather meter improves density and wind inputs.
- Possible-shot sound events may miss real shots or pick up unrelated noise. Microphone, speech recognition and speech synthesis depend on browser and device support.

## Roadmap

| Priority | Feature | Status |
|---|---|---|
| 1 | GitHub + automatic Vercel deployments | Complete |
| 2 | Rifle, ammunition and scope management | Complete |
| 3 | Live weather and directional inputs | Complete |
| 4 | Quick Acquire interface | Complete |
| 5 | Shot logging, timers and voice support | Beta (needs real-device testing) |
| 6 | Ballistic engine | **Complete (1.2.0)** |
| 7 | Conversational AI spotter | On-device beta. Cloud LLM is a future option |
| 8 | Accuracy analytics and progress tracking | **Complete (1.2.0)** |
| 9 | Accounts and cloud sync | Planned (needs an auth and database provider) |
| 10 | Native app / app store | Installable PWA now. Native wrapper later |

## Privacy

Don't commit account credentials, API keys, browser session data or personal session exports to this repository.
