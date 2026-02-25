#!/usr/bin/env bash

set -u

repo_root="${1:-$(pwd)}"
en_dir="${repo_root}/content/recipes/en"
nl_dir="${repo_root}/content/recipes/nl"

if [[ ! -d "${en_dir}" ]]; then
  echo "Missing directory: ${en_dir}" >&2
  exit 1
fi

if [[ ! -d "${nl_dir}" ]]; then
  echo "Missing directory: ${nl_dir}" >&2
  exit 1
fi

comm -23 \
  <(find "${en_dir}" -maxdepth 1 -type f -name '*.md' -exec basename {} .md \; | LC_ALL=C sort) \
  <(find "${nl_dir}" -maxdepth 1 -type f -name '*.md' -exec basename {} .md \; | LC_ALL=C sort)
