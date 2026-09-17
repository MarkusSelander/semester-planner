#!/usr/bin/env bash
# Per-boot runtime initialization for the Cloud Agent environment.
# Starts PostgreSQL, ensures the role/database exist, and syncs the schema.
# Must be idempotent: it runs on every environment boot.
set -euo pipefail

cd "$(dirname "$0")/.."

PGVER="$(ls /usr/lib/postgresql/ | sort -V | tail -1)"

# --- Ensure the PostgreSQL cluster is running (idempotent) ---
if ! sudo pg_ctlcluster "$PGVER" main status >/dev/null 2>&1; then
  echo "[start] Starting PostgreSQL $PGVER cluster..."
  sudo pg_ctlcluster "$PGVER" main start
else
  echo "[start] PostgreSQL cluster already running."
fi

# Wait for the server to accept connections.
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q; then break; fi
  sleep 1
done

# --- Ensure role password and database exist (idempotent) ---
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER USER postgres PASSWORD 'postgres';"
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='semester_planner'" | grep -q 1; then
  echo "[start] Creating database semester_planner..."
  sudo -u postgres createdb semester_planner
else
  echo "[start] Database semester_planner already exists."
fi

# --- Sync Prisma schema to the database (idempotent) ---
echo "[start] Syncing Prisma schema..."
npx prisma db push

echo "[start] Ready."
