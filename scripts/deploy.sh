#!/usr/bin/env bash
# deploy.sh — control de deploy para kineticaai.com
# Uso: ./scripts/deploy.sh [mensaje-de-commit opcional]
set -euo pipefail

# ─── colores ──────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

step()  { echo -e "\n${CYAN}${BOLD}[$1]${RESET} $2"; }
ok()    { echo -e "${GREEN}✓${RESET} $1"; }
warn()  { echo -e "${YELLOW}⚠${RESET}  $1"; }
fail()  { echo -e "${RED}✗${RESET}  $1"; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ─── PASO 1: estado del repo ──────────────────────────────────────────
step "1/6" "Estado del repositorio"
git status --short

MODIFIED=$(git diff --name-only)
STAGED=$(git diff --cached --name-only)
UNTRACKED=$(git ls-files --others --exclude-standard | grep -v '\.claude/' || true)

if [[ -z "$MODIFIED" && -z "$STAGED" && -z "$UNTRACKED" ]]; then
  warn "No hay cambios pendientes. El deploy ya está al día."
  exit 0
fi

# ─── PASO 2: build local ──────────────────────────────────────────────
step "2/6" "Build local (astro build)"
echo "  Verificando que no hay errores antes de hacer push..."
if ! npm run build --silent 2>&1 | tail -5; then
  fail "Build fallido — no se hace push. Revisa los errores."
fi
ok "Build OK → dist/ generado"

# ─── PASO 3: staging ─────────────────────────────────────────────────
step "3/6" "Staging de archivos"

# Si ya hay archivos staged, usarlos; si no, añadir todos los modificados
if [[ -z "$STAGED" ]]; then
  # Añadir modificados (no .claude/ ni dist/)
  git add --all -- ':!.claude/' ':!dist/'
  echo "  Archivos añadidos:"
  git diff --cached --name-only | sed 's/^/    + /'
else
  echo "  Usando archivos ya staged:"
  git diff --cached --name-only | sed 's/^/    + /'
fi

# ─── PASO 4: commit ───────────────────────────────────────────────────
step "4/6" "Commit"

if [[ -n "${1:-}" ]]; then
  MSG="$1"
else
  echo -e "  Escribe el mensaje de commit (vacío = 'chore: update content'):"
  read -r MSG
  MSG="${MSG:-chore: update content}"
fi

git commit -m "$MSG"
ok "Commit: $MSG"

# ─── PASO 5: push ────────────────────────────────────────────────────
step "5/6" "Push → origin/main"
git push origin main
ok "Push completado"

# ─── PASO 6: estado del deploy en GitHub Actions ─────────────────────
step "6/6" "Estado del deploy en GitHub Actions"

if command -v gh &>/dev/null; then
  echo "  Esperando que arrange el workflow..."
  sleep 4
  RUN_URL=$(gh run list --workflow=deploy.yml --limit=1 --json url --jq '.[0].url' 2>/dev/null || true)
  RUN_STATUS=$(gh run list --workflow=deploy.yml --limit=1 --json status,conclusion --jq '.[0] | "\(.status) \(.conclusion)"' 2>/dev/null || true)

  echo "  → $RUN_STATUS"
  [[ -n "$RUN_URL" ]] && echo "  → $RUN_URL"

  echo ""
  echo -e "  ${BOLD}Sigue el deploy en vivo:${RESET}"
  echo "  gh run watch \$(gh run list --workflow=deploy.yml --limit=1 --json databaseId --jq '.[0].databaseId')"
else
  warn "gh CLI no encontrado — revisa el deploy manualmente en:"
  echo "  https://github.com/kinetica-IA/portfolio-alfie/actions"
fi

echo ""
echo -e "${GREEN}${BOLD}Pipeline completo${RESET}"
echo -e "  Local build  → ${GREEN}OK${RESET}"
echo -e "  Git push     → ${GREEN}origin/main${RESET}"
echo -e "  Actions      → build (≈90s) → deploy (≈30s)"
echo -e "  DNS          → Cloudflare → GitHub Pages"
echo -e "  URL final    → ${CYAN}https://www.kineticaai.com${RESET}"
