# Plane Change Impact

Base: `working_tree`

## Changed Paths

- `.agents/skills/plane-doc-code-loop/SKILL.md`
- `.agents/skills/plane-doc-code-loop/agents/openai.yaml`
- `.agents/skills/plane-doc-consistency-review/SKILL.md`
- `.agents/skills/plane-doc-consistency-review/agents/openai.yaml`
- `.agents/skills/plane-project-understand/SKILL.md`
- `.agents/skills/plane-project-understand/agents/openai.yaml`
- `.github/workflows/plane-ai-doc-loop.yml`
- `.plane-ai-doc-loop/manifest.json`
- `.plane-ai-doc-loop/runtime/Install-CodexPlaneSkills.ps1`
- `.plane-ai-doc-loop/runtime/Install-PlaneDocLoop.ps1`
- `.plane-ai-doc-loop/runtime/Invoke-PlaneDocLoop.ps1`
- `.plane-ai-doc-loop/runtime/Test-PlaneDocLoop.ps1`
- `.plane-ai-doc-loop/runtime/Test-PlaneFrontend.ps1`
- `.plane-ai-doc-loop/runtime/Test-PlanePrerequisites.ps1`
- `.plane-ai-doc-loop/runtime/check_doc_gate.py`
- `.plane-ai-doc-loop/runtime/impact_from_git_diff.py`
- `.plane-ai-doc-loop/runtime/plane_repo_snapshot.py`
- `.plane-ai-doc-loop/runtime/test_ci_cold_start.py`
- `.plane-ai-doc-loop/runtime/test_doc_gate.py`
- `.plane-ai-doc-loop/runtime/validate_semantic.py`
- `.plane-ai-doc-loop/runtime/validate_skills.py`
- `.plane-ai-doc-loop/runtime/validate_workflow.py`
- `docs/ai/README.md`
- `docs/ai/architecture.md`
- `docs/ai/change-request-template.md`
- `docs/semantic/change_declaration.json`
- `docs/semantic/docs_index.json`
- `docs/semantic/domains.json`
- `docs/semantic/local_scan.json`
- `docs/semantic/mappings.json`
- `docs/semantic/open_questions.json`
- `docs/semantic/reverse_index.json`

## Impact Groups

- `configuration`: 5
- `documentation`: 3
- `other`: 17
- `semantic_model`: 7

## Required Follow-ups

- Run .plane-ai-doc-loop/runtime/validate_semantic.py and regenerate derived docs.
