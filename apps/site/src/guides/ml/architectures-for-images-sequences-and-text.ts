import { CANVAS, cells, defineGuide, isoGrid, layerConnection, layers, line, note, pill, prism, raise, ride, step, table } from "@signal-path/engine";
import type { Cell, El, LayersEl } from "@signal-path/engine";

// Two boards stand on the floor. The left one is the data: a photo, a call, a message.
// The right one is always the same kind of network, and only its wiring changes from stop to stop.
// The wiring is the assumption: all to all, three neighbours, one state passed along, every position by content.
const G = isoGrid(440, 236, 30);
const SIDE = 8.5;
const F1 = G.p(0, SIDE), F2 = G.p(SIDE, 0), V = G.p(SIDE, SIDE);

/* ---------- the data board ---------- */

/** The return photo as a grid of pixels. One column of six pixels feeds the network, and the scratch covers two of them. */
const photo = (id: string, group: string, scratch: number[]) => {
  const items: Cell[] = Array.from({ length: 24 }, (_, i) => {
    const row = Math.floor(i / 4), col = i % 4;
    if (col !== 1) return { t: "", mute: true };
    return scratch.includes(row) ? { t: `p${row + 1}`, hot: true } : { t: `p${row + 1}`, hue: "sky" };
  });
  return raise(cells(id, 0, 0, 4, [56, 38], items, { title: "Return photo", sub: "SOFA-2210", group }), F1, 30);
};
const strip = (id: string, group: string, title: string, sub: string, items: Cell[]) =>
  raise(cells(id, 0, 0, 1, [200, 38], items, { title, sub, group }), F1, 30);

/* ---------- the network board ---------- */

const NET = { w: 470, h: 300 };
type Link = [number, number, number, number];
const board = (id: string, group: string, sizes: number[], title: string, sub: string, labels: string[], connections: Link[] | undefined, hot: [number, number][]): LayersEl =>
  raise(layers(id, 0, 0, NET.w, NET.h, sizes, { title, sub, labels, connections, hot, group }), F2, 30);
const six = [0, 1, 2, 3, 4, 5];
const toOutput = (n: number): Link[] => Array.from({ length: n }, (_, i) => [1, i, 2, 0] as Link);
/** Convolution: each unit reads three neighbouring inputs. */
const LOCAL: Link[] = [...[0, 1, 2, 3].flatMap((j) => [0, 1, 2].map((k) => [0, j + k, 1, j] as Link)), ...toOutput(4)];
/** Recurrence: each state reads one input and the state before it. */
const CHAIN: Link[] = [...six.map((i) => [0, i, 1, i] as Link), ...six.slice(1).map((i) => [1, i - 1, 1, i] as Link), [1, 5, 2, 0]];
/** Attention: every position reads every position. */
const GLOBAL: Link[] = [...six.flatMap((a) => six.map((b) => [0, a, 1, b] as Link)), ...toOutput(6)];

const DENSE = board("dense", "dense", [6, 4, 1], "Fully connected network", "24 weights, none shared", ["pixels", "hidden units", "damaged"], undefined, [[0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [1, 3]]);
const CONV = board("conv", "conv", [6, 4, 1], "Convolutional network", "3 weights, shared", ["pixels", "feature map", "damaged"], LOCAL, [[0, 3], [0, 4], [1, 2], [1, 3], [2, 0]]);
const RNN = board("rnn", "rnn", [6, 6, 1], "Recurrent network", "one update rule, reused", ["frames", "states", "topic"], CHAIN, [...six.map((i) => [1, i] as [number, number]), [2, 0]]);
const ATT = board("att", "att", [6, 6, 1], "Transformer", "weights set by content", ["tokens", "token states", "topic"], GLOBAL, [[0, 1], [0, 3], [1, 4]]);
const VIT = board("vit", "vit", [6, 6, 1], "Vision transformer", "patches as tokens", ["patches", "patch states", "damaged"], GLOBAL, [[0, 0], [0, 5], [1, 2]]);
const BOTH = board("both", "both", [6, 6, 1], "Vision transformer", "patches as tokens", ["patches", "patch states", "damaged"], GLOBAL, []);

/** A route between units. The board hides the line, and the record rides it. */
const route = (id: string, net: LayersEl, from: [number, number], to: [number, number], group: string) => layerConnection(id, net, from, to, { w: 2, on: net.id, group });
/** The assumption a wiring builds in, on a plate under the network. */
const built = (group: string, text: string, sub: string, alert = false): El =>
  pill(`built-${group}`, [F2[0] + 118, F2[1] + 70], text, { sub, to: [F2[0] + 118, F2[1] - 24], tone: alert ? "alert" : undefined, group });
const dot = { shape: "dot" } as const;

export default defineGuide({
  id: "architectures-for-images-sequences-and-text", track: "ml", module: "Model families", slug: "architectures-for-images-sequences-and-text",
  title: "Architectures for images, sequences and text",
  summary: "An architecture is a wiring plan. Convolution, recurrence and attention each restrict or share the connections of a network, and each restriction is an assumption about the data.",
  forLeads: "The choice of architecture is a bet on the structure of the data and on how much data there is. Photos and call recordings bring biometric data and group-level error checks into scope.",
  status: "draft", minutes: 8,
  counters: ["Input", "Each unit reads", "Weights", "First input to last"],
  whatIf: { label: "What if every pixel kept its own weights?", step: 0, from: 1 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Photo, call, message and network sizes are illustrative",
    label: "Two boards joined by a rail. The left board holds the data: a return photo as a grid of pixels, a support call as audio frames, a message as tokens, the photo as patches. The right board is a network whose wiring changes at each stop: every input to every unit, three neighbouring inputs per unit, one state passed down a chain, every position to every position. A plate under the network names the assumption that the wiring builds in.",
    els: [
      line("feed", [F1, V, F2], { always: true }),

      // Stop 1: every pixel to every unit
      photo("photo-a", "dense", [1, 2]),
      DENSE,
      route("d1", DENSE, [0, 1], [1, 0], "dense"),
      route("d2", DENSE, [0, 2], [1, 3], "dense"),
      built("dense", "Nothing built in", "every pixel is a stranger"),

      // Stop 2: three neighbours, the same three weights everywhere
      photo("photo-b", "conv", [3, 4]),
      CONV,
      route("slide", CONV, [1, 0], [1, 3], "conv"),
      built("conv", "Locality", "one kernel, every position"),

      // Stop 3: one state carried from frame to frame
      strip("call", "rnn", "Support call", "audio", six.map((i) => `frame ${i + 1}`)),
      RNN,
      route("carry", RNN, [1, 0], [1, 5], "rnn"),
      built("rnn", "Order", "one state, step by step"),

      // Stop 4: every token reads every token
      strip("message", "att", "Message", "order 4471", ["my", { t: "sofa", hot: true }, "arrived", { t: "scratched", hot: true }, "please", { t: "refund", hue: "sky" }]),
      ATT,
      route("a1", ATT, [0, 1], [1, 4], "att"),
      route("a2", ATT, [0, 3], [1, 4], "att"),
      note("pos", ATT.x + 44, ATT.y + 21, "+ position on every token", { tone: "track", strong: true, on: "att", group: "att" }),
      built("att", "Content", "any position, one step"),

      // Stop 5: the photo as patches, with almost nothing built in
      raise(cells("patches", 0, 0, 2, [104, 78], six.map((i) => ({ t: `patch ${i + 1}`, hue: "sky" as const, hot: i === 0 || i === 5 })), { title: "Return photo", sub: "cut into patches", group: "vit" }), F1, 30),
      VIT,
      route("v1", VIT, [0, 0], [1, 2], "vit"),
      built("vit", "Little built in", "layout learned from data", true),

      // Stop 6: the data passes two controls before any network trains on it
      raise(table("sources", 0, 0, 270, ["Training data", "Carries"], [["Return photos", "faces"], ["Support calls", "voices"]], { title: "Vinterhus data", group: "both" }), F1, 30),
      BOTH,
      prism("lawful", 3.55, SIDE - 0.7, 1.4, 1.4, 30, { hue: "mint", glyph: "shield", title: "Biometric data", sub: "lawful basis", at: "sw", group: "both" }),
      prism("groups", SIDE - 0.7, 3.55, 1.4, 1.4, 30, { hue: "mint", glyph: "scale", title: "Error rates", sub: "by group", at: "se", group: "both" }),
    ],
  },
  steps: [
    step({
      id: "dense", label: "All to all", kind: "problem", title: "A fully connected layer assumes nothing",
      caption: "A return photo of SOFA-2210 shows a scratch. Every pixel has a separate weight to every unit, so a scratch that moves meets weights that never saw one.",
      show: ["dense"], counters: ["photo", "all 6 pixels", "24 separate", "1 layer"],
      rides: [ride("d1", 0, 0.5, "scratch", { ...dot, then: "weight 5 of 24" }), ride("d2", 0, 0.5, "scratch", { ...dot, then: "weight 12 of 24" })],
      body: ["Traditional neural network layers use a matrix of parameters with a separate parameter for the interaction between each input unit and each output unit. Every output unit interacts with every input unit.",
        "Nothing ties one position to another. The Deep Learning textbook makes the point for text: a fully connected network would need to learn all the rules of the language separately at each position in the sentence.",
        "The drawing takes one column of six pixels from the photo. Six pixels and four hidden units give 24 weights, and the scratch on pixels 2 and 3 touches eight of them."],
      claims: ["architectures-for-images-sequences-and-text-dense", "architectures-for-images-sequences-and-text-each-position"],
    }),
    step({
      id: "convolution", label: "Convolution", kind: "idea", title: "Convolution assumes that nearby pixels belong together",
      caption: "Each unit reads three neighbouring pixels through one small kernel. The same three weights slide over every position, so the scratch is found wherever it sits.",
      show: ["conv"], counters: ["photo", "3 neighbours", "3 shared", "2 layers"],
      rides: [ride("slide", 0, 1, "kernel", { ...dot, via: [0.33, 0.67], then: "same 3 weights" })],
      body: ["Convolutional networks are specialised for data with a known grid-like topology, such as a 2-D grid of pixels. They have sparse interactions, because the kernel is smaller than the input: an image might have millions of pixels, while edges can be detected with kernels of tens or hundreds of pixels.",
        "Each member of the kernel is used at every position of the input. Rather than a separate set of parameters for every location, only one set is learned. Fewer parameters reduce memory and improve statistical efficiency.",
        { callout: { label: "Key idea", text: "Parameter sharing makes the layer equivariant to translation: if the input shifts, the output shifts in the same way. Convolution is not naturally equivariant to changes in scale or rotation." } },
        "One layer does not connect distant pixels. Units in deeper layers have a larger receptive field and can be indirectly connected to all or most of the image.",
        "In PyTorch the layer is nn.Conv2d, and kernel_size sets the size of the kernel. torchvision.models ships convolutional families such as ResNet, ConvNeXt and EfficientNet with pre-trained weights."],
      claims: ["architectures-for-images-sequences-and-text-grid", "architectures-for-images-sequences-and-text-sparse", "architectures-for-images-sequences-and-text-sharing", "architectures-for-images-sequences-and-text-equivariance", "architectures-for-images-sequences-and-text-receptive-field", "architectures-for-images-sequences-and-text-conv2d"],
    }),
    step({
      id: "recurrence", label: "Recurrence", kind: "mechanism", title: "Recurrence assumes that order matters",
      caption: "A support call arrives frame by frame. One update rule runs at every step and passes on a state, a lossy summary of everything heard so far. Long-range dependencies are hard to learn.",
      show: ["rnn"], counters: ["call audio", "1 frame, 1 state", "2 shared", "5 steps"],
      rides: [ride("carry", 0, 1, "state", { ...dot, via: [0.2, 0.4, 0.6, 0.8], then: "lossy summary" })],
      body: ["Recurrent neural networks are specialised for processing a sequence of values, and most can process sequences of variable length.",
        "A recurrent network shares the same weights across time steps: each output is produced by the same update rule applied to the previous outputs. With separate parameters for each time index, a model could not generalise to sequence lengths it has not seen.",
        "The state is a lossy summary because it maps a sequence of arbitrary length to a vector of fixed length.",
        { callout: { label: "The cost", text: "Gradients propagated over many stages tend to vanish, or more rarely explode. Long-term interactions receive exponentially smaller weights than short-term ones." } },
        "PyTorch provides the long short-term memory network, a recurrent layer, as nn.LSTM."],
      claims: ["architectures-for-images-sequences-and-text-recurrent", "architectures-for-images-sequences-and-text-same-rule", "architectures-for-images-sequences-and-text-state", "architectures-for-images-sequences-and-text-long-term", "architectures-for-images-sequences-and-text-lstm"],
    }),
    step({
      id: "attention", label: "Attention", kind: "mechanism", title: "Attention lets every position read every other",
      caption: "In a transformer each token weighs all tokens by content, in one step. Nothing in the wiring encodes order, so position is added to the input.",
      show: ["att"], counters: ["message", "all 6 tokens", "shared, set by content", "1 layer"],
      rides: [ride("a1", 0, 0.55, "sofa", { ...dot, then: "1 step" }), ride("a2", 0, 0.55, "scratched", { ...dot, then: "1 step" })],
      body: ["The Transformer is based solely on attention mechanisms and dispenses with recurrence and convolutions entirely. Self-attention relates different positions of a single sequence to compute a representation of it.",
        "The shorter the path between two positions, the easier it is to learn a long-range dependency. A self-attention layer connects all positions with a constant number of sequential operations. A recurrent layer needs a number that grows with the length of the sequence.",
        { callout: { label: "What is given up", text: "With no recurrence and no convolution, the model has no notion of order. Positional encodings are added to the input embeddings to supply it." } },
        "In PyTorch, nn.TransformerEncoderLayer implements the original layer: self-attention followed by a feedforward network. Its documentation calls it a reference implementation."],
      claims: ["architectures-for-images-sequences-and-text-attention", "architectures-for-images-sequences-and-text-path", "architectures-for-images-sequences-and-text-position", "architectures-for-images-sequences-and-text-encoder-layer"],
    }),
    step({
      id: "data", label: "Data appetite", kind: "watch-out", title: "Fewer assumptions need more data",
      caption: "A vision transformer treats photo patches as tokens. Without the locality built into convolutional networks, it generalises poorly on insufficient data. Pre-trained at sufficient scale, it attains excellent results.",
      show: ["vit"], counters: ["photo patches", "all 6 patches", "shared, set by content", "1 layer"],
      rides: [ride("v1", 0, 0.55, "patch 1", { ...dot, then: "relation learned" })],
      body: ["The Vision Transformer splits an image into patches and feeds the sequence of their embeddings to a Transformer. Patches are treated the same way as tokens in language processing.",
        "It has much less image-specific inductive bias than a convolutional network, where locality, two-dimensional neighbourhood structure and translation equivariance are baked into every layer. All spatial relations between the patches have to be learned from scratch.",
        "Its authors report that, trained on mid-sized datasets such as ImageNet without strong regularisation, the models were a few percentage points below ResNets of comparable size, and that large scale training trumps inductive bias.",
        { callout: { label: "The other direction", text: "A built-in assumption can also be wrong. Convolution and pooling are only useful when the assumptions they make are reasonably accurate, and they can cause underfitting." } },
        "torchvision.models lists VisionTransformer and SwinTransformer beside the convolutional families."],
      claims: ["architectures-for-images-sequences-and-text-patches", "architectures-for-images-sequences-and-text-less-bias", "architectures-for-images-sequences-and-text-data-scale", "architectures-for-images-sequences-and-text-prior", "architectures-for-images-sequences-and-text-conv2d"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Convolutional network or transformer",
      caption: "",
      show: ["both"], counters: ["photos, calls", "all 6 patches", "shared, set by content", "1 layer"],
      rides: [ride("feed", 0.06, 0.5, "photos, calls", { via: [0.14], then: "checked" })],
      body: [{ pair: {
        left: { label: "Convolutional network", items: ["Locality and weight sharing built in", "Statistically efficient"] },
        right: { label: "Transformer", items: ["Any position in one step", "Pre-train at scale"] },
      } },
        "A convolutional network stores fewer parameters, which improves its statistical efficiency. A transformer connects all positions in a constant number of operations and attains excellent results when pre-trained at sufficient scale.",
        "Photos and call recordings can carry faces and voices. Regulation (EU) 2016/679 defines biometric data as personal data from specific technical processing of physical, physiological or behavioural characteristics that allow or confirm unique identification, such as facial images, and prohibits processing it to uniquely identify a person unless a listed exception applies. Regulation (EU) 2024/1689 names voice among the features used in biometric identification.",
        "NIST tested 189 face recognition algorithms and found that false positive rates often vary across demographic groups by factors of 10 to beyond 100. It states that the system owner should measure accuracy on the operational data and report false negative and false positive rates for each demographic group.",
        "Speech shows the same pattern. A study of five speech recognition systems found an average word error rate of 0.35 for black speakers and 0.19 for white speakers."],
      claims: ["architectures-for-images-sequences-and-text-sparse", "architectures-for-images-sequences-and-text-path", "architectures-for-images-sequences-and-text-data-scale", "architectures-for-images-sequences-and-text-biometric", "architectures-for-images-sequences-and-text-voice", "architectures-for-images-sequences-and-text-face-errors", "architectures-for-images-sequences-and-text-measure-groups", "architectures-for-images-sequences-and-text-speech-errors"],
    }),
  ],
  governance: {
    text: "Regulation (EU) 2016/679 defines data from specific technical processing of physical, physiological or behavioural characteristics, such as facial images, as biometric data when it allows unique identification, and prohibits processing it for that purpose unless a listed exception applies. Regulation (EU) 2024/1689 names voice among such features. A 2018 study found face benchmarks overwhelmingly lighter-skinned and commercial classifiers with error rates of up to 34.7% for darker-skinned women against 0.8% for lighter-skinned men, and NIST states that error rates are to be reported for each demographic group.",
    claims: ["architectures-for-images-sequences-and-text-biometric", "architectures-for-images-sequences-and-text-voice", "architectures-for-images-sequences-and-text-dataset-skew", "architectures-for-images-sequences-and-text-face-errors", "architectures-for-images-sequences-and-text-measure-groups"],
  },
  closing: {
    pitfalls: [
      "Training a transformer from scratch on a small image dataset and expecting it to match a convolutional network.",
      "Feeding a transformer tokens without position information and expecting it to respect word order.",
      "Reporting one overall error rate for a face or speech model, with no breakdown by demographic group.",
    ],
    questions: [
      "Which two properties of convolution reduce the number of weights, and what does each assume about an image?",
      "Why is a recurrent network's state a lossy summary of the sequence?",
      "What does a vision transformer have to learn from data that a convolutional network has built in?",
    ],
  },
});
