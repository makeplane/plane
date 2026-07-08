# RETRO-121 — Signature HMAC-SHA256 des payloads webhook

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
| Q1 — Coût de revert > 1j ? | OUI — Changer l'algorithme de signature (ex. passer à RSA ou supprimer la signature) implique de modifier `webhook_send_task`, le format de la clé secrète (`generate_token`), la documentation consommateur, et de coordonner la migration de tous les systèmes externes qui vérifient `X-Plane-Signature`. La clé secrète est stockée en base et liée à chaque webhook. |
| Q2 — Non-déductible du code ? | OUI — `requirements/base.txt` n'indique pas que les payloads sont signés. La décision de signer le payload JSON complet (et non une sous-partie) avec la clé générée à la création du webhook, et d'utiliser `hmac.new(key, json.dumps(payload), hashlib.sha256)`, ne se déduit pas des dépendances. |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — La décision contraint : (1) `webhook_send_task` (émission de la signature dans l'en-tête `X-Plane-Signature`), (2) `WebhookSerializer` (génération et lecture de la `secret_key`), (3) `WebhookSecretRegenerateEndpoint` (rotation de clé), et (4) tout système externe consommateur de webhooks Plane qui doit implémenter la vérification HMAC. |
| Q4 — Casse un invariant si ignoré ? | OUI — Un dev qui modifie la structure du payload sans recalculer la signature rend la vérification côté consommateur invalide (faux négatifs). Un dev qui expose la `secret_key` dans les réponses GET brise l'invariant de confidentialité de la clé. Un dev qui retire la signature ouvre la possibilité d'usurper des événements Plane vers des systèmes intégrant la vérification. |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

Les webhooks sortants envoient des données métier vers des URLs externes non maîtrisées par Plane. Sans mécanisme d'authenticité, un système tiers ne peut pas distinguer une requête légitime provenant de Plane d'une requête forgée par un tiers. La signature HMAC est le pattern standard (GitHub Webhooks, Stripe, Shopify) pour résoudre ce problème sans nécessiter de TLS mutuel.

## Décision identifiée

Chaque webhook dispose d'une clé secrète unique générée à la création (`plane_wh_` + UUID hex, stockée en clair en base). À chaque envoi, `webhook_send_task` calcule un HMAC-SHA256 du payload JSON complet (sérialisé avec `DjangoJSONEncoder`) signé avec cette clé, et l'envoie dans l'en-tête `X-Plane-Signature`. La clé est renouvelable à la demande via l'endpoint `/regenerate/`.

La clé secrète est explicitement exclue des réponses de listing et de détail (elle n'est exposée qu'au moment de la régénération), ce qui limite la surface d'exposition.

## Conséquences observées

### Positives
- Les consommateurs externes peuvent vérifier l'authenticité de chaque événement reçu sans nécessiter un TLS mutuel ou un pare-feu IP.
- La rotation de clé est possible sans recréer le webhook.
- Le pattern est identique aux autres plateformes majeures (GitHub, Stripe), ce qui réduit la friction d'intégration.

### Négatives / Dette
- La clé secrète est stockée en clair en base (`CharField`) — elle n'est pas hashée. Un accès en lecture à la table `webhooks` expose toutes les clés.
- Le payload JSON est sérialisé deux fois (une fois pour la signature, une fois pour l'envoi HTTP) — le premier `json.dumps` dans `webhook_send_task` construit le payload en dictionnaire Python, puis il est passé directement à `requests` via le paramètre `json=payload`. La signature porte sur `json.dumps(payload)` mais l'envoi HTTP re-sérialise `payload` via `requests.post(json=payload)`. Si l'ordre des clés diffère entre les deux sérialisations, la signature ne correspond pas au corps effectivement envoyé — point à vérifier.
- Aucun test automatisé ne vérifie la cohérence entre le payload signé et le payload envoyé.

## Recommandation

Garder. La signature HMAC est un invariant de sécurité fondamental pour tout système de webhooks sortants. Vérifier le point de double sérialisation (signature vs body effectivement envoyé) et envisager de stocker la clé hashée en base ou dans un vault de secrets.
