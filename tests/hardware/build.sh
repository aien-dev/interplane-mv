#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p target/L558 qualification/evidence/L558
seed=29b12760f4c962606411d6bf25032aedef063301
expected=191b776ef98821597c3e30655da6d680a9b66edbc9ceaca3c39c61ea6df098e9
if [[ ${1-} == --birth ]]; then
  # Extract immutable objects into OUR output directory. Never build in L408's tree.
  test ! -e target/L558/seed-source
  mkdir target/L558/seed-source
  git -C "${OMEGA_REPO:-../omega-in-omega}" archive "$seed" | tar -x -C target/L558/seed-source
  (cd target/L558/seed-source && quiet-build sh seed/omega-from-seed.sh) > qualification/evidence/L558/seed-birth.log 2>&1
  cp target/L558/seed-source/seed/out/omc target/L558/omc
elif [[ -n ${OMC-} ]]; then
  cp "$OMC" target/L558/omc
fi
printf '%s  target/L558/omc\n' "$expected" | sha256sum -c -
quiet-build sh -c 'target/L558/omc < omega/hardware/map.om > target/L558/hardware-map.tmp'
test -s target/L558/hardware-map.tmp
chmod +x target/L558/hardware-map.tmp
mv target/L558/hardware-map.tmp target/L558/hardware-map
{
  printf 'compiler_source=%s\n' "$seed"
  printf 'base_interplane=b669d06e21c9debb15073289d7c0b78b1b2d362c\n'
  sha256sum target/L558/omc omega/hardware/map.om target/L558/hardware-map
} > qualification/evidence/L558/build.txt
