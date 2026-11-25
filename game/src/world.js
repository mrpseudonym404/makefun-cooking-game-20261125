// The game's rules and state, with no drawing and no browser in it: the shift timer,
// the order board, the bowl being assembled, the tray with the last served bowl,
// score and combo. step() advances one fixed step and returns what happened as bit
// flags, so the caller can react without the world knowing about screens.

import {
  LEVEL,
  MAX_TICKETS,
  ORDERS,
  PATIENCE_BONUS_PER_SECOND,
  SERVE_POINTS,
  SHIFT_SECONDS,
  WALKOUT_PENALTY,
  WRONG_SERVE_PENALTY,
} from './config.js';
import { createOrder, orderMatches } from './orders.js';

export const EVENT_SERVED = 1;
export const EVENT_WRONG = 2;
export const EVENT_WALKOUT = 4;
export const EVENT_OVER = 8;
export const EVENT_TICKET = 16;

function emptyBowl() {
  return { toppings: [], ice: false, iceAnim: 0, syrup: null, pour: 0 };
}

export function createWorld(random) {
  const state = {
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    level: 1,
    tickets: [],
    active: 0,
    bowl: emptyBowl(),
    tray: null,
    spawnTimer: ORDERS.firstDelay,
    over: false,
  };

  function patienceForLevel() {
    return Math.max(
      ORDERS.minPatience,
      ORDERS.patience + ORDERS.patiencePerLevel * (state.level - 1),
    );
  }

  function spawnIntervalForLevel() {
    return Math.max(
      ORDERS.minSpawnInterval,
      ORDERS.spawnInterval - ORDERS.spawnIntervalPerLevel * (state.level - 1),
    );
  }

  function dealTicket() {
    const patience = patienceForLevel();
    state.tickets.push({ ...createOrder(random, state.level), patience, maxPatience: patience });
    return EVENT_TICKET;
  }

  function reset() {
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.served = 0;
    state.timeLeft = SHIFT_SECONDS;
    state.elapsed = 0;
    state.level = 1;
    state.tickets = [];
    state.active = 0;
    state.bowl = emptyBowl();
    state.tray = null;
    state.spawnTimer = ORDERS.firstDelay;
    state.over = false;
    dealTicket();
  }

  /** Point at another ticket on the board; the bowl stays as it is. */
  function selectTicket(index) {
    if (index >= 0 && index < state.tickets.length) state.active = index;
  }

  /**
   * Toggle a topping in the bowl: tapping a jar adds it, tapping it again takes it
   * back out, so a wrong topping can always be fixed without starting over.
   */
  function toggleTopping(id) {
    const at = state.bowl.toppings.indexOf(id);
    if (at >= 0) state.bowl.toppings.splice(at, 1);
    else if (state.bowl.toppings.length < 5) state.bowl.toppings.push(id);
  }

  /** Shave ice into the bowl (once per bowl). */
  function shaveIce() {
    if (!state.bowl.ice) {
      state.bowl.ice = true;
      state.bowl.iceAnim = 0;
    }
  }

  /** Pour a syrup over the bowl; pouring again swaps the syrup. */
  function pourSyrup(id) {
    if (state.bowl.syrup !== id) {
      state.bowl.syrup = id;
      state.bowl.pour = 0;
    }
  }

  /**
   * Serve the active order. A matching bowl scores the base points plus a bonus
   * for the patience left, multiplied by the combo; a wrong bowl costs points and
   * the combo, and the bowl stays so the player can fix it.
   */
  function serve() {
    const order = state.tickets[state.active];
    if (!order || state.over) return 0;
    if (!orderMatches(order, state.bowl)) {
      state.score = Math.max(0, state.score - WRONG_SERVE_PENALTY);
      state.combo = 0;
      return EVENT_WRONG;
    }
    const bonus = Math.round(order.patience) * PATIENCE_BONUS_PER_SECOND;
    const gained = Math.round((SERVE_POINTS + bonus) * (1 + state.combo * 0.2));
    state.score += gained;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.served += 1;
    state.tray = { toppings: state.bowl.toppings.slice(), syrup: state.bowl.syrup };
    state.tickets.splice(state.active, 1);
    state.active = 0;
    state.bowl = emptyBowl();
    return EVENT_SERVED;
  }

  /** One fixed step: the clock, the level, new orders, draining patience, pours. */
  function step(dt) {
    let events = 0;
    if (state.over) return events;
    state.elapsed += dt;
    state.timeLeft -= dt;
    state.level = Math.min(LEVEL.max, 1 + Math.floor(state.elapsed / LEVEL.seconds));
    if (state.bowl.pour < 1 && state.bowl.syrup !== null) {
      state.bowl.pour = Math.min(1, state.bowl.pour + dt * 1.8);
    }
    if (state.bowl.ice && state.bowl.iceAnim < 1) {
      state.bowl.iceAnim = Math.min(1, state.bowl.iceAnim + dt * 2.2);
    }
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      if (state.tickets.length < MAX_TICKETS) events |= dealTicket();
      state.spawnTimer += spawnIntervalForLevel();
    }
    for (let index = state.tickets.length - 1; index >= 0; index -= 1) {
      const ticket = state.tickets[index];
      ticket.patience -= dt;
      if (ticket.patience > 0) continue;
      state.tickets.splice(index, 1);
      if (state.active >= state.tickets.length) state.active = Math.max(0, state.tickets.length - 1);
      state.score = Math.max(0, state.score - WALKOUT_PENALTY);
      state.combo = 0;
      events |= EVENT_WALKOUT;
    }
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.over = true;
      events |= EVENT_OVER;
    }
    return events;
  }

  reset();
  return { state, reset, step, selectTicket, toggleTopping, shaveIce, pourSyrup, serve };
}
