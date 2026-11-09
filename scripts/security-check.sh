#!/usr/bin/env bash
# Lightweight safety check for Media Critic (not a full VAPT).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> npm audit (high+)"
npm audit --audit-level=high || {
  echo "WARN: npm audit reported high/critical issues. Review before deploy."
}

echo "==> eslint"
npm run lint

echo "==> production / GHP build"
npm run build:ghp

echo "==> secret / XSS pattern scan in src"
if grep -RInE 'service_role|sb_secret_|whsec_|eyJhbGci|dangerouslySetInnerHTML' src 2>/dev/null; then
  echo "FAIL: suspicious pattern found under src/"
  exit 1
fi
echo "OK: no forbidden patterns in src/"

echo "==> ensure .env.local is not tracked"
if git ls-files --error-unmatch .env.local >/dev/null 2>&1; then
  echo "FAIL: .env.local is tracked by git"
  exit 1
fi
echo "OK: .env.local not tracked"

echo "Security check finished."
