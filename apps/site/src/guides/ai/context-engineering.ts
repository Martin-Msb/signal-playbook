import { CANVAS, defineGuide, doc, isoGrid, line, pill, prism, raise, ride, step, stop, tank } from "@signal-path/engine";
import type { MatrixEl, TankEl } from "@signal-path/engine";

// The floor: five kinds of content board one rail into the context window, a glass tank that fills.
// The model stands past the window, the notes file behind it and the sub-agent in front.
const G = isoGrid(70, 120, 30);
type Seg = TankEl["segs"][number];
const win = (id: string, segs: Seg[]) => tank(id, 10.8, -1, 2, 2, 170, 200, segs, { title: "Context window", limit: "200k limit", group: id });
const system: Seg = { label: "system 6k", value: 6, hue: "ink" };
const IN = [0.5, 2.4, 4.3, 6.2, 8.4];
const input = (i: number, label: string) => stop(`in${i}`, ...G.p(IN[i], 0), label, undefined, { at: i % 2 || i === 4 ? "sw" : "ne", always: true });
const pairs: MatrixEl = { kind: "matrix", id: "pairs", group: "pairs", x: 724, y: 66, cell: [12, 12], gap: 4,
  values: Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => (r === c ? 0.9 : 0.12 + ((r * 7 + c * 3) % 5) * 0.06))) };

export default defineGuide({
  id: "context-engineering", track: "ai", module: "Agents", slug: "context-engineering",
  title: "Context engineering",
  summary: "Everything a model sees competes for the same attention. Four moves keep the window small and the answer sharp.",
  forLeads: "A larger context window is not a larger working memory. Agent quality depends on what is kept out of the window as much as on what goes in.",
  status: "draft", minutes: 8,
  counters: ["Tokens in window", "Tool definitions", "History", "Earliest turns"],
  whatIf: { label: "What if everything stayed in the window?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Token counts are illustrative",
    label: "Five kinds of content board one line into a context window drawn as a glass tank that fills. Across the steps it empties as history is summarised, documents load late and work moves to a notes file and a sub-agent.",
    els: [
      line("in", [G.p(0, 0), G.p(10.8, 0)], { always: true }),
      input(0, "system prompt"), input(1, "tool definitions"), input(2, "conversation"), input(3, "retrieved documents"), input(4, "tool results"),
      win("full", [system, { label: "tools 30k", value: 30, hue: "sand" }, { label: "history 60k", value: 60, hue: "violet", hot: true }, { label: "documents 70k", value: 70, hue: "sky" }, { label: "results 30k", value: 30, hue: "mint" }]),
      win("c3", [system, { label: "tools 30k", value: 30, hue: "sand" }, { label: "summary 12k", value: 12, hue: "violet", hot: true }, { label: "documents 70k", value: 70, hue: "sky" }, { label: "results 30k", value: 30, hue: "mint" }]),
      win("c4", [system, { label: "tools 30k", value: 30, hue: "sand" }, { label: "summary 12k", value: 12, hue: "violet" }, { label: "documents 25k", value: 25, hue: "sky", hot: true }, { label: "results 8k", value: 8, hue: "mint", hot: true }]),
      win("lean", [system, { label: "tools 12k", value: 12, hue: "sand", hot: true }, { label: "summary 12k", value: 12, hue: "violet" }, { label: "documents 25k", value: 25, hue: "sky" }, { label: "results 8k", value: 8, hue: "mint" }]),
      line("out", [G.p(12.8, 0), G.p(18.5, 0)], { always: true }),
      stop("p-out", ...G.p(15.8, 0), undefined, undefined, { always: true }),
      prism("model", 18.5, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", sub: "attends to all of it", at: "s", always: true }),
      pairs,
      pill("pairs-l", [786, 200], "n tokens, n² pairs", { group: "pairs" }),
      raise(doc("notes", 0, 0, 176, 70, "Notes file", ["outside the window"], { group: "notes" }), G.p(19.1, -5), 30),
      line("nw", [G.p(19.1, -0.6), G.p(19.1, -5)], { w: 7, group: "notes" }),
      prism("sub", 13.4, 3.4, 1.2, 1.2, 28, { hue: "violet", glyph: "net", title: "Sub-agent", sub: "own clean window", at: "sw", group: "sub" }),
      line("sa", [G.p(14.6, 4), G.p(19.1, 4), G.p(19.1, 0.6)], { w: 7, group: "sub" }),
    ],
  },
  steps: [
    step({
      id: "full", label: "Full", kind: "problem", title: "A full window degrades recall",
      caption: "Forty turns into a case, every message, policy document and tool result is still in the window, and the support agent has started to miss details from the first turns.",
      show: ["full"], counters: ["196k of 200k", "30k", "60k, verbatim", "at risk"],
      rides: [ride("in", "in2", "in4", "turn 40")],
      body: ["The Vinterhus support agent is forty turns into a case. Every message, every policy document and every tool result is still in the window, and it has started to miss details from the first turns.",
        "More context did not make it more reliable."],
      claims: ["context-rot"],
    }),
    step({
      id: "budget", label: "Budget", kind: "idea", title: "Context is a budget",
      caption: "Every token can attend to every other token, so n tokens create n squared pairwise relationships. Attention spreads thinner as the window fills, and each added token returns less.",
      show: ["full", "pairs"], counters: ["196k of 200k", "30k", "60k, verbatim", "at risk"],
      rides: [ride("in", "in3", "in4", "doc")],
      body: ["Every token can attend to every other token, so n tokens create n squared pairwise relationships. Attention is spread thinner as the window fills, and each added token returns less.",
        { callout: { label: "Key idea", text: "The question is which tokens earn their place, not how many fit." } }],
      claims: ["attention-budget", "context-rot"],
    }),
    step({
      id: "compact", label: "Compact", kind: "mechanism", title: "Compaction replaces history with a summary",
      caption: "Near the limit, the agent summarises the conversation and continues in a new window that starts from the summary. Decisions and open issues survive. Redundant tool output does not.",
      show: ["c3"], counters: ["148k", "30k", "12k summary", "kept in summary"],
      rides: [ride("out", 1, "p-out", "summary 12k")],
      body: ["When the conversation nears the limit, the agent summarises it and continues in a new window that starts from the summary. Decisions and open issues survive. Redundant tool output does not."],
      claims: ["compaction"],
    }),
    step({
      id: "out-late", label: "Offload", kind: "mechanism", title: "Move state out, load data late",
      caption: "The agent writes progress to a notes file outside the window and reads it back when needed. Documents stay as references and load through a tool when they matter.",
      show: ["c4", "notes"], counters: ["81k", "30k", "12k summary", "kept in notes"],
      rides: [ride("nw", 0, 0.5, "progress"), ride("in", "in3", "in4", "on demand")],
      body: ["The agent writes progress to a notes file outside the window and reads it back when needed. Documents stay as references and are loaded through a tool at the moment they matter.",
        { callout: { label: "What changed", text: "Documents and tool results shrank because they are fetched on demand instead of preloaded." } }],
      claims: ["note-taking", "jit-retrieval"],
    }),
    step({
      id: "isolate", label: "Isolate", kind: "mechanism", title: "Isolate search, trim the tools",
      caption: "A sub-agent searches in its own clean window and returns a condensed summary, often 1,000 to 2,000 tokens. The tool set is cut to tools that do not overlap.",
      show: ["lean", "notes", "sub"], counters: ["63k", "12k", "12k summary", "kept in notes"],
      rides: [ride("sa", 0, 0.4, "summary 1-2k")],
      body: ["A sub-agent searches in its own clean window and returns a condensed summary, often 1,000 to 2,000 tokens. The lead agent never sees the raw search.",
        "The tool set is cut to the tools that do not overlap. If an engineer cannot say which tool applies, the model cannot either."],
      claims: ["sub-agents", "minimal-tools"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Choosing a technique",
      caption: "",
      show: ["lean", "notes", "sub"], counters: ["63k", "12k", "12k summary", "kept in notes"],
      rides: [ride("sa", 0, 0.4, "summary 1-2k"), ride("nw", 1, 0.5, "notes")],
      body: [{ pair: {
        left: { label: "Reach for", items: ["Compaction for long conversations", "Notes for long tasks with milestones", "Sub-agents for wide searches"] },
        right: { label: "Watch for", items: ["A summary that drops the detail that mattered", "Slower exploration when everything loads late", "An unpruned tool list"] },
      } }],
      claims: ["compaction", "note-taking", "sub-agents", "jit-retrieval", "minimal-tools"],
    }),
  ],
  governance: { text: "Loading data just in time keeps it out of the window until a step needs it, and a sub-agent returns a summary, not its raw search.", claims: ["jit-retrieval", "sub-agents"] },
  closing: {
    pitfalls: [
      "Treating the size of the context window as usable working memory.",
      "Preloading every document in case it is needed.",
      "Adding tools without removing the ones they overlap.",
    ],
    questions: [
      "Why does recall fall as the window fills?",
      "What survives a compaction, and what should?",
      "What does a sub-agent return to the agent that called it?",
    ],
  },
});
