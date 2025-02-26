#!/bin/sh
set -e

if [ "$WORKER" = "true" ]; then
  echo "Starting worker process..."
  exec node dist/worker.js
else
  echo "Starting API server..."
  exec node dist/index.js
fi
