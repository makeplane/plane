# Note de faisabilité (v2) — Peupler Plane depuis l'annuaire Zelian

> **v2** — mise à jour après cadrage du tuteur. Direction confirmée : **pas d'invitations**, on **pré-remplit** toutes les personnes de l'entreprise dans Plane pour qu'elles soient **cherchables / assignables** (auto-complétion à l'affectation). Codé maison, sur Community Edition (gratuit), via un **intermédiaire externe**. Source de vérité = annuaire Zelian ; **Plane est un aval (réplique)**.

---

## 1. Contexte confirmé (2 couches)

- **Identité → Supabase Auth (GoTrue)** : compte + email + session (JWT), SSO de fait de l'écosystème (`*.zelian.fr`). Aucune donnée métier. **Pas besoin d'accès Supabase.**
- **Annuaire / rôles / appartenance → PostgreSQL schéma `public`** (repo `2026-zelian-onboarding`, `prisma/schema.prisma`) :
  - `referent_profile` : `user_id` (UUID = `auth.users.id`), `first_name`, `last_name`, `role` (libre), `role_track`, `seniority`, `hired_at`, `department`, `phone`, `avatar_storage_path`.
  - `user_permissions(user_id, app, permission)` (unique) : **l'appartenance = présence d'une ligne** (pas de flag « actif »).

**Clé de jointure Zelian ↔ Plane = l'email** (via `auth.users.id` → email). À ce stade : on **analyse** ce schéma pour concevoir ; on ne l'intègre pas encore.

## 2. Le point technique décisif (vérifié dans le code de Plane)

Pour qu'une personne soit **cherchable / assignable** dans Plane, il faut qu'elle soit **membre actif** — la chaîne est stricte :

> **Assignable à une tâche  ⟸  `ProjectMember` (actif)  ⟸  `WorkspaceMember` (actif)  ⟸  `User` (existant)**

Preuves :
- À la création/màj d'une issue, les assignés sont **filtrés aux membres du projet** : `app/serializers/issue.py:149-156` (« Validate assignees are from project » → `ProjectMember.objects.filter(member_id__in=assignee_ids)`). **Un non-membre est écarté.**
- L'ajout d'un membre projet exige qu'il soit **déjà `WorkspaceMember` actif** : `app/views/project/member.py:71`.
- L'auto-complétion des personnes s'appuie sur les **membres du workspace/projet** (endpoints membres), pas sur les invitations.

**Conséquence majeure :** une **invitation** ne crée qu'une ligne « en attente » (`WorkspaceMemberInvite`), **PAS** un membre — donc **une personne invitée n'est ni cherchable ni assignable** tant qu'elle n'a pas accepté **en se connectant elle-même**. Et **aucune API publique ne permet de créer un `User` ou un membre *actif*** sans ce passage. → **L'objectif « présents & assignables sans invitation ni connexion » impose d'écrire du code côté Plane (couche domaine / ORM).** C'est le cœur de la Mission 2.

## 3. Modèle Plane (rappel)

`User` → `WorkspaceMember` → `ProjectMember`. Rôles : **Admin 20 / Member 15 / Guest 5** (pas de « Viewer »). Cible workspace : **1 workspace « Zelian »** contenant les projets ; on y référence toutes les personnes de l'entreprise. Mapping de rôles Zelian → Plane = **plus tard** (hors périmètre immédiat).

## 4. Approches (effort / risque)

| # | Approche | Atteint l'objectif ? | Effort | Risque | AGPL |
|---|---|---|---|---|---|
| **A** | **Extension « provisioning » dans Plane (couche domaine/ORM) pilotée par l'intermédiaire** | ✅ Oui | **Moyen** | **Moyen** | ⚠️ modifie Plane → version modifiée sous AGPL, **isolée & publiable** |
| **B** | **API publique seule** (invitations + ajout de membres existants aux projets) | ❌ Non (reste « en attente ») | Faible | Faible | ✅ pas de modif |
| **C** | **A + SSO Supabase** (login entreprise, réconciliation à la connexion) | ✅ + login natif | Moyen-élevé | Moyen | ⚠️ 2 modifs isolées |

### A — Extension provisioning (recommandée) 
Ajouter dans **notre** Plane auto-hébergé un petit composant **isolé** qui **upsert des membres actifs** à partir d'une liste normalisée, **via l'ORM de Plane** (pas de SQL brut → invariants respectés). Deux variantes :
- **A1 — endpoint interne protégé** `POST /provision-members` (auth clé API/admin) que l'**intermédiaire externe** appelle. ✅ *Recommandée* : la logique métier (lecture annuaire + mapping) reste **dans l'intermédiaire privé** ; la modif de Plane est minime (« crée/mets à jour ces membres »).
- **A2 — management command** `sync_directory_members` (cron dans le conteneur api). Plus simple à lancer, mais couple Plane à la source de l'annuaire.

**Ce que fait l'extension, par personne (clé = email) :** `User.objects.get_or_create(email=…)` avec `is_password_autoset=True` + `first_name/last_name` ; **création du `Profile`** (OneToOne — à ne pas oublier, le signal `post_save` ne crée que les préférences de notif) ; `WorkspaceMember.objects.update_or_create(workspace, member, defaults={role, is_active=True})` ; optionnellement `ProjectMember` pour les projets concernés. Idempotent (re-run sans doublon grâce aux contraintes d'unicité). L'offboarding = passer `is_active=False` (jamais supprimer).

- **Effort : moyen** (une poignée de fichiers, calqués sur les management commands existantes + l'auth `complete_login_or_signup`).
- **Risque : moyen** — c'est une modification de Plane ⇒ **AGPL** (garder l'extension dans un patch/branche isolé, documenté, source disponible aux utilisateurs ; **ne touche aucune de nos autres applications**). Maintenance à re-vérifier aux montées de version, mais l'API des modèles est stable.

### B — API publique seule (prototype uniquement)
L'intermédiaire lit l'annuaire et appelle l'API v1 (clé API `X-API-Key`). Mais l'API ne sait que : pousser des **invitations** (→ « en attente », **non assignables**) et ajouter aux projets des gens **déjà membres**. **Ne remplit donc pas l'objectif.** Utile seulement comme **prototype jetable** pour valider le token/URL et comprendre les payloads (comme le suggère le tuteur). Volume : 8 users, limite 60 req/min = non-sujet.

### C — Ajouter le SSO Supabase (itération ultérieure)
Ajouter Supabase comme **provider OAuth/OIDC** (le CE embarque déjà 4 providers extensibles dans `authentication/provider/`) pour un **login entreprise** ; à la 1re connexion, le compte est réconcilié. Complète A (login natif *.zelian.fr) mais **ne remplace pas** le pré-remplissage (les gens doivent apparaître AVANT de s'être connectés). À chiffrer plus tard.

## 5. Recommandation — premier jet

1. **Prototype jetable (B)** : créer un **Personal Access Token** dans mon profil Plane (header `X-API-Key`), appeler `GET /api/v1/workspaces/{slug}/members/` et tester une invitation → **comprendre l'API**, confirmer l'URL/token. Jetable.
2. **Cible (A1)** : concevoir l'**intermédiaire externe** (privé) qui lit `referent_profile` + `user_permissions` (app = `plane`) et POST une liste normalisée `{email, first_name, last_name, role}` à un **endpoint de provisioning minimal ajouté à Plane** (couche domaine/ORM), qui **crée/maj les membres actifs** du workspace « Zelian ». → objectif atteint : tout le monde **cherchable & assignable**, sans invitation ni connexion.
3. **Login (C)** : brancher le SSO Supabase **plus tard**, quand le pré-remplissage tourne.

Cette trajectoire respecte l'angle licence : la logique métier reste dans **notre** intermédiaire privé (arm's length), et la seule modification de Plane est **une extension minime, isolée et publiable** — elle ne contamine pas nos autres applications.

## 6. Garde-fous (respectés par la reco)
- **Sens unique** : annuaire Zelian → Plane (Plane = réplique, jamais l'inverse).
- **Écriture Plane** : via son **API** (intermédiaire) ou sa **couche domaine/ORM** (extension A) — **jamais de SQL brut** (préserve invariants & migrations).
- **Aucun secret de prod** (clé service-role Supabase, clé de chiffrement) ne transite : l'intermédiaire lit l'annuaire avec ses propres secrets ; je n'ai besoin que d'un **PAT Plane** pour tester.

## 7. Reste à obtenir / décider
- L'**URL de l'instance** Plane + faire ma **capture** de génération du PAT (le manager fournit l'emplacement).
- Le **slug du workspace** « Zelian » (et la liste des projets à peupler, si on va jusqu'au niveau projet).
- Confirmation : **A1 (endpoint appelé par l'intermédiaire)** vs **A2 (management command)** — je recommande A1.
- (Plus tard) mapping des rôles Zelian (`role_track`/`seniority`/`user_permissions.permission`) → {Admin/Member/Guest}, et périmètre projet.

---

### Annexe — preuves (dépôt Plane)
- Assignable ⇒ membre : `app/serializers/issue.py:149-156` ; `app/views/project/member.py:71`. Modèle assignee : `db/models/issue.py:345` (`IssueAssignee.assignee` FK `User`).
- Pas d'API de création de `User`/membre actif ; invitation = `WorkspaceMemberInvite` en attente jusqu'à connexion (`app/views/workspace/invite.py`). API externe : `api/urls/{member,invite}.py`.
- Management commands (couche domaine, exécutées dans le conteneur) : `db/management/commands/` (`create_project_member.py`, `activate_user.py`, `reset_password.py`, `create_instance_admin.py`…). Aucune ne crée un membre workspace depuis un annuaire → à écrire.
- Provisioning sans mot de passe : `authentication/adapter/base.py` (`is_password_autoset`, création `User` + `Profile`). Rôles : `app/permissions/base.py` (20/15/5).
- SSO générique (OIDC/SAML/SCIM) = **absent du CE** (EE payant) ; providers OAuth extensibles : `authentication/provider/oauth/`.

*Méthode : investigation ciblée du code (modèle / auth / API / assignation) + vérifications directes.*
