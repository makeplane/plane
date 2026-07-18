# HANDOFF — Bug-fixing des erreurs console Plane (web)

> Document de reprise pour une nouvelle session Claude Code. Repo : `C:\Stage\plane`. Branche de travail : `preview` (fork `userLinpy/plane`, upstream `makeplane/plane`). Rédigé le 2026-07-15.

## 0. Objectif global

Corriger les erreurs de la console navigateur de l'app **web** de Plane, **une branche `fix/<nom-du-problème>` par problème distinct**, chacune : fix → vérif navigateur → commit (hook lint) → entrée CHANGELOG → PR (base `preview`, repo `userLinpy/plane`) → **review** → merge → `@update-writer-after-implement`.

## 1. Ce qui est DÉJÀ fait (5 PRs mergées dans `preview`)

| PR  | Problème console                                               | Cause racine & fix                                                                                                                                                                                                                                            | Fichiers                                                                                                                      |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| #41 | `Hydration failed…` + `TypeError: Component is not a function` | **La vraie racine, pas la sidebar** : `HydrateFallback` (next-themes) rendait `<div/>` vide côté serveur mais `<div><LogoSpinner/></div>` côté client (theme résolu synchronement) → mismatch. Fix : gate sur un état `mounted` (false au 1er render client). | `apps/web/app/root.tsx`                                                                                                       |
| #42 | `<button>` dans `<button>` (menus)                             | `CustomMenu` enveloppe son `customButton` dans un `<button>` ; les menus passaient `<AppSidebarItem variant="button">` (un `<button>`). Fix : rendu via `AppSidebarItem.Icon` (`<div>`) + styles `base` sur `customButtonClassName`.                          | `help-section/root.tsx`, `user-menu-root.tsx`, `workspace-menu-root.tsx` (sous `apps/web/core/components/workspace/sidebar/`) |
| #43 | `Function components cannot be given refs` (Inbox)             | `Tooltip` (propel) posait une ref sur `<AppSidebarItem>` (composant fonction). Fix : wrapper `<span className="flex">` ref-able.                                                                                                                              | `apps/web/ce/components/navigations/top-navigation-root.tsx`                                                                  |
| #44 | `refs` / `` `ref` is not a prop `` (widgets home)              | `RecentPage/Issue/Project` déclaraient `ref` comme **prop de donnée** (réservé React). Fix : renommé `parentRef`.                                                                                                                                             | `apps/web/core/components/home/widgets/recents/{page,issue,project,index}.tsx`                                                |
| #45 | `<button>` dans `<button>` (poignée drag)                      | `@plane/ui` `DragHandle` est déjà un `<button>`, enveloppé dans un `<button>` wrapper. Fix : wrapper `<button>`→`<div>`, ref type `HTMLButtonElement`→`HTMLDivElement`.                                                                                       | `projects-list-item.tsx`, `extended-sidebar-item.tsx`, `favorites/favorite-folder.tsx` (sidebar)                              |

Vérif combinée finale (instrumentée) sur `preview` : hydratation 0, not-a-function 0, nested-button menus 0, forwardRef widgets 0, tooltip Inbox 0, DragHandle 0.

**IMPORTANT — ne PAS refaire :** une tentative de rendre `AppSidebarItem`/le shim `apps/web/app/compat/next/link.tsx` en `forwardRef` a été un **cul-de-sac** (le shim `next/link` cassait le rendu). `sidebar-item.tsx` est resté SANS forwardRef — c'est voulu. Le tooltip Inbox a été réglé par le wrapper `<span>` (#43), pas par forwardRef.

## 2. LE PROCHAIN travail : 6ᵉ problème (le « 5ᵉ » découvert) — `IconButton` dans `CustomMenu`

**Symptôme console :** `validateDOMNesting: <button> cannot appear as a descendant of <button>`, stack `IconButton$1 (propel) → button → TooltipTrigger/Re$2 (headless Menu.Button) → CustomMenu (@plane/ui)`, aria-label `Toggle quick actions menu`.

**Cause :** `CustomMenu` enveloppe son `customButton` dans un `<button>` (cf. `packages/ui/src/dropdowns/custom-menu.tsx` ~l.250 : `<Menu.Button as={React.Fragment}><button ref=… >{customButton}</button></Menu.Button>`). Or `customButton={<IconButton .../>}` et `IconButton` (`packages/propel/src/icon-button/`) rend un `<button>` (`React.ButtonHTMLAttributes<HTMLButtonElement>`). → `<button><button>`.

**Fichiers concernés (à corriger tous — même problème) :**

- `apps/web/core/components/workspace/sidebar/projects-list-item.tsx` (~l.358-368) — **cas confirmé en console**.
- `apps/web/core/components/workspace/sidebar/favorites/favorites-menu.tsx`
- `apps/web/core/components/workspace/sidebar/projects-list.tsx`
- `apps/web/core/components/navigation/project-actions-menu.tsx`
- `apps/web/core/components/workspace/sidebar/favorites/favorite-items/common/favorite-item-quick-action.tsx`
- (Grep pour être exhaustif : `grep -rln "customButton" apps/web | xargs grep -l "IconButton"`, puis vérifier chaque `customButton={<IconButton…/>}`.)

**Subtilité (≠ #42) :** l'`IconButton` porte `ref={actionSectionRef}` **et** `onClick={() => setIsMenuActive(!isMenuActive)}`. Il ne suffit pas de le remplacer par un `<div>` : il faut re-câbler.

- **Approche recommandée :** passer à `CustomMenu` l'**icône seule** en `customButton` (pas un `<IconButton>`), déplacer le style sur `customButtonClassName`, et utiliser les props de `CustomMenu` pour l'onclick : `menuButtonOnClick={() => setIsMenuActive(...)}` (vérifier le nom exact de la prop dans `custom-menu.tsx`).
  - Piste : `customButton={<MoreHorizontal className="… text-placeholder" />}` (l'icône lucide directement), ou un `<span>`/`<div>` contenant l'icône.
- **`ref={actionSectionRef}` :** VÉRIFIER où `actionSectionRef` est utilisé dans le fichier (`grep -n actionSectionRef …`). Souvent pour l'outside-click ou le focus. `CustomMenu` gère déjà `useCaptureForOutsideClick`. Si la ref n'est plus nécessaire → la retirer ; sinon → la mettre sur le bouton de `CustomMenu` (voir si `custom-menu.tsx` accepte une ref forwardée) ou sur un wrapper. **Ne pas casser le comportement du menu.**
- Type de `actionSectionRef` : actuellement `useRef<HTMLButtonElement>` — ajuster si on change l'élément.

**Template :** s'inspirer du fix #42 (rendu de l'icône via un non-`<button>` + `customButtonClassName`), en gérant en plus l'onClick et la ref.

**Branche suggérée :** `fix/sidebar-quickactions-iconbutton-nested-button`.

## 3. Autre problème connu (NON un bug de code — ne pas « corriger »)

- **WebSocket live** `ws://localhost:3100/live/collaboration … ERR_CONNECTION_REFUSED` : **environnemental** — le serveur live n'écoute pas sur `:3100` (config `VITE_LIVE_BASE_URL`). C'est un serveur non démarré, pas un bug. Ne pas créer de branche code.

## 4. GOTCHAS DE WORKFLOW (les leçons durement apprises — À LIRE)

### 4.1 Vérification navigateur — méthode FIABLE (l'instrumentation)

Le buffer console MCP (`read_console_messages`) est **peu fiable** : il **persiste entre les reloads** (warnings périmés), a des **faux négatifs de timing**, et le hash `?v=xxxx` est celui de l'**optimisation des deps** (node_modules), PAS un hash par-recompilation → **inutilisable comme discriminant stale/courant**.

**Méthode fiable :** instrumentation temporaire dans `apps/web/app/root.tsx`, juste AVANT `const APP_TITLE = …` :

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
      if (s.includes("is not a function") || s.includes("\n    at ")) w.__caps?.push(s.slice(0, 3000));
    } catch {
      /* noop */
    }
    _err(...(args as []));
  };
}
```

Puis : `location.reload()` (via javascript_tool), attendre ~12-14 s, puis lire `window.__caps` (compter par pattern, ex. `caps.filter(s => s.includes('IconButton') && s.includes('cannot appear as a descendant')).length`). `__caps` se **remet à zéro à chaque reload** (garde `__capsInstalled` fraîche par contexte de page). **RETIRER l'instrumentation avant de committer** (vérifier `git diff apps/web/app/root.tsx` = vide).

### 4.2 Pre-commit hook (lint-staged) — le plus gros piège

`.husky/pre-commit` → `pnpm lint-staged` → sur les fichiers stagés `.{js,ts,tsx…}` : `pnpm exec oxlint --fix --deny-warnings`. **`--deny-warnings` fait échouer le commit sur N'IMPORTE QUEL warning pré-existant du fichier touché** (le lint global, lui, tolère via `--max-warnings=11957`).

Pour débloquer (SANS `--no-verify`, non autorisé) : ajouter des disables **ciblés** :

- Format qui marche : `// eslint-disable-next-line <rule>` (style ESLint). `// oxlint-disable-next-line <rule>` marche aussi pour les règles à plugin.
- **PLACEMENT CRITIQUE** : le disable va sur la ligne **immédiatement avant la déclaration SHADOWANTE**, PAS avant l'originale « shadowed ». Pour `no-shadow` dans les callbacks drag, la déclaration shadowante est le **param** (`getData: ({ input, element }) => {`) ou un `const` interne (`const data = {…}`, `const instruction = …`), PAS le `const element = ref.current` du useEffect (que oxlint affiche comme « shadowed declaration is here »).
- Noms de règles : `no-shadow`, `react-hooks/exhaustive-deps`, `import/no-unassigned-import`.
- Toujours re-lancer `cd apps/web && npx oxlint --deny-warnings <fichiers>` jusqu'à « Found 0 warnings » avant de committer.
- Justifier chaque disable (`-- pre-existing, unrelated to this fix`). Ne PAS renommer les variables shadow (risque de casser le drag `@atlaskit/pragmatic-drag-and-drop`).

### 4.3 Vite HMR — instable

Après un changement de branche, une modif de lib, ou un changement de type d'export (fonction↔forwardRef) d'un module très importé (ex. shim `next/link`), Vite peut : servir des chunks périmés, OU produire un **`TypeError: Component is not a function` fantôme**. **Piège vécu** : ce `Component is not a function` n'était PAS causé par un changement forwardRef — c'était le **bug d'hydratation pré-existant** (#41). Ne pas mal-attribuer. En cas de doute : `preview_stop` + `preview_start {name:"plane-web"}`, voire `rm -rf apps/web/node_modules/.vite` avant restart.

### 4.4 Stop hook Zelian (obligatoire en fin de session)

Après toute modif de fichier source, le hook `Stop` bloque tant que `@update-writer-after-implement` n'a pas tourné. Invoquer le subagent `zelian-framework:update-writer-after-implement` (Agent tool, `run_in_background:false`) avec le contexte des fichiers modifiés. Pour des **bugs UI** : il confirme le CHANGELOG, ne trouve pas de module `docs/specs/` correspondant (sidebar/nav/widgets ne sont pas documentés), pas de changement BDD, **aucun ADR** (bugs ≠ décisions d'archi, cf. `.claude/rules/06-adr-policy.md`). Il écrit `.claude/.update-writer-ran` → débloque.

### 4.5 CHANGELOG & merge

- Chaque fix → une entrée sous `## [Unreleased]` › `### Fixed` (français, style des entrées existantes). Insertion via **python en utf-8** (attention : la console Windows est cp1252 → un `print` avec `→`/accents plante ; écrire le fichier en `encoding="utf-8"` et ne pas print les caractères spéciaux).
- Merger 2 branches touchant le CHANGELOG → **conflit** ; résoudre en **gardant les DEUX entrées** (retirer `<<<<<<<`/`=======`/`>>>>>>>`), puis `git merge origin/preview` dans la branche avant de re-pousser.

### 4.6 Flux PR / gh

- Les PRs sont sur le **fork** `userLinpy/plane`, base **`preview`**. `gh pr view N` **pointe par défaut sur l'upstream `makeplane/plane`** → TOUJOURS `--repo userLinpy/plane`.
- Les PRs arrivent souvent en **draft** → `gh pr ready N --repo userLinpy/plane` d'abord.
- Merge : `gh pr merge N --repo userLinpy/plane --merge` (**merge-commit**, conforme à la pratique du dev).
- Le **classifier auto-mode bloque un merge sans review** : faire une **review** (le dev veut une review avant merge « s'il n'y a pas de problèmes ») ET avoir l'accord du dev, sinon `gh pr merge` est refusé.

### 4.7 Environnement

- Front : `preview_start {name:"plane-web"}` (`.claude/launch.json` : `turbo dev --filter=web --filter=live`, port **3000**). NE PAS lancer de serveur via Bash.
- API : docker `docker-compose-local.yml` (déjà up : api/worker/db/redis/mq/minio). API sur `:8000`.
- Login test : `dev@zelian.local` (SSO Zelian, workspace **zelian**, routes `/zelian/…`). Le home affiche les widgets « Recent activity » (widgets #44) et la sidebar projets (DragHandle #45, quick-actions #6ᵉ).
- OS Windows / Git-bash ; MCP `plane` = Docker local (`PLANE_BASE_URL=localhost:8000`).

## 5. État repo au moment du handoff

- Branche `preview`, SHA `ab6539ff` (Merge #45), **working tree propre**, synchronisé avec `origin/preview`.
- Les 5 fixes + leurs entrées CHANGELOG sont dans `preview`.
- `apps/web/app/compat/next/link.tsx` et `apps/web/core/components/sidebar/sidebar-item.tsx` sont à l'état d'origine (forwardRef reverté — voir §1).

## 6. Étapes concrètes pour reprendre (6ᵉ problème)

1. `git checkout preview && git pull origin preview`.
2. `git checkout -b fix/sidebar-quickactions-iconbutton-nested-button`.
3. `preview_start {name:"plane-web"}` (attendre `:3000` HTTP 200), naviguer `http://localhost:3000/zelian/`.
4. Corriger le pattern `CustomMenu customButton={<IconButton…/>}` dans tous les fichiers du §2 (icône seule en customButton + `menuButtonOnClick` + gérer `actionSectionRef`).
5. Vérifier avec l'instrumentation (§4.1) : compteur `IconButton` nested-button → **0**, et aucun nouveau warning/`not a function`. Retirer l'instrumentation.
6. `git add …` + commit (gérer le hook lint §4.2 : disables ciblés si warnings pré-existants).
7. Entrée CHANGELOG (§4.5) + commit.
8. Push + `gh pr create --repo userLinpy/plane --base preview`.
9. `gh pr ready` + **review** (§4.6) + `gh pr merge --merge`.
10. `@update-writer-after-implement` (§4.4).
11. Ré-vérif combinée sur `preview` (instrumentation) : tous les compteurs à 0.

## 7. Mémoire projet pertinente

- `verification-env-plane` : Redis partagé pollue la suite contract ; turbo check:types ≠ tsc nu ; Vite HMR à redémarrer.
- `merge-policy-permissions` : merge = merge-commit + résolution CHANGELOG en cascade ; autorisation dev requise.
- `git-fix-branch-workflow` : corrections = branche `fix/` + commits descriptifs + PR.
