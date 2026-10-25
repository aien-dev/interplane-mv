# INTERPLANE (open interoperability protocol between AI models and agent runtimes)

> INTERPLANE defines the boundary between a model and the runtime that acts for it: model output is parsed into tool requests, the runtime decides each request with its own policy, and INTERPLANE carries the request and the decision across the boundary and refuses to upgrade a decision. This repository holds the normative protocol text and JSON Schemas, the Rust reference implementation, the conformance fixtures with their recorded verdicts, the AIEN reference adapter, and the benchmark and qualification records behind every published result.

Shared rules: read https://www.aienos.com/agents/RULES.md first. This file adds what is specific to this repository; where the two differ, this file wins here.

## Scope

- Applies to the whole repository.
- `spec/` and `spec/schemas/*.schema.json`: the normative protocol. `rust/`: the Cargo workspace with `interplane-core`, `-lenshift`, `-crossaxis`, `-crossveil`, `-conformance` and `-probe`.
- `conformance/` and `dialects/`: canonical fixtures and the recorded verdicts in `conformance/expected/`.
- `adapters/aien/`: the AIEN reference adapter. It depends on AIEN host projects and is AGPL-3.0-or-later with its own `LICENSE`; everything else is Apache-2.0. `adapters/odysseus/` keeps catalog records only.
- `provenance/`: the companion manifest verifier, a separate Cargo project outside Core (ADR 0004).
- `bench/` and `qualification/`: pre-registered protocols, recorded runs and real-model captures. These are records; do not rewrite them.
- `STATUS.md` is the only place that says what is implemented, tested, conformant or qualified.

## Installation

```bash
git clone https://github.com/aien-dev/interplane-mv.git
cd interplane-mv/rust
cargo build
```

`rust-toolchain.toml` pins Rust 1.99.0 with `clippy` and `rustfmt`; `rustup` installs it on first use. The gate script also uses `jq`. There is no Python and no package manager besides Cargo.

The AIEN adapter needs sibling checkouts of aegis-runtime and aien-protocols at the commits in `adapters/aien/PINS`. `adapters/aien/setup-siblings.sh [parent-dir]` clones them into `<parent>/interplane-audit/`, where `adapters/aien/Cargo.toml` expects them.

## Configuration

- `rust-toolchain.toml`: the exact toolchain for `rust/` and `adapters/aien/`.
- `adapters/aien/PINS`: the sibling repositories and commits the adapter builds against; `setup-siblings.sh` checks that the `Cargo.toml` revs agree with it.
- `interplane-probe` reads its endpoint credential from `INTERPLANE_PROBE_API_KEY`. It is sent only in a request header and never stored or printed.
- `.aien/always` lists the gates that run on every change; `.aien/unmapped-ok` lists the paths that need only those.
- `CARGO_TARGET_DIR` is honoured by `tests/gates/run.sh`.

## Usage

From `rust/`:

```bash
cargo test --all
cargo run -q -p interplane-conformance --bin interplane-conformance -- ../conformance/fixtures --out /tmp/verdicts.json
cmp /tmp/verdicts.json ../conformance/expected/verdicts.json
cargo run -q -p interplane-conformance --bin interplane-corpus -- validate

# Offline examples; each checks its own story and exits 1 on any difference
cargo run -q -p interplane-crossveil --example offline
cargo run -q -p interplane-crossveil --example todo_adapter
```

The `cmp` line prints nothing when the verdicts match the recorded reference byte for byte.

Every Spark gate is `tests/gates/run.sh <step>`, run from the repository root:

| Step | What it checks |
|---|---|
| `no-python` | no Python file is tracked (always runs) |
| `schemas-and-fixtures` | schema self-check, then every fixture against the schemas |
| `rust` | fmt, clippy `-D warnings`, all tests, both examples, the 106 verdicts equal the recorded file |
| `package` | every crate packages and builds from its `.crate` file (offline, from the local registry cache) |
| `negative-controls` | trust corpus digests, broken variants are detected, matrix equals the recorded one |
| `provenance` | the provenance verifier's fmt, clippy, tests and its six fixture verdicts |
| `adapter-aien` | the AIEN adapter and its T4 subset; needs `../aegis-runtime` and `../aien-protocols` beside the checkout |

`interplane-probe` (`cargo run -q -p interplane-probe -- --endpoint <url> --model <id> --out probe-report.json`) qualifies a live OpenAI-compatible model endpoint. It needs a running model server; the `qualification` workflow runs it on a self-hosted runner by manual dispatch only.

## Conventions

- Small conventional commits (`feat(core): ...`, `test(conformance): ...`), one conceptual layer per pull request (`CONTRIBUTING.md`).
- Schemas and fixtures are normative. A change that alters an expected fixture outcome is a protocol change: it needs a `CHANGELOG.md` entry and, during 0.x, a MINOR bump.
- The Rust conformance verdicts and the negative-control matrix must equal `conformance/expected/` byte for byte. A change that alters them updates those files in the same pull request.
- Every protocol object needs positive, negative, round-trip, version, unknown-field and malformed-input tests. Every dialect needs real fixtures; model-dependent tests are integration tests, off by default.
- No Python anywhere; the `INTERPLANE-NO-PYTHON` gate fails if a Python file or a Python shebang is tracked.
- No execution authority in Core, no host-project dependency in Core, no serving-engine dependency anywhere. Pipeline libraries never mention the negative controls.
- Update `STATUS.md` in the same pull request as the code it describes, and never claim more elsewhere than `STATUS.md` does.
- Pre-registered protocols in `bench/` are fixed before their runs; report a failed gate as failed.

## Safety and approvals

- The model side is untrusted. Lenshift never executes, CrossAxis never grants, a valid envelope is never an authorization, and a signature proves origin, never authority. Do not weaken any of these.
- Fail closed on unknown decisions, versions and dialects, on oversized or malformed arguments, duplicate request ids and replayed messages. Never log secrets and never persist raw model output by default (`SECURITY.md`).
- Report vulnerabilities privately through GitHub Security Advisories, not in a public issue.
- The DGX Spark is the test judge (`docs/PIPELINE.md`); pull request checks on GitHub are advisory. A change to `.aien/`, `tests/gates/` or `.github/workflows/` is `BLOCKED_OPERATOR` and runs only when the operator starts it; ask before touching those paths.
- Do not run `interplane-probe` or the `qualification` workflow against an endpoint you were not given, and never commit an API key.
- Work on a branch and merge through a pull request; `docs/PIPELINE.md` explains the `ready-to-merge` label.

## Further reading

- `README.md`: overview, layout and the build and test steps.
- `CONTRIBUTING.md` and `SECURITY.md`: contribution and reporting rules; this file does not override them.
- `STATUS.md`, `ROADMAP.md`, `CHANGELOG.md`: what is done, what is planned, what changed.
- `docs/WRITING-AN-ADAPTER.md`: how to connect a runtime.
- `docs/PIPELINE.md`: how the Spark gates test and merge a pull request.
- `docs/adr/`: decisions 0001 to 0004.
- https://interplane.io: the public site, built from aien-dev/interplane.io.
