# План: почтовый клиент «Gizmo Mail» в apps/web (полная замена текущего)

## Context

В репозитории сейчас НЕТ пользовательского почтового клиента. То, что добавлено недавними коммитами «add mail ui» — это админ-панель (`apps/admin/.../mail`) для **провижининга** виртуальных ящиков/алиасов на self-hosted mail-стеке (Postfix/Dovecot/Rspamd/Roundcube), плюс вкладка «Webmail», встраивающая Roundcube. Дизайн в `.design/Gizmo.dc.html` описывает полноценный десктопный почтовый клиент: вход, входящие, папки (помеченные/отправленные/черновики/архив/спам/корзина), просмотр письма, написание, поиск с фильтрами, настройки (8 вкладок).

Цель — реализовать этот клиент как новый верхнеуровневый раздел `/mail` в `apps/web` и подключить его к реальной почте (чтение по IMAP из Dovecot, отправка по SMTP через Postfix). Roundcube/админ-провижининг ящиков остаётся как есть — мы его НЕ трогаем; «замена» относится к замене Roundcube-вебмейла собственным клиентом.

### Зафиксированные решения
- **Размещение:** верхнеуровневый маршрут `/mail` со своим сайдбаром (как в макете), вне workspace-контекста. Ящики — уровня инстанса.
- **Доступ к IMAP:** Dovecot **master user** (служебный аккаунт логинится в любой ящик формой `email*master`). Храним только хеш пароля ящика, поэтому master-user — единственный чистый путь.
- **AI-функции:** НЕ делаем на этой итерации. Из экранов убираем: AI-сводку во входящих, чип «Написать с AI», AI-панель генерации/тона/улучшения в «Написать», тумблер «Подсказки Gizmo AI» в настройках, AI-фичи в маркетинг-колонке логина. **Шаблоны и быстрые ответы (статические чипы) остаются** — они не AI.
- **Язык:** интерфейс на русском через `@plane/i18n` (+ англ. ключи).

---

## Архитектура: бэкенд (apps/api)

Дизайн «live-IMAP» — без локального зеркала писем в БД. Все пути под `apps/api/plane/`.

### Зависимости
- Добавить `IMAPClient==3.0.1` в `requirements/base.txt` (парсит ENVELOPE/BODYSTRUCTURE, UID-методы, move/copy/append, custom ssl_context). MIME разбираем stdlib `email` (`policy.default`). `nh3` уже есть — используем для санитизации HTML.
- Отправка — `EmailMultiAlternatives` + `get_connection(...)` (зеркалим `plane/bgtasks/email_notification_task.py`), плюс APPEND отправленного в папку Sent по IMAP.

### Сервисный слой — новый пакет `plane/mail/`
```
plane/mail/
  client.py     # MailClient(mailbox): фасад для вьюх/задач
  imap.py       # IMAP-сессия (imapclient) + master-user login, ssl_context, таймауты
  smtp.py       # сборка/отправка письма, APPEND в Sent
  folders.py    # маппинг special-use <-> ключи дизайна + рус. подписи (через LIST SPECIAL-USE, без хардкода имён)
  mime.py       # парсинг fetched-байтов -> headers/text/html/attachments + санитизация nh3
  resolver.py   # request.user -> Mailbox (+ mixin ResolveMailbox)
  conf.py       # чтение MAIL_* конфигурации
  exceptions.py
```
**Маппинг папок** (резолвим через `LIST (SPECIAL-USE)`): Входящие=`\Inbox`, Отправленные=`\Sent`, Черновики=`\Drafts`, Спам=`\Junk`, Корзина=`\Trash`, Архив=`\Archive` (новая, см. ниже), Помеченные = **виртуальный** `SEARCH KEYWORD \Flagged` (не папка, не цель move).

**MailClient методы:** `list_folders`, `list_messages(folder,page,filters)`, `get_message`, `send`, `save_draft`, `set_flags`, `move`, `copy`, `delete(permanent?)`, `search`, `attachment`.

### Изменения mail-стека (`mail-stack/dovecot/`)
- `dovecot.conf.tmpl`: добавить в `namespace inbox` папку `Archive { special_use = \Archive; auto = subscribe }`; добавить master passdb (`driver=passwd-file; master=yes; args=/etc/dovecot/dovecot-master.passwd`) и `auth_master_user_separator = *`.
- `entrypoint.sh`: шаблонизировать `dovecot-master.passwd` из `MAIL_MASTER_USER`/`MAIL_MASTER_PASSWORD` (хеш через существующий `hash_mail_password`).
- Существующие ящики получат Archive лениво при первом логине (`auto=subscribe`) — миграция данных не нужна.

### Новые Django-модели (`plane/mail/models/*`, миграция `0003`)
Все наследуют `BaseModel`, FK на `Mailbox` (+ к `User` где нужно). `db_table` с префиксом `mail_`.
- `MailSignature` (подписи): mailbox, name, content_html, content_text, is_default, is_active.
- `MailTemplate` (Шаблоны): mailbox, name, subject, body_html, body_text, category.
- `MailFilterRule` (Фильтры, в БД; Sieve — на будущее): mailbox, name, is_active, order, match_type, conditions JSON, actions JSON.
- `MailLabel` (ярлыки): mailbox, name, color. Членство письма в ярлыке = IMAP keyword (custom flag), не строка в БД.
- `MailSavedSearch` (сохранённые поиски): mailbox, name, query, filters JSON.
- `MailForwarding` (Пересылка + автоответ, OneToOne): forward_enabled/forward_to/keep_copy, vacation_enabled/subject/message/start/end.
- `MailPreference` (Настройки→Общие/Внешний вид, OneToOne): density, theme, reading_pane, messages_per_page, mark_read_delay_ms, show_snippets, default_signature FK, language, conversation_view.
- В `Mailbox` добавить nullable `owner = FK(User, on_delete=SET_NULL, related_name="mailboxes")` для явной привязки.

### REST-эндпоинты (под `/api/mail/`)
Файлы: `plane/app/views/mail.py`, `plane/app/serializers/mail.py`, `plane/app/urls/mail.py` (+ подключить в `plane/app/urls/__init__.py`). Аутентификация — наследуемая `[IsAuthenticated]` + `BaseSessionAuthentication` (cookie-сессия). **Идентификатор ящика никогда не приходит от клиента** — резолвится из `request.user` миксином.

Live-IMAP: `GET config/me/`, `GET folders/`, `GET folders/{key}/messages/?page&filter`, `GET folders/{key}/messages/{uid}/`, `POST send/`, `POST|PUT drafts/`, `POST .../{uid}/flags/`, `POST messages/move/`, `POST messages/delete/`, `GET search/`, `GET .../attachments/{part_id}/` (stream через FileResponse), `POST attachments/upload/` (S3Storage, лимит размера).
CRUD (BaseViewSet, queryset скоупится резолвнутым ящиком): `signatures/`, `templates/`, `filters/`, `labels/`, `saved-searches/`, singleton `forwarding/`, `preferences/`.

### Резолюция пользователь→ящик (`resolver.py`)
Порядок: `owner=request.user` → `Mailbox.email__iexact == request.user.email` (User.save() уже лоуэркейсит email) → нет ящика. При отсутствии — `config/me` отдаёт `{has_mailbox:false}` (200), остальные эндпоинты 403/409 до любого IMAP-вызова.

### Безопасность
- Master-кред используется ТОЛЬКО в форме `<resolved_mailbox>*master`, никогда с произвольным именем из ввода.
- `dst_folder` в move — только из whitelist special-use ключей (без traversal).
- part_id вложения валидируется против BODYSTRUCTURE этого uid.
- HTML письма — обязательная санитизация `nh3` (скрипты/обработчики/`javascript:`/remote frames вырезаются, `cid:`/remote-картинки блокируются по умолчанию).
- master-пароль — `is_encrypted` в InstanceConfiguration, как `EMAIL_HOST_PASSWORD`; не логировать.

### Конфигурация (`plane/license/utils/instance_value.py`)
Добавить `get_mail_configuration()` по образцу `get_email_configuration()`: `MAIL_IMAP_HOST` (default `dovecot`), `MAIL_IMAP_PORT` (993), `MAIL_IMAP_USE_SSL`, `MAIL_IMAP_STARTTLS`, `MAIL_IMAP_VERIFY_SSL` (off в dev → self-signed), `MAIL_IMAP_TIMEOUT` (15), `MAIL_SMTP_HOST` (postfix), `MAIL_SMTP_PORT` (587), `MAIL_MASTER_USER`, `MAIL_MASTER_PASSWORD` (encrypted), `MAIL_MASTER_SEPARATOR` (*), `MAIL_MAX_ATTACHMENT_BYTES` (25MB). `plane/mail/conf.py` — типизированные аксессоры; вьюхи/задачи не читают `os.environ` напрямую.

### Производительность
- Синхронно (одно IMAP-соединение на запрос, открыть в миксине, закрыть в `finalize_response`): folders, list, detail, flags, move/delete, search, draft, attachment.
- Отправка: Celery `@shared_task` в `plane/bgtasks/mail_send_task.py` (брокер RabbitMQ), оптимистичный UI; everything else — sync.
- Пагинация IMAP: `UID SEARCH`/`SORT` → срез uid в приложении → FETCH только среза. Document cost.
- Кеш unread-счётчиков и storage в Redis (TTL ~30-60с), инвалидация при flag/move/send. Тела писем не кешируем.
- На будущее (НЕ сейчас): локальный индекс `mail_message_index` с IDLE/poll-синхронизацией и UIDVALIDITY.

---

## Архитектура: фронтенд (apps/web)

### Маршрутизация (`apps/web/app/routes/core.ts`)
Новая верхнеуровневая группа со своим layout (свой сайдбар, без project-сайдбара):
```
layout("./(all)/(mail)/layout.tsx", [
  route("mail",                    "./(all)/(mail)/page.tsx"),            // редирект → inbox
  route("mail/login",              "./(all)/(mail)/login/page.tsx"),
  route("mail/:folderKey",         "./(all)/(mail)/[folderKey]/page.tsx"),// inbox/starred/sent/...
  route("mail/:folderKey/:uid",    "./(all)/(mail)/[folderKey]/[uid]/page.tsx"),
  route("mail/search",             "./(all)/(mail)/search/page.tsx"),
  route("mail/settings",           "./(all)/(mail)/settings/page.tsx"),   // вкладки через ?tab=
])
```
Compose — модалка поверх любого экрана (state в сторе), как в дизайне (overlay).

### Стор (MobX) + сервис + хуки
- `apps/web/core/services/mail.service.ts` — `MailService extends APIService`, методы под эндпоинты выше (паттерн как `cycle.service.ts`).
- `apps/web/core/store/mail/` — `mail.store.ts` (folders, messageMap по folder, выбранное письмо, loaders, фильтры, пагинация, поиск), + подсторы для compose-черновика и settings-данных (signatures/templates/filters/labels/forwarding/preferences). Зарегистрировать в `core/store/root.store.ts`.
- `apps/web/core/hooks/store/use-mail.ts` (паттерн `use-cycle.ts`).
- Типы: `packages/types/src/mail/*` (TMailFolder, TMailMessageSummary, TMailMessageDetail, TMailAttachment, TMailSignature, TMailTemplate, TMailFilterRule, TMailLabel, TMailSavedSearch, TMailForwarding, TMailPreference, TMailComposePayload), экспорт из `packages/types/src/index.ts`.
- Сервис-класс также добавить в `packages/services/src/mail/mail.service.ts` (рядом с `instance/mailbox.service.ts`) если предпочтительнее общий пакет; иначе web-локальный сервис. **Решение: web-локальный** `apps/web/core/services/mail.service.ts` (фича только в web).

### Компоненты (`apps/web/core/components/mail/`)
kebab-case файлы, PascalCase экспорты, `observer(...)`. Состав по экранам дизайна:
- `mail-sidebar.tsx` — папки с бэйджами, ярлыки, кнопка «Написать», storage-бар, карточка аккаунта (порт `GizmoSidebar.dc.html`).
- `mail-shell.tsx`/layout — рамка приложения + top-bar.
- Список: `message-list.tsx`, `message-row.tsx`, заголовок списка с поиском/чипами фильтров.
- Чтение: `message-view.tsx` (toolbar действий, заголовок, метаданные отправителя, санитизированное тело, вложения), `reply-bar.tsx` (статические быстрые ответы + поле ответа). Баннеры для спама/корзины, футер-действия по папкам.
- Написание: `compose-modal.tsx` (поля От/Кому/Копия/Тема, тулбар форматирования, тело, вложения, футер отправки) + правая панель — **только Шаблоны** (AI-части убраны).
- Поиск: `search-view.tsx` (строка запроса, чипы фильтров, левая колонка фасетов, сгруппированные результаты Сегодня/Ранее, подсветка совпадений).
- Настройки: `settings/` — вкладки `account`, `signature`, `folders` (папки+ярлыки), `filters`, `templates`, `forwarding`, `security`, `appearance` (без вкладки/тумблеров AI).
- Логин: `mail-login.tsx` (две колонки; маркетинг-фичи без AI-пунктов).
- Общее: пустые состояния, скелетоны (паттерн `Loader`), тост-фидбек (`@plane/propel/toast`).

### Тема и шрифты (изолированно для раздела)
Палитра макета (бежевый `#FBFAF7`/`#E4E1D9`, акцент `#C24E2C`, тёмный `#201E1A`) не совпадает с дизайн-токенами Plane. Скоупим тему к разделу:
- `apps/web/styles/mail.css` — CSS-переменные мэйла под `[data-mail]`, подключить в `(mail)/layout.tsx`; корневой контейнер раздела получает `data-mail` и шрифты.
- Google Fonts (Hanken Grotesk, Schibsted Grotesk, JetBrains Mono) — через `<link rel="preconnect">`/`@import` в `mail.css` (как в макете) либо self-host; решаем при реализации (по умолчанию — link в layout).
- Цвета задаём mail-переменными/`bg-[#...]` инлайн там, где быстрее; общие компоненты `@plane/propel`/`@plane/ui` используем где они вписываются (Button, Dialog, ToggleSwitch, Tooltip, Loader), кастомные пиксель-в-пиксель элементы верстаем напрямую под макет.
- Иконки: `lucide-react` (Mail, Search, Send, Archive, Trash2, Star, Reply, Forward, Paperclip, Sparkles→не нужен, и т.д.); сложные SVG из макета при необходимости переносим как локальные иконки.

### Навигация в основном приложении
Добавить вход в `/mail` из глобального меню/командной палитры (точку входа уточнить при реализации — пункт в воркспейс-сайдбаре или в app-switcher). Сам раздел — полноэкранный со своим сайдбаром.

### i18n
`packages/i18n/src/locales/{ru,en}/` — namespace `mail.*` (folders, list, message, compose, search, settings.*, login). Компоненты используют `useTranslation()` (`t("mail.compose.send")`). Русский — основной.

---

## Последовательность реализации (милстоуны)

Хотя цель — все экраны, строим инкрементально и проверяемо:

1. **Бэкенд-фундамент:** `IMAPClient` в requirements; mail-стек (Archive + master passdb); `plane/mail/` сервисный слой (imap/smtp/folders/mime/resolver/conf); `get_mail_configuration`; `Mailbox.owner` + миграция; эндпоинты `config/me`, `folders`, `messages list`, `message detail`. Smoke-тест через curl/Django shell.
2. **Фронтенд-каркас:** маршруты `(mail)`, layout+тема+шрифты, сайдбар, стор/сервис/хуки/типы, экран входящих со списком и просмотром письма на реальных данных.
3. **Действия с письмами:** flags (прочитано/звезда), move (архив/спам/корзина/восстановить), delete; папки starred/sent/drafts/archive/spam/trash с их баннерами/футерами.
4. **Написание:** эндпоинты send/draft/attachments; compose-модалка, ответ/пересылка, вложения, панель шаблонов.
5. **Поиск:** эндпоинт search + экран поиска с фильтрами/фасетами/подсветкой; сохранённые поиски.
6. **Настройки:** модели+CRUD+вкладки (account, signature, folders/labels, filters, templates, forwarding, security, appearance).
7. **Логин-экран**, пустые состояния, локализация, полировка, верификация.

---

## Ключевые файлы

**Бэкенд (новое/правки):**
- `apps/api/plane/mail/{client,imap,smtp,folders,mime,resolver,conf,exceptions}.py` (новые)
- `apps/api/plane/mail/models/{signature,template,filter_rule,label,saved_search,forwarding,preferences}.py` + `models/__init__.py`, `mailbox.py` (owner FK)
- `apps/api/plane/mail/migrations/0003_*.py`
- `apps/api/plane/app/views/mail.py`, `serializers/mail.py`, `urls/mail.py` (+ `urls/__init__.py`)
- `apps/api/plane/bgtasks/mail_send_task.py`
- `apps/api/plane/license/utils/instance_value.py` (`get_mail_configuration`)
- `apps/api/requirements/base.txt` (IMAPClient)
- `mail-stack/dovecot/dovecot.conf.tmpl`, `mail-stack/dovecot/entrypoint.sh`, `mail-stack/.env.example`

**Фронтенд (новое/правки):**
- `apps/web/app/routes/core.ts` (маршруты)
- `apps/web/app/(all)/(mail)/...` (layout + page-файлы)
- `apps/web/core/services/mail.service.ts`
- `apps/web/core/store/mail/*` + `core/store/root.store.ts`
- `apps/web/core/hooks/store/use-mail.ts`
- `apps/web/core/components/mail/*`
- `apps/web/styles/mail.css`
- `packages/types/src/mail/*` + `index.ts`
- `packages/i18n/src/locales/{ru,en}/` (mail namespace)

**Опоры (reuse):** `plane/app/views/base.py` (BaseViewSet/BaseAPIView), `plane/bgtasks/email_notification_task.py` (SMTP-паттерн), `plane/utils/content_validator.py` (nh3), `apps/web/core/store/cycle.store.ts` + `services/cycle.service.ts` + `hooks/store/use-cycle.ts` (паттерны), `apps/admin/.../mail/page.tsx` (стиль/тосты).

---

## Верификация

- **Бэкенд:** поднять mail-стек локально (`MAIL_LOCAL=true`), создать тестовый ящик через админку, настроить master-user; через Django shell вызвать `MailClient`: список папок, список INBOX, отправка письма самому себе → проверить появление в Sent и INBOX; move в Archive/Trash; search по кириллице. Unit-тесты на `folders.py` (маппинг), `mime.py` (парсинг+санитизация), `resolver.py`.
- **Эндпоинты:** curl с сессионной cookie на `config/me`, `folders`, `messages`, `send`; проверить 403 при отсутствии ящика; проверить отказ на произвольный dst_folder/part_id.
- **Фронтенд (skill `run`/`verify`):** запустить web-приложение, открыть `/mail`, проверить: список входящих с реальными письмами, открытие письма (санитизированный HTML, вложения скачиваются), прочитано/звезда, перемещение в папки, написание+отправка (письмо доходит и попадает в Sent), поиск с фильтрами, все вкладки настроек сохраняют данные, логин-экран, локализация RU. Сверить пиксельно с `.design` (фон/акцент/шрифты/радиусы).
- **Регрессия:** убедиться, что админ-провижининг ящиков и Roundcube не сломаны (мы их не меняли, кроме dovecot.conf — проверить, что обычный логин ящика по-прежнему работает после добавления master passdb).
