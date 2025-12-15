export default {
  common_empty_state: {
    progress: {
      title: "Il n’y a pas encore de métriques de progression à afficher.",
      description:
        "Commencez à définir des valeurs de propriété dans les éléments de travail pour voir les métriques de progression ici.",
    },
    updates: {
      title: "Pas encore de mises à jour.",
      description: "Lorsque les membres du projet ajoutent des mises à jour, elles apparaissent ici",
    },
    search: {
      title: "Aucun résultat correspondant.",
      description: "Aucun résultat n’a été trouvé. Essayez d’ajuster votre recherche.",
    },
    not_found: {
      title: "Oups ! Quelque chose semble incorrect",
      description:
        "Nous ne sommes actuellement pas en mesure de récupérer votre compte plane. Il pourrait s’agir d'une erreur réseau.",
      cta_primary: "Essayer de recharger",
    },
    server_error: {
      title: "Erreur du serveur",
      description:
        "Nous ne sommes pas en mesure de nous connecter et de récupérer les données de notre serveur. Ne vous inquiétez pas, nous y travaillons.",
      cta_primary: "Essayer de recharger",
    },
  },
  project_empty_state: {
    no_access: {
      title: "Il semble que vous n’ayez pas accès à ce projet",
      restricted_description: "Contactez l’administrateur pour demander l’accès afin de pouvoir continuer ici.",
      join_description: "Cliquez sur le bouton ci-dessous pour rejoindre le projet.",
      cta_primary: "Rejoindre le projet",
      cta_loading: "Rejoindre le projet…",
    },
    invalid_project: {
      title: "Projet non trouvé",
      description: "Le projet que vous recherchez n’existe pas.",
    },
    work_items: {
      title: "Commencez avec votre premier élément de travail.",
      description:
        "Les éléments de travail sont les éléments constitutifs de votre projet — attribuez des propriétaires, définissez des priorités et suivez facilement les progrès.",
      cta_primary: "Créer votre premier élément de travail",
    },
    cycles: {
      title: "Regroupez et définissez des délais pour votre travail dans les Cycles.",
      description:
        "Décomposez le travail en morceaux délimités dans le temps, travaillez à rebours à partir de la date limite de votre projet pour définir des dates, et faites des progrès tangibles en équipe.",
      cta_primary: "Définir votre premier cycle",
    },
    cycle_work_items: {
      title: "Aucun élément de travail à afficher dans ce cycle",
      description:
        "Créez des éléments de travail pour commencer à suivre la progression de votre équipe dans ce cycle et atteindre vos objectifs à temps.",
      cta_primary: "Créer un élément de travail",
      cta_secondary: "Ajouter un élément de travail existant",
    },
    modules: {
      title: "Associez vos objectifs de projet aux Modules et suivez-les facilement.",
      description:
        "Les modules sont composés d’éléments de travail interconnectés. Ils aident à suivre les progrès à travers les phases du projet, chacune avec des délais spécifiques et des analyses pour indiquer à quel point vous êtes proche de la réalisation de ces phases.",
      cta_primary: "Définir votre premier module",
    },
    module_work_items: {
      title: "Aucun élément de travail à afficher dans ce Module",
      description: "Créez des éléments de travail pour commencer à suivre ce module.",
      cta_primary: "Créer un élément de travail",
      cta_secondary: "Ajouter un élément de travail existant",
    },
    views: {
      title: "Enregistrez des vues personnalisées pour votre projet",
      description:
        "Les vues sont des filtres enregistrés qui vous aident à accéder rapidement aux informations que vous utilisez le plus. Collaborez sans effort pendant que les coéquipiers partagent et adaptent les vues à leurs besoins spécifiques.",
      cta_primary: "Créer une vue",
    },
    no_work_items_in_project: {
      title: "Aucun élément de travail dans le projet pour le moment",
      description:
        "Ajoutez des éléments de travail à votre projet et découpez votre travail en éléments traçables avec des vues.",
      cta_primary: "Ajouter un élément de travail",
    },
    work_item_filter: {
      title: "Aucun élément de travail trouvé",
      description: "Votre filtre actuel n’a renvoyé aucun résultat. Essayez de modifier les filtres.",
      cta_primary: "Ajouter un élément de travail",
    },
    pages: {
      title: "Documentez tout — des notes aux PRD",
      description:
        "Les pages vous permettent de capturer et d’organiser des informations en un seul endroit. Rédigez des notes de réunion, de la documentation de projet et des PRD, intégrez des éléments de travail et structurez-les avec des composants prêts à l'emploi.",
      cta_primary: "Créer votre première Page",
    },
    archive_pages: {
      title: "Aucune page archivée pour le moment",
      description: "Archivez les pages qui ne sont pas sur votre radar. Accédez-y ici si nécessaire.",
    },
    intake_sidebar: {
      title: "Enregistrer les demandes d’Intake",
      description:
        "Soumettez de nouvelles demandes à examiner, prioriser et suivre dans le flux de travail de votre projet.",
      cta_primary: "Créer une demande d’Intake",
    },
    intake_main: {
      title: "Sélectionnez un élément de travail Intake pour voir ses détails",
    },
  },
  workspace_empty_state: {
    archive_work_items: {
      title: "Aucun élément de travail archivé pour le moment",
      description:
        "Manuellement ou par automatisation, vous pouvez archiver des éléments de travail qui sont terminés ou annulés. Retrouvez-les ici une fois archivés.",
      cta_primary: "Définir l’automatisation",
    },
    archive_cycles: {
      title: "Aucun cycle archivé pour le moment",
      description: "Pour organiser votre projet, archivez les cycles terminés. Retrouvez-les ici une fois archivés.",
    },
    archive_modules: {
      title: "Aucun Module archivé pour le moment",
      description:
        "Pour organiser votre projet, archivez les modules terminés ou annulés. Retrouvez-les ici une fois archivés.",
    },
    home_widget_quick_links: {
      title: "Gardez les références, ressources ou documents importants à portée de main pour votre travail",
    },
    inbox_sidebar_all: {
      title: "Les mises à jour pour vos éléments de travail auxquels vous êtes abonné apparaîtront ici",
    },
    inbox_sidebar_mentions: {
      title: "Les mentions pour vos éléments de travail apparaîtront ici",
    },
    your_work_by_priority: {
      title: "Aucun élément de travail attribué pour le moment",
    },
    your_work_by_state: {
      title: "Aucun élément de travail attribué pour le moment",
    },
    views: {
      title: "Aucune vue pour le moment",
      description:
        "Ajoutez des éléments de travail à votre projet et utilisez les vues pour filtrer, trier et suivre les progrès sans effort.",
      cta_primary: "Ajouter un élément de travail",
    },
    drafts: {
      title: "Éléments de travail à moitié écrits",
      description:
        "Pour l’essayer, commencez à ajouter un élément de travail et laissez-le à mi-chemin ou créez votre premier brouillon ci-dessous. 😉",
      cta_primary: "Créer un brouillon d’élément de travail",
    },
    projects_archived: {
      title: "Aucun projet archivé",
      description: "On dirait que tous vos projets sont toujours actifs — excellent travail !",
    },
    analytics_projects: {
      title: "Créez des projets pour visualiser les métriques de projet ici.",
    },
    analytics_work_items: {
      title:
        "Créez des projets avec des éléments de travail et des personnes assignées pour commencer à suivre les performances, les progrès et l’impact de l’équipe ici.",
    },
    analytics_no_cycle: {
      title:
        "Créez des cycles pour organiser le travail en phases délimitées dans le temps et suivre les progrès à travers les sprints.",
    },
    analytics_no_module: {
      title: "Créez des modules pour organiser votre travail et suivre les progrès à travers différentes étapes.",
    },
    analytics_no_intake: {
      title: "Configurez l’intake pour gérer les demandes entrantes et suivre comment elles sont acceptées et rejetées",
    },
  },
  settings_empty_state: {
    estimates: {
      title: "Aucune estimation pour le moment",
      description:
        "Définissez comment votre équipe mesure l’effort et suivez-le de manière cohérente sur tous les éléments de travail.",
      cta_primary: "Ajouter un système d’estimation",
    },
    labels: {
      title: "Aucune étiquette pour le moment",
      description:
        "Créez des étiquettes personnalisées pour catégoriser et gérer efficacement vos éléments de travail.",
      cta_primary: "Créer votre première étiquette",
    },
    exports: {
      title: "Aucune exportation pour le moment",
      description:
        "Vous n’avez aucun enregistrement d’exportation pour le moment. Une fois que vous exportez des données, tous les enregistrements apparaîtront ici.",
    },
    tokens: {
      title: "Aucun jeton personnel pour le moment",
      description:
        "Générez des jetons API sécurisés pour connecter votre espace de travail avec des systèmes et applications externes.",
      cta_primary: "Ajouter un jeton API",
    },
    webhooks: {
      title: "Aucun Webhook ajouté pour le moment",
      description:
        "Automatisez les notifications vers des services externes lorsque des événements de projet se produisent.",
      cta_primary: "Ajouter un webhook",
    },
  },
} as const;
