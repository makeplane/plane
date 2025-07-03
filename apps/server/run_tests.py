#!/usr/bin/env python
import argparse
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description="Run Plane tests")
    parser.add_argument("-u", "--unit", action="store_true", help="Run unit tests only")
    parser.add_argument(
        "-c", "--contract", action="store_true", help="Run contract tests only"
    )
    parser.add_argument(
        "-s", "--smoke", action="store_true", help="Run smoke tests only"
    )
    parser.add_argument(
        "-o", "--coverage", action="store_true", help="Generate coverage report"
    )
    parser.add_argument(
        "-p", "--parallel", action="store_true", help="Run tests in parallel"
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    args = parser.parse_args()

    # Build command
    cmd = ["python", "-m", "pytest"]
    markers = []

    # Add test markers
    if args.unit:
        markers.append("unit")
    if args.contract:
        markers.append("contract")
    if args.smoke:
        markers.append("smoke")

    # Add markers filter
    if markers:
        cmd.extend(["-m", " or ".join(markers)])

    # Add coverage
    if args.coverage:
        cmd.extend(["--cov=plane", "--cov-report=term", "--cov-report=html"])

    # Add parallel
    if args.parallel:
        cmd.extend(["-n", "auto"])

    # Add verbose
    if args.verbose:
        cmd.append("-v")

    # Add common flags
    cmd.extend(["--reuse-db", "--nomigrations"])

    # Print command
    print(f"Running: {' '.join(cmd)}")

    # Execute command
    result = subprocess.run(cmd)

    # Check coverage thresholds if coverage is enabled
    if args.coverage:
        print("Checking coverage thresholds...")
        coverage_cmd = ["python", "-m", "coverage", "report", "--fail-under=90"]
        coverage_result = subprocess.run(coverage_cmd)
        if coverage_result.returncode != 0:
            print("Coverage below threshold (90%)")
            sys.exit(coverage_result.returncode)

    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
