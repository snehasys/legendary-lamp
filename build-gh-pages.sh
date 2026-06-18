#!/bin/bash
# Build script for GitHub Pages deployment
# This builds a static-only version with the Forge API key baked in

set -e

# Set environment variables for the static build
export VITE_FORGE_API_URL="https://forge.manus.ai"
export VITE_FORGE_API_KEY="${VITE_FORGE_API_KEY:-$VITE_FRONTEND_FORGE_API_KEY}"

if [ -z "$VITE_FORGE_API_KEY" ]; then
  echo "ERROR: VITE_FORGE_API_KEY or VITE_FRONTEND_FORGE_API_KEY must be set"
  exit 1
fi

echo "Building for GitHub Pages with base: /legendary-lamp/"
echo "Forge API URL: $VITE_FORGE_API_URL"

# Build with the GitHub Pages base path
npx vite build \
  --base /legendary-lamp/ \
  --outDir ../dist-gh-pages \
  --emptyOutDir

echo ""
echo "Build complete! Output in dist-gh-pages/"
echo "Files:"
ls -la dist-gh-pages/
