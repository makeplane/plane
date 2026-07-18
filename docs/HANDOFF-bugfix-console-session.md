# HANDOFF — Bug-fixing des erreurs console Plane (web)

> Document de reprise **autonome** pour une nouvelle session Claude Code — y compris **depuis un autre poste** : la mémoire projet de Claude Code vit dans `~/.claude/projects/…/memory/` et **ne suit pas la machine**. Ce fichier est donc le seul relais fiable.
>
> Repo : `C:\Stage\plane`. Branche de travail : `preview` (fork `userLinpy/plane`, upstream `makeplane/plane`). **Mis à jour le 2026-07-18.**

## 0. Objectif global

Corriger les erreurs de la console navigateur de l'app **web** de Plane, **une branche `fix/<nom-du-problème>` par problème distinct**, chacune : fix → vérif navigateur → commit (hook lint) → entrée CHANGELOG → PR (base `preview`, repo `userLinpy/plane`) → **review** → merge → `@update-writer-after-implement`.

## 1. Ce qui est DÉJÀ fait — 11 PRs mergées dans `preview`

### 1ʳᵉ vague (2026-07-15) — #41 → #45

| PR  | Problème console                                    | Cause racine & fix                                                                                                                                                                                  |
| --- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #41 | `Hydration failed…` + `Component is not a function` | **La vraie racine, pas la sidebar** : `HydrateFallback` (next-themes) rendait `<div/>` vide côté serveur mais `<div><LogoSpinner/></div>` côté client → mismatch. Fix : gate sur un état `mounted`. |
| #42 | `<button>` dans `<button>` (menus sidebar)          | `CustomMenu` enveloppe son `customButton` dans un `<button>` ; on lui passait un `<AppSidebarItem variant="button">`. Fix : rendu via `AppSidebarItem.Icon` (`<div>`) + `customButtonClassName`.    |
| #43 | `Function components cannot be given refs` (Inbox)  | `Tooltip` posait une ref sur `<AppSidebarItem>` (composant fonction). Fix : wrapper `<span className="flex">`.                                                                                      |
| #44 | `` `ref` is not a prop `` (widgets home)            | `RecentPage/Issue/Project` déclaraient `ref` comme **prop de donnée** (nom réservé React). Fix : renommé `parentRef`.                                                                               |
| #45 | `<button>` dans `<button>` (poignée drag)           | `@plane/ui` `DragHandle` est déjà un `<button>`, enveloppé dans un `<button>`. Fix : wrapper `<button>`→`<div>`, ref `HTMLDivElement`.                                                              |

### 2ᵉ vague (2026-07-16) — #46 → #50, puis #51 (docs)

| PR  | Problème console                                       | Cause racine & fix                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #46 | `<button>` dans `<button>` (menus « … »)               | `customButton={<IconButton/>}` : `IconButton` rend lui aussi un `<button>`. Fix sur **7 points d'appel** : passer l'**icône lucide brute** en `customButton` + style via `customButtonClassName={getIconButtonStyling(variant, size)}`. Sidebar projets : `onClick`→`menuButtonOnClick`, suppression de `actionSectionRef` redondant. |
| #47 | `Function components cannot be given refs` (peek)      | `Tooltip` autour d'un `<Link>` (shim `next/link`, composant fonction). Fix : wrapper `<span className="flex">` dans `issues/peek-overview/header.tsx`.                                                                                                                                                                                |
| #48 | `checked` sans `onChange` (sélection de groupe)        | `Checkbox` contrôlée pilotée par `onClick`. Fix : ajout de `readOnly` (cf. le frère `entity-select-action.tsx` qui le faisait déjà).                                                                                                                                                                                                  |
| #49 | `Function components cannot be given refs` (CountChip) | `Tooltip` autour de `CountChip` (composant fonction). Fix : `CountChip` passé en `React.forwardRef` + spread `...rest`.                                                                                                                                                                                                               |
| #50 | idem #48 sur 3 autres fichiers + dette a11y            | `readOnly` sur onboarding `invitations`/`join-invites` + `project/multi-select-modal`, **et** les lignes `<div onClick>` converties en vrais `<button type="button">` (+ `tabIndex={-1}` sur la Checkbox interne, `no-shadow` corrigé).                                                                                               |
| #51 | —                                                      | Docs : versionne ce HANDOFF, les plans SSO et `.claude/launch.json`.                                                                                                                                                                                                                                                                  |

### Enseignement clé — `Tooltip` (propel/base-ui) + composant fonction

Le `Tooltip` rend `<BaseTooltip.Trigger render={children}/>` → il pose **ref + handlers + aria** sur son enfant. Deux correctifs valides, à choisir selon le cas :

- l'enfant est un composant **qu'on possède**, avec **une seule racine DOM** → le passer en **`React.forwardRef` + spread `...rest`** (contrat de `IconButton` ; appliqué en #49). C'est le correctif de fond : il règle **tous** les usages d'un coup.
- l'enfant est un **shim / non modifiable** (`next/link`) → l'**envelopper dans `<span className="flex">`** (#43, #47).

> **NE PAS REFAIRE :** forwardRef sur `AppSidebarItem` ou sur le shim `apps/web/app/compat/next/link.tsx` = **cul-de-sac** (cassait le rendu). Ces deux fichiers restent SANS forwardRef — c'est voulu.

## 2. Travail restant

### 2.1 Bug F — setState pendant le render (store de filtres partagé) — **WIP déjà poussé**

**Symptôme :** `Cannot update a component (WorkItemFiltersToggle) while rendering a different component (WorkItemFilterRoot)`, sur la liste des work items.

**Cause racine (tracée) :** `WorkItemFilterRoot` (`apps/web/core/components/work-item-filters/filters-hoc/base.tsx`) appelait `getOrCreateFilter(...)` dans un `useMemo` — donc **pendant le render**. Cette action MobX fait `this.filters.set(...)` (`packages/shared-state/src/store/work-item-filters/filter.store.ts` ~l.103), mutant la Map observable. Or `WorkItemFiltersToggle` (`filters-toggle.tsx`) est un `observer` qui lit `getFilter(...)` sur ce même store → re-render planifié pendant le render du Root → warning React.

**État : un WIP existe et est poussé** sur `origin/fix/work-item-filters-setstate-in-render` (commit `41ff0382a`, message « UNVERIFIED / DO NOT MERGE AS-IS »). Il déplace la création/synchro dans un `useEffect` (après commit) et lit l'instance réactivement via `getFilter`. Analyse déjà faite : **le changement de type ne casse aucun call-site** (`shared.ts` typait déjà `filter: IWorkItemFilterInstance | undefined`, et **aucun** consommateur n'utilise le render-prop `({ filter })` — le filtre circule par le store).

**Ce qui reste :** la **vérification live**. Après le montage, le filtre est `undefined` pendant un render — il faut confirmer qu'il n'y a ni flash ni filtrage tardif, sur **tous** les layouts filtrés : liste work items projet, cycle, module, vue projet, workspace-views, profil, archives. C'est de l'**infra partagée (~14 fichiers utilisent les HOC)** → ne merger qu'après cette vérif.

### 2.2 aria-labels sur les menus quick-actions icon-only (petit, a11y)

Plusieurs `CustomMenu` icon-only ne passent pas d'`ariaLabel` → le `<button>` du trigger n'a **aucun nom accessible** (`custom-menu.tsx` fait `aria-label={ariaLabel}`). Concernés : `modules/quick-actions.tsx`, `cycles/`, `views/`, `comments/`, `issues/layout-quick-actions.tsx`, `issues/issue-layouts/quick-action-dropdowns/issue-detail.tsx`. Modèle à suivre : `workspace/sidebar/projects-list-item.tsx` (`ariaLabel={t("aria_labels.projects_sidebar.toggle_quick_actions_menu")}`). **Utiliser de vraies clés i18n** (19 locales — cf. skill `translate`), pas des littéraux anglais. Gap **pré-existant**, pas une régression.

## 3. NON-bugs — ne pas « corriger »

- **WebSocket live** `ws://localhost:3100/live/collaboration … ERR_CONNECTION_REFUSED` : le serveur live n'est pas démarré. Environnemental.
- **`GET /api/users/me/ 401`** : signifie simplement **pas de session** (pas connecté). Voir §4.7.
- **`Uncaught SyntaxError: Function statements require a function name (at issues/:1:1)`** + **`Uncaught (in promise) undefined`** : **intermittents**, ancrés sur le **document de la route** (`issues/:1`) et non sur un module Plane (toutes les vraies erreurs Plane citent un fichier précis, ex. `use-yjs-setup.ts:62`). Pistes : script injecté par une **extension navigateur**, ou race de chargement de chunk Vite dev. **Test décisif jamais réalisé** : rouvrir la page en **fenêtre InPrivate** (extensions désactivées) — si ça disparaît, c'est une extension, rien à corriger. Sinon : cliquer le lien `issues/:1` dans la console pour voir la ligne 1 fautive + regarder l'onglet Network (Status/Type du document `issues/`).

## 4. GOTCHAS DE WORKFLOW (leçons durement apprises — À LIRE)

### 4.1 Vérification navigateur — CONTRAINTE MAJEURE

**Le navigateur intégré (MCP `Claude_Browser` / preview) ne peut PAS s'authentifier** : le SSO « Sign in with Zelian » échoue dans ce contexte sandboxé (chaîne de redirections + cookies cross-origin vers `:3102` bloquée), alors qu'il **fonctionne dans un vrai navigateur (Edge)**. Conséquence : **la vérification live passe par le navigateur du dev**, qui colle la console.

Le dev lance son propre `pnpm dev` sur `:3000` : ce serveur sert **le working tree que Claude édite** (peu importe la branche checkoutée), donc ses reloads reflètent bien les modifs en cours.

**Signal de fraîcheur (crucial)** — une console collée peut être **périmée** (onglet Edge non rechargé, HMR partiel). Avant d'en conclure quoi que ce soit, vérifier qu'elle ne contient plus un marqueur déjà supprimé (ex. un warning déjà corrigé, ou une ancienne instrumentation `root.tsx:53`). Si périmée : **hard reload** (`Ctrl+Shift+R`) ou onglet neuf, puis **vider la console** avant de reproduire.

**Confirmer côté serveur** (indépendant du navigateur, très fiable) :

```bash
curl -s http://localhost:3000/<chemin/du/module>.tsx | grep <marqueur-du-fix>
```

Ça prouve que le dev server sert bien le code corrigé.

**Instrumentation** (si on a besoin d'un comptage fiable) — temporaire dans `apps/web/app/root.tsx`, juste AVANT `const APP_TITLE = …` :

```ts
// TEMP DEBUG
if (typeof window !== "undefined" && !(window as unknown as { __capsInstalled?: boolean }).__capsInstalled) {
  const w = window as unknown as { __capsInstalled?: boolean; __caps?: string[] };
  w.__capsInstalled = true;
  w.__caps = [];
  const _err = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    try {
      const s = args.map((x) => (typeof x === "string" ? x : (x as Error)?.stack || "")).join("\n");
      if (s.includes("is not a function") || s.includes("cannot appear as a descendant") || s.includes("\n    at "))
        w.__caps?.push(s.slice(0, 3000));
    } catch {
      /* noop */
    }
    _err(...(args as []));
  };
}
```

Puis recharger, attendre ~12-14 s, lire `window.__caps` et compter par motif. **RETIRER l'instrumentation avant de committer** (`git diff apps/web/app/root.tsx` doit être vide). Le buffer `read_console_messages` du MCP est **peu fiable** (persiste entre reloads, faux négatifs de timing) ; le hash `?v=xxxx` est celui de l'optimisation des deps, **pas** un hash de recompilation → inutilisable comme discriminant.

### 4.2 Pre-commit hook (lint-staged) — le plus gros piège

`.husky/pre-commit` → `pnpm lint-staged` → sur les fichiers stagés : `pnpm exec oxfmt` puis `pnpm exec oxlint --fix --deny-warnings`. **`--deny-warnings` fait échouer le commit sur N'IMPORTE QUEL warning pré-existant du fichier touché** (le lint global, lui, tolère via `--max-warnings=11957`).

Pour débloquer (SANS `--no-verify`, non autorisé) : ajouter des disables **ciblés**.

- Format : `// eslint-disable-next-line <rule>` (marche aussi pour les règles oxc, ex. `no-map-spread`). `// oxlint-disable-next-line <rule>` fonctionne également.
- **PLACEMENT** : le disable va sur la ligne **immédiatement avant la ligne où le diagnostic démarre**. Pour `no-shadow`, c'est la déclaration **shadowante** (le param du callback), PAS l'originale « shadowed ». Pour `promise/always-return`, c'est la ligne du `.then(`, quitte à insérer le commentaire entre `=>` et le corps (valide en JS).
- Règles déjà rencontrées : `no-shadow`, `promise/always-return`, `no-map-spread`, `react-hooks/exhaustive-deps`, `import/no-unassigned-import`, `jsx-a11y/click-events-have-key-events`, `jsx-a11y/no-static-element-interactions`.
- Toujours re-lancer `cd apps/web && npx oxlint --deny-warnings <fichiers>` jusqu'à « Found 0 warnings » **avant** de committer.
- Justifier chaque disable (`-- pre-existing, unrelated to this fix`).
- **Nuance a11y** : pour `jsx-a11y/*` sur des lignes interactives, **préférer corriger** (vrai `<button>`, `role`/`tabIndex`/`onKeyDown`) plutôt que suppresser — c'est ce qu'a fait #50. Si le fix a11y sort du scope, sortir ces fichiers de la PR et en faire une tâche dédiée.

### 4.3 Vite HMR — instable

Après un changement de branche, une modif de lib, ou un changement de type d'export (fonction↔forwardRef) d'un module très importé, Vite peut servir des **chunks périmés**. **Piège vécu** : un `TypeError: Component is not a function` attribué à tort à un changement forwardRef — c'était en fait le bug d'hydratation #41. Ne pas mal-attribuer. En cas de doute : redémarrer le dev server, voire `rm -rf apps/web/node_modules/.vite`.

### 4.4 Stop hook Zelian (obligatoire après toute modif source)

Le hook `Stop` bloque tant que `@update-writer-after-implement` n'a pas tourné. Invoquer le subagent `zelian-framework:update-writer-after-implement` (Agent tool, `run_in_background:false`) avec le contexte des fichiers modifiés, en lui précisant : CHANGELOG **déjà** écrit (ne pas dupliquer), pas de changement BDD, **aucun ADR** (un bugfix échoue la whitelist de `.claude/rules/06-adr-policy.md`), pas de module `docs/specs/` correspondant (les composants UI core ne sont pas documentés), et **ne rien committer/pousser**. Il écrit `.claude/.update-writer-ran` → débloque. Astuce : le lancer **proactivement** en fin de tâche évite de se faire bloquer au moment de rendre la main.

### 4.5 CHANGELOG & merge

- Chaque fix → une entrée sous `## [Unreleased]` › `### Fixed` (français, style des entrées existantes), dans un commit séparé `docs(changelog): …` (convention du repo : un commit `fix(web): …` puis un commit changelog).
- Merger 2 branches touchant le CHANGELOG → **conflit** ; résoudre en **gardant les DEUX entrées**, puis `git merge origin/preview` dans la branche avant de re-pousser.

### 4.6 Flux PR / gh

- PRs sur le **fork** `userLinpy/plane`, base **`preview`**. `gh pr view N` pointe par défaut sur l'upstream → **TOUJOURS `--repo userLinpy/plane`**.
- Si draft : `gh pr ready N --repo userLinpy/plane`.
- Merge : `gh pr merge N --repo userLinpy/plane --merge` (**merge-commit**).
- **Une review est requise avant merge** (et l'accord du dev). `gh pr review N --repo userLinpy/plane --comment --body …` fonctionne sur sa propre PR (l'approve, non).
- Aucune CI ne tourne sur ces PRs fork→preview (`gh pr checks` : « no checks reported ») — ne pas l'attendre.

### 4.7 Environnement — démarrage complet

Trois services, **tous nécessaires** pour tester en étant connecté :

```bash
# 1) Backend (Docker Desktop doit tourner)
cd C:\Stage\plane && docker compose -f docker-compose-local.yml up -d   # api :8000, db, redis, mq, minio

# 2) Front web
pnpm dev                                                                # react-router dev --port 3000

# 3) SSO Zelian — SANS LUI, IMPOSSIBLE DE SE CONNECTER
cd C:\Stage\2026-zelian-insider\packages\auth && pnpm dev               # next dev --port 3102
```

- Login de test : `dev@zelian.local` (SSO Zelian), workspace **zelian**, routes `/zelian/…`.
- Si `:3102` est éteint → la page de consent renvoie une erreur de connexion, le login boucle sur l'écran de login et l'API répond `401`. **C'est la panne la plus fréquente.**
- `:3100` (live) est optionnel : ne sert qu'à faire taire les erreurs WebSocket.
- OS Windows / Git-bash.

## 5. État du repo (2026-07-18)

- Branche `preview` synchronisée avec `origin/preview` — HEAD `faa2d31d3` (Merge #51).
- **Aucun** commit local non poussé (vérifié via `git log --branches --not --remotes` = vide), **aucun** stash, **aucune** PR ouverte.
- WIP bug F sur `origin/fix/work-item-filters-setstate-in-render` (non mergé, volontairement).
- Seuls fichiers non suivis restants : `.claude/.doc-injected.json` et `.claude/.update-check.json` (caches locaux, à ignorer).

## 6. Étapes pour reprendre

1. `git checkout preview && git pull origin preview`.
2. Démarrer les 3 services (§4.7) — **ne pas oublier `:3102`**, sinon pas de login.
3. Se connecter dans un **vrai navigateur** (Edge), workspace `zelian` (§4.1).
4. Choisir le sujet : **bug F** (§2.1 — repartir de la branche WIP poussée, puis **vérifier tous les layouts filtrés** avant merge) ou **aria-labels** (§2.2).
5. Fix → vérif (§4.1) → commit (hook lint §4.2) → CHANGELOG (§4.5) → PR + review + merge (§4.6) → `@update-writer` (§4.4).

## 7. Notes

- La mémoire projet de Claude Code (`~/.claude/projects/C--Stage-plane/memory/`) est **locale à la machine** : sur un nouveau poste, elle sera vide. **Ce document est le relais** — le tenir à jour en fin de chantier.
- Les worktrees `.claude/worktrees/*` sont des artefacts locaux de sessions parallèles ; leur contenu est poussé, ils n'ont pas besoin d'être transférés.
