## Copyright check

To verify that all tracked Python files contain the correct copyright header for **Plane Software Inc.** for the year **2023**, run this command from the repository root:

```bash
addlicense --check -f COPYRIGHT.txt -ignore "**/migrations/**" $(git ls-files '*.py')
```

#### To Apply Changes

python files

```bash
addlicense -v -f COPYRIGHT.txt -ignore "**/migrations/**" $(git ls-files '*.py')
```

ts and tsx files in a specific app

```bash
addlicense -v -f COPYRIGHT.txt \
  -ignore "**/*.config.ts" \
  -ignore "**/*.d.ts" \
  $(git ls-files 'packages/*.ts')
```

Note: Please make sure ts command is running on specific folder, running it for the whole mono repo is crashing os processes.

#### Other Options

- **`addlicense -check`**: runs in check-only mode and fails if any file is missing or has an incorrect header.
- **`-c "Plane Software Inc."`**: sets the copyright holder.
- **`-f LICENSE.txt`**: uses the contents and format defined in `LICENSE.txt` as the header template.
- **`-y 2023`**: sets the year in the header.
- **`$(git ls-files '*.py')`**: restricts the check to Python files tracked in git.
