import { CANVAS, defineGuide, isoGrid, line, pawn, pill, plot, plotPoint, prism, raise, ride, series, shade, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Pt, TableEl } from "@signal-path/engine";

// One chart of customers by orders per year and average order value, with no label column. Each stop changes how the
// points are grouped: unlabelled, nearest centroid, settled centroids, dense areas with two customers left out, and
// random cuts that isolate one of them. The card on the right is what the method outputs, and the rail carries a
// flagged customer to Support for review.
const G = isoGrid(480, 240, 30);
const F1 = G.p(0.4, 7.4);
const CHART = raise(plot("cust", 0, 0, 480, 290, [0, 24], [0, 400], {
  title: "Customers", xt: [0, 6, 12, 18, 24], yt: [0, 100, 200, 300, 400], xLabel: "orders per year", yLabel: "average order value", always: true,
}), F1, 30);

type P = [number, number];
/** 24 customers in three natural groups, then the two that fit none. Distances are measured on the chart as drawn, both axes scaled 0 to 1. */
const OCCASIONAL: P[] = [[3, 90], [4, 130], [5, 100], [6, 150], [4.5, 70], [6.5, 115], [7, 85], [5.5, 135]];
const FREQUENT: P[] = [[16, 70], [17.5, 110], [18, 60], [19, 95], [20, 75], [17, 85], [19.5, 120], [21, 100]];
const LARGE: P[] = [[8, 290], [9, 330], [10, 300], [11, 340], [9.5, 270], [12, 310], [10.5, 360], [8.5, 315]];
const C811: P = [22, 365], C734: P = [13, 200];
const ALL: P[] = [...OCCASIONAL, ...FREQUENT, ...LARGE, C811, C734];

/** Lloyd's k-means on these points from three customers as starting centroids: assignments and centroids per round. */
const HUE: Hue[] = ["sky", "mint", "sand"];
const START: P[] = [[3, 90], [6, 150], [19.5, 120]];
const FIRST = "01010101222222221111111121".split("").map((c) => HUE[Number(c)]);
const PATHS: P[][] = [
  [[3, 90], [4.9, 86.3], [5.2, 109.4]],
  [[6, 150], [8.7, 249.6], [11.3, 308]],
  [[19.5, 120], [18.9, 120], [18.5, 89.4]],
];
const END: P[] = PATHS.map((p) => p[2]);
const nearest = (p: P, cs: P[]): P => cs.reduce((best, c) => (Math.hypot((p[0] - c[0]) / 24, (p[1] - c[1]) / 400) < Math.hypot((p[0] - best[0]) / 24, (p[1] - best[1]) / 400) ? c : best));

const at = (p: P, dx = 0, dy = 0): Pt => [Math.round(plotPoint(CHART, ...p)[0] + dx), Math.round(plotPoint(CHART, ...p)[1] + dy)];
const odd = (id: string, group: string, extra: Partial<El> = {}): El[] => [
  series(`${id}-811`, "cust", "points", [C811], { r: 6, hot: [0], label: "811", group, ...extra } as object),
  series(`${id}-734`, "cust", "points", [C734], { r: 6, hot: [0], label: "734", group, ...extra } as object),
];

const CARD = G.p(5.9, -4.4);
const card = (id: string, title: string, cols: string[], colAt: number[], rows: TableEl["rows"], extra: Partial<TableEl> = {}) =>
  raise(table(id, 0, 0, 270, cols, rows, { at: colAt, rowH: 34, title, group: id, ...extra }), CARD, 30);

const START_STOP = G.p(1.6, 7.4), ALGO = G.p(4.4, 7.4), CORNER = G.p(8.4, 7.4), REVIEW = G.p(8.4, 4.2);
const algo = (id: string, title: string, sub: string, glyph: string) =>
  prism(id, 3.7, 6.7, 1.4, 1.4, 30, { hue: "track", glyph, title, sub, at: "sw", group: id });
const PERSON: [number, number] = [8.4, 1.3];

export default defineGuide({
  id: "clustering-and-anomaly-detection", track: "ml", module: "Other learning problems", slug: "clustering-and-anomaly-detection",
  title: "Clustering and anomaly detection",
  summary: "Without labels, a model finds structure by grouping examples that lie close together. The examples that fit no group are flagged as anomalies, and a flag is a score that a person reviews.",
  forLeads: "Clusters and flags come from settings the team chooses, not from ground truth. Segments built on behaviour can stand in for protected traits, and a flagged person needs a human review before anything is done.",
  status: "draft", minutes: 7,
  counters: ["Labels", "Groups", "In no group", "Flags reviewed"],
  whatIf: { label: "What if every customer had to join a group?", step: 2, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Customers, distances and split counts are illustrative",
    label: "A chart of 26 customers by orders per year and average order value, with no label column. k-means places three centroids, assigns every customer to the nearest one and moves each centroid to the mean of its group until nothing changes. Density-based clustering then finds the same three groups but leaves customers 811 and 734 in no group. Random cuts of an isolation forest separate customer 811 in two splits, and the flag travels to Support for review before any action.",
    els: [
      CHART,
      series("raw", "cust", "points", ALL, { tone: "muted", r: 6, group: "raw" }),

      ...ALL.map((p, i) => series(`a-${i}`, "cust", "line", [p, nearest(p, START)], { tone: "muted", w: 1.5, group: "assign" })),
      series("first", "cust", "points", ALL, { hues: FIRST, r: 6, group: "first" }),
      series("c-start", "cust", "points", START, { hues: HUE, r: 8, hot: [0, 1, 2], group: "first" }),
      pill("start-name", at([9.5, 45]), "3 starting centroids", { anchor: "start", on: "cust", group: "first" }),
      series("pick", "cust", "line", [[7, 85], [3, 90]], { w: 3, group: "first" }),

      ...PATHS.map((p, i) => series(`move-${i}`, "cust", "line", p, { tone: "ink", w: 2.5, group: "moved" })),
      series("occasional", "cust", "points", OCCASIONAL, { hue: "sky", r: 6, group: "groups" }),
      series("frequent", "cust", "points", FREQUENT, { hue: "sand", r: 6, group: "groups" }),
      series("large", "cust", "points", LARGE, { hue: "mint", r: 6, group: "groups" }),
      series("c-end", "cust", "points", END, { hues: HUE, r: 8, hot: [0, 1, 2], group: "moved" }),
      ...odd("forced", "moved", { hue: "mint" }),
      pill("pulled", at([15.6, 262]), "centroid pulled away", { anchor: "start", on: "cust", group: "moved" }),

      ...OCCASIONAL.filter((p) => p !== OCCASIONAL[2]).map((p, i) => series(`n-${i}`, "cust", "line", [OCCASIONAL[2], p], { w: 2, group: "dense" })),
      series("core", "cust", "points", [OCCASIONAL[2]], { hue: "sky", r: 6, hot: [0], label: "core sample", labelAt: 0, group: "dense" }),
      series("far", "cust", "line", [C811, [12, 310]], { w: 2.5, dashed: true, group: "dense" }),
      series("far2", "cust", "line", [C734, [9.5, 270]], { w: 2.5, dashed: true, group: "dense" }),
      pill("noise", at([15.6, 245]), "no neighbour within eps", { anchor: "start", on: "cust", group: "dense" }),
      ...odd("out", "out"),

      shade("alone", "cust", [17, 250, 24, 400], { tone: "track", group: "cuts" }),
      series("cut1", "cust", "line", [[0, 250], [24, 250]], { w: 3.5, label: "split 1", labelAt: 0, group: "cuts" }),
      series("cut2", "cust", "line", [[17, 250], [17, 400]], { w: 3.5, label: "split 2", labelAt: 0, group: "cuts" }),

      pill("proxy", at([15.6, 262]), "may encode a trait", { glyph: "eye", to: at([12, 310], 9, 4), anchor: "start", on: "cust", group: "proxy" }),

      card("t-raw", "Customer table", ["customer", "orders", "value", "segment"], [14, 96, 156, 206],
        [["803", "5", "100", "?"], ["811", "22", "365", "?"], ["734", "13", "200", "?"], ["812", "18", "60", "?"]], { mono: true }),
      card("t-first", "k-means, round 1", ["group", "customers"], [14, 160],
        [{ cells: ["group 0", "4"], hue: "sky" }, { cells: ["group 1", "13"], hue: "mint" }, { cells: ["group 2", "9"], hue: "sand" }]),
      card("t-moved", "k-means, round 3", ["group", "customers"], [14, 160],
        [{ cells: ["group 0", "8"], hue: "sky" }, { cells: ["group 1", "10"], hue: "mint" }, { cells: ["group 2", "8"], hue: "sand" }], { foot: "every customer assigned" }),
      card("t-dense", "DBSCAN labels", ["label", "customers"], [14, 160],
        [{ cells: ["0", "8"], hue: "sky" }, { cells: ["1", "8"], hue: "sand" }, { cells: ["2", "8"], hue: "mint" }, { cells: ["-1 noise", "2"], hot: true }], { mono: true }),
      card("t-score", "Isolation forest", ["customer", "mean splits", "flag"], [14, 100, 210],
        [{ cells: ["811", "3.0", "yes"], hot: true }, { cells: ["734", "4.6", "yes"], hot: true }, ["24 others", "5.0 to 6.5", "no"]]),
      card("t-review", "Review queue", ["customer", "Support found", "action"], [14, 94, 210],
        [["811", "trade buyer", "none"], ["734", "new address", "none"]], { foot: "no action before review" }),

      line("rail", [F1, CORNER, REVIEW], { always: true }),
      stop("s-plot", ...START_STOP, undefined, undefined, { always: true }),
      stop("s-algo", ...ALGO, undefined, undefined, { always: true }),
      stop("s-review", ...REVIEW, undefined, undefined, { always: true }),
      algo("kmeans", "k-means", "assign, then move", "loop"),
      algo("dbscan", "DBSCAN", "eps, min_samples", "search"),
      algo("iforest", "Isolation forest", "random splits", "split"),
      pawn("team-ask", ...PERSON, "Data team", "which kinds?", { group: "team-ask" }),
      pawn("team", ...PERSON, "Data team", undefined, { group: "team" }),
      pawn("support", ...PERSON, "Support", "review first", { group: "support" }),
      pawn("support-done", ...PERSON, "Support", "2 of 2 reviewed", { group: "support-done" }),
    ],
  },
  steps: [
    step({
      id: "no-labels", label: "No labels", kind: "problem", title: "Customers carry no segment label",
      caption: "The data team holds orders per year and average order value for 26 customers. No column says what kind of customer each one is.",
      show: ["raw", "t-raw", "team-ask"], counters: ["none", "0", "26 customers", "0"],
      rides: [ride("rail", "s-plot", "s-review", "26 rows", { then: "no labels" })],
      body: ["Supervised learning needs a label for every example. Clustering is an unsupervised technique: it groups unlabelled examples by their similarity to each other, and each group it finds is given a cluster ID.",
        "Similarity has to be defined before anything is grouped. Here it is the distance between two customers on the chart, the same measure that nearest neighbours uses, with both features scaled to the same range.",
        "Market segmentation and anomaly detection are two of the listed uses of clustering."],
      claims: ["clustering-and-anomaly-detection-unsupervised", "clustering-and-anomaly-detection-similarity"],
    }),
    step({
      id: "assign", label: "Nearest centroid", kind: "idea", title: "Each customer joins its nearest centroid",
      caption: "k-means is told to find three groups. It picks three customers as starting centroids and assigns every customer to the nearest one.",
      show: ["assign", "first", "t-first", "kmeans", "team"], counters: ["none", "3", "0", "0"],
      rides: [ride("pick", 0, 0.75, "nearest")],
      body: ["k-means tries to separate the samples into groups of equal variance by minimising the inertia, the within-cluster sum of squares. The number of clusters has to be specified in advance.",
        "The first step chooses the initial centroids, and the most basic method picks samples from the dataset. The first round here is poor: two starting centroids sit in the same natural group and split it.",
        { callout: { label: "Key idea", text: "A group is defined by a centre, and membership is decided by distance to it. No label is involved at any point." } }],
      claims: ["clustering-and-anomaly-detection-kmeans", "clustering-and-anomaly-detection-kmeans-steps"],
    }),
    step({
      id: "move", label: "Centroids move", kind: "mechanism", title: "Centroids move to the mean of their group",
      caption: "Each centroid moves to the mean of its customers, and customers are reassigned. After three rounds nothing changes. Customers 811 and 734 are assigned too.",
      show: ["moved", "groups", "t-moved", "kmeans", "team"], counters: ["none", "3", "0", "0"],
      rides: [ride("move-0", 0, 0.8, ""), ride("move-1", 0, 0.85, "mean"), ride("move-2", 0, 0.8, "")],
      body: ["After initialisation k-means loops between two steps: assign each sample to its nearest centroid, then create new centroids from the mean of the samples assigned to each one. Inertia falls here from 2.27 to 0.50.",
        "Given enough time k-means always converges, but possibly to a local minimum. The k-means++ initialisation scheme helps address this.",
        "Inertia assumes that clusters are convex and isotropic, and it is not a normalised metric. When no ground truth labels exist, the model itself has to be evaluated, for example with the Silhouette Coefficient, where a higher score relates to better defined clusters.",
        "A Gaussian mixture model generalises k-means: it assumes the points come from a finite number of Gaussian distributions and uses the covariance structure of the data as well as the centres. It also needs the number of components to be decided.",
        { callout: { label: "What changed", text: "Customers 811 and 734 belong to no natural group, yet both are counted in group 1 and pull its centroid away from the other eight." } }],
      claims: ["clustering-and-anomaly-detection-kmeans-steps", "clustering-and-anomaly-detection-kmeans-local", "clustering-and-anomaly-detection-inertia", "clustering-and-anomaly-detection-silhouette", "clustering-and-anomaly-detection-mixture"],
    }),
    step({
      id: "density", label: "Density", kind: "mechanism", title: "Density leaves two customers in no group",
      caption: "DBSCAN grows clusters from core samples, customers with enough close neighbours. Customers 811 and 734 lie far from every core sample and get the label -1: noise.",
      show: ["dense", "groups", "out", "t-dense", "dbscan", "team"], counters: ["none", "3", "2", "0"],
      rides: [ride("far", 0, 0.6, "too far"), ride("far2", 0, 0.6, "")],
      body: ["DBSCAN views clusters as areas of high density separated by areas of low density, so the clusters it finds can be any shape. Two parameters define dense: a core sample has min_samples other samples within a distance of eps.",
        "Any sample that is not a core sample and is at least eps away from every core sample is treated as an outlier. scikit-learn gives such noisy samples the label -1. The number of groups is not set in advance.",
        "The run here uses eps = 0.15 on features scaled 0 to 1 and min_samples = 5. HDBSCAN extends DBSCAN.",
        "The Local Outlier Factor scores the same idea directly: it obtains local density from the k-nearest neighbours and looks for samples with substantially lower density than their neighbours."],
      claims: ["clustering-and-anomaly-detection-dbscan", "clustering-and-anomaly-detection-core", "clustering-and-anomaly-detection-noise", "clustering-and-anomaly-detection-lof"],
    }),
    step({
      id: "flag", label: "Flag", kind: "watch-out", title: "A flag is a score past a threshold",
      caption: "An isolation forest cuts the chart at random. Customer 811 is alone after two splits, so it scores as anomalous. Support reviews the flag before anything happens to the account.",
      show: ["groups", "out", "cuts", "t-score", "iforest", "support"], counters: ["none", "3", "2", "0 of 2"],
      rides: [ride("cut1", 0, 1, ""), ride("cut2", 0, 1, ""), ride("rail", "s-plot", "s-review", "811", { via: ["s-algo"], then: "811 flagged" })],
      body: ["An isolation forest isolates observations by randomly selecting a feature and then a split value between its minimum and maximum. The number of splits needed to isolate a sample is its path length, and the path length averaged over a forest of random trees is the measure of normality.",
        "Random partitioning produces noticeably shorter paths for anomalies. Over many random trees on this chart, customer 811 needs 3.0 splits on average and customer 734 needs 4.6, against 5.0 to 6.5 for the other 24.",
        "Outlier detection is also known as unsupervised anomaly detection. The predict method applies a threshold to the raw score and labels inliers 1 and outliers -1, and the contamination parameter controls that threshold. The share of customers flagged is therefore a setting.",
        { callout: { label: "Watch out", text: "The model says a customer is unusual. It does not say why. Customer 811 could be a trade buyer or a taken-over account, and only a review can tell." } }],
      claims: ["clustering-and-anomaly-detection-outlier", "clustering-and-anomaly-detection-isolation", "clustering-and-anomaly-detection-threshold", "clustering-and-anomaly-detection-meaningful"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Groups and flags rest on settings",
      caption: "",
      show: ["groups", "out", "proxy", "t-review", "iforest", "support-done"], counters: ["none", "3", "2", "2 of 2"],
      rides: [ride("rail", "s-plot", "s-review", "734", { via: ["s-algo"], then: "734 reviewed" })],
      body: [{ pair: {
        left: { label: "Groups", items: ["k for k-means and Gaussian mixtures", "eps and min_samples for DBSCAN"] },
        right: { label: "Flags", items: ["contamination sets the threshold", "A person reviews every flag"] },
      } },
        "The GDPR defines profiling as any form of automated processing of personal data that uses the data to evaluate certain personal aspects of a natural person. The European data protection authorities' guidelines state that profiling can create special category data by inference from data that is not special category data in its own right, and that correlations may indicate something about health, political convictions, religious beliefs or sexual orientation.",
        "The same guidelines state that profiling can perpetuate existing stereotypes and social segregation, and can lock a person into a specific category. A segment built on order behaviour is checked against such traits before it drives prices, offers or service.",
        "Article 22 of the GDPR gives a person the right not to be subject to a decision based solely on automated processing, including profiling, which produces legal effects concerning them or similarly significantly affects them. Where its contract and consent exceptions apply, the safeguards include at least the right to obtain human intervention, to express a point of view and to contest the decision."],
      claims: ["clustering-and-anomaly-detection-kmeans", "clustering-and-anomaly-detection-mixture", "clustering-and-anomaly-detection-core", "clustering-and-anomaly-detection-threshold", "clustering-and-anomaly-detection-profiling", "clustering-and-anomaly-detection-inference", "clustering-and-anomaly-detection-category", "clustering-and-anomaly-detection-automated"],
    }),
  ],
  governance: { text: "Segments built from behaviour can encode protected traits: profiling can create special category data by inference, and the GDPR recitals call for measures that prevent discriminatory effects. A flagged person is reviewed before any action, by someone with the authority and competence to change the outcome.", claims: ["clustering-and-anomaly-detection-inference", "clustering-and-anomaly-detection-discrimination", "clustering-and-anomaly-detection-meaningful", "clustering-and-anomaly-detection-automated"] },
  closing: {
    pitfalls: [
      "Reading clusters as ground truth when they follow from the chosen number of groups, distance and scaling.",
      "Using a method that assigns every example to a group when some examples belong to none.",
      "Acting on an anomaly flag as if it were a finding about the person.",
    ],
    questions: [
      "What are the two steps that k-means repeats?",
      "Which examples does DBSCAN label as noise?",
      "Why does an isolation forest need fewer splits to isolate an anomaly?",
    ],
  },
});
