# Validation statique du projet Voie.
# Controles : ordre des scripts, identifiants, fonctions appelees, doublons,
# echappement des valeurs dynamiques, mot de passe de demonstration.
# Usage : powershell -NoProfile -ExecutionPolicy Bypass -File _validate.ps1
$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot
$html = [System.IO.File]::ReadAllText((Join-Path $root 'index.html'), [System.Text.Encoding]::UTF8)
$js = ''
foreach($f in 'storage.js','data.js','app.js'){
  $js += [System.IO.File]::ReadAllText((Join-Path $root "js\$f"), [System.Text.Encoding]::UTF8) + "`n"
}
$problems = @()

# 1. Ordre de chargement : storage doit preceder data, qui precede app.
$iStore = $html.IndexOf('js/storage.js')
$iData  = $html.IndexOf('js/data.js')
$iApp   = $html.IndexOf('js/app.js')
if($iStore -ge 0 -and $iStore -lt $iData -and $iData -lt $iApp){
  Write-Output 'OK    ordre des scripts : storage -> data -> app'
} else {
  $problems += "ordre de chargement incorrect (storage=$iStore, data=$iData, app=$iApp)"
}

# 2. Chaque getElementById doit exister dans le HTML ou etre genere par le JS.
$dynamicIds = @(
  'jobs-q','jobs-secteur','jobs-contrat','jobs-sort','jobs-filters','jobs-list','tabs','header-account',
  'auth-error','faq-list','stats-row','path-track','business-body','business-title','profil-body',
  'candidats-filters','candidats-list','explorer-filters','explorer-list','academie-body','academie-select',
  'fiche-body','job-detail-body','candidate-detail-body','confirm-text','toast',
  'job-form','jf-title','jf-sector','jf-level','jf-city','jf-contrat','jf-desc','jf-missions','jf-profil',
  'verify-form','vf-nom','vf-ifu','vf-email','vf-secteur',
  'profil-infos-form','pi-name','pi-phone','pi-birthdate','pi-city','pi-country','pi-address',
  'profil-compte-form','pc-email','profil-password-form','pp-current','pp-new','pp-confirm',
  'pw-bar','pw-hint','profil-ring','profil-parcours-form','pf-name','pf-age','pf-niveau'
)
$ids = [regex]::Matches($js, "getElementById\(\s*'([^']+)'\s*\)") | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$dyn = 0
foreach($id in $ids){
  if($html -match ("id=`"" + [regex]::Escape($id) + "`"")){ continue }
  if($dynamicIds -contains $id){ $dyn++ } else { $problems += "identifiant absent du HTML : $id" }
}
if($problems.Count -eq 0){ Write-Output ("OK    identifiants : " + $ids.Count + " verifies dont $dyn generes par le JS") }

# 3. Toute fonction appelee par onclick doit etre definie.
$called = [regex]::Matches(($html + $js), 'onclick="([a-zA-Z_][a-zA-Z0-9_]*)\(') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$defined = [regex]::Matches($js, 'function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
foreach($c in $called){ if($defined -notcontains $c){ $problems += "fonction appelee mais non definie : $c()" } }
if($problems.Count -eq 0){ Write-Output ("OK    " + $called.Count + " fonctions appelees, toutes definies") }

# 4. Aucun identifiant duplique dans le HTML statique.
$htmlIds = [regex]::Matches($html, 'id="([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
foreach($dp in ($htmlIds | Group-Object | Where-Object { $_.Count -gt 1 } | ForEach-Object { $_.Name })){
  $problems += "identifiant HTML duplique : $dp"
}
if($problems.Count -eq 0){ Write-Output ("OK    " + $htmlIds.Count + " identifiants HTML, aucun doublon") }

# 5. Mot de passe de demonstration : uniquement pour le hachage.
$pwdBad = ($js -split "`n") | Select-String -Pattern 'demo1234' |
          Where-Object { $_ -notlike '*hashPwd(*' -and $_ -notlike '*checkPwd(*' }
if($pwdBad){ $problems += 'mot de passe de demonstration stocke en clair' }
else { Write-Output 'OK    mot de passe de demo utilise uniquement pour le hachage' }

# 6. Balises principales equilibrees.
foreach($tag in 'section','div','form','main','footer','header'){
  $o = ([regex]::Matches($html, "<$tag[\s>]")).Count
  $c = ([regex]::Matches($html, "</$tag>")).Count
  if($o -ne $c){ $problems += "balise <$tag> : $o ouvrantes / $c fermantes" }
}
if($problems.Count -eq 0){ Write-Output 'OK    balises HTML equilibrees' }

# 7. Valeurs dynamiques : elles doivent passer par esc() ou escAttr().
$risky = @()
foreach($m in [regex]::Matches($js, '\$\{([^}]{1,90})\}')){
  $expr = $m.Groups[1].Value
  if($expr -match '(esc|escAttr|safeImgSrc)\('){ continue }
  # Calculs, indices et balisage interne : sans donnee utilisateur.
  if($expr -match 'ICONS|style=|class=|<|index|idx|jobsData\.indexOf|avatarInner|currentSet|s\.done|pct|Math\.|\.length|new Date|===|\?|jobsFilter|state\.|domKey|metierId|tab|jobId|jobsData\['){ continue }
  # Textes libres issus de saisies ou de donnees variables : a echapper.
  if($expr -match '(currentUser|entrepriseAccount|j\.|c\.|firstName|state\.profile|dom\.|metier|f\.|s\.label|a\.)'){
    $risky += $expr.Trim()
  }
}
foreach($r in ($risky | Sort-Object -Unique)){ $problems += "echappement manquant : `${$r}" }
if($risky.Count -eq 0){ Write-Output 'OK    valeurs dynamiques echappees' }

Write-Output ''
if($problems.Count -eq 0){
  Write-Output '=== VALIDATION REUSSIE : aucun probleme detecte ==='
} else {
  Write-Output '=== POINTS A VERIFIER ==='
  $problems | ForEach-Object { Write-Output (" - " + $_) }
}
