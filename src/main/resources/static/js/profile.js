document.addEventListener("DOMContentLoaded", async () => {
    const me = await requireAuth();
    if (!me) return;

    // ----------------- CONFIG -----------------
    const AVATAR_BASE = "/assets/avatars";
    const AVATAR_DEFAULT_ID = 1;
    const AVATAR_EXT = "webp";
    const AVATARS = [
        { id: 1, unlockLevel: 1 },
        { id: 2, unlockLevel: 1 },
        // in futuro: { id: 3, unlockLevel: 5 }, ...
    ];

    const getAvatarSrc = (id) => `${AVATAR_BASE}/avatar-${id}.${AVATAR_EXT}`;

    // ----------------- DOM -----------------
    const $avatar = document.querySelector("#profile-avatar");
    const $username = document.querySelector("#profile-username");
    const $email = document.querySelector("#profile-email");
    const $level = document.querySelector("#profile-level");
    const $best = document.querySelector("#best-score");
    const $last = document.querySelector("#last-score");

    const $btnOpenAvatar = document.querySelector("#btn-open-avatar");
    const $avatarModal = document.querySelector("#avatar-modal");
    const $avatarGrid = document.querySelector("#avatar-grid");
    const $avatarHint = document.querySelector("#avatar-modal-hint");
    const $btnAvatarSave = document.querySelector("#btn-avatar-save");

    // ----------------- RENDER BASE (già ok) -----------------
    $username && ($username.textContent = me.username ?? "—");
    $email && ($email.textContent = me.email ?? "—");
    $level && ($level.textContent = String(me.level ?? 1));
    $best && ($best.textContent = String(me.bestScore ?? 0));
    $last && ($last.textContent = String(me.lastScore ?? 0));

    // avatar iniziale
    const currentAvatarId = me.avatarId ?? AVATAR_DEFAULT_ID;
    setProfileAvatar(currentAvatarId);

    function setProfileAvatar(avatarId) {
        if (!$avatar) return;
        $avatar.src = getAvatarSrc(avatarId);
        $avatar.alt = `Avatar ${avatarId}`;
        $avatar.dataset.avatarId = String(avatarId);
        $avatar.onerror = () => {
            $avatar.onerror = null;
            $avatar.src = getAvatarSrc(AVATAR_DEFAULT_ID);
        };
    }

    // ----------------- AVATAR MODAL (STRATO 1) -----------------
    let selectedAvatarId = null;

    $btnOpenAvatar?.addEventListener("click", () => {
        selectedAvatarId = null;
        $btnAvatarSave.disabled = true;
        $avatarHint.textContent = "";

        renderAvatarGrid({
            userLevel: me.level ?? 1,
            currentAvatarId: Number($avatar?.dataset.avatarId ?? currentAvatarId),
        });

        openDialog($avatarModal);
    });

    function renderAvatarGrid({ userLevel, currentAvatarId }) {
        $avatarGrid.innerHTML = "";

        for (const a of AVATARS) {
            const locked = userLevel < a.unlockLevel;

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "avatar-item" + (locked ? " is-locked" : "");
            btn.setAttribute("role", "listitem");
            btn.dataset.avatarId = String(a.id);

            // accessibility
            btn.setAttribute("aria-pressed", String(a.id === currentAvatarId));
            if (locked) {
                btn.disabled = true;
                btn.setAttribute("aria-disabled", "true");
            }

            const img = document.createElement("img");
            img.src = getAvatarSrc(a.id);
            img.alt = `Avatar ${a.id}`;
            img.loading = "lazy";
            img.onerror = () => {
                img.onerror = null;
                img.src = getAvatarSrc(AVATAR_DEFAULT_ID);
            };

            const badge = document.createElement("span");
            badge.className = "avatar-badge";
            badge.textContent = locked ? `Lvl ${a.unlockLevel}` : "Disponibile";

            btn.append(img, badge);

            btn.addEventListener("click", () => {
                // aggiorna selezione UI
                [...$avatarGrid.querySelectorAll(".avatar-item")].forEach((el) =>
                    el.setAttribute("aria-pressed", "false")
                );
                btn.setAttribute("aria-pressed", "true");

                selectedAvatarId = a.id;
                $btnAvatarSave.disabled = false;
                $avatarHint.textContent = `Selezionato: Avatar ${a.id}`;
            });

            $avatarGrid.appendChild(btn);
        }
    }

    $btnAvatarSave?.addEventListener("click", async () => {
        if (!selectedAvatarId) return;

        $btnAvatarSave.disabled = true;
        $avatarHint.textContent = "Salvataggio…";

        try {
            const payload = await api.updateMyAvatar(selectedAvatarId);

            // supporta sia "MeResponse" plain, sia "ApiResponse {data}"
            const updated = payload?.data ?? payload;

            // aggiorna UI
            setProfileAvatar(updated?.avatarId ?? selectedAvatarId);
            $avatarHint.textContent = "Avatar aggiornato ✅";

            // chiudi dopo un attimo (UX)
            setTimeout(() => closeDialog($avatarModal), 250);
        } catch (err) {
            console.error(err);
            $avatarHint.textContent = err?.message || "Errore nel salvataggio avatar.";
            $btnAvatarSave.disabled = false;
        }
    });

    // ----------------- DIALOG HELPERS -----------------
    function openDialog(dialogEl) {
        if (!dialogEl) return;
        if (typeof dialogEl.showModal === "function") dialogEl.showModal();
        else dialogEl.setAttribute("open", ""); // fallback brutale
    }

    function closeDialog(dialogEl) {
        if (!dialogEl) return;
        if (typeof dialogEl.close === "function") dialogEl.close();
        else dialogEl.removeAttribute("open");
    }

    // ================== SETTINGS MODAL (solo open/close) ==================
    const $btnSettings = document.querySelector("#btn-settings");
    const $settingsModal = document.querySelector("#settings-modal");

    $btnSettings?.addEventListener("click", () => {
        openDialog($settingsModal);
    });

    // opzionale: chiusura  per reset UI quando chiude
    $settingsModal?.addEventListener("close", () => {
        // esempio: reset feedback
        const fb = document.querySelector("#settings-feedback");
        if (fb) fb.textContent = "";
    });

    document.querySelector("#btn-change-password")?.addEventListener("click", async () => {
        const oldPassword = document.querySelector("#old-password")?.value ?? "";
        const newPassword = document.querySelector("#new-password")?.value ?? "";
        const newPasswordConfirm = document.querySelector("#new-password-2")?.value ?? "";
        const feedback = document.querySelector("#settings-feedback");

        if (feedback) feedback.textContent = "";

        try {
            await api.changeMyPassword(oldPassword, newPassword, newPasswordConfirm);

            // feedback + redirect
            if (feedback) feedback.textContent = "Password aggiornata ✅ Ti reindirizzo al login…";

            const next = encodeURIComponent("/profile.html");
            setTimeout(() => {
                window.location.replace(`/auth.html?next=${next}`);
            }, 600);
        } catch (err) {
            console.error(err);

            // VALIDATION_ERROR: mostra fieldErrors
            if (err?.fieldErrors && feedback) {
                const lines = Object.entries(err.fieldErrors).map(([k, v]) => `${k}: ${v}`);
                feedback.textContent = lines.join(" | ");
                return;
            }

            if (feedback) feedback.textContent = err?.message || "Errore nel cambio password.";
        }
    });

    document.querySelector("#btn-logout")?.addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        const feedback = document.querySelector("#settings-feedback");

        btn.disabled = true;
        if (feedback) feedback.textContent = "Logout…";

        try {
            await api.logout();
            window.location.replace("/auth.html");
        } catch (err) {
            console.error(err);
            if (feedback) feedback.textContent = err?.message || "Errore durante il logout.";
            btn.disabled = false;
        }
    });

    document.querySelector("#btn-change-username")?.addEventListener("click", async () => {
        const input = document.querySelector("#new-username");
        const feedback = document.querySelector("#settings-feedback");
        const newUsername = input?.value ?? "";

        if (feedback) feedback.textContent = "";

        try {
            await api.changeMyUsername(newUsername);

            if (feedback) feedback.textContent = "Username aggiornato ✅ Ti reindirizzo al login…";

            const next = encodeURIComponent("/index.html");
            setTimeout(() => {
                window.location.replace(`/auth.html?next=${next}`);
            }, 600);
        } catch (err) {
            console.error(err);

            // VALIDATION_ERROR (fieldErrors)
            if (err?.fieldErrors?.newUsername && feedback) {
                feedback.textContent = err.fieldErrors.newUsername;
                return;
            }

            if (feedback) feedback.textContent = err?.message || "Errore nel cambio username.";
        }
    });
});
