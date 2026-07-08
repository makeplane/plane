# RETRO-011 — Cascade du rôle GUEST workspace vers tous les rôles projet

| Champ      | Valeur              |
|------------|---------------------|
| Statut     | Documenté (rétro)   |
| Date       | 2026-06-30          |
| Source     | Rétro-ingénierie    |
| Features   | workspaces, projects |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | SECURITY |
| Q1 — Coût de revert > 1j ? | OUI — Supprimer cette cascade nécessite de revoir la logique de permission dans les vues projet (api/projects), les vues issue, et tous les points où le rôle projet est évalué pour l'autorisation. Un GUEST workspace pourrait devenir ADMIN dans un projet, créant une faille de privilège transverse. La correction impacterait les modèles, vues, et tests de plusieurs modules. |
| Q2 — Non-déductible du code ? | OUI — Le fait que la cascade soit systématique et immédiate (pas différée, pas configurable) ne se lit pas dans package.json ni dans les configs Django. Un dev qui consulte les endpoints projet séparément ne saurait pas qu'un changement de rôle workspace déclenche une mise à jour en masse des ProjectMember. |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — Impacte api/workspaces (déclenchement dans WorkSpaceMemberViewSet.partial_update), api/projects (invariant : rôle projet ≤ rôle workspace pour les GUEST), et implicitement toutes les features qui s'appuient sur les rôles projet (api/issues, api/cycles, api/modules, api/pages). |
| Q4 — Casse un invariant si ignoré ? | OUI — Sans cette règle, un utilisateur rétrogradé GUEST au niveau workspace conserve ses droits ADMIN dans des projets du même workspace, contournant l'isolation de rôle. Faille d'élévation de privilège horizontale. |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

---

## Contexte

Le modèle de permission de Plane est hiérarchique : workspace > projet > issue. Le rôle workspace définit un plafond de droits pour un utilisateur dans tout le workspace. Le rôle GUEST (valeur 5) est le rôle le plus restrictif — il est prévu pour des utilisateurs externes ou en lecture seule étendue.

Le problème identifié : un utilisateur peut avoir un rôle ADMIN (20) dans un projet alors qu'il n'est que GUEST (5) dans le workspace. Si cette incohérence est tolérée, la restriction workspace ne sert à rien : un GUEST peut toujours gérer un projet en tant qu'ADMIN.

## Décision identifiée

Lorsqu'un ADMIN workspace modifie le rôle d'un membre vers GUEST (5), le code applique immédiatement une mise à jour en masse (`bulk update`) de tous les `ProjectMember` correspondants dans le workspace, forçant tous leurs rôles à 5 :

```python
# apps/api/plane/app/views/workspace/member.py — WorkSpaceMemberViewSet.partial_update
if "role" in request.data and int(request.data.get("role")) == 5:
    ProjectMember.objects.filter(
        workspace__slug=slug, member_id=workspace_member.member_id
    ).update(role=5)
```

Cette règle s'applique **uniquement lors du passage à GUEST**. Les passages MEMBER→ADMIN ou ADMIN→MEMBER ne déclenchent pas de cascade.

## Conséquences observées

### Positives
- Cohérence garantie : un GUEST workspace ne peut jamais être ADMIN dans un projet du même workspace.
- Implémentation simple et synchrone : pas de tâche asynchrone, l'effet est immédiat dans la même requête HTTP.

### Négatives / Dette
- **Perte d'information silencieuse** : si un GUEST est promu MEMBER ensuite, ses rôles projet restent à GUEST (5) — ils ne sont pas restaurés automatiquement. Un ADMIN devra les remonter manuellement projet par projet.
- **Asymétrie non documentée** : la règle ne s'applique qu'au passage vers GUEST, pas aux autres transitions. Cette asymétrie peut surprendre un développeur.
- **Couplage fort workspace/project** : la vue workspace importe et modifie directement les `ProjectMember`, créant un couplage fort entre les deux domaines.

## Recommandation

Garder la règle de cascade — elle est nécessaire pour l'invariant de sécurité. Envisager à terme d'émettre un événement ou une tâche Celery plutôt qu'une mise à jour directe pour découpler les domaines workspace et project. Documenter explicitement l'asymétrie (pas de restauration automatique au passage GUEST→MEMBER).
