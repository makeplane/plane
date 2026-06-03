# AI/LLM Prompt Injection Audit Module

> **Module ID:** PRM-INJ-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** AI Application Security & Agent Permission Boundary Assessment

---

## 1. Overview

Audits applications using AI features, LLM integrations, or AI agents for prompt injection, privilege escalation, and authorization bypass vulnerabilities. Covers the three attack classes (direct, indirect, cross-privilege injection), tool/function calling security, MCP server security, and AI permission boundaries.

**When to use:** Target application uses AI/LLM features, chatbots, AI agents, or MCP integrations. Also useful during code audit when LLM API calls are discovered.

**Ethical boundary:** Audit code the user provides. Provide defensive remediation. No attack payloads for unauthorized use. CTF/red team contexts allow test payloads.

---

## 2. Background

Prompt injection is **#1 vulnerability** in LLM-integrated applications (OWASP Top 10 for LLMs, LLM01). Occurs when untrusted input influences LLM instructions, causing it to ignore system prompt, leak secrets, or take unauthorized actions.

### Three Attack Classes

| Class                         | Vector                                        | Example                                                |
| ----------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| **Direct injection**          | Attacker input directly to LLM                | Chat input, form field processed by AI                 |
| **Indirect injection**        | Malicious instructions in consumed data       | Web pages, emails, documents, RAG chunks, tool outputs |
| **Cross-privilege injection** | Lower-priv user plants payload in shared data | Comment with injection read by admin's AI session      |

---

## 3. Investigation Workflow

```
1. Map AI attack surface — find all LLM API calls and AI features
2. Audit prompt construction — unsanitized interpolation, missing boundaries
3. Audit output handling — rendered as HTML, executed as code, used in SQL
4. Audit tool/function calling — argument validation, destructive tool gating
5. Audit AI agents — unbounded loops, memory poisoning, multi-agent delegation
6. Check prompt leaking — system prompt extraction vectors
7. Audit permission boundaries — confused deputy, privilege escalation, multi-tenant leakage
8. Assess defense layers — input/output validation, rate limiting, monitoring
```

---

## 4. AI Attack Surface Mapping

### Grep Patterns for LLM API Calls

```
openai, anthropic, cohere, replicate, ollama
ChatCompletion, messages.create, generate, complete
langchain, llamaindex, autogen, crewai
```

### AI Features to Identify

- AI-powered search or recommendations
- AI content generation (summaries, descriptions, emails)
- AI chatbots or copilots embedded in app
- AI-assisted form completion or auto-fill
- AI moderation or classification
- AI-driven workflow automation
- MCP server connections and tool registrations

### Document for Each Integration

1. What is the system prompt? (read fully)
2. What user input reaches the prompt?
3. What external data reaches the prompt? (RAG, tools, web, DB, files)
4. What actions can the LLM take? (tools, code exec, DB writes, API calls)
5. How is LLM output used downstream? (HTML, code, SQL, another LLM)
6. What permissions context does the AI operate under?

---

## 5. Prompt Construction Vulnerabilities

### Unsanitized Interpolation (VULNERABLE)

```python
prompt = f"Summarize this: {user_input}"
prompt = f"Answer based on this context: {rag_results}"
```

### Missing Boundaries (VULNERABLE)

```python
# No delimiter between instructions and data
prompt = "Summarize: " + user_input
```

### Proper Delimiting (BETTER)

```python
prompt = f"""Summarize the text between the <document> tags.
<document>
{user_input}
</document>"""
```

### Secrets in System Prompts (VULNERABLE)

```python
system = f"You are a helper. Use API key {API_KEY} to call..."
```

---

## 6. Output Handling Vulnerabilities

| Output Use            | Risk              | Example                                             |
| --------------------- | ----------------- | --------------------------------------------------- |
| Rendered as HTML      | XSS via LLM       | `dangerouslySetInnerHTML={{ __html: llmResponse }}` |
| Executed as code      | RCE               | `exec(llm_response)`                                |
| Used in DB queries    | SQLi              | `cursor.execute(f"SELECT * FROM {llm_response}")`   |
| Passed to another LLM | Chained injection | LLM A output becomes LLM B input                    |

---

## 7. Tool/Function Calling & Agent Security

### Tool Call Validation

```python
# VULNERABLE — no validation
result = execute_tool(tool_name=llm_choice, args=llm_args)

# BETTER — allowlist + validation + confirmation
if tool_name not in ALLOWED_TOOLS:
    raise ValueError("Tool not permitted")
validated_args = validate_tool_args(tool_name, llm_args)
if tool_name in DESTRUCTIVE_TOOLS:
    require_user_confirmation(tool_name, validated_args)
```

### Agent-Specific Risks

| Risk                   | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| Unbounded loops        | Missing iteration limits, token budgets, timeouts          |
| Memory poisoning       | Untrusted data writing to persistent memory/vector store   |
| Multi-agent delegation | Agent-to-agent messages treated as trusted                 |
| Self-modification      | Agent can modify own instructions, tools, or system prompt |
| MCP server injection   | Malicious MCP server registration, unscoped tools          |
| Code execution         | Missing sandbox, filesystem/network restrictions           |

---

## 8. Permission Boundary Audit

### Confused Deputy Check

- Does AI use service account with broad permissions? (bypasses row-level security)
- Does AI execute under requesting user's permissions? (correct approach)

### Privilege Escalation Vectors

- Read-only user triggers AI write operations
- User queries other users' records through AI
- AI-generated tool calls bypass permission checks
- User input causes AI to call admin-only endpoints

### Multi-Tenant Data Leakage

- RAG retrieval filtered by tenant?
- AI-generated queries tenant-scoped?
- Shared AI features isolate tenant data?

### Permission Check Checklist

| Check                                                         | Status |
| ------------------------------------------------------------- | ------ |
| AI tool calls go through same auth middleware as user actions |        |
| AI database queries scoped to requesting user's permissions   |        |
| RAG retrieval filtered by tenant/user access level            |        |
| AI cannot access admin APIs on behalf of non-admin users      |        |
| Shared data consumed by AI treated as untrusted input         |        |
| AI feature access gated by user role                          |        |

---

## 9. Defense Layer Assessment

| Defense                       | Present? | Notes |
| ----------------------------- | -------- | ----- |
| Input validation/sanitization |          |       |
| Prompt delimiters             |          |       |
| Output validation             |          |       |
| Tool call validation          |          |       |
| Privilege separation          |          |       |
| User-scoped AI queries        |          |       |
| Agent loop limits             |          |       |
| Agent memory isolation        |          |       |
| MCP server auth               |          |       |
| Rate limiting                 |          |       |
| Monitoring/logging            |          |       |
| Human-in-the-loop             |          |       |

---

## 10. Output Format

```markdown
# Prompt Injection Audit Report

## Application: [name]

## Date: [date]

### LLM Integration Map

| Integration | Model | User Input? | External Data? | Tools? | Output Usage |
| ----------- | ----- | ----------- | -------------- | ------ | ------------ |

### Findings

#### [SEVERITY] [Title]

**File:** `path/to/file:line`
**Category:** Direct/Indirect/Cross-Privilege/Prompt Leaking/Insecure Output/Tool Abuse/Agent Security/Permission Bypass
**Description:** [vulnerability]
**Attack scenario:** [how attacker exploits this]
**Vulnerable code:** [snippet]
**Remediation:** [fix with explanation]

### Defense Assessment

| Defense Layer | Status | Recommendation |
| ------------- | ------ | -------------- |

### Prioritized Remediation

1. [Critical — permission bypass, privilege escalation, multi-tenant leakage]
2. [Critical — exploitable injection with tool/agent access]
3. [High — unsanitized input in prompts, agent memory poisoning]
4. [Medium — missing output validation, unbounded agent loops]
5. [Low — defense-in-depth, monitoring gaps]
```

---

## 11. References

- OWASP Top 10 for LLM Applications (LLM01, LLM08)
- NIST AI Risk Management Framework (AI 100-1)
- Anthropic prompt injection mitigations
- Simon Willison's prompt injection research
- MITRE ATLAS (Adversarial Threat Landscape for AI Systems)
- Model Context Protocol specification (security considerations)
