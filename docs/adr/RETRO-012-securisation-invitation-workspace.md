# RETRO-012 — Sécurisation du flux d'invitation workspace (anti email-squat)

| Champ      | Valeur              |
|------------|---------------------|
| Statut     | Documenté (rétro)   |
| Date       | 2026-06-30          |
| Source     | Rétro-ingénierie    |
| Features   | workspaces, auth |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | SECURITY |
| Q1 — Coût de revert > 1j ? | OUI — Supprimer ces protections implique de modifier le flux d'invitation (WorkspaceJoinEndpoint), le serializer public (WorkSpaceMemberInvitePublicSerializer), et de ré-examiner la gestion des tokens. Les CVE référencés (GHSA-4vj8-p63v-8p24, GHSA-86mg-259g-pwgg, GHSA-gf48-p6jp-cwc4) indiquent que la décision est le résultat d'un correctif de sécurité — un revert introduirait de nouveau des vulnérabilités exploitables. |
| Q2 — Non-déductible du code ? | OUI — Le fait que le GET de l'invitation utilise un serializer différent du POST (public vs complet), et la raison pour laquelle l'authentification est requise même pour accepter une invitation (AllowAny est la permission_class de la vue mais le code vérifie manuellement `request.user.is_authenticated`), ne se déduisent pas des configs. Sans ce contexte, un dev pourrait "simplifier" en supprimant la vérification d'email ou en réutilisant le serializer complet pour le GET. |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — Impacte api/workspaces (flux d'acceptation), api/auth (une session authentifiée est requise pour accepter), et potentiellement api/projects (l'invitation workspace peut mener à l'accès aux projets). |
| Q4 — Casse un invariant si ignoré ? | OUI — Sans la vérification `request.user.email == workspace_invite.email`, un attaquant qui crée un compte avec l'email invité et obtient le token (via le GET public si le serializer complet était utilisé) peut voler le membership workspace. Les deux vecteurs d'attaque sont documentés par des références GHSA dans les commentaires du code. |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

---

## Contexte

Le flux d'invitation Plane passe par trois étapes : (1) un ADMIN/MEMBER crée l'invitation via POST, (2) l'invité reçoit un email avec un lien contenant le token JWT, (3) l'invité accepte via POST avec le token. L'endpoint GET de l'invitation est accessible sans authentification pour permettre l'affichage de la page d'invitation avant connexion.

Deux vecteurs d'attaque ont été identifiés et corrigés (références GHSA dans les commentaires) :

- **Email-squat (GHSA-4vj8-p63v-8p24)** : un attaquant crée un compte avec l'email invité, puis utilise le token reçu via l'endpoint GET pour accepter l'invitation et voler le membership.
- **Token leak via GET (GHSA-86mg-259g-pwgg / GHSA-gf48-p6jp-cwc4)** : l'endpoint GET de l'invitation retournait le token et le lien d'invitation dans la réponse, permettant à quiconque de récupérer le token sans avoir reçu l'email.

## Décision identifiée

Deux protections complémentaires sont implémentées :

**1. Serializer public sans token pour le GET :**
`WorkSpaceMemberInvitePublicSerializer` exclut délibérément les champs `token` et `invite_link`. Le GET de `WorkspaceJoinEndpoint` utilise ce serializer (pas le serializer complet). Un appelant non authentifié voit les infos de l'invitation (workspace, rôle, email masqué) mais pas le token.

**2. Double vérification à l'acceptation :**
Même si `WorkspaceJoinEndpoint` a `permission_classes = [AllowAny]`, le POST vérifie manuellement :
```python
if not request.user.is_authenticated:
    return Response({"error": "Authentication required..."}, status=401)
if request.user.email.lower() != workspace_invite.email.lower():
    return Response({"error": "You do not have permission..."}, status=403)
```
L'invité doit être connecté **avec l'email exact de l'invitation** pour accepter.

## Conséquences observées

### Positives
- Les deux vecteurs d'attaque documentés (GHSA) sont fermés.
- Pas de dépendance à un mécanisme tiers (pas de signature supplémentaire, pas de OTP) — la session Django existante suffit.
- Le token JWT reste utile comme second facteur de validation (`workspace_invite.token != token`) même avec la vérification d'email.

### Négatives / Dette
- **UX friction** : l'invité doit être connecté avant d'accepter. Si l'email n'existe pas encore dans Plane, l'invité doit créer un compte, puis revenir sur le lien d'invitation. Ce flux est moins fluide qu'une acceptation directe depuis l'email.
- **`AllowAny` trompeur** : la classe de permission `AllowAny` sur la vue suggère une vue publique, mais le POST nécessite en réalité une authentification. Ce pattern peut induire un dev en erreur lors d'une revue rapide.
- **Vérification d'email case-insensitive** : la comparaison utilise `.lower()` des deux côtés — correcte, mais si Plane introduit un jour des emails avec casse significative, ce comportement devra être revisité.

## Recommandation

Garder les deux protections. Envisager de remplacer `AllowAny` par une permission custom qui reflète la logique réelle (tout utilisateur peut consulter l'invitation en GET, mais seul l'utilisateur authentifié avec l'email correspondant peut accepter en POST). Documenter le flux dans une note de sécurité pour éviter que des contributeurs futurs "simplifient" ces vérifications.
