async function loadPartial(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Impossibile caricare ${url}`);
    el.innerHTML = await res.text();
}

(async function initLayout() {
    await loadPartial("#site-header", "./partials/header.html");
    await loadPartial("#site-footer", "./partials/footer.html");

    // evidenzia link attivo
    const path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".top-ul-menu a").forEach(a => {
        if (a.getAttribute("href") === path) a.setAttribute("aria-current", "page");
    });
})();
