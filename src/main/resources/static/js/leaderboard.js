document.addEventListener("DOMContentLoaded", async () => {
    const me = await requireAuth();
    if (!me) return; // requireAuth already redirects guest -> auth

    const loading = document.getElementById("lb-loading");
    const errorBox = document.getElementById("lb-error");
    const errorText = document.getElementById("lb-error-text");
    const tbody = document.getElementById("lb-rows");
    const emptyHint = document.getElementById("lb-empty");

    function show(el) { el.hidden = false; }
    function hide(el) { el.hidden = true; }

    async function loadLeaderboard(gameCode = 'flappy', limit = 20) {
        try {
            show(loading);
            hide(errorBox);
            hide(emptyHint);
            tbody.innerHTML = "";

            const payload = await api.get(`/api/leaderboard/game/${encodeURIComponent(gameCode)}?limit=${limit}`);
            const rows = (payload && payload.rows) ? payload.rows : [];

            if (!rows.length) {
                show(emptyHint);
                return;
            }

            rows.forEach((r, idx) => {
                const tr = document.createElement('tr');

                const rank = document.createElement('th');
                rank.setAttribute('scope', 'row');
                rank.textContent = String(idx + 1);

                const userTd = document.createElement('td');
                userTd.textContent = r.username || '—';

                const scoreTd = document.createElement('td');
                scoreTd.textContent = r.bestScore != null ? String(r.bestScore) : '0';

                const levelTd = document.createElement('td');
                levelTd.textContent = r.level != null ? String(r.level) : '—';

                tr.appendChild(rank);
                tr.appendChild(userTd);
                tr.appendChild(scoreTd);
                tr.appendChild(levelTd);

                tbody.appendChild(tr);
            });

        } catch (err) {
            console.error('Leaderboard load failed', err);
            show(errorBox);
            errorText.textContent = err?.message || 'Impossibile caricare la classifica.';
        } finally {
            hide(loading);
        }
    }

    async function loadTopPerGame(limit = 20) {
        const gamesTbody = document.getElementById('lb-games-rows');
        const gamesEmpty = document.getElementById('lb-games-empty');
        gamesTbody.innerHTML = '';
        try {
            const rows = await api.get(`/api/leaderboard/games?limit=${limit}`);
            if (!rows || !rows.length) {
                gamesEmpty.hidden = false;
                return;
            }
            gamesEmpty.hidden = true;
            rows.forEach((r) => {
                const tr = document.createElement('tr');

                const gameTd = document.createElement('td');
                gameTd.textContent = r.gameCode || '—';

                const userTd = document.createElement('td');
                userTd.textContent = r.username || '—';

                const scoreTd = document.createElement('td');
                scoreTd.textContent = r.bestScore != null ? String(r.bestScore) : '0';

                const levelTd = document.createElement('td');
                levelTd.textContent = r.level != null ? String(r.level) : '—';

                tr.appendChild(gameTd);
                tr.appendChild(userTd);
                tr.appendChild(scoreTd);
                tr.appendChild(levelTd);
                gamesTbody.appendChild(tr);
            });
        } catch (err) {
            console.error('Top-per-game load failed', err);
            const gamesError = document.getElementById('lb-error');
            gamesError.hidden = false;
            document.getElementById('lb-error-text').textContent = 'Impossibile caricare la classifica per gioco.';
        }
    }

    async function populateGameSelector() {
        const sel = document.getElementById('game-select');
        try {
            const codes = await api.get('/api/leaderboard/games/codes');
            if (Array.isArray(codes) && codes.length) {
                sel.innerHTML = '';
                codes.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c;
                    opt.textContent = c.charAt(0).toUpperCase() + c.slice(1);
                    sel.appendChild(opt);
                });
            }
        } catch (err) {
            // leave default
            console.warn('Could not populate game selector', err);
        }

        sel.addEventListener('change', () => {
            loadLeaderboard(sel.value, 20);
        });
    }

    // initial load
    await populateGameSelector();
    const sel = document.getElementById('game-select');
    loadLeaderboard(sel ? sel.value : 'flappy', 20);
    loadTopPerGame(20);

    // optional: you can add UI to change limit later
});