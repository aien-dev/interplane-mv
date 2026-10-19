# INTERPLANE Rust reference implementation (workspace version 0.3.0)

Six crates, minimal dependencies (serde, serde_json, sha2, regex, thiserror; the probe adds ureq,
and the conformance crate's default `schema-check` feature adds jsonschema). No async runtime.
Since 2026-10-15 this is the only implementation; the Python SDK was removed (see the root
README).

- `interplane-core`: wire types, JCS canonical JSON and digests, envelope validation, request ledger, lifecycle state machine.
- `interplane-lenshift`: dialect parsers (`openai`, `openai_stream`, `qwen35`, `aien_legacy`; `ajax` reserved) that turn model output into tool requests.
- `interplane-crossaxis`: mapping tables, argument coercion, capability selection and measurement.
- `interplane-crossveil`: the admission pipeline (fails closed) and the mock runtime. Examples: `offline` and `todo_adapter`.
- `interplane-conformance`: two binaries. `interplane-conformance` runs `conformance/fixtures` and writes verdicts; `interplane-corpus` checks schemas and fixtures, freezes `TRUST-DIGEST.txt` and computes adapter subsets. The library module `adapter_runner` judges a new adapter.
- `interplane-probe`: qualifies an OpenAI-compatible endpoint with measured probes.

Run these from this directory (`rust/`):

```
cargo test --all
cargo run -q -p interplane-conformance --bin interplane-conformance -- ../conformance/fixtures --out /tmp/verdicts.json
cargo run -q -p interplane-conformance --bin interplane-corpus -- validate
cargo run -q -p interplane-crossveil --example offline
INTERPLANE_PROBE_API_KEY=... cargo run -p interplane-probe -- --endpoint http://host:8000 --model M --out report.json --skip context
```

The conformance crate has two binaries, so `cargo run -p interplane-conformance` needs `--bin`.
The probe key is read from the environment only; it is never printed or written to the report.
The full check the Spark runs on every change is `tests/gates/run.sh rust` from the repository
root.
