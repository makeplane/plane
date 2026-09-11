---
name: graphify
description: Query and maintain this project's graphify knowledge graph (graphify-out/graph.json) to navigate the codebase with minimal token spend. Use before broad code searches or multi-file reads, when asked "how does X work here", "what calls Y", "what breaks if I change Z", or after significant code changes (graph update). Code-only extraction — never LLM/doc extraction.
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

# graphify — navigate the codebase via its knowledge graph

This project keeps a local knowledge graph in `graphify-out/graph.json`
(symbols with file+line locations, call/reference edges). Querying it is
offline and instant — prefer it over grepping or reading files one by one,
then open exactly the files/lines it points to.

## Queries (run from the project root)

```powershell
graphify query "<natural question or keywords>"   # BFS from name-matched nodes
graphify explain "<Symbol>"                       # one node + neighbors
graphify path "<A>" "<B>"                         # shortest path between nodes
graphify affected "<X>"                           # reverse impact: what depends on X
```

Note: `query` matches node *names* (fuzzy), not meanings — use identifiers
and domain words that likely appear as symbols/concepts ("AuthMiddleware",
"token refresh"), not full sentences. No hits → try `explain` with a known
symbol, or fall back to normal search (that's fine).

## Maintenance

- **No graph yet?** (`graphify-out/` missing): run `graphify extract .` —
  code-only corpora need no LLM/API key. If the repo has many non-code docs,
  extraction will ask for an LLM backend — in that case extract anyway (code
  is processed locally; doc extraction failing/skipped is acceptable) or ask
  the user. **Never configure an LLM backend without asking.**
- **After significant code changes:** `graphify update .` (also LLM-free).
- Keep `graphify-out/` in `.gitignore`.

## Rules

- Never run `graphify install` / `graphify <platform> install` — platform
  integrations are handled by the Arsenal (`graphify-nudge` hook), not
  upstream installers.
- Cross-repo graph merging (`graphify global add`) only on explicit user
  request.
- If `graphify` is not on PATH: `uv tool install graphifyy==0.9.5` (ask
  first — global install).
