## Copyright check

Every tracked Python, TypeScript and TSX file must start with the header in [`COPYRIGHT.txt`](./COPYRIGHT.txt) (`Copyright (c) 2023-present Plane Software, Inc. and contributors`, `SPDX-License-Identifier: AGPL-3.0-only`). The `copyright-check.yml` workflow enforces this on every pull request to `preview`, using [addlicense](https://github.com/google/addlicense) (`go install github.com/google/addlicense@latest`).

Run the same checks as CI from the repository root:

```bash
# Python (migrations are skipped)
addlicense -check -f COPYRIGHT.txt -ignore "**/migrations/**" $(git ls-files '*.py')

# TypeScript (config and declaration files are skipped)
addlicense -check -f COPYRIGHT.txt -ignore "**/*.config.ts" -ignore "**/*.d.ts" $(git ls-files '*.ts' '*.tsx')
```

#### To Apply Changes

python files

```bash
addlicense -v -f COPYRIGHT.txt -ignore "**/migrations/**" $(git ls-files '*.py')
```

ts and tsx files in a specific app or package

```bash
addlicense -v -f COPYRIGHT.txt \
  -ignore "**/*.config.ts" \
  -ignore "**/*.d.ts" \
  $(git ls-files 'packages/*.ts' 'packages/*.tsx')
```

Note: run the ts command on one folder at a time (for example `'apps/web/*.ts' 'apps/web/*.tsx'`); running it for the whole monorepo crashes OS processes.

#### Other Options

- **`-check`**: runs in check-only mode and fails if any file is missing or has an incorrect header.
- **`-f COPYRIGHT.txt`**: uses the contents of `COPYRIGHT.txt` as the header template.
- **`-ignore <glob>`**: skips matching files.
- **`$(git ls-files '*.py')`**: restricts the run to files tracked in git.
