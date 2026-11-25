// Drawing only: the kiosk's state and the current screen in, pixels out. The 1280x720
// playfield is scaled to fit the window and centred, the margin filled with the
// backdrop colour. One focal point rules the frame: the half-finished es campur
// bowl in the middle, about a quarter of the screen wide. The five things the brief
// asks for sit in a Z: the order board top-left, the topping counter bottom-left,
// the bowl in the middle, the timer top-right, the finished plate bottom-right.
// A camera can zoom into a part of the kiosk for the close-up screenshots.

import { FIELD, FONT, PALETTE, SHIFT_SECONDS, SYRUPS, TOPPINGS } from './config.js';
import { orderProgress } from './orders.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** Where the interactive things sit, in logical pixels: drawing and hit-testing share them. */
export const LAYOUT = {
  awning: { x: 0, y: 0, width: 1280, height: 64 },
  board: { x: 24, y: 148, width: 272, height: 300 },
  ticketHeight: 84,
  ticketGap: 10,
  bowl: { x: 640, y: 452, width: 300 },
  tray: { x: 984, y: 452, width: 272, height: 108 },
  bell: { x: 1152, y: 520, size: 56 },
  serve: { x: 984, y: 600, width: 272, height: 72 },
  jars: { x: 24, y: 540, width: 52, height: 96, gap: 4 },
  shaver: { x: 316, y: 476, width: 112, height: 160 },
  syrups: { x: 744, y: 516, width: 64, height: 120, gap: 16 },
  counterTop: 540,
  counterFront: 640,
};

const BOKEH = [
  { x: 120, y: 220, r: 46, color: '#3b5bdb', a: 0.16 },
  { x: 360, y: 120, r: 30, color: '#f783ac', a: 0.14 },
  { x: 900, y: 200, r: 56, color: '#3b5bdb', a: 0.13 },
  { x: 1120, y: 300, r: 38, color: '#94d82d', a: 0.1 },
  { x: 520, y: 90, r: 24, color: '#ffd43b', a: 0.16 },
  { x: 80, y: 420, r: 34, color: '#f783ac', a: 0.1 },
  { x: 1240, y: 140, r: 28, color: '#3b5bdb', a: 0.15 },
  { x: 700, y: 180, r: 20, color: '#ffd43b', a: 0.12 },
];

function toppingById(id) {
  return TOPPINGS.find((topping) => topping.id === id);
}

function syrupById(id) {
  return SYRUPS.find((syrup) => syrup.id === id);
}

function formatClock(seconds) {
  const left = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(left / 60);
  const rest = left % 60;
  return `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const camera = { scale: 1, cx: FIELD.width / 2, cy: FIELD.height / 2 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, weight) {
    const key = `${weight || ''}${size}`;
    if (!fonts.has(key)) fonts.set(key, `${weight ? `${weight} ` : ''}${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function pill(x, y, width, height, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fill();
  }

  function circle(x, y, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  function drawNightMarket() {
    const gradient = context.createLinearGradient(0, -200, 0, 920);
    gradient.addColorStop(0, PALETTE.nightTop);
    gradient.addColorStop(1, PALETTE.nightBottom);
    context.fillStyle = gradient;
    context.fillRect(-400, -200, 2080, 1120);
    for (const dot of BOKEH) {
      context.globalAlpha = dot.a;
      circle(dot.x, dot.y, dot.r, dot.color);
    }
    context.globalAlpha = 1;
  }

  function drawStringLights() {
    context.strokeStyle = 'rgba(255, 212, 59, 0.35)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(60, 64);
    context.quadraticCurveTo(640, 108, 1220, 64);
    context.stroke();
    for (let index = 0; index <= 14; index += 1) {
      const t = index / 14;
      const x = 60 + (1220 - 60) * t;
      const y = 64 + 44 * 4 * t * (1 - t) * 0.5 + 8;
      circle(x, y, 6, PALETTE.lightWarm);
      context.globalAlpha = 0.25;
      circle(x, y, 12, PALETTE.lightWarm);
      context.globalAlpha = 1;
    }
  }

  function drawAwning() {
    context.fillStyle = PALETTE.awning;
    context.fillRect(0, 0, FIELD.width, LAYOUT.awning.height);
    for (let index = 0; index < 16; index += 1) {
      context.fillStyle = index % 2 === 0 ? PALETTE.awningStripe : '#ffffff';
      context.fillRect(index * 80, LAYOUT.awning.height - 10, 80, 10);
    }
    context.globalAlpha = 0.35;
    text('ES CAMPUR RUSH', FIELD.width / 2 + 3, 49, 44, PALETTE.awningStripe, 'center', '800');
    context.globalAlpha = 1;
    text('ES CAMPUR RUSH', FIELD.width / 2, 46, 44, '#ffffff', 'center', '800');
    drawStringLights();
  }

  function drawHud(state) {
    text('SKOR', 24, 100, 18, PALETTE.muted, 'left', '700');
    text(String(state.score), 24, 132, 40, PALETTE.text, 'left', '800');
    if (state.combo >= 2) {
      const label = `KOMBO x${state.combo}`;
      const width = 30 + label.length * 13;
      pill(FIELD.width / 2 - width / 2, 84, width, 44, 22, PALETTE.gold);
      text(label, FIELD.width / 2, 115, 26, PALETTE.ink, 'center', '800');
    }
    const low = state.timeLeft < 30;
    pill(1010, 76, 246, 60, 14, PALETTE.timerPill);
    text(formatClock(state.timeLeft), 1133, 122, 52, low ? PALETTE.timerLow : '#ffffff', 'center', '800');
    const barWidth = 246 * Math.max(0, state.timeLeft / SHIFT_SECONDS);
    context.fillStyle = low ? PALETTE.timerLow : PALETTE.timerBar;
    context.fillRect(1010, 140, barWidth, 8);
  }

  function drawTicketDots(order, x, y) {
    let dotX = x;
    for (const id of order.toppings) {
      const topping = toppingById(id);
      circle(dotX + 9, y, 9, topping.color);
      context.strokeStyle = 'rgba(0,0,0,0.25)';
      context.lineWidth = 1;
      context.beginPath();
      context.arc(dotX + 9, y, 9, 0, Math.PI * 2);
      context.stroke();
      dotX += 24;
    }
    const syrup = syrupById(order.syrup);
    circle(dotX + 14, y, 11, syrup.color);
    context.strokeStyle = 'rgba(0,0,0,0.25)';
    context.beginPath();
    context.arc(dotX + 14, y, 11, 0, Math.PI * 2);
    context.stroke();
  }

  function drawTicket(order, slot, index, active, bowl) {
    const x = LAYOUT.board.x + 12;
    const y = LAYOUT.board.y + 44 + slot * (LAYOUT.ticketHeight + LAYOUT.ticketGap);
    const width = LAYOUT.board.width - 24;
    const height = LAYOUT.ticketHeight;
    const isActive = index === active;
    context.fillStyle = isActive ? PALETTE.ticketActive : PALETTE.ticket;
    context.globalAlpha = isActive ? 1 : 0.55;
    context.beginPath();
    context.roundRect(x, y, width, height, 10);
    context.fill();
    context.globalAlpha = 1;
    if (isActive) {
      context.strokeStyle = PALETTE.gold;
      context.lineWidth = 4;
      context.beginPath();
      context.roundRect(x, y, width, height, 10);
      context.stroke();
      context.fillStyle = PALETTE.gold;
      context.beginPath();
      context.moveTo(x + width + 2, y + height / 2 - 12);
      context.lineTo(x + width + 26, y + height / 2);
      context.lineTo(x + width + 2, y + height / 2 + 12);
      context.closePath();
      context.fill();
    }
    text(`#${index + 1}`, x + 12, y + 26, 18, PALETTE.ink, 'left', '800');
    drawTicketDots(order, x + 48, y + 22);
    const progress = isActive ? orderProgress(order, bowl) : 0;
    context.fillStyle = '#dee2e6';
    context.fillRect(x + 12, y + height - 22, width - 24, 8);
    context.fillStyle = PALETTE.serve;
    context.fillRect(x + 12, y + height - 22, (width - 24) * progress, 8);
    const patienceRatio = Math.max(0, order.patience / order.maxPatience);
    context.fillStyle = patienceRatio > 0.5 ? PALETTE.serve : patienceRatio > 0.25 ? PALETTE.gold : PALETTE.timerLow;
    context.fillRect(x + 12, y + height - 10, (width - 24) * patienceRatio, 5);
  }

  function drawOrderBoard(state) {
    pill(LAYOUT.board.x, LAYOUT.board.y, LAYOUT.board.width, LAYOUT.board.height, 14, PALETTE.board);
    context.strokeStyle = PALETTE.boardEdge;
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(LAYOUT.board.x, LAYOUT.board.y, LAYOUT.board.width, LAYOUT.board.height, 14);
    context.stroke();
    text('PESANAN', LAYOUT.board.x + 14, LAYOUT.board.y + 30, 20, PALETTE.text, 'left', '800');
    for (let slot = 0; slot < 3; slot += 1) {
      const order = state.tickets[slot];
      if (!order) {
        context.strokeStyle = 'rgba(255,255,255,0.18)';
        context.setLineDash([6, 6]);
        context.lineWidth = 2;
        const x = LAYOUT.board.x + 12;
        const y = LAYOUT.board.y + 44 + slot * (LAYOUT.ticketHeight + LAYOUT.ticketGap);
        context.beginPath();
        context.roundRect(x, y, LAYOUT.board.width - 24, LAYOUT.ticketHeight, 10);
        context.stroke();
        context.setLineDash([]);
        continue;
      }
      drawTicket(order, slot, slot, state.active, state.bowl);
    }
  }

  function drawToppingBlob(id, x, y, size) {
    const topping = toppingById(id);
    if (id === 'cendol') {
      context.strokeStyle = topping.color;
      context.lineWidth = size * 0.32;
      context.lineCap = 'round';
      for (let index = 0; index < 3; index += 1) {
        const offset = (index - 1) * size * 0.42;
        context.beginPath();
        context.moveTo(x + offset - size * 0.2, y - size * 0.3);
        context.lineTo(x + offset + size * 0.2, y + size * 0.3);
        context.stroke();
      }
    } else if (id === 'kacang') {
      circle(x - size * 0.25, y - size * 0.15, size * 0.3, topping.light);
      circle(x + size * 0.25, y + size * 0.1, size * 0.3, topping.color);
      circle(x, y + size * 0.3, size * 0.26, topping.dark);
    } else if (id === 'kelapa') {
      context.fillStyle = topping.color;
      context.save();
      context.translate(x, y);
      context.rotate(-0.4);
      context.fillRect(-size * 0.5, -size * 0.12, size, size * 0.24);
      context.rotate(0.8);
      context.fillRect(-size * 0.5, -size * 0.12, size, size * 0.24);
      context.restore();
    } else if (id === 'nangka') {
      context.fillStyle = topping.light;
      context.save();
      context.translate(x, y);
      context.rotate(0.35);
      context.beginPath();
      context.roundRect(-size * 0.45, -size * 0.22, size * 0.9, size * 0.44, 4);
      context.fill();
      context.restore();
    } else {
      context.fillStyle = topping.color;
      context.fillRect(x - size * 0.32, y - size * 0.32, size * 0.64, size * 0.64);
      context.fillStyle = topping.light;
      context.fillRect(x - size * 0.32, y - size * 0.32, size * 0.64, size * 0.2);
    }
  }

  function drawIceMound(cx, topY, width, anim) {
    const lumps = [
      { dx: -0.34, dy: 0.1, r: 0.2 },
      { dx: -0.14, dy: -0.12, r: 0.24 },
      { dx: 0.08, dy: -0.2, r: 0.26 },
      { dx: 0.3, dy: -0.06, r: 0.22 },
      { dx: 0.42, dy: 0.14, r: 0.16 },
      { dx: -0.48, dy: 0.22, r: 0.14 },
    ];
    for (const lump of lumps) {
      const r = width * lump.r * (0.4 + 0.6 * anim);
      circle(cx + width * lump.dx, topY + width * lump.dy * anim + width * 0.12 * (1 - anim), r, PALETTE.ice);
      context.globalAlpha = 0.5;
      circle(cx + width * lump.dx - r * 0.25, topY + width * lump.dy * anim + width * 0.12 * (1 - anim) - r * 0.25, r * 0.55, '#ffffff');
      context.globalAlpha = 1;
    }
  }

  function drawSteam(cx, topY) {
    context.strokeStyle = PALETTE.steam;
    context.lineWidth = 5;
    context.lineCap = 'round';
    for (let index = 0; index < 3; index += 1) {
      const x = cx + (index - 1) * 46;
      context.beginPath();
      context.moveTo(x, topY - 8);
      context.bezierCurveTo(x - 12, topY - 34, x + 12, topY - 52, x - 4, topY - 76);
      context.stroke();
    }
  }

  /**
   * One es campur bowl: glass body, ice mound, toppings on top, syrup drizzle, and
   * while the syrup is still pouring, the tilted bottle and its frozen stream.
   */
  function drawBowl(cx, baseY, width, bowl) {
    const rimY = baseY - width * 0.42;
    const moundTop = rimY - width * 0.22;
    context.globalAlpha = 0.35;
    context.fillStyle = '#000000';
    context.beginPath();
    context.ellipse(cx, baseY + 8, width * 0.52, width * 0.06, 0, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
    if (bowl.ice) {
      drawIceMound(cx, moundTop + width * 0.1, width * 0.72, bowl.iceAnim);
      drawSteam(cx, moundTop - width * 0.06);
      const spots = [
        { dx: -0.2, dy: 0.02 }, { dx: 0.05, dy: -0.1 }, { dx: 0.24, dy: 0.04 },
        { dx: -0.05, dy: 0.12 }, { dx: 0.3, dy: -0.08 },
      ];
      for (let index = 0; index < bowl.toppings.length; index += 1) {
        const spot = spots[index % spots.length];
        drawToppingBlob(bowl.toppings[index], cx + width * spot.dx, moundTop + width * (0.1 + spot.dy), width * 0.17);
      }
      if (bowl.syrup !== null) {
        const syrup = syrupById(bowl.syrup);
        context.strokeStyle = syrup.color;
        context.lineWidth = width * 0.035;
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(cx - width * 0.3, moundTop + width * 0.02);
        context.quadraticCurveTo(cx, moundTop - width * 0.08, cx + width * 0.3, moundTop + width * 0.04);
        context.stroke();
        context.beginPath();
        context.moveTo(cx - width * 0.22, moundTop + width * 0.1);
        context.quadraticCurveTo(cx + 4, moundTop + width * 0.02, cx + width * 0.26, moundTop + width * 0.12);
        context.stroke();
        if (bowl.pour < 1) {
          const bottleX = cx + width * 0.42;
          const bottleY = moundTop - width * 0.46;
          drawSyrupBottleShape(bottleX, bottleY, width * 0.22, syrup, -0.7);
          context.strokeStyle = syrup.color;
          context.lineWidth = width * 0.06;
          context.beginPath();
          context.moveTo(bottleX - width * 0.02, bottleY + width * 0.12);
          const streamEnd = moundTop - width * 0.06 + (moundTop + width * 0.1 - (moundTop - width * 0.06)) * bowl.pour;
          context.lineTo(cx + width * 0.1, streamEnd);
          context.stroke();
        }
      }
    }
    context.fillStyle = PALETTE.glass;
    context.beginPath();
    context.moveTo(cx - width * 0.5, rimY);
    context.quadraticCurveTo(cx - width * 0.46, baseY, cx - width * 0.18, baseY);
    context.lineTo(cx + width * 0.18, baseY);
    context.quadraticCurveTo(cx + width * 0.46, baseY, cx + width * 0.5, rimY);
    context.closePath();
    context.fill();
    context.strokeStyle = PALETTE.glassEdge;
    context.lineWidth = 3;
    context.stroke();
    context.beginPath();
    context.ellipse(cx, rimY, width * 0.5, width * 0.07, 0, 0, Math.PI * 2);
    context.stroke();
  }

  function drawSyrupBottleShape(x, y, height, syrup, tilt) {
    context.save();
    context.translate(x, y);
    context.rotate(tilt);
    context.fillStyle = syrup.dark;
    context.fillRect(-height * 0.16, -height * 0.52, height * 0.32, height * 0.2);
    context.fillStyle = syrup.color;
    context.beginPath();
    context.roundRect(-height * 0.3, -height * 0.32, height * 0.6, height * 0.82, height * 0.12);
    context.fill();
    context.fillStyle = 'rgba(255,255,255,0.35)';
    context.fillRect(-height * 0.22, -height * 0.26, height * 0.1, height * 0.6);
    context.fillStyle = '#f8f9fa';
    context.beginPath();
    context.roundRect(-height * 0.34, height * 0.5, height * 0.68, height * 0.22, 4);
    context.fill();
    context.restore();
  }

  function drawToppingJar(topping, index) {
    const x = LAYOUT.jars.x + index * (LAYOUT.jars.width + LAYOUT.jars.gap);
    const y = LAYOUT.jars.y;
    const width = LAYOUT.jars.width;
    const height = LAYOUT.jars.height;
    context.fillStyle = '#495057';
    context.beginPath();
    context.roundRect(x - 2, y + height - 8, width + 4, 10, 4);
    context.fill();
    context.fillStyle = topping.color;
    context.beginPath();
    context.roundRect(x + 4, y + 22, width - 8, height - 26, 8);
    context.fill();
    context.fillStyle = PALETTE.jarGlass;
    context.beginPath();
    context.roundRect(x, y + 14, width, height - 14, 10);
    context.fill();
    context.fillStyle = '#e9ecef';
    context.beginPath();
    context.roundRect(x - 2, y, width + 4, 18, 6);
    context.fill();
    context.fillStyle = topping.dark;
    context.beginPath();
    context.arc(x + width / 2, y + 9, 4, 0, Math.PI * 2);
    context.fill();
  }

  function drawShaver() {
    const { x, y, width, height } = LAYOUT.shaver;
    context.fillStyle = PALETTE.woodDark;
    context.beginPath();
    context.roundRect(x, y, width, height, 10);
    context.fill();
    context.fillStyle = '#adb5bd';
    context.beginPath();
    context.roundRect(x + 14, y + 12, width - 28, 44, 8);
    context.fill();
    circle(x + width / 2, y + 34, 16, PALETTE.ice);
    context.strokeStyle = '#868e96';
    context.lineWidth = 6;
    context.beginPath();
    context.arc(x + width - 14, y + 78, 18, -0.6, 2.2);
    context.stroke();
    circle(x + width - 14 + 18, y + 78, 6, '#343a40');
    text('SERUT', x + width / 2, y + height - 14, 20, PALETTE.text, 'center', '800');
  }

  function drawSyrupBottles() {
    for (let index = 0; index < SYRUPS.length; index += 1) {
      const x = LAYOUT.syrups.x + index * (LAYOUT.syrups.width + LAYOUT.syrups.gap);
      const y = LAYOUT.syrups.y;
      drawSyrupBottleShape(x + LAYOUT.syrups.width / 2, y + LAYOUT.syrups.height / 2, 96, SYRUPS[index], 0);
      context.fillStyle = 'rgba(0,0,0,0.3)';
      context.beginPath();
      context.ellipse(x + LAYOUT.syrups.width / 2, y + LAYOUT.syrups.height, 34, 6, 0, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawCounter() {
    const gradient = context.createLinearGradient(0, LAYOUT.counterTop, 0, FIELD.height);
    gradient.addColorStop(0, PALETTE.counterTop);
    gradient.addColorStop(1, PALETTE.counterFront);
    context.fillStyle = gradient;
    context.fillRect(0, LAYOUT.counterTop, FIELD.width, FIELD.height - LAYOUT.counterTop);
    context.fillStyle = PALETTE.counterEdge;
    context.fillRect(0, LAYOUT.counterTop, FIELD.width, 6);
    context.fillStyle = 'rgba(255,255,255,0.08)';
    context.fillRect(0, LAYOUT.counterTop + 6, FIELD.width, 3);
  }

  function drawTray(state) {
    const { x, y, width, height } = LAYOUT.tray;
    context.fillStyle = PALETTE.wood;
    context.beginPath();
    context.roundRect(x, y, width, height, 12);
    context.fill();
    context.strokeStyle = PALETTE.woodDark;
    context.lineWidth = 3;
    context.beginPath();
    context.roundRect(x, y, width, height, 12);
    context.stroke();
    if (state.tray !== null) {
      drawBowl(x + width / 2 - 30, y + height - 6, 120, {
        toppings: state.tray.toppings, ice: true, iceAnim: 1, syrup: state.tray.syrup, pour: 1,
      });
      text('SIAP SAJI', x + width - 16, y + 34, 20, '#ffffff', 'right', '800');
    } else {
      context.fillStyle = '#f8f9fa';
      context.beginPath();
      context.ellipse(x + width / 2 - 30, y + height / 2 + 8, 62, 18, 0, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#dee2e6';
      context.lineWidth = 2;
      context.stroke();
      text('SIAP SAJI', x + width - 16, y + 34, 20, '#ffffff', 'right', '800');
      text('belum ada', x + width - 16, y + 62, 16, 'rgba(255,255,255,0.7)', 'right');
    }
    const bell = LAYOUT.bell;
    context.fillStyle = PALETTE.bellDark;
    context.beginPath();
    context.ellipse(bell.x, bell.y + bell.size / 2, bell.size * 0.55, 8, 0, 0, Math.PI * 2);
    context.fill();
    const bellGradient = context.createLinearGradient(bell.x, bell.y - bell.size / 2, bell.x, bell.y + bell.size / 2);
    bellGradient.addColorStop(0, '#ffe066');
    bellGradient.addColorStop(1, PALETTE.bell);
    context.fillStyle = bellGradient;
    context.beginPath();
    context.arc(bell.x, bell.y, bell.size / 2, Math.PI, 0);
    context.closePath();
    context.fill();
    circle(bell.x, bell.y - bell.size / 2 - 2, 5, PALETTE.bellDark);
  }

  function drawServeButton(state) {
    const { x, y, width, height } = LAYOUT.serve;
    const ready = state.tickets[state.active] !== undefined;
    context.save();
    if (ready) {
      context.shadowColor = PALETTE.serveGlow;
      context.shadowBlur = 24;
    }
    context.fillStyle = ready ? PALETTE.serve : '#495057';
    context.beginPath();
    context.roundRect(x, y, width, height, 16);
    context.fill();
    context.restore();
    context.strokeStyle = ready ? PALETTE.serveGlow : '#868e96';
    context.lineWidth = 3;
    context.beginPath();
    context.roundRect(x, y, width, height, 16);
    context.stroke();
    text('SAJIKAN!', x + width / 2, y + 46, 32, PALETTE.serveText, 'center', '800');
  }

  function drawPanel(title, lines, prompt, best) {
    const width = 640;
    const lineHeight = 34;
    const height = 150 + lines.length * lineHeight + 84;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(11, 16, 38, 0.92)';
    context.beginPath();
    context.roundRect(x, y, width, height, 18);
    context.fill();
    context.strokeStyle = PALETTE.gold;
    context.lineWidth = 3;
    context.beginPath();
    context.roundRect(x, y, width, height, 18);
    context.stroke();
    text(title, FIELD.width / 2, y + 72, 46, '#ffffff', 'center', '800');
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + 128 + index * lineHeight, 22, '#ced4da', 'center');
    }
    if (best !== null) text(`Skor terbaik ${best}`, FIELD.width / 2, y + 128 + lines.length * lineHeight, 22, PALETTE.gold, 'center', '800');
    text(prompt, FIELD.width / 2, y + height - 36, 24, PALETTE.gold, 'center', '800');
  }

  function drawKiosk(state) {
    drawNightMarket();
    drawCounter();
    drawOrderBoard(state);
    for (let index = 0; index < TOPPINGS.length; index += 1) drawToppingJar(TOPPINGS[index], index);
    drawShaver();
    drawSyrupBottles();
    drawBowl(LAYOUT.bowl.x, LAYOUT.bowl.y, LAYOUT.bowl.width, state.bowl);
    drawTray(state);
    drawServeButton(state);
    drawAwning();
    drawHud(state);
  }

  /** Paint one frame: the kiosk, then a panel for the screen the game is on. */
  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.nightTop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    context.save();
    context.translate(FIELD.width / 2, FIELD.height / 2);
    context.scale(camera.scale, camera.scale);
    context.translate(-camera.cx, -camera.cy);
    drawKiosk(state);
    context.restore();
    if (screen === SCREEN_TITLE) {
      drawPanel('ES CAMPUR RUSH', [
        'Racik es campur sesuai pesanan sebelum waktu habis.',
        'Klik toples untuk topping, serut es, tuang sirup, sajikan!',
        'Tombol 1-2-3 ganti pesanan. Spasi serut es. Enter sajikan.',
      ], 'Klik atau tekan Spasi untuk mulai', best);
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('Jeda', ['Esnya menunggu. Pesanan tidak menunggu.'], 'Tekan P untuk lanjut', null);
    } else if (screen === SCREEN_OVER) {
      drawPanel('Waktu Habis!', [
        `Skor ${state.score} — ${state.served} mangkok disajikan.`,
        `Kombo terbaik x${state.bestCombo}.`,
      ], 'Tekan Spasi untuk main lagi', best);
    }
  }

  /** Move the camera: scale 1 is the whole kiosk; higher scales zoom into (cx, cy). */
  function setCamera(scale, cx, cy) {
    camera.scale = scale;
    camera.cx = cx;
    camera.cy = cy;
  }

  /** Turn a point in the canvas's CSS pixels into logical playfield pixels. */
  function toLogical(clientX, clientY) {
    const px = (clientX - view.x) / view.scale;
    const py = (clientY - view.y) / view.scale;
    return {
      x: camera.cx + (px - FIELD.width / 2) / camera.scale,
      y: camera.cy + (py - FIELD.height / 2) / camera.scale,
    };
  }

  /** What the player hit, if anything: a ticket, a jar, the shaver, a syrup or serve. */
  function zoneAt(x, y) {
    for (let slot = 0; slot < 3; slot += 1) {
      const tx = LAYOUT.board.x + 12;
      const ty = LAYOUT.board.y + 44 + slot * (LAYOUT.ticketHeight + LAYOUT.ticketGap);
      if (x >= tx && x <= tx + LAYOUT.board.width - 24 && y >= ty && y <= ty + LAYOUT.ticketHeight) {
        return { type: 'ticket', index: slot };
      }
    }
    for (let index = 0; index < TOPPINGS.length; index += 1) {
      const jx = LAYOUT.jars.x + index * (LAYOUT.jars.width + LAYOUT.jars.gap);
      if (x >= jx && x <= jx + LAYOUT.jars.width && y >= LAYOUT.jars.y && y <= LAYOUT.jars.y + LAYOUT.jars.height) {
        return { type: 'jar', id: TOPPINGS[index].id };
      }
    }
    const shaver = LAYOUT.shaver;
    if (x >= shaver.x && x <= shaver.x + shaver.width && y >= shaver.y && y <= shaver.y + shaver.height) {
      return { type: 'shaver' };
    }
    for (let index = 0; index < SYRUPS.length; index += 1) {
      const sx = LAYOUT.syrups.x + index * (LAYOUT.syrups.width + LAYOUT.syrups.gap);
      if (x >= sx && x <= sx + LAYOUT.syrups.width && y >= LAYOUT.syrups.y && y <= LAYOUT.syrups.y + LAYOUT.syrups.height) {
        return { type: 'syrup', id: SYRUPS[index].id };
      }
    }
    const serve = LAYOUT.serve;
    if (x >= serve.x && x <= serve.x + serve.width && y >= serve.y && y <= serve.y + serve.height) {
      return { type: 'serve' };
    }
    const bell = LAYOUT.bell;
    if (Math.hypot(x - bell.x, y - bell.y) <= bell.size / 2 + 6) return { type: 'serve' };
    return null;
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, setCamera, toLogical, zoneAt };
}
