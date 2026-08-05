# Domain Glossary

## Claude-based CI code scanning

- **Check** — A registered, self-contained unit of static analysis performed
  by the CI scanner (e.g. "Multi-Tenancy Isolation"). Defined by an id, a
  description, the file globs it applies to within a PR's diff, and a
  detection rule that Claude evaluates. The scanner is a registry of Checks;
  adding a new Check does not require restructuring the scanner itself.

- **Finding** — A single reported issue produced when a Check's detection
  rule is violated in a PR's diff. Always attributed to exactly one Check,
  and to a specific file/line in the diff.

- **Multi-Tenancy Isolation** — The property that a user's access to
  workspace-, project-, or member-scoped resources is enforced server-side,
  independent of any id the client supplies in the request. This is the
  subject of the scanner's first Check. It is broader than IDOR: it also
  covers isolation gaps with no id-spoofing involved at all (e.g. a queryset
  missing a workspace/project filter, leaking cross-tenant data).

- **IDOR (Insecure Direct Object Reference)** — One specific mechanism by
  which Multi-Tenancy Isolation can be violated: a user-controlled id taken
  from the request (path parameter, query parameter, or body — e.g.
  `member_id`, `user_id`, a workspace slug, a project id) is used to
  access or mutate a resource without the server verifying the requesting
  user actually has rights to that specific id's resource.

- **Baseline Scan** — A manually-triggered run of every registered Check
  against the full contents of its target files, rather than a PR's diff.
  Exists because the day-to-day PR scan only ever evaluates newly changed
  code going forward; a Baseline Scan is how pre-existing issues in
  untouched code get surfaced. Reuses the same Check registry and detection
  rules as the PR scan — only the input framing differs (whole file content
  instead of diff hunks) and only the reporting surface differs (a workflow
  job summary, since there's no PR to comment on).
