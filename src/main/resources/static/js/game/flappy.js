/* =========================================================
   flappy.js (RESPONSIVE + header fixed friendly)
   - Canvas dimensionato sul .main-game (non window)
   - Supporto devicePixelRatio (nitidezza)
   - Tutti i calcoli in CSS pixels via getCanvasW/H()
========================================================= */
const ASSET_BASE = "/"; // Spring Boot static => root "/"
const canvas = document.querySelector("#canvas");
const c = canvas.getContext("2d");

// ----------------------- CANVAS RESPONSIVE -----------------------
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

  if (rect.width === 0 || rect.height === 0) return false;

  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));

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
  SCALE = Math.min(SCALE, 1.15);
}


// ======================== AUDIO ========================
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

  [jumpSound, hitSound, pointSound].forEach(a => {
    try {
      a.muted = true;
      const p = a.play();
      if (p?.then) {
        p.then(() => { a.pause(); a.currentTime = 0; a.muted = false; })
          .catch(() => { a.muted = false; });
      } else {
        a.muted = false;
      }
    } catch { }
  });
}


// ======================== UTILS ========================
function applyGlow(color, blur) {
  c.shadowColor = color;
  c.shadowBlur = blur;
}
function resetGlow() {
  c.shadowBlur = 0;
}

// ======================== ASSETS ========================
let backgroundLoaded = false;
const background = new Image();
background.src = `${ASSET_BASE}images/background.png`;
background.onload = () => (backgroundLoaded = true);

let floorLoaded = false;
const floor = new Image();
floor.src = `${ASSET_BASE}images/base.png`;
floor.onload = () => (floorLoaded = true);

//======================== PLAYER ===============================
class Player {
  constructor(x, y, radius, gravity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.gravity = gravity;
    this.velocity = 0;
    this.rotation = 0;

    this.image = new Image();
    this.image.src = `${ASSET_BASE}images/bird.png`;
    this.scale = 2 * SCALE;

  }

  draw() {
    // se non è caricata o è rotta, non disegnare
    if (!this.image.complete || this.image.naturalWidth === 0) return;


    const width = this.image.width * this.scale;
    const height = this.image.height * this.scale;

    c.save();
    c.translate(this.x, this.y);
    c.rotate(this.rotation);
    c.drawImage(this.image, -width / 2, -height / 2, width, height);
    c.restore();
  }

  update() {
    this.velocity += this.gravity;
    const maxVel = 10 * SCALE;
    if (this.velocity > maxVel) this.velocity = maxVel;

    this.y += this.velocity;

    this.rotation = this.velocity * 0.1;
    if (this.rotation < -Math.PI / 2) this.rotation = -Math.PI / 2;
    if (this.rotation > Math.PI / 2) this.rotation = Math.PI / 2;

    this.draw();
  }

  jump() {
    this.velocity = -9 * SCALE;
    safePlay(jumpSound);
  }
}

//======================== TUBI ===============================
class Tubo {
  constructor() {
    this.x = getCanvasW();

    this.width = Math.round(75 * SCALE);
    this.velocity = 5 * SCALE;
    this.passed = false;

    // gap e margine: NON farli diventare microscopici su mobile
    const isMobile = getCanvasW() < 720;          // soglia semplice
    const GAP_BASE = isMobile ? 130 : 140;        // mobile più stretto
    this.spazio = Math.round(GAP_BASE * SCALE);
    const margin = Math.round(Math.max(90, 100 * SCALE));

    const floorH = getFloorH();
    const playableH = getCanvasH() - floorH;

    // i tubi devono fermarsi al "soffitto del pavimento"
    this.height = playableH;

    const min = -playableH + margin;
    const max = -this.spazio - margin;
    this.y = Math.random() * (max - min) + min;

    this.image = new Image();
    this.image.src = `${ASSET_BASE}images/pipe-green.png`;
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
    c.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
    c.restore();
  }

  update() {
    this.x -= this.velocity;
    this.draw();
  }
}

//======================== UI SCREENS ===============================
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

  c.font = `${Math.round(30 * SCALE)}px 'Press Start 2P'`;
  const instructionText = "Press W to Jump";
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
  c.font = `${Math.round(30 * SCALE)}px 'Press Start 2P'`;
  const instructionText = "Press W to Restart";
  const instructionWidth = c.measureText(instructionText).width;

  applyGlow("#fff", 15);
  c.fillText(instructionText, (W - instructionWidth) / 2, H / 2);
  resetGlow();
}

//======================== GAME STATE ===============================
let gameState = "start"; // "start" | "playing" | "gameover"
let spawnInterval;
let tubi = [];
let punteggio = 0;

let scoreSent = false; // evita invii multipli

// inizializzo player DOPO resize
let player = new Player(
  Math.round(getCanvasW() / 5),
  getCanvasH() / 2,
  18 * SCALE,
  0.5 * SCALE
);

player.draw();

function startGame() {
  clearInterval(spawnInterval);

  const isMobile = getCanvasW() < 720;
  const SPAWN_MS = isMobile ? 1600 : 2000;

  spawnInterval = setInterval(() => tubi.push(new Tubo()), SPAWN_MS);
}

function resetGame() {
  clearInterval(spawnInterval);
  tubi = [];
  punteggio = 0;
  scoreSent = false; //  nuova run, nuovo invio

  player.x = Math.round(getCanvasW() / 5);
  player.y = getCanvasH() / 2;
  player.velocity = 0;
  player.rotation = 0;

  player.radius = 18 * SCALE;
  player.gravity = 0.5 * SCALE;
  player.scale = 2 * SCALE;

  startGame();
}

//======================== INPUT ===============================
function onKeyPress(e) {
  if (!window.__flappyRunning) return;
  if ((e.key || "").toLowerCase() !== "w") return;
  handleJumpAction();
}

function onPointerDown() {
  if (!window.__flappyRunning) return;
  handleJumpAction();
}

function handleJumpAction() {
  if (gameState === "start") {
    gameState = "playing";
    startGame();
  } else if (gameState === "playing") {
    player.jump();
  } else if (gameState === "gameover") {
    resetGame();
    gameState = "playing";
  }
}

function bindInputs() {
  window.addEventListener("keypress", onKeyPress);
  canvas.addEventListener("pointerdown", onPointerDown);
}

function unbindInputs() {
  window.removeEventListener("keypress", onKeyPress);
  canvas.removeEventListener("pointerdown", onPointerDown);
}

// ======================== RESIZE HANDLER (UNICO) ========================
function handleResize() {
  if (!window.__flappyRunning) return;
  if (!resizeCanvas()) return;

  recomputeScale();

  player.x = Math.round(getCanvasW() / 5);

  player.scale = 2 * SCALE;
  player.radius = 18 * SCALE;
  player.gravity = 0.5 * SCALE;
}

function getFloorH() {
  if (!floorLoaded) return 0;
  // altezza reale del pavimento sopra il bordo inferiore
  return Math.round((floor.height / 2) * SCALE);
}

window.addEventListener("resize", handleResize);

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", handleResize);
}


// resize mobile più affidabile (barra indirizzi / zoom / tastiera)
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => {
    if (!window.__flappyRunning) return; // evita resize quando il gioco è chiuso
    resizeCanvas();
    recomputeScale();

    // riallinea scale del player (stessi update che fai nel window.resize)
    player.scale = 2 * SCALE;
    player.radius = 18 * SCALE;
    player.gravity = 0.5 * SCALE;
  });
}

//======================== MAIN LOOP ===============================
let animationId;

function triggerGameOver() {
  safePlay(hitSound);
  clearInterval(spawnInterval);
  gameState = "gameover";

  if (!scoreSent) {
    scoreSent = true;
    window.submitScore?.("flappy", punteggio);
  }
}


function animate() {
  animationId = requestAnimationFrame(animate);
  if (!window.__flappyRunning) return;

  const W = getCanvasW();
  const H = getCanvasH();

  // clear frame (importante per evitare “scie”)
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

  // update gameplay
  if (gameState === "playing") {
    player.update();

    // rimuove tubi fuori schermo
    if (tubi.length > 0 && tubi[0].x <= -tubi[0].width) tubi.splice(0, 1);

    // aggiorna tubi
    tubi.forEach((t) => t.update());

    // collisioni tubi
    tubi.forEach((t) => {
      if (player.x + player.radius >= t.x && player.x - player.radius <= t.x + t.width) {
        const collideTop =
          player.y - player.radius <= t.y + t.height && player.y + player.radius >= t.y;

        const collideBottom =
          player.y - player.radius <= t.y + t.height + t.spazio + t.height &&
          player.y + player.radius >= t.y + t.height + t.spazio;

        if (collideTop || collideBottom) {
          triggerGameOver();
        }
      }
    });

    // collisione limiti (soffitto + pavimento)
    const floorH = getFloorH();
    if (player.y - player.radius <= 0 || player.y + player.radius >= H - floorH) {
      triggerGameOver();
    }


    // punteggio (passaggio oltre tubo)
    tubi.forEach(tubo => {
      if (!tubo.passed && player.x > tubo.x + tubo.width) {
        tubo.passed = true;
        punteggio += 1;
        pointSound.currentTime = 0;
        safePlay(pointSound);
      }
    });
  }

  // in gameover: ridisegno statico
  if (gameState !== "playing") {
    tubi.forEach((t) => t.draw());
    player.draw();
  }

  // punteggio (playing o gameover)
  if (gameState === "playing" || gameState === "gameover") {
    c.font = `${Math.round(50 * SCALE)}px 'Press Start 2P'`;
    c.fillStyle = "#fff";
    c.shadowColor = "#ffff00";
    c.shadowBlur = 20;

    const text = String(punteggio);
    const w = c.measureText(text).width;
    c.fillText(text, (W - w) / 2, H / 6);

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

window.Flappy = {
  start() {
    if (window.__flappyRunning) return;
    window.__flappyRunning = true;

    unlockAudio();
    bindInputs();

    // aspetta che l'overlay sia realmente visibile (layout pronto)
    requestAnimationFrame(() => {
      const ok = resizeCanvas();
      if (ok) recomputeScale();

      // riallinea parametri dipendenti da SCALE
      player.scale = 2 * SCALE;
      player.radius = 18 * SCALE;
      player.gravity = 0.5 * SCALE;

      gameState = "start";
      resetGame();
      animate();
    });
  },
  stop() {
    window.__flappyRunning = false;

    unbindInputs();            // disattiva input quando chiudi

    clearInterval(spawnInterval);
    cancelAnimationFrame(animationId);

    [jumpSound, hitSound, pointSound].forEach(a => {
      try { a.pause(); a.currentTime = 0; } catch { }
    });

    const W = getCanvasW();
    const H = getCanvasH();
    c.clearRect(0, 0, W, H);
  }
};


