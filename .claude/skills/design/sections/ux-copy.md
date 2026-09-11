# /design — ux-copy mode

Write or review UX copy for any interface context — microcopy, button
labels, error messages, empty states, confirmation dialogs, tooltips,
loading states, onboarding text. Merged from the former `ux-copy` skill.

## When you use it (entry triggers)

User says "write copy for X", "what should this button say?", "review this
error message", or asks to name a CTA, word a confirmation dialog, fill an
empty state, or write onboarding text. Handles single elements and full
flows. Includes writing brand-voice-aware copy (see `references/brand/`)
and reviewing existing copy against the principles below.

## Where on the spine

**No Explore** — copy is a single artifact; the design language comes from
Consult.

- **Consult** — adopt `design/DESIGN.md`'s voice/tone context.
  For brand-bearing copy, read the voice guidelines in
  `references/brand/brand-voice/` (tone flexes, enforcement before/after
  examples, confidence scoring) and stay inside the voice range — the
  taste gate's voice constants apply (`references/taste-gate.md`).
- **Build** — write the copy block using the patterns below.
- **Verify** — principles checklist + tone/voice check.

## Output layout (D17 + D19)

```
design/copy/
├── v1.md         ← drafts while iterating (copy usually settles fast)
└── <context>-copy.md   ← settled copy block (version suffix dropped)
```

Also write the "Recommended Copy" snippet back into the associated mockup
(`design/<screen>/<screen>.html`) when the screen exists. Never
`final`/`finalized`.

## What I need from you (when starting from scratch)

- **Context**: what screen, flow, or feature?
- **User state**: what is the user trying to do? how are they feeling?
- **Tone**: formal, friendly, playful, reassuring?
- **Constraints**: character limits, platform guidelines?

When none is given, ask **one** targeted question (context or user state
is usually the deciding gap), then proceed.

## Principles

1. **Clear** — say exactly what you mean. No jargon, no ambiguity.
2. **Concise** — fewest words that convey the full meaning.
3. **Consistent** — same terms for the same things everywhere.
4. **Useful** — every word helps the user accomplish their goal.
5. **Human** — write like a helpful person, not a robot.

## Copy patterns

### CTAs
- Start with a verb: "Start free trial", "Save changes", "Download report".
- Be specific: "Create account", not "Submit".
- Match the outcome to the label (the button does what it says).

### Error messages
Structure: **What happened + Why + How to fix**.
- "Payment declined. Your card was declined by your bank. Try a different
  card or contact your bank."

### Empty states
Structure: **What this is + Why it's empty + How to start**.
- "No projects yet. Create your first project to start collaborating with
  your team."

### Confirmation dialogs
- Make the action clear: "Delete 3 files?" not "Are you sure?".
- Describe consequences: "This can't be undone".
- Label buttons with the action: "Delete files" / "Keep files", not
  "OK" / "Cancel".

### Tooltips
Concise, helpful, never stating the obvious.

### Loading states
Set expectations and reduce anxiety ("Fetching your latest report…").

### Onboarding
Progressive disclosure — one concept at a time.

## Voice and tone (adapt to context)

| Context | Tone |
|---|---|
| Success | Celebratory but not over the top |
| Error | Empathetic and helpful |
| Warning | Clear and actionable |
| Neutral | Informative and concise |

## Output template

```markdown
## UX Copy: [Context]

### Recommended Copy
**[Element]**: [Copy]

### Alternatives
| Option | Copy | Tone | Best For |
|--------|------|------|----------|
| A | [Copy] | [Tone] | [When to use] |
| B | [Copy] | [Tone] | [When to use] |
| C | [Copy] | [Tone] | [When to use] |

### Rationale
[Why this copy works — user context, clarity, action-orientation]

### Localization Notes
[Anything translators should know — idioms to avoid, character
expansion, cultural context]
```

### Worked example (empty state, "friendly but professional")

**Recommended**: Empty state — "No projects yet." Body — "Create your
first project to start collaborating with your team." CTA — **Create
project**.

Alternatives table:

| Option | Copy | Tone | Best For |
|--------|------|------|----------|
| A | "No projects yet. Create your first project to start collaborating." | Friendly | New users |
| B | "You have no projects. Start one to get going." | Neutral | Returning users |
| C | "Your workspace is empty. Begin by creating a project." | Professional | Admin/enterprise |

**Rationale**: A names the state (What this is), explains the cause
(Why it's empty), and gives the next action (How to start) — matching the
empty-state structure.

### Review pass (copy review)

Review flows return a tighter report per element — **original →
recommended → why**:

| Element | Original | Recommended | Why |
|---|---|---|---|
| CTA | "Submit" | "Save changes" | Action-specific; matches the outcome |
| Error | "Invalid input" | "That email doesn't look right. Try name@example.com." | What/Why/How structure; human |
| Empty state | "No data" | "No projects yet. Create your first project to start collaborating." | Names the state + next action |

## Connectors (optional, user-configured)

If a **knowledge base** connector is connected: pull the brand voice
guidelines and content style guide; check for existing copy patterns and
terminology standards before writing. If a **design tool** connector is
connected: view the screen context to check character limits and layout
constraints. Neither is ever required, and nothing is fetched by the
skill itself.

## Tips

1. **Be specific about context** — "Error message when payment fails" is
   better than "error message".
2. **Share your brand voice** — "We're professional but warm" helps match
   the tone.
3. **Consider the user's emotional state** — error messages need empathy;
   success messages can celebrate.

## Verify

1. **Principles** — clear, concise, consistent, useful, human.
2. **Pattern fit** — error messages carry What/Why/How; empty states carry
   What/Why/Start; CTAs start with a verb.
3. **Voice gate** — copy stays inside the brand voice range
   (`references/brand/brand-voice/`); no off-brand cleverness
   (`references/taste-gate.md` §4).
4. **Alternatives** — at least one alternative per element when tone is
   uncertain.
5. **Settle** — rename the current draft to `<context>-copy.md` (drop the
   version suffix) and link it back into the mock/spec.

## Inputs

`[context] [user state] [tone] [constraints]` — e.g. "empty state for the
dashboard when no projects exist, new user, friendly but professional,
max 2 lines". Existing copy to review can be pasted directly.
