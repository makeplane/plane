#!/usr/bin/env node
/**
 * test-build-command-allowlist.cjs - Tests for build command allowlist patterns
 *
 * Tests that build commands from various languages/tools are properly recognized
 * and allowed (bypassing path blocking).
 */

// Replicate the patterns from scout-block.cjs
const BUILD_COMMAND_PATTERN = /^(npm|pnpm|yarn|bun)\s+([^\s]+\s+)*(run\s+)?(build|test|lint|dev|start|install|ci|add|remove|update|publish|pack|init|create|exec)/;
const TOOL_COMMAND_PATTERN = /^(\.\/)?(npx|pnpx|bunx|tsc|esbuild|vite|webpack|rollup|turbo|nx|jest|vitest|mocha|eslint|prettier|go|cargo|make|mvn|mvnw|gradle|gradlew|dotnet|docker|podman|kubectl|helm|terraform|ansible|bazel|cmake|sbt|flutter|swift|ant|ninja|meson)/;

function isBuildCommand(command) {
  if (!command || typeof command !== 'string') return false;
  const trimmed = command.trim();
  return BUILD_COMMAND_PATTERN.test(trimmed) || TOOL_COMMAND_PATTERN.test(trimmed);
}

const tests = [
  // JS/Node package managers - should be allowed
  { cmd: 'npm run build', expected: true, desc: 'npm run build' },
  { cmd: 'npm build', expected: true, desc: 'npm build' },
  { cmd: 'pnpm build', expected: true, desc: 'pnpm build' },
  { cmd: 'yarn build', expected: true, desc: 'yarn build' },
  { cmd: 'bun build', expected: true, desc: 'bun build' },
  { cmd: 'npm install', expected: true, desc: 'npm install' },
  { cmd: 'pnpm --filter web run build', expected: true, desc: 'pnpm with filter' },
  { cmd: 'yarn workspace app build', expected: true, desc: 'yarn workspace build' },

  // JS tools - should be allowed
  { cmd: 'npx tsc', expected: true, desc: 'npx tsc' },
  { cmd: 'tsc --build', expected: true, desc: 'tsc --build' },
  { cmd: 'esbuild src/index.ts', expected: true, desc: 'esbuild' },
  { cmd: 'vite build', expected: true, desc: 'vite build' },
  { cmd: 'webpack', expected: true, desc: 'webpack' },
  { cmd: 'turbo run build', expected: true, desc: 'turbo run build' },
  { cmd: 'nx build app', expected: true, desc: 'nx build' },

  // Go - should be allowed (THE BUG FIX)
  { cmd: 'go build ./...', expected: true, desc: 'go build ./...' },
  { cmd: 'go build -o app main.go', expected: true, desc: 'go build with flags' },
  { cmd: 'go test ./...', expected: true, desc: 'go test' },
  { cmd: 'go run main.go', expected: true, desc: 'go run' },
  { cmd: 'go mod tidy', expected: true, desc: 'go mod tidy' },
  { cmd: 'go install', expected: true, desc: 'go install' },

  // Rust/Cargo - should be allowed
  { cmd: 'cargo build', expected: true, desc: 'cargo build' },
  { cmd: 'cargo build --release', expected: true, desc: 'cargo build --release' },
  { cmd: 'cargo test', expected: true, desc: 'cargo test' },
  { cmd: 'cargo run', expected: true, desc: 'cargo run' },

  // Make - should be allowed
  { cmd: 'make', expected: true, desc: 'make' },
  { cmd: 'make build', expected: true, desc: 'make build' },
  { cmd: 'make clean', expected: true, desc: 'make clean' },
  { cmd: 'make -j4', expected: true, desc: 'make -j4' },

  // Java/Maven/Gradle - should be allowed
  { cmd: 'mvn clean install', expected: true, desc: 'mvn clean install' },
  { cmd: 'mvn package', expected: true, desc: 'mvn package' },
  { cmd: 'gradle build', expected: true, desc: 'gradle build' },
  { cmd: 'gradle test', expected: true, desc: 'gradle test' },

  // Maven/Gradle wrappers - should be allowed (NEW)
  { cmd: './gradlew build', expected: true, desc: './gradlew build' },
  { cmd: './gradlew clean test', expected: true, desc: './gradlew clean test' },
  { cmd: 'gradlew build', expected: true, desc: 'gradlew build (no ./)' },
  { cmd: './mvnw clean install', expected: true, desc: './mvnw clean install' },
  { cmd: './mvnw package', expected: true, desc: './mvnw package' },
  { cmd: 'mvnw clean install', expected: true, desc: 'mvnw clean install (no ./)' },

  // .NET - should be allowed
  { cmd: 'dotnet build', expected: true, desc: 'dotnet build' },
  { cmd: 'dotnet run', expected: true, desc: 'dotnet run' },
  { cmd: 'dotnet test', expected: true, desc: 'dotnet test' },

  // Docker/Container tools - should be allowed
  { cmd: 'docker build .', expected: true, desc: 'docker build' },
  { cmd: 'docker build -t myapp .', expected: true, desc: 'docker build with tag' },
  { cmd: 'docker compose up', expected: true, desc: 'docker compose' },
  { cmd: 'podman build .', expected: true, desc: 'podman build' },

  // Kubernetes/Infrastructure - should be allowed
  { cmd: 'kubectl apply -f deploy/', expected: true, desc: 'kubectl apply' },
  { cmd: 'kubectl get pods', expected: true, desc: 'kubectl get' },
  { cmd: 'helm install myapp ./chart', expected: true, desc: 'helm install' },
  { cmd: 'terraform apply', expected: true, desc: 'terraform apply' },
  { cmd: 'terraform plan', expected: true, desc: 'terraform plan' },
  { cmd: 'ansible-playbook site.yml', expected: true, desc: 'ansible playbook' },

  // Additional build systems - should be allowed (NEW)
  { cmd: 'bazel build //...', expected: true, desc: 'bazel build' },
  { cmd: 'bazel test //...', expected: true, desc: 'bazel test' },
  { cmd: 'cmake --build .', expected: true, desc: 'cmake build' },
  { cmd: 'cmake -B build', expected: true, desc: 'cmake configure' },
  { cmd: 'sbt compile', expected: true, desc: 'sbt compile' },
  { cmd: 'sbt test', expected: true, desc: 'sbt test' },
  { cmd: 'flutter build apk', expected: true, desc: 'flutter build apk' },
  { cmd: 'flutter run', expected: true, desc: 'flutter run' },
  { cmd: 'swift build', expected: true, desc: 'swift build' },
  { cmd: 'swift test', expected: true, desc: 'swift test' },
  { cmd: 'ant build', expected: true, desc: 'ant build' },
  { cmd: 'ant clean', expected: true, desc: 'ant clean' },
  { cmd: 'ninja', expected: true, desc: 'ninja' },
  { cmd: 'ninja -C build', expected: true, desc: 'ninja -C build' },
  { cmd: 'meson compile', expected: true, desc: 'meson compile' },
  { cmd: 'meson setup build', expected: true, desc: 'meson setup' },

  // Directory access - should be BLOCKED (not recognized as build commands)
  { cmd: 'cd build', expected: false, desc: 'cd build (blocked)' },
  { cmd: 'ls build', expected: false, desc: 'ls build (blocked)' },
  { cmd: 'cat build/output.js', expected: false, desc: 'cat build file (blocked)' },
  { cmd: 'cd node_modules', expected: false, desc: 'cd node_modules (blocked)' },
  { cmd: 'rm -rf dist', expected: false, desc: 'rm -rf dist (blocked)' },
];

console.log('Testing build command allowlist...\n');

let passed = 0;
let failed = 0;

for (const test of tests) {
  const result = isBuildCommand(test.cmd);
  const success = result === test.expected;

  if (success) {
    console.log(`\x1b[32m✓\x1b[0m ${test.desc}: ${result}`);
    passed++;
  } else {
    console.log(`\x1b[31m✗\x1b[0m ${test.desc}: expected ${test.expected}, got ${result}`);
    failed++;
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
