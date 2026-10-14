/* Test de fumée (smoke test) : à charger APRÈS app.js dans une page de test.
   Vérifie le rendu initial, l'échappement, la persistance et la recherche d'offres.
   Usage : <script src="js/_test.js"></script> en dernier, puis lire #test-results. */
window.addEventListener('load', function(){
  var r = [];
  var ok = function(label, cond){ r.push((cond ? 'OK   ' : 'ECHEC ') + label); };

  try{
    // 1. Rendu initial
    ok('nav rendue', !!document.getElementById('tabs'));
    ok('ecran accueil visible', !!document.querySelector('#screen-home.visible'));
    ok('FAQ rendue', document.getElementById('faq-list').children.length > 0);
    ok('stats rendues', !!document.getElementById('stats-row'));

    // 2. Échappement XSS
    ok('esc() echappe les chevrons', esc('<img src=x onerror=alert(1)>').indexOf('<img') === -1);
    ok('esc() echappe les guillemets', esc('a"b').indexOf('&quot;') >= 0);
    ok('esc() gere null/undefined', esc(null) === '' && esc(undefined) === '');

    // 3. Empreinte des mots de passe
    var h1 = hashPwd('demo1234');
    ok('hashPwd deterministe', h1 === hashPwd('demo1234'));
    ok('hashPwd different selon saisie', h1 !== hashPwd('demo12345'));
    ok('checkPwd valide le bon mot de passe', checkPwd(h1, 'demo1234') === true);
    ok('checkPwd refuse le mauvais', checkPwd(h1, 'faux') === false);
    ok('mot de passe non stocke en clair', document.documentElement.innerHTML.indexOf('demo1234') === -1);

    // 4. Persistance
    state.applications.push({ jobId:'test-1', titre:'Offre test', entreprise:'Test SARL', date:new Date().toISOString(), statut:'envoyee' });
    state.savedJobs.push(jobsData[0].id);
    VoieStore.save();
    var raw = null;
    try{ raw = localStorage.getItem(STORE_KEY); }catch(e){}
    ok('etat ecrit dans localStorage', !!raw);
    ok('candidature persistee', raw && raw.indexOf('Offre test') >= 0);
    var reloaded = VoieStore.load();
    ok('etat recharge', reloaded === true && state.applications.length >= 1);
    VoieStore.clear();
    ok('etat effacable', localStorage.getItem(STORE_KEY) === null);

    // 5. Recherche et filtres d'offres
    currentUser = { name:'Test User', email:'test@voie.bj', photo:null, phone:'', birthdate:'', country:'Benin', city:'Cotonou', address:'' };
    state.userRole = 'apprenant';
    showScreen('jobs');
    var cards = document.querySelectorAll('#jobs-list .job-card').length;
    ok('offres affichees (' + cards + ')', cards > 0);
    ok('filtres rendus', !!document.getElementById('jobs-q'));

    jobsFilter.q = 'agricole';
    renderJobs();
    var filtered = document.querySelectorAll('#jobs-list .job-card').length;
    ok('recherche filtre (' + filtered + ' resultat)', filtered > 0 && filtered < cards);

    jobsFilter.q = 'zzzzzintrouvable';
    renderJobs();
    ok('etat vide affiche', !!document.querySelector('#jobs-list .empty'));
    resetJobsFilters();

    // 6. Favoris et candidature
    var favBtns = document.querySelectorAll('#jobs-list .btn-fav').length;
    ok('boutons favoris presents (' + favBtns + ')', favBtns > 0);
    var jid = jobsData[0].id;
    state.applications = [];
    applyJob(jobsData[0].titre);
    ok('candidature liee a une offre', hasApplied(jid) && state.applications[0].jobId === jid);
    applyJob(jobsData[0].titre);
    ok('pas de doublon de candidature', state.applications.length === 1);

    // 7. Échappement effectif dans le DOM (injection via données d'offre)
    jobsData.unshift({ id:'xss-1', titre:'<b>XSS</b>', entreprise:'<i>Bad</i>', secteur:'technologie', niveau:'Bac', ville:'Cotonou', contrat:'CDI', desc:'<script>alert(1)</script>', verifie:true, missions:[], profil:[] });
    renderJobs();
    ok('titre injecte neutralise', document.getElementById('jobs-list').querySelectorAll('.job-card b').length === 0);
    jobsData.shift();

    // 8. Modales accessibles
    modalStack = [];
    openModal('job-modal');
    ok('modale ouverte + role dialog', document.getElementById('job-modal').classList.contains('open') && document.getElementById('job-modal').getAttribute('aria-modal') === 'true');
    var evt = new KeyboardEvent('keydown', { key:'Escape' });
    document.dispatchEvent(evt);
    ok('Echap ferme la modale', !document.getElementById('job-modal').classList.contains('open') && modalStack.length === 0);

    // 9. Navigation protégée
    currentUser = null;
    state.userRole = null;
    showScreen('academie');
    ok('gardien redirige vers connexion', !!document.querySelector('#screen-login.visible'));

  }catch(err){
    r.push('EXCEPTION ' + (err && err.message));
  }

  var box = document.createElement('pre');
  box.id = 'test-results';
  box.textContent = r.join('\n');
  document.body.appendChild(box);
});
