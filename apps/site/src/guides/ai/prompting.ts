import { CANVAS, defineGuide, isoGrid, line, list, pill, prism, ride, step, stop } from "@signal-path/engine";

const G = isoGrid(480, 205, 30);

const prompt = (id: string, items: string[]) =>
  list(id, 300, 42, 360, items.map((t) => ({ t })), { title: "Support prompt", mono: true, group: id });

export default defineGuide({
  id: "prompting", track: "ai", module: "The model call", slug: "prompting",
  title: "Prompting",
  summary: "A prompt combines task instructions, examples and the current input. Keep it clear, test changes and remember that instructions are not access controls.",
  forLeads: "A prompt is part of the application behaviour. Keep its changes reviewable and test them against representative cases before release.",
  status: "draft", minutes: 7,
  counters: ["Prompt parts", "Examples", "Input marked", "Reviewed version"],
  whatIf: { label: "What if the prompt had no examples?", step: 2, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order, examples and prompt versions are illustrative",
    label: "A Vinterhus support request travels along a line into a model. The prompt board gains clear instructions, examples and marked input, then a versioned prompt is checked against test cases. The written instruction guides the model but does not separate trusted instructions from untrusted data.",
    els: [
      line("request", [G.p(-11, 0), G.p(-6, 0), G.p(0, 0), G.p(7, 0), G.p(11, 0)], { always: true }),
      stop("customer", ...G.p(-11, 0), "Request", "return question", { always: true }),
      stop("model-stop", ...G.p(11, 0), "Model", "generated reply", { always: true }),
      prism("model", 10.4, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", sub: "reads the prompt", at: "n", always: true }),
      prompt("vague", ["Reply to this customer"]),
      prompt("clear", ["Task: explain return policy", "Tone: clear and brief", "Do not guess missing facts"]),
      prompt("example", ["Task: explain return policy", "Example: question → policy answer", "Tone: clear and brief"]),
      prompt("marked", ["Instructions: explain return policy", "<customer_question>", "When can I return my sofa?", "</customer_question>"]),
      prompt("review", ["Prompt v3, reviewed", "Example cases → expected replies", "Run checks before release"]),
      pill("untrusted", [584, 223], "A prompt is not an access control", { tone: "alert", group: "risk" }),
      pill("roles", [736, 256], "developer instruction → user input", { tone: "track", group: "roles" }),
      pill("checks", [723, 189], "versioned · tested · reviewed", { tone: "track", group: "release" }),
    ],
  },
  steps: [
    step({
      id: "vague", label: "Vague", kind: "problem", title: "A vague request leaves the task open",
      caption: "A Vinterhus customer asks when a sofa can be returned. “Reply to this customer” gives the model no policy, tone or boundary for an answer.",
      show: ["vague"], counters: ["request only", "none", "no", "no"],
      rides: [ride("request", "customer", "model-stop", "return question")],
      body: ["A Vinterhus customer asks when a sofa can be returned. “Reply to this customer” gives the model no policy, tone or boundary for an answer. The wording that goes into the model is the prompt."],
      claims: ["prompt-instructions"],
    }),
    step({
      id: "task", label: "Task", kind: "idea", title: "Instructions define the requested response",
      caption: "State the task, the useful tone and what to do when a fact is missing. These instructions shape the response; they do not change the model’s weights.",
      show: ["clear"], counters: ["task + rules", "none", "no", "no"],
      rides: [ride("request", "customer", "model-stop", "question + task")],
      body: ["OpenAI describes prompt engineering as writing effective instructions for a model. Its API supports higher-priority developer instructions as well as user input. Clear requests help set the expected task and response."],
      claims: ["prompt-instructions", "message-roles"],
    }),
    step({
      id: "examples", label: "Examples", kind: "mechanism", title: "Examples show the pattern to follow",
      caption: "Add a representative question and a policy-based answer. The example shows the expected shape more concretely than another abstract rule.",
      show: ["example"], counters: ["task + rules", "one", "no", "no"],
      rides: [ride("request", "customer", "model-stop", "match the example")],
      body: ["Few-shot prompting includes input and output examples in the prompt so a model can pick up a pattern. OpenAI recommends examples that cover diverse possible inputs."],
      claims: ["few-shot-examples"],
    }),
    step({
      id: "separate", label: "Mark input", kind: "mechanism", title: "Delimiters mark where the customer text begins",
      caption: "Wrap the customer’s question in a named section. Markdown headings or XML tags can make instructions and supplied context easier to distinguish.",
      show: ["marked", "risk"], counters: ["task + rules", "one", "marked", "no"],
      rides: [ride("request", "customer", "model-stop", "marked input")],
      body: ["OpenAI and Anthropic show Markdown or XML tags to separate instructions, examples and variable input. The tags organise the text. They do not create a security boundary inside the model."],
      claims: ["prompt-structure", "prompt-boundary"],
    }),
    step({
      id: "roles", label: "Roles", kind: "watch-out", title: "A role label is not an access control",
      caption: "Developer messages can have higher priority than user messages, but the model still reads instructions and data as tokens. A hostile question can still influence it.",
      show: ["marked", "risk", "roles"], counters: ["task + rules", "one", "marked", "not protected"],
      rides: [ride("request", "customer", "model-stop", "untrusted text")],
      body: ["OWASP describes prompt injection as content that changes a model’s behaviour and notes that models do not enforce a trust boundary between instructions and data. Keep private data and powerful actions behind controls in application code."],
      claims: ["prompt-boundary", "prompt-injection-risk"],
    }),
    step({
      id: "release", label: "Release", kind: "decision", title: "Review and test each prompt change",
      caption: "",
      show: ["review", "release"], counters: ["task + rules", "one", "marked", "reviewed v3"],
      rides: [ride("request", "customer", "model-stop", "test case")],
      body: [{ pair: {
        left: { label: "Keep", items: ["Prompt version in application code", "Representative input and expected output", "Review and evaluation before release"] },
        right: { label: "Avoid", items: ["Unreviewed prompt edits", "Treating one example as proof", "Using instructions as security controls"] },
      } }, "OpenAI recommends keeping production prompts in code and checking prompt behaviour with tests and evaluations when it changes."],
      claims: ["prompt-versioning", "prompt-testing"],
    }),
  ],
  governance: { text: "Keep prompts as reviewed application artefacts and test their behaviour before release. A system or developer instruction does not enforce a security boundary between instructions and data.", claims: ["prompt-versioning", "prompt-testing", "prompt-boundary"] },
  closing: {
    pitfalls: [
      "Writing instructions that assume facts not in the prompt.",
      "Assuming delimiters stop a malicious instruction.",
      "Changing a production prompt without running its evaluation cases.",
    ],
    questions: [
      "How do examples shape a response pattern?",
      "What do delimiters do, and what can they not guarantee?",
      "How should a prompt change be checked before release?",
    ],
  },
});
