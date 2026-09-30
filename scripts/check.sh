#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
docker compose config --quiet
npm --prefix frontend ci
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend test
(cd backend && sh gradlew test)
