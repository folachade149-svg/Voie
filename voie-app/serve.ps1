<#
  serve.ps1 - serveur statique minimal pour Voie.
  Usage : powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1 [-Port 8000]
  Puis ouvre http://localhost:8000/ dans le navigateur. Ctrl+C pour arreter.
  Remplace `python -m http.server` (Python n'est pas installe ici).
#>
param(
  [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'

# Sert le dossier parent de ce script, c'est-a-dire voie-app/.
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$prefix = "http://localhost:$Port/"

# Extensions servies avec leur type MIME.
$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.woff' = 'font/woff'
  '.woff2'= 'font/woff2'
  '.md'   = 'text/plain; charset=utf-8'
  '.txt'  = 'text/plain; charset=utf-8'
  '.ps1'  = 'text/plain; charset=utf-8'
}

# Empeche de sortir du dossier servi (protection contre ../).
function Get-SafePath([string]$urlPath){
  $decoded = [System.Uri]::UnescapeDataString($urlPath)
  $relative = $decoded.TrimStart('/') -replace '/', '\'
  if([string]::IsNullOrWhiteSpace($relative)){ $relative = 'index.html' }
  $full = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
  $rootFull = [System.IO.Path]::GetFullPath($root)
  if(-not $full.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)){
    return $null
  }
  return $full
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
try{
  $listener.Start()
}catch{
  Write-Host ("Impossible de demarrer sur {0} : {1}" -f $prefix, $_.Exception.Message) -ForegroundColor Red
  Write-Host 'Le port est peut-etre deja utilise. Essaie : -Port 8080'
  exit 1
}

Write-Host ''
Write-Host ('  Voie est servi sur   ' + $prefix) -ForegroundColor Green
Write-Host ('  Dossier              ' + $root) -ForegroundColor Gray
Write-Host '  Ctrl+C pour arreter' -ForegroundColor DarkGray
Write-Host ''

$bytes404 = [System.Text.Encoding]::UTF8.GetBytes('404 - introuvable')

while($listener.IsListening){
  $context = $null
  try{
    $context = $listener.GetContext()
  }catch{
    break   # listener arrete
  }
  if($null -eq $context){ continue }

  $req = $context.Request
  $res = $context.Response
  $target = Get-SafePath $req.Url.AbsolutePath

  # Une URL de dossier sert son index.html.
  if($target -and (Test-Path $target -PathType Container)){
    $target = Join-Path $target 'index.html'
  }

  if(-not $target -or -not (Test-Path $target -PathType Leaf)){
    $res.StatusCode = 404
    $res.OutputStream.Write($bytes404, 0, $bytes404.Length)
    $res.Close()
    Write-Host ('404  ' + $req.Url.AbsolutePath) -ForegroundColor DarkYellow
    continue
  }

  $ext = [System.IO.Path]::GetExtension($target).ToLower()
  $type = if($mime.ContainsKey($ext)){ $mime[$ext] } else { 'application/octet-stream' }

  $res.StatusCode = 200
  $res.ContentType = $type
  # Pas de cache : les modifications sont visibles au rechargement.
  $res.Headers.Add('Cache-Control', 'no-store, no-cache, must-revalidate')

  $content = [System.IO.File]::ReadAllBytes($target)
  $res.ContentLength64 = $content.Length
  $res.OutputStream.Write($content, 0, $content.Length)
  $res.Close()

  Write-Host ('200  ' + $req.Url.AbsolutePath) -ForegroundColor DarkGray
}
