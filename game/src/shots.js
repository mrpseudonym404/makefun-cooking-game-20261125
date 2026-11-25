// The screenshot scenes behind ?shot=cover|toppings|syrup|serve. Each one is a
// fixed, hand-built state — the same bowl, tickets, timer and tray every time —
// so a screenshot is a real frame of the game with nothing left to chance. The
// cover shows the whole kiosk; the other three zoom the camera into one part of
// it, so the four shots are four different framings, not four zooms of one frame.
import { SCREEN_PLAY } from './render.js';

function ticket(toppings, syrup, patience, maxPatience) {
  return { toppings, syrup, patience, maxPatience };
}

function baseState() {
  return {
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    timeLeft: 90,
    elapsed: 0,
    level: 1,
    tickets: [],
    active: 0,
    bowl: { toppings: [], ice: false, iceAnim: 0, syrup: null, pour: 0 },
    tray: null,
    spawnTimer: 9,
    over: false,
  };
}

function fullBoard() {
  return [
    ticket(['cendol', 'kacang', 'nangka'], 'stroberi', 32, 40),
    ticket(['kelapa', 'cincau'], 'melon', 18, 38),
    ticket(['cendol', 'nangka', 'cincau', 'kacang'], 'gula', 40, 42),
  ];
}

/**
 * Set the named scene (cover, toppings, syrup or serve; any other name is cover)
 * and return the state to draw, the screen to draw over it and the camera to use.
 */
export function stageShot(name) {
  const state = baseState();
  state.tickets = fullBoard();
  state.tray = { toppings: ['cendol', 'kelapa'], syrup: 'melon' };
  if (name === 'toppings') {
    state.score = 1250;
    state.combo = 3;
    state.served = 4;
    state.timeLeft = 47;
    state.elapsed = 25;
    state.level = 2;
    state.bowl = { toppings: ['cendol'], ice: true, iceAnim: 1, syrup: null, pour: 0 };
    return { state, screen: SCREEN_PLAY, camera: { scale: 2.0, cx: 190, cy: 565 } };
  }
  if (name === 'syrup') {
    state.score = 1250;
    state.combo = 3;
    state.served = 4;
    state.timeLeft = 47;
    state.elapsed = 25;
    state.level = 2;
    state.bowl = { toppings: ['cendol', 'kacang', 'nangka'], ice: true, iceAnim: 1, syrup: 'stroberi', pour: 0.5 };
    return { state, screen: SCREEN_PLAY, camera: { scale: 1.45, cx: 660, cy: 320 } };
  }
  if (name === 'serve') {
    state.score = 2340;
    state.combo = 5;
    state.bestCombo = 5;
    state.served = 7;
    state.timeLeft = 12;
    state.elapsed = 78;
    state.level = 5;
    state.tickets[0] = ticket(['cendol', 'kacang', 'nangka', 'kelapa'], 'stroberi', 8, 40);
    state.bowl = { toppings: ['cendol', 'kacang', 'nangka', 'kelapa'], ice: true, iceAnim: 1, syrup: 'stroberi', pour: 1 };
    return { state, screen: SCREEN_PLAY, camera: { scale: 1.2, cx: 850, cy: 380 } };
  }
  // Cover, revised to Musryk's moment gate: the timer is 0:03 and the biggest
  // thing in the frame, the ice has spilled on the counter, the score shrinks
  // to a whisper and the combo is gone — nothing leaks the outcome, so the
  // frame reads as a question (will the bowl make it in time?), not an answer.
  state.score = 0;
  state.combo = 0;
  state.served = 0;
  state.timeLeft = 3;
  state.elapsed = 87;
  state.level = 1;
  state.tickets[0] = ticket(['cendol', 'kacang', 'nangka'], 'stroberi', 3, 40);
  state.bowl = { toppings: ['cendol', 'kacang'], ice: true, iceAnim: 1, syrup: 'stroberi', pour: 0.55 };
  state.spill = true;
  state.cover = true;
  return { state, screen: SCREEN_PLAY, camera: { scale: 1, cx: 640, cy: 360 } };
}
