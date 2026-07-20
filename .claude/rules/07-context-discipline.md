# Discipline de contexte — lecture ciblée (Zelian Compass, v3.0.0)

> Livré par **Zelian Builder** (projets neufs) ou copié depuis le plugin `zelian-framework` par `/zelian:retro` / `/zelian:migrate` — ne pas modifier au projet.

## Le principe

`docs/` est la mémoire du projet, pas un document à relire en entier. **Personne ne lit tout : on entre
au bon niveau** (philosophie Zelian Atlas, appliquée au projet). La source de vérité du lien
code ↔ documentation est **`.zelian/compass.json`** (Zelian Compass).

## Règles

1. **Avant de modifier une feature existante** : lire UNIQUEMENT les documents de son module —
   `spec-fonctionnel.md` (le contrat), `spec-technique.md` (l'état réel), `tech-design.md` (s'il existe),
   plus les ADR cités. Les hooks v3 injectent automatiquement ces pointeurs quand tu édites un fichier
   ancré ou quand le prompt nomme la feature — suis-les.
2. **Ne JAMAIS lire l'ensemble de `docs/`** pour « se mettre en contexte ». Si tu ne sais pas quel module
   est concerné, résous d'abord :
   ```bash
   COMPASS="$(find "$HOME/.claude/plugins" -name "compass.js" -path "*/zelian-framework/hooks/lib/*" 2>/dev/null | tail -1)"
   node "$COMPASS" --resolve <chemin/du/fichier>          # fichier → module + docs
   node "$COMPASS" --resolve-prompt "<la demande du dev>" # texte → features candidates
   ```
3. **Aucune conception avant lecture** : pas de brainstorm, pas de plan, pas d'édition de code d'un module
   documenté sans avoir lu sa spec fonctionnelle. Si la demande contredit la spec, le signaler au dev —
   ne pas improviser.
4. **Docs transverses** (`docs/architecture/database/schema.md`, cahier des charges) : uniquement quand la
   tâche les concerne (modif BDD → schema.md ; évolution de périmètre → CdC).
5. **Fichier non ancré** : si un fichier de code ne résout vers aucun module, c'est un signal — soit la
   feature n'est pas documentée (→ `/zelian:new-spec`), soit l'ancrage manque
   (`@update-writer-after-implement` le complètera en fin de session).

## Pourquoi

Charger toute la doc noie les contraintes utiles dans le bruit et sature le contexte ; n'en charger
aucune fait violer les specs. La lecture ciblée est le seul régime où la documentation sert réellement
le développement — au coût contexte minimal.
