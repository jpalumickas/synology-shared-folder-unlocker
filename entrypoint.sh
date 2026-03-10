#!/bin/sh
set -e

PUID="${PUID:-1000}"
PGID="${PGID:-1000}"

if [ "$(id -u app 2>/dev/null)" != "$PUID" ] || [ "$(id -g app 2>/dev/null)" != "$PGID" ]; then
  deluser app 2>/dev/null || true
  delgroup app 2>/dev/null || true
  addgroup -g "$PGID" app
  adduser -u "$PUID" -G app -s /bin/sh -D app
fi

chown app:app /data

exec su-exec app:app "$@"
