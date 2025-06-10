#!/bin/bash
set -e

# PostgreSQL 시작 후 capstone.dump 복원
echo "Restoring database..."
pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" /docker-entrypoint-initdb.d/capstone.dump
echo "Database restored."
