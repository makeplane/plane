# Reasoning Techniques Deep Dive

## Chain of Thought (CoT) Variants

### Zero-Shot CoT
```
[Task description]

Think step by step before answering.
```
**Use when**: Quick reasoning, no examples available
**Effectiveness**: +40-60% on reasoning tasks

### Few-Shot CoT
```
Example 1:
Q: [Question]
A: Let me think through this...
   Step 1: [Reasoning]
   Step 2: [Reasoning]
   Therefore: [Answer]

Example 2:
Q: [Question]
A: Breaking this down...
   First: [Reasoning]
   Next: [Reasoning]
   So: [Answer]

Now solve:
Q: [Your question]
```
**Use when**: Complex reasoning, pattern demonstration needed
**Effectiveness**: +50-80% on complex tasks

### Auto-CoT
```
Let me approach this systematically:
1. Identify the key elements
2. Analyze relationships
3. Apply relevant principles
4. Draw conclusions
5. Verify my reasoning
```
**Use when**: General problem-solving, exploratory reasoning

## Tree of Thoughts (ToT)

### Implementation Pattern
```
Problem: [Complex problem]

Generate 3 different approaches:

Approach A:
- Method: [Description]
- Reasoning: [Why this might work]
- Potential issues: [Risks]
- Confidence: [1-10]

Approach B:
- Method: [Description]
- Reasoning: [Why this might work]
- Potential issues: [Risks]
- Confidence: [1-10]

Approach C:
- Method: [Description]
- Reasoning: [Why this might work]
- Potential issues: [Risks]
- Confidence: [1-10]

Evaluate branches:
- Which has highest success probability?
- Which has fewest risks?
- Which is most feasible?

Selected approach: [Best option with justification]
Execution: [Step-by-step implementation]
```

**Use when**: Strategic decisions, multiple valid paths, high-stakes problems

## Self-Consistency

### Process
1. Generate 5 responses at temp=0.7
2. Extract final answers from each
3. Take majority vote
4. Report confidence = agreement %

### Implementation
```
Run this prompt 5 times (or use n=5 parameter):
[Your reasoning task]
Think step by step and provide final answer.

Aggregate: If 4/5 agree = high confidence
          If 3/5 agree = medium confidence
          If split = low confidence, needs review
```

**Use when**: Math, logic, factual questions with verifiable answers

## ReAct (Reasoning + Acting)

### Full Pattern
```
Task: [Goal to achieve]

Thought 1: I need to understand the current situation.
Action 1: [Observation or tool use]
Observation 1: [Result from action]

Thought 2: Based on this, I should [next logical step].
Action 2: [Next action]
Observation 2: [Result]

Thought 3: Now I can see that [insight].
Action 3: [Verification or next step]
Observation 3: [Result]

Thought 4: I have enough information to conclude.
Final Answer: [Conclusion with reasoning]
```

**Use when**: Tool-augmented reasoning, research tasks, multi-step analysis

## Least-to-Most Prompting

### Structure
```
Complex problem: [Full problem statement]

Step 1: Decomposition
Break this into simpler subproblems, ordered from easiest to hardest:
1. [Simplest subproblem]
2. [Next subproblem, may depend on 1]
3. [Harder subproblem, may depend on 1,2]
4. [Final subproblem requiring all above]

Step 2: Sequential Solution
Subproblem 1: [Solution]
Using result from 1, Subproblem 2: [Solution]
Using results from 1,2, Subproblem 3: [Solution]
Using all results, Subproblem 4: [Solution]

Final integrated answer: [Complete solution]
```

**Use when**: Mathematical word problems, multi-step procedures, compositional tasks

## Decomposed Prompting (DECOMP)

### Pattern
```
Task: [Complex task]

Required capabilities:
- [Capability 1]: Use [specialized prompt/tool]
- [Capability 2]: Use [specialized prompt/tool]
- [Capability 3]: Use [specialized prompt/tool]

Orchestration:
1. Call [Capability 1] with [input] → get [output1]
2. Call [Capability 2] with [output1] → get [output2]
3. Call [Capability 3] with [output2] → get [final output]

Integrate results: [Final response]
```

**Use when**: Tasks requiring diverse expertise, specialized sub-tasks

## Constitutional AI Reasoning

### Self-Critique Pattern
```
Initial response: [Generated content]

Critique against principles:
- Is it helpful? [Yes/No + reasoning]
- Is it harmless? [Yes/No + reasoning]
- Is it honest? [Yes/No + reasoning]

If any No:
Revised response that addresses [specific issues]:
[Improved content]
```

## Choosing the Right Technique

| Task Type | Best Technique |
|-----------|---------------|
| Simple reasoning | Zero-shot CoT |
| Complex multi-step | Few-shot CoT |
| Strategic decisions | Tree of Thoughts |
| Factual verification | Self-Consistency |
| Tool-using tasks | ReAct |
| Word problems | Least-to-Most |
| Specialized sub-tasks | DECOMP |
| Safety-critical | Constitutional AI |
