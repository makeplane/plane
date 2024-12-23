#!/bin/bash

# Function to check for test files and run tests if they exist
run_tests_if_exist() {
    local dir=$1
    if ls "$dir"/*_test.go 1> /dev/null 2>&1; then
        cd "$dir"
        go test ./... -v -cover
        cd - > /dev/null
    fi
}

# Function to recursively find and run tests in all directories
find_and_run_tests() {
    local base_dir=$1
    for dir in $(find "$base_dir" -type d); do
        run_tests_if_exist "$dir"
    done
}

# Run tests in the cli module
find_and_run_tests "cli"

# Run tests in the lib directory
find_and_run_tests "lib"

