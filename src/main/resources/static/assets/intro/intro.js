window.addEventListener("error", (e) => {
    console.error("[INTRO][window.error]", e.message, e.filename, e.lineno, e.colno, e.error);
});
window.addEventListener("unhandledrejection", (e) => {
    console.error("[INTRO][unhandledrejection]", e.reason);
});

console.log("[INTRO] intro.js caricato");

const canvas = document.getElementById("intro-canvas");
const ctx = canvas.getContext("2d");
const INTRO_KEY = "arcadehub_intro_seen_v1";
let __started = false;

// ===== AUDIO =====
// const audio = new Audio("./Intro.mpeg");
// audio.addEventListener("error", () => {
//     console.warn("Intro.mpeg non leggibile, provo mp3...");
//     audio.src = "audio/mpeg";  "./Intro.mp3"
// });
const audio = new Audio("/assets/intro/Intro.mpeg");
audio.addEventListener("error", () => {
    audio.src = "/assets/intro/Intro.mp3";
});
audio.preload = "auto";
audio.type = "audio/mpeg";

// ===== TIMING =====
const DURATION = 12000;
const TITLE = "ArcadeHub";

// ===== START OVERLAY =====
const startOverlay = document.getElementById("intro-start");
const startBtn = document.getElementById("intro-btn");

if (sessionStorage.getItem(INTRO_KEY) === "1") {
    startOverlay?.classList.add("is-hidden");
    canvas.style.display = "none";
    unlockScrollHard(); // safety, nel caso restasse lockato
}

var __scrollY = 0;

function lockScrollHard() {
    __scrollY = window.scrollY || 0;
    document.body.style.position = "fixed";
    document.body.style.top = `-${__scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
}

function unlockScrollHard() {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, __scrollY || 0);
}

// ===== UTILS =====
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);
const easeInOutCubic = (p) =>
    p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

const dpr = () => window.devicePixelRatio || 1;
const rnd = (a, b) => a + Math.random() * (b - a);

// ===== HI-DPI RESIZE =====
function resize() {
    canvas.width = Math.floor(innerWidth * dpr());
    canvas.height = Math.floor(innerHeight * dpr());
    ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0);
}
addEventListener("resize", resize);

// ===== CRACK OFFSCREEN =====
const crackCanvas = document.createElement("canvas");
const crackCtx = crackCanvas.getContext("2d");
function resizeCrack() {
    crackCanvas.width = Math.floor(innerWidth * dpr());
    crackCanvas.height = Math.floor(innerHeight * dpr());
    crackCtx.setTransform(dpr(), 0, 0, dpr(), 0, 0);
}
addEventListener("resize", resizeCrack);

resize();
resizeCrack();

// ===== SPARKS =====
const sparks = [];
function spawnSparks(cx, cy, amount = 55) {
    for (let i = 0; i < amount; i++) {
        const a = rnd(-Math.PI * 0.95, -Math.PI * 0.05); // mostly up + sideways
        const sp = rnd(5, 13);
        sparks.push({
            x: cx + rnd(-20, 20),
            y: cy + rnd(-10, 10),
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: rnd(220, 520), // ms
            len: rnd(6, 14),
            g: rnd(0.18, 0.32),
        });
    }
}
function updateAndDrawSparks(dt) {
    for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= dt;
        if (s.life <= 0) {
            sparks.splice(i, 1);
            continue;
        }
        s.vy += s.g;
        s.vx *= 0.985;
        s.vy *= 0.985;
        s.x += s.vx;
        s.y += s.vy;

        const a = clamp01(s.life / 520);

        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.55 * a;

        ctx.strokeStyle = "rgba(249,220,53,1)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 0.55, s.y - s.vy * 0.55);
        ctx.stroke();

        ctx.globalAlpha = 0.16 * a;
        ctx.strokeStyle = "rgba(0,229,255,1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 0.95, s.y - s.vy * 0.95);
        ctx.stroke();

        ctx.restore();
    }
}

// ===== STATE =====
let didImpact = false;
let impactAtMs = 0;

// ===== TEXT HELPERS =====
function setTitleFont(sizePx) {
    ctx.font = `${sizePx}px "Press Start 2P", system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
}

function generateCracks(cx, cy) {
    const rays = 11;
    const maxLen = Math.min(innerWidth, innerHeight) * 0.42;

    crackCtx.clearRect(0, 0, innerWidth, innerHeight);
    crackCtx.save();

    crackCtx.shadowColor = "rgba(140,235,255,0.65)";
    crackCtx.shadowBlur = 12;

    for (let i = 0; i < rays; i++) {
        const baseAng = (i / rays) * Math.PI * 2 + rnd(-0.10, 0.10);
        let x = cx, y = cy;
        let ang = baseAng;
        const steps = 20;

        for (let s = 0; s < steps; s++) {
            const segLen = (maxLen / steps) * rnd(0.85, 1.2);
            ang += rnd(-0.16, 0.16);
            const nx = x + Math.cos(ang) * segLen;
            const ny = y + Math.sin(ang) * segLen;

            crackCtx.beginPath();
            crackCtx.moveTo(x, y);
            crackCtx.lineTo(nx, ny);
            crackCtx.lineWidth = rnd(1.0, 2.2);
            crackCtx.strokeStyle = "rgba(215,250,255,0.65)";
            crackCtx.stroke();

            if (Math.random() < 0.18 && s > 5) {
                const bAng = ang + rnd(-0.8, 0.8);
                const bx2 = x + Math.cos(bAng) * segLen * rnd(1.0, 1.8);
                const by2 = y + Math.sin(bAng) * segLen * rnd(1.0, 1.8);
                crackCtx.beginPath();
                crackCtx.moveTo(x, y);
                crackCtx.lineTo(bx2, by2);
                crackCtx.lineWidth = rnd(0.7, 1.2);
                crackCtx.strokeStyle = "rgba(200,245,255,0.45)";
                crackCtx.stroke();
            }

            x = nx;
            y = ny;
        }
    }

    crackCtx.shadowBlur = 0;
    crackCtx.lineWidth = 0.9;
    crackCtx.strokeStyle = "rgba(255,255,255,0.28)";
    for (let i = 0; i < 18; i++) {
        const x1 = cx + rnd(-maxLen * 0.18, maxLen * 0.18);
        const y1 = cy + rnd(-maxLen * 0.18, maxLen * 0.18);
        const x2 = x1 + rnd(-maxLen * 0.22, maxLen * 0.22);
        const y2 = y1 + rnd(-maxLen * 0.22, maxLen * 0.22);
        crackCtx.beginPath();
        crackCtx.moveTo(x1, y1);
        crackCtx.lineTo(x2, y2);
        crackCtx.stroke();
    }

    crackCtx.restore();
}

function neonFlickerAlpha(t, start, end) {
    if (t < start) return 0;
    const p = (t - start) / (end - start);
    const instability = 1 - easeOutCubic(clamp01(p));
    const base = easeOutCubic(clamp01(p));
    const jitter = (Math.random() * 0.9 + 0.1) * instability;
    const dropout = Math.random() < 0.14 * instability ? 0.0 : 1.0;
    return clamp01((base + jitter) * dropout);
}

// ===== BRUSHED METAL TEXTURE (procedural) =====
function brushedOverlay(x, y, sizePx, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "overlay";
    // faint diagonal strokes across the text area
    const w = sizePx * 6;
    const h = sizePx * 1.6;
    ctx.translate(x - w / 2, y - h / 2);
    for (let i = 0; i < 36; i++) {
        const yy = (i / 36) * h;
        const jitter = rnd(-6, 6);
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, yy + jitter);
        ctx.lineTo(w, yy - 10 + jitter);
        ctx.stroke();
    }
    ctx.restore();
}

function drawMetalText(text, x, y, sizePx) {
    setTitleFont(sizePx);

    const g = ctx.createLinearGradient(
        x - sizePx * 1.8,
        y - sizePx,
        x + sizePx * 1.8,
        y + sizePx
    );
    g.addColorStop(0.00, "#0f1318");
    g.addColorStop(0.18, "#e3e9f0");
    g.addColorStop(0.36, "#7f8b97");
    g.addColorStop(0.50, "#ffffff");
    g.addColorStop(0.64, "#808c98");
    g.addColorStop(0.82, "#e6edf5");
    g.addColorStop(1.00, "#0e1217");

    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = g;
    ctx.fillText(text, x, y);

    // brushed look (subtle)
    brushedOverlay(x, y, sizePx, 0.35);

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.lineWidth = Math.max(2, sizePx * 0.06);
    ctx.strokeStyle = "rgba(0,0,0,0.82)";
    ctx.strokeText(text, x, y);

    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = Math.max(1, sizePx * 0.02);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.strokeText(text, x, y - sizePx * 0.03);
    ctx.restore();
}

function drawNeonOverlay(text, x, y, sizePx, alpha) {
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    setTitleFont(sizePx);

    let clipped = false;
    if (Math.random() < 0.55) {
        clipped = true;
        ctx.save();
        ctx.beginPath();
        const stripes = 7;
        for (let i = 0; i < stripes; i++) {
            if (Math.random() < 0.35) continue;
            const yy = y - sizePx * 0.65 + (i / stripes) * (sizePx * 1.3);
            const hh = (sizePx * 1.3) / stripes;
            ctx.rect(0, yy, innerWidth, hh);
        }
        ctx.clip();
    }

    ctx.shadowColor = "rgba(0,229,255,0.95)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "rgba(0,229,255,0.14)";
    ctx.fillText(text, x, y);

    ctx.shadowColor = "rgba(249,220,53,0.95)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "rgba(249,220,53,0.40)";
    ctx.fillText(text, x, y);

    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(2, sizePx * 0.05);
    ctx.strokeStyle = "rgba(0,229,255,0.40)";
    ctx.strokeText(text, x, y);

    if (clipped) ctx.restore();
    ctx.restore();
}

// ===== TEXT-ONLY CHROMATIC (post-impact) =====
function chromaTextSplit(text, x, y, sizePx, amountPx, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = alpha;
    setTitleFont(sizePx);

    ctx.fillStyle = "rgba(0,229,255,0.35)";
    ctx.fillText(text, x + amountPx, y);

    ctx.fillStyle = "rgba(249,220,53,0.28)";
    ctx.fillText(text, x - amountPx, y);

    ctx.restore();
}

// ===== CRT overlay =====
function drawCrtOverlay(w, h, cx, cy) {
    ctx.save();

    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "rgba(255,255,255,1)";
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);

    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 650; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const s = Math.random() * 1.4 + 0.6;
        ctx.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,1)" : "rgba(0,0,0,1)";
        ctx.fillRect(x, y, s, s);
    }

    ctx.globalAlpha = 0.10;
    const vg = ctx.createRadialGradient(
        cx,
        cy,
        Math.min(w, h) * 0.2,
        cx,
        cy,
        Math.max(w, h) * 0.9
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
}

// ===== INTRO RENDER =====
function runIntro() {
    didImpact = false;
    sparks.length = 0;
    impactAtMs = 0;

    // mostra canvas
    canvas.style.display = "block";

    // resize iniziale
    resize();
    resizeCrack();

    const t0 = performance.now();
    let last = t0;

    function frame(now) {
        const elapsed = now - t0;
        const dt = now - last;
        last = now;

        const tt = clamp01(elapsed / DURATION);

        const w = innerWidth;
        const h = innerHeight;
        const cx = w / 2;
        const cy = h / 2;

        // fasi
        const ZOOM_END = 0.62;
        const IMPACT = 0.55;
        const NEON_START = 0.58;
        const NEON_STABLE = 0.86;
        const FADE_START = 0.94;

        // BG
        ctx.clearRect(0, 0, w, h);
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.75);
        bg.addColorStop(0, "#05060a");
        bg.addColorStop(1, "#000");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const size = Math.floor(Math.min(w, h) * 0.11);

        // Zoom-out (grande -> normale)
        const zoomP = clamp01(tt / ZOOM_END);
        const zEase = easeInOutCubic(zoomP);
        const START_SCALE = 3.2;
        const END_SCALE = 1.0;
        let scale = lerp(START_SCALE, END_SCALE, zEase);

        // appear
        const appearA = easeOutCubic(clamp01(zoomP / 0.18));

        // impact feel
        let impactY = 0;
        if (tt >= IMPACT && tt < IMPACT + 0.06) {
            const k = 1 - (tt - IMPACT) / 0.06;
            scale = END_SCALE * (1.06 - 0.06 * (1 - k));
            impactY = 10 * (1 - k);
        } else if (tt >= IMPACT + 0.06 && tt < IMPACT + 0.16) {
            const k = (tt - (IMPACT + 0.06)) / 0.10;
            scale = END_SCALE * (1.03 - 0.03 * k);
            impactY = -8 * (1 - k);
        } else if (tt >= IMPACT) {
            scale = END_SCALE;
        }

        // shake post-impact
        let shakeX = 0, shakeY = 0;
        if (tt > IMPACT && tt < NEON_STABLE) {
            const k = 1 - (tt - IMPACT) / (NEON_STABLE - IMPACT);
            shakeX = (Math.random() - 0.5) * 12 * k;
            shakeY = (Math.random() - 0.5) * 12 * k;
        }

        // motion ghost
        const blurAmt = clamp01((scale - 1) / (START_SCALE - 1));
        const ghostAlpha = 0.18 * blurAmt;

        ctx.save();
        ctx.translate(shakeX, shakeY);

        ctx.save();
        ctx.globalAlpha = appearA;

        // trasformazione (scala uniforme)
        ctx.translate(cx, cy + impactY);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -(cy + impactY));

        if (ghostAlpha > 0.01) {
            ctx.save();
            ctx.globalAlpha *= ghostAlpha;
            ctx.translate(0, 10);
            drawMetalText(TITLE, cx, cy + impactY, size);
            ctx.restore();
        }

        drawMetalText(TITLE, cx, cy + impactY, size);

        // IMPACT EVENT: quando la scala è quasi arrivata a 1
        if (!didImpact && scale <= 1.02) {
            didImpact = true;
            impactAtMs = elapsed;
            generateCracks(cx, cy + impactY);
            spawnSparks(cx, cy + impactY, 55);
        }

        // neon overlay
        const neonA = neonFlickerAlpha(tt, NEON_START, NEON_STABLE);
        drawNeonOverlay(TITLE, cx, cy + impactY, size, neonA);

        // chroma split testo subito post-impact
        if (didImpact) {
            const since = elapsed - impactAtMs;
            const p = clamp01(1 - since / 250);
            chromaTextSplit(TITLE, cx, cy + impactY, size, 2.2 * p, 0.55 * p);
        }

        ctx.restore(); // transform
        ctx.restore(); // alpha

        // cracks overlay: burst + propagazione
        if (didImpact) {
            const crackBurst = clamp01((tt - IMPACT) / 0.06);
            const crackGrow = clamp01((tt - IMPACT) / 0.50);
            const crackA = 0.95 * easeOutCubic(crackBurst) + 0.25 * easeOutCubic(crackGrow);

            ctx.save();
            ctx.globalAlpha = clamp01(crackA) * 0.85;
            ctx.globalCompositeOperation = "screen";
            ctx.drawImage(crackCanvas, 0, 0, w, h);
            ctx.restore();
        }

        // flash impatto
        if (tt > IMPACT && tt < IMPACT + 0.05) {
            const fp = 1 - (tt - IMPACT) / 0.05;
            ctx.save();
            ctx.globalAlpha = 0.18 * fp;
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        // glitch pulito
        if (tt > IMPACT && tt < IMPACT + 0.30) {
            const sp = (tt - IMPACT) / 0.30;
            const k = 1 - sp;

            ctx.save();
            ctx.globalCompositeOperation = "screen";
            ctx.translate((Math.random() - 0.5) * 6 * k, (Math.random() - 0.5) * 4 * k);

            ctx.globalAlpha = 0.06 * k;
            ctx.fillStyle = "rgba(0,229,255,1)";
            ctx.fillRect(0, 0, w, h);

            ctx.globalAlpha = 0.04 * k;
            ctx.fillStyle = "rgba(249,220,53,1)";
            ctx.fillRect(0, 0, w, h);

            ctx.globalAlpha = 0.08 * k;
            ctx.fillStyle = "rgba(255,255,255,1)";
            for (let i = 0; i < 10; i++) {
                const y0 = Math.random() * h;
                const hh = 2 + Math.random() * 6;
                ctx.fillRect(0, y0, w, hh);
            }

            ctx.restore();
        }

        // sparks
        updateAndDrawSparks(dt);

        ctx.restore(); // shake

        // CRT overlay
        drawCrtOverlay(w, h, cx, cy);

        // fade out
        if (tt > FADE_START) {
            const fo = easeOutCubic((tt - FADE_START) / (1 - FADE_START));
            ctx.fillStyle = `rgba(0,0,0,${clamp01(fo)})`;
            ctx.fillRect(0, 0, w, h);
        }

        if (elapsed < DURATION) {
            requestAnimationFrame(frame);
        } else {
            finish();
        }
    }

    requestAnimationFrame(frame);
}
// ===== START (user gesture) =====
function bindStartOnce() {
    if (!startBtn) {
        console.error("[INTRO] bottone #intro-btn non trovato");
        return;
    }
    startBtn.addEventListener("click", startIntro);
    console.log("[INTRO] bindStartOnce ok");
}
async function startIntro() {
    console.log("[INTRO] startIntro click");

    // se è già partita, non ripartire
    if (__started) return;
    __started = true;

    // se già vista, chiudi overlay e basta
    if (sessionStorage.getItem(INTRO_KEY) === "1") {
        startOverlay?.classList.add("is-hidden");
        canvas.style.display = "none";
        unlockScrollHard();
        __started = false;
        return;
    }

    // sanity
    if (!canvas || !ctx) {
        console.error("[INTRO] canvas/ctx non trovati");
        __started = false;
        return;
    }

    // UI
    startOverlay?.classList.add("is-hidden");
    canvas.style.display = "block";
    lockScrollHard();

    // PARTI SEMPRE (anche se audio fallisce)
    try {
        audio.currentTime = 0;
        await audio.play();
    } catch (e) {
        console.warn("[INTRO] audio non partito:", e);
    } finally {
        console.log("[INTRO] avvio animazione");
        runIntro();
    }
}

function finish() {
    try {
        audio.pause();
        audio.currentTime = 0;
    } catch { }

    // nascondi canvas
    if (canvas) canvas.style.display = "none";

    // segna vista
    sessionStorage.setItem(INTRO_KEY, "1");
    startOverlay?.classList.add("is-hidden");

    // sblocca scroll
    unlockScrollHard();

    // reset stato
    __started = false;
}

bindStartOnce();