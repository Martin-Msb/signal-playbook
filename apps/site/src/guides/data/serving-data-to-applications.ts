import { CANVAS, defineGuide, drum, isoGrid, line, pawn, pill, prism, ride, step, stop } from "@signal-path/engine";

const G = isoGrid(112, 110, 30);
const flow = line("serving", [G.p(0, 0), G.p(20, 0)], { always: true });

export default defineGuide({
  id: "serving-data-to-applications", track: "data", module: "Serving", slug: "serving-data-to-applications",
  title: "Serving data to applications",
  summary: "Applications need answers in milliseconds, so curated data is pushed to stores built for lookups or queried through engines built for fast aggregates.",
  forLeads: "Choose the serving path from the application's query shape and freshness needs. Every copy sent beyond the governed platform needs a named audience, bounded retention and an owner for access changes.",
  status: "draft", minutes: 7,
  counters: ["Answer", "Serving path", "Freshness", "Access"],
  whatIf: { label: "What if the application queried the warehouse?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order values are illustrative",
    label: "Vinterhus prepares order data for a Support application. The same curated result can be synced to an operational store for key lookups or served through a real-time OLAP engine for aggregates. A cache sits in front of repeated reads. The route ends at an API and Support sees only the field it needs.",
    els: [
      flow,
      stop("warehouse", ...G.p(0, 0), undefined, undefined, { big: true, always: true }),
      stop("p-model", ...G.p(4, 0), undefined, undefined, { always: true }),
      stop("store", ...G.p(9, 0), undefined, undefined, { always: true }),
      stop("cache", ...G.p(13, 0), undefined, undefined, { always: true }),
      stop("api", ...G.p(17, 0), undefined, undefined, { always: true }),
      stop("app", ...G.p(20, 0), undefined, undefined, { big: true, always: true }),
      drum("warehouse-data", 3, 2, 0.9, 38, { hue: "sky", glyph: "stack", title: "Warehouse", sub: "curated orders", at: "n", always: true }),
      prism("model-card", 10, 5, 1.2, 1.2, 28, { hue: "track", glyph: "code", title: "Serving model", sub: "order status", at: "n", always: true }),
      prism("reverse-etl", 8.2, -5.5, 1.35, 1.35, 30, { hue: "sand", glyph: "arrows", title: "Reverse ETL", sub: "sync selected rows", at: "n", group: "sync" }),
      prism("pinot", 8.2, -5.5, 1.35, 1.35, 30, { hue: "mint", glyph: "chart", title: "Pinot / ClickHouse", sub: "fast aggregates", at: "n", group: "olap" }),
      prism("cache-box", 12.3, -4.4, 1.2, 1.2, 27, { hue: "sand", glyph: "bolt", title: "Cache", sub: "key, expiry", at: "n", group: "cached" }),
      prism("api-box", 16.2, -4.4, 1.2, 1.2, 27, { hue: "track", glyph: "arrows", title: "API", sub: "scoped response", at: "n", always: true }),
      pawn("support", 20, -3.1, "Support", "Order status?", { always: true }),
      pill("scope", [850, 70], "status only", { glyph: "shield", tone: "track", group: "governed" }),
    ],
  },
  steps: [
    step({
      id: "slow", label: "Wait", kind: "problem", title: "A warehouse query sits on the request path",
      caption: "Support asks for an order status. Running a broad analytical query for each application request ties response time to that query's work.",
      show: [], counters: ["order status", "warehouse query", "request time", "broad"],
      rides: [ride("serving", "warehouse", "app", "4471 status?")],
      body: ["At Vinterhus, Support needs the status of order 4471 while helping a customer. Order numbers and values in this guide are illustrative. An application request has a defined response-time budget, so the serving path must fit its lookup or aggregation workload."],
      claims: ["serving-data-to-applications-pinot-user-facing", "serving-data-to-applications-clickhouse-apps"],
    }),
    step({
      id: "shape", label: "Curate", kind: "idea", title: "Prepare a result for the application",
      caption: "A serving model selects the fields and grain the application needs. The data team can now choose a store around its access pattern.",
      show: ["governed"], counters: ["order status", "serving model", "curated", "status only"],
      rides: [ride("serving", "warehouse", "p-model", "4471 packed")],
      body: ["The serving model is a prepared output, not a request to expose every warehouse table. Define the response shape, update cadence and intended audience before moving the result downstream."],
      claims: ["serving-data-to-applications-hightouch-sync", "serving-data-to-applications-hightouch-governance"],
    }),
    step({
      id: "sync", label: "Sync", kind: "mechanism", title: "Reverse ETL pushes selected data to an operational store",
      caption: "Reverse ETL syncs modelled warehouse rows to the store the application reads. The store is shaped for keyed lookups, and updates arrive on its sync schedule.",
      show: ["sync", "governed"], counters: ["order status", "operational store", "scheduled sync", "status only"],
      rides: [ride("serving", "p-model", "store", "4471 ready")],
      body: ["Hightouch describes Reverse ETL as selecting records from a warehouse or lake, mapping fields to a destination, then syncing in real time or on a recurring schedule. Syncing a curated model to an operational database is one route for application lookups."],
      claims: ["serving-data-to-applications-hightouch-sync"],
    }),
    step({
      id: "aggregate", label: "Aggregate", kind: "mechanism", title: "OLAP engines answer user-facing aggregate queries",
      caption: "For dashboards or many simultaneous aggregate queries, ClickHouse and Apache Pinot serve analytical requests against an application-facing model.",
      show: ["olap", "governed"], counters: ["sales by channel", "real-time OLAP", "fresh data", "status only"],
      rides: [ride("serving", "p-model", "store", "web returns")],
      body: ["Apache Pinot describes itself as a real-time OLAP datastore for user-facing analytics, with fresh data available for querying. ClickHouse describes real-time applications, SQL queries, materialised views and a REST interface. These are serving engines for analytical query shapes, not a universal replacement for an operational record store."],
      claims: ["serving-data-to-applications-pinot-user-facing", "serving-data-to-applications-clickhouse-apps"],
    }),
    step({
      id: "cache", label: "Cache", kind: "watch-out", title: "Cache repeated reads with bounded staleness",
      caption: "A cache-aside layer returns a cached response on a hit, or reads the store on a miss. Expiry and invalidation bound how long a result can be stale.",
      show: ["sync", "cached", "governed"], counters: ["order status", "cache then store", "expiry bound", "status only"],
      rides: [ride("serving", "store", "cache", "4471 cached"), ride("serving", "cache", "api", "status")],
      body: ["Redis documents cache-aside as reading from the cache first, falling back to the primary store on a miss, then caching the result with a time-to-live. Writes can invalidate the key. Cached copies still need an expiry policy and a way to handle updates."],
      claims: ["serving-data-to-applications-redis-cache-aside"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Match the serving store to the request",
      caption: "",
      show: ["sync", "cached", "governed"], counters: ["one status or many metrics", "lookup or OLAP", "defined", "scoped"],
      rides: [ride("serving", "warehouse", "app", "status only", { via: ["p-model", "store", "cache", "api"] })],
      body: [{ pair: {
        left: { label: "Key lookup", items: ["Sync selected rows", "Use cache for repeated reads", "Set expiry and invalidation"] },
        right: { label: "Fast aggregates", items: ["Use ClickHouse or Pinot", "Model the query shape", "Check freshness and concurrency"] },
      } }, "Every destination is another place where data can persist. Limit fields, scope identities, review sync permissions and remove copies when their retention period ends."],
      claims: ["serving-data-to-applications-hightouch-governance", "serving-data-to-applications-pinot-user-facing", "serving-data-to-applications-redis-cache-aside"],
    }),
  ],
  governance: { text: "Data leaves the governed platform when it is synced or cached. Limit the fields and destination audience, scope application access, and set retention and invalidation rules for every downstream copy.", claims: ["serving-data-to-applications-hightouch-governance", "serving-data-to-applications-redis-cache-aside"] },
  closing: {
    pitfalls: [
      "Sending a full warehouse row when the application needs one status field.",
      "Treating a cache as authoritative after the source record changes.",
      "Using an OLAP engine for every request without checking its query shape or freshness needs.",
    ],
    questions: [
      "Does the request need a key lookup or an aggregate across many records?",
      "How fresh must the answer be, and what bounds staleness?",
      "Which fields, identities and downstream copies need access or retention controls?",
    ],
  },
});
