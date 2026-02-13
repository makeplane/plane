# Test Failure Fix Workflow

For fixing failing tests and test suite issues.

## Workflow

1. **Compile first** with `tester` agent
   - Fix all syntax errors before running tests

2. **Run tests** and collect failures

3. **Debug** with `debugger` agent for root causes

4. **Plan** fix with `planner` agent

5. **Implement** fixes step by step

6. **Re-test** with `tester` agent

7. **Review** with `code-reviewer` agent

8. **Iterate** if tests still fail, repeat from step 2

## Common Commands
```bash
npm test
bun test
pytest
go test ./...
```

## Tips
- Run single failing test first for faster iteration
- Check test assertions vs actual behavior
- Verify test fixtures/mocks are correct
- Don't modify tests to pass unless test is wrong
