import { blocks, CANVAS, defineGuide, drum, isoGrid, line, list, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Pt, Row } from "@signal-path/engine";

// The floor: one rail from the Orders store, around the dataset, to Training.
// The dataset lies inside the bend: one line of blocks per column of the table, five past orders deep.
// The story is the role of each column. All grey at first, then one column becomes the label, the others become
// features, and columns leave the feature set: one because it leaks the label, one because the law keeps it out.
// A card at the back shows one example, order 4470, with the role of each of its values.
const G = isoGrid(585, 135, 30);
const SIZE = 1.2, FP = 2.05, RP = 1.45, H = 20, N = 5;
const R = 5 * FP + SIZE + 3, C = (N - 1) * RP + SIZE + 3;
const S = { start: -2.55, ord: -1.3, mid: 1.2, gate: 6.2, train: 3.2, end: 0.53 };
const up = (gx: number, gy: number, dy: number): Pt => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];

type Role = "raw" | "feat" | "label" | "leak" | "ban" | "out" | "proxy";
const FIELDS = ["channel", "amount", "postcode", "health_note", "refund_id", "returned"] as const;
const VALUES = ["web", "349", "114 55", "allergy", "R-0912", "yes"];
/** The role of each column at each stop, in column order. */
const ROLES: Role[][] = [
  ["raw", "raw", "raw", "raw", "raw", "raw"],
  ["raw", "raw", "raw", "raw", "raw", "label"],
  ["feat", "feat", "feat", "feat", "feat", "label"],
  ["feat", "feat", "feat", "feat", "leak", "label"],
  ["feat", "feat", "proxy", "ban", "out", "label"],
  ["feat", "feat", "proxy", "out", "out", "label"],
];
const LOOK: Record<Role, { hue?: "paper" | "sky" | "track" | "sand"; state?: "closed" | "alert" }> = {
  raw: { hue: "paper" }, feat: { hue: "sky" }, label: { hue: "track" }, leak: { state: "alert" }, ban: { state: "alert" }, out: { state: "closed" }, proxy: { hue: "sand" },
};
const PLATE: Record<Role, { glyph?: string; tone?: "alert" | "muted" }> = {
  raw: {}, feat: {}, label: { glyph: "flag" }, leak: { glyph: "clock", tone: "alert" }, ban: { glyph: "lock", tone: "alert" }, out: { glyph: "x", tone: "muted" }, proxy: { glyph: "search" },
};
const grp = (f: number, role: Role) => `${FIELDS[f]}-${role}`;
/** One column of the table in one role: five blocks and its name plate. Each role of a column is its own group at the same place. */
const column = (f: number, role: Role): El[] => [
  ...Array.from({ length: N }, (_, k) => blocks(`b-${grp(f, role)}-${k}`, k * RP, f * FP, 1, SIZE, [{ h: H, ...LOOK[role] }], { group: grp(f, role) })),
  pill(`n-${grp(f, role)}`, up(-1.1, f * FP + SIZE / 2, 15), FIELDS[f], { anchor: "end", mono: true, group: grp(f, role), ...PLATE[role] }),
];
const columns = (): El[] => FIELDS.flatMap((_, f) => [...new Set(ROLES.map((r) => r[f]))].flatMap((role) => column(f, role)));
const shown = (i: number): string[] => ROLES[i].map((role, f) => grp(f, role));

const CARD: Pt = [146, 228], SHEET: Pt = [824, 200];
const WORD: Record<Role, string> = { raw: "?", feat: "feature", label: "label", leak: "leaks label", ban: "health data", out: "left out", proxy: "proxy?" };
/** Order 4470 as one example: each value with the role its column has at this stop. */
const example = (i: number, sub: string, hot: number[]): El => {
  const rows: Row[] = FIELDS.map((f, k) => {
    const role = ROLES[i][k];
    return { cells: [f, VALUES[k], WORD[role]], hot: hot.includes(k), strike: role === "out", mute: role === "out" || (role === "raw" && i > 0) };
  });
  return raise(table(`ex${i}`, 0, 0, 268, ["column", "value", "role"], rows, { at: [12, 112, 172], rowH: 22, title: "Order 4470", sub, mono: true, group: `ex${i}` }), CARD, 30);
};

export default defineGuide({
  id: "features-labels-and-datasets", track: "ml", module: "Foundations", slug: "features-labels-and-datasets",
  title: "Features, labels and datasets",
  summary: "A learning problem is a table of examples. One column is the label, the value the model must predict. The other columns are features only if they are known at prediction time and may lawfully be used.",
  forLeads: "Choosing the label and the feature columns is a business and legal decision made before any model is trained. A datasheet records that decision, including the columns left out and why.",
  status: "draft", minutes: 6,
  counters: ["Label", "Features", "Columns left out", "Documentation"],
  whatIf: { label: "What if every column stayed a feature?", step: 2, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, columns and values are illustrative",
    label: "A rail runs from the Orders store around a dataset to Training. The dataset is drawn as blocks: six columns of five past orders. A card shows order 4470 with the role of each value. At first every column is grey. Then the returned column takes the track colour as the label, and the other five turn blue as features. The refund_id column turns red because it exists only after a return, and is struck out. The health_note column turns red as health data and is struck out, and postcode is marked as a possible proxy. At the last stop two features, one proxy under review and the label reach Training, and a datasheet card records the choices.",
    els: [
      line("rail", [G.p(S.start, R), G.p(C, R), G.p(C, S.end)], { always: true }),
      stop("s-ord", ...G.p(S.ord, R), undefined, undefined, { always: true }),
      stop("s-mid", ...G.p(S.mid, R), undefined, undefined, { always: true }),
      stop("s-train", ...G.p(C, S.train), undefined, undefined, { always: true }),
      drum("orders", S.start - 0.9, R, 0.8, 26, { hue: "track", glyph: "table", title: "Orders", sub: "past orders", at: "s", always: true }),
      prism("train-q", C - 0.7, S.end - 1.4, 1.4, 1.4, 30, { glyph: "net", title: "Training", sub: "predict what?", at: "s", group: "ask" }),
      prism("train", C - 0.7, S.end - 1.4, 1.4, 1.4, 30, { hue: "track", glyph: "net", title: "Training", sub: "y = returned", at: "s", group: "fit" }),

      // the dataset: six columns, each drawn once per role it takes
      ...columns(),

      // one example, with the role of each value at each stop
      example(0, "one row, no roles", []),
      example(1, "one example", [5]),
      example(2, "5 features, 1 label", [0, 1, 2, 3, 4]),
      example(3, "known too late", [4]),
      example(4, "may it be used?", [2, 3]),
      example(5, "as documented", [5]),

      // 5 and 6. the review every column passes before it becomes a feature
      stop("s-gate", ...G.p(C, S.gate), undefined, undefined, { group: "gate" }),
      prism("review", C + 2.3, S.gate, 1.2, 1.2, 24, { hue: "sand", glyph: "scale", title: "Column review", sub: "law and proxies", at: "s", group: "gate" }),

      // 6. the documentation that travels with the dataset
      raise(list("sheet", 0, 0, 236, ["Row: one past order", "Label: returned", "Left out: 2 columns", "Proxy check: postcode"], { title: "Datasheet", sub: "kept with the dataset", group: "sheet" }), SHEET, 30),
    ],
  },
  steps: [
    step({
      id: "table", label: "Raw table", kind: "problem", title: "A table of orders is not yet a learning problem",
      caption: "Vinterhus wants to predict returns. The orders table has six columns, and nothing says which one to predict or which ones the model may use.",
      show: [...shown(0), "ex0", "ask"], counters: ["none", "none", "0", "none"],
      rides: [ride("rail", "s-ord", "s-train", "order 4470", { via: ["s-mid"], then: "y = ?" })],
      body: ["A dataset is a collection of raw data, commonly organised as a spreadsheet or a file of comma-separated values. The row of a dataset is typically the raw source for an example, and an example typically consists of a subset of the columns.",
        "Which subset, and which column holds the answer, is a decision. The table does not make it."],
      claims: ["features-labels-and-datasets-row"],
    }),
    step({
      id: "label", label: "Label", kind: "idea", title: "The label is the value the model must predict",
      caption: "Each row is one example: one past order. The returned column holds the answer for that order, so it becomes the label, also called the target.",
      show: [...shown(1), "ex1", "fit"], counters: ["returned", "none", "0", "none"],
      rides: [ride("rail", "s-ord", "s-mid", "order 4470", { then: "returned: yes" })],
      body: ["In supervised machine learning the label is the answer or result portion of an example. scikit-learn calls it the target, and lists dependent variable, outcome variable, response variable and ground truth as other names.",
        "Target definition is the work of saying exactly what the column means. Here Vinterhus counts an order as returned when it comes back within 30 days of delivery. A different window gives a different label and a different model.",
        { callout: { label: "Proxy labels", text: "When the wanted answer is not in the dataset, teams approximate it with data that is. Such proxy labels are only as good as their link to the real answer." } }],
      claims: ["features-labels-and-datasets-label", "features-labels-and-datasets-example", "features-labels-and-datasets-proxy-label"],
    }),
    step({
      id: "features", label: "Features", kind: "idea", title: "Features are the columns the model may use",
      caption: "The other five columns are candidate features: the inputs. One example is now a row of features and one label.",
      show: [...shown(2), "ex2", "fit"], counters: ["returned", "5 candidates", "0", "none"],
      rides: [ride("rail", "s-ord", "s-train", "5 features", { via: ["s-mid"], then: "+ 1 label" })],
      body: ["A feature is an input variable to a machine learning model. In a data matrix, features are the columns. Other fields call them attributes, predictors, regressors or independent variables.",
        "A tabular dataset in scikit-learn is the pair X and y. The samples matrix X typically has the size (n_samples, n_features), with samples as rows and features as columns. The target values y are usually a one-dimensional array in which the i-th entry is the target of the i-th row of X.",
        { callout: { label: "Key idea", text: "A labelled example consists of one or more features and a label. Labelled examples are what a model trains on." } }],
      claims: ["features-labels-and-datasets-feature", "features-labels-and-datasets-example", "features-labels-and-datasets-xy"],
    }),
    step({
      id: "leak", label: "Leakage", kind: "watch-out", title: "A feature must be known at prediction time",
      caption: "The refund_id column is filled only after a return, so it stands in for the label. A model built on it scores too well and performs worse on new orders.",
      show: [...shown(3), "ex3", "fit"], counters: ["returned", "4 candidates", "1", "none"],
      rides: [ride("rail", "s-ord", "s-mid", "refund_id", { tone: "alert", then: "after the fact" })],
      body: ["Data leakage occurs when information that would not be available at prediction time is used when building the model. The result is overly optimistic performance estimates, and poorer performance when the model meets novel data.",
        "Label leakage is the form shown here: a model design flaw in which a feature is a proxy for the label.",
        { callout: { label: "The test", text: "For each column, ask whether its value exists at the moment the prediction is made. A new order has no refund yet." } }],
      claims: ["features-labels-and-datasets-leakage"],
    }),
    step({
      id: "lawful", label: "Lawful use", kind: "watch-out", title: "Some attributes may not be used, and proxies stand in for them",
      caption: "The GDPR prohibits processing health data unless an exception applies, so health_note is left out. A postal code can stand in for income, race or ethnicity.",
      show: [...shown(4), "ex4", "fit", "gate"], counters: ["returned", "2, and 1 proxy", "2", "none"],
      rides: [ride("rail", "s-ord", "s-mid", "health_note", { tone: "alert", then: "no exception" }), ride("rail", "s-ord", "s-gate", "postcode", { via: ["s-mid"], then: "proxy?" })],
      body: ["Article 9 of the GDPR prohibits processing personal data revealing racial or ethnic origin, political opinions, religious or philosophical beliefs or trade union membership, and processing genetic data, biometric data used to identify a person, data concerning health, and data concerning sex life or sexual orientation. The same article lists the exceptions, such as explicit consent. In this scenario Vinterhus has none for health_note.",
        "A sensitive attribute is a human attribute that may be given special consideration for legal, ethical, social or personal reasons. A proxy is an attribute used as a stand-in for one, so removing the sensitive column does not remove what it carried.",
        "The EU Artificial Intelligence Act requires the data sets of high-risk systems to be examined for possible biases that are likely to lead to discrimination prohibited under Union law. Since the amendment of July 2026, its Article 4a lets special categories of personal data be processed exceptionally, where strictly necessary to detect and correct bias, and requires the data to be deleted once the bias is corrected or the retention period ends.",
        "As of 27 November 2026, EUR-Lex lists corrigenda and no amending act for the GDPR."],
      claims: ["features-labels-and-datasets-special", "features-labels-and-datasets-proxy", "features-labels-and-datasets-ai-act-data", "features-labels-and-datasets-ai-act-bias"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "The learning problem is the table, its roles and its datasheet",
      caption: "",
      show: [...shown(5), "ex5", "fit", "gate", "sheet"], counters: ["returned", "2, and 1 proxy", "2", "datasheet"],
      rides: [ride("rail", "s-ord", "s-train", "3 columns", { via: ["s-gate"], then: "+ 1 label" })],
      body: [{ pair: {
        left: { label: "Columns the model may use", items: ["Known at prediction time", "Lawful, with proxies examined"] },
        right: { label: "Value it must predict", items: ["One label column", "Its definition in the datasheet"] },
      } },
        "Dataset documentation makes these choices visible to the next team. Datasheets for Datasets proposes that every dataset be accompanied with a datasheet that documents its motivation, composition, collection process and recommended uses. Its questions ask what the instances represent, whether there is a label or target for each instance, whether the dataset identifies subpopulations such as age or gender, whether it contains sensitive data, and which tasks it should not be used for.",
        "On the Hugging Face Hub the same role is played by the dataset card, the README.md file of a dataset repository, which should include information about potential biases.",
        "For high-risk AI systems in the European Union the record is an obligation: data governance must cover labelling, the assumptions about what the data are supposed to measure and represent, and the examination for bias."],
      claims: ["features-labels-and-datasets-example", "features-labels-and-datasets-datasheet", "features-labels-and-datasets-card", "features-labels-and-datasets-ai-act-data"],
    }),
  ],
  governance: { text: "Whether a column may be a feature is a legal question before it is a modelling one: the GDPR prohibits processing special categories such as health data unless an exception applies. Leaving the column out does not settle it, because another attribute such as a postal code can stand in for a sensitive one, and the EU Artificial Intelligence Act requires high-risk training data to be examined for such bias.", claims: ["features-labels-and-datasets-special", "features-labels-and-datasets-proxy", "features-labels-and-datasets-ai-act-data"] },
  closing: {
    pitfalls: [
      "Keeping a column that is filled in after the outcome, which makes the model look accurate in testing and weaker in use.",
      "Dropping a sensitive column and assuming the matter is closed, while a postal code or another proxy still carries it.",
      "Leaving the label undefined, so two teams train on the same column name with two different meanings.",
    ],
    questions: [
      "Which column of this table is the label, and what exactly does a yes in it mean?",
      "Is every feature column known at the moment the prediction is made?",
      "Which columns were left out, on what legal ground, and where is that written down?",
    ],
  },
});
