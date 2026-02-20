document.addEventListener("DOMContentLoaded", async () => {
    const me = await requireAuth();
    if (!me) return;

    // ----------------- CONFIG -----------------
    const AVATAR_BASE = "/assets/avatars";
    const AVATAR_DEFAULT_ID = 1;
    const AVATAR_EXT = "webp";

    // fallback se per qualche motivo manca imageUrl dal backend
    const fallbackAvatarSrc = (id) => `${AVATAR_BASE}/avatar-${id}.${AVATAR_EXT}`;

    // cache avatar dal backend
    let avatarList = [];
    let selectedAvatarId = null;

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

    const $deleteInput = document.querySelector("#delete-confirm");
    const $btnDelete = document.querySelector("#btn-delete-account");
    const $feedback = document.querySelector("#settings-feedback");

    // ----------------- RENDER BASE -----------------
    $username && ($username.textContent = me.username ?? "—");
    $email && ($email.textContent = me.email ?? "—");
    $level && ($level.textContent = String(me.level ?? 1));
    $best && ($best.textContent = String(me.bestScore ?? 0));
    $last && ($last.textContent = String(me.lastScore ?? 0));

    // avatar iniziale (id preso dal backend se presente)
    const currentAvatarId = Number(me.avatarId ?? AVATAR_DEFAULT_ID);
    setProfileAvatar(currentAvatarId);

    function setProfileAvatar(avatarId) {
        if (!$avatar) return;

        // prova a usare imageUrl dal backend (se abbiamo già caricato la lista)
        const fromApi = avatarList.find(a => String(a.id) === String(avatarId));
        const src = fromApi?.imageUrl || fallbackAvatarSrc(avatarId);

        $avatar.src = src;
        $avatar.alt = fromApi?.name ? fromApi.name : `Avatar ${avatarId}`;
        $avatar.dataset.avatarId = String(avatarId);

        $avatar.onerror = () => {
            $avatar.onerror = null;
            $avatar.src = fallbackAvatarSrc(AVATAR_DEFAULT_ID);
            $avatar.alt = `Avatar ${AVATAR_DEFAULT_ID}`;
        };
    }

    // ----------------- AVATAR API -----------------
    async function loadAvatars() {
        // GET /api/avatars -> List<AvatarDto>
        // AvatarDto: { id, name, imageUrl, requiredLevel, unlocked }
        const list = await api.get("/api/avatars");
        if (!Array.isArray(list)) return [];
        return list;
    }

    async function saveMyAvatar(avatarId) {
        // POST /api/me/avatar -> 204 No Content
        await api.post("/api/me/avatar", { avatarId: Number(avatarId) });
        return true;
    }

    // ----------------- AVATAR MODAL -----------------
    $btnOpenAvatar?.addEventListener("click", async () => {
        selectedAvatarId = null;
        $btnAvatarSave.disabled = true;
        $avatarHint.textContent = "Caricamento avatar…";

        try {
            avatarList = await loadAvatars();
            $avatarHint.textContent = "";

            renderAvatarGrid({
                userLevel: Number(me.level ?? 1),
                currentAvatarId: Number($avatar?.dataset.avatarId ?? currentAvatarId),
            });

            openDialog($avatarModal);
        } catch (err) {
            console.error(err);
            $avatarHint.textContent = err?.message || "Errore caricamento avatar.";
        }
    });

    function renderAvatarGrid({ userLevel, currentAvatarId }) {
        if (!$avatarGrid) return;

        $avatarGrid.innerHTML = "";

        for (const a of avatarList) {
            // Il backend già calcola unlocked, ma teniamo anche check per sicurezza
            const locked = !a.unlocked || userLevel < Number(a.requiredLevel ?? 1);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "avatar-item" + (locked ? " is-locked" : "");
            btn.setAttribute("role", "listitem");
            btn.dataset.avatarId = String(a.id);

            // accessibility
            btn.setAttribute("aria-pressed", String(Number(a.id) === Number(currentAvatarId)));
            if (locked) {
                btn.disabled = true;
                btn.setAttribute("aria-disabled", "true");
            }

            const img = document.createElement("img");
            img.src = a.imageUrl || fallbackAvatarSrc(a.id);
            img.alt = a.name ? `${a.name}${locked ? " bloccato" : ""}` : `Avatar ${a.id}`;
            img.loading = "lazy";
            img.onerror = () => {
                img.onerror = null;
                img.src = fallbackAvatarSrc(AVATAR_DEFAULT_ID);
            };

            const badge = document.createElement("span");
            badge.className = "avatar-badge";
            badge.textContent = locked ? `🔒 Liv. ${a.requiredLevel}` : `Liv. ${a.requiredLevel}`;

            btn.append(img, badge);

            btn.addEventListener("click", () => {
                // aggiorna selezione UI
                [...$avatarGrid.querySelectorAll(".avatar-item")].forEach((el) =>
                    el.setAttribute("aria-pressed", "false")
                );
                btn.setAttribute("aria-pressed", "true");

                selectedAvatarId = Number(a.id);

                // abilita salva solo se cambia rispetto all'attuale
                const sameAsCurrent = selectedAvatarId === Number(currentAvatarId);
                $btnAvatarSave.disabled = sameAsCurrent;

                $avatarHint.textContent = a.name
                    ? `Selezionato: ${a.name}`
                    : `Selezionato: Avatar ${a.id}`;
            });

            $avatarGrid.appendChild(btn);
        }
    }

    $btnAvatarSave?.addEventListener("click", async () => {
        if (!selectedAvatarId) return;

        $btnAvatarSave.disabled = true;
        $avatarHint.textContent = "Salvataggio…";

        try {
            await saveMyAvatar(selectedAvatarId);

            // aggiorna UI profilo
            setProfileAvatar(selectedAvatarId);
            $avatarHint.textContent = "Avatar aggiornato ✅";

            // chiudi dopo un attimo (UX)
            setTimeout(() => closeDialog($avatarModal), 250);
        } catch (err) {
            console.error(err);

            // 403 -> locked (backend)
            if (err?.status === 403) {
                $avatarHint.textContent = "Avatar bloccato (livello insufficiente).";
            } else {
                $avatarHint.textContent = err?.message || "Errore nel salvataggio avatar.";
            }
            $btnAvatarSave.disabled = false;
        }
    });

    // ----------------- DIALOG HELPERS -----------------
    function openDialog(dialogEl) {
        if (!dialogEl) return;
        if (typeof dialogEl.showModal === "function") dialogEl.showModal();
        else dialogEl.setAttribute("open", ""); // fallback
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

    $settingsModal?.addEventListener("close", () => {
        const fb = document.querySelector("#settings-feedback");
        if (fb) fb.textContent = "";
    });

    // ----------------- SETTINGS ACTIONS -----------------
    document.querySelector("#btn-change-password")?.addEventListener("click", async () => {
        const oldPassword = document.querySelector("#old-password")?.value ?? "";
        const newPassword = document.querySelector("#new-password")?.value ?? "";
        const newPasswordConfirm = document.querySelector("#new-password-2")?.value ?? "";
        const feedback = document.querySelector("#settings-feedback");
        if (feedback) feedback.textContent = "";

        try {
            if (typeof api.changeMyPassword !== "function") {
                throw new Error("Endpoint cambio password non configurato in api.js");
            }
            await api.changeMyPassword(oldPassword, newPassword, newPasswordConfirm);

            if (feedback) feedback.textContent = "Password aggiornata ✅ Ti reindirizzo al login…";
            const next = encodeURIComponent("/profile.html");
            setTimeout(() => window.location.replace(`/auth.html?next=${next}`), 600);
        } catch (err) {
            console.error(err);
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
            // preferisci api.logout se esiste, altrimenti fetch diretto
            if (typeof api.logout === "function") {
                await api.logout();
            } else {
                await fetch("/auth/logout", { method: "POST", credentials: "include" });
            }
            window.location.replace("/index.html");
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
            if (typeof api.changeMyUsername !== "function") {
                throw new Error("Endpoint cambio username non configurato in api.js");
            }
            await api.changeMyUsername(newUsername);

            if (feedback) feedback.textContent = "Username aggiornato ✅ Ti reindirizzo al login…";
            const next = encodeURIComponent("/index.html");
            setTimeout(() => window.location.replace(`/auth.html?next=${next}`), 600);
        } catch (err) {
            console.error(err);
            if (err?.fieldErrors?.newUsername && feedback) {
                feedback.textContent = err.fieldErrors.newUsername;
                return;
            }
            if (feedback) feedback.textContent = err?.message || "Errore nel cambio username.";
        }
    });

    $deleteInput?.addEventListener("input", () => {
        const ok = ($deleteInput.value || "").trim().toUpperCase() === "ELIMINA";
        $btnDelete.disabled = !ok;
    });

    $btnDelete?.addEventListener("click", async () => {
        if ($feedback) $feedback.textContent = "Eliminazione in corso…";

        try {
            if (typeof api.deleteMyAccount !== "function") {
                throw new Error("Endpoint delete account non configurato in api.js");
            }
            await api.deleteMyAccount(($deleteInput?.value ?? "").trim().toUpperCase());
            window.location.replace("/index.html");
        } catch (err) {
            console.error(err);
            if ($feedback) $feedback.textContent = err?.message || "Errore eliminazione account.";
        }
    });
});