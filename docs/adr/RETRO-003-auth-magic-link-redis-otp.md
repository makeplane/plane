# RETRO-003 — Magic link OTP 6 chiffres stocké Redis avec double compteur anti-brute-force

| Champ      | Valeur              |
|------------|---------------------|
| Statut     | Documenté (rétro)   |
| Date       | 2026-06-30          |
| Source     | Rétro-ingénierie    |
| Features   | api/auth            |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | SECURITY |
| Q1 — Coût de revert > 1j ? | OUI — remplacer Redis par un autre store (base de données, mémoire process) ou modifier la logique des compteurs toucherait `MagicCodeProvider`, les tâches Celery `magic_link`, les vues magic des deux contextes (app + space), et nécessiterait des tests de régression sécurité spécifiques |
| Q2 — Non-déductible du code ? | OUI — le script Lua atomique INCR+EXPIRE, les deux seuils distincts (émission ≤3 par clé Redis, vérification ≤5 par token), et la logique de réinitialisation du compteur à chaque nouvelle émission ne se déduisent pas de `requirements/base.txt` (`redis 5.0.4`) |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — le mécanisme est actif dans `views/app/magic.py` (MagicSignInEndpoint, MagicSignUpEndpoint) et `views/space/magic.py` (leurs équivalents Space) ; la spec `api/workspaces` est indirectement concernée car le post-auth workflow dépend de la session créée via magic link |
| Q4 — Casse un invariant si ignoré ? | OUI — un dev remplaçant le script Lua par un read/modify/write non-atomique (`ri.get()` + `ri.set()`) permettrait à des requêtes parallèles avec un mauvais code de dépasser le cap de 5 tentatives et de brute-forcer l'espace de 900 000 codes en moins d'une minute |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

Le magic link est une méthode d'authentification sans mot de passe où l'utilisateur reçoit un code à usage unique par email. L'espace des codes (6 chiffres, 100 000–999 999, soit 900 000 valeurs) est vulnérable au brute-force dans la fenêtre de validité de 10 minutes si aucune limitation des tentatives n'est imposée. Deux surfaces d'attaque existent : la génération de codes (permet de saturer la boîte mail) et la vérification (permet le brute-force direct).

## Décision identifiée

**Structure Redis par token** :
- Clé principale `magic_<email>` : JSON `{ current_attempt, email, token }`, TTL 600 s
- Clé compteur `magic_<email>:verify_attempts` : entier, TTL = TTL résiduel de la clé principale au moment du premier échec

**Double protection** :

1. **Côté émission** (`MagicCodeProvider.initiate()`) : si la clé `magic_<email>` existe déjà et que `current_attempt > 2`, la génération d'un nouveau code est bloquée (`EMAIL_CODE_ATTEMPT_EXHAUSTED`). Cela limite à 3 codes émis par fenêtre de 10 minutes pour la même adresse.

2. **Côté vérification** (`MagicCodeProvider.set_user_data()`) : en cas d'échec de vérification, un script Lua atomique (`INCR` + `EXPIRE` sur le premier incrément uniquement) maintient le compteur `verify_attempts`. À partir de 5 échecs, la clé principale et le compteur sont supprimés, forçant une ré-émission. Le TTL du compteur est initialisé au TTL résiduel de la clé principale (plancher 1 s) pour ne pas prolonger la fenêtre d'attaque.

3. **Réinitialisation** : à chaque nouvelle émission réussie, la clé compteur est supprimée (`ri.delete`) pour repartir avec un budget de 5 tentatives propre.

## Conséquences observées

### Positives
- Protection contre le brute-force de l'espace OTP : max 5 tentatives par token émis
- Protection contre la saturation de boîte mail : max 3 codes émis par fenêtre de 10 minutes
- Atomicité garantie sous charge concurrente (script Lua)
- Invalidation du token après épuisement des tentatives — force une nouvelle émission qui est elle-même comptabilisée

### Négatives / Dette
- Le seuil d'émission (3) est codé en dur dans `initiate()` via la condition `data["current_attempt"] > 2` — pas de constante nommée comme `MAX_VERIFY_ATTEMPTS`
- Le TTL de 10 minutes (600 s) est codé en dur — pas configurable via instance config
- La logique du compteur d'émission est dans le corps de `initiate()` avec un pattern read/modify/write (non atomique), contrairement au compteur de vérification. Sous charge très élevée (attaquant parallélisant les requêtes d'émission), il pourrait être possible de dépasser 3 générations

## Recommandation

Garder le mécanisme global. Corriger les deux points de dette :
1. Nommer la constante seuil d'émission (`MAX_INITIATE_ATTEMPTS = 3`) en miroir de `MAX_VERIFY_ATTEMPTS`
2. Rendre atomique le compteur d'émission (second script Lua) pour éliminer la race condition résiduelle
