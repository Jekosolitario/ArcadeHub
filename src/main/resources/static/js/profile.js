document.addEventListener("DOMContentLoaded", async () => {
    const me = await requireAuth();
    if (!me) return;

    // ---- mapping DOM
    const $username = document.querySelector("#profile-username");
    const $email = document.querySelector("#profile-email");
    const $level = document.querySelector("#profile-level");
    const $avatar = document.querySelector("#profile-avatar");
    const $best = document.querySelector("#best-score");
    const $last = document.querySelector("#last-score");

    // (se lo aggiungerete nel DTO)
    const $createdAt = document.querySelector("#profile-createdAt");

    // ---- fill
    if ($username) $username.textContent = me.username ?? "—";
    if ($email) $email.textContent = me.email ?? "—";
    if ($level) $level.textContent = String(me.level ?? 1);

    if ($best) $best.textContent = String(me.bestScore ?? 0);
    if ($last) $last.textContent = String(me.lastScore ?? 0);

    // avatarId -> path (adatta al tuo naming reale)
    const AVATAR_BASE = "/assets/avatars";
    const AVATAR_DEFAULT = `${AVATAR_BASE}/avatar-1.webp`;

    function getAvatarSrc(avatarId) {
        return `${AVATAR_BASE}/avatar-${avatarId}.webp`;
    }

    if ($avatar) {
        const avatarId = me.avatarId ?? 1;

        $avatar.src = getAvatarSrc(avatarId);
        $avatar.alt = `Avatar ${avatarId}`;
        $avatar.dataset.avatarId = String(avatarId);

        $avatar.onerror = () => {
            $avatar.onerror = null;
            $avatar.src = AVATAR_DEFAULT;
        };
    }

    // createdAt (solo se backend lo manda)
    if ($createdAt && me.createdAt) {
        const d = new Date(me.createdAt);
        $createdAt.dateTime = d.toISOString();
        $createdAt.textContent = d.toLocaleDateString("it-IT", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    }
});
