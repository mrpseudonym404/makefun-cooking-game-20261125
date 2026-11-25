// Boot and the one loop: clicks and keys are read every frame, the world advances
// in fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between four screens: title, play,
// paused and game over. A click is hit-tested against the kiosk's zones — a ticket,
// a topping jar, the ice shaver, a syrup bottle, the bell or the serve button —
// and the world answers with the matching rule.
//
// ?seed=N fixes the order pattern. ?shot=cover|toppings|syrup|serve (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_OVER, EVENT_SERVED, EVENT_WALKOUT, EVENT_WRONG } from './world.js';
import {
  ACTION_CONFIRM,
  ACTION_PAUSE,
  ACTION_RESTART,
  ACTION_SERVE,
  ACTION_SHAVE,
  createInput,
} from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name);
  renderer.setCamera(scene.camera.scale, scene.camera.cx, scene.camera.cy);
  let painted = 0;
  // Paint every frame, not just twice: a resize clears the canvas, and a
  // screenshot taken after one must still find the scene painted.
  function paint() {
    renderer.draw(scene.state, scene.screen, 0);
    painted += 1;
    if (painted === 2) window.__shotReady = true;
    requestAnimationFrame(paint);
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each serve.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Serve the orders before the shift ends.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Time. Score ${world.state.score}. Best ${best}.`);
  }

  /** Answer one click on the kiosk: the zone it hit decides the rule that runs. */
  function handleClick(clientX, clientY) {
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      startGame();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const point = renderer.toLogical(clientX, clientY);
    const zone = renderer.zoneAt(point.x, point.y);
    if (zone === null) return;
    if (zone.type === 'ticket') world.selectTicket(zone.index);
    else if (zone.type === 'jar') world.toggleTopping(zone.id);
    else if (zone.type === 'shaver') world.shaveIce();
    else if (zone.type === 'syrup') world.pourSyrup(zone.id);
    else if (zone.type === 'serve') {
      const events = world.serve();
      if (events & EVENT_SERVED) announce(`Served. Score ${world.state.score}.`);
      else if (events & EVENT_WRONG) announce('That bowl does not match the order.');
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    const digit = input.takeDigit();
    if (digit >= 1 && digit <= 3 && screen === SCREEN_PLAY) world.selectTicket(digit - 1);
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    if (actions & ACTION_RESTART && screen === SCREEN_OVER) startGame();
    if (actions & ACTION_SHAVE && screen === SCREEN_PLAY) world.shaveIce();
    if (actions & ACTION_SERVE && screen === SCREEN_PLAY) {
      const events = world.serve();
      if (events & EVENT_SERVED) announce(`Served. Score ${world.state.score}.`);
      else if (events & EVENT_WRONG) announce('That bowl does not match the order.');
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
  }

  function step() {
    const events = world.step(STEP);
    if (events & EVENT_WALKOUT) announce('An order walked away.');
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    for (const click of input.takeClicks()) handleClick(click.x, click.y);
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting orders walk away unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Es Campur Rush. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
