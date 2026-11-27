import { CANVAS, defineGuide, isoGrid, line, list, pawn, pill, prism, raise, ride, step, stop } from "@signal-path/engine";

// The floor: a V of rail with the model at its foot. A customer message comes down the left arm and the
// reply goes up the right arm to the support chat. One check stands on each arm, and each check has a
// siding that takes a blocked record off the rail. The acceptable-use policy stands between the arms.
const G = isoGrid(480, 392, 30);
const ARM = 12, CHECK = 6, SIDE = 5.6;
const IN = G.p(-CHECK, 0), OUT = G.p(0, -CHECK);
const EMAIL = "ana@mail.example", MASK = "<EMAIL>";

export default defineGuide({
  id: "guardrails", track: "ai", module: "The model call", slug: "guardrails",
  title: "Guardrails",
  summary: "A guardrail is a check that runs outside the model: one on the input before the model is called, one on the output before it reaches the user. Each check passes, changes or blocks what it reads.",
  forLeads: "Guardrails are where the acceptable-use policy becomes code. They lower the rate of harmful input and output, they cost latency and some wrongly blocked requests, and they do not replace limits on what the system can reach.",
  status: "draft", minutes: 7,
  counters: ["Input check", "Output check", "Customer receives", "Risk"],
  whatIf: { label: "What if there were no checks?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Messages, orders and the email address are illustrative",
    label: "A customer message travels down a rail to the model of the refund assistant, and the reply travels up a second rail to the support chat. Without checks an attack reaches the model and another customer's email address reaches the chat. An input check and an output check are then placed on the rails, each with a siding for blocked records, under a card that lists the acceptable-use policy. The input check blocks a prompt attack, the output check redacts an email address, and a reworded attack passes the input check.",
    els: [
      line("io", [G.p(-ARM, 0), G.p(0, 0), G.p(0, -ARM)], { always: true }),
      stop("q1", ...G.p(-9.6, 0), undefined, undefined, { always: true }),
      stop("q2", ...G.p(-3, 0), undefined, undefined, { always: true }),
      stop("s-model", ...G.p(0, 0), undefined, undefined, { always: true }),
      stop("q3", ...G.p(0, -3), undefined, undefined, { always: true }),
      stop("q4", ...G.p(0, -9.2), undefined, undefined, { always: true }),
      pawn("customer", -ARM - 1, 0, "Customer", undefined, { always: true }),
      prism("chat", -0.6, -ARM - 1.4, 1.2, 1.2, 22, { hue: "sand", glyph: "user", title: "Support chat", sub: "shows the reply", at: "n", always: true }),
      prism("model", -0.6, -0.6, 1.2, 1.2, 32, { hue: "violet", glyph: "net", title: "Model", sub: "refund assistant", at: "s", always: true }),

      prism("in", -CHECK - 0.6, -0.6, 1.2, 1.2, 26, { hue: "track", glyph: "shield", title: "Input check", sub: "before the call", at: "n", group: "checks" }),
      prism("out", -0.6, -CHECK - 0.6, 1.2, 1.2, 26, { hue: "track", glyph: "shield", title: "Output check", sub: "after the call", at: "n", group: "checks" }),
      line("side-in", [G.p(-CHECK, 0.6), G.p(-CHECK, SIDE)], { group: "checks" }),
      stop("b-in", ...G.p(-CHECK, SIDE), "Blocked", "refused, logged", { state: "end", at: "s", group: "checks" }),
      line("side-out", [G.p(0.6, -CHECK), G.p(SIDE, -CHECK)], { group: "checks" }),
      stop("b-out", ...G.p(SIDE, -CHECK), "Withheld", "logged", { state: "end", at: "s", group: "checks" }),
      raise(list("policy", 0, 0, 204, ["refund questions", { t: "prompt attacks", strike: true }, { t: "personal data in replies", strike: true }], { title: "Acceptable use", group: "checks" }), G.p(-CHECK, -CHECK), 34),

      pill("none-in", [IN[0], IN[1] - 34], "no input check", { tone: "alert", group: "bare" }),
      pill("none-out", [OUT[0], OUT[1] - 34], "no output check", { tone: "alert", group: "bare" }),

      pill("r-attack", [IN[0], 472], "Prompt attack classifier", { glyph: "search", sub: "attack detected", group: "r-in" }),
      pill("r-pii", [OUT[0], 472], "Personal data detector", { glyph: "search", sub: "email redacted", group: "r-out" }),
      pill("r-miss", [IN[0], 472], "Reworded attack", { glyph: "x", sub: "not detected", tone: "alert", group: "miss" }),

      pill("g-log", [IN[0], 472], "Log every block", { glyph: "file", sub: "audit trail", group: "gov" }),
      pill("g-review", [OUT[0], 472], "Review the checks", { glyph: "loop", sub: "red team, humans", group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "bare", label: "No checks", kind: "problem", title: "The model answers whatever arrives",
      caption: "A message telling the refund assistant to ignore its rules reaches the model unread by anything else. The reply carries another customer's email address to the chat.",
      show: ["bare"], counters: ["none", "none", "another customer's email", "unchecked"],
      rides: [ride("io", 0, "q2", "ignore rules", { via: ["q1"], tone: "alert" }), ride("io", "s-model", "q4", EMAIL, { via: ["q3"], tone: "alert" })],
      body: ["The refund assistant at Vinterhus reads customer messages and order data. Its prompt states what it may discuss, and nothing outside the model enforces it.",
        "OWASP lists input and output filtering among the mitigations for prompt injection: define the sensitive categories, write rules for identifying and handling such content, and apply semantic filters and string checking."],
      claims: ["guardrails-owasp"],
    }),
    step({
      id: "checks", label: "Two checks", kind: "idea", title: "Checks stand before and after the model call",
      caption: "An input check reads the message before the model is called. An output check reads the reply before the customer sees it. Both apply the same acceptable-use policy.",
      show: ["checks"], counters: ["on", "on", "a refund answer", "policy enforced"],
      rides: [ride("io", 0, "q2", "refund 4470?", { via: ["q1"], then: "allowed" }), ride("io", "s-model", "q4", "refund sent", { via: ["q3"], then: "allowed" })],
      body: ["Guardrails do checks and validations of user input and of output. Input guardrails run on the initial user input, and output guardrails run on the final output.",
        "NVIDIA NeMo Guardrails names the two positions input rails and output rails. Input rails validate and sanitise user input before the model is called. Output rails filter, edit or block unsafe or off-policy content before it reaches users.",
        { callout: { label: "Key idea", text: "A guardrail is code outside the model. The policy says which queries the application refuses, and the checks apply it to every call." } },
        "NIST AI 600-1 suggests defining acceptable use policies for generative AI interfaces, including criteria for the kinds of queries an application should refuse to respond to."],
      claims: ["guardrails-definition", "guardrails-rails", "guardrails-acceptable-use"],
    }),
    step({
      id: "input", label: "Input", kind: "mechanism", title: "The input check blocks before the model is called",
      caption: "A classifier scores the message against the policy. The attack is detected, so the message leaves the rail, the customer gets a refusal and the model never reads it.",
      show: ["checks", "r-in"], counters: ["blocks the attack", "on", "a refusal", "policy enforced"],
      rides: [ride("io", 0, "q1", "ignore rules", { tone: "alert" }), ride("side-in", 0, 0.72, "ignore rules", { tone: "alert", then: "blocked" })],
      body: ["Llama Guard is an LLM-based safeguard model that classifies prompts and responses against a safety risk taxonomy whose categories can be adjusted to the use case.",
        "The OpenAI moderation endpoint classifies text and images for harmful content in categories that include harassment, hate, illicit, self-harm, sexual and violence. It returns a flagged boolean, a boolean per category and a score per category from 0 to 1.",
        "Azure AI Content Safety Prompt Shields look for a different thing: user prompt attacks, and instructions embedded in documents, emails or web pages. They do not judge whether content is harmful or compliant with policy, so other guardrails are needed for those risks.",
        { callout: { label: "Timing", text: "In the OpenAI Agents SDK a blocking input guardrail completes before the agent starts. A parallel one runs alongside it, and the model may already have started when the guardrail trips." } }],
      claims: ["guardrails-llama-guard", "guardrails-moderation", "guardrails-prompt-shields", "guardrails-tripwire"],
    }),
    step({
      id: "output", label: "Output", kind: "mechanism", title: "The output check catches what the model wrote",
      caption: "An allowed question produces a reply that contains another customer's email address. The output check detects the personal data and redacts it before the reply is shown.",
      show: ["checks", "r-out"], counters: ["on", "redacts the email", "a redacted reply", "policy enforced"],
      rides: [ride("io", "s-model", "q3", EMAIL, { tone: "alert", then: MASK }), ride("io", "q3", "q4", MASK)],
      body: ["Presidio identifies and anonymises private entities such as credit card numbers, names, locations and phone numbers. Its recognisers combine named entity recognition, regular expressions, rule based logic and checksums.",
        "Policy filters cover what classifiers of harm do not. Amazon Bedrock Guardrails evaluates prompts and completions against content filters, denied topics, word filters, sensitive information filters that block or mask personal data, and contextual grounding checks. A configured message is returned to the user when a filter is violated.",
        "An output check can redact and pass the reply, as here, or withhold the reply altogether."],
      claims: ["guardrails-pii", "guardrails-policy-filters", "guardrails-rails"],
    }),
    step({
      id: "residual", label: "Residual", kind: "watch-out", title: "Filters reduce risk and do not remove it",
      caption: "The attacker rewords the message until the classifier no longer detects it. It passes the input check and reaches the model.",
      show: ["checks", "miss"], counters: ["misses the attack", "on", "depends on the output check", "reduced, not removed"],
      rides: [ride("io", 0, "q2", "1gn0re ru1es", { via: ["q1"], tone: "alert", then: "not detected" })],
      body: ["Researchers who adapted their attacks to each defence bypassed 12 recent defences against jailbreaks and prompt injections, with an attack success rate above 90% for most. The majority of those defences had originally reported near-zero attack success rates.",
        "OWASP states that it is unclear if there are fool-proof methods of prevention for prompt injection. Presidio's documentation states that there is no guarantee it will find all sensitive information.",
        { callout: { label: "The cost", text: "Checks also block legitimate requests and add latency. Anthropic reports that its Constitutional Classifiers raised refusals on production traffic by an absolute 0.38% and added 23.7% inference overhead." } }],
      claims: ["guardrails-adaptive", "guardrails-owasp", "guardrails-pii-no-guarantee", "guardrails-cost"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What the checks are for",
      caption: "",
      show: ["checks", "gov"], counters: ["on, logged", "on, logged", "a reply within policy", "reduced, not removed"],
      rides: [ride("io", "s-model", "q3", "refund 9999", { tone: "alert" }), ride("side-out", 0, 0.72, "refund 9999", { tone: "alert", then: "withheld" })],
      body: [{ pair: {
        left: { label: "Use them to", items: ["Enforce the acceptable-use policy", "Block known attacks and abuse", "Redact personal data"] },
        right: { label: "Do not expect", items: ["Every attack to be caught", "No wrongly blocked requests", "A substitute for least privilege"] },
      } },
        "OpenAI states that moderation scores are signals for the application's policy and not an automatic blocking decision. Categories and scores serve logging, routing, audit trails or human review, and thresholds may need recalibration when the classifier is upgraded.",
        "NIST AI 600-1 suggests regularly reviewing security and safety guardrails, especially when the system is operated in novel circumstances, and using human moderation where appropriate to review generated content."],
      claims: ["guardrails-scores-signals", "guardrails-review", "guardrails-acceptable-use", "guardrails-adaptive", "guardrails-owasp"],
    }),
  ],
  governance: { text: "Guardrails are the acceptable-use policy enforced in code: NIST AI 600-1 has organisations define the kinds of queries an application should refuse. Filters reduce the risk and do not remove it. Adaptive attacks have bypassed published defences, and OWASP states that it is unclear if fool-proof prevention exists.", claims: ["guardrails-acceptable-use", "guardrails-adaptive", "guardrails-owasp"] },
  closing: {
    pitfalls: [
      "Treating a guardrail as proof that an attack cannot succeed.",
      "Checking the input and leaving the output unchecked.",
      "Blocking silently, with no log and no review of what was blocked.",
    ],
    questions: [
      "What does the input check read, and what does the output check read?",
      "Which check can stop personal data that the model itself wrote?",
      "Why does a filter that passes every test still leave risk?",
    ],
  },
});
