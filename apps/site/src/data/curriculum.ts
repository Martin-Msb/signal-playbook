import type { Guide, TrackKey } from "@signal-path/engine";

/**
 * The approved curriculum: every concept, in teaching order, with what it builds on.
 * A guide's slug is its concept's key. Concepts without a guide show as planned.
 * Row: title, what the reader understands, builds on (titles, ";" separated), current practice,
 * governance and security, see also (titles in other tracks).
 */
type Row = [title: string, understands: string, buildsOn: string, practice: string, governance: string, seeAlso?: string];
interface StageDef { name: string; rows: Row[] }
interface TrackDef { key: TrackKey; name: string; scope: string; stages: StageDef[] }

const DATA: StageDef[] = [
  { name: "Data and databases", rows: [
    ["Data, records and schema", "A dataset is records made of typed fields, and a schema is the agreement about their shape.", "", "Records, fields and types. Schema on write and schema on read.", "Sensitivity is a property of a field: personal and regulated data is labelled where it is defined."],
    ["Structured, semi-structured and unstructured data", "Data differs in how much of its shape is fixed in advance: a table fixes it, JSON carries it inside each record, and text, images and audio have none until something extracts it.", "Data, records and schema", "Relational tables. JSON, XML and logs. Documents, images, audio and video. Variant columns for semi-structured data, text extraction and embeddings for unstructured data.", "Unstructured data is where personal data sits unlabelled, in emails, documents and recordings, so classification has to scan content."],
    ["File formats and encoding", "The same records can be written as text or binary, row by row or column by column, with the schema inside the file or held elsewhere, and that choice sets size, speed and how safely the shape can change.", "Structured, semi-structured and unstructured data", "CSV and JSON as text. Avro and Protobuf as row-based binary. Parquet and ORC as columnar files. Arrow in memory. Compression codecs.", "A file with no schema is an unvalidated input. Embedded schemas and checksums make files verifiable."],
    ["The relational model and SQL", "Tables, keys and joins express a question declaratively, and the engine decides how to run it.", "Data, records and schema", "SQL as the common language of databases, warehouses and lakehouse engines.", "Keys and constraints are the first quality controls. Queries are what access rules and audit logs attach to."],
    ["Non-relational data models", "Key-value, document, wide-column and graph stores each fit an access pattern that tables serve poorly.", "The relational model and SQL; Structured, semi-structured and unstructured data", "Document and key-value stores, graph databases, semi-structured columns in analytical tables.", "Flexible schemas move validation from the database to the application and its contracts."],
    ["Transactions and consistency", "A transaction groups changes so readers see all of them or none, and isolation levels define what concurrent work can observe.", "The relational model and SQL", "ACID, multi-version concurrency control, snapshot isolation.", "Atomic commits make a system of record auditable."],
    ["Indexes and storage engines", "An index trades write cost and space for fast lookups, and the storage engine decides how rows reach disk.", "Transactions and consistency", "B-trees, log-structured merge trees, hash indexes, write-ahead logs.", "Durability rests on the write-ahead log, the record that recovery and audit rely on."],
    ["Data governance", "Every dataset has an owner, a classification and rules for its use, and governance is the system that assigns and enforces them.", "Data, records and schema", "Data owners and stewards, classification schemes, policies expressed as code, the DAMA-DMBOK knowledge areas.", "This concept is governance. It defines the roles and labels every later concept uses."],
  ] },
  { name: "Analytical systems", rows: [
    ["Operational and analytical workloads", "Serving one order fast and scanning a billion orders are different jobs, which is why operational databases and analytical platforms are separate systems.", "Indexes and storage engines", "OLTP databases for point lookups and writes. Analytical engines for scans and aggregates.", "Analytics runs on copies, and every copy inherits the source's access, retention and erasure duties."],
    ["Columnar storage", "Storing values column by column, encoded and compressed with statistics, lets a query read only the columns and row groups it needs.", "File formats and encoding; Operational and analytical workloads", "Apache Parquet and ORC on disk, Apache Arrow in memory.", "Encryption at rest applies to the file. Sensitive columns can be encrypted or masked separately."],
    ["Replication and sharding", "Copies on several machines survive failure, splitting data across machines adds capacity, and both force a choice about how consistent readers must be.", "Transactions and consistency", "Leader and follower replication, quorum writes, consistent hashing, consistency models.", "Replication is a recovery control. Where the copies sit decides data residency."],
    ["Separating storage from compute", "Durable object storage holds the data and stateless compute attaches on demand, so each scales and is paid for on its own.", "Columnar storage; Replication and sharding", "S3-compatible object storage, elastic clusters, serverless engines.", "One storage layer gives one place to encrypt, log access and enforce retention."],
    ["Query execution", "An engine turns SQL into a plan of scans, joins and aggregations, run in parallel across cores or machines, and most performance problems are visible in that plan.", "The relational model and SQL; Columnar storage", "Cost-based optimisers, vectorised execution, distributed engines (Spark, Trino), single-node engines (DuckDB, Polars).", "Workload isolation and quotas keep one team's query from starving another's."],
    ["Batch, streaming and request processing", "Data is processed on a schedule, continuously or on demand, and each mode trades freshness against cost and complexity.", "Operational and analytical workloads", "Scheduled batch, micro-batch, streaming, request and response serving.", "Freshness and correctness targets are stated as service levels that later stages are measured against."],
  ] },
  { name: "Modelling", rows: [
    ["Data modelling", "Entities, relationships and keys turn a business into tables, and normalisation removes the redundancy that causes contradictions.", "The relational model and SQL", "Conceptual, logical and physical models. Third normal form.", "Definitions and ownership are assigned in the model: glossary terms and data owners."],
    ["Dimensional modelling", "Analytical models separate measured events from their context at a declared grain, so questions aggregate correctly.", "Data modelling; Operational and analytical workloads", "Star schemas with facts and dimensions, wide tables, Data Vault for integration layers.", "Conformed dimensions keep one definition of customer or product across reports."],
    ["Time and history", "A record has the time it happened and the time it was recorded, and keeping history means choosing between overwriting, versioning and snapshots.", "Data modelling", "Event time and processing time, slowly changing dimensions, snapshots, bitemporal tables.", "History is the audit trail. Retention rules limit how long it is kept."],
    ["Master and reference data", "The same customer or product appears in many systems, and matching and merging rules produce one trusted record.", "Data modelling; Data governance", "Entity resolution, golden records, survivorship rules, reference data management.", "Named stewards own the matching rules. Linking records about a person raises privacy impact."],
  ] },
  { name: "Ingestion", rows: [
    ["Ingestion", "Data leaves source systems by full or incremental extraction, and whether it is transformed before or after loading decides what the platform can redo later.", "Operational and analytical workloads; Batch, streaming and request processing", "ELT as the default: load raw, transform in the platform. ETL where data must be masked before landing. Managed connectors, API and file ingestion, query federation.", "Source agreements, credential handling, and the decision on what is masked before landing."],
    ["Change data capture", "Reading a database's change log captures every insert, update and delete in order, without querying the tables.", "Indexes and storage engines; Ingestion", "Log-based capture with Debezium, the outbox pattern, snapshot plus stream.", "Deletes propagate, which is how erasure requests reach downstream copies."],
    ["Event logs and streams", "An append-only log, split into ordered partitions, lets many consumers read the same events at their own pace and replay them.", "Replication and sharding; Batch, streaming and request processing", "Apache Kafka and Kafka-compatible services, Apache Pulsar, logs backed by object storage.", "Topic-level access control, retention periods, encryption in transit."],
    ["Delivery guarantees", "Networks fail, so messages arrive at least once, at most once or effectively once, and idempotent writes make retries safe.", "Event logs and streams; Transactions and consistency", "Idempotency keys, deduplication, transactional writes, exactly-once processing in Kafka and Flink.", "Duplicates and gaps are measurable defects, found by reconciliation against the source."],
    ["Schema evolution and data contracts", "Schemas change, and compatibility rules and explicit contracts keep producers from breaking consumers.", "File formats and encoding; Ingestion", "Schema registries, Avro and Protobuf compatibility modes, the Open Data Contract Standard.", "A contract names an owner, a quality level and permitted use."],
    ["Sensitive data handling", "Personal and regulated data is identified on arrival and minimised, masked or tokenised, with retention and erasure built into the pipeline.", "Data governance; Ingestion", "Classification tags, pseudonymisation, tokenisation, masking, retention schedules, erasure workflows.", "This concept is governance: purpose limitation, minimisation, erasure and residency under GDPR-style law."],
  ] },
  { name: "Storage", rows: [
    ["Warehouses, lakes and lakehouses", "A warehouse manages storage and compute as one product, a lake is open files on object storage, and a lakehouse adds warehouse-style tables to those files.", "Columnar storage; Separating storage from compute", "Cloud data warehouses, data lakes, lakehouse engines.", "Open formats reduce lock-in. One governed copy replaces many ungoverned ones."],
    ["Open table formats", "A table format turns a set of files into a table with snapshots and atomic commits, so many engines can read and write it safely.", "Transactions and consistency; Warehouses, lakes and lakehouses", "Apache Iceberg, Delta Lake, Apache Hudi.", "Snapshots give time travel for audit and rollback."],
    ["Row-level changes and table maintenance", "Files are immutable, so updates and deletes are written as new files or delete markers and cleaned up later.", "Open table formats", "Copy-on-write, merge-on-read, deletion vectors, compaction, snapshot expiry.", "Erasure is complete only when old files and snapshots have expired."],
    ["Partitioning, clustering and pruning", "Organising a table by the columns queries filter on lets the engine skip most of the data.", "Query execution; Open table formats", "Partition transforms, clustering, file and column statistics.", "Scan size is spend. Partitions by tenant or region also support isolation and residency."],
    ["Catalogs and metadata", "A catalog does two jobs: engines use it to find tables and coordinate commits, and people use it to find, understand and trust data.", "Open table formats; Data governance", "The Iceberg REST catalog protocol, Apache Polaris, Unity Catalog. Business glossaries and data discovery tools.", "The catalog is the control point for ownership, classification tags and discovery."],
    ["Access control and data protection", "Who can read which rows and columns is decided by policy at the platform, backed by encryption and key management.", "Catalogs and metadata; Sensitive data handling", "Role-based and attribute-based access control, row filters, column masks, credential vending, key management, audit logs.", "This concept is security: least privilege, separation of duties, audit."],
  ] },
  { name: "Transformation", rows: [
    ["Transformation", "Transformation turns raw records into cleaned, joined and aggregated tables, written as version-controlled code with declared dependencies.", "The relational model and SQL; Ingestion", "SQL models in dbt and SQLMesh, dataframe code in Spark and Python, dependency graphs, separate environments, CI.", "Code review and CI are the change control for data logic."],
    ["Data layers", "Data moves through raw, cleaned and modelled layers, each with a contract about quality and audience.", "Transformation; Dimensional modelling", "Medallion layers (bronze, silver, gold). Staging, intermediate and mart models.", "Access narrows by layer: raw data is restricted, the serving layer is curated."],
    ["Incremental processing and materialisation", "Recomputing everything is simple and costly. Incremental logic processes only what changed, provided it stays idempotent.", "Transformation; Time and history", "Incremental models, materialised views and dynamic tables, partition overwrite, backfills.", "The ability to reprocess a period is the recovery control when logic or data was wrong."],
    ["Stream processing", "Continuous computation keeps state, groups events into windows and uses watermarks to decide when late data is final.", "Event logs and streams; Delivery guarantees; Time and history", "Apache Flink, Kafka Streams, Spark Structured Streaming, streaming SQL.", "The lateness policy is a correctness decision and must be stated."],
    ["Orchestration", "An orchestrator runs tasks in dependency order, retries failures and can replay a past period.", "Transformation; Batch, streaming and request processing", "Airflow, Dagster, Prefect. Asset-based orchestration.", "Run history is evidence of what ran, when, and on which inputs."],
    ["Data quality", "Quality is a set of testable expectations on accuracy, completeness, consistency, validity, uniqueness and timeliness, checked where data enters and where it is published.", "Transformation; Schema evolution and data contracts", "Tests in dbt, Great Expectations and Soda, contract enforcement, quarantine of failing data.", "This concept is governance: rules have named owners, and failing data is blocked or flagged."],
    ["Lineage", "Lineage records which inputs and code produced each table and column, which answers where a number came from and what a change will break.", "Transformation; Orchestration; Catalogs and metadata", "OpenLineage, column-level lineage from SQL parsing.", "This concept is governance: impact analysis, audit, and tracing where personal data flows."],
  ] },
  { name: "Serving", rows: [
    ["Analytics and the semantic layer", "People consume data through dashboards, ad hoc queries and notebooks, and a metric defined once in a semantic layer makes all of them agree.", "Dimensional modelling; Data layers", "BI tools, self-service analytics, semantic layers (dbt Semantic Layer, Cube), the Apache Ossie interchange format (incubating).", "Certified metrics. Row-level access carries through to the BI tool."],
    ["Serving data to applications", "Applications need answers in milliseconds, so curated data is pushed to stores built for lookups or queried through engines built for fast aggregates.", "Query execution; Data layers", "Reverse ETL, real-time OLAP engines (ClickHouse, Apache Pinot), caches and APIs.", "Data leaves the governed platform, so access rules and retention must follow it."],
    ["Data products and sharing", "A dataset offered to others is a product with an owner, an interface and a service level, shared without copying where possible.", "Schema evolution and data contracts; Access control and data protection", "Data products with contracts, Delta Sharing, sharing through Iceberg REST catalogs, APIs.", "Sharing agreements, usage terms, periodic access reviews."],
    ["Serving data to ML and AI", "Models need features that match between training and serving, and AI systems need documents and embeddings kept as fresh and governed as any table.", "Data layers; Incremental processing and materialisation", "Feature tables, point-in-time joins, embedding pipelines, vector indexes inside the platform.", "Access rules and deletions follow the data into features and embeddings.", "Features in production; Preparing knowledge"],
  ] },
  { name: "Operation", rows: [
    ["Observability and incident response", "Freshness, volume, schema and distribution are monitored like service health, and data incidents are detected, triaged and reviewed.", "Data quality; Lineage; Orchestration", "Data observability tooling, service levels for data, anomaly detection, post-incident reviews.", "This concept is control: service levels to consumers, and incident records as compliance evidence."],
    ["Cost and workload management", "Platform cost follows compute time and data scanned, and is managed by sizing, isolation, scheduling and storage tiering.", "Query execution; Partitioning, clustering and pruning", "FinOps practice, autoscaling, workload management, storage lifecycle tiers.", "Budgets and chargeback. Tiering and deletion follow the retention policy."],
    ["Platform architecture and operating model", "The parts compose into one platform, and whether a central team or the domains own data is an organisational choice with technical consequences.", "Warehouses, lakes and lakehouses; Data products and sharing; Data governance", "Lakehouse reference architecture, central platform teams, domain ownership with federated governance (data mesh).", "Who decides and who enforces: central policy, domain accountability, enforcement by the platform."],
  ] },
];

const AI: StageDef[] = [
  { name: "Foundations", rows: [
    ["Language models", "A language model predicts the next piece of text from what came before, and one model trained on broad text can be instructed to do many tasks.", "", "Large language models, hosted and open-weight, used through chat assistants and APIs.", "A general-purpose model has no built-in purpose. Whoever deploys it defines the use and answers for it."],
    ["Tokens", "A model reads and writes tokens, pieces of words, and every limit and price is counted in them.", "Language models", "Subword tokenisers, token counting, per-token pricing.", "Token counts are the unit of cost control and usage limits."],
    ["Embeddings", "Inside a model every token is a vector, and directions and distances in that space carry meaning.", "Tokens", "Token embeddings, positional information, cosine similarity.", "Vectors derived from sensitive text are sensitive data."],
    ["Attention and the transformer", "Each token gathers information from the others through attention, layer by layer, which is how context shapes meaning.", "Embeddings", "The decoder-only transformer, layers and parameters, context length.", "A model's internal computation is not directly inspectable, so evaluation carries the assurance burden.", "Neural networks"],
    ["Generation and sampling", "A model produces one token at a time from a probability distribution, sampling settings trade determinism for variety, and it can generate reasoning before it answers.", "Attention and the transformer", "Temperature, top-p, output limits, stop sequences, streaming, reasoning tokens.", "Output varies between runs, so tests need repeated trials."],
    ["Training", "Weights are adjusted to predict text better. Knowledge comes from pretraining, behaviour from later tuning and feedback, and nothing is learned after the cutoff.", "Generation and sampling", "Pretraining, instruction tuning, learning from human feedback, model versions and deprecation.", "Training data provenance and licences. Model cards. Poisoned or backdoored weights are a supply-chain risk.", "Loss and optimisation"],
    ["Hallucination and model limits", "A model generates plausible text, not retrieved facts, so it can be fluent and wrong, out of date, or inconsistent between runs.", "Generation and sampling; Training", "Grounding, citations, abstention.", "Where output can mislead, human review and disclosure are required."],
    ["Multimodal models", "Images, audio and documents are encoded into the same vector space as text, so one model can reason over several media.", "Embeddings; Attention and the transformer", "Vision-language models, document understanding, speech input and output.", "Faces and voices are personal data. Synthetic media carries provenance labels."],
    ["Intended use and risk", "What a system is for, who it affects and how badly a failure could hurt decide how much evaluation, oversight and documentation it needs.", "Hallucination and model limits", "Use-case inventories, the risk tiers of the EU AI Act, the map function of the NIST AI Risk Management Framework.", "This concept is governance: the decision that sizes every later control."],
  ] },
  { name: "The model call", rows: [
    ["The model call", "A request is a list of messages with roles and settings, the reply is a completion, and the model remembers nothing between calls.", "Generation and sampling", "Messages APIs, system prompts, stop reasons, hosted and self-hosted endpoints.", "What leaves the organisation in each call: provider retention terms, regional endpoints, no secrets in prompts."],
    ["The context window", "Everything the model sees shares one finite window, the whole conversation is resent on every call, and recall falls as the window fills.", "The model call; Attention and the transformer", "Context limits, conversation history, prompt caching, long-context models.", "Data minimisation applies to context. Logged context is sensitive data."],
    ["Prompting", "Clear instructions, examples and structure steer a model, and a prompt is versioned and tested like code.", "The model call; The context window", "System prompts, few-shot examples, structured delimiters, prompt versioning.", "Prompts are controlled artefacts with review and history. A system prompt is not a security boundary."],
    ["Evaluating model output", "Quality is measured by running a fixed set of cases against graders, which turns an impression into a number that can be tracked.", "Prompting; Generation and sampling", "Eval sets, code graders, model graders calibrated on human labels, regression suites in CI.", "This concept is assurance: evals are the evidence for release decisions."],
    ["Structured output", "A model can be constrained to return data that matches a schema, which makes its output parseable by software.", "Prompting", "JSON schema, constrained decoding, validation and retry.", "Model output is untrusted input to downstream systems. Validate it and never execute it unchecked."],
    ["Tool calling", "The model asks for a function to be run, the application runs it and returns the result, and the model continues with the new information.", "Structured output", "Tool definitions, parallel tool calls, provider-hosted tools such as search and code execution.", "Each tool is a permission: least privilege, argument validation, a log of every call."],
    ["Prompt injection", "A model cannot reliably tell instructions from data, so text typed by a user or returned by a tool can redirect it.", "Prompting; Tool calling", "Direct injection and jailbreaks, indirect injection through tool results and documents, trust boundaries, the OWASP Top 10 for LLM Applications (2026 edition).", "This concept is security: the threat model for every system that reads untrusted content."],
    ["Guardrails", "Checks before and after the model call block disallowed input and catch unsafe or off-policy output.", "Prompt injection; Evaluating model output", "Input and output classifiers, moderation, personal data detection and redaction, policy filters.", "This concept is control: the acceptable-use policy enforced in code. Filters reduce risk and do not remove it."],
    ["Cost, latency and model choice", "Model size, token volume and deployment choice set price and speed, and routing, caching and batching bring both down.", "Tokens; The model call; Evaluating model output", "Model tiers, prompt caching, batch APIs, routing between models, open-weight and hosted models.", "Budgets and rate limits stop unbounded consumption. Vendor concentration and model deprecation are managed risks."],
    ["Fine-tuning and distillation", "Training on your own examples changes a model's default behaviour, and a small model can be taught by a large one.", "Training; Evaluating model output", "LoRA and other adapters, supervised fine-tuning, distillation, choosing between prompting, retrieval and fine-tuning.", "Rights to the training data, memorisation of sensitive examples, versioning of tuned models.", "Representation and transfer learning"],
  ] },
  { name: "Retrieval", rows: [
    ["Retrieval-augmented generation", "Relevant passages are fetched at question time and placed in the context, so the answer rests on current, private and citable sources.", "Hallucination and model limits; The context window", "Retrieval pipelines, citations, retrieval offered to the model as a tool.", "Answers trace to sources. The user's permissions limit what is retrieved."],
    ["Preparing knowledge", "Documents are parsed, split into chunks and tagged with metadata, and these choices bound what retrieval can find.", "Retrieval-augmented generation; Multimodal models", "Layout-aware parsing, chunking strategies, contextual chunk enrichment, metadata.", "Access labels, source and date travel with each chunk. Deletions propagate. A planted document poisons every answer that retrieves it."],
    ["Keyword search", "An inverted index finds the documents that contain the query's terms and ranks them by how rare and how frequent those terms are.", "Preparing knowledge", "Inverted indexes, BM25, Lucene-based search engines.", "Permission filters apply at query time, per document."],
    ["Vector search", "An embedding model maps each passage to one vector, and an index finds the nearest vectors to a query approximately, trading a little recall for speed.", "Embeddings; Preparing knowledge", "Text embedding models, HNSW and IVF indexes, vector databases, pgvector, quantisation.", "Permission filters and tenant isolation inside the index."],
    ["Hybrid search and reranking", "Keyword and vector search fail on different queries, so their rankings are fused and a slower, more accurate model reorders the best candidates.", "Keyword search; Vector search", "Reciprocal rank fusion, cross-encoder rerankers.", "Retrieval quality is measured, not assumed."],
    ["Multi-step retrieval", "Hard questions need the query rewritten, decomposed or answered over several lookups, with the model deciding what to fetch next.", "Hybrid search and reranking; Tool calling", "Query rewriting, agentic search, knowledge-graph retrieval, long context weighed against retrieval.", "Each added step reads more untrusted content and costs more, so steps are bounded."],
    ["Evaluating retrieval", "A grounded system is measured in two parts: whether retrieval found the evidence, and whether the answer stayed faithful to it.", "Evaluating model output; Hybrid search and reranking", "Recall and precision at k, groundedness, citation accuracy.", "This concept is assurance: the evidence behind accuracy claims. Unanswerable questions are monitored."],
  ] },
  { name: "Agents", rows: [
    ["The agent loop", "An agent is a model that calls tools in a loop: it acts, reads the result and decides the next step until the task is done or a limit is reached.", "Tool calling; The context window", "Agent harnesses and SDKs, stop conditions, step and budget limits.", "Limits on steps, spend and time. Full transcripts kept for audit."],
    ["Orchestration patterns", "Many tasks need only fixed steps in code with a model at each, and the simplest design that solves the task is the right one.", "The agent loop", "Prompt chaining, routing, parallelisation, evaluate-and-revise loops, workflows weighed against autonomous agents.", "Autonomy is a risk decision: more of it needs more oversight."],
    ["Tools and protocols", "Tools are the agent's interface to the world, and a shared protocol lets one tool server serve many agents.", "Tool calling; The agent loop", "Model Context Protocol, the Agent2Agent protocol, Agent Skills, tool design with small clear sets.", "The tool supply chain, authentication and authorisation, per-tool permissions."],
    ["Agent memory", "Memory is storage outside the context window, with rules for what is written, kept and read back across sessions.", "The context window; The agent loop", "Working memory and long-term episodic, semantic and procedural stores. Memory tools and files.", "Memory writes are security events: a poisoned entry loads in every later session. Retention, user visibility and deletion apply."],
    ["Context engineering", "An agent's context is assembled at every step from instructions, tools, history, memory and retrieved data, and curating it keeps the model accurate as work grows.", "The context window; Agent memory", "Compaction, just-in-time loading, structured notes, skills loaded on demand, minimal tool sets, sub-agent isolation.", "Only what the step needs enters the context, which limits both leakage and the reach of injected text."],
    ["Planning and long-running work", "Long tasks outlast one context window, so the agent plans, records progress outside the window and resumes from that record.", "The agent loop; Context engineering", "Task decomposition, progress files and checkpoints, resumable runs.", "Checkpoints are review points. Spend ceilings apply."],
    ["Multi-agent systems", "Several agents with separate contexts divide a task, which adds parallelism and isolation at the price of coordination and tokens.", "Orchestration patterns; Context engineering", "Orchestrator and sub-agents, parallel workers, context isolation.", "Privilege separation between agents. Accountability for the combined result."],
    ["Execution environments", "Agents that run code or operate a computer need a sandbox that limits what they can touch.", "The agent loop; Tools and protocols", "Code execution sandboxes, containers and micro-VMs, computer and browser use, network egress controls.", "This concept is security: isolation, file and network policy, secrets handling."],
    ["Agent authority and human oversight", "An agent can err or be manipulated, so its authority is limited to what the task needs and irreversible actions wait for a person.", "Prompt injection; Tools and protocols; Execution environments", "Least privilege, the lethal trifecta (private data, untrusted content, external communication), the Agents Rule of Two, approval gates, a privileged and quarantined model split, the OWASP Top 10 for Agentic Applications.", "This concept is control: who may approve what, and what the agent may never do."],
    ["Evaluating agents", "An agent is graded on the state it leaves and the path it took, over repeated trials, because behaviour varies between runs.", "Evaluating model output; The agent loop", "Tasks, trials, graders and transcripts, pass@k and pass^k, capability and regression suites, red teaming.", "This concept is assurance: the evidence for deployment. Adversarial testing is part of the suite."],
  ] },
  { name: "Production", rows: [
    ["Model serving", "Inference runs on accelerators, where batching, caching and quantisation set throughput, latency and cost.", "Generation and sampling; Cost, latency and model choice", "Hosted APIs and self-hosted open weights, inference servers, quantisation, autoscaling.", "Residency and isolation are deployment decisions. Fallbacks protect availability."],
    ["Observability and feedback", "Every production request is traced, sampled and scored, so quality and drift are seen before users report them.", "Evaluating model output; The agent loop", "Tracing with the OpenTelemetry generative AI conventions (in development), online evals, user feedback.", "Traces hold personal data. Monitoring after deployment is a regulatory duty for higher-risk uses.", "Monitoring and drift"],
    ["Release and change management", "Prompts, models and tools change behaviour together, so each change ships behind an eval gate and can be rolled back.", "Evaluating model output; Observability and feedback", "Prompt and model versioning, regression gates in CI, staged rollout, handling model deprecation.", "This concept is control: change approval, with release evidence on file."],
    ["AI risk management", "Risks are identified, measured and given owners across the system's life, as a repeating cycle and not a one-off review.", "Intended use and risk; Guardrails; Agent authority and human oversight", "NIST AI Risk Management Framework with its Generative AI Profile, ISO/IEC 42001, EU AI Act obligations, red teaming.", "This concept is governance: accountability, documentation, incident reporting.", "Model risk management"],
  ] },
];

const ML: StageDef[] = [
  { name: "Foundations", rows: [
    ["Learning from examples", "A model is a function fitted to examples so that it generalises to new ones. Predicting a category is classification, predicting a number is regression.", "", "Supervised, unsupervised and reinforcement learning. A rule-based baseline first.", "Whether a decision should be automated at all, and its intended use, is decided and recorded first."],
    ["Features, labels and datasets", "A learning problem is a table of examples: the columns the model may use and the value it must predict.", "Learning from examples", "Tabular datasets, target definition, dataset documentation.", "Which attributes may lawfully be used. Protected attributes and their proxies."],
    ["Exploring data", "Distributions, missing values, outliers and correlations are examined before any model is fitted, because they decide what a model can learn.", "Features, labels and datasets", "Summary statistics, histograms and scatter plots, correlation, data profiling.", "Who is missing or under-represented in the data is found here, before it becomes a biased model."],
    ["Labels and ground truth", "Labels are measurements made by people or systems, with noise, delay and bias that a model learns faithfully.", "Features, labels and datasets", "Labelling guidelines, annotator agreement, weak supervision, active learning.", "Label definitions have owners. Mislabelled or poisoned labels are learned as truth. Labelled records keep their privacy duties."],
    ["Loss and optimisation", "A loss measures how wrong a model is, and training searches for the parameters that make it small, most often by stepping downhill along its gradient.", "Learning from examples", "Squared error and cross-entropy, gradient descent with mini-batches, learning rate, Adam.", "The loss encodes what the organisation says it values. What it ignores, the model ignores."],
    ["Training, validation and test sets", "A model is judged only on data it did not learn from, and how the data is split decides whether that judgement can be trusted.", "Features, labels and datasets; Loss and optimisation", "Hold-out sets, k-fold cross-validation, time-based and group splits.", "Leakage is the commonest cause of false results. Access to the test set is controlled."],
    ["Feature engineering", "How columns are encoded, scaled and combined often matters more than the choice of model, and every step is fitted on training data only.", "Exploring data; Training, validation and test sets", "Categorical encodings, scaling, missing-value handling, feature selection, preprocessing pipelines.", "Leakage prevention. Proxies for protected attributes."],
    ["Overfitting and generalisation", "A model can memorise its training data, and the gap between training and validation error shows when it has.", "Loss and optimisation; Training, validation and test sets", "Bias and variance, regularisation, early stopping, learning curves.", "Validation evidence is required before use. A model that memorises can also reveal individual training records."],
    ["Metrics and thresholds", "The metric must match the decision: accuracy hides rare classes, and the threshold sets the trade between false alarms and misses.", "Training, validation and test sets", "Precision and recall, ROC and precision-recall curves, MAE and RMSE, class imbalance handling, cost-based thresholds.", "Error costs fall on people. The threshold is a policy decision with an owner."],
  ] },
  { name: "Model families", rows: [
    ["Linear and logistic regression", "A weighted sum of features gives a prediction that is easy to fit and to read, and it is the baseline every other model must beat.", "Loss and optimisation; Feature engineering", "Regularised linear models, generalised linear models, support vector machines and kernels, scorecards.", "Interpretable by construction, and preferred where decisions must be explained."],
    ["Nearest neighbours", "A prediction can come from the most similar known examples, which makes the choice of distance the model.", "Feature engineering", "k-nearest neighbours, distance metrics, approximate similarity search.", "Each prediction points back to individual training records, which is a privacy exposure."],
    ["Probabilistic models", "A model can state its belief as a probability distribution, updated from a prior as data arrives.", "Loss and optimisation", "Bayes' rule, naive Bayes, Gaussian processes, Bayesian linear models.", "Priors are assumptions and are documented like any other design decision."],
    ["Decision trees", "A tree splits the data one feature at a time into groups with similar outcomes, giving rules a person can follow.", "Feature engineering; Overfitting and generalisation", "CART, limits on depth and leaf size.", "Readable rules support human review of individual decisions."],
    ["Bagging and random forests", "Averaging many trees trained on resampled data cancels their individual errors.", "Decision trees", "Random forests, out-of-bag estimates.", "Built-in importance scores favour high-cardinality features and are not an explanation on their own."],
    ["Gradient boosting", "Trees are added one at a time, each correcting the errors left by those before.", "Decision trees; Loss and optimisation", "XGBoost, LightGBM, CatBoost. Learning rate, early stopping, monotonic constraints.", "High accuracy with less transparency, so explanation methods and constraints matter in regulated use."],
    ["Neural networks", "Layers of weighted sums and non-linear functions learn their own features, trained by propagating error backwards.", "Loss and optimisation; Linear and logistic regression", "Backpropagation, activation functions, dropout, normalisation, PyTorch.", "Opacity raises the validation and monitoring burden."],
    ["Architectures for images, sequences and text", "Convolution, recurrence and attention build assumptions about the data into the network.", "Neural networks", "Convolutional networks, transformers for vision and sequences.", "Image and voice data is often biometric. Dataset bias shows as unequal error rates.", "Attention and the transformer"],
    ["Representation and transfer learning", "A model pretrained on broad data has learned features that transfer, so a new task needs far fewer labelled examples.", "Neural networks; Architectures for images, sequences and text", "Pretrained models, fine-tuning, embeddings, self-supervised learning, foundation models.", "Pretrained weights are a supply chain: inherited bias, licence terms, provenance and possible backdoors."],
    ["Tabular foundation models", "A network pretrained on many tables predicts a new one in a single forward pass, reading the labelled rows as context instead of training on them.", "Probabilistic models; Gradient boosting; Representation and transfer learning", "Prior-data fitted networks pretrained on synthetic tables (TabPFN), TabICL, in-context learning, published row and feature limits.", "Licence terms on the weights, non-commercial for recent TabPFN releases. Limits and benchmark claims are vendor-stated until independently confirmed."],
  ] },
  { name: "Other learning problems", rows: [
    ["Generative models", "A model can learn the distribution of the data itself and sample new examples from it.", "Neural networks; Representation and transfer learning", "Autoencoders, diffusion models, autoregressive models, synthetic tabular data.", "Privacy claims for synthetic data need testing. Generated media needs provenance."],
    ["Clustering and anomaly detection", "Without labels, structure is found by grouping similar examples and flagging the ones that fit no group.", "Nearest neighbours", "k-means, density-based clustering, Gaussian mixtures, isolation forests.", "Segments can encode protected traits. A flagged person is reviewed before any action."],
    ["Dimensionality reduction", "Many correlated features can be compressed into a few directions that keep most of the information.", "Exploring data; Linear and logistic regression", "PCA, UMAP and t-SNE for visualisation, autoencoders.", "A projection can show clusters that are not there. It is exploration, not evidence."],
    ["Forecasting", "Time-ordered data has trend, seasonality and autocorrelation, and a forecast is tested by replaying the past in order.", "Training, validation and test sets; Gradient boosting", "Lag features with boosted trees, exponential smoothing and ARIMA, backtesting, time-series foundation models (Chronos, TimesFM).", "Forecasts are published with their uncertainty. Some foundation model weights are non-commercial."],
    ["Recommendation and ranking", "Ranking models order items for a user from past interactions, and their output shapes the data they later learn from.", "Representation and transfer learning; Metrics and thresholds", "Collaborative filtering, two-tower retrieval, learning to rank.", "Feedback loops narrow what users see. Transparency duties apply to ranking."],
    ["Reinforcement learning and bandits", "An agent learns by acting and receiving reward, balancing what it knows against what it has yet to try.", "Loss and optimisation", "Multi-armed and contextual bandits, policy and value methods, offline evaluation.", "Limits on exploration. A mis-specified reward produces harmful behaviour."],
  ] },
  { name: "Selection and trust", rows: [
    ["Model selection and tuning", "Model families and hyperparameters are compared by search under cross-validation, and the search itself can overfit the validation data.", "Overfitting and generalisation; Metrics and thresholds; Gradient boosting; Tabular foundation models", "Random and Bayesian search, nested cross-validation, AutoML, ensembling, independent benchmarks such as TabArena.", "Reproducible search. The reason for the choice is recorded. Independent evidence outranks vendor evidence."],
    ["Uncertainty and calibration", "A predicted probability is useful only if it matches observed frequencies, and intervals state how far a prediction can be trusted.", "Metrics and thresholds; Probabilistic models", "Calibration curves, Platt and isotonic scaling, conformal prediction, quantile regression.", "This concept is control: low-confidence cases are routed to a person."],
    ["Interpretability", "Explanations attribute a prediction to features, globally and for one case, and each method has known ways of misleading.", "Linear and logistic regression; Gradient boosting", "Permutation importance, SHAP, partial dependence, counterfactual explanations, interpretable models.", "This concept is governance: the legal duty to explain automated decisions."],
    ["Fairness", "A model can perform differently across groups, the definitions of fairness conflict, and choosing one is a policy decision made measurable.", "Metrics and thresholds; Exploring data", "Group metrics, bias audits, mitigation before, during and after training.", "This concept is governance: non-discrimination law and a documented fairness assessment."],
    ["Security and privacy of models", "Models can be fooled by crafted inputs, poisoned through their training data and made to reveal what they were trained on.", "Overfitting and generalisation; Neural networks", "Adversarial examples, data poisoning, membership inference, differential privacy, federated learning, MITRE ATLAS.", "This concept is security: the threat model for a trained model."],
  ] },
  { name: "Production", rows: [
    ["Experiment tracking and reproducibility", "A result counts when data, code, configuration and environment are recorded well enough to produce it again.", "Model selection and tuning", "MLflow, Weights and Biases, data and model versioning, model registry.", "An audit trail from any prediction back to its model version and training data."],
    ["Training pipelines", "Training is an automated pipeline from data to a validated, registered model, so retraining is routine and repeatable.", "Experiment tracking and reproducibility; Feature engineering", "Pipeline orchestration, CI/CD for models, validation gates, scheduled and triggered retraining.", "Every model version traces to its data, code and approval."],
    ["Features in production", "A feature is computed the same way in training and at prediction time, using only data that existed at that moment.", "Feature engineering; Training pipelines", "Feature stores, point-in-time joins, online and offline stores.", "Training-serving skew is a correctness risk. Features carry access rules.", "Serving data to ML and AI"],
    ["Model deployment", "Predictions are served in batch, on request or on a stream, and a new model runs beside the old one before it replaces it.", "Training pipelines; Features in production", "Batch scoring, online endpoints, shadow and canary releases, portable model formats.", "Approval gates, rollback plans, separation between builder and approver."],
    ["Monitoring and drift", "The world changes after training, so inputs, predictions and outcomes are watched and compared with the training period.", "Model deployment; Metrics and thresholds", "Data and concept drift detection, monitoring with delayed labels, retraining triggers.", "This concept is control: ongoing monitoring is a model-risk requirement, and alerts have owners.", "Observability and incident response"],
    ["Online experiments and causal effect", "A model's value is the difference it causes, measured by randomised comparison instead of correlation in logs.", "Metrics and thresholds; Model deployment", "A/B tests, holdout groups, uplift modelling, guardrail metrics.", "Experiment ethics and consent. Decisions rest on measured effect."],
    ["Model risk management", "Each model has an owner, a documented purpose, independent validation and a review cycle in proportion to the harm it could cause.", "Fairness; Interpretability; Monitoring and drift", "Model inventory, model cards, independent validation, EU AI Act obligations for high-risk systems, NIST AI Risk Management Framework.", "This concept is governance: accountability across the model's life.", "AI risk management"],
  ] },
];

const DEFS: TrackDef[] = [
  { key: "data", name: "Data", scope: "Data concepts and modern, scalable, cloud-agnostic data engineering.", stages: DATA },
  { key: "ai", name: "AI", scope: "Language models, context, retrieval, agents, evaluation and security.", stages: AI },
  { key: "ml", name: "ML", scope: "Machine learning concepts, including tabular foundation models.", stages: ML },
];

export interface Concept {
  /** URL slug and internal key. Never shown. */
  key: string;
  title: string;
  track: TrackKey;
  trackName: string;
  stage: string;
  /** 1-based stage number within the track. */
  stageNo: number;
  understands: string;
  practice: string;
  governance: string;
  /** Keys of the concepts this one builds on, in the same track. */
  buildsOn: string[];
  /** Keys of matching concepts in other tracks. Never required. */
  seeAlso: string[];
  /** True where a control is the concept itself. */
  control: boolean;
}
export interface Stage { name: string; no: number; concepts: Concept[] }
export interface Track { key: TrackKey; name: string; scope: string; stages: Stage[]; concepts: Concept[] }

export const slugOf = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const names = (s: string | undefined) => (s ?? "").split(";").map((t) => t.trim()).filter(Boolean);

export const tracks: Track[] = DEFS.map((t) => {
  const stages: Stage[] = t.stages.map((s, i) => ({
    name: s.name, no: i + 1,
    concepts: s.rows.map(([title, understands, buildsOn, practice, governance, seeAlso]) => ({
      key: slugOf(title), title, track: t.key, trackName: t.name, stage: s.name, stageNo: i + 1,
      understands, practice, governance,
      buildsOn: names(buildsOn).map(slugOf), seeAlso: names(seeAlso).map(slugOf),
      control: governance.startsWith("This concept is"),
    })),
  }));
  return { key: t.key, name: t.name, scope: t.scope, stages, concepts: stages.flatMap((s) => s.concepts) };
});

/** Every concept, track by track, in teaching order. */
export const concepts: Concept[] = tracks.flatMap((t) => t.concepts);
const byKey = new Map(concepts.map((c) => [c.key, c]));
export const concept = (key: string): Concept | undefined => byKey.get(key);
/** Concepts in the same track that build on this one. */
export const unlocks = (key: string): Concept[] => concepts.filter((c) => c.buildsOn.includes(key));

/** Problems in the map itself: a duplicate title, or a reference to a concept that does not exist or comes later. */
export function curriculumErrors(): string[] {
  const out: string[] = [];
  if (byKey.size !== concepts.length) out.push("duplicate concept title");
  for (const t of tracks) {
    const seen = new Set<string>();
    for (const c of t.concepts) {
      for (const k of c.buildsOn) {
        if (!byKey.has(k)) out.push(`${c.title}: builds on unknown concept ${k}`);
        else if (!seen.has(k)) out.push(`${c.title}: builds on ${byKey.get(k)!.title}, which is not earlier in the ${t.name} track`);
      }
      for (const k of c.seeAlso) {
        if (!byKey.has(k)) out.push(`${c.title}: see also unknown concept ${k}`);
        else if (byKey.get(k)!.track === t.key) out.push(`${c.title}: see also must point to another track`);
      }
      seen.add(c.key);
    }
  }
  return out;
}

/** A guide must sit on a concept of the curriculum: same key, track, title and stage. */
export function guideErrors(list: Guide[]): string[] {
  const out: string[] = [];
  for (const g of list) {
    const c = concept(g.slug);
    if (!c) { out.push(`guide ${g.slug}: no such concept in the curriculum`); continue; }
    if (g.id !== c.key) out.push(`guide ${g.slug}: id must equal the concept key`);
    if (g.track !== c.track) out.push(`guide ${g.slug}: track is ${g.track}, the concept is in ${c.track}`);
    if (g.title !== c.title) out.push(`guide ${g.slug}: title must be "${c.title}"`);
    if (g.module !== c.stage) out.push(`guide ${g.slug}: module must be the stage "${c.stage}"`);
  }
  return out;
}
