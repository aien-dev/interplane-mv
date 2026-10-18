# INTERPLANE Rust reference implementation (workspace version 0.3.0)

Six crates, minimal dependencies (serde, serde_json, sha2, regex, thiserror; the probe adds ureq, and the conformance crate's default `schema-check` feature adds jsonschema). No async runtime. Since 2026-10-15 this is the only implementation; the Python SDK was removed (see the root README).

- `interplane-core`: wire types, JCS canonical JSON and digests, envelope validation, request ledger, lifecycle state machine.
- `interplane-lenshift`: dialect parsers (`openai`, `openai_stream`, `qwen35`, `aien_legacy`; `ajax` reserved) that turn model output into tool requests.
- `interplane-crossaxis`: mapping tables, argument coercion, capability selection and measurement.
- `interplane-crossveil`: the admission pipeline (fails closed) and the mock runtime.
- `interplane-conformance`: runs `conformance/fixtures` and writes verdicts; its `interplane-corpus` tool checks schemas and fixtures, freezes `TRUST-DIGEST.txt` and computes adapter subsets; `adapter_runner` judges a new adapter.
- `interplane-probe`: qualifies an OpenAI-compatible endpoint with measured probes.

```
cargo test --offline
cargo run -p interplane-conformance -- ../conformance/fixtures --out /tmp/verdicts.json
INTERPLANE_PROBE_API_KEY=... cargo run -p interplane-probe -- --endpoint http://host:8000 --model M --out report.json --skip context
```

The probe key is read from the environment only; it is never printed or written to the report.
