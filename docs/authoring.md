# Writing a guide

A guide teaches one concept of the curriculum through one picture stepped through six stops. The picture does the teaching. Words are labels and captions.

## What you write

Two files, and nothing else:

| File | Contents |
| --- | --- |
| `apps/site/src/guides/<track>/<key>.ts` | The guide: scene, six steps, governance statement, pitfalls and questions. |
| `apps/site/src/ledger/guides/<key>.yaml` | The evidence for this guide: `sources:` and `claims:`. |

`<key>` is the concept's key in `apps/site/src/data/curriculum.ts`: its title in lower case with hyphens. Do not edit the engine, the theme, the curriculum, another guide or the shared ledger files. If the scene grammar cannot draw what the concept needs, say so in your report instead of working around it in shared code.

## The concept row

Each concept in the curriculum gives you five things. The guide must honour all of them.

- **Title.** The guide's `title`, unchanged. `id` and `slug` are the key, `module` is the stage name.
- **The reader understands.** What the six stops must leave in the reader's head. This is the test of the guide.
- **Builds on.** What the reader already knows. Start from there, and do not re-teach it.
- **Current practice.** The tools and practices that belong to the concept. They appear inside the story, at the stop where they make sense, with their real names. They are never the title or the starting point.
- **Governance and security.** Becomes the guide's `governance` statement, backed by at least one claim. Where the concept's story touches a control, show it in the picture too.

## Order of work

1. **Evidence first.** Open primary sources and collect what they say before designing anything.
2. **Picture second.** Decide what single object changes across the six stops, and what the reader watches move.
3. **Words last.** Write captions to fit the picture, inside the word budget.

## Evidence

Every factual sentence in a title, caption, detail paragraph, pair, or governance statement rests on a claim. A claim rests on sources you opened.

- Use primary sources: specifications, official documentation, standards bodies, regulators, the original paper, the project's own repository. A search snippet is not a source. Open the page and read the sentence.
- Write the claim as the source states it. Do not strengthen it, generalise it or add a number it does not give.
- If a page will not load or does not say what you need, find another primary source or drop the statement. Never write a claim from memory.
- Put nothing about this project or its owner in any web request. Use generic queries.

```yaml
sources:
  - {id: <key>-s1, title: "Publisher: page title", url: "https://...", kind: primary, vendor: false}
claims:
  - {id: <key>-<name>, class: A, sources: [<key>-s1], verified: "YYYY-MM-DD", text: "One statement the source supports."}
```

- `id`: every source and claim id starts with the concept key, so ids never collide.
- `kind`: `primary` or `secondary`. A claim needs at least one primary source.
- `vendor`: `true` when the publisher sells the thing the claim is about. The app marks such steps as vendor-stated.
- `class`: `A` a durable mechanism, `B` current practice, `C` a dated fact such as a version, a limit, a price or a date. Class C claims expire after 90 days and are shown with their check date.
- `verified`: today's date.
- Add `flags: [vendor-stated]` to a claim that only the vendor asserts, such as a benchmark result.

Illustrative scenario values (order numbers, amounts, names) are not claims. Say so in the scene's `note`, for example `"Orders are illustrative"`.

## The six steps

```ts
step({
  id: "short-id", label: "Two words", kind: "mechanism",
  title: "A plain statement of what this stop shows",
  caption: "What the reader sees happen, in one to three sentences.",
  show: ["group-a", "group-b"],          // scene groups drawn at this stop, besides `always` elements
  counters: ["value", "value", "value"], // one per guide counter
  rides: [ride("rail", "from-stop", "to-stop", "label", { via: ["mid"], then: "new label" })],
  body: ["Detail paragraph, one click away.", { callout: { label: "Key idea", text: "..." } }],
  claims: ["<key>-<name>"],
})
```

- Exactly six steps. The first is `kind: "problem"`: the situation without the concept. The last is `kind: "decision"` with an empty caption and a `pair` in its body. Between them use `idea`, `mechanism` and `watch-out`.
- **Word budget:** title, caption and pair together stay within 40 words per step. The check prints the count.
- `counters`: three or four facts about the system that change across the stops. The app flags the value that changed.
- `body`: paragraphs and callouts are the detail, one action away. Put there what the caption has no room for, including the named practices.
- `whatIf` on the guide offers a counterfactual: `{ label: "What if ...?", step: <earlier step index>, from: <index it is offered from> }`.
- `governance: { text, claims }`: one or two sentences on where governance or security meets this concept.
- `closing`: three pitfalls and three questions.

## The shared world

Every scenario happens at Vinterhus, a home goods retailer. Use it so the guides read as one body of work.

- Orders have numbers from 4468 upward, a channel (`web`, `app`, `store`), an amount, a customer email, and sometimes a return.
- Teams: Finance, Support, Operations, the data team. Support runs a refund assistant.
- Products have codes such as `SOFA-2210`.

## The picture

Scenes are drawn on a 960 by 540 canvas, on a floor seen from above at an angle. Start with `const G = isoGrid(ox, oy, 30)` and set `scene.iso` to `G.iso`. `G.p(gx, gy)` turns a floor point into a canvas point: one unit along `gx` runs 30 right and 15 down, one unit along `gy` runs 30 left and 15 down.

Choose the vocabulary the concept needs. Read the nearest reference guide before you start.

| The concept is about | Draw it with | Reference guide |
| --- | --- | --- |
| Systems and what flows between them | `prism`, `drum`, `slab`, `pawn`, rails (`line`) with `stop`s, cards stood on posts with `raise` | `data/ingestion`, `ai/prompt-injection`, `ml/tabular-foundation-models` |
| How data is laid out or how much of it is touched | `blocks` on the floor, `cells`, `table` | `data/columnar-storage` |
| A quantity that changes, a curve, a distribution, a boundary | `plot` with `series`, `band`, `rule`, `shade` | `ml/loss-and-optimisation` |
| A hierarchy, a tree, a graph | `treeOf` or `node` with thin lines | `data/indexes-and-storage-engines` |
| A budget that fills | `tank` | `ai/context-engineering` |
| A neural network | `layers` | none yet |

Scene helpers also support coloured table rows (`hue`) and columns (`columnHues`); labelled floor blocks with per-item `label`, `hue` and `state: "alert"`; alert states on prisms and drums; and rectangular plot shading with `shade(id, plotId, [xFrom, yFrom, xTo, yTo])`. `layerUnitPositions` returns unit coordinates, and `layerConnection` makes a named route between units that can carry a ride. `layers.connections` can restrict the network drawing to selected unit pairs.

All helpers are exported from `@signal-path/engine`. Their signatures and comments are in `packages/engine/src/dsl.ts`, and every element's fields are in `packages/engine/src/types.ts`.

Rules that keep a scene readable:

- **One story.** Pick the object the reader follows: a record on a rail, a weight on a curve, a query through a tree. Each stop changes one thing about it.
- **Reveal, do not redraw.** Put each element in a `group`, and let each step `show` the groups it needs. Elements marked `always` stay. To change an object, define its variants in different groups at the same place.
- **A record rides.** `ride(line, from, to, label)` moves a record along a rail, a thin line or a line series of a plot. `via` stops are pauses and `then` changes its text when it reaches the final stop. Multiple rides in a step run in source order, one after another. On the floor the record is a puck with its text above. On a plot it is a dot. On flat lines pass `shape: "pill"`.
- **Use the canvas.** A scene that fills a third of the canvas is too small. Scale the grid positions up until the picture spans most of the width.
- **Rails run along one grid axis** and turn at right angles on the grid. Put a block's name plate (`at`) on the side no rail leaves from.
- **Boards need room.** Keep 200 pixels between the centres of two cards on posts. Text in records and plates stays short: 14 characters is a good ceiling.
- **Records rest on open rail,** clear of blocks, plates and cards. Stop a ride short of a card instead of on it.
- **An element drawn on a card** on purpose, such as a pill on a plot, carries `on: "<card id>"` so the overlap check allows it.
- **Colour means something.** The track colour is the story. Red (`tone: "alert"`) is an attack, a failure or an error. Use `hue` to tell kinds of thing apart, the same hue for the same kind throughout.

## Copy

- No em dashes. No ID codes for concepts or guides: name them by title.
- British spelling. Expert voice. State facts. Do not describe or justify the guide.
- Titles are plain statements. No comparisons of the form "from X to Y", no teasers, no questions.
- Monospace is for code and data values only.

## Check, look, fix

```sh
node scripts/check-guide.mjs <track>/<key>
```

This checks one guide on its own: curriculum match, ledger rules, word budget, text overflow, overlaps, and that every claim in the fragment is used. It then draws all six stops in light and dark to `.shots/<key>-light.png` and `.shots/<key>-dark.png`.

Open both images and look at every stop. The checks cannot see a plate lying over a rail, a picture that is too small, or a stop where nothing visibly changed. Fix and run again until the checks pass and each stop reads at a glance.

Do not run `npm test`, `npm run build` or `npm run gen` while other guides are being written in the same folder. Those commands read every guide.

## Done means

- The six stops deliver the concept's "reader understands" sentence without the detail panels.
- Each stop changes something the reader can see, and a record or marker moves in at least three stops.
- Every factual statement has a claim, and every claim has a primary source you opened.
- The named practices from the concept row appear in the guide.
- The governance statement is specific to this concept and sourced.
- `check-guide` reports no problems, and both sheets are clean in every stop.
