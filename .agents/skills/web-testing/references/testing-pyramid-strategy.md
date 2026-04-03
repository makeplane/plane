# Testing Strategy Models

## Model Comparison

| Model | Structure | Best For |
|-------|-----------|----------|
| Pyramid | Unit 70% > Integration 20% > E2E 10% | Monoliths, logic-heavy |
| Trophy (Dodds) | Static > Integration (largest) > Unit > E2E | Modern SPAs |
| Honeycomb (Spotify) | Contract-centric cells | Microservices |
| Diamond | Balanced unit/integration | Domain services |

## Testing Trophy (Recommended for SPAs)

```
         E2E (minimal)
        /------------\
       / Integration  \   <-- Largest portion
      /----------------\
     /   Unit Tests     \
    /--------------------\
   /   Static Analysis    \  <-- Foundation
  /________________________\
```

**Philosophy:** "The more your tests resemble how software is used, the more confidence they give you." - Kent C. Dodds

**Key Principles:**
- Test behavior, not implementation
- Minimize mocking
- Prioritize integration tests
- Use accessible queries (getByRole first)

## Testing Honeycomb (Microservices)

Contract testing at center, interconnected cells for:
- Unit tests (implementation details)
- Integration tests (service boundaries)
- Contract tests (API agreements)
- E2E tests (critical paths only)

## Ratios by Context

| Context | Unit | Integration | E2E |
|---------|------|-------------|-----|
| Classic Pyramid | 70% | 20% | 10% |
| Testing Trophy | 30% | 50% | 10% |
| API-heavy | 75% | 15% | 10% |
| Microservices | 40% | 40% | 20% |

## Priority Matrix

| Priority | Category | Examples |
|----------|----------|----------|
| P0 | Core flows | Signup, login, checkout, payment |
| P1 | Major features | Search, CRUD, navigation |
| P2 | Secondary | Filters, sorting, pagination |
| P3 | Edge cases | Empty states, max limits |

## Coverage Targets

| Area | Target |
|------|--------|
| Critical paths | 100% |
| Core features | 80-90% |
| Overall | 75-85% |

**Note:** Coverage as diagnostic, not target. Focus on what's uncovered.

## CI/CD Order

```yaml
- run: npm run lint          # Gate 0: Static analysis
- run: npm run test:unit     # Gate 1: Fast fail
- run: npm run test:integration # Gate 2
- run: npm run test:e2e      # Gate 3: Pre-merge
```
