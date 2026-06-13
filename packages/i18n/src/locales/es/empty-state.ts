/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export default {
  common_empty_state: {
    progress: {
      title: "Todavía no hay métricas de progreso para mostrar.",
      description:
        "Comienza a establecer valores de propiedades en los elementos de trabajo para ver las métricas de progreso aquí.",
    },
    updates: {
      title: "Aún no hay actualizaciones.",
      description: "Una vez que los miembros del proyecto agreguen actualizaciones, aparecerán aquí",
    },
    search: {
      title: "No se encontraron resultados coincidentes.",
      description: "No se encontraron resultados. Intenta ajustar tus términos de búsqueda.",
    },
    not_found: {
      title: "¡Ups! Algo parece estar mal",
      description: "No podemos obtener tu cuenta de Gizmo actualmente. Esto podría ser un error de red.",
      cta_primary: "Intentar recargar",
    },
    server_error: {
      title: "Error del servidor",
      description:
        "No podemos conectarnos y obtener datos de nuestro servidor. No te preocupes, estamos trabajando en ello.",
      cta_primary: "Intentar recargar",
    },
  },
  project_empty_state: {
    no_access: {
      title: "Parece que no tienes acceso a este proyecto",
      restricted_description: "Contacta con el administrador para solicitar acceso y podrás continuar aquí.",
      join_description: "Haz clic en el botón de abajo para unirte.",
      cta_primary: "Unirse al proyecto",
      cta_loading: "Uniéndose al proyecto",
    },
    invalid_project: {
      title: "Proyecto no encontrado",
      description: "El proyecto que buscas no existe.",
    },
    work_items: {
      title: "Comienza con tu primer elemento de trabajo.",
      description:
        "Los elementos de trabajo son los bloques de construcción de tu proyecto — asigna responsables, establece prioridades y realiza un seguimiento del progreso fácilmente.",
      cta_primary: "Crea tu primer elemento de trabajo",
    },
    cycles: {
      title: "Agrupa y delimita tu trabajo en Ciclos.",
      description:
        "Divide el trabajo en bloques con tiempo definido, trabaja hacia atrás desde la fecha límite de tu proyecto para establecer fechas y haz un progreso tangible como equipo.",
      cta_primary: "Establece tu primer ciclo",
    },
    cycle_work_items: {
      title: "No hay elementos de trabajo para mostrar en este ciclo",
      description:
        "Crea elementos de trabajo para comenzar a monitorear el progreso de tu equipo en este ciclo y alcanzar tus objetivos a tiempo.",
      cta_primary: "Crear elemento de trabajo",
      cta_secondary: "Agregar elemento de trabajo existente",
    },
    modules: {
      title: "Asigna los objetivos de tu proyecto a Módulos y rastrea fácilmente.",
      description:
        "Los módulos están compuestos de elementos de trabajo interconectados. Ayudan a monitorear el progreso a través de las fases del proyecto, cada una con fechas límite específicas y análisis para indicar qué tan cerca estás de alcanzar esas fases.",
      cta_primary: "Establece tu primer módulo",
    },
    module_work_items: {
      title: "No hay elementos de trabajo para mostrar en este Módulo",
      description: "Crea elementos de trabajo para comenzar a monitorear este módulo.",
      cta_primary: "Crear elemento de trabajo",
      cta_secondary: "Agregar elemento de trabajo existente",
    },
    views: {
      title: "Guarda vistas personalizadas para tu proyecto",
      description:
        "Las vistas son filtros guardados que te ayudan a acceder rápidamente a la información que más usas. Colabora sin esfuerzo mientras los compañeros de equipo comparten y adaptan las vistas a sus necesidades específicas.",
      cta_primary: "Crear vista",
    },
    no_work_items_in_project: {
      title: "Aún no hay elementos de trabajo en el proyecto",
      description: "Agrega elementos de trabajo a tu proyecto y divide tu trabajo en piezas rastreables con vistas.",
      cta_primary: "Agregar elemento de trabajo",
    },
    work_item_filter: {
      title: "No se encontraron elementos de trabajo",
      description: "Tu filtro actual no devolvió ningún resultado. Intenta cambiar los filtros.",
      cta_primary: "Agregar elemento de trabajo",
    },
    pages: {
      title: "Documenta todo — desde notas hasta PRDs",
      description:
        "Las páginas te permiten capturar y organizar información en un solo lugar. Escribe notas de reuniones, documentación de proyectos y PRDs, incrusta elementos de trabajo y estructúralos con componentes listos para usar.",
      cta_primary: "Crea tu primera Página",
    },
    archive_pages: {
      title: "Aún no hay páginas archivadas",
      description: "Archiva las páginas que no están en tu radar. Accede a ellas aquí cuando las necesites.",
    },
    intake_sidebar: {
      title: "Registra solicitudes de Entrada",
      description:
        "Envía nuevas solicitudes para ser revisadas, priorizadas y rastreadas dentro del flujo de trabajo de tu proyecto.",
      cta_primary: "Crear solicitud de Entrada",
    },
    intake_main: {
      title: "Selecciona un elemento de trabajo de Entrada para ver sus detalles",
    },
  },
  workspace_empty_state: {
    archive_work_items: {
      title: "Aún no hay elementos de trabajo archivados",
      description:
        "Manualmente o mediante automatización, puedes archivar elementos de trabajo que estén completados o cancelados. Encuéntralos aquí una vez archivados.",
      cta_primary: "Configurar automatización",
    },
    archive_cycles: {
      title: "Aún no hay ciclos archivados",
      description: "Para ordenar tu proyecto, archiva los ciclos completados. Encuéntralos aquí una vez archivados.",
    },
    archive_modules: {
      title: "Aún no hay Módulos archivados",
      description:
        "Para ordenar tu proyecto, archiva los módulos completados o cancelados. Encuéntralos aquí una vez archivados.",
    },
    home_widget_quick_links: {
      title: "Mantén a mano referencias importantes, recursos o documentos para tu trabajo",
    },
    inbox_sidebar_all: {
      title: "Las actualizaciones de tus elementos de trabajo suscritos aparecerán aquí",
    },
    inbox_sidebar_mentions: {
      title: "Las menciones a tus elementos de trabajo aparecerán aquí",
    },
    your_work_by_priority: {
      title: "Aún no hay elementos de trabajo asignados",
    },
    your_work_by_state: {
      title: "Aún no hay elementos de trabajo asignados",
    },
    views: {
      title: "Aún no hay Vistas",
      description:
        "Agrega elementos de trabajo a tu proyecto y usa vistas para filtrar, ordenar y monitorear el progreso sin esfuerzo.",
      cta_primary: "Agregar elemento de trabajo",
    },
    drafts: {
      title: "Elementos de trabajo a medio escribir",
      description:
        "Para probarlo, comienza a agregar un elemento de trabajo y déjalo a medias o crea tu primer borrador a continuación. 😉",
      cta_primary: "Crear borrador de elemento de trabajo",
    },
    projects_archived: {
      title: "No hay proyectos archivados",
      description: "Parece que todos tus proyectos siguen activos — ¡buen trabajo!",
    },
    analytics_projects: {
      title: "Crea proyectos para visualizar las métricas del proyecto aquí.",
    },
    analytics_work_items: {
      title:
        "Crea proyectos con elementos de trabajo y responsables para comenzar a rastrear el rendimiento, progreso e impacto del equipo aquí.",
    },
    analytics_no_cycle: {
      title:
        "Crea ciclos para organizar el trabajo en fases con límite de tiempo y rastrear el progreso en los sprints.",
    },
    analytics_no_module: {
      title: "Crea módulos para organizar tu trabajo y rastrear el progreso en diferentes etapas.",
    },
    analytics_no_intake: {
      title: "Configura la entrada para gestionar las solicitudes entrantes y rastrear cómo se aceptan y rechazan",
    },
  },
  settings_empty_state: {
    estimates: {
      title: "Aún no hay estimaciones",
      description:
        "Define cómo tu equipo mide el esfuerzo y rastréalo de manera consistente en todos los elementos de trabajo.",
      cta_primary: "Agregar sistema de estimación",
    },
    labels: {
      title: "Aún no hay etiquetas",
      description: "Crea etiquetas personalizadas para categorizar y gestionar efectivamente tus elementos de trabajo.",
      cta_primary: "Crea tu primera etiqueta",
    },
    exports: {
      title: "Aún no hay exportaciones",
      description:
        "No tienes ningún registro de exportación en este momento. Una vez que exportes datos, todos los registros aparecerán aquí.",
    },
    tokens: {
      title: "Aún no hay tokens Personales",
      description:
        "Genera tokens API seguros para conectar tu espacio de trabajo con sistemas y aplicaciones externos.",
      cta_primary: "Agregar token API",
    },
    webhooks: {
      title: "Aún no se ha agregado ningún Webhook",
      description: "Automatiza las notificaciones a servicios externos cuando ocurran eventos del proyecto.",
      cta_primary: "Agregar webhook",
    },
  },
} as const;
