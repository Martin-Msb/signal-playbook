import { CANVAS, defineGuide, isoGrid, line, pill, ride, step, stop } from "@signal-path/engine";

const G = isoGrid(480, 230, 30);

export default defineGuide({
  id: "hallucination-and-model-limits", track: "ai", module: "Foundations", slug: "hallucination-and-model-limits",
  title: "Hallucination and model limits",
  summary: "A model generates plausible text, not retrieved facts. It can sound certain and still be wrong, inconsistent or stale. Ground, cite and review answers before they guide a decision.",
  forLeads: "A fluent answer is not evidence. Decide which outputs need current sources, visible citations and a person responsible for checking them.",
  status: "draft", minutes: 7,
  counters: ["Current policy retrieved", "Answer supported", "Human checked", "Customer risk"],
  whatIf: { label: "What if the answer had no source?", step: 1, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "The order and policy text are illustrative",
    label: "A Vinterhus customer asks whether order 4468 can be refunded. The model replies without seeing the current policy. Later, the policy is retrieved, attached to the answer and checked by Support before the refund decision.",
    els: [
      line("flow", [G.p(-8, 0), G.p(-4, 0), G.p(0, 0), G.p(4, 0), G.p(8, 0), G.p(12, 0)], { always: true }),
      stop("question", ...G.p(-8, 0), "Question", "order 4468", { always: true }),
      stop("model", ...G.p(-4, 0), "Model", "generates text", { always: true }),
      stop("answer", ...G.p(0, 0), "Answer", "sounds certain", { always: true }),
      stop("policy", ...G.p(4, 0), "Policy", "current source", { always: true }),
      stop("citation", ...G.p(8, 0), "Citation", "check the source", { always: true }),
      stop("review", ...G.p(12, 0), "Support", "human review", { always: true }),
      pill("guess", [495, 125], "30 days", { tone: "alert", group: "guess" }),
      pill("other", [475, 45], "14 days", { tone: "alert", group: "variation" }),
      pill("retrieved", [495, 125], "policy says 30 days", { tone: "track", group: "grounded" }),
      pill("cited", [715, 125], "refund-policy.pdf", { tone: "track", group: "cited" }),
      pill("checked", [860, 125], "verified", { tone: "muted", group: "checked" }),
    ],
  },
  steps: [
    step({
      id: "unsupported", label: "Unsupported", kind: "problem", title: "A fluent answer arrives without a source",
      caption: "The customer asks about a refund. The model replies, “You have 30 days,” although it has not seen Vinterhus's current policy.",
      show: ["guess"], counters: ["no", "no", "no", "high"],
      rides: [ride("flow", "question", "answer", "30 days", { tone: "alert" })],
      body: ["The order, question and answer are illustrative. The answer may sound plausible, but no policy was retrieved to support it."],
      claims: ["hallucination-definition"],
    }),
    step({
      id: "limits", label: "Limits", kind: "idea", title: "Generated text can be confident and false",
      caption: "A language model predicts text from learned patterns. It may produce an incorrect answer, diverge from the prompt or contradict earlier text.",
      show: ["guess", "variation"], counters: ["no", "no", "no", "high"],
      rides: [ride("flow", "model", "answer", "plausible reply", { then: "confident reply" })],
      body: ["NIST calls these errors confabulations, also known as hallucinations. Its Generative AI Profile says that language models predict the next token and can produce factually inaccurate or internally inconsistent outputs."],
      claims: ["hallucination-definition"],
    }),
    step({
      id: "consequence", label: "Consequence", kind: "mechanism", title: "Confidence can make the error matter",
      caption: "A customer may act on a false answer. NIST recommends particular attention to confabulation risk in applications involving consequential decisions.",
      show: ["guess"], counters: ["no", "no", "no", "high"],
      rides: [ride("flow", "answer", "review", "refund request", { tone: "alert" })],
      body: ["NIST notes that users can believe confident false content and act on it. A Vinterhus refund assistant should not change an order based on an unverified generated claim."],
      claims: ["hallucination-risk"],
    }),
    step({
      id: "ground", label: "Ground", kind: "mechanism", title: "Retrieve the current policy before answering",
      caption: "File search retrieves relevant documents before generation. The current refund policy becomes available to the model as answer context.",
      show: ["grounded"], counters: ["yes", "partly", "no", "lower"],
      rides: [ride("flow", "policy", "answer", "policy text")],
      body: ["OpenAI's file search documentation describes retrieving information from uploaded files in a vector store to augment a model's inherent knowledge. Retrieval gives the answer a source to use; it does not itself prove that the answer used the source correctly."],
      claims: ["retrieval-practice"],
    }),
    step({
      id: "cite", label: "Cite", kind: "watch-out", title: "Show the source so Support can check it",
      caption: "A citation points to the retrieved policy. Support can confirm that the quoted rule matches the current document before replying.",
      show: ["grounded", "cited"], counters: ["yes", "yes", "no", "lower"],
      rides: [ride("flow", "answer", "citation", "30 days", { then: "source attached" })],
      body: ["File search responses can include file citations. A citation is a path back to evidence, not a guarantee that every generated sentence is supported."],
      claims: ["citation-practice", "hallucination-risk"],
    }),
    step({
      id: "decision", label: "Review", kind: "decision", title: "Set a review point for consequential answers",
      caption: "",
      show: ["grounded", "cited", "checked"], counters: ["yes", "yes", "yes", "managed"],
      rides: [ride("flow", "citation", "review", "policy source")],
      body: [{ pair: {
        left: { label: "Require", items: ["Retrieve the current rule", "Show the supporting citation", "Human check before action"] },
        right: { label: "Do not trust", items: ["Fluent wording", "A citation-shaped string", "An answer with no source"] },
      } }, "The EU AI Act requires providers of systems intended to interact directly with people to inform them that they are interacting with AI, unless this is obvious. NIST advises organisations to define human oversight roles. Vinterhus routes policy-dependent refund decisions to a trained person."],
      claims: ["ai-disclosure", "human-oversight"],
    }),
  ],
  governance: { text: "The EU AI Act requires providers to inform people when an AI system is intended to interact with them, unless this is obvious. NIST advises organisations to define human oversight roles; Vinterhus requires a person to check policy-dependent refund decisions because confident false output can mislead.", claims: ["ai-disclosure", "human-oversight", "hallucination-risk"] },
  closing: {
    pitfalls: [
      "Treating fluency as proof of a fact.",
      "Assuming retrieved context makes every answer correct.",
      "Displaying a citation without checking what it supports.",
    ],
    questions: [
      "How can a generated answer be plausible and still be wrong?",
      "What does retrieval add to a response?",
      "Where should a human check a refund assistant's answer?",
    ],
  },
});
