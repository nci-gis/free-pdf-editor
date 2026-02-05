# Claude Code Context (addon to AGENT.md)

Purpose: give Claude-specific guardrails and high-signal pointers without repeating AGENT.md. If anything here conflicts, defer to AGENT.md.

## Core Reminders

- Mission is privacy-first, offline, static-hostable; never add backend/API calls or telemetry.
- Keep everything client-side and vendored; avoid new network dependencies.
- Use Svelte 5 runes style and Tailwind utilities; keep UI changes consistent with existing patterns.

## What to Read First

- AGENT.md (authoritative). Use this file only as a quick Claude checklist.
- For text work: `src/libs/textReplace/textExtractor.js` and `widthMeasurement.js`.
- For save/export: `src/utils/PDF.js` and `src/utils/prepareAssets.js`.

## Development Defaults

- Install/run with pnpm: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm start`.
- Source of truth for assets is `src/`; rollup copies to `public/`. Don’t edit `public/` by hand.
- Branching: follow AGENT.md (main + dev); use conventional commits.

## Quality & Risk Hotspots

- Text extraction accuracy and padding constants; changing them affects masking and clipping.
- Asset paths for fonts/vendor libs; mismatches break offline support.
- Avoid introducing features that need server state, cookies, or analytics.

## Minimal Test Pass (when you touch code)

- Run `pnpm dev`, open `http://localhost:8080`, test with `public/test.pdf`.
- Verify: load, edit text, masks cover originals, export works.

## When in Doubt

- Prefer existing helpers (`pannable.js`, `tapout.js`, `helper.js`) over new utilities.
- If a decision impacts privacy/offline guarantees, stop and align with AGENT.md.
