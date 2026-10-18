#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
n=0
while IFS= read -r -d '' f; do
  out="${f%.b64}"
  mkdir -p "$(dirname "$out")"
  base64 -d < "$f" > "$out"
  echo "decoded $out"
  n=$((n+1))
done < <(find . -name '*.png.b64' -print0)
echo "Decoded $n PNG files."
