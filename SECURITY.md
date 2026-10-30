# Security policy

INTERPLANE is an interoperability protocol, not a permission system. If you find a way for a valid
INTERPLANE message, signature, retry, replay or dialect quirk to cause execution without an
explicit runtime `authorized` decision, that is a vulnerability in INTERPLANE.

## Reporting a vulnerability

Report privately. Do not open a public issue, pull request or discussion about it.

1. GitHub: open this repository's Security tab and choose "Report a vulnerability". This
   creates a private advisory that only the maintainers can see. If that option is not shown,
   private vulnerability reporting has not been enabled for this repository yet; use email.
2. Email: drake@aienos.com with the subject `[interplane-mv] security report`.

Include the commit or release you tested, the component (path), steps to reproduce, and what an
attacker gains. If the report involves a secret, say where it was exposed and do not send the
secret itself. Encrypted mail is not required; do not post proof-of-concept payloads publicly.

## Response targets

This project has one maintainer; the targets below are best effort and stated honestly.

- Acknowledgement: within 3 working days.
- Triage and severity: within 7 days of acknowledgement.
- Fix or mitigation for confirmed issues: aim for 30 days for high and critical, 90 days
  otherwise, with a status update at least every 14 days until closed.
- Disclosure: coordinated. An advisory is published with credit (unless you ask otherwise)
  once the fix is on the default branch. Default embargo 90 days, negotiable.

## Scope

Rules the reference implementations enforce and the conformance suite tests: fail closed on
unknown decisions, unknown versions, unknown dialects, oversized or malformed arguments, duplicate
request ids and replayed messages; never log secrets; never persist raw model output by default.
A way around any of these is in scope. In particular:

- A Lenshift dialect parser (`rust/crates/interplane-lenshift/`) that turns model output into a
  request the model did not express, or accepts an incomplete stream.
- A path in Crossveil (`rust/crates/interplane-crossveil/`) or CrossAxis
  (`rust/crates/interplane-crossaxis/`) that upgrades a decision, grants a capability, or continues
  an approval with an id the runtime did not mint for that request.
- A valid envelope or signature treated as authorization (a signature proves origin, never
  authority).
- The AIEN reference adapter (`adapters/aien/`) writing outside its confined sink or executing
  without the host's authorization.
- `interplane-probe` storing or printing `INTERPLANE_PROBE_API_KEY`.
- A workflow in `.github/workflows/` that runs untrusted pull request code with a write token or a
  secret.

Out of scope: vulnerabilities in a host runtime's own policy belong to that project (Odysseus: its
SECURITY.md; AIEN: aien-dev). Model behaviour itself, and records under `bench/` and
`qualification/`, are not vulnerabilities in INTERPLANE.

## Supported versions

Only the default branch `main` (workspace version 0.3.0, pre-1.0); there is no release. Reports
against older commits are welcome but fixes land on the default branch only.

## Status

Pre-1.0. `STATUS.md` is the only place that says what is implemented, tested, conformant or
qualified. The DGX Spark is the test judge; pull request checks on GitHub are advisory. There is no
certification and no bug bounty. See AUDIT_SCOPE.md for what to review and how to build and test
it.
