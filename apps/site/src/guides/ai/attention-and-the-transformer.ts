import { CANVAS, defineGuide, isoGrid, layers, line, note, pill, raise, ride, step } from '@signal-path/engine';

const G = isoGrid(480, 300, 30);
const FLOOR = G.p(8, 8);
const NET = { x: FLOOR[0] - 300, y: FLOOR[1] - 300, w: 600, h: 270 };
const sizes = [4, 4, 4];
const causal = [0, 1].flatMap((layer) =>
  Array.from({ length: 4 }, (_, source) =>
    Array.from({ length: 4 }, (_, target) => source <= target ? [layer, source, layer + 1, target] as [number, number, number, number] : undefined)
      .filter((edge): edge is [number, number, number, number] => edge !== undefined),
  ).flat(),
);
const network = (id: string, group: string, hot: [number, number][]) => raise(layers(id, 0, 0, NET.w, NET.h, sizes, {
  title: 'Decoder-only transformer', sub: 'causal mask · learned weights', labels: ['tokens', 'layer 1', 'layer 2'],
  connections: causal, hot, group,
}), FLOOR, 30);

export default defineGuide({
  id: 'attention-and-the-transformer', track: 'ai', module: 'Foundations', slug: 'attention-and-the-transformer',
  title: 'Attention and the transformer',
  summary: 'Each token gathers information from earlier tokens through attention, layer by layer. Context changes the representation that reaches the output.',
  forLeads: 'Transformer behaviour is not a readable chain of rules. Treat internal explanations cautiously and evaluate the model in the context where it will be used.',
  status: 'draft', minutes: 8,
  counters: ['Tokens in context', 'Attention layers', 'Readable rules', 'Evaluation'],
  whatIf: { label: 'What if a token could read the future?', step: 1, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: 'Order text and token values are illustrative',
    label: 'Four token positions pass through a decoder-only transformer. In each layer a position gathers information from itself and earlier positions, while future positions are masked. The highlighted state changes as attention repeats through the stack.',
    els: [
      line('flow', [[260, 200], [700, 200]], { always: true }),
      pill('phrase', [480, 115], 'Order 4471 refund pending', { always: true }),
      pill('mask', [840, 190], 'causal mask', { group: 'masked', tone: 'muted' }),
      network('first', 'first', [[2, 3], [1, 0], [1, 1], [1, 2], [1, 3]]),
      network('second', 'second', [[2, 3], [1, 1], [1, 2], [1, 3]]),
      network('third', 'third', [[2, 3], [1, 2], [1, 3]]),
    ],
  },
  steps: [
    step({
      id: 'sequence', label: 'Sequence', kind: 'problem', title: 'A token has no context by itself',
      caption: 'The support assistant receives “Order 4471 refund pending”. The token “pending” needs the earlier order and refund tokens to carry the right meaning.',
      show: ['first', 'masked'], counters: ['4', '2', 'none', 'not yet'],
      rides: [ride('flow', 0, 0.8, 'Order 4471')],
      body: ['At Vinterhus, the support assistant reads a short case note about order 4471. The word pending only becomes useful in relation to what came before it.'],
      claims: ['attention-and-the-transformer-self-attention'],
    }),
    step({
      id: 'mask', label: 'Mask', kind: 'idea', title: 'A decoder reads only the prefix',
      caption: 'A decoder-only transformer masks later positions. “Pending” can use the order and refund context; earlier positions cannot use a word that has not arrived yet.',
      show: ['first', 'masked'], counters: ['4', '2', 'none', 'not yet'],
      rides: [ride('flow', 0.2, 0.9, 'refund')],
      body: ['The Transformer decoder masks self-attention so that no position attends to subsequent positions. GPT-2 is a causal transformer language model, pretrained to predict the next word from all the previous words.'],
      claims: ['attention-and-the-transformer-causal-mask'],
    }),
    step({
      id: 'gather', label: 'Gather', kind: 'mechanism', title: 'Attention mixes information across positions',
      caption: 'For each position, attention scores the available positions, turns the scores into weights, then combines their value vectors into a new representation.',
      show: ['first'], counters: ['4', '2', 'none', 'not yet'],
      rides: [ride('flow', 0.35, 0.92, 'pending')],
      body: ['Self-attention relates positions in one sequence. Query and key dot products are scaled and normalised into weights on the value vectors. Multi-head attention lets the model attend to different representation subspaces at different positions.'],
      claims: ['attention-and-the-transformer-attention-weights'],
    }),
    step({
      id: 'stack', label: 'Stack', kind: 'mechanism', title: 'Each layer builds on contextual states',
      caption: 'The first layer mixes the token states. The next layer attends to those updated states, so “pending” can carry a richer representation of the whole prefix.',
      show: ['second'], counters: ['4', '2', 'none', 'not yet'],
      rides: [ride('flow', 0.4, 0.96, 'updated state')],
      body: ['A transformer stacks attention and feed-forward sublayers with learned parameters. Repeating the operation lets later layers combine information already gathered by earlier layers.'],
      claims: ['attention-and-the-transformer-transformer-layers'],
    }),
    step({
      id: 'window', label: 'Window', kind: 'watch-out', title: 'The available context is finite',
      caption: 'Attention can only use tokens present in the model call. A long conversation competes for context space, and an omitted detail cannot shape the current representation.',
      show: ['third'], counters: ['4 of finite window', '2', 'none', 'not yet'],
      rides: [ride('flow', 0.46, 0.98, 'contextual state')],
      body: ['GPT-3 models use a context window of 2048 tokens, and few-shot examples are limited to as many as fit in it. Text that does not fit in the window is not part of the input that attention reads.'],
      claims: ['attention-and-the-transformer-context-limit'],
    }),
    step({
      id: 'decision', label: 'Evaluate', kind: 'decision', title: 'Evaluate the behaviour you rely on', caption: '',
      show: ['third'], counters: ['4 of finite window', '2', 'none', 'required'],
      rides: [ride('flow', 0.52, 1, 'evaluate in context')],
      body: [{ pair: {
        left: { label: 'Check', items: ['Representative prompts and contexts', 'Errors across repeated cases', 'Changes after model updates'] },
        right: { label: 'Avoid assuming', items: ['Attention weights explain a decision', 'Text outside the window is read', 'A passing sample proves reliability'] },
      } }],
      claims: ['attention-and-the-transformer-evaluation', 'attention-and-the-transformer-explanation'],
    }),
  ],
  governance: { text: 'Attention weights are not a dependable explanation of a model’s decision. Test the system in conditions similar to deployment, before release and regularly in operation, and document results with uncertainty measures and limitations.', claims: ['attention-and-the-transformer-explanation', 'attention-and-the-transformer-evaluation'] },
  closing: {
    pitfalls: [
      'Treating attention weights as a complete explanation of why the model answered.',
      'Assuming text that did not fit in the context window still shapes the answer.',
      'Testing only an average case instead of the risks of the support workflow.',
    ],
    questions: [
      'What information can a token attend to in a decoder-only model?',
      'How does a later layer use the output of an earlier layer?',
      'Why should model behaviour be evaluated in its deployment context?',
    ],
  },
});
