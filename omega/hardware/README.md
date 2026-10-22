# Seeded Omega hardware mapping, L558

This executable validates hardware intent and emits the existing Interplane
`CapabilityRequest`. It does no hardware I/O and grants no authority. Production
Aienux consumer integration is pending; this is a runnable additive entrypoint,
not replacement of the existing AIEN bridge or L418/L420 language migration.

Build from the pinned seed in an isolated directory on Linux AArch64:

```
bash tests/hardware/build.sh --birth
node tests/hardware/acceptance.mjs
```

`--birth` requires the local `../omega-in-omega` object store (or `OMEGA_REPO`),
and refuses to overwrite an existing seed extraction. Subsequent builds use
`bash tests/hardware/build.sh`. `OMC=/path/to/qualified/omc` can supply a previously
built compiler; its exact SHA-256 is always checked. No C/Rust compiler builds
the production program. Seed source: `29b12760f4c962606411d6bf25032aedef063301`;
seed0 hex -> seed0 -> hex1 -> asm2 -> om4 -> omc fixpoint. Birth/build evidence
is in `qualification/evidence/L558`. No first-party compiler-owner files edited.

Run the executable directly, with finite binary input files:

```
target/L558/hardware-map < intent.bin 3< discovery.bin
```

The host passes discovery on fd 3 after verifying provenance through its own
trusted discovery provider. stdin is untrusted model intent. **The process,
fd 3 and snapshot generation are a trusted-host boundary.** This program does
not verify a firmware signature, read physical discovery registers, or defend
against a host that lies. A model-supplied `verified=true` field has no channel
here. A host must allocate a new nonzero generation whenever any discovery fact
or catalog changes, prevent generation reuse across restart, and recheck the
binding at authorization/execution to prevent replacement races. Both input
channels must close after one frame; this one-shot protocol is not a service.
The caller must bound runtime and bytes and discard ALL stdout on nonzero exit.

## Frame, version 1

Two exact 96-byte records, all multibyte integers unsigned little endian.
Reserved bytes must be zero. Unknown fields have explicit enum 0 but this first
profile refuses unknown required facts. Flags are protocol enums, not hardware
register encodings. Limits below are policy/profile limits, not silicon limits.

| Offset | Model intent (stdin) | Trusted discovery (fd 3) |
|---|---|---|
| 0..3 | ASCII HWI1 | ASCII HWD1 |
| 4 | Interface version 1 | Interface version 1 |
| 5 | Operation 1..5 | Profile 1: QEMU virt standards fixture |
| 6 | ISA 1: AArch64 | Profile version 1 |
| 7 | Endian 1: little | Vendor 0: standards-only |
| 8 | Granule 1: 4 KiB | ISA 1: AArch64 |
| 9 | Required CPU features, bit 0: FEAT_LSE | Endian 1: little |
| 10 | Reserved | Granule 1: 4 KiB |
| 11 | Reserved | Known CPU features, bit 0: FEAT_LSE; other bits refused |
| 12..15 | Identifier u32 | 12 timer 1: Arm generic timer; 13 GIC 3; 14 IOMMU 0 unknown/absent or 3 SMMUv3; 15 DMA coherence 0 unknown, 1 explicit noncoherent/cache-maintenance-required, 2 coherent |
| 16..23 | Operation value u64 | 16 firmware 1: PSCI 1.0; 17 conduit 1: SMC, 2: HVC; 18..23 reserved |
| 24..31 | Expected discovery generation u64 | Immutable host generation u64, nonzero |
| 32..63 | Expected catalog digest, 32 raw bytes | Host catalog digest, 32 raw bytes, nonzero |
| 64..71 | Request sequence u64, nonzero | Reserved |
| 72..95 | Reserved | Reserved |

Catalog digest follows **existing Core `Catalog.compute_digest`**: SHA-256 over
JCS of sorted `[capability name, parameter-schema digest]` pairs. It is not a
hash of the catalog JSON file and is not a signature. Generation binds the full
host discovery facts; the digest binds the schemas. Both must match.

## Canonical capability mapping

The names and renames use existing CrossAxis `MappingTable` without passthrough.
`catalog.json` and `mapping.json` are existing protocol types, not a new JSON
wrapper protocol. All arguments are typed: `identifier`, `required_features`, `value` integers and
`discovery_generation` decimal string (preserves all u64 values in JSON).
The request id is `hw-<sequence>`. Canonical namespace is `hardware`; names may
contain dots. Existing JSON-envelope admission supports those names. The current
OpenAI name splitter cannot split a multi-dot namespace/name; production dialect
integration must use canonical ToolRef/envelope admission, not guess a split.

| Operation | Canonical name | Runtime name | Identifier / value |
|---|---|---|---|
| 1 | cpu.discover | hw_cpu_discover | 0 / 0, required CPU features must be a subset |
| 2 | timer.arm | hw_timer_arm | 0 / 1..2147483647 ticks, counter frequency is host-owned and not inferred |
| 3 | interrupt.bind | hw_interrupt_bind | GICv3 SPI INTID 32..1019 / 0; excludes SGI/PPI/special/LPI |
| 4 | dma.map | hw_dma_map | Opaque host device handle 0..65535 / 4096..1048576 bytes, multiple of 4096; requires SMMUv3 isolation and explicit coherence |
| 5 | power.request | hw_power_request | 1 system off or 2 system reset / 0; preserves PSCI 1.0 and conduit |

DMA handles are not SIDs, IOVAs, physical addresses or access rights. Mapping
carries an intent only; runtime must check buffer ownership, IOMMU attachment,
cache ownership transitions, lifetime and teardown. Noncoherent mapping requires
host cache maintenance before/after DMA. No CPU_ON entry address or vendor
firmware function ID is accepted. Power/IRQ/timer calls remain privileged host
effects, each requiring a fresh decision. ISA and firmware and vendor-device
contracts remain separate. All physical boards: **NOT_TESTED**.

Refusal precedence: frame/magic/reserved (20), interface version (21),
profile/version/vendor (22), ISA/endian/granule/feature subset (23),
generation/digest binding (24), interface/coherency consistency (25),
unknown operation including raw MMIO (26), argument/id/range (27),
DMA isolation missing (28). stderr is `hardware refusal N\n`, exit N, no stdout.
Output I/O failure exits 29, possibly after partial output; a caller must discard
it. Input EINTR is retried, input short reads are assembled, read errors refuse.
Coherent DMA with no IOMMU is deliberately refused by this narrow profile even
though some physical systems support that combination safely under other policy.

## Integration and qualification still required

The external test reference reconstructs the same canonical intent from actual
native executable output, proves existing CrossAxis produces an identical
CapabilityRequest and uses existing Crossveil to deny, hold, refuse unknown
decisions and block stale catalogs/replays. This is HOST-TESTED protocol evidence,
not a privileged Aienux adapter or physical discovery/driver qualification.
FR-8 (privileged/MMIO words), L420 kernel migration, host-only trusted discovery,
immutable-generation storage and native consumer integration remain their owners'
work. No new compiler feature is required for this bounded mapper. Production
interrupt, DMA, power and timer handlers, timeouts, revocation/lifecycle and
board-specific providers require separate executable/hardware acceptance.

Run the complete native acceptance and protocol-reference checks with:

```
bash tests/hardware/verify.sh
```

The external reference is test infrastructure only; production execution is the
seed-built ELF. The command executes native cases before consuming their outputs.
`node tests/hardware/acceptance.mjs` refreshes those outputs on every run; checked
JSON files alone are not an executable acceptance result. Run all existing gates
with `bash tests/hardware/existing.sh`; every exit is retained, including failures.
This requires the same offline Rust cache/sibling pins as the existing gates.
The new native gate is an explicit command pending compiler distribution into
the shared Spark test runner; no existing gate or required check was weakened.

Final L558 acceptance: 3462 native behavior cases, 9 transport/fault cases,
5 compiled mutants detected, 35 existing mapping/authority checks, 7 existing
gates PASS. See [evidence](../../qualification/evidence/L558/README.md).
Source coverage and physical gaps: [coverage](../../docs/hardware/COVERAGE.md).

`fixtures.json` retains exact hex input records for all five operations and their
shared synthetic discovery. It is ordinary contract test data, not a physical
discovery receipt. `mapping.json` is a template: the host must pin its
`catalog_digest` to the verified catalog before use. The external reference tests
do so and compare it with the native output's digest using existing Core rules.
