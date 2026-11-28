import { checkLedger, claimsOf } from "@signal-path/engine";
import type { Claim, Guide, Source, Step } from "@signal-path/engine";
import { guides } from "../guides/index.ts";
import { readLedger } from "../ledger/load.ts";
import { curriculumErrors, guideErrors } from "../data/curriculum.ts";
import { builtCaseErrors, caseErrors } from "../data/cases.ts";
import { built } from "../cases/index.ts";
export { guideErrors };

export interface Ledger {
  sources: Source[];
  claims: Claim[];
  today: string;
  source(id: string): Source;
  claim(id: string): Claim;
}

let cached: Ledger | undefined;

/** Loads the ledger and stops the build on any violation. Every page calls this. */
export async function loadLedger(): Promise<Ledger> {
  if (cached) return cached;
  const { sources, claims, errors: shape } = readLedger();
  const today = process.env.SP_TODAY ?? new Date().toISOString().slice(0, 10);
  const errors = [...shape, ...curriculumErrors(), ...guideErrors(guides), ...caseErrors(), ...builtCaseErrors(built), ...checkLedger({ sources, claims, guides: [...guides, ...built], today })];
  if (errors.length > 0) {
    throw new Error(`Build checks failed (${errors.length}):\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  }
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const claimById = new Map(claims.map((c) => [c.id, c]));
  cached = {
    sources, claims, today,
    source: (id) => sourceById.get(id)!,
    claim: (id) => claimById.get(id)!,
  };
  return cached;
}

export const stepClaimIds = (s: Step) => [...new Set([...s.claims, ...s.body.flatMap((b) => ("bars" in b ? b.bars.rows.map((r) => r.claim) : []))])];
export const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export interface Reference { title: string; url: string; vendor: boolean; secondary: boolean }
/** The short reference list of a guide: every source its claims rest on, once, in order of first use. */
export function references(ledger: Ledger, g: Guide): { list: Reference[]; checked: string } {
  const seen = new Map<string, Reference>();
  const cs = claimsOf(g).map((id) => ledger.claim(id));
  for (const c of cs) for (const id of c.sources) {
    const s = ledger.source(id);
    if (!seen.has(id)) seen.set(id, { title: s.title, url: s.url, vendor: s.vendor, secondary: s.kind === "secondary" });
  }
  return { list: [...seen.values()], checked: cs.map((c) => c.verified).sort()[0] };
}

/** What a step must say about its evidence: a dated fact or a statement that rests on the vendor alone. */
export function stepMark(ledger: Ledger, s: Step): string | undefined {
  const cs = stepClaimIds(s).map((id) => ledger.claim(id));
  const dated = cs.filter((c) => c.class === "C");
  const vendor = cs.some((c) => c.flags.some((f) => f.startsWith("vendor")) || c.sources.every((id) => ledger.source(id).vendor));
  const parts: string[] = [];
  if (dated.length) parts.push(`Dated fact, checked ${fmtDate(dated.map((c) => c.verified).sort()[0])}`);
  if (vendor) parts.push("Vendor-stated");
  return parts.length ? `${parts.join(". ")}.` : undefined;
}
