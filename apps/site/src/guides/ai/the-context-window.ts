import { CANVAS, defineGuide, isoGrid, line, pill, prism, ride, step, stop, tank } from "@signal-path/engine";
import type { TankEl } from "@signal-path/engine";

// The floor: five kinds of content board one rail into the context window, a glass tank that fills.
// The model stands past the window and its reply rides back into the same tank.
const G = isoGrid(70, 72, 30);
type Seg = TankEl["segs"][number];
const win = (id: string, segs: Seg[]) => tank(id, 13.4, -1, 2, 2, 170, 100, segs, { title: "Context window", limit: "limit 100", group: id });
const IN = [0.4, 2.1, 3.8, 5.5, 7.7];
const input = (i: number, label: string) => stop(`in${i}`, ...G.p(IN[i], 0), label, undefined, { at: i % 2 || i === 4 ? "sw" : "ne", always: true });
const model = (id: string, sub: string, state?: "alert") => prism(id, 23, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", sub, at: "s", state, group: id });
const tools: Seg = { label: "tool definitions 12", value: 12, hue: "sand" };
const system: Seg = { label: "instructions 12", value: 12, hue: "ink" };
const reply: Seg = { label: "reply 10", value: 10, hue: "mint" };

export default defineGuide({
  id: "the-context-window", track: "ai", module: "The model call", slug: "the-context-window",
  title: "The context window",
  summary: "Everything a model reads and writes in one call shares a finite context window. Each call resends the conversation so far, and recall degrades as the window fills.",
  forLeads: "The context window is a working limit, not durable memory. Teams choose what to include, what to cache, and what to retain in request histories and logs.",
  status: "draft", minutes: 7,
  counters: ["Content in window", "Turns resent", "Window used", "Recall"],
  whatIf: { label: "What if every old turn stayed?", step: 4, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "The conversation and capacity units are illustrative",
    label: "Five kinds of content board one line into a context window drawn as a glass tank with a fixed limit. A model stands past the window and its reply rides back into the same tank. Across the steps the tank fills with instructions, tool definitions, conversation history and tool results until it reaches its limit, then empties when only the needed turns are sent.",
    els: [
      line("in", [G.p(0, 0), G.p(13.4, 0)], { always: true }),
      input(0, "instructions"), input(1, "tool definitions"), input(2, "earlier turns"), input(3, "latest message"), input(4, "tool results"),
      stop("dock", ...G.p(10.3, 0), undefined, undefined, { always: true }),
      line("out", [G.p(15.4, 0), G.p(23, 0)], { always: true }),
      stop("p-out", ...G.p(21.4, 0), undefined, undefined, { always: true }),
      stop("p-back", ...G.p(19.3, 0), undefined, undefined, { always: true }),
      model("m-ok", "reads the whole window"),
      model("m-rot", "misses early details", "alert"),
      win("w-first", [{ label: "question 12", value: 12, hue: "sky", hot: true }]),
      win("w-small", [system, { label: "question 12", value: 12, hue: "sky" }, { ...reply, hot: true }]),
      win("w-history", [system, { label: "history 38", value: 38, hue: "violet", hot: true }, { label: "question 14", value: 14, hue: "sky" }, reply]),
      win("w-tool", [{ ...tools, hot: true }, system, { label: "history 38", value: 38, hue: "violet" }, { label: "tool results 18", value: 18, hue: "sky", hot: true }, reply]),
      win("w-full", [tools, system, { label: "history 48", value: 48, hue: "violet", hot: true }, { label: "tool results 18", value: 18, hue: "sky" }, reply]),
      win("w-lean", [{ label: "tool definitions 6", value: 6, hue: "sand" }, system, { label: "needed turns 16", value: 16, hue: "violet", hot: true }, { label: "tool results 8", value: 8, hue: "sky" }, reply]),
      pill("resent", [716, 130], "resent on every call", { tone: "track", anchor: "start", group: "resent" }),
      pill("cache", [716, 130], "cached prefix still counts", { tone: "track", anchor: "start", group: "cache" }),
      pill("limit", [716, 130], "no room for the next turn", { tone: "alert", anchor: "start", group: "limit" }),
      pill("lean", [716, 130], "headroom kept", { tone: "track", anchor: "start", group: "lean" }),
    ],
  },
  steps: [
    step({
      id: "empty", label: "One call", kind: "problem", title: "The window starts with only what the call sends",
      caption: "Support sends one question about return 4471. Nothing else is in the window, so nothing else can inform the answer.",
      show: ["w-first", "m-ok"], counters: ["one question", "0", "12 of 100", "nothing to recall"],
      rides: [ride("in", "in3", "dock", "question")],
      body: ["The context window is all the text a model can reference when generating a response, including the response itself. Anthropic describes it as the model's working memory, distinct from the data the model was trained on.",
        "The Vinterhus conversation and the capacity units in this picture are illustrative."],
      claims: ["the-context-window-contents"],
    }),
    step({
      id: "capacity", label: "One window", kind: "idea", title: "Input and output share one finite window",
      caption: "Instructions and the question enter the window. The reply the model generates lands in the same window and counts against the same limit.",
      show: ["w-small", "m-ok"], counters: ["request + reply", "0", "34 of 100", "intact"],
      rides: [ride("in", "in0", "dock", "instructions"), ride("out", "p-out", "p-back", "reply")],
      body: ["In the Anthropic Messages API everything in the request counts toward the context window: the system prompt, every message including tool results, images and documents, and the tool definitions. The output generated for the turn counts too.",
        { callout: { label: "Context limits", text: "Anthropic lists the models that have a 1M-token context window and gives other Claude models 200k tokens. If the input alone exceeds the window, the API returns a 400 error." } }],
      claims: ["the-context-window-contents", "the-context-window-limit"],
    }),
    step({
      id: "history", label: "History", kind: "mechanism", title: "Every call resends the whole conversation",
      caption: "The API keeps no conversation. Each call carries all earlier turns plus the new question, and each reply becomes input to the next call.",
      show: ["w-history", "m-ok", "resent"], counters: ["+ four earlier turns", "4", "74 of 100", "intact"],
      rides: [ride("in", "in2", "dock", "4 earlier turns", { via: ["in3"], then: "turns + new" }), ride("out", "p-out", "p-back", "reply")],
      body: ["The Anthropic Messages API is stateless, so the application always sends the full conversational history. Each turn's input contains all previous conversation history plus the current user message, previous turns are preserved completely, and the generated response becomes part of the input for the next turn.",
        "Chat interfaces such as claude.ai can instead manage the window on a rolling first in, first out basis, so an application has to know which behaviour it is getting."],
      claims: ["the-context-window-stateless", "the-context-window-history", "the-context-window-interface"],
    }),
    step({
      id: "shared", label: "Shared space", kind: "mechanism", title: "Tools and cached content use the same space",
      caption: "Tool definitions and tool results join the history. Prompt caching lets the API resume from a repeated prefix, which cuts cost and processing time but frees no space.",
      show: ["w-tool", "m-ok", "cache"], counters: ["+ tools", "4", "90 of 100", "intact"],
      rides: [ride("in", "in1", "dock", "tool definitions", { via: ["in4"], then: "+ results" })],
      body: ["Anthropic describes prompt caching as letting the API resume from specific prefixes in a prompt, which reduces processing time and costs for prompts with consistent elements. The cached prefix covers tools, system and messages, in that order.",
        "Cached prompt prefixes still occupy the context window. Caching changes what those tokens cost, not whether they count."],
      claims: ["the-context-window-contents", "the-context-window-cache"],
    }),
    step({
      id: "recall", label: "Recall", kind: "watch-out", title: "Recall falls as the window fills",
      caption: "Forty turns in, the window is at its limit and the model misses the return terms from the first turns. A larger window raises the limit, not the reliability.",
      show: ["w-full", "m-rot", "limit"], counters: ["everything so far", "40", "100 of 100", "degraded"],
      rides: [ride("in", "in2", "dock", "40 turns"), ride("out", "p-out", "p-back", "reply", { then: "terms missed", tone: "alert" })],
      body: ["Anthropic states that as token count grows, accuracy and recall degrade, a phenomenon known as context rot. A larger context window lets a model handle longer prompts, but more context is not automatically better.",
        { callout: { label: "Long-context models", text: "A long-context model moves the limit. Curating what is in context matters as much as how much space is available." } }],
      claims: ["the-context-window-rot", "the-context-window-limit"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Send only the context the task needs",
      caption: "",
      show: ["w-lean", "m-ok", "lean"], counters: ["needed context", "6", "52 of 100", "intact"],
      rides: [ride("in", "in2", "dock", "needed turns")],
      body: [{ pair: {
        left: { label: "Include", items: ["The turns in use", "Tool results the answer needs", "A cached, stable prefix"] },
        right: { label: "Control", items: ["Drop unneeded history", "Limit who can read logged context", "Set retention for request logs"] },
      } }, "Conversation history often holds customer personal data. The EU GDPR requires personal data to be limited to what is necessary for its purpose, kept no longer than necessary and processed with appropriate security. Those rules apply to what is sent as context and to what is logged."],
      claims: ["the-context-window-gdpr", "the-context-window-rot"],
    }),
  ],
  governance: { text: "Data minimisation applies to context: the EU GDPR limits personal data to what is necessary for the purpose. Logged context is personal data too, so it needs a retention period and appropriate security.", claims: ["the-context-window-gdpr"] },
  closing: {
    pitfalls: [
      "Expecting the model to recall a turn the application did not send.",
      "Assuming a cached prefix no longer uses context capacity.",
      "Treating a larger context window as a guarantee of better recall.",
    ],
    questions: [
      "Which parts of a call count toward the context window?",
      "Why does every call include the earlier turns?",
      "How do data minimisation and retention apply to logged context?",
    ],
  },
});
