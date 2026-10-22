# L557 — Arm chipset interface research for Interplane

**Purpose:** research handoff for Interplane as the chipset unifier, speaking seeded Omega. This is a systematic public-source inventory, not a claim that proprietary peripherals are all covered. No MMIO, reset, firmware update or service operation was attempted. `VERIFIED-SOURCE` denotes source-described contract, not silicon validation; `HARDWARE-UNTESTED` is explicitly untested; `UNKNOWN` means public evidence is inadequate.

## Bottom line

Arm A-profile ISA compatibility does not standardize SoC peripheral registers, clocks, resets, firmware protocols, interrupt wiring, DMA topology or multimedia engines. The architecture manual specifies execution/system architecture; AMBA specifications are hardware interconnect protocols, not software service APIs.[1][6][7] Interplane must normalize *discovered, authorized capabilities*, not pretend arbitrary MMIO blocks share an ABI.

Build an adapter stack: DT/ACPI/UEFI + PCI discovery → standard firmware/services (PSCI, SCMI, SMCCC, FF-A) → OS driver/provider-managed peripheral endpoints → Omega-typed capabilities. Seeded Omega is the schema/policy authority: inspect its existing registry/version before defining or mapping any capability. Match existing Omega identifiers; propose a schema extension if needed. Do not treat older C Omega or Rust models as authority. Unknown protocol/version or weaker security semantics should fail closed, not be guessed.[8][9][10][11][12]

## Contracts to preserve

- **CPU/core:** query architectural ID/feature state, topology, implemented ELs, translation regime, address widths/granules, cache properties, atomics, endian support and memory attributes. “Arm64” alone does not prove a feature or coherency. Preserve per-CPU scope and barriers/ordering semantics; distinguish normal memory, device MMIO and DMA ordering.[1]
- **Boot/discovery:** DT is a resource/topology graph; ACPI-on-Arm is for BSA/BBR/SBSA/SBBR-conforming platform classes; UEFI is a standard boot/runtime-services ABI, not a general peripheral control API. Preserve discovery provenance, source version, parent links, ranges, interrupt specifiers, clock/reset/power dependencies, DMA coherency and IOMMU references.[8][9][29][30]
- **Firmware/security:** SMCCC defines the SMC/HVC calling convention; PSCI is the standard CPU power/lifecycle API; SCMI provides negotiated system-management protocols; FF-A defines secure-partition/shared-memory messaging. Distinct versions, conduits and endpoint permissions matter. Firmware owns secure or privileged operations; Interplane must not replace a service call with raw register access.[5][37][38][39]
- **Interrupts/timers:** GICv2/v3/v4 are distinct architectural revisions; GICv3 has system-register CPU interface/redistributors; ITS routes device/event identifiers to LPIs; GICv4 adds virtual interrupt features. Firmware/platform descriptions define the actual topology/collections. Generic timer counter and per-EL event timers are architectural, but frequency, privilege/security, presence and IRQ routing are platform dependent.[2][3]
- **DMA/isolation:** SMMUv3 uses stream/substream identifiers, translation contexts and command/event queues; SMMUv2 is a different architecture. IORT (ACPI) or DT IOMMU maps describe topology. DMA coherency is a separate property. Model DMA domain, IOVA width, attach rights, cache maintenance, interrupt remapping, ownership and safe teardown; never infer coherence from ISA or fabric name.[4][8]
- **Fabric versus API:** AXI/ACE/CHI/APB define hardware-level transaction/interconnect behavior; they do not identify device functions or expose an OS ABI. APB is a peripheral bus; AXI/ACE/CHI include increasingly capable transaction/coherency semantics. Interplane should model device/service semantics, not “AXI access”.[6][7]
- **Peripheral boundaries:** device-tree bindings, ACPI, PCI class/spec, kernel drivers and firmware services are the OS-facing contract. PL011 and 16550 UARTs are not identical register ABIs. Virtio is a versioned transport/device ABI with negotiated feature bits and queues, especially suitable for virtual devices, not a universal physical peripheral API.[13][14][31][32]
- **Platform families:** RP1 demonstrates board I/O can live in a separate controller behind BCM2712 PCIe. Asahi documents generation-specific Apple silicon feature progress. NVIDIA Grace/Vera support guidance and upstream SoC bindings show separate vendor platform families; compatible strings discover/identify blocks, not cross-vendor register equivalence.[21]-[28][33]-[36]

## Interplane implementation contract

1. Start with the actual seeded Omega registry/schema, digest and version; map against it before introducing types. Treat alternative legacy Omega models as non-authoritative.
2. Recommended typed envelope: `{omega_capability_id, schema_version, provider_id, platform_id, device_path, discovery_source, source_version, resource_scope, privilege_domain, owner, rights, lifecycle, coherence, ordering, irq_model, dma_domain, power/reset dependencies, validation_level}`. Preserve raw facts/evidence pointers; unknown remains unknown.
3. Capability classes to reconcile with Omega (names are suggestions only): CPU features/topology; memory translation/ordering; timer counter/event; interrupt controller; DMA domain; firmware CPU power/system management/secure partition; PCI device; serial console; storage/network; GPIO/I2C/SPI; clock/reset/power/pinctrl/regulator; display/camera/media/GPU/NPU.
4. Discovery adapters: DT + schema validation, ACPI/UEFI, PCI config/ECAM and MSI domains, firmware endpoint/version discovery, virtio feature negotiation, then driver/provider registry. Keep PCI BARs, DT physical resources and virtual handles distinct.
5. Security: driver/platform remains authority over privileged mapping, interrupt, DMA and firmware calls. Model EL/security state, hypervisor ownership, IOMMU group/domain, buffer provenance and delegated rights. Default-deny unsupported/unknown combinations.
6. Declare CPU ordering, MMIO ordering, DMA coherence, cache-maintenance and synchronization separately. Encode buffer producer/consumer ownership transitions. Bus label is not a synchronization contract.
7. Lifecycle: discover → validate → acquire → active → quiesce → release/fail. Link clock/reset/pinctrl/regulator/power dependencies; detach DMA/IRQ before teardown/reset; invalidate leases on suspend/resume as required.
8. Use portable standard bus/class APIs where available (PCIe, USB, NVMe, Ethernet) and virtio for virtual services. Keep unique accelerators/media behind driver providers with negotiated, explicitly limited capabilities; do not promise behavioral equivalence without evidence.

## Coverage and open evidence

| Segment | Evidence & status |
|---|---|
| A-profile EL/MMU/cache/barriers/atomics/endian | Arm ARM [1], architecture basis; per-chip features remain implementation-defined; source verified, hardware untested |
| DT / ACPI / UEFI / boot | Linux arm64 docs, SBBR [8][9][29][30]; platform table/firmware quality untested |
| SMCCC / PSCI / SCMI / FF-A | Arm SMCCC/PSCI/SCMI/FF-A specs [5][37][38][39]; interface families covered, while endpoint/version/conduit are platform-dependent. Linux candidate paths [10]-[12] failed retrieval. |
| GICv2/v3/v4, ITS, timer | Arm GIC / ITS [2][3] and ARM [1]; platform topology untested |
| SMMUv2/v3, IORT, DMA/coherency | SMMU v3 [4], ACPI [8]; vendor quirks/coherency need per-platform validation |
| AXI/ACE/CHI/APB | Arm AMBA [6][7]; hardware contracts only, not software APIs |
| PCIe ECAM/MSI / virtio / UART | Virtio 1.3 [13][14], PL011 binding/TRM [31][32]; ECAM/MSI mapping requires platform enumeration |
| GPIO/I2C/SPI/clocks/resets/pinctrl/regulators | Linux subsystem docs [15]-[20]; framework coverage, controller behavior remains driver-owned |
| Apple Silicon | Asahi feature matrix + upstream binding [21][34]; public support is generation-specific, undocumented blocks unknown |
| NVIDIA Tegra / Grace / GB10 | Grace/Vera support guide [24], Tegra binding endpoint fetch failed [33]; GB10 full peripheral inventory **UNKNOWN** pending exact public topology/driver extraction |
| BCM2712 / RP1 | Raspberry Pi official docs + RP1 datasheet [22][23]; RP1 is PCIe-linked southbridge; some full platform behavior still untested |
| Qualcomm / MediaTek / Rockchip / Allwinner | upstream platform bindings [25]-[28]; identification only, not complete per-IP ABI |
| NXP i.MX / TI K3 | upstream Freescale/NXP and TI bindings [35][36]; device manuals and firmware endpoint must be checked per SKU |
| Samsung Exynos | upstream DTS family exists; direct binding extraction absent in this fetch; per-chip inventory **UNKNOWN** |
| Ampere/server Arm | SBBR + Linux ACPI/UEFI [8][9][29]; standards-based server baseline, no Ampere hardware tested |
| Storage/network/display/media/GPU/NPU | standard bus/class or upstream drivers where present; vendor engines/firmware/secure buffer boundaries need per-driver audit; heterogeneous, incomplete |

**Source access caveats:** official Arm document portal pages sometimes return JavaScript or access-controlled shells to automated fetch. Downloadable non-confidential PDFs and metadata were captured when available. AMBA/Arm architecture specifications carry Arm terms/licensing; public Linux bindings/subsystem docs are open-source reference sources. No third-party implementation code copied. Some initially searched canonical Linux firmware paths produced 404; the source manifest records failures, and those source claims should be confirmed against current docs before implementation. Matrix statuses distinguish source verification from hardware testing.

## Next discriminating check

Inspect the seeded Omega schema/registry and the target platform's read-only DT, ACPI tables and PCI IDs; inventory discovered power/clock/IRQ/IOMMU/DMA relationships against upstream bindings and driver probe paths. This determines which Omega types already exist and whether schema work is actually needed. Pi 5/RP1 is a good public-data example if hardware exists. Do not test raw MMIO. The research did not inspect or modify Omega or Interplane code.

## Sources

[1] https://support.arm.com/documentation/ddi0487/md
[2] https://developer.arm.com/documentation/ihi0069/latest
[3] https://developer.arm.com/documentation/102923/0100/ITS
[4] https://documentation-service.arm.com/static/69ae9767e79f9a1d642aab2d
[5] https://documentation-service.arm.com/static/5f8edaeff86e16515cdbe4c6
[6] https://www.arm.com/architecture/system-architectures/amba/amba-specifications
[7] https://developer.arm.com/-/media/Arm%20Developer%20Community/PDF/IHI0022H_amba_axi_protocol_spec.pdf
[8] https://docs.kernel.org/arch/arm64/arm-acpi.html
[9] https://www.kernel.org/doc/html/latest/arch/arm/uefi.html
[10] https://docs.kernel.org/driver-api/firmware/arm_scmi.html
[11] https://docs.kernel.org/driver-api/firmware/psci.html
[12] https://docs.kernel.org/driver-api/firmware/arm_ffa.html
[13] https://docs.kernel.org/driver-api/virtio/virtio.html
[14] https://docs.oasis-open.org/virtio/virtio/v1.3/csd01/virtio-v1.3-csd01.html
[15] https://docs.kernel.org/driver-api/i2c.html
[20] https://docs.kernel.org/driver-api/regulator.html
[21] https://asahilinux.org/docs/platform/feature-support/m1
[22] https://www.raspberrypi.com/documentation/computers/io-controllers.html
[23] https://pip-assets.raspberrypi.com/categories/892-raspberry-pi-5/documents/RP-008370-DS-1-rp1-peripherals.pdf?disposition=inline
[24] https://docs.nvidia.com/dccpu/patches-config-guide/index.html
[25] https://www.kernel.org/doc/Documentation/devicetree/bindings/arm/qcom-soc.yaml
[28] https://kernel.org/doc/Documentation/devicetree/bindings/arm/sunxi.yaml
[29] https://documentation-service.arm.com/static/5fb7e66fd77dd807b9a80c94
[30] https://www.kernel.org/doc/html/latest/arch/arm64/booting.html
[31] https://www.kernel.org/doc/Documentation/devicetree/bindings/serial/pl011.txt
[32] https://support.arm.com/documentation/ddi0183/f/introduction/about-the-uart?lang=en
[33] https://www.kernel.org/doc/Documentation/devicetree/bindings/arm/nvidia,tegra.yaml
[34] https://www.kernel.org/doc/Documentation/devicetree/bindings/arm/apple.yaml
[35] https://www.kernel.org/doc/Documentation/devicetree/bindings/arm/fsl.yaml
[36] https://www.kernel.org/doc/Documentation/devicetree/bindings/arm/ti.yaml
[37] https://documentation-service.arm.com/static/5f905c71f86e16515cdc1fd0?token=
[38] https://developer.arm.com/documentation/den0056
[39] https://documentation-service.arm.com/static/66e1f6a763788e5fed1641d9
