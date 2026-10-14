/* Test de fumée : à charger EN DERNIER dans une page de test.
   Couvre rendu initial, sécurité, quiz, moteur Académie, persistance, offres, modales.
   Usage : <script src="js/_test.js"></script> puis lire #test-results. */
window.addEventListener('load', function(){
  var r = [];
  var ok = function(label, cond){ r.push((cond ? 'OK   ' : 'ECHEC ') + label); };
  function has(sel){ return !!document.querySelector(sel); }
  function txt(el){ return el ? el.innerHTML : ''; }
  function resetAcademie(dom, mod){
    academieState.domaine = dom; academieState.moduleIndex = mod;
    academieState.tab = 'lecons'; academieState.lecIndex = 0;
    academieState.exoDone = {}; academieState.examAnswers = {}; academieState.examSubmitted = false;
  }

  try{
    /* ===== Base ===== */
    ok('nav rendue', !!document.getElementById('tabs'));
    ok('accueil visible', has('#screen-home.visible'));
    ok('FAQ rendue', document.getElementById('faq-list').children.length > 0);

    /* ===== Sécurité ===== */
    ok('esc() neutralise les chevrons', esc('<img src=x onerror=alert(1)>').indexOf('<img') === -1);
    ok('esc() echappe les guillemets', esc('a"b').indexOf('&quot;') >= 0);
    var h1 = hashPwd('demo1234');
    ok('hashPwd deterministe', h1 === hashPwd('demo1234'));
    ok('hashPwd different selon saisie', h1 !== hashPwd('demo12345'));
    ok('checkPwd valide / refuse', checkPwd(h1,'demo1234') === true && checkPwd(h1,'faux') === false);

    /* ===== Quiz ===== */
    var S10 = ['sante','technologie','art','commerce','agriculture','education','ingenierie','psychologie','mode','aviation'];
    var minCov = 99;
    S10.forEach(function(s){
      var c = (QUIZ.join('').match(new RegExp('"'+s+'"','g')) || []).length;
      if(c < minCov) minCov = c;
    });
    ok('quiz ' + QUIZ.length + ' questions, min secteur = ' + minCov, QUIZ.length >= 40 && minCov >= 6);

    /* ===== Académie : contenu ===== */
    ok('academie.js chargé', typeof renderAcademie === 'function' && typeof academieGo === 'function');
    var full = S10.filter(function(s){ return COURS[s] && COURS[s].lecons && COURS[s].lecons.length === 3 && COURS[s].exercices.length >= 10 && COURS[s].examen.length >= 10; });
    ok('10 domaines complets (leçons+exos+examen): ' + full.length + '/10', full.length === 10);

    /* ===== Académie : rendu plateforme ===== */
    resetAcademie('technologie', 0);
    renderAcademie();
    var body = document.getElementById('academie-body');
    ok('layout plateforme (shell+sidebar+main)', has('.ac-shell') && has('.ac-side') && has('.ac-main'));
    ok('barre de progression du module', has('.ac-progress-bar'));
    ok('sommaire liste 3 modules', document.querySelectorAll('.ac-group').length === 3);
    ok('bouton marquer la leçon', /Marquer cette le/.test(txt(body)) || /Leçon validée/.test(txt(body)));

    /* ===== Navigation leçon par leçon ===== */
    var nl = getModule('technologie', 0).lecons.length;
    ok('module 1 a ' + nl + ' leçons', nl === 3);
    academieGo('lecon', 1);
    ok('aller à la leçon 2', academieState.lecIndex === 1);
    academieGo('lecon', 0);
    academieMarkRead(0);
    ok('leçon 1 marquée lue', academieState.exoDone['lec0'] === true);

    academieState.tab = 'lecons'; academieState.lecIndex = 0;
    ok('barre précédent/suivant', has('.ac-pager'));
    academieNext();
    ok('Suivant : leçon 1 -> 2', academieState.lecIndex === 1);
    academiePrev();
    ok('Précédent : leçon 2 -> 1', academieState.lecIndex === 0);

    /* ===== Exercices à correction immédiate ===== */
    academieGo('exercices', -1);
    var exos = getModule('technologie', 0).exercices;
    ok('onglet exercices', /Exercices/.test(txt(document.getElementById('academie-body'))));
    academieAnswerExo(0, exos[0].correct);
    ok('exercice réponse enregistrée', academieState.exoDone['exo0'] === true);

    /* ===== Examen + progression + déblocage ===== */
    var prog = academieProgress();
    ok('progression calculée (' + prog.done + '/' + prog.total + ')', prog.total > 0 && prog.done >= 2);

    academieGo('examen', -1);
    ok('examen affiché', /Examen du module/.test(txt(document.getElementById('academie-body'))));
    var exam = getModule('technologie', 0).examen;
    exam.forEach(function(q, i){ academieSelectExam(i, q.correct); });
    academieSubmitExam();
    ok('module 1 validé (examen réussi)', modulesPassed['technologie_0'] === true);
    ok('correction détaillée affichée', /Correction détaillée/.test(txt(document.getElementById('academie-body'))));
    ok('module 2 débloqué', isModuleUnlocked('technologie', 1) === true);

    modulesPassed['technologie_0'] = false;
    academieGo('examen', -1);
    exam.forEach(function(q, i){ academieSelectExam(i, (q.correct + 1) % q.options.length); });
    academieSubmitExam();
    ok('échec : module reste verrouillé', modulesPassed['technologie_0'] !== true);
    ok('message de seuil affiché', /70|seuil|Non admis/i.test(txt(document.getElementById('academie-body'))));

    /* ===== Module 2 réel + module vide honnête ===== */
    modulesPassed['technologie_0'] = true;
    academieState.moduleIndex = 1; academieState.tab = 'lecons'; academieState.lecIndex = 0;
    renderAcademie();
    var m2 = getModule('technologie', 1);
    ok('technologie module 2 réel (' + (m2.lecons ? m2.lecons.length : 0) + ' leçons)', m2.lecons && m2.lecons.length > 0);

    resetAcademie('art', 2);
    renderAcademie();
    ok('module sans contenu affiche le programme', /Programme/.test(txt(document.getElementById('academie-body'))));

    /* ===== Persistance ===== */
    resetAcademie('technologie', 0);
    VoieStore.save();
    ok('progression académie persistée', localStorage.getItem(STORE_KEY).indexOf('technologie') >= 0);

    /* ===== Offres (régression) ===== */
    currentUser = { name:'Test', email:'test@voie.bj', photo:null, phone:'', birthdate:'', country:'Benin', city:'Cotonou', address:'' };
    state.userRole = 'apprenant';
    showScreen('jobs');
    var cards = document.querySelectorAll('#jobs-list .job-card').length;
    ok('offres affichées (' + cards + ')', cards > 0);
    jobsFilter.q = 'agricole'; renderJobs();
    var filtered = document.querySelectorAll('#jobs-list .job-card').length;
    ok('recherche filtre (' + filtered + ')', filtered > 0 && filtered < cards);
    resetJobsFilters();

    /* ===== Modales ===== */
    modalStack = [];
    openModal('job-modal');
    ok('modale role=dialog', has('#job-modal[aria-modal="true"]'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape' }));
    ok('Échap ferme la modale', !document.getElementById('job-modal').classList.contains('open'));

    /* ===== Responsivité ===== */
    var sheets = document.styleSheets;
    var countMedia = 0;
    for(var s2 = 0; s2 < sheets.length; s2++){
      try{
        var rules = sheets[s2].cssRules;
        for(var q = 0; q < rules.length; q++){
          if(rules[q].constructor.name === 'CSSMediaRule') countMedia++;
        }
      }catch(e){}
    }
    ok('feuilles de style chargées (' + sheets.length + ')', sheets.length >= 2);
    ok('media queries présentes (' + countMedia + ')', countMedia >= 20);
    ok('viewport mobile présent', !!document.querySelector('meta[name="viewport"]'));

    VoieStore.clear();
  }catch(err){
    r.push('EXCEPTION ' + (err && err.message));
  }

  var box = document.createElement('pre');
  box.id = 'test-results';
  box.textContent = r.join('\n');
  document.body.appendChild(box);
});

