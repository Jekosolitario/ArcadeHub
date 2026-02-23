// /js/to-top.js
(() => {
    const SHOW_AFTER = 420; // abbasso la soglia per vederlo più facilmente

    function update() {
        const btn = document.querySelector(".to-top");
        if (!btn) return;

        const y = window.scrollY || document.documentElement.scrollTop || 0;

        // IMPORTANTISSIMO: togli hidden sempre
        btn.hidden = false;

        btn.classList.toggle("is-visible", y > SHOW_AFTER);

        const anyModalOpen = document.querySelector('.modal[aria-hidden="false"], dialog[open]');
        if (anyModalOpen) {
            btn.classList.remove('is-visible');
            return;
        }
    }

    // chiamalo spesso all'inizio (perché il footer arriva async)
    const t = setInterval(() => {
        update();
        if (document.querySelector(".to-top")) clearInterval(t);
    }, 200);

    window.addEventListener("scroll", update, { passive: true });
    document.addEventListener("DOMContentLoaded", update);

    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".to-top");
        if (!btn) return;

        e.preventDefault();
        const scroller = document.scrollingElement || document.documentElement;
        scroller.scrollTo({ top: 0, behavior: "smooth" });
    });
})();