#!/usr/bin/env bash
set -euo pipefail

echo "This will destroy all resources. Continue? (y/N)"
read -r ans
if [[ "${ans}" != "y" && "${ans}" != "Y" ]]; then
  echo "Aborted."
  exit 1
fi

terraform destroy -auto-approve
