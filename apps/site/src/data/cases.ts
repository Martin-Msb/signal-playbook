import type { Guide, TrackKey } from "@signal-path/engine";
import { concept, concepts, slugOf } from "./curriculum.ts";
import type { Concept } from "./curriculum.ts";

/**
 * The use cases: business problems at Vinterhus, each worked from the problem through the architecture to the execution.
 * A use case teaches no new concept. It puts concepts of the curriculum to work, and names every one it uses.
 * Row: title, lead track, the problem, the architecture, the execution, governance and security, concepts used (titles, ";" separated).
 */
type Row = [title: string, lead: TrackKey, problem: string, architecture: string, execution: string, governance: string, uses: string];

const ROWS: Row[] = [
  ["Daily revenue that Finance can close on", "data",
    "Web, app and store systems each report a different revenue figure for the same day, so Finance reconciles by hand and closes the month late.",
    "Orders are captured from the order database and the store files, landed unchanged, cleaned and conformed in layers, and modelled as facts and dimensions. One governed definition of revenue serves every report.",
    "One order travels from checkout to the Finance report overnight. A late return restates a closed day, and a failed test holds the publish.",
    "Revenue is a governed metric with one owner. Tests gate publication, and lineage shows which sources stand behind every figure.",
    "Operational and analytical workloads; The relational model and SQL; Ingestion; Change data capture; Warehouses, lakes and lakehouses; Columnar storage; Data layers; Transformation; Data modelling; Dimensional modelling; Time and history; Data quality; Orchestration; Analytics and the semantic layer; Lineage"],
  ["Stock levels that match the shelf", "data",
    "The web shop sells items the stores no longer hold, because stock is copied once a night. Orders are cancelled and customers are refunded.",
    "Tills, the warehouse and the web shop publish stock movements to an event log. A stream processor keeps the count per product and store, and a serving store answers the web shop at request time.",
    "A sofa sells in a store and the web count drops within seconds. A duplicated event is absorbed, and a late event corrects the count.",
    "Producers publish under a contract that the log enforces. The serving path has a freshness objective and an owner on call.",
    "Batch, streaming and request processing; Event logs and streams; Stream processing; Delivery guarantees; Transactions and consistency; Schema evolution and data contracts; Non-relational data models; Indexes and storage engines; Replication and sharding; Serving data to applications; Observability and incident response"],
  ["One record for each customer", "data",
    "The same person exists as three customers in the web, app and store systems, so Support sees half a history and marketing writes to people twice.",
    "Customer records from every system are standardised, matched and merged into one mastered record with a stable identifier. Source records stay linked to it, and every change is kept as history.",
    "Three records for one person are matched and merged. A wrong merge is found and split again without losing history.",
    "Personal fields are classified where they are defined. The mastered record has a named owner, and access to it follows purpose.",
    "Data, records and schema; Data modelling; Master and reference data; Time and history; Data governance; Sensitive data handling; Catalogs and metadata; Access control and data protection; Data products and sharing; Nearest neighbours; Clustering and anomaly detection"],
  ["Erasing a customer on request", "data",
    "A customer asks to be erased. Their data sits in tables, files, a search index, logs and a model's training set, and the deadline is one month.",
    "The catalog records where personal data lives, and lineage follows each copy downstream. Tables accept row-level deletes, files are rewritten, and derived stores are rebuilt or purged.",
    "One erasure request is traced to every copy, deleted in each, and proven complete before the deadline.",
    "Erasure is a legal duty with a deadline. The evidence is the catalog, the lineage graph and the audit record of each delete.",
    "Data governance; Sensitive data handling; Structured, semi-structured and unstructured data; Catalogs and metadata; Lineage; File formats and encoding; Open table formats; Row-level changes and table maintenance; Access control and data protection; Preparing knowledge; Security and privacy of models"],
  ["A platform bill that tracks usage", "data",
    "The data platform bill doubled in a year while the number of users grew by a fifth. Nobody can say which team or query caused it.",
    "Storage and compute are billed apart and every workload carries its owner's tag. Tables are laid out so queries skip most of the data, and results that are asked for often are built once and reused.",
    "The most expensive query of the month is traced to its owner, and the table behind it is rebuilt so the query scans a fraction of the data.",
    "Scan size is spend. Budgets and quotas sit on workloads, and every charge is attributable to an owner.",
    "Cost and workload management; Separating storage from compute; Query execution; Columnar storage; File formats and encoding; Partitioning, clustering and pruning; Incremental processing and materialisation; Row-level changes and table maintenance; Warehouses, lakes and lakehouses; Platform architecture and operating model"],
  ["A broken number caught before the board sees it", "data",
    "A source team renames a field. Revenue on the board report halves, and nobody notices for three days.",
    "The source publishes under a contract that is checked on every change. Quality checks run between the layers and stop a bad batch, and lineage turns one failing table into the list of reports it feeds.",
    "The rename is rejected at the contract. In the counterfactual it gets through, a check quarantines the batch, and the incident is traced, fixed and backfilled.",
    "Every data product has an owner, a contract and a freshness objective. An incident ends with a written review.",
    "Schema evolution and data contracts; Ingestion; Data layers; Data quality; Orchestration; Lineage; Observability and incident response; Data products and sharing; Incremental processing and materialisation; Platform architecture and operating model"],

  ["Refund requests answered by an assistant", "ai",
    "Support answers four thousand refund requests a week. Each one means reading the policy, looking up the order and deciding, and customers wait two days.",
    "An assistant retrieves the policy passages that apply, calls a tool to read the order, and proposes a decision. Guardrails check what goes in and what comes out, and refunds above a limit wait for a person.",
    "One request is answered from the policy and the order. A message carrying a planted instruction is contained, and a large refund goes to an agent.",
    "The assistant acts with the customer's own access. Every tool has least privilege, and money above a limit moves only with human approval.",
    "Language models; Training; The model call; Prompting; The context window; Retrieval-augmented generation; Preparing knowledge; Hybrid search and reranking; Tool calling; Hallucination and model limits; Guardrails; Prompt injection; Agent authority and human oversight; Evaluating model output; Observability and feedback; Intended use and risk; Serving data to applications; Access control and data protection"],
  ["Product search that understands what shoppers mean", "ai",
    "Shoppers search for a sofa for a small flat and get nothing, because no product title contains those words. A fifth of searches end without a click.",
    "Products are indexed twice: by their words and by an embedding of their text and photos. A query runs against both, the results are fused and reranked, and click behaviour feeds the evaluation.",
    "One vague query fails on keywords, succeeds on vectors, and is ordered by the reranker. A product code query shows why keywords stay.",
    "The index holds only what a shopper may see. Ranking changes ship through a measured experiment.",
    "Tokens; Embeddings; Keyword search; Vector search; Hybrid search and reranking; Evaluating retrieval; Preparing knowledge; Multimodal models; Representation and transfer learning; Dimensionality reduction; Serving data to ML and AI; Online experiments and causal effect"],
  ["Supplier invoices read without retyping", "ai",
    "Two thousand supplier invoices a month arrive as PDFs and scans. Finance retypes them, pays late, and keys one in fifty wrongly.",
    "A multimodal model reads each invoice into a fixed schema. The result is validated against the purchase order, and invoices that fail or score low confidence go to a clerk, whose corrections become the test set.",
    "One clean invoice passes straight through. A scan with a smudged total is caught by validation and corrected by a clerk.",
    "A payment is never released on a model's reading alone. Totals are validated against the purchase order, and exceptions go to a person.",
    "Structured, semi-structured and unstructured data; Multimodal models; The model call; Structured output; Generation and sampling; Hallucination and model limits; Evaluating model output; Labels and ground truth; Cost, latency and model choice; Fine-tuning and distillation; Model serving; Data quality; Agent authority and human oversight"],
  ["Delivery exceptions resolved by an agent", "ai",
    "Three hundred deliveries a day fail. Each needs the carrier checked, a new slot booked, the customer told and sometimes a refund, across four systems.",
    "An agent works each exception in a loop: it reads the state, chooses a tool, acts and checks the result. Tools reach the carrier, the order system and messaging through a protocol, and the agent runs in a sandbox with limited authority.",
    "One failed delivery is rebooked end to end. A run interrupted halfway resumes from its saved state without booking twice.",
    "The agent holds only the permissions the task needs. Irreversible actions need approval, and every action is logged.",
    "The agent loop; Tool calling; Tools and protocols; Orchestration patterns; Planning and long-running work; Agent memory; Context engineering; Multi-agent systems; Execution environments; Agent authority and human oversight; Prompt injection; Evaluating agents; Delivery guarantees; Transactions and consistency"],
  ["Business questions answered from governed data", "ai",
    "A store manager waits three days for an analyst to answer a question about last week's sales. Analysts spend most of their time on such requests.",
    "A model turns the question into a query against the governed metric definitions, never against raw tables. The query runs with the manager's own permissions, and the answer shows the definition it used.",
    "One question becomes a metric query and an answer with its definition. A question about data the manager may not see is refused by the warehouse, and an ambiguous one is asked back.",
    "The model writes the query and the warehouse enforces access. An answer is traceable to a governed definition.",
    "Analytics and the semantic layer; Dimensional modelling; The relational model and SQL; Query execution; Catalogs and metadata; Access control and data protection; Prompting; Context engineering; Structured output; Multi-step retrieval; Hallucination and model limits; Evaluating model output"],
  ["A model change released without a regression", "ai",
    "The provider retires the model behind the refund assistant in sixty days. The last unplanned change raised wrong answers for a week before anyone saw it.",
    "Prompts, model version and settings are versioned together as one release. A candidate runs the evaluation set offline, then takes a small share of live traffic beside the current release, with a rollback ready.",
    "The new model fails two evaluation cases, the prompt is repaired, the canary holds, and the release is promoted.",
    "A model change is a change to a controlled system. It has an owner, a recorded evaluation, and a way back.",
    "Language models; Tokens; Attention and the transformer; Generation and sampling; Training; The context window; Prompting; Evaluating model output; Evaluating agents; Cost, latency and model choice; Model serving; Observability and feedback; Release and change management; AI risk management"],

  ["A demand forecast for replenishment", "ml",
    "Buyers order stock by feel. Bestsellers run out before weekends, while slow lines fill the warehouse and are sold at a loss.",
    "Sales history, prices, promotions and the calendar become features. A boosted model forecasts each product and store as a range, not a single number, and the pipeline retrains weekly and is watched for drift.",
    "One product's forecast is trained on the past, tested on weeks it never saw, and used to place an order. A promotion the model never saw shows as drift.",
    "A forecast is tested on time it has not seen. A buyer can override it, and overrides are recorded.",
    "Learning from examples; Features, labels and datasets; Exploring data; Feature engineering; Loss and optimisation; Training, validation and test sets; Overfitting and generalisation; Gradient boosting; Forecasting; Probabilistic models; Uncertainty and calibration; Model selection and tuning; Training pipelines; Monitoring and drift; Time and history; Serving data to ML and AI"],
  ["Payment fraud stopped at checkout", "ml",
    "Card fraud costs more each month. Blocking more payments stops fraud and also turns away good customers, and the rules cannot keep up.",
    "Each payment is scored in milliseconds from features about the card, the device and recent behaviour, the same features the model was trained on. A threshold sets the trade between fraud caught and customers blocked.",
    "One good payment passes and one stolen card is stopped. Moving the threshold shows what each setting costs.",
    "A blocked customer is told and can appeal. Reason codes are recorded, and the model is monitored as fraudsters adapt.",
    "Batch, streaming and request processing; Stream processing; Labels and ground truth; Features, labels and datasets; Metrics and thresholds; Linear and logistic regression; Decision trees; Bagging and random forests; Gradient boosting; Clustering and anomaly detection; Features in production; Model deployment; Monitoring and drift; Interpretability; Security and privacy of models"],
  ["Customers at risk of leaving, reached in time", "ml",
    "A tenth of loyalty members stop buying each year. Retention offers go to everyone, including those who would have stayed.",
    "A model scores each member's risk of leaving from a small table of behaviour. A tabular foundation model and a boosted model are compared on held-out members, and an experiment measures whether the offer changes anything.",
    "Members are scored, the calibrated top group gets the offer, and a holdout group shows the effect the offer caused.",
    "Scores drive offers, so fairness across customer groups is measured. Personal data used for scoring is limited to what the purpose needs.",
    "Learning from examples; Features, labels and datasets; Exploring data; Training, validation and test sets; Overfitting and generalisation; Linear and logistic regression; Gradient boosting; Tabular foundation models; Model selection and tuning; Uncertainty and calibration; Fairness; Experiment tracking and reproducibility; Online experiments and causal effect; Sensitive data handling"],
  ["Recommendations on the product page", "ml",
    "Product pages show the same bestsellers to everyone. Shoppers who would buy a matching item never see it.",
    "Views and purchases train embeddings that place products and shoppers in one space. Candidates are fetched by nearest neighbours, a ranking model orders them, and a bandit spends a small share of traffic on exploring new items.",
    "A shopper views a sofa and is shown what goes with it. A new product with no history gets shown through exploration.",
    "Recommendations are tested online before release. The system records why an item was shown.",
    "Embeddings; Neural networks; Architectures for images, sequences and text; Representation and transfer learning; Nearest neighbours; Vector search; Dimensionality reduction; Recommendation and ranking; Reinforcement learning and bandits; Features in production; Model deployment; Online experiments and causal effect"],
  ["Pay-later credit decided fairly", "ml",
    "Vinterhus offers payment in instalments. Approval is a rulebook that rejects good customers, and a model that replaces it must be explained to regulators and to applicants.",
    "An interpretable scoring model estimates the probability of default. It is validated by a team independent of its developers, checked for fairness, and documented before use. A person reviews declined applications on request.",
    "One application is scored, the reasons are stated, and a declined applicant asks for review. The validators challenge the model before release.",
    "Credit scoring of people is high-risk use. The model has an inventory entry, independent validation, human oversight and an explanation for the applicant.",
    "Intended use and risk; AI risk management; Labels and ground truth; Linear and logistic regression; Decision trees; Probabilistic models; Metrics and thresholds; Uncertainty and calibration; Interpretability; Fairness; Security and privacy of models; Experiment tracking and reproducibility; Model risk management; Data governance"],
  ["Damaged returns graded from a photo", "ml",
    "Forty thousand items come back each month. Staff judge each one by eye, grades differ between sites, and resaleable goods are written off.",
    "A vision model pretrained on general images is adapted with a few thousand graded photos. Rare damage is added through generated examples, and photos the model is unsure of go to an inspector.",
    "One returned chair is photographed and graded. An unfamiliar kind of damage is flagged as unlike anything in training and goes to a person.",
    "Grades decide refunds, so uncertain cases go to a person. Labels are audited between sites.",
    "Labels and ground truth; Loss and optimisation; Overfitting and generalisation; Neural networks; Architectures for images, sequences and text; Representation and transfer learning; Generative models; Clustering and anomaly detection; Uncertainty and calibration; Training pipelines; Model deployment; Monitoring and drift"],
];

export interface CaseDef {
  key: string; title: string; lead: TrackKey;
  problem: string; architecture: string; execution: string; governance: string;
  /** Keys of the concepts this use case puts to work, in the order given. */
  uses: string[];
}

export const cases: CaseDef[] = ROWS.map(([title, lead, problem, architecture, execution, governance, uses]) => ({
  key: slugOf(title), title, lead, problem, architecture, execution, governance,
  uses: uses.split(";").map((t) => slugOf(t.trim())).filter(Boolean),
}));
const byKey = new Map(cases.map((c) => [c.key, c]));
export const caseOf = (key: string): CaseDef | undefined => byKey.get(key);
/** Use cases that put a concept to work. */
export const casesFor = (conceptKey: string): CaseDef[] => cases.filter((c) => c.uses.includes(conceptKey));
/** Concepts no use case puts to work. */
export const uncovered = (): Concept[] => concepts.filter((c) => casesFor(c.key).length === 0);

export const PHASES = ["problem", "architecture", "execution"] as const;

/** Problems in the list itself: a duplicate title, an unknown concept, or a concept no use case covers. */
export function caseErrors(): string[] {
  const out: string[] = [];
  if (byKey.size !== cases.length) out.push("duplicate use case title");
  for (const c of cases) {
    for (const k of c.uses) if (!concept(k)) out.push(`use case ${c.title}: uses unknown concept ${k}`);
    if (new Set(c.uses).size !== c.uses.length) out.push(`use case ${c.title}: names a concept twice`);
  }
  for (const c of uncovered()) out.push(`concept ${c.title}: no use case puts it to work`);
  return out;
}

/** A built use case must sit on a row of the list and show every concept the row names, in three phases in order. */
export function builtCaseErrors(list: Guide[]): string[] {
  const out: string[] = [];
  for (const g of list) {
    const c = caseOf(g.slug);
    if (!c) { out.push(`use case ${g.slug}: not in the use case list`); continue; }
    if (g.id !== `case-${c.key}`) out.push(`use case ${g.slug}: id must be "case-${c.key}"`);
    if (g.track !== "case") out.push(`use case ${g.slug}: track must be "case"`);
    if (g.title !== c.title) out.push(`use case ${g.slug}: title must be "${c.title}"`);
    if (g.steps.length < 8 || g.steps.length > 10) out.push(`use case ${g.slug}: has ${g.steps.length} stops, needs 8 to 10`);
    const order = g.steps.map((s) => PHASES.indexOf(s.phase as (typeof PHASES)[number]));
    if (order.includes(-1)) out.push(`use case ${g.slug}: every stop needs a phase: problem, architecture or execution`);
    else if (order.some((p, i) => i > 0 && p < order[i - 1])) out.push(`use case ${g.slug}: phases must run problem, architecture, execution`);
    for (const [i, name] of PHASES.entries()) if (order.filter((p) => p === i).length < 2) out.push(`use case ${g.slug}: the ${name} phase needs at least two stops`);
    const shown = new Set(g.steps.flatMap((s) => s.concepts ?? []));
    for (const k of shown) if (!c.uses.includes(k)) out.push(`use case ${g.slug}: a stop names ${k}, which the list does not give this use case`);
    for (const k of c.uses) if (!shown.has(k)) out.push(`use case ${g.slug}: no stop puts "${concept(k)?.title ?? k}" to work`);
    g.steps.forEach((s, i) => { if (s.phase !== "problem" && !(s.concepts ?? []).length) out.push(`use case ${g.slug} stop ${i + 1}: names no concept`); });
  }
  return out;
}
