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
├── css/
│   └── style.css       Thème sombre, variables CSS, responsive, accessibilité
└── js/
    ├── storage.js      Persistance localStorage, échappement XSS, empreinte des mots de passe
    ├── data.js         Données : secteurs, métiers, cours, quiz, offres d'emploi
    └── app.js          Logique applicative et rendu
```

**L'ordre de chargement des scripts est important** : `storage.js` définit `esc()`, `escAttr()`,
`hashPwd()` et `VoieStore`, utilisés ensuite par `data.js` et `app.js`.

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

## Validation

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File _validate.ps1
```

Contrôle l'ordre des scripts, les identifiants, les fonctions appelées, les doublons,
l'équilibre des balises, le mot de passe de démonstration et l'échappement des valeurs
dynamiques.

`js/_test.js` contient un test de fumée à charger après `app.js` (échappement, empreinte
des mots de passe, persistance, recherche, favoris, candidatures, modales, garde de
connexion).

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
