/* ============================================================================================
   ACADÉMIE — moteur pédagogique (chargé APRÈS app.js)
   --------------------------------------------------------------------------------------------
   Mise en page inspirée des plateformes de cours en ligne :
   - sommaire latéral listant modules et éléments (W3Schools / Cisco NetAcad)
   - navigation linéaire leçon par leçon, boutons Précédent / Suivant (W3Schools)
   - exercices à correction immédiate, progression verrouillée (freeCodeCamp)
   - examen noté avec mentions, correction détaillée et certificat de module
   ============================================================================================ */

const AC = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 12l5 5L20 6"/></svg>',
  dot:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/></svg>',
  lock:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  left:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>',
  award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 21l5-3 5 3-1.5-7"/></svg>',
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  info:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'
};

/* ---------- Liste ordonnée des éléments d'un module ---------- */
function academiePlan(domKey, moduleIdx){
  const mod = getModule(domKey, moduleIdx);
  const plan = [];
  if(mod.lecons){
    mod.lecons.forEach((lec, i) => plan.push({ kind:'lecon', index:i, label: lec.titre }));
    plan.push({ kind:'exercices', index:-1, label:'Exercices' });
    plan.push({ kind:'examen', index:-1, label:'Examen du module' });
  } else {
    plan.push({ kind:'programme', index:-1, label:'Programme prévu' });
  }
  return { plan, mod };
}

/* ---------- Navigation linéaire ---------- */
function academieGo(kind, index){
  academieState.tab = kind;
  academieState.lecIndex = (kind === 'lecon') ? index : 0;
  if(kind === 'examen'){ academieState.examAnswers = {}; academieState.examSubmitted = false; }
  renderAcademie();
  window.scrollTo({ top:0, behavior:'smooth' });
}

function academieCurrentPlanIndex(plan){
  if(academieState.tab === 'lecons'){
    return plan.findIndex(p => p.kind === 'lecon' && p.index === (academieState.lecIndex || 0));
  }
  return plan.findIndex(p => p.kind === academieState.tab);
}

function academiePrev(){
  const { plan } = academiePlan(academieState.domaine, academieState.moduleIndex);
  const cur = academieCurrentPlanIndex(plan);
  if(cur > 0){ const p = plan[cur - 1]; academieGo(p.kind, p.index); }
}

function academieNext(){
  const { plan } = academiePlan(academieState.domaine, academieState.moduleIndex);
  const cur = academieCurrentPlanIndex(plan);
  if(cur >= 0 && cur < plan.length - 1){ const p = plan[cur + 1]; academieGo(p.kind, p.index); }
}

/* ---------- Progression du module courant ---------- */
function academieProgress(){
  const domKey = academieState.domaine, mIdx = academieState.moduleIndex;
  const { plan } = academiePlan(domKey, mIdx);
  const done = plan.filter(p => {
    if(p.kind === 'lecon') return academieState.exoDone && academieState.exoDone['lec' + p.index];
    if(p.kind === 'exercices') return academieState.exoDone && academieState.exoDone.exo;
    if(p.kind === 'examen') return !!modulesPassed[domKey + '_' + mIdx];
    return false;
  }).length;
  const total = plan.filter(p => p.kind !== 'programme').length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}


/* ---------- Sommaire latéral (tous les modules) ---------- */
function renderAcademieToc(domKey, currentModule){
  return MODULE_TITRES.map((titre, idx) => {
    const unlocked = isModuleUnlocked(domKey, idx);
    const passed = !!modulesPassed[domKey + '_' + idx];
    const isCurrent = idx === currentModule;
    const statusCls = passed ? 'g-passed' : (unlocked ? 'g-current' : 'g-locked');
    const statusIcon = passed ? AC.check : (unlocked ? AC.dot : AC.lock);

    let items = '';
    if(isCurrent){
      const { plan } = academiePlan(domKey, idx);
      items = '<ul class="ac-items">' + plan.map(p => {
        const done = p.kind === 'lecon' ? (academieState.exoDone && academieState.exoDone['lec' + p.index])
                   : p.kind === 'exercices' ? (academieState.exoDone && academieState.exoDone.exo)
                   : p.kind === 'examen' ? !!modulesPassed[domKey + '_' + idx] : false;
        const active = (academieState.tab === 'lecons' && p.kind === 'lecon' && (academieState.lecIndex || 0) === p.index)
                    || (academieState.tab === p.kind && p.kind !== 'lecon');
        const bullet = done ? AC.check : (p.kind === 'lecon' ? (p.index + 1) : (p.kind === 'examen' ? '!' : '→'));
        const kindLabel = p.kind === 'lecon' ? 'leçon' : (p.kind === 'examen' ? 'examen' : (p.kind === 'exercices' ? 'quiz' : ''));
        return `<li><button class="ac-item ${active?'active':''} ${done?'done':''} type-${p.kind}"
                    onclick="academieGo('${p.kind}',${p.index})">
                  <span class="i-bullet">${bullet}</span>
                  <span>${esc(p.label)}</span>
                  <span class="i-kind">${kindLabel}</span>
                </button></li>`;
      }).join('') + '</ul>';
    }

    const headAction = unlocked
      ? `setAcademieModule(${idx})`
      : `toast('Réussis l examen du module précédent (70%) pour débloquer celui-ci.')`;

    return `
      <div class="ac-group">
        <div class="ac-group-head ${unlocked ? '' : 'locked'}">
          <span class="g-status ${statusCls}">${statusIcon}</span>
          <button class="g-btn" style="cursor:${unlocked?'pointer':'not-allowed'};" onclick="${headAction}">
            ${esc(titre.replace(/^Module \d+ — /, ''))}
          </button>
          <span class="g-duree">${esc(MODULE_DUREE[idx])}</span>
        </div>
        ${items}
      </div>
    `;
  }).join('');
}


/* ---------- Rendu principal ---------- */
function renderAcademie(){
  const select = document.getElementById('academie-select');
  select.innerHTML = Object.entries(SECTORS).map(([key,s]) => `<option value="${key}">${esc(s.name)}</option>`).join('');
  if(!academieState.domaine){
    academieState.domaine = state.sectorChosen || (state.topSectors[0] && state.topSectors[0].key) || 'technologie';
  }
  select.value = academieState.domaine;

  const domKey = academieState.domaine;
  const mIdx = academieState.moduleIndex;
  const sect = SECTORS[domKey];
  const prog = academieProgress();

  document.getElementById('academie-body').innerHTML = `
    <div class="ac-shell">
      <aside class="ac-side">
        <h3 class="ac-side-title">${sect ? sect.icon : ''} ${esc(sect ? sect.name : '')}</h3>
        <p class="ac-side-sub">Parcours certifiant · ${MODULE_TITRES.length} modules</p>
        <div class="ac-progress">
          <div class="ac-progress-head"><span>Progression du module</span><b>${prog.pct}%</b></div>
          <div class="ac-progress-bar"><i style="width:${prog.pct}%"></i></div>
        </div>
        <div id="ac-toc">${renderAcademieToc(domKey, mIdx)}</div>
      </aside>
      <div class="ac-main">
        <div class="ac-content">${renderAcademieContent(domKey, mIdx)}</div>
        <div class="ac-pager">${renderAcademiePager(domKey, mIdx)}</div>
      </div>
    </div>

/* ---------- Contenu principal ---------- */
function renderAcademieContent(domKey, mIdx){
  const mod = getModule(domKey, mIdx);
  const crumb = academieCrumb(domKey, mIdx);

  // Module sans contenu rédigé : on affiche honnêtement le programme prévu.
  if(!mod.lecons){
    return crumb + `
      <div class="ac-lesson">
        <h2>${esc(mod.titre)}</h2>
        <p class="ac-lede">${esc(mod.duree)} · programme structuré, contenu détaillé en préparation.</p>
        <ol class="ac-roadmap">
          ${(mod.topics || []).map((t, i) => `<li><span class="rm-num">0${i+1}</span><span>${esc(t)}</span></li>`).join('')}
        </ol>
        <div class="ac-soon">${AC.info}
          <p>Ce module suit la même trame que des programmes de référence (blocs de certification
          freeCodeCamp pour la technologie, unités de première année pour la santé, etc.).
          Le Module 1 est, lui, entièrement rédigé et disponible : leçons, exercices corrigés et examen.
          Ce module se débloquera avec son contenu complet dans une prochaine itération.</p>
        </div>
      </div>`;
  }

  if(academieState.tab === 'exercices'){ return crumb + renderExercices(domKey, mIdx); }
  if(academieState.tab === 'examen'){ return crumb + renderExamen(domKey, mIdx); }

  // Leçon
  const i = academieState.lecIndex || 0;
  const lec = mod.lecons[i];
  if(!lec){ academieState.lecIndex = 0; return crumb + renderExercices(domKey, mIdx); }
  return crumb + `
    <div class="ac-lesson">
      <h2>${esc(lec.titre)}</h2>
      <p class="ac-lede">Leçon ${i+1} sur ${mod.lecons.length} · ${esc(mod.titre.replace(/^Module \d+ — /, ''))}</p>
      ${lec.definition ? `<div class="ac-def"><strong>DÉFINITION — </strong>${esc(lec.definition)}</div>` : ''}
      <div class="ac-body">${(lec.contenu || []).map(p => `<p>${esc(p)}</p>`).join('')}</div>
      ${lec.exemple ? `<div class="ac-callout example"><span class="c-tag">Exemple concret</span><p>${esc(lec.exemple)}</p></div>` : ''}
      ${lec.note ? `<div class="ac-callout warn"><span class="c-tag">⚠ Erreur fréquente à éviter</span><p>${esc(lec.note)}</p></div>` : ''}
      ${lec.pointscles ? `<div class="ac-keys"><h4>À retenir</h4><ul>${lec.pointscles.map(k => `<li>${esc(k)}</li>`).join('')}</ul></div>` : ''}
      <div style="margin-top:24px;">
        <button class="btn btn-gold btn-sm" onclick="academieMarkRead(${i})">${(academieState.exoDone && academieState.exoDone['lec'+i]) ? '✓  Leçon validée' : 'Marquer cette leçon comme lue'}</button>

/* ---------- Exercices à correction immédiate ---------- */
function renderExercices(domKey, mIdx){
  const mod = getModule(domKey, mIdx);
  const exos = mod.exercices || [];
  const answered = exos.filter((_, i) => academieState.exoDone && academieState.exoDone['exo' + i]).length;
  return `
    <div class="ac-lesson">
      <h2>Exercices d'application</h2>
      <p class="ac-lede">${exos.length} questions à correction immédiate · ${answered}/${exos.length} réussies. Aucune pénalité : l'objectif est de comprendre.</p>
      ${exos.map((ex, i) => {
        const done = academieState.exoDone && academieState.exoDone['exo' + i];
        const chosen = academieState.exoDone && academieState.exoDone['exoAns' + i];
        return `
        <div class="ac-exo">
          <div class="ac-exo-head"><span class="ac-exo-num">${i+1}</span><span>Question ${i+1} / ${exos.length}</span></div>
          <p class="ac-exo-q">${esc(ex.q)}</p>
          <div class="ac-opts">
            ${ex.options.map((opt, oi) => {
              let cls = '';
              if(done){
                if(oi === ex.correct) cls = 'correct';
                else if(oi === chosen) cls = 'incorrect';
              }
              return `<button class="ac-opt ${cls}" ${done ? 'disabled' : `onclick="academieAnswerExo(${i},${oi})"`}>
                        <span class="o-key">${String.fromCharCode(65 + oi)}</span><span>${esc(opt)}</span>
                      </button>`;
            }).join('')}
          </div>
          <div class="ac-fb ${done ? 'show' : ''} ${chosen === ex.correct ? 'ok' : 'ko'}">
            <b>${chosen === ex.correct ? 'Exact.' : 'Réponse : ' + String.fromCharCode(65 + ex.correct) + '.'}</b> ${esc(ex.explication || '')}
          </div>
        </div>`;
      }).join('')}
      ${answered === exos.length && exos.length ? `
        <div class="ac-soon" style="margin-top:6px;">${AC.check}
          <p>Tous les exercices sont traités. Direction l'examen du module pour valider et débloquer la suite.</p>
        </div>
        <div style="margin-top:14px;"><button class="btn btn-gold btn-sm" onclick="academieGo('examen',-1)">Passer l'examen →</button></div>`
      : ''}
    </div>`;
}

function academieAnswerExo(i, oi){
  const domKey = academieState.domaine, mIdx = academieState.moduleIndex;
  const ex = getModule(domKey, mIdx).exercices[i];

/* ---------- Examen du module ---------- */
function renderExamen(domKey, mIdx){
  const mod = getModule(domKey, mIdx);
  const ex = mod.examen || [];

  // Examen vient d'être validé : on affiche le résultat détaillé.
  if(academieState.examSubmitted){
    const r = academieState.examResults[domKey + '_' + mIdx];
    if(r){ return academieCrumb(domKey, mIdx) + academieExamResult(domKey, mIdx, r.score, ex.length, r.detail, false); }
  }

  const passed = !!modulesPassed[domKey + '_' + mIdx];
  // Module déjà validé auparavant : on propose le certificat/résumé.
  if(passed){
    const r = academieState.examResults ? academieState.examResults[domKey + '_' + mIdx] : null;
    return academieCrumb(domKey, mIdx) + academieExamResult(domKey, mIdx, r ? r.score : ex.length, ex.length, r ? r.detail : [], true);
  }

  const answeredCount = Object.keys(academieState.examAnswers).length;
  return `
    <div class="ac-lesson">
      <h2>Examen du module</h2>
      <p class="ac-lede">Valide ce module pour débloquer le suivant. Seuil de réussite : 70%.</p>
      <div class="ac-exam-meta">
        <div>Questions<b>${ex.length}</b></div>
        <div>Seuil de réussite<b class="gold">70%</b></div>
        <div>Tentatives<b>illimitées</b></div>
        <div>Réponses<b id="exam-count">${answeredCount}/${ex.length}</b></div>
      </div>
      ${ex.map((q, i) => `
        <div class="ac-exam-q">
          <span class="q-num">Question ${i+1}</span>
          <p class="q-text">${esc(q.q)}</p>
          <div class="ac-opts">
            ${q.options.map((opt, oi) => `
              <button class="ac-opt ${academieState.examAnswers[i] === oi ? 'sel' : ''}"
                      onclick="academieSelectExam(${i},${oi})">
                <span class="o-key">${String.fromCharCode(65 + oi)}</span><span>${esc(opt)}</span>
              </button>`).join('')}
          </div>
        </div>`).join('')}
      <div class="ac-submit-row">
        <button class="btn btn-gold" onclick="academieSubmitExam()">Valider l'examen</button>
        <span class="hint">${answeredCount < ex.length ? `Encore ${ex.length - answeredCount} question(s) sans réponse.` : 'Toutes les questions ont une réponse.'}</span>
      </div>
    </div>`;
}

function academieSelectExam(qIndex, oi){
  academieState.examAnswers[qIndex] = oi;
  renderAcademie();
}

function academieSubmitExam(){
  const domKey = academieState.domaine, mIdx = academieState.moduleIndex;
  const ex = getModule(domKey, mIdx).examen || [];
  if(Object.keys(academieState.examAnswers).length < ex.length){
    toast('Réponds à toutes les questions avant de valider.');
    return;
  }
  let score = 0;
  const detail = ex.map((q, i) => {
    const ok = academieState.examAnswers[i] === q.correct;
    if(ok) score++;
    return { ok, q: q.q, chosen: academieState.examAnswers[i], correct: q.correct, options: q.options };
  });
  if(!academieState.examResults){ academieState.examResults = {}; }
  academieState.examResults[domKey + '_' + mIdx] = { score, detail };
  academieState.examSubmitted = true;

  if(score / ex.length >= 0.7){

/* ---------- Barre Précédent / Suivant ---------- */
function renderAcademiePager(domKey, mIdx){
  const { plan } = academiePlan(domKey, mIdx);
  const cur = academieCurrentPlanIndex(plan);
  const hasPrev = cur > 0;
  const hasNext = cur >= 0 && cur < plan.length - 1;
  const prev = hasPrev ? plan[cur - 1] : null;
  const next = hasNext ? plan[cur + 1] : null;
  const total = plan.filter(p => p.kind !== 'programme').length;
  const pos = cur + 1;

  return `
    <button class="p-btn" ${hasPrev ? '' : 'disabled'} onclick="academiePrev()">
      ${AC.left}<span>${prev ? esc(prev.label.length > 26 ? prev.label.slice(0,26) + '…' : prev.label) : 'Début'}</span>
    </button>
    <span class="p-mid">${total ? pos + ' / ' + total : ''}</span>
    <button class="p-btn next" ${hasNext ? '' : 'disabled'} onclick="academieNext()">
      <span>${next ? esc(next.label.length > 26 ? next.label.slice(0,26) + '…' : next.label) : 'Fin du module'}</span>${AC.right}
    </button>
  `;
}

/* Le sélecteur de domaine est câblé ici (remplace l'ancien listener de app.js). */
document.getElementById('academie-select').addEventListener('change', e => setAcademieDomaine(e.target.value));

    modulesPassed[domKey + '_' + mIdx] = true;
    state.examCompleted = true;
  }
  VoieStore.save();
  renderAcademie();
  renderPath();
}

/* Écran de résultat d'examen avec correction détaillée. */
function academieExamResult(domKey, mIdx, score, total, detail, alreadyPassed){
  const ratio = total ? score / total : 0;
  const pass = ratio >= 0.7;
  let mention;
  if(ratio >= 0.9) mention = 'Mention très bien';
  else if(ratio >= 0.8) mention = 'Mention bien';
  else if(ratio >= 0.7) mention = 'Admis(e)';
  else mention = 'Non admis(e)';

  const nextUnlocked = mIdx + 1 < MODULE_TITRES.length;
  return `
    <div class="ac-result ${pass ? 'pass' : 'fail'}">
      <div class="r-badge">${pass ? AC.award : AC.cross}</div>
      <div class="r-score">${score}/${total}</div>
      <h3>${mention}</h3>
      <p class="r-msg">${pass
        ? (alreadyPassed ? 'Module déjà validé. Tu peux repasser l'examen pour améliorer ton score, ou avancer.' : 'Bravo — tu maîtrises les bases de ce module.' + (nextUnlocked ? ' Le module suivant est débloqué.' : ' Tu as terminé le contenu disponible de ce domaine.'))
        : 'Le seuil de réussite est de 70%. Reprends les leçons et les exercices, puis retente l'examen quand tu te sens prêt(e).'}</p>
      <div class="r-actions">
        <button class="btn btn-ghost btn-sm" onclick="academieRetryExam()">${pass ? 'Améliorer mon score' : 'Repasser l\'examen'}</button>
        <button class="btn btn-ghost btn-sm" onclick="academieGo('exercices',-1)">Revoir les exercices</button>
        ${pass && nextUnlocked ? `<button class="btn btn-gold btn-sm" onclick="setAcademieModule(${mIdx+1})">Module suivant →</button>` : ''}
      </div>
      ${detail.length ? `
        <div class="r-breakdown">
          <h4>Correction détaillée</h4>
          ${detail.map(d => `
            <div class="r-line ${d.ok ? 'ok' : 'ko'}">
              <span class="m">${d.ok ? '✓' : '✗'}</span>
              <span>${esc(d.q)}${d.ok ? '' : ' — <b>Réponse : ' + esc(d.options[d.correct]) + '</b>'}</span>
            </div>`).join('')}
        </div>` : ''}
    </div>`;
}

function academieRetryExam(){
  academieState.examAnswers = {};
  academieState.examSubmitted = false;
  academieState.tab = 'examen';
  renderAcademie();
  window.scrollTo({ top:0, behavior:'smooth' });
}

  if(!academieState.exoDone){ academieState.exoDone = {}; }
  academieState.exoDone['exo' + i] = true;
  academieState.exoDone['exoAns' + i] = oi;
  VoieStore.save();
  renderAcademie();
}

      </div>
    </div>`;
}

/* Marque une leçon comme lue et sauvegarde. */
function academieMarkRead(i){
  if(!academieState.exoDone){ academieState.exoDone = {}; }
  if(!academieState.exoDone['lec' + i]){
    academieState.exoDone['lec' + i] = true;
    VoieStore.save();
  }
  renderAcademie();
}

  `;
}

/* ---------- Fil d'Ariane ---------- */
function academieCrumb(domKey, mIdx){
  const sect = SECTORS[domKey];
  const mod = getModule(domKey, mIdx);
  let current = 'Programme';
  if(academieState.tab === 'lecons'){ current = 'Leçon ' + ((academieState.lecIndex || 0) + 1); }
  else if(academieState.tab === 'exercices'){ current = 'Exercices'; }
  else if(academieState.tab === 'examen'){ current = 'Examen'; }
  return `<div class="ac-crumb">
      <span>Académie</span><span class="sep">/</span>
      <b>${esc(sect ? sect.name : '')}</b><span class="sep">/</span>
      <b>${esc(mod.titre.replace(/^Module \d+ — /, ''))}</b><span class="sep">/</span>
      <b>${current}</b>
    </div>`;
}
