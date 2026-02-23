// /js/feedback.js
(() => {
    function getModal() {
        return document.getElementById("feedbackModal");
    }

    function openModal() {
        const modal = getModal();
        const authBox = modal.querySelector("#fb-auth-required");
        const formWrap = modal.querySelector("#feedbackForm");
        if (authBox) authBox.hidden = true;
        if (formWrap) formWrap.hidden = false;
        if (!modal) return;

        modal.setAttribute("aria-hidden", "false");

        setTimeout(() => {
            modal.querySelector("#fb-type")?.focus();
        }, 0);

        const page = modal.querySelector("#fb-page");
        const ua = modal.querySelector("#fb-ua");
        const status = modal.querySelector("#fb-status");

        if (page) page.value = location.pathname;
        if (ua) ua.value = navigator.userAgent;
        if (status) status.textContent = "";
    }

    function closeModal() {
        const modal = getModal();
        if (!modal) return;

        modal.setAttribute("aria-hidden", "true");

        // sposta il focus fuori dalla modale
        if (lastOpener && typeof lastOpener.focus === "function") {
            lastOpener.focus();
        } else {
            // fallback: focus sul body (evita warning)
            document.body.focus?.();
        }
    }

    function setStatus(text) {
        const modal = getModal();
        const status = modal?.querySelector("#fb-status");
        if (status) status.textContent = text ?? "";
    }

    let lastOpener = null;

    // CLICK: apre/chiude anche se footer/modal vengono inseriti dopo
    document.addEventListener("click", (e) => {
        const openBtn = e.target.closest("[data-open-feedback]");
        if (openBtn) {
            lastOpener = openBtn;
            openModal();
            return;
        }

        const closeBtn = e.target.closest("[data-close-feedback]");
        if (closeBtn) {
            closeModal();
            return;
        }

        // click su backdrop
        if (e.target.matches("#feedbackModal .modal-backdrop[data-close='true']")) {
            closeModal();
        }
    });

    // ESC
    document.addEventListener("keydown", (e) => {
        const modal = getModal();
        if (!modal) return;
        if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
            closeModal();
        }
    });

    // SUBMIT (reale)
    document.addEventListener("submit", async (e) => {
        if (e.target?.id !== "feedbackForm") return;
        e.preventDefault();

        const form = e.target;

        const data = Object.fromEntries(new FormData(form).entries());
        const msg = String(data.message ?? "").trim();
        const email = String(data.email ?? "").trim();
        const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        if (!email) {
            setStatus("Inserisci un’email per poterti ricontattare.");
            return;
        }
        if (!EMAIL_RE.test(email)) {
            setStatus("Email non valida.");
            return;
        }

        if (!email) {
            setStatus("Inserisci un’email per poterti ricontattare.");
            return;
        }
        if (msg.length < 3) {
            setStatus("Scrivi un messaggio un po’ più dettagliato 🙂");
            return;
        }

        // payload per DTO backend (record)
        const payload = {
            type: data.type || "BUG",
            email,
            message: msg,
            page: data.page || location.pathname,
            userAgent: data.userAgent || navigator.userAgent,
        };

        try {
            setStatus("Invio in corso…");

            const res = await fetch("/api/feedback", {
                method: "POST",
                credentials: "include", // IMPORTANTISSIMO per cookie sessione
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.status === 401 || res.status === 403) {
                const modal = getModal();
                const authBox = modal?.querySelector("#fb-auth-required");
                const goLogin = modal?.querySelector("#fb-go-login");
                const formWrap = modal?.querySelector("#feedbackForm");

                if (goLogin) {
                    goLogin.href = `/auth.html?next=${encodeURIComponent(location.pathname + location.search + location.hash)}`;
                }

                if (authBox) authBox.hidden = false;
                if (formWrap) formWrap.hidden = true;

                setStatus("Accedi per inviare una segnalazione.");
                return;
            }

            if (!res.ok) {
                // prova a leggere dettagli (se li ritorni), altrimenti msg generico
                let details = "";
                try {
                    details = await res.text();
                } catch (_) { }
                setStatus("Errore nell’invio. Riprova tra poco.");
                console.error("Feedback error:", res.status, details);
                return;
            }

            setStatus("Grazie! Messaggio inviato ✅");
            form.reset();
            setTimeout(closeModal, 700);
        } catch (err) {
            console.error(err);
            setStatus("Connessione non disponibile. Riprova.");
        }
    });
})();