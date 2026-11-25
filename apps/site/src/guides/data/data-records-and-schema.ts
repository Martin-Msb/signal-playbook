import { blocks, CANVAS, defineGuide, isoGrid, line, list, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Pt } from "@signal-path/engine";

// The floor: one rail from Checkout to Finance. Beside its middle lies the dataset: one row of blocks per record,
// one block per field, one colour per field. Without a schema the rows are ragged and grey.
// The schema stands on a card at the back. The check that applies it moves from the write side of the rail to the read side.
const G = isoGrid(330, 30, 30);
const R = 10.6, C = 18.8, SIZE = 1.5, FP = 2.2, RP = 1.9, H = 20;
const FIELDS: { k: string; hue: Hue }[] = [{ k: "order", hue: "sand" }, { k: "channel", hue: "mint" }, { k: "email", hue: "rose" }, { k: "amount", hue: "sky" }];
const X0 = 9, Y0 = 0;
const S = { co: 3.3, w: 6.2, store: 13, r: 8.4, fin: 6, end: 3.4 };
const up = (gx: number, gy: number, dy: number): Pt => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];
/** One value: the block of field f in record k. Each block is its own element, so labels and records can rest beside the rows. */
const value = (id: string, k: number, f: number, group: string, extra: { hue?: Hue; hot?: boolean } = {}): El =>
  blocks(id, X0 + k * RP, Y0 + f * FP, 1, SIZE, [{ h: H, ...extra }], { group });
/** One record of the dataset: one block per field, in the field's colour. */
const record = (id: string, k: number, group: string, bad = false): El[] =>
  FIELDS.map((fl, f) => value(`${id}-${fl.k}`, k, f, group, bad && f === 3 ? { hot: true } : { hue: fl.hue }));
/** A line of text: n unnamed values. */
const grey = (id: string, k: number, n: number): El[] => Array.from({ length: n }, (_, f) => value(`${id}-${f}`, k, f * 0.77, "raw", { hue: "paper" }));
const CARD: Pt = [128, 516], SCHEMA: Pt = [822, 196];
const card = (id: string, title: string, sub: string | undefined, order: string, amount: string, hot: boolean): El =>
  raise(table(id, 0, 0, 196, ["field", "value"], [["order", order], ["channel", "web"], ["email", "m.l@…"], { cells: ["amount", amount], hot }], { at: [12, 98], rowH: 24, title, sub, group: id }), CARD, 30);

export default defineGuide({
  id: "data-records-and-schema", track: "data", module: "Data and databases", slug: "data-records-and-schema",
  title: "Data, records and schema",
  summary: "A dataset is a collection of records. Each record is a set of named fields, each field has a type, and the schema is the agreement between writer and reader about that shape.",
  forLeads: "The schema is the contract every later system relies on. It is also where a field is marked as personal, so access rules follow the field wherever the data goes.",
  status: "draft", minutes: 6,
  counters: ["Fields", "Types", "Schema applied", "Sensitive fields"],
  whatIf: { label: "What if there were no schema?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, values and labels are illustrative",
    label: "A rail runs from Checkout past the orders dataset to Finance. The dataset is drawn as blocks, one row per record and one block per field. Without a schema the rows are grey and of different lengths. With named fields every record has four blocks in four colours, and a schema card lists each field and its type. A schema check first stands on the write side of the rail and rejects a record whose amount is text, then stands on the read side, where the same record is stored and met at query time. At the last stop the email field carries a personal label and Finance receives the record without it.",
    els: [
      line("rail", [G.p(2, R), G.p(C, R), G.p(C, S.end)], { always: true }),
      stop("s-co", ...G.p(S.co, R), undefined, undefined, { always: true }),
      stop("s-store", ...G.p(S.store, R), undefined, undefined, { always: true }),
      stop("s-fin", ...G.p(C, S.fin), undefined, undefined, { always: true }),
      prism("co", 0.6, R - 0.7, 1.4, 1.4, 30, { hue: "track", glyph: "pen", title: "Checkout", sub: "writes orders", at: "n", always: true }),
      prism("fin-q", C - 0.7, S.end - 1.4, 1.4, 1.4, 30, { glyph: "chart", title: "Finance", sub: "which value is the amount?", at: "n", group: "raw" }),
      prism("fin", C - 0.7, S.end - 1.4, 1.4, 1.4, 30, { glyph: "chart", title: "Finance", sub: "amount by channel", at: "n", group: "named" }),

      // 1. values without a schema: ragged, unnamed rows and a file of text lines
      ...grey("g0", 0, 4), ...grey("g1", 1, 3), ...grey("g2", 2, 5),
      pill("raw-l", up(X0 - 1.2, Y0 + 0.75, 15), "orders, as text", { glyph: "file", anchor: "end", group: "raw" }),
      raise(list("lines", 0, 0, 236, ["4468,store,a.k@…,129", "4469;349;store", "4470,web,m.l@…,1 290 kr,x"], { title: "orders.txt", sub: "no agreed shape", mono: true, group: "raw" }), [150, 512], 30),

      // 2 to 6. the dataset: one row of four typed blocks per record
      ...record("r0", 0, "named"), ...record("r1", 1, "named"), ...record("r2", 2, "named"),
      ...record("r3", 3, "more"), ...record("r3x", 3, "bad", true),
      ...FIELDS.map((f, i) => pill(`f-${f.k}`, up(X0 - 1.2, Y0 + i * FP + SIZE / 2, 15), f.k, { anchor: "end", mono: true, group: f.k === "email" ? "plain" : "named" })),
      pill("f-email-l", up(X0 - 1.2, Y0 + 2 * FP + SIZE / 2, 15), "email", { glyph: "lock", anchor: "end", mono: true, group: "gov" }),
      card("rec", "One record", undefined, "4470", "1290", false),
      card("rec-kept", "Record 4471", "stored as it is", "4471", "\"n/a\"", true),

      // 3 to 5. the schema
      raise(table("schema", 0, 0, 220, ["field", "type"], [["order", "long"], ["channel", "string"], ["email", "string"], ["amount", "int"]], { at: [12, 114], rowH: 24, title: "orders schema", sub: "the agreed shape", mono: true, group: "schema" }), SCHEMA, 30),
      raise(table("schema6", 0, 0, 250, ["field", "type", "label"], [["order", "long", ""], ["channel", "string", ""], { cells: ["email", "string", "personal"], hot: true }, ["amount", "int", ""]], { at: [12, 90, 160], rowH: 24, title: "orders schema", sub: "shape and sensitivity", mono: true, group: "gov" }), SCHEMA, 30),

      // 4 and 5. where the schema is applied
      stop("s-w", ...G.p(S.w, R), undefined, undefined, { group: "wgate" }),
      prism("wg", S.w - 0.6, R + 1.3, 1.2, 1.2, 24, { hue: "track", glyph: "check", title: "Schema check", sub: "on write", at: "s", group: "wgate" }),
      stop("s-r", ...G.p(C, S.r), undefined, undefined, { group: "rgate" }),
      prism("rg", C + 1.3, S.r - 0.6, 1.2, 1.2, 24, { hue: "track", glyph: "check", title: "Schema check", sub: "on read", at: "e", group: "rgate" }),

      // 6. the label on the field decides what a reader receives
      stop("s-tag", ...G.p(C, S.r), undefined, undefined, { group: "gov" }),
      prism("tag", C + 1.3, S.r - 0.6, 1.2, 1.2, 24, { hue: "rose", glyph: "lock", title: "Policy tag", sub: "email: personal", at: "e", group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "text", label: "No shape", kind: "problem", title: "Values without a schema leave readers guessing",
      caption: "Checkout appends each order as a line of text. Nothing states which value is the amount, or that one must exist. Finance has to guess.",
      show: ["raw"], counters: ["unnamed", "unknown", "never", "unlabelled"],
      rides: [ride("rail", "s-store", "s-fin", "4469;349;store")],
      body: ["The three lines use different separators, a different order and a different number of values. Each reader writes its own rules for taking them apart, and the rules disagree.",
        "What is missing is a contract for data between the producer and the consumers."],
      claims: ["data-records-and-schema-contract"],
    }),
    step({
      id: "record", label: "Records", kind: "idea", title: "A record is a set of named fields",
      caption: "Each order becomes one record. Every record has the same four fields: order, channel, email and amount. A dataset is a collection of such records.",
      show: ["named", "plain", "rec"], counters: ["4 named", "unknown", "never", "unlabelled"],
      rides: [ride("rail", "s-co", "s-store", "order 4470")],
      body: ["The same idea carries different names. A relational table consists of rows and columns: the number and order of the columns is fixed, and each column has a name. In Apache Avro a record has a name and a list of fields, and each field has a name.",
        { callout: { label: "Key idea", text: "Record and row, field and column: one order is one record, and one named value in it is one field." } }],
      claims: ["data-records-and-schema-table", "data-records-and-schema-avro-record"],
    }),
    step({
      id: "schema", label: "Schema", kind: "idea", title: "A schema gives every field a type",
      caption: "The schema lists each field's name and type. A type limits the values a field may hold. Checkout and Finance now share one agreement about the shape.",
      show: ["named", "plain", "rec", "schema"], counters: ["4 named", "4 declared", "not yet", "unlabelled"],
      rides: [ride("rail", "s-store", "s-fin", "amount 1290")],
      body: ["In PostgreSQL each column has a data type. The data type constrains the set of possible values that can be assigned to a column and gives the stored data a meaning, so that it can be used for computations.",
        "An Avro schema is written in JSON. The type of a field is itself a schema, and the primitive type names are null, boolean, int, long, float, double, bytes and string.",
        { callout: { label: "Key idea", text: "A schema provides the contract between producers and consumers of data." } }],
      claims: ["data-records-and-schema-type", "data-records-and-schema-avro-record", "data-records-and-schema-avro-types", "data-records-and-schema-contract"],
    }),
    step({
      id: "write", label: "On write", kind: "mechanism", title: "Schema on write checks before storing",
      caption: "PostgreSQL and Delta Lake compare each incoming record with the schema. An amount that is text raises an error, and the record never lands.",
      show: ["named", "plain", "more", "schema", "wgate"], counters: ["4 named", "4 declared", "at write", "unlabelled"],
      rides: [ride("rail", "s-co", "s-store", "4471", { via: ["s-w"] }), ride("rail", "s-co", "s-w", "\"n/a\" rejected", { tone: "alert" })],
      body: ["In PostgreSQL, data types limit the kind of data that can be stored in a table. If a user attempts to store data in a column that would violate a constraint, an error is raised.",
        "Delta Lake validates that the schema of the data being written is compatible with the schema of the table. Every written column must exist in the table and its data type must match, and a write that breaks either rule raises an exception.",
        "A data warehouse enforces structure as it ingests data. That approach is known as schema-on-write."],
      claims: ["data-records-and-schema-constraint", "data-records-and-schema-delta", "data-records-and-schema-terms"],
    }),
    step({
      id: "read", label: "On read", kind: "mechanism", title: "Schema on read checks at query time",
      caption: "The files are stored as they arrive. Amazon Athena keeps the schema in a catalogue and projects it onto the data when Finance runs a query.",
      show: ["named", "plain", "bad", "rec-kept", "schema", "rgate"], counters: ["4 named", "4 declared", "at read", "unlabelled"],
      rides: [ride("rail", "s-co", "s-r", "amount \"n/a\"", { via: ["s-store"], tone: "alert" })],
      body: ["Athena stores the schema in the AWS Glue Data Catalog and uses it to read the data when the table is queried. It does not modify the data in Amazon S3, and no loading or transformation is needed first.",
        "Data lakes keep data in its original state and apply transformation only when the data is needed. That approach is known as schema-on-read.",
        "Avro keeps both sides explicit: data is always read with the schema that wrote it present. When the reader expects a different schema, a field only the writer has is ignored, and a field only the reader has, with no default value, signals an error.",
        "A schema can also be loose by default. In JSON Schema, declared properties are not required and additional properties are allowed unless the schema says otherwise."],
      claims: ["data-records-and-schema-athena", "data-records-and-schema-terms", "data-records-and-schema-avro-resolution", "data-records-and-schema-json-schema"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What the schema settles",
      caption: "",
      show: ["named", "more", "rec", "gov"], counters: ["4 named", "4 declared", "at write or at read", "email: personal"],
      rides: [ride("rail", "s-store", "s-fin", "4 fields", { via: ["s-tag"], then: "email withheld" })],
      body: [{ pair: {
        left: { label: "When to check", items: ["On write: bad records stopped early", "On read: raw data kept, schema per query"] },
        right: { label: "What to label", items: ["Sensitive fields, in the schema", "Access decided per field"] },
      } },
        "An email address is personal data: information relating to an identified or identifiable individual. Some types of personal data, usually called sensitive data, belong to special categories that deserve more protection.",
        "The label sits where the field is defined. Avro permits attributes beyond its specification as metadata on a schema. In BigQuery a policy tag is assigned to a column through schema annotations, and a reader without the fine-grained role does not get that column's data. Snowflake classification records a semantic category and a privacy category as system tags on each column it finds sensitive.",
        "The definition of personal data is under review in the European Union. The Digital Omnibus proposal was not adopted by late November 2026, and the Council's negotiating mandate of 21 October 2026 keeps the current definition."],
      claims: ["data-records-and-schema-terms", "data-records-and-schema-personal", "data-records-and-schema-avro-metadata", "data-records-and-schema-policy-tags", "data-records-and-schema-classification", "data-records-and-schema-omnibus"],
    }),
  ],
  governance: { text: "Sensitivity is a property of a field. An email address is personal data, so the email field carries that label in the schema, and column controls such as BigQuery policy tags and Snowflake classification tags attach to it there.", claims: ["data-records-and-schema-personal", "data-records-and-schema-policy-tags", "data-records-and-schema-classification"] },
  closing: {
    pitfalls: [
      "Treating schema on read as no schema. The agreement still exists, and it is applied by every reader at query time.",
      "Declaring every field as a string, which names the fields and leaves their values unchecked.",
      "Labelling a whole table as sensitive when only the email field is, or labelling nothing because the label has no place in the schema.",
    ],
    questions: [
      "What does a schema state about each field of a record?",
      "Where does a record with a text amount stop under schema on write, and where under schema on read?",
      "Why is the personal label attached to the email field and not to the dataset?",
    ],
  },
});
