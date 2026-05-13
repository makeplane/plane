# End-to-End Testing with testRigor

This directory contains the end-to-end testing infrastructure for Plane using testRigor.

## Overview

testRigor is an AI-powered end-to-end testing platform that allows you to write tests in plain English. This setup enables automated testing of the Plane application's user interface and functionality from a user's perspective.

## How it Works

1. **GitHub Actions**: Automated workflow in `.github/workflows/tR-ci.yml` that:
   - Sets up the Plane server locally
   - Runs a testRigor test suite through tR's CLI tool locally (using `localhost`)
   - Uses GitHub secrets for authentication (`CI_TOKEN` and `SUITE_ID`)
2. **testRigor CLI**: Executes test suites written in plain English on the testRigor platform, in this case, this is the [test suite](https://app.testrigor.com/test-suites/245eg9BjPdToYXHNf/test-cases) that's being triggered by the workflow file.

## Usage

### Manual Testing

## Requirements
- testRigor command line tool
- Plane instance installed (either local or remote).
```bash
# Run testRigor tests (requires valid tokens)
testrigor test-suite run <SUITE_ID> --token <CI_TOKEN> --localhost --url <Your plane instance domain>
```

Only use the "--localhost" flag if the Plane instance to be tested is installed locally.

### CI/CD Testing
Tests automatically run via GitHub Actions when:
- Pushing to `tr-e2e-tests` or `preview` branches
- Creating pull requests to `preview`
- Manual workflow dispatch

## Configuration

Set these GitHub repository secrets:
- `CI_TOKEN`: Your testRigor authentication token
- `SUITE_ID`: The testRigor test suite identifier

## Learn More

- [testRigor Documentation](https://testrigor.com/docs/)
- [testRigor CLI Reference](https://testrigor.com/command-line)
