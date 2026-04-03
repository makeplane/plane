# find-polluter.sh Test Documentation

## Purpose
Bisection script to find which test creates unwanted files or state pollution.

## Manual Test Procedure

### Setup Test Scenario
```bash
# Create test directory
mkdir -p /tmp/polluter-test && cd /tmp/polluter-test

# Create clean test
cat > test1.test.js << 'EOF'
console.log('Test 1: clean');
EOF

# Create polluter test
cat > test2.test.js << 'EOF'
const fs = require('fs');
fs.mkdirSync('.git', { recursive: true });
console.log('Test 2: creates pollution');
EOF

# Create another clean test
cat > test3.test.js << 'EOF'
console.log('Test 3: clean');
EOF
```

### Run Script
```bash
# For projects with npm test
/path/to/find-polluter.sh '.git' 'src/**/*.test.ts'

# For node-only tests (modify script to use 'node' instead of 'npm test')
./find-polluter.sh '.git' '*.test.js'
```

### Expected Output
```
🔍 Searching for test that creates: .git
Test pattern: *.test.js

Found 3 test files

[1/3] Testing: ./test1.test.js
[2/3] Testing: ./test2.test.js

🎯 FOUND POLLUTER!
   Test: ./test2.test.js
   Created: .git
```

### Cleanup
```bash
rm -rf /tmp/polluter-test
```

## Test Results

✅ Script logic verified (2025-11-11)
- Correctly iterates through test files
- Detects pollution creation
- Reports the polluting test file
- Exits early when polluter found

## Usage Notes

**Prerequisites:**
- Test runner (npm test) must be configured in project
- Test pattern must match actual test files
- Pollution path must be accurate

**Customization:**
If your project doesn't use `npm test`, modify line 42:
```bash
# Replace
npm test "$TEST_FILE" > /dev/null 2>&1 || true

# With your test command
node "$TEST_FILE" > /dev/null 2>&1 || true
# Or
jest "$TEST_FILE" > /dev/null 2>&1 || true
```

## Common Use Cases

1. **Find test creating .git directory:**
   ```bash
   ./find-polluter.sh '.git' 'src/**/*.test.ts'
   ```

2. **Find test creating node_modules:**
   ```bash
   ./find-polluter.sh 'node_modules' 'test/**/*.spec.js'
   ```

3. **Find test creating specific file:**
   ```bash
   ./find-polluter.sh 'unwanted-file.txt' '**/*.test.js'
   ```
