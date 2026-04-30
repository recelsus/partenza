#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/build/extension"
ZIP_PATH="$ROOT_DIR/build/partenza-bookmark-extension.zip"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
rm -f "$ZIP_PATH"

cp "$ROOT_DIR/manifest.json" "$BUILD_DIR/"
cp "$ROOT_DIR/background.js" "$BUILD_DIR/"
cp "$ROOT_DIR/popup.html" "$BUILD_DIR/"
cp "$ROOT_DIR/options.html" "$BUILD_DIR/"
cp "$ROOT_DIR/sidepanel.html" "$BUILD_DIR/"
cp -R "$ROOT_DIR/background" "$BUILD_DIR/"
cp -R "$ROOT_DIR/lib" "$BUILD_DIR/"
cp -R "$ROOT_DIR/options" "$BUILD_DIR/"
cp -R "$ROOT_DIR/popup" "$BUILD_DIR/"
cp -R "$ROOT_DIR/ui" "$BUILD_DIR/"

(
    cd "$BUILD_DIR"
    zip -qr "$ZIP_PATH" .
)

printf 'Created %s\n' "$ZIP_PATH"
