/* =========================================================
   guard.js - Protezione pagine (UX)
   - usa api.me() (ritorna null se 401/403)
   - se non loggato: redirect a /auth.html
========================================================= */
console.log("[guard] loaded");

async function requireAuth() {
    try {
        const me = await api.me(); // nuovo metodo: /api/profile/me
        if (!me) {
            const next = encodeURIComponent(window.location.pathname);
            window.location.replace(`/auth.html?next=${next}`);
            return null;
        }
        return me;
    } catch (err) {
        if (err?.name === "ApiError" && (err.status === 401 || err.status === 403)) {
            const next = encodeURIComponent(window.location.pathname);
            window.location.replace(`/auth.html?next=${next}`);
            return null;
        }
        console.error(err);
        return null;
    }
}


// esponi global (per usarla anche in altri script)
window.requireAuth = requireAuth;


