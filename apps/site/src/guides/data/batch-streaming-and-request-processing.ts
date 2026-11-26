import { blocks, CANVAS, cells, defineGuide, drum, isoGrid, line, pill, prism, raise, ride, slab, step, stop, table } from "@signal-path/engine";
import type { El } from "@signal-path/engine";

// The floor: orders leave Checkout on the main rail (gy = 0) and reach the sales table through one job.
// Orders that the job has not taken yet stand as blocks in the bay in front of the rail. The job changes at each stop:
// a nightly batch, a micro-batch, a stream job. The board behind the sales table shows how far behind the result is.
// In front of the sales table a second rail is a loop: a request goes out to the order service and the response comes back.
// Each waiting order is its own blocks element, so a record can rest on the rail beside the bay.
const OX = 200, OY = 70;
const G = isoGrid(OX, OY, 30);
const JOB = 11.4, GATE = 7.9, OUT = 15, STORE = 18.4;
const BAY = { gx: 2.6, gy: 1.7, pitch: 0.9, size: 0.72 };
const LOOP = { l: 17.2, r: 19.6, top: 3.8, end: 8.8 };
const JOB_TOP: [number, number] = [G.p(JOB, 0)[0], G.p(JOB, 0)[1] - 36];
const waiting: El[] = Array.from({ length: 12 }, (_, i) => {
  const col = i % 6, row = Math.floor(i / 6);
  // the three orders nearest the job are the ones a micro-batch still holds
  return blocks(`w-${i}`, BAY.gx + col * BAY.pitch, BAY.gy + row * BAY.pitch, 1, BAY.size, [{ h: 16, hue: "sand" }], { group: row === 0 && col > 2 ? "few" : "many" });
});
const job = (id: string, title: string, sub: string, glyph: string, on: boolean): El =>
  prism(id, JOB - 0.7, -0.7, 1.4, 1.4, 30, { hue: on ? "track" : "paper", glyph, title, sub, at: "sw", group: id });
const board = (id: string, upTo: string, missing: string, late = false): El =>
  raise(table(id, 0, 0, 204, ["field", "value"], [["time now", "10:42"], { cells: ["data up to", upTo], hot: !late }, { cells: ["missing", missing], hot: late }],
    { at: [12, 112], rowH: 26, title: "Finance dashboard", tone: late ? "alert" : undefined, group: id }), G.p(STORE, -3.2), 64);
// The day so far, one cell per hour: lit while the job held compute, muted after 10:42.
const hours = (id: string, lit: number): El =>
  raise(cells(id, 0, 0, 12, [25, 24], Array.from({ length: 24 }, (_, h) => ({ t: String(h).padStart(2, "0"), hot: h < lit, mute: h > 10 })),
    { gap: 2, title: "Compute today", sub: "hours the job was on", group: id }), [176, 508], 26);

export default defineGuide({
  id: "batch-streaming-and-request-processing", track: "data", module: "Analytical systems", slug: "batch-streaming-and-request-processing",
  title: "Batch, streaming and request processing",
  summary: "The same orders can be processed on a schedule, continuously or on demand. Each mode sets how far behind the result is, how long compute runs and how many parts must be kept correct.",
  forLeads: "Ask for a freshness target before choosing a mode. A result that is needed by morning does not justify a job that runs all day, and a result that is needed in seconds cannot come from a nightly run.",
  status: "draft", minutes: 7,
  counters: ["Work starts", "Result is behind by", "Orders waiting", "Compute is on"],
  whatIf: { label: "What if everything ran nightly?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, times and targets are illustrative",
    label: "Orders leave Checkout on a rail, pass through one processing job and land in the sales table. Orders the job has not taken yet stand as blocks in a waiting bay beside the rail. A board above the sales table shows the time now, the time the data reaches and how many orders are missing. With a nightly batch twelve orders wait and the board ends at midnight. With a micro-batch every minute three wait. A strip of 24 cells shows the hours in which the job held compute: one hour for the nightly batch, every hour so far for the others. With a stream job none wait, and the job carries state, checkpoints and a watermark, and one late order arrives. Then Support's refund assistant sends a request around a loop through the order service and receives a response. At the end a card lists a service level for each result.",
    els: [
      prism("co", -1.6, -0.7, 1.4, 1.4, 30, { hue: "sand", glyph: "pen", title: "Checkout", sub: "orders all day", at: "w", always: true }),
      line("main", [G.p(-0.2, 0), G.p(STORE - 1.1, 0)], { always: true }),
      stop("s-in", ...G.p(1.2, 0), undefined, undefined, { always: true }),
      stop("s-gate", ...G.p(GATE, 0), undefined, undefined, { always: true }),
      stop("s-out", ...G.p(OUT, 0), undefined, undefined, { always: true }),

      // the bay: orders that have arrived and not been processed
      slab("bay", BAY.gx - 0.3, BAY.gy - 0.3, 6 * BAY.pitch + 0.42, 2 * BAY.pitch + 0.42, undefined, { always: true }),
      pill("bay-l", [G.p(BAY.gx - 0.3, BAY.gy + 1.9)[0] - 10, G.p(BAY.gx - 0.3, BAY.gy + 1.9)[1] + 6], "Waiting orders", { glyph: "stack", anchor: "end", always: true }),
      ...waiting,

      // one job, three ways of running it
      job("batch", "Batch job", "starts at 00:00", "clock", false),
      job("micro", "Micro-batch job", "starts every minute", "loop", true),
      job("stream", "Stream job", "never stops", "play", true),
      pill("cron", [OX + 330, 52], "@daily", { glyph: "clock", sub: "once a day at midnight", mono: true, to: JOB_TOP, group: "batch" }),
      pill("trig", [OX + 330, 52], "Trigger", { glyph: "loop", sub: "fixed interval, 1 minute", to: JOB_TOP, group: "micro" }),

      // the result and how fresh it is
      drum("sales", STORE, 0, 1.1, 40, { hue: "sky", glyph: "table", title: "Sales table", at: "e", always: true }),
      line("stem", [G.p(STORE, -1.1), G.p(STORE, -3.2)], { tone: "ink", w: 3, always: true }),
      board("b-night", "00:00", "12 orders"), board("b-min", "10:41", "3 orders"), board("b-now", "10:42", "0 orders"), board("b-late", "10:42", "1 late", true),

      // what a job that never stops has to carry
      pill("st", [OX + 372, 96], "State", { glyph: "stack", sub: "running totals", to: JOB_TOP, group: "parts" }),
      pill("cp", [OX + 236, 60], "Checkpoint", { glyph: "replay", sub: "restart point", to: [JOB_TOP[0] - 10, JOB_TOP[1] + 2], group: "parts" }),
      pill("wm", [OX + 150, 6], "Watermark 10:40", { glyph: "flag", sub: "earlier orders are late", tone: "alert", group: "late" }),

      // on demand: a request out, a response back
      line("req", [G.p(LOOP.l, LOOP.end), G.p(LOOP.l, LOOP.top), G.p(LOOP.r, LOOP.top), G.p(LOOP.r, LOOP.end)], { loop: true, group: "req" }),
      stop("q-ask", ...G.p(LOOP.l, 7.4), undefined, undefined, { group: "req" }),
      stop("q-got", ...G.p(LOOP.r, 5.2), undefined, undefined, { group: "req" }),
      stop("q-back", ...G.p(LOOP.r, 7.2), undefined, undefined, { group: "req" }),
      prism("api", STORE - 0.6, LOOP.top - 0.6, 1.2, 1.2, 26, { hue: "track", glyph: "search", title: "Order service", sub: "works when asked", at: "e", group: "req" }),
      prism("sup", STORE - 0.6, LOOP.end - 0.6, 1.2, 1.2, 26, { hue: "mint", glyph: "wrench", title: "Refund assistant", at: "sw", group: "req" }),
      pill("lat", [826, 452], "Response time", { glyph: "clock", sub: "the reader is waiting", to: G.p(LOOP.r + 0.4, 5.6), group: "wait" }),

      // the hours of the day so far in which the job held compute
      hours("h-batch", 1), hours("h-on", 11),

      // the targets each mode is held to
      raise(table("slo", 0, 0, 294, ["result", "mode", "target"], [["Finance report", "batch", "by 06:00"], ["Stock view", "stream", "1 min old"], ["Refund lookup", "request", "99% in 1 s"], { cells: ["every result", "all", "totals match"], hot: true }],
        { at: [12, 126, 190], rowH: 26, title: "Service levels", group: "slo" }), [158, 508], 26),
    ],
  },
  steps: [
    step({
      id: "nightly", label: "Nightly", kind: "problem", title: "A nightly batch leaves today's orders waiting",
      caption: "One scheduled job processes all orders at midnight. At 10:42 the Finance dashboard still ends at midnight, and order 4474 joins twelve others that wait for the next run.",
      show: ["batch", "many", "few", "b-night", "h-batch"], counters: ["at 00:00", "10 h 42 min", "12", "during the run"],
      rides: [ride("main", "s-in", "s-gate", "4474")],
      body: ["Batch processing works on a bounded input. The job can take in the whole day of orders before it produces any result, and in a batch pipeline each stage waits for the one before it to finish.",
        "A scheduler starts the run. In Apache Airflow a Dag takes a cron expression or a preset as its schedule, and the preset @daily runs once a day at midnight.",
        { callout: { label: "Key idea", text: "The schedule sets the freshness. A result built at midnight cannot contain an order placed at 10:42." } }],
      claims: ["batch-streaming-and-request-processing-bounded", "batch-streaming-and-request-processing-schedule", "batch-streaming-and-request-processing-stages"],
    }),
    step({
      id: "micro", label: "Micro-batch", kind: "idea", title: "Micro-batches run the same job more often",
      caption: "The job now starts every minute and takes the orders that arrived since the last run. Three orders wait and the dashboard is a minute behind, for up to 1,440 runs a day.",
      show: ["micro", "few", "b-min", "h-on"], counters: ["every minute", "up to 1 min", "3", "all day, in short runs"],
      rides: [ride("main", "s-gate", "s-out", "3 orders", { then: "3 rows" })],
      body: ["Spark Structured Streaming works this way by default. Its micro-batch engine processes a stream as a series of small batch jobs, with end-to-end latencies as low as 100 milliseconds and exactly-once fault-tolerance guarantees.",
        "The trigger sets the interval. With a fixed interval a micro-batch starts at each interval, and none starts when no new data is available.",
        "The same query can also run as a scheduled batch. A trigger that processes everything available and then stops lets a cluster start periodically and shut down again, which the Spark documentation says may lead to significant cost savings in some cases."],
      claims: ["batch-streaming-and-request-processing-microbatch", "batch-streaming-and-request-processing-trigger"],
    }),
    step({
      id: "stream", label: "Streaming", kind: "mechanism", title: "A stream job processes each order as it arrives",
      caption: "The input never ends, so the job never stops. Order 4474 passes straight through and updates running totals that the job holds as state. Nothing waits. Compute is on all day.",
      show: ["stream", "b-now", "parts", "h-on"], counters: ["on each order", "seconds", "0", "all day, in one run"],
      rides: [ride("main", "s-in", "s-out", "4474", { via: ["s-gate"], then: "web +1450" })],
      body: ["Stream processing involves unbounded data. Conceptually the input may never end, so the data is processed continuously as it arrives.",
        "A count per channel needs memory across events. In Apache Flink that memory is state: when events are aggregated per minute, hour or day, the state holds the pending aggregates.",
        "State has to survive a failure. Flink combines stream replay with checkpointing, and recovers by restoring the state of the operators and replaying the records from the point of the checkpoint.",
        "Spark offers an experimental continuous processing mode with end-to-end latencies as low as 1 millisecond. It gives at-least-once guarantees, where the micro-batch engine gives exactly-once."],
      claims: ["batch-streaming-and-request-processing-bounded", "batch-streaming-and-request-processing-state", "batch-streaming-and-request-processing-continuous", "batch-streaming-and-request-processing-stages"],
    }),
    step({
      id: "late", label: "Late order", kind: "watch-out", title: "A late order tests a result already shown",
      caption: "Store order 4469 was placed at 10:31 and arrives at 10:42. A watermark sets how long the job waits for such orders. Waiting longer delays the result.",
      show: ["stream", "b-late", "parts", "late", "h-on"], counters: ["on each order", "seconds", "1, late", "all day, in one run"],
      rides: [ride("main", "s-in", "s-gate", "4469 10:31", { tone: "alert" })],
      body: ["Event time is the time an event occurred on its producing device. Processing time is the clock of the machine that runs the operation. The two differ whenever an event is delayed on the way.",
        "A watermark declares that event time has reached a given time in the stream, so that all events up to that timestamp should have arrived. Elements that arrive after it are late elements.",
        { callout: { label: "Key idea", text: "Event time processing incurs some latency while it waits for out-of-order events. Delaying the watermarks by too much delays the evaluation of every window." } }],
      claims: ["batch-streaming-and-request-processing-time"],
    }),
    step({
      id: "request", label: "On request", kind: "mechanism", title: "A request is processed when someone asks",
      caption: "Support's refund assistant sends a request for order 4474 and waits for the response. The order service works once per request, and its target is the time to respond.",
      show: ["stream", "b-now", "req", "wait", "h-on"], counters: ["on each request", "seconds", "0", "all day, ready to answer"],
      rides: [ride("req", "q-ask", "q-back", "4474?", { via: ["q-got"], then: "paid 1450" }), ride("main", "s-in", "s-out", "4475", { via: ["s-gate"], then: "app +320" })],
      body: ["Request and response is the pattern of HTTP. A client sends a request to a server, and the server interprets it and replies with one or more responses. Each request can be understood on its own.",
        "User-facing serving systems generally care about availability, latency and throughput. Latency is how long it takes to return a response to a request.",
        "Data processing pipelines tend to care about throughput and end-to-end latency. All systems should care about correctness: whether the right answer was returned."],
      claims: ["batch-streaming-and-request-processing-request", "batch-streaming-and-request-processing-serving"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "The service level picks the mode",
      caption: "",
      show: ["stream", "b-now", "req", "slo"], counters: ["per result", "its stated target", "0", "as the target needs"],
      rides: [ride("main", "s-in", "s-out", "4476", { via: ["s-gate"], then: "store +899" }), ride("req", "q-ask", "q-back", "4474?", { via: ["q-got"], then: "paid 1450" })],
      body: [{ pair: {
        left: { label: "Scheduled batch", items: ["Whole input before results", "Compute off between runs", "Hours or minutes behind"] },
        right: { label: "Streaming", items: ["Low latency", "Runs continuously", "State, checkpoints, watermarks"] },
      } },
        "A service level objective is a target value for a service level that an indicator measures. An objective should state how it is measured and the conditions under which it is valid.",
        "Most freshness objectives for pipelines take one of three forms: a share of the data processed within a time, the oldest data no older than a time, or the job completed successfully within a time. A correctness objective sets a limit on errors, such as no more than 0.1% of invoices incorrect per quarter.",
        "Tools carry the target into the pipeline. A dbt freshness block states how old the most recent data may be before a check reports a warning or an error."],
      claims: ["batch-streaming-and-request-processing-slo", "batch-streaming-and-request-processing-freshness", "batch-streaming-and-request-processing-dbt", "batch-streaming-and-request-processing-trigger", "batch-streaming-and-request-processing-stages", "batch-streaming-and-request-processing-state", "batch-streaming-and-request-processing-time"],
    }),
  ],
  governance: { text: "Freshness and correctness are stated as service level objectives, for example that the oldest data is no older than a set time and that no more than a set share of results is wrong. Later stages are measured against them, and readers care about the objective for the sum of all stages.", claims: ["batch-streaming-and-request-processing-freshness", "batch-streaming-and-request-processing-slo"] },
  closing: {
    pitfalls: [
      "Choosing streaming for a result that nobody reads before the next morning.",
      "Reading a dashboard as live without knowing the time its data reaches.",
      "Running a stream job with no decision on how long to wait for late events.",
    ],
    questions: [
      "How old may each of your results be before someone makes a wrong decision?",
      "What does the job that never stops have to keep that the nightly job does not?",
      "Which of your results is computed when a person asks, and how long may they wait?",
    ],
  },
});
