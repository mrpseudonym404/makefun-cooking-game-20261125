# Es Campur Rush

[![make.fun bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/mrpseudonym404/makefun-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/mrpseudonym404/makefun-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A night-market es campur stall, built for the [make.fun best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137). Not another burger joint: a cold dessert kiosk under string lights, where every order is a bowl of shaved ice that has to be built topping by topping before the shift ends.

## How to play

Orders arrive on the board (top-left), up to three at a time. Each one names its toppings and its syrup. Build the bowl in the middle:

1. **Click a topping jar** (bottom-left) to add that topping — click it again to take it back out.
2. **Click the ice shaver** (or press Space) to shave ice into the bowl.
3. **Click a syrup bottle** (bottom-right) to pour that syrup.
4. **Click SAJIKAN!** (or press Enter) to serve the active order.

A bowl that matches the order exactly scores 100 points plus a bonus for the patience left on the ticket, multiplied by the combo. A wrong bowl costs points and the combo. An order that waits too long walks away. The shift lasts 90 seconds; new orders arrive faster and ask for more toppings as the level rises.

Keys: **1–3** pick an order, **Space** shaves ice, **Enter** serves, **P** pauses, **R** restarts after time runs out. Mouse works for everything too.

## Run it

No build step, no network request. Serve `game/` with any static server and open it in desktop Chrome:

```sh
python3 -m http.server 8123 --directory game
# open http://127.0.0.1:8123/
```

(The game uses ES modules, so `file://` will not load it.)

Screenshots are staged scenes of the real game: `?shot=cover|toppings|syrup|serve&seed=1` — see `shots.json`.

## Structure

- `game/index.html` — the page and the canvas.
- `game/src/config.js` — every tuning number, colour, topping and syrup.
- `game/src/random.js` — the seeded generator behind the orders.
- `game/src/orders.js` — what a ticket asks for, and whether a bowl matches it.
- `game/src/world.js` — the rules: the clock, the board, the bowl, score and combo.
- `game/src/input.js` — keyboard and pointer input, queued per frame.
- `game/src/render.js` — drawing only: the kiosk, the bowl, the jars, the timer.
- `game/src/shots.js` — the four staged screenshot scenes.
- `game/src/main.js` — boot and the one loop.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library.
- `vendor/makefun-game.ts` — the kit's copy, unchanged.

## License

MIT — see [LICENSE](LICENSE).
