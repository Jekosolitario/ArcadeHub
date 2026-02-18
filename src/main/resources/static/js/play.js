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

let pendingGameId = null;
let currentGame = null;
let lastFocusedEl = null;

function rememberFocus() {
    lastFocusedEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
}

function restoreFocus() {
    // torna su un elemento sensato (es. bottone X o card)
    (lastFocusedEl && document.contains(lastFocusedEl) ? lastFocusedEl : btnClose)?.focus?.();
}

/* ---------------- OVERLAY ---------------- */
function openOverlay(gameId) {
    currentGame = gameId;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");

    // Avvia gioco scelto
    if (gameId === "flappy") {
        window.Flappy?.start?.();
    }
}

function closeOverlay() {
    // tolgo il focus da dentro overlay (es. bottone X)
    if (overlay.contains(document.activeElement)) {
        document.activeElement.blur();
    }

    // stop game
    window.Flappy?.stop?.();

    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");

    // rimetto focus su qualcosa fuori (es. prima card)
    const firstCard = document.querySelector(".game-card:not([disabled])");
    firstCard?.focus();

    currentGame = null;
}


/* ---------------- MODAL ---------------- */
function openExitModal() {
    rememberFocus();
    exitModal.classList.add("is-open");
    exitModal.setAttribute("aria-hidden", "false");
    btnExitCancel.focus(); // focus iniziale dentro modal
}

function closeExitModal() {
    // 1) togli focus da dentro
    document.activeElement?.blur?.();

    // 2) nascondi
    exitModal.classList.remove("is-open");
    exitModal.setAttribute("aria-hidden", "true");

    // 3) ripristina focus fuori
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

        // Se mobile portrait → chiedi landscape
        if (isMobilePortrait()) {
            openRotateOverlay(gameId);
            return;
        }

        openOverlay(gameId);
    });
});


btnClose.addEventListener("click", () => {
    openExitModal();
});

// ESC: se overlay aperto → apri modal
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) {
        openExitModal();
    }
    // ESC quando il modal è aperto → chiude il modal
    if (e.key === "Escape" && exitModal.classList.contains("is-open")) {
        closeExitModal();
    }
});

// Bottoni modal
btnExitCancel.addEventListener("click", closeExitModal);
btnExitConfirm.addEventListener("click", confirmExit);

// Click fuori (backdrop) per annullare
exitModal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close === "true") closeExitModal();
});


function isMobilePortrait() {
    // “mobile-ish”: puoi tararlo come vuoi
    const isSmall = window.matchMedia("(max-width: 900px)").matches;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    return isSmall && isPortrait;
}

function openRotateOverlay(gameId) {
    rememberFocus();
    pendingGameId = gameId;
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

    if (isMobilePortrait()) {
        // ancora portrait → resta nel rotate overlay
        return;
    }
    // ok: landscape → chiudi overlay e avvia gioco
    const gameId = pendingGameId;
    closeRotateOverlay();
    openOverlay(gameId);
}

// Bottoni nel rotate overlay
btnRotateCheck.addEventListener("click", tryStartPendingGame);

btnRotateBack.addEventListener("click", () => {
    closeRotateOverlay();
});

// Auto-check quando ruoti davvero il telefono
window.addEventListener("orientationchange", tryStartPendingGame);
window.addEventListener("resize", tryStartPendingGame);
