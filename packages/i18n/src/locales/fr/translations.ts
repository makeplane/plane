export default {
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
  theme: "Thème",
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
  workspace: "Espace de travail",
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
    "Vous aide à identifier de manière unique les éléments de travail dans le projet. Maximum 10 caractères.",
  description_placeholder: "Description",
  only_alphanumeric_non_latin_characters_allowed: "Seuls les caractères alphanumériques et non latins sont autorisés.",
  project_id_is_required: "L’ID du projet est requis",
  project_id_allowed_char: "Seuls les caractères alphanumériques et non latins sont autorisés.",
  project_id_min_char: "L’ID du projet doit comporter au moins 1 caractère",
  project_id_max_char: "L'ID du projet doit comporter au plus 10 caractères",
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
  pages: "Pages",
  intake: "Intake",
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
  discord: "Discord",
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
  priority: "Priorité",
  none: "Aucun",
  urgent: "Urgent",
  high: "Élevé",
  medium: "Moyen",
  low: "Faible",
  members: "Membres",
  assignee: "Acteur",
  assignees: "Acteurs",
  you: "Vous",
  labels: "Étiquettes",
  create_new_label: "Créer une nouvelle étiquette",
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
        description:
          "Il semble que tous vos widgets soient désactivés. Activez-les\nmaintenant pour améliorer votre expérience !",
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
    clear_all: "Tout effacer",
    copied: "Copié !",
    link_copied: "Lien copié !",
    link_copied_to_clipboard: "Lien copié dans le presse-papiers",
    copied_to_clipboard: "Lien de l’élément de travail copié dans le presse-papiers",
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
      description: "Seuls les éléments de travail\nterminés ou annulés peuvent être archivés",
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
      body: "Bonjour administrateur(s) d’instance,\n\nVeuillez créer un nouvel espace de travail avec l’URL [/workspace-name] pour [objectif de création de l'espace de travail].\n\nMerci,\n{firstName} {lastName}\n{email}",
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
        description: "Aucun projet détecté avec les critères correspondants. \n Créez plutôt un nouveau projet.",
      },
      search: {
        description: "Aucun projet détecté avec les critères correspondants.\nCréez plutôt un nouveau projet",
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
        title: "Jetons API",
        add_token: "Ajouter un jeton API",
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
        title: "Réception",
        short_title: "Réception",
        description:
          "Permettez aux non-membres de partager des bugs, des commentaires et des suggestions ; sans perturber votre flux de travail.",
        toggle_title: "Activer la réception",
        toggle_description: "Permettre aux membres du projet de créer des demandes de réception dans l'application.",
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
      archive_module_description: "Seuls les modules terminés ou\nannulés peuvent être archivés.",
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
        description: "Aucune vue ne correspond aux critères de recherche. \n Créez plutôt une nouvelle vue.",
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
        description: "Les mises à jour des éléments de travail qui vous sont assignés peuvent être \n vues ici",
      },
      mentions: {
        title: "Aucun élément de travail assigné",
        description: "Les mises à jour des éléments de travail qui vous sont assignés peuvent être \n vues ici",
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
        description:
          "Essayez un terme différent ou faites-nous savoir\nsi vous êtes sûr que votre recherche est correcte.",
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
} as const;
