# INTERPLANE

**INTERPLANE is an open interoperability protocol between AI models and agent runtimes.**

> Models express intent. Runtimes retain authority. INTERPLANE defines the boundary between them.

This repository holds the protocol (normative text and JSON Schemas), the Rust reference
implementation, the conformance fixtures, the AIEN reference adapter, and the benchmark and
qualification records behind every published result. A model's output is parsed into tool
requests; the runtime decides each request with its own policy; INTERPLANE carries the request and
the decision across the boundary and refuses to upgrade a decision. Website:
[interplane.io](https://interplane.io) (its source is
[aien-dev/interplane.io](https://github.com/aien-dev/interplane.io)).

```
Model side:        Qwen3.5      Ajax (when published)      other local or hosted models
                        \            |             /
                         ----- INTERPLANE -----
                        /            |             \
Runtime side:           AIEN          other runtimes
```

INTERPLANE belongs to neither side. AIEN is the reference runtime (Odysseus was the first, through an
adapter removed on 2026-10-15; see "Removed adapters" below); Qwen3.5 is the first qualified model
dialect. Each runtime keeps its own tools, policy, approvals, memory and execution. INTERPLANE only
standardizes what crosses between them and makes it measurable.

## Where it fits in AIEN

INTERPLANE is an attachment of [Aienix](https://github.com/aien-dev/aienix), the core tree of AIEN:
it lives in its own repository and plugs into the core at a boundary. Related repositories:

- [aien-dev/aien-sovereign-core-mv](https://github.com/aien-dev/aien-sovereign-core-mv): the AIEN
  host runtime. `adapters/aien` pins its `aien-capability` and `aien-mcp` crates. Its `aien-test`
  tool is the Spark judge that tests every pull request here.
- [aien-dev/aegis-runtime-mv](https://github.com/aien-dev/aegis-runtime-mv) and
  [aien-dev/aien-protocols-mv](https://github.com/aien-dev/aien-protocols-mv): sibling checkouts the
  AIEN adapter builds against, pinned in `adapters/aien/PINS`.
- [aien-dev/aien-architecture-mv](https://github.com/aien-dev/aien-architecture-mv): AIEN's
  canonical architecture and decision records.
- [aien-dev/aien-receipts](https://github.com/aien-dev/aien-receipts): the signed test bundles the
  Spark publishes for this repository, under `interplane/<commit>/bundle.json`.

## Status (2026-10-19)

- Version 0.3.0 (the Rust workspace version in `rust/Cargo.toml`). Pre-1.0.
- 0.1 (Reality Layer) is the base. 0.2 (Capability) is closed with its pre-registered gate failed
  and the failure published (`docs/REPORT-0.2.md`). 0.3 (Trust) is closed with its gate passed
  (`docs/REPORT-0.3.md`). 0.4 and 0.5 are planned, not built (`ROADMAP.md`).
- 2026-10-15: the Python SDK, the Python adapters and the Python bench tools were removed; the
  conformance tools and examples moved to Rust (PRs #106, #107, #108).
- 2026-10-16: the repository joined the Spark verification pipeline (PR #109), and the DGX Spark
  became the only test judge. On 2026-10-18 the hosted test workflows were removed (PRs #112, #113;
  see `docs/PIPELINE.md`).
- Open tracking issues: #101 (INTERPLANE against the native AIENOS authority) and #80 (a protocol
  revision candidate on refusal text).

[`STATUS.md`](STATUS.md) is the only place that says what is implemented, tested, conformant or
qualified. Nothing elsewhere in this repository claims more than `STATUS.md` does.

## Try it offline (no model, no GPU, no network)

```
cd rust && cargo run -q -p interplane-crossveil --example offline
```

A scripted model fetches a web page that carries an injected instruction, then "obeys" it by
asking to send an email, write a file and append a note. The reference pipeline with its mock
runtime denies the email and the write, holds the note for a person's approval (untrusted content
is in view) and executes none of them. The example checks this and exits 1 on any difference. The
Spark gate `INTERPLANE-RUST` runs it (see "Build and test").

To connect your own program, see [`docs/WRITING-AN-ADAPTER.md`](docs/WRITING-AN-ADAPTER.md) and its
runnable example `rust/crates/interplane-crossveil/examples/todo_adapter.rs` (run it from `rust/`
with `cargo run -q -p interplane-crossveil --example todo_adapter`): a to-do list host with its own
policy, an approval a person grants and one they decline.

## What is in the repository (version 0.3.0)

| Module | What it is | Status |
|---|---|---|
| **Core** | normative JSON Schemas (2020-12) for envelope, intent, capability, decision, result, event, catalog, selection, input record, probe report; versioning and error codes | see `STATUS.md` |
| **Lenshift** | model dialect parsers and result renderers: `openai`, `openai_stream`, `qwen35`, `aien_legacy`; `ajax` reserved | see `STATUS.md` |
| **Crossveil** | the authority-boundary contract: two runtime callbacks, a lifecycle with fail-closed invariants, trust classes | see `STATUS.md` |
| **CrossAxis** | explicit, versioned capability mapping; a deterministic domain selector with a before/after receipt; bounded expansion | see `STATUS.md` |
| **Interplane Probe** | measured capability qualification of an OpenAI-compatible endpoint | see `STATUS.md` |
| **Conformance** | 106 conformance cases plus 56 dialect fixtures; the Rust runner must reproduce the recorded verdicts byte for byte | see `STATUS.md` |
| Vectorveil | the envelope and canonical JSON; no transport framework | envelope only |
| RelayLine | the event vocabulary for multi-round exchanges | contract only |

The counts 106 and 56 are what `interplane-conformance` and `interplane-corpus validate` report on
main (see "Build and test").

## Layout

```
spec/            normative Markdown + spec/schemas/*.schema.json
rust/            Cargo workspace: interplane-core, -lenshift, -crossaxis, -crossveil, -conformance, -probe
dialects/        per-dialect fixtures (fixtures/) and recorded provider streams (replay/)
conformance/     canonical fixtures, recorded verdicts (expected/), trust corpus freeze
adapters/        aien/ reference adapter (depends on its host; Core never does); odysseus/ keeps catalog records only
examples/        receipt/ (before/after receipt); the offline and to-do examples are in rust/crates/interplane-crossveil/examples/
bench/           CrossAxis benchmark corpora, pre-registered protocols (0.2, 0.2x, 0.3), published runs (records only)
qualification/   real-model probe captures, evidence and reports
provenance/      companion manifest verifier, outside Core (ADR 0004)
docs/            reports (REPORT-*.md), PIPELINE.md, WRITING-AN-ADAPTER.md, plans, analysis
docs/adr/        decisions
tests/gates/     the Spark test gates and their one entry point, run.sh
.aien/           Spark pipeline settings: gates that always run, the bundle verification key
STATUS.md        what is implemented, tested, conformant or qualified
ROADMAP.md       the layers and where each stands
CHANGELOG.md     changes by version
CURRENT_STATE.md what the host projects' live code actually contained when this started
```

## Build and test

You need the Rust toolchain named in `rust-toolchain.toml` (1.99.0); `rustup` picks it up
automatically. From the repository root:

```
cd rust
cargo test --all
cargo run -q -p interplane-conformance --bin interplane-conformance -- ../conformance/fixtures --out /tmp/verdicts.json
cmp /tmp/verdicts.json ../conformance/expected/verdicts.json
cargo run -q -p interplane-conformance --bin interplane-corpus -- validate
```

The `cmp` line prints nothing when the verdicts match the recorded reference byte for byte.

Every pull request is tested on the DGX Spark, not on GitHub (see `docs/PIPELINE.md`). Each gate
is a file in `tests/gates/` and runs `tests/gates/run.sh <step>`; you can run a step yourself the
same way:

| Gate | Step | What it checks |
|---|---|---|
| `INTERPLANE-NO-PYTHON` | `no-python` | no Python file is tracked; runs on every change (`.aien/always`) |
| `INTERPLANE-SCHEMAS-AND-FIXTURES` | `schemas-and-fixtures` | schema self-check, then every fixture against the schemas |
| `INTERPLANE-RUST` | `rust` | fmt, clippy, all tests, both offline examples, the 106 verdicts equal `conformance/expected/verdicts.json` |
| `INTERPLANE-PACKAGE` | `package` | every crate packages and builds from its `.crate` file |
| `INTERPLANE-NEGATIVE-CONTROLS` | `negative-controls` | trust corpus digests, deliberately broken variants are detected, matrix equals the recorded one |
| `INTERPLANE-PROVENANCE` | `provenance` | the provenance verifier's tests and its six fixture verdicts |
| `INTERPLANE-ADAPTER-AIEN` | `adapter-aien` | the AIEN adapter and its T4 subset; needs the sibling checkouts `../aegis-runtime` and `../aien-protocols` |

For example, `tests/gates/run.sh no-python` prints `AIEN-OBS python_files_found false` and exits 0.

## Where the evidence lives

- `STATUS.md`: the state of every component, with the fixture or run that backs it.
- `docs/REPORT-*.md`: the published reports for 0.1, 0.2, 0.2x, 0.3 and the adapter reproduction.
- `bench/runs/`: the recorded benchmark and trust-gate runs.
- `qualification/`: real-model probe captures and reports (Qwen3.5-9B on Ollama, llama.cpp and SGLang).
- `adapters/aien/evidence/`: recorded runs of the AIEN adapter against a live AIEN daemon.
- [aien-dev/aien-receipts](https://github.com/aien-dev/aien-receipts/tree/main/interplane): the
  signed Spark test bundle for each tested commit.

## Removed adapters

Two Python adapters were removed on 2026-10-15 under the project rule that no Python ships here:

- `adapters/odysseus`: ran the Odysseus agent runtime as an INTERPLANE authority. It was the T3 runner
  of the closed 0.3 trust gate and the runtime of the 0.2 and 0.2x bench campaigns. Odysseus is a
  Python program, so the adapter could not move to Rust; its catalog records stay in
  `adapters/odysseus/` because the bench corpus and recorded runs cite them.
- `adapters/motus`: let a Lithos AI Motus agent (a Python framework) send its tool calls through
  INTERPLANE, using the AIEN authority through the `aien-authority-bridge` binary, which stays in
  `adapters/aien`.

The Rust AIEN adapter (`adapters/aien`) is the reference adapter. Both removed adapters remain in git
history (present through commit `43ec8f8`).

## Removed Python

No Python ships in this repository (project rule, 2026-10-15); the `INTERPLANE-NO-PYTHON` gate fails
if a Python file is tracked. The Python SDK (`python/`, package `interplane`) was a second
implementation of every SDK module, kept byte-identical to Rust by the tests of that time. It was
removed on 2026-10-15 and is in git history. Its last conformance verdicts and negative-control
matrix were byte-identical to the Rust ones and are kept as `conformance/expected/`; the
`INTERPLANE-RUST` and `INTERPLANE-NEGATIVE-CONTROLS` gates compare the Rust output against those
files.

## Security in one paragraph

The model side is untrusted. Lenshift never executes. CrossAxis never grants. A valid envelope
means "structurally understandable", never "authorized". A signature proves origin, never
authority. The runtime makes every authorization decision through its own policy engine; INTERPLANE
carries the decision and refuses to upgrade it. Denied never becomes authorized by retry.
To report a vulnerability, see [`SECURITY.md`](SECURITY.md).

## License

AGPL-3.0-or-later for the whole repository (`LICENSE`), the same license as the other AIEN
repositories. `adapters/aien` keeps its own copy of the same text. Releases published before
2026-10-19 were under Apache-2.0 and stay available under those terms; see
`docs/adr/0005-relicense-agpl.md`.
