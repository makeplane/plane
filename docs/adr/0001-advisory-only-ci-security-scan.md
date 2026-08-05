---
status: accepted
---

# Claude-based CI security scans are advisory-only, never block merges

The new CI pipeline uses the Claude API to scan PR diffs for issues like multi-tenancy
isolation gaps, starting with the Multi-Tenancy Isolation check. LLM-based scanning has
real false-positive risk, especially on day one before any check's precision has been
proven out against this codebase. We chose to always post the sticky PR comment with
findings but never fail the check or block merge, regardless of severity — reviewers get
the signal, but a hallucinated finding can't hold up a PR. This can be revisited to add
a blocking threshold (e.g. high severity + high confidence) once a check has enough of a
track record to trust.
