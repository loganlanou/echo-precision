# Echo Precision

Competition range equipment and session journal — browser test build **Beta 1.1.1**.

**Live test site:** https://echo-precision-test.vercel.app/

## Source

- `index.html` — self-contained responsive interface, local rifle/scope/ammo library, Quick Acquire weather/directional reference, In Action journal, rifle ballistics metadata fields, competition stages, timed notes, voice controls, historic impact plots, and basic verification tools.
- `api/weather.js` — Vercel Node.js function providing a same-origin proxy for approximate Open-Meteo weather by GPS coordinates or city/ZIP lookup.

The current test build uses browser localStorage for saved profiles and observations. **There is no hosted account database or cross-device sync yet.** Export a JSON backup in the app before clearing browser data or changing devices.

## Vercel setup

Connect this GitHub repository to the **existing** Vercel project `echo-precision-test` (team: `loganlanous-projects`) rather than creating a duplicate.

Choose:
- Production branch: `main`
- Framework Preset: **Other**
- Root Directory: repository root
- No custom build command or output directory

Vercel serves the static `index.html` and the serverless `api/weather.js` endpoint. Environment variables are not needed for this test build.

## Testing and limitations

- The environmental forecast is an estimate, not a direct on-range measurement. Browser GPS requires permission, and city/ZIP lookup is available as a fallback. Wind bearing follows meteorological convention (**direction wind comes FROM**). Quick Acquire also records a manually entered facing heading; it does not translate these bearings into scope adjustments.
- Possible-shot sound events may miss real shots or detect unrelated noise. Microphone and speech features depend on browser/device support.
- The app stores **user-entered** optical settings, including MOA/MIL entries, and ordinary unit conversions. It does **not** compute live firing solutions, scope-click recommendations, aiming points, or shot-to-shot firearm adjustments.
- The in-browser verification suite only checks its stated general conversions and journal data logic; it does not certify firearm ballistics.

## Privacy

Avoid committing account credentials, API keys, browser session data, or any personal session exports to this repository.

## Deployment smoke test

This repository's `main` branch is the source for the existing `echo-precision-test` Vercel project. Changes to this branch should trigger automatic production deployments. The browser application and its API are versioned together; verify both endpoints after a release.
