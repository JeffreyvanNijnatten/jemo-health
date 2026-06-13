#!/bin/sh
set -e

PUID=${PUID:-0}
PGID=${PGID:-0}

mkdir -p "${DATA_DIR:-/app/data}"

if [ "$PUID" != "0" ] || [ "$PGID" != "0" ]; then
  groupadd -f -g "$PGID" appgroup 2>/dev/null || true
  useradd -u "$PUID" -g "$PGID" -s /bin/sh -M appuser 2>/dev/null || true
  chown -R "$PUID:$PGID" "${DATA_DIR:-/app/data}"
  exec gosu "$PUID" "$@"
else
  exec "$@"
fi
