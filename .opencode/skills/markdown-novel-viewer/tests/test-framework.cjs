/**
 * Simple test framework for Node.js (mocha-like)
 */

global.testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  suites: [],
  currentSuite: null
};

class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.beforeFn = null;
    this.afterFn = null;
  }

  addTest(name, fn) {
    this.tests.push({ name, fn });
  }

  setBefore(fn) {
    this.beforeFn = fn;
  }

  setAfter(fn) {
    this.afterFn = fn;
  }

  async run() {
    const results = {
      name: this.name,
      passed: 0,
      failed: 0,
      errors: []
    };

    console.log(`\n  ${this.name}`);

    for (const test of this.tests) {
      try {
        if (this.beforeFn) {
          await this.beforeFn();
        }

        await test.fn();

        if (this.afterFn) {
          await this.afterFn();
        }

        results.passed++;
        process.stdout.write('.');
      } catch (error) {
        results.failed++;
        results.errors.push({
          test: test.name,
          error: error.message
        });
        process.stdout.write('F');
      }
    }

    return results;
  }
}

global.testSuites = {};

global.describe = function(name, fn) {
  const suite = new TestSuite(name);
  global.testStats.currentSuite = suite;
  global.testSuites[name] = suite;
  fn();
};

global.it = function(name, fn) {
  if (!global.testStats.currentSuite) {
    throw new Error('it() called outside describe()');
  }
  global.testStats.currentSuite.addTest(name, fn);
};

global.before = function(fn) {
  if (!global.testStats.currentSuite) {
    throw new Error('before() called outside describe()');
  }
  global.testStats.currentSuite.setBefore(fn);
};

global.after = function(fn) {
  if (!global.testStats.currentSuite) {
    throw new Error('after() called outside describe()');
  }
  global.testStats.currentSuite.setAfter(fn);
};

global.runAllTests = async function() {
  console.log('\n' + '='.repeat(70));
  console.log('Running Test Suites');
  console.log('='.repeat(70));

  const suites = Object.values(global.testSuites);
  const results = [];

  for (const suite of suites) {
    const result = await suite.run();
    results.push(result);
    global.testStats.passed += result.passed;
    global.testStats.failed += result.failed;
    global.testStats.total += result.passed + result.failed;
  }

  printTestResults(results);

  return global.testStats;
};

function printTestResults(results) {
  console.log('\n\n' + '='.repeat(70));
  console.log('Test Results');
  console.log('='.repeat(70) + '\n');

  let totalPassed = 0;
  let totalFailed = 0;

  for (const result of results) {
    const status = result.failed > 0 ? '✗' : '✓';
    console.log(`${status} ${result.name}`);

    if (result.errors.length > 0) {
      result.errors.forEach(err => {
        console.log(`  ✗ ${err.test}`);
        console.log(`    ${err.error}`);
      });
    }

    totalPassed += result.passed;
    totalFailed += result.failed;
  }

  console.log('\n' + '='.repeat(70));
  console.log(`Total: ${totalPassed + totalFailed} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
  console.log('='.repeat(70) + '\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

module.exports = { TestSuite, runAllTests };
