import { CANVAS, defineGuide, isoGrid, line, note, pawn, pill, plot, plotPoint, prism, raise, ride, rule, series, step, stop, table } from "@signal-path/engine";
import type { El, PlotEl, Pt, TableEl } from "@signal-path/engine";

// One board of 40 customers described by twelve standardised features. Each stop changes how the board draws them:
// two features, the direction through those two, the variance each component explains, the customers on two components,
// and a t-SNE map of the same customers at two perplexities. The card on the right is what the method outputs, and the
// rail carries the table through the method to the data team.
const G = isoGrid(480, 240, 30);
const F1 = G.p(0.4, 7.4);
const board = (id: string, xr: [number, number], yr: [number, number], extra: Partial<PlotEl>) => raise(plot(id, 0, 0, 480, 290, xr, yr, { group: id, ...extra }), F1, 30);

type P = [number, number];
/**
 * The customers are synthetic: twelve features driven by two underlying factors plus noise, drawn as one cloud with no groups.
 * Every number below was computed from that one table: the standardised pair, the PCA variance shares and scores, and exact t-SNE runs.
 */
const PAIR: P[] = [[1.62, 1.77], [-2.07, -1.46], [-1.43, -1.9], [-0.02, 0.34], [0.88, 0.67], [-1.71, -1.46], [-0.48, -0.36], [-1.03, -1.02], [-1.01, -0.53], [-1.16, -1.12], [0.42, 0.14], [0.47, 0.47], [0.37, 0.14], [0.8, 0.36], [-0.57, -0.77], [0, 0.08], [-0.47, -0.61], [-1.24, -1.04], [-0.11, -0.88], [1.21, 1.06], [0.28, -0.02], [0.23, 0.62], [0.31, 0.01], [-0.16, 0.04], [-0.45, -0.33], [0.19, 0.24], [0.4, 0.43], [1.09, 0.91], [-0.01, 0], [0.11, -0.25], [0.37, 0.29], [2.38, 3.21], [-0.07, -0.11], [2.21, 1.98], [-0.15, -0.11], [1.44, 1.49], [0.28, 0.11], [-1.37, -1], [-0.44, -0.47], [-1.1, -0.96]];
/** Percentage of variance explained by each of the twelve components. */
const RATIOS = [50.3, 32.9, 4, 3.5, 2.3, 2.1, 1.7, 1.3, 0.8, 0.7, 0.3, 0.2];
const CUM = RATIOS.map((_, i) => Math.min(100, Math.round(RATIOS.slice(0, i + 1).reduce((a, b) => a + b, 0) * 10) / 10));
/** Each customer's coordinates on the first two components. */
const SCORES: P[] = [[4.11, 1.13], [-4.27, 2.06], [-3.26, 3.54], [0.07, 0.21], [2.05, 0.14], [-2.77, 1.48], [0.05, 1.58], [-2.69, -3.26], [-2.09, 2.64], [-3.19, -1.16], [-0.26, -1.13], [0.62, -0.34], [0.65, 2.37], [0.63, -1.08], [-2.53, -3.28], [0.5, 1.44], [-1.38, -0.45], [-2.56, 1.29], [-2.29, -4.34], [3.12, 1.62], [0.3, -0.67], [1.27, 1.44], [-0.42, 0.35], [0.34, -2.75], [-0.9, -2.5], [-0.04, -1.2], [0.47, 0.15], [3.12, -3.27], [0.03, 0.59], [-0.31, -0.72], [1.26, -0.08], [6.84, -1.89], [-0.97, 0.01], [5.82, -0.34], [-0.54, 2.13], [3.77, 2.58], [1, -0.14], [-2.31, 0.36], [-0.56, 4.07], [-2.7, -2.58]];
/** Exact t-SNE of the twelve features at perplexity 2 and at perplexity 30, scaled to the board. Joining points closer than 1.5 units gives 7 clumps at perplexity 2. */
const TSNE2: P[] = [[6.99, -4.08], [4.21, 8.77], [4.35, 10], [-2.51, -3.64], [2.78, -2.12], [3.53, 8.88], [-5.61, -4.24], [1.6, 5.96], [3.94, 9.81], [2.1, 6.97], [-3.55, -2.73], [-2.32, -2.83], [-5.74, -5.8], [-2.71, -2.31], [0.83, 6.17], [-5.5, -4.95], [0.16, -4.32], [3.2, 8.87], [0.38, 5.85], [7.27, -3.96], [-0.84, 1.18], [-4.74, -5.15], [-3.42, -4.84], [-2.41, 2.06], [-1.77, 1.77], [-1.14, 1.38], [-3.25, -3.88], [-2.95, 2.32], [-3.63, -4.28], [0.37, -4.14], [2.51, -2.14], [5.13, -5.24], [-1.92, -4.02], [5.39, -5.14], [-6.16, -5.08], [7.82, -3.84], [-0.3, 0.81], [2.73, 7.77], [-6.38, -6.14], [1.54, 6.3]];
const TSNE30: P[] = [[4.38, -5.62], [-7.24, 6.4], [5.86, 6.9], [0.53, 0.84], [1.04, -5.63], [6.14, 4.17], [-5.31, -1.64], [-4.23, 7.32], [-8.03, -2.56], [-6.27, -5.65], [-4.21, 1.62], [2.41, -0.07], [-0.47, 3.03], [1.68, 2.79], [0.41, 8.71], [-0.56, -0.89], [-6.61, 0.61], [7.08, 1.98], [-1.9, 6.99], [4.42, -2.61], [-3.88, -3.66], [2.42, -3.73], [-2.79, 3.4], [-6.24, 3.46], [0.16, 5.72], [-2.38, -2.33], [-0.24, -3], [4.78, -10], [-1.71, 1.02], [-1.51, -4.85], [1.55, -1.88], [6.85, -7.47], [5.89, -0.32], [3.08, -7.97], [3.98, 1.73], [6.51, -4.01], [-3.26, -0.52], [-3.49, -6.74], [3.56, 4.86], [-2.43, 9.55]];

/** Two standardised features: the first component runs along the diagonal and carries (1 + r) / 2 of their variance. */
const N = PAIR.length, R = PAIR.reduce((s, [x, y]) => s + x * y, 0) / Math.sqrt(PAIR.reduce((s, [x]) => s + x * x, 0) * PAIR.reduce((s, [, y]) => s + y * y, 0));
const ALONG = Math.round(50 * (1 + R)), ACROSS = 100 - ALONG;
const KEPT = Math.round(CUM[1]), LEFT = 100 - KEPT;
const PAIRS_TO_PLOT = (12 * 11) / 2;

// Both axes of the pair and of the component chart use the same pixels per unit, so orthogonal directions are drawn at right angles.
const PAIRP = board("pair", [-6.08, 6.08], [-3.5, 3.5], { title: "Two of twelve features", xt: [-4, -2, 0, 2, 4], yt: [-2, 0, 2], xLabel: "items per order, standardised", yLabel: "parcel weight" });
const SCREE = board("scree", [0.3, 12.7], [0, 100], { title: "Variance explained by each component, %", xt: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], yt: [0, 25, 50, 75, 100], xLabel: "component" });
const MAP = board("map", [-8.3, 8.3], [-4.78, 4.78], { title: "Customers on two components", xt: [-8, -4, 0, 4, 8], yt: [-4, 0, 4], xLabel: "component 1", yLabel: "component 2" });
const flat = (id: string, title: string) => board(id, [-11, 11], [-11, 11], { title, xt: [], yt: [], xLabel: "t-SNE axis 1", yLabel: "t-SNE axis 2", grid: false });
const T2 = flat("tsne2", "t-SNE map, perplexity 2"), T30 = flat("tsne30", "t-SNE map, perplexity 30");

const on = (p: PlotEl, x: number, y: number): Pt => plotPoint(p, x, y).map(Math.round) as Pt;
const CARD = G.p(5.9, -4.4);
const card = (id: string, title: string, cols: string[], colAt: number[], rows: TableEl["rows"], extra: Partial<TableEl> = {}) =>
  raise(table(id, 0, 0, 270, cols, rows, { at: colAt, rowH: 34, title, group: id, ...extra }), CARD, 30);

const START = G.p(1.6, 7.4), ALGO = G.p(4.4, 7.4), CORNER = G.p(8.4, 7.4), REVIEW = G.p(8.4, 4.2);
const method = (id: string, title: string, sub: string, glyph: string, extra: object = {}): El =>
  prism(id, 3.7, 6.7, 1.4, 1.4, 30, { hue: "track", glyph, title, sub, at: "sw", group: id, ...extra });
const team = (id: string, say?: string): El => pawn(id, 8.4, 1.3, "Data team", say, { group: id });

export default defineGuide({
  id: "dimensionality-reduction", track: "ml", module: "Other learning problems", slug: "dimensionality-reduction",
  title: "Dimensionality reduction",
  summary: "Many correlated features can be compressed into a few directions that keep most of the information. PCA finds those directions and states how much variance they keep. t-SNE and UMAP draw maps for the eye, and a map can show clusters that are not there.",
  forLeads: "A reduced table is cheaper to store, plot and model, and PCA states what share of the variance it kept. A two-dimensional map of customers is a way to look at data. It is not a finding about them.",
  status: "draft", minutes: 7,
  counters: ["Features", "Columns kept", "Variance kept", "Groups seen"],
  whatIf: { label: "What if the perplexity 2 map were read as segments?", step: 4, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Customers are synthetic: one cloud with no groups. Shares and maps are computed from it",
    label: `A board of 40 customers described by twelve features. It first plots two of the features, then draws the line through them that carries ${ALONG}% of their variance. A bar chart shows the variance explained by each of twelve components, with ${KEPT}% in the first two. The customers are then plotted on those two components as one cloud. A t-SNE map at perplexity 2 breaks the same customers into tight clumps, and a t-SNE map at perplexity 30 shows one cloud again. A card on the right shows what each method outputs, and a rail carries the table through the method to the data team.`,
    els: [
      PAIRP,
      series("pair-pts", "pair", "points", PAIR, { hue: "sky", group: "pair" }),
      series("pc1", "pair", "line", [[-3, -3], [3, 3]], { w: 4, group: "pcs" }),
      series("pc2", "pair", "line", [[-1.3, 1.3], [1.3, -1.3]], { tone: "ink", w: 3, label: `component 2, ${ACROSS}%`, group: "pcs" }),
      note("pc1-name", ...on(PAIRP, -2.5, -3.1), `component 1, ${ALONG}%`, { strong: true, size: 12, on: "pair", group: "pcs" }),
      pill("pairs", on(PAIRP, -5.8, 2.7), `${PAIRS_TO_PLOT} pairs to plot`, { anchor: "start", on: "pair", group: "ask" }),

      SCREE,
      series("share", "scree", "bars", RATIOS.map((v, i) => [i + 1, v] as P), { hue: "sky", hot: [0, 1], group: "scree" }),
      series("total", "scree", "line", CUM.map((v, i) => [i + 1, v] as P), { tone: "ink", w: 3, group: "scree" }),
      rule("keep", "scree", 2.5, { group: "scree" }),
      pill("kept", on(SCREE, 7.6, 52), `${KEPT}% in 2 components`, { on: "scree", group: "scree" }),
      stop("at-1", ...plotPoint(SCREE, 1, CUM[0]), undefined, undefined, { group: "anchor" }),
      stop("at-2", ...plotPoint(SCREE, 2, CUM[1]), undefined, undefined, { group: "anchor" }),

      MAP,
      series("scores", "map", "points", SCORES, { hue: "sky", group: "map" }),
      pill("one", on(MAP, -8, 4), "one cloud", { anchor: "start", on: "map", group: "map" }),

      T2,
      series("clumps", "tsne2", "points", TSNE2, { hue: "sky", group: "tsne2" }),
      pill("false", on(T2, 10.4, 3.4), "clumps, not groups", { tone: "alert", anchor: "end", on: "tsne2", group: "tsne2" }),
      T30,
      series("cloud", "tsne30", "points", TSNE30, { hue: "sky", group: "tsne30" }),

      card("t-raw", "Customer table", ["customer", "items", "weight", "10 more"], [14, 96, 150, 206],
        [["803", "3", "7.1", "..."], ["811", "6", "14.1", "..."], ["734", "2", "4.2", "..."], ["812", "5", "12.8", "..."]], { mono: true }),
      card("t-pair", "Items and weight", ["direction", "variance"], [14, 170],
        [{ cells: ["component 1", `${ALONG}%`], hot: true }, ["component 2", `${ACROSS}%`]]),
      card("t-scree", "PCA, 12 features", ["component", "explains", "total"], [14, 120, 200],
        [{ cells: ["1", `${Math.round(RATIOS[0])}%`, `${Math.round(CUM[0])}%`], hot: true }, { cells: ["2", `${Math.round(RATIOS[1])}%`, `${KEPT}%`], hot: true }, { cells: ["3 to 12", `${LEFT}%`, "100%"], mute: true }]),
      card("t-reduced", "Reduced table", ["customer", "comp. 1", "comp. 2"], [14, 110, 190],
        ["803", "811", "734", "812"].map((c, i) => [c, SCORES[i][0].toFixed(2), SCORES[i][1].toFixed(2)]), { mono: true, foot: `${KEPT}% of variance kept` }),
      card("t-tsne", "Read from the map", ["reading", "holds"], [14, 180],
        [{ cells: ["7 clumps", "no"], hot: true }, ["cluster size", "no"], ["distance apart", "maybe not"]]),
      card("t-check", "Before any claim", ["check", "result"], [14, 140],
        [["perplexity 30", "one cloud"], ["another seed", "map differs"], ["12 features", "no groups"]], { foot: "exploration, not evidence" }),

      line("rail", [F1, CORNER, REVIEW], { always: true }),
      stop("s-plot", ...START, undefined, undefined, { always: true }),
      stop("s-algo", ...ALGO, undefined, undefined, { always: true }),
      stop("s-review", ...REVIEW, undefined, undefined, { always: true }),
      method("none", "No reduction", "12 columns pass", "table", { hue: "paper" }),
      method("pca", "PCA", "linear projection", "funnel"),
      method("tsne", "t-SNE", "perplexity 2", "map"),
      method("maps", "t-SNE or UMAP", "for visualisation", "map"),
      team("team-ask", "which pair?"), team("team"), team("team-clumps", "7 segments?"), team("team-check", "test it first"),
    ],
  },
  steps: [
    step({
      id: "too-many", label: "Twelve features", kind: "problem", title: "Twelve features do not fit on one chart",
      caption: `Vinterhus describes each customer with twelve features. A scatter plot shows two of them at a time, and there are ${PAIRS_TO_PLOT} pairs.`,
      show: ["pair", "ask", "t-raw", "none", "team-ask"], counters: ["12", "12", "100%", "unknown"],
      rides: [ride("rail", "s-plot", "s-review", "12 features", { via: ["s-algo"], then: "2 drawn" })],
      body: ["Exploring data showed how a scatter plot relates two columns. With twelve columns no single chart shows a customer whole, and several of the columns say nearly the same thing.",
        "Dimensionality reduction facilitates the classification, visualisation, communication and storage of high-dimensional data.",
        { callout: { label: "Key idea", text: "Reduction methods rest on the idea that the dimensionality of many data sets is only artificially high." } }],
      claims: ["dimensionality-reduction-purpose", "dimensionality-reduction-artificial"],
    }),
    step({
      id: "direction", label: "One direction", kind: "idea", title: "Correlated features lie along one direction",
      caption: `Items per order and parcel weight rise together. One line through the cloud carries ${ALONG}% of their variance. The direction across it carries ${ACROSS}%.`,
      show: ["pair", "pcs", "t-pair", "pca", "team"], counters: ["2 of 12", "1 of 2", `${ALONG}%`, "unknown"],
      rides: [ride("pc1", 0.05, 0.88, "2 features", { then: "1 number" })],
      body: ["Principal component analysis finds the directions of greatest variance in the data set and represents each data point by its coordinates along each of these directions.",
        `The correlation of the two features is ${R.toFixed(2)}. A customer's position along the line replaces two numbers with one, and little is lost.`,
        "Both features are standardised before the line is fitted. In scikit-learn, `PCA` centres the input for each feature but does not scale it, so a feature measured in large units would otherwise dominate the variance."],
      claims: ["dimensionality-reduction-directions", "dimensionality-reduction-centred"],
    }),
    step({
      id: "components", label: "Components", kind: "mechanism", title: "PCA orders components by the variance they explain",
      caption: `Across all twelve features, PCA finds successive orthogonal components that each explain a maximum amount of the variance. The first two explain ${KEPT}%.`,
      show: ["scree", "t-scree", "pca", "team"], counters: ["12", "2 of 12", `${KEPT}%`, "unknown"],
      rides: [ride("total", "at-1", "at-2", `${Math.round(CUM[0])}%`, { then: `${KEPT}%` })],
      body: ["In scikit-learn, `components_` holds the principal axes in feature space, the directions of maximum variance, sorted by decreasing explained variance. `explained_variance_ratio_` is the percentage of variance explained by each one, and with all components stored the ratios sum to 1.0.",
        "`n_components` is the number of components to keep. Set between 0 and 1 with the full solver, it selects the number of components needed for the explained variance to exceed that share.",
        { callout: { label: "What changed", text: `Twelve components describe the data exactly. Ten of them together explain ${LEFT}% of the variance, so two carry most of the information.` } }],
      claims: ["dimensionality-reduction-pca", "dimensionality-reduction-components", "dimensionality-reduction-n-components"],
    }),
    step({
      id: "project", label: "Projection", kind: "mechanism", title: "Each customer is projected onto two components",
      caption: `Twelve columns become two. Every customer is one point on one chart, and ${LEFT}% of the variance is left behind. The customers form one cloud.`,
      show: ["map", "t-reduced", "pca", "team"], counters: ["12", "2", `${KEPT}%`, "1 cloud"],
      rides: [ride("rail", "s-plot", "s-review", "12 columns", { via: ["s-algo"], then: "2 columns" })],
      body: ["In scikit-learn, PCA is a transformer that learns its components in `fit` and can then project new data onto them. `inverse_transform` transforms data back to its original space.",
        "PCA is linear. Linear frameworks can be powerful, but often miss important non-linear structure in the data.",
        "An autoencoder is a non-linear generalisation of PCA: a multilayer encoder network transforms the high-dimensional data into a low-dimensional code through a small central layer, and a similar decoder network recovers the data from the code."],
      claims: ["dimensionality-reduction-project", "dimensionality-reduction-linear", "dimensionality-reduction-autoencoder"],
    }),
    step({
      id: "false-clusters", label: "False clusters", kind: "watch-out", title: "A map can show clusters that are not there",
      caption: "t-SNE at perplexity 2 breaks the same customers into tight clumps. Relative cluster sizes cannot be read from a t-SNE plot, and distances between clusters may mean nothing.",
      show: ["tsne2", "t-tsne", "tsne", "team-clumps"], counters: ["12", "2", "not measured", "7 clumps"],
      rides: [ride("rail", "s-plot", "s-review", "40 customers", { via: ["s-algo"], then: "7 groups?", tone: "alert" })],
      body: ["t-SNE converts affinities of data points to probabilities and minimises the Kullback-Leibler divergence between the original space and the map by gradient descent. This makes it particularly sensitive to local structure. Its main purpose is visualisation.",
        "The perplexity is effectively the number of nearest neighbours t-SNE considers. A lower perplexity ignores more global information in favour of the local neighbourhood. For 500 points of genuinely random data in 100 dimensions, a plot at perplexity 2 seems to show dramatic clusters, and those clumps are not meaningful.",
        "The algorithm is stochastic: restarts with different seeds can yield different embeddings, and global structure is not explicitly preserved.",
        "UMAP is used for visualisation similarly to t-SNE, and also for general non-linear dimension reduction. Its `n_neighbors` parameter balances local against global structure, and low values of `min_dist` give clumpier embeddings. UMAP, like t-SNE, does not completely preserve density and can create false tears in clusters, giving a finer clustering than is necessarily present in the data.",
        { callout: { label: "Watch out", text: "A classic pitfall is thinking you see patterns in what is really just random data." } }],
      claims: ["dimensionality-reduction-tsne", "dimensionality-reduction-perplexity", "dimensionality-reduction-noise", "dimensionality-reduction-sizes", "dimensionality-reduction-stochastic", "dimensionality-reduction-umap", "dimensionality-reduction-tears"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "A projection is exploration, not evidence",
      caption: "",
      show: ["tsne30", "t-check", "maps", "team-check"], counters: ["12", "2", "not measured", "1 cloud"],
      rides: [ride("rail", "s-plot", "s-review", "map", { via: ["s-algo"], then: "1 cloud" })],
      body: [{ pair: {
        left: { label: "PCA", items: ["Linear and reusable on new data", "States the variance it keeps"] },
        right: { label: "t-SNE and UMAP", items: ["Maps for visualisation", "Compare several settings"] },
      } },
        "Getting the most from t-SNE may mean analysing multiple plots with different perplexities. Clusters that come out of a UMAP embedding are explored and evaluated to validate them where possible.",
        "Manifold learning methods are based on a nearest-neighbour search, so the same scale is used over all features.",
        "The opposite misreading also occurs. Failing to see well separated groups on a two-dimensional t-SNE map does not necessarily imply that a supervised model cannot classify the data: two dimensions may not be enough to represent its structure."],
      claims: ["dimensionality-reduction-project", "dimensionality-reduction-components", "dimensionality-reduction-tsne", "dimensionality-reduction-umap", "dimensionality-reduction-validate", "dimensionality-reduction-scale", "dimensionality-reduction-two-dims"],
    }),
  ],
  governance: { text: "A projection can show clusters that are not there: t-SNE can draw clumps from random data, and UMAP can tear one cluster into several. A map is exploration. A cluster seen on it is evaluated before it is treated as evidence about customers.", claims: ["dimensionality-reduction-noise", "dimensionality-reduction-tears", "dimensionality-reduction-validate"] },
  closing: {
    pitfalls: [
      "Reading clumps on a t-SNE or UMAP map as customer segments without testing them.",
      "Comparing the sizes of clusters on a t-SNE map, or the distances between them.",
      "Running PCA on features with different units without scaling them first.",
    ],
    questions: [
      "Why can two correlated features be replaced by one number?",
      "What does the explained variance ratio of a component state?",
      "Which checks come before a cluster on a map is called a segment?",
    ],
  },
});
