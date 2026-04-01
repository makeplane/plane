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
      "Estamos trabajando en esto. Si necesitas asistencia inmediata,",
    reach_out_to_us: "contáctanos",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our:
      "De lo contrario, intenta actualizar la página ocasionalmente o visita nuestra",
    status_page: "página de estado",
  },
  sidebar: {
    projects: "Proyectos",
    pages: "Páginas",
    new_work_item: "Nuevo elemento de trabajo",
    home: "Inicio",
    your_work: "Tu trabajo",
    inbox: "Bandeja de entrada",
    workspace: "Espacio de trabajo",
    views: "Vistas",
    analytics: "Análisis",
    work_items: "Elementos de trabajo",
    cycles: "Ciclos",
    modules: "Módulos",
    intake: "Entrada",
    drafts: "Borradores",
    favorites: "Favoritos",
    pro: "Pro",
    upgrade: "Mejorar",
    pi_chat: "Plane AI",
    initiatives: "Iniciativas",
    teamspaces: "Espacios de equipo",
    epics: "Epics",
    upgrade_plan: "Actualizar plan",
    plane_pro: "Plane Pro",
    business: "Business",
    customers: "Clientes",
    recurring_work_items: "Tareas recurrentes",
  },
  auth: {
    common: {
      email: {
        label: "Correo electrónico",
        placeholder: "nombre@empresa.com",
        errors: {
          required: "El correo electrónico es obligatorio",
          invalid: "El correo electrónico no es válido",
        },
      },
      password: {
        label: "Contraseña",
        set_password: "Establecer una contraseña",
        placeholder: "Ingresa la contraseña",
        confirm_password: {
          label: "Confirmar contraseña",
          placeholder: "Confirmar contraseña",
        },
        current_password: {
          label: "Contraseña actual",
        },
        new_password: {
          label: "Nueva contraseña",
          placeholder: "Ingresa nueva contraseña",
        },
        change_password: {
          label: {
            default: "Cambiar contraseña",
            submitting: "Cambiando contraseña",
          },
        },
        errors: {
          match: "Las contraseñas no coinciden",
          empty: "Por favor ingresa tu contraseña",
          length: "La contraseña debe tener más de 8 caracteres",
          strength: {
            weak: "La contraseña es débil",
            strong: "La contraseña es fuerte",
          },
        },
        submit: "Establecer contraseña",
        toast: {
          change_password: {
            success: {
              title: "¡Éxito!",
              message: "Contraseña cambiada exitosamente.",
            },
            error: {
              title: "¡Error!",
              message: "Algo salió mal. Por favor intenta de nuevo.",
            },
          },
        },
      },
      unique_code: {
        label: "Código único",
        placeholder: "obtiene-establece-vuela",
        paste_code: "Pega el código enviado a tu correo electrónico",
        requesting_new_code: "Solicitando nuevo código",
        sending_code: "Enviando código",
      },
      already_have_an_account: "¿Ya tienes una cuenta?",
      login: "Iniciar sesión",
      create_account: "Crear una cuenta",
      new_to_plane: "¿Nuevo en Plane?",
      back_to_sign_in: "Volver a iniciar sesión",
      resend_in: "Reenviar en {seconds} segundos",
      sign_in_with_unique_code: "Iniciar sesión con código único",
      forgot_password: "¿Olvidaste tu contraseña?",
      username: {
        label: "Nombre de usuario",
        placeholder: "Ingrese su nombre de usuario",
      },
    },
    sign_up: {
      header: {
        label: "Crea una cuenta para comenzar a gestionar el trabajo con tu equipo.",
        step: {
          email: {
            header: "Registrarse",
            sub_header: "",
          },
          password: {
            header: "Registrarse",
            sub_header: "Regístrate usando una combinación de correo electrónico y contraseña.",
          },
          unique_code: {
            header: "Registrarse",
            sub_header: "Regístrate usando un código único enviado a la dirección de correo electrónico anterior.",
          },
        },
      },
      errors: {
        password: {
          strength: "Intenta establecer una contraseña fuerte para continuar",
        },
      },
    },
    sign_in: {
      header: {
        label: "Inicia sesión para comenzar a gestionar el trabajo con tu equipo.",
        step: {
          email: {
            header: "Iniciar sesión o registrarse",
            sub_header: "",
          },
          password: {
            header: "Iniciar sesión o registrarse",
            sub_header: "Usa tu combinación de correo electrónico y contraseña para iniciar sesión.",
          },
          unique_code: {
            header: "Iniciar sesión o registrarse",
            sub_header: "Inicia sesión usando un código único enviado a la dirección de correo electrónico anterior.",
          },
        },
      },
    },
    forgot_password: {
      title: "Restablecer tu contraseña",
      description:
        "Ingresa la dirección de correo electrónico verificada de tu cuenta de usuario y te enviaremos un enlace para restablecer la contraseña.",
      email_sent: "Enviamos el enlace de restablecimiento a tu dirección de correo electrónico",
      send_reset_link: "Enviar enlace de restablecimiento",
      errors: {
        smtp_not_enabled:
          "Vemos que tu administrador no ha habilitado SMTP, no podremos enviar un enlace para restablecer la contraseña",
      },
      toast: {
        success: {
          title: "Correo enviado",
          message:
            "Revisa tu bandeja de entrada para encontrar un enlace para restablecer tu contraseña. Si no aparece en unos minutos, revisa tu carpeta de spam.",
        },
        error: {
          title: "¡Error!",
          message: "Algo salió mal. Por favor intenta de nuevo.",
        },
      },
    },
    reset_password: {
      title: "Establecer nueva contraseña",
      description: "Asegura tu cuenta con una contraseña fuerte",
    },
    set_password: {
      title: "Asegura tu cuenta",
      description: "Establecer una contraseña te ayuda a iniciar sesión de forma segura",
    },
    sign_out: {
      toast: {
        error: {
          title: "¡Error!",
          message: "Error al cerrar sesión. Por favor intenta de nuevo.",
        },
      },
    },
    ldap: {
      header: {
        label: "Continuar con {ldapProviderName}",
        sub_header: "Ingrese sus credenciales de {ldapProviderName}",
      },
    },
  },
  submit: "Enviar",
  cancel: "Cancelar",
  loading: "Cargando",
  error: "Error",
  success: "Éxito",
  warning: "Advertencia",
  info: "Información",
  close: "Cerrar",
  yes: "Sí",
  no: "No",
  ok: "Aceptar",
  name: "Nombre",
  description: "Descripción",
  search: "Buscar",
  add_member: "Agregar miembro",
  adding_members: "Agregando miembros",
  remove_member: "Eliminar miembro",
  add_members: "Agregar miembros",
  adding_member: "Agregando miembros",
  remove_members: "Eliminar miembros",
  add: "Agregar",
  adding: "Agregando",
  remove: "Eliminar",
  add_new: "Agregar nuevo",
  remove_selected: "Eliminar seleccionados",
  first_name: "Nombre",
  last_name: "Apellido",
  email: "Correo electrónico",
  display_name: "Nombre para mostrar",
  role: "Rol",
  timezone: "Zona horaria",
  avatar: "Avatar",
  cover_image: "Imagen de portada",
  password: "Contraseña",
  change_cover: "Cambiar portada",
  language: "Idioma",
  saving: "Guardando",
  save_changes: "Guardar cambios",
  deactivate_account: "Desactivar cuenta",
  deactivate_account_description:
    "Al desactivar una cuenta, todos los datos y recursos dentro de esa cuenta se eliminarán permanentemente y no se podrán recuperar.",
  profile_settings: "Configuración del perfil",
  your_account: "Tu cuenta",
  security: "Seguridad",
  activity: "Actividad",
  activity_empty_state: {
    no_activity: "Sin actividad aún",
    no_transitions: "Sin transiciones aún",
  },
  appearance: "Apariencia",
  notifications: "Notificaciones",
  connections: "Conexiones",
  workspaces: "Espacios de trabajo",
  create_workspace: "Crear espacio de trabajo",
  invitations: "Invitaciones",
  summary: "Resumen",
  assigned: "Asignado",
  created: "Creado",
  subscribed: "Suscrito",
  you_do_not_have_the_permission_to_access_this_page: "No tienes permiso para acceder a esta página.",
  something_went_wrong_please_try_again: "Algo salió mal. Por favor, inténtalo de nuevo.",
  load_more: "Cargar más",
  select_or_customize_your_interface_color_scheme: "Selecciona o personaliza el esquema de color de tu interfaz.",
  select_the_cursor_motion_style_that_feels_right_for_you:
    "Selecciona el estilo de movimiento del cursor que te parezca adecuado.",
  theme: "Tema",
  smooth_cursor: "Cursor suave",
  system_preference: "Preferencia del sistema",
  light: "Claro",
  dark: "Oscuro",
  light_contrast: "Alto contraste claro",
  dark_contrast: "Alto contraste oscuro",
  custom: "Tema personalizado",
  select_your_theme: "Selecciona tu tema",
  customize_your_theme: "Personaliza tu tema",
  background_color: "Color de fondo",
  text_color: "Color del texto",
  primary_color: "Color primario (Tema)",
  sidebar_background_color: "Color de fondo de la barra lateral",
  sidebar_text_color: "Color del texto de la barra lateral",
  set_theme: "Establecer tema",
  enter_a_valid_hex_code_of_6_characters: "Ingresa un código hexadecimal válido de 6 caracteres",
  background_color_is_required: "El color de fondo es requerido",
  text_color_is_required: "El color del texto es requerido",
  primary_color_is_required: "El color primario es requerido",
  sidebar_background_color_is_required: "El color de fondo de la barra lateral es requerido",
  sidebar_text_color_is_required: "El color del texto de la barra lateral es requerido",
  updating_theme: "Actualizando tema",
  theme_updated_successfully: "Tema actualizado exitosamente",
  failed_to_update_the_theme: "Error al actualizar el tema",
  email_notifications: "Notificaciones por correo electrónico",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "Mantente al tanto de los elementos de trabajo a los que estás suscrito. Activa esto para recibir notificaciones.",
  email_notification_setting_updated_successfully:
    "Configuración de notificaciones por correo electrónico actualizada exitosamente",
  failed_to_update_email_notification_setting:
    "Error al actualizar la configuración de notificaciones por correo electrónico",
  notify_me_when: "Notificarme cuando",
  property_changes: "Cambios de propiedades",
  property_changes_description:
    "Notificarme cuando cambien las propiedades de los elementos de trabajo como asignados, prioridad, estimaciones o cualquier otra cosa.",
  state_change: "Cambio de estado",
  state_change_description: "Notificarme cuando los elementos de trabajo se muevan a un estado diferente",
  issue_completed: "Elemento de trabajo completado",
  issue_completed_description: "Notificarme solo cuando se complete un elemento de trabajo",
  comments: "Comentarios",
  comments_description: "Notificarme cuando alguien deje un comentario en el elemento de trabajo",
  mentions: "Menciones",
  mentions_description: "Notificarme solo cuando alguien me mencione en los comentarios o descripción",
  old_password: "Contraseña anterior",
  general_settings: "Configuración general",
  sign_out: "Cerrar sesión",
  signing_out: "Cerrando sesión",
  active_cycles: "Ciclos activos",
  active_cycles_description:
    "Monitorea ciclos en todos los proyectos, rastrea elementos de trabajo de alta prioridad y enfócate en los ciclos que necesitan atención.",
  on_demand_snapshots_of_all_your_cycles: "Instantáneas bajo demanda de todos tus ciclos",
  upgrade: "Actualizar",
  "10000_feet_view": "Vista panorámica de todos los ciclos activos.",
  "10000_feet_view_description":
    "Aléjate para ver los ciclos en ejecución en todos tus proyectos a la vez en lugar de ir de Ciclo en Ciclo en cada proyecto.",
  get_snapshot_of_each_active_cycle: "Obtén una instantánea de cada ciclo activo.",
  get_snapshot_of_each_active_cycle_description:
    "Rastrea métricas de alto nivel para todos los ciclos activos, ve su estado de progreso y obtén una idea del alcance contra los plazos.",
  compare_burndowns: "Compara los burndowns.",
  compare_burndowns_description:
    "Monitorea cómo se está desempeñando cada uno de tus equipos con un vistazo al informe de burndown de cada ciclo.",
  quickly_see_make_or_break_issues: "Ve rápidamente los elementos de trabajo críticos.",
  quickly_see_make_or_break_issues_description:
    "Previsualiza elementos de trabajo de alta prioridad para cada ciclo contra fechas de vencimiento. Vélos todos por ciclo con un clic.",
  zoom_into_cycles_that_need_attention: "Enfócate en los ciclos que necesitan atención.",
  zoom_into_cycles_that_need_attention_description:
    "Investiga el estado de cualquier ciclo que no se ajuste a las expectativas con un clic.",
  stay_ahead_of_blockers: "Mantente adelante de los bloqueadores.",
  stay_ahead_of_blockers_description:
    "Detecta desafíos de un proyecto a otro y ve dependencias entre ciclos que no son obvias desde ninguna otra vista.",
  analytics: "Análisis",
  workspace_invites: "Invitaciones al espacio de trabajo",
  enter_god_mode: "Entrar en modo dios",
  workspace_logo: "Logo del espacio de trabajo",
  new_issue: "Nuevo elemento de trabajo",
  your_work: "Tu trabajo",
  workspace_dashboards: "Tableros",
  drafts: "Borradores",
  projects: "Proyectos",
  views: "Vistas",
  archives: "Archivos",
  settings: "Configuración",
  failed_to_move_favorite: "Error al mover favorito",
  favorites: "Favoritos",
  no_favorites_yet: "Aún no hay favoritos",
  create_folder: "Crear carpeta",
  new_folder: "Nueva carpeta",
  favorite_updated_successfully: "Favorito actualizado exitosamente",
  favorite_created_successfully: "Favorito creado exitosamente",
  folder_already_exists: "La carpeta ya existe",
  folder_name_cannot_be_empty: "El nombre de la carpeta no puede estar vacío",
  something_went_wrong: "Algo salió mal",
  failed_to_reorder_favorite: "Error al reordenar favorito",
  favorite_removed_successfully: "Favorito eliminado exitosamente",
  failed_to_create_favorite: "Error al crear favorito",
  failed_to_rename_favorite: "Error al renombrar favorito",
  project_link_copied_to_clipboard: "Enlace del proyecto copiado al portapapeles",
  link_copied: "Enlace copiado",
  add_project: "Agregar proyecto",
  create_project: "Crear proyecto",
  failed_to_remove_project_from_favorites:
    "No se pudo eliminar el proyecto de favoritos. Por favor, inténtalo de nuevo.",
  project_created_successfully: "Proyecto creado exitosamente",
  project_created_successfully_description:
    "Proyecto creado exitosamente. Ahora puedes comenzar a agregar elementos de trabajo.",
  project_name_already_taken: "El nombre del proyecto ya está en uso.",
  project_identifier_already_taken: "El identificador del proyecto ya está en uso.",
  project_cover_image_alt: "Imagen de portada del proyecto",
  name_is_required: "El nombre es requerido",
  title_should_be_less_than_255_characters: "El título debe tener menos de 255 caracteres",
  project_name: "Nombre del proyecto",
  project_id_must_be_at_least_1_character: "El ID del proyecto debe tener al menos 1 carácter",
  project_id_must_be_at_most_5_characters: "El ID del proyecto debe tener como máximo 5 caracteres",
  project_id: "ID del proyecto",
  project_id_tooltip_content:
    "Te ayuda a identificar elementos de trabajo en el proyecto de manera única. Máximo 50 caracteres.",
  description_placeholder: "Descripción",
  only_alphanumeric_non_latin_characters_allowed: "Solo se permiten caracteres alfanuméricos y no latinos.",
  project_id_is_required: "El ID del proyecto es requerido",
  project_id_allowed_char: "Solo se permiten caracteres alfanuméricos y no latinos.",
  project_id_min_char: "El ID del proyecto debe tener al menos 1 carácter",
  project_id_max_char: "El ID del proyecto debe tener como máximo {max} caracteres",
  project_description_placeholder: "Ingresa la descripción del proyecto",
  select_network: "Seleccionar red",
  lead: "Líder",
  date_range: "Rango de fechas",
  private: "Privado",
  public: "Público",
  accessible_only_by_invite: "Accesible solo por invitación",
  anyone_in_the_workspace_except_guests_can_join: "Cualquiera en el espacio de trabajo excepto invitados puede unirse",
  creating: "Creando",
  creating_project: "Creando proyecto",
  adding_project_to_favorites: "Agregando proyecto a favoritos",
  project_added_to_favorites: "Proyecto agregado a favoritos",
  couldnt_add_the_project_to_favorites: "No se pudo agregar el proyecto a favoritos. Por favor, inténtalo de nuevo.",
  removing_project_from_favorites: "Eliminando proyecto de favoritos",
  project_removed_from_favorites: "Proyecto eliminado de favoritos",
  couldnt_remove_the_project_from_favorites:
    "No se pudo eliminar el proyecto de favoritos. Por favor, inténtalo de nuevo.",
  add_to_favorites: "Agregar a favoritos",
  remove_from_favorites: "Eliminar de favoritos",
  publish_project: "Publicar proyecto",
  publish: "Publicar",
  copy_link: "Copiar enlace",
  leave_project: "Abandonar proyecto",
  join_the_project_to_rearrange: "Únete al proyecto para reorganizar",
  drag_to_rearrange: "Arrastra para reorganizar",
  congrats: "¡Felicitaciones!",
  open_project: "Abrir proyecto",
  issues: "Elementos de trabajo",
  cycles: "Ciclos",
  modules: "Módulos",
  pages: {
    link_pages: "Enlazar páginas",
    show_wiki_pages: "Mostrar páginas de wiki",
    link_pages_to: "Enlazar páginas a",
    linked_pages: "Páginas enlazadas",
    no_description: "Esta página está vacía. Escriba algo aquí y véalo como este marcador de posición",
    toasts: {
      link: {
        success: {
          title: "Páginas actualizadas",
          message: "Páginas actualizadas con éxito",
        },
        error: {
          title: "Páginas no actualizadas",
          message: "No se pudieron actualizar las páginas",
        },
      },
      remove: {
        success: {
          title: "Página eliminada",
          message: "Página eliminada con éxito",
        },
        error: {
          title: "Página no eliminada",
          message: "No se pudo eliminar la página",
        },
      },
    },
  },
  intake: "Entrada",
  renew: "Renovar",
  preview: "Vista previa",
  time_tracking: "Seguimiento de tiempo",
  work_management: "Gestión del trabajo",
  projects_and_issues: "Proyectos y elementos de trabajo",
  projects_and_issues_description: "Activa o desactiva estos en este proyecto.",
  cycles_description:
    "Organiza el trabajo por proyecto en períodos de tiempo y ajusta la duración según sea necesario. Un ciclo puede ser de 2 semanas y el siguiente de 1 semana.",
  modules_description: "Organiza el trabajo en subproyectos con líderes y responsables dedicados.",
  views_description:
    "Guarda ordenamientos, filtros y opciones de visualización personalizadas o compártelos con tu equipo.",
  pages_description: "Crea y edita contenido libre; notas, documentos, lo que sea.",
  intake_description:
    "Permite que personas ajenas al equipo compartan errores, comentarios y sugerencias sin interrumpir tu flujo de trabajo.",
  time_tracking_description: "Registra el tiempo dedicado a elementos de trabajo y proyectos.",
  work_management_description: "Gestiona tu trabajo y proyectos con facilidad.",
  documentation: "Documentación",
  message_support: "Mensaje al soporte",
  contact_sales: "Contactar ventas",
  hyper_mode: "Modo Hyper",
  keyboard_shortcuts: "Atajos de teclado",
  whats_new: "¿Qué hay de nuevo?",
  version: "Versión",
  we_are_having_trouble_fetching_the_updates: "Estamos teniendo problemas para obtener las actualizaciones.",
  our_changelogs: "nuestros registros de cambios",
  for_the_latest_updates: "para las últimas actualizaciones.",
  please_visit: "Por favor visita",
  docs: "Documentación",
  full_changelog: "Registro de cambios completo",
  support: "Soporte",
  forum: "Forum",
  powered_by_plane_pages: "Desarrollado por Plane Pages",
  please_select_at_least_one_invitation: "Por favor selecciona al menos una invitación.",
  please_select_at_least_one_invitation_description:
    "Por favor selecciona al menos una invitación para unirte al espacio de trabajo.",
  we_see_that_someone_has_invited_you_to_join_a_workspace:
    "Vemos que alguien te ha invitado a unirte a un espacio de trabajo",
  join_a_workspace: "Únete a un espacio de trabajo",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description:
    "Vemos que alguien te ha invitado a unirte a un espacio de trabajo",
  join_a_workspace_description: "Únete a un espacio de trabajo",
  accept_and_join: "Aceptar y unirse",
  go_home: "Ir a inicio",
  no_pending_invites: "No hay invitaciones pendientes",
  you_can_see_here_if_someone_invites_you_to_a_workspace:
    "Puedes ver aquí si alguien te invita a un espacio de trabajo",
  back_to_home: "Volver a inicio",
  workspace_name: "nombre-del-espacio-de-trabajo",
  deactivate_your_account: "Desactivar tu cuenta",
  deactivate_your_account_description:
    "Una vez desactivada, no se te podrán asignar elementos de trabajo ni se te facturará por tu espacio de trabajo. Para reactivar tu cuenta, necesitarás una invitación a un espacio de trabajo con esta dirección de correo electrónico.",
  deactivating: "Desactivando",
  confirm: "Confirmar",
  confirming: "Confirmando",
  draft_created: "Borrador creado",
  issue_created_successfully: "Elemento de trabajo creado exitosamente",
  draft_creation_failed: "Error al crear borrador",
  issue_creation_failed: "Error al crear elemento de trabajo",
  draft_issue: "Borrador de elemento de trabajo",
  issue_updated_successfully: "Elemento de trabajo actualizado exitosamente",
  issue_could_not_be_updated: "El elemento de trabajo no pudo ser actualizado",
  create_a_draft: "Crear un borrador",
  save_to_drafts: "Guardar en borradores",
  save: "Guardar",
  update: "Actualizar",
  updating: "Actualizando",
  create_new_issue: "Crear nuevo elemento de trabajo",
  editor_is_not_ready_to_discard_changes: "El editor no está listo para descartar cambios",
  failed_to_move_issue_to_project: "Error al mover elemento de trabajo al proyecto",
  create_more: "Crear más",
  add_to_project: "Agregar al proyecto",
  discard: "Descartar",
  duplicate_issue_found: "Se encontró un elemento de trabajo duplicado",
  duplicate_issues_found: "Se encontraron elementos de trabajo duplicados",
  no_matching_results: "No hay resultados coincidentes",
  title_is_required: "El título es requerido",
  title: "Título",
  state: "Estado",
  transition: "Transición",
  history: "Historial",
  priority: "Prioridad",
  none: "Ninguno",
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Baja",
  members: "Miembros",
  assignee: "Asignado",
  assignees: "Asignados",
  subscriber: "{count, plural, one{# Suscriptor} other{# Suscriptores}}",
  you: "Tú",
  labels: "Etiquetas",
  create_new_label: "Crear nueva etiqueta",
  label_name: "Nombre de etiqueta",
  failed_to_create_label: "No se pudo crear la etiqueta. Por favor, inténtelo de nuevo.",
  start_date: "Fecha de inicio",
  end_date: "Fecha de fin",
  due_date: "Fecha de vencimiento",
  estimate: "Estimación",
  change_parent_issue: "Cambiar elemento de trabajo padre",
  remove_parent_issue: "Eliminar elemento de trabajo padre",
  add_parent: "Agregar padre",
  loading_members: "Cargando miembros",
  view_link_copied_to_clipboard: "Enlace de vista copiado al portapapeles.",
  required: "Requerido",
  optional: "Opcional",
  Cancel: "Cancelar",
  edit: "Editar",
  archive: "Archivar",
  restore: "Restaurar",
  open_in_new_tab: "Abrir en nueva pestaña",
  delete: "Eliminar",
  deleting: "Eliminando",
  make_a_copy: "Hacer una copia",
  move_to_project: "Mover al proyecto",
  good: "Buenos",
  morning: "días",
  afternoon: "tardes",
  evening: "noches",
  show_all: "Mostrar todo",
  show_less: "Mostrar menos",
  no_data_yet: "Aún no hay datos",
  syncing: "Sincronizando",
  add_work_item: "Agregar elemento de trabajo",
  advanced_description_placeholder: "Presiona '/' para comandos",
  create_work_item: "Crear elemento de trabajo",
  attachments: "Archivos adjuntos",
  declining: "Rechazando",
  declined: "Rechazado",
  decline: "Rechazar",
  unassigned: "Sin asignar",
  work_items: "Elementos de trabajo",
  add_link: "Agregar enlace",
  points: "Puntos",
  no_assignee: "Sin asignado",
  no_assignees_yet: "Aún no hay asignados",
  no_labels_yet: "Aún no hay etiquetas",
  ideal: "Ideal",
  current: "Actual",
  no_matching_members: "No hay miembros coincidentes",
  leaving: "Abandonando",
  removing: "Eliminando",
  leave: "Abandonar",
  refresh: "Actualizar",
  refreshing: "Actualizando",
  refresh_status: "Actualizar estado",
  prev: "Anterior",
  next: "Siguiente",
  re_generating: "Regenerando",
  re_generate: "Regenerar",
  re_generate_key: "Regenerar clave",
  export: "Exportar",
  member: "{count, plural, one{# miembro} other{# miembros}}",
  new_password_must_be_different_from_old_password: "La nueva contraseña debe ser diferente a la contraseña anterior",
  edited: "Modificado",
  bot: "Bot",
  project_view: {
    sort_by: {
      created_at: "Creado el",
      updated_at: "Actualizado el",
      name: "Nombre",
    },
  },
  upgrade_request: "Pide a tu administrador del espacio de trabajo que actualice.",
  copied_to_clipboard: "Copiado al portapapeles",
  copied_to_clipboard_description: "La URL se ha copiado correctamente al portapapeles",
  toast: {
    success: "¡Éxito!",
    error: "¡Error!",
  },
  links: {
    toasts: {
      created: {
        title: "Enlace creado",
        message: "El enlace se ha creado correctamente",
      },
      not_created: {
        title: "Enlace no creado",
        message: "No se pudo crear el enlace",
      },
      updated: {
        title: "Enlace actualizado",
        message: "El enlace se ha actualizado correctamente",
      },
      not_updated: {
        title: "Enlace no actualizado",
        message: "No se pudo actualizar el enlace",
      },
      removed: {
        title: "Enlace eliminado",
        message: "El enlace se ha eliminado correctamente",
      },
      not_removed: {
        title: "Enlace no eliminado",
        message: "No se pudo eliminar el enlace",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "Guía de inicio rápido",
      not_right_now: "Ahora no",
      create_project: {
        title: "Crear un proyecto",
        description: "La mayoría de las cosas comienzan con un proyecto en Plane.",
        cta: "Comenzar",
      },
      invite_team: {
        title: "Invita a tu equipo",
        description: "Construye, implementa y gestiona con compañeros de trabajo.",
        cta: "Hazlos entrar",
      },
      configure_workspace: {
        title: "Configura tu espacio de trabajo.",
        description: "Activa o desactiva funciones o ve más allá.",
        cta: "Configurar este espacio de trabajo",
      },
      personalize_account: {
        title: "Haz Plane tuyo.",
        description: "Elige tu foto, colores y más.",
        cta: "Personalizar ahora",
      },
      widgets: {
        title: "Está Silencioso Sin Widgets, Actívalos",
        description: `Parece que todos tus widgets están desactivados. ¡Actívalos
ahora para mejorar tu experiencia!`,
        primary_button: {
          text: "Gestionar widgets",
        },
      },
    },
    quick_links: {
      empty: "Guarda enlaces a cosas de trabajo que te gustaría tener a mano.",
      add: "Agregar enlace rápido",
      title: "Enlace rápido",
      title_plural: "Enlaces rápidos",
    },
    recents: {
      title: "Recientes",
      empty: {
        project: "Tus proyectos recientes aparecerán aquí una vez que visites uno.",
        page: "Tus páginas recientes aparecerán aquí una vez que visites una.",
        issue: "Tus elementos de trabajo recientes aparecerán aquí una vez que visites uno.",
        default: "Aún no tienes elementos recientes.",
      },
      filters: {
        all: "Todos",
        projects: "Proyectos",
        pages: "Páginas",
        issues: "Elementos de trabajo",
      },
    },
    new_at_plane: {
      title: "Nuevo en Plane",
    },
    quick_tutorial: {
      title: "Tutorial rápido",
    },
    widget: {
      reordered_successfully: "Widget reordenado correctamente.",
      reordering_failed: "Ocurrió un error al reordenar el widget.",
    },
    manage_widgets: "Gestionar widgets",
    title: "Inicio",
    star_us_on_github: "Danos una estrella en GitHub",
    business_trial_banner: {
      title: "¡Tu prueba de 14 días del plan Business está activa!",
      description:
        "Explora todas las funciones Business. Cuando estés listo, elige suscribirte. No se te cobrará automáticamente.",
      trial_ends_today: "La prueba termina hoy",
      trial_ends_in_days: "La prueba termina en {days, plural, one {# día} other {# días}}",
      start_subscription: "Iniciar suscripción",
      explore_business_features: "Explorar funciones Business",
    },
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "La URL no es válida",
        placeholder: "Escribe o pega una URL",
      },
      title: {
        text: "Título a mostrar",
        placeholder: "Cómo te gustaría ver este enlace",
      },
    },
  },
  common: {
    all: "Todo",
    no_items_in_this_group: "No hay elementos en este grupo",
    drop_here_to_move: "Suelta aquí para mover",
    states: "Estados",
    state: "Estado",
    state_groups: "Grupos de estados",
    state_group: "Grupos de estado",
    priorities: "Prioridades",
    priority: "Prioridad",
    team_project: "Proyecto de equipo",
    project: "Proyecto",
    cycle: "Ciclo",
    cycles: "Ciclos",
    module: "Módulo",
    modules: "Módulos",
    labels: "Etiquetas",
    label: "Etiqueta",
    assignees: "Asignados",
    assignee: "Asignado",
    created_by: "Creado por",
    none: "Ninguno",
    link: "Enlace",
    estimates: "Estimaciones",
    estimate: "Estimación",
    created_at: "Creado en",
    updated_at: "Actualizado el",
    completed_at: "Completado en",
    layout: "Diseño",
    filters: "Filtros",
    display: "Mostrar",
    load_more: "Cargar más",
    activity: "Actividad",
    analytics: "Análisis",
    dates: "Fechas",
    success: "¡Éxito!",
    something_went_wrong: "Algo salió mal",
    error: {
      label: "¡Error!",
      message: "Ocurrió un error. Por favor, inténtalo de nuevo.",
    },
    group_by: "Agrupar por",
    epic: "Epic",
    epics: "Epics",
    work_item: "Elemento de trabajo",
    work_items: "Elementos de trabajo",
    sub_work_item: "Sub-elemento de trabajo",
    add: "Agregar",
    warning: "Advertencia",
    updating: "Actualizando",
    adding: "Agregando",
    update: "Actualizar",
    creating: "Creando",
    create: "Crear",
    cancel: "Cancelar",
    description: "Descripción",
    title: "Título",
    attachment: "Archivo adjunto",
    general: "General",
    features: "Características",
    automation: "Automatización",
    project_name: "Nombre del proyecto",
    project_id: "ID del proyecto",
    project_timezone: "Zona horaria del proyecto",
    created_on: "Creado el",
    update_project: "Actualizar proyecto",
    identifier_already_exists: "El identificador ya existe",
    add_more: "Agregar más",
    defaults: "Valores predeterminados",
    add_label: "Agregar etiqueta",
    customize_time_range: "Personalizar rango de tiempo",
    loading: "Cargando",
    attachments: "Archivos adjuntos",
    property: "Propiedad",
    properties: "Propiedades",
    parent: "Padre",
    page: "página",
    remove: "Eliminar",
    archiving: "Archivando",
    archive: "Archivar",
    access: {
      public: "Público",
      private: "Privado",
    },
    done: "Hecho",
    sub_work_items: "Sub-elementos de trabajo",
    comment: "Comentario",
    workspace_level: "Nivel de espacio de trabajo",
    order_by: {
      label: "Ordenar por",
      manual: "Manual",
      last_created: "Último creado",
      last_updated: "Última actualización",
      start_date: "Fecha de inicio",
      due_date: "Fecha de vencimiento",
      asc: "Ascendente",
      desc: "Descendente",
      updated_on: "Actualizado el",
    },
    sort: {
      asc: "Ascendente",
      desc: "Descendente",
      created_on: "Creado el",
      updated_on: "Actualizado el",
    },
    comments: "Comentarios",
    updates: "Actualizaciones",
    additional_updates: "Actualizaciones adicionales",
    clear_all: "Limpiar todo",
    copied: "¡Copiado!",
    link_copied: "¡Enlace copiado!",
    link_copied_to_clipboard: "Enlace copiado al portapapeles",
    copied_to_clipboard: "Enlace del elemento de trabajo copiado al portapapeles",
    branch_name_copied_to_clipboard: "Nombre de rama copiado al portapapeles",
    is_copied_to_clipboard: "El elemento de trabajo está copiado al portapapeles",
    no_links_added_yet: "Aún no se han agregado enlaces",
    add_link: "Agregar enlace",
    links: "Enlaces",
    go_to_workspace: "Ir al espacio de trabajo",
    progress: "Progreso",
    optional: "Opcional",
    join: "Unirse",
    go_back: "Volver",
    continue: "Continuar",
    resend: "Reenviar",
    relations: "Relaciones",
    errors: {
      default: {
        title: "¡Error!",
        message: "Algo salió mal. Por favor, inténtalo de nuevo.",
      },
      required: "Este campo es obligatorio",
      entity_required: "{entity} es obligatorio",
      restricted_entity: "{entity} está restringido",
    },
    update_link: "Actualizar enlace",
    attach: "Adjuntar",
    create_new: "Crear nuevo",
    add_existing: "Agregar existente",
    type_or_paste_a_url: "Escribe o pega una URL",
    url_is_invalid: "La URL no es válida",
    display_title: "Título a mostrar",
    link_title_placeholder: "Cómo te gustaría ver este enlace",
    url: "URL",
    side_peek: "Vista lateral",
    modal: "Modal",
    full_screen: "Pantalla completa",
    close_peek_view: "Cerrar la vista previa",
    toggle_peek_view_layout: "Alternar diseño de vista previa",
    options: "Opciones",
    duration: "Duración",
    today: "Hoy",
    week: "Semana",
    month: "Mes",
    quarter: "Trimestre",
    press_for_commands: "Presiona '/' para comandos",
    click_to_add_description: "Haz clic para agregar descripción",
    search: {
      label: "Buscar",
      placeholder: "Escribe para buscar",
      no_matches_found: "No se encontraron coincidencias",
      no_matching_results: "No hay resultados coincidentes",
    },
    actions: {
      edit: "Editar",
      make_a_copy: "Hacer una copia",
      open_in_new_tab: "Abrir en nueva pestaña",
      copy_link: "Copiar enlace",
      copy_branch_name: "Copiar nombre de rama",
      archive: "Archivar",
      delete: "Eliminar",
      remove_relation: "Eliminar relación",
      subscribe: "Suscribirse",
      unsubscribe: "Cancelar suscripción",
      clear_sorting: "Limpiar ordenamiento",
      show_weekends: "Mostrar fines de semana",
      enable: "Habilitar",
      disable: "Deshabilitar",
    },
    name: "Nombre",
    discard: "Descartar",
    confirm: "Confirmar",
    confirming: "Confirmando",
    read_the_docs: "Leer la documentación",
    default: "Predeterminado",
    active: "Activo",
    enabled: "Habilitado",
    disabled: "Deshabilitado",
    mandate: "Mandato",
    mandatory: "Obligatorio",
    yes: "Sí",
    no: "No",
    please_wait: "Por favor espera",
    enabling: "Habilitando",
    disabling: "Deshabilitando",
    beta: "Beta",
    or: "o",
    next: "Siguiente",
    back: "Atrás",
    cancelling: "Cancelando",
    configuring: "Configurando",
    clear: "Limpiar",
    import: "Importar",
    connect: "Conectar",
    authorizing: "Autorizando",
    processing: "Procesando",
    no_data_available: "No hay datos disponibles",
    from: "de {name}",
    authenticated: "Autenticado",
    select: "Seleccionar",
    upgrade: "Mejorar",
    add_seats: "Agregar asientos",
    projects: "Proyectos",
    workspace: "Espacio de trabajo",
    workspaces: "Espacios de trabajo",
    team: "Equipo",
    teams: "Equipos",
    entity: "Entidad",
    entities: "Entidades",
    task: "Tarea",
    tasks: "Tareas",
    section: "Sección",
    sections: "Secciones",
    edit: "Editar",
    connecting: "Conectando",
    connected: "Conectado",
    disconnect: "Desconectar",
    disconnecting: "Desconectando",
    installing: "Instalando",
    install: "Instalar",
    reset: "Reiniciar",
    live: "En vivo",
    change_history: "Historial de cambios",
    coming_soon: "Próximamente",
    member: "Miembro",
    members: "Miembros",
    you: "Tú",
    upgrade_cta: {
      higher_subscription: "Mejorar a una suscripción más alta",
      talk_to_sales: "Hablar con ventas",
    },
    category: "Categoría",
    categories: "Categorías",
    saving: "Guardando",
    save_changes: "Guardar cambios",
    delete: "Eliminar",
    deleting: "Eliminando",
    pending: "Pendiente",
    invite: "Invitar",
    view: "Ver",
    deactivated_user: "Usuario desactivado",
    apply: "Aplicar",
    applying: "Aplicando",
    users: "Usuarios",
    admins: "Administradores",
    guests: "Invitados",
    on_track: "En camino",
    off_track: "Fuera de camino",
    at_risk: "En riesgo",
    timeline: "Cronograma",
    completion: "Finalización",
    upcoming: "Próximo",
    completed: "Completado",
    in_progress: "En progreso",
    planned: "Planificado",
    paused: "Pausado",
    no_of: "N.º de {entity}",
    resolved: "Resuelto",
    worklogs: "Registros de trabajo",
    project_updates: "Actualizaciones del proyecto",
    overview: "Resumen",
    workflows: "Flujos de trabajo",
    members_and_teamspaces: "Miembros y espacios de equipo",
    open_in_full_screen: "Abrir {page} en pantalla completa",
  },
  chart: {
    x_axis: "Eje X",
    y_axis: "Eje Y",
    metric: "Métrica",
  },
  form: {
    title: {
      required: "El título es obligatorio",
      max_length: "El título debe tener menos de {length} caracteres",
    },
  },
  entity: {
    grouping_title: "Agrupación de {entity}",
    priority: "Prioridad de {entity}",
    all: "Todos los {entity}",
    drop_here_to_move: "Suelta aquí para mover el {entity}",
    delete: {
      label: "Eliminar {entity}",
      success: "{entity} eliminado correctamente",
      failed: "Error al eliminar {entity}",
    },
    update: {
      failed: "Error al actualizar {entity}",
      success: "{entity} actualizado correctamente",
    },
    link_copied_to_clipboard: "Enlace de {entity} copiado al portapapeles",
    fetch: {
      failed: "Error al obtener {entity}",
    },
    add: {
      success: "{entity} agregado correctamente",
      failed: "Error al agregar {entity}",
    },
    remove: {
      success: "{entity} eliminado correctamente",
      failed: "Error al eliminar {entity}",
    },
  },
  epic: {
    all: "Todos los Epics",
    label: "{count, plural, one {Epic} other {Epics}}",
    new: "Nuevo Epic",
    adding: "Agregando epic",
    create: {
      success: "Epic creado correctamente",
    },
    add: {
      press_enter: "Presiona 'Enter' para agregar otro epic",
      label: "Agregar Epic",
    },
    title: {
      label: "Título del Epic",
      required: "El título del epic es obligatorio.",
    },
    archive: {
      description: `Solo los epics completados o cancelados
pueden ser archivados`,
      label: "Archivar Epic",
      confirm_message:
        "¿Estás seguro de que quieres archivar el epic? Todos tus epics archivados pueden restaurarse más tarde.",
      success: {
        label: "Archivo exitoso",
        message: "Tus archivos se encuentran en los archivos del proyecto.",
      },
      failed: {
        message: "No se pudo archivar el epic. Por favor, inténtalo de nuevo.",
      },
    },
  },
  issue: {
    label: "{count, plural, one {Elemento de trabajo} other {Elementos de trabajo}}",
    all: "Todos los elementos de trabajo",
    edit: "Editar elemento de trabajo",
    title: {
      label: "Título del elemento de trabajo",
      required: "El título del elemento de trabajo es obligatorio.",
    },
    add: {
      press_enter: "Presiona 'Enter' para agregar otro elemento de trabajo",
      label: "Agregar elemento de trabajo",
      cycle: {
        failed: "No se pudo agregar el elemento de trabajo al ciclo. Por favor, inténtalo de nuevo.",
        success:
          "{count, plural, one {Elemento de trabajo agregado} other {Elementos de trabajo agregados}} al ciclo correctamente.",
        loading: "Agregando {count, plural, one {elemento de trabajo} other {elementos de trabajo}} al ciclo",
      },
      assignee: "Agregar asignados",
      start_date: "Agregar fecha de inicio",
      due_date: "Agregar fecha de vencimiento",
      parent: "Agregar elemento de trabajo padre",
      sub_issue: "Agregar sub-elemento de trabajo",
      relation: "Agregar relación",
      link: "Agregar enlace",
      existing: "Agregar elemento de trabajo existente",
    },
    remove: {
      label: "Eliminar elemento de trabajo",
      cycle: {
        loading: "Eliminando elemento de trabajo del ciclo",
        success: "Elemento de trabajo eliminado del ciclo correctamente.",
        failed: "No se pudo eliminar el elemento de trabajo del ciclo. Por favor, inténtalo de nuevo.",
      },
      module: {
        loading: "Eliminando elemento de trabajo del módulo",
        success: "Elemento de trabajo eliminado del módulo correctamente.",
        failed: "No se pudo eliminar el elemento de trabajo del módulo. Por favor, inténtalo de nuevo.",
      },
      parent: {
        label: "Eliminar elemento de trabajo padre",
      },
    },
    new: "Nuevo elemento de trabajo",
    adding: "Agregando elemento de trabajo",
    create: {
      success: "Elemento de trabajo creado correctamente",
    },
    priority: {
      urgent: "Urgente",
      high: "Alta",
      medium: "Media",
      low: "Baja",
    },
    display: {
      properties: {
        label: "Mostrar propiedades",
        id: "ID",
        issue_type: "Tipo de elemento de trabajo",
        sub_issue_count: "Cantidad de sub-elementos",
        attachment_count: "Cantidad de archivos adjuntos",
        created_on: "Creado el",
        sub_issue: "Sub-elemento de trabajo",
        work_item_count: "Recuento de elementos de trabajo",
      },
      extra: {
        show_sub_issues: "Mostrar sub-elementos",
        show_empty_groups: "Mostrar grupos vacíos",
      },
    },
    layouts: {
      ordered_by_label: "Este diseño está ordenado por",
      list: "Lista",
      kanban: "Tablero",
      calendar: "Calendario",
      spreadsheet: "Tabla",
      gantt: "Línea de tiempo",
      title: {
        list: "Diseño de lista",
        kanban: "Diseño de tablero",
        calendar: "Diseño de calendario",
        spreadsheet: "Diseño de tabla",
        gantt: "Diseño de línea de tiempo",
      },
    },
    states: {
      active: "Activo",
      backlog: "Pendientes",
    },
    comments: {
      placeholder: "Agregar comentario",
      switch: {
        private: "Cambiar a comentario privado",
        public: "Cambiar a comentario público",
      },
      create: {
        success: "Comentario creado correctamente",
        error: "Error al crear el comentario. Por favor, inténtalo más tarde.",
      },
      update: {
        success: "Comentario actualizado correctamente",
        error: "Error al actualizar el comentario. Por favor, inténtalo más tarde.",
      },
      remove: {
        success: "Comentario eliminado correctamente",
        error: "Error al eliminar el comentario. Por favor, inténtalo más tarde.",
      },
      upload: {
        error: "Error al subir el archivo. Por favor, inténtalo más tarde.",
      },
      copy_link: {
        success: "Enlace del comentario copiado al portapapeles",
        error: "Error al copiar el enlace del comentario. Inténtelo de nuevo más tarde.",
      },
    },
    empty_state: {
      issue_detail: {
        title: "El elemento de trabajo no existe",
        description: "El elemento de trabajo que buscas no existe, ha sido archivado o ha sido eliminado.",
        primary_button: {
          text: "Ver otros elementos de trabajo",
        },
      },
    },
    sibling: {
      label: "Elementos de trabajo hermanos",
    },
    archive: {
      description: `Solo los elementos de trabajo completados
o cancelados pueden ser archivados`,
      label: "Archivar elemento de trabajo",
      confirm_message:
        "¿Estás seguro de que quieres archivar el elemento de trabajo? Todos tus elementos archivados pueden ser restaurados más tarde.",
      success: {
        label: "Archivo exitoso",
        message: "Tus archivos se pueden encontrar en los archivos del proyecto.",
      },
      failed: {
        message: "No se pudo archivar el elemento de trabajo. Por favor, inténtalo de nuevo.",
      },
    },
    restore: {
      success: {
        title: "Restauración exitosa",
        message: "Tu elemento de trabajo se puede encontrar en los elementos de trabajo del proyecto.",
      },
      failed: {
        message: "No se pudo restaurar el elemento de trabajo. Por favor, inténtalo de nuevo.",
      },
    },
    relation: {
      relates_to: "Se relaciona con",
      duplicate: "Duplicado de",
      blocked_by: "Bloqueado por",
      blocking: "Bloqueando",
      start_before: "Comienza antes",
      start_after: "Comienza después",
      finish_before: "Termina antes",
      finish_after: "Termina después",
      implements: "Implementa",
      implemented_by: "Implementado por",
    },
    copy_link: "Copiar enlace del elemento de trabajo",
    delete: {
      label: "Eliminar elemento de trabajo",
      error: "Error al eliminar el elemento de trabajo",
    },
    subscription: {
      actions: {
        subscribed: "Suscrito al elemento de trabajo correctamente",
        unsubscribed: "Desuscrito del elemento de trabajo correctamente",
      },
    },
    select: {
      error: "Por favor selecciona al menos un elemento de trabajo",
      empty: "No hay elementos de trabajo seleccionados",
      add_selected: "Agregar elementos seleccionados",
      select_all: "Seleccionar todo",
      deselect_all: "Deseleccionar todo",
    },
    open_in_full_screen: "Abrir elemento de trabajo en pantalla completa",
    vote: {
      click_to_upvote: "Haz clic para votar a favor",
      click_to_downvote: "Haz clic para votar en contra",
      click_to_view_upvotes: "Haz clic para ver los votos a favor",
      click_to_view_downvotes: "Haz clic para ver los votos en contra",
    },
  },
  attachment: {
    error: "No se pudo adjuntar el archivo. Intenta subirlo de nuevo.",
    only_one_file_allowed: "Solo se puede subir un archivo a la vez.",
    file_size_limit: "El archivo debe tener {size}MB o menos de tamaño.",
    drag_and_drop: "Arrastra y suelta en cualquier lugar para subir",
    delete: "Eliminar archivo adjunto",
  },
  label: {
    select: "Seleccionar etiqueta",
    create: {
      success: "Etiqueta creada correctamente",
      failed: "Error al crear la etiqueta",
      already_exists: "La etiqueta ya existe",
      type: "Escribe para agregar una nueva etiqueta",
    },
  },
  sub_work_item: {
    update: {
      success: "Sub-elemento actualizado correctamente",
      error: "Error al actualizar el sub-elemento",
    },
    remove: {
      success: "Sub-elemento eliminado correctamente",
      error: "Error al eliminar el sub-elemento",
    },
    empty_state: {
      sub_list_filters: {
        title: "No tienes sub-elementos de trabajo que coincidan con los filtros que has aplicado.",
        description: "Para ver todos los sub-elementos de trabajo, elimina todos los filtros aplicados.",
        action: "Eliminar filtros",
      },
      list_filters: {
        title: "No tienes elementos de trabajo que coincidan con los filtros que has aplicado.",
        description: "Para ver todos los elementos de trabajo, elimina todos los filtros aplicados.",
        action: "Eliminar filtros",
      },
    },
  },
  view: {
    label: "{count, plural, one {Vista} other {Vistas}}",
    create: {
      label: "Crear vista",
    },
    update: {
      label: "Actualizar vista",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "Pendiente",
        description: "Pendiente",
      },
      declined: {
        title: "Rechazado",
        description: "Rechazado",
      },
      snoozed: {
        title: "Pospuesto",
        description: "Faltan {days, plural, one{# día} other{# días}}",
      },
      accepted: {
        title: "Aceptado",
        description: "Aceptado",
      },
      duplicate: {
        title: "Duplicado",
        description: "Duplicado",
      },
    },
    modals: {
      decline: {
        title: "Rechazar elemento de trabajo",
        content: "¿Estás seguro de que quieres rechazar el elemento de trabajo {value}?",
      },
      delete: {
        title: "Eliminar elemento de trabajo",
        content: "¿Estás seguro de que quieres eliminar el elemento de trabajo {value}?",
        success: "Elemento de trabajo eliminado correctamente",
      },
    },
    errors: {
      snooze_permission: "Solo los administradores del proyecto pueden posponer/desposponer elementos de trabajo",
      accept_permission: "Solo los administradores del proyecto pueden aceptar elementos de trabajo",
      decline_permission: "Solo los administradores del proyecto pueden rechazar elementos de trabajo",
    },
    actions: {
      accept: "Aceptar",
      decline: "Rechazar",
      snooze: "Posponer",
      unsnooze: "Desposponer",
      copy: "Copiar enlace del elemento de trabajo",
      delete: "Eliminar",
      open: "Abrir elemento de trabajo",
      mark_as_duplicate: "Marcar como duplicado",
      move: "Mover {value} a elementos de trabajo del proyecto",
    },
    source: {
      "in-app": "en-app",
    },
    order_by: {
      created_at: "Creado el",
      updated_at: "Actualizado el",
      id: "ID",
    },
    label: "Intake",
    page_label: "{workspace} - Intake",
    modal: {
      title: "Crear elemento de trabajo de intake",
    },
    tabs: {
      open: "Abiertos",
      closed: "Cerrados",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "No hay elementos de trabajo abiertos",
        description: "Encuentra elementos de trabajo abiertos aquí. Crea un nuevo elemento de trabajo.",
      },
      sidebar_closed_tab: {
        title: "No hay elementos de trabajo cerrados",
        description: "Todos los elementos de trabajo, ya sean aceptados o rechazados, se pueden encontrar aquí.",
      },
      sidebar_filter: {
        title: "No hay elementos de trabajo coincidentes",
        description:
          "Ningún elemento de trabajo coincide con el filtro aplicado en intake. Crea un nuevo elemento de trabajo.",
      },
      detail: {
        title: "Selecciona un elemento de trabajo para ver sus detalles.",
      },
    },
  },
  workspace_creation: {
    heading: "Crea tu espacio de trabajo",
    subheading: "Para comenzar a usar Plane, necesitas crear o unirte a un espacio de trabajo.",
    form: {
      name: {
        label: "Nombra tu espacio de trabajo",
        placeholder: "Algo familiar y reconocible es siempre lo mejor.",
      },
      url: {
        label: "Establece la URL de tu espacio de trabajo",
        placeholder: "Escribe o pega una URL",
        edit_slug: "Solo puedes editar el slug de la URL",
      },
      organization_size: {
        label: "¿Cuántas personas usarán este espacio de trabajo?",
        placeholder: "Selecciona un rango",
      },
    },
    errors: {
      creation_disabled: {
        title: "Solo el administrador de tu instancia puede crear espacios de trabajo",
        description:
          "Si conoces la dirección de correo electrónico del administrador de tu instancia, haz clic en el botón de abajo para ponerte en contacto con él.",
        request_button: "Solicitar administrador de instancia",
      },
      validation: {
        name_alphanumeric:
          "Los nombres de espacios de trabajo solo pueden contener (' '), ('-'), ('_') y caracteres alfanuméricos.",
        name_length: "Limita tu nombre a 80 caracteres.",
        url_alphanumeric: "Las URLs solo pueden contener ('-') y caracteres alfanuméricos.",
        url_length: "Limita tu URL a 48 caracteres.",
        url_already_taken: "¡La URL del espacio de trabajo ya está en uso!",
      },
    },
    request_email: {
      subject: "Solicitando un nuevo espacio de trabajo",
      body: `Hola administrador(es) de instancia,

Por favor, crea un nuevo espacio de trabajo con la URL [/nombre-espacio-trabajo] para [propósito de crear el espacio de trabajo].

Gracias,
{firstName} {lastName}
{email}`,
    },
    button: {
      default: "Crear espacio de trabajo",
      loading: "Creando espacio de trabajo",
    },
    toast: {
      success: {
        title: "Éxito",
        message: "Espacio de trabajo creado correctamente",
      },
      error: {
        title: "Error",
        message: "No se pudo crear el espacio de trabajo. Por favor, inténtalo de nuevo.",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "Resumen de tus proyectos, actividad y métricas",
        description:
          "Bienvenido a Plane, estamos emocionados de tenerte aquí. Crea tu primer proyecto y rastrea tus elementos de trabajo, y esta página se transformará en un espacio que te ayuda a progresar. Los administradores también verán elementos que ayudan a su equipo a progresar.",
        primary_button: {
          text: "Construye tu primer proyecto",
          comic: {
            title: "Todo comienza con un proyecto en Plane",
            description:
              "Un proyecto podría ser la hoja de ruta de un producto, una campaña de marketing o el lanzamiento de un nuevo automóvil.",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "Análisis",
    page_label: "{workspace} - Análisis",
    open_tasks: "Total de tareas abiertas",
    error: "Hubo un error al obtener los datos.",
    work_items_closed_in: "Elementos de trabajo cerrados en",
    selected_projects: "Proyectos seleccionados",
    total_members: "Total de miembros",
    total_cycles: "Total de Ciclos",
    total_modules: "Total de Módulos",
    pending_work_items: {
      title: "Elementos de trabajo pendientes",
      empty_state: "El análisis de elementos de trabajo pendientes por compañeros aparece aquí.",
    },
    work_items_closed_in_a_year: {
      title: "Elementos de trabajo cerrados en un año",
      empty_state: "Cierra elementos de trabajo para ver su análisis en forma de gráfico.",
    },
    most_work_items_created: {
      title: "Más elementos de trabajo creados",
      empty_state: "Los compañeros y el número de elementos de trabajo creados por ellos aparecen aquí.",
    },
    most_work_items_closed: {
      title: "Más elementos de trabajo cerrados",
      empty_state: "Los compañeros y el número de elementos de trabajo cerrados por ellos aparecen aquí.",
    },
    tabs: {
      scope_and_demand: "Alcance y Demanda",
      custom: "Análisis Personalizado",
    },
    empty_state: {
      customized_insights: {
        description: "Los elementos de trabajo asignados a ti, desglosados por estado, aparecerán aquí.",
        title: "Aún no hay datos",
      },
      created_vs_resolved: {
        description: "Los elementos de trabajo creados y resueltos con el tiempo aparecerán aquí.",
        title: "Aún no hay datos",
      },
      project_insights: {
        title: "Aún no hay datos",
        description: "Los elementos de trabajo asignados a ti, desglosados por estado, aparecerán aquí.",
      },
      general: {
        title:
          "Rastrea el progreso, las cargas de trabajo y las asignaciones. Identifica tendencias, elimina bloqueos y trabaja más rápido",
        description:
          "Ve alcance versus demanda, estimaciones y crecimiento del alcance. Obtén rendimiento por miembros del equipo y equipos, y asegúrate de que tu proyecto se ejecute a tiempo.",
        primary_button: {
          text: "Inicia tu primer proyecto",
          comic: {
            title: "Analytics funciona mejor con Ciclos + Módulos",
            description:
              "Primero, encuadra tus elementos de trabajo en Ciclos y, si puedes, agrupa elementos que abarcan más de un ciclo en Módulos. Revisa ambos en la navegación izquierda.",
          },
        },
      },
      cycle_progress: {
        title: "Aún no hay datos",
        description:
          "Los análisis de progreso del ciclo aparecerán aquí. Agrega elementos de trabajo a los ciclos para comenzar a rastrear el progreso.",
      },
      module_progress: {
        title: "Aún no hay datos",
        description:
          "Los análisis de progreso del módulo aparecerán aquí. Agrega elementos de trabajo a los módulos para comenzar a rastrear el progreso.",
      },
      intake_trends: {
        title: "Aún no hay datos",
        description:
          "Los análisis de tendencias de entrada aparecerán aquí. Agrega elementos de trabajo a la entrada para comenzar a rastrear tendencias.",
      },
    },
    created_vs_resolved: "Creado vs Resuelto",
    customized_insights: "Información personalizada",
    backlog_work_items: "{entity} en backlog",
    active_projects: "Proyectos activos",
    trend_on_charts: "Tendencia en gráficos",
    all_projects: "Todos los proyectos",
    summary_of_projects: "Resumen de proyectos",
    project_insights: "Información del proyecto",
    started_work_items: "{entity} iniciados",
    total_work_items: "Total de {entity}",
    total_projects: "Total de proyectos",
    total_admins: "Total de administradores",
    total_users: "Total de usuarios",
    total_intake: "Ingreso total",
    un_started_work_items: "{entity} no iniciados",
    total_guests: "Total de invitados",
    completed_work_items: "{entity} completados",
    total: "Total de {entity}",
    projects_by_status: "Proyectos por estado",
    active_users: "Usuarios activos",
    intake_trends: "Tendencias de admisión",
    workitem_resolved_vs_pending: "Elementos de trabajo resueltos vs pendientes",
    upgrade_to_plan: "Mejora a {plan} para desbloquear {tab}",
  },
  workspace_projects: {
    label: "{count, plural, one {Proyecto} other {Proyectos}}",
    create: {
      label: "Agregar Proyecto",
    },
    network: {
      private: {
        title: "Privado",
        description: "Accesible solo por invitación",
      },
      public: {
        title: "Público",
        description: "Cualquiera en el espacio de trabajo excepto Invitados puede unirse",
      },
    },
    error: {
      permission: "No tienes permiso para realizar esta acción.",
      cycle_delete: "Error al eliminar el ciclo",
      module_delete: "Error al eliminar el módulo",
      issue_delete: "Error al eliminar el elemento de trabajo",
    },
    state: {
      backlog: "Pendiente",
      unstarted: "Sin iniciar",
      started: "Iniciado",
      completed: "Completado",
      cancelled: "Cancelado",
    },
    sort: {
      manual: "Manual",
      name: "Nombre",
      created_at: "Fecha de creación",
      members_length: "Número de miembros",
    },
    scope: {
      my_projects: "Mis proyectos",
      archived_projects: "Archivados",
    },
    common: {
      months_count: "{months, plural, one{# mes} other{# meses}}",
    },
    empty_state: {
      general: {
        title: "No hay proyectos activos",
        description:
          "Piensa en cada proyecto como el padre para el trabajo orientado a objetivos. Los proyectos son donde viven las Tareas, Ciclos y Módulos y, junto con tus colegas, te ayudan a alcanzar ese objetivo. Crea un nuevo proyecto o filtra por proyectos archivados.",
        primary_button: {
          text: "Inicia tu primer proyecto",
          comic: {
            title: "Todo comienza con un proyecto en Plane",
            description:
              "Un proyecto podría ser la hoja de ruta de un producto, una campaña de marketing o el lanzamiento de un nuevo automóvil.",
          },
        },
      },
      no_projects: {
        title: "Sin proyecto",
        description:
          "Para crear elementos de trabajo o gestionar tu trabajo, necesitas crear un proyecto o ser parte de uno.",
        primary_button: {
          text: "Inicia tu primer proyecto",
          comic: {
            title: "Todo comienza con un proyecto en Plane",
            description:
              "Un proyecto podría ser la hoja de ruta de un producto, una campaña de marketing o el lanzamiento de un nuevo automóvil.",
          },
        },
      },
      filter: {
        title: "No hay proyectos coincidentes",
        description: `No se detectaron proyectos con los criterios coincidentes.
 Crea un nuevo proyecto en su lugar.`,
      },
      search: {
        description: `No se detectaron proyectos con los criterios coincidentes.
Crea un nuevo proyecto en su lugar`,
      },
    },
  },
  workspace_views: {
    add_view: "Agregar vista",
    empty_state: {
      "all-issues": {
        title: "No hay elementos de trabajo en el proyecto",
        description:
          "¡Primer proyecto completado! Ahora, divide tu trabajo en piezas rastreables con elementos de trabajo. ¡Vamos!",
        primary_button: {
          text: "Crear nuevo elemento de trabajo",
        },
      },
      assigned: {
        title: "No hay elementos de trabajo aún",
        description: "Los elementos de trabajo asignados a ti se pueden rastrear desde aquí.",
        primary_button: {
          text: "Crear nuevo elemento de trabajo",
        },
      },
      created: {
        title: "No hay elementos de trabajo aún",
        description: "Todos los elementos de trabajo creados por ti vienen aquí, rastréalos aquí directamente.",
        primary_button: {
          text: "Crear nuevo elemento de trabajo",
        },
      },
      subscribed: {
        title: "No hay elementos de trabajo aún",
        description: "Suscríbete a los elementos de trabajo que te interesan, rastréalos todos aquí.",
      },
      "custom-view": {
        title: "No hay elementos de trabajo aún",
        description: "Elementos de trabajo que aplican a los filtros, rastréalos todos aquí.",
      },
    },
    delete_view: {
      title: "¿Estás seguro de que quieres eliminar esta vista?",
      content:
        "Si confirmas, todas las opciones de ordenación, filtro y visualización + el diseño que has elegido para esta vista se eliminarán permanentemente sin posibilidad de restaurarlas.",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "Cambiar correo electrónico",
        description: "Introduce una nueva dirección de correo electrónico para recibir un enlace de verificación.",
        toasts: {
          success_title: "¡Éxito!",
          success_message: "Correo electrónico actualizado correctamente. Inicia sesión de nuevo.",
        },
        form: {
          email: {
            label: "Nuevo correo electrónico",
            placeholder: "Introduce tu correo electrónico",
            errors: {
              required: "El correo electrónico es obligatorio",
              invalid: "El correo electrónico no es válido",
              exists: "El correo electrónico ya existe. Usa uno diferente.",
              validation_failed: "La validación del correo electrónico falló. Inténtalo de nuevo.",
            },
          },
          code: {
            label: "Código único",
            placeholder: "123456",
            helper_text: "Código de verificación enviado a tu nuevo correo electrónico.",
            errors: {
              required: "El código único es obligatorio",
              invalid: "Código de verificación inválido. Inténtalo de nuevo.",
            },
          },
        },
        actions: {
          continue: "Continuar",
          confirm: "Confirmar",
          cancel: "Cancelar",
        },
        states: {
          sending: "Enviando…",
        },
      },
    },
    notifications: {
      select_default_view: "Seleccionar vista predeterminada",
      compact: "Compacto",
      full: "Pantalla completa",
    },
  },
  workspace_settings: {
    label: "Configuración del espacio de trabajo",
    page_label: "{workspace} - Configuración general",
    key_created: "Clave creada",
    copy_key:
      "Copia y guarda esta clave secreta en Plane Pages. No podrás ver esta clave después de hacer clic en Cerrar. Se ha descargado un archivo CSV que contiene la clave.",
    token_copied: "Token copiado al portapapeles.",
    settings: {
      general: {
        title: "General",
        upload_logo: "Subir logo",
        edit_logo: "Editar logo",
        name: "Nombre del espacio de trabajo",
        company_size: "Tamaño de la empresa",
        url: "URL del espacio de trabajo",
        workspace_timezone: "Zona horaria del espacio de trabajo",
        update_workspace: "Actualizar espacio de trabajo",
        delete_workspace: "Eliminar este espacio de trabajo",
        delete_workspace_description:
          "Al eliminar un espacio de trabajo, todos los datos y recursos dentro de ese espacio se eliminarán permanentemente y no podrán recuperarse.",
        delete_btn: "Eliminar este espacio de trabajo",
        delete_modal: {
          title: "¿Está seguro de que desea eliminar este espacio de trabajo?",
          description:
            "Tiene una prueba activa de uno de nuestros planes de pago. Por favor, cancelela primero para continuar.",
          dismiss: "Descartar",
          cancel: "Cancelar prueba",
          success_title: "Espacio de trabajo eliminado.",
          success_message: "Pronto irá a su página de perfil.",
          error_title: "Eso no funcionó.",
          error_message: "Por favor, inténtelo de nuevo.",
        },
        errors: {
          name: {
            required: "El nombre es obligatorio",
            max_length: "El nombre del espacio de trabajo no debe exceder los 80 caracteres",
          },
          company_size: {
            required: "El tamaño de la empresa es obligatorio",
            select_a_range: "Seleccionar tamaño de la organización",
          },
        },
      },
      members: {
        title: "Miembros",
        add_member: "Agregar miembro",
        pending_invites: "Invitaciones pendientes",
        invitations_sent_successfully: "Invitaciones enviadas exitosamente",
        leave_confirmation:
          "¿Estás seguro de que quieres abandonar el espacio de trabajo? Ya no tendrás acceso a este espacio de trabajo. Esta acción no se puede deshacer.",
        details: {
          full_name: "Nombre completo",
          display_name: "Nombre para mostrar",
          email_address: "Dirección de correo electrónico",
          account_type: "Tipo de cuenta",
          authentication: "Autenticación",
          joining_date: "Fecha de incorporación",
        },
        modal: {
          title: "Invitar personas a colaborar",
          description: "Invita personas a colaborar en tu espacio de trabajo.",
          button: "Enviar invitaciones",
          button_loading: "Enviando invitaciones",
          placeholder: "nombre@empresa.com",
          errors: {
            required: "Necesitamos una dirección de correo electrónico para invitarlos.",
            invalid: "El correo electrónico no es válido",
          },
        },
      },
      billing_and_plans: {
        title: "Facturación y Planes",
        current_plan: "Plan actual",
        free_plan: "Actualmente estás usando el plan gratuito",
        view_plans: "Ver planes",
      },
      exports: {
        title: "Exportaciones",
        exporting: "Exportando",
        previous_exports: "Exportaciones anteriores",
        export_separate_files: "Exportar los datos en archivos separados",
        filters_info: "Aplica filtros para exportar elementos de trabajo específicos según tus criterios.",
        modal: {
          title: "Exportar a",
          toasts: {
            success: {
              title: "Exportación exitosa",
              message: "Podrás descargar el {entity} exportado desde la exportación anterior.",
            },
            error: {
              title: "Exportación fallida",
              message: "La exportación no tuvo éxito. Por favor, inténtalo de nuevo.",
            },
          },
        },
      },
      webhooks: {
        title: "Webhooks",
        add_webhook: "Agregar webhook",
        modal: {
          title: "Crear webhook",
          details: "Detalles del webhook",
          payload: "URL del payload",
          question: "¿Qué eventos te gustaría que activaran este webhook?",
          error: "La URL es obligatoria",
        },
        secret_key: {
          title: "Clave secreta",
          message: "Genera un token para iniciar sesión en el payload del webhook",
        },
        options: {
          all: "Envíame todo",
          individual: "Seleccionar eventos individuales",
        },
        toasts: {
          created: {
            title: "Webhook creado",
            message: "El webhook se ha creado exitosamente",
          },
          not_created: {
            title: "Webhook no creado",
            message: "No se pudo crear el webhook",
          },
          updated: {
            title: "Webhook actualizado",
            message: "El webhook se ha actualizado exitosamente",
          },
          not_updated: {
            title: "Webhook no actualizado",
            message: "No se pudo actualizar el webhook",
          },
          removed: {
            title: "Webhook eliminado",
            message: "El webhook se ha eliminado exitosamente",
          },
          not_removed: {
            title: "Webhook no eliminado",
            message: "No se pudo eliminar el webhook",
          },
          secret_key_copied: {
            message: "Clave secreta copiada al portapapeles.",
          },
          secret_key_not_copied: {
            message: "Ocurrió un error al copiar la clave secreta.",
          },
        },
      },
      api_tokens: {
        heading: "Tokens de API",
        description: "Genere tokens de API seguros para integrar sus datos con sistemas y aplicaciones externos.",
        title: "Tokens de API",
        add_token: "Agregar token de acceso",
        create_token: "Crear token",
        never_expires: "Nunca expira",
        generate_token: "Generar token",
        generating: "Generando",
        delete: {
          title: "Eliminar token de API",
          description:
            "Cualquier aplicación que use este token ya no tendrá acceso a los datos de Plane. Esta acción no se puede deshacer.",
          success: {
            title: "¡Éxito!",
            message: "El token de API se ha eliminado exitosamente",
          },
          error: {
            title: "¡Error!",
            message: "No se pudo eliminar el token de API",
          },
        },
      },
      integrations: {
        title: "Integraciones",
        page_title: "Trabaja con tus datos de Plane en aplicaciones disponibles o en las tuyas propias.",
        page_description: "Ver todas las integraciones en uso por este espacio de trabajo o por ti.",
      },
      imports: {
        title: "Importaciones",
      },
      worklogs: {
        title: "Registros de trabajo",
      },
      group_syncing: {
        title: "Sincronización de grupos",
        heading: "Sincronización de grupos",
        description:
          "Vincule los grupos del proveedor de identidad con proyectos y roles. El acceso de los usuarios se actualiza automáticamente cuando cambia la pertenencia al grupo en su IdP, simplificando la incorporación y baja.",
        enable: {
          title: "Activar sincronización de grupos",
          description: "Añadir automáticamente usuarios a proyectos según los grupos del proveedor de identidad.",
        },
        config: {
          title: "Configurar sincronización de grupos",
          description: "Configure cómo se asignan los grupos del proveedor de identidad a proyectos y roles.",
          sync_on_login: {
            title: "Sincronizar al iniciar sesión",
            description: "Actualizar pertenencia al grupo y acceso al proyecto cuando un usuario inicia sesión.",
          },
          sync_offline: {
            title: "Sincronización sin conexión",
            description:
              "Ejecuta la sincronización cada seis horas automáticamente, sin esperar a que los usuarios inicien sesión.",
          },
          auto_remove: {
            title: "Eliminación automática",
            description: "Eliminar automáticamente usuarios de proyectos cuando ya no coincidan con el grupo.",
          },
          group_attribute_key: {
            title: "Clave del atributo de grupo",
            description:
              "El atributo del proveedor de identidad usado para identificar y sincronizar grupos de usuarios.",
            placeholder: "Grupos",
          },
        },
        group_mapping: {
          title: "Asignación de grupos",
          description: "Vincule los grupos del proveedor de identidad con proyectos y roles.",
          button_text: "Añadir nueva sincronización de grupos",
        },
        toast: {
          updating: "Actualizando función de sincronización de grupos",
          success: "Función de sincronización de grupos actualizada correctamente.",
          error: "¡Error al actualizar la función de sincronización de grupos!",
        },
        delete_modal: {
          title: "Eliminar sincronización de grupos",
          content:
            "Los nuevos usuarios de este grupo de identidad ya no se añadirán al proyecto. Los usuarios ya añadidos conservarán su rol actual.",
        },
        modal: {
          idp_group_name: {
            text: "Grupo de usuario",
            required: "El grupo de usuario es obligatorio",
            placeholder: "Introduzca los nombres de grupos IdP",
          },
          project: {
            text: "Proyecto",
            required: "El proyecto es obligatorio",
            placeholder: "Seleccione un proyecto",
          },
          default_role: {
            text: "Rol del proyecto",
            required: "El rol del proyecto es obligatorio",
            placeholder: "Seleccione un rol del proyecto",
          },
        },
      },
      identity: {
        title: "Identidad",
        heading: "Identidad",
        description: "Configure su dominio y habilite el inicio de sesión único",
      },
      project_states: {
        title: "Estados del proyecto",
      },
      projects: {
        title: "Proyectos",
        description: "Administrar estados de proyectos, habilitar etiquetas de proyectos y otras configuraciones.",
        tabs: {
          states: "Estados del proyecto",
          labels: "Etiquetas del proyecto",
        },
      },
      teamspaces: {
        title: "Espacios de equipo",
      },
      initiatives: {
        title: "Iniciativas",
      },
      customers: {
        title: "Clientes",
      },
      releases: {
        title: "Lanzamientos",
        update_release: "Actualizar lanzamiento",
        create_release: "Crear lanzamiento",
        errors: {
          release_not_found: "El lanzamiento que buscas no existe.",
          unknown: "Algo salió mal. Inténtalo de nuevo.",
        },
      },

      cancel_trial: {
        title: "Cancela primero tu periodo de prueba.",
        description:
          "Tienes un periodo de prueba activo en uno de nuestros planes de pago. Por favor, cancélalo primero para continuar.",
        dismiss: "Cerrar",
        cancel: "Cancelar prueba",
        cancel_success_title: "Periodo de prueba cancelado.",
        cancel_success_message: "Ahora puedes eliminar el espacio de trabajo.",
        cancel_error_title: "Eso no funcionó.",
        cancel_error_message: "Por favor, inténtalo de nuevo.",
      },
      applications: {
        title: "Aplicaciones",
        applicationId_copied: "ID de aplicación copiado al portapapeles",
        clientId_copied: "ID de cliente copiado al portapapeles",
        clientSecret_copied: "Secreto de cliente copiado al portapapeles",
        third_party_apps: "Aplicaciones de terceros",
        your_apps: "Tus aplicaciones",
        connect: "Conectar",
        connected: "Conectado",
        install: "Instalar",
        installed: "Instalado",
        configure: "Configurar",
        app_available: "Has hecho que esta aplicación esté disponible para usar con un espacio de trabajo de Plane",
        app_available_description: "Conecta un espacio de trabajo de Plane para comenzar a usarla",
        client_id_and_secret: "ID y Secreto de Cliente",
        client_id_and_secret_description:
          "Copia y guarda esta clave secreta. No podrás ver esta clave después de hacer clic en Cerrar.",
        client_id_and_secret_download: "Puedes descargar un CSV con la clave desde aquí.",
        application_id: "ID de Aplicación",
        client_id: "ID de Cliente",
        client_secret: "Secreto de Cliente",
        export_as_csv: "Exportar como CSV",
        slug_already_exists: "El slug ya existe",
        failed_to_create_application: "Error al crear la aplicación",
        upload_logo: "Subir Logo",
        app_name_title: "¿Cómo llamarás a esta aplicación?",
        app_name_error: "El nombre de la aplicación es obligatorio",
        app_short_description_title: "Dale una breve descripción a esta aplicación",
        app_short_description_error: "La descripción corta de la aplicación es obligatoria",
        app_description_title: {
          label: "Descripción larga",
          placeholder: "Escriba una descripción larga para el mercado. Presione '/' para ver los comandos.",
        },
        authorization_grant_type: {
          title: "Tipo de conexión",
          description:
            "Elija si su aplicación debe instalarse una vez para el espacio de trabajo o permitir que cada usuario conecte su propia cuenta",
        },
        app_description_error: "La descripción de la aplicación es obligatoria",
        app_slug_title: "Slug de la aplicación",
        app_slug_error: "El slug de la aplicación es obligatorio",
        app_maker_title: "Creador de la aplicación",
        app_maker_error: "El creador de la aplicación es obligatorio",
        webhook_url_title: "URL del Webhook",
        webhook_url_error: "La URL del webhook es obligatoria",
        invalid_webhook_url_error: "URL del webhook inválida",
        redirect_uris_title: "URIs de redirección",
        redirect_uris_error: "Las URIs de redirección son obligatorias",
        invalid_redirect_uris_error: "URIs de redirección inválidas",
        redirect_uris_description:
          "Ingresa las URIs separadas por espacios donde la aplicación redirigirá después del usuario, por ejemplo https://example.com https://example.com/",
        authorized_javascript_origins_title: "Orígenes Javascript autorizados",
        authorized_javascript_origins_error: "Los orígenes Javascript autorizados son obligatorios",
        invalid_authorized_javascript_origins_error: "Orígenes Javascript autorizados inválidos",
        authorized_javascript_origins_description:
          "Ingresa los orígenes separados por espacios donde la aplicación podrá hacer solicitudes, por ejemplo app.com example.com",
        create_app: "Crear aplicación",
        update_app: "Actualizar aplicación",
        build_your_own_app: "Construye tu propia aplicación",
        edit_app_details: "Editar detalles de la aplicación",
        regenerate_client_secret_description:
          "Regenerar el secreto de cliente. Si regeneras el secreto, podrás copiar la clave o descargarla en un archivo CSV justo después.",
        regenerate_client_secret: "Regenerar secreto de cliente",
        regenerate_client_secret_confirm_title: "¿Seguro que quieres regenerar el secreto de cliente?",
        regenerate_client_secret_confirm_description:
          "La aplicación que use este secreto dejará de funcionar. Necesitarás actualizar el secreto en la aplicación.",
        regenerate_client_secret_confirm_cancel: "Cancelar",
        regenerate_client_secret_confirm_regenerate: "Regenerar",
        read_only_access_to_workspace: "Acceso de solo lectura a tu espacio de trabajo",
        write_access_to_workspace: "Acceso de escritura a tu espacio de trabajo",
        read_only_access_to_user_profile: "Acceso de solo lectura a tu perfil de usuario",
        write_access_to_user_profile: "Acceso de escritura a tu perfil de usuario",
        connect_app_to_workspace: "Conectar {app} a tu espacio de trabajo {workspace}",
        user_permissions: "Permisos de usuario",
        user_permissions_description: "Los permisos de usuario se utilizan para otorgar acceso al perfil del usuario.",
        workspace_permissions: "Permisos del espacio de trabajo",
        workspace_permissions_description:
          "Los permisos del espacio de trabajo se utilizan para otorgar acceso al espacio de trabajo.",
        with_the_permissions: "con los permisos",
        app_consent_title: "{app} está solicitando acceso a tu espacio de trabajo y perfil de Plane.",
        choose_workspace_to_connect_app_with: "Elige un espacio de trabajo para conectar la aplicación",
        app_consent_workspace_permissions_title: "{app} desea",
        app_consent_user_permissions_title:
          "{app} también puede solicitar el permiso de un usuario para los siguientes recursos. Estos permisos serán solicitados y autorizados únicamente por un usuario.",
        app_consent_accept_title: "Al aceptar, tú",
        app_consent_accept_1:
          "Concedes a la aplicación acceso a tus datos de Plane donde sea que puedas usar la aplicación dentro o fuera de Plane",
        app_consent_accept_2: "Aceptas la Política de Privacidad y Términos de Uso de {app}",
        accepting: "Aceptando...",
        accept: "Aceptar",
        categories: "Categorías",
        select_app_categories: "Seleccionar categorías de la aplicación",
        categories_title: "Categorías",
        categories_error: "Las categorías son requeridas",
        invalid_categories_error: "Categorías inválidas",
        categories_description: "Selecciona las categorías que mejor describen la aplicación",
        supported_plans: "Planes Soportados",
        supported_plans_description:
          "Selecciona los planes de espacio de trabajo que pueden instalar esta aplicación. Deja vacío para permitir todos los planes.",
        select_plans: "Seleccionar Planes",
        privacy_policy_url_title: "URL de la Política de Privacidad",
        privacy_policy_url_error: "La URL de la Política de Privacidad es requerida",
        invalid_privacy_policy_url_error: "URL de la Política de Privacidad inválida",
        terms_of_service_url_title: "URL de los Términos de Servicio",
        terms_of_service_url_error: "Los Términos de Servicio son requeridos",
        invalid_terms_of_service_url_error: "URL de los Términos de Servicio inválida",
        support_url_title: "URL de Soporte",
        support_url_error: "La URL de Soporte es requerida",
        invalid_support_url_error: "URL de Soporte inválida",
        video_url_title: "URL del Video",
        video_url_error: "El URL del Video es requerido",
        invalid_video_url_error: "URL del Video inválida",
        setup_url_title: "URL de Configuración",
        setup_url_error: "La URL de Configuración es requerida",
        invalid_setup_url_error: "URL de Configuración inválida",
        configuration_url_title: "URL de Configuración",
        configuration_url_error: "La URL de Configuración es requerida",
        invalid_configuration_url_error: "URL de Configuración inválida",
        contact_email_title: "Correo de Contacto",
        contact_email_error: "El correo de contacto es requerido",
        invalid_contact_email_error: "Correo de contacto inválido",
        upload_attachments: "Subir adjuntos",
        uploading_images: "Subiendo {count} Imagen{count, plural, one {s} other {s}}",
        drop_images_here: "Arrastra imágenes aquí",
        click_to_upload_images: "Haz clic para subir imágenes",
        invalid_file_or_exceeds_size_limit: "Archivo inválido o excede el límite de tamaño ({size} MB)",
        uploading: "Subiendo...",
        upload_and_save: "Subir y guardar",
        app_credentials_regenrated: {
          title: "Las credenciales de la aplicación se han regenerado correctamente",
          description:
            "Reemplace el secreto del cliente en todos los lugares donde se utilice. El secreto anterior ya no es válido.",
        },
        app_created: {
          title: "La aplicación se creó correctamente",
          description: "Utilice las credenciales para instalar la aplicación en un espacio de trabajo de Plane",
        },
        installed_apps: "Aplicaciones instaladas",
        all_apps: "Todas las aplicaciones",
        internal_apps: "Aplicaciones internas",
        website: {
          title: "Sitio web",
          description: "Enlace al sitio web de su aplicación.",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "Creador de aplicaciones",
          description: "La persona u organización que crea la aplicación.",
        },
        setup_url: {
          label: "URL de configuración",
          description: "Los usuarios serán redirigidos a esta URL cuando instalen la aplicación.",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "URL del webhook",
          description:
            "Aquí es donde enviaremos eventos y actualizaciones de webhook desde los espacios de trabajo donde está instalada su aplicación.",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "URIs de redirección (separadas por espacios)",
          description: "Los usuarios serán redirigidos a esta ruta después de haberse autenticado con Plane.",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "Esta aplicación solo se puede instalar después de que un administrador del espacio de trabajo la instale. Contacta con el administrador de tu espacio de trabajo para continuar.",
        enable_app_mentions: "Habilitar menciones de la aplicación",
        enable_app_mentions_tooltip:
          "Cuando esto está habilitado, los usuarios pueden mencionar o asignar elementos de trabajo a esta aplicación.",
        scopes: "Ámbitos",
        select_scopes: "Seleccionar ámbitos",
        read_access_to: "Acceso de solo lectura a",
        write_access_to: "Acceso de escritura a",
        global_permission_expiration:
          "Los ámbitos globales caducarán pronto. Utilice ámbitos granulares en su lugar. Por ejemplo, use project:read en lugar de una lectura global.",
        selected_scopes: "{count} seleccionados",
        scopes_and_permissions: "Ámbitos y permisos",
        read: "Lectura",
        write: "Escritura",
        scope_description: {
          projects: "Acceso a proyectos y todas las entidades relacionadas con proyectos",
          wiki: "Acceso al wiki y todas las entidades relacionadas con el wiki",
          customers: "Acceso a clientes y todas las entidades relacionadas con clientes",
          initiatives: "Acceso a iniciativas y todas las entidades relacionadas con iniciativas",
          workspaces: "Acceso a espacios de trabajo y todas las entidades relacionadas",
          stickies: "Acceso a notas adhesivas y todas las entidades relacionadas",
          teamspaces: "Acceso a espacios de equipo y todas las entidades relacionadas",
          profile: "Acceso a la información del perfil de usuario",
          agents: "Acceso a agentes y todas las entidades relacionadas con agentes",
          assets: "Acceso a activos y todas las entidades relacionadas con activos",
        },
        internal: "Interno",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description:
          "Ve tu trabajo obtener más inteligente y más rápido con IA que está conectada de forma nativa a tu trabajo y base de conocimientos.",
      },
    },
    empty_state: {
      api_tokens: {
        title: "No se han creado tokens de API",
        description:
          "Las APIs de Plane se pueden usar para integrar tus datos en Plane con cualquier sistema externo. Crea un token para comenzar.",
      },
      webhooks: {
        title: "No se han agregado webhooks",
        description: "Crea webhooks para recibir actualizaciones en tiempo real y automatizar acciones.",
      },
      exports: {
        title: "No hay exportaciones aún",
        description: "Cada vez que exportes, también tendrás una copia aquí para referencia.",
      },
      imports: {
        title: "No hay importaciones aún",
        description: "Encuentra todas tus importaciones anteriores aquí y descárgalas.",
      },
    },
  },
  profile: {
    label: "Perfil",
    page_label: "Tu trabajo",
    work: "Trabajo",
    details: {
      joined_on: "Se unió el",
      time_zone: "Zona horaria",
    },
    stats: {
      workload: "Carga de trabajo",
      overview: "Resumen",
      created: "Elementos de trabajo creados",
      assigned: "Elementos de trabajo asignados",
      subscribed: "Elementos de trabajo suscritos",
      state_distribution: {
        title: "Elementos de trabajo por estado",
        empty: "Crea elementos de trabajo para verlos por estados en el gráfico para un mejor análisis.",
      },
      priority_distribution: {
        title: "Elementos de trabajo por Prioridad",
        empty: "Crea elementos de trabajo para verlos por prioridad en el gráfico para un mejor análisis.",
      },
      recent_activity: {
        title: "Actividad reciente",
        empty: "No pudimos encontrar datos. Por favor revisa tus entradas",
        button: "Descargar actividad de hoy",
        button_loading: "Descargando",
      },
    },
    actions: {
      profile: "Perfil",
      security: "Seguridad",
      activity: "Actividad",
      appearance: "Apariencia",
      notifications: "Notificaciones",
      connections: "Conexiones",
    },
    tabs: {
      summary: "Resumen",
      assigned: "Asignado",
      created: "Creado",
      subscribed: "Suscrito",
      activity: "Actividad",
    },
    empty_state: {
      activity: {
        title: "Aún no hay actividades",
        description:
          "¡Comienza creando un nuevo elemento de trabajo! Agrégale detalles y propiedades. Explora más en Plane para ver tu actividad.",
      },
      assigned: {
        title: "No hay elementos de trabajo asignados a ti",
        description: "Los elementos de trabajo asignados a ti se pueden rastrear desde aquí.",
      },
      created: {
        title: "Aún no hay elementos de trabajo",
        description: "Todos los elementos de trabajo creados por ti aparecen aquí, rastréalos directamente aquí.",
      },
      subscribed: {
        title: "Aún no hay elementos de trabajo",
        description: "Suscríbete a los elementos de trabajo que te interesen, rastréalos todos aquí.",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "Ingresa el ID del proyecto",
      please_select_a_timezone: "Por favor selecciona una zona horaria",
      archive_project: {
        title: "Archivar proyecto",
        description:
          "Archivar un proyecto lo eliminará de tu navegación lateral aunque aún podrás acceder a él desde tu página de proyectos. Puedes restaurar el proyecto o eliminarlo cuando quieras.",
        button: "Archivar proyecto",
      },
      delete_project: {
        title: "Eliminar proyecto",
        description:
          "Al eliminar un proyecto, todos los datos y recursos dentro de ese proyecto se eliminarán permanentemente y no podrán recuperarse.",
        button: "Eliminar mi proyecto",
      },
      toast: {
        success: "Proyecto actualizado exitosamente",
        error: "No se pudo actualizar el proyecto. Por favor intenta de nuevo.",
      },
    },
    members: {
      label: "Miembros",
      project_lead: "Líder del proyecto",
      default_assignee: "Asignado por defecto",
      guest_super_permissions: {
        title: "Otorgar acceso de visualización a todos los elementos de trabajo para usuarios invitados:",
        sub_heading:
          "Esto permitirá a los invitados tener acceso de visualización a todos los elementos de trabajo del proyecto.",
      },
      invite_members: {
        title: "Invitar miembros",
        sub_heading: "Invita miembros para trabajar en tu proyecto.",
        select_co_worker: "Seleccionar compañero de trabajo",
      },
      project_lead_description: "Seleccione el responsable del proyecto.",
      default_assignee_description: "Seleccione el asignado predeterminado para el proyecto.",
      project_subscribers: "Suscriptores del proyecto",
      project_subscribers_description: "Seleccione los miembros que recibirán notificaciones para este proyecto.",
    },
    states: {
      describe_this_state_for_your_members: "Describe este estado para tus miembros.",
      empty_state: {
        title: "No estados disponibles para el grupo {groupKey}",
        description: "Por favor, crea un nuevo estado",
      },
    },
    labels: {
      label_title: "Título de la etiqueta",
      label_title_is_required: "El título de la etiqueta es requerido",
      label_max_char: "El nombre de la etiqueta no debe exceder 255 caracteres",
      toast: {
        error: "Error al actualizar la etiqueta",
      },
    },
    estimates: {
      label: "Estimaciones",
      title: "Activar estimaciones para mi proyecto",
      description: "Te ayudan a comunicar la complejidad y la carga de trabajo del equipo.",
      no_estimate: "Sin estimación",
      new: "Nuevo sistema de estimación",
      create: {
        custom: "Personalizado",
        start_from_scratch: "Comenzar desde cero",
        choose_template: "Elegir una plantilla",
        choose_estimate_system: "Elegir un sistema de estimación",
        enter_estimate_point: "Ingresar estimación",
        step: "Paso {step} de {total}",
        label: "Crear estimación",
      },
      toasts: {
        created: {
          success: {
            title: "Estimación creada",
            message: "La estimación se ha creado correctamente",
          },
          error: {
            title: "Error al crear la estimación",
            message: "No pudimos crear la nueva estimación, por favor inténtalo de nuevo.",
          },
        },
        updated: {
          success: {
            title: "Estimación modificada",
            message: "La estimación se ha actualizado en tu proyecto.",
          },
          error: {
            title: "Error al modificar la estimación",
            message: "No pudimos modificar la estimación, por favor inténtalo de nuevo",
          },
        },
        enabled: {
          success: {
            title: "¡Éxito!",
            message: "Las estimaciones han sido activadas.",
          },
        },
        disabled: {
          success: {
            title: "¡Éxito!",
            message: "Las estimaciones han sido desactivadas.",
          },
          error: {
            title: "¡Error!",
            message: "No se pudo desactivar la estimación. Por favor inténtalo de nuevo",
          },
        },
        reorder: {
          success: {
            title: "Estimaciones reordenadas",
            message: "Las estimaciones han sido reordenadas en tu proyecto.",
          },
          error: {
            title: "Error al reordenar estimaciones",
            message: "No pudimos reordenar las estimaciones, por favor intenta de nuevo",
          },
        },
      },
      validation: {
        min_length: "La estimación debe ser mayor que 0.",
        unable_to_process: "No podemos procesar tu solicitud, por favor inténtalo de nuevo.",
        numeric: "La estimación debe ser un valor numérico.",
        character: "La estimación debe ser un valor de carácter.",
        empty: "El valor de la estimación no puede estar vacío.",
        already_exists: "El valor de la estimación ya existe.",
        unsaved_changes: "Tienes cambios sin guardar. Por favor guárdalos antes de hacer clic en Hecho",
        remove_empty:
          "La estimación no puede estar vacía. Ingresa un valor en cada campo o elimina aquellos para los que no tienes valores.",
        fill: "Por favor completa este campo de estimación",
        repeat: "El valor de estimación no puede repetirse",
      },
      systems: {
        points: {
          label: "Puntos",
          fibonacci: "Fibonacci",
          linear: "Lineal",
          squares: "Cuadrados",
          custom: "Personalizado",
        },
        categories: {
          label: "Categorías",
          t_shirt_sizes: "Tallas de camiseta",
          easy_to_hard: "Fácil a difícil",
          custom: "Personalizado",
        },
        time: {
          label: "Tiempo",
          hours: "Horas",
        },
      },
      edit: {
        title: "Editar sistema de estimaciones",
        add_or_update: {
          title: "Agregar, actualizar o eliminar estimaciones",
          description: "Gestiona el sistema actual agregando, actualizando o eliminando los puntos o categorías.",
        },
        switch: {
          title: "Cambiar tipo de estimación",
          description: "Convierte tu sistema de puntos a sistema de categorías y viceversa.",
        },
      },
      switch: "Cambiar sistema de estimaciones",
      current: "Sistema de estimaciones actual",
      select: "Seleccionar un sistema de estimaciones",
    },
    automations: {
      label: "Automatizaciones",
      "auto-archive": {
        title: "Archivar automáticamente elementos de trabajo cerrados",
        description:
          "Plane archivará automáticamente los elementos de trabajo que hayan sido completados o cancelados.",
        duration: "Archivar automáticamente elementos de trabajo cerrados durante",
      },
      "auto-close": {
        title: "Cerrar automáticamente elementos de trabajo",
        description:
          "Plane cerrará automáticamente los elementos de trabajo que no hayan sido completados o cancelados.",
        duration: "Cerrar automáticamente elementos de trabajo inactivos durante",
        auto_close_status: "Estado de cierre automático",
      },
      "auto-remind": {
        title: "Recordatorios automáticos",
        description:
          "Plane enviará recordatorios automáticos via correo electrónico y notificaciones en la aplicación para mantener a tu equipo en el camino de los plazos.",
        duration: "Enviar recordatorio antes",
      },
    },
    empty_state: {
      labels: {
        title: "Aún no hay etiquetas",
        description: "Crea etiquetas para organizar y filtrar elementos de trabajo en tu proyecto.",
      },
      estimates: {
        title: "Aún no hay sistemas de estimación",
        description: "Crea un conjunto de estimaciones para comunicar el volumen de trabajo por elemento de trabajo.",
        primary_button: "Agregar sistema de estimación",
      },
      integrations: {
        title: "No hay integraciones configuradas",
        description: "Configura GitHub y otras integraciones para sincronizar los elementos de trabajo de tu proyecto.",
      },
    },
    initiatives: {
      heading: "Iniciativas",
      sub_heading: "Desbloquea el nivel más alto de organización para todo tu trabajo en Plane",
      title: "Habilitar iniciativas",
      description: "Establece objetivos más grandes para monitorear el progreso",
      toast: {
        updating: "Actualizando función de iniciativas",
        enable_success: "Función de iniciativas habilitada exitosamente.",
        disable_success: "Función de iniciativas deshabilitada exitosamente.",
        error: "¡Error al actualizar la función de iniciativas!",
      },
    },
    customers: {
      heading: "Clientes",
      settings_heading: "Administra el trabajo según lo que es importante para tus clientes.",
      settings_sub_heading:
        "Convierte las solicitudes de los clientes en elementos de trabajo, asigna prioridad según las solicitudes y vincula los estados de los elementos de trabajo a los registros de los clientes. Pronto podrás integrar tu CRM o herramienta de soporte para una mejor gestión del trabajo según los atributos de los clientes.",
    },
    epics: {
      properties: {
        title: "Propiedades",
        description: "Agrega propiedades personalizadas a tu épica.",
      },
      disabled: "Deshabilitado",
    },
    cycles: {
      auto_schedule: {
        heading: "Programación automática de ciclos",
        description: "Mantén los ciclos en movimiento sin configuración manual.",
        tooltip: "Crea automáticamente nuevos ciclos basados en tu programación elegida.",
        edit_button: "Editar",
        form: {
          cycle_title: {
            label: "Título del ciclo",
            placeholder: "Título",
            tooltip: "El título se agregará con números para los ciclos subsiguientes. Por ejemplo: Diseño - 1/2/3",
            validation: {
              required: "El título del ciclo es requerido",
              max_length: "El título no debe exceder los 255 caracteres",
            },
          },
          cycle_duration: {
            label: "Duración del ciclo",
            unit: "Semanas",
            validation: {
              required: "La duración del ciclo es requerida",
              min: "La duración del ciclo debe ser al menos 1 semana",
              max: "La duración del ciclo no puede exceder 30 semanas",
              positive: "La duración del ciclo debe ser positiva",
            },
          },
          cooldown_period: {
            label: "Período de enfriamiento",
            unit: "días",
            tooltip: "Pausa entre ciclos antes de que comience el siguiente.",
            validation: {
              required: "El período de enfriamiento es requerido",
              negative: "El período de enfriamiento no puede ser negativo",
            },
          },
          start_date: {
            label: "Día de inicio del ciclo",
            validation: {
              required: "La fecha de inicio es requerida",
              past: "La fecha de inicio no puede estar en el pasado",
            },
          },
          number_of_cycles: {
            label: "Número de ciclos futuros",
            validation: {
              required: "El número de ciclos es requerido",
              min: "Se requiere al menos 1 ciclo",
              max: "No se pueden programar más de 3 ciclos",
            },
          },
          auto_rollover: {
            label: "Transferencia automática de elementos de trabajo",
            tooltip:
              "El día que se complete un ciclo, mover todos los elementos de trabajo sin terminar al siguiente ciclo.",
          },
        },
        toast: {
          toggle: {
            loading_enable: "Habilitando programación automática de ciclos",
            loading_disable: "Deshabilitando programación automática de ciclos",
            success: {
              title: "¡Éxito!",
              message: "Programación automática de ciclos activada exitosamente.",
            },
            error: {
              title: "¡Error!",
              message: "Error al activar la programación automática de ciclos.",
            },
          },
          save: {
            loading: "Guardando configuración de programación automática de ciclos",
            success: {
              title: "¡Éxito!",
              message_create: "Configuración de programación automática de ciclos guardada exitosamente.",
              message_update: "Configuración de programación automática de ciclos actualizada exitosamente.",
            },
            error: {
              title: "¡Error!",
              message_create: "Error al guardar la configuración de programación automática de ciclos.",
              message_update: "Error al actualizar la configuración de programación automática de ciclos.",
            },
          },
        },
      },
    },
    features: {
      cycles: {
        title: "Ciclos",
        short_title: "Ciclos",
        description:
          "Programa el trabajo en períodos flexibles que se adaptan al ritmo y al tempo únicos de este proyecto.",
        toggle_title: "Habilitar ciclos",
        toggle_description: "Planifica el trabajo en períodos de tiempo enfocados.",
      },
      modules: {
        title: "Módulos",
        short_title: "Módulos",
        description: "Organiza el trabajo en subproyectos con líderes y responsables dedicados.",
        toggle_title: "Habilitar módulos",
        toggle_description: "Los miembros del proyecto podrán crear y editar módulos.",
      },
      views: {
        title: "Vistas",
        short_title: "Vistas",
        description:
          "Guarda ordenaciones, filtros y opciones de visualización personalizadas o compártelos con tu equipo.",
        toggle_title: "Habilitar vistas",
        toggle_description: "Los miembros del proyecto podrán crear y editar vistas.",
      },
      pages: {
        title: "Páginas",
        short_title: "Páginas",
        description: "Crea y edita contenido libre: notas, documentos, cualquier cosa.",
        toggle_title: "Habilitar páginas",
        toggle_description: "Los miembros del proyecto podrán crear y editar páginas.",
      },
      intake: {
        intake_responsibility: "Responsabilidad de ingreso",
        intake_sources: "Fuentes de ingreso",
        title: "Recepción",
        short_title: "Recepción",
        description:
          "Permite que los no miembros compartan errores, comentarios y sugerencias; sin interrumpir tu flujo de trabajo.",
        toggle_title: "Habilitar recepción",
        toggle_description: "Permitir a los miembros del proyecto crear solicitudes de recepción en la aplicación.",
        toggle_tooltip_on: "Pide a tu administrador del proyecto que active esto.",
        toggle_tooltip_off: "Pide a tu administrador del proyecto que desactive esto.",
        notify_assignee: {
          title: "Notificar asignados",
          description:
            "Para una nueva solicitud de ingreso, los asignados predeterminados serán alertados mediante notificaciones",
        },
        in_app: {
          title: "En la aplicación",
          description:
            "Recibe nuevos elementos de trabajo de miembros e invitados en tu espacio de trabajo sin interrumpir los existentes.",
        },
        email: {
          title: "Correo electrónico",
          description:
            "Recopila nuevos elementos de trabajo de cualquiera que envíe un correo a una dirección de Plane.",
          fieldName: "ID de correo electrónico",
        },
        form: {
          title: "Formularios",
          description:
            "Permite que personas fuera de tu espacio de trabajo creen posibles nuevos elementos de trabajo mediante un formulario dedicado y seguro.",
          fieldName: "URL del formulario predeterminado",
          create_forms: "Crear formularios usando tipos de elementos de trabajo",
          manage_forms: "Gestionar formularios",
          manage_forms_tooltip: "Pide a tu administrador del espacio de trabajo que gestione esto.",
          create_form: "Crear formulario",
          edit_form: "Editar detalles del formulario",
          form_title: "Título del formulario",
          form_title_required: "El título del formulario es obligatorio",
          work_item_type: "Tipo de elemento de trabajo",
          remove_property: "Eliminar propiedad",
          select_properties: "Seleccionar propiedades",
          search_placeholder: "Buscar propiedades",
          toasts: {
            success_create: "Formulario de ingreso creado correctamente",
            success_update: "Formulario de ingreso actualizado correctamente",
            error_create: "Error al crear el formulario de ingreso",
            error_update: "Error al actualizar el formulario de ingreso",
          },
        },
        toasts: {
          set: {
            loading: "Estableciendo asignados...",
            success: {
              title: "¡Éxito!",
              message: "Asignados establecidos correctamente.",
            },
            error: {
              title: "¡Error!",
              message: "Algo salió mal al establecer los asignados. Por favor, inténtalo de nuevo.",
            },
          },
        },
      },
      time_tracking: {
        title: "Seguimiento de tiempo",
        short_title: "Seguimiento de tiempo",
        description: "Registra el tiempo dedicado a elementos de trabajo y proyectos.",
        toggle_title: "Habilitar seguimiento de tiempo",
        toggle_description: "Los miembros del proyecto podrán registrar el tiempo trabajado.",
      },
      milestones: {
        title: "Hitos",
        short_title: "Hitos",
        description:
          "Los hitos proporcionan una capa para alinear los elementos de trabajo hacia fechas de finalización compartidas.",
        toggle_title: "Habilitar hitos",
        toggle_description: "Organiza elementos de trabajo por plazos de hitos.",
      },
      toasts: {
        loading: "Actualizando función del proyecto...",
        success: "Función del proyecto actualizada correctamente.",
        error: "Algo salió mal al actualizar la función del proyecto. Por favor, inténtalo de nuevo.",
      },
    },
  },
  project_cycles: {
    add_cycle: "Agregar ciclo",
    more_details: "Más detalles",
    cycle: "Ciclo",
    update_cycle: "Actualizar ciclo",
    create_cycle: "Crear ciclo",
    no_matching_cycles: "No hay ciclos coincidentes",
    remove_filters_to_see_all_cycles: "Elimina los filtros para ver todos los ciclos",
    remove_search_criteria_to_see_all_cycles: "Elimina los criterios de búsqueda para ver todos los ciclos",
    only_completed_cycles_can_be_archived: "Solo los ciclos completados pueden ser archivados",
    start_date: "Fecha de inicio",
    end_date: "Fecha de finalización",
    in_your_timezone: "En tu zona horaria",
    transfer_work_items: "Transferir {count} elementos de trabajo",
    transfer: {
      no_cycles_available: "No hay otros ciclos disponibles para transferir elementos de trabajo.",
    },
    date_range: "Rango de fechas",
    add_date: "Agregar fecha",
    active_cycle: {
      label: "Ciclo activo",
      progress: "Progreso",
      chart: "Gráfico de avance",
      priority_issue: "Elementos de trabajo prioritarios",
      assignees: "Asignados",
      issue_burndown: "Avance de elementos de trabajo",
      ideal: "Ideal",
      current: "Actual",
      labels: "Etiquetas",
      trailing: "Retrasado",
      leading: "Adelantado",
    },
    upcoming_cycle: {
      label: "Ciclo próximo",
    },
    completed_cycle: {
      label: "Ciclo completado",
    },
    status: {
      days_left: "Días restantes",
      completed: "Completado",
      yet_to_start: "Por comenzar",
      in_progress: "En progreso",
      draft: "Borrador",
    },
    action: {
      restore: {
        title: "Restaurar ciclo",
        success: {
          title: "Ciclo restaurado",
          description: "El ciclo ha sido restaurado.",
        },
        failed: {
          title: "Falló la restauración del ciclo",
          description: "No se pudo restaurar el ciclo. Por favor intenta de nuevo.",
        },
      },
      favorite: {
        loading: "Agregando ciclo a favoritos",
        success: {
          description: "Ciclo agregado a favoritos.",
          title: "¡Éxito!",
        },
        failed: {
          description: "No se pudo agregar el ciclo a favoritos. Por favor intenta de nuevo.",
          title: "¡Error!",
        },
      },
      unfavorite: {
        loading: "Eliminando ciclo de favoritos",
        success: {
          description: "Ciclo eliminado de favoritos.",
          title: "¡Éxito!",
        },
        failed: {
          description: "No se pudo eliminar el ciclo de favoritos. Por favor intenta de nuevo.",
          title: "¡Error!",
        },
      },
      update: {
        loading: "Actualizando ciclo",
        success: {
          description: "Ciclo actualizado exitosamente.",
          title: "¡Éxito!",
        },
        failed: {
          description: "Error al actualizar el ciclo. Por favor intenta de nuevo.",
          title: "¡Error!",
        },
        error: {
          already_exists:
            "Ya tienes un ciclo en las fechas dadas, si quieres crear un ciclo en borrador, puedes hacerlo eliminando ambas fechas.",
        },
      },
    },
    empty_state: {
      general: {
        title: "Agrupa y delimita tu trabajo en Ciclos.",
        description:
          "Divide el trabajo en bloques de tiempo, trabaja hacia atrás desde la fecha límite de tu proyecto para establecer fechas, y haz un progreso tangible como equipo.",
        primary_button: {
          text: "Establece tu primer ciclo",
          comic: {
            title: "Los ciclos son bloques de tiempo repetitivos.",
            description:
              "Un sprint, una iteración, o cualquier otro término que uses para el seguimiento semanal o quincenal del trabajo es un ciclo.",
          },
        },
      },
      no_issues: {
        title: "No hay elementos de trabajo agregados al ciclo",
        description: "Agrega o crea elementos de trabajo que desees delimitar y entregar dentro de este ciclo",
        primary_button: {
          text: "Crear nuevo elemento de trabajo",
        },
        secondary_button: {
          text: "Agregar elemento de trabajo existente",
        },
      },
      completed_no_issues: {
        title: "No hay elementos de trabajo en el ciclo",
        description:
          "No hay elementos de trabajo en el ciclo. Los elementos de trabajo están transferidos u ocultos. Para ver elementos de trabajo ocultos si los hay, actualiza tus propiedades de visualización según corresponda.",
      },
      active: {
        title: "No hay ciclo activo",
        description:
          "Un ciclo activo incluye cualquier período que abarque la fecha de hoy dentro de su rango. Encuentra el progreso y los detalles del ciclo activo aquí.",
      },
      archived: {
        title: "Aún no hay ciclos archivados",
        description:
          "Para mantener ordenado tu proyecto, archiva los ciclos completados. Encuéntralos aquí una vez archivados.",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "Crea un elemento de trabajo y asígnalo a alguien, incluso a ti mismo",
        description:
          "Piensa en los elementos de trabajo como trabajos, tareas, trabajo o JTBD. Los cuales nos gustan. Un elemento de trabajo y sus sub-elementos de trabajo son generalmente acciones basadas en tiempo asignadas a miembros de tu equipo. Tu equipo crea, asigna y completa elementos de trabajo para mover tu proyecto hacia su objetivo.",
        primary_button: {
          text: "Crea tu primer elemento de trabajo",
          comic: {
            title: "Los elementos de trabajo son bloques de construcción en Plane.",
            description:
              "Rediseñar la interfaz de Plane, Cambiar la marca de la empresa o Lanzar el nuevo sistema de inyección de combustible son ejemplos de elementos de trabajo que probablemente tienen sub-elementos de trabajo.",
          },
        },
      },
      no_archived_issues: {
        title: "Aún no hay elementos de trabajo archivados",
        description:
          "Manualmente o a través de automatización, puedes archivar elementos de trabajo que estén completados o cancelados. Encuéntralos aquí una vez archivados.",
        primary_button: {
          text: "Establecer automatización",
        },
      },
      issues_empty_filter: {
        title: "No se encontraron elementos de trabajo que coincidan con los filtros aplicados",
        secondary_button: {
          text: "Limpiar todos los filtros",
        },
      },
    },
  },
  project_module: {
    add_module: "Agregar Módulo",
    update_module: "Actualizar Módulo",
    create_module: "Crear Módulo",
    archive_module: "Archivar Módulo",
    restore_module: "Restaurar Módulo",
    delete_module: "Eliminar módulo",
    empty_state: {
      general: {
        title: "Mapea los hitos de tu proyecto a Módulos y rastrea el trabajo agregado fácilmente.",
        description:
          "Un grupo de elementos de trabajo que pertenecen a un padre lógico y jerárquico forman un módulo. Piensa en ellos como una forma de rastrear el trabajo por hitos del proyecto. Tienen sus propios períodos y fechas límite, así como análisis para ayudarte a ver qué tan cerca o lejos estás de un hito.",
        primary_button: {
          text: "Construye tu primer módulo",
          comic: {
            title: "Los módulos ayudan a agrupar el trabajo por jerarquía.",
            description:
              "Un módulo de carrito, un módulo de chasis y un módulo de almacén son buenos ejemplos de esta agrupación.",
          },
        },
      },
      no_issues: {
        title: "No hay elementos de trabajo en el módulo",
        description: "Crea o agrega elementos de trabajo que quieras lograr como parte de este módulo",
        primary_button: {
          text: "Crear nuevos elementos de trabajo",
        },
        secondary_button: {
          text: "Agregar un elemento de trabajo existente",
        },
      },
      archived: {
        title: "Aún no hay Módulos archivados",
        description:
          "Para mantener ordenado tu proyecto, archiva los módulos completados o cancelados. Encuéntralos aquí una vez archivados.",
      },
      sidebar: {
        in_active: "Este módulo aún no está activo.",
        invalid_date: "Fecha inválida. Por favor ingresa una fecha válida.",
      },
    },
    quick_actions: {
      archive_module: "Archivar módulo",
      archive_module_description: `Solo los módulos completados o
cancelados pueden ser archivados.`,
      delete_module: "Eliminar módulo",
    },
    toast: {
      copy: {
        success: "Enlace del módulo copiado al portapapeles",
      },
      delete: {
        success: "Módulo eliminado exitosamente",
        error: "Error al eliminar el módulo",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "Guarda vistas filtradas para tu proyecto. Crea tantas como necesites",
        description:
          "Las vistas son un conjunto de filtros guardados que usas frecuentemente o a los que quieres tener fácil acceso. Todos tus colegas en un proyecto pueden ver las vistas de todos y elegir la que mejor se adapte a sus necesidades.",
        primary_button: {
          text: "Crea tu primera vista",
          comic: {
            title: "Las vistas funcionan sobre las propiedades de los Elementos de trabajo.",
            description:
              "Puedes crear una vista desde aquí con tantas propiedades como filtros como consideres apropiado.",
          },
        },
      },
      filter: {
        title: "No hay vistas coincidentes",
        description: `Ninguna vista coincide con los criterios de búsqueda.
 Crea una nueva vista en su lugar.`,
      },
    },
    delete_view: {
      title: "¿Estás seguro de que quieres eliminar esta vista?",
      content:
        "Si confirmas, todas las opciones de ordenación, filtro y visualización + el diseño que has elegido para esta vista se eliminarán permanentemente sin posibilidad de restaurarlas.",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title:
          "Escribe una nota, un documento o una base de conocimiento completa. Obtén ayuda de Galileo, el asistente de IA de Plane, para comenzar",
        description:
          "Las páginas son espacios para pensamientos en Plane. Toma notas de reuniones, fórmalas fácilmente, integra elementos de trabajo, organízalas usando una biblioteca de componentes y mantenlas todas en el contexto de tu proyecto. Para hacer cualquier documento rápidamente, invoca a Galileo, la IA de Plane, con un atajo o haciendo clic en un botón.",
        primary_button: {
          text: "Crea tu primera página",
        },
      },
      private: {
        title: "Aún no hay páginas privadas",
        description:
          "Mantén tus pensamientos privados aquí. Cuando estés listo para compartir, el equipo está a solo un clic de distancia.",
        primary_button: {
          text: "Crea tu primera página",
        },
      },
      public: {
        title: "Aún no hay páginas públicas",
        description: "Ve las páginas compartidas con todos en tu proyecto aquí mismo.",
        primary_button: {
          text: "Crea tu primera página",
        },
      },
      archived: {
        title: "Aún no hay páginas archivadas",
        description: "Archiva las páginas que no estén en tu radar. Accede a ellas aquí cuando las necesites.",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "No se encontraron resultados",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "No se encontraron elementos de trabajo coincidentes",
      },
      no_issues: {
        title: "No se encontraron elementos de trabajo",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "Aún no hay comentarios",
        description:
          "Los comentarios pueden usarse como un espacio de discusión y seguimiento para los elementos de trabajo",
      },
    },
  },
  notification: {
    label: "Bandeja de entrada",
    page_label: "{workspace} - Bandeja de entrada",
    options: {
      mark_all_as_read: "Marcar todo como leído",
      mark_read: "Marcar como leído",
      mark_unread: "Marcar como no leído",
      refresh: "Actualizar",
      filters: "Filtros de bandeja de entrada",
      show_unread: "Mostrar no leídos",
      show_snoozed: "Mostrar pospuestos",
      show_archived: "Mostrar archivados",
      mark_archive: "Archivar",
      mark_unarchive: "Desarchivar",
      mark_snooze: "Posponer",
      mark_unsnooze: "Quitar posposición",
    },
    toasts: {
      read: "Notificación marcada como leída",
      unread: "Notificación marcada como no leída",
      archived: "Notificación marcada como archivada",
      unarchived: "Notificación marcada como no archivada",
      snoozed: "Notificación pospuesta",
      unsnoozed: "Notificación posposición cancelada",
    },
    empty_state: {
      detail: {
        title: "Selecciona para ver detalles.",
      },
      all: {
        title: "No hay elementos de trabajo asignados",
        description: `Las actualizaciones de elementos de trabajo asignados a ti se pueden
 ver aquí`,
      },
      mentions: {
        title: "No hay elementos de trabajo asignados",
        description: `Las actualizaciones de elementos de trabajo asignados a ti se pueden
 ver aquí`,
      },
    },
    tabs: {
      all: "Todo",
      mentions: "Menciones",
    },
    filter: {
      assigned: "Asignado a mí",
      created: "Creado por mí",
      subscribed: "Suscrito por mí",
    },
    snooze: {
      "1_day": "1 día",
      "3_days": "3 días",
      "5_days": "5 días",
      "1_week": "1 semana",
      "2_weeks": "2 semanas",
      custom: "Personalizado",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "Agrega elementos de trabajo al ciclo para ver su progreso",
      },
      chart: {
        title: "Agrega elementos de trabajo al ciclo para ver el gráfico de avance.",
      },
      priority_issue: {
        title: "Observa los elementos de trabajo de alta prioridad abordados en el ciclo de un vistazo.",
      },
      assignee: {
        title: "Agrega asignados a los elementos de trabajo para ver un desglose del trabajo por asignados.",
      },
      label: {
        title: "Agrega etiquetas a los elementos de trabajo para ver el desglose del trabajo por etiquetas.",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "Intake no está habilitado para el proyecto.",
        description:
          "Intake te ayuda a gestionar las solicitudes entrantes a tu proyecto y agregarlas como elementos de trabajo en tu flujo de trabajo. Habilita Intake desde la configuración del proyecto para gestionar las solicitudes.",
        primary_button: {
          text: "Gestionar funciones",
        },
      },
      cycle: {
        title: "Los Ciclos no están habilitados para este proyecto.",
        description:
          "Divide el trabajo en fragmentos limitados por tiempo, trabaja hacia atrás desde la fecha límite de tu proyecto para establecer fechas y haz un progreso tangible como equipo. Habilita la función de ciclos para tu proyecto para comenzar a usarlos.",
        primary_button: {
          text: "Gestionar funciones",
        },
      },
      module: {
        title: "Los Módulos no están habilitados para el proyecto.",
        description:
          "Los Módulos son los componentes básicos de tu proyecto. Habilita los módulos desde la configuración del proyecto para comenzar a usarlos.",
        primary_button: {
          text: "Gestionar funciones",
        },
      },
      page: {
        title: "Las Páginas no están habilitadas para el proyecto.",
        description:
          "Las Páginas son los componentes básicos de tu proyecto. Habilita las páginas desde la configuración del proyecto para comenzar a usarlas.",
        primary_button: {
          text: "Gestionar funciones",
        },
      },
      view: {
        title: "Las Vistas no están habilitadas para el proyecto.",
        description:
          "Las Vistas son los componentes básicos de tu proyecto. Habilita las vistas desde la configuración del proyecto para comenzar a usarlas.",
        primary_button: {
          text: "Gestionar funciones",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "Borrador de elemento de trabajo",
    empty_state: {
      title: "Los elementos de trabajo a medio escribir y pronto los comentarios aparecerán aquí.",
      description:
        "Para probar esto, comienza a agregar un elemento de trabajo y déjalo a medias o crea tu primer borrador a continuación. 😉",
      primary_button: {
        text: "Crea tu primer borrador",
      },
    },
    delete_modal: {
      title: "Eliminar borrador",
      description: "¿Estás seguro de que quieres eliminar este borrador? Esto no se puede deshacer.",
    },
    toasts: {
      created: {
        success: "Borrador creado",
        error: "No se pudo crear el elemento de trabajo. Por favor, inténtalo de nuevo.",
      },
      deleted: {
        success: "Borrador eliminado",
      },
    },
  },
  stickies: {
    title: "Tus notas adhesivas",
    placeholder: "haz clic para escribir aquí",
    all: "Todas las notas adhesivas",
    "no-data":
      "Anota una idea, captura un momento eureka o registra una inspiración. Agrega una nota adhesiva para comenzar.",
    add: "Agregar nota adhesiva",
    search_placeholder: "Buscar por título",
    delete: "Eliminar nota adhesiva",
    delete_confirmation: "¿Estás seguro de que quieres eliminar esta nota adhesiva?",
    empty_state: {
      simple:
        "Anota una idea, captura un momento eureka o registra una inspiración. Agrega una nota adhesiva para comenzar.",
      general: {
        title: "Las notas adhesivas son notas rápidas y tareas pendientes que anotas al vuelo.",
        description:
          "Captura tus pensamientos e ideas sin esfuerzo creando notas adhesivas a las que puedes acceder en cualquier momento y desde cualquier lugar.",
        primary_button: {
          text: "Agregar nota adhesiva",
        },
      },
      search: {
        title: "Eso no coincide con ninguna de tus notas adhesivas.",
        description: `Prueba un término diferente o háznoslo saber
si estás seguro de que tu búsqueda es correcta.`,
        primary_button: {
          text: "Agregar nota adhesiva",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "El nombre de la nota adhesiva no puede tener más de 100 caracteres.",
        already_exists: "Ya existe una nota adhesiva sin descripción",
      },
      created: {
        title: "Nota adhesiva creada",
        message: "La nota adhesiva se ha creado exitosamente",
      },
      not_created: {
        title: "Nota adhesiva no creada",
        message: "No se pudo crear la nota adhesiva",
      },
      updated: {
        title: "Nota adhesiva actualizada",
        message: "La nota adhesiva se ha actualizado exitosamente",
      },
      not_updated: {
        title: "Nota adhesiva no actualizada",
        message: "No se pudo actualizar la nota adhesiva",
      },
      removed: {
        title: "Nota adhesiva eliminada",
        message: "La nota adhesiva se ha eliminado exitosamente",
      },
      not_removed: {
        title: "Nota adhesiva no eliminada",
        message: "No se pudo eliminar la nota adhesiva",
      },
    },
  },
  role_details: {
    guest: {
      title: "Invitado",
      description: "Los miembros externos de las organizaciones pueden ser invitados como invitados.",
    },
    member: {
      title: "Miembro",
      description: "Capacidad para leer, escribir, editar y eliminar entidades dentro de proyectos, ciclos y módulos",
    },
    admin: {
      title: "Administrador",
      description: "Todos los permisos establecidos como verdaderos dentro del espacio de trabajo.",
    },
  },
  user_roles: {
    product_or_project_manager: "Gerente de Producto / Proyecto",
    development_or_engineering: "Desarrollo / Ingeniería",
    founder_or_executive: "Fundador / Ejecutivo",
    freelancer_or_consultant: "Freelancer / Consultor",
    marketing_or_growth: "Marketing / Crecimiento",
    sales_or_business_development: "Ventas / Desarrollo de Negocios",
    support_or_operations: "Soporte / Operaciones",
    student_or_professor: "Estudiante / Profesor",
    human_resources: "Recursos Humanos",
    other: "Otro",
  },
  importer: {
    github: {
      title: "GitHub",
      description: "Importa elementos de trabajo desde repositorios de GitHub y sincronízalos.",
    },
    jira: {
      title: "Jira",
      description: "Importa elementos de trabajo y epics desde proyectos y epics de Jira.",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "Exporta elementos de trabajo a un archivo CSV.",
      short_description: "Exportar como csv",
    },
    excel: {
      title: "Excel",
      description: "Exporta elementos de trabajo a un archivo Excel.",
      short_description: "Exportar como excel",
    },
    xlsx: {
      title: "Excel",
      description: "Exporta elementos de trabajo a un archivo Excel.",
      short_description: "Exportar como excel",
    },
    json: {
      title: "JSON",
      description: "Exporta elementos de trabajo a un archivo JSON.",
      short_description: "Exportar como json",
    },
  },
  default_global_view: {
    all_issues: "Todos los elementos de trabajo",
    assigned: "Asignados",
    created: "Creados",
    subscribed: "Suscritos",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "Preferencia del sistema",
      },
      light: {
        label: "Claro",
      },
      dark: {
        label: "Oscuro",
      },
      light_contrast: {
        label: "Claro de alto contraste",
      },
      dark_contrast: {
        label: "Oscuro de alto contraste",
      },
      custom: {
        label: "Tema personalizado",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "Pendientes",
      planned: "Planificado",
      in_progress: "En progreso",
      paused: "Pausado",
      completed: "Completado",
      cancelled: "Cancelado",
    },
    layout: {
      list: "Vista de lista",
      board: "Vista de galería",
      timeline: "Vista de línea de tiempo",
    },
    order_by: {
      name: "Nombre",
      progress: "Progreso",
      issues: "Número de elementos de trabajo",
      due_date: "Fecha de vencimiento",
      created_at: "Fecha de creación",
      manual: "Manual",
    },
  },
  cycle: {
    label: "{count, plural, one {Ciclo} other {Ciclos}}",
    no_cycle: "Sin ciclo",
  },
  module: {
    label: "{count, plural, one {Módulo} other {Módulos}}",
    no_module: "Sin módulo",
  },
  description_versions: {
    last_edited_by: "Última edición por",
    previously_edited_by: "Editado anteriormente por",
    edited_by: "Editado por",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane no se inició. Esto podría deberse a que uno o más servicios de Plane fallaron al iniciar.",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "Selecciona View Logs desde setup.sh y los logs de Docker para estar seguro.",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "Esquema",
        empty_state: {
          title: "Faltan encabezados",
          description: "Añade algunos encabezados a esta página para verlos aquí.",
        },
      },
      info: {
        label: "Info",
        document_info: {
          words: "Palabras",
          characters: "Caracteres",
          paragraphs: "Párrafos",
          read_time: "Tiempo de lectura",
        },
        actors_info: {
          edited_by: "Editado por",
          created_by: "Creado por",
        },
        version_history: {
          label: "Historial de versiones",
          current_version: "Versión actual",
          highlight_changes: "Resaltar cambios",
        },
      },
      assets: {
        label: "Recursos",
        download_button: "Descargar",
        empty_state: {
          title: "Faltan imágenes",
          description: "Añade imágenes para verlas aquí.",
        },
      },
    },
    open_button: "Abrir panel de navegación",
    close_button: "Cerrar panel de navegación",
    outline_floating_button: "Abrir esquema",
  },
  pi_chat: "Plane AI",
  in_app: "En la aplicación",
  forms: "Formularios",
  choose_workspace_for_integration: "Elige un espacio de trabajo para conectar esta app",
  integrations_description:
    "Las apps que funcionan con Plane deben conectarse a un espacio de trabajo donde eres administrador.",
  create_a_new_workspace: "Crear un nuevo espacio de trabajo",
  learn_more_about_workspaces: "Aprende más sobre espacios de trabajo",
  no_workspaces_to_connect: "No hay espacios de trabajo para conectar",
  no_workspaces_to_connect_description:
    "Necesitarás crear un espacio de trabajo para poder conectar integraciones y plantillas",
  updates: {
    add_update: "Agregar actualización",
    add_update_placeholder: "Escribe tu actualización aquí",
    empty: {
      title: "Aún no hay actualizaciones",
      description: "Puedes ver las actualizaciones aquí.",
    },
    delete: {
      title: "Eliminar actualización",
      confirmation: "¿Estás seguro de querer eliminar esta actualización? Esta acción es irreversible.",
      success: {
        title: "Actualización eliminada",
        message: "La actualización se ha eliminado correctamente",
      },
      error: {
        title: "Actualización no eliminada",
        message: "La actualización no se pudo eliminar",
      },
    },
    reaction: {
      create: {
        success: {
          title: "Reacción creada",
          message: "Reacción creada con éxito",
        },
        error: {
          title: "Reacción no creada",
          message: "No se pudo crear la reacción",
        },
      },
      remove: {
        success: {
          title: "Reacción eliminada",
          message: "Reacción eliminada con éxito",
        },
        error: {
          title: "Reacción no eliminada",
          message: "No se pudo eliminar la reacción",
        },
      },
    },
    progress: {
      title: "Progreso",
      since_last_update: "Desde la última actualización",
      comments: "{count, plural, one{# comentario} other{# comentarios}}",
    },
    create: {
      success: {
        title: "Actualización creada",
        message: "Actualización creada con éxito",
      },
      error: {
        title: "Actualización no creada",
        message: "No se pudo crear la actualización",
      },
    },
    update: {
      success: {
        title: "Actualización actualizada",
        message: "Actualización actualizada con éxito",
      },
      error: {
        title: "Actualización no actualizada",
        message: "No se pudo actualizar la actualización",
      },
    },
  },
  teamspaces: {
    label: "Espacios de equipo",
    empty_state: {
      general: {
        title: "Los espacios de equipo desbloquean una mejor organización y seguimiento en Plane",
        description:
          "Crea una superficie dedicada para cada equipo del mundo real, separada de todas las demás superficies de trabajo en Plane, y personalízalas para adaptarse a la forma en que trabaja tu equipo.",
        primary_button: {
          text: "Crear un nuevo espacio de equipo",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "Aún no has vinculado ningún espacio de equipo.",
          description:
            "Los propietarios del espacio de equipo y del proyecto pueden gestionar el acceso a los proyectos.",
        },
      },
      primary_button: {
        text: "Vincular un espacio de equipo",
      },
      secondary_button: {
        text: "Más información",
      },
      table: {
        columns: {
          teamspaceName: "Nombre del espacio de equipo",
          members: "Miembros",
          accountType: "Tipo de cuenta",
        },
        actions: {
          remove: {
            button: {
              text: "Eliminar espacio de equipo",
            },
            confirm: {
              title: "Eliminar {teamspaceName} de {projectName}",
              description:
                "Cuando elimines este espacio de equipo de un proyecto vinculado, los miembros aquí perderán el acceso al proyecto vinculado.",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "No se encontraron espacios de equipo coincidentes",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {Has vinculado un espacio de equipo a este proyecto.} other {Has vinculado # espacios de equipo a este proyecto.}}",
            description:
              "{additionalCount, plural, =0 {El espacio de equipo {firstTeamspaceName} ahora está vinculado a este proyecto.} other {El espacio de equipo {firstTeamspaceName} y {additionalCount} más ahora están vinculados a este proyecto.}}",
          },
          error: {
            title: "Eso no funcionó.",
            description: "Inténtalo de nuevo o recarga esta página antes de intentarlo de nuevo.",
          },
        },
        remove_teamspace: {
          success: {
            title: "Has eliminado ese espacio de equipo de este proyecto.",
            description: "El espacio de equipo {teamspaceName} fue eliminado de {projectName}.",
          },
          error: {
            title: "Eso no funcionó.",
            description: "Inténtalo de nuevo o recarga esta página antes de intentarlo de nuevo.",
          },
        },
      },
      link_teamspace: {
        placeholder: "Buscar espacios de equipo",
        info: {
          title:
            "Agregar un espacio de equipo otorga a todos los miembros del espacio de equipo acceso a este proyecto.",
          link: "Más información",
        },
        empty_state: {
          no_teamspaces: {
            title: "No tienes ningún espacio de equipo para vincular.",
            description:
              "O bien no estás en un espacio de equipo que puedas vincular o ya has vinculado todos los espacios de equipo disponibles.",
          },
          no_results: {
            title: "Eso no coincide con ninguno de tus espacios de equipo.",
            description: "Prueba con otro término o asegúrate de tener espacios de equipo para vincular.",
          },
        },
        primary_button: {
          text: "Vincular espacio(s) de equipo seleccionado(s)",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "Crea elementos de trabajo específicos del equipo.",
        description:
          "Los elementos de trabajo que están asignados a miembros de este equipo en cualquier proyecto vinculado aparecerán automáticamente aquí. Si esperas ver algunos elementos de trabajo aquí, asegúrate de que tus proyectos vinculados tengan elementos de trabajo asignados a miembros de este equipo o crea elementos de trabajo.",
        primary_button: {
          text: "Agregar elementos de trabajo a un proyecto vinculado",
        },
      },
      work_items_empty_filter: {
        title: "No hay elementos de trabajo específicos del equipo para los filtros aplicados",
        description:
          "Cambia algunos de esos filtros o bórralos todos para ver los elementos de trabajo relevantes para este espacio.",
        secondary_button: {
          text: "Borrar todos los filtros",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "Ninguno de tus proyectos vinculados tiene un Cycle activo.",
        description:
          "Los Cycles activos en proyectos vinculados aparecerán automáticamente aquí. Si esperas ver un Cycle activo, asegúrate de que esté ejecutándose en un proyecto vinculado en este momento.",
      },
      completed: {
        title: "Ninguno de tus proyectos vinculados tiene un Cycle completado.",
        description:
          "Los Cycles completados en proyectos vinculados aparecerán automáticamente aquí. Si esperas ver un Cycle completado, asegúrate de que también esté completado en un proyecto vinculado.",
      },
      upcoming: {
        title: "Ninguno de tus proyectos vinculados tiene un Cycle próximo.",
        description:
          "Los Cycles próximos en proyectos vinculados aparecerán automáticamente aquí. Si esperas ver un Cycle próximo, asegúrate de que también esté en un proyecto vinculado.",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title: "Las vistas de tu equipo de tu trabajo sin interrumpir otras vistas en tu espacio de trabajo",
        description:
          "Ve el trabajo de tu equipo en vistas que se guardan solo para tu equipo y separadamente de las vistas de un proyecto.",
        primary_button: {
          text: "Crear una vista",
        },
      },
      filter: {
        title: "No hay vistas coincidentes",
        description: `Ninguna vista coincide con los criterios de búsqueda.
 Crea una nueva vista en su lugar.`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "Aloja el conocimiento de tu equipo en Pages.",
        description:
          "A diferencia de las Pages en un proyecto, puedes guardar conocimiento específico de un equipo en un conjunto separado de Pages aquí. Obtén todas las funciones de Pages, crea documentos de mejores prácticas y wikis de equipo fácilmente.",
        primary_button: {
          text: "Crea tu primera Page",
        },
      },
      filter: {
        title: "No hay Pages coincidentes",
        description: "Elimina los filtros para ver todas las Pages",
      },
      search: {
        title: "No hay Pages coincidentes",
        description: "Elimina los criterios de búsqueda para ver todas las Pages",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "Ninguno de tus proyectos vinculados tiene elementos de trabajo publicados.",
        description:
          "Crea algunos elementos de trabajo en uno o más de esos proyectos para ver el progreso por fechas, estados y prioridad.",
      },
      relation: {
        blocking: {
          title: "No tienes ningún elemento de trabajo bloqueando a un compañero de equipo.",
          description: "¡Buen trabajo! Has despejado el camino para tu equipo. Eres un buen jugador de equipo.",
        },
        blocked: {
          title: "No tienes elementos de trabajo de compañeros que te estén bloqueando.",
          description: "¡Buenas noticias! Puedes avanzar en todos tus elementos de trabajo asignados.",
        },
      },
      stats: {
        general: {
          title: "Ninguno de tus proyectos vinculados tiene elementos de trabajo publicados.",
          description:
            "Crea algunos elementos de trabajo en uno o más de esos proyectos para ver la distribución del trabajo por proyecto y miembros del equipo.",
        },
        filter: {
          title: "No hay estadísticas de equipo para los filtros aplicados.",
          description:
            "Crea algunos elementos de trabajo en uno o más de esos proyectos para ver la distribución del trabajo por proyecto y miembros del equipo.",
        },
      },
    },
  },
  initiatives: {
    overview: "Resumen",
    label: "Iniciativas",
    placeholder: "{count, plural, one{# iniciativa} other{# iniciativas}}",
    add_initiative: "Agregar Iniciativa",
    create_initiative: "Crear Iniciativa",
    update_initiative: "Actualizar Iniciativa",
    initiative_name: "Nombre de la iniciativa",
    all_initiatives: "Todas las Iniciativas",
    delete_initiative: "Eliminar Iniciativa",
    fill_all_required_fields: "Por favor complete todos los campos requeridos.",
    toast: {
      create_success: "Iniciativa {name} creada exitosamente.",
      create_error: "Error al crear la iniciativa. ¡Por favor intente nuevamente!",
      update_success: "Iniciativa {name} actualizada exitosamente.",
      update_error: "Error al actualizar la iniciativa. ¡Por favor intente nuevamente!",
      delete: {
        success: "Iniciativa eliminada exitosamente.",
        error: "Error al eliminar la Iniciativa",
      },
      link_copied: "Enlace de la iniciativa copiado al portapapeles.",
      project_update_success: "Proyectos de la iniciativa actualizados exitosamente.",
      project_update_error: "Error al actualizar los proyectos de la iniciativa. ¡Por favor intente nuevamente!",
      epic_update_success:
        "Epic{count, plural, one { agregado a la Iniciativa exitosamente.} other {s agregados a la Iniciativa exitosamente.}}",
      epic_update_error: "Error al agregar Epic a la Iniciativa. Por favor intente más tarde.",
      state_update_success: "El estado de la iniciativa se actualizó correctamente.",
      state_update_error: "No se pudo actualizar el estado de la iniciativa. ¡Por favor, inténtelo de nuevo!",
      label_update_error: "Error al actualizar las etiquetas de la iniciativa. ¡Por favor, inténtalo de nuevo!",
    },
    empty_state: {
      general: {
        title: "Organiza el trabajo al más alto nivel con Iniciativas",
        description:
          "Cuando necesitas organizar trabajo que abarca varios proyectos y equipos, las Iniciativas son útiles. Conecta proyectos y Epics a iniciativas, ve actualizaciones automáticamente consolidadas y ve el bosque antes que los árboles.",
        primary_button: {
          text: "Crear una iniciativa",
        },
      },
      search: {
        title: "No hay iniciativas coincidentes",
        description: `No se detectaron iniciativas con los criterios de búsqueda.
 Crea una nueva iniciativa en su lugar.`,
      },
      not_found: {
        title: "La Iniciativa no existe",
        description: "La Iniciativa que estás buscando no existe, ha sido archivada o ha sido eliminada.",
        primary_button: {
          text: "Ver otras Iniciativas",
        },
      },
      epics: {
        title: "No tienes Epics que coincidan con los filtros que has aplicado.",
        subHeading: "Para ver todos los Epics, elimina todos los filtros aplicados.",
        action: "Eliminar filtros",
      },
    },
    scope: {
      view_scope: "Ver alcance",
      breakdown: "Desglose de alcance",
      add_scope: "Agregar alcance",
      label: "Alcance",
      empty_state: {
        title: "Aún no se ha agregado alcance a esta iniciativa",
        description: "Conecta proyectos y épicas y sigue esa obra en este espacio.",
        primary_button: {
          text: "Agregar alcance",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "Etiquetas",
        description: "Estructura y organiza tus iniciativas con etiquetas.",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "Eliminar etiqueta",
        content:
          "¿Estás seguro de que deseas eliminar {labelName}? Esto eliminará la etiqueta de todas las iniciativas y de cualquier vista donde se esté filtrando la etiqueta.",
      },
      toast: {
        delete_error: "No se pudo eliminar la etiqueta de la iniciativa. Por favor, inténtalo de nuevo.",
        label_already_exists: "La etiqueta ya existe",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title:
          "Escribe una nota, un documento o una base de conocimiento completa. Obtén ayuda de Galileo, el asistente de IA de Plane, para comenzar",
        description:
          "Las Pages son espacios de pensamiento en Plane. Toma notas de reuniones, fórmalas fácilmente, integra elementos de trabajo, organízalas usando una biblioteca de componentes y mantenlas todas en el contexto de tu proyecto. Para hacer cualquier documento rápidamente, invoca a Galileo, la IA de Plane, con un atajo o el clic de un botón.",
        primary_button: {
          text: "Crea tu primera Page",
        },
      },
      private: {
        title: "Aún no hay Pages privadas",
        description:
          "Mantén tus pensamientos privados aquí. Cuando estés listo para compartir, el equipo está a un clic de distancia.",
        primary_button: {
          text: "Crea tu primera Page",
        },
      },
      public: {
        title: "Aún no hay Pages de espacio de trabajo",
        description: "Ve las Pages compartidas con todos en tu espacio de trabajo aquí mismo.",
        primary_button: {
          text: "Crea tu primera Page",
        },
      },
      archived: {
        title: "Aún no hay Pages archivadas",
        description: "Archiva las Pages que no estén en tu radar. Accede a ellas aquí cuando las necesites.",
      },
    },
  },
  epics: {
    label: "Epics",
    no_epics_selected: "No hay Epics seleccionados",
    add_selected_epics: "Agregar Epics seleccionados",
    epic_link_copied_to_clipboard: "Enlace del Epic copiado al portapapeles.",
    project_link_copied_to_clipboard: "Enlace del proyecto copiado al portapapeles",
    empty_state: {
      general: {
        title: "Crea un Epic y asígnalo a alguien, incluso a ti mismo",
        description:
          "Para trabajos más grandes que abarcan varios Cycles y pueden existir en varios Modules, crea un Epic. Vincula elementos de trabajo y sub-elementos en un proyecto a un Epic y accede a un elemento de trabajo desde la vista general.",
        primary_button: {
          text: "Crear un Epic",
        },
      },
      section: {
        title: "Aún no hay Epics",
        description: "Comienza a agregar Epics para gestionar y seguir el progreso.",
        primary_button: {
          text: "Agregar Epics",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "No se encontraron Epics coincidentes",
      },
      no_epics: {
        title: "No se encontraron Epics",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "No hay Cycles activos",
        description:
          "Cycles de tus proyectos que incluyen cualquier período que abarque la fecha de hoy dentro de su rango. Encuentra el progreso y los detalles de todos tus Cycles activos aquí.",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: `Agrega elementos de trabajo al Cycle para ver su
 progreso`,
      },
      priority: {
        title: `Observa los elementos de trabajo de alta prioridad abordados en
 el Cycle de un vistazo.`,
      },
      assignee: {
        title: `Agrega asignados a los elementos de trabajo para ver un
 desglose del trabajo por asignados.`,
      },
      label: {
        title: `Agrega etiquetas a los elementos de trabajo para ver el
 desglose del trabajo por etiquetas.`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "Importar miembros desde CSV",
      description: "Sube un CSV con columnas: Email, Display Name, First Name, Last Name, Role (5, 15 o 20)",
      dropzone: {
        active: "Suelta el archivo CSV aquí",
        inactive: "Arrastra y suelta o haz clic para subir",
        file_type: "Solo se admiten archivos .csv",
      },
      buttons: {
        cancel: "Cancelar",
        import: "Importar",
        try_again: "Intentar de nuevo",
        close: "Cerrar",
        done: "Hecho",
      },
      progress: {
        uploading: "Subiendo...",
        importing: "Importando...",
      },
      summary: {
        title: {
          failed: "Importación fallida",
          complete: "Importación completada",
        },
        message: {
          seat_limit: "No se pueden importar miembros debido a restricciones de límite de asientos.",
          success: "{count} miembro{plural} agregado{plural} exitosamente al espacio de trabajo.",
          no_imports: "No se importaron miembros desde el archivo CSV.",
        },
        stats: {
          successful: "Exitoso",
          failed: "Fallido",
        },
        download_errors: "Descargar errores",
      },
      toast: {
        invalid_file: {
          title: "Archivo inválido",
          message: "Solo se admiten archivos CSV.",
        },
        import_failed: {
          title: "Importación fallida",
          message: "Algo salió mal.",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "No se pueden archivar elementos de trabajo",
        message:
          "Solo los elementos de trabajo pertenecientes a grupos de estado Completado o Cancelado pueden ser archivados.",
      },
      invalid_issue_start_date: {
        title: "No se pueden actualizar elementos de trabajo",
        message:
          "La fecha de inicio seleccionada es posterior a la fecha de vencimiento de algunos elementos de trabajo. Asegúrese de que la fecha de inicio sea anterior a la fecha de vencimiento.",
      },
      invalid_issue_target_date: {
        title: "No se pueden actualizar elementos de trabajo",
        message:
          "La fecha de vencimiento seleccionada es anterior a la fecha de inicio de algunos elementos de trabajo. Asegúrese de que la fecha de vencimiento sea posterior a la fecha de inicio.",
      },
      invalid_state_transition: {
        title: "No se pueden actualizar elementos de trabajo",
        message:
          "El cambio de estado no está permitido para algunos elementos de trabajo. Asegúrese de que el cambio de estado esté permitido.",
      },
    },
  },
  work_item_types: {
    label: "Tipos de elementos de trabajo",
    label_lowercase: "tipos de elementos de trabajo",
    settings: {
      title: "Tipos de elementos de trabajo",
      properties: {
        title: "Propiedades personalizadas del elemento de trabajo",
        tooltip:
          "Cada tipo de elemento de trabajo viene con un conjunto predeterminado de propiedades como Título, Descripción, Asignado, Estado, Prioridad, Fecha de inicio, Fecha de vencimiento, Module, Cycle, etc. También puedes personalizar y agregar tus propias propiedades para adaptarlo a las necesidades de tu equipo.",
        add_button: "Agregar nueva propiedad",
        dropdown: {
          label: "Tipo de propiedad",
          placeholder: "Seleccionar tipo",
        },
        property_type: {
          text: {
            label: "Texto",
          },
          number: {
            label: "Número",
          },
          dropdown: {
            label: "Desplegable",
          },
          boolean: {
            label: "Booleano",
          },
          date: {
            label: "Fecha",
          },
          member_picker: {
            label: "Selector de miembros",
          },
          release_picker: {
            label: "Selector de versiones",
          },
          formula: {
            label: "Fórmula",
          },
        },
        attributes: {
          label: "Atributos",
          text: {
            single_line: {
              label: "Línea única",
            },
            multi_line: {
              label: "Párrafo",
            },
            readonly: {
              label: "Solo lectura",
              header: "Datos de solo lectura",
            },
            invalid_text_format: {
              label: "Formato de texto inválido",
            },
          },
          number: {
            default: {
              placeholder: "Agregar número",
            },
          },
          relation: {
            single_select: {
              label: "Selección única",
            },
            multi_select: {
              label: "Selección múltiple",
            },
            no_default_value: {
              label: "Sin valor predeterminado",
            },
          },
          boolean: {
            label: "Verdadero | Falso",
            no_default: "Sin valor predeterminado",
          },
          option: {
            create_update: {
              label: "Opciones",
              form: {
                placeholder: "Agregar opción",
                errors: {
                  name: {
                    required: "El nombre de la opción es obligatorio.",
                    integrity: "Ya existe una opción con el mismo nombre.",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "Seleccionar opción",
                multi: {
                  default: "Seleccionar opciones",
                  variable: "{count} opciones seleccionadas",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "¡Éxito!",
              message: "Propiedad {name} creada exitosamente.",
            },
            error: {
              title: "¡Error!",
              message: "Error al crear la propiedad. ¡Por favor intente nuevamente!",
            },
          },
          update: {
            success: {
              title: "¡Éxito!",
              message: "Propiedad {name} actualizada exitosamente.",
            },
            error: {
              title: "¡Error!",
              message: "Error al actualizar la propiedad. ¡Por favor intente nuevamente!",
            },
          },
          delete: {
            success: {
              title: "¡Éxito!",
              message: "Propiedad {name} eliminada exitosamente.",
            },
            error: {
              title: "¡Error!",
              message: "Error al eliminar la propiedad. ¡Por favor intente nuevamente!",
            },
          },
          enable_disable: {
            loading: "{action} propiedad {name}",
            success: {
              title: "¡Éxito!",
              message: "Propiedad {name} {action} exitosamente.",
            },
            error: {
              title: "¡Error!",
              message: "Error al {action} la propiedad. ¡Por favor intente nuevamente!",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "Título",
            },
            description: {
              placeholder: "Descripción",
            },
          },
          errors: {
            name: {
              required: "Debes nombrar tu propiedad.",
              max_length: "El nombre de la propiedad no debe exceder los 255 caracteres.",
            },
            property_type: {
              required: "Debes seleccionar un tipo de propiedad.",
            },
            options: {
              required: "Debes agregar al menos una opción.",
            },
            formula: {
              required: "La expresión de fórmula es obligatoria.",
              invalid: "Fórmula no válida: {error}",
              circular_reference:
                "Referencia circular detectada. Una fórmula no puede hacer referencia a sí misma directa o indirectamente.",
              invalid_reference: "La fórmula hace referencia a una propiedad inexistente.",
            },
          },
        },
        formula: {
          field_label: "Campo de fórmula",
          tooltip: "Ingrese una fórmula usando la sintaxis '{'Nombre del campo'}'. Admite operadores +, -, *, / y &.",
          placeholder: "Escribir la fórmula",
          test_button: "Probar",
          validating: "Validando",
          validation_success: "¡La fórmula es válida! Devuelve {resultType}",
          validation_success_with_refs:
            "¡La fórmula es válida! Devuelve {resultType} ({count} campo(s) referenciado(s))",
          error: {
            empty: "Por favor ingrese una fórmula",
            missing_context: "Falta el contexto de espacio de trabajo, proyecto o tipo de elemento de trabajo",
            validation_failed: "La validación falló",
          },
          picker: {
            no_match: "No hay propiedades coincidentes",
            no_available: "No hay propiedades disponibles",
          },
        },
        enable_disable: {
          label: "Activo",
          tooltip: {
            disabled: "Clic para deshabilitar",
            enabled: "Clic para habilitar",
          },
        },
        delete_confirmation: {
          title: "Eliminar esta propiedad",
          description: "La eliminación de propiedades puede llevar a la pérdida de datos existentes.",
          secondary_description: "¿Deseas deshabilitar la propiedad en su lugar?",
          primary_button: "{action}, eliminarla",
          secondary_button: "Sí, deshabilitarla",
        },
        mandate_confirmation: {
          label: "Propiedad obligatoria",
          content:
            "Parece que hay una opción predeterminada para esta propiedad. Hacer la propiedad obligatoria eliminará el valor predeterminado y los usuarios deberán agregar un valor de su elección.",
          tooltip: {
            disabled: "Este tipo de propiedad no puede ser obligatorio",
            enabled: "Desmarca para hacer el campo opcional",
            checked: "Marca para hacer el campo obligatorio",
          },
        },
        empty_state: {
          title: "Agregar propiedades personalizadas",
          description: "Las nuevas propiedades que agregues para este tipo de elemento de trabajo aparecerán aquí.",
        },
      },
      item_delete_confirmation: {
        title: "Eliminar este tipo",
        description: "La eliminación de tipos puede provocar la pérdida de datos existentes.",
        primary_button: "Sí, eliminarlo",
        toast: {
          success: {
            title: "¡Éxito!",
            message: "Tipo de elemento de trabajo eliminado con éxito.",
          },
          error: {
            title: "¡Error!",
            message: "No se pudo eliminar el tipo de elemento de trabajo. ¡Inténtalo de nuevo!",
          },
        },
        errors: {
          cannot_delete_default_work_item_type: "No se puede eliminar el tipo de elemento de trabajo predeterminado",
          cannot_delete_work_item_type_with_associated_work_items:
            "No se puede eliminar el tipo de elemento de trabajo con elementos de trabajo asociados",
        },
        can_disable_warning: "¿Desea desactivar el tipo en su lugar?",
      },
      cant_delete_default_message:
        "No se puede eliminar este tipo de elemento de trabajo porque está establecido como el tipo predeterminado para este proyecto.",
    },
    create: {
      title: "Crear tipo de elemento de trabajo",
      button: "Agregar tipo de elemento de trabajo",
      toast: {
        success: {
          title: "¡Éxito!",
          message: "Tipo de elemento de trabajo creado exitosamente.",
        },
        error: {
          title: "¡Error!",
          message: {
            conflict: "El tipo {name} ya existe. Elige un nombre diferente.",
          },
        },
      },
    },
    update: {
      title: "Actualizar tipo de elemento de trabajo",
      button: "Actualizar tipo de elemento de trabajo",
      toast: {
        success: {
          title: "¡Éxito!",
          message: "Tipo de elemento de trabajo {name} actualizado exitosamente.",
        },
        error: {
          title: "¡Error!",
          message: {
            conflict: "El tipo {name} ya existe. Elige un nombre diferente.",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "Dale a este tipo de elemento de trabajo un nombre único",
        },
        description: {
          placeholder: "Describe para qué está destinado este tipo de elemento de trabajo y cuándo debe usarse.",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{action} tipo de elemento de trabajo {name}",
        success: {
          title: "¡Éxito!",
          message: "Tipo de elemento de trabajo {name} {action} exitosamente.",
        },
        error: {
          title: "¡Error!",
          message: "Error al {action} el tipo de elemento de trabajo. ¡Por favor intente nuevamente!",
        },
      },
      tooltip: "Clic para {action}",
    },
    change_confirmation: {
      title: "¿Cambiar tipo de elemento de trabajo?",
      description:
        "Cambiar el tipo de elemento de trabajo puede resultar en la pérdida de valores de propiedades personalizadas que son específicas del tipo actual. Esta acción no se puede deshacer.",
      button: {
        loading: "Cambiando",
        default: "Cambiar tipo",
      },
    },
    empty_state: {
      enable: {
        title: "Habilitar tipos de elementos de trabajo",
        description:
          "Da forma a los elementos de trabajo con tipos de elementos de trabajo. Personaliza con iconos, fondos y propiedades y configúralos para este proyecto.",
        primary_button: {
          text: "Habilitar",
        },
        confirmation: {
          title: "Una vez habilitados, los tipos de elementos de trabajo no se pueden deshabilitar.",
          description:
            "El elemento de trabajo de Plane se convertirá en el tipo de elemento de trabajo predeterminado para este proyecto y aparecerá con su icono y fondo en este proyecto.",
          button: {
            default: "Habilitar",
            loading: "Configurando",
          },
        },
      },
      get_pro: {
        title: "Obtén Pro para habilitar tipos de elementos de trabajo.",
        description:
          "Da forma a los elementos de trabajo con tipos de elementos de trabajo. Personaliza con iconos, fondos y propiedades y configúralos para este proyecto.",
        primary_button: {
          text: "Obtener Pro",
        },
      },
      upgrade: {
        title: "Actualiza para habilitar tipos de elementos de trabajo.",
        description:
          "Da forma a los elementos de trabajo con tipos de elementos de trabajo. Personaliza con iconos, fondos y propiedades y configúralos para este proyecto.",
        primary_button: {
          text: "Actualizar",
        },
      },
    },
  },
  importers: {
    imports: "Importaciones",
    logo: "Logo",
    import_message: "Importa tus datos de {serviceName} a proyectos de Plane",
    deactivate: "Desactivar",
    deactivating: "Desactivando",
    migrating: "Migrando",
    migrations: "Migraciones",
    refreshing: "Actualizando",
    import: "Importar",
    serial_number: "Nº Serie",
    project: "Proyecto",
    workspace: "Espacio de trabajo",
    status: "Estado",
    summary: "Resumen",
    total_batches: "Total de lotes",
    imported_batches: "Lotes importados",
    re_run: "Volver a ejecutar",
    cancel: "Cancelar",
    start_time: "Hora de inicio",
    no_jobs_found: "No se encontraron trabajos",
    no_project_imports: "Aún no has importado ningún proyecto de {serviceName}",
    cancel_import_job: "Cancelar trabajo de importación",
    cancel_import_job_confirmation:
      "¿Estás seguro de que deseas cancelar este trabajo de importación? Esto detendrá el proceso de importación para este proyecto.",
    re_run_import_job: "Volver a ejecutar trabajo de importación",
    re_run_import_job_confirmation:
      "¿Estás seguro de que deseas volver a ejecutar este trabajo de importación? Esto reiniciará el proceso de importación para este proyecto.",
    upload_csv_file: "Sube un archivo CSV para importar datos de usuarios.",
    connect_importer: "Conectar {serviceName}",
    migration_assistant: "Asistente de migración",
    migration_assistant_description:
      "Migra sin problemas tus proyectos de {serviceName} a Plane con nuestro potente asistente.",
    token_helper: "Obtendrás esto de tu",
    personal_access_token: "Token de acceso personal",
    source_token_expired: "Token expirado",
    source_token_expired_description:
      "El token proporcionado ha expirado. Por favor, desactiva y vuelve a conectar con nuevas credenciales.",
    user_email: "Correo electrónico del usuario",
    select_state: "Seleccionar estado",
    select_service_project: "Seleccionar proyecto de {serviceName}",
    loading_service_projects: "Cargando proyectos de {serviceName}",
    select_service_workspace: "Seleccionar espacio de trabajo de {serviceName}",
    loading_service_workspaces: "Cargando espacios de trabajo de {serviceName}",
    select_priority: "Seleccionar prioridad",
    select_service_team: "Seleccionar equipo de {serviceName}",
    add_seat_msg_free_trial:
      "Estás intentando importar {additionalUserCount} usuarios no registrados y solo tienes {currentWorkspaceSubscriptionAvailableSeats} asientos disponibles en el plan actual. Para continuar importando, actualiza ahora.",
    add_seat_msg_paid:
      "Estás intentando importar {additionalUserCount} usuarios no registrados y solo tienes {currentWorkspaceSubscriptionAvailableSeats} asientos disponibles en el plan actual. Para continuar importando, compra al menos {extraSeatRequired} asientos adicionales.",
    skip_user_import_title: "Omitir importación de datos de usuario",
    skip_user_import_description:
      "Omitir la importación de usuarios resultará en que los elementos de trabajo, comentarios y otros datos de {serviceName} sean creados por el usuario que realiza la migración en Plane. Aún puedes agregar usuarios manualmente más tarde.",
    invalid_pat: "Token de acceso personal inválido",
  },
  integrations: {
    integrations: "Integraciones",
    loading: "Cargando",
    unauthorized: "No estás autorizado para ver esta página.",
    configure: "Configurar",
    not_enabled: "{name} no está habilitado para este espacio de trabajo.",
    not_configured: "No configurado",
    disconnect_personal_account: "Desconectar cuenta personal de {providerName}",
    not_configured_message_admin:
      "La integración de {name} no está configurada. Por favor, contacta con el administrador de tu instancia para configurarla.",
    not_configured_message_support:
      "La integración de {name} no está configurada. Por favor, contacta con soporte para configurarla.",
    external_api_unreachable: "No se puede acceder a la API externa. Por favor, inténtalo más tarde.",
    error_fetching_supported_integrations:
      "No se pueden obtener las integraciones soportadas. Por favor, inténtalo más tarde.",
    back_to_integrations: "Volver a integraciones",
    select_state: "Seleccionar estado",
    set_state: "Establecer estado",
    choose_project: "Elegir proyecto...",
    skip_backward_state_movement: "Evitar que los issues vuelvan a un estado anterior debido a actualizaciones de PR",
  },
  github_integration: {
    name: "GitHub",
    description: "Conecta y sincroniza tus elementos de trabajo de GitHub con Plane",
    connect_org: "Conectar organización",
    connect_org_description: "Conecta tu organización de GitHub con Plane",
    processing: "Procesando",
    org_added_desc: "GitHub org añadida por y tiempo",
    connection_fetch_error: "Error al obtener detalles de conexión del servidor",
    personal_account_connected: "Cuenta personal conectada",
    personal_account_connected_description: "Tu cuenta de GitHub ahora está conectada a Plane",
    connect_personal_account: "Conectar cuenta personal",
    connect_personal_account_description: "Conecta tu cuenta personal de GitHub con Plane.",
    repo_mapping: "Mapa de repositorios",
    repo_mapping_description: "Mapear tus repositorios de GitHub con proyectos de Plane.",
    project_issue_sync: "Sincronización de problemas de proyecto",
    project_issue_sync_description: "Sincronizar problemas de GitHub a tu proyecto de Plane",
    project_issue_sync_empty_state: "Las sincronizaciones de problemas de proyecto mapeadas aparecerán aquí",
    configure_project_issue_sync_state: "Configurar estado de sincronización de problemas",
    select_issue_sync_direction: "Seleccionar dirección de sincronización de problemas",
    allow_bidirectional_sync:
      "Bidirectional - Sincronizar problemas y comentarios en ambas direcciones entre GitHub y Plane",
    allow_unidirectional_sync: "Unidirectional - Sincronizar problemas y comentarios de GitHub a Plane solo",
    allow_unidirectional_sync_warning:
      "Los datos del problema de GitHub reemplazarán los datos en el elemento de trabajo vinculado de Plane (GitHub → Plane solamente)",
    remove_project_issue_sync: "Eliminar esta sincronización de problemas de proyecto",
    remove_project_issue_sync_confirmation:
      "¿Estás seguro de que deseas eliminar esta sincronización de problemas de proyecto?",
    add_pr_state_mapping: "Agregar mapeo de estado de solicitud de fusión para proyecto de Plane",
    edit_pr_state_mapping: "Editar mapeo de estado de solicitud de fusión para proyecto de Plane",
    pr_state_mapping: "Mapeo de estado de solicitud de fusión",
    pr_state_mapping_description: "Mapear estados de solicitud de fusión de GitHub a tu proyecto de Plane",
    pr_state_mapping_empty_state: "Los estados de PR mapeados aparecerán aquí",
    remove_pr_state_mapping: "Eliminar este mapeo de estado de solicitud de fusión",
    remove_pr_state_mapping_confirmation:
      "¿Estás seguro de que deseas eliminar este mapeo de estado de solicitud de fusión?",
    issue_sync_message: "Los elementos de trabajo se sincronizan con {project}",
    link: "Vincular repositorio de GitHub al proyecto de Plane",
    pull_request_automation: "Automatización de solicitud de fusión",
    pull_request_automation_description:
      "Configurar el mapeo de estado de solicitud de fusión de GitHub a tu proyecto de Plane",
    DRAFT_MR_OPENED: "Borrador abierto",
    MR_OPENED: "Abierto",
    MR_READY_FOR_MERGE: "Listo para fusionar",
    MR_REVIEW_REQUESTED: "Revisión solicitada",
    MR_MERGED: "Fusionado",
    MR_CLOSED: "Cerrado",
    ISSUE_OPEN: "Issue Abierto",
    ISSUE_CLOSED: "Issue Cerrado",
    save: "Guardar",
    start_sync: "Iniciar sincronización",
    choose_repository: "Elegir repositorio...",
  },
  gitlab_integration: {
    name: "GitLab",
    description: "Conecta y sincroniza tus solicitudes de fusión de GitLab con Plane",
    connection_fetch_error: "Error al obtener detalles de conexión del servidor",
    connect_org: "Conectar organización",
    connect_org_description: "Conecta tu organización de GitLab con Plane",
    project_connections: "Conexiones de proyecto de GitLab",
    project_connections_description: "Sincroniza solicitudes de fusión de GitLab a proyectos de Plane",
    plane_project_connection: "Conexión de proyecto de Plane",
    plane_project_connection_description:
      "Configura el mapeo de estados de solicitudes de fusión de GitLab a proyectos de Plane",
    remove_connection: "Eliminar conexión",
    remove_connection_confirmation: "¿Estás seguro de que deseas eliminar esta conexión?",
    link: "Vincular repositorio de GitLab al proyecto de Plane",
    pull_request_automation: "Automatización de solicitud de fusión",
    pull_request_automation_description: "Configura el mapeo de estados de solicitud de fusión de GitLab a Plane",
    DRAFT_MR_OPENED: "Al abrir MR borrador, establecer el estado a",
    MR_OPENED: "Al abrir MR, establecer el estado a",
    MR_REVIEW_REQUESTED: "Al solicitar revisión de MR, establecer el estado a",
    MR_READY_FOR_MERGE: "Cuando MR esté listo para fusionar, establecer el estado a",
    MR_MERGED: "Al fusionar MR, establecer el estado a",
    MR_CLOSED: "Al cerrar MR, establecer el estado a",
    integration_enabled_text:
      "Con la integración de GitLab habilitada, puedes automatizar flujos de trabajo de elementos de trabajo",
    choose_entity: "Elegir entidad",
    choose_project: "Elegir proyecto",
    link_plane_project: "Vincular proyecto de Plane",
    project_issue_sync: "Sincronización de Incidencias del Proyecto",
    project_issue_sync_description: "Sincroniza incidencias de Gitlab a tu proyecto de Plane",
    project_issue_sync_empty_state: "La sincronización de incidencias del proyecto mapeada aparecerá aquí",
    configure_project_issue_sync_state: "Configurar Estado de Sincronización de Incidencias",
    select_issue_sync_direction: "Selecciona la dirección de sincronización de incidencias",
    allow_bidirectional_sync:
      "Bidireccional - Sincronizar incidencias y comentarios en ambas direcciones entre Gitlab y Plane",
    allow_unidirectional_sync: "Unidireccional - Sincronizar incidencias y comentarios solo de Gitlab a Plane",
    allow_unidirectional_sync_warning:
      "Los datos de Gitlab Issue reemplazarán los datos en el Elemento de Trabajo de Plane vinculado (solo Gitlab → Plane)",
    remove_project_issue_sync: "Eliminar esta Sincronización de Incidencias del Proyecto",
    remove_project_issue_sync_confirmation:
      "¿Estás seguro de que deseas eliminar esta sincronización de incidencias del proyecto?",
    ISSUE_OPEN: "Incidencia Abierta",
    ISSUE_CLOSED: "Incidencia Cerrada",
    save: "Guardar",
    start_sync: "Iniciar Sincronización",
    choose_repository: "Elegir Repositorio...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Conecta y sincroniza tu instancia de Gitlab Enterprise con Plane.",
    app_form_title: "Configuración de Gitlab Enterprise",
    app_form_description: "Configura Gitlab Enterprise para conectar con Plane.",
    base_url_title: "URL Base",
    base_url_description: "La URL base de tu instancia de Gitlab Enterprise.",
    base_url_placeholder: 'ej. "https://glab.plane.town"',
    base_url_error: "La URL base es obligatoria",
    invalid_base_url_error: "URL base inválida",
    client_id_title: "ID de App",
    client_id_description: "El ID de la app que creaste en tu instancia de Gitlab Enterprise.",
    client_id_placeholder: 'ej. "7cd732xxxxxxxxxxxxxx"',
    client_id_error: "El ID de App es obligatorio",
    client_secret_title: "Client Secret",
    client_secret_description: "El client secret de la app que creaste en tu instancia de Gitlab Enterprise.",
    client_secret_placeholder: 'ej. "gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "El client secret es obligatorio",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description:
      "Un webhook secret aleatorio que se usará para verificar el webhook de la instancia de Gitlab Enterprise.",
    webhook_secret_placeholder: 'ej. "webhook1234567890"',
    webhook_secret_error: "El webhook secret es obligatorio",
    connect_app: "Conectar App",
  },
  slack_integration: {
    name: "Slack",
    description: "Conecta tu espacio de trabajo de Slack con Plane",
    connect_personal_account: "Conecta tu cuenta personal de Slack con Plane",
    personal_account_connected: "Tu cuenta personal de {providerName} ahora está conectada a Plane",
    link_personal_account: "Vincula tu cuenta personal de {providerName} a Plane",
    connected_slack_workspaces: "Espacios de trabajo de Slack conectados",
    connected_on: "Conectado el {date}",
    disconnect_workspace: "Desconectar espacio de trabajo {name}",
    alerts: {
      dm_alerts: {
        title:
          "Recibe notificaciones en mensajes directos de Slack para actualizaciones importantes, recordatorios y alertas solo para ti.",
      },
    },
    project_updates: {
      title: "Actualizaciones de Proyecto",
      description: "Configura notificaciones de actualizaciones de proyectos para tus proyectos",
      add_new_project_update: "Añadir nueva notificación de actualizaciones de proyecto",
      project_updates_empty_state: "Los proyectos conectados con Canales de Slack aparecerán aquí.",
      project_updates_form: {
        title: "Configurar Actualizaciones de Proyecto",
        description:
          "Recibir notificaciones de actualizaciones de proyecto en Slack cuando se crean elementos de trabajo",
        failed_to_load_channels: "Error al cargar canales de Slack",
        project_dropdown: {
          placeholder: "Seleccionar un proyecto",
          label: "Proyecto de Plane",
          no_projects: "No hay proyectos disponibles",
        },
        channel_dropdown: {
          label: "Canal de Slack",
          placeholder: "Seleccionar un canal",
          no_channels: "No hay canales disponibles",
        },
        all_projects_connected: "Todos los proyectos ya están conectados a canales de Slack.",
        all_channels_connected: "Todos los canales de Slack ya están conectados a proyectos.",
        project_connection_success: "Conexión de proyecto creada exitosamente",
        project_connection_updated: "Conexión de proyecto actualizada exitosamente",
        project_connection_deleted: "Conexión de proyecto eliminada exitosamente",
        failed_delete_project_connection: "Error al eliminar conexión de proyecto",
        failed_create_project_connection: "Error al crear conexión de proyecto",
        failed_upserting_project_connection: "Error al actualizar conexión de proyecto",
        failed_loading_project_connections:
          "No pudimos cargar tus conexiones de proyecto. Esto podría deberse a un problema de red o un problema con la integración.",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "Conecta tu espacio de trabajo de Sentry con Plane.",
    connected_sentry_workspaces: "Espacios de trabajo de Sentry conectados",
    connected_on: "Conectado el {date}",
    disconnect_workspace: "Desconectar espacio de trabajo {name}",
    state_mapping: {
      title: "Mapeo de estados",
      description:
        "Mapea los estados de incidencias de Sentry a los estados de tu proyecto. Configura qué estados usar cuando una incidencia de Sentry se resuelve o no se resuelve.",
      add_new_state_mapping: "Agregar nuevo mapeo de estado",
      empty_state:
        "No hay mapeos de estado configurados. Crea tu primer mapeo para sincronizar los estados de incidencias de Sentry con los estados de tu proyecto.",
      failed_loading_state_mappings:
        "No pudimos cargar tus mapeos de estado. Esto podría deberse a un problema de red o un problema con la integración.",
      loading_project_states: "Cargando estados del proyecto...",
      error_loading_states: "Error al cargar estados",
      no_states_available: "No hay estados disponibles",
      no_permission_states: "No tienes permiso para acceder a los estados de este proyecto",
      states_not_found: "Estados del proyecto no encontrados",
      server_error_states: "Error del servidor al cargar estados",
    },
  },
  oauth_bridge_integration: {
    name: "OAuth Bridge",
    description: "Validar tokens de IdP externos para acceso a la API.",
    header_description:
      "Valide tokens OIDC/JWT emitidos externamente por su IdP (Azure AD, Okta, etc.) para acceso a la API de Plane.",
    connected: "Conectado",
    connect: "Conectar",
    uninstall: "Desinstalar",
    uninstalling: "Desinstalando...",
    install_success: "OAuth Bridge instalado correctamente.",
    install_error: "Error al instalar OAuth Bridge.",
    uninstall_success: "OAuth Bridge desinstalado.",
    uninstall_error: "Error al desinstalar OAuth Bridge.",
    token_providers: "Proveedores de tokens",
    token_providers_description: "Configure los IdP externos cuyos JWT se aceptan como credenciales de API.",
    add_provider: "Agregar proveedor",
    edit_provider: "Editar proveedor",
    enabled: "Habilitado",
    disabled: "Deshabilitado",
    test: "Probar",
    no_providers_title: "No hay proveedores configurados.",
    no_providers_description: "Agregue un IdP para habilitar la autenticación con tokens externos.",
    provider_updated: "Proveedor actualizado.",
    provider_added: "Proveedor agregado.",
    provider_save_error: "Error al guardar el proveedor.",
    provider_deleted: "Proveedor eliminado.",
    provider_delete_error: "Error al eliminar el proveedor.",
    provider_update_error: "Error al actualizar el proveedor.",
    jwks_reachable: "JWKS accesible",
    jwks_unreachable: "JWKS inaccesible",
    jwks_test_error: "No se pudo obtener el JWKS desde la URL configurada.",
    provider_form: {
      name_label: "Nombre",
      name_placeholder: "ej. Azure AD Producción",
      name_description: "Etiqueta legible para este proveedor de identidad",
      name_required: "El nombre es obligatorio.",
      issuer_label: "Emisor",
      issuer_placeholder: "https://login.microsoftonline.com/tenant-id/v2.0",
      issuer_description: "Valor esperado del claim iss en el JWT",
      issuer_required: "El emisor es obligatorio.",
      jwks_url_label: "URL JWKS",
      jwks_url_placeholder: "https://login.microsoftonline.com/tenant-id/discovery/v2.0/keys",
      jwks_url_description: "Endpoint HTTPS que sirve el JSON Web Key Set del proveedor",
      jwks_url_required: "La URL JWKS es obligatoria.",
      jwks_url_https: "La URL JWKS debe usar HTTPS.",
      audience_label: "Audiencia",
      audience_placeholder: "api://my-app-id",
      audience_description: "Claim(s) aud esperado(s) en el JWT, separados por comas.",
      user_claim_label: "Claim de usuario",
      user_claim_placeholder: "email",
      user_claim_description: "Claim JWT que contiene la dirección de correo del usuario",
      user_claim_required: "El claim de usuario es obligatorio.",
      allowed_algorithms_label: "Algoritmos de firma permitidos",
      allowed_algorithms_description: "Algoritmos asimétricos aceptados para la verificación de firma JWT",
      allowed_algorithms_required: "Se requiere al menos un algoritmo.",
      select_algorithms: "Seleccionar algoritmos",
      jwks_cache_ttl_label: "TTL de caché JWKS (segundos)",
      jwks_cache_ttl_description: "Tiempo de caché de las claves JWKS del proveedor (mínimo 60s, por defecto 24 horas)",
      jwks_cache_ttl_min: "El TTL de caché debe ser de al menos 60 segundos.",
      rate_limit_label: "Límite de velocidad",
      rate_limit_placeholder: "120/minute",
      rate_limit_description:
        "Limitación de solicitudes como cantidad/período (ej. 120/minute). Dejar vacío para el límite por defecto.",
      enable_provider: "Habilitar este proveedor",
      saving: "Guardando...",
      update: "Actualizar",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "Conecta y sincroniza tu organización de GitHub Enterprise con Plane.",
    app_form_title: "Configuración de GitHub Enterprise",
    app_form_description: "Configura GitHub Enterprise para conectarse con Plane.",
    app_id_title: "ID de la app",
    app_id_description: "El ID de la app que creaste en tu organización de GitHub Enterprise.",
    app_id_placeholder: 'e.g., "1234567890"',
    app_id_error: "App ID es requerido",
    app_name_title: "Slug de la app",
    app_name_description: "El slug de la app que creaste en tu organización de GitHub Enterprise.",
    app_name_error: "App slug es requerido",
    app_name_placeholder: 'e.g., "plane-github-enterprise"',
    base_url_title: "URL base",
    base_url_description: "La URL base de tu organización de GitHub Enterprise.",
    base_url_placeholder: 'e.g., "https://gh.plane.town"',
    base_url_error: "URL base es requerida",
    invalid_base_url_error: "URL base inválida",
    client_id_title: "ID del cliente",
    client_id_description: "El ID del cliente de la app que creaste en tu organización de GitHub Enterprise.",
    client_id_placeholder: 'e.g., "1234567890"',
    client_id_error: "ID del cliente es requerido",
    client_secret_title: "Secret del cliente",
    client_secret_description: "El secret del cliente de la app que creaste en tu organización de GitHub Enterprise.",
    client_secret_placeholder: 'e.g., "1234567890"',
    client_secret_error: "Secret del cliente es requerido",
    webhook_secret_title: "Secret del webhook",
    webhook_secret_description: "El secret del webhook de la app que creaste en tu organización de GitHub Enterprise.",
    webhook_secret_placeholder: 'e.g., "1234567890"',
    webhook_secret_error: "Secret del webhook es requerido",
    private_key_title: "Clave privada (Base64 codificado)",
    private_key_description: "Clave privada de la app que creaste en tu organización de GitHub Enterprise.",
    private_key_placeholder: 'e.g., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Clave privada es requerida",
    connect_app: "Conectar app",
  },
  file_upload: {
    upload_text: "Haz clic aquí para subir archivo",
    drag_drop_text: "Arrastrar y soltar",
    processing: "Procesando",
    invalid: "Tipo de archivo inválido",
    missing_fields: "Campos faltantes",
    success: "¡{fileName} subido!",
  },
  silo_errors: {
    invalid_query_params: "Los parámetros de consulta proporcionados son inválidos o faltan campos requeridos",
    invalid_installation_account: "La cuenta de instalación proporcionada no es válida",
    generic_error: "Ocurrió un error inesperado al procesar tu solicitud",
    connection_not_found: "No se pudo encontrar la conexión solicitada",
    multiple_connections_found: "Se encontraron múltiples conexiones cuando solo se esperaba una",
    installation_not_found: "No se pudo encontrar la instalación solicitada",
    user_not_found: "No se pudo encontrar el usuario solicitado",
    error_fetching_token: "Error al obtener el token de autenticación",
    cannot_create_multiple_connections:
      "Ya tienes una conexión con una organización. Por favor, desconecta la conexión existente antes de conectar una nueva.",
    invalid_app_credentials: "Las credenciales de la aplicación proporcionadas son inválidas",
    invalid_app_installation_id: "Error al instalar la aplicación",
  },
  import_status: {
    queued: "En cola",
    created: "Creado",
    initiated: "Iniciado",
    pulling: "Extrayendo",
    timed_out: "Tiempo agotado",
    pulled: "Extraído",
    transforming: "Transformando",
    transformed: "Transformado",
    pushing: "Enviando",
    finished: "Finalizado",
    error: "Error",
    cancelled: "Cancelado",
  },
  jira_importer: {
    jira_importer_description: "Importira tus datos de Jira a proyectos de Plane",
    create_project_automatically: "Crear proyecto automáticamente",
    create_project_automatically_description:
      "Crearemos un nuevo proyecto para ti basado en los detalles del proyecto de Jira.",
    import_to_existing_project: "Importar a un proyecto existente",
    import_to_existing_project_description: "Elige un proyecto existente del menú desplegable a continuación.",
    state_mapping_automatic_creation: "Todos los estados de Jira se crearán automáticamente en Plane.",
    personal_access_token: "Token de acceso personal",
    user_email: "Correo electrónico del usuario",
    atlassian_security_settings: "Configuración de seguridad de Atlassian",
    email_description: "Este es el correo electrónico vinculado a tu token de acceso personal",
    jira_domain: "Dominio de Jira",
    jira_domain_description: "Este es el dominio de tu instancia de Jira",
    steps: {
      title_configure_plane: "Configurar Plane",
      description_configure_plane:
        "Por favor, primero crea el proyecto en Plane donde deseas migrar tus datos de Jira. Una vez creado el proyecto, selecciónalo aquí.",
      title_configure_jira: "Configurar Jira",
      description_configure_jira:
        "Por favor, selecciona el espacio de trabajo de Jira desde el cual deseas migrar tus datos.",
      title_import_users: "Importar usuarios",
      description_import_users:
        "Por favor, agrega los usuarios que deseas migrar de Jira a Plane. Alternativamente, puedes omitir este paso y agregar usuarios manualmente más tarde.",
      title_map_states: "Mapear estados",
      description_map_states:
        "Hemos coincidido automáticamente los estados de Jira con los estados de Plane lo mejor posible. Por favor, mapea los estados restantes antes de continuar, también puedes crear estados y mapearlos manualmente.",
      title_map_priorities: "Mapear prioridades",
      description_map_priorities:
        "Hemos coincidido automáticamente las prioridades lo mejor posible. Por favor, mapea las prioridades restantes antes de continuar.",
      title_summary: "Resumen",
      description_summary: "Aquí hay un resumen de los datos que serán migrados de Jira a Plane.",
      custom_jql_filter: "Filtro JQL personalizado",
      jql_filter_description: "Use JQL para filtrar incidencias específicas para importar.",
      project_code: "PROYECTO",
      enter_filters_placeholder: "Ingrese filtros (ej. status = 'In Progress')",
      validating_query: "Validando consulta...",
      validation_successful_work_items_selected: "Validación exitosa, {count} elementos de trabajo seleccionados.",
      run_syntax_check: "Ejecutar comprobación de sintaxis para verificar su consulta",
      refresh: "Actualizar",
      check_syntax: "Comprobar sintaxis",
      no_work_items_selected: "La consulta no seleccionó ningún elemento de trabajo.",
      validation_error_default: "Algo salió mal al validar la consulta.",
    },
  },
  asana_importer: {
    asana_importer_description: "Importa tus datos de Asana a proyectos de Plane",
    select_asana_priority_field: "Seleccionar campo de prioridad de Asana",
    steps: {
      title_configure_plane: "Configurar Plane",
      description_configure_plane:
        "Por favor, primero crea el proyecto en Plane donde deseas migrar tus datos de Asana. Una vez creado el proyecto, selecciónalo aquí.",
      title_configure_asana: "Configurar Asana",
      description_configure_asana:
        "Por favor, selecciona el espacio de trabajo y proyecto de Asana desde el cual deseas migrar tus datos.",
      title_map_states: "Mapear estados",
      description_map_states:
        "Por favor, selecciona los estados de Asana que deseas mapear a los estados del proyecto de Plane",
      title_map_priorities: "Mapear prioridades",
      description_map_priorities:
        "Por favor, selecciona las prioridades de Asana que deseas mapear a las prioridades del proyecto de Plane",
      title_summary: "Resumen",
      description_summary: "Aquí hay un resumen de los datos que serán migrados de Asana a Plane.",
    },
  },
  linear_importer: {
    linear_importer_description: "Importa tus datos de Linear a proyectos de Plane",
    steps: {
      title_configure_plane: "Configurar Plane",
      description_configure_plane:
        "Por favor, primero crea el proyecto en Plane donde deseas migrar tus datos de Linear. Una vez creado el proyecto, selecciónalo aquí.",
      title_configure_linear: "Configurar Linear",
      description_configure_linear: "Por favor, selecciona el equipo de Linear desde el cual deseas migrar tus datos.",
      title_map_states: "Mapear estados",
      description_map_states:
        "Hemos coincidido automáticamente los estados de Linear con los estados de Plane lo mejor posible. Por favor, mapea los estados restantes antes de continuar, también puedes crear estados y mapearlos manualmente.",
      title_map_priorities: "Mapear prioridades",
      description_map_priorities:
        "Por favor, selecciona las prioridades de Linear que deseas mapear a las prioridades del proyecto de Plane",
      title_summary: "Resumen",
      description_summary: "Aquí hay un resumen de los datos que serán migrados de Linear a Plane.",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "Importa tus datos de Jira Server/Data Center a proyectos de Plane",
    steps: {
      title_configure_plane: "Configurar Plane",
      description_configure_plane:
        "Por favor, primero crea el proyecto en Plane donde deseas migrar tus datos de Jira. Una vez creado el proyecto, selecciónalo aquí.",
      title_configure_jira: "Configurar Jira",
      description_configure_jira:
        "Por favor, selecciona el espacio de trabajo de Jira desde el cual deseas migrar tus datos.",
      title_map_states: "Mapear estados",
      description_map_states:
        "Por favor, selecciona los estados de Jira que deseas mapear a los estados del proyecto de Plane",
      title_map_priorities: "Mapear prioridades",
      description_map_priorities:
        "Por favor, selecciona las prioridades de Jira que deseas mapear a las prioridades del proyecto de Plane",
      title_summary: "Resumen",
      description_summary: "Aquí hay un resumen de los datos que serán migrados de Jira a Plane.",
    },
    import_epics: {
      title: "Importar épicas como elementos de trabajo",
      description:
        "Con esto habilitado, tus épicas se importarán como un elemento de trabajo con el tipo de elemento de trabajo épica.",
    },
  },
  notion_importer: {
    notion_importer_description: "Importa tus datos de Notion a proyectos de Plane.",
    steps: {
      title_upload_zip: "Subir ZIP exportado de Notion",
      description_upload_zip: "Por favor, sube el archivo ZIP que contiene tus datos de Notion.",
    },
    upload: {
      drop_file_here: "Suelta tu archivo zip de Notion aquí",
      upload_title: "Subir exportación de Notion",
      upload_from_url: "Importar desde URL",
      upload_from_url_description: "Pega la URL pública de tu exportación ZIP para continuar.",
      drag_drop_description: "Arrastra y suelta tu archivo zip de exportación de Notion, o haz clic para navegar",
      file_type_restriction: "Solo se admiten archivos .zip exportados desde Notion",
      select_file: "Seleccionar archivo",
      uploading: "Subiendo...",
      preparing_upload: "Preparando subida...",
      confirming_upload: "Confirmando subida...",
      confirming: "Confirmando...",
      upload_complete: "Subida completada",
      upload_failed: "Fallo en la subida",
      start_import: "Iniciar importación",
      retry_upload: "Reintentar subida",
      upload: "Subir",
      ready: "Listo",
      error: "Error",
      upload_complete_message: "¡Subida completada!",
      upload_complete_description: 'Haz clic en "Iniciar importación" para comenzar a procesar tus datos de Notion.',
      upload_progress_message: "Por favor, no cierres esta ventana.",
    },
  },
  confluence_importer: {
    confluence_importer_description: "Importa tus datos de Confluence al wiki de Plane.",
    steps: {
      title_upload_zip: "Subir ZIP exportado de Confluence",
      description_upload_zip: "Por favor, sube el archivo ZIP que contiene tus datos de Confluence.",
    },
    upload: {
      drop_file_here: "Suelta tu archivo zip de Confluence aquí",
      upload_title: "Subir exportación de Confluence",
      upload_from_url: "Importar desde URL",
      upload_from_url_description: "Pega la URL pública de tu exportación ZIP para continuar.",
      drag_drop_description: "Arrastra y suelta tu archivo zip de exportación de Confluence, o haz clic para navegar",
      file_type_restriction: "Solo se admiten archivos .zip exportados desde Confluence",
      select_file: "Seleccionar archivo",
      uploading: "Subiendo...",
      preparing_upload: "Preparando subida...",
      confirming_upload: "Confirmando subida...",
      confirming: "Confirmando...",
      upload_complete: "Subida completada",
      upload_failed: "Fallo en la subida",
      start_import: "Iniciar importación",
      retry_upload: "Reintentar subida",
      upload: "Subir",
      ready: "Listo",
      error: "Error",
      upload_complete_message: "¡Subida completada!",
      upload_complete_description:
        'Haz clic en "Iniciar importación" para comenzar a procesar tus datos de Confluence.',
      upload_progress_message: "Por favor, no cierres esta ventana.",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "Importa tus datos CSV a proyectos de Plane",
    steps: {
      title_configure_plane: "Configurar Plane",
      description_configure_plane:
        "Por favor, primero crea el proyecto en Plane donde deseas migrar tus datos CSV. Una vez creado el proyecto, selecciónalo aquí.",
      title_configure_csv: "Configurar CSV",
      description_configure_csv:
        "Por favor, sube tu archivo CSV y configura los campos que se mapearán a los campos de Plane.",
    },
  },
  csv_importer: {
    csv_importer_description: "Importa elementos de trabajo desde archivos CSV a proyectos de Plane.",
    steps: {
      title_select_project: "Seleccionar proyecto",
      description_select_project:
        "Por favor, selecciona el proyecto de Plane donde deseas importar tus elementos de trabajo.",
      title_upload_csv: "Subir CSV",
      description_upload_csv:
        "Sube tu archivo CSV que contiene los elementos de trabajo. El archivo debe incluir columnas para nombre, descripción, prioridad, fechas y grupo de estado.",
    },
  },
  clickup_importer: {
    clickup_importer_description: "Importa tus datos de ClickUp a proyectos de Plane",
    select_service_space: "Seleccionar espacio de {serviceName}",
    select_service_folder: "Seleccionar carpeta de {serviceName}",
    selected: "Seleccionado",
    users: "Usuarios",
    steps: {
      title_configure_plane: "Configurar Plane",
      description_configure_plane:
        "Por favor, primero crea el proyecto en Plane donde deseas migrar tus datos de ClickUp. Una vez creado el proyecto, selecciónalo aquí.",
      title_configure_clickup: "Configurar ClickUp",
      description_configure_clickup:
        "Por favor, selecciona el equipo, espacio y carpeta de ClickUp desde el cual deseas migrar tus datos.",
      title_map_states: "Mapear estados",
      description_map_states:
        "Hemos coincidido automáticamente los estados de ClickUp con los estados de Plane lo mejor posible. Por favor, mapea los estados restantes antes de continuar, también puedes crear estados y mapearlos manualmente.",
      title_map_priorities: "Mapear prioridades",
      description_map_priorities:
        "Por favor, selecciona las prioridades de ClickUp que deseas mapear a las prioridades del proyecto de Plane.",
      title_summary: "Resumen",
      description_summary: "Aquí hay un resumen de los datos que serán migrados de ClickUp a Plane.",
      pull_additional_data_title: "Importar comentarios y archivos adjuntos",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "Barra",
          long_label: "Gráfico de barras",
          chart_models: {
            basic: "Básico",
            stacked: "Apilado",
            grouped: "Agrupado",
          },
          orientation: {
            label: "Orientación",
            horizontal: "Horizontal",
            vertical: "Vertical",
            placeholder: "Añadir orientación",
          },
          bar_color: "Color de barra",
        },
        line_chart: {
          short_label: "Línea",
          long_label: "Gráfico de líneas",
          chart_models: {
            basic: "Básico",
            multi_line: "Multi-línea",
          },
          line_color: "Color de línea",
          line_type: {
            label: "Tipo de línea",
            solid: "Sólida",
            dashed: "Discontinua",
            placeholder: "Añadir tipo de línea",
          },
        },
        area_chart: {
          short_label: "Área",
          long_label: "Gráfico de área",
          chart_models: {
            basic: "Básico",
            stacked: "Apilado",
            comparison: "Comparación",
          },
          fill_color: "Color de relleno",
        },
        donut_chart: {
          short_label: "Dona",
          long_label: "Gráfico de dona",
          chart_models: {
            basic: "Básico",
            progress: "Progreso",
          },
          center_value: "Valor central",
          completed_color: "Color de completado",
        },
        pie_chart: {
          short_label: "Circular",
          long_label: "Gráfico circular",
          chart_models: {
            basic: "Básico",
          },
          group: {
            label: "Piezas agrupadas",
            group_thin_pieces: "Agrupar piezas delgadas",
            minimum_threshold: {
              label: "Umbral mínimo",
              placeholder: "Añadir umbral",
            },
            name_group: {
              label: "Nombre del grupo",
              placeholder: '"Menos del 5%"',
            },
          },
          show_values: "Mostrar valores",
          value_type: {
            percentage: "Porcentaje",
            count: "Conteo",
          },
        },
        text: {
          short_label: "Texto",
          long_label: "Texto",
          alignment: {
            label: "Alineación de texto",
            left: "Izquierda",
            center: "Centro",
            right: "Derecha",
            placeholder: "Añadir alineación de texto",
          },
          text_color: "Color de texto",
        },
        table_chart: {
          short_label: "Tabla",
          long_label: "Gráfico de tabla",
          chart_models: {
            basic: {
              short_label: "Básico",
              long_label: "Tabla",
            },
          },
          columns: "Columnas",
          rows: "Filas",
          rows_placeholder: "Añadir filas",
          configure_rows_hint: "Seleccione una propiedad para las filas para ver esta tabla.",
        },
      },
      color_palettes: {
        modern: "Moderno",
        horizon: "Horizonte",
        earthen: "Terroso",
      },
      common: {
        add_widget: "Añadir widget",
        widget_title: {
          label: "Nombre de este widget",
          placeholder: 'p.ej., "Por hacer ayer", "Todos Completados"',
        },
        chart_type: "Tipo de gráfico",
        visualization_type: {
          label: "Tipo de visualización",
          placeholder: "Añadir tipo de visualización",
        },
        date_group: {
          label: "Grupo de fecha",
          placeholder: "Añadir grupo de fecha",
        },
        group_by: "Agrupar por",
        stack_by: "Apilar por",
        daily: "Diario",
        weekly: "Semanal",
        monthly: "Mensual",
        yearly: "Anual",
        work_item_count: "Conteo de elementos de trabajo",
        estimate_point: "Punto estimado",
        pending_work_item: "Elementos de trabajo pendientes",
        completed_work_item: "Elementos de trabajo completados",
        in_progress_work_item: "Elementos de trabajo en progreso",
        blocked_work_item: "Elementos de trabajo bloqueados",
        work_item_due_this_week: "Elementos de trabajo que vencen esta semana",
        work_item_due_today: "Elementos de trabajo que vencen hoy",
        color_scheme: {
          label: "Esquema de color",
          placeholder: "Añadir esquema de color",
        },
        smoothing: "Suavizado",
        markers: "Marcadores",
        legends: "Leyendas",
        tooltips: "Tooltips",
        opacity: {
          label: "Opacidad",
          placeholder: "Añadir opacidad",
        },
        border: "Borde",
        widget_configuration: "Configuración del widget",
        configure_widget: "Configurar widget",
        guides: "Guías",
        style: "Estilo",
        area_appearance: "Apariencia del área",
        comparison_line_appearance: "Apariencia de línea de comparación",
        add_property: "Añadir propiedad",
        add_metric: "Añadir métrica",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "Al eje X le falta un valor.",
            y_axis_metric: "A la métrica le falta un valor.",
          },
          stacked: {
            x_axis_property: "Al eje X le falta un valor.",
            y_axis_metric: "A la métrica le falta un valor.",
            group_by: "A Apilar por le falta un valor.",
          },
          grouped: {
            x_axis_property: "Al eje X le falta un valor.",
            y_axis_metric: "A la métrica le falta un valor.",
            group_by: "A Agrupar por le falta un valor.",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "Al eje X le falta un valor.",
            y_axis_metric: "A la métrica le falta un valor.",
          },
          multi_line: {
            x_axis_property: "Al eje X le falta un valor.",
            y_axis_metric: "A la métrica le falta un valor.",
            group_by: "A Agrupar por le falta un valor.",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "Al eje X le falta un valor.",
            y_axis_metric: "A la métrica le falta un valor.",
          },
          stacked: {
            x_axis_property: "Al eje X le falta un valor.",
            y_axis_metric: "A la métrica le falta un valor.",
            group_by: "A Apilar por le falta un valor.",
          },
          comparison: {
            x_axis_property: "Al eje X le falta un valor.",
            y_axis_metric: "A la métrica le falta un valor.",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "Al eje X le falta un valor.",
            y_axis_metric: "A la métrica le falta un valor.",
          },
          progress: {
            y_axis_metric: "A la métrica le falta un valor.",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "Al eje X le falta un valor.",
            y_axis_metric: "A la métrica le falta un valor.",
          },
        },
        text: {
          basic: {
            y_axis_metric: "A la métrica le falta un valor.",
          },
        },
        table_chart: {
          basic: {
            x_axis_property: "A las columnas les falta un valor.",
            group_by: "A las filas les falta un valor.",
          },
        },
        ask_admin: "Solicite a su administrador que configure este widget.",
      },
    },
    create_modal: {
      heading: {
        create: "Crear nuevo dashboard",
        update: "Actualizar dashboard",
      },
      title: {
        label: "Nombre su dashboard.",
        placeholder: '"Capacidad entre proyectos", "Carga de trabajo por equipo", "Estado en todos los proyectos"',
        required_error: "El título es obligatorio",
      },
      project: {
        label: "Elegir proyectos",
        placeholder: "Los datos de estos proyectos alimentarán este dashboard.",
        required_error: "Los proyectos son obligatorios",
      },
      filters_label: "Configura filtros para las fuentes de datos anteriores",
      create_dashboard: "Crear dashboard",
      update_dashboard: "Actualizar dashboard",
    },
    delete_modal: {
      heading: "Eliminar dashboard",
    },
    empty_state: {
      feature_flag: {
        title: "Presente su progreso en dashboards bajo demanda y permanentes.",
        description:
          "Construya cualquier dashboard que necesite y personalice cómo se ven sus datos para una presentación perfecta de su progreso.",
        coming_soon_to_mobile: "Próximamente en la aplicación móvil",
        card_1: {
          title: "Para todos sus proyectos",
          description:
            "Obtenga una visión completa de su espacio de trabajo con todos sus proyectos o filtre sus datos de trabajo para esa vista perfecta de su progreso.",
        },
        card_2: {
          title: "Para cualquier dato en Plane",
          description:
            "Vaya más allá de la Analítica predeterminada y los gráficos de Ciclo prediseñados para ver equipos, iniciativas o cualquier otra cosa como nunca antes.",
        },
        card_3: {
          title: "Para todas sus necesidades de visualización de datos",
          description:
            "Elija entre varios gráficos personalizables con controles detallados para ver y mostrar sus datos de trabajo exactamente como desee.",
        },
        card_4: {
          title: "Bajo demanda y permanentes",
          description:
            "Construya una vez, mantenga para siempre con actualizaciones automáticas de sus datos, indicadores contextuales para cambios de alcance y enlaces permanentes compartibles.",
        },
        card_5: {
          title: "Exportaciones y comunicaciones programadas",
          description:
            "Para esos momentos en que los enlaces no funcionan, exporte sus dashboards a PDFs puntuales o programe su envío automático a las partes interesadas.",
        },
        card_6: {
          title: "Diseño automático para todos los dispositivos",
          description:
            "Cambie el tamaño de sus widgets para el diseño que desee y véalo exactamente igual en dispositivos móviles, tabletas y otros navegadores.",
        },
      },
      dashboards_list: {
        title: "Visualice datos en widgets, construya sus dashboards con widgets y vea lo último bajo demanda.",
        description:
          "Construya sus dashboards con Widgets Personalizados que muestran sus datos en el alcance que especifique. Obtenga dashboards para todo su trabajo a través de proyectos y equipos y comparta enlaces permanentes con las partes interesadas para seguimiento bajo demanda.",
      },
      dashboards_search: {
        title: "Eso no coincide con el nombre de un dashboard.",
        description: "Asegúrese de que su consulta sea correcta o intente otra consulta.",
      },
      widgets_list: {
        title: "Visualice sus datos como desee.",
        description:
          "Use líneas, barras, gráficos circulares y otros formatos para ver sus datos de la manera que desee desde las fuentes que especifique.",
      },
      widget_data: {
        title: "Nada que ver aquí",
        description: "Actualice o agregue datos para verlos aquí.",
      },
    },
    common: {
      editing: "Editando",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "Permitir nuevos elementos de trabajo",
      work_item_creation_disable_tooltip: "La creación de elementos de trabajo está deshabilitada para este estado",
      default_state:
        "El estado predeterminado permite que todos los miembros creen nuevos elementos de trabajo. Esto no se puede cambiar",
      state_change_count:
        "{count, plural, one {1 cambio de estado permitido} other {{count} cambios de estado permitidos}}",
      movers_count: "{count, plural, one {1 revisor listado} other {{count} revisores listados}}",
      state_changes: {
        label: {
          default: "Agregar cambio de estado permitido",
          loading: "Agregando cambio de estado permitido",
        },
        move_to: "Cambiar estado a",
        movers: {
          label: "Cuando se revisa por",
          tooltip:
            "Los revisores son personas que están permitidas para mover elementos de trabajo de un estado a otro.",
          add: "Agregar revisores",
        },
      },
    },
    workflow_disabled: {
      title: "No puedes mover este elemento de trabajo aquí.",
    },
    workflow_enabled: {
      label: "Cambio de estado",
    },
    workflow_tree: {
      label: "Para elementos de trabajo en",
      state_change_label: "pueden moverlo a",
    },
    empty_state: {
      upgrade: {
        title: "Controla el caos de los cambios y revisiones con Workflows.",
        description: "Establece reglas para dónde se mueve tu trabajo, quién y cuándo con Workflows en Plane.",
      },
    },
    quick_actions: {
      view_change_history: "Ver historial de cambios",
      reset_workflow: "Restablecer flujo de trabajo",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "¿Estás seguro de que deseas restablecer este flujo de trabajo?",
        description:
          "Si restableces este flujo de trabajo, todas tus reglas de cambio de estado serán eliminadas y tendrás que crearlas de nuevo para que funcionen en este proyecto.",
      },
      delete_state_change: {
        title: "¿Estás seguro de que deseas eliminar esta regla de cambio de estado?",
        description:
          "Una vez eliminada, no podrás deshacer este cambio y tendrás que establecer la regla de nuevo si la deseas para este proyecto.",
      },
    },
    toasts: {
      enable_disable: {
        loading: "{action} flujo de trabajo",
        success: {
          title: "Éxito",
          message: "Flujo de trabajo {action} con éxito",
        },
        error: {
          title: "Error",
          message: "El flujo de trabajo no pudo ser {action}. Por favor, inténtalo de nuevo.",
        },
      },
      reset: {
        success: {
          title: "Éxito",
          message: "El flujo de trabajo se restableció con éxito",
        },
        error: {
          title: "Error al restablecer flujo de trabajo",
          message: "El flujo de trabajo no pudo ser restablecido. Por favor, inténtalo de nuevo.",
        },
      },
      add_state_change_rule: {
        error: {
          title: "Error al agregar regla de cambio de estado",
          message: "La regla de cambio de estado no pudo ser agregada. Por favor, inténtalo de nuevo.",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "Error al modificar regla de cambio de estado",
          message: "La regla de cambio de estado no pudo ser modificada. Por favor, inténtalo de nuevo.",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "Error al eliminar regla de cambio de estado",
          message: "La regla de cambio de estado no pudo ser eliminada. Por favor, inténtalo de nuevo.",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "Error al modificar revisores de regla de cambio de estado",
          message:
            "Los revisores de la regla de cambio de estado no pudieron ser modificados. Por favor, inténtalo de nuevo.",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {Cliente} other {Clientes}}",
    drop_down: {
      placeholder: "Seleccionar cliente",
      required: "Por favor seleccione un cliente",
      no_selection: "Sin clientes",
    },
    upgrade: {
      title: "Prioriza y gestiona el trabajo con los clientes.",
      description: "Asocia tu trabajo con los clientes y prioriza según sus atributos.",
    },
    properties: {
      default: {
        title: "Predeterminado",
        customer_name: {
          name: "Nombre del cliente",
          placeholder: "Puede ser un nombre personal o de empresa",
          validation: {
            required: "El nombre del cliente es obligatorio.",
            max_length: "El nombre del cliente no puede tener más de 255 caracteres.",
          },
        },
        description: {
          name: "Descripción",
          validation: {},
        },
        email: {
          name: "Correo electrónico",
          placeholder: "Ingrese su correo electrónico",
          validation: {
            required: "El correo electrónico es obligatorio.",
            pattern: "El formato del correo electrónico es incorrecto.",
          },
        },
        website_url: {
          name: "Sitio web",
          placeholder: "Cualquier URL que comience con https:// es válida.",
          placeholder_short: "Agregar sitio web",
          validation: {
            pattern: "URL del sitio web no válida",
          },
        },
        employees: {
          name: "Empleados",
          placeholder: "Si el cliente es una empresa, ingrese el número de empleados.",
          validation: {
            min_length: "El número de empleados no puede ser menor que 0.",
            max_length: "El número de empleados no puede ser mayor que 2147483647.",
          },
        },
        size: {
          name: "Tamaño",
          placeholder: "Agregar tamaño de la empresa",
          validation: {
            min_length: "Tamaño no válido",
          },
        },
        domain: {
          domain: "Industria",
          placeholder: "Retail, e-Commerce, Fintech, Banca",
          placeholder_short: "Agregar industria",
          validation: {},
        },
        stage: {
          name: "Etapa",
          placeholder: "Seleccionar etapa",
          validation: {},
        },
        contract_status: {
          name: "Estado del contrato",
          placeholder: "Seleccionar estado del contrato",
          validation: {},
        },
        revenue: {
          name: "Ingresos",
          placeholder: "Este es el ingreso anual del cliente.",
          placeholder_short: "Agregar ingresos",
          validation: {
            min_length: "Los ingresos no pueden ser menores que 0.",
          },
        },
        invalid_value: "Valor de propiedad no válido.",
      },
      custom: {
        title: "Propiedades personalizadas",
        info: "Agrega los atributos únicos de tus clientes a Plane para gestionar mejor los elementos de trabajo o los registros de clientes.",
      },
      empty_state: {
        title: "Agregar propiedades personalizadas",
        description:
          "Las propiedades personalizadas que deseas que coincidan manual o automáticamente con tu CRM aparecerán aquí.",
      },
      add: {
        primary_button: "Agregar nueva propiedad",
      },
    },
    stage: {
      lead: "Prospecto",
      sales_qualified_lead: "Prospecto calificado para ventas",
      contract_negotiation: "Negociación de contrato",
      closed_won: "Cerrado, ganado",
      closed_lost: "Cerrado, perdido",
    },
    contract_status: {
      active: "Activo",
      pre_contract: "Precontrato",
      signed: "Firmado",
      inactive: "Inactivo",
    },
    empty_state: {
      detail: {
        title: "No se encontraron registros de clientes.",
        description: "El enlace de este registro podría no ser válido o haber sido eliminado.",
        primary_button: "Ir al cliente",
        secondary_button: "Agregar cliente",
      },
      search: {
        title: "Parece que no tienes registros de clientes que coincidan con ese término.",
        description:
          "Prueba con otro término de búsqueda o contáctanos si estás seguro de que deberías ver resultados para ese término.",
      },
      list: {
        title:
          "Gestiona el volumen, la velocidad y el flujo de clientes según la importancia de los mismos en tu trabajo.",
        description:
          "Con la función 'Clientes' de Plane, puedes crear un nuevo cliente desde cero y asociarlo a tu trabajo. Posteriormente podrás importarlos junto con sus propiedades personalizadas a otras herramientas.",
        primary_button: "Agregar primer cliente",
      },
    },
    settings: {
      unauthorized: "No tienes permisos para acceder a esta página.",
      description: "Realiza un seguimiento y gestiona la relación con tus clientes en tu flujo de trabajo.",
      enable: "Habilitar clientes",
      toasts: {
        enable: {
          loading: "Habilitando la función de clientes...",
          success: {
            title: "La función de clientes ha sido habilitada para este espacio de trabajo.",
            message:
              "I membri possono ora aggiungere record clienti, collegarli agli elementi di lavoro e altro ancora.",
          },
          error: {
            title: "No se puede habilitar la función de clientes.",
            message: "Inténtalo de nuevo o vuelve más tarde. Si el problema persiste, contacta con el soporte.",
          },
        },
        disable: {
          loading: "Deshabilitando la función de clientes...",
          success: {
            title: "Los clientes han sido deshabilitados",
            message: "La función de clientes se ha deshabilitado correctamente.",
          },
          error: {
            title: "Error",
            message: "No se puede deshabilitar la función de clientes.",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "No se pudo obtener la lista de clientes.",
          message: "Intenta recargar la página o vuelve más tarde.",
        },
      },
      copy_link: {
        title: "Has copiado el enlace directo del cliente.",
        message: "Pégalo en cualquier lugar, y te llevará directamente a esta página.",
      },
      create: {
        success: {
          title: "{customer_name} ahora está disponible",
          message:
            "Puedes referenciar este cliente en tus elementos de trabajo y realizar un seguimiento de sus solicitudes.",
          actions: {
            view: "Ver",
            copy_link: "Copiar enlace",
            copied: "¡Copiado!",
          },
        },
        error: {
          title: "No se pudo crear este registro.",
          message:
            "Guarda nuevamente o copia el texto no guardado a un nuevo registro, preferentemente en otra pestaña.",
        },
      },
      update: {
        success: {
          title: "¡Éxito!",
          message: "El cliente se actualizó correctamente.",
        },
        error: {
          title: "¡Error!",
          message: "No se pudo actualizar el cliente. ¡Intenta nuevamente!",
        },
      },
      logo: {
        error: {
          title: "No se pudo cargar el logo del cliente.",
          message: "Guarda el logo nuevamente o comienza desde cero.",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "Has eliminado el elemento de trabajo de este cliente.",
            message: "También hemos eliminado automáticamente a este cliente de los elementos de trabajo.",
          },
          error: {
            title: "¡Error!",
            message: "No se pudo eliminar el elemento de trabajo del registro de este cliente.",
          },
        },
        add: {
          error: {
            title: "No se pudo agregar este elemento de trabajo al cliente.",
            message: "Intenta nuevamente, o vuelve más tarde. Si el error persiste, contacta con soporte.",
          },
          success: {
            title: "Has agregado el elemento de trabajo al cliente.",
            message: "También hemos agregado automáticamente a este cliente a los elementos de trabajo.",
          },
        },
      },
    },
    quick_actions: {
      edit: "Editar",
      copy_link: "Copiar enlace del cliente",
      delete: "Eliminar",
    },
    create: {
      label: "Crear registro de cliente",
      loading: "Creando",
      cancel: "Cancelar",
    },
    update: {
      label: "Actualizar cliente",
      loading: "Actualizando",
    },
    delete: {
      title: "¿Estás seguro de que deseas eliminar el registro del cliente {customer_name}?",
      description:
        "Todos los datos asociados con este registro se eliminarán de forma permanente. No podrás restaurar este registro más tarde.",
    },
    requests: {
      empty_state: {
        list: {
          title: "Actualmente no hay solicitudes que mostrar.",
          description: "Crea una solicitud desde tu cliente y asócialo a tus elementos de trabajo.",
          button: "Agregar nueva solicitud",
        },
        search: {
          title: "Parece que no tienes solicitudes que coincidan con ese término.",
          description:
            "Prueba con otro término de búsqueda o contáctanos si estás seguro de que deberías ver resultados para ese término.",
        },
      },
      label: "{count, plural, one {Solicitud} other {Solicitudes}}",
      add: "Agregar solicitud",
      create: "Crear solicitud",
      update: "Actualizar solicitud",
      form: {
        name: {
          placeholder: "Ponle un nombre a esta solicitud",
          validation: {
            required: "El nombre es obligatorio.",
            max_length: "El nombre de la solicitud no puede tener más de 255 caracteres.",
          },
        },
        description: {
          placeholder: "Describe la solicitud o pega los comentarios del cliente desde otras herramientas.",
        },
        source: {
          add: "Agregar fuente",
          update: "Actualizar fuente",
          url: {
            label: "URL",
            required: "La URL es obligatoria",
            invalid: "URL no válida",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "Enlace copiado",
          message: "El enlace de la solicitud del cliente ha sido copiado al portapapeles.",
        },
        attachment: {
          upload: {
            loading: "Subiendo archivo adjunto...",
            success: {
              title: "Archivo adjunto cargado",
              message: "El archivo adjunto se cargó correctamente.",
            },
            error: {
              title: "Error al cargar archivo adjunto",
              message: "No se pudo cargar el archivo adjunto.",
            },
          },
          size: {
            error: {
              title: "¡Error!",
              message: "Solo puedes cargar un archivo a la vez.",
            },
          },
          length: {
            message: "El tamaño del archivo debe ser menor a {size} MB",
          },
          remove: {
            success: {
              title: "Archivo adjunto eliminado",
              message: "El archivo adjunto fue eliminado correctamente.",
            },
            error: {
              title: "No se pudo eliminar el archivo adjunto",
              message: "No se pudo eliminar el archivo adjunto.",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "¡Éxito!",
              message: "La fuente se actualizó correctamente.",
            },
            error: {
              title: "¡Error!",
              message: "No se pudo actualizar la fuente.",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "¡Error!",
              message: "No se pudo agregar el elemento de trabajo a la solicitud. Intenta nuevamente.",
            },
            success: {
              title: "¡Éxito!",
              message: "El elemento de trabajo fue agregado a la solicitud.",
            },
          },
        },
        update: {
          success: {
            message: "¡Solicitud actualizada con éxito!",
            title: "¡Éxito!",
          },
          error: {
            title: "¡Error!",
            message: "No se pudo actualizar la solicitud. ¡Intenta nuevamente!",
          },
        },
        create: {
          success: {
            message: "¡Solicitud creada con éxito!",
            title: "¡Éxito!",
          },
          error: {
            title: "¡Error!",
            message: "No se pudo crear la solicitud. ¡Intenta nuevamente!",
          },
        },
      },
    },
    linked_work_items: {
      label: "Elementos de trabajo vinculados",
      link: "Vincular elementos de trabajo",
      empty_state: {
        list: {
          title: "Parece que aún no has vinculado ningún elemento de trabajo a este cliente.",
          description:
            "Vincula elementos de trabajo existentes desde cualquier proyecto aquí para realizar un seguimiento de este cliente.",
          button: "Vincular elementos de trabajo",
        },
      },
      action: {
        remove_epic: "Eliminar épica",
        remove: "Eliminar elemento de trabajo",
      },
    },
    sidebar: {
      properties: "Propiedades",
    },
  },
  templates: {
    settings: {
      title: "Plantillas",
      description:
        "Ahorra un 80% del tiempo dedicado a crear proyectos, elementos de trabajo y páginas cuando utilizas plantillas.",
      options: {
        project: {
          label: "Plantillas de proyecto",
        },
        work_item: {
          label: "Plantillas de elementos de trabajo",
        },
        page: {
          label: "Plantillas de página",
        },
      },
      create_template: {
        label: "Crear plantilla",
        no_permission: {
          project: "Contacta con el administrador de tu proyecto para crear plantillas",
          workspace: "Contacta con el administrador de tu espacio de trabajo para crear plantillas",
        },
      },
      use_template: {
        button: {
          default: "Usar plantilla",
          loading: "Usando",
        },
      },
      template_source: {
        workspace: {
          info: "Derivado del espacio de trabajo",
        },
        project: {
          info: "Derivado del proyecto",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "Nombra tu plantilla de proyecto.",
              validation: {
                required: "El nombre de la plantilla es obligatorio",
                maxLength: "El nombre de la plantilla debe tener menos de 255 caracteres",
              },
            },
            description: {
              placeholder: "Describe cuándo y cómo utilizar esta plantilla.",
            },
          },
          name: {
            placeholder: "Nombra tu proyecto.",
            validation: {
              required: "El título del proyecto es obligatorio",
              maxLength: "El título del proyecto debe tener menos de 255 caracteres",
            },
          },
          description: {
            placeholder: "Describe el propósito y los objetivos de este proyecto.",
          },
          button: {
            create: "Crear plantilla de proyecto",
            update: "Actualizar plantilla de proyecto",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "Nombra tu plantilla de elemento de trabajo.",
              validation: {
                required: "El nombre de la plantilla es obligatorio",
                maxLength: "El nombre de la plantilla debe tener menos de 255 caracteres",
              },
            },
            description: {
              placeholder: "Describe cuándo y cómo utilizar esta plantilla.",
            },
          },
          name: {
            placeholder: "Dale un título a este elemento de trabajo.",
            validation: {
              required: "El título del elemento de trabajo es obligatorio",
              maxLength: "El título del elemento de trabajo debe tener menos de 255 caracteres",
            },
          },
          description: {
            placeholder:
              "Describe este elemento de trabajo para que quede claro lo que conseguirás cuando lo completes.",
          },
          button: {
            create: "Crear plantilla de elemento de trabajo",
            update: "Actualizar plantilla de elemento de trabajo",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "Nombra tu plantilla de página.",
              validation: {
                required: "El nombre de la plantilla es obligatorio",
                maxLength: "El nombre de la plantilla debe tener menos de 255 caracteres",
              },
            },
            description: {
              placeholder: "Describe cuándo y cómo utilizar esta plantilla.",
            },
          },
          name: {
            placeholder: "Página sin título",
            validation: {
              maxLength: "El nombre de la página debe tener menos de 255 caracteres",
            },
          },
          button: {
            create: "Crear plantilla de página",
            update: "Actualizar plantilla de página",
          },
        },
        publish: {
          action: "{isPublished, select, true {Configuración de publicación} other {Publicar en el Marketplace}}",
          unpublish_action: "Retirar del Marketplace",
          title: "Haga que su plantilla sea descubrible y reconocible.",
          name: {
            label: "Nombre de la plantilla",
            placeholder: "Nombra tu plantilla",
            validation: {
              required: "El nombre de la plantilla es obligatorio",
              maxLength: "El nombre de la plantilla debe tener menos de 255 caracteres",
            },
          },
          short_description: {
            label: "Descripción corta",
            placeholder:
              "Esta plantilla es ideal para los Project Managers que gestionan varios proyectos al mismo tiempo.",
            validation: {
              required: "La descripción corta es obligatoria",
            },
          },
          description: {
            label: "Descripción",
            placeholder: `Mejora la productividad y simplifica la comunicación con nuestra integración de reconocimiento de voz.
• Transcripción en tiempo real: Convierte palabras habladas en texto preciso instantáneamente.
• Creación de tareas y comentarios: Añade tareas, descripciones y comentarios a través de comandos de voz.`,
            validation: {
              required: "La descripción es obligatoria",
            },
          },
          category: {
            label: "Categoría",
            placeholder: "Elige dónde crees que esta plantilla se adapte mejor. Puedes elegir más de una.",
            validation: {
              required: "Al menos una categoría es obligatoria",
            },
          },
          keywords: {
            label: "Palabras clave",
            placeholder: "Usa términos que creas que tus usuarios buscarán cuando estén buscando esta plantilla.",
            helperText:
              "Introduce palabras clave separadas por comas que sean útiles para que los usuarios encuentren esta plantilla en la búsqueda.",
            validation: {
              required: "Al menos una palabra clave es obligatoria",
            },
          },
          company_name: {
            label: "Nombre de la empresa",
            placeholder: "Plane",
            validation: {
              required: "El nombre de la empresa es obligatorio",
              maxLength: "El nombre de la empresa debe tener menos de 255 caracteres",
            },
          },
          contact_email: {
            label: "Correo electrónico de soporte",
            placeholder: "help@plane.so",
            validation: {
              invalid: "Dirección de correo electrónico no válida",
              required: "El correo electrónico de soporte es obligatorio",
              maxLength: "El correo electrónico de soporte debe tener menos de 255 caracteres",
            },
          },
          privacy_policy_url: {
            label: "Enlace a tu política de privacidad",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "URL no válida",
              maxLength: "La URL debe tener menos de 800 caracteres",
            },
          },
          terms_of_service_url: {
            label: "Enlace a tus términos de uso",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "URL no válida",
              maxLength: "La URL debe tener menos de 800 caracteres",
            },
          },
          cover_image: {
            label: "Añade una imagen de portada que se mostrará en el Marketplace",
            upload_title: "Subir imagen de portada",
            upload_placeholder: "Haz clic para subir o arrastra y suelta para subir una imagen de portada",
            drop_here: "Soltar aquí",
            click_to_upload: "Haz clic para subir",
            invalid_file_or_exceeds_size_limit:
              "Archivo no válido o excede el límite de tamaño. Por favor, inténtalo de nuevo.",
            upload_and_save: "Subir y guardar",
            uploading: "Subiendo",
            remove: "Eliminar",
            removing: "Eliminando",
            validation: {
              required: "La imagen de portada es obligatoria",
            },
          },
          attach_screenshots: {
            label:
              "Incluye documentos y capturas de pantalla que creas que harán que los usuarios de esta plantilla vean lo que puedes hacer con ella.",
            validation: {
              required: "Al menos una captura de pantalla es obligatoria",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "Plantillas",
        description:
          "Con las plantillas de proyectos, elementos de trabajo y páginas en Plane, no tienes que crear un proyecto desde cero ni configurar manualmente las propiedades de los elementos de trabajo.",
        sub_description: "Recupera el 80% de tu tiempo de administración cuando utilizas Plantillas.",
      },
      no_templates: {
        button: "Crea tu primera plantilla",
      },
      no_labels: {
        description:
          " Aún no hay etiquetas. Crea etiquetas para ayudar a organizar y filtrar elementos de trabajo en tu proyecto.",
      },
      no_work_items: {
        description: "Aún no hay elementos de trabajo. Añade uno para estructurar tu trabajo mejor.",
      },
      no_sub_work_items: {
        description: "No hay sub-elementos de trabajo aún. Añade uno para estructurar tu trabajo mejor.",
      },
      page: {
        no_templates: {
          title: "No hay plantillas a las que tengas acceso.",
          description: "Por favor, crea una plantilla",
        },
        no_results: {
          title: "Eso no coincide con ninguna plantilla.",
          description: "Intenta buscar con otros términos.",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "Plantilla creada",
          message: "{templateName}, la plantilla de {templateType}, ya está disponible para tu espacio de trabajo.",
        },
        error: {
          title: "No pudimos crear esa plantilla esta vez.",
          message:
            "Intenta guardar tus detalles de nuevo o cópialos a una nueva plantilla, preferiblemente en otra pestaña.",
        },
      },
      update: {
        success: {
          title: "Plantilla modificada",
          message: "{templateName}, la plantilla de {templateType}, ha sido modificada.",
        },
        error: {
          title: "No pudimos guardar los cambios en esta plantilla.",
          message:
            "Intenta guardar tus detalles de nuevo o vuelve a esta plantilla más tarde. Si sigues teniendo problemas, contacta con nosotros.",
        },
      },
      delete: {
        success: {
          title: "Plantilla eliminada",
          message: "{templateName}, la plantilla de {templateType}, ha sido eliminada de tu espacio de trabajo.",
        },
        error: {
          title: "No pudimos eliminar esa plantilla esta vez.",
          message:
            "Intenta eliminarla de nuevo o vuelve a intentarlo más tarde. Si no puedes eliminarla entonces, contacta con nosotros.",
        },
      },
      unpublish: {
        success: {
          title: "Plantilla retirada",
          message: "{templateName}, la plantilla de {templateType}, ha sido retirada.",
        },
        error: {
          title: "No pudimos retirar esa plantilla esta vez.",
          message:
            "Intenta retirarla de nuevo o vuelve a intentarlo más tarde. Si no puedes retirarla entonces, contacta con nosotros.",
        },
      },
    },
    delete_confirmation: {
      title: "Eliminar plantilla",
      description: {
        prefix: "¿Estás seguro de que quieres eliminar la plantilla-",
        suffix:
          "? Todos los datos relacionados con la plantilla se eliminarán permanentemente. Esta acción no se puede deshacer.",
      },
    },
    unpublish_confirmation: {
      title: "Retirar plantilla",
      description: {
        prefix: "¿Estás seguro de que quieres retirar la plantilla-",
        suffix: "? Esta plantilla ya no estará disponible para los usuarios en el marketplace.",
      },
    },
    dropdown: {
      add: {
        work_item: "Agregar nueva plantilla",
        project: "Agregar nueva plantilla",
      },
      label: {
        project: "Seleccionar una plantilla de proyecto",
        page: "Elegir desde plantilla",
      },
      tooltip: {
        work_item: "Seleccionar una plantilla de elemento de trabajo",
      },
      no_results: {
        work_item: "No se encontraron plantillas.",
        project: "No se encontraron plantillas.",
      },
    },
  },
  intake_forms: {
    create: {
      title: "Crear un elemento de trabajo",
      "sub-title": "Haz saber al equipo en qué te gustaría que trabajen.",
      name: "Nombre",
      email: "Correo electrónico",
      about: "¿De qué trata este elemento de trabajo?",
      description: "Describe qué debería ocurrir",
      description_placeholder:
        "Añade todos los detalles que quieras para ayudar al equipo a identificar tu situación y necesidades.",
      loading: "Creando",
      create_work_item: "Crear elemento de trabajo",
      errors: {
        name: "El nombre es obligatorio",
        name_max_length: "El nombre debe tener menos de 255 caracteres",
        email: "El correo electrónico es obligatorio",
        email_invalid: "Dirección de correo no válida",
        title: "El título es obligatorio",
        title_max_length: "El título debe tener menos de 255 caracteres",
      },
    },
    success: {
      title: "¡Genial! Tu elemento de trabajo ya está en la cola del equipo.",
      description: "El equipo puede aprobar o descartar este elemento de trabajo desde su cola de entrada.",
      primary_button: {
        text: "Añadir otro elemento de trabajo",
      },
      secondary_button: {
        text: "Saber más sobre Entrada",
      },
    },
    how_it_works: {
      title: "¿Cómo funciona?",
      heading: "Este es un formulario de Entrada.",
      description:
        "Entrada es una función de Plane que permite a los administradores y gestores de proyecto recibir elementos de trabajo externos en sus proyectos.",
      steps: {
        step_1: "Este breve formulario te permite crear un nuevo elemento de trabajo en un proyecto de Plane.",
        step_2: "Al enviar este formulario, se crea un nuevo elemento de trabajo en la Entrada de ese proyecto.",
        step_3: "Alguien de ese proyecto o equipo lo revisará.",
        step_4: "Si lo aprueban, el elemento pasará a la cola de trabajo del proyecto. Si no, se rechazará.",
        step_5:
          "Para consultar el estado de ese elemento, contacta con el gestor del proyecto, el administrador o quien te envió el enlace a esta página.",
      },
    },
    type_forms: {
      select_types: {
        title: "Seleccionar tipo de elemento de trabajo",
        search_placeholder: "Buscar un tipo de elemento de trabajo",
      },
      actions: {
        select_properties: "Seleccionar propiedades",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "Tareas recurrentes",
      description:
        "Configura tu trabajo repetible una vez y nosotros nos encargaremos de las repeticiones. Verás todo aquí cuando sea necesario.",
      new_recurring_work_item: "Nueva tarea recurrente",
      update_recurring_work_item: "Actualizar tarea recurrente",
      form: {
        interval: {
          title: "Programación",
          start_date: {
            validation: {
              required: "La fecha de inicio es obligatoria",
            },
          },
          interval_type: {
            validation: {
              required: "El tipo de intervalo es obligatorio",
            },
          },
        },
        button: {
          create: "Crear tarea recurrente",
          update: "Actualizar tarea recurrente",
        },
      },
      create_button: {
        label: "Crear tarea recurrente",
        no_permission: "Contacta a tu administrador de proyecto para crear tareas recurrentes",
      },
    },
    empty_state: {
      upgrade: {
        title: "Tu trabajo, en piloto automático",
        description:
          "Configúralo una vez. Te lo recordaremos cuando sea necesario. Mejora a Business para que el trabajo recurrente sea sencillo.",
      },
      no_templates: {
        button: "Crea tu primera tarea recurrente",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Tarea recurrente creada",
          message: "{name}, la tarea recurrente, ya está disponible en tu espacio de trabajo.",
        },
        error: {
          title: "No pudimos crear la tarea recurrente esta vez.",
          message:
            "Intenta guardar tus datos nuevamente o cópialos en una nueva tarea recurrente, preferiblemente en otra pestaña.",
        },
      },
      update: {
        success: {
          title: "Tarea recurrente modificada",
          message: "{name}, la tarea recurrente, ha sido modificada.",
        },
        error: {
          title: "No pudimos guardar los cambios en esta tarea recurrente.",
          message:
            "Intenta guardar tus datos nuevamente o vuelve a esta tarea recurrente más tarde. Si el problema persiste, contáctanos.",
        },
      },
      delete: {
        success: {
          title: "Tarea recurrente eliminada",
          message: "{name}, la tarea recurrente, ha sido eliminada de tu espacio de trabajo.",
        },
        error: {
          title: "No pudimos eliminar esa tarea recurrente.",
          message: "Intenta eliminarla de nuevo o vuelve más tarde. Si no puedes eliminarla entonces, contáctanos.",
        },
      },
    },
    delete_confirmation: {
      title: "Eliminar tarea recurrente",
      description: {
        prefix: "¿Estás seguro de que quieres eliminar la tarea recurrente-",
        suffix:
          "? Todos los datos relacionados con la tarea recurrente se eliminarán permanentemente. Esta acción no se puede deshacer.",
      },
    },
  },
  automations: {
    settings: {
      title: "Automatizaciones personalizadas",
      create_automation: "Crear automatización",
    },
    scope: {
      label: "Alcance",
      run_on: "Ejecutar en",
    },
    trigger: {
      label: "Disparador",
      add_trigger: "Agregar disparador",
      sidebar_header: "Configuración del disparador",
      input_label: "¿Cuál es el disparador para esta automatización?",
      input_placeholder: "Selecciona una opción",
      section_plane_events: "Eventos de Plane",
      section_time_based: "Basado en tiempo",
      fixed_schedule: "Horario fijo",
      schedule: {
        frequency: "Frecuencia",
        select_day: "Seleccionar día",
        day_of_month: "Día del mes",
        monthly_every: "Cada",
        monthly_day_aria: "Día {day}",
        time: "Hora",
        hour: "Hora",
        minute: "Minuto",
        hour_suffix: "h",
        minute_suffix: "min",
        am: "AM",
        pm: "PM",
        timezone: "Zona horaria",
        timezone_placeholder: "Seleccionar una zona horaria",
        frequency_daily: "Diario",
        frequency_weekly: "Semanal",
        frequency_monthly: "Mensual",
        on: "El",
        validation_weekly_day_required: "Selecciona al menos un día de la semana.",
        validation_monthly_date_required: "Selecciona un día del mes.",
        main_content_schedule_summary_daily: "Todos los días a las {time} ({timezone}).",
        main_content_schedule_summary_weekly: "Cada semana el {days} a las {time} ({timezone}).",
        main_content_schedule_summary_monthly: "Cada mes el día {day} a las {time} ({timezone}).",
        schedule_mode: "Modo de programación",
        schedule_mode_fixed: "Fijo",
        schedule_mode_cron: "Cron",
        cron_expression_label: "Ingresar expresión Cron",
        cron_expression_placeholder: "0 9 * * 1-5",
        cron_invalid: "Expresión Cron no válida.",
        cron_preview: 'Esta expresión Cron ejecuta "{description}".',
        main_content_cron_summary: "{description} ({timezone}).",
      },
      button: {
        previous: "Atrás",
        next: "Agregar acción",
      },
    },
    condition: {
      label: "Siempre que",
      add_condition: "Agregar condición",
      adding_condition: "Agregando condición",
    },
    action: {
      label: "Acción",
      add_action: "Agregar acción",
      sidebar_header: "Acciones",
      input_label: "¿Qué hace la automatización?",
      input_placeholder: "Selecciona una opción",
      handler_name: {
        add_comment: "Agregar comentario",
        change_property: "Cambiar propiedad",
      },
      configuration: {
        label: "Configuración",
        change_property: {
          placeholders: {
            property_name: "Selecciona una propiedad",
            change_type: "Seleccionar",
            property_value_select: "{count, plural, one{Seleccionar valor} other{Seleccionar valores}}",
            property_value_select_date: "Seleccionar fecha",
          },
          validation: {
            property_name_required: "El nombre de la propiedad es requerido",
            change_type_required: "El tipo de cambio es requerido",
            property_value_required: "El valor de la propiedad es requerido",
          },
        },
      },
      comment_block: {
        title: "Agregar comentario",
      },
      change_property_block: {
        title: "Cambiar propiedad",
      },
      validation: {
        delete_only_action: "Desactiva la automatización antes de eliminar su única acción.",
      },
    },
    conjunctions: {
      and: "Y",
      or: "O",
      if: "Si",
      then: "Entonces",
    },
    enable: {
      alert:
        "Presiona 'Activar' cuando tu automatización esté completa. Una vez activada, la automatización estará lista para ejecutarse.",
      validation: {
        required: "La automatización debe tener un disparador y al menos una acción para ser activada.",
      },
    },
    delete: {
      validation: {
        enabled: "La automatización debe estar desactivada antes de eliminarla.",
      },
    },
    table: {
      title: "Título de la automatización",
      last_run_on: "Última ejecución",
      created_on: "Creado el",
      last_updated_on: "Última actualización",
      last_run_status: "Estado de la última ejecución",
      average_duration: "Duración promedio",
      owner: "Propietario",
      executions: "Ejecuciones",
    },
    create_modal: {
      heading: {
        create: "Crear automatización",
        update: "Actualizar automatización",
      },
      title: {
        placeholder: "Nombra tu automatización.",
        required_error: "El título es requerido",
      },
      description: {
        placeholder: "Describe tu automatización.",
      },
      submit_button: {
        create: "Crear automatización",
        update: "Actualizar automatización",
      },
    },
    delete_modal: {
      heading: "Eliminar automatización",
    },
    activity: {
      filters: {
        show_fails: "Mostrar fallos",
        all: "Todos",
        only_activity: "Solo actividad",
        only_run_history: "Solo historial de ejecución",
      },
      run_history: {
        initiator: "Iniciador",
      },
    },
    toasts: {
      create: {
        success: {
          title: "¡Éxito!",
          message: "Automatización creada exitosamente.",
        },
        error: {
          title: "¡Error!",
          message: "Falló la creación de la automatización.",
        },
      },
      update: {
        success: {
          title: "¡Éxito!",
          message: "Automatización actualizada exitosamente.",
        },
        error: {
          title: "¡Error!",
          message: "Falló la actualización de la automatización.",
        },
      },
      enable: {
        success: {
          title: "¡Éxito!",
          message: "Automatización activada exitosamente.",
        },
        error: {
          title: "¡Error!",
          message: "Falló la activación de la automatización.",
        },
      },
      disable: {
        success: {
          title: "¡Éxito!",
          message: "Automatización desactivada exitosamente.",
        },
        error: {
          title: "¡Error!",
          message: "Falló la desactivación de la automatización.",
        },
      },
      delete: {
        success: {
          title: "Automatización eliminada",
          message: "{name}, la automatización, ha sido eliminada de tu proyecto.",
        },
        error: {
          title: "No pudimos eliminar esa automatización esta vez.",
          message: "Intenta eliminarla de nuevo o vuelve más tarde. Si no puedes eliminarla entonces, contáctanos.",
        },
      },
      action: {
        create: {
          error: {
            title: "¡Error!",
            message: "Falló la creación de la acción. ¡Por favor intenta de nuevo!",
          },
        },
        update: {
          error: {
            title: "¡Error!",
            message: "Falló la actualización de la acción. ¡Por favor intenta de nuevo!",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "Aún no hay automatizaciones para mostrar.",
        description:
          "Las automatizaciones te ayudan a eliminar tareas repetitivas configurando disparadores, condiciones y acciones. Crea una para ahorrar tiempo y mantener el trabajo fluyendo sin esfuerzo.",
      },
      upgrade: {
        title: "Automatizaciones",
        description: "Las automatizaciones son una forma de automatizar tareas en tu proyecto.",
        sub_description: "Recupera el 80% de tu tiempo administrativo cuando uses Automatizaciones.",
      },
    },
  },
  sso: {
    header: "Identidad",
    description: "Configura tu dominio para acceder a funciones de seguridad, incluido el inicio de sesión único.",
    domain_management: {
      header: "Gestión de dominios",
      verified_domains: {
        header: "Dominios verificados",
        description:
          "Verifica la propiedad de un dominio de correo electrónico para habilitar el inicio de sesión único.",
        button_text: "Agregar dominio",
        list: {
          domain_name: "Nombre del dominio",
          status: "Estado",
          status_verified: "Verificado",
          status_failed: "Fallido",
          status_pending: "Pendiente",
        },
        add_domain: {
          title: "Agregar dominio",
          description: "Agrega tu dominio para configurar SSO y verificarlo.",
          form: {
            domain_label: "Dominio",
            domain_placeholder: "plane.so",
            domain_required: "El dominio es obligatorio",
            domain_invalid: "Ingresa un nombre de dominio válido (ej. plane.so)",
          },
          primary_button_text: "Agregar dominio",
          primary_button_loading_text: "Agregando",
          toast: {
            success_title: "¡Éxito!",
            success_message: "Dominio agregado exitosamente. Por favor, verifícalo agregando el registro DNS TXT.",
            error_message: "Error al agregar el dominio. Por favor, inténtalo de nuevo.",
          },
        },
        verify_domain: {
          title: "Verifica tu dominio",
          description: "Sigue estos pasos para verificar tu dominio.",
          instructions: {
            label: "Instrucciones",
            step_1: "Ve a la configuración DNS de tu proveedor de dominio.",
            step_2: {
              part_1: "Crea un",
              part_2: "registro TXT",
              part_3: "y pega el valor completo del registro proporcionado a continuación.",
            },
            step_3:
              "Esta actualización generalmente toma unos minutos, pero puede tardar hasta 72 horas en completarse.",
            step_4: 'Haz clic en "Verificar dominio" para confirmar una vez que tu registro DNS esté actualizado.',
          },
          verification_code_label: "Valor del registro TXT",
          verification_code_description: "Agrega este registro a tu configuración DNS",
          domain_label: "Dominio",
          primary_button_text: "Verificar dominio",
          primary_button_loading_text: "Verificando",
          secondary_button_text: "Lo haré más tarde",
          toast: {
            success_title: "¡Éxito!",
            success_message: "Dominio verificado exitosamente.",
            error_message: "Error al verificar el dominio. Por favor, inténtalo de nuevo.",
          },
        },
        delete_domain: {
          title: "Eliminar dominio",
          description: {
            prefix: "¿Estás seguro de que quieres eliminar",
            suffix: "? Esta acción no se puede deshacer.",
          },
          primary_button_text: "Eliminar",
          primary_button_loading_text: "Eliminando",
          secondary_button_text: "Cancelar",
          toast: {
            success_title: "¡Éxito!",
            success_message: "Dominio eliminado exitosamente.",
            error_message: "Error al eliminar el dominio. Por favor, inténtalo de nuevo.",
          },
        },
      },
    },
    providers: {
      header: "Inicio de sesión único",
      disabled_message: "Agrega un dominio verificado para configurar SSO",
      configure: {
        create: "Configurar",
        update: "Editar",
      },
      switch_alert_modal: {
        title: "¿Cambiar método SSO a {newProviderShortName}?",
        content:
          "Estás a punto de habilitar {newProviderLongName} ({newProviderShortName}). Esta acción deshabilitará automáticamente {activeProviderLongName} ({activeProviderShortName}). Los usuarios que intenten iniciar sesión a través de {activeProviderShortName} ya no podrán acceder a la plataforma hasta que cambien al nuevo método. ¿Estás seguro de que quieres continuar?",
        primary_button_text: "Cambiar",
        primary_button_text_loading: "Cambiando",
        secondary_button_text: "Cancelar",
      },
      form_section: {
        title: "Detalles proporcionados por IdP para {workspaceName}",
      },
      form_action_buttons: {
        saving: "Guardando",
        save_changes: "Guardar cambios",
        configure_only: "Solo configurar",
        configure_and_enable: "Configurar y habilitar",
        default: "Guardar",
      },
      setup_details_section: {
        title: "{workspaceName} detalles proporcionados para tu IdP",
        button_text: "Obtener detalles de configuración",
      },
      saml: {
        header: "Habilitar SAML",
        description: "Configura tu proveedor de identidad SAML para habilitar el inicio de sesión único.",
        configure: {
          title: "Habilitar SAML",
          description:
            "Verifica la propiedad de un dominio de correo electrónico para acceder a funciones de seguridad, incluido el inicio de sesión único.",
          toast: {
            success_title: "¡Éxito!",
            create_success_message: "Proveedor SAML creado exitosamente.",
            update_success_message: "Proveedor SAML actualizado exitosamente.",
            error_title: "¡Error!",
            error_message: "Error al guardar el proveedor SAML. Por favor, inténtalo de nuevo.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Detalles web",
            entity_id: {
              label: "ID de entidad | Audiencia | Información de metadatos",
              description:
                "Generaremos esta parte de los metadatos que identifica esta aplicación Plane como un servicio autorizado en tu IdP.",
            },
            callback_url: {
              label: "URL de inicio de sesión único",
              description:
                "Generaremos esto por ti. Agrega esto en el campo URL de redirección de inicio de sesión de tu IdP.",
            },
            logout_url: {
              label: "URL de cierre de sesión único",
              description:
                "Generaremos esto por ti. Agrega esto en el campo URL de redirección de cierre de sesión único de tu IdP.",
            },
          },
          mobile_details: {
            header: "Detalles móviles",
            entity_id: {
              label: "ID de entidad | Audiencia | Información de metadatos",
              description:
                "Generaremos esta parte de los metadatos que identifica esta aplicación Plane como un servicio autorizado en tu IdP.",
            },
            callback_url: {
              label: "URL de inicio de sesión único",
              description:
                "Generaremos esto por ti. Agrega esto en el campo URL de redirección de inicio de sesión de tu IdP.",
            },
            logout_url: {
              label: "URL de cierre de sesión único",
              description:
                "Generaremos esto por ti. Agrega esto en el campo URL de redirección de cierre de sesión de tu IdP.",
            },
          },
          mapping_table: {
            header: "Detalles de mapeo",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "Habilitar OIDC",
        description: "Configura tu proveedor de identidad OIDC para habilitar el inicio de sesión único.",
        configure: {
          title: "Habilitar OIDC",
          description:
            "Verifica la propiedad de un dominio de correo electrónico para acceder a funciones de seguridad, incluido el inicio de sesión único.",
          toast: {
            success_title: "¡Éxito!",
            create_success_message: "Proveedor OIDC creado exitosamente.",
            update_success_message: "Proveedor OIDC actualizado exitosamente.",
            error_title: "¡Error!",
            error_message: "Error al guardar el proveedor OIDC. Por favor, inténtalo de nuevo.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Detalles web",
            origin_url: {
              label: "URL de origen",
              description:
                "Generaremos esto para esta aplicación Plane. Agrega esto como un origen confiable en el campo correspondiente de tu IdP.",
            },
            callback_url: {
              label: "URL de redirección",
              description:
                "Generaremos esto por ti. Agrega esto en el campo URL de redirección de inicio de sesión de tu IdP.",
            },
            logout_url: {
              label: "URL de cierre de sesión",
              description:
                "Generaremos esto por ti. Agrega esto en el campo URL de redirección de cierre de sesión de tu IdP.",
            },
          },
          mobile_details: {
            header: "Detalles móviles",
            origin_url: {
              label: "URL de origen",
              description:
                "Generaremos esto para esta aplicación Plane. Agrega esto como un origen confiable en el campo correspondiente de tu IdP.",
            },
            callback_url: {
              label: "URL de redirección",
              description:
                "Generaremos esto por ti. Agrega esto en el campo URL de redirección de inicio de sesión de tu IdP.",
            },
            logout_url: {
              label: "URL de cierre de sesión",
              description:
                "Generaremos esto por ti. Agrega esto en el campo URL de redirección de cierre de sesión de tu IdP.",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "El nombre del proyecto no puede contener caracteres especiales.",
  pql: {
    functions: {
      date: {
        now: {
          description: "Fecha y hora actuales",
        },
        today: {
          description: "La fecha de hoy",
        },
        start_of_day: {
          description: "Inicio de hoy",
        },
        end_of_day: {
          description: "Fin de hoy",
        },
        start_of_week: {
          description: "Inicio de la semana actual",
        },
        end_of_week: {
          description: "Fin de la semana actual",
        },
        start_of_month: {
          description: "Inicio del mes actual",
        },
        end_of_month: {
          description: "Fin del mes actual",
        },
        start_of_year: {
          description: "Inicio del año actual",
        },
        end_of_year: {
          description: "Fin del año actual",
        },
        days_ago: {
          description: "Fecha n días en el pasado",
        },
        days_from_now: {
          description: "Fecha n días en el futuro",
        },
        weeks_ago: {
          description: "Fecha n semanas en el pasado",
        },
        weeks_from_now: {
          description: "Fecha n semanas en el futuro",
        },
        months_ago: {
          description: "Fecha n meses en el pasado",
        },
        months_from_now: {
          description: "Fecha n meses en el futuro",
        },
      },
      user: {
        current_user: {
          description: "Usuario actualmente conectado",
        },
        members_of: {
          description: 'Miembros de "project:<id>" o "teamspace:<id>"',
        },
        workspace_members: {
          description: "Todos los miembros del espacio de trabajo",
        },
      },
      cycle: {
        active_cycle: {
          description: "Ciclo activo hoy",
        },
        completed_cycles: {
          description: "Ciclos cuya fecha de fin ha pasado",
        },
        upcoming_cycles: {
          description: "Ciclos cuya fecha de inicio está en el futuro",
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
          description: "La fecha de vencimiento pasó Y el estado está abierto",
        },
        has_no_assignee: {
          description: "El elemento de trabajo no tiene asignado",
        },
        has_no_label: {
          description: "El elemento de trabajo no tiene etiquetas",
        },
        is_top_level: {
          description: "No es un sub-elemento (no tiene padre)",
        },
        is_sub_work_item: {
          description: "Es un sub-elemento (tiene padre)",
        },
        is_epic: {
          description: "Épica",
        },
        is_intake: {
          description: "Es un elemento de entrada",
        },
        is_draft: {
          description: "Es un borrador",
        },
        is_archived: {
          description: "Está archivado",
        },
        has_children: {
          description: "Tiene al menos un sub-elemento",
        },
        has_start_and_due_dates: {
          description: "Tiene fechas de inicio y vencimiento",
        },
      },
      relation: {
        linked_to: {
          description: "Elementos relacionados con el elemento dado",
        },
        blocked_by: {
          description: "Elementos bloqueados por el elemento dado",
        },
        blocks: {
          description: "Elementos que bloquean el elemento dado",
        },
        child_of: {
          description: "Sub-elementos del elemento dado",
        },
        parent_of: {
          description: "Elemento padre del elemento dado",
        },
        duplicate_of: {
          description: "Elementos marcados como duplicados del elemento dado",
        },
      },
      history: {
        was_ever: {
          description: "El campo alguna vez tuvo este valor",
        },
        was: {
          description: "El campo era anteriormente este valor (cambió a otro)",
        },
        changed_from: {
          description: "El campo fue cambiado desde este valor",
        },
        changed_to: {
          description: "El campo fue cambiado a este valor",
        },
        changed: {
          description: "El campo fue cambiado",
        },
        updated_by: {
          description: "Elemento actualizado por este usuario",
        },
        commented_by: {
          description: "Elemento comentado por este usuario",
        },
        field_changed_by: {
          description: "Campo cambiado por este usuario",
        },
        was_assigned_to: {
          description: "Elemento asignado a este usuario",
        },
        changed_after: {
          description: "Campo cambiado después de esta fecha",
        },
        changed_before: {
          description: "Campo cambiado antes de esta fecha",
        },
        field_changed_after: {
          description: "Campo cambiado después de esta fecha",
        },
        field_changed_before: {
          description: "Campo cambiado antes de esta fecha",
        },
        changed_to_after: {
          description: "Campo cambiado a este valor después de esta fecha",
        },
        changed_to_before: {
          description: "Campo cambiado a este valor antes de esta fecha",
        },
        field_changed_between: {
          description: "Campo cambiado entre estas fechas",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "navegar",
      accept: "aceptar",
      close: "cerrar",
      pick_date: "Seleccionar una fecha",
    },
    placeholder: 'Escribe una consulta y presiona "ENTER" para filtrar...',
    error: "Error al enviar la consulta. Por favor, revisa e inténtalo de nuevo.",
  },
  releases: {
    label: "{count, plural, one {Lanzamiento} other {Lanzamientos}}",
    no_release: "Sin lanzamiento",
    unreleased: "Sin publicar",
    select_releases: "Seleccionar lanzamientos",
    overview: "Resumen",
    scope: "Alcance",
    page_title: {
      scope: "Lanzamiento - {name} | Alcance",
      scope_fallback: "Lanzamiento | Alcance",
    },
    properties: "Propiedades",
    target_date: "Fecha objetivo",
    lead: "Responsable",
    release_tag: "Etiqueta",
    labels: "Etiquetas",
    description_placeholder: "Añadir una descripción...",
    progress: "Progreso",
    completed_work_items: "Elementos de trabajo completados",
    pending_work_items: "Elementos de trabajo pendientes",
    cancelled_work_items: "Elementos de trabajo cancelados",
    scope_page: {
      work_items: "Elementos de trabajo",
      add_work_items: "Añadir elementos de trabajo",
      remove_from_release: "Quitar del lanzamiento",
      empty_state: {
        title: "No hay elementos de trabajo",
        description: "Añada elementos de trabajo para definir el alcance del lanzamiento.",
      },
      confirm_remove: {
        content: "¿Seguro que quieres quitar este elemento de trabajo del lanzamiento? Seguirá en el proyecto.",
        primary_button: {
          default: "Quitar",
          loading: "Quitando",
        },
      },
    },
    empty_state: {
      title: "Aún no hay alcance",
      description:
        "Añade elementos de trabajo al lanzamiento para hacer un seguimiento de su finalización en este lanzamiento.",
      add_scope: "Agregar alcance",
      not_found: {
        title: "Lanzamiento no encontrado",
        description: "Es posible que se haya eliminado el lanzamiento.",
        primary_button: "Volver a lanzamientos",
      },
    },
    toast: {
      work_items_added: "{count, plural, one {Elemento de trabajo añadido} other {Elementos de trabajo añadidos}}",
      work_items_error: "No se pudieron añadir los elementos de trabajo",
    },
    count_releases: "{count, plural, one {# lanzamiento} other {# lanzamientos}}",
    actions: {
      delete: "Eliminar",
    },
    delete_modal: {
      title: "Eliminar lanzamiento",
      content: '¿Seguro que quieres eliminar el lanzamiento "{releaseName}"? Esta acción no se puede deshacer.',
    },
    settings: {
      heading: {
        title: "Lanzamientos",
        description: "Gestiona las entregas del proyecto con precisión usando lanzamientos.",
      },
      toggle: {
        title: "Habilitar lanzamientos",
        description:
          "Los miembros del espacio de trabajo tendrán acceso de visualización al alcance dentro de sus respectivos proyectos.",
      },
      toasts: {
        enable: {
          loading: "Habilitando lanzamientos...",
          success: {
            title: "Lanzamientos habilitados",
            message: "Los lanzamientos se han habilitado para este espacio de trabajo.",
          },
          error: {
            title: "Error",
            message: "No se pudieron habilitar los lanzamientos. Inténtalo de nuevo.",
          },
        },
        disable: {
          loading: "Deshabilitando lanzamientos...",
          success: {
            title: "Lanzamientos deshabilitados",
            message: "Los lanzamientos se han deshabilitado para este espacio de trabajo.",
          },
          error: {
            title: "Error",
            message: "No se pudieron deshabilitar los lanzamientos. Inténtalo de nuevo.",
          },
        },
      },
      tabs: {
        tags: "Tags de lanzamiento",
        labels: "Etiquetas",
      },
      tags: {
        title: "Tags de lanzamiento",
        description: "Categoriza y filtra tus lanzamientos usando tags.",
        add: "Agregar tag",
        empty_state: "Aún no hay tags. Crea tu primer tag.",
        errors: {
          version_required: "La versión es obligatoria.",
          version_already_exists: "Ya existe un tag con esta versión.",
          generic: "Algo salió mal. Inténtalo de nuevo.",
        },
        delete_modal: {
          title: "Eliminar tag",
          content: '¿Seguro que quieres eliminar el tag "{tagVersion}"? Esta acción no se puede deshacer.',
        },
        actions: {
          edit: "Editar tag",
          delete: "Eliminar tag",
        },
        toasts: {
          delete: {
            success: "Tag eliminado correctamente.",
            error: "No se pudo eliminar el tag. Inténtalo de nuevo.",
          },
        },
      },
      labels: {
        title: "Etiquetas",
        description: "Estructura y organiza tus iniciativas con etiquetas.",
        add: "Agregar etiqueta",
        empty_state: "Aún no hay etiquetas. Crea tu primera etiqueta.",
        errors: {
          name_required: "El nombre es obligatorio.",
          name_already_exists: "Ya existe una etiqueta con este nombre.",
          generic: "Algo salió mal. Inténtalo de nuevo.",
        },
        modal: {
          name_placeholder: "Nombre de la etiqueta",
          pick_color: "Elige el color de la etiqueta",
        },
        actions: {
          edit: "Editar etiqueta",
          delete: "Eliminar etiqueta",
        },
        drag_to_reorder: "Arrastra para reordenar",
        delete_modal: {
          title: "Eliminar etiqueta",
          content: '¿Seguro que quieres eliminar la etiqueta "{labelName}"? Esta acción no se puede deshacer.',
        },
        toasts: {
          delete: {
            success: "Etiqueta eliminada correctamente.",
            error: "No se pudo eliminar la etiqueta. Inténtalo de nuevo.",
          },
        },
      },
    },
  },
  work_item_type_hierarchy: {
    settings: {
      title: "Jerarquía",
      tab_label: "Jerarquía",
      description:
        "Configura niveles de jerarquía para organizar tu trabajo. Cada nivel define una relación de padre con el elemento directamente encima y una relación de hijo con el elemento directamente debajo. ",
      sidebar_label: "Jerarquía",
      enable_control: {
        title: "Habilitar jerarquía",
        description: "Crea relaciones padre-hijo entre diferentes tipos de elementos de trabajo.",
        tooltip: "No puedes deshabilitar la jerarquía una vez que está habilitada.",
      },
      workspace_work_item_types_disabled_banner: {
        content: "Define primero los tipos de elementos de trabajo para crear una nueva jerarquía.",
        cta: "Configuración de tipos de elementos de trabajo",
      },
    },
    levels: {
      add_level_button: "Agregar nivel de jerarquía",
      empty_level_placeholder: "Agrega un tipo de elemento de trabajo al nivel {level}",
      empty_level_unauthorized: "No se encontraron tipos de elementos de trabajo en este nivel.",
      zero_level_description:
        "Por defecto, todos los tipos de elementos de trabajo están en el nivel 0 hasta que se asignan a una jerarquía.",
    },
    add_level_modal: {
      title: "Agregar nivel de jerarquía",
      description: "Agrega un nuevo nivel de jerarquía al tipo de elemento de trabajo.",
      work_item_type: "Tipo de elemento de trabajo",
      select_placeholder: "Seleccionar tipos",
      search_placeholder: "Buscar tipos",
      empty_state: {
        title: "Todos los tipos de elementos de trabajo en uso",
        description:
          "Cada tipo de elemento de trabajo definido en este espacio de trabajo ya forma parte de la jerarquía.",
      },
      invalid_level_toast: {
        title: "¡Error!",
        message: "{type_name} no se puede agregar al nivel {level} ya que rompe las reglas de jerarquía.",
      },
      error_toast: {
        title: "Error",
        message: "Error al agregar el tipo de elemento de trabajo a la jerarquía.",
      },
    },
    work_item_modal: {
      invalid_work_item_type_create_toast: {
        title: "¡Error!",
        message:
          "El tipo de elemento de trabajo seleccionado no se puede usar para crear un nuevo elemento de trabajo ya que rompe las reglas de jerarquía.",
      },
      invalid_work_item_type_update_toast: {
        title: "¡Error!",
        message: "El tipo de elemento de trabajo no se puede actualizar ya que rompe las reglas de jerarquía.",
      },
    },
  },
} as const;
