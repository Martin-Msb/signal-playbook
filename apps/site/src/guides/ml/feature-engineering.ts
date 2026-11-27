import { CANVAS, defineGuide, drum, isoGrid, line, pawn, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Pt } from "@signal-path/engine";

// One rail runs from the training rows through four transformers to the returns model. The test rows join the same rail
// from the front. The board at the back shows three training rows and how their columns change at each stop.
// The card at the front lists what each transformer learned in fit, and from which rows it learned it.
const G = isoGrid(110, 118, 30);
const AT = { gate: 2.9, join: 4.1, pre: 5.2, impute: 6.5, encode: 9.2, scale: 11.7, mid: 12.4, combine: 14.6, fit: 16.9, out: 19.3, model: 22.5 };
const on = (gx: number): Pt => G.p(gx, 0);
const TEST: [number, number] = [AT.join, 5.2];
const BOARD: Pt = [728, 250], FIT: Pt = [262, 520];

const tf = (id: string, gx: number, glyph: string, title: string, sub: string, group: string): El =>
  prism(id, gx - 0.65, -0.65, 1.3, 1.3, 28, { hue: "track", glyph, title, sub, at: "n", group });

/** Three training rows on the board. One hue per source column, kept through every stop. */
const board = (id: string, title: string, cols: string[], at: number[], hues: (Hue | undefined)[], rows: string[][]): El =>
  raise(table(id, 0, 0, 420, cols, rows, { at, columnHues: hues, rowH: 36, title, sub: "3 of 800 training rows", mono: true, group: id }), BOARD, 30);

/** What fit stored, and the rows it was computed from. */
const fitted = (id: string, sub: string, rows: string[][], extra: Record<string, unknown> = {}): El =>
  raise(table(id, 0, 0, 286, ["step", "learned in fit"], rows, { at: [12, 92], rowH: 28, title: "Fitted values", sub, group: id, ...extra }), FIT, 30);

export default defineGuide({
  id: "feature-engineering", track: "ml", module: "Foundations", slug: "feature-engineering",
  title: "Feature engineering",
  summary: "Raw columns become model inputs by filling empty cells, encoding categories, scaling numbers and combining columns. Each of those steps learns its values from the training rows and applies them unchanged to every other row.",
  forLeads: "The work on columns often decides the result more than the model does. It is also where test data leaks into training and where a column can stand in for a protected attribute, so it needs review.",
  status: "draft", minutes: 7,
  counters: ["Feature columns", "Numeric columns", "Fit sees", "Test rows"],
  whatIf: { label: "What if the steps were fitted on all rows?", step: 4, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and values are illustrative",
    label: "A rail runs from 800 training rows through four steps, impute, encode, scale and combine, to a model that predicts returns. A board shows three orders: first with a text channel, an empty cell and a large amount, then with every cell a number, then scaled and with a combined column. A card lists the values each step learned from the training rows. Test rows join the rail and are transformed with those values. When the steps are fitted on all rows the card and the rail turn red. At the last stop a column review holds the postcode column before it enters.",
    els: [
      line("main", [on(1.1), on(AT.model - 0.8)], { always: true }),
      line("test-in", [G.p(AT.join, TEST[1] - 1.1), on(AT.join)], { always: true }),
      line("test-run", [G.p(AT.join, TEST[1] - 1.1), on(AT.join), on(AT.model - 0.8)], { group: "apply" }),
      line("leak", [G.p(AT.join, TEST[1] - 1.1), on(AT.join), on(AT.out)], { tone: "alert", group: "leak" }),
      stop("s-join", ...on(AT.join), undefined, undefined, { always: true }),
      stop("s-pre", ...on(AT.pre), undefined, undefined, { always: true }),
      stop("s-mid", ...on(AT.mid), undefined, undefined, { group: "anchor" }),
      stop("s-fit", ...on(AT.fit), undefined, undefined, { group: "apply" }),
      stop("s-out", ...on(AT.out), undefined, undefined, { always: true }),
      stop("s-gate", ...on(AT.gate), undefined, undefined, { group: "gate" }),

      drum("train", 0, 0, 1.05, 40, { hue: "sky", glyph: "table", title: "Training rows", sub: "800 orders", at: "n", always: true }),
      drum("test", ...TEST, 1.05, 40, { hue: "paper", glyph: "table", title: "Test rows", sub: "200 orders", at: "s", always: true }),

      tf("impute", AT.impute, "pen", "Impute", "median", "enc"),
      tf("encode", AT.encode, "split", "Encode", "one-hot", "enc"),
      tf("scale", AT.scale, "scale", "Scale", "z-score", "num"),
      tf("combine", AT.combine, "merge", "Combine", "amt×days", "num"),

      prism("model-q", AT.model - 0.75, -0.75, 1.5, 1.5, 34, { hue: "paper", glyph: "net", title: "Returns model", sub: "needs numbers", at: "e", state: "alert", group: "raw" }),
      prism("model", AT.model - 0.75, -0.75, 1.5, 1.5, 34, { hue: "paper", glyph: "net", title: "Returns model", sub: "predicts a return", at: "e", group: "ok" }),
      prism("model-x", AT.model - 0.75, -0.75, 1.5, 1.5, 34, { hue: "paper", glyph: "net", title: "Returns model", sub: "score too high", at: "e", state: "alert", group: "leak" }),

      board("t-raw", "Orders, raw columns", ["order", "channel", "amount", "days"], [14, 114, 224, 334], [undefined, "mint", "sand", "rose"],
        [["4471", "store", "12900", "NaN"], ["4470", "web", "349", "2"], ["4472", "app", "1290", "5"]]),
      board("t-num", "Orders, every cell a number", ["order", "web", "app", "store", "amount", "days"], [14, 88, 146, 204, 272, 356], [undefined, "mint", "mint", "mint", "sand", "rose"],
        [["4471", "0", "0", "1", "12900", "3"], ["4470", "1", "0", "0", "349", "2"], ["4472", "0", "1", "0", "1290", "5"]]),
      board("t-feat", "Orders, as features", ["order", "web", "app", "store", "amount", "days", "amt×days"], [14, 74, 114, 154, 204, 268, 334], [undefined, "mint", "mint", "mint", "sand", "rose", "violet"],
        [["4471", "0", "0", "1", "3.8", "-0.2", "-0.8"], ["4470", "1", "0", "0", "-0.4", "-0.7", "0.3"], ["4472", "0", "1", "0", "-0.1", "0.8", "-0.1"]]),

      pawn("team", 9.6, 9.4, "Data team", "text and NaN: no fit", { group: "raw" }),
      fitted("f-enc", "from the training rows", [["Impute", "median days = 3"], ["Encode", "web, app, store"]]),
      fitted("f-num", "from the training rows", [["Impute", "median days = 3"], ["Encode", "web, app, store"], ["Scale", "amount mean 1500"]]),
      fitted("f-train", "from 800 training rows only", [["Impute", "median days = 3"], ["Encode", "web, app, store"], ["Scale", "amount mean 1500"]], { tone: "track" }),
      fitted("f-leak", "from all 1000 rows", [{ cells: ["Impute", "median days = 4"], hot: true }, ["Encode", "web, app, store"], { cells: ["Scale", "amount mean 1560"], hot: true }], { tone: "alert" }),

      pill("pipe", [590, 452], "Pipeline", { sub: "fit on train, transform both", glyph: "layers", tone: "track", group: "pipe" }),
      pill("seen", [590, 452], "Fitted before the split", { sub: "test rows shape the values", glyph: "x", tone: "alert", group: "leak" }),

      prism("review", 1.6, -4.3, 1.2, 1.2, 24, { hue: "track", glyph: "shield", title: "Column review", sub: "holds a proxy", at: "e", group: "gate" }),
    ],
  },
  steps: [
    step({
      id: "raw", label: "Raw columns", kind: "problem", title: "A model cannot read raw columns",
      caption: "Order 4471 has a channel as text, an empty cell and an amount in the thousands. The returns model expects every value to be a number.",
      show: ["t-raw", "raw", "team"], counters: ["3", "1", "nothing", "held out"],
      rides: [ride("main", 0, "s-out", "4471", { via: ["s-pre"], then: "store, NaN", tone: "alert" })],
      body: ["Vinterhus wants a model that predicts whether an order is returned. The orders are already split: 800 for training and 200 held out for testing.",
        "Datasets with missing values, often encoded as blanks or NaNs, are incompatible with scikit-learn estimators, which assume that all values in an array are numerical and that all hold meaning. Discarding the incomplete rows or columns is the basic strategy, and it comes at the price of losing data that may be valuable.",
        { callout: { label: "Key idea", text: "Google's Machine Learning Crash Course calls feature engineering a vital part of machine learning. A feature vector can be thought of as the floating-point values that make up one example." } }],
      claims: ["feature-engineering-missing", "feature-engineering-vector"],
    }),
    step({
      id: "encode", label: "Encode", kind: "idea", title: "Encoding turns every cell into a number",
      caption: "The empty cell takes the median of the training rows. One-hot encoding gives each channel its own column of 0 and 1.",
      show: ["t-num", "enc", "ok", "f-enc"], counters: ["5", "5", "training rows", "held out"],
      rides: [ride("main", 0, "s-mid", "store, NaN", { via: ["s-pre"], then: "0 0 1, 3" })],
      body: ["Imputation infers a missing value from the known part of the data. scikit-learn's SimpleImputer fills with a constant or with the mean, median or most frequent value of the column, and add_indicator keeps a binary column that records which values were missing.",
        "Numbering the channels 0, 1 and 2 is not enough. Estimators that expect continuous input would read the codes as ordered, which is often not desired. OneHotEncoder turns a feature with n categories into n binary features, one of them 1 and all others 0.",
        "For a categorical feature with high cardinality, one-hot encoding inflates the feature space. TargetEncoder encodes each category with the target mean for that category instead."],
      claims: ["feature-engineering-imputer", "feature-engineering-ordinal", "feature-engineering-one-hot", "feature-engineering-target-encoder"],
    }),
    step({
      id: "scale", label: "Scale, combine", kind: "mechanism", title: "Scaling and combining reshape the columns",
      caption: "Amount and days move to one scale, and their product becomes a new column. Google's Rules of Machine Learning: most gains come from great features, not great machine learning algorithms.",
      show: ["t-feat", "enc", "num", "ok", "f-num"], counters: ["6", "6", "training rows", "held out"],
      rides: [ride("main", "s-pre", "s-out", "12900", { via: ["s-mid"], then: "3.8" })],
      body: ["A feature whose variance is orders of magnitude larger than the others might dominate the objective function and leave the estimator unable to learn from the other features. StandardScaler computes the mean and standard deviation on a training set so that the same transformation can be re-applied to the testing set. MinMaxScaler scales to a given range instead, often zero to one.",
        "Columns can also be combined. PolynomialFeatures adds high-order and interaction terms such as the product of two features, and a feature cross takes the Cartesian product of categorical or bucketed features. Like polynomial transforms, crosses let linear models handle nonlinearities.",
        "Feature selection goes the other way and removes columns. scikit-learn's VarianceThreshold drops features whose variance does not meet a threshold, and SelectKBest keeps only the k highest scoring features.",
        { callout: { label: "Key idea", text: "The Rules of Machine Learning state that most of the problems a practitioner will face are engineering problems, and that most of the gains come from great features, not great machine learning algorithms." } }],
      claims: ["feature-engineering-scale-why", "feature-engineering-scaler", "feature-engineering-combine", "feature-engineering-selection", "feature-engineering-gains"],
    }),
    step({
      id: "fit", label: "Fit on train", kind: "mechanism", title: "Every step is fitted on training rows only",
      caption: "The median, the categories, the mean and the standard deviation come from the 800 training rows. Test row 4502 is transformed with those values and adds nothing to them.",
      show: ["t-feat", "enc", "num", "ok", "f-train", "apply", "pipe"], counters: ["6", "6", "training rows", "transform only"],
      rides: [ride("main", 0, "s-fit", "4471", { via: ["s-pre"], then: "fit" }), ride("test-run", 0, "s-out", "4502", { via: ["s-join"], then: "transform" })],
      body: ["Train and test subsets receive the same preprocessing, and the transformations are learnt from the training data only. If a normalisation step divides by an average, it is the average of the train subset, not of all the data. scikit-learn's rule is to split first, call fit_transform on the train subset and transform on the test subset.",
        "A Pipeline chains the transformers and the model, so one fit call trains the whole sequence. It helps avoid leaking statistics from test data into the trained model in cross-validation, because the same samples train the transformers and the predictor. ColumnTransformer applies different transformations to different columns inside such a pipeline.",
        "The same holds after release. Transforms used in training must also be used on later data, whether test data or data in a production system. Otherwise the feature space changes and the model cannot perform effectively.",],
      claims: ["feature-engineering-train-only", "feature-engineering-pipeline", "feature-engineering-same-transform", "feature-engineering-normalise-serve"],
    }),
    step({
      id: "leak", label: "Leakage", kind: "watch-out", title: "Fitting on all rows leaks the test set",
      caption: "Statistics computed before the split carry test information into training. The test score turns overly optimistic, and the model does worse on new data.",
      show: ["t-feat", "enc", "num", "leak", "f-leak"], counters: ["6", "6", "all rows", "leaked into fit"],
      rides: [ride("leak", 0, 1, "test rows", { via: ["s-join"], then: "in the fit", tone: "alert" })],
      body: ["Data leakage occurs when information that would not be available at prediction time is used when building the model. The result is an overly optimistic performance estimate and poorer performance on novel data.",
        "scikit-learn shows it with feature selection on random targets, where the expected accuracy is about 0.5. Selecting features on all the data before the split gives an accuracy of 0.76. Selecting on the train subset only gives 0.5.",
        "The same risk applies to almost all transformations, including StandardScaler and SimpleImputer."],
      claims: ["feature-engineering-leakage", "feature-engineering-selection-leak"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Two checks on every feature",
      caption: "",
      show: ["t-feat", "enc", "num", "ok", "f-train", "apply", "pipe", "gate"], counters: ["6", "6", "training rows", "transform only"],
      rides: [ride("main", 0, "s-gate", "postcode")],
      body: [{ pair: {
        left: { label: "How it is fitted", items: ["Split first", "Fit on training rows", "One pipeline for all rows"] },
        right: { label: "What it carries", items: ["Known at prediction time", "No proxy for a protected attribute"] },
      } },
        "A postcode column is proposed as a new feature. Leaving protected attributes out of a model does not remedy bias, because the information can be inferred through proxy or latent variables. NIST gives the example that race can be inferred through zip code.",
        "NIST names a mitigation tactic for proxy discrimination: minimise the number of input variables, ensure there is no strong correlation among them, and require a logical relationship to the prediction target.",
        "For high-risk AI systems, Article 10 of the EU AI Act makes training, validation and testing data sets subject to data governance practices. These cover data-preparation operations and an examination for possible biases that are likely to lead to discrimination prohibited under Union law, with measures to detect, prevent and mitigate them."],
      claims: ["feature-engineering-proxy", "feature-engineering-proxy-mitigation", "feature-engineering-data-governance", "feature-engineering-train-only", "feature-engineering-leakage"],
    }),
  ],
  governance: { text: "Leakage is prevented by splitting first and fitting every preprocessing step on the training data only. Dropping a protected attribute does not remove it: NIST notes that it can be inferred through proxy variables, such as race through zip code, so each feature is reviewed before it enters the model.", claims: ["feature-engineering-train-only", "feature-engineering-proxy"] },
  closing: {
    pitfalls: [
      "Scaling, imputing or selecting features on the full dataset before the split.",
      "Transforming training data one way and production data another.",
      "Removing a protected attribute and keeping a column that predicts it.",
    ],
    questions: [
      "Which values does each preprocessing step learn, and from which rows?",
      "Why does a test score rise when a scaler is fitted on all the data?",
      "Which columns could stand in for a protected attribute?",
    ],
  },
});
