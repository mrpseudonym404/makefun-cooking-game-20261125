// Es Campur Rush — every tuning number, colour and recipe in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One full shift, in seconds. */
export const SHIFT_SECONDS = 90;

/** How many order tickets the board holds at once. */
export const MAX_TICKETS = 3;

/** Score for a correct serve, before the time bonus and the combo multiplier. */
export const SERVE_POINTS = 100;
/** Extra points per second of patience left on the served order. */
export const PATIENCE_BONUS_PER_SECOND = 4;
/** Points lost when an order walks away unserved. */
export const WALKOUT_PENALTY = 25;
/** Points lost when the player serves a bowl that does not match the order. */
export const WRONG_SERVE_PENALTY = 15;

/** How fast new orders arrive, and how patient they are, by level. */
export const ORDERS = {
  firstDelay: 1.2,
  spawnInterval: 9,
  spawnIntervalPerLevel: 0.8,
  minSpawnInterval: 4.5,
  patience: 45,
  patiencePerLevel: -2.5,
  minPatience: 26,
};

/** A level lasts this many seconds; difficulty stops growing at the last level. */
export const LEVEL = { seconds: 18, max: 6 };

/** The five topping jars on the counter, left to right. */
export const TOPPINGS = [
  { id: 'cendol', name: 'Cendol', color: '#37b24d', dark: '#2b8a3e', light: '#69db7c' },
  { id: 'kacang', name: 'Kacang Merah', color: '#e03131', dark: '#a61e1e', light: '#ff6b6b' },
  { id: 'kelapa', name: 'Kelapa Muda', color: '#f8f9fa', dark: '#ced4da', light: '#ffffff' },
  { id: 'nangka', name: 'Nangka', color: '#f59f00', dark: '#c47f00', light: '#ffd43b' },
  { id: 'cincau', name: 'Cincau', color: '#343a40', dark: '#1b1e21', light: '#5c5f66' },
];

/** The three syrup bottles. An order names one of these. */
export const SYRUPS = [
  { id: 'stroberi', name: 'Stroberi', color: '#f783ac', dark: '#d6336c', light: '#ffa8c5' },
  { id: 'melon', name: 'Melon', color: '#94d82d', dark: '#66a80f', light: '#b2f2bb' },
  { id: 'gula', name: 'Gula Aren', color: '#8d5a2b', dark: '#5f3a17', light: '#b07a45' },
];

/** How many toppings an order asks for, by level: level 1 asks 2, later levels up to 4. */
export const RECIPE_TOPPING_COUNT = [2, 2, 3, 3, 4, 4];

/** The cold night-market palette: blue night, white ice, pink syrup, green cendol. */
export const PALETTE = {
  nightTop: '#0b1026',
  nightBottom: '#1b2a52',
  bokehBlue: '#3b5bdb',
  bokehPink: '#f783ac',
  awning: '#12224e',
  awningStripe: '#f783ac',
  counterTop: '#8d5a2b',
  counterFront: '#5f3a17',
  counterEdge: '#3d2408',
  board: '#101a3a',
  boardEdge: '#2b3a6b',
  ticket: '#f1f3f5',
  ticketActive: '#fff9db',
  ticketDim: '#868e96',
  ticketDone: '#b2f2bb',
  ink: '#212529',
  muted: '#868e96',
  text: '#f8f9fa',
  gold: '#ffd43b',
  bell: '#ffd43b',
  bellDark: '#e67700',
  serve: '#2f9e44',
  serveGlow: '#69db7c',
  serveText: '#ffffff',
  timerPill: '#101a3a',
  timerLow: '#e03131',
  timerBar: '#ffd43b',
  ice: '#e7f5ff',
  iceShade: '#a5d8ff',
  glass: 'rgba(231, 245, 255, 0.55)',
  glassEdge: '#d0ebff',
  wood: '#8d5a2b',
  woodDark: '#5f3a17',
  jarGlass: 'rgba(255, 255, 255, 0.28)',
  steam: 'rgba(231, 245, 255, 0.5)',
  lightWarm: '#ffd43b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'es-campur-rush.best';
