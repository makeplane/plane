# RETRO-122 — Protection anti-SSRF par DNS-pinning (webhooks sortants)

| Champ      | Valeur              |
|------------|---------------------|
| Statut     | Documenté (rétro)   |
| Date       | 2026-06-30          |
| Source     | Rétro-ingénierie    |
| Features   | webhooks            |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | SECURITY |
| Q1 — Coût de revert > 1j ? | OUI — Remplacer `pinned_fetch` par `requests.post()` ordinaire implique de modifier `webhook_send_task`, `WebhookSerializer._validate_webhook_url`, `ip_address.py`, `url_security.py` (7 fichiers, 500+ lignes). La protection est câblée à deux niveaux (validation + envoi) et référencée dans la vulnérabilité GHSA-mq87-52pf-hm3h. |
| Q2 — Non-déductible du code ? | OUI — `requirements/base.txt` liste `requests==2.33` sans indiquer pourquoi ni qu'une couche d'adaptation DNS-pinning est nécessaire. La décision de résoudre DNS une fois et de se connecter à l'IP littérale (pour fermer la fenêtre TOCTOU) ne se déduit pas des dépendances. |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — La protection couvre : (1) la création/modification de webhooks (`WebhookSerializer._validate_webhook_url` + `validate_url`), (2) l'envoi de chaque événement (`webhook_send_task` → `pinned_fetch`). `pinned_fetch` est dans `plane/utils/` (module utilitaire partagé) — tout futur module effectuant des appels HTTP sortants doit utiliser ce client pour bénéficier de la même protection. |
| Q4 — Casse un invariant si ignoré ? | OUI — Un dev qui remplace `pinned_fetch(...)` par `requests.post(webhook.url, ...)` réintroduit la vulnérabilité DNS rebinding documentée sous GHSA-mq87-52pf-hm3h : le réseau interne (incluant les endpoints de métadonnées cloud `169.254.169.254`) redevient accessible via un webhook dont l'URL pointe vers un hôte contrôlé par l'attaquant. |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

Les webhooks sortants effectuent des requêtes HTTP vers des URLs fournies par les utilisateurs. Sans protection, un attaquant contrôlant un hostname peut faire pointer son DNS vers une adresse interne au moment de la connexion (DNS rebinding / TOCTOU), et ainsi utiliser l'instance Plane comme proxy vers le réseau interne, les services de métadonnées cloud (IMDSv1 à `169.254.169.254`), ou d'autres services non exposés publiquement.

La validation de l'URL à la création (vérifier que l'IP résolue n'est pas privée) n'est pas suffisante : entre la validation et l'envoi effectif, le DNS peut être modifié pour retourner une IP différente.

Cette vulnérabilité est référencée dans le code source sous `GHSA-mq87-52pf-hm3h / cluster C`.

## Décision identifiée

La protection est déployée en deux couches complémentaires :

**Couche 1 — Validation à la création (fail-fast)** : `WebhookSerializer._validate_webhook_url` appelle `validate_url` (ip_address.py) qui résout le DNS et vérifie que l'IP résolue n'est pas dans les plages bloquées. Les schémas non-HTTP/HTTPS et les adresses de loopback sont refusés dès le niveau modèle (`validate_schema`, `validate_domain`).

**Couche 2 — DNS-pinning à l'envoi (fermeture du TOCTOU)** : `webhook_send_task` utilise `pinned_fetch` (url_security.py) qui :
1. Résout le DNS une fois et valide l'IP résolue.
2. Réécrit l'URL avec l'IP littérale (`scheme://[ip]:port/path`).
3. Monte un `PinnedIPAdapter` sur la session `requests` — urllib3 ne refait pas de résolution DNS, la socket s'ouvre directement vers l'IP validée.
4. Injecte le hostname original dans le `Host` header et le TLS SNI pour que le certificat soit vérifié correctement.
5. Désactive les redirections automatiques (`allow_redirects=False`) — un `Location` 3xx ne peut pas rebondir vers une adresse interne.
6. Désactive les proxies ambiants (`session.trust_env = False`) — un proxy CONNECT contournerait le pinning.

Les réseaux bloqués couvrent explicitement les plages que `ipaddress.is_private` / `is_loopback` ne classifie pas systématiquement selon la version Python (ex. `100.64.0.0/10` CGN, `169.254.0.0/16` link-local/cloud-metadata, formats de transition IPv6).

L'opérateur peut déclarer des IPs (`WEBHOOK_ALLOWED_IPS`) ou des hostnames (`WEBHOOK_ALLOWED_HOSTS`) de confiance qui contournent le blocage pour les services internes légitimes (ex. Silo). Ces hôtes restent épinglés DNS pour prévenir le rebinding même lorsqu'ils sont de confiance.

## Conséquences observées

### Positives
- Fermeture complète de la fenêtre TOCTOU DNS rebinding — l'IP validée est exactement celle atteinte.
- Protection contre les redirections vers des adresses internes.
- Protection contre les proxies ambiants.
- Couverture des IPv6 de transition (6to4, Teredo, NAT64, IPv4-mapped) qui peuvent encoder des adresses IPv4 internes.
- Mécanisme de confiance configurable (`WEBHOOK_ALLOWED_IPS`, `WEBHOOK_ALLOWED_HOSTS`) pour les déploiements containerisés avec services internes légitimes.

### Négatives / Dette
- La double validation (création + envoi) peut mener à des faux négatifs au moment de l'envoi si l'IP change légitimement (ex. rotation d'infrastructure) — le webhook sera bloqué silencieusement (log `400` sans retry ni désactivation).
- `PinnedIPAdapter` surcharge `get_connection_with_tls_context` (API requests >= 2.32) — si `requests` est mis à jour et cette méthode disparaît, le pinning casse silencieusement.
- La liste `_BLOCKED_NETWORKS` dans ip_address.py est maintenue manuellement — un nouveau RFC définissant un range problématique ne sera pas couvert automatiquement.
- Aucun test automatisé ne couvre les vecteurs d'attaque SSRF (DNS rebinding, redirections vers internes, IPv6 de transition).

## Recommandation

Garder et renforcer. La protection est architecturalement correcte et bien documentée dans le code. Ajouter des tests unitaires couvrant : DNS rebinding simulé, URL pointant vers `169.254.169.254`, URL avec redirection vers IP interne, IPv6 mappé sur IPv4 privée. Documenter la dépendance sur `requests >= 2.32` (méthode `get_connection_with_tls_context`) pour alerter lors des mises à jour.
