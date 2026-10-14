/* ============================================================================================
   COUCHE DE PERSISTANCE + SÉCURITÉ (chargée AVANT app.js)
   --------------------------------------------------------------------------------------------
   - esc()      : échappement HTML systématique pour contrer les injections XSS (innerHTML)
   - hashPwd()  : les mots de passe ne sont plus stockés en clair (SHA-256 via l'API Web Crypto)
   - VoieStore  : sauvegarde / rechargement de l'état dans localStorage
   Les variables globales de app.js (state, jobsData, demoUsers...) sont des liaisons `let`
   de niveau supérieur : elles sont partagées entre les scripts classiques, donc ce fichier
   peut les lire et les écrire, à condition d'être exécuté APRÈS le chargement de app.js.
   ============================================================================================ */

const STORE_KEY = 'voie.state.v1';

/* Échappe une valeur destinée à être injectée via innerHTML. */
function esc(v){
  if(v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Échappe une valeur destinée à un attribut value="..." (même chose, plus explicite). */
function escAttr(v){ return esc(v); }

/* Empreinte des mots de passe — PROTOTYPE UNIQUEMENT.
   Le navigateur ne fournit pas de hachage robuste dans un contexte `file://`
   (crypto.subtle exige une origine sécurisée), et un secret côté client est
   toujours lisible. En production : hachage bcrypt/argon2 CÔTÉ SERVEUR, sur HTTPS.
   Objectif ici : ne plus stocker les mots de passe en clair. */
const PWD_PEPPER = 'voie-prototype-local';

function hashPwd(pwd){
  const plain = PWD_PEPPER + ':' + String(pwd == null ? '' : pwd);
  // FNV-1a 32 bits, appliqué deux fois (h1 + h2) pour élargir l'empreinte.
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for(let i = 0; i < plain.length; i++){
    const c = plain.charCodeAt(i);
    h1 ^= c; h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (Math.imul(h2 ^ c, 0x85ebca6b) + i) >>> 0;
  }
  const hex = n => ('00000000' + (n >>> 0).toString(16)).slice(-8);
  return 'fp$' + hex(h1) + hex(h2);
}

/* Vérifie un mot de passe contre une valeur stockée (empreinte ou clair hérité). */
function checkPwd(stored, pwd){
  if(stored == null) return false;
  if(typeof stored === 'string' && stored.indexOf('fp$') === 0){
    // Comparaison à temps constant.
    const a = stored, b = hashPwd(pwd);
    if(a.length !== b.length) return false;
    let diff = 0;
    for(let i = 0; i < a.length; i++) diff |= (a.charCodeAt(i) ^ b.charCodeAt(i));
    return diff === 0;
  }
  return stored === pwd; // ancien compte en clair, migré au prochain changement
}

/* Retourne une URL d'image sûre pour un attribut src, ou '' si la valeur est invalide. */
function safeImgSrc(url){
  if(typeof url !== 'string') return '';
  const u = url.trim();
  if(/^data:image\/(png|jpe?g|gif|webp);base64,[a-zA-Z0-9+/=\s]+$/i.test(u)) return u;
  if(/^https?:\/\/\S+$/i.test(u)) return escAttr(u);
  return '';
}

const VoieStore = {

  /** Sérialise l'ensemble de l'état utile dans localStorage. */
  save(){
    try{
      if(typeof state === 'undefined') return;
      const snapshot = {
        version: STORE_KEY,
        state: state,
        entrepriseAccount: (typeof entrepriseAccount !== 'undefined') ? entrepriseAccount : null,
        demoUsers: (typeof demoUsers !== 'undefined') ? demoUsers : [],
        jobsData: (typeof jobsData !== 'undefined') ? jobsData : [],
        modulesPassed: (typeof modulesPassed !== 'undefined') ? modulesPassed : {},
        academieState: (typeof academieState !== 'undefined') ? academieState : null,
        profilTab: (typeof profilTab !== 'undefined') ? profilTab : 'infos',
        candidatsFilter: (typeof candidatsFilter !== 'undefined') ? candidatsFilter : 'tous',
        explorerFilter: (typeof explorerFilter !== 'undefined') ? explorerFilter : 'tous',
        currentScreen: (typeof currentScreen !== 'undefined') ? currentScreen : 'home',
        currentUser: (typeof currentUser !== 'undefined') ? currentUser : null
      };
      localStorage.setItem(STORE_KEY, JSON.stringify(snapshot));
    }catch(err){ /* quota dépassé (photos base64) ou stockage désactivé : on ignore silencieusement */ }
  },

  /** Restaure l'état sauvegardé. Retourne true si quelque chose a été restauré. */
  load(){
    let snap = null;
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(!raw) return false;
      snap = JSON.parse(raw);
    }catch(err){ snap = null; }
    if(!snap || snap.version !== STORE_KEY) return false;

    try{
      if(snap.state && typeof snap.state === 'object'){
        const saved = snap.state;
        // On fusionne champ par champ pour ne pas écraser les valeurs par défaut du code.
        Object.keys(state).forEach(k => {
          if(saved[k] !== undefined) state[k] = saved[k];
        });
      }
      if(snap.entrepriseAccount) entrepriseAccount = snap.entrepriseAccount;
      if(Array.isArray(snap.demoUsers)) demoUsers = snap.demoUsers;
      if(Array.isArray(snap.jobsData)) jobsData = snap.jobsData;
      if(snap.modulesPassed && typeof snap.modulesPassed === 'object') modulesPassed = snap.modulesPassed;
      if(snap.academieState) academieState = snap.academieState;
      if(typeof snap.profilTab === 'string') profilTab = snap.profilTab;
      if(typeof snap.candidatsFilter === 'string') candidatsFilter = snap.candidatsFilter;
      if(typeof snap.explorerFilter === 'string') explorerFilter = snap.explorerFilter;
      if(typeof snap.currentScreen === 'string') currentScreen = snap.currentScreen;
      if(snap.currentUser) currentUser = snap.currentUser;
    }catch(err){ return false; }
    return true;
  },

  /** Efface toutes les données locales du navigateur. */
  clear(){
    try{ localStorage.removeItem(STORE_KEY); }catch(err){}
  }
};
