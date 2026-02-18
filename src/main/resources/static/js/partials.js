async function loadPartial(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Impossibile caricare ${url}`);
    el.innerHTML = await res.text();
}

/* =========================================================
   AUTH UI (header + home hero)
   - chiama /auth/me con credentials (session cookie)
   - se loggato: sostituisce "Accedi/Registrati" con "Logout"
========================================================= */
async function getMe() {
    try {
        const res = await fetch("/auth/me", {
            method: "GET",
            credentials: "include",
            headers: { "Accept": "application/json" },
            cache: "no-store",
        });

        // guest (se mantenete 401/403)
        if (res.status === 401 || res.status === 403) return null;

        if (!res.ok) return null;

        const data = await res.json().catch(() => null);
        if (!data) return null;

        // ApiResponse { message, data } -> ritorna data (anche se null)
        if (typeof data === "object" && data !== null && "data" in data) {
            return data.data; // <-- niente fallback!
        }

        return data;
    } catch (e) {
        return null;
    }
}


async function logout() {
    try {
        await fetch("/auth/logout", {
            method: "POST",
            credentials: "include",
            headers: { "Accept": "application/json" },
            cache: "no-store",
        });
    } finally {
        // forzo stato guest lato UX
        window.location.replace("/index.html");
    }
}


function setLogoutLink() {
    // link "Accedi/Registrati" nel partial
    const liAccedi = document.querySelector("li.top-li.accedi");
    const aAccedi = liAccedi?.querySelector("a");

    if (!liAccedi || !aAccedi) return;

    // trasformo il link in un bottone/logout
    aAccedi.textContent = "Logout";
    aAccedi.setAttribute("href", "#");
    aAccedi.setAttribute("role", "button");
    aAccedi.setAttribute("aria-label", "Logout");

    aAccedi.addEventListener("click", async (e) => {
        e.preventDefault();

        try {
            await logout();
            setNavVisibility(false);
        } finally {
            // torni guest: reload soft su home (o pagina corrente)
            window.location.replace("/index.html");
        }
    });
}

function hideHeroAuthLinkIfPresent() {
    // Solo in home: rimuove il link "Accedi / Registrati" nella hero
    const hero = document.querySelector(".hero-actions");
    if (!hero) return;

    // prende sia /auth.html che auth.html
    const authLink = hero.querySelector('a[href$="auth.html"], a[href="/auth.html"], a[href="auth.html"]');
    if (!authLink) return;

    // "togliere" davvero = rimuovo dal DOM
    authLink.remove();

    // (opzionale) se vuoi lasciare 2 CTA, puoi sostituirlo con Profilo:
    // const profile = document.createElement("a");
    // profile.className = "btn btn-ghost";
    // profile.href = "/profile.html";
    // profile.textContent = "Profilo";
    // hero.appendChild(profile);
}


(async function initLayout() {
    await loadPartial("#site-header", "./partials/header.html");
    await loadPartial("#site-footer", "./partials/footer.html");

    // evidenzia link attivo
    const path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".top-ul-menu a").forEach((a) => {
        if (a.getAttribute("href") === path) a.setAttribute("aria-current", "page");
    });

    // check login state e aggiorna UI
    setNavVisibility(false);
    const me = window.api ? await api.me() : await getMe();
    setNavVisibility(!!me);

    if (me) {
        setLogoutLink();
        hideHeroAuthLinkIfPresent();
    }


})();

function setNavVisibility(isLogged) {
    const liClassifica = document.querySelector("li.top-li.classifica");
    const liProfilo = document.querySelector("li.top-li.profilo");

    // helper hide/show accessibile
    const hide = (el) => {
        if (!el) return;
        el.hidden = true;
        el.setAttribute("aria-hidden", "true");
        el.querySelectorAll("a,button").forEach(x => x.setAttribute("tabindex", "-1"));
    };

    const show = (el) => {
        if (!el) return;
        el.hidden = false;
        el.removeAttribute("aria-hidden");
        el.querySelectorAll("a,button").forEach(x => x.removeAttribute("tabindex"));
    };

    if (isLogged) {
        show(liClassifica);
        show(liProfilo);
    } else {
        hide(liClassifica);
        hide(liProfilo);
    }
}
