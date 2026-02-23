document.addEventListener("DOMContentLoaded", async () => {
    const tbody = document.getElementById("home-lb-tbody");
    const status = document.getElementById("home-lb-status");
    if (!tbody) return;

    const setStatus = (msg = "") => {
        if (status) status.textContent = msg;
    };

    const IMG_1PX =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";


    function renderHomePodium(rows) {
        const podium = document.querySelector(".home-podium");
        if (!podium) return;

        if (!Array.isArray(rows) || rows.length === 0) {
            podium.hidden = true;
            return;
        }

        podium.hidden = false;

        const IMG_1PX =
            "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

        const cards = [
            podium.querySelector(".home-podium__card--1"),
            podium.querySelector(".home-podium__card--2"),
            podium.querySelector(".home-podium__card--3"),
        ];

        cards.forEach((card, idx) => {
            if (!card) return;

            const r = rows[idx]; // 0->1°, 1->2°, 2->3°
            const img = card.querySelector(".home-podium__avatar");
            const name = card.querySelector(".home-podium__name");
            const score = card.querySelector(".home-podium__score");

            if (!r) {
                img.src = IMG_1PX;
                img.alt = "";
                name.textContent = "—";
                score.textContent = "";
                card.style.opacity = "0.45";
                return;
            }

            card.style.opacity = "1";
            img.src = r.avatarUrl || IMG_1PX;
            img.alt = r.username ? `Avatar di ${r.username}` : "Avatar";
            name.textContent = r.username ?? "—";
            score.textContent = `Score: ${String(r.totalScore ?? 0)}`;
        });
    }

    try {
        setStatus("Caricamento classifica…");
        tbody.innerHTML = "";

        const payload = await api.get("/api/leaderboard/global?limit=5");
        const rows = Array.isArray(payload) ? payload : [];
        renderHomePodium(rows);

        if (rows.length === 0) {
            setStatus("Nessun dato disponibile.");
            return;
        }

        rows.forEach((r, idx) => {
            const tr = document.createElement("tr");

            const th = document.createElement("th");
            th.scope = "row";
            th.className = "cell-rank";
            th.textContent = String(idx + 1);

            const tdAvatar = document.createElement("td");
            tdAvatar.className = "cell-avatar";
            const img = document.createElement("img");
            img.className = "avatar";
            img.loading = "lazy";
            img.width = 32;
            img.height = 32;
            img.src = r.avatarUrl || IMG_1PX;
            img.alt = r.username ? `Avatar di ${r.username}` : "Avatar";
            tdAvatar.appendChild(img);

            const tdUser = document.createElement("td");
            tdUser.textContent = r.username ?? "—";

            const tdScore = document.createElement("td");
            tdScore.textContent = String(r.totalScore ?? 0);

            const tdLevel = document.createElement("td");
            tdLevel.textContent = String(r.level ?? "—");

            tr.append(th, tdAvatar, tdUser, tdScore, tdLevel);
            tbody.appendChild(tr);
        });

        setStatus("");
    } catch (err) {
        console.error("Home Top5 load failed", err);
        setStatus("Impossibile caricare la classifica.");
    }
});