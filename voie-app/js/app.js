/* ---------------- State ---------------- */
let state = {
  profile: { name:"", age:"", niveau:"" },
  quizIndex: 0,
  scores: {},
  metaScores: { logique:0, creativite:0, relationnel:0, pratique:0, rigueur:0 },
  quizDone: false,
  topSectors: [],
  sectorChosen: null,
  applied: false,
  examCompleted: false,
  userRole: null, // 'apprenant' | 'entreprise'
  // Candidatures : tableau d'objets { jobId, titre, entreprise, date, statut }
  applications: [],
  // Offres mises de côté par l'apprenant
  savedJobs: []
};
Object.keys(SECTORS).forEach(k => state.scores[k] = 0);

let entrepriseAccount = { verified:false, nom:"", ifu:"", email:"", secteur:"", pending:false };

/* ---------------- Authentification (démonstration, sans backend réel) ---------------- */
// Important : ceci est une simulation côté navigateur pour illustrer le principe d'un accès
// réservé aux personnes connectées. Ce n'est PAS un système d'authentification sécurisé :
// une vraie mise en production nécessiterait un serveur, un hachage des mots de passe (bcrypt),
// HTTPS, une limitation des tentatives côté serveur, et une protection anti-robots (captcha).
let demoUsers = [{ name:"Démo", email:"demo@voie.bj", password:"sha256$", photo:null, role:"apprenant" }];
let authMode = 'login';
let loginAttempts = 0;
let currentUser = null;
let pendingPhoto = null;
let authRoleChoice = 'apprenant';

function setAuthRoleChoice(role){
  authRoleChoice = role;
  document.getElementById('auth-role-apprenant').classList.toggle('active', role === 'apprenant');
  document.getElementById('auth-role-entreprise').classList.toggle('active', role === 'entreprise');
}

function setAuthMode(mode){
  authMode = mode;
  document.getElementById('login-tab-btn').classList.toggle('active', mode === 'login');
  document.getElementById('signup-tab-btn').classList.toggle('active', mode === 'signup');
  document.getElementById('auth-role-field').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('auth-name-field').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('auth-photo-field').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('auth-extra-fields').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('auth-submit-btn').textContent = mode === 'signup' ? 'Créer mon compte' : 'Se connecter';
  document.getElementById('auth-error').textContent = '';
  if(mode === 'signup') setAuthRoleChoice(pendingRole || 'apprenant');
}

document.getElementById('auth-photo').addEventListener('change', e => {
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 3 * 1024 * 1024){
    toast("Photo trop lourde (3 Mo maximum).");
    e.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = ev => {
    pendingPhoto = ev.target.result;
    document.getElementById('auth-photo-preview').innerHTML = `<img src="${pendingPhoto}" alt="Aperçu">`;
  };
  reader.readAsDataURL(file);
});

document.getElementById('auth-form').addEventListener('submit', e => {
  e.preventDefault();
  const errorEl = document.getElementById('auth-error');
  const email = document.getElementById('auth-email').value.trim().toLowerCase();
  const password = document.getElementById('auth-password').value;

  if(loginAttempts >= 5){
    errorEl.textContent = "Trop de tentatives — réessaie dans un instant.";
    return;
  }

  let accountRole = 'apprenant';
  if(authMode === 'signup'){
    const name = document.getElementById('auth-name').value.trim();
    const phone = document.getElementById('auth-phone').value.trim();
    const birthdate = document.getElementById('auth-birthdate').value;
    const country = document.getElementById('auth-country').value;
    const city = document.getElementById('auth-city').value.trim();
    const address = document.getElementById('auth-address').value.trim();
    if(!name || !email || password.length < 6 || !phone || !city){
      errorEl.textContent = "Remplis au moins le nom, l'email, le mot de passe (6 caractères min.), le téléphone et la ville.";
      return;
    }
    if(demoUsers.some(u => u.email === email)){
      errorEl.textContent = "Un compte existe déjà avec cet email.";
      return;
    }
    accountRole = authRoleChoice;
    const profileData = { name, email, password: hashPwd(password), photo: pendingPhoto, phone, birthdate, country, city, address, role: accountRole };
    demoUsers.push(profileData);
    currentUser = { name, email, photo: pendingPhoto, phone, birthdate, country, city, address };
    pendingPhoto = null;
    document.getElementById('auth-photo-preview').innerHTML = ICONS.person;
  } else {
    const user = demoUsers.find(u => u.email === email && checkPwd(u.password, password));
    if(!user){
      loginAttempts++;
      errorEl.textContent = "Email ou mot de passe incorrect.";
      return;
    }
    accountRole = user.role || 'apprenant';
    currentUser = { name: user.name, email: user.email, photo: user.photo || null, phone: user.phone || '', birthdate: user.birthdate || '', country: user.country || '', city: user.city || '', address: user.address || '' };
  }
  loginAttempts = 0;
  errorEl.textContent = '';
  e.target.reset();
  pendingRole = null;
  state.userRole = accountRole;
  profilTab = 'infos';
  renderNav();
  showScreen(accountRole === 'entreprise' ? 'home-entreprise' : 'home-apprenant');
});

function logout(){
  currentUser = null;
  state.userRole = null;
  VoieStore.save();
  renderNav();
  showScreen('home');
}

function goHome(){
  renderNav();
  if(!currentUser){ showScreen('home'); return; }
  showScreen(state.userRole === 'entreprise' ? 'home-entreprise' : (state.userRole === 'apprenant' ? 'home-apprenant' : 'home'));
}

let pendingRole = null;
let currentScreen = 'home';

const NAV_APPRENANT = [
  ["home-apprenant","Accueil"], ["quiz","Découverte"], ["results","Résultats"], ["explorer","Explorer"],
  ["academie","Académie"], ["jobs","Emplois"]
];
const NAV_ENTREPRISE = [
  ["home-entreprise","Accueil"], ["jobs","Emplois"], ["candidats","Candidats"], ["business","Entreprises"]
];

function chooseRole(role){
  if(!currentUser){
    pendingRole = role;
    setAuthMode('signup');
    showScreen('login');
    return;
  }
  state.userRole = role;
  renderNav();
  showScreen(role === 'entreprise' ? 'home-entreprise' : 'home-apprenant');
}

// Mon parcours est désormais un onglet de la page Profil plutôt qu'un écran séparé.
function goToParcours(){
  profilTab = 'parcours';
  showScreen('profil');
}

function renderNav(){
  const tabs = document.getElementById('tabs');
  const account = document.getElementById('header-account');
  if(!currentUser){
    tabs.innerHTML = `<button data-screen="home">Accueil</button>`;
    account.innerHTML = `<button class="header-avatar-btn" onclick="showScreen('login')" style="color:var(--gold);">Connexion</button>`;
    return;
  }
  const list = state.userRole === 'entreprise' ? NAV_ENTREPRISE : (state.userRole === 'apprenant' ? NAV_APPRENANT : [["home","Accueil"]]);
  tabs.innerHTML = list.map(([id,label]) => `<button data-screen="${id}">${label}</button>`).join('');
  const avatarInner = currentUser.photo
    ? `<img src="${safeImgSrc(currentUser.photo)}" alt="">`
    : `<span class="avatar-init">${(currentUser.name||'?').trim().charAt(0).toUpperCase()}</span>`;
  account.innerHTML = `
    <button class="header-avatar-btn" onclick="showScreen('profil')">${avatarInner}${esc(firstName(currentUser.name))}</button>
    <button class="header-logout-btn" onclick="logout()">Se déconnecter</button>
  `;
}

/* ---------------- Navigation (avec support du bouton précédent du navigateur) ---------------- */
function showScreen(id, replace){
  // Garde de connexion : seul l'accueil public et la connexion restent accessibles sans compte.
  const publicScreens = ['home','login','apropos'];
  if(!currentUser && !publicScreens.includes(id)){ id = 'login'; }
  // Garde d'accès : chaque accueil et chaque espace est réservé au rôle correspondant.
  const apprenantOnly = ['quiz','results','explorer','academie'];
  if(id === 'home-apprenant' && state.userRole !== 'apprenant'){ id = currentUser ? (state.userRole === 'entreprise' ? 'home-entreprise' : 'home') : 'login'; }
  if(id === 'home-entreprise' && state.userRole !== 'entreprise'){ id = currentUser ? (state.userRole === 'apprenant' ? 'home-apprenant' : 'home') : 'login'; }
  if((id === 'business' || id === 'candidats') && state.userRole !== 'entreprise'){ id = currentUser ? 'home-apprenant' : 'login'; }
  if(apprenantOnly.includes(id) && state.userRole === 'entreprise'){ id = 'home-entreprise'; }

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('visible'));
  document.getElementById('screen-' + id).classList.add('visible');
  document.querySelectorAll('#tabs button[data-screen]').forEach(b => b.classList.toggle('active', b.dataset.screen === id));
  currentScreen = id;
  if(id === 'quiz') renderQuizCard();
  if(id === 'results') renderResults();
  if(id === 'explorer') renderExplorer();
  if(id === 'academie') renderAcademie();
  if(id === 'candidats') renderCandidats();
  if(id === 'jobs') renderJobs();
  if(id === 'business') renderBusiness();
  if(id === 'profil') renderProfil();
  if(id === 'home-apprenant') renderHomeApprenant();
  if(id === 'home-entreprise') renderHomeEntreprise();

  if(typeof window.history !== 'undefined' && history.pushState){
    if(replace) history.replaceState({ screen:id }, '', '#' + id);
    else history.pushState({ screen:id }, '', '#' + id);
  }
  window.scrollTo({top:0, behavior:'instant' in document.documentElement.style ? 'instant' : 'auto'});
  VoieStore.save();
}
window.addEventListener('popstate', e => {
  const id = (e.state && e.state.screen) || 'home';
  showScreen(id, true);
});
document.getElementById('tabs').addEventListener('click', e => {
  const btn = e.target.closest('button[data-screen]');
  if(btn) showScreen(btn.dataset.screen);
});

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------------- Modales accessibles : Échap, piège de focus, retour de focus ---------------- */
let modalStack = [];
let modalLastFocus = null;

function openModal(id){
  const el = document.getElementById(id);
  if(!el || modalStack.includes(id)) return;
  if(!modalStack.length) modalLastFocus = document.activeElement;
  modalStack.push(id);
  el.classList.add('open');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  const first = el.querySelector('button:not(.fiche-close), a[href], input, select, textarea') || el.querySelector('.fiche-close');
  if(first) first.focus();
}

function closeTopModal(){
  const id = modalStack.pop();
  if(!id) return;
  document.getElementById(id).classList.remove('open');
  document.getElementById(id).removeAttribute('aria-modal');
  if(!modalStack.length && modalLastFocus && modalLastFocus.focus) modalLastFocus.focus();
}

/* Ferme une modale précise (et tout ce qui a été ouvert par-dessus). */
function closeModal(id){
  while(modalStack.length){
    const top = modalStack.pop();
    const el = document.getElementById(top);
    if(el){ el.classList.remove('open'); el.removeAttribute('aria-modal'); }
    if(top === id) break;
  }
  if(!modalStack.length && modalLastFocus && modalLastFocus.focus) modalLastFocus.focus();
}

document.addEventListener('keydown', e => {
  if(e.key !== 'Escape' || !modalStack.length) return;
  closeTopModal();
});

// Piège de focus : la tabulation reste dans la modale ouverte.
document.addEventListener('focusin', e => {
  if(!modalStack.length) return;
  const el = document.getElementById(modalStack[modalStack.length - 1]);
  if(el && !el.contains(e.target)){
    const f = el.querySelector('button, a[href], input, select, textarea');
    if(f) f.focus();
  }
});

/* ---------------- Home: chiffres clés ---------------- */
function renderStatsRow(){
  const nbDomaines = Object.keys(SECTORS).length;
  const nbMetiers = Object.values(SECTORS).reduce((acc, s) => acc + s.metiers.length, 0);
  const nbFigures = Object.values(SECTORS).reduce((acc, s) => acc + s.figures.length, 0);
  const stats = [
    [nbDomaines, "domaines explorables"],
    [nbMetiers, "métiers détaillés"],
    [nbFigures, "parcours inspirants"],
    ["70%", "seuil de réussite à l'examen"]
  ];
  document.getElementById('stats-row').innerHTML = stats.map(([num,label]) =>
    `<div class="stat-block"><div class="num">${num}</div><div class="label">${label}</div></div>`
  ).join('');
}

function renderDomainShowcase(){
  const grid = document.getElementById('domain-grid');
  if(!grid) return;
  grid.innerHTML = Object.entries(SECTORS).map(([key, s]) => `
    <div class="domain-chip">
      <span class="dc-icon">${ICONS[key]}</span>
      <span>${s.name}</span>
    </div>
  `).join('');
}

function renderStepFlowIcons(){
  const icons = { 'sf-icon-1': ICONS.dot, 'sf-icon-2': ICONS.check, 'sf-icon-3': ICONS.book, 'sf-icon-4': ICONS.commerce };
  Object.entries(icons).forEach(([id, svg]) => {
    const el = document.getElementById(id);
    if(el) el.innerHTML = svg;
  });
}

const FAQ_ITEMS = [
  { q:"Est-ce que je dois payer pour utiliser Voie ?", a:"Ce prototype de démonstration est entièrement gratuit à explorer. Le modèle économique d'une future version réelle reste à définir." },
  { q:"Voie remplace-t-il un(e) conseiller(ère) d'orientation humain(e) ?", a:"Non — Voie est pensé comme un outil d'exploration et de suivi complémentaire, pas comme un remplacement du dialogue avec un conseiller, un enseignant ou un parent." },
  { q:"Mes données et mes résultats sont-ils partagés sans mon accord ?", a:"Dans cette démonstration, un profil n'est visible par les entreprises que via la section Candidats — dans une vraie version, ce partage devrait toujours reposer sur un consentement explicite de la personne." },
  { q:"Combien de temps prend le parcours complet d'un domaine ?", a:"Chaque domaine est structuré en plusieurs modules représentant, ensemble, 4 à 6 mois de progression — comme un vrai cursus, pas un test qu'on boucle en quelques minutes." },
  { q:"Une entreprise peut-elle publier n'importe quelle offre sans vérification ?", a:"Non — seules les entreprises ayant complété une vérification (nom, identifiant fiscal, secteur) peuvent publier des offres, qui apparaissent ensuite avec un badge « vérifiée »." }
];

function renderFaq(){
  const list = document.getElementById('faq-list');
  if(!list) return;
  list.innerHTML = FAQ_ITEMS.map((item, i) => `
    <div class="faq-item" id="faq-${i}">
      <button class="faq-q" onclick="toggleFaq(${i})">
        <span>${item.q}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="faq-a"><p>${item.a}</p></div>
    </div>
  `).join('');
}

function toggleFaq(i){
  const item = document.getElementById(`faq-${i}`);
  item.classList.toggle('open');
}

function firstName(name){ return (name || '').trim().split(' ')[0] || ''; }

function renderHomeApprenant(){
  document.getElementById('ha-greeting').textContent = currentUser ? `Bon retour, ${esc(firstName(currentUser.name))}` : "Bon retour";
  document.getElementById('ha-icon-quiz').innerHTML = ICONS.dot;
  document.getElementById('ha-icon-parcours').innerHTML = ICONS.check;
  document.getElementById('ha-icon-academie').innerHTML = ICONS.book;
  document.getElementById('ha-icon-jobs').innerHTML = ICONS.commerce;
}

function renderHomeEntreprise(){
  document.getElementById('he-greeting').textContent = currentUser ? `Bienvenue, ${esc(firstName(currentUser.name))}` : "Espace entreprise";
  document.getElementById('he-icon-business').innerHTML = ICONS.commerce;
  document.getElementById('he-icon-candidats').innerHTML = ICONS.psychologie;

  const nbCandidats = candidatsData.length;
  const nbOffres = jobsData.length;
  const nbVerifiees = jobsData.filter(j => j.verifie).length;
  const stats = [
    [nbCandidats, "profils d'apprenants consultables"],
    [nbOffres, "offres publiées sur la plateforme"],
    [nbVerifiees, "offres vérifiées"],
    [Object.keys(SECTORS).length, "secteurs couverts"]
  ];
  document.getElementById('stats-row-entreprise').innerHTML = stats.map(([num,label]) =>
    `<div class="stat-block"><div class="num">${num}</div><div class="label">${label}</div></div>`
  ).join('');
}

/* ---------------- Quiz ---------------- */
function renderQuizProgress(){
  const wrap = document.getElementById('quiz-progress');
  wrap.innerHTML = QUIZ.map((_, i) => {
    const cls = i < state.quizIndex ? 'done' : (i === state.quizIndex ? 'current' : '');
    return `<span class="${cls}"><i></i></span>`;
  }).join('');
}

function renderQuizCard(){
  if(state.quizIndex >= QUIZ.length){
    state.quizDone = true;
    computeResults();
    showScreen('results');
    return;
  }
  renderQuizProgress();
  const card = QUIZ[state.quizIndex];
  const counter = `<span class="eyebrow">${card.type === 'choice' ? 'Choix' : 'Situation'} ${state.quizIndex + 1} / ${QUIZ.length}</span>`;

  if(card.type === 'choice'){
    document.getElementById('quiz-card').innerHTML = `
      ${counter}
      <h2>${card.text}</h2>
      <div class="quiz-choices choice-mode">
        ${card.options.map((opt, i) => `<button onclick="answerChoice(${i})">${opt.label}</button>`).join('')}
      </div>
    `;
  } else {
    document.getElementById('quiz-card').innerHTML = `
      ${counter}
      <h2>${card.text}</h2>
      <div class="quiz-choices">
        <button onclick="answerScale(2)">J'adore ça</button>
        <button onclick="answerScale(1)">Bof, pourquoi pas</button>
        <button onclick="answerScale(0)">Pas pour moi</button>
      </div>
    `;
  }
}

function answerScale(value){
  const card = QUIZ[state.quizIndex];
  card.tags.forEach(t => state.scores[t] += value);
  card.meta.forEach(m => state.metaScores[m] += value);
  state.quizIndex++;
  renderQuizCard();
}

function answerChoice(optionIndex){
  const opt = QUIZ[state.quizIndex].options[optionIndex];
  opt.tags.forEach(t => state.scores[t] += CHOICE_WEIGHT);
  opt.meta.forEach(m => state.metaScores[m] += CHOICE_WEIGHT);
  state.quizIndex++;
  renderQuizCard();
}

// Score maximal théorique par secteur, pour normaliser les pourcentages
// malgré le mélange d'échelles (poids 2) et de choix forcés (poids 3).
function computeMaxPerSector(){
  const max = {}; Object.keys(SECTORS).forEach(k => max[k] = 0);
  QUIZ.forEach(card => {
    if(card.type === 'choice'){
      card.options.forEach(opt => opt.tags.forEach(t => max[t] += CHOICE_WEIGHT));
    } else {
      card.tags.forEach(t => max[t] += SCALE_MAX);
    }
  });
  return max;
}

function computeResults(){
  const maxPerSector = computeMaxPerSector();
  const ranked = Object.entries(state.scores)
    .map(([key, val]) => ({ key, val, pct: Math.round((val / (maxPerSector[key] || 1)) * 100) }))
    .sort((a,b) => b.val/(maxPerSector[b.key]||1) - a.val/(maxPerSector[a.key]||1));
  state.topSectors = ranked.slice(0,3).map(r => ({ key:r.key, pct:Math.max(0, Math.min(100, r.pct)) }));
}

function renderResults(){
  if(!state.quizDone){
    document.getElementById('results-list').innerHTML = `<div class="empty">Fais d'abord le test de découverte pour voir tes résultats.<br><br><button class="btn btn-gold btn-sm" onclick="showScreen('quiz')">Commencer le test</button></div>`;
    return;
  }
  document.getElementById('results-list').innerHTML = state.topSectors.map((r, i) => {
    const s = SECTORS[r.key];
    const chosen = state.sectorChosen === r.key;
    return `
    <div class="panel match-card">
      <span class="match-rank">MATCH N°${i+1} — ${r.pct}%</span>
      <div style="display:flex; align-items:center; gap:10px; margin-top:2px;">
        <span style="color:var(--gold)">${ICONS[r.key]}</span>
        <h3 style="margin:0;">${s.name}</h3>
      </div>
      <div class="match-bar"><i style="width:${r.pct}%"></i></div>
      <p style="color:var(--text-muted); font-size:14px; margin:0;">${s.desc}</p>
      <p style="color:var(--text-muted); font-size:13px; margin:12px 0 4px;"><strong style="color:var(--text);">Potentiel du domaine</strong></p>
      <p style="color:var(--text-muted); font-size:13px; margin:0 0 14px;">${s.potentiel}</p>
      <p style="font-size:13px; color:var(--text); margin:0 0 6px; font-weight:600;">Métiers à explorer — clique pour en savoir plus</p>
      <div>${s.metiers.map(m => `<button class="metier-chip" onclick="openFiche('${r.key}','${m.id}')">${m.nom}</button>`).join('')}</div>
      <div style="margin-top:18px;">
        <button class="btn ${chosen ? 'btn-gold' : 'btn-ghost'} btn-sm" onclick="chooseSector('${r.key}')">
          ${chosen ? "Voie choisie ✓" : "Choisir cette voie"}
        </button>
      </div>
    </div>`;
  }).join('');
}

function chooseSector(key){
  state.sectorChosen = key;
  toast("Voie choisie : " + SECTORS[key].name);
  renderResults();
}

/* ---------------- Explorer : catalogue complet des métiers ---------------- */
let explorerFilter = 'tous';
function renderExplorer(){
  const filters = document.getElementById('explorer-filters');
  filters.innerHTML = `<button class="${explorerFilter==='tous'?'active':''}" onclick="setExplorerFilter('tous')">Tous les domaines</button>` +
    Object.entries(SECTORS).map(([key, s]) =>
      `<button class="${explorerFilter===key?'active':''}" onclick="setExplorerFilter('${key}')">${ICONS[key]} ${s.name}</button>`
    ).join('');

  const domains = explorerFilter === 'tous' ? Object.entries(SECTORS) : Object.entries(SECTORS).filter(([k]) => k === explorerFilter);
  document.getElementById('explorer-list').innerHTML = domains.map(([key, s]) => `
    <div class="explorer-domain">
      <div class="explorer-domain-head">${ICONS[key]}<h3>${s.name}</h3></div>
      <p>${s.desc}</p>
      <div class="explorer-metiers">
        ${s.metiers.map(m => `
          <button class="explorer-metier-card" onclick="openFiche('${key}','${m.id}')">
            <h4>${m.nom}</h4>
            <span>${m.filiere}</span>
          </button>`).join('')}
      </div>
    </div>
  `).join('');
}
function setExplorerFilter(key){ explorerFilter = key; renderExplorer(); }

/* ---------------- Académie : leçons, exercices et examen, en 3 blocs séparés ---------------- */
// Modules pédagogiques par domaine, inspirés de vrais programmes de référence (unités d'enseignement
// de première année de santé type PASS, structure de certifications freeCodeCamp par blocs/modules, etc.)
// Le Module 1 reprend le contenu déjà rédigé (leçons/exercices/examen). Les modules 2 et 3 esquissent
// un vrai programme pluri-mensuel : leur contenu détaillé reste à rédiger dans une prochaine itération.
const MODULE_TITRES = ["Module 1 — Fondamentaux", "Module 2 — Approfondissement", "Module 3 — Spécialisation & projet final"];
const MODULE_DUREE = ["3 à 4 semaines", "6 à 8 semaines", "8 à 10 semaines"];
const MODULE_TOPICS = {
  sante: [
    ["Anatomie et physiologie des grands systèmes (cardiovasculaire, respiratoire, digestif)","Notions de pharmacologie : comment agissent les médicaments","Santé publique et épidémiologie : mesurer et prévenir à l'échelle d'une population","Sémiologie de base : reconnaître et décrire des symptômes"],
    ["Études de cas cliniques guidées par spécialité (pédiatrie, gériatrie, urgences)","Éthique médicale et relation soignant-patient approfondie","Stage d'observation simulé et carnet de bord","Projet final : présenter un plan de prise en charge complet"]
  ],
  technologie: [
    ["Structures de données et algorithmes avancés","Bases de données relationnelles : modélisation et SQL","Développement d'API et architecture back-end","Sécurité applicative approfondie (authentification, injections, chiffrement)"],
    ["Frameworks front-end modernes (composants, état, routage)","Déploiement et intégration continue","Travail en équipe avec un système de gestion de versions","Projet final : construire et déployer une application complète"]
  ],
  art: [
    ["Histoire du design et grands courants stylistiques","Typographie et systèmes de grille","Logiciels professionnels (vectoriel, retouche, maquette 3D)","Droits d'auteur et pratiques professionnelles du secteur créatif"],
    ["Étude de cas : refonte complète d'une identité visuelle ou d'un espace","Relation client et cahier des charges","Constitution du book professionnel","Projet final : dossier de candidature pour un studio ou une agence"]
  ],
  commerce: [
    ["Comptabilité générale et lecture d'un bilan","Marketing digital et acquisition client","Négociation commerciale avancée","Droit des affaires et bases juridiques de l'entreprise"],
    ["Étude de cas : construire un business plan complet","Gestion d'équipe et leadership","Financement (prêts, investisseurs, subventions)","Projet final : présenter un projet devant un jury simulé"]
  ],
  agriculture: [
    ["Science du sol et fertilisation raisonnée","Gestion de l'eau et irrigation","Santé animale de base et biosécurité en élevage","Économie agricole et filières de commercialisation"],
    ["Étude de cas : concevoir un plan de culture ou d'élevage sur une saison","Agriculture climato-intelligente et adaptation au changement climatique","Normes de certification et export","Projet final : plan d'exploitation complet"]
  ],
  education: [
    ["Psychologie de l'apprentissage et développement de l'enfant","Conception de séquences pédagogiques","Évaluation et notation : méthodes et limites","Gestion de classe et dynamique de groupe"],
    ["Étude de cas : accompagner un élève en difficulté spécifique","Numérique éducatif et outils pédagogiques modernes","Cadre légal et déontologie de l'enseignant","Projet final : concevoir et présenter une séquence complète"]
  ],
  ingenierie: [
    ["Résistance des matériaux et statique appliquée","Dessin technique et lecture de plans","Thermodynamique et systèmes énergétiques de base","Normes de sécurité et de qualité industrielle"],
    ["Étude de cas : dimensionner un ouvrage ou un système simple","Gestion de projet technique et coordination de chantier","Maintenance prédictive et fiabilité des systèmes","Projet final : dossier technique complet"]
  ],
  psychologie: [
    ["Grands courants de la psychologie (cognitif, comportemental, humaniste)","Techniques d'entretien et d'écoute active approfondies","Repères de psychopathologie, sans poser de diagnostic","Cadre légal, déontologie et limites du secret professionnel"],
    ["Étude de cas anonymisés et supervision de pratique","Médiation et gestion de conflits en groupe","Ressources humaines : recrutement et bien-être au travail","Projet final : présenter une démarche d'accompagnement complète"]
  ],
  mode: [
    ["Histoire de la mode et grands courants stylistiques","Techniques de pose, de podium et direction artistique","Bases du stylisme et de la construction de silhouette","Réseaux sociaux et image de marque personnelle"],
    ["Étude de cas : construire un shooting ou un défilé de A à Z","Droit à l'image et contrats du secteur","Gestion de carrière et relation avec les agences","Projet final : book professionnel complet"]
  ],
  aviation: [
    ["Météorologie aéronautique de base","Réglementation aérienne et espace aérien","Systèmes de navigation et instruments de vol","Communication radio normalisée (phraséologie)"],
    ["Étude de cas : gestion d'une situation d'urgence simulée","Facteurs humains et gestion du stress en vol","Coordination sol-bord approfondie","Projet final : simulation complète d'un vol, du briefing à l'atterrissage"]
  ]
};

// Contenu détaillé du Module 2, déjà rédigé pour certains domaines (le reste affiche encore
// le programme prévu — voir MODULE_TOPICS ci-dessus — en attendant sa rédaction complète).
const MODULE2_CONTENT = {
  technologie: {
    lecons:[
      { titre:"Structures de données et algorithmes avancés",
        definition:"Une structure de données est une façon organisée de stocker et d'accéder à des informations en mémoire ; le choix de la bonne structure change radicalement la rapidité et la simplicité d'un programme.",
        contenu:[
          "Au-delà des variables simples, un développeur manipule des structures comme les tableaux, les listes chaînées, les piles, les files, les arbres et les tables de hachage. Chacune a des forces différentes : un tableau permet un accès instantané à un élément par sa position, tandis qu'une liste chaînée facilite l'insertion et la suppression sans décaler tout le reste.",
          "Le choix d'une structure de données n'est jamais neutre : rechercher un élément dans une liste non triée demande de parcourir potentiellement tous les éléments un par un, alors qu'une table de hachage permet souvent d'y accéder presque instantanément, au prix d'une consommation de mémoire plus importante.",
          "Les algorithmes de tri et de recherche s'appuient sur ces structures : comprendre pourquoi un algorithme est plus rapide qu'un autre sur de grands volumes de données (des milliers, puis des millions d'éléments) devient essentiel dès qu'une application doit rester rapide en grandissant." ],
        exemple:"Une application de messagerie qui doit retrouver instantanément la conversation associée à un contact utilise une table de hachage (contact → conversation) plutôt qu'une liste parcourue un par un — sur dix contacts la différence est invisible, sur un million elle devient flagrante.",
        note:"Choisir systématiquement la structure de données la plus familière plutôt que la plus adaptée au problème est une erreur fréquente qui, sur un projet qui grossit, peut ralentir une application au point de la rendre inutilisable.",
        pointscles:["Le choix de structure de données dépend du type d'opération le plus fréquent (lecture, insertion, recherche).","Un algorithme efficace sur 10 éléments peut devenir très lent sur 1 million s'il n'est pas adapté.","Les tables de hachage offrent un accès rapide au prix d'une mémoire supplémentaire."] },
      { titre:"Bases de données relationnelles : modélisation et SQL",
        definition:"Une base de données relationnelle organise l'information en tables reliées entre elles par des clés, et le langage SQL permet d'interroger, filtrer et croiser ces tables.",
        contenu:[
          "Avant d'écrire une seule requête, on modélise : quelles tables existent (utilisateurs, commandes, produits), quelles colonnes elles contiennent, et comment elles se relient entre elles via des clés primaires et étrangères. Une modélisation bâclée se paie plus tard par des données incohérentes ou dupliquées.",
          "Le langage SQL permet ensuite de répondre à des questions précises sur ces données : combien de commandes un client a-t-il passées, quel produit se vend le mieux ce mois-ci. Une requête bien écrite peut traiter des millions de lignes en quelques millisecondes si la base est correctement indexée.",
          "La normalisation — éviter de répéter la même information dans plusieurs tables — réduit les risques d'incohérence, mais elle a un coût : des requêtes plus complexes qui doivent croiser plusieurs tables. Un bon compromis dépend du contexte réel de l'application." ],
        exemple:"Une boutique en ligne stocke les clients dans une table 'clients' et les commandes dans une table 'commandes' reliées par l'identifiant du client, plutôt que de répéter le nom et l'adresse dans chaque commande — si le client déménage, une seule mise à jour suffit.",
        note:"Stocker la même information à plusieurs endroits différents (dupliquer l'adresse d'un client dans chaque commande) est une erreur classique qui crée des incohérences dès que l'information change à un seul endroit.",
        pointscles:["Une bonne modélisation précède l'écriture des requêtes SQL.","Les clés étrangères relient les tables entre elles sans dupliquer l'information.","Un index bien choisi peut rendre une requête des centaines de fois plus rapide."] },
      { titre:"Développement d'API et architecture back-end",
        definition:"Une API (interface de programmation) est le point d'entrée par lequel une application front-end communique avec un serveur back-end pour lire ou modifier des données.",
        contenu:[
          "Le back-end héberge la logique métier et les données d'une application : c'est lui qui vérifie qu'un utilisateur est autorisé à effectuer une action, applique les règles de l'entreprise, et communique avec la base de données. Le front-end, lui, ne fait qu'afficher et transmettre les demandes de l'utilisateur.",
          "Une API bien conçue expose des points d'accès clairs et prévisibles (récupérer la liste des offres d'emploi, publier une candidature), documentés de façon à ce qu'une autre équipe puisse les utiliser sans lire tout le code source.",
          "L'architecture back-end doit aussi anticiper la montée en charge : que se passe-t-il si mille personnes utilisent l'application en même temps plutôt qu'une seule ? La mise en cache de données fréquemment demandées permet souvent d'absorber cette charge sans tout ralentir." ],
        exemple:"Une application mobile de recherche d'emploi appelle une API pour récupérer la liste des offres correspondant à un secteur : le front-end envoie simplement le secteur choisi, et c'est le back-end qui interroge la base, applique les filtres, et renvoie une liste triée.",
        note:"Faire porter toute la logique métier au front-end (vérifier soi-même côté application si un utilisateur a le droit d'agir) est une erreur de sécurité fréquente : cette vérification doit toujours être refaite côté serveur, car le front-end peut être manipulé par la personne qui l'utilise.",
        pointscles:["Le back-end porte la logique métier et la sécurité, le front-end ne fait qu'afficher et transmettre.","Une API bien documentée permet à d'autres équipes de l'utiliser sans lire tout le code source.","Toute vérification de sécurité doit être refaite côté serveur, jamais seulement côté client."] },
      { titre:"Sécurité applicative approfondie",
        definition:"La sécurité applicative approfondie couvre les techniques qui protègent un logiciel contre des attaques précises : injection de code, usurpation d'identité, ou accès non autorisé à des données.",
        contenu:[
          "Une injection SQL survient quand une donnée saisie par un utilisateur est directement insérée dans une requête sans être filtrée, permettant à un attaquant de manipuler cette requête. Les requêtes préparées, qui séparent la structure de la requête des données fournies, protègent efficacement contre ce risque.",
          "L'authentification (vérifier qui est l'utilisateur) et l'autorisation (vérifier ce qu'il a le droit de faire) sont deux étapes distinctes trop souvent confondues : un utilisateur bien authentifié peut ne pas avoir le droit d'accéder à une ressource précise, et le code doit vérifier les deux séparément à chaque action sensible.",
          "Les jetons de session (tokens) permettent de garder un utilisateur connecté sans lui redemander son mot de passe à chaque action, mais ils doivent être stockés et transmis de façon chiffrée, sinon ils deviennent eux-mêmes une porte d'entrée pour un attaquant." ],
        exemple:"Un site marchand vérifie qu'un client est connecté avant de lui montrer son compte, mais vérifie en plus, à chaque demande de facture, que la facture appartient bien à ce client précis — sans cette seconde vérification, un client connecté pourrait accéder aux factures d'autres clients en modifiant un numéro dans l'adresse.",
        note:"Confondre authentification et autorisation est une des failles de sécurité les plus fréquentes : vérifier qu'un utilisateur est connecté ne garantit absolument pas qu'il a le droit d'accéder à une ressource précise.",
        pointscles:["Les requêtes préparées protègent contre l'injection SQL en séparant structure et données.","Authentification et autorisation sont deux vérifications distinctes, toutes deux nécessaires.","Les jetons de session doivent être transmis de façon chiffrée pour ne pas devenir une faille."] }
    ],
    exercices:[
      { q:"Pourquoi une table de hachage permet-elle un accès plus rapide qu'une liste non triée ?", options:["Elle organise les données pour un accès quasi instantané par clé, sans parcourir toute la liste","Elle trie automatiquement les données par ordre alphabétique","Elle occupe toujours moins de mémoire qu'une liste"], correct:0, explication:"La table de hachage calcule directement où se trouve une donnée plutôt que de tout parcourir." },
      { q:"Pourquoi éviter de dupliquer les mêmes informations dans plusieurs tables d'une base relationnelle ?", options:["Pour éviter les incohérences si l'information change à un seul endroit","Parce que le SQL l'interdit techniquement","Ça n'a pas de réelle importance"], correct:0, explication:"Une donnée dupliquée peut devenir incohérente si elle est mise à jour à un seul endroit et oubliée ailleurs." },
      { q:"Quel est le rôle principal d'une API dans une architecture back-end ?", options:["Servir de point d'entrée pour que le front-end communique avec le serveur et les données","Afficher directement les pages web à l'utilisateur","Remplacer entièrement la base de données"], correct:0, explication:"L'API est l'interface de communication entre front-end et back-end." },
      { q:"Pourquoi toute vérification de sécurité doit-elle être refaite côté serveur ?", options:["Parce que le code exécuté côté client peut être manipulé par l'utilisateur","Parce que c'est plus rapide côté serveur","Ce n'est pas vraiment nécessaire si le front-end vérifie déjà"], correct:0, explication:"Le front-end n'est pas un environnement de confiance : il peut être modifié par la personne qui l'utilise." },
      { q:"Que permettent les requêtes préparées en base de données ?", options:["Séparer la structure de la requête des données fournies, ce qui protège contre l'injection SQL","Accélérer systématiquement toutes les requêtes","Éviter d'avoir à modéliser une base de données"], correct:0, explication:"Cette séparation empêche une donnée malveillante de modifier la structure de la requête." },
      { q:"Quelle est la différence entre authentification et autorisation ?", options:["L'authentification vérifie qui est l'utilisateur, l'autorisation vérifie ce qu'il a le droit de faire","Ce sont deux mots pour la même chose","L'autorisation vérifie le mot de passe, l'authentification vérifie les droits"], correct:0, explication:"Ce sont deux vérifications distinctes, toutes deux nécessaires à chaque action sensible." }
    ],
    examen:[
      { q:"Cas pratique — Une application de recherche d'emploi doit retrouver instantanément les offres correspondant à un secteur, parmi des millions d'offres. Quelle structure est la plus adaptée ?", options:["Une table de hachage indexée par secteur","Parcourir toutes les offres une par une à chaque recherche","Une simple variable globale"], correct:0 },
      { q:"La normalisation d'une base de données vise principalement à...", options:["Réduire la duplication d'information et les incohérences qui en découlent","Rendre toutes les requêtes plus courtes à écrire","Supprimer le besoin de clés étrangères"], correct:0 },
      { q:"Cas pratique — Un formulaire de recherche insère directement le texte saisi par l'utilisateur dans une requête SQL sans le filtrer. Quel est le risque principal ?", options:["Une injection SQL permettant à un attaquant de manipuler la requête","Un simple ralentissement du site","Aucun risque si le champ est court"], correct:0 },
      { q:"Le rôle du back-end dans une architecture web est de...", options:["Porter la logique métier, la sécurité et l'accès aux données","Uniquement afficher les pages à l'utilisateur","Remplacer le travail du designer UX/UI"], correct:0 },
      { q:"Cas pratique — Un client connecté modifie l'URL pour tenter d'accéder à la facture d'un autre client en changeant un numéro. Que doit avoir vérifié le serveur pour bloquer cet accès ?", options:["Que la facture demandée appartient bien à l'utilisateur authentifié, pas seulement qu'il est connecté","Rien, l'authentification suffit toujours","Que l'utilisateur a un abonnement payant"], correct:0 },
      { q:"Pourquoi les jetons de session doivent-ils être transmis de façon chiffrée ?", options:["Pour éviter qu'un attaquant les intercepte et usurpe l'identité de l'utilisateur","Parce que sinon ils expirent plus vite","Ce n'est pas vraiment nécessaire en pratique"], correct:0 },
      { q:"Cas pratique — Un algorithme de recherche parcourt un par un un million d'éléments à chaque requête, rendant l'application très lente. Quelle amélioration est la plus pertinente ?", options:["Utiliser une structure de données adaptée (index, table de hachage) pour éviter de tout parcourir","Ajouter plus de texte explicatif dans le code","Réduire la taille de l'écran de l'utilisateur"], correct:0 },
      { q:"Pourquoi une API bien documentée facilite-t-elle le travail en équipe ?", options:["Elle permet à d'autres développeurs de l'utiliser sans avoir à lire tout le code source sous-jacent","Elle remplace le besoin de tests","Elle n'a pas de réel effet sur le travail en équipe"], correct:0 }
    ]
  },
  sante: {
    lecons:[
      { titre:"Anatomie et physiologie des grands systèmes",
        definition:"L'anatomie décrit la structure du corps humain (organes, os, muscles), tandis que la physiologie explique comment ces structures fonctionnent ensemble pour maintenir la vie.",
        contenu:[
          "Le système cardiovasculaire transporte l'oxygène et les nutriments vers chaque cellule du corps, tandis que le système respiratoire assure les échanges gazeux entre l'air inspiré et le sang. Comprendre comment ces deux systèmes coopèrent est indispensable pour interpréter des symptômes comme un essoufflement ou une douleur thoracique.",
          "Le système digestif transforme les aliments en nutriments utilisables par l'organisme, un processus qui commence dès la bouche et se poursuit sur plusieurs mètres d'intestin. Une bonne compréhension de ce trajet aide à localiser l'origine probable d'une douleur abdominale selon sa position exacte.",
          "Ces systèmes ne fonctionnent jamais isolément : une maladie cardiaque peut provoquer une accumulation de liquide dans les poumons, et un problème digestif peut affecter l'état général de tout l'organisme. Cette vision d'ensemble caractérise le raisonnement clinique." ],
        exemple:"Un patient essoufflé au moindre effort peut avoir un problème purement respiratoire (asthme), purement cardiaque (insuffisance cardiaque), ou les deux à la fois — d'où l'importance d'examiner systématiquement les deux systèmes avant de conclure.",
        note:"Se concentrer uniquement sur l'organe qui semble évident (les poumons pour un essoufflement) sans vérifier les systèmes voisins est une erreur qui peut retarder un diagnostic correct.",
        pointscles:["Le corps fonctionne comme un ensemble de systèmes interconnectés, pas isolés.","La position exacte d'une douleur abdominale aide à orienter vers l'organe concerné.","Un symptôme peut avoir plusieurs origines possibles à examiner systématiquement."] },
      { titre:"Notions de pharmacologie : comment agissent les médicaments",
        definition:"La pharmacologie étudie comment les substances médicamenteuses agissent sur l'organisme, à quelle dose, et avec quels effets secondaires possibles.",
        contenu:[
          "Un médicament agit généralement en se fixant sur une cible précise dans l'organisme (un récepteur, une enzyme) pour en modifier l'activité. La dose administrée doit être suffisante pour produire l'effet recherché, sans dépasser le seuil à partir duquel les effets indésirables deviennent trop importants — la marge thérapeutique.",
          "Deux médicaments pris ensemble peuvent interagir : l'un peut renforcer ou au contraire annuler l'effet de l'autre, parfois dangereusement. C'est pourquoi un soignant vérifie systématiquement l'ensemble des traitements déjà pris par un patient avant d'en prescrire un nouveau.",
          "L'organisme élimine les médicaments à des vitesses différentes selon l'âge, la fonction rénale ou hépatique de la personne : une dose standard peut s'accumuler dangereusement chez une personne dont le corps élimine plus lentement, ce qui explique les doses adaptées chez les personnes âgées." ],
        exemple:"Un patient âgé avec une fonction rénale réduite reçoit une dose de médicament plus faible que la dose standard adulte, car son organisme élimine plus lentement le produit — une dose standard pourrait s'accumuler et devenir toxique.",
        note:"Prescrire ou administrer une dose standard sans tenir compte de l'âge ou de l'état des organes d'élimination est une erreur qui peut transformer un traitement utile en traitement dangereux.",
        pointscles:["Chaque médicament a une marge thérapeutique entre dose efficace et dose dangereuse.","Les interactions médicamenteuses doivent être vérifiées avant toute nouvelle prescription.","L'âge et la fonction rénale/hépatique influencent la dose adaptée à chaque personne."] },
      { titre:"Santé publique et épidémiologie",
        definition:"L'épidémiologie mesure la fréquence et la répartition des maladies dans une population, pour orienter les actions de santé publique les plus efficaces.",
        contenu:[
          "Des indicateurs comme le taux d'incidence (nouveaux cas sur une période) ou le taux de mortalité permettent de comparer objectivement l'ampleur d'un problème de santé d'une région à l'autre, plutôt que de se fier à des impressions individuelles.",
          "Une campagne de santé publique efficace cible les causes qui touchent le plus grand nombre de personnes au moindre coût : vacciner une population contre une maladie qui circule activement a souvent plus d'impact que traiter un par un les cas déjà déclarés.",
          "L'épidémiologie sert aussi à détecter rapidement une épidémie naissante : une hausse inhabituelle de cas similaires dans une même zone et une même période est un signal qui doit déclencher une investigation avant que la situation ne s'aggrave." ],
        exemple:"Une hausse soudaine de cas de fièvre dans un même quartier, sur une courte période, déclenche une enquête épidémiologique qui recherche une source commune (eau contaminée, aliment, moustique) plutôt que de traiter chaque cas indépendamment.",
        note:"Réagir cas par cas à une épidémie naissante, sans jamais chercher la cause commune à l'échelle de la population, retarde une action qui pourrait arrêter la propagation bien plus tôt.",
        pointscles:["Les indicateurs épidémiologiques permettent de comparer objectivement des situations de santé.","Une action de prévention ciblée touche souvent plus de monde qu'un traitement individuel répété.","Une hausse inhabituelle de cas similaires doit déclencher une recherche de cause commune."] },
      { titre:"Sémiologie de base : reconnaître et décrire des symptômes",
        definition:"La sémiologie médicale est l'art de recueillir, décrire et interpréter les symptômes et signes cliniques d'un patient de façon rigoureuse et reproductible.",
        contenu:[
          "Décrire un symptôme avec précision — depuis quand, où exactement, ce qui l'aggrave ou le soulage, son intensité — apporte beaucoup plus d'informations utiles qu'une description vague comme « j'ai mal ». Cette rigueur descriptive est la base de tout diagnostic ultérieur.",
          "On distingue un symptôme (ce que ressent le patient) d'un signe clinique (ce que le soignant observe objectivement, comme une fièvre mesurée ou une rougeur). Les deux se complètent mais ne se remplacent pas l'un l'autre.",
          "Une même plainte peut correspondre à des situations très différentes selon la façon dont elle est décrite : une douleur qui apparaît à l'effort et disparaît au repos n'oriente pas vers les mêmes causes qu'une douleur constante, présente même immobile." ],
        exemple:"Un patient qui décrit une douleur thoracique apparaissant uniquement à l'effort et disparaissant au repos oriente davantage vers une cause cardiaque liée à l'effort, tandis qu'une douleur constante oriente vers d'autres pistes à explorer.",
        note:"Se contenter d'une plainte vague sans la faire préciser (localisation, déclencheur, durée) prive le soignant d'informations souvent décisives pour orienter le diagnostic.",
        pointscles:["Une description précise d'un symptôme oriente bien plus efficacement le diagnostic qu'une plainte vague.","Symptôme (ressenti) et signe clinique (observé) se complètent sans se substituer.","Le contexte d'apparition d'un symptôme (effort, repos, horaire) est une information clé."] }
    ],
    exercices:[
      { q:"Pourquoi examine-t-on systématiquement plusieurs systèmes face à un essoufflement ?", options:["Parce qu'un même symptôme peut avoir une origine respiratoire, cardiaque, ou les deux à la fois","Parce que les poumons sont toujours en cause","Ce n'est pas vraiment nécessaire"], correct:0, explication:"Plusieurs systèmes peuvent expliquer un même symptôme — il faut les examiner ensemble." },
      { q:"Pourquoi adapte-t-on la dose d'un médicament chez une personne âgée ?", options:["Parce que son organisme peut éliminer le produit plus lentement, risquant une accumulation toxique","Parce que les personnes âgées ont toujours plus de moyens financiers","Ce n'est qu'une habitude sans réelle justification"], correct:0, explication:"Une élimination plus lente impose souvent une dose réduite pour éviter l'accumulation." },
      { q:"Qu'est-ce qu'un taux d'incidence en épidémiologie ?", options:["Le nombre de nouveaux cas d'une maladie sur une période donnée","Le nombre total de décès dans un pays","Le prix moyen d'un traitement"], correct:0, explication:"L'incidence mesure l'apparition de nouveaux cas, pas le total cumulé." },
      { q:"Quelle est la différence entre un symptôme et un signe clinique ?", options:["Le symptôme est ressenti par le patient, le signe clinique est observé objectivement par le soignant","Ce sont exactement la même chose","Le signe clinique concerne uniquement les analyses de sang"], correct:0, explication:"L'un est subjectif (ressenti), l'autre objectif (observé)." },
      { q:"Pourquoi vérifier les interactions médicamenteuses avant une nouvelle prescription ?", options:["Parce que deux médicaments combinés peuvent renforcer ou annuler dangereusement leurs effets respectifs","Parce que la loi l'exige sans autre raison médicale","Ce n'est utile que pour les traitements très rares"], correct:0, explication:"Les interactions peuvent être dangereuses et doivent être vérifiées systématiquement." },
      { q:"Pourquoi la localisation précise d'une douleur abdominale est-elle une information utile ?", options:["Elle aide à orienter vers l'organe probablement concerné","Elle n'a aucune utilité diagnostique","Elle sert uniquement à remplir un dossier administratif"], correct:0, explication:"La position d'une douleur oriente fortement le raisonnement clinique." }
    ],
    examen:[
      { q:"Cas pratique — Un patient présente une douleur thoracique apparaissant uniquement à l'effort et disparaissant au repos. Vers quelle piste cela oriente-t-il en priorité ?", options:["Une cause cardiaque liée à l'effort","Une cause purement digestive sans lien avec l'effort","Aucune piste ne peut être envisagée sans scanner"], correct:0 },
      { q:"La marge thérapeutique d'un médicament désigne...", options:["L'écart entre la dose efficace et la dose qui devient dangereuse","Le prix de vente autorisé du médicament","La durée de conservation du médicament"], correct:0 },
      { q:"Cas pratique — Plusieurs cas de fièvre inhabituelle apparaissent en quelques jours dans le même quartier. Quelle est la démarche de santé publique la plus rigoureuse ?", options:["Lancer une enquête pour identifier une cause commune avant que la situation ne s'aggrave","Traiter chaque cas indépendamment sans chercher de lien","Attendre de voir si d'autres cas apparaissent avant d'agir"], correct:0 },
      { q:"Pourquoi le système cardiovasculaire et le système respiratoire sont-ils souvent examinés ensemble ?", options:["Parce qu'ils coopèrent étroitement et qu'un problème dans l'un peut affecter l'autre","Parce qu'ils sont anatomiquement au même endroit uniquement","Ils n'ont en réalité aucun lien fonctionnel"], correct:0 },
      { q:"Cas pratique — Un patient âgé avec une fonction rénale réduite doit recevoir un médicament habituellement prescrit à dose standard. Quelle est la décision la plus prudente ?", options:["Réduire la dose pour tenir compte de l'élimination plus lente du produit","Prescrire la dose standard sans ajustement, l'âge n'ayant pas d'importance","Doubler la dose pour compenser l'âge"], correct:0 },
      { q:"Un signe clinique se distingue d'un symptôme car il est...", options:["Observé objectivement par le soignant, alors que le symptôme est ressenti par le patient","Toujours plus fiable que ce que dit le patient","Réservé aux examens de laboratoire uniquement"], correct:0 },
      { q:"Pourquoi une campagne de vaccination ciblée a-t-elle souvent plus d'impact qu'un traitement individuel répété ?", options:["Parce qu'elle prévient l'apparition de la maladie à l'échelle de toute une population, à moindre coût global","Parce que les vaccins coûtent toujours plus cher que les traitements","Ce n'est pas vraiment le cas en pratique"], correct:0 },
      { q:"Décrire précisément un symptôme (localisation, durée, déclencheur) sert avant tout à...", options:["Orienter plus efficacement le diagnostic différentiel","Remplir un formulaire administratif obligatoire","Impressionner le patient par le vocabulaire médical"], correct:0 }
    ]
  }
};

function getModule(domKey, idx){
  if(idx === 0){
    return { titre: MODULE_TITRES[0], duree: MODULE_DUREE[0], lecons: COURS[domKey].lecons, exercices: COURS[domKey].exercices, examen: COURS[domKey].examen };
  }
  if(MODULE2_CONTENT[domKey] && idx === 1){
    const m = MODULE2_CONTENT[domKey];
    return { titre: MODULE_TITRES[1], duree: MODULE_DUREE[1], lecons: m.lecons, exercices: m.exercices, examen: m.examen };
  }
  return { titre: MODULE_TITRES[idx], duree: MODULE_DUREE[idx], topics: MODULE_TOPICS[domKey][idx-1] };
}

let modulesPassed = {}; // clé "domaine_indexModule" -> true
function isModuleUnlocked(domKey, idx){
  if(idx === 0) return true;
  return !!modulesPassed[`${domKey}_${idx-1}`];
}

let academieState = { domaine: null, moduleIndex: 0, tab: 'lecons', examAnswers: {}, examSubmitted: false, exoDone: {} };

function setAcademieDomaine(key){
  academieState.domaine = key;
  academieState.moduleIndex = 0;
  academieState.tab = 'lecons';
  academieState.examAnswers = {};
  academieState.examSubmitted = false;
  academieState.exoDone = {};
  academieState.lastExamScore = null;
  renderAcademie();
}

function setAcademieModule(idx){
  if(!isModuleUnlocked(academieState.domaine, idx)){
    toast("Réussis d'abord le module précédent (70% à l'examen) pour débloquer celui-ci.");
    return;
  }
  academieState.moduleIndex = idx;
  academieState.tab = 'lecons';
  academieState.examAnswers = {};
  academieState.lastExamScore = null;
  renderAcademie();
}

function setAcademieTab(tab){
  academieState.tab = tab;
  renderAcademie();
}

function renderAcademie(){
  const select = document.getElementById('academie-select');
  select.innerHTML = Object.entries(SECTORS).map(([key,s]) => `<option value="${key}">${s.name}</option>`).join('');
  if(!academieState.domaine){
    academieState.domaine = state.sectorChosen || (state.topSectors[0] && state.topSectors[0].key) || 'technologie';
  }
  select.value = academieState.domaine;

  const domKey = academieState.domaine;
  const body = document.getElementById('academie-body');

  const modulesHtml = `
    <div class="module-track">
      ${MODULE_TITRES.map((_, idx) => {
        const unlocked = isModuleUnlocked(domKey, idx);
        const passed = !!modulesPassed[`${domKey}_${idx}`];
        const active = academieState.moduleIndex === idx;
        const mod = getModule(domKey, idx);
        return `
          <button class="module-card ${active?'active':''} ${!unlocked?'locked':''}" onclick="setAcademieModule(${idx})">
            <span class="module-status">${passed ? ICONS.check : (unlocked ? ICONS.dot : ICONS.close)}</span>
            <span class="module-title">${mod.titre}</span>
            <span class="module-duree">${mod.duree}</span>
          </button>`;
      }).join('')}
    </div>
    <p class="pending-note" style="margin:-4px 0 20px;">Parcours complet estimé : 4 à 6 mois à raison de quelques leçons par semaine, comme un vrai cursus — le Module 2 se débloque après avoir réussi l'examen du Module 1 (70%).</p>
  `;

  const cours = getModule(domKey, academieState.moduleIndex);

  // Module sans contenu détaillé encore rédigé (2 ou 3) : on montre le programme prévu, pas de fausses leçons.
  if(!cours.lecons){
    body.innerHTML = modulesHtml + `
      <div class="panel">
        <span class="eyebrow">${esc(cours.titre)} — ${esc(cours.duree)}</span>
        <h3 style="font-size:16px; margin:6px 0 16px;">Programme prévu pour ce module</h3>
        <ul style="margin:0 0 16px; padding-left:18px; color:var(--text-muted); font-size:13px; line-height:1.9;">
          ${cours.topics.map(t => `<li>${t}</li>`).join('')}
        </ul>
        <p class="pending-note">Ce module reprend une structure inspirée de vrais programmes de référence (unités d'enseignement de première année de santé, blocs de certification freeCodeCamp pour la technologie, etc.). Son contenu détaillé — leçons, exercices et examen — reste à rédiger dans une prochaine itération : un module complet représente plusieurs semaines de contenu réel.</p>
      </div>
    `;
    return;
  }

  const tabsHtml = `
    <div class="academie-tabs">
      <button class="${academieState.tab==='lecons'?'active':''}" onclick="setAcademieTab('lecons')">1. Leçons</button>
      <button class="${academieState.tab==='exercices'?'active':''}" onclick="setAcademieTab('exercices')">2. Exercices</button>
      <button class="${academieState.tab==='examen'?'active':''}" onclick="setAcademieTab('examen')">3. Examen</button>
    </div>
  `;

  let contentHtml = '';
  if(academieState.tab === 'lecons'){
    contentHtml = cours.lecons.map((lec, i) => `
      <div class="panel lesson-panel">
        <span class="eyebrow">Leçon ${i+1} / ${cours.lecons.length}</span>
        <h3>${esc(lec.titre)}</h3>
        ${lec.definition ? `<div class="lesson-definition"><strong>Définition — </strong>${esc(lec.definition)}</div>` : ''}
        ${lec.contenu.map(p => `<p>${p}</p>`).join('')}
        ${lec.exemple ? `<div class="lesson-example"><span class="lesson-tag">Exemple concret</span><p>${esc(lec.exemple)}</p></div>` : ''}
        ${lec.note ? `<div class="lesson-note"><span class="lesson-tag">⚠ Erreur fréquente à éviter</span><p>${esc(lec.note)}</p></div>` : ''}
        ${lec.pointscles ? `<div class="lesson-keypoints"><span class="lesson-tag">Points clés à retenir</span><ul>${lec.pointscles.map(k => `<li>${k}</li>`).join('')}</ul></div>` : ''}
      </div>
    `).join('') + `
      <button class="btn btn-gold" onclick="setAcademieTab('exercices')">Passer aux exercices →</button>
    `;
  } else if(academieState.tab === 'exercices'){
    contentHtml = (academieState.lastExamScore ? renderExamBanner(domKey) : '') + `
    <div class="panel">
      <h3 style="font-size:16px; margin-bottom:4px;">Exercices de pratique</h3>
      <p style="color:var(--text-muted); font-size:13px; margin-top:0; margin-bottom:20px;">${cours.exercices.length} questions pour t'entraîner${academieState.lastExamScore ? " et renforcer les points à revoir" : " avant de passer l'examen"} — la correction s'affiche immédiatement.</p>
        ${cours.exercices.map((ex, i) => `
          <div class="lesson-panel" style="margin-bottom:22px;">
            <p style="font-size:14px; font-weight:600; margin-bottom:10px;">${i+1}. ${ex.q}</p>
            <div class="exo-options" id="exo-${domKey}-${i}">
              ${ex.options.map((opt, oi) => `<button onclick="answerExercice('${domKey}',${i},${oi})">${opt}</button>`).join('')}
            </div>
            <div class="exo-feedback" id="exo-fb-${domKey}-${i}"></div>
          </div>
        `).join('')}
        ${academieState.lastExamScore ? '' : `<button class="btn btn-gold" onclick="setAcademieTab('examen')">Passer à l'examen →</button>`}
      </div>
    `;
  } else {
    contentHtml = `
      <div class="panel">
        <h3 style="font-size:16px; margin-bottom:4px;">Examen final — ${cours.titre}</h3>
        <p style="color:var(--text-muted); font-size:13px; margin-top:0; margin-bottom:20px;">${cours.examen.length} questions, dont des cas pratiques. Seuil de réussite : 70%.</p>
        ${cours.examen.map((q, i) => `
          <div class="exam-question">
            <p>${i+1}. ${q.q}</p>
            <div class="exo-options" id="exam-${i}">
              ${q.options.map((opt, oi) => `<button onclick="selectExamAnswer(${i},${oi})" id="exam-${i}-${oi}">${opt}</button>`).join('')}
            </div>
          </div>
        `).join('')}
        <button class="btn btn-gold" onclick="submitExam('${domKey}')">Valider l'examen</button>
      </div>
    `;
  }

  body.innerHTML = modulesHtml + tabsHtml + contentHtml;
}

function answerExercice(domKey, i, optionIndex){
  const ex = getModule(domKey, academieState.moduleIndex).exercices[i];
  const wrap = document.getElementById(`exo-${domKey}-${i}`);
  [...wrap.children].forEach((btn, bi) => {
    btn.classList.remove('correct','incorrect');
    if(bi === ex.correct) btn.classList.add('correct');
    else if(bi === optionIndex) btn.classList.add('incorrect');
  });
  document.getElementById(`exo-fb-${domKey}-${i}`).textContent =
    (optionIndex === ex.correct ? "Exact — " : "Pas tout à fait — ") + ex.explication;
}

function selectExamAnswer(qIndex, optionIndex){
  academieState.examAnswers[qIndex] = optionIndex;
  const wrap = document.getElementById(`exam-${qIndex}`);
  [...wrap.children].forEach((btn, i) => {
    btn.style.borderColor = (i === optionIndex) ? 'var(--gold)' : 'var(--border)';
  });
}

function submitExam(domKey){
  const cours = getModule(domKey, academieState.moduleIndex);
  if(Object.keys(academieState.examAnswers).length < cours.examen.length){
    toast("Réponds à toutes les questions avant de valider.");
    return;
  }
  const score = cours.examen.reduce((acc, q, i) => acc + (academieState.examAnswers[i] === q.correct ? 1 : 0), 0);
  academieState.lastExamScore = { score, total: cours.examen.length };
  if(score / cours.examen.length >= 0.7){
    state.examCompleted = true;
    modulesPassed[`${domKey}_${academieState.moduleIndex}`] = true;
  }
  academieState.tab = 'exercices';
  renderAcademie();
  renderPath();
}

function renderExamBanner(domKey){
  const { score, total } = academieState.lastExamScore;
  const ratio = score / total;
  let mention = "Non admis(e) — ces exercices vont t'aider à consolider les bases avant de retenter l'examen.";
  if(ratio >= 0.9) mention = "Admis(e) — mention très bien. Le module suivant est débloqué.";
  else if(ratio >= 0.8) mention = "Admis(e) — mention bien. Le module suivant est débloqué.";
  else if(ratio >= 0.7) mention = "Admis(e) — mention assez bien. Le module suivant est débloqué.";
  return `
    <div class="panel exam-banner">
      <div class="score" style="font-size:28px;">${score}/${total}</div>
      <p style="color:var(--gold); font-weight:600; margin:8px 0 4px; font-size:14px;">${mention}</p>
      <button class="btn btn-ghost btn-sm" style="margin-top:8px;" onclick="academieState.examAnswers={}; academieState.lastExamScore=null; setAcademieTab('examen');">Repasser l'examen</button>
    </div>
  `;
}

document.getElementById('academie-select').addEventListener('change', e => setAcademieDomaine(e.target.value));


/* ---------------- Dashboard ---------------- */
function saveProfile(){
  state.profile.name = document.getElementById('pf-name').value.trim();
  state.profile.age = document.getElementById('pf-age').value.trim();
  state.profile.niveau = document.getElementById('pf-niveau').value.trim();
  VoieStore.save();
  toast("Profil enregistré");
  renderProfil();
}

// Défensif : le bloc #path-track ne vit désormais que dans l'onglet "Mon parcours" de la page Profil,
// donc il peut être absent du DOM selon l'onglet actif — on ne fait rien dans ce cas plutôt que planter.
function renderPath(){
  const steps = [
    { key:"profil", label:"Profil renseigné", desc:"Nom, âge et niveau scolaire ajoutés.", done: !!(state.profile.name && state.profile.age) },
    { key:"quiz", label:"Test de découverte complété", desc:"Exploration des secteurs par situations concrètes.", done: state.quizDone },
    { key:"voie", label:"Voie choisie", desc: state.sectorChosen ? SECTORS[state.sectorChosen].name : "Sélectionne un secteur dans tes résultats.", done: !!state.sectorChosen },
    { key:"cours", label:"Bases du domaine validées", desc:"Réussir l'examen de l'Académie dans le domaine choisi.", done: state.examCompleted },
    { key:"emploi", label:"Première candidature envoyée", desc:"Postule à une offre correspondant à ton profil.", done: state.applied }
  ];
  let currentSet = false;
  const track = document.getElementById('path-track');
  if(!track) return;
  track.innerHTML = `<div class="path-line"><i style="height:${(steps.filter(s=>s.done).length / steps.length) * 100}%"></i></div>` +
    steps.map(s => {
      let cls = '';
      if(s.done) cls = 'done';
      else if(!currentSet){ cls = 'current'; currentSet = true; }
      return `<div class="path-step ${cls}">
        <div class="path-dot">${s.done ? ICONS.check : ICONS.dot}</div>
        <div class="path-body"><h4>${esc(s.label)}</h4><p>${esc(s.desc)}</p></div>
      </div>`;
    }).join('');
}

/* ---------------- Jobs ---------------- */
/* ---------------- Jobs : liste, recherche, filtres, tri, favoris ---------------- */
let jobsFilter = { q:'', secteur:'tous', contrat:'tous', favOnly:false, sort:'pertinence' };

function setJobsSearch(v){ jobsFilter.q = v; renderJobs(); }
function setJobsSort(v){ jobsFilter.sort = v; renderJobs(); }
function setJobsSecteur(v){ jobsFilter.secteur = v; renderJobs(); }
function setJobsContrat(v){ jobsFilter.contrat = v; renderJobs(); }
function toggleFavOnly(){ jobsFilter.favOnly = !jobsFilter.favOnly; renderJobs(); }

function resetJobsFilters(){
  jobsFilter = { q:'', secteur:'tous', contrat:'tous', favOnly:false, sort:'pertinence' };
  renderJobs();
}

function hasApplied(jobId){ return state.applications.some(a => a.jobId === jobId); }

function toggleFav(jobId, ev){
  if(ev) ev.stopPropagation();
  const i = state.savedJobs.indexOf(jobId);
  if(i >= 0){ state.savedJobs.splice(i, 1); toast("Offre retirée de tes favoris."); }
  else { state.savedJobs.push(jobId); toast("Offre enregistrée dans tes favoris."); }
  VoieStore.save();
  renderJobs();
}

/* Normalise un texte pour la recherche : minuscules, sans accents. */
function normalizeStr(v){
  return String(v == null ? '' : v)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function renderJobs(){
  const isApprenant = state.userRole === 'apprenant';
  const top = state.sectorChosen || (state.topSectors[0] && state.topSectors[0].key);

  const q = normalizeStr(jobsFilter.q);
  let list = jobsData.filter(j => {
    if(jobsFilter.secteur !== 'tous' && j.secteur !== jobsFilter.secteur) return false;
    if(jobsFilter.contrat !== 'tous' && (j.contrat || '') !== jobsFilter.contrat) return false;
    if(jobsFilter.favOnly && !state.savedJobs.includes(j.id)) return false;
    if(!q) return true;
    return normalizeStr([j.titre, j.entreprise, j.ville, j.niveau, j.desc,
      (j.missions || []).join(' '), (j.profil || []).join(' ')].join(' ')).includes(q);
  });

  if(jobsFilter.sort === 'alpha')      list.sort((a,b) => normalizeStr(a.titre).localeCompare(normalizeStr(b.titre)));
  else if(jobsFilter.sort === 'ville') list.sort((a,b) => normalizeStr(a.ville).localeCompare(normalizeStr(b.ville)));
  else                                 list.sort((a,b) => (b.secteur === top) - (a.secteur === top));

  const contrats = [...new Set(jobsData.map(j => j.contrat).filter(Boolean))];
  document.getElementById('jobs-filters').innerHTML = `
    <div class="jobs-filter-row">
      <div class="field jobs-search">
        <label class="sr-only" for="jobs-q">Rechercher une offre</label>
        <input id="jobs-q" type="search" placeholder="Rechercher : intitulé, entreprise, ville…"
               value="${escAttr(jobsFilter.q)}" oninput="setJobsSearch(this.value)">
      </div>
      <div class="field">
        <label class="sr-only" for="jobs-secteur">Secteur</label>
        <select id="jobs-secteur" onchange="setJobsSecteur(this.value)">
          <option value="tous">Tous les secteurs</option>
          ${Object.entries(SECTORS).map(([k, s]) => `<option value="${k}" ${jobsFilter.secteur === k ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="sr-only" for="jobs-contrat">Type de contrat</label>
        <select id="jobs-contrat" onchange="setJobsContrat(this.value)">
          <option value="tous">Tous les contrats</option>
          ${contrats.map(c => `<option value="${escAttr(c)}" ${jobsFilter.contrat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="sr-only" for="jobs-sort">Trier</label>
        <select id="jobs-sort" onchange="setJobsSort(this.value)">
          <option value="pertinence" ${jobsFilter.sort === 'pertinence' ? 'selected' : ''}>Pertinence pour mon profil</option>
          <option value="alpha" ${jobsFilter.sort === 'alpha' ? 'selected' : ''}>Intitulé (A → Z)</option>
          <option value="ville" ${jobsFilter.sort === 'ville' ? 'selected' : ''}>Ville (A → Z)</option>
        </select>
      </div>
      ${isApprenant ? `<button class="btn btn-ghost btn-sm ${jobsFilter.favOnly ? 'active' : ''}" onclick="toggleFavOnly()" aria-pressed="${jobsFilter.favOnly}">${ICONS.star} Favoris (${state.savedJobs.length})</button>` : ''}
    </div>
    <div class="jobs-count" aria-live="polite">${list.length} offre${list.length > 1 ? 's' : ''} affichée${list.length > 1 ? 's' : ''}</div>
  `;
  // On restaure le focus du champ de recherche après réécriture du DOM.
  const searchEl = document.getElementById('jobs-q');
  if(searchEl && document.activeElement !== searchEl && jobsFilter.q){
    searchEl.focus();
    const end = searchEl.value.length;
    searchEl.setSelectionRange(end, end);
  }

  document.getElementById('jobs-list').innerHTML = list.length ? list.map(j => {
    const idx = jobsData.indexOf(j);
    const fav = state.savedJobs.includes(j.id);
    const applied = hasApplied(j.id);
    return `
    <div class="panel job-card job-card-clickable" onclick="openJobDetail(${idx})">
      <div>
        ${j.secteur === top ? '<span class="job-tag">Correspond à ton profil</span>' : ''}
        ${applied ? '<span class="job-tag job-tag-applied">Candidature envoyée</span>' : ''}
        <h3>${esc(j.titre)}</h3>
        <div class="job-sub">${esc(j.entreprise)}${j.verifie ? `<span class="verified-badge">${ICONS.check} Vérifiée</span>` : ''} · ${esc(SECTORS[j.secteur] ? SECTORS[j.secteur].name : '')}</div>
        <div class="job-meta"><span>${esc(j.ville)}</span><span>${esc(j.niveau)}</span><span>${esc(j.contrat || '')}</span></div>
        <p style="font-size:13px; color:var(--text-muted); max-width:480px; margin:10px 0 0;">${esc(j.desc)}</p>
      </div>
      <div class="job-card-actions">
        ${isApprenant ? `<button type="button" class="btn-fav ${fav ? 'active' : ''}" title="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}" aria-label="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}" aria-pressed="${fav}" onclick="toggleFav('${escAttr(j.id)}', event)">${ICONS.star}</button>` : ''}
        <button type="button" class="btn ${applied ? 'btn-ghost' : 'btn-gold'} btn-sm" onclick="event.stopPropagation(); openJobDetail(${idx})">${applied ? 'Déjà postulé' : "Voir l'offre"}</button>
      </div>
    </div>
  `;
  }).join('') : `
    <div class="panel empty">
      <p>Aucune offre ne correspond à ta recherche.</p>
      ${(jobsFilter.q || jobsFilter.secteur !== 'tous' || jobsFilter.contrat !== 'tous' || jobsFilter.favOnly)
        ? '<button class="btn btn-ghost btn-sm" onclick="resetJobsFilters()">Réinitialiser les filtres</button>' : ''}
    </div>
  `;
}


/* ---------------- Détail d'une offre + confirmation avant candidature ---------------- */
function openJobDetail(index){
  const j = jobsData[index];
  const dom = SECTORS[j.secteur] || { name:'' };
  const applied = hasApplied(j.id);
  document.getElementById('job-detail-body').innerHTML = `
    <span class="eyebrow">${esc(dom.name)}${j.verifie ? `<span class="verified-badge">${ICONS.check} Entreprise vérifiée</span>` : ''}</span>
    <h2 style="font-size:22px; margin:4px 0 2px;">${esc(j.titre)}</h2>
    <p style="color:var(--text-muted); font-size:14px; margin:0 0 4px;">${esc(j.entreprise)}</p>
    <div class="job-detail-meta"><span>${esc(j.ville)}</span><span>${esc(j.niveau)}</span><span>${esc(j.contrat || 'Non précisé')}</span></div>

    <h3 style="font-size:14px; margin:18px 0 8px;">Le poste</h3>
    <p style="color:var(--text-muted); font-size:14px; margin:0 0 14px;">${esc(j.desc)}</p>

    ${j.missions ? `<h3 style="font-size:14px; margin:18px 0 8px;">Missions principales</h3><ul>${j.missions.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
    ${j.profil ? `<h3 style="font-size:14px; margin:18px 0 8px;">Profil recherché</h3><ul>${j.profil.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}

    ${state.userRole === 'entreprise' ? '' : (applied
      ? `<div class="job-applied-note">Candidature déjà envoyée pour cette offre (démonstration).</div>`
      : `<button class="btn btn-gold" style="margin-top:8px;" onclick="askApplyConfirmation(${index})">Postuler à cette offre</button>`)}
  `;
  document.getElementById('job-modal').classList.add('open');
  openModal('job-modal');
}
function closeJobDetail(){ closeModal('job-modal'); }

function askApplyConfirmation(index){
  const j = jobsData[index];
  document.getElementById('confirm-text').textContent =
    `Es-tu sûr(e) de vouloir postuler au poste de « ${esc(j.titre)} » chez ${esc(j.entreprise)} ? Cette action enverra ta candidature (démonstration).`;
  const yesBtn = document.getElementById('confirm-yes-btn');
  yesBtn.onclick = () => {
    applyJob(j.titre);
    closeConfirm();
    closeJobDetail();
  };
  document.getElementById('confirm-modal').classList.add('open');
  openModal('confirm-modal');
}
function closeConfirm(){ closeModal('confirm-modal'); }

function applyJob(titre){
  const j = jobsData.find(x => x.titre === titre);
  const jobId = j ? j.id : ('job-' + titre);
  if(hasApplied(jobId)){
    toast("Tu as déjà candidaté à cette offre.");
    return;
  }
  state.applications.push({
    jobId: jobId,
    titre: titre,
    entreprise: j ? j.entreprise : '',
    date: new Date().toISOString(),
    statut: 'envoyee'
  });
  state.applied = true;
  VoieStore.save();
  renderJobs();
  renderPath();
  toast("Candidature envoyée pour : " + titre + " (démo)");
}

/* ---------------- Business : vérification d'entreprise + publication d'offres ---------------- */
function renderBusiness(){
  const title = document.getElementById('business-title');
  const body = document.getElementById('business-body');

  if(!entrepriseAccount.verified){
    title.textContent = "Vérifier votre entreprise";
    body.innerHTML = entrepriseAccount.pending ? `
      <div class="panel verify-loading">Vérification de vos informations en cours…</div>
    ` : `
      <div class="panel" style="max-width:560px;">
        <p style="color:var(--text-muted); font-size:13px; margin-top:0; margin-bottom:20px;">
          Pour empêcher les fausses annonces, seules les entreprises identifiées peuvent publier une offre. Ces informations sont vérifiées avant toute publication.
        </p>
        <form id="verify-form">
          <div class="field"><label for="vf-nom">Nom de l'entreprise</label><input id="vf-nom" required placeholder="ex : AgroBénin"></div>
          <div class="grid grid-2">
            <div class="field"><label for="vf-ifu">Numéro IFU / RCCM</label><input id="vf-ifu" required placeholder="Identifiant fiscal ou registre de commerce"></div>
            <div class="field"><label for="vf-email">Email professionnel</label><input id="vf-email" type="email" required placeholder="contact@entreprise.com"></div>
          </div>
          <div class="field">
            <label for="vf-secteur">Secteur d'activité</label>
            <select id="vf-secteur"></select>
          </div>
          <button type="submit" class="btn btn-gold">Vérifier mon entreprise</button>
        </form>
        <p class="pending-note">Démonstration : dans une version réelle, le numéro IFU/RCCM serait recoupé avec le registre officiel avant validation par une équipe de modération, ce qui peut prendre 24 à 48h.</p>
      </div>
    `;
    if(!entrepriseAccount.pending){
      document.getElementById('vf-secteur').innerHTML = Object.entries(SECTORS).map(([key,s]) => `<option value="${key}">${s.name}</option>`).join('');
      document.getElementById('verify-form').addEventListener('submit', e => {
        e.preventDefault();
        const nom = document.getElementById('vf-nom').value.trim();
        const ifu = document.getElementById('vf-ifu').value.trim();
        const email = document.getElementById('vf-email').value.trim();
        if(ifu.replace(/\D/g,'').length < 5){
          toast("Le numéro IFU/RCCM semble incomplet.");
          return;
        }
        entrepriseAccount = { verified:false, pending:true, nom, ifu, email, secteur: document.getElementById('vf-secteur').value };
        renderBusiness();
        setTimeout(() => {
          entrepriseAccount.verified = true;
          entrepriseAccount.pending = false;
          renderBusiness();
          toast("Entreprise vérifiée — vous pouvez publier une offre.");
        }, 1400);
      });
    }
    return;
  }

  title.innerHTML = `Publier une offre <span class="verified-badge">${ICONS.check} ${esc(entrepriseAccount.nom)} vérifiée</span>`;
  const mesOffres = jobsData.filter(j => j.entreprise === entrepriseAccount.nom);
  body.innerHTML = `
    <div class="panel" style="max-width:560px; margin-bottom:24px;">
      <form id="job-form">
        <div class="field"><label for="jf-title">Intitulé du poste</label><input id="jf-title" required placeholder="ex : Technicien(ne) agricole"></div>
        <div class="grid grid-2">
          <div class="field">
            <label for="jf-sector">Secteur</label>
            <select id="jf-sector"></select>
          </div>
          <div class="field"><label for="jf-level">Niveau requis</label><input id="jf-level" required placeholder="ex : Bac+2"></div>
        </div>
        <div class="grid grid-2">
          <div class="field"><label for="jf-city">Ville</label><input id="jf-city" required placeholder="ex : Cotonou"></div>
          <div class="field">
            <label for="jf-contrat">Type de contrat</label>
            <select id="jf-contrat">
              <option>CDI</option><option>CDD</option><option>Stage</option><option>Freelance</option><option>Cachet / mission</option>
            </select>
          </div>
        </div>
        <div class="field"><label for="jf-desc">Description courte</label><textarea id="jf-desc" placeholder="Ce que fera la personne recrutée, au quotidien."></textarea></div>
        <div class="field"><label for="jf-missions">Missions principales (une par ligne)</label><textarea id="jf-missions" placeholder="Ex : Suivre les commandes clients&#10;Répondre aux demandes courantes"></textarea></div>
        <div class="field"><label for="jf-profil">Profil recherché (une ligne par critère)</label><textarea id="jf-profil" placeholder="Ex : Bac+2 minimum&#10;Bon relationnel"></textarea></div>
        <button type="submit" class="btn btn-gold">Publier l'offre</button>
      </form>
    </div>
    ${mesOffres.length ? `
      <h3 style="font-size:15px; margin-bottom:12px;">Vos offres publiées</h3>
      <div class="grid" style="gap:10px;">
        ${mesOffres.map(j => `
          <div class="panel job-card job-card-clickable" onclick="openJobDetail(${jobsData.indexOf(j)})">
            <div><h3 style="font-size:15px;">${esc(j.titre)}</h3><div class="job-sub">${esc(SECTORS[j.secteur].name)} · ${esc(j.ville)}</div></div>
          </div>
        `).join('')}
      </div>` : ''}
  `;
  document.getElementById('jf-sector').innerHTML = Object.entries(SECTORS).map(([key, s]) => `<option value="${key}" ${key===entrepriseAccount.secteur?'selected':''}>${s.name}</option>`).join('');
  document.getElementById('job-form').addEventListener('submit', e => {
    e.preventDefault();
    const job = {
      id: 'j' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      titre: document.getElementById('jf-title').value.trim(),
      entreprise: entrepriseAccount.nom,
      secteur: document.getElementById('jf-sector').value,
      niveau: document.getElementById('jf-level').value.trim(),
      ville: document.getElementById('jf-city').value.trim(),
      contrat: document.getElementById('jf-contrat').value,
      desc: document.getElementById('jf-desc').value.trim() || "Description à venir.",
      missions: document.getElementById('jf-missions').value.split('\n').map(s=>s.trim()).filter(Boolean),
      profil: document.getElementById('jf-profil').value.split('\n').map(s=>s.trim()).filter(Boolean),
      verifie: true
    };
    jobsData.unshift(job);
    VoieStore.save();
    toast("Offre publiée : " + job.titre);
    renderBusiness();
  });
}

/* ---------------- Candidats : profils et parcours consultables par les entreprises ---------------- */
// Démonstration : profils fictifs représentatifs. Dans une vraie version, chaque apprenant
// choisirait explicitement de rendre son profil visible aux entreprises (opt-in), avec un
// contrôle sur les informations partagées.
let candidatsData = [
  { id:"c1", nom:"Adjoavi K.", age:19, niveau:"Terminale scientifique", secteurChoisi:"technologie",
    competences:{ logique:80, creativite:55, relationnel:40, pratique:60, rigueur:70 },
    examens:{ technologie:{score:7,total:8}, ingenierie:{score:5,total:8} },
    parcours:[ {label:"Profil renseigné", done:true}, {label:"Test de découverte complété", done:true}, {label:"Voie choisie : Technologie", done:true}, {label:"Bases du domaine validées", done:true}, {label:"Première candidature envoyée", done:false} ],
    bio:"Passionnée par la résolution de problèmes logiques, a validé les bases du domaine Technologie avec un score solide à l'examen." },
  { id:"c2", nom:"Koffi M.", age:22, niveau:"Licence 2 Gestion", secteurChoisi:"commerce",
    competences:{ logique:50, creativite:60, relationnel:85, pratique:45, rigueur:65 },
    examens:{ commerce:{score:8,total:8} },
    parcours:[ {label:"Profil renseigné", done:true}, {label:"Test de découverte complété", done:true}, {label:"Voie choisie : Commerce & Business", done:true}, {label:"Bases du domaine validées", done:true}, {label:"Première candidature envoyée", done:true} ],
    bio:"Excellent relationnel, a obtenu un score parfait à l'examen Commerce & Business. En recherche active de premier poste." },
  { id:"c3", nom:"Aïsha B.", age:17, niveau:"Première",  secteurChoisi:"sante",
    competences:{ logique:65, creativite:35, relationnel:75, pratique:50, rigueur:80 },
    examens:{ sante:{score:6,total:8} },
    parcours:[ {label:"Profil renseigné", done:true}, {label:"Test de découverte complété", done:true}, {label:"Voie choisie : Santé", done:true}, {label:"Bases du domaine validées", done:true}, {label:"Première candidature envoyée", done:false} ],
    bio:"Encore au lycée, oriente déjà son parcours vers la santé — profil à suivre sur le long terme plutôt qu'à recruter immédiatement." },
  { id:"c4", nom:"Fabrice D.", age:24, niveau:"Bac+2 Génie industriel", secteurChoisi:"ingenierie",
    competences:{ logique:75, creativite:40, relationnel:45, pratique:85, rigueur:75 },
    examens:{ ingenierie:{score:7,total:8}, technologie:{score:4,total:8} },
    parcours:[ {label:"Profil renseigné", done:true}, {label:"Test de découverte complété", done:true}, {label:"Voie choisie : Ingénierie", done:true}, {label:"Bases du domaine validées", done:true}, {label:"Première candidature envoyée", done:true} ],
    bio:"Sens pratique très développé, a déjà postulé à plusieurs offres techniques. Disponible immédiatement." },
  { id:"c5", nom:"Nadège S.", age:21, niveau:"Bac+3 Design", secteurChoisi:"art",
    competences:{ logique:40, creativite:90, relationnel:55, pratique:60, rigueur:50 },
    examens:{ art:{score:7,total:8} },
    parcours:[ {label:"Profil renseigné", done:true}, {label:"Test de découverte complété", done:true}, {label:"Voie choisie : Art & Design", done:true}, {label:"Bases du domaine validées", done:true}, {label:"Première candidature envoyée", done:false} ],
    bio:"Créativité très marquée aux tests, portfolio en cours de construction dans le design d'espace." },
  { id:"c6", nom:"Rachidi A.", age:20, niveau:"Bac+2 Agronomie", secteurChoisi:"agriculture",
    competences:{ logique:60, creativite:45, relationnel:50, pratique:80, rigueur:70 },
    examens:{ agriculture:{score:8,total:8} },
    parcours:[ {label:"Profil renseigné", done:true}, {label:"Test de découverte complété", done:true}, {label:"Voie choisie : Agriculture & Environnement", done:true}, {label:"Bases du domaine validées", done:true}, {label:"Première candidature envoyée", done:false} ],
    bio:"Score parfait à l'examen Agriculture & Environnement, fort sens pratique confirmé par le test d'orientation." }
];

let candidatsFilter = 'tous';
function setCandidatsFilter(key){ candidatsFilter = key; renderCandidats(); }

function renderCandidats(){
  const filters = document.getElementById('candidats-filters');
  filters.innerHTML = `<button class="${candidatsFilter==='tous'?'active':''}" onclick="setCandidatsFilter('tous')">Tous les secteurs</button>` +
    Object.entries(SECTORS).map(([key, s]) =>
      `<button class="${candidatsFilter===key?'active':''}" onclick="setCandidatsFilter('${key}')">${ICONS[key]} ${s.name}</button>`
    ).join('');

  const list = candidatsFilter === 'tous' ? candidatsData : candidatsData.filter(c => c.secteurChoisi === candidatsFilter);
  document.getElementById('candidats-list').innerHTML = list.length ? list.map(c => {
    const topSkill = Object.entries(c.competences).sort((a,b) => b[1]-a[1])[0];
    return `
    <div class="panel job-card job-card-clickable" onclick="openCandidateDetail('${escAttr(c.id)}')">
      <div>
        <span class="job-tag">${esc(SECTORS[c.secteurChoisi].name)}</span>
        <h3>${esc(c.nom)}</h3>
        <div class="job-sub">${esc(c.age)} ans · ${esc(c.niveau)}</div>
        <div class="job-meta"><span>Point fort : ${META_LABELS[topSkill[0]]}</span></div>
        <p style="font-size:13px; color:var(--text-muted); max-width:480px; margin:10px 0 0;">${esc(c.bio)}</p>
      </div>
      <button class="btn btn-gold btn-sm" onclick="event.stopPropagation(); openCandidateDetail('${escAttr(c.id)}')">Voir le profil</button>
    </div>`;
  }).join('') : `<div class="empty">Aucun profil dans ce secteur pour le moment.</div>`;
}

function openCandidateDetail(id){
  const c = candidatsData.find(x => x.id === id);
  const maxSkill = Math.max(...Object.values(c.competences));
  document.getElementById('candidate-detail-body').innerHTML = `
    <span class="eyebrow">${esc(SECTORS[c.secteurChoisi].name)}</span>
    <h2 style="font-size:22px; margin:4px 0 2px;">${esc(c.nom)}</h2>
    <p style="color:var(--text-muted); font-size:14px; margin:0 0 4px;">${esc(c.age)} ans · ${esc(c.niveau)}</p>
    <div class="job-detail-meta"><span>Voie choisie : ${esc(SECTORS[c.secteurChoisi].name)}</span></div>

    <p style="color:var(--text-muted); font-size:14px; margin:14px 0 20px;">${esc(c.bio)}</p>

    <h3 style="font-size:14px; margin:18px 0 10px;">Compétences observées (test d'orientation)</h3>
    ${Object.entries(c.competences).map(([key,val]) => `
      <div class="stat-row">
        <span class="stat-label">${META_LABELS[key]}</span>
        <span class="stat-track"><i style="width:${val}%"></i></span>
        <span class="stat-val">${val}%</span>
      </div>`).join('')}

    <h3 style="font-size:14px; margin:22px 0 10px;">Résultats aux examens de l'Académie</h3>
    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:6px;">
      ${Object.entries(c.examens).map(([dom,ex]) => `
        <span class="verified-badge" style="font-size:12px;">${ICONS.check} ${SECTORS[dom].name} — ${ex.score}/${ex.total}</span>
      `).join('')}
    </div>

    <h3 style="font-size:14px; margin:22px 0 10px;">Étapes de son parcours</h3>
    <div class="path-track">
      ${c.parcours.map(s => `<div class="path-step ${s.done?'done':''}"><div class="path-dot">${s.done?ICONS.check:ICONS.dot}</div><div class="path-body"><h4>${esc(s.label)}</h4></div></div>`).join('')}
    </div>

    <button class="btn btn-gold" style="margin-top:16px;" data-candidat="${escAttr(c.nom)}" onclick="contacterCandidat(this)">Contacter ce profil</button>
  `;
  document.getElementById('candidate-modal').classList.add('open');
}
function closeCandidateDetail(){ closeModal('candidate-modal'); }

/* Contact d'un candidat : le nom est lu depuis un attribut, jamais injecté dans le code. */
function contacterCandidat(btn){
  const nom = btn.getAttribute('data-candidat') || '';
  toast("Message envoyé à " + nom + " (démo)");
}

/* ---------------- Profil (compte) ---------------- */
let profilTab = 'infos';
function setProfilTab(tab){ profilTab = tab; renderProfil(); }

function computeCompletion(){
  const fields = [currentUser.name, currentUser.email, currentUser.phone, currentUser.birthdate, currentUser.city, currentUser.address, currentUser.photo];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function renderProfil(){
  const body = document.getElementById('profil-body');
  const roleLabel = state.userRole === 'entreprise' ? 'Entreprise' : (state.userRole === 'apprenant' ? 'Apprenant(e)' : 'Non défini');
  const pct = computeCompletion();
  const circumference = 251; // 2*PI*40

  const heroStats = state.userRole === 'entreprise' ? `
    <div class="hero-stat"><div class="num">${jobsData.filter(j => j.entreprise === entrepriseAccount.nom).length}</div><div class="label">Offres publiées</div></div>
    <div class="hero-stat"><div class="num">${candidatsData.length}</div><div class="label">Profils consultables</div></div>
    <div class="hero-stat"><div class="num">${entrepriseAccount.verified ? '✓' : '—'}</div><div class="label">Entreprise vérifiée</div></div>
  ` : `
    <div class="hero-stat"><div class="num">${state.sectorChosen ? '1' : '0'}</div><div class="label">Voie choisie</div></div>
    <div class="hero-stat"><div class="num">${state.examCompleted ? '✓' : '—'}</div><div class="label">Examen validé</div></div>
    <div class="hero-stat"><div class="num">${state.applied ? '1+' : '0'}</div><div class="label">Candidatures envoyées</div></div>
  `;

  const infosPane = `
    <form id="profil-infos-form">
      <div class="grid grid-2">
        <div class="field"><label for="pi-name">Nom complet</label><input id="pi-name" value="${escAttr(currentUser.name || '')}" required></div>
        <div class="field"><label for="pi-phone">Téléphone</label><input id="pi-phone" type="tel" value="${escAttr(currentUser.phone || '')}"></div>
      </div>
      <div class="grid grid-2">
        <div class="field"><label for="pi-birthdate">Date de naissance</label><input id="pi-birthdate" type="date" value="${escAttr(currentUser.birthdate || '')}"></div>
        <div class="field"><label for="pi-city">Ville</label><input id="pi-city" value="${escAttr(currentUser.city || '')}"></div>
      </div>
      <div class="field">
        <label for="pi-country">Pays</label>
        <select id="pi-country">
          ${["Bénin","Togo","Côte d'Ivoire","Ghana","Nigeria","Niger","Burkina Faso","Sénégal","Autre"].map(c => `<option ${currentUser.country===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label for="pi-address">Adresse</label><input id="pi-address" value="${escAttr(currentUser.address || '')}"></div>
      <button type="submit" class="btn btn-gold btn-sm">Enregistrer les informations</button>
    </form>
  `;

  const comptePane = `
    <form id="profil-compte-form">
      <div class="field"><label for="pc-email">Email</label><input id="pc-email" type="email" value="${escAttr(currentUser.email)}" required></div>
      <button type="submit" class="btn btn-gold btn-sm">Mettre à jour l'email</button>
    </form>
  `;

  const securitePane = `
    <form id="profil-password-form">
      <div class="field"><label for="pp-current">Mot de passe actuel</label><input id="pp-current" type="password" required></div>
      <div class="grid grid-2">
        <div class="field">
          <label for="pp-new">Nouveau mot de passe</label>
          <input id="pp-new" type="password" required oninput="updatePwStrength(this.value)">
          <div class="pw-strength"><div class="pw-strength-bar" id="pw-bar"></div></div>
          <div class="pw-hint" id="pw-hint">6 caractères minimum.</div>
        </div>
        <div class="field"><label for="pp-confirm">Confirmer</label><input id="pp-confirm" type="password" required></div>
      </div>
      <button type="submit" class="btn btn-gold btn-sm">Changer le mot de passe</button>
    </form>
    <hr style="border-color:var(--border); margin:24px 0;">
    <div class="danger-zone">
      <div>
        <h4 style="font-size:14px; color:var(--coral); margin:0 0 4px;">Zone sensible</h4>
        <p style="font-size:12px; color:var(--text-muted); margin:0;">La suppression du compte est définitive pour cette session.</p>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button type="button" class="btn btn-ghost btn-sm" onclick="resetAllData()">Réinitialiser mes données</button>
        <button type="button" class="btn btn-ghost btn-sm" style="border-color:var(--coral); color:var(--coral);" onclick="deleteAccount()">Supprimer mon compte</button>
      </div>
    </div>
  `;

  // Onglet "Mon parcours" (apprenant uniquement) : fusionne l'ancien profil de test, les
  // compétences observées au test d'orientation, et la timeline de progression.
  const p = state.profile;
  const anyAnswered = Object.values(state.metaScores).some(v => v > 0);
  const skillsHtml = !anyAnswered ? `<div class="empty" style="padding:10px 0;">Fais le test de découverte pour voir apparaître tes compétences.</div>` : (() => {
    const max = Math.max(...Object.values(state.metaScores), 1);
    return Object.entries(state.metaScores).map(([key, val]) => {
      const pct = Math.round((val / max) * 100);
      return `<div class="stat-row">
        <span class="stat-label">${META_LABELS[key]}</span>
        <span class="stat-track"><i style="width:${pct}%"></i></span>
        <span class="stat-val">${pct}%</span>
      </div>`;
    }).join('');
  })();
  const parcoursPane = `
    <div class="grid grid-2" style="align-items:start; gap:20px; margin-bottom:20px;">
      <div>
        <h3 style="font-size:14px; margin-bottom:12px;">Profil de test d'orientation</h3>
        <form id="profil-parcours-form">
          <div class="field"><label for="pf-name">Nom (test)</label><input id="pf-name" value="${p.name}" placeholder="ex : Aïcha"></div>
          <div class="grid grid-2">
            <div class="field"><label for="pf-age">Âge</label><input id="pf-age" type="number" min="6" max="60" value="${p.age}" placeholder="ex : 16"></div>
            <div class="field"><label for="pf-niveau">Niveau scolaire</label><input id="pf-niveau" value="${p.niveau}" placeholder="ex : Terminale"></div>
          </div>
          <button type="submit" class="btn btn-gold btn-sm">Enregistrer</button>
        </form>
      </div>
      <div>
        <h3 style="font-size:14px; margin-bottom:12px;">Compétences observées</h3>
        ${skillsHtml}
      </div>
    </div>
    <h3 style="font-size:14px; margin-bottom:6px;">Étapes de ton chemin</h3>
    <p style="color:var(--text-muted); font-size:13px; margin-top:0; margin-bottom:10px;">Ce chemin se remplit au fur et à mesure de ta progression réelle — pas d'un coup.</p>
    <div class="path-wrap"><div class="path-track" id="path-track"></div></div>

    <h3 style="font-size:14px; margin:24px 0 10px;">Mes candidatures (${state.applications.length})</h3>
    ${state.applications.length ? `
      <div class="grid" style="gap:10px;">
        ${state.applications.slice().reverse().map(a => `
          <div class="panel application-item">
            <div>
              <h4>${esc(a.titre)}</h4>
              <div class="job-sub">${esc(a.entreprise)} · ${new Date(a.date).toLocaleDateString('fr-FR')}</div>
            </div>
            <span class="job-tag job-tag-applied">Envoyée</span>
          </div>`).join('')}
      </div>
      <button class="btn btn-ghost btn-sm" style="margin-top:10px;" onclick="showScreen('jobs')">Voir les offres →</button>
    ` : `
      <p style="color:var(--text-muted); font-size:13px; margin:0;">Aucune candidature pour l'instant.
        <button class="btn btn-ghost btn-sm" onclick="showScreen('jobs')">Parcourir les offres →</button>
      </p>
    `}
    ${state.savedJobs.length ? `
      <p style="color:var(--text-muted); font-size:13px; margin:14px 0 0;">Tu as ${state.savedJobs.length} offre${state.savedJobs.length > 1 ? 's' : ''} en favori.
        <button class="btn btn-ghost btn-sm" onclick="jobsFilter.favOnly = true; showScreen('jobs');">Voir mes favoris →</button>
      </p>` : ''}
  `;

  body.innerHTML = `
    <div class="profile-hero">
      <div class="avatar-wrap">
        ${safeImgSrc(currentUser.photo) ? `<img src="${safeImgSrc(currentUser.photo)}" alt="Photo de profil">` : `<div class="avatar-init-lg">${esc((currentUser.name||'?').trim().charAt(0).toUpperCase())}</div>`}
        <button class="avatar-edit-btn" onclick="document.getElementById('profil-photo-input').click()" aria-label="Changer la photo">${ICONS.person}</button>
      </div>
      <div class="profile-hero-info">
        <h2 style="font-size:20px; margin:0;">${esc(currentUser.name)}</h2>
        <span class="role-badge">${roleLabel}</span>
      </div>
      <div class="hero-stats">${heroStats}</div>
    </div>

    <div class="profile-layout">
      <div class="panel">
        <div class="academie-tabs">
          <button class="${profilTab==='infos'?'active':''}" onclick="setProfilTab('infos')">Informations</button>
          <button class="${profilTab==='compte'?'active':''}" onclick="setProfilTab('compte')">Compte</button>
          <button class="${profilTab==='securite'?'active':''}" onclick="setProfilTab('securite')">Sécurité</button>
          ${state.userRole === 'apprenant' ? `<button class="${profilTab==='parcours'?'active':''}" onclick="setProfilTab('parcours')">Mon parcours</button>` : ''}
        </div>
        <div class="profile-tab-pane show">
          ${profilTab === 'infos' ? infosPane : profilTab === 'compte' ? comptePane : (profilTab === 'parcours' && state.userRole === 'apprenant') ? parcoursPane : securitePane}
        </div>
      </div>

      <div>
        <div class="panel completion-ring-wrap" style="margin-bottom:16px;">
          <h3 style="font-size:14px; margin-bottom:14px;">Complétion du profil</h3>
          <svg class="completion-ring" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-panel-2)" stroke-width="9"/>
            <circle id="profil-ring" cx="50" cy="50" r="40" fill="none" stroke="var(--gold)" stroke-width="9"
              stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
              transform="rotate(-90 50 50)"/>
            <text x="50" y="56" text-anchor="middle">${pct}%</text>
          </svg>
        </div>
        <div class="panel">
          <h3 style="font-size:14px; margin-bottom:10px;">Récapitulatif du compte</h3>
          <div class="side-list-item">
            <span class="side-icon">${ICONS.check}</span>
            <div><div class="side-label">Email</div><div class="side-value">${escAttr(currentUser.email)}</div></div>
          </div>
          <div class="side-list-item">
            <span class="side-icon">${ICONS.person}</span>
            <div><div class="side-label">Rôle</div><div class="side-value">${roleLabel}</div></div>
          </div>
          <div class="side-list-item">
            <span class="side-icon">${ICONS.dot}</span>
            <div><div class="side-label">Ville</div><div class="side-value">${esc(currentUser.city || '—')}${esc(currentUser.country)}</div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Anime l'anneau de complétion après affichage.
  requestAnimationFrame(() => {
    const ring = document.getElementById('profil-ring');
    if(ring){
      const offset = circumference - (pct / 100) * circumference;
      ring.style.transition = 'stroke-dashoffset 1s ease';
      requestAnimationFrame(() => { ring.style.strokeDashoffset = offset; });
    }
  });

  if(profilTab === 'infos'){
    document.getElementById('profil-infos-form').addEventListener('submit', e => {
      e.preventDefault();
      currentUser.name = document.getElementById('pi-name').value.trim() || currentUser.name;
      currentUser.phone = document.getElementById('pi-phone').value.trim();
      currentUser.birthdate = document.getElementById('pi-birthdate').value;
      currentUser.city = document.getElementById('pi-city').value.trim();
      currentUser.country = document.getElementById('pi-country').value;
      currentUser.address = document.getElementById('pi-address').value.trim();
      const acc = demoUsers.find(u => u.email === currentUser.email);
      if(acc) Object.assign(acc, { name:currentUser.name, phone:currentUser.phone, birthdate:currentUser.birthdate, city:currentUser.city, country:currentUser.country, address:currentUser.address });
      renderNav();
      toast("Informations mises à jour.");
      renderProfil();
    });
  } else if(profilTab === 'compte'){
    document.getElementById('profil-compte-form').addEventListener('submit', e => {
      e.preventDefault();
      const newEmail = document.getElementById('pc-email').value.trim().toLowerCase();
      if(demoUsers.some(u => u.email === newEmail && u.email !== currentUser.email)){
        toast("Cet email est déjà utilisé par un autre compte.");
        return;
      }
      const acc = demoUsers.find(u => u.email === currentUser.email);
      if(acc) acc.email = newEmail;
      currentUser.email = newEmail;
      toast("Email mis à jour.");
      renderProfil();
    });
  } else if(profilTab === 'parcours' && state.userRole === 'apprenant'){
    document.getElementById('profil-parcours-form').addEventListener('submit', e => {
      e.preventDefault();
      saveProfile();
    });
    renderPath();
  } else {
    document.getElementById('profil-password-form').addEventListener('submit', e => {
      e.preventDefault();
      const acc = demoUsers.find(u => u.email === currentUser.email);
      const current = document.getElementById('pp-current').value;
      const next = document.getElementById('pp-new').value;
      const confirm = document.getElementById('pp-confirm').value;
      if(!acc || !checkPwd(acc.password, current)){ toast("Mot de passe actuel incorrect."); return; }
      if(next.length < 6){ toast("Le nouveau mot de passe doit contenir au moins 6 caractères."); return; }
      if(next !== confirm){ toast("Les mots de passe ne correspondent pas."); return; }
      acc.password = hashPwd(next);
      VoieStore.save();
      toast("Mot de passe modifié.");
      e.target.reset();
    });
  }
}

function updatePwStrength(val){
  let score = 0;
  if(val.length >= 8) score++;
  if(/[A-Z]/.test(val)) score++;
  if(/[0-9]/.test(val)) score++;
  if(/[^A-Za-z0-9]/.test(val)) score++;
  const levels = [
    { w:'0%', c:'var(--coral)', t:'6 caractères minimum.' },
    { w:'30%', c:'var(--coral)', t:'Faible — ajoute des majuscules et des chiffres.' },
    { w:'55%', c:'#e0a83d', t:'Moyen — ajoute un caractère spécial.' },
    { w:'80%', c:'var(--green)', t:'Bon niveau de sécurité.' },
    { w:'100%', c:'var(--green)', t:'Excellent mot de passe.' }
  ];
  const lvl = val.length === 0 ? 0 : score;
  document.getElementById('pw-bar').style.width = levels[lvl].w;
  document.getElementById('pw-bar').style.background = levels[lvl].c;
  document.getElementById('pw-hint').textContent = levels[lvl].t;
}

function deleteAccount(){
  if(!confirm("Supprimer définitivement ce compte pour cette session ? Cette action est irréversible.")) return;
  demoUsers = demoUsers.filter(u => u.email !== currentUser.email);
  currentUser = null;
  state.userRole = null;
  state.applications = [];
  state.savedJobs = [];
  VoieStore.save();
  toast("Compte supprimé.");
  logout();
}

/* Réinitialise toutes les données locales stockées dans ce navigateur. */
function resetAllData(){
  if(!confirm("Réinitialiser toutes les données enregistrées sur cet appareil (compte, résultats, progression, offres publiées) ?")) return;
  VoieStore.clear();
  toast("Données réinitialisées — rechargement…");
  setTimeout(() => location.reload(), 700);
}

document.getElementById('profil-photo-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 3 * 1024 * 1024){ toast("Photo trop lourde (3 Mo maximum)."); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    currentUser.photo = ev.target.result;
    const acc = demoUsers.find(u => u.email === currentUser.email);
    if(acc) acc.photo = currentUser.photo;
    renderNav();
    renderProfil();
    toast("Photo de profil mise à jour.");
  };
  reader.readAsDataURL(file);
});

/* ---------------- Init ---------------- */
// 1. On restaure l'état enregistré (session, progression, offres publiées).
const hadSavedState = VoieStore.load();

// 2. Le compte de démonstration est créé à la volée avec un mot de passe haché.
if(!demoUsers.some(u => u.email === 'demo@voie.bj')){
  demoUsers.unshift({ name:"Démo", email:"demo@voie.bj", password: hashPwd("demo1234"), photo:null, role:"apprenant" });
} else {
  const demo = demoUsers.find(u => u.email === 'demo@voie.bj');
  if(demo && !checkPwd(demo.password, "demo1234") && demo.password !== hashPwd("demo1234")){
    demo.password = hashPwd("demo1234");
  }
}
if(hadSavedState) VoieStore.save();

renderNav();
renderStatsRow();
renderDomainShowcase();
renderStepFlowIcons();
renderFaq();
document.getElementById('role-icon-apprenant').innerHTML = ICONS.book;
document.getElementById('role-icon-entreprise').innerHTML = ICONS.commerce;
document.getElementById('auth-role-icon-apprenant').innerHTML = ICONS.book;
document.getElementById('auth-role-icon-entreprise').innerHTML = ICONS.commerce;
document.getElementById('auth-photo-preview').innerHTML = ICONS.person;

// 3. Restauration de l'écran : on revient là où l'utilisateur s'était arrêté.
const restoredScreen = currentScreen || 'home';
if(currentUser && (restoredScreen === 'home-apprenant' || restoredScreen === 'home-entreprise')){
  showScreen(restoredScreen, true);
} else if(currentUser && restoredScreen !== 'home' && restoredScreen !== 'login'){
  showScreen(restoredScreen, true);
} else {
  history.replaceState({ screen:'home' }, '', '#home');
}

// Animation de démarrage : masquée une fois le tracé et les lettres affichés.
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('splash-screen').classList.add('hide');
  }, 2700);
});
setTimeout(() => document.getElementById('splash-screen').classList.add('hide'), 4200);