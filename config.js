/*
 * Réglages de l'application — c'est le seul fichier à modifier.
 * Après chaque modification, publiez le fichier sur GitHub : le site se met à jour en une minute environ.
 */
window.VOEUX_CONFIG = {
  // Adresse de l'application web Google Apps Script (voir README, étape 2).
  // Elle se termine par /exec
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzL2XEKc_00mjuhxNocKxP49SVsoi8cLYNM4wbxMs9p--yh-9_UVbML5HcjzhTGAJuj/exec",

  ETABLISSEMENT: "École Française Internationale de Casablanca",
  RENTREE: "rentrée 2027",

  // Mettre à false pour fermer la consultation (le formulaire affiche alors un message).
  CONSULTATION_OUVERTE: true,
  MESSAGE_FERMETURE: "La consultation sur les vœux de 1ère est close. Pour toute question, contactez la vie scolaire.",

  // Classes de seconde et effectifs (l'effectif sert à compter les fiches manquantes).
  CLASSES: [
    { nom: "2nde 1", effectif: 25 },
    { nom: "2nde 2", effectif: 25 },
    { nom: "2nde 3", effectif: 27 }
  ],

  SPECIALITES: [
    { court: "Mathématiques",   long: "Mathématiques" },
    { court: "Physique-chimie", long: "Physique-chimie" },
    { court: "SVT",             long: "Sciences de la vie et de la Terre" },
    { court: "SES",             long: "Sciences économiques et sociales" },
    { court: "HGGSP",           long: "Histoire-géographie, géopolitique et sciences politiques" },
    { court: "NSI",             long: "Numérique et sciences informatiques" }
  ],

  // Une seule option artistique par élève. Mettre 2 ou 3 pour autoriser le cumul.
  OPTIONS: ["Musique", "Théâtre", "Arts plastiques"],
  OPTIONS_MAX: 1
};
