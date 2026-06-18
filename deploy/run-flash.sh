#!/usr/bin/env bash
# Quorima daily CFO flash — cron-wrapper met Telegram run/fail-melding
# (dead-man's-switch, zelfde patroon als de Hermes Gmail-pipeline).
#
# Exit codes van de flash: 0 = ok · 2 = kritieke escalatie (wél gelukt) ·
# anders = echte fout.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE/../quorima-mvp"

# Optionele Telegram-config uit een gitignored bestand (niet in de repo):
#   TELEGRAM_BOT_TOKEN=...   TELEGRAM_CHAT_ID=...   TELEGRAM_THREAD_ID=...(topic)
[ -f "$HERE/telegram.env" ] && . "$HERE/telegram.env"

notify() {
  [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ] || return 0
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    ${TELEGRAM_THREAD_ID:+--data-urlencode "message_thread_id=${TELEGRAM_THREAD_ID}"} \
    --data-urlencode "text=$1" >/dev/null || true
}

OUT="$(npm run --silent flash 2>&1)"; CODE=$?
TAIL="$(printf '%s\n' "$OUT" | tail -n 20)"

case "$CODE" in
  0) STATUS="✅ Quorima daily flash OK" ;;
  2) STATUS="🚨 Quorima flash — KRITIEKE escalatie (run gelukt)" ;;
  *) STATUS="❌ Quorima flash FAILED (exit $CODE)" ;;
esac

# Altijd naar stdout (cron schrijft dit naar flash.log) + optioneel Telegram.
printf '[%s] %s\n%s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$STATUS" "$TAIL"
notify "$STATUS
$TAIL"

exit "$CODE"
