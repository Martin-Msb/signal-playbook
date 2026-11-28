// Reads the evidence ledger from disk: the shared files plus one fragment per guide in ledger/guides/ and per use case in ledger/cases/.
// Plain Node, so the site build and the tests load it the same way.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type { Claim, Source } from "@signal-path/engine";

// Beside this file when run from source. From the site folder when the build has bundled this module elsewhere.
const here = [fileURLToPath(new URL("./", import.meta.url)), join(process.cwd(), "src/ledger/"), join(process.cwd(), "apps/site/src/ledger/")]
  .find((d) => existsSync(join(d, "sources.yaml")))!;
const read = (path: string): unknown => parse(readFileSync(path, "utf8"));

/** Sources and claims from sources.yaml, claims.yaml and every fragment, with defaults applied. `only` limits the fragments to the named guides. */
export function readLedger(only?: string[]): { sources: Source[]; claims: Claim[]; errors: string[] } {
  const sources = (read(join(here, "sources.yaml")) as Source[]) ?? [];
  const claims = (read(join(here, "claims.yaml")) as Claim[]) ?? [];
  const errors: string[] = [];
  for (const folder of ["guides", "cases"]) {
    const dir = join(here, `${folder}/`);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".yaml") && (!only || only.includes(n.slice(0, -5)))).sort()) {
      const frag = read(join(dir, f)) as { sources?: Source[]; claims?: Claim[] } | null;
      if (!frag || Array.isArray(frag)) { errors.push(`ledger/${folder}/${f}: expected "sources:" and "claims:" lists`); continue; }
      sources.push(...(frag.sources ?? []));
      claims.push(...(frag.claims ?? []));
    }
  }
  for (const s of sources) {
    if (!s.id || !s.title || !/^https?:\/\//.test(s.url ?? "")) errors.push(`source ${s.id ?? "?"}: needs an id, a title and an http url`);
    if (s.kind !== "primary" && s.kind !== "secondary") errors.push(`source ${s.id}: kind must be primary or secondary`);
    if (typeof s.vendor !== "boolean") errors.push(`source ${s.id}: vendor must be true or false`);
  }
  for (const c of claims) {
    if (!c.id || !c.text || c.text.length < 10) errors.push(`claim ${c.id ?? "?"}: needs an id and a statement`);
    if (!["A", "B", "C"].includes(c.class)) errors.push(`claim ${c.id}: class must be A, B or C`);
    if (!Array.isArray(c.sources) || c.sources.length === 0) errors.push(`claim ${c.id}: needs at least one source`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.verified ?? "")) errors.push(`claim ${c.id}: verified must be YYYY-MM-DD`);
  }
  return { sources, claims: claims.map((c) => ({ ...c, flags: c.flags ?? [], review: c.review ?? "pending" })), errors };
}
