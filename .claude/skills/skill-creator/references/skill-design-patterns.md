# Skill Design Patterns

Five proven patterns for structuring skills. Choose based on workflow type.

## Choosing Approach: Problem-First vs Tool-First

- **Problem-first:** "I need to set up a project workspace" → skill orchestrates the right calls in sequence. Users describe outcomes; skill handles tools.
- **Tool-first:** "I have Notion MCP connected" → skill teaches optimal workflows and best practices. Users have access; skill provides expertise.

## Pattern 1: Sequential Workflow Orchestration

**Use when:** Multi-step processes must happen in specific order.

**Key techniques:**
- Explicit step ordering with dependencies
- Validation at each stage
- Rollback instructions for failures

```markdown
## Workflow: Onboard New Customer
### Step 1: Create Account
Call MCP tool: `create_customer` → Parameters: name, email, company
### Step 2: Setup Payment
Call MCP tool: `setup_payment_method` → Wait for verification
### Step 3: Create Subscription
Call MCP tool: `create_subscription` → Uses customer_id from Step 1
```

## Pattern 2: Multi-MCP Coordination

**Use when:** Workflows span multiple services (Figma → Drive → Linear → Slack).

**Key techniques:**
- Clear phase separation
- Data passing between MCPs
- Validation before moving to next phase
- Centralized error handling

## Pattern 3: Iterative Refinement

**Use when:** Output quality improves with iteration (reports, documents).

**Key techniques:**
- Generate initial draft → validate with script → refine → re-validate
- Explicit quality criteria and "stop iterating" conditions
- Bundled validation scripts for deterministic checks

## Pattern 4: Context-Aware Tool Selection

**Use when:** Same outcome, different tools depending on context.

**Key techniques:**
- Decision tree based on inputs (file type, size, destination)
- Fallback options when primary tool unavailable
- Transparency about why a tool was chosen

## Pattern 5: Domain-Specific Intelligence

**Use when:** Skill adds specialized knowledge beyond tool access (compliance, finance).

**Key techniques:**
- Domain rules embedded in logic (compliance checks before action)
- Comprehensive audit trails
- Clear governance and documentation of decisions

## Use Case Categories

### Category 1: Document & Asset Creation
Creates consistent output (documents, presentations, apps, designs). Uses embedded style guides, templates, quality checklists. No external tools required.

### Category 2: Workflow Automation
Multi-step processes with consistent methodology. Uses step-by-step workflows with validation gates, templates, iterative refinement loops.

### Category 3: MCP Enhancement
Workflow guidance atop MCP tool access. Coordinates multiple MCP calls, embeds domain expertise, handles common MCP errors.
