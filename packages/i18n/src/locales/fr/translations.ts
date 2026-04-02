/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

export default {
  cloud_maintenance_message: {
    we_are_working_on_this_if_you_need_immediate_assistance:
      "Nous travaillons là-dessus. Si vous avez besoin d&apos;aide immédiate,",
    reach_out_to_us: "contactez-nous",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our:
      "Sinon, essayez de rafraîchir la page de temps en temps ou visitez notre",
    status_page: "page de statut",
  },
  sidebar: {
    projects: "Projets",
    pages: "Pages",
    new_work_item: "Nouvel élément de travail",
    home: "Accueil",
    your_work: "Votre travail",
    inbox: "Boîte de réception",
    workspace: "Espace de travail",
    views: "Vues",
    analytics: "Analyses",
    work_items: "Éléments de travail",
    cycles: "Cycles",
    modules: "Modules",
    intake: "Intake",
    drafts: "Brouillons",
    favorites: "Favoris",
    pro: "Pro",
    upgrade: "Mettre à niveau",
    pi_chat: "Plane AI",
    initiatives: "Initiatives",
    teamspaces: "Espaces d'équipe",
    epics: "Epics",
    upgrade_plan: "Mettre à niveau",
    plane_pro: "Plane Pro",
    business: "Business",
    customers: "Clients",
    recurring_work_items: "Tâches récurrentes",
  },
  auth: {
    common: {
      email: {
        label: "E-mail",
        placeholder: "nom@entreprise.com",
        errors: {
          required: "L’e-mail est requis",
          invalid: "L’e-mail est invalide",
        },
      },
      password: {
        label: "Mot de passe",
        set_password: "Définir un mot de passe",
        placeholder: "Entrer le mot de passe",
        confirm_password: {
          label: "Confirmer le mot de passe",
          placeholder: "Confirmer le mot de passe",
        },
        current_password: {
          label: "Mot de passe actuel",
        },
        new_password: {
          label: "Nouveau mot de passe",
          placeholder: "Entrer le nouveau mot de passe",
        },
        change_password: {
          label: {
            default: "Changer le mot de passe",
            submitting: "Changement du mot de passe",
          },
        },
        errors: {
          match: "Les mots de passe ne correspondent pas",
          empty: "Veuillez entrer votre mot de passe",
          length: "Le mot de passe doit contenir plus de 8 caractères",
          strength: {
            weak: "Le mot de passe est faible",
            strong: "Le mot de passe est fort",
          },
        },
        submit: "Définir le mot de passe",
        toast: {
          change_password: {
            success: {
              title: "Succès !",
              message: "Mot de passe changé avec succès.",
            },
            error: {
              title: "Erreur !",
              message: "Une erreur s'est produite. Veuillez réessayer.",
            },
          },
        },
      },
      unique_code: {
        label: "Code unique",
        placeholder: "123456",
        paste_code: "Collez le code envoyé à votre e-mail",
        requesting_new_code: "Demande d’un nouveau code",
        sending_code: "Envoi du code",
      },
      already_have_an_account: "Vous avez déjà un compte ?",
      login: "Se connecter",
      create_account: "Créer un compte",
      new_to_plane: "Nouveau sur Plane ?",
      back_to_sign_in: "Retour à la connexion",
      resend_in: "Renvoyer dans {seconds} secondes",
      sign_in_with_unique_code: "Se connecter avec un code unique",
      forgot_password: "Mot de passe oublié ?",
      username: {
        label: "Nom d'utilisateur",
        placeholder: "Entrez votre nom d'utilisateur",
      },
    },
    sign_up: {
      header: {
        label: "Créez un compte pour commencer à gérer le travail avec votre équipe.",
        step: {
          email: {
            header: "S’inscrire",
            sub_header: "",
          },
          password: {
            header: "S’inscrire",
            sub_header: "Inscrivez-vous en utilisant une combinaison e-mail-mot de passe.",
          },
          unique_code: {
            header: "S’inscrire",
            sub_header: "Inscrivez-vous en utilisant un code unique envoyé à l’adresse e-mail ci-dessus.",
          },
        },
      },
      errors: {
        password: {
          strength: "Essayez de définir un mot de passe fort pour continuer",
        },
      },
    },
    sign_in: {
      header: {
        label: "Connectez-vous pour commencer à gérer le travail avec votre équipe.",
        step: {
          email: {
            header: "Se connecter ou s’inscrire",
            sub_header: "",
          },
          password: {
            header: "Se connecter ou s’inscrire",
            sub_header: "Utilisez votre combinaison e-mail - mot de passe pour vous connecter.",
          },
          unique_code: {
            header: "Se connecter ou s’inscrire",
            sub_header: "Connectez-vous en utilisant un code unique envoyé à l’adresse e-mail ci-dessus.",
          },
        },
      },
    },
    forgot_password: {
      title: "Réinitialiser votre mot de passe",
      description:
        "Entrez l’adresse e-mail vérifiée de votre compte utilisateur et nous vous enverrons un lien de réinitialisation du mot de passe.",
      email_sent: "Nous avons envoyé le lien de réinitialisation à votre adresse e-mail",
      send_reset_link: "Envoyer le lien de réinitialisation",
      errors: {
        smtp_not_enabled:
          "Nous constatons que votre administrateur n’a pas activé le SMTP, nous ne pourrons pas envoyer de lien de réinitialisation du mot de passe",
      },
      toast: {
        success: {
          title: "E-mail envoyé",
          message:
            "Consultez votre boîte de réception pour obtenir un lien de réinitialisation de votre mot de passe. S’il n’apparaît pas dans quelques minutes, vérifiez votre dossier spam.",
        },
        error: {
          title: "Erreur !",
          message: "Une erreur s’est produite. Veuillez réessayer.",
        },
      },
    },
    reset_password: {
      title: "Définir un nouveau mot de passe",
      description: "Sécurisez votre compte avec un mot de passe fort",
    },
    set_password: {
      title: "Sécurisez votre compte",
      description: "La définition d’un mot de passe vous permet de vous connecter en toute sécurité",
    },
    sign_out: {
      toast: {
        error: {
          title: "Erreur !",
          message: "Échec de la déconnexion. Veuillez réessayer.",
        },
      },
    },
    ldap: {
      header: {
        label: "Continuer avec {ldapProviderName}",
        sub_header: "Entrez vos identifiants {ldapProviderName}",
      },
    },
  },
  submit: "Valider",
  cancel: "Annuler",
  loading: "Chargement",
  error: "Erreur",
  success: "Succès",
  warning: "Avertissement",
  info: "Info",
  close: "Fermer",
  yes: "Oui",
  no: "Non",
  ok: "OK",
  name: "Nom",
  description: "Description",
  search: "Rechercher",
  add_member: "Ajouter un membre",
  adding_members: "Ajout de membres",
  remove_member: "Supprimer le membre",
  add_members: "Ajouter des membres",
  adding_member: "Ajout de membres",
  remove_members: "Supprimer des membres",
  add: "Ajouter",
  adding: "Ajout",
  remove: "Supprimer",
  add_new: "Ajouter nouveau",
  remove_selected: "Supprimer la sélection",
  first_name: "Prénom",
  last_name: "Nom",
  email: "E-mail",
  display_name: "Nom d'affichage",
  role: "Rôle",
  timezone: "Fuseau horaire",
  avatar: "Avatar",
  cover_image: "Image de couverture",
  password: "Mot de passe",
  change_cover: "Changer la couverture",
  language: "Langue",
  saving: "Enregistrement",
  save_changes: "Enregistrer les modifications",
  deactivate_account: "Désactiver le compte",
  deactivate_account_description:
    "Lors de la désactivation d'un compte, toutes les données et ressources de ce compte seront définitivement supprimées et ne pourront pas être récupérées.",
  profile_settings: "Paramètres du profil",
  your_account: "Votre compte",
  security: "Sécurité",
  activity: "Activité",
  activity_empty_state: {
    no_activity: "Aucune activité",
    no_transitions: "Aucune transition",
  },
  appearance: "Apparence",
  notifications: "Notifications",
  workspaces: "Espaces de travail",
  create_workspace: "Créer un espace de travail",
  invitations: "Invitations",
  summary: "Résumé",
  assigned: "Assigné",
  created: "Créé",
  subscribed: "Abonné",
  you_do_not_have_the_permission_to_access_this_page: "Vous n’avez pas la permission d’accéder à cette page.",
  something_went_wrong_please_try_again: "Une erreur s’est produite. Veuillez réessayer.",
  load_more: "Charger davantage",
  select_or_customize_your_interface_color_scheme:
    "Sélectionnez ou personnalisez votre palette de couleurs de l’interface.",
  select_the_cursor_motion_style_that_feels_right_for_you:
    "Sélectionnez le style de mouvement du curseur qui vous convient le mieux.",
  theme: "Thème",
  smooth_cursor: "Curseur fluide",
  system_preference: "Préférence système",
  light: "Clair",
  dark: "Sombre",
  light_contrast: "Contraste élevé clair",
  dark_contrast: "Contraste élevé sombre",
  custom: "Thème personnalisé",
  select_your_theme: "Sélectionnez votre thème",
  customize_your_theme: "Personnalisez votre thème",
  background_color: "Couleur de fond",
  text_color: "Couleur du texte",
  primary_color: "Couleur principale (Thème)",
  sidebar_background_color: "Couleur de fond de la barre latérale",
  sidebar_text_color: "Couleur du texte de la barre latérale",
  set_theme: "Définir le thème",
  enter_a_valid_hex_code_of_6_characters: "Entrez un code hexadécimal valide de 6 caractères",
  background_color_is_required: "La couleur de fond est requise",
  text_color_is_required: "La couleur du texte est requise",
  primary_color_is_required: "La couleur principale est requise",
  sidebar_background_color_is_required: "La couleur de fond de la barre latérale est requise",
  sidebar_text_color_is_required: "La couleur du texte de la barre latérale est requise",
  updating_theme: "Mise à jour du thème",
  theme_updated_successfully: "Thème mis à jour avec succès",
  failed_to_update_the_theme: "Échec de la mise à jour du thème",
  email_notifications: "Notifications par e-mail",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "Restez informé des éléments de travail auxquels vous êtes abonné. Activez ceci pour être notifié.",
  email_notification_setting_updated_successfully: "Paramètre de notification par e-mail mis à jour avec succès",
  failed_to_update_email_notification_setting: "Échec de la mise à jour du paramètre de notification par e-mail",
  notify_me_when: "Me notifier quand",
  property_changes: "Modifications des propriétés",
  property_changes_description:
    "Me notifier lorsque les propriétés des éléments de travail comme les acteurs, la priorité, les estimations ou autre changent.",
  state_change: "Changement d’état",
  state_change_description: "Me notifier lorsque les éléments de travail passent à un état différent",
  issue_completed: "Élément de travail terminé",
  issue_completed_description: "Me notifier uniquement lorsqu’un élément de travail est terminé",
  comments: "Commentaires",
  comments_description: "Me notifier lorsque quelqu’un laisse un commentaire sur l’élément de travail",
  mentions: "Mentions",
  mentions_description: "Me notifier uniquement lorsque quelqu’un me mentionne dans les commentaires ou la description",
  old_password: "Ancien mot de passe",
  general_settings: "Paramètres généraux",
  sign_out: "Se déconnecter",
  signing_out: "Déconnexion",
  active_cycles: "Cycles actifs",
  active_cycles_description:
    "Surveillez les cycles à travers les projets, suivez les éléments de travail prioritaires et zoomez sur les cycles qui nécessitent votre attention.",
  on_demand_snapshots_of_all_your_cycles: "Instantanés à la demande de tous vos cycles",
  upgrade: "Mettre à niveau",
  "10000_feet_view": "Vue à 10 000 pieds de tous les cycles actifs.",
  "10000_feet_view_description":
    "Dézoomez pour voir les cycles en cours dans tous vos projets en même temps au lieu de passer d’un cycle à l’autre dans chaque projet.",
  get_snapshot_of_each_active_cycle: "Obtenez un aperçu de chaque cycle actif.",
  get_snapshot_of_each_active_cycle_description:
    "Suivez les métriques de haut niveau pour tous les cycles actifs, suivez leur état d’avancement et évaluez leur impact par rapport aux échéances.",
  compare_burndowns: "Comparez les burndowns.",
  compare_burndowns_description:
    "Surveillez les performances de chacune de vos équipes en jetant un coup d’œil au rapport burndown de chaque cycle.",
  quickly_see_make_or_break_issues: "Repérez rapidement les éléments de travail critiques.",
  quickly_see_make_or_break_issues_description:
    "Prévisualisez les éléments de travail hautement prioritaires pour chaque cycle par rapport aux dates d’échéance. Visualisez-les pour chaque cycle en un clic.",
  zoom_into_cycles_that_need_attention: "Zoomez sur les cycles qui nécessitent votre attention.",
  zoom_into_cycles_that_need_attention_description:
    "Examinez l’état de tout cycle qui ne corresponde pas aux attentes en un clic.",
  stay_ahead_of_blockers: "Anticipez les blocages.",
  stay_ahead_of_blockers_description:
    "Repérez les défis d’un projet à l’autre et repérez les dépendances inter-cycles qui ne sont pas évidentes depuis une autre vue.",
  analytics: "Analyses",
  workspace_invites: "Invitations à l’espace de travail",
  enter_god_mode: "Entrer en mode dieu",
  workspace_logo: "Logo de l’espace de travail",
  new_issue: "Nouvel élément de travail",
  your_work: "Votre travail",
  drafts: "Brouillons",
  projects: "Projets",
  views: "Vues",
  archives: "Archives",
  settings: "Paramètres",
  failed_to_move_favorite: "Échec du déplacement du favori",
  favorites: "Favoris",
  no_favorites_yet: "Pas encore de favoris",
  create_folder: "Créer un dossier",
  new_folder: "Nouveau dossier",
  favorite_updated_successfully: "Favori mis à jour avec succès",
  favorite_created_successfully: "Favori créé avec succès",
  folder_already_exists: "Le dossier existe déjà",
  folder_name_cannot_be_empty: "Le nom du dossier ne peut pas être vide",
  something_went_wrong: "Une erreur s’est produite",
  failed_to_reorder_favorite: "Échec de la réorganisation du favori",
  favorite_removed_successfully: "Favori supprimé avec succès",
  failed_to_create_favorite: "Échec de la création du favori",
  failed_to_rename_favorite: "Échec du renommage du favori",
  project_link_copied_to_clipboard: "Lien du projet copié dans le presse-papiers",
  link_copied: "Lien copié",
  add_project: "Ajouter un projet",
  create_project: "Créer un projet",
  failed_to_remove_project_from_favorites: "Impossible de supprimer le projet des favoris. Veuillez réessayer.",
  project_created_successfully: "Projet créé avec succès",
  project_created_successfully_description:
    "Projet créé avec succès. Vous pouvez maintenant commencer à ajouter des éléments de travail.",
  project_name_already_taken: "Le nom du projet est déjà pris.",
  project_identifier_already_taken: "L’identifiant du projet est déjà pris.",
  project_cover_image_alt: "Image de couverture du projet",
  name_is_required: "Le nom est requis",
  title_should_be_less_than_255_characters: "Le titre doit faire moins de 255 caractères",
  project_name: "Nom du projet",
  project_id_must_be_at_least_1_character: "L’ID du projet doit comporter au moins 1 caractère",
  project_id_must_be_at_most_5_characters: "L’ID du projet doit comporter au plus 5 caractères",
  project_id: "ID du projet",
  project_id_tooltip_content:
    "Vous aide à identifier de manière unique les éléments de travail dans le projet. Maximum 50 caractères.",
  description_placeholder: "Description",
  only_alphanumeric_non_latin_characters_allowed: "Seuls les caractères alphanumériques et non latins sont autorisés.",
  project_id_is_required: "L’ID du projet est requis",
  project_id_allowed_char: "Seuls les caractères alphanumériques et non latins sont autorisés.",
  project_id_min_char: "L’ID du projet doit comporter au moins 1 caractère",
  project_id_max_char: "L'ID du projet doit comporter au plus {max} caractères",
  project_description_placeholder: "Entrez la description du projet",
  select_network: "Sélectionner le réseau",
  lead: "Responsable",
  date_range: "Plage de dates",
  private: "Privé",
  public: "Public",
  accessible_only_by_invite: "Accessible uniquement sur invitation",
  anyone_in_the_workspace_except_guests_can_join:
    "Tout le monde dans l’espace de travail peut rejoindre, sauf les invités",
  creating: "Création",
  creating_project: "Création du projet",
  adding_project_to_favorites: "Ajout du projet aux favoris",
  project_added_to_favorites: "Projet ajouté aux favoris",
  couldnt_add_the_project_to_favorites: "Impossible d’ajouter le projet aux favoris. Veuillez réessayer.",
  removing_project_from_favorites: "Suppression du projet des favoris",
  project_removed_from_favorites: "Projet supprimé des favoris",
  couldnt_remove_the_project_from_favorites: "Impossible de supprimer le projet des favoris. Veuillez réessayer.",
  add_to_favorites: "Ajouter aux favoris",
  remove_from_favorites: "Supprimer des favoris",
  publish_project: "Publier le projet",
  publish: "Publier",
  copy_link: "Copier le lien",
  leave_project: "Quitter le projet",
  join_the_project_to_rearrange: "Rejoignez le projet pour réorganiser",
  drag_to_rearrange: "Glisser pour réorganiser",
  congrats: "Félicitations !",
  open_project: "Ouvrir le projet",
  issues: "Éléments de travail",
  cycles: "Cycles",
  modules: "Modules",
  pages: {
    link_pages: "Lier les pages",
    show_wiki_pages: "Afficher les pages de wiki",
    link_pages_to: "Lier les pages à",
    linked_pages: "Pages liées",
    no_description: "Cette page est vide. Écrivez quelque chose ici et voyez-le ici comme ce placeholder",
    toasts: {
      link: {
        success: {
          title: "Pages mises à jour",
          message: "Pages mises à jour avec succès",
        },
        error: {
          title: "Pages non mises à jour",
          message: "Les pages n'ont pas pu être mises à jour",
        },
      },
      remove: {
        success: {
          title: "Page supprimée",
          message: "Page supprimée avec succès",
        },
        error: {
          title: "Page non supprimée",
          message: "La page n'a pas pu être supprimée",
        },
      },
    },
  },
  intake: "Intake",
  renew: "Renouveler",
  preview: "Aperçu",
  time_tracking: "Suivi du temps",
  work_management: "Organisation du travail",
  projects_and_issues: "Projets et éléments de travail",
  projects_and_issues_description: "Activez ou désactivez ces éléments pour ce projet.",
  cycles_description:
    "Définissez un cadre temporel pour chaque projet et ajustez la durée selon les besoins. Un cycle peut durer deux semaines, le suivant une semaine.",
  modules_description: "Organisez le travail en sous-projets avec des responsables et des acteurs spécifiques.",
  views_description:
    "Enregistrez des tris, filtres et options d’affichage personnalisés ou partagez-les avec votre équipe.",
  pages_description: "Créez et modifiez du contenu libre : notes, documents, tout ce que vous voulez.",
  intake_description:
    "Permettez aux non-membres de partager des bugs, des retours et des suggestions, sans perturber votre flux de travail.",
  time_tracking_description: "Enregistrez le temps passé sur les éléments de travail et les projets.",
  work_management_description: "Gérez votre travail et vos projets facilement.",
  documentation: "Documentation",
  message_support: "Contacter le support",
  contact_sales: "Contacter les ventes",
  hyper_mode: "Mode Hyper",
  keyboard_shortcuts: "Raccourcis clavier",
  whats_new: "Quoi de neuf ?",
  version: "Version",
  we_are_having_trouble_fetching_the_updates: "Nous avons des difficultés à récupérer les mises à jour.",
  our_changelogs: "nos journaux des modifications",
  for_the_latest_updates: "pour les dernières mises à jour.",
  please_visit: "Veuillez visiter",
  docs: "Documentation",
  full_changelog: "Journal des modifications complet",
  support: "Support",
  forum: "Forum",
  powered_by_plane_pages: "Propulsé par Plane Pages",
  please_select_at_least_one_invitation: "Veuillez sélectionner au moins une invitation.",
  please_select_at_least_one_invitation_description:
    "Veuillez sélectionner au moins une invitation pour rejoindre l’espace de travail.",
  we_see_that_someone_has_invited_you_to_join_a_workspace:
    "Nous voyons que quelqu’un vous a invité à rejoindre un espace de travail",
  join_a_workspace: "Rejoindre un espace de travail",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description:
    "Nous voyons que quelqu’un vous a invité à rejoindre un espace de travail",
  join_a_workspace_description: "Rejoindre un espace de travail",
  accept_and_join: "Accepter et rejoindre",
  go_home: "Aller à l’accueil",
  no_pending_invites: "Aucune invitation en attente",
  you_can_see_here_if_someone_invites_you_to_a_workspace:
    "Vous pouvez voir ici si quelqu’un vous invite à un espace de travail",
  back_to_home: "Retour à l’accueil",
  workspace_name: "nom-espace-de-travail",
  deactivate_your_account: "Désactiver votre compte",
  deactivate_your_account_description:
    "Une fois votre compte désactivé, vous ne pourrez plus être associé à des éléments de travail ni être facturé pour votre espace de travail. Pour réactiver votre compte, vous aurez besoin d'une invitation à un espace de travail avec cette adresse e-mail.",
  deactivating: "Désactivation",
  confirm: "Confirmer",
  confirming: "Confirmation",
  draft_created: "Brouillon créé",
  issue_created_successfully: "Élément de travail créé avec succès",
  draft_creation_failed: "Échec de la création du brouillon",
  issue_creation_failed: "Échec de la création de l’élément de travail",
  draft_issue: "Élément de travail en brouillon",
  issue_updated_successfully: "Élément de travail mis à jour avec succès",
  issue_could_not_be_updated: "L’élément de travail n’a pas pu être mis à jour",
  create_a_draft: "Créer un brouillon",
  save_to_drafts: "Enregistrer dans les brouillons",
  save: "Enregistrer",
  update: "Mettre à jour",
  updating: "Mise à jour",
  create_new_issue: "Créer un nouvel élément de travail",
  editor_is_not_ready_to_discard_changes: "L’éditeur n’est pas prêt à annuler les modifications",
  failed_to_move_issue_to_project: "Échec du déplacement de l’élément de travail vers le projet",
  create_more: "Créer plus",
  add_to_project: "Ajouter au projet",
  discard: "Annuler",
  duplicate_issue_found: "Élément de travail en double trouvé",
  duplicate_issues_found: "Éléments de travail en double trouvés",
  no_matching_results: "Aucun résultat correspondant",
  title_is_required: "Le titre est requis",
  title: "Titre",
  state: "État",
  transition: "Transition",
  history: "Historique",
  priority: "Priorité",
  none: "Aucun",
  urgent: "Urgent",
  high: "Élevé",
  medium: "Moyen",
  low: "Faible",
  members: "Membres",
  assignee: "Acteur",
  assignees: "Acteurs",
  subscriber: "{count, plural, one{# Abonné} other{# Abonnés}}",
  you: "Vous",
  labels: "Étiquettes",
  create_new_label: "Créer une nouvelle étiquette",
  label_name: "Nom de l'étiquette",
  failed_to_create_label: "Échec de la création de l'étiquette. Veuillez réessayer.",
  start_date: "Date de début",
  end_date: "Date de fin",
  due_date: "Date d’échéance",
  estimate: "Estimation",
  change_parent_issue: "Changer l’élément de travail parent",
  remove_parent_issue: "Supprimer l’élément de travail parent",
  add_parent: "Ajouter un parent",
  loading_members: "Chargement des membres",
  view_link_copied_to_clipboard: "Lien de la vue copié dans le presse-papiers.",
  required: "Requis",
  optional: "Optionnel",
  Cancel: "Annuler",
  edit: "Modifier",
  archive: "Archiver",
  restore: "Restaurer",
  open_in_new_tab: "Ouvrir dans un nouvel onglet",
  delete: "Supprimer",
  deleting: "Suppression",
  make_a_copy: "Faire une copie",
  move_to_project: "Déplacer vers le projet",
  good: "Bonjour",
  morning: "matin",
  afternoon: "après-midi",
  evening: "soir",
  show_all: "Tout afficher",
  show_less: "Afficher moins",
  no_data_yet: "Pas encore de données",
  syncing: "Synchronisation",
  add_work_item: "Ajouter un élément de travail",
  advanced_description_placeholder: "Appuyez sur '/' pour voir les commandes",
  create_work_item: "Créer un élément de travail",
  attachments: "Pièces jointes",
  declining: "Refus",
  declined: "Refusé",
  decline: "Refuser",
  unassigned: "Non attribué",
  work_items: "Éléments de travail",
  add_link: "Ajouter un lien",
  points: "Points",
  no_assignee: "Pas d’acteurs associés",
  no_assignees_yet: "Pas encore d’acteurs associés",
  no_labels_yet: "Pas encore d’étiquettes",
  ideal: "Idéal",
  current: "Actuel",
  no_matching_members: "Aucun membre correspondant",
  leaving: "Départ",
  removing: "Suppression",
  leave: "Quitter",
  refresh: "Actualiser",
  refreshing: "Actualisation",
  refresh_status: "Actualiser l’état",
  prev: "Précédent",
  next: "Suivant",
  re_generating: "Régénération",
  re_generate: "Régénérer",
  re_generate_key: "Régénérer la clé",
  export: "Exporter",
  member: "{count, plural, one{# membre} other{# membres}}",
  new_password_must_be_different_from_old_password:
    "Le nouveau mot de passe doit être différent du mot de passe précédent",
  edited: "Modifié",
  bot: "Bot",
  project_view: {
    sort_by: {
      created_at: "Créé le",
      updated_at: "Mis à jour le",
      name: "Nom",
    },
  },
  upgrade_request: "Demandez à l'administrateur de l'espace de travail de mettre à niveau.",
  copied_to_clipboard: "Copié dans le presse-papiers",
  copied_to_clipboard_description: "L'URL a été copiée avec succès dans votre presse-papiers",
  toast: {
    success: "Succès !",
    error: "Erreur !",
  },
  links: {
    toasts: {
      created: {
        title: "Lien créé",
        message: "Le lien a été créé avec succès",
      },
      not_created: {
        title: "Lien non créé",
        message: "Le lien n’a pas pu être créé",
      },
      updated: {
        title: "Lien mis à jour",
        message: "Le lien a été mis à jour avec succès",
      },
      not_updated: {
        title: "Lien non mis à jour",
        message: "Le lien n’a pas pu être mis à jour",
      },
      removed: {
        title: "Lien supprimé",
        message: "Le lien a été supprimé avec succès",
      },
      not_removed: {
        title: "Lien non supprimé",
        message: "Le lien n’a pas pu être supprimé",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "Guide de démarrage rapide",
      not_right_now: "Pas maintenant",
      create_project: {
        title: "Créer un projet",
        description: "La plupart des choses commencent par un projet dans Plane.",
        cta: "Commencer",
      },
      invite_team: {
        title: "Inviter votre équipe",
        description: "Construisez, déployez et travaillez avec vos collègues.",
        cta: "Les faire entrer",
      },
      configure_workspace: {
        title: "Configurez votre espace de travail.",
        description: "Activez ou désactivez des fonctionnalités ou allez plus loin.",
        cta: "Configurer cet espace de travail",
      },
      personalize_account: {
        title: "Faites de Plane le vôtre.",
        description: "Choisissez votre photo, vos couleurs et plus encore.",
        cta: "Personnaliser maintenant",
      },
      widgets: {
        title: "C'est calme sans widgets, activez-les",
        description: `Il semble que tous vos widgets soient désactivés. Activez-les
maintenant pour améliorer votre expérience !`,
        primary_button: {
          text: "Gérer les widgets",
        },
      },
    },
    quick_links: {
      empty: "Enregistrez des liens vers des éléments de travail que vous souhaitez avoir à portée de main.",
      add: "Ajouter un lien rapide",
      title: "Lien rapide",
      title_plural: "Liens rapides",
    },
    recents: {
      title: "Récents",
      empty: {
        project: "Vos projets récents apparaîtront ici une fois que vous en aurez visité un.",
        page: "Vos pages récentes apparaîtront ici une fois que vous en aurez visité une.",
        issue: "Vos éléments de travail récents apparaîtront ici une fois que vous en aurez visité un.",
        default: "Vous n’avez pas encore d’éléments récents.",
      },
      filters: {
        all: "Tous",
        projects: "Projets",
        pages: "Pages",
        issues: "Éléments de travail",
      },
    },
    new_at_plane: {
      title: "Nouveau sur Plane",
    },
    quick_tutorial: {
      title: "Tutoriel rapide",
    },
    widget: {
      reordered_successfully: "Widget réorganisé avec succès.",
      reordering_failed: "Une erreur s’est produite lors de la réorganisation du widget.",
    },
    manage_widgets: "Gérer les widgets",
    title: "Accueil",
    star_us_on_github: "Donnez-nous une étoile sur GitHub",
    business_trial_banner: {
      title: "Votre essai de 14 jours du plan Business est actif !",
      description:
        "Explorez toutes les fonctionnalités Business. Quand vous êtes prêt, choisissez de vous abonner. Vous ne serez pas facturé automatiquement.",
      trial_ends_today: "L'essai se termine aujourd'hui",
      trial_ends_in_days: "L'essai se termine dans {days, plural, one {# jour} other {# jours}}",
      start_subscription: "Démarrer l'abonnement",
      explore_business_features: "Explorer les fonctionnalités Business",
    },
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "L’URL n’est pas valide",
        placeholder: "Tapez ou collez une URL",
      },
      title: {
        text: "Titre d’affichage",
        placeholder: "Comment ce lien sera présenté",
      },
    },
  },
  common: {
    all: "Tout",
    no_items_in_this_group: "Aucun élément dans ce groupe",
    drop_here_to_move: "Déposer ici pour déplacer",
    states: "États",
    state: "État",
    state_groups: "Groupes d’états",
    state_group: "Groupe d’état",
    priorities: "Priorités",
    priority: "Priorité",
    team_project: "Projet d’équipe",
    project: "Projet",
    cycle: "Cycle",
    cycles: "Cycles",
    module: "Module",
    modules: "Modules",
    labels: "Étiquettes",
    label: "Étiquette",
    assignees: "Acteurs",
    assignee: "Acteur",
    created_by: "Créé par",
    none: "Aucun",
    link: "Lien",
    estimates: "Estimations",
    estimate: "Estimation",
    created_at: "Créé le",
    updated_at: "Mis à jour le",
    completed_at: "Terminé le",
    layout: "Disposition",
    filters: "Filtres",
    display: "Affichage",
    load_more: "Charger plus",
    activity: "Activité",
    analytics: "Analyses",
    dates: "Dates",
    success: "Succès !",
    something_went_wrong: "Quelque chose s’est mal passé",
    error: {
      label: "Erreur !",
      message: "Une erreur s’est produite. Veuillez réessayer.",
    },
    group_by: "Grouper par",
    epic: "Epic",
    epics: "Epics",
    work_item: "Élément de travail",
    work_items: "Éléments de travail",
    sub_work_item: "Sous-élément de travail",
    add: "Ajouter",
    warning: "Avertissement",
    updating: "Mise à jour",
    adding: "Ajout",
    update: "Mettre à jour",
    creating: "Création",
    create: "Créer",
    cancel: "Annuler",
    description: "Description",
    title: "Titre",
    attachment: "Pièce jointe",
    general: "Général",
    features: "Fonctionnalités",
    automation: "Automatisation",
    project_name: "Nom du projet",
    project_id: "ID du projet",
    project_timezone: "Fuseau horaire du projet",
    created_on: "Créé le",
    update_project: "Mettre à jour le projet",
    identifier_already_exists: "L’identifiant existe déjà",
    add_more: "Ajouter plus",
    defaults: "Par défaut",
    add_label: "Ajouter une étiquette",
    customize_time_range: "Personnaliser la plage de temps",
    loading: "Chargement",
    attachments: "Pièces jointes",
    property: "Propriété",
    properties: "Propriétés",
    parent: "Parent",
    page: "Pâge",
    remove: "Supprimer",
    archiving: "Archivage",
    archive: "Archiver",
    access: {
      public: "Public",
      private: "Privé",
    },
    done: "Terminé",
    sub_work_items: "Sous-éléments de travail",
    comment: "Commentaire",
    workspace_level: "Niveau espace de travail",
    order_by: {
      label: "Trier par",
      manual: "Manuel",
      last_created: "Dernier créé",
      last_updated: "Dernière mise à jour",
      start_date: "Date de début",
      due_date: "Date d’échéance",
      asc: "Croissant",
      desc: "Décroissant",
      updated_on: "Mis à jour le",
    },
    sort: {
      asc: "Croissant",
      desc: "Décroissant",
      created_on: "Créé le",
      updated_on: "Mis à jour le",
    },
    comments: "Commentaires",
    updates: "Mises à jour",
    additional_updates: "Mises à jour supplémentaires",
    clear_all: "Tout effacer",
    copied: "Copié !",
    link_copied: "Lien copié !",
    link_copied_to_clipboard: "Lien copié dans le presse-papiers",
    copied_to_clipboard: "Lien de l’élément de travail copié dans le presse-papiers",
    branch_name_copied_to_clipboard: "Nom de la branche copié dans le presse-papiers",
    is_copied_to_clipboard: "L’élément de travail est copié dans le presse-papiers",
    no_links_added_yet: "Aucun lien ajouté pour l’instant",
    add_link: "Ajouter un lien",
    links: "Liens",
    go_to_workspace: "Aller à l’espace de travail",
    progress: "Progression",
    optional: "Optionnel",
    join: "Rejoindre",
    go_back: "Retour",
    continue: "Continuer",
    resend: "Renvoyer",
    relations: "Relations",
    errors: {
      default: {
        title: "Erreur !",
        message: "Quelque chose s’est mal passé. Veuillez réessayer.",
      },
      required: "Ce champ est obligatoire",
      entity_required: "{entity} est requis",
      restricted_entity: "{entity} est restreint",
    },
    update_link: "Mettre à jour le lien",
    attach: "Joindre",
    create_new: "Créer nouveau",
    add_existing: "Ajouter existant",
    type_or_paste_a_url: "Tapez ou collez une URL",
    url_is_invalid: "L’URL n’est pas valide",
    display_title: "Titre d’affichage",
    link_title_placeholder: "Comment ce lien sera présenté",
    url: "URL",
    side_peek: "Aperçu latéral",
    modal: "Modal",
    full_screen: "Plein écran",
    close_peek_view: "Fermer l’aperçu",
    toggle_peek_view_layout: "Basculer la disposition de l’aperçu",
    options: "Options",
    duration: "Durée",
    today: "Aujourd’hui",
    week: "Semaine",
    month: "Mois",
    quarter: "Trimestre",
    press_for_commands: "Appuyez sur '/' pour les commandes",
    click_to_add_description: "Cliquez pour ajouter une description",
    search: {
      label: "Rechercher",
      placeholder: "Tapez pour rechercher",
      no_matches_found: "Aucune correspondance trouvée",
      no_matching_results: "Aucun résultat correspondant",
    },
    actions: {
      edit: "Modifier",
      make_a_copy: "Faire une copie",
      open_in_new_tab: "Ouvrir dans un nouvel onglet",
      copy_link: "Copier le lien",
      copy_branch_name: "Copier le nom de la branche",
      archive: "Archiver",
      delete: "Supprimer",
      remove_relation: "Supprimer la relation",
      subscribe: "S’abonner",
      unsubscribe: "Se désabonner",
      clear_sorting: "Effacer le tri",
      show_weekends: "Afficher les week-ends",
      enable: "Activer",
      disable: "Désactiver",
    },
    name: "Nom",
    discard: "Abandonner",
    confirm: "Confirmer",
    confirming: "Confirmation",
    read_the_docs: "Lire la documentation",
    default: "Par défaut",
    active: "Actif",
    enabled: "Activé",
    disabled: "Désactivé",
    mandate: "Mandat",
    mandatory: "Obligatoire",
    yes: "Oui",
    no: "Non",
    please_wait: "Veuillez patienter",
    enabling: "Activation",
    disabling: "Désactivation",
    beta: "Bêta",
    or: "ou",
    next: "Suivant",
    back: "Retour",
    cancelling: "Annulation",
    configuring: "Configuration",
    clear: "Effacer",
    import: "Importer",
    connect: "Connecter",
    authorizing: "Autorisation",
    processing: "Traitement",
    no_data_available: "Aucune donnée disponible",
    from: "de {name}",
    authenticated: "Authentifié",
    select: "Sélectionner",
    upgrade: "Mettre à niveau",
    add_seats: "Ajouter des sièges",
    projects: "Projets",
    workspace: "Espace de travail",
    workspaces: "Espaces de travail",
    team: "Équipe",
    teams: "Équipes",
    entity: "Entité",
    entities: "Entités",
    task: "Tâche",
    tasks: "Tâches",
    section: "Section",
    sections: "Sections",
    edit: "Modifier",
    connecting: "Connexion",
    connected: "Connecté",
    disconnect: "Déconnecter",
    disconnecting: "Déconnexion",
    installing: "Installation",
    install: "Installer",
    reset: "Réinitialiser",
    live: "En direct",
    change_history: "Historique des modifications",
    coming_soon: "À venir",
    member: "Membre",
    members: "Membres",
    you: "Vous",
    upgrade_cta: {
      higher_subscription: "Passer à un abonnement plus élevé",
      talk_to_sales: "Contacter le service commercial",
    },
    category: "Catégorie",
    categories: "Catégories",
    saving: "Enregistrement",
    save_changes: "Enregistrer les modifications",
    delete: "Supprimer",
    deleting: "Suppression",
    pending: "En attente",
    invite: "Inviter",
    view: "Afficher",
    deactivated_user: "Utilisateur désactivé",
    apply: "Appliquer",
    applying: "Application",
    users: "Utilisateurs",
    admins: "Administrateurs",
    guests: "Invités",
    on_track: "Sur la bonne voie",
    off_track: "Hors de la bonne voie",
    at_risk: "À risque",
    timeline: "Chronologie",
    completion: "Achèvement",
    upcoming: "À venir",
    completed: "Terminé",
    in_progress: "En cours",
    planned: "Planifié",
    paused: "En pause",
    no_of: "Nº de {entity}",
    resolved: "Résolu",
    worklogs: "Journaux de travail",
    project_updates: "Mises à jour du projet",
    overview: "Vue d'ensemble",
    workflows: "Flux de travail",
    members_and_teamspaces: "Membres et espaces de travail",
    open_in_full_screen: "Ouvrir {page} en plein écran",
  },
  chart: {
    x_axis: "Axe X",
    y_axis: "Axe Y",
    metric: "Métrique",
  },
  form: {
    title: {
      required: "Le titre est requis",
      max_length: "Le titre doit contenir moins de {length} caractères",
    },
  },
  entity: {
    grouping_title: "Regroupement {entity}",
    priority: "Priorité {entity}",
    all: "Tous les {entity}",
    drop_here_to_move: "Déposez ici pour déplacer le {entity}",
    delete: {
      label: "Supprimer {entity}",
      success: "{entity} supprimé avec succès",
      failed: "Échec de la suppression de {entity}",
    },
    update: {
      failed: "Échec de la mise à jour de {entity}",
      success: "{entity} mis à jour avec succès",
    },
    link_copied_to_clipboard: "Lien {entity} copié dans le presse-papiers",
    fetch: {
      failed: "Erreur lors de la récupération de {entity}",
    },
    add: {
      success: "{entity} ajouté avec succès",
      failed: "Erreur lors de l’ajout de {entity}",
    },
    remove: {
      success: "{entity} supprimé avec succès",
      failed: "Erreur lors de la suppression de {entity}",
    },
  },
  epic: {
    all: "Tous les Epics",
    label: "{count, plural, one {Epic} other {Epics}}",
    new: "Nouvel Epic",
    adding: "Ajout d’un epic",
    create: {
      success: "Epic créé avec succès",
    },
    add: {
      press_enter: "Appuyez sur 'Entrée' pour ajouter un autre epic",
      label: "Ajouter un Epic",
    },
    title: {
      label: "Titre de l’Epic",
      required: "Le titre de l’Epic est requis.",
    },
    archive: {
      description: `Seuls les epics terminés ou annulés
peuvent être archivés`,
      label: "Archiver l'Epic",
      confirm_message:
        "Êtes-vous sûr de vouloir archiver l'epic ? Tous vos epics archivés pourront être restaurés plus tard.",
      success: {
        label: "Archivage réussi",
        message: "Vos archives se trouvent dans les archives du projet.",
      },
      failed: {
        message: "L'epic n'a pas pu être archivé. Veuillez réessayer.",
      },
    },
  },
  issue: {
    label: "{count, plural, one {Élément de travail} other {Éléments de travail}}",
    all: "Tous les éléments de travail",
    edit: "Modifier l’élément de travail",
    title: {
      label: "Titre de l’élément de travail",
      required: "Le titre de l’élément de travail est requis.",
    },
    add: {
      press_enter: "Appuyez sur 'Entrée' pour ajouter un autre élément de travail",
      label: "Ajouter un élément de travail",
      cycle: {
        failed: "L’élément de travail n’a pas pu être ajouté au cycle. Veuillez réessayer.",
        success:
          "{count, plural, one {Élément de travail} other {Éléments de travail}} ajouté(s) au cycle avec succès.",
        loading: "Ajout de {count, plural, one {l’élément de travail} other {éléments de travail}} au cycle",
      },
      assignee: "Ajouter des assignés",
      start_date: "Ajouter une date de début",
      due_date: "Ajouter une date d’échéance",
      parent: "Ajouter un élément de travail parent",
      sub_issue: "Ajouter un sous-élément de travail",
      relation: "Ajouter une relation",
      link: "Ajouter un lien",
      existing: "Ajouter un élément de travail existant",
    },
    remove: {
      label: "Supprimer l’élément de travail",
      cycle: {
        loading: "Suppression de l’élément de travail du cycle",
        success: "Élément de travail supprimé du cycle avec succès.",
        failed: "L’élément de travail n’a pas pu être supprimé du cycle. Veuillez réessayer.",
      },
      module: {
        loading: "Suppression de l’élément de travail du module",
        success: "Élément de travail supprimé du module avec succès.",
        failed: "L’élément de travail n’a pas pu être supprimé du module. Veuillez réessayer.",
      },
      parent: {
        label: "Supprimer l’élément de travail parent",
      },
    },
    new: "Nouvel élément de travail",
    adding: "Ajout d’un élément de travail",
    create: {
      success: "Élément de travail créé avec succès",
    },
    priority: {
      urgent: "Urgent",
      high: "Haute",
      medium: "Moyenne",
      low: "Basse",
    },
    display: {
      properties: {
        label: "Propriétés d’affichage",
        id: "ID",
        issue_type: "Type d’élément de travail",
        sub_issue_count: "Nombre de sous-éléments",
        attachment_count: "Nombre de pièces jointes",
        created_on: "Créé le",
        sub_issue: "Sous-élément de travail",
        work_item_count: "Nombre d’éléments de travail",
      },
      extra: {
        show_sub_issues: "Afficher les sous-éléments",
        show_empty_groups: "Afficher les groupes vides",
      },
    },
    layouts: {
      ordered_by_label: "Cette disposition est triée par",
      list: "Liste",
      kanban: "Tableau",
      calendar: "Calendrier",
      spreadsheet: "Tableau",
      gantt: "Chronologie",
      title: {
        list: "Disposition en liste",
        kanban: "Disposition en tableau",
        calendar: "Disposition en calendrier",
        spreadsheet: "Disposition en tableau",
        gantt: "Disposition en chronologie",
      },
    },
    states: {
      active: "Actif",
      backlog: "Backlog",
    },
    comments: {
      placeholder: "Ajouter un commentaire",
      switch: {
        private: "Passer en commentaire privé",
        public: "Passer en commentaire public",
      },
      create: {
        success: "Commentaire créé avec succès",
        error: "Échec de la création du commentaire. Veuillez réessayer plus tard.",
      },
      update: {
        success: "Commentaire mis à jour avec succès",
        error: "Échec de la mise à jour du commentaire. Veuillez réessayer plus tard.",
      },
      remove: {
        success: "Commentaire supprimé avec succès",
        error: "Échec de la suppression du commentaire. Veuillez réessayer plus tard.",
      },
      upload: {
        error: "Échec du téléchargement du fichier. Veuillez réessayer plus tard.",
      },
      copy_link: {
        success: "Lien du commentaire copié dans le presse-papiers",
        error: "Erreur lors de la copie du lien du commentaire. Veuillez réessayer plus tard.",
      },
    },
    empty_state: {
      issue_detail: {
        title: "L’élément de travail n’existe pas",
        description: "L’élément de travail que vous recherchez n’existe pas, a été archivé ou a été supprimé.",
        primary_button: {
          text: "Voir les autres éléments de travail",
        },
      },
    },
    sibling: {
      label: "Éléments de travail frères",
    },
    archive: {
      description: `Seuls les éléments de travail
terminés ou annulés peuvent être archivés`,
      label: "Archiver l’élément de travail",
      confirm_message:
        "Êtes-vous sûr de vouloir archiver l’élément de travail ? Tous vos éléments archivés peuvent être restaurés ultérieurement.",
      success: {
        label: "Archivage réussi",
        message: "Vos archives se trouvent dans les archives du projet.",
      },
      failed: {
        message: "L’élément de travail n’a pas pu être archivé. Veuillez réessayer.",
      },
    },
    restore: {
      success: {
        title: "Restauration réussie",
        message: "Votre élément de travail se trouve dans les éléments de travail du projet.",
      },
      failed: {
        message: "L’élément de travail n’a pas pu être restauré. Veuillez réessayer.",
      },
    },
    relation: {
      relates_to: "En relation avec",
      duplicate: "Doublon de",
      blocked_by: "Bloqué par",
      blocking: "Bloque",
      start_before: "Commence avant",
      start_after: "Commence après",
      finish_before: "Se termine avant",
      finish_after: "Se termine après",
      implements: "Implémente",
      implemented_by: "Implémenté par",
    },
    copy_link: "Copier le lien de l’élément de travail",
    delete: {
      label: "Supprimer l’élément de travail",
      error: "Erreur lors de la suppression de l’élément de travail",
    },
    subscription: {
      actions: {
        subscribed: "Abonnement à l’élément de travail réussi",
        unsubscribed: "Désabonnement de l’élément de travail réussi",
      },
    },
    select: {
      error: "Veuillez sélectionner au moins un élément de travail",
      empty: "Aucun élément de travail sélectionné",
      add_selected: "Ajouter les éléments de travail sélectionnés",
      select_all: "Sélectionner tout",
      deselect_all: "Tout désélectionner",
    },
    open_in_full_screen: "Ouvrir l’élément de travail en plein écran",
    vote: {
      click_to_upvote: "Cliquez pour voter pour",
      click_to_downvote: "Cliquez pour voter contre",
      click_to_view_upvotes: "Cliquez pour voir les votes pour",
      click_to_view_downvotes: "Cliquez pour voir les votes contre",
    },
  },
  attachment: {
    error: "Le fichier n’a pas pu être joint. Essayez de le télécharger à nouveau.",
    only_one_file_allowed: "Un seul fichier peut être téléchargé à la fois.",
    file_size_limit: "Le fichier doit faire {size}MB ou moins.",
    drag_and_drop: "Glissez-déposez n’importe où pour uploader",
    delete: "Supprimer la pièce jointe",
  },
  label: {
    select: "Sélectionner une étiquette",
    create: {
      success: "Étiquette créée avec succès",
      failed: "Échec de la création de l’étiquette",
      already_exists: "L’étiquette existe déjà",
      type: "Tapez pour ajouter une nouvelle étiquette",
    },
  },
  sub_work_item: {
    update: {
      success: "Sous-élément de travail mis à jour avec succès",
      error: "Erreur lors de la mise à jour du sous-élément de travail",
    },
    remove: {
      success: "Sous-élément de travail supprimé avec succès",
      error: "Erreur lors de la suppression du sous-élément de travail",
    },
    empty_state: {
      sub_list_filters: {
        title: "Vous n’avez pas de sous-éléments de travail qui correspondent aux filtres que vous avez appliqués.",
        description: "Pour voir tous les sous-éléments de travail, effacer tous les filtres appliqués.",
        action: "Effacer les filtres",
      },
      list_filters: {
        title: "Vous n’avez pas d’éléments de travail qui correspondent aux filtres que vous avez appliqués.",
        description: "Pour voir tous les éléments de travail, effacer tous les filtres appliqués.",
        action: "Effacer les filtres",
      },
    },
  },
  view: {
    label: "{count, plural, one {Vue} other {Vues}}",
    create: {
      label: "Créer une vue",
    },
    update: {
      label: "Mettre à jour la vue",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "En attente",
        description: "En attente",
      },
      declined: {
        title: "Refusé",
        description: "Refusé",
      },
      snoozed: {
        title: "Reporté",
        description: "{days, plural, one{# jour} other{# jours}} restant(s)",
      },
      accepted: {
        title: "Accepté",
        description: "Accepté",
      },
      duplicate: {
        title: "Doublon",
        description: "Doublon",
      },
    },
    modals: {
      decline: {
        title: "Refuser l’élément de travail",
        content: "Êtes-vous sûr de vouloir refuser l’élément de travail {value} ?",
      },
      delete: {
        title: "Supprimer l’élément de travail",
        content: "Êtes-vous sûr de vouloir supprimer l’élément de travail {value} ?",
        success: "Élément de travail supprimé avec succès",
      },
    },
    errors: {
      snooze_permission:
        "Seuls les administrateurs du projet peuvent reporter/annuler le report des éléments de travail",
      accept_permission: "Seuls les administrateurs du projet peuvent accepter les éléments de travail",
      decline_permission: "Seuls les administrateurs du projet peuvent refuser les éléments de travail",
    },
    actions: {
      accept: "Accepter",
      decline: "Refuser",
      snooze: "Reporter",
      unsnooze: "Annuler le report",
      copy: "Copier le lien de l’élément de travail",
      delete: "Supprimer",
      open: "Ouvrir l’élément de travail",
      mark_as_duplicate: "Marquer comme doublon",
      move: "Déplacer {value} vers les éléments de travail du projet",
    },
    source: {
      "in-app": "in-app",
    },
    order_by: {
      created_at: "Créé le",
      updated_at: "Mis à jour le",
      id: "ID",
    },
    label: "Intake",
    page_label: "{workspace} - Intake",
    modal: {
      title: "Créer un élément de travail Intake",
    },
    tabs: {
      open: "Ouvert",
      closed: "Fermé",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "Aucun élément de travail ouvert",
        description: "Trouvez les éléments de travail ouverts ici. Créez un nouvel élément de travail.",
      },
      sidebar_closed_tab: {
        title: "Aucun élément de travail fermé",
        description: "Tous les éléments de travail, qu’ils soient acceptés ou refusés, peuvent être trouvés ici.",
      },
      sidebar_filter: {
        title: "Aucun élément de travail correspondant",
        description:
          "Aucun élément de travail ne correspond au filtre appliqué dans Intake. Créez un nouvel élément de travail.",
      },
      detail: {
        title: "Sélectionnez un élément de travail pour voir ses détails.",
      },
    },
  },
  workspace_creation: {
    heading: "Créez votre espace de travail",
    subheading: "Pour commencer à utiliser Plane, vous devez créer ou rejoindre un espace de travail.",
    form: {
      name: {
        label: "Nommez votre espace de travail",
        placeholder: "Quelque chose de familier et reconnaissable est toujours préférable.",
      },
      url: {
        label: "Définissez l’URL de votre espace de travail",
        placeholder: "Tapez ou collez une URL",
        edit_slug: "Vous ne pouvez modifier que le slug de l’URL",
      },
      organization_size: {
        label: "Combien de personnes utiliseront cet espace de travail ?",
        placeholder: "Sélectionnez une plage",
      },
    },
    errors: {
      creation_disabled: {
        title: "Seul l’administrateur de votre instance peut créer des espaces de travail",
        description:
          "Si vous connaissez l’adresse e-mail de votre administrateur d’instance, cliquez sur le bouton ci-dessous pour le contacter.",
        request_button: "Contacter l’administrateur d’instance",
      },
      validation: {
        name_alphanumeric:
          "Les noms d’espaces de travail ne peuvent contenir que (' '), ('-'), ('_') et des caractères alphanumériques.",
        name_length: "Limitez votre nom à 80 caractères.",
        url_alphanumeric: "Les URL ne peuvent contenir que ('-') et des caractères alphanumériques.",
        url_length: "Limitez votre URL à 48 caractères.",
        url_already_taken: "L’URL de l’espace de travail est déjà prise !",
      },
    },
    request_email: {
      subject: "Demande d’un nouvel espace de travail",
      body: `Bonjour administrateur(s) d’instance,

Veuillez créer un nouvel espace de travail avec l’URL [/workspace-name] pour [objectif de création de l'espace de travail].

Merci,
{firstName} {lastName}
{email}`,
    },
    button: {
      default: "Créer l’espace de travail",
      loading: "Création de l’espace de travail",
    },
    toast: {
      success: {
        title: "Succès",
        message: "Espace de travail créé avec succès",
      },
      error: {
        title: "Erreur",
        message: "L’espace de travail n’a pas pu être créé. Veuillez réessayer.",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "Aperçu de vos projets, activités et métriques",
        description:
          "Bienvenue sur Plane, nous sommes ravis de vous avoir parmi nous. Créez votre premier projet et suivez vos éléments de travail, et cette page se transformera en un espace qui vous aide à progresser. Les administrateurs verront également les éléments qui aident leur équipe à progresser.",
        primary_button: {
          text: "Construisez votre premier projet",
          comic: {
            title: "Tout commence par un projet dans Plane",
            description:
              "Un projet peut être la feuille de route d’un produit, une campagne marketing ou le lancement d’une nouvelle voiture.",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "Analytique",
    page_label: "{workspace} - Analytique",
    open_tasks: "Total des tâches ouvertes",
    error: "Une erreur s’est produite lors de la récupération des données.",
    work_items_closed_in: "Éléments de travail fermés dans",
    selected_projects: "Projets sélectionnés",
    total_members: "Total des membres",
    total_cycles: "Total des Cycles",
    total_modules: "Total des Modules",
    pending_work_items: {
      title: "Éléments de travail en attente",
      empty_state: "L’analyse des éléments de travail en attente par acteur apparaît ici.",
    },
    work_items_closed_in_a_year: {
      title: "Éléments de travail fermés dans l’année",
      empty_state: "Fermez des éléments de travail pour voir leur analyse sous forme de graphique.",
    },
    most_work_items_created: {
      title: "Plus d’éléments de travail créés",
      empty_state: "Les acteurs et le nombre d’éléments de travail créés par eux apparaissent ici.",
    },
    most_work_items_closed: {
      title: "Plus d’éléments de travail fermés",
      empty_state: "Les acteurs et le nombre d’éléments de travail fermés par eux apparaissent ici.",
    },
    tabs: {
      scope_and_demand: "Scope et Demande",
      custom: "Analytique Personnalisée",
    },
    empty_state: {
      customized_insights: {
        description: "Les éléments de travail qui vous sont assignés, répartis par état, s’afficheront ici.",
        title: "Pas encore de données",
      },
      created_vs_resolved: {
        description: "Les éléments de travail créés et résolus au fil du temps s’afficheront ici.",
        title: "Pas encore de données",
      },
      project_insights: {
        title: "Pas encore de données",
        description: "Les éléments de travail qui vous sont assignés, répartis par état, s’afficheront ici.",
      },
      general: {
        title:
          "Suivez les progrès, les charges de travail et les affectations. Identifiez les tendances, levez les blocages et travaillez plus rapidement",
        description:
          "Surveillez le scope par rapport à la demande, suivez les estimations et les éventuels glissements de périmètre. Assurez-vous que les membres de votre équipe et vos équipes sont performants, et veillez à ce que votre projet avance dans les délais impartis.",
        primary_button: {
          text: "Commencez votre premier projet",
          comic: {
            title: "L’analytics fonctionne mieux avec les Cycles + Modules",
            description:
              "D’abord, encadrez vos éléments de travail dans des Cycles et, si possible, regroupez les éléments qui s’étendent sur plus d’un cycle dans des Modules. Consultez les deux dans la navigation de gauche.",
          },
        },
      },
      cycle_progress: {
        title: "Pas encore de données",
        description:
          "Les analyses de progression du cycle apparaîtront ici. Ajoutez des éléments de travail aux cycles pour commencer à suivre la progression.",
      },
      module_progress: {
        title: "Pas encore de données",
        description:
          "Les analyses de progression du module apparaîtront ici. Ajoutez des éléments de travail aux modules pour commencer à suivre la progression.",
      },
      intake_trends: {
        title: "Pas encore de données",
        description:
          "Les analyses des tendances d'entrée apparaîtront ici. Ajoutez des éléments de travail à l'entrée pour commencer à suivre les tendances.",
      },
    },
    created_vs_resolved: "Créé vs Résolu",
    customized_insights: "Informations personnalisées",
    backlog_work_items: "{entity} en backlog",
    active_projects: "Projets actifs",
    trend_on_charts: "Tendance sur les graphiques",
    all_projects: "Tous les projets",
    summary_of_projects: "Résumé des projets",
    project_insights: "Aperçus du projet",
    started_work_items: "{entity} commencés",
    total_work_items: "Total des {entity}",
    total_projects: "Total des projets",
    total_admins: "Total des administrateurs",
    total_users: "Nombre total d’utilisateurs",
    total_intake: "Revenu total",
    un_started_work_items: "{entity} non commencés",
    total_guests: "Nombre total d’invités",
    completed_work_items: "{entity} terminés",
    total: "Total des {entity}",
    projects_by_status: "Projets par statut",
    active_users: "Utilisateurs actifs",
    intake_trends: "Tendances des admissions",
    workitem_resolved_vs_pending: "Éléments de travail résolus vs en attente",
    upgrade_to_plan: "Passez à {plan} pour débloquer {tab}",
  },
  workspace_projects: {
    label: "{count, plural, one {Projet} other {Projets}}",
    create: {
      label: "Ajouter un Projet",
    },
    network: {
      private: {
        title: "Privé",
        description: "Accessible uniquement sur invitation",
      },
      public: {
        title: "Public",
        description: "Accessible à tous dans l’espace de travail, sauf les invités",
      },
    },
    error: {
      permission: "Vous n’avez pas la permission d’effectuer cette action.",
      cycle_delete: "Échec de la suppression du cycle",
      module_delete: "Échec de la suppression du module",
      issue_delete: "Échec de la suppression de l’élément de travail",
    },
    state: {
      backlog: "Backlog",
      unstarted: "Non commencé",
      started: "Commencé",
      completed: "Terminé",
      cancelled: "Annulé",
    },
    sort: {
      manual: "Manuel",
      name: "Nom",
      created_at: "Date de création",
      members_length: "Nombre de membres",
    },
    scope: {
      my_projects: "Mes projets",
      archived_projects: "Archivés",
    },
    common: {
      months_count: "{months, plural, one{# mois} other{# mois}}",
      days_count: "{days, plural, one{# jour} other{# jours}}",
    },
    empty_state: {
      general: {
        title: "Aucun projet actif",
        description:
          "Considérez chaque projet comme le parent d’activités axées sur les objectifs. Les projets regroupent les tâches, les cycles et les modules et, avec l'aide de vos collègues, vous aident à atteindre ces objectifs. Créez un nouveau projet ou filtrez les projets archivés.",
        primary_button: {
          text: "Commencez votre premier projet",
          comic: {
            title: "Tout commence par un projet dans Plane",
            description:
              "Un projet peut être la feuille de route d’un produit, une campagne marketing ou le lancement d’une nouvelle voiture.",
          },
        },
      },
      no_projects: {
        title: "Aucun projet",
        description:
          "Pour créer des éléments de travail ou gérer votre travail, vous devez créer un projet ou faire partie d’un projet.",
        primary_button: {
          text: "Commencez votre premier projet",
          comic: {
            title: "Tout commence par un projet dans Plane",
            description:
              "Un projet peut être la feuille de route d’un produit, une campagne marketing ou le lancement d’une nouvelle voiture.",
          },
        },
      },
      filter: {
        title: "Aucun projet correspondant",
        description: `Aucun projet détecté avec les critères correspondants.
 Créez plutôt un nouveau projet.`,
      },
      search: {
        description: `Aucun projet détecté avec les critères correspondants.
Créez plutôt un nouveau projet`,
      },
    },
  },
  workspace_views: {
    add_view: "Ajouter une vue",
    empty_state: {
      "all-issues": {
        title: "Aucun élément de travail dans le projet",
        description:
          "Premier projet terminé ! Maintenant, découpez votre travail en tâches gérables à l’aide d’éléments de travail. C’est parti !",
        primary_button: {
          text: "Créer un nouvel élément de travail",
        },
      },
      assigned: {
        title: "Aucun élément de travail pour le moment",
        description: "Les éléments de travail qui vous sont assignés peuvent être suivis ici.",
        primary_button: {
          text: "Créer un nouvel élément de travail",
        },
      },
      created: {
        title: "Aucun élément de travail pour le moment",
        description: "Tous les éléments de travail que vous créez arrivent ici, suivez-les directement ici.",
        primary_button: {
          text: "Créer un nouvel élément de travail",
        },
      },
      subscribed: {
        title: "Aucun élément de travail pour le moment",
        description: "Abonnez-vous aux éléments de travail qui vous intéressent, suivez-les tous ici.",
      },
      "custom-view": {
        title: "Aucun élément de travail pour le moment",
        description: "Les éléments de travail qui correspondent aux filtres, suivez-les tous ici.",
      },
    },
    delete_view: {
      title: "Êtes-vous sûr de vouloir supprimer cette vue ?",
      content:
        "Si vous confirmez, toutes les options de tri, de filtrage et d’affichage et la mise en page que vous avez choisie pour cette vue seront définitivement supprimées sans possibilité de les restaurer.",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "Changer d’adresse e-mail",
        description: "Saisissez une nouvelle adresse e-mail pour recevoir un lien de vérification.",
        toasts: {
          success_title: "Succès !",
          success_message: "Adresse e-mail mise à jour. Veuillez vous reconnecter.",
        },
        form: {
          email: {
            label: "Nouvelle adresse e-mail",
            placeholder: "Saisissez votre e-mail",
            errors: {
              required: "L’e-mail est requis",
              invalid: "L’e-mail est invalide",
              exists: "Cette adresse e-mail existe déjà. Utilisez-en une autre.",
              validation_failed: "Échec de la validation de l’e-mail. Veuillez réessayer.",
            },
          },
          code: {
            label: "Code unique",
            placeholder: "123456",
            helper_text: "Code de vérification envoyé à votre nouvel e-mail.",
            errors: {
              required: "Le code unique est requis",
              invalid: "Code de vérification invalide. Veuillez réessayer.",
            },
          },
        },
        actions: {
          continue: "Continuer",
          confirm: "Confirmer",
          cancel: "Annuler",
        },
        states: {
          sending: "Envoi…",
        },
      },
    },
    notifications: {
      select_default_view: "Sélectionner la vue par défaut",
      compact: "Compact",
      full: "Plein écran",
    },
  },
  workspace_settings: {
    label: "Paramètres de l’espace de travail",
    page_label: "{workspace} - Paramètres généraux",
    key_created: "Clé créée",
    copy_key:
      "Copiez et sauvegardez cette clé secrète dans Plane Pages. Vous ne pourrez plus voir cette clé après avoir cliqué sur Fermer. Un fichier CSV contenant la clé a été téléchargé.",
    token_copied: "Jeton copié dans le presse-papiers.",
    settings: {
      general: {
        title: "Général",
        upload_logo: "Télécharger le logo",
        edit_logo: "Modifier le logo",
        name: "Nom de l’espace de travail",
        company_size: "Taille de l’entreprise",
        url: "URL de l’espace de travail",
        workspace_timezone: "Fuseau horaire de l’espace de travail",
        update_workspace: "Mettre à jour l’espace de travail",
        delete_workspace: "Supprimer cet espace de travail",
        delete_workspace_description:
          "Lors de la suppression d’un espace de travail, toutes les données et ressources au sein de cet espace seront définitivement supprimées et ne pourront pas être récupérées.",
        delete_btn: "Supprimer cet espace de travail",
        delete_modal: {
          title: "Êtes-vous sûr de vouloir supprimer cet espace de travail ?",
          description:
            "Vous avez un essai actif sur l’un de nos forfaits payants. Veuillez d’abord l’annuler pour continuer.",
          dismiss: "Fermer",
          cancel: "Annuler l’essai",
          success_title: "Espace de travail supprimé.",
          success_message: "Vous serez bientôt redirigé vers votre page de profil.",
          error_title: "Cela n’a pas fonctionné.",
          error_message: "Veuillez réessayer.",
        },
        errors: {
          name: {
            required: "Le nom est requis",
            max_length: "Le nom de l’espace de travail ne doit pas dépasser 80 caractères",
          },
          company_size: {
            required: "La taille de l’entreprise est requise",
            select_a_range: "Sélectionner la taille de l’organisation",
          },
        },
      },
      members: {
        title: "Membres",
        add_member: "Ajouter un membre",
        pending_invites: "Invitations en attente",
        invitations_sent_successfully: "Invitations envoyées avec succès",
        leave_confirmation:
          "Êtes-vous sûr de vouloir quitter l’espace de travail ? Vous n’aurez plus accès à cet espace de travail. Cette action ne peut pas être annulée.",
        details: {
          full_name: "Nom complet",
          display_name: "Nom d’affichage",
          email_address: "Adresse e-mail",
          account_type: "Type de compte",
          authentication: "Authentification",
          joining_date: "Date d’adhésion",
        },
        modal: {
          title: "Inviter des personnes à collaborer",
          description: "Invitez des personnes à collaborer sur votre espace de travail.",
          button: "Envoyer les invitations",
          button_loading: "Envoi des invitations",
          placeholder: "nom@entreprise.com",
          errors: {
            required: "Nous avons besoin d’une adresse e-mail pour les inviter.",
            invalid: "L’e-mail est invalide",
          },
        },
      },
      billing_and_plans: {
        title: "Facturation & Plans",
        current_plan: "Plan actuel",
        free_plan: "Vous utilisez actuellement le plan gratuit",
        view_plans: "Voir les plans",
      },
      exports: {
        title: "Exportations",
        exporting: "Exportation",
        previous_exports: "Exportations précédentes",
        export_separate_files: "Exporter les données dans des fichiers séparés",
        filters_info: "Appliquez des filtres pour exporter des éléments de travail spécifiques selon vos critères.",
        modal: {
          title: "Exporter vers",
          toasts: {
            success: {
              title: "Exportation réussie",
              message: "Vous pourrez télécharger les {entity} exportés depuis l’exportation précédente.",
            },
            error: {
              title: "Échec de l’exportation",
              message: "L’exportation a échoué. Veuillez réessayer.",
            },
          },
        },
      },
      webhooks: {
        title: "Webhooks",
        add_webhook: "Ajouter un webhook",
        modal: {
          title: "Créer un webhook",
          details: "Détails du webhook",
          payload: "URL de la charge utile",
          question: "Quels événements souhaitez-vous déclencher avec ce webhook ?",
          error: "L’URL est requise",
        },
        secret_key: {
          title: "Clé secrète",
          message: "Générer un jeton pour signer la charge utile du webhook",
        },
        options: {
          all: "Envoyez-moi tout",
          individual: "Sélectionner des événements individuels",
        },
        toasts: {
          created: {
            title: "Webhook créé",
            message: "Le webhook a été créé avec succès",
          },
          not_created: {
            title: "Webhook non créé",
            message: "Le webhook n’a pas pu être créé",
          },
          updated: {
            title: "Webhook mis à jour",
            message: "Le webhook a été mis à jour avec succès",
          },
          not_updated: {
            title: "Webhook non mis à jour",
            message: "Le webhook n’a pas pu être mis à jour",
          },
          removed: {
            title: "Webhook supprimé",
            message: "Le webhook a été supprimé avec succès",
          },
          not_removed: {
            title: "Webhook non supprimé",
            message: "Le webhook n’a pas pu être supprimé",
          },
          secret_key_copied: {
            message: "Clé secrète copiée dans le presse-papiers.",
          },
          secret_key_not_copied: {
            message: "Une erreur s’est produite lors de la copie de la clé secrète.",
          },
        },
      },
      api_tokens: {
        heading: "Jetons API",
        description:
          "Générez des jetons API sécurisés pour intégrer vos données avec des systèmes et applications externes.",
        title: "Jetons API",
        add_token: "Ajouter un jeton d'accès",
        create_token: "Créer un jeton",
        never_expires: "N’expire jamais",
        generate_token: "Générer un jeton",
        generating: "Génération",
        delete: {
          title: "Supprimer le jeton API",
          description:
            "Toute application utilisant ce jeton n’aura plus accès aux données de Plane. Cette action ne peut pas être annulée.",
          success: {
            title: "Succès !",
            message: "Le jeton API a été supprimé avec succès",
          },
          error: {
            title: "Erreur !",
            message: "Le jeton API n’a pas pu être supprimé",
          },
        },
      },
      integrations: {
        title: "Intégrations",
        page_title: "Travaillez avec vos données Plane dans les applications disponibles ou dans les vôtres.",
        page_description: "Affichez toutes les intégrations utilisées par cet espace de travail ou par vous.",
      },
      imports: {
        title: "Importations",
      },
      worklogs: {
        title: "Journaux de travail",
      },
      group_syncing: {
        title: "Synchronisation des groupes",
        heading: "Synchronisation des groupes",
        description:
          "Associez les groupes du fournisseur d'identité aux projets et rôles. L'accès des utilisateurs est mis à jour automatiquement lorsque l'appartenance au groupe change dans votre IdP, simplifiant l'intégration et le départ.",
        enable: {
          title: "Activer la synchronisation des groupes",
          description:
            "Ajoutez automatiquement les utilisateurs aux projets en fonction des groupes du fournisseur d'identité.",
        },
        config: {
          title: "Configurer la synchronisation des groupes",
          description:
            "Configurez la façon dont les groupes du fournisseur d'identité sont mappés aux projets et rôles.",
          sync_on_login: {
            title: "Synchronisation à la connexion",
            description:
              "Mettez à jour l'appartenance au groupe et l'accès au projet lorsqu'un utilisateur se connecte.",
          },
          sync_offline: {
            title: "Synchronisation hors ligne",
            description:
              "Exécute la synchronisation toutes les six heures automatiquement, sans attendre que les utilisateurs se connectent.",
          },
          auto_remove: {
            title: "Suppression automatique",
            description:
              "Supprimez automatiquement les utilisateurs des projets lorsqu'ils ne correspondent plus au groupe.",
          },
          group_attribute_key: {
            title: "Clé d'attribut de groupe",
            description:
              "L'attribut du fournisseur d'identité utilisé pour identifier et synchroniser les groupes d'utilisateurs.",
            placeholder: "Groupes",
          },
        },
        group_mapping: {
          title: "Correspondance des groupes",
          description: "Associez les groupes du fournisseur d'identité aux projets et rôles.",
          button_text: "Ajouter une nouvelle synchronisation de groupe",
        },
        toast: {
          updating: "Mise à jour de la fonction de synchronisation des groupes",
          success: "Fonction de synchronisation des groupes mise à jour avec succès.",
          error: "Échec de la mise à jour de la fonction de synchronisation des groupes !",
        },
        delete_modal: {
          title: "Supprimer la synchronisation de groupe",
          content:
            "Les nouveaux utilisateurs de ce groupe d'identité ne seront plus ajoutés au projet. Les utilisateurs déjà ajoutés conserveront leur rôle actuel.",
        },
        modal: {
          idp_group_name: {
            text: "Groupe d'utilisateurs",
            required: "Le groupe d'utilisateurs est requis",
            placeholder: "Saisissez les noms des groupes IdP",
          },
          project: {
            text: "Projet",
            required: "Le projet est requis",
            placeholder: "Sélectionnez un projet",
          },
          default_role: {
            text: "Rôle du projet",
            required: "Le rôle du projet est requis",
            placeholder: "Sélectionnez un rôle du projet",
          },
        },
      },
      identity: {
        title: "Identité",
        heading: "Identité",
        description: "Configurez votre domaine et activez l'authentification unique",
      },
      project_states: {
        title: "États du projet",
      },
      projects: {
        title: "Projets",
        description: "Gérer les états des projets, activer les étiquettes de projets et autres configurations.",
        tabs: {
          states: "États du projet",
          labels: "Étiquettes du projet",
        },
      },
      teamspaces: {
        title: "Espaces d'équipe",
      },
      initiatives: {
        title: "Initiatives",
      },
      customers: {
        title: "Clients",
      },
      releases: {
        title: "Livraisons",
        update_release: "Mettre à jour la livraison",
        create_release: "Créer une livraison",
        errors: {
          release_not_found: "La livraison que vous recherchez n'existe pas.",
          unknown: "Une erreur s'est produite. Veuillez réessayer.",
        },
      },

      cancel_trial: {
        title: "Annulez d'abord votre période d'essai.",
        description:
          "Vous avez une période d'essai active sur l'un de nos forfaits payants. Veuillez d'abord l'annuler pour continuer.",
        dismiss: "Fermer",
        cancel: "Annuler l'essai",
        cancel_success_title: "Période d'essai annulée.",
        cancel_success_message: "Vous pouvez maintenant supprimer l'espace de travail.",
        cancel_error_title: "Ça n'a pas fonctionné.",
        cancel_error_message: "Veuillez réessayer.",
      },
      applications: {
        title: "Applications",
        applicationId_copied: "ID application copié dans le presse-papiers",
        clientId_copied: "ID client copié dans le presse-papiers",
        clientSecret_copied: "Secret client copié dans le presse-papiers",
        third_party_apps: "Applications tierces",
        your_apps: "Vos applications",
        connect: "Connecter",
        connected: "Connecté",
        install: "Installer",
        installed: "Installé",
        configure: "Configurer",
        app_available:
          "Vous avez rendu cette application disponible pour une utilisation avec un espace de travail Plane",
        app_available_description: "Connectez un espace de travail Plane pour commencer à l'utiliser",
        client_id_and_secret: "ID Client et Secret",
        client_id_and_secret_description:
          "Copiez et sauvegardez cette clé secrète. Vous ne pourrez plus voir cette clé après avoir cliqué sur Fermer.",
        client_id_and_secret_download: "Vous pouvez télécharger un CSV avec la clé ici.",
        application_id: "ID Application",
        client_id: "ID Client",
        client_secret: "Secret Client",
        export_as_csv: "Exporter en CSV",
        slug_already_exists: "Le slug existe déjà",
        failed_to_create_application: "Échec de la création de l'application",
        upload_logo: "Télécharger le logo",
        app_name_title: "Comment allez-vous appeler cette application",
        app_name_error: "Le nom de l'application est requis",
        app_short_description_title: "Donnez une courte description à cette application",
        app_short_description_error: "La description courte de l'application est requise",
        app_description_title: {
          label: "Description longue",
          placeholder:
            "Rédigez une longue description pour la place de marché. Appuyez sur '/' pour afficher les commandes.",
        },
        authorization_grant_type: {
          title: "Type de connexion",
          description:
            "Choisissez si votre application doit être installée une fois pour l'espace de travail ou permettre à chaque utilisateur de connecter son propre compte",
        },
        app_description_error: "La description de l'application est requise",
        app_slug_title: "Slug de l'application",
        app_slug_error: "Le slug de l'application est requis",
        app_maker_title: "Créateur de l'application",
        app_maker_error: "Le créateur de l'application est requis",
        webhook_url_title: "URL du Webhook",
        webhook_url_error: "L'URL du webhook est requise",
        invalid_webhook_url_error: "URL du webhook invalide",
        redirect_uris_title: "URIs de redirection",
        redirect_uris_error: "Les URIs de redirection sont requises",
        invalid_redirect_uris_error: "URIs de redirection invalides",
        redirect_uris_description:
          "Entrez les URIs séparées par des espaces où l'application redirigera après l'utilisateur, par exemple https://example.com https://example.com/",
        authorized_javascript_origins_title: "Origines Javascript autorisées",
        authorized_javascript_origins_error: "Les origines Javascript autorisées sont requises",
        invalid_authorized_javascript_origins_error: "Origines Javascript autorisées invalides",
        authorized_javascript_origins_description:
          "Entrez les origines séparées par des espaces où l'application sera autorisée à faire des requêtes, par exemple app.com example.com",
        create_app: "Créer l'application",
        update_app: "Mettre à jour l'application",
        build_your_own_app: "Construisez votre propre application",
        edit_app_details: "Modifier les détails de l'application",
        regenerate_client_secret_description:
          "Régénérer le secret client. Si vous régénérez le secret, vous pourrez copier la clé ou la télécharger dans un fichier CSV juste après.",
        regenerate_client_secret: "Régénérer le secret client",
        regenerate_client_secret_confirm_title: "Êtes-vous sûr de vouloir régénérer le secret client ?",
        regenerate_client_secret_confirm_description:
          "L'application utilisant ce secret cessera de fonctionner. Vous devrez mettre à jour le secret dans l'application.",
        regenerate_client_secret_confirm_cancel: "Annuler",
        regenerate_client_secret_confirm_regenerate: "Régénérer",
        read_only_access_to_workspace: "Accès en lecture seule à votre espace de travail",
        write_access_to_workspace: "Accès en écriture à votre espace de travail",
        read_only_access_to_user_profile: "Accès en lecture seule à votre profil utilisateur",
        write_access_to_user_profile: "Accès en écriture à votre profil utilisateur",
        connect_app_to_workspace: "Connecter {app} à votre espace de travail {workspace}",
        user_permissions: "Permissions utilisateur",
        user_permissions_description:
          "Les permissions utilisateur sont utilisées pour accorder l'accès au profil de l'utilisateur.",
        workspace_permissions: "Permissions de l'espace de travail",
        workspace_permissions_description:
          "Les permissions de l'espace de travail sont utilisées pour accorder l'accès à l'espace de travail.",
        with_the_permissions: "avec les permissions",
        app_consent_title: "{app} demande l'accès à votre espace de travail et profil Plane.",
        choose_workspace_to_connect_app_with: "Choisissez un espace de travail auquel connecter l'application",
        app_consent_workspace_permissions_title: "{app} souhaite",
        app_consent_user_permissions_title:
          "{app} peut également demander la permission d'un utilisateur pour les ressources suivantes. Ces permissions seront demandées et autorisées uniquement par un utilisateur.",
        app_consent_accept_title: "En acceptant, vous",
        app_consent_accept_1:
          "Accordez à l'application l'accès à vos données Plane partout où vous pouvez utiliser l'application dans ou en dehors de Plane",
        app_consent_accept_2: "Acceptez la politique de confidentialité et les conditions d'utilisation de {app}",
        accepting: "Acceptation en cours...",
        accept: "Accepter",
        categories: "Catégories",
        select_app_categories: "Sélectionner les catégories de l'application",
        categories_title: "Catégories",
        categories_error: "Les catégories sont requises",
        invalid_categories_error: "Catégories invalides",
        categories_description: "Sélectionnez les catégories qui décrivent le mieux l'application",
        supported_plans: "Plans Pris en Charge",
        supported_plans_description:
          "Sélectionnez les plans d'espace de travail qui peuvent installer cette application. Laissez vide pour autoriser tous les plans.",
        select_plans: "Sélectionner les Plans",
        privacy_policy_url_title: "URL de la politique de confidentialité",
        privacy_policy_url_error: "La URL de la politique de confidentialité est requise",
        invalid_privacy_policy_url_error: "URL de la politique de confidentialité invalide",
        terms_of_service_url_title: "URL des conditions d'utilisation",
        terms_of_service_url_error: "Les conditions d'utilisation sont requises",
        invalid_terms_of_service_url_error: "URL des conditions d'utilisation invalide",
        support_url_title: "URL de support",
        support_url_error: "Le support est requis",
        invalid_support_url_error: "URL de support invalide",
        video_url_title: "URL de la vidéo",
        video_url_error: "La URL de la vidéo est requise",
        invalid_video_url_error: "URL de la vidéo invalide",
        setup_url_title: "URL de configuration",
        setup_url_error: "La URL de configuration est requise",
        invalid_setup_url_error: "URL de configuration invalide",
        configuration_url_title: "URL de configuration",
        configuration_url_error: "La URL de configuration est requise",
        invalid_configuration_url_error: "URL de configuration invalide",
        contact_email_title: "Email de contact",
        contact_email_error: "L'email de contact est requis",
        invalid_contact_email_error: "Email de contact invalide",
        upload_attachments: "Télécharger des pièces jointes",
        uploading_images: "Téléchargement de {count} Image{count, plural, one {s} other {s}}",
        drop_images_here: "Glisser-déposer les images ici",
        click_to_upload_images: "Cliquer pour télécharger les images",
        invalid_file_or_exceeds_size_limit: "Fichier invalide ou dépasse la limite de taille ({size} MB)",
        uploading: "Téléchargement...",
        upload_and_save: "Télécharger et enregistrer",
        app_credentials_regenrated: {
          title: "Les identifiants de l'application ont été régénérés avec succès",
          description: "Remplacez le secret client partout où il est utilisé. L'ancien secret n'est plus valide.",
        },
        app_created: {
          title: "Application créée avec succès",
          description: "Utilisez les identifiants pour installer l'application dans un espace de travail Plane",
        },
        installed_apps: "Applications installées",
        all_apps: "Toutes les applications",
        internal_apps: "Applications internes",
        website: {
          title: "Site web",
          description: "Lien vers le site web de votre application.",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "Créateur d'applications",
          description: "La personne ou l'organisation qui crée l'application.",
        },
        setup_url: {
          label: "URL de configuration",
          description: "Les utilisateurs seront redirigés vers cette URL lorsqu'ils installeront l'application.",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "URL du webhook",
          description:
            "C'est ici que nous enverrons les événements et mises à jour webhook depuis les espaces de travail où votre application est installée.",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "URI de redirection (séparés par des espaces)",
          description: "Les utilisateurs seront redirigés vers ce chemin après s'être authentifiés avec Plane.",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "Cette application ne peut être installée qu'après qu'un administrateur de l'espace de travail l'ait installée. Contactez l'administrateur de votre espace de travail pour continuer.",
        enable_app_mentions: "Activer les mentions de l'application",
        enable_app_mentions_tooltip:
          "Lorsque cela est activé, les utilisateurs peuvent mentionner ou attribuer des éléments de travail à cette application.",
        scopes: "Périmètres",
        select_scopes: "Sélectionner les périmètres",
        read_access_to: "Accès en lecture seule à",
        write_access_to: "Accès en écriture à",
        global_permission_expiration:
          "Les périmètres globaux expirent bientôt. Utilisez des périmètres granulaires à la place. Par exemple, utilisez project:read au lieu d'une lecture globale.",
        selected_scopes: "{count} sélectionné(s)",
        scopes_and_permissions: "Périmètres et autorisations",
        read: "Lecture",
        write: "Écriture",
        scope_description: {
          projects: "Accès aux projets et à toutes les entités liées aux projets",
          wiki: "Accès au wiki et à toutes les entités liées au wiki",
          customers: "Accès aux clients et à toutes les entités liées aux clients",
          initiatives: "Accès aux initiatives et à toutes les entités liées aux initiatives",
          workspaces: "Accès aux espaces de travail et à toutes les entités liées",
          stickies: "Accès aux stickies et à toutes les entités liées",
          teamspaces: "Accès aux espaces d'équipe et à toutes les entités liées",
          profile: "Accès aux informations du profil utilisateur",
          agents: "Accès aux agents et à toutes les entités liées aux agents",
          assets: "Accès aux actifs et à toutes les entités liées aux actifs",
        },
        internal: "Interne",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description:
          "Voir votre travail devenir plus intelligent et plus rapide avec l'IA qui est connectée de manière native à votre travail et à votre base de connaissances.",
      },
    },
    empty_state: {
      api_tokens: {
        title: "Aucun jeton API créé",
        description:
          "Les API Plane peuvent être utilisées pour intégrer vos données dans Plane avec n’importe quel système externe. Créez un jeton pour commencer.",
      },
      webhooks: {
        title: "Aucun webhook ajouté",
        description: "Créez des webhooks pour recevoir des mises à jour en temps réel et automatiser des actions.",
      },
      exports: {
        title: "Aucune exportation pour le moment",
        description: "Chaque fois que vous exportez, vous aurez également une copie ici pour référence.",
      },
      imports: {
        title: "Aucune importation pour le moment",
        description: "Trouvez toutes vos importations précédentes ici et téléchargez-les.",
      },
    },
  },
  profile: {
    label: "Profil",
    page_label: "Votre travail",
    work: "Travail",
    details: {
      joined_on: "Inscrit le",
      time_zone: "Fuseau horaire",
    },
    stats: {
      workload: "Charge de travail",
      overview: "Vue d’ensemble",
      created: "Éléments de travail créés",
      assigned: "Éléments de travail assignés",
      subscribed: "Éléments de travail suivis",
      state_distribution: {
        title: "Éléments de travail par état",
        empty:
          "Créez des éléments de travail pour les visualiser par état dans le graphique pour une meilleure analyse.",
      },
      priority_distribution: {
        title: "Éléments de travail par priorité",
        empty:
          "Créez des éléments de travail pour les visualiser par priorité dans le graphique pour une meilleure analyse.",
      },
      recent_activity: {
        title: "Activité récente",
        empty: "Nous n’avons pas trouvé de données. Veuillez consulter vos contributions",
        button: "Télécharger l'activité du jour",
        button_loading: "Téléchargement",
      },
    },
    actions: {
      profile: "Profil",
      security: "Sécurité",
      activity: "Activité",
      appearance: "Apparence",
      notifications: "Notifications",
      connections: "Connexions",
    },
    tabs: {
      summary: "Résumé",
      assigned: "Assigné",
      created: "Créé",
      subscribed: "Suivi",
      activity: "Activité",
    },
    empty_state: {
      activity: {
        title: "Aucune activité pour le moment",
        description:
          "Commencez par créer un nouvel élément de travail ! Ajoutez-y des détails et des propriétés. Explorez davantage Plane pour voir votre activité.",
      },
      assigned: {
        title: "Aucun élément de travail ne vous est assigné",
        description: "Les éléments de travail qui vous sont assignés peuvent être suivis ici.",
      },
      created: {
        title: "Aucun élément de travail pour le moment",
        description: "Tous les éléments de travail que vous créez apparaissent ici, suivez-les directement ici.",
      },
      subscribed: {
        title: "Aucun élément de travail pour le moment",
        description: "Abonnez-vous aux éléments de travail qui vous intéressent, suivez-les tous ici.",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "Saisissez l’ID du projet",
      please_select_a_timezone: "Veuillez sélectionner un fuseau horaire",
      archive_project: {
        title: "Archiver le projet",
        description:
          "L'archivage d’un projet le retirera de votre navigation latérale, bien que vous pourrez toujours y accéder depuis votre page de projets. Vous pouvez restaurer le projet ou le supprimer quand vous le souhaitez.",
        button: "Archiver le projet",
      },
      delete_project: {
        title: "Supprimer le projet",
        description:
          "Lors de la suppression d’un projet, toutes les données et ressources de ce projet seront définitivement supprimées et ne pourront pas être récupérées.",
        button: "Supprimer mon projet",
      },
      toast: {
        success: "Projet mis à jour avec succès",
        error: "Le projet n’a pas pu être mis à jour. Veuillez réessayer.",
      },
    },
    members: {
      label: "Membres",
      project_lead: "Chef de projet",
      default_assignee: "Acteur par défaut",
      guest_super_permissions: {
        title: "Accorder l’accès en lecture à tous les éléments de travail pour les utilisateurs invités :",
        sub_heading: "Cela permettra aux invités d’avoir un accès en lecture à tous les éléments de travail du projet.",
      },
      invite_members: {
        title: "Inviter des membres",
        sub_heading: "Invitez des membres à travailler sur votre projet.",
        select_co_worker: "Sélectionner un acteur",
      },
      project_lead_description: "Sélectionnez le responsable du projet.",
      default_assignee_description: "Sélectionnez l’attributaire par défaut du projet.",
      project_subscribers: "Abonnés du projet",
      project_subscribers_description: "Sélectionnez les membres qui recevront des notifications pour ce projet.",
    },
    states: {
      describe_this_state_for_your_members: "Décrivez cet état pour vos membres.",
      empty_state: {
        title: "Aucun état disponible pour le groupe {groupKey}",
        description: "Veuillez créer un nouvel état",
      },
    },
    labels: {
      label_title: "Titre de l’étiquette",
      label_title_is_required: "Le titre de l’étiquette est requis",
      label_max_char: "Le nom de l’étiquette ne doit pas dépasser 255 caractères",
      toast: {
        error: "Erreur lors de la mise à jour de l’étiquette",
      },
    },
    estimates: {
      label: "Estimations",
      title: "Activer les estimations pour mon projet",
      description: "Elles vous aident à communiquer la complexité et la charge de travail de l’équipe.",
      no_estimate: "Sans estimation",
      new: "Nouveau système d’estimation",
      create: {
        custom: "Personnalisé",
        start_from_scratch: "Commencer depuis zéro",
        choose_template: "Choisir un modèle",
        choose_estimate_system: "Choisir un système d’estimation",
        enter_estimate_point: "Saisir une estimation",
        step: "Étape {step} de {total}",
        label: "Créer une estimation",
      },
      toasts: {
        created: {
          success: {
            title: "Estimation créée",
            message: "L’estimation a été créée avec succès",
          },
          error: {
            title: "Échec de la création de l’estimation",
            message: "Nous n’avons pas pu créer la nouvelle estimation, veuillez réessayer.",
          },
        },
        updated: {
          success: {
            title: "Estimation modifiée",
            message: "L’estimation a été mise à jour dans votre projet.",
          },
          error: {
            title: "Échec de la modification de l’estimation",
            message: "Nous n’avons pas pu modifier l’estimation, veuillez réessayer",
          },
        },
        enabled: {
          success: {
            title: "Succès !",
            message: "Les estimations ont été activées.",
          },
        },
        disabled: {
          success: {
            title: "Succès !",
            message: "Les estimations ont été désactivées.",
          },
          error: {
            title: "Erreur !",
            message: "L’estimation n’a pas pu être désactivée. Veuillez réessayer",
          },
        },
        reorder: {
          success: {
            title: "Estimations réorganisées",
            message: "Les estimations ont été réorganisées dans votre projet.",
          },
          error: {
            title: "Échec de la réorganisation des estimations",
            message: "Nous n'avons pas pu réorganiser les estimations, veuillez réessayer",
          },
        },
      },
      validation: {
        min_length: "L’estimation doit être supérieure à 0.",
        unable_to_process: "Nous ne pouvons pas traiter votre demande, veuillez réessayer.",
        numeric: "L’estimation doit être une valeur numérique.",
        character: "L’estimation doit être une valeur de caractère.",
        empty: "La valeur de l’estimation ne peut pas être vide.",
        already_exists: "La valeur de l’estimation existe déjà.",
        unsaved_changes:
          "Vous avez des modifications non enregistrées. Veuillez les enregistrer avant de cliquer sur Terminé",
        remove_empty:
          "L’estimation ne peut pas être vide. Saisissez une valeur dans chaque champ ou supprimez ceux pour lesquels vous n’avez pas de valeurs.",
        fill: "Veuillez remplir ce champ d'estimation",
        repeat: "La valeur d'estimation ne peut pas être répétée",
      },
      systems: {
        points: {
          label: "Points",
          fibonacci: "Fibonacci",
          linear: "Linéaire",
          squares: "Carrés",
          custom: "Personnalisé",
        },
        categories: {
          label: "Catégories",
          t_shirt_sizes: "Tailles de T-Shirt",
          easy_to_hard: "Facile à difficile",
          custom: "Personnalisé",
        },
        time: {
          label: "Temps",
          hours: "Heures",
        },
      },
      edit: {
        title: "Modifier le système d'estimation",
        add_or_update: {
          title: "Ajouter, mettre à jour ou supprimer des estimations",
          description: "Gérer le système actuel en ajoutant, mettant à jour ou supprimant les points ou catégories.",
        },
        switch: {
          title: "Changer le type d'estimation",
          description: "Convertir votre système de points en système de catégories et vice versa.",
        },
      },
      switch: "Changer de système d'estimation",
      current: "Système d'estimation actuel",
      select: "Sélectionner un système d'estimation",
    },
    automations: {
      label: "Automatisations",
      "auto-archive": {
        title: "Archiver automatiquement les éléments de travail fermés",
        description: "Plane archivera automatiquement les éléments de travail qui ont été complétés ou annulés.",
        duration: "Archiver automatiquement les éléments de travail fermés depuis",
      },
      "auto-close": {
        title: "Fermer automatiquement les éléments de travail",
        description: "Plane fermera automatiquement les éléments de travail qui n’ont pas été complétés ou annulés.",
        duration: "Fermer automatiquement les éléments de travail inactifs depuis",
        auto_close_status: "Statut de fermeture automatique",
      },
      "auto-remind": {
        title: "Rappels automatiques",
        description:
          "Plane enverra automatiquement des rappels via e-mail et notifications dans l'application pour garder votre équipe sur le bon chemin des délais.",
        duration: "Envoyer un rappel avant",
      },
    },
    empty_state: {
      labels: {
        title: "Pas encore d’étiquettes",
        description: "Créez des étiquettes pour organiser et filtrer les éléments de travail dans votre projet.",
      },
      estimates: {
        title: "Pas encore de systèmes d’estimation",
        description: "Créez un ensemble d’estimations pour communiquer le volume de travail par élément de travail.",
        primary_button: "Ajouter un système d’estimation",
      },
      integrations: {
        title: "Aucune intégration configurée",
        description: "Configurez GitHub et d'autres intégrations pour synchroniser vos éléments de travail du projet.",
      },
    },
    initiatives: {
      heading: "Initiatives",
      sub_heading: "Débloquez le plus haut niveau d'organisation pour tout votre travail dans Plane",
      title: "Activer les initiatives",
      description: "Définissez des objectifs plus importants pour suivre les progrès",
      toast: {
        updating: "Mise à jour de la fonctionnalité des initiatives",
        enable_success: "Fonctionnalité des initiatives activée avec succès.",
        disable_success: "Fonctionnalité des initiatives désactivée avec succès.",
        error: "Échec de la mise à jour de la fonctionnalité des initiatives !",
      },
    },
    customers: {
      heading: "Clients",
      settings_heading: "Gérez le travail en fonction de ce qui est important pour vos clients.",
      settings_sub_heading:
        "Transformez les demandes des clients en éléments de travail, attribuez une priorité en fonction des demandes et associez les états des éléments de travail aux enregistrements des clients. Bientôt, vous pourrez intégrer votre CRM ou outil de support pour une meilleure gestion du travail selon les attributs des clients.",
    },
    epics: {
      properties: {
        title: "Propriétés",
        description: "Ajoutez des propriétés personnalisées à votre épique.",
      },
      disabled: "Désactivé",
    },
    cycles: {
      auto_schedule: {
        heading: "Planification automatique des cycles",
        description: "Maintenez les cycles en mouvement sans configuration manuelle.",
        tooltip: "Créez automatiquement de nouveaux cycles selon votre planning choisi.",
        edit_button: "Modifier",
        form: {
          cycle_title: {
            label: "Titre du cycle",
            placeholder: "Titre",
            tooltip:
              "Le titre sera complété par des numéros pour les cycles suivants. Par exemple : Conception - 1/2/3",
            validation: {
              required: "Le titre du cycle est requis",
              max_length: "Le titre ne doit pas dépasser 255 caractères",
            },
          },
          cycle_duration: {
            label: "Durée du cycle",
            unit: "Semaines",
            validation: {
              required: "La durée du cycle est requise",
              min: "La durée du cycle doit être d'au moins 1 semaine",
              max: "La durée du cycle ne peut pas dépasser 30 semaines",
              positive: "La durée du cycle doit être positive",
            },
          },
          cooldown_period: {
            label: "Période de refroidissement",
            unit: "jours",
            tooltip: "Pause entre les cycles avant le début du suivant.",
            validation: {
              required: "La période de refroidissement est requise",
              negative: "La période de refroidissement ne peut pas être négative",
            },
          },
          start_date: {
            label: "Jour de début du cycle",
            validation: {
              required: "La date de début est requise",
              past: "La date de début ne peut pas être dans le passé",
            },
          },
          number_of_cycles: {
            label: "Nombre de cycles futurs",
            validation: {
              required: "Le nombre de cycles est requis",
              min: "Au moins 1 cycle est requis",
              max: "Impossible de planifier plus de 3 cycles",
            },
          },
          auto_rollover: {
            label: "Report automatique des éléments de travail",
            tooltip:
              "Le jour où un cycle se termine, déplacer tous les éléments de travail non terminés vers le cycle suivant.",
          },
        },
        toast: {
          toggle: {
            loading_enable: "Activation de la planification automatique des cycles",
            loading_disable: "Désactivation de la planification automatique des cycles",
            success: {
              title: "Succès !",
              message: "Planification automatique des cycles activée avec succès.",
            },
            error: {
              title: "Erreur !",
              message: "Échec de l'activation de la planification automatique des cycles.",
            },
          },
          save: {
            loading: "Enregistrement de la configuration de planification automatique des cycles",
            success: {
              title: "Succès !",
              message_create: "Configuration de planification automatique des cycles enregistrée avec succès.",
              message_update: "Configuration de planification automatique des cycles mise à jour avec succès.",
            },
            error: {
              title: "Erreur !",
              message_create: "Échec de l'enregistrement de la configuration de planification automatique des cycles.",
              message_update: "Échec de la mise à jour de la configuration de planification automatique des cycles.",
            },
          },
        },
      },
    },
    features: {
      cycles: {
        title: "Cycles",
        short_title: "Cycles",
        description:
          "Planifiez le travail dans des périodes flexibles qui s'adaptent au rythme et au tempo uniques de ce projet.",
        toggle_title: "Activer les cycles",
        toggle_description: "Planifiez le travail dans des périodes ciblées.",
      },
      modules: {
        title: "Modules",
        short_title: "Modules",
        description: "Organisez le travail en sous-projets avec des chefs de projet et des responsables dédiés.",
        toggle_title: "Activer les modules",
        toggle_description: "Les membres du projet pourront créer et modifier des modules.",
      },
      views: {
        title: "Vues",
        short_title: "Vues",
        description:
          "Enregistrez des tris, des filtres et des options d'affichage personnalisés ou partagez-les avec votre équipe.",
        toggle_title: "Activer les vues",
        toggle_description: "Les membres du projet pourront créer et modifier des vues.",
      },
      pages: {
        title: "Pages",
        short_title: "Pages",
        description: "Créez et modifiez du contenu libre : notes, documents, n'importe quoi.",
        toggle_title: "Activer les pages",
        toggle_description: "Les membres du projet pourront créer et modifier des pages.",
      },
      intake: {
        intake_responsibility: "Responsabilité d'ingestion",
        intake_sources: "Sources d'ingestion",
        title: "Réception",
        short_title: "Réception",
        description:
          "Permettez aux non-membres de partager des bugs, des commentaires et des suggestions ; sans perturber votre flux de travail.",
        toggle_title: "Activer la réception",
        toggle_description: "Permettre aux membres du projet de créer des demandes de réception dans l'application.",
        toggle_tooltip_on: "Demandez à l'administrateur du projet de l'activer.",
        toggle_tooltip_off: "Demandez à l'administrateur du projet de le désactiver.",
        notify_assignee: {
          title: "Notifier les responsables",
          description:
            "Pour une nouvelle demande d'ingestion, les responsables par défaut seront alertés via des notifications",
        },
        in_app: {
          title: "Dans l'application",
          description:
            "Recevez de nouveaux éléments de travail des membres et invités de votre espace de travail sans perturber les existants.",
        },
        email: {
          title: "E-mail",
          description:
            "Collectez de nouveaux éléments de travail de toute personne envoyant un e-mail à une adresse Plane.",
          fieldName: "ID e-mail",
        },
        form: {
          title: "Formulaires",
          description:
            "Permettez aux personnes hors de votre espace de travail de créer des éléments de travail potentiels via un formulaire dédié et sécurisé.",
          fieldName: "URL du formulaire par défaut",
          create_forms: "Créer des formulaires à l'aide des types d'éléments de travail",
          manage_forms: "Gérer les formulaires",
          manage_forms_tooltip: "Demandez à l'administrateur de l'espace de travail de gérer cela.",
          create_form: "Créer un formulaire",
          edit_form: "Modifier les détails du formulaire",
          form_title: "Titre du formulaire",
          form_title_required: "Le titre du formulaire est requis",
          work_item_type: "Type d'élément de travail",
          remove_property: "Supprimer la propriété",
          select_properties: "Sélectionner les propriétés",
          search_placeholder: "Rechercher des propriétés",
          toasts: {
            success_create: "Formulaire d'ingestion créé avec succès",
            success_update: "Formulaire d'ingestion mis à jour avec succès",
            error_create: "Échec de la création du formulaire d'ingestion",
            error_update: "Échec de la mise à jour du formulaire d'ingestion",
          },
        },
        toasts: {
          set: {
            loading: "Définition des responsables...",
            success: {
              title: "Succès !",
              message: "Responsables définis avec succès.",
            },
            error: {
              title: "Erreur !",
              message: "Une erreur s'est produite lors de la définition des responsables. Veuillez réessayer.",
            },
          },
        },
      },
      time_tracking: {
        title: "Suivi du temps",
        short_title: "Suivi du temps",
        description: "Enregistrez le temps passé sur les éléments de travail et les projets.",
        toggle_title: "Activer le suivi du temps",
        toggle_description: "Les membres du projet pourront enregistrer le temps travaillé.",
      },
      milestones: {
        title: "Jalons",
        short_title: "Jalons",
        description:
          "Les jalons fournissent une couche pour aligner les éléments de travail vers des dates d'achèvement partagées.",
        toggle_title: "Activer les jalons",
        toggle_description: "Organisez les éléments de travail par échéances de jalons.",
      },
      toasts: {
        loading: "Mise à jour de la fonctionnalité du projet...",
        success: "Fonctionnalité du projet mise à jour avec succès.",
        error: "Une erreur s'est produite lors de la mise à jour de la fonctionnalité du projet. Veuillez réessayer.",
      },
    },
  },
  project_cycles: {
    add_cycle: "Ajouter un cycle",
    more_details: "Plus de détails",
    cycle: "Cycle",
    update_cycle: "Mettre à jour le cycle",
    create_cycle: "Créer un cycle",
    no_matching_cycles: "Aucun cycle correspondant",
    remove_filters_to_see_all_cycles: "Supprimez les filtres pour voir tous les cycles",
    remove_search_criteria_to_see_all_cycles: "Supprimez les critères de recherche pour voir tous les cycles",
    only_completed_cycles_can_be_archived: "Seuls les cycles terminés peuvent être archivés",
    start_date: "Date de début",
    end_date: "Date de fin",
    in_your_timezone: "Dans votre fuseau horaire",
    transfer_work_items: "Transférer {count} éléments de travail",
    transfer: {
      no_cycles_available: "Aucun autre cycle disponible pour transférer les éléments de travail.",
    },
    date_range: "Plage de dates",
    add_date: "Ajouter une date",
    active_cycle: {
      label: "Cycle actif",
      progress: "Progression",
      chart: "Graphique d’avancement",
      priority_issue: "Éléments de travail prioritaires",
      assignees: "Assignés",
      issue_burndown: "Graphique d’avancement des éléments",
      ideal: "Idéal",
      current: "Actuel",
      labels: "Étiquettes",
      trailing: "En retard",
      leading: "En avance",
    },
    upcoming_cycle: {
      label: "Cycle à venir",
    },
    completed_cycle: {
      label: "Cycle terminé",
    },
    status: {
      days_left: "Jours restants",
      completed: "Terminé",
      yet_to_start: "Pas encore commencé",
      in_progress: "En cours",
      draft: "Brouillon",
    },
    action: {
      restore: {
        title: "Restaurer le cycle",
        success: {
          title: "Cycle restauré",
          description: "Le cycle a été restauré.",
        },
        failed: {
          title: "Échec de la restauration du cycle",
          description: "Le cycle n’a pas pu être restauré. Veuillez réessayer.",
        },
      },
      favorite: {
        loading: "Ajout du cycle aux favoris",
        success: {
          description: "Cycle ajouté aux favoris.",
          title: "Succès !",
        },
        failed: {
          description: "Impossible d’ajouter le cycle aux favoris. Veuillez réessayer.",
          title: "Erreur !",
        },
      },
      unfavorite: {
        loading: "Suppression du cycle des favoris",
        success: {
          description: "Cycle retiré des favoris.",
          title: "Succès !",
        },
        failed: {
          description: "Impossible de retirer le cycle des favoris. Veuillez réessayer.",
          title: "Erreur !",
        },
      },
      update: {
        loading: "Mise à jour du cycle",
        success: {
          description: "Cycle mis à jour avec succès.",
          title: "Succès !",
        },
        failed: {
          description: "Erreur lors de la mise à jour du cycle. Veuillez réessayer.",
          title: "Erreur !",
        },
        error: {
          already_exists:
            "Vous avez déjà un cycle aux dates indiquées. Si vous souhaitez créer un cycle en brouillon, vous pouvez le faire en supprimant les deux dates.",
        },
      },
    },
    empty_state: {
      general: {
        title: "Regroupez et planifiez votre travail en Cycles.",
        description:
          "Découpez le travail en périodes définies, planifiez à rebours depuis la date limite de votre projet pour fixer les dates, et progressez concrètement en équipe.",
        primary_button: {
          text: "Définissez votre premier cycle",
          comic: {
            title: "Les cycles sont des périodes répétitives.",
            description:
              "Un sprint, une itération, ou tout autre terme que vous utilisez pour le suivi hebdomadaire ou bimensuel du travail est un cycle.",
          },
        },
      },
      no_issues: {
        title: "Aucun élément de travail ajouté au cycle",
        description: "Ajoutez ou créez des éléments de travail que vous souhaitez planifier et livrer dans ce cycle",
        primary_button: {
          text: "Créer un nouvel élément de travail",
        },
        secondary_button: {
          text: "Ajouter un élément existant",
        },
      },
      completed_no_issues: {
        title: "Aucun élément de travail dans le cycle",
        description:
          "Aucun élément de travail dans le cycle. Les éléments sont soit transférés soit masqués. Pour voir les éléments masqués s’il y en a, mettez à jour vos propriétés d’affichage en conséquence.",
      },
      active: {
        title: "Aucun cycle actif",
        description:
          "Un cycle actif inclut toute période qui englobe la date d’aujourd’hui dans sa plage. Trouvez ici la progression et les détails du cycle actif.",
      },
      archived: {
        title: "Aucun cycle archivé pour le moment",
        description: "Pour organiser votre projet, archivez les cycles terminés. Retrouvez-les ici une fois archivés.",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "Créez un élément de travail et assignez-le à quelqu’un, même à vous-même",
        description:
          "Pensez aux éléments de travail comme des tâches, du travail, ou des JTBD (Jobs To Be Done). Un élément de travail et ses sous-éléments sont généralement des actions temporelles assignées aux membres de votre équipe. Votre équipe crée, assigne et complète des éléments de travail pour faire progresser votre projet vers son objectif.",
        primary_button: {
          text: "Créez votre premier élément de travail",
          comic: {
            title: "Les éléments de travail sont les blocs de construction dans Plane.",
            description:
              "Refondre l’interface de Plane, Renouveler l’image de marque de l’entreprise, ou Lancer le nouveau système d’injection de carburant sont des exemples d’éléments de travail qui ont probablement des sous-éléments.",
          },
        },
      },
      no_archived_issues: {
        title: "Aucun élément de travail archivé pour le moment",
        description:
          "Manuellement ou par automatisation, vous pouvez archiver les éléments de travail terminés ou annulés. Retrouvez-les ici une fois archivés.",
        primary_button: {
          text: "Configurer l’automatisation",
        },
      },
      issues_empty_filter: {
        title: "Aucun élément de travail trouvé correspondant aux filtres appliqués",
        secondary_button: {
          text: "Effacer tous les filtres",
        },
      },
    },
  },
  project_module: {
    add_module: "Ajouter un module",
    update_module: "Mettre à jour le module",
    create_module: "Créer un module",
    archive_module: "Archiver le module",
    restore_module: "Restaurer le module",
    delete_module: "Supprimer le module",
    empty_state: {
      general: {
        title: "Associez vos jalons de projet aux Modules et suivez facilement le travail agrégé.",
        description:
          "Un groupe d’éléments de travail qui appartiennent à un parent logique et hiérarchique forme un module. Considérez-les comme un moyen de suivre le travail par étapes clés du projet. Ils ont leurs propres périodes et délais ainsi que des analyses pour vous aider à voir à quel point vous êtes proche ou pas d’atteindre une étape clé.",
        primary_button: {
          text: "Construisez votre premier module",
          comic: {
            title: "Les modules aident à regrouper le travail par étapes clés.",
            description:
              "Un module « panier », un module « châssis » et un module « entrepôt » sont tous de bons exemples de ce regroupement.",
          },
        },
      },
      no_issues: {
        title: "Aucun élément de travail dans le module",
        description: "Créez ou ajoutez des éléments de travail que vous souhaitez accomplir dans le cadre de ce module",
        primary_button: {
          text: "Créer de nouveaux éléments de travail",
        },
        secondary_button: {
          text: "Ajouter un élément existant",
        },
      },
      archived: {
        title: "Aucun module archivé pour le moment",
        description:
          "Pour organiser votre projet, archivez les modules terminés ou annulés. Retrouvez-les ici une fois archivés.",
      },
      sidebar: {
        in_active: "Ce module n’est pas encore actif.",
        invalid_date: "Date invalide. Veuillez entrer une date valide.",
      },
    },
    quick_actions: {
      archive_module: "Archiver le module",
      archive_module_description: `Seuls les modules terminés ou
annulés peuvent être archivés.`,
      delete_module: "Supprimer le module",
    },
    toast: {
      copy: {
        success: "Lien du module copié dans le presse-papiers",
      },
      delete: {
        success: "Module supprimé avec succès",
        error: "Échec de la suppression du module",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "Enregistrez des vues filtrées pour votre projet. Créez-en autant que nécessaire",
        description:
          "Les vues sont un ensemble de filtres enregistrés que vous utilisez fréquemment ou auxquels vous souhaitez avoir un accès facile. Tous les acteurs d’un projet peuvent voir les vues de chacun et choisir celle qui convient le mieux à leurs besoins.",
        primary_button: {
          text: "Créez votre première vue",
          comic: {
            title: "Les vues fonctionnent sur les propriétés des éléments de travail.",
            description: "Vous pouvez créer une vue ici avec autant de propriétés comme filtres que souhaité.",
          },
        },
      },
      filter: {
        title: "Aucune vue correspondante",
        description: `Aucune vue ne correspond aux critères de recherche.
 Créez plutôt une nouvelle vue.`,
      },
    },
    delete_view: {
      title: "Êtes-vous sûr de vouloir supprimer cette vue ?",
      content:
        "Si vous confirmez, toutes les options de tri, de filtrage et d’affichage et la mise en page que vous avez choisie pour cette vue seront définitivement supprimées sans possibilité de les restaurer.",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title:
          "Rédigez une note, un document ou une base de connaissances complète. Obtenez l’aide de Galileo, l’assistant IA de Plane, pour commencer",
        description:
          "Les Pages sont un espace de réflexion dans Plane. Prenez des notes de réunion, formatez-les facilement, intégrez des éléments de travail, disposez-les à l’aide d’une bibliothèque de composants, et gardez-les tous dans le contexte de votre projet. Pour faciliter la rédaction de tout document, faites appel à Galileo, l’IA de Plane, avec un raccourci ou un clic sur un bouton.",
        primary_button: {
          text: "Créez votre première page",
        },
      },
      private: {
        title: "Pas encore de pages privées",
        description:
          "Ici vos écrits sont personnels et privés. Quand vous serez prêt à les partager, l'équipe n’est qu’à un clic.",
        primary_button: {
          text: "Créez votre première page",
        },
      },
      public: {
        title: "Pas encore de pages publiques",
        description: "Consultez ici les pages partagées avec tout le monde dans votre projet.",
        primary_button: {
          text: "Créez votre première page",
        },
      },
      archived: {
        title: "Pas encore de pages archivées",
        description: "Archivez les pages qui ne sont pas dans votre radar. Accédez-y ici quand nécessaire.",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "Aucun résultat trouvé",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "Aucun élément de travail correspondant trouvé",
      },
      no_issues: {
        title: "Aucun élément de travail trouvé",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "Pas encore de commentaires",
        description:
          "Les commentaires peuvent être utilisés comme espace de discussion et de suivi pour les éléments de travail",
      },
    },
  },
  notification: {
    label: "Boîte de réception",
    page_label: "{workspace} - Boîte de réception",
    options: {
      mark_all_as_read: "Tout marquer comme lu",
      mark_read: "Marquer comme lu",
      mark_unread: "Marquer comme non lu",
      refresh: "Actualiser",
      filters: "Filtres de la boîte de réception",
      show_unread: "Afficher les non lus",
      show_snoozed: "Afficher les reportés",
      show_archived: "Afficher les archivés",
      mark_archive: "Archiver",
      mark_unarchive: "Désarchiver",
      mark_snooze: "Reporter",
      mark_unsnooze: "Annuler le report",
    },
    toasts: {
      read: "Notification marquée comme lue",
      unread: "Notification marquée comme non lue",
      archived: "Notification marquée comme archivée",
      unarchived: "Notification marquée comme non archivée",
      snoozed: "Notification reportée",
      unsnoozed: "Report de la notification annulé",
    },
    empty_state: {
      detail: {
        title: "Sélectionnez pour voir les détails.",
      },
      all: {
        title: "Aucun élément de travail assigné",
        description: `Les mises à jour des éléments de travail qui vous sont assignés peuvent être
 vues ici`,
      },
      mentions: {
        title: "Aucun élément de travail assigné",
        description: `Les mises à jour des éléments de travail qui vous sont assignés peuvent être
 vues ici`,
      },
    },
    tabs: {
      all: "Tout",
      mentions: "Mentions",
    },
    filter: {
      assigned: "Assigné à moi",
      created: "Créé par moi",
      subscribed: "Suivi par moi",
    },
    snooze: {
      "1_day": "1 jour",
      "3_days": "3 jours",
      "5_days": "5 jours",
      "1_week": "1 semaine",
      "2_weeks": "2 semaines",
      custom: "Personnalisé",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "Ajoutez des éléments de travail au cycle pour voir sa progression",
      },
      chart: {
        title: "Ajoutez des éléments de travail au cycle pour voir le graphique d’avancement.",
      },
      priority_issue: {
        title: "Visualisez en un coup d’œil les éléments de travail prioritaires traités dans le cycle.",
      },
      assignee: {
        title: "Ajoutez des acteurs aux éléments de travail pour voir une répartition du travail par acteur.",
      },
      label: {
        title: "Ajoutez des étiquettes aux éléments de travail pour voir la répartition du travail par étiquette.",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "L’Intake n’est pas activé pour le projet.",
        description:
          "L’Intake vous aide à gérer les demandes entrantes dans votre projet et à les ajouter comme éléments de travail dans votre flux. Activez l’Intake depuis les paramètres du projet pour gérer les demandes.",
        primary_button: {
          text: "Gérer les fonctionnalités",
        },
      },
      cycle: {
        title: "Les Cycles ne sont pas activés pour ce projet.",
        description:
          "Découpez le travail en segments temporels, planifiez à rebours depuis la date d’échéance de votre projet pour définir les étapes, et progressez concrètement en équipe. Activez la fonctionnalité Cycles pour votre projet pour commencer à les utiliser.",
        primary_button: {
          text: "Gérer les fonctionnalités",
        },
      },
      module: {
        title: "Les Modules ne sont pas activés pour le projet.",
        description:
          "Les Modules sont les éléments constitutifs de votre projet. Activez les modules depuis les paramètres du projet pour commencer à les utiliser.",
        primary_button: {
          text: "Gérer les fonctionnalités",
        },
      },
      page: {
        title: "Les Pages ne sont pas activées pour le projet.",
        description:
          "Les Pages sont les éléments constitutifs de votre projet. Activez les pages depuis les paramètres du projet pour commencer à les utiliser.",
        primary_button: {
          text: "Gérer les fonctionnalités",
        },
      },
      view: {
        title: "Les Vues ne sont pas activées pour le projet.",
        description:
          "Les Vues sont les éléments constitutifs de votre projet. Activez les vues depuis les paramètres du projet pour commencer à les utiliser.",
        primary_button: {
          text: "Gérer les fonctionnalités",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "Créer un brouillon d’élément de travail",
    empty_state: {
      title: "Les éléments de travail partiellement rédigés, et bientôt les commentaires, apparaîtront ici.",
      description:
        "Pour essayer, commencez à ajouter un élément de travail et laissez-le à mi-chemin ou créez votre premier brouillon ci-dessous. 😉",
      primary_button: {
        text: "Créez votre premier brouillon",
      },
    },
    delete_modal: {
      title: "Supprimer le brouillon",
      description: "Êtes-vous sûr de vouloir supprimer ce brouillon ? Cette action ne peut pas être annulée.",
    },
    toasts: {
      created: {
        success: "Brouillon créé",
        error: "L’élément de travail n’a pas pu être créé. Veuillez réessayer.",
      },
      deleted: {
        success: "Brouillon supprimé",
      },
    },
  },
  stickies: {
    title: "Vos post-it",
    placeholder: "cliquez pour écrire ici",
    all: "Toutes les post-it",
    "no-data": "Notez une idée, saisissez une intuition ou captez une inspiration. Ajoutez un post-it pour commencer.",
    add: "Ajouter un post-it",
    search_placeholder: "Rechercher par titre",
    delete: "Supprimer le post-it",
    delete_confirmation: "Êtes-vous sûr de vouloir supprimer ce post-it ?",
    empty_state: {
      simple: "Notez une idée, saisissez une intuition ou captez une inspiration. Ajoutez un post-it pour commencer.",
      general: {
        title: "Les post-it sont des notes rapides et des tâches que vous prenez à la volée.",
        description:
          "Capturez vos pensées et idées facilement en créant des post-it que vous pouvez consulter à tout moment et de n’importe où.",
        primary_button: {
          text: "Ajouter un post-it",
        },
      },
      search: {
        title: "Cela ne correspond à aucun de vos post-it.",
        description: `Essayez un terme différent ou faites-nous savoir
si vous êtes sûr que votre recherche est correcte.`,
        primary_button: {
          text: "Ajouter un post-it",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "Le nom du post-it ne peut pas dépasser 100 caractères.",
        already_exists: "Il existe déjà un post-it sans description",
      },
      created: {
        title: "Post-it créé",
        message: "Le post-it a été créé avec succès",
      },
      not_created: {
        title: "Post-it non créé",
        message: "Le post-it n’a pas pu être créé",
      },
      updated: {
        title: "Post-it mis à jour",
        message: "Le post-it a été mis à jour avec succès",
      },
      not_updated: {
        title: "Post-it non mis à jour",
        message: "Le post-it n’a pas pu être mis à jour",
      },
      removed: {
        title: "Post-it supprimé",
        message: "Le post-it a été supprimé avec succès",
      },
      not_removed: {
        title: "Post-it non supprimé",
        message: "Le post-it n’a pas pu être supprimé",
      },
    },
  },
  role_details: {
    guest: {
      title: "Invité",
      description: "Les membres externes des organisations peuvent être invités en tant qu’invités.",
    },
    member: {
      title: "Membre",
      description: "Capacité à lire, écrire, modifier et supprimer des entités dans les projets, cycles et modules",
    },
    admin: {
      title: "Administrateur",
      description: "Toutes les permissions sont activées dans l’espace de travail.",
    },
  },
  user_roles: {
    product_or_project_manager: "Chef de produit / Chef de projet",
    development_or_engineering: "Développement / Ingénierie",
    founder_or_executive: "Fondateur / Dirigeant",
    freelancer_or_consultant: "Freelance / Consultant",
    marketing_or_growth: "Marketing / Croissance",
    sales_or_business_development: "Ventes / Développement commercial",
    support_or_operations: "Support / Opérations",
    student_or_professor: "Étudiant / Professeur",
    human_resources: "Ressources Humaines",
    other: "Autre",
  },
  importer: {
    github: {
      title: "GitHub",
      description: "Importez des éléments de travail depuis les dépôts GitHub et synchronisez-les.",
    },
    jira: {
      title: "Jira",
      description: "Importez des éléments de travail et des epics depuis les projets et epics Jira.",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "Exportez les éléments de travail vers un fichier CSV.",
      short_description: "Exporter en csv",
    },
    excel: {
      title: "Excel",
      description: "Exportez les éléments de travail vers un fichier Excel.",
      short_description: "Exporter en excel",
    },
    xlsx: {
      title: "Excel",
      description: "Exportez les éléments de travail vers un fichier Excel.",
      short_description: "Exporter en excel",
    },
    json: {
      title: "JSON",
      description: "Exportez les éléments de travail vers un fichier JSON.",
      short_description: "Exporter en json",
    },
  },
  default_global_view: {
    all_issues: "Tous les éléments de travail",
    assigned: "Assignés",
    created: "Créés",
    subscribed: "Suivis",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "Préférence système",
      },
      light: {
        label: "Clair",
      },
      dark: {
        label: "Sombre",
      },
      light_contrast: {
        label: "Contraste clair élevé",
      },
      dark_contrast: {
        label: "Contraste sombre élevé",
      },
      custom: {
        label: "Thème personnalisé",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "Backlog",
      planned: "Planifié",
      in_progress: "En cours",
      paused: "En pause",
      completed: "Terminé",
      cancelled: "Annulé",
    },
    layout: {
      list: "Vue liste",
      board: "Vue galerie",
      timeline: "Vue chronologique",
    },
    order_by: {
      name: "Nom",
      progress: "Progression",
      issues: "Nombre d’éléments de travail",
      due_date: "Date d’échéance",
      created_at: "Date de création",
      manual: "Manuel",
    },
  },
  cycle: {
    label: "{count, plural, one {Cycle} other {Cycles}}",
    no_cycle: "Pas de cycle",
  },
  module: {
    label: "{count, plural, one {Module} other {Modules}}",
    no_module: "Pas de module",
  },
  description_versions: {
    last_edited_by: "Dernière modification par",
    previously_edited_by: "Précédemment modifié par",
    edited_by: "Modifié par",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane n’a pas démarré. Cela pourrait être dû au fait qu’un ou plusieurs services Plane ont échoué à démarrer.",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "Choisissez View Logs depuis setup.sh et les logs Docker pour en être sûr.",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "Plan",
        empty_state: {
          title: "Titres manquants",
          description: "Ajoutons quelques titres à cette page pour les voir ici.",
        },
      },
      info: {
        label: "Info",
        document_info: {
          words: "Mots",
          characters: "Caractères",
          paragraphs: "Paragraphes",
          read_time: "Temps de lecture",
        },
        actors_info: {
          edited_by: "Modifié par",
          created_by: "Créé par",
        },
        version_history: {
          label: "Historique des versions",
          current_version: "Version actuelle",
          highlight_changes: "Mettre en évidence les modifications",
        },
      },
      assets: {
        label: "Ressources",
        download_button: "Télécharger",
        empty_state: {
          title: "Images manquantes",
          description: "Ajoutez des images pour les voir ici.",
        },
      },
    },
    open_button: "Ouvrir le panneau de navigation",
    close_button: "Fermer le panneau de navigation",
    outline_floating_button: "Ouvrir le plan",
  },
  workspace_dashboards: "Tableaux de bord",
  pi_chat: "Plane AI",
  in_app: "Dans l'application",
  forms: "Formulaires",
  choose_workspace_for_integration: "Choisissez un espace de travail pour connecter cette application",
  integrations_description:
    "Les applications qui fonctionnent avec Plane doivent se connecter à un espace de travail où vous êtes administrateur.",
  create_a_new_workspace: "Créer un nouvel espace de travail",
  learn_more_about_workspaces: "En savoir plus sur les espaces de travail",
  no_workspaces_to_connect: "Aucun espace de travail à connecter",
  no_workspaces_to_connect_description:
    "Vous devez créer un espace de travail pour pouvoir connecter des intégrations et des modèles",
  updates: {
    add_update: "Ajouter une mise à jour",
    add_update_placeholder: "Ajoutez votre mise à jour ici",
    empty: {
      title: "Aucune mise à jour",
      description: "Vous pouvez voir les mises à jour ici.",
    },
    delete: {
      title: "Supprimer la mise à jour",
      confirmation: "Êtes-vous sûr de vouloir supprimer cette mise à jour ? Cette action est irréversible.",
      success: {
        title: "Mise à jour supprimée",
        message: "La mise à jour a été supprimée avec succès.",
      },
      error: {
        title: "Mise à jour non supprimée",
        message: "La mise à jour n'a pas pu être supprimée.",
      },
    },
    reaction: {
      create: {
        success: {
          title: "Réaction créée",
          message: "Réaction créée avec succès.",
        },
        error: {
          title: "Réaction non créée",
          message: "La réaction n'a pas pu être créée.",
        },
      },
      remove: {
        success: {
          title: "Réaction supprimée",
          message: "Réaction supprimée avec succès.",
        },
        error: {
          title: "Réaction non supprimée",
          message: "La réaction n'a pas pu être supprimée.",
        },
      },
    },
    progress: {
      title: "Progrès",
      since_last_update: "Depuis la dernière mise à jour",
      comments: "{count, plural, one{# commentaire} other{# commentaires}}",
    },
    create: {
      success: {
        title: "Mise à jour créée",
        message: "Mise à jour créée avec succès.",
      },
      error: {
        title: "Mise à jour non créée",
        message: "La mise à jour n'a pas pu être créée.",
      },
    },
    update: {
      success: {
        title: "Mise à jour mise à jour",
        message: "Mise à jour mise à jour avec succès.",
      },
      error: {
        title: "Mise à jour non mise à jour",
        message: "La mise à jour n'a pas pu être mise à jour.",
      },
    },
  },
  teamspaces: {
    label: "Espaces d'équipe",
    empty_state: {
      general: {
        title: "Les espaces d'équipe permettent une meilleure organisation et un meilleur suivi dans Plane",
        description:
          "Créez une surface dédiée pour chaque équipe réelle, séparée de toutes les autres surfaces de travail dans Plane, et personnalisez-les selon le mode de travail de votre équipe.",
        primary_button: {
          text: "Créer un nouvel espace d'équipe",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "Vous n'avez pas encore lié d'espaces d'équipe.",
          description: "Les propriétaires d'espaces d'équipe et de projets peuvent gérer l'accès aux projets.",
        },
      },
      primary_button: {
        text: "Lier un espace d'équipe",
      },
      secondary_button: {
        text: "En savoir plus",
      },
      table: {
        columns: {
          teamspaceName: "Nom de l'espace d'équipe",
          members: "Membres",
          accountType: "Type de compte",
        },
        actions: {
          remove: {
            button: {
              text: "Supprimer l'espace d'équipe",
            },
            confirm: {
              title: "Supprimer {teamspaceName} de {projectName}",
              description:
                "Lorsque vous supprimez cet espace d'équipe d'un projet lié, les membres ici perdront l'accès au projet lié.",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "Aucun espace d'équipe correspondant trouvé",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {Vous avez lié un espace d'équipe à ce projet.} other {Vous avez lié # espaces d'équipe à ce projet.}}",
            description:
              "{additionalCount, plural, =0 {L'espace d'équipe {firstTeamspaceName} est maintenant lié à ce projet.} other {L'espace d'équipe {firstTeamspaceName} et {additionalCount} autres sont maintenant liés à ce projet.}}",
          },
          error: {
            title: "Cela n'a pas fonctionné.",
            description: "Essayez à nouveau ou rechargez cette page avant de réessayer.",
          },
        },
        remove_teamspace: {
          success: {
            title: "Vous avez supprimé cet espace d'équipe de ce projet.",
            description: "L'espace d'équipe {teamspaceName} a été supprimé de {projectName}.",
          },
          error: {
            title: "Cela n'a pas fonctionné.",
            description: "Essayez à nouveau ou rechargez cette page avant de réessayer.",
          },
        },
      },
      link_teamspace: {
        placeholder: "Rechercher des espaces d'équipe",
        info: {
          title: "L'ajout d'un espace d'équipe donne accès à ce projet à tous les membres de l'espace d'équipe.",
          link: "En savoir plus",
        },
        empty_state: {
          no_teamspaces: {
            title: "Vous n'avez pas d'espaces d'équipe à lier.",
            description:
              "Soit vous n'êtes pas dans un espace d'équipe que vous pouvez lier, soit vous avez déjà lié tous les espaces d'équipe disponibles.",
          },
          no_results: {
            title: "Cela ne correspond à aucun de vos espaces d'équipe.",
            description: "Essayez un autre terme ou assurez-vous d'avoir des espaces d'équipe à lier.",
          },
        },
        primary_button: {
          text: "Lier l'espace(s) d'équipe sélectionné(s)",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "Créez des éléments de travail spécifiques à l'équipe.",
        description:
          "Les éléments de travail assignés aux membres de cette équipe dans tout projet lié apparaîtront automatiquement ici. Si vous vous attendez à voir des éléments de travail ici, assurez-vous que vos projets liés ont des éléments de travail assignés aux membres de cette équipe ou créez des éléments de travail.",
        primary_button: {
          text: "Ajouter des éléments de travail à un projet lié",
        },
      },
      work_items_empty_filter: {
        title: "Il n'y a pas d'éléments de travail spécifiques à l'équipe pour les filtres appliqués",
        description:
          "Modifiez certains de ces filtres ou effacez-les tous pour voir les éléments de travail pertinents pour cet espace.",
        secondary_button: {
          text: "Effacer tous les filtres",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "Aucun de vos projets liés n'a de Cycle actif.",
        description:
          "Les Cycles actifs dans les projets liés apparaîtront automatiquement ici. Si vous vous attendez à voir un Cycle actif, assurez-vous qu'il est en cours d'exécution dans un projet lié en ce moment.",
      },
      completed: {
        title: "Aucun de vos projets liés n'a de Cycle terminé.",
        description:
          "Les Cycles terminés dans les projets liés apparaîtront automatiquement ici. Si vous vous attendez à voir un Cycle terminé, assurez-vous qu'il est également terminé dans un projet lié.",
      },
      upcoming: {
        title: "Aucun de vos projets liés n'a de Cycle à venir.",
        description:
          "Les Cycles à venir dans les projets liés apparaîtront automatiquement ici. Si vous vous attendez à voir un Cycle à venir, assurez-vous qu'il existe également dans un projet lié.",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title: "Les vues de votre équipe sur votre travail sans perturber les autres vues de votre espace de travail",
        description:
          "Visualisez le travail de votre équipe dans des vues enregistrées uniquement pour votre équipe et séparément des vues d'un projet.",
        primary_button: {
          text: "Créer une vue",
        },
      },
      filter: {
        title: "Aucune vue correspondante",
        description: `Aucune vue ne correspond aux critères de recherche.
 Créez plutôt une nouvelle vue.`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "Hébergez les connaissances de votre équipe dans les Pages.",
        description:
          "Contrairement aux Pages d'un projet, vous pouvez sauvegarder les connaissances spécifiques à une équipe dans un ensemble de Pages distinct ici. Obtenez toutes les fonctionnalités des Pages, créez des documents de meilleures pratiques et des wikis d'équipe facilement.",
        primary_button: {
          text: "Créez votre première Page",
        },
      },
      filter: {
        title: "Aucune Page correspondante",
        description: "Supprimez les filtres pour voir toutes les Pages",
      },
      search: {
        title: "Aucune Page correspondante",
        description: "Supprimez les critères de recherche pour voir toutes les Pages",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "Aucun de vos projets liés n'a d'éléments de travail publiés.",
        description:
          "Créez des éléments de travail dans un ou plusieurs de ces projets pour voir les progrès par dates, états et priorité.",
      },
      relation: {
        blocking: {
          title: "Vous n'avez aucun élément de travail bloquant un coéquipier.",
          description: "Bon travail ! Vous avez dégagé la voie pour votre équipe. Vous êtes un bon coéquipier.",
        },
        blocked: {
          title: "Vous n'avez aucun élément de travail d'un coéquipier qui vous bloque.",
          description: "Bonne nouvelle ! Vous pouvez progresser sur tous vos éléments de travail assignés.",
        },
      },
      stats: {
        general: {
          title: "Aucun de vos projets liés n'a d'éléments de travail publiés.",
          description:
            "Créez des éléments de travail dans un ou plusieurs de ces projets pour voir la répartition du travail par projet et membres de l'équipe.",
        },
        filter: {
          title: "Il n'y a pas de statistiques d'équipe pour les filtres appliqués.",
          description:
            "Créez des éléments de travail dans un ou plusieurs de ces projets pour voir la répartition du travail par projet et membres de l'équipe.",
        },
      },
    },
  },
  initiatives: {
    overview: "Vue d'ensemble",
    label: "Initiatives",
    placeholder: "{count, plural, one{# initiative} other{# initiatives}}",
    add_initiative: "Ajouter une initiative",
    create_initiative: "Créer une initiative",
    update_initiative: "Mettre à jour l'initiative",
    initiative_name: "Nom de l'initiative",
    all_initiatives: "Toutes les initiatives",
    delete_initiative: "Supprimer l'initiative",
    fill_all_required_fields: "Veuillez remplir tous les champs obligatoires.",
    toast: {
      create_success: "Initiative {name} créée avec succès.",
      create_error: "Échec de la création de l'initiative. Veuillez réessayer !",
      update_success: "Initiative {name} mise à jour avec succès.",
      update_error: "Échec de la mise à jour de l'initiative. Veuillez réessayer !",
      delete: {
        success: "Initiative supprimée avec succès.",
        error: "Échec de la suppression de l'initiative",
      },
      link_copied: "Lien de l'initiative copié dans le presse-papiers.",
      project_update_success: "Projets de l'initiative mis à jour avec succès.",
      project_update_error: "Échec de la mise à jour des projets de l'initiative. Veuillez réessayer !",
      epic_update_success:
        "Epic{count, plural, one { ajouté à l'initiative avec succès.} other {s ajoutés à l'initiative avec succès.}}",
      epic_update_error: "L'ajout d'Epic à l'initiative a échoué. Veuillez réessayer plus tard.",
      state_update_success: "L'état de l'initiative a été mis à jour avec succès.",
      state_update_error: "Échec de la mise à jour de l'état de l'initiative. Veuillez réessayer !",
      label_update_error: "Échec de la mise à jour des étiquettes de l'initiative. Veuillez réessayer !",
    },
    empty_state: {
      general: {
        title: "Organisez le travail au plus haut niveau avec les Initiatives",
        description:
          "Lorsque vous devez organiser un travail s'étendant sur plusieurs projets et équipes, les Initiatives sont utiles. Connectez des projets et des Epics aux initiatives, voyez automatiquement les mises à jour regroupées et voyez la forêt avant les arbres.",
        primary_button: {
          text: "Créer une initiative",
        },
      },
      search: {
        title: "Aucune initiative correspondante",
        description: `Aucune initiative détectée avec les critères correspondants.
 Créez plutôt une nouvelle initiative.`,
      },
      not_found: {
        title: "L'initiative n'existe pas",
        description: "L'initiative que vous recherchez n'existe pas, a été archivée ou a été supprimée.",
        primary_button: {
          text: "Voir les autres initiatives",
        },
      },
      epics: {
        title: "Vous n'avez pas d'Epics qui correspondent aux filtres que vous avez appliqués.",
        subHeading: "Pour voir tous les Epics, effacez tous les filtres appliqués.",
        action: "Effacer les filtres",
      },
    },
    scope: {
      view_scope: "Voir le périmètre",
      breakdown: "Décomposition du périmètre",
      add_scope: "Ajouter un périmètre",
      label: "Périmètre",
      empty_state: {
        title: "Aucun périmètre ajouté à cette initiative",
        description: "Connectez des projets et des épiques et suivez ce travail dans cet espace.",
        primary_button: {
          text: "Ajouter un périmètre",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "Étiquettes",
        description: "Structurez et organisez vos initiatives avec des étiquettes.",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "Supprimer l'étiquette",
        content:
          "Êtes-vous sûr de vouloir supprimer {labelName} ? Cela supprimera l'étiquette de toutes les initiatives et de toutes les vues où elle est filtrée.",
      },
      toast: {
        delete_error: "L'étiquette de l'initiative n'a pas pu être supprimée. Veuillez réessayer.",
        label_already_exists: "L'étiquette existe déjà",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title:
          "Écrivez une note, un document ou une base de connaissances complète. Obtenez l'aide de Galileo, l'assistant IA de Plane, pour commencer",
        description:
          "Les Pages sont des espaces de réflexion dans Plane. Prenez des notes de réunion, formatez-les facilement, intégrez des éléments de travail, disposez-les à l'aide d'une bibliothèque de composants et gardez-les tous dans le contexte de votre projet. Pour faciliter la rédaction de tout document, invoquez Galileo, l'IA de Plane, avec un raccourci ou un clic sur un bouton.",
        primary_button: {
          text: "Créez votre première Page",
        },
      },
      private: {
        title: "Pas encore de Pages privées",
        description: "Gardez vos pensées privées ici. Quand vous serez prêt à partager, l'équipe n'est qu'à un clic.",
        primary_button: {
          text: "Créez votre première Page",
        },
      },
      public: {
        title: "Pas encore de Pages d'espace de travail",
        description: "Voyez les Pages partagées avec tout le monde dans votre espace de travail ici même.",
        primary_button: {
          text: "Créez votre première Page",
        },
      },
      archived: {
        title: "Pas encore de Pages archivées",
        description: "Archivez les Pages qui ne sont pas dans votre radar. Accédez-y ici quand nécessaire.",
      },
    },
  },
  epics: {
    label: "Epics",
    no_epics_selected: "Aucun Epic sélectionné",
    add_selected_epics: "Ajouter les Epics sélectionnés",
    epic_link_copied_to_clipboard: "Lien de l'Epic copié dans le presse-papiers.",
    project_link_copied_to_clipboard: "Lien du projet copié dans le presse-papiers",
    empty_state: {
      general: {
        title: "Créez un Epic et assignez-le à quelqu'un, même à vous-même",
        description:
          "Pour des travaux plus importants qui s'étendent sur plusieurs Cycles et peuvent exister dans plusieurs Modules, créez un Epic. Liez des éléments de travail et des sous-éléments de travail dans un projet à un Epic et accédez à un élément de travail depuis la vue d'ensemble.",
        primary_button: {
          text: "Créer un Epic",
        },
      },
      section: {
        title: "Pas encore d'Epics",
        description: "Commencez à ajouter des Epics pour gérer et suivre les progrès.",
        primary_button: {
          text: "Ajouter des Epics",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "Aucun Epic correspondant trouvé",
      },
      no_epics: {
        title: "Aucun Epic trouvé",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "Aucun Cycle actif",
        description:
          "Les Cycles de vos projets qui incluent une période englobant la date d'aujourd'hui dans leur intervalle. Trouvez ici la progression et les détails de tous vos Cycles actifs.",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: `Ajoutez des éléments de travail au Cycle pour voir sa
 progression`,
      },
      priority: {
        title: `Observez les éléments de travail hautement prioritaires traités dans
 le Cycle en un coup d'œil.`,
      },
      assignee: {
        title: `Ajoutez des assignés aux éléments de travail pour voir une
 répartition du travail par assigné.`,
      },
      label: {
        title: `Ajoutez des étiquettes aux éléments de travail pour voir la
 répartition du travail par étiquettes.`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "Importer des membres depuis un CSV",
      description:
        "Téléchargez un CSV avec les colonnes : Email, Display Name, First Name, Last Name, Role (5, 15 ou 20)",
      dropzone: {
        active: "Déposez le fichier CSV ici",
        inactive: "Glissez-déposez ou cliquez pour télécharger",
        file_type: "Seuls les fichiers .csv sont pris en charge",
      },
      buttons: {
        cancel: "Annuler",
        import: "Importer",
        try_again: "Réessayer",
        close: "Fermer",
        done: "Terminé",
      },
      progress: {
        uploading: "Téléchargement...",
        importing: "Importation...",
      },
      summary: {
        title: {
          failed: "Échec de l'importation",
          complete: "Importation terminée",
        },
        message: {
          seat_limit: "Impossible d'importer les membres en raison de restrictions de places.",
          success: "{count} membre{plural} ajouté{plural} avec succès à l'espace de travail.",
          no_imports: "Aucun membre n'a été importé depuis le fichier CSV.",
        },
        stats: {
          successful: "Réussi",
          failed: "Échoué",
        },
        download_errors: "Télécharger les erreurs",
      },
      toast: {
        invalid_file: {
          title: "Fichier invalide",
          message: "Seuls les fichiers CSV sont pris en charge.",
        },
        import_failed: {
          title: "Échec de l'importation",
          message: "Une erreur s'est produite.",
        },
      },
    },
  },
  project: {
    members_import: {
      title: "Importer des membres depuis un CSV",
      description:
        "Téléchargez un CSV avec les colonnes : E-mail et Rôle (5=Invité, 15=Membre, 20=Administrateur). Les utilisateurs doivent déjà être membres de l'espace de travail.",
      download_sample: "Télécharger un CSV d'exemple",
      dropzone: {
        active: "Déposez le fichier CSV ici",
        inactive: "Glissez-déposez ou cliquez pour télécharger",
        file_type: "Seuls les fichiers .csv sont pris en charge",
      },
      buttons: {
        cancel: "Annuler",
        import: "Importer",
        try_again: "Réessayer",
        close: "Fermer",
        done: "Terminé",
      },
      progress: {
        uploading: "Téléchargement...",
        importing: "Importation...",
      },
      summary: {
        title: {
          complete: "Importation terminée",
        },
        message: {
          success: "{count} membre{plural} importé{plural} avec succès dans le projet.",
          no_imports: "Aucun nouveau membre n'a été importé depuis le fichier CSV.",
        },
        stats: {
          added: "Ajoutés",
          reactivated: "Réactivés",
          already_members: "Déjà membres",
          skipped: "Ignorés",
        },
        download_errors: "Télécharger les détails ignorés",
      },
      toast: {
        invalid_file: {
          title: "Fichier invalide",
          message: "Seuls les fichiers CSV sont pris en charge.",
        },
        import_failed: {
          title: "Échec de l'importation",
          message: "Une erreur s'est produite.",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "Impossible d'archiver les éléments de travail",
        message:
          "Seuls les éléments de travail appartenant aux groupes d'états Terminé ou Annulé peuvent être archivés.",
      },
      invalid_issue_start_date: {
        title: "Impossible de mettre à jour les éléments de travail",
        message:
          "La date de début sélectionnée est postérieure à la date d'échéance pour certains éléments de travail. Assurez-vous que la date de début soit antérieure à la date d'échéance.",
      },
      invalid_issue_target_date: {
        title: "Impossible de mettre à jour les éléments de travail",
        message:
          "La date d'échéance sélectionnée est antérieure à la date de début pour certains éléments de travail. Assurez-vous que la date d'échéance soit postérieure à la date de début.",
      },
      invalid_state_transition: {
        title: "Impossible de mettre à jour les éléments de travail",
        message:
          "Le changement d'état n'est pas autorisé pour certains éléments de travail. Assurez-vous que le changement d'état est autorisé.",
      },
    },
  },
  work_item_types: {
    label: "Types d'éléments de travail",
    label_lowercase: "types d'éléments de travail",
    settings: {
      title: "Types d'éléments de travail",
      properties: {
        title: "Propriétés personnalisées des éléments de travail",
        tooltip:
          "Chaque type d'élément de travail est livré avec un ensemble de propriétés par défaut comme Titre, Description, Assigné, État, Priorité, Date de début, Date d'échéance, Module, Cycle, etc. Vous pouvez également personnaliser et ajouter vos propres propriétés pour l'adapter aux besoins de votre équipe.",
        add_button: "Ajouter une nouvelle propriété",
        dropdown: {
          label: "Type de propriété",
          placeholder: "Sélectionner le type",
        },
        property_type: {
          text: {
            label: "Texte",
          },
          number: {
            label: "Nombre",
          },
          dropdown: {
            label: "Liste déroulante",
          },
          boolean: {
            label: "Booléen",
          },
          date: {
            label: "Date",
          },
          member_picker: {
            label: "Sélecteur de membre",
          },
          release_picker: {
            label: "Sélecteur de version",
          },
          formula: {
            label: "Formule",
          },
        },
        attributes: {
          label: "Attributs",
          text: {
            single_line: {
              label: "Ligne unique",
            },
            multi_line: {
              label: "Paragraphe",
            },
            readonly: {
              label: "Lecture seule",
              header: "Données en lecture seule",
            },
            invalid_text_format: {
              label: "Format de texte invalide",
            },
          },
          number: {
            default: {
              placeholder: "Ajouter un nombre",
            },
          },
          relation: {
            single_select: {
              label: "Sélection unique",
            },
            multi_select: {
              label: "Sélection multiple",
            },
            no_default_value: {
              label: "Pas de valeur par défaut",
            },
          },
          boolean: {
            label: "Vrai | Faux",
            no_default: "Pas de valeur par défaut",
          },
          option: {
            create_update: {
              label: "Options",
              form: {
                placeholder: "Ajouter une option",
                errors: {
                  name: {
                    required: "Le nom de l'option est requis.",
                    integrity: "Une option avec le même nom existe déjà.",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "Sélectionner une option",
                multi: {
                  default: "Sélectionner des options",
                  variable: "{count} options sélectionnées",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "Succès !",
              message: "Propriété {name} créée avec succès.",
            },
            error: {
              title: "Erreur !",
              message: "Échec de la création de la propriété. Veuillez réessayer !",
            },
          },
          update: {
            success: {
              title: "Succès !",
              message: "Propriété {name} mise à jour avec succès.",
            },
            error: {
              title: "Erreur !",
              message: "Échec de la mise à jour de la propriété. Veuillez réessayer !",
            },
          },
          delete: {
            success: {
              title: "Succès !",
              message: "Propriété {name} supprimée avec succès.",
            },
            error: {
              title: "Erreur !",
              message: "Échec de la suppression de la propriété. Veuillez réessayer !",
            },
          },
          enable_disable: {
            loading: "{action} la propriété {name}",
            success: {
              title: "Succès !",
              message: "Propriété {name} {action} avec succès.",
            },
            error: {
              title: "Erreur !",
              message: "Échec de l'{action} de la propriété. Veuillez réessayer !",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "Titre",
            },
            description: {
              placeholder: "Description",
            },
          },
          errors: {
            name: {
              required: "Vous devez nommer votre propriété.",
              max_length: "Le nom de la propriété ne doit pas dépasser 255 caractères.",
            },
            property_type: {
              required: "Vous devez sélectionner un type de propriété.",
            },
            options: {
              required: "Vous devez ajouter au moins une option.",
            },
            formula: {
              required: "L'expression de formule est requise.",
              invalid: "Formule invalide : {error}",
              circular_reference:
                "Référence circulaire détectée. Une formule ne peut pas se référencer elle-même directement ou indirectement.",
              invalid_reference: "La formule fait référence à une propriété inexistante.",
            },
          },
        },
        formula: {
          field_label: "Champ de formule",
          tooltip:
            "Entrez une formule en utilisant la syntaxe '{'Nom du champ'}'. Prend en charge les opérateurs +, -, *, / et &.",
          placeholder: "Écrire la formule",
          test_button: "Tester",
          validating: "Validation en cours",
          validation_success: "La formule est valide ! Retourne {resultType}",
          validation_success_with_refs: "La formule est valide ! Retourne {resultType} ({count} champ(s) référencé(s))",
          error: {
            empty: "Veuillez entrer une formule",
            missing_context: "Contexte d'espace de travail, de projet ou de type d'élément de travail manquant",
            validation_failed: "La validation a échoué",
          },
          picker: {
            no_match: "Aucune propriété correspondante",
            no_available: "Aucune propriété disponible",
          },
        },
        enable_disable: {
          label: "Actif",
          tooltip: {
            disabled: "Cliquer pour désactiver",
            enabled: "Cliquer pour activer",
          },
        },
        delete_confirmation: {
          title: "Supprimer cette propriété",
          description: "La suppression des propriétés peut entraîner la perte des données existantes.",
          secondary_description: "Voulez-vous plutôt désactiver la propriété ?",
          primary_button: "{action}, supprimer",
          secondary_button: "Oui, désactiver",
        },
        mandate_confirmation: {
          label: "Propriété obligatoire",
          content:
            "Il semble y avoir une option par défaut pour cette propriété. Rendre la propriété obligatoire supprimera la valeur par défaut et les utilisateurs devront ajouter une valeur de leur choix.",
          tooltip: {
            disabled: "Ce type de propriété ne peut pas être rendu obligatoire",
            enabled: "Décocher pour marquer le champ comme optionnel",
            checked: "Cocher pour marquer le champ comme obligatoire",
          },
        },
        empty_state: {
          title: "Ajouter des propriétés personnalisées",
          description: "Les nouvelles propriétés que vous ajoutez pour ce type d'élément de travail apparaîtront ici.",
        },
      },
      item_delete_confirmation: {
        title: "Supprimer ce type",
        description: "La suppression de types peut entraîner la perte de données existantes.",
        primary_button: "Oui, supprime-le",
        toast: {
          success: {
            title: "Succès !",
            message: "Type d'élément de travail supprimé avec succès.",
          },
          error: {
            title: "Erreur !",
            message: "Échec de la suppression du type d'élément de travail. Veuillez réessayer !",
          },
        },
        errors: {
          cannot_delete_default_work_item_type: "Impossible de supprimer le type d'élément de travail par défaut",
          cannot_delete_work_item_type_with_associated_work_items:
            "Impossible de supprimer le type d'élément de travail avec des éléments de travail associés",
        },
        can_disable_warning: "Voulez-vous désactiver le type à la place ?",
      },
      cant_delete_default_message:
        "Ce type d'élément de travail ne peut pas être supprimé car il est défini comme le type par défaut pour ce projet.",
      set_as_default: "Définir par défaut",
      cant_set_default_inactive_message: "Activez ce type avant de le définir par défaut",
      set_default_confirmation: {
        title: "Définir comme type d'élément de travail par défaut",
        description:
          "Définir {name} par défaut l'importera dans tous les projets de cet espace de travail. Tous les nouveaux éléments de travail utiliseront ce type par défaut.",
        confirm_button: "Définir par défaut",
      },
    },
    create: {
      title: "Créer un type d'élément de travail",
      button: "Ajouter un type d'élément de travail",
      toast: {
        success: {
          title: "Succès !",
          message: "Type d'élément de travail créé avec succès.",
        },
        error: {
          title: "Erreur !",
          message: {
            conflict: "Le type {name} existe déjà. Choisissez un autre nom.",
          },
        },
      },
    },
    update: {
      title: "Mettre à jour le type d'élément de travail",
      button: "Mettre à jour le type d'élément de travail",
      toast: {
        success: {
          title: "Succès !",
          message: "Type d'élément de travail {name} mis à jour avec succès.",
        },
        error: {
          title: "Erreur !",
          message: {
            conflict: "Le type {name} existe déjà. Choisissez un autre nom.",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "Donnez à ce type d'élément de travail un nom unique",
        },
        description: {
          placeholder: "Décrivez à quoi sert ce type d'élément de travail et quand il doit être utilisé.",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{action} le type d'élément de travail {name}",
        success: {
          title: "Succès !",
          message: "Type d'élément de travail {name} {action} avec succès.",
        },
        error: {
          title: "Erreur !",
          message: "Échec de l'{action} du type d'élément de travail. Veuillez réessayer !",
        },
      },
      tooltip: "Cliquer pour {action}",
    },
    change_confirmation: {
      title: "Changer le type d'élément de travail ?",
      description:
        "Le changement du type d'élément de travail peut entraîner la perte de valeurs de propriétés personnalisées spécifiques au type actuel. Cette action ne peut pas être annulée.",
      button: {
        loading: "Changement en cours",
        default: "Changer le type",
      },
    },
    empty_state: {
      enable: {
        title: "Activer les types d'éléments de travail",
        description:
          "Adaptez les éléments de travail à votre travail avec les types d'éléments de travail. Personnalisez avec des icônes, des arrière-plans et des propriétés et configurez-les pour ce projet.",
        primary_button: {
          text: "Activer",
        },
        confirmation: {
          title: "Une fois activés, les types d'éléments de travail ne peuvent pas être désactivés.",
          description:
            "L'élément de travail de Plane deviendra le type d'élément de travail par défaut pour ce projet et apparaîtra avec son icône et son arrière-plan dans ce projet.",
          button: {
            default: "Activer",
            loading: "Configuration en cours",
          },
        },
      },
      get_pro: {
        title: "Passez à Pro pour activer les types d'éléments de travail.",
        description:
          "Adaptez les éléments de travail à votre travail avec les types d'éléments de travail. Personnalisez avec des icônes, des arrière-plans et des propriétés et configurez-les pour ce projet.",
        primary_button: {
          text: "Obtenir Pro",
        },
      },
      upgrade: {
        title: "Mettez à niveau pour activer les types d'éléments de travail.",
        description:
          "Adaptez les éléments de travail à votre travail avec les types d'éléments de travail. Personnalisez avec des icônes, des arrière-plans et des propriétés et configurez-les pour ce projet.",
        primary_button: {
          text: "Mettre à niveau",
        },
      },
    },
  },
  importers: {
    imports: "Importations",
    logo: "Logo",
    import_message: "Importez vos données {serviceName} dans les projets Plane.",
    deactivate: "Désactiver",
    deactivating: "Désactivation",
    migrating: "Migration",
    migrations: "Migrations",
    refreshing: "Actualisation",
    import: "Importer",
    serial_number: "N° de série",
    project: "Projet",
    workspace: "Espace de travail",
    status: "Statut",
    summary: "Résumé",
    total_batches: "Lots totaux",
    imported_batches: "Lots importés",
    re_run: "Relancer",
    cancel: "Annuler",
    start_time: "Heure de début",
    no_jobs_found: "Aucune tâche trouvée",
    no_project_imports: "Vous n'avez pas encore importé de projets {serviceName}.",
    cancel_import_job: "Annuler la tâche d'importation",
    cancel_import_job_confirmation:
      "Êtes-vous sûr de vouloir annuler cette tâche d'importation ? Cela arrêtera le processus d'importation pour ce projet.",
    re_run_import_job: "Relancer la tâche d'importation",
    re_run_import_job_confirmation:
      "Êtes-vous sûr de vouloir relancer cette tâche d'importation ? Cela redémarrera le processus d'importation pour ce projet.",
    upload_csv_file: "Téléchargez un fichier CSV pour importer les données utilisateur.",
    connect_importer: "Connecter {serviceName}",
    migration_assistant: "Assistant de migration",
    migration_assistant_description:
      "Migrez facilement vos projets {serviceName} vers Plane avec notre puissant assistant.",
    token_helper: "Vous l'obtiendrez depuis votre",
    personal_access_token: "Jeton d'accès personnel",
    source_token_expired: "Jeton expiré",
    source_token_expired_description:
      "Le jeton fourni a expiré. Veuillez désactiver et reconnecter avec de nouvelles informations d'identification.",
    user_email: "Email utilisateur",
    select_state: "Sélectionner l'état",
    select_service_project: "Sélectionner le projet {serviceName}",
    loading_service_projects: "Chargement des projets {serviceName}",
    select_service_workspace: "Sélectionner l'espace de travail {serviceName}",
    loading_service_workspaces: "Chargement des espaces de travail {serviceName}",
    select_priority: "Sélectionner la priorité",
    select_service_team: "Sélectionner l'équipe {serviceName}",
    add_seat_msg_free_trial:
      "Vous essayez d'importer {additionalUserCount} utilisateurs non enregistrés et vous n'avez que {currentWorkspaceSubscriptionAvailableSeats} sièges disponibles dans le plan actuel. Pour continuer l'importation, passez à la version supérieure maintenant.",
    add_seat_msg_paid:
      "Vous essayez d'importer {additionalUserCount} utilisateurs non enregistrés et vous n'avez que {currentWorkspaceSubscriptionAvailableSeats} sièges disponibles dans le plan actuel. Pour continuer l'importation, achetez au moins {extraSeatRequired} sièges supplémentaires.",
    skip_user_import_title: "Ignorer l'importation des données utilisateur",
    skip_user_import_description:
      "Ignorer l'importation des utilisateurs entraînera la création des éléments de travail, commentaires et autres données de {serviceName} par l'utilisateur effectuant la migration dans Plane. Vous pourrez toujours ajouter manuellement des utilisateurs plus tard.",
    invalid_pat: "Token de connexion personnel invalide",
  },
  integrations: {
    integrations: "Intégrations",
    loading: "Chargement",
    unauthorized: "Vous n'êtes pas autorisé à voir cette page.",
    configure: "Configurer",
    not_enabled: "{name} n'est pas activé pour cet espace de travail.",
    not_configured: "Non configuré",
    disconnect_personal_account: "Déconnecter le compte personnel {providerName}",
    not_configured_message_admin:
      "L'intégration {name} n'est pas configurée. Veuillez contacter votre administrateur d'instance pour la configurer.",
    not_configured_message_support:
      "L'intégration {name} n'est pas configurée. Veuillez contacter le support pour la configurer.",
    external_api_unreachable: "Impossible d'accéder à l'API externe. Veuillez réessayer plus tard.",
    error_fetching_supported_integrations:
      "Impossible de récupérer les intégrations prises en charge. Veuillez réessayer plus tard.",
    back_to_integrations: "Retour aux intégrations",
    select_state: "Sélectionner l'état",
    set_state: "Définir l'état",
    choose_project: "Choisir le projet...",
    skip_backward_state_movement:
      "Empêcher le déplacement des issues vers un état antérieur en raison des mises à jour de PR",
  },
  github_integration: {
    name: "GitHub",
    description: "Connectez et synchronisez vos éléments de travail GitHub avec Plane",
    connect_org: "Connecter l'organisation",
    connect_org_description: "Connectez votre organisation GitHub avec Plane",
    processing: "Traitement",
    org_added_desc: "GitHub org ajoutée par et temps",
    connection_fetch_error: "Erreur lors de la récupération des détails de connexion du serveur",
    personal_account_connected: "Compte personnel connecté",
    personal_account_connected_description: "Votre compte GitHub est maintenant connecté à Plane",
    connect_personal_account: "Connecter le compte personnel",
    connect_personal_account_description: "Connectez votre compte personnel GitHub avec Plane.",
    repo_mapping: "Mappage de dépôts",
    repo_mapping_description: "Mappez vos dépôts GitHub avec les projets Plane.",
    project_issue_sync: "Synchronisation de problèmes de projet",
    project_issue_sync_description: "Synchroniser les problèmes de GitHub vers votre projet Plane",
    project_issue_sync_empty_state: "Les synchronisations de problèmes de projet mappées apparaîtront ici",
    configure_project_issue_sync_state: "Configurer l'état de synchronisation des problèmes",
    select_issue_sync_direction: "Sélectionner la direction de synchronisation des problèmes",
    allow_bidirectional_sync:
      "Bidirectionnel - Synchroniser les problèmes et les commentaires dans les deux directions entre GitHub et Plane",
    allow_unidirectional_sync:
      "Unidirectionnel - Synchroniser les problèmes et les commentaires de GitHub vers Plane uniquement",
    allow_unidirectional_sync_warning:
      "Les données du problème GitHub remplaceront les données dans l'élément de travail Plane lié (GitHub → Plane uniquement)",
    remove_project_issue_sync: "Supprimer cette synchronisation de problèmes de projet",
    remove_project_issue_sync_confirmation:
      "Êtes-vous sûr de vouloir supprimer cette synchronisation de problèmes de projet ?",
    add_pr_state_mapping: "Ajouter le mappage d'état des pull requests pour le projet Plane",
    edit_pr_state_mapping: "Modifier le mappage d'état des pull requests pour le projet Plane",
    pr_state_mapping: "Mappage d'état des pull requests",
    pr_state_mapping_description: "Mappez les états des pull requests de GitHub à votre projet Plane",
    pr_state_mapping_empty_state: "Les états de PR mappés apparaîtront ici",
    remove_pr_state_mapping: "Supprimer ce mappage d'état des pull requests",
    remove_pr_state_mapping_confirmation: "Êtes-vous sûr de vouloir supprimer ce mappage d'état des pull requests ?",
    issue_sync_message: "Les éléments de travail sont synchronisés avec {project}",
    link: "Lier le dépôt GitHub au projet Plane",
    pull_request_automation: "Automatisation des pull requests",
    pull_request_automation_description:
      "Configurer le mappage d'état des pull requests de GitHub vers votre projet Plane",
    DRAFT_MR_OPENED: "Ouverture d'un MR brouillon",
    MR_OPENED: "Ouverture d'un MR",
    MR_READY_FOR_MERGE: "Prêt pour la fusion",
    MR_REVIEW_REQUESTED: "Revue demandée",
    MR_MERGED: "Fusionné",
    MR_CLOSED: "Fermé",
    ISSUE_OPEN: "Problème Ouvert",
    ISSUE_CLOSED: "Problème Fermé",
    save: "Enregistrer",
    start_sync: "Démarrer la synchronisation",
    choose_repository: "Choisir le dépôt...",
  },
  gitlab_integration: {
    name: "GitLab",
    description: "Connectez et synchronisez vos demandes de fusion GitLab avec Plane.",
    connection_fetch_error: "Erreur lors de la récupération des détails de connexion du serveur",
    connect_org: "Connecter l'organisation",
    connect_org_description: "Connectez votre organisation GitLab avec Plane.",
    project_connections: "Connexions aux projets GitLab",
    project_connections_description: "Synchronisez les demandes de fusion de GitLab vers les projets Plane.",
    plane_project_connection: "Connexion au projet Plane",
    plane_project_connection_description:
      "Configurer le mappage d'état des pull requests de GitLab vers les projets Plane",
    remove_connection: "Supprimer la connexion",
    remove_connection_confirmation: "Êtes-vous sûr de vouloir supprimer cette connexion ?",
    link: "Lier le dépôt GitLab au projet Plane",
    pull_request_automation: "Automatisation des pull requests",
    pull_request_automation_description: "Configurer le mappage d'état des pull requests de GitLab vers Plane",
    DRAFT_MR_OPENED: "À l'ouverture d'une MR brouillon, définir l'état sur",
    MR_OPENED: "À l'ouverture d'une MR, définir l'état sur",
    MR_REVIEW_REQUESTED: "Quand une revue de MR est demandée, définir l'état sur",
    MR_READY_FOR_MERGE: "Quand la MR est prête pour la fusion, définir l'état sur",
    MR_MERGED: "Quand la MR est fusionnée, définir l'état sur",
    MR_CLOSED: "Quand la MR est fermée, définir l'état sur",
    integration_enabled_text:
      "Avec l'intégration GitLab activée, vous pouvez automatiser les flux de travail des éléments de travail",
    choose_entity: "Choisir l'entité",
    choose_project: "Choisir le projet",
    link_plane_project: "Lier le projet Plane",
    project_issue_sync: "Synchronisation des Issues du Projet",
    project_issue_sync_description: "Synchronisez les issues de Gitlab vers votre projet Plane",
    project_issue_sync_empty_state: "La synchronisation des issues du projet mappée apparaîtra ici",
    configure_project_issue_sync_state: "Configurer l'état de synchronisation des issues",
    select_issue_sync_direction: "Sélectionnez la direction de synchronisation des issues",
    allow_bidirectional_sync:
      "Bidirectionnel - Synchroniser les issues et commentaires dans les deux sens entre Gitlab et Plane",
    allow_unidirectional_sync:
      "Unidirectionnel - Synchroniser les issues et commentaires uniquement de Gitlab vers Plane",
    allow_unidirectional_sync_warning:
      "Les données de Gitlab Issue remplaceront les données dans l'élément de travail Plane lié (Gitlab → Plane uniquement)",
    remove_project_issue_sync: "Supprimer cette synchronisation des issues du projet",
    remove_project_issue_sync_confirmation:
      "Êtes-vous sûr de vouloir supprimer cette synchronisation des issues du projet ?",
    ISSUE_OPEN: "Issue Ouverte",
    ISSUE_CLOSED: "Issue Fermée",
    save: "Enregistrer",
    start_sync: "Démarrer la synchronisation",
    choose_repository: "Choisir le dépôt...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Connectez et synchronisez votre instance Gitlab Enterprise avec Plane.",
    app_form_title: "Configuration Gitlab Enterprise",
    app_form_description: "Configurez Gitlab Enterprise pour vous connecter à Plane.",
    base_url_title: "URL de base",
    base_url_description: "L'URL de base de votre instance Gitlab Enterprise.",
    base_url_placeholder: 'ex. "https://glab.plane.town"',
    base_url_error: "L'URL de base est requise",
    invalid_base_url_error: "URL de base invalide",
    client_id_title: "ID d'App",
    client_id_description: "L'ID de l'app que vous avez créée dans votre instance Gitlab Enterprise.",
    client_id_placeholder: 'ex. "7cd732xxxxxxxxxxxxxx"',
    client_id_error: "L'ID d'App est requis",
    client_secret_title: "Client Secret",
    client_secret_description: "Le client secret de l'app que vous avez créée dans votre instance Gitlab Enterprise.",
    client_secret_placeholder: 'ex. "gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "Le client secret est requis",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description:
      "Un webhook secret aléatoire qui sera utilisé pour vérifier le webhook depuis l'instance Gitlab Enterprise.",
    webhook_secret_placeholder: 'ex. "webhook1234567890"',
    webhook_secret_error: "Le webhook secret est requis",
    connect_app: "Connecter l'App",
  },
  slack_integration: {
    name: "Slack",
    description: "Connectez votre espace de travail Slack avec Plane.",
    connect_personal_account: "Connectez votre compte Slack personnel avec Plane.",
    personal_account_connected: "Votre compte personnel {providerName} est maintenant connecté à Plane.",
    link_personal_account: "Liez votre compte personnel {providerName} à Plane.",
    connected_slack_workspaces: "Espaces de travail Slack connectés",
    connected_on: "Connecté le {date}",
    disconnect_workspace: "Déconnecter l'espace de travail {name}",
    alerts: {
      dm_alerts: {
        title:
          "Recevez des notifications dans les messages privés Slack pour les mises à jour importantes, rappels et alertes qui vous concernent.",
      },
    },
    project_updates: {
      title: "Mises à jour de Projet",
      description: "Configurez les notifications de mises à jour de projets pour vos projets",
      add_new_project_update: "Ajouter une nouvelle notification de mises à jour de projet",
      project_updates_empty_state: "Les projets connectés avec des Canaux Slack apparaîtront ici.",
      project_updates_form: {
        title: "Configurer les Mises à jour de Projet",
        description:
          "Recevez des notifications de mises à jour de projet dans Slack lorsque des éléments de travail sont créés",
        failed_to_load_channels: "Impossible de charger les canaux depuis Slack",
        project_dropdown: {
          placeholder: "Sélectionnez un projet",
          label: "Projet Plane",
          no_projects: "Aucun projet disponible",
        },
        channel_dropdown: {
          label: "Canal Slack",
          placeholder: "Sélectionnez un canal",
          no_channels: "Aucun canal disponible",
        },
        all_projects_connected: "Tous les projets sont déjà connectés à des canaux Slack.",
        all_channels_connected: "Tous les canaux Slack sont déjà connectés à des projets.",
        project_connection_success: "Connexion de projet créée avec succès",
        project_connection_updated: "Connexion de projet mise à jour avec succès",
        project_connection_deleted: "Connexion de projet supprimée avec succès",
        failed_delete_project_connection: "Échec de la suppression de la connexion de projet",
        failed_create_project_connection: "Échec de la création de la connexion de projet",
        failed_upserting_project_connection: "Échec de la mise à jour de la connexion de projet",
        failed_loading_project_connections:
          "Nous n'avons pas pu charger vos connexions de projet. Cela pourrait être dû à un problème de réseau ou un problème avec l'intégration.",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "Connectez votre espace de travail Sentry avec Plane.",
    connected_sentry_workspaces: "Espaces de travail Sentry connectés",
    connected_on: "Connecté le {date}",
    disconnect_workspace: "Déconnecter l'espace de travail {name}",
    state_mapping: {
      title: "Mapping d'état",
      description:
        "Mappez les états d'incident Sentry à vos états de projet. Configurez quels états utiliser lorsqu'un incident Sentry est résolu ou non résolu.",
      add_new_state_mapping: "Ajouter un nouveau mapping d'état",
      empty_state:
        "Aucun mapping d'état configuré. Créez votre premier mapping pour synchroniser les états d'incident Sentry avec vos états de projet.",
      failed_loading_state_mappings:
        "Nous n'avons pas pu charger vos mappings d'état. Cela pourrait être dû à un problème de réseau ou un problème avec l'intégration.",
      loading_project_states: "Chargement des états de projet...",
      error_loading_states: "Erreur lors du chargement des états",
      no_states_available: "Aucun état disponible",
      no_permission_states: "Vous n'avez pas la permission d'accéder aux états pour ce projet",
      states_not_found: "États de projet non trouvés",
      server_error_states: "Erreur serveur lors du chargement des états",
    },
  },
  oauth_bridge_integration: {
    name: "OAuth Bridge",
    description: "Valider les jetons IdP externes pour l'accès API.",
    header_description:
      "Validez les jetons OIDC/JWT émis par votre IdP (Azure AD, Okta, etc.) pour l'accès à l'API Plane.",
    connected: "Connecté",
    connect: "Connecter",
    uninstall: "Désinstaller",
    uninstalling: "Désinstallation...",
    install_success: "OAuth Bridge installé avec succès.",
    install_error: "Échec de l'installation d'OAuth Bridge.",
    uninstall_success: "OAuth Bridge désinstallé.",
    uninstall_error: "Échec de la désinstallation d'OAuth Bridge.",
    token_providers: "Fournisseurs de jetons",
    token_providers_description: "Configurez les IdP externes dont les JWT sont acceptés comme identifiants API.",
    add_provider: "Ajouter un fournisseur",
    edit_provider: "Modifier le fournisseur",
    enabled: "Activé",
    disabled: "Désactivé",
    test: "Tester",
    no_providers_title: "Aucun fournisseur configuré.",
    no_providers_description: "Ajoutez un IdP pour activer l'authentification par jeton externe.",
    provider_updated: "Fournisseur mis à jour.",
    provider_added: "Fournisseur ajouté.",
    provider_save_error: "Échec de l'enregistrement du fournisseur.",
    provider_deleted: "Fournisseur supprimé.",
    provider_delete_error: "Échec de la suppression du fournisseur.",
    provider_update_error: "Échec de la mise à jour du fournisseur.",
    jwks_reachable: "JWKS accessible",
    jwks_unreachable: "JWKS inaccessible",
    jwks_test_error: "Impossible de récupérer le JWKS depuis l'URL configurée.",
    provider_form: {
      name_label: "Nom",
      name_placeholder: "ex. Azure AD Production",
      name_description: "Libellé lisible pour ce fournisseur d'identité",
      name_required: "Le nom est requis.",
      issuer_label: "Émetteur",
      issuer_placeholder: "https://login.microsoftonline.com/tenant-id/v2.0",
      issuer_description: "Valeur attendue du claim iss dans le JWT",
      issuer_required: "L'émetteur est requis.",
      jwks_url_label: "URL JWKS",
      jwks_url_placeholder: "https://login.microsoftonline.com/tenant-id/discovery/v2.0/keys",
      jwks_url_description: "Point de terminaison HTTPS servant le JSON Web Key Set du fournisseur",
      jwks_url_required: "L'URL JWKS est requise.",
      jwks_url_https: "L'URL JWKS doit utiliser HTTPS.",
      audience_label: "Audience",
      audience_placeholder: "api://my-app-id",
      audience_description: "Claim(s) aud attendu(s) dans le JWT, séparés par des virgules.",
      user_claim_label: "Claim utilisateur",
      user_claim_placeholder: "email",
      user_claim_description: "Claim JWT contenant l'adresse e-mail de l'utilisateur",
      user_claim_required: "Le claim utilisateur est requis.",
      allowed_algorithms_label: "Algorithmes de signature autorisés",
      allowed_algorithms_description: "Algorithmes asymétriques acceptés pour la vérification de signature JWT",
      allowed_algorithms_required: "Au moins un algorithme est requis.",
      select_algorithms: "Sélectionner les algorithmes",
      jwks_cache_ttl_label: "TTL du cache JWKS (secondes)",
      jwks_cache_ttl_description:
        "Durée de mise en cache des clés JWKS du fournisseur (minimum 60s, par défaut 24 heures)",
      jwks_cache_ttl_min: "Le TTL du cache doit être d'au moins 60 secondes.",
      rate_limit_label: "Limite de débit",
      rate_limit_placeholder: "120/minute",
      rate_limit_description:
        "Limitation des requêtes au format nombre/période (ex. 120/minute). Laisser vide pour la limite par défaut.",
      enable_provider: "Activer ce fournisseur",
      saving: "Enregistrement...",
      update: "Mettre à jour",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "Connectez et synchronisez votre organisation GitHub Enterprise avec Plane.",
    app_form_title: "Configuration GitHub Enterprise",
    app_form_description: "Configurez GitHub Enterprise pour se connecter avec Plane.",
    app_id_title: "ID de l'app",
    app_id_description: "L'ID de l'app que vous avez créée dans votre organisation GitHub Enterprise.",
    app_id_placeholder: 'e.g., "1234567890"',
    app_id_error: "App ID est requis",
    app_name_title: "Slug de l'app",
    app_name_description: "Le slug de l'app que vous avez créée dans votre organisation GitHub Enterprise.",
    app_name_error: "App slug est requis",
    app_name_placeholder: 'e.g., "plane-github-enterprise"',
    base_url_title: "URL de base",
    base_url_description: "L'URL de base de votre organisation GitHub Enterprise.",
    base_url_placeholder: 'e.g., "https://gh.plane.town"',
    base_url_error: "URL de base est requise",
    invalid_base_url_error: "URL de base invalide",
    client_id_title: "ID client",
    client_id_description: "L'ID client de l'app que vous avez créée dans votre organisation GitHub Enterprise.",
    client_id_placeholder: 'e.g., "1234567890"',
    client_id_error: "ID client est requis",
    client_secret_title: "Secret client",
    client_secret_description:
      "Le secret client de l'app que vous avez créée dans votre organisation GitHub Enterprise.",
    client_secret_placeholder: 'e.g., "1234567890"',
    client_secret_error: "Secret client est requis",
    webhook_secret_title: "Secret webhook",
    webhook_secret_description:
      "Le secret webhook de l'app que vous avez créée dans votre organisation GitHub Enterprise.",
    webhook_secret_placeholder: 'e.g., "1234567890"',
    webhook_secret_error: "Secret webhook est requis",
    private_key_title: "Clé privée (Base64 codée)",
    private_key_description: "Clé privée de l'app que vous avez créée dans votre organisation GitHub Enterprise.",
    private_key_placeholder: 'e.g., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Clé privée est requise",
    connect_app: "Connecter l'app",
  },
  file_upload: {
    upload_text: "Cliquez ici pour télécharger le fichier",
    drag_drop_text: "Glisser-déposer",
    processing: "Traitement",
    invalid: "Type de fichier invalide",
    missing_fields: "Champs manquants",
    success: "{fileName} téléchargé !",
  },
  silo_errors: {
    invalid_query_params: "Les paramètres de requête fournis sont invalides ou des champs requis sont manquants",
    invalid_installation_account: "Le compte d'installation fourni n'est pas valide",
    generic_error: "Une erreur inattendue s'est produite lors du traitement de votre demande",
    connection_not_found: "La connexion demandée n'a pas pu être trouvée",
    multiple_connections_found: "Plusieurs connexions ont été trouvées alors qu'une seule était attendue",
    installation_not_found: "L'installation demandée n'a pas pu être trouvée",
    user_not_found: "L'utilisateur demandé n'a pas pu être trouvé",
    error_fetching_token: "Échec de la récupération du jeton d'authentification",
    cannot_create_multiple_connections:
      "Vous avez déjà connecté votre organisation avec un espace de travail. Veuillez déconnecter la connexion existante avant de connecter une nouvelle.",
    invalid_app_credentials: "Les informations d'identification de l'application fournies sont invalides",
    invalid_app_installation_id: "Échec de l'installation de l'application",
  },
  import_status: {
    queued: "En attente",
    created: "Créé",
    initiated: "Initié",
    pulling: "Extraction",
    timed_out: "Temps écoulé",
    pulled: "Extrait",
    transforming: "Transformation",
    transformed: "Transformé",
    pushing: "Envoi",
    finished: "Terminé",
    error: "Erreur",
    cancelled: "Annulé",
  },
  jira_importer: {
    jira_importer_description: "Importez vos données Jira dans les projets Plane.",
    create_project_automatically: "Créer un projet automatiquement",
    create_project_automatically_description:
      "Nous créerons un nouveau projet pour vous en fonction des détails du projet Jira.",
    import_to_existing_project: "Importer dans un projet existant",
    import_to_existing_project_description: "Choisissez un projet existant dans le menu déroulant ci-dessous.",
    state_mapping_automatic_creation: "Tous les états Jira seront automatiquement créés dans Plane.",
    personal_access_token: "Jeton d'accès personnel",
    user_email: "Email utilisateur",
    atlassian_security_settings: "Paramètres de sécurité Atlassian",
    email_description: "Il s'agit de l'email lié à votre jeton d'accès personnel",
    jira_domain: "Domaine Jira",
    jira_domain_description: "Il s'agit du domaine de votre instance Jira",
    steps: {
      title_configure_plane: "Configurer Plane",
      description_configure_plane:
        "Veuillez d'abord créer le projet dans Plane où vous souhaitez migrer vos données Jira. Une fois le projet créé, sélectionnez-le ici.",
      title_configure_jira: "Configurer Jira",
      description_configure_jira:
        "Veuillez sélectionner l'espace de travail Jira à partir duquel vous souhaitez migrer vos données.",
      title_import_users: "Importer les utilisateurs",
      description_import_users:
        "Veuillez ajouter les utilisateurs que vous souhaitez migrer de Jira vers Plane. Alternativement, vous pouvez ignorer cette étape et ajouter manuellement les utilisateurs plus tard.",
      title_map_states: "Mapper les états",
      description_map_states:
        "Nous avons automatiquement fait correspondre les statuts Jira aux états Plane au mieux de nos capacités. Veuillez mapper les états restants avant de continuer, vous pouvez également créer des états et les mapper manuellement.",
      title_map_priorities: "Mapper les priorités",
      description_map_priorities:
        "Nous avons automatiquement fait correspondre les priorités au mieux de nos capacités. Veuillez mapper les priorités restantes avant de continuer.",
      title_summary: "Résumé",
      description_summary: "Voici un résumé des données qui seront migrées de Jira vers Plane.",
      custom_jql_filter: "Filtre JQL personnalisé",
      jql_filter_description: "Utilisez JQL pour filtrer des tickets spécifiques pour l'importation.",
      project_code: "PROJET",
      enter_filters_placeholder: "Entrez des filtres (par ex. status = 'In Progress')",
      validating_query: "Validation de la requête...",
      validation_successful_work_items_selected: "Validation réussie, {count} éléments de travail sélectionnés.",
      run_syntax_check: "Exécuter la vérification de syntaxe pour valider votre requête",
      refresh: "Actualiser",
      check_syntax: "Vérifier la syntaxe",
      no_work_items_selected: "Aucun élément de travail sélectionné par la requête.",
      validation_error_default: "Une erreur s'est produite lors de la validation de la requête.",
    },
  },
  asana_importer: {
    asana_importer_description: "Importez vos données Asana dans les projets Plane.",
    select_asana_priority_field: "Sélectionner le champ de priorité Asana",
    steps: {
      title_configure_plane: "Configurer Plane",
      description_configure_plane:
        "Veuillez d'abord créer le projet dans Plane où vous souhaitez migrer vos données Asana. Une fois le projet créé, sélectionnez-le ici.",
      title_configure_asana: "Configurer Asana",
      description_configure_asana:
        "Veuillez sélectionner l'espace de travail et le projet Asana à partir desquels vous souhaitez migrer vos données.",
      title_map_states: "Mapper les états",
      description_map_states:
        "Veuillez sélectionner les états Asana que vous souhaitez mapper aux statuts du projet Plane.",
      title_map_priorities: "Mapper les priorités",
      description_map_priorities:
        "Veuillez sélectionner les priorités Asana que vous souhaitez mapper aux priorités du projet Plane.",
      title_summary: "Résumé",
      description_summary: "Voici un résumé des données qui seront migrées d'Asana vers Plane.",
    },
  },
  linear_importer: {
    linear_importer_description: "Importez vos données Linear dans les projets Plane.",
    steps: {
      title_configure_plane: "Configurer Plane",
      description_configure_plane:
        "Veuillez d'abord créer le projet dans Plane où vous souhaitez migrer vos données Linear. Une fois le projet créé, sélectionnez-le ici.",
      title_configure_linear: "Configurer Linear",
      description_configure_linear:
        "Veuillez sélectionner l'équipe Linear à partir de laquelle vous souhaitez migrer vos données.",
      title_map_states: "Mapper les états",
      description_map_states:
        "Nous avons automatiquement fait correspondre les statuts Linear aux états Plane au mieux de nos capacités. Veuillez mapper les états restants avant de continuer, vous pouvez également créer des états et les mapper manuellement.",
      title_map_priorities: "Mapper les priorités",
      description_map_priorities:
        "Veuillez sélectionner les priorités Linear que vous souhaitez mapper aux priorités du projet Plane.",
      title_summary: "Résumé",
      description_summary: "Voici un résumé des données qui seront migrées de Linear vers Plane.",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "Importez vos données Jira Server/Data Center dans les projets Plane.",
    steps: {
      title_configure_plane: "Configurer Plane",
      description_configure_plane:
        "Veuillez d'abord créer le projet dans Plane où vous souhaitez migrer vos données Jira. Une fois le projet créé, sélectionnez-le ici.",
      title_configure_jira: "Configurer Jira",
      description_configure_jira:
        "Veuillez sélectionner l'espace de travail Jira à partir duquel vous souhaitez migrer vos données.",
      title_map_states: "Mapper les états",
      description_map_states:
        "Veuillez sélectionner les états Jira que vous souhaitez mapper aux statuts du projet Plane.",
      title_map_priorities: "Mapper les priorités",
      description_map_priorities:
        "Veuillez sélectionner les priorités Jira que vous souhaitez mapper aux priorités du projet Plane.",
      title_summary: "Résumé",
      description_summary: "Voici un résumé des données qui seront migrées de Jira vers Plane.",
    },
    import_epics: {
      title: "Importer les épopées en tant qu'éléments de travail",
      description:
        "Si cette option est activée, vos épopées seront importées en tant qu'éléments de travail avec le type d'élément de travail épopée.",
    },
  },
  notion_importer: {
    notion_importer_description: "Importez vos données Notion dans les projets Plane.",
    steps: {
      title_upload_zip: "Télécharger le ZIP exporté de Notion",
      description_upload_zip: "Veuillez télécharger le fichier ZIP contenant vos données Notion.",
    },
    upload: {
      drop_file_here: "Déposez votre fichier zip Notion ici",
      upload_title: "Télécharger l'export Notion",
      upload_from_url: "Importer depuis une URL",
      upload_from_url_description: "Collez l'URL publique de votre export ZIP pour continuer.",
      drag_drop_description: "Glissez-déposez votre fichier zip d'export Notion, ou cliquez pour parcourir",
      file_type_restriction: "Seuls les fichiers .zip exportés depuis Notion sont pris en charge",
      select_file: "Sélectionner un fichier",
      uploading: "Téléchargement...",
      preparing_upload: "Préparation du téléchargement...",
      confirming_upload: "Confirmation du téléchargement...",
      confirming: "Confirmation...",
      upload_complete: "Téléchargement terminé",
      upload_failed: "Échec du téléchargement",
      start_import: "Commencer l'importation",
      retry_upload: "Réessayer le téléchargement",
      upload: "Télécharger",
      ready: "Prêt",
      error: "Erreur",
      upload_complete_message: "Téléchargement terminé !",
      upload_complete_description:
        'Cliquez sur "Commencer l\'importation" pour commencer le traitement de vos données Notion.',
      upload_progress_message: "Veuillez ne pas fermer cette fenêtre.",
    },
  },
  confluence_importer: {
    confluence_importer_description: "Importez vos données Confluence dans le wiki Plane.",
    steps: {
      title_upload_zip: "Télécharger le ZIP exporté de Confluence",
      description_upload_zip: "Veuillez télécharger le fichier ZIP contenant vos données Confluence.",
    },
    upload: {
      drop_file_here: "Déposez votre fichier zip Confluence ici",
      upload_title: "Télécharger l'export Confluence",
      upload_from_url: "Importer depuis une URL",
      upload_from_url_description: "Collez l'URL publique de votre export ZIP pour continuer.",
      drag_drop_description: "Glissez-déposez votre fichier zip d'export Confluence, ou cliquez pour parcourir",
      file_type_restriction: "Seuls les fichiers .zip exportés depuis Confluence sont pris en charge",
      select_file: "Sélectionner un fichier",
      uploading: "Téléchargement...",
      preparing_upload: "Préparation du téléchargement...",
      confirming_upload: "Confirmation du téléchargement...",
      confirming: "Confirmation...",
      upload_complete: "Téléchargement terminé",
      upload_failed: "Échec du téléchargement",
      start_import: "Commencer l'importation",
      retry_upload: "Réessayer le téléchargement",
      upload: "Télécharger",
      ready: "Prêt",
      error: "Erreur",
      upload_complete_message: "Téléchargement terminé !",
      upload_complete_description:
        'Cliquez sur "Commencer l\'importation" pour commencer le traitement de vos données Confluence.',
      upload_progress_message: "Veuillez ne pas fermer cette fenêtre.",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "Importez vos données CSV dans les projets Plane.",
    steps: {
      title_configure_plane: "Configurer Plane",
      description_configure_plane:
        "Veuillez d'abord créer le projet dans Plane où vous souhaitez migrer vos données CSV. Une fois le projet créé, sélectionnez-le ici.",
      title_configure_csv: "Configurer CSV",
      description_configure_csv:
        "Veuillez télécharger votre fichier CSV et configurer les champs à mapper aux champs Plane.",
    },
  },
  csv_importer: {
    csv_importer_description: "Importez des éléments de travail à partir de fichiers CSV dans les projets Plane.",
    steps: {
      title_select_project: "Sélectionner le projet",
      description_select_project:
        "Veuillez sélectionner le projet Plane où vous souhaitez importer vos éléments de travail.",
      title_upload_csv: "Télécharger le CSV",
      description_upload_csv:
        "Téléchargez votre fichier CSV contenant les éléments de travail. Le fichier doit inclure des colonnes pour le nom, la description, la priorité, les dates et le groupe d'état.",
    },
  },
  clickup_importer: {
    clickup_importer_description: "Importez vos données ClickUp dans les projets Plane.",
    select_service_space: "Sélectionner l'espace {serviceName}",
    select_service_folder: "Sélectionner le dossier {serviceName}",
    selected: "Sélectionné",
    users: "Utilisateurs",
    steps: {
      title_configure_plane: "Configurer Plane",
      description_configure_plane:
        "Veuillez d'abord créer le projet dans Plane où vous souhaitez migrer vos données ClickUp. Une fois le projet créé, sélectionnez-le ici.",
      title_configure_clickup: "Configurer ClickUp",
      description_configure_clickup:
        "Veuillez sélectionner l'équipe, l'espace et le dossier ClickUp à partir desquels vous souhaitez migrer vos données.",
      title_map_states: "Mapper les états",
      description_map_states:
        "Nous avons automatiquement fait correspondre les statuts ClickUp aux états Plane au mieux de nos capacités. Veuillez mapper les états restants avant de continuer, vous pouvez également créer des états et les mapper manuellement.",
      title_map_priorities: "Mapper les priorités",
      description_map_priorities:
        "Veuillez sélectionner les priorités ClickUp que vous souhaitez mapper aux priorités du projet Plane.",
      title_summary: "Résumé",
      description_summary: "Voici un résumé des données qui seront migrées de ClickUp vers Plane.",
      pull_additional_data_title: "Importer les commentaires et les pièces jointes",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "Barre",
          long_label: "Graphique à barres",
          chart_models: {
            basic: "Basique",
            stacked: "Empilé",
            grouped: "Groupé",
          },
          orientation: {
            label: "Orientation",
            horizontal: "Horizontale",
            vertical: "Verticale",
            placeholder: "Ajouter une orientation",
          },
          bar_color: "Couleur de barre",
        },
        line_chart: {
          short_label: "Ligne",
          long_label: "Graphique linéaire",
          chart_models: {
            basic: "Basique",
            multi_line: "Multi-lignes",
          },
          line_color: "Couleur de ligne",
          line_type: {
            label: "Type de ligne",
            solid: "Pleine",
            dashed: "Pointillée",
            placeholder: "Ajouter un type de ligne",
          },
        },
        area_chart: {
          short_label: "Zone",
          long_label: "Graphique en zone",
          chart_models: {
            basic: "Basique",
            stacked: "Empilé",
            comparison: "Comparaison",
          },
          fill_color: "Couleur de remplissage",
        },
        donut_chart: {
          short_label: "Anneau",
          long_label: "Graphique en anneau",
          chart_models: {
            basic: "Basique",
            progress: "Progression",
          },
          center_value: "Valeur centrale",
          completed_color: "Couleur de complétion",
        },
        pie_chart: {
          short_label: "Secteur",
          long_label: "Graphique en secteurs",
          chart_models: {
            basic: "Basique",
          },
          group: {
            label: "Pièces groupées",
            group_thin_pieces: "Grouper les petites pièces",
            minimum_threshold: {
              label: "Seuil minimum",
              placeholder: "Ajouter un seuil",
            },
            name_group: {
              label: "Nom du groupe",
              placeholder: '"Moins de 5%"',
            },
          },
          show_values: "Afficher les valeurs",
          value_type: {
            percentage: "Pourcentage",
            count: "Nombre",
          },
        },
        text: {
          short_label: "Texte",
          long_label: "Texte",
          alignment: {
            label: "Alignement du texte",
            left: "Gauche",
            center: "Centre",
            right: "Droite",
            placeholder: "Ajouter un alignement de texte",
          },
          text_color: "Couleur du texte",
        },
        table_chart: {
          short_label: "Tableau",
          long_label: "Graphique en tableau",
          chart_models: {
            basic: {
              short_label: "Basique",
              long_label: "Tableau",
            },
          },
          columns: "Colonnes",
          rows: "Lignes",
          rows_placeholder: "Ajouter des lignes",
          configure_rows_hint: "Sélectionnez une propriété pour les lignes pour afficher ce tableau.",
        },
      },
      color_palettes: {
        modern: "Moderne",
        horizon: "Horizon",
        earthen: "Terreux",
      },
      common: {
        add_widget: "Ajouter un widget",
        widget_title: {
          label: "Nommez ce widget",
          placeholder: 'ex., "À faire hier", "Tous Terminés"',
        },
        chart_type: "Type de graphique",
        visualization_type: {
          label: "Type de visualisation",
          placeholder: "Ajouter un type de visualisation",
        },
        date_group: {
          label: "Groupe de dates",
          placeholder: "Ajouter un groupe de dates",
        },
        group_by: "Grouper par",
        stack_by: "Empiler par",
        daily: "Quotidien",
        weekly: "Hebdomadaire",
        monthly: "Mensuel",
        yearly: "Annuel",
        work_item_count: "Nombre d'éléments de travail",
        estimate_point: "Point d'estimation",
        pending_work_item: "Éléments de travail en attente",
        completed_work_item: "Éléments de travail terminés",
        in_progress_work_item: "Éléments de travail en cours",
        blocked_work_item: "Éléments de travail bloqués",
        work_item_due_this_week: "Éléments de travail à échéance cette semaine",
        work_item_due_today: "Éléments de travail à échéance aujourd'hui",
        color_scheme: {
          label: "Schéma de couleurs",
          placeholder: "Ajouter un schéma de couleurs",
        },
        smoothing: "Lissage",
        markers: "Marqueurs",
        legends: "Légendes",
        tooltips: "Infobulles",
        opacity: {
          label: "Opacité",
          placeholder: "Ajouter une opacité",
        },
        border: "Bordure",
        widget_configuration: "Configuration du widget",
        configure_widget: "Configurer le widget",
        guides: "Guides",
        style: "Style",
        area_appearance: "Apparence de la zone",
        comparison_line_appearance: "Apparence de la ligne de comparaison",
        add_property: "Ajouter une propriété",
        add_metric: "Ajouter une métrique",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "L'axe X manque d'une valeur.",
            y_axis_metric: "La métrique manque d'une valeur.",
          },
          stacked: {
            x_axis_property: "L'axe X manque d'une valeur.",
            y_axis_metric: "La métrique manque d'une valeur.",
            group_by: "Empiler par manque d'une valeur.",
          },
          grouped: {
            x_axis_property: "L'axe X manque d'une valeur.",
            y_axis_metric: "La métrique manque d'une valeur.",
            group_by: "Grouper par manque d'une valeur.",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "L'axe X manque d'une valeur.",
            y_axis_metric: "La métrique manque d'une valeur.",
          },
          multi_line: {
            x_axis_property: "L'axe X manque d'une valeur.",
            y_axis_metric: "La métrique manque d'une valeur.",
            group_by: "Grouper par manque d'une valeur.",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "L'axe X manque d'une valeur.",
            y_axis_metric: "La métrique manque d'une valeur.",
          },
          stacked: {
            x_axis_property: "L'axe X manque d'une valeur.",
            y_axis_metric: "La métrique manque d'une valeur.",
            group_by: "Empiler par manque d'une valeur.",
          },
          comparison: {
            x_axis_property: "L'axe X manque d'une valeur.",
            y_axis_metric: "La métrique manque d'une valeur.",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "L'axe X manque d'une valeur.",
            y_axis_metric: "La métrique manque d'une valeur.",
          },
          progress: {
            y_axis_metric: "La métrique manque d'une valeur.",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "L'axe X manque d'une valeur.",
            y_axis_metric: "La métrique manque d'une valeur.",
          },
        },
        text: {
          basic: {
            y_axis_metric: "La métrique manque d'une valeur.",
          },
        },
        table_chart: {
          basic: {
            x_axis_property: "Il manque une valeur aux colonnes.",
            group_by: "Il manque une valeur aux lignes.",
          },
        },
        ask_admin: "Demandez à votre administrateur de configurer ce widget.",
      },
    },
    create_modal: {
      heading: {
        create: "Créer un nouveau tableau de bord",
        update: "Mettre à jour le tableau de bord",
      },
      title: {
        label: "Nommez votre tableau de bord.",
        placeholder:
          '"Capacité à travers les projets", "Charge de travail par équipe", "État à travers tous les projets"',
        required_error: "Le titre est requis",
      },
      project: {
        label: "Choisir les projets",
        placeholder: "Les données de ces projets alimenteront ce tableau de bord.",
        required_error: "Les projets sont requis",
      },
      filters_label: "Définissez des filtres pour les sources de données ci-dessus",
      create_dashboard: "Créer le tableau de bord",
      update_dashboard: "Mettre à jour le tableau de bord",
    },
    delete_modal: {
      heading: "Supprimer le tableau de bord",
    },
    empty_state: {
      feature_flag: {
        title: "Présentez votre progression dans des tableaux de bord à la demande et permanents.",
        description:
          "Construisez n'importe quel tableau de bord dont vous avez besoin et personnalisez l'apparence de vos données pour une présentation parfaite de votre progression.",
        coming_soon_to_mobile: "Bientôt disponible sur l'application mobile",
        card_1: {
          title: "Pour tous vos projets",
          description:
            "Obtenez une vision globale de votre espace de travail avec tous vos projets ou filtrez vos données de travail pour cette vision parfaite de votre progression.",
        },
        card_2: {
          title: "Pour toutes les données dans Plane",
          description:
            "Allez au-delà de l'Analytique prédéfinie et des graphiques de Cycle prêts à l'emploi pour regarder les équipes, les initiatives ou tout autre élément comme vous ne l'avez jamais fait auparavant.",
        },
        card_3: {
          title: "Pour tous vos besoins de visualisation de données",
          description:
            "Choisissez parmi plusieurs graphiques personnalisables avec des contrôles précis pour voir et montrer vos données de travail exactement comme vous le souhaitez.",
        },
        card_4: {
          title: "À la demande et permanents",
          description:
            "Construisez une fois, conservez pour toujours avec des rafraîchissements automatiques de vos données, des indicateurs contextuels pour les changements de portée et des liens permanents partageables.",
        },
        card_5: {
          title: "Exportations et communications programmées",
          description:
            "Pour ces moments où les liens ne fonctionnent pas, exportez vos tableaux de bord en PDF ponctuels ou programmez leur envoi automatique aux parties prenantes.",
        },
        card_6: {
          title: "Mise en page automatique pour tous les appareils",
          description:
            "Redimensionnez vos widgets pour la mise en page que vous souhaitez et voyez-la exactement de la même façon sur mobile, tablette et autres navigateurs.",
        },
      },
      dashboards_list: {
        title:
          "Visualisez les données dans les widgets, construisez vos tableaux de bord avec des widgets et consultez les dernières informations à la demande.",
        description:
          "Construisez vos tableaux de bord avec des Widgets Personnalisés qui affichent vos données dans la portée que vous spécifiez. Obtenez des tableaux de bord pour tout votre travail à travers les projets et les équipes et partagez des liens permanents avec les parties prenantes pour un suivi à la demande.",
      },
      dashboards_search: {
        title: "Cela ne correspond pas au nom d'un tableau de bord.",
        description: "Assurez-vous que votre requête est correcte ou essayez une autre requête.",
      },
      widgets_list: {
        title: "Visualisez vos données comme vous le souhaitez.",
        description:
          "Utilisez des lignes, des barres, des camemberts et d'autres formats pour voir vos données comme vous le souhaitez à partir des sources que vous spécifiez.",
      },
      widget_data: {
        title: "Rien à voir ici",
        description: "Rafraîchissez ou ajoutez des données pour les voir ici.",
      },
    },
    common: {
      editing: "Modification",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "Autoriser les nouveaux éléments de travail",
      work_item_creation_disable_tooltip: "La création d'éléments de travail est désactivée pour cet état",
      default_state:
        "L'état par défaut permet à tous les membres de créer de nouveaux éléments de travail. Cela ne peut pas être changé",
      state_change_count:
        "{count, plural, one {1 changement d'état autorisé} other {{count} changements d'état autorisés}}",
      movers_count: "{count, plural, one {1 réviseur listé} other {{count} réviseurs listés}}",
      state_changes: {
        label: {
          default: "Ajouter un changement d'état autorisé",
          loading: "En train d'ajouter un changement d'état autorisé",
        },
        move_to: "Changer l'état vers",
        movers: {
          label: "Lorsqu'il est révisé par",
          tooltip:
            "Les réviseurs sont des personnes qui sont autorisées à changer l'état des éléments de travail d'un état à un autre.",
          add: "Ajouter des réviseurs",
        },
      },
    },
    workflow_disabled: {
      title: "Vous ne pouvez pas déplacer cet élément de travail ici.",
    },
    workflow_enabled: {
      label: "Changement d'état",
    },
    workflow_tree: {
      label: "Pour les éléments de travail dans",
      state_change_label: "peuvent le déplacer vers",
    },
    empty_state: {
      upgrade: {
        title: "Contrôlez le chaos des changements et des révisions avec les Workflows.",
        description:
          "Définissez des règles pour où votre travail se déplace, par qui, et quand avec les Workflows dans Plane.",
      },
    },
    quick_actions: {
      view_change_history: "Voir l'historique des changements",
      reset_workflow: "Réinitialiser le workflow",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "Êtes-vous sûr de vouloir réinitialiser ce workflow ?",
        description:
          "Si vous réinitialisez ce workflow, toutes vos règles de changement d'état seront supprimées et vous devrez les créer à nouveau pour qu'elles fonctionnent dans ce projet.",
      },
      delete_state_change: {
        title: "Êtes-vous sûr de vouloir supprimer cette règle de changement d'état ?",
        description:
          "Une fois supprimée, vous ne pourrez pas annuler ce changement et vous devrez établir la règle à nouveau si vous la souhaitez pour ce projet.",
      },
    },
    toasts: {
      enable_disable: {
        loading: "{action} les workflows",
        success: {
          title: "Succès",
          message: "Workflow {action} avec succès",
        },
        error: {
          title: "Erreur",
          message: "Le workflow ne pouvait pas être {action}. Veuillez réessayer.",
        },
      },
      reset: {
        success: {
          title: "Succès",
          message: "Workflow réinitialisé avec succès",
        },
        error: {
          title: "Erreur lors de la réinitialisation du workflow",
          message: "Le workflow ne pouvait pas être réinitialisé. Veuillez réessayer.",
        },
      },
      add_state_change_rule: {
        error: {
          title: "Erreur lors de l'ajout d'une règle de changement d'état",
          message: "La règle de changement d'état ne pouvait pas être ajoutée. Veuillez réessayer.",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "Erreur lors de la modification d'une règle de changement d'état",
          message: "La règle de changement d'état ne pouvait pas être modifiée. Veuillez réessayer.",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "Erreur lors de la suppression d'une règle de changement d'état",
          message: "La règle de changement d'état ne pouvait pas être supprimée. Veuillez réessayer.",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "Erreur lors de la modification des réviseurs de règle de changement d'état",
          message: "Les réviseurs de la règle de changement d'état ne pouvaient pas être modifiés. Veuillez réessayer.",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {Client} other {Clients}}",
    drop_down: {
      placeholder: "Sélectionner un client",
      required: "Veuillez sélectionner un client",
      no_selection: "Aucun client",
    },
    upgrade: {
      title: "Priorisez et gérez le travail avec vos clients.",
      description: "Associez votre travail aux clients et établissez des priorités en fonction de leurs attributs.",
    },
    properties: {
      default: {
        title: "Propriétés par défaut",
        customer_name: {
          name: "Nom du client",
          placeholder: "Cela peut être le nom d'une personne ou d'une entreprise",
          validation: {
            required: "Le nom du client est obligatoire.",
            max_length: "Le nom du client ne peut pas dépasser 255 caractères.",
          },
        },
        description: {
          name: "Description",
          validation: {},
        },
        email: {
          name: "E-mail",
          placeholder: "Entrez l'e-mail",
          validation: {
            required: "L'e-mail est obligatoire.",
            pattern: "Adresse e-mail invalide.",
          },
        },
        website_url: {
          name: "Site web",
          placeholder: "Toute URL avec https:// fonctionnera.",
          placeholder_short: "Ajouter un site web",
          validation: {
            pattern: "URL du site web invalide",
          },
        },
        employees: {
          name: "Employés",
          placeholder: "Nombre d'employés si votre client est une entreprise.",
          validation: {
            min_length: "Le nombre d'employés ne peut pas être inférieur à 0.",
            max_length: "Le nombre d'employés ne peut pas être supérieur à 2147483647.",
          },
        },
        size: {
          name: "Taille",
          placeholder: "Ajouter la taille de l'entreprise",
          validation: {
            min_length: "Taille invalide",
          },
        },
        domain: {
          domain: "Industrie",
          placeholder: "Retail, e-Commerce, Fintech, Banque",
          placeholder_short: "Ajouter un secteur",
          validation: {},
        },
        stage: {
          name: "Étape",
          placeholder: "Sélectionner une étape",
          validation: {},
        },
        contract_status: {
          name: "Statut du contrat",
          placeholder: "Sélectionner le statut du contrat",
          validation: {},
        },
        revenue: {
          name: "Revenu",
          placeholder: "Il s'agit du revenu annuel généré par votre client.",
          placeholder_short: "Ajouter un revenu",
          validation: {
            min_length: "Le revenu ne peut pas être inférieur à 0.",
          },
        },
        invalid_value: "Valeur de propriété invalide.",
      },
      custom: {
        title: "Propriétés personnalisées",
        info: "Ajoutez les attributs uniques de vos clients à Plane afin de mieux gérer les éléments de travail ou les enregistrements des clients.",
      },
      empty_state: {
        title: "Ajouter des propriétés personnalisées",
        description:
          "Les propriétés personnalisées que vous souhaitez mapper manuellement ou automatiquement à votre CRM apparaîtront ici.",
      },
      add: {
        primary_button: "Ajouter une nouvelle propriété",
      },
    },
    stage: {
      lead: "Lead",
      sales_qualified_lead: "Lead qualifié",
      contract_negotiation: "Négociation de contrat",
      closed_won: "Gagné",
      closed_lost: "Perdu",
    },
    contract_status: {
      active: "Actif",
      pre_contract: "Pré-contrat",
      signed: "Signé",
      inactive: "Inactif",
    },
    empty_state: {
      detail: {
        title: "Nous n'avons pas trouvé cet enregistrement de client.",
        description:
          "Le lien vers cet enregistrement pourrait être incorrect ou cet enregistrement pourrait avoir été supprimé.",
        primary_button: "Aller aux clients",
        secondary_button: "Ajouter un client",
      },
      search: {
        title: "Il semble que vous n'ayez aucun enregistrement client correspondant à ce terme.",
        description:
          "Essayez un autre terme de recherche ou contactez-nous si vous êtes sûr que des résultats devraient apparaître pour ce terme.",
      },
      list: {
        title:
          "Gérez le volume, le rythme et le flux de votre travail en fonction de ce qui est important pour vos clients.",
        description:
          "Avec les clients, une fonctionnalité exclusive à Plane, vous pouvez maintenant créer de nouveaux clients à partir de zéro et les connecter à votre travail. Bientôt, vous pourrez les importer depuis d'autres outils avec leurs attributs personnalisés qui comptent pour vous.",
        primary_button: "Ajouter votre premier client",
      },
    },
    settings: {
      unauthorized: "Vous n'êtes pas autorisé à accéder à cette page.",
      description: "Suivez et gérez les relations clients dans votre flux de travail.",
      enable: "Activer les clients",
      toasts: {
        enable: {
          loading: "Activation de la fonctionnalité clients...",
          success: {
            title: "Vous avez activé les clients pour cet espace de travail.",
            message:
              "Les membres peuvent désormais ajouter des enregistrements clients, les lier à des éléments de travail, et plus encore.",
          },
          error: {
            title: "Nous n'avons pas pu activer les clients cette fois.",
            message: "Réessayez ou revenez plus tard. Si cela ne fonctionne toujours pas.",
            action: "Contacter le support",
          },
        },
        disable: {
          loading: "Désactivation de la fonctionnalité clients...",
          success: {
            title: "Clients désactivés",
            message: "La fonctionnalité clients a été désactivée avec succès !",
          },
          error: {
            title: "Erreur",
            message: "Échec de la désactivation de la fonctionnalité clients !",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "Nous n'avons pas pu obtenir votre liste de clients.",
          message: "Réessayez ou actualisez cette page.",
        },
      },
      copy_link: {
        title: "Vous avez copié le lien direct vers ce client.",
        message: "Collez-le n'importe où et il vous ramènera directement ici.",
      },
      create: {
        success: {
          title: "{customer_name} est maintenant disponible",
          message: "Vous pouvez référencer ce client dans les éléments de travail et suivre leurs demandes également.",
          actions: {
            view: "Voir",
            copy_link: "Copier le lien",
            copied: "Copié !",
          },
        },
        error: {
          title: "Nous n'avons pas pu créer cet enregistrement cette fois.",
          message:
            "Essayez de le sauvegarder à nouveau ou copiez votre texte non enregistré dans une nouvelle entrée, de préférence dans un autre onglet.",
        },
      },
      update: {
        success: {
          title: "Succès !",
          message: "Client mis à jour avec succès !",
        },
        error: {
          title: "Erreur !",
          message: "Impossible de mettre à jour le client. Réessayez !",
        },
      },
      logo: {
        error: {
          title: "Nous n'avons pas pu télécharger le logo du client.",
          message: "Essayez de sauvegarder le logo à nouveau ou recommencez.",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "Vous avez supprimé un élément de travail de cet enregistrement de client.",
            message: "Nous avons également automatiquement supprimé ce client de l'élément de travail.",
          },
          error: {
            title: "Erreur !",
            message: "Nous n'avons pas pu supprimer cet élément de travail de cet enregistrement de client cette fois.",
          },
        },
        add: {
          error: {
            title: "Nous n'avons pas pu ajouter cet élément de travail à cet enregistrement de client cette fois.",
            message:
              "Essayez d'ajouter cet élément de travail à nouveau ou revenez-y plus tard. Si cela ne fonctionne toujours pas, contactez-nous.",
          },
          success: {
            title: "Vous avez ajouté un élément de travail à cet enregistrement de client.",
            message: "Nous avons également automatiquement ajouté ce client à l'élément de travail.",
          },
        },
      },
    },
    quick_actions: {
      edit: "Modifier",
      copy_link: "Copier le lien vers le client",
      delete: "Supprimer",
    },
    create: {
      label: "Créer un enregistrement client",
      loading: "Création en cours",
      cancel: "Annuler",
    },
    update: {
      label: "Mettre à jour le client",
      loading: "Mise à jour en cours",
    },
    delete: {
      title: "Êtes-vous sûr de vouloir supprimer l'enregistrement client {customer_name} ?",
      description:
        "Toutes les données associées à cet enregistrement seront définitivement supprimées. Vous ne pourrez pas restaurer cet enregistrement plus tard.",
    },
    requests: {
      empty_state: {
        list: {
          title: "Il n'y a encore aucune demande à afficher.",
          description: "Créez des demandes de vos clients pour pouvoir les lier à des éléments de travail.",
          button: "Ajouter une nouvelle demande",
        },
        search: {
          title: "Il semble que vous n'ayez aucune demande correspondant à ce terme.",
          description:
            "Essayez un autre terme de recherche ou contactez-nous si vous êtes sûr que des résultats devraient apparaître pour ce terme.",
        },
      },
      label: "{count, plural, one {Demande} other {Demandes}}",
      add: "Ajouter une demande",
      create: "Créer une demande",
      update: "Mettre à jour une demande",
      form: {
        name: {
          placeholder: "Nommez cette demande",
          validation: {
            required: "Le nom est obligatoire.",
            max_length: "Le nom de la demande ne doit pas dépasser 255 caractères.",
          },
        },
        description: {
          placeholder:
            "Décrivez la nature de la demande ou collez le commentaire de ce client provenant d'un autre outil.",
        },
        source: {
          add: "Ajouter une source",
          update: "Mettre à jour la source",
          url: {
            label: "URL",
            required: "L'URL est obligatoire",
            invalid: "URL du site web invalide",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "Lien copié",
          message: "Le lien de la demande du client a été copié dans le presse-papiers.",
        },
        attachment: {
          upload: {
            loading: "Téléchargement de la pièce jointe...",
            success: {
              title: "Pièce jointe téléchargée",
              message: "La pièce jointe a été téléchargée avec succès.",
            },
            error: {
              title: "Pièce jointe non téléchargée",
              message: "La pièce jointe n'a pas pu être téléchargée.",
            },
          },
          size: {
            error: {
              title: "Erreur !",
              message: "Un seul fichier peut être téléchargé à la fois.",
            },
          },
          length: {
            message: "Le fichier doit être de {size} Mo ou moins",
          },
          remove: {
            success: {
              title: "Pièce jointe supprimée",
              message: "La pièce jointe a été supprimée avec succès",
            },
            error: {
              title: "Pièce jointe non supprimée",
              message: "La pièce jointe n'a pas pu être supprimée",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "Succès !",
              message: "Source mise à jour avec succès !",
            },
            error: {
              title: "Erreur !",
              message: "Impossible de mettre à jour la source.",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "Erreur !",
              message: "Impossible d'ajouter des éléments de travail à la demande. Réessayez.",
            },
            success: {
              title: "Succès !",
              message: "Éléments de travail ajoutés à la demande.",
            },
          },
        },
        update: {
          success: {
            message: "Demande mise à jour avec succès !",
            title: "Succès !",
          },
          error: {
            title: "Erreur !",
            message: "Impossible de mettre à jour la demande. Réessayez !",
          },
        },
        create: {
          success: {
            message: "Demande créée avec succès !",
            title: "Succès !",
          },
          error: {
            title: "Erreur !",
            message: "Impossible de créer la demande. Réessayez !",
          },
        },
      },
    },
    linked_work_items: {
      label: "Éléments de travail liés",
      link: "Lier des éléments de travail",
      empty_state: {
        list: {
          title: "Vous ne semblez pas avoir lié d'éléments de travail à ce client pour le moment.",
          description:
            "Lieez des éléments de travail existants de n'importe quel projet ici pour pouvoir les suivre par ce client.",
          button: "Lier un élément de travail",
        },
      },
      action: {
        remove_epic: "Supprimer l'épique",
        remove: "Supprimer l'élément de travail",
      },
    },
    sidebar: {
      properties: "Propriétés",
    },
  },
  templates: {
    settings: {
      title: "Modèles",
      description:
        "Économisez 80% du temps consacré à la création de projets, d'éléments de travail et de pages lorsque vous utilisez des modèles.",
      options: {
        project: {
          label: "Modèles de projet",
        },
        work_item: {
          label: "Modèles d'éléments de travail",
        },
        page: {
          label: "Modèles de page",
        },
      },
      create_template: {
        label: "Créer un modèle",
        no_permission: {
          project: "Contactez l'administrateur de votre projet pour créer des modèles",
          workspace: "Contactez l'administrateur de votre espace de travail pour créer des modèles",
        },
      },
      use_template: {
        button: {
          default: "Utiliser le modèle",
          loading: "Utilisation",
        },
      },
      template_source: {
        workspace: {
          info: "Dérivé de l'espace de travail",
        },
        project: {
          info: "Dérivé du projet",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "Nommez votre modèle de projet.",
              validation: {
                required: "Le nom du modèle est requis",
                maxLength: "Le nom du modèle doit comporter moins de 255 caractères",
              },
            },
            description: {
              placeholder: "Décrivez quand et comment utiliser ce modèle.",
            },
          },
          name: {
            placeholder: "Nommez votre projet.",
            validation: {
              required: "Le titre du projet est requis",
              maxLength: "Le titre du projet doit comporter moins de 255 caractères",
            },
          },
          description: {
            placeholder: "Décrivez l'objectif et les buts de ce projet.",
          },
          button: {
            create: "Créer un modèle de projet",
            update: "Mettre à jour le modèle de projet",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "Nommez votre modèle d'élément de travail.",
              validation: {
                required: "Le nom du modèle est requis",
                maxLength: "Le nom du modèle doit comporter moins de 255 caractères",
              },
            },
            description: {
              placeholder: "Décrivez quand et comment utiliser ce modèle.",
            },
          },
          name: {
            placeholder: "Donnez un titre à cet élément de travail.",
            validation: {
              required: "Le titre de l'élément de travail est requis",
              maxLength: "Le titre de l'élément de travail doit comporter moins de 255 caractères",
            },
          },
          description: {
            placeholder:
              "Décrivez cet élément de travail afin qu'il soit clair ce que vous accomplirez lorsque vous le terminerez.",
          },
          button: {
            create: "Créer un modèle d'élément de travail",
            update: "Mettre à jour le modèle d'élément de travail",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "Nommez votre modèle de page.",
              validation: {
                required: "Le nom du modèle est requis",
                maxLength: "Le nom du modèle doit comporter moins de 255 caractères",
              },
            },
            description: {
              placeholder: "Décrivez quand et comment utiliser ce modèle.",
            },
          },
          name: {
            placeholder: "Page sans titre",
            validation: {
              maxLength: "Le nom de la page doit comporter moins de 255 caractères",
            },
          },
          button: {
            create: "Créer un modèle de page",
            update: "Mettre à jour le modèle de page",
          },
        },
        publish: {
          action: "{isPublished, select, true {Paramètres de publication} other {Publier sur le Marketplace}}",
          unpublish_action: "Retirer du Marketplace",
          title: "Rendez votre modèle découvrable et reconnaissable.",
          name: {
            label: "Nom du modèle",
            placeholder: "Nommez votre modèle",
            validation: {
              required: "Le nom du modèle est requis",
              maxLength: "Le nom du modèle doit comporter moins de 255 caractères",
            },
          },
          short_description: {
            label: "Description courte",
            placeholder:
              "Ce modèle est idéal pour les gestionnaires de projets qui gèrent plusieurs projets en même temps.",
            validation: {
              required: "La description courte est requise",
            },
          },
          description: {
            label: "Description",
            placeholder: `Améliorez la productivité et simplifiez la communication avec notre intégration de reconnaissance vocale.
• Transcription en temps réel : Convertissez les mots prononcés en texte précis instantanément.
• Création de tâches et de commentaires : Ajoutez des tâches, des descriptions et des commentaires via des commandes vocales.`,
            validation: {
              required: "La description est requise",
            },
          },
          category: {
            label: "Catégorie",
            placeholder: "Choisissez où vous pensez que cela correspond le mieux. Vous pouvez en choisir plusieurs.",
            validation: {
              required: "Au moins une catégorie est requise",
            },
          },
          keywords: {
            label: "Mots-clés",
            placeholder:
              "Utilisez des termes que vous pensez que vos utilisateurs rechercheront lorsqu'ils cherchent ce modèle.",
            helperText:
              "Entrez des mots-clés séparés par des virgules qui aideront les gens à trouver ce modèle dans la recherche.",
            validation: {
              required: "Au moins un mot-clé est requis",
            },
          },
          company_name: {
            label: "Nom de l'entreprise",
            placeholder: "Plane",
            validation: {
              required: "Le nom de l'entreprise est requis",
              maxLength: "Le nom de l'entreprise doit comporter moins de 255 caractères",
            },
          },
          contact_email: {
            label: "Adresse email du support",
            placeholder: "help@plane.so",
            validation: {
              invalid: "Adresse email invalide",
              required: "L'adresse email du support est requise",
              maxLength: "L'adresse email du support doit comporter moins de 255 caractères",
            },
          },
          privacy_policy_url: {
            label: "Lien vers votre politique de confidentialité",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "URL invalide",
              maxLength: "L'URL doit comporter moins de 800 caractères",
            },
          },
          terms_of_service_url: {
            label: "Lien vers vos conditions d'utilisation",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "URL invalide",
              maxLength: "L'URL doit comporter moins de 800 caractères",
            },
          },
          cover_image: {
            label: "Ajoutez une image de couverture qui sera affichée dans le Marketplace",
            upload_title: "Télécharger l'image de couverture",
            upload_placeholder:
              "Cliquez pour télécharger ou faites glisser et déposez pour télécharger une image de couverture",
            drop_here: "Déposer ici",
            click_to_upload: "Cliquer pour télécharger",
            invalid_file_or_exceeds_size_limit: "Fichier invalide ou dépasse la taille limite. Veuillez réessayer.",
            upload_and_save: "Télécharger et enregistrer",
            uploading: "Téléchargement",
            remove: "Supprimer",
            removing: "Suppression",
            validation: {
              required: "L'image de couverture est requise",
            },
          },
          attach_screenshots: {
            label:
              "Incluez des documents et des images que vous pensez rendront les utilisateurs de ce modèle plus intéressés.",
            validation: {
              required: "Au moins une capture d'écran est requise",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "Modèles",
        description:
          "Avec les modèles de projet, d'élément de travail et de page dans Plane, vous n'avez pas à créer un projet à partir de zéro ou à définir manuellement les propriétés des éléments de travail.",
        sub_description: "Récupérez 80% de votre temps d'administration lorsque vous utilisez des modèles.",
      },
      no_templates: {
        button: "Créez votre premier modèle",
      },
      no_labels: {
        description:
          " Aucune étiquette pour le moment. Créez des étiquettes pour aider à organiser et filtrer les éléments de travail dans votre projet.",
      },
      no_work_items: {
        description: "Aucun élément de travail pour le moment. Ajoutez-en un pour structurer votre travail mieux.",
      },
      no_sub_work_items: {
        description: "Aucun sous-élément de travail pour le moment. Ajoutez-en un pour structurer votre travail mieux.",
      },
      page: {
        no_templates: {
          title: "Il n'y a aucun modèle auquel vous avez accès.",
          description: "Veuillez créer un modèle",
        },
        no_results: {
          title: "Cela ne correspond à aucun modèle.",
          description: "Essayez de rechercher avec d'autres termes.",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "Modèle créé",
          message:
            "{templateName}, le modèle de {templateType}, est maintenant disponible pour votre espace de travail.",
        },
        error: {
          title: "Nous n'avons pas pu créer ce modèle cette fois-ci.",
          message:
            "Essayez d'enregistrer à nouveau vos détails ou copiez-les dans un nouveau modèle, de préférence dans un autre onglet.",
        },
      },
      update: {
        success: {
          title: "Modèle modifié",
          message: "{templateName}, le modèle de {templateType}, a été modifié.",
        },
        error: {
          title: "Nous n'avons pas pu enregistrer les modifications de ce modèle.",
          message:
            "Essayez d'enregistrer à nouveau vos détails ou revenez à ce modèle plus tard. Si vous rencontrez toujours des problèmes, contactez-nous.",
        },
      },
      delete: {
        success: {
          title: "Modèle supprimé",
          message: "{templateName}, le modèle de {templateType}, a été supprimé de votre espace de travail.",
        },
        error: {
          title: "Nous n'avons pas pu supprimer ce modèle cette fois-ci.",
          message:
            "Essayez de le supprimer à nouveau ou revenez-y plus tard. Si vous ne pouvez toujours pas le supprimer, contactez-nous.",
        },
      },
      unpublish: {
        success: {
          title: "Modèle retiré",
          message: "{templateName}, le modèle de {templateType}, a maintenant été retiré.",
        },
        error: {
          title: "Nous n'avons pas pu retirer ce modèle cette fois-ci.",
          message:
            "Essayez de le retirer à nouveau ou revenez-y plus tard. Si vous ne pouvez toujours pas le retirer, contactez-nous.",
        },
      },
    },
    delete_confirmation: {
      title: "Supprimer le modèle",
      description: {
        prefix: "Êtes-vous sûr de vouloir supprimer le modèle-",
        suffix:
          "? Toutes les données relatives au modèle seront définitivement supprimées. Cette action ne peut pas être annulée.",
      },
    },
    unpublish_confirmation: {
      title: "Retirer le modèle",
      description: {
        prefix: "Êtes-vous sûr de vouloir retirer le modèle-",
        suffix: "? Ce modèle ne sera plus disponible pour les utilisateurs sur le marketplace.",
      },
    },
    dropdown: {
      add: {
        work_item: "Ajouter un nouveau modèle",
        project: "Ajouter un nouveau modèle",
      },
      label: {
        project: "Choisir un modèle de projet",
        page: "Choisir à partir du modèle",
      },
      tooltip: {
        work_item: "Choisir un modèle d'élément de travail",
      },
      no_results: {
        work_item: "Aucun modèle trouvé.",
        project: "Aucun modèle trouvé.",
      },
    },
  },
  intake_forms: {
    create: {
      title: "Créer un élément de travail",
      "sub-title": "Faites savoir à l'équipe sur quoi vous aimeriez qu'elle travaille.",
      name: "Nom",
      email: "E-mail",
      about: "De quoi s'agit-il cet élément de travail ?",
      description: "Décrivez ce qui devrait se passer",
      description_placeholder:
        "Ajoutez autant de détails que vous le souhaitez pour aider l'équipe à identifier votre situation et vos besoins.",
      loading: "Création",
      create_work_item: "Créer l'élément de travail",
      errors: {
        name: "Le nom est requis",
        name_max_length: "Le nom doit contenir moins de 255 caractères",
        email: "L'e-mail est requis",
        email_invalid: "Adresse e-mail invalide",
        title: "Le titre est requis",
        title_max_length: "Le titre doit contenir moins de 255 caractères",
      },
    },
    success: {
      title: "Votre élément de travail est maintenant dans la file d'attente de l'équipe.",
      description: "L'équipe peut maintenant approuver ou rejeter cet élément de travail depuis sa file d'admission.",
      primary_button: {
        text: "Ajouter un autre élément de travail",
      },
      secondary_button: {
        text: "En savoir plus sur l'admission",
      },
    },
    how_it_works: {
      title: "Comment ça marche ?",
      heading: "Ceci est un formulaire d'admission.",
      description:
        "L'admission est une fonctionnalité Plane qui permet aux administrateurs et chefs de projet de recevoir des éléments de travail externes dans leurs projets.",
      steps: {
        step_1: "Ce court formulaire vous permet de créer un nouvel élément de travail dans un projet Plane.",
        step_2:
          "Lorsque vous soumettez ce formulaire, un nouvel élément de travail est créé dans l'admission de ce projet.",
        step_3: "Quelqu'un de ce projet ou de l'équipe le examinera.",
        step_4:
          "S'ils l'approuvent, cet élément sera déplacé vers la file de travail du projet. Sinon, il sera rejeté.",
        step_5:
          "Pour connaître le statut de cet élément, contactez le chef de projet, l'administrateur ou la personne qui vous a envoyé le lien vers cette page.",
      },
    },
    type_forms: {
      select_types: {
        title: "Sélectionner le type d'élément de travail",
        search_placeholder: "Rechercher un type d'élément de travail",
      },
      actions: {
        select_properties: "Sélectionner les propriétés",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "Éléments de travail récurrents",
      description:
        "Configurez votre travail récurrent une fois, et nous nous occuperons des répétitions. Vous verrez tout ici lorsque c'est le moment.",
      new_recurring_work_item: "Nouvel élément de travail récurrent",
      update_recurring_work_item: "Mettre à jour l'élément de travail récurrent",
      form: {
        interval: {
          title: "Planification",
          start_date: {
            validation: {
              required: "La date de début est requise",
            },
          },
          interval_type: {
            validation: {
              required: "Le type d'intervalle est requis",
            },
          },
        },
        button: {
          create: "Créer un élément de travail récurrent",
          update: "Mettre à jour l'élément de travail récurrent",
        },
      },
      create_button: {
        label: "Créer un élément de travail récurrent",
        no_permission: "Contactez votre administrateur de projet pour créer des éléments de travail récurrents",
      },
    },
    empty_state: {
      upgrade: {
        title: "Votre travail, en pilote automatique",
        description:
          "Configurez-le une fois. Nous vous le rappellerons quand il sera dû. Passez à Business pour rendre le travail récurrent sans effort.",
      },
      no_templates: {
        button: "Créez votre premier élément de travail récurrent",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Élément de travail récurrent créé",
          message: "{name}, l'élément de travail récurrent, est maintenant disponible dans votre espace de travail.",
        },
        error: {
          title: "Nous n'avons pas pu créer cet élément de travail récurrent cette fois.",
          message:
            "Essayez d'enregistrer vos informations à nouveau ou copiez-les dans un nouvel élément de travail récurrent, de préférence dans un autre onglet.",
        },
      },
      update: {
        success: {
          title: "Élément de travail récurrent modifié",
          message: "{name}, l'élément de travail récurrent, a été modifié.",
        },
        error: {
          title: "Nous n'avons pas pu enregistrer les modifications de cet élément de travail récurrent.",
          message:
            "Essayez d'enregistrer vos informations à nouveau ou revenez à cet élément de travail récurrent plus tard. Si le problème persiste, contactez-nous.",
        },
      },
      delete: {
        success: {
          title: "Élément de travail récurrent supprimé",
          message: "{name}, l'élément de travail récurrent, a été supprimé de votre espace de travail.",
        },
        error: {
          title: "Nous n'avons pas pu supprimer cet élément de travail récurrent.",
          message:
            "Essayez de le supprimer à nouveau ou revenez plus tard. Si vous ne pouvez toujours pas le supprimer, contactez-nous.",
        },
      },
    },
    delete_confirmation: {
      title: "Supprimer l'élément de travail récurrent",
      description: {
        prefix: "Êtes-vous sûr de vouloir supprimer l'élément de travail récurrent-",
        suffix:
          "? Toutes les données liées à l'élément de travail récurrent seront définitivement supprimées. Cette action ne peut pas être annulée.",
      },
    },
  },
  automations: {
    settings: {
      title: "Automatisations personnalisées",
      create_automation: "Créer une automatisation",
    },
    scope: {
      label: "Portée",
      run_on: "Exécuter sur",
    },
    trigger: {
      label: "Déclencheur",
      add_trigger: "Ajouter un déclencheur",
      sidebar_header: "Configuration du déclencheur",
      input_label: "Quel est le déclencheur pour cette automatisation ?",
      input_placeholder: "Sélectionnez une option",
      section_plane_events: "Événements Plane",
      section_time_based: "Basé sur le temps",
      fixed_schedule: "Horaire fixe",
      schedule: {
        frequency: "Fréquence",
        select_day: "Sélectionner un jour",
        day_of_month: "Jour du mois",
        monthly_every: "Chaque",
        monthly_day_aria: "Jour {day}",
        time: "Heure",
        hour: "Heure",
        minute: "Minute",
        hour_suffix: "h",
        minute_suffix: "min",
        am: "AM",
        pm: "PM",
        timezone: "Fuseau horaire",
        timezone_placeholder: "Sélectionner un fuseau horaire",
        frequency_daily: "Quotidien",
        frequency_weekly: "Hebdomadaire",
        frequency_monthly: "Mensuel",
        on: "Le",
        validation_weekly_day_required: "Sélectionnez au moins un jour de la semaine.",
        validation_monthly_date_required: "Sélectionnez un jour du mois.",
        main_content_schedule_summary_daily: "Chaque jour à {time} ({timezone}).",
        main_content_schedule_summary_weekly: "Chaque semaine le {days} à {time} ({timezone}).",
        main_content_schedule_summary_monthly: "Chaque mois le {day} à {time} ({timezone}).",
        schedule_mode: "Mode de planification",
        schedule_mode_fixed: "Fixe",
        schedule_mode_cron: "Cron",
        cron_expression_label: "Saisir une expression Cron",
        cron_expression_placeholder: "0 9 * * 1-5",
        cron_invalid: "Expression Cron invalide.",
        cron_preview: "Cette expression Cron exécute « {description} ».",
        main_content_cron_summary: "{description} ({timezone}).",
      },
      button: {
        previous: "Retour",
        next: "Ajouter une action",
      },
    },
    condition: {
      label: "À condition que",
      add_condition: "Ajouter une condition",
      adding_condition: "Ajout d'une condition",
    },
    action: {
      label: "Action",
      add_action: "Ajouter une action",
      sidebar_header: "Actions",
      input_label: "Que fait l'automatisation ?",
      input_placeholder: "Sélectionnez une option",
      handler_name: {
        add_comment: "Ajouter un commentaire",
        change_property: "Modifier la propriété",
      },
      configuration: {
        label: "Configuration",
        change_property: {
          placeholders: {
            property_name: "Sélectionnez une propriété",
            change_type: "Sélectionner",
            property_value_select: "{count, plural, one{Sélectionner une valeur} other{Sélectionner des valeurs}}",
            property_value_select_date: "Sélectionner une date",
          },
          validation: {
            property_name_required: "Le nom de la propriété est requis",
            change_type_required: "Le type de changement est requis",
            property_value_required: "La valeur de la propriété est requise",
          },
        },
      },
      comment_block: {
        title: "Ajouter un commentaire",
      },
      change_property_block: {
        title: "Modifier la propriété",
      },
      validation: {
        delete_only_action: "Désactivez l'automatisation avant de supprimer sa seule action.",
      },
    },
    conjunctions: {
      and: "Et",
      or: "Ou",
      if: "Si",
      then: "Alors",
    },
    enable: {
      alert:
        "Cliquez sur 'Activer' lorsque votre automatisation est terminée. Une fois activée, l'automatisation sera prête à s'exécuter.",
      validation: {
        required: "L'automatisation doit avoir un déclencheur et au moins une action pour être activée.",
      },
    },
    delete: {
      validation: {
        enabled: "L'automatisation doit être désactivée avant de la supprimer.",
      },
    },
    table: {
      title: "Titre de l'automatisation",
      last_run_on: "Dernière exécution le",
      created_on: "Créé le",
      last_updated_on: "Dernière mise à jour le",
      last_run_status: "Statut de la dernière exécution",
      average_duration: "Durée moyenne",
      owner: "Propriétaire",
      executions: "Exécutions",
    },
    create_modal: {
      heading: {
        create: "Créer une automatisation",
        update: "Mettre à jour l'automatisation",
      },
      title: {
        placeholder: "Nommez votre automatisation.",
        required_error: "Le titre est requis",
      },
      description: {
        placeholder: "Décrivez votre automatisation.",
      },
      submit_button: {
        create: "Créer l'automatisation",
        update: "Mettre à jour l'automatisation",
      },
    },
    delete_modal: {
      heading: "Supprimer l'automatisation",
    },
    activity: {
      filters: {
        show_fails: "Afficher les échecs",
        all: "Tout",
        only_activity: "Activité uniquement",
        only_run_history: "Historique d'exécution uniquement",
      },
      run_history: {
        initiator: "Initiateur",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Succès !",
          message: "Automatisation créée avec succès.",
        },
        error: {
          title: "Erreur !",
          message: "Échec de la création de l'automatisation.",
        },
      },
      update: {
        success: {
          title: "Succès !",
          message: "Automatisation mise à jour avec succès.",
        },
        error: {
          title: "Erreur !",
          message: "Échec de la mise à jour de l'automatisation.",
        },
      },
      enable: {
        success: {
          title: "Succès !",
          message: "Automatisation activée avec succès.",
        },
        error: {
          title: "Erreur !",
          message: "Échec de l'activation de l'automatisation.",
        },
      },
      disable: {
        success: {
          title: "Succès !",
          message: "Automatisation désactivée avec succès.",
        },
        error: {
          title: "Erreur !",
          message: "Échec de la désactivation de l'automatisation.",
        },
      },
      delete: {
        success: {
          title: "Automatisation supprimée",
          message: "{name}, l'automatisation, a été supprimée de votre projet.",
        },
        error: {
          title: "Nous n'avons pas pu supprimer cette automatisation cette fois.",
          message:
            "Essayez de la supprimer à nouveau ou revenez plus tard. Si vous ne pouvez toujours pas la supprimer, contactez-nous.",
        },
      },
      action: {
        create: {
          error: {
            title: "Erreur !",
            message: "Échec de la création de l'action. Veuillez réessayer !",
          },
        },
        update: {
          error: {
            title: "Erreur !",
            message: "Échec de la mise à jour de l'action. Veuillez réessayer !",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "Il n'y a pas encore d'automatisations à afficher.",
        description:
          "Les automatisations vous aident à éliminer les tâches répétitives en définissant des déclencheurs, des conditions et des actions. Créez-en une pour gagner du temps et maintenir le travail en mouvement sans effort.",
      },
      upgrade: {
        title: "Automatisations",
        description: "Les automatisations sont un moyen d'automatiser les tâches dans votre projet.",
        sub_description: "Récupérez 80% de votre temps administratif lorsque vous utilisez les Automatisations.",
      },
    },
  },
  sso: {
    header: "Identité",
    description:
      "Configurez votre domaine pour accéder aux fonctionnalités de sécurité, y compris l&apos;authentification unique.",
    domain_management: {
      header: "Gestion des domaines",
      verified_domains: {
        header: "Domaines vérifiés",
        description: "Vérifiez la propriété d&apos;un domaine e-mail pour activer l&apos;authentification unique.",
        button_text: "Ajouter un domaine",
        list: {
          domain_name: "Nom du domaine",
          status: "Statut",
          status_verified: "Vérifié",
          status_failed: "Échoué",
          status_pending: "En attente",
        },
        add_domain: {
          title: "Ajouter un domaine",
          description: "Ajoutez votre domaine pour configurer SSO et le vérifier.",
          form: {
            domain_label: "Domaine",
            domain_placeholder: "plane.so",
            domain_required: "Le domaine est requis",
            domain_invalid: "Entrez un nom de domaine valide (ex. plane.so)",
          },
          primary_button_text: "Ajouter le domaine",
          primary_button_loading_text: "Ajout en cours",
          toast: {
            success_title: "Succès !",
            success_message:
              "Domaine ajouté avec succès. Veuillez le vérifier en ajoutant l&apos;enregistrement DNS TXT.",
            error_message: "Échec de l&apos;ajout du domaine. Veuillez réessayer.",
          },
        },
        verify_domain: {
          title: "Vérifiez votre domaine",
          description: "Suivez ces étapes pour vérifier votre domaine.",
          instructions: {
            label: "Instructions",
            step_1: "Accédez aux paramètres DNS de votre hébergeur de domaine.",
            step_2: {
              part_1: "Créez un",
              part_2: "enregistrement TXT",
              part_3: "et collez la valeur complète de l&apos;enregistrement fournie ci-dessous.",
            },
            step_3: "Cette mise à jour prend généralement quelques minutes mais peut prendre jusqu&apos;à 72 heures.",
            step_4: 'Cliquez sur "Vérifier le domaine" pour confirmer une fois votre enregistrement DNS mis à jour.',
          },
          verification_code_label: "Valeur de l&apos;enregistrement TXT",
          verification_code_description: "Ajoutez cet enregistrement à vos paramètres DNS",
          domain_label: "Domaine",
          primary_button_text: "Vérifier le domaine",
          primary_button_loading_text: "Vérification en cours",
          secondary_button_text: "Je le ferai plus tard",
          toast: {
            success_title: "Succès !",
            success_message: "Domaine vérifié avec succès.",
            error_message: "Échec de la vérification du domaine. Veuillez réessayer.",
          },
        },
        delete_domain: {
          title: "Supprimer le domaine",
          description: {
            prefix: "Êtes-vous sûr de vouloir supprimer",
            suffix: " ? Cette action ne peut pas être annulée.",
          },
          primary_button_text: "Supprimer",
          primary_button_loading_text: "Suppression en cours",
          secondary_button_text: "Annuler",
          toast: {
            success_title: "Succès !",
            success_message: "Domaine supprimé avec succès.",
            error_message: "Échec de la suppression du domaine. Veuillez réessayer.",
          },
        },
      },
    },
    providers: {
      header: "Authentification unique",
      disabled_message: "Ajoutez un domaine vérifié pour configurer SSO",
      configure: {
        create: "Configurer",
        update: "Modifier",
      },
      switch_alert_modal: {
        title: "Passer à la méthode SSO {newProviderShortName} ?",
        content:
          "Vous êtes sur le point d&apos;activer {newProviderLongName} ({newProviderShortName}). Cette action désactivera automatiquement {activeProviderLongName} ({activeProviderShortName}). Les utilisateurs tentant de se connecter via {activeProviderShortName} ne pourront plus accéder à la plateforme jusqu&apos;à ce qu&apos;ils passent à la nouvelle méthode. Êtes-vous sûr de vouloir continuer ?",
        primary_button_text: "Changer",
        primary_button_text_loading: "Changement en cours",
        secondary_button_text: "Annuler",
      },
      form_section: {
        title: "Détails fournis par IdP pour {workspaceName}",
      },
      form_action_buttons: {
        saving: "Enregistrement en cours",
        save_changes: "Enregistrer les modifications",
        configure_only: "Configurer uniquement",
        configure_and_enable: "Configurer et activer",
        default: "Enregistrer",
      },
      setup_details_section: {
        title: "{workspaceName} détails fournis pour votre IdP",
        button_text: "Obtenir les détails de configuration",
      },
      saml: {
        header: "Activer SAML",
        description: "Configurez votre fournisseur d&apos;identité SAML pour activer l&apos;authentification unique.",
        configure: {
          title: "Activer SAML",
          description:
            "Vérifiez la propriété d&apos;un domaine e-mail pour accéder aux fonctionnalités de sécurité, y compris l&apos;authentification unique.",
          toast: {
            success_title: "Succès !",
            create_success_message: "Fournisseur SAML créé avec succès.",
            update_success_message: "Fournisseur SAML mis à jour avec succès.",
            error_title: "Erreur !",
            error_message: "Échec de l&apos;enregistrement du fournisseur SAML. Veuillez réessayer.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Détails web",
            entity_id: {
              label: "ID d&apos;entité | Audience | Informations de métadonnées",
              description:
                "Nous générerons cette partie des métadonnées qui identifie cette application Plane comme un service autorisé sur votre IdP.",
            },
            callback_url: {
              label: "URL d&apos;authentification unique",
              description:
                "Nous générerons cela pour vous. Ajoutez cela dans le champ URL de redirection de connexion de votre IdP.",
            },
            logout_url: {
              label: "URL de déconnexion unique",
              description:
                "Nous générerons cela pour vous. Ajoutez cela dans le champ URL de redirection de déconnexion unique de votre IdP.",
            },
          },
          mobile_details: {
            header: "Détails mobiles",
            entity_id: {
              label: "ID d&apos;entité | Audience | Informations de métadonnées",
              description:
                "Nous générerons cette partie des métadonnées qui identifie cette application Plane comme un service autorisé sur votre IdP.",
            },
            callback_url: {
              label: "URL d&apos;authentification unique",
              description:
                "Nous générerons cela pour vous. Ajoutez cela dans le champ URL de redirection de connexion de votre IdP.",
            },
            logout_url: {
              label: "URL de déconnexion unique",
              description:
                "Nous générerons cela pour vous. Ajoutez cela dans le champ URL de redirection de déconnexion de votre IdP.",
            },
          },
          mapping_table: {
            header: "Détails de mappage",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "Activer OIDC",
        description: "Configurez votre fournisseur d&apos;identité OIDC pour activer l&apos;authentification unique.",
        configure: {
          title: "Activer OIDC",
          description:
            "Vérifiez la propriété d&apos;un domaine e-mail pour accéder aux fonctionnalités de sécurité, y compris l&apos;authentification unique.",
          toast: {
            success_title: "Succès !",
            create_success_message: "Fournisseur OIDC créé avec succès.",
            update_success_message: "Fournisseur OIDC mis à jour avec succès.",
            error_title: "Erreur !",
            error_message: "Échec de l&apos;enregistrement du fournisseur OIDC. Veuillez réessayer.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Détails web",
            origin_url: {
              label: "URL d&apos;origine",
              description:
                "Nous générerons cela pour cette application Plane. Ajoutez cela comme origine de confiance dans le champ correspondant de votre IdP.",
            },
            callback_url: {
              label: "URL de redirection",
              description:
                "Nous générerons cela pour vous. Ajoutez cela dans le champ URL de redirection de connexion de votre IdP.",
            },
            logout_url: {
              label: "URL de déconnexion",
              description:
                "Nous générerons cela pour vous. Ajoutez cela dans le champ URL de redirection de déconnexion de votre IdP.",
            },
          },
          mobile_details: {
            header: "Détails mobiles",
            origin_url: {
              label: "URL d&apos;origine",
              description:
                "Nous générerons cela pour cette application Plane. Ajoutez cela comme origine de confiance dans le champ correspondant de votre IdP.",
            },
            callback_url: {
              label: "URL de redirection",
              description:
                "Nous générerons cela pour vous. Ajoutez cela dans le champ URL de redirection de connexion de votre IdP.",
            },
            logout_url: {
              label: "URL de déconnexion",
              description:
                "Nous générerons cela pour vous. Ajoutez cela dans le champ URL de redirection de déconnexion de votre IdP.",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "Le nom du projet ne peut pas contenir de caractères spéciaux.",
  pql: {
    functions: {
      date: {
        now: {
          description: "Date et heure actuelles",
        },
        today: {
          description: "Date d'aujourd'hui",
        },
        start_of_day: {
          description: "Début d'aujourd'hui",
        },
        end_of_day: {
          description: "Fin d'aujourd'hui",
        },
        start_of_week: {
          description: "Début de la semaine en cours",
        },
        end_of_week: {
          description: "Fin de la semaine en cours",
        },
        start_of_month: {
          description: "Début du mois en cours",
        },
        end_of_month: {
          description: "Fin du mois en cours",
        },
        start_of_year: {
          description: "Début de l'année en cours",
        },
        end_of_year: {
          description: "Fin de l'année en cours",
        },
        days_ago: {
          description: "Date il y a n jours",
        },
        days_from_now: {
          description: "Date dans n jours",
        },
        weeks_ago: {
          description: "Date il y a n semaines",
        },
        weeks_from_now: {
          description: "Date dans n semaines",
        },
        months_ago: {
          description: "Date il y a n mois",
        },
        months_from_now: {
          description: "Date dans n mois",
        },
      },
      user: {
        current_user: {
          description: "Utilisateur actuellement connecté",
        },
        members_of: {
          description: 'Membres de "project:<id>" ou "teamspace:<id>"',
        },
        workspace_members: {
          description: "Tous les membres de l'espace de travail",
        },
      },
      cycle: {
        active_cycle: {
          description: "Cycle actif aujourd'hui",
        },
        completed_cycles: {
          description: "Cycles dont la date de fin est passée",
        },
        upcoming_cycles: {
          description: "Cycles dont la date de début est dans le futur",
        },
      },
      state: {
        open_states: {
          description: "backlog, unstarted, started",
        },
        closed_states: {
          description: "completed, canceled",
        },
        active_states: {
          description: "unstarted, started",
        },
      },
      predicate: {
        is_overdue: {
          description: "La date d'échéance est passée ET l'état est ouvert",
        },
        has_no_assignee: {
          description: "L'élément de travail n'a pas d'assigné",
        },
        has_no_label: {
          description: "L'élément de travail n'a pas d'étiquettes",
        },
        is_top_level: {
          description: "Pas un sous-élément (sans parent)",
        },
        is_sub_work_item: {
          description: "Est un sous-élément (a un parent)",
        },
        is_epic: {
          description: "Épopée",
        },
        is_intake: {
          description: "Est un élément d'entrée",
        },
        is_draft: {
          description: "Est un brouillon",
        },
        is_archived: {
          description: "Est archivé",
        },
        has_children: {
          description: "A au moins un sous-élément",
        },
        has_start_and_due_dates: {
          description: "A une date de début et une date d'échéance",
        },
      },
      relation: {
        linked_to: {
          description: "Éléments liés à cet élément",
        },
        blocked_by: {
          description: "Éléments bloqués par cet élément",
        },
        blocks: {
          description: "Éléments qui bloquent cet élément",
        },
        child_of: {
          description: "Sous-éléments de cet élément",
        },
        parent_of: {
          description: "Élément parent de cet élément",
        },
        duplicate_of: {
          description: "Éléments marqués comme doublons de cet élément",
        },
      },
      history: {
        was_ever: {
          description: "Le champ a déjà eu cette valeur",
        },
        was: {
          description: "Le champ avait précédemment cette valeur (modifié depuis)",
        },
        changed_from: {
          description: "Le champ a été modifié depuis cette valeur",
        },
        changed_to: {
          description: "Le champ a été modifié vers cette valeur",
        },
        changed: {
          description: "Le champ a été modifié",
        },
        updated_by: {
          description: "Élément mis à jour par cet utilisateur",
        },
        commented_by: {
          description: "Élément commenté par cet utilisateur",
        },
        field_changed_by: {
          description: "Champ modifié par cet utilisateur",
        },
        was_assigned_to: {
          description: "Élément assigné à cet utilisateur",
        },
        changed_after: {
          description: "Champ modifié après cette date",
        },
        changed_before: {
          description: "Champ modifié avant cette date",
        },
        field_changed_after: {
          description: "Champ modifié après cette date",
        },
        field_changed_before: {
          description: "Champ modifié avant cette date",
        },
        changed_to_after: {
          description: "Champ modifié vers cette valeur après cette date",
        },
        changed_to_before: {
          description: "Champ modifié vers cette valeur avant cette date",
        },
        field_changed_between: {
          description: "Champ modifié entre ces dates",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "naviguer",
      accept: "accepter",
      close: "fermer",
      pick_date: "Choisir une date",
    },
    placeholder: 'Saisissez une requête et appuyez sur "ENTRÉE" pour filtrer...',
    error: "Erreur lors de la soumission de la requête. Veuillez vérifier et réessayer.",
  },
  releases: {
    label: "{count, plural, one {Livraison} other {Livraisons}}",
    no_release: "Aucune livraison",
    unreleased: "Non livré",
    select_releases: "Sélectionner des livraisons",
    overview: "Vue d’ensemble",
    scope: "Portée",
    page_title: {
      scope: "Livraison - {name} | Portée",
      scope_fallback: "Livraison | Portée",
    },
    properties: "Propriétés",
    target_date: "Date cible",
    lead: "Responsable",
    release_tag: "Tag",
    labels: "Étiquettes",
    description_placeholder: "Ajouter une description...",
    progress: "Progression",
    completed_work_items: "Éléments de travail terminés",
    pending_work_items: "Éléments de travail en attente",
    cancelled_work_items: "Éléments de travail annulés",
    scope_page: {
      work_items: "Éléments de travail",
      add_work_items: "Ajouter des éléments de travail",
      remove_from_release: "Retirer de la livraison",
      empty_state: {
        title: "Aucun élément de travail",
        description: "Ajoutez des éléments de travail pour définir la portée de la livraison.",
      },
      confirm_remove: {
        content: "Voulez-vous vraiment retirer cet élément de travail de la livraison ? Il restera dans le projet.",
        primary_button: {
          default: "Retirer",
          loading: "Retrait en cours",
        },
      },
    },
    empty_state: {
      title: "Pas encore de portée",
      description: "Ajoutez des éléments de travail à la livraison pour suivre leur achèvement pour cette livraison.",
      add_scope: "Ajouter un périmètre",
      not_found: {
        title: "Livraison introuvable",
        description: "La livraison a peut-être été supprimée.",
        primary_button: "Retour aux livraisons",
      },
    },
    toast: {
      work_items_added: "{count, plural, one {Élément de travail ajouté} other {Éléments de travail ajoutés}}",
      work_items_error: "Impossible d’ajouter les éléments de travail",
    },
    count_releases: "{count, plural, one {# livraison} other {# livraisons}}",
    actions: {
      delete: "Supprimer",
    },
    delete_modal: {
      title: "Supprimer la livraison",
      content: 'Voulez-vous vraiment supprimer la livraison "{releaseName}" ? Cette action est irréversible.',
    },
    settings: {
      heading: {
        title: "Livraisons",
        description: "Gérez les livrables du projet avec précision grâce aux livraisons.",
      },
      toggle: {
        title: "Activer les livraisons",
        description:
          "Les membres de l’espace de travail auront un accès en lecture à la portée dans leurs projets respectifs.",
      },
      toasts: {
        enable: {
          loading: "Activation des livraisons...",
          success: {
            title: "Livraisons activées",
            message: "Les livraisons ont été activées pour cet espace de travail.",
          },
          error: {
            title: "Erreur",
            message: "Impossible d’activer les livraisons. Veuillez réessayer.",
          },
        },
        disable: {
          loading: "Désactivation des livraisons...",
          success: {
            title: "Livraisons désactivées",
            message: "Les livraisons ont été désactivées pour cet espace de travail.",
          },
          error: {
            title: "Erreur",
            message: "Impossible de désactiver les livraisons. Veuillez réessayer.",
          },
        },
      },
      tabs: {
        tags: "Tags de livraison",
        labels: "Étiquettes",
      },
      tags: {
        title: "Tags de livraison",
        description: "Catégorisez et filtrez vos livraisons à l’aide de tags.",
        add: "Ajouter un tag",
        empty_state: "Pas encore de tags. Créez votre premier tag.",
        errors: {
          version_required: "La version est requise.",
          version_already_exists: "Un tag avec cette version existe déjà.",
          generic: "Une erreur s'est produite. Veuillez réessayer.",
        },
        delete_modal: {
          title: "Supprimer le tag",
          content: 'Voulez-vous vraiment supprimer le tag "{tagVersion}" ? Cette action est irréversible.',
        },
        actions: {
          edit: "Modifier le tag",
          delete: "Supprimer le tag",
        },
        toasts: {
          delete: {
            success: "Tag supprimé avec succès.",
            error: "Impossible de supprimer le tag. Veuillez réessayer.",
          },
        },
      },
      labels: {
        title: "Étiquettes",
        description: "Structurez et organisez vos initiatives avec des étiquettes.",
        add: "Ajouter une étiquette",
        empty_state: "Pas encore d’étiquettes. Créez votre première étiquette.",
        errors: {
          name_required: "Le nom est requis.",
          name_already_exists: "Une étiquette portant ce nom existe déjà.",
          generic: "Une erreur s'est produite. Veuillez réessayer.",
        },
        modal: {
          name_placeholder: "Nom de l’étiquette",
          pick_color: "Choisir la couleur de l’étiquette",
        },
        actions: {
          edit: "Modifier l’étiquette",
          delete: "Supprimer l’étiquette",
        },
        drag_to_reorder: "Glisser pour réorganiser",
        delete_modal: {
          title: "Supprimer l’étiquette",
          content: 'Voulez-vous vraiment supprimer l’étiquette "{labelName}" ? Cette action est irréversible.',
        },
        toasts: {
          delete: {
            success: "Étiquette supprimée avec succès.",
            error: "Impossible de supprimer l’étiquette. Veuillez réessayer.",
          },
        },
      },
    },
  },
  work_item_type_hierarchy: {
    settings: {
      title: "Hiérarchie",
      tab_label: "Hiérarchie",
      description:
        "Configurez les niveaux de hiérarchie pour organiser votre travail. Chaque niveau définit une relation parent avec l'élément directement au-dessus et une relation enfant avec l'élément directement en dessous. ",
      sidebar_label: "Hiérarchie",
      enable_control: {
        title: "Activer la hiérarchie",
        description: "Créez des relations parent-enfant entre différents types d'éléments de travail.",
        tooltip: "Vous ne pouvez pas désactiver la hiérarchie une fois qu'elle est activée.",
      },
      workspace_work_item_types_disabled_banner: {
        content: "Définissez d'abord les types d'éléments de travail pour créer une nouvelle hiérarchie.",
        cta: "Paramètres des types d'éléments de travail",
      },
    },
    levels: {
      add_level_button: "Ajouter un niveau de hiérarchie",
      empty_level_placeholder: "Ajouter un type d'élément de travail au niveau {level}",
      empty_level_unauthorized: "Aucun type d'élément de travail trouvé à ce niveau.",
      zero_level_description:
        "Par défaut, tous les types d'éléments de travail sont au niveau 0 jusqu'à ce qu'ils soient assignés à une hiérarchie.",
    },
    add_level_modal: {
      title: "Ajouter un niveau de hiérarchie",
      description: "Ajouter un nouveau niveau de hiérarchie au type d'élément de travail.",
      work_item_type: "Type d'élément de travail",
      select_placeholder: "Sélectionner les types",
      search_placeholder: "Rechercher des types",
      empty_state: {
        title: "Tous les types d'éléments de travail sont utilisés",
        description:
          "Chaque type d'élément de travail défini dans cet espace de travail fait déjà partie de votre hiérarchie.",
      },
      invalid_level_toast: {
        title: "Erreur !",
        message: "{type_name} ne peut pas être ajouté au niveau {level} car cela enfreint les règles de hiérarchie.",
      },
      error_toast: {
        title: "Erreur",
        message: "Impossible d'ajouter le type d'élément de travail à la hiérarchie.",
      },
    },
    work_item_modal: {
      invalid_work_item_type_create_toast: {
        title: "Erreur !",
        message:
          "Le type d'élément de travail sélectionné ne peut pas être utilisé pour créer un nouvel élément de travail car cela enfreint les règles de hiérarchie.",
      },
      invalid_work_item_type_update_toast: {
        title: "Erreur !",
        message: "Le type d'élément de travail ne peut pas être mis à jour car cela enfreint les règles de hiérarchie.",
      },
    },
  },
} as const;
