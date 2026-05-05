# Troubleshooting Guide

## Skill Won't Upload

**Error: "Could not find SKILL.md in uploaded folder"**
- Rename to exactly `SKILL.md` (case-sensitive). Verify with `ls -la`.

**Error: "Invalid frontmatter"**
- Ensure `---` delimiters on both sides
- Check for unclosed quotes in YAML
- Validate YAML syntax

**Error: "Invalid skill name"**
- Use either `skill-name` or `namespace:skill-name`
- Namespace and skill id must be kebab-case (no spaces, no capitals)
- Wrong: `My Cool Skill` → Correct: `ck:my-cool-skill`

## Skill Doesn't Trigger

**Symptom:** Skill never loads automatically.

**Checklist:**
- Is description too generic? ("Helps with projects" won't work)
- Does it include trigger phrases users would actually say?
- Does it mention relevant file types if applicable?

**Debug:** Ask Claude "When would you use the [skill-name] skill?" — adjust description based on response.

## Skill Triggers Too Often

**Solutions:**

1. **Add negative triggers:**
   ```yaml
   description: Advanced data analysis for CSV files. Use for statistical
     modeling, regression. Do NOT use for simple data exploration.
   ```

2. **Be more specific:**
   ```yaml
   # Bad: "Processes documents"
   # Good: "Processes PDF legal documents for contract review"
   ```

3. **Clarify scope:**
   ```yaml
   description: PayFlow payment processing for e-commerce. Use specifically
     for online payment workflows, not general financial queries.
   ```

## MCP Connection Issues

**Symptom:** Skill loads but MCP calls fail.

1. Verify MCP server is connected (Settings > Extensions)
2. Check API keys valid and not expired
3. Test MCP independently: "Use [Service] MCP to fetch my projects"
4. Verify skill references correct MCP tool names (case-sensitive)

## Instructions Not Followed

**Common causes and fixes:**

| Cause | Fix |
|---|---|
| Instructions too verbose | Use bullet points, move details to references/ |
| Critical info buried | Put at top, use `## CRITICAL` headers |
| Ambiguous language | Replace "validate properly" with specific checklist |
| Model skipping steps | Add "Do not skip validation steps" explicitly |

**Advanced:** For critical validations, bundle a script that performs checks programmatically. Code is deterministic; language interpretation isn't.

## Large Context Issues

**Symptom:** Skill seems slow or responses degraded.

**Solutions:**
1. Move detailed docs to `references/` — keep SKILL.md under 300 lines
2. Link to references instead of inlining content
3. Evaluate if too many skills enabled simultaneously (>20-50 may degrade)
4. Consider skill "packs" for related capabilities
