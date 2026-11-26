# Signal Path

A visual curriculum of Data, AI and ML concepts. Version 3.0.0.

Each guide teaches one concept through one picture stepped through six stops. The picture is a floor seen from above at an angle: systems stand on it as solid objects, rails connect them, data lies on it as blocks, charts and tables stand on posts, and a record moves through it and changes at each stop. Every statement traces to a dated source.

## The curriculum

`apps/site/src/data/curriculum.ts` is the single source of structure: 121 concepts in three tracks, in teaching order. Each concept states what the reader understands afterwards, what it builds on, the current practice that belongs to it, and where governance and security appear. A guide is a concept that has been built. The rest show on the Map as planned stops.

## Layout

| Path | Contents |
| --- | --- |
| `packages/engine` | Framework-free TypeScript. Scene types, SVG string renderer, authoring helpers, client stepper (`<sp-guide>`), ledger and copy checks. No content. |
| `apps/site` | Astro static site. Guides, ledger, pages, theme. |
| `apps/site/src/data/curriculum.ts` | The approved curriculum. |
| `apps/site/src/guides/<track>/<key>.ts` | One typed data file per guide. The key is the concept's key. |
| `apps/site/src/ledger` | `sources.yaml` and `claims.yaml`, plus one fragment per guide in `guides/`. |
| `apps/site/src/lib/network.ts` | The Map: the curriculum drawn as three lines of stops. |
| `docs/authoring.md` | How to write a guide. Read it before adding one. |

## Commands

```sh
npm install
npm run dev        # local site
npm test           # engine, curriculum, ledger rules, copy rules, scene layout and floor collisions for every guide
npm run build      # static site in apps/site/dist, fails on any curriculum, ledger or copy violation
node scripts/check-guide.mjs ml/loss-and-optimisation   # one guide on its own: every check, plus contact sheets in .shots/
node scripts/brief.mjs --todo                           # concepts that have no guide yet
npm run preview:single -- ml/tabular-foundation-models  # one guide as a single HTML file in preview/
npm run preview:app   # the whole site as one HTML file with hash navigation, preview/app.html
```

`npm run gen` rewrites `apps/site/src/guides/index.ts` from the guide files on disk. It runs before dev, test and build.

`SP_TODAY=2027-06-01 npm run build` runs the build as of another date.

## Pages

| Page | Route | Contents |
| --- | --- | --- |
| Learn | `/<track>/<key>/` | One guide: what it builds on and unlocks, route bar, picture, caption, state, and disclosure for detail, pitfalls, questions, governance, lead notes and references. |
| Map | `/map/` | The Data, AI and ML lines with one stop per concept: open and planned, read stops, governance and security stops, and what each stop builds on and unlocks. |

## Build rules

The build stops when any rule is broken.

1. Every guide sits on a concept of the curriculum: same key, track, title and stage.
2. Every claim a guide references exists in the ledger and cites at least one primary source.
3. A class C claim (dated fact) is verified within the last 90 days.
4. A published guide uses only approved claims.
5. Every step cites at least one claim, the first step is a problem and the last is a decision.
6. Every guide carries a governance statement backed by at least one claim.
7. Dated values such as version limits are read from the ledger, never typed into a guide.
8. A step shows at most 40 words before anything is opened: title, caption and the pair on a decision step.
9. No em dash appears in a guide, a claim or a source.
10. A ride names a line the step draws and stops that exist. A what-if points back to an earlier step.

Claim classes: A durable mechanism, B current practice, C dated fact. The reader sees a short reference list per guide. Steps that rest on a dated fact or on a vendor's own statement say so.

## Adding a guide

Read `docs/authoring.md`. In short: evidence first, picture second, words last. Write `src/guides/<track>/<key>.ts` and `src/ledger/guides/<key>.yaml`, then run `node scripts/check-guide.mjs <track>/<key>` and look at both contact sheets until every stop is clean.

## Scene grammar

Scenes are authored on a 960 by 540 canvas. A step lists the element ids or group names it draws. Elements marked `always` are drawn in every step.

### The floor

`isoGrid(ox, oy, a)` returns the projection for a scene and a function `p(gx, gy, z)` that turns a grid point into a canvas point. One grid unit is `a` pixels across and half that down. Set `scene.iso` to the grid's `iso` and place everything through `p`.

| Element | Draws |
| --- | --- |
| `prism` | A box on the floor with a glyph on top and a name plate. `state: "closed"` draws a dashed outline. `z` lifts it, so thin prisms stack. |
| `drum` | A cylinder: a store. |
| `slab` | A low platform: a system boundary such as a warehouse. |
| `tank` | A glass container that fills with labelled layers up to a marked limit. |
| `pawn` | A person, with an optional speech bubble. |
| `pill` | A free name plate or annotation, placed in canvas coordinates. |
| `line` | A rail through grid points with rounded corners. `state` is open, closed or planned. Thin ink lines serve as stems. |
| `stop` | A station on a rail, with an optional plate on one of eight sides. |
| `raise(card, floorPoint, lift)` | Stands a `table`, `code`, `list`, `doc`, `tree`, `plot`, `cells` or `layers` card on a post above a floor point. |

Name plates sit on one side of an object through `at`: n, s, e, w, sw or se. Choose the side no rail leaves from. An element drawn on a card on purpose carries `on: "<card id>"`.

### Data, charts and graphs

| Element | Draws |
| --- | --- |
| `blocks` | A row or grid of small blocks on the floor, one per value or unit: file chunks, shards, a histogram. Height, hue, short labels and alert state carry meaning. |
| `cells` | A strip or grid of labelled cells: tokens, log entries, rows. |
| `plot` with `series`, `band`, `rule`, `shade` | A chart card with axes in data units. Each series is its own element, so a step can reveal it. A record can ride a line series. |
| `node`, `treeOf` | Nodes of a tree or graph joined by thin lines. `treeOf` lays out a tree. |
| `layers` | A neural network as columns of units with weighted connections. `layerUnitPositions` exposes unit positions; `layerConnection` draws a named route that a record can ride. |

### Cards and flat elements

| Element | Draws |
| --- | --- |
| `table`, `code`, `list`, `doc`, `tree` | A table with rows, code on a ticket, a ranked list with an optional cut, a document, a one-split decision tree. |
| `matrix`, `label`, `arrow` | An opacity grid, an annotation, a thin annotation arrow. |
| `zone`, `db`, `box`, `model`, `person`, `window`, `marks`, `sheets` | The flat set, for a scene without `iso`. |

### Rides and what-if

A step's `rides` move a record along a rail from one stop or fraction to another. `via` stops are pauses and `then` is the record's text after it arrives. Multiple rides in a step take turns in source order. On the floor the record is a puck with its value on a label above it. The scene renders the record at rest, so the page is complete without script and under reduced motion.

`whatIf` on a guide names an earlier step to show as a counterfactual and the step from which the switch is offered.

### Layout checks

`sceneWarnings` reports text that overflows its card and cards outside the canvas. `sceneCollisions` walks every step of a floor scene and reports any plate, board, object or resting record that leaves the canvas or overlaps another by more than 6 pixels. Both run in `npm test` against every guide. Rails are not boxed, so a plate laid over a rail is caught by eye, not by the test.

## Step copy

`caption` is the visible text. `body` paragraphs and callouts are the step's detail, one action away. A `pair` or `bars` block in the body is shown with the step.

## Interface

Overpass for all text and Overpass Mono for code and data values, both self-hosted through fontsource. One line colour per track, signal yellow for a changed value, red for attacks and failures. Light and dark themes follow the system setting and the header switch.

Keys: left and right arrows move between stops, R replays a stop, W switches the what-if, Cmd or Ctrl K opens search.
