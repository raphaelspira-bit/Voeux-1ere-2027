/**
 * Vœux de 1ère — EFI
 * Script Google Apps Script qui reçoit les fiches et les range dans la feuille Google Sheets.
 *
 * Installation : voir README.md, étape 2.
 * Le mot de passe de la direction se règle dans
 *   Paramètres du projet > Propriétés du script > ADMIN_KEY
 */

const SHEET_NAME = "Réponses";
const HEADERS = [
  "Reçue le", "Référence", "Classe", "Nom", "Prénom",
  "Spécialité 1", "Spécialité 2", "Spécialité 3", "Combinaison",
  "Repli", "Options artistiques", "Section européenne",
  "Responsable", "Lien", "Téléphone", "E-mail", "Commentaire"
];

/** À lancer une fois depuis l'éditeur : crée l'onglet et les en-têtes. */
function setup() {
  const sheet = getSheet_();
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty("ADMIN_KEY")) {
    const key = Utilities.getUuid().slice(0, 8);
    props.setProperty("ADMIN_KEY", key);
    Logger.log("Mot de passe direction créé : " + key + " (modifiable dans Propriétés du script)");
  } else {
    Logger.log("Mot de passe direction déjà défini.");
  }
  Logger.log("Onglet prêt : " + sheet.getName());
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  // Coupe la longueur et neutralise les formules (=, +, -, @) dans la feuille.
  let s = String(v == null ? "" : v).trim().slice(0, max || 200);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

/** Réception d'une fiche. */
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents || "{}");
    if (d.site) return json_({ ok: true, ref: "—" }); // champ piège anti-robots rempli : on ignore

    const specs = Array.isArray(d.specialites) ? d.specialites.map(s => clean_(s, 60)).filter(Boolean) : [];
    if (new Set(specs).size !== 3) return json_({ ok: false, error: "Il faut exactement trois spécialités différentes." });
    if (!d.nom || !d.prenom || !d.classe) return json_({ ok: false, error: "Nom, prénom et classe sont obligatoires." });
    if (!d.respNom || (!d.respTel && !d.respMail)) return json_({ ok: false, error: "Coordonnées du responsable légal incomplètes." });

    const repli = Array.isArray(d.repli) ? d.repli.map(s => clean_(s, 60)).filter(Boolean) : [];
    const options = Array.isArray(d.options) ? d.options.map(s => clean_(s, 60)).filter(Boolean) : [];
    const ref = Utilities.getUuid().slice(0, 6).toUpperCase();

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      getSheet_().appendRow([
        new Date(), ref, clean_(d.classe, 40), clean_(d.nom, 80), clean_(d.prenom, 80),
        specs[0], specs[1], specs[2], specs.slice().sort().join(" · "),
        repli.length === 3 ? repli.join(" · ") : "",
        options.join(", ") || "Aucune", clean_(d.euro, 30),
        clean_(d.respNom, 120), clean_(d.respLien, 40), clean_(d.respTel, 40), clean_(d.respMail, 120),
        clean_(d.commentaire, 800)
      ]);
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true, ref: ref });
  } catch (err) {
    return json_({ ok: false, error: "Erreur serveur : " + err.message });
  }
}

/** Lecture des fiches par la direction (mot de passe requis). */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === "ping") return json_({ ok: true });
  if (p.action !== "list") return json_({ ok: false, error: "Action inconnue." });

  const key = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  if (!key || p.key !== key) return json_({ ok: false, error: "Mot de passe incorrect." });

  const values = getSheet_().getDataRange().getValues();
  const rows = values.slice(1).map(r => ({
    date: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
    ref: r[1], classe: r[2], nom: r[3], prenom: r[4],
    specialites: [r[5], r[6], r[7]].filter(Boolean),
    repli: r[9] ? String(r[9]).split(" · ") : [],
    options: r[10] && r[10] !== "Aucune" ? String(r[10]).split(", ") : [],
    euro: r[11], respNom: r[12], respLien: r[13], respTel: String(r[14] || ""), respMail: r[15], commentaire: r[16]
  }));
  return json_({ ok: true, rows: rows });
}
