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
  const main = document.querySelector(".main-game");
  if (!main) return;

  const rect = main.getBoundingClientRect();
  const dpr = getDpr();

  // dimensioni REALI in pixel fisici
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));

  // disegno in "pixel CSS"
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resizeCanvas();

let SCALE = 1;

const BASE_W = 900;
const BASE_H = 500;

function recomputeScale() {
  const w = getCanvasW();
  const h = getCanvasH();
  SCALE = Math.min(w / BASE_W, h / BASE_H);
  SCALE = Math.max(0.75, Math.min(1.15, SCALE));
}

recomputeScale();


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
    this.height = getCanvasH();
    this.velocity = 5 * SCALE;
    this.passed = false;
    this.spazio = Math.round(145 * SCALE);

    const floorHeight = floorLoaded ? floor.height / 2 : 0;
    const playableHeight = getCanvasH() - floorHeight;

    const margin = Math.round(100 * SCALE);
    const min = -playableHeight + margin;
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
  spawnInterval = setInterval(() => {
    tubi.push(new Tubo());
  }, 2000);
}

function resetGame() {
  clearInterval(spawnInterval);
  tubi = [];
  punteggio = 0;

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
  if (e.key !== "w") return;
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


// resize handler
window.addEventListener("resize", () => {
  resizeCanvas();

  // riposiziona player su resize (senza teletrasportarlo fuori)
  player.x = Math.round(getCanvasW() / 5);
  const floorH = floorLoaded ? floor.height / 2 : 0;
  const maxY = getCanvasH() - floorH - player.radius;
  if (player.y > maxY) player.y = getCanvasH() / 2;

  recomputeScale();

  player.scale = 2 * SCALE;
  player.radius = 18 * SCALE;
  player.gravity = 0.5 * SCALE;
});

//======================== MAIN LOOP ===============================
let animationId;

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
          safePlay(hitSound);
          clearInterval(spawnInterval);
          gameState = "gameover";
        }
      }
    });

    // collisione limiti (soffitto + pavimento)
    const floorH = floorLoaded ? floor.height / 2 : 0;
    if (player.y - player.radius <= 0 || player.y + player.radius >= H - floorH) {
      safePlay(hitSound);
      clearInterval(spawnInterval);
      gameState = "gameover";
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
    c.drawImage(floor, 0, H - floor.height / 2, W / 2, floor.height);
    c.drawImage(floor, W / 2, H - floor.height / 2, W / 2, floor.height);
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
    gameState = "start";
    resetGame();
    animate();
  }
  ,
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


