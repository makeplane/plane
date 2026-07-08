# Rules base de données

> Charger sur tout projet utilisant une BDD, quelle que soit la stack.

## Règles absolues

1. Toute modification de schéma → créer une migration (jamais modifier la BDD à la main)
2. Migrations datées, numérotées et versionées avec le code
3. Jamais de DROP TABLE en production — utiliser des « soft deletes » si nécessaire
4. Index sur toutes les foreign keys et colonnes de recherche (WHERE, JOIN)
5. Schéma lisible humainement à jour dans `docs/architecture/database/schema.md`

## Nommage

- Tables : `snake_case` pluriel
- Colonnes : `snake_case`
- PK : `id`
- FK : `<table_singulier>_id`
- Booléens : préfixe `is_` ou `has_`
- Timestamps : `created_at`, `updated_at`
- Soft delete : `deleted_at` (nullable)

## Migrations

### Symfony (Doctrine)

```bash
php bin/console doctrine:migrations:generate
php bin/console doctrine:migrations:migrate
```

### Laravel

```bash
php artisan make:migration create_<table>
php artisan migrate
```

Voir `.claude/rules/02-symfony.md` ou `02-laravel.md` pour plus de détails stack-spécifiques.
