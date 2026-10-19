# ADR 0005: Relicense to AGPL-3.0-or-later

Status: Accepted (2026-10-19). Supersedes ADR 0002.

Context: ADR 0002 put the protocol, schemas, fixtures, Rust crates, examples and probe under
Apache-2.0 so that any runtime, proprietary ones included, could adopt INTERPLANE without license
friction. Every other AIEN repository is AGPL-3.0-or-later, and this one was the odd one out.

Decision: the whole repository is AGPL-3.0-or-later (`LICENSE`, the same text as the other AIEN
repositories). The Rust workspace, `provenance/` and the `rsi_dashes` fixture now declare
`AGPL-3.0-or-later`. `adapters/aien` already did and keeps its own copy of the license text.

Consequences:

- The copyright holders (Drake Stapleton and the aien-spark / aien-dev accounts) are the only
  contributors, so no one else's consent was needed.
- Copies of INTERPLANE published before this change remain available under Apache-2.0. Only new
  work is under AGPL.
- A proprietary runtime that wants to embed Core now needs to comply with the AGPL or ask for a
  separate license. That is the trade ADR 0002 avoided and this decision accepts.
- Third-party material keeps its own license (the Qwen3.5 chat template under
  `qualification/evidence/` is Apache-2.0 and is not relicensed).
