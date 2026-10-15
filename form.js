(function () {
  "use strict";
  const C = window.VOEUX_CONFIG || {};
  const SPECS = (C.SPECIALITES || []).map(s => s.court);
  const LONG = Object.fromEntries((C.SPECIALITES || []).map(s => [s.court, s.long]));
  const OPTIONS = C.OPTIONS || [];
  const OPT_MAX = C.OPTIONS_MAX || 1;
  const EURO = ["Oui", "Non", "Ne sait pas encore"];
  const STORE = "voeux1ere-derniere-fiche";
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const order = a => [...a].sort((x, y) => SPECS.indexOf(x) - SPECS.indexOf(y));

  function status(msg, kind) {
    const s = $("status");
    if (!msg) { s.hidden = true; return; }
    s.hidden = false; s.className = "notice" + (kind ? " " + kind : ""); s.textContent = msg;
  }

  /* --- construction --- */
  $("etab").textContent = (C.ETABLISSEMENT || "") + " · Lycée";
  if (C.RENTREE) $("lede").textContent = $("lede").textContent.replace("seconde générale.", "seconde générale, en vue de la " + C.RENTREE + ".");
  $("classe").innerHTML = '<option value="">Choisir…</option>' + (C.CLASSES || []).map(c => `<option>${esc(c.nom)}</option>`).join("");
  $("optHint").textContent = OPT_MAX > 1 ? `Facultatif, jusqu'à ${OPT_MAX} options.` : "Facultatif, une option au plus. Ne rien cocher si l'élève n'en suit pas.";

  function chips(el, name, items, type, titles) {
    el.innerHTML = items.map((v, i) =>
      `<label class="chip${type === "radio" ? " radio" : ""}" title="${esc(titles?.[v] || v)}"><input type="${type}" name="${name}" id="${name}-${i}" value="${esc(v)}"><span class="box"></span><span>${esc(v)}</span></label>`).join("");
  }
  chips($("specs"), "spec", SPECS, "checkbox", LONG);
  chips($("replis"), "repli", SPECS, "checkbox", LONG);
  chips($("options"), "option", OPTIONS, "checkbox");
  chips($("euro"), "euro", EURO, "radio");

  const boxes = name => [...document.querySelectorAll(`input[name=${name}]`)];
  const checked = name => boxes(name).filter(b => b.checked).map(b => b.value);

  function refresh(name, max, counterId) {
    const n = checked(name).length;
    boxes(name).forEach(b => {
      if (max) b.disabled = !b.checked && n >= max;
      b.closest(".chip").classList.toggle("on", b.checked);
      b.closest(".chip").classList.toggle("off", b.disabled);
    });
    if (counterId) { const c = $(counterId); c.textContent = n + " / 3"; c.classList.toggle("full", n === 3); }
  }
  function refreshAll() {
    refresh("spec", 3, "specCount"); refresh("repli", 3, "repliCount");
    refresh("option", OPT_MAX); refresh("euro", 0);
  }
  document.addEventListener("change", e => { if (e.target.name) refreshAll(); });

  /* --- lecture / validation --- */
  function readForm() {
    return {
      nom: $("nom").value.trim(), prenom: $("prenom").value.trim(), classe: $("classe").value,
      specialites: order(checked("spec")), repli: order(checked("repli")), options: checked("option"), euro: checked("euro")[0] || "",
      respNom: $("respNom").value.trim(), respLien: $("respLien").value, respTel: $("respTel").value.trim(), respMail: $("respMail").value.trim(),
      commentaire: $("commentaire").value.trim(), site: $("site").value
    };
  }
  function validate(d) {
    if (!d.nom || !d.prenom) return "Indiquez le nom et le prénom de l'élève.";
    if (!d.classe) return "Choisissez la classe de seconde de l'élève.";
    if (d.specialites.length !== 3) return `Choisissez exactement trois spécialités (${d.specialites.length} cochée${d.specialites.length > 1 ? "s" : ""}).`;
    if (d.repli.length && d.repli.length !== 3) return "Le choix de repli doit compter trois spécialités, ou aucune.";
    if (d.repli.length === 3 && d.repli.join() === d.specialites.join()) return "Le choix de repli est identique au choix principal.";
    if (!d.euro) return "Répondez à la question sur la section européenne.";
    if (!d.respNom || !d.respLien) return "Indiquez le nom du responsable légal et son lien avec l'élève.";
    if (!d.respTel && !d.respMail) return "Indiquez au moins un téléphone ou une adresse e-mail.";
    if (d.respMail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.respMail)) return "L'adresse e-mail ne semble pas valide.";
    if (!$("attest").checked) return "Cochez l'attestation du responsable légal.";
    return "";
  }
  function fill(d) {
    $("nom").value = d.nom || ""; $("prenom").value = d.prenom || ""; $("classe").value = d.classe || "";
    boxes("spec").forEach(b => b.checked = (d.specialites || []).includes(b.value));
    boxes("repli").forEach(b => b.checked = (d.repli || []).includes(b.value));
    boxes("option").forEach(b => b.checked = (d.options || []).includes(b.value));
    boxes("euro").forEach(b => b.checked = b.value === d.euro);
    if ((d.repli || []).length) $("replisBox").open = true;
    $("respNom").value = d.respNom || ""; $("respLien").value = d.respLien || "";
    $("respTel").value = d.respTel || ""; $("respMail").value = d.respMail || "";
    $("commentaire").value = d.commentaire || ""; $("attest").checked = false;
    refreshAll();
  }

  /* --- récapitulatif --- */
  let last = null;
  try { last = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { last = null; }

  function showRecap() {
    const d = last;
    $("form").hidden = true; $("recap").hidden = false;
    const tags = a => a.map(s => `<span class="tag">${esc(s)}</span>`).join("");
    $("recap").innerHTML = `
      <div class="toolbar"><h2>Vœux envoyés</h2><span class="pill ok">Référence ${esc(d.ref)}</span></div>
      <dl>
        <dt>Élève</dt><dd>${esc(d.prenom)} ${esc(d.nom)} · ${esc(d.classe)}</dd>
        <dt>Spécialités</dt><dd>${tags(d.specialites)}</dd>
        ${d.repli.length ? `<dt>Choix de repli</dt><dd>${tags(d.repli)}</dd>` : ""}
        <dt>Option artistique</dt><dd>${d.options.length ? tags(d.options) : "Aucune"}</dd>
        <dt>Section européenne</dt><dd>${esc(d.euro)}</dd>
        <dt>Responsable légal</dt><dd>${esc(d.respNom)} (${esc(d.respLien)})</dd>
        <dt>Envoyée le</dt><dd>${esc(new Date(d.date).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }))}</dd>
      </dl>
      <p class="hint">Pour corriger, renvoyez une fiche : seule la plus récente est prise en compte pour un même élève. Gardez la référence en cas de question.</p>
      <div class="actions"><button class="btn ghost" type="button" id="editBtn">Modifier ces vœux</button><button class="btn ghost" type="button" id="newBtn">Remplir pour un autre enfant</button></div>`;
    $("editBtn").onclick = () => { fill(last); openForm(true); };
    $("newBtn").onclick = () => { fill({}); openForm(true); };
  }
  function openForm(cancellable) {
    $("recap").hidden = true; $("form").hidden = false; $("cancelEdit").hidden = !cancellable;
    status(""); window.scrollTo({ top: 0 });
  }
  $("cancelEdit").onclick = () => { $("formErr").textContent = ""; showRecap(); };

  /* --- envoi --- */
  $("form").addEventListener("submit", async e => {
    e.preventDefault();
    const d = readForm(), msg = validate(d);
    $("formErr").textContent = msg;
    if (msg) return;
    const url = C.APPS_SCRIPT_URL || "";
    if (!/^https:\/\/script\.google\.com\//.test(url)) { $("formErr").textContent = "Le formulaire n'est pas encore relié à la feuille de réponses (adresse Apps Script manquante dans config.js)."; return; }
    const btn = $("submitBtn"); btn.disabled = true; btn.textContent = "Envoi…";
    try {
      // text/plain évite la requête préalable CORS, que Apps Script ne gère pas.
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(d) });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || "Refus du serveur");
      delete d.site;
      last = { ...d, ref: out.ref, date: new Date().toISOString() };
      try { localStorage.setItem(STORE, JSON.stringify(last)); } catch (err) { /* navigateur privé */ }
      $("cancelEdit").hidden = true;
      status("Vos vœux ont bien été reçus par l'établissement. Merci.", "ok");
      showRecap(); window.scrollTo({ top: 0 });
    } catch (err) {
      $("formErr").textContent = "L'envoi n'a pas abouti (" + err.message + "). Vérifiez votre connexion et réessayez.";
    } finally {
      btn.disabled = false; btn.textContent = "Envoyer les vœux";
    }
  });

  /* --- démarrage --- */
  refreshAll();
  if (C.CONSULTATION_OUVERTE === false) {
    $("form").hidden = true;
    status(C.MESSAGE_FERMETURE || "La consultation est close.", "warn");
  } else if (last && last.ref) {
    showRecap();
  }
})();
