#!/usr/bin/env bash
# Quorima daily CFO flash — cron-wrapper met Telegram run/fail-melding
# (dead-man's-switch, zelfde patroon als de Hermes Gmail-pipeline).
#
# Exit codes van de flash: 0 = ok · 2 = kritieke escalatie (wél gelukt) ·
# anders = echte fout.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE/../quorima-mvp"

# Optioneel: zet TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in de cron-env.
notify() {
  [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ] || return 0
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=$1" >/dev/null || true
}

OUT="$(npm run --silent flash 2>&1)"; CODE=$?
TAIL="$(printf '%s\n' "$OUT" | tail -n 20)"

case "$CODE" in
  0) notify "✅ Quorima daily flash OK
$TAIL" ;;
  2) notify "🚨 Quorima flash — KRITIEKE escalatie (run gelukt)
$TAIL" ;;
  *) notify "❌ Quorima flash FAILED (exit $CODE)
$TAIL" ;;
esac

exit "$CODE"
