import { CANVAS, defineGuide, isoGrid, line, note, pill, plot, plotPoint, prism, raise, ride, rule, series, step, stop } from "@signal-path/engine";
import type { El } from "@signal-path/engine";

// Two boards stand on the floor. The left one holds the real orders, the right one the orders a model generates.
// The model sits between them: real orders ride in, and noise, samples and one copy ride out.
const G = isoGrid(480, 224, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);

/** A small seeded generator, so the scatter is the same on every build. */
function rng(seed: number) {
  let a = seed;
  const u = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { u, n: () => Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u()) };
}
/** Two kinds of order: light parcels of accessories and heavy parcels of furniture. Weight in kg, amount in kr. */
interface Kind { mx: number; sx: number; my: number; slope: number; sy: number }
const LIGHT: Kind = { mx: 8, sx: 3.3, my: 1000, slope: 90, sy: 300 }, HEAVY: Kind = { mx: 30, sx: 3.6, my: 4200, slope: 50, sy: 520 };
const at = (k: Kind, z1: number, z2: number): [number, number] => [Math.round((k.mx + k.sx * z1) * 10) / 10, Math.round(k.my + k.slope * k.sx * z1 + k.sy * z2)];
const draw = (seed: number, k: Kind, count: number): [number, number][] => {
  const r = rng(seed);
  return Array.from({ length: count }, () => at(k, Math.max(-1.8, Math.min(1.8, r.n())), Math.max(-1.8, Math.min(1.8, r.n()))));
};
/** The line around a kind of order at a given number of standard deviations. */
const contour = (k: Kind, sd: number): [number, number][] => Array.from({ length: 25 }, (_, i) => at(k, sd * Math.cos((i * Math.PI) / 12), sd * Math.sin((i * Math.PI) / 12)));

/** Order 4502: a light parcel with a high amount, unlike any other order. */
const RARE: [number, number] = [9, 4900];
const REAL_LIGHT = draw(11, LIGHT, 24), REAL_HEAVY = draw(12, HEAVY, 15);
const SAMPLES = [...draw(21, LIGHT, 23), ...draw(22, HEAVY, 15)];
/** One generated order followed from noise to its place among the heavy parcels. */
const PATH: [number, number][] = [[19, 2500], [24.5, 2400], [25.5, 3300], [29.6, 3700]];
const noise = rng(31);
const NOISE: [number, number][] = [PATH[0], ...Array.from({ length: 39 }, () => [Math.round((2 + noise.u() * 36) * 10) / 10, Math.round(300 + noise.u() * 5300)] as [number, number])];

const AXES = { xt: [0, 10, 20, 30, 40], yt: [0, 2000, 4000, 6000], xLabel: "parcel weight, kg", yLabel: "amount, kr" };
const DATA = raise(plot("data", 0, 0, 430, 264, [0, 40], [0, 6000], { title: "Real orders", ...AXES, always: true }), F1, 30);
const GEN = raise(plot("gen", 0, 0, 430, 264, [0, 40], [0, 6000], { title: "Generated orders", ...AXES, always: true }), F2, 30);

/** The learned distribution drawn as contours on a board. */
const shape = (id: string, on: string, group: string, extra: { dashed?: boolean; tone?: "track" | "muted" }): El[] =>
  [LIGHT, HEAVY].flatMap((k, i) => [1, 2].map((sd) => series(`${id}-${i}-${sd}`, on, "line", contour(k, sd), { smooth: true, w: sd === 1 ? 3.5 : 2.5, group, ...extra })));
const hidden = (id: string, gx: number, gy: number) => stop(id, ...G.p(gx, gy), undefined, undefined, { group: "anchor" });

export default defineGuide({
  id: "generative-models", track: "ml", module: "Other learning problems", slug: "generative-models",
  title: "Generative models",
  summary: "A generative model learns the distribution of the data itself and samples new examples from it. Autoencoders, diffusion models and autoregressive models are three ways to build one.",
  forLeads: "Synthetic data is not private by default, and generated media needs to be marked. Both are controls to plan before a generative model's output leaves the team.",
  status: "draft", minutes: 7,
  counters: ["Model learns", "Generated orders", "Real orders exposed", "Privacy test"],
  whatIf: { label: "What if no privacy test were run?", step: 4, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders are illustrative",
    label: "Two charts of orders by parcel weight and amount. The left one holds the real orders, in two clusters with one order apart from both. A model between the charts learns contours around the clusters. The right chart starts empty, fills with random noise, and the noise moves into the same two clusters as generated orders. One generated order lands on the lone real order and is marked in red, and a privacy test on the rail stops it.",
    els: [
      DATA,
      series("cls-light", "data", "points", [...REAL_LIGHT, RARE], { hue: "sky", group: "cls" }),
      series("cls-heavy", "data", "points", REAL_HEAVY, { hue: "rose", group: "cls" }),
      rule("boundary", "data", 19, { tone: "ink", label: "boundary", group: "cls" }),
      note("kept", ...plotPoint(DATA, 17.6, 3000), "kept", { anchor: "end", strong: true, on: "data", group: "cls" }),
      note("returned", ...plotPoint(DATA, 20.4, 3000), "returned", { strong: true, on: "data", group: "cls" }),
      series("real", "data", "points", [...REAL_LIGHT, ...REAL_HEAVY, RARE], { hue: "sky", group: "real" }),
      ...shape("learned", "data", "real", {}),

      GEN,
      note("empty", GEN.x + GEN.w / 2, GEN.y + GEN.h / 2, "no orders to share", { anchor: "middle", tone: "muted", strong: true, on: "gen", group: "empty" }),
      series("noise", "gen", "points", NOISE, { hue: "sand", group: "noise" }),
      ...shape("target", "gen", "samples", { dashed: true, tone: "muted" }),
      series("samples", "gen", "points", [PATH[3], ...SAMPLES], { hue: "track", group: "samples" }),
      series("denoise", "gen", "line", PATH, { w: 2.5, smooth: true, group: "denoise" }),
      series("denoise-from", "gen", "points", [PATH[0]], { hue: "sand", group: "denoise" }),
      ...PATH.map((p, i) => stop(`d${i}`, ...plotPoint(GEN, ...p), undefined, undefined, { group: "anchor" })),
      series("copy", "gen", "points", [RARE], { hue: "track", group: "copy" }),

      series("leak-real", "data", "points", [RARE], { tone: "alert", r: 7, group: "leak" }),
      pill("leak-real-name", plotPoint(DATA, 14, 5650), "order 4502", { tone: "alert", anchor: "start", mono: true, to: plotPoint(DATA, ...RARE), on: "data", group: "leak" }),
      series("leak-gen", "gen", "points", [RARE], { tone: "alert", r: 7, group: "leak" }),
      pill("leak-gen-name", plotPoint(GEN, 14, 5650), "copy of 4502", { tone: "alert", anchor: "start", to: plotPoint(GEN, ...RARE), on: "gen", group: "leak" }),

      line("in", [F1, G.p(7.1, 7.8)], { always: true }),
      line("out", [G.p(7.8, 7.1), F2], { group: "model" }),
      hidden("i1", 1.6, 7.8), hidden("i2", 4.8, 7.8), hidden("o1", 7.8, 6.2), hidden("o2", 7.8, 5.6), hidden("o3", 7.8, 1.6),
      prism("model", 7.1, 7.1, 1.4, 1.4, 30, { hue: "track", glyph: "net", title: "Generative model", sub: "learns the distribution", at: "s", group: "model" }),
      prism("classifier", 7.1, 7.1, 1.4, 1.4, 30, { hue: "sand", glyph: "split", title: "Returns model", sub: "learns a boundary", at: "s", group: "cls" }),
      prism("test", 7.3, 3.4, 1, 1, 22, { hue: "mint", glyph: "shield", title: "Privacy test", at: "s", group: "test" }),
    ],
  },
  steps: [
    step({
      id: "boundary", label: "No orders", kind: "problem", title: "A classifier cannot produce an order",
      caption: "A supplier needs test orders, and real ones hold customer details. The returns model at Vinterhus only separates returned orders from kept ones. It cannot say how likely an order is.",
      show: ["cls", "empty"], counters: ["a boundary", "0", "0", "none"],
      rides: [ride("in", "i1", "i2", "order 4471", { then: "returned?" })],
      body: ["The returns model is discriminative: it captures the conditional probability of the label given the order. A discriminative model ignores the question of whether a given instance is likely.",
        "Each point is one order, placed by parcel weight and amount. The boundary is all the returns model keeps of them."],
      claims: ["generative-models-discriminative"],
    }),
    step({
      id: "distribution", label: "Distribution", kind: "idea", title: "A generative model learns where orders lie",
      caption: "Trained on the same orders without the labels, it models the distribution of the data itself. The contours mark where an order is likely.",
      show: ["real", "empty", "model"], counters: ["the distribution", "0", "0", "none"],
      rides: [ride("in", "i1", "i2", "order 4471")],
      body: ["Generative models capture the joint probability of examples and labels, or the probability of the examples alone if there are no labels. A generative model includes the distribution of the data itself, and tells you how likely a given example is.",
        { callout: { label: "Key idea", text: "A model that knows where the data lies can be asked for a new point from the same places." } }],
      claims: ["generative-models-generative", "generative-models-distribution"],
    }),
    step({
      id: "noise", label: "Noise", kind: "mechanism", title: "Each new order starts as random noise",
      caption: "To generate 40 orders, this model first draws 40 random points. On the board they have no pattern yet.",
      show: ["real", "model", "noise"], counters: ["the distribution", "40 noise points", "0", "none"],
      rides: [ride("out", "o1", "o3", "noise")],
      body: ["The sampling chain of a diffusion model starts from Gaussian noise. A variational autoencoder also starts from a random draw: it first draws a sample from its code distribution, then runs it through a generator network.",
        "An autoencoder is a neural network trained to copy its input to its output through a code. Its encoder produces the code and its decoder produces the reconstruction."],
      claims: ["generative-models-diffusion", "generative-models-vae-sample", "generative-models-autoencoder"],
    }),
    step({
      id: "denoise", label: "Denoise", kind: "mechanism", title: "The model turns noise into new orders",
      caption: "A diffusion model removes the noise in learned steps. Each point moves to where orders are likely. The 40 points are new examples sampled from the learned distribution.",
      show: ["real", "model", "samples", "copy", "denoise"], counters: ["the distribution", "40", "not checked", "none"],
      rides: [ride("denoise", "d0", "d3", "noise", { via: ["d1", "d2"], then: "new order" })],
      body: ["A diffusion model is trained to reverse a diffusion process, which gradually adds noise to the data until the signal is destroyed. Run in the sampling direction, its learned transitions produce samples matching the data.",
        "An autoregressive model takes another route. It decomposes the joint probability with the chain rule into a product of conditionals and samples one value at a time. PixelRNN predicts the pixels of an image in sequence this way.",
        "For synthetic tabular data the difficulty is the mix of discrete and continuous columns. CTGAN, a conditional generative adversarial network, was designed for it, and the Synthetic Data Vault library offers it as a synthesizer."],
      claims: ["generative-models-diffusion", "generative-models-autoregressive", "generative-models-tabular", "generative-models-sdv"],
    }),
    step({
      id: "leak", label: "Privacy", kind: "watch-out", title: "A generated order can expose a real one",
      caption: "One sample lands on order 4502, the only light parcel with a high amount. In a published evaluation, synthetic data either did not prevent inference attacks or did not retain utility.",
      show: ["real", "model", "samples", "leak"], counters: ["the distribution", "40", "1", "none"],
      rides: [ride("out", "o1", "o3", "copy of 4502", { tone: "alert" })],
      body: ["The evaluation covered a wide range of generative models. It also found the privacy gain of synthetic data highly variable and its utility loss unpredictable, so neither can be assumed for a new dataset.",
        { callout: { label: "Watch out", text: "Synthetic does not mean anonymous. A privacy claim for generated data is a claim to test." } }],
      claims: ["generative-models-privacy"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Test privacy claims and mark generated media",
      caption: "",
      show: ["real", "model", "samples", "test"], counters: ["the distribution", "39 released", "0", "attack run"],
      rides: [ride("out", "o1", "o3", "sample", { via: ["o2"], then: "released" })],
      body: [{ pair: {
        left: { label: "Synthetic tables", items: ["Run privacy attacks before release", "Measure utility on the real task"] },
        right: { label: "Generated media", items: ["Mark output in a machine-readable format", "Record provenance in a Content Credential"] },
      } },
        "The EU AI Act requires providers of AI systems that generate synthetic audio, image, video or text to ensure the output is marked in a machine-readable format and detectable as artificially generated or manipulated.",
        "C2PA defines provenance as the facts about the history of a piece of digital content. A Content Credential is a cryptographically bound structure that records it, with assertions such as origin, modifications and use of AI."],
      claims: ["generative-models-privacy", "generative-models-marking", "generative-models-provenance"],
    }),
  ],
  governance: { text: "A privacy claim for synthetic data needs testing: in a published evaluation, synthetic data either did not prevent inference attacks or did not retain utility. Generated media needs provenance: the EU AI Act requires providers to mark synthetic audio, image, video and text in a machine-readable format.", claims: ["generative-models-privacy", "generative-models-marking"] },
  closing: {
    pitfalls: [
      "Sharing synthetic data as anonymous without running a privacy attack against it.",
      "Judging a generative model by how real its samples look instead of by the task the data is for.",
      "Publishing generated images, audio or video without a machine-readable mark.",
    ],
    questions: [
      "What does a generative model learn that a classifier does not?",
      "Where does a diffusion model start when it generates a sample?",
      "Why can a synthetic dataset still expose a real customer?",
    ],
  },
});
