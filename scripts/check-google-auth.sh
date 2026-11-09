#!/usr/bin/env bash
# Probe Supabase Google provider for local OAuth readiness.
set -euo pipefail

URL="${NEXT_PUBLIC_SUPABASE_URL:-https://kaiffjdbfjkjqisumklh.supabase.co}"
REDIRECT="${1:-http://localhost:3000/auth/callback/}"
AUTH_URL="${URL%/}/auth/v1/authorize?provider=google&redirect_to=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$REDIRECT")"

echo "Probing: $AUTH_URL"
BODY="$(curl -sS -w "\n%{http_code}" "$AUTH_URL" || true)"
HTTP="$(printf '%s\n' "$BODY" | tail -n1)"
JSON="$(printf '%s\n' "$BODY" | sed '$d')"

echo "HTTP $HTTP"
echo "$JSON"

if echo "$JSON" | grep -qi 'not enabled'; then
  echo
  echo "FAIL: Google provider is not enabled in Supabase Auth → Providers."
  exit 1
fi

if [[ "$HTTP" == "302" || "$HTTP" == "303" || "$HTTP" == "307" || "$HTTP" == "301" ]]; then
  echo
  echo "OK: authorize redirected (provider enabled). Complete Google sign-in in the browser."
  exit 0
fi

# 200 with HTML login or redirect to accounts.google.com also means enabled
if echo "$JSON" | grep -qi 'accounts.google.com\|Sign in with Google\|oauth'; then
  echo
  echo "OK: Google provider appears enabled."
  exit 0
fi

echo
echo "WARN: unexpected response — open the URL in a browser and check Google Cloud Client ID/Secret + redirect URI."
exit 2
