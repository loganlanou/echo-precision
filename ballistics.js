/*
 * Echo Precision ballistic engine.
 * Point-mass (3-DOF) trajectory solver with G1/G7 standard drag tables,
 * ICAO/CIPM-style air density (temperature, station pressure, humidity),
 * full wind decomposition relative to shooter heading, inclined fire,
 * Litz spin-drift approximation, Miller stability and Coriolis/Eötvös.
 *
 * Works in the browser (window.EchoBallistics) and Node (module.exports).
 * Internal units are SI; inputs/outputs use common shooter units.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.EchoBallistics = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Standard drag tables: [Mach, Cd]
  const G1 = [[0,.2629],[.05,.2558],[.1,.2487],[.15,.2413],[.2,.2344],[.25,.2278],[.3,.2214],[.35,.2155],[.4,.2104],[.45,.2061],[.5,.2032],[.55,.202],[.6,.2034],[.7,.2165],[.725,.223],[.75,.2313],[.775,.2417],[.8,.2546],[.825,.2706],[.85,.2901],[.875,.3136],[.9,.3415],[.925,.3734],[.95,.4084],[.975,.4448],[1,.4805],[1.025,.5136],[1.05,.5427],[1.075,.5677],[1.1,.5883],[1.125,.6053],[1.15,.6191],[1.2,.6393],[1.25,.6518],[1.3,.6589],[1.35,.6621],[1.4,.6625],[1.45,.6607],[1.5,.6573],[1.55,.6528],[1.6,.6474],[1.65,.6413],[1.7,.6347],[1.75,.628],[1.8,.621],[1.85,.6141],[1.9,.6072],[1.95,.6003],[2,.5934],[2.05,.5867],[2.1,.5804],[2.15,.5743],[2.2,.5685],[2.25,.563],[2.3,.5577],[2.35,.5527],[2.4,.5481],[2.45,.5438],[2.5,.5397],[2.6,.5325],[2.7,.5264],[2.8,.5211],[2.9,.5168],[3,.5133],[3.1,.5105],[3.2,.5084],[3.3,.5067],[3.4,.5054],[3.5,.504],[3.6,.503],[3.7,.5022],[3.8,.5016],[3.9,.501],[4,.5006],[4.2,.4998],[4.4,.4995],[4.6,.4992],[4.8,.499],[5,.4988]];
  const G7 = [[0,.1198],[.05,.1197],[.1,.1196],[.15,.1194],[.2,.1193],[.25,.1194],[.3,.1194],[.35,.1194],[.4,.1193],[.45,.1193],[.5,.1194],[.55,.1193],[.6,.1194],[.65,.1197],[.7,.1202],[.725,.1207],[.75,.1215],[.775,.1226],[.8,.1242],[.825,.1266],[.85,.1306],[.875,.1368],[.9,.1464],[.925,.166],[.95,.2054],[.975,.2993],[1,.3803],[1.025,.4015],[1.05,.4043],[1.075,.4034],[1.1,.4014],[1.125,.3987],[1.15,.3955],[1.2,.3884],[1.25,.381],[1.3,.3732],[1.35,.3657],[1.4,.358],[1.5,.344],[1.55,.3376],[1.6,.3315],[1.65,.326],[1.7,.3209],[1.75,.316],[1.8,.3117],[1.85,.3078],[1.9,.3042],[1.95,.301],[2,.298],[2.05,.2951],[2.1,.2922],[2.15,.2892],[2.2,.2864],[2.25,.2835],[2.3,.2807],[2.35,.2779],[2.4,.2752],[2.45,.2725],[2.5,.2697],[2.55,.267],[2.6,.2643],[2.65,.2615],[2.7,.2588],[2.75,.2561],[2.8,.2533],[2.85,.2506],[2.9,.2479],[2.95,.2451],[3,.2424],[3.1,.2368],[3.2,.2313],[3.3,.2258],[3.4,.2205],[3.5,.2154],[3.6,.2106],[3.7,.206],[3.8,.2017],[3.9,.1975],[4,.1935],[4.2,.1861],[4.4,.1793],[4.6,.173],[4.8,.1672],[5,.1618]];
  const TABLES = { G1, G7 };

  const C = Object.freeze({
    G: 9.80665, FT: 0.3048, YD: 0.9144, IN: 0.0254, GR: 0.00006479891,
    MPH: 0.44704, BC_SI: 703.06958, OMEGA: 7.2921159e-5, MOA_IN_PER_100YD: 1.047197551
  });

  function cd(table, mach) {
    const t = TABLES[table] || G1;
    if (mach <= t[0][0]) return t[0][1];
    if (mach >= t[t.length - 1][0]) return t[t.length - 1][1];
    let lo = 0, hi = t.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (t[mid][0] <= mach) lo = mid; else hi = mid; }
    const [m0, c0] = t[lo], [m1, c1] = t[hi];
    return c0 + (c1 - c0) * (mach - m0) / (m1 - m0);
  }

  const n = (v, d) => (v === "" || v == null || !Number.isFinite(Number(v)) ? d : Number(v));

  /** Atmosphere from shooter units. pressureHpa is STATION (absolute) pressure. */
  function atmosphere(env = {}) {
    const tempF = n(env.temperatureF, 59);
    const T = (tempF - 32) * 5 / 9;
    const altM = n(env.altitudeM, 0);
    let P = n(env.pressureHpa, NaN);
    if (!Number.isFinite(P)) P = 1013.25 * Math.pow(1 - 2.25577e-5 * altM, 5.25588);
    const rh = Math.min(100, Math.max(0, n(env.humidity, 0))) / 100;
    const Tk = T + 273.15;
    const pSat = 6.1078 * Math.pow(10, (7.5 * T) / (T + 237.3)); // hPa
    const pv = rh * pSat, pd = P - pv;
    const density = (pd * 100) / (287.058 * Tk) + (pv * 100) / (461.495 * Tk);
    const speedOfSound = 331.3 * Math.sqrt(1 + T / 273.15) * (1 + 0.0016 * rh); // small humidity effect
    return { tempC: T, tempF, pressureHpa: P, humidity: rh * 100, density, speedOfSound, densityRatio: density / 1.2250 };
  }

  /** Parse twist like "1:10", "1-8", "10" → inches per turn. */
  function parseTwist(v) {
    if (v == null || v === "") return NaN;
    const m = String(v).match(/(?:1\s*[:\-/in ]+\s*)?(\d+(?:\.\d+)?)\s*"?$/i);
    return m ? Number(m[1]) : NaN;
  }

  /** Miller stability factor. weightGr, diameterIn, lengthIn, twistIn, mvFps, atm */
  function millerStability(weightGr, diameterIn, lengthIn, twistIn, mvFps, atm) {
    if (![weightGr, diameterIn, lengthIn, twistIn].every(x => Number.isFinite(x) && x > 0)) return NaN;
    const t = twistIn / diameterIn, l = lengthIn / diameterIn;
    let sg = (30 * weightGr) / (t * t * Math.pow(diameterIn, 3) * l * (1 + l * l));
    sg *= Math.cbrt(n(mvFps, 2800) / 2800);
    if (atm) sg *= ((atm.tempF + 460) / 519) * (29.92 / (atm.pressureHpa * 0.0295299830714));
    return sg;
  }

  function windComponents(speedMph, fromDeg, headingDeg) {
    const s = n(speedMph, 0) * C.MPH;
    if (!s || !Number.isFinite(Number(fromDeg))) return { head: 0, cross: 0, clock: null };
    const toward = (Number(fromDeg) + 180) * Math.PI / 180, h = n(headingDeg, 0) * Math.PI / 180;
    const rel = toward - h;
    // head: +downrange (tailwind), cross: +right
    const rawRel = (((Number(fromDeg) - n(headingDeg, 0)) % 360) + 360) % 360;
    const clock = Math.round(rawRel / 30) % 12 || 12;
    return { head: s * Math.cos(rel), cross: s * Math.sin(rel), clock };
  }

  function normalize(input) {
    const i = input || {};
    const dragModel = String(i.dragModel || "G1").toUpperCase() === "G7" ? "G7" : "G1";
    const out = {
      mvFps: n(i.muzzleVelocityFps, NaN), bc: n(i.ballisticCoefficient, NaN), dragModel,
      weightGr: n(i.weightGr, NaN), diameterIn: n(i.diameterIn, NaN), lengthIn: n(i.lengthIn, NaN),
      twistIn: Math.abs(parseTwist(i.twist)), twistDir: String(i.twistDirection || "right").toLowerCase() === "left" ? -1 : 1,
      sightHeightIn: n(i.sightHeightIn, 1.5), zeroYd: n(i.zeroYd, 100), zeroHeightIn: n(i.zeroHeightIn, 0), zeroOffsetIn: n(i.zeroOffsetIn, 0),
      rangeYd: n(i.rangeYd, NaN), angleDeg: n(i.angleDeg, 0),
      windMph: n(i.windMph, 0), windFromDeg: i.windFromDeg, headingDeg: n(i.headingDeg, 0),
      latitudeDeg: i.latitudeDeg === "" || i.latitudeDeg == null ? NaN : Number(i.latitudeDeg),
      env: i.env || {}, zeroEnv: i.zeroEnv || null,
      clickUnit: String(i.clickUnit || "MOA").toUpperCase() === "MIL" ? "MIL" : "MOA",
      clickValue: n(i.clickValue, NaN), spinDrift: i.spinDrift !== false, coriolis: i.coriolis !== false,
      stepYd: n(i.stepYd, 100), maxRangeYd: n(i.maxRangeYd, NaN)
    };
    if (!Number.isFinite(out.clickValue) || out.clickValue <= 0) out.clickValue = out.clickUnit === "MIL" ? 0.1 : 0.25;
    return out;
  }

  function validate(p) {
    const errs = [];
    if (!(p.mvFps >= 300 && p.mvFps <= 6000)) errs.push("Muzzle velocity must be 300–6000 fps");
    if (!(p.bc > 0.01 && p.bc <= 2)) errs.push("Ballistic coefficient must be 0.01–2.0");
    if (!(p.sightHeightIn >= 0 && p.sightHeightIn <= 10)) errs.push("Sight height must be 0–10 in");
    if (!(p.zeroYd >= 10 && p.zeroYd <= 2000)) errs.push("Zero distance must be 10–2000 yd");
    if (!(Math.abs(p.angleDeg) <= 75)) errs.push("Shot angle must be within ±75°");
    return errs;
  }

  /**
   * Integrate a trajectory. Frame: x downrange along line of sight, y up (perp. to LOS), z right.
   * Returns samples at requested ranges (yards) in inches relative to line of sight.
   */
  function integrate(p, launchRad, ranges, opts) {
    const atm = atmosphere(opts.env);
    const k = 0.5 * atm.density * (Math.PI / 4) / (p.bc * C.BC_SI);
    const theta = p.angleDeg * Math.PI / 180;
    const gx = -C.G * Math.sin(theta), gy = -C.G * Math.cos(theta);
    const w = opts.wind ? windComponents(p.windMph, p.windFromDeg, p.headingDeg) : { head: 0, cross: 0 };
    let Ox = 0, Oy = 0, Oz = 0;
    if (opts.coriolis && Number.isFinite(p.latitudeDeg)) {
      const lat = p.latitudeDeg * Math.PI / 180, az = p.headingDeg * Math.PI / 180;
      // Earth rotation in (downrange, up, right) frame (level approximation)
      Ox = C.OMEGA * Math.cos(lat) * Math.cos(az);
      Oy = C.OMEGA * Math.sin(lat);
      Oz = -C.OMEGA * Math.cos(lat) * Math.sin(az);
    }
    const v0 = p.mvFps * C.FT;
    let x = 0, y = -p.sightHeightIn * C.IN, z = 0, t = 0;
    let vx = v0 * Math.cos(launchRad), vy = v0 * Math.sin(launchRad), vz = 0;
    const targets = ranges.map(r => r * C.YD).sort((a, b) => a - b);
    const out = [];
    let ti = 0;
    const maxX = targets[targets.length - 1];
    const accel = (vx, vy, vz) => {
      const rx = vx - w.head, ry = vy, rz = vz - w.cross;
      const vr = Math.hypot(rx, ry, rz);
      const a = k * cd(p.dragModel, vr / atm.speedOfSound) * vr;
      let ax = -a * rx + gx, ay = -a * ry + gy, az = -a * rz;
      if (Ox || Oy || Oz) { // -2 Ω × v
        ax += -2 * (Oy * vz - Oz * vy);
        ay += -2 * (Oz * vx - Ox * vz);
        az += -2 * (Ox * vy - Oy * vx);
      }
      return [ax, ay, az];
    };
    let guard = 0;
    while (ti < targets.length && guard++ < 400000) {
      const v = Math.hypot(vx, vy, vz);
      const dt = Math.min(0.0025, 0.5 / Math.max(v, 50)); // ~0.5 m steps
      // RK4
      const a1 = accel(vx, vy, vz);
      const a2 = accel(vx + a1[0] * dt / 2, vy + a1[1] * dt / 2, vz + a1[2] * dt / 2);
      const a3 = accel(vx + a2[0] * dt / 2, vy + a2[1] * dt / 2, vz + a2[2] * dt / 2);
      const a4 = accel(vx + a3[0] * dt, vy + a3[1] * dt, vz + a3[2] * dt);
      const nvx = vx + dt / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]);
      const nvy = vy + dt / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]);
      const nvz = vz + dt / 6 * (a1[2] + 2 * a2[2] + 2 * a3[2] + a4[2]);
      const nx = x + dt * (vx + nvx) / 2, ny = y + dt * (vy + nvy) / 2, nz = z + dt * (vz + nvz) / 2, nt = t + dt;
      while (ti < targets.length && nx >= targets[ti]) {
        const f = (targets[ti] - x) / (nx - x);
        out.push({ x: targets[ti], y: y + (ny - y) * f, z: z + (nz - z) * f, t: t + dt * f,
          v: Math.hypot(vx + (nvx - vx) * f, vy + (nvy - vy) * f, vz + (nvz - vz) * f) });
        ti++;
      }
      x = nx; y = ny; z = nz; t = nt; vx = nvx; vy = nvy; vz = nvz;
      if (vx <= 1 || x > maxX + 1) break;
    }
    return { samples: out, atm, wind: w };
  }

  /** Find the launch angle (relative to LOS) that zeros at p.zeroYd under the zero environment. */
  function zeroAngle(p) {
    const zp = Object.assign({}, p, { angleDeg: 0 });
    const env = p.zeroEnv || p.env;
    let ang = (p.sightHeightIn * C.IN) / (p.zeroYd * C.YD);
    const want = (p.zeroHeightIn - p.zeroOffsetIn) * C.IN;
    for (let i = 0; i < 30; i++) {
      const r = integrate(zp, ang, [p.zeroYd], { env, wind: false, coriolis: false }).samples[0];
      if (!r) break;
      const err = want - r.y;
      ang += err / (p.zeroYd * C.YD);
      if (Math.abs(err) < 1e-6) break;
    }
    return ang;
  }

  function toMOA(inches, yards) { return yards > 0 ? inches / (C.MOA_IN_PER_100YD * yards / 100) : 0; }
  function toMIL(inches, yards) { return yards > 0 ? inches / (yards * 0.036) : 0; }

  /**
   * Solve a firing solution.
   * Returns { ok, errors, atmosphere, zeroAngleMOA, stability, wind, target, table }.
   * Elevation/windage "correction" values are what to dial (up/right positive).
   */
  function solve(input) {
    const p = normalize(input);
    const errors = validate(p);
    if (errors.length) return { ok: false, errors };
    const launch = zeroAngle(p);
    const atm = atmosphere(p.env);
    const sg = millerStability(p.weightGr, p.diameterIn, p.lengthIn, p.twistIn, p.mvFps, atm);
    const maxR = Number.isFinite(p.maxRangeYd) ? p.maxRangeYd : Math.max(1000, Number.isFinite(p.rangeYd) ? Math.ceil(p.rangeYd / p.stepYd) * p.stepYd : 1000);
    const ranges = [];
    for (let r = p.stepYd; r <= maxR + 1e-9; r += p.stepYd) ranges.push(r);
    if (Number.isFinite(p.rangeYd) && p.rangeYd > 0 && !ranges.includes(p.rangeYd)) ranges.push(p.rangeYd);
    ranges.sort((a, b) => a - b);
    const res = integrate(p, launch, ranges, { env: p.env, wind: true, coriolis: p.coriolis });
    const weightLb = n(p.weightGr, NaN) / 7000;
    const rows = res.samples.map(s => {
      const yd = s.x / C.YD;
      let dropIn = s.y / C.IN, windIn = s.z / C.IN, spinIn = 0;
      if (p.spinDrift && Number.isFinite(sg) && sg > 0) {
        spinIn = p.twistDir * 1.25 * (sg + 1.2) * Math.pow(s.t, 1.83);
        windIn += spinIn;
      }
      const vFps = s.v / C.FT;
      const elevMOA = -toMOA(dropIn, yd), windMOA = -toMOA(windIn, yd);
      const elevMIL = -toMIL(dropIn, yd), windMIL = -toMIL(windIn, yd);
      const unitE = p.clickUnit === "MIL" ? elevMIL : elevMOA, unitW = p.clickUnit === "MIL" ? windMIL : windMOA;
      return {
        rangeYd: yd, rangeM: yd * C.YD, dropIn, windIn, spinDriftIn: spinIn,
        elevMOA, windMOA, elevMIL, windMIL,
        elevClicks: Math.round(unitE / p.clickValue), windClicks: Math.round(unitW / p.clickValue),
        velocityFps: vFps, mach: s.v / atm.speedOfSound, energyFtLb: Number.isFinite(weightLb) ? 0.5 * (weightLb / 32.174) * vFps * vFps : NaN,
        timeS: s.t
      };
    });
    const target = Number.isFinite(p.rangeYd) ? rows.find(r => Math.abs(r.rangeYd - p.rangeYd) < 1e-6) || null : null;
    const supersonicLimit = rows.find(r => r.mach < 1.0);
    return {
      ok: true, errors: [], input: p, atmosphere: atm,
      zeroAngleMOA: launch * 180 / Math.PI * 60, stability: sg,
      wind: Object.assign({}, res.wind, { headMph: res.wind.head / C.MPH, crossMph: res.wind.cross / C.MPH }),
      transonicYd: supersonicLimit ? supersonicLimit.rangeYd : null,
      clickUnit: p.clickUnit, clickValue: p.clickValue, target, table: rows
    };
  }

  /** Convert an observed impact offset (inches, +right/+up) to a dial correction. */
  function impactCorrection(xIn, yIn, rangeYd, unit, clickValue) {
    const u = String(unit || "MOA").toUpperCase() === "MIL" ? "MIL" : "MOA";
    const cv = Number(clickValue) > 0 ? Number(clickValue) : (u === "MIL" ? 0.1 : 0.25);
    const f = u === "MIL" ? toMIL : toMOA;
    const elev = -f(Number(yIn) || 0, rangeYd), wind = -f(Number(xIn) || 0, rangeYd);
    return { unit: u, elevation: elev, windage: wind, elevClicks: Math.round(elev / cv), windClicks: Math.round(wind / cv), clickValue: cv };
  }

  /**
   * True muzzle velocity: find the MV that reproduces an observed dial-up (elevation, in unit) at rangeYd.
   */
  function trueVelocity(input, rangeYd, observedElevation, unit) {
    const u = String(unit || "MOA").toUpperCase() === "MIL" ? "MIL" : "MOA";
    const elevAt = mv => {
      const r = solve(Object.assign({}, input, { muzzleVelocityFps: mv, rangeYd, maxRangeYd: rangeYd, stepYd: rangeYd, windMph: 0, coriolis: false, spinDrift: false }));
      return r.ok && r.target ? (u === "MIL" ? r.target.elevMIL : r.target.elevMOA) : NaN;
    };
    let lo = 600, hi = 5000;
    const flo = elevAt(lo) - observedElevation, fhi = elevAt(hi) - observedElevation;
    if (!Number.isFinite(flo) || !Number.isFinite(fhi) || flo * fhi > 0) return NaN;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2, f = elevAt(mid) - observedElevation;
      if (Math.abs(f) < 1e-4) return mid;
      if (f > 0) lo = mid; else hi = mid; // more elevation needed → slower bullet
    }
    return (lo + hi) / 2;
  }

  /**
   * Parse a spotter call like "two inches low and one right", "hit 0.3 mil high 0.2 left",
   * "impact 4 inch left 2 high". Returns { x, y, unit } with unit "in" | "MOA" | "MIL", or null.
   */
  /**
   * Spotter-call parser. Understands number-first ("two low, one right") and
   * direction-first ("low 2, right 1") calls, inches / MOA / MIL, hits and misses.
   * Returns {x, y, unit, missing:[dirs without an amount], center, miss} or null.
   */
  const NUMWORDS = { zero: 0, a: 1, an: 1, half: 0.5, quarter: 0.25, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, eighteen: 18, twenty: 20, thirty: 30, couple: 2 };
  // "a little right", "slightly low": a small miss the shooter did not measure. The app turns it into about half a MOA.
  const VAGUE = "(?:just\\s+)?(?:a\\s+(?:little|little\\s+bit|bit|tad|touch|hair|smidge)|little|slightly|barely|a\\s+skosh)";
  function normalizeCall(text) {
    let s = " " + String(text || "").toLowerCase().replace(/[,;!?]/g, " ").replace(/-/g, " ").replace(/\bm\.?\s?o\.?\s?a\b\.?/g, "moa").replace(/\bmills?\b/g, "mil").replace(/\b(\d+)\s*(?:in\.|")/g, "$1 inches ") + " ";
    // Things a recognizer hears in place of a direction, and "right on" meaning a hit.
    s = s.replace(/\bright\s+(?:on|there|in the middle|at center|center|dead center)\b/g, " center ").replace(/\b(?:write|rite|wright)\b/g, "right").replace(/\bhi\b/g, "high").replace(/\blo\b/g, "low");
    s = s.replace(new RegExp("\\b" + VAGUE + "\\s+(?:to\\s+the\\s+|too\\s+)?(?=(?:left|right|high|low|up|down|short|over|under)\\b)", "g"), " vague ");
    s = s.replace(/\b(\w+) and a half\b/g, (m, w) => (w in NUMWORDS ? NUMWORDS[w] + 0.5 : m));
    const after = "(?=\\s+(?:inch|inches|mils?|moa|minutes?|left|right|high|low|up|down|short|over|under)\\b)";
    s = s.replace(new RegExp("\\b(?:to|too)\\b" + after, "g"), "2").replace(new RegExp("\\bfor\\b" + after, "g"), "4").replace(new RegExp("\\bwon\\b" + after, "g"), "1").replace(new RegExp("\\btree\\b" + after, "g"), "3");
    s = s.replace(/\ba couple( of)?\b/g, "2").replace(/\ba (quarter|half)\b/g, "$1").replace(/\b(half|quarter)\s+(?:of\s+)?an?\b/g, "$1");
    s = s.replace(/\b(zero|an?|half|quarter|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty)\b/g, w => String(NUMWORDS[w]));
    s = s.replace(/\bpoint (\d)/g, ".$1").replace(/(\d)\s*(?:and\s+)?(?:1\s+)?half\b/g, (m, d) => String(Number(d) + 0.5));
    return s;
  }
  const DIRS = { left: "left", right: "right", high: "high", up: "high", over: "high", above: "high", low: "low", down: "low", under: "low", short: "low", below: "low" };
  // Words that can sit between an amount and its direction: "2 inches to the left", "high by 3".
  const UNITWORD = /^(inches|inch|in|"|mils?|mrad|milliradians?|moa|minutes?|of|an|a|to|the|by|about|around|roughly|maybe|like|just|and|was|it|is|or|so|it's|its)$/;
  function parseCall(text) {
    if (!text) return null;
    const s = normalizeCall(text);
    let unit = "in";
    if (/\b(mils?|mrad|milliradians?)\b/.test(s)) unit = "MIL";
    else if (/\b(moa|minutes?)\b/.test(s)) unit = "MOA";
    // "3 inches at 4 o'clock": a distance and a clock direction.
    const ck = s.match(/(\d*\.?\d+)\s*(?:inches|inch|moa|minutes?|mils?)?\s*(?:at|toward|towards)?\s*(\d{1,2})\s*o'?\s*clock/);
    if (ck && !/\b(left|right|high|low|up|down|wind)\b/.test(s) && Number(ck[2]) >= 1 && Number(ck[2]) <= 12) {
      const r = Number(ck[1]), a = (Number(ck[2]) % 12) * Math.PI / 6, rd = v => Math.round(v * 100) / 100;
      return { x: rd(r * Math.sin(a)), y: rd(r * Math.cos(a)), unit, missing: [], vague: [], center: false, miss: false };
    }
    const tok = s.match(/\d*\.?\d+|[a-z']+|"/g) || [];
    const vague = [];
    const isNum = t => /^\d*\.?\d+$/.test(t) || t === "vague";
    const firstSig = tok.find(t => isNum(t) || DIRS[t]);
    const dirFirst = !!(firstSig && DIRS[firstSig]);
    const used = new Set(), found = {}, missing = [];
    const take = (from, step) => {
      for (let k = from, hops = 0; k >= 0 && k < tok.length && hops < 4; k += step, hops++) {
        const t = tok[k];
        if (isNum(t)) return used.has(k) ? null : k;
        if (DIRS[t] || !UNITWORD.test(t)) return null;
      }
      return null;
    };
    tok.forEach((t, i) => {
      const d = DIRS[t];
      if (!d) return;
      const axis = d === "left" || d === "right" ? "x" : "y";
      if (found[axis] != null) return;
      let k = dirFirst ? take(i + 1, 1) : take(i - 1, -1);
      if (k == null) k = dirFirst ? take(i - 1, -1) : take(i + 1, 1);
      if (k == null) { missing.push(d); found[axis] = 0; return; }
      used.add(k);
      if (tok[k] === "vague") vague.push(d);
      const v = tok[k] === "vague" ? 1 : Number(tok[k]);
      found[axis] = d === "left" || d === "low" ? -v : v;
    });
    const anyDir = found.x != null || found.y != null;
    const miss = /\b(miss|missed|no hit|didn't see|did not see|no impact|didn't hit|did not hit|nothing|no splash)\b/.test(s) && !anyDir;
    const center = !anyDir && !miss && /\b(center|centre|bullseye|bull's eye|x ring|dead on|on target|good hit|good shot|nice shot|hit|hits|hit it|impact|ding|dinged|ring|rang|clang|steel|perfect|nailed it|smack|smacked|smoked it|got it|on it|center mass)\b/.test(s);
    if (!anyDir && !center && !miss) return null;
    return { x: found.x || 0, y: found.y || 0, unit, missing, vague, center, miss };
  }
  function parseSpotterCall(text) {
    const c = parseCall(text);
    if (!c || c.miss || c.missing.length) return null;
    return { x: c.x, y: c.y, unit: c.unit };
  }

  /**
   * Typical factory loads (velocity from the maker's test barrel, published G1 BC).
   * Used when the shooter only gives caliber + grain weight.
   */
  const LOADS = [
    { key: "223", label: ".223 Rem / 5.56", match: /(^|\D)(223|5\.?56)(\D|$)/, testBarrel: 24, fpsPerIn: 25, sight: 2.6, twist: "1:8", diameter: 0.224, loads: [[55, 3240, 0.255], [62, 3020, 0.304], [69, 2950, 0.301], [77, 2720, 0.372]] },
    { key: "308", label: ".308 Win / 7.62x51", match: /(^|\D)(308|7\.?62\s*x?\s*51|7\.62 nato)(\D|$)/, testBarrel: 24, fpsPerIn: 28, sight: 1.75, twist: "1:10", diameter: 0.308, loads: [[150, 2820, 0.408], [165, 2700, 0.435], [168, 2650, 0.462], [175, 2600, 0.505], [178, 2600, 0.547], [180, 2620, 0.383]] },
    { key: "65cm", label: "6.5 Creedmoor", match: /6\.?5\s*(cm|creed)/, testBarrel: 24, fpsPerIn: 25, sight: 1.75, twist: "1:8", diameter: 0.264, loads: [[130, 2800, 0.510], [140, 2710, 0.646], [143, 2700, 0.625], [147, 2695, 0.697]] },
    { key: "3006", label: ".30-06 Springfield", match: /30\s*[-.]?\s*0?6|3006/, testBarrel: 24, fpsPerIn: 25, sight: 1.75, twist: "1:10", diameter: 0.308, loads: [[150, 2910, 0.409], [165, 2800, 0.447], [168, 2700, 0.462], [180, 2700, 0.452]] },
    { key: "300wm", label: ".300 Win Mag", match: /300\s*(win|wm|w\.?m|mag)/, testBarrel: 24, fpsPerIn: 30, sight: 1.75, twist: "1:10", diameter: 0.308, loads: [[180, 2960, 0.507], [190, 2900, 0.533], [200, 2850, 0.597], [212, 2860, 0.673]] },
    { key: "300blk", label: ".300 Blackout", match: /300\s*(blk|black|aac)/, testBarrel: 16, fpsPerIn: 15, sight: 2.6, twist: "1:8", diameter: 0.308, loads: [[110, 2350, 0.289], [125, 2185, 0.334], [220, 1000, 0.600]] },
    { key: "6cm", label: "6mm Creedmoor", match: /6\s*mm\s*(cm|creed)|6\s*creed|6cm/, testBarrel: 24, fpsPerIn: 25, sight: 1.75, twist: "1:7.5", diameter: 0.243, loads: [[103, 3050, 0.512], [108, 2960, 0.536]] },
    { key: "243", label: ".243 Win", match: /(^|\D)243(\D|$)/, testBarrel: 24, fpsPerIn: 25, sight: 1.75, twist: "1:10", diameter: 0.243, loads: [[95, 3100, 0.379], [100, 2960, 0.381]] },
    { key: "270", label: ".270 Win", match: /(^|\D)270(\D|$)/, testBarrel: 24, fpsPerIn: 25, sight: 1.75, twist: "1:10", diameter: 0.277, loads: [[130, 3060, 0.409], [140, 2950, 0.460], [150, 2850, 0.480]] },
    { key: "7rm", label: "7mm Rem Mag", match: /7\s*mm\s*(rem|mag)|7\s*rm/, testBarrel: 24, fpsPerIn: 30, sight: 1.75, twist: "1:9", diameter: 0.284, loads: [[150, 3110, 0.456], [162, 2940, 0.631], [175, 2860, 0.462]] },
    { key: "65prc", label: "6.5 PRC", match: /6\.?5\s*prc/, testBarrel: 24, fpsPerIn: 30, sight: 1.75, twist: "1:8", diameter: 0.264, loads: [[143, 2960, 0.625], [147, 2910, 0.697]] },
    { key: "338lm", label: ".338 Lapua Mag", match: /338\s*(lap|lm)/, testBarrel: 27, fpsPerIn: 30, sight: 1.75, twist: "1:10", diameter: 0.338, loads: [[250, 2950, 0.648], [285, 2745, 0.789], [300, 2660, 0.768]] },
    { key: "65g", label: "6.5 Grendel", match: /6\.?5\s*gren/, testBarrel: 24, fpsPerIn: 25, sight: 2.6, twist: "1:8", diameter: 0.264, loads: [[123, 2580, 0.510]] },
    { key: "224v", label: ".224 Valkyrie", match: /224\s*val/, testBarrel: 24, fpsPerIn: 25, sight: 2.6, twist: "1:7", diameter: 0.224, loads: [[75, 3000, 0.435], [90, 2700, 0.563]] },
    { key: "22lr", label: ".22 LR", match: /22\s*(lr|long)/, testBarrel: 24, fpsPerIn: 0, sight: 1.5, twist: "1:16", diameter: 0.223, loads: [[36, 1280, 0.125], [40, 1070, 0.138]] }
  ];
  function caliberFor(text) {
    const t = String(text || "").toLowerCase();
    return LOADS.find(c => c.key === t) || LOADS.find(c => c.match.test(t)) || null;
  }
  /** Look up a typical load. Returns {caliber, grains, mv, bc, drag, nearest, testBarrel, barrelIn} or null. */
  function lookupLoad(caliber, grains, barrelIn) {
    const c = typeof caliber === "object" && caliber ? caliber : caliberFor(caliber);
    if (!c) return null;
    const g = Number(grains);
    let best = c.loads[0];
    if (g > 0) best = c.loads.reduce((a, l) => (Math.abs(l[0] - g) < Math.abs(a[0] - g) ? l : a), best);
    const barrel = Number(barrelIn) > 0 ? Math.min(34, Math.max(6, Number(barrelIn))) : c.testBarrel;
    const mv = Math.round(best[1] - c.fpsPerIn * (c.testBarrel - barrel));
    return { caliber: c, grains: best[0], requestedGrains: g || best[0], exact: !(g > 0) || best[0] === g, mv, factoryMv: best[1], bc: best[2], drag: "G1", testBarrel: c.testBarrel, barrelIn: barrel, sightHeightIn: c.sight, twist: c.twist, diameterIn: c.diameter };
  }

  /** Group statistics for impacts [{x,y}] in inches. */
  function groupStats(points) {
    const pts = (points || []).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (!pts.length) return null;
    const mx = pts.reduce((a, p) => a + p.x, 0) / pts.length, my = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    let es = 0;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) es = Math.max(es, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
    const radii = pts.map(p => Math.hypot(p.x - mx, p.y - my));
    const meanRadius = radii.reduce((a, b) => a + b, 0) / pts.length;
    const sd = pts.length > 1 ? Math.sqrt(pts.reduce((a, p) => a + (p.x - mx) ** 2 + (p.y - my) ** 2, 0) / (2 * (pts.length - 1))) : 0;
    return { count: pts.length, meanX: mx, meanY: my, extremeSpread: es, meanRadius, radialSD: sd };
  }

  return { solve, atmosphere, cd, windComponents, millerStability, parseTwist, impactCorrection, trueVelocity, parseSpotterCall, parseCall, LOADS, caliberFor, lookupLoad, groupStats, toMOA, toMIL, TABLES, CONST: C };
});
