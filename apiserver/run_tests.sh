#!/bin/bash

# This is a simple wrapper script that calls the main test runner in the tests directory
exec tests/run_tests.sh "$@" 