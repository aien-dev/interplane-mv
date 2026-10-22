# L558 hardware domain, initial contract

Component-local design, NOT A MASTER PLAN. Base interplane b669d06.

Discovery describes typed, versioned interfaces. Omega expresses canonical intent;
CrossAxis maps it; Crossveil preserves the runtime decision; privileged Aienux
retains authorization and chipset-specific execution. FORGE realization ownership
is unchanged. Discovery is never permission. No hardware access occurs here.

The initial standards profile is deliberately narrow: AArch64, little endian,
4 KiB translation granule, architectural timer, GICv3 SPI intents, optional
SMMUv3 DMA isolation, explicit coherency, PSCI 1.0 SMC/HVC system off/reset.
Profile 1/version 1/vendor 0 describes a configured QEMU virt standards fixture,
not any real chip or QEMU default. Unknown versions, vendors and features refuse.
Physical targets are NOT_TESTED. No MMIO address is accepted.

Extend existing MappingTable, CapabilityRequest and Catalog using the hardware
namespace. omega/hardware/map.om is a new actual seed-built executable; existing
Rust/C sources remain external protocol/reference tests. The executable accepts
model intent on stdin and host-owned discovery on inherited fd 3. A runtime must
validate discovery provenance and freshness before opening that descriptor. A
model cannot supply or replace fd 3. Equality of generation/catalog digest binds
intent to that host snapshot; it is not signature verification. Missing trusted
input fails closed. Catalog digests keep existing JCS/SHA-256 meaning.

Native framing and refusal precedence are specified in omega/hardware/README.md.
The native program emits an existing CapabilityRequest and never an authorized
decision. Existing Crossveil is exercised against those actual native outputs.
The production Aienux discovery/authorization consumer remains pending L420 and
compiler FR-8; no source conversion/compiler work owned by L418/L408 is edited.
L551 bridge text owner is unchanged. No parallel authority or discovery service.

Acceptance: failing executable behavior tests before implementation; all five
capabilities; unsupported and hostile version/vendor/ISA/endianness/granule;
stale/forged discovery references, denied authority, raw MMIO, DMA bounds,
integer extremes, contradictory coherency; fragmented/truncated/trailing input;
compiled mutants; existing full gates in isolated target directory. Retain all
outcomes and exact commands. No hardware qualification claim.
