import { CANVAS, defineGuide, drum, isoGrid, line, list, pill, prism, raise, ride, slab, step, table } from "@signal-path/engine";

// The floor: four arms meet where the agent's code runs. The refund assistant is back left, the host's files
// back right, the secrets front left and the internet front right. From the second stop the code stands on a
// raised plate, the sandbox, and each arm is closed or reopened by policy. A proxy later sits on the internet arm.
const G = isoGrid(440, 290, 30);
const Z = 10;
type Item = Parameters<typeof list>[4][number];
const bad = (t: string): Item => ({ t, hot: true, tone: "alert" });
const hot = (t: string): Item => ({ t, hot: true });
const policy = (id: string, title: string, items: Item[]) => raise(list(id, 0, 0, 226, items, { title, mono: true, rowH: 20, group: id }), G.p(-5.4, -5.4), 14);

export default defineGuide({
  id: "execution-environments", track: "ai", module: "Agents", slug: "execution-environments",
  title: "Execution environments",
  summary: "An agent that runs code or operates a computer acts with whatever access its environment has. A sandbox sets that access: which files, which network destinations and which secrets.",
  forLeads: "Where agent-written code runs is a security decision. Require an isolated environment, an explicit file and network policy, and credentials that never enter it.",
  status: "draft", minutes: 8,
  counters: ["Files in reach", "Network", "Secrets in reach", "Boundary"],
  whatIf: { label: "What if the code ran on the host?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "The script, files, hosts and policy values are illustrative",
    label: "A refund assistant sends a script to the place where code runs. Three arms leave that place: to the host's files, to its secrets and to the internet. At first the code runs on the host and all three are open, so a key travels out to the internet. Then the code stands on a raised plate, the sandbox, and all three arms are closed. A table lists three boundaries: container, gVisor and microVM. Policy then reopens one working directory and an outbound route through a proxy that checks an allowlist and holds the credential. Finally a browser runs in the sandbox, a web page carries a hidden instruction, and the request it triggers is denied at the proxy.",
    els: [
      prism("agent", -10.6, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Refund assistant", sub: "writes the script", at: "n", always: true }),
      drum("files", 0, -8, 1, 40, { hue: "sky", glyph: "stack", title: "Host files", sub: "orders, exports", at: "e", always: true }),
      prism("secrets", -0.6, 7.4, 1.2, 1.2, 24, { hue: "sand", glyph: "key", title: "Secrets", sub: "keys, tokens", at: "w", always: true }),
      prism("net", 11.4, -0.6, 1.2, 1.2, 28, { hue: "paper", glyph: "globe", title: "Internet", sub: "any host", at: "e", group: "web" }),
      prism("net-bad", 11.4, -0.6, 1.2, 1.2, 28, { hue: "rose", glyph: "globe", title: "Web page", sub: "hidden text", at: "e", state: "alert", group: "web-bad" }),

      // Stop 1: the code runs on the host, with every arm open.
      prism("run-h", -0.7, -0.7, 1.4, 1.4, 32, { hue: "sand", glyph: "code", title: "Code runs", sub: "on the host", at: "n", group: "host" }),
      line("call-h", [G.p(-9.4, 0), G.p(-0.7, 0)], { group: "host" }),
      line("fs-h", [G.p(0, -7), G.p(0, -0.7)], { group: "host" }),
      line("sec-h", [G.p(0, 0.7), G.p(0, 7.4)], { tone: "alert", group: "host" }),
      line("net-h", [G.p(0.7, 0), G.p(11.4, 0)], { tone: "alert", group: "host" }),
      policy("reach", "This code can reach", [bad("files: whole host"), bad("network: any host"), bad("secrets: all")]),

      // Stop 2 on: the code stands on the sandbox plate.
      slab("box", -2.2, -2.2, 4.4, 4.4, undefined, { group: "box" }),
      pill("box-name", [G.p(2.2, 2.2)[0] - 30, G.p(2.2, 2.2)[1] + 20], "Sandbox", { tone: "track", glyph: "shield", group: "box" }),
      line("call", [G.p(-9.4, 0), G.p(-2.2, 0), G.p(-2.2, 0, Z), G.p(-0.7, 0, Z)], { group: "box" }),
      prism("run", -0.7, -0.7, 1.4, 1.4, 32, { hue: "track", glyph: "code", title: "Code runs", sub: "in the sandbox", at: "n", z: Z, group: "code" }),
      prism("browser", -0.7, -0.7, 1.4, 1.4, 32, { hue: "track", glyph: "pointer", title: "Browser", sub: "computer use", at: "n", z: Z, group: "browse" }),
      line("fs-x", [G.p(0, -7), G.p(0, -2.2)], { state: "closed", group: "sealed" }),
      line("sec-x", [G.p(0, 2.2), G.p(0, 7.4)], { state: "closed", group: "no-secret" }),
      line("net-x", [G.p(2.2, 0), G.p(11.4, 0)], { state: "closed", group: "sealed" }),
      policy("none", "Sandbox policy", ["files: none", "network: none", "secrets: none"]),

      // Stop 3: how strong the boundary is.
      raise(table("kinds", 0, 0, 226, ["boundary", "enforced by"], [["container", "namespaces"], ["gVisor", "app kernel"], { cells: ["microVM", "KVM"], hot: true }], { at: [12, 108], rowH: 24, mono: true, group: "kinds" }), G.p(-3.9, 6.4), 22),

      // Stop 4 on: policy reopens one directory and one route, through a proxy that holds the credential.
      line("fs", [G.p(0, -7), G.p(0, -2.2), G.p(0, -2.2, Z), G.p(0, -0.7, Z)], { group: "policy" }),
      line("net-a", [G.p(0.7, 0, Z), G.p(2.2, 0, Z), G.p(2.2, 0), G.p(5, 0)], { group: "policy" }),
      prism("proxy", 5, -0.6, 1.2, 1.2, 26, { hue: "mint", glyph: "funnel", title: "Egress proxy", at: "e", group: "policy" }),
      line("net-b", [G.p(6.2, 0), G.p(11.4, 0)], { group: "policy" }),
      line("sec-p", [G.p(0.6, 8), G.p(5.6, 8), G.p(5.6, 0.6)], { group: "policy" }),
      policy("rules", "Sandbox policy", [hot("files: /work only"), hot("network: allowlist"), hot("secrets: at proxy")]),
      policy("rules-2", "Sandbox policy", ["files: /work only", "network: allowlist", "secrets: at proxy", hot("actions: person")]),
    ],
  },
  steps: [
    step({
      id: "host", label: "On the host", kind: "problem", title: "Agent-written code runs with the host's access",
      caption: "The refund assistant writes a script to find duplicate refunds. Run on the Support host, it can read every file and secret there and send them anywhere.",
      show: ["web", "host", "reach"], counters: ["whole host", "open", "all", "none"],
      rides: [ride("call-h", 0, 0.55, "run script"), ride("sec-h", 1, 0.45, "API key", { tone: "alert" }), ride("net-h", 0, 0.6, "API key", { tone: "alert" })],
      body: ["The agent loop is unchanged: the model proposes a tool call and the host carries it out. Here the tool runs code the model wrote, so the code acts with whatever the machine it runs on can reach.",
        "OWASP calls the result Excessive Agency: damaging actions performed in response to unexpected, ambiguous or manipulated model output. Its root causes are excessive functionality, excessive permissions and excessive autonomy.",
        "Anthropic gives the concrete case: without network isolation a compromised agent could exfiltrate sensitive files such as SSH keys."],
      claims: ["execution-environments-excessive-agency", "execution-environments-both-layers"],
    }),
    step({
      id: "sandbox", label: "Sandbox", kind: "idea", title: "A sandbox limits what the code can touch",
      caption: "The script runs inside a boundary enforced from outside it. Anthropic's code execution tool runs it in a container with no internet access, new for each request.",
      show: ["web", "box", "code", "sealed", "no-secret", "none"], counters: ["none", "none", "none", "sandbox"],
      rides: [ride("call", 0, 0.6, "run script")],
      body: ["A code execution sandbox is a tool like any other in the loop. Anthropic's code execution tool lets the model run Bash commands and manipulate files in a sandboxed container. The container has no internet access, so only pre-installed libraries are available, and each request starts a new container unless an earlier container ID is passed back.",
        "A sandbox can also wrap commands on a developer's own machine. Claude Code's Bash sandbox is a boundary the operating system enforces, using Seatbelt on macOS and bubblewrap on Linux. Commands start inside it, and so do the processes they start.",
        { callout: { label: "Key idea", text: "The limit is enforced around the code, not requested of the model." } }],
      claims: ["execution-environments-code-tool", "execution-environments-os-boundary"],
    }),
    step({
      id: "kinds", label: "Boundary", kind: "mechanism", title: "The boundary differs in strength",
      caption: "A container isolates processes with kernel namespaces and still talks to the host kernel. gVisor intercepts system calls in a user-space kernel. Firecracker uses KVM to create microVMs.",
      show: ["web", "box", "code", "sealed", "no-secret", "none", "kinds"], counters: ["none", "none", "none", "container to microVM"],
      body: ["Docker describes namespaces as the first form of isolation: processes in one container cannot see or affect processes in another. Control groups give each container its share of memory, CPU and disk I/O.",
        "gVisor's documentation states the limit of these primitives: enforcement is still done by the single Linux kernel the application can talk to, so the workload is one system call away from host compromise. A virtual machine is a strong boundary at a steep cost in overhead.",
        "gVisor sits between the two. It is an application kernel that runs in userspace, intercepts application system calls and acts as the guest kernel. Firecracker takes the virtual machine route with less weight: microVMs created through KVM, with the speed and resource efficiency of containers, and a jailer as a second line of defence."],
      claims: ["execution-environments-namespaces", "execution-environments-host-kernel", "execution-environments-gvisor", "execution-environments-firecracker"],
    }),
    step({
      id: "policy", label: "Policy", kind: "mechanism", title: "File and network policy reopen only what the task needs",
      caption: "One working directory is writable. Outbound requests pass a proxy that checks each hostname against an allowlist. The proxy adds the credential, so the script never holds it.",
      show: ["web", "box", "code", "policy", "rules", "kinds"], counters: ["/work only", "allowlist", "none", "microVM"],
      rides: [ride("fs", 0, 0.5, "returns.csv"), ride("net-a", 0, 0.55, "API call"), ride("sec-p", 0, 0.85, "token"), ride("net-b", 0, 0.6, "+ token")],
      body: ["File policy: Claude Code's sandboxed Bash tool writes only to the working directory and its subdirectories by default. Its default read access still covers most of the machine, including credential files such as ~/.ssh, until those are protected by configuration.",
        "Network egress control: a sandboxed command has no direct route to the network. A proxy outside the sandbox checks the hostname of each connection against allowed and denied domains.",
        "Secrets handling: a masked credential appears inside the sandbox as a per-session placeholder, and the proxy substitutes the real value on requests to allowed hosts. In Claude Code on the web, git credentials and signing keys are never inside the sandbox.",
        { callout: { label: "Key idea", text: "Anthropic states that both layers are required. Without network isolation files can be exfiltrated. Without filesystem isolation the code can escape the sandbox and gain network access." } }],
      claims: ["execution-environments-file-policy", "execution-environments-egress-proxy", "execution-environments-credentials", "execution-environments-both-layers"],
    }),
    step({
      id: "browser", label: "Browser", kind: "watch-out", title: "A browser brings untrusted pages inside",
      caption: "Computer use works from screenshots, with mouse and keyboard control. Instructions on a web page can override the user's. The sandbox and the allowlist bound what a hijacked session reaches.",
      show: ["web-bad", "box", "browse", "policy", "rules-2", "kinds"], counters: ["/work only", "allowlist, 1 denied", "none", "microVM"],
      rides: [ride("net-b", 1, 0.6, "send keys", { tone: "alert" }), ride("net-a", 0, 0.55, "evil.example", { tone: "alert", then: "denied" })],
      body: ["Anthropic's computer use tool gives the model screenshots and mouse and keyboard control. OpenAI's version runs as a loop: send a task, execute the returned actions, return a screenshot. Both operate a browser or a desktop.",
        "Anthropic states that instructions on webpages or in images might override the developer's instructions. OpenAI's guide says to treat screen content as untrusted.",
        "The vendors' precautions describe an execution environment: a dedicated virtual machine or container with minimal privileges, no sensitive data such as account logins, internet access limited to an allowlist of domains, and a person confirming decisions with real-world consequences.",
        { callout: { label: "What changed", text: "The hidden instruction still arrived. The request it caused stopped at the proxy, and no credential was inside to send." } }],
      claims: ["execution-environments-computer-use", "execution-environments-page-injection", "execution-environments-precautions"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Controls for an execution environment",
      caption: "",
      show: ["web", "box", "code", "policy", "rules-2", "kinds"], counters: ["/work only", "allowlist", "none", "microVM"],
      rides: [ride("call", 0.8, 0.55, "3 duplicates")],
      body: [{ pair: {
        left: { label: "Require", items: ["A dedicated VM or container", "An allowlist of domains", "A person confirming consequential actions"] },
        right: { label: "Refuse", items: ["Credentials inside the sandbox", "Network without file isolation", "Trusting what a page says"] },
      } },
        "OWASP's mitigations for Excessive Agency point the same way: limit permissions to the minimum necessary and require a human to approve high-impact actions."],
      claims: ["execution-environments-precautions", "execution-environments-both-layers", "execution-environments-credentials", "execution-environments-excessive-agency", "execution-environments-page-injection"],
    }),
  ],
  governance: { text: "The execution environment is the security boundary for agent actions. Filesystem and network isolation are both required, credentials stay outside the sandbox, and a person approves high-impact actions.", claims: ["execution-environments-both-layers", "execution-environments-credentials", "execution-environments-excessive-agency"] },
  closing: {
    pitfalls: [
      "Running agent-written code on a machine that holds keys and production data.",
      "Limiting file access while leaving outbound network open, or the reverse.",
      "Passing credentials into the sandbox as environment variables.",
    ],
    questions: [
      "What can the script reach on the host, and what inside the sandbox?",
      "Why does the proxy hold the credential instead of the script?",
      "What does the sandbox still limit when a web page hijacks the browser?",
    ],
  },
});
