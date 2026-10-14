/* ============================================================================================
   GUIDE DE DÉCOUPAGE EN PLUSIEURS FICHIERS (pour une future version multi-fichiers / build tool)
   ============================================================================================
   Ce prototype est un fichier HTML unique pour rester ouvrable sans serveur ni build. Le code
   est déjà organisé en blocs clairement délimités (voir les commentaires "---- Nom ----")
   pour pouvoir être scindé plus tard, par exemple avec Vite/Webpack ou de simples <script src="">.
   Voici la correspondance recommandée fichier ↔ section actuelle :

   data/icons.js         → const ICONS { ... }
   data/sectors.js        → const SECTORS { ... }              (secteurs, métiers, figures)
   data/quiz.js            → const QUIZ [ ... ]                 (questions du test d'orientation)
   data/cours.js            → const COURS { ... }                (leçons/exercices/examen Module 1)
   data/modules.js           → MODULE_TITRES, MODULE_DUREE, MODULE_TOPICS, MODULE2_CONTENT, getModule()
   data/jobs.js               → let jobsData [ ... ]
   auth.js                     → demoUsers, currentUser, setAuthMode, setAuthRoleChoice,
                                  écouteurs #auth-form / #auth-photo, logout(), pendingRole/pendingPhoto
   navigation.js                → state, NAV_APPRENANT, NAV_ENTREPRISE, chooseRole, renderNav,
                                   showScreen, goHome, goToParcours (routeur applicatif)
   pages/home.js                  → renderStatsRow, renderHomeApprenant, renderHomeEntreprise
   pages/quiz.js                   → renderQuizProgress, renderQuizCard, answerScale, answerChoice,
                                      computeMaxPerSector, computeResults
   pages/results.js                  → renderResults, chooseSector
   pages/explorer.js                  → renderExplorer, setExplorerFilter, openFiche, closeFiche
   pages/academie.js                   → academieState, setAcademieDomaine/Module/Tab, renderAcademie,
                                          answerExercice, selectExamAnswer, submitExam, renderExamBanner,
                                          isModuleUnlocked, modulesPassed
   pages/jobs.js                        → renderJobs, openJobDetail, closeJobDetail,
                                           askApplyConfirmation, closeConfirm, applyJob
   pages/business.js                     → entrepriseAccount, renderBusiness
   pages/candidats.js                     → candidatsData, renderCandidats, openCandidateDetail,
                                             closeCandidateDetail, setCandidatsFilter
   pages/profil.js                         → profilTab, computeCompletion, renderProfil,
                                              updatePwStrength, deleteAccount, saveProfile, renderPath
   main.js                                  → bloc "Init" en bas de fichier (appels au chargement)

   Pour découper réellement : sortir chaque bloc dans son fichier, exposer les fonctions/variables
   partagées sur un objet commun (ex: window.Voie = {}) ou passer à des modules ES (import/export),
   et remplacer les <script> uniques du <head>/<body> par un <script type="module" src="main.js">.
   ============================================================================================ */
/* ---------------- Icons (stroke SVG, currentColor) ---------------- */
const ICONS = {
  sante: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-4.4-9.5-9C.8 8.2 2.7 4.5 6.3 4.2c2-.2 3.6 1 5.7 3 2.1-2 3.7-3.2 5.7-3 3.6.3 5.5 4 3.8 7.8-2.5 4.6-9.5 9-9.5 9z"/></svg>',
  technologie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5 5l2 2M19 5l-2 2M5 19l2-2M19 19l-2-2"/></svg>',
  art: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-1 2-2 0-.6-.3-1-.6-1.4-.3-.4-.6-.8-.6-1.3 0-1 .8-1.8 1.8-1.8h2A4.5 4.5 0 0 0 21 10c0-4-4-7-9-7Z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="15" cy="8" r="1"/></svg>',
  commerce: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  agriculture: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21V9"/><path d="M12 13c0-4 3-7 7-7 0 4-3 7-7 7Z"/><path d="M12 17c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5Z"/></svg>',
  education: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 9l10-4 10 4-10 4-10-4Z"/><path d="M6 11v5c2 1.5 10 1.5 12 0v-5"/></svg>',
  ingenierie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.2-1.6l2-1.4-1.5-2.6-2.2 1a7 7 0 0 0-2.6-1.5L14 3h-4l-.5 2.9a7 7 0 0 0-2.6 1.5l-2.2-1L3.2 9l2 1.4a7 7 0 0 0 0 3.2l-2 1.4 1.5 2.6 2.2-1a7 7 0 0 0 2.6 1.5L10 21h4l.5-2.9a7 7 0 0 0 2.6-1.5l2.2 1 1.5-2.6-2-1.4c.13-.5.2-1 .2-1.6Z"/></svg>',
  psychologie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8.5" cy="9" r="3.2"/><circle cx="16" cy="10" r="2.4"/><path d="M2.5 20c0-3.5 2.7-5.8 6-5.8s6 2.3 6 5.8"/><path d="M13.5 20c.3-2.6 2-4.3 4.3-4.3 2.4 0 4.2 1.9 4.2 4.3"/></svg>',
  mode: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 4l3 2 3-2 4 3-2.5 2.5L17 20H7l.5-10.5L5 7l4-3Z"/></svg>',
  aviation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3v7M12 21v-4M2 13l20-3-1 4-19 3v-4Z"/><path d="M9 17l-2 3M15 17l2 3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 12l5 5L20 6"/></svg>',
  dot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5c2-1 5-1 7 0v14c-2-1-5-1-7 0V5Z"/><path d="M20 5c-2-1-5-1-7 0v14c2-1 5-1 7 0V5Z"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c0-4.2 3.4-6.5 7.5-6.5s7.5 2.3 7.5 6.5"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3.5l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6L3.3 9.9l6-.9L12 3.5Z"/></svg>'
};

/* ---------------- Data ---------------- */
// Chaque domaine regroupe des métiers concrets. Chaque métier a une filière conseillée
// et hérite du potentiel/des figures inspirantes du domaine (affichés dans la fiche métier).
// Chaque domaine regroupe des métiers concrets. Chaque métier a une filière conseillée
// et hérite du potentiel/des figures inspirantes du domaine (affichés dans la fiche métier).
const SECTORS = {
  sante: {
    name:"Santé", desc:"Prendre soin des autres, comprendre le corps humain et intervenir pour améliorer la vie des gens.",
    potentiel:"Secteur en tension quasi partout dans le monde : les besoins en soins augmentent plus vite que le nombre de professionnels formés, surtout hors des grandes villes.",
    figures:[{ nom:"Denis Mukwege", histoire:"Gynécologue congolais né en 1955, il fonde l'hôpital de Panzi en République démocratique du Congo, où il soigne des dizaines de milliers de femmes victimes de violences sexuelles pendant les conflits armés de la région. Son travail médical s'accompagne d'un engagement pour faire reconnaître ces violences comme arme de guerre sur la scène internationale. En 2018, il reçoit le Prix Nobel de la paix pour cet engagement. Son parcours montre qu'un métier de soin peut aussi devenir un combat pour la dignité humaine." }],
    metiers:[
      { id:"medecin", nom:"Médecin généraliste", filiere:"Médecine générale (6-7 ans après le bac)" },
      { id:"infirmier", nom:"Infirmier(ère)", filiere:"Sciences infirmières (3 ans après le bac)" },
      { id:"pharmacien", nom:"Pharmacien(ne)", filiere:"Pharmacie (5-6 ans après le bac)" },
      { id:"kine", nom:"Kinésithérapeute", filiere:"Kinésithérapie / rééducation (3-4 ans après le bac)" },
      { id:"sage_femme", nom:"Sage-femme", filiere:"Maïeutique (5 ans après le bac)" },
      { id:"dentiste", nom:"Chirurgien(ne)-dentiste", filiere:"Odontologie (5-6 ans après le bac)" }
    ]
  },
  technologie: {
    name:"Technologie", desc:"Créer et faire évoluer les outils numériques qui transforment le quotidien.",
    potentiel:"Un des secteurs qui recrute le plus vite au monde, avec beaucoup de postes en travail à distance — accessibles même sans être dans une grande capitale.",
    figures:[{ nom:"Ory Okolloh", histoire:"Juriste et technologue kényane, formée en droit à Harvard, elle s'investit dans la société civile de son pays. En 2008, elle co-fonde Ushahidi, une plateforme technologique née pour cartographier des violences post-électorales au Kenya en croisant des témoignages envoyés par SMS. L'outil est depuis utilisé dans le monde entier pour le suivi de crises humanitaires et électorales. Elle dirige ensuite les politiques publiques de Google pour l'Afrique. Son parcours illustre comment une technologie née d'un besoin réel et local peut avoir un impact bien au-delà de son pays d'origine." }],
    metiers:[
      { id:"dev", nom:"Développeur(se) logiciel", filiere:"Informatique / génie logiciel (Bac+2 à Bac+5)" },
      { id:"data", nom:"Data analyst", filiere:"Statistiques, informatique décisionnelle (Bac+3 à Bac+5)" },
      { id:"cyber", nom:"Spécialiste cybersécurité", filiere:"Réseaux & sécurité informatique (Bac+3 à Bac+5)" },
      { id:"reseau", nom:"Administrateur(rice) réseau", filiere:"Réseaux & télécoms (Bac+2 à Bac+3)" },
      { id:"uxui", nom:"Designer UX/UI", filiere:"Design d'interaction / ergonomie numérique (Bac+3 à Bac+5)" },
      { id:"product", nom:"Chef(fe) de projet digital", filiere:"Gestion de projet informatique (Bac+5)" }
    ]
  },
  art: {
    name:"Art & Design", desc:"Imaginer et donner une forme sensible et utile aux idées, dans un objet, un espace ou une image.",
    potentiel:"Débouchés variés entre indépendance (freelance, atelier) et postes en agence ou en entreprise ; la réputation et le portfolio comptent souvent plus que le diplôme seul.",
    figures:[{ nom:"Yinka Ilori", histoire:"Designer britannique né à Londres de parents nigérians, il puise dans les motifs colorés et les proverbes de la culture yoruba pour créer des meubles, des installations et des espaces publics repensés — notamment d'anciens terrains de jeux transformés en lieux vivants et colorés. Son travail a été exposé dans plusieurs grandes institutions de design à l'international. Son parcours montre qu'un héritage culturel personnel peut devenir une signature artistique reconnue mondialement." }],
    metiers:[
      { id:"designer", nom:"Designer graphique", filiere:"Arts appliqués, design graphique (Bac+2 à Bac+5)" },
      { id:"architecte", nom:"Architecte", filiere:"Architecture (5 ans après le bac)" },
      { id:"decorateur", nom:"Décorateur(rice) d'intérieur", filiere:"Design d'espace / architecture d'intérieur (Bac+2 à Bac+3)" },
      { id:"illustrateur", nom:"Illustrateur(rice)", filiere:"Arts plastiques, illustration (Bac+2 à Bac+5)" },
      { id:"photographe_art", nom:"Photographe", filiere:"Photographie (formation courte à Bac+3)" },
      { id:"bijoutier", nom:"Bijoutier(ère) / Artisan(e) d'art", filiere:"Arts appliqués, artisanat d'art (CAP à Bac+2)" }
    ]
  },
  commerce: {
    name:"Commerce & Business", desc:"Créer de la valeur, vendre une idée ou un produit, et faire grandir une activité.",
    potentiel:"Secteur qui offre le plus de chemins différents : on peut y entrer avec ou sans diplôme long, et l'entrepreneuriat y reste une voie réaliste dès le début de carrière.",
    figures:[{ nom:"Tony Elumelu", histoire:"Entrepreneur et banquier nigérian, il bâtit sa carrière dans le secteur bancaire ouest-africain avant de fonder la Tony Elumelu Foundation, qui a financé et accompagné des dizaines de milliers de jeunes entrepreneurs à travers le continent africain. Il défend l'idée d'« africapitalisme » : la conviction que le secteur privé africain a un rôle central à jouer dans le développement du continent. Son parcours montre qu'on peut construire une carrière dans la finance tout en consacrant des ressources significatives à faire grandir d'autres entrepreneurs." }],
    metiers:[
      { id:"entrepreneur", nom:"Entrepreneur(se)", filiere:"Gestion, commerce (Bac à Bac+5, ou expérience terrain)" },
      { id:"commercial", nom:"Commercial(e)", filiere:"Techniques de vente, commerce (Bac à Bac+3)" },
      { id:"gestionnaire", nom:"Gestionnaire", filiere:"Gestion d'entreprise, comptabilité (Bac+2 à Bac+5)" },
      { id:"marketing", nom:"Chargé(e) marketing", filiere:"Marketing, communication (Bac+3 à Bac+5)" },
      { id:"banquier", nom:"Chargé(e) de clientèle bancaire", filiere:"Banque-finance (Bac+3 à Bac+5)" },
      { id:"logisticien", nom:"Logisticien(ne) / Import-export", filiere:"Commerce international, logistique (Bac+2 à Bac+5)" }
    ]
  },
  agriculture: {
    name:"Agriculture & Environnement", desc:"Travailler avec la terre et le vivant pour nourrir et préserver l'environnement.",
    potentiel:"Secteur stratégique dans les économies ouest-africaines, avec un fort besoin de modernisation — donc de vraies opportunités pour qui allie savoir-faire terrain et formation technique.",
    figures:[{ nom:"Wangari Maathai", histoire:"Scientifique et militante environnementale kényane, elle devient en 1971 la première femme d'Afrique centrale et de l'Est à obtenir un doctorat. En 1977, elle fonde le Green Belt Movement, un mouvement qui mènera à la plantation de dizaines de millions d'arbres au Kenya pour lutter contre la déforestation et améliorer les conditions de vie des femmes rurales. Son engagement lui vaut plusieurs arrestations sous le régime en place à l'époque. En 2004, elle devient la première femme africaine à recevoir le Prix Nobel de la paix. Son parcours relie directement le travail de la terre à un impact politique et social majeur." }],
    metiers:[
      { id:"agronome", nom:"Agronome", filiere:"Agronomie (Bac+3 à Bac+5)" },
      { id:"ing_agri", nom:"Ingénieur(e) agricole", filiere:"Génie agricole (Bac+5)" },
      { id:"veterinaire", nom:"Vétérinaire", filiere:"Médecine vétérinaire (5-6 ans après le bac)" },
      { id:"environnement", nom:"Spécialiste environnement", filiere:"Sciences environnementales (Bac+3 à Bac+5)" },
      { id:"apiculteur", nom:"Apiculteur(rice)", filiere:"Formation agricole spécialisée (courte, quelques mois à 1 an)" },
      { id:"halieutique", nom:"Ingénieur(e) halieutique / Pêche", filiere:"Sciences halieutiques et aquacoles (Bac+5)" }
    ]
  },
  education: {
    name:"Éducation", desc:"Transmettre un savoir et accompagner d'autres personnes dans leur progression.",
    potentiel:"Besoin constant et massif d'enseignants qualifiés ; les métiers de la formation professionnelle et de l'orientation restent, eux, encore peu développés — donc porteurs.",
    figures:[{ nom:"Patrick Awuah", histoire:"Ingénieur ghanéen, il fait carrière chez Microsoft aux États-Unis avant de revenir au Ghana pour fonder l'université Ashesi en 2002. Son objectif : former une nouvelle génération de leaders éthiques et compétents pour le continent africain, avec un accent fort sur l'intégrité académique. L'université est aujourd'hui reconnue comme l'une des institutions d'enseignement supérieur les plus respectées d'Afrique de l'Ouest. Son parcours montre qu'on peut quitter une carrière confortable à l'étranger pour reconstruire, chez soi, un système éducatif exigeant." }],
    metiers:[
      { id:"enseignant", nom:"Enseignant(e)", filiere:"Sciences de l'éducation, CAP/CAPES selon le pays (Bac+3 à Bac+5)" },
      { id:"formateur", nom:"Formateur(rice) professionnel(le)", filiere:"Formation professionnelle, ingénierie pédagogique (Bac+3)" },
      { id:"conseiller_orientation", nom:"Conseiller(ère) d'orientation", filiere:"Psychologie, sciences de l'éducation (Bac+3 à Bac+5)" },
      { id:"directeur_ecole", nom:"Directeur(rice) d'établissement scolaire", filiere:"Sciences de l'éducation + expérience d'enseignement (Bac+5)" },
      { id:"bibliothecaire", nom:"Bibliothécaire / Documentaliste", filiere:"Sciences de l'information et des bibliothèques (Bac+3)" }
    ]
  },
  ingenierie: {
    name:"Ingénierie", desc:"Concevoir, construire et faire fonctionner des systèmes techniques.",
    potentiel:"Les infrastructures (routes, bâtiments, énergie) restent à développer dans une grande partie de la région — un secteur avec des besoins visibles sur des décennies.",
    figures:[{ nom:"Verone Mankou", histoire:"Ingénieur congolais qui, encore très jeune, conçoit et commercialise sous la marque VMK parmi les premiers appareils électroniques (tablette puis smartphone) conçus en Afrique. Son objectif affiché est de montrer qu'une conception technologique locale et compétitive est possible sur le continent, plutôt que de dépendre uniquement d'appareils importés. Son parcours a inspiré d'autres jeunes ingénieurs africains à se lancer dans la conception de produits plutôt que dans leur seule utilisation." }],
    metiers:[
      { id:"ing_civil", nom:"Ingénieur(e) civil(e)", filiere:"Génie civil (Bac+5)" },
      { id:"electricien", nom:"Électricien(ne)", filiere:"Électrotechnique (Bac+2 à Bac+3)" },
      { id:"technicien_indus", nom:"Technicien(ne) industriel(le)", filiere:"Génie industriel, maintenance (Bac+2)" },
      { id:"ing_meca", nom:"Ingénieur(e) mécanique", filiere:"Génie mécanique (Bac+5)" },
      { id:"ing_energie", nom:"Ingénieur(e) énergie", filiere:"Génie énergétique (Bac+5)" }
    ]
  },
  psychologie: {
    name:"Sciences humaines & Psychologie", desc:"Comprendre le fonctionnement humain et accompagner les personnes dans leur bien-être.",
    potentiel:"Métier encore peu reconnu socialement dans certains pays alors que la demande réelle augmente — accompagnement scolaire, entreprises, santé mentale — un vrai décalage entre besoin et offre.",
    figures:[{ nom:"Wilhelm Wundt", histoire:"Physiologiste et philosophe allemand du 19e siècle, il fonde en 1879 à Leipzig le premier laboratoire de psychologie expérimentale au monde, marquant la naissance de la psychologie comme discipline scientifique à part entière, séparée de la philosophie. Il forme de nombreux étudiants venus du monde entier, qui exportent ensuite cette approche expérimentale dans leurs pays d'origine. Son travail pose les bases méthodologiques qui permettent aujourd'hui à un(e) psychologue de fonder ses observations sur une démarche rigoureuse plutôt que sur la seule intuition." }],
    metiers:[
      { id:"psychologue", nom:"Psychologue", filiere:"Psychologie (Bac+5, master requis dans la plupart des pays)" },
      { id:"social", nom:"Travailleur(se) social(e)", filiere:"Travail social (Bac+3)" },
      { id:"rh", nom:"Chargé(e) RH", filiere:"Ressources humaines, gestion (Bac+3 à Bac+5)" },
      { id:"mediateur", nom:"Médiateur(rice) familial(e)", filiere:"Médiation familiale (Bac+3 à Bac+5)" },
      { id:"coach", nom:"Coach professionnel(le)", filiere:"Certification en coaching (formation courte, variable)" }
    ]
  },
  mode: {
    name:"Mode, Image & Spectacle", desc:"Créer et incarner une image, un style ou une histoire — devant ou derrière la caméra.",
    potentiel:"Secteur très compétitif et concentré sur quelques grandes villes/plateformes, mais de plus en plus accessible grâce aux réseaux sociaux qui permettent de se faire repérer sans passer par les circuits traditionnels.",
    figures:[
      { nom:"Naomi Campbell", histoire:"Mannequin britannique qui débute sa carrière à l'adolescence, à la fin des années 1980. Elle devient rapidement l'une des « supermodels » emblématiques des années 1990, et l'une des premières femmes noires à défiler pour de très grandes maisons de couture et à faire la couverture de magazines qui, jusque-là, incluaient peu de mannequins noirs. Sa carrière s'étend sur plus de trois décennies, ce qui est rare dans une industrie souvent centrée sur la jeunesse. Son parcours illustre à la fois les portes qu'un mannequin peut ouvrir et les obstacles de représentation qu'il a fallu, et qu'il faut encore, faire bouger." },
      { nom:"Alek Wek", histoire:"Mannequin née au Soudan (aujourd'hui Soudan du Sud), elle fuit la guerre civile avec sa famille durant son enfance avant de s'installer au Royaume-Uni comme réfugiée. Repérée à 18 ans, elle devient mannequin dans une industrie où les canons de beauté valorisaient alors rarement sa carnation et ses traits. Elle s'impose au contraire comme une référence et ouvre la voie à une plus grande diversité dans le secteur. Son parcours montre qu'un déracinement peut aussi devenir, avec du temps et des rencontres décisives, un point de départ vers une carrière internationale." }
    ],
    metiers:[
      { id:"mannequin", nom:"Mannequin", filiere:"Pas de filière obligatoire ; agences de mannequinat, formation posture/podium" },
      { id:"styliste", nom:"Styliste", filiere:"Stylisme, création de mode (Bac+2 à Bac+5)" },
      { id:"maquilleur", nom:"Maquilleur(se) professionnel(le)", filiere:"Formation en maquillage professionnel (certification, quelques mois à 2 ans)" },
      { id:"photographe", nom:"Photographe de mode", filiere:"Photographie (formation courte à Bac+3)" },
      { id:"choregraphe", nom:"Danseur(se) / Chorégraphe", filiere:"Formation en danse (école spécialisée, variable)" },
      { id:"realisateur", nom:"Réalisateur(rice)", filiere:"Cinéma / audiovisuel (Bac+3 à Bac+5)" }
    ]
  },
  aviation: {
    name:"Aviation & Transport", desc:"Faire voler, coordonner et sécuriser les déplacements aériens.",
    potentiel:"Secteur exigeant en formation (donc en investissement au départ) mais avec une forte demande mondiale de personnel qualifié, en particulier de pilotes, sur le long terme.",
    figures:[{ nom:"Bessie Coleman", histoire:"Née en 1892 aux États-Unis dans une famille modeste, elle est refusée par toutes les écoles de pilotage américaines en raison de son genre et de sa couleur de peau. Elle apprend le français et part se former en France, où elle obtient sa licence de pilote en 1921 — devenant ainsi la première femme afro-américaine et la première Amérindienne à détenir une licence de pilote au monde. De retour aux États-Unis, elle se produit dans des meetings aériens et milite pour que les personnes noires aient accès à l'aviation. Elle meurt dans un accident d'avion en 1926, mais son parcours reste une référence citée aujourd'hui encore dans l'histoire de l'aviation." }],
    metiers:[
      { id:"pilote", nom:"Pilote de ligne", filiere:"École de pilotage + licence ATPL (formation longue et coûteuse, souvent 2-3 ans)" },
      { id:"steward", nom:"Hôtesse de l'air / Steward", filiere:"Formation courte spécifique + certification sécurité (quelques mois)" },
      { id:"controleur", nom:"Contrôleur(se) aérien(ne)", filiere:"École de la navigation aérienne (formation spécialisée, concours)" },
      { id:"ing_aero", nom:"Ingénieur(e) aéronautique", filiere:"Génie aéronautique (Bac+5)" },
      { id:"agent_escale", nom:"Agent(e) d'escale", filiere:"Formation courte aéroportuaire (quelques mois)" },
      { id:"douanier", nom:"Agent(e) de douane / fret aérien", filiere:"Concours douanes ou logistique (Bac à Bac+2)" }
    ]
  }
};
// Contenu de l'Académie, par domaine : leçons détaillées (contenu seul), exercices
// autonomes de pratique, et un examen final plus exigeant (seuil de réussite : 70%).
// Contenu de l'Académie, par domaine : leçons au format professionnel (définition, développement,
// exemple concret, erreur fréquente à éviter, points clés), exercices de pratique et examen final exigeant.
const COURS = {
  sante: {
    lecons:[
      { titre:"Le diagnostic, une enquête méthodique",
        definition:"Le diagnostic différentiel est la méthode qui consiste à identifier une maladie à partir de ses symptômes en éliminant progressivement les autres causes possibles, plutôt qu'en devinant.",
        contenu:[
          "Un professionnel de santé ne devine jamais un problème : il suit une démarche appelée diagnostic différentiel. Il commence par écouter le patient décrire ses symptômes, pose des questions ciblées sur leur apparition, leur durée et leur intensité, puis élimine progressivement les causes possibles grâce à un examen clinique et parfois des analyses complémentaires.",
          "Cette rigueur évite deux erreurs fréquentes : traiter un symptôme sans en comprendre la cause réelle, ou au contraire multiplier des examens inutiles. Un bon diagnostic repose autant sur l'écoute que sur la connaissance technique — c'est pourquoi la relation de confiance avec le patient fait partie intégrante du soin.",
          "Cette méthode s'appuie aussi sur la probabilité : un soignant expérimenté pense d'abord aux causes les plus fréquentes compatibles avec les symptômes, tout en gardant en tête les causes rares mais graves à ne jamais négliger, même si elles semblent improbables au premier abord." ],
        exemple:"Un patient se plaint de douleurs abdominales. Plutôt que de conclure aussitôt à une simple indigestion, le soignant élimine successivement d'autres causes possibles — appendicite, infection urinaire, ulcère — en croisant la localisation exacte de la douleur, une éventuelle fièvre et les résultats d'un examen physique, avant de poser un diagnostic final.",
        note:"Confondre corrélation et cause est une erreur classique : ce n'est pas parce que deux symptômes apparaissent ensemble que l'un explique nécessairement l'autre. Un diagnostic hâtif fondé sur un seul signe, sans vérifier les autres pistes, est une source fréquente d'erreurs médicales.",
        pointscles:["Le diagnostic précède toujours le traitement, jamais l'inverse.","Une bonne anamnèse (l'interrogatoire du patient) oriente souvent plus que les examens techniques.","Éliminer les causes graves en premier, même rares, est un réflexe de sécurité essentiel."] },
      { titre:"La prévention, un travail invisible mais massif",
        definition:"La prévention regroupe l'ensemble des actions menées avant l'apparition d'une maladie pour en réduire le risque ou l'impact, plutôt que d'attendre pour la traiter une fois déclarée.",
        contenu:[
          "Une large part des maladies dans le monde ne sont pas soignées mais évitées, grâce à des actions de santé publique : hygiène de l'eau, vaccination, éducation aux gestes qui sauvent, dépistage précoce. Ce travail de prévention est souvent moins visible que celui d'un chirurgien, mais il sauve statistiquement bien plus de vies.",
          "Dans les régions où l'accès aux soins reste limité, les campagnes de prévention (vaccination, moustiquaires contre le paludisme, sensibilisation à l'hygiène) ont souvent un impact plus rapide et plus large que la construction de nouveaux hôpitaux. C'est pourquoi les métiers de santé publique et communautaire sont aussi stratégiques que les métiers de soin direct.",
          "La prévention se joue aussi à l'échelle individuelle : dépistages réguliers, suivi de grossesse, contrôle de la tension artérielle. Ces gestes simples et peu coûteux permettent souvent de repérer un problème à un stade où il reste facile à traiter, avant qu'il ne devienne grave et coûteux à soigner." ],
        exemple:"Une campagne de vaccination contre la rougeole menée avant une saison à risque évite des centaines d'hospitalisations dans une région donnée, alors qu'un hôpital ne peut, lui, que traiter les cas une fois qu'ils sont déjà déclarés.",
        note:"Sous-estimer la prévention parce que ses effets sont invisibles (« il ne s'est rien passé ») est une erreur de raisonnement fréquente : l'absence de maladie est précisément le signe que la prévention a fonctionné, pas une preuve qu'elle était inutile.",
        pointscles:["La prévention agit avant l'apparition de la maladie, le soin agit après.","Le rapport bénéfice/coût de la prévention dépasse presque toujours celui du seul traitement curatif.","Hygiène de l'eau, vaccination et dépistage précoce restent les leviers les plus efficaces à grande échelle."] },
      { titre:"L'éthique et le secret médical",
        definition:"Le secret professionnel médical est l'obligation légale et déontologique qui interdit à un soignant de révéler les informations confiées par un patient, sauf exceptions strictement encadrées.",
        contenu:[
          "Toute personne qui exerce un métier de santé est tenue au secret professionnel : ce qu'un patient confie ne peut être partagé sans son accord, sauf danger grave pour lui-même ou pour autrui. Cette règle n'est pas une simple formalité administrative : elle conditionne la confiance nécessaire pour qu'un patient ose parler ouvertement de ce qu'il vit.",
          "Les métiers de santé impliquent aussi des décisions parfois difficiles sur le plan éthique — annoncer une mauvaise nouvelle, arbitrer entre plusieurs traitements possibles, respecter le choix d'un patient même quand on ne le partage pas. C'est une dimension humaine du métier aussi importante que la maîtrise technique.",
          "Ce cadre éthique protège aussi le soignant : en cas de désaccord avec un patient ou sa famille, s'appuyer sur des règles claires et connues de tous permet de prendre une décision défendable, plutôt que de improviser au cas par cas selon la pression du moment." ],
        exemple:"Un adolescent consulte seul pour une question de santé sexuelle. Selon le cadre légal local, le soignant peut le recevoir sans en informer automatiquement les parents, précisément pour ne pas décourager les jeunes patients de consulter par crainte d'être exposés.",
        note:"Céder à la pression d'un proche insistant (« c'est mon mari, j'ai le droit de savoir ») sans vérifier le cadre légal exact est une erreur fréquente qui peut constituer une faute professionnelle grave.",
        pointscles:["Le secret protège le patient, y compris face à sa propre famille.","Il ne peut être levé que dans des cas précis : danger grave et imminent, ou accord explicite du patient.","La confiance née du secret professionnel est ce qui permet un diagnostic honnête et complet."] }
    ],
    exercices:[
      { q:"Un patient dit se sentir fatigué depuis un mois. Que fait un professionnel de santé en premier ?", options:["Prescrire un fortifiant sans autre question","Poser des questions précises sur le sommeil, l'alimentation et d'éventuels autres symptômes","Dire que c'est normal et ne rien faire"], correct:1, explication:"La fatigue peut avoir des dizaines de causes différentes — sans creuser, on risque de passer à côté du vrai problème." },
      { q:"Pourquoi vaccine-t-on des enfants en bonne santé ?", options:["Pour les protéger avant qu'ils ne soient exposés à la maladie","Parce que c'est obligatoire sans autre raison","Ça n'a pas d'utilité réelle"], correct:0, explication:"La vaccination agit avant l'exposition — attendre que la maladie survienne annulerait son intérêt principal." },
      { q:"Un(e) infirmier(ère) peut-il/elle refuser de révéler à la famille ce qu'un patient adulte lui a confié ?", options:["Non, la famille a toujours le droit de savoir","Oui, sauf si le patient l'autorise ou en cas de danger grave","Seulement si la famille insiste"], correct:1, explication:"Le secret professionnel protège le patient, y compris face à sa propre famille, sauf exception grave prévue par la loi." },
      { q:"Quelle affirmation décrit le mieux le rôle de la kinésithérapie ?", options:["Elle sert uniquement après une opération lourde","Elle accompagne la récupération ou l'amélioration du mouvement du corps, dans des contextes très variés","Elle remplace toujours la chirurgie"], correct:1, explication:"La kinésithérapie intervient dans des contextes très larges : sport, rééducation, douleurs chroniques, pas seulement après une opération." },
      { q:"Pourquoi dit-on que la prévention a un meilleur rapport bénéfice/coût que le seul soin curatif ?", options:["Parce qu'elle évite des maladies avant qu'elles ne coûtent cher à traiter","Parce qu'elle est gratuite dans tous les pays","Ce n'est pas vraiment vrai en pratique"], correct:0, explication:"Éviter une maladie coûte presque toujours moins cher, humainement et financièrement, que la traiter une fois déclarée." },
      { q:"Un(e) sage-femme accompagne principalement...", options:["Les grossesses, accouchements et le suivi post-natal","Uniquement les urgences chirurgicales","La gestion administrative d'un hôpital"], correct:0, explication:"C'est le cœur du métier de sage-femme, en complément du suivi médical global." }
    ],
    examen:[
      { q:"Un diagnostic différentiel consiste à...", options:["Choisir un traitement au hasard puis observer","Éliminer progressivement les causes possibles d'un symptôme à partir des éléments cliniques","Attendre que la maladie s'aggrave pour être sûr"], correct:1 },
      { q:"Cas pratique — Un village voit une hausse soudaine de cas de diarrhée chez les enfants. Quelle est l'action prioritaire la plus probable ?", options:["Prescrire des antibiotiques à tout le village","Vérifier en priorité la qualité de l'eau et les conditions d'hygiène locales","Construire un nouvel hôpital"], correct:1 },
      { q:"Le secret médical peut être levé sans l'accord du patient si...", options:["Un journaliste le demande pour un article","Il existe un danger grave et imminent pour la personne ou pour autrui","La famille insiste suffisamment"], correct:1 },
      { q:"Pourquoi la relation de confiance entre patient et soignant influence-t-elle la qualité du diagnostic ?", options:["Elle n'a aucun effet sur le diagnostic","Un patient en confiance partage des informations plus complètes et plus honnêtes","Elle sert seulement à rassurer, pas à soigner"], correct:1 },
      { q:"Cas pratique — Un patient refuse un traitement recommandé, pour des raisons personnelles. Quelle est l'attitude professionnelle attendue ?", options:["Imposer le traitement car le médecin sait mieux","Expliquer les risques du refus, respecter la décision du patient si celui-ci reste ferme, et documenter l'échange","Refuser de continuer à suivre ce patient"], correct:1 },
      { q:"Quel est le principal avantage des campagnes de prévention par rapport au seul traitement curatif à grande échelle ?", options:["Elles coûtent toujours plus cher","Elles évitent l'apparition de maladies plutôt que de les traiter après coup, avec souvent un meilleur rapport impact/coût","Elles n'ont pas vraiment d'avantage"], correct:1 },
      { q:"Cas pratique — Un adolescent consulte seul pour une question intime et demande que ses parents ne soient pas informés. Quelle est l'attitude la plus conforme à l'éthique médicale ?", options:["Informer systématiquement les parents car l'adolescent est mineur","Respecter, dans le cadre légal en vigueur, la confidentialité pour ne pas décourager la consultation","Refuser de le recevoir sans ses parents"], correct:1 },
      { q:"La différence essentielle entre médecin généraliste et pharmacien(ne) est que...", options:["Le médecin diagnostique et prescrit, le pharmacien dispense et conseille sur les médicaments","Ce sont exactement les mêmes compétences","Le pharmacien peut opérer un patient"], correct:0 }
    ]
  },
  technologie: {
    lecons:[
      { titre:"Décomposer avant de coder",
        definition:"L'algorithmique est la discipline qui consiste à décomposer un problème en une suite d'étapes logiques et ordonnées, indépendamment de tout langage de programmation.",
        contenu:[
          "Avant d'écrire une seule ligne de code, un développeur découpe un problème complexe en petites étapes simples et ordonnées — un peu comme une recette de cuisine décompose un plat en gestes successifs. Cette étape s'appelle l'algorithmique : elle ne dépend d'aucun langage de programmation en particulier, c'est une façon de raisonner.",
          "Sans cette décomposition, le code devient vite un empilement d'instructions difficile à corriger ou à faire évoluer. C'est pourquoi les meilleurs développeurs passent souvent plus de temps à réfléchir à la structure du problème qu'à taper du code — une fois la logique claire, l'écriture va vite.",
          "Cette décomposition permet aussi de tester chaque étape séparément : si le programme final ne fonctionne pas, on peut vérifier bloc par bloc lequel pose problème, plutôt que de devoir tout relire d'un bloc." ],
        exemple:"Pour trier une liste de noms par ordre alphabétique, on décompose le problème avant de coder : comparer deux éléments, échanger leur position si nécessaire, répéter l'opération jusqu'à ce que la liste entière soit ordonnée. Cette logique reste identique qu'on l'écrive en JavaScript, en Python ou dans tout autre langage.",
        note:"Vouloir écrire directement du code sans avoir clarifié la logique au préalable est une erreur très fréquente chez les débutants : elle mène à du code qui « marche par hasard » mais qu'on ne sait plus expliquer ni corriger.",
        pointscles:["Un algorithme est une suite d'étapes logiques, indépendante du langage utilisé.","Décomposer un problème avant de coder fait gagner du temps, pas en perdre.","Une logique claire permet de tester et corriger étape par étape."] },
      { titre:"Le bug, une information plutôt qu'un échec",
        definition:"Un bug est un comportement d'un programme différent de ce qui était attendu ; le débogage est la démarche méthodique qui permet d'en identifier puis d'en corriger la cause.",
        contenu:[
          "Un bug est un comportement du programme différent de ce qui était attendu. Loin d'être une anomalie honteuse, c'est une source d'information : il indique précisément où le raisonnement initial ou son implémentation s'est écarté du résultat voulu.",
          "Corriger un bug suit une méthode : reproduire le problème de façon fiable, isoler la portion de code responsable, formuler une hypothèse sur la cause, la tester, puis vérifier que la correction ne casse rien d'autre. Cette discipline, appelée débogage, est une compétence à part entière, aussi importante que savoir écrire du code neuf.",
          "Les outils de débogage (points d'arrêt, journaux d'exécution, tests automatisés) permettent d'observer précisément ce que fait le programme à chaque étape, plutôt que de deviner à l'aveugle où se situe le problème." ],
        exemple:"Une application affiche un montant négatif après une remise. Le développeur reproduit le cas (un panier avec cette remise précise), isole la fonction de calcul du total, et découvre que la remise est soustraite deux fois — une hypothèse confirmée en ajoutant un simple affichage de contrôle avant la correction.",
        note:"Corriger un bug « à l'instinct », en modifiant du code au hasard jusqu'à ce que l'erreur visible disparaisse, est une pratique risquée : elle peut masquer le vrai problème ou en créer un nouveau ailleurs.",
        pointscles:["Un bug est une information sur un écart entre le comportement attendu et réel, pas un échec personnel.","Reproduire le bug de façon fiable est la première étape indispensable avant de le corriger.","Une correction doit être vérifiée pour s'assurer qu'elle ne casse rien d'autre dans le programme."] },
      { titre:"Sécurité et données : une responsabilité, pas une option",
        definition:"La cybersécurité applicative regroupe les pratiques qui protègent les données manipulées par un logiciel contre le vol, la perte ou l'utilisation non autorisée.",
        contenu:[
          "Toute application qui manipule des données personnelles (noms, numéros de téléphone, informations médicales ou financières) engage une responsabilité : celle de protéger ces informations contre le vol ou la fuite. Un mot de passe mal protégé ou une faille non corrigée peut exposer des milliers de personnes.",
          "C'est pourquoi la cybersécurité n'est plus un métier à part réservé à quelques spécialistes : la plupart des développeurs doivent connaître les bonnes pratiques de base (chiffrement, gestion des accès, mises à jour) pour ne pas créer, sans le vouloir, une porte d'entrée pour une attaque.",
          "La sécurité se pense dès la conception d'un logiciel, pas seulement après une attaque : limiter les accès au strict nécessaire, vérifier systématiquement les données entrées par l'utilisateur, et garder les logiciels à jour réduisent fortement les risques." ],
        exemple:"Un formulaire de connexion qui accepte n'importe quelle donnée sans vérification peut permettre à un attaquant d'insérer du code malveillant dans le champ mot de passe (une technique appelée injection) pour contourner l'authentification — d'où l'importance de valider systématiquement chaque donnée reçue.",
        note:"Penser que « mon application est trop petite pour intéresser un attaquant » est une erreur fréquente et dangereuse : de nombreuses attaques automatisées ciblent des milliers de sites au hasard, sans distinction de taille.",
        pointscles:["Protéger les données des utilisateurs est une responsabilité, pas une fonctionnalité optionnelle.","La sécurité se conçoit dès le départ, pas seulement après un incident.","Chiffrement, contrôle des accès et mises à jour régulières réduisent la majorité des risques courants."] }
    ],
    exercices:[
      { q:"Que signifie 'déboguer' un programme ?", options:["Ajouter de nouvelles fonctionnalités","Identifier et corriger la cause d'un comportement inattendu","Supprimer le programme entièrement"], correct:1, explication:"Déboguer, c'est retrouver précisément la cause d'un problème, pas juste le contourner." },
      { q:"Pourquoi décompose-t-on un problème avant de coder ?", options:["Pour perdre du temps volontairement","Pour clarifier la logique et éviter un code impossible à corriger plus tard","Ce n'est pas nécessaire avec les langages modernes"], correct:1, explication:"Une logique claire en amont évite le code confus qu'on ne peut plus faire évoluer." },
      { q:"Un mot de passe stocké 'en clair' (non chiffré) dans une base de données pose quel risque ?", options:["Aucun si la base n'est jamais piratée","En cas de fuite, tous les mots de passe sont immédiatement lisibles par l'attaquant","Il ralentit seulement le site"], correct:1, explication:"Le chiffrement protège les données même en cas de fuite — sans lui, une fuite devient une catastrophe immédiate." },
      { q:"Qu'apporte un(e) data analyst à une entreprise ?", options:["Il/elle répare les ordinateurs cassés","Il/elle transforme des données brutes en informations utiles à la décision","Il/elle s'occupe uniquement du design visuel"], correct:1, explication:"L'analyse de données aide à prendre de meilleures décisions à partir de faits plutôt que d'impressions." },
      { q:"Pourquoi valider systématiquement les données saisies par un utilisateur dans un formulaire ?", options:["Pour ralentir volontairement le site","Pour éviter qu'une donnée malveillante ne soit exploitée par le programme","Ce n'est qu'une convention esthétique"], correct:1, explication:"Une donnée non vérifiée peut être détournée pour attaquer l'application (ex : injection de code)." },
      { q:"Le rôle d'un(e) designer UX/UI est principalement de...", options:["Rendre un logiciel facile et agréable à utiliser","Gérer les serveurs de l'entreprise","Corriger uniquement les bugs de sécurité"], correct:0, explication:"L'UX/UI se concentre sur l'expérience et l'interface utilisateur, pas sur l'infrastructure technique." }
    ],
    examen:[
      { q:"Un algorithme est indépendant...", options:["Du problème à résoudre","Du langage de programmation utilisé pour l'implémenter","De toute logique"], correct:1 },
      { q:"Cas pratique — Une application plante systématiquement quand un utilisateur laisse un champ vide. Quelle est la démarche de débogage la plus rigoureuse ?", options:["Réécrire toute l'application depuis le début","Reproduire le bug de façon fiable, isoler le code concerné, tester une hypothèse de correction","Ignorer le bug s'il touche peu d'utilisateurs"], correct:1 },
      { q:"Le chiffrement d'une donnée sert principalement à...", options:["La rendre illisible sans une clé, même en cas de vol","La rendre plus rapide à charger","L'empêcher d'être supprimée"], correct:0 },
      { q:"Cas pratique — Une entreprise stocke les mots de passe de ses utilisateurs sans aucun chiffrement. Quel est le risque principal ?", options:["Un ralentissement du site","Une exposition totale et immédiate des comptes en cas de fuite de données","Aucun risque tant qu'il n'y a pas de piratage"], correct:1 },
      { q:"La différence principale entre un(e) développeur(se) et un(e) data analyst est que...", options:["Le développeur construit des logiciels, l'analyste interprète des données pour éclairer des décisions","Ce sont exactement le même métier","Le data analyst ne travaille jamais avec du code"], correct:0 },
      { q:"Un(e) administrateur(rice) réseau est responsable avant tout de...", options:["Créer des sites internet","Assurer le bon fonctionnement et la sécurité des connexions entre les machines d'une organisation","Vendre du matériel informatique"], correct:1 },
      { q:"Cas pratique — Un formulaire de connexion accepte n'importe quelle chaîne de caractères sans aucune vérification. Quel risque cela fait-il courir ?", options:["Aucun risque particulier si le site est peu connu","Un attaquant peut potentiellement insérer du code malveillant pour contourner la sécurité","Le site sera simplement plus lent"], correct:1 },
      { q:"Le rôle d'un(e) chef(fe) de projet digital est avant tout de...", options:["Coordonner les équipes et les ressources pour livrer un projet numérique dans les délais","Écrire l'intégralité du code seul(e)","Remplacer les designers UX/UI"], correct:0 }
    ]
  },
  art: {
    lecons:[
      { titre:"La fonction avant la décoration",
        definition:"Le design est la discipline qui consiste à concevoir un objet, un espace ou une image pour qu'il résolve un problème d'usage réel, la beauté venant renforcer cette fonction sans la remplacer.",
        contenu:[
          "Un bon design ne se limite jamais à être joli : il doit d'abord résoudre un problème réel pour la personne qui l'utilise — se repérer facilement dans un espace, comprendre un message en un coup d'œil, se sentir bien dans une pièce. La beauté vient renforcer cette fonction, elle ne la remplace pas.",
          "C'est ce qui distingue un décorateur d'un designer : la décoration ajoute du style à un espace déjà fonctionnel, tandis que le design repense la fonction elle-même — la circulation dans une pièce, la lisibilité d'une affiche, l'ergonomie d'un objet.",
          "Cette distinction n'oppose pas les deux approches : un projet réussi combine souvent les deux, en pensant d'abord la fonction puis en soignant l'esthétique pour qu'elle serve ce que l'espace ou l'objet doit accomplir." ],
        exemple:"Une salle d'attente repensée par un designer ne se contente pas d'être belle : les sièges sont disposés pour permettre une file d'attente claire, la signalétique guide naturellement vers l'accueil, et l'éclairage réduit la sensation d'attente — l'esthétique vient ensuite, en cohérence avec ces choix fonctionnels.",
        note:"Se concentrer uniquement sur l'esthétique d'un projet, sans avoir clarifié l'usage réel de l'espace ou de l'objet, est une erreur fréquente qui aboutit à des résultats beaux mais peu pratiques au quotidien.",
        pointscles:["Le design résout un problème d'usage ; la décoration embellit un usage déjà en place.","La beauté doit servir la fonction, pas la remplacer.","Un bon projet pense l'usage avant l'esthétique, puis les fait coïncider."] },
      { titre:"Composer avec l'espace, la couleur et la lumière",
        definition:"La composition visuelle désigne la façon d'organiser l'espace, la couleur et la lumière dans une image, un intérieur ou un support imprimé pour guider la perception de celui qui regarde.",
        contenu:[
          "Que ce soit pour un intérieur, une affiche ou un bâtiment, la façon dont l'espace vide est réparti et dont la lumière circule change complètement la perception d'un lieu ou d'une image. Un espace surchargé fatigue l'œil ; un espace bien composé guide naturellement le regard vers ce qui compte.",
          "Les couleurs, elles, portent des significations culturelles qui varient selon les contextes — ce qui évoque le deuil dans une culture peut évoquer la fête dans une autre. Un designer ou un décorateur compétent connaît ces codes et les utilise consciemment plutôt que par hasard.",
          "La lumière, enfin, n'est pas qu'un éclairage technique : une lumière chaude et tamisée invite à la détente, une lumière blanche et intense stimule l'attention. Ce choix influence directement le comportement des personnes dans l'espace, souvent sans qu'elles en aient conscience." ],
        exemple:"Dans une affiche de campagne de santé, le designer place le message principal dans l'espace le plus dégagé de la composition, utilise une couleur contrastante pour le pictogramme d'alerte, et réduit le texte au strict nécessaire — l'œil est guidé sans effort vers l'information essentielle.",
        note:"Utiliser une couleur uniquement parce qu'elle est à la mode, sans vérifier sa signification dans le contexte culturel visé, est une erreur qui peut faire passer un message opposé à celui recherché.",
        pointscles:["L'espace vide structure une composition, il ne la fragilise pas.","La signification des couleurs varie selon les cultures — elle se vérifie, elle ne se suppose pas.","La lumière influence le comportement autant que l'ambiance visuelle."] },
      { titre:"Construire un portfolio, la vraie carte de visite du secteur",
        definition:"Un portfolio est une sélection organisée de réalisations concrètes qui démontre, par l'exemple, la compétence et la direction artistique d'un professionnel créatif.",
        contenu:[
          "Dans les métiers créatifs, le diplôme ouvre des portes mais c'est le portfolio — l'ensemble des réalisations concrètes — qui convainc réellement un client ou un recruteur. Un bon portfolio ne montre pas tout ce qu'on a fait, mais une sélection cohérente qui montre une direction claire.",
          "C'est pourquoi beaucoup de professionnels du secteur commencent par des projets personnels ou bénévoles avant leur premier contrat rémunéré : c'est une façon de construire cette preuve concrète de compétence, indépendamment du parcours scolaire suivi.",
          "Un portfolio efficace explique aussi le contexte de chaque projet — le problème posé, les choix faits, le résultat obtenu — plutôt que de se contenter de montrer une image finale sans explication, ce qui permet au lecteur de comprendre le raisonnement, pas seulement le résultat." ],
        exemple:"Un(e) jeune designer sans expérience professionnelle construit son portfolio en refaisant bénévolement l'identité visuelle d'une association locale, puis en documentant sa démarche (contraintes, choix, résultat) — ce projet devient une preuve de compétence aussi crédible qu'un contrat rémunéré.",
        note:"Présenter un portfolio surchargé de dizaines de projets inégaux, sans ligne directrice claire, dilue l'impression de compétence plutôt que de la renforcer.",
        pointscles:["Un portfolio sélectif convainc plus qu'un portfolio exhaustif.","Expliquer sa démarche a autant de valeur que montrer le résultat final.","Les projets personnels ou bénévoles sont des preuves de compétence légitimes en début de carrière."] }
    ],
    exercices:[
      { q:"Qu'est-ce qui différencie la décoration du design ?", options:["Rien, ce sont des synonymes","Le design repense la fonction d'un espace ou d'un objet, la décoration l'embellit une fois la fonction en place","La décoration coûte toujours plus cher"], correct:1, explication:"Le design agit sur la fonction ; la décoration agit sur le style, une fois la fonction posée." },
      { q:"Pourquoi la couleur est-elle un choix stratégique, pas seulement esthétique ?", options:["Elle n'a aucune signification particulière","Elle porte des significations culturelles qui influencent la perception d'un message ou d'un lieu","Le prix des peintures varie selon la couleur"], correct:1, explication:"Une couleur mal choisie peut envoyer un message opposé à celui recherché selon le contexte culturel." },
      { q:"Qu'est-ce qu'un portfolio dans les métiers créatifs ?", options:["Un CV classique listant les diplômes","Une sélection cohérente de réalisations qui démontre concrètement une compétence et une direction","Un document administratif obligatoire"], correct:1, explication:"Le portfolio prouve par l'exemple, là où le CV ne fait qu'annoncer." },
      { q:"Un(e) architecte doit avant tout concilier...", options:["Esthétique, solidité structurelle et usage réel du bâtiment","Uniquement le choix des matériaux visibles","Le prix du terrain, rien d'autre"], correct:0, explication:"L'architecture combine toujours plusieurs contraintes en même temps, pas une seule." },
      { q:"Pourquoi expliquer le contexte d'un projet dans un portfolio, pas seulement montrer le résultat ?", options:["Cela permet de comprendre le raisonnement, pas seulement l'esthétique finale","Ce n'est qu'un remplissage sans réelle utilité","Les clients ne lisent jamais ces explications"], correct:0, explication:"Le raisonnement derrière un choix créatif est souvent aussi convaincant que le résultat lui-même." },
      { q:"Le rôle principal d'un(e) bijoutier(ère)/artisan(e) d'art est de...", options:["Concevoir et fabriquer des pièces à forte valeur esthétique et technique, souvent à la main","Uniquement vendre des bijoux fabriqués ailleurs","Gérer la comptabilité d'une bijouterie"], correct:0, explication:"C'est un métier qui combine savoir-faire manuel et sens esthétique." }
    ],
    examen:[
      { q:"Un espace 'vide' dans une composition sert à...", options:["Ne rien apporter, c'est un défaut à éviter","Aérer la composition et guider le regard vers l'essentiel","Réduire le coût de production uniquement"], correct:1 },
      { q:"Cas pratique — Un(e) décorateur(rice) d'intérieur doit réaménager un studio de 20m² pour une famille de 3 personnes. Quelle priorité doit guider ses choix ?", options:["Choisir uniquement des meubles à la mode","Optimiser la circulation, le rangement et les usages réels de l'espace avant l'esthétique","Utiliser le plus de couleurs vives possible"], correct:1 },
      { q:"L'identité visuelle d'une marque regroupe...", options:["Uniquement son logo","L'ensemble cohérent de couleurs, formes, typographies et images qui la représentent","Son chiffre d'affaires annuel"], correct:1 },
      { q:"Pourquoi un portfolio 'sélectif' est-il plus efficace qu'un portfolio exhaustif ?", options:["Il montre une direction claire plutôt que de diluer l'attention sur tout ce qui a été fait","Il est toujours plus rapide à réaliser","Le nombre de projets n'a aucune importance"], correct:0 },
      { q:"Cas pratique — Un(e) designer graphique conçoit une affiche de santé publique pour une zone où une partie du public ne lit pas couramment. Quel choix est le plus pertinent ?", options:["Utiliser uniquement du texte long et détaillé","Privilégier des pictogrammes clairs et une hiérarchie visuelle forte, avec un texte minimal","Ignorer le public et utiliser un style purement artistique"], correct:1 },
      { q:"Le rôle principal d'un(e) illustrateur(rice) est de...", options:["Traduire une idée ou un texte en image pour la rendre plus parlante ou mémorable","Uniquement copier des photographies existantes","Gérer la comptabilité d'un studio de design"], correct:0 },
      { q:"Cas pratique — Un(e) photographe doit choisir entre un éclairage chaud tamisé et un éclairage blanc intense pour une séance destinée à une marque de bien-être. Quel choix sert le mieux l'intention ?", options:["L'éclairage blanc intense, plus neutre techniquement","L'éclairage chaud tamisé, cohérent avec une ambiance de détente","Le choix de lumière n'a aucune influence sur la perception"], correct:1 },
      { q:"Pourquoi dit-on qu'un(e) architecte ne travaille jamais sur une seule contrainte à la fois ?", options:["Parce qu'il/elle doit concilier esthétique, solidité, usage et budget simultanément","Parce que la loi l'interdit","Ce n'est pas vrai, un(e) architecte ne pense qu'à l'esthétique"], correct:0 }
    ]
  },
  commerce: {
    lecons:[
      { titre:"Vendre, c'est résoudre un problème, pas convaincre à tout prix",
        definition:"La vente consultative est une approche commerciale qui consiste à comprendre en profondeur le besoin d'un client avant de lui proposer une solution, plutôt que d'argumenter en faveur d'un produit dès le premier échange.",
        contenu:[
          "Un bon commercial ne cherche pas à imposer son produit : il commence par comprendre le besoin réel de la personne en face de lui, ses contraintes, ses hésitations. Ce n'est qu'ensuite qu'il montre en quoi son offre y répond concrètement.",
          "Cette approche, parfois appelée « vente consultative », prend plus de temps au départ mais construit une relation de confiance qui dure — un client convaincu par la pression achète une fois ; un client convaincu par la pertinence revient et recommande.",
          "Cette méthode s'appuie sur l'écoute active et sur des questions ouvertes (« qu'est-ce qui vous freine aujourd'hui ? ») plutôt que sur un argumentaire récité de façon identique à chaque client, quel que soit son besoin réel." ],
        exemple:"Face à un client hésitant sur le prix d'un logiciel de gestion, un commercial formé à la vente consultative demande d'abord quels problèmes concrets le client cherche à résoudre, puis montre précisément comment le logiciel y répond — plutôt que de simplement répéter la liste des fonctionnalités.",
        note:"Multiplier les arguments génériques sans avoir identifié le besoin réel du client est une erreur fréquente : elle donne l'impression d'un discours commercial impersonnel, qui inspire moins confiance qu'une écoute sincère.",
        pointscles:["La vente consultative part du besoin du client, pas du produit à écouler.","Une relation de confiance construite dans la durée vaut plus qu'une vente ponctuelle sous pression.","Les questions ouvertes révèlent souvent des besoins que le client n'aurait pas formulés spontanément."] },
      { titre:"Le budget : un outil de décision, pas un simple contrôle",
        definition:"Un budget est un plan chiffré qui répartit des ressources limitées entre différentes priorités, dans le but d'orienter les décisions plutôt que de seulement limiter les dépenses.",
        contenu:[
          "Gérer un budget ne consiste pas seulement à limiter les dépenses : c'est décider, avec des ressources limitées, où investir en priorité pour faire grandir une activité — dans le stock, dans la publicité, dans une nouvelle embauche.",
          "Une bonne gestion budgétaire distingue les dépenses qui produisent un retour (investissement) de celles qui n'en produisent pas (charges fixes) — c'est cette distinction qui permet de faire les bons arbitrages quand les moyens sont limités, ce qui est presque toujours le cas au démarrage d'une activité.",
          "Un budget se révise aussi régulièrement : les priorités d'une activité en croissance changent avec le temps, et s'accrocher à un plan initial figé, sans jamais l'ajuster aux résultats observés, mène souvent à des décisions dépassées." ],
        exemple:"Une petite entreprise dispose d'un excédent inattendu en fin de trimestre. Plutôt que de le dépenser sans plan, elle compare l'impact attendu d'un investissement en publicité contre celui d'une nouvelle embauche, et alloue les fonds à l'option qui sert le mieux ses priorités du moment.",
        note:"Considérer un budget comme une simple limite à ne pas dépasser, sans jamais l'utiliser pour arbitrer entre priorités, revient à se priver de son intérêt principal : orienter la décision.",
        pointscles:["Un budget sert à décider où investir, pas seulement à limiter les dépenses.","Distinguer investissement et charge fixe éclaire les priorités.","Un budget doit être révisé régulièrement, pas figé une fois pour toutes."] },
      { titre:"Entreprendre : identifier un besoin avant d'avoir une idée",
        definition:"L'entrepreneuriat rigoureux consiste à vérifier qu'un besoin réel existe chez des clients potentiels avant de construire une solution, plutôt que de partir d'une idée qui plaît d'abord à son créateur.",
        contenu:[
          "Beaucoup de nouvelles activités échouent parce qu'elles partent d'une idée qui plaît à son créateur, plutôt que d'un besoin réel observé chez des clients potentiels. Un entrepreneur rigoureux commence par vérifier, sur le terrain, que le problème qu'il veut résoudre existe vraiment et que les gens sont prêts à payer pour le résoudre.",
          "Cette vérification peut se faire à petite échelle, avant d'investir beaucoup de moyens : proposer une version simple du produit ou du service à un petit groupe de clients, observer leurs réactions réelles, puis ajuster. C'est souvent plus utile qu'un long plan d'affaires écrit sans jamais avoir parlé à un client.",
          "Cette approche progressive permet aussi d'apprendre à moindre coût : mieux vaut découvrir qu'une idée ne fonctionne pas après avoir investi une semaine et un petit budget, qu'après y avoir consacré une année entière et toutes ses économies." ],
        exemple:"Avant de lancer un service de livraison de repas dans une nouvelle ville, un entrepreneur teste la demande en proposant le service à une trentaine de clients pendant deux semaines, sans investir dans une flotte de véhicules — les retours confirment ou non l'intérêt réel avant tout investissement lourd.",
        note:"Rédiger un plan d'affaires détaillé de plusieurs dizaines de pages avant d'avoir parlé à un seul client potentiel est une erreur fréquente qui retarde la vérification de l'hypothèse la plus importante : le besoin existe-t-il vraiment ?",
        pointscles:["Vérifier qu'un besoin existe réellement précède toute construction de solution.","Tester à petite échelle coûte moins cher que d'investir massivement sans validation.","Un échec rapide et peu coûteux est plus utile qu'un succès supposé jamais vérifié."] }
    ],
    exercices:[
      { q:"Qu'est-ce que la 'vente consultative' ?", options:["Vendre en insistant fortement jusqu'à ce que le client craque","Comprendre le besoin du client avant de proposer une solution adaptée","Baisser systématiquement les prix"], correct:1, explication:"Elle part du besoin du client, pas de la pression du vendeur." },
      { q:"Pourquoi distinguer investissement et charge fixe dans un budget ?", options:["Ça n'a pas d'importance réelle","Pour savoir où l'argent produit un retour et où il ne fait que maintenir l'activité","Pour payer moins d'impôts uniquement"], correct:1, explication:"Cette distinction guide les priorités quand les ressources sont limitées." },
      { q:"Avant de lancer une activité, que doit d'abord vérifier un entrepreneur rigoureux ?", options:["Que son idée lui plaît personnellement","Que le besoin qu'il veut résoudre existe réellement chez des clients potentiels","Que la concurrence n'existe pas du tout"], correct:1, explication:"Une idée séduisante sans besoin réel derrière échoue presque toujours." },
      { q:"Le rôle principal du marketing est de...", options:["Fixer les salaires des employés","Faire connaître une offre et donner envie d'y répondre auprès des bonnes personnes","Gérer uniquement la comptabilité"], correct:1, explication:"Le marketing prépare le terrain avant la vente elle-même." },
      { q:"Pourquoi tester une activité à petite échelle avant d'investir massivement ?", options:["Pour apprendre à moindre coût si l'hypothèse de départ est valide","Parce que c'est une obligation légale","Ça n'apporte rien de plus qu'un grand lancement direct"], correct:0, explication:"Un test limité permet de vérifier une hypothèse sans risquer l'ensemble des ressources disponibles." },
      { q:"Un(e) logisticien(ne) en import-export s'occupe principalement de...", options:["Organiser le transport, le stockage et la circulation des marchandises entre pays","Uniquement vendre en boutique","Gérer les ressources humaines d'une entreprise"], correct:0, explication:"La logistique internationale est au cœur de ce métier, distinct de la vente directe." }
    ],
    examen:[
      { q:"Cas pratique — Un(e) commercial(e) fait face à un client hésitant sur le prix. Quelle approche illustre le mieux la vente consultative ?", options:["Baisser immédiatement le prix sans discussion","Comprendre ce qui motive l'hésitation avant de proposer un ajustement ou une alternative pertinente","Passer immédiatement au client suivant"], correct:1 },
      { q:"Un budget bien géré permet avant tout de...", options:["Ne jamais dépenser d'argent","Orienter les ressources limitées vers les priorités qui font grandir l'activité","Payer les impôts en premier systématiquement"], correct:1 },
      { q:"Cas pratique — Un(e) entrepreneur(se) veut lancer un service de livraison de repas dans une ville qu'il/elle ne connaît pas bien. Quelle est la première étape la plus rigoureuse ?", options:["Investir immédiatement dans une flotte de véhicules","Tester la demande réelle à petite échelle avant d'investir massivement","Copier exactement un concurrent d'une autre ville"], correct:1 },
      { q:"Que signifie 'gérer' une équipe, au sens professionnel ?", options:["Donner des ordres sans échanger avec l'équipe","Organiser les ressources humaines et matérielles vers un objectif commun, en tenant compte des personnes","Ne jamais déléguer de responsabilité"], correct:1 },
      { q:"Pourquoi un(e) gestionnaire distingue-t-il/elle les charges fixes des charges variables ?", options:["Pour mieux anticiper l'évolution des coûts selon l'activité de l'entreprise","Cette distinction n'a pas d'utilité pratique","Uniquement pour des raisons légales obligatoires"], correct:0 },
      { q:"Le rôle d'un(e) chargé(e) marketing diffère de celui d'un(e) commercial(e) principalement parce que...", options:["Le marketing prépare le terrain (image, notoriété, désir) en amont, le commercial conclut la vente en aval","Ce sont exactement les mêmes tâches","Le marketing ne concerne que les grandes entreprises"], correct:0 },
      { q:"Cas pratique — Un(e) chargé(e) de clientèle bancaire reçoit un client souhaitant un prêt pour un projet mal défini. Quelle est l'approche la plus professionnelle ?", options:["Accorder le prêt rapidement pour ne pas perdre le client","Clarifier avec le client la nature précise du projet et sa capacité de remboursement avant toute décision","Refuser systématiquement les projets mal définis sans discussion"], correct:1 },
      { q:"Pourquoi un échec rapide et peu coûteux est-il présenté comme préférable à un succès jamais vérifié ?", options:["Parce qu'il permet d'apprendre vite sans avoir englouti toutes ses ressources","Parce que l'échec est toujours souhaitable en entrepreneuriat","Ce n'est pas vraiment un principe utile"], correct:0 }
    ]
  },
  agriculture: {
    lecons:[
      { titre:"Le sol et le climat, un capital à comprendre avant d'exploiter",
        definition:"L'agronomie est la science qui étudie les conditions (sol, climat, eau) nécessaires à une production agricole efficace et durable, en amont de tout acte de culture.",
        contenu:[
          "Avant de cultiver quoi que ce soit, un agronome étudie la nature du sol (sa composition, sa capacité à retenir l'eau, son acidité), le climat local et les cycles saisonniers. Une bonne récolte dépend d'abord de cette compréhension fine, bien avant l'effort physique fourni.",
          "Cultiver une plante mal adaptée à un sol ou un climat donné épuise les ressources sans garantir de résultat — c'est pourquoi le conseil agronomique (choisir la bonne variété, la bonne période, la bonne rotation des cultures) a souvent plus d'impact sur le rendement final que l'ajout d'engrais ou de main-d'œuvre supplémentaire.",
          "Cette analyse initiale permet aussi d'anticiper les risques : un sol qui retient mal l'eau annonce un risque de sécheresse pour certaines cultures, tandis qu'un sol trop argileux annonce un risque d'excès d'eau — ces risques se préviennent avant la plantation, rarement après." ],
        exemple:"Avant de conseiller une culture de maïs sur une parcelle donnée, un agronome analyse d'abord la texture du sol et la pluviométrie moyenne de la saison à venir ; si le sol retient mal l'eau, il peut recommander une variété plus résistante à la sécheresse plutôt que la variété la plus productive en conditions idéales.",
        note:"Choisir une culture uniquement parce qu'elle est rentable ailleurs, sans vérifier son adéquation avec le sol et le climat local, est une erreur fréquente qui mène à des rendements décevants malgré un travail important.",
        pointscles:["Le sol et le climat déterminent la réussite d'une culture avant même le travail fourni.","Le conseil agronomique a souvent plus d'impact que l'ajout d'intrants.","Anticiper les risques liés au sol évite des pertes coûteuses après la plantation."] },
      { titre:"Préserver pour continuer à produire demain",
        definition:"La durabilité agricole est l'ensemble des pratiques qui permettent de maintenir, voire d'améliorer, la capacité de production d'une terre sur le long terme, plutôt que de la maximiser à court terme au prix de son épuisement.",
        contenu:[
          "L'agriculture et l'environnement sont profondément liés : épuiser un sol par une culture intensive répétée, ou détruire une forêt pour gagner des terres cultivables à court terme, réduit ce que cette même terre pourra produire dans les années suivantes.",
          "Des pratiques comme la rotation des cultures, l'agroforesterie (associer arbres et cultures) ou la gestion raisonnée de l'eau permettent de concilier production et préservation sur le long terme. Les métiers de ce secteur pensent rarement à l'échelle d'une seule saison, mais à celle de plusieurs générations.",
          "Cette vision de long terme demande parfois d'accepter un rendement légèrement inférieur à court terme pour préserver la capacité de production future — un arbitrage qui n'est pas toujours intuitif quand les besoins immédiats sont pressants." ],
        exemple:"Une coopérative agricole choisit de laisser reposer une parcelle une saison sur quatre plutôt que de la cultiver en continu : le rendement immédiat est légèrement réduit, mais la fertilité du sol se maintient sur quinze ans, contrairement aux parcelles voisines cultivées sans interruption.",
        note:"Privilégier systématiquement le rendement maximal immédiat, sans jamais laisser un sol se régénérer, est une pratique qui produit de bons résultats à court terme mais compromet la production des années suivantes.",
        pointscles:["Épuiser une ressource aujourd'hui réduit ce qu'elle pourra produire demain.","La rotation des cultures et l'agroforesterie concilient production et préservation.","Les métiers agricoles pensent souvent à l'échelle de plusieurs générations, pas d'une seule saison."] },
      { titre:"De la production à la chaîne complète : élevage, pêche et transformation",
        definition:"La chaîne de valeur agricole regroupe l'ensemble des étapes, de la production initiale jusqu'à la transformation et la distribution, qui déterminent la valeur économique finale d'un produit agricole.",
        contenu:[
          "L'agriculture ne se limite pas aux cultures végétales : l'élevage, la médecine vétérinaire, la pêche et l'aquaculture en font pleinement partie, avec leurs propres exigences de suivi sanitaire et de gestion des ressources naturelles.",
          "Une grande partie de la valeur de ce secteur se joue aussi après la récolte : transport, stockage, transformation en produits finis. Un secteur qui perd une part importante de sa production faute de transformation ou de stockage adapté perd une opportunité économique majeure, ce qui rend ces métiers tout aussi stratégiques que la production elle-même.",
          "Investir dans la transformation locale (par exemple sécher, transformer ou conditionner un produit plutôt que de le vendre brut) permet souvent de capter une valeur économique bien supérieure à celle de la seule production, tout en créant des emplois supplémentaires dans la chaîne." ],
        exemple:"Une coopérative qui vendait ses tomates brutes, sujettes à 20% de pertes faute de stockage, investit dans une petite unité de transformation en concentré de tomate : les pertes disparaissent presque totalement et le produit transformé se vend à un prix bien supérieur à la tomate brute.",
        note:"Se concentrer uniquement sur l'augmentation du volume produit, sans investir dans le stockage ou la transformation, conduit souvent à perdre une part significative de la valeur créée par ce même volume supplémentaire.",
        pointscles:["L'agriculture inclut élevage, pêche et aquaculture, pas seulement les cultures végétales.","Le stockage et la transformation après récolte représentent une part stratégique de la valeur économique.","Transformer localement un produit capte souvent plus de valeur que de le vendre brut."] }
    ],
    exercices:[
      { q:"Pourquoi étudier le sol avant de cultiver ?", options:["Ce n'est pas vraiment utile si on a de bonnes graines","Pour choisir des cultures adaptées et éviter d'épuiser les ressources inutilement","Uniquement pour des raisons esthétiques"], correct:1, explication:"Une culture inadaptée au sol échoue même avec beaucoup d'efforts." },
      { q:"Qu'est-ce que l'agroforesterie ?", options:["Une pratique qui associe arbres et cultures pour concilier production et préservation","Une technique pour éliminer tous les arbres d'un champ","Un type de machine agricole"], correct:0, explication:"Elle combine les bénéfices des arbres (ombre, sol, biodiversité) avec la culture." },
      { q:"Quel métier s'occupe spécifiquement de la santé des animaux d'élevage ?", options:["Le vétérinaire","Le commercial","Le designer graphique"], correct:0, explication:"Le vétérinaire est spécifiquement formé au suivi sanitaire animal." },
      { q:"Pourquoi le stockage et la transformation après récolte sont-ils stratégiques ?", options:["Ils n'ont aucun impact économique réel","Une production perdue faute de stockage adapté représente une perte économique évitable","Ils concernent uniquement les grandes entreprises internationales"], correct:1, explication:"Une bonne conservation transforme une perte évitable en revenu réel." },
      { q:"Pourquoi accepter un rendement légèrement inférieur à court terme peut-il être une décision agronomique raisonnable ?", options:["Pour préserver la capacité de production du sol sur le long terme","Ça n'a jamais de justification valable","Uniquement pour respecter une mode agricole"], correct:0, explication:"Préserver la fertilité du sol garantit une production stable sur de nombreuses années." },
      { q:"Un(e) apiculteur(rice) exerce un métier lié à...", options:["L'élevage d'abeilles pour la production de miel et la pollinisation","La pêche en haute mer","La transformation industrielle du bois"], correct:0, explication:"L'apiculture est une branche spécifique de l'élevage, essentielle aussi à la pollinisation des cultures." }
    ],
    examen:[
      { q:"Cas pratique — Un sol argileux retient beaucoup l'eau et se draine mal. Quelle décision agronomique est la plus cohérente ?", options:["Cultiver une plante qui tolère un sol détrempé, ou améliorer le drainage avant de cultiver une plante sensible à l'excès d'eau","Ignorer cette caractéristique et planter n'importe quelle culture","Ajouter uniquement plus d'engrais pour compenser"], correct:0 },
      { q:"La rotation des cultures sert principalement à...", options:["Rendre le travail plus varié pour l'agriculteur uniquement","Éviter l'épuisement du sol et limiter certaines maladies ou parasites qui s'installent avec une culture répétée","Réduire le nombre d'outils nécessaires"], correct:1 },
      { q:"Cas pratique — Une coopérative agricole perd chaque année 20% de sa récolte de tomates faute de moyens de conservation. Quelle action aurait le plus d'impact économique ?", options:["Produire encore plus de tomates sans rien changer d'autre","Investir dans une capacité de stockage ou de transformation (conserverie, séchage) adaptée","Réduire la surface cultivée"], correct:1 },
      { q:"Le rôle d'un(e) ingénieur(e) agricole se distingue de celui d'un(e) agronome surtout par...", options:["Une approche plus technique et mécanisée des systèmes de production, en complément de l'expertise agronomique","Une interdiction de travailler avec des agronomes","L'absence totale de lien avec le terrain"], correct:0 },
      { q:"Pourquoi la préservation de l'environnement est-elle un enjeu direct pour l'agriculture, et pas seulement une question écologique séparée ?", options:["Un environnement dégradé (sol épuisé, eau polluée, déforestation) réduit directement la capacité de production future","Ce sont deux sujets totalement indépendants","La préservation ne concerne que la faune sauvage, pas les cultures"], correct:0 },
      { q:"Un(e) spécialiste environnement intervenant sur un projet agricole a pour rôle principal de...", options:["Interdire systématiquement toute activité agricole","Évaluer et limiter l'impact des pratiques agricoles sur les ressources naturelles à long terme","S'occuper uniquement de la comptabilité du projet"], correct:1 },
      { q:"Cas pratique — Un projet aquacole souhaite s'installer sur une zone côtière très fréquentée par la pêche traditionnelle. Quelle démarche est la plus rigoureuse avant le lancement ?", options:["Démarrer directement l'activité sans concertation","Évaluer l'impact sur les ressources halieutiques locales et échanger avec les pêcheurs traditionnels avant de s'installer","Ignorer les pêcheurs, l'aquaculture étant prioritaire"], correct:1 },
      { q:"Pourquoi la transformation locale d'un produit agricole capte-t-elle souvent plus de valeur que sa vente brute ?", options:["Parce que le produit transformé se vend généralement plus cher et se conserve mieux","Parce que la transformation est toujours gratuite","Ce n'est en réalité pas le cas en pratique"], correct:0 }
    ]
  },
  education: {
    lecons:[
      { titre:"Enseigner, c'est adapter, pas seulement transmettre",
        definition:"La différenciation pédagogique est la pratique qui consiste à adapter les méthodes d'enseignement aux besoins spécifiques de chaque élève, plutôt que d'appliquer une méthode unique à tout un groupe.",
        contenu:[
          "Un bon enseignant ne répète pas la même explication de la même façon à tout le monde : il observe où chaque élève bloque et ajuste sa méthode — un exemple concret pour l'un, un schéma pour l'autre, une manipulation physique pour un troisième. Cette adaptation s'appelle la différenciation pédagogique.",
          "Cela demande de bien connaître la matière enseignée, mais tout autant de bien observer les élèves : leurs difficultés ne viennent pas toujours d'un manque d'effort, mais souvent d'une explication qui ne correspond pas à leur façon de comprendre à ce moment précis.",
          "Cette approche ne signifie pas créer un programme totalement différent pour chaque élève : il s'agit plutôt de proposer plusieurs chemins possibles vers un même objectif d'apprentissage, et d'observer lequel fonctionne le mieux pour qui." ],
        exemple:"Face à une classe qui peine sur les fractions, un enseignant reprend la notion avec un support visuel (un gâteau partagé) pour certains élèves, un exercice manipulable (des jetons à regrouper) pour d'autres, et un exemple numérique pur pour ceux qui sont déjà à l'aise avec l'abstraction.",
        note:"Considérer qu'un élève qui ne comprend pas « ne travaille pas assez » sans jamais interroger la méthode d'explication utilisée est une erreur fréquente qui peut décourager durablement l'élève.",
        pointscles:["Les difficultés d'apprentissage viennent souvent de la méthode, pas seulement de l'effort fourni.","Différencier ne veut pas dire créer un programme séparé pour chacun, mais proposer plusieurs chemins.","Observer précisément où un élève bloque oriente le bon ajustement pédagogique."] },
      { titre:"Orienter sans décider à la place de l'autre",
        definition:"L'orientation scolaire et professionnelle est l'accompagnement qui aide une personne à mieux comprendre ses intérêts et contraintes réelles afin de choisir elle-même sa voie, sans qu'un tiers ne décide à sa place.",
        contenu:[
          "Le rôle d'un(e) conseiller(ère) d'orientation n'est pas de dire à quelqu'un quel métier choisir, mais de l'aider à mieux comprendre ses propres intérêts, ses valeurs et ses contraintes réelles, pour qu'il ou elle puisse décider en connaissance de cause.",
          "C'est une nuance importante dans des contextes où la pression sociale ou familiale pousse souvent vers certains métiers jugés « sûrs » : un accompagnement de qualité aide la personne à distinguer ce qu'elle veut vraiment de ce qu'on attend d'elle, sans lui imposer une troisième voie à la place.",
          "Un bon accompagnement s'appuie aussi sur des informations concrètes (débouchés réels, conditions de travail, parcours nécessaires) plutôt que sur des impressions générales, pour que le choix final repose sur des faits vérifiables autant que sur l'envie." ],
        exemple:"Un(e) conseiller(ère) d'orientation reçoit un élève passionné par un métier jugé « peu sérieux » par sa famille : plutôt que de trancher, il/elle aide l'élève à explorer concrètement les débouchés réels de ce métier, ses contraintes et ses perspectives, pour que la décision finale repose sur des informations solides.",
        note:"Orienter quelqu'un uniquement en fonction de ses résultats scolaires, sans jamais explorer ses intérêts réels, est une erreur fréquente qui mène parfois à des choix de carrière subis plutôt que choisis.",
        pointscles:["Orienter, c'est éclairer un choix, pas décider à la place de la personne.","La pression sociale ou familiale peut brouiller la distinction entre envie réelle et attente extérieure.","Un accompagnement solide s'appuie sur des informations concrètes sur les débouchés et parcours réels."] },
      { titre:"Former des adultes : une pédagogie différente de celle des enfants",
        definition:"L'andragogie est l'ensemble des principes pédagogiques adaptés à la formation des adultes, qui diffèrent de ceux utilisés pour l'enseignement scolaire classique des enfants.",
        contenu:[
          "Former des adultes en reconversion ou en perfectionnement professionnel demande une approche différente de l'enseignement scolaire classique : les adultes apprennent mieux quand ils comprennent immédiatement l'utilité concrète de ce qu'ils apprennent, et qu'ils peuvent s'appuyer sur leur expérience déjà acquise.",
          "C'est le rôle du/de la formateur(rice) professionnel(le), un métier distinct de celui d'enseignant, centré sur des compétences pratiques et rapidement mobilisables plutôt que sur un programme scolaire à suivre sur plusieurs années.",
          "Cette pédagogie s'appuie souvent sur des mises en situation proches du contexte professionnel réel de l'apprenant, plutôt que sur des exercices abstraits, ce qui facilite le transfert direct des compétences vers le poste de travail visé." ],
        exemple:"Un centre de formation pour adultes en reconversion vers un métier technique organise ses sessions autour de cas concrets tirés de situations professionnelles réelles, plutôt que de cours théoriques longs, pour que chaque participant puisse relier immédiatement ce qu'il apprend à son futur poste.",
        note:"Appliquer aux adultes les mêmes méthodes qu'à des enfants scolarisés (cours magistraux longs, peu de mise en pratique) est une erreur fréquente qui réduit fortement l'engagement et l'efficacité de la formation.",
        pointscles:["Les adultes apprennent mieux quand l'utilité concrète de l'apprentissage est immédiatement visible.","L'expérience déjà acquise par l'adulte est une ressource pédagogique à mobiliser, pas à ignorer.","Les mises en situation proches du contexte réel favorisent le transfert direct des compétences."] }
    ],
    exercices:[
      { q:"Qu'est-ce que la différenciation pédagogique ?", options:["Donner le même cours à tous sans exception","Adapter sa méthode d'explication selon les besoins de chaque élève","Noter les élèves plus sévèrement"], correct:1, explication:"Elle part du principe que chacun peut avoir besoin d'un chemin différent vers la même compréhension." },
      { q:"Quel est le principal risque d'une orientation qui impose un choix plutôt que d'accompagner ?", options:["Aucun risque particulier","Pousser la personne vers un métier qui ne lui correspond pas vraiment, par pression plutôt que par choix éclairé","Cela accélère toujours la réussite"], correct:1, explication:"Un choix imposé n'est pas un choix éclairé — il risque d'être abandonné plus tard." },
      { q:"Pourquoi la formation professionnelle pour adultes diffère-t-elle de l'enseignement scolaire classique ?", options:["Les adultes apprennent mieux avec un contenu directement utile et lié à leur expérience","Les adultes n'ont pas besoin de pédagogie du tout","C'est exactement la même approche"], correct:0, explication:"L'utilité immédiate soutient la motivation des adultes en formation." },
      { q:"Le rôle d'un(e) directeur(rice) d'établissement scolaire inclut principalement...", options:["Uniquement donner des cours","Organiser le fonctionnement de l'école et accompagner les équipes pédagogiques","Remplacer les parents des élèves"], correct:1, explication:"C'est un rôle de coordination et de gestion, distinct de l'enseignement en classe." },
      { q:"Pourquoi un accompagnement d'orientation s'appuie-t-il sur des informations concrètes plutôt que sur des impressions ?", options:["Pour que la décision finale repose sur des faits vérifiables, pas seulement des ressentis","Les impressions sont toujours plus fiables","Ce n'est pas vraiment nécessaire"], correct:0, explication:"Les faits vérifiables (débouchés, conditions réelles) équilibrent l'enthousiasme initial et évitent les désillusions." },
      { q:"Le métier de bibliothécaire/documentaliste dans un contexte scolaire consiste avant tout à...", options:["Organiser et faciliter l'accès à l'information pour les élèves et enseignants","Uniquement surveiller une salle de lecture","Remplacer les enseignants en cas d'absence"], correct:0, explication:"C'est un rôle de médiation entre les ressources documentaires et les besoins pédagogiques." }
    ],
    examen:[
      { q:"Cas pratique — Un élève comprend bien à l'oral mais échoue systématiquement aux exercices écrits similaires. Quelle est l'hypothèse pédagogique la plus utile à explorer en premier ?", options:["L'élève ne travaille pas assez, un point c'est tout","Le format écrit pose peut-être un obstacle spécifique (rédaction, mise en page de la réponse) indépendant de la compréhension du fond","Il faut immédiatement redoubler l'élève"], correct:1 },
      { q:"La pédagogie différenciée repose sur le principe que...", options:["Tous les élèves apprennent exactement de la même façon","Les élèves peuvent avoir besoin d'approches différentes pour atteindre un même objectif d'apprentissage","Il faut créer un programme totalement différent pour chaque élève individuellement"], correct:1 },
      { q:"Cas pratique — Un(e) conseiller(ère) d'orientation reçoit un élève passionné par un métier jugé « peu sérieux » par sa famille. Quelle posture est la plus professionnelle ?", options:["Convaincre l'élève de changer d'avis pour rassurer la famille","Aider l'élève à clarifier ses propres motivations et explorer concrètement les réalités du métier, sans décider à sa place","Refuser de discuter du sujet"], correct:1 },
      { q:"Pourquoi dit-on que la formation professionnelle pour adultes doit être 'immédiatement utile' ?", options:["Les adultes en reconversion ont besoin de voir rapidement le lien entre l'apprentissage et leur objectif, ce qui soutient leur motivation","Ce n'est qu'une préférence sans réel impact pédagogique","Les adultes apprennent uniquement par la théorie"], correct:0 },
      { q:"Le métier de bibliothécaire/documentaliste dans un contexte éducatif consiste avant tout à...", options:["Organiser et faciliter l'accès à l'information et aux ressources documentaires pour les apprenants","Uniquement surveiller une salle de lecture","Remplacer les enseignants"], correct:0 },
      { q:"Le développement de l'éducation contribue au développement économique d'un pays surtout parce que...", options:["Elle forme les compétences dont l'économie de demain aura besoin","Elle occupe simplement le temps des jeunes","Il n'existe aucun lien démontré entre les deux"], correct:0 },
      { q:"Cas pratique — Un centre de formation pour adultes propose un cours théorique de trois heures sans aucune mise en situation pratique. Quel est le principal risque pédagogique ?", options:["Aucun risque, la théorie suffit toujours aux adultes","Une baisse d'engagement et une difficulté à transférer l'apprentissage vers le contexte professionnel réel","Le cours sera nécessairement trop court"], correct:1 },
      { q:"Pourquoi dit-on qu'un choix d'orientation reposant uniquement sur les résultats scolaires peut être risqué ?", options:["Parce que les résultats scolaires ne reflètent pas toujours les intérêts réels ni les compétences pratiques d'une personne","Parce que les résultats scolaires sont toujours faux","Ce n'est pas un risque réel"], correct:0 }
    ]
  },
  ingenierie: {
    lecons:[
      { titre:"Concevoir, c'est anticiper ce qui peut céder",
        definition:"Le calcul de sécurité en ingénierie est la démarche qui consiste à estimer, avant construction, les charges et contraintes qu'une structure devra supporter, en y ajoutant une marge pour absorber les écarts entre théorie et réalité.",
        contenu:[
          "Un(e) ingénieur(e) ne construit jamais « à vue de nez » : il/elle calcule à l'avance les charges, les contraintes de température, l'usure dans le temps, pour s'assurer que la structure ou la machine tiendra dans des conditions réelles d'utilisation, y compris les cas extrêmes prévisibles.",
          "Ces calculs de sécurité intègrent volontairement des marges — on ne construit jamais « juste assez solide », mais avec une réserve de résistance, car les conditions réelles varient toujours un peu par rapport aux hypothèses de calcul initiales.",
          "Cette marge de sécurité n'est pas un simple excès de prudence : elle absorbe des facteurs qu'on ne peut jamais anticiper parfaitement — variations de qualité des matériaux, usage plus intensif que prévu, événements climatiques exceptionnels." ],
        exemple:"Un pont conçu pour supporter le passage simultané de camions est calculé avec une marge de sécurité qui lui permet de résister à une charge bien supérieure à celle réellement attendue en usage normal, pour absorber les variations imprévues de trafic ou de conditions climatiques.",
        note:"Calculer une structure pour qu'elle tienne « tout juste » à la charge maximale attendue, sans aucune marge supplémentaire, est une pratique dangereuse : la moindre variation imprévue peut alors suffire à provoquer une défaillance.",
        pointscles:["Les calculs de sécurité intègrent volontairement une marge au-delà du besoin théorique.","Cette marge absorbe les écarts inévitables entre hypothèses de calcul et conditions réelles.","Une structure calculée sans marge est une structure fragile face à l'imprévu."] },
      { titre:"La précision : une discipline qui se travaille",
        definition:"La précision technique en ingénierie est la capacité à respecter des tolérances de mesure très strictes, acquise par une habitude systématique de vérification plutôt que par un talent inné.",
        contenu:[
          "En ingénierie, un écart de quelques millimètres peut empêcher deux pièces de s'assembler correctement, ou fragiliser un ensemble censé résister à de fortes contraintes. Cette exigence de précision n'est pas un talent inné : c'est une habitude de vérification systématique qui se construit avec la pratique et les erreurs corrigées.",
          "C'est pourquoi les métiers d'ingénierie s'appuient énormément sur des normes et des procédures de contrôle qualité : elles ne remplacent pas le jugement de l'ingénieur, mais elles évitent que la fatigue ou la routine ne fassent passer une erreur inaperçue.",
          "Cette rigueur s'applique à toutes les échelles : de la conception théorique sur plan jusqu'à la fabrication concrète des pièces, chaque étape doit respecter les tolérances définies, sous peine de reporter le problème — souvent amplifié — sur l'étape suivante." ],
        exemple:"Deux pièces mécaniques conçues par des équipes différentes doivent s'emboîter parfaitement : un protocole de contrôle qualité vérifie systématiquement chaque pièce fabriquée par rapport aux tolérances définies sur le plan, avant même l'étape d'assemblage, pour détecter tout écart avant qu'il ne cause un problème plus coûteux à corriger.",
        note:"Considérer les contrôles qualité comme une perte de temps face à des délais serrés est une erreur fréquente qui peut coûter beaucoup plus cher lorsque le défaut est détecté trop tard, une fois l'assemblage réalisé.",
        pointscles:["La précision est une habitude de vérification systématique, pas un don réservé à quelques-uns.","Les normes de contrôle qualité compensent les limites de l'attention humaine sur la durée.","Un écart non détecté tôt se répercute et s'amplifie souvent aux étapes suivantes."] },
      { titre:"Des infrastructures civiles à l'industrie : un secteur très large",
        definition:"L'ingénierie regroupe un ensemble de métiers très divers (civil, mécanique, énergie, industriel) qui partagent une même méthode de raisonnement technique appliquée à des systèmes différents.",
        contenu:[
          "L'ingénierie couvre des réalités très différentes : un(e) ingénieur(e) civil(e) conçoit des routes, ponts ou bâtiments ; un(e) technicien(ne) industriel(le) fait fonctionner et entretient des lignes de production ; un(e) ingénieur(e) énergie conçoit des systèmes de production ou de distribution d'électricité.",
          "Ce qui relie ces métiers, au-delà de leurs domaines très différents, c'est une même façon de raisonner : comprendre un système technique, anticiper ses limites, et l'améliorer de façon mesurable plutôt qu'intuitive.",
          "Cette diversité signifie aussi qu'un parcours d'ingénieur peut évoluer d'une spécialité à une autre au cours d'une carrière : les fondations méthodologiques (calcul, modélisation, contrôle qualité) restent transférables d'un domaine technique à un autre." ],
        exemple:"Un(e) ingénieur(e) formé(e) au génie civil peut, après quelques années, se réorienter vers l'ingénierie énergétique : la méthode de raisonnement (modéliser un système, calculer ses limites, vérifier sa fiabilité) reste largement transférable, même si les connaissances techniques spécifiques doivent être complétées.",
        note:"Penser que les différentes branches de l'ingénierie sont totalement cloisonnées et sans passerelle possible est une idée reçue qui sous-estime la transférabilité des méthodes de raisonnement technique.",
        pointscles:["L'ingénierie couvre des domaines très variés reliés par une même méthode de raisonnement.","Comprendre, anticiper les limites et améliorer un système technique est le socle commun du métier.","Les compétences méthodologiques restent souvent transférables d'une spécialité à une autre."] }
    ],
    exercices:[
      { q:"Pourquoi intègre-t-on une marge de sécurité dans les calculs d'ingénierie ?", options:["Pour rassurer inutilement le client","Parce que les conditions réelles varient toujours un peu par rapport aux hypothèses de calcul","Pour augmenter le prix du projet"], correct:1, explication:"La marge absorbe les écarts entre théorie et réalité." },
      { q:"La précision en ingénierie est avant tout...", options:["Un don inné que seules certaines personnes possèdent","Une habitude de vérification systématique qui se travaille avec la pratique","Sans importance si le projet fonctionne globalement"], correct:1, explication:"C'est une compétence qui se construit, pas un talent réservé à quelques-uns." },
      { q:"Quel métier s'occupe principalement de faire fonctionner et entretenir des machines de production ?", options:["Le technicien industriel","L'architecte","Le psychologue"], correct:0, explication:"C'est le cœur du métier de technicien(ne) industriel(le)." },
      { q:"Ce qui relie les différents métiers de l'ingénierie, au-delà de leurs domaines, c'est...", options:["Une même façon de raisonner : comprendre, anticiper les limites, améliorer un système technique","Le fait qu'ils utilisent tous les mêmes outils","Rien, ce sont des métiers totalement indépendants"], correct:0, explication:"La méthode de raisonnement technique est le vrai point commun, pas le domaine d'application." },
      { q:"Pourquoi un défaut de précision non détecté tôt coûte-t-il souvent plus cher plus tard ?", options:["Parce qu'il se répercute et s'amplifie souvent aux étapes suivantes de fabrication ou d'assemblage","Ce n'est pas vraiment vrai, le coût reste identique","Parce que la loi impose une amende systématique"], correct:0, explication:"Corriger un défaut après assemblage coûte presque toujours plus cher que le détecter en amont." },
      { q:"Un(e) ingénieur(e) mécanique s'occupe principalement de...", options:["Concevoir et faire fonctionner des systèmes mécaniques (moteurs, machines, structures mobiles)","Uniquement gérer des budgets d'entreprise","Enseigner les mathématiques"], correct:0, explication:"C'est une branche technique centrée sur les systèmes mécaniques, distincte du génie civil." }
    ],
    examen:[
      { q:"Cas pratique — Un pont est calculé pour supporter exactement le poids maximal attendu, sans aucune marge supplémentaire. Quel est le principal risque ?", options:["Aucun risque si le calcul est juste","Toute variation imprévue (surcharge ponctuelle, usure, erreur de calcul mineure) peut suffire à provoquer une défaillance","Le pont sera simplement plus cher"], correct:1 },
      { q:"Les normes et procédures de contrôle qualité en ingénierie servent principalement à...", options:["Ralentir les projets sans réel bénéfice","Réduire le risque qu'une erreur passe inaperçue à cause de la routine ou de la fatigue","Remplacer totalement le jugement de l'ingénieur"], correct:1 },
      { q:"Cas pratique — Deux pièces mécaniques conçues séparément ne s'assemblent pas correctement une fois fabriquées. Quelle est la cause la plus probable ?", options:["Un écart de précision dans les mesures ou la fabrication, même minime","Le hasard, sans cause identifiable","Un problème purement esthétique"], correct:0 },
      { q:"Un(e) ingénieur(e) civil(e) et un(e) ingénieur(e) énergie partagent avant tout...", options:["Une même méthode de raisonnement technique appliquée à des domaines différents","Exactement les mêmes tâches quotidiennes","Aucun point commun réel"], correct:0 },
      { q:"Pourquoi la maintenance préventive est-elle valorisée en ingénierie industrielle ?", options:["Elle coûte toujours plus cher que de réparer après la panne","Elle permet d'éviter des pannes coûteuses ou dangereuses en intervenant avant qu'elles ne surviennent","Elle n'a aucun effet mesurable"], correct:1 },
      { q:"La sécurité est centrale en ingénierie principalement parce que...", options:["La loi l'exige sans autre justification","Des vies humaines dépendent souvent directement de la solidité de ce qui est conçu et construit","Ce n'est en réalité pas un sujet prioritaire"], correct:1 },
      { q:"Cas pratique — Un projet industriel est en retard et l'équipe envisage de sauter une étape de contrôle qualité pour rattraper le planning. Quelle est la décision la plus rigoureuse ?", options:["Sauter l'étape, le planning étant prioritaire","Maintenir le contrôle qualité malgré le retard, car un défaut non détecté coûterait plus cher à corriger ensuite","Sauter le contrôle uniquement sur les pièces jugées 'simples'"], correct:1 },
      { q:"Pourquoi les compétences méthodologiques d'un(e) ingénieur(e) restent-elles souvent transférables d'une spécialité à une autre ?", options:["Parce que le raisonnement (modéliser, calculer les limites, vérifier la fiabilité) reste largement commun malgré des connaissances techniques différentes","Parce que toutes les spécialités d'ingénierie sont identiques","Ce n'est pas réellement le cas en pratique"], correct:0 }
    ]
  },
  psychologie: {
    lecons:[
      { titre:"Comprendre avant de juger",
        definition:"L'écoute active est une posture d'accompagnement qui consiste à mettre de côté son propre jugement pour comprendre en profondeur ce que vit réellement une personne, avant toute réaction ou conseil.",
        contenu:[
          "Un(e) psychologue ne dit jamais à quelqu'un ce qu'il devrait ressentir. La première étape de tout accompagnement est de comprendre pourquoi une personne réagit d'une certaine façon — souvent à cause d'une histoire personnelle, d'un contexte ou de mécanismes qu'on ne voit pas immédiatement de l'extérieur.",
          "Cette posture, appelée écoute active, demande de mettre de côté ses propres jugements le temps de l'échange, pour permettre à la personne de formuler elle-même ce qu'elle vit, plutôt que de recevoir une explication toute faite venue de l'extérieur.",
          "L'écoute active s'accompagne souvent de reformulations (« si je comprends bien, tu ressens... ») qui vérifient la compréhension du professionnel tout en aidant la personne à clarifier elle-même ce qu'elle traverse." ],
        exemple:"Face à une personne en colère après un conflit familial, un(e) psychologue ne dit pas immédiatement « tu as raison » ou « tu devrais te calmer » : il/elle explore d'abord ce qui, précisément, déclenche cette colère, avant d'aider la personne à formuler elle-même ce qu'elle ressent et pourquoi.",
        note:"Proposer une solution ou un jugement avant d'avoir vraiment compris la situation vécue par la personne est une erreur fréquente, même chez des professionnels expérimentés, qui peut donner le sentiment de ne pas être entendu.",
        pointscles:["L'écoute active suspend le jugement pour comprendre avant d'agir.","La reformulation aide à vérifier sa compréhension et à clarifier le vécu de l'autre.","Comprendre les causes d'une réaction précède toute tentative d'accompagnement utile."] },
      { titre:"Le secret professionnel, un pilier du métier",
        definition:"Le secret professionnel en psychologie est l'obligation de confidentialité qui protège tout ce qui est confié en séance, sauf danger grave et imminent pour la personne ou pour autrui.",
        contenu:[
          "Ce qui est confié à un(e) psychologue reste confidentiel, sauf danger grave et imminent pour la personne elle-même ou pour autrui. Cette règle n'est pas une simple formalité : c'est elle qui permet à quelqu'un de parler librement de ce qu'il vit, sans crainte que ce soit répété à son entourage.",
          "Cette confidentialité s'applique aussi face à la famille d'un patient adulte, ce qui peut parfois créer des incompréhensions : un proche inquiet peut vouloir des informations que le/la professionnel(le) ne peut légalement pas partager sans l'accord de la personne concernée.",
          "Le cadre de confidentialité doit être expliqué clairement dès le premier échange, y compris ses limites (danger grave), afin que la personne accompagnée sache précisément ce qui restera privé et dans quels cas exceptionnels ce ne serait pas le cas." ],
        exemple:"Le parent d'un patient adulte suivi en thérapie demande au/à la psychologue de lui résumer le contenu des séances : le/la professionnel(le) explique poliment que le secret professionnel l'en empêche, sauf accord explicite du patient, quelle que soit l'inquiétude légitime du parent.",
        note:"Céder ponctuellement à la pression d'un proche insistant, en pensant « faire une exception cette fois », fragilise durablement la confiance nécessaire à tout accompagnement psychologique.",
        pointscles:["Le secret professionnel protège la personne accompagnée, y compris face à sa famille.","Il ne peut être levé que dans des cas précis, définis à l'avance, jamais au cas par cas selon la pression.","Expliquer clairement ce cadre dès le début évite les incompréhensions ultérieures."] },
      { titre:"Des sciences humaines au monde du travail : des métiers variés",
        definition:"Les sciences humaines regroupent un ensemble de disciplines (psychologie, sociologie, travail social) qui étudient le comportement humain individuel et collectif, à des échelles et dans des contextes différents.",
        contenu:[
          "Les sciences humaines ne se limitent pas à la psychologie clinique : un(e) sociologue étudie le fonctionnement des groupes et des sociétés, un(e) travailleur(se) social(e) accompagne des personnes ou familles en difficulté au quotidien, et un(e) chargé(e) de ressources humaines applique ces mêmes compétences de compréhension humaine au sein d'une entreprise.",
          "Ce socle commun — comprendre les comportements, les besoins et les tensions humaines — explique pourquoi ces métiers, bien que différents dans leur cadre d'exercice, partagent souvent une même formation de base en sciences humaines.",
          "Ces métiers se distinguent surtout par l'échelle d'intervention : le/la psychologue travaille souvent à l'échelle de l'individu, le/la sociologue à l'échelle des groupes et structures sociales, et le/la chargé(e) RH à l'échelle d'une organisation professionnelle précise." ],
        exemple:"Une entreprise qui traverse une période de tensions internes peut faire appel à un(e) chargé(e) RH pour améliorer le dialogue au sein des équipes, tout en s'appuyant sur des principes proches de ceux qu'un(e) sociologue utiliserait pour analyser le fonctionnement d'un groupe social plus large.",
        note:"Réduire les sciences humaines à « discuter avec les gens », sans reconnaître leur base méthodologique rigoureuse (observation, entretiens structurés, analyse), est une idée reçue qui sous-estime la technicité réelle de ces métiers.",
        pointscles:["Les sciences humaines couvrent des échelles différentes : individu, groupe, organisation.","Elles partagent un socle méthodologique commun de compréhension du comportement humain.","Ce ne sont pas des métiers uniquement intuitifs : ils reposent sur des méthodes rigoureuses."] }
    ],
    exercices:[
      { q:"Qu'est-ce que l'écoute active ?", options:["Donner immédiatement son avis sur ce que la personne devrait faire","Mettre de côté son propre jugement pour comprendre ce que vit réellement la personne","Interrompre pour accélérer l'échange"], correct:1, explication:"Elle vise à comprendre avant de conseiller." },
      { q:"Le secret professionnel d'un(e) psychologue peut-il être levé pour informer la famille d'un patient adulte ?", options:["Toujours, la famille a un droit d'information","En principe non, sauf accord du patient ou danger grave","Seulement si la famille paie la consultation"], correct:1, explication:"Le secret protège le patient, y compris face à sa propre famille." },
      { q:"Quel métier étudie principalement le fonctionnement des groupes et sociétés humaines ?", options:["La sociologie","L'ingénierie civile","La botanique"], correct:0, explication:"La sociologie regarde le niveau collectif, pas seulement individuel." },
      { q:"Qu'est-ce qui relie les métiers de psychologue, travailleur(se) social(e) et chargé(e) RH ?", options:["Rien, ce sont des métiers totalement indépendants","Une compétence commune : comprendre les comportements et besoins humains, appliquée à des contextes différents","Ils exercent tous dans le même bâtiment"], correct:1, explication:"Le socle de compréhension humaine est partagé, même si le cadre d'exercice diffère." },
      { q:"Pourquoi la reformulation est-elle utilisée en écoute active ?", options:["Pour vérifier sa compréhension et aider la personne à clarifier son propre vécu","Pour gagner du temps sans réellement écouter","Pour contredire poliment la personne"], correct:0, explication:"Reformuler montre qu'on a compris et aide souvent la personne à préciser elle-même ce qu'elle ressent." },
      { q:"Le rôle d'un(e) coach professionnel(le) se distingue de celui d'un(e) psychologue notamment parce que...", options:["Le coaching se concentre sur des objectifs professionnels concrets, sans viser un accompagnement thérapeutique","Ce sont exactement le même métier avec un nom différent","Le coaching ne nécessite aucune méthode particulière"], correct:0, explication:"Le coaching cible des objectifs précis et opérationnels, distincts du travail thérapeutique." }
    ],
    examen:[
      { q:"Cas pratique — Une personne en détresse confie à son/sa psychologue qu'elle pense sérieusement à se faire du mal. Que doit faire le/la professionnel(le), malgré le secret professionnel ?", options:["Ne rien faire car le secret professionnel est absolu","Agir pour protéger la personne, y compris en alertant les services compétents si le danger est grave et imminent","Rassurer la personne sans autre action"], correct:1 },
      { q:"L'écoute active se distingue d'une simple conversation par...", options:["La rapidité des réponses données","La mise de côté volontaire du jugement pour vraiment comprendre le vécu de l'autre","Le fait de toujours être d'accord avec la personne"], correct:1 },
      { q:"Cas pratique — Un parent exige des informations détaillées sur ce que son enfant majeur a confié en séance. Quelle est la réponse professionnellement correcte ?", options:["Tout partager car c'est un parent","Expliquer que le secret professionnel s'applique et que l'accord du patient majeur est nécessaire, sauf danger grave","Refuser de parler au parent, même pour expliquer le principe du secret professionnel"], correct:1 },
      { q:"Le rôle d'un(e) médiateur(rice) familial(e) est de...", options:["Décider à la place des personnes en conflit qui a raison","Aider les personnes en conflit à se comprendre et à trouver un accord par elles-mêmes","Remplacer un jugement de tribunal"], correct:1 },
      { q:"La sociologie diffère de la psychologie individuelle principalement parce qu'elle...", options:["Étudie les phénomènes au niveau des groupes et structures sociales plutôt qu'au niveau d'un individu isolé","Ne s'intéresse jamais aux comportements humains","Est une branche de la médecine"], correct:0 },
      { q:"Pourquoi le métier de psychologue reste-t-il parfois peu reconnu socialement, malgré une demande réelle ?", options:["Parce que ce métier n'est pas réellement utile","À cause d'une méconnaissance ou d'une stigmatisation culturelle autour de la santé mentale, indépendamment de son utilité réelle","Parce qu'il n'existe aucune formation sérieuse dans ce domaine"], correct:1 },
      { q:"Cas pratique — Un(e) chargé(e) RH constate des tensions récurrentes dans une équipe. Quelle démarche illustre le mieux une approche fondée sur les sciences humaines ?", options:["Sanctionner immédiatement les personnes les plus bruyantes","Observer et recueillir les points de vue de chacun avant d'identifier les causes structurelles des tensions","Ignorer le problème s'il ne nuit pas à la production immédiate"], correct:1 },
      { q:"Pourquoi dit-on que les sciences humaines reposent sur une méthodologie rigoureuse, pas seulement sur l'intuition ?", options:["Parce qu'elles s'appuient sur l'observation structurée, les entretiens et l'analyse systématique des comportements","Parce que l'intuition n'existe pas dans ces métiers","Ce n'est pas vraiment le cas en pratique"], correct:0 }
    ]
  },
  mode: {
    lecons:[
      { titre:"L'image, un langage à part entière",
        definition:"Le langage visuel désigne l'ensemble des choix (posture, style, lumière, mouvement) qui communiquent une émotion ou une intention avant même qu'un mot soit prononcé.",
        contenu:[
          "Dans la mode et le spectacle, une posture, un choix de vêtement, un éclairage ou un mouvement racontent une histoire avant même qu'un mot soit prononcé. Ce langage visuel n'est pas instinctif chez tout le monde : il s'apprend, se travaille et se perfectionne avec l'expérience et les retours d'un directeur artistique, d'un photographe ou d'un metteur en scène.",
          "Un(e) mannequin ou un(e) acteur/actrice ne « joue » pas seulement un rôle ou une pose : il/elle incarne une intention précise définie en amont par une équipe créative, ce qui demande une vraie capacité d'écoute et d'adaptation, bien au-delà de l'apparence physique seule.",
          "Ce langage se travaille consciemment : un(e) mannequin professionnel(le) apprend à ajuster son regard, l'inclinaison de sa tête ou la tension de ses mains selon l'ambiance recherchée, exactement comme un acteur ajuste son intonation selon l'émotion d'une scène." ],
        exemple:"Pour une campagne évoquant la confiance et le dynamisme, un(e) directeur(rice) artistique demande au mannequin un regard direct vers l'objectif et une posture ouverte des épaules ; pour une campagne plus intimiste, il/elle demandera au contraire un regard détourné et une posture plus repliée.",
        note:"Croire qu'un bon résultat devant l'objectif dépend uniquement de l'apparence physique, sans travail conscient de posture et d'expression, est une erreur fréquente qui limite la progression d'un(e) mannequin débutant(e).",
        pointscles:["Le langage visuel se travaille consciemment, il n'est pas seulement instinctif.","Un(e) mannequin incarne une intention définie par une équipe créative, au-delà de la seule apparence.","La posture, le regard et l'expression sont des outils professionnels à maîtriser progressivement."] },
      { titre:"La discipline derrière le glamour",
        definition:"La discipline professionnelle dans ce secteur désigne la capacité à maintenir rigueur, ponctualité et endurance malgré des horaires exigeants et de nombreux refus avant d'obtenir des opportunités régulières.",
        contenu:[
          "Derrière un défilé, un tournage ou une séance photo, il y a des horaires très stricts, une grande endurance physique, et souvent beaucoup de refus (castings non retenus, projets annulés) avant un premier vrai succès. Le talent ou le physique seuls ne suffisent pas sans une réelle discipline personnelle.",
          "C'est un secteur où la gestion de la pression et de la critique — y compris sur son apparence physique — fait partie du métier, ce qui demande une solidité personnelle souvent sous-estimée par ceux qui ne voient que la partie visible et valorisée de ces carrières.",
          "Cette discipline s'exprime aussi dans la gestion de carrière au quotidien : répondre rapidement aux sollicitations d'une agence, être ponctuel(le) sur chaque tournage, entretenir son book professionnel — autant d'aspects peu visibles mais déterminants pour construire une réputation de fiabilité dans le milieu." ],
        exemple:"Un(e) mannequin débutant(e) enchaîne quinze castings non retenus avant d'obtenir son premier contrat rémunéré : les professionnels qui durent dans ce secteur sont souvent ceux qui ont maintenu leur discipline (ponctualité, entraînement, mise à jour du book) malgré cette série de refus.",
        note:"Abandonner après quelques refus, en interprétant chaque échec de casting comme un jugement définitif sur sa valeur personnelle, est une réaction fréquente qui empêche de persister assez longtemps pour obtenir les premières opportunités réelles.",
        pointscles:["Le talent seul ne suffit pas sans discipline personnelle et gestion rigoureuse de sa carrière.","Les refus répétés sont une réalité normale du secteur, pas un jugement définitif.","La fiabilité (ponctualité, réactivité) construit une réputation professionnelle durable."] },
      { titre:"Derrière la caméra : des métiers tout aussi essentiels",
        definition:"Les métiers techniques de la mode et du spectacle (styliste, maquilleur, photographe, réalisateur) conçoivent et orchestrent l'image finale, en complément des personnes visibles devant l'objectif ou sur scène.",
        contenu:[
          "La mode et le spectacle ne se limitent pas aux personnes visibles à l'écran ou sur le podium : un(e) styliste habille et construit une silhouette, un(e) maquilleur(se) transforme un visage selon une intention précise, un(e) photographe capture et compose l'image finale, et un(e) réalisateur(rice) orchestre l'ensemble d'un tournage.",
          "Ces métiers « de l'ombre » demandent souvent une formation technique plus longue et plus structurée que celle des métiers « devant la caméra », et offrent en général des carrières plus stables dans la durée.",
          "Ces professionnels collaborent étroitement : un(e) styliste et un(e) maquilleur(se) travaillent main dans la main pour construire une cohérence visuelle globale, que le(la) photographe ou réalisateur(rice) capture ensuite selon une intention artistique partagée en amont avec toute l'équipe." ],
        exemple:"Pour un défilé, le(la) styliste sélectionne et assortit les tenues selon le thème de la collection, le(la) maquilleur(se) adapte le maquillage de chaque mannequin à cette même intention, et le(la) photographe choisit ses angles pour capturer l'ensemble de façon cohérente avec la direction artistique globale.",
        note:"Considérer les métiers techniques (styliste, maquilleur, photographe) comme secondaires par rapport aux métiers visibles devant la caméra est une erreur d'appréciation : ce sont souvent eux qui construisent la cohérence artistique globale d'un projet.",
        pointscles:["Les métiers techniques construisent et orchestrent l'image finale, en coulisses.","Ils demandent une formation souvent plus longue et offrent des carrières plus stables.","La réussite d'un projet visuel dépend d'une coordination étroite entre tous ces rôles."] }
    ],
    exercices:[
      { q:"Que communique d'abord une image de mode, avant les mots ?", options:["Rien, c'est purement décoratif","Une émotion ou une intention par la posture, la lumière et le style","Uniquement le prix du produit présenté"], correct:1, explication:"L'image professionnelle est un outil de communication à part entière." },
      { q:"Qu'est-ce qui soutient une carrière dans ce secteur, au-delà du talent ou du physique ?", options:["La chance uniquement, sans aucun travail","La discipline personnelle et la capacité à encaisser les refus avant un premier succès","Rien de particulier n'est nécessaire"], correct:1, explication:"La persévérance face aux refus est presque toujours nécessaire dans ce secteur très compétitif." },
      { q:"Quel métier construit et assortit les tenues pour raconter une intention visuelle précise ?", options:["Le/la styliste","Le/la comptable","Le/la vétérinaire"], correct:0, explication:"C'est le rôle central du métier de styliste." },
      { q:"Pourquoi les métiers 'derrière la caméra' sont-ils souvent plus stables dans la durée ?", options:["Ils reposent sur une formation technique structurée, moins dépendante des seuls critères d'apparence physique","Ils ne dépendent d'aucune compétence particulière","Ils sont moins bien payés donc moins recherchés"], correct:0, explication:"Une compétence technique reconnue vieillit mieux qu'une carrière fondée seulement sur l'apparence." },
      { q:"Pourquoi la fiabilité (ponctualité, réactivité) construit-elle une réputation professionnelle durable dans ce secteur ?", options:["Parce que les agences et équipes créatives privilégient les personnes sur qui elles peuvent compter dans un milieu où les délais sont serrés","Ce n'est pas un critère important dans ce secteur","Parce que la loi l'exige"], correct:0, explication:"Dans un secteur où les plannings sont très contraints, la fiabilité pèse souvent autant que le talent." },
      { q:"La coordination entre styliste, maquilleur(se) et photographe vise principalement à...", options:["Construire une cohérence visuelle globale autour d'une même intention artistique","Travailler chacun de son côté sans lien entre les rôles","Réduire le nombre de personnes présentes sur un tournage"], correct:0, explication:"Cette coordination assure que l'ensemble du projet visuel raconte une histoire cohérente." }
    ],
    examen:[
      { q:"Cas pratique — Un(e) mannequin débutant(e) enchaîne plusieurs castings non retenus. Quelle attitude professionnelle est la plus adaptée à ce secteur ?", options:["Abandonner immédiatement après le premier refus","Considérer les refus comme une part normale du métier et continuer à se présenter aux castings pertinents","Se plaindre publiquement de chaque refus"], correct:1 },
      { q:"Ce qui distingue un(e) mannequin professionnel(le) d'une simple personne photogénique est...", options:["Uniquement l'apparence physique","La capacité à incarner une intention précise définie par une équipe créative, avec constance et discipline","Le nombre de followers sur les réseaux sociaux"], correct:1 },
      { q:"Cas pratique — Un tournage prend du retard à cause d'un problème technique de dernière minute. Quel rôle est le plus directement responsable de coordonner la suite ?", options:["Le/la réalisateur(rice)","Le/la maquilleur(se)","Le/la mannequin"], correct:0 },
      { q:"Pourquoi ce secteur est-il considéré comme particulièrement compétitif ?", options:["Un nombre limité de postes très visibles attire un très grand nombre de candidats","Ce n'est en réalité pas un secteur compétitif","Parce que les études y sont obligatoirement très longues"], correct:0 },
      { q:"Le rôle d'un(e) maquilleur(se) professionnel(le) sur un tournage ou un défilé consiste à...", options:["Transformer un visage selon une intention artistique précise définie en amont","Uniquement appliquer un maquillage standard identique à chaque fois","Gérer le planning général du tournage"], correct:0 },
      { q:"Une carrière durable dans ce secteur repose le plus souvent sur...", options:["Un unique coup de chance au début de carrière, sans rien construire ensuite","Une combinaison de discipline, de professionnalisme et d'un réseau construit dans la durée","Le hasard uniquement, sans aucun facteur maîtrisable"], correct:1 },
      { q:"Cas pratique — Un(e) styliste doit habiller un mannequin pour une campagne évoquant la rigueur et le professionnalisme. Quel choix sert le mieux cette intention ?", options:["Des lignes épurées et des couleurs sobres, cohérentes avec le message recherché","Des couleurs très vives et des accessoires nombreux, sans lien avec le thème","Le choix des vêtements n'a aucune influence sur le message perçu"], correct:0 },
      { q:"Pourquoi dit-on que les métiers techniques (styliste, maquilleur, photographe) sont parfois sous-estimés par rapport aux métiers visibles ?", options:["Parce qu'ils sont moins exposés médiatiquement alors qu'ils orchestrent une grande partie du résultat final","Parce qu'ils demandent réellement moins de compétence","Parce qu'ils sont mieux payés que les métiers visibles"], correct:0 }
    ]
  },
  aviation: {
    lecons:[
      { titre:"La check-list, un réflexe qui sauve des vies",
        definition:"Une check-list est une liste de vérifications standardisée, suivie systématiquement dans le même ordre, conçue pour prévenir les oublis même chez des professionnels très expérimentés.",
        contenu:[
          "Avant chaque vol, un(e) pilote suit une liste de vérifications précise, toujours dans le même ordre, même après des milliers d'heures de vol accumulées. Cette discipline, appelée check-list, existe précisément parce que l'expérience et la routine peuvent, paradoxalement, favoriser l'oubli d'une étape qu'on croit acquise.",
          "Ce principe dépasse largement le pilotage : dans tous les métiers où une erreur peut avoir des conséquences graves (santé, industrie, aviation), la procédure systématique et écrite protège mieux qu'une confiance excessive dans l'expérience personnelle.",
          "La check-list agit aussi comme un langage commun entre les membres d'équipage : elle garantit que chacun vérifie les mêmes points, dans le même ordre, ce qui réduit le risque qu'une vérification importante soit oubliée parce que chacun pensait que l'autre s'en était chargé." ],
        exemple:"Avant le décollage, un(e) pilote et son copilote lisent à voix haute chaque point de la check-list de démarrage, l'un énonçant la vérification et l'autre confirmant l'action réalisée — un procédé qui garantit qu'aucune étape n'est supposée faite sans confirmation explicite.",
        note:"Sauter une étape de la check-list parce qu'elle semble « évidente » ou déjà vérifiée mentalement est une des causes d'incidents les plus documentées dans l'histoire de l'aviation, malgré l'expérience du personnel concerné.",
        pointscles:["La check-list protège contre l'oubli, y compris chez des professionnels très expérimentés.","Elle sert aussi de langage commun qui coordonne les vérifications entre plusieurs personnes.","Sauter une étape jugée 'évidente' reste une des causes d'incidents les plus documentées."] },
      { titre:"Un métier d'équipe, pas de héros solitaire",
        definition:"La coordination opérationnelle en aviation désigne l'ensemble des communications standardisées entre pilotes, contrôleurs aériens et équipages, conçues pour éliminer les risques de malentendu dans des situations critiques.",
        contenu:[
          "Un vol réussi ne dépend jamais d'une seule personne : le/la pilote coordonne en permanence avec les contrôleurs aériens au sol, l'équipage de cabine et les équipes de maintenance. Une communication précise et standardisée entre ces rôles compte souvent autant que la compétence de pilotage elle-même.",
          "Cette exigence de communication rigoureuse explique pourquoi l'aviation utilise un vocabulaire international très codifié : il réduit au minimum les risques de malentendu, y compris entre professionnels de langues maternelles différentes.",
          "Cette culture d'équipe encourage aussi chaque membre, quel que soit son grade, à signaler une inquiétude ou une anomalie sans hésiter — un principe appelé parfois « autorité partagée », qui évite qu'une erreur potentielle ne soit ignorée par crainte de contredire un supérieur hiérarchique." ],
        exemple:"Lors d'une phase d'approche, un(e) copilote junior remarque une anomalie sur un indicateur et la signale immédiatement au commandant de bord, sans hésiter malgré la différence de grade — ce réflexe fait partie intégrante de la culture de sécurité enseignée dans la formation.",
        note:"Une hiérarchie trop rigide, où un membre d'équipage junior hésite à signaler une anomalie par crainte de contredire un supérieur, a été identifiée comme un facteur contribuant à plusieurs incidents aériens documentés.",
        pointscles:["La sécurité d'un vol repose sur la coordination entre plusieurs rôles, pas sur une seule personne.","Le vocabulaire international standardisé limite les risques de malentendu.","Chaque membre d'équipage est encouragé à signaler une anomalie, quel que soit son grade."] },
      { titre:"Une formation longue et coûteuse, mais des débouchés mondiaux",
        definition:"La licence ATPL (Airline Transport Pilot Licence) est la qualification professionnelle internationale requise pour exercer comme pilote de ligne, obtenue après une formation longue combinant théorie et heures de vol certifiées.",
        contenu:[
          "Devenir pilote de ligne demande une formation longue (plusieurs années) et souvent coûteuse, avec un nombre d'heures de vol certifiées à accumuler avant d'obtenir la licence professionnelle (ATPL). D'autres métiers du secteur, comme hôtesse de l'air/steward ou agent(e) d'escale, ont des formations beaucoup plus courtes et plus accessibles.",
          "Ce qui rend ce secteur particulièrement attractif à long terme, c'est la portée mondiale de ses qualifications : une licence de pilote ou une certification de contrôleur aérien, une fois obtenue, ouvre des opportunités bien au-delà du pays où la formation a eu lieu.",
          "Cette reconnaissance internationale s'explique par des standards harmonisés au niveau mondial (normes de l'aviation civile internationale), ce qui permet à un pilote formé dans un pays de faire valider sa licence dans un autre, sous réserve de certaines équivalences ou compléments de formation." ],
        exemple:"Un(e) pilote formé(e) et certifié(e) dans son pays d'origine peut, après avoir validé certaines équivalences réglementaires, exercer pour une compagnie aérienne installée dans une autre région du monde, contrairement à de nombreuses qualifications professionnelles qui restent limitées à un seul pays.",
        note:"Sous-estimer le coût et la durée réels de la formation de pilote de ligne, en se basant uniquement sur l'attractivité du métier, est une erreur fréquente qui peut mener à des choix d'orientation mal préparés financièrement.",
        pointscles:["La licence ATPL est une qualification longue à obtenir mais reconnue internationalement.","D'autres métiers du secteur (steward, agent d'escale) ont des formations beaucoup plus courtes et accessibles.","La portée mondiale de ces qualifications est un avantage rare comparé à de nombreux autres métiers."] }
    ],
    exercices:[
      { q:"Pourquoi suit-on une check-list même après des milliers d'heures d'expérience ?", options:["Par simple habitude administrative sans réelle utilité","Parce que l'expérience n'empêche pas les oublis, la procédure systématique les évite","Parce que la loi l'exige sans autre justification"], correct:1, explication:"La routine peut créer des oublis — la procédure écrite les prévient." },
      { q:"Un vol sûr dépend surtout de...", options:["Uniquement du talent individuel du pilote","La coordination précise entre pilote, contrôle aérien et équipage","Du hasard et de la météo uniquement"], correct:1, explication:"L'aviation repose sur un travail d'équipe très structuré." },
      { q:"Pourquoi l'aviation utilise-t-elle un vocabulaire international standardisé ?", options:["Pour rendre le métier plus impressionnant","Pour réduire au minimum les risques de malentendu entre professionnels de langues différentes","Ce n'est qu'une tradition sans réelle utilité"], correct:1, explication:"Un vocabulaire commun limite les erreurs de communication critiques." },
      { q:"Quel avantage offre une licence de pilote ou une certification de contrôleur aérien, une fois obtenue ?", options:["Elle n'est valable que dans le pays de formation","Elle ouvre des opportunités professionnelles à l'échelle mondiale","Elle expire après un an sans possibilité de renouvellement"], correct:1, explication:"Ces qualifications sont largement reconnues au niveau international." },
      { q:"Qu'appelle-t-on « autorité partagée » dans la culture de sécurité aérienne ?", options:["Le principe qui encourage chaque membre d'équipage à signaler une anomalie, quel que soit son grade","Le partage du salaire entre pilote et copilote","Une règle qui n'existe pas réellement dans l'aviation"], correct:0, explication:"Ce principe évite qu'une erreur potentielle soit ignorée par crainte de contredire un supérieur." },
      { q:"Un(e) agent(e) d'escale exerce principalement son métier...", options:["Au sol, pour l'accueil et l'accompagnement des passagers avant l'embarquement","En vol, aux commandes de l'avion","Dans un centre de contrôle aérien uniquement"], correct:0, explication:"C'est un métier d'accueil et de logistique au sol, distinct du personnel navigant." }
    ],
    examen:[
      { q:"Cas pratique — Un(e) pilote expérimenté(e), pressé(e) par un horaire serré, envisage de sauter une étape de sa check-list qu'il/elle juge 'automatique'. Quelle est l'attitude professionnelle attendue ?", options:["Sauter l'étape car l'expérience suffit à la compenser","Suivre intégralement la check-list, car son but est justement de prévenir les oublis liés à la routine ou la pression du temps","Demander à un collègue de la faire à sa place sans vérifier"], correct:1 },
      { q:"La communication standardisée entre pilote et contrôle aérien vise avant tout à...", options:["Impressionner les passagers","Éliminer autant que possible les risques de malentendu dans des situations où l'erreur peut être grave","Accélérer artificiellement la durée des vols"], correct:1 },
      { q:"Cas pratique — Un incident technique mineur est détecté juste avant le décollage. Quelle décision illustre le mieux la culture de sécurité de l'aviation ?", options:["Décoller quand même pour respecter l'horaire, l'incident étant mineur","Retarder ou annuler le vol le temps de vérifier et lever tout doute, même au prix d'un retard","Ignorer l'incident s'il n'a jamais posé de problème par le passé"], correct:1 },
      { q:"Le rôle d'un(e) contrôleur(se) aérien(ne) est de...", options:["Piloter des avions à distance depuis le sol","Coordonner et sécuriser la circulation des avions dans l'espace aérien","Gérer uniquement la billetterie des compagnies aériennes"], correct:1 },
      { q:"Pourquoi la formation de pilote de ligne est-elle particulièrement longue et exigeante ?", options:["Parce que les compagnies aériennes aiment compliquer inutilement l'accès au métier","Parce que la sécurité de centaines de vies repose directement sur la maîtrise complète de compétences techniques et de procédures","Ce n'est en réalité pas une formation si exigeante"], correct:1 },
      { q:"Un métier comme agent(e) d'escale, comparé à celui de pilote, se distingue surtout par...", options:["Une formation généralement plus courte, tout en restant essentiel au bon déroulement des vols au sol","L'absence totale de responsabilité","Un salaire toujours identique à celui d'un pilote"], correct:0 },
      { q:"Cas pratique — Un(e) copilote junior remarque une anomalie mais hésite à la signaler au commandant de bord par crainte de le contredire. Quel principe de la culture de sécurité aérienne ce cas illustre-t-il ?", options:["L'autorité partagée, qui encourage justement à signaler toute anomalie quel que soit son grade","Une règle qui n'existe pas dans l'aviation","Le principe que seul le commandant peut détecter les anomalies"], correct:0 },
      { q:"Pourquoi une licence de pilote reste-t-elle reconnue au-delà du pays de formation ?", options:["Grâce à des standards internationaux harmonisés de l'aviation civile, sous réserve de certaines équivalences","Parce que chaque pays a exactement les mêmes règles sans aucune différence","Ce n'est en réalité pas le cas, chaque licence reste strictement nationale"], correct:0 }
    ]
  }
};
const META_LABELS = { logique:"Logique & analyse", creativite:"Créativité", relationnel:"Relationnel & empathie", pratique:"Sens pratique", rigueur:"Rigueur & organisation" };

let jobsData = [
  { id:"j1-d-veloppeur-se-web-junior", titre:"Développeur(se) web junior", entreprise:"KpokpoTech", secteur:"technologie", niveau:"Bac+2/3", ville:"Cotonou", contrat:"CDI", desc:"Participer au développement de fonctionnalités web au sein d'une petite équipe produit.", verifie:true,
    missions:["Développer et maintenir des fonctionnalités du site web de l'entreprise","Corriger les bugs signalés par l'équipe support","Participer aux réunions techniques hebdomadaires de l'équipe"],
    profil:["Bases solides en HTML, CSS et JavaScript","Capacité à apprendre vite et à travailler en équipe","Une première expérience (stage ou projet personnel) est un plus"] },
  { id:"j2-assistant-e-commercial-e", titre:"Assistant(e) commercial(e)", entreprise:"Sonagnon Commerce", secteur:"commerce", niveau:"Bac", ville:"Porto-Novo", contrat:"CDD", desc:"Suivre les commandes clients et appuyer l'équipe de vente au quotidien.", verifie:true,
    missions:["Assurer le suivi des commandes clients du premier contact à la livraison","Répondre aux demandes courantes des clients par téléphone et en boutique","Tenir à jour les fiches clients et le tableau de suivi des ventes"],
    profil:["Bon relationnel et sens du service client","À l'aise avec les outils bureautiques de base (tableur, messagerie)","Rigueur dans le suivi administratif"] },
  { id:"j3-technicien-ne-agricole", titre:"Technicien(ne) agricole", entreprise:"AgroBénin", secteur:"agriculture", niveau:"Bac+2", ville:"Parakou", contrat:"CDI", desc:"Appuyer le suivi des cultures et conseiller les producteurs partenaires.", verifie:true,
    missions:["Effectuer le suivi technique des parcelles partenaires","Conseiller les producteurs sur les bonnes pratiques agricoles","Rédiger des rapports de suivi de campagne"],
    profil:["Formation en agronomie ou équivalent","Permis de conduire apprécié pour les déplacements terrain","Bon contact avec les producteurs locaux"] },
  { id:"j4-psychologue-scolaire", titre:"Psychologue scolaire", entreprise:"Groupe Scolaire Étoile", secteur:"psychologie", niveau:"Bac+5", ville:"Cotonou", contrat:"CDI", desc:"Accompagner les élèves en difficulté et conseiller les équipes pédagogiques.", verifie:true,
    missions:["Recevoir les élèves en entretien individuel selon les besoins identifiés","Conseiller les enseignants sur l'accompagnement d'élèves en difficulté","Coordonner avec les familles dans le respect du secret professionnel"],
    profil:["Master en psychologie requis","Expérience avec un public scolaire appréciée","Grande capacité d'écoute et de discrétion"] },
  { id:"j5-d-corateur-rice-d-int-rieur", titre:"Décorateur(rice) d'intérieur", entreprise:"Atelier Wax", secteur:"art", niveau:"Bac+2", ville:"Cotonou", contrat:"Freelance", desc:"Concevoir des aménagements intérieurs pour des particuliers et des commerces locaux.", verifie:true,
    missions:["Rencontrer les clients pour cerner leurs besoins et leur budget","Proposer des plans d'aménagement et des choix de matériaux","Suivre la réalisation des travaux jusqu'à la livraison"],
    profil:["Formation en design d'espace ou portfolio démontrant des réalisations concrètes","Sens esthétique et capacité d'écoute du client","Autonomie dans la gestion de plusieurs projets en parallèle"] },
  { id:"j6-h-tesse-de-l-air-steward", titre:"Hôtesse de l'air / Steward", entreprise:"Bénin Sky Lines", secteur:"aviation", niveau:"Formation spécifique", ville:"Cotonou", contrat:"CDI", desc:"Assurer la sécurité et le confort des passagers sur des vols régionaux.", verifie:true,
    missions:["Assurer les briefings de sécurité avant chaque vol","Veiller au confort et à la sécurité des passagers durant le vol","Réagir selon les procédures en cas d'incident à bord"],
    profil:["Certification de sécurité aérienne (formation courte fournie si besoin)","Excellent relationnel et sang-froid","Disponibilité pour des horaires variables"] },
  { id:"j7-mannequin-agence-junior", titre:"Mannequin (agence junior)", entreprise:"Agence Wax Models", secteur:"mode", niveau:"Aucun diplôme requis", ville:"Cotonou", contrat:"Cachet / mission", desc:"Participer à des shootings et défilés pour des marques locales en développement.", verifie:true,
    missions:["Participer à des séances photo et défilés pour des marques partenaires","Suivre les indications de style et de posture de l'équipe créative","Représenter l'image de l'agence lors des événements publics"],
    profil:["Disponibilité flexible selon les castings","Aisance devant l'objectif et bonne présentation","Ponctualité et professionnalisme sur les tournages"] }
];

/* ---------------- Fiche métier (assistant d'orientation) : contenu & rendu ---------------- */
function openFiche(domKey, metierId){
  const dom = SECTORS[domKey];
  const metier = dom.metiers.find(m => m.id === metierId);
  const steps = [
    { label:"Choisir une orientation scolaire compatible", detail:"Série ou filière du secondaire adaptée à « " + metier.nom + " ».", duree:"Avant le bac" },
    { label:"S'orienter vers : " + metier.filiere, detail:"La filière ou l'école qui prépare concrètement à ce métier.", duree:metier.filiere.match(/\(([^)]+)\)/) ? metier.filiere.match(/\(([^)]+)\)/)[1] : "Variable" },
    { label:"Construire une première expérience pratique", detail:"Stage, apprentissage ou projet personnel pour confronter la théorie au réel avant la fin des études.", duree:"En parallèle des études" },
    { label:"Obtenir le diplôme ou la qualification requise", detail:"Validation officielle des compétences nécessaires pour exercer.", duree:"Fin de formation" },
    { label:"Construire un premier réseau professionnel", detail:"Mentors, anciens élèves, associations du secteur : ce réseau ouvre souvent plus de portes qu'une candidature seule.", duree:"Dès la formation" },
    { label:"Décrocher un premier poste ou démarrer une activité", detail:"Premier contrat, stage rémunéré ou lancement en indépendant selon le métier.", duree:"Début de carrière" },
    { label:"Se spécialiser ou évoluer", detail:"Approfondir une expertise, encadrer une équipe, ou se mettre à son compte une fois l'expérience acquise.", duree:"Moyen à long terme" }
  ];
  document.getElementById('fiche-body').innerHTML = `
    <span class="eyebrow">${esc(dom.name)}</span>
    <h2 style="font-size:24px; margin-bottom:4px;">${esc(metier.nom)}</h2>
    <p style="color:var(--text-muted); font-size:14px; margin-top:0;">${esc(metier.filiere)}</p>

    <h3 style="font-size:14px; margin:22px 0 8px;">Ce que ce domaine peut offrir</h3>
    <p style="color:var(--text-muted); font-size:14px; margin:0;">${esc(dom.potentiel)}</p>

    <h3 style="font-size:14px; margin:22px 0 10px;">Des parcours inspirants dans ce domaine</h3>
    ${dom.figures.map(f => `
      <div style="background:var(--bg-panel-2); border:1px solid var(--border); border-radius:10px; padding:14px 16px; margin-bottom:10px;">
        <p style="font-size:14px; margin:0 0 6px; font-weight:600; color:var(--gold);">${esc(f.nom)}</p>
        <p style="font-size:13px; line-height:1.6; color:var(--text-muted); margin:0;">${esc(f.histoire)}</p>
      </div>`).join('')}

    <h3 style="font-size:14px; margin:22px 0 10px;">Ton chemin possible, étape par étape</h3>
    <div class="path-track" style="margin-bottom:6px;">
      ${steps.map(s => `<div class="path-step"><div class="path-dot">${ICONS.dot}</div><div class="path-body"><h4>${esc(s.label)}</h4><p>${esc(s.detail)}</p><span style="font-family:var(--font-mono); font-size:11px; color:var(--text-faint);">${esc(s.duree)}</span></div></div>`).join('')}
    </div>

    <button class="btn btn-gold" style="margin-top:12px;" onclick="closeFiche(); showScreen('academie'); setAcademieDomaine('${escAttr(domKey)}');">Commencer les cours de ce domaine</button>
  `;
  document.getElementById('fiche-modal').classList.add('open');
  openModal('fiche-modal');
}
function closeFiche(){ closeModal('fiche-modal'); }

const QUIZ = [
  // ---- Santé ----
  { type:"scale", text:"Soigner une petite blessure ou t'occuper de quelqu'un de malade.", tags:["sante"], meta:["relationnel"] },
  { type:"scale", text:"Comprendre pourquoi le corps réagit d'une certaine façon face à une maladie ou un symptôme.", tags:["sante"], meta:["logique"] },
  { type:"scale", text:"Rester calme et agir vite face à une urgence — accident, malaise, blessure.", tags:["sante"], meta:["rigueur"] },
  // ---- Technologie ----
  { type:"scale", text:"Comprendre comment fonctionne une application ou un site internet.", tags:["technologie"], meta:["logique"] },
  { type:"scale", text:"Chercher inlassablement pourquoi quelque chose ne marche pas, jusqu'à trouver la solution.", tags:["technologie"], meta:["rigueur"] },
  { type:"scale", text:"Construire quelque chose d'utile avec du code, même petit — une page, un script, un jeu simple.", tags:["technologie"], meta:["creativite"] },
  // ---- Art & Design ----
  { type:"scale", text:"Dessiner, peindre ou créer une affiche pour un événement.", tags:["art"], meta:["creativite"] },
  { type:"scale", text:"Remarquer les couleurs, formes ou styles qui rendent une chose belle ou marquante.", tags:["art"], meta:["creativite"] },
  { type:"scale", text:"Créer quelque chose d'entièrement nouveau, même si ça ne plaît pas à tout le monde tout de suite.", tags:["art"], meta:["creativite"] },
  // ---- Commerce & Business ----
  { type:"scale", text:"Négocier un prix au marché ou convaincre quelqu'un d'acheter quelque chose.", tags:["commerce"], meta:["relationnel"] },
  { type:"scale", text:"Convaincre un groupe d'adopter ton idée plutôt qu'une autre.", tags:["commerce"], meta:["relationnel"] },
  { type:"scale", text:"Gérer un budget ou de l'argent commun sans te tromper.", tags:["commerce"], meta:["rigueur"] },
  // ---- Agriculture & Environnement ----
  { type:"scale", text:"Cultiver des plantes ou t'occuper d'un jardin ou d'un champ.", tags:["agriculture"], meta:["pratique"] },
  { type:"scale", text:"Observer et t'adapter aux cycles naturels — saisons, météo, sol — plutôt qu'à un planning fixe.", tags:["agriculture"], meta:["pratique"] },
  { type:"scale", text:"Te soucier de l'impact de nos actions quotidiennes sur l'environnement autour de toi.", tags:["agriculture"], meta:["rigueur"] },
  // ---- Éducation ----
  { type:"scale", text:"Expliquer un exercice à un camarade qui bloque, jusqu'à ce qu'il comprenne.", tags:["education"], meta:["relationnel"] },
  { type:"scale", text:"Trouver plusieurs façons d'expliquer la même chose jusqu'à ce que ça \"clique\" pour l'autre.", tags:["education"], meta:["creativite"] },
  { type:"scale", text:"Préparer et animer une activité pour un groupe — cours, atelier, jeu.", tags:["education"], meta:["rigueur"] },
  // ---- Ingénierie ----
  { type:"scale", text:"Réparer un objet cassé à la maison — fil électrique, meuble, vélo.", tags:["ingenierie"], meta:["pratique"] },
  { type:"scale", text:"Comprendre comment une machine ou une structure est construite, pièce par pièce.", tags:["ingenierie"], meta:["logique"] },
  { type:"scale", text:"Construire ou assembler quelque chose de tes mains, avec précision.", tags:["ingenierie"], meta:["pratique"] },
  // ---- Psychologie & sciences humaines ----
  { type:"scale", text:"Écouter un ami traverser un moment difficile et l'aider à y voir plus clair.", tags:["psychologie"], meta:["relationnel"] },
  { type:"scale", text:"Comprendre pourquoi deux personnes réagissent différemment à une même situation.", tags:["psychologie"], meta:["logique"] },
  { type:"scale", text:"Aider un groupe en conflit à se comprendre, sans prendre parti trop vite.", tags:["psychologie"], meta:["relationnel"] },
  // ---- Mode, Image & Spectacle ----
  { type:"scale", text:"Soigner ta posture, ton style ou ton image pour capter le regard — photo, tenue, présentation.", tags:["mode"], meta:["creativite"] },
  { type:"scale", text:"Répéter un mouvement, une pose ou un texte des dizaines de fois jusqu'à ce que ce soit parfait.", tags:["mode"], meta:["rigueur"] },
  // ---- Aviation & Transport ----
  { type:"scale", text:"Suivre une procédure stricte, étape par étape, sans jamais sauter une case — même répétée mille fois.", tags:["aviation"], meta:["rigueur"] },
  { type:"scale", text:"Rester concentré(e) et précis(e) pendant plusieurs heures d'affilée, sans relâcher l'attention.", tags:["aviation"], meta:["rigueur"] },

  // ---- Questions à choix forcé : révèlent un vrai arbitrage, pas juste des goûts isolés ----
  { type:"choice", text:"Dans un projet de groupe, ton rôle naturel serait plutôt de...", options:[
    { label:"Organiser le plan et répartir les tâches", tags:["commerce"], meta:["rigueur"] },
    { label:"Trouver des idées que personne n'avait vues", tags:["art"], meta:["creativite"] },
    { label:"Vérifier que chaque détail technique tienne la route", tags:["ingenierie"], meta:["pratique"] },
    { label:"Veiller à ce que tout le monde se sente écouté", tags:["psychologie"], meta:["relationnel"] }
  ]},
  { type:"choice", text:"Un problème te motive surtout quand...", options:[
    { label:"Il touche à la santé ou au bien-être de quelqu'un", tags:["sante"], meta:["relationnel"] },
    { label:"Il touche à la nature, à la terre, à l'environnement", tags:["agriculture"], meta:["pratique"] },
    { label:"Il touche à un système ou une machine à comprendre", tags:["technologie"], meta:["logique"] },
    { label:"Il touche à la transmission d'un savoir", tags:["education"], meta:["relationnel"] }
  ]},
  { type:"choice", text:"Tu préfères un travail où...", options:[
    { label:"Chaque jour est différent et laisse place à l'imprévu", tags:["art"], meta:["creativite"] },
    { label:"Le cadre est clair et les résultats mesurables", tags:["ingenierie"], meta:["rigueur"] },
    { label:"Tu es dehors, au contact du réel et du terrain", tags:["agriculture"], meta:["pratique"] },
    { label:"Tu es au contact direct des gens, tous les jours", tags:["sante"], meta:["relationnel"] }
  ]},
  { type:"choice", text:"Ce qui te donnerait le plus de fierté...", options:[
    { label:"Avoir soigné ou sauvé quelqu'un", tags:["sante"], meta:["relationnel"] },
    { label:"Avoir créé une activité qui marche vraiment", tags:["commerce"], meta:["creativite"] },
    { label:"Avoir conçu un objet qui tient debout et sert vraiment", tags:["ingenierie"], meta:["pratique"] },
    { label:"Avoir aidé quelqu'un à mieux se comprendre", tags:["psychologie"], meta:["relationnel"] }
  ]},
  { type:"choice", text:"Face à un imprévu, ta première réaction est de...", options:[
    { label:"Analyser calmement les causes avant d'agir", tags:["technologie"], meta:["logique"] },
    { label:"Improviser une solution créative tout de suite", tags:["art"], meta:["creativite"] },
    { label:"Prendre les choses en main et rassurer les autres", tags:["commerce"], meta:["rigueur"] },
    { label:"Vérifier que rien de grave n'est en danger", tags:["sante"], meta:["rigueur"] }
  ]},
  { type:"choice", text:"Si on te laissait choisir, tu voudrais apprendre en premier...", options:[
    { label:"Comment fonctionne le corps humain", tags:["sante"], meta:["logique"] },
    { label:"Comment programmer ou créer une application", tags:["technologie"], meta:["logique"] },
    { label:"Comment cultiver et faire pousser des choses", tags:["agriculture"], meta:["pratique"] },
    { label:"Comment fonctionne l'esprit humain", tags:["psychologie"], meta:["logique"] }
  ]},
  { type:"choice", text:"Ce qui te ferait le plus vibrer dans un environnement de travail...", options:[
    { label:"Être devant un public ou un objectif, incarner une image", tags:["mode"], meta:["creativite"] },
    { label:"Être responsable de la sécurité de dizaines de personnes", tags:["aviation"], meta:["rigueur"] },
    { label:"Voir grandir une activité que tu as créée", tags:["commerce"], meta:["creativite"] },
    { label:"Voir progresser quelqu'un grâce à toi", tags:["education"], meta:["relationnel"] }
  ]},
  // ---- Questions complémentaires : équilibrent la couverture des domaines Mode, Aviation et Éducation ----
  { type:"scale", text:"Soigner ton apparence et ton style comme une forme d'expression personnelle.", tags:["mode"], meta:["creativite"] },
  { type:"scale", text:"Suivre une procédure stricte, étape par étape, sans jamais sauter une case — même répétée mille fois.", tags:["aviation"], meta:["rigueur"] },
  { type:"scale", text:"Expliquer quelque chose de compliqué à quelqu'un jusqu'à ce qu'il comprenne vraiment.", tags:["education"], meta:["relationnel"] },
  { type:"scale", text:"Soigner ta posture, ton style ou ton image pour capter le regard — photo, tenue, présentation.", tags:["mode"], meta:["creativite"] },
  { type:"scale", text:"Rester concentré(e) et précis(e) pendant plusieurs heures d'affilée, sans relâcher l'attention.", tags:["aviation"], meta:["rigueur"] },
  { type:"scale", text:"Prendre le temps de répéter avec un élève jusqu'à ce qu'il maîtrise une notion.", tags:["education"], meta:["relationnel"] },
  { type:"scale", text:"Coordonner un défilé, une séance photo ou une mise en scène, du choix des tenues au rendu final.", tags:["mode"], meta:["creativite"] },
  { type:"scale", text:"Réagir avec calme et méthode face à une situation imprévue et potentiellement dangereuse.", tags:["aviation"], meta:["rigueur"] },
  { type:"scale", text:"Inventer une activité, un jeu ou un support pour rendre une notion concrète et ludique.", tags:["education"], meta:["creativite"] },
  { type:"scale", text:"Adapter ton style vestimentaire selon les contextes, comme un outil de communication à part entière.", tags:["mode"], meta:["creativite"] },
  { type:"scale", text:"Anticiper les risques avant qu'un problème ne survienne, pour ne jamais avoir à improviser.", tags:["aviation"], meta:["logique"] },
  { type:"scale", text:"Évaluer honnêtement le niveau de chacun et ajuster ton explication en conséquence.", tags:["education"], meta:["relationnel"] },
  { type:"choice", text:"Tu dois préparer une présentation pour un public. Ton rôle naturel serait plutôt de...", options:[
    { label:"Soigner le rendu visuel, la tenue et l'image globale", tags:["mode"], meta:["creativite"] },
    { label:"Vérifier la logistique et le plan de sécurité de l'événement", tags:["aviation"], meta:["rigueur"] },
    { label:"Construire les explications et les exemples pour que le public comprenne", tags:["education"], meta:["relationnel"] },
    { label:"Préparer les supports techniques et la mise en page", tags:["technologie"], meta:["pratique"] }
  ]},
  { type:"choice", text:"Face à un travail répétitif mais qui demande de la précision, tu réagis plutôt...", options:[
    { label:"En suivant scrupuleusement la checklist, sans rien improviser", tags:["aviation"], meta:["rigueur"] },
    { label:"En cherchant un moyen créatif de rendre la tâche plus vivante", tags:["mode"], meta:["creativite"] },
    { label:"En expliquant pourquoi la procédure existe, pour motiver l'équipe", tags:["education"], meta:["relationnel"] },
    { label:"En automatisant ou en optimisant le processus", tags:["technologie"], meta:["logique"] }
  ]},
  { type:"choice", text:"Dans un projet, ce qui te frustre le plus, c'est...", options:[
    { label:"Un rendu visuel bâclé ou une image incohérente", tags:["mode"], meta:["creativite"] },
    { label:"Une procédure de sécurité mal respectée par l'équipe", tags:["aviation"], meta:["rigueur"] },
    { label:"Voir un collègue ne pas comprendre et rester bloqué", tags:["education"], meta:["relationnel"] },
    { label:"Une solution technique qui ne tient pas la route", tags:["ingenierie"], meta:["logique"] }
  ]}
];
const CHOICE_WEIGHT = 3;
const SCALE_MAX = 2;
