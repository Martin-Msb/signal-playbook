import { CANVAS, defineGuide, drum, isoGrid, line, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Row } from "@signal-path/engine";

// The floor: a cross of rail with the router at its centre. Support's refund chats come in from the top left.
// The large tier stands at the top right and the small tier at the bottom right, sized by tier.
// The evaluation run waits at the bottom left and reaches the large tier through the batch queue.
// The prompt cache sits beside the inbound rail, and the day's bill stands in front.
// Day's volume, illustrative: chat 4.0M input tokens, of which 3.0M are the repeated instructions, and 0.5M output tokens.
// The evaluation run is 0.5M input and 0.1M output tokens on the large tier.
const G = isoGrid(480, 236, 30);
const ARM = 10, TOP = 8.5;
const K = "cost-latency-and-model-choice";
const BILL: Row[] = [["all on Opus 5.5", "$26.00"], ["all on Haiku 5.5", "$0.65"], ["routed 80 / 20", "$5.72"], ["routed and cached", "$3.22"]];
/** The day's chat bill after the first n setups, the latest one lit. */
const bill = (n: number): El =>
  raise(table(`bill${n}`, 0, 0, 214, ["chat setup", "per day"], BILL.slice(0, n).map((r, i) => (i === n - 1 ? { cells: r as string[], hot: true } : r)),
    { at: [12, 152], rowH: 21, title: "Chat bill", group: `bill${n}` }), [480, 500], 24);

export default defineGuide({
  id: K, track: "ai", module: "The model call", slug: K,
  title: "Cost, latency and model choice",
  summary: "The model tier, the number of tokens and where the model runs set what a request costs and how long it takes. Routing, prompt caching and batching lower both without changing the task.",
  forLeads: "The same workload can cost forty times more or less depending on the tier it is sent to. Spend limits, rate limits and a tested fallback model are the controls that keep the bill and the dependency bounded.",
  status: "draft", minutes: 7,
  counters: ["Chat goes to", "Chat bill per day", "Evaluation run", "Limits and fallback"],
  whatIf: { label: "What if every chat went to the small tier?", step: 1, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Volumes and shares are illustrative. List prices on the check date.",
    label: "Support's refund chats travel down a rail to a large model, and the day's bill stands in front. A small, cheaper and faster model appears on a second arm. A router at the crossing then sends easy chats to the small model and hard ones to the large model. A prompt cache beside the inbound rail holds the repeated instructions. The nightly evaluation run reaches the large model through a batch queue at half price. At the last stop spend and rate limits are marked, the large model carries a retirement notice, and an open-weight model on Vinterhus's own endpoint stands as the fallback.",
    els: [
      line("large", [G.p(-ARM, 0), G.p(0, 0), G.p(0, -TOP)], { always: true }),
      line("small", [G.p(-ARM, 0), G.p(ARM, 0)], { group: "tiers" }),
      stop("s-start", ...G.p(-7.9, 0), undefined, undefined, { always: true }),
      stop("s-router", ...G.p(-2.2, 0), undefined, undefined, { always: true }),
      stop("s-large", ...G.p(0, -4.3), undefined, undefined, { always: true }),
      stop("s-small", ...G.p(7.2, 0), undefined, undefined, { group: "tiers" }),
      prism("support", -ARM - 0.7, -0.7, 1.4, 1.4, 26, { hue: "paper", glyph: "user", title: "Support", sub: "refund assistant", at: "sw", always: true }),
      prism("opus", -0.9, -TOP - 0.9, 1.8, 1.8, 44, { hue: "violet", glyph: "net", title: "Claude Opus 5.5", sub: "$4 in, $20 out per MTok", at: "e", always: true }),
      prism("haiku", ARM - 0.55, -0.55, 1.1, 1.1, 22, { hue: "violet", glyph: "net", title: "Claude Haiku 5.5", sub: "$0.10 in, $0.50 out per MTok", at: "s", group: "tiers" }),
      pill("fails", [950, 290], "hard cases fail", { glyph: "x", tone: "alert", sub: "in evaluation", anchor: "end", to: G.p(ARM, -0.6, 22), group: "weak" }),

      prism("router", -0.7, -0.7, 1.4, 1.4, 28, { hue: "track", glyph: "split", title: "Router", sub: "picks a model per request", at: "n", group: "router" }),

      line("to-cache", [G.p(-6, 0), G.p(-6, -1.9)], { w: 5, group: "cache" }),
      stop("s-cache", ...G.p(-6, 0), undefined, undefined, { group: "cache" }),
      drum("cache", -6, -2.6, 0.8, 26, { hue: "sky", glyph: "save", title: "Prompt cache", sub: "instructions, read at 0.1x", at: "n", group: "cache" }),

      line("batch", [G.p(0, ARM), G.p(0, 0), G.p(0, -TOP)], { group: "batch" }),
      stop("s-eval", ...G.p(0, 7.9), undefined, undefined, { group: "batch" }),
      stop("s-wait", ...G.p(0, 2.6), undefined, undefined, { group: "batch" }),
      prism("eval", -0.7, ARM - 0.7, 1.4, 1.4, 26, { hue: "sand", glyph: "check", title: "Evaluation run", sub: "nightly, can wait", at: "sw", group: "batch" }),
      prism("queue", -0.6, 4.6, 1.2, 1.2, 20, { hue: "sand", glyph: "clock", title: "Batch queue", sub: "half price, within 24 h", at: "w", group: "batch" }),

      line("spur", [G.p(0, 0), G.p(5, 0), G.p(5, -4.6)], { group: "fallback" }),
      stop("s-self", ...G.p(5, -1.5), undefined, undefined, { group: "fallback" }),
      prism("self", 4.3, -5.3, 1.4, 1.4, 22, { hue: "mint", glyph: "net", title: "Open-weight model", sub: "own endpoint, vLLM", at: "n", group: "fallback" }),
      pill("c-spend", [34, 196], "Monthly spend limit", { glyph: "lock", anchor: "start", group: "caps" }),
      pill("c-rate", [34, 238], "Tokens per minute", { glyph: "lock", anchor: "start", group: "caps" }),
      pill("c-retire", [560, 36], "Retirement notice", { glyph: "clock", sub: "at least 60 days", to: G.p(-0.9, -TOP + 0.9, 34), group: "caps" }),

      bill(1), bill(2), bill(3), bill(4),
    ],
  },
  steps: [
    step({
      id: "one-model", label: "One model", kind: "problem", title: "Every request goes to one large model",
      caption: "Support's refund assistant sends every chat to Claude Opus 5.5, at $4 per million input tokens and $20 per million output tokens. The day costs $26.00.",
      show: ["bill1"], counters: ["Opus 5.5", "$26.00", "$4.00, immediate", "none"],
      rides: [ride("large", "s-start", "s-large", "refund chat", { via: ["s-router"], then: "$4 in, $20 out" })],
      body: ["The day is 4.0 million input tokens and 0.5 million output tokens. At the list price that is $16.00 for input and $10.00 for output.",
        "Latency is the time it takes a model to process a prompt and generate an output. The size of the model, the complexity of the prompt and the infrastructure behind it all influence it.",
        "Choosing a model means balancing capabilities, speed and cost. Anthropic describes two starting points: a faster, more cost-effective model that is upgraded only for specific capability gaps, or a more capable model that is optimised to a more efficient one later."],
      claims: [`${K}-prices`, `${K}-latency`, `${K}-criteria`],
    }),
    step({
      id: "tiers", label: "Tiers", kind: "idea", title: "The tier and the token count set price and speed",
      caption: "Claude Haiku 5.5 lists $0.10 and $0.50, and Anthropic names it for the lowest latency. The same day costs $0.65, and the hard refund cases fail evaluation.",
      show: ["tiers", "weak", "bill2"], counters: ["Haiku 5.5", "$0.65", "$4.00, immediate", "none"],
      rides: [ride("small", "s-start", "s-small", "refund chat", { via: ["s-router"], then: "$0.10, $0.50" })],
      body: ["The bill is tokens multiplied by the price of the tier: 4.0 million input tokens at $0.10 and 0.5 million output tokens at $0.50. The Haiku 5.5 prices shown apply to prompts up to 100,000 tokens. Longer prompts pay $0.50 and $2.50.",
        "Token count sets speed as well as price. The fewer tokens the model has to process and generate, the faster the response.",
        { callout: { label: "Measure it", text: "Time to first token is the time from sending the prompt to the first token of the response. Streaming sends the response before the full output is complete, so it is the measure a reader of a chat feels." } },
        "To decide whether to change models, Anthropic advises benchmark tests specific to the use case, run on actual prompts and data, comparing accuracy, response quality and edge cases before weighing cost."],
      claims: [`${K}-prices`, `${K}-fastest-tier`, `${K}-fewer-tokens`, `${K}-ttft`, `${K}-test-switch`],
    }),
    step({
      id: "routing", label: "Routing", kind: "mechanism", title: "A router picks a model for each request",
      caption: "Routing sends the easy 80 percent of chats to the small tier and the hard cases to the large one. Most tokens are billed at the lower rate.",
      show: ["tiers", "router", "bill3"], counters: ["80% Haiku, 20% Opus", "$5.72", "$4.00, immediate", "none"],
      rides: [ride("small", "s-start", "s-small", "4471 status", { via: ["s-router"], then: "small tier" }), ride("large", "s-start", "s-large", "4480 dispute", { via: ["s-router"], then: "large tier" })],
      body: ["Multimodel strategies pair a lower-cost model with a frontier model so that most tokens are billed at the lower rate. Here 80 percent of the day costs $0.52 on Haiku 5.5 and 20 percent costs $5.20 on Opus 5.5.",
        "RouteLLM trains router models that select between a stronger and a weaker model during inference to balance cost and response quality. Its authors report cost reductions of over 2 times in certain cases without compromising the quality of responses.",
        { callout: { label: "Watch out", text: "Anthropic advises tuning one model before adding a second, and building a pairing only if it beats the single model's whole curve of score against spend." } }],
      claims: [`${K}-multimodel`, `${K}-routing`, `${K}-tune-first`, `${K}-prices`],
    }),
    step({
      id: "caching", label: "Caching", kind: "mechanism", title: "Prompt caching reuses the repeated prefix",
      caption: "The assistant's instructions open every request. Read from the cache, they cost a tenth of the input price or less, and the model spends less time processing them.",
      show: ["tiers", "router", "cache", "bill4"], counters: ["80% Haiku, 20% Opus", "$3.22", "$4.00, immediate", "none"],
      rides: [ride("small", "s-start", "s-small", "instructions", { via: ["s-cache", "s-router"], then: "cache read" })],
      body: ["Prompt caching lets the API resume from a specific prefix of the prompt, which reduces processing time and cost for prompts with consistent elements. Reuse requires the entire prefix to match, so stable instructions and shared reference material go first.",
        "On the Claude API a cache read costs 0.1 times the base input price on most models and 0.05 times on Claude Opus 5.5: $0.01 per million tokens on Haiku 5.5 and $0.20 on Opus 5.5. Of the day's 4.0 million input tokens, 3.0 million are the repeated instructions.",
        "A 5-minute cache write costs 1.25 times the base input price, so caching saves money after one cache read. The bill leaves the few writes out. The cache lasts 5 minutes by default, is refreshed at no additional cost each time it is used, and can be extended to 1 hour at additional cost.",
        { callout: { label: "Throughput", text: "The Claude API's default input tokens per minute limits count only uncached input tokens. Tokens read from the cache do not count." } }],
      claims: [`${K}-cache`, `${K}-cache-price`, `${K}-cache-life`, `${K}-cache-rate`],
    }),
    step({
      id: "batching", label: "Batching", kind: "watch-out", title: "Batch work is half price and not immediate",
      caption: "The nightly evaluation run can wait, so it goes through the Message Batches API at half price. Most batches finish within an hour. One unfinished after 24 hours expires.",
      show: ["tiers", "router", "cache", "batch", "bill4"], counters: ["80% Haiku, 20% Opus", "$3.22", "$2.00, within 24 h", "none"],
      rides: [ride("batch", "s-eval", "s-large", "600 cases", { via: ["s-wait"], then: "$2.00" })],
      body: ["The Message Batches API processes large volumes of requests asynchronously and suits tasks that do not require immediate responses. Results come back as a single file, not a stream, so a live chat cannot use it.",
        "Batch usage is charged at 50 percent of standard prices: $2 per million input tokens and $10 per million output tokens on Claude Opus 5.5. The run's 0.5 million input tokens and 0.1 million output tokens cost $2.00 in place of $4.00.",
        "OpenAI's Batch API states the same terms: a 50 percent cost discount compared to synchronous APIs, completion within 24 hours, and running evaluations as an intended use."],
      claims: [`${K}-batch`, `${K}-batch-price`, `${K}-batch-time`],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Choose the deployment and set the limits",
      caption: "",
      show: ["tiers", "router", "cache", "batch", "fallback", "caps", "bill4"], counters: ["80% Haiku, 20% Opus", "$3.22", "$2.00, within 24 h", "spend, rate, fallback"],
      rides: [ride("spur", 0.12, "s-self", "4480 dispute", { then: "fallback" })],
      body: [{ pair: {
        left: { label: "Hosted API", items: ["Priced per token", "Provider sets rate limits", "Models retire on notice"] },
        right: { label: "Open weights, own endpoint", items: ["Billed per instance hour", "Served through vLLM", "Fallback for a retired model"] },
      } },
        "Spend limits set a maximum monthly cost for an organisation, and rate limits cap requests, input tokens and output tokens per minute. Both can be set lower for each workspace. OWASP lists rate limiting, user quotas, timeouts and throttling as mitigations for unbounded consumption.",
        "Anthropic regularly retires older models and gives at least 60 days' notice for publicly released ones. Requests to a retired model fail. Claude Opus 5.5 is listed as active, with retirement not sooner than September 22, 2027.",
        "Open-weight models such as OpenAI's gpt-oss series can be downloaded and served on an endpoint the team controls. vLLM serves them through an OpenAI-compatible API with continuous batching of incoming requests. OpenAI states that gpt-oss-120b fits into a single 80 GB GPU and gpt-oss-20b runs within 16 GB of memory.",
        "A dedicated endpoint is billed for the hours its instance runs, not for the tokens it serves. Hugging Face Inference Endpoints charge an hourly rate for the instance type, calculated by the minute.",
        { callout: { label: "Fallback", text: "The NIST Generative AI Profile suggests documenting value chain risks to identify fallbacks, and testing and managing rollover and fallback technologies." } }],
      claims: [`${K}-spend-limits`, `${K}-rate-limits`, `${K}-unbounded`, `${K}-retirement`, `${K}-retirement-notice`, `${K}-open-weight`, `${K}-open-weight-size`, `${K}-instance-hours`, `${K}-fallbacks`],
    }),
  ],
  governance: { text: "Spend limits cap the monthly cost and rate limits cap requests and tokens per minute, which bounds consumption per workspace. A model on a hosted API retires on the provider's schedule, so reliance on it is managed with a tested fallback and migration before the retirement date.", claims: [`${K}-spend-limits`, `${K}-rate-limits`, `${K}-unbounded`, `${K}-retirement`, `${K}-fallbacks`] },
  closing: {
    pitfalls: [
      "Sending every request to the largest model because it passed the first test.",
      "Changing the start of a prompt on every request, which defeats the prompt cache.",
      "Running work that can wait through the synchronous API at full price.",
    ],
    questions: [
      "Which three choices set the price and the speed of a request?",
      "Why does a cached prefix lower both cost and latency?",
      "What must be in place before a hosted model reaches its retirement date?",
    ],
  },
});
