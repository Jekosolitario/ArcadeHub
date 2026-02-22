const overlay = document.getElementById("gameOverlay");
const btnClose = document.getElementById("btnCloseGame");
const cards = document.querySelectorAll(".game-card");

// MODAL (custom)
const exitModal = document.getElementById("exitModal");
const btnExitCancel = document.getElementById("btnExitCancel");
const btnExitConfirm = document.getElementById("btnExitConfirm");

const rotateOverlay = document.getElementById("rotateOverlay");
const btnRotateCheck = document.getElementById("btnRotateCheck");
const btnRotateBack = document.getElementById("btnRotateBack");
const LANDSCAPE_ONLY_GAMES = new Set(["flappy"]);

const ORIENTATION_RULES = {
    flappy: "landscape",
    invaders: "portrait",
};
// solo su mobile (<=900px). Su desktop: nessun blocco.
// invaders NON incluso -> funziona anche in portrait

let pendingGameId = null;
let currentGame = null;
let lastFocusedEl = null;

function rememberFocus() {
    lastFocusedEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
}
function restoreFocus() {
    (lastFocusedEl && document.contains(lastFocusedEl) ? lastFocusedEl : btnClose)?.focus?.();
}

function isMobile() {
    return window.matchMedia("(max-width: 900px)").matches;
}

function getOrientation() {
    return window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape";
}

function isOrientationAllowed(gameId) {
    if (!isMobile()) return true;
    const rule = ORIENTATION_RULES[gameId];
    if (!rule) return true; // default: libero
    return getOrientation() === rule;
}
/* ===================== GAME REGISTRY ===================== */
// ogni gioco deve esporre window.<Name> = { start(), stop() }
const GAMES = {
    flappy: () => window.Flappy,
    invaders: () => window.Invaders,
    // pong: () => window.Pong,
};

function getGameApi(gameId) {
    return GAMES[gameId]?.() || null;
}

/* ---------------- OVERLAY ---------------- */
function openOverlay(gameId) {
    rememberFocus();
    currentGame = gameId;

    document.body.classList.remove("game--flappy", "game--invaders");
    document.body.classList.add(`game--${gameId}`);

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");

    btnClose?.focus?.();

    // Avvia gioco scelto (generic)
    const api = getGameApi(gameId);
    api?.start?.();
}

function closeOverlay() {
    if (overlay.contains(document.activeElement)) {
        document.activeElement.blur();
    }

    // Stop gioco corrente (generic)
    const api = getGameApi(currentGame);
    api?.stop?.();

    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");

    restoreFocus();
    document.body.classList.remove("game--flappy", "game--invaders");
    currentGame = null;
}

/* ---------------- MODAL ---------------- */
function openExitModal() {
    rememberFocus();
    exitModal.classList.add("is-open");
    exitModal.setAttribute("aria-hidden", "false");
    btnExitCancel.focus();
}

function closeExitModal() {
    document.activeElement?.blur?.();
    exitModal.classList.remove("is-open");
    exitModal.setAttribute("aria-hidden", "true");
    restoreFocus();
}

function confirmExit() {
    closeExitModal();
    closeOverlay();
}

/* ---------------- EVENTS ---------------- */
cards.forEach((btn) => {
    btn.addEventListener("click", () => {
        const gameId = btn.dataset.game;
        if (!gameId || btn.disabled) return;

        if (!isOrientationAllowed(gameId)) {
            openRotateOverlay(gameId);
            return;
        }
        openOverlay(gameId);
    });
});

btnClose.addEventListener("click", openExitModal);

window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    if (exitModal.classList.contains("is-open")) {
        closeExitModal();
        return;
    }

    if (overlay.classList.contains("is-open")) {
        openExitModal();
    }
});

btnExitCancel.addEventListener("click", closeExitModal);
btnExitConfirm.addEventListener("click", confirmExit);

exitModal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close === "true") closeExitModal();
});

function isMobilePortraitForGame(gameId) {
    const isSmall = window.matchMedia("(max-width: 900px)").matches;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    return isSmall && isPortrait && LANDSCAPE_ONLY_GAMES.has(gameId);
}

function openRotateOverlay(gameId) {
    rememberFocus();
    pendingGameId = gameId;

    // testo dinamico
    const rule = ORIENTATION_RULES[gameId];
    const title = document.getElementById("rotateTitle");
    const text = rotateOverlay.querySelector(".rotate-text");

    if (rule === "landscape") {
        title.textContent = "Ruota il telefono";
        text.innerHTML = "Per giocare, usa la modalità <strong>orizzontale</strong> (landscape).";
    } else if (rule === "portrait") {
        title.textContent = "Torna in verticale";
        text.innerHTML = "Per giocare, usa la modalità <strong>verticale</strong> (portrait).";
    } else {
        title.textContent = "Orientamento non supportato";
        text.textContent = "Ruota il dispositivo e riprova.";
    }

    rotateOverlay.classList.add("is-open");
    rotateOverlay.setAttribute("aria-hidden", "false");
    btnRotateCheck.focus();
}

function closeRotateOverlay() {
    document.activeElement?.blur?.();

    pendingGameId = null;
    rotateOverlay.classList.remove("is-open");
    rotateOverlay.setAttribute("aria-hidden", "true");

    restoreFocus();
}

function tryStartPendingGame() {
    if (!pendingGameId) return;
    if (!isOrientationAllowed(pendingGameId)) return;

    const gameId = pendingGameId;
    closeRotateOverlay();
    openOverlay(gameId);
}

btnRotateCheck.addEventListener("click", tryStartPendingGame);
btnRotateBack.addEventListener("click", closeRotateOverlay);

function enforceOrientationWhilePlaying() {
    if (!overlay.classList.contains("is-open")) return;
    if (!currentGame) return;

    if (!isOrientationAllowed(currentGame)) {
        // Pausa il gioco se possibile
        const api = getGameApi(currentGame);
        api?.pause?.(); // opzionale: se lo implementi in invaders.js
        openRotateOverlay(currentGame);
    } else {
        // se torna ok, chiudi rotate overlay e riprendi
        if (rotateOverlay.classList.contains("is-open")) closeRotateOverlay();
        const api = getGameApi(currentGame);
        api?.resume?.(); // opzionale
    }
}

window.addEventListener("orientationchange", enforceOrientationWhilePlaying);
window.addEventListener("resize", enforceOrientationWhilePlaying);



/* =========================================================
   SCORE SUBMIT (robusto)
   - supporta submitScore(score)
   - supporta submitScore(gameCode, score) 
========================================================= */
window.submitScore = async (...args) => {
    let gameCode, score;

    if (args.length === 1) {
        score = args[0];
        gameCode = (currentGame || "").toUpperCase(); // "invaders" -> "INVADERS"
    } else {
        [gameCode, score] = args;
        gameCode = String(gameCode || "").toUpperCase();
    }

    if (!gameCode || score === undefined || score === null) return;

    try {
        console.log("[submitScore]", { gameCode, score }); // tienilo finché testi
        await api.post("/api/game/score", { gameCode, score });
    } catch (e) {
        console.error("Errore submitScore:", e);
    }
};