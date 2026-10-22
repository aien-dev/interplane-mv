#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
export CARGO_TARGET_DIR="$PWD/target/L558/reference"
export CARGO_NET_OFFLINE=true
# Existing tests/gates/run.sh remains unchanged; existing.sh records its seven gates.
bash tests/hardware/build.sh
node tests/hardware/acceptance.mjs
node tests/hardware/transport.mjs
node tests/hardware/mutants.mjs
quiet-build cargo fmt --manifest-path tests/hardware/reference/Cargo.toml --check
quiet-build cargo clippy --offline --locked --manifest-path tests/hardware/reference/Cargo.toml -- -D warnings
quiet-build cargo run -q --offline --locked --manifest-path tests/hardware/reference/Cargo.toml
