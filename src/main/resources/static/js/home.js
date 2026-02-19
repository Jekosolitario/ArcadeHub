document.addEventListener("DOMContentLoaded", async () => {
    const link = document.querySelector("#home-leaderboard-link");
    if (!link) return;

    // usiamo il metodo del guard
    const me = await api.profileMe?.(); // deve ritornare null se 401/403
    if (me) return;

    link.addEventListener("click", (e) => {
        e.preventDefault();
        const next = encodeURIComponent("/leaderboard.html");
        window.location.replace(`/auth.html?next=${next}`);
    });
});
