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
    we_are_working_on_this_if_you_need_immediate_assistance: "Ми працюємо над цим. Якщо вам потрібна негайна допомога,",
    reach_out_to_us: "зв&apos;яжіться з нами",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our:
      "Інакше спробуйте періодично оновлювати сторінку або відвідайте нашу",
    status_page: "сторінку статусу",
  },
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
    pi_chat: "ШІ Чат",
    initiatives: "Інішіативз",
    teamspaces: "Тімспейсиз",
    epics: "Епікс",
    upgrade_plan: "Апгрейд план",
    plane_pro: "Плейн Про",
    business: "Бізнес",
    customers: "Кастомерз",
    recurring_work_items: "Повторювані робочі елементи",
  },
  auth: {
    common: {
      email: {
        label: "Електронна пошта",
        placeholder: "ім'я@компанія.ua",
        errors: {
          required: "Електронна пошта є обов'язковою",
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
      username: {
        label: "Ім'я користувача",
        placeholder: "Введіть ваше ім'я користувача",
      },
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
    ldap: {
      header: {
        label: "Продовжити з {ldapProviderName}",
        sub_header: "Введіть ваші облікові дані {ldapProviderName}",
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
  first_name: "Ім'я",
  last_name: "Прізвище",
  email: "Електронна пошта",
  display_name: "Відображуване ім'я",
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
  select_or_customize_your_interface_color_scheme: "Виберіть або налаштуйте колірну схему інтерфейсу.",
  select_the_cursor_motion_style_that_feels_right_for_you: "Виберіть стиль руху курсору, який вам підходить.",
  theme: "Тема",
  smooth_cursor: "Плавний курсор",
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
  background_color_is_required: "Колір фону є обов'язковим",
  text_color_is_required: "Колір тексту є обов'язковим",
  primary_color_is_required: "Основний колір є обов'язковим",
  sidebar_background_color_is_required: "Колір фону бічної панелі є обов'язковим",
  sidebar_text_color_is_required: "Колір тексту бічної панелі є обов'язковим",
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
  name_is_required: "Назва є обов'язковою",
  title_should_be_less_than_255_characters: "Назва має бути коротшою за 255 символів",
  project_name: "Назва проєкту",
  project_id_must_be_at_least_1_character: "Ідентифікатор проєкту має містити принаймні 1 символ",
  project_id_must_be_at_most_5_characters: "Ідентифікатор проєкту може містити максимум 5 символів",
  project_id: "ID проєкту",
  project_id_tooltip_content: "Допомагає унікально ідентифікувати робочі одиниці в проєкті. Макс. 10 символів.",
  description_placeholder: "Опис",
  only_alphanumeric_non_latin_characters_allowed: "Дозволені лише алфанумеричні та нелатинські символи.",
  project_id_is_required: "ID проєкту є обов'язковим",
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
  pages: {
    link_pages: "Сторінки з'єднати",
    show_wiki_pages: "Показати сторінки Wiki",
    link_pages_to: "Сторінки з'єднати до",
    linked_pages: "Пов'язані сторінки",
    no_description: "Ця сторінка порожня. Напишіть щось і подивіться це тут як цей замісник",
    toasts: {
      link: {
        success: {
          title: "Сторінки оновлені",
          message: "Сторінки були успішно оновлені",
        },
        error: {
          title: "Сторінки не оновлені",
          message: "Сторінки не оновлені",
        },
      },
      remove: {
        success: {
          title: "Сторінка видалена",
          message: "Сторінка була успішно видалена",
        },
        error: {
          title: "Сторінка не видалена",
          message: "Сторінка не видалена",
        },
      },
    },
  },
  intake: "Надходження",
  renew: "Оновити",
  preview: "Попередній перегляд",
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
  contact_sales: "Зв'язатися з відділом продажів",
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
  forum: "Forum",
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
  you_can_see_here_if_someone_invites_you_to_a_workspace: "Тут з'являтимуться запрошення до робочого простору",
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
  title_is_required: "Назва є обов'язковою",
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
  subscriber: "{count, plural, one{# Підписник} other{# Підписників}}",
  you: "Ви",
  labels: "Мітки",
  create_new_label: "Створити нову мітку",
  label_name: "Назва мітки",
  failed_to_create_label: "Не вдалося створити мітку. Будь ласка, спробуйте ще раз.",
  start_date: "Дата початку",
  end_date: "Дата завершення",
  due_date: "Крайній термін",
  estimate: "Оцінка",
  change_parent_issue: "Змінити батьківську робочу одиницю",
  remove_parent_issue: "Вилучити батьківську робочу одиницю",
  add_parent: "Додати батьківську",
  loading_members: "Завантаження учасників",
  view_link_copied_to_clipboard: "Посилання на подання скопійовано до буфера обміну.",
  required: "Обов'язково",
  optional: "Необов'язково",
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
  upgrade_request: "Попросіть адміністратора робочого простору виконати оновлення.",
  copied_to_clipboard: "Скопійовано в буфер обміну",
  copied_to_clipboard_description: "URL успішно скопійовано в буфер обміну",
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
        description: `Схоже, що всі ваші віджети вимкнені. Увімкніть їх
для покращеного досвіду!`,
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
        project: "Ваші нещодавні проєкти з'являться тут після перегляду.",
        page: "Ваші нещодавні сторінки з'являться тут після перегляду.",
        issue: "Ваші нещодавні робочі одиниці з'являться тут після перегляду.",
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
    business_trial_banner: {
      title: "Ваш 14-денний пробний період плану Business активний!",
      description:
        "Ознайомтеся з усіма функціями Business. Коли будете готові, оберіть підписку. Автоматичне списання не здійснюється.",
      trial_ends_today: "Пробний період закінчується сьогодні",
      trial_ends_in_days: "Пробний період закінчується через {days, plural, one {# день} few {# дні} other {# днів}}",
      start_subscription: "Оформити підписку",
      explore_business_features: "Ознайомитися з функціями Business",
    },
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
    updated_at: "Оновлено",
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
    additional_updates: "Додаткові оновлення",
    clear_all: "Очистити все",
    copied: "Скопійовано!",
    link_copied: "Посилання скопійовано!",
    link_copied_to_clipboard: "Посилання скопійовано до буфера обміну",
    copied_to_clipboard: "Посилання на робочу одиницю скопійовано до буфера",
    branch_name_copied_to_clipboard: "Назву гілки скопійовано до буфера",
    is_copied_to_clipboard: "Робочу одиницю скопійовано до буфера",
    no_links_added_yet: "Поки що немає доданих посилань",
    add_link: "Додати посилання",
    links: "Посилання",
    go_to_workspace: "Перейти до робочого простору",
    progress: "Прогрес",
    optional: "Необов'язково",
    join: "Приєднатися",
    go_back: "Назад",
    continue: "Продовжити",
    resend: "Надіслати повторно",
    relations: "Зв'язки",
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
      copy_branch_name: "Скопіювати назву гілки",
      archive: "Заархівувати",
      restore: "Відновити",
      delete: "Видалити",
      remove_relation: "Вилучити зв'язок",
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
    mandatory: "Обов'язково",
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
    live: "Лайв",
    change_history: "Історія змін",
    coming_soon: "Незабаром",
    member: "Учасник",
    members: "Учасники",
    you: "Ви",
    upgrade_cta: {
      higher_subscription: "Підвищити до вищого плану",
      talk_to_sales: "Зв'язатися з відділом продажів",
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
    worklogs: "Ворклоги",
    project_updates: "Проджект Апдейти",
    overview: "Оверв'ю",
    workflows: "Воркфлоус",
    templates: "Темплейти",
    members_and_teamspaces: "Члени та командних просторів",
    open_in_full_screen: "Відкрити {page} на повний екран",
  },
  chart: {
    x_axis: "Вісь X",
    y_axis: "Вісь Y",
    metric: "Метрика",
  },
  form: {
    title: {
      required: "Назва є обов'язковою",
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
      required: "Назва епіку є обов'язковою.",
    },
    archive: {
      description: `Архівувати можна лише завершені або скасовані
епіки`,
      label: "Архівувати епік",
      confirm_message: "Ви впевнені, що хочете архівувати епік? Усі архівовані епіки можна буде відновити пізніше.",
      success: {
        label: "Архівація успішна",
        message: "Ваші архіви знаходяться в архівах проєкту.",
      },
      failed: {
        message: "Не вдалося архівувати епік. Спробуйте ще раз.",
      },
    },
  },
  issue: {
    label: "{count, plural, one {Робоча одиниця} few {Робочі одиниці} other {Робочих одиниць}}",
    all: "Усі робочі одиниці",
    edit: "Редагувати робочу одиницю",
    title: {
      label: "Назва робочої одиниці",
      required: "Назва робочої одиниці є обов'язковою.",
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
      relation: "Додати зв'язок",
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
      label: "Пов'язані робочі одиниці",
    },
    archive: {
      description: `Архівувати можна лише завершені або скасовані
робочі одиниці`,
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
      relates_to: "Пов'язана з",
      duplicate: "Дублікат",
      blocked_by: "Заблокована",
      blocking: "Блокує",
      start_before: "Стартує Перед",
      start_after: "Стартує Після",
      finish_before: "Фінішує Перед",
      finish_after: "Фінішує Після",
      implements: "Реалізує",
      implemented_by: "Реалізовано",
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
          "Якщо ви знаєте електронну адресу адміністратора інстанції, натисніть кнопку нижче, щоб зв'язатися з ним.",
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
      body: `Привіт, адміністраторе,

Будь ласка, створіть новий робочий простір з URL [/workspace-name] для [мета створення].

Дякую,
{firstName} {lastName}
{email}`,
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
      cycle_progress: {
        title: "Ще немає даних",
        description:
          "Аналітика прогресу циклу з’явиться тут. Додайте робочі елементи до циклів, щоб почати відстеження прогресу.",
      },
      module_progress: {
        title: "Ще немає даних",
        description:
          "Аналітика прогресу модуля з’явиться тут. Додайте робочі елементи до модулів, щоб почати відстеження прогресу.",
      },
      intake_trends: {
        title: "Ще немає даних",
        description:
          "Аналітика тенденцій intake з’явиться тут. Додайте робочі елементи до intake, щоб почати відстеження тенденцій.",
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
    projects_by_status: "Проєкти за статусом",
    active_users: "Активні користувачі",
    intake_trends: "Тенденції прийому",
    workitem_resolved_vs_pending: "Вирішені vs очікуючі робочі елементи",
    upgrade_to_plan: "Оновіть до {plan}, щоб розблокувати {tab}",
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
        description: `Не знайдено проєктів, що відповідають критеріям.
Створіть новий.`,
      },
      search: {
        description: `Не знайдено проєктів, що відповідають критеріям.
Створіть новий.`,
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
        description: "Тут з'являться одиниці, що відповідають фільтру.",
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
    notifications: {
      select_default_view: "Вибрати подання за замовчуванням",
      compact: "Компактний",
      full: "Повний екран",
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
            required: "Назва є обов'язковою",
            max_length: "Назва робочого простору не може перевищувати 80 символів",
          },
          company_size: {
            required: "Розмір компанії є обов'язковим",
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
          full_name: "Повне ім'я",
          display_name: "Відображуване ім'я",
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
          placeholder: "ім'я@компанія.ua",
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
          error: "URL є обов'язковим",
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
        heading: "API токени",
        description: "Створюйте безпечні API токени для інтеграції ваших даних із зовнішніми системами та додатками.",
        title: "API токени",
        add_token: "Додати токен доступу",
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
      integrations: {
        title: "Інтеграції",
        page_title: "Працюйте зі своїми даними Plane у доступних додатках або у власних.",
        page_description: "Перегляньте всі інтеграції, які використовує цей робочий простір або ви.",
      },
      imports: {
        title: "Імпорти",
      },
      worklogs: {
        title: "Ворклоги",
      },
      group_syncing: {
        title: "Синхронізація груп",
        heading: "Синхронізація груп",
        description:
          "Пов'яжіть групи провайдера ідентичності з проєктами та ролями. Доступ користувачів оновлюється автоматично при зміні членства в групі у вашому IdP, спрощуючи онбординг та офбординг.",
        enable: {
          title: "Увімкнути синхронізацію груп",
          description: "Автоматично додавайте користувачів до проєктів на основі груп провайдера ідентичності.",
        },
        config: {
          title: "Налаштувати синхронізацію груп",
          description: "Налаштуйте, як групи провайдера ідентичності зіставляються з проєктами та ролями.",
          sync_on_login: {
            title: "Синхронізація при вході",
            description: "Оновлюйте членство в групі та доступ до проєкту при вході користувача.",
          },
          sync_offline: {
            title: "Офлайн-синхронізація",
            description: "Запускає синхронізацію кожні шість годин автоматично, не чекаючи входу користувачів.",
          },
          auto_remove: {
            title: "Автоматичне видалення",
            description: "Автоматично видаляйте користувачів із проєктів, коли вони більше не відповідають групі.",
          },
          group_attribute_key: {
            title: "Ключ атрибута групи",
            description:
              "Атрибут провайдера ідентичності, що використовується для ідентифікації та синхронізації груп користувачів.",
            placeholder: "Групи",
          },
        },
        group_mapping: {
          title: "Зіставлення груп",
          description: "Пов'яжіть групи провайдера ідентичності з проєктами та ролями.",
          button_text: "Додати нову синхронізацію групи",
        },
        toast: {
          updating: "Оновлення функції синхронізації груп",
          success: "Функцію синхронізації груп успішно оновлено.",
          error: "Не вдалося оновити функцію синхронізації груп!",
        },
        delete_modal: {
          title: "Видалити синхронізацію групи",
          content:
            "Нові користувачі з цієї групи ідентичності більше не будуть додаватися до проєкту. Вже додані користувачі збережуть свою поточну роль.",
        },
        modal: {
          idp_group_name: {
            text: "Група користувачів",
            required: "Група користувачів обов'язкова",
            placeholder: "Введіть назви груп IdP",
          },
          project: {
            text: "Проєкт",
            required: "Проєкт обов'язковий",
            placeholder: "Виберіть проєкт",
          },
          default_role: {
            text: "Роль проєкту",
            required: "Роль проєкту обов'язкова",
            placeholder: "Виберіть роль проєкту",
          },
        },
      },
      identity: {
        title: "Ідентичність",
        heading: "Ідентичність",
        description: "Налаштуйте свій домен і увімкніть єдиний вхід",
      },
      project_states: {
        title: "Проджект стейти",
      },
      projects: {
        title: "Проєкти",
        description: "Керування станами проєктів, увімкнення міток проєктів та інші налаштування.",
        tabs: {
          states: "Проджект стейти",
          labels: "Мітки проєктів",
        },
      },
      teamspaces: {
        title: "Тімспейси",
      },
      initiatives: {
        title: "Ініціативи",
      },
      customers: {
        title: "Кастомери",
      },
      releases: {
        title: "Релізи",
        update_release: "Оновити реліз",
        create_release: "Створити реліз",
        errors: {
          release_not_found: "Реліз, який ви шукаєте, не існує.",
          unknown: "Щось пішло не так. Будь ласка, спробуйте ще раз.",
        },
      },

      cancel_trial: {
        title: "Спочатку скасуйте пробний період.",
        description:
          "У вас активний пробний період одного з наших платних планів. Будь ласка, спочатку скасуйте його, щоб продовжити.",
        dismiss: "Відхилити",
        cancel: "Скасувати пробний період",
        cancel_success_title: "Пробний період скасовано.",
        cancel_success_message: "Тепер ви можете видалити воркспейс.",
        cancel_error_title: "Це не спрацювало.",
        cancel_error_message: "Спробуйте ще раз, будь ласка.",
      },
      applications: {
        title: "Додатки",
        applicationId_copied: "ID додатку скопійовано в буфер обміну",
        clientId_copied: "ID клієнта скопійовано в буфер обміну",
        clientSecret_copied: "Секрет клієнта скопійовано в буфер обміну",
        third_party_apps: "Сторонні додатки",
        your_apps: "Ваші додатки",
        connect: "Підключити",
        connected: "Підключено",
        install: "Встановити",
        installed: "Встановлено",
        configure: "Налаштувати",
        app_available: "Ви зробили цей додаток доступним для використання з робочим простором Plane",
        app_available_description: "Підключіть робочий простір Plane, щоб почати використання",
        client_id_and_secret: "ID та Секрет Клієнта",
        client_id_and_secret_description:
          "Скопіюйте та збережіть цей секретний ключ. Ви не зможете побачити цей ключ після натискання Закрити.",
        client_id_and_secret_download: "Ви можете завантажити CSV з ключем звідси.",
        application_id: "ID Додатку",
        client_id: "ID Клієнта",
        client_secret: "Секрет Клієнта",
        export_as_csv: "Експорт у CSV",
        slug_already_exists: "Слаг вже існує",
        failed_to_create_application: "Не вдалося створити додаток",
        upload_logo: "Завантажити Логотип",
        app_name_title: "Як ви назвете цей додаток",
        app_name_error: "Назва додатку обов'язкова",
        app_short_description_title: "Дайте короткий опис цьому додатку",
        app_short_description_error: "Короткий опис додатку обов'язковий",
        app_description_title: {
          label: "Довгий опис",
          placeholder: "Напишіть довгий опис для маркетплейсу. Натисніть '/' для команд.",
        },
        authorization_grant_type: {
          title: "Тип підключення",
          description:
            "Виберіть, чи має ваш додаток бути встановлений один раз для робочого простору, чи дозволити кожному користувачу підключити свій власний обліковий запис",
        },
        app_description_error: "Опис додатку обов'язковий",
        app_slug_title: "Слаг додатку",
        app_slug_error: "Слаг додатку обов'язковий",
        app_maker_title: "Розробник додатку",
        app_maker_error: "Розробник додатку обов'язковий",
        webhook_url_title: "URL вебхука",
        webhook_url_error: "URL вебхука обов'язковий",
        invalid_webhook_url_error: "Недійсний URL вебхука",
        redirect_uris_title: "URI перенаправлення",
        redirect_uris_error: "URI перенаправлення обов'язкові",
        invalid_redirect_uris_error: "Недійсні URI перенаправлення",
        redirect_uris_description:
          "Введіть URI через пробіл, куди додаток буде перенаправляти після користувача, наприклад https://example.com https://example.com/",
        authorized_javascript_origins_title: "Дозволені джерела JavaScript",
        authorized_javascript_origins_error: "Дозволені джерела JavaScript обов'язкові",
        invalid_authorized_javascript_origins_error: "Недійсні дозволені джерела JavaScript",
        authorized_javascript_origins_description:
          "Введіть джерела через пробіл, звідки додаток зможе робити запити, наприклад app.com example.com",
        create_app: "Створити додаток",
        update_app: "Оновити додаток",
        regenerate_client_secret_description:
          "Перегенерувати секрет клієнта. Після перегенерації ви зможете скопіювати ключ або завантажити його у файл CSV.",
        regenerate_client_secret: "Перегенерувати секрет клієнта",
        regenerate_client_secret_confirm_title: "Ви впевнені, що хочете перегенерувати секрет клієнта?",
        regenerate_client_secret_confirm_description:
          "Додаток, що використовує цей секрет, перестане працювати. Вам потрібно буде оновити секрет у додатку.",
        regenerate_client_secret_confirm_cancel: "Скасувати",
        regenerate_client_secret_confirm_regenerate: "Перегенерувати",
        read_only_access_to_workspace: "Доступ лише для читання до вашого робочого простору",
        write_access_to_workspace: "Доступ для запису до вашого робочого простору",
        read_only_access_to_user_profile: "Доступ лише для читання до вашого профілю користувача",
        write_access_to_user_profile: "Доступ для запису до вашого профілю користувача",
        connect_app_to_workspace: "Підключити {app} до вашого робочого простору {workspace}",
        user_permissions: "Дозволи користувача",
        user_permissions_description:
          "Дозволи користувача використовуються для надання доступу до профілю користувача.",
        workspace_permissions: "Дозволи робочого простору",
        workspace_permissions_description:
          "Дозволи робочого простору використовуються для надання доступу до робочого простору.",
        with_the_permissions: "з дозволами",
        app_consent_title: "{app} запитує доступ до вашого робочого простору та профілю Plane.",
        choose_workspace_to_connect_app_with: "Виберіть робочий простір для підключення додатку",
        app_consent_workspace_permissions_title: "{app} хоче",
        app_consent_user_permissions_title:
          "{app} також може запитати дозвіл користувача на наступні ресурси. Ці дозволи будуть запитані та авторизовані лише користувачем.",
        app_consent_accept_title: "Приймаючи",
        app_consent_accept_1:
          "Ви надаєте додатку доступ до ваших даних Plane скрізь, де ви можете використовувати додаток всередині або поза Plane",
        app_consent_accept_2: "Ви погоджуєтесь з Політикою конфіденційності та Умовами використання {app}",
        accepting: "Прийняття...",
        accept: "Прийняти",
        categories: "Категорії",
        select_app_categories: "Виберіть категорії додатку",
        categories_title: "Категорії",
        categories_error: "Категорії обов'язкові",
        invalid_categories_error: "Недійсні категорії",
        categories_description: "Виберіть категорії, які найкраще описують додаток",
        supported_plans: "Підтримувані Плани",
        supported_plans_description:
          "Виберіть плани робочого простору, які можуть встановити цю програму. Залиште порожнім, щоб дозволити всі плани.",
        select_plans: "Вибрати Плани",
        privacy_policy_url_title: "URL Політики конфіденційності",
        privacy_policy_url_error: "URL Політики конфіденційності обов'язковий",
        invalid_privacy_policy_url_error: "Недійсний URL Політики конфіденційності",
        terms_of_service_url_title: "URL Умов використання",
        terms_of_service_url_error: "URL Умов використання обов'язковий",
        invalid_terms_of_service_url_error: "Недійсний URL Умов використання",
        support_url_title: "URL підтримки",
        support_url_error: "URL підтримки обов'язковий",
        invalid_support_url_error: "Недійсний URL підтримки",
        video_url_title: "URL відео",
        video_url_error: "URL відео обов'язковий",
        invalid_video_url_error: "Недійсний URL відео",
        setup_url_title: "URL налаштування",
        setup_url_error: "URL налаштування обов'язковий",
        invalid_setup_url_error: "Недійсний URL налаштування",
        configuration_url_title: "URL налаштування",
        configuration_url_error: "URL налаштування обов'язковий",
        invalid_configuration_url_error: "Недійсний URL налаштування",
        contact_email_title: "Email контакту",
        contact_email_error: "Email контакту обов'язковий",
        invalid_contact_email_error: "Недійсний email контакту",
        upload_attachments: "Завантажити вкладення",
        uploading_images: "Завантаження {count} зображення{count, plural, one {s} other {s}}",
        drop_images_here: "Перетягніть зображення сюди",
        click_to_upload_images: "Натисніть, щоб завантажити зображення",
        invalid_file_or_exceeds_size_limit: "Недійсний файл або перевищує ліміт розміру ({size} MB)",
        uploading: "Завантаження...",
        upload_and_save: "Завантажити та зберегти",
        app_credentials_regenrated: {
          title: "Облікові дані додатка були успішно згенеровані повторно",
          description:
            "Замініть клієнтський секрет усюди, де він використовується. Попередній секрет більше не дійсний.",
        },
        app_created: {
          title: "Додаток успішно створено",
          description: "Використайте облікові дані, щоб встановити додаток у робочому просторі Plane",
        },
        installed_apps: "Встановлені додатки",
        all_apps: "Усі додатки",
        internal_apps: "Внутрішні додатки",
        website: {
          title: "Вебсайт",
          description: "Посилання на вебсайт вашого додатка.",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "Створювач додатків",
          description: "Особа чи організація, яка створює додаток.",
        },
        setup_url: {
          label: "URL налаштування",
          description: "Користувачі будуть перенаправлені на цю URL після встановлення додатка.",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "URL вебхука",
          description:
            "Тут ми будемо надсилати події вебхука та оновлення з робочих просторів, де встановлено ваш додаток.",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "URI перенаправлення (через пробіл)",
          description: "Користувачі будуть перенаправлені на цей шлях після автентифікації через Plane.",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "Цей додаток можна встановити лише після того, як адміністратор робочого простору його встановить. Зверніться до адміністратора робочого простору, щоб продовжити.",
        enable_app_mentions: "Увімкнути згадки додатка",
        enable_app_mentions_tooltip:
          "Коли це увімкнено, користувачі можуть згадувати або призначати робочі елементи цьому додатку.",
        scopes: "Області доступу",
        select_scopes: "Вибрати області",
        read_access_to: "Доступ лише для читання до",
        write_access_to: "Доступ на запис до",
        global_permission_expiration:
          "Глобальні області доступу незабаром застаріють. Використовуйте деталізовані області. Наприклад, використовуйте project:read замість глобального читання.",
        selected_scopes: "Вибрано: {count}",
        scopes_and_permissions: "Області та дозволи",
        read: "Читання",
        write: "Запис",
        scope_description: {
          projects: "Доступ до проектів та всіх пов’язаних сутностей",
          wiki: "Доступ до вікі та всіх пов’язаних сутностей",
          customers: "Доступ до клієнтів та всіх пов’язаних сутностей",
          initiatives: "Доступ до ініціатив та всіх пов’язаних сутностей",
          workspaces: "Доступ до робочих просторів та всіх пов’язаних сутностей",
          stickies: "Доступ до стікерів та всіх пов’язаних сутностей",
          teamspaces: "Доступ до командних просторів та всіх пов’язаних сутностей",
          profile: "Доступ до інформації профілю користувача",
          agents: "Доступ до агентів та всіх пов’язаних з агентами сутностей",
          assets: "Доступ до активів та всіх пов’язаних з активами сутностей",
        },
        build_your_own_app: "Створіть власний додаток",
        edit_app_details: "Редагувати деталі додатку",
        internal: "Внутрішній",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description:
          "Переглядайте, як ваша робота стає розумнішою та швидшою завдяки штучному інтелекту, який напряму пов'язаний з вашою роботою та базою знань.",
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
        description: "Історія експортів з'явиться тут.",
      },
      imports: {
        title: "Немає імпортів",
        description: "Історія імпортів з'явиться тут.",
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
      connections: "Коннекшнс",
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
        description: "Підпишіться на потрібні одиниці, й вони з'являться тут.",
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
      project_lead_description: "Виберіть керівника проєкту.",
      default_assignee_description: "Виберіть виконавця за замовчуванням для проєкту.",
      project_subscribers: "Підписники проєкту",
      project_subscribers_description: "Виберіть учасників, які отримуватимуть сповіщення для цього проєкту.",
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
      label_title_is_required: "Назва мітки є обов'язковою",
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
        reorder: {
          success: {
            title: "Оцінки переупорядковано",
            message: "Оцінки були переупорядковані у вашому проєкті.",
          },
          error: {
            title: "Не вдалося переупорядкувати оцінки",
            message: "Ми не змогли переупорядкувати оцінки, спробуйте ще раз",
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
        fill: "Будь ласка, заповніть це поле оцінки",
        repeat: "Значення оцінки не може повторюватися",
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
      edit: {
        title: "Редагувати систему оцінок",
        add_or_update: {
          title: "Додати, оновити або видалити оцінки",
          description: "Керуйте поточною системою, додаючи, оновлюючи або видаляючи бали чи категорії.",
        },
        switch: {
          title: "Змінити тип оцінки",
          description: "Конвертуйте вашу систему балів у систему категорій і навпаки.",
        },
      },
      switch: "Перемкнути систему оцінок",
      current: "Поточна система оцінок",
      select: "Виберіть систему оцінок",
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
      integrations: {
        title: "Немає налаштованих інтеграцій",
        description: "Налаштуйте GitHub та інші інтеграції для синхронізації ваших проджектних робочих елементів.",
      },
    },
    initiatives: {
      heading: "Ініціативи",
      sub_heading: "Розблокуйте найвищий рівень організації для всієї вашої роботи в Плейн.",
      title: "Увімкнути Ініціативи",
      description: "Встановіть більші цілі для моніторингу прогресу",
      toast: {
        updating: "Оновлення функції ініціатив",
        enable_success: "Функцію ініціатив успішно увімкнено.",
        disable_success: "Функцію ініціатив успішно вимкнено.",
        error: "Не вдалося оновити функцію ініціатив!",
      },
    },
    customers: {
      heading: "Кастомери",
      settings_heading: "Керуйте роботою за тим, що важливо для ваших кастомерів.",
      settings_sub_heading:
        "Перенесіть запити кастомерів до робочих елементів, призначте пріоритет за запитами та згорніть стани робочих елементів у записи кастомерів. Незабаром ви зможете інтегруватися з вашою CRM або інструментом підтримки для ще кращого управління роботою за атрибутами кастомерів.",
    },
    epics: {
      properties: {
        title: "Проперті",
        description: "Додайте кастомні проперті до вашого епіку.",
      },
      disabled: "Вимкнено",
    },
    cycles: {
      auto_schedule: {
        heading: "Автоматичне планування циклів",
        description: "Підтримуйте рух циклів без ручного налаштування.",
        tooltip: "Автоматично створюйте нові цикли на основі обраного розкладу.",
        edit_button: "Редагувати",
        form: {
          cycle_title: {
            label: "Назва циклу",
            placeholder: "Назва",
            tooltip: "До назви будуть додані номери для наступних циклів. Наприклад: Дизайн - 1/2/3",
            validation: {
              required: "Назва циклу є обов'язковою",
              max_length: "Назва не повинна перевищувати 255 символів",
            },
          },
          cycle_duration: {
            label: "Тривалість циклу",
            unit: "Тижні",
            validation: {
              required: "Тривалість циклу є обов'язковою",
              min: "Тривалість циклу повинна бути щонайменше 1 тиждень",
              max: "Тривалість циклу не може перевищувати 30 тижнів",
              positive: "Тривалість циклу має бути додатною",
            },
          },
          cooldown_period: {
            label: "Період охолодження",
            unit: "днів",
            tooltip: "Пауза між циклами перед початком наступного.",
            validation: {
              required: "Період охолодження є обов'язковим",
              negative: "Період охолодження не може бути від'ємним",
            },
          },
          start_date: {
            label: "День початку циклу",
            validation: {
              required: "Дата початку є обов'язковою",
              past: "Дата початку не може бути в минулому",
            },
          },
          number_of_cycles: {
            label: "Кількість майбутніх циклів",
            validation: {
              required: "Кількість циклів є обов'язковою",
              min: "Потрібен принаймні 1 цикл",
              max: "Неможливо запланувати більше 3 циклів",
            },
          },
          auto_rollover: {
            label: "Автоматичне перенесення робочих елементів",
            tooltip: "У день завершення циклу перемістити всі незавершені робочі елементи в наступний цикл.",
          },
        },
        toast: {
          toggle: {
            loading_enable: "Увімкнення автоматичного планування циклів",
            loading_disable: "Вимкнення автоматичного планування циклів",
            success: {
              title: "Успішно!",
              message: "Автоматичне планування циклів успішно перемкнуто.",
            },
            error: {
              title: "Помилка!",
              message: "Не вдалося перемкнути автоматичне планування циклів.",
            },
          },
          save: {
            loading: "Збереження конфігурації автоматичного планування циклів",
            success: {
              title: "Успішно!",
              message_create: "Конфігурацію автоматичного планування циклів успішно збережено.",
              message_update: "Конфігурацію автоматичного планування циклів успішно оновлено.",
            },
            error: {
              title: "Помилка!",
              message_create: "Не вдалося зберегти конфігурацію автоматичного планування циклів.",
              message_update: "Не вдалося оновити конфігурацію автоматичного планування циклів.",
            },
          },
        },
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
        intake_responsibility: "Відповідальність за прийом",
        intake_sources: "Джерела прийому",
        title: "Прийом",
        short_title: "Прийом",
        description:
          "Дозвольте не-учасникам ділитися помилками, відгуками та пропозиціями; не порушуючи ваш робочий процес.",
        toggle_title: "Увімкнути прийом",
        toggle_description: "Дозволити учасникам проекту створювати запити на прийом в додатку.",
        toggle_tooltip_on: "Попросіть адміністратора проекту увімкнути.",
        toggle_tooltip_off: "Попросіть адміністратора проекту вимкнути.",
        notify_assignee: {
          title: "Сповістити призначених",
          description: "Для нового запиту на прийом призначені за замовчуванням будуть сповіщені через сповіщення",
        },
        in_app: {
          title: "В додатку",
          description:
            "Отримуйте нові робочі елементи від учасників та гостей у вашому робочому просторі без порушення наявних.",
        },
        email: {
          title: "Ел. пошта",
          description: "Збирайте нові робочі елементи від усіх, хто надсилає листа на адресу Plane.",
          fieldName: "ID ел. пошти",
        },
        form: {
          title: "Форми",
          description:
            "Дозвольте людям поза робочим простором створювати потенційні нові робочі елементи через виділену безпечну форму.",
          fieldName: "URL форми за замовчуванням",
          create_forms: "Створюйте форми за типами робочих елементів",
          manage_forms: "Керувати формами",
          manage_forms_tooltip: "Попросіть адміністратора робочого простору керувати.",
          create_form: "Створити форму",
          edit_form: "Редагувати деталі форми",
          form_title: "Назва форми",
          form_title_required: "Назва форми обов'язкова",
          work_item_type: "Тип робочого елемента",
          remove_property: "Видалити властивість",
          select_properties: "Вибрати властивості",
          search_placeholder: "Шукати властивості",
          toasts: {
            success_create: "Форму прийому успішно створено",
            success_update: "Форму прийому успішно оновлено",
            error_create: "Не вдалося створити форму прийому",
            error_update: "Не вдалося оновити форму прийому",
          },
        },
        toasts: {
          set: {
            loading: "Встановлення призначених...",
            success: {
              title: "Успіх!",
              message: "Призначені успішно встановлені.",
            },
            error: {
              title: "Помилка!",
              message: "Щось пішло не так під час встановлення призначених. Будь ласка, спробуйте ще раз.",
            },
          },
        },
      },
      time_tracking: {
        title: "Відстеження часу",
        short_title: "Відстеження часу",
        description: "Записуйте час, витрачений на робочі елементи та проекти.",
        toggle_title: "Увімкнути відстеження часу",
        toggle_description: "Учасники проекту зможуть записувати відпрацьований час.",
      },
      milestones: {
        title: "Віхи",
        short_title: "Віхи",
        description: "Віхи забезпечують рівень для вирівнювання робочих елементів до спільних дат завершення.",
        toggle_title: "Увімкнути віхи",
        toggle_description: "Організуйте робочі елементи за термінами віх.",
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
    transfer: {
      no_cycles_available: "Немає інших циклів для переміщення робочих елементів.",
    },
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
      trailing: "Відставання",
      leading: "Випередження",
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
        title: "Об'єднуйте ключові етапи в модулі.",
        description:
          "Модулі структурують одиниці під окремими логічними компонентами. Відстежуйте крайні строки та прогрес.",
        primary_button: {
          text: "Створити перший модуль",
          comic: {
            title: "Модулі — це ієрархічні об'єднання.",
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
          highlight_changes: "Виділити зміни",
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
  workspace_dashboards: "Дешборди",
  pi_chat: "ШІ Чат",
  in_app: "В-апп",
  forms: "Форми",
  choose_workspace_for_integration: "Виберіть робочий простір для підключення цієї програми",
  integrations_description:
    "Програми, які працюють з Plane, повинні бути підключені до робочого простору, де ви є адміністратором.",
  create_a_new_workspace: "Створити новий робочий простір",
  learn_more_about_workspaces: "Дізнатися більше про робочі простори",
  no_workspaces_to_connect: "Немає робочих просторів для підключення",
  no_workspaces_to_connect_description: "Ви повинні створити робочий простір, щоб підключити інтеграції та шаблони",
  updates: {
    add_update: "Додати оновлення",
    add_update_placeholder: "Додайте ваше оновлення тут",
    empty: {
      title: "Ще немає оновлень",
      description: "Ви можете тут переглядати оновлення.",
    },
    delete: {
      title: "Видалити оновлення",
      confirmation: "Ви впевнені, що хочете видалити це оновлення? Це дія є незворотним.",
      success: {
        title: "Оновлення видалено",
        message: "Оновлення було успішно видалено.",
      },
      error: {
        title: "Оновлення не видалено",
        message: "Оновлення не видалено.",
      },
    },
    update: {
      success: {
        title: "Оновлення оновлено",
        message: "Оновлення було успішно оновлено.",
      },
      error: {
        title: "Оновлення не оновлено",
        message: "Оновлення не оновлено.",
      },
    },
    progress: {
      title: "Прогрес",
      since_last_update: "Від останнього оновлення",
      comments: "{count, plural, one{# коментар} few{# коментарі} other{# коментарів}}",
    },
    create: {
      success: {
        title: "Оновлення створено",
        message: "Оновлення було успішно створено.",
      },
      error: {
        title: "Оновлення не створено",
        message: "Оновлення не створено.",
      },
    },
    reaction: {
      create: {
        success: {
          title: "Реакція створена",
          message: "Реакція була успішно створена.",
        },
        error: {
          title: "Реакцію не створено",
          message: "Реакцію не створено.",
        },
      },
      remove: {
        success: {
          title: "Реакція видалена",
          message: "Реакція була успішно видалена.",
        },
        error: {
          title: "Реакцію не видалено",
          message: "Реакцію не видалено.",
        },
      },
    },
  },
  teamspaces: {
    label: "Тімспейси",
    empty_state: {
      general: {
        title: "Тімспейси розблоковують кращу організацію та відстеження в Плейн.",
        description:
          "Створіть спеціальну поверхню для кожної реальної команди, окремо від усіх інших робочих поверхонь в Плейн, і налаштуйте їх відповідно до того, як працює ваша команда.",
        primary_button: {
          text: "Створити новий тімспейс",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "Ви ще не пов'язали жодного тімспейсу.",
          description: "Власники тімспейсу та проєкту можуть керувати доступом до проєктів.",
        },
      },
      primary_button: {
        text: "Пов'язати тімспейс",
      },
      secondary_button: {
        text: "Дізнатися більше",
      },
      table: {
        columns: {
          teamspaceName: "Назва тімспейсу",
          members: "Учасники",
          accountType: "Тип облікового запису",
        },
        actions: {
          remove: {
            button: {
              text: "Видалити тімспейс",
            },
            confirm: {
              title: "Видалити {teamspaceName} з {projectName}",
              description:
                "Коли ви видаляєте цей тімспейс з пов'язаного проєкту, учасники тут втратять доступ до пов'язаного проєкту.",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "Не знайдено відповідних тімспейсів",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {Ви пов'язали тімспейс з цим проєктом.} other {Ви пов'язали # тімспейсів з цим проєктом.}}",
            description:
              "{additionalCount, plural, =0 {Тімспейс {firstTeamspaceName} тепер пов'язаний з цим проєктом.} other {Тімспейс {firstTeamspaceName} та ще {additionalCount} тепер пов'язані з цим проєктом.}}",
          },
          error: {
            title: "Щось пішло не так.",
            description: "Спробуйте ще раз або перезавантажте сторінку перед повторною спробою.",
          },
        },
        remove_teamspace: {
          success: {
            title: "Ви видалили цей тімспейс з цього проєкту.",
            description: "Тімспейс {teamspaceName} було видалено з {projectName}.",
          },
          error: {
            title: "Щось пішло не так.",
            description: "Спробуйте ще раз або перезавантажте сторінку перед повторною спробою.",
          },
        },
      },
      link_teamspace: {
        placeholder: "Пошук тімспейсів",
        info: {
          title: "Додавання тімспейсу надає всім учасникам тімспейсу доступ до цього проєкту.",
          link: "Дізнатися більше",
        },
        empty_state: {
          no_teamspaces: {
            title: "У вас немає тімспейсів для зв'язку.",
            description:
              "Або ви не знаходитесь у тімспейсі, який можете пов'язати, або ви вже пов'язали всі доступні тімспейси.",
          },
          no_results: {
            title: "Це не відповідає жодному з ваших тімспейсів.",
            description: "Спробуйте інший термін або переконайтеся, що у вас є тімспейси для зв'язку.",
          },
        },
        primary_button: {
          text: "Пов'язати вибрані тімспейси",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "Створіть командні робочі елементи.",
        description:
          "Робочі елементи, які призначені членам цієї команди в будь-якому пов'язаному проджекті, автоматично з'являться тут. Якщо ви очікуєте побачити тут деякі робочі елементи, переконайтеся, що ваші пов'язані проджекти мають робочі елементи, призначені членам цієї команди, або створіть робочі елементи.",
        primary_button: {
          text: "Додати робочі елементи до пов'язаного проджекту",
        },
      },
      work_items_empty_filter: {
        title: "Немає командних робочих елементів для застосованих фільтрів",
        description:
          "Змініть деякі з цих фільтрів або очистіть їх усі, щоб побачити робочі елементи, що стосуються цього спейсу.",
        secondary_button: {
          text: "Очистити всі фільтри",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "Жоден з ваших пов'язаних проджектів не має активного циклу.",
        description:
          "Активні цикли в пов'язаних проджектах автоматично з'являться тут. Якщо ви очікуєте побачити активний цикл, переконайтеся, що він зараз працює у пов'язаному проджекті.",
      },
      completed: {
        title: "Жоден з ваших пов'язаних проджектів не має завершеного циклу.",
        description:
          "Завершені цикли в пов'язаних проджектах автоматично з'являться тут. Якщо ви очікуєте побачити завершений цикл, переконайтеся, що він також завершений у пов'язаному проджекті.",
      },
      upcoming: {
        title: "Жоден з ваших пов'язаних проджектів не має майбутнього циклу.",
        description:
          "Майбутні цикли в пов'язаних проджектах автоматично з'являться тут. Якщо ви очікуєте побачити майбутній цикл, переконайтеся, що він також є в пов'язаному проджекті.",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title: "В'ю вашої команди на вашу роботу без порушення будь-яких інших в'ю у вашому воркспейсі",
        description:
          "Дивіться роботу вашої команди у в'ю, які збережені саме для вашої команди і окремо від в'ю проджекту.",
        primary_button: {
          text: "Створити в'ю",
        },
      },
      filter: {
        title: "Немає відповідних в'ю",
        description: `Жодне в'ю не відповідає критеріям пошуку.
 Натомість створіть нове в'ю.`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "Розмістіть знання вашої команди на Тім Пейджах.",
        description:
          "На відміну від пейджів у проджекті, ви можете зберігати знання, специфічні для команди, в окремому наборі пейджів тут. Отримайте всі функції Пейджів, створюйте документи з найкращими практиками та командні вікі легко.",
        primary_button: {
          text: "Створіть свій перший командний пейдж",
        },
      },
      filter: {
        title: "Немає відповідних пейджів",
        description: "Видаліть фільтри, щоб побачити всі пейджі",
      },
      search: {
        title: "Немає відповідних пейджів",
        description: "Видаліть критерії пошуку, щоб побачити всі пейджі",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "Жоден з ваших пов'язаних проджектів не має опублікованих робочих елементів.",
        description:
          "Створіть деякі робочі елементи в одному або кількох із цих проджектів, щоб побачити прогрес за датами, станами та пріоритетом.",
      },
      relation: {
        blocking: {
          title: "У вас немає робочих елементів, які блокують товариша по команді.",
          description: "Молодці! Ви розчистили шлях для своєї команди. Ви хороший командний гравець.",
        },
        blocked: {
          title: "У вас немає робочих елементів команди, які блокують вас.",
          description: "Хороші новини! Ви можете прогресувати у всіх призначених вам робочих елементах.",
        },
      },
      stats: {
        general: {
          title: "Жоден з ваших пов'язаних проджектів не має опублікованих робочих елементів.",
          description:
            "Створіть деякі робочі елементи в одному або кількох із цих проджектів, щоб побачити розподіл роботи за проджектами та членами команди.",
        },
        filter: {
          title: "Немає командної статистики для застосованих фільтрів.",
          description:
            "Створіть деякі робочі елементи в одному або кількох із цих проджектів, щоб побачити розподіл роботи за проджектами та членами команди.",
        },
      },
    },
  },
  initiatives: {
    overview: "Огляд",
    label: "Ініціативи",
    placeholder: "{count, plural, one{# ініціатива} other{# ініціативи}}",
    add_initiative: "Додати Ініціативу",
    create_initiative: "Створити Ініціативу",
    update_initiative: "Оновити Ініціативу",
    initiative_name: "Назва ініціативи",
    all_initiatives: "Всі Ініціативи",
    delete_initiative: "Видалити Ініціативу",
    fill_all_required_fields: "Будь ласка, заповніть усі обов'язкові поля.",
    toast: {
      create_success: "Ініціативу {name} успішно створено.",
      create_error: "Не вдалося створити ініціативу. Будь ласка, спробуйте ще раз!",
      update_success: "Ініціативу {name} успішно оновлено.",
      update_error: "Не вдалося оновити ініціативу. Будь ласка, спробуйте ще раз!",
      delete: {
        success: "Ініціативу успішно видалено.",
        error: "Не вдалося видалити Ініціативу",
      },
      link_copied: "Посилання на ініціативу скопійовано в буфер обміну.",
      project_update_success: "Проджекти ініціативи успішно оновлено.",
      project_update_error: "Не вдалося оновити проджекти ініціативи. Будь ласка, спробуйте ще раз!",
      epic_update_success:
        "Епік{count, plural, one { успішно додано до Ініціативи.} other {и успішно додано до Ініціативи.}}",
      epic_update_error: "Додавання Епіку до Ініціативи не вдалося. Будь ласка, спробуйте пізніше.",
      state_update_success: "Стан ініціативи успішно оновлено.",
      state_update_error: "Не вдалося оновити стан ініціативи. Будь ласка, спробуйте ще раз!",
      label_update_error: "Не вдалося оновити мітки ініціативи. Будь ласка, спробуйте ще раз!",
    },
    empty_state: {
      general: {
        title: "Організуйте роботу на найвищому рівні з Ініціативами",
        description:
          "Коли вам потрібно організувати роботу, що охоплює кілька проджектів і команд, Ініціативи стають у нагоді. Підключайте проджекти та епіки до ініціатив, бачте автоматично згорнуті оновлення та бачте ліси, перш ніж дійти до дерев.",
        primary_button: {
          text: "Створити ініціативу",
        },
      },
      search: {
        title: "Немає відповідних ініціатив",
        description: `Не виявлено ініціатив з відповідними критеріями.
 Натомість створіть нову ініціативу.`,
      },
      not_found: {
        title: "Ініціатива не існує",
        description: "Ініціатива, яку ви шукаєте, не існує, була заархівована або була видалена.",
        primary_button: {
          text: "Переглянути інші Ініціативи",
        },
      },
      epics: {
        title: "Немає епіків, які відповідають критеріям, які ви застосували.",
        subHeading: "Щоб побачити всі епіки, очистіть всі застосовані фільтри.",
        action: "Очистити фільтри",
      },
    },
    scope: {
      view_scope: "Перегляд області",
      breakdown: "Розклад області",
      add_scope: "Додати область",
      label: "Область",
      empty_state: {
        title: "Область ще не додана",
        description: "Пов'яжіть проекти та епіки з ініціативою, щоб почати роботу.",
        primary_button: {
          text: "Додати область",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "Мітки",
        description: "Структуруйте та організуйте свої ініціативи за допомогою міток.",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "Видалити мітку",
        content:
          "Ви впевнені, що хочете видалити {labelName}? Це видалить мітку зі всіх ініціатив та з будь-яких переглядів, де вона фільтрується.",
      },
      toast: {
        delete_error: "Не вдалося видалити мітку ініціативи. Спробуйте ще раз.",
        label_already_exists: "Мітка вже існує",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title:
          "Напишіть нотатку, документ або повну базу знань. Отримайте Галілео, ШІ-асистента Плейн, щоб допомогти вам почати",
        description:
          "Пейджі - це простір для роздумів у Плейн. Записуйте нотатки зустрічей, легко форматуйте їх, вбудовуйте робочі елементи, розташовуйте їх за допомогою бібліотеки компонентів і зберігайте їх усі в контексті вашого проджекту. Щоб скоротити будь-який документ, викликайте Галілео, ШІ Плейн, за допомогою ярлика або натисканням кнопки.",
        primary_button: {
          text: "Створіть свій перший пейдж",
        },
      },
      private: {
        title: "Ще немає приватних пейджів",
        description: "Зберігайте свої приватні думки тут. Коли ви будете готові поділитися, команда за один клік.",
        primary_button: {
          text: "Створіть свій перший пейдж",
        },
      },
      public: {
        title: "Ще немає сторінок робочого простору",
        description: "Дивіться пейджі, якими діляться з усіма у вашому робочому просторі, прямо тут.",
        primary_button: {
          text: "Створіть свій перший пейдж",
        },
      },
      archived: {
        title: "Ще немає заархівованих пейджів",
        description: "Архівуйте пейджі, які не на вашому радарі. Доступ до них тут, коли потрібно.",
      },
    },
  },
  epics: {
    label: "Епіки",
    no_epics_selected: "Не вибрано епіків",
    add_selected_epics: "Додати вибрані епіки",
    epic_link_copied_to_clipboard: "Посилання на епік скопійовано в буфер обміну.",
    project_link_copied_to_clipboard: "Посилання на проджект скопійовано в буфер обміну",
    empty_state: {
      general: {
        title: "Створіть епік і призначте його комусь, навіть собі",
        description:
          "Для більших обсягів роботи, що охоплюють кілька циклів і можуть існувати в різних модулях, створіть епік. Пов'яжіть робочі елементи та підробочі елементи в проджекті з епіком і перейдіть до робочого елемента з огляду.",
        primary_button: {
          text: "Створити Епік",
        },
      },
      section: {
        title: "Ще немає епіків",
        description: "Почніть додавати епіки для управління та відстеження прогресу.",
        primary_button: {
          text: "Додати епіки",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "Не знайдено відповідних епіків",
      },
      no_epics: {
        title: "Не знайдено епіків",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "Немає активних циклів",
        description:
          "Цикли ваших проджектів, які включають будь-який період, що охоплює сьогоднішню дату в межах свого діапазону. Знайдіть прогрес і деталі всіх ваших активних циклів тут.",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: `Додайте робочі елементи до циклу, щоб
 переглянути його прогрес`,
      },
      priority: {
        title: `Спостерігайте за важливими робочими
 елементами, що розглядаються в циклі.`,
      },
      assignee: {
        title: `Додайте призначених осіб до робочих елементів,
 щоб побачити розподіл роботи за призначеними особами.`,
      },
      label: {
        title: `Додайте лейбли до робочих елементів, щоб
 побачити розподіл роботи за лейблами.`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "Імпорт учасників з CSV",
      description: "Завантажте CSV зі стовпцями: Email, Display Name, First Name, Last Name, Role (5, 15 або 20)",
      dropzone: {
        active: "Перетягніть CSV файл сюди",
        inactive: "Перетягніть або натисніть для завантаження",
        file_type: "Підтримуються лише файли .csv",
      },
      buttons: {
        cancel: "Скасувати",
        import: "Імпортувати",
        try_again: "Спробувати знову",
        close: "Закрити",
        done: "Готово",
      },
      progress: {
        uploading: "Завантаження...",
        importing: "Імпорт...",
      },
      summary: {
        title: {
          failed: "Імпорт не вдався",
          complete: "Імпорт завершено",
        },
        message: {
          seat_limit: "Не вдалося імпортувати учасників через обмеження кількості місць.",
          success: "Успішно додано {count} учасник{plural} до робочого простору.",
          no_imports: "Учасники не були імпортовані з CSV файлу.",
        },
        stats: {
          successful: "Успішно",
          failed: "Не вдалося",
        },
        download_errors: "Завантажити помилки",
      },
      toast: {
        invalid_file: {
          title: "Недійсний файл",
          message: "Підтримуються лише CSV файли.",
        },
        import_failed: {
          title: "Імпорт не вдався",
          message: "Щось пішло не так.",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "Неможливо архівувати робочі елементи",
        message: "Архівувати можна лише робочі елементи, що належать до груп станів Завершено або Скасовано.",
      },
      invalid_issue_start_date: {
        title: "Неможливо оновити робочі елементи",
        message:
          "Вибрана дата початку перевищує дату завершення для деяких робочих елементів. Переконайтеся, що дата початку передує даті завершення.",
      },
      invalid_issue_target_date: {
        title: "Неможливо оновити робочі елементи",
        message:
          "Вибрана дата завершення передує даті початку для деяких робочих елементів. Переконайтеся, що дата завершення настає після дати початку.",
      },
      invalid_state_transition: {
        title: "Неможливо оновити робочі елементи",
        message: "Зміна стану не дозволена для деяких робочих елементів. Переконайтеся, що зміна стану дозволена.",
      },
    },
  },
  work_item_types: {
    label: "Типи Робочих Елементів",
    label_lowercase: "типи робочих елементів",
    settings: {
      title: "Типи Робочих Елементів",
      properties: {
        title: "Кастомні проперті",
        tooltip:
          "Кожен тип робочого елемента постачається з набором проперті за замовчуванням, як-от Заголовок, Опис, Призначений, Стан, Пріоритет, Дата початку, Дата завершення, Модуль, Цикл тощо. Ви також можете налаштувати та додати власні проперті, щоб адаптувати їх до потреб вашої команди.",
        add_button: "Додати нове проперті",
        dropdown: {
          label: "Тип проперті",
          placeholder: "Виберіть тип",
        },
        property_type: {
          text: {
            label: "Текст",
          },
          number: {
            label: "Число",
          },
          dropdown: {
            label: "Дропдаун",
          },
          boolean: {
            label: "Булеан",
          },
          date: {
            label: "Дата",
          },
          member_picker: {
            label: "Вибір мембера",
          },
          release_picker: {
            label: "Вибір релізів",
          },
          formula: {
            label: "Формула",
          },
        },
        attributes: {
          label: "Атрибути",
          text: {
            single_line: {
              label: "Однолінійний",
            },
            multi_line: {
              label: "Параграф",
            },
            readonly: {
              label: "Лише для читання",
              header: "Дані лише для читання",
            },
            invalid_text_format: {
              label: "Недійсний формат тексту",
            },
          },
          number: {
            default: {
              placeholder: "Додати число",
            },
          },
          relation: {
            single_select: {
              label: "Одиночний вибір",
            },
            multi_select: {
              label: "Множинний вибір",
            },
            no_default_value: {
              label: "Без значення за замовчуванням",
            },
          },
          boolean: {
            label: "Так | Ні",
            no_default: "Без значення за замовчуванням",
          },
          option: {
            create_update: {
              label: "Опції",
              form: {
                placeholder: "Додати опцію",
                errors: {
                  name: {
                    required: "Назва опції обов'язкова.",
                    integrity: "Опція з такою назвою вже існує.",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "Вибрати опцію",
                multi: {
                  default: "Вибрати опції",
                  variable: "Вибрано {count} опцій",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "Успіх!",
              message: "Проперті {name} успішно створено.",
            },
            error: {
              title: "Помилка!",
              message: "Не вдалося створити проперті. Будь ласка, спробуйте ще раз!",
            },
          },
          update: {
            success: {
              title: "Успіх!",
              message: "Проперті {name} успішно оновлено.",
            },
            error: {
              title: "Помилка!",
              message: "Не вдалося оновити проперті. Будь ласка, спробуйте ще раз!",
            },
          },
          delete: {
            success: {
              title: "Успіх!",
              message: "Проперті {name} успішно видалено.",
            },
            error: {
              title: "Помилка!",
              message: "Не вдалося видалити проперті. Будь ласка, спробуйте ще раз!",
            },
          },
          enable_disable: {
            loading: "{action} проперті {name}",
            success: {
              title: "Успіх!",
              message: "Проперті {name} успішно {action}.",
            },
            error: {
              title: "Помилка!",
              message: "Не вдалося {action} проперті. Будь ласка, спробуйте ще раз!",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "Заголовок",
            },
            description: {
              placeholder: "Опис",
            },
          },
          errors: {
            name: {
              required: "Ви повинні назвати своє проперті.",
              max_length: "Назва проперті не повинна перевищувати 255 символів.",
            },
            property_type: {
              required: "Ви повинні вибрати тип проперті.",
            },
            options: {
              required: "Ви повинні додати хоча б одну опцію.",
            },
            formula: {
              required: "Вираз формули є обов'язковим.",
              invalid: "Недійсна формула: {error}",
              circular_reference:
                "Виявлено циклічне посилання. Формула не може посилатися на саму себе прямо або опосередковано.",
              invalid_reference: "Формула посилається на неіснуючу властивість.",
            },
          },
        },
        formula: {
          field_label: "Поле формули",
          tooltip: "Введіть формулу, використовуючи синтаксис '{'Назва поля'}'. Підтримує оператори +, -, *, / та &.",
          placeholder: "Напишіть формулу",
          test_button: "Тест",
          validating: "Перевірка",
          validation_success: "Формула дійсна! Повертає {resultType}",
          validation_success_with_refs: "Формула дійсна! Повертає {resultType} ({count} поле(ів) зазначено)",
          error: {
            empty: "Будь ласка, введіть формулу",
            missing_context: "Відсутній контекст робочого простору, проєкту або типу робочого елемента",
            validation_failed: "Перевірка не вдалася",
          },
          picker: {
            no_match: "Немає відповідних властивостей",
            no_available: "Немає доступних властивостей",
          },
        },
        enable_disable: {
          label: "Активно",
          tooltip: {
            disabled: "Натисніть, щоб вимкнути",
            enabled: "Натисніть, щоб увімкнути",
          },
        },
        delete_confirmation: {
          title: "Видалити це проперті",
          description: "Видалення проперті може призвести до втрати існуючих даних.",
          secondary_description: "Ви хочете натомість вимкнути проперті?",
          primary_button: "{action}, видалити це",
          secondary_button: "Так, вимкнути це",
        },
        mandate_confirmation: {
          label: "Обов'язкове проперті",
          content:
            "Здається, для цього проперті є опція за замовчуванням. Встановлення проперті як обов'язкового видалить значення за замовчуванням, і користувачі повинні будуть додати значення на свій вибір.",
          tooltip: {
            disabled: "Цей тип проперті не може бути зроблений обов'язковим",
            enabled: "Зніміть прапорець, щоб позначити поле як необов'язкове",
            checked: "Встановіть прапорець, щоб позначити поле як обов'язкове",
          },
        },
        empty_state: {
          title: "Додати кастомні проперті",
          description: "Нові проперті, які ви додасте для цього типу робочого елемента, будуть показані тут.",
        },
      },
      item_delete_confirmation: {
        title: "Видалити цей тип",
        description: "Видалення типів може призвести до втрати наявних даних.",
        primary_button: "Так, видалити",
        toast: {
          success: {
            title: "Успіх!",
            message: "Тип робочого елемента успішно видалено.",
          },
          error: {
            title: "Помилка!",
            message: "Не вдалося видалити тип робочого елемента. Будь ласка, спробуйте ще раз!",
          },
        },
        can_disable_warning: "Ви хочете замість цього вимкнути тип?",
      },
      cant_delete_default_message:
        "Неможливо видалити цей тип робочого елемента, оскільки він встановлений як тип за замовчуванням для цього проджекту.",
    },
    create: {
      title: "Створити тип робочого елемента",
      button: "Додати тип робочого елемента",
      toast: {
        success: {
          title: "Успіх!",
          message: "Тип робочого елемента успішно створено.",
        },
        error: {
          title: "Помилка!",
          message: {
            conflict: "Тип {name} вже існує. Виберіть іншу назву.",
          },
        },
      },
    },
    update: {
      title: "Оновити тип робочого елемента",
      button: "Оновити тип робочого елемента",
      toast: {
        success: {
          title: "Успіх!",
          message: "Тип робочого елемента {name} успішно оновлено.",
        },
        error: {
          title: "Помилка!",
          message: {
            conflict: "Тип {name} вже існує. Виберіть іншу назву.",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "Дайте цьому типу робочого елемента унікальну назву",
        },
        description: {
          placeholder: "Опишіть, для чого призначений цей тип робочого елемента і коли його слід використовувати.",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{action} тип робочого елемента {name}",
        success: {
          title: "Успіх!",
          message: "Тип робочого елемента {name} успішно {action}.",
        },
        error: {
          title: "Помилка!",
          message: "Не вдалося {action} тип робочого елемента. Будь ласка, спробуйте ще раз!",
        },
      },
      tooltip: "Натисніть, щоб {action}",
    },
    change_confirmation: {
      title: "Змінити тип робочого елемента?",
      description:
        "Зміна типу робочого елемента може призвести до втрати значень користувацьких властивостей, специфічних для поточного типу. Цю дію неможливо скасувати.",
      button: {
        loading: "Зміна",
        default: "Змінити тип",
      },
    },
    empty_state: {
      enable: {
        title: "Увімкнути Типи Робочих Елементів",
        description:
          "Формуйте робочі елементи для вашої роботи за допомогою Типів робочих елементів. Налаштовуйте їх за допомогою іконок, фонів та проперті та конфігуруйте їх для цього проджекту.",
        primary_button: {
          text: "Увімкнути",
        },
        confirmation: {
          title: "Після увімкнення Типи Робочих Елементів не можна вимкнути.",
          description:
            "Робочий Елемент Плейн стане типом робочого елемента за замовчуванням для цього проджекту та відображатиметься з його іконкою та фоном у цьому проджекті.",
          button: {
            default: "Увімкнути",
            loading: "Налаштування",
          },
        },
      },
      get_pro: {
        title: "Отримайте Про, щоб увімкнути Типи робочих елементів.",
        description:
          "Формуйте робочі елементи для вашої роботи за допомогою Типів робочих елементів. Налаштовуйте їх за допомогою іконок, фонів та проперті та конфігуруйте їх для цього проджекту.",
        primary_button: {
          text: "Отримати Про",
        },
      },
      upgrade: {
        title: "Оновіть, щоб увімкнути Типи робочих елементів.",
        description:
          "Формуйте робочі елементи для вашої роботи за допомогою Типів робочих елементів. Налаштовуйте їх за допомогою іконок, фонів та проперті та конфігуруйте їх для цього проджекту.",
        primary_button: {
          text: "Оновити",
        },
      },
    },
  },
  importers: {
    imports: "Імпорти",
    logo: "Лого",
    import_message: "Імпортуйте ваші дані {serviceName} у проджекти Плейн.",
    deactivate: "Деактивувати",
    deactivating: "Деактивація",
    migrating: "Міграція",
    migrations: "Міграції",
    refreshing: "Оновлення",
    import: "Імпорт",
    serial_number: "Ср №",
    project: "Проджект",
    workspace: "Воркспейс",
    status: "Статус",
    summary: "Підсумок",
    total_batches: "Всього Батчів",
    imported_batches: "Імпортованих Батчів",
    re_run: "Перезапуск",
    cancel: "Скасувати",
    start_time: "Час Початку",
    no_jobs_found: "Джоби не знайдені",
    no_project_imports: "Ви ще не імпортували жодного проджекту {serviceName}.",
    cancel_import_job: "Скасувати джоб імпорту",
    cancel_import_job_confirmation:
      "Ви впевнені, що хочете скасувати цей джоб імпорту? Це зупинить процес імпорту для цього проджекту.",
    re_run_import_job: "Перезапустити джоб імпорту",
    re_run_import_job_confirmation:
      "Ви впевнені, що хочете перезапустити цей джоб імпорту? Це перезапустить процес імпорту для цього проджекту.",
    upload_csv_file: "Завантажте CSV файл для імпорту даних користувачів.",
    connect_importer: "Підключити {serviceName}",
    migration_assistant: "Міграційний Асистент",
    migration_assistant_description:
      "Безпроблемно мігруйте ваші проджекти {serviceName} до Плейн за допомогою нашого потужного асистента.",
    token_helper: "Ви отримаєте це з вашого",
    personal_access_token: "Персональний Токен Доступу",
    source_token_expired: "Токен Прострочено",
    source_token_expired_description:
      "Наданий токен прострочено. Будь ласка, деактивуйте та підключіться знову з новим набором креденшиалів.",
    user_email: "Емейл Користувача",
    select_state: "Виберіть Стейт",
    select_service_project: "Виберіть Проджект {serviceName}",
    loading_service_projects: "Завантаження проджектів {serviceName}",
    select_service_workspace: "Виберіть Воркспейс {serviceName}",
    loading_service_workspaces: "Завантаження Воркспейсів {serviceName}",
    select_priority: "Виберіть Пріоритет",
    select_service_team: "Виберіть Команду {serviceName}",
    add_seat_msg_free_trial:
      "Ви намагаєтеся імпортувати {additionalUserCount} незареєстрованих користувачів, і у вас є лише {currentWorkspaceSubscriptionAvailableSeats} доступних місць у поточному плані. Щоб продовжити імпорт, оновіть зараз.",
    add_seat_msg_paid:
      "Ви намагаєтеся імпортувати {additionalUserCount} незареєстрованих користувачів, і у вас є лише {currentWorkspaceSubscriptionAvailableSeats} доступних місць у поточному плані. Щоб продовжити імпорт, придбайте щонайменше {extraSeatRequired} додаткових місць.",
    skip_user_import_title: "Пропустити імпорт даних Користувача",
    skip_user_import_description:
      "Пропуск імпорту користувачів призведе до того, що робочі елементи, коментарі та інші дані з {serviceName} будуть створені користувачем, який виконує міграцію в Плейн. Ви все ще можете вручну додати користувачів пізніше.",
    invalid_pat: "Недійсний Персональний Токен Доступу",
  },
  integrations: {
    integrations: "Інтеграції",
    loading: "Завантаження",
    unauthorized: "Ви не маєте дозволу переглядати цю сторінку.",
    configure: "Налаштувати",
    not_enabled: "{name} не увімкнено для цього воркспейсу.",
    not_configured: "Не налаштовано",
    disconnect_personal_account: "Відключити персональний аккаунт {providerName}",
    not_configured_message_admin:
      "Інтеграція {name} не налаштована. Будь ласка, зверніться до адміністратора вашого інстансу для налаштування.",
    not_configured_message_support:
      "Інтеграція {name} не налаштована. Будь ласка, зверніться до підтримки для налаштування.",
    external_api_unreachable: "Неможливо отримати доступ до зовнішнього API. Будь ласка, спробуйте пізніше.",
    error_fetching_supported_integrations: "Неможливо отримати підтримувані інтеграції. Будь ласка, спробуйте пізніше.",
    back_to_integrations: "Назад до інтеграцій",
    select_state: "Виберіть Стейт",
    set_state: "Встановити Стейт",
    choose_project: "Виберіть Проджект...",
  },
  github_integration: {
    name: "GitHub",
    description: "Підключіть та синхронізуйте ваші робочі елементи GitHub з Плейн.",
    connect_org: "Підключити Організацію",
    connect_org_description: "Підключіть вашу організацію GitHub до Плейн.",
    processing: "Обробка",
    org_added_desc: "GitHub org додана і час",
    connection_fetch_error: "Помилка отримання деталей підключення з сервера",
    personal_account_connected: "Персональний аккаунт підключено",
    personal_account_connected_description: "Ваш персональний аккаунт GitHub тепер підключено до Плейн.",
    connect_personal_account: "Підключити персональний аккаунт",
    connect_personal_account_description: "Підключіть ваш персональний аккаунт GitHub до Плейн.",
    repo_mapping: "Маппінг Репозиторіїв",
    repo_mapping_description: "Маппінг ваших репозиторіїв GitHub з проджектами Плейн.",
    project_issue_sync: "Синхронізація Проблем Проджекту",
    project_issue_sync_description: "Синхронізуйте проблеми з GitHub до вашого проджекту Плейн",
    project_issue_sync_empty_state: "Змаповані синхронізації проблем проджекту з'являться тут",
    configure_project_issue_sync_state: "Налаштуйте стан синхронізації проблем",
    select_issue_sync_direction: "Виберіть напрямок синхронізації проблем",
    allow_bidirectional_sync: "Bidirectional - Синхронізуйте проблеми і коментарі в обох напрямках між GitHub і Плейн",
    allow_unidirectional_sync: "Unidirectional - Синхронізуйте проблеми і коментарі з GitHub до Плейн тільки",
    allow_unidirectional_sync_warning:
      "Дані з GitHub Issue замінять дані у пов'язаному робочому елементі Plane (тільки GitHub → Plane)",
    remove_project_issue_sync: "Видалити цю Синхронізацію Проблем Проджекту",
    remove_project_issue_sync_confirmation: "Ви впевнені, що хочете видалити цю синхронізацію проблем проджекту?",
    add_pr_state_mapping: "Додати Маппінг Стану Пул Ріквесту для Проджекту Плейн",
    edit_pr_state_mapping: "Редагувати Маппінг Стану Пул Ріквесту для Проджекту Плейн",
    pr_state_mapping: "Маппінг Стану Пул Ріквесту",
    pr_state_mapping_description: "Маппінг стану пул ріквесту з GitHub до вашого проджекту Плейн",
    pr_state_mapping_empty_state: "Змаповані стани PR з'являться тут",
    remove_pr_state_mapping: "Видалити цей Маппінг Стану Пул Ріквесту",
    remove_pr_state_mapping_confirmation: "Ви впевнені, що хочете видалити цей маппінг стану пул ріквесту?",
    issue_sync_message: "Робочі елементи синхронізовані до {project}",
    link: "Прив'язати репозиторій GitHub до проджекту Плейн",
    pull_request_automation: "Автоматизація Пул Ріквестів",
    pull_request_automation_description: "Налаштуйте маппінг стану пул ріквесту з GitHub до вашого проджекту Плейн",
    DRAFT_MR_OPENED: "При відкритті чернетки МР, встановити стан на",
    MR_OPENED: "Акрито",
    MR_READY_FOR_MERGE: "Коли МР готовий до мерджу, встановити стан на",
    MR_REVIEW_REQUESTED: "Коли запитано рев'ю МР, встановити стан на",
    MR_MERGED: "Коли МР змерджено, встановити стан на",
    MR_CLOSED: "Закрито",
    ISSUE_OPEN: "Issue Акрито",
    ISSUE_CLOSED: "Issue Закрито",
    save: "Зберегти",
    start_sync: "Почати Синхронізацію",
    choose_repository: "Виберіть Репозиторій...",
  },
  gitlab_integration: {
    name: "Gitlab",
    description: "Підключіть та синхронізуйте ваші Мердж Ріквести Gitlab з Плейн.",
    connection_fetch_error: "Помилка отримання деталей підключення з сервера",
    connect_org: "Підключити Організацію",
    connect_org_description: "Підключіть вашу організацію Gitlab до Плейн.",
    project_connections: "Підключення Проджектів Gitlab",
    project_connections_description: "Синхронізуйте мердж ріквести з Gitlab до проджектів Плейн.",
    plane_project_connection: "Підключення Проджекту Плейн",
    plane_project_connection_description: "Налаштуйте маппінг стану пул ріквестів з Gitlab до проджектів Плейн",
    remove_connection: "Видалити Підключення",
    remove_connection_confirmation: "Ви впевнені, що хочете видалити це підключення?",
    link: "Прив'язати репозиторій Gitlab до проджекту Плейн",
    pull_request_automation: "Автоматизація Пул Ріквестів",
    pull_request_automation_description: "Налаштуйте маппінг стану пул ріквесту з Gitlab до Плейн",
    DRAFT_MR_OPENED: "При відкритті чернетки МР, встановити стан на",
    MR_OPENED: "При відкритті МР, встановити стан на",
    MR_REVIEW_REQUESTED: "Коли запитано рев'ю МР, встановити стан на",
    MR_READY_FOR_MERGE: "Коли МР готовий до мерджу, встановити стан на",
    MR_MERGED: "Коли МР змерджено, встановити стан на",
    MR_CLOSED: "Коли МР закрито, встановити стан на",
    integration_enabled_text: "З увімкненою інтеграцією Gitlab ви можете автоматизувати воркфлоу робочих елементів",
    choose_entity: "Виберіть Сутність",
    choose_project: "Виберіть Проджект",
    link_plane_project: "Прив'язати проджект Плейн",
    project_issue_sync: "Синхронізація задач проджекту",
    project_issue_sync_description: "Синхронізуйте задачі з Gitlab до вашого проджекту Plane",
    project_issue_sync_empty_state: "Мапінг синхронізації задач проджекту з'явиться тут",
    configure_project_issue_sync_state: "Налаштувати стан синхронізації задач",
    select_issue_sync_direction: "Виберіть напрямок синхронізації задач",
    allow_bidirectional_sync: "Двосторонній - Синхронізувати задачі та коментарі в обох напрямках між Gitlab і Plane",
    allow_unidirectional_sync: "Односторонній - Синхронізувати задачі та коментарі лише з Gitlab до Plane",
    allow_unidirectional_sync_warning:
      "Дані з Gitlab Issue замінять дані в пов'язаному робочому елементі Plane (лише Gitlab → Plane)",
    remove_project_issue_sync: "Видалити цю синхронізацію задач проджекту",
    remove_project_issue_sync_confirmation: "Ви впевнені, що хочете видалити цю синхронізацію задач проджекту?",
    ISSUE_OPEN: "Задача відкрита",
    ISSUE_CLOSED: "Задача закрита",
    save: "Зберегти",
    start_sync: "Почати синхронізацію",
    choose_repository: "Виберіть репозиторій...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Підключіть та синхронізуйте ваш екземпляр Gitlab Enterprise з Plane.",
    app_form_title: "Конфігурація Gitlab Enterprise",
    app_form_description: "Налаштуйте Gitlab Enterprise для підключення до Plane.",
    base_url_title: "Базова URL",
    base_url_description: "Базова URL вашого екземпляра Gitlab Enterprise.",
    base_url_placeholder: 'напр. "https://glab.plane.town"',
    base_url_error: "Базова URL є обов'язковою",
    invalid_base_url_error: "Недійсна базова URL",
    client_id_title: "ID застосунку",
    client_id_description: "ID застосунку, який ви створили у вашому екземплярі Gitlab Enterprise.",
    client_id_placeholder: 'напр. "7cd732xxxxxxxxxxxxxx"',
    client_id_error: "ID застосунку є обов'язковим",
    client_secret_title: "Client Secret",
    client_secret_description: "Client secret застосунку, який ви створили у вашому екземплярі Gitlab Enterprise.",
    client_secret_placeholder: 'напр. "gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "Client secret є обов'язковим",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description:
      "Випадковий webhook secret, який буде використовуватися для перевірки webhook з екземпляра Gitlab Enterprise.",
    webhook_secret_placeholder: 'напр. "webhook1234567890"',
    webhook_secret_error: "Webhook secret є обов'язковим",
    connect_app: "Підключити застосунок",
  },
  slack_integration: {
    name: "Slack",
    description: "Підключіть ваш воркспейс Slack до Плейн.",
    connect_personal_account: "Підключіть ваш персональний аккаунт Slack до Плейн.",
    personal_account_connected: "Ваш персональний аккаунт {providerName} тепер підключено до Плейн.",
    link_personal_account: "Прив'яжіть ваш персональний аккаунт {providerName} до Плейн.",
    connected_slack_workspaces: "Підключені воркспейси Slack",
    connected_on: "Підключено {date}",
    disconnect_workspace: "Відключити воркспейс {name}",
    alerts: {
      dm_alerts: {
        title:
          "Отримуйте сповіщення в особистих повідомленнях Slack про важливі оновлення, нагадування та сповіщення тільки для вас.",
      },
    },
    project_updates: {
      title: "Оновлення Проєкту",
      description: "Налаштуйте сповіщення про оновлення проєктів для ваших проєктів",
      add_new_project_update: "Додати нове сповіщення про оновлення проєкту",
      project_updates_empty_state: "Проєкти, підключені до каналів Slack, з'являться тут.",
      project_updates_form: {
        title: "Налаштувати Оновлення Проєкту",
        description: "Отримуйте сповіщення про оновлення проєкту в Slack, коли створюються робочі елементи",
        failed_to_load_channels: "Не вдалося завантажити канали зі Slack",
        project_dropdown: {
          placeholder: "Виберіть проєкт",
          label: "Проєкт Plane",
          no_projects: "Немає доступних проєктів",
        },
        channel_dropdown: {
          label: "Канал Slack",
          placeholder: "Виберіть канал",
          no_channels: "Немає доступних каналів",
        },
        all_projects_connected: "Усі проєкти вже підключені до каналів Slack.",
        all_channels_connected: "Усі канали Slack вже підключені до проєктів.",
        project_connection_success: "З'єднання проєкту успішно створено",
        project_connection_updated: "З'єднання проєкту успішно оновлено",
        project_connection_deleted: "З'єднання проєкту успішно видалено",
        failed_delete_project_connection: "Не вдалося видалити з'єднання проєкту",
        failed_create_project_connection: "Не вдалося створити з'єднання проєкту",
        failed_upserting_project_connection: "Не вдалося оновити з'єднання проєкту",
        failed_loading_project_connections:
          "Ми не змогли завантажити ваші з'єднання проєкту. Це може бути пов'язано з проблемою мережі або проблемою з інтеграцією.",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "Підключіть ваш робочий простір Sentry до Plane.",
    connected_sentry_workspaces: "Підключені робочі простори Sentry",
    connected_on: "Підключено {date}",
    disconnect_workspace: "Відключити робочий простір {name}",
    state_mapping: {
      title: "Відображення станів",
      description:
        "Відображіть стани інцидентів Sentry до станів вашого проекту. Налаштуйте, які стани використовувати, коли інцидент Sentry вирішено або не вирішено.",
      add_new_state_mapping: "Додати нове відображення стану",
      empty_state:
        "Відображення станів не налаштовано. Створіть перше відображення для синхронізації станів інцидентів Sentry зі станами вашого проекту.",
      failed_loading_state_mappings:
        "Не вдалося завантажити ваші відображення станів. Це може бути пов'язано з проблемою мережі або проблемою з інтеграцією.",
      loading_project_states: "Завантаження станів проекту...",
      error_loading_states: "Помилка завантаження станів",
      no_states_available: "Стани недоступні",
      no_permission_states: "У вас немає дозволу на доступ до станів для цього проекту",
      states_not_found: "Стани проекту не знайдено",
      server_error_states: "Помилка сервера при завантаженні станів",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "Підключіть та синхронізуйте вашу організацію GitHub Enterprise з Плейн.",
    app_form_title: "Налаштування GitHub Enterprise",
    app_form_description: "Налаштуйте GitHub Enterprise для підключення до Плейн.",
    app_id_title: "ID Застосунку",
    app_id_description: "ID вашого застосунку в організації GitHub Enterprise.",
    app_id_placeholder: 'e.g., "1234567890"',
    app_id_error: "App ID є обов'язковим",
    app_name_title: "Слаг Застосунку",
    app_name_description: "Слаг вашого застосунку в організації GitHub Enterprise.",
    app_name_error: "Слаг застосунку є обов'язковим",
    app_name_placeholder: 'e.g., "plane-github-enterprise"',
    base_url_title: "Базова URL",
    base_url_description: "Базова URL вашої організації GitHub Enterprise.",
    base_url_placeholder: 'e.g., "https://gh.plane.town"',
    base_url_error: "Базова URL є обов'язковою",
    invalid_base_url_error: "Недійсна базова URL",
    client_id_title: "ID Клієнта",
    client_id_description: "ID клієнта вашого застосунку в організації GitHub Enterprise.",
    client_id_placeholder: 'e.g., "1234567890"',
    client_id_error: "ID клієнта є обов'язковим",
    client_secret_title: "Секретний Клієнт",
    client_secret_description: "Секретний ключ вашого застосунку в організації GitHub Enterprise.",
    client_secret_placeholder: 'e.g., "1234567890"',
    client_secret_error: "Секретний ключ є обов'язковим",
    webhook_secret_title: "Секретний Webhook",
    webhook_secret_description: "Секретний ключ вашого застосунку в організації GitHub Enterprise.",
    webhook_secret_placeholder: 'e.g., "1234567890"',
    webhook_secret_error: "Секретний ключ webhook є обов'язковим",
    private_key_title: "Приватний Ключ (Base64)",
    private_key_description: "Base64 закодований приватний ключ вашого застосунку в організації GitHub Enterprise.",
    private_key_placeholder: 'e.g., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Приватний ключ є обов'язковим",
    connect_app: "Підключити Застосунок",
  },
  file_upload: {
    upload_text: "Натисніть тут, щоб завантажити файл",
    drag_drop_text: "Перетягніть",
    processing: "Обробка",
    invalid: "Недійсний тип файлу",
    missing_fields: "Відсутні поля",
    success: "{fileName} Завантажено!",
  },
  silo_errors: {
    invalid_query_params: "Надані параметри запиту недійсні або відсутні обов'язкові поля",
    invalid_installation_account: "Наданий аккаунт інсталяції недійсний",
    generic_error: "Під час обробки вашого запиту сталася неочікувана помилка",
    connection_not_found: "Запитане підключення не знайдено",
    multiple_connections_found: "Знайдено кілька підключень, коли очікувалося лише одне",
    installation_not_found: "Запитана інсталяція не знайдена",
    user_not_found: "Запитаний користувач не знайдений",
    error_fetching_token: "Не вдалося отримати токен аутентифікації",
    invalid_app_credentials: "Наданий токен аутентифікації недійсний",
    invalid_app_installation_id: "Не вдалося встановити застосунок",
  },
  import_status: {
    queued: "В черзі",
    created: "Створено",
    initiated: "Ініційовано",
    pulling: "Отримання",
    timed_out: "Час вийшов",
    pulled: "Отримано",
    transforming: "Трансформація",
    transformed: "Трансформовано",
    pushing: "Надсилання",
    finished: "Завершено",
    error: "Помилка",
    cancelled: "Скасовано",
  },
  jira_importer: {
    jira_importer_description: "Імпортуйте ваші дані Jira у проджекти Плейн.",
    personal_access_token: "Персональний Токен Доступу",
    user_email: "Емейл Користувача",
    create_project_automatically: "Створити проєкт автоматично",
    create_project_automatically_description: "Ми створимо для вас новий проєкт на основі даних проєкту Jira.",
    import_to_existing_project: "Імпортувати в існуючий проєкт",
    import_to_existing_project_description: "Виберіть існуючий проєкт зі спадного списку нижче.",
    state_mapping_automatic_creation: "Усі статуси Jira будуть автоматично створені в Plane.",
    atlassian_security_settings: "Налаштування Безпеки Atlassian",
    email_description: "Це емейл, пов'язаний з вашим персональним токеном доступу",
    jira_domain: "Домен Jira",
    jira_domain_description: "Це домен вашого інстансу Jira",
    steps: {
      title_configure_plane: "Налаштувати Плейн",
      description_configure_plane:
        "Будь ласка, спочатку створіть проджект у Плейн, куди ви плануєте мігрувати ваші дані Jira. Після створення проджекту виберіть його тут.",
      title_configure_jira: "Налаштувати Jira",
      description_configure_jira: "Будь ласка, виберіть воркспейс Jira, з якого ви хочете мігрувати ваші дані.",
      title_import_users: "Імпортувати Користувачів",
      description_import_users:
        "Будь ласка, додайте користувачів, яких ви бажаєте мігрувати з Jira до Плейн. Альтернативно, ви можете пропустити цей крок і додати користувачів вручну пізніше.",
      title_map_states: "Мапування Стейтів",
      description_map_states:
        "Ми автоматично зіставили статуси Jira зі стейтами Плейн, наскільки це було можливо. Будь ласка, зіставте всі стейти, що залишилися, перед тим як продовжити, ви також можете створити стейти та мапити їх вручну.",
      title_map_priorities: "Мапування Пріоритетів",
      description_map_priorities:
        "Ми автоматично зіставили пріоритети, наскільки це було можливо. Будь ласка, зіставте всі пріоритети, що залишилися, перед тим як продовжити.",
      title_summary: "Підсумок",
      description_summary: "Ось підсумок даних, які будуть мігровані з Jira до Плейн.",
      custom_jql_filter: "Користувацький фільтр JQL",
      jql_filter_description: "Використовуйте JQL для фільтрації конкретних задач для імпорту.",
      project_code: "ПРОЕКТ",
      enter_filters_placeholder: "Введіть фільтри (напр. status = 'In Progress')",
      validating_query: "Перевірка запиту...",
      validation_successful_work_items_selected: "Перевірка успішна, вибрано {count} робочих елементів.",
      run_syntax_check: "Запустити перевірку синтаксису для перевірки вашого запиту",
      refresh: "Оновити",
      check_syntax: "Перевірити синтаксис",
      no_work_items_selected: "Запит не вибрав жодного робочого елемента.",
      validation_error_default: "Щось пішло не так під час перевірки запиту.",
    },
  },
  asana_importer: {
    asana_importer_description: "Імпортуйте ваші дані Asana у проджекти Плейн.",
    select_asana_priority_field: "Виберіть Поле Пріоритету Asana",
    steps: {
      title_configure_plane: "Налаштувати Плейн",
      description_configure_plane:
        "Будь ласка, спочатку створіть проджект у Плейн, куди ви плануєте мігрувати ваші дані Asana. Після створення проджекту виберіть його тут.",
      title_configure_asana: "Налаштувати Asana",
      description_configure_asana:
        "Будь ласка, виберіть воркспейс і проджект Asana, з якого ви хочете мігрувати ваші дані.",
      title_map_states: "Мапування Стейтів",
      description_map_states: "Будь ласка, виберіть стейти Asana, які ви хочете мапити до статусів проджекту Плейн.",
      title_map_priorities: "Мапування Пріоритетів",
      description_map_priorities:
        "Будь ласка, виберіть пріоритети Asana, які ви хочете мапити до пріоритетів проджекту Плейн.",
      title_summary: "Підсумок",
      description_summary: "Ось підсумок даних, які будуть мігровані з Asana до Плейн.",
    },
  },
  linear_importer: {
    linear_importer_description: "Імпортуйте ваші дані Linear у проджекти Плейн.",
    steps: {
      title_configure_plane: "Налаштувати Плейн",
      description_configure_plane:
        "Будь ласка, спочатку створіть проджект у Плейн, куди ви плануєте мігрувати ваші дані Linear. Після створення проджекту виберіть його тут.",
      title_configure_linear: "Налаштувати Linear",
      description_configure_linear: "Будь ласка, виберіть команду Linear, з якої ви хочете мігрувати ваші дані.",
      title_map_states: "Мапування Стейтів",
      description_map_states:
        "Ми автоматично зіставили статуси Linear зі стейтами Плейн, наскільки це було можливо. Будь ласка, зіставте всі стейти, що залишилися, перед тим як продовжити, ви також можете створити стейти та мапити їх вручну.",
      title_map_priorities: "Мапування Пріоритетів",
      description_map_priorities:
        "Будь ласка, виберіть пріоритети Linear, які ви хочете мапити до пріоритетів проджекту Плейн.",
      title_summary: "Підсумок",
      description_summary: "Ось підсумок даних, які будуть мігровані з Linear до Плейн.",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "Імпортуйте ваші дані Jira Server/Data Center у проджекти Плейн.",
    steps: {
      title_configure_plane: "Налаштувати Плейн",
      description_configure_plane:
        "Будь ласка, спочатку створіть проджект у Плейн, куди ви плануєте мігрувати ваші дані Jira. Після створення проджекту виберіть його тут.",
      title_configure_jira: "Налаштувати Jira",
      description_configure_jira: "Будь ласка, виберіть воркспейс Jira, з якого ви хочете мігрувати ваші дані.",
      title_map_states: "Мапування Стейтів",
      description_map_states: "Будь ласка, виберіть стейти Jira, які ви хочете мапити до статусів проджекту Плейн.",
      title_map_priorities: "Мапування Пріоритетів",
      description_map_priorities:
        "Будь ласка, виберіть пріоритети Jira, які ви хочете мапити до пріоритетів проджекту Плейн.",
      title_summary: "Підсумок",
      description_summary: "Ось підсумок даних, які будуть мігровані з Jira до Плейн.",
    },
    import_epics: {
      title: "Імпортувати епіки як робочі елементи",
      description:
        "Якщо цей параметр увімкнено, ваші епіки будуть імпортовані як робочі елементи з типом робочого елемента 'епік'.",
    },
  },
  notion_importer: {
    notion_importer_description: "Імпортуйте ваші дані Notion у проекти Plane.",
    steps: {
      title_upload_zip: "Завантажити експортований ZIP з Notion",
      description_upload_zip: "Будь ласка, завантажте ZIP файл з вашими даними Notion.",
    },
    upload: {
      drop_file_here: "Перетягніть ваш zip файл Notion сюди",
      upload_title: "Завантажити експорт Notion",
      drag_drop_description: "Перетягніть ваш zip файл експорту Notion або натисніть для перегляду",
      file_type_restriction: "Підтримуються лише .zip файли, експортовані з Notion",
      select_file: "Вибрати файл",
      uploading: "Завантаження...",
      preparing_upload: "Підготовка завантаження...",
      confirming_upload: "Підтвердження завантаження...",
      confirming: "Підтвердження...",
      upload_complete: "Завантаження завершено",
      upload_failed: "Завантаження не вдалося",
      start_import: "Почати імпорт",
      retry_upload: "Повторити завантаження",
      upload: "Завантажити",
      ready: "Готово",
      error: "Помилка",
      upload_complete_message: "Завантаження завершено!",
      upload_complete_description: 'Натисніть "Почати імпорт", щоб розпочати обробку ваших даних Notion.',
      upload_progress_message: "Будь ласка, не закривайте це вікно.",
    },
  },
  confluence_importer: {
    confluence_importer_description: "Імпортуйте ваші дані Confluence у вікі Plane.",
    steps: {
      title_upload_zip: "Завантажити експортований ZIP з Confluence",
      description_upload_zip: "Будь ласка, завантажте ZIP файл з вашими даними Confluence.",
    },
    upload: {
      drop_file_here: "Перетягніть ваш zip файл Confluence сюди",
      upload_title: "Завантажити експорт Confluence",
      drag_drop_description: "Перетягніть ваш zip файл експорту Confluence або натисніть для перегляду",
      file_type_restriction: "Підтримуються лише .zip файли, експортовані з Confluence",
      select_file: "Вибрати файл",
      uploading: "Завантаження...",
      preparing_upload: "Підготовка завантаження...",
      confirming_upload: "Підтвердження завантаження...",
      confirming: "Підтвердження...",
      upload_complete: "Завантаження завершено",
      upload_failed: "Завантаження не вдалося",
      start_import: "Почати імпорт",
      retry_upload: "Повторити завантаження",
      upload: "Завантажити",
      ready: "Готово",
      error: "Помилка",
      upload_complete_message: "Завантаження завершено!",
      upload_complete_description: 'Натисніть "Почати імпорт", щоб розпочати обробку ваших даних Confluence.',
      upload_progress_message: "Будь ласка, не закривайте це вікно.",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "Імпортуйте ваші дані CSV у проджекти Плейн.",
    steps: {
      title_configure_plane: "Налаштувати Плейн",
      description_configure_plane:
        "Будь ласка, спочатку створіть проджект у Плейн, куди ви плануєте мігрувати ваші дані CSV. Після створення проджекту виберіть його тут.",
      title_configure_csv: "Налаштувати CSV",
      description_configure_csv:
        "Будь ласка, завантажте ваш CSV файл і налаштуйте поля, які будуть мапитися до полів Плейн.",
    },
  },
  csv_importer: {
    csv_importer_description: "Імпортуйте робочі елементи з файлів CSV у проекти Plane.",
    steps: {
      title_select_project: "Вибрати проект",
      description_select_project: "Будь ласка, виберіть проект Plane, куди ви хочете імпортувати ваші робочі елементи.",
      title_upload_csv: "Завантажити CSV",
      description_upload_csv:
        "Завантажте свій CSV-файл, що містить робочі елементи. Файл повинен включати стовпці для назви, опису, пріоритету, дат та групи станів.",
    },
  },
  clickup_importer: {
    clickup_importer_description: "Імпортуйте ваші дані ClickUp у проджекти Плейн.",
    select_service_space: "Виберіть {serviceName} Простір",
    select_service_folder: "Виберіть {serviceName} Папку",
    selected: "Вибрано",
    users: "Користувачі",
    steps: {
      title_configure_plane: "Налаштувати Плейн",
      description_configure_plane:
        "Будь ласка, спочатку створіть проджект у Плейн, куди ви плануєте мігрувати ваші дані ClickUp. Після створення проджекту виберіть його тут.",
      title_configure_clickup: "Налаштувати ClickUp",
      description_configure_clickup:
        "Будь ласка, виберіть команду ClickUp, простір і папку, з якої ви хочете мігрувати ваші дані.",
      title_map_states: "Мапування Стейтів",
      description_map_states:
        "Ми автоматично зіставили статуси ClickUp зі стейтами Плейн, наскільки це було можливо. Будь ласка, зіставте всі стейти, що залишилися, перед тим як продовжити, ви також можете створити стейти та мапити їх вручну.",
      title_map_priorities: "Мапування Пріоритетів",
      description_map_priorities:
        "Будь ласка, виберіть пріоритети ClickUp, які ви хочете мапити до пріоритетів проджекту Плейн.",
      title_summary: "Підсумок",
      description_summary: "Ось підсумок даних, які будуть мігровані з ClickUp до Плейн.",
      pull_additional_data_title: "Імпортувати коментарі та прикріплення",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "Бар",
          long_label: "Бар чарт",
          chart_models: {
            basic: "Базовий",
            stacked: "Стековий",
            grouped: "Згрупований",
          },
          orientation: {
            label: "Орієнтація",
            horizontal: "Горизонтальна",
            vertical: "Вертикальна",
            placeholder: "Додати орієнтацію",
          },
          bar_color: "Колір бару",
        },
        line_chart: {
          short_label: "Лайн",
          long_label: "Лайн чарт",
          chart_models: {
            basic: "Базовий",
            multi_line: "Мульти-лайн",
          },
          line_color: "Колір лінії",
          line_type: {
            label: "Тип лінії",
            solid: "Суцільна",
            dashed: "Пунктирна",
            placeholder: "Додати тип лінії",
          },
        },
        area_chart: {
          short_label: "Еріа",
          long_label: "Еріа чарт",
          chart_models: {
            basic: "Базовий",
            stacked: "Стековий",
            comparison: "Порівняльний",
          },
          fill_color: "Колір заповнення",
        },
        donut_chart: {
          short_label: "Донат",
          long_label: "Донат чарт",
          chart_models: {
            basic: "Базовий",
            progress: "Прогрес",
          },
          center_value: "Центральне значення",
          completed_color: "Колір завершення",
        },
        pie_chart: {
          short_label: "Пай",
          long_label: "Пай чарт",
          chart_models: {
            basic: "Базовий",
          },
          group: {
            label: "Згруповані частини",
            group_thin_pieces: "Згрупувати тонкі частини",
            minimum_threshold: {
              label: "Мінімальний поріг",
              placeholder: "Додати поріг",
            },
            name_group: {
              label: "Назва групи",
              placeholder: '"Менше ніж 5%"',
            },
          },
          show_values: "Показати значення",
          value_type: {
            percentage: "Відсоток",
            count: "Кількість",
          },
        },
        text: {
          short_label: "Текст",
          long_label: "Текст",
          alignment: {
            label: "Вирівнювання тексту",
            left: "Зліва",
            center: "По центру",
            right: "Справа",
            placeholder: "Додати вирівнювання тексту",
          },
          text_color: "Колір тексту",
        },
      },
      color_palettes: {
        modern: "Модерн",
        horizon: "Горизон",
        earthen: "Ерфен",
      },
      common: {
        add_widget: "Додати віджет",
        widget_title: {
          label: "Назвіть цей віджет",
          placeholder: 'напр., "Туду на вчора", "Все Завершено"',
        },
        chart_type: "Тип чарту",
        visualization_type: {
          label: "Тип візуалізації",
          placeholder: "Додати тип візуалізації",
        },
        date_group: {
          label: "Група дати",
          placeholder: "Додати групу дати",
        },
        group_by: "Групувати за",
        stack_by: "Стекати за",
        daily: "Щоденно",
        weekly: "Щотижнево",
        monthly: "Щомісячно",
        yearly: "Щорічно",
        work_item_count: "Кількість робочих елементів",
        estimate_point: "Естімейт поінт",
        pending_work_item: "Очікуючі робочі елементи",
        completed_work_item: "Завершені робочі елементи",
        in_progress_work_item: "Робочі елементи в прогресі",
        blocked_work_item: "Заблоковані робочі елементи",
        work_item_due_this_week: "Робочі елементи на цей тиждень",
        work_item_due_today: "Робочі елементи на сьогодні",
        color_scheme: {
          label: "Колірна схема",
          placeholder: "Додати колірну схему",
        },
        smoothing: "Згладжування",
        markers: "Маркери",
        legends: "Легенди",
        tooltips: "Тултіпи",
        opacity: {
          label: "Прозорість",
          placeholder: "Додати прозорість",
        },
        border: "Бордер",
        widget_configuration: "Конфігурація віджету",
        configure_widget: "Налаштувати віджет",
        guides: "Гайди",
        style: "Стайл",
        area_appearance: "Вигляд області",
        comparison_line_appearance: "Вигляд лінії порівняння",
        add_property: "Додати проперті",
        add_metric: "Додати метрику",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "Відсутнє значення осі x.",
            y_axis_metric: "Відсутнє значення метрики.",
          },
          stacked: {
            x_axis_property: "Відсутнє значення осі x.",
            y_axis_metric: "Відсутнє значення метрики.",
            group_by: "Відсутнє значення стекінгу.",
          },
          grouped: {
            x_axis_property: "Відсутнє значення осі x.",
            y_axis_metric: "Відсутнє значення метрики.",
            group_by: "Відсутнє значення групування.",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "Відсутнє значення осі x.",
            y_axis_metric: "Відсутнє значення метрики.",
          },
          multi_line: {
            x_axis_property: "Відсутнє значення осі x.",
            y_axis_metric: "Відсутнє значення метрики.",
            group_by: "Відсутнє значення групування.",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "Відсутнє значення осі x.",
            y_axis_metric: "Відсутнє значення метрики.",
          },
          stacked: {
            x_axis_property: "Відсутнє значення осі x.",
            y_axis_metric: "Відсутнє значення метрики.",
            group_by: "Відсутнє значення стекінгу.",
          },
          comparison: {
            x_axis_property: "Відсутнє значення осі x.",
            y_axis_metric: "Відсутнє значення метрики.",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "Відсутнє значення осі x.",
            y_axis_metric: "Відсутнє значення метрики.",
          },
          progress: {
            y_axis_metric: "Відсутнє значення метрики.",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "Відсутнє значення осі x.",
            y_axis_metric: "Відсутнє значення метрики.",
          },
        },
        text: {
          basic: {
            y_axis_metric: "Відсутнє значення метрики.",
          },
        },
        ask_admin: "Попросіть адміністратора налаштувати цей віджет.",
      },
    },
    create_modal: {
      heading: {
        create: "Створити новий дешборд",
        update: "Оновити дешборд",
      },
      title: {
        label: "Назвіть ваш дешборд.",
        placeholder: '"Спроможність між проджектами", "Робоче навантаження по команді", "Стан по всіх проджектах"',
        required_error: "Назва обов'язкова",
      },
      project: {
        label: "Виберіть проджекти",
        placeholder: "Дані з цих проджектів будуть живити цей дешборд.",
        required_error: "Проджекти обов'язкові",
      },
      create_dashboard: "Створити дешборд",
      update_dashboard: "Оновити дешборд",
    },
    delete_modal: {
      heading: "Видалити дешборд",
    },
    empty_state: {
      feature_flag: {
        title: "Презентуйте свій прогрес у дешбордах на вимогу.",
        description:
          "Створюйте будь-який потрібний дешборд і налаштовуйте вигляд ваших даних для ідеальної презентації вашого прогресу.",
        coming_soon_to_mobile: "Незабаром у мобільному додатку",
        card_1: {
          title: "Для всіх ваших проджектів",
          description:
            "Отримайте повний огляд вашого воркспейсу з усіма вашими проджектами або виберіть дані про вашу роботу для ідеального відображення вашого прогресу.",
        },
        card_2: {
          title: "Для будь-яких даних у Плейн",
          description:
            "Вийдіть за межі стандартної Аналітики та готових графіків Циклу, щоб по-новому поглянути на команди, ініціативи або будь-що інше.",
        },
        card_3: {
          title: "Для всіх ваших потреб у візуалізації даних",
          description:
            "Вибирайте з кількох налаштовуваних чартів з детальними контролями, щоб бачити та показувати дані про вашу роботу саме так, як ви хочете.",
        },
        card_4: {
          title: "На вимогу та постійно",
          description:
            "Створіть один раз, зберігайте назавжди з автоматичним оновленням ваших даних, контекстуальними прапорцями для змін обсягу та посиланнями для поширення.",
        },
        card_5: {
          title: "Експорти та заплановані повідомлення",
          description:
            "Для тих випадків, коли посилання не працюють, отримуйте ваші дешборди у PDF-файли або заплануйте їх автоматичне надсилання стейкхолдерам.",
        },
        card_6: {
          title: "Автоматичне макетування для всіх пристроїв",
          description:
            "Змінюйте розмір своїх віджетів для бажаного макета і бачте його однаково на мобільних, планшетних та інших браузерах.",
        },
      },
      dashboards_list: {
        title: "Візуалізуйте дані у віджетах, створюйте свої дешборди з віджетами та отримуйте останні дані на вимогу.",
        description:
          "Створюйте свої дешборди з Кастомними Віджетами, які показують ваші дані в зазначеному обсязі. Отримуйте дешборди для всієї вашої роботи між проджектами та командами і діліться посиланнями зі стейкхолдерами для відстеження на вимогу.",
      },
      dashboards_search: {
        title: "Це не збігається з назвою дешборду.",
        description: "Переконайтеся, що ваш запит правильний, або спробуйте інший запит.",
      },
      widgets_list: {
        title: "Візуалізуйте свої дані так, як ви хочете.",
        description: `Використовуйте лінії, бари, паї та інші формати, щоб бачити свої дані
так, як ви хочете, з джерел, які ви вказуєте.`,
      },
      widget_data: {
        title: "Тут нічого немає",
        description: "Оновіть або додайте дані, щоб побачити їх тут.",
      },
    },
    common: {
      editing: "Редагування",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "Дозволити нові робочі елементи",
      work_item_creation_disable_tooltip: "Створення робочих елементів вимкнено для цього стану",
      default_state: "Стан за замовчуванням дозволяє всім членам створювати нові робочі елементи. Це не можна змінити",
      state_change_count: "{count, plural, one {1 дозволена зміна стану} other {{count} дозволених змін стану}}",
      movers_count: "{count, plural, one {1 зазначений рев'юер} other {{count} зазначених рев'юерів}}",
      state_changes: {
        label: {
          default: "Додати дозволену зміну стану",
          loading: "Додавання дозволеної зміни стану",
        },
        move_to: "Змінити стан на",
        movers: {
          label: "Коли перевірено",
          tooltip: "Рев'юери - це люди, яким дозволено переміщувати робочі елементи з одного стану в інший.",
          add: "Додати рев'юерів",
        },
      },
    },
    workflow_disabled: {
      title: "Ви не можете перемістити цей робочий елемент сюди.",
    },
    workflow_enabled: {
      label: "Зміна стану",
    },
    workflow_tree: {
      label: "Для робочих елементів у",
      state_change_label: "може перемістити його до",
    },
    empty_state: {
      upgrade: {
        title: "Контролюйте хаос змін та перевірок за допомогою Воркфлоу.",
        description: "Встановлюйте правила для переміщення вашої роботи, ким і коли за допомогою Воркфлоу в Плейн.",
      },
    },
    quick_actions: {
      view_change_history: "Перегляд історії змін",
      reset_workflow: "Скинути воркфлоу",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "Ви впевнені, що хочете скинути цей воркфлоу?",
        description:
          "Якщо ви скинете цей воркфлоу, всі ваші правила зміни стану будуть видалені, і вам доведеться створити їх знову, щоб запустити їх у цьому проджекті.",
      },
      delete_state_change: {
        title: "Ви впевнені, що хочете видалити це правило зміни стану?",
        description:
          "Після видалення ви не зможете скасувати цю зміну, і вам доведеться знову встановити правило, якщо ви хочете, щоб воно працювало для цього проджекту.",
      },
    },
    toasts: {
      enable_disable: {
        loading: "{action} воркфлоу",
        success: {
          title: "Успіх",
          message: "Воркфлоу успішно {action}",
        },
        error: {
          title: "Помилка",
          message: "Воркфлоу не вдалося {action}. Будь ласка, спробуйте ще раз.",
        },
      },
      reset: {
        success: {
          title: "Успіх",
          message: "Воркфлоу успішно скинуто",
        },
        error: {
          title: "Помилка скидання воркфлоу",
          message: "Не вдалося скинути воркфлоу. Будь ласка, спробуйте ще раз.",
        },
      },
      add_state_change_rule: {
        error: {
          title: "Помилка додавання правила зміни стану",
          message: "Не вдалося додати правило зміни стану. Будь ласка, спробуйте ще раз.",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "Помилка зміни правила зміни стану",
          message: "Не вдалося змінити правило зміни стану. Будь ласка, спробуйте ще раз.",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "Помилка видалення правила зміни стану",
          message: "Не вдалося видалити правило зміни стану. Будь ласка, спробуйте ще раз.",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "Помилка зміни рев'юерів правила зміни стану",
          message: "Не вдалося змінити рев'юерів правила зміни стану. Будь ласка, спробуйте ще раз.",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {Кастомер} other {Кастомери}}",
    open: "Відкрити кастомера",
    dropdown: {
      placeholder: "Виберіть клієнта",
      required: "Будь ласка, виберіть клієнта",
      no_selection: "Немає клієнтів",
    },
    upgrade: {
      title: "Пріоритезуйте та керуйте роботою з Кастомерами.",
      description: "Мапіть вашу роботу до кастомерів і пріоритезуйте за атрибутами кастомерів.",
    },
    properties: {
      default: {
        title: "Дефолтні проперті",
        customer_name: {
          name: "Ім'я кастомера",
          placeholder: "Це може бути ім'я особи або бізнесу",
          validation: {
            required: "Ім'я кастомера обов'язкове.",
            max_length: "Ім'я кастомера не може бути більше 255 символів.",
          },
        },
        description: {
          name: "Опис",
          validation: {},
        },
        email: {
          name: "Емейл",
          placeholder: "Введіть емейл",
          validation: {
            required: "Емейл обов'язковий.",
            pattern: "Недійсна адреса емейлу.",
          },
        },
        website_url: {
          name: "Вебсайт",
          placeholder: "Будь-який URL з https:// працюватиме.",
          placeholder_short: "Додати вебсайт",
          validation: {
            pattern: "Недійсний URL вебсайту",
          },
        },
        employees: {
          name: "Працівники",
          placeholder: "Кількість працівників, якщо ваш кастомер - бізнес.",
          validation: {
            min_length: "Кількість працівників не може бути менше 0.",
            max_length: "Кількість працівників не може бути більше 2147483647.",
          },
        },
        size: {
          name: "Розмір",
          placeholder: "Додати розмір компанії",
          validation: {
            min_length: "Недійсний розмір",
          },
        },
        domain: {
          name: "Індустрія",
          placeholder: "Рітейл, е-Комерція, Фінтех, Банкінг",
          placeholder_short: "Додати індустрію",
          validation: {},
        },
        stage: {
          name: "Стейдж",
          placeholder: "Виберіть стейдж",
          validation: {},
        },
        contract_status: {
          name: "Статус Контракту",
          placeholder: "Виберіть статус контракту",
          validation: {},
        },
        revenue: {
          name: "Ревеню",
          placeholder: "Це ревеню, яке ваш кастомер генерує щорічно.",
          placeholder_short: "Додати ревеню",
          validation: {
            min_length: "Ревеню не може бути менше 0.",
          },
          invalid_value: "Недійсний ревеню.",
        },
      },
      custom: {
        title: "Кастомні проперті",
        info: "Додайте унікальні атрибути ваших кастомерів до Плейн, щоб ви могли краще керувати робочими елементами або записами кастомерів.",
      },
      empty_state: {
        title: "У вас ще немає кастомних проперті.",
        description:
          "Кастомні проперті, які ви хотіли б бачити в робочих елементах, в інших місцях у Плейн або поза Плейн в CRM чи іншому інструменті, з'являться тут, коли ви їх додасте.",
      },
      add: {
        primary_button: "Додати нове проперті",
      },
    },
    stage: {
      lead: "Лід",
      sales_qualified_lead: "Кваліфікований лід продажів",
      contract_negotiation: "Переговори по контракту",
      closed_won: "Закрито виграно",
      closed_lost: "Закрито програно",
    },
    contract_status: {
      active: "Активний",
      pre_contract: "Перед-контракт",
      signed: "Підписаний",
      inactive: "Неактивний",
    },
    empty_state: {
      detail: {
        title: "Ми не змогли знайти цей запис кастомера.",
        description: "Посилання на цей запис може бути неправильним або цей запис міг бути видалений.",
        primary_button: "Перейти до кастомерів",
        secondary_button: "Додати кастомера",
      },
      search: {
        title: "Здається, у вас немає записів кастомерів, що відповідають цьому терміну.",
        description:
          "Спробуйте з іншим пошуковим терміном або зверніться до нас, якщо ви впевнені, що повинні бачити результати для цього терміну.",
      },
      list: {
        title: "Керуйте обсягом, ритмом та потоком вашої роботи за тим, що важливо для ваших кастомерів.",
        description:
          "З Кастомерами, функцією тільки в Плейн, ви тепер можете створювати нових кастомерів з нуля і підключати їх до вашої роботи. Незабаром ви зможете переносити їх з інших інструментів разом з їхніми кастомними атрибутами, які важливі для вас.",
        primary_button: "Додати вашого першого кастомера",
      },
    },
    settings: {
      unauthorized: "Ви не маєте дозволу на доступ до цієї сторінки.",
      description: "Відстежуйте та керуйте стосунками з кастомерами у вашому воркфлоу.",
      enable: "Увімкнути Кастомерів",
      toasts: {
        enable: {
          loading: "Увімкнення функції кастомерів...",
          success: {
            title: "Ви увімкнули Кастомерів для цього воркспейсу.",
            message: "Ви не можете знову вимкнути це.",
          },
          error: {
            title: "Ми не змогли увімкнути Кастомерів цього разу.",
            message: "Спробуйте ще раз або поверніться до цього екрану пізніше. Якщо це все ще не працює.",
            action: "Поговорити з саппортом",
          },
        },
        disable: {
          loading: "Вимкнення функції кастомерів...",
          success: {
            title: "Кастомери вимкнено",
            message: "Функцію кастомерів успішно вимкнено!",
          },
          error: {
            title: "Помилка",
            message: "Не вдалося вимкнути функцію кастомерів!",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "Ми не змогли отримати ваш список кастомерів.",
          message: "Спробуйте ще раз або оновіть цю сторінку.",
        },
      },
      copy_link: {
        title: "Ви скопіювали пряме посилання на цього кастомера.",
        message: "Вставте його де завгодно, і воно приведе прямо сюди.",
      },
      create: {
        success: {
          title: "{customer_name} тепер доступний",
          message: "Ви можете посилатися на цього кастомера в робочих елементах і також відстежувати запити від нього.",
          actions: {
            view: "Переглянути",
            copy_link: "Копіювати посилання",
            copied: "Скопійовано!",
          },
        },
        error: {
          title: "Ми не змогли створити цей запис цього разу.",
          message:
            "Спробуйте зберегти його знову або скопіюйте ваш незбережений текст до нового запису, бажано в іншій вкладці.",
        },
      },
      update: {
        success: {
          title: "Успіх!",
          message: "Кастомера успішно оновлено!",
        },
        error: {
          title: "Помилка!",
          message: "Не вдалося оновити кастомера. Спробуйте ще раз!",
        },
      },
      logo: {
        error: {
          title: "Ми не змогли завантажити лого кастомера.",
          message: "Спробуйте зберегти лого знову або почати з нуля.",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "Ви видалили робочий елемент із запису цього кастомера.",
            message: "Ми також автоматично видалили цього кастомера з робочого елемента.",
          },
          error: {
            title: "Помилка!",
            message: "Ми не змогли видалити цей робочий елемент із запису цього кастомера цього разу.",
          },
        },
        add: {
          error: {
            title: "Ми не змогли додати цей робочий елемент до запису цього кастомера цього разу.",
            message:
              "Спробуйте додати цей робочий елемент знову або поверніться до нього пізніше. Якщо він все ще не працює, зверніться до нас.",
          },
          success: {
            title: "Ви додали робочий елемент до запису цього кастомера.",
            message: "Ми також автоматично додали цього кастомера до робочого елемента.",
          },
        },
      },
    },
    quick_actions: {
      edit: "Редагувати",
      copy_link: "Копіювати посилання на кастомера",
      delete: "Видалити",
    },
    create: {
      label: "Створити запис кастомера",
      loading: "Створення",
      cancel: "Скасувати",
    },
    update: {
      label: "Оновити кастомера",
      loading: "Оновлення",
    },
    delete: {
      title: "Ви впевнені, що хочете видалити запис кастомера {customer_name}?",
      description:
        "Всі дані, пов'язані з цим записом, будуть видалені назавжди. Ви не зможете відновити цей запис пізніше.",
    },
    requests: {
      empty_state: {
        list: {
          title: "Ще немає запитів для показу.",
          description: "Створюйте запити від ваших кастомерів, щоб ви могли пов'язати їх з робочими елементами.",
          button: "Додати новий запит",
        },
        search: {
          title: "Здається, у вас немає запитів, що відповідають цьому терміну.",
          description:
            "Спробуйте з іншим пошуковим терміном або зверніться до нас, якщо ви впевнені, що повинні бачити результати для цього терміну.",
        },
      },
      label: "{count, plural, one {Запит} other {Запити}}",
      add: "Додати запит",
      create: "Створити запит",
      update: "Оновити запит",
      form: {
        name: {
          placeholder: "Назвіть цей запит",
          validation: {
            required: "Назва обов'язкова.",
            max_length: "Назва запиту не повинна перевищувати 255 символів.",
          },
        },
        description: {
          placeholder: "Опишіть характер запиту або вставте коментар цього кастомера з іншого інструменту.",
        },
        source: {
          add: "Додати джерело",
          update: "Оновити джерело",
          url: {
            label: "URL",
            required: "URL обов'язковий",
            invalid: "Недійсний URL вебсайту",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "Посилання скопійовано",
          message: "Посилання на запит кастомера скопійовано в буфер обміну.",
        },
        attachment: {
          upload: {
            loading: "Завантаження вкладення...",
            success: {
              title: "Вкладення завантажено",
              message: "Вкладення було успішно завантажено.",
            },
            error: {
              title: "Вкладення не завантажено",
              message: "Вкладення не вдалося завантажити.",
            },
          },
          size: {
            error: {
              title: "Помилка!",
              message: "За один раз можна завантажити лише один файл.",
            },
          },
          length: {
            message: "Файл повинен бути розміром {size}MB або менше",
          },
          remove: {
            success: {
              title: "Вкладення видалено",
              message: "Вкладення було успішно видалено",
            },
            error: {
              title: "Вкладення не видалено",
              message: "Вкладення не вдалося видалити",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "Успіх!",
              message: "Джерело успішно оновлено!",
            },
            error: {
              title: "Помилка!",
              message: "Не вдалося оновити джерело.",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "Помилка!",
              message: "Не вдалося додати робочі елементи до запиту. Спробуйте ще раз.",
            },
            success: {
              title: "Успіх!",
              message: "Додано робочі елементи до запиту.",
            },
          },
        },
        update: {
          success: {
            message: "Запит успішно оновлено!",
            title: "Успіх!",
          },
          error: {
            title: "Помилка!",
            message: "Не вдалося оновити запит. Спробуйте ще раз!",
          },
        },
        create: {
          success: {
            message: "Запит успішно створено!",
            title: "Успіх!",
          },
          error: {
            title: "Помилка!",
            message: "Не вдалося створити запит. Спробуйте ще раз!",
          },
        },
      },
    },
    linked_work_items: {
      label: "Пов'язані робочі елементи",
      link: "Пов'язати робочі елементи",
      empty_state: {
        list: {
          title: "Здається, ви ще не пов'язали робочі елементи з цим кастомером.",
          description:
            "Пов'яжіть існуючі робочі елементи з будь-якого проджекту тут, щоб ви могли відстежувати їх за цим кастомером.",
          button: "Пов'язати робочий елемент",
        },
      },
      action: {
        remove_epic: "Видалити епік",
        remove: "Видалити робочий елемент",
      },
    },
    sidebar: {
      properties: "Проперті",
    },
  },
  templates: {
    settings: {
      title: "Темплейти",
      description:
        "Заощаджуйте 80% часу, витраченого на створення проджектів, робочих елементів та пейджів, коли використовуєте темплейти.",
      options: {
        project: {
          label: "Проджект темплейти",
        },
        work_item: {
          label: "Темплейти робочих елементів",
        },
        page: {
          label: "Пейдж темплейти",
        },
      },
      create_template: {
        label: "Створити темплейт",
        no_permission: {
          project: "Зверніться до адміністратора проджекту, щоб створити темплейти",
          workspace: "Зверніться до адміністратора воркспейсу, щоб створити темплейти",
        },
      },
      use_template: {
        button: {
          default: "Використати темплейт",
          loading: "Використання",
        },
      },
      template_source: {
        workspace: {
          info: "Походить з воркспейсу",
        },
        project: {
          info: "Походить з проджекту",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "Назвіть ваш проджект темплейт.",
              validation: {
                required: "Назва темплейту обов'язкова",
                maxLength: "Назва темплейту має бути менше 255 символів",
              },
            },
            description: {
              placeholder: "Опишіть, коли і як використовувати цей темплейт.",
            },
          },
          name: {
            placeholder: "Назвіть ваш проджект.",
            validation: {
              required: "Назва проджекту обов'язкова",
              maxLength: "Назва проджекту має бути менше 255 символів",
            },
          },
          description: {
            placeholder: "Опишіть мету та цілі цього проджекту.",
          },
          button: {
            create: "Створити проджект темплейт",
            update: "Оновити проджект темплейт",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "Назвіть ваш темплейт робочого елемента.",
              validation: {
                required: "Назва темплейту обов'язкова",
                maxLength: "Назва темплейту має бути менше 255 символів",
              },
            },
            description: {
              placeholder: "Опишіть, коли і як використовувати цей темплейт.",
            },
          },
          name: {
            placeholder: "Дайте цьому робочому елементу заголовок.",
            validation: {
              required: "Заголовок робочого елемента обов'язковий",
              maxLength: "Заголовок робочого елемента має бути менше 255 символів",
            },
          },
          description: {
            placeholder: "Опишіть цей робочий елемент так, щоб було зрозуміло, чого ви досягнете, коли завершите його.",
          },
          button: {
            create: "Створити темплейт робочого елемента",
            update: "Оновити темплейт робочого елемента",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "Назвіть ваш темплейт сторінки.",
              validation: {
                required: "Назва темплейту обов'язкова",
                maxLength: "Назва темплейту має бути менше 255 символів",
              },
            },
            description: {
              placeholder: "Опишіть, коли і як використовувати цей темплейт.",
            },
          },
          name: {
            placeholder: "Без назви",
            validation: {
              maxLength: "Назва сторінки має бути менше 255 символів",
            },
          },
          button: {
            create: "Створити темплейт сторінки",
            update: "Оновити темплейт сторінки",
          },
        },
        publish: {
          action: "{isPublished, select, true {Налаштування публікації} other {Опублікувати в Маркетплейсі}}",
          unpublish_action: "Видалити з Маркетплейсу",
          title: "Зробіть ваш темплейт знайденим та впізнаваним.",
          name: {
            label: "Назва темплейту",
            placeholder: "Назвіть ваш темплейт",
            validation: {
              required: "Назва темплейту обов'язкова",
              maxLength: "Назва темплейту має бути менше 255 символів",
            },
          },
          short_description: {
            label: "Короткий опис",
            placeholder:
              "Цей темплейт чудово підходить для Проджект Менеджерів, які керують кількома проджектами одночасно.",
            validation: {
              required: "Короткий опис обов'язковий",
            },
          },
          description: {
            label: "Опис",
            placeholder: `Підвищте продуктивність та оптимізуйте комунікацію за допомогою нашої інтеграції Мова-в-Текст.
• Транскрипція в реальному часі: Миттєво перетворюйте розмовну мову на точний текст.
• Створення завдань та коментарів: Додавайте завдання, описи та коментарі за допомогою голосових команд.`,
            validation: {
              required: "Опис обов'язковий",
            },
          },
          category: {
            label: "Категорія",
            placeholder: "Виберіть, де, на вашу думку, це найкраще підходить. Ви можете вибрати більше однієї.",
            validation: {
              required: "Потрібна хоча б одна категорія",
            },
          },
          keywords: {
            label: "Ключові слова",
            placeholder:
              "Використовуйте терміни, які, на вашу думку, ваші користувачі будуть шукати при пошуку цього темплейту.",
            helperText:
              "Введіть ключові слова, розділені комами, які, на вашу думку, допоможуть людям знайти це з пошуку.",
            validation: {
              required: "Потрібно хоча б одне ключове слово",
            },
          },
          company_name: {
            label: "Назва компанії",
            placeholder: "Plane",
            validation: {
              required: "Назва компанії обов'язкова",
              maxLength: "Назва компанії має бути менше 255 символів",
            },
          },
          contact_email: {
            label: "Email підтримки",
            placeholder: "help@plane.so",
            validation: {
              invalid: "Некоректна email адреса",
              required: "Email підтримки обов'язковий",
              maxLength: "Email підтримки має бути менше 255 символів",
            },
          },
          privacy_policy_url: {
            label: "Посилання на вашу політику конфіденційності",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "Некоректне посилання",
              maxLength: "Посилання має бути менше 800 символів",
            },
          },
          terms_of_service_url: {
            label: "Посилання на ваші умови використання",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "Некоректне посилання",
              maxLength: "Посилання має бути менше 800 символів",
            },
          },
          cover_image: {
            label: "Додайте зображення обкладинки, яке буде відображатися на ринку",
            upload_title: "Завантажити зображення обкладинки",
            upload_placeholder: "Натисніть для завантаження або перетягніть зображення обкладинки",
            drop_here: "Відпустіть тут",
            click_to_upload: "Натисніть для завантаження",
            invalid_file_or_exceeds_size_limit:
              "Недійсний файл або перевищує ліміт розміру. Будь ласка, спробуйте ще раз.",
            upload_and_save: "Завантажити та зберегти",
            uploading: "Завантаження",
            remove: "Видалити",
            removing: "Видалення",
            validation: {
              required: "Зображення обкладинки обов'язкове",
            },
          },
          attach_screenshots: {
            label: "Додайте документи та зображення, які, на вашу думку, допоможуть переглядачам цього темплейту.",
            validation: {
              required: "Потрібен хоча б один скріншот",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "Темплейти",
        description:
          "З темплейтами проджектів, робочих елементів та пейджів у Плейн, вам не доведеться створювати проджект з нуля або вручну налаштовувати пропси робочих елементів.",
        sub_description: "Поверніть 80% часу адміністрування, коли використовуєте Темплейти.",
      },
      no_templates: {
        button: "Створіть ваш перший темплейт",
      },
      no_labels: {
        description:
          " Поки що немає лейблів. Створіть лейбли, щоб допомогти організувати та фільтрувати робочі елементи у вашому проджекті.",
      },
      no_work_items: {
        description: "Немає робочих елементів. Додайте один, щоб краще структурувати свою роботу.",
      },
      no_sub_work_items: {
        description: "Немає під-робочих елементів. Додайте один, щоб краще структурувати свою роботу.",
      },
      page: {
        no_templates: {
          title: "Немає темплейтів, до яких у вас є доступ.",
          description: "Будь ласка, створіть темплейт",
        },
        no_results: {
          title: "Це не відповідає жодному темплейту.",
          description: "Спробуйте пошук за іншими термінами.",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "Темплейт створено",
          message: "{templateName}, {templateType} темплейт, тепер доступний для вашого воркспейсу.",
        },
        error: {
          title: "Ми не змогли створити цей темплейт цього разу.",
          message: "Спробуйте зберегти ваші деталі знову або скопіюйте їх до нового темплейту, бажано в іншій вкладці.",
        },
      },
      update: {
        success: {
          title: "Темплейт змінено",
          message: "{templateName}, {templateType} темплейт, було змінено.",
        },
        error: {
          title: "Ми не змогли зберегти зміни до цього темплейту.",
          message:
            "Спробуйте зберегти ваші деталі знову або повернутися до цього темплейту пізніше. Якщо все ще виникають проблеми, зверніться до нас.",
        },
      },
      delete: {
        success: {
          title: "Темплейт видалено",
          message: "{templateName}, {templateType} темплейт, тепер видалено з вашого воркспейсу.",
        },
        error: {
          title: "Ми не змогли видалити цей темплейт.",
          message:
            "Спробуйте видалити його знову або повернутися до нього пізніше. Якщо ви не можете видалити його, зверніться до нас.",
        },
      },
      unpublish: {
        success: {
          title: "Темплейт знято з публікації",
          message: "{templateName}, {templateType} темплейт, було знято з публікації.",
        },
        error: {
          title: "Ми не змогли зняти цей темплейт з публікації.",
          message:
            "Спробуйте зняти його з публікації знову або повернутися до нього пізніше. Якщо ви не можете зняти його з публікації, зверніться до нас.",
        },
      },
    },
    delete_confirmation: {
      title: "Видалити темплейт",
      description: {
        prefix: "Ви впевнені, що хочете видалити темплейт-",
        suffix: "? Всі дані, пов'язані з темплейтом, будуть остаточно видалені. Цю дію неможливо скасувати.",
      },
    },
    unpublish_confirmation: {
      title: "Зняти темплейт з публікації",
      description: {
        prefix: "Ви впевнені, що хочете зняти темплейт-",
        suffix: " з публікації? Цей темплейт більше не буде доступний користувачам у маркетплейсі.",
      },
    },
    dropdown: {
      add: {
        work_item: "Додати новий шаблон",
        project: "Додати новий шаблон",
      },
      label: {
        project: "Вибрати шаблон проекту",
        page: "Вибрати шаблон",
      },
      tooltip: {
        work_item: "Вибрати шаблон елемента роботи",
      },
      no_results: {
        work_item: "Шаблони не знайдено.",
        project: "Шаблони не знайдено.",
      },
    },
  },
  intake_forms: {
    create: {
      title: "Створити робочий елемент",
      "sub-title": "Повідомте команді, над чим ви хочете, щоб вони працювали.",
      name: "Ім'я",
      email: "Ел. пошта",
      about: "Про що цей робочий елемент?",
      description: "Опишіть, що має статися",
      description_placeholder:
        "Додайте стільки деталей, скільки потрібно, щоб команда зрозуміла вашу ситуацію та потреби.",
      loading: "Створення",
      create_work_item: "Створити робочий елемент",
      errors: {
        name: "Ім'я обов'язкове",
        name_max_length: "Ім'я має містити менше 255 символів",
        email: "Ел. пошта обов'язкова",
        email_invalid: "Недійсна адреса ел. пошти",
        title: "Назва обов'язкова",
        title_max_length: "Назва має містити менше 255 символів",
      },
    },
    success: {
      title: "Ваш робочий елемент додано до черги команди.",
      description: "Команда тепер може схвалити або відхилити цей елемент у черзі надходжень.",
      primary_button: {
        text: "Додати інший робочий елемент",
      },
      secondary_button: {
        text: "Дізнатися більше про надходження",
      },
    },
    how_it_works: {
      title: "Як це працює?",
      heading: "Це форма надходжень.",
      description:
        "Надходження — функція Plane, що дозволяє адміністраторам і керівникам проєктів отримувати робочі елементи ззовні в свої проєкти.",
      steps: {
        step_1: "Ця коротка форма дозволяє створити новий робочий елемент у проєкті Plane.",
        step_2: "Після надсилання форми в надходженнях цього проєкту створюється новий робочий елемент.",
        step_3: "Хтось із проєкту або команди перевірить його.",
        step_4: "Якщо схвалять, елемент переміститься до робочої черги проєкту. Інакше буде відхилено.",
        step_5:
          "Щоб дізнатися статус елемента, зверніться до керівника проєкту, адміністратора або того, хто надіслав вам посилання на цю сторінку.",
      },
    },
    type_forms: {
      select_types: {
        title: "Вибрати тип робочого елемента",
        search_placeholder: "Шукати тип робочого елемента",
      },
      actions: {
        select_properties: "Вибрати властивості",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "Повторювані робочі елементи",
      description:
        "Налаштуйте повторювані робочі елементи один раз, і ми займемося повтореннями. Ви побачите все тут, коли настане час.",
      new_recurring_work_item: "Нова повторювана робоча задача",
      update_recurring_work_item: "Оновити повторювану робочу задачу",
      form: {
        interval: {
          title: "Розклад",
          start_date: {
            validation: {
              required: "Початкова дата є обовʼязковою",
            },
          },
          interval_type: {
            validation: {
              required: "Тип інтервалу є обовʼязковим",
            },
          },
        },
        button: {
          create: "Створити повторювану задачу",
          update: "Оновити повторювану задачу",
        },
      },
      create_button: {
        label: "Створити повторювану задачу",
        no_permission: "Зверніться до адміністратора проєкту, щоб створити повторювані задачі",
      },
    },
    empty_state: {
      upgrade: {
        title: "Ваша робота на автопілоті",
        description:
          "Налаштуйте один раз. Ми повернемо її, коли настане час. Оновіть до Бізнес, щоб повторювана робота була легкою.",
      },
      no_templates: {
        button: "Створіть свою першу повторювану задачу",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Повторювана задача створена",
          message: "{name}, повторювана задача, тепер доступна у вашому робочому просторі.",
        },
        error: {
          title: "Не вдалося створити цю повторювану задачу.",
          message: "Спробуйте зберегти дані ще раз або скопіюйте їх у нову повторювану задачу, бажано в іншій вкладці.",
        },
      },
      update: {
        success: {
          title: "Повторювана задача змінена",
          message: "{name}, повторювана задача, була змінена.",
        },
        error: {
          title: "Не вдалося зберегти зміни до цієї повторюваної задачі.",
          message:
            "Спробуйте зберегти дані ще раз або поверніться до цієї задачі пізніше. Якщо проблема залишиться, зверніться до нас.",
        },
      },
      delete: {
        success: {
          title: "Повторювана задача видалена",
          message: "{name}, повторювана задача, була видалена з вашого робочого простору.",
        },
        error: {
          title: "Не вдалося видалити цю повторювану задачу.",
          message:
            "Спробуйте видалити ще раз або поверніться до неї пізніше. Якщо не вдається видалити, зверніться до нас.",
        },
      },
    },
    delete_confirmation: {
      title: "Видалити повторювану задачу",
      description: {
        prefix: "Ви впевнені, що хочете видалити повторювану задачу-",
        suffix:
          "? Всі дані, пов'язані з цією повторюваною задачею, будуть остаточно видалені. Цю дію неможливо скасувати.",
      },
    },
  },
  automations: {
    settings: {
      title: "Користувацькі автоматизації",
      create_automation: "Створити автоматизацію",
    },
    scope: {
      label: "Область",
      run_on: "Запустити на",
    },
    trigger: {
      label: "Тригер",
      add_trigger: "Додати тригер",
      sidebar_header: "Конфігурація тригера",
      input_label: "Який тригер для цієї автоматизації?",
      input_placeholder: "Виберіть опцію",
      button: {
        previous: "Назад",
        next: "Додати дію",
      },
    },
    condition: {
      label: "За умови",
      add_condition: "Додати умову",
      adding_condition: "Додавання умови",
    },
    action: {
      label: "Дія",
      add_action: "Додати дію",
      sidebar_header: "Дії",
      input_label: "Що робить автоматизація?",
      input_placeholder: "Виберіть опцію",
      handler_name: {
        add_comment: "Додати коментар",
        change_property: "Змінити властивість",
      },
      configuration: {
        label: "Конфігурація",
        change_property: {
          placeholders: {
            property_name: "Виберіть властивість",
            change_type: "Вибрати",
            property_value_select:
              "{count, plural, one{Вибрати значення} few{Вибрати значення} other{Вибрати значення}}",
            property_value_select_date: "Вибрати дату",
          },
          validation: {
            property_name_required: "Назва властивості обов'язкова",
            change_type_required: "Тип зміни обов'язковий",
            property_value_required: "Значення властивості обов'язкове",
          },
        },
      },
      comment_block: {
        title: "Додати коментар",
      },
      change_property_block: {
        title: "Змінити властивість",
      },
      validation: {
        delete_only_action: "Вимкніть автоматизацію перед видаленням її єдиної дії.",
      },
    },
    conjunctions: {
      and: "І",
      or: "Або",
      if: "Якщо",
      then: "Тоді",
    },
    enable: {
      alert:
        "Натисніть 'Увімкнути', коли ваша автоматизація буде завершена. Після увімкнення автоматизація буде готова до запуску.",
      validation: {
        required: "Автоматизація повинна мати тригер і принаймні одну дію, щоб бути увімкненою.",
      },
    },
    delete: {
      validation: {
        enabled: "Автоматизація повинна бути вимкнена перед її видаленням.",
      },
    },
    table: {
      title: "Назва автоматизації",
      last_run_on: "Останній запуск",
      created_on: "Створено",
      last_updated_on: "Останнє оновлення",
      last_run_status: "Статус останнього запуску",
      average_duration: "Середня тривалість",
      owner: "Власник",
      executions: "Виконання",
    },
    create_modal: {
      heading: {
        create: "Створити автоматизацію",
        update: "Оновити автоматизацію",
      },
      title: {
        placeholder: "Назвіть вашу автоматизацію.",
        required_error: "Назва обов'язкова",
      },
      description: {
        placeholder: "Опишіть вашу автоматизацію.",
      },
      submit_button: {
        create: "Створити автоматизацію",
        update: "Оновити автоматизацію",
      },
    },
    delete_modal: {
      heading: "Видалити автоматизацію",
    },
    activity: {
      filters: {
        show_fails: "Показати помилки",
        all: "Всі",
        only_activity: "Тільки активність",
        only_run_history: "Тільки історія запусків",
      },
      run_history: {
        initiator: "Ініціатор",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Успішно!",
          message: "Автоматизація успішно створена.",
        },
        error: {
          title: "Помилка!",
          message: "Не вдалося створити автоматизацію.",
        },
      },
      update: {
        success: {
          title: "Успішно!",
          message: "Автоматизація успішно оновлена.",
        },
        error: {
          title: "Помилка!",
          message: "Не вдалося оновити автоматизацію.",
        },
      },
      enable: {
        success: {
          title: "Успішно!",
          message: "Автоматизація успішно увімкнена.",
        },
        error: {
          title: "Помилка!",
          message: "Не вдалося увімкнути автоматизацію.",
        },
      },
      disable: {
        success: {
          title: "Успішно!",
          message: "Автоматизація успішно вимкнена.",
        },
        error: {
          title: "Помилка!",
          message: "Не вдалося вимкнути автоматизацію.",
        },
      },
      delete: {
        success: {
          title: "Автоматизація видалена",
          message: "{name}, автоматизація, тепер видалена з вашого проекту.",
        },
        error: {
          title: "Не вдалося видалити цю автоматизацію цього разу.",
          message:
            "Спробуйте видалити її знову або поверніться до неї пізніше. Якщо не вдається видалити, зверніться до нас.",
        },
      },
      action: {
        create: {
          error: {
            title: "Помилка!",
            message: "Не вдалося створити дію. Будь ласка, спробуйте ще раз!",
          },
        },
        update: {
          error: {
            title: "Помилка!",
            message: "Не вдалося оновити дію. Будь ласка, спробуйте ще раз!",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "Поки що немає автоматизацій для показу.",
        description:
          "Автоматизації допомагають усунути повторювані завдання шляхом налаштування тригерів, умов та дій. Створіть одну, щоб заощадити час і підтримувати роботу без зусиль.",
      },
      upgrade: {
        title: "Автоматизації",
        description: "Автоматизації - це спосіб автоматизувати завдання у вашому проекті.",
        sub_description: "Поверніть 80% свого адміністративного часу, коли використовуєте автоматизації.",
      },
    },
  },
  sso: {
    header: "Ідентичність",
    description: "Налаштуйте свій домен для доступу до функцій безпеки, включаючи єдиний вхід.",
    domain_management: {
      header: "Управління доменами",
      verified_domains: {
        header: "Перевірені домени",
        description: "Перевірте право власності на домен електронної пошти, щоб увімкнути єдиний вхід.",
        button_text: "Додати домен",
        list: {
          domain_name: "Назва домену",
          status: "Статус",
          status_verified: "Перевірено",
          status_failed: "Не вдалося",
          status_pending: "Очікує",
        },
        add_domain: {
          title: "Додати домен",
          description: "Додайте свій домен для налаштування SSO та його перевірки.",
          form: {
            domain_label: "Домен",
            domain_placeholder: "plane.so",
            domain_required: "Домен обов&apos;язковий",
            domain_invalid: "Введіть дійсну назву домену (напр. plane.so)",
          },
          primary_button_text: "Додати домен",
          primary_button_loading_text: "Додавання",
          toast: {
            success_title: "Успіх!",
            success_message: "Домен успішно додано. Будь ласка, перевірте його, додавши запис DNS TXT.",
            error_message: "Не вдалося додати домен. Будь ласка, спробуйте ще раз.",
          },
        },
        verify_domain: {
          title: "Перевірте свій домен",
          description: "Виконайте ці кроки, щоб перевірити свій домен.",
          instructions: {
            label: "Інструкції",
            step_1: "Перейдіть до налаштувань DNS для вашого хостинг-провайдера домену.",
            step_2: {
              part_1: "Створіть",
              part_2: "запис TXT",
              part_3: "та вставте повне значення запису, вказане нижче.",
            },
            step_3: "Це оновлення зазвичай займає кілька хвилин, але може зайняти до 72 годин.",
            step_4: 'Натисніть "Перевірити домен", щоб підтвердити після оновлення запису DNS.',
          },
          verification_code_label: "Значення запису TXT",
          verification_code_description: "Додайте цей запис до налаштувань DNS",
          domain_label: "Домен",
          primary_button_text: "Перевірити домен",
          primary_button_loading_text: "Перевірка",
          secondary_button_text: "Зроблю це пізніше",
          toast: {
            success_title: "Успіх!",
            success_message: "Домен успішно перевірено.",
            error_message: "Не вдалося перевірити домен. Будь ласка, спробуйте ще раз.",
          },
        },
        delete_domain: {
          title: "Видалити домен",
          description: {
            prefix: "Ви впевнені, що хочете видалити",
            suffix: "? Цю дію неможливо скасувати.",
          },
          primary_button_text: "Видалити",
          primary_button_loading_text: "Видалення",
          secondary_button_text: "Скасувати",
          toast: {
            success_title: "Успіх!",
            success_message: "Домен успішно видалено.",
            error_message: "Не вдалося видалити домен. Будь ласка, спробуйте ще раз.",
          },
        },
      },
    },
    providers: {
      header: "Єдиний вхід",
      disabled_message: "Додайте перевірений домен для налаштування SSO",
      configure: {
        create: "Налаштувати",
        update: "Редагувати",
      },
      switch_alert_modal: {
        title: "Перемкнути метод SSO на {newProviderShortName}?",
        content:
          "Ви збираєтеся увімкнути {newProviderLongName} ({newProviderShortName}). Ця дія автоматично вимкне {activeProviderLongName} ({activeProviderShortName}). Користувачі, які намагаються увійти через {activeProviderShortName}, більше не зможуть отримати доступ до платформи, поки не перемкнуться на новий метод. Ви впевнені, що хочете продовжити?",
        primary_button_text: "Перемкнути",
        primary_button_text_loading: "Перемикання",
        secondary_button_text: "Скасувати",
      },
      form_section: {
        title: "Деталі, надані IdP для {workspaceName}",
      },
      form_action_buttons: {
        saving: "Збереження",
        save_changes: "Зберегти зміни",
        configure_only: "Тільки налаштування",
        configure_and_enable: "Налаштувати та увімкнути",
        default: "Зберегти",
      },
      setup_details_section: {
        title: "{workspaceName} деталі, надані для вашого IdP",
        button_text: "Отримати деталі налаштування",
      },
      saml: {
        header: "Увімкнути SAML",
        description: "Налаштуйте свого постачальника ідентичності SAML для ввімкнення єдиного входу.",
        configure: {
          title: "Увімкнути SAML",
          description:
            "Перевірте право власності на домен електронної пошти для доступу до функцій безпеки, включаючи єдиний вхід.",
          toast: {
            success_title: "Успіх!",
            create_success_message: "Постачальник SAML успішно створено.",
            update_success_message: "Постачальник SAML успішно оновлено.",
            error_title: "Помилка!",
            error_message: "Не вдалося зберегти постачальника SAML. Будь ласка, спробуйте ще раз.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Веб-деталі",
            entity_id: {
              label: "ID сутності | Аудиторія | Інформація про метадані",
              description:
                "Ми згенеруємо цю частину метаданих, яка ідентифікує цю програму Plane як авторизований сервіс у вашому IdP.",
            },
            callback_url: {
              label: "URL єдиного входу",
              description: "Ми згенеруємо це для вас. Додайте це в поле URL перенаправлення входу вашого IdP.",
            },
            logout_url: {
              label: "URL єдиного виходу",
              description: "Ми згенеруємо це для вас. Додайте це в поле URL перенаправлення єдиного виходу вашого IdP.",
            },
          },
          mobile_details: {
            header: "Мобільні деталі",
            entity_id: {
              label: "ID сутності | Аудиторія | Інформація про метадані",
              description:
                "Ми згенеруємо цю частину метаданих, яка ідентифікує цю програму Plane як авторизований сервіс у вашому IdP.",
            },
            callback_url: {
              label: "URL єдиного входу",
              description: "Ми згенеруємо це для вас. Додайте це в поле URL перенаправлення входу вашого IdP.",
            },
            logout_url: {
              label: "URL єдиного виходу",
              description: "Ми згенеруємо це для вас. Додайте це в поле URL перенаправлення виходу вашого IdP.",
            },
          },
          mapping_table: {
            header: "Деталі відображення",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "Увімкнути OIDC",
        description: "Налаштуйте свого постачальника ідентичності OIDC для ввімкнення єдиного входу.",
        configure: {
          title: "Увімкнути OIDC",
          description:
            "Перевірте право власності на домен електронної пошти для доступу до функцій безпеки, включаючи єдиний вхід.",
          toast: {
            success_title: "Успіх!",
            create_success_message: "Постачальник OIDC успішно створено.",
            update_success_message: "Постачальник OIDC успішно оновлено.",
            error_title: "Помилка!",
            error_message: "Не вдалося зберегти постачальника OIDC. Будь ласка, спробуйте ще раз.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Веб-деталі",
            origin_url: {
              label: "URL джерела",
              description:
                "Ми згенеруємо це для цієї програми Plane. Додайте це як надійне джерело у відповідне поле вашого IdP.",
            },
            callback_url: {
              label: "URL перенаправлення",
              description: "Ми згенеруємо це для вас. Додайте це в поле URL перенаправлення входу вашого IdP.",
            },
            logout_url: {
              label: "URL виходу",
              description: "Ми згенеруємо це для вас. Додайте це в поле URL перенаправлення виходу вашого IdP.",
            },
          },
          mobile_details: {
            header: "Мобільні деталі",
            origin_url: {
              label: "URL джерела",
              description:
                "Ми згенеруємо це для цієї програми Plane. Додайте це як надійне джерело у відповідне поле вашого IdP.",
            },
            callback_url: {
              label: "URL перенаправлення",
              description: "Ми згенеруємо це для вас. Додайте це в поле URL перенаправлення входу вашого IdP.",
            },
            logout_url: {
              label: "URL виходу",
              description: "Ми згенеруємо це для вас. Додайте це в поле URL перенаправлення виходу вашого IdP.",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "Назва проєкту не може містити спеціальні символи.",
  pql: {
    functions: {
      date: {
        now: {
          description: "Поточна дата та час",
        },
        today: {
          description: "Сьогоднішня дата",
        },
        start_of_day: {
          description: "Початок сьогодні",
        },
        end_of_day: {
          description: "Кінець сьогодні",
        },
        start_of_week: {
          description: "Початок поточного тижня",
        },
        end_of_week: {
          description: "Кінець поточного тижня",
        },
        start_of_month: {
          description: "Початок поточного місяця",
        },
        end_of_month: {
          description: "Кінець поточного місяця",
        },
        start_of_year: {
          description: "Початок поточного року",
        },
        end_of_year: {
          description: "Кінець поточного року",
        },
        days_ago: {
          description: "Дата n днів тому",
        },
        days_from_now: {
          description: "Дата через n днів",
        },
        weeks_ago: {
          description: "Дата n тижнів тому",
        },
        weeks_from_now: {
          description: "Дата через n тижнів",
        },
        months_ago: {
          description: "Дата n місяців тому",
        },
        months_from_now: {
          description: "Дата через n місяців",
        },
      },
      user: {
        current_user: {
          description: "Поточний авторизований користувач",
        },
        members_of: {
          description: 'Учасники "project:<id>" або "teamspace:<id>"',
        },
        workspace_members: {
          description: "Усі учасники робочого простору",
        },
      },
      cycle: {
        active_cycle: {
          description: "Активний цикл сьогодні",
        },
        completed_cycles: {
          description: "Цикли, дата закінчення яких минула",
        },
        upcoming_cycles: {
          description: "Цикли, дата початку яких у майбутньому",
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
          description: "Термін виконання минув І стан відкритий",
        },
        has_no_assignee: {
          description: "Робочий елемент не має виконавця",
        },
        has_no_label: {
          description: "Робочий елемент не має міток",
        },
        is_top_level: {
          description: "Не є підробочим елементом (немає батьківського)",
        },
        is_sub_work_item: {
          description: "Є підробочим елементом (має батьківський)",
        },
        is_epic: {
          description: "Епік",
        },
        is_intake: {
          description: "Є вхідним робочим елементом",
        },
        is_draft: {
          description: "Є чернеткою робочого елемента",
        },
        is_archived: {
          description: "Заархівовано",
        },
        has_children: {
          description: "Має принаймні один підробочий елемент",
        },
        has_start_and_due_dates: {
          description: "Має дату початку та дату завершення",
        },
      },
      relation: {
        linked_to: {
          description: "Робочі елементи, пов'язані з даним елементом",
        },
        blocked_by: {
          description: "Робочі елементи, заблоковані даним елементом",
        },
        blocks: {
          description: "Робочі елементи, що блокують даний елемент",
        },
        child_of: {
          description: "Підробочі елементи даного елемента",
        },
        parent_of: {
          description: "Батьківський робочий елемент даного елемента",
        },
        duplicate_of: {
          description: "Робочі елементи, позначені як дублікати даного елемента",
        },
      },
      history: {
        was_ever: {
          description: "Поле колись мало це значення",
        },
        was: {
          description: "Поле раніше мало це значення (змінено)",
        },
        changed_from: {
          description: "Поле було змінено з цього значення",
        },
        changed_to: {
          description: "Поле було змінено на це значення",
        },
        changed: {
          description: "Поле було змінено",
        },
        updated_by: {
          description: "Робочий елемент оновлено цим користувачем",
        },
        commented_by: {
          description: "Робочий елемент прокоментовано цим користувачем",
        },
        field_changed_by: {
          description: "Поле змінено цим користувачем",
        },
        was_assigned_to: {
          description: "Робочий елемент призначено цьому користувачеві",
        },
        changed_after: {
          description: "Поле змінено після цієї дати",
        },
        changed_before: {
          description: "Поле змінено до цієї дати",
        },
        field_changed_after: {
          description: "Поле змінено після цієї дати",
        },
        field_changed_before: {
          description: "Поле змінено до цієї дати",
        },
        changed_to_after: {
          description: "Поле змінено на це значення після цієї дати",
        },
        changed_to_before: {
          description: "Поле змінено на це значення до цієї дати",
        },
        field_changed_between: {
          description: "Поле змінено між цими датами",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "навігація",
      accept: "прийняти",
      close: "закрити",
      pick_date: "Вибрати дату",
    },
    placeholder: 'Введіть запит і натисніть "ENTER" для фільтрації...',
    error: "Помилка при надсиланні запиту. Перевірте та спробуйте ще раз.",
  },
  releases: {
    releases: "Релізи",
    release: "Реліз",
    no_release: "Немає релізу",
    select_releases: "Вибрати релізи",
    count_releases: "{count, plural, one {# реліз} other {# релізи}}",
    actions: {
      delete: "Видалити",
    },
    delete_modal: {
      title: "Видалити реліз",
      content: 'Ви впевнені, що хочете видалити реліз "{releaseName}"? Цю дію неможливо скасувати.',
    },
    settings: {
      heading: {
        title: "Релізи",
        description: "Керуйте поставками проєкту з точністю за допомогою релізів.",
      },
      toggle: {
        title: "Увімкнути релізи",
        description: "Учасники робочого простору матимуть доступ лише для перегляду в межах своїх проєктів.",
      },
      toasts: {
        enable: {
          loading: "Увімкнення релізів...",
          success: {
            title: "Релізи увімкнено",
            message: "Релізи було увімкнено для цього робочого простору.",
          },
          error: {
            title: "Помилка",
            message: "Не вдалося увімкнути релізи. Будь ласка, спробуйте ще раз.",
          },
        },
        disable: {
          loading: "Вимкнення релізів...",
          success: {
            title: "Релізи вимкнено",
            message: "Релізи було вимкнено для цього робочого простору.",
          },
          error: {
            title: "Помилка",
            message: "Не вдалося вимкнути релізи. Будь ласка, спробуйте ще раз.",
          },
        },
      },
      tabs: {
        tags: "Теги релізів",
        labels: "Мітки",
      },
      tags: {
        title: "Теги релізів",
        description: "Категоризуйте та фільтруйте свої релізи за допомогою тегів.",
        add: "Додати тег",
        empty_state: "Тегів ще немає. Створіть свій перший тег.",
        errors: {
          version_required: "Версія обов’язкова.",
          version_already_exists: "Тег із цією версією вже існує.",
          generic: "Щось пішло не так. Будь ласка, спробуйте ще раз.",
        },
        delete_modal: {
          title: "Видалити тег",
          content: 'Ви впевнені, що хочете видалити тег "{tagVersion}"? Цю дію неможливо скасувати.',
        },
        actions: {
          edit: "Редагувати тег",
          delete: "Видалити тег",
        },
        toasts: {
          delete: {
            success: "Тег успішно видалено.",
            error: "Не вдалося видалити тег. Будь ласка, спробуйте ще раз.",
          },
        },
      },
      labels: {
        title: "Мітки",
        description: "Структуруйте й організовуйте свої ініціативи за допомогою міток.",
        add: "Додати мітку",
        empty_state: "Міток ще немає. Створіть свою першу мітку.",
        errors: {
          name_required: "Назва обов’язкова.",
          name_already_exists: "Мітка з такою назвою вже існує.",
          generic: "Щось пішло не так. Будь ласка, спробуйте ще раз.",
        },
        modal: {
          name_placeholder: "Назва мітки",
          pick_color: "Виберіть колір мітки",
        },
        actions: {
          edit: "Редагувати мітку",
          delete: "Видалити мітку",
        },
        drag_to_reorder: "Перетягніть, щоб змінити порядок",
        delete_modal: {
          title: "Видалити мітку",
          content: 'Ви впевнені, що хочете видалити мітку "{labelName}"? Цю дію неможливо скасувати.',
        },
        toasts: {
          delete: {
            success: "Мітку успішно видалено.",
            error: "Не вдалося видалити мітку. Будь ласка, спробуйте ще раз.",
          },
        },
      },
    },
  },
} as const;
