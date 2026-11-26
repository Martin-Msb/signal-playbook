import { CANVAS, defineGuide, drum, isoGrid, line, pawn, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";

const G = isoGrid(105, 165, 30);
const X = { source: 0, lake: 5, platform: 10, product: 15, finance: 20 };
const rail = (id: string, y: number, group: string) => line(id, [G.p(-1, y), G.p(21, y)], { w: 4, group });
const card = (id: string, owner: string, group: string) => raise(table(id, 0, 0, 180, ["order", "channel", "value"], [["4468", "web", "899"], ["4469", "app", "129"]], { title: "Orders", sub: owner, group }), G.p(X.product, -2.2), 30);

export default defineGuide({
  id: "platform-architecture-and-operating-model", track: "data", module: "Operation", slug: "platform-architecture-and-operating-model",
  title: "Platform architecture and operating model",
  summary: "A lakehouse platform combines storage, metadata, compute and governance. The organisation chooses whether a central team or business domains own the data products.",
  forLeads: "Keep platform capabilities reusable and make ownership explicit. Central policy can set shared rules while platform controls enforce access; domain ownership adds local accountability and operating work.",
  status: "draft", minutes: 7,
  counters: ["Data owner", "Shared platform", "Policy", "Consumer access"],
  whatIf: { label: "What if each domain owned its data?", step: 1, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso, note: "Orders and teams are illustrative",
    label: "Order 4468 moves along the platform. The route marks the shared lakehouse stack, then ownership changes from a central team to Operations while governance stays shared.",
    els: [
      line("main", [G.p(-1, 0), G.p(21, 0)], { always: true, w: 4 }),
      ...[0, 4, 8, 12, 16, 20].map((x, i) => stop(`s${i}`, ...G.p(x, 0), undefined, undefined, { always: true })),
      pill("stack", [150, 65], "storage · metadata · compute", { group: "stack" }),
      pill("shared", [395, 65], "shared platform", { group: "shared" }),
      pill("central", [620, 65], "central data team owns", { group: "central" }),
      pill("domain", [620, 65], "Operations owns", { group: "domain" }),
      pill("governance", [395, 105], "central policy · platform enforcement", { group: "governance" }),
    ],
  },
  steps: [
    step({ id: "situation", label: "Bottleneck", kind: "problem", title: "One team owns every data request", caption: "Finance needs order totals. A central team controls the tables, platform and changes, so domain knowledge and delivery queue in one place.", show: [], counters: ["central team", "one shared system", "central", "queued"], rides: [ride("main", "s0", "s4", "4468 web 899")], body: ["At Vinterhus, Finance asks for orders by channel. The example values and teams are illustrative."], claims: ["platform-architecture-and-operating-model-mesh-ownership"] }),
    step({ id: "lakehouse", label: "Compose", kind: "idea", title: "The lakehouse joins data and management", caption: "Orders sit in open files with a metadata layer that tracks table versions and supports transactions, governance and access controls.", show: ["stack"], counters: ["central team", "lakehouse", "central", "queued"], rides: [ride("main", "s0", "s1", "4468")], body: ["The lakehouse reference architecture places a transactional metadata layer over object storage. It describes open-format files, metadata, and access controls as parts of the system."], claims: ["platform-architecture-and-operating-model-lakehouse-architecture"] }),
    step({ id: "platform", label: "Platform", kind: "mechanism", title: "A platform supplies shared capabilities", caption: "The platform operates reusable storage, metadata and compute, plus discovery and access enforcement for the teams using it.", show: ["stack", "shared", "governance"], counters: ["central team", "shared services", "central", "platform enforced"], rides: [ride("main", "s1", "s2", "table version")], body: ["Google's data mesh architecture separates central platform and governance functions from domain producer and consumer teams. The central platform supplies self-service infrastructure and discovery."], claims: ["platform-architecture-and-operating-model-mesh-functions"] }),
    step({ id: "central", label: "Central", kind: "mechanism", title: "Central ownership keeps product work together", caption: "The data team owns the orders product and delivers Finance's channel summary through the shared platform.", show: ["stack", "shared", "governance", "central"], counters: ["central data team", "shared services", "central", "Finance"], rides: [ride("main", "s2", "s4", "orders")], body: ["A centrally owned platform can retain product ownership and delivery in one team. This is an organisational choice; the architecture does not require domain ownership."], claims: ["platform-architecture-and-operating-model-mesh-functions"] }),
    step({ id: "domain", label: "Domains", kind: "watch-out", title: "Domain ownership moves accountability closer", caption: "Operations owns the orders product while the platform keeps shared capabilities and central rules. Domains also take on product support and maintenance.", show: ["stack", "shared", "governance", "domain"], counters: ["Operations", "shared services", "federated", "Finance"], rides: [ride("main", "s2", "s3", "4468", { then: "orders" }), ride("main", "s3", "s4", "Finance reads")], body: ["Data mesh combines domain-oriented ownership with a self-service platform and federated computational governance. Google describes domain teams as creating and maintaining products, while central teams provide cross-domain services and governance."], claims: ["platform-architecture-and-operating-model-mesh-principles", "platform-architecture-and-operating-model-mesh-functions"] }),
    step({ id: "choice", label: "Choose", kind: "decision", title: "Assign ownership and enforcement", caption: "", show: ["stack", "shared", "governance", "domain"], counters: ["named owner", "shared services", "federated", "granted"], rides: [ride("main", "s2", "s4", "orders")], body: [{ pair: { left: { label: "Central", items: ["One delivery queue", "Central product ownership", "Shared specialist team"] }, right: { label: "Domain", items: ["Local product accountability", "Domain support and upkeep", "Federated shared policy"] } } }, "Set the rules centrally and use platform controls to enforce permissions at the data interface."], claims: ["platform-architecture-and-operating-model-mesh-principles", "platform-architecture-and-operating-model-lakehouse-architecture", "platform-architecture-and-operating-model-mesh-functions"] }),
  ],
  governance: { text: "Central policy defines shared rules; the platform enforces access controls, while domain owners remain accountable for their data products under federated governance.", claims: ["platform-architecture-and-operating-model-lakehouse-architecture", "platform-architecture-and-operating-model-mesh-principles", "platform-architecture-and-operating-model-mesh-functions"] },
  closing: {
    pitfalls: ["Treating a lakehouse as only a storage choice.", "Decentralising ownership without funding domain support.", "Writing central policy without technical enforcement."],
    questions: ["Who owns the orders product and its support?", "Which platform services should every domain reuse?", "Where are shared rules enforced when a consumer reads data?"]
  },
});
