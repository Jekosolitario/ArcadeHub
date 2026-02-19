/* =========================================================
   api.js - API Client (fetch wrapper) ✅
   - JSON GET/POST/PUT
   - credentials: 'include' per session cookie (JSESSIONID)
   - error handling standardizzato (400/401/403/409)
   - api.me(): GET /api/me -> null se 401
========================================================= */

const api = (() => {
    // Se FE e BE sono sulla stessa origin, lascia BASE_URL vuota.
    // Se FE è su 5173 e BE su 8080, metti: "http://localhost:8080"
    const BASE_URL = ""; // oppure "http://localhost:8080"

    // Richiesta utente corrente (come da specifica)
    const ME_PATH = "/auth/me";

    // PROFILO (protetto da sessione)
    const PROFILE_ME_PATH = "/api/profile/me";
    const PROFILE_AVATAR_PATH = "/api/profile/me/avatar";

    /**
     * Errore API standard.
     * - status: HTTP status
     * - code: stringa (se il backend la manda: es. "VALIDATION_ERROR")
     * - message: messaggio human-friendly
     * - fieldErrors: mappa per form validation (es. {username:"...", password:"..."})
     */
    class ApiError extends Error {
        constructor({ status, code, message, fieldErrors, details }) {
            super(message || `HTTP ${status}`);
            this.name = "ApiError";
            this.status = status;
            this.code = code || null;
            this.fieldErrors = fieldErrors || null;
            this.details = details || null; // body raw o extra info
        }
    }

    // -------------------- Core fetch wrapper --------------------
    async function request(path, { method = "GET", body, headers = {}, signal } = {}) {
        const url = BASE_URL + path;

        const opts = {
            method,
            credentials: "include", // ⭐ fondamentale per session cookie
            headers: {
                ...headers,
            },
            signal,
        };

        // Se body è presente, inviamo JSON
        if (body !== undefined) {
            opts.headers["Content-Type"] = opts.headers["Content-Type"] || "application/json";
            opts.body = typeof body === "string" ? body : JSON.stringify(body);
        }

        const res = await fetch(url, opts);

        // Proviamo a leggere risposta come JSON, se possibile
        let data = null;
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            try {
                data = await res.json();
            } catch {
                data = null;
            }
        } else {
            // se non è json, proviamo testo (utile per debug)
            try {
                data = await res.text();
            } catch {
                data = null;
            }
        }

        if (res.ok) return data;

        // Normalizzazione errori:
        // Se il backend manda ApiError { error, message, fieldErrors }
        // lo mappiamo in modo stabile.
        const normalized = normalizeError(res.status, data);
        throw new ApiError(normalized);
    }

    function normalizeError(status, data) {
        // Caso backend con ApiError (consigliato)
        if (data && typeof data === "object") {
            const code = data.error || data.code || null;
            const message = data.message || defaultMessage(status);
            const fieldErrors = data.fieldErrors || null;

            return { status, code, message, fieldErrors, details: data };
        }

        // Caso backend manda stringa
        if (typeof data === "string" && data.trim()) {
            return { status, code: null, message: data.trim(), fieldErrors: null, details: data };
        }

        // Fallback
        return { status, code: null, message: defaultMessage(status), fieldErrors: null, details: data };
    }

    function defaultMessage(status) {
        switch (status) {
            case 400: return "Richiesta non valida.";
            case 401: return "Non autorizzato (login richiesto).";
            case 403: return "Accesso negato.";
            case 404: return "Risorsa non trovata.";
            case 409: return "Conflitto (dati già presenti o regole violate).";
            default: return "Errore inatteso dal server.";
        }
    }

    // -------------------- Helper JSON methods --------------------
    const get = (path, opts) => request(path, { ...opts, method: "GET" });
    const post = (path, body, opts) => request(path, { ...opts, method: "POST", body });
    const put = (path, body, opts) => request(path, { ...opts, method: "PUT", body });
    function unwrapData(payload) {
        if (payload && typeof payload === "object" && "data" in payload) {
            return payload.data ?? null;
        }
        return payload;
    }


    // -------------------- API methods --------------------
    /**
     * api.me()
     * - chiama /api/me
     * - ritorna null se 401 (non loggato)
     * - altrimenti ritorna il JSON dell'utente corrente
     */
    async function me() {
        const res = await fetch(ME_PATH, {
            method: "GET",
            credentials: "include",
            headers: { "Accept": "application/json" },
            cache: "no-store",
        });

        // se in futuro lo rimettete a 401/403, siamo coperti
        if (res.status === 401 || res.status === 403) return null;

        if (!res.ok) return null;

        const json = await res.json().catch(() => null);
        if (!json) return null;

        // supporta ApiResponse { message, data }
        if (typeof json === "object" && json !== null && "data" in json) {
            return json.data ?? null; // <-- QUI la differenza: data=null => guest
        }

        return json;
    }

    // ---- PROFILE (auth-optional) ----
    const PROFILE_ME_PATH = "/api/profile/me";

    async function profileMe() {
        const res = await fetch(BASE_URL + PROFILE_ME_PATH, {
            method: "GET",
            credentials: "include",
            headers: { "Accept": "application/json" },
            cache: "no-store",
        });

        // guest / session scaduta
        if (res.status === 401 || res.status === 403) return null;

        if (!res.ok) {
            // qui puoi decidere se throw o null; io farei throw per errori veri
            const data = await res.json().catch(() => null);
            throw new ApiError(normalizeError(res.status, data));
        }

        const json = await res.json().catch(() => null);
        if (!json) return null;

        // supporta ApiResponse { message, data }
        if (typeof json === "object" && json !== null && "data" in json) {
            return json.data ?? null;
        }

        return json;
    }


    async function updateMyAvatar(avatarId) {
        // endpoint: PUT /api/profile/me/avatar?avatarId=...
        const qs = new URLSearchParams({ avatarId: String(avatarId) }).toString();
        const payload = await request(`${PROFILE_AVATAR_PATH}?${qs}`, {
            method: "PUT",
            headers: { "Accept": "application/json" },
        });
        return unwrapData(payload);
    }

    async function changeMyPassword(oldPassword, newPassword, newPasswordConfirm) {
        return request("/api/profile/me/password", {
            method: "PUT",
            body: { oldPassword, newPassword, newPasswordConfirm },
            headers: { "Accept": "application/json" }
        });
    }

    async function logout() {
        // non serve body
        return request("/auth/logout", {
            method: "POST",
            headers: { "Accept": "application/json" },
        });
    }

    async function changeMyUsername(newUsername) {
        return request("/api/profile/me/username", {
            method: "PUT",
            body: { newUsername },
            headers: { "Accept": "application/json" },
        });
    }

    return {
        // methods
        get,
        post,
        put,
        me,
        profileMe,
        updateMyAvatar,
        changeMyPassword,
        logout,
        changeMyUsername,

        // error class (utile per auth.js / UI)
        ApiError,
    };
})();

// opzionale: esponi globalmente (se non usi moduli ES)
window.api = api;
