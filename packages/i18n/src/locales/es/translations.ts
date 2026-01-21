export default {
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
  select_or_customize_your_interface_color_scheme: "Selecciona o personaliza el esquema de colores de tu interfaz.",
  theme: "Tema",
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
  workspace_dashboards: "Paneles de control",
  drafts: "Borradores",
  projects: "Proyectos",
  views: "Vistas",
  workspace: "Espacio de trabajo",
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
    "Te ayuda a identificar elementos de trabajo en el proyecto de manera única. Máximo 10 caracteres.",
  description_placeholder: "Descripción",
  only_alphanumeric_non_latin_characters_allowed: "Solo se permiten caracteres alfanuméricos y no latinos.",
  project_id_is_required: "El ID del proyecto es requerido",
  project_id_allowed_char: "Solo se permiten caracteres alfanuméricos y no latinos.",
  project_id_min_char: "El ID del proyecto debe tener al menos 1 carácter",
  project_id_max_char: "El ID del proyecto debe tener como máximo 10 caracteres",
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
  pages: "Páginas",
  intake: "Entrada",
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
  discord: "Discord",
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
  priority: "Prioridad",
  none: "Ninguno",
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Baja",
  members: "Miembros",
  assignee: "Asignado",
  assignees: "Asignados",
  you: "Tú",
  labels: "Etiquetas",
  create_new_label: "Crear nueva etiqueta",
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
        description: "Parece que todos tus widgets están desactivados. ¡Actívalos\nahora para mejorar tu experiencia!",
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
    clear_all: "Limpiar todo",
    copied: "¡Copiado!",
    link_copied: "¡Enlace copiado!",
    link_copied_to_clipboard: "Enlace copiado al portapapeles",
    copied_to_clipboard: "Enlace del elemento de trabajo copiado al portapapeles",
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
      description: "Solo los elementos de trabajo completados\no cancelados pueden ser archivados",
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
      body: "Hola administrador(es) de instancia,\n\nPor favor, crea un nuevo espacio de trabajo con la URL [/nombre-espacio-trabajo] para [propósito de crear el espacio de trabajo].\n\nGracias,\n{firstName} {lastName}\n{email}",
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
        description:
          "No se detectaron proyectos con los criterios coincidentes. \n Crea un nuevo proyecto en su lugar.",
      },
      search: {
        description: "No se detectaron proyectos con los criterios coincidentes.\nCrea un nuevo proyecto en su lugar",
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
        title: "Tokens de API",
        add_token: "Agregar token de API",
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
        title: "Recepción",
        short_title: "Recepción",
        description:
          "Permite que los no miembros compartan errores, comentarios y sugerencias; sin interrumpir tu flujo de trabajo.",
        toggle_title: "Habilitar recepción",
        toggle_description: "Permitir a los miembros del proyecto crear solicitudes de recepción en la aplicación.",
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
      archive_module_description: "Solo los módulos completados o\ncancelados pueden ser archivados.",
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
        description: "Ninguna vista coincide con los criterios de búsqueda. \n Crea una nueva vista en su lugar.",
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
        description: "Las actualizaciones de elementos de trabajo asignados a ti se pueden \n ver aquí",
      },
      mentions: {
        title: "No hay elementos de trabajo asignados",
        description: "Las actualizaciones de elementos de trabajo asignados a ti se pueden \n ver aquí",
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
        description: "Prueba un término diferente o háznoslo saber\nsi estás seguro de que tu búsqueda es correcta.",
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
} as const;
