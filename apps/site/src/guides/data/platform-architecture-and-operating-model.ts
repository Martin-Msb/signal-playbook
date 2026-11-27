import { CANVAS, defineGuide, drum, isoGrid, line, list, pawn, pill, prism, raise, ride, slab, step, stop } from "@signal-path/engine";
import type { El, Hue } from "@signal-path/engine";

// The floor: the shared base stands on one plate at the back: object storage, table format, catalog, engines.
// In front of it stand transformation and serving, once per data product, in three lanes.
// Colour is the owner. Grey parts have no owner. Under a central team every part takes the track colour and the
// three lanes share one plate and one rail. Under domain ownership each lane is a plate in its domain's colour
// with its own rail, and only the base keeps the track colour.
const G = isoGrid(440, 95, 30), Z = 10;
const RY = 3.9, TOP = 5, DEPTH = 6, END = 11.6, QY = 4.7, TY = 6.35, SY = 9.4;
const LANE = [0, 5, 10], RAIL = [3.9, 8.9, 13.9];
const PAWN = 12.6, READ = 8;
// Lane colours, back to front: Support (returns), Finance (revenue), Operations (orders).
const OWNER: Hue[] = ["violet", "sky", "sand"];
const up = (gx: number, gy: number, dy: number): [number, number] => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];

/** The shared base: four parts in a row on the back plate. */
const base = (group: string, hue: Hue, named: boolean): El[] => [
  drum(`store-${group}`, 1.75, 1.4, 0.9, 30, { hue, glyph: "stack", title: named ? "Object storage" : undefined, at: "n", z: Z, group }),
  prism(`format-${group}`, 4.5, 0.65, 1.5, 1.5, 28, { hue, glyph: "table", title: named ? "Table format" : undefined, at: "n", z: Z, group }),
  prism(`engine-${group}`, 11.5, 0.65, 1.5, 1.5, 28, { hue, glyph: "gear", title: named ? "Engines" : undefined, at: "n", z: Z, group }),
];
const catalog = (group: string, hue: Hue, glyph: string, title?: string): El =>
  prism(`catalog-${group}`, 8, 0.65, 1.5, 1.5, 28, { hue, glyph, title, at: "n", z: Z, group });
/** One lane: transformation behind, the served product in front. */
const lane = (k: number, group: string, hue: Hue, o: { transform?: string; served?: string } = {}): El[] => [
  prism(`tr${k}-${group}`, LANE[k] + 0.75, TOP + 0.6, 1.5, 1.5, 26, { hue, glyph: "code", title: o.transform, at: "w", z: Z, group }),
  drum(`sv${k}-${group}`, LANE[k] + 1.5, SY, 0.8, 26, { hue, glyph: "chart", title: o.served, at: "w", z: Z, group }),
];
const laneStops = (k: number, group?: string): El[] => [
  stop(`t${k}`, ...G.p(RAIL[k], TY), undefined, undefined, group ? { group } : { group: "flow" }),
  stop(`s${k}`, ...G.p(RAIL[k], SY), undefined, undefined, group ? { group } : { group: "flow" }),
  stop(`e${k}`, ...G.p(RAIL[k], END), undefined, undefined, group ? { group } : { group: "flow" }),
];

export default defineGuide({
  id: "platform-architecture-and-operating-model", track: "data", module: "Operation", slug: "platform-architecture-and-operating-model",
  title: "Platform architecture and operating model",
  summary: "Storage, table format, catalog, engines, transformation and serving compose into one platform. Whether a central team or the domains own the data products built on it is an organisational choice with technical consequences.",
  forLeads: "Decide ownership part by part. The shared base is one platform in either model. Who builds and supports each data product, and where shared rules are enforced, decides whether delivery queues in one team or runs in parallel.",
  status: "draft", minutes: 7,
  counters: ["Products owned by", "Shared base", "Rules enforced by", "Delivery"],
  whatIf: { label: "What if one central team owned every product?", step: 2, from: 4 },
  scene: {
    viewBox: CANVAS, iso: G.iso, note: "Teams, products and the policy are illustrative",
    label: "Six platform parts stand on the floor: object storage, table format, catalog and engines at the back, transformation and serving in front. First they are grey and unconnected while Finance asks for sales by channel. Then the four parts at the back stand on one plate, a rail joins all six and order 4468 rides from storage to a served product. Under a central data team every part takes one colour, three products share one plate and one rail, and a request waits. Under domain ownership the front plate splits into three, each in the colour of Support, Finance or Operations with its own rail, while the base stays with the platform team. Then a shared policy stands behind the catalog and a read by Finance of the orders product pauses at the catalog. At the last stop three plates name who decides, who is accountable and who enforces.",
    els: [
      // 1 and 2. six parts without an owner
      ...base("loose", "paper", true), catalog("loose", "paper", "lines", "Catalog"),
      ...lane(2, "loose", "paper", { transform: "Transformation", served: "Serving" }),
      pawn("fin-ask", 7.2, PAWN, "Finance", "Sales by channel?", { hue: "sky", side: "w", group: "ask" }),
      pawn("fin2", 7.2, PAWN, "Finance", undefined, { hue: "sky", group: "fin" }),

      // 2. composed: plates under the parts and one rail through them
      slab("plat0", 0, 0, 14.5, 2.8, undefined, { hue: "paper", group: "composed" }),
      slab("lane0", LANE[2], TOP, 3, DEPTH, undefined, { hue: "paper", group: "composed" }),
      line("flow", [G.p(1.75, RY), G.p(RAIL[2], RY), G.p(RAIL[2], END)], { group: "flow" }),
      stop("f-store", ...G.p(1.75, RY), undefined, undefined, { group: "flow" }),
      stop("f-format", ...G.p(5.25, RY), undefined, undefined, { group: "flow" }),
      stop("f-cat", ...G.p(RAIL[1], RY), undefined, undefined, { group: "flow" }),
      stop("f-eng", ...G.p(12.25, RY), undefined, undefined, { group: "flow" }),
      stop("q", ...G.p(RAIL[2], QY), undefined, undefined, { group: "central" }),
      ...laneStops(2),

      // 3 to 6. the base, owned by one team
      slab("plat", 0, 0, 14.5, 2.8, undefined, { group: "plat" }),
      ...base("plat", "track", true), catalog("plain", "track", "lines", "Catalog"), catalog("gov", "track", "shield", "Catalog"),
      pawn("team-c", -3, 2.4, "Central data team", undefined, { hue: "track", group: "team-c" }),
      pawn("team-p", -3, 2.4, "Platform team", undefined, { hue: "track", group: "team-p" }),
      pawn("sup", 2.2, PAWN, "Support", undefined, { hue: "violet", group: "people" }),
      pawn("ops", 12.2, PAWN, "Operations", undefined, { hue: "sand", group: "people" }),

      // 3. central ownership: one plate, one colour, one rail
      slab("central", LANE[0], TOP, 13, DEPTH, undefined, { group: "central" }),
      ...OWNER.flatMap((_, k) => lane(k, "central", "track", k === 0 ? { transform: "Transformation", served: "Serving" } : {})),
      pill("queue", [850, 440], "One backlog", { sub: "requests wait here", glyph: "clock", tone: "alert", to: up(RAIL[2], QY + 0.7, 0), group: "central" }),

      // 4 to 6. domain ownership: a plate, a colour and a rail per domain
      ...OWNER.flatMap((hue, k) => [
        slab(`dom${k}`, LANE[k], TOP, 3, DEPTH, undefined, { hue, group: "domains" }),
        ...lane(k, "domains", hue, k === 0 ? { transform: "Transformation", served: "Serving" } : {}),
      ]),
      ...[0, 1].flatMap((k) => [line(`l${k}`, [G.p(RAIL[k], RY), G.p(RAIL[k], END)], { group: "domains" }), ...laneStops(k, "domains")]),
      pill("self", [140, 52], "Self-service platform", { sub: "one base, three owners", glyph: "layers", tone: "track", group: "self" }),

      // 5 and 6. shared policy, enforced at the catalog
      line("post", [G.p(8.75, 0), G.p(8.75, -3.4)], { tone: "ink", w: 3, group: "gov" }),
      raise(list("policy", 0, 0, 196, ["order_id  one format", { t: "email     personal", hot: true }, "owner     required"], { title: "Shared policy", sub: "as code", mono: true, group: "gov" }), G.p(8.75, -3.4), 30),
      line("read", [G.p(RAIL[1], END), G.p(RAIL[1], RY), G.p(RAIL[2], RY), G.p(RAIL[2], READ)], { group: "gov" }),
      stop("r2", ...G.p(RAIL[2], READ), undefined, undefined, { group: "gov" }),

      // 6. who decides, who is accountable, who enforces
      pill("who-d", [884, 188], "Decides", { sub: "central policy", glyph: "scale", group: "who" }),
      pill("who-e", [140, 52], "Enforces", { sub: "platform, at the catalog", glyph: "shield", tone: "track", group: "who" }),
      pill("who-a", [850, 440], "Accountable", { sub: "each domain", glyph: "user", to: up(12.3, 10.5, 10), group: "who" }),
    ],
  },
  steps: [
    step({
      id: "parts", label: "Loose parts", kind: "problem", title: "Six parts do not make a platform",
      caption: "Finance asks for sales by channel. Storage, a table format, a catalog, engines, transformation and serving all exist, but nothing joins them and nobody owns the path.",
      show: ["loose", "ask"], counters: ["nobody", "six loose parts", "nobody", "no path"],
      body: ["Each part is known from earlier guides. A platform is these parts joined, plus a decision about who owns each one.",
        "Reference architectures name the same parts. Databricks draws its lakehouse reference architecture as swim lanes that include Source, Ingest, Transform, Query/Process, Serve and Storage."],
      claims: ["platform-architecture-and-operating-model-reference-architecture"],
    }),
    step({
      id: "compose", label: "Compose", kind: "idea", title: "The parts compose into one platform",
      caption: "Open files in object storage, a table format, a catalog and engines form one shared base. Transformation and serving turn order 4468 into a product Finance can query.",
      show: ["loose", "composed", "flow", "fin"], counters: ["nobody", "one platform", "nobody", "one path"],
      rides: [ride("flow", "f-store", "e2", "4468 web 899", { via: ["f-format", "f-cat", "f-eng", "t2"], then: "channel sales" })],
      body: ["The lakehouse design keeps data in a low-cost object store in a standard file format such as Apache Parquet and adds a transactional metadata layer that defines which objects are part of a table version. Delta Lake and Apache Iceberg are named as systems that work this way.",
        "In the Databricks lakehouse reference architecture, curated data is stored in cloud object storage as Delta or Apache Iceberg tables, and Unity Catalog is the central governance system.",
        { callout: { label: "Key idea", text: "The base is shared. Transformation and serving are repeated once for every data product built on it." } }],
      claims: ["platform-architecture-and-operating-model-lakehouse-architecture", "platform-architecture-and-operating-model-reference-architecture"],
    }),
    step({
      id: "central", label: "Central", kind: "mechanism", title: "A central team can own every part",
      caption: "The central data team runs the base and builds every product. The specialist skills sit in one team, and each domain's request waits in one backlog.",
      show: ["plat", "plain", "flow", "central", "fin", "people", "team-c"], counters: ["central data team", "run by the same team", "central data team", "one backlog"],
      rides: [ride("flow", "f-eng", "e2", "orders", { via: ["t2", "s2"] }), ride("flow", "f-eng", "q", "revenue", { then: "revenue waits" })],
      body: ["One colour covers the whole floor. Support, Finance and Operations supply data and ask for products, and one team transforms and serves all of them.",
        "The skills needed to provision data infrastructure are specialised and would be difficult to replicate in each domain, which is the case for keeping them together. The cost is throughput. Google's data mesh guidance states that limiting domain autonomy risks creating a bottleneck at the central data platform team."],
      claims: ["platform-architecture-and-operating-model-bottleneck", "platform-architecture-and-operating-model-platform"],
    }),
    step({
      id: "domains", label: "Domains", kind: "mechanism", title: "Domains can own the products instead",
      caption: "Support, Finance and Operations each build and serve their own product on their own lane. The platform team keeps the base and offers it as self-service.",
      show: ["plat", "plain", "flow", "domains", "fin", "people", "team-p", "self"], counters: ["each domain", "self-service", "each domain", "three lanes in parallel"],
      rides: [ride("l0", "t0", "e0", "returns"), ride("l1", "t1", "e1", "revenue"), ride("flow", "t2", "e2", "orders")],
      body: ["This is the data mesh model. It rests on four principles: domain-oriented decentralised ownership, data as a product, self-serve data infrastructure as a platform, and federated computational governance.",
        "Ownership of analytical data and its serving moves to the business domains closest to the data. In Google's data mesh architecture, domain producer teams create and maintain data products, and central teams provide cross-domain oversight, governance, services and self-service infrastructure.",
        { callout: { label: "What changed", text: "The base did not move. One plate, one colour and one rail became three, and each domain now staffs its own transformation and serving." } }],
      claims: ["platform-architecture-and-operating-model-mesh-principles", "platform-architecture-and-operating-model-mesh-ownership", "platform-architecture-and-operating-model-mesh-functions", "platform-architecture-and-operating-model-platform"],
    }),
    step({
      id: "rules", label: "Shared rules", kind: "watch-out", title: "Domain products need shared rules",
      caption: "A federation of domain and platform owners agrees one policy. The platform enforces it at the catalog, so Finance reads the orders product with the email masked.",
      show: ["plat", "gov", "flow", "domains", "fin", "people", "team-p"], counters: ["each domain", "self-service", "the platform", "three lanes in parallel"],
      rides: [ride("read", "e1", "r2", "Finance reads", { via: ["f-cat"], then: "email masked" })],
      body: ["Three owners need one set of rules. Federated computational governance is a decision-making model led by a federation of domain data product owners and data platform product owners, with automated execution of decisions by the platform.",
        "The catalog is where the platform can act. A metadata layer can check whether a client is allowed to access a table before granting it credentials to read the data, and can log all accesses. Databricks describes Unity Catalog as a single place to manage data access policies."],
      claims: ["platform-architecture-and-operating-model-federated-governance", "platform-architecture-and-operating-model-lakehouse-architecture", "platform-architecture-and-operating-model-reference-architecture"],
    }),
    step({
      id: "choice", label: "Choose", kind: "decision", title: "Ownership is an organisational choice",
      caption: "",
      show: ["plat", "gov", "flow", "domains", "fin", "people", "team-p", "who"], counters: ["each domain", "self-service", "the platform", "three lanes in parallel"],
      rides: [ride("flow", "f-store", "e2", "4468 web 899", { via: ["f-cat", "t2"], then: "orders" })],
      body: [{ pair: {
        left: { label: "Central team", items: ["One backlog for all domains", "Specialists in one place", "Rules applied by one team"] },
        right: { label: "Domains", items: ["Products built in parallel", "Each domain staffs its product", "Rules automated in the platform"] },
      } },
        "The same base serves both models. In Google's data mesh architecture a central data governance team defines and enforces data governance policies among data producers, while domain teams stay accountable for the products they create and maintain."],
      claims: ["platform-architecture-and-operating-model-central-governance", "platform-architecture-and-operating-model-mesh-functions", "platform-architecture-and-operating-model-bottleneck", "platform-architecture-and-operating-model-federated-governance"],
    }),
  ],
  governance: { text: "Policy is decided centrally, by a governance team or a federation of domain and platform owners. Each domain stays accountable for its data product, and the platform enforces the policy automatically where data is read.", claims: ["platform-architecture-and-operating-model-central-governance", "platform-architecture-and-operating-model-federated-governance", "platform-architecture-and-operating-model-mesh-functions"] },
  closing: {
    pitfalls: [
      "Treating the platform as a storage choice and leaving ownership undecided.",
      "Moving products to the domains without a self-service base or staff to support them.",
      "Writing shared policy that no part of the platform enforces.",
    ],
    questions: [
      "Who builds and supports the orders product, and who runs the base under it?",
      "Which parts of the platform should every domain reuse?",
      "Where is the shared policy enforced when Finance reads another domain's product?",
    ],
  },
});
