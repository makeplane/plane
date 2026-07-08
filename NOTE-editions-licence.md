# Note « Éditions & Licence » — Plane (auto-hébergé)

**Contexte :** ce dépôt est un fork de `makeplane/plane`. Question posée : pourquoi un outil open-source auto-hébergeable embarque-t-il de la « facturation » ? Analyse faite **dans le code réel** (preuves en annexe).

---

## En une phrase

> Ce dépôt est la **Community Edition (CE) de Plane, sous licence AGPL-3.0, entièrement gratuite et illimitée en auto-hébergé.** Ce qu'on prend pour de la « facturation » n'est qu'une **vitrine commerciale** (des liens vers l'offre cloud/entreprise de Plane) : **aucun paiement n'est possible ni requis dans l'instance auto-hébergée.**

---

## 1. Quelle édition, quelle licence ?

- **Édition :** Community Edition. Le code ne connaît qu'une seule édition : `InstanceEdition = PLANE_COMMUNITY` (valeur unique), et `IS_SELF_MANAGED = True` est codé en dur.
- **Licence :** **AGPL-3.0-only**, de façon homogène — `LICENSE.txt` (texte GNU AGPL v3 complet), `COPYRIGHT.txt` (SPDX `AGPL-3.0-only`), les 20 `package.json`, et ~3 900 fichiers source avec en-tête SPDX.
- **Les éditions payantes ne sont PAS dans ce dépôt :** l'Enterprise (`makeplane/plane-ee`) et le Cloud (`makeplane/plane-cloud`) sont des dépôts **séparés**, seulement *référencés* ici. Leur code (fonctionnalités payantes, paiement réel) n'existe pas dans le fork.
- **1 exception à signaler :** un unique fichier (`apps/api/plane/utils/email.py`) porte un en-tête **« Plane Commercial License »** (propriétaire, renvoi vers l'EULA plane.so). C'est le seul fichier non-AGPL du dépôt — vraisemblablement un utilitaire volontairement propriétaire ; à garder en tête si redistribution.

## 2. À quoi sert la « facturation » ici ? Qu'ajoute-t-elle concrètement ?

Une UI de facturation **existe bien** et est visible par l'admin (menu *Settings → Billing & Plans*, badge « Community », tableau comparatif Pro/Business/Enterprise, modales « Upgrade »). **Mais en auto-hébergé elle n'ajoute rien de fonctionnel :**

- **Aucun tunnel de paiement** : chaque bouton fait un simple `window.open(...)` vers `app.plane.so/upgrade` ou `plane.so/talk-to-sales`.
- **Pas de Stripe branché** : le libellé « Redirecting to Stripe » existe dans le code mais **n'est jamais déclenché** en CE.
- **Prix codés en dur** (constantes marketing, ex. Pro 800/mois, Business 1500/mois), **jamais lus par le serveur**.
- **Aucun backend de facturation** : pas de modèle abonnement, pas de serveur de billing, pas de feature-flags. Le module `plane/license/` ne fait que de la **configuration d'instance** (SMTP, OAuth, activation de fonctions) — malgré son nom.

➡️ C'est une **devanture** qui présente l'offre commerciale de l'éditeur, pas un péage.

## 3. Qu'est-ce qui est gratuit, qu'est-ce qui est « verrouillé » ?

| | En auto-hébergé (ce dépôt) |
|---|---|
| **Gratuit & illimité** | Projets, tickets, cycles, modules, pages/wiki, intake, vues filtrées, webhooks, notifications, analytics, collaboration temps réel… **Aucune limite de membres/sièges** (aucun quota dans le code), aucun paywall serveur. |
| **« Verrouillé » ?** | **Rien n'est réellement bloqué par un mécanisme technique.** Les « verrous » du front sont des composants **vides** (`return <></>`). Quelques surfaces étiquetées **« Pro »** (ex. *Active Cycles* au niveau workspace, certains *Estimates*) affichent un **écran marketing** au lieu de la fonctionnalité. |
| **Réellement payant** | Les vraies fonctions Pro/Business/Enterprise (SSO SAML/OIDC, time tracking avancé, teamspaces, dashboards avancés…) **ne sont pas dans ce dépôt** — elles vivent dans l'édition Enterprise/Cloud. Ce n'est donc pas « verrouillé » ici : c'est **absent**. |

➡️ Nuance importante : le tableau comparatif annonce des « limites de membres » par plan, mais **le backend CE n'en applique aucune**.

## 4. Peut-on légitimement s'en passer en auto-hébergé ? Implications licence ?

**Oui, sans réserve.** La CE est conçue pour l'auto-hébergement gratuit ; ignorer la vitrine d'upgrade est le fonctionnement nominal. Implications **AGPL-3.0** :

- ✅ **Usage, modification et hébergement libres et gratuits**, y compris en contexte professionnel/interne.
- ⚠️ **Copyleft fort + clause réseau (art. 13)** : si tu **modifies** Plane et que tu l'exposes à des utilisateurs **via le réseau**, tu dois leur **mettre à disposition le code source modifié**, sous AGPL-3.0.
- ⚠️ **Conserver les notices de licence** ; toute redistribution/version modifiée reste sous AGPL-3.0 (pas de reliçage propriétaire).
- ⚠️ **Marque** : « Plane » et son logo sont une marque ; l'AGPL couvre le code, pas le branding (l'app publique affiche « Powered by Plane Publish »).

## 5. Recommandation

1. **Rester sur la Community Edition auto-hébergée** : elle couvre l'intégralité du besoin de gestion de projet, gratuitement et sans limite technique.
2. **Traiter l'UI de facturation comme cosmétique** — la vitrine peut être ignorée ; on peut même masquer les écrans « Upgrade » pour les utilisateurs internes (les composants CE concernés sont isolés dans `apps/web/ce/…`).
3. **N'envisager un plan payant (Cloud ou licence Enterprise) que si** un besoin précis apparaît sur une fonction réellement réservée à l'EE (ex. SSO SAML/OIDC, teamspaces, dashboards avancés).
4. **Respecter l'AGPL** : si on modifie Plane et qu'on l'expose en réseau, prévoir la mise à disposition des sources modifiées. Vérifier le cas isolé de `email.py` (en-tête commercial) avant toute redistribution.

---

### Annexe — preuves (extraits vérifiés dans le dépôt)

- Édition unique : `apps/api/plane/license/models/instance.py` (`InstanceEdition.PLANE_COMMUNITY`) ; `apps/api/plane/settings/common.py` (`IS_SELF_MANAGED = True`).
- Licence : `LICENSE.txt`, `COPYRIGHT.txt` (`SPDX: AGPL-3.0-only`), `README.md` §License ; exception `apps/api/plane/utils/email.py` (`LicenseRef-Plane-Commercial`).
- Vitrine sans paiement : `apps/web/ce/components/license/modal/upgrade-modal.tsx` (`isSelfHosted=true`, `window.open`), `packages/constants/src/payment.ts` (prix en dur), stubs `return <></>` (`subscription-pill.tsx`, `billing-actions-button.tsx`).
- Pas de gating serveur : `apps/api/plane/app/views/workspace/invite.py` (aucune limite de sièges) ; aucun Stripe dans `apps/api/requirements/`.
- Éditions séparées : `.claude/skills/release-notes/SKILL.md` (`makeplane/plane-ee`, `makeplane/plane-cloud`) ; alias front `apps/web/tsconfig.json` (`@/plane-web/* → ./ce/*`, aucun dossier `ee/`).

*Méthode : investigation multi-agents du code (5 facettes) avec contre-vérification adverse de chaque conclusion.*
