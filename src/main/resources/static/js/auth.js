/* =========================================================
   auth.js (puro JS)
   - toggle password (login/register)
   - switch login <-> register
   - validazione con regex + messaggi inline
========================================================= */

(() => {
    // ---------- Helpers DOM ----------
    const $ = (sel, root = document) => root.querySelector(sel);

    function setHidden(el, hidden) {
        if (!el) return;
        el.hidden = !!hidden;
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
        alertEl.dataset.type = type; // utile se vuoi stilare via CSS [data-type="error"]
    }

    function fieldErrorEl(input) {
        if (!input?.id) return null;
        return document.querySelector(`[data-error-for="${input.id}"]`);
    }

    function setFieldError(input, message = "") {
        const err = fieldErrorEl(input);
        if (!err) return;

        if (!message) {
            err.hidden = true;
            err.textContent = "";
            input.removeAttribute("aria-invalid");
        } else {
            err.hidden = false;
            err.textContent = message;
            input.setAttribute("aria-invalid", "true");
        }
    }

    function clearFormErrors(form) {
        if (!form) return;
        const inputs = form.querySelectorAll("input");
        inputs.forEach((inp) => setFieldError(inp, ""));
        const alertEl = $(".auth-alert", form.closest(".auth-card") || form);
        setAlert(alertEl, { message: "" });
    }

    // ---------- Regex + regole ----------
    // Username: 3-50, lettere/numeri/._- , no spazi
    const USERNAME_RE = /^[a-zA-Z0-9._-]{3,50}$/;

    // Email: usare la validazione nativa + check leggero (non esagerare: RFC è infinito)
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    // Password: min 6; consiglio: almeno 1 lettera e 1 numero (modificabile)
    const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{6,72}$/;

    function validateUsername(input) {
        const v = input.value.trim();
        if (!v) return "Username obbligatorio.";
        if (v.length > 50) return "Max 50 caratteri.";
        if (!USERNAME_RE.test(v)) return "Solo lettere, numeri e . _ - (min 3).";
        return "";
    }

    function validateEmail(input) {
        const v = input.value.trim();
        if (!v) return "Email obbligatoria.";
        if (v.length > 255) return "Max 255 caratteri.";
        if (!EMAIL_RE.test(v)) return "Inserisci un’email valida.";
        return "";
    }

    function validatePassword(input) {
        const v = input.value;
        if (!v) return "Password obbligatoria.";
        if (v.length < 6) return "Min 6 caratteri.";
        if (v.length > 72) return "Max 72 caratteri.";
        if (!PASSWORD_RE.test(v)) return "Deve contenere almeno 1 lettera e 1 numero.";
        return "";
    }

    function validateAvatar(form) {
        const checked = form.querySelector('input[name="avatarId"]:checked');
        // In register l'avatarId è required: se non c'è, errore
        if (!checked) return "Seleziona un avatar.";
        return "";
    }

    function validateForm(form) {
        let ok = true;

        const isRegister = form.id === "register-form";

        const username = form.querySelector('input[name="username"]');
        const password = form.querySelector('input[name="password"]');

        if (username) {
            const msg = validateUsername(username);
            setFieldError(username, msg);
            if (msg) ok = false;
        }

        if (isRegister) {
            const email = form.querySelector('input[name="email"]');
            if (email) {
                const msg = validateEmail(email);
                setFieldError(email, msg);
                if (msg) ok = false;
            }
        }

        if (password) {
            const msg = validatePassword(password);
            setFieldError(password, msg);
            if (msg) ok = false;
        }

        if (isRegister) {
            const msg = validateAvatar(form);
            // l'errore avatar lo attacchiamo a un "placeholder" data-error-for="avatarId"
            const fake = { id: "avatarId", setAttribute() { }, removeAttribute() { } };
            const errEl = document.querySelector(`[data-error-for="avatarId"]`);
            if (errEl) {
                errEl.hidden = !msg;
                errEl.textContent = msg || "";
            }
            if (msg) ok = false;
        }

        return ok;
    }

    // ---------- Toggle password ----------
    function setupPasswordToggle(btnSelector, inputSelector) {
        const btn = $(btnSelector);
        const input = $(inputSelector);
        if (!btn || !input) return;

        btn.addEventListener("click", () => {
            const isPwd = input.type === "password";
            input.type = isPwd ? "text" : "password";
            btn.setAttribute("aria-pressed", String(isPwd));
            // opzionale: cambia icona testo
            btn.textContent = isPwd ? "🙈" : "👁️";
        });
    }

    // ---------- Switch login/register ----------
    function setupAuthSwitch() {
        const loginSection = $("#login-section");
        const registerSection = $("#register-section");

        const showRegisterLink = $("#show-register");
        const showLoginLink = $("#show-login");

        function showLogin() {
            setHidden(registerSection, true);
            setHidden(loginSection, false);
            // reset errori registro
            const regForm = $("#register-form");
            clearFormErrors(regForm);
            // focus primo campo login
            $("#login-username")?.focus();
            history.replaceState(null, "", "#login");
        }

        function showRegister() {
            setHidden(loginSection, true);
            setHidden(registerSection, false);
            // reset errori login
            const loginForm = $("#login-form");
            clearFormErrors(loginForm);
            // focus primo campo register
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

        // deep link opzionale: /login-register.html#register
        if (location.hash === "#register") showRegister();
        else showLogin();
    }

    // ---------- Validazione realtime (blur/input) ----------
    function setupRealtimeValidation(form) {
        if (!form) return;

        form.addEventListener("input", (e) => {
            const t = e.target;
            if (!(t instanceof HTMLInputElement)) return;

            // valida "soft" solo il campo modificato
            if (t.name === "username") setFieldError(t, validateUsername(t));
            if (t.name === "email") setFieldError(t, validateEmail(t));
            if (t.name === "password") setFieldError(t, validatePassword(t));

            // avatar: se selezionato, togli messaggio
            if (t.name === "avatarId") {
                const errEl = document.querySelector(`[data-error-for="avatarId"]`);
                if (errEl) {
                    errEl.hidden = true;
                    errEl.textContent = "";
                }
            }
        });

        form.addEventListener("blur", (e) => {
            const t = e.target;
            if (!(t instanceof HTMLInputElement)) return;

            // blur = valida "hard" campo
            if (t.name === "username") setFieldError(t, validateUsername(t));
            if (t.name === "email") setFieldError(t, validateEmail(t));
            if (t.name === "password") setFieldError(t, validatePassword(t));
        }, true);
    }

    // ---------- Submit handlers ----------
    function setupSubmit(formId) {
        const form = $("#" + formId);
        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const card = form.closest(".auth-card") || form;
            const alertEl = $(".auth-alert", card);

            clearFormErrors(form);

            const ok = validateForm(form);
            if (!ok) {
                setAlert(alertEl, { type: "error", message: "Controlla i campi evidenziati." });
                return;
            }

            // Dati pronti
            const data = Object.fromEntries(new FormData(form).entries());

            // Normalizza: trim su username/email
            if (data.username) data.username = String(data.username).trim();
            if (data.email) data.email = String(data.email).trim().toLowerCase();

            // TODO: qui colleghi il backend
            // Esempio:
            // - login: POST /api/auth/login  (username, password)
            // - register: POST /api/auth/register (username, email, password, avatarId)
            //
            // setAlert(alertEl, { type: "info", message: "Invio dati..." });

            console.log(`[${formId}] payload`, data);

            // Demo UX:
            setAlert(alertEl, { type: "success", message: "Validazione OK ✅ (TODO: chiamata backend)" });
        });
    }

    // ---------- Init ----------
    document.addEventListener("DOMContentLoaded", () => {
        setupPasswordToggle("#toggle-password", "#login-password");
        setupPasswordToggle("#toggle-reg-password", "#reg-password");

        setupAuthSwitch();

        setupRealtimeValidation($("#login-form"));
        setupRealtimeValidation($("#register-form"));

        setupSubmit("login-form");
        setupSubmit("register-form");
    });
})();
