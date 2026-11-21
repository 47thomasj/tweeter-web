#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
terraform_dir="$(cd -- "$script_dir/.." && pwd)"
repo_root="$(cd -- "$terraform_dir/.." && pwd)"
zip_dir="$terraform_dir/zip"

cleanup() {
  rm -rf "$zip_dir"
}

trap cleanup EXIT

rm -rf "$zip_dir"
mkdir -p "$zip_dir"

cd "$repo_root"
npm run build

terraform -chdir="$terraform_dir" fmt
terraform -chdir="$terraform_dir" validate
terraform -chdir="$terraform_dir" apply -auto-approve "$@"
