/* =========================================================
   invaders.js (ArcadeHub) — RESPONSIVE + TIME-BASED + WAVES + BOSS + ENDLESS
   - Canvas: #canvas (overlay)
   - DPR + getBoundingClientRect
   - start()/stop() clean
   - Pause: P
   - HUD: Score (top-left) + Hearts
   - 3 waves: 1000 enemies each + boss (50/100/150 HP)
   - Between waves: banner "Ondata X" for 5s
   - Wave reward: +50 after boss defeat
   - After boss3: "YOU WIN" + endless mode
   - Endless: faster spawn, +10 points every 500 kills
   - Explosion spritesheet: assets/images/invaders/esplosione.webp (6x4, 256, 24 frames)
========================================================= */
(() => {
  const BASE = "/"; // <-- locale, non collide con altri file

  const canvas = document.querySelector("#canvas");
  const c = canvas.getContext("2d");
  c.imageSmoothingEnabled = false;

  // ... TUTTO IL RESTO DEL CODICE invaders.js ...

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
  function isMobile() {
    return getCanvasW() < 720;
  }

  function unit() {
    const W = getCanvasW();
    const H = getCanvasH();

    // base più aggressiva
    const base = W / 12;               // prima era /18 (troppo piccolo)
    const byH = H / 22;                // aiuta su portrait alto

    const u = Math.max(base, byH);

    // clamp più alto
    return Math.round(Math.max(26, Math.min(46, u)));
  }

  // ----------------------- ASSETS -----------------------
  const INV_ASSET = `${BASE}images/Invaders/`;

  const IMG = {
    bg: new Image(),
    ship: new Image(),
    alienBase: new Image(),
    alienMedio: new Image(),
    alienForte: new Image(),
    boss1: new Image(),
    boss2: new Image(),
    boss3: new Image(),
    heart: new Image(),
    bulletNav: new Image(),
    bulletAlien: new Image(),
    bulletBoss: new Image(),
    explosion: new Image(),
  };

  IMG.bg.src = `${INV_ASSET}bg-spazio.webp`;
  IMG.ship.src = `${INV_ASSET}navicella.webp`;
  IMG.alienBase.src = `${INV_ASSET}alieno-base.webp`;
  IMG.alienMedio.src = `${INV_ASSET}alieno-medio.webp`;
  IMG.alienForte.src = `${INV_ASSET}alieno-forte.webp`;
  IMG.boss1.src = `${INV_ASSET}boss-1.webp`;
  IMG.boss2.src = `${INV_ASSET}boss-2.webp`;
  IMG.boss3.src = `${INV_ASSET}boss-3.webp`;
  IMG.heart.src = `${INV_ASSET}cuore-vite.webp`;
  IMG.bulletNav.src = `${INV_ASSET}proiettile-nav.webp`;
  IMG.bulletAlien.src = `${INV_ASSET}proiettile-alieno.webp`;
  IMG.bulletBoss.src = `${INV_ASSET}proiettile-boss.webp`;
  IMG.explosion.src = `${INV_ASSET}esplosione.webp`;

  function ready(img) {
    return img && img.complete && img.naturalWidth > 0;
  }

  // ----------------------- EXPLOSION SHEET -----------------------
  const EXP = {
    cols: 6,
    rows: 4,
    frameW: 256,
    frameH: 256,
    frames: 24,
    stepPerFrame: 2, // 2 => 30fps circa
  };

  class Explosion {
    constructor(x, y, sizePx) {
      this.x = x;
      this.y = y;
      this.size = sizePx;
      this.frame = 0;
      this.t = 0;
      this.done = false;
    }
    update(step) {
      this.t += step;
      while (this.t >= EXP.stepPerFrame) {
        this.t -= EXP.stepPerFrame;
        this.frame++;
        if (this.frame >= EXP.frames) {
          this.done = true;
          break;
        }
      }
    }
    draw() {
      const img = IMG.explosion;
      if (!ready(img)) return;

      const i = Math.min(this.frame, EXP.frames - 1);
      const col = i % EXP.cols;
      const row = Math.floor(i / EXP.cols);
      const sx = col * EXP.frameW;
      const sy = row * EXP.frameH;

      const dx = this.x - this.size / 2;
      const dy = this.y - this.size / 2;

      c.drawImage(img, sx, sy, EXP.frameW, EXP.frameH, dx, dy, this.size, this.size);
    }
  }

  let explosions = [];

  // ----------------------- GAME CONFIG -----------------------
  const WAVES = [
    {
      id: 1,
      enemiesToKill: 1000,
      mix: { base: 0.92, medio: 0.08, forte: 0.0 },
      boss: { hp: 50, sprite: "boss1" },
    },
    {
      id: 2,
      enemiesToKill: 1000,
      mix: { base: 0.6, medio: 0.4, forte: 0.0 },
      boss: { hp: 100, sprite: "boss2" },
    },
    {
      id: 3,
      enemiesToKill: 1000,
      mix: { base: 0.55, medio: 0.35, forte: 0.10 },
      boss: { hp: 150, sprite: "boss3" },
    },
  ];

  // ----------------------- STATE -----------------------
  let running = false;
  let rafId = null;
  let lastTs = null;

  let state = "start"; // start | banner | playing | boss | paused | win | endless | gameover
  let stateTimer = 0;  // seconds for banner/win

  let score = 0;
  let lives = 3;

  let waveIndex = 0;         // 0..2
  let killedThisWave = 0;    // count kills (towards 1000)
  let endlessKills = 0;      // kills in endless
  let nextEndlessBonusAt = 500;

  let invulnerableMs = 0;

  // spawn pacing
  let spawnTimer = 0;

  // entities
  let player = null;
  let enemies = [];      // active aliens
  let bullets = [];      // player bullets
  let enemyBullets = []; // alien bullets
  let boss = null;

  // input
  const keys = { left: false, right: false, shoot: false };

  // ----------------------- TUNING -----------------------
  function playerSpeed() {
    return (isMobile() ? 6.8 : 6.0) * SCALE;
  }
  function bulletSpeed() {
    return 11 * SCALE;
  }

  function alienBulletSpeed() { return 4.0 * SCALE; }

  function bossBulletSpeed() { return 5.2 * SCALE; }

  function shootCooldownMs() {
    return isMobile() ? 220 : 170;
  }
  function enemySpeedBase() {
    const w = Math.min(1.7, 0.95 + waveIndex * 0.18);
    return w * SCALE;
  }
  function spawnRateSec() {
    if (state === "endless") {
      const accel = Math.min(0.12, endlessKills / 8000);
      return Math.max(0.14, 0.26 - accel);
    }
    // wave 1 più tranquilla
    const base = 0.40;           // prima ~0.26
    return Math.max(0.22, base - waveIndex * 0.06);
  }
  function enemyShootChancePerSec() {
    // probabilità sparo per nemico
    if (state === "endless") return 0.14;
    return 0.10 + waveIndex * 0.03;
  }

  // ----------------------- HELPERS -----------------------
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function submitScoreSafe() {
    const fn = window.submitScore;
    if (typeof fn !== "function") return;
    try {
      if (fn.length >= 2) fn("invaders", score);
      else fn(score);
    } catch { }
  }

  // ----------------------- ENTITIES -----------------------
  class Player {
    constructor() {
      const U = unit();
      this.w = Math.round(U * 2.05);
      this.h = Math.round(U * 1.75);
      this.x = Math.round(getCanvasW() / 2 - this.w / 2);
      this.targetX = this.x;
      this.y = Math.round(getCanvasH() - this.h - 18 * SCALE);
      this.cooldown = 0;
      this.opacity = 1;
    }
    syncScale() {
      const U = unit();
      this.w = Math.round(U * 2.05);
      this.h = Math.round(U * 1.75);
      this.y = Math.round(getCanvasH() - this.h - 18 * SCALE);
      this.x = clamp(this.x, 10, getCanvasW() - this.w - 10);
      this.targetX = clamp(this.targetX, 10, getCanvasW() - this.w - 10);
    }
    update(step) {
      const useTouchTarget = touch.moveId !== null;

      // se touch drag attivo: vai verso targetX
      if (useTouchTarget) {
        const dx = this.targetX - this.x;
        const maxStep = playerSpeed() * step;
        this.x += clamp(dx, -maxStep, maxStep);
      } else {
        // fallback tastiera
        const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        this.x += dir * playerSpeed() * step;
      }

      this.x = clamp(this.x, 10, getCanvasW() - this.w - 10);

      this.cooldown = Math.max(0, this.cooldown - step * (1000 / 60));
      if (keys.shoot) this.shoot();
    }
    shoot() {
      if (this.cooldown > 0) return;
      this.cooldown = shootCooldownMs();

      const U = unit();

      bullets.push({
        x: this.x + this.w / 2 - Math.round(U * 0.125),
        y: this.y - Math.round(U * 0.6),
        w: Math.round(U * 0.25),
        h: Math.round(U * 0.65),
        vy: -bulletSpeed(),
      });
    }
    draw() {
      c.save();
      c.globalAlpha = this.opacity;
      if (ready(IMG.ship)) c.drawImage(IMG.ship, this.x, this.y, this.w, this.h);
      else c.fillRect(this.x, this.y, this.w, this.h);
      c.restore();
    }
  }

  function pickAlienType(mix) {
    const r = Math.random();
    if (r < mix.forte) return "forte";
    if (r < mix.forte + mix.medio) return "medio";
    return "base";
  }

  function alienHp(type) {
    if (type === "medio") return 2;
    if (type === "forte") return 3;
    return 1;
  }

  function alienImg(type) {
    if (type === "medio") return IMG.alienMedio;
    if (type === "forte") return IMG.alienForte;
    return IMG.alienBase;
  }

  function spawnEnemy() {
    const cfg = state === "endless" ? WAVES[2] : WAVES[waveIndex]; // endless usa mix wave3
    const type = pickAlienType(cfg.mix);
    const hp = alienHp(type);

    const img = alienImg(type);
    const U = unit();
    const w = Math.round(U * 1.35);
    const h = Math.round(U * 1.0);

    // spawn top in random lane
    const padding = 12;
    const x = Math.random() * (getCanvasW() - w - padding * 2) + padding;
    const y = Math.round(60 * SCALE);

    enemies.push({
      type,
      hp,
      x,
      y,
      w,
      h,
      vy: enemySpeedBase() * (0.75 + Math.random() * 0.55),
      shootCd: Math.random() * 1.2, // seconds
      img,
    });
  }

  function spawnBoss() {
    const cfg = WAVES[waveIndex];
    const img = IMG[cfg.boss.sprite];
    const U = unit();

    boss = {
      hp: cfg.boss.hp,
      hpMax: cfg.boss.hp,
      x: Math.round(getCanvasW() / 2),
      y: Math.round(78 * SCALE),
      w: Math.round(U * 5.2),
      h: Math.round(U * 2.9),
      vx: 2.2 * SCALE,
      shootCd: 0.6,
      img,
    };
  }

  function bossShoot(step) {
    if (!boss) return;
    boss.shootCd -= (step / 60);
    if (boss.shootCd > 0) return;

    const baseCd = isMobile() ? 0.40 : 0.48;
    boss.shootCd = baseCd;

    const U = unit();
    const cx = boss.x;
    const cy = boss.y;
    const s = bossBulletSpeed();

    const spread = [-0.8, 0, 0.8];
    spread.forEach((vxMul) => {
      enemyBullets.push({
        x: cx - Math.round(U * 0.175),
        y: cy,
        w: Math.round(U * 0.35),
        h: Math.round(U * 0.90),
        vx: vxMul * 1.2 * SCALE,
        vy: s,
        kind: "boss",
      });
    });
  }

  // ----------------------- UI / HUD -----------------------
  function drawBg() {
    const W = getCanvasW();
    const H = getCanvasH();
    if (ready(IMG.bg)) c.drawImage(IMG.bg, 0, 0, W, H);
    else {
      c.fillStyle = "black";
      c.fillRect(0, 0, W, H);
    }
  }

  function font(px) {
    return `${Math.round(px * SCALE)}px 'Press Start 2P'`;
  }

  function drawHud() {
    c.save();
    c.fillStyle = "#fff";
    c.textAlign = "left";
    c.font = font(24);
    c.fillText(`SCORE ${score}`, 12, 32);

    // vite: cuori
    const U = unit();
    const size = Math.round(U * 0.85);
    for (let i = 0; i < lives; i++) {
      const x = 12 + i * (size + 6);
      const y = 34;
      if (ready(IMG.heart)) c.drawImage(IMG.heart, x, y, size, size);
      else {
        c.fillText("♥", x, y + size);
      }
    }

    // wave
    if (state !== "start") {
      c.textAlign = "right";
      c.font = font(24); // uguale allo score
      const label = state === "endless" ? "ENDLESS" : `ONDATA ${waveIndex + 1}`;
      c.fillText(label, getCanvasW() - 56, 32);
    }

    // boss hp bar
    if (boss && (state === "boss" || state === "endless")) {
      const W = getCanvasW();
      const barW = Math.round(240 * SCALE);
      const barH = Math.round(14 * SCALE);
      const x = W - 12 - barW;
      const y = 44;

      c.textAlign = "right";
      c.font = font(12);
      c.fillText(`BOSS HP`, W - 12, y - 8);

      c.fillStyle = "#fff";
      c.fillRect(x, y, barW, barH);
      const pct = clamp(boss.hp / boss.hpMax, 0, 1);
      c.clearRect(x + barW * pct, y, barW * (1 - pct), barH);
    }

    c.restore();
  }

  function drawCenterText(title, sub) {
    const W = getCanvasW();
    const H = getCanvasH();
    c.save();
    c.textAlign = "center";
    c.fillStyle = "#fff";

    c.font = font(54);
    c.fillText(title, W / 2, H / 3);

    c.font = font(20);
    c.fillText(sub, W / 2, H / 2);
    c.restore();
  }

  function drawControlsHint() {
    const W = getCanvasW();
    const H = getCanvasH();

    c.save();
    c.textAlign = "center";
    c.fillStyle = "rgba(255,255,255,0.9)";
    c.font = font(14);

    const linesDesktop = [
      "A = sinistra   D = destra",
      "SPACE = spara   P = pausa",
    ];

    const linesMobile = [
      "TOUCH: trascina per muovere",
      "TOUCH: mentre trascini spara auto",
    ];

    const lines = isMobile() ? linesMobile : linesDesktop;

    let y = H * 0.68;
    for (const line of lines) {
      c.fillText(line, W / 2, y);
      y += 24 * SCALE;
    }

    c.restore();
  }

  function drawWaveBanner() {
    const W = getCanvasW();
    const H = getCanvasH();

    // progress 0..1 nei 5s
    const p = 1 - clamp(stateTimer / 5, 0, 1);

    // easing semplice
    const easeOut = 1 - Math.pow(1 - p, 3);

    // entra da sinistra -> centro
    const startX = -W * 0.3;
    const x = startX + (W / 2 - startX) * easeOut;
    const y = H / 3;

    c.save();
    c.textAlign = "center";
    c.fillStyle = "#fff";
    c.font = font(54);

    // glow arcade
    c.shadowColor = "#00ffff";
    c.shadowBlur = 20;

    c.fillText(`ONDATA ${waveIndex + 1}`, x, y);

    c.shadowBlur = 0;
    c.font = font(18);
    c.fillText("Preparati...", x, y + 46 * SCALE);
    c.restore();
  }

  // ----------------------- FLOW -----------------------
  function goBanner() {
    state = "banner";
    stateTimer = 5; // seconds
    // reset round data but keep score/lives
    enemies = [];
    bullets = [];
    enemyBullets = [];
    boss = null;
    explosions = [];
    spawnTimer = 0;
    killedThisWave = 0;
  }

  function goPlaying() {
    state = "playing";
    spawnTimer = 0;
  }

  function goBoss() {
    state = "boss";
    enemies = [];
    bullets = [];
    enemyBullets = [];
    spawnBoss();
  }

  function rewardWaveAndNext() {
    score += 50;

    waveIndex++;
    if (waveIndex >= 3) {
      // win -> endless
      state = "win";

      for (let i = 0; i < 10; i++) {
        const x = Math.random() * getCanvasW();
        const y = Math.random() * getCanvasH() * 0.6;
        explosions.push(new Explosion(x, y, Math.round(140 * SCALE)));
      }

      stateTimer = 3.0;
      boss = null;
      enemies = [];
      bullets = [];
      enemyBullets = [];
      return;
    }
    goBanner();
  }

  function goEndless() {
    state = "endless";
    endlessKills = 0;
    nextEndlessBonusAt = 500;
    enemies = [];
    bullets = [];
    enemyBullets = [];
    boss = null;
    explosions = [];
    spawnTimer = 0;
  }

  function gameOver() {
    state = "gameover";
    if (!window.__invadersScoreSent) {
      window.__invadersScoreSent = true;
      submitScoreSafe();
    }
  }

  // ----------------------- DAMAGE / EXPLOSIONS -----------------------
  function spawnExplosion(x, y, big = false) {
    const U = unit();
    explosions.push(new Explosion(x, y, Math.round((big ? U * 4.5 : U * 2.2))));
  }

  function hitPlayer() {
    if (invulnerableMs > 0) return;
    lives -= 1;

    invulnerableMs = 1200;
    player.opacity = 0.25;

    if (lives <= 0) {
      gameOver();
    }
  }

  function updateInvulnerability(step) {
    if (invulnerableMs <= 0) {
      player.opacity = 1;
      return;
    }
    invulnerableMs -= step * (1000 / 60);
    // blink
    const blink = Math.floor(invulnerableMs / 120) % 2 === 0;
    player.opacity = blink ? 0.25 : 1;
    if (invulnerableMs <= 0) {
      invulnerableMs = 0;
      player.opacity = 1;
    }
  }

  // ----------------------- UPDATE -----------------------
  function update(step) {
    const W = getCanvasW();
    const H = getCanvasH();

    // state timers
    if (state === "banner" || state === "win") {
      stateTimer -= step / 60;
      if (stateTimer <= 0) {
        if (state === "banner") goPlaying();
        else goEndless();
      }
    }

    if (state === "paused" || state === "start" || state === "gameover") return;

    // player
    player.update(step);
    updateInvulnerability(step);

    // spawn logic
    if (state === "playing" || state === "endless") {
      spawnTimer += step / 60;
      const rate = spawnRateSec();
      while (spawnTimer >= rate) {
        spawnTimer -= rate;
        spawnEnemy();
      }
    }

    // enemies movement + shooting
    const shootChance = enemyShootChancePerSec();
    enemies.forEach((e) => {
      e.y += e.vy * step;

      // shoot cooldown
      e.shootCd -= (step / 60);
      if (e.shootCd <= 0) {
        e.shootCd = 0.6 + Math.random() * 0.9;
        if (Math.random() < shootChance) {
          const U = unit();
          enemyBullets.push({
            x: e.x + e.w / 2 - Math.round(U * 0.14),
            y: e.y + e.h,
            w: Math.round(U * 0.28),
            h: Math.round(U * 0.70),
            vx: 0,
            vy: alienBulletSpeed(),
            kind: "alien",
          });
        }
      }
    });

    // remove enemies offscreen -> se arrivano al fondo = danno vita (pressione)
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.y > H + 60) {
        enemies.splice(i, 1);
        hitPlayer();
      }
    }

    // bullets player
    bullets.forEach((b) => (b.y += b.vy * step));
    bullets = bullets.filter((b) => b.y + b.h > -30);

    // bullets enemy
    enemyBullets.forEach((b) => {
      b.x += (b.vx || 0) * step;
      b.y += b.vy * step;
    });
    enemyBullets = enemyBullets.filter((b) => b.y < H + 40);

    // collisions: enemy bullets vs player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const b = enemyBullets[i];
      const pad = Math.round(unit() * 0.15);
      const bx = b.x - pad;
      const by = b.y - pad;
      const bw = b.w + pad * 2;
      const bh = b.h + pad * 2;
      if (aabb(bx, by, bw, bh, player.x, player.y, player.w, player.h)) {
        enemyBullets.splice(i, 1);
        hitPlayer();
        break;
      }
    }

    // boss movement + shooting
    if (boss && (state === "boss" || state === "endless")) {
      boss.x += boss.vx * step;
      if (boss.x - boss.w / 2 <= 10 || boss.x + boss.w / 2 >= W - 10) {
        boss.vx = -boss.vx;
      }
      bossShoot(step);
    }

    // collisions: player bullets vs enemies
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];

      // vs boss
      if (boss) {
        const bx = boss.x - boss.w / 2;
        const by = boss.y - boss.h / 2;
        if (aabb(b.x, b.y, b.w, b.h, bx, by, boss.w, boss.h)) {
          bullets.splice(bi, 1);
          boss.hp -= 1;
          spawnExplosion(b.x + b.w / 2, b.y, false);

          if (boss.hp <= 0) {
            spawnExplosion(boss.x, boss.y, true);

            // wave boss defeated
            if (state === "boss") {
              boss = null;
              rewardWaveAndNext();
            } else {
              // endless boss? (non usato ora)
              boss = null;
            }
          }
          continue;
        }
      }

      // vs enemies
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const e = enemies[ei];
        if (aabb(b.x, b.y, b.w, b.h, e.x, e.y, e.w, e.h)) {
          bullets.splice(bi, 1);

          e.hp -= 1;
          spawnExplosion(b.x + b.w / 2, b.y, false);

          if (e.hp <= 0) {
            spawnExplosion(e.x + e.w / 2, e.y + e.h / 2, false);
            enemies.splice(ei, 1);

            // counters
            if (state === "endless") {
              endlessKills++;
              if (endlessKills >= nextEndlessBonusAt) {
                score += 10;
                nextEndlessBonusAt += 500;
              }
            } else {
              killedThisWave++;
              if (killedThisWave >= WAVES[waveIndex].enemiesToKill) {
                // stop spawn and go boss
                state = "boss";
                enemies = [];
                bullets = [];
                enemyBullets = [];
                spawnBoss();
                break;
              }
            }
          }
          break;
        }
      }
    }

    // explosions
    explosions.forEach((e) => e.update(step));
    explosions = explosions.filter((e) => !e.done);
  }

  // ----------------------- DRAW -----------------------
  function drawBullets() {
    for (const b of bullets) {
      if (ready(IMG.bulletNav)) c.drawImage(IMG.bulletNav, b.x, b.y, b.w, b.h);
      else c.fillRect(b.x, b.y, b.w, b.h);
    }
    for (const b of enemyBullets) {
      const img = b.kind === "boss" ? IMG.bulletBoss : IMG.bulletAlien;
      if (ready(img)) c.drawImage(img, b.x, b.y, b.w, b.h);
      else c.fillRect(b.x, b.y, b.w, b.h);
    }
  }

  function drawEnemies() {
    for (const e of enemies) {
      const img = alienImg(e.type);
      if (ready(img)) c.drawImage(img, e.x, e.y, e.w, e.h);
      else c.fillRect(e.x, e.y, e.w, e.h);
    }
  }

  function drawBoss() {
    if (!boss) return;
    const dx = boss.x - boss.w / 2;
    const dy = boss.y - boss.h / 2;

    if (ready(boss.img)) c.drawImage(boss.img, dx, dy, boss.w, boss.h);
    else c.fillRect(dx, dy, boss.w, boss.h);
  }

  function draw() {
    const W = getCanvasW();
    const H = getCanvasH();
    c.clearRect(0, 0, W, H);

    drawBg();

    if (state === "start") {
      drawCenterText("INVADERS", isMobile() ? "Tap / SPACE to Start" : "Press SPACE to Start");
      drawControlsHint();
      return;
    }
    // render game world in all non-start states
    player.draw();
    drawEnemies();
    drawBoss();
    drawBullets();
    explosions.forEach((e) => e.draw());
    drawHud();

    if (state === "banner") {
      drawWaveBanner();
      return;
    }

    if (state === "paused") {
      drawCenterText("PAUSED", "Press P to Resume");
      drawControlsHint();
      return;
    }

    if (state === "win") {
      drawCenterText("YOU WIN", "Endless mode incoming...");
      return;
    }

    if (state === "gameover") {
      drawCenterText("GAME OVER", isMobile() ? "Tap / SPACE to Restart" : "Press SPACE to Restart");
      return;
    }
  }

  // ----------------------- LOOP -----------------------
  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    if (!running) {
      lastTs = ts;
      return;
    }

    if (lastTs == null) lastTs = ts;
    const dtMs = Math.min(50, ts - lastTs);
    lastTs = ts;

    const step = dtMs / (1000 / 60);

    if (state !== "paused" && state !== "start" && state !== "gameover") {
      update(step);
    } else {
      // banner/win hanno timer dentro update, ma li gestiamo comunque:
      if (state === "banner" || state === "win") update(step);
    }

    draw();
  }

  // ----------------------- INPUT -----------------------
  function togglePause() {
    if (state === "playing" || state === "boss" || state === "endless") state = "paused";
    else if (state === "paused") state = (boss ? "boss" : (waveIndex >= 3 ? "endless" : "playing"));
  }

  function startOrRestart() {
    if (state === "start") {
      waveIndex = 0;
      score = 0;
      lives = 3;
      killedThisWave = 0;
      endlessKills = 0;
      nextEndlessBonusAt = 500;
      window.__invadersScoreSent = false;

      resetRoundForWave();
      goBanner();
      return;
    }

    if (state === "gameover") {
      waveIndex = 0;
      score = 0;
      lives = 3;
      killedThisWave = 0;
      endlessKills = 0;
      nextEndlessBonusAt = 500;
      window.__invadersScoreSent = false;

      resetRoundForWave();
      goBanner();
    }
  }

  function resetRoundForWave() {
    enemies = [];
    bullets = [];
    enemyBullets = [];
    explosions = [];
    boss = null;
    invulnerableMs = 0;
    if (!player) player = new Player();
    player.syncScale();
  }

  function onKeyDown(e) {
    if (!running) return;

    if (e.code === "KeyP") {
      if (state !== "start" && state !== "gameover" && state !== "banner" && state !== "win") togglePause();
      return;
    }

    if (e.code === "Space") {
      if (state === "start" || state === "gameover") {
        startOrRestart();
        return;
      }
      if (state === "paused" || state === "banner" || state === "win") return;
      keys.shoot = true;
      return;
    }

    if (state !== "playing" && state !== "boss" && state !== "endless") return;

    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
  }
  function onKeyUp(e) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
    if (e.code === "Space") keys.shoot = false;
  }

  const touch = {
    moveId: null,      // pointerId che controlla il movimento
    offsetX: 0,        // distanza dito-centro nave per drag naturale
  };

  function onPointerDown(e) {
    if (state === "start" || state === "gameover") {
      startOrRestart();
      return;
    }
    if (state === "paused" || state === "banner" || state === "win") return;

    canvas.setPointerCapture?.(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // questo dito controlla tutto
    touch.moveId = e.pointerId;
    touch.offsetX = x - (player.x + player.w / 2);

    player.targetX = clamp(x - touch.offsetX - player.w / 2, 10, getCanvasW() - player.w - 10);

    // ✅ auto-fire con 1 dito
    if (isMobile()) keys.shoot = true;
  }

  function onPointerUp(e) {
    canvas.releasePointerCapture?.(e.pointerId);

    if (touch.moveId === e.pointerId) {
      touch.moveId = null;
      touch.offsetX = 0;
      keys.shoot = false; // ✅ stop autofire
    }
  }

  function onPointerMove(e) {
    if (touch.moveId === null) return;
    if (e.pointerId !== touch.moveId) return;
    if (state !== "playing" && state !== "boss" && state !== "endless") return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    player.targetX = clamp(x - touch.offsetX - player.w / 2, 10, getCanvasW() - player.w - 10);
  }

  function bindInputs() {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function unbindInputs() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }

  // ----------------------- RESIZE -----------------------
  function handleResize() {
    if (!running) return;
    if (!resizeCanvas()) return;

    recomputeScale();
    if (!player) player = new Player();
    player.syncScale();
  }

  window.addEventListener("resize", handleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", handleResize);
  }

  // ----------------------- API -----------------------
  window.Invaders = {
    start() {
      if (running) return;
      running = true;

      bindInputs();

      requestAnimationFrame(() => {
        if (resizeCanvas()) recomputeScale();


        player = new Player();
        player.syncScale();

        // start screen
        state = "start";
        waveIndex = 0;
        score = 0;
        lives = 3;
        killedThisWave = 0;
        endlessKills = 0;
        nextEndlessBonusAt = 500;
        window.__invadersScoreSent = false;

        lastTs = null;
        loop(performance.now());
      });
    },

    stop() {
      running = false;

      unbindInputs();
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      lastTs = null;

      // reset soft
      state = "start";
      enemies = [];
      bullets = [];
      enemyBullets = [];
      explosions = [];
      boss = null;

      // clear
      const W = getCanvasW();
      const H = getCanvasH();
      c.clearRect(0, 0, W, H);
    },
    pause() { if (running && state !== "paused") state = "paused"; },
    resume() { if (running && state === "paused") state = boss ? "boss" : (waveIndex >= 3 ? "endless" : "playing"); },
  };
})();