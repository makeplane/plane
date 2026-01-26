export default {
  sidebar: {
    projects: "Projetos",
    pages: "Páginas",
    new_work_item: "Novo item",
    home: "Home",
    your_work: "Seu trabalho",
    inbox: "Inbox",
    workspace: "Workspace",
    views: "Visualizações",
    analytics: "Analytics",
    work_items: "Itens",
    cycles: "Ciclos",
    modules: "Módulos",
    intake: "Intake",
    drafts: "Rascunhos",
    favorites: "Favoritos",
    pro: "Pro",
    upgrade: "Upgrade",
  },
  auth: {
    common: {
      email: {
        label: "Email",
        placeholder: "nome@empresa.com",
        errors: {
          required: "Email é obrigatório",
          invalid: "Email inválido",
        },
      },
      password: {
        label: "Senha",
        set_password: "Definir senha",
        placeholder: "Digite a senha",
        confirm_password: {
          label: "Confirmar senha",
          placeholder: "Confirmar senha",
        },
        current_password: {
          label: "Senha atual",
        },
        new_password: {
          label: "Nova senha",
          placeholder: "Digite a nova senha",
        },
        change_password: {
          label: {
            default: "Alterar senha",
            submitting: "Alterando senha",
          },
        },
        errors: {
          match: "As senhas não coincidem",
          empty: "Por favor digite sua senha",
          length: "A senha deve ter mais de 8 caracteres",
          strength: {
            weak: "Senha fraca",
            strong: "Senha forte",
          },
        },
        submit: "Definir senha",
        toast: {
          change_password: {
            success: {
              title: "Sucesso!",
              message: "Senha alterada com sucesso.",
            },
            error: {
              title: "Erro!",
              message: "Algo deu errado. Por favor, tente novamente.",
            },
          },
        },
      },
      unique_code: {
        label: "Código único",
        placeholder: "123456",
        paste_code: "Cole o código enviado para seu email",
        requesting_new_code: "Solicitando novo código",
        sending_code: "Enviando código",
      },
      already_have_an_account: "Já tem uma conta?",
      login: "Login",
      create_account: "Criar conta",
      new_to_plane: "Novo no Plane?",
      back_to_sign_in: "Voltar ao login",
      resend_in: "Reenviar em {seconds} segundos",
      sign_in_with_unique_code: "Login com código único",
      forgot_password: "Esqueceu sua senha?",
    },
    sign_up: {
      header: {
        label: "Crie uma conta para começar a gerenciar trabalho com sua equipe.",
        step: {
          email: {
            header: "Cadastro",
            sub_header: "",
          },
          password: {
            header: "Cadastro",
            sub_header: "Cadastre-se usando email e senha.",
          },
          unique_code: {
            header: "Cadastro",
            sub_header: "Cadastre-se usando um código único enviado para o email acima.",
          },
        },
      },
      errors: {
        password: {
          strength: "Tente definir uma senha forte para continuar",
        },
      },
    },
    sign_in: {
      header: {
        label: "Faça login para começar a gerenciar trabalho com sua equipe.",
        step: {
          email: {
            header: "Login ou cadastro",
            sub_header: "",
          },
          password: {
            header: "Login ou cadastro",
            sub_header: "Use seu email e senha para fazer login.",
          },
          unique_code: {
            header: "Login ou cadastro",
            sub_header: "Faça login usando um código único enviado para o email acima.",
          },
        },
      },
    },
    forgot_password: {
      title: "Redefinir sua senha",
      description: "Digite o email verificado da sua conta e enviaremos um link para redefinir sua senha.",
      email_sent: "Enviamos o link de redefinição para seu email",
      send_reset_link: "Enviar link de redefinição",
      errors: {
        smtp_not_enabled:
          "Vemos que seu administrador não habilitou SMTP, não poderemos enviar um link de redefinição de senha",
      },
      toast: {
        success: {
          title: "Email enviado",
          message:
            "Verifique sua caixa de entrada para um link de redefinição de senha. Se não aparecer em alguns minutos, verifique sua pasta de spam.",
        },
        error: {
          title: "Erro!",
          message: "Algo deu errado. Por favor, tente novamente.",
        },
      },
    },
    reset_password: {
      title: "Definir nova senha",
      description: "Proteja sua conta com uma senha forte",
    },
    set_password: {
      title: "Proteja sua conta",
      description: "Definir uma senha ajuda você a fazer login com segurança",
    },
    sign_out: {
      toast: {
        error: {
          title: "Erro!",
          message: "Falha ao sair. Por favor, tente novamente.",
        },
      },
    },
  },
  submit: "Enviar",
  cancel: "Cancelar",
  loading: "Carregando",
  error: "Erro",
  success: "Sucesso",
  warning: "Aviso",
  info: "Informação",
  close: "Fechar",
  yes: "Sim",
  no: "Não",
  ok: "OK",
  name: "Nome",
  description: "Descrição",
  search: "Pesquisar",
  add_member: "Adicionar membro",
  adding_members: "Adicionando membros",
  remove_member: "Remover membro",
  add_members: "Adicionar membros",
  adding_member: "Adicionando membro",
  remove_members: "Remover membros",
  add: "Adicionar",
  adding: "Adicionando",
  remove: "Remover",
  add_new: "Adicionar novo",
  remove_selected: "Remover selecionado",
  first_name: "Primeiro nome",
  last_name: "Sobrenome",
  email: "E-mail",
  display_name: "Nome de exibição",
  role: "Cargo",
  timezone: "Fuso horário",
  avatar: "Avatar",
  cover_image: "Imagem de capa",
  password: "Senha",
  change_cover: "Alterar capa",
  language: "Idioma",
  saving: "Salvando",
  save_changes: "Salvar alterações",
  deactivate_account: "Desativar conta",
  deactivate_account_description:
    "Ao desativar uma conta, todos os dados e recursos dessa conta serão removidos permanentemente e não poderão ser recuperados.",
  profile_settings: "Configurações de perfil",
  your_account: "Sua conta",
  security: "Segurança",
  activity: "Atividade",
  appearance: "Aparência",
  notifications: "Notificações",
  workspaces: "Espaços de trabalho",
  create_workspace: "Criar espaço de trabalho",
  invitations: "Convites",
  summary: "Resumo",
  assigned: "Atribuído",
  created: "Criado",
  subscribed: "Inscrito",
  you_do_not_have_the_permission_to_access_this_page: "Você não tem permissão para acessar esta página.",
  something_went_wrong_please_try_again: "Algo deu errado. Por favor, tente novamente.",
  load_more: "Carregar mais",
  select_or_customize_your_interface_color_scheme: "Selecione ou personalize o esquema de cores da sua interface.",
  theme: "Tema",
  system_preference: "Preferência do sistema",
  light: "Claro",
  dark: "Escuro",
  light_contrast: "Alto contraste claro",
  dark_contrast: "Alto contraste escuro",
  custom: "Personalizado",
  select_your_theme: "Selecione seu tema",
  customize_your_theme: "Personalize seu tema",
  background_color: "Cor de fundo",
  text_color: "Cor do texto",
  primary_color: "Cor primária (Tema)",
  sidebar_background_color: "Cor de fundo da barra lateral",
  sidebar_text_color: "Cor do texto da barra lateral",
  set_theme: "Definir tema",
  enter_a_valid_hex_code_of_6_characters: "Insira um código hexadecimal válido de 6 caracteres",
  background_color_is_required: "A cor de fundo é obrigatória",
  text_color_is_required: "A cor do texto é obrigatória",
  primary_color_is_required: "A cor primária é obrigatória",
  sidebar_background_color_is_required: "A cor de fundo da barra lateral é obrigatória",
  sidebar_text_color_is_required: "A cor do texto da barra lateral é obrigatória",
  updating_theme: "Atualizando tema",
  theme_updated_successfully: "Tema atualizado com sucesso",
  failed_to_update_the_theme: "Falha ao atualizar o tema",
  email_notifications: "Notificações por e-mail",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "Mantenha-se informado sobre os itens de trabalho aos quais você está inscrito. Ative isso para ser notificado.",
  email_notification_setting_updated_successfully: "Configuração de notificação por e-mail atualizada com sucesso",
  failed_to_update_email_notification_setting: "Falha ao atualizar a configuração de notificação por e-mail",
  notify_me_when: "Notifique-me quando",
  property_changes: "Alterações de propriedade",
  property_changes_description:
    "Notifique-me quando as propriedades dos itens de trabalho, como responsáveis, prioridade, estimativas ou qualquer outra coisa, mudarem.",
  state_change: "Mudança de estado",
  state_change_description: "Notifique-me quando os itens de trabalho mudarem para um estado diferente",
  issue_completed: "Item de trabalho concluído",
  issue_completed_description: "Notifique-me apenas quando um item de trabalho for concluído",
  comments: "Comentários",
  comments_description: "Notifique-me quando alguém deixar um comentário no item de trabalho",
  mentions: "Menções",
  mentions_description: "Notifique-me apenas quando alguém me mencionar nos comentários ou na descrição",
  old_password: "Senha antiga",
  general_settings: "Configurações gerais",
  sign_out: "Sair",
  signing_out: "Saindo",
  active_cycles: "Ciclos ativos",
  active_cycles_description:
    "Monitore os ciclos entre os projetos, rastreie os itens de trabalho de alta prioridade e amplie os ciclos que precisam de atenção.",
  on_demand_snapshots_of_all_your_cycles: "Snapshots sob demanda de todos os seus ciclos",
  upgrade: "Upgrade",
  "10000_feet_view": "Visão geral de todos os ciclos ativos.",
  "10000_feet_view_description":
    "Reduza o zoom para ver os ciclos em execução em todos os seus projetos de uma só vez, em vez de ir de ciclo para ciclo em cada projeto.",
  get_snapshot_of_each_active_cycle: "Obtenha um snapshot de cada ciclo ativo.",
  get_snapshot_of_each_active_cycle_description:
    "Rastreie as métricas de alto nível para todos os ciclos ativos, veja seu estado de progresso e tenha uma noção do escopo em relação aos prazos.",
  compare_burndowns: "Compare burndowns.",
  compare_burndowns_description:
    "Monitore o desempenho de cada uma de suas equipes com uma olhada no relatório de burndown de cada ciclo.",
  quickly_see_make_or_break_issues: "Veja rapidamente os itens de trabalho decisivos.",
  quickly_see_make_or_break_issues_description:
    "Visualize os itens de trabalho de alta prioridade para cada ciclo em relação aos prazos. Veja todos eles por ciclo com um clique.",
  zoom_into_cycles_that_need_attention: "Amplie os ciclos que precisam de atenção.",
  zoom_into_cycles_that_need_attention_description:
    "Investigue o estado de qualquer ciclo que não esteja em conformidade com as expectativas com um clique.",
  stay_ahead_of_blockers: "Fique à frente dos bloqueios.",
  stay_ahead_of_blockers_description:
    "Identifique desafios de um projeto para outro e veja as dependências entre ciclos que não são óbvias em nenhuma outra visualização.",
  analytics: "Análises",
  workspace_invites: "Convites para o espaço de trabalho",
  enter_god_mode: "Entrar no God Mode",
  workspace_logo: "Logo do espaço de trabalho",
  new_issue: "Novo item de trabalho",
  your_work: "Seu trabalho",
  drafts: "Rascunhos",
  projects: "Projetos",
  views: "Visualizações",
  workspace: "Espaço de trabalho",
  archives: "Arquivos",
  settings: "Configurações",
  failed_to_move_favorite: "Falha ao mover o favorito",
  favorites: "Favoritos",
  no_favorites_yet: "Nenhum favorito ainda",
  create_folder: "Criar pasta",
  new_folder: "Nova pasta",
  favorite_updated_successfully: "Favorito atualizado com sucesso",
  favorite_created_successfully: "Favorito criado com sucesso",
  folder_already_exists: "A pasta já existe",
  folder_name_cannot_be_empty: "O nome da pasta não pode estar vazio",
  something_went_wrong: "Algo deu errado",
  failed_to_reorder_favorite: "Falha ao reordenar o favorito",
  favorite_removed_successfully: "Favorito removido com sucesso",
  failed_to_create_favorite: "Falha ao criar favorito",
  failed_to_rename_favorite: "Falha ao renomear favorito",
  project_link_copied_to_clipboard: "Link do projeto copiado para a área de transferência",
  link_copied: "Link copiado",
  add_project: "Adicionar projeto",
  create_project: "Criar projeto",
  failed_to_remove_project_from_favorites:
    "Não foi possível remover o projeto dos favoritos. Por favor, tente novamente.",
  project_created_successfully: "Projeto criado com sucesso",
  project_created_successfully_description:
    "Projeto criado com sucesso. Agora você pode começar a adicionar itens de trabalho a ele.",
  project_name_already_taken: "O nome do projeto já está em uso.",
  project_identifier_already_taken: "O identificador do projeto já está em uso.",
  project_cover_image_alt: "Imagem de capa do projeto",
  name_is_required: "Nome é obrigatório",
  title_should_be_less_than_255_characters: "O título deve ter menos de 255 caracteres",
  project_name: "Nome do projeto",
  project_id_must_be_at_least_1_character: "O ID do projeto deve ter pelo menos 1 caractere",
  project_id_must_be_at_most_5_characters: "O ID do projeto deve ter no máximo 5 caracteres",
  project_id: "ID do projeto",
  project_id_tooltip_content:
    "Ajuda você a identificar itens de trabalho no projeto de forma exclusiva. Máximo de 10 caracteres.",
  description_placeholder: "Descrição",
  only_alphanumeric_non_latin_characters_allowed: "Apenas caracteres alfanuméricos e não latinos são permitidos.",
  project_id_is_required: "O ID do projeto é obrigatório",
  project_id_allowed_char: "Apenas caracteres alfanuméricos e não latinos são permitidos.",
  project_id_min_char: "O ID do projeto deve ter pelo menos 1 caractere",
  project_id_max_char: "O ID do projeto deve ter no máximo 10 caracteres",
  project_description_placeholder: "Insira a descrição do projeto",
  select_network: "Selecione a rede",
  lead: "Líder",
  date_range: "Intervalo de datas",
  private: "Privado",
  public: "Público",
  accessible_only_by_invite: "Acessível apenas por convite",
  anyone_in_the_workspace_except_guests_can_join:
    "Qualquer pessoa no espaço de trabalho, exceto convidados, pode participar",
  creating: "Criando",
  creating_project: "Criando projeto",
  adding_project_to_favorites: "Adicionando projeto aos favoritos",
  project_added_to_favorites: "Projeto adicionado aos favoritos",
  couldnt_add_the_project_to_favorites:
    "Não foi possível adicionar o projeto aos favoritos. Por favor, tente novamente.",
  removing_project_from_favorites: "Removendo projeto dos favoritos",
  project_removed_from_favorites: "Projeto removido dos favoritos",
  couldnt_remove_the_project_from_favorites:
    "Não foi possível remover o projeto dos favoritos. Por favor, tente novamente.",
  add_to_favorites: "Adicionar aos favoritos",
  remove_from_favorites: "Remover dos favoritos",
  publish_project: "Publicar projeto",
  publish: "Publicar",
  copy_link: "Copiar link",
  leave_project: "Sair do projeto",
  join_the_project_to_rearrange: "Participe do projeto para reorganizar",
  drag_to_rearrange: "Arraste para reorganizar",
  congrats: "Parabéns!",
  open_project: "Abrir projeto",
  issues: "Itens de trabalho",
  cycles: "Ciclos",
  modules: "Módulos",
  pages: "Páginas",
  intake: "Admissão",
  time_tracking: "Rastreamento de tempo",
  work_management: "Gerenciamento de trabalho",
  projects_and_issues: "Projetos e itens de trabalho",
  projects_and_issues_description: "Ative ou desative estes neste projeto.",
  cycles_description:
    "Defina o tempo de trabalho por projeto e ajuste o período conforme necessário. Um ciclo pode durar 2 semanas, o próximo 1 semana.",
  modules_description: "Organize o trabalho em subprojetos com líderes e responsáveis dedicados.",
  views_description: "Salve classificações, filtros e opções de exibição personalizadas ou compartilhe com sua equipe.",
  pages_description: "Crie e edite conteúdo livre – anotações, documentos, qualquer coisa.",
  intake_description:
    "Permita que não membros compartilhem bugs, feedbacks e sugestões sem interromper seu fluxo de trabalho.",
  time_tracking_description: "Registre o tempo gasto em itens de trabalho e projetos.",
  work_management_description: "Gerencie seu trabalho e projetos com facilidade.",
  documentation: "Documentação",
  message_support: "Suporte por mensagem",
  contact_sales: "Contatar vendas",
  hyper_mode: "Modo Hyper",
  keyboard_shortcuts: "Atalhos do teclado",
  whats_new: "O que há de novo?",
  version: "Versão",
  we_are_having_trouble_fetching_the_updates: "Estamos tendo problemas para buscar as atualizações.",
  our_changelogs: "nossos changelogs",
  for_the_latest_updates: "para as últimas atualizações.",
  please_visit: "Por favor, visite",
  docs: "Documentos",
  full_changelog: "Changelog completo",
  support: "Suporte",
  discord: "Discord",
  powered_by_plane_pages: "Desenvolvido por Plane Pages",
  please_select_at_least_one_invitation: "Selecione pelo menos um convite.",
  please_select_at_least_one_invitation_description:
    "Selecione pelo menos um convite para entrar no espaço de trabalho.",
  we_see_that_someone_has_invited_you_to_join_a_workspace:
    "Vemos que alguém convidou você para entrar em um espaço de trabalho",
  join_a_workspace: "Entrar em um espaço de trabalho",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description:
    "Vemos que alguém convidou você para entrar em um espaço de trabalho",
  join_a_workspace_description: "Entrar em um espaço de trabalho",
  accept_and_join: "Aceitar e entrar",
  go_home: "Ir para a página inicial",
  no_pending_invites: "Nenhum convite pendente",
  you_can_see_here_if_someone_invites_you_to_a_workspace:
    "Você pode ver aqui se alguém convida você para um espaço de trabalho",
  back_to_home: "Voltar para a página inicial",
  workspace_name: "nome-do-espaço-de-trabalho",
  deactivate_your_account: "Desativar sua conta",
  deactivate_your_account_description:
    "Uma vez desativada, você não poderá ser atribuído a itens de trabalho e ser cobrado pelo seu espaço de trabalho. Para reativar sua conta, você precisará de um convite para um espaço de trabalho neste endereço de e-mail.",
  deactivating: "Desativando",
  confirm: "Confirmar",
  confirming: "Confirmando",
  draft_created: "Rascunho criado",
  issue_created_successfully: "Item de trabalho criado com sucesso",
  draft_creation_failed: "Falha na criação do rascunho",
  issue_creation_failed: "Falha na criação do item de trabalho",
  draft_issue: "Rascunhar item de trabalho",
  issue_updated_successfully: "Item de trabalho atualizado com sucesso",
  issue_could_not_be_updated: "Não foi possível atualizar o item de trabalho",
  create_a_draft: "Criar um rascunho",
  save_to_drafts: "Salvar em rascunhos",
  save: "Salvar",
  update: "Atualizar",
  updating: "Atualizando",
  create_new_issue: "Criar novo item de trabalho",
  editor_is_not_ready_to_discard_changes: "O editor não está pronto para descartar as alterações",
  failed_to_move_issue_to_project: "Falha ao mover o item de trabalho para o projeto",
  create_more: "Criar mais",
  add_to_project: "Adicionar ao projeto",
  discard: "Descartar",
  duplicate_issue_found: "Item de trabalho duplicado encontrado",
  duplicate_issues_found: "Itens de trabalho duplicados encontrados",
  no_matching_results: "Nenhum resultado correspondente",
  title_is_required: "O título é obrigatório",
  title: "Título",
  state: "Estado",
  priority: "Prioridade",
  none: "Nenhum",
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
  members: "Membros",
  assignee: "Responsável",
  assignees: "Responsáveis",
  you: "Você",
  labels: "Etiquetas",
  create_new_label: "Criar nova etiqueta",
  start_date: "Data de início",
  end_date: "Data de término",
  due_date: "Data de vencimento",
  estimate: "Estimativa",
  change_parent_issue: "Alterar item de trabalho pai",
  remove_parent_issue: "Remover item de trabalho pai",
  add_parent: "Adicionar pai",
  loading_members: "Carregando membros",
  view_link_copied_to_clipboard: "Link de visualização copiado para a área de transferência.",
  required: "Obrigatório",
  optional: "Opcional",
  Cancel: "Cancelar",
  edit: "Editar",
  archive: "Arquivar",
  restore: "Restaurar",
  open_in_new_tab: "Abrir em nova aba",
  delete: "Excluir",
  deleting: "Excluindo",
  make_a_copy: "Fazer uma cópia",
  move_to_project: "Mover para o projeto",
  good: "Bom",
  morning: "manhã",
  afternoon: "tarde",
  evening: "noite",
  show_all: "Mostrar tudo",
  show_less: "Mostrar menos",
  no_data_yet: "Nenhum dado ainda",
  syncing: "Sincronizando",
  add_work_item: "Adicionar item de trabalho",
  advanced_description_placeholder: "Pressione '/' para comandos",
  create_work_item: "Criar item de trabalho",
  attachments: "Anexos",
  declining: "Recusando",
  declined: "Recusado",
  decline: "Recusar",
  unassigned: "Não atribuído",
  work_items: "Itens de trabalho",
  add_link: "Adicionar link",
  points: "Pontos",
  no_assignee: "Sem responsável",
  no_assignees_yet: "Nenhum responsável ainda",
  no_labels_yet: "Nenhuma etiqueta ainda",
  ideal: "Ideal",
  current: "Atual",
  no_matching_members: "Nenhum membro correspondente",
  leaving: "Saindo",
  removing: "Removendo",
  leave: "Sair",
  refresh: "Atualizar",
  refreshing: "Atualizando",
  refresh_status: "Status da atualização",
  prev: "Anterior",
  next: "Próximo",
  re_generating: "Regerando",
  re_generate: "Regerar",
  re_generate_key: "Regerar chave",
  export: "Exportar",
  member: "{count, plural, one{# membro} other{# membros}}",
  new_password_must_be_different_from_old_password: "Nova senha deve ser diferente da senha antiga",
  edited: "editado",
  bot: "robô",
  project_view: {
    sort_by: {
      created_at: "Criado em",
      updated_at: "Atualizado em",
      name: "Nome",
    },
  },
  toast: {
    success: "Sucesso!",
    error: "Erro!",
  },
  links: {
    toasts: {
      created: {
        title: "Link criado",
        message: "O link foi criado com sucesso",
      },
      not_created: {
        title: "Link não criado",
        message: "O link não pôde ser criado",
      },
      updated: {
        title: "Link atualizado",
        message: "O link foi atualizado com sucesso",
      },
      not_updated: {
        title: "Link não atualizado",
        message: "O link não pôde ser atualizado",
      },
      removed: {
        title: "Link removido",
        message: "O link foi removido com sucesso",
      },
      not_removed: {
        title: "Link não removido",
        message: "O link não pôde ser removido",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "Seu guia de início rápido",
      not_right_now: "Agora não",
      create_project: {
        title: "Criar um projeto",
        description: "A maioria das coisas começa com um projeto no Plane.",
        cta: "Começar",
      },
      invite_team: {
        title: "Convide sua equipe",
        description: "Construa, entregue e gerencie com colegas de trabalho.",
        cta: "Convidar",
      },
      configure_workspace: {
        title: "Configure seu espaço de trabalho.",
        description: "Ative ou desative recursos ou vá além disso.",
        cta: "Configurar este espaço de trabalho",
      },
      personalize_account: {
        title: "Personalize o Plane.",
        description: "Escolha sua foto, cores e muito mais.",
        cta: "Personalizar agora",
      },
      widgets: {
        title: "Está quieto sem widgets, ative-os",
        description:
          "Parece que todos os seus widgets estão desativados. Ative-os\nagora para melhorar sua experiência!",
        primary_button: {
          text: "Gerenciar widgets",
        },
      },
    },
    quick_links: {
      empty: "Salve links para os itens de trabalho que você gostaria de ter à mão.",
      add: "Adicionar link rápido",
      title: "Link rápido",
      title_plural: "Links rápidos",
    },
    recents: {
      title: "Recentes",
      empty: {
        project: "Seus projetos recentes aparecerão aqui quando você visitar um.",
        page: "Suas páginas recentes aparecerão aqui quando você visitar uma.",
        issue: "Seus itens de trabalho recentes aparecerão aqui quando você visitar um.",
        default: "Você não tem nenhum item recente ainda.",
      },
      filters: {
        all: "Todos",
        projects: "Projetos",
        pages: "Páginas",
        issues: "Itens de trabalho",
      },
    },
    new_at_plane: {
      title: "Novidades no Plane",
    },
    quick_tutorial: {
      title: "Tutorial rápido",
    },
    widget: {
      reordered_successfully: "Widget reordenado com sucesso.",
      reordering_failed: "Ocorreu um erro ao reordenar o widget.",
    },
    manage_widgets: "Gerenciar widgets",
    title: "Página inicial",
    star_us_on_github: "Nos dê uma estrela no GitHub",
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "URL inválido",
        placeholder: "Digite ou cole um URL",
      },
      title: {
        text: "Título de exibição",
        placeholder: "Como você gostaria de ver este link",
      },
    },
  },
  common: {
    all: "Todos",
    no_items_in_this_group: "Nenhum item neste grupo",
    drop_here_to_move: "Solte aqui para mover",
    states: "Estados",
    state: "Estado",
    state_groups: "Grupos de estado",
    state_group: "Grupo de estado",
    priorities: "Prioridades",
    priority: "Prioridade",
    team_project: "Projeto de equipe",
    project: "Projeto",
    cycle: "Ciclo",
    cycles: "Ciclos",
    module: "Módulo",
    modules: "Módulos",
    labels: "Etiquetas",
    label: "Etiqueta",
    assignees: "Responsáveis",
    assignee: "Responsável",
    created_by: "Criado por",
    none: "Nenhum",
    link: "Link",
    estimates: "Estimativas",
    estimate: "Estimativa",
    created_at: "Criado em",
    completed_at: "Concluído em",
    layout: "Layout",
    filters: "Filtros",
    display: "Exibir",
    load_more: "Carregar mais",
    activity: "Atividade",
    analytics: "Análises",
    dates: "Datas",
    success: "Sucesso!",
    something_went_wrong: "Algo deu errado",
    error: {
      label: "Erro!",
      message: "Ocorreu algum erro. Por favor, tente novamente.",
    },
    group_by: "Agrupar por",
    epic: "Épico",
    epics: "Épicos",
    work_item: "Item de trabalho",
    work_items: "Itens de trabalho",
    sub_work_item: "Sub-item de trabalho",
    add: "Adicionar",
    warning: "Aviso",
    updating: "Atualizando",
    adding: "Adicionando",
    update: "Atualizar",
    creating: "Criando",
    create: "Criar",
    cancel: "Cancelar",
    description: "Descrição",
    title: "Título",
    attachment: "Anexo",
    general: "Geral",
    features: "Funcionalidades",
    automation: "Automação",
    project_name: "Nome do projeto",
    project_id: "ID do projeto",
    project_timezone: "Fuso horário do projeto",
    created_on: "Criado em",
    update_project: "Atualizar projeto",
    identifier_already_exists: "O identificador já existe",
    add_more: "Adicionar mais",
    defaults: "Padrões",
    add_label: "Adicionar etiqueta",
    customize_time_range: "Personalizar intervalo de tempo",
    loading: "Carregando",
    attachments: "Anexos",
    property: "Propriedade",
    properties: "Propriedades",
    parent: "Pai",
    page: "Página",
    remove: "Remover",
    archiving: "Arquivando",
    archive: "Arquivar",
    access: {
      public: "Público",
      private: "Privado",
    },
    done: "Concluído",
    sub_work_items: "Sub-itens de trabalho",
    comment: "Comentário",
    workspace_level: "Nível do espaço de trabalho",
    order_by: {
      label: "Ordenar por",
      manual: "Manual",
      last_created: "Último criado",
      last_updated: "Último atualizado",
      start_date: "Data de início",
      due_date: "Data de vencimento",
      asc: "Ascendente",
      desc: "Descendente",
      updated_on: "Atualizado em",
    },
    sort: {
      asc: "Ascendente",
      desc: "Descendente",
      created_on: "Criado em",
      updated_on: "Atualizado em",
    },
    comments: "Comentários",
    updates: "Atualizações",
    clear_all: "Limpar tudo",
    copied: "Copiado!",
    link_copied: "Link copiado!",
    link_copied_to_clipboard: "Link copiado para a área de transferência",
    copied_to_clipboard: "Link do item de trabalho copiado para a área de transferência",
    is_copied_to_clipboard: "O link do item de trabalho foi copiado para a área de transferência",
    no_links_added_yet: "Nenhum link adicionado ainda",
    add_link: "Adicionar link",
    links: "Links",
    go_to_workspace: "Ir para o espaço de trabalho",
    progress: "Progresso",
    optional: "Opcional",
    join: "Participar",
    go_back: "Voltar",
    continue: "Continuar",
    resend: "Reenviar",
    relations: "Relações",
    errors: {
      default: {
        title: "Erro!",
        message: "Algo deu errado. Por favor, tente novamente.",
      },
      required: "Este campo é obrigatório",
      entity_required: "{entity} é obrigatório",
      restricted_entity: "{entity} está restrito",
    },
    update_link: "Atualizar link",
    attach: "Anexar",
    create_new: "Criar novo",
    add_existing: "Adicionar existente",
    type_or_paste_a_url: "Digite ou cole uma URL",
    url_is_invalid: "URL inválida",
    display_title: "Título de exibição",
    link_title_placeholder: "Como você gostaria de ver este link",
    url: "URL",
    side_peek: "Visualização lateral",
    modal: "Modal",
    full_screen: "Tela cheia",
    close_peek_view: "Fechar a visualização",
    toggle_peek_view_layout: "Alternar layout de visualização rápida",
    options: "Opções",
    duration: "Duração",
    today: "Hoje",
    week: "Semana",
    month: "Mês",
    quarter: "Trimestre",
    press_for_commands: "Pressione '/' para comandos",
    click_to_add_description: "Clique para adicionar descrição",
    search: {
      label: "Buscar",
      placeholder: "Digite para buscar",
      no_matches_found: "Nenhum resultado encontrado",
      no_matching_results: "Nenhum resultado correspondente",
    },
    actions: {
      edit: "Editar",
      make_a_copy: "Fazer uma cópia",
      open_in_new_tab: "Abrir em nova aba",
      copy_link: "Copiar link",
      archive: "Arquivar",
      restore: "Restaurar",
      delete: "Excluir",
      remove_relation: "Remover relação",
      subscribe: "Inscrever-se",
      unsubscribe: "Cancelar inscrição",
      clear_sorting: "Limpar ordenação",
      show_weekends: "Mostrar fins de semana",
      enable: "Habilitar",
      disable: "Desabilitar",
    },
    name: "Nome",
    discard: "Descartar",
    confirm: "Confirmar",
    confirming: "Confirmando",
    read_the_docs: "Ler a documentação",
    default: "Padrão",
    active: "Ativo",
    enabled: "Habilitado",
    disabled: "Desabilitado",
    mandate: "Mandato",
    mandatory: "Obrigatório",
    yes: "Sim",
    no: "Não",
    please_wait: "Por favor, aguarde",
    enabling: "Habilitando",
    disabling: "Desabilitando",
    beta: "Beta",
    or: "ou",
    next: "Próximo",
    back: "Voltar",
    cancelling: "Cancelando",
    configuring: "Configurando",
    clear: "Limpar",
    import: "Importar",
    connect: "Conectar",
    authorizing: "Autorizando",
    processing: "Processando",
    no_data_available: "Nenhum dado disponível",
    from: "de {name}",
    authenticated: "Autenticado",
    select: "Selecionar",
    upgrade: "Upgrade",
    add_seats: "Adicionar lugares",
    projects: "Projetos",
    workspace: "Espaço de trabalho",
    workspaces: "Espaços de trabalho",
    team: "Equipe",
    teams: "Equipes",
    entity: "Entidade",
    entities: "Entidades",
    task: "Tarefa",
    tasks: "Tarefas",
    section: "Seção",
    sections: "Seções",
    edit: "Editar",
    connecting: "Conectando",
    connected: "Conectado",
    disconnect: "Desconectar",
    disconnecting: "Desconectando",
    installing: "Instalando",
    install: "Instalar",
    reset: "Redefinir",
    live: "Ao vivo",
    change_history: "Histórico de alterações",
    coming_soon: "Em breve",
    member: "Membro",
    members: "Membros",
    you: "Você",
    upgrade_cta: {
      higher_subscription: "Faça upgrade para uma assinatura superior",
      talk_to_sales: "Fale com o departamento de vendas",
    },
    category: "Categoria",
    categories: "Categorias",
    saving: "Salvando",
    save_changes: "Salvar alterações",
    delete: "Excluir",
    deleting: "Excluindo",
    pending: "Pendente",
    invite: "Convidar",
    view: "Visualizar",
    deactivated_user: "Usuário desativado",
    apply: "Aplicar",
    applying: "Aplicando",
    users: "Usuários",
    admins: "Administradores",
    guests: "Convidados",
    on_track: "No caminho certo",
    off_track: "Fora do caminho",
    at_risk: "Em risco",
    timeline: "Linha do tempo",
    completion: "Conclusão",
    upcoming: "Próximo",
    completed: "Concluído",
    in_progress: "Em andamento",
    planned: "Planejado",
    paused: "Pausado",
    no_of: "Nº de {entity}",
    resolved: "Resolvido",
  },
  chart: {
    x_axis: "Eixo X",
    y_axis: "Eixo Y",
    metric: "Métrica",
  },
  form: {
    title: {
      required: "Título é obrigatório",
      max_length: "O título deve ter menos de {length} caracteres",
    },
  },
  entity: {
    grouping_title: "Agrupamento de {entity}",
    priority: "Prioridade de {entity}",
    all: "Todos os {entity}",
    drop_here_to_move: "Solte aqui para mover o {entity}",
    delete: {
      label: "Excluir {entity}",
      success: "{entity} excluído com sucesso",
      failed: "Falha ao excluir {entity}",
    },
    update: {
      failed: "Falha ao atualizar {entity}",
      success: "{entity} atualizado com sucesso",
    },
    link_copied_to_clipboard: "Link de {entity} copiado para a área de transferência",
    fetch: {
      failed: "Erro ao buscar {entity}",
    },
    add: {
      success: "{entity} adicionado com sucesso",
      failed: "Erro ao adicionar {entity}",
    },
    remove: {
      success: "{entity} removido com sucesso",
      failed: "Erro ao remover {entity}",
    },
  },
  epic: {
    all: "Todos os Épicos",
    label: "{count, plural, one {Épico} other {Épicos}}",
    new: "Novo Épico",
    adding: "Adicionando épico",
    create: {
      success: "Épico criado com sucesso",
    },
    add: {
      press_enter: "Pressione 'Enter' para adicionar outro épico",
      label: "Adicionar Épico",
    },
    title: {
      label: "Título do Épico",
      required: "O título do épico é obrigatório.",
    },
  },
  issue: {
    label: "{count, plural, one {Item de trabalho} other {Itens de trabalho}}",
    all: "Todos os Itens de trabalho",
    edit: "Editar item de trabalho",
    title: {
      label: "Título do item de trabalho",
      required: "O título do item de trabalho é obrigatório.",
    },
    add: {
      press_enter: "Pressione 'Enter' para adicionar outro item de trabalho",
      label: "Adicionar item de trabalho",
      cycle: {
        failed: "Não foi possível adicionar o item de trabalho ao ciclo. Por favor, tente novamente.",
        success:
          "{count, plural, one {Item de trabalho} other {Itens de trabalho}} adicionado(s) ao ciclo com sucesso.",
        loading: "Adicionando {count, plural, one {item de trabalho} other {itens de trabalho}} ao ciclo",
      },
      assignee: "Adicionar responsáveis",
      start_date: "Adicionar data de início",
      due_date: "Adicionar data de vencimento",
      parent: "Adicionar item de trabalho pai",
      sub_issue: "Adicionar sub-item de trabalho",
      relation: "Adicionar relação",
      link: "Adicionar link",
      existing: "Adicionar item de trabalho existente",
    },
    remove: {
      label: "Remover item de trabalho",
      cycle: {
        loading: "Removendo item de trabalho do ciclo",
        success: "Item de trabalho removido do ciclo com sucesso.",
        failed: "Não foi possível remover o item de trabalho do ciclo. Por favor, tente novamente.",
      },
      module: {
        loading: "Removendo item de trabalho do módulo",
        success: "Item de trabalho removido do módulo com sucesso.",
        failed: "Não foi possível remover o item de trabalho do módulo. Por favor, tente novamente.",
      },
      parent: {
        label: "Remover item de trabalho pai",
      },
    },
    new: "Novo Item de trabalho",
    adding: "Adicionando item de trabalho",
    create: {
      success: "Item de trabalho criado com sucesso",
    },
    priority: {
      urgent: "Urgente",
      high: "Alta",
      medium: "Média",
      low: "Baixa",
    },
    display: {
      properties: {
        label: "Exibir Propriedades",
        id: "ID",
        issue_type: "Tipo de Item de Trabalho",
        sub_issue_count: "Contagem de sub-itens de trabalho",
        attachment_count: "Contagem de anexos",
        created_on: "Criado em",
        sub_issue: "Sub-item de trabalho",
        work_item_count: "Contagem de itens de trabalho",
      },
      extra: {
        show_sub_issues: "Mostrar sub-itens de trabalho",
        show_empty_groups: "Mostrar grupos vazios",
      },
    },
    layouts: {
      ordered_by_label: "Este layout é ordenado por",
      list: "Lista",
      kanban: "Quadro",
      calendar: "Calendário",
      spreadsheet: "Tabela",
      gantt: "Cronograma",
      title: {
        list: "Layout de Lista",
        kanban: "Layout de Quadro",
        calendar: "Layout de Calendário",
        spreadsheet: "Layout de Tabela",
        gantt: "Layout de Cronograma",
      },
    },
    states: {
      active: "Ativo",
      backlog: "Backlog",
    },
    comments: {
      placeholder: "Adicionar comentário",
      switch: {
        private: "Alternar para comentário privado",
        public: "Alternar para comentário público",
      },
      create: {
        success: "Comentário criado com sucesso",
        error: "Falha ao criar o comentário. Por favor, tente novamente mais tarde.",
      },
      update: {
        success: "Comentário atualizado com sucesso",
        error: "Falha ao atualizar o comentário. Por favor, tente novamente mais tarde.",
      },
      remove: {
        success: "Comentário removido com sucesso",
        error: "Falha ao remover o comentário. Por favor, tente novamente mais tarde.",
      },
      upload: {
        error: "Falha ao carregar o recurso. Por favor, tente novamente mais tarde.",
      },
      copy_link: {
        success: "Link do comentário copiado para a área de transferência",
        error: "Erro ao copiar o link do comentário. Tente novamente mais tarde.",
      },
    },
    empty_state: {
      issue_detail: {
        title: "O item de trabalho não existe",
        description: "O item de trabalho que você está procurando não existe, foi arquivado ou foi excluído.",
        primary_button: {
          text: "Visualizar outros itens de trabalho",
        },
      },
    },
    sibling: {
      label: "Itens de trabalho irmãos",
    },
    archive: {
      description: "Apenas itens de trabalho concluídos ou cancelados\npodem ser arquivados",
      label: "Arquivar Item de Trabalho",
      confirm_message:
        "Tem certeza de que deseja arquivar o item de trabalho? Todos os seus itens de trabalho arquivados podem ser restaurados posteriormente.",
      success: {
        label: "Sucesso ao arquivar",
        message: "Seus arquivos podem ser encontrados nos arquivos do projeto.",
      },
      failed: {
        message: "Não foi possível arquivar o item de trabalho. Por favor, tente novamente.",
      },
    },
    restore: {
      success: {
        title: "Sucesso ao restaurar",
        message: "Seu item de trabalho pode ser encontrado nos itens de trabalho do projeto.",
      },
      failed: {
        message: "Não foi possível restaurar o item de trabalho. Por favor, tente novamente.",
      },
    },
    relation: {
      relates_to: "Relacionado a",
      duplicate: "Duplicado de",
      blocked_by: "Bloqueado por",
      blocking: "Bloqueando",
    },
    copy_link: "Copiar link do item de trabalho",
    delete: {
      label: "Excluir item de trabalho",
      error: "Erro ao excluir item de trabalho",
    },
    subscription: {
      actions: {
        subscribed: "Item de trabalho inscrito com sucesso",
        unsubscribed: "Item de trabalho não inscrito com sucesso",
      },
    },
    select: {
      error: "Selecione pelo menos um item de trabalho",
      empty: "Nenhum item de trabalho selecionado",
      add_selected: "Adicionar itens de trabalho selecionados",
      select_all: "Selecionar tudo",
      deselect_all: "Desmarcar tudo",
    },
    open_in_full_screen: "Abrir item de trabalho em tela cheia",
  },
  attachment: {
    error: "Não foi possível anexar o arquivo. Tente enviar novamente.",
    only_one_file_allowed: "Apenas um arquivo pode ser enviado por vez.",
    file_size_limit: "O arquivo deve ter {size}MB ou menos.",
    drag_and_drop: "Arraste e solte em qualquer lugar para enviar",
    delete: "Excluir anexo",
  },
  label: {
    select: "Selecionar etiqueta",
    create: {
      success: "Etiqueta criada com sucesso",
      failed: "Falha ao criar etiqueta",
      already_exists: "Etiqueta já existe",
      type: "Digite para adicionar uma nova etiqueta",
    },
  },
  sub_work_item: {
    update: {
      success: "Sub-item de trabalho atualizado com sucesso",
      error: "Erro ao atualizar sub-item de trabalho",
    },
    remove: {
      success: "Sub-item de trabalho removido com sucesso",
      error: "Erro ao remover sub-item de trabalho",
    },
    empty_state: {
      sub_list_filters: {
        title: "Você não tem sub-itens de trabalho que correspondem aos filtros que você aplicou.",
        description: "Para ver todos os sub-itens de trabalho, limpe todos os filtros aplicados.",
        action: "Limpar filtros",
      },
      list_filters: {
        title: "Você não tem itens de trabalho que correspondem aos filtros que você aplicou.",
        description: "Para ver todos os itens de trabalho, limpe todos os filtros aplicados.",
        action: "Limpar filtros",
      },
    },
  },
  view: {
    label: "{count, plural, one {Visualização} other {Visualizações}}",
    create: {
      label: "Criar Visualização",
    },
    update: {
      label: "Atualizar Visualização",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "Pendente",
        description: "Pendente",
      },
      declined: {
        title: "Recusado",
        description: "Recusado",
      },
      snoozed: {
        title: "Adiado",
        description: "{days, plural, one{Falta # dia} other{Faltam # dias}}",
      },
      accepted: {
        title: "Aceito",
        description: "Aceito",
      },
      duplicate: {
        title: "Duplicado",
        description: "Duplicado",
      },
    },
    modals: {
      decline: {
        title: "Recusar item de trabalho",
        content: "Tem certeza de que deseja recusar o item de trabalho {value}?",
      },
      delete: {
        title: "Excluir item de trabalho",
        content: "Tem certeza de que deseja excluir o item de trabalho {value}?",
        success: "Item de trabalho excluído com sucesso",
      },
    },
    errors: {
      snooze_permission: "Apenas administradores do projeto podem adiar/reativar itens de trabalho",
      accept_permission: "Apenas administradores do projeto podem aceitar itens de trabalho",
      decline_permission: "Apenas administradores do projeto podem recusar itens de trabalho",
    },
    actions: {
      accept: "Aceitar",
      decline: "Recusar",
      snooze: "Adiar",
      unsnooze: "Reativar",
      copy: "Copiar link do item de trabalho",
      delete: "Excluir",
      open: "Abrir item de trabalho",
      mark_as_duplicate: "Marcar como duplicado",
      move: "Mover {value} para os itens de trabalho do projeto",
    },
    source: {
      "in-app": "no aplicativo",
    },
    order_by: {
      created_at: "Criado em",
      updated_at: "Atualizado em",
      id: "ID",
    },
    label: "Admissão",
    page_label: "{workspace} - Admissão",
    modal: {
      title: "Criar item de trabalho de admissão",
    },
    tabs: {
      open: "Aberto",
      closed: "Fechado",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "Nenhum item de trabalho aberto",
        description: "Encontre itens de trabalho abertos aqui. Crie um novo item de trabalho.",
      },
      sidebar_closed_tab: {
        title: "Nenhum item de trabalho fechado",
        description: "Todos os itens de trabalho, sejam aceitos ou recusados, podem ser encontrados aqui.",
      },
      sidebar_filter: {
        title: "Nenhum item de trabalho correspondente",
        description:
          "Nenhum item de trabalho corresponde ao filtro aplicado na admissão. Crie um novo item de trabalho.",
      },
      detail: {
        title: "Selecione um item de trabalho para visualizar seus detalhes.",
      },
    },
  },
  workspace_creation: {
    heading: "Crie seu espaço de trabalho",
    subheading: "Para começar a usar o Plane, você precisa criar ou entrar em um espaço de trabalho.",
    form: {
      name: {
        label: "Nomeie seu espaço de trabalho",
        placeholder: "Algo familiar e reconhecível é sempre melhor.",
      },
      url: {
        label: "Defina o URL do seu espaço de trabalho",
        placeholder: "Digite ou cole um URL",
        edit_slug: "Você só pode editar o slug do URL",
      },
      organization_size: {
        label: "Quantas pessoas usarão este espaço de trabalho?",
        placeholder: "Selecione um intervalo",
      },
    },
    errors: {
      creation_disabled: {
        title: "Apenas o administrador da sua instância pode criar espaços de trabalho",
        description:
          "Se você souber o endereço de e-mail do administrador da sua instância, clique no botão abaixo para entrar em contato com ele.",
        request_button: "Solicitar administrador da instância",
      },
      validation: {
        name_alphanumeric:
          "Os nomes dos espaços de trabalho podem conter apenas (' '), ('-'), ('_') e caracteres alfanuméricos.",
        name_length: "Limite seu nome a 80 caracteres.",
        url_alphanumeric: "Os URLs podem conter apenas ('-') e caracteres alfanuméricos.",
        url_length: "Limite seu URL a 48 caracteres.",
        url_already_taken: "O URL do espaço de trabalho já está em uso!",
      },
    },
    request_email: {
      subject: "Solicitando um novo espaço de trabalho",
      body: "Olá, administrador(es) da instância,\n\nPor favor, crie um novo espaço de trabalho com o URL [/nome-do-espaço-de-trabalho] para [finalidade de criar o espaço de trabalho].\n\nObrigado,\n{firstName} {lastName}\n{email}",
    },
    button: {
      default: "Criar espaço de trabalho",
      loading: "Criando espaço de trabalho",
    },
    toast: {
      success: {
        title: "Sucesso",
        message: "Espaço de trabalho criado com sucesso",
      },
      error: {
        title: "Erro",
        message: "Não foi possível criar o espaço de trabalho. Por favor, tente novamente.",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "Visão geral dos seus projetos, atividades e métricas",
        description:
          "Bem-vindo ao Plane, estamos animados por tê-lo aqui. Crie seu primeiro projeto e rastreie seus itens de trabalho, e esta página se transformará em um espaço que ajuda você a progredir. Os administradores também verão itens que ajudam sua equipe a progredir.",
        primary_button: {
          text: "Construa seu primeiro projeto",
          comic: {
            title: "Tudo começa com um projeto no Plane",
            description:
              "Um projeto pode ser o planejamento de um produto, uma campanha de marketing ou o lançamento de um novo carro.",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "Análises",
    page_label: "{workspace} - Análises",
    open_tasks: "Total de tarefas abertas",
    error: "Ocorreu algum erro ao buscar os dados.",
    work_items_closed_in: "Itens de trabalho fechados em",
    selected_projects: "Projetos selecionados",
    total_members: "Total de membros",
    total_cycles: "Total de ciclos",
    total_modules: "Total de módulos",
    pending_work_items: {
      title: "Itens de trabalho pendentes",
      empty_state: "A análise de itens de trabalho pendentes por colegas de trabalho aparece aqui.",
    },
    work_items_closed_in_a_year: {
      title: "Itens de trabalho fechados em um ano",
      empty_state: "Feche os itens de trabalho para visualizar a análise dos mesmos na forma de um gráfico.",
    },
    most_work_items_created: {
      title: "Itens de trabalho mais criados",
      empty_state: "Colegas de trabalho e o número de itens de trabalho criados por eles aparecem aqui.",
    },
    most_work_items_closed: {
      title: "Itens de trabalho mais fechados",
      empty_state: "Colegas de trabalho e o número de itens de trabalho fechados por eles aparecem aqui.",
    },
    tabs: {
      scope_and_demand: "Escopo e Demanda",
      custom: "Análises Personalizadas",
    },
    empty_state: {
      customized_insights: {
        description: "Os itens de trabalho atribuídos a você, divididos por estado, aparecerão aqui.",
        title: "Ainda não há dados",
      },
      created_vs_resolved: {
        description: "Os itens de trabalho criados e resolvidos ao longo do tempo aparecerão aqui.",
        title: "Ainda não há dados",
      },
      project_insights: {
        title: "Ainda não há dados",
        description: "Os itens de trabalho atribuídos a você, divididos por estado, aparecerão aqui.",
      },
      general: {
        title:
          "Acompanhe progresso, cargas de trabalho e alocações. Identifique tendências, remova bloqueios e trabalhe mais rápido",
        description:
          "Veja escopo versus demanda, estimativas e expansão de escopo. Obtenha desempenho por membros da equipe e equipes, garantindo que seu projeto seja executado no prazo.",
        primary_button: {
          text: "Comece seu primeiro projeto",
          comic: {
            title: "Analytics funciona melhor com Ciclos + Módulos",
            description:
              "Primeiro, defina um tempo limite para seus itens de trabalho em Ciclos e, se possível, agrupe itens que abrangem mais de um ciclo em Módulos. Confira ambos na navegação esquerda.",
          },
        },
      },
    },
    created_vs_resolved: "Criado vs Resolvido",
    customized_insights: "Insights personalizados",
    backlog_work_items: "{entity} no backlog",
    active_projects: "Projetos ativos",
    trend_on_charts: "Tendência nos gráficos",
    all_projects: "Todos os projetos",
    summary_of_projects: "Resumo dos projetos",
    project_insights: "Insights do projeto",
    started_work_items: "{entity} iniciados",
    total_work_items: "Total de {entity}",
    total_projects: "Total de projetos",
    total_admins: "Total de administradores",
    total_users: "Total de usuários",
    total_intake: "Receita total",
    un_started_work_items: "{entity} não iniciados",
    total_guests: "Total de convidados",
    completed_work_items: "{entity} concluídos",
    total: "Total de {entity}",
  },
  workspace_projects: {
    label: "{count, plural, one {Projeto} other {Projetos}}",
    create: {
      label: "Adicionar Projeto",
    },
    network: {
      label: "Rede",
      private: {
        title: "Privado",
        description: "Acessível apenas por convite",
      },
      public: {
        title: "Público",
        description: "Qualquer pessoa no espaço de trabalho, exceto convidados, pode participar",
      },
    },
    error: {
      permission: "Você não tem permissão para realizar esta ação.",
      cycle_delete: "Falha ao excluir o ciclo",
      module_delete: "Falha ao excluir o módulo",
      issue_delete: "Falha ao excluir o item de trabalho",
    },
    state: {
      backlog: "Backlog",
      unstarted: "Não iniciado",
      started: "Iniciado",
      completed: "Concluído",
      cancelled: "Cancelado",
    },
    sort: {
      manual: "Manual",
      name: "Nome",
      created_at: "Data de criação",
      members_length: "Número de membros",
    },
    scope: {
      my_projects: "Meus projetos",
      archived_projects: "Arquivados",
    },
    common: {
      months_count: "{months, plural, one{# mês} other{# meses}}",
    },
    empty_state: {
      general: {
        title: "Nenhum projeto ativo",
        description:
          "Pense em cada projeto como o pai do trabalho orientado a objetivos. Os projetos são onde os Trabalhos, Ciclos e Módulos vivem e, junto com seus colegas, ajudam você a atingir esse objetivo. Crie um novo projeto ou filtre os projetos arquivados.",
        primary_button: {
          text: "Comece seu primeiro projeto",
          comic: {
            title: "Tudo começa com um projeto no Plane",
            description:
              "Um projeto pode ser o roteiro de um produto, uma campanha de marketing ou o lançamento de um novo carro.",
          },
        },
      },
      no_projects: {
        title: "Nenhum projeto",
        description:
          "Para criar itens de trabalho ou gerenciar seu trabalho, você precisa criar um projeto ou fazer parte de um.",
        primary_button: {
          text: "Comece seu primeiro projeto",
          comic: {
            title: "Tudo começa com um projeto no Plane",
            description:
              "Um projeto pode ser o roteiro de um produto, uma campanha de marketing ou o lançamento de um novo carro.",
          },
        },
      },
      filter: {
        title: "Nenhum projeto correspondente",
        description: "Nenhum projeto detectado com os critérios correspondentes. \n Crie um novo projeto em vez disso.",
      },
      search: {
        description: "Nenhum projeto detectado com os critérios correspondentes.\nCrie um novo projeto em vez disso",
      },
    },
  },
  workspace_views: {
    add_view: "Adicionar visualização",
    empty_state: {
      "all-issues": {
        title: "Nenhum item de trabalho no projeto",
        description:
          "Primeiro projeto concluído! Agora, divida seu trabalho em partes rastreáveis com itens de trabalho. Vamos lá!",
        primary_button: {
          text: "Criar novo item de trabalho",
        },
      },
      assigned: {
        title: "Nenhum item de trabalho ainda",
        description: "Os itens de trabalho atribuídos a você podem ser rastreados aqui.",
        primary_button: {
          text: "Criar novo item de trabalho",
        },
      },
      created: {
        title: "Nenhum item de trabalho ainda",
        description: "Todos os itens de trabalho criados por você vêm aqui, rastreie-os aqui diretamente.",
        primary_button: {
          text: "Criar novo item de trabalho",
        },
      },
      subscribed: {
        title: "Nenhum item de trabalho ainda",
        description: "Inscreva-se nos itens de trabalho nos quais você está interessado, rastreie todos eles aqui.",
      },
      "custom-view": {
        title: "Nenhum item de trabalho ainda",
        description: "Itens de trabalho que se aplicam aos filtros, rastreie todos eles aqui.",
      },
    },
    delete_view: {
      title: "Tem certeza de que deseja excluir esta visualização?",
      content:
        "Se você confirmar, todas as opções de classificação, filtro e exibição + o layout que você escolheu para esta visualização serão excluídos permanentemente sem nenhuma maneira de restaurá-los.",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "Alterar e-mail",
        description: "Digite um novo endereço de e-mail para receber um link de verificação.",
        toasts: {
          success_title: "Sucesso!",
          success_message: "E-mail atualizado com sucesso. Faça login novamente.",
        },
        form: {
          email: {
            label: "Novo e-mail",
            placeholder: "Digite seu e-mail",
            errors: {
              required: "O e-mail é obrigatório",
              invalid: "O e-mail é inválido",
              exists: "O e-mail já existe. Use outro.",
              validation_failed: "Falha na validação do e-mail. Tente novamente.",
            },
          },
          code: {
            label: "Código único",
            placeholder: "123456",
            helper_text: "Código de verificação enviado para o novo e-mail.",
            errors: {
              required: "O código único é obrigatório",
              invalid: "Código de verificação inválido. Tente novamente.",
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
    label: "Configurações do espaço de trabalho",
    page_label: "{workspace} - Configurações gerais",
    key_created: "Chave criada",
    copy_key:
      "Copie e salve esta chave secreta no Páginas do Plane. Você não pode ver esta chave depois de clicar em Fechar. Um arquivo CSV contendo a chave foi baixado.",
    token_copied: "Token copiado para a área de transferência.",
    settings: {
      general: {
        title: "Geral",
        upload_logo: "Carregar logo",
        edit_logo: "Editar logo",
        name: "Nome do espaço de trabalho",
        company_size: "Tamanho da empresa",
        url: "URL do espaço de trabalho",
        workspace_timezone: "Fuso horário do espaço de trabalho",
        update_workspace: "Atualizar espaço de trabalho",
        delete_workspace: "Excluir este espaço de trabalho",
        delete_workspace_description:
          "Ao excluir um espaço de trabalho, todos os dados e recursos dentro desse espaço de trabalho serão permanentemente removidos e não poderão ser recuperados.",
        delete_btn: "Excluir este espaço de trabalho",
        delete_modal: {
          title: "Tem certeza de que deseja excluir este espaço de trabalho?",
          description:
            "Você tem uma avaliação ativa para um de nossos planos pagos. Cancele-o primeiro para prosseguir.",
          dismiss: "Dispensar",
          cancel: "Cancelar avaliação",
          success_title: "Espaço de trabalho excluído.",
          success_message: "Em breve, você irá para a página do seu perfil.",
          error_title: "Isso não funcionou.",
          error_message: "Tente novamente, por favor.",
        },
        errors: {
          name: {
            required: "O nome é obrigatório",
            max_length: "O nome do espaço de trabalho não deve exceder 80 caracteres",
          },
          company_size: {
            required: "O tamanho da empresa é obrigatório",
            select_a_range: "Selecione o tamanho da organização",
          },
        },
      },
      members: {
        title: "Membros",
        add_member: "Adicionar membro",
        pending_invites: "Convites pendentes",
        invitations_sent_successfully: "Convites enviados com sucesso",
        leave_confirmation:
          "Tem certeza de que deseja sair do espaço de trabalho? Você não terá mais acesso a este espaço de trabalho. Esta ação não pode ser desfeita.",
        details: {
          full_name: "Nome completo",
          display_name: "Nome de exibição",
          email_address: "Endereço de e-mail",
          account_type: "Tipo de conta",
          authentication: "Autenticação",
          joining_date: "Data de adesão",
        },
        modal: {
          title: "Convidar pessoas para colaborar",
          description: "Convide pessoas para colaborar em seu espaço de trabalho.",
          button: "Enviar convites",
          button_loading: "Enviando convites",
          placeholder: "nome@empresa.com",
          errors: {
            required: "Precisamos de um endereço de e-mail para convidá-los.",
            invalid: "E-mail inválido",
          },
        },
      },
      billing_and_plans: {
        title: "Faturamento e planos",
        current_plan: "Plano atual",
        free_plan: "Você está usando o plano gratuito atualmente",
        view_plans: "Ver planos",
      },
      exports: {
        title: "Exportações",
        exporting: "Exportando",
        previous_exports: "Exportações anteriores",
        export_separate_files: "Exporte os dados em arquivos separados",
        filters_info: "Aplique filtros para exportar itens de trabalho específicos com base em seus critérios.",
        modal: {
          title: "Exportar para",
          toasts: {
            success: {
              title: "Exportação bem-sucedida",
              message: "Você poderá baixar o(a) {entity} exportado(a) na exportação anterior.",
            },
            error: {
              title: "Falha na exportação",
              message: "A exportação não foi bem-sucedida. Tente novamente.",
            },
          },
        },
      },
      webhooks: {
        title: "Webhooks",
        add_webhook: "Adicionar webhook",
        modal: {
          title: "Criar webhook",
          details: "Detalhes do webhook",
          payload: "URL do payload",
          question: "Quais eventos você gostaria de acionar este webhook?",
          error: "URL é obrigatório",
        },
        secret_key: {
          title: "Chave secreta",
          message: "Gere um token para fazer login no payload do webhook",
        },
        options: {
          all: "Envie-me tudo",
          individual: "Selecionar eventos individuais",
        },
        toasts: {
          created: {
            title: "Webhook criado",
            message: "O webhook foi criado com sucesso",
          },
          not_created: {
            title: "Webhook não criado",
            message: "O webhook não pôde ser criado",
          },
          updated: {
            title: "Webhook atualizado",
            message: "O webhook foi atualizado com sucesso",
          },
          not_updated: {
            title: "Webhook não atualizado",
            message: "O webhook não pôde ser atualizado",
          },
          removed: {
            title: "Webhook removido",
            message: "O webhook foi removido com sucesso",
          },
          not_removed: {
            title: "Webhook não removido",
            message: "O webhook não pôde ser removido",
          },
          secret_key_copied: {
            message: "Chave secreta copiada para a área de transferência.",
          },
          secret_key_not_copied: {
            message: "Ocorreu um erro ao copiar a chave secreta.",
          },
        },
      },
      api_tokens: {
        title: "Tokens de API",
        add_token: "Adicionar token de API",
        create_token: "Criar token",
        never_expires: "Nunca expira",
        generate_token: "Gerar token",
        generating: "Gerando",
        delete: {
          title: "Excluir token de API",
          description:
            "Qualquer aplicativo que use este token não terá mais acesso aos dados do Plane. Esta ação não pode ser desfeita.",
          success: {
            title: "Sucesso!",
            message: "O token de API foi excluído com sucesso",
          },
          error: {
            title: "Erro!",
            message: "O token de API não pôde ser excluído",
          },
        },
      },
    },
    empty_state: {
      api_tokens: {
        title: "Nenhum token de API criado",
        description:
          "As APIs do Plane podem ser usadas para integrar seus dados no Plane com qualquer sistema externo. Crie um token para começar.",
      },
      webhooks: {
        title: "Nenhum webhook adicionado",
        description: "Crie webhooks para receber atualizações em tempo real e automatizar ações.",
      },
      exports: {
        title: "Nenhuma exportação ainda",
        description: "Sempre que você exportar, você também terá uma cópia aqui para referência.",
      },
      imports: {
        title: "Nenhuma importação ainda",
        description: "Encontre todas as suas importações anteriores aqui e baixe-as.",
      },
    },
  },
  profile: {
    label: "Perfil",
    page_label: "Seu trabalho",
    work: "Trabalho",
    details: {
      joined_on: "Entrou em",
      time_zone: "Fuso horário",
    },
    stats: {
      workload: "Carga de trabalho",
      overview: "Visão geral",
      created: "Itens de trabalho criados",
      assigned: "Itens de trabalho atribuídos",
      subscribed: "Itens de trabalho inscritos",
      state_distribution: {
        title: "Itens de trabalho por estado",
        empty: "Crie itens de trabalho para visualizá-los por estado no gráfico para uma melhor análise.",
      },
      priority_distribution: {
        title: "Itens de trabalho por prioridade",
        empty: "Crie itens de trabalho para visualizá-los por prioridade no gráfico para uma melhor análise.",
      },
      recent_activity: {
        title: "Atividade recente",
        empty: "Não foi possível encontrar dados. Por favor, verifique suas entradas",
        button: "Baixar atividade de hoje",
        button_loading: "Baixando",
      },
    },
    actions: {
      profile: "Perfil",
      security: "Segurança",
      activity: "Atividade",
      appearance: "Aparência",
      notifications: "Notificações",
    },
    tabs: {
      summary: "Resumo",
      assigned: "Atribuído",
      created: "Criado",
      subscribed: "Inscrito",
      activity: "Atividade",
    },
    empty_state: {
      activity: {
        title: "Nenhuma atividade ainda",
        description:
          "Comece criando um novo item de trabalho! Adicione detalhes e propriedades a ele. Explore mais no Plane para ver sua atividade.",
      },
      assigned: {
        title: "Nenhum item de trabalho atribuído a você",
        description: "Os itens de trabalho atribuídos a você podem ser rastreados aqui.",
      },
      created: {
        title: "Nenhum item de trabalho ainda",
        description: "Todos os itens de trabalho criados por você vêm aqui, rastreie-os aqui diretamente.",
      },
      subscribed: {
        title: "Nenhum item de trabalho ainda",
        description: "Inscreva-se nos itens de trabalho nos quais você está interessado, rastreie todos eles aqui.",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "Inserir ID do projeto",
      please_select_a_timezone: "Por favor, selecione um fuso horário",
      archive_project: {
        title: "Arquivar projeto",
        description:
          "Arquivar um projeto removerá seu projeto da navegação lateral, embora você ainda possa acessá-lo na página de projetos. Você pode restaurar o projeto ou excluí-lo quando quiser.",
        button: "Arquivar projeto",
      },
      delete_project: {
        title: "Excluir projeto",
        description:
          "Ao excluir um projeto, todos os dados e recursos dentro desse projeto serão removidos permanentemente e não poderão ser recuperados.",
        button: "Excluir meu projeto",
      },
      toast: {
        success: "Projeto atualizado com sucesso",
        error: "Não foi possível atualizar o projeto. Por favor, tente novamente.",
      },
    },
    members: {
      label: "Membros",
      project_lead: "Líder do projeto",
      default_assignee: "Responsável padrão",
      guest_super_permissions: {
        title: "Conceder acesso de visualização a todos os itens de trabalho para usuários convidados:",
        sub_heading:
          "Isso permitirá que os convidados tenham acesso de visualização a todos os itens de trabalho do projeto.",
      },
      invite_members: {
        title: "Convidar membros",
        sub_heading: "Convide membros para trabalhar em seu projeto.",
        select_co_worker: "Selecionar colega de trabalho",
      },
    },
    states: {
      describe_this_state_for_your_members: "Descreva este estado para seus membros.",
      empty_state: {
        title: "Nenhum estado disponível para o grupo {groupKey}",
        description: "Por favor, crie um novo estado",
      },
    },
    labels: {
      label_title: "Título da etiqueta",
      label_title_is_required: "O título da etiqueta é obrigatório",
      label_max_char: "O nome da etiqueta não deve exceder 255 caracteres",
      toast: {
        error: "Erro ao atualizar a etiqueta",
      },
    },
    estimates: {
      label: "Estimativas",
      title: "Habilitar estimativas para meu projeto",
      description: "Elas ajudam você a comunicar a complexidade e a carga de trabalho da equipe.",
      no_estimate: "Sem estimativa",
      new: "Novo sistema de estimativa",
      create: {
        custom: "Personalizado",
        start_from_scratch: "Começar do zero",
        choose_template: "Escolher um modelo",
        choose_estimate_system: "Escolher um sistema de estimativa",
        enter_estimate_point: "Inserir estimativa",
        step: "Passo {step} de {total}",
        label: "Criar estimativa",
      },
      toasts: {
        created: {
          success: {
            title: "Estimativa criada",
            message: "A estimativa foi criada com sucesso",
          },
          error: {
            title: "Falha na criação da estimativa",
            message: "Não foi possível criar a nova estimativa, por favor tente novamente.",
          },
        },
        updated: {
          success: {
            title: "Estimativa modificada",
            message: "A estimativa foi atualizada em seu projeto.",
          },
          error: {
            title: "Falha na modificação da estimativa",
            message: "Não foi possível modificar a estimativa, por favor tente novamente",
          },
        },
        enabled: {
          success: {
            title: "Sucesso!",
            message: "As estimativas foram habilitadas.",
          },
        },
        disabled: {
          success: {
            title: "Sucesso!",
            message: "As estimativas foram desabilitadas.",
          },
          error: {
            title: "Erro!",
            message: "Não foi possível desabilitar a estimativa. Por favor, tente novamente",
          },
        },
      },
      validation: {
        min_length: "A estimativa precisa ser maior que 0.",
        unable_to_process: "Não foi possível processar sua solicitação, por favor tente novamente.",
        numeric: "A estimativa precisa ser um valor numérico.",
        character: "A estimativa precisa ser um valor em caracteres.",
        empty: "O valor da estimativa não pode estar vazio.",
        already_exists: "O valor da estimativa já existe.",
        unsaved_changes: "Você tem algumas alterações não salvas. Por favor, salve-as antes de clicar em concluir",
        remove_empty:
          "A estimativa não pode estar vazia. Insira um valor em cada campo ou remova aqueles para os quais você não tem valores.",
      },
      systems: {
        points: {
          label: "Pontos",
          fibonacci: "Fibonacci",
          linear: "Linear",
          squares: "Quadrados",
          custom: "Personalizado",
        },
        categories: {
          label: "Categorias",
          t_shirt_sizes: "Tamanhos de Camiseta",
          easy_to_hard: "Fácil a difícil",
          custom: "Personalizado",
        },
        time: {
          label: "Tempo",
          hours: "Horas",
        },
      },
    },
    automations: {
      label: "Automações",
      "auto-archive": {
        title: "Arquivar automaticamente itens de trabalho fechados",
        description: "O Plane arquivará automaticamente os itens de trabalho que foram concluídos ou cancelados.",
        duration: "Arquivar automaticamente itens de trabalho que estão fechados por",
      },
      "auto-close": {
        title: "Fechar automaticamente itens de trabalho",
        description: "O Plane fechará automaticamente os itens de trabalho que não foram concluídos ou cancelados.",
        duration: "Fechar automaticamente itens de trabalho que estão inativos por",
        auto_close_status: "Status de fechamento automático",
      },
    },
    empty_state: {
      labels: {
        title: "Nenhuma etiqueta ainda",
        description: "Crie etiquetas para ajudar a organizar e filtrar itens de trabalho em seu projeto.",
      },
      estimates: {
        title: "Nenhum sistema de estimativa ainda",
        description: "Crie um conjunto de estimativas para comunicar a quantidade de trabalho por item de trabalho.",
        primary_button: "Adicionar sistema de estimativa",
      },
    },
    features: {
      cycles: {
        title: "Ciclos",
        short_title: "Ciclos",
        description: "Agende o trabalho em períodos flexíveis que se adaptam ao ritmo e ao tempo únicos deste projeto.",
        toggle_title: "Ativar ciclos",
        toggle_description: "Planeje o trabalho em períodos de tempo focados.",
      },
      modules: {
        title: "Módulos",
        short_title: "Módulos",
        description: "Organize o trabalho em subprojetos com líderes e responsáveis dedicados.",
        toggle_title: "Ativar módulos",
        toggle_description: "Os membros do projeto poderão criar e editar módulos.",
      },
      views: {
        title: "Visualizações",
        short_title: "Visualizações",
        description: "Salve ordenações, filtros e opções de exibição personalizadas ou compartilhe-as com sua equipe.",
        toggle_title: "Ativar visualizações",
        toggle_description: "Os membros do projeto poderão criar e editar visualizações.",
      },
      pages: {
        title: "Páginas",
        short_title: "Páginas",
        description: "Crie e edite conteúdo livre: notas, documentos, qualquer coisa.",
        toggle_title: "Ativar páginas",
        toggle_description: "Os membros do projeto poderão criar e editar páginas.",
      },
      intake: {
        title: "Recepção",
        short_title: "Recepção",
        description:
          "Permita que não membros compartilhem bugs, feedback e sugestões; sem interromper seu fluxo de trabalho.",
        toggle_title: "Ativar recepção",
        toggle_description: "Permitir que membros do projeto criem solicitações de recepção no aplicativo.",
      },
    },
  },
  project_cycles: {
    add_cycle: "Adicionar ciclo",
    more_details: "Mais detalhes",
    cycle: "Ciclo",
    update_cycle: "Atualizar ciclo",
    create_cycle: "Criar ciclo",
    no_matching_cycles: "Nenhum ciclo correspondente",
    remove_filters_to_see_all_cycles: "Remova os filtros para ver todos os ciclos",
    remove_search_criteria_to_see_all_cycles: "Remova os critérios de pesquisa para ver todos os ciclos",
    only_completed_cycles_can_be_archived: "Apenas ciclos concluídos podem ser arquivados",
    active_cycle: {
      label: "Ciclo ativo",
      progress: "Progresso",
      chart: "Gráfico de burndown",
      priority_issue: "Itens de trabalho prioritários",
      assignees: "Responsáveis",
      issue_burndown: "Burndown de itens de trabalho",
      ideal: "Ideal",
      current: "Atual",
      labels: "Etiquetas",
    },
    upcoming_cycle: {
      label: "Próximo ciclo",
    },
    completed_cycle: {
      label: "Ciclo concluído",
    },
    status: {
      days_left: "Dias restantes",
      completed: "Concluído",
      yet_to_start: "Ainda não começou",
      in_progress: "Em progresso",
      draft: "Rascunho",
    },
    action: {
      restore: {
        title: "Restaurar ciclo",
        success: {
          title: "Ciclo restaurado",
          description: "O ciclo foi restaurado.",
        },
        failed: {
          title: "Falha ao restaurar o ciclo",
          description: "Não foi possível restaurar o ciclo. Por favor, tente novamente.",
        },
      },
      favorite: {
        loading: "Adicionando ciclo aos favoritos",
        success: {
          description: "Ciclo adicionado aos favoritos.",
          title: "Sucesso!",
        },
        failed: {
          description: "Não foi possível adicionar o ciclo aos favoritos. Por favor, tente novamente.",
          title: "Erro!",
        },
      },
      unfavorite: {
        loading: "Removendo ciclo dos favoritos",
        success: {
          description: "Ciclo removido dos favoritos.",
          title: "Sucesso!",
        },
        failed: {
          description: "Não foi possível remover o ciclo dos favoritos. Por favor, tente novamente.",
          title: "Erro!",
        },
      },
      update: {
        loading: "Atualizando ciclo",
        success: {
          description: "Ciclo atualizado com sucesso.",
          title: "Sucesso!",
        },
        failed: {
          description: "Erro ao atualizar o ciclo. Por favor, tente novamente.",
          title: "Erro!",
        },
        error: {
          already_exists:
            "Você já tem um ciclo nas datas fornecidas, se você quiser criar um ciclo de rascunho, você pode fazer isso removendo ambas as datas.",
        },
      },
    },
    empty_state: {
      general: {
        title: "Agrupe e defina prazos para seu trabalho em Ciclos.",
        description:
          "Divida o trabalho em partes com prazos definidos, trabalhe de trás para frente a partir do prazo do seu projeto para definir datas e faça um progresso tangível como equipe.",
        primary_button: {
          text: "Defina seu primeiro ciclo",
          comic: {
            title: "Ciclos são caixas de tempo repetitivas.",
            description:
              "Uma sprint, uma iteração ou qualquer outro termo que você use para rastreamento semanal ou quinzenal do trabalho é um ciclo.",
          },
        },
      },
      no_issues: {
        title: "Nenhum item de trabalho adicionado ao ciclo",
        description: "Adicione ou crie itens de trabalho que você deseja definir prazos e entregar dentro deste ciclo",
        primary_button: {
          text: "Criar novo item de trabalho",
        },
        secondary_button: {
          text: "Adicionar item de trabalho existente",
        },
      },
      completed_no_issues: {
        title: "Nenhum item de trabalho no ciclo",
        description:
          "Nenhum item de trabalho no ciclo. Os itens de trabalho são transferidos ou ocultos. Para ver os itens de trabalho ocultos, se houver, atualize suas propriedades de exibição de acordo.",
      },
      active: {
        title: "Nenhum ciclo ativo",
        description:
          "Um ciclo ativo inclui qualquer período que abranja a data de hoje dentro de seu intervalo. Encontre o progresso e os detalhes do ciclo ativo aqui.",
      },
      archived: {
        title: "Nenhum ciclo arquivado ainda",
        description:
          "Para organizar seu projeto, arquive os ciclos concluídos. Encontre-os aqui quando forem arquivados.",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "Crie um item de trabalho e atribua-o a alguém, mesmo a você mesmo",
        description:
          "Pense nos itens de trabalho como tarefas, trabalhos ou JTBD. O que nós gostamos. Um item de trabalho e seus subitens de trabalho são geralmente acionáveis ​​baseados no tempo atribuídos aos membros de sua equipe. Sua equipe cria, atribui e conclui itens de trabalho para mover seu projeto em direção à sua meta.",
        primary_button: {
          text: "Crie seu primeiro item de trabalho",
          comic: {
            title: "Os itens de trabalho são blocos de construção no Plane.",
            description:
              "Redesenhar a interface do usuário do Plane, reformular a marca da empresa ou lançar o novo sistema de injeção de combustível são exemplos de itens de trabalho que provavelmente têm subitens de trabalho.",
          },
        },
      },
      no_archived_issues: {
        title: "Nenhum item de trabalho arquivado ainda",
        description:
          "Manualmente ou por meio de automação, você pode arquivar itens de trabalho que foram concluídos ou cancelados. Encontre-os aqui quando forem arquivados.",
        primary_button: {
          text: "Definir automação",
        },
      },
      issues_empty_filter: {
        title: "Nenhum item de trabalho encontrado correspondendo aos filtros aplicados",
        secondary_button: {
          text: "Limpar todos os filtros",
        },
      },
    },
  },
  project_module: {
    add_module: "Adicionar Módulo",
    update_module: "Atualizar Módulo",
    create_module: "Criar Módulo",
    archive_module: "Arquivar Módulo",
    restore_module: "Restaurar Módulo",
    delete_module: "Excluir módulo",
    empty_state: {
      general: {
        title: "Mapeie os marcos do seu projeto para Módulos e rastreie o trabalho agregado facilmente.",
        description:
          "Um grupo de itens de trabalho que pertencem a um pai lógico e hierárquico forma um módulo. Pense neles como uma forma de rastrear o trabalho por marcos do projeto. Eles têm seus próprios períodos e prazos, bem como análises para ajudá-lo a ver o quão perto ou longe você está de um marco.",
        primary_button: {
          text: "Construa seu primeiro módulo",
          comic: {
            title: "Os módulos ajudam a agrupar o trabalho por hierarquia.",
            description:
              "Um módulo de carrinho, um módulo de chassi e um módulo de armazém são todos bons exemplos desse agrupamento.",
          },
        },
      },
      no_issues: {
        title: "Nenhum item de trabalho no módulo",
        description: "Crie ou adicione itens de trabalho que você deseja realizar como parte deste módulo",
        primary_button: {
          text: "Criar novos itens de trabalho",
        },
        secondary_button: {
          text: "Adicionar um item de trabalho existente",
        },
      },
      archived: {
        title: "Nenhum Módulo arquivado ainda",
        description:
          "Para organizar seu projeto, arquive os módulos concluídos ou cancelados. Encontre-os aqui quando forem arquivados.",
      },
      sidebar: {
        in_active: "Este módulo ainda não está ativo.",
        invalid_date: "Data inválida. Por favor, insira uma data válida.",
      },
    },
    quick_actions: {
      archive_module: "Arquivar módulo",
      archive_module_description: "Apenas módulos concluídos ou cancelados\npodem ser arquivados.",
      delete_module: "Excluir módulo",
    },
    toast: {
      copy: {
        success: "Link do módulo copiado para a área de transferência",
      },
      delete: {
        success: "Módulo excluído com sucesso",
        error: "Falha ao excluir o módulo",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "Salve visualizações filtradas para o seu projeto. Crie quantas precisar",
        description:
          "As visualizações são um conjunto de filtros salvos que você usa com frequência ou deseja acesso fácil. Todos os seus colegas em um projeto podem ver as visualizações de todos e escolher o que melhor se adapta às suas necessidades.",
        primary_button: {
          text: "Crie sua primeira visualização",
          comic: {
            title: "As visualizações funcionam sobre as propriedades do item de trabalho.",
            description:
              "Você pode criar uma visualização a partir daqui com quantas propriedades como filtros que você achar adequado.",
          },
        },
      },
      filter: {
        title: "Nenhuma visualização correspondente",
        description:
          "Nenhuma visualização corresponde aos critérios de pesquisa.\nCrie uma nova visualização em vez disso.",
      },
    },
    delete_view: {
      title: "Tem certeza de que deseja excluir esta visualização?",
      content:
        "Se você confirmar, todas as opções de classificação, filtro e exibição + o layout que você escolheu para esta visualização serão excluídos permanentemente sem nenhuma maneira de restaurá-los.",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title:
          "Escreva uma nota, um documento ou uma base de conhecimento completa. Peça a Galileo, o assistente de IA do Plane, para ajudá-lo a começar",
        description:
          "As páginas são espaço para registrar pensamentos no Plane. Anote notas de reunião, formate-as facilmente, incorpore itens de trabalho, organize-os usando uma biblioteca de componentes e mantenha-os todos no contexto do seu projeto. Para facilitar qualquer documento, invoque Galileo, a IA do Plane, com um atalho ou o clique de um botão.",
        primary_button: {
          text: "Crie sua primeira página",
        },
      },
      private: {
        title: "Nenhuma página privada ainda",
        description:
          "Mantenha seus pensamentos privados aqui. Quando estiver pronto para compartilhar, a equipe está a apenas um clique de distância.",
        primary_button: {
          text: "Crie sua primeira página",
        },
      },
      public: {
        title: "Nenhuma página pública ainda",
        description: "Veja as páginas compartilhadas com todos em seu projeto aqui mesmo.",
        primary_button: {
          text: "Crie sua primeira página",
        },
      },
      archived: {
        title: "Nenhuma página arquivada ainda",
        description: "Arquive as páginas que não estão no seu radar. Acesse-as aqui quando necessário.",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "Nenhum resultado encontrado",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "Nenhum item de trabalho correspondente encontrado",
      },
      no_issues: {
        title: "Nenhum item de trabalho encontrado",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "Nenhum comentário ainda",
        description:
          "Os comentários podem ser usados como um espaço de discussão e acompanhamento para os itens de trabalho",
      },
    },
  },
  notification: {
    label: "Caixa de entrada",
    page_label: "{workspace} - Caixa de entrada",
    options: {
      mark_all_as_read: "Marcar tudo como lido",
      mark_read: "Marcar como lido",
      mark_unread: "Marcar como não lido",
      refresh: "Atualizar",
      filters: "Filtros da caixa de entrada",
      show_unread: "Mostrar não lidos",
      show_snoozed: "Mostrar adiados",
      show_archived: "Mostrar arquivados",
      mark_archive: "Arquivar",
      mark_unarchive: "Desarquivar",
      mark_snooze: "Adiar",
      mark_unsnooze: "Reativar",
    },
    toasts: {
      read: "Notificação marcada como lida",
      unread: "Notificação marcada como não lida",
      archived: "Notificação marcada como arquivada",
      unarchived: "Notificação marcada como não arquivada",
      snoozed: "Notificação adiada",
      unsnoozed: "Notificação reativada",
    },
    empty_state: {
      detail: {
        title: "Selecione para ver os detalhes.",
      },
      all: {
        title: "Nenhum item de trabalho atribuído",
        description: "As atualizações para itens de trabalho atribuídos a você podem ser\nvistas aqui",
      },
      mentions: {
        title: "Nenhum item de trabalho atribuído",
        description: "As atualizações para itens de trabalho atribuídos a você podem ser\nvistas aqui",
      },
    },
    tabs: {
      all: "Todos",
      mentions: "Menções",
    },
    filter: {
      assigned: "Atribuído a mim",
      created: "Criado por mim",
      subscribed: "Inscrito por mim",
    },
    snooze: {
      "1_day": "1 dia",
      "3_days": "3 dias",
      "5_days": "5 dias",
      "1_week": "1 semana",
      "2_weeks": "2 semanas",
      custom: "Personalizado",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "Adicione itens de trabalho ao ciclo para visualizar seu progresso",
      },
      chart: {
        title: "Adicione itens de trabalho ao ciclo para visualizar o gráfico de burndown.",
      },
      priority_issue: {
        title: "Observe os itens de trabalho de alta prioridade abordados no ciclo rapidamente.",
      },
      assignee: {
        title: "Adicione responsáveis aos itens de trabalho para ver uma divisão do trabalho por responsáveis.",
      },
      label: {
        title: "Adicione etiquetas aos itens de trabalho para ver a divisão do trabalho por etiquetas.",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "A Admissão não está habilitado para o projeto.",
        description:
          "A Admissão ajuda você a gerenciar as solicitações recebidas para o seu projeto e adicioná-las como itens de trabalho em seu fluxo de trabalho. Habilite a admissão nas configurações do projeto para gerenciar as solicitações.",
        primary_button: {
          text: "Gerenciar funcionalidades",
        },
      },
      cycle: {
        title: "Os ciclos não estão habilitados para este projeto.",
        description:
          "Divida o trabalho em partes com prazos definidos, trabalhe de trás para frente a partir do prazo do seu projeto para definir datas e faça um progresso tangível como equipe. Habilite o recurso de ciclos para o seu projeto para começar a usá-los.",
        primary_button: {
          text: "Gerenciar funcionalidades",
        },
      },
      module: {
        title: "Os módulos não estão habilitados para o projeto.",
        description:
          "Os módulos são os blocos de construção do seu projeto. Habilite os módulos nas configurações do projeto para começar a usá-los.",
        primary_button: {
          text: "Gerenciar funcionalidades",
        },
      },
      page: {
        title: "As páginas não estão habilitadas para o projeto.",
        description:
          "As páginas são os blocos de construção do seu projeto. Habilite as páginas nas configurações do projeto para começar a usá-las.",
        primary_button: {
          text: "Gerenciar funcionalidades",
        },
      },
      view: {
        title: "As visualizações não estão habilitadas para o projeto.",
        description:
          "As visualizações são os blocos de construção do seu projeto. Habilite as visualizações nas configurações do projeto para começar a usá-las.",
        primary_button: {
          text: "Gerenciar funcionalidades",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "Rascunhar um item de trabalho",
    empty_state: {
      title: "Itens de trabalho semi-escritos e, em breve, os comentários aparecerão aqui.",
      description:
        "Para experimentar, comece a adicionar um item de trabalho e deixe-o no meio do caminho ou crie seu primeiro rascunho abaixo. 😉",
      primary_button: {
        text: "Criar seu primeiro rascunho",
      },
    },
    delete_modal: {
      title: "Excluir rascunho",
      description: "Tem certeza de que deseja excluir este rascunho? Isso não pode ser desfeito.",
    },
    toasts: {
      created: {
        success: "Rascunho criado",
        error: "Não foi possível criar o item de trabalho. Por favor, tente novamente.",
      },
      deleted: {
        success: "Rascunho excluído",
      },
    },
  },
  stickies: {
    title: "Suas anotações",
    placeholder: "clique para digitar aqui",
    all: "Todas as anotações",
    "no-data": "Anote uma ideia, capture um insight ou registre uma onda cerebral. Adicione uma anotação para começar.",
    add: "Adicionar anotação",
    search_placeholder: "Pesquisar por título",
    delete: "Excluir anotação",
    delete_confirmation: "Tem certeza de que deseja excluir esta anotação?",
    empty_state: {
      simple: "Anote uma ideia, capture um insight ou registre uma onda cerebral. Adicione uma anotação para começar.",
      general: {
        title: "As anotações são notas rápidas e tarefas que você anota rapidamente.",
        description:
          "Capture seus pensamentos e ideias sem esforço, criando anotações que você pode acessar a qualquer momento e de qualquer lugar.",
        primary_button: {
          text: "Adicionar anotação",
        },
      },
      search: {
        title: "Isso não corresponde a nenhuma de suas anotações.",
        description: "Tente um termo diferente ou nos informe\nse você tem certeza de que sua pesquisa está correta.",
        primary_button: {
          text: "Adicionar anotação",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "O nome da anotação não pode ter mais de 100 caracteres.",
        already_exists: "Já existe uma anotação sem descrição",
      },
      created: {
        title: "Anotação criada",
        message: "A anotação foi criada com sucesso",
      },
      not_created: {
        title: "Anotação não criada",
        message: "A anotação não pôde ser criada",
      },
      updated: {
        title: "Anotação atualizada",
        message: "A anotação foi atualizada com sucesso",
      },
      not_updated: {
        title: "Anotação não atualizada",
        message: "A anotação não pôde ser atualizada",
      },
      removed: {
        title: "Anotação removida",
        message: "A anotação foi removida com sucesso",
      },
      not_removed: {
        title: "Anotação não removida",
        message: "A anotação não pôde ser removida",
      },
    },
  },
  role_details: {
    guest: {
      title: "Convidado",
      description: "Membros externos de organizações podem ser convidados como convidados.",
    },
    member: {
      title: "Membro",
      description: "Capacidade de ler, escrever, editar e excluir entidades dentro de projetos, ciclos e módulos",
    },
    admin: {
      title: "Administrador",
      description: "Todas as permissões definidas como verdadeiras dentro do espaço de trabalho.",
    },
  },
  user_roles: {
    product_or_project_manager: "Gerente de Produto / Projeto",
    development_or_engineering: "Desenvolvimento / Engenharia",
    founder_or_executive: "Fundador / Executivo",
    freelancer_or_consultant: "Freelancer / Consultor",
    marketing_or_growth: "Marketing / Crescimento",
    sales_or_business_development: "Vendas / Desenvolvimento de Negócios",
    support_or_operations: "Suporte / Operações",
    student_or_professor: "Estudante / Professor",
    human_resources: "Recursos Humanos",
    other: "Outro",
  },
  importer: {
    github: {
      title: "Github",
      description: "Importe itens de trabalho de repositórios do GitHub e sincronize-os.",
    },
    jira: {
      title: "Jira",
      description: "Importe itens de trabalho e épicos de projetos e épicos do Jira.",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "Exporte itens de trabalho para um arquivo CSV.",
      short_description: "Exportar como CSV",
    },
    excel: {
      title: "Excel",
      description: "Exporte itens de trabalho para um arquivo Excel.",
      short_description: "Exportar como Excel",
    },
    xlsx: {
      title: "Excel",
      description: "Exporte itens de trabalho para um arquivo Excel.",
      short_description: "Exportar como Excel",
    },
    json: {
      title: "JSON",
      description: "Exporte itens de trabalho para um arquivo JSON.",
      short_description: "Exportar como JSON",
    },
  },
  default_global_view: {
    all_issues: "Todos os itens de trabalho",
    assigned: "Atribuído",
    created: "Criado",
    subscribed: "Inscrito",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "Preferência do sistema",
      },
      light: {
        label: "Claro",
      },
      dark: {
        label: "Escuro",
      },
      light_contrast: {
        label: "Alto contraste claro",
      },
      dark_contrast: {
        label: "Alto contraste escuro",
      },
      custom: {
        label: "Tema personalizado",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "Backlog",
      planned: "Planejado",
      in_progress: "Em Andamento",
      paused: "Pausado",
      completed: "Concluído",
      cancelled: "Cancelado",
    },
    layout: {
      list: "Layout de lista",
      board: "Layout de galeria",
      timeline: "Layout de linha do tempo",
    },
    order_by: {
      name: "Nome",
      progress: "Progresso",
      issues: "Número de itens de trabalho",
      due_date: "Data de vencimento",
      created_at: "Data de criação",
      manual: "Manual",
    },
  },
  cycle: {
    label: "{count, plural, one {Ciclo} other {Ciclos}}",
    no_cycle: "Nenhum ciclo",
  },
  module: {
    label: "{count, plural, one {Módulo} other {Módulos}}",
    no_module: "Nenhum módulo",
  },
  description_versions: {
    last_edited_by: "Última edição por",
    previously_edited_by: "Anteriormente editado por",
    edited_by: "Editado por",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "O Plane não inicializou. Isso pode ser porque um ou mais serviços do Plane falharam ao iniciar.",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "Escolha View Logs do setup.sh e logs do Docker para ter certeza.",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "Estrutura",
        empty_state: {
          title: "Cabeçalhos ausentes",
          description: "Vamos adicionar alguns cabeçalhos nesta página para vê-los aqui.",
        },
      },
      info: {
        label: "Info",
        document_info: {
          words: "Palavras",
          characters: "Caracteres",
          paragraphs: "Parágrafos",
          read_time: "Tempo de leitura",
        },
        actors_info: {
          edited_by: "Editado por",
          created_by: "Criado por",
        },
        version_history: {
          label: "Histórico de versões",
          current_version: "Versão atual",
        },
      },
      assets: {
        label: "Recursos",
        download_button: "Baixar",
        empty_state: {
          title: "Imagens ausentes",
          description: "Adicione imagens para vê-las aqui.",
        },
      },
    },
    open_button: "Abrir painel de navegação",
    close_button: "Fechar painel de navegação",
    outline_floating_button: "Abrir estrutura",
  },
} as const;
