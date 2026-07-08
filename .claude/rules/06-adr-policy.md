# Politique ADR — Zelian (v2.3.0+)

> Règle absolue applicable à tout projet Zelian. Fichier copié depuis le plugin `zelian-framework` par `/zelian:init` et `/zelian:retro` — ne pas modifier au projet.
>
> **Cible** : tout agent ou humain qui s'apprête à créer un nouveau fichier `docs/adr/ADR-XXX.md` ou `docs/adr/RETRO-XXX.md`.
>
> **Objectif** : un ADR est une **contrainte infranchissable**, pas une note technique. Toute décision qui ne passe pas la checklist ci-dessous va en `spec-technique.md`, **PAS** en ADR.

---

## 1. Pourquoi cette politique existe

Sur le projet pilote `2026-business-rte-netmap` (NestJS + React, carto temps réel), le framework v2.2.0 a généré **39 ADR** dont **seuls 10 (26%) étaient de vrais ADR architecturaux**. Les 29 autres documentaient des choix de libs, des configurations d'outils, des heuristiques d'implémentation, ou des workarounds locaux — toutes informations qui appartiennent à `spec-technique.md`.

**Conséquence** : la pollution dilue le signal. Un dev (ou Claude Code) qui ouvre `docs/adr/` ne voit plus les vraies contraintes architecturales — elles sont noyées dans le bruit.

**Cette politique impose un filtre strict avant toute création d'ADR par un agent automatique** (`@retro-documenter`, `@update-writer-after-implement`).

---

## 2. Whitelist — les 8 catégories autorisées

Un ADR n'est créé QUE si la décision appartient à **exactement une** des 8 catégories suivantes. Aucune autre catégorie n'est acceptée.

| Code | Quand utiliser | Exemples valides |
|------|----------------|------------------|
| **STACK** | Choix d'un langage, runtime, ou framework principal qui structure tout le projet. | « NestJS plutôt que Express », « PostgreSQL plutôt que MySQL », « TypeScript-first ». |
| **AUTH** | Stratégie d'authentification, gestion des sessions, gestion des tokens, multi-tenancy. | « JWT stateless avec refresh token », « Auth via Supabase GoTrue », « Scoping par envName ». |
| **DB-STRATEGY** | Modèle fondamental de stockage qui influence toute lecture/écriture. | « Raw + compute-on-read » (ne pas matérialiser le calcul), « Event sourcing », « Sharding par tenant ». |
| **SECURITY** | Invariant de sécurité, contrôle d'accès, exclusion explicite, donnée sensible. | « Whitelist des fichiers sensibles à exclure », « RLS systématique », « Pas de logging des credentials ». |
| **DATA-MODEL** | Invariant métier critique, modèle de données structurant, immutabilité. | « Cascade 5 niveaux par champ », « envName first-class sur toute requête », « `dumpType` immutable post-ingest ». |
| **REPRODUCIBILITY** | Décision sur le timestamping, la classification au write, ou tout mécanisme garantissant la reproductibilité historique. | « `effectiveDate` découplée de `uploadedAt` », « Classification au moment de l'ingestion, pas de la lecture ». |
| **BREAKING-CHANGE** | Rupture de contrat (API, schéma, format) avec migration de données ou de clients. | « Suppression de l'endpoint `/snapshots` v1 avec migration data », « Renommage de table avec backfill ». |
| **DESIGN** | Adoption d'un **design system structurant** et de ses conventions inviolables (transverses, `Features: *`) : kit UI imposé, tokens de thème, règle « toute UI compose depuis le kit ». **PAS** un simple choix de lib ponctuel (→ AP-1). | « Design system = kit ZenithDashboard ; toute page compose depuis `template-sample/` », « Palette/tokens centralisés, aucune couleur custom hors thème ». |

**Si aucune catégorie ne correspond → ne PAS créer d'ADR.** Documente la décision en `spec-technique.md` du module concerné.

---

## 3. Checklist obligatoire — 4 questions Y/N

Avant de créer un ADR validé par catégorie, l'agent ou l'humain DOIT répondre aux 4 questions suivantes. **Un seul NON → l'ADR est REJETÉ.**

### Q1 — Coût de revert

> Changer cette décision dans 6 mois coûterait-il **plus d'une journée** de refactoring transverse ?

- **OUI si** : la décision touche plusieurs modules / services, force un changement de schéma, casse une API publique.
- **NON si** : on peut la remplacer en touchant un seul fichier ou un seul module.

### Q2 — Non-déductible du code

> La décision **ne se déduit PAS** de la simple lecture de `package.json` / `tsconfig.json` / configs / dépendances ?

- **OUI si** : il faut comprendre l'intention architecturale, le pourquoi, les alternatives écartées.
- **NON si** : un nouveau dev qui lit `package.json` voit immédiatement le choix (ex : « on utilise Vitest plutôt que Jest » se voit dans `package.json`).

### Q3 — Impact transverse

> **Au moins 2 specs / 2 modules** dépendent de cette décision ?

- **OUI si** : la décision contraint plusieurs zones du code.
- **NON si** : la décision est confinée à un seul module / une seule feature.

### Q4 — Test de l'invariant

> Un dev raisonnable pourrait-il **casser un invariant métier ou de sécurité** s'il ignorait cette décision en touchant le code ?

- **OUI si** : oublier la décision conduit à des bugs silencieux, des données corrompues, ou une faille.
- **NON si** : c'est une convention de style ou une optimisation isolée.

**Règle d'application** : un agent qui ne peut pas répondre OUI aux 4 questions avec une justification concrète **DOIT** documenter la décision en `spec-technique.md` à la place.

---

## 4. Anti-patterns — REJET automatique

Les 7 catégories suivantes d'ADR sont **interdites**, peu importe la justification. Si un candidat ADR matche l'une de ces descriptions, **rejet immédiat sans même appliquer la checklist**.

### AP-1 — Choix de lib hors stack majeur

❌ « ESLint flat config par workspace »
❌ « React Testing Library + happy-dom »
❌ « DivIcon Lucide React markers »
❌ « Zustand + persist au lieu de Redux »
❌ « leaflet-curve sans wrapper React »

**Alternative** : section « Patterns identifiés » ou « Stack utilisée » dans `spec-technique.md`.

### AP-2 — Configuration d'outils

❌ « Configuration Vitest »
❌ « Validation 3 couches MIME/magic/Zod »
❌ « Partialize persist activeSnapshotId uniquement »
❌ « TypeScript-only workspace sans build »

**Alternative** : `spec-technique.md` section « Configuration » ou directement dans le fichier de config.

### AP-3 — Heuristiques d'implémentation

❌ « DumpTypeDetector heuristique »
❌ « Edge ID SHA-1 déterministe »
❌ « Aggregation edges par paire avec détection MIXTE »

**Alternative** : `spec-technique.md` section « Algorithmes » ou docstring dans le code.

### AP-4 — Workarounds locaux

❌ « Offset radial Paris-La Défense pour dispersion »
❌ « Registry path resolution via process.cwd() »
❌ « Duplication process-colors JSON/TS synchronisation manuelle »

**Alternative** : commentaire dans le code + entrée dans `dette-technique.md`.

### AP-5 — Décision superseded dans la même session

❌ Créer ADR-037 « Cache Redis » puis ADR-040 « Cache en mémoire process » la même semaine.

**Règle** : si une décision est remplacée dans la session courante, ne créer **que** l'ADR final. L'historique est dans git. *(Un ADR DESIGN reste légitime — voir catégorie DESIGN ; AP-5 interdit seulement de garder l'intermédiaire superseded.)*

### AP-6 — Style ou convention API

❌ « PUT upsert avec overrides »
❌ « Clé path 5 champs sans tri canonique »
❌ « Validation NestJS Zod pour futurs endpoints »

**Alternative** : `spec-technique.md` section « API / Endpoints ».

### AP-7 — Détail de schéma BDD non-architectural

❌ « Cascade 5 niveaux par champ » est un DATA-MODEL valide.
❌ « Index composite sur `(env_name, effective_date)` » est un détail → `spec-technique.md` ou migration commentée.

**Règle** : un détail de schéma est un ADR uniquement s'il porte un invariant métier (immutabilité, cascade de fallback) — sinon `spec-technique.md`.

---

## 5. Bloc justification obligatoire

Tout ADR créé par un agent automatique (`@retro-documenter`, `@update-writer-after-implement`) **DOIT** contenir le bloc ci-dessous, placé **entre le tableau metadata et la section `## Contexte`** :

```markdown
## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | <STACK | AUTH | DB-STRATEGY | SECURITY | DATA-MODEL | REPRODUCIBILITY | BREAKING-CHANGE | DESIGN> |
| Q1 — Coût de revert > 1j ? | OUI — <raison concrète> |
| Q2 — Non-déductible du code ? | OUI — <ce qui n'est pas dans package.json/configs> |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — <liste des specs concernées : api/imports, api/graph, web/map> |
| Q4 — Casse un invariant si ignoré ? | OUI — <invariant concerné : reproductibilité historique, isolation tenant, etc.> |

> ✅ Validé contre la politique `.claude/rules/06-adr-policy.md`.
```

**Si l'agent ne peut pas remplir ce bloc avec des justifications concrètes (pas de paraphrase générique), il doit ne PAS créer l'ADR.**

---

## 6. Règles de fusion (consolidation)

Lors d'une session `/zelian:retro` ou de plusieurs sessions `update-writer`, plusieurs ADR redondants peuvent émerger. La règle de fusion est appliquée à l'étape de consolidation post-retro :

1. **Même catégorie + même module** → 1 ADR unique avec section « Évolution » qui retrace l'historique.
2. **Décision superseded dans la session** → garder UNIQUEMENT le dernier ADR. Les intermédiaires sont supprimés (l'historique reste dans git).
3. **ADR de granularité fine couvrant un même invariant** → fusionner sous l'ADR de granularité supérieure (ex : 3 ADR sur des sous-aspects du modèle raw → 1 seul ADR « Modèle raw + compute-on-read » avec sections internes).

---

## 7. Quand créer un ADR à la main (humain) ?

La politique s'applique aux agents automatiques. Un humain peut créer un ADR à la main si :

- Il s'agit d'une **décision en amont** (avant implémentation), discutée et validée par l'équipe.
- Le bloc justification est rempli avec rigueur (pas de paraphrase).
- La décision passe whitelist + checklist + anti-patterns.

**Règle d'or humaine** : si tu hésites à créer un ADR, c'est probablement que ce n'est pas un ADR. Mets-le en `spec-technique.md` — tu pourras toujours le promouvoir en ADR plus tard si la décision se révèle structurante.

---

## 8. Référence rapide pour les agents

```
Avant de créer un ADR :
  1. Catégorie identifiable parmi les 7 ?           NON → REJET
  2. Anti-pattern (AP-1 à AP-7) ?                   OUI → REJET
  3. Q1 Coût de revert > 1j ?                       NON → REJET
  4. Q2 Non-déductible de package.json/configs ?    NON → REJET
  5. Q3 Impact ≥ 2 specs ?                          NON → REJET
  6. Q4 Casse un invariant si ignoré ?              NON → REJET
  7. Bloc justification rempli avec justifs concrètes ?  NON → REJET

  Tout OUI / NON-AP → ADR créé avec bloc justification.
  Sinon → spec-technique.md du module.
```

**En cas de doute : `spec-technique.md`. Toujours.**
