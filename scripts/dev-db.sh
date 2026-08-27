#!/usr/bin/env bash
#
# A local Postgres for developing and testing AITRANSIT.
#
# Why this exists: the app refuses to do anything useful without a database —
# every money action demands an account, every page reads real rows — so there
# is no "just run it and look around" without one. Neon is the production
# answer; this is the laptop one, and it costs nothing and needs no network.
#
#   ./scripts/dev-db.sh start     start it (creates it on first run)
#   ./scripts/dev-db.sh stop      stop it
#   ./scripts/dev-db.sh status    is it running?
#   ./scripts/dev-db.sh reset     drop everything and re-seed from scratch
#
# The data lives OUTSIDE the repo, in ~/.aitransit-pg, so a `git clean` or a
# fresh checkout cannot wipe the database you were half-way through testing.
set -euo pipefail

# initdb and postgres both refuse to start under some macOS locale settings —
# "invalid locale settings" from one, "postmaster became multithreaded" from
# the other. C is the safe answer and affects only sort order in this database.
export LC_ALL=C LANG=C

PGDATA="${AITRANSIT_PGDATA:-$HOME/.aitransit-pg}"
PORT="${AITRANSIT_PGPORT:-55432}"
# Short path on purpose: a Unix socket path over 103 bytes is refused, and the
# obvious choice (a directory beside the data) is well over it.
SOCKET_DIR="/tmp/aitransit-pg"
DB="aitransit"
PG=/opt/homebrew/bin
LOG="$PGDATA/server.log"

[ -x "$PG/pg_ctl" ] || { echo "Postgres not found at $PG. Install it: brew install postgresql@16"; exit 1; }

running() { "$PG/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; }

start() {
  mkdir -p "$SOCKET_DIR"
  if [ ! -d "$PGDATA/base" ]; then
    echo "Creating the database cluster in $PGDATA …"
    "$PG/initdb" -D "$PGDATA" -U postgres --auth=trust --locale=C --encoding=UTF8 >/dev/null
  fi
  if running; then
    echo "Already running on port $PORT."
  else
    "$PG/pg_ctl" -D "$PGDATA" -l "$LOG" \
      -o "-p $PORT -k $SOCKET_DIR -c listen_addresses=127.0.0.1" start >/dev/null
    sleep 1
  fi
  "$PG/psql" -h 127.0.0.1 -p "$PORT" -U postgres -tAc \
    "SELECT 1 FROM pg_database WHERE datname='$DB'" | grep -q 1 \
    || "$PG/psql" -h 127.0.0.1 -p "$PORT" -U postgres -qc "CREATE DATABASE $DB;"
  echo "Postgres is up on 127.0.0.1:$PORT, database '$DB'."
}

case "${1:-start}" in
  start) start ;;
  stop)
    running && "$PG/pg_ctl" -D "$PGDATA" stop -m fast >/dev/null && echo "Stopped." \
      || echo "Not running."
    ;;
  status)
    running && echo "Running on port $PORT." || echo "Not running."
    ;;
  reset)
    start
    echo "Dropping and recreating '$DB' …"
    "$PG/psql" -h 127.0.0.1 -p "$PORT" -U postgres -qc "DROP DATABASE IF EXISTS $DB WITH (FORCE);"
    "$PG/psql" -h 127.0.0.1 -p "$PORT" -U postgres -qc "CREATE DATABASE $DB;"
    npm run db:push
    npm run db:seed
    npm run db:seed:pricing
    echo "Reset and re-seeded."
    ;;
  *) echo "Usage: $0 {start|stop|status|reset}"; exit 1 ;;
esac
