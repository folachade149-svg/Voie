# Voie — prototype refondu

Prototype web d'orientation professionnelle : « Trouve ta voie, construis ta carrière ».
Application **mono-page sans build** : HTML, CSS et JavaScript vanilla, à ouvrir directement
dans un navigateur (aucun serveur, aucune dépendance, aucun `npm install`).

## Démarrer

Python n'est pas installé sur cette machine : utilise le serveur PowerShell fourni.

```powershell
cd voie-app
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1          # port 8000
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1 -Port 8080
```

Puis ouvre http://localhost:8000/ dans le navigateur. `Ctrl+C` pour arrêter.
Un simple double-clic sur `index.html` fonctionne aussi, mais le serveur garantit
le bon type MIME et évite les restrictions de `file://`.

Compte de démonstration : `demo@voie.bj` / `demo1234`

## Structure

```
voie-app/
├── index.html          Structure et écrans (SPA par <section class="screen">)
├── README.md           Documentation
├── serve.ps1           Serveur statique local (remplace python -m http.server)
├── _validate.ps1       Validation statique (identifiants, fonctions, échappement)
├── css/
│   ├── style.css       Thème, grilles, header, responsive global
│   └── academie.css    Mise en page plateforme de cours (sommaire, contenu, examen)
└── js/
    ├── storage.js      Persistance localStorage, échappement XSS, empreinte des mots de passe
    ├── data.js         Données : secteurs, métiers, cours, quiz, offres d'emploi
    ├── app.js          Logique applicative, navigation, auth, offres, profil
    ├── academie.js     Moteur de l'Académie (chargé après app.js)
    └── _test.js        Test de fumée (à charger en dernier, hors production)
```

**L'ordre de chargement des scripts est important** : `storage.js` définit `esc()`, `escAttr()`,
`hashPwd()` et `VoieStore`, utilisés ensuite par `data.js` et `app.js`, puis `academie.js`
qui redéfinit le rendu de l'Académie.

## Ce qui a été amélioré par rapport à `voie-prototype_14.html`

### 1. Persistance (le manque le plus important)

Avant, tout était perdu à chaque rechargement de page. Maintenant l'état est
sauvegardé dans `localStorage` :

- session et compte, rôle choisi ;
- résultats du quiz, secteur choisi, progression de l'Académie ;
- candidatures, favoris, offres publiées, entreprise vérifiée ;
- écran courant : on revient où on s'était arrêté.

Bouton **« Réinitialiser mes données »** dans Profil → Compte pour repartir de zéro.

### 2. Sécurité

- **Échappement XSS systématique.** Toutes les valeurs issues de saisies ou de données
  variables passent par `esc()` (contenu HTML) ou `escAttr()` (attributs). C'était le
  risque principal : titres d'offres, noms d'entreprises et profils étaient injectés
  en clair dans `innerHTML`.
- **Photos de profil validées** par `safeImgSrc()` : seules les images `data:image/...`
  ou `http(s)://` sont acceptées dans un `src`.
- **Mots de passe plus stockés en clair.** `hashPwd()` produit une empreinte, `checkPwd()`
  la vérifie à temps constant. Le compte de démonstration est créé à la volée.
  > Prototype uniquement : en production, il faut bcrypt/argon2 **côté serveur**, sur HTTPS.

### 3. Accessibilité

- **Modales** : fermeture par la touche Échap, `role="dialog"`, `aria-modal`, piège de
  focus et retour du focus à la fermeture.
- **Notifications** (`toast`) annoncées aux lecteurs d'écran (`role="status"`, `aria-live`).
- **Libellés** masqués visuellement (`.sr-only`) sur les nouveaux champs de recherche.
- **Boutons explicites** : `aria-pressed` et `aria-label` sur les favoris, `type="button"`.

### 4. Fonctionnalités

- **Offres d'emploi** : recherche plein texte (insensible aux accents et à la casse),
  filtres secteur et contrat, tri (pertinence, intitulé, ville), état vide avec
  réinitialisation des filtres, focus préservé pendant la saisie.
- **Favoris** : mettre une offre de côté et n'afficher que celles-là.
- **Candidatures réelles** : chaque candidature est liée à une offre (`state.applications`),
  plus un simple booléen. L'historique s'affiche dans Profil → Mon parcours, et empêche
  les doublons.
- **Identifiants stables** (`id`) sur chaque offre, nécessaires aux candidatures et favoris.

### 5. Lisibilité

Le fichier unique de 3 386 lignes est découpé en HTML, CSS, JS et données.

### 6. Académie : plateforme de cours

- **Sommaire latéral** listant les 3 modules et leurs éléments (leçons, exercices,
  examen), avec états verrouillé / en cours / validé — inspiré de W3Schools et
  Cisco NetAcad.
- **Navigation linéaire** leçon par leçon avec boutons Précédent / Suivant,
  fil d'Ariane et barre de progression du module.
- **Exercices** à correction immédiate (bonne réponse en vert, explication affichée),
  façon freeCodeCamp.
- **Examen noté** : mentions (très bien, bien, admis), correction détaillée question
  par question, déblocage du module suivant à 70 %, tentatives illimitées.
- **Modules 2 et 3 sans contenu** affichés honnêtement comme « programme prévu ».
- Le quiz passe de 35 à 50 questions pour équilibrer les secteurs Mode, Aviation et
  Éducation (minimum 6 items par secteur, contre 3 auparavant).

### 7. Responsivité

27 points de rupture répartis de 1000 px à 360 px :

| Palier | Ajustements principaux |
|---|---|
| ≤ 1000 px | Header et onglets compactés |
| ≤ 900 px | Académie : sommaire au-dessus du contenu |
| ≤ 760 px | Padding général, profil, statistiques |
| ≤ 640 px | Header en 2 lignes (logo + compte, puis onglets en bande défilante sans scroll visible), paddings et typographies mobiles, Académie compacte avec cibles tactiles agrandies |
| ≤ 560 px | Footer en une colonne |
| ≤ 480 px | Boutons du hero empilés sur toute la largeur |
| ≤ 400 px | Sommaire Académie épuré, déconnexion du header remplacée par celle du Profil → Compte |
| ≤ 360 px | Réduction finale (padding 12 px, titres) |

Détails notables : le header utilise `display:contents` pour sortir ses enfants du
conteneur, les grilles d'origine gardent leurs breakpoints, les libellés
Précédent / Suivant de l'Académie sont tronqués en ellipsis, et
`prefers-reduced-motion` reste respecté.

## Validation

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File _validate.ps1
```

Contrôle l'ordre des scripts, les identifiants, les fonctions appelées, les doublons,
l'équilibre des balises, le mot de passe de démonstration et l'échappement des valeurs
dynamiques.

`js/_test.js` contient un test de fumée à charger en dernier (échappement, empreinte
des mots de passe, quiz, moteur Académie — navigation, exercices, examen en réussite
et en échec, progression, persistance —, offres, modales, responsive).

## Limites connues

- **Toujours une démonstration côté client.** Aucun serveur : les données restent dans le
  navigateur, les gardes d'accès sont contournables, la vérification d'entreprise est simulée.
- **Quota `localStorage`** (≈5 Mo) : les photos en base64 peuvent le saturer. En cas de
  dépassement, la sauvegarde est ignorée silencieusement.
- **`hashPwd()` n'est pas un hachage de production.** Un secret embarqué dans le navigateur
  est toujours lisible.
- **Cache OneDrive** : le dossier est synchronisé, ce qui peut gêner le rechargement à chaud.

## Pour passer en production

1. Un backend (Supabase, Firebase, ou Node/Django + PostgreSQL) pour l'authentification,
   les offres, les candidatures et la progression.
2. Vraie authentification : bcrypt/argon2 côté serveur, sessions ou JWT, HTTPS, captcha.
3. Candidatures côté serveur, avec statuts, et CV en upload.
4. Modération réelle des entreprises, avec espace administrateur.
5. Consentement explicite avant tout partage de profil, conformément à la législation
   sur les données personnelles.
6. Tests end-to-end (Playwright) et `git` pour l'historique.
