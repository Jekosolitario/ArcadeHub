/* =========================================================
   flappy.js (RESPONSIVE + TIME-BASED)
   - Canvas dimensionato sul canvas reale (getBoundingClientRect)
   - Supporto devicePixelRatio
   - Movimento time-based (stesso gameplay su 60/144Hz)
========================================================= */
const ASSET_BASE = "/";

const canvas = document.querySelector("#canvas");
const c = canvas.getContext("2d");

// ----------------------- CANVAS / SCALE -----------------------
function getDpr() {
  return window.devicePixelRatio || 1;
}

function getCanvasW() {
  return canvas.width / getDpr();
}

function getCanvasH() {
  return canvas.height / getDpr();
}

function resizeCanvas() {
  const dpr = getDpr();
  const rect = canvas.getBoundingClientRect();

  // overlay chiuso => rect 0, evita resize sbagliati
  if (rect.width === 0 || rect.height === 0) return false;

  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));

  // lavori in CSS pixels
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  return true;
}

let SCALE = 1;
const BASE_W = 900;
const BASE_H = 500;

function recomputeScale() {
  const w = getCanvasW();
  const h = getCanvasH();
  SCALE = Math.min(w / BASE_W, h / BASE_H);
  SCALE = Math.min(SCALE, 1.15); // cap max, niente min (su mobile rovina)
}

// ----------------------- AUDIO -----------------------
const jumpSound = new Audio(`${ASSET_BASE}audio/wing.wav`);
jumpSound.volume = 0.5;

const hitSound = new Audio(`${ASSET_BASE}audio/hit.wav`);
hitSound.volume = 0.5;

const pointSound = new Audio(`${ASSET_BASE}audio/point.wav`);
pointSound.volume = 0.5;

function safePlay(audioEl) {
  if (!audioEl) return;
  try {
    audioEl.currentTime = 0;
    const p = audioEl.play();
    if (p?.catch) p.catch(() => { });
  } catch { }
}

let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  [jumpSound, hitSound, pointSound].forEach((a) => {
    try {
      a.muted = true;
      const p = a.play();
      if (p?.then) {
        p.then(() => {
          a.pause();
          a.currentTime = 0;
          a.muted = false;
        }).catch(() => {
          a.muted = false;
        });
      } else {
        a.muted = false;
      }
    } catch { }
  });
}

// ----------------------- UTILS -----------------------
function applyGlow(color, blur) {
  c.shadowColor = color;
  c.shadowBlur = blur;
}
function resetGlow() {
  c.shadowBlur = 0;
}

// ----------------------- ASSETS -----------------------
let backgroundLoaded = false;
const background = new Image();
background.src = `${ASSET_BASE}images/background.webp`;
background.onload = () => (backgroundLoaded = true);

let floorLoaded = false;
const floor = new Image();
floor.src = `${ASSET_BASE}images/base.webp`;
floor.onload = () => (floorLoaded = true);

function getFloorH() {
  if (!floorLoaded) return 0;
  const imgH = floor.naturalHeight || floor.height;
  return Math.round((imgH / 2) * SCALE);
}

// ----------------------- TUNING (facile da regolare) -----------------------
function isMobile() {
  return getCanvasW() < 720;
}
function getGap() {
  // gap verticale
  const GAP_DESKTOP = 140;
  const GAP_MOBILE = 120; // più stretto in mobile (più difficile)
  return Math.round((isMobile() ? GAP_MOBILE : GAP_DESKTOP) * SCALE);
}
function getSpawnMs() {
  const SPAWN_DESKTOP = 2000;
  const SPAWN_MOBILE = 1650; // più frequente in mobile
  return isMobile() ? SPAWN_MOBILE : SPAWN_DESKTOP;
}
function getPipeSpeed() {
  const SPEED_DESKTOP = 5;
  const SPEED_MOBILE = 5.4;
  return (isMobile() ? SPEED_MOBILE : SPEED_DESKTOP) * SCALE;
}
function getMargin() {
  return Math.round(Math.max(90, 100 * SCALE));
}

// ----------------------- PLAYER -----------------------
class Player {
  constructor() {
    this.x = Math.round(getCanvasW() / 5);
    this.y = getCanvasH() / 2;

    this.velocity = 0;
    this.rotation = 0;

    this.radius = 18 * SCALE;
    this.gravity = 0.5 * SCALE;

    this.image = new Image();
    this.image.src = `${ASSET_BASE}images/bird.webp`;
    this.scale = 2 * SCALE;
  }

  draw() {
    if (!this.image.complete || this.image.naturalWidth === 0) return;

    const width = this.image.width * this.scale;
    const height = this.image.height * this.scale;

    c.save();
    c.translate(this.x, this.y);
    c.rotate(this.rotation);
    c.drawImage(this.image, -width / 2, -height / 2, width, height);
    c.restore();
  }

  update(step = 1) {
    // time-based: tutto moltiplicato per step
    this.velocity += this.gravity * step;

    const maxVel = 10 * SCALE;
    if (this.velocity > maxVel) this.velocity = maxVel;

    this.y += this.velocity * step;

    this.rotation = this.velocity * 0.1;
    if (this.rotation < -Math.PI / 2) this.rotation = -Math.PI / 2;
    if (this.rotation > Math.PI / 2) this.rotation = Math.PI / 2;

    this.draw();
  }

  jump() {
    // velocità "per frame 60fps" -> ok, perché poi y usa *step
    this.velocity = -9 * SCALE;
    safePlay(jumpSound);
  }

  syncScale() {
    this.radius = 18 * SCALE;
    this.gravity = 0.5 * SCALE;
    this.scale = 2 * SCALE;
  }
}

// ----------------------- TUBI -----------------------
class Tubo {
  constructor() {
    const W = getCanvasW();
    const H = getCanvasH();

    this.x = W;
    this.width = Math.round(75 * SCALE);
    this.velocity = getPipeSpeed();
    this.passed = false;

    this.spazio = getGap();
    const margin = getMargin();

    const floorH = getFloorH();
    const playableH = H - floorH;

    this.height = playableH;

    const min = -playableH + margin;
    const max = -this.spazio - margin;
    this.y = Math.random() * (max - min) + min;

    this.image = new Image();
    this.image.src = `${ASSET_BASE}images/pipe-green.webp`;
  }

  draw() {
    if (!this.image.complete) return;

    // tubo inferiore
    c.drawImage(
      this.image,
      this.x,
      this.y + this.height + this.spazio,
      this.width,
      this.height
    );

    // tubo superiore capovolto
    c.save();
    c.translate(this.x + this.width / 2, this.y + this.height / 2);
    c.scale(1, -1);
    c.drawImage(
      this.image,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    c.restore();
  }

  update(step = 1) {
    this.x -= this.velocity * step;
    this.draw();
  }
}

// ----------------------- UI SCREENS -----------------------
function drawStartScreen() {
  const W = getCanvasW();
  const H = getCanvasH();

  c.fillStyle = "white";

  c.font = `${Math.round(60 * SCALE)}px 'Press Start 2P'`;
  const titleText = "FLAPPY BIRD";
  const titleWidth = c.measureText(titleText).width;

  applyGlow("#00ffff", 25);
  c.fillText(titleText, (W - titleWidth) / 2, H / 3);
  resetGlow();

  c.font = `${Math.round(26 * SCALE)}px 'Press Start 2P'`;
  const instructionText = isMobile() ? "Tap to Start" : "Press W to Jump";
  const instructionWidth = c.measureText(instructionText).width;

  applyGlow("#fff", 15);
  c.fillText(instructionText, (W - instructionWidth) / 2, H / 2);
  resetGlow();
}

function drawGameOverScreen() {
  const W = getCanvasW();
  const H = getCanvasH();

  c.fillStyle = "red";
  c.font = `${Math.round(60 * SCALE)}px 'Press Start 2P'`;
  const titleText = "GAME OVER";
  const titleWidth = c.measureText(titleText).width;

  applyGlow("#f00", 25);
  c.fillText(titleText, (W - titleWidth) / 2, H / 3);
  resetGlow();

  c.fillStyle = "white";
  c.font = `${Math.round(26 * SCALE)}px 'Press Start 2P'`;
  const instructionText = isMobile() ? "Tap to Restart" : "Press W to Restart";
  const instructionWidth = c.measureText(instructionText).width;

  applyGlow("#fff", 15);
  c.fillText(instructionText, (W - instructionWidth) / 2, H / 2);
  resetGlow();
}

// ----------------------- GAME STATE -----------------------
let gameState = "start"; // "start" | "playing" | "gameover"
let spawnInterval = null;
let tubi = [];
let punteggio = 0;
let scoreSent = false;

let player = null;

function resetRound() {
  clearInterval(spawnInterval);
  spawnInterval = null;

  tubi = [];
  punteggio = 0;
  scoreSent = false;

  if (!player) player = new Player();

  player.x = Math.round(getCanvasW() / 5);
  player.y = getCanvasH() / 2;
  player.velocity = 0;
  player.rotation = 0;
  player.syncScale();
}

function startSpawning() {
  clearInterval(spawnInterval);
  spawnInterval = setInterval(() => tubi.push(new Tubo()), getSpawnMs());
}

function submitScoreSafe() {
  const fn = window.submitScore;
  if (typeof fn !== "function") return;
  try {
    // compat: se la tua submitScore accetta 1 argomento o 2
    if (fn.length >= 2) fn("flappy", punteggio);
    else fn(punteggio);
  } catch { }
}

function triggerGameOver() {
  if (gameState === "gameover") return;

  safePlay(hitSound);
  clearInterval(spawnInterval);
  spawnInterval = null;

  gameState = "gameover";

  if (!scoreSent) {
    scoreSent = true;
    submitScoreSafe();
  }
}

// ----------------------- INPUT -----------------------
function handleJumpAction() {
  if (!window.__flappyRunning) return;

  if (gameState === "start") {
    gameState = "playing";
    startSpawning();
    player.jump(); // più naturale: al primo input parte e salta
  } else if (gameState === "playing") {
    player.jump();
  } else if (gameState === "gameover") {
    resetRound();
    gameState = "playing";
    startSpawning();
    player.jump();
  }
}

function onKeyDown(e) {
  if ((e.key || "").toLowerCase() !== "w") return;
  handleJumpAction();
}

function onPointerDown() {
  handleJumpAction();
}

function bindInputs() {
  window.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("pointerdown", onPointerDown);
}
function unbindInputs() {
  window.removeEventListener("keydown", onKeyDown);
  canvas.removeEventListener("pointerdown", onPointerDown);
}

// ----------------------- RESIZE (UNICO) -----------------------
function handleResize() {
  if (!window.__flappyRunning) return;
  if (!resizeCanvas()) return;

  recomputeScale();

  if (!player) player = new Player();
  player.syncScale();

  player.x = Math.round(getCanvasW() / 5);

  // clamp Y dentro area giocabile
  const floorH = getFloorH();
  const bottomLimit = getCanvasH() - floorH - player.radius;
  if (player.y > bottomLimit) player.y = bottomLimit;
  if (player.y < player.radius) player.y = player.radius;
}

window.addEventListener("resize", handleResize);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", handleResize);
}

// ----------------------- MAIN LOOP (TIME-BASED) -----------------------
let animationId = null;
let lastTs = null;

function animate(ts) {
  animationId = requestAnimationFrame(animate);
  if (!window.__flappyRunning) {
    lastTs = ts;
    return;
  }

  if (lastTs == null) lastTs = ts;
  const dtMs = Math.min(50, ts - lastTs); // anti-spike
  lastTs = ts;

  const step = dtMs / (1000 / 60); // 1 = 1 frame a 60fps

  const W = getCanvasW();
  const H = getCanvasH();

  c.clearRect(0, 0, W, H);

  // sfondo
  if (backgroundLoaded) {
    c.drawImage(background, 0, 0, W / 2, H);
    c.drawImage(background, W / 2, 0, W / 2, H);
  }

  // start screen
  if (gameState === "start") {
    drawStartScreen();
  }

  // update + draw
  if (player) {
    if (gameState === "playing") {
      player.update(step);

      // aggiorna tubi
      tubi.forEach((t) => t.update(step));

      // rimuove tubi fuori schermo
      if (tubi.length > 0 && tubi[0].x <= -tubi[0].width) tubi.splice(0, 1);

      // collisioni tubi + punteggio
      for (const t of tubi) {
        // score
        if (!t.passed && player.x > t.x + t.width) {
          t.passed = true;
          punteggio += 1;
          safePlay(pointSound);
        }

        // collisioni (bounding box semplificata)
        const r = player.radius;
        const xOverlap = player.x + r >= t.x && player.x - r <= t.x + t.width;
        if (!xOverlap) continue;

        const topY = t.y;
        const topH = t.height;

        const bottomY = t.y + t.height + t.spazio;
        const bottomH = t.height;

        const collideTop =
          player.y - r <= topY + topH && player.y + r >= topY;

        const collideBottom =
          player.y + r >= bottomY && player.y - r <= bottomY + bottomH;

        if (collideTop || collideBottom) {
          triggerGameOver();
          break;
        }
      }

      // collisione limiti (soffitto + pavimento)
      const floorH = getFloorH();
      const bottomLimit = H - floorH;
      if (player.y - player.radius <= 0 || player.y + player.radius >= bottomLimit) {
        triggerGameOver();
      }
    } else {
      // non playing: ridisegno statico
      tubi.forEach((t) => t.draw());
      player.draw();
    }
  }

  // punteggio
  if (gameState === "playing" || gameState === "gameover") {
    c.font = `${Math.round(50 * SCALE)}px 'Press Start 2P'`;
    c.fillStyle = "#fff";
    c.shadowColor = "#ffff00";
    c.shadowBlur = 20;

    const text = String(punteggio);
    const tw = c.measureText(text).width;
    c.fillText(text, (W - tw) / 2, H / 6);

    c.shadowBlur = 0;
  }

  // floor
  if (floorLoaded) {
    const floorH = getFloorH();
    const drawH = floorH * 2;

    c.drawImage(floor, 0, H - floorH, W / 2, drawH);
    c.drawImage(floor, W / 2, H - floorH, W / 2, drawH);
  }

  // game over overlay
  if (gameState === "gameover") {
    drawGameOverScreen();
  }
}

// ----------------------- API -----------------------
window.Flappy = {
  start() {
    if (window.__flappyRunning) return;
    window.__flappyRunning = true;

    unlockAudio();
    bindInputs();

    // aspetta overlay visibile (layout pronto)
    requestAnimationFrame(() => {
      if (resizeCanvas()) recomputeScale();
      if (!player) player = new Player();
      player.syncScale();

      gameState = "start";
      resetRound();

      lastTs = null;
      animate(performance.now());
    });
  },

  stop() {
    window.__flappyRunning = false;

    unbindInputs();
    clearInterval(spawnInterval);
    spawnInterval = null;

    cancelAnimationFrame(animationId);
    animationId = null;
    lastTs = null;

    [jumpSound, hitSound, pointSound].forEach((a) => {
      try {
        a.pause();
        a.currentTime = 0;
      } catch { }
    });

    // pulizia canvas
    const W = getCanvasW();
    const H = getCanvasH();
    c.clearRect(0, 0, W, H);
  },
};