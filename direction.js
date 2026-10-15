(function () {
  "use strict";
  const C = window.VOEUX_CONFIG || {};
  const SPECS = (C.SPECIALITES || []).map(s => s.court);
  const OPTIONS = C.OPTIONS || [];
  const EURO = ["Oui", "Non", "Ne sait pas encore"];
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const trip = a => [...a].sort((x, y) => SPECS.indexOf(x) - SPECS.indexOf(y)).join(" · ");
  const fmt = iso => iso ? new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

  let key = "", rows = [], filter = "";
  try { key = sessionStorage.getItem("voeux-key") || ""; } catch (e) {}

  function status(msg, kind) {
    const s = $("status");
    if (!msg) { s.hidden = true; return; }
    s.hidden = false; s.className = "notice" + (kind ? " " + kind : ""); s.textContent = msg;
  }

  async function load() {
    const url = C.APPS_SCRIPT_URL || "";
    if (!/^https:\/\/script\.google\.com\//.test(url)) { status("Adresse Apps Script manquante dans assets/config.js.", "bad"); return; }
    status("Chargement des réponses…");
    try {
      const res = await fetch(url + "?action=list&key=" + encodeURIComponent(key));
      const out = await res.json();
      if (!out.ok) throw new Error(out.error);
      try { sessionStorage.setItem("voeux-key", key); } catch (e) {}
      // Une fiche par élève : on garde la plus récente, on compte les envois.
      const byStudent = new Map();
      out.rows.forEach(r => {
        const k = norm(r.classe) + "|" + norm(r.nom) + "|" + norm(r.prenom);
        const prev = byStudent.get(k);
        if (!prev || r.date > prev.date) byStudent.set(k, { ...r, envois: (prev?.envois || 0) + 1 });
        else prev.envois++;
      });
      rows = [...byStudent.values()];
      status("");
      $("login").hidden = true; $("dash").hidden = false;
      render();
    } catch (err) {
      try { sessionStorage.removeItem("voeux-key"); } catch (e) {}
      $("login").hidden = false; $("dash").hidden = true;
      status("Impossible d'afficher les réponses : " + err.message, "bad");
    }
  }

  $("login").addEventListener("submit", e => { e.preventDefault(); key = $("key").value.trim(); load(); });

  function count(list) { const m = new Map(); list.forEach(k => m.set(k, (m.get(k) || 0) + 1)); return [...m.entries()].sort((a, b) => b[1] - a[1]); }
  function bars(entries, total) {
    if (!total) return `<p class="empty">Aucune réponse pour l'instant.</p>`;
    const max = Math.max(...entries.map(e => e[1]), 1);
    return `<div class="bars">${entries.map(([k, v]) => `<div class="bar"><span>${esc(k)}</span><span class="track"><span class="fill" style="width:${(v / max * 100).toFixed(1)}%"></span></span><span class="v">${v}</span></div>`).join("")}</div>`;
  }

  function csv(list) {
    const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Classe", "Nom", "Prénom", "Spécialité 1", "Spécialité 2", "Spécialité 3", "Combinaison", "Repli", "Options artistiques", "Section européenne", "Responsable", "Lien", "Téléphone", "E-mail", "Commentaire", "Envois", "Dernier envoi", "Référence"];
    const lines = list.map(r => {
      const s = [...r.specialites].sort((x, y) => SPECS.indexOf(x) - SPECS.indexOf(y));
      return [r.classe, r.nom, r.prenom, s[0], s[1], s[2], trip(r.specialites), r.repli.join(" · "), r.options.join(", ") || "Aucune", r.euro, r.respNom, r.respLien, r.respTel, r.respMail, r.commentaire, r.envois, r.date ? r.date.slice(0, 16).replace("T", " ") : "", r.ref].map(q).join(";");
    });
    return "﻿" + [head.map(q).join(";"), ...lines].join("\r\n");
  }
  function download(text, name) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function render() {
    const classes = C.CLASSES || [];
    const names = [...new Set([...classes.map(c => c.nom), ...rows.map(r => r.classe)])].filter(Boolean);
    const list = rows.filter(r => !filter || r.classe === filter)
      .sort((a, b) => String(a.classe).localeCompare(String(b.classe), "fr") || String(a.nom).localeCompare(String(b.nom), "fr"));
    const n = list.length;
    const effTotal = classes.reduce((s, c) => s + (+c.effectif || 0), 0);
    const specE = SPECS.map(s => [s, list.filter(r => r.specialites.includes(s)).length]).sort((a, b) => b[1] - a[1]);
    const trips = count(list.map(r => trip(r.specialites)));
    const optE = [...OPTIONS.map(o => [o, list.filter(r => r.options.includes(o)).length]), ["Aucune", list.filter(r => !r.options.length).length]];
    const euroE = EURO.map(o => [o, list.filter(r => r.euro === o).length]);
    const tags = a => a.map(s => `<span class="tag">${esc(s)}</span>`).join("");

    $("dash").innerHTML = `
    <div class="toolbar">
      <label class="f" style="flex-direction:row;align-items:center;gap:8px">Classe
        <select id="fClass"><option value="">Toutes les classes</option>${names.map(c => `<option ${c === filter ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
      <div class="actions"><button class="btn small ghost" id="reload">Actualiser</button><button class="btn small" id="csvBtn">Exporter en CSV</button></div>
    </div>
    <div class="kpis">
      <div class="kpi"><span class="n">${n}${!filter && effTotal ? ` <small>/ ${effTotal}</small>` : ""}</span><span class="l">élèves ayant répondu${filter ? " en " + esc(filter) : ""}</span></div>
      <div class="kpi"><span class="n">${trips.length}</span><span class="l">combinaisons différentes</span></div>
      <div class="kpi"><span class="n">${list.filter(r => r.euro === "Oui").length}</span><span class="l">demandes de section européenne</span></div>
      <div class="kpi"><span class="n">${list.filter(r => r.options.length).length}</span><span class="l">élèves avec option artistique</span></div>
    </div>

    <div class="panel"><h3>Réponses par classe</h3>
      <div class="tablebox"><table><thead><tr><th>Classe</th><th class="num">Reçues</th><th class="num">Effectif</th><th>État</th></tr></thead><tbody>
      ${names.map(c => {
        const got = rows.filter(r => r.classe === c).length, eff = +(classes.find(x => x.nom === c)?.effectif) || 0;
        const st = !eff ? `<span class="pill none">Effectif à renseigner</span>` : got >= eff ? `<span class="pill ok">Complet</span>` : `<span class="pill warn">${eff - got} manquante${eff - got > 1 ? "s" : ""}</span>`;
        return `<tr><td>${esc(c)}</td><td class="num">${got}</td><td class="num">${eff || "–"}</td><td>${st}</td></tr>`;
      }).join("")}
      </tbody></table></div>
    </div>

    <div class="cols">
      <div class="panel"><h3>Demandes par spécialité</h3>${bars(specE, n)}</div>
      <div class="panel"><h3>Combinaisons demandées</h3>${n ? `<div class="tablebox"><table><thead><tr><th>Combinaison</th><th class="num">Élèves</th></tr></thead><tbody>${trips.map(([k, c]) => `<tr><td>${esc(k)}</td><td class="num">${c}</td></tr>`).join("")}</tbody></table></div>` : `<p class="empty">Aucune réponse pour l'instant.</p>`}</div>
      <div class="panel"><h3>Option artistique</h3>${bars(optE, n)}</div>
      <div class="panel"><h3>Section européenne</h3>${bars(euroE, n)}</div>
    </div>

    <div class="panel"><h3>Fiches reçues</h3>
      ${n ? `<div class="tablebox"><table><thead><tr><th>Élève</th><th>Classe</th><th>Spécialités</th><th>Repli</th><th>Option</th><th>Euro</th><th>Responsable</th><th>Dernier envoi</th></tr></thead><tbody>
      ${list.map(r => `<tr>
        <td><b>${esc(r.nom)}</b> ${esc(r.prenom)}${r.commentaire ? `<div class="hint" style="max-width:28ch">« ${esc(r.commentaire)} »</div>` : ""}</td>
        <td>${esc(r.classe)}</td><td>${tags(r.specialites)}</td>
        <td class="hint">${r.repli.length ? esc(r.repli.join(" · ")) : "–"}</td>
        <td>${r.options.length ? esc(r.options.join(", ")) : "–"}</td><td>${esc(r.euro)}</td>
        <td>${esc(r.respNom)}<div class="hint">${esc(r.respLien)} · ${esc(r.respTel || r.respMail)}</div></td>
        <td class="hint" style="white-space:nowrap">${esc(fmt(r.date))}${r.envois > 1 ? `<div><span class="pill warn">${r.envois} envois</span></div>` : ""}</td></tr>`).join("")}
      </tbody></table></div>` : `<p class="empty">Les fiches apparaîtront ici dès que les familles auront répondu.</p>`}
      <p class="hint">Quand une famille envoie plusieurs fiches pour le même élève, seule la plus récente est comptée. L'historique complet reste dans la feuille Google Sheets.</p>
    </div>`;

    $("fClass").onchange = e => { filter = e.target.value; render(); };
    $("reload").onclick = load;
    $("csvBtn").onclick = () => download(csv(list), "voeux-1ere" + (filter ? "-" + filter.replace(/\W+/g, "-") : "") + ".csv");
  }

  if (key) load();
})();
