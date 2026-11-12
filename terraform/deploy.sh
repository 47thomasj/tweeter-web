#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

cd ../
npm run build

cd terraform
terraform fmt
terraform validate
terraform apply "$@"

rm *.zip
