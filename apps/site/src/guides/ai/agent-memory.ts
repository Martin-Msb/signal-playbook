import { CANVAS, defineGuide, doc, drum, isoGrid, line, list, prism, raise, ride, step, stop } from "@signal-path/engine";

// The floor: two sessions reach the agent. A write rail runs through the memory manager to the stores,
// and a read rail runs back in front of it. Episodic is the back store, procedural the front one.
const G = isoGrid(190, 190, 30);
const MON = G.p(-2.5, 0), THU = G.p(2, 4.5);
const monday = (id: string, mute: boolean) => raise(list(id, 0, 0, 190, [{ t: "prefers email", mute }, { t: "order 8812 refunded", mute }], { title: "Monday session", group: id }), MON, 40);

export default defineGuide({
  id: "agent-memory", track: "ai", module: "Agents", slug: "agent-memory",
  title: "Agent memory",
  summary: "A model forgets everything between sessions. Memory is storage outside the context window, with a loop that decides what is written, kept and read back.",
  forLeads: "Memory makes an assistant useful across sessions and creates a new store to govern. What gets written, who can write it and how it is forgotten are design decisions.",
  status: "draft", minutes: 7,
  counters: ["Carried across sessions", "Long-term stores", "Writes are checked"],
  whatIf: { label: "What if a web page could write to memory?", step: 4, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Sessions are illustrative",
    label: "A Monday and a Thursday session feed an agent. A memory manager writes what matters to episodic, semantic and procedural stores and reads it back into the agent's context on Thursday. A poisoned note from a web page rides the same route.",
    els: [
      monday("mon", false), monday("gone", true),
      list("thu-l", THU[0] - 95, THU[1] + 34, 190, ["any open issues?"], { title: "Thursday session", below: true, always: true }),
      line("thu-lead", [[THU[0], THU[1] + 8], [THU[0], THU[1] + 34]], { tone: "ink", w: 3, always: true }),
      line("mon-r", [MON, G.p(1.4, 0)], { group: "mon" }),
      line("monx", [MON, G.p(1.4, 0)], { state: "closed", group: "gone" }),
      line("thu", [THU, G.p(2, 0.6)], { always: true }),
      stop("s-mon", ...MON, undefined, undefined, { always: true }),
      stop("s-thu", ...THU, undefined, undefined, { always: true }),
      prism("agent", 1.4, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Agent", sub: "context window", at: "n", always: true }),

      prism("mgr", 8.4, -0.6, 1.2, 1.2, 30, { hue: "sand", glyph: "layers", title: "Memory manager", sub: "write, manage, read", at: "n", group: "mem" }),
      line("write", [G.p(2.6, 0), G.p(15, 0)], { group: "mem" }),
      line("read", [G.p(15, 1.2), G.p(2.6, 1.2)], { group: "read" }),
      drum("sem", 16, 0, 1, 40, { hue: "sky", glyph: "stack", title: "Semantic", sub: "facts, preferences", at: "e", group: "mem" }),
      drum("epi", 16, -4, 1, 40, { hue: "mint", glyph: "clock", title: "Episodic", sub: "what happened", at: "n", group: "stores" }),
      drum("proc", 16, 4, 1, 40, { hue: "rose", glyph: "gear", title: "Procedural", sub: "skills, instructions", at: "w", group: "stores" }),
      line("we", [G.p(9, -0.6), G.p(9, -4), G.p(15, -4)], { group: "stores" }),
      line("wp", [G.p(9, 0.6), G.p(9, 4), G.p(15, 4)], { group: "stores" }),

      raise(doc("bad", 0, 0, 176, 70, "Poisoned note", ["from a web page"], { tone: "alert", group: "bad" }), G.p(6, -4), 30),
      line("bad-l", [G.p(6, -4), G.p(9, -4), G.p(9, -0.6)], { tone: "alert", group: "bad" }),
      prism("chk", 5.4, -0.4, 0.8, 0.8, 18, { hue: "track", glyph: "shield", tip: "Writes are checked and logged", group: "chk" }),
    ],
  },
  steps: [
    step({
      id: "zero", label: "No memory", kind: "problem", title: "Each session starts empty",
      caption: "On Monday a customer told the assistant they prefer email, and it refunded order 8812. On Thursday they ask about open issues. Monday's window is gone, so it asks for everything again.",
      show: ["gone"], counters: ["nothing", "none", "no"],
      rides: [ride("thu", 0, 0.35, "open issues?")],
      body: ["On Monday a customer told the Vinterhus assistant they prefer email, and it refunded order 8812. On Thursday the same customer asks about open issues.",
        "The model is stateless. Monday's window is gone, so it asks for everything again."],
      claims: ["memory-stateless"],
    }),
    step({
      id: "outside", label: "Storage", kind: "idea", title: "Memory is storage outside the window",
      caption: "Something has to write what matters to a store that outlives the session. Here the preference for email is saved as a fact about the customer.",
      show: ["mon", "mem"], counters: ["the preference", "1", "no"],
      rides: [ride("write", 0, 0.79, "prefers email")],
      body: ["Something has to write what matters to a store that outlives the session. Here the preference for email is saved as a fact about the customer.",
        { callout: { label: "Key idea", text: "The context window is what the model can see now. Memory is what can be put back into it later." } }],
      claims: ["memory-stateless", "coala-memory-types"],
    }),
    step({
      id: "stores", label: "Stores", kind: "mechanism", title: "Three long-term stores, one working memory",
      caption: "Episodic memory keeps what happened: the refund. Semantic memory keeps what is known: email preferred. Procedural memory keeps how to act. The context window is the working memory all three feed.",
      show: ["mon", "mem", "stores"], counters: ["facts, events, skills", "3", "no"],
      rides: [ride("write", 0, 0.79, "prefers email"), ride("we", 0, 0.7, "refund 8812")],
      body: ["Episodic memory keeps what happened: the refund on Monday. Semantic memory keeps what is known: the customer prefers email. Procedural memory keeps how to act: instructions and skills.",
        "The context window is the working memory that all three feed."],
      claims: ["coala-memory-types", "coala-episodic-semantic"],
    }),
    step({
      id: "loop", label: "Loop", kind: "mechanism", title: "Write, manage, read",
      caption: "Writing decides what is worth keeping. Managing merges, corrects and forgets. Reading selects what goes back into the window. On Thursday the assistant reads the preference and the refund back and answers.",
      show: ["mon", "mem", "stores", "read"], counters: ["facts, events, skills", "3", "no"],
      rides: [ride("read", 0, 0.8, "prefers email"), ride("thu", 0, 0.35, "open issues?")],
      body: ["Memory is a loop. Writing decides what is worth keeping. Managing merges, corrects and forgets. Reading selects what goes back into the window for this turn.",
        { callout: { label: "What changed", text: "On Thursday the assistant reads the preference and the refund back, and answers without asking again." } }],
      claims: ["memory-loop"],
    }),
    step({
      id: "poison", label: "Poisoning", kind: "watch-out", title: "A poisoned entry loads every session",
      caption: "A memory written from untrusted content persists and is read back in every later session. Memory writes are security events and belong in a log.",
      show: ["mon", "mem", "stores", "read", "bad"], counters: ["facts, events, skills", "3", "not yet"],
      rides: [ride("bad-l", 0, 0.45, "poisoned", { tone: "alert" }), ride("read", 0, 0.8, "poisoned note", { tone: "alert" })],
      body: ["A memory written from untrusted content persists. A poisoned entry is read back in every later session, long after the page that planted it is gone. Memory writes are security events and belong in a log."],
      claims: ["memory-poisoning"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What to store",
      caption: "",
      show: ["mon", "mem", "stores", "read", "chk"], counters: ["facts, events, skills", "3", "yes"],
      rides: [ride("write", 0, 0.79, "prefers email")],
      body: [{ pair: {
        left: { label: "Store", items: ["Stable facts and preferences", "Outcomes of finished work", "Instructions that proved right"] },
        right: { label: "Decide first", items: ["Who may write, and from which sources", "How an entry is corrected or forgotten", "What is read back, and how much"] },
      } }],
      claims: ["memory-loop", "memory-poisoning", "coala-memory-types"],
    }),
  ],
  governance: { text: "A poisoned memory entry loads in every later session, so a write to memory is a security event.", claims: ["memory-poisoning"] },
  closing: {
    pitfalls: [
      "Saving whole transcripts and calling it memory.",
      "Letting content from tools or web pages write to memory unchecked.",
      "Reading back everything stored, which refills the window memory was meant to relieve.",
    ],
    questions: [
      "What distinguishes episodic from semantic memory?",
      "Which of write, manage and read is hardest to get right, and why?",
      "How would you detect a poisoned memory entry?",
    ],
  },
});
