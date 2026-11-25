// Keyboard and pointer input. Held keys are not needed here: every press is a
// one-shot action, queued as a bit flag and taken once by the loop, so a press
// between two frames is never lost and never counted twice. Pointer clicks are
// queued with their position, so the loop can hit-test them against the kiosk.

export const ACTION_CONFIRM = 1;
export const ACTION_SHAVE = 2;
export const ACTION_SERVE = 4;
export const ACTION_PAUSE = 8;
export const ACTION_RESTART = 16;

const SHAVE = new Set(['Space']);
const SERVE = new Set(['Enter']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const RESTART = new Set(['KeyR']);
const DIGITS = new Set(['Digit1', 'Digit2', 'Digit3']);

export function createInput(target) {
  let actions = 0;
  let digit = 0;
  const clicks = [];

  window.addEventListener('keydown', (event) => {
    if (SHAVE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_SHAVE | ACTION_CONFIRM;
    } else if (SERVE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_SERVE | ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else if (DIGITS.has(event.code)) {
      if (!event.repeat) digit = Number(event.code.slice(-1));
    } else return;
    event.preventDefault();
  });
  // A key released while the tab is hidden never sends keyup; nothing here is held,
  // so there is nothing to let go of on blur.
  target.addEventListener('pointerdown', (event) => {
    const rect = target.getBoundingClientRect();
    clicks.push({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  });

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The 1, 2 or 3 key pressed since the last call, or 0. */
    takeDigit() {
      const taken = digit;
      digit = 0;
      return taken;
    },
    /** The pointer clicks since the last call, in the canvas's CSS pixels. */
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
  };
}
