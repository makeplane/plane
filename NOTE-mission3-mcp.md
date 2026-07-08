# Mission 3 — Piloter Plane par une IA (Claude) via un MCP

> **Objectif :** vérifier si on peut commander Plane en langage naturel depuis une IA (Claude) grâce à un **MCP** (Model Context Protocol), faire une démo (« liste mes projets », « crée une tâche »), et noter les **limites en auto-hébergé** (surtout l'authentification).
>
> **Rappel — c'est quoi un MCP ?** Un standard ouvert (Anthropic) qui permet à un assistant IA d'**appeler des outils externes**. Un « serveur MCP » expose des **outils** (ex. `list_projects`, `create_work_item`) que Claude peut déclencher. En clair : c'est un **adaptateur entre Claude et l'API de Plane**.

---

## 1. Ce qui existe déjà (phase « avant de coder »)

| Constat | Détail |
|---|---|
| **Rien dans notre dépôt** | Aucun code MCP dans Plane (les seules occurrences de « MCP » sont nos règles Zelian). |
| **Un MCP OFFICIEL existe** | **`makeplane/plane-mcp-server`** — *« Plane's Official Model Context Protocol Server »*, **licence MIT**, gratuit. |
| **Version à utiliser** | La version **Node.js** (`@makeplane/plane-mcp-server`) est **dépréciée**. La version maintenue est **Python + FastMCP**, lancée via `uvx plane-mcp-server`. |
| **Ce qu'il expose** | **~30 à 55 outils** (projets, work items/tâches, cycles, modules, membres…) : `list_projects`, `create_work_item`, `list_work_items`, `retrieve_work_item_by_identifier`, `create_cycle`, etc. |
| **Transports** | `stdio` (local), HTTP (avec PAT ou OAuth), SSE (déprécié). |

➡️ **Conclusion phase 1 : on ne développe rien.** On **réutilise le MCP officiel** et on le branche sur notre instance. (Il s'appuie sur l'API REST `/api/v1/` de Plane — la même que la Mission 2.)

---

## 2. Ce que ça permet

Piloter Plane **en langage naturel** depuis Claude. Exemples de la démo :

| Ce qu'on dit à Claude | Outil MCP déclenché | Résultat |
|---|---|---|
| « Liste mes projets Plane » | `list_projects` | La liste des projets de l'espace |
| « Crée une tâche *Rédiger la doc* dans le projet X » | `create_work_item` | Une nouvelle tâche créée dans Plane |
| « Montre les tâches en cours du projet X » | `list_work_items` (filtres) | Les work items filtrés |

En plus : créer/lister des cycles (sprints), des modules, rechercher des tâches, les mettre à jour. **Lecture + écriture** sur les objets cœur de la gestion de projet. Tout ça **sur le Community Edition, gratuit**, via une clé API.

---

## 3. Mise en place sur une instance AUTO-HÉBERGÉE

On **fait tourner le serveur MCP soi-même** (en local, mode `stdio`) et on le pointe vers notre instance avec 3 variables d'environnement :

| Variable | Rôle | Exemple |
|---|---|---|
| `PLANE_API_KEY` | La clé API (PAT) — cf. Mission 2 | `plane_api_...` |
| `PLANE_WORKSPACE_SLUG` | L'espace de travail | `zelian` |
| `PLANE_BASE_URL` | **L'URL de NOTRE instance** (par défaut le cloud `api.plane.so` → à surcharger) | `https://plane.zelian.fr` |

**Vérif rapide que la clé marche :** `curl -H "x-api-key: MA_CLE" https://plane.zelian.fr/api/v1/users/me/` → doit renvoyer `200`.

### Brancher à Claude — 2 options

**A. Claude Desktop** (fichier `claude_desktop_config.json`) :
```json
{
  "mcpServers": {
    "plane": {
      "command": "uvx",
      "args": ["plane-mcp-server", "stdio"],
      "env": {
        "PLANE_API_KEY": "ma_cle",
        "PLANE_WORKSPACE_SLUG": "zelian",
        "PLANE_BASE_URL": "https://plane.zelian.fr"
      }
    }
  }
}
```

**B. Claude Code (CLI)** :
```bash
claude mcp add plane \
  -e PLANE_API_KEY=ma_cle \
  -e PLANE_WORKSPACE_SLUG=zelian \
  -e PLANE_BASE_URL=https://plane.zelian.fr \
  -- uvx plane-mcp-server stdio
```

*(Prérequis : Python + `uv` installés — `uvx` télécharge et lance le serveur automatiquement.)*

---

## 4. La démo (mode d'emploi à exécuter sur l'instance)

> À faire une fois qu'on a : l'**URL** de l'instance, un **PAT**, le **slug** du workspace.

1. Configurer le MCP (option A ou B ci-dessus), puis **redémarrer** Claude Desktop / recharger Claude Code.
2. Vérifier que l'outil est branché : dans Claude, les outils `plane` apparaissent (bouton « + » → Connecteurs sur Desktop).
3. **Demander à l'IA** :
   - « **Liste mes projets Plane.** » → Claude appelle `list_projects` et affiche la liste.
   - « **Crée une tâche *Test MCP* dans le projet &lt;nom&gt;.** » → Claude appelle `create_work_item` ; la tâche apparaît dans Plane.
4. **Capturer** : une **capture d'écran** (ou courte vidéo) montrant (a) la demande en langage naturel, (b) l'appel d'outil MCP, (c) le résultat, et (d) la tâche visible dans l'interface Plane.

> ⚠️ Cette étape hands-on nécessite l'instance en ligne + le PAT + le client Claude — elle se fait **côté poste dev** (pas dans ce cadrage). Le reste (recherche + note) est fait.

---

## 5. Les limites en auto-hébergé (⭐ le point demandé)

### Côté authentification (le principal)
1. **Pas d'OAuth « clé en main » en auto-hébergé.** Le service MCP hébergé par Plane (`https://mcp.plane.so`) et son **OAuth** sont réservés à **Plane Cloud**. En auto-hébergé, l'OAuth « prêt à l'emploi » n'existe pas → on retombe sur la **clé API (PAT)**. *(Cohérent avec la Mission 1 : OAuth/SSO clé en main = fonctionnalité Enterprise payante.)*
2. **Connecteur claude.ai (web) difficile.** Les connecteurs de claude.ai attendent un **serveur MCP distant en HTTPS avec OAuth**. En auto-hébergé, il faudrait **héberger soi-même** ce serveur en HTTPS + gérer l'OAuth → lourd. **La voie réaliste = `stdio` en local** (Claude Desktop / Claude Code sur le poste), pas le connecteur web.
3. **La clé API = les droits de son propriétaire.** Le PAT est lié à **un utilisateur** et à **son rôle** dans l'espace. L'IA agit donc « en tant que cet utilisateur » : **pas de périmètre fin par outil**, pas de rôle dédié « IA ». À traiter comme un secret (Mission 2).

### Côté fonctionnalités
4. **Certaines API ne sont pas exposées en auto-hébergé.** Ex. connu : les endpoints **Pages** ne sont pas joignables via l'API REST publique sur une instance auto-hébergée (issue GitHub #8986) → les outils MCP liés aux pages **ne marchent pas** en self-host.
5. **Le MCP ne fait que ce que l'API `/api/v1/` permet.** C'est un simple habillage de l'API REST. Donc **mêmes limites que la Mission 2** : par ex. on ne peut pas créer un **membre actif** via l'API → l'IA ne pourra pas non plus provisionner des membres.
6. **Débit** : clé API limitée à 60 req/min — sans impact pour un usage interactif.

---

## 6. Verdict & recommandation

- **Oui, c'est possible et sans développement** : le MCP officiel `plane-mcp-server` (Python/FastMCP, MIT) pilote Plane depuis Claude, y compris en auto-hébergé, via la **clé API**.
- **Recommandation de démo :** mode **`stdio` local** (Claude Desktop ou Claude Code) avec `PLANE_API_KEY` + `PLANE_WORKSPACE_SLUG` + `PLANE_BASE_URL`. Simple, gratuit, aucune brique payante.
- **Limite structurante à retenir :** en auto-hébergé, **auth = clé API uniquement** (OAuth/connecteur web = cloud/Enterprise), et le MCP est **plafonné par l'API REST publique** (pages non exposées, pas de provisioning de membres actifs).

---

## Sources
- [makeplane/plane-mcp-server (GitHub, officiel, MIT)](https://github.com/makeplane/plane-mcp-server)
- [MCP server — doc développeur Plane](https://developers.plane.so/dev-tools/mcp-server)
- [Set up Plane MCP — docs.plane.com](https://docs.plane.com/guides/mcp)
- [Custom connectors (remote MCP) — Claude Help](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)
- [Local MCP servers on Claude Desktop — Claude Help](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)
- [Pages API non exposée en self-hosted — issue #8986](https://github.com/makeplane/plane/issues/8986)
- [Package npm Node (déprécié)](https://www.npmjs.com/package/@makeplane/plane-mcp-server)

*Analyse : dépôt Plane (aucun MCP interne ; API `/api/v1/` = base de la démo) + recherche web vérifiée sur le MCP officiel et l'auth auto-hébergée.*
