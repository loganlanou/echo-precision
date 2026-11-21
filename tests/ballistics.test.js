// Run with: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const B = require("../ballistics.js");

const ref = { muzzleVelocityFps: 2600, ballisticCoefficient: 0.505, dragModel: "G1", weightGr: 175,
  sightHeightIn: 1.5, zeroYd: 100, spinDrift: false, coriolis: false, maxRangeYd: 1000 };

test("drag tables interpolate", () => {
  assert.equal(B.cd("G1", 1), 0.4805);
  assert.ok(Math.abs(B.cd("G7", 0.9875) - (0.2993 + 0.3803) / 2) < 1e-9);
  assert.equal(B.cd("G1", 9), 0.4988);
});

test("standard atmosphere", () => {
  const a = B.atmosphere({});
  assert.ok(Math.abs(a.density - 1.225) < 0.003, a.density);
  assert.ok(Math.abs(a.speedOfSound - 340.3) < 0.5, a.speedOfSound);
  const high = B.atmosphere({ altitudeM: 1500 });
  assert.ok(high.density < a.density * 0.88);
});

test("zero distance gives zero drop", () => {
  const r = B.solve({ ...ref, rangeYd: 100 });
  assert.ok(Math.abs(r.target.dropIn) < 0.01);
});

test(".308 175gr SMK matches published tables within tolerance", () => {
  const r = B.solve({ ...ref, rangeYd: 1000, windMph: 10, windFromDeg: 270, headingDeg: 0 });
  const t = r.target;
  assert.ok(t.elevMOA > 35 && t.elevMOA < 41, "elevation " + t.elevMOA);
  assert.ok(t.windMOA < -8 && t.windMOA > -11, "windage " + t.windMOA); // wind from left → dial left
  assert.ok(t.velocityFps > 1100 && t.velocityFps < 1300, "velocity " + t.velocityFps);
});

test("wind direction relative to heading", () => {
  const head = B.solve({ ...ref, rangeYd: 600, windMph: 10, windFromDeg: 0, headingDeg: 0 }).target;
  const cross = B.solve({ ...ref, rangeYd: 600, windMph: 10, windFromDeg: 90, headingDeg: 0 }).target;
  const rotated = B.solve({ ...ref, rangeYd: 600, windMph: 10, windFromDeg: 180, headingDeg: 90 }).target;
  assert.ok(Math.abs(head.windIn) < 0.1);
  assert.ok(cross.windIn < -20, "wind from right pushes left");
  assert.ok(Math.abs(rotated.windIn - cross.windIn) < 0.01, "same relative wind gives same drift");
});

test("denser air means more drop", () => {
  const cold = B.solve({ ...ref, rangeYd: 800, env: { temperatureF: 10 } }).target.elevMOA;
  const hot = B.solve({ ...ref, rangeYd: 800, env: { temperatureF: 100 } }).target.elevMOA;
  assert.ok(cold > hot);
});

test("uphill/downhill shots need less elevation", () => {
  const level = B.solve({ ...ref, rangeYd: 600 }).target.elevMOA;
  const angled = B.solve({ ...ref, rangeYd: 600, angleDeg: 20 }).target.elevMOA;
  assert.ok(angled < level);
});

test("spin drift goes right for right twist", () => {
  const r = B.solve({ ...ref, spinDrift: true, twist: "1:10", diameterIn: 0.308, lengthIn: 1.24, rangeYd: 1000 });
  assert.ok(r.stability > 2 && r.stability < 3, "Sg " + r.stability);
  assert.ok(r.target.spinDriftIn > 5 && r.target.spinDriftIn < 20);
});

test("clicks follow click value", () => {
  const r = B.solve({ ...ref, rangeYd: 500, clickUnit: "MIL", clickValue: 0.1 });
  assert.equal(r.target.elevClicks, Math.round(r.target.elevMIL / 0.1));
});

test("impact correction", () => {
  const c = B.impactCorrection(1.047197551 * 2, -1.047197551 * 4, 200, "MOA", 0.25);
  assert.ok(Math.abs(c.elevation - 2) < 1e-9);
  assert.ok(Math.abs(c.windage + 1) < 1e-9);
  assert.equal(c.elevClicks, 8);
});

test("true velocity recovers the MV", () => {
  const e = B.solve({ ...ref, rangeYd: 900 }).target.elevMOA;
  const mv = B.trueVelocity({ ...ref, muzzleVelocityFps: 2800 }, 900, e, "MOA");
  assert.ok(Math.abs(mv - 2600) < 2, mv);
});

test("spotter call parsing", () => {
  assert.deepEqual(B.parseSpotterCall("two inches low and one right"), { x: 1, y: -2, unit: "in" });
  assert.deepEqual(B.parseSpotterCall("hit point three mil high"), { x: 0, y: 0.3, unit: "MIL" });
  assert.deepEqual(B.parseSpotterCall("half moa left"), { x: -0.5, y: 0, unit: "MOA" });
  assert.deepEqual(B.parseSpotterCall("dead center"), { x: 0, y: 0, unit: "in" });
  assert.equal(B.parseSpotterCall("nice wind today"), null);
});

test("group stats", () => {
  const g = B.groupStats([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }]);
  assert.equal(g.count, 3);
  assert.ok(Math.abs(g.meanX - 1) < 1e-9);
  assert.equal(g.extremeSpread, 2);
});

test("rejects bad input", () => {
  assert.equal(B.solve({ ballisticCoefficient: 0.5 }).ok, false);
});

test("spotter calls in plain words", () => {
  assert.deepEqual(B.parseSpotterCall("two inches to the left"), { x: -2, y: 0, unit: "in" });
  assert.deepEqual(B.parseSpotterCall("high by 3"), { x: 0, y: 3, unit: "in" });
  assert.deepEqual(B.parseCall("a little right").vague, ["right"]);
  assert.equal(B.parseCall("right on").center, true);
});

test("gunshot check rejects claps and thuds", () => {
  const sr = 48000, pre = 960, len = pre + 9600;
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 * 2 - 1; };
  const noise = Array.from({ length: len }, rnd);
  let y = 0; const a = Math.exp(-2 * Math.PI * 300 / sr), low = noise.map(v => (y = (1 - a) * v + a * y));
  const mk = fn => { const w = new Float32Array(len); for (let i = 0; i < len; i++) { const t = (i - pre) / sr; w[i] = Math.max(-1, Math.min(1, 0.003 * rnd() + (t >= 0 ? fn(t, i) : 0))); } return w; };
  const shot = mk((t, i) => (t < 0.0018 ? 1.6 * (1 - 2 * t / 0.0018) : 0) + 0.5 * Math.exp(-t / 0.03) * (noise[i] * 0.5 + low[i] * 6));
  const clap = mk((t, i) => 0.9 * (noise[i] - low[i] * 1.2) * Math.exp(-t / 0.004) * Math.min(1, t / 0.0003));
  const thud = mk(t => 0.9 * Math.sin(2 * Math.PI * 110 * t) * Math.exp(-t / 0.03) * Math.min(1, t / 0.002));
  assert.equal(B.gunCheck(shot, sr, pre).ok, true);
  assert.equal(B.gunCheck(clap, sr, pre).ok, false);
  assert.equal(B.gunCheck(thud, sr, pre).ok, false);
});
