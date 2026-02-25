# Research & Analysis Phase

**When to skip:** If provided with researcher reports, skip this phase.

## Core Activities

### Parallel Researcher Agents
- Spawn multiple `researcher` agents in parallel to investigate different approaches
- Wait for all researcher agents to report back before proceeding
- Each researcher investigates a specific aspect or approach

### Sequential Thinking
- Use `sequential-thinking` skill for dynamic and reflective problem-solving
- Structured thinking process for complex analysis
- Enables multi-step reasoning with revision capability

### Documentation Research
- Use `docs-seeker` skill to read and understand documentation
- Research plugins, packages, and frameworks
- Find latest technical documentation using llms.txt standard

### GitHub Analysis
- Use `gh` command to read and analyze:
  - GitHub Actions logs
  - Pull requests
  - Issues and discussions
- Extract relevant technical context from GitHub resources

### Remote Repository Analysis
When given GitHub repository URL, generate fresh codebase summary:
```bash
# usage: 
repomix --remote <github-repo-url>
# example: 
repomix --remote https://github.com/mrgoonie/human-mcp
```

### Debugger Delegation
- Delegate to `debugger` agent for root cause analysis
- Use when investigating complex issues or bugs
- Debugger agent specializes in diagnostic tasks

## Best Practices

- Research breadth before depth
- Document findings for synthesis phase
- Identify multiple approaches for comparison
- Consider edge cases during research
- Note security implications early
