# GitNexus: Khả Thi Áp Dụng cho Plane.so

**Ngày báo cáo:** 2026-05-04  
**Tác giả:** Researcher  
**Trạng thái:** Hoàn tất  

---

## Tóm Tắt Điều Hành

**GitNexus** là code intelligence tool mã nguồn mở (PolyForm Noncommercial license) chuyên tạo knowledge graph từ codebase, giúp AI agents (Claude Code, Cursor, Windsurf) hiểu rõ structure, dependency, và blast radius của thay đổi code. 

**Khuyến nghị:** Áp dụng dự kiến cho Plane.so, nhưng cần cân nhắc licensing + setup effort. Giá trị cao nhất cho refactor lớn và impact analysis; cost = learning curve + Node.js infra + license (nếu commercial).

---

## Định Danh "GitNexus"

**GitNexus** KHÔNG phải:
- Artifact repository (Sonatype Nexus, JFrog Artifactory)
- Git server self-hosted (Gitea, GitLab CE)
- Docker registry

**GitNexus LÀ:**
- Client-side code intelligence engine (runs in browser via WebAssembly)
- Knowledge graph indexer dùng Tree-sitter AST parsing
- MCP (Model Context Protocol) server for AI agents
- Open-source: github.com/abhigyanpatwari/GitNexus (28k+ stars, 45 contributors, Apr 2026)

---

## Phân Tích Kỹ Thuật

### 1. Kiến Trúc & Công Nghệ

**Indexing Pipeline:**
- Tree-sitter AST parsing → detect functions, classes, imports, call chains
- Cross-file resolution → function call graph, type inference
- Community detection (Leiden) → group related symbols
- Pre-computed blast radius → one MCP tool call = complete impact answer (vs. 4+ sequential queries)

**Storage:** LadybugDB (local) or WebAssembly in-browser; zero network transmission default

**Support Language:** 14+ languages (TypeScript, Python, Java, Go, Rust, C#, Swift, etc.) → Plane.so stack (React/TypeScript + Django/Python) fully supported

### 2. MCP Integration với Claude Code

**7 MCP Tools:**
- `impact_analysis` → risk assessment before commit
- `context_query` → 360° symbol view
- `process_search` → find symbols in execution flows
- `detect_changes` → map diffs to affected processes
- `coordinated_rename` → multi-file refactor
- `cypher_query` → raw graph traversal
- `manage_repos` → multiple indexed repos

**4 Agent Skills:** Exploring, Debugging, Impact Analysis, Refactoring (auto-installed)

**Auto-Context:** AGENTS.md + CLAUDE.md generated on setup → instant codebase awareness

### 3. Deployment Options

| Option | Setup | Cost | Infra |
|--------|-------|------|-------|
| **Web UI (Free)** | Drop repo ZIP at gitnexus.vercel.app | $0 | Vercel (no control) |
| **CLI (Free)** | `npm install -g gitnexus` | $0 + Node.js | Local dev machine |
| **Docker (Free)** | GHCR/Docker Hub, Cosign-signed | $0 | Docker runtime |
| **SaaS/Self-hosted** | Enterprise tier via akonlabs.com | $$$ | Managed or self |

### 4. License Restrictions

**Open-source:** PolyForm Noncommercial (NC)
- Use free = education, personal, non-commercial
- Commercial use = require separate license from akonlabs.com
- **For Plane.so:** If Plane.so is non-commercial (OSS project management) → free; if SHB (bank) deploy it commercially → need license

---

## So Sánh với Giải Pháp Hiện Tại

### Plane.so Hiện Tại
- **Git:** GitHub + GitHub Actions (public fork of makeplane/plane)
- **Code Navigation:** GitHub search, VSCode Intellisense, Grep
- **Refactor Risk:** Manual code review, pray nothing breaks
- **AI Agent Support:** None built-in (Claude Code has generic context)

### GitNexus Benefit
- **Pre-commit Impact:** Detect which files/functions affected before push
- **Refactor Safety:** Coordinated multi-file rename with blast radius scoring
- **AI-Native:** MCP tools = Claude Code understands monorepo structure natively
- **Debugging:** Execution flow tracing → faster RCA (root cause analysis)
- **Monorepo Aware:** Turborepo task graph + file graph = combined understanding

### Missing (vs. GitHub)
- No PR/merge workflow changes (GitNexus = analysis layer only)
- No CI/CD integration yet (index updates = manual or custom hook)
- No code review augmentation (pure knowledge graph tool)

---

## Đánh Giá Khả Thi Áp Dụng cho Plane.so

### ✅ Lợi Ích Cao

1. **Refactor Lớn:** SHB integration (LDAP, SwingSSO, CE pattern) = high-risk changes → GitNexus impact analysis saves days of manual testing
2. **Monorepo Clarity:** 5 React apps (web, admin, space, live) + Django backend = complex dependency → graph visualization + execution flow tracing = faster onboarding
3. **AI-Assisted Coding:** Claude Code + GitNexus MCP = understand blast radius in real-time while coding
4. **Team Size 4:** Small team = high leverage if tool prevents one breaking change (= 2–3 days of debugging)

### ⚠️ Chi Phí & Rủi Ro

| Dimension | Cost | Mitigation |
|-----------|------|-----------|
| **Learning Curve** | ~1–2 days setup + MCP config | Good docs, auto-setup (`npx gitnexus analyze`) |
| **Licensing** | $0 (free) if non-commercial; $$$$ if commercial SHB use | Clarify: is Plane.so free tier enough? SHB bank = commercial |
| **Node.js Infra** | Tree-sitter native bindings (need Node.js 18+) | Already have pnpm + Turborepo → no new stack |
| **Index Maintenance** | Manual or custom hook on git push | Can automate via git hooks or GitHub Actions |
| **Lock-In** | Proprietary MCP server format | Open-source CLI tools are portable; SaaS is lock-in |

### 📊 Team Fit Assessment

**Team:** 4 people, using Claude Code, managed by Git + GitHub  
**Codebase:** Monorepo (pnpm), multiple apps, frequent refactors (calendar, categories, SHB integration)  
**Tool Adoption:** Willing (using Claude Code, .claude/rules already in place)

**Verdict:** **MEDIUM-HIGH FIT** — small team benefits most from automated impact analysis; tradeoff is licensing clarity + Node.js dependency.

---

## Khuyến Nghị Cuối Cùng

### Nên Áp Dụng Nếu:
1. Planning refactor lớn (SHB integration, CE pattern cleanup)
2. Need AI-assisted code analysis (Claude Code becomes more powerful)
3. Clarify: Plane.so tier is non-commercial → free license is ok
4. Willing allocate 2–3 hours setup: index repo + MCP config + test impact analysis tool

### Không Nên Nếu:
1. SHB expects commercial Plane.so license → negotiate GitNexus commercial license first
2. Unwilling add Node.js dependency to dev environment
3. Need real-time CI/CD integration today (GitNexus indexing = manual trigger or custom hook)

### Thiết Kế Thí Nghiệm (Proof-of-Concept)

**Phase 1 (2–3 giờ):**
```bash
npx gitnexus analyze <plane.so git root>
# Generates AGENTS.md + CLAUDE.md + local index
```

**Phase 2 (1–2 giờ):**
- Test `impact_analysis` tool on recent calendar/categories refactor
- Compare GitNexus recommendations vs. actual PR changes
- Measure: did it catch all affected files?

**Phase 3 (Quyết định):**
- If PoC = 90%+ accuracy on blast radius → adopt + setup CI hook for auto-index
- If PoC = <70% → skip for now, revisit in Q3 2026

**Cost PoC:** ~5–6 hours, $0 license, learnings valuable regardless of adoption

---

## Unresolved Questions

1. **Licensing:** Is Plane.so classified as non-commercial (free tier) or commercial (SHB integration = paid)? Affects license cost.
2. **Index Performance:** Plane.so has ~500k lines code (5 apps + backend). Does GitNexus handle this scale efficiently? (PoC will answer.)
3. **CI/CD Auto-Index:** Does team want automated re-indexing on every push, or manual trigger is ok? (Affects setup complexity.)
4. **Multi-Repo MCP:** Plane.so = monorepo; does GitNexus MCP correctly handle cross-app dependencies (e.g., @plane/propel used by multiple apps)?

---

## Sources

- [GitNexus GitHub Repository](https://github.com/abhigyanpatwari/GitNexus)
- [Meet GitNexus: An Open-Source MCP-Native Knowledge Graph Engine — MarkTechPost](https://www.marktechpost.com/2026/04/24/meet-gitnexus-an-open-source-mcp-native-knowledge-graph-engine-that-gives-claude-code-and-cursor-full-codebase-structural-awareness/)
- [GitNexus: The Tool That Gives AI Agents a Nervous System for Code — Medium](https://medium.com/@reliabledataengineering/gitnexus-the-tool-that-gives-ai-agents-a-nervous-system-for-code-7c9e7ceb58d6)
- [GitNexus: Zero-Server Code Intelligence for AI Agents That Actually Works — YUV.AI Blog](https://yuv.ai/blog/gitnexus)
- [Client-Side RAG: Building Knowledge Graphs in the Browser with GitNexus — SitePoint](https://www.sitepoint.com/client-side-rag-building-knowledge-graphs-in-the-browser-with-gitnexus/)
