import { blocks, CANVAS, cells, defineGuide, doc, isoGrid, line, pill, plot, prism, raise, ride, rule, series, step, stop } from "@signal-path/engine";
import type { BlocksEl, Cell, CellsEl, Hue, PillEl } from "@signal-path/engine";

// The floor: a V of rail with the model at its foot. The left arm is the input sequence and the right arm is the reply.
// The board at the top of the left arm is the medium itself: a photo as a grid of cells, a voice note as a waveform,
// a scanned receipt as regions. Each piece cut from it becomes one block beside the rail, behind the text tokens of the
// question. The board at the top of the right arm is the reply in text, or the vector space all the pieces share.
// One hue per medium throughout: sky is text, sand the photo, mint the voice note, rose the receipt.
const G = isoGrid(505, 420, 30);
const L = G.p(-11.5, 0), R = G.p(0, -8.5);
const SIZE = 0.42, GAP = 0.1, STEP = SIZE + GAP;
const row = (id: string, gx: number, n: number, hue: Hue, group?: string): BlocksEl =>
  blocks(id, gx, 0.55, n, SIZE, Array.from({ length: n }, () => ({ h: 12, hue })), { gap: GAP, group, always: group ? undefined : true });
/** The name of a row of blocks, on a plate in the open floor in front of it. */
const named = (id: string, k: number, gx: number, text: string, group?: string, extra: Partial<PillEl> = {}) =>
  pill(id, [128 + k * 78, 346 + k * 42], text, { anchor: "middle", to: G.p(gx + 1, 1.15), group, always: group ? undefined : true, ...extra });
const PATCH_AT = -10.75, FRAME_AT = PATCH_AT + 6 * STEP + 0.1, REGION_AT = FRAME_AT + 4 * STEP + 0.1, TEXT_AT = REGION_AT + 4 * STEP + 0.1;

/* ---------- the medium, on the left board ---------- */

// The photo: six by four cells, the sofa in sand. Cut two by two, it comes apart into six patches.
const SOFA = ["......", ".####.", "######", "#....#"];
const pixel = (x: number, y: number): Cell => ({ t: "", hue: SOFA[y][x] === "#" ? "sand" : undefined });
const RAW = raise(cells("photo-raw", 0, 0, 6, [40, 36], SOFA.flatMap((r, y) => [...r].map((_, x) => pixel(x, y))), { title: "Product photo", sub: "24 cells", group: "raw" }), L, 30);
const PATCH: [number, number] = [84, 70], BETWEEN: [number, number] = [14, 28];
const PATCHES: CellsEl[] = Array.from({ length: 6 }, (_, k) => {
  const px = k % 3, py = Math.floor(k / 3);
  const x = Math.round(L[0] - (3 * PATCH[0] + 2 * BETWEEN[0]) / 2) + px * (PATCH[0] + BETWEEN[0]), y = L[1] - 30 - (2 - py) * PATCH[1] - (1 - py) * BETWEEN[1];
  return cells(`patch-${k + 1}`, x, y, 2, [40, 33], [0, 1, 2, 3].map((i) => pixel(px * 2 + (i % 2), py * 2 + Math.floor(i / 2))), {
    title: `p${k + 1}`, card: false, stand: k === 4 ? L : undefined, group: "photo",
  });
});

// The voice note: a waveform over time, cut into four frames.
const WAVE = raise(plot("wave", 0, 0, 290, 176, [0, 4], [-1, 1], {
  title: "Voice note", sub: "4 frames", xt: [0.5, 1.5, 2.5, 3.5], xtl: ["f1", "f2", "f3", "f4"], yt: [0], ytl: [""], group: "voice",
}), L, 30);
const SOUND: [number, number][] = Array.from({ length: 41 }, (_, i) => {
  const x = i / 10, loud = 0.25 + 0.6 * Math.abs(Math.sin(x * 1.3 + 0.4));
  return [x, Math.round(Math.sin(x * 11) * loud * 100) / 100];
});

// The scanned receipt: four regions, each a piece of text in a box on the page.
const RECEIPT = raise(cells("receipt", 0, 0, 2, [128, 60], ["order 4468", "12 Nov", "SOFA-2210", "8 990"].map((t): Cell => ({ t, hue: "rose" })), {
  title: "Scanned receipt", sub: "4 regions", ticks: ["left column", "right column"], group: "receipt",
}), L, 30);

/* ---------- the reply and the shared space, on the right board ---------- */

const reply = (n: number, lines: string[], tone?: "alert") => raise(doc(`reply-${n}`, 0, 0, 300, 122, "Reply", lines, { tone, group: `reply-${n}` }), R, 30);
const SPACE = raise(plot("space", 0, 0, 380, 230, [0, 10], [0, 10], {
  title: "One shared vector space", xt: [0, 5, 10], yt: [0, 5, 10], xLabel: "dimension 1", yLabel: "dimension 2", group: "space",
}), R, 30);
const point = (id: string, label: string, x: number, y: number, hue: Hue) => series(id, "space", "points", [[x, y]], { label, hue, group: "space" });
const near = (id: string, a: [number, number], b: [number, number]) => series(id, "space", "line", [a, b], { tone: "muted", w: 2, dashed: true, group: "space" });

export default defineGuide({
  id: "multimodal-models", track: "ai", module: "Foundations", slug: "multimodal-models",
  title: "Multimodal models",
  summary: "A multimodal model cuts a photo into patches, speech into frames and a document into regions, and turns each piece into a vector. The vectors join the text tokens in one sequence and one vector space, and the model answers in text.",
  forLeads: "Photos, recordings and scanned documents can carry faces, voices and other personal data. Decide which media a task needs before sending them, and mark generated speech and images.",
  status: "draft", minutes: 7,
  counters: ["Media read", "Input sequence", "Reply"],
  whatIf: { label: "What if the model read text only?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order, media, piece counts and the two-dimensional map are illustrative",
    label: "A rail runs down from a board to a model and up again to a reply. The board holds the medium: a product photo as a grid of cells cut into six patches, a voice note as a waveform cut into four frames, a scanned receipt as four regions. Each piece becomes a block beside the rail, behind the four text tokens of the question, in one sequence. On a chart of one shared vector space, the photo lands near the word sofa, the voice note near refund and the scan near receipt. The model replies in text, and generated speech passes a provenance mark.",
    els: [
      line("io", [L, G.p(0, 0), R], { always: true }),
      stop("s-in", ...G.p(-6, 0), undefined, undefined, { always: true }),
      stop("s-model", ...G.p(0, 0), undefined, undefined, { always: true }),
      stop("s-out", ...G.p(0, -4.6), undefined, undefined, { always: true }),

      // The question: four text tokens, at every stop
      row("b-text", TEXT_AT, 4, "sky"),
      named("n-text", 3, TEXT_AT, "Can I return this?", undefined, { sub: "4 text tokens", mono: true }),
      blocks("b-out", 0.55, -3.9, 5, SIZE, Array.from({ length: 5 }, () => ({ h: 12, hue: "sky" as const })), { gap: GAP, dir: "gy", always: true }),

      // Stop 1: a model that reads text only
      prism("model-text", -0.6, -0.6, 1.2, 1.2, 30, { hue: "paper", glyph: "lines", title: "Text-only model", at: "s", group: "raw" }),
      RAW,
      reply(1, ["Return which item?", "I received text only."], "alert"),

      // Stops 2 to 6: the multimodal model
      prism("model", -0.6, -0.6, 1.2, 1.2, 30, { hue: "track", glyph: "net", title: "Multimodal model", at: "s", group: "mm" }),

      // Stop 2: the photo, cut into patches
      ...PATCHES,
      row("b-patch", PATCH_AT, 6, "sand", "patches"),
      named("n-patch", 0, PATCH_AT + 0.5, "6 patch vectors", "patches"),
      reply(2, ["The photo shows a", "three-seat sofa."]),

      // Stop 3: the voice note, cut into frames
      WAVE,
      series("sound", "wave", "line", SOUND, { tone: "track", w: 2, smooth: true, group: "voice" }),
      rule("f-1", "wave", 1, { group: "voice" }), rule("f-2", "wave", 2, { group: "voice" }), rule("f-3", "wave", 3, { group: "voice" }),
      row("b-frame", FRAME_AT, 4, "mint", "frames"),
      named("n-frame", 1, FRAME_AT, "4 frame vectors", "frames"),
      reply(3, ["A three-seat sofa.", "You say it arrived torn."]),

      // Stop 4: the receipt, read as regions
      RECEIPT,
      row("b-region", REGION_AT, 4, "rose", "regions"),
      named("n-region", 2, REGION_AT, "4 region tokens", "regions"),
      reply(4, ["SOFA-2210, order 4468.", "Paid 8 990. Arrived torn.", "A return can be opened."]),

      // Stop 5: every piece is a point in one space
      SPACE,
      point("w-sofa", "sofa", 7.6, 5.6, "sky"), point("w-lamp", "lamp", 8.6, 2.2, "sky"),
      point("w-refund", "refund", 2.2, 3.5, "sky"), point("w-receipt", "receipt", 1.8, 8.3, "sky"),
      point("m-voice", "voice note", 2.6, 1.6, "mint"), point("m-scan", "scan", 2.2, 6.4, "rose"),
      near("n-photo", [7.2, 7.6], [7.6, 5.6]), near("n-voice", [2.6, 1.6], [2.2, 3.5]), near("n-scan", [2.2, 6.4], [1.8, 8.3]),
      series("land", "space", "line", [[4.6, 5.2], [7.2, 7.6]], { tone: "track", w: 3, group: "space" }),
      series("m-photo", "space", "points", [[7.2, 7.6]], { hue: "sand", group: "space" }),

      // Stop 6: what is sent and what is marked
      prism("mark", -0.5, -7.6, 1, 1, 24, { hue: "mint", glyph: "flag", title: "Provenance mark", sub: "generated speech", at: "se", group: "controls" }),
      pill("c-in", [340, 64], "Personal data", { sub: "faces and voices", glyph: "lock", anchor: "start", to: [L[0] + 136, 96], group: "controls" }),
    ],
  },
  steps: [
    step({
      id: "text", label: "Text only", kind: "problem", title: "A text model reads only the words",
      caption: "A customer writes “Can I return this?” and attaches a photo of a sofa. A text-only model receives four tokens. The photo has no tokens, so “this” points at nothing.",
      show: ["raw", "reply-1"], counters: ["text", "4 vectors", "asks which item"],
      rides: [ride("io", 0.04, "s-in", "photo", { then: "no tokens", tone: "alert" })],
      body: ["Embeddings showed how each text token becomes a vector. A model built for text has no such step for pixels, sound or a scanned page.",
        "A multimodal model does. The GPT-4 technical report describes a large-scale multimodal model that accepts image and text inputs and produces text outputs."],
      claims: ["multimodal-models-inputs"],
    }),
    step({
      id: "patches", label: "Patches", kind: "idea", title: "A photo becomes a sequence of patch vectors",
      caption: "A vision-language model cuts the photo into patches and turns each patch into a vector. The six vectors join the four text tokens in one sequence, and the reply names the sofa.",
      show: ["mm", "photo", "patches", "reply-2"], counters: ["text, photo", "10 vectors", "names the sofa"],
      rides: [ride("io", 0.04, "s-out", "6 patches", { via: ["s-in", "s-model"], then: "text reply" })],
      body: ["The Vision Transformer splits an image into patches and gives the sequence of linear embeddings of those patches to a Transformer. Image patches are treated the same way as tokens in a language application.",
        "LLaVA, a vision-language model, connects a vision encoder to a large language model. A trainable projection converts the image features into language embedding tokens with the same dimensionality as the word embedding space of the language model.",
        { callout: { label: "Key idea", text: "Once every piece is a vector of the same size, attention treats a patch and a word alike." } },
        "Vendors count images in the same unit as text. Google documents that an image of at most 384 pixels in both dimensions counts as 258 tokens in the Gemini API."],
      claims: ["multimodal-models-inputs", "multimodal-models-patches", "multimodal-models-projection", "multimodal-models-token-counts"],
    }),
    step({
      id: "frames", label: "Frames", kind: "mechanism", title: "Speech is cut into frames along time",
      caption: "The customer adds a voice note. Speech input slices the waveform into short windows of time, and an encoder turns them into vectors that join the same sequence.",
      show: ["mm", "voice", "patches", "frames", "reply-3"], counters: ["text, photo, voice", "14 vectors", "adds what was said"],
      rides: [ride("sound", 0, 0.62, "f3"), ride("io", "s-in", "s-out", "4 frames", { via: ["s-model"], then: "text reply" })],
      body: ["Whisper, a speech recognition model, re-samples audio to 16,000 Hz and computes an 80-channel log-magnitude Mel spectrogram on 25-millisecond windows with a stride of 10 milliseconds. A Transformer encoder processes that representation.",
        "Google states that all input to the Gemini API is tokenised, including images, video and audio, and counts audio as 32 tokens per second.",
        "Speech can also be the output. OpenAI documents separate audio workflows for speech-to-speech agents, transcripts of audio files, live captions, continuous speech translation and generated speech."],
      claims: ["multimodal-models-audio-frames", "multimodal-models-all-tokenised", "multimodal-models-token-counts", "multimodal-models-audio-workflows"],
    }),
    step({
      id: "layout", label: "Layout", kind: "mechanism", title: "A document keeps its layout",
      caption: "Document understanding reads the scanned receipt as regions: each piece of text with the box it sits in. Position puts 8 990 beside SOFA-2210, on the same row.",
      show: ["mm", "receipt", "patches", "frames", "regions", "reply-4"], counters: ["text, photo, voice, receipt", "18 vectors", "cites the order"],
      rides: [ride("io", 0.04, "s-out", "4 regions", { via: ["s-in", "s-model"], then: "text reply" })],
      body: ["DocFormer is a multi-modal transformer for visual document understanding of formats such as forms and receipts. It combines text, vision and spatial features with multi-modal self-attention, and its spatial features are the bounding box coordinates of each word.",
        "LayoutLM jointly models text and layout information across scanned document images, for tasks such as information extraction from scanned documents.",
        "Read as plain text, the receipt is a list of words. With the boxes, the amount belongs to the product code on its row."],
      claims: ["multimodal-models-document-layout", "multimodal-models-layoutlm"],
    }),
    step({
      id: "space", label: "One space", kind: "mechanism", title: "Every medium is a point in one space",
      caption: "Training on matching pairs pulls them together. A sofa photo lands near the word sofa, the voice note near refund, the scan near receipt. Closeness is cosine similarity, as for text.",
      show: ["mm", "photo", "patches", "frames", "regions", "space"], counters: ["text, photo, voice, receipt", "18 vectors, one space", "cites the order"],
      rides: [ride("land", 0, 1, "sofa photo")],
      body: ["CLIP jointly trains an image encoder and a text encoder to maximise the cosine similarity of the image and text embeddings of real pairs in a multi-modal embedding space, and to minimise it for incorrect pairings.",
        "ImageBind learns a joint embedding across six modalities: images, text, audio, depth, thermal and IMU data. Its authors report that image-paired data is sufficient to bind the modalities together, which enables cross-modal retrieval.",
        { callout: { label: "Watch out", text: "Designs differ. CLIP and ImageBind train separate encoders into a joint space. LLaVA projects image features into the word embedding space of a language model. A near neighbour is a similarity score, not a verified fact." } }],
      claims: ["multimodal-models-shared-space", "multimodal-models-joint-embedding", "multimodal-models-projection"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What to send and what to mark",
      caption: "",
      show: ["mm", "photo", "patches", "frames", "regions", "reply-4", "controls"], counters: ["only what the task needs", "18 vectors, one space", "text, or marked speech"],
      rides: [ride("io", "s-model", "s-out", "reply", { then: "text reply" })],
      body: [{ pair: {
        left: { label: "Send", items: ["Only the media the task needs", "Faces and voices as personal data"] },
        right: { label: "Mark", items: ["Generated speech and images", "Deepfakes, with disclosure"] },
      } },
        "The GDPR defines personal data as any information relating to an identified or identifiable natural person, and requires it to be limited to what is necessary for the purpose. Facial images are its example of biometric data when specific technical processing allows unique identification. Recital 15 of the EU AI Act lists the face and the voice among the features that biometric identification recognises.",
        "Article 50 of the EU AI Act requires providers of systems that generate synthetic audio, image, video or text to mark the output in a machine-readable format, and deployers to disclose deepfakes, subject to its exceptions. Recital 133 names watermarks, metadata identifications and cryptographic methods for proving provenance among the techniques."],
      claims: ["multimodal-models-gdpr-personal-data", "multimodal-models-gdpr-minimisation", "multimodal-models-gdpr-biometric-data", "multimodal-models-voice", "multimodal-models-synthetic-marking", "multimodal-models-deepfake-disclosure", "multimodal-models-provenance-techniques"],
    }),
  ],
  governance: {
    text: "A photo or voice note that relates to an identifiable person is personal data under the GDPR and must be limited to what the purpose needs. The EU AI Act requires generated audio, image, video and text to be marked in a machine-readable format and deepfakes to be disclosed, subject to its exceptions.",
    claims: ["multimodal-models-gdpr-personal-data", "multimodal-models-gdpr-minimisation", "multimodal-models-gdpr-biometric-data", "multimodal-models-voice", "multimodal-models-synthetic-marking", "multimodal-models-deepfake-disclosure"],
  },
  closing: {
    pitfalls: [
      "Assuming every multimodal model places all media in one shared vector space in the same way.",
      "Treating a near neighbour or a fluent reading of a photo as verified evidence.",
      "Sending faces, voices and whole documents when the task needs only a small part.",
    ],
    questions: [
      "What does a photo become before a transformer can read it beside text?",
      "Why does a receipt need the position of each word as well as the word?",
      "Which of the media in this request are personal data, and which output must be marked?",
    ],
  },
});
