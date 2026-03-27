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
      "Estamos trabalhando nisso. Se você precisar de assistência imediata,",
    reach_out_to_us: "entre em contato conosco",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our:
      "Caso contrário, tente atualizar a página ocasionalmente ou visite nossa",
    status_page: "página de status",
  },
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
    pi_chat: "Chat AI",
    initiatives: "Iniciativas",
    teamspaces: "Espaços de equipe",
    epics: "Épicos",
    upgrade_plan: "Atualizar plano",
    plane_pro: "Plane Pro",
    business: "Business",
    customers: "Clientes",
    recurring_work_items: "Itens de trabalho recorrentes",
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
      username: {
        label: "Nome de usuário",
        placeholder: "Digite seu nome de usuário",
      },
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
    ldap: {
      header: {
        label: "Continuar com {ldapProviderName}",
        sub_header: "Digite suas credenciais {ldapProviderName}",
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
  activity_empty_state: {
    no_activity: "Nenhuma atividade ainda",
    no_transitions: "Nenhuma transição ainda",
  },
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
  select_the_cursor_motion_style_that_feels_right_for_you:
    "Selecione o estilo de movimento do cursor que parece certo para você.",
  theme: "Tema",
  smooth_cursor: "Cursor Suave",
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
    "Ajuda você a identificar itens de trabalho no projeto de forma exclusiva. Máximo de 50 caracteres.",
  description_placeholder: "Descrição",
  only_alphanumeric_non_latin_characters_allowed: "Apenas caracteres alfanuméricos e não latinos são permitidos.",
  project_id_is_required: "O ID do projeto é obrigatório",
  project_id_allowed_char: "Apenas caracteres alfanuméricos e não latinos são permitidos.",
  project_id_min_char: "O ID do projeto deve ter pelo menos 1 caractere",
  project_id_max_char: "O ID do projeto deve ter no máximo {max} caracteres",
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
  pages: {
    link_pages: "Conectar páginas",
    show_wiki_pages: "Mostrar páginas wiki",
    link_pages_to: "Conectar páginas a",
    linked_pages: "Páginas vinculadas",
    no_description: "Esta página está vazia. Escreva algo aqui e veja isso como este espaço reservado",
    toasts: {
      link: {
        success: {
          title: "Páginas atualizadas",
          message: "Páginas atualizadas com sucesso",
        },
        error: {
          title: "Páginas não atualizadas",
          message: "Páginas não puderam ser atualizadas",
        },
      },
      remove: {
        success: {
          title: "Página removida",
          message: "Página removida com sucesso",
        },
        error: {
          title: "Página não removida",
          message: "Página não pôde ser removida",
        },
      },
    },
  },
  intake: "Admissão",
  renew: "Renovar",
  preview: "Visualização",
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
  forum: "Forum",
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
  transition: "Transição",
  history: "Histórico",
  priority: "Prioridade",
  none: "Nenhum",
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
  members: "Membros",
  assignee: "Responsável",
  assignees: "Responsáveis",
  subscriber: "{count, plural, one{# Inscrito} other{# Inscritos}}",
  you: "Você",
  labels: "Etiquetas",
  create_new_label: "Criar nova etiqueta",
  label_name: "Nome da etiqueta",
  failed_to_create_label: "Falha ao criar etiqueta. Por favor, tente novamente.",
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
  upgrade_request: "Peça ao administrador do espaço de trabalho para fazer upgrade.",
  copied_to_clipboard: "Copiado para a área de transferência",
  copied_to_clipboard_description: "A URL foi copiada com sucesso para a área de transferência",
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
        description: `Parece que todos os seus widgets estão desativados. Ative-os
agora para melhorar sua experiência!`,
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
    business_trial_banner: {
      title: "Seu teste de 14 dias do plano Business está ativo!",
      description:
        "Explore todos os recursos Business. Quando estiver pronto, escolha assinar. Você não será cobrado automaticamente.",
      trial_ends_today: "O teste termina hoje",
      trial_ends_in_days: "O teste termina em {days, plural, one {# dia} other {# dias}}",
      start_subscription: "Iniciar assinatura",
      explore_business_features: "Explorar recursos Business",
    },
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
    updated_at: "Atualizado em",
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
    additional_updates: "Atualizações adicionais",
    clear_all: "Limpar tudo",
    copied: "Copiado!",
    link_copied: "Link copiado!",
    link_copied_to_clipboard: "Link copiado para a área de transferência",
    copied_to_clipboard: "Link do item de trabalho copiado para a área de transferência",
    branch_name_copied_to_clipboard: "Nome do branch copiado para a área de transferência",
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
      copy_branch_name: "Copiar nome do branch",
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
    worklogs: "Registros de trabalho",
    project_updates: "Atualizações do projeto",
    overview: "Visão geral",
    workflows: "Fluxos de trabalho",
    templates: "Modelos",
    members_and_teamspaces: "Membros e espaços de equipe",
    open_in_full_screen: "Abrir {page} em tela cheia",
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
    archive: {
      description: `Apenas épicos concluídos ou cancelados
podem ser arquivados`,
      label: "Arquivar Épico",
      confirm_message:
        "Tem certeza de que deseja arquivar o épico? Todos os seus épicos arquivados podem ser restaurados posteriormente.",
      success: {
        label: "Arquivamento bem-sucedido",
        message: "Seus arquivos podem ser encontrados nos arquivos do projeto.",
      },
      failed: {
        message: "Não foi possível arquivar o épico. Por favor, tente novamente.",
      },
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
      description: `Apenas itens de trabalho concluídos ou cancelados
podem ser arquivados`,
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
      start_before: "Inicia antes",
      start_after: "Inicia depois",
      finish_before: "Termina antes",
      finish_after: "Termina depois",
      implements: "Implementa",
      implemented_by: "Implementado por",
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
    vote: {
      click_to_upvote: "Clique para votar a favor",
      click_to_downvote: "Clique para votar contra",
      click_to_view_upvotes: "Clique para ver os votos a favor",
      click_to_view_downvotes: "Clique para ver os votos contra",
    },
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
      body: `Olá, administrador(es) da instância,

Por favor, crie um novo espaço de trabalho com o URL [/nome-do-espaço-de-trabalho] para [finalidade de criar o espaço de trabalho].

Obrigado,
{firstName} {lastName}
{email}`,
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
      cycle_progress: {
        title: "Ainda não há dados",
        description:
          "A análise de progresso do ciclo aparecerá aqui. Adicione itens de trabalho aos ciclos para começar a acompanhar o progresso.",
      },
      module_progress: {
        title: "Ainda não há dados",
        description:
          "A análise de progresso do módulo aparecerá aqui. Adicione itens de trabalho aos módulos para começar a acompanhar o progresso.",
      },
      intake_trends: {
        title: "Ainda não há dados",
        description:
          "A análise de tendências de intake aparecerá aqui. Adicione itens de trabalho ao intake para começar a acompanhar as tendências.",
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
    projects_by_status: "Projetos por status",
    active_users: "Usuários ativos",
    intake_trends: "Tendências de entrada",
    workitem_resolved_vs_pending: "Itens de trabalho resolvidos vs pendentes",
    upgrade_to_plan: "Faça upgrade para {plan} para desbloquear {tab}",
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
        description: `Nenhum projeto detectado com os critérios correspondentes.
 Crie um novo projeto em vez disso.`,
      },
      search: {
        description: `Nenhum projeto detectado com os critérios correspondentes.
Crie um novo projeto em vez disso`,
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
    notifications: {
      select_default_view: "Selecionar visualização padrão",
      compact: "Compacto",
      full: "Tela cheia",
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
        heading: "Tokens de API",
        description: "Gere tokens de API seguros para integrar seus dados com sistemas e aplicativos externos.",
        title: "Tokens de API",
        add_token: "Adicionar token de acesso",
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
      integrations: {
        title: "Integrações",
        page_title: "Trabalhe com seus dados do Plane em aplicativos disponíveis ou nos seus próprios.",
        page_description: "Veja todas as integrações em uso por este workspace ou por você.",
      },
      imports: {
        title: "Importações",
      },
      worklogs: {
        title: "Registros de trabalho",
      },
      group_syncing: {
        title: "Sincronização de grupos",
        heading: "Sincronização de grupos",
        description:
          "Vincule grupos do provedor de identidade a projetos e funções. O acesso do usuário é atualizado automaticamente quando a associação ao grupo muda no seu IdP, simplificando onboarding e offboarding.",
        enable: {
          title: "Ativar sincronização de grupos",
          description: "Adicione automaticamente usuários a projetos com base nos grupos do provedor de identidade.",
        },
        config: {
          title: "Configurar sincronização de grupos",
          description: "Configure como os grupos do provedor de identidade são mapeados para projetos e funções.",
          sync_on_login: {
            title: "Sincronizar no login",
            description: "Atualize a associação ao grupo e o acesso ao projeto quando um usuário fizer login.",
          },
          sync_offline: {
            title: "Sincronização offline",
            description:
              "Executa a sincronização a cada seis horas automaticamente, sem esperar que os usuários façam login.",
          },
          auto_remove: {
            title: "Remoção automática",
            description: "Remova automaticamente usuários dos projetos quando não corresponderem mais ao grupo.",
          },
          group_attribute_key: {
            title: "Chave do atributo de grupo",
            description:
              "O atributo do provedor de identidade usado para identificar e sincronizar grupos de usuários.",
            placeholder: "Grupos",
          },
        },
        group_mapping: {
          title: "Mapeamento de grupos",
          description: "Vincule grupos do provedor de identidade a projetos e funções.",
          button_text: "Adicionar nova sincronização de grupo",
        },
        toast: {
          updating: "Atualizando recurso de sincronização de grupos",
          success: "Recurso de sincronização de grupos atualizado com sucesso.",
          error: "Falha ao atualizar o recurso de sincronização de grupos!",
        },
        delete_modal: {
          title: "Excluir sincronização de grupo",
          content:
            "Novos usuários deste grupo de identidade não serão mais adicionados ao projeto. Usuários já adicionados manterão sua função atual.",
        },
        modal: {
          idp_group_name: {
            text: "Grupo de usuários",
            required: "O grupo de usuários é obrigatório",
            placeholder: "Digite os nomes dos grupos IdP",
          },
          project: {
            text: "Projeto",
            required: "O projeto é obrigatório",
            placeholder: "Selecione um projeto",
          },
          default_role: {
            text: "Função do projeto",
            required: "A função do projeto é obrigatória",
            placeholder: "Selecione uma função do projeto",
          },
        },
      },
      identity: {
        title: "Identidade",
        heading: "Identidade",
        description: "Configure seu domínio e habilite o Single sign-on",
      },
      project_states: {
        title: "Estados do projeto",
      },
      projects: {
        title: "Projetos",
        description: "Gerencie estados de projetos, ative etiquetas de projetos e outras configurações.",
        tabs: {
          states: "Estados do projeto",
          labels: "Etiquetas do projeto",
        },
      },
      teamspaces: {
        title: "Espaços de equipe",
      },
      initiatives: {
        title: "Iniciativas",
      },
      customers: {
        title: "Clientes",
      },
      releases: {
        title: "Lançamentos",
        update_release: "Atualizar lançamento",
        create_release: "Criar lançamento",
        errors: {
          release_not_found: "O lançamento que você está procurando não existe.",
          unknown: "Algo deu errado. Tente novamente.",
        },
      },

      cancel_trial: {
        title: "Cancele seu período de teste primeiro.",
        description:
          "Você tem um período de teste ativo para um de nossos planos pagos. Por favor, cancele-o primeiro para prosseguir.",
        dismiss: "Dispensar",
        cancel: "Cancelar período de teste",
        cancel_success_title: "Período de teste cancelado.",
        cancel_success_message: "Agora você pode excluir o workspace.",
        cancel_error_title: "Isso não funcionou.",
        cancel_error_message: "Tente novamente, por favor.",
      },
      applications: {
        title: "Aplicativos",
        applicationId_copied: "ID da aplicação copiado para a área de transferência",
        clientId_copied: "ID do cliente copiado para a área de transferência",
        clientSecret_copied: "Chave secreta do cliente copiado para a área de transferência",
        third_party_apps: "Aplicativos de terceiros",
        your_apps: "Seus aplicativos",
        connect: "Conectar",
        connected: "Conectado",
        install: "Instalar",
        installed: "Instalado",
        configure: "Configurar",
        app_available: "Você fez este aplicativo disponível para uso com um workspace do Plane",
        app_available_description: "Conecte um workspace do Plane para começar a usar",
        client_id_and_secret: "ID do cliente e chave secreta",
        client_id_and_secret_description:
          "Copie e salve esta chave secreta em Páginas. Você não poderá ver esta chave novamente após fechar.",
        client_id_and_secret_download: "Você pode baixar um CSV com a chave aqui.",
        application_id: "ID da aplicação",
        client_id: "ID do cliente",
        client_secret: "Chave secreta do cliente",
        export_as_csv: "Exportar como CSV",
        slug_already_exists: "Slug já existe",
        failed_to_create_application: "Falha ao criar aplicação",
        upload_logo: "Carregar logo",
        app_name_title: "Como você vai chamar este aplicativo",
        app_name_error: "Nome do aplicativo é obrigatório",
        app_short_description_title: "Dê este aplicativo uma descrição curta",
        app_short_description_error: "Descrição curta do aplicativo é obrigatória",
        app_description_title: {
          label: "Descrição longa",
          placeholder: "Escreva uma descrição longa para o marketplace. Pressione '/' para comandos.",
        },
        authorization_grant_type: {
          title: "Tipo de conexão",
          description:
            "Escolha se seu aplicativo deve ser instalado uma vez para o workspace ou permitir que cada usuário conecte sua própria conta",
        },
        app_description_error: "Descrição do aplicativo é obrigatória",
        app_slug_title: "Slug do aplicativo",
        app_slug_error: "Slug do aplicativo é obrigatório",
        app_maker_title: "Criador de aplicativos",
        app_maker_error: "Criador de aplicativos é obrigatório",
        webhook_url_title: "URL do webhook",
        webhook_url_error: "URL do webhook é obrigatória",
        invalid_webhook_url_error: "URL do webhook inválida",
        redirect_uris_title: "Redirect URIs",
        redirect_uris_error: "Redirect URIs são obrigatórias",
        invalid_redirect_uris_error: "Redirect URIs inválidas",
        redirect_uris_description:
          "Digite URIs separados por espaço onde o aplicativo redirecionará para o usuário após e.g https://example.com https://example.com/",
        authorized_javascript_origins_title: "Origens de Javascript autorizadas",
        authorized_javascript_origins_error: "Origens de Javascript autorizadas são obrigatórias",
        invalid_authorized_javascript_origins_error: "Origens de Javascript autorizadas inválidas",
        authorized_javascript_origins_description:
          "Digite origens separadas por espaço onde o aplicativo será permitido fazer solicitações e.g app.com example.com",
        create_app: "Criar aplicativo",
        update_app: "Atualizar aplicativo",
        regenerate_client_secret_description:
          "Regenerar a chave secreta do cliente. Se você regenerar a chave, poderá copiar a chave ou baixá-la para um arquivo CSV logo após.",
        regenerate_client_secret: "Regenerar chave secreta do cliente",
        regenerate_client_secret_confirm_title: "Tem certeza que deseja regenerar a chave secreta do cliente?",
        regenerate_client_secret_confirm_description:
          "O aplicativo que usa esta chave secreta deixará de funcionar. Você precisará atualizar a chave secreta no aplicativo.",
        regenerate_client_secret_confirm_cancel: "Cancelar",
        regenerate_client_secret_confirm_regenerate: "Regenerar",
        read_only_access_to_workspace: "Acesso de leitura ao seu workspace",
        write_access_to_workspace: "Acesso de escrita ao seu workspace",
        read_only_access_to_user_profile: "Acesso de leitura ao seu perfil de usuário",
        write_access_to_user_profile: "Acesso de escrita ao seu perfil de usuário",
        connect_app_to_workspace: "Conectar {app} ao seu workspace {workspace}",
        user_permissions: "Permissões de usuário",
        user_permissions_description: "Permissões de usuário são usadas para conceder acesso ao perfil do usuário.",
        workspace_permissions: "Permissões de workspace",
        workspace_permissions_description: "Permissões de workspace são usadas para conceder acesso ao workspace.",
        with_the_permissions: "com as permissões",
        app_consent_title: "{app} está solicitando acesso ao seu workspace do Plane e perfil.",
        choose_workspace_to_connect_app_with: "Escolha um workspace para conectar o aplicativo",
        app_consent_workspace_permissions_title: "{app} gostaria de",
        app_consent_user_permissions_title:
          "{app} também pode solicitar permissão de um usuário para os seguintes recursos. Essas permissões serão solicitadas e autorizadas apenas por um usuário.",
        app_consent_accept_title: "Ao aceitar, você",
        app_consent_accept_1:
          "Conceda ao aplicativo acesso aos seus dados do Plane onde você puder usar o aplicativo dentro ou fora do Plane",
        app_consent_accept_2: "Concorda com a Política de Privacidade e Termos de Uso de {app}",
        accepting: "Aceitando...",
        accept: "Aceitar",
        categories: "Categorias",
        select_app_categories: "Selecione as categorias do aplicativo",
        categories_title: "Categorias",
        categories_error: "Categorias são obrigatórias",
        invalid_categories_error: "Categorias inválidas",
        categories_description: "Selecione as categorias que melhor descrevem o aplicativo",
        supported_plans: "Planos Suportados",
        supported_plans_description:
          "Selecione os planos de workspace que podem instalar esta aplicação. Deixe vazio para permitir todos os planos.",
        select_plans: "Selecionar Planos",
        privacy_policy_url_title: "URL da Política de Privacidade",
        privacy_policy_url_error: "URL da Política de Privacidade é obrigatória",
        invalid_privacy_policy_url_error: "URL da Política de Privacidade inválida",
        terms_of_service_url_title: "URL dos Termos de Serviço",
        terms_of_service_url_error: "URL dos Termos de Serviço é obrigatória",
        invalid_terms_of_service_url_error: "URL dos Termos de Serviço inválida",
        support_url_title: "URL de Suporte",
        support_url_error: "URL de Suporte é obrigatória",
        invalid_support_url_error: "URL de Suporte inválida",
        video_url_title: "URL do Vídeo",
        video_url_error: "URL do Vídeo é obrigatória",
        invalid_video_url_error: "URL do Vídeo inválida",
        setup_url_title: "URL de Configuração",
        setup_url_error: "URL de Configuração é obrigatória",
        invalid_setup_url_error: "URL de Configuração inválida",
        configuration_url_title: "URL de Configuração",
        configuration_url_error: "URL de Configuração é obrigatória",
        invalid_configuration_url_error: "URL de Configuração inválida",
        contact_email_title: "Email de Contato",
        contact_email_error: "Email de Contato é obrigatório",
        invalid_contact_email_error: "Email de Contato inválido",
        upload_attachments: "Carregar Anexos",
        uploading_images: "Carregando {count} Imagem{count, plural, one {s} other {s}}",
        drop_images_here: "Arraste e solte as imagens aqui",
        click_to_upload_images: "Clique para carregar imagens",
        invalid_file_or_exceeds_size_limit: "Arquivo inválido ou excede o limite de tamanho ({size} MB)",
        uploading: "Carregando...",
        upload_and_save: "Carregar e salvar",
        app_credentials_regenrated: {
          title: "As credenciais do aplicativo foram regeneradas com sucesso",
          description:
            "Substitua o segredo do cliente em todos os lugares onde for usado. O segredo anterior não é mais válido.",
        },
        app_created: {
          title: "Aplicativo criado com sucesso",
          description: "Use as credenciais para instalar o aplicativo em um workspace Plane",
        },
        installed_apps: "Aplicativos instalados",
        all_apps: "Todos os aplicativos",
        internal_apps: "Aplicativos internos",
        website: {
          title: "Site",
          description: "Link para o site do seu aplicativo.",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "Criador de aplicativos",
          description: "A pessoa ou organização que está criando o aplicativo.",
        },
        setup_url: {
          label: "URL de configuração",
          description: "Os usuários serão redirecionados para este URL quando instalarem o aplicativo.",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "URL do webhook",
          description:
            "É aqui que enviaremos eventos e atualizações do webhook a partir dos workspaces onde seu aplicativo está instalado.",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "URIs de redirecionamento (separadas por espaço)",
          description: "Os usuários serão redirecionados para este caminho após se autenticarem com o Plane.",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "Este aplicativo só pode ser instalado depois que um administrador do workspace o instalar. Entre em contato com o administrador do seu workspace para continuar.",
        enable_app_mentions: "Ativar menções do aplicativo",
        enable_app_mentions_tooltip:
          "Quando isso está ativado, os usuários podem mencionar ou atribuir Work Items a este aplicativo.",
        scopes: "Escopos",
        select_scopes: "Selecionar escopos",
        read_access_to: "Acesso somente leitura a",
        write_access_to: "Acesso de gravação a",
        global_permission_expiration:
          "Os escopos globais estão expirando em breve. Use escopos granulares em vez disso. Por exemplo, use project:read em vez de uma leitura global.",
        selected_scopes: "{count} selecionado(s)",
        scopes_and_permissions: "Escopos e permissões",
        read: "Leitura",
        write: "Gravação",
        scope_description: {
          projects: "Acesso a projetos e todas as entidades relacionadas a projetos",
          wiki: "Acesso ao wiki e todas as entidades relacionadas ao wiki",
          customers: "Acesso a clientes e todas as entidades relacionadas a clientes",
          initiatives: "Acesso a iniciativas e todas as entidades relacionadas a iniciativas",
          workspaces: "Acesso a workspaces e todas as entidades relacionadas",
          stickies: "Acesso a stickies e todas as entidades relacionadas a stickies",
          teamspaces: "Acesso a teamspaces e todas as entidades relacionadas a teamspaces",
          profile: "Acesso às informações do perfil do usuário",
          agents: "Acesso a agentes e todas as entidades relacionadas a agentes",
          assets: "Acesso a ativos e todas as entidades relacionadas a ativos",
        },
        build_your_own_app: "Crie seu próprio aplicativo",
        edit_app_details: "Editar detalhes do aplicativo",
        internal: "Interno",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description:
          "Veja seu trabalho se tornar mais inteligente e mais rápido com IA que está conectada de forma nativa ao seu trabalho e base de conhecimentos.",
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
      connections: "Conexões",
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
      project_lead_description: "Selecione o líder do projeto.",
      default_assignee_description: "Selecione o responsável padrão do projeto.",
      project_subscribers: "Assinantes do projeto",
      project_subscribers_description: "Selecione os membros que receberão notificações deste projeto.",
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
        reorder: {
          success: {
            title: "Estimativas reordenadas",
            message: "As estimativas foram reordenadas no seu projeto.",
          },
          error: {
            title: "Falha ao reordenar estimativas",
            message: "Não foi possível reordenar as estimativas, tente novamente",
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
        fill: "Por favor, preencha este campo de estimativa",
        repeat: "O valor da estimativa não pode ser repetido",
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
      edit: {
        title: "Editar sistema de estimativas",
        add_or_update: {
          title: "Adicionar, atualizar ou remover estimativas",
          description: "Gerencie o sistema atual adicionando, atualizando ou removendo os pontos ou categorias.",
        },
        switch: {
          title: "Alterar tipo de estimativa",
          description: "Converta seu sistema de pontos em sistema de categorias e vice-versa.",
        },
      },
      switch: "Alternar sistema de estimativas",
      current: "Sistema de estimativas atual",
      select: "Selecione um sistema de estimativas",
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
      integrations: {
        title: "Nenhuma integração configurada",
        description: "Configure o GitHub e outras integrações para sincronizar os itens de trabalho do seu projeto.",
      },
    },
    initiatives: {
      heading: "Iniciativas",
      sub_heading: "Desbloqueie o mais alto nível de organização para todo o seu trabalho no Plane.",
      title: "Ativar Iniciativas",
      description: "Estabeleça metas maiores para monitorar o progresso",
      toast: {
        updating: "Atualizando recurso de iniciativas",
        enable_success: "Recurso de iniciativas ativado com sucesso.",
        disable_success: "Recurso de iniciativas desativado com sucesso.",
        error: "Falha ao atualizar recurso de iniciativas!",
      },
    },
    customers: {
      heading: "Clientes",
      settings_heading: "Gerencie o trabalho pelo que é importante para seus clientes.",
      settings_sub_heading:
        "Traga solicitações de clientes para itens de trabalho, atribua prioridade por solicitações e agrupe os estados dos itens de trabalho em registros de clientes. Em breve, você poderá integrar com seu CRM ou ferramenta de Suporte para uma gestão de trabalho ainda melhor por atributos de cliente.",
    },
    epics: {
      properties: {
        title: "Propriedades",
        description: "Adicione propriedades personalizadas ao seu épico.",
      },
      disabled: "Desativado",
    },
    cycles: {
      auto_schedule: {
        heading: "Agendamento automático de ciclos",
        description: "Mantenha os ciclos em movimento sem configuração manual.",
        tooltip: "Crie automaticamente novos ciclos com base na programação escolhida.",
        edit_button: "Editar",
        form: {
          cycle_title: {
            label: "Título do ciclo",
            placeholder: "Título",
            tooltip: "O título será acrescido de números para os ciclos subsequentes. Por exemplo: Design - 1/2/3",
            validation: {
              required: "O título do ciclo é obrigatório",
              max_length: "O título não deve exceder 255 caracteres",
            },
          },
          cycle_duration: {
            label: "Duração do ciclo",
            unit: "Semanas",
            validation: {
              required: "A duração do ciclo é obrigatória",
              min: "A duração do ciclo deve ser de pelo menos 1 semana",
              max: "A duração do ciclo não pode exceder 30 semanas",
              positive: "A duração do ciclo deve ser positiva",
            },
          },
          cooldown_period: {
            label: "Período de resfriamento",
            unit: "dias",
            tooltip: "Pausa entre ciclos antes do início do próximo.",
            validation: {
              required: "O período de resfriamento é obrigatório",
              negative: "O período de resfriamento não pode ser negativo",
            },
          },
          start_date: {
            label: "Dia de início do ciclo",
            validation: {
              required: "A data de início é obrigatória",
              past: "A data de início não pode estar no passado",
            },
          },
          number_of_cycles: {
            label: "Número de ciclos futuros",
            validation: {
              required: "O número de ciclos é obrigatório",
              min: "Pelo menos 1 ciclo é obrigatório",
              max: "Não é possível agendar mais de 3 ciclos",
            },
          },
          auto_rollover: {
            label: "Transferência automática de itens de trabalho",
            tooltip:
              "No dia em que um ciclo for concluído, mover todos os itens de trabalho não concluídos para o próximo ciclo.",
          },
        },
        toast: {
          toggle: {
            loading_enable: "Ativando agendamento automático de ciclos",
            loading_disable: "Desativando agendamento automático de ciclos",
            success: {
              title: "Sucesso!",
              message: "Agendamento automático de ciclos ativado com sucesso.",
            },
            error: {
              title: "Erro!",
              message: "Falha ao ativar o agendamento automático de ciclos.",
            },
          },
          save: {
            loading: "Salvando configuração de agendamento automático de ciclos",
            success: {
              title: "Sucesso!",
              message_create: "Configuração de agendamento automático de ciclos salva com sucesso.",
              message_update: "Configuração de agendamento automático de ciclos atualizada com sucesso.",
            },
            error: {
              title: "Erro!",
              message_create: "Falha ao salvar a configuração de agendamento automático de ciclos.",
              message_update: "Falha ao atualizar a configuração de agendamento automático de ciclos.",
            },
          },
        },
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
        intake_responsibility: "Responsabilidade de recebimento",
        intake_sources: "Fontes de recebimento",
        title: "Recepção",
        short_title: "Recepção",
        description:
          "Permita que não membros compartilhem bugs, feedback e sugestões; sem interromper seu fluxo de trabalho.",
        toggle_title: "Ativar recepção",
        toggle_description: "Permitir que membros do projeto criem solicitações de recepção no aplicativo.",
        toggle_tooltip_on: "Peça ao administrador do projeto para ativar.",
        toggle_tooltip_off: "Peça ao administrador do projeto para desativar.",
        notify_assignee: {
          title: "Notificar responsáveis",
          description:
            "Para uma nova solicitação de recebimento, os responsáveis padrão serão alertados via notificações",
        },
        in_app: {
          title: "No aplicativo",
          description:
            "Receba novos itens de trabalho de membros e convidados do seu espaço de trabalho sem perturbar os existentes.",
        },
        email: {
          title: "E-mail",
          description: "Colete novos itens de trabalho de qualquer pessoa que envie um e-mail para um endereço Plane.",
          fieldName: "ID do e-mail",
        },
        form: {
          title: "Formulários",
          description:
            "Permita que pessoas fora do seu espaço de trabalho criem possíveis novos itens de trabalho por meio de um formulário dedicado e seguro.",
          fieldName: "URL do formulário padrão",
          create_forms: "Criar formulários usando tipos de itens de trabalho",
          manage_forms: "Gerenciar formulários",
          manage_forms_tooltip: "Peça ao administrador do espaço de trabalho para gerenciar.",
          create_form: "Criar formulário",
          edit_form: "Editar detalhes do formulário",
          form_title: "Título do formulário",
          form_title_required: "O título do formulário é obrigatório",
          work_item_type: "Tipo de item de trabalho",
          remove_property: "Remover propriedade",
          select_properties: "Selecionar propriedades",
          search_placeholder: "Pesquisar propriedades",
          toasts: {
            success_create: "Formulário de recebimento criado com sucesso",
            success_update: "Formulário de recebimento atualizado com sucesso",
            error_create: "Falha ao criar formulário de recebimento",
            error_update: "Falha ao atualizar formulário de recebimento",
          },
        },
        toasts: {
          set: {
            loading: "Definindo responsáveis...",
            success: {
              title: "Sucesso!",
              message: "Responsáveis definidos com sucesso.",
            },
            error: {
              title: "Erro!",
              message: "Algo deu errado ao definir os responsáveis. Por favor, tente novamente.",
            },
          },
        },
      },
      time_tracking: {
        title: "Rastreamento de tempo",
        short_title: "Rastreamento de tempo",
        description: "Registre o tempo gasto em itens de trabalho e projetos.",
        toggle_title: "Ativar rastreamento de tempo",
        toggle_description: "Os membros do projeto poderão registrar o tempo trabalhado.",
      },
      milestones: {
        title: "Marcos",
        short_title: "Marcos",
        description:
          "Os marcos fornecem uma camada para alinhar itens de trabalho em direção a datas de conclusão compartilhadas.",
        toggle_title: "Ativar marcos",
        toggle_description: "Organize itens de trabalho por prazos de marcos.",
      },
      toasts: {
        loading: "Atualizando recurso do projeto...",
        success: "Recurso do projeto atualizado com sucesso.",
        error: "Algo deu errado ao atualizar o recurso do projeto. Por favor, tente novamente.",
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
    transfer_work_items: "Transferir {count} itens de trabalho",
    transfer: {
      no_cycles_available: "Não há outros ciclos disponíveis para transferir itens de trabalho.",
    },
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
      trailing: "Atrasado",
      leading: "Adiantado",
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
      archive_module_description: `Apenas módulos concluídos ou cancelados
podem ser arquivados.`,
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
        description: `Nenhuma visualização corresponde aos critérios de pesquisa.
Crie uma nova visualização em vez disso.`,
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
        description: `As atualizações para itens de trabalho atribuídos a você podem ser
vistas aqui`,
      },
      mentions: {
        title: "Nenhum item de trabalho atribuído",
        description: `As atualizações para itens de trabalho atribuídos a você podem ser
vistas aqui`,
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
        description: `Tente um termo diferente ou nos informe
se você tem certeza de que sua pesquisa está correta.`,
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
          highlight_changes: "Destacar alterações",
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
  workspace_dashboards: "Dashboards",
  pi_chat: "Chat AI",
  in_app: "No aplicativo",
  forms: "Formulários",
  choose_workspace_for_integration: "Escolha um espaço de trabalho para conectar esta aplicação",
  integrations_description:
    "Aplicações que funcionam com Plane devem se conectar a um espaço de trabalho onde você é administrador.",
  create_a_new_workspace: "Criar um novo espaço de trabalho",
  no_workspaces_to_connect: "Nenhum espaço de trabalho para conectar",
  no_workspaces_to_connect_description:
    "Você precisa criar um espaço de trabalho para poder conectar integrações e templates",
  learn_more_about_workspaces: "Saiba mais sobre espaços de trabalho",
  updates: {
    add_update: "Adicionar atualização",
    add_update_placeholder: "Adicione sua atualização aqui",
    empty: {
      title: "Ainda não há atualizações",
      description: "Você pode ver as atualizações aqui.",
    },
    delete: {
      title: "Deletar atualização",
      confirmation: "Você tem certeza que deseja deletar esta atualização? Esta operação é irreversível.",
      success: {
        title: "Atualização deletada",
        message: "A atualização foi deletada com sucesso.",
      },
      error: {
        title: "Atualização não deletada",
        message: "A atualização não foi deletada.",
      },
    },
    update: {
      success: {
        title: "Atualização atualizada",
        message: "A atualização foi atualizada com sucesso.",
      },
      error: {
        title: "Atualização não atualizada",
        message: "A atualização não foi atualizada.",
      },
    },
    reaction: {
      create: {
        success: {
          title: "Reação criada",
          message: "A reação foi criada com sucesso.",
        },
        error: {
          title: "Reação não criada",
          message: "A reação não foi criada.",
        },
      },
      remove: {
        success: {
          title: "Reação removida",
          message: "A reação foi removida com sucesso.",
        },
        error: {
          title: "Reação não removida",
          message: "A reação não foi removida.",
        },
      },
    },
    progress: {
      title: "Progresso",
      since_last_update: "Desde a última atualização",
      comments: "{count, plural, one{# comentário} other{# comentários}}",
    },
    create: {
      success: {
        title: "Atualização criada",
        message: "A atualização foi criada com sucesso.",
      },
      error: {
        title: "Atualização não criada",
        message: "A atualização não foi criada.",
      },
    },
  },
  teamspaces: {
    label: "Espaços de equipe",
    empty_state: {
      general: {
        title: "Espaços de equipe desbloqueiam melhor organização e rastreamento no Plane.",
        description:
          "Crie uma superfície dedicada para cada equipe do mundo real, separada de todas as outras superfícies de trabalho no Plane, e personalize-as para se adequarem à forma como sua equipe trabalha.",
        primary_button: {
          text: "Criar um novo espaço de equipe",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "Você ainda não vinculou nenhum espaço de equipe.",
          description: "Proprietários de espaços de equipe e projetos podem gerenciar o acesso aos projetos.",
        },
      },
      primary_button: {
        text: "Vincular um espaço de equipe",
      },
      secondary_button: {
        text: "Saiba mais",
      },
      table: {
        columns: {
          teamspaceName: "Nome do espaço de equipe",
          members: "Membros",
          accountType: "Tipo de conta",
        },
        actions: {
          remove: {
            button: {
              text: "Remover espaço de equipe",
            },
            confirm: {
              title: "Remover {teamspaceName} de {projectName}",
              description:
                "Quando você remove este espaço de equipe de um projeto vinculado, os membros aqui perderão o acesso ao projeto vinculado.",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "Nenhum espaço de equipe correspondente encontrado",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {Você vinculou um espaço de equipe a este projeto.} other {Você vinculou # espaços de equipe a este projeto.}}",
            description:
              "{additionalCount, plural, =0 {O espaço de equipe {firstTeamspaceName} agora está vinculado a este projeto.} other {O espaço de equipe {firstTeamspaceName} e mais {additionalCount} agora estão vinculados a este projeto.}}",
          },
          error: {
            title: "Isso não funcionou.",
            description: "Tente novamente ou recarregue esta página antes de tentar novamente.",
          },
        },
        remove_teamspace: {
          success: {
            title: "Você removeu esse espaço de equipe deste projeto.",
            description: "O espaço de equipe {teamspaceName} foi removido de {projectName}.",
          },
          error: {
            title: "Isso não funcionou.",
            description: "Tente novamente ou recarregue esta página antes de tentar novamente.",
          },
        },
      },
      link_teamspace: {
        placeholder: "Pesquisar espaços de equipe",
        info: {
          title: "Adicionar um espaço de equipe concede a todos os membros do espaço de equipe acesso a este projeto.",
          link: "Saiba mais",
        },
        empty_state: {
          no_teamspaces: {
            title: "Você não tem nenhum espaço de equipe para vincular.",
            description:
              "Ou você não está em um espaço de equipe que pode vincular ou já vinculou todos os espaços de equipe disponíveis.",
          },
          no_results: {
            title: "Isso não corresponde a nenhum dos seus espaços de equipe.",
            description: "Tente outro termo ou certifique-se de que você tem espaços de equipe para vincular.",
          },
        },
        primary_button: {
          text: "Vincular espaço(s) de equipe selecionado(s)",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "Crie itens de trabalho específicos da equipe.",
        description:
          "Itens de trabalho que são atribuídos a membros desta equipe em qualquer projeto vinculado aparecerão automaticamente aqui. Se você espera ver alguns itens de trabalho aqui, certifique-se de que seus projetos vinculados tenham itens de trabalho atribuídos a membros desta equipe ou crie itens de trabalho.",
        primary_button: {
          text: "Adicionar itens de trabalho a um projeto vinculado",
        },
      },
      work_items_empty_filter: {
        title: "Não há itens de trabalho específicos da equipe para os filtros aplicados",
        description:
          "Altere alguns desses filtros ou limpe todos eles para ver itens de trabalho relevantes para este espaço.",
        secondary_button: {
          text: "Limpar todos os filtros",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "Nenhum dos seus projetos vinculados tem um ciclo ativo.",
        description:
          "Ciclos ativos em projetos vinculados aparecerão automaticamente aqui. Se você espera ver um ciclo ativo, certifique-se de que ele esteja em execução em um projeto vinculado agora.",
      },
      completed: {
        title: "Nenhum dos seus projetos vinculados tem um ciclo concluído.",
        description:
          "Ciclos concluídos em projetos vinculados aparecerão automaticamente aqui. Se você espera ver um ciclo concluído, certifique-se de que ele também esteja concluído em um projeto vinculado.",
      },
      upcoming: {
        title: "Nenhum dos seus projetos vinculados tem um ciclo próximo.",
        description:
          "Ciclos próximos em projetos vinculados aparecerão automaticamente aqui. Se você espera ver um ciclo próximo, certifique-se de que ele também esteja em um projeto vinculado.",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title: "As visualizações da sua equipe do seu trabalho sem interromper outras visualizações em seu workspace",
        description:
          "Veja o trabalho da sua equipe em visualizações que são salvas apenas para sua equipe e separadamente das visualizações de um projeto.",
        primary_button: {
          text: "Criar uma visualização",
        },
      },
      filter: {
        title: "Nenhuma visualização correspondente",
        description: `Nenhuma visualização corresponde aos critérios de pesquisa.
 Crie uma nova visualização em vez disso.`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "Armazene o conhecimento da sua equipe nas Páginas da Equipe.",
        description:
          "Diferentemente das páginas em um projeto, você pode salvar conhecimento específico para uma equipe em um conjunto separado de páginas aqui. Obtenha todos os recursos de Páginas, crie documentos de melhores práticas e wikis de equipe facilmente.",
        primary_button: {
          text: "Crie sua primeira página de equipe",
        },
      },
      filter: {
        title: "Nenhuma página correspondente",
        description: "Remova os filtros para ver todas as páginas",
      },
      search: {
        title: "Nenhuma página correspondente",
        description: "Remova os critérios de pesquisa para ver todas as páginas",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "Nenhum dos seus projetos vinculados tem itens de trabalho publicados.",
        description:
          "Crie alguns itens de trabalho em um ou mais desses projetos para ver o progresso por datas, estados e prioridade.",
      },
      relation: {
        blocking: {
          title: "Você não tem nenhum item de trabalho bloqueando um colega de equipe.",
          description: "Bom trabalho! Você liberou o caminho para sua equipe. Você é um bom jogador de equipe.",
        },
        blocked: {
          title: "Você não tem itens de trabalho de colegas bloqueando você.",
          description: "Boas notícias! Você pode progredir em todos os seus itens de trabalho atribuídos.",
        },
      },
      stats: {
        general: {
          title: "Nenhum dos seus projetos vinculados tem itens de trabalho publicados.",
          description:
            "Crie alguns itens de trabalho em um ou mais desses projetos para ver a distribuição de trabalho por projeto e membros da equipe.",
        },
        filter: {
          title: "Não há estatísticas de equipe para os filtros aplicados.",
          description:
            "Crie alguns itens de trabalho em um ou mais desses projetos para ver a distribuição de trabalho por projeto e membros da equipe.",
        },
      },
    },
  },
  initiatives: {
    overview: "Visão geral",
    label: "Iniciativas",
    placeholder: "{count, plural, one{# iniciativa} other{# iniciativas}}",
    add_initiative: "Adicionar Iniciativa",
    create_initiative: "Criar Iniciativa",
    update_initiative: "Atualizar Iniciativa",
    initiative_name: "Nome da iniciativa",
    all_initiatives: "Todas as Iniciativas",
    delete_initiative: "Excluir Iniciativa",
    fill_all_required_fields: "Por favor, preencha todos os campos obrigatórios.",
    toast: {
      create_success: "Iniciativa {name} criada com sucesso.",
      create_error: "Falha ao criar iniciativa. Por favor, tente novamente!",
      update_success: "Iniciativa {name} atualizada com sucesso.",
      update_error: "Falha ao atualizar iniciativa. Por favor, tente novamente!",
      delete: {
        success: "Iniciativa excluída com sucesso.",
        error: "Falha ao excluir Iniciativa",
      },
      link_copied: "Link da iniciativa copiado para a área de transferência.",
      project_update_success: "Projetos da iniciativa atualizados com sucesso.",
      project_update_error: "Falha ao atualizar projetos da iniciativa. Por favor, tente novamente!",
      epic_update_success:
        "Épico{count, plural, one { adicionado à Iniciativa com sucesso.} other {s adicionados à Iniciativa com sucesso.}}",
      epic_update_error: "Adição de épico à Iniciativa falhou. Por favor, tente novamente mais tarde.",
      state_update_success: "O estado da iniciativa foi atualizado com sucesso.",
      state_update_error: "Falha ao atualizar o estado da iniciativa. Por favor, tente novamente!",
      label_update_error: "Falha ao atualizar os rótulos da iniciativa. Por favor, tente novamente!",
    },
    empty_state: {
      general: {
        title: "Organize trabalho no mais alto nível com Iniciativas",
        description:
          "Quando você precisa organizar trabalho abrangendo vários projetos e equipes, as Iniciativas são úteis. Conecte projetos e épicos às iniciativas, veja atualizações automaticamente agregadas e veja as florestas antes de chegar às árvores.",
        primary_button: {
          text: "Criar uma iniciativa",
        },
      },
      search: {
        title: "Nenhuma iniciativa correspondente",
        description: `Nenhuma iniciativa detectada com os critérios correspondentes.
 Crie uma nova iniciativa em vez disso.`,
      },
      not_found: {
        title: "Iniciativa não existe",
        description: "A Iniciativa que você está procurando não existe, foi arquivada ou foi excluída.",
        primary_button: {
          text: "Ver outras Iniciativas",
        },
      },
      epics: {
        title: "Não há iniciativas que correspondem aos filtros que você aplicou.",
        subHeading: "Para ver todas as iniciativas, limpe todos os filtros aplicados.",
        action: "Limpar filtros",
      },
    },
    scope: {
      view_scope: "Ver escopo",
      breakdown: "Desmembrar escopo",
      add_scope: "Adicionar escopo",
      label: "Escopo",
      empty_state: {
        title: "Nenhum escopo adicionado à iniciativa",
        description: "Conecte projetos e épicos à iniciativa para começar.",
        primary_button: {
          text: "Adicionar escopo",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "Rótulos",
        description: "Estruture e organize suas iniciativas com rótulos.",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "Excluir rótulo",
        content:
          "Tem certeza de que deseja excluir {labelName}? Isso removerá o rótulo de todas as iniciativas e de quaisquer visualizações onde o rótulo está sendo filtrado.",
      },
      toast: {
        delete_error: "Não foi possível excluir o rótulo da iniciativa. Tente novamente.",
        label_already_exists: "O rótulo já existe",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title:
          "Escreva uma nota, um documento ou uma base de conhecimento completa. Obtenha ajuda do Galileo, o assistente de IA do Plane, para começar",
        description:
          "Páginas são espaços para desenvolver pensamentos no Plane. Anote notas de reunião, formate-as facilmente, incorpore itens de trabalho, organize-os usando uma biblioteca de componentes e mantenha tudo no contexto do seu projeto. Para facilitar qualquer documento, invoque o Galileo, a IA do Plane, com um atalho ou clique de um botão.",
        primary_button: {
          text: "Crie sua primeira página",
        },
      },
      private: {
        title: "Ainda não há páginas privadas",
        description:
          "Mantenha seus pensamentos privados aqui. Quando estiver pronto para compartilhar, a equipe está a apenas um clique de distância.",
        primary_button: {
          text: "Crie sua primeira página",
        },
      },
      public: {
        title: "Ainda não há páginas do espaço de trabalho",
        description: "Veja páginas compartilhadas com todos em seu espaço de trabalho aqui mesmo.",
        primary_button: {
          text: "Crie sua primeira página",
        },
      },
      archived: {
        title: "Ainda não há páginas arquivadas",
        description: "Arquive páginas fora do seu radar. Acesse-as aqui quando necessário.",
      },
    },
  },
  epics: {
    label: "Épicos",
    no_epics_selected: "Nenhum épico selecionado",
    add_selected_epics: "Adicionar épicos selecionados",
    epic_link_copied_to_clipboard: "Link do épico copiado para a área de transferência.",
    project_link_copied_to_clipboard: "Link do projeto copiado para a área de transferência",
    empty_state: {
      general: {
        title: "Crie um épico e atribua-o a alguém, até mesmo a você",
        description:
          "Para corpos maiores de trabalho que abrangem vários ciclos e podem viver em vários módulos, crie um épico. Vincule itens de trabalho e sub-itens de trabalho em um projeto a um épico e entre em um item de trabalho a partir da visão geral.",
        primary_button: {
          text: "Criar um Épico",
        },
      },
      section: {
        title: "Nenhum épico ainda",
        description: "Comece a adicionar épicos para gerenciar e acompanhar o progresso.",
        primary_button: {
          text: "Adicionar épicos",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "Nenhum épico correspondente encontrado",
      },
      no_epics: {
        title: "Nenhum épico encontrado",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "Nenhum ciclo ativo",
        description:
          "Ciclos dos seus projetos que incluem qualquer período que engloba a data de hoje dentro de seu intervalo. Encontre o progresso e detalhes de todos os seus ciclos ativos aqui.",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: `Adicione itens de trabalho ao ciclo para visualizar seu
 progresso`,
      },
      priority: {
        title: `Observe itens de trabalho de alta prioridade abordados no
 ciclo rapidamente.`,
      },
      assignee: {
        title: `Adicione responsáveis aos itens de trabalho para ver uma
 divisão do trabalho por responsáveis.`,
      },
      label: {
        title: `Adicione etiquetas aos itens de trabalho para ver a
 divisão do trabalho por etiquetas.`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "Importar membros do CSV",
      description: "Carregue um CSV com colunas: Email, Display Name, First Name, Last Name, Role (5, 15 ou 20)",
      dropzone: {
        active: "Solte o arquivo CSV aqui",
        inactive: "Arraste e solte ou clique para fazer upload",
        file_type: "Apenas arquivos .csv são suportados",
      },
      buttons: {
        cancel: "Cancelar",
        import: "Importar",
        try_again: "Tentar novamente",
        close: "Fechar",
        done: "Concluído",
      },
      progress: {
        uploading: "Enviando...",
        importing: "Importando...",
      },
      summary: {
        title: {
          failed: "Importação falhou",
          complete: "Importação concluída",
        },
        message: {
          seat_limit: "Não foi possível importar membros devido a restrições de limite de assentos.",
          success: "{count} membr{plural} adicionad{plural} com sucesso ao espaço de trabalho.",
          no_imports: "Nenhum membro foi importado do arquivo CSV.",
        },
        stats: {
          successful: "Bem-sucedido",
          failed: "Falhou",
        },
        download_errors: "Baixar erros",
      },
      toast: {
        invalid_file: {
          title: "Arquivo inválido",
          message: "Apenas arquivos CSV são suportados.",
        },
        import_failed: {
          title: "Importação falhou",
          message: "Algo deu errado.",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "Não é possível arquivar itens de trabalho",
        message:
          "Apenas itens de trabalho pertencentes aos grupos de estado Concluído ou Cancelado podem ser arquivados.",
      },
      invalid_issue_start_date: {
        title: "Não é possível atualizar itens de trabalho",
        message:
          "A data de início selecionada sucede a data de vencimento para alguns itens de trabalho. Certifique-se de que a data de início seja anterior à data de vencimento.",
      },
      invalid_issue_target_date: {
        title: "Não é possível atualizar itens de trabalho",
        message:
          "A data de vencimento selecionada precede a data de início para alguns itens de trabalho. Certifique-se de que a data de vencimento seja posterior à data de início.",
      },
      invalid_state_transition: {
        title: "Não é possível atualizar itens de trabalho",
        message:
          "A mudança de estado não é permitida para alguns itens de trabalho. Certifique-se de que a mudança de estado seja permitida.",
      },
    },
  },
  work_item_types: {
    label: "Tipos de Item de Trabalho",
    label_lowercase: "tipos de item de trabalho",
    settings: {
      title: "Tipos de Item de Trabalho",
      properties: {
        title: "Propriedades personalizadas",
        tooltip:
          "Cada tipo de item de trabalho vem com um conjunto padrão de propriedades como Título, Descrição, Responsável, Estado, Prioridade, Data de início, Data de vencimento, Módulo, Ciclo etc. Você também pode personalizar e adicionar suas próprias propriedades para adaptar às necessidades da sua equipe.",
        add_button: "Adicionar nova propriedade",
        dropdown: {
          label: "Tipo de propriedade",
          placeholder: "Selecionar tipo",
        },
        property_type: {
          text: {
            label: "Texto",
          },
          number: {
            label: "Número",
          },
          dropdown: {
            label: "Menu suspenso",
          },
          boolean: {
            label: "Booleano",
          },
          date: {
            label: "Data",
          },
          member_picker: {
            label: "Seletor de membro",
          },
          release_picker: {
            label: "Seletor de releases",
          },
          formula: {
            label: "Fórmula",
          },
        },
        attributes: {
          label: "Atributos",
          text: {
            single_line: {
              label: "Linha única",
            },
            multi_line: {
              label: "Parágrafo",
            },
            readonly: {
              label: "Somente leitura",
              header: "Dados somente leitura",
            },
            invalid_text_format: {
              label: "Formato de texto inválido",
            },
          },
          number: {
            default: {
              placeholder: "Adicionar número",
            },
          },
          relation: {
            single_select: {
              label: "Seleção única",
            },
            multi_select: {
              label: "Seleção múltipla",
            },
            no_default_value: {
              label: "Sem valor padrão",
            },
          },
          boolean: {
            label: "Verdadeiro | Falso",
            no_default: "Sem valor padrão",
          },
          option: {
            create_update: {
              label: "Opções",
              form: {
                placeholder: "Adicionar opção",
                errors: {
                  name: {
                    required: "Nome da opção é obrigatório.",
                    integrity: "Opção com o mesmo nome já existe.",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "Selecionar opção",
                multi: {
                  default: "Selecionar opções",
                  variable: "{count} opções selecionadas",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "Sucesso!",
              message: "Propriedade {name} criada com sucesso.",
            },
            error: {
              title: "Erro!",
              message: "Falha ao criar propriedade. Por favor, tente novamente!",
            },
          },
          update: {
            success: {
              title: "Sucesso!",
              message: "Propriedade {name} atualizada com sucesso.",
            },
            error: {
              title: "Erro!",
              message: "Falha ao atualizar propriedade. Por favor, tente novamente!",
            },
          },
          delete: {
            success: {
              title: "Sucesso!",
              message: "Propriedade {name} excluída com sucesso.",
            },
            error: {
              title: "Erro!",
              message: "Falha ao excluir propriedade. Por favor, tente novamente!",
            },
          },
          enable_disable: {
            loading: "{action} propriedade {name}",
            success: {
              title: "Sucesso!",
              message: "Propriedade {name} {action} com sucesso.",
            },
            error: {
              title: "Erro!",
              message: "Falha ao {action} propriedade. Por favor, tente novamente!",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "Título",
            },
            description: {
              placeholder: "Descrição",
            },
          },
          errors: {
            name: {
              required: "Você deve nomear sua propriedade.",
              max_length: "O nome da propriedade não deve exceder 255 caracteres.",
            },
            property_type: {
              required: "Você deve selecionar um tipo de propriedade.",
            },
            options: {
              required: "Você deve adicionar pelo menos uma opção.",
            },
            formula: {
              required: "A expressão da fórmula é obrigatória.",
              invalid: "Fórmula inválida: {error}",
              circular_reference:
                "Referência circular detectada. Uma fórmula não pode referenciar a si mesma direta ou indiretamente.",
              invalid_reference: "A fórmula referencia uma propriedade inexistente.",
            },
          },
        },
        formula: {
          field_label: "Campo de fórmula",
          tooltip: "Insira uma fórmula usando a sintaxe '{'Nome do campo'}'. Suporta os operadores +, -, *, / e &.",
          placeholder: "Escrever a fórmula",
          test_button: "Testar",
          validating: "Validando",
          validation_success: "A fórmula é válida! Retorna {resultType}",
          validation_success_with_refs: "A fórmula é válida! Retorna {resultType} ({count} campo(s) referenciado(s))",
          error: {
            empty: "Por favor, insira uma fórmula",
            missing_context: "Contexto de espaço de trabalho, projeto ou tipo de item de trabalho ausente",
            validation_failed: "Falha na validação",
          },
          picker: {
            no_match: "Nenhuma propriedade correspondente",
            no_available: "Nenhuma propriedade disponível",
          },
        },
        enable_disable: {
          label: "Ativo",
          tooltip: {
            disabled: "Clique para desativar",
            enabled: "Clique para ativar",
          },
        },
        delete_confirmation: {
          title: "Excluir esta propriedade",
          description: "A exclusão de propriedades pode levar à perda de dados existentes.",
          secondary_description: "Você quer desativar a propriedade em vez disso?",
          primary_button: "{action}, excluir",
          secondary_button: "Sim, desativar",
        },
        mandate_confirmation: {
          label: "Propriedade obrigatória",
          content:
            "Parece haver uma opção padrão para esta propriedade. Tornar a propriedade obrigatória removerá o valor padrão e os usuários terão que adicionar um valor de sua escolha.",
          tooltip: {
            disabled: "Este tipo de propriedade não pode ser tornado obrigatório",
            enabled: "Desmarque para marcar o campo como opcional",
            checked: "Marque para tornar o campo obrigatório",
          },
        },
        empty_state: {
          title: "Adicionar propriedades personalizadas",
          description: "Novas propriedades que você adicionar para este tipo de item de trabalho aparecerão aqui.",
        },
      },
      item_delete_confirmation: {
        title: "Excluir este tipo",
        description: "A exclusão de tipos pode levar à perda de dados existentes.",
        primary_button: "Sim, excluir",
        toast: {
          success: {
            title: "Sucesso!",
            message: "Tipo de item de trabalho excluído com sucesso.",
          },
          error: {
            title: "Erro!",
            message: "Falha ao excluir o tipo de item de trabalho. Por favor, tente novamente!",
          },
        },
        can_disable_warning: "Deseja desativar o tipo em vez disso?",
      },
      cant_delete_default_message:
        "Não é possível excluir este tipo de item de trabalho, pois ele está definido como o tipo padrão para este projeto.",
    },
    create: {
      title: "Criar tipo de item de trabalho",
      button: "Adicionar tipo de item de trabalho",
      toast: {
        success: {
          title: "Sucesso!",
          message: "Tipo de item de trabalho criado com sucesso.",
        },
        error: {
          title: "Erro!",
          message: {
            conflict: "O tipo {name} já existe. Escolha um nome diferente.",
          },
        },
      },
    },
    update: {
      title: "Atualizar tipo de item de trabalho",
      button: "Atualizar tipo de item de trabalho",
      toast: {
        success: {
          title: "Sucesso!",
          message: "Tipo de item de trabalho {name} atualizado com sucesso.",
        },
        error: {
          title: "Erro!",
          message: {
            conflict: "O tipo {name} já existe. Escolha um nome diferente.",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "Dê a este tipo de item de trabalho um nome único",
        },
        description: {
          placeholder: "Descreva para que serve este tipo de item de trabalho e quando deve ser usado.",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{action} tipo de item de trabalho {name}",
        success: {
          title: "Sucesso!",
          message: "Tipo de item de trabalho {name} {action} com sucesso.",
        },
        error: {
          title: "Erro!",
          message: "Falha ao {action} tipo de item de trabalho. Por favor, tente novamente!",
        },
      },
      tooltip: "Clique para {action}",
    },
    change_confirmation: {
      title: "Alterar tipo de item de trabalho?",
      description:
        "Alterar o tipo de item de trabalho pode resultar na perda de valores de propriedades personalizadas que são específicas do tipo atual. Esta ação não pode ser desfeita.",
      button: {
        loading: "Alterando",
        default: "Alterar tipo",
      },
    },
    empty_state: {
      enable: {
        title: "Ativar Tipos de Item de Trabalho",
        description:
          "Molde itens de trabalho para seu trabalho com Tipos de Item de Trabalho. Personalize com ícones, planos de fundo e propriedades e configure-os para este projeto.",
        primary_button: {
          text: "Ativar",
        },
        confirmation: {
          title: "Uma vez ativados, os Tipos de Item de Trabalho não podem ser desativados.",
          description:
            "O Item de Trabalho do Plane se tornará o tipo de item de trabalho padrão para este projeto e aparecerá com seu ícone e plano de fundo neste projeto.",
          button: {
            default: "Ativar",
            loading: "Configurando",
          },
        },
      },
      get_pro: {
        title: "Obtenha Pro para ativar Tipos de Item de Trabalho.",
        description:
          "Molde itens de trabalho para seu trabalho com Tipos de Item de Trabalho. Personalize com ícones, planos de fundo e propriedades e configure-os para este projeto.",
        primary_button: {
          text: "Obter Pro",
        },
      },
      upgrade: {
        title: "Faça upgrade para ativar Tipos de Item de Trabalho.",
        description:
          "Molde itens de trabalho para seu trabalho com Tipos de Item de Trabalho. Personalize com ícones, planos de fundo e propriedades e configure-os para este projeto.",
        primary_button: {
          text: "Fazer upgrade",
        },
      },
    },
  },
  importers: {
    imports: "Importações",
    logo: "Logo",
    import_message: "Importe seus dados do {serviceName} para projetos do Plane.",
    deactivate: "Desativar",
    deactivating: "Desativando",
    migrating: "Migrando",
    migrations: "Migrações",
    refreshing: "Atualizando",
    import: "Importar",
    serial_number: "Nº de Série",
    project: "Projeto",
    workspace: "Workspace",
    status: "Status",
    summary: "Resumo",
    total_batches: "Total de Lotes",
    imported_batches: "Lotes Importados",
    re_run: "Executar Novamente",
    cancel: "Cancelar",
    start_time: "Hora de Início",
    no_jobs_found: "Nenhum trabalho encontrado",
    no_project_imports: "Você ainda não importou nenhum projeto do {serviceName}.",
    cancel_import_job: "Cancelar trabalho de importação",
    cancel_import_job_confirmation:
      "Tem certeza de que deseja cancelar este trabalho de importação? Isso interromperá o processo de importação para este projeto.",
    re_run_import_job: "Executar novamente o trabalho de importação",
    re_run_import_job_confirmation:
      "Tem certeza de que deseja executar novamente este trabalho de importação? Isso reiniciará o processo de importação para este projeto.",
    upload_csv_file: "Faça upload de um arquivo CSV para importar dados de usuários.",
    connect_importer: "Conectar {serviceName}",
    migration_assistant: "Assistente de Migração",
    migration_assistant_description:
      "Migre seus projetos do {serviceName} para o Plane sem esforço com nosso poderoso assistente.",
    token_helper: "Você obterá isso do seu",
    personal_access_token: "Token de Acesso Pessoal",
    source_token_expired: "Token Expirado",
    source_token_expired_description:
      "O token fornecido expirou. Por favor, desative e reconecte com um novo conjunto de credenciais.",
    user_email: "Email do Usuário",
    select_state: "Selecionar Estado",
    select_service_project: "Selecionar Projeto do {serviceName}",
    loading_service_projects: "Carregando projetos do {serviceName}",
    select_service_workspace: "Selecionar Workspace do {serviceName}",
    loading_service_workspaces: "Carregando Workspaces do {serviceName}",
    select_priority: "Selecionar Prioridade",
    select_service_team: "Selecionar Equipe do {serviceName}",
    add_seat_msg_free_trial:
      "Você está tentando importar {additionalUserCount} usuários não registrados e tem apenas {currentWorkspaceSubscriptionAvailableSeats} assentos disponíveis no plano atual. Para continuar importando, faça upgrade agora.",
    add_seat_msg_paid:
      "Você está tentando importar {additionalUserCount} usuários não registrados e tem apenas {currentWorkspaceSubscriptionAvailableSeats} assentos disponíveis no plano atual. Para continuar importando, compre pelo menos {extraSeatRequired} assentos extras.",
    skip_user_import_title: "Pular importação de dados de Usuário",
    skip_user_import_description:
      "Pular a importação de usuários resultará em itens de trabalho, comentários e outros dados do {serviceName} sendo criados pelo usuário que está realizando a migração no Plane. Você ainda pode adicionar usuários manualmente mais tarde.",
    invalid_pat: "Token de Acesso Pessoal Inválido",
  },
  integrations: {
    integrations: "Integrações",
    loading: "Carregando",
    unauthorized: "Você não está autorizado a visualizar esta página.",
    configure: "Configurar",
    not_enabled: "{name} não está habilitado para este workspace.",
    not_configured: "Não configurado",
    disconnect_personal_account: "Desconectar conta pessoal do {providerName}",
    not_configured_message_admin:
      "A integração com {name} não está configurada. Entre em contato com o administrador da sua instância para configurá-la.",
    not_configured_message_support:
      "A integração com {name} não está configurada. Entre em contato com o suporte para configurá-la.",
    external_api_unreachable: "Não foi possível acessar a API externa. Por favor, tente novamente mais tarde.",
    error_fetching_supported_integrations:
      "Não foi possível buscar integrações suportadas. Por favor, tente novamente mais tarde.",
    back_to_integrations: "Voltar para integrações",
    select_state: "Selecionar Estado",
    set_state: "Definir Estado",
    choose_project: "Escolher Projeto...",
    skip_backward_state_movement: "Impedir que os itens voltem a um estado anterior devido a atualizações de PR",
  },
  github_integration: {
    name: "GitHub",
    description: "Conecte e sincronize seus itens de trabalho do GitHub com o Plane",
    connect_org: "Conectar Organização",
    connect_org_description: "Conecte sua organização do GitHub com o Plane",
    processing: "Processando",
    org_added_desc: "GitHub org adicionada por e tempo",
    connection_fetch_error: "Erro ao buscar detalhes de conexão do servidor",
    personal_account_connected: "Conta pessoal conectada",
    personal_account_connected_description: "Sua conta GitHub agora está conectada ao Plane",
    connect_personal_account: "Conectar Conta Pessoal",
    connect_personal_account_description: "Conecte sua conta GitHub pessoal com o Plane.",
    repo_mapping: "Mapeamento de Repositório",
    repo_mapping_description: "Mapeie seus repositórios do GitHub com projetos do Plane.",
    project_issue_sync: "Sincronização de Problema de Projeto",
    project_issue_sync_description: "Sincronize problemas do GitHub para seu projeto Plane",
    project_issue_sync_empty_state: "Sincronizações de problemas de projeto mapeadas aparecerão aqui",
    configure_project_issue_sync_state: "Configurar Estado de Sincronização de Problema",
    select_issue_sync_direction: "Selecionar Direção de Sincronização de Problema",
    allow_bidirectional_sync:
      "Bidirecional - Sincronize problemas e comentários em ambos os sentidos entre GitHub e Plane",
    allow_unidirectional_sync: "Unidirecional - Sincronize problemas e comentários do GitHub para o Plane apenas",
    allow_unidirectional_sync_warning:
      "Os dados do GitHub Issue substituirão os dados no Item de Trabalho Plane Vinculado (GitHub → Plane apenas)",
    remove_project_issue_sync: "Remover esta Sincronização de Problema de Projeto",
    remove_project_issue_sync_confirmation:
      "Tem certeza de que deseja remover esta sincronização de problema de projeto?",
    add_pr_state_mapping: "Adicionar Mapeamento de Estado de Pull Request para Projeto Plane",
    edit_pr_state_mapping: "Editar Mapeamento de Estado de Pull Request para Projeto Plane",
    pr_state_mapping: "Mapeamento de Estado de Pull Request",
    pr_state_mapping_description: "Mapeie os estados de pull request do GitHub para seu projeto Plane",
    pr_state_mapping_empty_state: "Estados de PR mapeados aparecerão aqui",
    remove_pr_state_mapping: "Remover este Mapeamento de Estado de Pull Request",
    remove_pr_state_mapping_confirmation:
      "Tem certeza de que deseja remover este mapeamento de estado de pull request?",
    issue_sync_message: "Itens de trabalho são sincronizados para {project}",
    link: "Vincular repositório do GitHub ao projeto do Plane",
    pull_request_automation: "Automação de Pull Request",
    pull_request_automation_description:
      "Configure o mapeamento de estado de pull request do GitHub para seu projeto Plane",
    DRAFT_MR_OPENED: "Draft Aberto",
    MR_OPENED: "Aberto",
    MR_READY_FOR_MERGE: "Pronto para Merge",
    MR_REVIEW_REQUESTED: "Revisão Requerida",
    MR_MERGED: "Mesclado",
    MR_CLOSED: "Fechado",
    ISSUE_OPEN: "Issue Aberto",
    ISSUE_CLOSED: "Issue Fechado",
    save: "Salvar",
    start_sync: "Iniciar Sincronização",
    choose_repository: "Escolher Repositório...",
  },
  gitlab_integration: {
    name: "Gitlab",
    description: "Conecte e sincronize seus Merge Requests do Gitlab com o Plane.",
    connection_fetch_error: "Erro ao buscar detalhes de conexão do servidor",
    connect_org: "Conectar Organização",
    connect_org_description: "Conecte sua organização do Gitlab com o Plane.",
    project_connections: "Conexões de Projeto do Gitlab",
    project_connections_description: "Sincronize merge requests do Gitlab para projetos do Plane.",
    plane_project_connection: "Conexão de Projeto do Plane",
    plane_project_connection_description:
      "Configure o mapeamento de estado de pull requests do Gitlab para projetos do Plane",
    remove_connection: "Remover Conexão",
    remove_connection_confirmation: "Tem certeza de que deseja remover esta conexão?",
    link: "Vincular repositório do Gitlab ao projeto do Plane",
    pull_request_automation: "Automação de Pull Request",
    pull_request_automation_description: "Configure o mapeamento de estado de pull request do Gitlab para o Plane",
    DRAFT_MR_OPENED: "Ao abrir MR rascunho, definir o estado para",
    MR_OPENED: "Ao abrir MR, definir o estado para",
    MR_REVIEW_REQUESTED: "Quando for solicitada revisão do MR, definir o estado para",
    MR_READY_FOR_MERGE: "Quando o MR estiver pronto para merge, definir o estado para",
    MR_MERGED: "Quando o MR for mesclado, definir o estado para",
    MR_CLOSED: "Quando o MR for fechado, definir o estado para",
    integration_enabled_text:
      "Com a integração do Gitlab ativada, você pode automatizar fluxos de trabalho de itens de trabalho",
    choose_entity: "Escolher Entidade",
    choose_project: "Escolher Projeto",
    link_plane_project: "Vincular projeto do Plane",
    project_issue_sync: "Sincronização de Issues do Projeto",
    project_issue_sync_description: "Sincronize issues do Gitlab para seu projeto Plane",
    project_issue_sync_empty_state: "A sincronização de issues do projeto mapeada aparecerá aqui",
    configure_project_issue_sync_state: "Configurar Estado de Sincronização de Issues",
    select_issue_sync_direction: "Selecione a direção de sincronização de issues",
    allow_bidirectional_sync:
      "Bidirecional - Sincronizar issues e comentários em ambas as direções entre Gitlab e Plane",
    allow_unidirectional_sync: "Unidirecional - Sincronizar issues e comentários apenas do Gitlab para o Plane",
    allow_unidirectional_sync_warning:
      "Dados do Gitlab Issue substituirão dados no Item de Trabalho do Plane vinculado (apenas Gitlab → Plane)",
    remove_project_issue_sync: "Remover esta Sincronização de Issues do Projeto",
    remove_project_issue_sync_confirmation:
      "Tem certeza de que deseja remover esta sincronização de issues do projeto?",
    ISSUE_OPEN: "Issue Aberta",
    ISSUE_CLOSED: "Issue Fechada",
    save: "Salvar",
    start_sync: "Iniciar Sincronização",
    choose_repository: "Escolher Repositório...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Conecte e sincronize sua instância do Gitlab Enterprise com o Plane.",
    app_form_title: "Configuração do Gitlab Enterprise",
    app_form_description: "Configure o Gitlab Enterprise para conectar com o Plane.",
    base_url_title: "URL Base",
    base_url_description: "A URL base da sua instância do Gitlab Enterprise.",
    base_url_placeholder: 'ex. "https://glab.plane.town"',
    base_url_error: "URL base é obrigatória",
    invalid_base_url_error: "URL base inválida",
    client_id_title: "ID do App",
    client_id_description: "O ID do app que você criou na sua instância do Gitlab Enterprise.",
    client_id_placeholder: 'ex. "7cd732xxxxxxxxxxxxxx"',
    client_id_error: "ID do App é obrigatório",
    client_secret_title: "Client Secret",
    client_secret_description: "O client secret do app que você criou na sua instância do Gitlab Enterprise.",
    client_secret_placeholder: 'ex. "gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "Client secret é obrigatório",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description:
      "Um webhook secret aleatório que será usado para verificar o webhook da instância do Gitlab Enterprise.",
    webhook_secret_placeholder: 'ex. "webhook1234567890"',
    webhook_secret_error: "Webhook secret é obrigatório",
    connect_app: "Conectar App",
  },
  slack_integration: {
    name: "Slack",
    description: "Conecte seu workspace do Slack com o Plane.",
    connect_personal_account: "Conecte sua conta pessoal do Slack com o Plane.",
    personal_account_connected: "Sua conta pessoal do {providerName} agora está conectada ao Plane.",
    link_personal_account: "Vincule sua conta pessoal do {providerName} ao Plane.",
    connected_slack_workspaces: "Workspaces do Slack conectados",
    connected_on: "Conectado em {date}",
    disconnect_workspace: "Desconectar workspace {name}",
    alerts: {
      dm_alerts: {
        title:
          "Receba notificações em mensagens diretas do Slack para atualizações importantes, lembretes e alertas apenas para você.",
      },
    },
    project_updates: {
      title: "Atualizações de Projeto",
      description: "Configure notificações de atualizações de projetos para seus projetos",
      add_new_project_update: "Adicionar nova notificação de atualizações de projeto",
      project_updates_empty_state: "Projetos conectados com Canais do Slack aparecerão aqui.",
      project_updates_form: {
        title: "Configurar Atualizações de Projeto",
        description: "Receba notificações de atualizações de projeto no Slack quando itens de trabalho são criados",
        failed_to_load_channels: "Falha ao carregar canais do Slack",
        project_dropdown: {
          placeholder: "Selecione um projeto",
          label: "Projeto do Plane",
          no_projects: "Nenhum projeto disponível",
        },
        channel_dropdown: {
          label: "Canal do Slack",
          placeholder: "Selecione um canal",
          no_channels: "Nenhum canal disponível",
        },
        all_projects_connected: "Todos os projetos já estão conectados a canais do Slack.",
        all_channels_connected: "Todos os canais do Slack já estão conectados a projetos.",
        project_connection_success: "Conexão de projeto criada com sucesso",
        project_connection_updated: "Conexão de projeto atualizada com sucesso",
        project_connection_deleted: "Conexão de projeto excluída com sucesso",
        failed_delete_project_connection: "Falha ao excluir conexão de projeto",
        failed_create_project_connection: "Falha ao criar conexão de projeto",
        failed_upserting_project_connection: "Falha ao atualizar conexão de projeto",
        failed_loading_project_connections:
          "Não foi possível carregar suas conexões de projeto. Isso pode ser devido a um problema de rede ou um problema com a integração.",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "Conecte seu espaço de trabalho Sentry com o Plane.",
    connected_sentry_workspaces: "Espaços de trabalho Sentry conectados",
    connected_on: "Conectado em {date}",
    disconnect_workspace: "Desconectar espaço de trabalho {name}",
    state_mapping: {
      title: "Mapeamento de estado",
      description:
        "Mapeie os estados de incidente do Sentry para os estados do seu projeto. Configure quais estados usar quando um incidente do Sentry é resolvido ou não resolvido.",
      add_new_state_mapping: "Adicionar novo mapeamento de estado",
      empty_state:
        "Nenhum mapeamento de estado configurado. Crie seu primeiro mapeamento para sincronizar os estados de incidente do Sentry com os estados do seu projeto.",
      failed_loading_state_mappings:
        "Não conseguimos carregar seus mapeamentos de estado. Isso pode ser devido a um problema de rede ou um problema com a integração.",
      loading_project_states: "Carregando estados do projeto...",
      error_loading_states: "Erro ao carregar estados",
      no_states_available: "Nenhum estado disponível",
      no_permission_states: "Você não tem permissão para acessar os estados deste projeto",
      states_not_found: "Estados do projeto não encontrados",
      server_error_states: "Erro do servidor ao carregar estados",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "Conecte e sincronize sua organização GitHub Enterprise com o Plane.",
    app_form_title: "Configuração do GitHub Enterprise",
    app_form_description: "Configure o GitHub Enterprise para conectar com o Plane.",
    app_id_title: "ID da Aplicação",
    app_id_description: "O ID da aplicação que você criou em sua organização GitHub Enterprise.",
    app_id_placeholder: 'e.g., "1234567890"',
    app_id_error: "ID da aplicação é obrigatório",
    app_name_title: "Slug da Aplicação",
    app_name_description: "O slug da aplicação que você criou em sua organização GitHub Enterprise.",
    app_name_error: "Slug da aplicação é obrigatório",
    app_name_placeholder: 'e.g., "plane-github-enterprise"',
    base_url_title: "URL Base",
    base_url_description: "A URL base da sua organização GitHub Enterprise.",
    base_url_placeholder: 'e.g., "https://gh.plane.town"',
    base_url_error: "URL base é obrigatório",
    invalid_base_url_error: "URL base inválida",
    client_id_title: "ID do Cliente",
    client_id_description: "O ID do cliente da aplicação que você criou em sua organização GitHub Enterprise.",
    client_id_placeholder: 'e.g., "1234567890"',
    client_id_error: "ID do cliente é obrigatório",
    client_secret_title: "Secret do Cliente",
    client_secret_description: "O secret do cliente da aplicação que você criou em sua organização GitHub Enterprise.",
    client_secret_placeholder: 'e.g., "1234567890"',
    client_secret_error: "Secret do cliente é obrigatório",
    webhook_secret_title: "Secret do Webhook",
    webhook_secret_description: "O secret do webhook da aplicação que você criou em sua organização GitHub Enterprise.",
    webhook_secret_placeholder: 'e.g., "1234567890"',
    webhook_secret_error: "Secret do webhook é obrigatório",
    private_key_title: "Chave Privada (Base64 codificado)",
    private_key_description: "Chave privada da aplicação que você criou em sua organização GitHub Enterprise.",
    private_key_placeholder: 'e.g., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Chave privada é obrigatória",
    connect_app: "Conectar Aplicação",
  },
  file_upload: {
    upload_text: "Clique aqui para fazer upload do arquivo",
    drag_drop_text: "Arraste e Solte",
    processing: "Processando",
    invalid: "Tipo de arquivo inválido",
    missing_fields: "Campos ausentes",
    success: "{fileName} Enviado!",
  },
  silo_errors: {
    invalid_query_params: "Os parâmetros de consulta fornecidos são inválidos ou estão faltando campos obrigatórios",
    invalid_installation_account: "A conta de instalação fornecida não é válida",
    generic_error: "Ocorreu um erro inesperado ao processar sua solicitação",
    connection_not_found: "A conexão solicitada não pôde ser encontrada",
    multiple_connections_found: "Várias conexões foram encontradas quando apenas uma era esperada",
    installation_not_found: "A instalação solicitada não pôde ser encontrada",
    user_not_found: "O usuário solicitado não pôde ser encontrado",
    error_fetching_token: "Falha ao buscar token de autenticação",
    invalid_app_credentials: "As credenciais da aplicação fornecidas são inválidas",
    invalid_app_installation_id: "Falha ao instalar a aplicação",
  },
  import_status: {
    queued: "Em fila",
    created: "Criado",
    initiated: "Iniciado",
    pulling: "Extraindo",
    timed_out: "Tempo limite esgotado",
    pulled: "Extraído",
    transforming: "Transformando",
    transformed: "Transformado",
    pushing: "Enviando",
    finished: "Finalizado",
    error: "Erro",
    cancelled: "Cancelado",
  },
  jira_importer: {
    jira_importer_description: "Importe seus dados do Jira para projetos do Plane.",
    create_project_automatically: "Criar projeto automaticamente",
    create_project_automatically_description:
      "Criaremos um novo projeto para você com base nos detalhes do projeto Jira.",
    import_to_existing_project: "Importar para um projeto existente",
    import_to_existing_project_description: "Escolha um projeto existente no menu suspenso abaixo.",
    state_mapping_automatic_creation: "Todos os status do Jira serão criados automaticamente no Plane.",
    personal_access_token: "Token de Acesso Pessoal",
    user_email: "Email do Usuário",
    atlassian_security_settings: "Configurações de Segurança do Atlassian",
    email_description: "Este é o email vinculado ao seu token de acesso pessoal",
    jira_domain: "Domínio do Jira",
    jira_domain_description: "Este é o domínio da sua instância do Jira",
    steps: {
      title_configure_plane: "Configurar Plane",
      description_configure_plane:
        "Por favor, primeiro crie o projeto no Plane onde você pretende migrar seus dados do Jira. Depois que o projeto for criado, selecione-o aqui.",
      title_configure_jira: "Configurar Jira",
      description_configure_jira: "Por favor, selecione o workspace do Jira do qual você deseja migrar seus dados.",
      title_import_users: "Importar Usuários",
      description_import_users:
        "Por favor, adicione os usuários que deseja migrar do Jira para o Plane. Alternativamente, você pode pular esta etapa e adicionar usuários manualmente mais tarde.",
      title_map_states: "Mapear Estados",
      description_map_states:
        "Correspondemos automaticamente os status do Jira aos estados do Plane da melhor maneira possível. Por favor, mapeie quaisquer estados restantes antes de prosseguir, você também pode criar estados e mapeá-los manualmente.",
      title_map_priorities: "Mapear Prioridades",
      description_map_priorities:
        "Correspondemos automaticamente as prioridades da melhor maneira possível. Por favor, mapeie quaisquer prioridades restantes antes de prosseguir.",
      title_summary: "Resumo",
      description_summary: "Aqui está um resumo dos dados que serão migrados do Jira para o Plane.",
      custom_jql_filter: "Filtro JQL Personalizado",
      jql_filter_description: "Use JQL para filtrar itens específicos para importação.",
      project_code: "PROJETO",
      enter_filters_placeholder: "Insira filtros (ex: status = 'In Progress')",
      validating_query: "Validando consulta...",
      validation_successful_work_items_selected: "Validação bem-sucedida, {count} itens de trabalho selecionados.",
      run_syntax_check: "Execute a verificação de sintaxe para validar sua consulta",
      refresh: "Atualizar",
      check_syntax: "Verificar Sintaxe",
      no_work_items_selected: "Nenhum item de trabalho selecionado pela consulta.",
      validation_error_default: "Algo deu errado ao validar a consulta.",
    },
  },
  asana_importer: {
    asana_importer_description: "Importe seus dados do Asana para projetos do Plane.",
    select_asana_priority_field: "Selecionar Campo de Prioridade do Asana",
    steps: {
      title_configure_plane: "Configurar Plane",
      description_configure_plane:
        "Por favor, primeiro crie o projeto no Plane onde você pretende migrar seus dados do Asana. Depois que o projeto for criado, selecione-o aqui.",
      title_configure_asana: "Configurar Asana",
      description_configure_asana:
        "Por favor, selecione o workspace e projeto do Asana do qual você deseja migrar seus dados.",
      title_map_states: "Mapear Estados",
      description_map_states:
        "Por favor, selecione os estados do Asana que você deseja mapear para os status do projeto do Plane.",
      title_map_priorities: "Mapear Prioridades",
      description_map_priorities:
        "Por favor, selecione as prioridades do Asana que você deseja mapear para as prioridades do projeto do Plane.",
      title_summary: "Resumo",
      description_summary: "Aqui está um resumo dos dados que serão migrados do Asana para o Plane.",
    },
  },
  linear_importer: {
    linear_importer_description: "Importe seus dados do Linear para projetos do Plane.",
    steps: {
      title_configure_plane: "Configurar Plane",
      description_configure_plane:
        "Por favor, primeiro crie o projeto no Plane onde você pretende migrar seus dados do Linear. Depois que o projeto for criado, selecione-o aqui.",
      title_configure_linear: "Configurar Linear",
      description_configure_linear: "Por favor, selecione a equipe do Linear da qual você deseja migrar seus dados.",
      title_map_states: "Mapear Estados",
      description_map_states:
        "Correspondemos automaticamente os status do Linear aos estados do Plane da melhor maneira possível. Por favor, mapeie quaisquer estados restantes antes de prosseguir, você também pode criar estados e mapeá-los manualmente.",
      title_map_priorities: "Mapear Prioridades",
      description_map_priorities:
        "Por favor, selecione as prioridades do Linear que você deseja mapear para as prioridades do projeto do Plane.",
      title_summary: "Resumo",
      description_summary: "Aqui está um resumo dos dados que serão migrados do Linear para o Plane.",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "Importe seus dados do Jira Server/Data Center para projetos do Plane.",
    steps: {
      title_configure_plane: "Configurar Plane",
      description_configure_plane:
        "Por favor, primeiro crie o projeto no Plane onde você pretende migrar seus dados do Jira. Depois que o projeto for criado, selecione-o aqui.",
      title_configure_jira: "Configurar Jira",
      description_configure_jira: "Por favor, selecione o workspace do Jira do qual você deseja migrar seus dados.",
      title_map_states: "Mapear Estados",
      description_map_states:
        "Por favor, selecione os estados do Jira que você deseja mapear para os status do projeto do Plane.",
      title_map_priorities: "Mapear Prioridades",
      description_map_priorities:
        "Por favor, selecione as prioridades do Jira que você deseja mapear para as prioridades do projeto do Plane.",
      title_summary: "Resumo",
      description_summary: "Aqui está um resumo dos dados que serão migrados do Jira para o Plane.",
    },
    import_epics: {
      title: "Importar Épicos como Itens de Trabalho",
      description:
        "Com isso habilitado, seus épicos serão importados como um item de trabalho com o tipo de item de trabalho épico.",
    },
  },
  notion_importer: {
    notion_importer_description: "Importe seus dados do Notion para projetos do Plane.",
    steps: {
      title_upload_zip: "Enviar ZIP exportado do Notion",
      description_upload_zip: "Por favor, envie o arquivo ZIP contendo seus dados do Notion.",
    },
    upload: {
      drop_file_here: "Solte seu arquivo zip do Notion aqui",
      upload_title: "Enviar exportação do Notion",
      upload_from_url: "Importar de URL",
      upload_from_url_description: "Cole a URL pública da sua exportação ZIP para continuar.",
      drag_drop_description: "Arraste e solte seu arquivo zip de exportação do Notion, ou clique para navegar",
      file_type_restriction: "Apenas arquivos .zip exportados do Notion são suportados",
      select_file: "Selecionar arquivo",
      uploading: "Enviando...",
      preparing_upload: "Preparando envio...",
      confirming_upload: "Confirmando envio...",
      confirming: "Confirmando...",
      upload_complete: "Envio concluído",
      upload_failed: "Falha no envio",
      start_import: "Iniciar importação",
      retry_upload: "Tentar envio novamente",
      upload: "Enviar",
      ready: "Pronto",
      error: "Erro",
      upload_complete_message: "Envio concluído!",
      upload_complete_description:
        'Clique em "Iniciar importação" para começar o processamento dos seus dados do Notion.',
      upload_progress_message: "Por favor, não feche esta janela.",
    },
  },
  confluence_importer: {
    confluence_importer_description: "Importe seus dados do Confluence para o wiki do Plane.",
    steps: {
      title_upload_zip: "Enviar ZIP exportado do Confluence",
      description_upload_zip: "Por favor, envie o arquivo ZIP contendo seus dados do Confluence.",
    },
    upload: {
      drop_file_here: "Solte seu arquivo zip do Confluence aqui",
      upload_title: "Enviar exportação do Confluence",
      upload_from_url: "Importar de URL",
      upload_from_url_description: "Cole a URL pública da sua exportação ZIP para continuar.",
      drag_drop_description: "Arraste e solte seu arquivo zip de exportação do Confluence, ou clique para navegar",
      file_type_restriction: "Apenas arquivos .zip exportados do Confluence são suportados",
      select_file: "Selecionar arquivo",
      uploading: "Enviando...",
      preparing_upload: "Preparando envio...",
      confirming_upload: "Confirmando envio...",
      confirming: "Confirmando...",
      upload_complete: "Envio concluído",
      upload_failed: "Falha no envio",
      start_import: "Iniciar importação",
      retry_upload: "Tentar envio novamente",
      upload: "Enviar",
      ready: "Pronto",
      error: "Erro",
      upload_complete_message: "Envio concluído!",
      upload_complete_description:
        'Clique em "Iniciar importação" para começar o processamento dos seus dados do Confluence.',
      upload_progress_message: "Por favor, não feche esta janela.",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "Importe seus dados CSV para projetos do Plane.",
    steps: {
      title_configure_plane: "Configurar Plane",
      description_configure_plane:
        "Por favor, primeiro crie o projeto no Plane onde você pretende migrar seus dados CSV. Depois que o projeto for criado, selecione-o aqui.",
      title_configure_csv: "Configurar CSV",
      description_configure_csv:
        "Por favor, faça upload do seu arquivo CSV e configure os campos a serem mapeados para os campos do Plane.",
    },
  },
  csv_importer: {
    csv_importer_description: "Importe itens de trabalho de arquivos CSV para projetos Plane.",
    steps: {
      title_select_project: "Selecionar projeto",
      description_select_project: "Selecione o projeto Plane para o qual deseja importar seus itens de trabalho.",
      title_upload_csv: "Carregar CSV",
      description_upload_csv:
        "Carregue seu arquivo CSV contendo itens de trabalho. O arquivo deve incluir colunas para nome, descrição, prioridade, datas e grupo de estados.",
    },
  },
  clickup_importer: {
    clickup_importer_description: "Importe seus dados do ClickUp para projetos do Plane.",
    select_service_space: "Selecionar Espaço do {serviceName}",
    select_service_folder: "Selecionar Pasta do {serviceName}",
    selected: "Selecionado",
    users: "Usuários",
    steps: {
      title_configure_plane: "Configurar Plane",
      description_configure_plane:
        "Por favor, primeiro crie o projeto no Plane onde você pretende migrar seus dados do ClickUp. Depois que o projeto for criado, selecione-o aqui.",
      title_configure_clickup: "Configurar ClickUp",
      description_configure_clickup:
        "Por favor, selecione a equipe, o espaço e a pasta do ClickUp do qual você deseja migrar seus dados.",
      title_map_states: "Mapear Estados",
      description_map_states:
        "Correspondemos automaticamente os statuses do ClickUp aos estados do Plane da melhor maneira possível. Por favor, mapeie quaisquer estados restantes antes de prosseguir, você também pode criar estados e mapá-los manualmente.",
      title_map_priorities: "Mapear Prioridades",
      description_map_priorities:
        "Por favor, selecione as prioridades do ClickUp que você deseja mapear para as prioridades do projeto do Plane.",
      title_summary: "Resumo",
      description_summary: "Aqui está um resumo dos dados que serão migrados do ClickUp para o Plane.",
      pull_additional_data_title: "Importar comentários e anexos",
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
            stacked: "Empilhado",
            grouped: "Agrupado",
          },
          orientation: {
            label: "Orientação",
            horizontal: "Horizontal",
            vertical: "Vertical",
            placeholder: "Adicionar orientação",
          },
          bar_color: "Cor da barra",
        },
        line_chart: {
          short_label: "Linha",
          long_label: "Gráfico de linha",
          chart_models: {
            basic: "Básico",
            multi_line: "Múltiplas linhas",
          },
          line_color: "Cor da linha",
          line_type: {
            label: "Tipo de linha",
            solid: "Sólida",
            dashed: "Tracejada",
            placeholder: "Adicionar tipo de linha",
          },
        },
        area_chart: {
          short_label: "Área",
          long_label: "Gráfico de área",
          chart_models: {
            basic: "Básico",
            stacked: "Empilhado",
            comparison: "Comparação",
          },
          fill_color: "Cor de preenchimento",
        },
        donut_chart: {
          short_label: "Rosca",
          long_label: "Gráfico de rosca",
          chart_models: {
            basic: "Básico",
            progress: "Progresso",
          },
          center_value: "Valor central",
          completed_color: "Cor de concluído",
        },
        pie_chart: {
          short_label: "Pizza",
          long_label: "Gráfico de pizza",
          chart_models: {
            basic: "Básico",
          },
          group: {
            label: "Pedaços agrupados",
            group_thin_pieces: "Agrupar pedaços finos",
            minimum_threshold: {
              label: "Limite mínimo",
              placeholder: "Adicionar limite",
            },
            name_group: {
              label: "Nome do grupo",
              placeholder: '"Menos que 5%"',
            },
          },
          show_values: "Mostrar valores",
          value_type: {
            percentage: "Porcentagem",
            count: "Contagem",
          },
        },
        text: {
          short_label: "Texto",
          long_label: "Texto",
          alignment: {
            label: "Alinhamento do texto",
            left: "Esquerda",
            center: "Centro",
            right: "Direita",
            placeholder: "Adicionar alinhamento de texto",
          },
          text_color: "Cor do texto",
        },
        table_chart: {
          short_label: "Tabela",
          long_label: "Gráfico de tabela",
          chart_models: {
            basic: {
              short_label: "Básico",
              long_label: "Tabela",
            },
          },
          columns: "Colunas",
          rows: "Linhas",
          rows_placeholder: "Adicionar linhas",
          configure_rows_hint: "Selecione uma propriedade para as linhas para visualizar esta tabela.",
        },
      },
      color_palettes: {
        modern: "Moderno",
        horizon: "Horizonte",
        earthen: "Terroso",
      },
      common: {
        add_widget: "Adicionar widget",
        widget_title: {
          label: "Nomear este widget",
          placeholder: 'ex., "A fazer ontem", "Todos Completos"',
        },
        chart_type: "Tipo de gráfico",
        visualization_type: {
          label: "Tipo de visualização",
          placeholder: "Adicionar tipo de visualização",
        },
        date_group: {
          label: "Grupo de data",
          placeholder: "Adicionar grupo de data",
        },
        grouping: "Agrupamento",
        group_by: "Agrupar por",
        stacking: "Empilhamento",
        stack_by: "Empilhar por",
        daily: "Diário",
        weekly: "Semanal",
        monthly: "Mensal",
        yearly: "Anual",
        work_item_count: "Contagem de itens de trabalho",
        estimate_point: "Ponto de estimativa",
        pending_work_item: "Itens de trabalho pendentes",
        completed_work_item: "Itens de trabalho concluídos",
        in_progress_work_item: "Itens de trabalho em andamento",
        blocked_work_item: "Itens de trabalho bloqueados",
        work_item_due_this_week: "Itens de trabalho com vencimento esta semana",
        work_item_due_today: "Itens de trabalho com vencimento hoje",
        color_scheme: {
          label: "Esquema de cores",
          placeholder: "Adicionar esquema de cores",
        },
        smoothing: "Suavização",
        markers: "Marcadores",
        legends: "Legendas",
        tooltips: "Dicas",
        opacity: {
          label: "Opacidade",
          placeholder: "Adicionar opacidade",
        },
        border: "Borda",
        widget_configuration: "Configuração do widget",
        configure_widget: "Configurar widget",
        guides: "Guias",
        style: "Estilo",
        area_appearance: "Aparência da área",
        comparison_line_appearance: "Aparência da linha de comparação",
        add_property: "Adicionar propriedade",
        add_metric: "Adicionar métrica",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "O eixo x está sem um valor.",
            y_axis_metric: "A métrica está sem um valor.",
          },
          stacked: {
            x_axis_property: "O eixo x está sem um valor.",
            y_axis_metric: "A métrica está sem um valor.",
            group_by: "Empilhar por está sem um valor.",
          },
          grouped: {
            x_axis_property: "O eixo x está sem um valor.",
            y_axis_metric: "A métrica está sem um valor.",
            group_by: "Agrupar por está sem um valor.",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "O eixo x está sem um valor.",
            y_axis_metric: "A métrica está sem um valor.",
          },
          multi_line: {
            x_axis_property: "O eixo x está sem um valor.",
            y_axis_metric: "A métrica está sem um valor.",
            group_by: "Agrupar por está sem um valor.",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "O eixo x está sem um valor.",
            y_axis_metric: "A métrica está sem um valor.",
          },
          stacked: {
            x_axis_property: "O eixo x está sem um valor.",
            y_axis_metric: "A métrica está sem um valor.",
            group_by: "Empilhar por está sem um valor.",
          },
          comparison: {
            x_axis_property: "O eixo x está sem um valor.",
            y_axis_metric: "A métrica está sem um valor.",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "O eixo x está sem um valor.",
            y_axis_metric: "A métrica está sem um valor.",
          },
          progress: {
            y_axis_metric: "A métrica está sem um valor.",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "O eixo x está sem um valor.",
            y_axis_metric: "A métrica está sem um valor.",
          },
        },
        text: {
          basic: {
            y_axis_metric: "A métrica está sem um valor.",
          },
        },
        table_chart: {
          basic: {
            x_axis_property: "As colunas estão sem um valor.",
            group_by: "As linhas estão sem um valor.",
          },
        },
        ask_admin: "Peça ao seu administrador para configurar este widget.",
      },
    },
    create_modal: {
      heading: {
        create: "Criar novo dashboard",
        update: "Atualizar dashboard",
      },
      title: {
        label: "Nomeie seu dashboard.",
        placeholder: '"Capacidade entre projetos", "Carga de trabalho por equipe", "Estado em todos os projetos"',
        required_error: "Título é obrigatório",
      },
      project: {
        label: "Escolher projetos",
        placeholder: "Dados desses projetos alimentarão este dashboard.",
        required_error: "Projetos são obrigatórios",
      },
      filters_label: "Defina filtros para as fontes de dados acima",
      create_dashboard: "Criar dashboard",
      update_dashboard: "Atualizar dashboard",
    },
    delete_modal: {
      heading: "Excluir dashboard",
    },
    empty_state: {
      feature_flag: {
        title: "Apresente seu progresso em dashboards sob demanda e permanentes.",
        description:
          "Construa qualquer dashboard que você precise e personalize como seus dados aparecem para a apresentação perfeita do seu progresso.",
        coming_soon_to_mobile: "Em breve no aplicativo móvel",
        card_1: {
          title: "Para todos os seus projetos",
          description:
            "Obtenha uma visão total do seu workspace com todos os seus projetos ou filtre seus dados de trabalho para aquela visualização perfeita do seu progresso.",
        },
        card_2: {
          title: "Para qualquer dado no Plane",
          description:
            "Vá além do Analytics padrão e gráficos de Ciclo prontos para uso para ver equipes, iniciativas ou qualquer outra coisa como você nunca viu antes.",
        },
        card_3: {
          title: "Para todas as suas necessidades de visualização de dados",
          description:
            "Escolha entre vários gráficos personalizáveis com controles detalhados para ver e mostrar seus dados de trabalho exatamente como você deseja.",
        },
        card_4: {
          title: "Sob demanda e permanente",
          description:
            "Construa uma vez, mantenha para sempre com atualizações automáticas dos seus dados, flags contextuais para mudanças de escopo e links permanentes compartilháveis.",
        },
        card_5: {
          title: "Exportações e comunicações agendadas",
          description:
            "Para aqueles momentos em que os links não funcionam, exporte seus dashboards em PDFs únicos ou agende-os para serem enviados aos stakeholders automaticamente.",
        },
        card_6: {
          title: "Layout automático para todos os dispositivos",
          description:
            "Redimensione seus widgets para o layout que você deseja e veja-o exatamente da mesma forma em dispositivos móveis, tablets e outros navegadores.",
        },
      },
      dashboards_list: {
        title:
          "Visualize dados em widgets, construa seus dashboards com widgets e veja as últimas informações sob demanda.",
        description:
          "Construa seus dashboards com Widgets Personalizados que mostram seus dados no escopo que você especificar. Obtenha dashboards para todo o seu trabalho em projetos e equipes e compartilhe links permanentes com stakeholders para acompanhamento sob demanda.",
      },
      dashboards_search: {
        title: "Isso não corresponde ao nome de um dashboard.",
        description: "Certifique-se de que sua consulta está correta ou tente outra consulta.",
      },
      widgets_list: {
        title: "Visualize seus dados como você deseja.",
        description: `Use linhas, barras, pizzas e outros formatos para ver seus dados
da maneira que você quiser a partir das fontes que você especificar.`,
      },
      widget_data: {
        title: "Nada para ver aqui",
        description: "Atualize ou adicione dados para vê-los aqui.",
      },
    },
    common: {
      editing: "Editando",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "Permitir novos itens de trabalho",
      work_item_creation_disable_tooltip: "A criação de itens de trabalho está desativada para este estado",
      default_state:
        "O estado padrão permite que todos os membros criem novos itens de trabalho. Isso não pode ser alterado",
      state_change_count:
        "{count, plural, one {1 mudança de estado permitida} other {{count} mudanças de estado permitidas}}",
      movers_count: "{count, plural, one {1 revisor listado} other {{count} revisores listados}}",
      state_changes: {
        label: {
          default: "Adicionar mudança de estado permitida",
          loading: "Adicionando mudança de estado permitida",
        },
        move_to: "Mudar estado para",
        movers: {
          label: "Quando revisado por",
          tooltip: "Revisores são pessoas que têm permissão para mover itens de trabalho de um estado para outro.",
          add: "Adicionar revisores",
        },
      },
    },
    workflow_disabled: {
      title: "Você não pode mover este item de trabalho para cá.",
    },
    workflow_enabled: {
      label: "Mudança de estado",
    },
    workflow_tree: {
      label: "Para itens de trabalho em",
      state_change_label: "pode movê-lo para",
    },
    empty_state: {
      upgrade: {
        title: "Controle o caos de mudanças e revisões com Fluxos de Trabalho.",
        description: "Defina regras para onde seu trabalho se move, por quem e quando com Fluxos de Trabalho no Plane.",
      },
    },
    quick_actions: {
      view_change_history: "Ver histórico de mudanças",
      reset_workflow: "Reiniciar fluxo de trabalho",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "Tem certeza de que deseja reiniciar este fluxo de trabalho?",
        description:
          "Se você reiniciar este fluxo de trabalho, todas as suas regras de mudança de estado serão excluídas e você terá que criá-las novamente para executá-las neste projeto.",
      },
      delete_state_change: {
        title: "Tem certeza de que deseja excluir esta regra de mudança de estado?",
        description:
          "Uma vez excluída, você não pode desfazer esta alteração e terá que definir a regra novamente se quiser que ela funcione para este projeto.",
      },
    },
    toasts: {
      enable_disable: {
        loading: "{action} fluxo de trabalho",
        success: {
          title: "Sucesso",
          message: "Fluxo de trabalho {action} com sucesso",
        },
        error: {
          title: "Erro",
          message: "Fluxo de trabalho não pôde ser {action}. Por favor, tente novamente.",
        },
      },
      reset: {
        success: {
          title: "Sucesso",
          message: "Fluxo de trabalho reiniciado com sucesso",
        },
        error: {
          title: "Erro ao reiniciar fluxo de trabalho",
          message: "Fluxo de trabalho não pôde ser reiniciado. Por favor, tente novamente.",
        },
      },
      add_state_change_rule: {
        error: {
          title: "Erro ao adicionar regra de mudança de estado",
          message: "A regra de mudança de estado não pôde ser adicionada. Por favor, tente novamente.",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "Erro ao modificar regra de mudança de estado",
          message: "A regra de mudança de estado não pôde ser modificada. Por favor, tente novamente.",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "Erro ao remover regra de mudança de estado",
          message: "A regra de mudança de estado não pôde ser removida. Por favor, tente novamente.",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "Erro ao modificar revisores da regra de mudança de estado",
          message:
            "Os revisores da regra de mudança de estado não puderam ser modificados. Por favor, tente novamente.",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {Cliente} other {Clientes}}",
    upgrade: {
      title: "Priorize e gerencie trabalho com Clientes.",
      description: "Mapeie seu trabalho para clientes e priorize por atributos de cliente.",
    },
    properties: {
      default: {
        title: "Propriedades padrão",
        customer_name: {
          name: "Nome do cliente",
          placeholder: "Pode ser o nome da pessoa ou empresa",
          validation: {
            required: "Nome do cliente é obrigatório.",
            max_length: "Nome do cliente não pode ter mais de 255 caracteres.",
          },
        },
        description: {
          name: "Descrição",
          validation: {},
        },
        email: {
          name: "Email",
          placeholder: "Digite o email",
          validation: {
            required: "Email é obrigatório.",
            pattern: "Endereço de email inválido.",
          },
        },
        website_url: {
          name: "Website",
          placeholder: "Qualquer URL com https:// funcionará.",
          placeholder_short: "Adicionar website",
          validation: {
            pattern: "URL do website inválida",
          },
        },
        employees: {
          name: "Funcionários",
          placeholder: "Número de funcionários se seu cliente for uma empresa.",
          validation: {
            min_length: "Funcionários não pode ser menos que 0.",
          },
        },
        size: {
          name: "Tamanho",
          placeholder: "Adicionar tamanho da empresa",
          validation: {
            min_length: "Tamanho inválido",
          },
        },
        domain: {
          name: "Indústria",
          placeholder: "Varejo, e-Commerce, Fintech, Bancário",
          placeholder_short: "Adicionar indústria",
          validation: {},
        },
        stage: {
          name: "Estágio",
          placeholder: "Selecionar estágio",
          validation: {},
        },
        contract_status: {
          name: "Status do Contrato",
          placeholder: "Selecionar status do contrato",
          validation: {},
        },
        revenue: {
          name: "Receita",
          placeholder: "Esta é a receita que seu cliente gera anualmente.",
          validation: {
            min_length: "Receita não pode ser menor que 0.",
          },
        },
      },
      custom: {
        title: "Propriedades personalizadas",
        info: "Adicione os atributos exclusivos dos seus clientes ao Plane para que você possa gerenciar melhor os itens de trabalho ou registros de clientes.",
      },
      empty_state: {
        title: "Você ainda não tem nenhuma propriedade personalizada.",
        description:
          "Propriedades personalizadas que você gostaria de ver em itens de trabalho, em outros lugares no Plane, ou fora do Plane em um CRM ou outra ferramenta, aparecerão aqui quando você adicioná-las.",
      },
      add: {
        primary_button: "Adicionar nova propriedade",
      },
    },
    stage: {
      lead: "Lead",
      sales_qualified_lead: "Lead qualificado para vendas",
      contract_negotiation: "Negociação de contrato",
      closed_won: "Fechado ganho",
      closed_lost: "Fechado perdido",
    },
    contract_status: {
      active: "Ativo",
      pre_contract: "Pré-contrato",
      signed: "Assinado",
      inactive: "Inativo",
    },
    empty_state: {
      detail: {
        title: "Não conseguimos encontrar esse registro de cliente.",
        description: "O link para este registro pode estar errado ou este registro pode ter sido excluído.",
        primary_button: "Ir para clientes",
        secondary_button: "Adicionar um cliente",
      },
      search: {
        title: "Parece que você não tem registros de clientes correspondentes a esse termo.",
        description:
          "Tente com outro termo de pesquisa ou entre em contato conosco se você tem certeza de que deveria ver resultados para esse termo.",
      },
      list: {
        title: "Gerencie o volume, ritmo e fluxo do seu trabalho pelo que é importante para seus clientes.",
        description:
          "Com Clientes, um recurso exclusivo do Plane, agora você pode criar novos clientes do zero e conectá-los ao seu trabalho. Em breve, você poderá trazê-los de outras ferramentas junto com seus atributos personalizados que são importantes para você.",
        primary_button: "Adicione seu primeiro cliente",
      },
    },
    settings: {
      unauthorized: "Você não está autorizado a acessar esta página.",
      description: "Acompanhe e gerencie relacionamentos com clientes em seu fluxo de trabalho.",
      enable: "Habilitar Clientes",
      toasts: {
        enable: {
          loading: "Habilitando recurso de clientes...",
          success: {
            title: "Você ativou Clientes para este workspace.",
            message: "Você não pode desativá-lo novamente.",
          },
          error: {
            title: "Não conseguimos ativar Clientes desta vez.",
            message: "Tente novamente ou volte a esta tela mais tarde. Se ainda não funcionar.",
            action: "Falar com suporte",
          },
        },
        disable: {
          loading: "Desabilitando recurso de clientes...",
          success: {
            title: "Clientes desabilitados",
            message: "Recurso de clientes desabilitado com sucesso!",
          },
          error: {
            title: "Erro",
            message: "Falha ao desabilitar recurso de clientes!",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "Não conseguimos obter sua lista de clientes.",
          message: "Tente novamente ou atualize esta página.",
        },
      },
      copy_link: {
        title: "Você copiou o link direto para este cliente.",
        message: "Cole em qualquer lugar e ele levará de volta para cá.",
      },
      create: {
        success: {
          title: "{customer_name} agora está disponível",
          message:
            "Você pode fazer referência a este cliente em itens de trabalho e também acompanhar solicitações deles.",
          actions: {
            view: "Visualizar",
            copy_link: "Copiar link",
            copied: "Copiado!",
          },
        },
        error: {
          title: "Não conseguimos criar esse registro desta vez.",
          message:
            "Tente salvá-lo novamente ou copie seu texto não salvo para uma nova entrada, preferencialmente em outra aba.",
        },
      },
      update: {
        success: {
          title: "Sucesso!",
          message: "Cliente atualizado com sucesso!",
        },
        error: {
          title: "Erro!",
          message: "Não foi possível atualizar o cliente. Tente novamente!",
        },
      },
      logo: {
        error: {
          title: "Não conseguimos enviar o logotipo do cliente.",
          message: "Tente salvar o logotipo novamente ou comece do zero.",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "Você removeu um item de trabalho do registro deste cliente.",
            message: "Também removemos automaticamente este cliente do item de trabalho.",
          },
          error: {
            title: "Não conseguimos remover esse item de trabalho do registro deste cliente desta vez.",
            message: "Também removemos automaticamente este cliente do item de trabalho.",
          },
        },
        add: {
          error: {
            title: "Não conseguimos adicionar esse item de trabalho ao registro deste cliente desta vez.",
            message:
              "Tente adicionar esse item de trabalho novamente ou volte a ele mais tarde. Se ainda não funcionar, entre em contato conosco.",
          },
          success: {
            title: "Você adicionou um item de trabalho ao registro deste cliente.",
            message: "Também adicionamos automaticamente este cliente ao item de trabalho.",
          },
        },
      },
    },
    quick_actions: {
      edit: "Editar",
      copy_link: "Copiar link para cliente",
      delete: "Excluir",
    },
    create: {
      label: "Criar registro de cliente",
      loading: "Criando",
      cancel: "Cancelar",
    },
    update: {
      label: "Atualizar cliente",
      loading: "Atualizando",
    },
    delete: {
      title: "Tem certeza que deseja excluir o registro do cliente {customer_name}?",
      description:
        "Todos os dados associados a este registro serão excluídos permanentemente. Você não poderá restaurar este registro posteriormente.",
    },
    requests: {
      empty_state: {
        list: {
          title: "Ainda não há solicitações para mostrar.",
          description: "Crie solicitações de seus clientes para que você possa vinculá-las a itens de trabalho.",
          button: "Adicionar nova solicitação",
        },
        search: {
          title: "Parece que você não tem solicitações correspondentes a esse termo.",
          description:
            "Tente com outro termo de pesquisa ou entre em contato conosco se você tem certeza de que deveria ver resultados para esse termo.",
        },
      },
      label: "{count, plural, one {Solicitação} other {Solicitações}}",
      add: "Adicionar solicitação",
      create: "Criar solicitação",
      update: "Atualizar solicitação",
      form: {
        name: {
          placeholder: "Nomeie esta solicitação",
          validation: {
            required: "Nome é obrigatório.",
            max_length: "Nome da solicitação não deve exceder 255 caracteres.",
          },
        },
        description: {
          placeholder: "Descreva a natureza da solicitação ou cole o comentário deste cliente de outra ferramenta.",
        },
        source: {
          add: "Adicionar fonte",
          update: "Atualizar fonte",
          url: {
            label: "URL",
            required: "URL é obrigatória",
            invalid: "URL do website inválida",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "Link copiado",
          message: "Link da solicitação do cliente copiado para a área de transferência.",
        },
        attachment: {
          upload: {
            loading: "Enviando anexo...",
            success: {
              title: "Anexo enviado",
              message: "O anexo foi enviado com sucesso.",
            },
            error: {
              title: "Anexo não enviado",
              message: "O anexo não pôde ser enviado.",
            },
          },
          size: {
            error: {
              title: "Erro!",
              message: "Apenas um arquivo pode ser enviado por vez.",
            },
          },
          length: {
            message: "O arquivo deve ter {size}MB ou menos",
          },
          remove: {
            success: {
              title: "Anexo removido",
              message: "O anexo foi removido com sucesso",
            },
            error: {
              title: "Anexo não removido",
              message: "O anexo não pôde ser removido",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "Sucesso!",
              message: "Fonte atualizada com sucesso!",
            },
            error: {
              title: "Erro!",
              message: "Não foi possível atualizar a fonte.",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "Erro!",
              message: "Não foi possível adicionar itens de trabalho à solicitação. Tente novamente.",
            },
            success: {
              title: "Sucesso!",
              message: "Itens de trabalho adicionados à solicitação.",
            },
          },
        },
        update: {
          success: {
            message: "Solicitação atualizada com sucesso!",
            title: "Sucesso!",
          },
          error: {
            title: "Erro!",
            message: "Não foi possível atualizar a solicitação. Tente novamente!",
          },
        },
        create: {
          success: {
            message: "Solicitação criada com sucesso!",
            title: "Sucesso!",
          },
          error: {
            title: "Erro!",
            message: "Não foi possível criar a solicitação. Tente novamente!",
          },
        },
      },
    },
    linked_work_items: {
      label: "Itens de trabalho vinculados",
      link: "Vincular itens de trabalho",
      empty_state: {
        list: {
          title: "Parece que você ainda não tem itens de trabalho vinculados a este cliente.",
          description:
            "Vincule itens de trabalho existentes de qualquer projeto aqui para que você possa rastreá-los por este cliente.",
          button: "Vincular item de trabalho",
        },
      },
      action: {
        remove_epic: "Remover épico",
        remove: "Remover item de trabalho",
      },
    },
    sidebar: {
      properties: "Propriedades",
    },
  },
  templates: {
    settings: {
      title: "Modelos",
      description:
        "Economize 80% do tempo gasto na criação de projetos, itens de trabalho e páginas quando você usa modelos.",
      options: {
        project: {
          label: "Modelos de projeto",
        },
        work_item: {
          label: "Modelos de item de trabalho",
        },
        page: {
          label: "Modelos de página",
        },
      },
      create_template: {
        label: "Criar modelo",
        no_permission: {
          project: "Entre em contato com o administrador do projeto para criar modelos",
          workspace: "Entre em contato com o administrador do workspace para criar modelos",
        },
      },
      use_template: {
        button: {
          default: "Usar modelo",
          loading: "Usando",
        },
      },
      template_source: {
        workspace: {
          info: "Derivado do workspace",
        },
        project: {
          info: "Derivado do projeto",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "Nomeie seu modelo de projeto.",
              validation: {
                required: "Nome do modelo é obrigatório",
                maxLength: "Nome do modelo deve ter menos de 255 caracteres",
              },
            },
            description: {
              placeholder: "Descreva quando e como usar este modelo.",
            },
          },
          name: {
            placeholder: "Nomeie seu projeto.",
            validation: {
              required: "Título do projeto é obrigatório",
              maxLength: "Título do projeto deve ter menos de 255 caracteres",
            },
          },
          description: {
            placeholder: "Descreva o propósito e objetivos deste projeto.",
          },
          button: {
            create: "Criar modelo de projeto",
            update: "Atualizar modelo de projeto",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "Nomeie seu modelo de item de trabalho.",
              validation: {
                required: "Nome do modelo é obrigatório",
                maxLength: "Nome do modelo deve ter menos de 255 caracteres",
              },
            },
            description: {
              placeholder: "Descreva quando e como usar este modelo.",
            },
          },
          name: {
            placeholder: "Dê um título a este item de trabalho.",
            validation: {
              required: "Título do item de trabalho é obrigatório",
              maxLength: "Título do item de trabalho deve ter menos de 255 caracteres",
            },
          },
          description: {
            placeholder: "Descreva este item de trabalho para que fique claro o que você realizará quando concluí-lo.",
          },
          button: {
            create: "Criar modelo de item de trabalho",
            update: "Atualizar modelo de item de trabalho",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "Nomeie swoj szablon strony.",
              validation: {
                required: "Nazwa szablonu jest wymagana",
                maxLength: "Nazwa szablonu powinna mieć mniej niż 255 znaków",
              },
            },
            description: {
              placeholder: "Opisz, kiedy i jak używać tego szablonu.",
            },
          },
          name: {
            placeholder: "Nieznana strona",
            validation: {
              maxLength: "Nazwa strony powinna mieć mniej niż 255 znaków",
            },
          },
          button: {
            create: "Utwórz szablon strony",
            update: "Aktualizuj szablon strony",
          },
        },
        publish: {
          action: "{isPublished, select, true {Configurações de publicação} other {Publicar no Marketplace}}",
          unpublish_action: "Remover do Marketplace",
          title: "Upewnij się, że szablon jest odkrywalny i rozpoznawalny.",
          name: {
            label: "Nazwa szablonu",
            placeholder: "Nazwij swoj szablon",
            validation: {
              required: "Nazwa szablonu jest wymagana",
              maxLength: "Nazwa szablonu powinna mieć mniej niż 255 znaków",
            },
          },
          short_description: {
            label: "Krótki opis",
            placeholder:
              "Ten szablon jest idealny dla menedżerów projektów, którzy zarządzają wieloma projektami jednocześnie.",
            validation: {
              required: "Krótki opis jest wymagany",
            },
          },
          description: {
            label: "Opis",
            placeholder: `Aumente a produtividade e otimize a comunicação com nossa integração de Fala-para-Texto.
• Transcrição em tempo real: Converta palavras faladas em texto preciso instantaneamente.
• Criação de tarefas e comentários: Adicione tarefas, descrições e comentários através de comandos de voz.`,
            validation: {
              required: "Opis jest wymagany",
            },
          },
          category: {
            label: "Kategoria",
            placeholder: "Wybierz, gdzie uważasz, że pasuje najlepiej. Możesz wybrać więcej niż jedną.",
            validation: {
              required: "Przynajmniej jedna kategoria jest wymagana",
            },
          },
          keywords: {
            label: "Palavras-chave",
            placeholder: "Use termos que você acha que seus usuários procurarão ao buscar por este modelo.",
            helperText:
              "Insira palavras-chave separadas por vírgulas que ajudarão as pessoas a encontrar este modelo na pesquisa.",
            validation: {
              required: "Pelo menos uma palavra-chave é obrigatória",
            },
          },
          company_name: {
            label: "Nazwa firmy",
            placeholder: "Plane",
            validation: {
              required: "Nazwa firmy jest wymagana",
              maxLength: "Nazwa firmy powinna mieć mniej niż 255 znaków",
            },
          },
          contact_email: {
            label: "Email podpory",
            placeholder: "help@plane.so",
            validation: {
              invalid: "Nieprawidłowy adres e-mail",
              required: "Email podpory jest wymagany",
              maxLength: "Email podpory powinien mieć mniej niż 255 znaków",
            },
          },
          privacy_policy_url: {
            label: "Link do Twojej polityki prywatności",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "Nieprawidłowy URL",
              maxLength: "URL powinien mieć mniej niż 800 znaków",
            },
          },
          terms_of_service_url: {
            label: "Link do Twoich warunków użycia",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "Nieprawidłowy URL",
              maxLength: "URL powinien mieć mniej niż 800 znaków",
            },
          },
          cover_image: {
            label: "Adicione uma imagem de capa que será exibida no marketplace",
            upload_title: "Enviar imagem de capa",
            upload_placeholder: "Clique para enviar ou arraste e solte para enviar uma imagem de capa",
            drop_here: "Solte aqui",
            click_to_upload: "Clique para enviar",
            invalid_file_or_exceeds_size_limit:
              "Arquivo inválido ou excede o limite de tamanho. Por favor, tente novamente.",
            upload_and_save: "Enviar e salvar",
            uploading: "Enviando",
            remove: "Remover",
            removing: "Removendo",
            validation: {
              required: "A imagem de capa é obrigatória",
            },
          },
          attach_screenshots: {
            label:
              "Dołącz dokumenty i obrazy, które uważasz, że sprawią, że widzowie tego szablonu będą zainteresowani.",
            validation: {
              required: "Przynajmniej jedno zrzut ekranu jest wymagane",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "Modelos",
        description:
          "Com modelos de projeto, item de trabalho e página no Plane, você não precisa criar um projeto do zero ou definir propriedades de item de trabalho manualmente.",
        sub_description: "Recupere 80% do seu tempo administrativo quando você usa Modelos.",
      },
      no_templates: {
        button: "Crie seu primeiro modelo",
      },
      no_labels: {
        description:
          " Ainda não há etiquetas. Crie etiquetas para ajudar a organizar e filtrar itens de trabalho em seu projeto.",
      },
      no_work_items: {
        description: "Não há itens de trabalho ainda. Adicione um para estruturar seu trabalho melhor.",
      },
      no_sub_work_items: {
        description: "Não há itens de trabalho ainda. Adicione um para estruturar seu trabalho melhor.",
      },
      page: {
        no_templates: {
          title: "Não há modelos aos quais você tem acesso.",
          description: "Por favor, crie um modelo",
        },
        no_results: {
          title: "Isso não corresponde a nenhum modelo.",
          description: "Tente pesquisar com outros termos.",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "Modelo criado",
          message: "{templateName}, o modelo de {templateType}, agora está disponível para seu workspace.",
        },
        error: {
          title: "Não conseguimos criar esse modelo desta vez.",
          message:
            "Tente salvar seus detalhes novamente ou copie-os para um novo modelo, preferencialmente em outra aba.",
        },
      },
      update: {
        success: {
          title: "Modelo alterado",
          message: "{templateName}, o modelo de {templateType}, foi alterado.",
        },
        error: {
          title: "Não conseguimos salvar alterações neste modelo.",
          message:
            "Tente salvar seus detalhes novamente ou volte a este modelo mais tarde. Se ainda houver problemas, entre em contato conosco.",
        },
      },
      delete: {
        success: {
          title: "Modelo excluído",
          message: "{templateName}, o modelo de {templateType}, foi excluído do seu workspace.",
        },
        error: {
          title: "Não conseguimos excluir esse modelo.",
          message:
            "Tente excluí-lo novamente ou volte a ele mais tarde. Se você não conseguir excluí-lo, entre em contato conosco.",
        },
      },
      unpublish: {
        success: {
          title: "Modelo removido",
          message: "{templateName}, o modelo de {templateType}, foi removido.",
        },
        error: {
          title: "Não conseguimos remover esse modelo desta vez.",
          message:
            "Tente removê-lo novamente ou volte a ele mais tarde. Se você não conseguir removê-lo, entre em contato conosco.",
        },
      },
    },
    delete_confirmation: {
      title: "Excluir modelo",
      description: {
        prefix: "Tem certeza que deseja excluir o modelo-",
        suffix:
          "? Todos os dados relacionados ao modelo serão removidos permanentemente. Esta ação não pode ser desfeita.",
      },
    },
    unpublish_confirmation: {
      title: "Remover modelo",
      description: {
        prefix: "Tem certeza que deseja remover o modelo-",
        suffix: "? Este modelo não estará mais disponível para usuários no marketplace.",
      },
    },
  },
  dropdown: {
    add: {
      work_item: "Adicionar novo modelo",
      project: "Adicionar novo modelo",
    },
    label: {
      project: "Escolher um modelo de projeto",
      page: "Escolher a partir do modelo",
    },
    tooltip: {
      work_item: "Escolher um modelo de item de trabalho",
    },
    no_results: {
      work_item: "Nenhum modelo encontrado.",
      project: "Nenhum modelo encontrado.",
    },
  },
  intake_forms: {
    create: {
      title: "Criar um item de trabalho",
      "sub-title": "Informe à equipe sobre o que você gostaria que eles trabalhassem.",
      name: "Nome",
      email: "E-mail",
      about: "Sobre o que é este item de trabalho?",
      description: "Descreva o que deveria acontecer",
      description_placeholder:
        "Adicione quantos detalhes quiser para ajudar a equipe a identificar sua situação e necessidades.",
      loading: "Criando",
      create_work_item: "Criar item de trabalho",
      errors: {
        name: "Nome é obrigatório",
        name_max_length: "O nome deve ter menos de 255 caracteres",
        email: "E-mail é obrigatório",
        email_invalid: "Endereço de e-mail inválido",
        title: "Título é obrigatório",
        title_max_length: "O título deve ter menos de 255 caracteres",
      },
    },
    success: {
      title: "Seu item de trabalho está na fila da equipe.",
      description: "A equipe pode aprovar ou descartar este item de trabalho da fila de admissão.",
      primary_button: {
        text: "Adicionar outro item de trabalho",
      },
      secondary_button: {
        text: "Saiba mais sobre Admissão",
      },
    },
    how_it_works: {
      title: "Como funciona?",
      heading: "Este é um formulário de Admissão.",
      description:
        "Admissão é um recurso do Plane que permite que administradores e gerentes de projeto recebam itens de trabalho externos em seus projetos.",
      steps: {
        step_1: "Este formulário curto permite criar um novo item de trabalho em um projeto Plane.",
        step_2: "Ao enviar este formulário, um novo item de trabalho é criado na Admissão desse projeto.",
        step_3: "Alguém desse projeto ou equipe irá revisar.",
        step_4:
          "Se aprovarem, este item será movido para a fila de trabalho do projeto. Caso contrário, será rejeitado.",
        step_5:
          "Para verificar o status desse item, entre em contato com o gerente do projeto, administrador ou quem enviou o link desta página.",
      },
    },
    type_forms: {
      select_types: {
        title: "Selecionar tipo de item de trabalho",
        search_placeholder: "Pesquisar tipo de item de trabalho",
      },
      actions: {
        select_properties: "Selecionar propriedades",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "Itens de trabalho recorrentes",
      description:
        "Configure seu trabalho recorrente uma vez e nós cuidaremos das repetições. Você verá tudo aqui quando for necessário.",
      new_recurring_work_item: "Novo item de trabalho recorrente",
      update_recurring_work_item: "Atualizar item de trabalho recorrente",
      form: {
        interval: {
          title: "Agendamento",
          start_date: {
            validation: {
              required: "A data de início é obrigatória",
            },
          },
          interval_type: {
            validation: {
              required: "O tipo de intervalo é obrigatório",
            },
          },
        },
        button: {
          create: "Criar item de trabalho recorrente",
          update: "Atualizar item de trabalho recorrente",
        },
      },
      create_button: {
        label: "Criar item de trabalho recorrente",
        no_permission: "Entre em contato com o administrador do projeto para criar itens de trabalho recorrentes",
      },
    },
    empty_state: {
      upgrade: {
        title: "Seu trabalho no piloto automático",
        description:
          "Configure uma vez. Nós o traremos de volta quando chegar a hora. Faça upgrade para o Business para tornar o trabalho recorrente mais fácil.",
      },
      no_templates: {
        button: "Crie seu primeiro item de trabalho recorrente",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Item de trabalho recorrente criado",
          message: "{name}, o item de trabalho recorrente, agora está disponível no seu espaço de trabalho.",
        },
        error: {
          title: "Não foi possível criar o item de trabalho recorrente desta vez.",
          message:
            "Tente salvar seus dados novamente ou copie-os para um novo item de trabalho recorrente, de preferência em outra aba.",
        },
      },
      update: {
        success: {
          title: "Item de trabalho recorrente alterado",
          message: "{name}, o item de trabalho recorrente, foi alterado.",
        },
        error: {
          title: "Não foi possível salvar as alterações neste item de trabalho recorrente.",
          message:
            "Tente salvar seus dados novamente ou volte a este item de trabalho recorrente mais tarde. Se o problema persistir, entre em contato conosco.",
        },
      },
      delete: {
        success: {
          title: "Item de trabalho recorrente excluído",
          message: "{name}, o item de trabalho recorrente, foi excluído do seu espaço de trabalho.",
        },
        error: {
          title: "Não foi possível excluir o item de trabalho recorrente.",
          message: "Tente excluir novamente ou volte mais tarde. Se não conseguir excluir, entre em contato conosco.",
        },
      },
    },
    delete_confirmation: {
      title: "Excluir item de trabalho recorrente",
      description: {
        prefix: "Tem certeza que deseja excluir o item de trabalho recorrente-",
        suffix:
          "? Todos os dados relacionados ao item de trabalho recorrente serão removidos permanentemente. Esta ação não pode ser desfeita.",
      },
    },
  },
  automations: {
    settings: {
      title: "Automações personalizadas",
      create_automation: "Criar automação",
    },
    scope: {
      label: "Escopo",
      run_on: "Executar em",
    },
    trigger: {
      label: "Gatilho",
      add_trigger: "Adicionar gatilho",
      sidebar_header: "Configuração do gatilho",
      input_label: "Qual é o gatilho para esta automação?",
      input_placeholder: "Selecione uma opção",
      button: {
        previous: "Voltar",
        next: "Adicionar ação",
      },
    },
    condition: {
      label: "Condição",
      add_condition: "Adicionar condição",
      adding_condition: "Adicionando condição",
    },
    action: {
      label: "Ação",
      add_action: "Adicionar ação",
      sidebar_header: "Ações",
      input_label: "O que a automação faz?",
      input_placeholder: "Selecione uma opção",
      handler_name: {
        add_comment: "Adicionar comentário",
        change_property: "Alterar propriedade",
      },
      configuration: {
        label: "Configuração",
        change_property: {
          placeholders: {
            property_name: "Selecione uma propriedade",
            change_type: "Selecionar",
            property_value_select: "{count, plural, one{Selecionar valor} other{Selecionar valores}}",
            property_value_select_date: "Selecionar data",
          },
          validation: {
            property_name_required: "Nome da propriedade é obrigatório",
            change_type_required: "Tipo de alteração é obrigatório",
            property_value_required: "Valor da propriedade é obrigatório",
          },
        },
      },
      comment_block: {
        title: "Adicionar comentário",
      },
      change_property_block: {
        title: "Alterar propriedade",
      },
      validation: {
        delete_only_action: "Desabilite a automação antes de excluir sua única ação.",
      },
    },
    conjunctions: {
      and: "E",
      or: "Ou",
      if: "Se",
      then: "Então",
    },
    enable: {
      alert:
        "Clique em 'Habilitar' quando sua automação estiver completa. Uma vez habilitada, a automação estará pronta para executar.",
      validation: {
        required: "A automação deve ter um gatilho e pelo menos uma ação para ser habilitada.",
      },
    },
    delete: {
      validation: {
        enabled: "A automação deve ser desabilitada antes de excluí-la.",
      },
    },
    table: {
      title: "Título da automação",
      last_run_on: "Última execução em",
      created_on: "Criado em",
      last_updated_on: "Última atualização em",
      last_run_status: "Status da última execução",
      average_duration: "Duração média",
      owner: "Proprietário",
      executions: "Execuções",
    },
    create_modal: {
      heading: {
        create: "Criar automação",
        update: "Atualizar automação",
      },
      title: {
        placeholder: "Nomeie sua automação.",
        required_error: "Título é obrigatório",
      },
      description: {
        placeholder: "Descreva sua automação.",
      },
      submit_button: {
        create: "Criar automação",
        update: "Atualizar automação",
      },
    },
    delete_modal: {
      heading: "Excluir automação",
    },
    activity: {
      filters: {
        show_fails: "Mostrar falhas",
        all: "Todos",
        only_activity: "Apenas atividade",
        only_run_history: "Apenas histórico de execução",
      },
      run_history: {
        initiator: "Iniciador",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Sucesso!",
          message: "Automação criada com sucesso.",
        },
        error: {
          title: "Erro!",
          message: "Falha na criação da automação.",
        },
      },
      update: {
        success: {
          title: "Sucesso!",
          message: "Automação atualizada com sucesso.",
        },
        error: {
          title: "Erro!",
          message: "Falha na atualização da automação.",
        },
      },
      enable: {
        success: {
          title: "Sucesso!",
          message: "Automação habilitada com sucesso.",
        },
        error: {
          title: "Erro!",
          message: "Falha ao habilitar a automação.",
        },
      },
      disable: {
        success: {
          title: "Sucesso!",
          message: "Automação desabilitada com sucesso.",
        },
        error: {
          title: "Erro!",
          message: "Falha ao desabilitar a automação.",
        },
      },
      delete: {
        success: {
          title: "Automação excluída",
          message: "{name}, a automação, foi excluída do seu projeto.",
        },
        error: {
          title: "Não foi possível excluir essa automação desta vez.",
          message: "Tente excluir novamente ou volte mais tarde. Se não conseguir excluir, entre em contato conosco.",
        },
      },
      action: {
        create: {
          error: {
            title: "Erro!",
            message: "Falha ao criar ação. Tente novamente!",
          },
        },
        update: {
          error: {
            title: "Erro!",
            message: "Falha ao atualizar ação. Tente novamente!",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "Ainda não há automações para mostrar.",
        description:
          "As automações ajudam você a eliminar tarefas repetitivas definindo gatilhos, condições e ações. Crie uma para economizar tempo e manter o trabalho fluindo sem esforço.",
      },
      upgrade: {
        title: "Automações",
        description: "Automações são uma forma de automatizar tarefas no seu projeto.",
        sub_description: "Recupere 80% do seu tempo administrativo quando usar Automações.",
      },
    },
  },
  sso: {
    header: "Identidade",
    description: "Configure seu domínio para acessar recursos de segurança, incluindo single sign-on.",
    domain_management: {
      header: "Gerenciamento de domínios",
      verified_domains: {
        header: "Domínios verificados",
        description: "Verifique a propriedade de um domínio de e-mail para habilitar o single sign-on.",
        button_text: "Adicionar domínio",
        list: {
          domain_name: "Nome do domínio",
          status: "Status",
          status_verified: "Verificado",
          status_failed: "Falhou",
          status_pending: "Pendente",
        },
        add_domain: {
          title: "Adicionar domínio",
          description: "Adicione seu domínio para configurar SSO e verificá-lo.",
          form: {
            domain_label: "Domínio",
            domain_placeholder: "plane.so",
            domain_required: "O domínio é obrigatório",
            domain_invalid: "Digite um nome de domínio válido (ex: plane.so)",
          },
          primary_button_text: "Adicionar domínio",
          primary_button_loading_text: "Adicionando",
          toast: {
            success_title: "Sucesso!",
            success_message: "Domínio adicionado com sucesso. Por favor, verifique-o adicionando o registro DNS TXT.",
            error_message: "Falha ao adicionar domínio. Por favor, tente novamente.",
          },
        },
        verify_domain: {
          title: "Verifique seu domínio",
          description: "Siga estas etapas para verificar seu domínio.",
          instructions: {
            label: "Instruções",
            step_1: "Vá para as configurações DNS do seu host de domínio.",
            step_2: {
              part_1: "Crie um",
              part_2: "registro TXT",
              part_3: "e cole o valor completo do registro fornecido abaixo.",
            },
            step_3: "Esta atualização geralmente leva alguns minutos, mas pode levar até 72 horas para ser concluída.",
            step_4: 'Clique em "Verificar domínio" para confirmar assim que seu registro DNS for atualizado.',
          },
          verification_code_label: "Valor do registro TXT",
          verification_code_description: "Adicione este registro às suas configurações DNS",
          domain_label: "Domínio",
          primary_button_text: "Verificar domínio",
          primary_button_loading_text: "Verificando",
          secondary_button_text: "Vou fazer isso mais tarde",
          toast: {
            success_title: "Sucesso!",
            success_message: "Domínio verificado com sucesso.",
            error_message: "Falha ao verificar domínio. Por favor, tente novamente.",
          },
        },
        delete_domain: {
          title: "Excluir domínio",
          description: {
            prefix: "Tem certeza de que deseja excluir",
            suffix: "? Esta ação não pode ser desfeita.",
          },
          primary_button_text: "Excluir",
          primary_button_loading_text: "Excluindo",
          secondary_button_text: "Cancelar",
          toast: {
            success_title: "Sucesso!",
            success_message: "Domínio excluído com sucesso.",
            error_message: "Falha ao excluir domínio. Por favor, tente novamente.",
          },
        },
      },
    },
    providers: {
      header: "Single sign-on",
      disabled_message: "Adicione um domínio verificado para configurar SSO",
      configure: {
        create: "Configurar",
        update: "Editar",
      },
      switch_alert_modal: {
        title: "Alternar método SSO para {newProviderShortName}?",
        content:
          "Você está prestes a habilitar {newProviderLongName} ({newProviderShortName}). Esta ação desabilitará automaticamente {activeProviderLongName} ({activeProviderShortName}). Usuários que tentarem fazer login via {activeProviderShortName} não poderão mais acessar a plataforma até que alternem para o novo método. Tem certeza de que deseja continuar?",
        primary_button_text: "Alternar",
        primary_button_text_loading: "Alternando",
        secondary_button_text: "Cancelar",
      },
      form_section: {
        title: "Detalhes fornecidos pelo IdP para {workspaceName}",
      },
      form_action_buttons: {
        saving: "Salvando",
        save_changes: "Salvar alterações",
        configure_only: "Apenas configurar",
        configure_and_enable: "Configurar e habilitar",
        default: "Salvar",
      },
      setup_details_section: {
        title: "{workspaceName} detalhes fornecidos para seu IdP",
        button_text: "Obter detalhes de configuração",
      },
      saml: {
        header: "Habilitar SAML",
        description: "Configure seu provedor de identidade SAML para habilitar single sign-on.",
        configure: {
          title: "Habilitar SAML",
          description:
            "Verifique a propriedade de um domínio de e-mail para acessar recursos de segurança, incluindo single sign-on.",
          toast: {
            success_title: "Sucesso!",
            create_success_message: "Provedor SAML criado com sucesso.",
            update_success_message: "Provedor SAML atualizado com sucesso.",
            error_title: "Erro!",
            error_message: "Falha ao salvar provedor SAML. Por favor, tente novamente.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Detalhes da web",
            entity_id: {
              label: "ID da entidade | Público | Informações de metadados",
              description:
                "Geraremos esta parte dos metadados que identifica este aplicativo Plane como um serviço autorizado em seu IdP.",
            },
            callback_url: {
              label: "URL de login único",
              description:
                "Geraremos isso para você. Adicione isso no campo URL de redirecionamento de login do seu IdP.",
            },
            logout_url: {
              label: "URL de logout único",
              description:
                "Geraremos isso para você. Adicione isso no campo URL de redirecionamento de logout único do seu IdP.",
            },
          },
          mobile_details: {
            header: "Detalhes móveis",
            entity_id: {
              label: "ID da entidade | Público | Informações de metadados",
              description:
                "Geraremos esta parte dos metadados que identifica este aplicativo Plane como um serviço autorizado em seu IdP.",
            },
            callback_url: {
              label: "URL de login único",
              description:
                "Geraremos isso para você. Adicione isso no campo URL de redirecionamento de login do seu IdP.",
            },
            logout_url: {
              label: "URL de logout único",
              description:
                "Geraremos isso para você. Adicione isso no campo URL de redirecionamento de logout do seu IdP.",
            },
          },
          mapping_table: {
            header: "Detalhes de mapeamento",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "Habilitar OIDC",
        description: "Configure seu provedor de identidade OIDC para habilitar single sign-on.",
        configure: {
          title: "Habilitar OIDC",
          description:
            "Verifique a propriedade de um domínio de e-mail para acessar recursos de segurança, incluindo single sign-on.",
          toast: {
            success_title: "Sucesso!",
            create_success_message: "Provedor OIDC criado com sucesso.",
            update_success_message: "Provedor OIDC atualizado com sucesso.",
            error_title: "Erro!",
            error_message: "Falha ao salvar provedor OIDC. Por favor, tente novamente.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Detalhes da web",
            origin_url: {
              label: "URL de origem",
              description:
                "Geraremos isso para este aplicativo Plane. Adicione isso como uma origem confiável no campo correspondente do seu IdP.",
            },
            callback_url: {
              label: "URL de redirecionamento",
              description:
                "Geraremos isso para você. Adicione isso no campo URL de redirecionamento de login do seu IdP.",
            },
            logout_url: {
              label: "URL de logout",
              description:
                "Geraremos isso para você. Adicione isso no campo URL de redirecionamento de logout do seu IdP.",
            },
          },
          mobile_details: {
            header: "Detalhes móveis",
            origin_url: {
              label: "URL de origem",
              description:
                "Geraremos isso para este aplicativo Plane. Adicione isso como uma origem confiável no campo correspondente do seu IdP.",
            },
            callback_url: {
              label: "URL de redirecionamento",
              description:
                "Geraremos isso para você. Adicione isso no campo URL de redirecionamento de login do seu IdP.",
            },
            logout_url: {
              label: "URL de logout",
              description:
                "Geraremos isso para você. Adicione isso no campo URL de redirecionamento de logout do seu IdP.",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "O nome do projeto não pode conter caracteres especiais.",
  pql: {
    functions: {
      date: {
        now: {
          description: "Data e hora atuais",
        },
        today: {
          description: "A data de hoje",
        },
        start_of_day: {
          description: "Início de hoje",
        },
        end_of_day: {
          description: "Fim de hoje",
        },
        start_of_week: {
          description: "Início da semana atual",
        },
        end_of_week: {
          description: "Fim da semana atual",
        },
        start_of_month: {
          description: "Início do mês atual",
        },
        end_of_month: {
          description: "Fim do mês atual",
        },
        start_of_year: {
          description: "Início do ano atual",
        },
        end_of_year: {
          description: "Fim do ano atual",
        },
        days_ago: {
          description: "Data de n dias atrás",
        },
        days_from_now: {
          description: "Data daqui a n dias",
        },
        weeks_ago: {
          description: "Data de n semanas atrás",
        },
        weeks_from_now: {
          description: "Data daqui a n semanas",
        },
        months_ago: {
          description: "Data de n meses atrás",
        },
        months_from_now: {
          description: "Data daqui a n meses",
        },
      },
      user: {
        current_user: {
          description: "Usuário atualmente conectado",
        },
        members_of: {
          description: 'Membros de "project:<id>" ou "teamspace:<id>"',
        },
        workspace_members: {
          description: "Todos os membros do espaço de trabalho",
        },
      },
      cycle: {
        active_cycle: {
          description: "Ciclo ativo hoje",
        },
        completed_cycles: {
          description: "Ciclos cuja data de término já passou",
        },
        upcoming_cycles: {
          description: "Ciclos cuja data de início é no futuro",
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
          description: "Data de vencimento passou E o estado está aberto",
        },
        has_no_assignee: {
          description: "Item de trabalho não tem responsável",
        },
        has_no_label: {
          description: "Item de trabalho não tem rótulos",
        },
        is_top_level: {
          description: "Não é um sub-item de trabalho (não tem pai)",
        },
        is_sub_work_item: {
          description: "É um sub-item de trabalho (tem pai)",
        },
        is_epic: {
          description: "Épico",
        },
        is_intake: {
          description: "É um item de intake",
        },
        is_draft: {
          description: "É um item de rascunho",
        },
        is_archived: {
          description: "Está arquivado",
        },
        has_children: {
          description: "Tem pelo menos um sub-item de trabalho",
        },
        has_start_and_due_dates: {
          description: "Tem datas de início e vencimento",
        },
      },
      relation: {
        linked_to: {
          description: "Itens de trabalho relacionados ao item dado",
        },
        blocked_by: {
          description: "Itens de trabalho bloqueados pelo item dado",
        },
        blocks: {
          description: "Itens de trabalho que bloqueiam o item dado",
        },
        child_of: {
          description: "Sub-itens do item de trabalho dado",
        },
        parent_of: {
          description: "Item pai do item de trabalho dado",
        },
        duplicate_of: {
          description: "Itens de trabalho marcados como duplicatas do item dado",
        },
      },
      history: {
        was_ever: {
          description: "O campo já foi definido como este valor",
        },
        was: {
          description: "O campo era anteriormente este valor (mudou)",
        },
        changed_from: {
          description: "O campo foi alterado deste valor",
        },
        changed_to: {
          description: "O campo foi alterado para este valor",
        },
        changed: {
          description: "O campo foi alterado",
        },
        updated_by: {
          description: "Item de trabalho atualizado por este usuário",
        },
        commented_by: {
          description: "Item de trabalho comentado por este usuário",
        },
        field_changed_by: {
          description: "Campo alterado por este usuário",
        },
        was_assigned_to: {
          description: "Item de trabalho foi atribuído a este usuário",
        },
        changed_after: {
          description: "Campo alterado após esta data",
        },
        changed_before: {
          description: "Campo alterado antes desta data",
        },
        field_changed_after: {
          description: "Campo alterado após esta data",
        },
        field_changed_before: {
          description: "Campo alterado antes desta data",
        },
        changed_to_after: {
          description: "Campo alterado para este valor após esta data",
        },
        changed_to_before: {
          description: "Campo alterado para este valor antes desta data",
        },
        field_changed_between: {
          description: "Campo alterado entre estas datas",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "navegar",
      accept: "aceitar",
      close: "fechar",
      pick_date: "Escolher uma data",
    },
    placeholder: 'Digite uma consulta e pressione "ENTER" para filtrar...',
    error: "Erro ao enviar a consulta. Por favor, verifique e tente novamente.",
  },
  releases: {
    label: "{count, plural, one {Lançamento} other {Lançamentos}}",
    no_release: "Nenhum lançamento",
    unreleased: "Não lançado",
    select_releases: "Selecionar lançamentos",
    overview: "Visão geral",
    scope: "Escopo",
    page_title: {
      scope: "Lançamento - {name} | Escopo",
      scope_fallback: "Lançamento | Escopo",
    },
    properties: "Propriedades",
    target_date: "Data alvo",
    lead: "Responsável",
    release_tag: "Tag",
    labels: "Etiquetas",
    description_placeholder: "Adicionar uma descrição...",
    progress: "Progresso",
    completed_work_items: "Itens de trabalho concluídos",
    pending_work_items: "Itens de trabalho pendentes",
    cancelled_work_items: "Itens de trabalho cancelados",
    scope_page: {
      work_items: "Itens de trabalho",
      add_work_items: "Adicionar itens de trabalho",
      remove_from_release: "Remover do lançamento",
      empty_state: {
        title: "Nenhum item de trabalho",
        description: "Adicione itens de trabalho para definir o escopo do lançamento.",
      },
      confirm_remove: {
        content: "Tem certeza de que deseja remover este item de trabalho do lançamento? Ele permanecerá no projeto.",
        primary_button: {
          default: "Remover",
          loading: "Removendo",
        },
      },
    },
    empty_state: {
      title: "Ainda sem escopo",
      description: "Adicione itens de trabalho ao lançamento para acompanhar a conclusão deles neste lançamento.",
      add_scope: "Adicionar escopo",
      not_found: {
        title: "Lançamento não encontrado",
        description: "O lançamento pode ter sido excluído.",
        primary_button: "Voltar aos lançamentos",
      },
    },
    toast: {
      work_items_added: "{count, plural, one {Item de trabalho adicionado} other {Itens de trabalho adicionados}}",
      work_items_error: "Falha ao adicionar itens de trabalho",
    },
    count_releases: "{count, plural, one {# lançamento} other {# lançamentos}}",
    actions: {
      delete: "Excluir",
    },
    delete_modal: {
      title: "Excluir lançamento",
      content: 'Tem certeza de que deseja excluir o lançamento "{releaseName}"? Esta ação não pode ser desfeita.',
    },
    settings: {
      heading: {
        title: "Lançamentos",
        description: "Gerencie as entregas do projeto com precisão usando lançamentos.",
      },
      toggle: {
        title: "Ativar lançamentos",
        description: "Os membros do workspace terão acesso de visualização ao escopo em seus respectivos projetos.",
      },
      toasts: {
        enable: {
          loading: "Ativando lançamentos...",
          success: {
            title: "Lançamentos ativados",
            message: "Os lançamentos foram ativados para este workspace.",
          },
          error: {
            title: "Erro",
            message: "Não foi possível ativar os lançamentos. Tente novamente.",
          },
        },
        disable: {
          loading: "Desativando lançamentos...",
          success: {
            title: "Lançamentos desativados",
            message: "Os lançamentos foram desativados para este workspace.",
          },
          error: {
            title: "Erro",
            message: "Não foi possível desativar os lançamentos. Tente novamente.",
          },
        },
      },
      tabs: {
        tags: "Tags de lançamento",
        labels: "Etiquetas",
      },
      tags: {
        title: "Tags de lançamento",
        description: "Categorize e filtre seus lançamentos usando tags.",
        add: "Adicionar tag",
        empty_state: "Ainda não há tags. Crie sua primeira tag.",
        errors: {
          version_required: "A versão é obrigatória.",
          version_already_exists: "Já existe uma tag com esta versão.",
          generic: "Algo deu errado. Tente novamente.",
        },
        delete_modal: {
          title: "Excluir tag",
          content: 'Tem certeza de que deseja excluir a tag "{tagVersion}"? Esta ação não pode ser desfeita.',
        },
        actions: {
          edit: "Editar tag",
          delete: "Excluir tag",
        },
        toasts: {
          delete: {
            success: "Tag excluída com sucesso.",
            error: "Não foi possível excluir a tag. Tente novamente.",
          },
        },
      },
      labels: {
        title: "Etiquetas",
        description: "Estruture e organize suas iniciativas com etiquetas.",
        add: "Adicionar etiqueta",
        empty_state: "Ainda não há etiquetas. Crie sua primeira etiqueta.",
        errors: {
          name_required: "O nome é obrigatório.",
          name_already_exists: "Já existe uma etiqueta com esse nome.",
          generic: "Algo deu errado. Tente novamente.",
        },
        modal: {
          name_placeholder: "Nome da etiqueta",
          pick_color: "Escolher cor da etiqueta",
        },
        actions: {
          edit: "Editar etiqueta",
          delete: "Excluir etiqueta",
        },
        drag_to_reorder: "Arraste para reordenar",
        delete_modal: {
          title: "Excluir etiqueta",
          content: 'Tem certeza de que deseja excluir a etiqueta "{labelName}"? Esta ação não pode ser desfeita.',
        },
        toasts: {
          delete: {
            success: "Etiqueta excluída com sucesso.",
            error: "Não foi possível excluir a etiqueta. Tente novamente.",
          },
        },
      },
    },
  },
  work_item_type_hierarchy: {
    settings: {
      title: "Hierarquia",
      tab_label: "Hierarquia",
      description:
        "Configure os níveis de hierarquia para organizar seu trabalho. Cada nível define uma relação de pai com o item diretamente acima e uma relação de filho com o item diretamente abaixo. ",
      sidebar_label: "Hierarquia",
      enable_control: {
        title: "Ativar hierarquia",
        description: "Crie relações pai-filho entre diferentes tipos de itens de trabalho.",
        tooltip: "Você não pode desativar a hierarquia depois que ela for ativada.",
      },
      workspace_work_item_types_disabled_banner: {
        content: "Defina primeiro os tipos de itens de trabalho para criar uma nova hierarquia.",
        cta: "Configurações de tipos de itens de trabalho",
      },
    },
    levels: {
      add_level_button: "Adicionar nível de hierarquia",
      empty_level_placeholder: "Adicionar um tipo de item de trabalho ao nível {level}",
      empty_level_unauthorized: "Nenhum tipo de item de trabalho encontrado neste nível.",
      zero_level_description:
        "Por padrão, todos os tipos de itens de trabalho estão no nível 0 até que sejam atribuídos a uma hierarquia.",
    },
    add_level_modal: {
      title: "Adicionar nível de hierarquia",
      description: "Adicionar um novo nível de hierarquia ao tipo de item de trabalho.",
      work_item_type: "Tipo de item de trabalho",
      empty_state: {
        title: "Todos os tipos de itens de trabalho em uso",
        description: "Cada tipo de item de trabalho definido neste espaço de trabalho já faz parte da sua hierarquia.",
      },
      invalid_level_toast: {
        title: "Erro!",
        message: "{type_name} não pode ser adicionado ao nível {level} pois viola as regras de hierarquia.",
      },
      not_found_toast: {
        title: "Erro",
        message: "Tipo de item de trabalho não encontrado.",
      },
      error_toast: {
        title: "Erro",
        message: "Falha ao adicionar o tipo de item de trabalho à hierarquia.",
      },
    },
    remove_from_level_toast: {
      loading: "Removendo tipo de item de trabalho do nível",
      success: {
        title: "Sucesso!",
        message: "Tipo de item de trabalho removido do nível com sucesso.",
      },
      error: {
        title: "Erro!",
        message: "Falha ao remover o tipo de item de trabalho do nível.",
      },
    },
    work_item_modal: {
      invalid_work_item_type_create_toast: {
        title: "Erro!",
        message:
          "O tipo de item de trabalho selecionado não pode ser usado para criar um novo item de trabalho pois viola as regras de hierarquia.",
      },
      invalid_work_item_type_update_toast: {
        title: "Erro!",
        message: "O tipo de item de trabalho não pode ser atualizado pois viola as regras de hierarquia.",
      },
    },
  },
} as const;
