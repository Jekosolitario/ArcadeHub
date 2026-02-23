document.addEventListener("DOMContentLoaded", async () => {
    const me = await requireAuth();
    if (!me) return;

    // DOM
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

    const podium = document.querySelector(".lb-podium");

    const LIMIT = 20;

    // Endpoint (adatta se serve)
    const ENDPOINTS = {
        global: (limit) => `/api/leaderboard/global?limit=${limit}`,
        game: (gameCode, limit) =>
            `/api/leaderboard/game/${encodeURIComponent(gameCode)}?limit=${limit}`,
    };

    // helpers
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

    const IMG_1PX =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

    function renderRow(rank, scope, data) {
        const fragment = rowTpl.content.cloneNode(true);
        const tr = fragment.querySelector("tr");
        const uname = (data.username ?? "").toLowerCase().trim();
        const meName = (me?.username ?? "").toLowerCase().trim();

        if (meName && uname === meName) {
            tr.classList.add("is-me");
            tr.setAttribute("data-me", "true");
        }

        tr.querySelector('[data-field="rank"]').textContent = String(rank);

        const img = tr.querySelector('[data-field="avatarUrl"]');
        img.src = data.avatarUrl || IMG_1PX;
        img.alt = data.username ? `Avatar di ${data.username}` : "Avatar";

        tr.querySelector('[data-field="username"]').textContent = data.username ?? "—";

        if (scope === "GLOBAL") {
            // LeaderboardResponse
            tr.querySelector('[data-field="totalScore"]').textContent = String(data.totalScore ?? 0);
            tr.querySelector('[data-field="totalPlayed"]').textContent = String(data.totalPlayed ?? 0);
            tr.querySelector('[data-field="level"]').textContent = String(data.level ?? "—");
        } else {
            // GameTopDTO
            tr.querySelector('[data-field="bestScore"]').textContent = String(data.bestScore ?? 0);
            tr.querySelector('[data-field="playedCount"]').textContent = String(data.playedCount ?? 0);
            tr.querySelector('[data-field="levelGame"]').textContent = String(data.level ?? "—");
        }

        // toggle celle riga (coerente col thead)
        const showGlobal = scope === "GLOBAL";
        tr.querySelectorAll('[data-col="GLOBAL"]').forEach((el) => (el.hidden = !showGlobal));
        tr.querySelectorAll('[data-col="GAME"]').forEach((el) => (el.hidden = showGlobal));

        tbody.appendChild(fragment);
    }

    function renderPodium(scope, rows) {
        if (!podium) return;

        const list = Array.isArray(rows) ? rows : [];
        const n = list.length;

        if (n === 0) {
            podium.hidden = true;
            return;
        }

        podium.hidden = false;

        const scoreField = (scope === "GLOBAL") ? "totalScore" : "bestScore";
        const cards = podium.querySelectorAll(".lb-podium__card");
        const mapRowIndex = [1, 0, 2]; // 2°,1°,3°

        const meName = (me?.username ?? "").toLowerCase().trim();

        mapRowIndex.forEach((rowIdx, i) => {
            const card = cards[i];
            const img = card.querySelector(".lb-podium__avatar");
            const name = card.querySelector(".lb-podium__name");
            const score = card.querySelector(".lb-podium__score");

            const r = list[rowIdx];

            if (!r) {
                img.src = IMG_1PX;
                img.alt = "";
                name.textContent = "—";
                score.textContent = "";
                card.style.opacity = "0.45";
                card.classList.remove("is-me");
                return;
            }

            card.style.opacity = "1";
            img.src = r.avatarUrl || IMG_1PX;
            img.alt = r.username ? `Avatar di ${r.username}` : "Avatar";
            name.textContent = r.username ?? "—";
            score.textContent = `Score: ${String(r?.[scoreField] ?? 0)}`;

            const uname = (r.username ?? "").toLowerCase().trim();
            card.classList.toggle("is-me", !!meName && uname === meName);
        });
    }

    async function fetchLeaderboard() {
        const scope = scopeSelect.value; // GLOBAL | GAME
        const gameCode = gameSelect.value;

        toggleColumns(scope);
        setStatus({ loading: true, empty: false, error: "" });
        clearTable();

        try {
            const url = scope === "GLOBAL" ? ENDPOINTS.global(LIMIT) : ENDPOINTS.game(gameCode, LIMIT);
            const payload = await api.get(url);

            // GLOBAL => array
            // GAME   => { rows: [...] }
            const rows = Array.isArray(payload) ? payload : (payload?.rows ?? []);
            renderPodium(scope, rows);

            if (rows.length === 0) {
                setStatus({ loading: false, empty: true, error: "" });
                podium && (podium.hidden = true);
                return;
            }

            rows.forEach((r, idx) => renderRow(idx + 1, scope, r));
            setStatus({ loading: false, empty: false, error: "" });
            stampUpdated();
        } catch (err) {
            console.error("Leaderboard load failed", err);
            setStatus({
                loading: false,
                empty: false,
                error: err?.message || "Impossibile caricare la classifica.",
            });
        }
    }

    function syncScopeUI() {
        const isGame = scopeSelect.value === "GAME";
        gameWrap.hidden = !isGame;
        toggleColumns(scopeSelect.value);
    }

    // events
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