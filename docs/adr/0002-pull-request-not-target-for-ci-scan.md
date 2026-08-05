---
status: accepted
---

# CI security scan uses `pull_request`, not `pull_request_target`, and skips fork PRs

Plane is a public repo, so PRs from forks don't get repo secrets under the standard
`pull_request` trigger — GitHub blocks that by design. The Claude-based scanner needs
`ANTHROPIC_API_KEY` to run. We considered `pull_request_target` to extend the scan to
external contributors' PRs too, but rejected it: `pull_request_target` runs with base-repo
permissions and secrets against a workflow file from the base branch, and combining that
with analyzing untrusted PR head content is the exact pattern behind several real
GitHub Actions supply-chain CVEs. We chose to stay on `pull_request` and have the scan
silently skip (or post a neutral "unavailable for fork PRs" note) when no API key is
present, accepting that fork PRs don't get this automated scan — maintainers still review
those manually. Do not switch this to `pull_request_target` to "fix" fork coverage without
re-deriving this trade-off.
