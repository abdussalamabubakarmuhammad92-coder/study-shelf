# ADR-009: In-browser PDF reading via the native viewer (pdf.js flagged)

**Status:** Accepted (flagged for revisit) · **Date:** 2026-09

## Context
The owner added a requirement mid-build: students must **read** PDFs on the
site, not only download them.

## Decision
Embed the PDF with an `<iframe src="{file_url}#view=FitH">` on the resource
detail page, toggled by a "Read in browser" button. Chrome, Edge and Firefox
all render PDFs in iframes natively (PDFium/PDF.js built into the browser),
so this costs zero JavaScript and zero dependencies.

## Alternatives considered
- **pdf.js (react-pdf)** — pixel-identical rendering everywhere, page
  thumbnails, deep integration; costs ~300 KB+ of bundle, a dependency to
  maintain, and CDN-worker configuration. The fallback if native proves
  insufficient.
- **Server-side page-image rendering** — needs the workers we deliberately
  don't run (ADR-007); rejected.

## War story (real bug found in user testing)
The first user test in desktop Chrome showed the PDF iframe refused with the
"blocked page" icon. Root cause: Django's `XFrameOptionsMiddleware` stamps
`X-Frame-Options: DENY` on **every** response — including `/media/` PDF files
— so Chrome refused to frame the site's own file. Fixed by setting
`X_FRAME_OPTIONS = 'SAMEORIGIN'` in settings: same-origin reader embeds are
allowed, cross-origin framing stays blocked. Lesson recorded: the ZCode test
webview (Electron, no PDF plugin) renders a *blank* iframe either way, which
masked the bug during automated verification — header checks, not just byte
checks, are needed for embedded-content features.

## Consequences
- Reading does **not** increment the download counter (only real downloads
  do) — intentional: counts reflect downloads, reads are free.
- On exotic browsers without native PDF rendering the iframe is blank; the
  Download button is the always-works fallback. pdf.js is the upgrade path.
