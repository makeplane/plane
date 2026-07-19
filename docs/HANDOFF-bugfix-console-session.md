# HANDOFF — Bug-fixing des erreurs console Plane (web)

> Document de reprise **autonome** pour une nouvelle session Claude Code — y compris **depuis un autre poste** : la mémoire projet de Claude Code vit dans `~/.claude/projects/…/memory/` et **ne suit pas la machine**. Ce fichier est donc le seul relais fiable.
>
> **Repo : `~/dev/plane` DANS WSL** (`\\wsl.localhost\Ubuntu-24.04\home\lucie\dev\plane` depuis Windows). ⚠️ `C:\Stage\Plane` est un dossier **vide** — ce n'est pas le dépôt. Branche de travail : `preview` (fork `userLinpy/plane`, upstream `makeplane/plane`). **Mis à jour le 2026-07-18.**
>
> **➡️ Commencer par le §6, puis le §10.** Les §1 à §5 datent des premières vagues et contiennent des affirmations corrigées depuis — le §9.2 liste lesquelles.

## 0. Objectif global

Corriger les erreurs de la console navigateur de l'app **web** de Plane, **une branche `fix/<nom-du-problème>` par problème distinct**, chacune : fix → vérif navigateur → commit (hook lint) → entrée CHANGELOG → PR (base `preview`, repo `userLinpy/plane`) → **review** → merge → `@update-writer-after-implement`.

## 1. Historique des 2 premières vagues — #41 → #51

> Total à ce jour : **#41 → #69**. Les vagues suivantes sont aux §8.4 (#53-#57), §9.1 (#59-#67) et §10.

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

> ✅ **RÉSOLU** — vérifié et fusionné, voir le **§11.7**. Le reste de cette entrée est conservé pour la trace du diagnostic, mais **une de ses affirmations était fausse** : voir la correction ci-dessous.

**État : un WIP existe et est poussé** sur `origin/fix/work-item-filters-setstate-in-render` (commit `41ff0382a`, message « UNVERIFIED / DO NOT MERGE AS-IS »). Il déplace la création/synchro dans un `useEffect` (après commit) et lit l'instance réactivement via `getFilter`.

⚠️ **Correction (2026-07-19).** L'analyse affirmait qu'**aucun** consommateur n'utilise le render-prop `({ filter })` et que « le filtre circule par le store ». **C'est faux** : les **11** consommateurs l'utilisent tous (`project-layout-root`, `cycle-layout-root`, `module-layout-root`, `project-view-layout-root`, `all-issue-layout-root`, `archived-issue-layout-root`, `project-epics-layout-root`, `profile-issues`, `views/form`, `workspace/views/form`, `exporter/export-form`). La conclusion « aucun call-site ne casse » tenait quand même, mais **pour une autre raison** : tous gardent déjà le filtre par `{filter && …}`. Ne pas se fier à la prémisse d'origine.

**Le vrai risque n'était pas aux points d'appel mais _dans_ le HOC** : `base.tsx` lisait `workItemLayoutFilter.configManager` **dans un tableau de dépendances**, donc évalué pendant le render — aucune garde d'appelant n'aurait pu l'éviter. Le WIP le traitait déjà.

### 2.2 aria-labels sur les menus quick-actions icon-only (petit, a11y)

Plusieurs `CustomMenu` icon-only ne passent pas d'`ariaLabel` → le `<button>` du trigger n'a **aucun nom accessible** (`custom-menu.tsx` fait `aria-label={ariaLabel}`). Concernés : `modules/quick-actions.tsx`, `cycles/`, `views/`, `comments/`, `issues/layout-quick-actions.tsx`, `issues/issue-layouts/quick-action-dropdowns/issue-detail.tsx`. Modèle à suivre : `workspace/sidebar/projects-list-item.tsx` (`ariaLabel={t("aria_labels.projects_sidebar.toggle_quick_actions_menu")}`). **Utiliser de vraies clés i18n** (19 locales — cf. skill `translate`), pas des littéraux anglais. Gap **pré-existant**, pas une régression.

## 3. NON-bugs — ne pas « corriger »

- **WebSocket live** `ws://localhost:3100/live/collaboration … ERR_CONNECTION_REFUSED` : le serveur live n'est pas démarré. Environnemental.
- **`GET /api/users/me/ 401`** : signifie simplement **pas de session** (pas connecté). Voir §4.7.
- **`Uncaught SyntaxError: Function statements require a function name (at issues/:1:1)`** + **`Uncaught (in promise) undefined`** : **intermittents**, ancrés sur le **document de la route** (`issues/:1`) et non sur un module Plane (toutes les vraies erreurs Plane citent un fichier précis, ex. `use-yjs-setup.ts:62`). Pistes : script injecté par une **extension navigateur**, ou race de chargement de chunk Vite dev. **Test décisif jamais réalisé** : rouvrir la page en **fenêtre InPrivate** (extensions désactivées) — si ça disparaît, c'est une extension, rien à corriger. Sinon : cliquer le lien `issues/:1` dans la console pour voir la ligne 1 fautive + regarder l'onglet Network (Status/Type du document `issues/`).
- **Longue pile `postMessage` / `scheduler.development.js:574` répétée après un clic de navigation** (chaîne `handleClick` → `doNavigate` → `startNavigation` → `handleLoaders` → `updateState` → `startTransition` → `dispatchSetState` → scheduler → `postMessage` ×N) : **comportement voulu de react-router 7, pas un bug Plane.** Depuis la v7, react-router enveloppe **toutes** ses mises à jour d'état dans `React.startTransition` — la preuve est dans la pile elle-même, `chunk-4N6VE7H7.mjs` _est_ `react-router@7.15.1/dist/development/`, et sa ligne **6707** est littéralement `React3.startTransition(() => {`. React découpe alors le rendu en tranches et rend la main au navigateur via `postMessage` entre chaque : d'où les frames répétées, qui sont du **chaînage de pile asynchrone** affiché par DevTools, pas une boucle. Trois amplificateurs propres au dev : builds **non minifiés** (`react-dom.development.js`, `scheduler.development.js`, 5 à 10× plus lents), **`StrictMode`** qui double chaque rendu (`app/entry.client.tsx`), et les modules non bundlés servis par Vite. ⚠️ **Cette pile seule ne dit rien** — c'est le message au-dessus qui tranche : `[Violation] 'message' handler took Nms` = lenteur de dev, **non-bug** ; `Cannot update a component (X) while rendering a different component (Y)` = c'est le **bug F** (§2.1), qui a sa propre branche. **Test décisif** : rejouer sur un build de production (`pnpm build --filter=web` puis servir) — `StrictMode` n'y double plus les rendus et les builds sont minifiés ; si la violation disparaît, il n'y a rien à corriger. Note : l'échappatoire officielle `unstable_useTransitions` **n'existe pas** en 7.15.1 (vérifié dans `node_modules`), elle est arrivée plus tard — sur cette version il n'y a donc de toute façon aucun levier applicatif, seule une montée de version en offrirait un.

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

## 6. Étapes pour reprendre — À LIRE EN PREMIER

1. `git checkout preview && git pull origin preview`.
2. Démarrer les 3 services (§4.7) — **ne pas oublier `:3102`**, sinon pas de login. ⚠️ Lire le **§11.5** avant de lancer la moindre commande `pnpm` : node/pnpm passent par `mise` et le PATH Windows fuit dans WSL. **Si Docker « ne démarre pas » : ne pas attendre, aller au §11.5.1** — il a probablement déjà crashé.
3. **Le navigateur intégré (`mcp__Claude_Browser__*`) suffit** : `preview_start` sur `http://localhost:3000`, la session SSO se résout seule. Le §4.1 qui prétend le contraire est **faux** — voir §8.1.
4. Choisir un sujet **dans le §11.6** — c'est la liste du travail restant **à jour**. ⚠️ **Le §10 est FAIT** (chantiers A et B fusionnés, PR #72 et #73). **Ne PAS partir du §2, du §8.3 ni du §9.4 sans avoir lu le §9.2 puis le §11.6** : plusieurs de leurs entrées sont résolues ou mal attribuées.
5. Boucle par sujet : fix → **vérif navigateur avant/après** (§4.1 + §9.3) → commit (hook lint §4.2) → CHANGELOG (§4.5) → PR + review + merge (§4.6). Le hook `@update-writer` du §4.4 **n'est pas actif** sur ce poste (§9.5).

### Les 3 réflexes qui ont fait toute la différence

- **Nommer le composant fautif par l'arbre de fibres React** (§10.1), pas par grep. Le grep a échoué 3 fois de suite ; la fibre donne le composant en une requête.
- **Mesurer avant/après dans le navigateur**, y compris les dimensions (`getBoundingClientRect`). Technique : `git stash` → recharger → mesurer → `git stash pop`. C'est ce qui a attrapé la seule vraie régression de la série, invisible au lint et au typecheck (§9.3 point 3).
- **Le relevé DOM MINORE toujours le problème** : il ne voit que ce que les données affichent. « 1 imbrication » s'est révélé être 6 widgets (§10.2), « 2 » se révélera proportionnel au nombre de réactions (§10.3). Toujours remonter du DOM au composant, puis **recenser les appelants du composant**.

## 7. Notes

- La mémoire projet de Claude Code (`~/.claude/projects/C--Stage-plane/memory/`) est **locale à la machine** : sur un nouveau poste, elle sera vide. **Ce document est le relais** — le tenir à jour en fin de chantier.
- Les worktrees `.claude/worktrees/*` sont des artefacts locaux de sessions parallèles ; leur contenu est poussé, ils n'ont pas besoin d'être transférés.

---

## 8. Session du 2026-07-18 (nouveau poste) — résultats et reprise

> Rédigé en fin de session pour que la suivante reparte sans rien redécouvrir.
> **Repo déplacé** : le code vit maintenant dans WSL (`~/dev/plane`), plus dans `C:\Stage\plane`.
> Raccourcis Windows vers les projets : `C:\Stage\*.lnk`.

### 8.1 ⚠️ Le §4.1 est FAUX — le navigateur intégré fonctionne

**Corrigé par l'expérience.** Le navigateur intégré (`mcp__Claude_Browser__*`) **peut** piloter Plane dès lors qu'une session existe déjà dans son profil. Vérifié le 2026-07-18 : navigation dans le workspace `zelian`, ouverture du projet `Plane test`, inspection du DOM (`document.querySelectorAll('button button')`) et lecture de la console — tout fonctionne.

Ce qui échoue, c'est uniquement la **chaîne SSO complète** (redirections cross-origin vers `:3102`). Une fois connecté, tout est pilotable.

→ **La vérification live n'est plus un point bloquant.** Une session Claude peut désormais reproduire, corriger et vérifier elle-même.

L'extension « Claude in Chrome » (qui piloterait le vrai Edge du dev) n'est **pas** installée sur ce poste — `list_connected_browsers` renvoie `[]`.

### 8.2 §3 NON-bugs — test décisif enfin réalisé ✅

Les deux erreurs `Uncaught (in promise) undefined` et `Uncaught SyntaxError: Function statements require a function name (at issues/:1:1)` étaient marquées « test décisif jamais réalisé ».

**C'est fait.** Même URL (`/zelian/projects/710e3358-d6a3-4f92-bc2f-857ea0da2960/issues/`), même navigation par clic, dans le navigateur intégré qui n'a **aucune extension** :

| Erreur                                                              | Occurrences |
| ------------------------------------------------------------------- | ----------- |
| `Uncaught (in promise) undefined`                                   | **0**       |
| `Uncaught SyntaxError: Function statements require a function name` | **0**       |

→ **Ce sont bien des scripts injectés par une extension du navigateur du dev.** Rien à corriger dans Plane. Sujet clos, ne plus y revenir.

**Reconfirmé le 2026-07-18** : le dev les a resignalées depuis son navigateur, avec un indice supplémentaire décisif — le préfixe **`VM67026`** dans `VM67026 issues:1 Uncaught SyntaxError`. C'est la notation Chrome pour un script **évalué dynamiquement** (`eval`/injection), jamais pour un fichier du projet. Si elles réapparaissent : répondre « extension », ne pas réinvestiguer.

### 8.3 Travail RESTANT — 3 bugs d'imbrication, chemins de composants exacts

> ⚠️ **Section partiellement périmée — lire le §9.2 AVANT d'agir.** A, C, D et E sont **résolus** ; A et D y étaient de surcroît **mal attribués** (mauvais fichier pour A, mauvaise granularité pour D).

Relevés par la console du navigateur intégré sur `/zelian/projects/<id>/issues/` et la page d'accueil. Chacun mérite sa branche `fix/`.

#### A. `FiltersDropdown` — 8 occurrences sur 12, le plus rentable

```
Re < Me < CustomMenu < FiltersDropdown < ContentOverflowWrapper < RecentActivityWidget < DashboardWidgets
```

**Fichier** : `apps/web/core/components/issues/issue-layouts/filters/header/helpers/dropdown.tsx`
**Ligne fautive : 53**

```tsx
<Popover.Button as={React.Fragment}>
  {menuButton ? (
    <button type="button" ref={setReferenceElement}>   // ← ajoute un <button>
      {menuButton}                                      // ← qui en contient déjà un
    </button>
  ) : (
    <div ref={setReferenceElement}> ... </div>          // ← la branche sans menuButton, elle, utilise bien un <div>
```

Quand un appelant passe un `menuButton` déjà interactif (un `CustomMenu`, qui rend son propre `<button>`), l'imbrication se produit. **La branche `else` fait déjà la bonne chose** (`<div ref>`) — c'est le modèle à suivre.

⚠️ **Piège** : `Popover.Button as={React.Fragment}` transmet `onClick`/`aria` à son enfant. Passer à un `<div>` conserve l'ouverture au clic (le `CustomMenu` interne fournit la sémantique bouton et l'accès clavier), mais **à vérifier au clavier** avant de merger. Composant partagé par tous les en-têtes → blast radius élevé.

#### B. `ProjectCard` — liens imbriqués, famille NOUVELLE

```
<a> cannot appear as a descendant of <a>
LinkWithRef < Link < ProjectCard < Row < ContentWrapper < ProjectCardList < ProjectRoot
```

Ce n'est **pas** un bouton dans un bouton — ce sont deux `<a>` imbriqués, sur la page Projets. Jamais mentionné dans ce handoff auparavant. Chercher le `<Link>` interne dans `ProjectCard` (probablement le lien vers les settings du projet, `/zelian/settings/projects/<id>/`, rendu à l'intérieur de la carte qui est elle-même un lien).

#### C. `MobileLayoutSelection` — 2 occurrences

```
Button < Re < Me < CustomMenu < MobileLayoutSelection < HeaderFilters < RightItem
```

**Fichier** : `apps/web/core/components/issues/issue-layouts/filters/header/mobile-layout-selection.tsx` (l. 29 et 39, `customButtonClassName="flex flex-grow justify-center text-secondary text-13"`).
Motif #46 exactement : un `Button` de `@plane/propel` passé en `customButton`. Fix connu : passer l'icône brute + `customButtonClassName={getIconButtonStyling(...)}`.

#### D. Pastilles de propriétés des work items — repérées par inspection DOM

N'ont pas déclenché d'avertissement dans la capture (React déduplique par type de composant), mais l'imbrication est bien présente dans le DOM :

```tsx
<button className="clickable block h-full ... outline-none">   // conteneur
  <Button variant="transparent" ... />                          // @plane/propel → <button>
</button>
```

Fichiers, tous dans `apps/web/core/components/dropdowns/` : `state/base.tsx` (l.145), `member/base.tsx` (l.117, 129), `cycle/index.tsx` (l.92, 104), `intake-state/base.tsx` (l.144, 157), `date-range.tsx` (l.164).

#### E. Clés i18n manquantes — trouvé au passage

L'arbre d'accessibilité affiche des **clés brutes non traduites** comme libellés de boutons :

```
button "aria_labels.app_sidebar.close_workspace_menu"
button "aria_labels.app_sidebar.open_extended_sidebar"
```

Le groupe `aria_labels.app_sidebar` **n'existe pas** dans `packages/i18n/src/locales/*/accessibility.json` (qui ne contient que `projects_sidebar`, `auth_forms` et, depuis la PR #55, `quick_actions`). Un lecteur d'écran annonce donc littéralement « aria_labels point app_sidebar point close workspace menu ». Petit et net à corriger.

#### F. Listener non-passif — gain de perf réel, en prod aussi

```
packages/editor/src/core/extensions/side-menu.ts:160
mousewheel: () => hideSideMenu(),
```

Passé via `handleDOMEvents` de ProseMirror, qui enregistre tout en **non-passif**. Ce handler n'appelle jamais `preventDefault()` — il peut donc être passif. Fix : le sortir de `handleDOMEvents` et l'enregistrer soi-même avec `{ passive: true }` dans le cycle `view()` du plugin.
⚠️ Ne PAS toucher à `custom-image/.../modal.tsx:188`, dont le `{ passive: false }` est délibéré (zoom plein écran, a besoin de `preventDefault`).

#### G. `pnpm start` de l'app web est cassé

`serve-handler@6.1.6` appelle `pathToRegExp.compile`, absent de la version de `path-to-regexp` résolue → crash au premier `GET /`. Contournement utilisé pour tester le build de prod : un petit serveur statique Python avec repli SPA.

### 8.4 Ce qui a été FUSIONNÉ cette session

| PR  | Objet                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| #53 | `fix(sso-zelian)` — rejet des emails non vérifiés (ATO, GHSA-7j95-vh8g-f365) + réalignement des codes d'erreur (bloc `59xx` réservé au fork) |
| #54 | `feat(sso-zelian)` — `IS_ZELIAN_ENABLED` devient la bascule unique interne/externe (+ `MODE-INTERNE-OU-EXTERNE.md`)                          |
| #55 | `fix(web)` — nom accessible sur les 12 menus quick-actions (groupe i18n `aria_labels.quick_actions`, 19 locales)                             |
| #56 | `docs(handoff)` — triage de la pile `postMessage` react-router en non-bug                                                                    |
| #57 | `fix(ui)` — fin de l'imbrication `<button>` dans les 2 dropdowns de fil d'Ariane (vérifié navigateur)                                        |

**Recensement `ariaLabel`** : 59 menus icon-only sans nom accessible au total, **12 traités** (PR #55), **46 restants** hors famille quick-actions.

### 8.5 Contexte machine (nouveau poste)

- Code dans **WSL** : `~/dev/plane`, `~/dev/2026-zelian-insider`, `~/dev/2026-zelian-insider-docs`, mire SSO en worktree `~/dev/zelian-mire`
- **Trois services** : Docker API `:8000`, `pnpm dev` `:3000`, mire `@zelian/auth` `:3102`
- ⚠️ `.bashrc` s'arrête avant `mise activate` en shell **non interactif** → toujours `export PATH="$HOME/.local/share/mise/shims:$HOME/.local/bin:$PATH"` en tête de script (c'est ce qui fait échouer `setup.sh` sur `pnpm install`)
- ⚠️ Un serveur lancé en `nohup ... &` meurt à la fermeture de la session WSL → utiliser `setsid nohup ... < /dev/null &`
- ⚠️ `docker restart` ne relit **pas** `apps/api/.env` → `docker compose -f docker-compose-local.yml up -d --force-recreate api` puis vider le cache Django
- Le service `live` de Plane écoute sur `:3100`, **en collision** avec l'app onboarding d'Insider
- Tests backend : `docker compose -f docker-compose-test.yml run --rm api-tests pytest <chemin>`

---

## 9. Seconde session du 2026-07-18 — imbrications de boutons, a11y

> Session menée entièrement depuis le navigateur intégré (session SSO active — le §8.1 se confirme).

### 9.1 PRs

| PR  | Objet                                                                                                | État      |
| --- | ---------------------------------------------------------------------------------------------------- | --------- |
| #59 | `fix(web)` — 5 déclencheurs `customButton` imbriquant un bouton                                      | fusionnée |
| #60 | `fix(web)` — **tous** les dropdowns, via un seul fichier `dropdowns/buttons.tsx`                     | fusionnée |
| #61 | `fix(web)` — nom accessible réel sur les bascules de sidebar (`aria_labels.app_sidebar` inexistant)  | fusionnée |
| #62 | `fix(web)` — 2 sites `customButton` de plus (élément interactif enterré d'un niveau)                 | fusionnée |
| #63 | `docs(handoff)` — ce §9 et les corrections du §8.3                                                   | fusionnée |
| #64 | `fix(web)` — prop `iconKey` fuitant sur le `<svg>` des en-têtes de colonne du spreadsheet            | fusionnée |
| #65 | `fix(web)` — lien de réglages imbriqué dans le lien de la carte projet (bug B)                       | fusionnée |
| #66 | `fix(web)` — bouton imbriqué dans le sélecteur d'icône de l'en-tête de page (`EmojiPicker`)          | fusionnée |
| #67 | `fix(web)` — 5 boutons imbriqués dans la rangée d'actions d'un work item (`IssueDetailWidgetButton`) | fusionnée |

**Résultat mesuré** : page d'accueil et liste des work items sont passées de 1 et 4 imbrications de boutons à **zéro**, et plus aucune clé i18n brute n'est annoncée par un lecteur d'écran dans la sidebar.

### 9.2 Corrections au §8.3

- **A — mauvais fichier.** Il existe **deux composants nommés `FiltersDropdown`**. La pile `… < CustomMenu < FiltersDropdown < ContentOverflowWrapper < RecentActivityWidget` vient du composant **local au widget Recents** (`home/widgets/recents/filters.tsx`), pas de son homonyme d'`issue-layouts`. Résolu en #59.
- **`issue-layouts/filters/header/helpers/dropdown.tsx` l.53 = danger LATENT, pas un bug actif. NE PAS refactorer.** Sa branche `menuButton` rend bien `<button>{menuButton}</button>`, mais **aucun** des 10 appelants ne lui passe un élément interactif : tous passent `<div>`/`<span>`/`<Row>`/icône lucide, et `filterMenuButton` (`project/filters.tsx`) est **déclaré mais jamais passé** par personne. Aucune imbrication ne se produit aujourd'hui. Le passer en `<div>` comme sa branche `else` **priverait au contraire de sémantique bouton** les ~8 appelants qui lui passent du balisage inerte.
- **C** — résolu en #59 (voir le piège géométrique, §9.3).
- **D — mauvaise granularité.** Le §8.3.D listait 5 fichiers d'appel à corriger un par un. La cause est **unique et centralisée** : `dropdowns/buttons.tsx`, dont les 3 variantes (`BorderButton`, `BackgroundButton`, `TransparentButton`) rendaient un `<Button>` propel à l'intérieur du `<button className="clickable …">` de chaque dropdown. **Un seul fichier corrige les 10 dropdowns.** Résolu en #60.
- **E** — résolu en #61. Nuance : **2 des 4 clés existaient déjà** sous `aria_labels.projects_sidebar` ; seul le nom du groupe était faux.

### 9.3 Enseignements techniques (nouveaux)

1. **Recensement des conteneurs qui enveloppent SYSTÉMATIQUEMENT leur contenu dans un `<button>`.** Ne jamais leur passer un élément interactif :
   | Composant | Prop concernée | Où |
   | --- | --- | --- |
   | `CustomMenu` | `customButton` | `packages/ui/…/custom-menu.tsx` l.251 |
   | `CustomSearchSelect` | `customButton` | `custom-search-select.tsx` l.104 |
   | `CustomSelect` | `customButton` | `custom-select.tsx` l.86 |
   | **`EmojiPicker`** | **`label`** | `propel/…/emoji-picker.tsx` → `Popover.Button` → `BasePopover.Trigger` |

   La prop ne s'appelle donc **pas toujours `customButton`** : chercher aussi `label={`. ⚠️ **Plane n'utilise PAS Radix** — toute suggestion d'`asChild` (fréquente dans les réponses d'IA sur ce message d'erreur) est hors sujet. L'équivalent base-ui est la prop `render`, mais le bon réflexe reste de **ne pas fournir un second bouton** au conteneur qui en possède déjà un.

2. **Chercher l'élément interactif en PROFONDEUR.** Le premier recensement exigeait qu'il soit le premier enfant de `customButton` et a manqué 2 sites où il est enveloppé dans un `<div>` ou un `<Tooltip>`. Motif correct :

   ```
   customButton=\{[\s\S]{0,500}?<(Button|IconButton|button)\b
   ```

   ⚠️ **Ce grep reste insuffisant face aux INDIRECTIONS**, et c'est ainsi que la famille de la #67 a survécu à trois recensements. `action-buttons.tsx` écrit `customButton={<IssueDetailWidgetButton …/>}` — aucun `<Button>` en vue — et c'est `IssueDetailWidgetButton` qui en rend un ; pire, `SubIssuesActionButton` & co. **relaient** encore leur propre prop `customButton` vers `CustomMenu`. **Le seul recensement fiable est le DOM**, pas le code :

   ```js
   [...document.querySelectorAll("button button")].map((b) => ({
     interne: b.className.slice(0, 40),
     parent: b.parentElement.closest("button")?.getAttribute("data-slot") ?? b.parentElement.closest("button")?.id,
   }));
   ```

   Le `data-slot` / l'`id` du parent nomme directement le conteneur fautif (`popover-trigger`, `headlessui-menu-button-*`, `headlessui-disclosure-button-*`), ce qui mène au composant bien plus vite qu'un grep.

3. **⚠️ Piège géométrique — le vrai risque de ces correctifs.** Déplacer les classes du bouton interne vers `customButtonClassName` est trivial ; ce qui casse, c'est qu'une classe de **croissance** du wrapper (`flex-grow`, `w-full`) pilote désormais l'élément qui porte aussi la bordure → la pastille s'étale sur toute la largeur. Arrivé sur `mobile-layout-selection`. Remède : garder la croissance sur le bouton et poser le style visuel sur un **`<span>` interne non interactif**. **Ni le lint ni le typecheck ne le voient.**
4. **Technique de comparaison avant/après** (celle qui a attrapé le point 3) : `git stash` → recharger la page → mesurer (`getBoundingClientRect`) → `git stash pop`. À utiliser systématiquement dès qu'on fusionne des listes de classes.
5. **`Tooltip`** : son enfant doit rester un **élément DOM**. Remplacer un `<button>` par `<span className="flex">`, jamais le supprimer — sinon la ref retombe sur un composant fonction et l'on troque un avertissement contre « Function components cannot be given refs ».
6. **⚠️ i18n : éditer un JSON de locale n'a AUCUN effet sans redémarrer le dev server.** `@plane/i18n` charge ses locales par `import()` dynamique (`src/core/instance.ts` l.21) que Vite met en cache **hors du périmètre surveillé** par l'app web. Ni `touch`, ni un rebuild du package (`pnpm --filter @plane/i18n build`) ne suffisent. Contrôle décisif :
   ```bash
   curl -s 'http://localhost:3000/@fs/<chemin-absolu>/locales/en/<ns>.json?import' | grep <cle>
   ```
7. **`CustomMenu` ne s'ouvre pas à la touche Entrée.** Écart a11y **global et pré-existant** — reproduit sur un menu non modifié (menu utilisateur de la sidebar). Les 59 usages sont concernés. Sujet à part entière.
8. **Gain a11y systématique** de ces correctifs : deux boutons imbriqués sont **tous deux focusables** (`tabIndex` 0 chacun), donc chaque pastille coûtait **deux tabulations**. Mesurable en tabulant depuis le déclencheur extérieur.
9. **Famille de bug DISTINCTE — props qui fuient jusqu'au DOM** (`React does not recognize the X prop on a DOM element`). Motif : un composant déstructure une prop de contrôle pour s'en servir, puis étale `props` **entier** au lieu du reste. Vu sur `SpreadSheetPropertyIcon` (`issue-layouts/utils.tsx`) avec `iconKey`, corrigé en #64. **Où chercher** : tout composant qui fait `const { X } = props` puis `<Autre {...props} />` — le correctif est toujours `const { X, ...rest } = props` puis `{...rest}`. **Ne pas corriger dans le composant de bas niveau** (`IconWrapper` ici) : son contrat est typé `ISvgIcons` et il ne peut pas distinguer un attribut légitime d'un attribut fuité. Contrôle en direct :
   ```js
   document.querySelectorAll("[iconkey]").length; // 0 attendu
   ```
10. **Motif « lien en superposition » — pour toute carte entièrement cliquable contenant un autre contrôle.** Appliqué en #65 à la carte projet. La carte devient un `<div class="relative">`, un `<Link>` **vide** en `absolute inset-0 z-[2]` la recouvre, et chaque contrôle interne devient son **frère**. Préférable au modèle « frères » de la PR #57 (fils d'Ariane) dès que la surface cliquable compte : celui-ci l'ampute, celui-là la conserve à l'identique.
    - ⚠️ **Le piège est l'empilement CSS, pas le HTML.** Un enfant **ne peut pas** passer au-dessus d'un frère de son ancêtre porteur du contexte d'empilement. Donner `z-[3]` au bouton ne suffit donc pas s'il vit dans une rangée en `z-[1]` : il faut **remonter la rangée** au-dessus de la surcouche, lui poser `pointer-events-none`, et mettre `pointer-events-auto` sur les seuls contrôles. Attention aussi à `opacity < 1` (ici `opacity-90` en archivé), qui crée un contexte d'empilement sans z-index visible.
    - **Contrôle décisif** — `elementFromPoint` dit ce que le navigateur cible réellement zone par zone, y compris pour le clic milieu et le menu contextuel que `stopPropagation` ne couvre jamais :
      ```js
      const el = document.elementFromPoint(x, y);
      el.closest("a")?.getAttribute("href") ?? el.closest("button");
      ```

### 9.4 Travail restant — précisé et vérifié

- ~~**B — `<a>` dans `<a>` (page Projets)**~~ → **RÉSOLU en #65**, par un lien en superposition plutôt que par le modèle « frères » de la PR #57 qui aurait amputé la surface cliquable (cf. §9.3 point 10).
- **⚠️ Deux chantiers STRUCTURELS restants, chacun à faire à froid** (voir §9.6) : la famille `actionItemElement` du `Collapsible` (**6 widgets**) et `EmojiReactionPicker`. Ce ne sont plus des déplacements de classes : les deux demandent de changer l'API d'un composant partagé.
- **Vue peek : 9 imbrications → 4 restantes.** Les 5 de la rangée d'actions sont **résolues en #67** (`IssueDetailWidgetButton`, un seul fichier). Les **4 restantes** sont deux familles distinctes, chacune à traiter séparément — s'obtiennent en ouvrant un work item depuis la liste, puis :

  ```js
  [...document.querySelectorAll("button button")].map((b) => {
    const p = b.parentElement.closest("button");
    return p.getAttribute("data-slot") ?? p.id;
  });
  ```

  - **×3 autour de l'éditeur de commentaire** : deux `data-slot="popover-trigger"` (base-ui, `className="outline-none"`) et un `headlessui-popover-button`, contenant chacun un `IconButton` propel (`inline-flex aspect-square`).
  - **×1 dans le widget Pages** : un `headlessui-disclosure-button` (`className="w-full"`) contenant un bouton sans classe.

- **46 menus icon-only sans `ariaLabel`** hors famille quick-actions (recensement de la PR #55 : 59 au total, 12 traités).
- **F — listener non passif** : `packages/editor/src/core/extensions/side-menu.ts` l.160, confirmé présent.
- **G — `pnpm start` cassé** : inchangé.
- **§2.1 bug F (setState pendant le render)** : la branche WIP `fix/work-item-filters-setstate-in-render` (`41ff0382a`) **existe bien** sur `origin` — vérifié via `git ls-remote`. Voir §9.5 sur le clone.

### 9.5 Environnement — corrections importantes

- **Le clone local est `--single-branch`.** `git branch -r` paraît **vide** alors que 47 branches existent sur `origin`. Ne pas en conclure qu'une branche a disparu : utiliser `git ls-remote --heads origin`.
- **Le hook `Stop` du §4.4 n'est PAS actif** quand la session Claude Code n'est pas rootée dans le repo. Sur ce poste : **aucun `settings.json`** (ni `~/.claude/`, ni `.claude/` du dépôt — qui ne contient que `launch.json`, `rules/`, `skills/`, `zelian-apps.json`), et le subagent `zelian-framework:update-writer-after-implement` **n'est pas exposé**. Le CHANGELOG doit donc être écrit à la main — ce qui est de toute façon la consigne du §4.5.
- **`C:\Stage\Plane` est un dossier VIDE**, pas un raccourci vers le dépôt. Le code vit dans WSL (`~/dev/plane`).
- **Quoting `wsl.exe -- bash -lc '…'` : peu fiable.** Les variables shell d'une boucle (`$f`, `$p`) sont parfois mangées, et certaines commandes pourtant valides échouent sur `unexpected EOF while looking for matching \`'\``. Dès que ce n'est pas trivial : **écrire un script dans `/tmp`et l'exécuter**, et utiliser`git commit -F <fichier>`plutôt que des`-m` enchaînés.
- Le `pnpm dev` du poste lance **trois** apps sous turbo (web `:3000`, admin `:3001`, space `:3002`) en processus détaché — le tuer coupe les trois.

---

## 10. Imbrications restantes — deux chantiers STRUCTURELS

> ✅ **LES DEUX SONT FAITS** (PR #72 pour le chantier B, PR #73 pour le chantier A). Cette section reste comme trace du diagnostic ; **les résultats, les écarts par rapport à ce qui était prévu et les nouveaux pièges sont au §11**.

> Les 11 PRs des §8-9 étaient toutes des correctifs **mécaniques** : déplacer un style vers la prop de classe du conteneur. **Les deux qui suivent ne le sont pas.** Ils exigent de modifier l'API d'un composant partagé, donc une passe dédiée avec vérification de chaque appelant. Ne pas les commencer en fin de session.

### 10.1 L'OUTIL qui a débloqué le diagnostic — marche dans l'arbre de fibres React

Ni le grep ni le DOM seul ne suffisaient à nommer les composants fautifs. **Remonter l'arbre de fibres depuis le nœud DOM les nomme directement** — c'est la technique à employer d'emblée la prochaine fois :

```js
const nom = (f) => {
  const t = f.type;
  if (!t || typeof t === "string") return null;
  return t.displayName || t.name || (t.render && (t.render.displayName || t.render.name)) || null;
};
[...document.querySelectorAll("button button")].map((b) => {
  const key = Object.keys(b).find((k) => k.startsWith("__reactFiber$"));
  let f = b[key];
  const chaine = [];
  for (let i = 0; i < 40 && f; i++) {
    const n = nom(f);
    if (n && !chaine.includes(n)) chaine.push(n);
    f = f.return;
  }
  return { conteneur: b.parentElement.closest("button")?.getAttribute("data-slot"), composants: chaine.slice(0, 9) };
});
```

Sortie type : `["plane-ui-icon-button", "TooltipTrigger", …, "EmojiReactionButton", "PopoverTrigger"]` — le composant fautif et son conteneur, sans aucune recherche dans le code.

### 10.2 Chantier A — `actionItemElement` du `Collapsible` (**6 widgets**)

`Collapsible` (`packages/ui/src/collapsible/collapsible.tsx`) rend `<Disclosure.Button className={buttonClassName}>{title}</Disclosure.Button>`. Le `title` est un `CollapsibleButton`, qui affiche son `actionItemElement` **à l'intérieur** — donc le bouton d'action de chaque widget vit dans le bouton qui replie la section.

**Conséquence au-delà du HTML** : cliquer le « + » d'un widget **replie aussi la section**.

**Six appelants**, tous atteints — mon relevé DOM n'en voyait qu'un seul parce qu'un seul widget était présent sur le work item de test :

| Fichier                                           |
| ------------------------------------------------- |
| `issue-detail-widgets/pages/title.tsx` l.52       |
| `issue-detail-widgets/links/title.tsx` l.54       |
| `issue-detail-widgets/attachments/title.tsx` l.54 |
| `issue-detail-widgets/relations/title.tsx` l.54   |
| `issue-detail-widgets/sub-issues/title.tsx` l.57  |
| `milestones/milestones-section.tsx` l.81          |

**Piste de correctif** : donner au `Collapsible` un emplacement d'action rendu **frère** du `Disclosure.Button`, ou appliquer le motif de superposition du §9.3 point 10 (le `Disclosure.Button` en `absolute inset-0`, l'action au-dessus). Vérifier **les 6 widgets** — chacun a un état plié/déplié et l'action n'apparaît que déplié (`actionItemElement && isOpen`).

### 10.3 Chantier B — `EmojiReactionPicker` — **CONFIRMÉ par la console du dev**

> Trace relevée le 2026-07-18 sur `/zelian/projects/<id>/issues/` avec la vue peek ouverte, qui valide le diagnostic ci-dessous **et** le point de montage exact :
>
> ```
> button < IconButton$1 < TooltipTrigger < … < EmojiReactionButton$1
>        < div < EmojiReactionGroup$1
>        < button < PopoverTrigger < … < EmojiReactionPicker
>        < div < IssueReaction < PeekOverviewIssueDetails
> ```
>
> Le `<button>` extérieur est bien le `PopoverTrigger`, l'intérieur l'`IconButton` du bouton « ajouter une réaction », et **`EmojiReactionGroup` est entre les deux** — c'est-à-dire dans le déclencheur.

`packages/propel/src/emoji-reaction/emoji-reaction-picker.tsx` a la même forme qu'`EmojiPicker` : `label` placé dans un `Popover.Button`. Mais l'appelant (`issues/issue-detail/reactions/issue.tsx` l.132) lui passe un **`EmojiReactionGroup` entier** — c'est-à-dire **toutes les pastilles de réaction, elles-mêmes cliquables**, plus le bouton « ajouter une réaction ».

Donc : autant de boutons imbriqués **que de réactions posées**. Le work item de test n'en ayant aucune, le relevé n'en montrait que 2 (les boutons « ajouter »).

**Ce n'est pas qu'un problème de balisage** : chaque pastille de réaction déclenche aussi l'ouverture du sélecteur en remontant l'événement.

**Piste de correctif** : sortir le groupe du déclencheur — seul le bouton « ajouter » doit l'être. `EmojiReactionButton` est déjà un `forwardRef` qui spread ses props, donc il satisfait le contrat de la prop **`render` de base-ui** (l'équivalent d'`asChild` — cf. §9.3 point 1) : `<Popover.Button render={<EmojiReactionButton …/>} />` ferait du déclencheur l'`IconButton` lui-même, sans wrapper. ⚠️ Vérifier que `disabled` ne fuit pas sur un élément non-bouton si l'on tente `render={<span/>}`.

---

## 11. Troisième session du 2026-07-18 — les deux chantiers structurels sont FAITS

> Les deux chantiers du §10 sont fusionnés. **Plus aucune imbrication `button > button` ni `a > a` sur la vue peek d'un work item** — mesuré sur `preview` après fusion, avec 2 réactions posées et 3 widgets ouverts.

### 11.1 PRs

| PR  | Objet                                                                                         | État      |
| --- | --------------------------------------------------------------------------------------------- | --------- |
| #72 | `fix(reactions)` — chantier B : les pastilles de réaction sortent du déclencheur du sélecteur | fusionnée |
| #73 | `fix(collapsible)` — chantier A : l'action des widgets sort du bouton de repli                | fusionnée |

**Résultat mesuré** (work item ouvert depuis la liste, 2 réactions, widgets sub-work items + links + pages ouverts) : imbrications de boutons **5 → 0**, imbrications de liens **0 → 0**.

### 11.2 Chantier B — ce qui différait du §10.3

- **Six appelants, pas un.** Le §10.3 ne citait qu'`issue-detail/reactions/issue.tsx`. Il y en a **six**, et tous passaient un élément interactif : les 3 de `web` (issue, issue-comment, comment-reaction), `comments/card/display.tsx` (un `EmojiReactionButton` seul), et **2 dans `apps/space`** (pages publiques). Le réflexe « recenser les appelants du composant » du §6 a encore payé.
- **Le §10.3 avait raison sur la croissance** : 0 réaction → 2 imbrications, 2 réactions → 5. Toujours poser 1-2 réactions **avant** de mesurer.
- **Le second symptôme est réel** : cliquer une pastille pour retirer la réaction la retirait **et** ouvrait le sélecteur. Reproduit avant, disparu après.
- **`render` seul ne suffisait pas.** Le §10.3 proposait `<Popover.Button render={<EmojiReactionButton/>} />` : ça règle le cas `display.tsx` mais **pas** celui du groupe, où `render` ferait du déclencheur le `<div>` du groupe, pastilles toujours dedans. Il a fallu **en plus** un emplacement `addButton` sur `EmojiReactionGroup`, rendu **frère** des pastilles. Le déclencheur y atterrit en enfant flex direct parce qu'`EmojiReactionPicker` **n'émet aucun DOM propre** (le `Root` de base-ui est contextuel, le `Panel` est porté ailleurs) — d'où une rangée pixel-identique.
- ⚠️ **Ne jamais passer `label` ET `render`.** base-ui fusionne les props du composant dans l'élément rendu : un `children` à `undefined` écraserait les enfants propres de cet élément. Le code les rend mutuellement exclusifs.

### 11.3 Chantier A — le recensement complet (le point laissé ouvert)

Le §10.2 ne couvrait qu'`apps/`. Refait sur `apps/` + `packages/` + `plane-web` :

| Piste                                        | Verdict                                                                                                                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/propel/src/collapsible/`           | ⚠️ **Un SECOND `Collapsible`** (compound base-ui : `CollapsibleRoot`/`Trigger`/`Content`). **Zéro appelant applicatif** — seulement ses stories. Le piège du §9.2 à nouveau.  |
| `plane-web` (= **`apps/web/ce/`**)           | `WorkItemAdditionalWidgetCollapsibles` est un **stub renvoyant `null`** en CE. Rien à corriger.                                                                               |
| `actionItemElement`                          | Exactement les **6** du §10.2. Confirmé.                                                                                                                                      |
| Autres appelants d'`@plane/ui` `Collapsible` | **3 de plus**, non listés : `workspace/settings/members-list`, `sub-issues/issues-list/list-group`, `relations/content`. Tous du balisage **inerte** → **latent, pas actif**. |

→ **`plane-web` se résout en `apps/web/ce/`** (`apps/web/tsconfig.json` : `"@/plane-web/*": ["./ce/*"]`). À savoir pour tout recensement futur.

**Le correctif.** `CollapsibleButton` ne peut pas se corriger lui-même : il est rendu **entièrement dans** le `Disclosure.Button`, il ne peut donc pas rendre un enfant frère de son propre ancêtre. L'action remonte à `Collapsible` via un emplacement **`actionElement`**, frère de la bascule et superposé à son extrémité droite. `actionItemElement` **est supprimé** de `CollapsibleButton` — une prop qui produisait une imbrication à chaque usage n'est pas une prop, c'est un piège.

- Le conteneur `relative` n'apparaît **que** s'il y a une action → les 3 appelants inertes gardent leur DOM à l'octet près.
- `milestones-section.tsx` avait un `preventDefault` + `stopPropagation` qui **masquait exactement ce bug** ; devenu inutile, supprimé. Un contournement de ce genre est un **indice** qu'un élément est au mauvais endroit dans l'arbre.
- ⚠️ `sub-issues` : son `title` renvoie `null` tant que les sous-work-items ne sont pas chargés, ce qui masquait aussi l'action. `root.tsx` dérive désormais la même condition.

### 11.4 Enseignements techniques (nouveaux)

1. **⚠️ Mesurer la géométrie RELATIVEMENT à la rangée de l'élément, jamais en coordonnées absolues.** Une première mesure absolue annonçait un décalage d'1 px sur le widget des sous-work-items : c'était de l'**arrondi** sur un décalage de page de 0,5 px entre deux chargements. J'ai failli « corriger » un problème inexistant (un `py-3` compensatoire, ajouté puis retiré). Motif correct :

   ```js
   const row = toggle.getBoundingClientRect();
   const r = action.getBoundingClientRect();
   ({ dTop: +(r.top - row.top).toFixed(2), dRight: +(row.right - r.right).toFixed(2) });
   ```

   Et **garder les décimales** : `Math.round` fabrique de faux écarts d'1 px.

2. **Un padding symétrique ne déplace pas un centre.** Inutile de reproduire le `py-3` d'une rangée pour recentrer une superposition. Seule l'**asymétrie** compte : ici la bordure basse de 1 px, intérieure au `h-12` (`box-sizing: border-box`), d'où le `bottom-px` sur la superposition — sans lui, l'action descend d'un demi-pixel.
3. **Vite sert un module intermédiaire cassé si l'on édite le JSX avant l'import.** Un `ReferenceError: X is not defined` est apparu alors que le fichier source était correct. **Ne pas mal-attribuer** (§4.3) : contrôler ce que le serveur sert vraiment, puis recharger.

   ```bash
   curl -s http://localhost:3000/core/components/<chemin>.tsx | grep -nE '^import|<marqueur>'
   ```

4. **`aria-expanded` du `Disclosure.Button` de `Collapsible` est FAUX.** L'état interne de headlessui et le `localIsOpen` du composant sont **découplés** : le `Disclosure.Panel` est `static` et sa visibilité vient de `Transition show={localIsOpen}`. Constaté : `aria-expanded="false"` sur une section ouverte. **Préexistant, non corrigé** — vrai écart a11y sur tous les widgets, même famille que la #61. **Sujet à part entière.**
5. **Les packages sont consommés en `dist/`, reconstruits par `tsdown --watch`.** Une modif dans `packages/propel` ou `packages/ui` n'atteint l'app qu'après reconstruction (~6-15 s). Contrôle **indispensable autour d'un `git stash`**, sinon on mesure l'ancien code :

   ```bash
   grep -c '<marqueur>' packages/ui/dist/index.js   # 0 = stashé, >0 = correctif en place
   ```

### 11.5 Environnement — corrections au §4.7 et au §9.5

- **⚠️ node/pnpm sont gérés par `mise`**, pas par nvm : `~/.local/share/mise/installs/node/22.18.0/bin`. Ils ne sont **pas** dans le PATH d'un `bash -lc` non interactif.
- **⚠️ Le PATH Windows fuit dans `wsl.exe -- bash -lc`** et casse tout `export PATH=…` (`export: 'Files/Git/…' not a valid identifier`). Remède fiable : **un script avec un PATH explicite**, appelé **depuis PowerShell** — Git-bash réécrit `/tmp/x.sh` en chemin Windows (`C:/Users/…`), pas PowerShell.

  ```bash
  #!/bin/bash
  export PATH="$HOME/.local/share/mise/installs/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin"
  cd "$HOME/dev/plane" || exit 1
  exec "$@"
  ```

  ```powershell
  wsl.exe -d Ubuntu-24.04 -- bash /tmp/plane-check.sh pnpm --filter web check:types
  ```

- **Les heredocs `<< 'EOF'` via Git-bash vers WSL cassent** sur les backticks du Markdown (« unexpected EOF while looking for matching `'` »). Écrire le fichier puis l'ajouter — confirme le §9.5.
- **PowerShell 5.1 emballe la stderr d'un exe dans une `NativeCommandError`** même à code de sortie 0 : un `check:types` qui réussit **paraît** échouer. Lire la sortie, pas le statut.
- **⚠️ Un `serve -s build/client -l 3000` traîne dans les processus** (build statique périmé). Il **n'a jamais réussi à se lier** au port — c'est bien le dev server Vite qui tient `:3000`. Ne pas s'y fier, vérifier :

  ```bash
  ss -ltnp | grep ':3000'   # doit pointer sur @react-router/dev/bin.js
  ```

- `pnpm dev` lance web `:3000`, admin `:3001`, space `:3002`, plus les `tsdown --watch` de tous les packages.
- **⚠️ WSL vide `/tmp` à chaque redémarrage du distro.** Les scripts d'aide doivent vivre dans `$HOME`, pas dans `/tmp`, sinon ils disparaissent entre deux sessions. Deux sont en place : `~/plane-start-web.sh` et `~/plane-start-sso.sh`.
- **Lancer un serveur en fond** : `Start-Process wsl.exe … -WindowStyle Hidden` **ne tient pas** — le processus meurt aussitôt. Passer par l'exécution en tâche de fond du harnais.

### 11.5.1 ⚠️ Docker Desktop — sockets périmés qui bloquent le démarrage (RÉCURRENT)

> **Symptôme trompeur : Docker a l'air de démarrer indéfiniment.** Il n'en est rien — il **crashe ~10 s après le lancement** et reste derrière une boîte d'erreur (« An unexpected error occurred », boutons _Quit_ / _Reset to factory defaults_) qui peut passer inaperçue derrière les autres fenêtres. Vu le 2026-07-19 : 40 min d'attente pour un processus mort depuis 40 min.

**Diagnostic — ne pas attendre, lire le log** :

```powershell
Get-Content "$env:LOCALAPPDATA\Docker\log\host\com.docker.backend.exe.log" -Tail 40
```

La ligne qui compte :

```
backend crashed, dumping error to file and reporting to user: starting services:
initializing Inference manager: listening on unix://…/Docker/run/dockerInference:
remove …/Docker/run/dockerInference: The file cannot be accessed by the system.
```

**Cause.** Des fichiers socket AF_UNIX (des points d'analyse NTFS) restent derrière un arrêt non propre et deviennent **inaccessibles au système** — erreur 1920, y compris pour `fsutil reparsepoint query` et pour toute suppression. Docker essaie de les effacer avant de s'y lier, échoue, et abandonne. **Deux emplacements** sont touchés, et Docker ne signale que le premier : il faut traiter les deux, sinon le démarrage suivant échoue sur l'autre.

| Emplacement                             | Fichiers                                                               |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `%LOCALAPPDATA%\Docker\run\`            | `dockerInference`, `dockerEthernetVfkit`, `userAnalyticsOtlpHttp.sock` |
| `%LOCALAPPDATA%\docker-secrets-engine\` | `engine.sock`                                                          |

**Correctif.** La suppression échoue (le système ne peut pas ouvrir les fichiers) : **renommer les dossiers parents**, ce qui est une opération sur l'entrée de répertoire et fonctionne. Docker les recrée vides. C'est aussi réversible, contrairement à une suppression.

```powershell
Get-Process 'Docker Desktop','com.docker.backend' -EA SilentlyContinue | Stop-Process -Force
$s = Get-Date -Format 'yyyyMMdd-HHmmss'
foreach ($d in @("$env:LOCALAPPDATA\Docker\run", "$env:LOCALAPPDATA\docker-secrets-engine")) {
  if (Test-Path $d) { Move-Item -LiteralPath $d -Destination "$d.broken-$s" -Force }
}
Start-Process "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
```

Puis attendre le moteur, et **relancer la pile Plane** — les conteneurs existent déjà, `start` suffit et évite les soucis de chemin WSL/Windows de `compose -f` :

```bash
docker.exe compose -p plane start    # db, redis, mq, minio, migrator, api, worker, beat-worker
```

⚠️ **`docker` n'existe pas dans le distro Ubuntu-24.04** (intégration WSL désactivée) : utiliser `docker.exe`, ou passer par PowerShell.

**C'est récurrent, et le cycle s'auto-entretient.** Au moment du correctif, `%LOCALAPPDATA%\Docker\` contenait déjà `run.stale`, `run.stale2` et `run.stale-20260718-122138`, plus les `docker-secrets-engine.stale*` correspondants — **trois contournements identiques déjà appliqués les 17-18/07**. La mécanique : Docker démarre, crée ses sockets, crashe sur un socket périmé plus loin, **laisse les siens derrière lui**, et ceux-là bloqueront le démarrage suivant. Renommer débloque une fois ; ça revient.

**Levier probable** : un arrêt non propre de Docker (machine éteinte ou mise en veille avec Docker actif — le jour du constat, WSL n'avait qu'une minute d'uptime). Quitter Docker Desktop explicitement avant d'éteindre devrait éviter la récidive. Si le problème persiste malgré ça, la piste suivante est un antivirus/EDR qui interfère avec ces points d'analyse. **Non élucidé à ce jour.**

### 11.6 Travail restant — À JOUR au 2026-07-19

> **État de la vue peek : 0 imbrication `button > button`, 0 `a > a`, 0 avertissement `setState`** — mesuré sur `preview` fusionné (`200d80d`), tous widgets dépliés avec leurs données. Les PR #72 → #78 sont toutes fusionnées, `preview` est propre, aucune PR ouverte.

**Priorité affichée par le dev (2026-07-19), dans l'ordre :**

1. ✅ `aria-expanded` mensonger de `Collapsible` → **fait**, PR #76.
2. ✅ Vérifier les 3 widgets non exercés → **Relations et Attachments faits** ; **Milestones reste bloqué**, voir ci-dessous.
3. ✅ `setState` pendant le render de `WorkItemFiltersToggle` → **fait**, PR #77 (§11.7).
4. ⬜ **À FAIRE — le reste** : 46 menus icon-only sans `ariaLabel` ; stories `emoji-reaction-picker` ; listener non passif ; `pnpm start` cassé. Détail ci-dessous.

#### Priorité 4 — non commencée

- **46 menus quick-actions icon-only sans `ariaLabel`** (a11y). Le §9.4 les avait recensés. `CustomMenu` accepte déjà une prop `ariaLabel` (utilisée sur le chemin `ellipsis`, cf. `packages/ui/src/dropdowns/custom-menu.tsx` ~l.276) — c'est donc du remplissage de prop, pas un changement de structure. Vérifier au passage que le compte de 46 est toujours juste : il date d'avant les PR #72-#78.
- **Stories `packages/propel/src/emoji-reaction/emoji-reaction-picker.stories.tsx`** : 4 endroits passent encore un `<button>` en `label`. Même anti-motif que la #72, confiné à Storybook donc non expédié — mais c'est ce que le prochain lecteur copiera. Le correctif est le même qu'en #72 : soit `render={…}`, soit passer du contenu inerte et déporter le style sur `buttonClassName`.
- **Listener non passif** — `packages/editor/src/core/extensions/side-menu.ts` l.160. Gain de perf réel, y compris en prod.
- **`pnpm start` de l'app web cassé** (§8.3 G).

#### Trouvé pendant la session du 2026-07-19, non traité

- **⚠️ « Manage features » mène à une 404.** Sur `/<ws>/projects/<id>/milestones/` quand la fonctionnalité est désactivée, le bouton pointe sur `/<ws>/settings/projects/<id>/features/` — **cette route n'a pas de page à son propre niveau** (`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/` ne contient que des sous-dossiers `cycles`, `intake`, `modules`, `pages`, `views`). Et `ProjectFeaturesList`, qui porte le basculeur `is_milestone_enabled`, n'est référencé **que depuis la modale de création de projet** (`project-feature-update.tsx` ← `create-project-modal.tsx`). Conséquence : **aucun moyen d'activer une fonctionnalité sur un projet existant depuis l'UI**. C'est probablement le bug le plus utile de cette liste.
- **`FilterDisplayProperties` — `Each child in a list should have a unique "key" prop`.** Visible dans la console via `SubIssueDisplayFilters` → `SubWorkItemTitleActions` → `FiltersDropdown`. Préexistant.
- **Incohérence de validation des pièces jointes** : l'API refuse un `text/plain` avec « Invalid file type » alors que `ATTACHMENT_MIME_TYPES` (`apps/api/plane/settings/common.py` ~l.461) le contient. Le message d'erreur vient d'un autre contrôle (`apps/api/plane/app/views/asset/v2.py` l.138/352, « Only JPEG, PNG, WebP, JPG and GIF »). À démêler.
- **Liste des sous-work-items vide** malgré « 0/1 Done ». **Vérifié par `git stash` : identique sur `preview` non modifié** → préexistant, pas une régression.

#### Réserves de vérification assumées (ne pas les relire comme « vérifié »)

- **Milestones (#73) toujours non exercé en direct.** La fonctionnalité n'est pas activée sur le projet de test, et **il n'existe pas d'UI pour l'activer** (voir la 404 ci-dessus). Les deux seules voies sont : créer un projet en cochant la fonctionnalité à la création, ou écrire `is_milestone_enabled` en base. **Demander au dev avant** — les deux ont un impact. C'est le widget le plus à surveiller : seul dont l'action n'est pas un bouton d'icône standard, et seul dont le `onClick` a changé (retrait d'un `stopPropagation`).
- **`members-list` (#76)** : la branche `Collapsible` ne s'affiche qu'avec des **invitations en attente**, il n'y en a pas. Envoyer une invitation est une action sortante → demander avant.
- **`apps/space` (#72)** : jamais rendu en navigateur, il faudrait publier une page (bascule un projet en « public »).
- **5 layouts filtrés sur 7 (#77)** : cycle, module, vue projet, profil, archives — pas de données sur le projet de test. Même HOC, même contrat, 11 points d'appel audités statiquement.

#### Jeu de données de test — NE PAS NETTOYER

Le work item **PLANETEST-1 « bug fixing »** porte volontairement : **2 réactions**, **1 sous-work-item**, **1 relation** vers PLANETEST-2, **1 lien**, **1 pièce jointe** (`verif-widget.png`), **1 page**, **1 commentaire avec réaction**. Sans ces données, **les widgets et les pastilles n'existent pas dans le DOM et les défauts redeviennent invisibles** — c'est précisément l'angle mort qui a fait manquer trois bugs (pastilles de réaction, widgets, ligne de pièce jointe). Les recréer avant toute mesure si elles disparaissent.

**Leçon transverse :** un relevé DOM ne vaut que ce que vaut le jeu de données affiché. Trois défauts de cette série n'apparaissent qu'avec la donnée : le nombre d'imbrications des réactions **croît avec le nombre de réactions**, les widgets n'existent pas sans sous-tâche/lien/pièce jointe, et la ligne de pièce jointe n'existe pas sans pièce jointe. Toujours peupler avant de conclure « 0 ».

### 11.7 Bug F résolu — `setState` pendant le render (`WorkItemFilterRoot`)

Le WIP `41ff0382a` du §2.1 était **correct sur le fond** ; il ne manquait que la vérification live qu'il réclamait lui-même. Repris tel quel sur `fix/work-item-filters-setstate-in-render-verified`, vérifié, fusionné.

**Ce que l'audit des 11 appelants a changé.** Le §2.1 affirmait qu'aucun consommateur n'utilise le render-prop `({ filter })`. **Faux — les 11 l'utilisent.** La conclusion « aucun call-site ne casse » tenait quand même, mais pour une autre raison : **tous gardent déjà** par `{filter && …}`. Et surtout, le vrai risque n'était pas aux points d'appel : `base.tsx` lisait `workItemLayoutFilter.configManager` **dans un tableau de dépendances** — évalué pendant le render, donc aucune garde d'appelant n'aurait protégé. Le WIP le traitait déjà (`if (!workItemLayoutFilter) return;` + dépendance sur l'instance, pas sur `.configManager`).

**Point non documenté par le WIP** : `updateFilters` est un `.bind()` recréé à chaque render (`project-layout-root.tsx` l.75), donc l'effet de création/synchro se relance **à chaque rendu**. Pas de boucle infinie — les mutations internes de l'instance ne renotifient pas le root, qui n'observe que la clé de la Map — et le comportement est inchangé, l'ancien `useMemo` ayant exactement les mêmes dépendances instables.

**⚠️ Méthode : ne pas conclure depuis `read_console_messages`.** Le buffer MCP **persiste entre les rechargements** (§4.1) : après la comparaison par `git stash`, il contenait encore les avertissements du chargement « stashé » et faisait croire à un échec du correctif. Protocole fiable, sans toucher au code source :

```js
// 1) installer la sonde
window.__probe = { total: 0 };
const orig = console.error.bind(console);
console.error = (...a) => {
  if (a.map(String).join(" ").includes("while rendering a different component")) window.__probe.total++;
  orig(...a);
};
// 2) forcer un démontage/remontage par navigation CLIENT (pas de reload, qui tuerait la sonde)
// 3) auto-tester la sonde, sinon un zéro ne prouve rien
console.error(
  "Warning: Cannot update a component (%s) while rendering a different component (%s).",
  "SYNTH",
  "SELFTEST"
);
```

**Résultat** : avant → l'avertissement se déclenche au chargement ; après → **0 occurrence réelle** sur un cycle complet démontage/remontage, sonde auto-testée, sur **deux types d'entité** (`project` via la liste des work items, `workspace` via `workspace-views/all-issues`). Filtrage exercé de bout en bout : Priority = Urgent → 0 item affiché, « Clear all » → les 2 items reviennent. L'instance parvient bien au `FiltersToggle` (`filterType: "FilterInstance"` relevé dans l'arbre de fibres).

**Non exercés en direct** : cycle, module, vue projet, profil, archives — pas de données pour ces layouts sur le projet de test. Ils passent par le **même** HOC avec le même contrat, et les 11 appelants ont été audités statiquement (tous gardés).

---

## 12. Reprise — à lire avant de toucher au code (2026-07-19)

### 12.1 Framework Zelian — il est DANS ce dépôt, il n'avait pas été lu

`.claude/rules/` et `.claude/skills/` existent à la racine de `plane` et **n'avaient été consultés par aucune des sessions précédentes** — les PR #41 à #76 ont été faites sans. À lire d'emblée :

| Fichier                                       | Ce qu'il impose ici                                                                                              |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `.claude/rules/00-global.md`                  | CHANGELOG obligatoire par feature ; `@update-writer-after-implement` après chaque implémentation ; politique ADR |
| `.claude/rules/05-git-workflow.md`            | Conventional Commits, PR obligatoire, 1 review minimum, MCP GitHub                                               |
| `.claude/rules/04-testing.md`                 | « TDD obligatoire », RTL pour les composants UI                                                                  |
| `.claude/skills/create-pull-request/SKILL.md` | Base `preview` ; titre `[WORK-ITEM-ID] <type>: …` ; corps suivant `.github/pull_request_template.md`             |
| `.claude/skills/branch-name/SKILL.md`         | `<type>/<work-item-id>-<description>`                                                                            |

**Trois écarts constatés, à trancher plutôt qu'à ignorer :**

1. **Le template de PR** (`.github/pull_request_template.md`) existe et n'était pas utilisé. **Adopté depuis la #77** (Description / Type of Change / Screenshots / Test Scenarios / References) — continuer.
2. **`@update-writer-after-implement` est déclaré obligatoire mais n'est pas invocable** : il n'y a **aucun `.claude/settings.json` ni hook `Stop`** dans ce dépôt, et l'agent n'était pas disponible dans la session. Si la nouvelle session y a accès (plugin `zelian-framework` chargé), **l'invoquer après chaque implémentation**, en lui précisant : CHANGELOG déjà écrit (ne pas dupliquer), pas de changement BDD, **aucun ADR** (un bugfix échoue la whitelist de `06-adr-policy.md`), pas de module `docs/specs/` correspondant, et **ne rien committer ni pousser**.
3. **« TDD obligatoire » est inapplicable en l'état sur le front** : ni script `test`, ni config vitest/jest, ni un seul `*.test.tsx` dans `packages/ui` ou `apps/web` — seule l'API a une suite (`apps/api/plane/tests/`). La vérification navigateur en tient lieu de fait. **Monter l'infra de test front serait un chantier à part entière** : ne pas l'improviser au détour d'un bugfix, en parler au dev.

**Question ouverte pour le dev :** le skill `create-pull-request` veut un `[WORK-ITEM-ID]` en préfixe de titre, mais **aucune PR du dépôt (#41 → #78) n'en porte**. La pratique établie a été suivie (`fix(scope): …`). À arbitrer.

### 12.2 Les trois réflexes qui ont payé sur cette série

1. **Recenser TOUS les appelants avant de toucher un composant partagé** — et couvrir `apps/` **plus** `packages/` **plus** `plane-web` (= `apps/web/ce/`). Ça a changé la nature du correctif trois fois : 6 appelants au lieu d'1 (#72), un **second `Collapsible`** homonyme dans `packages/propel` sans appelant (#73), et un `<Disclosure.Panel>` orphelin qui aurait planté (#76).
2. **Mesurer avant/après par `git stash`** — et **relativement à la rangée de l'élément**, jamais en coordonnées absolues, en gardant les décimales. Une mesure absolue a fabriqué un faux écart d'1 px que j'ai failli « corriger » (§11.4 point 1).
3. **Un `stopPropagation` est un indice de diagnostic.** Trois fois dans cette série il masquait un élément mal placé dans l'arbre : `milestones-section`, la carte projet, la ligne de pièce jointe. Quand on en trouve un, chercher l'imbrication qu'il compense.

### 12.3 Piège de vérification à ne pas répéter

**`read_console_messages` (MCP) persiste entre les rechargements.** Après une comparaison par `git stash`, il renvoyait encore les avertissements du build pré-correctif et m'a fait croire à un échec. Protocole fiable, sans toucher au code source — détaillé au §11.7 :

1. installer une sonde `console.error` dans la page ;
2. forcer un démontage/remontage par **navigation client** (un `reload` tuerait la sonde) ;
3. **auto-tester la sonde** en émettant un faux message — sans ça, un zéro peut simplement signifier que l'instrument est cassé.

### 12.4 Environnement — l'essentiel en un coup d'œil

- **Dépôt dans WSL** : `~/dev/plane` (`\\wsl.localhost\Ubuntu-24.04\home\lucie\dev\plane`). `C:\Stage\Plane` est **vide**.
- **node/pnpm via `mise`** : `~/.local/share/mise/installs/node/22.18.0/bin`, absents d'un `bash -lc` non interactif. Scripts prêts, **dans `$HOME` car WSL vide `/tmp` à chaque redémarrage** : `~/plane-check.sh` (exécute une commande avec le bon PATH), `~/plane-start-web.sh`, `~/plane-start-sso.sh`.
- **Appeler WSL depuis PowerShell**, pas depuis Git-bash (qui réécrit `/tmp/x.sh` en chemin Windows). PowerShell 5.1 emballe la stderr d'un exe dans une `NativeCommandError` même à code 0 : **lire la sortie, pas le statut**.
- **Services** : `:8000` API (Docker), `:3000` web, `:3102` SSO — **sans `:3102`, pas de login**. `docker` n'existe pas dans le distro Ubuntu → utiliser `docker.exe`, et `docker.exe compose -p plane start` pour relancer la pile.
- **⚠️ Si Docker « ne démarre pas » : ne pas attendre, aller au §11.5.1.** Il crashe ~10 s après le lancement sur des sockets périmés et reste derrière une boîte d'erreur. C'est **récurrent**.
- **Le SSO demande un mot de passe** : c'est au dev de se connecter, pas à l'assistant.

---

## 13. Session du 2026-07-19 (soir) — la priorité 4 du §11.6 est FAITE

> Les 4 sujets de la priorité 4 sont traités, chacun sur sa branche, chacun avec sa PR. **Aucune n'est fusionnée** : le §4.6 demande l'accord du dev avant merge.

### 13.1 PRs

| PR  | Objet                                                                              | État    |
| --- | ---------------------------------------------------------------------------------- | ------- |
| #80 | `fix(quick-actions)` — nom accessible sur 12 menus icon-only + 8 clés × 19 locales | ouverte |
| #81 | `fix(propel)` — 6 `<button>` passés en `label` dans les stories du sélecteur       | ouverte |
| #82 | `perf(editor)` — écouteur de défilement du menu latéral rendu passif               | ouverte |
| #83 | `fix(deps)` — override `path-to-regexp` scopé, `pnpm start` réparé                 | ouverte |

### 13.2 ⚠️ Les DEUX comptes annoncés par le §11.6 étaient faux

- **« 46 menus quick-actions icon-only »** → le vrai compte est **17**. Le 46 datait d'avant les PR #72-#78 et **mélangeait deux familles**. Recensement refait en parsant chaque balise ouvrante `<CustomMenu>` avec suivi des accolades et des guillemets (un regex simple tronque dès qu'une prop contient du JSX) : 25 menus `ellipsis`/`verticalEllipsis` au total, dont **8 déjà traités par la PR #55** — le §9.4 disait 12, mais 4 de ces 12 sont des menus `customButton`, pas `ellipsis`. La #80 en traite 12, il en reste **5** (voir §13.3).
- **« stories emoji-reaction-picker : 4 `<button>` en label »** → il y en a **6** : `WithCustomLabel`, `InlineReactions`, `SearchDisabled`, `CustomSearchPlaceholder`, `CloseOnSelectDisabled`, `InMessageContext`.
- **Famille distincte, non traitée** : ~8 déclencheurs `customButton` **icon-only** sans `ariaLabel` — aide de la sidebar (`workspace/sidebar/help-section/root.tsx`, confirmé sans nom dans le DOM de l'accueil), en-têtes d'inbox (`inbox-issue-header.tsx` l.381, `inbox-issue-mobile-header.tsx` l.137), « + » des en-têtes de groupe kanban et liste, `mobile-layout-selection.tsx`, et le tri d'inbox sous 1280 px (`inbox-filter/sorting/order-by.tsx`, icône seule sur petit écran). **Ne pas les confondre avec la famille quick-actions** : ils ne relèvent pas du namespace i18n `quick_actions.*`.

### 13.3 Pourquoi 5 sites sont volontairement restés hors de la #80

Leurs fichiers portent des avertissements **`jsx-a11y` préexistants** sur un `<div onClick>` voisin, que le `--deny-warnings` du hook fait remonter dès qu'on stage le fichier. Le §4.2 demande de **corriger** ces cas plutôt que de les suppresser, et **aucun précédent de suppression de ces deux règles n'existe dans le dépôt** (les seuls `eslint-disable jsx-a11y` sont des `no-autofocus` venus de l'upstream). Supprimer des avertissements d'accessibilité à l'intérieur d'une PR d'accessibilité aurait été contradictoire.

Les 5 sites, avec la clé i18n qui les attend (les 4 clés `link`, `sub_work_item`, `related_work_item`, `project_member` ont été **retirées** de la #80 pour ne pas livrer de clés mortes — elles partiront avec ce lot) :

| Fichier                                                                                | Clé                 | Ce qu'il faut corriger d'abord                                                                              |
| -------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `issues/issue-detail-widgets/sub-issues/issues-list/list-item.tsx`                     | `sub_work_item`     | l.128 `<div onClick>` qui bascule l'aperçu → vrai `<button>` ; l.173 pur avaleur d'événement                |
| `issues/issue-detail/links/link-item.tsx`                                              | `link`              | l.85 `<span onClick>` qui copie le lien → vrai `<button>`                                                   |
| `issues/relations/issue-list-item.tsx`                                                 | `related_work_item` | l.151 pur avaleur d'événement                                                                               |
| `project/settings/member-columns.tsx`                                                  | `project_member`    | l.83 `<div onClick>` **dans** un `CustomMenu.MenuItem` — le `onClick` doit remonter sur la prop du MenuItem |
| `packages/ui/src/link/block.tsx` (+ son appelant `home/widgets/links/link-detail.tsx`) | `link`              | l.30 carte entièrement cliquable → motif « lien en superposition » du §9.3 pt 10                            |

⚠️ `LinkItemBlock` a **exactement un appelant** (le widget « Quick links » de l'accueil) — vérifié par `git grep` sur `apps/` + `packages/`. Et **`packages/ui` n'a aucune dépendance i18n** : le libellé doit y arriver **par une prop** depuis l'appelant, pas par un `useTranslation` dans le paquet.

### 13.4 Deux points d'entrée d'outillage cassés, trouvés en chemin

- **⚠️ Storybook ne démarre pas du tout.** `pnpm storybook` dans `packages/propel` sert bien sur `:6006`, mais **les 396 stories** échouent au rendu sur `ReferenceError: process is not defined`, levé depuis `packages/constants/dist`. Vérifié global et **préexistant** : `components-accordion--default`, sans aucun rapport avec les stories emoji, échoue à l'identique. C'est ce qui a empêché de vérifier la #81 au navigateur. Même famille que le `pnpm start` cassé — mérite sa propre branche.
- **`apps/live` ne tourne pas** (service de collaboration Yjs). Conséquence : une page projet reste bloquée sur « Syncing… » avec des squelettes, et **l'éditeur de page ne finit jamais de monter**. Ce n'est pas une régression, c'est un service à démarrer. À ajouter à la liste du §12.4 si on veut vérifier quoi que ce soit dans l'éditeur de pages. L'éditeur **rich-text** (description d'un work item) n'en dépend pas, lui.

### 13.5 Trois faux positifs de mesure rencontrés — tous auraient fait conclure à tort

Le §12.3 avertissait sur `read_console_messages`. Cette session en a produit **trois autres**, de la même nature : l'instrument ment, pas le code.

1. **`Test-NetConnection localhost -Port 3000` renvoie `True` alors que RIEN n'écoute.** Au démarrage, PowerShell annonçait les ports 3000 et 3102 ouverts ; `curl` depuis WSL renvoyait `000`, et `Get-NetTCPConnection -State Listen` ne trouvait aucun processus. **Contrôle fiable : `curl` depuis WSL**, pas `Test-NetConnection`.
2. **`serve` bascule silencieusement sur un port aléatoire si le sien est pris.** Le premier test de `pnpm start` a renvoyé un `HTTP 200` réconfortant **avant** tout correctif : le dev server tenait le port 3000, `serve` s'était rabattu sur `:38143`, et c'est le dev server qui répondait. **Libérer le port avant de conclure sur `pnpm start`.**
3. **Une sonde `addEventListener` posée deux fois double ses captures.** Entre deux mesures, le wrapper de la passe précédente était resté en place ; comme il référence `window.__probe` dynamiquement, les deux wrappers écrivaient dans le même tableau. **L'auto-test l'a attrapé** (2 captures attendues, 4 obtenues) — sans lui, la mesure aurait été fausse d'un facteur 2 en silence. Remède : recharger vraiment le document (`location.href = …`, pas la navigation client du MCP qui garde le document) et **refuser d'installer la sonde si `window.__probe` existe déjà**.

**Leçon transverse, à mettre à côté de celle du §11.6** : un instrument non auto-testé peut rendre un zéro parfaitement propre parce qu'il est mort — et un instrument mal ciblé peut rendre un 200 parfaitement propre parce qu'il interroge le mauvais processus.

### 13.6 Framework Zelian — l'agent EXISTE, contrairement au §12.1

Le §12.1 notait que `@update-writer-after-implement` « n'est pas invocable ». **Il l'était cette session** (plugin `zelian-framework` chargé). Invoqué après chacune des 4 implémentations, avec le contexte imposé (CHANGELOG déjà écrit, pas de BDD, aucun ADR, pas de `docs/specs/`, ne rien committer). **Les 4 fois, conclusion « rien à synchroniser »** — motivée : aucun module `docs/specs/` ne correspond aux composants UI core, à `packages/propel`, à `packages/editor` ni à un fichier de dépendances, et un bugfix échoue la whitelist des 7 catégories du `06-adr-policy.md`. Le seul fichier qu'il touche est `.claude/.update-writer-ran`, qui est **gitignoré** (`.gitignore:127`) — aucun risque de le committer par accident.

**Reste vrai** : « TDD obligatoire » (`04-testing.md`) est toujours inapplicable — le front n'a toujours aucune infra de test. À arbitrer avec le dev, hors bugfix.

### 13.7 Travail restant — à jour au 2026-07-19 (soir)

1. ⬜ **Les 5 menus icon-only reportés** (§13.3) — nécessite d'abord de transformer les `<div onClick>` voisins en vrais contrôles. C'est le prolongement direct de la #80, avec ses 4 clés i18n déjà rédigées mais retirées.
2. ⬜ **La famille `customButton` icon-only** (§13.2, ~8 sites) — namespace i18n à choisir, ce ne sont pas des quick-actions.
3. ⬜ **Storybook cassé** (§13.4) — bloque toute vérification visuelle de composant.
4. ⬜ **« Manage features » mène à une 404** (§11.6) — toujours non traité, et **toujours le plus utile de la liste** : il n'existe aucun moyen d'activer une fonctionnalité sur un projet existant depuis l'UI. C'est aussi ce qui bloque la vérification de Milestones (#73).
5. ⬜ **`FilterDisplayProperties` — clé React manquante** (§11.6), préexistant.
6. ⬜ **Incohérence de validation des pièces jointes** (§11.6), préexistant.
7. ⬜ **`custom-image/components/block.tsx` l.185** — `touchmove` non passif pendant le redimensionnement d'image. Éligible (le handler n'appelle pas `preventDefault`), mais le rendre passif tranche une question d'UX : le redimensionnement tactile doit-il empêcher la page de défiler ? À décider avant de toucher. ⚠️ Le `{ passive: false }` de `full-screen/modal.tsx` l.188 est **délibéré et correct**, ne pas y toucher (§8.3 F le disait déjà, c'est confirmé : `handleWheel` appelle bien `preventDefault` l.158).

**Les réserves de vérification du §11.6 restent valables telles quelles** (Milestones jamais exercé, `members-list` sans invitation en attente, `apps/space` jamais rendu). Le **jeu de données PLANETEST-1 est intact** et a de nouveau servi : sans sa pièce jointe et sa page liée, la #80 n'aurait été vérifiable sur aucun site.
