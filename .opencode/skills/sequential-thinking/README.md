# Sequential Thinking Agent Skill

Structured, reflective problem-solving methodology converted from the sequential-thinking MCP server into a native Agent Skill.

## Overview

This skill teaches Claude to apply systematic sequential thinking methodology for complex problem-solving, without relying on external MCP tools. It enables:
- Breaking down complex problems into manageable thought sequences
- Dynamic adjustment of thought count as understanding evolves
- Revision of previous thoughts when new insights emerge
- Branching into alternative reasoning paths
- Hypothesis generation and verification

## Skill Structure

```
sequential-thinking/
├── SKILL.md (105 lines)
│   Core methodology, when to apply, scripts usage
│
├── package.json
│   Test dependencies (jest)
│
├── .env.example
│   Configuration options
│
├── scripts/
│   ├── process-thought.js (executable)
│   │   Validate and track thoughts deterministically
│   │
│   └── format-thought.js (executable)
│       Format thoughts for display (box/simple/markdown)
│
├── tests/
│   ├── process-thought.test.js
│   │   Validation, tracking, history tests
│   │
│   └── format-thought.test.js
│       Formatting tests (all formats)
│
└── references/
    ├── core-patterns.md (95 lines)
    │   Essential revision & branching patterns
    │
    ├── examples-api.md (88 lines)
    │   API design example walkthrough
    │
    ├── examples-debug.md (90 lines)
    │   Performance debugging example
    │
    ├── examples-architecture.md (94 lines)
    │   Architecture decision example
    │
    ├── advanced-techniques.md (76 lines)
    │   Spiral refinement, hypothesis testing, convergence
    │
    └── advanced-strategies.md (79 lines)
        Uncertainty management, revision cascades, meta-thinking
```

**Documentation**: 627 lines across 7 files (all under 100 lines)
**Scripts**: 2 executable Node.js scripts with tests

## Key Features

### Progressive Disclosure Design
Each file focuses on specific aspects, loaded only when needed:
- **SKILL.md**: Quick reference with core methodology
- **core-patterns.md**: Common patterns for everyday use
- **examples-*.md**: Real-world walkthroughs for learning
- **advanced-*.md**: Sophisticated techniques for complex scenarios

### Token Efficiency
- Concise explanations sacrifice grammar for brevity
- Examples demonstrate patterns without verbose explanation
- Cross-references between files avoid duplication

### Methodology Conversion
Extracted from MCP server's approach and converted to instructions:
- MCP tool provided **interface** for sequential thinking
- Agent skill provides **methodology** to think sequentially
- No dependency on external tools—pure instructional approach

## Usage Modes

**Explicit Mode**: Use visible thought markers
```
Thought 1/5: [Analysis]
Thought 2/5: [Further analysis]
```

**Implicit Mode**: Apply methodology internally without cluttering output

## When Claude Should Use This Skill

Automatically activated for:
- Complex problem decomposition
- Adaptive planning with potential revisions
- Debugging and root cause analysis
- Architecture and design decisions
- Problems with unclear or emerging scope
- Multi-step solutions requiring context

## Scripts Usage

### Process Thought (Validation & Tracking)

```bash
# Process a thought
node scripts/process-thought.js --thought "Initial analysis" --number 1 --total 5 --next true

# Process with revision
node scripts/process-thought.js --thought "Corrected analysis" --number 2 --total 5 --next true --revision 1

# Process with branching
node scripts/process-thought.js --thought "Branch A" --number 2 --total 5 --next true --branch 1 --branchId "branch-a"

# View history
node scripts/process-thought.js --history

# Reset history
node scripts/process-thought.js --reset
```

### Format Thought (Display)

```bash
# Box format (default)
node scripts/format-thought.js --thought "Analysis" --number 1 --total 5

# Simple text format
node scripts/format-thought.js --thought "Analysis" --number 1 --total 5 --format simple

# Markdown format
node scripts/format-thought.js --thought "Analysis" --number 1 --total 5 --format markdown

# With revision
node scripts/format-thought.js --thought "Revised" --number 2 --total 5 --revision 1

# With branch
node scripts/format-thought.js --thought "Branch" --number 2 --total 5 --branch 1 --branchId "a"
```

### Running Tests

```bash
# Install dependencies (first time only)
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## When to Use Scripts

**Use scripts when**:
- Need deterministic validation of thought structure
- Want persistent thought history tracking
- Require formatted output for documentation
- Building tools that integrate with sequential thinking

**Don't use scripts when**:
- Applying methodology directly in responses
- Want lightweight, inline thinking
- No need for validation or tracking

Scripts are **optional tooling** - the methodology can be applied without them.

## Source

Converted from: https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking

Original MCP server by Anthropic (MIT License).
Skill conversion:
- Extracts methodology as instructions
- Adds executable scripts for deterministic validation
- Makes tool-independent while preserving functionality
