import { blocks, CANVAS, defineGuide, drum, isoGrid, line, pill, prism, ride, step, stop, tank } from "@signal-path/engine";
import type { El } from "@signal-path/engine";

// The floor: one diagonal of rail. Support's refund chats come in from the top left and end at the GPU,
// drawn as a glass tank of 24 GB whose contents are the story: the weights, the shared prefix and one cache per request.
// The weights load from the store at the bottom right. The inference server stands on the rail in front of the GPU.
// A second replica stands at the bottom left and a hosted API at the top right, each on its own arm from the server.
const G = isoGrid(455, 262, 30);
const K = "model-serving";
const SRV = -4, IN = 3.4, OUT = 5.6;
type Seg = { label: string; value: number; hot?: boolean; hue?: "violet" | "sky" | "track" };
const gpu = (id: string, segs: Seg[]): El => tank(id, IN, -1.1, 2.2, 2.2, 112, 24, segs, { title: "GPU memory", limit: "24 GB", group: id });
const W16: Seg = { label: "weights 16 GB", value: 16, hue: "violet" };
const W4: Seg = { label: "weights 5 GB", value: 5, hue: "violet" };
const PREFIX: Seg = { label: "shared prefix", value: 1, hue: "sky" };

export default defineGuide({
  id: K, track: "ai", module: "Production", slug: K,
  title: "Model serving",
  summary: "A model answers from an accelerator whose memory holds the weights and a cache for every request in flight. Batching, prefix caching and quantisation decide how many requests that memory serves at once.",
  forLeads: "Throughput, latency and cost per request are set by how the accelerator's memory is used, not only by which model is chosen. Where the model runs fixes residency and isolation, and a tested fallback protects availability.",
  status: "draft", minutes: 7,
  counters: ["Requests in flight", "Weights in memory", "Shared prefix", "Deployment"],
  whatIf: { label: "What if requests ran one at a time?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "GPU size, request counts and cache sizes are illustrative.",
    label: "Support's refund chats travel down a rail to a GPU drawn as a glass tank of 24 GB. The weights of an 8B model fill 16 GB of it, one request runs and six wait in a red queue. An inference server then appears on the rail and six requests share the tank, each with its own cache. A shared prefix is then stored once. Quantised weights arrive from the weight store and shrink to 5 GB, leaving room for twelve requests. An autoscaler adds a second replica on a side arm. At the last stop the GPU is marked with its region and private network, and a hosted API stands on another arm as the fallback.",
    els: [
      line("main", [G.p(-12, 0), G.p(IN, 0)], { always: true }),
      stop("s-start", ...G.p(-10, 0), undefined, undefined, { always: true }),
      stop("s-server", ...G.p(-6, 0), undefined, undefined, { always: true }),
      stop("s-in", ...G.p(-0.6, 0), undefined, undefined, { always: true }),
      prism("support", -12.7, -0.7, 1.4, 1.4, 26, { hue: "paper", glyph: "user", title: "Support", sub: "refund assistant", at: "sw", always: true }),

      line("load", [G.p(12, 0), G.p(OUT, 0)], { always: true }),
      stop("s-hub", ...G.p(10.7, 0), undefined, undefined, { always: true }),
      stop("s-load", ...G.p(8.7, 0), undefined, undefined, { always: true }),
      drum("weights", 12, 0, 0.9, 26, { hue: "violet", glyph: "net", title: "Open weights", sub: "8B parameters", at: "s", always: true }),

      // 1. one request at a time
      blocks("queue", -8.6, -1.9, 6, 0.6, [0, 1, 2, 3, 4, 5].map(() => ({ h: 14, state: "alert" as const })), { gap: 0.25, title: "6 chats waiting", at: "n", group: "queue" }),
      gpu("m1", [W16, { label: "1 request", value: 1, hue: "track", hot: true }]),

      // 2. the inference server batches
      prism("server", SRV - 0.7, -0.7, 1.4, 1.4, 28, { hue: "track", glyph: "layers", title: "Inference server", sub: "vLLM", at: "n", group: "server" }),
      gpu("m2", [W16, { label: "6 requests", value: 6, hue: "track", hot: true }]),

      // 3. the shared prefix is cached once
      gpu("m3", [W16, { ...PREFIX, hot: true }, { label: "6 requests", value: 3, hue: "track" }]),
      pill("p-prefix", [792, 250], "Cached once", { glyph: "check", sub: "same instructions", anchor: "start", group: "prefix" }),

      // 4. quantised weights
      gpu("m4", [{ ...W4, hot: true }, PREFIX, { label: "12 requests", value: 6, hue: "track" }]),
      pill("p-bits", [792, 250], "4-bit weights", { glyph: "scale", sub: "accuracy cost", anchor: "start", group: "quant" }),

      // 5 and 6. the settled GPU
      gpu("m5", [W4, PREFIX, { label: "12 requests", value: 6, hue: "track" }]),

      // 5. a second replica
      line("rep", [G.p(-12, 0), G.p(SRV, 0), G.p(SRV, 6)], { group: "scale" }),
      stop("s-rep", ...G.p(SRV, 3.3), undefined, undefined, { group: "scale" }),
      prism("gpu2", SRV - 0.9, 6, 1.8, 1.8, 40, { hue: "track", glyph: "net", title: "Replica 2", sub: "second GPU, same model", at: "s", group: "scale" }),
      pill("p-scale", [300, 340], "Autoscaler", { glyph: "chart", sub: "running requests", anchor: "start", to: G.p(SRV + 0.9, 6, 24), group: "scale" }),

      // 6. region, isolation and the fallback
      line("fb", [G.p(-12, 0), G.p(SRV, 0), G.p(SRV, -7)], { group: "fallback" }),
      stop("s-fb", ...G.p(SRV, -4.4), undefined, undefined, { group: "fallback" }),
      prism("hosted", SRV - 0.8, -8.4, 1.6, 1.6, 30, { hue: "mint", glyph: "globe", title: "Hosted API", sub: "fallback model", at: "e", group: "fallback" }),
      pill("p-region", [792, 120], "EU region", { glyph: "globe", sub: "residency", anchor: "start", group: "gov" }),
      pill("p-private", [792, 166], "Private network", { glyph: "lock", sub: "isolation", anchor: "start", group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "one-at-a-time", label: "One by one", kind: "problem", title: "One request at a time leaves the GPU idle",
      caption: "The weights of an 8B model take 16 GB of a 24 GB GPU. Served one by one, refund chats queue while the rest of the memory sits unused.",
      show: ["m1", "queue"], counters: ["1", "16 GB at 16 bits", "computed per request", "1 GPU"],
      rides: [ride("main", "s-start", "s-in", "refund chat", { then: "one at a time" })],
      body: ["Inference runs on accelerators. vLLM lists NVIDIA GPUs through CUDA, AMD GPUs through ROCm and Intel XPUs among its supported hardware platforms.",
        "Models are usually loaded in bf16, which takes 2 bytes per parameter, so an 8B model needs about 16 GB for its weights. The weights must sit in the accelerator's memory before the first token is generated.",
        "Generation predicts one token at a time, and each prediction depends on all the previous context. A key-value cache stores the key and value pairs of the tokens already processed so they are not recomputed. Its memory grows linearly with the sequence.",
        { callout: { label: "Key idea", text: "High throughput serving requires batching sufficiently many requests at a time. The memory left beside the weights decides how many that is." } }],
      claims: [`${K}-accelerators`, `${K}-quantisation`, `${K}-kv-cache`, `${K}-batch-needed`],
    }),
    step({
      id: "batching", label: "Batching", kind: "idea", title: "An inference server batches requests continuously",
      caption: "vLLM batches incoming requests continuously, and six chats share the GPU. Each request holds its own key-value cache, so memory limits the batch size.",
      show: ["m2", "server"], counters: ["6", "16 GB at 16 bits", "computed per request", "1 GPU, vLLM"],
      rides: [ride("main", "s-start", "s-in", "6 chats", { via: ["s-server"], then: "one batch" })],
      body: ["An inference server sits between the application and the accelerator. vLLM is a library for LLM inference and serving, with continuous batching of incoming requests, an OpenAI-compatible API server and streaming outputs. Text Generation Inference lists continuous batching for increased total throughput, is now in maintenance mode, and its maintainers recommend vLLM and SGLang going forward.",
        "The key-value cache of each request is large and grows and shrinks as it generates. Managed inefficiently, this memory is wasted by fragmentation and duplication, which limits the batch size. vLLM manages it with PagedAttention, and its authors report 2 to 4 times the throughput of FasterTransformer and Orca at the same level of latency.",
        { callout: { label: "Trade-off", text: "Batching trades latency for throughput. In NVIDIA Triton's dynamic batcher, a queue delay holds requests so that more can join a batch, and a longer delay raises latency." } }],
      claims: [`${K}-server`, `${K}-batch-needed`, `${K}-paged`, `${K}-dynamic-batching`],
    }),
    step({
      id: "caching", label: "Caching", kind: "mechanism", title: "A cached prefix is computed once",
      caption: "Every chat opens with the same instructions. Automatic prefix caching reuses their key-value cache, so a new request skips computing the shared part.",
      show: ["m3", "server", "prefix"], counters: ["6", "16 GB at 16 bits", "computed once", "1 GPU, vLLM"],
      rides: [ride("main", "s-start", "s-in", "instructions", { via: ["s-server"], then: "cache hit" })],
      body: ["Automatic prefix caching in vLLM caches the key-value cache of existing queries. A new query that shares the same prefix with one of them reuses that cache directly and skips the computation of the shared part.",
        "vLLM names two workloads that benefit: repeated queries over the same long document, and multi-round conversations in one chat session.",
        "The cache works because, with causal attention, the representation of a processed token never changes with respect to later tokens. Its keys and values can be stored and reused."],
      claims: [`${K}-prefix-cache`, `${K}-kv-cache`],
    }),
    step({
      id: "quantisation", label: "Quantisation", kind: "watch-out", title: "Quantisation stores the weights in fewer bits",
      caption: "At 4 bits the same model needs about 4 to 5 GB, not 16. The freed memory holds more requests. Fewer bits cost some accuracy.",
      show: ["m4", "server", "quant"], counters: ["12", "about 5 GB at 4 bits", "computed once", "1 GPU, vLLM"],
      rides: [ride("load", "s-hub", "s-load", "4-bit weights", { then: "about 5 GB" })],
      body: ["Quantisation stores a model's weights, and sometimes its activations, in fewer bits so the model needs less memory. An 8B model needs about 16 GB in bf16, about 8 GB at 8 bits and about 4 to 5 GB at 4 bits.",
        "Each quantisation method makes a different trade-off between memory, speed and accuracy. vLLM serves weights quantised as INT8, INT4, GPTQ, AWQ and GGUF, among other formats. Transformers quantises a full-precision checkpoint while loading through bitsandbytes.",
        { callout: { label: "Watch out", text: "A quantised model is a different model. Fewer bits cost some accuracy, so it is the quantised weights that go through evaluation." } }],
      claims: [`${K}-quantisation`, `${K}-quant-formats`],
    }),
    step({
      id: "autoscaling", label: "Autoscaling", kind: "mechanism", title: "Autoscaling adds replicas as demand rises",
      caption: "A HorizontalPodAutoscaler follows a metric such as running requests per replica and deploys a second GPU at peak. It scales back down when load falls.",
      show: ["m5", "server", "scale"], counters: ["12 per replica", "about 5 GB at 4 bits", "computed once", "2 replicas"],
      rides: [ride("rep", "s-start", "s-rep", "peak chats", { via: ["s-server"], then: "replica 2" })],
      body: ["In Kubernetes a HorizontalPodAutoscaler updates a workload with the aim of scaling capacity to match demand. The response to increased load is to deploy more Pods. When load decreases and the number of Pods is above the configured minimum, it scales back down.",
        "KServe serves generative models through a Hugging Face runtime that uses the vLLM engine and exposes OpenAI-compatible endpoints. Its autoscaling guide scales on LLM metrics with KEDA, tracking `vllm:num_requests_running` against a target number of concurrent requests per pod, between a minimum and a maximum number of replicas."],
      claims: [`${K}-autoscaling`, `${K}-kserve`],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Choose where the model runs",
      caption: "",
      show: ["m5", "server", "scale", "fallback", "gov"], counters: ["12 per replica", "about 5 GB at 4 bits", "computed once", "EU region, hosted fallback"],
      rides: [ride("fb", "s-server", "s-fb", "refund chat", { then: "fallback" })],
      body: [{ pair: {
        left: { label: "Hosted API", items: ["Provider runs the accelerators", "Region set per request or profile", "Provider isolates the deployment"] },
        right: { label: "Self-hosted open weights", items: ["Team runs server and GPUs", "Region is where it is deployed", "Hosted API as fallback"] },
      } },
        "Residency is set by the deployment. On Amazon Bedrock a geographic cross-Region inference profile keeps processing within a geography such as the US or the EU, and a global profile may route to any supported commercial Region. On the Claude API the `inference_geo` parameter controls where inference runs: `global` is the default, `us` keeps inference in US-based infrastructure, and US-only inference is priced at 1.1 times the standard rate on Claude 4.6 and later models.",
        "Isolation is set by the deployment as well. Amazon Bedrock deploys each provider's model into accounts owned and operated by the Bedrock service team. Model providers have no access to those accounts, so they have no access to customer prompts and completions.",
        { callout: { label: "Fallback", text: "To meet an availability target, AWS advises bounded retries and multi-Region or multi-model fallback in the application. The NIST Generative AI Profile suggests documenting value chain risks to identify fallbacks, and testing and managing rollover and fallback technologies." } }],
      claims: [`${K}-residency`, `${K}-residency-api`, `${K}-isolation`, `${K}-fallback`, `${K}-server`],
    }),
  ],
  governance: { text: "Where inference runs is a deployment decision: the region a request is processed in and who can reach the prompts are fixed by the endpoint, the inference profile or the cluster the model is deployed to. A tested fallback to a second region or model protects availability.", claims: [`${K}-residency`, `${K}-residency-api`, `${K}-isolation`, `${K}-fallback`] },
  closing: {
    pitfalls: [
      "Serving requests one at a time on an accelerator that has memory for a batch.",
      "Deploying quantised weights on the evaluation results of the full-precision model.",
      "Choosing a global endpoint for a workload that has a residency requirement.",
    ],
    questions: [
      "What shares an accelerator's memory with the weights, and why does it limit the batch?",
      "Which three techniques let the same GPU serve more requests?",
      "What decides the region a request is processed in?",
    ],
  },
});
