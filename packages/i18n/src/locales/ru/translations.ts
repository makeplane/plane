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
    we_are_working_on_this_if_you_need_immediate_assistance: "Мы работаем над этим. Если вам нужна немедленная помощь,",
    reach_out_to_us: "свяжитесь с нами",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our:
      "В противном случае попробуйте периодически обновлять страницу или посетите нашу",
    status_page: "страницу статуса",
  },
  sidebar: {
    projects: "Проекты",
    pages: "Страницы",
    new_work_item: "Новый рабочий элемент",
    home: "Главная",
    your_work: "Ваша работа",
    inbox: "Входящие",
    workspace: "Рабочие пространства",
    views: "Представления",
    analytics: "Аналитика",
    work_items: "Рабочие элементы",
    cycles: "Циклы",
    modules: "Модули",
    intake: "Предложения",
    drafts: "Черновики",
    favorites: "Избранное",
    pro: "Pro",
    upgrade: "Обновить",
    pi_chat: "AI Чат",
    initiatives: "Инициативы",
    teamspaces: "Тимспейсы",
    epics: "Эпики",
    upgrade_plan: "Апгрейд план",
    plane_pro: "Плейн Про",
    business: "Бизнес",
    recurring_work_items: "Повторяющиеся рабочие элементы",
  },
  auth: {
    common: {
      email: {
        label: "Email",
        placeholder: "name@company.com",
        errors: {
          required: "Email обязателен",
          invalid: "Email недействителен",
        },
      },
      password: {
        label: "Пароль",
        set_password: "Установить пароль",
        placeholder: "Введите пароль",
        confirm_password: {
          label: "Подтвердите пароль",
          placeholder: "Подтвердите пароль",
        },
        current_password: {
          label: "Текущий пароль",
        },
        new_password: {
          label: "Новый пароль",
          placeholder: "Введите новый пароль",
        },
        change_password: {
          label: {
            default: "Сменить пароль",
            submitting: "Смена пароля",
          },
        },
        errors: {
          match: "Пароли не совпадают",
          empty: "Пожалуйста, введите ваш пароль",
          length: "Длина пароля должна быть более 8 символов",
          strength: {
            weak: "Слабый пароль",
            strong: "Сильный пароль",
          },
        },
        submit: "Установить пароль",
        toast: {
          change_password: {
            success: {
              title: "Успех!",
              message: "Пароль успешно изменён.",
            },
            error: {
              title: "Ошибка!",
              message: "Что-то пошло не так. Пожалуйста, попробуйте снова.",
            },
          },
        },
      },
      unique_code: {
        label: "Уникальный код",
        placeholder: "123456",
        paste_code: "Вставьте код, отправленный на ваш email",
        requesting_new_code: "Запрос нового кода",
        sending_code: "Отправка кода",
      },
      already_have_an_account: "Уже есть аккаунт?",
      login: "Войти",
      create_account: "Создать аккаунт",
      new_to_plane: "Впервые в Plane?",
      back_to_sign_in: "Вернуться к входу",
      resend_in: "Отправить снова через {seconds} секунд",
      sign_in_with_unique_code: "Войти с уникальным кодом",
      forgot_password: "Забыли пароль?",
      username: {
        label: "Имя пользователя",
        placeholder: "Введите ваше имя пользователя",
      },
    },
    sign_up: {
      header: {
        label: "Создайте аккаунт, чтобы начать управлять работой с вашей командой.",
        step: {
          email: {
            header: "Регистрация",
            sub_header: "",
          },
          password: {
            header: "Регистрация",
            sub_header: "Зарегистрируйтесь, используя комбинацию email-пароль.",
          },
          unique_code: {
            header: "Регистрация",
            sub_header: "Зарегистрируйтесь, используя уникальный код, отправленный на указанный выше email.",
          },
        },
      },
      errors: {
        password: {
          strength: "Попробуйте установить сильный пароль для продолжения",
        },
      },
    },
    sign_in: {
      header: {
        label: "Войдите, чтобы начать управлять работой с вашей командой.",
        step: {
          email: {
            header: "Войти или зарегистрироваться",
            sub_header: "",
          },
          password: {
            header: "Войти или зарегистрироваться",
            sub_header: "Используйте комбинацию email-пароль для входа.",
          },
          unique_code: {
            header: "Войти или зарегистрироваться",
            sub_header: "Войдите, используя уникальный код, отправленный на указанный выше email.",
          },
        },
      },
    },
    forgot_password: {
      title: "Сбросьте ваш пароль",
      description: "Введите проверенный email вашего аккаунта, и мы отправим вам ссылку для сброса пароля.",
      email_sent: "Мы отправили ссылку для сброса на ваш email",
      send_reset_link: "Отправить ссылку для сброса",
      errors: {
        smtp_not_enabled:
          "Мы видим, что ваш администратор не включил SMTP, мы не сможем отправить ссылку для сброса пароля",
      },
      toast: {
        success: {
          title: "Email отправлен",
          message:
            "Проверьте ваши входящие для ссылки на сброс пароля. Если она не появится в течение нескольких минут, проверьте папку спама.",
        },
        error: {
          title: "Ошибка!",
          message: "Что-то пошло не так. Пожалуйста, попробуйте снова.",
        },
      },
    },
    reset_password: {
      title: "Установите новый пароль",
      description: "Обеспечьте безопасность вашего аккаунта с помощью сильного пароля",
    },
    set_password: {
      title: "Обеспечьте безопасность вашего аккаунта",
      description: "Установка пароля помогает вам безопасно входить в систему",
    },
    sign_out: {
      toast: {
        error: {
          title: "Ошибка!",
          message: "Не удалось выйти. Пожалуйста, попробуйте снова.",
        },
      },
    },
    ldap: {
      header: {
        label: "Продолжить с {ldapProviderName}",
        sub_header: "Введите ваши учетные данные {ldapProviderName}",
      },
    },
  },
  submit: "Отправить",
  cancel: "Отменить",
  loading: "Загрузка",
  error: "Ошибка",
  success: "Успешно",
  warning: "Предупреждение",
  info: "Информация",
  close: "Закрыть",
  yes: "Да",
  no: "Нет",
  ok: "OK",
  name: "Имя",
  description: "Описание",
  search: "Поиск",
  add_member: "Добавить участника",
  adding_members: "Добавление участников",
  remove_member: "Удалить участника",
  add_members: "Добавить участников",
  adding_member: "Добавление участников",
  remove_members: "Удалить участников",
  add: "Добавить",
  adding: "Добавление",
  remove: "Удалить",
  add_new: "Добавить новый",
  remove_selected: "Удалить выбранное",
  first_name: "Имя",
  last_name: "Фамилия",
  email: "Email",
  display_name: "Отображаемое имя",
  role: "Роль",
  timezone: "Часовой пояс",
  avatar: "Аватар",
  cover_image: "Обложка",
  password: "Пароль",
  change_cover: "Изменить обложку",
  language: "Язык",
  saving: "Сохранение",
  save_changes: "Сохранить изменения",
  deactivate_account: "Деактивировать аккаунт",
  deactivate_account_description:
    "При деактивации аккаунта все данные и ресурсы будут безвозвратно удалены и не могут быть восстановлены.",
  profile_settings: "Настройки профиля",
  your_account: "Ваш аккаунт",
  security: "Безопасность",
  activity: "Активность",
  activity_empty_state: {
    no_activity: "Пока нет активности",
    no_transitions: "Пока нет переходов",
    no_comments: "Комментариев пока нет",
    no_worklogs: "Записей о работе пока нет",
    no_history: "Истории пока нет",
  },
  appearance: "Внешний вид",
  notifications: "Уведомления",
  workspaces: "Рабочие пространства",
  create_workspace: "Создать рабочее пространство",
  invitations: "Приглашения",
  summary: "Сводка",
  assigned: "Назначено",
  created: "Создано",
  subscribed: "Подписались",
  you_do_not_have_the_permission_to_access_this_page: "У вас нет прав для доступа к этой странице.",
  something_went_wrong_please_try_again: "Что-то пошло не так. Пожалуйста, попробуйте еще раз.",
  load_more: "Загрузить еще",
  select_or_customize_your_interface_color_scheme: "Выберите или настройте цветовую схему интерфейса.",
  select_the_cursor_motion_style_that_feels_right_for_you:
    "Выберите стиль движения курсора, который подходит именно вам.",
  theme: "Тема",
  smooth_cursor: "Плавный курсор",
  system_preference: "Системные настройки",
  light: "Светлая",
  dark: "Темная",
  light_contrast: "Светлая высококонтрастная",
  dark_contrast: "Темная высококонтрастностная",
  custom: "Пользовательская тема",
  select_your_theme: "Выберите тему",
  customize_your_theme: "Настройте свою тему",
  background_color: "Цвет фона",
  text_color: "Цвет текста",
  primary_color: "Основной цвет (темы)",
  sidebar_background_color: "Цвет фона боковой панели",
  sidebar_text_color: "Цвет текста боковой панели",
  set_theme: "Установить тему",
  enter_a_valid_hex_code_of_6_characters: "Введите корректный HEX-код из 6 символов",
  background_color_is_required: "Требуется цвет фона",
  text_color_is_required: "Требуется цвет текста",
  primary_color_is_required: "Требуется основной цвет",
  sidebar_background_color_is_required: "Требуется цвет фона боковой панели",
  sidebar_text_color_is_required: "Требуется цвет текста боковой панели",
  updating_theme: "Обновление темы",
  theme_updated_successfully: "Тема успешно обновлена",
  failed_to_update_the_theme: "Не удалось обновить тему",
  email_notifications: "Email-уведомления",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "Будьте в курсе рабочих элементов, на которые вы подписаны. Включите уведомления.",
  email_notification_setting_updated_successfully: "Настройки email-уведомлений успешно обновлены",
  failed_to_update_email_notification_setting: "Не удалось обновить настройки email-уведомлений",
  notify_me_when: "Уведомлять меня, когда",
  property_changes: "Изменения свойств",
  property_changes_description:
    "Уведомлять при изменении свойств рабочих элементов: назначенные, приоритет, оценки и прочее",
  state_change: "Изменение статуса",
  state_change_description: "Уведомлять при изменении статуса рабочего элемента",
  issue_completed: "Рабочий элемент выполнен",
  issue_completed_description: "Уведомлять только при выполнении рабочего элемента",
  comments: "Комментарии",
  comments_description: "Уведомлять при добавлении комментариев к рабочему элементу",
  mentions: "Упоминания",
  mentions_description: "Уведомлять только при упоминании меня в комментариях или описании",
  old_password: "Старый пароль",
  general_settings: "Общие настройки",
  sign_out: "Выйти",
  signing_out: "Выход...",
  active_cycles: "Активные циклы",
  active_cycles_description:
    "Мониторинг циклов по проектам, отслеживание приоритетных рабочих элементов и фокусировка на проблемных циклах.",
  on_demand_snapshots_of_all_your_cycles: "Моментальные снимки всех ваших циклов",
  upgrade: "Обновить",
  "10000_feet_view": "Обзор всех активных циклов с высоты",
  "10000_feet_view_description":
    "Общий обзор выполняющихся циклов во всех проектах вместо переключения между циклами в каждом проекте.",
  get_snapshot_of_each_active_cycle: "Получить снимок каждого активного цикла",
  get_snapshot_of_each_active_cycle_description:
    "Отслеживайте ключевые метрики активных циклов, их прогресс и соответствие срокам.",
  compare_burndowns: "Сравнение графиков выгорания",
  compare_burndowns_description: "Мониторинг производительности команд через анализ графиков выполнения циклов.",
  quickly_see_make_or_break_issues: "Быстрый просмотр критических рабочих элементов",
  quickly_see_make_or_break_issues_description:
    "Просмотр высокоприоритетных рабочих элементов с указанием сроков для каждого цикла в один клик.",
  zoom_into_cycles_that_need_attention: "Фокусировка на проблемных циклах",
  zoom_into_cycles_that_need_attention_description:
    "Исследование состояния циклов, не соответствующих ожиданиям, в один клик.",
  stay_ahead_of_blockers: "Предупреждение блокирующих рабочих элементов",
  stay_ahead_of_blockers_description: "Выявление проблем между проектами и скрытых зависимостей между циклами.",
  analytics: "Аналитика",
  workspace_invites: "Приглашения в рабочее пространство",
  enter_god_mode: "Режим администратора",
  workspace_logo: "Логотип рабочего пространства",
  new_issue: "Новый рабочий элемент",
  your_work: "Ваша работа",
  drafts: "Черновики",
  projects: "Проекты",
  views: "Представления",
  archives: "Архивы",
  settings: "Настройки",
  failed_to_move_favorite: "Ошибка перемещения избранного",
  favorites: "Избранное",
  no_favorites_yet: "Нет избранного",
  create_folder: "Создать папку",
  new_folder: "Новая папка",
  favorite_updated_successfully: "Избранное успешно обновлено",
  favorite_created_successfully: "Избранное успешно создано",
  folder_already_exists: "Папка уже существует",
  folder_name_cannot_be_empty: "Имя папки не может быть пустым",
  something_went_wrong: "Что-то пошло не так",
  failed_to_reorder_favorite: "Ошибка изменения порядка избранного",
  favorite_removed_successfully: "Избранное успешно удалено",
  failed_to_create_favorite: "Ошибка создания избранного",
  failed_to_rename_favorite: "Ошибка переименования избранного",
  project_link_copied_to_clipboard: "Ссылка на проект скопирована в буфер обмена",
  link_copied: "Ссылка скопирована",
  add_project: "Добавить проект",
  create_project: "Создать проект",
  failed_to_remove_project_from_favorites: "Не удалось удалить проект из избранного. Попробуйте снова.",
  project_created_successfully: "Проект успешно создан",
  project_created_successfully_description: "Проект успешно создан. Теперь вы можете добавлять рабочие элементы.",
  project_name_already_taken: "Имя проекта уже используется.",
  project_identifier_already_taken: "Идентификатор проекта уже используется.",
  project_cover_image_alt: "Обложка проекта",
  name_is_required: "Требуется имя",
  title_should_be_less_than_255_characters: "Заголовок должен быть короче 255 символов",
  project_name: "Название проекта",
  project_id_must_be_at_least_1_character: "ID проекта должен содержать минимум 1 символ",
  project_id_must_be_at_most_5_characters: "ID проекта должен содержать максимум 5 символов",
  project_id: "ID проекта",
  project_id_tooltip_content: "Помогает идентифицировать рабочие элементы в проекте. Макс. 50 символов.",
  description_placeholder: "Описание",
  only_alphanumeric_non_latin_characters_allowed: "Допускаются только буквенно-цифровые и нелатинские символы.",
  project_id_is_required: "Требуется ID проекта",
  project_id_allowed_char: "Допускаются только буквенно-цифровые и нелатинские символы.",
  project_id_min_char: "ID проекта должен содержать минимум 1 символ",
  project_id_max_char: "ID проекта должен содержать максимум {max} символов",
  project_description_placeholder: "Введите описание проекта",
  select_network: "Выбрать сеть",
  lead: "Руководитель",
  date_range: "Диапазон дат",
  private: "Приватный",
  public: "Публичный",
  accessible_only_by_invite: "Доступ только по приглашению",
  anyone_in_the_workspace_except_guests_can_join:
    "Все участники рабочего пространства (кроме гостей) могут присоединиться",
  creating: "Создание",
  creating_project: "Создание проекта",
  adding_project_to_favorites: "Добавление проекта в избранное",
  project_added_to_favorites: "Проект добавлен в избранное",
  couldnt_add_the_project_to_favorites: "Не удалось добавить проект в избранное. Попробуйте снова.",
  removing_project_from_favorites: "Удаление проекта из избранного",
  project_removed_from_favorites: "Проект удален из избранного",
  couldnt_remove_the_project_from_favorites: "Не удалось удалить проект из избранного. Попробуйте снова.",
  add_to_favorites: "Добавить в избранное",
  remove_from_favorites: "Удалить из избранного",
  publish_project: "Опубликовать проект",
  publish: "Опубликовать",
  copy_link: "Копировать ссылку",
  leave_project: "Покинуть проект",
  join_the_project_to_rearrange: "Присоединитесь к проекту для изменения порядка",
  drag_to_rearrange: "Перетащите для изменения порядка",
  congrats: "Поздравляем!",
  open_project: "Открыть проект",
  issues: "Рабочие элементы",
  cycles: "Циклы",
  modules: "Модули",
  pages: {
    link_pages: "Связать страницы",
    show_wiki_pages: "Показать страницы Wiki",
    link_pages_to: "Связать страницы с",
    linked_pages: "Связанные страницы",
    no_description:
      "Эта страница пуста. Напишите что-нибудь здесь и посмотрите, как она отображается здесь как этот заполнитель",
    toasts: {
      link: {
        success: {
          title: "Страницы обновлены",
          message: "Страницы успешно обновлены",
        },
        error: {
          title: "Страницы не обновлены",
          message: "Страницы не могут быть обновлены",
        },
      },
      remove: {
        success: {
          title: "Страница удалена",
          message: "Страница успешно удалена",
        },
        error: {
          title: "Страница не удалена",
          message: "Страница не может быть удалена",
        },
      },
    },
  },
  intake: "Предложения",
  renew: "Продлить",
  preview: "Предпросмотр",
  time_tracking: "Учет времени",
  work_management: "Управление рабочими элементами",
  projects_and_issues: "Проекты и рабочие элементы",
  projects_and_issues_description: "Включить/отключить для этого проекта",
  cycles_description:
    "Ограничьте работу по времени для каждого проекта и при необходимости изменяйте период. Один цикл может длиться 2 недели, следующий — 1 неделю.",
  modules_description: "Организуйте работу в подпроекты с назначенными руководителями и исполнителями.",
  views_description:
    "Сохраните пользовательские сортировки, фильтры и параметры отображения или поделитесь ими с командой.",
  pages_description: "Создавайте и редактируйте свободный контент: заметки, документы, что угодно.",
  intake_description:
    "Позвольте участникам вне команды сообщать об ошибках, оставлять отзывы и предложения, не нарушая ваш рабочий процесс.",
  time_tracking_description: "Записывайте время, потраченное на рабочие элементы и проекты.",
  work_management_description: "Управление рабочими элементами и проектами",
  documentation: "Документация",
  message_support: "Написать в поддержку",
  contact_sales: "Связаться с отделом продаж",
  hyper_mode: "Гиперрежим",
  keyboard_shortcuts: "Горячие клавиши",
  whats_new: "Что нового?",
  version: "Версия",
  we_are_having_trouble_fetching_the_updates: "Возникли проблемы с получением обновлений.",
  our_changelogs: "наши журналы изменений",
  for_the_latest_updates: "для последних обновлений.",
  please_visit: "Пожалуйста, посетите",
  docs: "Документация",
  full_changelog: "Полный журнал изменений",
  support: "Поддержка",
  forum: "Forum",
  powered_by_plane_pages: "Работает на Plane Pages",
  please_select_at_least_one_invitation: "Пожалуйста, выберите хотя бы одно приглашение.",
  please_select_at_least_one_invitation_description:
    "Для присоединения к рабочему пространству выберите хотя бы одно приглашение.",
  we_see_that_someone_has_invited_you_to_join_a_workspace:
    "Вы получили приглашение присоединиться к рабочему пространству",
  join_a_workspace: "Присоединиться к рабочему пространству",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description:
    "Вы получили приглашение присоединиться к рабочему пространству",
  join_a_workspace_description: "Присоединиться к рабочему пространству",
  accept_and_join: "Принять и присоединиться",
  go_home: "На главную",
  no_pending_invites: "Нет ожидающих приглашений",
  you_can_see_here_if_someone_invites_you_to_a_workspace: "Здесь отображаются приглашения в рабочие пространства",
  back_to_home: "Вернуться на главную",
  workspace_name: "название-рабочего-пространства",
  deactivate_your_account: "Деактивировать ваш аккаунт",
  deactivate_your_account_description:
    "После деактивации вы не сможете получать рабочие элементы и оплачивать рабочее пространство. Для реактивации потребуется новое приглашение.",
  deactivating: "Деактивация...",
  confirm: "Подтвердить",
  confirming: "Подтверждение...",
  draft_created: "Черновик создан",
  issue_created_successfully: "Рабочий элемент успешно создан",
  draft_creation_failed: "Ошибка создания черновика",
  issue_creation_failed: "Ошибка создания рабочего элемента",
  draft_issue: "Черновик рабочего элемента",
  issue_updated_successfully: "Рабочий элемент успешно обновлен",
  issue_could_not_be_updated: "Не удалось обновить рабочий элемент",
  create_a_draft: "Создать черновик",
  save_to_drafts: "Сохранить в черновики",
  save: "Сохранить",
  update: "Обновить",
  updating: "Обновление...",
  create_new_issue: "Создать новый рабочий элемент",
  editor_is_not_ready_to_discard_changes: "Редактор не готов отменить изменения",
  failed_to_move_issue_to_project: "Ошибка перемещения рабочего элемента в проект",
  create_more: "Создать еще",
  add_to_project: "Добавить в проект",
  discard: "Отменить",
  duplicate_issue_found: "Найден дублирующийся рабочий элемент",
  duplicate_issues_found: "Найдены дублирующиеся рабочие элементы",
  no_matching_results: "Нет совпадений",
  title_is_required: "Требуется заголовок",
  title: "Заголовок",
  state: "Статус",
  transition: "Переход",
  history: "История",
  priority: "Приоритет",
  none: "Нет",
  urgent: "Срочный",
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
  members: "Участники",
  assignee: "Назначенный",
  assignees: "Назначенные",
  subscriber: "{count, plural, one{# Подписчик} few{# Подписчика} other{# Подписчиков}}",
  you: "Вы",
  labels: "Метки",
  create_new_label: "Создать новую метку",
  label_name: "Название метки",
  failed_to_create_label: "Не удалось создать метку. Пожалуйста, попробуйте снова.",
  start_date: "Дата начала",
  end_date: "Дата окончания",
  due_date: "Срок выполнения",
  estimate: "Оценка",
  change_parent_issue: "Изменить родительский рабочий элемент",
  remove_parent_issue: "Удалить родительский рабочий элемент",
  add_parent: "Добавить родительский",
  loading_members: "Загрузка участников",
  view_link_copied_to_clipboard: "Ссылка на представление скопирована в буфер",
  required: "Обязательно",
  optional: "Опционально",
  Cancel: "Отмена",
  edit: "Редактировать",
  archive: "Архивировать",
  restore: "Восстановить",
  open_in_new_tab: "Открыть в новой вкладке",
  delete: "Удалить",
  deleting: "Удаление...",
  make_a_copy: "Создать копию",
  move_to_project: "Переместить в проект",
  good: "Доброго",
  morning: "утра",
  afternoon: "дня",
  evening: "вечера",
  show_all: "Показать все",
  show_less: "Свернуть",
  no_data_yet: "Нет данных",
  syncing: "Синхронизация",
  add_work_item: "Добавить рабочий элемент",
  advanced_description_placeholder: "Нажмите '/' для команд",
  create_work_item: "Создать рабочий элемент",
  attachments: "Вложения",
  declining: "Отмена...",
  declined: "Отменено",
  decline: "Отменить",
  unassigned: "Не назначено",
  work_items: "Рабочие элементы",
  add_link: "Добавить ссылку",
  points: "Очки",
  no_assignee: "Нет назначенного",
  no_assignees_yet: "Нет назначенных",
  no_labels_yet: "Нет меток",
  ideal: "Идеально",
  current: "Текущее",
  no_matching_members: "Нет совпадений",
  leaving: "Выход...",
  removing: "Удаление...",
  leave: "Покинуть",
  refresh: "Обновить",
  refreshing: "Обновление...",
  refresh_status: "Обновить статус",
  prev: "Назад",
  next: "Вперед",
  re_generating: "Повторная генерация...",
  re_generate: "Сгенерировать заново",
  re_generate_key: "Перегенерировать ключ",
  export: "Экспорт",
  member: "{count, plural, one{# участник} few{# участника} other{# участников}}",
  new_password_must_be_different_from_old_password: "Новое пароль должен отличаться от старого пароля",
  edited: "Редактировано",
  bot: "Бот",
  project_view: {
    sort_by: {
      created_at: "Дата создания",
      updated_at: "Дата обновления",
      name: "Имя",
    },
  },
  upgrade_request: "Попросите администратора рабочего пространства выполнить обновление.",
  copied_to_clipboard: "Скопировано в буфер обмена",
  copied_to_clipboard_description: "URL успешно скопирован в буфер обмена",
  toast: {
    success: "Успех!",
    error: "Ошибка!",
  },
  links: {
    toasts: {
      created: {
        title: "Ссылка создана",
        message: "Ссылка успешно создана",
      },
      not_created: {
        title: "Ошибка создания ссылки",
        message: "Не удалось создать ссылку",
      },
      updated: {
        title: "Ссылка обновлена",
        message: "Ссылка успешно обновлена",
      },
      not_updated: {
        title: "Ошибка обновления ссылки",
        message: "Не удалось обновить ссылку",
      },
      removed: {
        title: "Ссылка удалена",
        message: "Ссылка успешно удалена",
      },
      not_removed: {
        title: "Ошибка удаления ссылки",
        message: "Не удалось удалить ссылку",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "Руководство по началу работы",
      not_right_now: "Не сейчас",
      create_project: {
        title: "Создать проект",
        description: "Большинство вещей начинаются с проекта в Plane.",
        cta: "Начать",
      },
      invite_team: {
        title: "Пригласить команду",
        description: "Создавайте, развивайте и управляйте вместе с коллегами.",
        cta: "Пригласить",
      },
      configure_workspace: {
        title: "Настройте рабочее пространство",
        description: "Включайте/отключайте функции или делайте больше.",
        cta: "Настроить",
      },
      personalize_account: {
        title: "Персонализируйте Plane",
        description: "Выберите изображение, цвета и другие параметры.",
        cta: "Настроить сейчас",
      },
      widgets: {
        title: "Включите виджеты для лучшего опыта",
        description: `Все ваши виджеты выключены. Включите их
для улучшения взаимодействия!`,
        primary_button: {
          text: "Управление виджетами",
        },
      },
    },
    quick_links: {
      empty: "Сохраняйте ссылки на важные рабочие элементы.",
      add: "Добавить быструю ссылку",
      title: "Быстрая ссылка",
      title_plural: "Быстрые ссылки",
    },
    recents: {
      title: "Недавние",
      empty: {
        project: "Недавние проекты появятся здесь после посещения.",
        page: "Недавние страницы появятся здесь после посещения.",
        issue: "Недавние рабочие элементы появятся здесь после посещения.",
        default: "Пока нет недавних элементов",
      },
      filters: {
        all: "Все",
        projects: "Проекты",
        pages: "Страницы",
        issues: "Рабочие элементы",
      },
    },
    new_at_plane: {
      title: "Новое в Plane",
    },
    quick_tutorial: {
      title: "Быстрое обучение",
    },
    widget: {
      reordered_successfully: "Виджет успешно перемещен.",
      reordering_failed: "Ошибка при изменении порядка виджетов.",
    },
    manage_widgets: "Управление виджетами",
    title: "Главная",
    star_us_on_github: "Оцените нас на GitHub",
    business_trial_banner: {
      title: "Ваш 14-дневный пробный период плана Business активен!",
      description:
        "Изучите все функции Business. Когда будете готовы, оформите подписку. Автоматическое списание не производится.",
      trial_ends_today: "Пробный период заканчивается сегодня",
      trial_ends_in_days: "Пробный период заканчивается через {days, plural, one {# день} few {# дня} other {# дней}}",
      start_subscription: "Оформить подписку",
      explore_business_features: "Изучить функции Business",
    },
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "Некорректный URL",
        placeholder: "Введите или вставьте URL",
      },
      title: {
        text: "Отображаемый заголовок",
        placeholder: "Как вы хотите видеть эту ссылку",
      },
    },
  },
  common: {
    all: "Все",
    no_items_in_this_group: "В этой группе нет элементов",
    drop_here_to_move: "Перетащите сюда для перемещения",
    states: "Статусы",
    state: "Статус",
    state_groups: "Группы статусов",
    state_group: "Группа статусов",
    priorities: "Приоритеты",
    priority: "Приоритет",
    team_project: "Командный проект",
    project: "Проект",
    cycle: "Цикл",
    cycles: "Циклы",
    module: "Модуль",
    modules: "Модули",
    labels: "Метки",
    label: "Метка",
    assignees: "Назначенные",
    assignee: "Назначенный",
    created_by: "Создано",
    none: "Нет",
    link: "Ссылка",
    estimates: "Оценки",
    estimate: "Оценка",
    created_at: "Создано в",
    updated_at: "Дата обновления",
    completed_at: "Завершено в",
    layout: "Макет",
    filters: "Фильтры",
    display: "Отображение",
    load_more: "Загрузить еще",
    activity: "Активность",
    analytics: "Аналитика",
    dates: "Даты",
    success: "Успешно!",
    something_went_wrong: "Что-то пошло не так",
    error: {
      label: "Ошибка!",
      message: "Произошла ошибка. Пожалуйста, попробуйте снова.",
    },
    group_by: "Группировать по",
    epic: "Эпик",
    epics: "Эпики",
    work_item: "Рабочий элемент",
    work_items: "Рабочие элементы",
    sub_work_item: "Подэлемент",
    add: "Добавить",
    warning: "Предупреждение",
    updating: "Обновление",
    adding: "Добавление",
    update: "Обновить",
    creating: "Создание",
    create: "Создать",
    cancel: "Отмена",
    description: "Описание",
    title: "Заголовок",
    attachment: "Вложение",
    general: "Общее",
    features: "Функции",
    automation: "Автоматизация",
    project_name: "Название проекта",
    project_id: "ID проекта",
    project_timezone: "Часовой пояс проекта",
    created_on: "Создано",
    updated_on: "Обновлено",
    completed_on: "Completed on",
    update_project: "Обновить проект",
    identifier_already_exists: "Идентификатор уже существует",
    add_more: "Добавить еще",
    defaults: "По умолчанию",
    add_label: "Добавить метку",
    customize_time_range: "Настроить период",
    loading: "Загрузка",
    attachments: "Вложения",
    property: "Свойство",
    properties: "Свойства",
    parent: "Родительский",
    page: "Пейдж",
    remove: "Удалить",
    archiving: "Архивация",
    archive: "Архивировать",
    access: {
      public: "Публичный",
      private: "Приватный",
    },
    done: "Готово",
    sub_work_items: "Подэлементы",
    comment: "Комментарий",
    workspace_level: "Уровень рабочего пространства",
    order_by: {
      label: "Сортировать по",
      manual: "Вручную",
      last_created: "Последние созданные",
      last_updated: "Последние обновленные",
      start_date: "Дата начала",
      due_date: "Срок выполнения",
      asc: "По возрастанию",
      desc: "По убыванию",
      updated_on: "Дата обновления",
    },
    sort: {
      asc: "По возрастанию",
      desc: "По убыванию",
      created_on: "Дата создания",
      updated_on: "Дата обновления",
    },
    comments: "Комментарии",
    updates: "Обновления",
    additional_updates: "Дополнительные обновления",
    clear_all: "Очистить все",
    copied: "Скопировано!",
    link_copied: "Ссылка скопирована!",
    link_copied_to_clipboard: "Ссылка скопирована в буфер обмена",
    copied_to_clipboard: "Ссылка на рабочий элемент скопирована",
    branch_name_copied_to_clipboard: "Название ветки скопировано в буфер обмена",
    is_copied_to_clipboard: "Рабочий элемент скопирован в буфер обмена",
    no_links_added_yet: "Нет добавленных ссылок",
    add_link: "Добавить ссылку",
    links: "Ссылки",
    go_to_workspace: "Перейти в рабочее пространство",
    progress: "Прогресс",
    optional: "Опционально",
    join: "Присоединиться",
    go_back: "Назад",
    continue: "Продолжить",
    resend: "Отправить повторно",
    relations: "Связи",
    errors: {
      default: {
        title: "Ошибка!",
        message: "Что-то пошло не так. Попробуйте позже.",
      },
      required: "Это поле обязательно",
      entity_required: "{entity} обязательно",
      restricted_entity: "{entity} ограничен",
    },
    update_link: "обновить ссылку",
    attach: "Прикрепить",
    create_new: "Создать новый",
    add_existing: "Добавить существующий",
    type_or_paste_a_url: "Введите или вставьте URL",
    url_is_invalid: "Некорректный URL",
    display_title: "Отображаемое название",
    link_title_placeholder: "Как вы хотите видеть эту ссылку",
    url: "URL",
    side_peek: "Боковой просмотр",
    modal: "Модальное окно",
    full_screen: "Полный экран",
    close_peek_view: "Закрыть просмотр",
    toggle_peek_view_layout: "Переключить макет просмотра",
    options: "Опции",
    duration: "Продолжительность",
    today: "Сегодня",
    week: "Неделя",
    month: "Месяц",
    quarter: "Квартал",
    press_for_commands: "Нажмите '/' для команд",
    click_to_add_description: "Нажмите, чтобы добавить описание",
    search: {
      label: "Поиск",
      placeholder: "Введите для поиска",
      no_matches_found: "Совпадений не найдено",
      no_matching_results: "Нет подходящих результатов",
    },
    actions: {
      edit: "Редактировать",
      make_a_copy: "Сделать копию",
      open_in_new_tab: "Открыть в новой вкладке",
      copy_link: "Копировать ссылку",
      copy_branch_name: "Копировать название ветки",
      archive: "Архивировать",
      restore: "Восстановить",
      delete: "Удалить",
      remove_relation: "Удалить связь",
      subscribe: "Подписаться",
      unsubscribe: "Отписаться",
      clear_sorting: "Сбросить сортировку",
      show_weekends: "Показывать выходные",
      enable: "Включить",
      disable: "Отключить",
    },
    name: "Название",
    discard: "Отменить",
    confirm: "Подтвердить",
    confirming: "Подтверждение",
    read_the_docs: "Документация",
    default: "По умолчанию",
    active: "Активный",
    enabled: "Включён",
    disabled: "Отключён",
    mandate: "Мандат",
    mandatory: "Обязательный",
    yes: "Да",
    no: "Нет",
    please_wait: "Пожалуйста, подождите",
    enabling: "Включение",
    disabling: "Отключение",
    beta: "Бета",
    or: "или",
    next: "Далее",
    back: "Назад",
    cancelling: "Отмена",
    configuring: "Настройка",
    clear: "Очистить",
    import: "Импорт",
    connect: "Подключить",
    authorizing: "Авторизация",
    processing: "Обработка",
    no_data_available: "Нет доступных данных",
    from: "от {name}",
    authenticated: "Авторизован",
    select: "Выбрать",
    upgrade: "Обновить",
    add_seats: "Добавить места",
    projects: "Проекты",
    workspace: "Рабочее пространство",
    workspaces: "Рабочие пространства",
    team: "Команда",
    teams: "Команды",
    entity: "Сущность",
    entities: "Сущности",
    task: "Рабочий элемент",
    tasks: "Рабочие элементы",
    section: "Секция",
    sections: "Секции",
    edit: "Редактировать",
    connecting: "Подключение",
    connected: "Подключён",
    disconnect: "Отключить",
    disconnecting: "Отключение",
    installing: "Установка",
    install: "Установить",
    reset: "Сбросить",
    live: "В реальном времени",
    change_history: "История изменений",
    coming_soon: "Скоро",
    member: "Участник",
    members: "Участники",
    you: "Вы",
    upgrade_cta: {
      higher_subscription: "Перейти на подписку выше",
      talk_to_sales: "Связаться с отделом продаж",
    },
    category: "Категория",
    categories: "Категории",
    saving: "Сохранение",
    save_changes: "Сохранить изменения",
    delete: "Удалить",
    deleting: "Удаление",
    pending: "Ожидание",
    invite: "Пригласить",
    view: "Просмотр",
    deactivated_user: "Деактивированный пользователь",
    apply: "Применить",
    applying: "Применение",
    users: "Пользователи",
    admins: "Администраторы",
    guests: "Гости",
    on_track: "По плану",
    off_track: "Отклонение от плана",
    at_risk: "Под угрозой",
    timeline: "Хронология",
    completion: "Завершение",
    upcoming: "Предстоящие",
    completed: "Завершено",
    in_progress: "В процессе",
    planned: "Запланировано",
    paused: "На паузе",
    no_of: "Количество {entity}",
    resolved: "Решено",
    worklogs: "Рабочие журналы",
    project_updates: "Обновления проекта",
    overview: "Обзор",
    workflows: "Рабочие процессы",
    members_and_teamspaces: "Участники и командные пространства",
    open_in_full_screen: "Открыть {page} в полном экране",
    details: "Подробности",
    project_structure: "Структура проекта",
    custom_properties: "Пользовательские свойства",
  },
  chart: {
    x_axis: "Ось X",
    y_axis: "Ось Y",
    metric: "Метрика",
  },
  form: {
    title: {
      required: "Название обязательно",
      max_length: "Название должно быть короче {length} символов",
    },
  },
  entity: {
    grouping_title: "Группировка {entity}",
    priority: "Приоритет {entity}",
    all: "Все {entity}",
    drop_here_to_move: "Переместите {entity} сюда",
    delete: {
      label: "Удалить {entity}",
      success: "{entity} успешно удалён",
      failed: "Ошибка удаления {entity}",
    },
    update: {
      failed: "Ошибка обновления {entity}",
      success: "{entity} успешно обновлён",
    },
    link_copied_to_clipboard: "Ссылка на {entity} скопирована",
    fetch: {
      failed: "Ошибка получения {entity}",
    },
    add: {
      success: "{entity} успешно добавлен",
      failed: "Ошибка добавления {entity}",
    },
    remove: {
      success: "{entity} успешно удален",
      failed: "Ошибка удаления {entity}",
    },
  },
  epic: {
    all: "Все эпики",
    label: "{count, plural, one {Эпик} other {Эпики}}",
    new: "Новый эпик",
    adding: "Добавление эпика",
    create: {
      success: "Эпик успешно создан",
    },
    add: {
      press_enter: "Нажмите 'Enter' чтобы добавить ещё эпик",
      label: "Добавить эпик",
    },
    title: {
      label: "Название эпика",
      required: "Название эпика обязательно",
    },
    archive: {
      description: `Архивировать можно только завершённые
или отменённые эпики`,
      label: "Архивировать эпик",
      confirm_message:
        "Вы уверены, что хотите архивировать эпик? Все архивированные эпики можно будет восстановить позже.",
      success: {
        label: "Архивация успешна",
        message: "Ваши архивы находятся в архивах проекта.",
      },
      failed: {
        message: "Не удалось архивировать эпик. Попробуйте снова.",
      },
    },
  },
  issue: {
    label: "{count, plural, one {Рабочий элемент} other {Рабочие элементы}}",
    all: "Все рабочие элементы",
    edit: "Редактировать рабочий элемент",
    title: {
      label: "Название рабочего элемента",
      required: "Название рабочего элемента обязательно.",
    },
    add: {
      press_enter: "Нажмите 'Enter' чтобы добавить ещё рабочий элемент",
      label: "Добавить рабочий элемент",
      cycle: {
        failed: "Не удалось добавить рабочий элемент в цикл. Попробуйте снова.",
        success:
          "{count, plural, one {Рабочий элемент} other {Рабочие элементы}} успешно {count, plural, one {добавлен} other {добавлены}} в цикл.",
        loading: "Добавление {count, plural, one {рабочего элемента} other {рабочих элементов}} в цикл",
      },
      assignee: "Добавить ответственных",
      start_date: "Добавить дату начала",
      due_date: "Добавить срок выполнения",
      parent: "Добавить родительский рабочий элемент",
      sub_issue: "Добавить подэлемент",
      relation: "Добавить связь",
      link: "Добавить ссылку",
      existing: "Добавить существующий рабочий элемент",
    },
    remove: {
      label: "Удалить рабочий элемент",
      cycle: {
        loading: "Удаление рабочего элемента из цикла",
        success: "Рабочий элемент успешно удален из цикла",
        failed: "Не удалось удалить рабочий элемент из цикла. Попробуйте снова.",
      },
      module: {
        loading: "Удаление рабочего элемента из модуля",
        success: "Рабочий элемент успешно удален из модуля.",
        failed: "Не удалось удалить рабочий элемент из модуля. Попробуйте снова.",
      },
      parent: {
        label: "Удалить родительский рабочий элемент",
      },
    },
    new: "Новый рабочий элемент",
    adding: "Добавление рабочего элемента",
    create: {
      success: "Рабочий элемент успешно создан",
    },
    priority: {
      urgent: "Срочный",
      high: "Высокий",
      medium: "Средний",
      low: "Низкий",
    },
    display: {
      properties: {
        label: "Отображаемые свойства",
        id: "ID",
        issue_type: "Тип рабочего элемента",
        sub_issue_count: "Количество подэлементов",
        attachment_count: "Количество вложений",
        created_on: "Дата создания",
        sub_issue: "Подэлемент",
        work_item_count: "Количество рабочих элементов",
      },
      extra: {
        show_sub_issues: "Показывать подэлементы",
        show_empty_groups: "Показывать пустые группы",
      },
    },
    layouts: {
      ordered_by_label: "Сортировка по",
      list: "Список",
      kanban: "Доска",
      calendar: "Календарь",
      spreadsheet: "Таблица",
      gantt: "График",
      title: {
        list: "Список",
        kanban: "Доска",
        calendar: "Календарь",
        spreadsheet: "Таблица",
        gantt: "График",
      },
    },
    states: {
      active: "Активно",
      backlog: "Бэклог",
    },
    comments: {
      placeholder: "Добавить комментарий",
      switch: {
        private: "Изменить на приватный комментарий",
        public: "Изменить на публичный комментарий",
      },
      create: {
        success: "Комментарий успешно добавлен",
        error: "Ошибка создания комментария. Попробуйте позже.",
      },
      update: {
        success: "Комментарий успешно обновлён",
        error: "Ошибка обновления комментария. Попробуйте позже.",
      },
      remove: {
        success: "Комментарий успешно удалён",
        error: "Ошибка удаления комментария. Попробуйте позже.",
      },
      upload: {
        error: "Ошибка загрузки файла. Попробуйте позже.",
      },
      copy_link: {
        success: "Ссылка на комментарий скопирована в буфер обмена",
        error: "Ошибка при копировании ссылки на комментарий. Попробуйте позже.",
      },
    },
    empty_state: {
      issue_detail: {
        title: "Рабочий элемент не существует",
        description: "Данный рабочий элемент был удален, архивирован или не существует.",
        primary_button: {
          text: "Посмотреть другие рабочие элементы",
        },
      },
    },
    sibling: {
      label: "Связанные рабочие элементы",
    },
    archive: {
      description: `Только завершённые или отменённые
рабочие элементы можно архивировать`,
      label: "Архивировать рабочий элемент",
      confirm_message: "Вы уверены что хотите архивировать рабочий элемент? Архивы можно восстановить позже.",
      success: {
        label: "Архивация успешна",
        message: "Архивы доступны в разделе архивов проекта",
      },
      failed: {
        message: "Ошибка архивации рабочего элемента. Попробуйте позже.",
      },
    },
    restore: {
      success: {
        title: "Восстановление успешно",
        message: "Рабочий элемент доступен в разделе рабочих элементов проекта",
      },
      failed: {
        message: "Ошибка восстановления рабочего элемента. Попробуйте позже.",
      },
    },
    relation: {
      relates_to: "Связан с",
      duplicate: "Дубликат",
      blocked_by: "Блокируется",
      blocking: "Блокирует",
      start_before: "Начинается до",
      start_after: "Начинается после",
      finish_before: "Заканчивается до",
      finish_after: "Заканчивается после",
      implements: "Реализует",
      implemented_by: "Реализовано",
    },
    copy_link: "Копировать ссылку на рабочий элемент",
    delete: {
      label: "Удалить рабочий элемент",
      error: "Ошибка удаления рабочего элемента",
    },
    subscription: {
      actions: {
        subscribed: "Подписка на рабочий элемент оформлена",
        unsubscribed: "Подписка на рабочий элемент отменена",
      },
    },
    select: {
      error: "Выберите хотя бы один рабочий элемент",
      empty: "Рабочие элементы не выбраны",
      add_selected: "Добавить выбранные рабочие элементы",
      select_all: "Выбрать все",
      deselect_all: "Снять выделение со всех",
    },
    open_in_full_screen: "Открыть рабочий элемент в полном экране",
    vote: {
      click_to_upvote: "Нажмите, чтобы проголосовать за",
      click_to_downvote: "Нажмите, чтобы проголосовать против",
      click_to_view_upvotes: "Нажмите, чтобы посмотреть голоса за",
      click_to_view_downvotes: "Нажмите, чтобы посмотреть голоса против",
    },
  },
  attachment: {
    error: "Ошибка прикрепления файла",
    only_one_file_allowed: "Можно загрузить только один файл",
    file_size_limit: "Максимальный размер файла - {size} МБ",
    drag_and_drop: "Перетащите файл для загрузки",
    delete: "Удалить вложение",
  },
  label: {
    select: "Выбрать метку",
    create: {
      success: "Метка создана",
      failed: "Ошибка создания метки",
      already_exists: "Метка уже существует",
      type: "Введите новую метку",
    },
  },
  sub_work_item: {
    update: {
      success: "Подэлемент успешно обновлен",
      error: "Ошибка обновления подэлемента",
    },
    remove: {
      success: "Подэлемент успешно удален",
      error: "Ошибка удаления подэлемента",
    },
    empty_state: {
      sub_list_filters: {
        title: "У вас нет подэлементов, которые соответствуют примененным фильтрам.",
        description: "Чтобы увидеть все подэлементы, очистите все примененные фильтры.",
        action: "Очистить фильтры",
      },
      list_filters: {
        title: "У вас нет рабочих элементов, которые соответствуют примененным фильтрам.",
        description: "Чтобы увидеть все рабочие элементы, очистите все примененные фильтры.",
        action: "Очистить фильтры",
      },
    },
  },
  view: {
    label: "{count, plural, one {Представление} other {Представления}}",
    create: {
      label: "Создать представление",
    },
    update: {
      label: "Обновить представление",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "Ожидание",
        description: "Ожидание",
      },
      declined: {
        title: "Отклонено",
        description: "Отклонено",
      },
      snoozed: {
        title: "Отложено",
        description: "{days, plural, one{# день} other{# дней}} осталось",
      },
      accepted: {
        title: "Принято",
        description: "Принято",
      },
      duplicate: {
        title: "Дубликат",
        description: "Дубликат",
      },
    },
    modals: {
      decline: {
        title: "Отклонить рабочий элемент",
        content: "Вы уверены, что хотите отклонить рабочий элемент {value}?",
      },
      delete: {
        title: "Удалить рабочий элемент",
        content: "Вы уверены, что хотите удалить рабочий элемент {value}?",
        success: "Рабочий элемент успешно удален",
      },
    },
    errors: {
      snooze_permission: "Только администраторы проекта могут откладывать/возобновлять рабочие элементы",
      accept_permission: "Только администраторы проекта могут принимать рабочие элементы",
      decline_permission: "Только администраторы проекта могут отклонять рабочие элементы",
    },
    actions: {
      accept: "Принять",
      decline: "Отклонить",
      snooze: "Отложить",
      unsnooze: "Возобновить",
      copy: "Копировать ссылку на рабочий элемент",
      delete: "Удалить",
      open: "Открыть рабочий элемент",
      mark_as_duplicate: "Пометить как дубликат",
      move: "Перенести {value} в рабочие элементы проекта",
    },
    source: {
      "in-app": "в приложении",
    },
    order_by: {
      created_at: "Дата создания",
      updated_at: "Дата обновления",
      id: "ID",
    },
    label: "Входящие",
    page_label: "{workspace} - Входящие",
    modal: {
      title: "Создать входящий рабочий элемент",
    },
    tabs: {
      open: "Открытые",
      closed: "Закрытые",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "Нет открытых рабочих элементов",
        description: "Здесь отображаются открытые рабочие элементы. Создайте новый рабочий элемент.",
      },
      sidebar_closed_tab: {
        title: "Нет закрытых рабочих элементов",
        description: "Все рабочие элементы, принятые или отклоненные, можно найти здесь.",
      },
      sidebar_filter: {
        title: "Нет подходящих рабочих элементов",
        description: "Не найдено рабочих элементов по примененным фильтрам. Создайте новый рабочий элемент.",
      },
      detail: {
        title: "Выберите рабочий элемент для просмотра деталей.",
      },
    },
  },
  workspace_creation: {
    heading: "Создайте рабочее пространство",
    subheading: "Чтобы начать использовать Plane, создайте или присоединитесь к рабочему пространству.",
    form: {
      name: {
        label: "Название рабочего пространства",
        placeholder: "Лучше использовать знакомое и узнаваемое название",
      },
      url: {
        label: "Установите URL рабочего пространства",
        placeholder: "Введите или вставьте URL",
        edit_slug: "Можно редактировать только часть URL (slug)",
      },
      organization_size: {
        label: "Сколько человек будут использовать это пространство?",
        placeholder: "Выберите диапазон",
      },
    },
    errors: {
      creation_disabled: {
        title: "Только администратор экземпляра может создавать рабочие пространства",
        description: "Если вы знаете email администратора, нажмите кнопку ниже для связи.",
        request_button: "Запросить администратора",
      },
      validation: {
        name_alphanumeric: "Название может содержать только пробелы, дефисы, подчёркивания и буквенно-цифровые символы",
        name_length: "Максимальная длина названия - 80 символов",
        url_alphanumeric: "URL может содержать только дефисы и буквенно-цифровые символы",
        url_length: "Максимальная длина URL - 48 символов",
        url_already_taken: "Этот URL уже занят!",
      },
    },
    request_email: {
      subject: "Запрос нового рабочего пространства",
      body: `Здравствуйте, администратор!

Пожалуйста, создайте новое рабочее пространство с URL [/workspace-name] для [цель создания].

Спасибо,
{firstName} {lastName}
{email}`,
    },
    button: {
      default: "Создать пространство",
      loading: "Создание пространства",
    },
    toast: {
      success: {
        title: "Успех",
        message: "Рабочее пространство успешно создано",
      },
      error: {
        title: "Ошибка",
        message: "Не удалось создать пространство. Попробуйте снова.",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "Обзор проектов, активности и метрик",
        description:
          "Добро пожаловать в Plane! Создайте первый проект и отслеживайте рабочие элементы - эта страница станет вашим рабочим пространством. Администраторы также увидят элементы для управления командой.",
        primary_button: {
          text: "Создать первый проект",
          comic: {
            title: "Всё начинается с проекта в Plane",
            description: "Проектом может быть роадмап продукта, маркетинговая кампания или запуск нового автомобиля.",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "Аналитика",
    page_label: "{workspace} - Аналитика",
    open_tasks: "Всего открытых рабочих элементов",
    error: "Ошибка при получении данных",
    work_items_closed_in: "Рабочие элементы закрыты в",
    selected_projects: "Выбранные проекты",
    total_members: "Всего участников",
    total_cycles: "Всего циклов",
    total_modules: "Всего модулей",
    pending_work_items: {
      title: "Ожидающие рабочие элементы",
      empty_state: "Здесь отображается анализ ожидающих рабочих элементов по сотрудникам.",
    },
    work_items_closed_in_a_year: {
      title: "Рабочие элементы закрытые за год",
      empty_state: "Закрывайте рабочие элементы для просмотра анализа в виде графика.",
    },
    most_work_items_created: {
      title: "Наибольшее количество созданных рабочих элементов",
      empty_state: "Здесь отображаются сотрудники и количество созданных ими рабочих элементов.",
    },
    most_work_items_closed: {
      title: "Наибольшее количество закрытых рабочих элементов",
      empty_state: "Здесь отображаются сотрудники и количество закрытых ими рабочих элементов.",
    },
    tabs: {
      scope_and_demand: "Объём и спрос",
      custom: "Пользовательская аналитика",
    },
    empty_state: {
      customized_insights: {
        description: "Назначенные вам рабочие элементы, разбитые по статусам, появятся здесь.",
        title: "Данных пока нет",
      },
      created_vs_resolved: {
        description: "Созданные и решённые со временем рабочие элементы появятся здесь.",
        title: "Данных пока нет",
      },
      project_insights: {
        title: "Данных пока нет",
        description: "Назначенные вам рабочие элементы, разбитые по статусам, появятся здесь.",
      },
      general: {
        title:
          "Отслеживайте прогресс, рабочие нагрузки и распределения. Выявляйте тренды, устраняйте блокировки и ускоряйте работу",
        description:
          "Смотрите объём versus спрос, оценки и расширение объёма. Получайте производительность по членам команды и командам, и убеждайтесь, что ваш проект выполняется в срок.",
        primary_button: {
          text: "Начать ваш первый проект",
          comic: {
            title: "Аналитика работает лучше всего с Циклами + Модулями",
            description:
              "Сначала ограничьте по времени ваши задачи в Циклах и, если можете, сгруппируйте задачи, которые длятся больше одного цикла, в Модули. Проверьте оба в левой навигации.",
          },
        },
      },
      cycle_progress: {
        title: "Данных пока нет",
        description:
          "Аналитика прогресса цикла появится здесь. Добавьте рабочие элементы в циклы, чтобы начать отслеживание прогресса.",
      },
      module_progress: {
        title: "Данных пока нет",
        description:
          "Аналитика прогресса модуля появится здесь. Добавьте рабочие элементы в модули, чтобы начать отслеживание прогресса.",
      },
      intake_trends: {
        title: "Данных пока нет",
        description:
          "Аналитика тенденций intake появится здесь. Добавьте рабочие элементы в intake, чтобы начать отслеживать тенденции.",
      },
    },
    created_vs_resolved: "Создано vs Решено",
    customized_insights: "Индивидуальные аналитические данные",
    backlog_work_items: "{entity} в бэклоге",
    active_projects: "Активные проекты",
    trend_on_charts: "Тренд на графиках",
    all_projects: "Все проекты",
    summary_of_projects: "Сводка по проектам",
    project_insights: "Аналитика проекта",
    started_work_items: "Начатые {entity}",
    total_work_items: "Общее количество {entity}",
    total_projects: "Всего проектов",
    total_admins: "Всего администраторов",
    total_users: "Всего пользователей",
    total_intake: "Общий доход",
    un_started_work_items: "Не начатые {entity}",
    total_guests: "Всего гостей",
    completed_work_items: "Завершённые {entity}",
    total: "Общее количество {entity}",
    projects_by_status: "Проекты по статусу",
    active_users: "Активные пользователи",
    intake_trends: "Тенденции приёма",
    workitem_resolved_vs_pending: "Решенные vs ожидающие рабочие элементы",
    upgrade_to_plan: "Обновитесь до {plan}, чтобы разблокировать {tab}",
  },
  workspace_projects: {
    label: "{count, plural, one {Проект} other {Проекты}}",
    create: {
      label: "Добавить проект",
    },
    network: {
      label: "Сеть",
      private: {
        title: "Приватный",
        description: "Доступ только по приглашению",
      },
      public: {
        title: "Публичный",
        description: "Доступен всем в рабочем пространстве кроме гостей",
      },
    },
    error: {
      permission: "Недостаточно прав для выполнения действия",
      cycle_delete: "Ошибка удаления цикла",
      module_delete: "Ошибка удаления модуля",
      issue_delete: "Не удалось удалить рабочий элемент",
    },
    state: {
      backlog: "Бэклог",
      unstarted: "Не начато",
      started: "В процессе",
      completed: "Завершено",
      cancelled: "Отменено",
    },
    sort: {
      manual: "Вручную",
      name: "По имени",
      created_at: "По дате создания",
      members_length: "По количеству участников",
    },
    scope: {
      my_projects: "Мои проекты",
      archived_projects: "Архивные",
    },
    common: {
      months_count: "{months, plural, one{# месяц} other{# месяцев}}",
      days_count: "{days, plural, one{# день} other{# дней}}",
    },
    empty_state: {
      general: {
        title: "Нет активных проектов",
        description:
          "Проекты помогают организовать работу. Создавайте проекты для управления рабочими элементами, циклами и модулями. Фильтруйте архивные проекты при необходимости.",
        primary_button: {
          text: "Создать первый проект",
          comic: {
            title: "Всё начинается с проекта в Plane",
            description:
              "Проектом может быть дорожная карта продукта, маркетинговая кампания или запуск нового автомобиля.",
          },
        },
      },
      no_projects: {
        title: "Нет проектов",
        description: "Для управления рабочими элементами необходимо создать проект или быть его участником.",
        primary_button: {
          text: "Создать первый проект",
          comic: {
            title: "Всё начинается с проекта в Plane",
            description:
              "Проектом может быть дорожная карта продукта, маркетинговая кампания или запуск нового автомобиля.",
          },
        },
      },
      filter: {
        title: "Нет подходящих проектов",
        description: `Не найдено проектов по заданным критериям.
Создайте новый проект.`,
      },
      search: {
        description: `Не найдено проектов по заданным критериям.
Создайте новый проект`,
      },
    },
  },
  workspace_views: {
    add_view: "Добавить представление",
    empty_state: {
      "all-issues": {
        title: "Нет рабочих элементов в проекте",
        description: "Первый проект создан! Теперь разделите работу на отслеживаемые рабочие элементы.",
        primary_button: {
          text: "Создать рабочий элемент",
        },
      },
      assigned: {
        title: "Нет назначенных рабочих элементов",
        description: "Здесь отображаются рабочие элементы, назначенные вам.",
        primary_button: {
          text: "Создать рабочий элемент",
        },
      },
      created: {
        title: "Нет созданных рабочих элементов",
        description: "Все созданные вами рабочие элементы отображаются здесь.",
        primary_button: {
          text: "Создать рабочий элемент",
        },
      },
      subscribed: {
        title: "Нет отслеживаемых рабочих элементов",
        description: "Подпишитесь на интересующие рабочие элементы для отслеживания.",
      },
      "custom-view": {
        title: "Нет рабочих элементов",
        description: "Здесь отображаются рабочие элементы, соответствующие фильтрам.",
      },
    },
    delete_view: {
      title: "Вы уверены, что хотите удалить это представление?",
      content:
        "При подтверждении все параметры сортировки, фильтрации и отображения + макет, выбранный для этого представления, будут безвозвратно удалены без возможности восстановления.",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "Изменить email",
        description: "Введите новый адрес электронной почты, чтобы получить ссылку для подтверждения.",
        toasts: {
          success_title: "Успех!",
          success_message: "Email успешно обновлён. Пожалуйста, войдите снова.",
        },
        form: {
          email: {
            label: "Новый email",
            placeholder: "Введите свой email",
            errors: {
              required: "Email обязателен",
              invalid: "Email недействителен",
              exists: "Email уже существует. Используйте другой.",
              validation_failed: "Не удалось подтвердить email. Попробуйте ещё раз.",
            },
          },
          code: {
            label: "Уникальный код",
            placeholder: "123456",
            helper_text: "Код подтверждения отправлен на ваш новый email.",
            errors: {
              required: "Уникальный код обязателен",
              invalid: "Неверный код подтверждения. Попробуйте ещё раз.",
            },
          },
        },
        actions: {
          continue: "Продолжить",
          confirm: "Подтвердить",
          cancel: "Отмена",
        },
        states: {
          sending: "Отправка…",
        },
      },
    },
    notifications: {
      select_default_view: "Выбрать вид по умолчанию",
      compact: "Компактный",
      full: "Полный экран",
    },
  },
  workspace_settings: {
    label: "Настройки пространства",
    page_label: "{workspace} - Основные настройки",
    key_created: "Ключ создан",
    copy_key:
      "Скопируйте и сохраните секретный ключ в Plane Pages. После закрытия ключ будет недоступен. CSV-файл с ключом был скачан.",
    token_copied: "Токен скопирован в буфер",
    settings: {
      general: {
        title: "Основные",
        upload_logo: "Загрузить логотип",
        edit_logo: "Изменить логотип",
        name: "Название пространства",
        company_size: "Размер компании",
        url: "URL пространства",
        workspace_timezone: "Часовой пояс рабочего пространства",
        update_workspace: "Обновить пространство",
        delete_workspace: "Удалить пространство",
        delete_workspace_description: "Все данные будут безвозвратно удалены.",
        delete_btn: "Удалить пространство",
        delete_modal: {
          title: "Подтвердите удаление пространства",
          description: "У вас есть активная пробная подписка. Сначала отмените её.",
          dismiss: "Отмена",
          cancel: "Отменить подписку",
          success_title: "Пространство удалено",
          success_message: "Вы будете перенаправлены в профиль",
          error_title: "Ошибка",
          error_message: "Попробуйте снова",
        },
        errors: {
          name: {
            required: "Обязательное поле",
            max_length: "Максимум 80 символов",
          },
          company_size: {
            required: "Размер компании обязателен",
            select_a_range: "Выберите размер организации",
          },
        },
      },
      members: {
        title: "Участники",
        add_member: "Добавить участника",
        pending_invites: "Ожидающие приглашения",
        invitations_sent_successfully: "Приглашения отправлены",
        leave_confirmation: "Подтвердите выход из пространства. Доступ будет утрачен. Это действие нельзя отменить.",
        details: {
          full_name: "Полное имя",
          display_name: "Отображаемое имя",
          email_address: "Email",
          account_type: "Тип аккаунта",
          authentication: "Аутентификация",
          joining_date: "Дата присоединения",
        },
        modal: {
          title: "Пригласить участников",
          description: "Пригласите коллег в рабочее пространство.",
          button: "Отправить приглашения",
          button_loading: "Отправка...",
          placeholder: "name@company.com",
          errors: {
            required: "Введите email адрес, чтобы пригласить участников",
            invalid: "Неверный email",
          },
        },
      },
      billing_and_plans: {
        title: "Оплата и тарифы",
        current_plan: "Текущий тариф",
        free_plan: "Используется бесплатный тариф",
        view_plans: "Посмотреть тарифы",
      },
      exports: {
        title: "Экспорт",
        exporting: "Экспортируется",
        previous_exports: "Предыдущие экспорты",
        export_separate_files: "Экспорт в отдельные файлы",
        filters_info: "Примените фильтры для экспорта конкретных рабочих элементов по вашим критериям.",
        modal: {
          title: "Экспорт в",
          toasts: {
            success: {
              title: "Успешный экспорт",
              message: "Экспортированные {entity} доступны для скачивания.",
            },
            error: {
              title: "Ошибка экспорта",
              message: "Эскпорт не удался. Попробуйте снова",
            },
          },
        },
      },
      webhooks: {
        title: "Вебхуки",
        add_webhook: "Добавить вебхук",
        modal: {
          title: "Создать вебхук",
          details: "Детали вебхука",
          payload: "URL для уведомлений",
          question: "Какие события будут активировать вебхук?",
          error: "Требуется URL",
        },
        secret_key: {
          title: "Секретный ключ",
          message: "Сгенерируйте токен для подписи уведомлений",
        },
        options: {
          all: "Все события",
          individual: "Выбрать события",
        },
        toasts: {
          created: {
            title: "Вебхук создан",
            message: "Вебхук успешно создан",
          },
          not_created: {
            title: "Ошибка создания",
            message: "Не удалось создать вебхук",
          },
          updated: {
            title: "Обновлено",
            message: "Вебхук успешно обновлён",
          },
          not_updated: {
            title: "Ошибка обновления",
            message: "Не удалось обновить вебхук",
          },
          removed: {
            title: "Вебхук удалён",
            message: "Вебхук успешно удалён",
          },
          not_removed: {
            title: "Ошибка удаления вебхука",
            message: "Не удалось удалить вебхук",
          },
          secret_key_copied: {
            message: "Секретный ключ скопирован",
          },
          secret_key_not_copied: {
            message: "Ошибка копирования ключа",
          },
        },
      },
      api_tokens: {
        heading: "API-токены",
        description:
          "Создавайте безопасные API-токены для интеграции ваших данных с внешними системами и приложениями.",
        title: "API-токены",
        add_token: "Добавить токен доступа",
        create_token: "Создать токен",
        never_expires: "Бессрочный",
        generate_token: "Сгенерировать токен",
        generating: "Генерация",
        delete: {
          title: "Удалить токен",
          description: "Приложения, использующие этот токен, потеряют доступ. Действие необратимо.",
          success: {
            title: "Успех!",
            message: "Токен удалён",
          },
          error: {
            title: "Ошибка!",
            message: "Не удалось удалить токен",
          },
        },
      },
      integrations: {
        title: "Интеграции",
        page_title: "Работайте с данными Plane в доступных приложениях или в собственных.",
        page_description: "Просмотрите все интеграции, используемые этим рабочим пространством или вами.",
      },
      imports: {
        title: "Импорт",
      },
      worklogs: {
        title: "Рабочие журналы",
      },
      group_syncing: {
        title: "Синхронизация групп",
        heading: "Синхронизация групп",
        description:
          "Свяжите группы поставщика удостоверений с проектами и ролями. Доступ пользователей обновляется автоматически при изменении членства в группе в вашем IdP, упрощая онбординг и оффбординг.",
        enable: {
          title: "Включить синхронизацию групп",
          description: "Автоматически добавляйте пользователей в проекты на основе групп поставщика удостоверений.",
        },
        config: {
          title: "Настроить синхронизацию групп",
          description: "Настройте сопоставление групп поставщика удостоверений с проектами и ролями.",
          sync_on_login: {
            title: "Синхронизация при входе",
            description: "Обновляйте членство в группе и доступ к проекту при входе пользователя.",
          },
          sync_offline: {
            title: "Офлайн-синхронизация",
            description: "Запускает синхронизацию каждые шесть часов автоматически, не дожидаясь входа пользователей.",
          },
          auto_remove: {
            title: "Автоудаление",
            description: "Автоматически удаляйте пользователей из проектов, когда они больше не соответствуют группе.",
          },
          group_attribute_key: {
            title: "Ключ атрибута группы",
            description:
              "Атрибут поставщика удостоверений, используемый для идентификации и синхронизации групп пользователей.",
            placeholder: "Группы",
          },
        },
        group_mapping: {
          title: "Сопоставление групп",
          description: "Свяжите группы поставщика удостоверений с проектами и ролями.",
          button_text: "Добавить новую синхронизацию группы",
        },
        toast: {
          updating: "Обновление функции синхронизации групп",
          success: "Функция синхронизации групп успешно обновлена.",
          error: "Не удалось обновить функцию синхронизации групп!",
        },
        delete_modal: {
          title: "Удалить синхронизацию группы",
          content:
            "Новые пользователи из этой группы удостоверений больше не будут добавляться в проект. Уже добавленные пользователи сохранят свою текущую роль.",
        },
        modal: {
          idp_group_name: {
            text: "Группа пользователей",
            required: "Группа пользователей обязательна",
            placeholder: "Введите названия групп IdP",
          },
          project: {
            text: "Проект",
            required: "Проект обязателен",
            placeholder: "Выберите проект",
          },
          default_role: {
            text: "Роль проекта",
            required: "Роль проекта обязательна",
            placeholder: "Выберите роль проекта",
          },
        },
      },
      identity: {
        title: "Идентичность",
        heading: "Идентичность",
        description: "Настройте свой домен и включите единый вход",
      },
      project_states: {
        title: "Состояния проектов",
      },
      projects: {
        title: "Проекты",
        description: "Управление состояниями проектов, включение меток проектов и другие настройки.",
        tabs: {
          states: "Состояния проектов",
          labels: "Метки проектов",
        },
      },
      teamspaces: {
        title: "Командные пространства",
      },
      initiatives: {
        title: "Инициативы",
      },
      customers: {
        title: "Клиенты",
      },
      releases: {
        title: "Релизы",
        update_release: "Обновить релиз",
        create_release: "Создать релиз",
        errors: {
          release_not_found: "Релиз, который вы ищете, не существует.",
          unknown: "Что-то пошло не так. Пожалуйста, попробуйте снова.",
        },
      },

      cancel_trial: {
        title: "Сначала отмените свою пробную версию.",
        description:
          "У вас есть активная пробная версия одного из наших платных планов. Пожалуйста, отмените ее сначала, чтобы продолжить.",
        dismiss: "Закрыть",
        cancel: "Отменить пробную версию",
        cancel_success_title: "Пробная версия отменена.",
        cancel_success_message: "Теперь вы можете удалить рабочее пространство.",
        cancel_error_title: "Это не сработало.",
        cancel_error_message: "Попробуйте снова, пожалуйста.",
      },
      applications: {
        title: "Приложения",
        applicationId_copied: "ID приложения скопирован в буфер обмена",
        clientId_copied: "ID клиента скопирован в буфер обмена",
        clientSecret_copied: "Секрет клиента скопирован в буфер обмена",
        third_party_apps: "Сторонние приложения",
        your_apps: "Ваши приложения",
        connect: "Подключить",
        connected: "Подключено",
        install: "Установить",
        installed: "Установлено",
        configure: "Настроить",
        app_available: "Вы сделали это приложение доступным для использования с рабочим пространством Plane",
        app_available_description: "Подключите рабочее пространство Plane, чтобы начать использование",
        client_id_and_secret: "ID и Секрет Клиента",
        client_id_and_secret_description:
          "Скопируйте и сохраните этот секретный ключ. Вы не сможете увидеть этот ключ после нажатия Закрыть.",
        client_id_and_secret_download: "Вы можете скачать CSV с ключом отсюда.",
        application_id: "ID Приложения",
        client_id: "ID Клиента",
        client_secret: "Секрет Клиента",
        export_as_csv: "Экспорт в CSV",
        slug_already_exists: "Слаг уже существует",
        failed_to_create_application: "Не удалось создать приложение",
        upload_logo: "Загрузить Логотип",
        app_name_title: "Как вы назовете это приложение",
        app_name_error: "Название приложения обязательно",
        app_short_description_title: "Дайте краткое описание этому приложению",
        app_short_description_error: "Краткое описание приложения обязательно",
        app_description_title: {
          label: "Длинное описание",
          placeholder: "Напишите подробное описание для маркетплейса. Нажмите '/' для команд.",
        },
        authorization_grant_type: {
          title: "Тип подключения",
          description:
            "Выберите, должно ли ваше приложение быть установлено один раз для рабочего пространства или позволить каждому пользователю подключить свою учетную запись",
        },
        app_description_error: "Описание приложения обязательно",
        app_slug_title: "Слаг приложения",
        app_slug_error: "Слаг приложения обязателен",
        app_maker_title: "Создатель приложения",
        app_maker_error: "Создатель приложения обязателен",
        webhook_url_title: "URL вебхука",
        webhook_url_error: "URL вебхука обязателен",
        invalid_webhook_url_error: "Недействительный URL вебхука",
        redirect_uris_title: "URI перенаправления",
        redirect_uris_error: "URI перенаправления обязательны",
        invalid_redirect_uris_error: "Недействительные URI перенаправления",
        redirect_uris_description:
          "Введите URI через пробел, куда приложение будет перенаправлять после пользователя, например https://example.com https://example.com/",
        authorized_javascript_origins_title: "Разрешенные источники JavaScript",
        authorized_javascript_origins_error: "Разрешенные источники JavaScript обязательны",
        invalid_authorized_javascript_origins_error: "Недействительные разрешенные источники JavaScript",
        authorized_javascript_origins_description:
          "Введите источники через пробел, откуда приложение сможет делать запросы, например app.com example.com",
        create_app: "Создать приложение",
        update_app: "Обновить приложение",
        regenerate_client_secret_description:
          "Перегенерировать секрет клиента. После перегенерации вы сможете скопировать ключ или скачать его в файл CSV.",
        regenerate_client_secret: "Перегенерировать секрет клиента",
        regenerate_client_secret_confirm_title: "Вы уверены, что хотите перегенерировать секрет клиента?",
        regenerate_client_secret_confirm_description:
          "Приложение, использующее этот секрет, перестанет работать. Вам нужно будет обновить секрет в приложении.",
        regenerate_client_secret_confirm_cancel: "Отмена",
        regenerate_client_secret_confirm_regenerate: "Перегенерировать",
        read_only_access_to_workspace: "Доступ только для чтения к вашему рабочему пространству",
        write_access_to_workspace: "Доступ для записи к вашему рабочему пространству",
        read_only_access_to_user_profile: "Доступ только для чтения к вашему профилю пользователя",
        write_access_to_user_profile: "Доступ для записи к вашему профилю пользователя",
        connect_app_to_workspace: "Подключить {app} к вашему рабочему пространству {workspace}",
        user_permissions: "Разрешения пользователя",
        user_permissions_description:
          "Разрешения пользователя используются для предоставления доступа к профилю пользователя.",
        workspace_permissions: "Разрешения рабочего пространства",
        workspace_permissions_description:
          "Разрешения рабочего пространства используются для предоставления доступа к рабочему пространству.",
        with_the_permissions: "с разрешениями",
        app_consent_title: "{app} запрашивает доступ к вашему рабочему пространству и профилю Plane.",
        choose_workspace_to_connect_app_with: "Выберите рабочее пространство для подключения приложения",
        app_consent_workspace_permissions_title: "{app} хочет",
        app_consent_user_permissions_title:
          "{app} также может запросить разрешение пользователя на следующие ресурсы. Эти разрешения будут запрошены и авторизованы только пользователем.",
        app_consent_accept_title: "Принимая",
        app_consent_accept_1:
          "Вы предоставляете приложению доступ к вашим данным Plane везде, где вы можете использовать приложение внутри или вне Plane",
        app_consent_accept_2: "Вы соглашаетесь с Политикой конфиденциальности и Условиями использования {app}",
        accepting: "Принятие...",
        accept: "Принять",
        categories: "Категории",
        select_app_categories: "Выберите категории приложения",
        categories_title: "Категории",
        categories_error: "Категории обязательны",
        invalid_categories_error: "Неверные категории",
        categories_description: "Выберите категории, которые лучше всего описывают приложение",
        supported_plans: "Поддерживаемые планы",
        supported_plans_description:
          "Выберите планы рабочего пространства, которые могут установить это приложение. Оставьте пустым, чтобы разрешить все планы.",
        select_plans: "Выбрать планы",
        privacy_policy_url_title: "URL Политики конфиденциальности",
        privacy_policy_url_error: "URL Политики конфиденциальности обязателен",
        invalid_privacy_policy_url_error: "Неверный URL Политики конфиденциальности",
        terms_of_service_url_title: "URL Условий использования",
        terms_of_service_url_error: "URL Условий использования обязателен",
        invalid_terms_of_service_url_error: "Неверный URL Условий использования",
        support_url_title: "URL поддержки",
        support_url_error: "URL поддержки обязателен",
        invalid_support_url_error: "Неверный URL поддержки",
        video_url_title: "URL видео",
        video_url_error: "URL видео обязателен",
        invalid_video_url_error: "Неверный URL видео",
        setup_url_title: "URL настройки",
        setup_url_error: "URL настройки обязателен",
        invalid_setup_url_error: "Неверный URL настройки",
        configuration_url_title: "URL настройки",
        configuration_url_error: "URL настройки обязателен",
        invalid_configuration_url_error: "Неверный URL настройки",
        contact_email_title: "Email контакта",
        contact_email_error: "Email контакта обязателен",
        invalid_contact_email_error: "Неверный email контакта",
        upload_attachments: "Загрузить вложения",
        uploading_images: "Загрузка {count} изображения{count, plural, one {s} other {s}}",
        drop_images_here: "Перетащите изображения сюда",
        click_to_upload_images: "Нажмите, чтобы загрузить изображения",
        invalid_file_or_exceeds_size_limit: "Неверный файл или превышен лимит размера ({size} MB)",
        uploading: "Загрузка...",
        upload_and_save: "Загрузить и сохранить",
        app_credentials_regenrated: {
          title: "Учетные данные приложения были успешно сгенерированы заново",
          description:
            "Замените секрет клиента во всех местах, где он используется. Предыдущий секрет больше недействителен.",
        },
        app_created: {
          title: "Приложение успешно создано",
          description: "Используйте учетные данные, чтобы установить приложение в рабочее пространство Plane",
        },
        installed_apps: "Установленные приложения",
        all_apps: "Все приложения",
        internal_apps: "Внутренние приложения",
        website: {
          title: "Веб-сайт",
          description: "Ссылка на веб-сайт вашего приложения.",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "Создатель приложений",
          description: "Лицо или организация, создающая приложение.",
        },
        setup_url: {
          label: "URL настройки",
          description: "Пользователи будут перенаправлены на этот URL при установке приложения.",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "URL вебхука",
          description:
            "Здесь мы будем отправлять события вебхука и обновления из рабочих пространств, где установлено ваше приложение.",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "URI перенаправления (через пробел)",
          description: "Пользователи будут перенаправлены на этот путь после аутентификации через Plane.",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "Это приложение можно установить только после установки администратором рабочего пространства. Свяжитесь с администратором вашего рабочего пространства, чтобы продолжить.",
        enable_app_mentions: "Включить упоминания приложения",
        enable_app_mentions_tooltip:
          "Когда эта функция включена, пользователи могут упоминать или назначать рабочие элементы этому приложению.",
        scopes: "Области доступа",
        select_scopes: "Выбрать области",
        read_access_to: "Доступ только для чтения к",
        write_access_to: "Доступ на запись к",
        global_permission_expiration:
          "Глобальные области доступа скоро устареют. Используйте детализированные области. Например, используйте project:read вместо глобального чтения.",
        selected_scopes: "Выбрано: {count}",
        scopes_and_permissions: "Области и разрешения",
        read: "Чтение",
        write: "Запись",
        scope_description: {
          projects: "Доступ к проектам и всем связанным сущностям",
          wiki: "Доступ к вики и всем связанным сущностям",
          customers: "Доступ к клиентам и всем связанным сущностям",
          initiatives: "Доступ к инициативам и всем связанным сущностям",
          workspaces: "Доступ к рабочим пространствам и всем связанным сущностям",
          stickies: "Доступ к стикерам и всем связанным сущностям",
          teamspaces: "Доступ к командным пространствам и всем связанным сущностям",
          profile: "Доступ к информации профиля пользователя",
          agents: "Доступ к агентам и всем связанным с ними сущностям",
          assets: "Доступ к активам и всем связанным с ними сущностям",
        },
        build_your_own_app: "Создайте собственное приложение",
        edit_app_details: "Редактировать детали приложения",
        internal: "Внутренний",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description:
          "Смотрите, как ваша работа становится более интеллектуальной и быстрой с помощью ИИ, которая напрямую связана с вашей работой и базой знаний.",
      },
    },
    empty_state: {
      api_tokens: {
        title: "Нет API-токенов",
        description: "Используйте API Plane для интеграции с внешними системами. Создайте тоекен чтобы начать.",
      },
      webhooks: {
        title: "Нет вебхуков",
        description: "Создавайте вебхуки для автоматизации и получения уведомлений.",
      },
      exports: {
        title: "Нет экспортов",
        description: "Здесь будут сохранённые копии ваших экспортов.",
      },
      imports: {
        title: "Нет импортов",
        description: "Здесь отображаются все предыдущие импорты.",
      },
    },
  },
  profile: {
    label: "Профиль",
    page_label: "Ваша работа",
    work: "Работа",
    details: {
      joined_on: "Присоединился",
      time_zone: "Часовой пояс",
    },
    stats: {
      workload: "Нагрузка",
      overview: "Обзор",
      created: "Созданные рабочие элементы",
      assigned: "Назначенные рабочие элементы",
      subscribed: "Отслеживаемые рабочие элементы",
      state_distribution: {
        title: "Рабочие элементы по статусам",
        empty: "Создавайте рабочие элементы для анализа по статусам",
      },
      priority_distribution: {
        title: "Рабочие элементы по приоритетам",
        empty: "Создавайте рабочие элементы для анализа по приоритетам",
      },
      recent_activity: {
        title: "Недавняя активность",
        empty: "Данные не найдены",
        button: "Скачать активность",
        button_loading: "Скачивание",
      },
    },
    actions: {
      profile: "Профиль",
      security: "Безопасность",
      activity: "Активность",
      appearance: "Внешний вид",
      notifications: "Уведомления",
      connections: "Соединения",
    },
    tabs: {
      summary: "Сводка",
      assigned: "Назначенные",
      created: "Созданные",
      subscribed: "Отслеживаемые",
      activity: "Активность",
    },
    empty_state: {
      activity: {
        title: "Нет активности",
        description:
          "Создайте первый рабочий элемент для начала работы! Добавьте детали и свойства рабочего элемента. Исследуйте больше в Plane, чтобы увидеть вашу активность.",
      },
      assigned: {
        title: "Нет назначенных рабочих элементов",
        description: "Здесь отображаются рабочие элементы, назначенные вам.",
      },
      created: {
        title: "Нет созданных рабочих элементов",
        description: "Все созданные вами рабочие элементы отображаются здесь.",
      },
      subscribed: {
        title: "Нет отслеживаемых рабочих элементов",
        description: "Подпишитесь на интересующие рабочие элементы.",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "Введите ID проекта",
      please_select_a_timezone: "Выберите часовой пояс",
      archive_project: {
        title: "Архивировать проект",
        description:
          "Проект исчезнет из бокового меню, но останется доступным на странице проектов. Можно восстановить или удалить позже.",
        button: "Архивировать",
      },
      delete_project: {
        title: "Удалить проект",
        description: "Все данные проекта будут безвозвратно удалены без возможности восстановления.",
        button: "Удалить проект",
      },
      toast: {
        success: "Проект обновлён",
        error: "Ошибка обновления. Попробуйте снова.",
      },
    },
    members: {
      label: "Участники",
      project_lead: "Руководитель проекта",
      default_assignee: "Ответственный по умолчанию",
      guest_super_permissions: {
        title: "Дать гостям доступ на просмотр всех рабочих элементов:",
        sub_heading: "Гости смогут просматривать все рабочие элементы проекта",
      },
      invite_members: {
        title: "Пригласить участников",
        sub_heading: "Пригласите коллег для работы над проектом.",
        select_co_worker: "Выберите сотрудника",
      },
      project_lead_description: "Выберите руководителя проекта.",
      default_assignee_description: "Выберите исполнителя по умолчанию для проекта.",
      project_subscribers: "Подписчики проекта",
      project_subscribers_description: "Выберите участников, которые будут получать уведомления по этому проекту.",
    },
    states: {
      describe_this_state_for_your_members: "Опишите этот статус для участников",
      empty_state: {
        title: "Нет статусов для группы {groupKey}",
        description: "Создайте новый статус",
      },
    },
    labels: {
      label_title: "Название метки",
      label_title_is_required: "Название обязательно",
      label_max_char: "Максимальная длина названия - 255 символов",
      toast: {
        error: "Ошибка обновления метки",
      },
    },
    estimates: {
      label: "Оценки",
      title: "Включить оценки для моего проекта",
      description: "Они помогают вам в общении о сложности и рабочей нагрузке команды.",
      no_estimate: "Без оценки",
      new: "Новая система оценок",
      create: {
        custom: "Пользовательская",
        start_from_scratch: "Начать с нуля",
        choose_template: "Выбрать шаблон",
        choose_estimate_system: "Выбрать систему оценок",
        enter_estimate_point: "Ввести оценку",
        step: "Шаг {step} из {total}",
        label: "Создать оценку",
      },
      toasts: {
        created: {
          success: {
            title: "Оценка создана",
            message: "Оценка успешно создана",
          },
          error: {
            title: "Ошибка создания оценки",
            message: "Не удалось создать новую оценку, пожалуйста, попробуйте снова.",
          },
        },
        updated: {
          success: {
            title: "Оценка изменена",
            message: "Оценка обновлена в вашем проекте.",
          },
          error: {
            title: "Ошибка изменения оценки",
            message: "Не удалось изменить оценку, пожалуйста, попробуйте снова",
          },
        },
        enabled: {
          success: {
            title: "Успех!",
            message: "Оценки включены.",
          },
        },
        disabled: {
          success: {
            title: "Успех!",
            message: "Оценки отключены.",
          },
          error: {
            title: "Ошибка!",
            message: "Не удалось отключить оценки. Пожалуйста, попробуйте снова",
          },
        },
        reorder: {
          success: {
            title: "Оценки переупорядочены",
            message: "Оценки были переупорядочены в вашем проекте.",
          },
          error: {
            title: "Не удалось переупорядочить оценки",
            message: "Мы не смогли переупорядочить оценки, пожалуйста, попробуйте снова",
          },
        },
      },
      validation: {
        min_length: "Оценка должна быть больше 0.",
        unable_to_process: "Не удалось обработать ваш запрос, пожалуйста, попробуйте снова.",
        numeric: "Оценка должна быть числовым значением.",
        character: "Оценка должна быть символьным значением.",
        empty: "Значение оценки не может быть пустым.",
        already_exists: "Значение оценки уже существует.",
        unsaved_changes: "У вас есть несохраненные изменения. Пожалуйста, сохраните их перед нажатием на готово",
        remove_empty:
          "Оценка не может быть пустой. Введите значение в каждое поле или удалите те, для которых у вас нет значений.",
        fill: "Пожалуйста, заполните это поле оценки",
        repeat: "Значение оценки не может повторяться",
      },
      systems: {
        points: {
          label: "Баллы",
          fibonacci: "Фибоначчи",
          linear: "Линейная",
          squares: "Квадраты",
          custom: "Пользовательская",
        },
        categories: {
          label: "Категории",
          t_shirt_sizes: "Размеры футболок",
          easy_to_hard: "От простого к сложному",
          custom: "Пользовательская",
        },
        time: {
          label: "Время",
          hours: "Часы",
        },
      },
      edit: {
        title: "Редактировать систему оценок",
        add_or_update: {
          title: "Добавить, обновить или удалить оценки",
          description: "Управляйте текущей системой, добавляя, обновляя или удаляя баллы или категории.",
        },
        switch: {
          title: "Изменить тип оценки",
          description: "Преобразуйте вашу систему баллов в систему категорий и наоборот.",
        },
      },
      switch: "Переключить систему оценок",
      current: "Текущая система оценок",
      select: "Выберите систему оценок",
    },
    automations: {
      label: "Автоматизация",
      "auto-archive": {
        title: "Автоархивация закрытых рабочих элементов",
        description: "Plane будет автоматически архивировать рабочие элементы, которые были завершены или отменены.",
        duration: "Автоархивация рабочих элементов, которые закрыты в течение",
      },
      "auto-close": {
        title: "Автоматическое закрытие рабочих элементов",
        description: "Plane будет автоматически закрывать рабочие элементы, которые не были завершены или отменены.",
        duration: "Автоматическое закрытие рабочих элементов, которые неактивны в течение",
        auto_close_status: "Статус автоматического закрытия",
      },
      "auto-remind": {
        title: "Автоматические напоминания",
        description:
          "Plane автоматически будет отправлять напоминания через email и в приложении, чтобы ваша команда оставалась на пути к срокам.",
        duration: "Отправить напоминание заранее",
      },
    },
    empty_state: {
      labels: {
        title: "Нет меток",
        description: "Создайте метки для организации и фильтрации рабочих элементов в вашем проекте.",
      },
      estimates: {
        title: "Нет систем оценок",
        description: "Создайте набор оценок для передачи объема работы на каждый рабочий элемент.",
        primary_button: "Добавить систему оценок",
      },
      integrations: {
        title: "Интеграции не настроены",
        description: "Настройте GitHub и другие интеграции для синхронизации ваших рабочих элементов проекта.",
      },
    },
    initiatives: {
      heading: "Инициативы",
      sub_heading: "Разблокируйте высший уровень организации для всей вашей работы в Plane.",
      title: "Включить инициативы",
      description: "Установите более крупные цели для мониторинга прогресса",
      toast: {
        updating: "Обновление функции инициатив",
        enable_success: "Функция инициатив успешно включена.",
        disable_success: "Функция инициатив успешно отключена.",
        error: "Не удалось обновить функцию инициатив!",
      },
    },
    customers: {
      heading: "Клиенты",
      settings_heading: "Управляйте работой с учетом того, что важно для ваших клиентов.",
      settings_sub_heading:
        "Преобразуйте запросы клиентов в рабочие элементы, назначайте приоритеты в соответствии с запросами и связывайте статусы рабочих элементов с записями клиентов. Вскоре вы сможете интегрировать вашу CRM или инструмент поддержки для еще более эффективного управления работой по атрибутам клиентов.",
    },
    epics: {
      properties: {
        title: "Свойства",
        description: "Добавьте пользовательские свойства к вашей эпопее.",
      },
      disabled: "Отключено",
    },
    cycles: {
      auto_schedule: {
        heading: "Автоматическое планирование циклов",
        description: "Поддерживайте движение циклов без ручной настройки.",
        tooltip: "Автоматически создавайте новые циклы на основе выбранного расписания.",
        edit_button: "Редактировать",
        form: {
          cycle_title: {
            label: "Название цикла",
            placeholder: "Название",
            tooltip: "К названию будут добавлены номера для последующих циклов. Например: Дизайн - 1/2/3",
            validation: {
              required: "Название цикла обязательно",
              max_length: "Название не должно превышать 255 символов",
            },
          },
          cycle_duration: {
            label: "Длительность цикла",
            unit: "Недели",
            validation: {
              required: "Длительность цикла обязательна",
              min: "Длительность цикла должна быть не менее 1 недели",
              max: "Длительность цикла не может превышать 30 недель",
              positive: "Длительность цикла должна быть положительной",
            },
          },
          cooldown_period: {
            label: "Период охлаждения",
            unit: "дни",
            tooltip: "Пауза между циклами перед началом следующего.",
            validation: {
              required: "Период охлаждения обязателен",
              negative: "Период охлаждения не может быть отрицательным",
            },
          },
          start_date: {
            label: "День начала цикла",
            validation: {
              required: "Дата начала обязательна",
              past: "Дата начала не может быть в прошлом",
            },
          },
          number_of_cycles: {
            label: "Количество будущих циклов",
            validation: {
              required: "Количество циклов обязательно",
              min: "Требуется не менее 1 цикла",
              max: "Невозможно запланировать более 3 циклов",
            },
          },
          auto_rollover: {
            label: "Автоматический перенос рабочих элементов",
            tooltip: "В день завершения цикла переместить все незавершенные рабочие элементы в следующий цикл.",
          },
        },
        toast: {
          toggle: {
            loading_enable: "Включение автоматического планирования циклов",
            loading_disable: "Отключение автоматического планирования циклов",
            success: {
              title: "Успешно!",
              message: "Автоматическое планирование циклов успешно переключено.",
            },
            error: {
              title: "Ошибка!",
              message: "Не удалось переключить автоматическое планирование циклов.",
            },
          },
          save: {
            loading: "Сохранение конфигурации автоматического планирования циклов",
            success: {
              title: "Успешно!",
              message_create: "Конфигурация автоматического планирования циклов успешно сохранена.",
              message_update: "Конфигурация автоматического планирования циклов успешно обновлена.",
            },
            error: {
              title: "Ошибка!",
              message_create: "Не удалось сохранить конфигурацию автоматического планирования циклов.",
              message_update: "Не удалось обновить конфигурацию автоматического планирования циклов.",
            },
          },
        },
      },
    },
    features: {
      cycles: {
        title: "Циклы",
        short_title: "Циклы",
        description:
          "Планируйте работу в гибких периодах, которые адаптируются к уникальному ритму и темпу этого проекта.",
        toggle_title: "Включить циклы",
        toggle_description: "Планируйте работу в целенаправленные периоды времени.",
      },
      modules: {
        title: "Модули",
        short_title: "Модули",
        description: "Организуйте работу в подпроекты с выделенными руководителями и исполнителями.",
        toggle_title: "Включить модули",
        toggle_description: "Участники проекта смогут создавать и редактировать модули.",
      },
      views: {
        title: "Представления",
        short_title: "Представления",
        description:
          "Сохраняйте пользовательские сортировки, фильтры и параметры отображения или делитесь ими с командой.",
        toggle_title: "Включить представления",
        toggle_description: "Участники проекта смогут создавать и редактировать представления.",
      },
      pages: {
        title: "Страницы",
        short_title: "Страницы",
        description: "Создавайте и редактируйте свободный контент: заметки, документы, что угодно.",
        toggle_title: "Включить страницы",
        toggle_description: "Участники проекта смогут создавать и редактировать страницы.",
      },
      intake: {
        intake_responsibility: "Ответственность за прием",
        intake_sources: "Источники приёма",
        title: "Приём",
        short_title: "Приём",
        description:
          "Позвольте не-участникам делиться ошибками, отзывами и предложениями; не нарушая ваш рабочий процесс.",
        toggle_title: "Включить приём",
        toggle_description: "Разрешить участникам проекта создавать запросы на приём в приложении.",
        toggle_tooltip_on: "Попросите администратора проекта включить.",
        toggle_tooltip_off: "Попросите администратора проекта выключить.",
        notify_assignee: {
          title: "Уведомить ответственных",
          description: "Для нового запроса на прием ответственные по умолчанию будут уведомлены через уведомления",
        },
        in_app: {
          title: "В приложении",
          description:
            "Получайте новые рабочие элементы от участников и гостей рабочего пространства без нарушения существующих.",
        },
        email: {
          title: "Электронная почта",
          description: "Собирайте новые рабочие элементы от всех, кто отправляет письмо на адрес Plane.",
          fieldName: "ID электронной почты",
        },
        form: {
          title: "Формы",
          description:
            "Позвольте людям вне рабочего пространства создавать потенциальные новые рабочие элементы через выделенную и безопасную форму.",
          fieldName: "URL формы по умолчанию",
          create_forms: "Создавайте формы с типами рабочих элементов",
          manage_forms: "Управление формами",
          manage_forms_tooltip: "Попросите администратора рабочего пространства управлять.",
          create_form: "Создать форму",
          edit_form: "Редактировать детали формы",
          form_title: "Название формы",
          form_title_required: "Название формы обязательно",
          work_item_type: "Тип рабочего элемента",
          remove_property: "Удалить свойство",
          select_properties: "Выбрать свойства",
          search_placeholder: "Поиск свойств",
          toasts: {
            success_create: "Форма приёма успешно создана",
            success_update: "Форма приёма успешно обновлена",
            error_create: "Не удалось создать форму приёма",
            error_update: "Не удалось обновить форму приёма",
          },
        },
        toasts: {
          set: {
            loading: "Установка ответственных...",
            success: {
              title: "Успех!",
              message: "Ответственные успешно установлены.",
            },
            error: {
              title: "Ошибка!",
              message: "Что-то пошло не так при установке ответственных. Пожалуйста, попробуйте снова.",
            },
          },
        },
      },
      time_tracking: {
        title: "Отслеживание времени",
        short_title: "Отслеживание времени",
        description: "Записывайте время, затраченное на рабочие элементы и проекты.",
        toggle_title: "Включить отслеживание времени",
        toggle_description: "Участники проекта смогут записывать отработанное время.",
      },
      milestones: {
        title: "Вехи",
        short_title: "Вехи",
        description: "Вехи обеспечивают уровень для выравнивания рабочих элементов к общим датам завершения.",
        toggle_title: "Включить вехи",
        toggle_description: "Организуйте рабочие элементы по срокам вех.",
      },
      toasts: {
        loading: "Обновление функции проекта...",
        success: "Функция проекта успешно обновлена.",
        error: "Что-то пошло не так при обновлении функции проекта. Пожалуйста, попробуйте снова.",
      },
    },
  },
  project_cycles: {
    add_cycle: "Добавить цикл",
    more_details: "Подробнее",
    cycle: "Цикл",
    update_cycle: "Обновить цикл",
    create_cycle: "Создать цикл",
    no_matching_cycles: "Нет подходящих циклов",
    remove_filters_to_see_all_cycles: "Снимите фильтры для просмотра всех циклов",
    remove_search_criteria_to_see_all_cycles: "Очистите поиск для просмотра всех циклов",
    only_completed_cycles_can_be_archived: "Только завершённые циклы можно архивировать",
    start_date: "Дата начала",
    end_date: "Дата окончания",
    in_your_timezone: "В вашем часовом поясе",
    transfer_work_items: "Перенести {count} рабочих элементов",
    transfer: {
      no_cycles_available: "Нет других циклов для переноса рабочих элементов.",
    },
    date_range: "Диапазон дат",
    add_date: "Добавить дату",
    active_cycle: {
      label: "Активный цикл",
      progress: "Прогресс",
      chart: "Диаграмма сгорания",
      priority_issue: "Приоритетные рабочие элементы",
      assignees: "Ответственные",
      issue_burndown: "Выгорание рабочих элементов",
      ideal: "Идеальный",
      current: "Текущий",
      labels: "Метки",
      trailing: "Отставание",
      leading: "Опережение",
    },
    upcoming_cycle: {
      label: "Предстоящий цикл",
    },
    completed_cycle: {
      label: "Завершённый цикл",
    },
    status: {
      days_left: "Дней осталось",
      completed: "Завершено",
      yet_to_start: "Ещё не начато",
      in_progress: "В процессе",
      draft: "Черновик",
    },
    action: {
      restore: {
        title: "Восстановить цикл",
        success: {
          title: "Цикл восстановлен",
          description: "Цикл успешно восстановлен",
        },
        failed: {
          title: "Ошибка восстановления",
          description: "Не удалось восстановить цикл",
        },
      },
      favorite: {
        loading: "Добавление в избранное",
        success: {
          description: "Цикл добавлен в избранное",
          title: "Успех!",
        },
        failed: {
          description: "Ошибка добавления в избранное",
          title: "Ошибка!",
        },
      },
      unfavorite: {
        loading: "Удаление из избранного",
        success: {
          description: "Цикл удалён из избранного",
          title: "Успех!",
        },
        failed: {
          description: "Ошибка удаления цикла из избранного. Попробуйте снова.",
          title: "Ошибка!",
        },
      },
      update: {
        loading: "Обновление цикла",
        success: {
          description: "Цикл успешно обновлён",
          title: "Успех!",
        },
        failed: {
          description: "Ошибка обновления цикла. Попробуйте снова.",
          title: "Ошибка!",
        },
        error: {
          already_exists: "Цикл на указанные даты уже существует. Для создания черновика удалите даты.",
        },
      },
    },
    empty_state: {
      general: {
        title: "Организуйте работу в циклах",
        description: "Разбивайте работу на временные интервалы, устанавливайте сроки и отслеживайте прогресс команды.",
        primary_button: {
          text: "Создать первый цикл",
          comic: {
            title: "Циклы - повторяющиеся временные интервалы",
            description: "Спринт, итерация или любой другой термин для еженедельного/двухнедельного планирования.",
          },
        },
      },
      no_issues: {
        title: "Нет рабочих элементов в цикле",
        description: "Добавьте существующие или создайте новые рабочие элементы для этого цикла",
        primary_button: {
          text: "Создать рабочий элемент",
        },
        secondary_button: {
          text: "Добавить существующий рабочий элемент",
        },
      },
      completed_no_issues: {
        title: "Нет рабочих элементов в цикле",
        description:
          "Нет рабочих элементов. Рабочие элементы были перенесены или скрыты. Для просмотра измените настройки отображения.",
      },
      active: {
        title: "Нет активных циклов",
        description: "Активный цикл включает текущую дату. Здесь отображается прогресс активного цикла.",
      },
      archived: {
        title: "Нет архивных циклов",
        description: "Архивируйте завершённые циклы для упорядочивания проекта.",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "Создайте рабочий элемент и назначьте исполнителя",
        description:
          "Рабочие элементы помогают организовать работу команды. Создавайте, назначайте и завершайте рабочие элементы для достижения целей проекта.",
        primary_button: {
          text: "Создать первый рабочий элемент",
          comic: {
            title: "Рабочие элементы - строительные блоки Plane",
            description:
              "Примеры рабочих элементов: редизайн интерфейса, ребрендинг компании или запуск новой системы.",
          },
        },
      },
      no_archived_issues: {
        title: "Нет архивных рабочих элементов",
        description: "Архивируйте завершённые или отменённые рабочие элементы вручную или автоматически.",
        primary_button: {
          text: "Настроить автоматизацию",
        },
      },
      issues_empty_filter: {
        title: "Нет рабочих элементов подходящих фильтрам",
        secondary_button: {
          text: "Сбросить фильтры",
        },
      },
    },
  },
  project_module: {
    add_module: "Добавить модуль",
    update_module: "Обновить модуль",
    create_module: "Создать модуль",
    archive_module: "Архивировать модуль",
    restore_module: "Восстановить модуль",
    delete_module: "Удалить модуль",
    empty_state: {
      general: {
        title: "Связывайте этапы проекта с модулями для удобного отслеживания рабочих элементов.",
        description:
          "Модуль объединяет рабочие элементы по логическому или иерархическому признаку. Используйте модули для контроля этапов проекта. Каждый модуль имеет собственные сроки выполнения и аналитику для отслеживания прогресса.",
        primary_button: {
          text: "Создать первый модуль",
          comic: {
            title: "Модули группируют рабочие элементы по иерархии",
            description: "Примеры группировки: модуль корзины, модуль шасси или модуль склада.",
          },
        },
      },
      no_issues: {
        title: "Нет рабочих элементов в модуле",
        description: "Создавайте или добавляйте рабочие элементы, которые хотите выполнить в рамках этого модуля",
        primary_button: {
          text: "Создать новые рабочие элементы",
        },
        secondary_button: {
          text: "Добавить существующий рабочий элемент",
        },
      },
      archived: {
        title: "Нет архивных модулей",
        description:
          "Архивируйте завершённые или отменённые модули для упорядочивания проекта. Они появятся здесь после архивации.",
      },
      sidebar: {
        in_active: "Этот модуль ещё не активен.",
        invalid_date: "Некорректная дата. Укажите правильную дату.",
      },
    },
    quick_actions: {
      archive_module: "Архивировать модуль",
      archive_module_description: `Только завершённые или отменённые
модули можно архивировать.`,
      delete_module: "Удалить модуль",
    },
    toast: {
      copy: {
        success: "Ссылка на модуль скопирована в буфер обмена",
      },
      delete: {
        success: "Модуль успешно удалён",
        error: "Ошибка удаления модуля",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "Сохраняйте фильтры в виде представлений. Создавайте неограниченное количество вариантов",
        description:
          "Представления - это сохранённые наборы фильтров для быстрого доступа. Все участники проекта видят созданные представления и могут выбирать подходящие.",
        primary_button: {
          text: "Создать первое представление",
          comic: {
            title: "Представления работают на основе свойств рабочих элементов",
            description: "Создавайте представления с любым количеством свойств в качестве фильтров.",
          },
        },
      },
      filter: {
        title: "Подходящих представлений не найдено",
        description: `Нет представлений, соответствующих критериям поиска.
 Создайте новое представление.`,
      },
    },
    delete_view: {
      title: "Вы уверены, что хотите удалить это представление?",
      content:
        "При подтверждении все параметры сортировки, фильтрации и отображения + макет, выбранный для этого представления, будут безвозвратно удалены без возможности восстановления.",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title: "Создавайте заметки, документы или базу знаний. Используйте Galileo, ИИ-помощник Plane.",
        description:
          "Страницы - пространство для организации мыслей в Plane. Делайте заметки, форматируйте текст, встраивайте рабочие элементы, используйте компоненты. Для быстрого создания документов используйте Galileo через горячие клавиши или кнопку.",
        primary_button: {
          text: "Создать первую страницу",
        },
      },
      private: {
        title: "Нет приватных страниц",
        description: "Храните личные заметки здесь. Когда будете готовы поделиться, команда будет в одном клике.",
        primary_button: {
          text: "Создать первую страницу",
        },
      },
      public: {
        title: "Нет публичных страниц",
        description: "Здесь отображаются страницы, доступные всем участникам проекта.",
        primary_button: {
          text: "Создать первую страницу",
        },
      },
      archived: {
        title: "Нет архивных страниц",
        description: "Архивируйте неактуальные страницы. При необходимости вы найдете их здесь.",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "Ничего не найдено",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "Не найдено подходящих рабочих элементов",
      },
      no_issues: {
        title: "Рабочие элементы не найдены",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "Комментариев пока нет",
        description: "Используйте комментарии для обсуждения и отслеживания задач",
      },
    },
  },
  notification: {
    label: "Входящие",
    page_label: "{workspace} - Входящие",
    options: {
      mark_all_as_read: "Пометить все как прочитанные",
      mark_read: "Пометить как прочитанное",
      mark_unread: "Пометить как непрочитанное",
      refresh: "Обновить",
      filters: "Фильтры входящих",
      show_unread: "Показать непрочитанные",
      show_snoozed: "Показать отложенные",
      show_archived: "Показать архивные",
      mark_archive: "Архивировать",
      mark_unarchive: "Разархивировать",
      mark_snooze: "Отложить",
      mark_unsnooze: "Возобновить",
    },
    toasts: {
      read: "Уведомление помечено как прочитанное",
      unread: "Уведомление помечено как непрочитанное",
      archived: "Уведомление архивировано",
      unarchived: "Уведомление разархивировано",
      snoozed: "Уведомление отложено",
      unsnoozed: "Уведомление возобновлено",
    },
    empty_state: {
      detail: {
        title: "Выберите для просмотра деталей",
      },
      all: {
        title: "Нет назначенных рабочих элементов",
        description: `Обновления по назначенным вам рабочим элементам будут
 отображаться здесь`,
      },
      mentions: {
        title: "Нет упомянутых рабочих элементов",
        description: `Обновления по рабочим элементам, где вас упомянули,
 будут отображаться здесь`,
      },
    },
    tabs: {
      all: "Все",
      mentions: "Упоминания",
    },
    filter: {
      assigned: "Назначенные мне",
      created: "Созданные мной",
      subscribed: "Отслеживаемые мной",
    },
    snooze: {
      "1_day": "1 день",
      "3_days": "3 дня",
      "5_days": "5 дней",
      "1_week": "1 неделя",
      "2_weeks": "2 недели",
      custom: "Другое",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "Добавьте рабочие элементы в цикл, чтобы отслеживать прогресс",
      },
      chart: {
        title: "Добавьте рабочие элементы в цикл для построения графика выполнения",
      },
      priority_issue: {
        title: "Просматривайте рабочие элементы с высоким приоритетом в цикле",
      },
      assignee: {
        title: "Назначьте ответственных, чтобы видеть распределение рабочих элементов",
      },
      label: {
        title: "Добавьте метки, чтобы видеть распределение рабочих элементов по категориям",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "Функция 'Входящие' отключена для проекта",
        description:
          "Входящие помогают управлять запросами и добавлять их в рабочий процесс. Включите функцию в настройках проекта.",
        primary_button: {
          text: "Управление функциями",
        },
      },
      cycle: {
        title: "Циклы отключены для этого проекта",
        description:
          "Разбивайте работу на временные интервалы, устанавливайте сроки и отслеживайте прогресс команды. Включите функцию циклов в настройках проекта.",
        primary_button: {
          text: "Управление функциями",
        },
      },
      module: {
        title: "Модули отключены для проекта",
        description: "Модули - основные компоненты вашего проекта. Включите их в настройках проекта.",
        primary_button: {
          text: "Управление функциями",
        },
      },
      page: {
        title: "Страницы отключены для проекта",
        description: "Страницы - основные компоненты вашего проекта. Включите их в настройках проекта.",
        primary_button: {
          text: "Управление функциями",
        },
      },
      view: {
        title: "Представления отключены для проекта",
        description: "Представления - основные компоненты вашего проекта. Включите их в настройках проекта.",
        primary_button: {
          text: "Управление функциями",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "Создать черновик рабочего элемента",
    empty_state: {
      title: "Черновики рабочих элементов, а вскоре и комментарии, будут отображаться здесь.",
      description:
        "Чтобы попробовать, начните добавлять рабочий элемент и прервитесь на полпути или создайте первый черновик ниже. 😉",
      primary_button: {
        text: "Создать первый черновик",
      },
    },
    delete_modal: {
      title: "Удалить черновик",
      description: "Вы уверены, что хотите удалить этот черновик? Это действие нельзя отменить.",
    },
    toasts: {
      created: {
        success: "Черновик создан",
        error: "Не удалось создать рабочий элемент. Попробуйте снова.",
      },
      deleted: {
        success: "Черновик удалён",
      },
    },
  },
  stickies: {
    title: "Ваши стикеры",
    placeholder: "нажмите, чтобы написать",
    all: "Все стикеры",
    "no-data": "Запишите идею, зафиксируйте озарение или сохраните мысль. Создайте стикер, чтобы начать.",
    add: "Добавить стикер",
    search_placeholder: "Поиск по названию",
    delete: "Удалить стикер",
    delete_confirmation: "Вы уверены, что хотите удалить этот стикер?",
    empty_state: {
      simple: "Запишите идею, зафиксируйте озарение или сохраните мысль. Создайте стикер, чтобы начать.",
      general: {
        title: "Стикеры - это быстрые заметки и рабочие элементы, которые вы создаёте на лету.",
        description:
          "Легко фиксируйте свои мысли и идеи с помощью стикеров, которые доступны в любое время и в любом месте.",
        primary_button: {
          text: "Добавить стикер",
        },
      },
      search: {
        title: "Ничего не найдено.",
        description: `Попробуйте другой запрос или сообщите нам,
если уверены в правильности поиска.`,
        primary_button: {
          text: "Добавить стикер",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "Название стикера не может быть длиннее 100 символов.",
        already_exists: "Стикер без описания уже существует",
      },
      created: {
        title: "Стикер создан",
        message: "Стикер успешно создан",
      },
      not_created: {
        title: "Ошибка создания стикера",
        message: "Не удалось создать стикер",
      },
      updated: {
        title: "Стикер обновлён",
        message: "Стикер успешно обновлён",
      },
      not_updated: {
        title: "Ошибка обновления",
        message: "Не удалось обновить стикер",
      },
      removed: {
        title: "Стикер удалён",
        message: "Стикер успешно удалён",
      },
      not_removed: {
        title: "Ошибка удаления",
        message: "Не удалось удалить стикер",
      },
    },
  },
  role_details: {
    guest: {
      title: "Гость",
      description: "Внешние участники организаций могут быть приглашены как гости.",
    },
    member: {
      title: "Участник",
      description: "Чтение, создание, редактирование и удаление элементов внутри проектов, циклов и модулей",
    },
    admin: {
      title: "Администратор",
      description: "Полные права доступа в рамках рабочего пространства.",
    },
  },
  user_roles: {
    product_or_project_manager: "Продукт / Проект менеджер",
    development_or_engineering: "Разработка / Инжиниринг",
    founder_or_executive: "Основатель / Руководитель",
    freelancer_or_consultant: "Фрилансер / Консультант",
    marketing_or_growth: "Маркетинг / Рост",
    sales_or_business_development: "Продажи / Развитие бизнеса",
    support_or_operations: "Поддержка / Операции",
    student_or_professor: "Студент / Преподаватель",
    human_resources: "HR / Кадры",
    other: "Другое",
  },
  importer: {
    github: {
      title: "GitHub",
      description: "Импорт рабочих элементов из репозиториев GitHub с синхронизацией.",
    },
    jira: {
      title: "Jira",
      description: "Импорт рабочих элементов и эпиков из проектов Jira.",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "Экспорт рабочих элементов в CSV-файл.",
      short_description: "Экспорт в csv",
    },
    excel: {
      title: "Excel",
      description: "Экспорт рабочих элементов в файл Excel.",
      short_description: "Экспорт в excel",
    },
    xlsx: {
      title: "Excel",
      description: "Экспорт рабочих элементов в файл Excel.",
      short_description: "Экспорт в excel",
    },
    json: {
      title: "JSON",
      description: "Экспорт рабочих элементов в JSON-файл.",
      short_description: "Экспорт в json",
    },
  },
  default_global_view: {
    all_issues: "Все рабочие элементы",
    assigned: "Назначенные",
    created: "Созданные",
    subscribed: "Подписанные",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "Системные настройки",
      },
      light: {
        label: "Светлая",
      },
      dark: {
        label: "Тёмная",
      },
      light_contrast: {
        label: "Светлая высококонтрастностная",
      },
      dark_contrast: {
        label: "Тёмная высокая контрастность",
      },
      custom: {
        label: "Пользовательская тема",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "Бэклог",
      planned: "Запланировано",
      in_progress: "В процессе",
      paused: "Приостановлено",
      completed: "Завершено",
      cancelled: "Отменено",
    },
    layout: {
      list: "Список",
      board: "Галерея",
      timeline: "Хронология",
    },
    order_by: {
      name: "Название",
      progress: "Прогресс",
      issues: "Количество рабочих элементов",
      due_date: "Срок выполнения",
      created_at: "Дата создания",
      manual: "Вручную",
    },
  },
  cycle: {
    label: "{count, plural, one {Цикл} other {Циклы}}",
    no_cycle: "Нет цикла",
  },
  module: {
    label: "{count, plural, one {Модуль} other {Модули}}",
    no_module: "Нет модуля",
  },
  description_versions: {
    last_edited_by: "Последнее редактирование",
    previously_edited_by: "Ранее отредактировано",
    edited_by: "Отредактировано",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane не запустился. Это может быть из-за того, что один или несколько сервисов Plane не смогли запуститься.",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "Выберите View Logs из setup.sh и логов Docker, чтобы убедиться.",
  },
  no_of: "Количество {entity}",
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "Структура",
        empty_state: {
          title: "Отсутствуют заголовки",
          description: "Давайте добавим несколько заголовков на эту страницу, чтобы увидеть их здесь.",
        },
      },
      info: {
        label: "Информация",
        document_info: {
          words: "Слова",
          characters: "Символы",
          paragraphs: "Абзацы",
          read_time: "Время чтения",
        },
        actors_info: {
          edited_by: "Отредактировано",
          created_by: "Создано",
        },
        version_history: {
          label: "История версий",
          current_version: "Текущая версия",
          highlight_changes: "Выделить изменения",
        },
      },
      assets: {
        label: "Ресурсы",
        download_button: "Скачать",
        empty_state: {
          title: "Отсутствуют изображения",
          description: "Добавьте изображения, чтобы увидеть их здесь.",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "Название стикера не может быть длиннее 100 символов.",
        already_exists: "Стикер без описания уже существует",
      },
      created: {
        title: "Стикер создан",
        message: "Стикер успешно создан",
      },
      not_created: {
        title: "Ошибка создания стикера",
        message: "Не удалось создать стикер",
      },
      updated: {
        title: "Стикер обновлён",
        message: "Стикер успешно обновлён",
      },
      not_updated: {
        title: "Ошибка обновления",
        message: "Не удалось обновить стикер",
      },
      removed: {
        title: "Стикер удалён",
        message: "Стикер успешно удалён",
      },
      not_removed: {
        title: "Ошибка удаления",
        message: "Не удалось удалить стикер",
      },
    },
    open_button: "Открыть панель навигации",
    close_button: "Закрыть панель навигации",
    outline_floating_button: "Открыть структуру",
  },
  workspace_dashboards: "Дашборды",
  pi_chat: "AI Чат",
  in_app: "В приложении",
  forms: "Формы",
  choose_workspace_for_integration: "Выберите рабочее пространство для подключения этого приложения",
  integrations_description:
    "Приложения, которые работают с Plane, должны быть подключены к рабочему пространству, где вы являетесь администратором.",
  create_a_new_workspace: "Создать новое рабочее пространство",
  learn_more_about_workspaces: "Узнать больше о рабочих пространствах",
  no_workspaces_to_connect: "Нет рабочих пространств для подключения",
  no_workspaces_to_connect_description: "Вы должны создать рабочее пространство, чтобы подключить интеграции и шаблоны",
  updates: {
    add_update: "Добавить обновление",
    add_update_placeholder: "Введите ваше обновление здесь",
    create: {
      success: {
        title: "Обновление создано",
        message: "Обновление успешно создано.",
      },
      error: {
        title: "Не удалось создать обновление",
        message: "Не удалось создать обновление. Пожалуйста, попробуйте снова.",
      },
    },
    update: {
      success: {
        title: "Обновление обновлено",
        message: "Обновление успешно обновлено.",
      },
      error: {
        title: "Не удалось обновить обновление",
        message: "Не удалось обновить обновление. Пожалуйста, попробуйте снова.",
      },
    },
    empty: {
      title: "Еще нет обновлений",
      description: "Вы можете здесь просматривать обновления.",
    },
    delete: {
      title: "Удалить обновление",
      confirmation: "Вы уверены, что хотите удалить это обновление? Это действие нельзя отменить.",
      success: {
        title: "Обновление удалено",
        message: "Обновление успешно удалено.",
      },
      error: {
        title: "Не удалось удалить обновление",
        message: "Не удалось удалить обновление. Пожалуйста, попробуйте снова.",
      },
    },
    reaction: {
      create: {
        success: {
          title: "Реакция создана",
          message: "Реакция успешно создана.",
        },
        error: {
          title: "Не удалось создать реакцию",
          message: "Не удалось создать реакцию. Пожалуйста, попробуйте снова.",
        },
      },
      delete: {
        success: {
          title: "Реакция удалена",
          message: "Реакция успешно удалена.",
        },
        error: {
          title: "Не удалось удалить реакцию",
          message: "Не удалось удалить реакцию. Пожалуйста, попробуйте снова.",
        },
      },
    },
  },
  teamspaces: {
    label: "Командные пространства",
    empty_state: {
      general: {
        title: "Командные пространства открывают лучшую организацию и отслеживание в Plane.",
        description:
          "Создайте выделенную поверхность для каждой реальной команды, отделенной от всех других рабочих поверхностей в Plane, и настройте их в соответствии с тем, как работает ваша команда.",
        primary_button: {
          text: "Создать новое командное пространство",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "Вы еще не связали ни одного командного пространства.",
          description: "Владельцы командного пространства и проекта могут управлять доступом к проектам.",
        },
      },
      primary_button: {
        text: "Связать командное пространство",
      },
      secondary_button: {
        text: "Узнать больше",
      },
      table: {
        columns: {
          teamspaceName: "Название командного пространства",
          members: "Участники",
          accountType: "Тип аккаунта",
        },
        actions: {
          remove: {
            button: {
              text: "Удалить командное пространство",
            },
            confirm: {
              title: "Удалить {teamspaceName} из {projectName}",
              description:
                "При удалении этого командного пространства из связанного проекта участники потеряют доступ к связанному проекту.",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "Подходящих командных пространств не найдено",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {Вы связали командное пространство с этим проектом.} other {Вы связали # командных пространств с этим проектом.}}",
            description:
              "{additionalCount, plural, =0 {Командное пространство {firstTeamspaceName} теперь связано с этим проектом.} other {Командное пространство {firstTeamspaceName} и еще {additionalCount} теперь связаны с этим проектом.}}",
          },
          error: {
            title: "Это не удалось.",
            description: "Попробуйте снова или перезагрузите страницу перед повторной попыткой.",
          },
        },
        remove_teamspace: {
          success: {
            title: "Вы удалили это командное пространство из проекта.",
            description: "Командное пространство {teamspaceName} было удалено из {projectName}.",
          },
          error: {
            title: "Это не удалось.",
            description: "Попробуйте снова или перезагрузите страницу перед повторной попыткой.",
          },
        },
      },
      link_teamspace: {
        placeholder: "Поиск командных пространств",
        info: {
          title: "Добавление командного пространства предоставляет всем его участникам доступ к этому проекту.",
          link: "Узнать больше",
        },
        empty_state: {
          no_teamspaces: {
            title: "У вас нет командных пространств для связи.",
            description:
              "Либо вы не состоите в командном пространстве, которое можно связать, либо вы уже связали все доступные командные пространства.",
          },
          no_results: {
            title: "Это не соответствует ни одному из ваших командных пространств.",
            description: "Попробуйте другой термин или убедитесь, что у вас есть командные пространства для связи.",
          },
        },
        primary_button: {
          text: "Связать выбранные командные пространства",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "Создайте специфические для команды рабочие элементы.",
        description:
          "Рабочие элементы, назначенные членам этой команды в любом связанном проекте, автоматически появятся здесь. Если вы ожидаете увидеть некоторые рабочие элементы здесь, убедитесь, что ваши связанные проекты имеют рабочие элементы, назначенные членам этой команды, или создайте рабочие элементы.",
        primary_button: {
          text: "Добавить рабочие элементы в связанный проект",
        },
      },
      work_items_empty_filter: {
        title: "Нет специфических для команды рабочих элементов для примененных фильтров",
        description:
          "Измените некоторые из этих фильтров или очистите их все, чтобы увидеть рабочие элементы, относящиеся к этому пространству.",
        secondary_button: {
          text: "Очистить все фильтры",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "Ни один из ваших связанных проектов не имеет активного цикла.",
        description:
          "Активные циклы в связанных проектах автоматически появятся здесь. Если вы ожидаете увидеть активный цикл, убедитесь, что он работает в связанном проекте прямо сейчас.",
      },
      completed: {
        title: "Ни один из ваших связанных проектов не имеет завершенного цикла.",
        description:
          "Завершенные циклы в связанных проектах автоматически появятся здесь. Если вы ожидаете увидеть завершенный цикл, убедитесь, что он также завершен в связанном проекте.",
      },
      upcoming: {
        title: "Ни один из ваших связанных проектов не имеет предстоящего цикла.",
        description:
          "Предстоящие циклы в связанных проектах автоматически появятся здесь. Если вы ожидаете увидеть предстоящий цикл, убедитесь, что он есть в связанном проекте тоже.",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title: "Вид вашей команды на вашу работу без нарушения других видов в вашем рабочем пространстве",
        description:
          "Смотрите работу вашей команды в представлениях, которые сохранены только для вашей команды и отдельно от представлений проекта.",
        primary_button: {
          text: "Создать представление",
        },
      },
      filter: {
        title: "Нет совпадающих представлений",
        description: `Нет представлений, соответствующих критериям поиска.
 Создайте новое представление вместо этого.`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "Сохраните знания вашей команды на страницах команды.",
        description:
          "В отличие от страниц в проекте, вы можете сохранить знания, специфичные для команды, в отдельном наборе страниц здесь. Получите все функции страниц, создайте документы с лучшими практиками и вики команды легко.",
        primary_button: {
          text: "Создать вашу первую командную страницу",
        },
      },
      filter: {
        title: "Нет совпадающих страниц",
        description: "Уберите фильтры, чтобы увидеть все страницы",
      },
      search: {
        title: "Нет совпадающих страниц",
        description: "Уберите критерии поиска, чтобы увидеть все страницы",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "Ни один из ваших связанных проектов не имеет опубликованных рабочих элементов.",
        description:
          "Создайте некоторые рабочие элементы в одном или нескольких из этих проектов, чтобы увидеть прогресс по датам, состояниям и приоритетам.",
      },
      relation: {
        blocking: {
          title: "У вас нет рабочих элементов, блокирующих товарища по команде.",
          description: "Отличная работа! Вы очистили путь для вашей команды. Вы хороший командный игрок.",
        },
        blocked: {
          title: "У вас нет рабочих элементов товарища по команде, блокирующих вас.",
          description: "Хорошие новости! Вы можете продвигаться по всем вашим назначенным рабочим элементам.",
        },
      },
      stats: {
        general: {
          title: "Ни один из ваших связанных проектов не имеет опубликованных рабочих элементов.",
          description:
            "Создайте некоторые рабочие элементы в одном или нескольких из этих проектов, чтобы увидеть распределение работы по проектам и членам команды.",
        },
        filter: {
          title: "Нет командной статистики для примененных фильтров.",
          description:
            "Создайте некоторые рабочие элементы в одном или нескольких из этих проектов, чтобы увидеть распределение работы по проектам и членам команды.",
        },
      },
    },
  },
  initiatives: {
    overview: "Обзор",
    label: "Инициативы",
    placeholder: "{count, plural, one{# инициатива} other{# инициативы}}",
    add_initiative: "Добавить инициативу",
    create_initiative: "Создать инициативу",
    update_initiative: "Обновить инициативу",
    initiative_name: "Название инициативы",
    all_initiatives: "Все инициативы",
    delete_initiative: "Удалить инициативу",
    fill_all_required_fields: "Пожалуйста, заполните все обязательные поля.",
    toast: {
      create_success: "Инициатива {name} успешно создана.",
      create_error: "Не удалось создать инициативу. Пожалуйста, попробуйте снова!",
      update_success: "Инициатива {name} успешно обновлена.",
      update_error: "Не удалось обновить инициативу. Пожалуйста, попробуйте снова!",
      delete: {
        success: "Инициатива успешно удалена.",
        error: "Не удалось удалить инициативу",
      },
      link_copied: "Ссылка на инициативу скопирована в буфер обмена.",
      project_update_success: "Проекты инициативы успешно обновлены.",
      project_update_error: "Не удалось обновить проекты инициативы. Пожалуйста, попробуйте снова!",
      epic_update_success:
        "Эпик{count, plural, one { успешно добавлен в инициативу.} other {ов добавлено в инициативу успешно.}}",
      epic_update_error: "Не удалось добавить эпик в инициативу. Пожалуйста, попробуйте позже.",
      state_update_success: "Состояние инициативы успешно обновлено.",
      state_update_error: "Не удалось обновить состояние инициативы. Пожалуйста, попробуйте еще раз!",
      label_update_error: "Не удалось обновить метки инициативы. Пожалуйста, попробуйте снова!",
    },
    empty_state: {
      general: {
        title: "Организуйте работу на самом высоком уровне с инициативами",
        description:
          "Когда вам нужно организовать работу, охватывающую несколько проектов и команд, инициативы приходят на помощь. Связывайте проекты и эпики с инициативами, смотрите автоматически свёрнутые обновления и видите леса, прежде чем доберётесь до деревьев.",
        primary_button: {
          text: "Создать инициативу",
        },
      },
      search: {
        title: "Нет совпадающих инициатив",
        description: `Не обнаружено инициатив, соответствующих критериям.
 Создайте новую инициативу вместо этого.`,
      },
      not_found: {
        title: "Инициатива не существует",
        description: "Инициатива, которую вы ищете, не существует, была заархивирована или была удалена.",
        primary_button: {
          text: "Посмотреть другие инициативы",
        },
      },
      epics: {
        title: "У вас нет эпиков, соответствующих примененным фильтрам.",
        subHeading: "Чтобы увидеть все эпики, очистите все примененные фильтры.",
        action: "Очистить фильтры",
      },
    },
    scope: {
      view_scope: "Просмотр области",
      breakdown: "Разбивка области",
      add_scope: "Добавить область",
      label: "Область",
      empty_state: {
        title: "Область еще не добавлена",
        description: "Свяжите проекты и эпики с инициативой, чтобы начать.",
        primary_button: {
          text: "Добавить область",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "Метки",
        description: "Структурируйте и организуйте ваши инициативы с помощью меток.",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "Удалить метку",
        content:
          "Вы уверены, что хотите удалить {labelName}? Это удалит метку из всех инициатив и из всех представлений, где фильтруется эта метка.",
      },
      toast: {
        delete_error: "Не удалось удалить метку инициативы. Пожалуйста, попробуйте снова.",
        label_already_exists: "Метка уже существует",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title:
          "Напишите заметку, документ или полную базу знаний. Попросите Галила, ИИ-помощника Plane, помочь вам начать",
        description:
          "Страницы — это пространство для мыслей в Plane. Записывайте заметки с встреч, форматируйте их легко, встраивайте рабочие элементы, раскладывайте их с помощью библиотеки компонентов и держите их все в контексте вашего проекта. Чтобы быстро справиться с любым документом, вызовите Галила, ИИ Plane, с помощью сочетания клавиш или нажатием кнопки.",
        primary_button: {
          text: "Создать вашу первую страницу",
        },
      },
      private: {
        title: "Пока нет частных страниц",
        description:
          "Держите свои частные мысли здесь. Когда вы будете готовы поделиться, команда всего в одном клике.",
      },
      public: {
        title: "Пока нет страниц рабочего пространства",
        description: "Смотрите страницы, поделенные со всеми в вашем рабочем пространстве, прямо здесь.",
        primary_button: {
          text: "Создать вашу первую страницу",
        },
      },
      archived: {
        title: "Пока нет архивированных страниц",
        description:
          "Архивируйте страницы, которые не на вашем радаре. Получите к ним доступ здесь, когда это необходимо.",
      },
    },
  },
  epics: {
    label: "Эпики",
    no_epics_selected: "Эпики не выбраны",
    add_selected_epics: "Добавить выбранные эпики",
    epic_link_copied_to_clipboard: "Ссылка на эпик скопирована в буфер обмена.",
    project_link_copied_to_clipboard: "Ссылка на проект скопирована в буфер обмена",
    empty_state: {
      general: {
        title: "Создайте эпик и назначьте его кому-то, даже себе",
        description:
          "Для больших объемов работы, которые охватывают несколько циклов и могут существовать в разных модулях, создайте эпик. Связывайте рабочие элементы и подрабочие элементы в проекте с эпиком и переходите к рабочему элементу из обзора.",
        primary_button: {
          text: "Создать эпик",
        },
      },
      section: {
        title: "Пока нет эпиков",
        description: "Начните добавлять эпики, чтобы управлять и отслеживать прогресс.",
        primary_button: {
          text: "Добавить эпики",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "Совпадающих эпиков не найдено",
      },
      no_epics: {
        title: "Эпики не найдены",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "Нет активных циклов",
        description:
          "Циклы ваших проектов, которые включают любой период, охватывающий сегодняшнюю дату в своем диапазоне. Найдите прогресс и детали всех ваших активных циклов здесь.",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: `Добавьте рабочие элементы в цикл, чтобы увидеть его
 прогресс`,
      },
      priority: {
        title: `Наблюдайте за высокоприоритетными рабочими элементами, решаемыми в
 цикле на первый взгляд.`,
      },
      assignee: {
        title: `Добавьте назначенных к рабочим элементам, чтобы увидеть
 разбивку работы по назначенным.`,
      },
      label: {
        title: `Добавьте метки к рабочим элементам, чтобы увидеть
 разбивку работы по меткам.`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "Импорт участников из CSV",
      description: "Загрузите CSV со столбцами: Email, Display Name, First Name, Last Name, Role (5, 15 или 20)",
      dropzone: {
        active: "Перетащите CSV файл сюда",
        inactive: "Перетащите или нажмите для загрузки",
        file_type: "Поддерживаются только файлы .csv",
      },
      buttons: {
        cancel: "Отмена",
        import: "Импортировать",
        try_again: "Попробовать снова",
        close: "Закрыть",
        done: "Готово",
      },
      progress: {
        uploading: "Загрузка...",
        importing: "Импорт...",
      },
      summary: {
        title: {
          failed: "Импорт не удался",
          complete: "Импорт завершен",
        },
        message: {
          seat_limit: "Не удалось импортировать участников из-за ограничений количества мест.",
          success: "Успешно добавлено {count} участник{plural} в рабочее пространство.",
          no_imports: "Участники не были импортированы из CSV файла.",
        },
        stats: {
          successful: "Успешно",
          failed: "Не удалось",
        },
        download_errors: "Скачать ошибки",
      },
      toast: {
        invalid_file: {
          title: "Недопустимый файл",
          message: "Поддерживаются только CSV файлы.",
        },
        import_failed: {
          title: "Импорт не удался",
          message: "Что-то пошло не так.",
        },
      },
    },
  },
  project: {
    members_import: {
      title: "Импорт участников из CSV",
      description:
        "Загрузите CSV со столбцами: Email и Role (5=Гость, 15=Участник, 20=Администратор). Пользователи уже должны быть участниками рабочего пространства.",
      download_sample: "Скачать пример CSV",
      dropzone: {
        active: "Перетащите CSV файл сюда",
        inactive: "Перетащите или нажмите для загрузки",
        file_type: "Поддерживаются только файлы .csv",
      },
      buttons: {
        cancel: "Отмена",
        import: "Импортировать",
        try_again: "Попробовать снова",
        close: "Закрыть",
        done: "Готово",
      },
      progress: {
        uploading: "Загрузка...",
        importing: "Импорт...",
      },
      summary: {
        title: {
          complete: "Импорт завершен",
        },
        message: {
          success: "Успешно импортировано {count} участник{plural} в проект.",
          no_imports: "Из CSV не было импортировано новых участников.",
        },
        stats: {
          added: "Добавлено",
          reactivated: "Повторно активированы",
          already_members: "Уже участники",
          skipped: "Пропущено",
        },
        download_errors: "Скачать сведения о пропущенных",
      },
      toast: {
        invalid_file: {
          title: "Недопустимый файл",
          message: "Поддерживаются только CSV файлы.",
        },
        import_failed: {
          title: "Импорт не удался",
          message: "Что-то пошло не так.",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "Не удалось архивировать рабочие элементы",
        message:
          "Только рабочие элементы, принадлежащие завершенным или отмененным группам состояния, могут быть архивированы.",
      },
      invalid_issue_start_date: {
        title: "Не удалось обновить рабочие элементы",
        message:
          "Выбранная дата начала превышает дату окончания для некоторых рабочих элементов. Убедитесь, что дата начала раньше даты окончания.",
      },
      invalid_issue_target_date: {
        title: "Не удалось обновить рабочие элементы",
        message:
          "Выбранная дата окончания предшествует дате начала для некоторых рабочих элементов. Убедитесь, что дата окончания позже даты начала.",
      },
      invalid_state_transition: {
        title: "Не удалось обновить рабочие элементы",
        message:
          "Изменение состояния не разрешено для некоторых рабочих элементов. Убедитесь, что изменение состояния разрешено.",
      },
    },
    workflows: {
      toggle: {
        title: "Включить рабочие процессы",
        description: "Настройте рабочие процессы для управления перемещением рабочих элементов",
        no_states_tooltip: "В рабочий процесс не добавлены состояния.",
        toast: {
          loading: {
            enabling: "Включение рабочих процессов",
            disabling: "Отключение рабочих процессов",
          },
          success: {
            title: "Успех!",
            message: "Рабочие процессы успешно включены.",
          },
          error: {
            title: "Ошибка!",
            message: "Не удалось включить рабочие процессы. Пожалуйста, попробуйте снова.",
          },
        },
      },
      heading: "Рабочие процессы",
      description:
        "Автоматизируйте переходы рабочих элементов и настройте правила, которые управляют тем, как задачи проходят через процесс вашего проекта.",
      add_button: "Добавить новый рабочий процесс",
      search: "Искать рабочие процессы",
      detail: {
        define: "Определить рабочий процесс",
        add_states: "Добавить состояния",
        unmapped_states: {
          title: "Обнаружены несопоставленные состояния",
          description:
            "Некоторые рабочие элементы выбранных типов сейчас находятся в состояниях, которых нет в этом рабочем процессе.",
          note: "Если вы включите этот рабочий процесс, эти элементы будут автоматически перемещены в начальное состояние этого рабочего процесса.",
          label: "Отсутствующие состояния",
          tooltip:
            "Некоторые рабочие элементы находятся в состояниях, которые не сопоставлены с этим рабочим процессом. Откройте рабочий процесс, чтобы проверить это.",
        },
      },
      select_states: {
        empty_state: {
          title: "Все состояния используются",
          description: "Все состояния, определённые для этого проекта, уже присутствуют в текущем рабочем процессе.",
        },
      },
      default_footer: {
        fallback_message:
          "Этот рабочий процесс применяется к любому типу рабочего элемента, который не назначен ни одному рабочему процессу.",
      },
      create: {
        heading: "Создать новый рабочий процесс",
      },
    },
  },
  work_item_types: {
    label: "Типы рабочих элементов",
    label_lowercase: "типы рабочих элементов",
    settings: {
      title: "Типы рабочих элементов",
      properties: {
        title: "Пользовательские свойства",
        tooltip:
          "Каждый тип рабочего элемента имеет набор свойств по умолчанию, таких как Заголовок, Описание, Ответственный, Состояние, Приоритет, Дата начала, Дата окончания, Модуль, Цикл и т.д. Вы также можете настроить и добавить свои собственные свойства, чтобы адаптировать их к потребностям вашей команды.",
        add_button: "Добавить новое свойство",
        dropdown: {
          label: "Тип свойства",
          placeholder: "Выберите тип",
        },
        property_type: {
          text: {
            label: "Текст",
          },
          number: {
            label: "Число",
          },
          dropdown: {
            label: "Выпадающий список",
          },
          boolean: {
            label: "Логический",
          },
          date: {
            label: "Дата",
          },
          member_picker: {
            label: "Выбор участника",
          },
          release_picker: {
            label: "Выбор релизов",
          },
          formula: {
            label: "Формула",
          },
        },
        attributes: {
          label: "Атрибуты",
          text: {
            single_line: {
              label: "Одна строка",
            },
            multi_line: {
              label: "Параграф",
            },
            readonly: {
              label: "Только для чтения",
              header: "Данные только для чтения",
            },
            invalid_text_format: {
              label: "Неверный текстовый формат",
            },
          },
          number: {
            default: {
              placeholder: "Добавить число",
            },
          },
          relation: {
            single_select: {
              label: "Один выбор",
            },
            multi_select: {
              label: "Множественный выбор",
            },
            no_default_value: {
              label: "Нет значения по умолчанию",
            },
          },
          boolean: {
            label: "Истина | Ложь",
            no_default: "Нет значения по умолчанию",
          },
          option: {
            create_update: {
              label: "Опции",
              form: {
                placeholder: "Добавить опцию",
                errors: {
                  name: {
                    required: "Имя опции обязательно.",
                    integrity: "Опция с таким именем уже существует.",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "Выберите опцию",
                multi: {
                  default: "Выберите опции",
                  variable: "{count} опций выбрано",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "Успех!",
              message: "Свойство {name} успешно создано.",
            },
            error: {
              title: "Ошибка!",
              message: "Не удалось создать свойство. Пожалуйста, попробуйте снова!",
            },
          },
          update: {
            success: {
              title: "Успех!",
              message: "Свойство {name} успешно обновлено.",
            },
            error: {
              title: "Ошибка!",
              message: "Не удалось обновить свойство. Пожалуйста, попробуйте снова!",
            },
          },
          delete: {
            success: {
              title: "Успех!",
              message: "Свойство {name} успешно удалено.",
            },
            error: {
              title: "Ошибка!",
              message: "Не удалось удалить свойство. Пожалуйста, попробуйте снова!",
            },
          },
          enable_disable: {
            loading: "{action} {name} свойство",
            success: {
              title: "Успех!",
              message: "Свойство {name} {action} успешно.",
            },
            error: {
              title: "Ошибка!",
              message: "Не удалось {action} свойство. Пожалуйста, попробуйте снова!",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "Заголовок",
            },
            description: {
              placeholder: "Описание",
            },
          },
          errors: {
            name: {
              required: "Вы должны назвать ваше свойство.",
              max_length: "Имя свойства не должно превышать 255 символов.",
            },
            property_type: {
              required: "Вы должны выбрать тип свойства.",
            },
            options: {
              required: "Вы должны добавить хотя бы одну опцию.",
            },
            formula: {
              required: "Выражение формулы обязательно.",
              invalid: "Недопустимая формула: {error}",
              circular_reference:
                "Обнаружена циклическая ссылка. Формула не может ссылаться на саму себя прямо или косвенно.",
              invalid_reference: "Формула ссылается на несуществующее свойство.",
            },
          },
        },
        formula: {
          field_label: "Поле формулы",
          tooltip: "Введите формулу, используя синтаксис '{'Имя поля'}'. Поддерживает операторы +, -, *, / и &.",
          placeholder: "Напишите формулу",
          test_button: "Тест",
          validating: "Проверка",
          validation_success: "Формула действительна! Возвращает {resultType}",
          validation_success_with_refs: "Формула действительна! Возвращает {resultType} ({count} полей указано)",
          error: {
            empty: "Пожалуйста, введите формулу",
            missing_context: "Отсутствует контекст рабочего пространства, проекта или типа рабочего элемента",
            validation_failed: "Проверка не удалась",
          },
          picker: {
            no_match: "Нет совпадающих свойств",
            no_available: "Нет доступных свойств",
          },
        },
        enable_disable: {
          label: "Активно",
          tooltip: {
            disabled: "Нажмите, чтобы отключить",
            enabled: "Нажмите, чтобы включить",
          },
        },
        delete_confirmation: {
          title: "Удалить это свойство",
          description: "Удаление свойств может привести к потере существующих данных.",
          secondary_description: "Хотите отключить свойство вместо этого?",
          primary_button: "{action}, удалить его",
          secondary_button: "Да, отключить его",
        },
        mandate_confirmation: {
          label: "Обязательное свойство",
          content:
            "Похоже, что для этого свойства есть значение по умолчанию. Сделав свойство обязательным, вы удалите значение по умолчанию, и пользователи должны будут добавить значение по своему выбору.",
          tooltip: {
            disabled: "Этот тип свойства не может быть сделан обязательным",
            enabled: "Снимите отметку, чтобы отметить поле как необязательное",
            checked: "Установите отметку, чтобы отметить поле как обязательное",
          },
        },
        empty_state: {
          title: "Добавьте пользовательские свойства",
          description:
            "Новые свойства, которые вы добавите для этого типа рабочего элемента, будут отображаться здесь.",
        },
      },
      item_delete_confirmation: {
        title: "Удалить этот тип",
        description: "Удаление типов может привести к потере существующих данных.",
        primary_button: "Да, удалить",
        toast: {
          success: {
            title: "Успешно!",
            message: "Тип рабочего элемента успешно удалён.",
          },
          error: {
            title: "Ошибка!",
            message: "Не удалось удалить тип рабочего элемента. Пожалуйста, попробуйте снова!",
          },
        },
        errors: {
          cannot_delete_default_work_item_type: "Невозможно удалить тип рабочего элемента по умолчанию",
          cannot_delete_work_item_type_with_associated_work_items:
            "Невозможно удалить тип рабочего элемента со связанными рабочими элементами",
        },
        can_disable_warning: "Хотите отключить этот тип вместо этого?",
      },
      cant_delete_default_message:
        "Невозможно удалить этот тип рабочего элемента, так как он установлен как тип по умолчанию для этого проекта.",
      set_as_default: "Установить по умолчанию",
      cant_set_default_inactive_message: "Активируйте этот тип перед установкой по умолчанию",
      set_default_confirmation: {
        title: "Установить как тип рабочего элемента по умолчанию",
        description:
          "Установка {name} по умолчанию импортирует его во все проекты этого рабочего пространства. Все новые рабочие элементы будут использовать этот тип по умолчанию.",
        confirm_button: "Установить по умолчанию",
      },
    },
    create: {
      title: "Создать тип рабочего элемента",
      button: "Добавить тип рабочего элемента",
      toast: {
        success: {
          title: "Успех!",
          message: "Тип рабочего элемента успешно создан.",
        },
        error: {
          title: "Ошибка!",
          message: {
            conflict: "Тип {name} уже существует. Выберите другое имя.",
          },
        },
      },
    },
    update: {
      title: "Обновить тип рабочего элемента",
      button: "Обновить тип рабочего элемента",
      toast: {
        success: {
          title: "Успех!",
          message: "Тип рабочего элемента {name} успешно обновлен.",
        },
        error: {
          title: "Ошибка!",
          message: {
            conflict: "Тип {name} уже существует. Выберите другое имя.",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "Дайте этому типу рабочего элемента уникальное имя",
        },
        description: {
          placeholder: "Опишите, для чего предназначен этот тип рабочего элемента и когда его следует использовать.",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{action} {name} тип рабочего элемента",
        success: {
          title: "Успех!",
          message: "Тип рабочего элемента {name} {action} успешно.",
        },
        error: {
          title: "Ошибка!",
          message: "Не удалось {action} тип рабочего элемента. Пожалуйста, попробуйте снова!",
        },
      },
      tooltip: "Нажмите, чтобы {action}",
    },
    change_confirmation: {
      title: "Изменить тип рабочего элемента?",
      description:
        "Изменение типа рабочего элемента может привести к потере значений пользовательских свойств, специфичных для текущего типа. Это действие нельзя отменить.",
      button: {
        loading: "Изменение",
        default: "Изменить тип",
      },
    },
    empty_state: {
      enable: {
        title: "Включить типы рабочих элементов",
        description:
          "Настройте рабочие элементы под свои нужды с помощью типов рабочих элементов. Настройте с помощью значков, фонов и свойств и настройте их для этого проекта.",
        primary_button: {
          text: "Включить",
        },
        confirmation: {
          title: "После включения типы рабочих элементов не могут быть отключены.",
          description:
            "Тип рабочего элемента Plane станет типом рабочего элемента по умолчанию для этого проекта и будет отображаться с его значком и фоном в этом проекте.",
          button: {
            default: "Включить",
            loading: "Настройка",
          },
        },
      },
      get_pro: {
        title: "Получите Pro, чтобы включить типы рабочих элементов.",
        description:
          "Настройте рабочие элементы под свои нужды с помощью типов рабочих элементов. Настройте с помощью значков, фонов и свойств и настройте их для этого проекта.",
        primary_button: {
          text: "Получить Pro",
        },
      },
      upgrade: {
        title: "Обновите, чтобы включить типы рабочих элементов.",
        description:
          "Настройте рабочие элементы под свои нужды с помощью типов рабочих элементов. Настройте с помощью значков, фонов и свойств и настройте их для этого проекта.",
        primary_button: {
          text: "Обновить",
        },
      },
    },
  },
  importers: {
    imports: "Импорт",
    logo: "Логотип",
    import_message: "Импортируйте ваши данные {serviceName} в проекты Plane.",
    deactivate: "Деактивировать",
    deactivating: "Деактивируется",
    migrating: "Миграция",
    migrations: "Миграции",
    refreshing: "Обновление",
    import: "Импорт",
    serial_number: "Ср. №",
    project: "Проект",
    workspace: "workspace",
    status: "Статус",
    summary: "Резюме",
    total_batches: "Всего партий",
    imported_batches: "Импортированные партии",
    re_run: "Запустить снова",
    cancel: "Отменить",
    start_time: "Время начала",
    no_jobs_found: "Работы не найдены",
    no_project_imports: "Вы еще не импортировали ни одного проекта {serviceName}.",
    cancel_import_job: "Отменить задачу импорта",
    cancel_import_job_confirmation:
      "Вы уверены, что хотите отменить эту задачу импорта? Это остановит процесс импорта для этого проекта.",
    re_run_import_job: "Запустить задачу импорта снова",
    re_run_import_job_confirmation:
      "Вы уверены, что хотите запустить эту задачу импорта снова? Это перезапустит процесс импорта для этого проекта.",
    upload_csv_file: "Загрузите CSV файл для импорта данных пользователей.",
    connect_importer: "Подключить {serviceName}",
    migration_assistant: "Ассистент миграции",
    migration_assistant_description:
      "Бесшовно мигрируйте ваши проекты {serviceName} в Plane с помощью нашего мощного ассистента.",
    token_helper: "Вы получите это от вашего",
    personal_access_token: "Личный токен доступа",
    source_token_expired: "Токен истек",
    source_token_expired_description:
      "Предоставленный токен истек. Пожалуйста, деактивируйте и переподключите с новым набором учетных данных.",
    user_email: "Электронная почта пользователя",
    select_state: "Выбрать состояние",
    select_service_project: "Выбрать проект {serviceName}",
    loading_service_projects: "Загрузка проектов {serviceName}",
    select_service_workspace: "Выбрать {serviceName} рабочее пространство",
    loading_service_workspaces: "Загрузка рабочих пространств {serviceName}",
    select_priority: "Выбрать приоритет",
    select_service_team: "Выбрать команду {serviceName}",
    add_seat_msg_free_trial:
      "Вы пытаетесь импортировать {additionalUserCount} незарегистрированных пользователей, и у вас всего {currentWorkspaceSubscriptionAvailableSeats} мест доступно в текущем плане. Чтобы продолжить импорт, обновите сейчас.",
    add_seat_msg_paid:
      "Вы пытаетесь импортировать {additionalUserCount} незарегистрированных пользователей, и у вас всего {currentWorkspaceSubscriptionAvailableSeats} мест доступно в текущем плане. Чтобы продолжить импорт, купите как минимум {extraSeatRequired} дополнительных мест.",
    skip_user_import_title: "Пропустить импорт данных пользователя",
    skip_user_import_description:
      "Пропуск импорта пользователя приведет к тому, что рабочие элементы, комментарии и другие данные от {serviceName} будут созданы пользователем, выполняющим миграцию в Plane. Вы все еще можете вручную добавить пользователей позже.",
    invalid_pat: "Недействительный личный токен доступа",
  },
  integrations: {
    integrations: "Интеграции",
    loading: "Загрузка",
    unauthorized: "У вас нет прав для просмотра этой страницы.",
    configure: "Настроить",
    not_enabled: "{name} не включен для этого рабочего пространства.",
    not_configured: "Не настроено",
    disconnect_personal_account: "Отключить личный аккаунт {providerName}",
    not_configured_message_admin:
      "Интеграция {name} не настроена. Пожалуйста, свяжитесь с администратором вашей инстанции для настройки.",
    not_configured_message_support: "Интеграция {name} не настроена. Пожалуйста, свяжитесь с поддержкой для настройки.",
    external_api_unreachable: "Не удалось получить доступ к внешнему API. Пожалуйста, попробуйте снова позже.",
    error_fetching_supported_integrations:
      "Не удалось получить поддерживаемые интеграции. Пожалуйста, попробуйте снова позже.",
    back_to_integrations: "Назад к интеграциям",
    select_state: "Выбрать состояние",
    set_state: "Установить состояние",
    choose_project: "Выбрать проект...",
    skip_backward_state_movement: "Запретить перемещение задач в более раннее состояние из-за обновлений PR",
  },
  github_integration: {
    name: "GitHub",
    description: "Подключите и синхронизируйте ваши рабочие элементы GitHub с Plane.",
    connect_org: "Подключить организацию",
    connect_org_description: "Подключите вашу организацию GitHub к Plane",
    processing: "Обработка",
    org_added_desc: "GitHub org добавлена в и время",
    connection_fetch_error: "Ошибка получения данных подключения с сервера",
    personal_account_connected: "Личный аккаунт подключен",
    personal_account_connected_description: "Ваш GitHub аккаунт теперь подключен к Plane",
    connect_personal_account: "Подключить личный аккаунт",
    connect_personal_account_description: "Подключите ваш личный GitHub аккаунт к Plane.",
    repo_mapping: "Сопоставление репозитория",
    repo_mapping_description: "Сопоставьте ваши репозитории GitHub с проектами Plane.",
    project_issue_sync: "Синхронизация проблем проекта",
    project_issue_sync_description: "Синхронизируйте проблемы из GitHub в ваш проект Plane",
    project_issue_sync_empty_state: "Сопоставленные синхронизации проблем проекта появятся здесь",
    configure_project_issue_sync_state: "Настроить состояние синхронизации проблем",
    select_issue_sync_direction: "Выбрать направление синхронизации проблем",
    allow_bidirectional_sync:
      "Двунаправленная - Синхронизируйте проблемы и комментарии в обоих направлениях между GitHub и Plane",
    allow_unidirectional_sync: "Однонаправленная - Синхронизируйте проблемы и комментарии из GitHub в Plane только",
    allow_unidirectional_sync_warning:
      "Данные из GitHub Issue заменят данные в связанном рабочем элементе Plane (только GitHub → Plane)",
    remove_project_issue_sync: "Удалить эту синхронизацию проблем проекта",
    remove_project_issue_sync_confirmation: "Вы уверены, что хотите удалить эту синхронизацию проблем проекта?",
    add_pr_state_mapping: "Добавить сопоставление состояния запроса на слияние для проекта Plane",
    edit_pr_state_mapping: "Редактировать сопоставление состояния запроса на слияние для проекта Plane",
    pr_state_mapping: "Сопоставление состояния запроса на слияние",
    pr_state_mapping_description: "Сопоставьте состояния запросов на слияние из GitHub в ваш проект Plane",
    pr_state_mapping_empty_state: "Сопоставленные состояния PR появятся здесь",
    remove_pr_state_mapping: "Удалить это сопоставление состояния запроса на слияние",
    remove_pr_state_mapping_confirmation:
      "Вы уверены, что хотите удалить это сопоставление состояния запроса на слияние?",
    issue_sync_message: "Рабочие элементы синхронизированы в {project}",
    link: "Ссылка на репозиторий GitHub на проект Plane",
    pull_request_automation: "Автоматизация запроса на слияние",
    pull_request_automation_description:
      "Настройте сопоставление состояния запроса на слияние из GitHub в ваш проект Plane",
    DRAFT_MR_OPENED: "Открыт черновик",
    MR_OPENED: "Открыт",
    MR_READY_FOR_MERGE: "Готово к слиянию",
    MR_REVIEW_REQUESTED: "Запрошено обзор",
    MR_MERGED: "Слияние",
    MR_CLOSED: "Закрыт",
    ISSUE_OPEN: "Открыт",
    ISSUE_CLOSED: "Закрыт",
    save: "Сохранить",
    start_sync: "Начать синхронизацию",
    choose_repository: "Выбрать репозиторий...",
  },
  gitlab_integration: {
    name: "Gitlab",
    description: "Подключите и синхронизируйте ваши запросы на слияние Gitlab с Plane.",
    connection_fetch_error: "Ошибка получения данных подключения с сервера",
    connect_org: "Подключить организацию",
    connect_org_description: "Подключите вашу организацию Gitlab к Plane.",
    project_connections: "Подключения проектов Gitlab",
    project_connections_description: "Синхронизируйте запросы на слияние из Gitlab в проекты Plane.",
    plane_project_connection: "Подключение проекта Plane",
    plane_project_connection_description:
      "Настройте сопоставление состояния запросов на слияние из Gitlab в проекты Plane",
    remove_connection: "Удалить подключение",
    remove_connection_confirmation: "Вы уверены, что хотите удалить это подключение?",
    link: "Ссылка на репозиторий Gitlab в проект Plane",
    pull_request_automation: "Автоматизация запросов на слияние",
    pull_request_automation_description: "Настройте сопоставление состояния запросов на слияние из Gitlab в Plane",
    DRAFT_MR_OPENED: "При открытии чернового MR установить состояние на",
    MR_OPENED: "При открытии MR установить состояние на",
    MR_REVIEW_REQUESTED: "При запросе на обзор MR установить состояние на",
    MR_READY_FOR_MERGE: "При готовности MR к слиянию установить состояние на",
    MR_MERGED: "При слиянии MR установить состояние на",
    MR_CLOSED: "При закрытии MR установить состояние на",
    integration_enabled_text:
      "С включенной интеграцией Gitlab вы можете автоматизировать рабочие процессы рабочих элементов",
    choose_entity: "Выбрать сущность",
    choose_project: "Выбрать проект",
    link_plane_project: "Ссылка на проект Plane",
    project_issue_sync: "Синхронизация задач проекта",
    project_issue_sync_description: "Синхронизируйте задачи из Gitlab в ваш проект Plane",
    project_issue_sync_empty_state: "Сопоставленная синхронизация задач проекта появится здесь",
    configure_project_issue_sync_state: "Настроить состояние синхронизации задач",
    select_issue_sync_direction: "Выберите направление синхронизации задач",
    allow_bidirectional_sync:
      "Двунаправленная - Синхронизировать задачи и комментарии в обоих направлениях между Gitlab и Plane",
    allow_unidirectional_sync: "Однонаправленная - Синхронизировать задачи и комментарии только из Gitlab в Plane",
    allow_unidirectional_sync_warning:
      "Данные из Gitlab Issue заменят данные в связанном рабочем элементе Plane (только Gitlab → Plane)",
    remove_project_issue_sync: "Удалить эту синхронизацию задач проекта",
    remove_project_issue_sync_confirmation: "Вы уверены, что хотите удалить эту синхронизацию задач проекта?",
    ISSUE_OPEN: "Задача открыта",
    ISSUE_CLOSED: "Задача закрыта",
    save: "Сохранить",
    start_sync: "Начать синхронизацию",
    choose_repository: "Выберите репозиторий...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Подключите и синхронизируйте ваш экземпляр Gitlab Enterprise с Plane.",
    app_form_title: "Конфигурация Gitlab Enterprise",
    app_form_description: "Настройте Gitlab Enterprise для подключения к Plane.",
    base_url_title: "Базовый URL",
    base_url_description: "Базовый URL вашего экземпляра Gitlab Enterprise.",
    base_url_placeholder: 'напр. "https://glab.plane.town"',
    base_url_error: "Базовый URL обязателен",
    invalid_base_url_error: "Недействительный базовый URL",
    client_id_title: "ID приложения",
    client_id_description: "ID приложения, которое вы создали в вашем экземпляре Gitlab Enterprise.",
    client_id_placeholder: 'напр. "7cd732xxxxxxxxxxxxxx"',
    client_id_error: "ID приложения обязателен",
    client_secret_title: "Client Secret",
    client_secret_description: "Client secret приложения, которое вы создали в вашем экземпляре Gitlab Enterprise.",
    client_secret_placeholder: 'напр. "gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "Client secret обязателен",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description:
      "Случайный webhook secret, который будет использоваться для проверки webhook от экземпляра Gitlab Enterprise.",
    webhook_secret_placeholder: 'напр. "webhook1234567890"',
    webhook_secret_error: "Webhook secret обязателен",
    connect_app: "Подключить приложение",
  },
  slack_integration: {
    name: "Slack",
    description: "Подключите ваше рабочее пространство Slack к Plane.",
    connect_personal_account: "Подключите ваш личный аккаунт Slack к Plane.",
    personal_account_connected: "Ваш личный аккаунт {providerName} теперь подключен к Plane.",
    link_personal_account: "Связать ваш личный аккаунт {providerName} с Plane.",
    connected_slack_workspaces: "Подключенные рабочие пространства Slack",
    connected_on: "Подключено {date}",
    disconnect_workspace: "Отключить рабочее пространство {name}",
    alerts: {
      dm_alerts: {
        title:
          "Получайте уведомления в личных сообщениях Slack о важных обновлениях, напоминаниях и оповещениях только для вас.",
      },
    },
    project_updates: {
      title: "Обновления Проекта",
      description: "Настройте уведомления об обновлениях проектов для ваших проектов",
      add_new_project_update: "Добавить новое уведомление об обновлениях проекта",
      project_updates_empty_state: "Проекты, подключенные к каналам Slack, появятся здесь.",
      project_updates_form: {
        title: "Настроить Обновления Проекта",
        description: "Получайте уведомления об обновлениях проекта в Slack, когда создаются рабочие элементы",
        failed_to_load_channels: "Не удалось загрузить каналы из Slack",
        project_dropdown: {
          placeholder: "Выберите проект",
          label: "Проект Plane",
          no_projects: "Нет доступных проектов",
        },
        channel_dropdown: {
          label: "Канал Slack",
          placeholder: "Выберите канал",
          no_channels: "Нет доступных каналов",
        },
        all_projects_connected: "Все проекты уже подключены к каналам Slack.",
        all_channels_connected: "Все каналы Slack уже подключены к проектам.",
        project_connection_success: "Подключение проекта успешно создано",
        project_connection_updated: "Подключение проекта успешно обновлено",
        project_connection_deleted: "Подключение проекта успешно удалено",
        failed_delete_project_connection: "Не удалось удалить подключение проекта",
        failed_create_project_connection: "Не удалось создать подключение проекта",
        failed_upserting_project_connection: "Не удалось обновить подключение проекта",
        failed_loading_project_connections:
          "Мы не смогли загрузить ваши подключения проектов. Это может быть связано с проблемой сети или проблемой с интеграцией.",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "Подключите ваше рабочее пространство Sentry к Plane.",
    connected_sentry_workspaces: "Подключенные рабочие пространства Sentry",
    connected_on: "Подключено {date}",
    disconnect_workspace: "Отключить рабочее пространство {name}",
    state_mapping: {
      title: "Сопоставление состояний",
      description:
        "Сопоставьте состояния инцидентов Sentry с состояниями вашего проекта. Настройте, какие состояния использовать, когда инцидент Sentry разрешен или не разрешен.",
      add_new_state_mapping: "Добавить новое сопоставление состояний",
      empty_state:
        "Сопоставления состояний не настроены. Создайте первое сопоставление для синхронизации состояний инцидентов Sentry с состояниями вашего проекта.",
      failed_loading_state_mappings:
        "Не удалось загрузить ваши сопоставления состояний. Это может быть связано с проблемой сети или проблемой с интеграцией.",
      loading_project_states: "Загрузка состояний проекта...",
      error_loading_states: "Ошибка загрузки состояний",
      no_states_available: "Состояния недоступны",
      no_permission_states: "У вас нет разрешения на доступ к состояниям для этого проекта",
      states_not_found: "Состояния проекта не найдены",
      server_error_states: "Ошибка сервера при загрузке состояний",
    },
  },
  oauth_bridge_integration: {
    name: "OAuth Bridge",
    description: "Проверка токенов внешних IdP для доступа к API.",
    header_description:
      "Проверяйте внешние OIDC/JWT-токены от вашего IdP (Azure AD, Okta и др.) для доступа к API Plane.",
    connected: "Подключено",
    connect: "Подключить",
    uninstall: "Удалить",
    uninstalling: "Удаление...",
    install_success: "OAuth Bridge успешно установлен.",
    install_error: "Не удалось установить OAuth Bridge.",
    uninstall_success: "OAuth Bridge удалён.",
    uninstall_error: "Не удалось удалить OAuth Bridge.",
    token_providers: "Провайдеры токенов",
    token_providers_description: "Настройте внешние IdP, чьи JWT принимаются как учётные данные API.",
    add_provider: "Добавить провайдера",
    edit_provider: "Редактировать провайдера",
    enabled: "Включён",
    disabled: "Отключён",
    test: "Тест",
    no_providers_title: "Провайдеры не настроены.",
    no_providers_description: "Добавьте IdP для включения аутентификации по внешним токенам.",
    provider_updated: "Провайдер обновлён.",
    provider_added: "Провайдер добавлен.",
    provider_save_error: "Не удалось сохранить провайдера.",
    provider_deleted: "Провайдер удалён.",
    provider_delete_error: "Не удалось удалить провайдера.",
    provider_update_error: "Не удалось обновить провайдера.",
    jwks_reachable: "JWKS доступен",
    jwks_unreachable: "JWKS недоступен",
    jwks_test_error: "Не удалось получить JWKS по настроенному URL.",
    provider_form: {
      name_label: "Название",
      name_placeholder: "напр. Azure AD Production",
      name_description: "Понятное название для этого провайдера идентификации",
      name_required: "Название обязательно.",
      issuer_label: "Издатель",
      issuer_placeholder: "https://login.microsoftonline.com/tenant-id/v2.0",
      issuer_description: "Ожидаемое значение claim iss в JWT",
      issuer_required: "Издатель обязателен.",
      jwks_url_label: "URL JWKS",
      jwks_url_placeholder: "https://login.microsoftonline.com/tenant-id/discovery/v2.0/keys",
      jwks_url_description: "HTTPS-эндпоинт, предоставляющий JSON Web Key Set провайдера",
      jwks_url_required: "URL JWKS обязателен.",
      jwks_url_https: "URL JWKS должен использовать HTTPS.",
      audience_label: "Аудитория",
      audience_placeholder: "api://my-app-id",
      audience_description: "Ожидаемые claim(ы) aud в JWT, через запятую.",
      user_claims_label: "Claim пользователя",
      user_claims_placeholder: "email",
      user_claims_description: "JWT claim, содержащий email пользователя",
      user_claims_required: "Claim пользователя обязателен.",
      allowed_algorithms_label: "Разрешённые алгоритмы подписи",
      allowed_algorithms_description: "Асимметричные алгоритмы для проверки подписи JWT",
      allowed_algorithms_required: "Необходим хотя бы один алгоритм.",
      select_algorithms: "Выберите алгоритмы",
      jwks_cache_ttl_label: "TTL кэша JWKS (секунды)",
      jwks_cache_ttl_description: "Время кэширования ключей JWKS провайдера (минимум 60 сек., по умолчанию 24 часа)",
      jwks_cache_ttl_min: "TTL кэша должен быть не менее 60 секунд.",
      rate_limit_label: "Лимит запросов",
      rate_limit_placeholder: "120/minute",
      rate_limit_description:
        "Ограничение запросов в формате количество/период (напр. 120/minute). Оставьте пустым для лимита по умолчанию.",
      enable_provider: "Включить этого провайдера",
      saving: "Сохранение...",
      update: "Обновить",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "Подключите и синхронизируйте вашу организацию GitHub Enterprise с Plane.",
    app_form_title: "Настройка GitHub Enterprise",
    app_form_description: "Настройте GitHub Enterprise для подключения к Plane.",
    app_id_title: "ID приложения",
    app_id_description: "ID приложения, которое вы создали в вашей организации GitHub Enterprise.",
    app_id_placeholder: 'e.g., "1234567890"',
    app_id_error: "ID приложения является обязательным",
    app_name_title: "Slug приложения",
    app_name_description: "Slug приложения, которое вы создали в вашей организации GitHub Enterprise.",
    app_name_error: "Slug приложения является обязательным",
    app_name_placeholder: 'e.g., "plane-github-enterprise"',
    base_url_title: "Базовая URL",
    base_url_description: "Базовая URL вашей организации GitHub Enterprise.",
    base_url_placeholder: 'e.g., "https://gh.plane.town"',
    base_url_error: "Базовая URL является обязательной",
    invalid_base_url_error: "Неверная базовая URL",
    client_id_title: "ID клиента",
    client_id_description: "ID клиента приложения, которое вы создали в вашей организации GitHub Enterprise.",
    client_id_placeholder: 'e.g., "1234567890"',
    client_id_error: "ID клиента является обязательным",
    client_secret_title: "Секрет клиента",
    client_secret_description: "Секрет клиента приложения, которое вы создали в вашей организации GitHub Enterprise.",
    client_secret_placeholder: 'e.g., "1234567890"',
    client_secret_error: "Секрет клиента является обязательным",
    webhook_secret_title: "Секрет вебхука",
    webhook_secret_description: "Секрет вебхука приложения, которое вы создали в вашей организации GitHub Enterprise.",
    webhook_secret_placeholder: 'e.g., "1234567890"',
    webhook_secret_error: "Секрет вебхука является обязательным",
    private_key_title: "Приватный ключ (Base64 encoded)",
    private_key_description:
      "Base64 encoded private key приложения, которое вы создали в вашей организации GitHub Enterprise.",
    private_key_placeholder: 'e.g., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Приватный ключ является обязательным",
    connect_app: "Подключить приложение",
  },
  file_upload: {
    upload_text: "Нажмите здесь, чтобы загрузить файл",
    drag_drop_text: "Перетащите и отпустите",
    processing: "Обработка",
    invalid: "Недопустимый тип файла",
    missing_fields: "Отсутствуют поля",
    success: "{fileName} загружен!",
  },
  silo_errors: {
    invalid_query_params: "Предоставленные параметры запроса недействительны или отсутствуют обязательные поля",
    invalid_installation_account: "Предоставленный аккаунт установки недействителен",
    generic_error: "Произошла неожиданная ошибка при обработке вашего запроса",
    connection_not_found: "Запрашиваемое подключение не найдено",
    multiple_connections_found: "Найдено несколько подключений, когда ожидалось только одно",
    installation_not_found: "Запрашиваемая установка не найдена",
    user_not_found: "Запрашиваемый пользователь не найден",
    error_fetching_token: "Не удалось получить токен аутентификации",
    cannot_create_multiple_connections:
      "Вы уже подключили свою организацию к рабочему пространству. Пожалуйста, отключите существующее подключение перед подключением нового.",
    invalid_app_credentials: "Предоставленные учетные данные приложения недействительны",
    invalid_app_installation_id: "Не удалось установить приложение",
  },
  import_status: {
    queued: "В очереди",
    created: "Создано",
    initiated: "Инициировано",
    pulling: "Извлечение",
    timed_out: "Время истекло",
    pulled: "Извлечено",
    transforming: "Преобразование",
    transformed: "Преобразовано",
    pushing: "Отправка",
    finished: "Завершено",
    error: "Ошибка",
    cancelled: "Отменено",
  },
  jira_importer: {
    jira_importer_description: "Импортируйте ваши данные Jira в проекты Plane.",
    create_project_automatically: "Создать проект автоматически",
    create_project_automatically_description: "Мы создадим для вас новый проект на основе данных проекта Jira.",
    import_to_existing_project: "Импортировать в существующий проект",
    import_to_existing_project_description: "Выберите существующий проект из раскрывающегося списка ниже.",
    state_mapping_automatic_creation: "Все статусы Jira будут созданы в Plane автоматически.",
    personal_access_token: "Личный токен доступа",
    user_email: "Электронная почта пользователя",
    atlassian_security_settings: "Настройки безопасности Atlassian",
    email_description: "Это электронная почта, связанная с вашим личным токеном доступа",
    jira_domain: "Домен Jira",
    jira_domain_description: "Это домен вашей инстанции Jira",
    steps: {
      title_configure_plane: "Настроить Plane",
      description_configure_plane:
        "Пожалуйста, сначала создайте проект в Plane, в который вы собираетесь мигрировать ваши данные Jira. После создания проекта выберите его здесь.",
      title_configure_jira: "Настроить Jira",
      description_configure_jira:
        "Пожалуйста, выберите рабочее пространство Jira, из которого вы хотите мигрировать ваши данные.",
      title_import_users: "Импортировать пользователей",
      description_import_users:
        "Пожалуйста, добавьте пользователей, которых вы хотите мигрировать из Jira в Plane. В качестве альтернативы вы можете пропустить этот шаг и вручную добавить пользователей позже.",
      title_map_states: "Сопоставить состояния",
      description_map_states:
        "Мы автоматически сопоставили статусы Jira с состояниями Plane наилучшим образом. Пожалуйста, сопоставьте любые оставшиеся состояния перед продолжением, вы также можете создать состояния и сопоставить их вручную.",
      title_map_priorities: "Сопоставить приоритеты",
      description_map_priorities:
        "Мы автоматически сопоставили приоритеты наилучшим образом. Пожалуйста, сопоставьте любые оставшиеся приоритеты перед продолжением.",
      title_summary: "Резюме",
      description_summary: "Вот резюме данных, которые будут мигрированы из Jira в Plane.",
      custom_jql_filter: "Пользовательский фильтр JQL",
      jql_filter_description: "Используйте JQL для фильтрации конкретных задач для импорта.",
      project_code: "ПРОЕКТ",
      enter_filters_placeholder: "Введите фильтры (например, status = 'In Progress')",
      validating_query: "Проверка запроса...",
      validation_successful_work_items_selected: "Проверка успешна, выбрано {count} рабочих элементов.",
      run_syntax_check: "Запустить проверку синтаксиса для проверки вашего запроса",
      refresh: "Обновить",
      check_syntax: "Проверить синтаксис",
      no_work_items_selected: "Запрос не выбрал ни одного рабочего элемента.",
      validation_error_default: "Что-то пошло не так при проверке запроса.",
    },
  },
  asana_importer: {
    asana_importer_description: "Импортируйте ваши данные Asana в проекты Plane.",
    select_asana_priority_field: "Выберите поле приоритета Asana",
    steps: {
      title_configure_plane: "Настроить Plane",
      description_configure_plane:
        "Пожалуйста, сначала создайте проект в Plane, в который вы собираетесь мигрировать ваши данные Asana. После создания проекта выберите его здесь.",
      title_configure_asana: "Настроить Asana",
      description_configure_asana:
        "Пожалуйста, выберите рабочее пространство и проект Asana, из которых вы хотите мигрировать ваши данные.",
      title_map_states: "Сопоставить состояния",
      description_map_states:
        "Пожалуйста, выберите состояния Asana, которые вы хотите сопоставить с состояниями проектов Plane.",
      title_map_priorities: "Сопоставить приоритеты",
      description_map_priorities:
        "Пожалуйста, выберите приоритеты Asana, которые вы хотите сопоставить с приоритетами проектов Plane.",
      title_summary: "Резюме",
      description_summary: "Вот резюме данных, которые будут мигрированы из Asana в Plane.",
    },
  },
  linear_importer: {
    linear_importer_description: "Импортируйте ваши данные Linear в проекты Plane.",
    steps: {
      title_configure_plane: "Настроить Plane",
      description_configure_plane:
        "Пожалуйста, сначала создайте проект в Plane, в который вы собираетесь мигрировать ваши данные Linear. После создания проекта выберите его здесь.",
      title_configure_linear: "Настроить Linear",
      description_configure_linear:
        "Пожалуйста, выберите команду Linear, из которой вы хотите мигрировать ваши данные.",
      title_map_states: "Сопоставить состояния",
      description_map_states:
        "Мы автоматически сопоставили статусы Linear с состояниями Plane наилучшим образом. Пожалуйста, сопоставьте любые оставшиеся состояния перед продолжением, вы также можете создать состояния и сопоставить их вручную.",
      title_map_priorities: "Сопоставить приоритеты",
      description_map_priorities:
        "Пожалуйста, выберите приоритеты Linear, которые вы хотите сопоставить с приоритетами проектов Plane.",
      title_summary: "Резюме",
      description_summary: "Вот резюме данных, которые будут мигрированы из Linear в Plane.",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "Импортируйте ваши данные Jira Server/Data Center в проекты Plane.",
    steps: {
      title_configure_plane: "Настроить Plane",
      description_configure_plane:
        "Пожалуйста, сначала создайте проект в Plane, в который вы собираетесь мигрировать ваши данные Jira Server/Data Center. После создания проекта выберите его здесь.",
      title_configure_jira: "Настроить Jira",
      description_configure_jira:
        "Пожалуйста, выберите рабочее пространство Jira, из которого вы хотите мигрировать ваши данные.",
      title_map_states: "Сопоставить состояния",
      description_map_states:
        "Пожалуйста, выберите состояния Jira, которые вы хотите сопоставить с состояниями проектов Plane.",
      title_map_priorities: "Сопоставить приоритеты",
      description_map_priorities:
        "Пожалуйста, выберите приоритеты Jira, которые вы хотите сопоставить с приоритетами проектов Plane.",
      title_summary: "Резюме",
      description_summary: "Вот резюме данных, которые будут мигрированы из Jira Server/Data Center в Plane.",
    },
    import_epics: {
      title: "Импортировать эпики как рабочие элементы",
      description:
        "Если эта опция включена, ваши эпики будут импортированы как рабочие элементы с типом рабочего элемента 'эпик'.",
    },
  },
  notion_importer: {
    notion_importer_description: "Импортируйте ваши данные Notion в проекты Plane.",
    steps: {
      title_upload_zip: "Загрузить ZIP-экспорт из Notion",
      description_upload_zip: "Пожалуйста, загрузите ZIP-файл, содержащий ваши данные Notion.",
    },
    upload: {
      drop_file_here: "Перетащите ваш zip-файл Notion сюда",
      upload_title: "Загрузить экспорт Notion",
      upload_from_url: "Импорт по URL-адресу",
      upload_from_url_description: "Вставьте общедоступный URL-адрес вашего ZIP-экспорта, чтобы продолжить.",
      drag_drop_description: "Перетащите ваш zip-файл экспорта Notion или нажмите для просмотра",
      file_type_restriction: "Поддерживаются только .zip файлы, экспортированные из Notion",
      select_file: "Выбрать файл",
      uploading: "Загрузка...",
      preparing_upload: "Подготовка загрузки...",
      confirming_upload: "Подтверждение загрузки...",
      confirming: "Подтверждение...",
      upload_complete: "Загрузка завершена",
      upload_failed: "Загрузка не удалась",
      start_import: "Начать импорт",
      retry_upload: "Повторить загрузку",
      upload: "Загрузить",
      ready: "Готово",
      error: "Ошибка",
      upload_complete_message: "Загрузка завершена!",
      upload_complete_description: 'Нажмите "Начать импорт", чтобы начать обработку ваших данных Notion.',
      upload_progress_message: "Пожалуйста, не закрывайте это окно.",
    },
  },
  confluence_importer: {
    confluence_importer_description: "Импортируйте ваши данные Confluence в вики Plane.",
    steps: {
      title_upload_zip: "Загрузить ZIP-экспорт из Confluence",
      description_upload_zip: "Пожалуйста, загрузите ZIP-файл, содержащий ваши данные Confluence.",
    },
    upload: {
      drop_file_here: "Перетащите ваш zip-файл Confluence сюда",
      upload_title: "Загрузить экспорт Confluence",
      upload_from_url: "Импорт по URL-адресу",
      upload_from_url_description: "Вставьте общедоступный URL-адрес вашего ZIP-экспорта, чтобы продолжить.",
      drag_drop_description: "Перетащите ваш zip-файл экспорта Confluence или нажмите для просмотра",
      file_type_restriction: "Поддерживаются только .zip файлы, экспортированные из Confluence",
      select_file: "Выбрать файл",
      uploading: "Загрузка...",
      preparing_upload: "Подготовка загрузки...",
      confirming_upload: "Подтверждение загрузки...",
      confirming: "Подтверждение...",
      upload_complete: "Загрузка завершена",
      upload_failed: "Загрузка не удалась",
      start_import: "Начать импорт",
      retry_upload: "Повторить загрузку",
      upload: "Загрузить",
      ready: "Готово",
      error: "Ошибка",
      upload_complete_message: "Загрузка завершена!",
      upload_complete_description: 'Нажмите "Начать импорт", чтобы начать обработку ваших данных Confluence.',
      upload_progress_message: "Пожалуйста, не закрывайте это окно.",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "Импортируйте ваши данные CSV в проекты Plane.",
    steps: {
      title_configure_plane: "Настроить Plane",
      description_configure_plane:
        "Пожалуйста, сначала создайте проект в Plane, в который вы собираетесь мигрировать ваши данные CSV. После создания проекта выберите его здесь.",
      title_configure_csv: "Настроить CSV",
      description_configure_csv:
        "Пожалуйста, загрузите ваш файл CSV и настройте поля для сопоставления с полями Plane.",
    },
  },
  csv_importer: {
    csv_importer_description: "Импорт рабочих элементов из CSV-файлов в проекты Plane.",
    steps: {
      title_select_project: "Выбрать проект",
      description_select_project:
        "Пожалуйста, выберите проект Plane, в который вы хотите импортировать рабочие элементы.",
      title_upload_csv: "Загрузить CSV",
      description_upload_csv:
        "Загрузите CSV-файл, содержащий рабочие элементы. Файл должен включать столбцы для имени, описания, приоритета, дат и группы состояний.",
    },
  },
  clickup_importer: {
    clickup_importer_description: "Импортируйте ваши данные ClickUp в проекты Plane.",
    select_service_space: "Выберите {serviceName} Пространство",
    select_service_folder: "Выберите {serviceName} Папку",
    selected: "Выбрано",
    users: "Пользователи",
    steps: {
      title_configure_plane: "Настроить Plane",
      description_configure_plane:
        "Пожалуйста, сначала создайте проект в Plane, в который вы собираетесь мигрировать ваши данные ClickUp. После создания проекта выберите его здесь.",
      title_configure_clickup: "Настроить ClickUp",
      description_configure_clickup:
        "Пожалуйста, выберите команду ClickUp, пространство и папку, из которых вы хотите мигрировать ваши данные.",
      title_map_states: "Сопоставить состояния",
      description_map_states:
        "Мы автоматически сопоставили статусы ClickUp с состояниями Plane наилучшим образом. Пожалуйста, сопоставьте любые оставшиеся состояния перед продолжением, вы также можете создать состояния и сопоставить их вручную.",
      title_map_priorities: "Сопоставить приоритеты",
      description_map_priorities:
        "Пожалуйста, выберите приоритеты ClickUp, которые вы хотите сопоставить с приоритетами проектов Plane.",
      title_summary: "Резюме",
      description_summary: "Вот резюме данных, которые будут мигрированы из ClickUp в Plane.",
      pull_additional_data_title: "Получить комментарии и вложения",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "Столбец",
          long_label: "Столбчатая диаграмма",
          chart_models: {
            basic: "Базовый",
            stacked: "С накоплением",
            grouped: "Сгруппированный",
          },
          orientation: {
            label: "Ориентация",
            horizontal: "Горизонтальная",
            vertical: "Вертикальная",
            placeholder: "Добавить ориентацию",
          },
          bar_color: "Цвет столбца",
        },
        line_chart: {
          short_label: "Линия",
          long_label: "Линейная диаграмма",
          chart_models: {
            basic: "Базовый",
            multi_line: "Многолинейный",
          },
          line_color: "Цвет линии",
          line_type: {
            label: "Тип линии",
            solid: "Сплошная",
            dashed: "Пунктирная",
            placeholder: "Добавить тип линии",
          },
        },
        area_chart: {
          short_label: "Область",
          long_label: "Диаграмма области",
          chart_models: {
            basic: "Базовый",
            stacked: "С накоплением",
            comparison: "Сравнительный",
          },
          fill_color: "Цвет заливки",
        },
        donut_chart: {
          short_label: "Кольцо",
          long_label: "Кольцевая диаграмма",
          chart_models: {
            basic: "Базовый",
            progress: "Прогресс",
          },
          center_value: "Центральное значение",
          completed_color: "Цвет завершения",
        },
        pie_chart: {
          short_label: "Круг",
          long_label: "Круговая диаграмма",
          chart_models: {
            basic: "Базовый",
          },
          group: {
            label: "Сгруппированные сегменты",
            group_thin_pieces: "Группировать тонкие сегменты",
            minimum_threshold: {
              label: "Минимальный порог",
              placeholder: "Добавить порог",
            },
            name_group: {
              label: "Имя группы",
              placeholder: '"Менее 5%"',
            },
          },
          show_values: "Показать значения",
          value_type: {
            percentage: "Процент",
            count: "Количество",
          },
        },
        text: {
          short_label: "Текст",
          long_label: "Текст",
          alignment: {
            label: "Выравнивание текста",
            left: "По левому краю",
            center: "По центру",
            right: "По правому краю",
            placeholder: "Добавить выравнивание текста",
          },
          text_color: "Цвет текста",
        },
        table_chart: {
          short_label: "Таблица",
          long_label: "Табличная диаграмма",
          chart_models: {
            basic: {
              short_label: "Основная",
              long_label: "Таблица",
            },
          },
          columns: "Столбцы",
          rows: "Строки",
          rows_placeholder: "Добавить строки",
          configure_rows_hint: "Выберите свойство для строк, чтобы просмотреть эту таблицу.",
        },
      },
      color_palettes: {
        modern: "Современная",
        horizon: "Горизонт",
        earthen: "Земляная",
      },
      common: {
        add_widget: "Добавить виджет",
        widget_title: {
          label: "Назовите этот виджет",
          placeholder: 'например, "Задачи на вчера", "Все завершённые"',
        },
        chart_type: "Тип диаграммы",
        visualization_type: {
          label: "Тип визуализации",
          placeholder: "Добавить тип визуализации",
        },
        date_group: {
          label: "Группировка по дате",
          placeholder: "Добавить группировку по дате",
        },
        group_by: "Группировать по",
        stack_by: "Складывать по",
        daily: "Ежедневно",
        weekly: "Еженедельно",
        monthly: "Ежемесячно",
        yearly: "Ежегодно",
        work_item_count: "Количество рабочих элементов",
        estimate_point: "Оценочные баллы",
        pending_work_item: "Ожидающие рабочие элементы",
        completed_work_item: "Завершенные рабочие элементы",
        in_progress_work_item: "Рабочие элементы в процессе",
        blocked_work_item: "Заблокированные рабочие элементы",
        work_item_due_this_week: "Рабочие элементы со сроком на этой неделе",
        work_item_due_today: "Рабочие элементы со сроком сегодня",
        color_scheme: {
          label: "Цветовая схема",
          placeholder: "Добавить цветовую схему",
        },
        smoothing: "Сглаживание",
        markers: "Маркеры",
        legends: "Легенды",
        tooltips: "Всплывающие подсказки",
        opacity: {
          label: "Непрозрачность",
          placeholder: "Добавить непрозрачность",
        },
        border: "Граница",
        widget_configuration: "Конфигурация виджета",
        configure_widget: "Настроить виджет",
        guides: "Направляющие",
        style: "Стиль",
        area_appearance: "Внешний вид области",
        comparison_line_appearance: "Внешний вид линии сравнения",
        add_property: "Добавить свойство",
        add_metric: "Добавить метрику",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "Отсутствует значение для оси X.",
            y_axis_metric: "Отсутствует значение для метрики.",
          },
          stacked: {
            x_axis_property: "Отсутствует значение для оси X.",
            y_axis_metric: "Отсутствует значение для метрики.",
            group_by: "Отсутствует значение для параметра 'Складывать по'.",
          },
          grouped: {
            x_axis_property: "Отсутствует значение для оси X.",
            y_axis_metric: "Отсутствует значение для метрики.",
            group_by: "Отсутствует значение для параметра 'Группировать по'.",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "Отсутствует значение для оси X.",
            y_axis_metric: "Отсутствует значение для метрики.",
          },
          multi_line: {
            x_axis_property: "Отсутствует значение для оси X.",
            y_axis_metric: "Отсутствует значение для метрики.",
            group_by: "Отсутствует значение для параметра 'Группировать по'.",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "Отсутствует значение для оси X.",
            y_axis_metric: "Отсутствует значение для метрики.",
          },
          stacked: {
            x_axis_property: "Отсутствует значение для оси X.",
            y_axis_metric: "Отсутствует значение для метрики.",
            group_by: "Отсутствует значение для параметра 'Складывать по'.",
          },
          comparison: {
            x_axis_property: "Отсутствует значение для оси X.",
            y_axis_metric: "Отсутствует значение для метрики.",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "Отсутствует значение для оси X.",
            y_axis_metric: "Отсутствует значение для метрики.",
          },
          progress: {
            y_axis_metric: "Отсутствует значение для метрики.",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "Отсутствует значение для оси X.",
            y_axis_metric: "Отсутствует значение для метрики.",
          },
        },
        text: {
          basic: {
            y_axis_metric: "Отсутствует значение для метрики.",
          },
        },
        table_chart: {
          basic: {
            x_axis_property: "Столбцам не хватает значения.",
            group_by: "Строкам не хватает значения.",
          },
        },
        ask_admin: "Попросите администратора настроить этот виджет.",
      },
    },
    create_modal: {
      heading: {
        create: "Создать новую панель",
        update: "Обновить панель",
      },
      title: {
        label: "Назовите вашу панель.",
        placeholder: '"Мощность по проектам", "Рабочая нагрузка по командам", "Состояние по всем проектам"',
        required_error: "Название обязательно",
      },
      project: {
        label: "Выберите проекты",
        placeholder: "Данные из этих проектов будут использоваться для этой панели.",
        required_error: "Проекты обязательны",
      },
      filters_label: "Настройте фильтры для источников данных выше",
      create_dashboard: "Создать панель",
      update_dashboard: "Обновить панель",
    },
    delete_modal: {
      heading: "Удалить панель",
    },
    empty_state: {
      feature_flag: {
        title: "Представляйте ваш прогресс в панелях по запросу, которые сохраняются навсегда.",
        description:
          "Создавайте любые нужные вам панели и настраивайте внешний вид ваших данных для идеальной презентации вашего прогресса.",
        coming_soon_to_mobile: "Скоро появится в мобильном приложении",
        card_1: {
          title: "Для всех ваших проектов",
          description:
            "Получите полное представление о вашем рабочем пространстве со всеми проектами или отфильтруйте данные о работе для получения идеального обзора вашего прогресса.",
        },
        card_2: {
          title: "Для любых данных в Plane",
          description:
            "Выходите за рамки стандартной аналитики и готовых диаграмм цикла, чтобы взглянуть на команды, инициативы или что-либо еще так, как вы не видели раньше.",
        },
        card_3: {
          title: "Для всех ваших потребностей в визуализации данных",
          description:
            "Выбирайте из нескольких настраиваемых диаграмм с точными элементами управления, чтобы видеть и показывать ваши рабочие данные именно так, как вы хотите.",
        },
        card_4: {
          title: "По запросу и постоянно",
          description:
            "Создайте один раз, храните навсегда с автоматическим обновлением данных, контекстными флагами для изменений области и общими постоянными ссылками.",
        },
        card_5: {
          title: "Экспорт и запланированные сообщения",
          description:
            "Для тех случаев, когда ссылки не работают, экспортируйте ваши панели в разовые PDF или запланируйте их автоматическую отправку заинтересованным сторонам.",
        },
        card_6: {
          title: "Автоматическая компоновка для всех устройств",
          description:
            "Изменяйте размер ваших виджетов для желаемой компоновки и видите их точно так же на мобильных устройствах, планшетах и других браузерах.",
        },
      },
      dashboards_list: {
        title:
          "Визуализируйте данные в виджетах, создавайте панели с виджетами и просматривайте последние данные по запросу.",
        description:
          "Создавайте панели с Пользовательскими Виджетами, которые показывают ваши данные в указанной вами области. Получайте панели для всей вашей работы по проектам и командам и делитесь постоянными ссылками с заинтересованными сторонами для отслеживания по запросу.",
      },
      dashboards_search: {
        title: "Это не соответствует названию панели.",
        description: "Убедитесь, что ваш запрос верен, или попробуйте другой запрос.",
      },
      widgets_list: {
        title: "Визуализируйте ваши данные так, как вы хотите.",
        description:
          "Используйте линии, столбцы, круги и другие форматы, чтобы видеть ваши данные так, как вы хотите, из указанных вами источников.",
      },
      widget_data: {
        title: "Здесь нечего показать",
        description: "Обновите или добавьте данные, чтобы увидеть их здесь.",
      },
    },
    common: {
      editing: "Редактирование",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "Разрешить новые рабочие элементы",
      work_item_creation_disable_tooltip: "Создание рабочих элементов отключено для этого состояния",
      default_state:
        "Стандартное состояние позволяет всем участникам создавать новые рабочие элементы. Это нельзя изменить",
      state_change_count:
        "{count, plural, one {1 разрешенное изменение состояния} other {{count} разрешенных изменения состояния}}",
      movers_count: "{count, plural, one {1 указанный перемещатель} other {{count} указанных перемещателей}}",
      state_changes: {
        label: {
          default: "Добавить разрешенное изменение состояния",
          loading: "Добавление разрешенного изменения состояния",
        },
        move_to: "Переместить в",
        movers: {
          label: "Когда перемещено",
          tooltip:
            "Перемещатели — это люди, которым разрешено перемещать рабочие элементы из одного состояния в другое.",
          add: "Добавить перемещателей",
        },
      },
    },
    workflow_disabled: {
      title: "Вы не можете переместить этот рабочий элемент сюда.",
    },
    workflow_enabled: {
      label: "Изменение состояния",
    },
    workflow_tree: {
      label: "Для рабочих элементов в",
      state_change_label: "можно переместить в",
    },
    empty_state: {
      upgrade: {
        title: "Контролируйте хаос изменений и проверок с помощью Рабочих процессов.",
        description:
          "Установите правила для того, куда перемещается ваша работа, кем и когда с помощью Рабочих процессов в Plane.",
      },
    },
    quick_actions: {
      view_change_history: "Просмотреть историю изменений",
      reset_workflow: "Сбросить рабочий процесс",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "Вы уверены, что хотите сбросить этот рабочий процесс?",
        description:
          "Если вы сбросите этот рабочий процесс, все ваши правила изменения состояния будут удалены, и вам придется создать их заново, чтобы они работали в этом проекте.",
      },
      delete_state_change: {
        title: "Вы уверены, что хотите удалить это правило изменения состояния?",
        description:
          "После удаления вы не сможете отменить это изменение, и вам придется установить правило снова, если вы хотите, чтобы оно работало для этого проекта.",
      },
    },
    toasts: {
      enable_disable: {
        loading: "{action} рабочие процессы",
        success: {
          title: "Рабочие процессы {action} успешно",
          message: "Рабочие процессы {action} успешно",
        },
        error: {
          title: "Ошибка {action} рабочих процессов",
          message: "Рабочие процессы не могут быть {action}. Пожалуйста, попробуйте снова.",
        },
      },
      reset: {
        success: {
          title: "Рабочие процессы успешно сброшены",
          message: "Рабочие процессы успешно сброшены",
        },
        error: {
          title: "Ошибка сброса рабочих процессов",
          message: "Рабочие процессы не могут быть сброшены. Пожалуйста, попробуйте снова.",
        },
      },
      add_state_change_rule: {
        error: {
          title: "Ошибка добавления правила изменения состояния",
          message: "Правило изменения состояния не может быть добавлено. Пожалуйста, попробуйте снова.",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "Ошибка изменения правила изменения состояния",
          message: "Правило изменения состояния не может быть изменено. Пожалуйста, попробуйте снова.",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "Ошибка удаления правила изменения состояния",
          message: "Правило изменения состояния не может быть удалено. Пожалуйста, попробуйте снова.",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "Ошибка изменения утверждающих правил изменения состояния",
          message: "Утверждающие правила изменения состояния не могут быть изменены. Пожалуйста, попробуйте снова.",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {Клиент} other {Клиенты}}",
    dropdown: {
      placeholder: "Выберите клиента",
      required: "Пожалуйста, выберите клиента",
      no_selection: "Нет клиентов",
    },
    upgrade: {
      title: "Определяйте приоритеты и управляйте работой с клиентами.",
      description: "Связывайте свою работу с клиентами и расставляйте приоритеты по их атрибутам.",
    },
    properties: {
      default: {
        title: "По умолчанию",
        customer_name: {
          name: "Имя клиента",
          placeholder: "Это может быть имя человека или компании",
          validation: {
            required: "Имя клиента обязательно.",
            max_length: "Имя клиента не может быть длиннее 255 символов.",
          },
        },
        description: {
          name: "Описание",
          validation: {},
        },
        email: {
          name: "Электронная почта",
          placeholder: "Введите электронную почту",
          validation: {
            required: "Электронная почта обязательна.",
            pattern: "Некорректный адрес электронной почты.",
          },
        },
        website_url: {
          name: "Веб-сайт",
          placeholder: "Любой URL с https:// будет работать.",
          placeholder_short: "Добавить веб-сайт",
          validation: {
            pattern: "Некорректный URL веб-сайта",
          },
        },
        employees: {
          name: "Сотрудники",
          placeholder: "Количество сотрудников, если ваш клиент — это компания.",
          validation: {
            min_length: "Количество сотрудников не может быть меньше 0.",
            max_length: "Количество сотрудников не может быть больше 2147483647.",
          },
        },
        size: {
          name: "Размер",
          placeholder: "Добавьте размер компании",
          validation: {
            min_length: "Некорректный размер",
          },
        },
        domain: {
          domain: "Отрасль",
          placeholder: "Розничная торговля, e-Commerce, Финтех, Банковское дело",
          placeholder_short: "Добавьте отрасль",
          validation: {},
        },
        stage: {
          name: "Этап",
          placeholder: "Выберите этап",
          validation: {},
        },
        contract_status: {
          name: "Статус контракта",
          placeholder: "Выберите статус контракта",
          validation: {},
        },
        revenue: {
          name: "Доход",
          placeholder: "Это годовой доход, получаемый вашим клиентом.",
          placeholder_short: "Добавить доход",
          validation: {
            min_length: "Доход не может быть меньше 0.",
          },
        },
        invalid_value: "Некорректное значение свойства.",
      },
      custom: {
        title: "Пользовательские свойства",
        info: "Добавьте уникальные атрибуты ваших клиентов в Plane, чтобы лучше управлять рабочими элементами или записями клиентов.",
      },
      empty_state: {
        title: "Добавить пользовательские свойства",
        description:
          "Пользовательские свойства, которые вы хотите сопоставить вручную или автоматически с вашим CRM, появятся здесь.",
      },
      add: {
        primary_button: "Добавить новое свойство",
      },
    },
    stage: {
      lead: "Лид",
      sales_qualified_lead: "Лид, квалифицированный для продаж",
      contract_negotiation: "Переговоры по контракту",
      closed_won: "Закрыто, выиграно",
      closed_lost: "Закрыто, проиграно",
    },
    contract_status: {
      active: "Активно",
      pre_contract: "Предконтракт",
      signed: "Подписано",
      inactive: "Неактивно",
    },
    empty_state: {
      detail: {
        title: "Не удалось найти этот клиентский рекорд.",
        description: "Ссылка на этот рекорд может быть неверной или он мог быть удален.",
        primary_button: "Перейти к клиентам",
        secondary_button: "Добавить клиента",
      },
      search: {
        title: "Похоже, у вас нет записей клиентов, соответствующих этому запросу.",
        description:
          "Попробуйте другой поисковый запрос или свяжитесь с нами, если уверены, что должны видеть результаты для этого запроса.",
      },
      list: {
        title: "Управляйте объемом, темпом и потоком своей работы, основываясь на том, что важно для ваших клиентов.",
        description:
          "С функцией 'Клиенты' в Plane вы можете создать новых клиентов с нуля и связать их с вашей работой. Скоро вы сможете импортировать их из других инструментов вместе с их пользовательскими атрибутами.",
        primary_button: "Добавить вашего первого клиента",
      },
    },
    settings: {
      unauthorized: "У вас нет прав доступа к этой странице.",
      description: "Отслеживайте и управляйте отношениями с клиентами в вашем рабочем процессе.",
      enable: "Включить клиентов",
      toasts: {
        enable: {
          loading: "Включение функции клиентов...",
          success: {
            title: "Вы включили функцию клиентов для этого рабочего пространства.",
            message:
              "Теперь участники могут добавлять записи о клиентах, связывать их с рабочими элементами и многое другое.",
          },
          error: {
            title: "Не удалось включить функцию клиентов.",
            message:
              "Попробуйте снова или вернитесь на эту страницу позже. Если проблема сохраняется, обратитесь в поддержку.",
            action: "Обратитесь в поддержку",
          },
        },
        disable: {
          loading: "Отключение функции клиентов...",
          success: {
            title: "Клиенты отключены",
            message: "Функция клиентов была успешно отключена!",
          },
          error: {
            title: "Ошибка",
            message: "Не удалось отключить функцию клиентов!",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "Не удалось получить список клиентов.",
          message: "Попробуйте снова или обновите эту страницу.",
        },
      },
      copy_link: {
        title: "Вы скопировали прямую ссылку на этого клиента.",
        message: "Вставьте ее в любое место, и она перенаправит вас прямо сюда.",
      },
      create: {
        success: {
          title: "{customer_name} теперь доступен",
          message: "Вы можете ссылаться на этого клиента в рабочих элементах и отслеживать запросы от него.",
          actions: {
            view: "Посмотреть",
            copy_link: "Скопировать ссылку",
            copied: "Скопировано!",
          },
        },
        error: {
          title: "Не удалось создать этот рекорд.",
          message:
            "Попробуйте сохранить его снова или скопируйте незасохраненный текст в новую запись, желательно в другой вкладке.",
        },
      },
      update: {
        success: {
          title: "Успех!",
          message: "Клиент успешно обновлен!",
        },
        error: {
          title: "Ошибка!",
          message: "Не удалось обновить клиента. Попробуйте снова!",
        },
      },
      logo: {
        error: {
          title: "Не удалось загрузить логотип клиента.",
          message: "Попробуйте снова сохранить логотип или начните заново.",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "Вы удалили рабочий элемент из этого клиентского рекорда.",
            message: "Мы также автоматически удалили этого клиента из рабочего элемента.",
          },
          error: {
            title: "Ошибка!",
            message: "Не удалось удалить этот рабочий элемент из записи клиента.",
          },
        },
        add: {
          error: {
            title: "Не удалось добавить этот рабочий элемент в этот клиентский рекорд.",
            message:
              "Попробуйте добавить элемент снова или вернитесь позже. Если ошибка сохраняется, обратитесь в поддержку.",
          },
          success: {
            title: "Вы добавили рабочий элемент в этот клиентский рекорд.",
            message: "Мы также автоматически добавили этого клиента в рабочий элемент.",
          },
        },
      },
    },
    quick_actions: {
      edit: "Изменить",
      copy_link: "Скопировать ссылку на клиента",
      delete: "Удалить",
    },
    create: {
      label: "Создать запись о клиенте",
      loading: "Создание в процессе",
      cancel: "Отмена",
    },
    update: {
      label: "Обновить клиента",
      loading: "Обновление в процессе",
    },
    delete: {
      title: "Вы уверены, что хотите удалить запись о клиенте {customer_name}?",
      description:
        "Все данные, связанные с этой записью, будут удалены навсегда. Вы не сможете восстановить эту запись позже.",
    },
    requests: {
      empty_state: {
        list: {
          title: "Пока нет запросов для отображения.",
          description: "Создайте запросы от ваших клиентов, чтобы связать их с рабочими элементами.",
          button: "Добавить новый запрос",
        },
        search: {
          title: "Похоже, у вас нет запросов, соответствующих этому термину.",
          description:
            "Попробуйте другой поисковый запрос или свяжитесь с нами, если уверены, что должны видеть результаты для этого термина.",
        },
      },
      label: "{count, plural, one {Запрос} other {Запросы}}",
      add: "Добавить запрос",
      create: "Создать запрос",
      update: "Обновить запрос",
      form: {
        name: {
          placeholder: "Назначьте имя этому запросу",
          validation: {
            required: "Имя обязательно.",
            max_length: "Имя запроса не должно превышать 255 символов.",
          },
        },
        description: {
          placeholder: "Опишите суть запроса или вставьте комментарий от этого клиента из другого инструмента.",
        },
        source: {
          add: "Добавить источник",
          update: "Обновить источник",
          url: {
            label: "URL",
            required: "URL обязателен",
            invalid: "Некорректный URL веб-сайта",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "Ссылка скопирована",
          message: "Ссылка на запрос клиента была скопирована в буфер обмена.",
        },
        attachment: {
          upload: {
            loading: "Загрузка вложения...",
            success: {
              title: "Вложение загружено",
              message: "Вложение было успешно загружено.",
            },
            error: {
              title: "Не удалось загрузить вложение",
              message: "Не удалось загрузить вложение.",
            },
          },
          size: {
            error: {
              title: "Ошибка!",
              message: "Можно загрузить только один файл за раз.",
            },
          },
          length: {
            message: "Размер файла должен быть {size} МБ или меньше",
          },
          remove: {
            success: {
              title: "Вложение удалено",
              message: "Вложение было успешно удалено",
            },
            error: {
              title: "Не удалось удалить вложение",
              message: "Не удалось удалить вложение",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "Успех!",
              message: "Источник успешно обновлен!",
            },
            error: {
              title: "Ошибка!",
              message: "Не удалось обновить источник.",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "Ошибка!",
              message: "Не удалось добавить рабочие элементы в запрос. Попробуйте снова.",
            },
            success: {
              title: "Успех!",
              message: "Рабочие элементы добавлены в запрос.",
            },
          },
        },
        update: {
          success: {
            message: "Запрос успешно обновлен!",
            title: "Успех!",
          },
          error: {
            title: "Ошибка!",
            message: "Не удалось обновить запрос. Попробуйте снова!",
          },
        },
        create: {
          success: {
            message: "Запрос успешно создан!",
            title: "Успех!",
          },
          error: {
            title: "Ошибка!",
            message: "Не удалось создать запрос. Попробуйте снова!",
          },
        },
      },
    },
    linked_work_items: {
      label: "Связанные рабочие элементы",
      link: "Связать рабочие элементы",
      empty_state: {
        list: {
          title: "Похоже, вы еще не связали рабочие элементы с этим клиентом.",
          description:
            "Свяжите существующие рабочие элементы из любого проекта здесь, чтобы отслеживать их для этого клиента.",
          button: "Связать рабочий элемент",
        },
      },
      action: {
        remove_epic: "Удалить эпопею",
        remove: "Удалить рабочий элемент",
      },
    },
    sidebar: {
      properties: "Свойства",
    },
  },
  templates: {
    settings: {
      title: "Шаблоны",
      description:
        "Сэкономьте 80% времени, затрачиваемого на создание проектов, рабочих элементов и страниц, используя шаблоны.",
      options: {
        project: {
          label: "Шаблоны проектов",
        },
        work_item: {
          label: "Шаблоны рабочих элементов",
        },
        page: {
          label: "Шаблоны страниц",
        },
      },
      create_template: {
        label: "Создать шаблон",
        no_permission: {
          project: "Обратитесь к администратору проекта для создания шаблонов",
          workspace: "Обратитесь к администратору рабочего пространства для создания шаблонов",
        },
      },
      use_template: {
        button: {
          default: "Использовать шаблон",
          loading: "Использование",
        },
      },
      template_source: {
        workspace: {
          info: "Из рабочего пространства",
        },
        project: {
          info: "Из проекта",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "Назовите ваш шаблон проекта.",
              validation: {
                required: "Название шаблона обязательно",
                maxLength: "Название шаблона должно быть менее 255 символов",
              },
            },
            description: {
              placeholder: "Опишите, когда и как использовать этот шаблон.",
            },
          },
          name: {
            placeholder: "Назовите ваш проект.",
            validation: {
              required: "Название проекта обязательно",
              maxLength: "Название проекта должно быть менее 255 символов",
            },
          },
          description: {
            placeholder: "Опишите цель и задачи этого проекта.",
          },
          button: {
            create: "Создать шаблон проекта",
            update: "Обновить шаблон проекта",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "Назовите ваш шаблон рабочего элемента.",
              validation: {
                required: "Название шаблона обязательно",
                maxLength: "Название шаблона должно быть менее 255 символов",
              },
            },
            description: {
              placeholder: "Опишите, когда и как использовать этот шаблон.",
            },
          },
          name: {
            placeholder: "Дайте название этому рабочему элементу.",
            validation: {
              required: "Название рабочего элемента обязательно",
              maxLength: "Название рабочего элемента должно быть менее 255 символов",
            },
          },
          description: {
            placeholder:
              "Опишите этот рабочий элемент так, чтобы было понятно, чего вы достигнете, когда выполните его.",
          },
          button: {
            create: "Создать шаблон рабочего элемента",
            update: "Обновить шаблон рабочего элемента",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "Назовите ваш шаблон страницы.",
              validation: {
                required: "Название шаблона обязательно",
                maxLength: "Название шаблона должно быть менее 255 символов",
              },
            },
            description: {
              placeholder: "Опишите, когда и как использовать этот шаблон.",
            },
          },
          name: {
            placeholder: "Неизвестная страница",
            validation: {
              maxLength: "Название страницы должно быть менее 255 символов",
            },
          },
          button: {
            create: "Создать шаблон страницы",
            update: "Обновить шаблон страницы",
          },
        },
        publish: {
          action: "{isPublished, select, true {Настройки публикации} other {Опубликовать в Маркетплейсе}}",
          unpublish_action: "Удалить из Маркетплейса",
          title: "Сделайте ваш шаблон доступным и узнаваемым.",
          name: {
            label: "Название шаблона",
            placeholder: "Назовите ваш шаблон",
            validation: {
              required: "Название шаблона обязательно",
              maxLength: "Название шаблона должно быть менее 255 символов",
            },
          },
          short_description: {
            label: "Краткое описание",
            placeholder:
              "Этот шаблон идеален для менеджеров проектов, которые управляют несколькими проектами одновременно.",
            validation: {
              required: "Краткое описание обязательно",
            },
          },
          description: {
            label: "Описание",
            placeholder: `Повысьте продуктивность и оптимизируйте коммуникацию с помощью нашей интеграции Речь-в-Текст.
• Транскрипция в реальном времени: мгновенно преобразуйте произнесенные слова в точный текст.
• Создание задач и комментариев: добавляйте задачи, описания и комментарии с помощью голосовых команд.`,
            validation: {
              required: "Описание обязательно",
            },
          },
          category: {
            label: "Категория",
            placeholder: "Выберите, где вы считаете, что это лучше всего подходит. Вы можете выбрать несколько.",
            validation: {
              required: "Хотя бы одна категория обязательна",
            },
          },
          keywords: {
            label: "Ключевые слова",
            placeholder:
              "Используйте термины, которые, по вашему мнению, будут использовать пользователи при поиске этого шаблона.",
            helperText:
              "Введите ключевые слова, разделенные запятыми, которые, по вашему мнению, помогут пользователям найти этот шаблон из поиска.",
            validation: {
              required: "Хотя бы одно ключевое слово обязательно",
            },
          },
          company_name: {
            label: "Название компании",
            placeholder: "Plane",
            validation: {
              required: "Название компании обязательно",
              maxLength: "Название компании должно быть менее 255 символов",
            },
          },
          contact_email: {
            label: "Email поддержки",
            placeholder: "help@plane.so",
            validation: {
              invalid: "Некорректный email адрес",
              required: "Email поддержки обязателен",
              maxLength: "Email поддержки должен быть менее 255 символов",
            },
          },
          privacy_policy_url: {
            label: "Ссылка на вашу политику конфиденциальности",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "Некорректный URL",
              maxLength: "URL должен быть менее 800 символов",
            },
          },
          terms_of_service_url: {
            label: "Ссылка на ваши условия использования",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "Некорректный URL",
              maxLength: "URL должен быть менее 800 символов",
            },
          },
          cover_image: {
            label: "Добавьте обложку, которая будет отображаться в маркетплейсе",
            upload_title: "Загрузить обложку",
            upload_placeholder: "Нажмите для загрузки или перетащите файл для загрузки обложки",
            drop_here: "Перетащите сюда",
            click_to_upload: "Нажмите для загрузки",
            invalid_file_or_exceeds_size_limit:
              "Неверный файл или превышен лимит размера. Пожалуйста, попробуйте снова.",
            upload_and_save: "Загрузить и сохранить",
            uploading: "Загрузка",
            remove: "Удалить",
            removing: "Удаление",
            validation: {
              required: "Обложка обязательна",
            },
          },
          attach_screenshots: {
            label: "Включите документы и изображения, которые, по вашему мнению, помогут зрителям этого шаблона.",
            validation: {
              required: "Хотя бы один скриншот обязателен",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "Шаблоны",
        description:
          "С шаблонами проектов, рабочих элементов и страниц в Plane вам не нужно создавать проект с нуля или вручную устанавливать свойства рабочих элементов.",
        sub_description: "Верните 80% времени администрирования, используя Шаблоны.",
      },
      no_templates: {
        button: "Создайте ваш первый шаблон",
      },
      no_labels: {
        description:
          "Еще нет меток. Создайте метки, чтобы помочь организовать и фильтровать элементы работы в вашем проекте.",
      },
      no_work_items: {
        description: "Еще нет элементов работы. Добавьте один, чтобы лучше структурировать свою работу.",
      },
      no_sub_work_items: {
        description: "Еще нет под-элементов работы. Добавьте один, чтобы лучше структурировать свою работу.",
      },
      page: {
        no_templates: {
          title: "Нет шаблонов, к которым у вас есть доступ.",
          description: "Пожалуйста, создайте шаблон",
        },
        no_results: {
          title: "Это не соответствует шаблону.",
          description: "Попробуйте поиск по другим терминам.",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "Шаблон создан",
          message: "{templateName}, шаблон {templateType}, теперь доступен для вашего рабочего пространства.",
        },
        error: {
          title: "Мы не смогли создать этот шаблон в этот раз.",
          message:
            "Попробуйте сохранить ваши данные снова или скопируйте их в новый шаблон, предпочтительно в другой вкладке.",
        },
      },
      update: {
        success: {
          title: "Шаблон изменен",
          message: "{templateName}, шаблон {templateType}, был изменен.",
        },
        error: {
          title: "Мы не смогли сохранить изменения в этом шаблоне.",
          message:
            "Попробуйте сохранить ваши данные снова или вернитесь к этому шаблону позже. Если проблема не исчезнет, свяжитесь с нами.",
        },
      },
      delete: {
        success: {
          title: "Шаблон удален",
          message: "{templateName}, шаблон {templateType}, был удален из вашего рабочего пространства.",
        },
        error: {
          title: "Мы не смогли удалить этот шаблон в этот раз.",
          message:
            "Попробуйте удалить его снова или вернитесь к нему позже. Если вы не сможете удалить его и тогда, свяжитесь с нами.",
        },
      },
      unpublish: {
        success: {
          title: "Шаблон снят с публикации",
          message: "{templateName}, шаблон {templateType}, был снят с публикации.",
        },
        error: {
          title: "Мы не смогли снять этот шаблон с публикации в этот раз.",
          message:
            "Попробуйте снять его с публикации снова или вернитесь к нему позже. Если вы не сможете снять его с публикации и тогда, свяжитесь с нами.",
        },
      },
    },
    delete_confirmation: {
      title: "Удалить шаблон",
      description: {
        prefix: "Вы уверены, что хотите удалить шаблон-",
        suffix: "? Все данные, связанные с шаблоном, будут безвозвратно удалены. Это действие нельзя отменить.",
      },
    },
    unpublish_confirmation: {
      title: "Снять шаблон с публикации",
      description: {
        prefix: "Вы уверены, что хотите снять шаблон-",
        suffix: " с публикации? Этот шаблон больше не будет доступен пользователям в маркетплейсе.",
      },
    },
    dropdown: {
      add: {
        work_item: "Добавить новый шаблон",
        project: "Добавить новый шаблон",
      },
      label: {
        project: "Выберите шаблон проекта",
        page: "Выбрать из шаблона",
      },
      tooltip: {
        work_item: "Выбрать шаблон элемента работы",
      },
      no_results: {
        work_item: "Шаблоны не найдены.",
        project: "Шаблоны не найдены.",
      },
    },
  },
  intake_forms: {
    create: {
      title: "Создать рабочий элемент",
      "sub-title": "Сообщите команде, над чем вы хотели бы, чтобы они работали.",
      name: "Имя",
      email: "Эл. почта",
      about: "О чём этот рабочий элемент?",
      description: "Опишите, что должно произойти",
      description_placeholder:
        "Добавьте столько деталей, сколько нужно, чтобы команда поняла вашу ситуацию и потребности.",
      loading: "Создание",
      create_work_item: "Создать рабочий элемент",
      errors: {
        name: "Имя обязательно",
        name_max_length: "Имя должно быть не длиннее 255 символов",
        email: "Эл. почта обязательна",
        email_invalid: "Недопустимый адрес эл. почты",
        title: "Название обязательно",
        title_max_length: "Название должно быть не длиннее 255 символов",
      },
    },
    success: {
      title: "Ваш рабочий элемент добавлен в очередь команды.",
      description: "Команда может одобрить или отклонить этот элемент в очереди приёма.",
      primary_button: {
        text: "Добавить другой рабочий элемент",
      },
      secondary_button: {
        text: "Подробнее о приёме",
      },
    },
    how_it_works: {
      title: "Как это работает?",
      heading: "Это форма приёма.",
      description:
        "Приём — функция Plane, позволяющая администраторам и менеджерам проектов получать рабочие элементы извне в свои проекты.",
      steps: {
        step_1: "Эта короткая форма позволяет создать новый рабочий элемент в проекте Plane.",
        step_2: "После отправки формы в приёме этого проекта создаётся новый рабочий элемент.",
        step_3: "Кто-то из проекта или команды проверит его.",
        step_4: "При одобрении элемент переместится в рабочую очередь проекта. Иначе он будет отклонён.",
        step_5:
          "Чтобы узнать статус элемента, свяжитесь с менеджером проекта, администратором или с тем, кто прислал ссылку на эту страницу.",
      },
    },
    type_forms: {
      select_types: {
        title: "Выбрать тип рабочего элемента",
        search_placeholder: "Поиск типа рабочего элемента",
      },
      actions: {
        select_properties: "Выбрать свойства",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "Повторяющиеся рабочие элементы",
      description:
        "Настройте повторяющиеся рабочие элементы один раз, и мы позаботимся о повторениях. Вы увидите все здесь, когда придет время.",
      new_recurring_work_item: "Новый повторяющийся рабочий элемент",
      update_recurring_work_item: "Обновить повторяющийся рабочий элемент",
      form: {
        interval: {
          title: "Расписание",
          start_date: {
            validation: {
              required: "Требуется дата начала",
            },
          },
          interval_type: {
            validation: {
              required: "Требуется тип интервала",
            },
          },
        },
        button: {
          create: "Создать повторяющийся рабочий элемент",
          update: "Обновить повторяющийся рабочий элемент",
        },
      },
      create_button: {
        label: "Создать повторяющийся рабочий элемент",
        no_permission: "Обратитесь к администратору проекта для создания повторяющихся рабочих элементов",
      },
    },
    empty_state: {
      upgrade: {
        title: "Ваша работа на автопилоте",
        description:
          "Настройте один раз. Мы вернем это, когда придет время. Обновите до Business, чтобы сделать повторяющуюся работу легкой.",
      },
      no_templates: {
        button: "Создайте свой первый повторяющийся рабочий элемент",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Повторяющийся рабочий элемент создан",
          message: "{name}, повторяющийся рабочий элемент, теперь доступен в вашем рабочем пространстве.",
        },
        error: {
          title: "Не удалось создать повторяющийся рабочий элемент.",
          message:
            "Попробуйте сохранить данные еще раз или скопируйте их в новый повторяющийся рабочий элемент, желательно в другой вкладке.",
        },
      },
      update: {
        success: {
          title: "Повторяющийся рабочий элемент изменен",
          message: "{name}, повторяющийся рабочий элемент, был изменен.",
        },
        error: {
          title: "Не удалось сохранить изменения в этом повторяющемся рабочем элементе.",
          message:
            "Попробуйте сохранить данные еще раз или вернитесь к этому повторяющемуся рабочему элементу позже. Если проблема сохраняется, свяжитесь с нами.",
        },
      },
      delete: {
        success: {
          title: "Повторяющийся рабочий элемент удалён",
          message: "{name}, повторяющийся рабочий элемент, был удалён из вашего рабочего пространства.",
        },
        error: {
          title: "Не удалось удалить повторяющийся рабочий элемент.",
          message: "Попробуйте удалить его снова или вернитесь позже. Если не удаётся удалить, свяжитесь с нами.",
        },
      },
    },
    delete_confirmation: {
      title: "Удалить повторяющийся рабочий элемент",
      description: {
        prefix: "Вы уверены, что хотите удалить повторяющийся рабочий элемент-",
        suffix:
          "? Все данные, связанные с этим повторяющимся рабочим элементом, будут безвозвратно удалены. Это действие нельзя отменить.",
      },
    },
  },
  automations: {
    settings: {
      title: "Пользовательские автоматизации",
      create_automation: "Создать автоматизацию",
    },
    scope: {
      label: "Область",
      run_on: "Запускать на",
    },
    trigger: {
      label: "Триггер",
      add_trigger: "Добавить триггер",
      sidebar_header: "Настройка триггера",
      input_label: "Какой триггер для этой автоматизации?",
      input_placeholder: "Выберите опцию",
      section_plane_events: "События Plane",
      section_time_based: "По времени",
      fixed_schedule: "Фиксированное расписание",
      schedule: {
        frequency: "Частота",
        select_day: "Выбрать день",
        day_of_month: "День месяца",
        monthly_every: "Каждый",
        monthly_day_aria: "День {day}",
        time: "Время",
        hour: "Час",
        minute: "Минута",
        hour_suffix: "ч",
        minute_suffix: "мин",
        am: "AM",
        pm: "PM",
        timezone: "Часовой пояс",
        timezone_placeholder: "Выберите часовой пояс",
        frequency_daily: "Ежедневно",
        frequency_weekly: "Еженедельно",
        frequency_monthly: "Ежемесячно",
        on: "В",
        validation_weekly_day_required: "Выберите хотя бы один день недели.",
        validation_monthly_date_required: "Выберите день месяца.",
        main_content_schedule_summary_daily: "Каждый день в {time} ({timezone}).",
        main_content_schedule_summary_weekly: "Каждую неделю в {days} в {time} ({timezone}).",
        main_content_schedule_summary_monthly: "Каждый месяц в день {day} в {time} ({timezone}).",
        schedule_mode: "Режим расписания",
        schedule_mode_fixed: "Фиксированный",
        schedule_mode_cron: "Cron",
        cron_expression_label: "Введите Cron-выражение",
        cron_expression_placeholder: "0 9 * * 1-5",
        cron_invalid: "Недопустимое Cron-выражение.",
        cron_preview: 'Это Cron-выражение запускает "{description}".',
        main_content_cron_summary: "{description} ({timezone}).",
      },
      button: {
        previous: "Назад",
        next: "Добавить действие",
      },
    },
    condition: {
      label: "Условие",
      add_condition: "Добавить условие",
      adding_condition: "Добавление условия",
    },
    action: {
      label: "Действие",
      add_action: "Добавить действие",
      sidebar_header: "Действия",
      input_label: "Что делает автоматизация?",
      input_placeholder: "Выберите опцию",
      handler_name: {
        add_comment: "Добавить комментарий",
        change_property: "Изменить свойство",
      },
      configuration: {
        label: "Конфигурация",
        change_property: {
          placeholders: {
            property_name: "Выберите свойство",
            change_type: "Выберите",
            property_value_select: "{count, plural, one{Выберите значение} other{Выберите значения}}",
            property_value_select_date: "Выберите дату",
          },
          validation: {
            property_name_required: "Название свойства обязательно",
            change_type_required: "Тип изменения обязателен",
            property_value_required: "Значение свойства обязательно",
          },
        },
      },
      comment_block: {
        title: "Добавить комментарий",
      },
      change_property_block: {
        title: "Изменить свойство",
      },
      validation: {
        delete_only_action: "Отключите автоматизацию перед удалением её единственного действия.",
      },
    },
    conjunctions: {
      and: "И",
      or: "Или",
      if: "Если",
      then: "Тогда",
    },
    enable: {
      alert:
        "Нажмите 'Включить', когда ваша автоматизация будет готова. После включения автоматизация будет готова к запуску.",
      validation: {
        required: "Автоматизация должна иметь триггер и хотя бы одно действие для включения.",
      },
    },
    delete: {
      validation: {
        enabled: "Автоматизация должна быть отключена перед удалением.",
      },
    },
    table: {
      title: "Название автоматизации",
      last_run_on: "Последний запуск",
      created_on: "Создано",
      last_updated_on: "Последнее обновление",
      last_run_status: "Статус последнего запуска",
      average_duration: "Средняя продолжительность",
      owner: "Владелец",
      executions: "Выполнения",
    },
    create_modal: {
      heading: {
        create: "Создать автоматизацию",
        update: "Обновить автоматизацию",
      },
      title: {
        placeholder: "Назовите вашу автоматизацию.",
        required_error: "Название обязательно",
      },
      description: {
        placeholder: "Опишите вашу автоматизацию.",
      },
      submit_button: {
        create: "Создать автоматизацию",
        update: "Обновить автоматизацию",
      },
    },
    delete_modal: {
      heading: "Удалить автоматизацию",
    },
    activity: {
      filters: {
        show_fails: "Показать ошибки",
        all: "Все",
        only_activity: "Только активность",
        only_run_history: "Только история запусков",
      },
      run_history: {
        initiator: "Инициатор",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Успешно!",
          message: "Автоматизация успешно создана.",
        },
        error: {
          title: "Ошибка!",
          message: "Не удалось создать автоматизацию.",
        },
      },
      update: {
        success: {
          title: "Успешно!",
          message: "Автоматизация успешно обновлена.",
        },
        error: {
          title: "Ошибка!",
          message: "Не удалось обновить автоматизацию.",
        },
      },
      enable: {
        success: {
          title: "Успешно!",
          message: "Автоматизация успешно включена.",
        },
        error: {
          title: "Ошибка!",
          message: "Не удалось включить автоматизацию.",
        },
      },
      disable: {
        success: {
          title: "Успешно!",
          message: "Автоматизация успешно отключена.",
        },
        error: {
          title: "Ошибка!",
          message: "Не удалось отключить автоматизацию.",
        },
      },
      delete: {
        success: {
          title: "Автоматизация удалена",
          message: "{name}, автоматизация, была удалена из вашего проекта.",
        },
        error: {
          title: "Не удалось удалить эту автоматизацию.",
          message: "Попробуйте удалить её снова или вернитесь позже. Если не удаётся удалить, свяжитесь с нами.",
        },
      },
      action: {
        create: {
          error: {
            title: "Ошибка!",
            message: "Не удалось создать действие. Пожалуйста, попробуйте снова!",
          },
        },
        update: {
          error: {
            title: "Ошибка!",
            message: "Не удалось обновить действие. Пожалуйста, попробуйте снова!",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "Пока нет автоматизаций для отображения.",
        description:
          "Автоматизации помогают устранить повторяющиеся задачи, устанавливая триггеры, условия и действия. Создайте одну, чтобы сэкономить время и поддерживать работу без усилий.",
      },
      upgrade: {
        title: "Автоматизации",
        description: "Автоматизации - это способ автоматизировать задачи в вашем проекте.",
        sub_description: "Верните 80% своего административного времени, используя Автоматизации.",
      },
    },
  },
  sso: {
    header: "Идентичность",
    description: "Настройте свой домен для доступа к функциям безопасности, включая единый вход.",
    domain_management: {
      header: "Управление доменами",
      verified_domains: {
        header: "Проверенные домены",
        description: "Подтвердите право собственности на домен электронной почты, чтобы включить единый вход.",
        button_text: "Добавить домен",
        list: {
          domain_name: "Имя домена",
          status: "Статус",
          status_verified: "Проверено",
          status_failed: "Не удалось",
          status_pending: "Ожидает",
        },
        add_domain: {
          title: "Добавить домен",
          description: "Добавьте свой домен для настройки SSO и его проверки.",
          form: {
            domain_label: "Домен",
            domain_placeholder: "plane.so",
            domain_required: "Домен обязателен",
            domain_invalid: "Введите действительное имя домена (например, plane.so)",
          },
          primary_button_text: "Добавить домен",
          primary_button_loading_text: "Добавление",
          toast: {
            success_title: "Успех!",
            success_message: "Домен успешно добавлен. Пожалуйста, проверьте его, добавив запись DNS TXT.",
            error_message: "Не удалось добавить домен. Пожалуйста, попробуйте снова.",
          },
        },
        verify_domain: {
          title: "Проверьте свой домен",
          description: "Выполните следующие шаги, чтобы проверить свой домен.",
          instructions: {
            label: "Инструкции",
            step_1: "Перейдите в настройки DNS для вашего хостинг-провайдера домена.",
            step_2: {
              part_1: "Создайте",
              part_2: "запись TXT",
              part_3: "и вставьте полное значение записи, указанное ниже.",
            },
            step_3: "Это обновление обычно занимает несколько минут, но может занять до 72 часов.",
            step_4: 'Нажмите "Проверить домен", чтобы подтвердить после обновления записи DNS.',
          },
          verification_code_label: "Значение записи TXT",
          verification_code_description: "Добавьте эту запись в настройки DNS",
          domain_label: "Домен",
          primary_button_text: "Проверить домен",
          primary_button_loading_text: "Проверка",
          secondary_button_text: "Сделаю это позже",
          toast: {
            success_title: "Успех!",
            success_message: "Домен успешно проверен.",
            error_message: "Не удалось проверить домен. Пожалуйста, попробуйте снова.",
          },
        },
        delete_domain: {
          title: "Удалить домен",
          description: {
            prefix: "Вы уверены, что хотите удалить",
            suffix: "? Это действие нельзя отменить.",
          },
          primary_button_text: "Удалить",
          primary_button_loading_text: "Удаление",
          secondary_button_text: "Отмена",
          toast: {
            success_title: "Успех!",
            success_message: "Домен успешно удален.",
            error_message: "Не удалось удалить домен. Пожалуйста, попробуйте снова.",
          },
        },
      },
    },
    providers: {
      header: "Единый вход",
      disabled_message: "Добавьте проверенный домен для настройки SSO",
      configure: {
        create: "Настроить",
        update: "Редактировать",
      },
      switch_alert_modal: {
        title: "Переключить метод SSO на {newProviderShortName}?",
        content:
          "Вы собираетесь включить {newProviderLongName} ({newProviderShortName}). Это действие автоматически отключит {activeProviderLongName} ({activeProviderShortName}). Пользователи, пытающиеся войти через {activeProviderShortName}, больше не смогут получить доступ к платформе, пока не переключатся на новый метод. Вы уверены, что хотите продолжить?",
        primary_button_text: "Переключить",
        primary_button_text_loading: "Переключение",
        secondary_button_text: "Отмена",
      },
      form_section: {
        title: "Детали, предоставленные IdP для {workspaceName}",
      },
      form_action_buttons: {
        saving: "Сохранение",
        save_changes: "Сохранить изменения",
        configure_only: "Только настройка",
        configure_and_enable: "Настроить и включить",
        default: "Сохранить",
      },
      setup_details_section: {
        title: "{workspaceName} детали, предоставленные для вашего IdP",
        button_text: "Получить детали настройки",
      },
      saml: {
        header: "Включить SAML",
        description: "Настройте своего поставщика удостоверений SAML для включения единого входа.",
        configure: {
          title: "Включить SAML",
          description:
            "Подтвердите право собственности на домен электронной почты для доступа к функциям безопасности, включая единый вход.",
          toast: {
            success_title: "Успех!",
            create_success_message: "Поставщик SAML успешно создан.",
            update_success_message: "Поставщик SAML успешно обновлен.",
            error_title: "Ошибка!",
            error_message: "Не удалось сохранить поставщика SAML. Пожалуйста, попробуйте снова.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Веб-детали",
            entity_id: {
              label: "ID сущности | Аудитория | Информация о метаданных",
              description:
                "Мы сгенерируем эту часть метаданных, которая идентифицирует это приложение Plane как авторизованный сервис в вашем IdP.",
            },
            callback_url: {
              label: "URL единого входа",
              description: "Мы сгенерируем это для вас. Добавьте это в поле URL перенаправления входа вашего IdP.",
            },
            logout_url: {
              label: "URL единого выхода",
              description:
                "Мы сгенерируем это для вас. Добавьте это в поле URL перенаправления единого выхода вашего IdP.",
            },
          },
          mobile_details: {
            header: "Мобильные детали",
            entity_id: {
              label: "ID сущности | Аудитория | Информация о метаданных",
              description:
                "Мы сгенерируем эту часть метаданных, которая идентифицирует это приложение Plane как авторизованный сервис в вашем IdP.",
            },
            callback_url: {
              label: "URL единого входа",
              description: "Мы сгенерируем это для вас. Добавьте это в поле URL перенаправления входа вашего IdP.",
            },
            logout_url: {
              label: "URL единого выхода",
              description: "Мы сгенерируем это для вас. Добавьте это в поле URL перенаправления выхода вашего IdP.",
            },
          },
          mapping_table: {
            header: "Детали сопоставления",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "Включить OIDC",
        description: "Настройте своего поставщика удостоверений OIDC для включения единого входа.",
        configure: {
          title: "Включить OIDC",
          description:
            "Подтвердите право собственности на домен электронной почты для доступа к функциям безопасности, включая единый вход.",
          toast: {
            success_title: "Успех!",
            create_success_message: "Поставщик OIDC успешно создан.",
            update_success_message: "Поставщик OIDC успешно обновлен.",
            error_title: "Ошибка!",
            error_message: "Не удалось сохранить поставщика OIDC. Пожалуйста, попробуйте снова.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Веб-детали",
            origin_url: {
              label: "URL источника",
              description:
                "Мы сгенерируем это для этого приложения Plane. Добавьте это как доверенный источник в соответствующее поле вашего IdP.",
            },
            callback_url: {
              label: "URL перенаправления",
              description: "Мы сгенерируем это для вас. Добавьте это в поле URL перенаправления входа вашего IdP.",
            },
            logout_url: {
              label: "URL выхода",
              description: "Мы сгенерируем это для вас. Добавьте это в поле URL перенаправления выхода вашего IdP.",
            },
          },
          mobile_details: {
            header: "Мобильные детали",
            origin_url: {
              label: "URL источника",
              description:
                "Мы сгенерируем это для этого приложения Plane. Добавьте это как доверенный источник в соответствующее поле вашего IdP.",
            },
            callback_url: {
              label: "URL перенаправления",
              description: "Мы сгенерируем это для вас. Добавьте это в поле URL перенаправления входа вашего IdP.",
            },
            logout_url: {
              label: "URL выхода",
              description: "Мы сгенерируем это для вас. Добавьте это в поле URL перенаправления выхода вашего IdP.",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "Название проекта не может содержать специальные символы.",
  pql: {
    functions: {
      date: {
        now: {
          description: "Текущая дата и время",
        },
        today: {
          description: "Сегодняшняя дата",
        },
        start_of_day: {
          description: "Начало сегодняшнего дня",
        },
        end_of_day: {
          description: "Конец сегодняшнего дня",
        },
        start_of_week: {
          description: "Начало текущей недели",
        },
        end_of_week: {
          description: "Конец текущей недели",
        },
        start_of_month: {
          description: "Начало текущего месяца",
        },
        end_of_month: {
          description: "Конец текущего месяца",
        },
        start_of_year: {
          description: "Начало текущего года",
        },
        end_of_year: {
          description: "Конец текущего года",
        },
        days_ago: {
          description: "Дата n дней назад",
        },
        days_from_now: {
          description: "Дата через n дней",
        },
        weeks_ago: {
          description: "Дата n недель назад",
        },
        weeks_from_now: {
          description: "Дата через n недель",
        },
        months_ago: {
          description: "Дата n месяцев назад",
        },
        months_from_now: {
          description: "Дата через n месяцев",
        },
      },
      user: {
        current_user: {
          description: "Текущий авторизованный пользователь",
        },
        members_of: {
          description: 'Участники "project:<id>" или "teamspace:<id>"',
        },
        workspace_members: {
          description: "Все участники рабочего пространства",
        },
      },
      cycle: {
        active_cycle: {
          description: "Активный цикл сегодня",
        },
        completed_cycles: {
          description: "Циклы, дата окончания которых прошла",
        },
        upcoming_cycles: {
          description: "Циклы, дата начала которых в будущем",
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
          description: "Срок выполнения прошёл И статус открыт",
        },
        has_no_assignee: {
          description: "Рабочий элемент не имеет исполнителя",
        },
        has_no_label: {
          description: "Рабочий элемент не имеет меток",
        },
        is_top_level: {
          description: "Не является подрабочим элементом (нет родительского)",
        },
        is_sub_work_item: {
          description: "Является подрабочим элементом (есть родительский)",
        },
        is_epic: {
          description: "Эпик",
        },
        is_intake: {
          description: "Является входящим рабочим элементом",
        },
        is_draft: {
          description: "Является черновиком рабочего элемента",
        },
        is_archived: {
          description: "Заархивировано",
        },
        has_children: {
          description: "Имеет хотя бы один подрабочий элемент",
        },
        has_start_and_due_dates: {
          description: "Имеет дату начала и срок выполнения",
        },
      },
      relation: {
        linked_to: {
          description: "Рабочие элементы, связанные с данным элементом",
        },
        blocked_by: {
          description: "Рабочие элементы, заблокированные данным элементом",
        },
        blocks: {
          description: "Рабочие элементы, блокирующие данный элемент",
        },
        child_of: {
          description: "Подрабочие элементы данного элемента",
        },
        parent_of: {
          description: "Родительский рабочий элемент данного элемента",
        },
        duplicate_of: {
          description: "Рабочие элементы, отмеченные как дубликаты данного элемента",
        },
      },
      history: {
        was_ever: {
          description: "Поле когда-либо имело это значение",
        },
        was: {
          description: "Поле ранее имело это значение (изменено)",
        },
        changed_from: {
          description: "Поле было изменено с этого значения",
        },
        changed_to: {
          description: "Поле было изменено на это значение",
        },
        changed: {
          description: "Поле было изменено",
        },
        updated_by: {
          description: "Рабочий элемент обновлён этим пользователем",
        },
        commented_by: {
          description: "Рабочий элемент прокомментирован этим пользователем",
        },
        field_changed_by: {
          description: "Поле изменено этим пользователем",
        },
        was_assigned_to: {
          description: "Рабочий элемент назначен этому пользователю",
        },
        changed_after: {
          description: "Поле изменено после этой даты",
        },
        changed_before: {
          description: "Поле изменено до этой даты",
        },
        field_changed_after: {
          description: "Поле изменено после этой даты",
        },
        field_changed_before: {
          description: "Поле изменено до этой даты",
        },
        changed_to_after: {
          description: "Поле изменено на это значение после этой даты",
        },
        changed_to_before: {
          description: "Поле изменено на это значение до этой даты",
        },
        field_changed_between: {
          description: "Поле изменено между этими датами",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "навигация",
      accept: "принять",
      close: "закрыть",
      pick_date: "Выбрать дату",
    },
    placeholder: 'Введите запрос и нажмите "ENTER" для фильтрации...',
    error: "Ошибка при отправке запроса. Проверьте и попробуйте снова.",
  },
  releases: {
    label: "{count, plural, one {Релиз} other {Релизы}}",
    no_release: "Нет релиза",
    unreleased: "Не выпущен",
    select_releases: "Выбрать релизы",
    overview: "Обзор",
    scope: "Охват",
    page_title: {
      scope: "Релиз - {name} | Охват",
      scope_fallback: "Релиз | Охват",
    },
    properties: "Свойства",
    target_date: "Целевая дата",
    lead: "Ответственный",
    release_tag: "Тег",
    labels: "Метки",
    description_placeholder: "Добавьте описание...",
    progress: "Прогресс",
    completed_work_items: "Завершённые рабочие элементы",
    pending_work_items: "Ожидающие рабочие элементы",
    cancelled_work_items: "Отменённые рабочие элементы",
    scope_page: {
      work_items: "Рабочие элементы",
      add_work_items: "Добавить рабочие элементы",
      remove_from_release: "Убрать из релиза",
      empty_state: {
        title: "Нет рабочих элементов",
        description: "Добавьте рабочие элементы, чтобы определить охват релиза.",
      },
      confirm_remove: {
        content: "Убрать этот рабочий элемент из релиза? Он останется в проекте.",
        primary_button: {
          default: "Убрать",
          loading: "Удаление…",
        },
      },
    },
    empty_state: {
      title: "Область пока не задана",
      description: "Добавьте рабочие элементы в релиз, чтобы отслеживать их завершение для этого релиза.",
      add_scope: "Добавить область",
      not_found: {
        title: "Релиз не найден",
        description: "Релиз мог быть удалён.",
        primary_button: "Назад к релизам",
      },
    },
    toast: {
      work_items_added: "{count, plural, one {Рабочий элемент добавлен} other {Рабочие элементы добавлены}}",
      work_items_error: "Не удалось добавить рабочие элементы",
    },
    count_releases: "{count, plural, one {# релиз} other {# релизов}}",
    actions: {
      delete: "Удалить",
    },
    delete_modal: {
      title: "Удалить релиз",
      content: 'Вы уверены, что хотите удалить релиз "{releaseName}"? Это действие нельзя отменить.',
    },
    settings: {
      heading: {
        title: "Релизы",
        description: "Точно управляйте поставками проекта с помощью релизов.",
      },
      toggle: {
        title: "Включить релизы",
        description: "Участники рабочего пространства получат доступ только на просмотр этой области в своих проектах.",
      },
      toasts: {
        enable: {
          loading: "Включение релизов...",
          success: {
            title: "Релизы включены",
            message: "Релизы были включены для этого рабочего пространства.",
          },
          error: {
            title: "Ошибка",
            message: "Не удалось включить релизы. Пожалуйста, попробуйте снова.",
          },
        },
        disable: {
          loading: "Отключение релизов...",
          success: {
            title: "Релизы отключены",
            message: "Релизы были отключены для этого рабочего пространства.",
          },
          error: {
            title: "Ошибка",
            message: "Не удалось отключить релизы. Пожалуйста, попробуйте снова.",
          },
        },
      },
      tabs: {
        tags: "Теги релизов",
        labels: "Метки",
      },
      tags: {
        title: "Теги релизов",
        description: "Категоризируйте и фильтруйте свои релизы с помощью тегов.",
        add: "Добавить тег",
        empty_state: "Тегов пока нет. Создайте свой первый тег.",
        errors: {
          version_required: "Требуется версия.",
          version_already_exists: "Тег с этой версией уже существует.",
          generic: "Что-то пошло не так. Пожалуйста, попробуйте снова.",
        },
        delete_modal: {
          title: "Удалить тег",
          content: 'Вы уверены, что хотите удалить тег "{tagVersion}"? Это действие нельзя отменить.',
        },
        actions: {
          edit: "Редактировать тег",
          delete: "Удалить тег",
        },
        toasts: {
          delete: {
            success: "Тег успешно удалён.",
            error: "Не удалось удалить тег. Пожалуйста, попробуйте снова.",
          },
        },
      },
      labels: {
        title: "Метки",
        description: "Структурируйте и организуйте свои инициативы с помощью меток.",
        add: "Добавить метку",
        empty_state: "Меток пока нет. Создайте свою первую метку.",
        errors: {
          name_required: "Требуется название.",
          name_already_exists: "Метка с таким названием уже существует.",
          generic: "Что-то пошло не так. Пожалуйста, попробуйте снова.",
        },
        modal: {
          name_placeholder: "Название метки",
          pick_color: "Выберите цвет метки",
        },
        actions: {
          edit: "Редактировать метку",
          delete: "Удалить метку",
        },
        drag_to_reorder: "Перетащите, чтобы изменить порядок",
        delete_modal: {
          title: "Удалить метку",
          content: 'Вы уверены, что хотите удалить метку "{labelName}"? Это действие нельзя отменить.',
        },
        toasts: {
          delete: {
            success: "Метка успешно удалена.",
            error: "Не удалось удалить метку. Пожалуйста, попробуйте снова.",
          },
        },
      },
    },
  },
  work_item_type_hierarchy: {
    settings: {
      title: "Иерархия",
      tab_label: "Иерархия",
      description:
        "Настройте уровни иерархии для организации работы. Каждый уровень определяет родительскую связь с элементом непосредственно выше и дочернюю связь с элементом непосредственно ниже. ",
      sidebar_label: "Иерархия",
      enable_control: {
        title: "Включить иерархию",
        description: "Создавайте отношения родитель-потомок между различными типами рабочих элементов.",
        tooltip: "Вы не сможете отключить иерархию после её включения.",
      },
      workspace_work_item_types_disabled_banner: {
        content: "Сначала определите типы рабочих элементов для создания новой иерархии.",
        cta: "Настройки типов рабочих элементов",
      },
    },
    levels: {
      max_level_placeholder: "Добавить уровень иерархии",
      empty_level_placeholder: "Добавьте тип рабочего элемента на уровень {level}",
      empty_level_unauthorized: "Типы рабочих элементов на этом уровне не найдены.",
      drag_tooltip: "Перетащите для изменения уровня",
      quick_actions: {
        set_as_default: {
          label: "Установить по умолчанию",
          toast: {
            loading: "Установка по умолчанию...",
            success: {
              title: "Успех!",
              message: "Уровень иерархии {level} успешно установлен по умолчанию.",
            },
            error: {
              title: "Ошибка!",
              message: "Не удалось установить уровень иерархии {level} по умолчанию. Пожалуйста, попробуйте ещё раз.",
            },
          },
        },
      },
      add_to_level_toast: {
        loading: "Добавление {workItemTypeName} на уровень {level}...",
        success: {
          title: "Успешно!",
          message: "{workItemTypeName} успешно добавлен на уровень {level}.",
        },
        error: {
          title: "Ошибка!",
          message: "{workItemTypeName} не удалось добавить на уровень {level}, так как это нарушает правила иерархии.",
        },
      },
    },
    work_item_modal: {
      invalid_work_item_type_create_toast: {
        title: "Ошибка!",
        message:
          "Выбранный тип рабочего элемента не может использоваться для создания нового рабочего элемента, так как это нарушает правила иерархии.",
      },
      invalid_work_item_type_update_toast: {
        title: "Ошибка!",
        message: "Тип рабочего элемента не может быть обновлён, так как это нарушает правила иерархии.",
      },
    },
    work_item_type_modal: {
      level: "Уровень иерархии",
      invalid_level_toast: {
        title: "Ошибка!",
        message: "Тип рабочего элемента не может быть обновлён, так как это нарушает правила иерархии.",
      },
    },
  },
  page_actions: {
    move_page: {
      placeholders: {
        project_to_all_with_wiki: "Искать коллекции wiki, проекты и командные пространства",
        project_to_project_with_wiki: "Искать коллекции wiki и проекты",
        teamspace_to_all_with_wiki: "Искать коллекции wiki, проекты и командные пространства",
      },
      toasts: {
        collection_error: {
          title: "Перемещено в wiki",
          message:
            "Страница была перемещена в wiki, но её не удалось добавить в выбранную коллекцию. Она остаётся в General.",
        },
      },
    },
    remove_from_collection: {
      label: "Удалить из коллекции",
      success_message: "Страница удалена из коллекции.",
      error_message: "Не удалось удалить страницу из коллекции. Повторите попытку.",
    },
  },
  wiki_collections: {
    predefined: {
      general: "Общее",
      private: "Приватные",
      shared: "Общие",
      archived: "Архив",
    },
    fallback_name: "Коллекция",
    form: {
      name_required: "Название коллекции обязательно",
      name_max_length: "Название коллекции должно содержать менее 255 символов",
      name_placeholder_create: "Задайте название коллекции",
      name_placeholder_edit: "Название коллекции",
    },
    create_modal: {
      title: "Создать коллекцию",
      submit: "Создать коллекцию",
    },
    edit_modal: {
      title: "Редактировать коллекцию",
    },
    delete_modal: {
      title: "Удалить коллекцию",
      page_count: "В этой коллекции {pageCount} страниц. Выберите, что с ними сделать.",
      transfer_title: "Переместить страницы и удалить коллекцию",
      transfer_description:
        "Перед удалением переместите все страницы в другую коллекцию. Страницы и их права доступа будут сохранены.",
      transfer_warning: "Перемещённые страницы унаследуют права доступа выбранной коллекции.",
      transfer_target_label: "Переместить страницы в",
      transfer_target_placeholder: "Выберите коллекцию",
      delete_with_pages_title: "Удалить коллекцию вместе со страницами",
      delete_with_pages_description: "Навсегда удаляет коллекцию и все её страницы. Это действие нельзя отменить.",
      submit: "Удалить коллекцию",
    },
    header: {
      add_page: "Добавить страницу",
    },
    menu: {
      create_new_page: "Создать новую страницу",
      add_existing_page: "Добавить существующую страницу",
      edit_collection: "Редактировать коллекцию",
      collection_options: "Параметры коллекции",
    },
    add_existing_page_modal: {
      search_placeholder: "Поиск страниц",
      success_message: "В коллекцию добавлено страниц: {count}.",
      error_message: "Не удалось переместить страницы. Повторите попытку.",
      no_pages_found: "Не найдено страниц, соответствующих вашему запросу",
      no_pages_available: "Нет доступных страниц для перемещения",
      submit: "Переместить",
    },
    list: {
      invite_only: "Только по приглашению",
      remove_error: "Не удалось удалить страницу из коллекции.",
      no_matching_pages: "Нет подходящих страниц",
      remove_search_criteria: "Уберите условия поиска, чтобы увидеть все страницы",
      remove_filters: "Уберите фильтры, чтобы увидеть все страницы",
      no_pages_title: "Пока нет страниц",
      no_pages_description: "В этой коллекции пока нет страниц.",
      untitled: "Без названия",
      restricted_access: "Ограниченный доступ",
      collapse_page: "Свернуть страницу",
      expand_page: "Развернуть страницу",
      page_actions: "Действия со страницей",
      page_link_copied: "Ссылка на страницу скопирована в буфер обмена.",
      columns: {
        page_name: "Название страницы",
        owner: "Владелец",
        nested_pages: "Вложенные страницы",
        last_activity: "Последняя активность",
        actions: "Действия",
      },
    },
    toasts: {
      created: "Коллекция успешно создана.",
      create_error: "Не удалось создать коллекцию. Повторите попытку.",
      renamed: "Коллекция успешно переименована.",
      rename_error: "Не удалось обновить коллекцию. Повторите попытку.",
      transferred_deleted: "Страницы перенесены, коллекция удалена.",
      deleted_with_pages: "Коллекция и её страницы удалены.",
      delete_error: "Не удалось удалить коллекцию. Повторите попытку.",
      target_required: "Выберите коллекцию, в которую нужно перенести страницы.",
      create_page_error: "Не удалось создать страницу. Повторите попытку.",
      create_page_in_collection_error: "Не удалось создать страницу или добавить её в коллекцию. Повторите попытку.",
      collection_link_copied: "Ссылка на коллекцию скопирована в буфер обмена.",
    },
  },
} as const;
