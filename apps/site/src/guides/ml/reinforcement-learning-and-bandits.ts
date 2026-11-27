import { CANVAS, defineGuide, isoGrid, line, note, pill, plot, plotPoint, prism, raise, ride, rule, series, step, table } from "@signal-path/engine";

// Two boards stand on the floor. The left one is what the agent knows: its estimate of the reward of each banner,
// with the true order rates as markers it cannot see. The right one is what the web shop gets: orders per visitor
// as the agent learns. Between them the action rides to the web shop and the reward rides out.
// Every number is computed below from the same illustrative order and click rates.
const G = isoGrid(480, 245, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);

/* ---------- the web shop ---------- */

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const ARMS = ["sofa", "lamp", "rug", "chair"], CHANNELS = ["web", "app"];
const K = ARMS.length, SOFA = 0, LAMP = 1, RUG = 2;
/** Chance that a visitor orders after seeing a banner, by channel. Half the visitors come from each channel. */
const ORDER = [[0.10, 0.06, 0.44, 0.12], [0.10, 0.34, 0.16, 0.12]];
/** Chance that a visitor clicks a banner. The sofa banner draws clicks that rarely end in an order. */
const CLICK = [0.70, 0.40, 0.50, 0.30];
const RATE = ARMS.map((_, a) => (ORDER[0][a] + ORDER[1][a]) / 2);
const VISITORS = 2000, RUNS = 1000, BIN = 50, BINS = VISITORS / BIN;

interface Policy { eps: number; context?: boolean; reward?: "order" | "click" }
interface Visit { channel: number; shown: number; order: number }
interface Run { q: number[][]; n: number[][]; orders: Uint8Array; clicks: Uint8Array; first: Visit[] }
/** One agent meets 2,000 visitors. It keeps the average reward of each banner and shows the highest, or a random one with probability eps. */
function run(p: Policy, seed: number): Run {
  const R = rng(seed), S = p.context ? CHANNELS.length : 1;
  const q = Array.from({ length: S }, () => Array<number>(K).fill(0)), n = Array.from({ length: S }, () => Array<number>(K).fill(0));
  const orders = new Uint8Array(VISITORS), clicks = new Uint8Array(VISITORS), first: Visit[] = [];
  for (let t = 0; t < VISITORS; t++) {
    const channel = R() < 0.5 ? 0 : 1, s = p.context ? channel : 0;
    let shown: number;
    if (R() < p.eps) shown = Math.floor(R() * K);
    else { const top = Math.max(...q[s]), ties = q[s].flatMap((v, a) => (v === top ? [a] : [])); shown = ties[Math.floor(R() * ties.length)]; }
    const click = R() < CLICK[shown] ? 1 : 0, order = click && R() < ORDER[channel][shown] / CLICK[shown] ? 1 : 0;
    const reward = p.reward === "click" ? click : order;
    n[s][shown]++; q[s][shown] += (reward - q[s][shown]) / n[s][shown];
    orders[t] = order; clicks[t] = click;
    if (t < 7) first.push({ channel, shown, order });
  }
  return { q, n, orders, clicks, first };
}
interface Result { orders: [number, number][]; clicks: [number, number][]; mean: number; meanClicks: number }
/** The same policy over many runs: orders and clicks per visitor in bins of 50 visitors, and over all visitors. */
function average(p: Policy): Result {
  const o = Array<number>(BINS).fill(0), c = Array<number>(BINS).fill(0);
  for (let r = 0; r < RUNS; r++) { const x = run(p, 1000 + r); for (let t = 0; t < VISITORS; t++) { o[Math.floor(t / BIN)] += x.orders[t]; c[Math.floor(t / BIN)] += x.clicks[t]; } }
  const curve = (v: number[]) => v.map((s, i) => [(i + 0.5) * BIN, s / (BIN * RUNS)] as [number, number]);
  const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / (VISITORS * RUNS);
  return { orders: curve(o), clicks: curve(c), mean: mean(o), meanClicks: mean(c) };
}
const best = (q: number[]) => q.indexOf(Math.max(...q));
/** The first run in which the policy ends up preferring the wanted banner, so the boards show the typical outcome named in the captions. */
function example(p: Policy, want: (r: Run) => boolean): Run {
  for (let seed = 1; seed < 200; seed++) { const r = run(p, seed); if (want(r)) return r; }
  throw new Error("no example run found");
}

const P_RANDOM: Policy = { eps: 1 }, P_GREEDY: Policy = { eps: 0 }, P_EPS: Policy = { eps: 0.1 };
const P_CTX: Policy = { eps: 0.1, context: true }, P_CLICK: Policy = { eps: 0.1, reward: "click" };
const A_RANDOM = average(P_RANDOM), A_GREEDY = average(P_GREEDY), A_EPS = average(P_EPS), A_CTX = average(P_CTX), A_CLICK = average(P_CLICK);
const X_RANDOM = run(P_RANDOM, 1);
const X_GREEDY = example(P_GREEDY, (r) => best(r.q[0]) === LAMP && r.n[0][RUG] === 0 && r.n[0][LAMP] < VISITORS);
const X_EPS = example(P_EPS, (r) => best(r.q[0]) === RUG);
const X_CTX = example(P_CTX, (r) => best(r.q[0]) === RUG && best(r.q[1]) === LAMP);
const X_CLICK = example(P_CLICK, (r) => best(r.q[0]) === SOFA);

const per100 = (v: number) => String(Math.round(v * 100));
const n2 = (v: number) => v.toFixed(2);
const last = (c: [number, number][]) => c[c.length - 1][1];

/* ---------- the boards ---------- */

const VAL = raise(plot("val", 0, 0, 430, 290, [0.4, 4.6], [0, 0.6], { title: "What the agent estimates", xt: [1, 2, 3, 4], xtl: ARMS, yt: [0, 0.2, 0.4, 0.6], yLabel: "orders per visitor", group: "val" }), F1, 30);
const VALC = raise(plot("valc", 0, 0, 430, 290, [0.4, 4.6], [0, 1], { title: "What the agent estimates", xt: [1, 2, 3, 4], xtl: ARMS, yt: [0, 0.5, 1], yLabel: "clicks per visitor", group: "valc" }), F1, 30);
const REW = raise(plot("rew", 0, 0, 430, 290, [0, VISITORS], [0, 0.45], { title: "What the web shop gets", xt: [0, 500, 1000, 1500, 2000], yt: [0, 0.15, 0.3, 0.45], xLabel: "visitors", yLabel: "orders per visitor", group: "rew" }), F2, 30);
const REWC = raise(plot("rewc", 0, 0, 430, 290, [0, VISITORS], [0, 1], { title: "What the web shop gets", xt: [0, 500, 1000, 1500, 2000], yt: [0, 0.5, 1], xLabel: "visitors", yLabel: "per visitor", group: "rewc" }), F2, 30);

/** The agent's estimates after one run as bars, with how often each banner was shown above them. */
const estimates = (id: string, x: Run, board: typeof VAL, lift: number) => [
  series(`${id}-bars`, board.id, "bars", x.q[0].map((v, a) => [a + 1, v] as [number, number]), { group: id }),
  ...x.n[0].map((n, a) => note(`${id}-n${a}`, ...plotPoint(board, a + 1, Math.max(x.q[0][a], RATE[a]) + lift), `${n.toLocaleString("en-GB")} ×`, { mono: true, anchor: "middle", size: 12, on: board.id, group: id })),
];
/** The line of one policy on the right board, with its name at the end of the line. */
const curve = (id: string, board: typeof REW, pts: [number, number][], name: string, dy: number, extra: Record<string, unknown> = {}) => [
  series(id, board.id, "line", pts, { w: 4, group: id, ...extra }),
  note(`${id}-k`, ...plotPoint(board, 1870, last(pts) + dy), name, { strong: true, anchor: "end", tone: (extra.tone as "ink" | "muted" | "alert" | undefined) ?? "track", on: board.id, group: id }),
];
const headline = (id: string, board: typeof VAL, text: string, tone: "track" | "alert" | "ink" = "track") =>
  note(`${id}-h`, board.x + 52, board.y + 50, text, { strong: true, tone, on: board.id, group: id });
const visit = (v: Visit, i: number) => ({ cells: [String(i + 1), CHANNELS[v.channel], ARMS[v.shown], String(v.order)], hot: v.order === 1 });
const UNIT = VAL.yr[1] / 15, UNITC = VALC.yr[1] / 15;

export default defineGuide({
  id: "reinforcement-learning-and-bandits", track: "ml", module: "Other learning problems", slug: "reinforcement-learning-and-bandits",
  title: "Reinforcement learning and bandits",
  summary: "An agent learns by acting and receiving reward. It has to exploit the actions it knows to be good and explore the ones it has yet to try, and it maximises exactly the reward it is given.",
  forLeads: "The reward is the specification: the agent pursues it literally, so a proxy such as clicks is pursued at the expense of the goal. Exploration is a cost paid by real customers and needs limits.",
  status: "draft", minutes: 7,
  counters: ["Policy", "Visitors explored", "Reward", "Orders per 100 visitors"],
  whatIf: { label: "What if the agent never explored?", step: 1, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Banners, rates and runs are illustrative",
    label: "Two boards with a web shop between them. The left board shows the agent's estimate of the orders each of four banners earns, with the true order rates as markers. The right board shows orders per visitor over 2,000 visitors. A greedy agent locks on to the lamp banner and stays flat. An agent that explores one visitor in ten finds the rug banner and climbs higher. An agent with one estimate per channel climbs above the best single banner. When the reward is changed to clicks, the agent shows the sofa banner, clicks rise and orders fall.",
    els: [
      VAL, VALC,
      series("truth", "val", "points", RATE.map((v, a) => [a + 1, v] as [number, number]), { hue: "sand", r: 6, group: "truth" }),
      series("truth-k", "val", "points", [[2.75, 0.555]], { hue: "sand", r: 6, tone: "muted", label: "true rate, unseen", group: "truth" }),
      headline("none", VAL, "no estimates yet", "ink"),

      ...estimates("greedy", X_GREEDY, VAL, UNIT), headline("greedy", VAL, "greedy"),
      pill("missed", plotPoint(VAL, 3.85, 0.44), "best, never tried", { tone: "alert", to: plotPoint(VAL, 3.1, RATE[RUG] + 0.008), on: "val", group: "greedy" }),
      ...estimates("eps", X_EPS, VAL, UNIT), headline("eps", VAL, "ε-greedy, ε = 0.1"),

      series("ctx-bars", "val", "bars", ARMS.flatMap((_, a) => [[a + 0.8, X_CTX.q[0][a]], [a + 1.2, X_CTX.q[1][a]]] as [number, number][]), { hues: ARMS.flatMap(() => ["sky", "violet"] as const), group: "ctx" }),
      series("ctx-truth", "val", "points", ARMS.flatMap((_, a) => [[a + 0.8, ORDER[0][a]], [a + 1.2, ORDER[1][a]]] as [number, number][]), { hue: "sand", r: 5, group: "ctx" }),
      series("ctx-k0", "val", "points", [[0.75, 0.455]], { hue: "sky", r: 6, tone: "muted", label: "web", group: "ctx" }),
      series("ctx-k1", "val", "points", [[1.35, 0.455]], { hue: "violet", r: 6, tone: "muted", label: "app", group: "ctx" }),
      series("ctx-k2", "val", "points", [[2.75, 0.555]], { hue: "sand", r: 6, tone: "muted", label: "true rate, unseen", group: "ctx" }),
      headline("ctx", VAL, "one estimate per channel"),

      ...estimates("click", X_CLICK, VALC, UNITC), headline("click", VALC, "reward = click", "alert"),
      series("click-truth", "valc", "points", RATE.map((v, a) => [a + 1, v] as [number, number]), { hue: "sand", r: 6, group: "click" }),
      series("click-k", "valc", "points", [[2.75, 0.925]], { hue: "sand", r: 6, tone: "muted", label: "true order rate", group: "click" }),
      pill("bait", plotPoint(VALC, 2.3, 0.72), "fewest orders", { tone: "alert", to: plotPoint(VALC, 1.1, RATE[SOFA] + 0.025), on: "valc", group: "click" }),

      raise(table("log", 0, 0, 400, ["visit", "channel", "banner", "reward"], X_RANDOM.first.map(visit), { at: [18, 100, 200, 310], rowH: 32, mono: true, title: "What the web shop logs", foot: "reward 1 = the visitor ordered", group: "log" }), F2, 30),

      REW, REWC,
      rule("best", "rew", RATE[RUG], { axis: "y", tone: "muted", label: "best single banner", group: "rew" }),
      ...curve("c-greedy", REW, A_GREEDY.orders, "greedy", -0.045, { tone: "ink", w: 3 }),
      ...curve("c-eps", REW, A_EPS.orders, "ε = 0.1", -0.05),
      ...curve("c-eps-back", REW, A_EPS.orders, "no context", -0.05, { tone: "ink", w: 3 }),
      ...curve("c-ctx", REW, A_CTX.orders, "per channel", 0.045),
      ...curve("c-clicks", REWC, A_CLICK.clicks, "clicks, the reward", 0.06),
      ...curve("c-orders", REWC, A_CLICK.orders, "orders, the goal", 0.06, { tone: "alert" }),

      line("act", [F1, G.p(7.1, 7.8)], { always: true }),
      line("out", [G.p(7.8, 7.1), F2], { always: true }),
      prism("shop", 7.1, 7.1, 1.4, 1.4, 30, { hue: "sky", glyph: "globe", title: "Web shop", sub: "the environment", at: "n", always: true }),
      pill("allow", [G.p(2.2, 7.8)[0] - 20, G.p(2.2, 7.8)[1] + 46], "Allowed actions", { tone: "track", glyph: "shield", to: G.p(3.2, 7.8), group: "limits" }),
      pill("replay", [G.p(7.8, 2.2)[0] + 20, G.p(7.8, 2.2)[1] + 46], "Offline replay", { tone: "track", glyph: "replay", to: G.p(7.8, 3.2), group: "limits" }),
    ],
  },
  steps: [
    step({
      id: "no-labels", label: "No labels", kind: "problem", title: "Nobody labels the right action",
      caption: "Vinterhus shows each visitor one of four banners. The only feedback is a reward for the banner shown: 1 for an order, 0 otherwise. No record says which banner was right.",
      show: ["val", "truth", "none", "log"], counters: ["random", "100%", "order", per100(A_RANDOM.mean)],
      rides: [ride("act", 0.15, 0.55, `show ${ARMS[X_RANDOM.first[0].shown]}`), ride("out", 0.35, 0.8, `reward ${X_RANDOM.first[0].order}`)],
      body: ["A model trained with a loss is given the right answer for every example. Here there is none. Reinforcement learning is learning how to map situations to actions so as to maximise a numerical reward signal. The learner is not told which actions to take and must discover which yield the most reward by trying them.",
        "The simplest form is the multi-armed bandit: the learner chooses repeatedly among k actions, each choice returns a reward drawn from a distribution that depends on the action, and the aim is the highest expected total reward over a period. The four banners are the arms.",
        `Shown at random, the banners earn ${per100(A_RANDOM.mean)} orders per 100 visitors. The markers on the left board are the order rates the simulation uses. The agent never sees them.`],
      claims: ["reinforcement-learning-and-bandits-definition", "reinforcement-learning-and-bandits-bandit"],
    }),
    step({
      id: "estimate", label: "Estimate", kind: "idea", title: "The agent averages the reward of each action",
      caption: "The agent keeps each banner's average reward and always shows the highest, the greedy action. Lamp earned the first order, so nothing else is shown again and rug is never tried.",
      show: ["val", "truth", "greedy", "rew", "c-greedy"], counters: ["greedy", "0%", "order", per100(A_GREEDY.mean)],
      rides: [ride("act", 0.15, 0.55, "show lamp"), ride("c-greedy", 0, 1, "")],
      body: ["The value of an action is the expected reward when it is selected. The sample-average method estimates it by averaging the rewards actually received when the action was taken. Each bar is one such average, and the number above it is how often the banner was shown.",
        "Greedy action selection always exploits current knowledge to maximise immediate reward. It spends no time sampling apparently inferior actions to see if they might really be better.",
        { callout: { label: "Key idea", text: "An estimate only improves for the actions the agent takes. An action it stops taking keeps its old estimate, right or wrong." } },
        `In this run every estimate starts at zero, so the first banner to earn an order becomes the greedy action and stays it. Over ${RUNS.toLocaleString("en-GB")} simulated runs the greedy agent earns ${per100(A_GREEDY.mean)} orders per 100 visitors, against ${per100(RATE[RUG])} for the rug banner alone. On Sutton and Barto's 10-armed testbed the greedy method found the optimal action in only approximately one-third of the tasks.`],
      claims: ["reinforcement-learning-and-bandits-sample-average", "reinforcement-learning-and-bandits-greedy", "reinforcement-learning-and-bandits-testbed"],
    }),
    step({
      id: "explore", label: "Explore", kind: "mechanism", title: "Exploring tests the other actions",
      caption: "An ε-greedy agent shows a random banner to one visitor in ten and the greedy one to the rest. Reward is lower at first, then higher once rug is found.",
      show: ["val", "truth", "eps", "rew", "c-greedy", "c-eps"], counters: ["ε-greedy", "10%", "order", per100(A_EPS.mean)],
      rides: [ride("act", 0.15, 0.55, "show rug"), ride("c-eps", 0, 1, "")],
      body: ["The agent has to exploit what it has already experienced in order to obtain reward, but it also has to explore in order to make better action selections in the future. Neither can be pursued exclusively without failing at the task.",
        "An ε-greedy method behaves greedily most of the time and, with small probability ε, selects randomly from among all the actions with equal probability. Reward is lower in the short run, during exploration, but higher in the long run, because the better actions it discovers can then be exploited many times.",
        { callout: { label: "What changed", text: `Orders rose from ${per100(A_GREEDY.mean)} to ${per100(A_EPS.mean)} per 100 visitors. One visitor in ten still sees a random banner, which is why the line stays under the best single banner.` } },
        "ε-greedy tries the non-greedy actions indiscriminately. Upper confidence bound action selection chooses among them by how close their estimates are to the maximum and how uncertain those estimates are."],
      claims: ["reinforcement-learning-and-bandits-dilemma", "reinforcement-learning-and-bandits-epsilon", "reinforcement-learning-and-bandits-explore-cost", "reinforcement-learning-and-bandits-ucb"],
    }),
    step({
      id: "context", label: "Context", kind: "mechanism", title: "A policy maps each situation to an action",
      caption: "Web visitors order most after the rug banner, app visitors after the lamp. A contextual bandit keeps estimates per channel and beats the best single banner.",
      show: ["val", "ctx", "rew", "c-eps-back", "c-ctx"], counters: ["contextual ε-greedy", "10%", "order", per100(A_CTX.mean)],
      rides: [ride("act", 0.15, 0.55, "app: lamp"), ride("c-ctx", 0, 1, "")],
      body: ["A contextual bandit learns a policy: a mapping from situations to the actions that are best in those situations. Each action still affects only the immediate reward. Li and colleagues modelled personalised news article recommendation this way, selecting articles from contextual information about users and articles and adapting from click feedback.",
        "If actions also affect the next situation, the task is the full reinforcement learning problem. Reward then says what is good immediately, and a value function says what is good in the long run: the total reward the agent can expect to accumulate from a state onward.",
        "Two families of method follow. Action-value methods learn the values of actions and select actions from those estimates. Q-learning is one, and its learned action-value function directly approximates the optimal one. Policy gradient methods instead learn a parameterised policy that can select actions without consulting a value function."],
      claims: ["reinforcement-learning-and-bandits-contextual", "reinforcement-learning-and-bandits-news", "reinforcement-learning-and-bandits-value-function", "reinforcement-learning-and-bandits-value-policy"],
    }),
    step({
      id: "reward", label: "Wrong reward", kind: "watch-out", title: "The agent maximises the reward it is given",
      caption: "The reward is changed to clicks. The sofa banner draws the most clicks and the fewest orders. The agent shows it to nearly every visitor, and orders fall.",
      show: ["valc", "click", "rewc", "c-clicks", "c-orders"], counters: ["ε-greedy", "10%", "click", per100(A_CLICK.mean)],
      rides: [ride("act", 0.15, 0.55, "show sofa"), ride("c-orders", 0, 1, "", { tone: "alert" })],
      body: ["The agent always learns to maximise its reward, so it is critical that the rewards truly indicate what is to be accomplished. If a subgoal is rewarded, the agent might find a way to achieve it without achieving the real goal.",
        `Here clicks reach ${per100(A_CLICK.meanClicks)} per 100 visitors while orders fall to ${per100(A_CLICK.mean)}, below the ${per100(A_RANDOM.mean)} that random banners earned. The agent did what the reward asked.`,
        "Formal rewards are an attempt to capture the designer's informal intent, and can be gamed by solutions that are valid in a literal sense but do not meet that intent. A measure can seem highly correlated with the task until it is strongly optimised. Reinforcement learning agents can discover unexpected ways to make their environments deliver reward, some of which might be undesirable, or even dangerous."],
      claims: ["reinforcement-learning-and-bandits-reward-goal", "reinforcement-learning-and-bandits-reward-hacking", "reinforcement-learning-and-bandits-reward-unexpected"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "How much to explore",
      caption: "",
      show: ["val", "ctx", "rew", "c-eps-back", "c-ctx", "limits"], counters: ["contextual ε-greedy", "10%", "order", per100(A_CTX.mean)],
      rides: [ride("c-ctx", 1, 1, "")],
      body: [{ pair: {
        left: { label: "Explore more", items: ["Finds better actions sooner", "More visitors see worse actions"] },
        right: { label: "Explore less", items: ["More reward now", "A better action can stay unfound"] },
      } },
        "On Sutton and Barto's testbed an ε of 0.1 usually found the optimal action earlier but never selected it more than 91% of the time. An ε of 0.01 improved more slowly but eventually would perform better. ε can also be reduced over time.",
        "Exploration takes actions whose consequences the agent does not understand well, and ε-greedy makes no attempt to avoid dangerous ones. Projects often hard-code an avoidance of catastrophic behaviours, or let the agent run freely only within bounds where the worst action can be recovered from. Potentially unsafe actions can also be checked with a human.",
        "Offline evaluation of a new bandit algorithm protects the online user experience. It is hard because the log holds the reward only for the action that was shown. Li and colleagues replay logged traffic in which actions were chosen at random, a data-driven method that can provide provably unbiased evaluations."],
      claims: ["reinforcement-learning-and-bandits-epsilon-rate", "reinforcement-learning-and-bandits-explore-cost", "reinforcement-learning-and-bandits-safe-exploration", "reinforcement-learning-and-bandits-bounded", "reinforcement-learning-and-bandits-offline"],
    }),
  ],
  governance: { text: "Exploration takes actions whose consequences the agent does not understand well, so it is bounded: unsafe actions are excluded in code and a new policy is evaluated offline on logged traffic before it meets users. A reward that does not truly indicate the goal produces behaviour the designer did not intend.", claims: ["reinforcement-learning-and-bandits-safe-exploration", "reinforcement-learning-and-bandits-bounded", "reinforcement-learning-and-bandits-offline", "reinforcement-learning-and-bandits-reward-goal"] },
  closing: {
    pitfalls: [
      "Rewarding a proxy such as clicks and expecting the goal to follow.",
      "Switching exploration off once the first good action is found.",
      "Letting the agent explore actions that cannot be undone.",
    ],
    questions: [
      "Why does a greedy agent miss the best action?",
      "What does exploration cost, and who pays it?",
      "What separates a contextual bandit from the full reinforcement learning problem?",
    ],
  },
});
