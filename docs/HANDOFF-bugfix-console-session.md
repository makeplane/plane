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

**État : un WIP existe et est poussé** sur `origin/fix/work-item-filters-setstate-in-render` (commit `41ff0382a`, message « UNVERIFIED / DO NOT MERGE AS-IS »). Il déplace la création/synchro dans un `useEffect` (après commit) et lit l'instance réactivement via `getFilter`. Analyse déjà faite : **le changement de type ne casse aucun call-site** (`shared.ts` typait déjà `filter: IWorkItemFilterInstance | undefined`, et **aucun** consommateur n'utilise le render-prop `({ filter })` — le filtre circule par le store).

**Ce qui reste :** la **vérification live**. Après le montage, le filtre est `undefined` pendant un render — il faut confirmer qu'il n'y a ni flash ni filtrage tardif, sur **tous** les layouts filtrés : liste work items projet, cycle, module, vue projet, workspace-views, profil, archives. C'est de l'**infra partagée (~14 fichiers utilisent les HOC)** → ne merger qu'après cette vérif.

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
2. Démarrer les 3 services (§4.7) — **ne pas oublier `:3102`**, sinon pas de login.
3. **Le navigateur intégré (`mcp__Claude_Browser__*`) suffit** : `preview_start` sur `http://localhost:3000`, la session SSO se résout seule. Le §4.1 qui prétend le contraire est **faux** — voir §8.1.
4. Choisir un sujet **dans le §10** (les deux chantiers structurels) ou dans le §9.4 (le reste). **Ne PAS partir du §2 ni du §8.3 sans avoir lu le §9.2** : plusieurs de leurs entrées sont résolues ou mal attribuées.
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
