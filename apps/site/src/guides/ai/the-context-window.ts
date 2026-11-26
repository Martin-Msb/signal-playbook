import { CANVAS, defineGuide, isoGrid, line, pill, prism, ride, step, stop, tank } from "@signal-path/engine";

const G = isoGrid(70, 120, 30);
const win = (id: string, segs: Parameters<typeof tank>[7]) => tank(id, 10.8, -1, 2, 2, 170, 100, segs, { title: "Context window", limit: "100 units", group: id });
const inputs = [0.5, 2.4, 4.3, 6.2, 8.4];
const input = (i: number, label: string) => stop(`in${i}`, ...G.p(inputs[i], 0), label, undefined, { at: i % 2 ? "sw" : "ne", always: true });
const model = (id: string, sub: string, group: string) => prism(id, 18.5, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", sub, at: "s", group });

export default defineGuide({
  id: "the-context-window", track: "ai", module: "The model call", slug: "the-context-window",
  title: "The context window",
  summary: "A model can use only what fits in its context window. Each API turn includes the conversation so far and the answer it generates; as that context grows, recall can weaken.",
  forLeads: "The context window is a working limit, not durable memory. Teams choose what to include, what to cache, and what to retain in request histories and logs.",
  status: "draft", minutes: 7,
  counters: ["Content in window", "Conversation turns", "Capacity", "Recall"],
  whatIf: { label: "What if every old turn stayed?", step: 2, from: 4 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "The conversation and capacity units are illustrative",
    label: "Conversation content boards a rail into a finite context window, then a model returns its reply. Each API turn resends the history and adds the latest message. The window fills with instructions, messages, tool definitions, results and output. A cache can reuse a prefix, but it still occupies the window.",
    els: [
      line("in", [G.p(0, 0), G.p(10.8, 0)], { always: true }),
      input(0, "instructions"), input(1, "earlier turns"), input(2, "latest message"), input(3, "tool results"), input(4, "reply"),
      stop("p-window", ...G.p(10.8, 0), "Window", "finite capacity", { always: true }),
      line("out", [G.p(12.8, 0), G.p(18.5, 0)], { always: true }),
      stop("p-model", ...G.p(15.8, 0), "Model", "reads context", { always: true }),
      model("m-first", "latest message only", "first"),
      model("m-call", "one response", "call"),
      model("m-cache", "prefix reused", "cache"),
      model("m-rot", "details missed", "rot"),
      win("w-first", [{ label: "question", value: 12, hue: "sky" }]),
      win("w-small", [{ label: "instructions", value: 12, hue: "ink" }, { label: "question", value: 12, hue: "sky" }, { label: "reply", value: 10, hue: "mint" }]),
      win("w-history", [{ label: "instructions", value: 12, hue: "ink" }, { label: "history", value: 38, hue: "violet" }, { label: "new turn", value: 14, hue: "sky" }, { label: "reply", value: 10, hue: "mint" }]),
      win("w-tool", [{ label: "instructions", value: 12, hue: "ink" }, { label: "history", value: 38, hue: "violet" }, { label: "tool setup", value: 12, hue: "sand" }, { label: "tool result", value: 18, hue: "sky" }, { label: "reply", value: 10, hue: "mint" }]),
      win("w-full", [{ label: "instructions", value: 12, hue: "ink" }, { label: "history", value: 46, hue: "violet", hot: true }, { label: "tool setup", value: 12, hue: "sand" }, { label: "tool result", value: 20, hue: "sky" }, { label: "reply", value: 10, hue: "mint" }]),
      pill("cache", [520, 190], "cached prefix", { tone: "track", group: "cache" }),
      pill("miss", [765, 183], "missed return detail", { tone: "alert", group: "rot" }),
    ],
  },
  steps: [
    step({
      id: "missing", label: "Missing", kind: "problem", title: "A model only sees the request it receives",
      caption: "Support asks about a return, but sends only the latest question. The model cannot use the order details from an earlier message that is absent from the request.",
      show: ["first"], counters: ["latest question", "one", "not shown", "missing detail"],
      rides: [ride("in", "in2", "p-window", "return question"), ride("out", "p-model", "p-window", "no order history")],
      body: ["The request is illustrative. A model can reference content in its current context, but a previous turn that is not included is not part of that context."],
      claims: ["the-context-window-contents"],
    }),
    step({
      id: "capacity", label: "Capacity", kind: "idea", title: "The context window holds input and output",
      caption: "Instructions, messages and the model's response all count against one finite context window. Tool definitions, tool results, images and documents can count too.",
      show: ["call"], counters: ["request + reply", "one", "finite", "details available"],
      rides: [ride("in", "in0", "p-window", "instructions"), ride("out", "p-window", "p-model", "request")],
      body: ["A context window is the text a model can reference while generating a response, including that response. In the Anthropic Messages API, system instructions, messages, tool definitions, tool results and generated output count toward the window."],
      claims: ["the-context-window-contents"],
    }),
    step({
      id: "history", label: "History", kind: "mechanism", title: "Each API turn can resend the conversation",
      caption: "The next request includes earlier messages and replies, then adds the new question. Those old turns remain part of the input as the conversation grows.",
      show: ["history"], counters: ["history + new reply", "many", "more used", "earlier details available"],
      rides: [ride("in", "in1", "p-window", "prior turns"), ride("in", "in2", "p-window", "new question")],
      body: ["The Anthropic Messages API input includes previous conversation history and the current user message. The output becomes part of the input on a later turn. A chat interface may instead manage a rolling window, so the application must know what it sends."],
      claims: ["the-context-window-history", "the-context-window-interface"],
    }),
    step({
      id: "shared", label: "Shared space", kind: "mechanism", title: "Tool activity and replies share the same space",
      caption: "Tool definitions, returned results and new output add to the context. Prompt caching can reuse a repeated prefix and reduce processing, but cached content still counts toward capacity.",
      show: ["tool", "cache"], counters: ["history + tools + output", "many", "nearly full", "details available"],
      rides: [ride("in", "in3", "p-window", "tool result"), ride("out", "p-window", "p-model", "cached prefix")],
      body: ["Anthropic describes prompt caching as reusing consistent prompt prefixes to reduce processing time and costs. Cached prefixes still occupy the context window."],
      claims: ["the-context-window-contents", "the-context-window-cache"],
    }),
    step({
      id: "recall", label: "Recall", kind: "watch-out", title: "A larger window does not guarantee reliable recall",
      caption: "As token count grows, accuracy and recall can degrade. A long-context model provides more capacity, but it does not make every detail equally easy to use.",
      show: ["full", "rot"], counters: ["large history + reply", "many", "almost full", "weaker recall"],
      rides: [ride("in", "in1", "p-window", "earlier return terms"), ride("out", "p-window", "p-model", "missed detail")],
      body: ["Anthropic calls the decline in accuracy and recall as token count grows context rot. Its documentation recommends curating context as well as considering the model's available capacity."],
      claims: ["the-context-window-rot", "the-context-window-contents"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Keep only the context the task needs",
      caption: "",
      show: ["history", "cache"], counters: ["necessary context", "selected turns", "headroom", "reviewed"],
      rides: [ride("in", "in2", "p-window", "necessary details")],
      body: [{ pair: {
        left: { label: "Include", items: ["Relevant instructions and turns", "Needed tool results", "A model with suitable capacity"] },
        right: { label: "Control", items: ["Remove unneeded history", "Set retention for request logs", "Check recall with representative tasks"] },
      } }, "EU GDPR says personal data must be adequate, relevant and limited to what is necessary, and kept no longer than necessary. Apply those limits when request histories or logs contain personal data."],
      claims: ["the-context-window-gdpr"],
    }),
  ],
  governance: { text: "Context can contain customer personal data. EU GDPR requires personal data to be limited to what is necessary and kept no longer than necessary, so set access and retention rules for conversation histories and logs.", claims: ["the-context-window-gdpr"] },
  closing: {
    pitfalls: [
      "Expecting the model to recall a message the application did not send.",
      "Assuming a cached prompt no longer uses context capacity.",
      "Treating a larger context window as a guarantee of better recall.",
    ],
    questions: [
      "Which parts of a request use context capacity?",
      "Why does an API call include previous conversation turns?",
      "How do data minimisation and retention apply to logged context?",
    ],
  },
});
