$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
    docker compose config --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Compose configuration failed' }
    npm.cmd --prefix frontend ci
    if ($LASTEXITCODE -ne 0) { throw 'Frontend install failed' }
    npm.cmd --prefix frontend run lint
    if ($LASTEXITCODE -ne 0) { throw 'Frontend lint failed' }
    npm.cmd --prefix frontend run build
    if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed' }
    npm.cmd --prefix frontend test
    if ($LASTEXITCODE -ne 0) { throw 'Frontend tests failed' }
    Push-Location backend
    try { .\gradlew.bat test; if ($LASTEXITCODE -ne 0) { throw 'Backend tests failed' } }
    finally { Pop-Location }
}
finally { Pop-Location }
