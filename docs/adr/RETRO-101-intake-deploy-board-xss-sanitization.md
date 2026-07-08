# RETRO-101 — Sanitisation HTML nh3 obligatoire sur les soumissions publiques intake

| Champ      | Valeur              |
|------------|---------------------|
| Statut     | Documenté (rétro)   |
| Date       | 2026-06-30          |
| Source     | Rétro-ingénierie    |
| Features   | intake, space/public-board |
| App        | api                 |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | SECURITY |
| Q1 — Coût de revert > 1j ? | OUI — supprimer la sanitisation impose de revoir l'ensemble du chemin de soumission publique (vue `IntakeIssuePublicViewSet.create()` dans `plane/space/`), d'identifier tous les autres points d'entrée non authentifiés qui acceptent du HTML, et de valider qu'aucun contenu stocké antérieurement ne contient de payload XSS — audit de sécurité multi-app, estimé à plusieurs jours. Toute modification de l'allowlist (tags/attributs nh3) touche à la fois la vue publique et potentiellement le rendu SSR dans `apps/space`. |
| Q2 — Non-déductible du code ? | OUI — le fait que la sanitisation soit appliquée uniquement sur la voie publique (DeployBoard) et non sur la voie interne authentifiée, le choix de la bibliothèque Rust `nh3` (vs `bleach` Python, vs validation DRF seule), et la liste blanche Tiptap-specific des tags et attributs autorisés (mention-component, image-component, data-node-type, etc.) ne se déduisent pas de `requirements/base.txt` ni des configs. La référence CVE GHSA-hh2r-3hwp-mvq3 commentée dans le code indique une décision de sécurité consciente, non une convention standard. |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — `api/intake` (voie publique de soumission) et `space/public-board` (rendu SSR du contenu soumis publiquement). Tout contenu soumis via le DeployBoard est stocké en base et rendu publiquement dans `apps/space` sans nouvelle sanitisation — le point de contrôle unique est à l'ingestion. |
| Q4 — Casse un invariant si ignoré ? | OUI — un dev qui ajoute un champ HTML accepté en soumission publique sans le passer par `validate_html_content()` introduit une faille de XSS stockée exploitable sur le DeployBoard public, visible par tous les visiteurs non authentifiés. La CVE de référence (GHSA-hh2r-3hwp-mvq3) confirme que cette classe de vulnérabilité a déjà été exploitée dans le contexte Plane. |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

Le DeployBoard permet à des utilisateurs non authentifiés de soumettre des issues via la surface publique de Plane (`apps/space`). Contrairement à la voie interne authentifiée — où les membres du projet sont considérés comme des acteurs de confiance et où la validation passe par `IssueCreateSerializer` sans sanitisation HTML explicite — la voie publique accepte des entrées de n'importe quel utilisateur Internet.

Le champ `description_html` d'une issue peut contenir du HTML riche généré par l'éditeur Tiptap (contenu légitime) ou, en cas de soumission malveillante, des balises `<script>`, `<iframe>`, ou des attributs d'event handler (`onerror`, `onload`, etc.). Ce contenu est ensuite stocké en base et rendu dans `apps/space` (React SSR), potentiellement visible par tous les visiteurs du DeployBoard.

La CVE GHSA-hh2r-3hwp-mvq3 référencée dans le commentaire de code (`plane/space/views/intake.py`, ligne 145) indique que cette vulnérabilité a été identifiée et corrigée dans le codebase Plane.

## Décision identifiée

La fonction `validate_html_content()` (`plane/utils/content_validator.py`) est appelée **avant toute persistance** dans `IntakeIssuePublicViewSet.create()` :

```python
# Sanitize description_html before saving to prevent stored XSS (GHSA-hh2r-3hwp-mvq3)
raw_description_html = request.data.get("issue", {}).get("description_html", "<p></p>")
_, _, sanitized_description_html = validate_html_content(raw_description_html)
safe_description_html = sanitized_description_html if sanitized_description_html is not None else "<p></p>"
```

`validate_html_content()` utilise `nh3.clean()` (binding Python de la bibliothèque Rust `ammonia`) avec :
- Une allowlist de tags étendue des defaults nh3 avec les balises custom Tiptap : `mention-component`, `label`, `input`, `image-component`
- Une allowlist d'attributs HTML spécifique à l'éditeur (data-*, attributs de tableaux, attributs d'images)
- Une liste de protocoles URL sûrs : `http`, `https`, `mailto`, `tel`
- Une limite de taille à 10 MB

Cette sanitisation est appliquée **uniquement sur la voie publique**. La voie interne authentifiée (`IntakeIssueViewSet.create()`) ne passe pas par cette sanitisation explicite.

## Conséquences observées

### Positives

- Protection contre les XSS stockées sur le vecteur public le plus exposé (DeployBoard).
- Utilisation de `nh3` (Rust/`ammonia`) : performant et maintenu, supérieur à l'ancienne lib Python `bleach` (deprecated).
- Log automatique des suppressions HTML dans les logs applicatifs (Sentry/JSON logger) via `_compute_html_sanitization_diff()`, permettant de détecter des tentatives d'injection.
- Fallback sûr : si la sanitisation retourne `None` (erreur interne), le contenu est remplacé par `"<p></p>"` sans bloquer la soumission.

### Négatives / Dette

- **Asymétrie voie publique / voie interne** : la voie interne authentifiée n'est pas sanitisée. Si les hypothèses de confiance sur les membres du projet évoluent (ex : comptes compromis, accès guest ouvert à des tiers), la voie interne deviendra un vecteur non protégé.
- **Allowlist manuelle à maintenir** : chaque évolution de l'éditeur Tiptap (nouveaux tags custom, nouveaux attributs data-*) doit être répercutée dans `content_validator.py`. Aucun mécanisme de synchronisation automatique avec les composants Tiptap de `packages/@plane/editor`.
- **Sanitisation partielle** : seul `description_html` est sanitisé. `description_json` (AST ProseMirror) n'est pas validé structurellement — il est stocké tel quel (vecteur potentiel si le rendu Tiptap interprète des nœuds malveillants).

## Recommandation

**Garder et étendre.** La sanitisation nh3 est une protection nécessaire sur la voie publique. Envisager à terme :
1. Appliquer la même sanitisation sur la voie interne authentifiée pour réduire l'asymétrie.
2. Ajouter une validation structurelle de `description_json` (ProseMirror schema validation) pour couvrir le vecteur JSON.
3. Automatiser la vérification que `validate_html_content()` est bien appelée sur tout nouveau point d'entrée public acceptant du HTML (test de régression ou lint rule).
