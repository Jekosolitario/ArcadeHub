/* =========================================================
   auth.js (puro JS + api.js)
   - toggle password
   - switch login/register
   - validazione client-side (soft)
   - submit via api.post() con session cookie
   - mapping errori: ApiError.fieldErrors -> form
========================================================= */

(() => {
    const $ = (sel, root = document) => root.querySelector(sel);

    // ---------------- Helpers UI ----------------
    function setHidden(el, hidden) {
        if (el) el.hidden = !!hidden;
    }

    function setAlert(alertEl, { type = "info", message = "" } = {}) {
        if (!alertEl) return;
        if (!message) {
            alertEl.hidden = true;
            alertEl.textContent = "";
            alertEl.dataset.type = "";
            return;
        }
        alertEl.hidden = false;
        alertEl.textContent = message;
        alertEl.dataset.type = type; // utile per CSS: [data-type="error"]
    }

    function fieldErrorElById(inputId) {
        return document.querySelector(`[data-error-for="${inputId}"]`);
    }

    function setFieldErrorById(inputId, message) {
        // 1) testo sotto campo
        const p = document.querySelector(`[data-error-for="${inputId}"]`);
        if (p) {
            p.textContent = message;
            p.hidden = false;
        }

        // 2) evidenzia input (se esiste)
        const input = document.getElementById(inputId);
        if (input) {
            input.classList.add("is-invalid");
            input.setAttribute("aria-invalid", "true");
            return;
        }

        // 3) caso speciale: avatarId (radio) → evidenzia il fieldset
        if (inputId === "avatarId") {
            const fs = document.querySelector('#register-form fieldset[aria-describedby="avatar-help"]');
            if (fs) {
                fs.classList.add("is-invalid");
                fs.setAttribute("aria-invalid", "true");
            }
        }
    }


    function clearFormErrors(form) {
        form.querySelectorAll(".form-error").forEach(p => {
            p.textContent = "";
            p.hidden = true;
        });

        form.querySelectorAll(".form-input").forEach(inp => {
            inp.classList.remove("is-invalid");
            inp.removeAttribute("aria-invalid");
        });

        form.querySelectorAll("fieldset.is-invalid").forEach(fs => {
            fs.classList.remove("is-invalid");
            fs.removeAttribute("aria-invalid");
        });
    }


    // ---------------- Toggle password ----------------
    function setupPasswordToggle(btnSelector, inputSelector) {
        const btn = $(btnSelector);
        const input = $(inputSelector);
        if (!btn || !input) return;

        btn.addEventListener("click", () => {
            const isPwd = input.type === "password";
            input.type = isPwd ? "text" : "password";
            btn.setAttribute("aria-pressed", String(isPwd));
            btn.textContent = isPwd ? "🙈" : "👁️";
        });
    }

    // ---------------- Switch login/register ----------------
    function setupAuthSwitch() {
        const loginSection = $("#login-section");
        const registerSection = $("#register-section");
        const showRegisterLink = $("#show-register");
        const showLoginLink = $("#show-login");

        function showLogin() {
            setHidden(registerSection, true);
            setHidden(loginSection, false);
            clearFormErrors($("#register-form"));
            $("#login-username")?.focus();
            history.replaceState(null, "", "#login");
        }

        function showRegister() {
            setHidden(loginSection, true);
            setHidden(registerSection, false);
            clearFormErrors($("#login-form"));
            $("#reg-username")?.focus();
            history.replaceState(null, "", "#register");
        }

        showRegisterLink?.addEventListener("click", (e) => {
            e.preventDefault();
            showRegister();
        });

        showLoginLink?.addEventListener("click", (e) => {
            e.preventDefault();
            showLogin();
        });

        if (location.hash === "#register") showRegister();
        else showLogin();
    }

    // ---------------- Client-side validation (leggera) ----------------
    const USERNAME_RE = /^[a-zA-Z0-9._-]{3,50}$/;
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function validateLogin({ username, password }) {
        const fieldErrors = {};

        if (!username?.trim()) fieldErrors["login-username"] = "Username obbligatorio.";
        else if (!USERNAME_RE.test(username.trim())) fieldErrors["login-username"] = "Username non valido (min 3).";

        if (!password) fieldErrors["login-password"] = "Password obbligatoria.";
        else if (password.length < 6) fieldErrors["login-password"] = "Password troppo corta (min 6).";

        return fieldErrors;
    }

    function validateRegister({ username, email, password, avatarId }) {
        const fieldErrors = {};

        if (!username?.trim()) fieldErrors["reg-username"] = "Username obbligatorio.";
        else if (!USERNAME_RE.test(username.trim())) fieldErrors["reg-username"] = "Username non valido (min 3, max 50).";

        if (!email?.trim()) fieldErrors["reg-email"] = "Email obbligatoria.";
        else if (!EMAIL_RE.test(email.trim())) fieldErrors["reg-email"] = "Email non valida.";

        if (!password) fieldErrors["reg-password"] = "Password obbligatoria.";
        else if (password.length < 6) fieldErrors["reg-password"] = "Password troppo corta (min 6).";

        if (!avatarId) {
            // nel tuo HTML l’errore avatar è data-error-for="avatarId"
            fieldErrors["avatarId"] = "Seleziona un avatar.";
        }

        return fieldErrors;
    }

    function applyFieldErrors(fieldErrors) {
        // fieldErrors qui è una mappa: { "login-username": "...", "avatarId": "..." }
        for (const key in fieldErrors) {
            setFieldErrorById(key, fieldErrors[key]);
        }
    }

    // ---------------- Submit: LOGIN via API ----------------
    async function handleLoginSubmit(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const card = form.closest(".auth-card") || form;
        const alertEl = $(".auth-alert", card);

        clearFormErrors(form);

        const username = $("#login-username")?.value ?? "";
        const password = $("#login-password")?.value ?? "";

        // validazione client-side
        const fe = validateLogin({ username, password });
        if (Object.keys(fe).length) {
            applyFieldErrors(fe);
            setAlert(alertEl, { type: "error", message: "Controlla i campi evidenziati." });
            return;
        }

        try {
            setAlert(alertEl, { type: "info", message: "Accesso in corso..." });

            await api.post("/auth/login", { username: username.trim(), password });

            // Se login OK, puoi verificare /auth/me oppure redirect diretto
            setAlert(alertEl, { type: "success", message: "Login OK ✅" });

            // redirect (coerente con UI)
            window.location.href = "/index.html";
        } catch (err) {
            // ApiError dal wrapper
            if (err?.name === "ApiError") {
                // mapping fieldErrors backend -> UI
                // Il backend manda fieldErrors con chiavi tipo "username"?
                // Noi le convertiamo ai tuoi id input.
                const be = err.fieldErrors || null;

                if (be && typeof be === "object") {
                    // mapping backend-field -> input-id
                    const map = {
                        username: "login-username",
                        password: "login-password",
                    };
                    const mapped = {};
                    for (const k in be) mapped[map[k] || k] = be[k];
                    applyFieldErrors(mapped);
                }

                setAlert(alertEl, { type: "error", message: err.message || "Login fallito." });
                return;
            }

            setAlert(alertEl, { type: "error", message: "Errore di rete o server." });
        }
    }

    // ---------------- Submit: REGISTER via API ----------------
    async function handleRegisterSubmit(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const card = form.closest(".auth-card") || form;
        const alertEl = $(".auth-alert", card);

        clearFormErrors(form);

        // helper: nasconde alert (così gli errori restano sotto i campi)
        const hideAlert = () => {
            if (!alertEl) return;
            alertEl.hidden = true;
            alertEl.textContent = "";
            alertEl.classList.remove("is-error", "is-success", "is-info");
        };

        const username = $("#reg-username")?.value ?? "";
        const email = $("#reg-email")?.value ?? "";
        const password = $("#reg-password")?.value ?? "";
        const avatarId = form.querySelector('input[name="avatarId"]:checked')?.value ?? null;

        // ✅ validazione client-side: errori SOLO sotto campo (niente alert in alto)
        const fe = validateRegister({ username, email, password, avatarId });
        if (Object.keys(fe).length) {
            applyFieldErrors(fe);
            hideAlert();
            // opzionale: focus primo campo invalido
            const first = Object.keys(fe)[0];
            document.getElementById(first)?.focus?.();
            return;
        }

        try {
            setAlert(alertEl, { type: "info", message: "Creazione account..." });

            await api.post("/auth/register", {
                username: username.trim().toLowerCase(),
                email: email.trim().toLowerCase(),
                password,
                avatarId: Number(avatarId),
            });

            setAlert(alertEl, { type: "success", message: "Registrazione OK ✅ Ora puoi accedere." });

            // Dopo register: switch a login
            $("#show-login")?.click();
            $("#login-username") && ($("#login-username").value = username.trim().toLowerCase());
            $("#login-password")?.focus?.();

        } catch (err) {
            // ✅ errori backend "di campo" → sotto campo, NON in alto
            if (err?.name === "ApiError") {
                // 1) VALIDATION_ERROR (fieldErrors)
                const be = err.fieldErrors || null;
                if (be && typeof be === "object" && Object.keys(be).length) {
                    const map = {
                        username: "reg-username",
                        email: "reg-email",
                        password: "reg-password",
                        avatarId: "avatarId",
                    };
                    const mapped = {};
                    for (const k in be) mapped[map[k] || k] = be[k];
                    applyFieldErrors(mapped);
                    hideAlert();
                    return;
                }
                // 2) CONFLICT senza fieldErrors (es: USERNAME_TAKEN / EMAIL_TAKEN)
                if (err.code === "USERNAME_TAKEN") {
                    applyFieldErrors({ "reg-username": err.message || "Username già in uso" });
                    // niente alert in alto
                    alertEl.hidden = true;
                    return;
                }
                if (err.code === "EMAIL_TAKEN") {
                    applyFieldErrors({ "reg-email": err.message || "Email già in uso" });
                    alertEl.hidden = true;
                    return;
                }

                // fallback: errore globale
                setAlert(alertEl, { type: "error", message: err.message || "Registrazione fallita." });
                return;

            }

            // rete/server
            setAlert(alertEl, { type: "error", message: "Errore di rete o server." });
        }
    }


    // ---------------- Init ----------------
    document.addEventListener("DOMContentLoaded", () => {
        // toggle password
        setupPasswordToggle("#toggle-password", "#login-password");
        setupPasswordToggle("#toggle-reg-password", "#reg-password");

        // switch
        setupAuthSwitch();

        // submit
        $("#login-form")?.addEventListener("submit", handleLoginSubmit);
        $("#register-form")?.addEventListener("submit", handleRegisterSubmit);
    });
})();
