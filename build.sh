#!/usr/bin/env bash
# exit on error
set -o errexit

echo "=== BUILDING BACKEND ==="
npm install --legacy-peer-deps --prefix server

echo "=== BUILDING FRONTEND ==="
npm install --legacy-peer-deps --production=false --prefix client
npm run build --prefix client

echo "=== BUILD COMPLETE ==="
