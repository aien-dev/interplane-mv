# Audit scope

Written for an outside, independent security audit. Revision described:
`1de1b0065b2e667d8d7a23ffc3d75aeb65bf864b` on `main`, 2026-10-26. Everything below is taken from
the repository's own files at that revision; items marked NOT_RUN were not executed while writing
this document.

## What this repository is

INTERPLANE is an open interoperability protocol between AI models and agent runtimes. Model output
is parsed into tool requests, the runtime decides each request with its own policy, and INTERPLANE
carries the request and the decision across the boundary and refuses to upgrade a decision. The
repository holds normative Markdown and JSON Schemas (`spec/`), a Rust reference implementation
(`rust/`), conformance fixtures with recorded verdicts, the AIEN reference adapter (AGPL-3.0-or-later,
`adapters/aien/`), a provenance verifier (`provenance/`), and benchmark and qualification records.
No Python ships. Status: version 0.3.0, pre-1.0; `STATUS.md` is the only place that states what is
implemented, tested, conformant or qualified.

## What to review, in priority order

1. `rust/crates/interplane-crossveil/`. The authority-boundary contract: two runtime callbacks, a
   lifecycle with fail-closed invariants, trust classes, the input ledger and exposure, approval
   continuation (only the runtime-minted `approval_id` for that request; expiry, cancel, replay and
   restart refusals), and session limits (`tests/session_limits.rs`). Check that no path executes
   without an explicit `authorized` decision.
2. `rust/crates/interplane-lenshift/`. Dialect parsers for untrusted model output (`openai`,
   `openai_stream`, `qwen35`, `aien_legacy`). Check size limits, malformed input, incomplete SSE
   streams (must be rejected), and unknown dialects.
3. `rust/crates/interplane-core/`. Schemas, types, validation, JCS canonical JSON, versioning,
   duplicate request ids and replay detection.
4. `rust/crates/interplane-crossaxis/`. Capability mapping, stale-digest refusal, the domain
   selector and bounded expansion. Check it never grants authority.
5. `adapters/aien/`. Reference adapter against the AIEN host: write sink confined with pinned
   directory descriptors and atomic replacement (SECNET-01), bounded records and correlation state
   (SECNET-05), approval tests in `adapters/aien/tests/approval.rs`.
6. `rust/crates/interplane-probe/`. Sends requests to a live OpenAI-compatible endpoint with
   `INTERPLANE_PROBE_API_KEY` in a header only; check it never stores or prints the key.
7. `provenance/`. Companion manifest verifier outside Core (ADR 0004).
8. `.github/workflows/aien-verification.yml`. Runs on `pull_request` and push with
   `permissions: contents: read`; takes trust anchors (`.aien/verify.pub`) from `origin/main`, not
   from the head; builds only the pinned verifier tools (`crumb` from aien-architecture
   `d0f0b95d...`, `aien-test` from aien-sovereign-core `a51042b6...`) outside the tree under test;
   on `alpha/*` tags it fetches and verifies the signed Spark bundle. Actions are pinned by commit
   sha. Check that candidate code cannot influence the verifier build or the trust anchors.
9. `.github/workflows/qualification.yml`. Manual `workflow_dispatch` only, runs on a self-hosted
   runner with the `INTERPLANE_PROBE_API_KEY` secret; dispatch inputs are passed as environment
   variables, not shell source. Check input handling and secret exposure.
10. `tests/gates/run.sh` and `tests/gates/*.gate`. The Spark gate entry point.

## Trust boundaries

- Untrusted: the model side and everything it produces (dialect text, streams, tool requests);
  content a model reads (web pages, documents, skills, tool descriptions are `external_untrusted`);
  pull request content; workflow dispatch inputs.
- Trusted: the host runtime's policy and its decisions; the Spark signing key whose public half is
  `.aien/verify.pub` on `main`; the pinned toolchain (`rust-toolchain.toml`, Rust 1.99.0) and sibling
  pins in `adapters/aien/PINS`.
- Core has no execution authority and no host-project dependency (AGENTS.md).

## Threat model summary

- Assets: the runtime's authority over execution; approval correlation; secrets in requests;
  integrity of recorded verdicts and published bundles.
- Attackers considered: a hostile or prompt-injected model; injected instructions inside tool
  results; replayed or forged messages and approval ids; malformed or oversized arguments; a
  malicious pull request against CI.
- Defended: fail closed on unknown decisions, versions and dialects, on oversized or malformed
  arguments, duplicate request ids and replayed messages; never log secrets; never persist raw
  model output by default; a valid envelope is never an authorization.
- Not defended / explicitly out of scope: a host runtime's own policy errors; model correctness;
  the 2026-10-26 SECNET hardening is described in `STATUS.md` as tested implementation changes, not
  deployment or model/backend qualification; 0.4 and 0.5 are planned, not built.

## Build from source at a pin

`rust-toolchain.toml` pins Rust 1.99.0 with `clippy` and `rustfmt`. Gates also use `jq`.

```sh
git clone https://github.com/aien-dev/interplane-mv.git
cd interplane-mv/rust
cargo build
```

The AIEN adapter needs sibling checkouts at the commits in `adapters/aien/PINS` (aegis-runtime
`f4e870953a466bb1cf68f1d88285929024cf1ba9`, aien-protocols
`3a4cdbe8d360a2e1ddb3e8b108684048b9d4ba10`, sovereign-core `9b5e6e82359f4ad6b6f03042e83ef6411c5f15ce`);
`adapters/aien/setup-siblings.sh [parent-dir]` clones them. Everything builds on a plain Linux host.

## Run every test

From `rust/`:

```sh
cargo test --all
cargo run -q -p interplane-conformance --bin interplane-conformance -- ../conformance/fixtures --out /tmp/verdicts.json
cmp /tmp/verdicts.json ../conformance/expected/verdicts.json
cargo run -q -p interplane-conformance --bin interplane-corpus -- validate
cargo run -q -p interplane-crossveil --example offline
cargo run -q -p interplane-crossveil --example todo_adapter
```

From the repository root, the Spark gates:

```sh
tests/gates/run.sh no-python
tests/gates/run.sh schemas-and-fixtures
tests/gates/run.sh rust
tests/gates/run.sh package
tests/gates/run.sh negative-controls
tests/gates/run.sh provenance
tests/gates/run.sh adapter-aien
```

- The `cmp` prints nothing when the 106 verdicts match byte for byte.
- `no-python` prints `AIEN-OBS python_files_found false` and exits 0.
- `adapter-aien` needs `../aegis-runtime` and `../aien-protocols` beside the checkout.
- The DGX Spark is the test judge (`docs/PIPELINE.md`); it runs these gates and signs a bundle.
  GitHub checks are advisory. The signed bundle run is NOT_RUN on a plain host.
- `interplane-probe` needs a live model endpoint and a key. NOT_RUN on a plain host.

All of the above: NOT_RUN while writing this document.

## Known limitations and NOT_RUN

- Pre-1.0; Vectorveil is envelope only and RelayLine is contract only; Lenshift `ajax` is reserved.
- The AIEN adapter is AGPL-3.0-or-later, links host crates, and its status is "tested" with verdict
  `PASS_LABELLED_INCOMPLETE` for the fix-the-test slice (`STATUS.md`).
- 0.2 closed with its pre-registered gate failed and published (`docs/REPORT-0.2.md`).
- A head that changes `.aien/`, `tests/gates/` or `.github/workflows/` is `BLOCKED_OPERATOR`: the
  Spark worker does not run it on its own; the operator runs it by hand.
- The workflow's `REPO_SLUG` is `aien-dev/interplane` while this repository is
  `aien-dev/interplane-mv`; whether GitHub redirects this for bundle verification is unknown from
  the repository.

## Dependencies and provenance

- Lockfiles: `rust/Cargo.lock`, `adapters/aien/Cargo.lock`, `provenance/Cargo.lock`, plus two
  fixture lockfiles. Reproducibility pins in `docs/RUN-MANIFEST-COMMITS.md`.
- Licences: Apache-2.0 except `adapters/aien/` (AGPL-3.0-or-later, own `LICENSE`).
- Recorded provider streams (Ollama, llama.cpp, SGLang) and Qwen3.5-9B captures are fixtures and
  records; they do not ship.
- External services: crates.io for Cargo; GitHub for sibling clones; a model endpoint only for the
  probe. GitHub Actions used: `actions/checkout`, `actions/cache`, `actions/upload-artifact`,
  `dtolnay/rust-toolchain`, all pinned by sha.

## Evidence

- `STATUS.md`, `docs/REPORT-*.md`, `bench/runs/`, `qualification/`, `adapters/aien/evidence/`. These
  are records; AGENTS.md says do not rewrite them.
- Signed Spark test bundles: `aien-dev/aien-receipts` at `interplane/<commit>/bundle.json`.
  Receipts are append-only and never edited.
