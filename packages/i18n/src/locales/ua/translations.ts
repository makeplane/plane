export default {
  sidebar: {
    projects: "Проєкти",
    pages: "Сторінки",
    new_work_item: "Нова робоча одиниця",
    home: "Головна",
    your_work: "Ваша робота",
    inbox: "Вхідні",
    workspace: "Робочий простір",
    views: "Подання",
    analytics: "Аналітика",
    work_items: "Робочі одиниці",
    cycles: "Цикли",
    modules: "Модулі",
    intake: "Надходження",
    drafts: "Чернетки",
    favorites: "Вибране",
    pro: "Pro",
    upgrade: "Підвищити",
  },
  auth: {
    common: {
      email: {
        label: "Електронна пошта",
        placeholder: "ім’я@компанія.ua",
        errors: {
          required: "Електронна пошта є обов’язковою",
          invalid: "Неправильна адреса електронної пошти",
        },
      },
      password: {
        label: "Пароль",
        set_password: "Встановити пароль",
        placeholder: "Введіть пароль",
        confirm_password: {
          label: "Підтвердіть пароль",
          placeholder: "Підтвердіть пароль",
        },
        current_password: {
          label: "Поточний пароль",
        },
        new_password: {
          label: "Новий пароль",
          placeholder: "Введіть новий пароль",
        },
        change_password: {
          label: {
            default: "Змінити пароль",
            submitting: "Зміна пароля",
          },
        },
        errors: {
          match: "Паролі не співпадають",
          empty: "Будь ласка, введіть свій пароль",
          length: "Довжина пароля має бути більше 8 символів",
          strength: {
            weak: "Пароль занадто слабкий",
            strong: "Пароль надійний",
          },
        },
        submit: "Встановити пароль",
        toast: {
          change_password: {
            success: {
              title: "Успіх!",
              message: "Пароль було успішно змінено.",
            },
            error: {
              title: "Помилка!",
              message: "Щось пішло не так. Будь ласка, спробуйте ще раз.",
            },
          },
        },
      },
      unique_code: {
        label: "Унікальний код",
        placeholder: "123456",
        paste_code: "Вставте код, надісланий на вашу електронну пошту",
        requesting_new_code: "Запитую новий код",
        sending_code: "Надсилаю код",
      },
      already_have_an_account: "Вже маєте обліковий запис?",
      login: "Увійти",
      create_account: "Створити обліковий запис",
      new_to_plane: "Вперше в Plane?",
      back_to_sign_in: "Повернутися до входу",
      resend_in: "Надіслати повторно через {seconds} секунд",
      sign_in_with_unique_code: "Увійти за допомогою унікального коду",
      forgot_password: "Забули пароль?",
    },
    sign_up: {
      header: {
        label: "Створіть обліковий запис і почніть керувати роботою зі своєю командою.",
        step: {
          email: {
            header: "Реєстрація",
            sub_header: "",
          },
          password: {
            header: "Реєстрація",
            sub_header: "Зареєструйтесь, використовуючи комбінацію електронної пошти та пароля.",
          },
          unique_code: {
            header: "Реєстрація",
            sub_header:
              "Зареєструйтесь за допомогою унікального коду, надісланого на вказану вище адресу електронної пошти.",
          },
        },
      },
      errors: {
        password: {
          strength: "Спробуйте встановити надійний пароль, щоб продовжити",
        },
      },
    },
    sign_in: {
      header: {
        label: "Увійдіть і почніть керувати роботою зі своєю командою.",
        step: {
          email: {
            header: "Увійти або зареєструватись",
            sub_header: "",
          },
          password: {
            header: "Увійти або зареєструватись",
            sub_header: "Використовуйте комбінацію електронної пошти та пароля, щоб увійти.",
          },
          unique_code: {
            header: "Увійти або зареєструватись",
            sub_header: "Увійдіть за допомогою унікального коду, надісланого на вказану вище адресу електронної пошти.",
          },
        },
      },
    },
    forgot_password: {
      title: "Відновіть свій пароль",
      description:
        "Введіть підтверджену адресу електронної пошти вашого облікового запису, і ми надішлемо вам посилання для відновлення пароля.",
      email_sent: "Ми надіслали посилання для відновлення на вашу електронну пошту",
      send_reset_link: "Надіслати посилання для відновлення",
      errors: {
        smtp_not_enabled: "Адміністратор не активував SMTP, тому неможливо надіслати посилання для відновлення пароля",
      },
      toast: {
        success: {
          title: "Лист надіслано",
          message:
            "Перевірте свою пошту для відновлення пароля. Якщо не отримали протягом кількох хвилин, перевірте папку «Спам».",
        },
        error: {
          title: "Помилка!",
          message: "Щось пішло не так. Будь ласка, спробуйте ще раз.",
        },
      },
    },
    reset_password: {
      title: "Встановити новий пароль",
      description: "Захистіть свій обліковий запис надійним паролем",
    },
    set_password: {
      title: "Захистіть свій обліковий запис",
      description: "Встановлення пароля допоможе безпечно входити у систему",
    },
    sign_out: {
      toast: {
        error: {
          title: "Помилка!",
          message: "Не вдалося вийти. Спробуйте знову.",
        },
      },
    },
  },
  submit: "Надіслати",
  cancel: "Скасувати",
  loading: "Завантаження",
  error: "Помилка",
  success: "Успіх",
  warning: "Попередження",
  info: "Інформація",
  close: "Закрити",
  yes: "Так",
  no: "Ні",
  ok: "OK",
  name: "Назва",
  description: "Опис",
  search: "Пошук",
  add_member: "Додати учасника",
  adding_members: "Додавання учасників",
  remove_member: "Видалити учасника",
  add_members: "Додати учасників",
  adding_member: "Додавання учасників",
  remove_members: "Видалити учасників",
  add: "Додати",
  adding: "Додавання",
  remove: "Вилучити",
  add_new: "Додати новий",
  remove_selected: "Вилучити вибрані",
  first_name: "Ім’я",
  last_name: "Прізвище",
  email: "Електронна пошта",
  display_name: "Відображуване ім’я",
  role: "Роль",
  timezone: "Часовий пояс",
  avatar: "Аватар",
  cover_image: "Обкладинка",
  password: "Пароль",
  change_cover: "Змінити обкладинку",
  language: "Мова",
  saving: "Збереження",
  save_changes: "Зберегти зміни",
  deactivate_account: "Деактивувати обліковий запис",
  deactivate_account_description:
    "Після деактивації всі дані й ресурси цього облікового запису будуть видалені без можливості відновлення.",
  profile_settings: "Налаштування профілю",
  your_account: "Ваш обліковий запис",
  security: "Безпека",
  activity: "Активність",
  appearance: "Зовнішній вигляд",
  notifications: "Сповіщення",
  workspaces: "Робочі простори",
  create_workspace: "Створити робочий простір",
  invitations: "Запрошення",
  summary: "Зведення",
  assigned: "Призначено",
  created: "Створено",
  subscribed: "Підписано",
  you_do_not_have_the_permission_to_access_this_page: "Ви не маєте прав доступу до цієї сторінки.",
  something_went_wrong_please_try_again: "Щось пішло не так. Будь ласка, спробуйте ще раз.",
  load_more: "Завантажити ще",
  select_or_customize_your_interface_color_scheme: "Виберіть або налаштуйте кольорову схему інтерфейсу.",
  theme: "Тема",
  system_preference: "Системні налаштування",
  light: "Світла",
  dark: "Темна",
  light_contrast: "Світла з високою контрастністю",
  dark_contrast: "Темна з високою контрастністю",
  custom: "Користувацька тема",
  select_your_theme: "Виберіть тему",
  customize_your_theme: "Налаштуйте свою тему",
  background_color: "Колір фону",
  text_color: "Колір тексту",
  primary_color: "Основний колір (тема)",
  sidebar_background_color: "Колір фону бічної панелі",
  sidebar_text_color: "Колір тексту бічної панелі",
  set_theme: "Застосувати тему",
  enter_a_valid_hex_code_of_6_characters: "Введіть дійсний hex-код довжиною 6 символів",
  background_color_is_required: "Колір фону є обов’язковим",
  text_color_is_required: "Колір тексту є обов’язковим",
  primary_color_is_required: "Основний колір є обов’язковим",
  sidebar_background_color_is_required: "Колір фону бічної панелі є обов’язковим",
  sidebar_text_color_is_required: "Колір тексту бічної панелі є обов’язковим",
  updating_theme: "Оновлення теми",
  theme_updated_successfully: "Тему успішно оновлено",
  failed_to_update_the_theme: "Не вдалося оновити тему",
  email_notifications: "Сповіщення електронною поштою",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "Будьте в курсі робочих одиниць, на які ви підписані. Увімкніть це, щоб отримувати сповіщення.",
  email_notification_setting_updated_successfully: "Налаштування сповіщень електронною поштою успішно оновлено",
  failed_to_update_email_notification_setting: "Не вдалося оновити налаштування сповіщень електронною поштою",
  notify_me_when: "Повідомляти мене, коли",
  property_changes: "Зміни властивостей",
  property_changes_description:
    "Повідомляти, коли змінюються властивості робочих одиниць, такі як призначення, пріоритет, оцінки чи інші.",
  state_change: "Зміна стану",
  state_change_description: "Повідомляти, коли робоча одиниця переходить в інший стан",
  issue_completed: "Робоча одиниця завершена",
  issue_completed_description: "Повідомляти лише коли робоча одиниця завершена",
  comments: "Коментарі",
  comments_description: "Повідомляти, коли хтось додає коментар до робочої одиниці",
  mentions: "Згадки",
  mentions_description: "Повідомляти лише коли хтось згадає мене у коментарі чи описі",
  old_password: "Старий пароль",
  general_settings: "Загальні налаштування",
  sign_out: "Вийти",
  signing_out: "Вихід",
  active_cycles: "Активні цикли",
  active_cycles_description:
    "Відстежуйте цикли між проєктами, слідкуйте за пріоритетними робочими одиницями та звертайте увагу на цикли, які потребують втручання.",
  on_demand_snapshots_of_all_your_cycles: "Знімки всіх ваших циклів на вимогу",
  upgrade: "Підвищити",
  "10000_feet_view": "Огляд з висоти 10 000 футів для всіх активних циклів.",
  "10000_feet_view_description":
    "Переглядайте всі поточні цикли у різних проєктах одночасно, замість перемикання між ними в кожному проєкті.",
  get_snapshot_of_each_active_cycle: "Отримайте знімок кожного активного циклу.",
  get_snapshot_of_each_active_cycle_description:
    "Відстежуйте ключові метрики для всіх активних циклів, переглядайте їхній прогрес і порівнюйте обсяг із крайніми строками.",
  compare_burndowns: "Порівнюйте burndown-графіки.",
  compare_burndowns_description: "Контролюйте ефективність команд за допомогою огляду burndown-звітів кожного циклу.",
  quickly_see_make_or_break_issues: "Швидко визначайте критичні робочі одиниці.",
  quickly_see_make_or_break_issues_description:
    "Переглядайте найпріоритетніші робочі одиниці для кожного циклу з урахуванням термінів. Усе за один клік.",
  zoom_into_cycles_that_need_attention: "Зосередьтеся на циклах, що потребують уваги.",
  zoom_into_cycles_that_need_attention_description:
    "Одним кліком вивчайте стан будь-якого циклу, який не відповідає очікуванням.",
  stay_ahead_of_blockers: "Вчасно виявляйте перешкоди.",
  stay_ahead_of_blockers_description:
    "Виявляйте проблеми між проєктами та залежності між циклами, які неочевидні в інших поданнях.",
  analytics: "Аналітика",
  workspace_invites: "Запрошення до робочого простору",
  enter_god_mode: "Увійти в режим Бога",
  workspace_logo: "Логотип робочого простору",
  new_issue: "Нова робоча одиниця",
  your_work: "Ваша робота",
  drafts: "Чернетки",
  projects: "Проєкти",
  views: "Подання",
  workspace: "Робочий простір",
  archives: "Архіви",
  settings: "Налаштування",
  failed_to_move_favorite: "Не вдалося перемістити обране",
  favorites: "Вибране",
  no_favorites_yet: "Поки немає вибраного",
  create_folder: "Створити папку",
  new_folder: "Нова папка",
  favorite_updated_successfully: "Вибране успішно оновлено",
  favorite_created_successfully: "Вибране успішно створено",
  folder_already_exists: "Папка вже існує",
  folder_name_cannot_be_empty: "Назва папки не може бути порожньою",
  something_went_wrong: "Щось пішло не так",
  failed_to_reorder_favorite: "Не вдалося змінити порядок елементів у вибраному",
  favorite_removed_successfully: "Вибране успішно видалено",
  failed_to_create_favorite: "Не вдалося створити вибране",
  failed_to_rename_favorite: "Не вдалося перейменувати вибране",
  project_link_copied_to_clipboard: "Посилання на проєкт скопійовано до буфера обміну",
  link_copied: "Посилання скопійовано",
  add_project: "Додати проєкт",
  create_project: "Створити проєкт",
  failed_to_remove_project_from_favorites: "Не вдалося видалити проєкт із вибраного. Спробуйте ще раз.",
  project_created_successfully: "Проєкт успішно створено",
  project_created_successfully_description: "Проєкт успішно створений. Тепер ви можете почати додавати робочі одиниці.",
  project_name_already_taken: "Назва проекту вже використовується.",
  project_identifier_already_taken: "Ідентифікатор проекту вже використовується.",
  project_cover_image_alt: "Обкладинка проєкту",
  name_is_required: "Назва є обов’язковою",
  title_should_be_less_than_255_characters: "Назва має бути коротшою за 255 символів",
  project_name: "Назва проєкту",
  project_id_must_be_at_least_1_character: "Ідентифікатор проєкту має містити принаймні 1 символ",
  project_id_must_be_at_most_5_characters: "Ідентифікатор проєкту може містити максимум 5 символів",
  project_id: "ID проєкту",
  project_id_tooltip_content: "Допомагає унікально ідентифікувати робочі одиниці в проєкті. Макс. 10 символів.",
  description_placeholder: "Опис",
  only_alphanumeric_non_latin_characters_allowed: "Дозволені лише алфанумеричні та нелатинські символи.",
  project_id_is_required: "ID проєкту є обов’язковим",
  project_id_allowed_char: "Дозволені лише алфанумеричні та нелатинські символи.",
  project_id_min_char: "ID проєкту має містити принаймні 1 символ",
  project_id_max_char: "ID проєкту може містити максимум 10 символів",
  project_description_placeholder: "Введіть опис проєкту",
  select_network: "Вибрати мережу",
  lead: "Керівник",
  date_range: "Діапазон дат",
  private: "Приватний",
  public: "Публічний",
  accessible_only_by_invite: "Доступ лише за запрошенням",
  anyone_in_the_workspace_except_guests_can_join: "Будь-хто в робочому просторі, крім гостей, може приєднатися",
  creating: "Створення",
  creating_project: "Створення проєкту",
  adding_project_to_favorites: "Додавання проєкту у вибране",
  project_added_to_favorites: "Проєкт додано у вибране",
  couldnt_add_the_project_to_favorites: "Не вдалося додати проєкт у вибране. Спробуйте ще раз.",
  removing_project_from_favorites: "Вилучення проєкту з вибраного",
  project_removed_from_favorites: "Проєкт вилучено з вибраного",
  couldnt_remove_the_project_from_favorites: "Не вдалося вилучити проєкт із вибраного. Спробуйте ще раз.",
  add_to_favorites: "Додати у вибране",
  remove_from_favorites: "Вилучити з вибраного",
  publish_project: "Опублікувати проєкт",
  publish: "Опублікувати",
  copy_link: "Скопіювати посилання",
  leave_project: "Вийти з проєкту",
  join_the_project_to_rearrange: "Приєднайтеся до проєкту, щоб змінити впорядкування",
  drag_to_rearrange: "Перетягніть для впорядкування",
  congrats: "Вітаємо!",
  open_project: "Відкрити проєкт",
  issues: "Робочі одиниці",
  cycles: "Цикли",
  modules: "Модулі",
  pages: "Сторінки",
  intake: "Надходження",
  time_tracking: "Відстеження часу",
  work_management: "Управління роботою",
  projects_and_issues: "Проєкти та робочі одиниці",
  projects_and_issues_description: "Увімкніть або вимкніть ці функції в проєкті.",
  cycles_description:
    "Обмежуйте роботу в часі для кожного проєкту та за потреби коригуйте період. Один цикл може тривати 2 тижні, наступний — 1 тиждень.",
  modules_description: "Організуйте роботу в підпроєкти з окремими керівниками та виконавцями.",
  views_description: "Зберігайте власні сортування, фільтри та варіанти відображення або діліться ними з командою.",
  pages_description: "Створюйте та редагуйте довільний вміст: нотатки, документи, що завгодно.",
  intake_description:
    "Дозвольте неучасникам ділитися помилками, відгуками й пропозиціями без порушення робочого процесу.",
  time_tracking_description: "Фіксуйте час, витрачений на робочі одиниці та проєкти.",
  work_management_description: "Зручно керуйте своєю роботою та проєктами.",
  documentation: "Документація",
  message_support: "Звернутися в підтримку",
  contact_sales: "Зв’язатися з відділом продажів",
  hyper_mode: "Гіпер-режим",
  keyboard_shortcuts: "Гарячі клавіші",
  whats_new: "Що нового?",
  version: "Версія",
  we_are_having_trouble_fetching_the_updates: "Виникли проблеми з отриманням оновлень.",
  our_changelogs: "наш журнал змін",
  for_the_latest_updates: "для найсвіжіших оновлень.",
  please_visit: "Будь ласка, відвідайте",
  docs: "Документацію",
  full_changelog: "Повний журнал змін",
  support: "Підтримка",
  discord: "Discord",
  powered_by_plane_pages: "Працює на Plane Pages",
  please_select_at_least_one_invitation: "Виберіть принаймні одне запрошення.",
  please_select_at_least_one_invitation_description:
    "Виберіть принаймні одне запрошення, щоб приєднатися до робочого простору.",
  we_see_that_someone_has_invited_you_to_join_a_workspace:
    "Ми бачимо, що вас запросили приєднатися до робочого простору",
  join_a_workspace: "Приєднатися до робочого простору",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description:
    "Ми бачимо, що вас запросили приєднатися до робочого простору",
  join_a_workspace_description: "Приєднатися до робочого простору",
  accept_and_join: "Прийняти та приєднатися",
  go_home: "Головна",
  no_pending_invites: "Немає активних запрошень",
  you_can_see_here_if_someone_invites_you_to_a_workspace: "Тут з’являтимуться запрошення до робочого простору",
  back_to_home: "Повернутися на головну",
  workspace_name: "назва-робочого-простору",
  deactivate_your_account: "Деактивувати ваш обліковий запис",
  deactivate_your_account_description:
    "Після деактивації вас не можна буде призначати на робочі одиниці, і з вас не стягуватиметься плата за робочий простір. Щоб знову активувати обліковий запис, потрібно отримати запрошення на цей e-mail.",
  deactivating: "Деактивація",
  confirm: "Підтвердити",
  confirming: "Підтвердження",
  draft_created: "Чернетку створено",
  issue_created_successfully: "Робочу одиницю успішно створено",
  draft_creation_failed: "Не вдалося створити чернетку",
  issue_creation_failed: "Не вдалося створити робочу одиницю",
  draft_issue: "Чернетка робочої одиниці",
  issue_updated_successfully: "Робочу одиницю успішно оновлено",
  issue_could_not_be_updated: "Не вдалося оновити робочу одиницю",
  create_a_draft: "Створити чернетку",
  save_to_drafts: "Зберегти до чернеток",
  save: "Зберегти",
  update: "Оновити",
  updating: "Оновлення",
  create_new_issue: "Створити нову робочу одиницю",
  editor_is_not_ready_to_discard_changes: "Редактор ще не готовий скасувати зміни",
  failed_to_move_issue_to_project: "Не вдалося перемістити робочу одиницю до проєкту",
  create_more: "Створити ще",
  add_to_project: "Додати до проєкту",
  discard: "Скасувати",
  duplicate_issue_found: "Знайдено дублікат робочої одиниці",
  duplicate_issues_found: "Знайдено дублікати робочих одиниць",
  no_matching_results: "Немає відповідних результатів",
  title_is_required: "Назва є обов’язковою",
  title: "Назва",
  state: "Стан",
  priority: "Пріоритет",
  none: "Немає",
  urgent: "Терміновий",
  high: "Високий",
  medium: "Середній",
  low: "Низький",
  members: "Учасники",
  assignee: "Призначено",
  assignees: "Призначені",
  you: "Ви",
  labels: "Мітки",
  create_new_label: "Створити нову мітку",
  start_date: "Дата початку",
  end_date: "Дата завершення",
  due_date: "Крайній термін",
  estimate: "Оцінка",
  change_parent_issue: "Змінити батьківську робочу одиницю",
  remove_parent_issue: "Вилучити батьківську робочу одиницю",
  add_parent: "Додати батьківську",
  loading_members: "Завантаження учасників",
  view_link_copied_to_clipboard: "Посилання на подання скопійовано до буфера обміну.",
  required: "Обов’язково",
  optional: "Необов’язково",
  Cancel: "Скасувати",
  edit: "Редагувати",
  archive: "Заархівувати",
  restore: "Відновити",
  open_in_new_tab: "Відкрити в новій вкладці",
  delete: "Видалити",
  deleting: "Видалення",
  make_a_copy: "Зробити копію",
  move_to_project: "Перемістити в проєкт",
  good: "Доброго",
  morning: "ранку",
  afternoon: "дня",
  evening: "вечора",
  show_all: "Показати все",
  show_less: "Показати менше",
  no_data_yet: "Поки що немає даних",
  syncing: "Синхронізація",
  add_work_item: "Додати робочу одиницю",
  advanced_description_placeholder: "Натисніть '/' для команд",
  create_work_item: "Створити робочу одиницю",
  attachments: "Вкладення",
  declining: "Відхилення",
  declined: "Відхилено",
  decline: "Відхилити",
  unassigned: "Не призначено",
  work_items: "Робочі одиниці",
  add_link: "Додати посилання",
  points: "Бали",
  no_assignee: "Без призначення",
  no_assignees_yet: "Поки немає призначених",
  no_labels_yet: "Поки немає міток",
  ideal: "Ідеальний",
  current: "Поточний",
  no_matching_members: "Немає відповідних учасників",
  leaving: "Вихід",
  removing: "Вилучення",
  leave: "Вийти",
  refresh: "Оновити",
  refreshing: "Оновлення",
  refresh_status: "Оновити статус",
  prev: "Попередній",
  next: "Наступний",
  re_generating: "Повторне генерування",
  re_generate: "Повторно згенерувати",
  re_generate_key: "Повторно згенерувати ключ",
  export: "Експортувати",
  member: "{count, plural, one{# учасник} few{# учасники} other{# учасників}}",
  new_password_must_be_different_from_old_password: "Новий пароль повинен бути відмінним від старого пароля",
  edited: "Редагувано",
  bot: "Бот",
  project_view: {
    sort_by: {
      created_at: "Створено",
      updated_at: "Оновлено",
      name: "Назва",
    },
  },
  toast: {
    success: "Успіх!",
    error: "Помилка!",
  },
  links: {
    toasts: {
      created: {
        title: "Посилання створено",
        message: "Посилання було успішно створено",
      },
      not_created: {
        title: "Посилання не створено",
        message: "Не вдалося створити посилання",
      },
      updated: {
        title: "Посилання оновлено",
        message: "Посилання було успішно оновлено",
      },
      not_updated: {
        title: "Посилання не оновлено",
        message: "Не вдалося оновити посилання",
      },
      removed: {
        title: "Посилання видалено",
        message: "Посилання було успішно видалено",
      },
      not_removed: {
        title: "Посилання не видалено",
        message: "Не вдалося видалити посилання",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "Ваш посібник із швидкого старту",
      not_right_now: "Зараз не треба",
      create_project: {
        title: "Створити проєкт",
        description: "Більшість речей починається з проєкту в Plane.",
        cta: "Почати",
      },
      invite_team: {
        title: "Запросити команду",
        description: "Співпрацюйте з колегами у створенні, постачанні та керуванні.",
        cta: "Запросити їх",
      },
      configure_workspace: {
        title: "Налаштуйте свій робочий простір.",
        description: "Увімкніть або вимкніть функції чи зайдіть далі.",
        cta: "Налаштувати цей простір",
      },
      personalize_account: {
        title: "Налаштуйте Plane під себе.",
        description: "Оберіть картинку, кольори та інше.",
        cta: "Налаштувати зараз",
      },
      widgets: {
        title: "Без віджетів трохи порожньо, увімкніть їх",
        description: "Схоже, що всі ваші віджети вимкнені. Увімкніть їх\nдля покращеного досвіду!",
        primary_button: {
          text: "Керувати віджетами",
        },
      },
    },
    quick_links: {
      empty: "Збережіть посилання на важливі речі, які хочете мати під рукою.",
      add: "Додати швидке посилання",
      title: "Швидке посилання",
      title_plural: "Швидкі посилання",
    },
    recents: {
      title: "Нещодавні",
      empty: {
        project: "Ваші нещодавні проєкти з’являться тут після перегляду.",
        page: "Ваші нещодавні сторінки з’являться тут після перегляду.",
        issue: "Ваші нещодавні робочі одиниці з’являться тут після перегляду.",
        default: "Поки у вас немає нещодавніх елементів.",
      },
      filters: {
        all: "Усі",
        projects: "Проєкти",
        pages: "Сторінки",
        issues: "Робочі одиниці",
      },
    },
    new_at_plane: {
      title: "Новинки в Plane",
    },
    quick_tutorial: {
      title: "Швидкий посібник",
    },
    widget: {
      reordered_successfully: "Віджет успішно переміщено.",
      reordering_failed: "Сталася помилка під час переміщення віджета.",
    },
    manage_widgets: "Керувати віджетами",
    title: "Головна",
    star_us_on_github: "Оцініть нас на GitHub",
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "Неприпустимий URL",
        placeholder: "Введіть або вставте URL",
      },
      title: {
        text: "Відображувана назва",
        placeholder: "Як ви хочете бачити це посилання",
      },
    },
  },
  common: {
    all: "Усе",
    no_items_in_this_group: "У цій групі немає елементів",
    drop_here_to_move: "Перетягніть сюди для переміщення",
    states: "Стани",
    state: "Стан",
    state_groups: "Групи станів",
    state_group: "Група станів",
    priorities: "Пріоритети",
    priority: "Пріоритет",
    team_project: "Командний проєкт",
    project: "Проєкт",
    cycle: "Цикл",
    cycles: "Цикли",
    module: "Модуль",
    modules: "Модулі",
    labels: "Мітки",
    label: "Мітка",
    assignees: "Призначені",
    assignee: "Призначено",
    created_by: "Створено",
    none: "Немає",
    link: "Посилання",
    estimates: "Оцінки",
    estimate: "Оцінка",
    created_at: "Створено",
    completed_at: "Завершено",
    layout: "Розташування",
    filters: "Фільтри",
    display: "Відображення",
    load_more: "Завантажити ще",
    activity: "Активність",
    analytics: "Аналітика",
    dates: "Дати",
    success: "Успіх!",
    something_went_wrong: "Щось пішло не так",
    error: {
      label: "Помилка!",
      message: "Сталася помилка. Спробуйте ще раз.",
    },
    group_by: "Групувати за",
    epic: "Епік",
    epics: "Епіки",
    work_item: "Робоча одиниця",
    work_items: "Робочі одиниці",
    sub_work_item: "Похідна робоча одиниця",
    add: "Додати",
    warning: "Попередження",
    updating: "Оновлення",
    adding: "Додавання",
    update: "Оновити",
    creating: "Створення",
    create: "Створити",
    cancel: "Скасувати",
    description: "Опис",
    title: "Назва",
    attachment: "Вкладення",
    general: "Загальне",
    features: "Функції",
    automation: "Автоматизація",
    project_name: "Назва проєкту",
    project_id: "ID проєкту",
    project_timezone: "Часовий пояс проєкту",
    created_on: "Створено",
    update_project: "Оновити проєкт",
    identifier_already_exists: "Такий ідентифікатор уже існує",
    add_more: "Додати ще",
    defaults: "Типові",
    add_label: "Додати мітку",
    customize_time_range: "Налаштувати діапазон часу",
    loading: "Завантаження",
    attachments: "Вкладення",
    property: "Властивість",
    properties: "Властивості",
    parent: "Батьківська",
    page: "Сторінка",
    remove: "Вилучити",
    archiving: "Архівація",
    archive: "Заархівувати",
    access: {
      public: "Публічний",
      private: "Приватний",
    },
    done: "Готово",
    sub_work_items: "Похідні робочі одиниці",
    comment: "Коментар",
    workspace_level: "Рівень робочого простору",
    order_by: {
      label: "Сортувати за",
      manual: "Вручну",
      last_created: "Останні створені",
      last_updated: "Останні оновлені",
      start_date: "Дата початку",
      due_date: "Крайній термін",
      asc: "За зростанням",
      desc: "За спаданням",
      updated_on: "Оновлено",
    },
    sort: {
      asc: "За зростанням",
      desc: "За спаданням",
      created_on: "Створено",
      updated_on: "Оновлено",
    },
    comments: "Коментарі",
    updates: "Оновлення",
    clear_all: "Очистити все",
    copied: "Скопійовано!",
    link_copied: "Посилання скопійовано!",
    link_copied_to_clipboard: "Посилання скопійовано до буфера обміну",
    copied_to_clipboard: "Посилання на робочу одиницю скопійовано до буфера",
    is_copied_to_clipboard: "Робочу одиницю скопійовано до буфера",
    no_links_added_yet: "Поки що немає доданих посилань",
    add_link: "Додати посилання",
    links: "Посилання",
    go_to_workspace: "Перейти до робочого простору",
    progress: "Прогрес",
    optional: "Необов’язково",
    join: "Приєднатися",
    go_back: "Назад",
    continue: "Продовжити",
    resend: "Надіслати повторно",
    relations: "Зв’язки",
    errors: {
      default: {
        title: "Помилка!",
        message: "Щось пішло не так. Будь ласка, спробуйте ще раз.",
      },
      required: "Це поле є обов'язковим",
      entity_required: "{entity} є обов'язковим",
      restricted_entity: "{entity} обмежено",
    },
    update_link: "Оновити посилання",
    attach: "Прикріпити",
    create_new: "Створити новий",
    add_existing: "Додати існуючий",
    type_or_paste_a_url: "Введіть або вставте URL",
    url_is_invalid: "Некоректний URL",
    display_title: "Відображувана назва",
    link_title_placeholder: "Як ви хочете бачити це посилання",
    url: "URL",
    side_peek: "Бічний перегляд",
    modal: "Модальне вікно",
    full_screen: "Повноекранний режим",
    close_peek_view: "Закрити перегляд",
    toggle_peek_view_layout: "Перемкнути режим перегляду",
    options: "Параметри",
    duration: "Тривалість",
    today: "Сьогодні",
    week: "Тиждень",
    month: "Місяць",
    quarter: "Квартал",
    press_for_commands: "Натисніть '/' для команд",
    click_to_add_description: "Натисніть, щоб додати опис",
    search: {
      label: "Пошук",
      placeholder: "Введіть пошуковий запит",
      no_matches_found: "Немає збігів",
      no_matching_results: "Немає відповідних результатів",
    },
    actions: {
      edit: "Редагувати",
      make_a_copy: "Зробити копію",
      open_in_new_tab: "Відкрити в новій вкладці",
      copy_link: "Скопіювати посилання",
      archive: "Заархівувати",
      restore: "Відновити",
      delete: "Видалити",
      remove_relation: "Вилучити зв’язок",
      subscribe: "Підписатися",
      unsubscribe: "Скасувати підписку",
      clear_sorting: "Скинути сортування",
      show_weekends: "Показати вихідні",
      enable: "Увімкнути",
      disable: "Вимкнути",
    },
    name: "Назва",
    discard: "Скасувати",
    confirm: "Підтвердити",
    confirming: "Підтвердження",
    read_the_docs: "Прочитати документацію",
    default: "Типове",
    active: "Активний",
    enabled: "Увімкнено",
    disabled: "Вимкнено",
    mandate: "Мандат",
    mandatory: "Обов’язково",
    yes: "Так",
    no: "Ні",
    please_wait: "Будь ласка, зачекайте",
    enabling: "Увімкнення",
    disabling: "Вимкнення",
    beta: "Бета",
    or: "або",
    next: "Далі",
    back: "Назад",
    cancelling: "Скасування",
    configuring: "Налаштування",
    clear: "Очистити",
    import: "Імпортувати",
    connect: "Підключити",
    authorizing: "Авторизація",
    processing: "Обробка",
    no_data_available: "Немає доступних даних",
    from: "від {name}",
    authenticated: "Автентифіковано",
    select: "Вибрати",
    upgrade: "Підвищити",
    add_seats: "Додати місця",
    projects: "Проєкти",
    workspace: "Робочий простір",
    workspaces: "Робочі простори",
    team: "Команда",
    teams: "Команди",
    entity: "Сутність",
    entities: "Сутності",
    task: "Завдання",
    tasks: "Завдання",
    section: "Розділ",
    sections: "Розділи",
    edit: "Редагувати",
    connecting: "Підключення",
    connected: "Підключено",
    disconnect: "Відключити",
    disconnecting: "Відключення",
    installing: "Встановлення",
    install: "Встановити",
    reset: "Скинути",
    live: "Наживо",
    change_history: "Історія змін",
    coming_soon: "Незабаром",
    member: "Учасник",
    members: "Учасники",
    you: "Ви",
    upgrade_cta: {
      higher_subscription: "Підвищити до вищого плану",
      talk_to_sales: "Зв’язатися з відділом продажів",
    },
    category: "Категорія",
    categories: "Категорії",
    saving: "Збереження",
    save_changes: "Зберегти зміни",
    delete: "Видалити",
    deleting: "Видалення",
    pending: "Очікує",
    invite: "Запросити",
    view: "Подання",
    deactivated_user: "Деактивований користувач",
    apply: "Застосувати",
    applying: "Застосовується",
    users: "Користувачі",
    admins: "Адміністратори",
    guests: "Гості",
    on_track: "У межах графіку",
    off_track: "Поза графіком",
    at_risk: "Під загрозою",
    timeline: "Хронологія",
    completion: "Завершення",
    upcoming: "Майбутнє",
    completed: "Завершено",
    in_progress: "В процесі",
    planned: "Заплановано",
    paused: "Призупинено",
    no_of: "Кількість {entity}",
    resolved: "Вирішено",
  },
  chart: {
    x_axis: "Вісь X",
    y_axis: "Вісь Y",
    metric: "Метрика",
  },
  form: {
    title: {
      required: "Назва є обов’язковою",
      max_length: "Назва має бути коротшою за {length} символів",
    },
  },
  entity: {
    grouping_title: "Групування {entity}",
    priority: "Пріоритет {entity}",
    all: "Усі {entity}",
    drop_here_to_move: "Перетягніть сюди для переміщення {entity}",
    delete: {
      label: "Видалити {entity}",
      success: "{entity} успішно видалено",
      failed: "Не вдалося видалити {entity}",
    },
    update: {
      failed: "Не вдалося оновити {entity}",
      success: "{entity} успішно оновлено",
    },
    link_copied_to_clipboard: "Посилання на {entity} скопійовано до буфера обміну",
    fetch: {
      failed: "Помилка під час завантаження {entity}",
    },
    add: {
      success: "{entity} успішно додано",
      failed: "Помилка під час додавання {entity}",
    },
    remove: {
      success: "{entity} успішно видалено",
      failed: "Помилка під час видалення {entity}",
    },
  },
  epic: {
    all: "Усі епіки",
    label: "{count, plural, one {Епік} other {Епіки}}",
    new: "Новий епік",
    adding: "Додавання епіку",
    create: {
      success: "Епік успішно створено",
    },
    add: {
      press_enter: "Натисніть 'Enter', щоб додати ще один епік",
      label: "Додати епік",
    },
    title: {
      label: "Назва епіку",
      required: "Назва епіку є обов’язковою.",
    },
  },
  issue: {
    label: "{count, plural, one {Робоча одиниця} few {Робочі одиниці} other {Робочих одиниць}}",
    all: "Усі робочі одиниці",
    edit: "Редагувати робочу одиницю",
    title: {
      label: "Назва робочої одиниці",
      required: "Назва робочої одиниці є обов’язковою.",
    },
    add: {
      press_enter: "Натисніть 'Enter', щоб додати ще одну робочу одиницю",
      label: "Додати робочу одиницю",
      cycle: {
        failed: "Не вдалося додати робочу одиницю в цикл. Спробуйте ще раз.",
        success: "{count, plural, one {Робоча одиниця} few {Робочі одиниці} other {Робочих одиниць}} додано до циклу.",
        loading:
          "Додавання {count, plural, one {робочої одиниці} few {робочих одиниць} other {робочих одиниць}} до циклу",
      },
      assignee: "Додати призначеного",
      start_date: "Додати дату початку",
      due_date: "Додати крайній термін",
      parent: "Додати батьківську робочу одиницю",
      sub_issue: "Додати похідну робочу одиницю",
      relation: "Додати зв’язок",
      link: "Додати посилання",
      existing: "Додати наявну робочу одиницю",
    },
    remove: {
      label: "Видалити робочу одиницю",
      cycle: {
        loading: "Вилучення робочої одиниці з циклу",
        success: "Робочу одиницю вилучено з циклу.",
        failed: "Не вдалося вилучити робочу одиницю з циклу. Спробуйте ще раз.",
      },
      module: {
        loading: "Вилучення робочої одиниці з модуля",
        success: "Робочу одиницю вилучено з модуля.",
        failed: "Не вдалося вилучити робочу одиницю з модуля. Спробуйте ще раз.",
      },
      parent: {
        label: "Вилучити батьківську робочу одиницю",
      },
    },
    new: "Нова робоча одиниця",
    adding: "Додавання робочої одиниці",
    create: {
      success: "Робочу одиницю успішно створено",
    },
    priority: {
      urgent: "Терміновий",
      high: "Високий",
      medium: "Середній",
      low: "Низький",
    },
    display: {
      properties: {
        label: "Відображувані властивості",
        id: "ID",
        issue_type: "Тип робочої одиниці",
        sub_issue_count: "Кількість похідних",
        attachment_count: "Кількість вкладень",
        created_on: "Створено",
        sub_issue: "Похідна одиниця",
        work_item_count: "Кількість робочих одиниць",
      },
      extra: {
        show_sub_issues: "Показати похідні робочі одиниці",
        show_empty_groups: "Показати порожні групи",
      },
    },
    layouts: {
      ordered_by_label: "Це розташування відсортоване за",
      list: "Список",
      kanban: "Дошка",
      calendar: "Календар",
      spreadsheet: "Таблиця",
      gantt: "Діаграма Ганта",
      title: {
        list: "Спискове розташування",
        kanban: "Розташування «Дошка»",
        calendar: "Розташування «Календар»",
        spreadsheet: "Табличне розташування",
        gantt: "Розташування «Діаграма Ганта»",
      },
    },
    states: {
      active: "Активно",
      backlog: "Backlog",
    },
    comments: {
      placeholder: "Додати коментар",
      switch: {
        private: "Перемкнути на приватний коментар",
        public: "Перемкнути на публічний коментар",
      },
      create: {
        success: "Коментар успішно створено",
        error: "Не вдалося створити коментар. Спробуйте пізніше.",
      },
      update: {
        success: "Коментар успішно оновлено",
        error: "Не вдалося оновити коментар. Спробуйте пізніше.",
      },
      remove: {
        success: "Коментар успішно видалено",
        error: "Не вдалося видалити коментар. Спробуйте пізніше.",
      },
      upload: {
        error: "Не вдалося завантажити вкладення. Спробуйте пізніше.",
      },
      copy_link: {
        success: "Посилання на коментар скопійовано в буфер обміну",
        error: "Помилка при копіюванні посилання на коментар. Спробуйте пізніше.",
      },
    },
    empty_state: {
      issue_detail: {
        title: "Робоча одиниця не існує",
        description: "Шукана робоча одиниця не існує, була заархівована або видалена.",
        primary_button: {
          text: "Переглянути інші робочі одиниці",
        },
      },
    },
    sibling: {
      label: "Пов’язані робочі одиниці",
    },
    archive: {
      description: "Архівувати можна лише завершені або скасовані\nробочі одиниці",
      label: "Заархівувати робочу одиницю",
      confirm_message: "Справді заархівувати цю робочу одиницю? Усі заархівовані одиниці можна пізніше відновити.",
      success: {
        label: "Успішно заархівовано",
        message: "Ваші архіви можна знайти в архівах проєкту.",
      },
      failed: {
        message: "Не вдалося заархівувати робочу одиницю. Спробуйте ще раз.",
      },
    },
    restore: {
      success: {
        title: "Успішне відновлення",
        message: "Ваша робоча одиниця тепер доступна серед робочих одиниць проєкту.",
      },
      failed: {
        message: "Не вдалося відновити робочу одиницю. Спробуйте ще раз.",
      },
    },
    relation: {
      relates_to: "Пов’язана з",
      duplicate: "Дублікат",
      blocked_by: "Заблокована",
      blocking: "Блокує",
    },
    copy_link: "Скопіювати посилання на робочу одиницю",
    delete: {
      label: "Видалити робочу одиницю",
      error: "Помилка під час видалення робочої одиниці",
    },
    subscription: {
      actions: {
        subscribed: "Ви підписалися на оновлення робочої одиниці",
        unsubscribed: "Ви скасували підписку на оновлення робочої одиниці",
      },
    },
    select: {
      error: "Виберіть принаймні одну робочу одиницю",
      empty: "Не вибрано жодної робочої одиниці",
      add_selected: "Додати вибрані робочі одиниці",
      select_all: "Вибрати всі",
      deselect_all: "Скасувати вибір усіх",
    },
    open_in_full_screen: "Відкрити робочу одиницю на повний екран",
  },
  attachment: {
    error: "Не вдалося додати файл. Спробуйте ще раз.",
    only_one_file_allowed: "Можна завантажити лише один файл одночасно.",
    file_size_limit: "Файл має бути меншим за {size}МБ.",
    drag_and_drop: "Перетягніть файл сюди для завантаження",
    delete: "Видалити вкладення",
  },
  label: {
    select: "Вибрати мітку",
    create: {
      success: "Мітку успішно створено",
      failed: "Не вдалося створити мітку",
      already_exists: "Така мітка вже існує",
      type: "Введіть для створення нової мітки",
    },
  },
  sub_work_item: {
    update: {
      success: "Похідну робочу одиницю успішно оновлено",
      error: "Помилка під час оновлення похідної одиниці",
    },
    remove: {
      success: "Похідну робочу одиницю успішно вилучено",
      error: "Помилка під час вилучення похідної одиниці",
    },
    empty_state: {
      sub_list_filters: {
        title: "Ви не маєте похідних робочих одиниць, які відповідають застосованим фільтрам.",
        description: "Щоб побачити всі похідні робочі одиниці, очистіть всі застосовані фільтри.",
        action: "Очистити фільтри",
      },
      list_filters: {
        title: "Ви не маєте робочих одиниць, які відповідають застосованим фільтрам.",
        description: "Щоб побачити всі робочі одиниці, очистіть всі застосовані фільтри.",
        action: "Очистити фільтри",
      },
    },
  },
  view: {
    label: "{count, plural, one {Подання} few {Подання} other {Подань}}",
    create: {
      label: "Створити подання",
    },
    update: {
      label: "Оновити подання",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "В очікуванні",
        description: "В очікуванні",
      },
      declined: {
        title: "Відхилено",
        description: "Відхилено",
      },
      snoozed: {
        title: "Відкладено",
        description: "Залишилося {days, plural, one{# день} few{# дні} other{# днів}}",
      },
      accepted: {
        title: "Прийнято",
        description: "Прийнято",
      },
      duplicate: {
        title: "Дублікат",
        description: "Дублікат",
      },
    },
    modals: {
      decline: {
        title: "Відхилити робочу одиницю",
        content: "Справді відхилити робочу одиницю {value}?",
      },
      delete: {
        title: "Видалити робочу одиницю",
        content: "Справді видалити робочу одиницю {value}?",
        success: "Робочу одиницю успішно видалено",
      },
    },
    errors: {
      snooze_permission: "Лише адміністратори проєкту можуть відкладати/повертати відкладені робочі одиниці",
      accept_permission: "Лише адміністратори проєкту можуть приймати робочі одиниці",
      decline_permission: "Лише адміністратори проєкту можуть відхилити робочі одиниці",
    },
    actions: {
      accept: "Прийняти",
      decline: "Відхилити",
      snooze: "Відкласти",
      unsnooze: "Повернути з відкладених",
      copy: "Скопіювати посилання на робочу одиницю",
      delete: "Видалити",
      open: "Відкрити робочу одиницю",
      mark_as_duplicate: "Позначити як дублікат",
      move: "Перемістити {value} до робочих одиниць проєкту",
    },
    source: {
      "in-app": "в застосунку",
    },
    order_by: {
      created_at: "Створено",
      updated_at: "Оновлено",
      id: "ID",
    },
    label: "Надходження",
    page_label: "{workspace} - Надходження",
    modal: {
      title: "Створити прийняту робочу одиницю",
    },
    tabs: {
      open: "Відкриті",
      closed: "Закриті",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "Немає відкритих робочих одиниць",
        description: "Тут будуть відкриті робочі одиниці. Створіть нову.",
      },
      sidebar_closed_tab: {
        title: "Немає закритих робочих одиниць",
        description: "Усі прийняті або відхилені робочі одиниці будуть тут.",
      },
      sidebar_filter: {
        title: "Немає робочих одиниць за фільтром",
        description: "Немає одиниць, що відповідають фільтру у надходженнях. Створіть нову.",
      },
      detail: {
        title: "Виберіть робочу одиницю для перегляду деталей.",
      },
    },
  },
  workspace_creation: {
    heading: "Створіть робочий простір",
    subheading: "Щоб користуватися Plane, вам потрібно створити або приєднатися до робочого простору.",
    form: {
      name: {
        label: "Назвіть свій робочий простір",
        placeholder: "Добре підійде щось знайоме та впізнаване.",
      },
      url: {
        label: "Встановіть URL вашого простору",
        placeholder: "Введіть або вставте URL",
        edit_slug: "Ви можете відредагувати лише частину URL (slug)",
      },
      organization_size: {
        label: "Скільки людей користуватиметься цим простором?",
        placeholder: "Виберіть діапазон",
      },
    },
    errors: {
      creation_disabled: {
        title: "Тільки адміністратор інстанції може створювати робочі простори",
        description:
          "Якщо ви знаєте електронну адресу адміністратора інстанції, натисніть кнопку нижче, щоб зв’язатися з ним.",
        request_button: "Запитати адміністратора інстанції",
      },
      validation: {
        name_alphanumeric: "Назви робочих просторів можуть містити лише (' '), ('-'), ('_') і алфанумеричні символи.",
        name_length: "Назва обмежена 80 символами.",
        url_alphanumeric: "URL може містити лише ('-') та алфанумеричні символи.",
        url_length: "URL обмежений 48 символами.",
        url_already_taken: "URL робочого простору вже зайнято!",
      },
    },
    request_email: {
      subject: "Запит на новий робочий простір",
      body: "Привіт, адміністраторе,\n\nБудь ласка, створіть новий робочий простір з URL [/workspace-name] для [мета створення].\n\nДякую,\n{firstName} {lastName}\n{email}",
    },
    button: {
      default: "Створити робочий простір",
      loading: "Створення робочого простору",
    },
    toast: {
      success: {
        title: "Успіх",
        message: "Робочий простір успішно створено",
      },
      error: {
        title: "Помилка",
        message: "Не вдалося створити робочий простір. Спробуйте ще раз.",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "Огляд проєктів, активностей і метрик",
        description:
          "Ласкаво просимо до Plane, ми раді, що ви з нами. Створіть перший проєкт, додайте робочі одиниці — і ця сторінка заповниться вашим прогресом. Адміністратори побачать тут також важливі елементи для команди.",
        primary_button: {
          text: "Створіть перший проєкт",
          comic: {
            title: "Усе починається з проєкту в Plane",
            description:
              "Проєкт може бути дорожньою картою продукту, маркетинговою кампанією або розробкою нового автомобіля.",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "Аналітика",
    page_label: "{workspace} - Аналітика",
    open_tasks: "Усього відкритих завдань",
    error: "Сталася помилка під час завантаження даних.",
    work_items_closed_in: "Робочі одиниці, закриті в",
    selected_projects: "Вибрані проєкти",
    total_members: "Усього учасників",
    total_cycles: "Усього циклів",
    total_modules: "Усього модулів",
    pending_work_items: {
      title: "Робочі одиниці, що очікують",
      empty_state: "Тут буде аналітика щодо робочих одиниць у розрізі виконавців.",
    },
    work_items_closed_in_a_year: {
      title: "Робочі одиниці, закриті за рік",
      empty_state: "Закривайте одиниці, щоб побачити аналітику в графіку.",
    },
    most_work_items_created: {
      title: "Найбільше створених одиниць",
      empty_state: "Тут відображатимуться виконавці та кількість створених ними одиниць.",
    },
    most_work_items_closed: {
      title: "Найбільше закритих одиниць",
      empty_state: "Тут відображатимуться виконавці та кількість закритих ними одиниць.",
    },
    tabs: {
      scope_and_demand: "Обсяг і попит",
      custom: "Користувацька аналітика",
    },
    empty_state: {
      customized_insights: {
        description: "Призначені вам робочі елементи, розбиті за станом, з’являться тут.",
        title: "Ще немає даних",
      },
      created_vs_resolved: {
        description: "Створені та вирішені з часом робочі елементи з’являться тут.",
        title: "Ще немає даних",
      },
      project_insights: {
        title: "Ще немає даних",
        description: "Призначені вам робочі елементи, розбиті за станом, з’являться тут.",
      },
      general: {
        title:
          "Відстежуйте прогрес, робочу навантаженні та розподіл. Виявляйте тенденції, усувайте перешкоди та прискорюйте роботу",
        description:
          "Перегляньте обсяг проти попиту, оцінки та розповсюдження обсягу. Отримайте продуктивність членів команди та команд, щоб переконатися, що ваш проєкт виконується вчасно.",
        primary_button: {
          text: "Розпочніть свій перший проєкт",
          comic: {
            title: "Аналітика найкраще працює з циклами + модулями",
            description:
              "Спочатку обмежте свої робочі елементи часом у циклах та, якщо можливо, згрупуйте робочі елементи, які перевищують один цикл, у модулі. Перегляньте обидва в навігації зліва.",
          },
        },
      },
    },
    created_vs_resolved: "Створено vs Вирішено",
    customized_insights: "Персоналізовані аналітичні дані",
    backlog_work_items: "{entity} у беклозі",
    active_projects: "Активні проєкти",
    trend_on_charts: "Тенденція на графіках",
    all_projects: "Усі проєкти",
    summary_of_projects: "Зведення проєктів",
    project_insights: "Аналітика проєкту",
    started_work_items: "Розпочаті {entity}",
    total_work_items: "Усього {entity}",
    total_projects: "Усього проєктів",
    total_admins: "Усього адміністраторів",
    total_users: "Усього користувачів",
    total_intake: "Загальний дохід",
    un_started_work_items: "Нерозпочаті {entity}",
    total_guests: "Усього гостей",
    completed_work_items: "Завершені {entity}",
    total: "Усього {entity}",
  },
  workspace_projects: {
    label: "{count, plural, one {Проєкт} few {Проєкти} other {Проєктів}}",
    create: {
      label: "Додати проєкт",
    },
    network: {
      label: "Мережа",
      private: {
        title: "Приватний",
        description: "Доступний лише за запрошенням",
      },
      public: {
        title: "Публічний",
        description: "Будь-хто в просторі, крім гостей, може приєднатися",
      },
    },
    error: {
      permission: "У вас немає прав для цієї дії.",
      cycle_delete: "Не вдалося видалити цикл",
      module_delete: "Не вдалося видалити модуль",
      issue_delete: "Не вдалося видалити робочу одиницю",
    },
    state: {
      backlog: "Backlog",
      unstarted: "Не почато",
      started: "Розпочато",
      completed: "Завершено",
      cancelled: "Скасовано",
    },
    sort: {
      manual: "Вручну",
      name: "Назва",
      created_at: "Дата створення",
      members_length: "Кількість учасників",
    },
    scope: {
      my_projects: "Мої проєкти",
      archived_projects: "Заархівовані",
    },
    common: {
      months_count: "{months, plural, one{# місяць} few{# місяці} other{# місяців}}",
    },
    empty_state: {
      general: {
        title: "Немає активних проєктів",
        description:
          "Проєкт є базовою одиницею цілей. У проєкті є завдання, Цикли та Модулі. Створіть новий проєкт або перемкніть фільтр на заархівовані.",
        primary_button: {
          text: "Розпочати перший проєкт",
          comic: {
            title: "Усе починається з проєкту в Plane",
            description:
              "Проєкт може бути дорожньою картою продукту, маркетинговою кампанією або розробкою нового авто.",
          },
        },
      },
      no_projects: {
        title: "Немає проєктів",
        description: "Щоб створювати робочі одиниці, потрібно створити або приєднатися до проєкту.",
        primary_button: {
          text: "Розпочати перший проєкт",
          comic: {
            title: "Усе починається з проєкту в Plane",
            description:
              "Проєкт може бути дорожньою картою продукту, маркетинговою кампанією або розробкою нового авто.",
          },
        },
      },
      filter: {
        title: "Немає проєктів за цим фільтром",
        description: "Не знайдено проєктів, що відповідають критеріям.\nСтворіть новий.",
      },
      search: {
        description: "Не знайдено проєктів, що відповідають критеріям.\nСтворіть новий.",
      },
    },
  },
  workspace_views: {
    add_view: "Додати подання",
    empty_state: {
      "all-issues": {
        title: "Немає робочих одиниць у проєкті",
        description: "Створіть першу одиницю та відстежуйте прогрес!",
        primary_button: {
          text: "Створити робочу одиницю",
        },
      },
      assigned: {
        title: "Немає призначених одиниць",
        description: "Тут відображатимуться одиниці, призначені вам.",
        primary_button: {
          text: "Створити робочу одиницю",
        },
      },
      created: {
        title: "Немає створених одиниць",
        description: "Тут відображатимуться одиниці, які ви створили.",
        primary_button: {
          text: "Створити робочу одиницю",
        },
      },
      subscribed: {
        title: "Немає підписаних одиниць",
        description: "Підпишіться на одиниці, які вас цікавлять.",
      },
      "custom-view": {
        title: "Немає одиниць за заданим фільтром",
        description: "Тут з’являться одиниці, що відповідають фільтру.",
      },
    },
    delete_view: {
      title: "Ви впевнені, що хочете видалити це подання?",
      content:
        "Якщо ви підтвердите, всі параметри сортування, фільтрації та відображення + макет, який ви обрали для цього подання, будуть безповоротно видалені без можливості відновлення.",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "Змінити email",
        description: "Введіть нову адресу електронної пошти, щоб отримати посилання для підтвердження.",
        toasts: {
          success_title: "Успіх!",
          success_message: "Email успішно оновлено. Увійдіть знову.",
        },
        form: {
          email: {
            label: "Новий email",
            placeholder: "Введіть свій email",
            errors: {
              required: "Email є обов’язковим",
              invalid: "Email недійсний",
              exists: "Email уже існує. Використайте інший.",
              validation_failed: "Не вдалося підтвердити email. Спробуйте ще раз.",
            },
          },
          code: {
            label: "Унікальний код",
            placeholder: "123456",
            helper_text: "Код підтвердження надіслано на ваш новий email.",
            errors: {
              required: "Унікальний код є обов’язковим",
              invalid: "Недійсний код підтвердження. Спробуйте ще раз.",
            },
          },
        },
        actions: {
          continue: "Продовжити",
          confirm: "Підтвердити",
          cancel: "Скасувати",
        },
        states: {
          sending: "Надсилання…",
        },
      },
    },
  },
  workspace_settings: {
    label: "Налаштування робочого простору",
    page_label: "{workspace} - Загальні налаштування",
    key_created: "Ключ створено",
    copy_key:
      "Скопіюйте й збережіть цей ключ для Plane Pages. Після закриття ви його більше не побачите. CSV-файл із ключем було завантажено.",
    token_copied: "Токен скопійовано до буфера.",
    settings: {
      general: {
        title: "Загальне",
        upload_logo: "Завантажити логотип",
        edit_logo: "Редагувати логотип",
        name: "Назва робочого простору",
        company_size: "Розмір компанії",
        url: "URL робочого простору",
        workspace_timezone: "Часовий пояс робочого простору",
        update_workspace: "Оновити простір",
        delete_workspace: "Видалити цей простір",
        delete_workspace_description: "Видалення простору призведе до втрати всіх даних і ресурсів. Дія незворотна.",
        delete_btn: "Видалити простір",
        delete_modal: {
          title: "Справді видалити цей простір?",
          description: "У вас активна пробна версія. Спочатку скасуйте її.",
          dismiss: "Закрити",
          cancel: "Скасувати пробну версію",
          success_title: "Простір видалено.",
          success_message: "Ви будете перенаправлені до профілю.",
          error_title: "Не вдалося.",
          error_message: "Спробуйте ще раз.",
        },
        errors: {
          name: {
            required: "Назва є обов’язковою",
            max_length: "Назва робочого простору не може перевищувати 80 символів",
          },
          company_size: {
            required: "Розмір компанії є обов’язковим",
          },
        },
      },
      members: {
        title: "Учасники",
        add_member: "Додати учасника",
        pending_invites: "Очікувані запрошення",
        invitations_sent_successfully: "Запрошення успішно надіслано",
        leave_confirmation: "Справді вийти з цього простору? Ви втратите доступ. Дія незворотна.",
        details: {
          full_name: "Повне ім’я",
          display_name: "Відображуване ім’я",
          email_address: "Електронна пошта",
          account_type: "Тип облікового запису",
          authentication: "Автентифікація",
          joining_date: "Дата приєднання",
        },
        modal: {
          title: "Запросити колег",
          description: "Запросіть людей для співпраці.",
          button: "Надіслати запрошення",
          button_loading: "Надсилання запрошень",
          placeholder: "ім’я@компанія.ua",
          errors: {
            required: "Потрібно вказати адресу електронної пошти.",
            invalid: "Неправильна адреса електронної пошти",
          },
        },
      },
      billing_and_plans: {
        title: "Платежі та плани",
        current_plan: "Поточний план",
        free_plan: "Ви використовуєте безкоштовний план",
        view_plans: "Переглянути плани",
      },
      exports: {
        title: "Експорти",
        exporting: "Експортування",
        previous_exports: "Попередні експорти",
        export_separate_files: "Експортувати дані в окремі файли",
        filters_info: "Застосуйте фільтри для експорту конкретних робочих елементів за вашими критеріями.",
        modal: {
          title: "Експортувати в",
          toasts: {
            success: {
              title: "Експорт успішний",
              message: "Ви можете завантажити експортовані {entity} у попередніх експортованих файлах.",
            },
            error: {
              title: "Експорт не вдався",
              message: "Спробуйте ще раз.",
            },
          },
        },
      },
      webhooks: {
        title: "Вебхуки",
        add_webhook: "Додати вебхук",
        modal: {
          title: "Створити вебхук",
          details: "Деталі вебхука",
          payload: "URL для надсилання даних",
          question: "Які події мають запускати цей вебхук?",
          error: "URL є обов’язковим",
        },
        secret_key: {
          title: "Секретний ключ",
          message: "Згенеруйте токен для авторизації вебхука",
        },
        options: {
          all: "Надсилати все",
          individual: "Вибрати окремі події",
        },
        toasts: {
          created: {
            title: "Вебхук створено",
            message: "Вебхук успішно створено",
          },
          not_created: {
            title: "Вебхук не створено",
            message: "Не вдалося створити вебхук",
          },
          updated: {
            title: "Вебхук оновлено",
            message: "Вебхук успішно оновлено",
          },
          not_updated: {
            title: "Не вдалося оновити вебхук",
            message: "Не вдалося оновити вебхук",
          },
          removed: {
            title: "Вебхук видалено",
            message: "Вебхук успішно видалено",
          },
          not_removed: {
            title: "Не вдалося видалити вебхук",
            message: "Не вдалося видалити вебхук",
          },
          secret_key_copied: {
            message: "Секретний ключ скопійовано до буфера.",
          },
          secret_key_not_copied: {
            message: "Помилка під час копіювання ключа.",
          },
        },
      },
      api_tokens: {
        title: "API токени",
        add_token: "Додати API токен",
        create_token: "Створити токен",
        never_expires: "Ніколи не спливає",
        generate_token: "Згенерувати токен",
        generating: "Генерація",
        delete: {
          title: "Видалити API токен",
          description: "Застосунки, які використовують цей токен, втратять доступ. Ця дія незворотна.",
          success: {
            title: "Успіх!",
            message: "Токен успішно видалено",
          },
          error: {
            title: "Помилка!",
            message: "Не вдалося видалити токен",
          },
        },
      },
    },
    empty_state: {
      api_tokens: {
        title: "Немає API токенів",
        description: "Використовуйте API, щоб інтегрувати Plane із зовнішніми системами.",
      },
      webhooks: {
        title: "Немає вебхуків",
        description: "Створіть вебхуки для автоматизації дій.",
      },
      exports: {
        title: "Немає експортів",
        description: "Історія експортів з’явиться тут.",
      },
      imports: {
        title: "Немає імпортів",
        description: "Історія імпортів з’явиться тут.",
      },
    },
  },
  profile: {
    label: "Профіль",
    page_label: "Ваша робота",
    work: "Робота",
    details: {
      joined_on: "Приєднався",
      time_zone: "Часовий пояс",
    },
    stats: {
      workload: "Навантаження",
      overview: "Огляд",
      created: "Створені одиниці",
      assigned: "Призначені одиниці",
      subscribed: "Підписані одиниці",
      state_distribution: {
        title: "Одиниці за станом",
        empty: "Створіть одиниці, щоб переглянути статистику станів.",
      },
      priority_distribution: {
        title: "Одиниці за пріоритетом",
        empty: "Створіть одиниці, щоб переглянути статистику пріоритетів.",
      },
      recent_activity: {
        title: "Нещодавня активність",
        empty: "Активність не знайдена.",
        button: "Завантажити сьогоднішню активність",
        button_loading: "Завантаження",
      },
    },
    actions: {
      profile: "Профіль",
      security: "Безпека",
      activity: "Активність",
      appearance: "Зовнішній вигляд",
      notifications: "Сповіщення",
    },
    tabs: {
      summary: "Зведення",
      assigned: "Призначено",
      created: "Створено",
      subscribed: "Підписано",
      activity: "Активність",
    },
    empty_state: {
      activity: {
        title: "Немає активності",
        description: "Створіть робочу одиницю, щоб почати.",
      },
      assigned: {
        title: "Немає призначених робочих одиниць",
        description: "Тут будуть відображатися одиниці, призначені вам.",
      },
      created: {
        title: "Немає створених робочих одиниць",
        description: "Тут будуть відображатися одиниці, які ви створили.",
      },
      subscribed: {
        title: "Немає підписаних робочих одиниць",
        description: "Підпишіться на потрібні одиниці, й вони з’являться тут.",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "Введіть ID проєкту",
      please_select_a_timezone: "Виберіть часовий пояс",
      archive_project: {
        title: "Заархівувати проєкт",
        description: "Архівування приховає проєкт із меню. Доступ залишиться через сторінку проєктів.",
        button: "Заархівувати проєкт",
      },
      delete_project: {
        title: "Видалити проєкт",
        description: "Видалення проєкту призведе до знищення всіх даних. Дія незворотна.",
        button: "Видалити проєкт",
      },
      toast: {
        success: "Проєкт оновлено",
        error: "Не вдалося оновити. Спробуйте знову.",
      },
    },
    members: {
      label: "Учасники",
      project_lead: "Керівник проєкту",
      default_assignee: "Типовий виконавець",
      guest_super_permissions: {
        title: "Надати гостям доступ до всіх одиниць:",
        sub_heading: "Гості бачитимуть усі одиниці у проєкті.",
      },
      invite_members: {
        title: "Запросити учасників",
        sub_heading: "Запросіть учасників до проєкту.",
        select_co_worker: "Вибрати колегу",
      },
    },
    states: {
      describe_this_state_for_your_members: "Опишіть цей стан для учасників.",
      empty_state: {
        title: "Немає станів у групі {groupKey}",
        description: "Створіть новий стан",
      },
    },
    labels: {
      label_title: "Назва мітки",
      label_title_is_required: "Назва мітки є обов’язковою",
      label_max_char: "Назва мітки не може перевищувати 255 символів",
      toast: {
        error: "Помилка під час оновлення мітки",
      },
    },
    estimates: {
      label: "Оцінки",
      title: "Увімкнути оцінки для мого проєкту",
      description: "Вони допомагають вам повідомляти про складність та навантаження команди.",
      no_estimate: "Без оцінки",
      new: "Нова система оцінок",
      create: {
        custom: "Власний",
        start_from_scratch: "Почати з нуля",
        choose_template: "Вибрати шаблон",
        choose_estimate_system: "Вибрати систему оцінок",
        enter_estimate_point: "Введіть оцінку",
        step: "Крок {step} з {total}",
        label: "Створити оцінку",
      },
      toasts: {
        created: {
          success: {
            title: "Оцінку створено",
            message: "Оцінку успішно створено",
          },
          error: {
            title: "Не вдалося створити оцінку",
            message: "Не вдалося створити нову оцінку, спробуйте ще раз.",
          },
        },
        updated: {
          success: {
            title: "Оцінку змінено",
            message: "Оцінку оновлено у вашому проєкті.",
          },
          error: {
            title: "Не вдалося змінити оцінку",
            message: "Не вдалося змінити оцінку, спробуйте ще раз",
          },
        },
        enabled: {
          success: {
            title: "Успіх!",
            message: "Оцінки увімкнено.",
          },
        },
        disabled: {
          success: {
            title: "Успіх!",
            message: "Оцінки вимкнено.",
          },
          error: {
            title: "Помилка!",
            message: "Не вдалося вимкнути оцінку. Спробуйте ще раз",
          },
        },
      },
      validation: {
        min_length: "Оцінка має бути більшою за 0.",
        unable_to_process: "Не вдалося обробити ваш запит, спробуйте ще раз.",
        numeric: "Оцінка має бути числовим значенням.",
        character: "Оцінка має бути символьним значенням.",
        empty: "Значення оцінки не може бути порожнім.",
        already_exists: "Таке значення оцінки вже існує.",
        unsaved_changes: "У вас є незбережені зміни. Збережіть їх перед тим, як натиснути 'готово'",
        remove_empty:
          "Оцінка не може бути порожньою. Введіть значення в кожне поле або видаліть ті, для яких у вас немає значень.",
      },
      systems: {
        points: {
          label: "Бали",
          fibonacci: "Фібоначчі",
          linear: "Лінійна",
          squares: "Квадрати",
          custom: "Власна",
        },
        categories: {
          label: "Категорії",
          t_shirt_sizes: "Розміри футболок",
          easy_to_hard: "Від легкого до складного",
          custom: "Власна",
        },
        time: {
          label: "Час",
          hours: "Години",
        },
      },
    },
    automations: {
      label: "Автоматизація",
      "auto-archive": {
        title: "Автоматично архівувати закриті одиниці",
        description: "Plane архівуватиме завершені або скасовані одиниці.",
        duration: "Архівувати одиниці, закриті понад",
      },
      "auto-close": {
        title: "Автоматично закривати одиниці",
        description: "Plane закриватиме неактивні одиниці.",
        duration: "Закривати одиниці, що неактивні понад",
        auto_close_status: "Стан для автоматичного закриття",
      },
    },
    empty_state: {
      labels: {
        title: "Немає міток",
        description: "Створіть мітки для організації робочих одиниць.",
      },
      estimates: {
        title: "Немає систем оцінок",
        description: "Створіть систему оцінок, щоб відображати навантаження.",
        primary_button: "Додати систему оцінок",
      },
    },
    features: {
      cycles: {
        title: "Цикли",
        short_title: "Цикли",
        description: "Плануйте роботу в гнучких періодах, які адаптуються до унікального ритму та темпу цього проекту.",
        toggle_title: "Увімкнути цикли",
        toggle_description: "Плануйте роботу в цілеспрямовані періоди часу.",
      },
      modules: {
        title: "Модулі",
        short_title: "Модулі",
        description: "Організуйте роботу в підпроекти з виділеними керівниками та виконавцями.",
        toggle_title: "Увімкнути модулі",
        toggle_description: "Учасники проекту зможуть створювати та редагувати модулі.",
      },
      views: {
        title: "Перегляди",
        short_title: "Перегляди",
        description:
          "Зберігайте користувацькі сортування, фільтри та параметри відображення або діліться ними з командою.",
        toggle_title: "Увімкнути перегляди",
        toggle_description: "Учасники проекту зможуть створювати та редагувати перегляди.",
      },
      pages: {
        title: "Сторінки",
        short_title: "Сторінки",
        description: "Створюйте та редагуйте вільний контент: нотатки, документи, що завгодно.",
        toggle_title: "Увімкнути сторінки",
        toggle_description: "Учасники проекту зможуть створювати та редагувати сторінки.",
      },
      intake: {
        title: "Прийом",
        short_title: "Прийом",
        description:
          "Дозвольте не-учасникам ділитися помилками, відгуками та пропозиціями; не порушуючи ваш робочий процес.",
        toggle_title: "Увімкнути прийом",
        toggle_description: "Дозволити учасникам проекту створювати запити на прийом в додатку.",
      },
    },
  },
  project_cycles: {
    add_cycle: "Додати цикл",
    more_details: "Докладніше",
    cycle: "Цикл",
    update_cycle: "Оновити цикл",
    create_cycle: "Створити цикл",
    no_matching_cycles: "Немає циклів за цим запитом",
    remove_filters_to_see_all_cycles: "Приберіть фільтри, щоб побачити всі цикли",
    remove_search_criteria_to_see_all_cycles: "Приберіть критерії пошуку, щоб побачити всі цикли",
    only_completed_cycles_can_be_archived: "Архівувати можна лише завершені цикли",
    start_date: "Дата початку",
    end_date: "Дата завершення",
    in_your_timezone: "У вашому часовому поясі",
    transfer_work_items: "Перенести {count} робочих одиниць",
    date_range: "Діапазон дат",
    add_date: "Додати дату",
    active_cycle: {
      label: "Активний цикл",
      progress: "Прогрес",
      chart: "Burndown-графік",
      priority_issue: "Найпріоритетніші одиниці",
      assignees: "Призначені",
      issue_burndown: "Burndown робочих одиниць",
      ideal: "Ідеальний",
      current: "Поточний",
      labels: "Мітки",
    },
    upcoming_cycle: {
      label: "Майбутній цикл",
    },
    completed_cycle: {
      label: "Завершений цикл",
    },
    status: {
      days_left: "Залишилося днів",
      completed: "Завершено",
      yet_to_start: "Ще не почався",
      in_progress: "У процесі",
      draft: "Чернетка",
    },
    action: {
      restore: {
        title: "Відновити цикл",
        success: {
          title: "Цикл відновлено",
          description: "Цикл було відновлено.",
        },
        failed: {
          title: "Не вдалося відновити цикл",
          description: "Відновити цикл не вдалося.",
        },
      },
      favorite: {
        loading: "Додавання у вибране",
        success: {
          description: "Цикл додано у вибране.",
          title: "Успіх!",
        },
        failed: {
          description: "Не вдалося додати у вибране.",
          title: "Помилка!",
        },
      },
      unfavorite: {
        loading: "Вилучення з вибраного",
        success: {
          description: "Цикл вилучено з вибраного.",
          title: "Успіх!",
        },
        failed: {
          description: "Не вдалося вилучити з вибраного.",
          title: "Помилка!",
        },
      },
      update: {
        loading: "Оновлення циклу",
        success: {
          description: "Цикл оновлено.",
          title: "Успіх!",
        },
        failed: {
          description: "Не вдалося оновити цикл.",
          title: "Помилка!",
        },
        error: {
          already_exists: "Цикл із цими датами вже існує. Для чернетки видаліть дати.",
        },
      },
    },
    empty_state: {
      general: {
        title: "Групуйте роботу за циклами.",
        description: "Обмежуйте роботу в часі, слідкуйте за крайніми строками та рухайтеся вперед.",
        primary_button: {
          text: "Створіть перший цикл",
          comic: {
            title: "Цикли — це повторювані періоди.",
            description: "Спрайт, ітерація або будь-який інший період часу для відстеження роботи.",
          },
        },
      },
      no_issues: {
        title: "У циклі немає робочих одиниць",
        description: "Додайте ті одиниці, які хочете відстежувати.",
        primary_button: {
          text: "Створити одиницю",
        },
        secondary_button: {
          text: "Додати наявну одиницю",
        },
      },
      completed_no_issues: {
        title: "У циклі немає робочих одиниць",
        description: "Одиниці переміщено або приховано. Щоб побачити їх, змініть властивості.",
      },
      active: {
        title: "Немає активного циклу",
        description: "Активний цикл — це цикл, що містить сьогоднішню дату. Відстежуйте його прогрес тут.",
      },
      archived: {
        title: "Немає заархівованих циклів",
        description: "Заархівуйте завершені цикли, щоб не захаращувати список.",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "Створіть і призначте робочу одиницю",
        description: "Робочі одиниці — це завдання, які ви призначаєте собі чи команді. Відстежуйте їхній прогрес.",
        primary_button: {
          text: "Створити першу одиницю",
          comic: {
            title: "Робочі одиниці — будівельні блоки",
            description: "Наприклад: редизайн інтерфейсу, ребрендинг, нова система.",
          },
        },
      },
      no_archived_issues: {
        title: "Немає заархівованих одиниць",
        description: "Архівуйте завершені чи скасовані одиниці. Налаштуйте автоматизацію.",
        primary_button: {
          text: "Налаштувати автоматизацію",
        },
      },
      issues_empty_filter: {
        title: "Немає одиниць за цим фільтром",
        secondary_button: {
          text: "Скинути фільтри",
        },
      },
    },
  },
  project_module: {
    add_module: "Додати модуль",
    update_module: "Оновити модуль",
    create_module: "Створити модуль",
    archive_module: "Заархівувати модуль",
    restore_module: "Відновити модуль",
    delete_module: "Видалити модуль",
    empty_state: {
      general: {
        title: "Об’єднуйте ключові етапи в модулі.",
        description:
          "Модулі структурують одиниці під окремими логічними компонентами. Відстежуйте крайні строки та прогрес.",
        primary_button: {
          text: "Створити перший модуль",
          comic: {
            title: "Модулі — це ієрархічні об’єднання.",
            description: "Наприклад: модуль кошика, шасі, складу.",
          },
        },
      },
      no_issues: {
        title: "У модулі немає одиниць",
        description: "Додайте одиниці до модуля.",
        primary_button: {
          text: "Створити одиниці",
        },
        secondary_button: {
          text: "Додати наявну одиницю",
        },
      },
      archived: {
        title: "Немає заархівованих модулів",
        description: "Архівуйте завершені або скасовані модулі.",
      },
      sidebar: {
        in_active: "Модуль неактивний.",
        invalid_date: "Неправильна дата. Вкажіть коректну.",
      },
    },
    quick_actions: {
      archive_module: "Заархівувати модуль",
      archive_module_description: "Архівувати можна лише завершені/скасовані модулі.",
      delete_module: "Видалити модуль",
    },
    toast: {
      copy: {
        success: "Посилання на модуль скопійовано",
      },
      delete: {
        success: "Модуль видалено",
        error: "Не вдалося видалити",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "Зберігайте фільтри як подання.",
        description: "Подання — це збережені фільтри для швидкого доступу. Діліться ними з командою.",
        primary_button: {
          text: "Створити перше подання",
          comic: {
            title: "Подання працюють з властивостями одиниць.",
            description: "Створіть подання з потрібними фільтрами.",
          },
        },
      },
      filter: {
        title: "Немає подань за цим фільтром",
        description: "Створіть нове подання.",
      },
    },
    delete_view: {
      title: "Ви впевнені, що хочете видалити це подання?",
      content:
        "Якщо ви підтвердите, всі параметри сортування, фільтрації та відображення + макет, який ви обрали для цього подання, будуть безповоротно видалені без можливості відновлення.",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title: "Пишіть нотатки, документи або базу знань із допомогою AI Galileo.",
        description:
          "Сторінки — це простір для ідей. Пишіть, форматуйте, вбудовуйте робочі одиниці та використовуйте компоненти.",
        primary_button: {
          text: "Створити першу сторінку",
        },
      },
      private: {
        title: "Немає приватних сторінок",
        description: "Ви можете зберігати сторінки лише для себе. Поділіться, коли будете готові.",
        primary_button: {
          text: "Створити сторінку",
        },
      },
      public: {
        title: "Немає публічних сторінок",
        description: "Тут з’являться сторінки, якими діляться в проєкті.",
        primary_button: {
          text: "Створити сторінку",
        },
      },
      archived: {
        title: "Немає заархівованих сторінок",
        description: "Архівуйте сторінки для подальшого перегляду.",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "Немає результатів",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "Немає відповідних одиниць",
      },
      no_issues: {
        title: "Немає одиниць",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "Коментарів немає",
        description: "Коментарі використовуються для обговорення та відстеження.",
      },
    },
  },
  notification: {
    label: "Скринька",
    page_label: "{workspace} - Скринька",
    options: {
      mark_all_as_read: "Позначити все як прочитане",
      mark_read: "Позначити як прочитане",
      mark_unread: "Позначити як непрочитане",
      refresh: "Оновити",
      filters: "Фільтри скриньки",
      show_unread: "Показати непрочитані",
      show_snoozed: "Показати відкладені",
      show_archived: "Показати заархівовані",
      mark_archive: "Заархівувати",
      mark_unarchive: "Повернути з архіву",
      mark_snooze: "Відкласти",
      mark_unsnooze: "Повернути з відкладених",
    },
    toasts: {
      read: "Сповіщення прочитано",
      unread: "Позначено як непрочитане",
      archived: "Заархівовано",
      unarchived: "Повернуто з архіву",
      snoozed: "Відкладено",
      unsnoozed: "Повернуто з відкладених",
    },
    empty_state: {
      detail: {
        title: "Виберіть елемент, щоб побачити деталі.",
      },
      all: {
        title: "Немає призначених одиниць",
        description: "Тут відображатимуться оновлення щодо призначених вам одиниць.",
      },
      mentions: {
        title: "Немає згадок",
        description: "Тут відображатимуться згадки про вас.",
      },
    },
    tabs: {
      all: "Усе",
      mentions: "Згадки",
    },
    filter: {
      assigned: "Призначені мені",
      created: "Створені мною",
      subscribed: "Підписані мною",
    },
    snooze: {
      "1_day": "1 день",
      "3_days": "3 дні",
      "5_days": "5 днів",
      "1_week": "1 тиждень",
      "2_weeks": "2 тижні",
      custom: "Власне",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "Додайте одиниці, щоб відстежувати прогрес",
      },
      chart: {
        title: "Додайте одиниці, щоб побачити burndown-графік.",
      },
      priority_issue: {
        title: "Тут з’являться найпріоритетніші робочі одиниці.",
      },
      assignee: {
        title: "Призначте робочі одиниці, щоб побачити розподіл.",
      },
      label: {
        title: "Додайте мітки, щоб аналізувати за мітками.",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "Надходження не увімкнені",
        description: "Увімкніть надходження в налаштуваннях проєкту, щоб керувати заявками.",
        primary_button: {
          text: "Керувати функціями",
        },
      },
      cycle: {
        title: "Цикли не увімкнені",
        description: "Увімкніть цикли, щоб обмежувати роботу в часі.",
        primary_button: {
          text: "Керувати функціями",
        },
      },
      module: {
        title: "Модулі не увімкнені",
        description: "Увімкніть модулі в налаштуваннях проєкту.",
        primary_button: {
          text: "Керувати функціями",
        },
      },
      page: {
        title: "Сторінки не увімкнені",
        description: "Увімкніть сторінки в налаштуваннях проєкту.",
        primary_button: {
          text: "Керувати функціями",
        },
      },
      view: {
        title: "Подання не увімкнене",
        description: "Увімкніть подання в налаштуваннях проєкту.",
        primary_button: {
          text: "Керувати функціями",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "Створити чернетку одиниці",
    empty_state: {
      title: "Тут відображатимуться ваші чернетки одиниць та коментарів.",
      description: "Почніть створювати одиницю і залиште її як чернетку.",
      primary_button: {
        text: "Створити першу чернетку",
      },
    },
    delete_modal: {
      title: "Видалити чернетку",
      description: "Справді видалити цю чернетку? Дію неможливо скасувати.",
    },
    toasts: {
      created: {
        success: "Чернетку створено",
        error: "Не вдалося створити",
      },
      deleted: {
        success: "Чернетку видалено",
      },
    },
  },
  stickies: {
    title: "Ваші нотатки",
    placeholder: "клікніть, щоб почати вводити",
    all: "Усі нотатки",
    "no-data": "Фіксуйте ідеї та думки. Додайте першу нотатку.",
    add: "Додати нотатку",
    search_placeholder: "Пошук за назвою",
    delete: "Видалити нотатку",
    delete_confirmation: "Справді видалити цю нотатку?",
    empty_state: {
      simple: "Фіксуйте ідеї та думки. Додайте першу нотатку.",
      general: {
        title: "Нотатки — це швидкі записи.",
        description: "Записуйте думки та отримуйте до них доступ з будь-якого пристрою.",
        primary_button: {
          text: "Додати нотатку",
        },
      },
      search: {
        title: "Нотаток не знайдено.",
        description: "Спробуйте інший пошуковий запит або створіть нову нотатку.",
        primary_button: {
          text: "Додати нотатку",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "Назва нотатки може бути не більш ніж 100 символів.",
        already_exists: "Нотатка без опису вже існує",
      },
      created: {
        title: "Нотатку створено",
        message: "Нотатку успішно створено",
      },
      not_created: {
        title: "Не вдалося створити",
        message: "Нотатку не вдалося створити",
      },
      updated: {
        title: "Нотатку оновлено",
        message: "Нотатку успішно оновлено",
      },
      not_updated: {
        title: "Не вдалося оновити",
        message: "Нотатку не вдалося оновити",
      },
      removed: {
        title: "Нотатку видалено",
        message: "Нотатку успішно видалено",
      },
      not_removed: {
        title: "Не вдалося видалити",
        message: "Нотатку не вдалося видалити",
      },
    },
  },
  role_details: {
    guest: {
      title: "Гість",
      description: "Зовнішні учасники можуть бути запрошені як гості.",
    },
    member: {
      title: "Учасник",
      description: "Може читати, створювати, редагувати та видаляти сутності.",
    },
    admin: {
      title: "Адміністратор",
      description: "Має всі права в робочому просторі.",
    },
  },
  user_roles: {
    product_or_project_manager: "Продуктовий/Проєктний менеджер",
    development_or_engineering: "Розробка/Інженерія",
    founder_or_executive: "Засновник/Керівник",
    freelancer_or_consultant: "Фрілансер/Консультант",
    marketing_or_growth: "Маркетинг/Зростання",
    sales_or_business_development: "Продажі/Розвиток бізнесу",
    support_or_operations: "Підтримка/Операції",
    student_or_professor: "Студент/Професор",
    human_resources: "HR (кадри)",
    other: "Інше",
  },
  importer: {
    github: {
      title: "GitHub",
      description: "Імпортуйте одиниці з репозиторіїв GitHub.",
    },
    jira: {
      title: "Jira",
      description: "Імпортуйте одиниці та епіки з Jira.",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "Експортуйте одиниці у формат CSV.",
      short_description: "Експортувати як CSV",
    },
    excel: {
      title: "Excel",
      description: "Експортуйте одиниці у формат Excel.",
      short_description: "Експортувати як Excel",
    },
    xlsx: {
      title: "Excel",
      description: "Експортуйте одиниці у формат Excel.",
      short_description: "Експортувати як Excel",
    },
    json: {
      title: "JSON",
      description: "Експортуйте одиниці у формат JSON.",
      short_description: "Експортувати як JSON",
    },
  },
  default_global_view: {
    all_issues: "Усі одиниці",
    assigned: "Призначено",
    created: "Створено",
    subscribed: "Підписано",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "Системні налаштування",
      },
      light: {
        label: "Світла",
      },
      dark: {
        label: "Темна",
      },
      light_contrast: {
        label: "Світла з високою контрастністю",
      },
      dark_contrast: {
        label: "Темна з високою контрастністю",
      },
      custom: {
        label: "Користувацька тема",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "Backlog",
      planned: "Заплановано",
      in_progress: "У процесі",
      paused: "Призупинено",
      completed: "Завершено",
      cancelled: "Скасовано",
    },
    layout: {
      list: "Список",
      board: "Дошка",
      timeline: "Шкала часу",
    },
    order_by: {
      name: "Назва",
      progress: "Прогрес",
      issues: "Кількість одиниць",
      due_date: "Крайній термін",
      created_at: "Дата створення",
      manual: "Вручну",
    },
  },
  cycle: {
    label: "{count, plural, one {Цикл} few {Цикли} other {Циклів}}",
    no_cycle: "Немає циклу",
  },
  module: {
    label: "{count, plural, one {Модуль} few {Модулі} other {Модулів}}",
    no_module: "Немає модуля",
  },
  description_versions: {
    last_edited_by: "Останнє редагування",
    previously_edited_by: "Раніше відредаговано",
    edited_by: "Відредаговано",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane не запустився. Це може бути через те, що один або декілька сервісів Plane не змогли запуститися.",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "Виберіть View Logs з setup.sh та логів Docker, щоб переконатися.",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "Структура",
        empty_state: {
          title: "Відсутні заголовки",
          description: "Давайте додамо кілька заголовків на цю сторінку, щоб побачити їх тут.",
        },
      },
      info: {
        label: "Інформація",
        document_info: {
          words: "Слова",
          characters: "Символи",
          paragraphs: "Абзаци",
          read_time: "Час читання",
        },
        actors_info: {
          edited_by: "Відредаговано",
          created_by: "Створено",
        },
        version_history: {
          label: "Історія версій",
          current_version: "Поточна версія",
        },
      },
      assets: {
        label: "Ресурси",
        download_button: "Завантажити",
        empty_state: {
          title: "Відсутні зображення",
          description: "Додайте зображення, щоб побачити їх тут.",
        },
      },
    },
    open_button: "Відкрити панель навігації",
    close_button: "Закрити панель навігації",
    outline_floating_button: "Відкрити структуру",
  },
} as const;
