# Rules testing — Zelian

> Valables sur tout projet. Adapter les outils selon la stack.

## Principes

1. **TDD obligatoire** — RED-GREEN-REFACTOR, imposé par Superpowers
2. Chaque feature a au minimum un test unitaire et un test d'intégration
3. Les tests tournent en CI — un test cassé bloque le merge
4. Pas de mocks de la BDD — utiliser une BDD de test réelle

## Stratégie par couche

| Couche | Type de test | Outil | Fréquence |
|--------|-------------|-------|-----------|
| Services / Logique métier | Unitaire | PHPUnit / Jest / Vitest | Chaque feature |
| Controllers / API | Intégration | PHPUnit / Supertest | Chaque endpoint |
| Composants UI | Composant | React Testing Library | Composants critiques |
| Flux complets | E2E | Playwright / Cypress | Parcours critiques |

## Conventions de nommage

- Fichiers de test : `*.test.ts`, `*.spec.ts`, `*Test.php`
- Describe : nom du module/service
- It/test : "should + comportement attendu" (en anglais)

## CI

- `npm test` / `php artisan test` / `vendor/bin/phpunit` doit passer sans erreur
- Coverage minimum recommandé : 60% (objectif, pas bloquant)
- Les tests E2E tournent sur les PR vers `main` uniquement

## Anti-patterns

- ❌ Tests qui testent l'implémentation (vérifier les résultats, pas les appels internes)
- ❌ Tests flaky (instables) — les corriger immédiatement ou les désactiver avec ticket
- ❌ `console.log` dans les tests
- ❌ Données de test en dur partagées entre tests (utiliser des factories/fixtures)
