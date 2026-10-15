# Vœux de 1ère — EFI

Formulaire en ligne pour recueillir les vœux d'orientation des élèves de seconde (spécialités, option artistique, section européenne), avec un espace de suivi pour la direction.

- **Site** : pages statiques hébergées gratuitement sur GitHub Pages.
- **Réponses** : enregistrées dans une feuille Google Sheets par un petit script Google Apps Script. Aucun serveur à gérer.

```
index.html            formulaire des familles
direction.html        suivi et statistiques (protégé par mot de passe)
assets/config.js      réglages : classes, effectifs, spécialités, options, adresse Apps Script
assets/style.css      mise en page
assets/form.js        logique du formulaire
assets/direction.js   logique du suivi
apps-script/Code.gs   script à coller dans Google Apps Script
```

## Étape 1 — Créer la feuille Google Sheets

1. Avec le compte Google de l'établissement, créez une feuille vide nommée par exemple « Vœux 1ère 2027 ».
2. Menu **Extensions > Apps Script**.

## Étape 2 — Installer le script

1. Dans l'éditeur Apps Script, remplacez le contenu de `Code.gs` par celui du fichier `apps-script/Code.gs`, puis enregistrez.
2. Choisissez la fonction `setup` dans la liste en haut et cliquez sur **Exécuter**. Acceptez les autorisations demandées.
   Le journal d'exécution affiche le **mot de passe direction** créé automatiquement. Pour le changer : **Paramètres du projet > Propriétés du script > ADMIN_KEY**.
3. Cliquez sur **Déployer > Nouveau déploiement**, type **Application Web** :
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
4. Copiez l'**URL de l'application Web** (elle se termine par `/exec`).

> Si vous modifiez plus tard `Code.gs`, faites **Déployer > Gérer les déploiements > Modifier > Nouvelle version** pour garder la même URL.

## Étape 3 — Régler l'application

Ouvrez `assets/config.js` et renseignez :

- `APPS_SCRIPT_URL` : l'URL copiée à l'étape 2 ;
- `CLASSES` : vos classes de seconde et leurs effectifs (remplacez les exemples 2nde A, B, C) ;
- au besoin `OPTIONS_MAX` (1 option artistique par élève par défaut) et `RENTREE`.

## Étape 4 — Publier sur GitHub Pages

1. Créez un dépôt sur GitHub (par exemple `voeux-1ere`) et déposez-y tout le contenu de ce dossier (bouton **Add file > Upload files**).
2. Dans le dépôt : **Settings > Pages**, source **Deploy from a branch**, branche `main`, dossier `/ (root)`, puis **Save**.
3. Après une minute, le site est en ligne à l'adresse `https://<votre-compte>.github.io/voeux-1ere/`.
   - Lien à envoyer aux familles : `…/voeux-1ere/`
   - Votre espace de suivi : `…/voeux-1ere/direction.html`

## Fonctionnement

- Chaque envoi ajoute une ligne dans l'onglet « Réponses » de la feuille, avec une référence remise à la famille.
- Une famille qui corrige ses vœux renvoie une fiche ; l'espace direction ne compte que la plus récente pour un même élève (même classe, nom et prénom) et signale les envois multiples. L'historique complet reste dans la feuille.
- Pour clore la consultation : `CONSULTATION_OUVERTE: false` dans `config.js`.
- L'export CSV (séparateur point-virgule) s'ouvre directement dans Excel.

## Données personnelles

Les réponses contiennent des données d'élèves mineurs et de leurs responsables légaux. Elles ne sont stockées que dans la feuille Google Sheets de l'établissement ; le site GitHub ne contient aucune réponse. Limitez le partage de la feuille aux personnels concernés, choisissez un mot de passe direction solide, et supprimez la feuille à l'issue de la procédure d'orientation. Le dépôt GitHub peut être public : il ne contient ni données ni mot de passe.
