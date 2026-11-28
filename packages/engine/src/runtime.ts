/**
 * Client stepper. The page is complete without it: the scene shows its step at rest and every step panel is in the document.
 * The element reads a JSON payload of { always, steps: [{ label, show, counters }], whatIf } and toggles classes.
 */
interface Payload {
  always: string[];
  steps: { label: string; show: string[]; counters: string[] }[];
  whatIf?: { step: number; from: number };
}
interface Tok { el: SVGGElement; path: SVGPathElement | null; from: number; to: number; via: number[]; label: string; then?: string; rest: [number, number] }
interface Segment { a: number; b: number; ms: number; dwell: number }
interface Plan { t: Tok; segs: Segment[]; offset: number; duration: number }

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
import { rideArrivalLabel, rideQueue } from "./motion.ts";

class SpGuide extends HTMLElement {
  private i = -1;
  private data!: Payload;
  private svg: SVGSVGElement | null = null;
  private raf = 0;
  private wi = false;

  connectedCallback() {
    const raw = this.querySelector<HTMLScriptElement>('script[type="application/json"]');
    if (!raw?.textContent) return;
    this.data = JSON.parse(raw.textContent) as Payload;
    this.svg = this.querySelector<SVGSVGElement>(".scene svg");
    this.classList.add("live");
    const on = (sel: string, ev: string, fn: (e: Event, el: HTMLElement) => void) =>
      this.querySelectorAll<HTMLElement>(sel).forEach((el) => el.addEventListener(ev, (e) => fn(e, el)));
    on("[data-back]", "click", () => this.step(-1));
    on("[data-next]", "click", () => this.step(1));
    on("[data-replay]", "click", () => this.replay());
    on("[data-goto]", "click", (_, el) => this.go(Number(el.dataset.goto)));
    on("[data-whatif]", "click", () => this.toggleWhatIf());
    on("[data-scrub]", "input", (_, el) => this.scrub(Number((el as HTMLInputElement).value) / 1000));
    on("[data-open-panel]", "click", (_, el) => this.panel(el.dataset.openPanel!));
    this.tips();
    document.addEventListener("keydown", (e) => {
      const t = (e.target as HTMLElement | null)?.tagName;
      if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || this.offsetParent === null || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") this.step(1);
      else if (e.key === "ArrowLeft") this.step(-1);
      else if (e.key === "r" || e.key === "R") this.replay();
      else if (e.key === "w" || e.key === "W") this.toggleWhatIf();
      else if (e.key === "Escape" && this.dataset.open) this.panel(this.dataset.open);
    });
    window.addEventListener("hashchange", () => this.fromHash());
    if (!this.fromHash()) this.go(0, false);
  }

  private fromHash(): boolean {
    const m = /^#step-(\d+)$/.exec(location.hash);
    if (!m || this.dataset.hash === "off") return false;
    this.go(Number(m[1]) - 1, false);
    return true;
  }

  /** Opens one disclosure panel, or closes it when it is already open. */
  private panel(name: string) {
    const open = this.dataset.open === name ? "" : name;
    if (open) this.dataset.open = open; else delete this.dataset.open;
    this.querySelectorAll<HTMLElement>("[data-open-panel]").forEach((b) => b.setAttribute("aria-expanded", String(b.dataset.openPanel === open)));
  }

  /** Shows the scene of step s: elements, counters and records at rest. */
  private paint(s: number, prev: number | null, animate: boolean) {
    const step = this.data.steps[s];
    const before = prev !== null ? this.data.steps[prev].show : null;
    const shown = (show: string[], id: string, group?: string) => this.data.always.includes(id) || show.includes(id) || (!!group && show.includes(group));
    let order = 0;
    this.svg?.querySelectorAll<SVGGElement>("[data-el]").forEach((g) => {
      const id = g.dataset.el!, group = g.dataset.group;
      const on = shown(step.show, id, group);
      const entering = on && !g.classList.contains("on");
      g.classList.toggle("fresh", on && !!before && !shown(before, id, group));
      g.classList.toggle("on", on);
      g.classList.remove("enter");
      if (entering && animate && !reduced()) {
        g.style.animationDelay = `${Math.min(order++, 10) * 60}ms`;
        void g.getBoundingClientRect();
        g.classList.add("enter");
      }
    });
    this.querySelectorAll<HTMLElement>("[data-counter]").forEach((c) => {
      const j = Number(c.dataset.counter);
      c.textContent = step.counters[j];
      const was = prev !== null ? this.data.steps[prev].counters[j] : undefined;
      c.closest("[data-row]")?.classList.toggle("ch", was !== undefined && was !== step.counters[j]);
    });
    this.svg?.querySelectorAll<SVGGElement>(".tok").forEach((t) => t.classList.toggle("on", Number(t.dataset.step) === s));
    this.follow(s);
    this.ride(s, animate);
  }

  /** On narrow screens the scene scrolls sideways: bring the record into view. */
  private follow(s: number) {
    const scene = this.querySelector<HTMLElement>(".scene"), svg = this.svg;
    if (!scene || !svg || scene.scrollWidth <= scene.clientWidth + 4) return;
    const tok = this.tokens(s)[0];
    const vb = svg.viewBox.baseVal.width || 960;
    const x = tok ? tok.rest[0] : vb / 2;
    scene.scrollTo({ left: Math.max(0, (x / vb) * svg.clientWidth - scene.clientWidth / 2), behavior: reduced() ? "auto" : "smooth" });
  }

  /** One stop forward or back. Past the last stop it opens the next concept, before the first the previous one. */
  private step(d: 1 | -1) {
    const n = this.data.steps.length, to = this.i + d;
    const url = to >= n ? this.dataset.nextUrl : to < 0 ? this.dataset.prevUrl : undefined;
    if (url) location.href = url;
    else this.go(to);
  }

  private go(i: number, writeHash = true) {
    const steps = this.data.steps;
    if (i < 0 || i >= steps.length || i === this.i) return;
    const prev = this.i >= 0 ? this.i : null;
    this.i = i;
    this.wi = false;
    this.classList.remove("wi");
    this.paint(i, prev, prev !== null);
    if (i === steps.length - 1 && this.dataset.id) {
      try {
        const done = new Set<string>(JSON.parse(localStorage.getItem("sp-done") ?? "[]"));
        done.add(this.dataset.id);
        localStorage.setItem("sp-done", JSON.stringify([...done]));
      } catch { /* storage is optional */ }
      document.dispatchEvent(new Event("sp-done"));
    }
    try { if (this.dataset.id) localStorage.setItem("sp-last", JSON.stringify({ id: this.dataset.id, step: i })); } catch { /* optional */ }
    this.querySelectorAll<HTMLElement>("[data-step]").forEach((p) => p.classList.toggle("current", Number(p.dataset.step) === i));
    this.querySelectorAll<HTMLElement>("[data-goto]").forEach((b) => {
      const j = Number(b.dataset.goto);
      const li = b.closest("[data-stop]") ?? b;
      li.classList.toggle("cur", j === i);
      li.classList.toggle("done", j < i);
      if (j === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    });
    this.querySelectorAll("[data-state]").forEach((s) => (s.textContent = `Stop ${i + 1} of ${steps.length}`));
    const back = this.querySelector<HTMLButtonElement>("[data-back]");
    const next = this.querySelector<HTMLButtonElement>("[data-next]");
    const label = this.querySelector("[data-next-label]");
    const last = i === steps.length - 1, kind = this.querySelector("[data-next-kind]");
    if (back) { back.disabled = i === 0 && !this.dataset.prevUrl; back.setAttribute("aria-label", i === 0 && this.dataset.prevTitle ? `Previous ${this.dataset.unit ?? "concept"}: ${this.dataset.prevTitle}` : "Previous stop"); }
    if (next) next.disabled = last && !this.dataset.nextUrl;
    if (kind) kind.textContent = last && this.dataset.nextTitle ? `Next ${this.dataset.unit ?? "concept"}` : "Next stop";
    if (label) label.textContent = last ? this.dataset.nextTitle ?? "Last stop" : steps[i + 1].label;
    const w = this.data.whatIf;
    this.querySelectorAll<HTMLButtonElement>("button.wif[data-whatif]").forEach((wb) => { wb.disabled = !w || i < w.from; wb.setAttribute("aria-pressed", "false"); });
    if (writeHash && this.dataset.hash !== "off") history.replaceState(null, "", `#step-${i + 1}`);
  }

  private replay() {
    if (this.i < 0) return;
    const s = this.wi && this.data.whatIf ? this.data.whatIf.step : this.i;
    this.svg?.querySelectorAll<SVGGElement>("[data-el].on").forEach((g) => g.classList.remove("on"));
    this.paint(s, null, true);
  }

  private toggleWhatIf() {
    const w = this.data.whatIf;
    if (!w || this.i < w.from) return;
    this.wi = !this.wi;
    this.classList.toggle("wi", this.wi);
    this.querySelectorAll("button.wif[data-whatif]").forEach((wb) => wb.setAttribute("aria-pressed", String(this.wi)));
    this.paint(this.wi ? w.step : this.i, this.wi ? this.i : w.step, true);
  }

  /* ---------- the record ---------- */

  private tokens(s: number): Tok[] {
    if (!this.svg) return [];
    return [...this.svg.querySelectorAll<SVGGElement>(`.tok[data-step="${s}"]`)].map((el) => {
      const d = el.dataset;
      const rest = (d.rest ?? "0,0").split(",").map(Number) as [number, number];
      return {
        el, path: this.svg!.querySelector<SVGPathElement>(`[id="${d.line}"]`),
        from: Number(d.from), to: Number(d.to), via: d.via ? d.via.split(",").filter(Boolean).map(Number) : [],
        label: d.label ?? "", then: d.then, rest,
      };
    });
  }

  private place(t: Tok, f: number, label: string) {
    if (!t.path) return;
    const len = t.path.getTotalLength(), p = t.path.getPointAtLength(Math.max(0, Math.min(1, f)) * len);
    t.el.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    this.setLabel(t, label);
  }

  private rest(t: Tok) {
    t.el.setAttribute("transform", `translate(${t.rest[0]} ${t.rest[1]})`);
    this.setLabel(t, rideArrivalLabel(t.label, t.then, true));
  }

  private plans(toks: Tok[]): Plan[] {
    const raw = toks.map((t) => {
      const stops = [t.from, ...t.via, t.to], len = t.path?.getTotalLength() ?? 0;
      const segs: Segment[] = [];
      for (let k = 0; k < stops.length - 1; k++) {
        const px = Math.abs(stops[k + 1] - stops[k]) * len;
        segs.push({ a: stops[k], b: stops[k + 1], ms: Math.max(380, px * 3.1), dwell: k < stops.length - 2 ? 520 : 0 });
      }
      return { t, segs, duration: 280 + segs.reduce((a, g) => a + g.ms + g.dwell, 0) };
    });
    const queue = rideQueue(raw.map((p) => p.duration));
    return raw.map((p, i) => ({ ...p, offset: queue[i].offset }));
  }

  private placePlan(p: Plan, elapsed: number) {
    const { t, segs } = p;
    if (elapsed < 0) { this.place(t, t.from, t.label); return; }
    if (elapsed < 280) { this.place(t, segs[0].a, t.label); return; }
    let acc = 280;
    for (const g of segs) {
      if (elapsed < acc + g.ms) { this.place(t, g.a + (g.b - g.a) * ease((elapsed - acc) / g.ms), t.label); return; }
      acc += g.ms;
      if (elapsed < acc + g.dwell) { this.place(t, g.b, t.label); return; }
      acc += g.dwell;
    }
    this.rest(t);
  }

  /** Changes the record's text and refits its body. */
  private setLabel(t: Tok, label: string) {
    const tt = t.el.querySelector<SVGTextElement>(".tt"), tb = t.el.querySelector<SVGGraphicsElement>(".tb");
    if (!tt || !tb || tt.textContent === label) return;
    tt.textContent = label;
    let tw = 0;
    try { tw = tt.getComputedTextLength(); } catch { return; }
    if (!tw) return;
    if (tb.tagName === "rect") {
      const pill = t.el.querySelector(".td");
      const w = tw + (pill ? 40 : 24);
      tb.setAttribute("x", String(-w / 2)); tb.setAttribute("width", String(w));
      tt.setAttribute("x", String(-w / 2 + (pill ? 30 : 12)));
      pill?.setAttribute("cx", String(-w / 2 + 17));
    } else if (tb.tagName === "path") {
      const w = tw + 34;
      tb.setAttribute("d", `M${-w / 2} -15H${w / 2 - 9}L${w / 2} -6V15H${-w / 2}Z`);
      tt.setAttribute("x", String(-w / 2 + 12));
    }
  }

  private ride(s: number, animate: boolean) {
    cancelAnimationFrame(this.raf);
    const toks = this.tokens(s);
    const scrub = this.querySelector<HTMLInputElement>("[data-scrub]");
    if (scrub) scrub.disabled = toks.length === 0;
    if (!toks.length) return;
    if (!animate || reduced()) { toks.forEach((t) => this.rest(t)); if (scrub) scrub.value = "1000"; return; }
    const plans = this.plans(toks), longest = plans.at(-1)!.offset + plans.at(-1)!.duration;
    const start = performance.now();
    const frame = (now: number) => {
      const el = now - start;
      for (const p of plans) this.placePlan(p, el - p.offset);
      if (scrub) scrub.value = String(Math.round(Math.min(1, el / longest) * 1000));
      if (el < longest) this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  /** Direct manipulation: drag the record along its route. */
  private scrub(v: number) {
    cancelAnimationFrame(this.raf);
    const s = this.wi && this.data.whatIf ? this.data.whatIf.step : this.i;
    const plans = this.plans(this.tokens(s));
    if (!plans.length) return;
    const last = plans.at(-1)!;
    const total = last.offset + last.duration, elapsed = Math.min(1, Math.max(0, v)) * total;
    for (const p of plans) this.placePlan(p, elapsed - p.offset);
  }

  /* ---------- hover to inspect ---------- */

  private tips() {
    const stage = this.querySelector<HTMLElement>(".stage"), tip = this.querySelector<HTMLElement>(".tip");
    if (!stage || !tip || !this.svg) return;
    const hide = () => { tip.hidden = true; };
    this.svg.addEventListener("pointermove", (e) => {
      const target = (e.target as Element).closest("[data-tip]");
      const el = target?.closest("[data-el]");
      if (!target || (el && !el.classList.contains("on"))) return hide();
      tip.textContent = target.getAttribute("data-tip");
      tip.hidden = false;
      const r = stage.getBoundingClientRect();
      const x = Math.min(e.clientX - r.left + 14, r.width - tip.offsetWidth - 8);
      tip.style.transform = `translate(${Math.max(8, x)}px, ${e.clientY - r.top + 16}px)`;
    });
    this.svg.addEventListener("pointerleave", hide);
  }
}

if (!customElements.get("sp-guide")) customElements.define("sp-guide", SpGuide);
