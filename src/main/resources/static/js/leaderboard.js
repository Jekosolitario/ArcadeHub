document.addEventListener("DOMContentLoaded", async () => {
    const me = await requireAuth();
    if (!me) return;

    // --- DOM ---
    const scopeSelect = document.getElementById("lb-scope");
    const gameWrap = document.getElementById("lb-game-wrap");
    const gameSelect = document.getElementById("lb-game");
    const refreshBtn = document.getElementById("lb-refresh");
    const updatedEl = document.getElementById("lb-updated");

    const loadingEl = document.getElementById("lb-loading");
    const emptyEl = document.getElementById("lb-empty");
    const errorEl = document.getElementById("lb-error");

    const tbody = document.getElementById("lb-tbody");
    const rowTpl = document.getElementById("lb-row-template");

    // --- CONFIG ENDPOINTS (ADATTA SE SERVE) ---
    const ENDPOINTS = {
        global: (limit) => `/api/leaderboard/global?limit=${limit}`,
        game: (gameCode, limit) => `/api/leaderboard/game/${encodeURIComponent(gameCode)}?limit=${limit}`,
        // opzionale (se esiste): lista giochi dal backend
        // games: () => `/api/games`,
    };

    const LIMIT = 20;

    // --- helpers UI ---
    const show = (el) => (el.hidden = false);
    const hide = (el) => (el.hidden = true);

    function setStatus({ loading = false, empty = false, error = "" }) {
        loading ? show(loadingEl) : hide(loadingEl);
        empty ? show(emptyEl) : hide(emptyEl);

        if (error) {
            errorEl.textContent = error;
            show(errorEl);
        } else {
            hide(errorEl);
        }
    }

    function clearTable() {
        tbody.innerHTML = "";
    }

    function normalizeRows(payload) {
        if (Array.isArray(payload)) return payload;
        if (payload && Array.isArray(payload.rows)) return payload.rows;
        if (payload && Array.isArray(payload.content)) return payload.content; // Spring Page<>
        return [];
    }

    function toggleColumns(scope) {
        const showGlobal = scope === "GLOBAL";
        document.querySelectorAll('[data-col="GLOBAL"]').forEach((el) => (el.hidden = !showGlobal));
        document.querySelectorAll('[data-col="GAME"]').forEach((el) => (el.hidden = showGlobal));
    }

    function stampUpdated() {
        const d = new Date();
        updatedEl.textContent = `Aggiornata alle ${d.toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit",
        })}`;
    }

    // placeholder 1x1 trasparente (evita icona rotta se manca url)
    const IMG_1PX =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

    function fillRow(node, data, rank, scope) {
        // rank
        node.querySelector('[data-field="rank"]').textContent = String(rank);

        // avatar
        const img = node.querySelector('[data-field="avatarUrl"]');
        const avatarUrl = data.avatarUrl || data.imageUrl || data.avatar || "";
        img.src = avatarUrl || IMG_1PX;
        img.alt = data.username ? `Avatar di ${data.username}` : "Avatar";

        // username
        node.querySelector('[data-field="username"]').textContent = data.username ?? "—";

        // campi GLOBAL
        const totalScore = data.totalScore ?? data.sumBestScore ?? data.scoreTotal ?? 0;
        const totalPlayed = data.totalPlayed ?? data.totalGamesPlayed ?? data.playedTotal ?? 0;
        const level = data.level ?? data.userLevel ?? "—";

        const bestScore = data.bestScore ?? 0;
        const playedCount = data.playedCount ?? data.gamePlayedCount ?? 0;

        // compila tutte le celle esistenti nel template
        const setText = (selector, value) => {
            const el = node.querySelector(selector);
            if (el) el.textContent = value;
        };

        setText('[data-field="totalScore"]', String(totalScore));
        setText('[data-field="totalPlayed"]', String(totalPlayed));
        setText('[data-field="level"]', String(level));

        setText('[data-field="bestScore"]', String(bestScore));
        setText('[data-field="playedCount"]', String(playedCount));

        // toggle hidden sulle celle della riga in base allo scope
        const showGlobal = scope === "GLOBAL";
        node.querySelectorAll('[data-col="GLOBAL"]').forEach((el) => (el.hidden = !showGlobal));
        node.querySelectorAll('[data-col="GAME"]').forEach((el) => (el.hidden = showGlobal));
    }

    function render(rows, scope) {
        clearTable();
        rows.forEach((r, idx) => {
            const fragment = rowTpl.content.cloneNode(true);
            const tr = fragment.querySelector("tr");
            fillRow(tr, r, idx + 1, scope);
            tbody.appendChild(fragment);
        });
    }

    // --- fetch ---
    async function fetchLeaderboard() {
        const scope = scopeSelect.value; // GLOBAL | GAME
        const gameCode = gameSelect.value;

        toggleColumns(scope);
        setStatus({ loading: true, empty: false, error: "" });

        try {
            const url = scope === "GLOBAL" ? ENDPOINTS.global(LIMIT) : ENDPOINTS.game(gameCode, LIMIT);
            const payload = await api.get(url);
            const rows = normalizeRows(payload);

            if (!rows.length) {
                clearTable();
                setStatus({ loading: false, empty: true, error: "" });
                stampUpdated();
                return;
            }

            render(rows, scope);
            setStatus({ loading: false, empty: false, error: "" });
            stampUpdated();
        } catch (err) {
            console.error("Leaderboard load failed", err);
            clearTable();
            setStatus({
                loading: false,
                empty: false,
                error: err?.message || "Impossibile caricare la classifica.",
            });
        }
    }

    // --- UI events ---
    function syncScopeUI() {
        const isGame = scopeSelect.value === "GAME";
        gameWrap.hidden = !isGame;
        toggleColumns(scopeSelect.value);
    }

    scopeSelect.addEventListener("change", async () => {
        syncScopeUI();
        await fetchLeaderboard();
    });

    gameSelect.addEventListener("change", async () => {
        if (scopeSelect.value === "GAME") await fetchLeaderboard();
    });

    refreshBtn.addEventListener("click", fetchLeaderboard);

    // init
    syncScopeUI();
    await fetchLeaderboard();
});