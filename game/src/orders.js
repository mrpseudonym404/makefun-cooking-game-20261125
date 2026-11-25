// The order board: what a ticket asks for, whether a bowl matches it, and how far
// along a bowl is. An order is a set of toppings plus one syrup; the bowl must hold
// exactly those toppings, shaved ice and that syrup, nothing more.

import { RECIPE_TOPPING_COUNT, SYRUPS, TOPPINGS } from './config.js';
import { pick, shuffled } from './random.js';

/** Deal one fresh order for the given level: 2 toppings early, up to 4 later. */
export function createOrder(random, level) {
  const count = RECIPE_TOPPING_COUNT[Math.min(level, RECIPE_TOPPING_COUNT.length) - 1];
  const toppings = shuffled(random, TOPPINGS)
    .slice(0, count)
    .map((topping) => topping.id);
  const syrup = pick(random, SYRUPS).id;
  return { toppings, syrup };
}

/** True when the bowl holds exactly the order: same toppings, ice in, syrup poured. */
export function orderMatches(order, bowl) {
  if (!bowl.ice || bowl.syrup !== order.syrup) return false;
  if (bowl.toppings.length !== order.toppings.length) return false;
  for (const topping of order.toppings) {
    if (!bowl.toppings.includes(topping)) return false;
  }
  return true;
}

/**
 * How much of the order the bowl already has, 0 to 1: each topping wanted, the ice
 * and the syrup count as one step each. Drives the progress bar under the ticket.
 */
export function orderProgress(order, bowl) {
  const steps = order.toppings.length + 2;
  let done = bowl.ice ? 1 : 0;
  if (bowl.syrup === order.syrup) done += 1;
  for (const topping of order.toppings) {
    if (bowl.toppings.includes(topping)) done += 1;
  }
  return done / steps;
}

/** The topping ids the order still needs (for the arrow hint on the active ticket). */
export function orderMissing(order, bowl) {
  return order.toppings.filter((topping) => !bowl.toppings.includes(topping));
}
