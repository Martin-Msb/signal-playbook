import { CANVAS, band, defineGuide, isoGrid, line, note, plot, plotPoint, prism, raise, ride, rule, series, shade, step, stop, table } from "@signal-path/engine";
import type { El, PlotEl } from "@signal-path/engine";

// Two boards stand on the floor. The left one is the lens: the raw rows, then a histogram, a box plot, bars by channel and a scatter plot.
// The right one is the profile of the dataset, which fills one finding at a time. The model waits in front until the profile is complete.
const G = isoGrid(480, 240, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);

/** Orders per 50 of amount, from 0 to 600. Twelve more rows hold the placeholder 9,999. */
const BINS = [588, 1180, 1010, 720, 480, 330, 230, 160, 110, 80, 60, 40];
const TOPS = BINS.map((n, i) => [25 + i * 50, n] as [number, number]);
/** Quartiles of the amount column and the fences they give. */
const Q1 = 78, MEDIAN = 136, MEAN = 190, Q3 = 226, INNER = Q3 + 1.5 * (Q3 - Q1), OUTER = Q3 + 3 * (Q3 - Q1), FAR = 720, BOX = 1400;

/** Items in the order and parcel weight in kilograms. */
const PAIRS: [number, number][] = [[1, 2.1], [1, 3.4], [2, 4.2], [2, 6.0], [3, 7.1], [3, 9.4], [4, 9.0], [4, 12.2], [5, 12.8], [5, 15.5], [6, 14.1], [6, 18.3], [7, 19.6], [7, 17.2], [8, 22.4], [8, 20.1]];
const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
const MX = mean(PAIRS.map((p) => p[0])), MY = mean(PAIRS.map((p) => p[1]));
const SXY = PAIRS.reduce((s, [x, y]) => s + (x - MX) * (y - MY), 0), SXX = PAIRS.reduce((s, [x]) => s + (x - MX) ** 2, 0), SYY = PAIRS.reduce((s, [, y]) => s + (y - MY) ** 2, 0);
/** Pearson correlation and least-squares line of the points drawn. */
const R = (SXY / Math.sqrt(SXX * SYY)).toFixed(2), SLOPE = SXY / SXX, fit = (x: number) => MY + SLOPE * (x - MX);

const board = <T extends PlotEl>(p: T) => raise(p, F1, 30);
const HIST = board(plot("hist", 0, 0, 430, 280, [0, 800], [0, 1600], { title: "Order amount", xt: [0, 150, 300, 450, 600], yt: [0, 400, 800, 1200], xLabel: "amount", yLabel: "orders", group: "hist" }));
const MISS = board(plot("miss", 0, 0, 430, 280, [0.4, 3.6], [0, 100], { title: "Rating missing, by channel", xt: [1, 2, 3], xtl: ["web", "app", "store"], yt: [0, 50, 100], yLabel: "% of rows blank", group: "miss" }));
const SCAT = board(plot("scat", 0, 0, 430, 280, [0, 9], [0, 25], { title: "Items and parcel weight", xt: [0, 3, 6, 9], yt: [0, 10, 20], xLabel: "items", yLabel: "weight, kg", group: "scat" }));

const raw = (id: string, flagged: boolean): El => raise(table(id, 0, 0, 430, ["order", "channel", "amount", "rating", "returned"], [
  ["4468", "web", "129", "4", "no"],
  { cells: ["4469", "store", "9999", "NaN", "yes"], hot: flagged },
  ["4470", "app", "64", "5", "no"],
  { cells: ["4471", "store", "212", "NaN", "no"], hue: flagged ? "sand" : undefined },
  ["4472", "web", "88", "3", "yes"],
], { at: [16, 96, 186, 268, 340], rowH: 36, title: "Orders, 5,000 rows", mono: true, group: id }), F1, 30);

const FOUND: [string, string][] = [
  ["summary statistics", "mean 190, max 9,999"],
  ["histogram", "long right tail"],
  ["outliers", "12 rows at 9,999"],
  ["missing values", "rating, 1,090 rows"],
  ["correlation", `items, weight ${R}`],
];
/** The profile with the first n findings filled. `fresh` rows are the ones found at this stop. */
const profile = (id: string, n: number, fresh: number): El => raise(table(id, 0, 0, 400, ["check", "finding"],
  FOUND.map(([check, finding], i) => (i < n ? { cells: [check, finding], hot: i >= n - fresh } : { cells: [check, "not checked"], mute: true })),
  { at: [16, 186], rowH: 40, title: "Profile of the orders", group: id }), F2, 30);

const mark = (id: string, p: PlotEl, x: number, y: number): El => stop(id, ...plotPoint(p, x, y), undefined, undefined, { group: "anchor" });
const model = (id: string, sub: string): El => prism(id, 7.1, 7.1, 1.4, 1.4, 30, { hue: id === "waiting" ? "paper" : "track", glyph: "model", title: "Return model", sub, at: "n", group: id === "waiting" ? "wait" : id });

export default defineGuide({
  id: "exploring-data", track: "ml", module: "Foundations", slug: "exploring-data",
  title: "Exploring data",
  summary: "Distributions, missing values, outliers and correlations are examined before any model is fitted. Summary statistics, histograms and scatter plots turn a table of rows into a profile of what a model can learn from it.",
  forLeads: "Exploration is where data problems are cheapest to find. It is also where the team sees which customers are missing or under-represented, before that becomes a biased model.",
  status: "draft", minutes: 7,
  counters: ["Checks done", "Extreme outliers", "Missing ratings", "Correlation"],
  whatIf: { label: "What if the data were never explored?", step: 0, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders are illustrative",
    label: "Two boards. The left one starts as a table of 5,000 orders and becomes, in turn, a histogram of order amount, the same histogram with a box plot and fences, bars of missing ratings by channel, and a scatter plot of items against parcel weight. The right one is a profile with five checks that fill one finding at a time. A return model stands in front and receives the rows only once the profile is complete.",
    els: [
      raw("raw", false), raw("raw2", true),

      HIST,
      series("bars", "hist", "bars", TOPS, { hue: "sky", group: "hist" }),
      series("shape", "hist", "line", TOPS, { tone: "ink", w: 3, group: "shape" }),
      mark("at-median", HIST, MEDIAN, 946), mark("at-mean", HIST, MEAN, 648),

      shade("box", "hist", [Q1, BOX - 90, Q3, BOX + 90], { group: "box" }),
      series("box-median", "hist", "line", [[MEDIAN, BOX - 90], [MEDIAN, BOX + 90]], { w: 4, group: "box" }),
      series("reach", "hist", "line", [[Q3, BOX], [FAR, BOX]], { tone: "ink", w: 3, group: "box" }),
      rule("inner", "hist", INNER, { tone: "muted", label: "inner fence", group: "box" }),
      rule("outer", "hist", OUTER, { tone: "alert", group: "box" }),
      note("outer-n", plotPoint(HIST, OUTER, 0)[0] - 7, plotPoint(HIST, 0, 1000)[1], "outer fence", { anchor: "end", strong: true, size: 12, tone: "alert", on: "hist", group: "box" }),
      band("beyond", "hist", OUTER, 800, { tone: "alert", group: "box" }),
      series("extreme", "hist", "points", [[FAR, BOX]], { tone: "alert", r: 6, hot: [0], group: "box" }),
      mark("at-q3", HIST, Q3, BOX), mark("at-inner", HIST, INNER, BOX), mark("at-outer", HIST, OUTER, BOX), mark("at-far", HIST, FAR, BOX),

      MISS,
      series("blank", "miss", "bars", [[1, 4], [2, 6], [3, 90]], { hues: ["sky", "sky", "sand"], group: "miss" }),
      ...([[1, 4], [2, 6], [3, 90]] as [number, number][]).map(([x, y], i) => note(`blank-${i}`, plotPoint(MISS, x, 0)[0], plotPoint(MISS, 0, y)[1] - 9, `${y}%`, { anchor: "middle", strong: true, mono: true, on: "miss", group: "miss" })),

      SCAT,
      series("pairs", "scat", "points", PAIRS, { hue: "sky", group: "scat" }),
      series("trend", "scat", "line", [[0.5, fit(0.5)], [8.5, fit(8.5)]], { w: 4, group: "scat" }),

      profile("p0", 0, 0), profile("p2", 2, 2), profile("p3", 3, 1), profile("p4", 4, 1), profile("p5", 5, 1), profile("p6", 5, 0),

      line("to-model", [F1, G.p(7.1, 7.8)], { group: "feed" }),
      line("from-profile", [F2, G.p(7.8, 7.1)], { group: "inform" }),
      line("to-model-plan", [F1, G.p(7.1, 7.8)], { state: "planned", group: "wait" }),
      line("from-profile-plan", [F2, G.p(7.8, 7.1)], { state: "planned", group: "wait" }),
      model("blind", "fitted unseen"), model("waiting", "waits for profile"), model("ready", "after the profile"),
    ],
  },
  steps: [
    step({
      id: "unseen", label: "Unseen", kind: "problem", title: "A model is fitted to data nobody examined",
      caption: "Vinterhus wants to predict returns from 5,000 orders. The rows go straight into a model. Nothing is known about their distributions, gaps or extreme values.",
      show: ["raw", "p0", "feed", "blind"], counters: ["0 of 5", "unknown", "unknown", "unknown"],
      rides: [ride("to-model", 0.12, 0.6, "5,000 rows")],
      body: ["Each row is one order with its features and a label, returned or not. A table this long cannot be read row by row, so its problems stay hidden until the model shows them.",
        "Outliers often cause problems in model training, so finding them is important. Graphs can help find anomalies or patterns hiding in the data, which is why the data is looked at graphically before analysis goes far.",
        { callout: { label: "Key idea", text: "Exploratory data analysis employs a variety of techniques, most of them graphical, to maximise insight into a data set, uncover its structure and detect outliers and anomalies." } }],
      claims: ["exploring-data-look-first", "exploring-data-eda"],
    }),
    step({
      id: "shape", label: "Distribution", kind: "idea", title: "Summary statistics and a histogram show a distribution",
      caption: "Mean, median and maximum summarise the amount column. The histogram shows its shape: most orders are small, with a long tail to the right. The maximum is 9,999.",
      show: ["hist", "shape", "p2", "wait"], counters: ["2 of 5", "unknown", "unknown", "unknown"],
      rides: [ride("shape", "at-median", "at-mean", "median 136", { then: "mean 190" })],
      body: ["A histogram graphically summarises the distribution of one column: its centre, its spread, its skewness, the presence of outliers and the presence of more than one mode.",
        "In pandas, `describe` summarises the central tendency, dispersion and shape of each column, excluding NaN values. For numeric columns it returns count, mean, std, min, max and percentiles, and the 50th percentile is the median.",
        "Summary statistics are not wrong, but they are incomplete. They reduce the data to a few numbers and filter out the rest, so data sets with the same statistics can look entirely different when plotted."],
      claims: ["exploring-data-histogram", "exploring-data-describe", "exploring-data-incomplete"],
    }),
    step({
      id: "outliers", label: "Outliers", kind: "mechanism", title: "Outliers lie far from the rest",
      caption: "Fences at 1.5 and 3 times the interquartile range beyond the quartiles mark mild and extreme outliers. Twelve rows hold 9,999, far beyond the outer fence.",
      show: ["hist", "box", "p3", "wait"], counters: ["3 of 5", "12", "unknown", "unknown"],
      rides: [ride("reach", "at-q3", "at-far", "Q3 226", { via: ["at-inner", "at-outer"], then: "12 × 9,999", tone: "alert" })],
      body: ["An outlier is an observation that lies an abnormal distance from the other values. The box plot draws a box from the lower quartile, 78, to the upper quartile, 226. The interquartile range is 148.",
        "The upper inner fence is the upper quartile plus 1.5 times that range, here 448. The upper outer fence is the upper quartile plus 3 times that range, here 670. A point beyond an inner fence is a mild outlier and a point beyond an outer fence is an extreme outlier.",
        "The amount axis is cut after 600 so that 9,999 fits on the board. Many real orders lie between the two fences: the tail of a skewed column is not an error.",
        "Outliers should be investigated carefully. They often carry valuable information about the process or about how the data was gathered and recorded, and they are often bad data points."],
      claims: ["exploring-data-outlier", "exploring-data-fences", "exploring-data-investigate"],
    }),
    step({
      id: "missing", label: "Missing values", kind: "watch-out", title: "Missing values follow a pattern",
      caption: "The rating is blank in 1,090 rows. Split by channel, 90% of store orders have no rating. Discarding those rows would discard most of what the data says about store customers.",
      show: ["miss", "p4", "wait"], counters: ["4 of 5", "12", "1,090", "unknown"],
      body: ["Many real datasets contain missing values, often encoded as blanks, NaNs or other placeholders. Discarding the rows or columns that contain them comes at the price of losing data which may be valuable.",
        "A feature that is missing for a large number of examples could indicate that certain key characteristics of the dataset are under-represented. Data gaps should be reviewed thoroughly, not assumed to be random.",
        { callout: { label: "Governance", text: "Skew in the data, where certain groups are under-represented or over-represented relative to their real-world prevalence, can introduce bias into the model." } }],
      claims: ["exploring-data-missing", "exploring-data-gaps", "exploring-data-skew"],
    }),
    step({
      id: "related", label: "Correlation", kind: "mechanism", title: "A scatter plot and a correlation show how two columns move together",
      caption: `Items and parcel weight rise together, with a Pearson correlation of ${R}. The plot shows an association. It does not show a cause.`,
      show: ["scat", "p5", "wait"], counters: ["5 of 5", "12", "1,090", R],
      rides: [ride("trend", 0, 1, "items, weight", { then: `r = ${R}` })],
      body: ["A scatter plot answers whether two variables are related, whether the relationship is linear or non-linear, whether the variation in one changes with the other, and whether there are outliers.",
        "In pandas, `corr` computes the pairwise correlation of columns, excluding missing values. Pearson, the standard correlation coefficient, is the default. Kendall and Spearman rank correlations are also supported.",
        "Association does not imply causality. A scatter plot can never prove cause and effect."],
      claims: ["exploring-data-scatter", "exploring-data-corr", "exploring-data-causality"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Each finding is a decision to make before fitting",
      caption: "",
      show: ["raw2", "p6", "feed", "inform", "ready"], counters: ["5 of 5", "12", "1,090", R],
      rides: [ride("from-profile", 0.12, 0.5, "profile"), ride("to-model", 0.12, 0.5, "5,000 rows")],
      body: [{ pair: {
        left: { label: "Outliers", items: ["Understand why they appeared", "Then keep or eliminate"] },
        right: { label: "Missing values", items: ["Discard rows and lose data", "Or impute and mark them"] },
      } },
        "Before considering the elimination of outliers, one should try to understand why they appeared and whether similar values are likely to continue to appear.",
        "Imputation infers missing values from the known part of the data. In scikit-learn, `MissingIndicator` produces a binary matrix that indicates where values were missing.",
        "Data profiling tools automate this pass. ydata-profiling generates a report of statistics and visualisations for a dataset and helps identify missing data, duplicate entries and outliers."],
      claims: ["exploring-data-investigate", "exploring-data-missing", "exploring-data-impute", "exploring-data-profiling"],
    }),
  ],
  governance: { text: "Exploration is where the team finds who is missing from the data. A feature that is blank for many examples, or a group that is rarer in the data than in the real world, can introduce bias into the model.", claims: ["exploring-data-gaps", "exploring-data-skew"] },
  closing: {
    pitfalls: [
      "Trusting the mean of a column without looking at its histogram.",
      "Deleting outliers or rows with missing values before asking why they are there.",
      "Reading a strong correlation as proof that one column causes the other.",
    ],
    questions: [
      "What does a histogram show that summary statistics leave out?",
      "Which values count as mild and as extreme outliers under the fence rule?",
      "Who is missing from the data when one column is blank for most rows of one channel?",
    ],
  },
});
