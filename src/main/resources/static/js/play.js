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

    // refresh vvh PRIMA di mostrare l’overlay
    const h = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty("--vvh", `${h * 0.01}px`);

    document.body.classList.remove("game--flappy", "game--invaders");
    document.body.classList.add(`game--${gameId}`);
    document.body.classList.add("is-game-open");

    overlay.setAttribute("aria-hidden", "false");

    document.getElementById("canvas")?.focus?.();

    getGameApi(gameId)?.start?.();
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
    document.body.classList.remove("is-game-open");
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
    if (e.code === "Space" && overlay.classList.contains("is-open")) {
        e.preventDefault(); // niente scroll / niente click su focusable
    }
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

(() => {
    function norm(s) {
        return (s || "").toLowerCase().trim();
    }

    function setupGameSearchAndFilters() {
        const input = document.getElementById("game-search");
        const cards = Array.from(document.querySelectorAll(".game-card"));
        const diffBtns = Array.from(document.querySelectorAll(".diff-filter"));
        let diff = "all"; // all | 1 | 2 | 3

        diffBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                diffBtns.forEach((b) => b.setAttribute("aria-pressed", "false"));
                btn.setAttribute("aria-pressed", "true");
                diff = btn.dataset.diff || "all";
                apply();
            });
        });

        const datalist = document.getElementById("games-list");
        if (datalist) {
            const titles = cards
                .map(c => c.querySelector("h2")?.textContent?.trim())
                .filter(Boolean);

            datalist.innerHTML = titles.map(t => `<option value="${t}"></option>`).join("");
        }

        const filterBtns = Array.from(document.querySelectorAll(".games-filter"));

        let mode = "all"; // all | available | soon

        function apply() {
            const q = norm(input?.value);

            cards.forEach((card) => {
                const title = norm(card.querySelector("h2")?.textContent);
                const isSoon = card.disabled || card.dataset.game === "soon";

                const matchText = !q || title.includes(q);
                const matchMode =
                    mode === "all" ||
                    (mode === "available" && !isSoon) ||
                    (mode === "soon" && isSoon);

                const cardDiff = card.dataset.difficulty || "0"; // se manca, NON deve passare
                const matchDiff = (diff === "all") || (cardDiff === diff);

                card.style.display = matchText && matchMode && matchDiff ? "" : "none";

                const empty = document.getElementById("games-empty");
                if (empty) empty.hidden = cards.some(c => c.style.display !== "none");
            });
        }

        input?.addEventListener("input", apply);

        filterBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                filterBtns.forEach((b) => b.setAttribute("aria-pressed", "false"));
                btn.setAttribute("aria-pressed", "true");
                mode = btn.dataset.filter || "all";
                apply();
            });
        });

        apply();
    }

    function setVvh() {
        const vv = window.visualViewport;
        const h = vv?.height ?? window.innerHeight;
        const top = vv?.offsetTop ?? 0;

        document.documentElement.style.setProperty("--vvh", `${h * 0.01}px`);
        document.documentElement.style.setProperty("--vv-top", `${top}px`);
    }

    setVvh();
    window.addEventListener("resize", setVvh);
    window.addEventListener("orientationchange", setVvh);
    window.visualViewport?.addEventListener("resize", setVvh);

    document.addEventListener("DOMContentLoaded", setupGameSearchAndFilters);
})();

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