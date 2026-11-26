import { CANVAS, defineGuide, isoGrid, line, pill, prism, ride, step } from "@signal-path/engine";

const G = isoGrid(500, 270, 30);

export default defineGuide({
  id: "multimodal-models", track: "ai", module: "Foundations", slug: "multimodal-models",
  title: "Multimodal models",
  summary: "A model can take in more than words. Modality-specific representations let it relate a photo, speech, document layout and text, then respond in a chosen form.",
  forLeads: "Photos, recordings and documents can carry personal data. Choose which media the task needs, control retention and access, and mark generated media when required.",
  status: "draft", minutes: 7,
  counters: ["Inputs used", "Evidence in view", "Output channel"],
  whatIf: { label: "What if Support sent every photo and recording?", step: 4, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order, media and reply are illustrative",
    label: "A Vinterhus customer asks about order 4468. The request can include text, a product photo, a voice note and a receipt. A multimodal model represents each input in a form it can process, relates the evidence, then returns text or speech. Architectures differ: not every model uses one shared vector space.",
    els: [
      line("flow", [[90, 438], [870, 438]], { always: true }),
      pill("question", [140, 92], "question text", { tone: "track", group: "text", anchor: "middle" }),
      pill("image", [360, 92], "product photo", { tone: "muted", group: "photo", anchor: "middle" }),
      pill("audio", [580, 92], "voice note", { tone: "muted", group: "voice", anchor: "middle" }),
      pill("page", [800, 92], "receipt layout", { tone: "muted", group: "receipt", anchor: "middle" }),
      prism("model", -0.6, -0.6, 1.2, 1.2, 32, { hue: "track", glyph: "net", title: "Multimodal model", sub: "representations + attention", at: "n", always: true }),
      pill("answer", [790, 294], "text or generated speech", { tone: "track", anchor: "middle", always: true }),
      pill("guard", [480, 380], "limit inputs · mark synthetic output", { tone: "muted", group: "guard", anchor: "middle" }),
    ],
  },
  steps: [
    step({
      id: "text", label: "Text only", kind: "problem", title: "The written question leaves evidence out",
      caption: "Support sees a message about order 4468: a chair leg snapped. The words say what happened, but not what the damage looks like or what the receipt records.",
      show: [], counters: ["text", "question only", "text"],
      rides: [ride("flow", 0.06, 0.94, "text question", { shape: "pill" })],
      body: ["The customer's message is one input. The damage photo and purchase receipt are separate evidence that a text-only model cannot inspect."],
      claims: ["multimodal-models-inputs"],
    }),
    step({
      id: "image", label: "Photo", kind: "idea", title: "A vision-language model relates image and text",
      caption: "Add the chair photo. A vision-language model represents visual content so it can be related to a question. It may still miss small or obscured details.",
      show: ["text", "photo"], counters: ["text + image", "question + photo", "text"],
      rides: [ride("flow", 0.06, 0.94, "vision-language model", { shape: "pill" })],
      body: ["GPT-4's technical report describes image and text inputs producing text. CLIP learns image representations by predicting which caption matches an image. These are examples of vision-language work, not a rule that every model uses the same representation."],
      claims: ["multimodal-models-inputs", "multimodal-models-image-text-alignment"],
    }),
    step({
      id: "speech", label: "Speech", kind: "mechanism", title: "Speech can enter and leave as audio",
      caption: "The customer adds a voice note. Speech recognition can turn recorded speech into text; a speech-to-speech system can receive and return audio directly.",
      show: ["text", "photo", "voice"], counters: ["text + image + audio", "question + photo + speech", "text or speech"],
      rides: [ride("flow", 0.06, 0.94, "speech input", { shape: "pill" })],
      body: ["Whisper is trained for speech recognition and translation. Current API patterns include speech-to-speech agents, file transcription, live captions and generated speech. Which path is used depends on the model and application."],
      claims: ["multimodal-models-speech-recognition", "multimodal-models-audio-workflows"],
    }),
    step({
      id: "document", label: "Document", kind: "mechanism", title: "Document understanding keeps layout in view",
      caption: "The receipt adds its printed text and page layout. Document understanding can relate words to their positions, such as an amount beside a product row.",
      show: ["text", "photo", "voice", "receipt"], counters: ["text + image + audio + page", "question + photo + speech + receipt", "text or speech"],
      rides: [ride("flow", 0.06, 0.94, "document understanding", { shape: "pill" })],
      body: ["DocFormer combines text, visual and spatial features for document understanding. The layout matters: a number's position can help show which label or row it belongs to."],
      claims: ["multimodal-models-document-layout"],
    }),
    step({
      id: "relate", label: "Relate", kind: "watch-out", title: "Different representations can inform one answer",
      caption: "The model relates the question to the photo and receipt, then drafts a reply. A match across media is evidence to check, not proof that the answer is right.",
      show: ["text", "photo", "voice", "receipt"], counters: ["four input forms", "combined evidence", "draft reply"],
      rides: [ride("flow", 0.06, 0.94, "draft answer", { shape: "pill" })],
      body: ["Multimodal architectures differ. CLIP aligns image and text representations for matching; DocFormer combines visual, text and spatial features using multimodal self-attention. A model's interpretation remains a claim to check against the original media."],
      claims: ["multimodal-models-image-text-alignment", "multimodal-models-attention"],
    }),
    step({
      id: "govern", label: "Govern", kind: "decision", title: "Choose media and mark output",
      caption: "Where faces and voices are personal data, use only what the task needs. Synthetic output needs machine-readable marking or disclosure when the law applies.",
      show: ["text", "photo", "voice", "receipt", "guard"], counters: ["only needed inputs", "checked evidence", "labelled when required"],
      rides: [ride("flow", 0.06, 0.94, "minimise and label", { shape: "pill" })],
      body: [{ pair: {
        left: { label: "Choose", items: ["Needed media", "Short retention"] },
        right: { label: "Check", items: ["Protect identity", "Mark synthetic media"] },
      } }, "The GDPR defines personal data broadly and treats biometric data as personal data where specific technical processing permits or confirms unique identification. The EU AI Act requires machine-readable marking of generated outputs and disclosure for deepfake image, audio or video, subject to its scope and exceptions."],
      claims: ["multimodal-models-gdpr-personal-data", "multimodal-models-gdpr-biometric-data", "multimodal-models-synthetic-marking", "multimodal-models-deepfake-disclosure"],
    }),
  ],
  governance: { text: "Photos and recordings can contain personal data. Limit them to the purpose, control access and retention, and mark or disclose synthetic outputs where applicable law requires it.", claims: ["multimodal-models-gdpr-personal-data", "multimodal-models-gdpr-biometric-data", "multimodal-models-synthetic-marking", "multimodal-models-deepfake-disclosure"] },
  closing: {
    pitfalls: [
      "Assuming every multimodal model puts all media into one shared vector space.",
      "Treating a fluent interpretation of a photo or recording as verified evidence.",
      "Sending faces, voices and whole documents when the task needs only a small part.",
    ],
    questions: [
      "How can a model relate a question to visual evidence?",
      "Why can a document's layout matter as well as its words?",
      "Which media does this task need, and how long should they be kept?",
    ],
  },
});
