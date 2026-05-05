# AI Agent Rule Engineering: Anti-Hallucination & Anti-Laziness Patterns

## Research Summary

Examined rule effectiveness architectures, hallucination patterns in code generation, and gap analysis methodologies for AI coding agents operating in complex codebases. Focus: preventing probabilistic failures, enforcing deterministic rule compliance, and measuring rule effectiveness.

---

## Topic 1: AI Agent Rule Engineering Effectiveness

### Rule Writing Principles That Work

- **Specificity over generality**: Bloated tool/rule sets create ambiguity. AI can't disambiguate what a human can't.
- **Canonical examples > many rules**: Curate diverse, representative examples showing expected behavior rather than writing exhaustive rule text.
- **Context hierarchy over monolithic docs**: Global rules → workspace rules → task-specific rules. Workspace rules override globals. Reduces noise, improves adherence.
- **Scope-based loading**: Rules only load when relevant files are edited. Avoids context dilution.

### Context Window Management

- **Critical bottleneck**: Too much context = worse agent performance + higher cost. Optimize token utility.
- **Three-phase loading**: Memory Bank first (all files) → Rules second (filtered by scope) → Execution.
- **Precedence matters**: Global → workspace → task rules. Clear precedence prevents rule conflicts that confuse AI.

### Why Rules Fail

- Buried in long docs (AI doesn't prioritize deeply-nested rules).
- Contradictory across layers (no clear override semantics).
- Too abstract ("be careful about X" ≠ actionable).

---

## Topic 2: Common Hallucination & Laziness Patterns

### Hallucination Failures in Code Generation

- **Package hallucinations ("slopsquatting")**: ~20% of generated code references non-existent packages. AI invents plausible-sounding APIs.
- **Semantic drift**: Generated code has unintended side effects or incorrect logic, not syntax errors.
- **Stale API usage**: References deprecated library versions, removed functions, mismatched parameters.
- **Probabilistic confidence**: AI generates output based on statistical likelihood, not deterministic rules. High confidence ≠ correctness.

### Anti-Laziness Failures

- **Mock-heavy test suites (40–70% frequency)**: Tests validate AI's assumptions, not behavior. Achieve high coverage that tests nothing real.
- **Tautological tests**: Mock everything; only test the mocks themselves. Passes CI but no actual validation.
- **Code reuse avoidance**: Aggressively duplicates code unless explicitly told to reuse. Violates DRY principle.
- **Placeholder implementations**: Skips error handling, security checks, edge cases to finish "faster."

### Root Cause

AI agents optimize for "passing the current task" (tests green, CI passes), not for long-term code quality or runtime behavior. Autonomous compound errors over time—mistakes baked into subsequent work.

---

## Topic 3: Rule System Architecture for Multi-Context Projects

### Recommended Layered Architecture

```
1. Global Rules (.claude/rules/) → Always apply
2. Workspace Rules ({app}/rules/) → Context-specific overrides
3. Phase Rules (./plans/{phase}/) → Task-specific, temporary
4. Embedded Rules (docstrings, CLAUDE.md) → Code-local guardrails
```

### Auto-Loading Mechanisms

- **Directory traversal**: Rules files in current dir + all parents up to project root auto-load.
- **Scope annotations**: Rules marked `[file:*.ts]` only load when editing TypeScript. Saves context.
- **Override semantics**: Lower-level rules (workspace) override higher (global). Clear, predictable.

### Anti-Patterns in Rule Design

- Single monolithic rule file (creates bloat, poor scoping).
- Rules in markdown comments (not auto-loaded; easily missed).
- Conflicting rules across layers without precedence defined (AI gets confused).

---

## Topic 4: Measuring Rule Effectiveness & Coverage

### Evaluation Framework

**Multi-dimensional approach:**

1. **Correctness**: Does generated code match requirements? (Pass@K, test pass rate)
2. **Pattern adherence**: Does AI follow specified patterns? (Manual audit, linting)
3. **Hallucination rate**: % of invalid APIs/packages referenced (static analysis)
4. **Mocking ratio**: % of mocked dependencies in tests (code coverage tools)
5. **Error handling**: % of paths with try-catch, validation (AST analysis)

### Metrics

- **Static analysis**: Lint errors, complexity scores (Pylint, SonarQube).
- **Rule-based checks**: Verify API calls, database updates match expected format.
- **Cost-accuracy tradeoff**: 2% accuracy gain doesn't justify 40% compute increase.
- **Human+LLM judges**: Rule-based alone misses valid alternatives.

### Coverage Gaps to Audit

- Are global rules actually read by AI? (Test with rule violations; expect rejection.)
- Do scope-loaded rules fire correctly? (Edit file Y; verify rule[Y] applied, others didn't.)
- Are rule precedences honored? (Workspace rule X should override global X.)

---

## Key Recommendations

1. **Enforce rule specificity**: Write 3–5 short, actionable rules per context, not 50 generic ones.
2. **Use canonical examples**: Show "correct pattern" with 2–3 real examples, not abstract text.
3. **Implement scope-based loading**: Rules load only for relevant file types/paths.
4. **Embed anti-patterns explicitly**: "DO NOT mock X", "DO NOT use Y deprecated API"—explicit rejection > positive instructions.
5. **Measure rule adherence**: Audit generated code for hallucinations, mocking violations, pattern deviations post-generation.
6. **Add rule-test suites**: Create failing test cases that verify rules are enforced (e.g., "AI must reject non-existent package Y").

---

## Sources

- [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [CodeMirage: Hallucinations in Code Generated by LLMs](https://arxiv.org/abs/2408.08333)
- [Hallucinations in Code - Simon Willison](https://simonwillison.net/2025/Mar/2/hallucinations-in-code/)
- [SOK: Exploring Hallucinations and Security Risks](https://arxiv.org/html/2502.18468v1)
- [The 80% Problem in Agentic Coding - Addy Osmani](https://addyo.substack.com/p/the-80-problem-in-agentic-coding)
- [Anti-Pattern Avoidance for Safer AI-Generated Code](https://www.endorlabs.com/learn/anti-pattern-avoidance-a-simple-prompt-pattern-for-safer-ai-generated-code)
- [Understanding Anti-Patterns in AI-Generated Code](https://www.softwareseni.com/understanding-anti-patterns-and-quality-degradation-in-ai-generated-code/)
- [Demystifying Evals for AI Agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [Measuring AI Code Assistants and Agents](https://getdx.com/research/measuring-ai-code-assistants-and-agents/)
- [Claude Code Memory System](https://code.claude.com/docs/en/memory)
