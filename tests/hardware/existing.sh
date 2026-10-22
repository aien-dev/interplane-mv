#!/usr/bin/env bash
# Record every existing gate, including failures; no waived checks or skips.
set -uo pipefail
cd "$(dirname "$0")/../.."
export CARGO_TARGET_DIR="$PWD/target/L558/existing"
export CARGO_NET_OFFLINE=true
mkdir -p qualification/evidence/L558/existing
status=0
printf 'gate\texit\n' > qualification/evidence/L558/existing.tsv
for gate in no-python schemas-and-fixtures rust package negative-controls provenance adapter-aien; do
  quiet-build bash tests/gates/run.sh "$gate" > "qualification/evidence/L558/existing/$gate.log" 2>&1
  rc=$?
  printf '%s\t%s\n' "$gate" "$rc" | tee -a qualification/evidence/L558/existing.tsv
  if [[ $rc != 0 ]]; then status=1; fi
done
exit "$status"
