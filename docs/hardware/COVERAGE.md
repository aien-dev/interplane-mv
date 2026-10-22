# Arm interface coverage and qualification boundaries

L558 implements an initial **hardware intent domain** in handwritten seeded
Omega. It validates a configured standards fixture and maps five capabilities.
It does not claim that existing Interplane adapters unify chipsets. All physical
targets here are **NOT_TESTED / HARDWARE-UNTESTED**. QEMU guest execution is also
NOT_RUN in L558; HOST-TESTED means the native Linux AArch64 mapper was executed.

L557's research is preserved under [research](research/L557-arm-interface-research.md),
with its [machine-readable matrix](research/L557-interface-matrix.json) and source
index. That matrix is a research inventory; its suggested Omega names are not
implemented identifiers. This implementation uses the existing Interplane
namespace/MappingTable mechanism. Seed `29b12760` has no hardware capability
registry or privileged instructions; no seeded registry was replaced or borrowed
from legacy C Omega. The new table is explicitly `hardware-1`.

[coverage.json](coverage.json) separates implemented contract semantics from
researched families. Source-backed declarations are not drivers, permission,
physical discovery, firmware support or qualification. Public documentation
cannot establish exhaustive coverage of proprietary interfaces.

| Platform | Implemented mapping | Boundary and next bounded check |
|---|---|---|
| QEMU virt standards fixture | CPU feature subset, timer, GICv3 SPI, SMMUv3/coherency, PSCI 1.0 intent | Synthetic declared facts only. Pin machine version/CPU/GIC/IOMMU/conduit; obtain guest firmware discovery via owner adapter and compare in QEMU before any device test. |
| Pi 5 BCM2712 / RP1 | No board profile accepted | RP1 sits behind PCIe and supplies board I/O. The RP1 document does not qualify BCM2712 CPU/firmware/IOMMU behavior. Next: audit saved board DT and exact RP1 driver dependencies, no live register probes. |
| Apple Silicon | No board profile accepted | Generational CPU, interrupt, DMA/IOMMU and firmware contracts require Apple-specific providers. Asahi coverage varies by generation. Next: select one SKU and audit its saved DT and upstream IRQ/DART drivers. Never map it to GIC/SMMU just from AArch64. |
| NVIDIA GB10 / Grace / Tegra | No board profile accepted | These are separate product/platform scopes. Grace/Vera documentation does not prove the complete GB10 peripheral ABI. GB10 full inventory UNKNOWN. Next: exact SKU firmware table archive plus driver-source inventory, owned by discovery/driver workers. |
| Qualcomm, MediaTek, Rockchip, Allwinner | No board profiles accepted | Upstream compatibles identify families; per-device controller/firmware details remain UNKNOWN for this implementation. Next: one selected SKU, one driver binding and dependency graph at a time. |
| NXP i.MX, TI K3 | No board profiles accepted | Family bindings are not complete register/message contracts; firmware endpoint/version UNKNOWN. Next: inspect selected SKU reference manual and firmware protocol docs, then saved topology. |
| Samsung Exynos | No board profile accepted | Direct evidence incomplete in L557, UNKNOWN. Its matrix cites Apple source [34] for this row; that citation does not support Exynos and must not be used as evidence. Next: retrieve exact Exynos binding and IRQ/DMA driver sources. |
| Ampere / Arm server class | No board profile accepted | SBSA/SBBR/ACPI describe standards classes, not a universal Ampere chip ABI. Next: exact platform ACPI/IORT/firmware tables and provider source audit. |

Additional researched interfaces: architectural MMU/TLB/cache/barriers and LSE;
DT/ACPI/UEFI; SMCCC, PSCI, SCMI, FF-A; GICv2/v3/v4 and ITS; SMMUv2/v3 and IORT;
AXI/ACE/CHI/APB; PCIe ECAM/MSI; virtio; PL011 and 16550; GPIO, I2C, SPI,
clock/reset/pinctrl/regulators; storage, Ethernet, display, camera/media, GPU/NPU.
Only the five narrow classes in `omega/hardware/README.md` have executable
mapping acceptance here. All other classes remain RESEARCH_ONLY or UNKNOWN.
AMBA fabric compatibility does not specify a software device API. Embedded GPU
RISC-V is not a system Arm interface; parked L556 system work stays separate.

## Verified initial constants and source receipts

Values 1/3 etc in the binary framing are **our versioned enums**, not encodings
read from system registers. GIC SPI bounds 32..1019 come from the IRQ driver's
range classification. PSCI semantic selectors 1/2 mean system off/reset, not the
PSCI function numbers. Timer/DMA byte limits and accepted granule are conservative
profile limits, not measurements or claims about architectural maximums.

- QEMU virt is a versioned virtual platform with configurable CPU, GIC and optional
  SMMUv3: [official QEMU docs](https://www.qemu.org/docs/master/system/arm/virt.html).
- SPI bounds and special interrupt exclusion: [Linux pinned GICv3 driver](https://github.com/torvalds/linux/blob/a1c2b1da93f5f612aa7a33190c4900c98e51f6da/drivers/irqchip/irq-gic-v3.c).
- CPU Atomic and granule ID fields: [Linux pinned arm64 register metadata](https://github.com/torvalds/linux/blob/a1c2b1da93f5f612aa7a33190c4900c98e51f6da/arch/arm64/tools/sysreg).
- PSCI versions and system off/reset selectors: [Linux pinned public PSCI definitions](https://github.com/torvalds/linux/blob/a1c2b1da93f5f612aa7a33190c4900c98e51f6da/include/uapi/linux/psci.h)
  and L557's Arm DEN0022D archive [Arm PSCI specification](https://documentation-service.arm.com/static/5f905c71f86e16515cdc1fd0).
- Arm SMMUv3 isolation architecture: [Arm IHI0070](https://documentation-service.arm.com/static/69ae9767e79f9a1d642aab2d).
- DMA ownership/coherency remains provider-specific: [Linux DMA API](https://www.kernel.org/doc/html/latest/core-api/dma-api-howto.html).

The L557 archive stays at `/home/drakestapleton/handoffs/L557-source-archive.tar.gz`;
its hash and the exact implementation-source retrieval hashes are in
`qualification/evidence/L558/sources.json`. Access failures are retained in L557's
research: candidate Linux firmware paths [10]-[12] returned 404; Arm spec sources
[37]-[39] supersede those paths for interface-family evidence. Source retrieval
alone does not qualify a runtime provider. No third-party implementation copied.
