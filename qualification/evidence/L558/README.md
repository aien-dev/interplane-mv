# L558 executable acceptance receipts

**PASS, host contract scope; independent review pending.** All physical targets
NOT_TESTED. QEMU guest execution NOT_RUN. Production Aienux consumer pending.
The initial branch milestone is 87a995724811b306be6d399cf10a680cdd2c3205.
Final source and branch commits are recorded in the L558 handoff and PR desk.

| Command | Exit | Result / receipt |
|---|---:|---|
| `bash tests/hardware/build.sh --birth` | 0 | Seed0 -> hex1 -> asm2 -> om4 -> omc exact fixpoint; seed-birth.log |
| `bash tests/hardware/verify.sh` | 0 | All native acceptance, transport, mutants, reference fmt/clippy and Crossveil; verify.log |
| `node tests/hardware/acceptance.mjs` | 0 | 3462 executed cases; acceptance.json has per-case exit/stdout hash/stderr and source/executable hashes |
| `node tests/hardware/transport.mjs` | 0 | 9 cases; transport.json and native-syscalls.log |
| `node tests/hardware/mutants.mjs` | 0 | 5 valid ELF mutants compiled, all caught by behavior assertions; mutants.json and per-mutant logs |
| `CARGO_TARGET_DIR=$PWD/target/L558/reference quiet-build cargo run -q --offline --locked --manifest-path tests/hardware/reference/Cargo.toml` | 0 | 35 existing CrossAxis/Crossveil checks; reference-final.log (includes forged model-side grant/approval/verified hints) |
| `CARGO_TARGET_DIR=$PWD/target/L558/reference quiet-build cargo clippy --offline --locked --manifest-path tests/hardware/reference/Cargo.toml -- -D warnings` | 0 | External test reference; reference-clippy.log |
| `bash tests/hardware/existing.sh` | 0 | All 7 unchanged gates; existing.tsv, existing-run.log and existing/*.log |

Existing gates all exit 0: no-python, schemas-and-fixtures, rust, package,
negative-controls, provenance, adapter-aien. Rust covers fmt/clippy, full tests,
negative-control feature, offline examples, **106/106** exact conformance verdicts.
Adapter covers **32/32** T4 cases, zero violations. Their input production source
was unchanged from base b669d06; new Omega code has its separate executable gate.
Target directories are isolated under target/L558. No GPU/model/service access.

Native coverage: five canonical operations; all 256 spellings for 13 discovery
enums; interface-version/vendor/profile refusal; ISA/endian/granule/features;
stale/future/zero generation and forged/zero catalog refs; incoherent interface
claims; raw MMIO; DMA isolation/length/alignment/handle bounds; timer overflow;
power identifier/address refusal; u32/u64 extremes and decimal serialization;
truncation/trailing bytes/reserved fields; fragmented pipes, missing host fd3,
child-only injected EINTR/read EIO/write EIO; observed normal syscall set
execve/read/write/exit. No tracing of another process or device was performed.

Compiled mutants remove digest binding, DMA isolation, timer upper bound,
coherency consistency or vendor checking. Each compiles into nonempty ELF and
passes the five ordinary positive cases before a hostile case kills it. No
compiler failure/crash/timeout is counted as detection. 35 protocol checks cover
all five actual native outputs against existing MappingTable and Crossveil
(denied, approval hold, unknown decision, replay, stale catalog). Test runtime
never executes a hardware effect. It supplies decisions; it is not an Aienux
implementation or a new policy engine.

## Failures retained

Tests were written and run before native source: red.log exit1 for missing ELF.
compile.log exit8 records unsupported explicit bound 1000000 (qualified compiler
requires <=999999; omitted bound has existing default1000000).
compile-2.log exit0 was followed by valid-case refusal20 due a wrong handwritten
magic constant. Corrected against actual ASCII byte encoding; compile-3.log exit0.
reference-red.log exit101 caught the test fixture using whole-catalog hashing
instead of existing Core's sorted name/schema digest-pair semantics. Corrected
fixtures preserve the existing protocol digest. No assertions, bounds, thresholds,
gates or test cases were removed to get green.

Current full source/executable/compiler hashes are in build.txt and acceptance.json.
Seed source 29b12760f4c962606411d6bf25032aedef063301; exact compiler hash
191b776ef98821597c3e30655da6d680a9b66edbc9ceaca3c39c61ea6df098e9.
The SHA-256 birth chain is retained in lineage.json. Only documentation/test
reference code uses Rust/Node/shell; production mapper is handwritten Omega.
