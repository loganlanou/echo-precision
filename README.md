# Echo Precision

Precision shooting ballistic calculator, AI range spotter and competition journal — browser build **Beta 1.6.0**.

**Live test site:** https://echo-precision-test.vercel.app/

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
