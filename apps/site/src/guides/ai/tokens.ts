import { blocks, CANVAS, cells, defineGuide, isoGrid, line, pill, prism, raise, ride, step, stop, table, tank } from "@signal-path/engine";
import type { BlocksEl, Cell, CellsEl, Hue, Pt } from "@signal-path/engine";

// The floor: a V of rail with the model at its foot. The left arm is what the model reads, from the
// tokeniser down to the model. The right arm is what it writes, back up to a tokeniser that returns text.
// Each token is one block beside the rail and one cell on the card above it. Past the model the same
// tokens fill the context window, and the bill that prices them stands in front.
const G = isoGrid(480, 350, 30);
const ARM = 11.5, REST = 3.6, TANK = 8.4;
const CODE = ["SO", "FA", "-", "22", "10"], CODE_IDS = ["5066", "3711", "12", "1313", "940"];
const IN = ["Return", ...CODE], IN_IDS = ["8421", ...CODE_IDS];
const OUT = [...CODE, ":", "yes"], OUT_IDS = [...CODE_IDS, "25", "3276"];
const MESSAGE: Pt = [200, 147], REPLY: Pt = [757, 147];
const of = (hue: Hue) => (t: string): Cell => ({ t, hue });
const UNKNOWN = (t: string): Cell => ({ t, hot: true, tone: "alert" });
/** A strip of cells on a post: one cell per word or token. */
const strip = (id: string, at: Pt, w: number, items: Cell[], extra: Partial<CellsEl>) => raise(cells(id, 0, 0, items.length, [w, 30], items, extra), at, 30);
/** One block per token, in a row beside an arm of the rail. */
const row = (id: string, arm: "in" | "out", items: BlocksEl["items"], group: string) =>
  arm === "in" ? blocks(id, -9.8, 0.6, items.length, 0.62, items, { gap: 0.13, group }) : blocks(id, 0.6, -10, items.length, 0.62, items, { gap: 0.13, dir: "gy", group });
const some = (n: number, hue: Hue): BlocksEl["items"] => Array.from({ length: n }, () => ({ h: 12, hue }));
const GONE = { h: 12, state: "closed" as const };

export default defineGuide({
  id: "tokens", track: "ai", module: "Foundations", slug: "tokens",
  title: "Tokens",
  summary: "A model does not read words. A tokeniser splits text into pieces from a fixed vocabulary, the model reads and writes those pieces as numbers, and the context window, the rate limits and the price are all counted in them.",
  forLeads: "Tokens are the unit on every invoice and in every limit. Budgets, quotas and capacity plans for AI systems are token counts, and the same text is a different number of tokens on a different model.",
  status: "draft", minutes: 7,
  counters: ["Unit", "Input", "Output", "Counted for"],
  whatIf: { label: "What if the vocabulary held whole words?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Token splits, IDs and volumes are illustrative",
    label: "A customer message stands on a card above a tokeniser. A rail runs from the tokeniser down to a model and up again to a second tokeniser that returns text. With a list of whole words, the product code is unknown. Split into tokens, the message is six blocks beside the rail and the reply is five. The same tokens fill a context window with a limit, and a bill prices input and output tokens separately.",
    els: [
      line("io", [G.p(-ARM, 0), G.p(0, 0), G.p(0, -ARM)], { always: true }),
      stop("s-in", ...G.p(-REST, 0), undefined, undefined, { always: true }),
      stop("s-model", ...G.p(0, 0), undefined, undefined, { always: true }),
      stop("s-out", ...G.p(0, -REST), undefined, undefined, { always: true }),
      prism("model", -0.6, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", at: "n", group: "text" }),
      prism("model-ids", -0.6, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", sub: "IDs in, IDs out", at: "n", group: "ids" }),

      strip("m-words", MESSAGE, 88, ["Return", UNKNOWN("SOFA-2210")], { title: "Customer message", sub: "2 words", group: "words" }),
      strip("r-words", REPLY, 70, [UNKNOWN("unknown"), ":", "yes"], { title: "Reply", sub: "3 words", group: "words" }),
      prism("list-in", -ARM - 0.6, -0.6, 1.2, 1.2, 28, { hue: "paper", glyph: "lines", title: "Word list", sub: "whole words only", at: "sw", group: "words" }),
      prism("list-out", -0.6, -ARM - 0.6, 1.2, 1.2, 28, { hue: "paper", glyph: "lines", title: "Word list", sub: "back to text", at: "se", group: "words" }),
      row("b-words-in", "in", [...some(1, "paper"), GONE], "words"),
      row("b-words-out", "out", [GONE, ...some(2, "paper")], "words"),

      strip("m-pieces", MESSAGE, 56, IN.map(of("sky")), { title: "Customer message", sub: "6 tokens", group: "pieces" }),
      strip("r-pieces", REPLY, 46, OUT.map(of("mint")), { title: "Reply", sub: "7 tokens", group: "pieces" }),
      strip("m-ids", MESSAGE, 56, IN.map(of("sky")), { title: "Customer message", sub: "6 token IDs", ticks: IN_IDS, group: "ids" }),
      strip("r-ids", REPLY, 46, OUT.map(of("mint")), { title: "Reply", sub: "7 token IDs", ticks: OUT_IDS, group: "ids" }),
      prism("tok", -ARM - 0.6, -0.6, 1.2, 1.2, 28, { hue: "track", glyph: "split", title: "Tokeniser", sub: "byte pair encoding", at: "sw", group: "tok" }),
      prism("detok", -0.6, -ARM - 0.6, 1.2, 1.2, 28, { hue: "track", glyph: "merge", title: "Tokeniser", sub: "back to text", at: "se", group: "tok" }),
      row("b-in", "in", some(6, "sky"), "tok"),
      row("b-out", "out", some(7, "mint"), "tok"),

      line("meter", [G.p(0, 0), G.p(TANK - 1, 0)], { w: 7, group: "tank" }),
      tank("window", TANK - 1, -1, 2, 2, 110, 100, [{ label: "instructions", value: 24, hue: "ink" }, { label: "message", value: 8, hue: "sky" }, { label: "reply", value: 8, hue: "mint" }], { title: "Context window", limit: "1M tokens", group: "tank" }),

      raise(table("bill", 0, 0, 260, ["", "tokens", "per MTok", "cost"], [["input", "4.2M", "$2", "$8.40"], ["output", "0.6M", "$10", "$6.00"], { cells: ["total", "4.8M", "", "$14.40"], hot: true }],
        { at: [12, 74, 132, 200], rowH: 24, title: "One day's bill", sub: "Claude Sonnet 5.5", group: "bill" }), [200, 522], 30),

      pill("c-count", [480, 152], "Token counting", { glyph: "search", sub: "before sending", to: G.p(-REST, 0), group: "caps" }),
      pill("c-spend", [40, 316], "Monthly spend limit", { glyph: "lock", anchor: "start", group: "caps" }),
      pill("c-rate", [652, 480], "Tokens per minute", { glyph: "lock", anchor: "end", group: "caps" }),
    ],
  },
  steps: [
    step({
      id: "words", label: "Words", kind: "problem", title: "A list of whole words cannot hold every word",
      caption: "A customer asks Support about SOFA-2210. A model with a fixed vocabulary of whole words has no entry for the product code, so it cannot read or write it.",
      show: ["words", "text"], counters: ["whole words", "1 of 2 unknown", "1 of 3 unknown", "nothing yet"],
      rides: [ride("io", 0, "s-out", "SOFA-2210", { via: ["s-in", "s-model"], then: "unknown", tone: "alert" })],
      body: ["Neural machine translation models typically operated with a fixed vocabulary, and a word-level model is unable to translate or generate a word it has not seen.",
        "Splitting text into single characters or bytes covers every string. Byte pair encoding was adopted as the practical middle ground between character and word level language modelling."],
      claims: ["tokens-fixed-vocabulary", "tokens-byte-level"],
    }),
    step({
      id: "pieces", label: "Pieces", kind: "idea", title: "Tokens are pieces of words",
      caption: "A subword tokeniser keeps a frequent word whole and builds a rare one from smaller pieces. Byte pair encoding learns the pieces by merging the most frequent pairs of symbols.",
      show: ["pieces", "tok", "text"], counters: ["subword tokens", "6 tokens", "7 tokens", "nothing yet"],
      rides: [ride("io", 0, "s-in", "1 message", { via: [0.07], then: "6 tokens" })],
      body: ["Byte pair encoding starts with single characters as its vocabulary and repeatedly replaces the most frequent pair of symbols with a new symbol. Frequent words end up as one symbol. The final vocabulary size is the starting characters plus the number of merges.",
        "A new word is split into characters and the learned merges are applied. This works for any word, so a vocabulary of fixed size covers an open one. Names, compounds and loanwords were the cases the method was introduced for.",
        { callout: { label: "Key idea", text: "Tokens can be words, subwords, characters or bytes. Larger tokens are more efficient, and smaller tokens let a model handle a word it has never seen." } },
        "SentencePiece implements byte pair encoding and the unigram language model with a vocabulary size fixed before training. tiktoken is the byte pair encoding tokeniser for OpenAI's models.",
        "As rules of thumb, OpenAI states that a token is about 4 bytes on average, and Google states about 4 characters for Gemini models, or 60 to 80 English words per 100 tokens."],
      claims: ["tokens-definition", "tokens-subword-units", "tokens-bpe", "tokens-bpe-any-word", "tokens-tools", "tokens-size"],
    }),
    step({
      id: "ids", label: "Read, write", kind: "mechanism", title: "The model reads and writes token IDs",
      caption: "Each token has a number in the vocabulary. The model reads the message as six numbers and generates its reply as tokens too, which the tokeniser turns back into text.",
      show: ["ids", "tok"], counters: ["subword tokens", "6 token IDs", "7 token IDs", "nothing yet"],
      rides: [ride("io", "s-in", "s-out", "6 IDs in", { via: ["s-model"], then: "7 IDs out" })],
      body: ["Text given to a model is encoded into a series of tokens for the model to process. Language models see a sequence of numbers, known as tokens.",
        "Byte pair encoding is reversible and lossless, so tokens convert back into the original text. It works on arbitrary text, including text that was not in the tokeniser's training data.",
        "A byte-level tokeniser needs a base vocabulary of only 256 entries, and the model can then assign a probability to any Unicode string.",
        "Every response reports the tokens the request consumed in its usage field, input and output separately."],
      claims: ["tokens-encoded", "tokens-reversible", "tokens-byte-level", "tokens-usage"],
    }),
    step({
      id: "limits", label: "Limits", kind: "mechanism", title: "Limits are counted in tokens",
      caption: "The context window holds the instructions, the message and the reply together: 1M tokens on Claude Sonnet 5.5. One response is capped at 128K output tokens, and rate limits count tokens per minute.",
      show: ["ids", "tok", "tank"], counters: ["subword tokens", "6 token IDs", "7 token IDs", "window, rate limits"],
      rides: [ride("meter", 0.12, 0.55, "6 in + 7 out")],
      body: ["The context window is all the text a model can reference when generating a response, including the response itself. The system prompt, every message, the tool definitions and the generated output all count toward it.",
        "If the input alone exceeds the window, the Claude API returns a 400 error with the message prompt is too long.",
        "Rate limits for the Claude Messages API are measured in requests per minute, input tokens per minute and output tokens per minute for each model class. Exceeding one returns a 429 error.",
        { callout: { label: "Count first", text: "Token counting returns the number of tokens in a message before it is sent. The count is an estimate, made under the tokeniser of the model named in the request." } }],
      claims: ["tokens-window", "tokens-window-size", "tokens-overflow", "tokens-rate-limits", "tokens-counting"],
    }),
    step({
      id: "price", label: "Price", kind: "mechanism", title: "The price is set per token",
      caption: "Input and output tokens are priced separately, per million. On Claude Sonnet 5.5 that is $2 for input and $10 for output, so a day of the refund assistant costs $14.40.",
      show: ["ids", "tok", "tank", "bill"], counters: ["subword tokens", "6 token IDs", "7 token IDs", "limits and price"],
      rides: [ride("io", "s-in", "s-out", "$2 / MTok", { via: ["s-model"], then: "$10 / MTok" })],
      body: ["Anthropic lists prices per million tokens, written MTok, with separate prices for input tokens and output tokens. Google states that the cost of a Gemini API call is determined in part by the number of input and output tokens.",
        "Each turn's input contains all previous conversation history plus the current message. The assistant's instructions and the conversation are counted again on every request, which is why input tokens dominate the volume.",
        { callout: { label: "Watch out", text: "The same text is a different number of tokens on a different model. Anthropic states that the tokeniser of Claude 4.7 and later models produces approximately 30 percent more tokens for the same text than earlier models." } }],
      claims: ["tokens-price-unit", "tokens-price", "tokens-turns", "tokens-count-varies", "tokens-window-size"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What to count and what to cap",
      caption: "",
      show: ["ids", "tok", "tank", "bill", "caps"], counters: ["subword tokens", "6 token IDs", "7 token IDs", "limits, price, caps"],
      rides: [ride("meter", 0.12, 0.55, "counted")],
      body: [{ pair: {
        left: { label: "Count", items: ["Tokens before sending, with token counting", "Usage reported by every response", "Again when the model changes"] },
        right: { label: "Cap", items: ["Output tokens per request", "Tokens per minute per workspace", "Spend per month"] },
      } },
        "A response stops with the reason max_tokens when it reaches the max_tokens limit set in the request. Spend limits set a maximum monthly cost for an organisation, and each workspace can be given lower spend and rate limits of its own."],
      claims: ["tokens-counting", "tokens-usage", "tokens-count-varies", "tokens-max-output", "tokens-rate-limits", "tokens-spend-limits", "tokens-window-size", "tokens-price"],
    }),
  ],
  governance: { text: "Rate limits are measured in input and output tokens per minute, and spend limits cap the monthly cost. Both can be set lower for each workspace, so cost control and usage limits are enforced on token counts.", claims: ["tokens-rate-limits", "tokens-spend-limits"] },
  closing: {
    pitfalls: [
      "Estimating cost from word or character counts instead of counting tokens for the model in use.",
      "Reusing token counts measured on one model after moving to a model with a different tokeniser.",
      "Budgeting for the user's message and forgetting that instructions, history and output are counted too.",
    ],
    questions: [
      "Why can a vocabulary of fixed size represent a word it has never seen?",
      "Which tokens count toward the context window?",
      "Which two counts set the price of a request?",
    ],
  },
});
