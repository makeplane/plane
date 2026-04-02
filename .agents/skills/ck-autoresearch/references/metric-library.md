# Metric Library

Quick-reference verify commands by domain. Copy-paste into ck:loop config.
Direction: **lower** = fewer errors/ms/bytes is better. **higher** = more coverage/accuracy is better.

## Code Quality

### Test Coverage

**Node.js — Jest**
```bash
npx jest --coverage --coverageReporters=json-summary 2>/dev/null \
  | node -e "const s=require('./coverage/coverage-summary.json'); console.log(s.total.lines.pct)"
```
Direction: higher | Noise: low | Guard: `npm test`

**Node.js — Vitest**
```bash
npx vitest run --coverage 2>/dev/null \
  | grep 'All files' | awk '{print $NF}' | tr -d '%'
```
Direction: higher | Noise: low | Guard: `npm test`

**Python — pytest-cov**
```bash
pytest --cov=src --cov-report=term-missing -q 2>/dev/null \
  | grep 'TOTAL' | awk '{print $NF}' | tr -d '%'
```
Direction: higher | Noise: low | Guard: `pytest`

**Go**
```bash
go test ./... -coverprofile=coverage.out -covermode=atomic 2>/dev/null \
  && go tool cover -func=coverage.out | grep total | awk '{print $3}' | tr -d '%'
```
Direction: higher | Noise: low | Guard: `go test ./...`


### Lint Errors

**ESLint**
```bash
npx eslint src --format json 2>/dev/null \
  | node -e "const r=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(r.reduce((a,f)=>a+f.errorCount,0))"
```
Direction: lower | Noise: low | Guard: `npm test`

**Pylint**
```bash
pylint src/ --output-format=json 2>/dev/null \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(sum(1 for m in d if m['type'] in ('error','fatal')))"
```
Direction: lower | Noise: low | Guard: `pytest`

**Clippy (Rust)**
```bash
cargo clippy --message-format=json 2>/dev/null \
  | jq -r 'select(.reason=="compiler-message") | .message.level' | grep -c 'error'
```
Direction: lower | Noise: low | Guard: `cargo test`


### Type Errors

**TypeScript — tsc**
```bash
npx tsc --noEmit 2>&1 | grep -c '^src/.*error TS' || true
```
Direction: lower | Noise: low | Guard: `npm test`

**Python — mypy**
```bash
mypy src/ --ignore-missing-imports 2>&1 | tail -1 | awk '{print $1}'
```
Direction: lower | Noise: low | Guard: `pytest`


## Performance

### API Latency

**wrk (mean latency, ms)**
```bash
wrk -t2 -c10 -d10s http://localhost:3000/api/health 2>/dev/null \
  | grep 'Latency' | awk '{print $2}' | sed 's/ms//'
```
Direction: lower | Noise: high | Guard: `npm test`

**curl (single request, ms)**
```bash
curl -o /dev/null -s -w "%{time_total}" http://localhost:3000/api/health \
  | awk '{printf "%.0f\n", $1*1000}'
```
Direction: lower | Noise: high | Guard: `npm test`


### Build / Bundle Size

**Webpack / Vite (main bundle, bytes)**
```bash
npm run build 2>/dev/null \
  && find dist -name '*.js' ! -name '*.map' | xargs wc -c | tail -1 | awk '{print $1}'
```
Direction: lower | Noise: low | Guard: `tsc --noEmit`

**Go binary (bytes)**
```bash
go build -o /tmp/app_measure . 2>/dev/null && wc -c < /tmp/app_measure
```
Direction: lower | Noise: low | Guard: `go test ./...`


### Build Time

**Node.js (ms)**
```bash
start=$(date +%s%N); npm run build 2>/dev/null; echo $(( ($(date +%s%N) - start) / 1000000 ))
```
Direction: lower | Noise: medium | Guard: `tsc --noEmit`

**Go (ms)**
```bash
start=$(date +%s%N); go build ./... 2>/dev/null; echo $(( ($(date +%s%N) - start) / 1000000 ))
```
Direction: lower | Noise: medium | Guard: `go test ./...`


## Security

### Vulnerability Count

**npm audit**
```bash
npm audit --json 2>/dev/null \
  | node -e "const r=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(r.metadata?.vulnerabilities?.total ?? 0)"
```
Direction: lower | Noise: low | Guard: `npm test`

**pip-audit**
```bash
pip-audit --format=json 2>/dev/null \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('dependencies',[])))"
```
Direction: lower | Noise: low | Guard: `pytest`

## Lines of Code

**find + wc (TS/JS)**
```bash
find src -name '*.ts' -o -name '*.js' | xargs wc -l | tail -1 | awk '{print $1}'
```
Direction: lower | Noise: low | Guard: `npm test`

**cloc (any language)**
```bash
cloc src --json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin)['SUM']['code'])"
```
Direction: lower | Noise: low | Guard: `npm test`

## ML / Data Science

### Accuracy

**PyTorch (eval script)**
```bash
python3 scripts/evaluate.py --split val 2>/dev/null | grep 'accuracy' | awk '{print $NF}'
```
Direction: higher | Noise: high | Guard: `pytest tests/`

**sklearn — F1 Score**
```bash
python3 -c "from sklearn.metrics import f1_score; import numpy as np; print(f'{f1_score(np.load(\"data/y_true.npy\"), np.load(\"data/y_pred.npy\"), average=\"weighted\"):.4f}')"
```
Direction: higher | Noise: high | Guard: `pytest tests/`


## Creating Custom Metrics

### Template

```bash
# 1. Measure exactly one numeric value
# 2. Print it to stdout as the last (or only) line
# 3. Exit 0 on success, non-zero on failure (treated as crash)
# 4. Complete in < 30 seconds (or configure timeout)
# 5. Be deterministic, or declare Noise: high

YOUR_MEASURE_COMMAND | YOUR_EXTRACT_COMMAND
```

### Rules

| Rule | Detail |
|------|--------|
| One number | stdout last line must be a bare number (integer or float) |
| Exit codes | exit 0 = valid measurement, exit non-zero = crash (logged, skipped) |
| Runtime | keep under 30s; use sampling for expensive workloads |
| Determinism | if output varies run-to-run, set `noise: high` and use 3-5 runs |
| Units | consistent across all iterations; never change mid-loop |
| Direction | declare explicitly: `lower` or `higher` is better |
