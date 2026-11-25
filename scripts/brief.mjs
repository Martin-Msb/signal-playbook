// Prints the curriculum row of one concept, or of every concept that has no guide yet, as a build brief.
//   node scripts/brief.mjs <key>      one concept
//   node scripts/brief.mjs --todo     keys of concepts without a guide, in curriculum order
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { concept, concepts } from "../apps/site/src/data/curriculum.ts";

const dir = fileURLToPath(new URL("../apps/site/src/guides/", import.meta.url));
const arg = process.argv[2];
if (arg === "--todo") {
  for (const c of concepts) if (!existsSync(`${dir}${c.track}/${c.key}.ts`)) console.log(`${c.track}/${c.key}`);
} else {
  const c = concept(arg ?? "");
  if (!c) { console.error("unknown concept key"); process.exit(2); }
  const names = (keys) => keys.map((k) => concept(k).title).join("; ") || "nothing: this is where the track starts";
  console.log(`Concept: ${c.title}
Track: ${c.trackName} (${c.track}). Stage: ${c.stage}. Key: ${c.key}
The reader understands: ${c.understands}
Builds on: ${names(c.buildsOn)}${c.seeAlso.length ? `\nSee also, in other tracks: ${names(c.seeAlso)}` : ""}
Current practice: ${c.practice}
Governance and security: ${c.governance}
Files: apps/site/src/guides/${c.track}/${c.key}.ts and apps/site/src/ledger/guides/${c.key}.yaml
Check: node scripts/check-guide.mjs ${c.track}/${c.key}`);
}
