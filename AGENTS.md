# Repository Guidelines

## Project Structure

This repository is an npm workspace. `apps/site` contains the Astro static site, pages, styles, curriculum, guides, and source ledger. `packages/engine` contains framework-free TypeScript scene types, rendering, runtime helpers, and tests. Build and authoring utilities live in `scripts/`; guide-writing instructions are in `docs/authoring.md`. Read that document before adding or substantially changing a guide.

## Development Commands

Run commands from the repository root:

- `npm install` installs workspace dependencies (Node.js `>=22.23.4` is required).
- `npm run dev` generates the guide index and starts the local Astro site.
- `npm test` regenerates the index and runs engine, curriculum, ledger, copy, and scene checks.
- `npm run build` generates the index and builds the static site into `apps/site/dist`.
- `npm run preview -w @signal-path/site` serves the built site locally from `dist` for review.
- `node scripts/check-guide.mjs <track>/<key>` checks a single guide and writes contact sheets under `.shots/`.
- `npm run gen` regenerates `apps/site/src/guides/index.ts` from guide files.

Generated guide index changes should be included when adding or removing guides. A live preview may already be available at `http://localhost:4321`; it is served from `apps/site/dist` by a small script in the current session’s scratch folder and will stop when that session ends. If the owner wants to keep watching, start your own preview server with the command above.

## Style and Content

Follow the surrounding TypeScript and Astro style; use two spaces for indentation, semicolons, and single quotes where consistent with nearby files. Keep guide filenames lowercase kebab-case and aligned with the curriculum key, for example `data-modelling.ts`. Keep each guide's ledger fragment in `apps/site/src/ledger/guides/<key>.yaml`. Use typed helpers and scene definitions from `@signal-path/engine` rather than duplicating renderer logic.

Treat the curriculum as the source of truth for guide title, track, stage, and key. Every claim must be in the ledger and cite a primary source. Follow the build rules in `README.md`, including step citations, governance coverage, copy limits, and avoiding em dashes in guide and ledger text.

## Tests and Review

Engine tests use Node's built-in test runner and live in `packages/engine/test/*.test.ts`; name files `*.test.ts`. Run `npm test` after changes affecting content, ledger, engine, or shared checks. Inspect both contact sheets after a single-guide check for visual layout issues.

## Commits and Pull Requests

The available Git history contains only an initial commit, so no established commit format can be inferred. Use a short imperative commit subject (for example, `Add guide for query execution`). Pull requests should summarize the change, link relevant issues when available, list validation commands run, and include screenshots or contact sheets for visual changes.
