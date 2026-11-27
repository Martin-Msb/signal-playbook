import { CANVAS, defineGuide, drum, isoGrid, layers, layerUnitPositions, line, list, note, pill, plot, plotPoint, prism, raise, ride, rule, series, step, stop } from "@signal-path/engine";
import type { El, Pt } from "@signal-path/engine";

// Two boards stand on the floor. The left one is the network that sorts photos of returned items.
// The right one plots its accuracy on held-out photos against the number of labelled photos it trains on.
// Two rails reach the network: the 240 labelled photos from the left, and a pretrained model's weights from the front.
// The reader watches the lit layers arrive with the weights, and the accuracy at 240 photos climb.
const G = isoGrid(480, 240, 30);
const F1 = G.p(0, 7.4), F2 = G.p(7.4, 0);

/* ---------- the accuracy board ---------- */

/** Photos are plotted on a log scale: 2 is 100 photos, 5 is 100,000. */
const N = 2.38, FAR = 4.5;
const SCRATCH: [number, number][] = [[2, 54], [N, 58], [3, 66], [3.5, 73], [4, 81], [FAR, 88], [5, 92]];
const FROZEN: [number, number][] = [[2, 82], [N, 88], [3, 90], [4, 91], [5, 91.5]];
const TUNED: [number, number][] = [[2, 86], [N, 93], [3, 95.5], [4, 97], [5, 97.5]];
const ACC = raise(plot("acc", 0, 0, 420, 280, [1.7, 5.3], [50, 100], {
  title: "Held-out accuracy, %", xt: [2, 3, 4, 5], xtl: ["100", "1,000", "10,000", "100,000"], yt: [50, 60, 70, 80, 90, 100],
  xLabel: "labelled photos", always: true,
}), F2, 30);
/** A hidden marker on a curve at 240 photos, so a record can be sent there. */
const at240 = (id: string, y: number) => stop(id, ...plotPoint(ACC, N, y), undefined, undefined, { group: "anchor" });
const drop = (id: string, x: number, group: string) => series(id, "acc", "line", [[x, 50], [x, 88]], { tone: "muted", w: 2, dashed: true, group });

/* ---------- the network board ---------- */

const S = [3, 5, 5, 5, 2];
const every = (from: number, to: number): [number, number][] => S.flatMap((k, i) => (i >= from && i <= to ? Array.from({ length: k }, (_, j) => [i, j] as [number, number]) : []));
const board = (id: string, group: string, title: string, sub: string, labels: string[], hot?: [number, number][]) =>
  raise(layers(id, 0, 0, 420, 280, S, { title, sub, labels, hot, group }), F1, 30);
const RAW = board("n-raw", "raw", "Network", "random weights", ["photo", "", "hidden layers", "", "class"]);
const PRE = board("n-pre", "pre", "Pretrained network", "1,000 classes", ["photo", "general features", "", "specific features", "class"], every(0, 4));
const FRO = board("n-fro", "frozen", "Return classifier", "last layer trained", ["photo", "frozen layers", "", "embedding", "new layer"], every(0, 3));
const TUN = board("n-tun", "tuned", "Return classifier", "all layers trained", ["photo", "", "unfrozen, low learning rate", "", "class"], every(0, 4));
const BAD = board("n-bad", "bad", "Return classifier", "all layers trained", ["photo", "", "", "", "class"], every(0, 4));
const U = layerUnitPositions(RAW), NET = { x: RAW.x, y: RAW.y };
/** A route through the units of a board. The board hides the line, and the record rides it. */
const route = (id: string, on: string, group: string, out: number): El => line(id, [U[0][1], U[1][1], U[2][2], U[3][1], U[4][out]] as Pt[], { w: 2, on, group });
const dot = { shape: "dot" } as const;

export default defineGuide({
  id: "representation-and-transfer-learning", track: "ml", module: "Model families", slug: "representation-and-transfer-learning",
  title: "Representation and transfer learning",
  summary: "A network pretrained on broad data has already learned features. Freezing them and training a new last layer, then fine-tuning, reaches a target accuracy with far fewer labelled examples.",
  forLeads: "Starting from pretrained weights cuts the labelling bill. It also makes a third party's model part of yours, so its licence, source and file format are checked before training.",
  status: "draft", minutes: 7,
  counters: ["Labelled photos", "Layers trained", "Starting weights", "Held-out accuracy"],
  whatIf: { label: "What if the weights started random?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Photos, accuracies, curves and the intake record are illustrative",
    label: "Two boards. The left one draws the network that sorts photos of returned items into damaged and resaleable. The right one plots accuracy on held-out photos against the number of labelled photos. From random weights the network is far below target at 240 photos. A pretrained model's weights arrive on a rail and light the layers. With those layers frozen and a new last layer trained, the curve reaches the target at 240 photos, where training from scratch needs about 32,000. Fine-tuning lifts the curve again. A backdoored download leaves the accuracy unchanged, and an intake check stands on the rail.",
    els: [
      ACC,
      series("c-scratch", "acc", "line", SCRATCH, { tone: "ink", w: 3, always: true }),
      note("c-scratch-n", ...plotPoint(ACC, 4.42, 76), "from scratch", { strong: true, on: "acc", always: true }),
      at240("a-scratch", 58), at240("a-frozen", 88), at240("a-tuned", 93),

      line("lab", [G.p(0, 11), F1], { always: true }),
      drum("photos", 0, 11.9, 0.9, 22, { hue: "sky", glyph: "table", title: "Return photos", sub: "240 labelled", at: "s", always: true }),

      // Stop 1: random weights
      RAW,

      // Stop 2: the pretrained model arrives
      line("wts", [G.p(8, 7.4), F1], { group: "rail" }),
      prism("hub", 8, 6.6, 1.6, 1.6, 34, { hue: "violet", glyph: "net", title: "Pretrained model", sub: "1.2 million images", at: "e", group: "hub" }),
      PRE,

      // Stop 3: frozen features, a new last layer
      FRO, route("r-fro", "n-fro", "frozen", 0),
      pill("lock", [NET.x + 12, NET.y + 12], "Frozen", { glyph: "lock", anchor: "start", to: U[1][0], on: "n-fro", group: "frozen" }),
      series("c-frozen", "acc", "line", FROZEN, { w: 4, group: "c-frozen" }),
      note("c-frozen-n", ...plotPoint(ACC, 2.75, 93.5), "pretrained, new last layer", { strong: true, tone: "track", on: "acc", group: "c-frozen" }),
      rule("target", "acc", 88, { axis: "y", tone: "muted", label: "target 88%", group: "target" }),
      drop("d-near", N, "target"), drop("d-far", FAR, "target"),
      note("d-near-n", ...plotPoint(ACC, N + 0.07, 52.5), "240", { strong: true, mono: true, tone: "track", on: "acc", group: "target" }),
      note("d-far-n", ...plotPoint(ACC, FAR - 0.07, 52.5), "32,000", { strong: true, mono: true, anchor: "end", on: "acc", group: "target" }),

      // Stop 4: fine-tuning
      TUN,
      series("c-frozen-old", "acc", "line", FROZEN, { tone: "muted", w: 3, dashed: true, group: "c-old" }),
      series("c-tuned", "acc", "line", TUNED, { w: 4, group: "c-tuned" }),
      note("c-tuned-n", ...plotPoint(ACC, 3.1, 98.3), "fine-tuned", { strong: true, tone: "track", on: "acc", group: "c-tuned" }),
      note("c-old-n", ...plotPoint(ACC, 3.3, 84.5), "new last layer only", { tone: "muted", on: "acc", group: "c-old" }),

      // Stop 5: a backdoored download
      prism("hub-bad", 8, 6.6, 1.6, 1.6, 34, { hue: "violet", glyph: "net", title: "Pretrained model", sub: "backdoor inside", at: "e", state: "alert", group: "hub-bad" }),
      BAD, route("r-bad", "n-bad", "bad", 1),
      pill("door", [NET.x + 12, NET.y + 12], "Backdoor", { anchor: "start", tone: "alert", to: U[1][1], on: "n-bad", group: "bad" }),
      note("same-n", ...plotPoint(ACC, 3.6, 86.5), "validation unchanged", { tone: "alert", strong: true, on: "acc", group: "bad" }),

      // Stop 6: the intake check
      prism("gate", 4.3, 6.7, 1.4, 1.4, 30, { hue: "mint", glyph: "shield", title: "Intake check", sub: "before training", at: "sw", group: "gate" }),
      raise(list("record", 0, 0, 206, ["licence: apache-2.0", "trained on: stated", "file: safetensors", "commit: signed"], { title: "Intake record", sub: "weights", rowH: 24, mono: true, group: "gate" }), [842, 498], 12),
    ],
  },
  steps: [
    step({
      id: "scratch", label: "From scratch", kind: "problem", title: "Training from scratch needs many labels",
      caption: "Operations has 240 labelled photos of returned items. A network trained on them from random weights reaches 58% on held-out photos. The target is 88%.",
      show: ["raw"], counters: ["240", "all", "random", "58%"],
      rides: [ride("lab", 0.1, 0.62, "photos"), ride("c-scratch", 0, "a-scratch", "100 photos", { then: "240: 58%" })],
      body: ["The classifier sorts each photo of a returned item into damaged or resaleable. Every weight starts random, so every feature has to be learned from the 240 photos.",
        "In practice very few people train an entire convolutional network from scratch, because it is relatively rare to have a dataset of sufficient size.",
        "The curve shows what more labels would buy. On this task training from scratch reaches the target at about 32,000 labelled photos."],
      claims: ["representation-and-transfer-learning-scratch"],
    }),
    step({
      id: "pretrained", label: "Pretrained", kind: "idea", title: "Pretraining on broad data learns general features",
      caption: "A network pretrained on 1.2 million images arrives. Its first layer holds features like Gabor filters and colour blobs, general across many tasks. Its last layer is specific to its original task.",
      show: ["pre", "rail", "hub"], counters: ["240", "none yet", "pretrained", "not measured"],
      rides: [ride("wts", 0.06, 0.78, "weights", { then: "features" })],
      body: ["It is common to pretrain a network on a very large dataset such as ImageNet, with 1.2 million images in 1000 categories, and then use it as an initialisation or as a fixed feature extractor for the task of interest.",
        { callout: { label: "Key idea", text: "Transfer learning consists of taking features learned on one problem, and leveraging them on a new, similar problem." } },
        "First-layer features are applicable to many datasets and tasks. Features must eventually transition from general to specific by the last layer of the network.",
        "Pretraining does not need labels. Self-supervised learning creates surrogate labels from unlabelled examples, and BERT pre-trains its representations from unlabelled text.",
        "Foundation models are this pattern at scale: models such as BERT, DALL-E and GPT-3, trained on broad data and adaptable to a wide range of downstream tasks. They are based on standard deep learning and transfer learning."],
      claims: ["representation-and-transfer-learning-pretrain", "representation-and-transfer-learning-definition", "representation-and-transfer-learning-general-specific", "representation-and-transfer-learning-self-supervised", "representation-and-transfer-learning-foundation"],
    }),
    step({
      id: "freeze", label: "Frozen features", kind: "mechanism", title: "A new last layer trains on the frozen features",
      caption: "The pretrained layers are frozen and turn each photo into an embedding. Only a new last layer trains on the 240 photos, and reaches 88%. From scratch that takes about 32,000.",
      show: ["frozen", "rail", "hub", "c-frozen", "target"], counters: ["240", "last layer", "pretrained, frozen", "88%"],
      rides: [ride("r-fro", 0, 0.75, "photo", { ...dot, then: "embedding" }), ride("r-fro", 0.75, 1, "embedding", { ...dot, then: "damaged" }), ride("c-frozen", 0, "a-frozen", "100 photos", { then: "240: 88%" })],
      body: ["The workflow takes layers from a previously trained model, freezes them so the information they contain is not destroyed, adds a new trainable layer on top, and trains that layer on the new dataset.",
        "An embedding is a vector representation of data in embedding space. Items that are close in it are more closely related than distant ones, which is why a single new layer can separate damaged from resaleable.",
        "In PyTorch, requires_grad = False freezes a parameter so its gradient is not computed in backward(). In Keras, layer.trainable = False does the same. The PyTorch tutorial trains on about 120 images per class.",
        { callout: { label: "Reported result", text: "The authors of SimCLR report that a linear classifier trained on its self-supervised representations reaches 76.5% top-1 accuracy on ImageNet, matching a supervised ResNet-50." } }],
      claims: ["representation-and-transfer-learning-freeze", "representation-and-transfer-learning-embedding", "representation-and-transfer-learning-requires-grad", "representation-and-transfer-learning-fewer-labels"],
    }),
    step({
      id: "fine-tune", label: "Fine-tuning", kind: "mechanism", title: "Fine-tuning retrains every layer at a low learning rate",
      caption: "Once the new layer has converged, every layer is unfrozen and trains on the 240 photos. Accuracy rises to 93%. A large model on little data can overfit quickly.",
      show: ["tuned", "rail", "hub", "c-tuned", "c-old"], counters: ["240", "all, low rate", "pretrained", "93%"],
      rides: [ride("lab", 0.1, 0.62, "photos"), ride("c-tuned", 0, "a-tuned", "100 photos", { then: "240: 93%" })],
      body: ["Fine-tuning is a last, optional step: unfreeze the entire model and re-train it on the new data with a very low learning rate. It can achieve meaningful improvements by incrementally adapting the pretrained features to the new data.",
        "It trains a much larger model than the first round, on a dataset that is typically very small, so large weight updates overfit very quickly.",
        "How much transfers depends on the tasks. Transferability decreases as the distance between the base task and the target task increases, but features from distant tasks can still be better than random ones, and the boost to generalisation lingers after fine-tuning.",
        "The authors of SimCLR report 85.8% top-5 accuracy on ImageNet when fine-tuned on only 1% of the labels, outperforming AlexNet with 100 times fewer labels. A pre-trained BERT model can be fine-tuned with just one additional output layer."],
      claims: ["representation-and-transfer-learning-fine-tune", "representation-and-transfer-learning-fine-tune-overfit", "representation-and-transfer-learning-distance", "representation-and-transfer-learning-fewer-labels", "representation-and-transfer-learning-self-supervised"],
    }),
    step({
      id: "backdoor", label: "Backdoor", kind: "watch-out", title: "Downloaded weights can carry a backdoor",
      caption: "A backdoored network performs well on validation samples and misbehaves on inputs the attacker chose. Here a sticker turns damaged into resaleable. Held-out accuracy still reads 93%, and retraining may not remove it.",
      show: ["bad", "rail", "hub-bad", "c-tuned"], counters: ["240", "all, low rate", "unverified download", "93%"],
      rides: [ride("wts", 0.06, 0.78, "weights", { tone: "alert", then: "backdoor" }), ride("r-bad", 0, 1, "sticker photo", { ...dot, tone: "alert", then: "resaleable" })],
      body: ["Gu, Dolan-Gavitt and Garg built a street sign classifier that identifies stop signs as speed limits when a special sticker is added. It has state-of-the-art performance on the user's training and validation samples, and the backdoor can persist even if the network is later retrained for another task.",
        "The file is a second route in. Pickle is the default format for PyTorch model weights, and arbitrary code can be executed when a pickle file is loaded. The PyTorch documentation states that data must never be loaded from an untrusted source.",
        "Ordinary defects travel the same way. The defects of a foundation model are inherited by all the adapted models downstream, and NIST states that use of pre-trained models can cause issues with bias management, scientific validity and reproducibility."],
      claims: ["representation-and-transfer-learning-backdoor", "representation-and-transfer-learning-pickle", "representation-and-transfer-learning-inherit", "representation-and-transfer-learning-bias"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Train from scratch or start from pretrained weights",
      caption: "",
      show: ["tuned", "rail", "hub", "c-tuned", "c-old", "gate"], counters: ["240", "all, low rate", "checked at intake", "93%"],
      rides: [ride("wts", 0.06, 0.78, "weights", { via: [0.22], then: "checked" })],
      body: [{ pair: {
        left: { label: "From scratch", items: ["Needs many labelled examples", "No inherited weights"] },
        right: { label: "Pretrained", items: ["Needs far fewer labels", "Inherits bias, licence and defects"] },
      } },
        "Transfer learning is usually done for tasks where the dataset has too little data to train a full-scale model from scratch. The price is that the defects of the starting model are inherited by the models adapted from it.",
        "A model card on the Hugging Face Hub states the licence and the datasets used for training, and should describe intended uses and limitations, including biases. A base_model field records that a model is a fine-tune of another.",
        "Hugging Face suggests loading models from users and organisations you trust and relying on signed commits, which guarantee the origin of a file but not that it is safe. Safetensors stores tensors safely, as opposed to pickle.",
        "The NIST AI Risk Management Framework includes policies for risks from third-party entities, including infringement of intellectual property, and monitoring of pre-trained models used for development."],
      claims: ["representation-and-transfer-learning-scratch", "representation-and-transfer-learning-inherit", "representation-and-transfer-learning-model-card", "representation-and-transfer-learning-pickle", "representation-and-transfer-learning-third-party", "representation-and-transfer-learning-fewer-labels"],
    }),
  ],
  governance: {
    text: "Pretrained weights are a supply chain: the adapted model inherits the defects of the model it starts from, and a backdoor can pass validation and persist through retraining. Check each download's licence, stated training data, origin and file format before training, and keep the pretrained model under monitoring.",
    claims: ["representation-and-transfer-learning-inherit", "representation-and-transfer-learning-backdoor", "representation-and-transfer-learning-bias", "representation-and-transfer-learning-model-card", "representation-and-transfer-learning-pickle", "representation-and-transfer-learning-third-party"],
  },
  closing: {
    pitfalls: [
      "Fine-tuning every layer at a normal learning rate before the new last layer has converged.",
      "Reading a clean validation score as proof that downloaded weights hold no backdoor.",
      "Loading a pickle file of weights from a source nobody checked, or using weights whose licence nobody read.",
    ],
    questions: [
      "Which layers of a pretrained network are general, and which are specific to its original task?",
      "What trains when the pretrained layers are frozen?",
      "Why does a backdoor in pretrained weights survive a validation check?",
    ],
  },
});
