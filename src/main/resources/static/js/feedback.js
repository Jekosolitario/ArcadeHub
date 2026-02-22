// /js/feedback.js
(() => {
    function getModal() {
        return document.getElementById("feedbackModal");
    }

    function openModal() {
        const modal = getModal();
        if (!modal) return;

        modal.setAttribute("aria-hidden", "false");

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
    }

    // CLICK: apre/chiude anche se footer/modal vengono inseriti dopo
    document.addEventListener("click", (e) => {
        const openBtn = e.target.closest("[data-open-feedback]");
        if (openBtn) {
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
            return;
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

    // SUBMIT (demo)
    document.addEventListener("submit", async (e) => {
        if (e.target?.id !== "feedbackForm") return;
        e.preventDefault();

        const form = e.target;
        const modal = getModal();
        const status = modal?.querySelector("#fb-status");

        const data = Object.fromEntries(new FormData(form).entries());
        const msg = String(data.message ?? "").trim();
        const email = String(data.email ?? "").trim();
        if (!email) { status.textContent = "Inserisci un’email per poterti ricontattare."; return; }

        if (msg.length < 3) {
            if (status) status.textContent = "Scrivi un messaggio un po’ più dettagliato 🙂";
            return;
        }

        // TODO: qui chiamerai il backend (POST /api/feedback)
        if (status) status.textContent = "Grazie! Messaggio inviato (demo).";
        form.reset();
        setTimeout(closeModal, 700);
    });
})();