#!/usr/bin/env node

/**
 * Workspace Validation Script
 * 
 * Validates that all artifact-based packages have properly built dist/ folders.
 * Prevents dev environment failures from missing or corrupted build artifacts.
 * 
 * Exit codes:
 *   0 - All packages valid
 *   1 - Validation failed, missing artifacts detected
 */

const fs = require('fs');
const path = require('path');

// Packages that MUST have dist/ folders (artifact-based resolution)
const ARTIFACT_PACKAGES = [
  'packages/constants',
  'packages/decorators',
  'packages/editor',
  'packages/hooks',
  'packages/i18n',
  'packages/logger',
  'packages/propel',
  'packages/services',
  'packages/types',
  'packages/ui',
  'packages/utils',
];

// Packages that use source resolution (no dist/ required)
const SOURCE_PACKAGES = [
  'packages/shared-state',
];

const WORKSPACE_ROOT = path.resolve(__dirname, '..');

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPackageArtifacts(packagePath) {
  const distPath = path.join(WORKSPACE_ROOT, packagePath, 'dist');
  const packageJsonPath = path.join(WORKSPACE_ROOT, packagePath, 'package.json');
  
  // Check if package.json exists
  if (!fs.existsSync(packageJsonPath)) {
    return {
      valid: false,
      reason: 'package.json not found',
    };
  }

  // Read package.json to get expected artifacts
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    return {
      valid: false,
      reason: `Failed to read package.json: ${error.message}`,
    };
  }

  // Check if dist/ folder exists
  if (!fs.existsSync(distPath)) {
    return {
      valid: false,
      reason: 'dist/ folder missing',
      packageName: packageJson.name,
    };
  }

  // Check if dist/ has any files
  const distFiles = fs.readdirSync(distPath);
  if (distFiles.length === 0) {
    return {
      valid: false,
      reason: 'dist/ folder is empty',
      packageName: packageJson.name,
    };
  }

  // Check for expected entry points based on package.json exports
  const expectedFiles = [];
  
  // Check exports field (most authoritative)
  if (packageJson.exports) {
    const exports = packageJson.exports;
    
    // Handle main export (".")
    if (exports['.']) {
      const mainExport = exports['.'];
      if (typeof mainExport === 'string') {
        expectedFiles.push({ file: mainExport, path: path.join(WORKSPACE_ROOT, packagePath, mainExport), type: 'export' });
      } else if (typeof mainExport === 'object') {
        if (mainExport.import) {
          expectedFiles.push({ file: mainExport.import, path: path.join(WORKSPACE_ROOT, packagePath, mainExport.import), type: 'import' });
        }
        if (mainExport.require) {
          expectedFiles.push({ file: mainExport.require, path: path.join(WORKSPACE_ROOT, packagePath, mainExport.require), type: 'require' });
        }
      }
    }
  }
  
  // Fallback to main/module fields if no exports
  if (expectedFiles.length === 0) {
    if (packageJson.main) {
      expectedFiles.push({ file: packageJson.main, path: path.join(WORKSPACE_ROOT, packagePath, packageJson.main), type: 'main' });
    }
    if (packageJson.module) {
      expectedFiles.push({ file: packageJson.module, path: path.join(WORKSPACE_ROOT, packagePath, packageJson.module), type: 'module' });
    }
  }

  // Validate at least one entry point exists (not all packages have types in dist/)
  const missingFiles = expectedFiles.filter(({ path }) => !fs.existsSync(path));
  
  if (missingFiles.length > 0 && missingFiles.length === expectedFiles.length) {
    // All expected files are missing - this is a problem
    return {
      valid: false,
      reason: `Missing all expected artifacts: ${missingFiles.map(f => f.file).join(', ')}`,
      packageName: packageJson.name,
    };
  }

  return {
    valid: true,
    packageName: packageJson.name,
    artifactCount: distFiles.length,
  };
}

function validateWorkspace(options = {}) {
  const { autoFix = false, verbose = false } = options;
  
  log('\n🔍 Validating workspace package artifacts...\n', 'cyan');

  const results = {
    valid: [],
    invalid: [],
    skipped: [],
  };

  // Check artifact-based packages
  for (const packagePath of ARTIFACT_PACKAGES) {
    const result = checkPackageArtifacts(packagePath);
    const packageName = result.packageName || packagePath.split('/').pop();
    
    if (result.valid) {
      results.valid.push({ packagePath, packageName, ...result });
      if (verbose) {
        log(`  ✓ ${packageName}`, 'green');
      }
    } else {
      results.invalid.push({ packagePath, packageName, ...result });
      log(`  ✗ ${packageName}: ${result.reason}`, 'red');
    }
  }

  // Note source packages (informational only)
  if (verbose) {
    log('\n📦 Source-resolved packages (no build required):', 'blue');
    for (const packagePath of SOURCE_PACKAGES) {
      const packageName = packagePath.split('/').pop();
      results.skipped.push({ packagePath, packageName });
      log(`  → ${packageName}`, 'blue');
    }
  }

  // Summary
  log('\n' + '═'.repeat(60), 'cyan');
  log(`Valid packages:   ${results.valid.length}/${ARTIFACT_PACKAGES.length}`, 'green');
  
  if (results.invalid.length > 0) {
    log(`Invalid packages: ${results.invalid.length}/${ARTIFACT_PACKAGES.length}`, 'red');
    log('═'.repeat(60) + '\n', 'cyan');
    
    // Show recovery instructions
    log('⚠️  Workspace validation failed!', 'yellow');
    log('\nMissing or corrupted build artifacts detected.', 'yellow');
    log('This usually happens after:', 'yellow');
    log('  • Interrupting builds with Ctrl+C', 'yellow');
    log('  • Git branch switches without rebuilding', 'yellow');
    log('  • Package updates without reinstalling\n', 'yellow');
    
    if (autoFix) {
      log('🔧 Auto-fix enabled: Run pnpm build:packages to rebuild', 'cyan');
      log('   (You can implement auto-rebuild here if desired)\n', 'cyan');
    } else {
      log('🔧 To fix, run one of these commands:', 'cyan');
      log('   pnpm build:packages  - Rebuild workspace packages only (fast)', 'green');
      log('   pnpm build          - Full build including apps (slower)', 'green');
      log('   pnpm dev:clean      - Clean everything and start fresh\n', 'green');
    }
    
    return false;
  } else {
    log('All packages validated successfully! ✨', 'green');
    log('═'.repeat(60) + '\n', 'cyan');
    return true;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    autoFix: args.includes('--fix'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };

  const skipValidation = process.env.SKIP_VALIDATION === '1';
  
  if (skipValidation) {
    log('⏭️  Skipping validation (SKIP_VALIDATION=1)', 'yellow');
    process.exit(0);
  }

  const isValid = validateWorkspace(options);
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateWorkspace, checkPackageArtifacts };
