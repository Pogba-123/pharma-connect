(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ico = id => `<svg><use href="#${id}"/></svg>`;

  let pos = { ...DEFAULT_POS };
  let usingGps = false;
  let current = null;
  let filter = "all";

  // ---------- utilitaires ----------
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const km = (a, b) => {
    const R = 6371, r = x => x * Math.PI / 180;
    const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const fmtKm = d => d < 1 ? `${Math.max(1, Math.round(d * 10)) * 100} m` : `${d.toFixed(1).replace(".", ",")} km`;
  const fcfa = n => n.toLocaleString("fr-FR").replace(/ /g, " ") + " FCFA";
  const route = p => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
  const hhmm = h => { const m = Math.round((h % 1) * 60); return Math.floor(h) + "h" + (m ? String(m).padStart(2, "0") : ""); };

  function openState(p) {
    if (p.garde) return { open: true, text: "Ouvert 24h/24" };
    const now = new Date(); const h = now.getHours() + now.getMinutes() / 60;
    const open = h >= p.hours[0] && h < p.hours[1];
    return { open, text: open ? `Ouvert · jusqu'à ${hhmm(p.hours[1])}` : `Fermé · ouvre à ${hhmm(p.hours[0])}` };
  }
  const stockOf = (p, id) => p.stock[id] || "in";
  const priceOf = (p, med) => med.price + (p.id % 3) * 100; // petite variation de démonstration
  const STOCK = { in: ["ok", "En stock"], order: ["order", "Sur commande"], out: ["out", "Indisponible"] };
  const RANK = { in: 0, order: 1, out: 2 };

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 3800);
  }

  // ---------- navigation ----------
  function go(name) {
    $$(".tabbar button").forEach(b => b.classList.toggle("on", b.dataset.go === name));
    $$(".tab").forEach(t => t.classList.toggle("active", t.id === "tab-" + name));
    window.scrollTo({ top: 0 });
  }
  document.addEventListener("click", e => {
    const g = e.target.closest("[data-go]");
    if (g) go(g.dataset.go);
    const m = e.target.closest("[data-med]");
    if (m) choose(m.dataset.med);
  });

  // ---------- recherche ----------
  const q = $("#q"), clearQ = $("#clearQ"), sug = $("#suggest"), results = $("#results");

  $("#chips").innerHTML = MEDS.slice(0, 5).map(m => `<button class="chip" data-med="${m.id}">${esc(m.name.split(" ")[0])}</button>`).join("");

  function suggestions() {
    const v = norm(q.value.trim());
    clearQ.hidden = !q.value;
    if (!v || (current && norm(current.name) === v)) { sug.hidden = true; return; }
    const list = MEDS.filter(m => norm(m.name).includes(v) || norm(m.cat).includes(v)).slice(0, 5);
    if (!list.length) { sug.hidden = true; return; }
    sug.innerHTML = list.map(m => `<button data-med="${m.id}">${esc(m.name)}<small>${esc(m.cat)}</small></button>`).join("");
    sug.hidden = false;
  }

  function choose(id) {
    current = MEDS.find(m => m.id === id) || null;
    go("search");
    if (current) q.value = current.name;
    sug.hidden = true; clearQ.hidden = !q.value;
    renderResults();
    if (current) setTimeout(() => results.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function runQuery(text) {
    const v = norm(text.trim());
    go("search"); q.value = text; clearQ.hidden = !text;
    const m = v && MEDS.find(m => norm(m.name).includes(v) || norm(m.cat).includes(v));
    if (m) { choose(m.id); return; }
    current = null; sug.hidden = true;
    results.innerHTML = v ? `<p class="empty">Aucun résultat pour « ${esc(text)} ». Essayez un autre nom ou un principe actif.</p>` : "";
  }

  function renderResults() {
    if (!current) { results.innerHTML = ""; return; }
    const rows = PHARMACIES.map(p => ({ p, s: stockOf(p, current.id), d: km(pos, p) }))
      .sort((a, b) => RANK[a.s] - RANK[b.s] || a.d - b.d);
    const n = rows.filter(r => r.s !== "out").length;
    results.innerHTML =
      `<p class="res-title"><b>${esc(current.name)}</b> · ${n} pharmacie${n > 1 ? "s" : ""} sur ${rows.length}</p>` +
      rows.map((r, i) => {
        const st = STOCK[r.s], os = openState(r.p);
        return `<div class="card ph" style="animation-delay:${i * 45}ms">
          <div class="ico">${ico("i-store")}</div>
          <div class="body">
            <div class="top"><div class="t">${esc(r.p.name)}</div><span class="badge ${st[0]}">${st[1]}</span></div>
            <div class="m">${ico("i-pin")}${esc(r.p.quartier)} · ${fmtKm(r.d)} · ${esc(os.text)}</div>
            <div class="foot">
              ${r.s === "out" ? `<span class="muted body-s">Non disponible ici</span>` : `<span class="price">${fcfa(priceOf(r.p, current))}</span>`}
              ${r.s === "out" ? "" : `<a class="btn primary sm" href="${route(r.p)}" target="_blank" rel="noopener">Localiser</a>`}
            </div>
          </div></div>`;
      }).join("");
  }

  q.addEventListener("input", () => { current = null; suggestions(); results.innerHTML = ""; });
  q.addEventListener("keydown", e => { if (e.key === "Enter") { runQuery(q.value); q.blur(); } });
  clearQ.addEventListener("click", () => { q.value = ""; current = null; sug.hidden = true; clearQ.hidden = true; results.innerHTML = ""; q.focus(); });

  // recherche depuis l'accueil
  const homeQ = $("#homeQ");
  $("#homeGo").addEventListener("click", () => runQuery(homeQ.value));
  homeQ.addEventListener("keydown", e => { if (e.key === "Enter") { runQuery(homeQ.value); homeQ.blur(); } });
  $("#rx").addEventListener("change", e => {
    if (e.target.files.length) toast("Ordonnance reçue. La lecture automatique arrivera dans une prochaine version : cherchez le médicament par son nom en attendant.");
    e.target.value = "";
  });

  // ---------- position ----------
  function setLoc(msg) {
    $("#locState").textContent = msg || (usingGps ? "Position : votre position actuelle" : "Position : Dakar centre (par défaut)");
    $("#locBtn").textContent = usingGps ? "Actualiser" : "Utiliser ma position";
  }
  $("#locBtn").addEventListener("click", () => {
    if (!navigator.geolocation) { setLoc("Position indisponible sur cet appareil"); return; }
    setLoc("Recherche de votre position…");
    navigator.geolocation.getCurrentPosition(
      p => { pos = { lat: p.coords.latitude, lng: p.coords.longitude }; usingGps = true; setLoc(); renderResults(); renderPharmacies(); },
      () => { usingGps = false; setLoc("Position refusée · Dakar centre utilisé"); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });

  // ---------- pharmacies ----------
  function renderPharmacies() {
    let rows = PHARMACIES.map(p => ({ p, d: km(pos, p), os: openState(p) })).sort((a, b) => a.d - b.d);
    if (filter === "open") rows = rows.filter(r => r.os.open);
    if (filter === "garde") rows = rows.filter(r => r.p.garde);
    $("#pharmaList").innerHTML = rows.length ? rows.map((r, i) => `
      <div class="card ph" style="animation-delay:${i * 40}ms">
        <div class="ico">${ico("i-store")}</div>
        <div class="body">
          <div class="top"><div class="t">${esc(r.p.name)}</div></div>
          <div class="m">${ico("i-pin")}${esc(r.p.quartier)} · ${fmtKm(r.d)}</div>
          <div class="tags">
            <span class="badge partner">Partenaire</span>
            ${r.p.garde ? `<span class="badge garde">Garde 24h</span>` : ""}
            <span class="badge ${r.os.open ? "ok" : "closed"}">${r.os.open ? "Ouvert" : "Fermé"}</span>
          </div>
          <div class="foot"><span class="muted body-s">${esc(r.os.text)}</span>
            <a class="btn primary sm" href="${route(r.p)}" target="_blank" rel="noopener">Localiser</a></div>
        </div></div>`).join("") : `<p class="empty">Aucune pharmacie ne correspond à ce filtre pour le moment.</p>`;
  }
  $("#phFilters").addEventListener("click", e => {
    const b = e.target.closest("[data-f]"); if (!b) return;
    filter = b.dataset.f;
    $$("#phFilters .chip").forEach(c => c.classList.toggle("on", c === b));
    renderPharmacies();
  });

  // ---------- installation ----------
  let deferred = null;
  const btn = $("#installBtn");
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; btn.hidden = false; });
  btn.addEventListener("click", async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; btn.hidden = true; });
  window.addEventListener("appinstalled", () => { btn.hidden = true; });
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS && !(matchMedia("(display-mode: standalone)").matches || navigator.standalone)) $("#iosHint").hidden = false;

  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));

  setLoc(); renderPharmacies();
})();
