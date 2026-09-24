#!/usr/bin/env bash
# Renders resume/resume.html to public/Dan_Brandt_Resume.pdf with headless Chrome.
# Needs network for the Google Fonts link. Check the result is one page:
#   pdfinfo public/Dan_Brandt_Resume.pdf | grep Pages
set -euo pipefail
cd "$(dirname "$0")/.."
chrome=$(command -v google-chrome-stable || command -v google-chrome || command -v chromium)
profile=$(mktemp -d)
trap 'rm -rf "$profile"' EXIT
"$chrome" --headless=new --disable-gpu --no-pdf-header-footer --user-data-dir="$profile" \
  --virtual-time-budget=8000 --print-to-pdf=public/Dan_Brandt_Resume.pdf \
  "file://$PWD/resume/resume.html" 2>/dev/null
pdfinfo public/Dan_Brandt_Resume.pdf | grep -E 'Pages|Title'
