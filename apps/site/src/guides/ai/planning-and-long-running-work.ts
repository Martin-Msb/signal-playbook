import { CANVAS, defineGuide, drum, isoGrid, line, list, pawn, pill, prism, raise, ride, step, stop, tank } from "@signal-path/engine";
import type { ListEl, TankEl } from "@signal-path/engine";

// The floor: the task rides into the context window, a glass tank, and on to the agent's model.
// One rail leaves the model for the progress file, which stands outside the window. Another carries
// each batch past a checkpoint to the returns ledger.
const G = isoGrid(50, 95, 30);
const K = "planning-and-long-running-work";
type Seg = TankEl["segs"][number];
const win = (id: string, segs: Seg[]) => tank(id, 5.5, -1, 2, 2, 120, 200, segs, { title: "Context window", limit: "200k limit", group: id });
const system: Seg = { label: "system 6k", value: 6, hue: "ink" };
const FILE = G.p(13, -8);
const file = (id: string, items: ListEl["items"]) => raise(list(id, 0, 0, 210, items, { title: "progress.md", mono: true, group: id }), FILE, 30);

export default defineGuide({
  id: K, track: "ai", module: "Agents", slug: K,
  title: "Planning and long-running work",
  summary: "A long task outlasts one context window. The agent plans, records progress outside the window and resumes from that record.",
  forLeads: "Long agent runs need a written plan, a progress record and checkpoints where people review the work. A spend ceiling bounds what an unattended run can cost.",
  status: "draft", minutes: 7,
  counters: ["Returns reconciled", "Windows used", "Progress file", "Spend ceiling"],
  whatIf: { label: "What if nothing were written down?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Returns, batches and token counts are illustrative",
    label: "A task rides into a context window drawn as a glass tank and on to the agent's model. The model writes a plan and its progress to a file that stands outside the window, each batch of work passes a checkpoint on the way to the returns ledger, and a new window starts from the file.",
    els: [
      line("in", [G.p(0, 0), G.p(5.5, 0)], { always: true }),
      stop("s-task", ...G.p(0, 0), "Task", "120 returns", { at: "ne", big: true, always: true }),
      win("w-full", [system, { label: "task 4k", value: 4, hue: "sand" }, { label: "40 returns 186k", value: 186, hue: "sky", hot: true }]),
      win("w-plan", [system, { label: "task 4k", value: 4, hue: "sand" }, { label: "plan 2k", value: 2, hue: "mint", hot: true }]),
      win("w-b1", [system, { label: "plan 2k", value: 2, hue: "mint" }, { label: "web batch 150k", value: 150, hue: "sky", hot: true }]),
      win("w-new", [system, { label: "progress 3k", value: 3, hue: "mint", hot: true }]),
      win("w-b2", [system, { label: "progress 3k", value: 3, hue: "mint" }, { label: "app batch 140k", value: 140, hue: "sky", hot: true }]),
      line("out", [G.p(7.5, 0), G.p(12.4, 0)], { always: true }),
      prism("model", 12.4, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Agent", sub: "model in a loop", at: "s", always: true }),
      line("act", [G.p(13.6, 0), G.p(24, 0)], { always: true }),
      drum("ledger", 25, 0, 1, 40, { hue: "sky", glyph: "stack", title: "Returns ledger", sub: "Finance", at: "n", always: true }),
      line("fl", [G.p(13, -0.6), FILE], { group: "file" }),
      file("f-plan", ["1 web 40: open", "2 app 40: open", "3 store 40: open"]),
      file("f-1", [{ t: "1 web 40: done", hot: true }, "2 app 40: open", "3 store 40: open"]),
      file("f-2", [{ t: "1 web 40: done", mute: true }, { t: "2 app 40: next", hot: true }, "3 store 40: open"]),
      file("f-rev", [{ t: "1 web 40: done", mute: true }, { t: "2 app 40: review", hot: true }, "3 store 40: open"]),
      file("f-3", [{ t: "1 web 40: done", mute: true }, { t: "2 app 40: done", hot: true }, "3 store 40: open"]),
      stop("cp", ...G.p(18.5, 0), "Checkpoint", "state saved", { at: "sw", big: true, group: "cp" }),
      pawn("fin", 17.5, -4.5, "Finance", "approve batch 2?", { side: "e", group: "ask" }),
      pawn("fin-ok", 17.5, -4.5, "Finance", "approved", { side: "e", group: "ok" }),
      pill("cap", [250, 400], "Spend ceiling", { sub: "max budget stops the loop", tone: "track", glyph: "flag", group: "review" }),
    ],
  },
  steps: [
    step({
      id: "overflow", label: "Overflow", kind: "problem", title: "A long task outlasts one context window",
      caption: "Finance asks the agent to reconcile 120 November returns. After 40 the window is full, and a new session begins with no memory of them.",
      show: ["w-full"], counters: ["40 of 120", "1, full", "none", "none"],
      rides: [ride("in", 0, 0.45, "return 41")],
      body: ["Finance asks the Vinterhus agent to reconcile 120 November returns against the ledger. Each return adds order lookups and results to the window. After 40 returns the window is full.",
        "Long-running agents work in discrete sessions, and each new session begins with no memory of what came before. Without a record, a later session tends either to attempt too much at once or to see that progress has been made and declare the job done."],
      claims: [`${K}-sessions`, `${K}-failure-modes`],
    }),
    step({
      id: "plan", label: "Plan", kind: "idea", title: "The agent plans first",
      caption: "The first session splits the task into three batches and writes them to a plan file. Every batch starts as open.",
      show: ["w-plan", "file", "f-plan"], counters: ["0 of 120", "1", "3 batches open", "none"],
      rides: [ride("fl", 0, 0.6, "plan")],
      body: ["This is task decomposition. In Anthropic's harness for long coding tasks the first session has its own prompt: it sets up the environment and writes a comprehensive file of requirements, each one initially marked as failing.",
        { callout: { label: "Key idea", text: "The plan lives in a file, so it does not depend on any one window." } }],
      claims: [`${K}-plan-file`],
    }),
    step({
      id: "record", label: "Record", kind: "mechanism", title: "Progress is recorded outside the window",
      caption: "The agent works on one batch only. At the checkpoint it marks the batch done in the progress file, which survives when the window does not.",
      show: ["w-b1", "file", "f-1", "cp"], counters: ["40 of 120", "1", "1 of 3 done", "none"],
      rides: [ride("act", 0, 0.68, "web 40", { via: [0.4], then: "posted" }), ride("fl", 0, 0.6, "web done")],
      body: ["Working on one item at a time counters the tendency to do too much at once. The harness keeps a progress file that logs what agents have done, alongside the git history, and the model commits its progress with descriptive messages.",
        "Structured note-taking is the same move in general form: notes persist outside the context window and are pulled back in later. Frameworks do it for run state too. LangGraph checkpointers persist a thread's graph state as checkpoints."],
      claims: [`${K}-one-at-a-time`, `${K}-progress-file`, `${K}-notes`, `${K}-checkpointer`],
    }),
    step({
      id: "resume", label: "Resume", kind: "mechanism", title: "A new window resumes from the record",
      caption: "The next session starts empty and reads the progress file to get its bearings. It picks up the app batch without repeating the web batch.",
      show: ["w-new", "file", "f-2", "cp"], counters: ["40 of 120", "2", "1 of 3 done", "none"],
      rides: [ride("fl", 0.7, 0.3, "progress", { then: "next: app" })],
      body: ["Each session in the harness begins with a series of steps to get its bearings, including reading the git logs and progress files to see what was recently worked on.",
        "Resumable runs take two forms. A fresh window can start from the record, or a saved session can be reopened: the Claude Agent SDK resumes a session by its ID and restores the full context of its previous turns. Persisted checkpoints also let a run recover from a failure."],
      claims: [`${K}-bearings`, `${K}-resume`, `${K}-checkpointer`],
    }),
    step({
      id: "review", label: "Review", kind: "watch-out", title: "Checkpoints are review points",
      caption: "The run pauses at the checkpoint with its state saved and waits until Finance approves the batch. A spend ceiling stops the loop when the budget is reached.",
      show: ["w-b2", "file", "f-rev", "cp", "review", "ask"], counters: ["80 of 120", "2", "2 of 3, in review", "set"],
      rides: [ride("act", 0, 0.4, "app 40", { then: "waiting" })],
      body: ["A LangGraph interrupt pauses execution, saves the graph state and waits indefinitely for external input. Pausing before a critical action to ask for approval is one of its most common uses.",
        "Long runs are bounded as well as reviewed. The Claude Agent SDK stops the loop at max_turns or at max_budget_usd, an estimated spend. Both default to no limit. The OpenAI Agents SDK raises MaxTurnsExceeded when a run passes max_turns."],
      claims: [`${K}-interrupt`, `${K}-budget`, `${K}-max-turns`],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "One window or a recorded plan",
      caption: "",
      show: ["w-b2", "file", "f-3", "cp", "review", "ok"], counters: ["80 of 120", "2", "2 of 3 done", "set"],
      rides: [ride("act", 0.4, 0.68, "app 40", { then: "posted" }), ride("fl", 0, 0.6, "app done")],
      body: [{ pair: {
        left: { label: "One window", items: ["The task fits in one window", "A failed run is cheap to repeat"] },
        right: { label: "Recorded plan", items: ["Work spans many windows", "Steps can be checked off", "People review at checkpoints"] },
      } }],
      claims: [`${K}-sessions`, `${K}-progress-file`, `${K}-interrupt`],
    }),
  ],
  governance: { text: "A checkpoint saves the run's state, so the run can pause there and wait for a person to approve the next action. A spend ceiling such as a maximum budget stops the loop, and it is off unless set.", claims: [`${K}-interrupt`, `${K}-budget`] },
  closing: {
    pitfalls: [
      "Relying on the window to remember a task that will outlast it.",
      "A progress record updated only at the end, so a failed run restarts from zero.",
      "No spend ceiling on a run that nobody is watching.",
    ],
    questions: [
      "What does a new session read before it acts?",
      "Where does the record of progress live, and who can inspect it?",
      "At which checkpoints does a person approve the work?",
    ],
  },
});
