export default {
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
  theme: "Тема",
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
  workspace: "Рабочее пространство",
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
  project_id_tooltip_content: "Помогает идентифицировать рабочие элементы в проекте. Макс. 10 символов.",
  description_placeholder: "Описание",
  only_alphanumeric_non_latin_characters_allowed: "Допускаются только буквенно-цифровые и нелатинские символы.",
  project_id_is_required: "Требуется ID проекта",
  project_id_allowed_char: "Допускаются только буквенно-цифровые и нелатинские символы.",
  project_id_min_char: "ID проекта должен содержать минимум 1 символ",
  project_id_max_char: "ID проекта должен содержать максимум 10 символов",
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
  pages: "Страницы",
  intake: "Предложения",
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
  discord: "Discord",
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
  priority: "Приоритет",
  none: "Нет",
  urgent: "Срочный",
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
  members: "Участники",
  assignee: "Назначенный",
  assignees: "Назначенные",
  you: "Вы",
  labels: "Метки",
  create_new_label: "Создать новую метку",
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
        description: "Все ваши виджеты выключены. Включите их\nдля улучшения взаимодействия!",
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
    clear_all: "Очистить все",
    copied: "Скопировано!",
    link_copied: "Ссылка скопирована!",
    link_copied_to_clipboard: "Ссылка скопирована в буфер обмена",
    copied_to_clipboard: "Ссылка на рабочий элемент скопирована",
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
    live: "В прямом эфире",
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
      description: "Только завершённые или отменённые\nрабочие элементы можно архивировать",
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
      body: "Здравствуйте, администратор!\n\nПожалуйста, создайте новое рабочее пространство с URL [/workspace-name] для [цель создания].\n\nСпасибо,\n{firstName} {lastName}\n{email}",
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
        description: "Не найдено проектов по заданным критериям.\nСоздайте новый проект.",
      },
      search: {
        description: "Не найдено проектов по заданным критериям.\nСоздайте новый проект",
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
        title: "API-токены",
        add_token: "Добавить токен",
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
        title: "Приём",
        short_title: "Приём",
        description:
          "Позвольте не-участникам делиться ошибками, отзывами и предложениями; не нарушая ваш рабочий процесс.",
        toggle_title: "Включить приём",
        toggle_description: "Разрешить участникам проекта создавать запросы на приём в приложении.",
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
      archive_module_description: "Только завершённые или отменённые\nмодули можно архивировать.",
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
        description: "Нет представлений, соответствующих критериям поиска. \n Создайте новое представление.",
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
        description: "Обновления по назначенным вам рабочим элементам будут \n отображаться здесь",
      },
      mentions: {
        title: "Нет упомянутых рабочих элементов",
        description: "Обновления по рабочим элементам, где вас упомянули, \n будут отображаться здесь",
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
        description: "Попробуйте другой запрос или сообщите нам,\nесли уверены в правильности поиска.",
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
    open_button: "Открыть панель навигации",
    close_button: "Закрыть панель навигации",
    outline_floating_button: "Открыть структуру",
  },
} as const;
