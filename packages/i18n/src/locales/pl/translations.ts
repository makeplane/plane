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
      "Pracujemy nad tym. Jeśli potrzebujesz natychmiastowej pomocy,",
    reach_out_to_us: "skontaktuj się z nami",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our:
      "W przeciwnym razie spróbuj od czasu do czasu odświeżyć stronę lub odwiedź naszą",
    status_page: "stronę statusu",
  },
  sidebar: {
    projects: "Projekty",
    pages: "Strony",
    new_work_item: "Nowy element pracy",
    home: "Strona główna",
    your_work: "Twoja praca",
    inbox: "Skrzynka odbiorcza",
    workspace: "Przestrzeń robocza",
    views: "Widoki",
    analytics: "Analizy",
    work_items: "Elementy pracy",
    cycles: "Cykle",
    modules: "Moduły",
    intake: "Zgłoszenia",
    drafts: "Szkice",
    favorites: "Ulubione",
    pro: "Pro",
    upgrade: "Uaktualnij",
    pi_chat: "AI Czat",
    initiatives: "Inicjatywy",
    teamspaces: "Timspeisy",
    epics: "Epiki",
    upgrade_plan: "Apgrejduj plan",
    plane_pro: "Plejn Pro",
    business: "Biznes",
    customers: "Kastomerzy",
    recurring_work_items: "Elementy pracy cykliczne",
  },
  auth: {
    common: {
      email: {
        label: "E-mail",
        placeholder: "imię@firma.pl",
        errors: {
          required: "E-mail jest wymagany",
          invalid: "E-mail jest nieprawidłowy",
        },
      },
      password: {
        label: "Hasło",
        set_password: "Ustaw hasło",
        placeholder: "Wpisz hasło",
        confirm_password: {
          label: "Potwierdź hasło",
          placeholder: "Potwierdź hasło",
        },
        current_password: {
          label: "Obecne hasło",
        },
        new_password: {
          label: "Nowe hasło",
          placeholder: "Wpisz nowe hasło",
        },
        change_password: {
          label: {
            default: "Zmień hasło",
            submitting: "Trwa zmiana hasła",
          },
        },
        errors: {
          match: "Hasła nie pasują do siebie",
          empty: "Proszę wpisać swoje hasło",
          length: "Hasło musi mieć więcej niż 8 znaków",
          strength: {
            weak: "Hasło jest słabe",
            strong: "Hasło jest silne",
          },
        },
        submit: "Ustaw hasło",
        toast: {
          change_password: {
            success: {
              title: "Sukces!",
              message: "Hasło zostało pomyślnie zmienione.",
            },
            error: {
              title: "Błąd!",
              message: "Coś poszło nie tak. Spróbuj ponownie.",
            },
          },
        },
      },
      unique_code: {
        label: "Unikalny kod",
        placeholder: "123456",
        paste_code: "Wklej kod wysłany na Twój e-mail",
        requesting_new_code: "Żądanie nowego kodu",
        sending_code: "Wysyłanie kodu",
      },
      already_have_an_account: "Masz już konto?",
      login: "Zaloguj się",
      create_account: "Utwórz konto",
      new_to_plane: "Nowy w Plane?",
      back_to_sign_in: "Powrót do logowania",
      resend_in: "Wyślij ponownie za {seconds} sekund",
      sign_in_with_unique_code: "Zaloguj się za pomocą unikalnego kodu",
      forgot_password: "Zapomniałeś hasła?",
      username: {
        label: "Nazwa użytkownika",
        placeholder: "Wprowadź swoją nazwę użytkownika",
      },
    },
    sign_up: {
      header: {
        label: "Utwórz konto i zacznij zarządzać pracą ze swoim zespołem.",
        step: {
          email: {
            header: "Rejestracja",
            sub_header: "",
          },
          password: {
            header: "Rejestracja",
            sub_header: "Zarejestruj się, korzystając z kombinacji e-maila i hasła.",
          },
          unique_code: {
            header: "Rejestracja",
            sub_header: "Zarejestruj się, używając unikalnego kodu wysłanego na powyższy adres e-mail.",
          },
        },
      },
      errors: {
        password: {
          strength: "Użyj silniejszego hasła, aby kontynuować",
        },
      },
    },
    sign_in: {
      header: {
        label: "Zaloguj się i zacznij zarządzać pracą ze swoim zespołem.",
        step: {
          email: {
            header: "Zaloguj się lub zarejestruj",
            sub_header: "",
          },
          password: {
            header: "Zaloguj się lub zarejestruj",
            sub_header: "Użyj adresu e-mail i hasła, aby się zalogować.",
          },
          unique_code: {
            header: "Zaloguj się lub zarejestruj",
            sub_header: "Zaloguj się za pomocą unikalnego kodu wysłanego na powyższy adres e-mail.",
          },
        },
      },
    },
    forgot_password: {
      title: "Zresetuj swoje hasło",
      description: "Podaj zweryfikowany adres e-mail konta użytkownika, a wyślemy Ci link do resetowania hasła.",
      email_sent: "Wysłaliśmy link resetujący na Twój adres e-mail",
      send_reset_link: "Wyślij link do resetowania",
      errors: {
        smtp_not_enabled: "Administrator nie włączył SMTP, nie możemy wysłać linku do resetowania hasła",
      },
      toast: {
        success: {
          title: "E-mail wysłany",
          message:
            "Sprawdź skrzynkę pocztową, aby znaleźć link do resetowania hasła. Jeśli nie pojawi się w ciągu kilku minut, sprawdź folder spam.",
        },
        error: {
          title: "Błąd!",
          message: "Coś poszło nie tak. Spróbuj ponownie.",
        },
      },
    },
    reset_password: {
      title: "Ustaw nowe hasło",
      description: "Zabezpiecz swoje konto silnym hasłem",
    },
    set_password: {
      title: "Zabezpiecz swoje konto",
      description: "Ustawienie hasła pomoże Ci bezpiecznie się logować",
    },
    sign_out: {
      toast: {
        error: {
          title: "Błąd!",
          message: "Wylogowanie nie powiodło się. Spróbuj ponownie.",
        },
      },
    },
    ldap: {
      header: {
        label: "Kontynuuj z {ldapProviderName}",
        sub_header: "Wprowadź swoje dane logowania {ldapProviderName}",
      },
    },
  },
  submit: "Wyślij",
  cancel: "Anuluj",
  loading: "Ładowanie",
  error: "Błąd",
  success: "Sukces",
  warning: "Ostrzeżenie",
  info: "Informacja",
  close: "Zamknij",
  yes: "Tak",
  no: "Nie",
  ok: "OK",
  name: "Nazwa",
  description: "Opis",
  search: "Szukaj",
  add_member: "Dodaj członka",
  adding_members: "Dodawanie członków",
  remove_member: "Usuń członka",
  add_members: "Dodaj członków",
  adding_member: "Dodawanie członka",
  remove_members: "Usuń członków",
  add: "Dodaj",
  adding: "Dodawanie",
  remove: "Usuń",
  add_new: "Dodaj nowy",
  remove_selected: "Usuń wybrane",
  first_name: "Imię",
  last_name: "Nazwisko",
  email: "E-mail",
  display_name: "Nazwa wyświetlana",
  role: "Rola",
  timezone: "Strefa czasowa",
  avatar: "Zdjęcie profilowe",
  cover_image: "Obraz w tle",
  password: "Hasło",
  change_cover: "Zmień obraz w tle",
  language: "Język",
  saving: "Zapisywanie",
  save_changes: "Zapisz zmiany",
  deactivate_account: "Dezaktywuj konto",
  deactivate_account_description:
    "Po dezaktywacji konto i wszystkie zasoby z nim związane zostaną trwale usunięte i nie będzie można ich odzyskać.",
  profile_settings: "Ustawienia profilu",
  your_account: "Twoje konto",
  security: "Bezpieczeństwo",
  activity: "Aktywność",
  activity_empty_state: {
    no_activity: "Brak aktywności",
    no_transitions: "Brak przejść",
    no_comments: "Brak komentarzy",
    no_worklogs: "Brak dzienników pracy",
    no_history: "Brak historii",
  },
  appearance: "Wygląd",
  notifications: "Powiadomienia",
  workspaces: "Przestrzenie robocze",
  create_workspace: "Utwórz przestrzeń roboczą",
  invitations: "Zaproszenia",
  summary: "Podsumowanie",
  assigned: "Przypisane",
  created: "Utworzone",
  subscribed: "Subskrybowane",
  you_do_not_have_the_permission_to_access_this_page: "Nie masz uprawnień do wyświetlenia tej strony.",
  something_went_wrong_please_try_again: "Coś poszło nie tak. Spróbuj ponownie.",
  load_more: "Załaduj więcej",
  select_or_customize_your_interface_color_scheme: "Wybierz lub dostosuj schemat kolorów interfejsu.",
  select_the_cursor_motion_style_that_feels_right_for_you: "Wybierz styl ruchu kursora, który Ci odpowiada.",
  theme: "Motyw",
  smooth_cursor: "Płynny kursor",
  system_preference: "Preferencje systemowe",
  light: "Jasny",
  dark: "Ciemny",
  light_contrast: "Jasny wysoki kontrast",
  dark_contrast: "Ciemny wysoki kontrast",
  custom: "Motyw niestandardowy",
  select_your_theme: "Wybierz motyw",
  customize_your_theme: "Dostosuj motyw",
  background_color: "Kolor tła",
  text_color: "Kolor tekstu",
  primary_color: "Kolor główny (motyw)",
  sidebar_background_color: "Kolor tła paska bocznego",
  sidebar_text_color: "Kolor tekstu paska bocznego",
  set_theme: "Ustaw motyw",
  enter_a_valid_hex_code_of_6_characters: "Wprowadź prawidłowy kod hex składający się z 6 znaków",
  background_color_is_required: "Kolor tła jest wymagany",
  text_color_is_required: "Kolor tekstu jest wymagany",
  primary_color_is_required: "Kolor główny jest wymagany",
  sidebar_background_color_is_required: "Kolor tła paska bocznego jest wymagany",
  sidebar_text_color_is_required: "Kolor tekstu paska bocznego jest wymagany",
  updating_theme: "Aktualizowanie motywu",
  theme_updated_successfully: "Motyw zaktualizowano pomyślnie",
  failed_to_update_the_theme: "Aktualizacja motywu nie powiodła się",
  email_notifications: "Powiadomienia e-mail",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "Bądź na bieżąco z subskrybowanymi elementami pracy. Włącz, aby otrzymywać powiadomienia.",
  email_notification_setting_updated_successfully: "Ustawienia powiadomień e-mail zaktualizowano pomyślnie",
  failed_to_update_email_notification_setting: "Aktualizacja ustawień powiadomień e-mail nie powiodła się",
  notify_me_when: "Powiadamiaj mnie, gdy",
  property_changes: "Zmiany właściwości",
  property_changes_description:
    "Powiadamiaj, gdy zmieniają się właściwości elementów pracy, takie jak przypisanie, priorytet, oszacowania lub cokolwiek innego.",
  state_change: "Zmiana stanu",
  state_change_description: "Powiadamiaj, gdy element pracy zostaje przeniesiony do innego stanu",
  issue_completed: "Element pracy ukończony",
  issue_completed_description: "Powiadamiaj tylko, gdy element pracy zostanie ukończony",
  comments: "Komentarze",
  comments_description: "Powiadamiaj, gdy ktoś doda komentarz do elementu pracy",
  mentions: "Wzmianki",
  mentions_description: "Powiadamiaj mnie tylko, gdy ktoś mnie wspomni w komentarzach lub opisie",
  old_password: "Stare hasło",
  general_settings: "Ustawienia ogólne",
  sign_out: "Wyloguj się",
  signing_out: "Wylogowywanie",
  active_cycles: "Aktywne cykle",
  active_cycles_description:
    "Śledź cykle w różnych projektach, monitoruj elementy o wysokim priorytecie i koncentruj się na cyklach wymagających uwagi.",
  on_demand_snapshots_of_all_your_cycles: "Migawki wszystkich Twoich cykli na żądanie",
  upgrade: "Uaktualnij",
  "10000_feet_view": "Widok z wysokości 10 000 stóp na wszystkie aktywne cykle.",
  "10000_feet_view_description":
    "Przybliż wszystkie aktywne cykle w różnych projektach bez konieczności przełączania się między nimi.",
  get_snapshot_of_each_active_cycle: "Uzyskaj migawkę każdego aktywnego cyklu.",
  get_snapshot_of_each_active_cycle_description:
    "Śledź kluczowe metryki wszystkich aktywnych cykli, sprawdzaj postęp i porównuj zakres z terminami.",
  compare_burndowns: "Porównuj wykresy burndown.",
  compare_burndowns_description: "Obserwuj wydajność zespołów, przeglądając raporty burndown każdego cyklu.",
  quickly_see_make_or_break_issues: "Szybko identyfikuj kluczowe elementy pracy.",
  quickly_see_make_or_break_issues_description:
    "Przeglądaj elementy o wysokim priorytecie w każdym cyklu w kontekście terminów. Jeden klik i wszystko widzisz.",
  zoom_into_cycles_that_need_attention: "Skup się na cyklach wymagających uwagi.",
  zoom_into_cycles_that_need_attention_description:
    "Zbadaj stan każdego cyklu, który nie spełnia oczekiwań, za pomocą jednego kliknięcia.",
  stay_ahead_of_blockers: "Wyprzedzaj blokery.",
  stay_ahead_of_blockers_description:
    "Identyfikuj problemy między projektami i odkrywaj zależności między cyklami, niewidoczne w innych widokach.",
  analytics: "Analizy",
  workspace_invites: "Zaproszenia do przestrzeni roboczej",
  enter_god_mode: "Wejdź w tryb boga",
  workspace_logo: "Logo przestrzeni roboczej",
  new_issue: "Nowy element pracy",
  your_work: "Twoja praca",
  drafts: "Szkice",
  projects: "Projekty",
  views: "Widoki",
  archives: "Archiwa",
  settings: "Ustawienia",
  failed_to_move_favorite: "Nie udało się przenieść ulubionego",
  favorites: "Ulubione",
  no_favorites_yet: "Brak ulubionych",
  create_folder: "Utwórz folder",
  new_folder: "Nowy folder",
  favorite_updated_successfully: "Ulubione zaktualizowano pomyślnie",
  favorite_created_successfully: "Ulubione utworzono pomyślnie",
  folder_already_exists: "Folder już istnieje",
  folder_name_cannot_be_empty: "Nazwa folderu nie może być pusta",
  something_went_wrong: "Coś poszło nie tak",
  failed_to_reorder_favorite: "Nie udało się zmienić kolejności ulubionego",
  favorite_removed_successfully: "Ulubione usunięto pomyślnie",
  failed_to_create_favorite: "Nie udało się utworzyć ulubionego",
  failed_to_rename_favorite: "Nie udało się zmienić nazwy ulubionego",
  project_link_copied_to_clipboard: "Link do projektu skopiowano do schowka",
  link_copied: "Link skopiowany",
  add_project: "Dodaj projekt",
  create_project: "Utwórz projekt",
  failed_to_remove_project_from_favorites: "Nie udało się usunąć projektu z ulubionych. Spróbuj ponownie.",
  project_created_successfully: "Projekt utworzono pomyślnie",
  project_created_successfully_description: "Projekt został pomyślnie utworzony. Teraz możesz dodawać elementy pracy.",
  project_name_already_taken: "Nazwa projektu jest już zajęta.",
  project_identifier_already_taken: "Identyfikator projektu jest już zajęty.",
  project_cover_image_alt: "Obraz w tle projektu",
  name_is_required: "Nazwa jest wymagana",
  title_should_be_less_than_255_characters: "Nazwa musi mieć mniej niż 255 znaków",
  project_name: "Nazwa projektu",
  project_id_must_be_at_least_1_character: "ID projektu musi mieć co najmniej 1 znak",
  project_id_must_be_at_most_5_characters: "ID projektu może mieć maksymalnie 5 znaków",
  project_id: "ID projektu",
  project_id_tooltip_content: "Pomaga jednoznacznie identyfikować elementy pracy w projekcie. Max. 50 znaków.",
  description_placeholder: "Opis",
  only_alphanumeric_non_latin_characters_allowed: "Dozwolone są tylko znaki alfanumeryczne i nielatynowskie.",
  project_id_is_required: "ID projektu jest wymagane",
  project_id_allowed_char: "Dozwolone są tylko znaki alfanumeryczne i nielatynowskie.",
  project_id_min_char: "ID projektu musi mieć co najmniej 1 znak",
  project_id_max_char: "ID projektu może mieć maksymalnie {max} znaków",
  project_description_placeholder: "Wpisz opis projektu",
  select_network: "Wybierz sieć",
  lead: "Lead",
  date_range: "Zakres dat",
  private: "Prywatny",
  public: "Publiczny",
  accessible_only_by_invite: "Dostęp wyłącznie na zaproszenie",
  anyone_in_the_workspace_except_guests_can_join: "Każdy w przestrzeni, poza gośćmi, może dołączyć",
  creating: "Tworzenie",
  creating_project: "Tworzenie projektu",
  adding_project_to_favorites: "Dodawanie projektu do ulubionych",
  project_added_to_favorites: "Projekt dodano do ulubionych",
  couldnt_add_the_project_to_favorites: "Nie udało się dodać projektu do ulubionych. Spróbuj ponownie.",
  removing_project_from_favorites: "Usuwanie projektu z ulubionych",
  project_removed_from_favorites: "Projekt usunięto z ulubionych",
  couldnt_remove_the_project_from_favorites: "Nie udało się usunąć projektu z ulubionych. Spróbuj ponownie.",
  add_to_favorites: "Dodaj do ulubionych",
  remove_from_favorites: "Usuń z ulubionych",
  publish_project: "Opublikuj projekt",
  publish: "Opublikuj",
  copy_link: "Kopiuj link",
  leave_project: "Opuść projekt",
  join_the_project_to_rearrange: "Dołącz do projektu, aby zmienić układ",
  drag_to_rearrange: "Przeciągnij, aby zmienić układ",
  congrats: "Gratulacje!",
  open_project: "Otwórz projekt",
  issues: "Elementy pracy",
  cycles: "Cykle",
  modules: "Moduły",
  pages: {
    link_pages: "Połącz strony",
    show_wiki_pages: "Pokaż strony wiki",
    link_pages_to: "Połącz strony do",
    linked_pages: "Połączone strony",
    no_description: "Ta strona jest pusta. Napisz coś tutaj i zobacz to jako ten placeholder",
    toasts: {
      link: {
        success: {
          title: "Strony zaktualizowane",
          message: "Strony zaktualizowane pomyślnie",
        },
        error: {
          title: "Strony nie zaktualizowane",
          message: "Nie udało się zaktualizować stron.",
        },
      },
      remove: {
        success: {
          title: "Strona usunięta",
          message: "Strona została pomyślnie usunięta",
        },
        error: {
          title: "Strona nie usunięta",
          message: "Nie udało się usunąć strony.",
        },
      },
    },
  },
  intake: "Zgłoszenia",
  renew: "Odnów",
  preview: "Podgląd",
  time_tracking: "Śledzenie czasu",
  work_management: "Zarządzanie pracą",
  projects_and_issues: "Projekty i elementy pracy",
  projects_and_issues_description: "Włączaj lub wyłączaj te funkcje w projekcie.",
  cycles_description:
    "Określ ramy czasowe pracy dla każdego projektu i dostosuj okres w razie potrzeby. Jeden cykl może trwać 2 tygodnie, a następny 1 tydzień.",
  modules_description: "Organizuj pracę w podprojekty z dedykowanymi liderami i przypisanymi osobami.",
  views_description: "Zapisz niestandardowe sortowania, filtry i opcje wyświetlania lub udostępnij je zespołowi.",
  pages_description: "Twórz i edytuj treści o swobodnej formie – notatki, dokumenty, cokolwiek.",
  intake_description: "Pozwól osobom spoza zespołu zgłaszać błędy, opinie i sugestie bez zakłócania przepływu pracy.",
  time_tracking_description: "Rejestruj czas spędzony na elementach pracy i projektach.",
  work_management_description: "Łatwo zarządzaj swoją pracą i projektami.",
  documentation: "Dokumentacja",
  message_support: "Skontaktuj się z pomocą",
  contact_sales: "Skontaktuj się z działem sprzedaży",
  hyper_mode: "Tryb Hyper",
  keyboard_shortcuts: "Skróty klawiaturowe",
  whats_new: "Co nowego?",
  version: "Wersja",
  we_are_having_trouble_fetching_the_updates: "Mamy problem z pobraniem aktualizacji.",
  our_changelogs: "nasze dzienniki zmian",
  for_the_latest_updates: "z najnowszymi aktualizacjami.",
  please_visit: "Odwiedź",
  docs: "Dokumentację",
  full_changelog: "Pełny dziennik zmian",
  support: "Wsparcie",
  forum: "Forum",
  powered_by_plane_pages: "Oparte na Plane Pages",
  please_select_at_least_one_invitation: "Wybierz co najmniej jedno zaproszenie.",
  please_select_at_least_one_invitation_description:
    "Wybierz co najmniej jedno zaproszenie, aby dołączyć do przestrzeni roboczej.",
  we_see_that_someone_has_invited_you_to_join_a_workspace: "Ktoś zaprosił Cię do przestrzeni roboczej",
  join_a_workspace: "Dołącz do przestrzeni roboczej",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description:
    "Widzimy, że ktoś zaprosił Cię do przestrzeni roboczej",
  join_a_workspace_description: "Dołącz do przestrzeni roboczej",
  accept_and_join: "Zaakceptuj i dołącz",
  go_home: "Strona główna",
  no_pending_invites: "Brak oczekujących zaproszeń",
  you_can_see_here_if_someone_invites_you_to_a_workspace:
    "Zobaczysz tutaj, jeśli ktoś zaprosi Cię do przestrzeni roboczej",
  back_to_home: "Wróć do strony głównej",
  workspace_name: "nazwa-przestrzeni-roboczej",
  deactivate_your_account: "Dezaktywuj swoje konto",
  deactivate_your_account_description:
    "Po dezaktywacji nie będziesz mógł być przypisywany do elementów pracy, a opłaty za przestrzeń roboczą nie będą naliczane. Aby ponownie aktywować konto, będziesz potrzebować zaproszenia na ten adres e-mail.",
  deactivating: "Dezaktywowanie",
  confirm: "Potwierdź",
  confirming: "Potwierdzanie",
  draft_created: "Szkic utworzony",
  issue_created_successfully: "Element pracy utworzony pomyślnie",
  draft_creation_failed: "Nie udało się utworzyć szkicu",
  issue_creation_failed: "Nie udało się utworzyć elementu pracy",
  draft_issue: "Szkic elementu pracy",
  issue_updated_successfully: "Element pracy zaktualizowano pomyślnie",
  issue_could_not_be_updated: "Nie udało się zaktualizować elementu pracy",
  create_a_draft: "Utwórz szkic",
  save_to_drafts: "Zapisz w szkicach",
  save: "Zapisz",
  update: "Aktualizuj",
  updating: "Aktualizowanie",
  create_new_issue: "Utwórz nowy element pracy",
  editor_is_not_ready_to_discard_changes: "Edytor nie jest gotowy do odrzucenia zmian",
  failed_to_move_issue_to_project: "Nie udało się przenieść elementu pracy do projektu",
  create_more: "Utwórz więcej",
  add_to_project: "Dodaj do projektu",
  discard: "Odrzuć",
  duplicate_issue_found: "Znaleziono zduplikowany element pracy",
  duplicate_issues_found: "Znaleziono zduplikowane elementy pracy",
  no_matching_results: "Brak pasujących wyników",
  title_is_required: "Tytuł jest wymagany",
  title: "Tytuł",
  state: "Stan",
  transition: "Przejście",
  history: "Historia",
  priority: "Priorytet",
  none: "Brak",
  urgent: "Pilny",
  high: "Wysoki",
  medium: "Średni",
  low: "Niski",
  members: "Członkowie",
  assignee: "Przypisano",
  assignees: "Przypisani",
  subscriber: "{count, plural, one{# Subskrybent} few{# Subskrybentów} other{# Subskrybentów}}",
  you: "Ty",
  labels: "Etykiety",
  create_new_label: "Utwórz nową etykietę",
  label_name: "Nazwa etykiety",
  failed_to_create_label: "Nie udało się utworzyć etykiety. Spróbuj ponownie.",
  start_date: "Data rozpoczęcia",
  end_date: "Data zakończenia",
  due_date: "Termin",
  estimate: "Szacowanie",
  change_parent_issue: "Zmień element nadrzędny",
  remove_parent_issue: "Usuń element nadrzędny",
  add_parent: "Dodaj element nadrzędny",
  loading_members: "Ładowanie członków",
  view_link_copied_to_clipboard: "Link do widoku skopiowano do schowka.",
  required: "Wymagane",
  optional: "Opcjonalne",
  Cancel: "Anuluj",
  edit: "Edytuj",
  archive: "Archiwizuj",
  restore: "Przywróć",
  open_in_new_tab: "Otwórz w nowej karcie",
  delete: "Usuń",
  deleting: "Usuwanie",
  make_a_copy: "Utwórz kopię",
  move_to_project: "Przenieś do projektu",
  good: "Dzień dobry",
  morning: "rano",
  afternoon: "po południu",
  evening: "wieczorem",
  show_all: "Pokaż wszystko",
  show_less: "Pokaż mniej",
  no_data_yet: "Brak danych",
  syncing: "Synchronizowanie",
  add_work_item: "Dodaj element pracy",
  advanced_description_placeholder: "Naciśnij '/' aby wywołać polecenia",
  create_work_item: "Utwórz element pracy",
  attachments: "Załączniki",
  declining: "Odrzucanie",
  declined: "Odrzucono",
  decline: "Odrzuć",
  unassigned: "Nieprzypisane",
  work_items: "Elementy pracy",
  add_link: "Dodaj link",
  points: "Punkty",
  no_assignee: "Brak przypisanego",
  no_assignees_yet: "Brak przypisanych",
  no_labels_yet: "Brak etykiet",
  ideal: "Idealny",
  current: "Obecny",
  no_matching_members: "Brak pasujących członków",
  leaving: "Opuść",
  removing: "Usuwanie",
  leave: "Opuść",
  refresh: "Odśwież",
  refreshing: "Odświeżanie",
  refresh_status: "Odśwież status",
  prev: "Poprzedni",
  next: "Następny",
  re_generating: "Ponowne generowanie",
  re_generate: "Wygeneruj ponownie",
  re_generate_key: "Wygeneruj klucz ponownie",
  export: "Eksportuj",
  member: "{count, plural, one{# członek} few{# członkowie} other{# członków}}",
  new_password_must_be_different_from_old_password: "Nowe hasło musi być innym niż stare hasło",
  edited: "Edytowano",
  bot: "Bot",
  project_view: {
    sort_by: {
      created_at: "Utworzono dnia",
      updated_at: "Zaktualizowano dnia",
      name: "Nazwa",
    },
  },
  upgrade_request: "Poproś administratora obszaru roboczego o uaktualnienie.",
  copied_to_clipboard: "Skopiowano do schowka",
  copied_to_clipboard_description: "URL został pomyślnie skopiowany do schowka",
  toast: {
    success: "Sukces!",
    error: "Błąd!",
  },
  links: {
    toasts: {
      created: {
        title: "Link utworzony",
        message: "Link został pomyślnie utworzony",
      },
      not_created: {
        title: "Nie utworzono linku",
        message: "Nie udało się utworzyć linku",
      },
      updated: {
        title: "Link zaktualizowany",
        message: "Link został pomyślnie zaktualizowany",
      },
      not_updated: {
        title: "Link nie został zaktualizowany",
        message: "Nie udało się zaktualizować linku",
      },
      removed: {
        title: "Link usunięty",
        message: "Link został pomyślnie usunięty",
      },
      not_removed: {
        title: "Link nie został usunięty",
        message: "Nie udało się usunąć linku",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "Twój przewodnik szybkiego startu",
      not_right_now: "Nie teraz",
      create_project: {
        title: "Utwórz projekt",
        description: "Większość rzeczy zaczyna się od projektu w Plane.",
        cta: "Zacznij",
      },
      invite_team: {
        title: "Zaproś zespół",
        description: "Współpracuj z kolegami, twórz, dostarczaj i zarządzaj.",
        cta: "Zaproś ich",
      },
      configure_workspace: {
        title: "Skonfiguruj swoją przestrzeń roboczą.",
        description: "Włącz lub wyłącz funkcje albo idź dalej.",
        cta: "Skonfiguruj tę przestrzeń",
      },
      personalize_account: {
        title: "Spersonalizuj Plane.",
        description: "Wybierz zdjęcie, kolory i inne.",
        cta: "Dostosuj teraz",
      },
      widgets: {
        title: "Jest tu pusto bez widżetów, włącz je",
        description: `Wygląda na to, że wszystkie Twoje widżety są wyłączone. Włącz je
dla lepszego doświadczenia!`,
        primary_button: {
          text: "Zarządzaj widżetami",
        },
      },
    },
    quick_links: {
      empty: "Zapisz linki do ważnych rzeczy, które chcesz mieć pod ręką.",
      add: "Dodaj szybki link",
      title: "Szybki link",
      title_plural: "Szybkie linki",
    },
    recents: {
      title: "Ostatnie",
      empty: {
        project: "Twoje ostatnio odwiedzone projekty pojawią się tutaj.",
        page: "Twoje ostatnio odwiedzone strony pojawią się tutaj.",
        issue: "Twoje ostatnio odwiedzone elementy pracy pojawią się tutaj.",
        default: "Nie masz jeszcze żadnych ostatnich pozycji.",
      },
      filters: {
        all: "Wszystkie",
        projects: "Projekty",
        pages: "Strony",
        issues: "Elementy pracy",
      },
    },
    new_at_plane: {
      title: "Co nowego w Plane",
    },
    quick_tutorial: {
      title: "Szybki samouczek",
    },
    widget: {
      reordered_successfully: "Widżet pomyślnie przeniesiono.",
      reordering_failed: "Wystąpił błąd podczas przenoszenia widżetu.",
    },
    manage_widgets: "Zarządzaj widżetami",
    title: "Strona główna",
    star_us_on_github: "Oceń nas na GitHubie",
    business_trial_banner: {
      title: "Twój 14-dniowy okres próbny planu Business jest aktywny!",
      description:
        "Poznaj wszystkie funkcje Business. Gdy będziesz gotowy, wybierz subskrypcję. Nie zostaniesz automatycznie obciążony.",
      trial_ends_today: "Okres próbny kończy się dzisiaj",
      trial_ends_in_days: "Okres próbny kończy się za {days, plural, one {# dzień} few {# dni} other {# dni}}",
      start_subscription: "Rozpocznij subskrypcję",
      explore_business_features: "Poznaj funkcje Business",
    },
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "URL jest nieprawidłowy",
        placeholder: "Wpisz lub wklej adres URL",
      },
      title: {
        text: "Nazwa wyświetlana",
        placeholder: "Jak chcesz nazwać ten link",
      },
    },
  },
  common: {
    all: "Wszystko",
    no_items_in_this_group: "Brak elementów w tej grupie",
    drop_here_to_move: "Upuść tutaj, aby przenieść",
    states: "Stany",
    state: "Stan",
    state_groups: "Grupy stanów",
    state_group: "Grupa stanów",
    priorities: "Priorytety",
    priority: "Priorytet",
    team_project: "Projekt zespołowy",
    project: "Projekt",
    cycle: "Cykl",
    cycles: "Cykle",
    module: "Moduł",
    modules: "Moduły",
    labels: "Etykiety",
    label: "Etykieta",
    assignees: "Przypisani",
    assignee: "Przypisano",
    created_by: "Utworzone przez",
    none: "Brak",
    link: "Link",
    estimates: "Szacunki",
    estimate: "Szacowanie",
    created_at: "Utworzono dnia",
    updated_at: "Zaktualizowano dnia",
    completed_at: "Zakończono dnia",
    layout: "Układ",
    filters: "Filtry",
    display: "Wyświetlanie",
    load_more: "Załaduj więcej",
    activity: "Aktywność",
    analytics: "Analizy",
    dates: "Daty",
    success: "Sukces!",
    something_went_wrong: "Coś poszło nie tak",
    error: {
      label: "Błąd!",
      message: "Wystąpił błąd. Spróbuj ponownie.",
    },
    group_by: "Grupuj według",
    epic: "Epik",
    epics: "Epiki",
    work_item: "Element pracy",
    work_items: "Elementy pracy",
    sub_work_item: "Podrzędny element pracy",
    add: "Dodaj",
    warning: "Ostrzeżenie",
    updating: "Aktualizowanie",
    adding: "Dodawanie",
    update: "Aktualizuj",
    creating: "Tworzenie",
    create: "Utwórz",
    cancel: "Anuluj",
    description: "Opis",
    title: "Tytuł",
    attachment: "Załącznik",
    general: "Ogólne",
    features: "Funkcje",
    automation: "Automatyzacja",
    project_name: "Nazwa projektu",
    project_id: "ID projektu",
    project_timezone: "Strefa czasowa projektu",
    created_on: "Utworzono dnia",
    updated_on: "Zaktualizowano",
    completed_on: "Completed on",
    update_project: "Zaktualizuj projekt",
    identifier_already_exists: "Identyfikator już istnieje",
    add_more: "Dodaj więcej",
    defaults: "Domyślne",
    add_label: "Dodaj etykietę",
    customize_time_range: "Dostosuj zakres czasu",
    loading: "Ładowanie",
    attachments: "Załączniki",
    property: "Właściwość",
    properties: "Właściwości",
    parent: "Nadrzędny",
    page: "Strona",
    remove: "Usuń",
    archiving: "Archiwizowanie",
    archive: "Archiwizuj",
    access: {
      public: "Publiczny",
      private: "Prywatny",
    },
    done: "Gotowe",
    sub_work_items: "Podrzędne elementy pracy",
    comment: "Komentarz",
    workspace_level: "Poziom przestrzeni roboczej",
    order_by: {
      label: "Sortuj według",
      manual: "Ręcznie",
      last_created: "Ostatnio utworzone",
      last_updated: "Ostatnio zaktualizowane",
      start_date: "Data rozpoczęcia",
      due_date: "Termin",
      asc: "Rosnąco",
      desc: "Malejąco",
      updated_on: "Zaktualizowano dnia",
    },
    sort: {
      asc: "Rosnąco",
      desc: "Malejąco",
      created_on: "Utworzono dnia",
      updated_on: "Zaktualizowano dnia",
    },
    comments: "Komentarze",
    updates: "Aktualizacje",
    additional_updates: "Dodatkowe aktualizacje",
    clear_all: "Wyczyść wszystko",
    copied: "Skopiowano!",
    link_copied: "Link skopiowano!",
    link_copied_to_clipboard: "Link skopiowano do schowka",
    copied_to_clipboard: "Link do elementu pracy skopiowano do schowka",
    branch_name_copied_to_clipboard: "Nazwa gałęzi skopiowana do schowka",
    is_copied_to_clipboard: "Element pracy skopiowany do schowka",
    no_links_added_yet: "Nie dodano jeszcze żadnych linków",
    add_link: "Dodaj link",
    links: "Linki",
    go_to_workspace: "Przejdź do przestrzeni roboczej",
    progress: "Postęp",
    optional: "Opcjonalne",
    join: "Dołącz",
    go_back: "Wróć",
    continue: "Kontynuuj",
    resend: "Wyślij ponownie",
    relations: "Relacje",
    errors: {
      default: {
        title: "Błąd!",
        message: "Coś poszło nie tak. Spróbuj ponownie.",
      },
      required: "To pole jest wymagane",
      entity_required: "{entity} jest wymagane",
      restricted_entity: "{entity} jest ograniczony",
    },
    update_link: "Zaktualizuj link",
    attach: "Dołącz",
    create_new: "Utwórz nowy",
    add_existing: "Dodaj istniejący",
    type_or_paste_a_url: "Wpisz lub wklej URL",
    url_is_invalid: "URL jest nieprawidłowy",
    display_title: "Nazwa wyświetlana",
    link_title_placeholder: "Jak chcesz nazwać ten link",
    url: "URL",
    side_peek: "Widok boczny",
    modal: "Okno modalne",
    full_screen: "Pełny ekran",
    close_peek_view: "Zamknij podgląd",
    toggle_peek_view_layout: "Przełącz układ podglądu",
    options: "Opcje",
    duration: "Czas trwania",
    today: "Dziś",
    week: "Tydzień",
    month: "Miesiąc",
    quarter: "Kwartał",
    press_for_commands: "Naciśnij '/' aby wywołać polecenia",
    click_to_add_description: "Kliknij, aby dodać opis",
    search: {
      label: "Szukaj",
      placeholder: "Wpisz wyszukiwane hasło",
      no_matches_found: "Nie znaleziono pasujących wyników",
      no_matching_results: "Brak pasujących wyników",
    },
    actions: {
      edit: "Edytuj",
      make_a_copy: "Utwórz kopię",
      open_in_new_tab: "Otwórz w nowej karcie",
      copy_link: "Kopiuj link",
      copy_branch_name: "Kopiuj nazwę gałęzi",
      archive: "Archiwizuj",
      restore: "Przywróć",
      delete: "Usuń",
      remove_relation: "Usuń relację",
      subscribe: "Subskrybuj",
      unsubscribe: "Anuluj subskrypcję",
      clear_sorting: "Wyczyść sortowanie",
      show_weekends: "Pokaż weekendy",
      enable: "Włącz",
      disable: "Wyłącz",
    },
    name: "Nazwa",
    discard: "Odrzuć",
    confirm: "Potwierdź",
    confirming: "Potwierdzanie",
    read_the_docs: "Przeczytaj dokumentację",
    default: "Domyślne",
    active: "Aktywny",
    enabled: "Włączone",
    disabled: "Wyłączone",
    mandate: "Mandat",
    mandatory: "Wymagane",
    yes: "Tak",
    no: "Nie",
    please_wait: "Proszę czekać",
    enabling: "Włączanie",
    disabling: "Wyłączanie",
    beta: "Beta",
    or: "lub",
    next: "Dalej",
    back: "Wstecz",
    cancelling: "Anulowanie",
    configuring: "Konfigurowanie",
    clear: "Wyczyść",
    import: "Importuj",
    connect: "Połącz",
    authorizing: "Autoryzowanie",
    processing: "Przetwarzanie",
    no_data_available: "Brak dostępnych danych",
    from: "od {name}",
    authenticated: "Uwierzytelniono",
    select: "Wybierz",
    upgrade: "Uaktualnij",
    add_seats: "Dodaj miejsca",
    projects: "Projekty",
    workspace: "Przestrzeń robocza",
    workspaces: "Przestrzenie robocze",
    team: "Zespół",
    teams: "Zespoły",
    entity: "Encja",
    entities: "Encje",
    task: "Zadanie",
    tasks: "Zadania",
    section: "Sekcja",
    sections: "Sekcje",
    edit: "Edytuj",
    connecting: "Łączenie",
    connected: "Połączono",
    disconnect: "Odłącz",
    disconnecting: "Odłączanie",
    installing: "Instalowanie",
    install: "Zainstaluj",
    reset: "Resetuj",
    live: "Na żywo",
    change_history: "Historia zmian",
    coming_soon: "Wkrótce",
    member: "Członek",
    members: "Członkowie",
    you: "Ty",
    upgrade_cta: {
      higher_subscription: "Uaktualnij do wyższego abonamentu",
      talk_to_sales: "Skontaktuj się z działem sprzedaży",
    },
    category: "Kategoria",
    categories: "Kategorie",
    saving: "Zapisywanie",
    save_changes: "Zapisz zmiany",
    delete: "Usuń",
    deleting: "Usuwanie",
    pending: "Oczekujące",
    invite: "Zaproś",
    view: "Widok",
    deactivated_user: "Dezaktywowany użytkownik",
    apply: "Zastosuj",
    applying: "Zastosowanie",
    users: "Użytkownicy",
    admins: "Administratorzy",
    guests: "Goście",
    on_track: "Na dobrej drodze",
    off_track: "Poza planem",
    at_risk: "W zagrożeniu",
    timeline: "Oś czasu",
    completion: "Zakończenie",
    upcoming: "Nadchodzące",
    completed: "Zakończone",
    in_progress: "W trakcie",
    planned: "Zaplanowane",
    paused: "Wstrzymane",
    no_of: "Liczba {entity}",
    resolved: "Rozwiązane",
    worklogs: "Logi pracy",
    project_updates: "Aktualizacje projektu",
    overview: "Przegląd",
    workflows: "Workflowy",
    templates: "Szablony",
    members_and_teamspaces: "Członkowie i tymacz",
    open_in_full_screen: "Otwórz {page} na pełnym ekranie",
    details: "Szczegóły",
    project_structure: "Struktura projektu",
    custom_properties: "Właściwości niestandardowe",
  },
  chart: {
    x_axis: "Oś X",
    y_axis: "Oś Y",
    metric: "Metryka",
  },
  form: {
    title: {
      required: "Tytuł jest wymagany",
      max_length: "Tytuł powinien mieć mniej niż {length} znaków",
    },
  },
  entity: {
    grouping_title: "Grupowanie {entity}",
    priority: "Priorytet {entity}",
    all: "Wszystkie {entity}",
    drop_here_to_move: "Przeciągnij tutaj, aby przenieść {entity}",
    delete: {
      label: "Usuń {entity}",
      success: "{entity} pomyślnie usunięto",
      failed: "Nie udało się usunąć {entity}",
    },
    update: {
      failed: "Aktualizacja {entity} nie powiodła się",
      success: "{entity} zaktualizowano pomyślnie",
    },
    link_copied_to_clipboard: "Link do {entity} skopiowano do schowka",
    fetch: {
      failed: "Błąd podczas pobierania {entity}",
    },
    add: {
      success: "{entity} dodano pomyślnie",
      failed: "Błąd podczas dodawania {entity}",
    },
    remove: {
      success: "{entity} usunięto pomyślnie",
      failed: "Błąd podczas usuwania {entity}",
    },
  },
  epic: {
    all: "Wszystkie epiki",
    label: "{count, plural, one {Epik} other {Epiki}}",
    new: "Nowy epik",
    adding: "Dodawanie epiku",
    create: {
      success: "Epik utworzono pomyślnie",
    },
    add: {
      press_enter: "Naciśnij 'Enter', aby dodać kolejny epik",
      label: "Dodaj epik",
    },
    title: {
      label: "Tytuł epiku",
      required: "Tytuł epiku jest wymagany.",
    },
    archive: {
      description: `Tylko ukończone lub anulowane epiki
mogą być zarchiwizowane`,
      label: "Archiwizuj epik",
      confirm_message:
        "Czy na pewno chcesz zarchiwizować epik? Wszystkie zarchiwizowane epiki można później przywrócić.",
      success: {
        label: "Archiwizacja udana",
        message: "Twoje archiwa znajdują się w archiwach projektu.",
      },
      failed: {
        message: "Nie udało się zarchiwizować epiku. Spróbuj ponownie.",
      },
    },
  },
  issue: {
    label: "{count, plural, one {Element pracy} few {Elementy pracy} other {Elementów pracy}}",
    all: "Wszystkie elementy pracy",
    edit: "Edytuj element pracy",
    title: {
      label: "Tytuł elementu pracy",
      required: "Tytuł elementu pracy jest wymagany.",
    },
    add: {
      press_enter: "Naciśnij 'Enter', aby dodać kolejny element pracy",
      label: "Dodaj element pracy",
      cycle: {
        failed: "Nie udało się dodać elementu pracy do cyklu. Spróbuj ponownie.",
        success: "{count, plural, one {Element pracy} few {Elementy pracy} other {Elementów pracy}} dodano do cyklu.",
        loading:
          "Dodawanie {count, plural, one {elementu pracy} few {elementów pracy} other {elementów pracy}} do cyklu",
      },
      assignee: "Dodaj przypisanego",
      start_date: "Dodaj datę rozpoczęcia",
      due_date: "Dodaj termin",
      parent: "Dodaj element nadrzędny",
      sub_issue: "Dodaj podrzędny element pracy",
      relation: "Dodaj relację",
      link: "Dodaj link",
      existing: "Dodaj istniejący element pracy",
    },
    remove: {
      label: "Usuń element pracy",
      cycle: {
        loading: "Usuwanie elementu pracy z cyklu",
        success: "Element pracy usunięto z cyklu.",
        failed: "Nie udało się usunąć elementu pracy z cyklu. Spróbuj ponownie.",
      },
      module: {
        loading: "Usuwanie elementu pracy z modułu",
        success: "Element pracy usunięto z modułu.",
        failed: "Nie udało się usunąć elementu pracy z modułu. Spróbuj ponownie.",
      },
      parent: {
        label: "Usuń element nadrzędny",
      },
    },
    new: "Nowy element pracy",
    adding: "Dodawanie elementu pracy",
    create: {
      success: "Element pracy utworzono pomyślnie",
    },
    priority: {
      urgent: "Pilny",
      high: "Wysoki",
      medium: "Średni",
      low: "Niski",
    },
    display: {
      properties: {
        label: "Wyświetlane właściwości",
        id: "ID",
        issue_type: "Typ elementu pracy",
        sub_issue_count: "Liczba elementów podrzędnych",
        attachment_count: "Liczba załączników",
        created_on: "Utworzono dnia",
        sub_issue: "Element podrzędny",
        work_item_count: "Liczba elementów pracy",
      },
      extra: {
        show_sub_issues: "Pokaż elementy podrzędne",
        show_empty_groups: "Pokaż puste grupy",
      },
    },
    layouts: {
      ordered_by_label: "Ten układ jest sortowany według",
      list: "Lista",
      kanban: "Tablica Kanban",
      calendar: "Kalendarz",
      spreadsheet: "Arkusz",
      gantt: "Oś czasu",
      title: {
        list: "Układ listy",
        kanban: "Układ tablicy",
        calendar: "Układ kalendarza",
        spreadsheet: "Układ arkusza",
        gantt: "Układ osi czasu",
      },
    },
    states: {
      active: "Aktywny",
      backlog: "Backlog",
    },
    comments: {
      placeholder: "Dodaj komentarz",
      switch: {
        private: "Przełącz na komentarz prywatny",
        public: "Przełącz na komentarz publiczny",
      },
      create: {
        success: "Komentarz utworzono pomyślnie",
        error: "Nie udało się utworzyć komentarza. Spróbuj później.",
      },
      update: {
        success: "Komentarz zaktualizowano pomyślnie",
        error: "Nie udało się zaktualizować komentarza. Spróbuj później.",
      },
      remove: {
        success: "Komentarz usunięto pomyślnie",
        error: "Nie udało się usunąć komentarza. Spróbuj później.",
      },
      upload: {
        error: "Nie udało się przesłać załącznika. Spróbuj później.",
      },
      copy_link: {
        success: "Link do komentarza skopiowany do schowka",
        error: "Błąd podczas kopiowania linka do komentarza. Spróbuj ponownie później.",
      },
    },
    empty_state: {
      issue_detail: {
        title: "Element pracy nie istnieje",
        description: "Element pracy, którego szukasz, nie istnieje, został zarchiwizowany lub usunięty.",
        primary_button: {
          text: "Pokaż inne elementy pracy",
        },
      },
    },
    sibling: {
      label: "Powiązane elementy pracy",
    },
    archive: {
      description: "Można archiwizować tylko elementy pracy w stanie ukończonym lub anulowanym",
      label: "Archiwizuj element pracy",
      confirm_message:
        "Czy na pewno chcesz zarchiwizować ten element pracy? Wszystkie zarchiwizowane elementy można później przywrócić.",
      success: {
        label: "Archiwizacja zakończona",
        message: "Archiwa znajdziesz w archiwum projektu.",
      },
      failed: {
        message: "Nie udało się zarchiwizować elementu pracy. Spróbuj ponownie.",
      },
    },
    restore: {
      success: {
        title: "Przywrócenie zakończone",
        message: "Twój element pracy można znaleźć w elementach pracy projektu.",
      },
      failed: {
        message: "Nie udało się przywrócić elementu pracy. Spróbuj ponownie.",
      },
    },
    relation: {
      relates_to: "Powiązany z",
      duplicate: "Duplikat",
      blocked_by: "Zablokowany przez",
      blocking: "Blokuje",
      start_before: "Zaczyna przed",
      start_after: "Zaczyna po",
      finish_before: "Kończy przed",
      finish_after: "Kończy po",
      implements: "Implementuje",
      implemented_by: "Implementowane przez",
    },
    copy_link: "Kopiuj link do elementu pracy",
    delete: {
      label: "Usuń element pracy",
      error: "Błąd podczas usuwania elementu pracy",
    },
    subscription: {
      actions: {
        subscribed: "Subskrypcja elementu pracy powiodła się",
        unsubscribed: "Anulowano subskrypcję elementu pracy",
      },
    },
    select: {
      error: "Wybierz co najmniej jeden element pracy",
      empty: "Nie wybrano żadnych elementów pracy",
      add_selected: "Dodaj wybrane elementy pracy",
      select_all: "Wybierz wszystko",
      deselect_all: "Odznacz wszystko",
    },
    open_in_full_screen: "Otwórz element pracy na pełnym ekranie",
    vote: {
      click_to_upvote: "Kliknij, aby zagłosować za",
      click_to_downvote: "Kliknij, aby zagłosować przeciw",
      click_to_view_upvotes: "Kliknij, aby zobaczyć głosy za",
      click_to_view_downvotes: "Kliknij, aby zobaczyć głosy przeciw",
    },
  },
  attachment: {
    error: "Nie udało się dodać pliku. Spróbuj ponownie.",
    only_one_file_allowed: "Możesz przesłać tylko jeden plik naraz.",
    file_size_limit: "Plik musi być mniejszy niż {size}MB.",
    drag_and_drop: "Przeciągnij plik w dowolne miejsce, aby przesłać",
    delete: "Usuń załącznik",
  },
  label: {
    select: "Wybierz etykietę",
    create: {
      success: "Etykietę utworzono pomyślnie",
      failed: "Nie udało się utworzyć etykiety",
      already_exists: "Taka etykieta już istnieje",
      type: "Wpisz, aby utworzyć nową etykietę",
    },
  },
  sub_work_item: {
    update: {
      success: "Podrzędny element pracy zaktualizowano pomyślnie",
      error: "Błąd podczas aktualizacji elementu podrzędnego",
    },
    remove: {
      success: "Podrzędny element pracy usunięto pomyślnie",
      error: "Błąd podczas usuwania elementu podrzędnego",
    },
    empty_state: {
      sub_list_filters: {
        title: "Nie masz elementów podrzędnych, które pasują do filtrów, które zastosowałeś.",
        description: "Aby zobaczyć wszystkie elementy podrzędne, wyczyść wszystkie zastosowane filtry.",
        action: "Wyczyść filtry",
      },
      list_filters: {
        title: "Nie masz elementów pracy, które pasują do filtrów, które zastosowałeś.",
        description: "Aby zobaczyć wszystkie elementy pracy, wyczyść wszystkie zastosowane filtry.",
        action: "Wyczyść filtry",
      },
    },
  },
  view: {
    label: "{count, plural, one {Widok} few {Widoki} other {Widoków}}",
    create: {
      label: "Utwórz widok",
    },
    update: {
      label: "Zaktualizuj widok",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "Oczekujące",
        description: "Oczekujące",
      },
      declined: {
        title: "Odrzucone",
        description: "Odrzucone",
      },
      snoozed: {
        title: "Odłożone",
        description: "Pozostało {days, plural, one{# dzień} few{# dni} other{# dni}}",
      },
      accepted: {
        title: "Zaakceptowane",
        description: "Zaakceptowane",
      },
      duplicate: {
        title: "Duplikat",
        description: "Duplikat",
      },
    },
    modals: {
      decline: {
        title: "Odrzuć element pracy",
        content: "Czy na pewno chcesz odrzucić element pracy {value}?",
      },
      delete: {
        title: "Usuń element pracy",
        content: "Czy na pewno chcesz usunąć element pracy {value}?",
        success: "Element pracy usunięto pomyślnie",
      },
    },
    errors: {
      snooze_permission: "Tylko administratorzy projektu mogą odkładać/odkładać ponownie elementy pracy",
      accept_permission: "Tylko administratorzy projektu mogą akceptować elementy pracy",
      decline_permission: "Tylko administratorzy projektu mogą odrzucać elementy pracy",
    },
    actions: {
      accept: "Zaakceptuj",
      decline: "Odrzuć",
      snooze: "Odłóż",
      unsnooze: "Anuluj odłożenie",
      copy: "Kopiuj link do elementu pracy",
      delete: "Usuń",
      open: "Otwórz element pracy",
      mark_as_duplicate: "Oznacz jako duplikat",
      move: "Przenieś {value} do elementów pracy projektu",
    },
    source: {
      "in-app": "w aplikacji",
    },
    order_by: {
      created_at: "Utworzono dnia",
      updated_at: "Zaktualizowano dnia",
      id: "ID",
    },
    label: "Zgłoszenia",
    page_label: "{workspace} - Zgłoszenia",
    modal: {
      title: "Utwórz przyjęty element pracy",
    },
    tabs: {
      open: "Otwarte",
      closed: "Zamknięte",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "Brak otwartych elementów pracy",
        description: "Tutaj znajdziesz otwarte elementy pracy. Utwórz nowy.",
      },
      sidebar_closed_tab: {
        title: "Brak zamkniętych elementów pracy",
        description: "Wszystkie zaakceptowane lub odrzucone elementy pracy pojawią się tutaj.",
      },
      sidebar_filter: {
        title: "Brak pasujących elementów pracy",
        description: "Żaden element nie pasuje do filtra w zgłoszeniach. Utwórz nowy.",
      },
      detail: {
        title: "Wybierz element pracy, aby zobaczyć szczegóły.",
      },
    },
  },
  workspace_creation: {
    heading: "Utwórz przestrzeń roboczą",
    subheading: "Aby korzystać z Plane, musisz utworzyć lub dołączyć do przestrzeni roboczej.",
    form: {
      name: {
        label: "Nazwij swoją przestrzeń roboczą",
        placeholder: "Użyj czegoś rozpoznawalnego.",
      },
      url: {
        label: "Skonfiguruj adres URL swojej przestrzeni",
        placeholder: "Wpisz lub wklej adres URL",
        edit_slug: "Możesz edytować tylko fragment adresu URL (slug)",
      },
      organization_size: {
        label: "Ile osób będzie używać tej przestrzeni?",
        placeholder: "Wybierz zakres",
      },
    },
    errors: {
      creation_disabled: {
        title: "Tylko administrator instancji może tworzyć przestrzenie robocze",
        description: "Jeśli znasz adres e-mail administratora, kliknij przycisk poniżej, aby się skontaktować.",
        request_button: "Poproś administratora instancji",
      },
      validation: {
        name_alphanumeric: "Nazwy przestrzeni mogą zawierać tylko (' '), ('-'), ('_') i znaki alfanumeryczne.",
        name_length: "Nazwa ograniczona do 80 znaków.",
        url_alphanumeric: "Adres URL może zawierać tylko ('-') i znaki alfanumeryczne.",
        url_length: "Adres URL ograniczony do 48 znaków.",
        url_already_taken: "Adres URL przestrzeni roboczej jest już zajęty!",
      },
    },
    request_email: {
      subject: "Prośba o nową przestrzeń roboczą",
      body: `Cześć Administratorze,

Proszę o utworzenie nowej przestrzeni roboczej z adresem [/workspace-name] dla [cel utworzenia].

Dziękuję,
{firstName} {lastName}
{email}`,
    },
    button: {
      default: "Utwórz przestrzeń roboczą",
      loading: "Tworzenie przestrzeni roboczej",
    },
    toast: {
      success: {
        title: "Sukces",
        message: "Przestrzeń roboczą utworzono pomyślnie",
      },
      error: {
        title: "Błąd",
        message: "Nie udało się utworzyć przestrzeni roboczej. Spróbuj ponownie.",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "Podgląd projektów, aktywności i metryk",
        description:
          "Witaj w Plane, cieszymy się, że jesteś. Utwórz pierwszy projekt, śledź elementy pracy, a ta strona stanie się centrum Twojego postępu. Administratorzy zobaczą tu również elementy pomocne zespołowi.",
        primary_button: {
          text: "Utwórz pierwszy projekt",
          comic: {
            title: "Wszystko zaczyna się od projektu w Plane",
            description:
              "Projektem może być harmonogram produktu, kampania marketingowa czy wprowadzenie nowego samochodu.",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "Analizy",
    page_label: "{workspace} - Analizy",
    open_tasks: "Łączna liczba otwartych zadań",
    error: "Wystąpił błąd podczas wczytywania danych.",
    work_items_closed_in: "Elementy pracy zamknięte w",
    selected_projects: "Wybrane projekty",
    total_members: "Łączna liczba członków",
    total_cycles: "Łączna liczba cykli",
    total_modules: "Łączna liczba modułów",
    pending_work_items: {
      title: "Oczekujące elementy pracy",
      empty_state: "Tutaj zobaczysz analizę oczekujących elementów pracy według współpracowników.",
    },
    work_items_closed_in_a_year: {
      title: "Elementy pracy zamknięte w ciągu roku",
      empty_state: "Zamykaj elementy pracy, aby zobaczyć analizę w wykresie.",
    },
    most_work_items_created: {
      title: "Najwięcej utworzonych elementów",
      empty_state: "Zostaną wyświetleni współpracownicy oraz liczba utworzonych przez nich elementów.",
    },
    most_work_items_closed: {
      title: "Najwięcej zamkniętych elementów",
      empty_state: "Zostaną wyświetleni współpracownicy oraz liczba zamkniętych przez nich elementów.",
    },
    tabs: {
      scope_and_demand: "Zakres i zapotrzebowanie",
      custom: "Analizy niestandardowe",
    },
    empty_state: {
      customized_insights: {
        description: "Przypisane do Ciebie elementy pracy, podzielone według stanu, pojawią się tutaj.",
        title: "Brak danych",
      },
      created_vs_resolved: {
        description: "Elementy pracy utworzone i rozwiązane w czasie pojawią się tutaj.",
        title: "Brak danych",
      },
      project_insights: {
        title: "Brak danych",
        description: "Przypisane do Ciebie elementy pracy, podzielone według stanu, pojawią się tutaj.",
      },
      general: {
        title: "Śledź postęp, obciążenie pracą i alokacje. Wykrywaj trendy, usuwaj blokady i pracuj szybciej",
        description:
          "Zobacz zakres vs zapotrzebowanie, oszacowania i rozrost zakresu. Uzyskaj wydajność członków zespołu i zespołów, upewniając się, że projekt jest realizowany na czas.",
        primary_button: {
          text: "Rozpocznij swój pierwszy projekt",
          comic: {
            title: "Analityka działa najlepiej z Cyklami + Modułami",
            description:
              "Najpierw umieść swoje elementy pracy w Cyklach, a jeśli można, pogrupuj elementy obejmujące więcej niż jeden cykl w Moduły. Sprawdź oba w lewej nawigacji.",
          },
        },
      },
      cycle_progress: {
        title: "Brak danych",
        description:
          "Analiza postępu cyklu pojawi się tutaj. Dodaj elementy pracy do cykli, aby rozpocząć śledzenie postępów.",
      },
      module_progress: {
        title: "Brak danych",
        description:
          "Analiza postępu modułu pojawi się tutaj. Dodaj elementy pracy do modułów, aby rozpocząć śledzenie postępów.",
      },
      intake_trends: {
        title: "Brak danych",
        description:
          "Analiza trendów przyjęć pojawi się tutaj. Dodaj elementy pracy do przyjęć, aby rozpocząć śledzenie trendów.",
      },
    },
    created_vs_resolved: "Utworzone vs Rozwiązane",
    customized_insights: "Dostosowane informacje",
    backlog_work_items: "{entity} w backlogu",
    active_projects: "Aktywne projekty",
    trend_on_charts: "Trend na wykresach",
    all_projects: "Wszystkie projekty",
    summary_of_projects: "Podsumowanie projektów",
    project_insights: "Wgląd w projekt",
    started_work_items: "Rozpoczęte {entity}",
    total_work_items: "Łączna liczba {entity}",
    total_projects: "Łączna liczba projektów",
    total_admins: "Łączna liczba administratorów",
    total_users: "Łączna liczba użytkowników",
    total_intake: "Całkowity dochód",
    un_started_work_items: "Nierozpoczęte {entity}",
    total_guests: "Łączna liczba gości",
    completed_work_items: "Ukończone {entity}",
    total: "Łączna liczba {entity}",
    projects_by_status: "Projekty według statusu",
    active_users: "Aktywni użytkownicy",
    intake_trends: "Trendy przyjęć",
    workitem_resolved_vs_pending: "Rozwiązane vs oczekujące elementy pracy",
    upgrade_to_plan: "Ulepsz do {plan}, aby odblokować {tab}",
  },
  workspace_projects: {
    label: "{count, plural, one {Projekt} few {Projekty} other {Projektów}}",
    create: {
      label: "Dodaj projekt",
    },
    network: {
      label: "Sieć",
      private: {
        title: "Prywatny",
        description: "Dostęp tylko na zaproszenie",
      },
      public: {
        title: "Publiczny",
        description: "Każdy w przestrzeni, poza gośćmi, może dołączyć",
      },
    },
    error: {
      permission: "Nie masz uprawnień do wykonania tej akcji.",
      cycle_delete: "Nie udało się usunąć cyklu",
      module_delete: "Nie udało się usunąć modułu",
      issue_delete: "Nie udało się usunąć elementu pracy",
    },
    state: {
      backlog: "Backlog",
      unstarted: "Nierozpoczęty",
      started: "Rozpoczęty",
      completed: "Ukończony",
      cancelled: "Anulowany",
    },
    sort: {
      manual: "Ręcznie",
      name: "Nazwa",
      created_at: "Data utworzenia",
      members_length: "Liczba członków",
    },
    scope: {
      my_projects: "Moje projekty",
      archived_projects: "Zarchiwizowane",
    },
    common: {
      months_count: "{months, plural, one{# miesiąc} few{# miesiące} other{# miesięcy}}",
      days_count: "{days, plural, one{# dzień} other{# dni}}",
    },
    empty_state: {
      general: {
        title: "Brak aktywnych projektów",
        description:
          "Projekt to główny cel. Zawiera zadania, cykle i moduły. Utwórz nowy lub poszukaj zarchiwizowanych.",
        primary_button: {
          text: "Rozpocznij pierwszy projekt",
          comic: {
            title: "Wszystko zaczyna się od projektu w Plane",
            description:
              "Projekt może dotyczyć planu produktu, kampanii marketingowej lub uruchomienia nowego samochodu.",
          },
        },
      },
      no_projects: {
        title: "Brak projektów",
        description: "Aby tworzyć elementy pracy, musisz utworzyć lub dołączyć do projektu.",
        primary_button: {
          text: "Rozpocznij pierwszy projekt",
          comic: {
            title: "Wszystko zaczyna się od projektu w Plane",
            description:
              "Projekt może dotyczyć planu produktu, kampanii marketingowej lub uruchomienia nowego samochodu.",
          },
        },
      },
      filter: {
        title: "Brak pasujących projektów",
        description: `Nie znaleziono projektów spełniających kryteria.
Utwórz nowy.`,
      },
      search: {
        description: `Nie znaleziono projektów spełniających kryteria.
Utwórz nowy.`,
      },
    },
  },
  workspace_views: {
    add_view: "Dodaj widok",
    empty_state: {
      "all-issues": {
        title: "Brak elementów pracy w projekcie",
        description: "Utwórz pierwszy element i śledź postępy!",
        primary_button: {
          text: "Utwórz element pracy",
        },
      },
      assigned: {
        title: "Brak przypisanych elementów",
        description: "Tutaj zobaczysz elementy przypisane Tobie.",
        primary_button: {
          text: "Utwórz element pracy",
        },
      },
      created: {
        title: "Brak utworzonych elementów",
        description: "Tutaj pojawiają się elementy, które utworzyłeś(aś).",
        primary_button: {
          text: "Utwórz element pracy",
        },
      },
      subscribed: {
        title: "Brak subskrybowanych elementów",
        description: "Subskrybuj elementy, które Cię interesują.",
      },
      "custom-view": {
        title: "Brak pasujących elementów",
        description: "Wyświetlane są elementy spełniające filtr.",
      },
    },
    delete_view: {
      title: "Czy na pewno chcesz usunąć ten widok?",
      content:
        "Jeśli potwierdzisz, wszystkie opcje sortowania, filtrowania i wyświetlania + układ, który wybrałeś dla tego widoku, zostaną trwale usunięte bez możliwości przywrócenia.",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "Zmień e-mail",
        description: "Wpisz nowy adres e-mail, aby otrzymać link weryfikacyjny.",
        toasts: {
          success_title: "Sukces!",
          success_message: "E-mail zaktualizowano. Zaloguj się ponownie.",
        },
        form: {
          email: {
            label: "Nowy e-mail",
            placeholder: "Wpisz swój e-mail",
            errors: {
              required: "E-mail jest wymagany",
              invalid: "E-mail jest nieprawidłowy",
              exists: "E-mail już istnieje. Użyj innego.",
              validation_failed: "Weryfikacja e-maila nie powiodła się. Spróbuj ponownie.",
            },
          },
          code: {
            label: "Unikalny kod",
            placeholder: "123456",
            helper_text: "Kod weryfikacyjny wysłano na nowy e-mail.",
            errors: {
              required: "Unikalny kod jest wymagany",
              invalid: "Nieprawidłowy kod weryfikacyjny. Spróbuj ponownie.",
            },
          },
        },
        actions: {
          continue: "Kontynuuj",
          confirm: "Potwierdź",
          cancel: "Anuluj",
        },
        states: {
          sending: "Wysyłanie…",
        },
      },
    },
    notifications: {
      select_default_view: "Wybierz widok domyślny",
      compact: "Kompaktowy",
      full: "Pełny ekran",
    },
  },
  workspace_settings: {
    label: "Ustawienia przestrzeni roboczej",
    page_label: "{workspace} - Ustawienia ogólne",
    key_created: "Klucz utworzony",
    copy_key:
      "Skopiuj i zapisz ten klucz w Plane Pages. Po zamknięciu nie będzie widoczny ponownie. Plik CSV z kluczem został pobrany.",
    token_copied: "Token skopiowano do schowka.",
    settings: {
      general: {
        title: "Ogólne",
        upload_logo: "Prześlij logo",
        edit_logo: "Edytuj logo",
        name: "Nazwa przestrzeni roboczej",
        company_size: "Rozmiar firmy",
        url: "URL przestrzeni roboczej",
        workspace_timezone: "Strefa czasowa przestrzeni roboczej",
        update_workspace: "Zaktualizuj przestrzeń",
        delete_workspace: "Usuń tę przestrzeń",
        delete_workspace_description:
          "Usunięcie przestrzeni spowoduje wymazanie wszystkich danych i zasobów. Ta akcja jest nieodwracalna.",
        delete_btn: "Usuń przestrzeń",
        delete_modal: {
          title: "Czy na pewno chcesz usunąć tę przestrzeń?",
          description: "Masz aktywną wersję próbną. Najpierw ją anuluj.",
          dismiss: "Zamknij",
          cancel: "Anuluj wersję próbną",
          success_title: "Przestrzeń usunięta.",
          success_message: "Zostaniesz przekierowany do profilu.",
          error_title: "Nie udało się.",
          error_message: "Spróbuj ponownie.",
        },
        errors: {
          name: {
            required: "Nazwa jest wymagana",
            max_length: "Nazwa przestrzeni nie może przekraczać 80 znaków",
          },
          company_size: {
            required: "Rozmiar firmy jest wymagany",
          },
        },
      },
      members: {
        title: "Członkowie",
        add_member: "Dodaj członka",
        pending_invites: "Oczekujące zaproszenia",
        invitations_sent_successfully: "Zaproszenia wysłano pomyślnie",
        leave_confirmation: "Czy na pewno chcesz opuścić przestrzeń? Stracisz dostęp. Ta akcja jest nieodwracalna.",
        details: {
          full_name: "Imię i nazwisko",
          display_name: "Nazwa wyświetlana",
          email_address: "Adres e-mail",
          account_type: "Typ konta",
          authentication: "Uwierzytelnianie",
          joining_date: "Data dołączenia",
        },
        modal: {
          title: "Zaproś współpracowników",
          description: "Zaproś osoby do współpracy.",
          button: "Wyślij zaproszenia",
          button_loading: "Wysyłanie zaproszeń",
          placeholder: "imię@firma.pl",
          errors: {
            required: "Wymagany jest adres e-mail.",
            invalid: "E-mail jest nieprawidłowy",
          },
        },
      },
      billing_and_plans: {
        title: "Rozliczenia i plany",
        current_plan: "Obecny plan",
        free_plan: "Używasz bezpłatnego planu",
        view_plans: "Wyświetl plany",
      },
      exports: {
        title: "Eksporty",
        exporting: "Eksportowanie",
        previous_exports: "Poprzednie eksporty",
        export_separate_files: "Eksportuj dane do oddzielnych plików",
        filters_info: "Zastosuj filtry, aby wyeksportować określone elementy robocze według Twoich kryteriów.",
        modal: {
          title: "Eksport do",
          toasts: {
            success: {
              title: "Eksport zakończony sukcesem",
              message: "Wyeksportowane {entity} można pobrać z poprzednich eksportów.",
            },
            error: {
              title: "Eksport nie powiódł się",
              message: "Spróbuj ponownie.",
            },
          },
        },
      },
      webhooks: {
        title: "Webhooki",
        add_webhook: "Dodaj webhook",
        modal: {
          title: "Utwórz webhook",
          details: "Szczegóły webhooka",
          payload: "URL payloadu",
          question: "Które zdarzenia mają uruchamiać ten webhook?",
          error: "URL jest wymagany",
        },
        secret_key: {
          title: "Klucz tajny",
          message: "Wygeneruj token do logowania webhooka",
        },
        options: {
          all: "Wysyłaj wszystko",
          individual: "Wybierz pojedyncze zdarzenia",
        },
        toasts: {
          created: {
            title: "Webhook utworzony",
            message: "Webhook został pomyślnie utworzony",
          },
          not_created: {
            title: "Webhook nie został utworzony",
            message: "Nie udało się utworzyć webhooka",
          },
          updated: {
            title: "Webhook zaktualizowany",
            message: "Webhook został pomyślnie zaktualizowany",
          },
          not_updated: {
            title: "Aktualizacja webhooka nie powiodła się",
            message: "Nie udało się zaktualizować webhooka",
          },
          removed: {
            title: "Webhook usunięty",
            message: "Webhook został pomyślnie usunięty",
          },
          not_removed: {
            title: "Usunięcie webhooka nie powiodło się",
            message: "Nie udało się usunąć webhooka",
          },
          secret_key_copied: {
            message: "Klucz tajny skopiowany do schowka.",
          },
          secret_key_not_copied: {
            message: "Błąd podczas kopiowania klucza.",
          },
        },
      },
      api_tokens: {
        heading: "Tokeny API",
        description: "Generuj bezpieczne tokeny API, aby integrować swoje dane z zewnętrznymi systemami i aplikacjami.",
        title: "Tokeny API",
        add_token: "Dodaj token dostępu",
        create_token: "Utwórz token",
        never_expires: "Nigdy nie wygasa",
        generate_token: "Wygeneruj token",
        generating: "Generowanie",
        delete: {
          title: "Usuń token API",
          description: "Aplikacje używające tego tokena stracą dostęp. Ta akcja jest nieodwracalna.",
          success: {
            title: "Sukces!",
            message: "Token pomyślnie usunięto",
          },
          error: {
            title: "Błąd!",
            message: "Usunięcie tokena nie powiodło się",
          },
        },
      },
      integrations: {
        title: "Integracje",
        page_title: "Pracuj ze swoimi danymi Plane w dostępnych aplikacjach lub we własnych.",
        page_description: "Zobacz wszystkie integracje używane przez tę przestrzeń roboczą lub przez Ciebie.",
      },
      imports: {
        title: "Importy",
      },
      worklogs: {
        title: "Logi pracy",
      },
      group_syncing: {
        title: "Synchronizacja grup",
        heading: "Synchronizacja grup",
        description:
          "Połącz grupy dostawcy tożsamości z projektami i rolami. Dostęp użytkowników jest automatycznie aktualizowany przy zmianach członkostwa w grupie w Twoim IdP, upraszczając onboardingu i offboarding.",
        enable: {
          title: "Włącz synchronizację grup",
          description: "Automatycznie dodawaj użytkowników do projektów na podstawie grup dostawcy tożsamości.",
        },
        config: {
          title: "Skonfiguruj synchronizację grup",
          description: "Ustaw, jak grupy dostawcy tożsamości są mapowane na projekty i role.",
          sync_on_login: {
            title: "Synchronizacja przy logowaniu",
            description: "Aktualizuj członkostwo w grupie i dostęp do projektu przy logowaniu użytkownika.",
          },
          sync_offline: {
            title: "Synchronizacja offline",
            description:
              "Uruchamia synchronizację co sześć godzin automatycznie, bez czekania na logowanie użytkowników.",
          },
          auto_remove: {
            title: "Automatyczne usuwanie",
            description: "Automatycznie usuwaj użytkowników z projektów, gdy nie pasują już do grupy.",
          },
          group_attribute_key: {
            title: "Klucz atrybutu grupy",
            description: "Atrybut dostawcy tożsamości używany do identyfikacji i synchronizacji grup użytkowników.",
            placeholder: "Grupy",
          },
        },
        group_mapping: {
          title: "Mapowanie grup",
          description: "Połącz grupy dostawcy tożsamości z projektami i rolami.",
          button_text: "Dodaj nową synchronizację grupy",
        },
        toast: {
          updating: "Aktualizowanie funkcji synchronizacji grup",
          success: "Funkcja synchronizacji grup została pomyślnie zaktualizowana.",
          error: "Nie udało się zaktualizować funkcji synchronizacji grup!",
        },
        delete_modal: {
          title: "Usuń synchronizację grupy",
          content:
            "Nowi użytkownicy z tej grupy tożsamości nie będą już dodawani do projektu. Już dodani użytkownicy zachowają swoją obecną rolę.",
        },
        modal: {
          idp_group_name: {
            text: "Grupa użytkowników",
            required: "Grupa użytkowników jest wymagana",
            placeholder: "Wprowadź nazwy grup IdP",
          },
          project: {
            text: "Projekt",
            required: "Projekt jest wymagany",
            placeholder: "Wybierz projekt",
          },
          default_role: {
            text: "Rola projektu",
            required: "Rola projektu jest wymagana",
            placeholder: "Wybierz rolę projektu",
          },
        },
      },
      identity: {
        title: "Tożsamość",
        heading: "Tożsamość",
        description: "Skonfiguruj swoją domenę i włącz logowanie jednokrotne",
      },
      project_states: {
        title: "Stany projektu",
      },
      projects: {
        title: "Projekty",
        description: "Zarządzaj stanami projektów, włączaj etykiety projektów i inne konfiguracje.",
        tabs: {
          states: "Stany projektu",
          labels: "Etykiety projektu",
        },
      },
      teamspaces: {
        title: "Przestrzenie zespołu",
      },
      initiatives: {
        title: "Inicjatywy",
      },
      customers: {
        title: "Klienci",
      },
      releases: {
        title: "Wydania",
        update_release: "Zaktualizuj wydanie",
        create_release: "Utwórz wydanie",
        errors: {
          release_not_found: "Szukane wydanie nie istnieje.",
          unknown: "Coś poszło nie tak. Spróbuj ponownie.",
        },
      },

      cancel_trial: {
        title: "Najpierw anuluj swój okres próbny.",
        description:
          "Masz aktywny okres próbny jednego z naszych płatnych planów. Proszę najpierw go anulować, aby kontynuować.",
        dismiss: "Odrzuć",
        cancel: "Anuluj okres próbny",
        cancel_success_title: "Okres próbny anulowany.",
        cancel_success_message: "Teraz możesz usunąć workspace.",
        cancel_error_title: "To nie zadziałało.",
        cancel_error_message: "Spróbuj ponownie, proszę.",
      },
      applications: {
        title: "Aplikacje",
        applicationId_copied: "ID aplikacji skopiowane do schowka",
        clientId_copied: "ID klienta skopiowane do schowka",
        clientSecret_copied: "Sekret klienta skopiowany do schowka",
        third_party_apps: "Aplikacje zewnętrzne",
        your_apps: "Twoje aplikacje",
        connect: "Połącz",
        connected: "Połączono",
        install: "Zainstaluj",
        installed: "Zainstalowano",
        configure: "Konfiguruj",
        app_available: "Udostępniłeś tę aplikację do użytku z przestrzenią roboczą Plane",
        app_available_description: "Połącz przestrzeń roboczą Plane, aby rozpocząć korzystanie",
        client_id_and_secret: "ID i Sekret Klienta",
        client_id_and_secret_description:
          "Skopiuj i zapisz ten klucz sekretny. Nie będziesz mógł zobaczyć tego klucza po kliknięciu Zamknij.",
        client_id_and_secret_download: "Możesz pobrać CSV z kluczem stąd.",
        application_id: "ID Aplikacji",
        client_id: "ID Klienta",
        client_secret: "Sekret Klienta",
        export_as_csv: "Eksportuj jako CSV",
        slug_already_exists: "Slug już istnieje",
        failed_to_create_application: "Nie udało się utworzyć aplikacji",
        upload_logo: "Prześlij Logo",
        app_name_title: "Jak nazwiesz tę aplikację",
        app_name_error: "Nazwa aplikacji jest wymagana",
        app_short_description_title: "Podaj krótki opis tej aplikacji",
        app_short_description_error: "Krótki opis aplikacji jest wymagany",
        app_description_title: {
          label: "Długi opis",
          placeholder: "Napisz długi opis dla marketplace. Naciśnij '/', aby zobaczyć polecenia.",
        },
        authorization_grant_type: {
          title: "Typ połączenia",
          description:
            "Wybierz, czy Twoja aplikacja ma być zainstalowana raz dla obszaru roboczego, czy pozwolić każdemu użytkownikowi na połączenie własnego konta",
        },
        app_description_error: "Opis aplikacji jest wymagany",
        app_slug_title: "Slug aplikacji",
        app_slug_error: "Slug aplikacji jest wymagany",
        app_maker_title: "Twórca aplikacji",
        app_maker_error: "Twórca aplikacji jest wymagany",
        webhook_url_title: "URL Webhooka",
        webhook_url_error: "URL webhooka jest wymagany",
        invalid_webhook_url_error: "Nieprawidłowy URL webhooka",
        redirect_uris_title: "URI przekierowania",
        redirect_uris_error: "URI przekierowania są wymagane",
        invalid_redirect_uris_error: "Nieprawidłowe URI przekierowania",
        redirect_uris_description:
          "Wprowadź URI oddzielone spacjami, gdzie aplikacja przekieruje po użytkowniku, np. https://example.com https://example.com/",
        authorized_javascript_origins_title: "Autoryzowane źródła JavaScript",
        authorized_javascript_origins_error: "Autoryzowane źródła JavaScript są wymagane",
        invalid_authorized_javascript_origins_error: "Nieprawidłowe autoryzowane źródła JavaScript",
        authorized_javascript_origins_description:
          "Wprowadź źródła oddzielone spacjami, z których aplikacja będzie mogła wysyłać żądania, np. app.com example.com",
        create_app: "Utwórz aplikację",
        update_app: "Aktualizuj aplikację",
        regenerate_client_secret_description:
          "Wygeneruj ponownie sekret klienta. Po regeneracji możesz skopiować klucz lub pobrać go do pliku CSV.",
        regenerate_client_secret: "Wygeneruj ponownie sekret klienta",
        regenerate_client_secret_confirm_title: "Czy na pewno chcesz wygenerować ponownie sekret klienta?",
        regenerate_client_secret_confirm_description:
          "Aplikacja używająca tego sekretu przestanie działać. Będziesz musiał zaktualizować sekret w aplikacji.",
        regenerate_client_secret_confirm_cancel: "Anuluj",
        regenerate_client_secret_confirm_regenerate: "Wygeneruj ponownie",
        read_only_access_to_workspace: "Dostęp tylko do odczytu do Twojej przestrzeni roboczej",
        write_access_to_workspace: "Dostęp do zapisu do Twojej przestrzeni roboczej",
        read_only_access_to_user_profile: "Dostęp tylko do odczytu do Twojego profilu użytkownika",
        write_access_to_user_profile: "Dostęp do zapisu do Twojego profilu użytkownika",
        connect_app_to_workspace: "Połącz {app} z Twoją przestrzenią roboczą {workspace}",
        user_permissions: "Uprawnienia użytkownika",
        user_permissions_description:
          "Uprawnienia użytkownika są używane do przyznawania dostępu do profilu użytkownika.",
        workspace_permissions: "Uprawnienia przestrzeni roboczej",
        workspace_permissions_description:
          "Uprawnienia przestrzeni roboczej są używane do przyznawania dostępu do przestrzeni roboczej.",
        with_the_permissions: "z uprawnieniami",
        app_consent_title: "{app} prosi o dostęp do Twojej przestrzeni roboczej i profilu Plane.",
        choose_workspace_to_connect_app_with: "Wybierz przestrzeń roboczą, z którą chcesz połączyć aplikację",
        app_consent_workspace_permissions_title: "{app} chciałby",
        app_consent_user_permissions_title:
          "{app} może również poprosić o uprawnienia użytkownika do następujących zasobów. Te uprawnienia będą wymagane i autoryzowane tylko przez użytkownika.",
        app_consent_accept_title: "Akceptując",
        app_consent_accept_1:
          "Udzielasz aplikacji dostępu do Twoich danych Plane wszędzie tam, gdzie możesz używać aplikacji w lub poza Plane",
        app_consent_accept_2: "Zgadzasz się na Politykę Prywatności i Warunki Użytkowania {app}",
        accepting: "Akceptowanie...",
        accept: "Akceptuj",
        categories: "Kategorie",
        select_app_categories: "Wybierz kategorie aplikacji",
        categories_title: "Kategorie",
        categories_error: "Kategorie są wymagane",
        invalid_categories_error: "Nieprawidłowe kategorie",
        categories_description: "Wybierz kategorie, które najlepiej opisują aplikację",
        supported_plans: "Obsługiwane Plany",
        supported_plans_description:
          "Wybierz plany obszaru roboczego, które mogą zainstalować tę aplikację. Pozostaw puste, aby zezwolić na wszystkie plany.",
        select_plans: "Wybierz Plany",
        privacy_policy_url_title: "URL Polityki Prywatności",
        privacy_policy_url_error: "URL Polityki Prywatności jest wymagany",
        invalid_privacy_policy_url_error: "Nieprawidłowy URL Polityki Prywatności",
        terms_of_service_url_title: "URL Warunków Użytkowania",
        terms_of_service_url_error: "URL Warunków Użytkowania jest wymagany",
        invalid_terms_of_service_url_error: "Nieprawidłowy URL Warunków Użytkowania",
        support_url_title: "URL Obsługi",
        support_url_error: "URL Obsługi jest wymagany",
        invalid_support_url_error: "Nieprawidłowy URL Obsługi",
        video_url_title: "URL Filmu",
        video_url_error: "URL Filmu jest wymagany",
        invalid_video_url_error: "Nieprawidłowy URL Filmu",
        setup_url_title: "URL Konfiguracji",
        setup_url_error: "URL Konfiguracji jest wymagany",
        invalid_setup_url_error: "Nieprawidłowy URL Konfiguracji",
        configuration_url_title: "URL Konfiguracji",
        configuration_url_error: "URL Konfiguracji jest wymagany",
        invalid_configuration_url_error: "Nieprawidłowy URL Konfiguracji",
        contact_email_title: "Email kontaktu",
        contact_email_error: "Email kontaktu jest wymagany",
        invalid_contact_email_error: "Nieprawidłowy email kontaktu",
        upload_attachments: "Prześlij załączniki",
        uploading_images: "Przesyłanie {count} obrazu{count, plural, one {s} other {s}}",
        drop_images_here: "Rzucaj obrazy tutaj",
        click_to_upload_images: "Kliknij, aby przesłać obrazy",
        invalid_file_or_exceeds_size_limit: "Nieprawidłowy plik lub przekracza limit rozmiaru ({size} MB)",
        uploading: "Przesyłanie...",
        upload_and_save: "Prześlij i zapisz",
        app_credentials_regenrated: {
          title: "Dane uwierzytelniające aplikacji zostały pomyślnie wygenerowane ponownie",
          description: "Zastąp sekret klienta wszędzie tam, gdzie jest używany. Poprzedni sekret nie jest już ważny.",
        },
        app_created: {
          title: "Aplikacja została pomyślnie utworzona",
          description: "Użyj danych uwierzytelniających, aby zainstalować aplikację w przestrzeni roboczej Plane",
        },
        installed_apps: "Zainstalowane aplikacje",
        all_apps: "Wszystkie aplikacje",
        internal_apps: "Aplikacje wewnętrzne",
        website: {
          title: "Strona internetowa",
          description: "Link do strony internetowej Twojej aplikacji.",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "Twórca aplikacji",
          description: "Osoba lub organizacja tworząca aplikację.",
        },
        setup_url: {
          label: "URL konfiguracji",
          description: "Użytkownicy zostaną przekierowani na ten adres URL po zainstalowaniu aplikacji.",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "URL webhooka",
          description:
            "Tutaj będziemy wysyłać zdarzenia webhook i aktualizacje z przestrzeni roboczych, w których zainstalowano Twoją aplikację.",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "URI przekierowań (oddzielone spacją)",
          description: "Użytkownicy zostaną przekierowani na tę ścieżkę po uwierzytelnieniu się w Plane.",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "Aplikacja może być zainstalowana dopiero po tym, jak administrator workspace ją zainstaluje. Skontaktuj się z administratorem workspace, aby kontynuować.",
        enable_app_mentions: "Włącz wzmianki o aplikacji",
        enable_app_mentions_tooltip:
          "Po włączeniu tej opcji użytkownicy mogą wspominać lub przypisywać elementy pracy do tej aplikacji.",
        scopes: "Zakresy",
        select_scopes: "Wybierz zakresy",
        read_access_to: "Dostęp tylko do odczytu do",
        write_access_to: "Dostęp do zapisu do",
        global_permission_expiration:
          "Zakresy globalne wkrótce wygasną. Zamiast tego używaj zakresów szczegółowych. Na przykład użyj project:read zamiast globalnego odczytu.",
        selected_scopes: "{count} wybranych",
        scopes_and_permissions: "Zakresy i uprawnienia",
        read: "Odczyt",
        write: "Zapis",
        scope_description: {
          projects: "Dostęp do projektów i wszystkich powiązanych encji",
          wiki: "Dostęp do wiki i wszystkich powiązanych encji",
          customers: "Dostęp do klientów i wszystkich powiązanych encji",
          initiatives: "Dostęp do inicjatyw i wszystkich powiązanych encji",
          workspaces: "Dostęp do obszarów roboczych i wszystkich powiązanych encji",
          stickies: "Dostęp do notatek i wszystkich powiązanych encji",
          teamspaces: "Dostęp do przestrzeni zespołowych i wszystkich powiązanych encji",
          profile: "Dostęp do informacji o profilu użytkownika",
          agents: "Dostęp do agentów i wszystkich powiązanych encji",
          assets: "Dostęp do zasobów i wszystkich powiązanych encji",
        },
        build_your_own_app: "Zbuduj własną aplikację",
        edit_app_details: "Edytuj szczegóły aplikacji",
        internal: "Wewnętrzny",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description:
          "Twoja praca staje się inteligentniejsza i szybsza dzięki AI, która jest natywnie połączona z Twoją pracą i bazą wiedzy.",
      },
    },
    empty_state: {
      api_tokens: {
        title: "Brak tokenów API",
        description: "Używaj API, aby zintegrować Plane z zewnętrznymi systemami.",
      },
      webhooks: {
        title: "Brak webhooków",
        description: "Utwórz webhooki, aby zautomatyzować działania.",
      },
      exports: {
        title: "Brak eksportów",
        description: "Znajdziesz tu historię swoich eksportów.",
      },
      imports: {
        title: "Brak importów",
        description: "Znajdziesz tu historię swoich importów.",
      },
    },
  },
  profile: {
    label: "Profil",
    page_label: "Twoja praca",
    work: "Praca",
    details: {
      joined_on: "Dołączył(a) dnia",
      time_zone: "Strefa czasowa",
    },
    stats: {
      workload: "Obciążenie",
      overview: "Przegląd",
      created: "Utworzone elementy",
      assigned: "Przypisane elementy",
      subscribed: "Subskrybowane elementy",
      state_distribution: {
        title: "Elementy według stanu",
        empty: "Twórz elementy, aby móc analizować stany.",
      },
      priority_distribution: {
        title: "Elementy według priorytetu",
        empty: "Twórz elementy, aby móc analizować priorytety.",
      },
      recent_activity: {
        title: "Ostatnia aktywność",
        empty: "Brak aktywności.",
        button: "Pobierz dzisiejszą aktywność",
        button_loading: "Pobieranie",
      },
    },
    actions: {
      profile: "Profil",
      security: "Bezpieczeństwo",
      activity: "Aktywność",
      appearance: "Wygląd",
      notifications: "Powiadomienia",
      connections: "Połączenia",
    },
    tabs: {
      summary: "Podsumowanie",
      assigned: "Przypisane",
      created: "Utworzone",
      subscribed: "Subskrybowane",
      activity: "Aktywność",
    },
    empty_state: {
      activity: {
        title: "Brak aktywności",
        description: "Utwórz element pracy, aby zacząć.",
      },
      assigned: {
        title: "Brak przypisanych elementów pracy",
        description: "Tutaj zobaczysz elementy pracy przypisane do Ciebie.",
      },
      created: {
        title: "Brak utworzonych elementów pracy",
        description: "Tutaj są elementy pracy, które utworzyłeś(aś).",
      },
      subscribed: {
        title: "Brak subskrybowanych elementów pracy",
        description: "Subskrybuj interesujące Cię elementy pracy, a pojawią się tutaj.",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "Wpisz ID projektu",
      please_select_a_timezone: "Wybierz strefę czasową",
      archive_project: {
        title: "Archiwizuj projekt",
        description: "Archiwizacja ukryje projekt w menu. Dostęp będzie możliwy przez stronę projektów.",
        button: "Archiwizuj projekt",
      },
      delete_project: {
        title: "Usuń projekt",
        description: "Usunięcie projektu spowoduje trwałe wymazanie wszystkich danych. Ta akcja jest nieodwracalna.",
        button: "Usuń projekt",
      },
      toast: {
        success: "Projekt zaktualizowano",
        error: "Aktualizacja nie powiodła się. Spróbuj ponownie.",
      },
    },
    members: {
      label: "Członkowie",
      project_lead: "Lider projektu",
      default_assignee: "Domyślnie przypisany",
      guest_super_permissions: {
        title: "Nadaj gościom dostęp do wszystkich elementów:",
        sub_heading: "Goście zobaczą wszystkie elementy w projekcie.",
      },
      invite_members: {
        title: "Zaproś członków",
        sub_heading: "Zaproś członków do projektu.",
        select_co_worker: "Wybierz współpracownika",
      },
      project_lead_description: "Wybierz lidera projektu.",
      default_assignee_description: "Wybierz domyślnego przypisanego do projektu.",
      project_subscribers: "Subskrybenci projektu",
      project_subscribers_description:
        "Wybierz członków, którzy będą otrzymywać powiadomienia dotyczące tego projektu.",
    },
    states: {
      describe_this_state_for_your_members: "Opisz ten stan członkom projektu.",
      empty_state: {
        title: "Brak stanów w grupie {groupKey}",
        description: "Utwórz nowy stan",
      },
    },
    labels: {
      label_title: "Nazwa etykiety",
      label_title_is_required: "Nazwa etykiety jest wymagana",
      label_max_char: "Nazwa etykiety nie może mieć więcej niż 255 znaków",
      toast: {
        error: "Błąd podczas aktualizacji etykiety",
      },
    },
    estimates: {
      label: "Szacunki",
      title: "Włącz szacunki dla mojego projektu",
      description: "Pomagają w komunikacji o złożoności i obciążeniu zespołu.",
      no_estimate: "Bez szacunku",
      new: "Nowy system szacowania",
      create: {
        custom: "Niestandardowy",
        start_from_scratch: "Zacznij od zera",
        choose_template: "Wybierz szablon",
        choose_estimate_system: "Wybierz system szacowania",
        enter_estimate_point: "Wprowadź punkt szacunkowy",
        step: "Krok {step} z {total}",
        label: "Utwórz szacunek",
      },
      toasts: {
        created: {
          success: {
            title: "Utworzono szacunek",
            message: "Szacunek został utworzony pomyślnie",
          },
          error: {
            title: "Błąd tworzenia szacunku",
            message: "Nie udało się utworzyć nowego szacunku, spróbuj ponownie.",
          },
        },
        updated: {
          success: {
            title: "Zaktualizowano szacunek",
            message: "Szacunek został zaktualizowany w Twoim projekcie.",
          },
          error: {
            title: "Błąd aktualizacji szacunku",
            message: "Nie udało się zaktualizować szacunku, spróbuj ponownie",
          },
        },
        enabled: {
          success: {
            title: "Sukces!",
            message: "Szacunki zostały włączone.",
          },
        },
        disabled: {
          success: {
            title: "Sukces!",
            message: "Szacunki zostały wyłączone.",
          },
          error: {
            title: "Błąd!",
            message: "Nie udało się wyłączyć szacunków. Spróbuj ponownie",
          },
        },
        reorder: {
          success: {
            title: "Szacunki zostały przestawione",
            message: "Szacunki zostały przestawione w Twoim projekcie.",
          },
          error: {
            title: "Nie udało się przestawić szacunków",
            message: "Nie mogliśmy przestawić szacunków, spróbuj ponownie",
          },
        },
      },
      validation: {
        min_length: "Punkt szacunkowy musi być większy niż 0.",
        unable_to_process: "Nie możemy przetworzyć Twojego żądania, spróbuj ponownie.",
        numeric: "Punkt szacunkowy musi być wartością liczbową.",
        character: "Punkt szacunkowy musi być znakiem.",
        empty: "Wartość szacunku nie może być pusta.",
        already_exists: "Wartość szacunku już istnieje.",
        unsaved_changes: "Masz niezapisane zmiany. Zapisz je przed kliknięciem 'gotowe'",
        remove_empty:
          "Szacunek nie może być pusty. Wprowadź wartość w każde pole lub usuń te, dla których nie masz wartości.",
        fill: "Proszę wypełnić to pole szacowania",
        repeat: "Wartość szacowania nie może się powtarzać",
      },
      systems: {
        points: {
          label: "Punkty",
          fibonacci: "Fibonacci",
          linear: "Liniowy",
          squares: "Kwadraty",
          custom: "Własny",
        },
        categories: {
          label: "Kategorie",
          t_shirt_sizes: "Rozmiary koszulek",
          easy_to_hard: "Od łatwego do trudnego",
          custom: "Własne",
        },
        time: {
          label: "Czas",
          hours: "Godziny",
        },
      },
      edit: {
        title: "Edytuj system szacowania",
        add_or_update: {
          title: "Dodaj, zaktualizuj lub usuń szacunki",
          description:
            "Zarządzaj obecnym systemem poprzez dodawanie, aktualizowanie lub usuwanie punktów lub kategorii.",
        },
        switch: {
          title: "Zmień typ szacowania",
          description: "Przekształć system punktowy na system kategorii i odwrotnie.",
        },
      },
      switch: "Przełącz system szacowania",
      current: "Obecny system szacowania",
      select: "Wybierz system szacowania",
    },
    automations: {
      label: "Automatyzacja",
      "auto-archive": {
        title: "Automatyczna archiwizacja zamkniętych elementów",
        description: "Plane będzie automatycznie archiwizował elementy, które zostały ukończone lub anulowane.",
        duration: "Archiwizuj elementy zamknięte dłużej niż",
      },
      "auto-close": {
        title: "Automatyczne zamykanie elementów",
        description: "Plane będzie automatycznie zamykał elementy, które nie zostały ukończone lub anulowane.",
        duration: "Zamknij elementy nieaktywne dłużej niż",
        auto_close_status: "Status automatycznego zamknięcia",
      },
      "auto-remind": {
        title: "Automatyczne przypomnienia",
        description:
          "Plane automatycznie wysyła przypomnienia przez e-mail i powiadomienia w aplikacji, aby Twoja ekipa utrzymała się na ścieżce do terminów.",
        duration: "Wyślij przypomnienie przed",
      },
    },
    empty_state: {
      labels: {
        title: "Brak etykiet",
        description: "Utwórz etykiety, aby organizować elementy pracy.",
      },
      estimates: {
        title: "Brak systemów szacowania",
        description: "Utwórz system szacowania, aby komunikować obciążenie.",
        primary_button: "Dodaj system szacowania",
      },
      integrations: {
        title: "Brak skonfigurowanych integracji",
        description: "Skonfiguruj GitHub i inne integracje, aby synchronizować elementy pracy projektu.",
      },
    },
    initiatives: {
      heading: "Inicjatywy",
      sub_heading: "Odblokuj najwyższy poziom organizacji dla całej swojej pracy w Plane.",
      title: "Włącz Inicjatywy",
      description: "Ustaw większe cele, aby monitorować postęp",
      toast: {
        updating: "Aktualizowanie funkcji inicjatyw",
        enable_success: "Funkcja inicjatyw włączona pomyślnie.",
        disable_success: "Funkcja inicjatyw wyłączona pomyślnie.",
        error: "Nie udało się zaktualizować funkcji inicjatyw!",
      },
    },
    customers: {
      heading: "Klienci",
      settings_heading: "Zarządzaj pracą według tego, co jest ważne dla Twoich klientów.",
      settings_sub_heading:
        "Przenieś prośby klientów do elementów pracy, przypisz priorytet według próśb i zbierz stany elementów pracy w rejestrach klientów. Wkrótce zaintregujesz się z CRM lub narzędziem wsparcia, aby jeszcze lepiej zarządzać pracą według atrybutów klienta.",
    },
    epics: {
      properties: {
        title: "Właściwości",
        description: "Dodaj niestandardowe właściwości do swojego epiku.",
      },
      disabled: "Wyłączone",
    },
    cycles: {
      auto_schedule: {
        heading: "Automatyczne planowanie cykli",
        description: "Utrzymuj cykle w ruchu bez ręcznej konfiguracji.",
        tooltip: "Automatycznie twórz nowe cykle na podstawie wybranego harmonogramu.",
        edit_button: "Edytuj",
        form: {
          cycle_title: {
            label: "Tytuł cyklu",
            placeholder: "Tytuł",
            tooltip: "Tytuł zostanie uzupełniony o numery dla kolejnych cykli. Na przykład: Projekt - 1/2/3",
            validation: {
              required: "Tytuł cyklu jest wymagany",
              max_length: "Tytuł nie może przekraczać 255 znaków",
            },
          },
          cycle_duration: {
            label: "Czas trwania cyklu",
            unit: "Tygodnie",
            validation: {
              required: "Czas trwania cyklu jest wymagany",
              min: "Czas trwania cyklu musi wynosić co najmniej 1 tydzień",
              max: "Czas trwania cyklu nie może przekraczać 30 tygodni",
              positive: "Czas trwania cyklu musi być dodatni",
            },
          },
          cooldown_period: {
            label: "Okres ochłodzenia",
            unit: "dni",
            tooltip: "Przerwa między cyklami przed rozpoczęciem następnego.",
            validation: {
              required: "Okres ochłodzenia jest wymagany",
              negative: "Okres ochłodzenia nie może być ujemny",
            },
          },
          start_date: {
            label: "Dzień rozpoczęcia cyklu",
            validation: {
              required: "Data rozpoczęcia jest wymagana",
              past: "Data rozpoczęcia nie może być w przeszłości",
            },
          },
          number_of_cycles: {
            label: "Liczba przyszłych cykli",
            validation: {
              required: "Liczba cykli jest wymagana",
              min: "Wymagany jest co najmniej 1 cykl",
              max: "Nie można zaplanować więcej niż 3 cykle",
            },
          },
          auto_rollover: {
            label: "Automatyczne przenoszenie elementów pracy",
            tooltip: "W dniu zakończenia cyklu przenieś wszystkie niedokończone elementy pracy do następnego cyklu.",
          },
        },
        toast: {
          toggle: {
            loading_enable: "Włączanie automatycznego planowania cykli",
            loading_disable: "Wyłączanie automatycznego planowania cykli",
            success: {
              title: "Sukces!",
              message: "Automatyczne planowanie cykli zostało pomyślnie przełączone.",
            },
            error: {
              title: "Błąd!",
              message: "Nie udało się przełączyć automatycznego planowania cykli.",
            },
          },
          save: {
            loading: "Zapisywanie konfiguracji automatycznego planowania cykli",
            success: {
              title: "Sukces!",
              message_create: "Konfiguracja automatycznego planowania cykli została pomyślnie zapisana.",
              message_update: "Konfiguracja automatycznego planowania cykli została pomyślnie zaktualizowana.",
            },
            error: {
              title: "Błąd!",
              message_create: "Nie udało się zapisać konfiguracji automatycznego planowania cykli.",
              message_update: "Nie udało się zaktualizować konfiguracji automatycznego planowania cykli.",
            },
          },
        },
      },
    },
    features: {
      cycles: {
        title: "Cykle",
        short_title: "Cykle",
        description:
          "Planuj pracę w elastycznych okresach, które dostosowują się do unikalnego rytmu i tempa tego projektu.",
        toggle_title: "Włącz cykle",
        toggle_description: "Planuj pracę w skoncentrowanych ramach czasowych.",
      },
      modules: {
        title: "Moduły",
        short_title: "Moduły",
        description: "Organizuj pracę w podprojekty z dedykowanymi liderami i przypisanymi osobami.",
        toggle_title: "Włącz moduły",
        toggle_description: "Członkowie projektu będą mogli tworzyć i edytować moduły.",
      },
      views: {
        title: "Widoki",
        short_title: "Widoki",
        description: "Zapisuj niestandardowe sortowania, filtry i opcje wyświetlania lub udostępniaj je zespołowi.",
        toggle_title: "Włącz widoki",
        toggle_description: "Członkowie projektu będą mogli tworzyć i edytować widoki.",
      },
      pages: {
        title: "Strony",
        short_title: "Strony",
        description: "Twórz i edytuj dowolne treści: notatki, dokumenty, cokolwiek.",
        toggle_title: "Włącz strony",
        toggle_description: "Członkowie projektu będą mogli tworzyć i edytować strony.",
      },
      intake: {
        intake_responsibility: "Odpowiedzialność za przyjęcie",
        intake_sources: "Źródła przyjęć",
        title: "Odbiór",
        short_title: "Odbiór",
        description:
          "Pozwól osobom niebędącym członkami dzielić się błędami, opiniami i sugestiami; bez zakłócania przepływu pracy.",
        toggle_title: "Włącz odbiór",
        toggle_description: "Pozwól członkom projektu tworzyć żądania odbioru w aplikacji.",
        toggle_tooltip_on: "Poproś administratora projektu o włączenie.",
        toggle_tooltip_off: "Poproś administratora projektu o wyłączenie.",
        notify_assignee: {
          title: "Powiadom przypisanych",
          description: "Dla nowego żądania przyjęcia domyślni przypisani zostaną powiadomieni poprzez powiadomienia",
        },
        in_app: {
          title: "W aplikacji",
          description:
            "Otrzymuj nowe elementy pracy od członków i gości w obszarze roboczym bez zakłócania istniejących.",
        },
        email: {
          title: "E-mail",
          description: "Zbieraj nowe elementy pracy od każdego, kto wyśle e-mail na adres Plane.",
          fieldName: "ID e-mail",
        },
        form: {
          title: "Formularze",
          description:
            "Pozwól osobom spoza obszaru roboczego tworzyć potencjalne nowe elementy pracy przez dedykowany i bezpieczny formularz.",
          fieldName: "Domyślny URL formularza",
          create_forms: "Twórz formularze przy użyciu typów elementów pracy",
          manage_forms: "Zarządzaj formularzami",
          manage_forms_tooltip: "Poproś administratora obszaru roboczego o zarządzanie.",
          create_form: "Utwórz formularz",
          edit_form: "Edytuj szczegóły formularza",
          form_title: "Tytuł formularza",
          form_title_required: "Tytuł formularza jest wymagany",
          work_item_type: "Typ elementu pracy",
          remove_property: "Usuń właściwość",
          select_properties: "Wybierz właściwości",
          search_placeholder: "Szukaj właściwości",
          toasts: {
            success_create: "Formularz przyjęcia utworzony pomyślnie",
            success_update: "Formularz przyjęcia zaktualizowany pomyślnie",
            error_create: "Nie udało się utworzyć formularza przyjęcia",
            error_update: "Nie udało się zaktualizować formularza przyjęcia",
          },
        },
        toasts: {
          set: {
            loading: "Ustawianie przypisanych...",
            success: {
              title: "Sukces!",
              message: "Przypisani ustawieni pomyślnie.",
            },
            error: {
              title: "Błąd!",
              message: "Coś poszło nie tak podczas ustawiania przypisanych. Spróbuj ponownie.",
            },
          },
        },
      },
      time_tracking: {
        title: "Śledzenie czasu",
        short_title: "Śledzenie czasu",
        description: "Rejestruj czas spędzony nad elementami pracy i projektami.",
        toggle_title: "Włącz śledzenie czasu",
        toggle_description: "Członkowie projektu będą mogli rejestrować przepracowany czas.",
      },
      milestones: {
        title: "Kamienie milowe",
        short_title: "Kamienie milowe",
        description:
          "Kamienie milowe zapewniają warstwę do wyrównania elementów pracy w kierunku wspólnych dat zakończenia.",
        toggle_title: "Włącz kamienie milowe",
        toggle_description: "Organizuj elementy pracy według terminów kamieni milowych.",
      },
      toasts: {
        loading: "Aktualizowanie funkcji projektu...",
        success: "Funkcja projektu zaktualizowana pomyślnie.",
        error: "Coś poszło nie tak podczas aktualizacji funkcji projektu. Spróbuj ponownie.",
      },
    },
  },
  project_cycles: {
    add_cycle: "Dodaj cykl",
    more_details: "Więcej szczegółów",
    cycle: "Cykl",
    update_cycle: "Zaktualizuj cykl",
    create_cycle: "Utwórz cykl",
    no_matching_cycles: "Brak pasujących cykli",
    remove_filters_to_see_all_cycles: "Usuń filtry, aby wyświetlić wszystkie cykle",
    remove_search_criteria_to_see_all_cycles: "Usuń kryteria wyszukiwania, aby wyświetlić wszystkie cykle",
    only_completed_cycles_can_be_archived: "Można archiwizować tylko ukończone cykle",
    start_date: "Data początku",
    end_date: "Data końca",
    in_your_timezone: "W Twojej strefie czasowej",
    transfer_work_items: "Przenieś {count} elementów pracy",
    transfer: {
      no_cycles_available: "Brak innych cykli dostępnych do przeniesienia elementów pracy.",
    },
    date_range: "Zakres dat",
    add_date: "Dodaj datę",
    active_cycle: {
      label: "Aktywny cykl",
      progress: "Postęp",
      chart: "Wykres burndown",
      priority_issue: "Elementy o wysokim priorytecie",
      assignees: "Przypisani",
      issue_burndown: "Burndown elementów pracy",
      ideal: "Idealny",
      current: "Obecny",
      labels: "Etykiety",
      trailing: "Opóźnienie",
      leading: "Wyprzedzenie",
    },
    upcoming_cycle: {
      label: "Nadchodzący cykl",
    },
    completed_cycle: {
      label: "Ukończony cykl",
    },
    status: {
      days_left: "Pozostało dni",
      completed: "Ukończono",
      yet_to_start: "Jeszcze nierozpoczęty",
      in_progress: "W trakcie",
      draft: "Szkic",
    },
    action: {
      restore: {
        title: "Przywróć cykl",
        success: {
          title: "Cykl przywrócony",
          description: "Cykl został przywrócony.",
        },
        failed: {
          title: "Przywracanie nie powiodło się",
          description: "Nie udało się przywrócić cyklu.",
        },
      },
      favorite: {
        loading: "Dodawanie do ulubionych",
        success: {
          description: "Cykl dodano do ulubionych.",
          title: "Sukces!",
        },
        failed: {
          description: "Nie udało się dodać do ulubionych.",
          title: "Błąd!",
        },
      },
      unfavorite: {
        loading: "Usuwanie z ulubionych",
        success: {
          description: "Cykl usunięto z ulubionych.",
          title: "Sukces!",
        },
        failed: {
          description: "Nie udało się usunąć z ulubionych.",
          title: "Błąd!",
        },
      },
      update: {
        loading: "Aktualizowanie cyklu",
        success: {
          description: "Cykl zaktualizowano.",
          title: "Sukces!",
        },
        failed: {
          description: "Aktualizacja nie powiodła się.",
          title: "Błąd!",
        },
        error: {
          already_exists: "Cykl o tych datach już istnieje. Aby mieć szkic, usuń daty.",
        },
      },
    },
    empty_state: {
      general: {
        title: "Grupuj pracę w cykle.",
        description: "Ograniczaj pracę w czasie, śledź terminy i monitoruj postępy.",
        primary_button: {
          text: "Utwórz pierwszy cykl",
          comic: {
            title: "Cykle to powtarzalne okresy czasu.",
            description: "Sprint, iteracja lub inny okres, w którym śledzisz pracę.",
          },
        },
      },
      no_issues: {
        title: "Brak elementów w cyklu",
        description: "Dodaj elementy, które chcesz śledzić.",
        primary_button: {
          text: "Utwórz element",
        },
        secondary_button: {
          text: "Dodaj istniejący element",
        },
      },
      completed_no_issues: {
        title: "Brak elementów w cyklu",
        description: "Elementy zostały przeniesione lub ukryte. Aby je zobaczyć, zmień właściwości.",
      },
      active: {
        title: "Brak aktywnego cyklu",
        description: "Aktywny cykl obejmuje aktualną datę. Będzie wyświetlany tutaj.",
      },
      archived: {
        title: "Brak zarchiwizowanych cykli",
        description: "Archiwizuj ukończone cykle, aby zachować porządek.",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "Utwórz i przypisz element pracy",
        description: "Elementy to zadania, które przypisujesz sobie lub zespołowi. Śledź ich postęp.",
        primary_button: {
          text: "Utwórz pierwszy element",
          comic: {
            title: "Elementy to podstawowe zadania",
            description: "Przykłady: przeprojektowanie interfejsu, rebranding, nowy system.",
          },
        },
      },
      no_archived_issues: {
        title: "Brak zarchiwizowanych elementów",
        description: "Archiwizuj elementy ukończone lub anulowane. Skonfiguruj automatyzację.",
        primary_button: {
          text: "Skonfiguruj automatyzację",
        },
      },
      issues_empty_filter: {
        title: "Brak pasujących elementów",
        secondary_button: {
          text: "Wyczyść filtry",
        },
      },
    },
  },
  project_module: {
    add_module: "Dodaj moduł",
    update_module: "Zaktualizuj moduł",
    create_module: "Utwórz moduł",
    archive_module: "Archiwizuj moduł",
    restore_module: "Przywróć moduł",
    delete_module: "Usuń moduł",
    empty_state: {
      general: {
        title: "Grupuj etapy w moduły.",
        description: "Moduły grupują elementy pod wspólnym nadrzędnym celem. Śledź terminy i postępy.",
        primary_button: {
          text: "Utwórz pierwszy moduł",
          comic: {
            title: "Moduły grupują elementy hierarchicznie.",
            description: "Przykłady: moduł koszyka, podwozia, magazynu.",
          },
        },
      },
      no_issues: {
        title: "Brak elementów w module",
        description: "Dodaj elementy do modułu.",
        primary_button: {
          text: "Utwórz elementy",
        },
        secondary_button: {
          text: "Dodaj istniejący element",
        },
      },
      archived: {
        title: "Brak zarchiwizowanych modułów",
        description: "Archiwizuj moduły ukończone lub anulowane.",
      },
      sidebar: {
        in_active: "Moduł nie jest aktywny.",
        invalid_date: "Nieprawidłowa data. Wpisz prawidłową.",
      },
    },
    quick_actions: {
      archive_module: "Archiwizuj moduł",
      archive_module_description: "Można archiwizować tylko ukończone/anulowane moduły.",
      delete_module: "Usuń moduł",
    },
    toast: {
      copy: {
        success: "Link do modułu skopiowano",
      },
      delete: {
        success: "Moduł usunięto",
        error: "Nie udało się usunąć modułu",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "Zapisuj filtry jako widoki.",
        description: "Widoki to zapisane filtry zapewniające łatwy dostęp. Udostępnij je zespołowi.",
        primary_button: {
          text: "Utwórz pierwszy widok",
          comic: {
            title: "Widoki działają z właściwościami elementów pracy.",
            description: "Utwórz widok z żądanymi filtrami.",
          },
        },
      },
      filter: {
        title: "Brak pasujących widoków",
        description: "Utwórz nowy widok.",
      },
    },
    delete_view: {
      title: "Czy na pewno chcesz usunąć ten widok?",
      content:
        "Jeśli potwierdzisz, wszystkie opcje sortowania, filtrowania i wyświetlania + układ, który wybrałeś dla tego widoku, zostaną trwale usunięte bez możliwości przywrócenia.",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title: "Notuj, dokumentuj lub twórz bazę wiedzy. Użyj AI Galileo.",
        description: "Strony to obszar na Twoje myśli. Pisz, formatuj, osadzaj elementy i używaj komponentów.",
        primary_button: {
          text: "Utwórz pierwszą stronę",
        },
      },
      private: {
        title: "Brak prywatnych stron",
        description: "Przechowuj prywatne notatki. Udostępnij je później, gdy będziesz gotowy.",
        primary_button: {
          text: "Utwórz stronę",
        },
      },
      public: {
        title: "Brak publicznych stron",
        description: "Tutaj zobaczysz strony udostępnione w projekcie.",
        primary_button: {
          text: "Utwórz stronę",
        },
      },
      archived: {
        title: "Brak zarchiwizowanych stron",
        description: "Archiwizuj strony do późniejszego użytku.",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "Nie znaleziono wyników",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "Brak pasujących elementów",
      },
      no_issues: {
        title: "Brak elementów",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "Brak komentarzy",
        description: "Komentarze służą do dyskusji i śledzenia elementów.",
      },
    },
  },
  notification: {
    label: "Skrzynka",
    page_label: "{workspace} - Skrzynka",
    options: {
      mark_all_as_read: "Oznacz wszystko jako przeczytane",
      mark_read: "Oznacz jako przeczytane",
      mark_unread: "Oznacz jako nieprzeczytane",
      refresh: "Odśwież",
      filters: "Filtry skrzynki",
      show_unread: "Pokaż nieprzeczytane",
      show_snoozed: "Pokaż odłożone",
      show_archived: "Pokaż zarchiwizowane",
      mark_archive: "Archiwizuj",
      mark_unarchive: "Przywróć z archiwum",
      mark_snooze: "Odłóż",
      mark_unsnooze: "Anuluj odłożenie",
    },
    toasts: {
      read: "Powiadomienie oznaczono jako przeczytane",
      unread: "Oznaczono jako nieprzeczytane",
      archived: "Zarchiwizowano",
      unarchived: "Przywrócono z archiwum",
      snoozed: "Odłożono",
      unsnoozed: "Anulowano odłożenie",
    },
    empty_state: {
      detail: {
        title: "Wybierz, aby zobaczyć szczegóły.",
      },
      all: {
        title: "Brak przypisanych elementów",
        description: "Aktualizacje przypisanych elementów pojawią się tutaj.",
      },
      mentions: {
        title: "Brak wzmianek",
        description: "Twoje wzmianki pojawią się tutaj.",
      },
    },
    tabs: {
      all: "Wszystko",
      mentions: "Wzmianki",
    },
    filter: {
      assigned: "Przypisano mnie",
      created: "Utworzyłem(am)",
      subscribed: "Subskrybuję",
    },
    snooze: {
      "1_day": "1 dzień",
      "3_days": "3 dni",
      "5_days": "5 dni",
      "1_week": "1 tydzień",
      "2_weeks": "2 tygodnie",
      custom: "Niestandardowe",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "Dodaj elementy pracy, aby śledzić postęp",
      },
      chart: {
        title: "Dodaj elementy pracy, aby wyświetlić wykres burndown.",
      },
      priority_issue: {
        title: "Tutaj pojawią się elementy o wysokim priorytecie.",
      },
      assignee: {
        title: "Przypisz elementy, aby zobaczyć podział przypisania.",
      },
      label: {
        title: "Dodaj etykiety, aby przeprowadzić analizę według etykiet.",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "Zgłoszenia nie są włączone",
        description: "Włącz zgłoszenia w ustawieniach projektu, aby zarządzać prośbami.",
        primary_button: {
          text: "Zarządzaj funkcjami",
        },
      },
      cycle: {
        title: "Cykle nie są włączone",
        description: "Włącz cykle, aby ograniczać pracę w czasie.",
        primary_button: {
          text: "Zarządzaj funkcjami",
        },
      },
      module: {
        title: "Moduły nie są włączone",
        description: "Włącz moduły w ustawieniach projektu.",
        primary_button: {
          text: "Zarządzaj funkcjami",
        },
      },
      page: {
        title: "Strony nie są włączone",
        description: "Włącz strony w ustawieniach projektu.",
        primary_button: {
          text: "Zarządzaj funkcjami",
        },
      },
      view: {
        title: "Widoki nie są włączone",
        description: "Włącz widoki w ustawieniach projektu.",
        primary_button: {
          text: "Zarządzaj funkcjami",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "Utwórz szkic elementu pracy",
    empty_state: {
      title: "Robocze elementy pracy i komentarze pojawią się tutaj.",
      description: "Rozpocznij tworzenie elementu pracy i zostaw go w formie szkicu.",
      primary_button: {
        text: "Utwórz pierwszy szkic",
      },
    },
    delete_modal: {
      title: "Usuń szkic",
      description: "Czy na pewno chcesz usunąć ten szkic? Ta akcja jest nieodwracalna.",
    },
    toasts: {
      created: {
        success: "Szkic utworzono",
        error: "Nie udało się utworzyć",
      },
      deleted: {
        success: "Szkic usunięto",
      },
    },
  },
  stickies: {
    title: "Twoje notatki",
    placeholder: "kliknij, aby zacząć pisać",
    all: "Wszystkie notatki",
    "no-data": "Zapisuj pomysły i myśli. Dodaj pierwszą notatkę.",
    add: "Dodaj notatkę",
    search_placeholder: "Szukaj według nazwy",
    delete: "Usuń notatkę",
    delete_confirmation: "Czy na pewno chcesz usunąć tę notatkę?",
    empty_state: {
      simple: "Zapisuj pomysły i myśli. Dodaj pierwszą notatkę.",
      general: {
        title: "Notatki to szybkie zapiski.",
        description: "Zapisuj pomysły i uzyskuj do nich dostęp z dowolnego miejsca.",
        primary_button: {
          text: "Dodaj notatkę",
        },
      },
      search: {
        title: "Nie znaleziono żadnych notatek.",
        description: "Spróbuj innego wyrażenia lub utwórz nową notatkę.",
        primary_button: {
          text: "Dodaj notatkę",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "Nazwa notatki może mieć maks. 100 znaków.",
        already_exists: "Notatka bez opisu już istnieje",
      },
      created: {
        title: "Notatkę utworzono",
        message: "Notatkę utworzono pomyślnie",
      },
      not_created: {
        title: "Nie udało się utworzyć",
        message: "Nie można utworzyć notatki",
      },
      updated: {
        title: "Notatkę zaktualizowano",
        message: "Notatkę zaktualizowano pomyślnie",
      },
      not_updated: {
        title: "Aktualizacja się nie powiodła",
        message: "Nie można zaktualizować notatki",
      },
      removed: {
        title: "Notatkę usunięto",
        message: "Notatkę usunięto pomyślnie",
      },
      not_removed: {
        title: "Usunięcie się nie powiodło",
        message: "Nie można usunąć notatki",
      },
    },
  },
  role_details: {
    guest: {
      title: "Gość",
      description: "Użytkownicy zewnętrzni mogą być zapraszani jako goście.",
    },
    member: {
      title: "Członek",
      description: "Może czytać, tworzyć, edytować i usuwać encje.",
    },
    admin: {
      title: "Administrator",
      description: "Posiada wszystkie uprawnienia w przestrzeni.",
    },
  },
  user_roles: {
    product_or_project_manager: "Menadżer produktu/projektu",
    development_or_engineering: "Deweloper/Inżynier",
    founder_or_executive: "Założyciel/Dyrektor",
    freelancer_or_consultant: "Freelancer/Konsultant",
    marketing_or_growth: "Marketing/Rozwój",
    sales_or_business_development: "Sprzedaż/Business Development",
    support_or_operations: "Wsparcie/Operacje",
    student_or_professor: "Student/Profesor",
    human_resources: "Zasoby ludzkie",
    other: "Inne",
  },
  importer: {
    github: {
      title: "GitHub",
      description: "Importuj elementy z repozytoriów GitHub.",
    },
    jira: {
      title: "Jira",
      description: "Importuj elementy i epiki z Jiry.",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "Eksportuj elementy do pliku CSV.",
      short_description: "Eksportuj jako CSV",
    },
    excel: {
      title: "Excel",
      description: "Eksportuj elementy do pliku Excel.",
      short_description: "Eksportuj jako Excel",
    },
    xlsx: {
      title: "Excel",
      description: "Eksportuj elementy do pliku Excel.",
      short_description: "Eksportuj jako Excel",
    },
    json: {
      title: "JSON",
      description: "Eksportuj elementy do pliku JSON.",
      short_description: "Eksportuj jako JSON",
    },
  },
  default_global_view: {
    all_issues: "Wszystkie elementy",
    assigned: "Przypisane",
    created: "Utworzone",
    subscribed: "Subskrybowane",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "Preferencje systemowe",
      },
      light: {
        label: "Jasny",
      },
      dark: {
        label: "Ciemny",
      },
      light_contrast: {
        label: "Jasny wysoki kontrast",
      },
      dark_contrast: {
        label: "Ciemny wysoki kontrast",
      },
      custom: {
        label: "Motyw niestandardowy",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "Backlog",
      planned: "Planowane",
      in_progress: "W trakcie",
      paused: "Wstrzymane",
      completed: "Ukończone",
      cancelled: "Anulowane",
    },
    layout: {
      list: "Lista",
      board: "Tablica",
      timeline: "Oś czasu",
    },
    order_by: {
      name: "Nazwa",
      progress: "Postęp",
      issues: "Liczba elementów",
      due_date: "Termin",
      created_at: "Data utworzenia",
      manual: "Ręcznie",
    },
  },
  cycle: {
    label: "{count, plural, one {Cykl} few {Cykle} other {Cyklów}}",
    no_cycle: "Brak cyklu",
  },
  module: {
    label: "{count, plural, one {Moduł} few {Moduły} other {Modułów}}",
    no_module: "Brak modułu",
  },
  description_versions: {
    last_edited_by: "Ostatnio edytowane przez",
    previously_edited_by: "Wcześniej edytowane przez",
    edited_by: "Edytowane przez",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane nie uruchomił się. Może to być spowodowane tym, że jedna lub więcej usług Plane nie mogła się uruchomić.",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "Wybierz View Logs z setup.sh i logów Docker, aby mieć pewność.",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "Konspekt",
        empty_state: {
          title: "Brakuje nagłówków",
          description: "Dodajmy kilka nagłówków na tej stronie, aby je tutaj zobaczyć.",
        },
      },
      info: {
        label: "Info",
        document_info: {
          words: "Słowa",
          characters: "Znaki",
          paragraphs: "Akapity",
          read_time: "Czas czytania",
        },
        actors_info: {
          edited_by: "Edytowane przez",
          created_by: "Utworzone przez",
        },
        version_history: {
          label: "Historia wersji",
          current_version: "Bieżąca wersja",
          highlight_changes: "Podświetl zmiany",
        },
      },
      assets: {
        label: "Zasoby",
        download_button: "Pobierz",
        empty_state: {
          title: "Brakuje obrazów",
          description: "Dodaj obrazy, aby je tutaj zobaczyć.",
        },
      },
    },
    open_button: "Otwórz panel nawigacji",
    close_button: "Zamknij panel nawigacji",
    outline_floating_button: "Otwórz konspekt",
  },
  workspace_dashboards: "Daszbord",
  pi_chat: "AI Czat",
  in_app: "W aplikacji",
  forms: "Formularze",
  choose_workspace_for_integration: "Wybierz przestrzeń roboczą do połączenia tej aplikacji",
  integrations_description:
    "Aplikacje, które działają z Plane, muszą być połączone z przestrzenią roboczą, w której jesteś administratorem.",
  create_a_new_workspace: "Utwórz nową przestrzeń roboczą",
  learn_more_about_workspaces: "Dowiedz się więcej o przestrzeniach roboczych",
  no_workspaces_to_connect: "Brak przestrzeni roboczych do połączenia",
  no_workspaces_to_connect_description: "Musisz utworzyć przestrzeń roboczą, aby móc połączyć integracje i szablony",
  updates: {
    add_update: "Dodaj aktualizację",
    add_update_placeholder: "Dodaj swoją aktualizację tutaj",
    empty: {
      title: "Nie ma jeszcze aktualizacji",
      description: "Możesz tutaj zobaczyć aktualizacje.",
    },
    delete: {
      title: "Usuń aktualizację",
      confirmation: "Czy na pewno chcesz usunąć tę aktualizację? Ta operacja jest nieodwracalna.",
      success: {
        title: "Aktualizacja została usunięta",
        message: "Aktualizacja została pomyślnie usunięta.",
      },
      error: {
        title: "Aktualizacja nie została usunięta",
        message: "Nie udało się usunąć aktualizacji.",
      },
    },
    reaction: {
      create: {
        success: {
          title: "Reakcja została dodana",
          message: "Reakcja została pomyślnie dodana.",
        },
        error: {
          title: "Reakcja nie została dodana",
          message: "Nie udało się dodać reakcji.",
        },
      },
      remove: {
        success: {
          title: "Reakcja została usunięta",
          message: "Reakcja została pomyślnie usunięta.",
        },
        error: {
          title: "Reakcja nie została usunięta",
          message: "Nie udało się usunąć reakcji.",
        },
      },
    },
    progress: {
      title: "Postęp",
      since_last_update: "Od ostatniej aktualizacji",
      comments: "{count, plural, one{# komentarz} other{# komentarze}}",
    },
    create: {
      success: {
        title: "Aktualizacja została stworzona",
        message: "Aktualizacja została pomyślnie stworzona.",
      },
      error: {
        title: "Aktualizacja nie została stworzona",
        message: "Nie udało się stworzyć aktualizacji.",
      },
    },
    update: {
      success: {
        title: "Aktualizacja została zaktualizowana",
        message: "Aktualizacja została pomyślnie zaktualizowana.",
      },
      error: {
        title: "Aktualizacja nie została zaktualizowana",
        message: "Nie udało się zaktualizować aktualizacji.",
      },
    },
  },
  teamspaces: {
    label: "Przestrzenie zespołu",
    empty_state: {
      general: {
        title: "Przestrzenie zespołu odblokowują lepszą organizację i śledzenie w Plane.",
        description:
          "Stwórz dedykowaną powierzchnię dla każdego rzeczywistego zespołu, oddzieloną od wszystkich innych powierzchni pracy w Plane i dostosuj je do tego, jak działa Twój zespół.",
        primary_button: {
          text: "Utwórz nową przestrzeń zespołu",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "Nie połączyłeś jeszcze żadnych przestrzeni zespołu.",
          description: "Właściciele przestrzeni zespołu i projektu mogą zarządzać dostępem do projektów.",
        },
      },
      primary_button: {
        text: "Połącz przestrzeń zespołu",
      },
      secondary_button: {
        text: "Dowiedz się więcej",
      },
      table: {
        columns: {
          teamspaceName: "Nazwa przestrzeni zespołu",
          members: "Członkowie",
          accountType: "Typ konta",
        },
        actions: {
          remove: {
            button: {
              text: "Usuń przestrzeń zespołu",
            },
            confirm: {
              title: "Usuń {teamspaceName} z {projectName}",
              description:
                "Po usunięciu tej przestrzeni zespołu z połączonego projektu, członkowie stracą dostęp do połączonego projektu.",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "Nie znaleziono pasujących przestrzeni zespołu",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {Połączyłeś przestrzeń zespołu z tym projektem.} other {Połączyłeś # przestrzeni zespołu z tym projektem.}}",
            description:
              "{additionalCount, plural, =0 {Przestrzeń zespołu {firstTeamspaceName} jest teraz połączona z tym projektem.} other {Przestrzeń zespołu {firstTeamspaceName} i {additionalCount} więcej jest teraz połączonych z tym projektem.}}",
          },
          error: {
            title: "To się nie powiodło.",
            description: "Spróbuj ponownie lub odśwież stronę przed ponowną próbą.",
          },
        },
        remove_teamspace: {
          success: {
            title: "Usunąłeś tę przestrzeń zespołu z tego projektu.",
            description: "Przestrzeń zespołu {teamspaceName} została usunięta z {projectName}.",
          },
          error: {
            title: "To się nie powiodło.",
            description: "Spróbuj ponownie lub odśwież stronę przed ponowną próbą.",
          },
        },
      },
      link_teamspace: {
        placeholder: "Szukaj przestrzeni zespołu",
        info: {
          title: "Dodanie przestrzeni zespołu daje wszystkim jej członkom dostęp do tego projektu.",
          link: "Dowiedz się więcej",
        },
        empty_state: {
          no_teamspaces: {
            title: "Nie masz żadnych przestrzeni zespołu do połączenia.",
            description:
              "Albo nie jesteś w przestrzeni zespołu, którą możesz połączyć, albo połączyłeś już wszystkie dostępne przestrzenie zespołu.",
          },
          no_results: {
            title: "To nie pasuje do żadnej z Twoich przestrzeni zespołu.",
            description: "Spróbuj innego terminu lub upewnij się, że masz przestrzenie zespołu do połączenia.",
          },
        },
        primary_button: {
          text: "Połącz wybrane przestrzenie zespołu",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "Utwórz elementy pracy specyficzne dla zespołu.",
        description:
          "Elementy pracy przypisane do członków tego zespołu w dowolnym połączonym projekcie automatycznie pojawią się tutaj. Jeśli spodziewasz się zobaczyć niektóre elementy pracy tutaj, upewnij się, że Twoje połączone projekty mają elementy pracy przypisane do członków tego zespołu lub utwórz elementy pracy.",
        primary_button: {
          text: "Dodaj elementy pracy do połączonego projektu",
        },
      },
      work_items_empty_filter: {
        title: "Nie ma elementów pracy specyficznych dla zespołu dla zastosowanych filtrów",
        description:
          "Zmień niektóre z tych filtrów lub wyczyść je wszystkie, aby zobaczyć elementy pracy istotne dla tej przestrzeni.",
        secondary_button: {
          text: "Wyczyść wszystkie filtry",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "Żaden z Twoich połączonych projektów nie ma aktywnego cyklu.",
        description:
          "Aktywne cykle w połączonych projektach automatycznie pojawią się tutaj. Jeśli spodziewasz się zobaczyć aktywny cykl, upewnij się, że działa obecnie w połączonym projekcie.",
      },
      completed: {
        title: "Żaden z Twoich połączonych projektów nie ma ukończonego cyklu.",
        description:
          "Ukończone cykle w połączonych projektach automatycznie pojawią się tutaj. Jeśli spodziewasz się zobaczyć ukończony cykl, upewnij się, że jest również ukończony w połączonym projekcie.",
      },
      upcoming: {
        title: "Żaden z Twoich połączonych projektów nie ma nadchodzącego cyklu.",
        description:
          "Nadchodzące cykle w połączonych projektach automatycznie pojawią się tutaj. Jeśli spodziewasz się zobaczyć nadchodzący cykl, upewnij się, że jest również w połączonym projekcie.",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title:
          "Widoki Twojego zespołu dotyczące Twojej pracy bez zakłócania żadnych innych widoków w Twojej przestrzeni roboczej",
        description:
          "Zobacz pracę swojego zespołu w widokach, które są zapisane tylko dla Twojego zespołu i oddzielnie od widoków projektu.",
        primary_button: {
          text: "Utwórz widok",
        },
      },
      filter: {
        title: "Brak pasujących widoków",
        description: `Żadne widoki nie pasują do kryteriów wyszukiwania.
 Zamiast tego utwórz nowy widok.`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "Umieść wiedzę swojego zespołu na Stronach Zespołu.",
        description:
          "W przeciwieństwie do stron w projekcie, możesz zapisać wiedzę specyficzną dla zespołu w oddzielnym zestawie stron tutaj. Uzyskaj wszystkie funkcje Stron, twórz dokumenty najlepszych praktyk i wiki zespołu z łatwością.",
        primary_button: {
          text: "Utwórz swoją pierwszą stronę zespołu",
        },
      },
      filter: {
        title: "Brak pasujących stron",
        description: "Usuń filtry, aby zobaczyć wszystkie strony",
      },
      search: {
        title: "Brak pasujących stron",
        description: "Usuń kryteria wyszukiwania, aby zobaczyć wszystkie strony",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "Żaden z Twoich połączonych projektów nie ma opublikowanych elementów pracy.",
        description:
          "Utwórz elementy pracy w jednym lub więcej z tych projektów, aby zobaczyć postęp według dat, stanów i priorytetów.",
      },
      relation: {
        blocking: {
          title: "Nie masz żadnych elementów pracy blokujących członka zespołu.",
          description: "Dobra robota! Oczyściłeś drogę dla swojego zespołu. Jesteś dobrym graczem zespołowym.",
        },
        blocked: {
          title: "Nie masz żadnych elementów pracy członków zespołu, które Cię blokują.",
          description: "Dobra wiadomość! Możesz robić postępy we wszystkich przypisanych elementach pracy.",
        },
      },
      stats: {
        general: {
          title: "Żaden z Twoich połączonych projektów nie ma opublikowanych elementów pracy.",
          description:
            "Utwórz elementy pracy w jednym lub więcej z tych projektów, aby zobaczyć rozkład pracy według projektu i członków zespołu.",
        },
        filter: {
          title: "Nie ma statystyk zespołu dla zastosowanych filtrów.",
          description:
            "Utwórz elementy pracy w jednym lub więcej z tych projektów, aby zobaczyć rozkład pracy według projektu i członków zespołu.",
        },
      },
    },
  },
  initiatives: {
    overview: "Przegląd",
    label: "Inicjatywy",
    placeholder: "{count, plural, one{# inicjatywa} other{# inicjatywy}}",
    add_initiative: "Dodaj Inicjatywę",
    create_initiative: "Utwórz Inicjatywę",
    update_initiative: "Aktualizuj Inicjatywę",
    initiative_name: "Nazwa inicjatywy",
    all_initiatives: "Wszystkie Inicjatywy",
    delete_initiative: "Usuń Inicjatywę",
    fill_all_required_fields: "Wypełnij wszystkie wymagane pola.",
    toast: {
      create_success: "Inicjatywa {name} utworzona pomyślnie.",
      create_error: "Nie udało się utworzyć inicjatywy. Spróbuj ponownie!",
      update_success: "Inicjatywa {name} zaktualizowana pomyślnie.",
      update_error: "Nie udało się zaktualizować inicjatywy. Spróbuj ponownie!",
      delete: {
        success: "Inicjatywa usunięta pomyślnie.",
        error: "Nie udało się usunąć Inicjatywy",
      },
      link_copied: "Link do inicjatywy skopiowany do schowka.",
      project_update_success: "Projekty inicjatywy zaktualizowane pomyślnie.",
      project_update_error: "Nie udało się zaktualizować projektów inicjatywy. Spróbuj ponownie!",
      epic_update_success:
        "Epik{count, plural, one { dodany do Inicjatywy pomyślnie.} other {i dodane do Inicjatywy pomyślnie.}}",
      epic_update_error: "Dodanie Epika do Inicjatywy nie powiodło się. Spróbuj ponownie później.",
      state_update_success: "Stan inicjatywy został pomyślnie zaktualizowany.",
      state_update_error: "Nie udało się zaktualizować stanu inicjatywy. Spróbuj ponownie!",
      label_update_error: "Nie udało się zaktualizować etykiet inicjatywy. Proszę spróbować ponownie!",
    },
    empty_state: {
      general: {
        title: "Organizuj pracę na najwyższym poziomie z Inicjatywami",
        description:
          "Kiedy potrzebujesz zorganizować pracę obejmującą kilka projektów i zespołów, Inicjatywy są przydatne. Połącz projekty i epiki z inicjatywami, zobacz automatycznie zebrane aktualizacje i zobacz lasy, zanim dotrzesz do drzew.",
        primary_button: {
          text: "Utwórz inicjatywę",
        },
      },
      search: {
        title: "Brak pasujących inicjatyw",
        description: `Nie wykryto inicjatyw z pasującymi kryteriami.
 Zamiast tego utwórz nową inicjatywę.`,
      },
      not_found: {
        title: "Inicjatywa nie istnieje",
        description: "Inicjatywa, której szukasz, nie istnieje, została zarchiwizowana lub została usunięta.",
        primary_button: {
          text: "Zobacz inne Inicjatywy",
        },
      },
      epics: {
        title: "Nie masz inicjatyw, które pasują do filtrów, które zastosowałeś.",
        subHeading: "Aby zobaczyć wszystkie inicjatywy, usuń wszystkie zastosowane filtry.",
        action: "Usuń filtry",
      },
    },
    scope: {
      add_scope: "Dodaj zakres",
      view_scope: "Zobacz zakres",
      breakdown: "Rozbij zakres",
      label: "Zakres",
      empty_state: {
        title: "Nie dodano jeszcze zakresu do tej inicjatywy",
        description: "Połącz projekty i epiki z inicjatywą, aby rozpocząć.",
        primary_button: {
          text: "Dodaj zakres",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "Etykiety",
        description: "Strukturyzuj i organizuj swoje inicjatywy za pomocą etykiet.",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "Usuń etykietę",
        content:
          "Czy na pewno chcesz usunąć {labelName}? Spowoduje to usunięcie etykiety ze wszystkich inicjatyw i ze wszystkich widoków, w których etykieta jest filtrowana.",
      },
      toast: {
        delete_error: "Nie można usunąć etykiety inicjatywy. Spróbuj ponownie.",
        label_already_exists: "Etykieta już istnieje",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title: "Napisz notatkę, dokument lub pełną bazę wiedzy. Niech Galileo, asystent AI Plane, pomoże Ci zacząć",
        description:
          "Strony to przestrzeń do przechowywania myśli w Plane. Sporządzaj notatki ze spotkań, formatuj je łatwo, osadzaj elementy pracy, układaj je za pomocą biblioteki komponentów i trzymaj je wszystkie w kontekście projektu. Aby szybko wykonać dowolny dokument, wywołaj Galileo, AI Plane, za pomocą skrótu lub kliknięcia przycisku.",
        primary_button: {
          text: "Utwórz swoją pierwszą stronę",
        },
      },
      private: {
        title: "Brak prywatnych stron",
        description:
          "Zachowaj swoje prywatne myśli tutaj. Kiedy będziesz gotowy do udostępnienia, zespół jest tylko o kliknięcie dalej.",
        primary_button: {
          text: "Utwórz swoją pierwszą stronę",
        },
      },
      public: {
        title: "Brak stron obszaru roboczego",
        description: "Zobacz strony udostępniane wszystkim w Twojej przestrzeni roboczej właśnie tutaj.",
        primary_button: {
          text: "Utwórz swoją pierwszą stronę",
        },
      },
      archived: {
        title: "Brak zarchiwizowanych stron",
        description: "Archiwizuj strony, których nie masz na radarze. Dostęp do nich tutaj, gdy potrzeba.",
      },
    },
  },
  epics: {
    label: "Epiki",
    no_epics_selected: "Nie wybrano epików",
    add_selected_epics: "Dodaj wybrane epiki",
    epic_link_copied_to_clipboard: "Link do epika skopiowany do schowka.",
    project_link_copied_to_clipboard: "Link do projektu skopiowany do schowka",
    empty_state: {
      general: {
        title: "Utwórz epik i przypisz go do kogoś, nawet do siebie",
        description:
          "W przypadku większych obszarów pracy, które obejmują kilka cykli i mogą istnieć w różnych modułach, utwórz epik. Połącz elementy pracy i podelementy pracy w projekcie z epikiem i przejdź do elementu pracy z przeglądu.",
        primary_button: {
          text: "Utwórz Epik",
        },
      },
      section: {
        title: "Brak epików",
        description: "Zacznij dodawać epiki, aby zarządzać i śledzić postęp.",
        primary_button: {
          text: "Dodaj epiki",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "Nie znaleziono pasujących epików",
      },
      no_epics: {
        title: "Nie znaleziono epików",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "Brak aktywnych cykli",
        description:
          "Cykle Twoich projektów, które obejmują dowolny okres zawierający dzisiejszą datę w swoim zakresie. Znajdź tutaj postęp i szczegóły wszystkich aktywnych cykli.",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: `Dodaj elementy pracy do cyklu, aby zobaczyć jego
 postęp`,
      },
      priority: {
        title: `Obserwuj elementy pracy o wysokim priorytecie
 realizowane w cyklu na pierwszy rzut oka.`,
      },
      assignee: {
        title: `Dodaj przypisanych do elementów pracy, aby zobaczyć
 podział pracy według przypisanych osób.`,
      },
      label: {
        title: `Dodaj etykiety do elementów pracy, aby zobaczyć
 podział pracy według etykiet.`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "Importuj członków z CSV",
      description: "Prześlij CSV z kolumnami: Email, Display Name, First Name, Last Name, Role (5, 15 lub 20)",
      dropzone: {
        active: "Upuść plik CSV tutaj",
        inactive: "Przeciągnij i upuść lub kliknij, aby przesłać",
        file_type: "Obsługiwane są tylko pliki .csv",
      },
      buttons: {
        cancel: "Anuluj",
        import: "Importuj",
        try_again: "Spróbuj ponownie",
        close: "Zamknij",
        done: "Gotowe",
      },
      progress: {
        uploading: "Przesyłanie...",
        importing: "Importowanie...",
      },
      summary: {
        title: {
          failed: "Import nie powiódł się",
          complete: "Import zakończony",
        },
        message: {
          seat_limit: "Nie można zaimportować członków z powodu ograniczeń liczby miejsc.",
          success: "Pomyślnie dodano {count} członk{plural} do przestrzeni roboczej.",
          no_imports: "Nie zaimportowano żadnych członków z pliku CSV.",
        },
        stats: {
          successful: "Pomyślne",
          failed: "Nieudane",
        },
        download_errors: "Pobierz błędy",
      },
      toast: {
        invalid_file: {
          title: "Nieprawidłowy plik",
          message: "Obsługiwane są tylko pliki CSV.",
        },
        import_failed: {
          title: "Import nie powiódł się",
          message: "Coś poszło nie tak.",
        },
      },
    },
  },
  project: {
    members_import: {
      title: "Importuj członków z CSV",
      description:
        "Prześlij CSV z kolumnami: Email i Rola (5=Gość, 15=Członek, 20=Administrator). Użytkownicy muszą już należeć do przestrzeni roboczej.",
      download_sample: "Pobierz przykładowy CSV",
      dropzone: {
        active: "Upuść plik CSV tutaj",
        inactive: "Przeciągnij i upuść lub kliknij, aby przesłać",
        file_type: "Obsługiwane są tylko pliki .csv",
      },
      buttons: {
        cancel: "Anuluj",
        import: "Importuj",
        try_again: "Spróbuj ponownie",
        close: "Zamknij",
        done: "Gotowe",
      },
      progress: {
        uploading: "Przesyłanie...",
        importing: "Importowanie...",
      },
      summary: {
        title: {
          complete: "Import zakończony",
        },
        message: {
          success: "Pomyślnie zaimportowano {count} członk{plural} do projektu.",
          no_imports: "Z pliku CSV nie zaimportowano żadnych nowych członków.",
        },
        stats: {
          added: "Dodano",
          reactivated: "Ponownie aktywowano",
          already_members: "Już członkowie",
          skipped: "Pominięto",
        },
        download_errors: "Pobierz szczegóły pominiętych",
      },
      toast: {
        invalid_file: {
          title: "Nieprawidłowy plik",
          message: "Obsługiwane są tylko pliki CSV.",
        },
        import_failed: {
          title: "Import nie powiódł się",
          message: "Coś poszło nie tak.",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "Nie można zarchiwizować elementów pracy",
        message: "Tylko elementy pracy należące do grup stanów Ukończone lub Anulowane mogą być archiwizowane.",
      },
      invalid_issue_start_date: {
        title: "Nie można zaktualizować elementów pracy",
        message:
          "Wybrana data rozpoczęcia następuje po terminie zakończenia dla niektórych elementów pracy. Upewnij się, że data rozpoczęcia jest przed terminem zakończenia.",
      },
      invalid_issue_target_date: {
        title: "Nie można zaktualizować elementów pracy",
        message:
          "Wybrany termin zakończenia poprzedza datę rozpoczęcia dla niektórych elementów pracy. Upewnij się, że termin zakończenia jest po dacie rozpoczęcia.",
      },
      invalid_state_transition: {
        title: "Nie można zaktualizować elementów pracy",
        message:
          "Zmiana stanu nie jest dozwolona dla niektórych elementów pracy. Upewnij się, że zmiana stanu jest dozwolona.",
      },
    },
    workflows: {
      toggle: {
        title: "Włącz workflowy",
        description: "Skonfiguruj workflowy, aby kontrolować przepływ elementów pracy",
        no_states_tooltip: "Do workflowu nie dodano żadnych stanów.",
        toast: {
          loading: {
            enabling: "Włączanie workflowów",
            disabling: "Wyłączanie workflowów",
          },
          success: {
            title: "Sukces!",
            message: "Workflowy zostały pomyślnie włączone.",
          },
          error: {
            title: "Błąd!",
            message: "Nie udało się włączyć workflowów. Spróbuj ponownie.",
          },
        },
      },
      heading: "Workflowy",
      description:
        "Zautomatyzuj przejścia elementów pracy i ustaw reguły kontrolujące, jak zadania przemieszczają się przez pipeline projektu.",
      add_button: "Dodaj nowy workflow",
      search: "Szukaj workflowów",
      detail: {
        define: "Zdefiniuj workflow",
        add_states: "Dodaj stany",
        unmapped_states: {
          title: "Wykryto nieprzypisane stany",
          description:
            "Niektóre elementy pracy wybranych typów znajdują się obecnie w stanach, które nie istnieją w tym workflowie.",
          note: "Jeśli włączysz ten workflow, te elementy zostaną automatycznie przeniesione do początkowego stanu tego workflowu.",
          label: "Brakujące stany",
          tooltip:
            "Niektóre elementy pracy znajdują się w stanach, które nie są przypisane do tego workflowu. Otwórz workflow, aby go sprawdzić.",
        },
      },
      select_states: {
        empty_state: {
          title: "Wszystkie stany są w użyciu",
          description: "Wszystkie stany zdefiniowane dla tego projektu są już obecne w bieżącym workflowie.",
        },
      },
      default_footer: {
        fallback_message:
          "Ten workflow dotyczy każdego typu elementu pracy, który nie jest przypisany do żadnego workflowu.",
      },
      create: {
        heading: "Utwórz nowy workflow",
      },
    },
  },
  work_item_types: {
    label: "Typy Elementów Pracy",
    label_lowercase: "typy elementów pracy",
    settings: {
      title: "Typy Elementów Pracy",
      properties: {
        title: "Własne właściwości",
        tooltip:
          "Każdy typ elementu pracy posiada domyślny zestaw właściwości, takich jak Tytuł, Opis, Przypisany, Stan, Priorytet, Data rozpoczęcia, Termin zakończenia, Moduł, Cykl itp. Możesz również dostosować i dodać własne właściwości, aby dopasować je do potrzeb Twojego zespołu.",
        add_button: "Dodaj nową właściwość",
        dropdown: {
          label: "Typ właściwości",
          placeholder: "Wybierz typ",
        },
        property_type: {
          text: {
            label: "Tekst",
          },
          number: {
            label: "Numer",
          },
          dropdown: {
            label: "Lista rozwijana",
          },
          boolean: {
            label: "Wartość logiczna",
          },
          date: {
            label: "Data",
          },
          member_picker: {
            label: "Wybór członka",
          },
          release_picker: {
            label: "Selektor wydań",
          },
          formula: {
            label: "Formuła",
          },
        },
        attributes: {
          label: "Atrybuty",
          text: {
            single_line: {
              label: "Pojedyncza linia",
            },
            multi_line: {
              label: "Paragraf",
            },
            readonly: {
              label: "Tylko do odczytu",
              header: "Dane tylko do odczytu",
            },
            invalid_text_format: {
              label: "Nieprawidłowy format tekstu",
            },
          },
          number: {
            default: {
              placeholder: "Dodaj numer",
            },
          },
          relation: {
            single_select: {
              label: "Pojedynczy wybór",
            },
            multi_select: {
              label: "Wielokrotny wybór",
            },
            no_default_value: {
              label: "Brak wartości domyślnej",
            },
          },
          boolean: {
            label: "Prawda | Fałsz",
            no_default: "Brak wartości domyślnej",
          },
          option: {
            create_update: {
              label: "Opcje",
              form: {
                placeholder: "Dodaj opcję",
                errors: {
                  name: {
                    required: "Nazwa opcji jest wymagana.",
                    integrity: "Opcja o tej samej nazwie już istnieje.",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "Wybierz opcję",
                multi: {
                  default: "Wybierz opcje",
                  variable: "Wybrano {count} opcji",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "Sukces!",
              message: "Właściwość {name} utworzona pomyślnie.",
            },
            error: {
              title: "Błąd!",
              message: "Nie udało się utworzyć właściwości. Spróbuj ponownie!",
            },
          },
          update: {
            success: {
              title: "Sukces!",
              message: "Właściwość {name} zaktualizowana pomyślnie.",
            },
            error: {
              title: "Błąd!",
              message: "Nie udało się zaktualizować właściwości. Spróbuj ponownie!",
            },
          },
          delete: {
            success: {
              title: "Sukces!",
              message: "Właściwość {name} usunięta pomyślnie.",
            },
            error: {
              title: "Błąd!",
              message: "Nie udało się usunąć właściwości. Spróbuj ponownie!",
            },
          },
          enable_disable: {
            loading: "{action} właściwość {name}",
            success: {
              title: "Sukces!",
              message: "Właściwość {name} {action} pomyślnie.",
            },
            error: {
              title: "Błąd!",
              message: "Nie udało się {action} właściwości. Spróbuj ponownie!",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "Tytuł",
            },
            description: {
              placeholder: "Opis",
            },
          },
          errors: {
            name: {
              required: "Musisz nazwać swoją właściwość.",
              max_length: "Nazwa właściwości nie powinna przekraczać 255 znaków.",
            },
            property_type: {
              required: "Musisz wybrać typ właściwości.",
            },
            options: {
              required: "Musisz dodać co najmniej jedną opcję.",
            },
            formula: {
              required: "Wyrażenie formuły jest wymagane.",
              invalid: "Nieprawidłowa formuła: {error}",
              circular_reference:
                "Wykryto odwołanie cykliczne. Formuła nie może odwoływać się do siebie bezpośrednio ani pośrednio.",
              invalid_reference: "Formuła odwołuje się do nieistniejącej właściwości.",
            },
          },
        },
        formula: {
          field_label: "Pole formuły",
          tooltip: "Wprowadź formułę używając składni '{'Nazwa pola'}'. Obsługuje operatory +, -, *, / i &.",
          placeholder: "Napisz formułę",
          test_button: "Test",
          validating: "Weryfikowanie",
          validation_success: "Formuła jest prawidłowa! Zwraca {resultType}",
          validation_success_with_refs: "Formuła jest prawidłowa! Zwraca {resultType} ({count} pól odwołanych)",
          error: {
            empty: "Wprowadź formułę",
            missing_context: "Brak kontekstu przestrzeni roboczej, projektu lub typu elementu roboczego",
            validation_failed: "Weryfikacja nie powiodła się",
          },
          picker: {
            no_match: "Brak pasujących właściwości",
            no_available: "Brak dostępnych właściwości",
          },
        },
        enable_disable: {
          label: "Aktywna",
          tooltip: {
            disabled: "Kliknij, aby wyłączyć",
            enabled: "Kliknij, aby włączyć",
          },
        },
        delete_confirmation: {
          title: "Usuń tę właściwość",
          description: "Usunięcie właściwości może prowadzić do utraty istniejących danych.",
          secondary_description: "Czy chcesz zamiast tego wyłączyć właściwość?",
          primary_button: "{action}, usuń to",
          secondary_button: "Tak, wyłącz to",
        },
        mandate_confirmation: {
          label: "Obowiązkowa właściwość",
          content:
            "Wygląda na to, że istnieje domyślna opcja dla tej właściwości. Uczynienie właściwości obowiązkową usunie wartość domyślną, a użytkownicy będą musieli dodać wartość według własnego wyboru.",
          tooltip: {
            disabled: "Ten typ właściwości nie może być obowiązkowy",
            enabled: "Odznacz, aby oznaczyć pole jako opcjonalne",
            checked: "Zaznacz, aby oznaczyć pole jako obowiązkowe",
          },
        },
        empty_state: {
          title: "Dodaj niestandardowe właściwości",
          description: "Nowe właściwości, które dodasz dla tego typu elementu pracy, pojawią się tutaj.",
        },
      },
      item_delete_confirmation: {
        title: "Usuń ten typ",
        description: "Usunięcie typów może prowadzić do utraty istniejących danych.",
        primary_button: "Tak, usuń to",
        toast: {
          success: {
            title: "Sukces!",
            message: "Typ elementu pracy został pomyślnie usunięty.",
          },
          error: {
            title: "Błąd!",
            message: "Nie udało się usunąć typu elementu pracy. Spróbuj ponownie!",
          },
        },
        errors: {
          cannot_delete_default_work_item_type: "Nie można usunąć domyślnego typu elementu pracy",
          cannot_delete_work_item_type_with_associated_work_items:
            "Nie można usunąć typu elementu pracy z powiązanymi elementami pracy",
        },
        can_disable_warning: "Czy chcesz zamiast tego wyłączyć ten typ?",
      },
      cant_delete_default_message:
        "Nie można usunąć tego typu elementu pracy, ponieważ jest on ustawiony jako domyślny dla tego projektu.",
      set_as_default: "Ustaw jako domyślny",
      cant_set_default_inactive_message: "Aktywuj ten typ przed ustawieniem go jako domyślny",
      set_default_confirmation: {
        title: "Ustaw jako domyślny typ elementu pracy",
        description:
          "Ustawienie {name} jako domyślnego zaimportuje go do wszystkich projektów w tym obszarze roboczym. Wszystkie nowe elementy pracy będą domyślnie używać tego typu.",
        confirm_button: "Ustaw jako domyślny",
      },
    },
    create: {
      title: "Utwórz typ elementu pracy",
      button: "Dodaj typ elementu pracy",
      toast: {
        success: {
          title: "Sukces!",
          message: "Typ elementu pracy utworzony pomyślnie.",
        },
        error: {
          title: "Błąd!",
          message: {
            conflict: "Typ {name} już istnieje. Wybierz inną nazwę.",
          },
        },
      },
    },
    update: {
      title: "Aktualizuj typ elementu pracy",
      button: "Aktualizuj typ elementu pracy",
      toast: {
        success: {
          title: "Sukces!",
          message: "Typ elementu pracy {name} zaktualizowany pomyślnie.",
        },
        error: {
          title: "Błąd!",
          message: {
            conflict: "Typ {name} już istnieje. Wybierz inną nazwę.",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "Nadaj temu typowi elementu pracy unikalną nazwę",
        },
        description: {
          placeholder: "Opisz, do czego służy ten typ elementu pracy i kiedy należy go używać.",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{action} typ elementu pracy {name}",
        success: {
          title: "Sukces!",
          message: "Typ elementu pracy {name} {action} pomyślnie.",
        },
        error: {
          title: "Błąd!",
          message: "Nie udało się {action} typu elementu pracy. Spróbuj ponownie!",
        },
      },
      tooltip: "Kliknij, aby {action}",
    },
    change_confirmation: {
      title: "Zmień typ elementu pracy?",
      description:
        "Zmiana typu elementu pracy może spowodować utratę wartości właściwości niestandardowych specyficznych dla bieżącego typu. Ta akcja nie może zostać cofnięta.",
      button: {
        loading: "Zmienianie",
        default: "Zmień typ",
      },
    },
    empty_state: {
      enable: {
        title: "Włącz Typy Elementów Pracy",
        description:
          "Kształtuj elementy pracy według swojej pracy za pomocą Typów elementów pracy. Dostosuj je za pomocą ikon, teł i właściwości oraz skonfiguruj je dla tego projektu.",
        primary_button: {
          text: "Włącz",
        },
        confirmation: {
          title: "Po włączeniu Typów Elementów Pracy nie można ich wyłączyć.",
          description:
            "Element pracy Plane stanie się domyślnym typem elementu pracy dla tego projektu i pojawi się ze swoją ikoną i tłem w tym projekcie.",
          button: {
            default: "Włącz",
            loading: "Konfigurowanie",
          },
        },
      },
      get_pro: {
        title: "Zdobądź Pro, aby włączyć Typy elementów pracy.",
        description:
          "Kształtuj elementy pracy według swojej pracy za pomocą Typów elementów pracy. Dostosuj je za pomocą ikon, teł i właściwości oraz skonfiguruj je dla tego projektu.",
        primary_button: {
          text: "Zdobądź Pro",
        },
      },
      upgrade: {
        title: "Aktualizuj, aby włączyć Typy elementów pracy.",
        description:
          "Kształtuj elementy pracy według swojej pracy za pomocą Typów elementów pracy. Dostosuj je za pomocą ikon, teł i właściwości oraz skonfiguruj je dla tego projektu.",
        primary_button: {
          text: "Aktualizuj",
        },
      },
    },
  },
  importers: {
    imports: "Importy",
    logo: "Logo",
    import_message: "Importuj swoje dane {serviceName} do projektów Plane.",
    deactivate: "Dezaktywuj",
    deactivating: "Dezaktywowanie",
    migrating: "Migrowanie",
    migrations: "Migracje",
    refreshing: "Odświeżanie",
    import: "Importuj",
    serial_number: "Nr seryjny",
    project: "Projekt",
    workspace: "Workspace",
    status: "Status",
    summary: "Podsumowanie",
    total_batches: "Całkowita liczba partii",
    imported_batches: "Zaimportowane partie",
    re_run: "Uruchom ponownie",
    cancel: "Anuluj",
    start_time: "Czas rozpoczęcia",
    no_jobs_found: "Nie znaleziono zadań",
    no_project_imports: "Nie zaimportowałeś jeszcze żadnych projektów {serviceName}.",
    cancel_import_job: "Anuluj zadanie importu",
    cancel_import_job_confirmation:
      "Czy na pewno chcesz anulować to zadanie importu? Spowoduje to zatrzymanie procesu importu dla tego projektu.",
    re_run_import_job: "Ponownie uruchom zadanie importu",
    re_run_import_job_confirmation:
      "Czy na pewno chcesz ponownie uruchomić to zadanie importu? Spowoduje to ponowne uruchomienie procesu importu dla tego projektu.",
    upload_csv_file: "Prześlij plik CSV, aby zaimportować dane użytkownika.",
    connect_importer: "Połącz {serviceName}",
    migration_assistant: "Asystent Migracji",
    migration_assistant_description:
      "Płynnie migruj swoje projekty {serviceName} do Plane dzięki naszemu potężnemu asystentowi.",
    token_helper: "Otrzymasz to ze swojego",
    personal_access_token: "Osobisty Token Dostępu",
    source_token_expired: "Token wygasł",
    source_token_expired_description:
      "Dostarczony token wygasł. Proszę dezaktywować i ponownie połączyć z nowym zestawem danych uwierzytelniających.",
    user_email: "Email użytkownika",
    select_state: "Wybierz stan",
    select_service_project: "Wybierz projekt {serviceName}",
    loading_service_projects: "Ładowanie projektów {serviceName}",
    select_service_workspace: "Wybierz workspace {serviceName}",
    loading_service_workspaces: "Ładowanie workspejsów {serviceName}",
    select_priority: "Wybierz priorytet",
    select_service_team: "Wybierz zespół {serviceName}",
    add_seat_msg_free_trial:
      "Próbujesz zaimportować {additionalUserCount} niezarejestrowanych użytkowników, a masz tylko {currentWorkspaceSubscriptionAvailableSeats} miejsc dostępnych w obecnym planie. Aby kontynuować importowanie, zaktualizuj teraz.",
    add_seat_msg_paid:
      "Próbujesz zaimportować {additionalUserCount} niezarejestrowanych użytkowników, a masz tylko {currentWorkspaceSubscriptionAvailableSeats} miejsc dostępnych w obecnym planie. Aby kontynuować importowanie, kup co najmniej {extraSeatRequired} dodatkowych miejsc.",
    skip_user_import_title: "Pomiń importowanie danych użytkownika",
    skip_user_import_description:
      "Pominięcie importu użytkownika spowoduje, że elementy pracy, komentarze i inne dane z {serviceName} zostaną utworzone w Plane przez użytkownika wykonującego migrację. Nadal możesz ręcznie dodać użytkowników później.",
    invalid_pat: "Nieprawidłowy Osobisty Token Dostępu",
  },
  integrations: {
    integrations: "Integracje",
    loading: "Ładowanie",
    unauthorized: "Nie masz uprawnień do wyświetlenia tej strony.",
    configure: "Konfiguruj",
    not_enabled: "{name} nie jest włączone dla tego workspejsu.",
    not_configured: "Nie skonfigurowano",
    disconnect_personal_account: "Odłącz osobiste konto {providerName}",
    not_configured_message_admin:
      "Integracja {name} nie jest skonfigurowana. Skontaktuj się z administratorem instancji, aby ją skonfigurować.",
    not_configured_message_support:
      "Integracja {name} nie jest skonfigurowana. Skontaktuj się z pomocą techniczną, aby ją skonfigurować.",
    external_api_unreachable: "Nie można uzyskać dostępu do zewnętrznego API. Spróbuj ponownie później.",
    error_fetching_supported_integrations: "Nie można pobrać obsługiwanych integracji. Spróbuj ponownie później.",
    back_to_integrations: "Powrót do integracji",
    select_state: "Wybierz stan",
    set_state: "Ustaw stan",
    choose_project: "Wybierz projekt...",
    skip_backward_state_movement: "Zapobiegaj przenoszeniu zadań do wcześniejszego stanu z powodu aktualizacji PR",
  },
  github_integration: {
    name: "GitHub",
    description: "Połącz i synchronizuj swoje elementy pracy GitHub z Plane",
    connect_org: "Connect Organization",
    connect_org_description: "Połącz swoją organizację GitHub z Plane",
    processing: "Przetwarzanie",
    org_added_desc: "GitHub org dodana przez i czas",
    connection_fetch_error: "Błąd pobierania szczegółów połączenia z serwera",
    personal_account_connected: "osobisty konto połączone",
    personal_account_connected_description: "Twoje konto GitHub jest teraz połączone z Plane",
    connect_personal_account: "Połącz osobiste konto",
    connect_personal_account_description: "Połącz swoje osobiste konto GitHub z Plane.",
    repo_mapping: "Mapowanie repozytorium",
    repo_mapping_description: "Mapuj swoje repozytoria GitHub z projektami Plane.",
    project_issue_sync: "Synchronizacja problemów projektu",
    project_issue_sync_description: "Synchronizuj problemy z GitHub do swojego projektu Plane",
    project_issue_sync_empty_state: "Zmapowane synchronizacje problemów projektu pojawią się tutaj",
    configure_project_issue_sync_state: "Konfiguruj stan synchronizacji problemów",
    select_issue_sync_direction: "Wybierz kierunek synchronizacji problemów",
    allow_bidirectional_sync:
      "Bidirectional - Synchronizuj problemy i komentarze w obu kierunkach między GitHub i Plane",
    allow_unidirectional_sync: "Unidirectional - Synchronizuj problemy i komentarze z GitHub do Plane tylko",
    allow_unidirectional_sync_warning:
      "Dane z GitHub Issue zastąpią dane w połączonym elemencie pracy Plane (GitHub → Plane tylko)",
    remove_project_issue_sync: "Usuń tę synchronizację problemów projektu",
    remove_project_issue_sync_confirmation: "Czy na pewno chcesz usunąć tę synchronizację problemów projektu?",
    add_pr_state_mapping: "Dodaj mapowanie stanu pull request dla projektu Plane",
    edit_pr_state_mapping: "Edytuj mapowanie stanu pull request dla projektu Plane",
    pr_state_mapping: "Mapowanie stanu pull request",
    pr_state_mapping_description: "Mapuj stany pull request z GitHub do swojego projektu Plane",
    pr_state_mapping_empty_state: "Zmapowane stany PR pojawią się tutaj",
    remove_pr_state_mapping: "Usuń to mapowanie stanu pull request",
    remove_pr_state_mapping_confirmation: "Czy na pewno chcesz usunąć to mapowanie stanu pull request?",
    issue_sync_message: "Elementy pracy są synchronizowane do {project}",
    link: "Link GitHub Repository do projektu Plane",
    pull_request_automation: "Automatyzacja pull request",
    pull_request_automation_description: "Skonfiguruj mapowanie stanu pull request z GitHub do swojego projektu Plane",
    DRAFT_MR_OPENED: "Otwarty draft",
    MR_OPENED: "Otwarty",
    MR_READY_FOR_MERGE: "Gotowy do połączenia",
    MR_REVIEW_REQUESTED: "Zażądano przeglądu",
    MR_MERGED: "Połączony",
    MR_CLOSED: "Zamknięty",
    ISSUE_OPEN: "Issue otwarty",
    ISSUE_CLOSED: "Issue zamknięty",
    save: "Zapisz",
    start_sync: "Start synchronizacji",
    choose_repository: "Wybierz repozytorium...",
  },
  gitlab_integration: {
    name: "Gitlab",
    description: "Połącz i synchronizuj swoje żądania połączenia Gitlab z Plane.",
    connection_fetch_error: "Błąd pobierania szczegółów połączenia z serwera",
    connect_org: "Połącz organizację",
    connect_org_description: "Połącz swoją organizację Gitlab z Plane.",
    project_connections: "Połączenia projektu Gitlab",
    project_connections_description: "Synchronizuj żądania połączenia z Gitlab do projektów Plane.",
    plane_project_connection: "Połączenie projektu Plane",
    plane_project_connection_description: "Skonfiguruj mapowanie stanu pull requestów z Gitlab do projektów Plane",
    remove_connection: "Usuń połączenie",
    remove_connection_confirmation: "Czy na pewno chcesz usunąć to połączenie?",
    link: "Połącz repozytorium Gitlab z projektem Plane",
    pull_request_automation: "Automatyzacja Pull Requestów",
    pull_request_automation_description: "Skonfiguruj mapowanie stanu pull requestów z Gitlab do Plane",
    DRAFT_MR_OPENED: "Po otwarciu wersji roboczej MR ustaw stan na",
    MR_OPENED: "Po otwarciu MR ustaw stan na",
    MR_REVIEW_REQUESTED: "Gdy zażądano przeglądu MR, ustaw stan na",
    MR_READY_FOR_MERGE: "Gdy MR gotowy do połączenia, ustaw stan na",
    MR_MERGED: "Po połączeniu MR ustaw stan na",
    MR_CLOSED: "Po zamknięciu MR ustaw stan na",
    integration_enabled_text: "Dzięki włączonej integracji Gitlab możesz automatyzować przepływy pracy elementów pracy",
    choose_entity: "Wybierz jednostkę",
    choose_project: "Wybierz projekt",
    link_plane_project: "Połącz projekt Plane",
    project_issue_sync: "Synchronizacja problemów projektu",
    project_issue_sync_description: "Synchronizuj problemy z Gitlab do swojego projektu Plane",
    project_issue_sync_empty_state: "Zmapowana synchronizacja problemów projektu pojawi się tutaj",
    configure_project_issue_sync_state: "Skonfiguruj stan synchronizacji problemów",
    select_issue_sync_direction: "Wybierz kierunek synchronizacji problemów",
    allow_bidirectional_sync:
      "Dwukierunkowa - Synchronizuj problemy i komentarze w obu kierunkach między Gitlab a Plane",
    allow_unidirectional_sync: "Jednokierunkowa - Synchronizuj problemy i komentarze tylko z Gitlab do Plane",
    allow_unidirectional_sync_warning:
      "Dane z Gitlab Issue zastąpią dane w powiązanym elemencie pracy Plane (tylko Gitlab → Plane)",
    remove_project_issue_sync: "Usuń tę synchronizację problemów projektu",
    remove_project_issue_sync_confirmation: "Czy na pewno chcesz usunąć tę synchronizację problemów projektu?",
    ISSUE_OPEN: "Problem otwarty",
    ISSUE_CLOSED: "Problem zamknięty",
    save: "Zapisz",
    start_sync: "Rozpocznij synchronizację",
    choose_repository: "Wybierz repozytorium...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Połącz i zsynchronizuj swoją instancję Gitlab Enterprise z Plane.",
    app_form_title: "Konfiguracja Gitlab Enterprise",
    app_form_description: "Skonfiguruj Gitlab Enterprise aby połączyć z Plane.",
    base_url_title: "Bazowy URL",
    base_url_description: "Bazowy URL Twojej instancji Gitlab Enterprise.",
    base_url_placeholder: 'np. "https://glab.plane.town"',
    base_url_error: "Bazowy URL jest wymagany",
    invalid_base_url_error: "Nieprawidłowy bazowy URL",
    client_id_title: "ID Aplikacji",
    client_id_description: "ID aplikacji, którą utworzyłeś w swojej instancji Gitlab Enterprise.",
    client_id_placeholder: 'np. "7cd732xxxxxxxxxxxxxx"',
    client_id_error: "ID Aplikacji jest wymagane",
    client_secret_title: "Client Secret",
    client_secret_description: "Client secret aplikacji, którą utworzyłeś w swojej instancji Gitlab Enterprise.",
    client_secret_placeholder: 'np. "gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "Client secret jest wymagany",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description:
      "Losowy webhook secret, który będzie używany do weryfikacji webhooka z instancji Gitlab Enterprise.",
    webhook_secret_placeholder: 'np. "webhook1234567890"',
    webhook_secret_error: "Webhook secret jest wymagany",
    connect_app: "Połącz Aplikację",
  },
  slack_integration: {
    name: "Slack",
    description: "Połącz swój workspace Slack z Plane.",
    connect_personal_account: "Połącz swoje osobiste konto Slack z Plane.",
    personal_account_connected: "Twoje osobiste konto {providerName} jest teraz połączone z Plane.",
    link_personal_account: "Połącz swoje osobiste konto {providerName} z Plane.",
    connected_slack_workspaces: "Połączone workspejsy Slack",
    connected_on: "Połączono {date}",
    disconnect_workspace: "Odłącz workspace {name}",
    alerts: {
      dm_alerts: {
        title:
          "Otrzymuj powiadomienia w prywatnych wiadomościach Slack dla ważnych aktualizacji, przypomnień i alertów tylko dla Ciebie.",
      },
    },
    project_updates: {
      title: "Aktualizacje Projektu",
      description: "Skonfiguruj powiadomienia o aktualizacjach projektów dla swoich projektów",
      add_new_project_update: "Dodaj nowe powiadomienie o aktualizacjach projektu",
      project_updates_empty_state: "Projekty połączone z kanałami Slack pojawią się tutaj.",
      project_updates_form: {
        title: "Skonfiguruj Aktualizacje Projektu",
        description: "Otrzymuj powiadomienia o aktualizacjach projektu w Slack, gdy tworzone są elementy pracy",
        failed_to_load_channels: "Nie udało się załadować kanałów ze Slack",
        project_dropdown: {
          placeholder: "Wybierz projekt",
          label: "Projekt Plane",
          no_projects: "Brak dostępnych projektów",
        },
        channel_dropdown: {
          label: "Kanał Slack",
          placeholder: "Wybierz kanał",
          no_channels: "Brak dostępnych kanałów",
        },
        all_projects_connected: "Wszystkie projekty są już połączone z kanałami Slack.",
        all_channels_connected: "Wszystkie kanały Slack są już połączone z projektami.",
        project_connection_success: "Połączenie projektu utworzone pomyślnie",
        project_connection_updated: "Połączenie projektu zaktualizowane pomyślnie",
        project_connection_deleted: "Połączenie projektu usunięte pomyślnie",
        failed_delete_project_connection: "Nie udało się usunąć połączenia projektu",
        failed_create_project_connection: "Nie udało się utworzyć połączenia projektu",
        failed_upserting_project_connection: "Nie udało się zaktualizować połączenia projektu",
        failed_loading_project_connections:
          "Nie mogliśmy załadować twoich połączeń projektu. Może to być spowodowane problemem z siecią lub problemem z integracją.",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "Połącz swój obszar roboczy Sentry z Plane.",
    connected_sentry_workspaces: "Połączone obszary robocze Sentry",
    connected_on: "Połączono {date}",
    disconnect_workspace: "Odłącz obszar roboczy {name}",
    state_mapping: {
      title: "Mapowanie stanów",
      description:
        "Mapuj stany incydentów Sentry na stany swojego projektu. Skonfiguruj, które stany używać, gdy incydent Sentry jest rozwiązany lub nierozwiązany.",
      add_new_state_mapping: "Dodaj nowe mapowanie stanu",
      empty_state:
        "Nie skonfigurowano mapowań stanów. Utwórz swoje pierwsze mapowanie, aby zsynchronizować stany incydentów Sentry ze stanami swojego projektu.",
      failed_loading_state_mappings:
        "Nie udało się załadować mapowań stanów. Może to być spowodowane problemem z siecią lub problemem z integracją.",
      loading_project_states: "Ładowanie stanów projektu...",
      error_loading_states: "Błąd ładowania stanów",
      no_states_available: "Brak dostępnych stanów",
      no_permission_states: "Nie masz uprawnień do dostępu do stanów dla tego projektu",
      states_not_found: "Nie znaleziono stanów projektu",
      server_error_states: "Błąd serwera podczas ładowania stanów",
    },
  },
  oauth_bridge_integration: {
    name: "OAuth Bridge",
    description: "Walidacja tokenów zewnętrznych IdP dla dostępu do API.",
    header_description:
      "Weryfikuj zewnętrzne tokeny OIDC/JWT z Twojego IdP (Azure AD, Okta itp.) dla dostępu do API Plane.",
    connected: "Połączono",
    connect: "Połącz",
    uninstall: "Odinstaluj",
    uninstalling: "Odinstalowywanie...",
    install_success: "OAuth Bridge zainstalowany pomyślnie.",
    install_error: "Nie udało się zainstalować OAuth Bridge.",
    uninstall_success: "OAuth Bridge odinstalowany.",
    uninstall_error: "Nie udało się odinstalować OAuth Bridge.",
    token_providers: "Dostawcy tokenów",
    token_providers_description:
      "Skonfiguruj zewnętrzne IdP, których JWT są akceptowane jako dane uwierzytelniające API.",
    add_provider: "Dodaj dostawcę",
    edit_provider: "Edytuj dostawcę",
    enabled: "Włączony",
    disabled: "Wyłączony",
    test: "Testuj",
    no_providers_title: "Brak skonfigurowanych dostawców.",
    no_providers_description: "Dodaj IdP, aby włączyć uwierzytelnianie tokenami zewnętrznymi.",
    provider_updated: "Dostawca zaktualizowany.",
    provider_added: "Dostawca dodany.",
    provider_save_error: "Nie udało się zapisać dostawcy.",
    provider_deleted: "Dostawca usunięty.",
    provider_delete_error: "Nie udało się usunąć dostawcy.",
    provider_update_error: "Nie udało się zaktualizować dostawcy.",
    jwks_reachable: "JWKS osiągalny",
    jwks_unreachable: "JWKS nieosiągalny",
    jwks_test_error: "Nie udało się pobrać JWKS ze skonfigurowanego URL.",
    provider_form: {
      name_label: "Nazwa",
      name_placeholder: "np. Azure AD Production",
      name_description: "Czytelna etykieta dla tego dostawcy tożsamości",
      name_required: "Nazwa jest wymagana.",
      issuer_label: "Wystawca",
      issuer_placeholder: "https://login.microsoftonline.com/tenant-id/v2.0",
      issuer_description: "Oczekiwana wartość claim iss w JWT",
      issuer_required: "Wystawca jest wymagany.",
      jwks_url_label: "URL JWKS",
      jwks_url_placeholder: "https://login.microsoftonline.com/tenant-id/discovery/v2.0/keys",
      jwks_url_description: "Endpoint HTTPS udostępniający JSON Web Key Set dostawcy",
      jwks_url_required: "URL JWKS jest wymagany.",
      jwks_url_https: "URL JWKS musi używać HTTPS.",
      audience_label: "Odbiorcy",
      audience_placeholder: "api://my-app-id",
      audience_description: "Oczekiwane claim(y) aud w JWT, rozdzielone przecinkami.",
      user_claim_label: "Claim użytkownika",
      user_claim_placeholder: "email",
      user_claim_description: "Claim JWT zawierający adres e-mail użytkownika",
      user_claim_required: "Claim użytkownika jest wymagany.",
      allowed_algorithms_label: "Dozwolone algorytmy podpisu",
      allowed_algorithms_description: "Algorytmy asymetryczne do weryfikacji podpisu JWT",
      allowed_algorithms_required: "Wymagany jest co najmniej jeden algorytm.",
      select_algorithms: "Wybierz algorytmy",
      jwks_cache_ttl_label: "TTL pamięci podręcznej JWKS (sekundy)",
      jwks_cache_ttl_description:
        "Czas przechowywania kluczy JWKS dostawcy w pamięci podręcznej (minimum 60s, domyślnie 24 godziny)",
      jwks_cache_ttl_min: "TTL pamięci podręcznej musi wynosić co najmniej 60 sekund.",
      rate_limit_label: "Limit żądań",
      rate_limit_placeholder: "120/minute",
      rate_limit_description:
        "Ograniczenie żądań jako ilość/okres (np. 120/minute). Pozostaw puste dla domyślnego limitu.",
      enable_provider: "Włącz tego dostawcę",
      saving: "Zapisywanie...",
      update: "Aktualizuj",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "Połącz i synchronizuj swoją organizację GitHub Enterprise z Plane.",
    app_form_title: "Konfiguracja GitHub Enterprise",
    app_form_description: "Skonfiguruj GitHub Enterprise, aby połączyć się z Plane.",
    app_id_title: "ID aplikacji",
    app_id_description: "ID aplikacji, którą utworzyłeś w swojej organizacji GitHub Enterprise.",
    app_id_placeholder: 'e.g., "1234567890"',
    app_id_error: "App ID jest wymagany",
    app_name_title: "Slug aplikacji",
    app_name_description: "Slug aplikacji, którą utworzyłeś w swojej organizacji GitHub Enterprise.",
    app_name_error: "App slug jest wymagany",
    app_name_placeholder: 'e.g., "plane-github-enterprise"',
    base_url_title: "URL bazowy",
    base_url_description: "URL bazowy Twojej organizacji GitHub Enterprise.",
    base_url_placeholder: 'e.g., "https://gh.plane.town"',
    base_url_error: "URL bazowy jest wymagany",
    invalid_base_url_error: "Nieprawidłowy URL bazowy",
    client_id_title: "ID klienta",
    client_id_description: "ID klienta aplikacji, którą utworzyłeś w swojej organizacji GitHub Enterprise.",
    client_id_placeholder: 'e.g., "1234567890"',
    client_id_error: "ID klienta jest wymagany",
    client_secret_title: "Secret klienta",
    client_secret_description: "Secret klienta aplikacji, którą utworzyłeś w swojej organizacji GitHub Enterprise.",
    client_secret_placeholder: 'e.g., "1234567890"',
    client_secret_error: "Secret klienta jest wymagany",
    webhook_secret_title: "Secret webhooka",
    webhook_secret_description: "Secret webhooka aplikacji, którą utworzyłeś w swojej organizacji GitHub Enterprise.",
    webhook_secret_placeholder: 'e.g., "1234567890"',
    webhook_secret_error: "Secret webhooka jest wymagany",
    private_key_title: "Klucz prywatny (Base64 encoded)",
    private_key_description:
      "Base64 encoded private key aplikacji, którą utworzyłeś w swojej organizacji GitHub Enterprise.",
    private_key_placeholder: 'e.g., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Klucz prywatny jest wymagany",
    connect_app: "Połącz aplikację",
  },
  file_upload: {
    upload_text: "Kliknij tutaj, aby przesłać plik",
    drag_drop_text: "Przeciągnij i upuść",
    processing: "Przetwarzanie",
    invalid: "Nieprawidłowy typ pliku",
    missing_fields: "Brakujące pola",
    success: "{fileName} przesłany!",
  },
  silo_errors: {
    invalid_query_params: "Podane parametry zapytania są nieprawidłowe lub brakuje wymaganych pól",
    invalid_installation_account: "Podane konto instalacji nie jest prawidłowe",
    generic_error: "Wystąpił nieoczekiwany błąd podczas przetwarzania Twojego żądania",
    connection_not_found: "Nie można znaleźć żądanego połączenia",
    multiple_connections_found: "Znaleziono wiele połączeń, gdy oczekiwano tylko jednego",
    installation_not_found: "Nie można znaleźć żądanej instalacji",
    user_not_found: "Nie można znaleźć żądanego użytkownika",
    error_fetching_token: "Nie udało się pobrać tokenu uwierzytelniającego",
    invalid_app_credentials: "Podane poświadczenia aplikacji są nieprawidłowe",
    invalid_app_installation_id: "Nie udało się zainstalować aplikacji",
  },
  import_status: {
    queued: "W kolejce",
    created: "Utworzono",
    initiated: "Zainicjowano",
    pulling: "Pobieranie",
    timed_out: "Przekroczenie czasu oczekiwania",
    pulled: "Pobrano",
    transforming: "Transformowanie",
    transformed: "Przekształcono",
    pushing: "Przesyłanie",
    finished: "Zakończono",
    error: "Błąd",
    cancelled: "Anulowano",
  },
  jira_importer: {
    jira_importer_description: "Importuj swoje dane Jira do projektów Plane.",
    create_project_automatically: "Utwórz projekt automatycznie",
    create_project_automatically_description:
      "Utworzymy dla Ciebie nowy projekt na podstawie szczegółów projektu Jira.",
    import_to_existing_project: "Importuj do istniejącego projektu",
    import_to_existing_project_description: "Wybierz istniejący projekt z menu rozwijanego poniżej.",
    state_mapping_automatic_creation: "Wszystkie stavy Jira zostaną automatycznie utworzone w Plane.",
    personal_access_token: "Osobisty Token Dostępu",
    user_email: "Email użytkownika",
    atlassian_security_settings: "Ustawienia bezpieczeństwa Atlassian",
    email_description: "To jest email powiązany z Twoim osobistym tokenem dostępu",
    jira_domain: "Domena Jira",
    jira_domain_description: "To jest domena Twojej instancji Jira",
    steps: {
      title_configure_plane: "Konfiguruj Plane",
      description_configure_plane:
        "Najpierw utwórz projekt w Plane, do którego chcesz migrować dane Jira. Po utworzeniu projektu wybierz go tutaj.",
      title_configure_jira: "Konfiguruj Jira",
      description_configure_jira: "Wybierz workspace Jira, z którego chcesz migrować dane.",
      title_import_users: "Importuj użytkowników",
      description_import_users:
        "Dodaj użytkowników, których chcesz migrować z Jira do Plane. Alternatywnie, możesz pominąć ten krok i ręcznie dodać użytkowników później.",
      title_map_states: "Mapuj stany",
      description_map_states:
        "Automatycznie dopasowaliśmy statusy Jira do stanów Plane najlepiej jak to możliwe. Zmapuj pozostałe stany przed kontynuacją, możesz również tworzyć stany i mapować je ręcznie.",
      title_map_priorities: "Mapuj priorytety",
      description_map_priorities:
        "Automatycznie dopasowaliśmy priorytety najlepiej jak to możliwe. Zmapuj pozostałe priorytety przed kontynuacją.",
      title_summary: "Podsumowanie",
      description_summary: "Oto podsumowanie danych, które zostaną zmigrowane z Jira do Plane.",
      custom_jql_filter: "Niestandardowy filtr JQL",
      jql_filter_description: "Użyj JQL, aby filtrować określone zgłoszenia do importu.",
      project_code: "PROJEKT",
      enter_filters_placeholder: "Wprowadź filtry (np. status = 'In Progress')",
      validating_query: "Sprawdzanie zapytania...",
      validation_successful_work_items_selected: "Weryfikacja pomyślna, wybrano {count} elementów pracy.",
      run_syntax_check: "Uruchom sprawdzanie składni, aby zweryfikować zapytanie",
      refresh: "Odśwież",
      check_syntax: "Sprawdź składnię",
      no_work_items_selected: "Zapytanie nie wybrało żadnych elementów pracy.",
      validation_error_default: "Coś poszło nie tak podczas weryfikacji zapytania.",
    },
  },
  asana_importer: {
    asana_importer_description: "Importuj swoje dane Asana do projektów Plane.",
    select_asana_priority_field: "Wybierz pole priorytetu Asana",
    steps: {
      title_configure_plane: "Konfiguruj Plane",
      description_configure_plane:
        "Najpierw utwórz projekt w Plane, do którego chcesz migrować dane Asana. Po utworzeniu projektu wybierz go tutaj.",
      title_configure_asana: "Konfiguruj Asana",
      description_configure_asana: "Wybierz workspace i projekt Asana, z którego chcesz migrować dane.",
      title_map_states: "Mapuj stany",
      description_map_states: "Wybierz stany Asana, które chcesz zmapować do statusów projektu Plane.",
      title_map_priorities: "Mapuj priorytety",
      description_map_priorities: "Wybierz priorytety Asana, które chcesz zmapować do priorytetów projektu Plane.",
      title_summary: "Podsumowanie",
      description_summary: "Oto podsumowanie danych, które zostaną zmigrowane z Asana do Plane.",
    },
  },
  linear_importer: {
    linear_importer_description: "Importuj swoje dane Linear do projektów Plane.",
    steps: {
      title_configure_plane: "Konfiguruj Plane",
      description_configure_plane:
        "Najpierw utwórz projekt w Plane, do którego chcesz migrować dane Linear. Po utworzeniu projektu wybierz go tutaj.",
      title_configure_linear: "Konfiguruj Linear",
      description_configure_linear: "Wybierz zespół Linear, z którego chcesz migrować dane.",
      title_map_states: "Mapuj stany",
      description_map_states:
        "Automatycznie dopasowaliśmy statusy Linear do stanów Plane najlepiej jak to możliwe. Zmapuj pozostałe stany przed kontynuacją, możesz również tworzyć stany i mapować je ręcznie.",
      title_map_priorities: "Mapuj priorytety",
      description_map_priorities: "Wybierz priorytety Linear, które chcesz zmapować do priorytetów projektu Plane.",
      title_summary: "Podsumowanie",
      description_summary: "Oto podsumowanie danych, które zostaną zmigrowane z Linear do Plane.",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "Importuj dane serwera Jira do projektów Plane.",
    steps: {
      title_configure_plane: "Konfiguruj Plane",
      description_configure_plane:
        "Najpierw utwórz projekt w Plane, do którego chcesz migrować dane Jira. Po utworzeniu projektu wybierz go tutaj.",
      title_configure_jira: "Konfiguruj Jira",
      description_configure_jira: "Wybierz workspace Jira, z którego chcesz migrować dane.",
      title_map_states: "Mapuj stany",
      description_map_states: "Wybierz stany Jira, które chcesz zmapować do statusów projektu Plane.",
      title_map_priorities: "Mapuj priorytety",
      description_map_priorities: "Wybierz priorytety Jira, które chcesz zmapować do priorytetów projektu Plane.",
      title_summary: "Podsumowanie",
      description_summary: "Oto podsumowanie danych, które zostaną zmigrowane z Jira do Plane.",
    },
    import_epics: {
      title: "Importuj epiki jako elementy pracy",
      description: "Po włączeniu tej opcji epiki zostaną zaimportowane jako elementy pracy o typie epika.",
    },
  },
  notion_importer: {
    notion_importer_description: "Importuj swoje dane Notion do projektów Plane.",
    steps: {
      title_upload_zip: "Prześlij wyeksportowany ZIP z Notion",
      description_upload_zip: "Proszę przesłać plik ZIP zawierający dane z Notion.",
    },
    upload: {
      drop_file_here: "Upuść tutaj swój plik zip z Notion",
      upload_title: "Prześlij eksport Notion",
      upload_from_url: "Importuj z adresu URL",
      upload_from_url_description: "Wklej publiczny adres URL eksportu ZIP, aby kontynuować.",
      drag_drop_description: "Przeciągnij i upuść swój plik zip eksportu Notion lub kliknij, aby przeglądać",
      file_type_restriction: "Obsługiwane są tylko pliki .zip wyeksportowane z Notion",
      select_file: "Wybierz plik",
      uploading: "Przesyłanie...",
      preparing_upload: "Przygotowywanie przesyłania...",
      confirming_upload: "Potwierdzanie przesyłania...",
      confirming: "Potwierdzanie...",
      upload_complete: "Przesyłanie zakończone",
      upload_failed: "Przesyłanie nie powiodło się",
      start_import: "Rozpocznij import",
      retry_upload: "Ponów przesyłanie",
      upload: "Prześlij",
      ready: "Gotowy",
      error: "Błąd",
      upload_complete_message: "Przesyłanie zakończone!",
      upload_complete_description: 'Kliknij "Rozpocznij import", aby rozpocząć przetwarzanie danych Notion.',
      upload_progress_message: "Proszę nie zamykać tego okna.",
    },
  },
  confluence_importer: {
    confluence_importer_description: "Importuj swoje dane Confluence do wiki Plane.",
    steps: {
      title_upload_zip: "Prześlij wyeksportowany ZIP z Confluence",
      description_upload_zip: "Proszę przesłać plik ZIP zawierający dane z Confluence.",
    },
    upload: {
      drop_file_here: "Upuść tutaj swój plik zip z Confluence",
      upload_title: "Prześlij eksport Confluence",
      upload_from_url: "Importuj z adresu URL",
      upload_from_url_description: "Wklej publiczny adres URL eksportu ZIP, aby kontynuować.",
      drag_drop_description: "Przeciągnij i upuść swój plik zip eksportu Confluence lub kliknij, aby przeglądać",
      file_type_restriction: "Obsługiwane są tylko pliki .zip wyeksportowane z Confluence",
      select_file: "Wybierz plik",
      uploading: "Przesyłanie...",
      preparing_upload: "Przygotowywanie przesyłania...",
      confirming_upload: "Potwierdzanie przesyłania...",
      confirming: "Potwierdzanie...",
      upload_complete: "Przesyłanie zakończone",
      upload_failed: "Przesyłanie nie powiodło się",
      start_import: "Rozpocznij import",
      retry_upload: "Ponów przesyłanie",
      upload: "Prześlij",
      ready: "Gotowy",
      error: "Błąd",
      upload_complete_message: "Przesyłanie zakończone!",
      upload_complete_description: 'Kliknij "Rozpocznij import", aby rozpocząć przetwarzanie danych Confluence.',
      upload_progress_message: "Proszę nie zamykać tego okna.",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "Importuj swoje dane CSV do projektów Plane.",
    steps: {
      title_configure_plane: "Konfiguruj Plane",
      description_configure_plane:
        "Najpierw utwórz projekt w Plane, do którego chcesz migrować dane CSV. Po utworzeniu projektu wybierz go tutaj.",
      title_configure_csv: "Konfiguruj CSV",
      description_configure_csv: "Prześlij plik CSV i skonfiguruj pola, które mają być mapowane do pól Plane.",
    },
  },
  csv_importer: {
    csv_importer_description: "Importuj elementy pracy z plików CSV do projektów Plane.",
    steps: {
      title_select_project: "Wybierz projekt",
      description_select_project: "Wybierz projekt Plane, do którego chcesz zaimportować elementy pracy.",
      title_upload_csv: "Prześlij CSV",
      description_upload_csv:
        "Prześlij plik CSV zawierający elementy pracy. Plik powinien zawierać kolumny z nazwą, opisem, priorytetem, datami i grupą stanów.",
    },
  },
  clickup_importer: {
    clickup_importer_description: "Importuj swoje dane ClickUp do projektów Plane.",
    select_service_space: "Wybierz {serviceName} Space",
    select_service_folder: "Wybierz {serviceName} Folder",
    selected: "Wybrane",
    users: "Użytkownicy",
    steps: {
      title_configure_plane: "Konfiguruj Plane",
      description_configure_plane:
        "Najpierw utwórz projekt w Plane, do którego chcesz migrować dane ClickUp. Po utworzeniu projektu wybierz go tutaj.",
      title_configure_clickup: "Konfiguruj ClickUp",
      description_configure_clickup: "Wybierz zespół ClickUp, space i folder, z którego chcesz migrować dane.",
      title_map_states: "Mapuj stany",
      description_map_states:
        "Automatycznie dopasowaliśmy statusy ClickUp do stanów Plane najlepiej jak to możliwe. Proszę zmapować pozostałe stany przed kontynuacją, możesz również tworzyć stany i mapować je ręcznie.",
      title_map_priorities: "Mapuj priorytety",
      description_map_priorities: "Wybierz priorytety ClickUp, które chcesz zmapować do priorytetów projektu Plane.",
      title_summary: "Podsumowanie",
      description_summary: "Oto podsumowanie danych, które zostaną zmigrowane z ClickUp do Plane.",
      pull_additional_data_title: "Importuj komentarze i załączniki",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "Słupek",
          long_label: "Wykres słupkowy",
          chart_models: {
            basic: "Podstawowy",
            stacked: "Spiętrzony",
            grouped: "Zgrupowany",
          },
          orientation: {
            label: "Orientacja",
            horizontal: "Pozioma",
            vertical: "Pionowa",
            placeholder: "Dodaj orientację",
          },
          bar_color: "Kolor słupka",
        },
        line_chart: {
          short_label: "Linia",
          long_label: "Wykres liniowy",
          chart_models: {
            basic: "Podstawowy",
            multi_line: "Wieloliniowy",
          },
          line_color: "Kolor linii",
          line_type: {
            label: "Typ linii",
            solid: "Ciągła",
            dashed: "Przerywana",
            placeholder: "Dodaj typ linii",
          },
        },
        area_chart: {
          short_label: "Obszar",
          long_label: "Wykres obszarowy",
          chart_models: {
            basic: "Podstawowy",
            stacked: "Spiętrzony",
            comparison: "Porównawczy",
          },
          fill_color: "Kolor wypełnienia",
        },
        donut_chart: {
          short_label: "Donut",
          long_label: "Wykres donutowy",
          chart_models: {
            basic: "Podstawowy",
            progress: "Postęp",
          },
          center_value: "Wartość centralna",
          completed_color: "Kolor ukończenia",
        },
        pie_chart: {
          short_label: "Kołowy",
          long_label: "Wykres kołowy",
          chart_models: {
            basic: "Podstawowy",
          },
          group: {
            label: "Zgrupowane fragmenty",
            group_thin_pieces: "Grupuj cienkie fragmenty",
            minimum_threshold: {
              label: "Minimalny próg",
              placeholder: "Dodaj próg",
            },
            name_group: {
              label: "Nazwa grupy",
              placeholder: '"Mniej niż 5%"',
            },
          },
          show_values: "Pokaż wartości",
          value_type: {
            percentage: "Procent",
            count: "Liczba",
          },
        },
        text: {
          short_label: "Tekst",
          long_label: "Tekst",
          alignment: {
            label: "Wyrównanie tekstu",
            left: "Do lewej",
            center: "Do środka",
            right: "Do prawej",
            placeholder: "Dodaj wyrównanie tekstu",
          },
          text_color: "Kolor tekstu",
        },
        table_chart: {
          short_label: "Tabela",
          long_label: "Wykres tabelaryczny",
          chart_models: {
            basic: {
              short_label: "Podstawowy",
              long_label: "Tabela",
            },
          },
          columns: "Kolumny",
          rows: "Wiersze",
          rows_placeholder: "Dodaj wiersze",
          configure_rows_hint: "Wybierz właściwość dla wierszy, aby wyświetlić tę tabelę.",
        },
      },
      color_palettes: {
        modern: "Nowoczesna",
        horizon: "Horyzontalna",
        earthen: "Ziemista",
      },
      common: {
        add_widget: "Dodaj widżet",
        widget_title: {
          label: "Nazwij ten widżet",
          placeholder: 'np. "Do zrobienia wczoraj", "Wszystkie ukończone"',
        },
        chart_type: "Typ wykresu",
        visualization_type: {
          label: "Typ wizualizacji",
          placeholder: "Dodaj typ wizualizacji",
        },
        date_group: {
          label: "Grupa dat",
          placeholder: "Dodaj grupę dat",
        },
        group_by: "Grupuj według",
        stack_by: "Spiętrzaj według",
        daily: "Dziennie",
        weekly: "Tygodniowo",
        monthly: "Miesięcznie",
        yearly: "Rocznie",
        work_item_count: "Liczba elementów pracy",
        estimate_point: "Punkt szacunkowy",
        pending_work_item: "Oczekujące elementy pracy",
        completed_work_item: "Ukończone elementy pracy",
        in_progress_work_item: "Elementy pracy w trakcie",
        blocked_work_item: "Zablokowane elementy pracy",
        work_item_due_this_week: "Elementy pracy na ten tydzień",
        work_item_due_today: "Elementy pracy na dziś",
        color_scheme: {
          label: "Schemat kolorów",
          placeholder: "Dodaj schemat kolorów",
        },
        smoothing: "Wygładzanie",
        markers: "Znaczniki",
        legends: "Legendy",
        tooltips: "Podpowiedzi",
        opacity: {
          label: "Przezroczystość",
          placeholder: "Dodaj przezroczystość",
        },
        border: "Obramowanie",
        widget_configuration: "Konfiguracja widżetu",
        configure_widget: "Konfiguruj widżet",
        guides: "Prowadnice",
        style: "Styl",
        area_appearance: "Wygląd obszaru",
        comparison_line_appearance: "Wygląd linii porównawczej",
        add_property: "Dodaj właściwość",
        add_metric: "Dodaj metrykę",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "Oś X nie ma wartości.",
            y_axis_metric: "Metryka nie ma wartości.",
          },
          stacked: {
            x_axis_property: "Oś X nie ma wartości.",
            y_axis_metric: "Metryka nie ma wartości.",
            group_by: "Spiętrzaj według nie ma wartości.",
          },
          grouped: {
            x_axis_property: "Oś X nie ma wartości.",
            y_axis_metric: "Metryka nie ma wartości.",
            group_by: "Grupuj według nie ma wartości.",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "Oś X nie ma wartości.",
            y_axis_metric: "Metryka nie ma wartości.",
          },
          multi_line: {
            x_axis_property: "Oś X nie ma wartości.",
            y_axis_metric: "Metryka nie ma wartości.",
            group_by: "Grupuj według nie ma wartości.",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "Oś X nie ma wartości.",
            y_axis_metric: "Metryka nie ma wartości.",
          },
          stacked: {
            x_axis_property: "Oś X nie ma wartości.",
            y_axis_metric: "Metryka nie ma wartości.",
            group_by: "Spiętrzaj według nie ma wartości.",
          },
          comparison: {
            x_axis_property: "Oś X nie ma wartości.",
            y_axis_metric: "Metryka nie ma wartości.",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "Oś X nie ma wartości.",
            y_axis_metric: "Metryka nie ma wartości.",
          },
          progress: {
            y_axis_metric: "Metryka nie ma wartości.",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "Oś X nie ma wartości.",
            y_axis_metric: "Metryka nie ma wartości.",
          },
        },
        text: {
          basic: {
            y_axis_metric: "Metryka nie ma wartości.",
          },
        },
        table_chart: {
          basic: {
            x_axis_property: "Kolumny nie mają wartości.",
            group_by: "Wiersze nie mają wartości.",
          },
        },
        ask_admin: "Poproś swojego administratora o skonfigurowanie tego widżetu.",
      },
    },
    create_modal: {
      heading: {
        create: "Utwórz nowy dashboard",
        update: "Aktualizuj dashboard",
      },
      title: {
        label: "Nazwij swój dashboard.",
        placeholder: '"Pojemność między projektami", "Obciążenie według zespołu", "Stan we wszystkich projektach"',
        required_error: "Tytuł jest wymagany",
      },
      project: {
        label: "Wybierz projekty",
        placeholder: "Dane z tych projektów będą zasilać ten dashboard.",
        required_error: "Projekty są wymagane",
      },
      filters_label: "Ustaw filtry dla powyższych źródeł danych",
      create_dashboard: "Utwórz dashboard",
      update_dashboard: "Aktualizuj dashboard",
    },
    delete_modal: {
      heading: "Usuń dashboard",
    },
    empty_state: {
      feature_flag: {
        title: "Prezentuj swój postęp w dostępnych na żądanie, permanentnych dashboardach.",
        description:
          "Buduj dowolny dashboard, którego potrzebujesz i dostosuj wygląd swoich danych dla idealnej prezentacji swojego postępu.",
        coming_soon_to_mobile: "Wkrótce dostępne w aplikacji mobilnej",
        card_1: {
          title: "Dla wszystkich Twoich projektów",
          description:
            "Uzyskaj całościowy widok swojego workspejsu ze wszystkimi projektami lub pokrój swoje dane pracy dla idealnego widoku postępu.",
        },
        card_2: {
          title: "Dla dowolnych danych w Plane",
          description:
            "Wyjdź poza standardową Analitykę i gotowe wykresy Cykli, aby spojrzeć na zespoły, inicjatywy lub cokolwiek innego w sposób, jakiego wcześniej nie widziałeś.",
        },
        card_3: {
          title: "Dla wszystkich potrzeb wizualizacji danych",
          description:
            "Wybieraj spośród kilku konfigurowalnych wykresów z precyzyjnymi kontrolkami, aby widzieć i pokazywać swoje dane pracy dokładnie tak, jak chcesz.",
        },
        card_4: {
          title: "Na żądanie i na stałe",
          description:
            "Zbuduj raz, zachowaj na zawsze z automatycznym odświeżaniem danych, kontekstowymi flagami dla zmian zakresu i udostępnianymi stałymi linkami.",
        },
        card_5: {
          title: "Eksporty i zaplanowana komunikacja",
          description:
            "Na te momenty, gdy linki nie działają, eksportuj swoje dashboardy do jednorazowych PDF-ów lub zaplanuj ich automatyczne wysyłanie do interesariuszy.",
        },
        card_6: {
          title: "Automatyczne układanie dla wszystkich urządzeń",
          description:
            "Zmień rozmiar swoich widżetów dla pożądanego układu i oglądaj je dokładnie tak samo na urządzeniach mobilnych, tabletach i innych przeglądarkach.",
        },
      },
      dashboards_list: {
        title: "Wizualizuj dane w widżetach, buduj swoje dashboardy z widżetami i oglądaj najnowsze na żądanie.",
        description:
          "Buduj swoje dashboardy z niestandardowymi widżetami, które pokazują Twoje dane w określonym zakresie. Uzyskaj dashboardy dla całej swojej pracy w projektach i zespołach oraz udostępniaj stałe linki interesariuszom do śledzenia na żądanie.",
      },
      dashboards_search: {
        title: "To nie pasuje do nazwy dashboardu.",
        description: "Upewnij się, że Twoje zapytanie jest poprawne lub spróbuj innego zapytania.",
      },
      widgets_list: {
        title: "Wizualizuj swoje dane tak, jak chcesz.",
        description: `Używaj linii, słupków, wykresów kołowych i innych formatów, aby zobaczyć swoje dane
w sposób, jaki chcesz, z określonych przez Ciebie źródeł.`,
      },
      widget_data: {
        title: "Nic tu nie widać",
        description: "Odśwież lub dodaj dane, aby je tutaj zobaczyć.",
      },
    },
    common: {
      editing: "Edytowanie",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "Zezwalaj na nowe elementy pracy",
      work_item_creation_disable_tooltip: "Tworzenie elementów pracy jest wyłączone dla tego stanu",
      default_state: "Stan domyślny pozwala wszystkim członkom tworzyć nowe elementy pracy. Nie można tego zmienić",
      state_change_count: "{count, plural, one {1 dozwolona zmiana stanu} other {{count} dozwolone zmiany stanu}}",
      movers_count: "{count, plural, one {1 wymieniony recenzent} other {{count} wymienionych recenzentów}}",
      state_changes: {
        label: {
          default: "Dodaj dozwoloną zmianę stanu",
          loading: "Dodawanie dozwolonej zmiany stanu",
        },
        move_to: "Zmień stan na",
        movers: {
          label: "Gdy zrecenzowane przez",
          tooltip:
            "Recenzenci to osoby, które mają pozwolenie na przenoszenie elementów pracy z jednego stanu do drugiego.",
          add: "Dodaj recenzentów",
        },
      },
    },
    workflow_disabled: {
      title: "Nie możesz przenieść tego elementu pracy tutaj.",
    },
    workflow_enabled: {
      label: "Zmiana stanu",
    },
    workflow_tree: {
      label: "Dla elementów pracy w",
      state_change_label: "może przenieść to do",
    },
    empty_state: {
      upgrade: {
        title: "Kontroluj chaos zmian i recenzji dzięki Workflowom.",
        description:
          "Ustaw reguły dotyczące tego, gdzie przenosi się Twoja praca, przez kogo i kiedy, dzięki Workflowom w Plane.",
      },
    },
    quick_actions: {
      view_change_history: "Zobacz historię zmian",
      reset_workflow: "Zresetuj workflow",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "Czy na pewno chcesz zresetować ten workflow?",
        description:
          "Jeśli zresetujesz ten workflow, wszystkie Twoje reguły zmiany stanu zostaną usunięte i będziesz musiał je utworzyć ponownie, aby uruchomić je w tym projekcie.",
      },
      delete_state_change: {
        title: "Czy na pewno chcesz usunąć tę regułę zmiany stanu?",
        description:
          "Po usunięciu nie możesz cofnąć tej zmiany i będziesz musiał ponownie ustawić regułę, jeśli chcesz, aby działała dla tego projektu.",
      },
    },
    toasts: {
      enable_disable: {
        loading: "{action} workflow",
        success: {
          title: "Sukces",
          message: "Workflow {action} pomyślnie",
        },
        error: {
          title: "Błąd",
          message: "Workflow nie mógł zostać {action}. Spróbuj ponownie.",
        },
      },
      reset: {
        success: {
          title: "Sukces",
          message: "Workflow zresetowany pomyślnie",
        },
        error: {
          title: "Błąd resetowania workflow",
          message: "Workflow nie mógł zostać zresetowany. Spróbuj ponownie.",
        },
      },
      add_state_change_rule: {
        error: {
          title: "Błąd dodawania reguły zmiany stanu",
          message: "Reguła zmiany stanu nie mogła zostać dodana. Spróbuj ponownie.",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "Błąd modyfikowania reguły zmiany stanu",
          message: "Reguła zmiany stanu nie mogła zostać zmodyfikowana. Spróbuj ponownie.",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "Błąd usuwania reguły zmiany stanu",
          message: "Reguła zmiany stanu nie mogła zostać usunięta. Spróbuj ponownie.",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "Błąd modyfikowania recenzentów reguły zmiany stanu",
          message: "Recenzenci reguły zmiany stanu nie mogli zostać zmodyfikowani. Spróbuj ponownie.",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {Klient} other {Klienci}}",
    open: "Otwórz klienta",
    dropdown: {
      placeholder: "Wybierz klienta",
      required: "Proszę wybrać klienta",
      no_selection: "Brak klientów",
    },
    upgrade: {
      title: "Priorytetyzuj i zarządzaj pracą z Klientami.",
      description: "Mapuj swoją pracę do klientów i ustalaj priorytety według atrybutów klienta.",
    },
    properties: {
      default: {
        title: "Domyślne właściwości",
        customer_name: {
          name: "Nazwa klienta",
          placeholder: "To może być nazwa osoby lub firmy",
          validation: {
            required: "Nazwa klienta jest wymagana.",
            max_length: "Nazwa klienta nie może przekraczać 255 znaków.",
          },
        },
        description: {
          name: "Opis",
          validation: {},
        },
        email: {
          name: "Email",
          placeholder: "Wprowadź email",
          validation: {
            required: "Email jest wymagany.",
            pattern: "Nieprawidłowy adres email.",
          },
        },
        website_url: {
          name: "Strona internetowa",
          placeholder: "Każdy adres URL z https:// będzie działać.",
          placeholder_short: "Dodaj stronę",
          validation: {
            pattern: "Nieprawidłowy adres URL strony",
          },
        },
        employees: {
          name: "Pracownicy",
          placeholder: "Liczba pracowników, jeśli Twój klient jest firmą.",
          validation: {
            min_length: "Liczba pracowników nie może być mniejsza niż 0.",
            max_length: "Liczba pracowników nie może być większa niż 2147483647.",
          },
        },
        size: {
          name: "Wielkość",
          placeholder: "Dodaj wielkość firmy",
          validation: {
            min_length: "Nieprawidłowa wielkość",
          },
        },
        domain: {
          name: "Branża",
          placeholder: "Retail, e-Commerce, Fintech, Bankowość",
          placeholder_short: "Dodaj branżę",
          validation: {},
        },
        stage: {
          name: "Etap",
          placeholder: "Wybierz etap",
          validation: {},
        },
        contract_status: {
          name: "Status kontraktu",
          placeholder: "Wybierz status kontraktu",
          validation: {},
        },
        revenue: {
          name: "Przychód",
          placeholder: "To jest przychód, który Twój klient generuje rocznie.",
          placeholder_short: "Dodaj przychód",
          validation: {
            min_length: "Przychód nie może być mniejszy niż 0.",
          },
        },
        invalid_value: "Nieprawidłowa wartość właściwości.",
      },
      custom: {
        title: "Niestandardowe właściwości",
        info: "Dodaj unikalne atrybuty swoich klientów do Plane, aby lepiej zarządzać elementami pracy lub rekordami klientów.",
      },
      empty_state: {
        title: "Nie masz jeszcze żadnych niestandardowych właściwości.",
        description:
          "Niestandardowe właściwości, które chciałbyś zobaczyć w elementach pracy, gdzie indziej w Plane lub poza Plane w CRM lub innym narzędziu, pojawią się tutaj, gdy je dodasz.",
      },
      add: {
        primary_button: "Dodaj nową właściwość",
      },
    },
    stage: {
      lead: "Lead",
      sales_qualified_lead: "Wykwalifikowany lead sprzedażowy",
      contract_negotiation: "Negocjacje kontraktu",
      closed_won: "Zamknięte wygrane",
      closed_lost: "Zamknięte przegrane",
    },
    contract_status: {
      active: "Aktywny",
      pre_contract: "Przed-kontraktowy",
      signed: "Podpisany",
      inactive: "Nieaktywny",
    },
    empty_state: {
      detail: {
        title: "Nie mogliśmy znaleźć tego rekordu klienta.",
        description: "Link do tego rekordu może być nieprawidłowy lub ten rekord mógł zostać usunięty.",
        primary_button: "Przejdź do klientów",
        secondary_button: "Dodaj klienta",
      },
      search: {
        title: "Nie masz rekordów klientów pasujących do tego terminu.",
        description:
          "Spróbuj z innym terminem wyszukiwania lub skontaktuj się z nami, jeśli jesteś pewien, że powinieneś widzieć wyniki dla tego terminu.",
      },
      list: {
        title: "Zarządzaj wolumenem, tempem i przepływem swojej pracy według tego, co jest ważne dla Twoich klientów.",
        description:
          "Dzięki Klientom, funkcji dostępnej tylko w Plane, możesz teraz tworzyć nowych klientów od podstaw i łączyć ich ze swoją pracą. Wkrótce będziesz mógł importować ich z innych narzędzi wraz z niestandardowymi atrybutami, które są dla Ciebie ważne.",
        primary_button: "Dodaj swojego pierwszego klienta",
      },
    },
    settings: {
      unauthorized: "Nie masz uprawnień do dostępu do tej strony.",
      description: "Śledź i zarządzaj relacjami z klientami w swoim przepływie pracy.",
      enable: "Włącz Klientów",
      toasts: {
        enable: {
          loading: "Włączanie funkcji klientów...",
          success: {
            title: "Włączyłeś Klientów dla tego workspejsu.",
            message: "Nie możesz tego ponownie wyłączyć.",
          },
          error: {
            title: "Nie mogliśmy włączyć Klientów tym razem.",
            message: "Spróbuj ponownie lub wróć do tego ekranu później. Jeśli nadal nie działa.",
            action: "Porozmawiaj z pomocą techniczną",
          },
        },
        disable: {
          loading: "Wyłączanie funkcji klientów...",
          success: {
            title: "Klienci wyłączeni",
            message: "Funkcja Klientów została pomyślnie wyłączona!",
          },
          error: {
            title: "Błąd",
            message: "Nie udało się wyłączyć funkcji klientów!",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "Nie mogliśmy pobrać Twojej listy klientów.",
          message: "Spróbuj ponownie lub odśwież tę stronę.",
        },
      },
      copy_link: {
        title: "Skopiowałeś bezpośredni link do tego klienta.",
        message: "Wklej go gdziekolwiek, a zaprowadzi prosto tutaj.",
      },
      create: {
        success: {
          title: "{customer_name} jest teraz dostępny",
          message: "Możesz odwoływać się do tego klienta w elementach pracy i śledzić od niego prośby.",
          actions: {
            view: "Zobacz",
            copy_link: "Kopiuj link",
            copied: "Skopiowano!",
          },
        },
        error: {
          title: "Nie mogliśmy utworzyć tego rekordu tym razem.",
          message:
            "Spróbuj zapisać go ponownie lub skopiuj niezapisany tekst do nowego wpisu, najlepiej w innej karcie.",
        },
      },
      update: {
        success: {
          title: "Sukces!",
          message: "Zaktualizowano klienta pomyślnie!",
        },
        error: {
          title: "Błąd!",
          message: "Nie można zaktualizować klienta. Spróbuj ponownie!",
        },
      },
      logo: {
        error: {
          title: "Nie mogliśmy przesłać logo klienta.",
          message: "Spróbuj zapisać logo ponownie lub zacznij od nowa.",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "Usunąłeś element pracy z rekordu tego klienta.",
            message: "Automatycznie usunęliśmy także tego klienta z elementu pracy.",
          },
          error: {
            title: "Błąd!",
            message: "Nie mogliśmy usunąć tego elementu pracy z rekordu tego klienta tym razem.",
          },
        },
        add: {
          error: {
            title: "Nie mogliśmy dodać tego elementu pracy do rekordu tego klienta tym razem.",
            message:
              "Spróbuj dodać ten element pracy ponownie lub wróć do niego później. Jeśli nadal nie działa, skontaktuj się z nami.",
          },
          success: {
            title: "Dodałeś element pracy do rekordu tego klienta.",
            message: "Automatycznie dodaliśmy też tego klienta do elementu pracy.",
          },
        },
      },
    },
    quick_actions: {
      edit: "Edytuj",
      copy_link: "Kopiuj link do klienta",
      delete: "Usuń",
    },
    create: {
      label: "Utwórz rekord klienta",
      loading: "Tworzenie",
      cancel: "Anuluj",
    },
    update: {
      label: "Aktualizuj klienta",
      loading: "Aktualizowanie",
    },
    delete: {
      title: "Czy na pewno chcesz usunąć rekord klienta {customer_name}?",
      description:
        "Wszystkie dane związane z tym rekordem zostaną trwale usunięte. Nie będziesz mógł później przywrócić tego rekordu.",
    },
    requests: {
      empty_state: {
        list: {
          title: "Nie ma jeszcze próśb do pokazania.",
          description: "Twórz prośby od swoich klientów, aby móc linkować je do elementów pracy.",
          button: "Dodaj nową prośbę",
        },
        search: {
          title: "Nie masz próśb pasujących do tego terminu.",
          description:
            "Spróbuj z innym terminem wyszukiwania lub skontaktuj się z nami, jeśli jesteś pewien, że powinieneś widzieć wyniki dla tego terminu.",
        },
      },
      label: "{count, plural, one {Prośba} other {Prośby}}",
      add: "Dodaj prośbę",
      create: "Utwórz prośbę",
      update: "Aktualizuj prośbę",
      form: {
        name: {
          placeholder: "Nazwij tę prośbę",
          validation: {
            required: "Nazwa jest wymagana.",
            max_length: "Nazwa prośby nie powinna przekraczać 255 znaków.",
          },
        },
        description: {
          placeholder: "Opisz charakter prośby lub wklej komentarz tego klienta z innego narzędzia.",
        },
        source: {
          add: "Dodaj źródło",
          update: "Aktualizuj źródło",
          url: {
            label: "URL",
            required: "Url jest wymagany",
            invalid: "Nieprawidłowy adres URL strony",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "Link skopiowany",
          message: "Link do prośby klienta skopiowany do schowka.",
        },
        attachment: {
          upload: {
            loading: "Przesyłanie załącznika...",
            success: {
              title: "Załącznik przesłany",
              message: "Załącznik został pomyślnie przesłany.",
            },
            error: {
              title: "Załącznik nie został przesłany",
              message: "Załącznik nie mógł zostać przesłany.",
            },
          },
          size: {
            error: {
              title: "Błąd!",
              message: "Tylko jeden plik może być przesłany na raz.",
            },
          },
          length: {
            message: "Plik musi mieć {size}MB lub mniej",
          },
          remove: {
            success: {
              title: "Załącznik usunięty",
              message: "Załącznik został pomyślnie usunięty",
            },
            error: {
              title: "Załącznik nie został usunięty",
              message: "Załącznik nie mógł zostać usunięty",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "Sukces!",
              message: "Źródło zaktualizowane pomyślnie!",
            },
            error: {
              title: "Błąd!",
              message: "Nie można zaktualizować źródła.",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "Błąd!",
              message: "Nie można dodać elementów pracy do prośby. Spróbuj ponownie.",
            },
            success: {
              title: "Sukces!",
              message: "Dodano elementy pracy do prośby.",
            },
          },
        },
        update: {
          success: {
            message: "Prośba zaktualizowana pomyślnie!",
            title: "Sukces!",
          },
          error: {
            title: "Błąd!",
            message: "Nie można zaktualizować prośby. Spróbuj ponownie!",
          },
        },
        create: {
          success: {
            message: "Prośba utworzona pomyślnie!",
            title: "Sukces!",
          },
          error: {
            title: "Błąd!",
            message: "Nie można utworzyć prośby. Spróbuj ponownie!",
          },
        },
      },
    },
    linked_work_items: {
      label: "Połączone elementy pracy",
      link: "Połącz elementy pracy",
      empty_state: {
        list: {
          title: "Nie masz jeszcze połączonych elementów pracy z tym klientem.",
          description:
            "Połącz istniejące elementy pracy z dowolnego projektu tutaj, aby móc śledzić je według tego klienta.",
          button: "Połącz element pracy",
        },
      },
      action: {
        remove_epic: "Usuń epik",
        remove: "Usuń element pracy",
      },
    },
    sidebar: {
      properties: "Właściwości",
    },
  },
  templates: {
    settings: {
      title: "Szablony",
      description:
        "Zaoszczędź 80% czasu spędzonego na tworzeniu projektów, elementów pracy i stron, korzystając z szablonów.",
      options: {
        project: {
          label: "Szablony projektów",
        },
        work_item: {
          label: "Szablony elementów pracy",
        },
        page: {
          label: "Szablony stron",
        },
      },
      create_template: {
        label: "Utwórz szablon",
        no_permission: {
          project: "Skontaktuj się z administratorem projektu, aby utworzyć szablony",
          workspace: "Skontaktuj się z administratorem workspejsu, aby utworzyć szablony",
        },
      },
      use_template: {
        button: {
          default: "Użyj szablonu",
          loading: "Używam",
        },
      },
      template_source: {
        workspace: {
          info: "Utworzony z workspejsu",
        },
        project: {
          info: "Utworzony z projektu",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "Nazwij swój szablon projektu.",
              validation: {
                required: "Nazwa szablonu jest wymagana",
                maxLength: "Nazwa szablonu powinna mieć mniej niż 255 znaków",
              },
            },
            description: {
              placeholder: "Opisz kiedy i jak korzystać z tego szablonu.",
            },
          },
          name: {
            placeholder: "Nazwij swój projekt.",
            validation: {
              required: "Tytuł projektu jest wymagany",
              maxLength: "Tytuł projektu powinien mieć mniej niż 255 znaków",
            },
          },
          description: {
            placeholder: "Opisz cel i założenia tego projektu.",
          },
          button: {
            create: "Utwórz szablon projektu",
            update: "Aktualizuj szablon projektu",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "Nazwij swój szablon elementu pracy.",
              validation: {
                required: "Nazwa szablonu jest wymagana",
                maxLength: "Nazwa szablonu powinna mieć mniej niż 255 znaków",
              },
            },
            description: {
              placeholder: "Opisz kiedy i jak korzystać z tego szablonu.",
            },
          },
          name: {
            placeholder: "Nadaj tytuł temu elementowi pracy.",
            validation: {
              required: "Tytuł elementu pracy jest wymagany",
              maxLength: "Tytuł elementu pracy powinien mieć mniej niż 255 znaków",
            },
          },
          description: {
            placeholder: "Opisz ten element pracy, aby było jasne, co osiągniesz po jego ukończeniu.",
          },
          button: {
            create: "Utwórz szablon elementu pracy",
            update: "Aktualizuj szablon elementu pracy",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "Nazwij swój szablon strony.",
              validation: {
                required: "Nazwa szablonu jest wymagana",
                maxLength: "Nazwa szablonu powinna mieć mniej niż 255 znaków",
              },
            },
            description: {
              placeholder: "Opisz kiedy i jak korzystać z tego szablonu.",
            },
          },
          name: {
            placeholder: "Niezidentyfikowana strona",
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
          action: "{isPublished, select, true {Ustawienia publikacji} other {Publikuj na Marketplace}}",
          unpublish_action: "Usuń z Marketplace",
          title: "Ułatw swoim szablonom by były znalezione i rozpoznawalne.",
          name: {
            label: "Nazwa szablonu",
            placeholder: "Nazwij swój szablon",
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
            placeholder: `Zwiększ produktywność i usprawnij komunikację dzięki integracji mowy z tekstem.
• Transkrypcja w czasie rzeczywistym: Natychmiast zamieniaj wypowiedziane słowa na dokładny tekst.
• Tworzenie zadań i komentarzy: Dodawaj zadania, opisy i komentarze za pomocą komend głosowych.`,
            validation: {
              required: "Opis jest wymagany",
            },
          },
          category: {
            label: "Kategoria",
            placeholder: "Wybierz gdzie uważasz, że pasuje najlepiej. Możesz wybrać więcej niż jedną.",
            validation: {
              required: "Przynajmniej jedna kategoria jest wymagana",
            },
          },
          keywords: {
            label: "Słowa kluczowe",
            placeholder:
              "Użyj terminów, które uważasz, że Twoi użytkownicy będą szukać podczas wyszukiwania tego szablonu.",
            helperText:
              "Wprowadź słowa kluczowe oddzielone przecinkami, które pomożą ludziom znaleźć to z wyszukiwania.",
            validation: {
              required: "Przynajmniej jedno słowo kluczowe jest wymagane",
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
            label: "Adres email obsługi",
            placeholder: "help@plane.so",
            validation: {
              invalid: "Nieprawidłowy adres email",
              required: "Adres email obsługi jest wymagany",
              maxLength: "Adres email obsługi powinien mieć mniej niż 255 znaków",
            },
          },
          privacy_policy_url: {
            label: "Link do Twojej polityki prywatności",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "Nieprawidłowy adres URL",
              maxLength: "Adres URL powinien mieć mniej niż 800 znaków",
            },
          },
          terms_of_service_url: {
            label: "Link do Twoich warunków użycia",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "Nieprawidłowy adres URL",
              maxLength: "Adres URL powinien mieć mniej niż 800 znaków",
            },
          },
          cover_image: {
            label: "Dodaj obraz okładki, który będzie wyświetlany w sklepie",
            upload_title: "Prześlij obraz okładki",
            upload_placeholder: "Kliknij, aby przesłać lub przeciągnij i upuść, aby przesłać obraz okładki",
            drop_here: "Upuść tutaj",
            click_to_upload: "Kliknij, aby przesłać",
            invalid_file_or_exceeds_size_limit: "Nieprawidłowy plik lub przekroczono limit rozmiaru. Spróbuj ponownie.",
            upload_and_save: "Prześlij i zapisz",
            uploading: "Przesyłanie",
            remove: "Usuń",
            removing: "Usuwanie",
            validation: {
              required: "Obraz okładki jest wymagany",
            },
          },
          attach_screenshots: {
            label:
              "Dołącz dokumenty i obrazy, które uważasz, że sprawią, że widzowie tego szablonu będą lepiej zrozumieli jego potencjał.",
            validation: {
              required: "Przynajmniej jedno zrzut ekranu jest wymagane",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "Szablony",
        description:
          "Dzięki szablonom projektów, elementów pracy i stron w Plane nie musisz tworzyć projektu od podstaw ani ręcznie ustawiać właściwości elementów pracy.",
        sub_description: "Odzyskaj 80% czasu administracyjnego, korzystając z Szablonów.",
      },
      no_templates: {
        button: "Utwórz swój pierwszy szablon",
      },
      no_labels: {
        description:
          " Brak etykiet. Utwórz etykiety, aby pomóc zorganizować i filtrować elementy pracy w Twoim projekcie.",
      },
      no_work_items: {
        description: "Brak elementów pracy. Dodaj jeden, aby lepiej zorganizować swoją pracę.",
      },
      no_sub_work_items: {
        description: "Brak pod-elementów pracy. Dodaj jeden, aby lepiej zorganizować swoją pracę.",
      },
      page: {
        no_templates: {
          title: "Nie ma szablonów, do których masz dostęp.",
          description: "Proszę utwórz szablon",
        },
        no_results: {
          title: "To nie pasuje do żadnego szablonu.",
          description: "Spróbuj wyszukać innymi terminami.",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "Szablon utworzony",
          message: "{templateName}, szablon typu {templateType}, jest teraz dostępny dla Twojego workspejsu.",
        },
        error: {
          title: "Nie mogliśmy utworzyć tego szablonu tym razem.",
          message:
            "Spróbuj zapisać swoje szczegóły ponownie lub skopiuj je do nowego szablonu, najlepiej w innej karcie.",
        },
      },
      update: {
        success: {
          title: "Szablon zmieniony",
          message: "{templateName}, szablon typu {templateType}, został zmieniony.",
        },
        error: {
          title: "Nie mogliśmy zapisać zmian w tym szablonie.",
          message:
            "Spróbuj zapisać swoje szczegóły ponownie lub wróć do tego szablonu później. Jeśli nadal występują problemy, skontaktuj się z nami.",
        },
      },
      delete: {
        success: {
          title: "Szablon usunięty",
          message: "{templateName}, szablon typu {templateType}, został teraz usunięty z Twojego workspejsu.",
        },
        error: {
          title: "Nie mogliśmy usunąć tego szablonu.",
          message:
            "Spróbuj usunąć go ponownie lub wróć do niego później. Jeśli nadal nie możesz go usunąć, skontaktuj się z nami.",
        },
      },
      unpublish: {
        success: {
          title: "Szablon wycofany z publikacji",
          message: "{templateName}, szablon typu {templateType}, został wycofany z marketplace.",
        },
        error: {
          title: "Nie mogliśmy wycofać tego szablonu z publikacji.",
          message:
            "Spróbuj wycofać go ponownie lub wróć do tego później. Jeśli nadal nie możesz go wycofać, skontaktuj się z nami.",
        },
      },
    },
    delete_confirmation: {
      title: "Usuń szablon",
      description: {
        prefix: "Czy na pewno chcesz usunąć szablon-",
        suffix: "? Wszystkie dane związane z szablonem zostaną trwale usunięte. Tej akcji nie można cofnąć.",
      },
    },
    unpublish_confirmation: {
      title: "Wycofaj szablon z publikacji",
      description: {
        prefix: "Czy na pewno chcesz wycofać szablon z publikacji-",
        suffix: "? Szablon zostanie usunięty z marketplace i nie będzie już dostępny dla innych.",
      },
    },
    dropdown: {
      add: {
        work_item: "Dodaj nowy szablon",
        project: "Dodaj nowy szablon",
      },
      label: {
        project: "Wybierz szablon projektu",
        page: "Wybierz szablon",
      },
      tooltip: {
        work_item: "Wybierz szablon elementu pracy",
      },
      no_results: {
        work_item: "Nie znaleziono szablonów.",
        project: "Nie znaleziono szablonów.",
      },
    },
  },
  intake_forms: {
    create: {
      title: "Utwórz element pracy",
      "sub-title": "Daj zespołowi znać, nad czym chciałbyś, aby pracował.",
      name: "Nazwa",
      email: "E-mail",
      about: "Czego dotyczy ten element pracy?",
      description: "Opisz, co powinno się wydarzyć",
      description_placeholder:
        "Dodaj tyle szczegółów, ile chcesz, aby zespół mógł zidentyfikować Twoją sytuację i potrzeby.",
      loading: "Tworzenie",
      create_work_item: "Utwórz element pracy",
      errors: {
        name: "Nazwa jest wymagana",
        name_max_length: "Nazwa nie może przekraczać 255 znaków",
        email: "E-mail jest wymagany",
        email_invalid: "Nieprawidłowy adres e-mail",
        title: "Tytuł jest wymagany",
        title_max_length: "Tytuł nie może przekraczać 255 znaków",
      },
    },
    success: {
      title: "Twój element pracy jest teraz w kolejce zespołu.",
      description: "Zespół może teraz zatwierdzić lub odrzucić ten element pracy z kolejki zgłoszeń.",
      primary_button: {
        text: "Dodaj kolejny element pracy",
      },
      secondary_button: {
        text: "Dowiedz się więcej o zgłoszeniach",
      },
    },
    how_it_works: {
      title: "Jak to działa?",
      heading: "To jest formularz zgłoszeń.",
      description:
        "Zgłoszenia to funkcja Plane, która pozwala administratorom i kierownikom projektów przyjmować elementy pracy z zewnątrz do swoich projektów.",
      steps: {
        step_1: "Ten krótki formularz pozwala utworzyć nowy element pracy w projekcie Plane.",
        step_2: "Po wysłaniu formularza w zgłoszeniach tego projektu zostanie utworzony nowy element pracy.",
        step_3: "Ktoś z tego projektu lub zespołu to sprawdzi.",
        step_4:
          "Jeśli zatwierdzą, element zostanie przeniesiony do kolejki pracy projektu. W przeciwnym razie zostanie odrzucony.",
        step_5:
          "Aby sprawdzić status elementu, skontaktuj się z kierownikiem projektu, administratorem lub osobą, która przesłała Ci link do tej strony.",
      },
    },
    type_forms: {
      select_types: {
        title: "Wybierz typ elementu pracy",
        search_placeholder: "Szukaj typu elementu pracy",
      },
      actions: {
        select_properties: "Wybierz właściwości",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "Elementy pracy cykliczne",
      description:
        "Ustaw swoją cykliczną pracę raz, a my zajmiemy się powtarzaniem. Wszystko będzie tutaj, gdy będzie to potrzebne.",
      new_recurring_work_item: "Nowy cykliczny element pracy",
      update_recurring_work_item: "Zaktualizuj cykliczny element pracy",
      form: {
        interval: {
          title: "Harmonogram",
          start_date: {
            validation: {
              required: "Data rozpoczęcia jest wymagana",
            },
          },
          interval_type: {
            validation: {
              required: "Typ interwału jest wymagany",
            },
          },
        },
        button: {
          create: "Utwórz cykliczny element pracy",
          update: "Zaktualizuj cykliczny element pracy",
        },
      },
      create_button: {
        label: "Utwórz cykliczny element pracy",
        no_permission: "Skontaktuj się z administratorem projektu, aby utworzyć cykliczne elementy pracy",
      },
    },
    empty_state: {
      upgrade: {
        title: "Twoja praca na autopilocie",
        description:
          "Ustaw raz. Przywrócimy ją, gdy nadejdzie termin. Ulepsz do Business, aby cykliczna praca była bezwysiłkowa.",
      },
      no_templates: {
        button: "Utwórz swój pierwszy cykliczny element pracy",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Cykliczny element pracy utworzony",
          message: "{name}, cykliczny element pracy, jest już dostępny w Twojej przestrzeni roboczej.",
        },
        error: {
          title: "Nie udało się utworzyć cyklicznego elementu pracy.",
          message:
            "Spróbuj ponownie zapisać dane lub skopiuj je do nowego cyklicznego elementu pracy, najlepiej w innej karcie.",
        },
      },
      update: {
        success: {
          title: "Cykliczny element pracy zaktualizowany",
          message: "{name}, cykliczny element pracy, został zaktualizowany.",
        },
        error: {
          title: "Nie udało się zapisać zmian w tym cyklicznym elemencie pracy.",
          message:
            "Spróbuj ponownie zapisać dane lub wróć do tego cyklicznego elementu pracy później. Jeśli problem będzie się powtarzał, skontaktuj się z nami.",
        },
      },
      delete: {
        success: {
          title: "Cykliczny element pracy usunięty",
          message: "{name}, cykliczny element pracy, został usunięty z Twojej przestrzeni roboczej.",
        },
        error: {
          title: "Nie udało się usunąć cyklicznego elementu pracy.",
          message:
            "Spróbuj usunąć go ponownie lub wróć do niego później. Jeśli nadal nie możesz go usunąć, skontaktuj się z nami.",
        },
      },
    },
    delete_confirmation: {
      title: "Usuń cykliczny element pracy",
      description: {
        prefix: "Czy na pewno chcesz usunąć cykliczny element pracy-",
        suffix:
          "? Wszystkie dane powiązane z cyklicznym elementem pracy zostaną trwale usunięte. Tej operacji nie można cofnąć.",
      },
    },
  },
  automations: {
    settings: {
      title: "Niestandardowe automatyzacje",
      create_automation: "Utwórz automatyzację",
    },
    scope: {
      label: "Zakres",
      run_on: "Uruchom na",
    },
    trigger: {
      label: "Wyzwalacz",
      add_trigger: "Dodaj wyzwalacz",
      sidebar_header: "Konfiguracja wyzwalacza",
      input_label: "Jaki jest wyzwalacz dla tej automatyzacji?",
      input_placeholder: "Wybierz opcję",
      section_plane_events: "Zdarzenia Plane",
      section_time_based: "Oparte na czasie",
      fixed_schedule: "Stały harmonogram",
      schedule: {
        frequency: "Częstotliwość",
        select_day: "Wybierz dzień",
        day_of_month: "Dzień miesiąca",
        monthly_every: "Każdy",
        monthly_day_aria: "Dzień {day}",
        time: "Godzina",
        hour: "Godzina",
        minute: "Minuta",
        hour_suffix: "godz",
        minute_suffix: "min",
        am: "AM",
        pm: "PM",
        timezone: "Strefa czasowa",
        timezone_placeholder: "Wybierz strefę czasową",
        frequency_daily: "Codziennie",
        frequency_weekly: "Co tydzień",
        frequency_monthly: "Co miesiąc",
        on: "W",
        validation_weekly_day_required: "Wybierz co najmniej jeden dzień tygodnia.",
        validation_monthly_date_required: "Wybierz dzień miesiąca.",
        main_content_schedule_summary_daily: "Każdego dnia o {time} ({timezone}).",
        main_content_schedule_summary_weekly: "Co tydzień w {days} o {time} ({timezone}).",
        main_content_schedule_summary_monthly: "Co miesiąc w dniu {day} o {time} ({timezone}).",
        schedule_mode: "Tryb harmonogramu",
        schedule_mode_fixed: "Stały",
        schedule_mode_cron: "Cron",
        cron_expression_label: "Wprowadź wyrażenie Cron",
        cron_expression_placeholder: "0 9 * * 1-5",
        cron_invalid: "Nieprawidłowe wyrażenie cron.",
        cron_preview: 'To wyrażenie Cron uruchamia "{description}".',
        main_content_cron_summary: "{description} ({timezone}).",
      },
      button: {
        previous: "Wstecz",
        next: "Dodaj akcję",
      },
    },
    condition: {
      label: "Warunek",
      add_condition: "Dodaj warunek",
      adding_condition: "Dodawanie warunku",
    },
    action: {
      label: "Akcja",
      add_action: "Dodaj akcję",
      sidebar_header: "Akcje",
      input_label: "Co robi automatyzacja?",
      input_placeholder: "Wybierz opcję",
      handler_name: {
        add_comment: "Dodaj komentarz",
        change_property: "Zmień właściwość",
      },
      configuration: {
        label: "Konfiguracja",
        change_property: {
          placeholders: {
            property_name: "Wybierz właściwość",
            change_type: "Wybierz",
            property_value_select: "{count, plural, one{Wybierz wartość} other{Wybierz wartości}}",
            property_value_select_date: "Wybierz datę",
          },
          validation: {
            property_name_required: "Nazwa właściwości jest wymagana",
            change_type_required: "Typ zmiany jest wymagany",
            property_value_required: "Wartość właściwości jest wymagana",
          },
        },
      },
      comment_block: {
        title: "Dodaj komentarz",
      },
      change_property_block: {
        title: "Zmień właściwość",
      },
      validation: {
        delete_only_action: "Wyłącz automatyzację przed usunięciem jej jedynej akcji.",
      },
    },
    conjunctions: {
      and: "I",
      or: "Lub",
      if: "Jeśli",
      then: "Wtedy",
    },
    enable: {
      alert:
        "Naciśnij 'Włącz', gdy automatyzacja będzie gotowa. Po włączeniu automatyzacja będzie gotowa do uruchomienia.",
      validation: {
        required: "Automatyzacja musi mieć wyzwalacz i co najmniej jedną akcję, aby mogła zostać włączona.",
      },
    },
    delete: {
      validation: {
        enabled: "Automatyzacja musi zostać wyłączona przed usunięciem.",
      },
    },
    table: {
      title: "Tytuł automatyzacji",
      last_run_on: "Ostatnie uruchomienie",
      created_on: "Utworzono",
      last_updated_on: "Ostatnia aktualizacja",
      last_run_status: "Status ostatniego uruchomienia",
      average_duration: "Średni czas trwania",
      owner: "Właściciel",
      executions: "Wykonania",
    },
    create_modal: {
      heading: {
        create: "Utwórz automatyzację",
        update: "Zaktualizuj automatyzację",
      },
      title: {
        placeholder: "Nazwij swoją automatyzację.",
        required_error: "Tytuł jest wymagany",
      },
      description: {
        placeholder: "Opisz swoją automatyzację.",
      },
      submit_button: {
        create: "Utwórz automatyzację",
        update: "Zaktualizuj automatyzację",
      },
    },
    delete_modal: {
      heading: "Usuń automatyzację",
    },
    activity: {
      filters: {
        show_fails: "Pokaż błędy",
        all: "Wszystkie",
        only_activity: "Tylko aktywność",
        only_run_history: "Tylko historia uruchomień",
      },
      run_history: {
        initiator: "Inicjator",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Sukces!",
          message: "Automatyzacja została pomyślnie utworzona.",
        },
        error: {
          title: "Błąd!",
          message: "Tworzenie automatyzacji nie powiodło się.",
        },
      },
      update: {
        success: {
          title: "Sukces!",
          message: "Automatyzacja została pomyślnie zaktualizowana.",
        },
        error: {
          title: "Błąd!",
          message: "Aktualizacja automatyzacji nie powiodła się.",
        },
      },
      enable: {
        success: {
          title: "Sukces!",
          message: "Automatyzacja została pomyślnie włączona.",
        },
        error: {
          title: "Błąd!",
          message: "Włączenie automatyzacji nie powiodło się.",
        },
      },
      disable: {
        success: {
          title: "Sukces!",
          message: "Automatyzacja została pomyślnie wyłączona.",
        },
        error: {
          title: "Błąd!",
          message: "Wyłączenie automatyzacji nie powiodło się.",
        },
      },
      delete: {
        success: {
          title: "Automatyzacja usunięta",
          message: "{name}, automatyzacja, została usunięta z Twojego projektu.",
        },
        error: {
          title: "Nie udało się usunąć tej automatyzacji tym razem.",
          message:
            "Spróbuj usunąć ją ponownie lub wróć do niej później. Jeśli nadal nie możesz jej usunąć, skontaktuj się z nami.",
        },
      },
      action: {
        create: {
          error: {
            title: "Błąd!",
            message: "Nie udało się utworzyć akcji. Spróbuj ponownie!",
          },
        },
        update: {
          error: {
            title: "Błąd!",
            message: "Nie udało się zaktualizować akcji. Spróbuj ponownie!",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "Nie ma jeszcze automatyzacji do wyświetlenia.",
        description:
          "Automatyzacje pomagają wyeliminować powtarzalne zadania poprzez ustawianie wyzwalaczy, warunków i akcji. Utwórz jedną, aby zaoszczędzić czas i utrzymać płynny przepływ pracy.",
      },
      upgrade: {
        title: "Automatyzacje",
        description: "Automatyzacje to sposób na automatyzację zadań w Twoim projekcie.",
        sub_description: "Odzyskaj 80% czasu administracyjnego, gdy używasz Automatyzacji.",
      },
    },
  },
  sso: {
    header: "Tożsamość",
    description:
      "Skonfiguruj swoją domenę, aby uzyskać dostęp do funkcji bezpieczeństwa, w tym logowania jednokrotnego.",
    domain_management: {
      header: "Zarządzanie domenami",
      verified_domains: {
        header: "Zweryfikowane domeny",
        description: "Zweryfikuj własność domeny e-mail, aby włączyć logowanie jednokrotne.",
        button_text: "Dodaj domenę",
        list: {
          domain_name: "Nazwa domeny",
          status: "Status",
          status_verified: "Zweryfikowano",
          status_failed: "Niepowodzenie",
          status_pending: "Oczekujące",
        },
        add_domain: {
          title: "Dodaj domenę",
          description: "Dodaj swoją domenę, aby skonfigurować SSO i ją zweryfikować.",
          form: {
            domain_label: "Domena",
            domain_placeholder: "plane.so",
            domain_required: "Domena jest wymagana",
            domain_invalid: "Wprowadź prawidłową nazwę domeny (np. plane.so)",
          },
          primary_button_text: "Dodaj domenę",
          primary_button_loading_text: "Dodawanie",
          toast: {
            success_title: "Sukces!",
            success_message: "Domena została pomyślnie dodana. Proszę zweryfikować ją, dodając rekord DNS TXT.",
            error_message: "Nie udało się dodać domeny. Spróbuj ponownie.",
          },
        },
        verify_domain: {
          title: "Zweryfikuj swoją domenę",
          description: "Wykonaj te kroki, aby zweryfikować swoją domenę.",
          instructions: {
            label: "Instrukcje",
            step_1: "Przejdź do ustawień DNS dla swojego hosta domeny.",
            step_2: {
              part_1: "Utwórz",
              part_2: "rekord TXT",
              part_3: "i wklej pełną wartość rekordu podaną poniżej.",
            },
            step_3: "Ta aktualizacja zwykle trwa kilka minut, ale może zająć do 72 godzin.",
            step_4: 'Kliknij "Zweryfikuj domenę", aby potwierdzić po zaktualizowaniu rekordu DNS.',
          },
          verification_code_label: "Wartość rekordu TXT",
          verification_code_description: "Dodaj ten rekord do ustawień DNS",
          domain_label: "Domena",
          primary_button_text: "Zweryfikuj domenę",
          primary_button_loading_text: "Weryfikowanie",
          secondary_button_text: "Zrobię to później",
          toast: {
            success_title: "Sukces!",
            success_message: "Domena została pomyślnie zweryfikowana.",
            error_message: "Nie udało się zweryfikować domeny. Spróbuj ponownie.",
          },
        },
        delete_domain: {
          title: "Usuń domenę",
          description: {
            prefix: "Czy na pewno chcesz usunąć",
            suffix: "? Tej akcji nie można cofnąć.",
          },
          primary_button_text: "Usuń",
          primary_button_loading_text: "Usuwanie",
          secondary_button_text: "Anuluj",
          toast: {
            success_title: "Sukces!",
            success_message: "Domena została pomyślnie usunięta.",
            error_message: "Nie udało się usunąć domeny. Spróbuj ponownie.",
          },
        },
      },
    },
    providers: {
      header: "Logowanie jednokrotne",
      disabled_message: "Dodaj zweryfikowaną domenę, aby skonfigurować SSO",
      configure: {
        create: "Skonfiguruj",
        update: "Edytuj",
      },
      switch_alert_modal: {
        title: "Przełącz metodę SSO na {newProviderShortName}?",
        content:
          "Zamierzasz włączyć {newProviderLongName} ({newProviderShortName}). Ta akcja automatycznie wyłączy {activeProviderLongName} ({activeProviderShortName}). Użytkownicy próbujący zalogować się przez {activeProviderShortName} nie będą już mogli uzyskać dostępu do platformy, dopóki nie przełączą się na nową metodę. Czy na pewno chcesz kontynuować?",
        primary_button_text: "Przełącz",
        primary_button_text_loading: "Przełączanie",
        secondary_button_text: "Anuluj",
      },
      form_section: {
        title: "Szczegóły dostarczone przez IdP dla {workspaceName}",
      },
      form_action_buttons: {
        saving: "Zapisywanie",
        save_changes: "Zapisz zmiany",
        configure_only: "Tylko konfiguracja",
        configure_and_enable: "Skonfiguruj i włącz",
        default: "Zapisz",
      },
      setup_details_section: {
        title: "{workspaceName} szczegóły dostarczone dla Twojego IdP",
        button_text: "Pobierz szczegóły konfiguracji",
      },
      saml: {
        header: "Włącz SAML",
        description: "Skonfiguruj swojego dostawcę tożsamości SAML, aby włączyć logowanie jednokrotne.",
        configure: {
          title: "Włącz SAML",
          description:
            "Zweryfikuj własność domeny e-mail, aby uzyskać dostęp do funkcji bezpieczeństwa, w tym logowania jednokrotnego.",
          toast: {
            success_title: "Sukces!",
            create_success_message: "Dostawca SAML został pomyślnie utworzony.",
            update_success_message: "Dostawca SAML został pomyślnie zaktualizowany.",
            error_title: "Błąd!",
            error_message: "Nie udało się zapisać dostawcy SAML. Spróbuj ponownie.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Szczegóły internetowe",
            entity_id: {
              label: "Identyfikator jednostki | Odbiorcy | Informacje o metadanych",
              description:
                "Wygenerujemy tę część metadanych, która identyfikuje tę aplikację Plane jako autoryzowaną usługę w Twoim IdP.",
            },
            callback_url: {
              label: "URL logowania jednokrotnego",
              description: "Wygenerujemy to dla Ciebie. Dodaj to w polu URL przekierowania logowania Twojego IdP.",
            },
            logout_url: {
              label: "URL wylogowania jednokrotnego",
              description:
                "Wygenerujemy to dla Ciebie. Dodaj to w polu URL przekierowania wylogowania jednokrotnego Twojego IdP.",
            },
          },
          mobile_details: {
            header: "Szczegóły mobilne",
            entity_id: {
              label: "Identyfikator jednostki | Odbiorcy | Informacje o metadanych",
              description:
                "Wygenerujemy tę część metadanych, która identyfikuje tę aplikację Plane jako autoryzowaną usługę w Twoim IdP.",
            },
            callback_url: {
              label: "URL logowania jednokrotnego",
              description: "Wygenerujemy to dla Ciebie. Dodaj to w polu URL przekierowania logowania Twojego IdP.",
            },
            logout_url: {
              label: "URL wylogowania jednokrotnego",
              description: "Wygenerujemy to dla Ciebie. Dodaj to w polu URL przekierowania wylogowania Twojego IdP.",
            },
          },
          mapping_table: {
            header: "Szczegóły mapowania",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "Włącz OIDC",
        description: "Skonfiguruj swojego dostawcę tożsamości OIDC, aby włączyć logowanie jednokrotne.",
        configure: {
          title: "Włącz OIDC",
          description:
            "Zweryfikuj własność domeny e-mail, aby uzyskać dostęp do funkcji bezpieczeństwa, w tym logowania jednokrotnego.",
          toast: {
            success_title: "Sukces!",
            create_success_message: "Dostawca OIDC został pomyślnie utworzony.",
            update_success_message: "Dostawca OIDC został pomyślnie zaktualizowany.",
            error_title: "Błąd!",
            error_message: "Nie udało się zapisać dostawcy OIDC. Spróbuj ponownie.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Szczegóły internetowe",
            origin_url: {
              label: "URL źródła",
              description:
                "Wygenerujemy to dla tej aplikacji Plane. Dodaj to jako zaufane źródło w odpowiednim polu Twojego IdP.",
            },
            callback_url: {
              label: "URL przekierowania",
              description: "Wygenerujemy to dla Ciebie. Dodaj to w polu URL przekierowania logowania Twojego IdP.",
            },
            logout_url: {
              label: "URL wylogowania",
              description: "Wygenerujemy to dla Ciebie. Dodaj to w polu URL przekierowania wylogowania Twojego IdP.",
            },
          },
          mobile_details: {
            header: "Szczegóły mobilne",
            origin_url: {
              label: "URL źródła",
              description:
                "Wygenerujemy to dla tej aplikacji Plane. Dodaj to jako zaufane źródło w odpowiednim polu Twojego IdP.",
            },
            callback_url: {
              label: "URL przekierowania",
              description: "Wygenerujemy to dla Ciebie. Dodaj to w polu URL przekierowania logowania Twojego IdP.",
            },
            logout_url: {
              label: "URL wylogowania",
              description: "Wygenerujemy to dla Ciebie. Dodaj to w polu URL przekierowania wylogowania Twojego IdP.",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "Nazwa projektu nie może zawierać znaków specjalnych.",
  pql: {
    functions: {
      date: {
        now: {
          description: "Aktualna data i godzina",
        },
        today: {
          description: "Dzisiejsza data",
        },
        start_of_day: {
          description: "Początek dnia",
        },
        end_of_day: {
          description: "Koniec dnia",
        },
        start_of_week: {
          description: "Początek bieżącego tygodnia",
        },
        end_of_week: {
          description: "Koniec bieżącego tygodnia",
        },
        start_of_month: {
          description: "Początek bieżącego miesiąca",
        },
        end_of_month: {
          description: "Koniec bieżącego miesiąca",
        },
        start_of_year: {
          description: "Początek bieżącego roku",
        },
        end_of_year: {
          description: "Koniec bieżącego roku",
        },
        days_ago: {
          description: "Data n dni temu",
        },
        days_from_now: {
          description: "Data za n dni",
        },
        weeks_ago: {
          description: "Data n tygodni temu",
        },
        weeks_from_now: {
          description: "Data za n tygodni",
        },
        months_ago: {
          description: "Data n miesięcy temu",
        },
        months_from_now: {
          description: "Data za n miesięcy",
        },
      },
      user: {
        current_user: {
          description: "Aktualnie zalogowany użytkownik",
        },
        members_of: {
          description: 'Członkowie "project:<id>" lub "teamspace:<id>"',
        },
        workspace_members: {
          description: "Wszyscy członkowie obszaru roboczego",
        },
      },
      cycle: {
        active_cycle: {
          description: "Cykl aktywny dzisiaj",
        },
        completed_cycles: {
          description: "Cykle, których data zakończenia minęła",
        },
        upcoming_cycles: {
          description: "Cykle, których data rozpoczęcia jest w przyszłości",
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
          description: "Termin minął I status jest otwarty",
        },
        has_no_assignee: {
          description: "Element pracy nie ma przypisanego",
        },
        has_no_label: {
          description: "Element pracy nie ma etykiet",
        },
        is_top_level: {
          description: "Nie jest podelement pracy (nie ma rodzica)",
        },
        is_sub_work_item: {
          description: "Jest podelement pracy (ma rodzica)",
        },
        is_epic: {
          description: "Epik",
        },
        is_intake: {
          description: "Jest elementem przyjęcia",
        },
        is_draft: {
          description: "Jest wersją roboczą",
        },
        is_archived: {
          description: "Jest zarchiwizowany",
        },
        has_children: {
          description: "Ma co najmniej jeden podelement",
        },
        has_start_and_due_dates: {
          description: "Ma datę rozpoczęcia i datę terminu",
        },
      },
      relation: {
        linked_to: {
          description: "Elementy pracy powiązane z danym elementem",
        },
        blocked_by: {
          description: "Elementy pracy zablokowane przez dany element",
        },
        blocks: {
          description: "Elementy pracy blokujące dany element",
        },
        child_of: {
          description: "Podelementy danego elementu pracy",
        },
        parent_of: {
          description: "Nadrzędny element pracy danego elementu",
        },
        duplicate_of: {
          description: "Elementy pracy oznaczone jako duplikaty danego elementu",
        },
      },
      history: {
        was_ever: {
          description: "Pole kiedykolwiek miało tę wartość",
        },
        was: {
          description: "Pole miało wcześniej tę wartość (zmienione)",
        },
        changed_from: {
          description: "Pole zostało zmienione z tej wartości",
        },
        changed_to: {
          description: "Pole zostało zmienione na tę wartość",
        },
        changed: {
          description: "Pole zostało zmienione",
        },
        updated_by: {
          description: "Element pracy zaktualizowany przez tego użytkownika",
        },
        commented_by: {
          description: "Element pracy skomentowany przez tego użytkownika",
        },
        field_changed_by: {
          description: "Pole zmienione przez tego użytkownika",
        },
        was_assigned_to: {
          description: "Element pracy przypisany do tego użytkownika",
        },
        changed_after: {
          description: "Pole zmienione po tej dacie",
        },
        changed_before: {
          description: "Pole zmienione przed tą datą",
        },
        field_changed_after: {
          description: "Pole zmienione po tej dacie",
        },
        field_changed_before: {
          description: "Pole zmienione przed tą datą",
        },
        changed_to_after: {
          description: "Pole zmienione na tę wartość po tej dacie",
        },
        changed_to_before: {
          description: "Pole zmienione na tę wartość przed tą datą",
        },
        field_changed_between: {
          description: "Pole zmienione między tymi datami",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "nawiguj",
      accept: "akceptuj",
      close: "zamknij",
      pick_date: "Wybierz datę",
    },
    placeholder: 'Wpisz zapytanie i naciśnij "ENTER", aby filtrować...',
    error: "Błąd podczas przesyłania zapytania. Sprawdź i spróbuj ponownie.",
  },
  releases: {
    label: "{count, plural, one {Wydanie} other {Wydania}}",
    no_release: "Brak wydania",
    unreleased: "Niewydane",
    select_releases: "Wybierz wydania",
    overview: "Przegląd",
    scope: "Zakres",
    page_title: {
      scope: "Wydanie - {name} | Zakres",
      scope_fallback: "Wydanie | Zakres",
    },
    properties: "Właściwości",
    target_date: "Data docelowa",
    lead: "Lider",
    release_tag: "Tag",
    labels: "Etykiety",
    description_placeholder: "Dodaj opis...",
    progress: "Postęp",
    completed_work_items: "Ukończone elementy pracy",
    pending_work_items: "Oczekujące elementy pracy",
    cancelled_work_items: "Anulowane elementy pracy",
    scope_page: {
      work_items: "Elementy pracy",
      add_work_items: "Dodaj elementy pracy",
      remove_from_release: "Usuń z wydania",
      empty_state: {
        title: "Brak elementów pracy",
        description: "Dodaj elementy pracy, aby określić zakres wydania.",
      },
      confirm_remove: {
        content: "Czy na pewno chcesz usunąć ten element pracy z wydania? Pozostanie w projekcie.",
        primary_button: {
          default: "Usuń",
          loading: "Usuwanie",
        },
      },
    },
    empty_state: {
      title: "Brak zakresu",
      description: "Dodaj elementy pracy do wydania, aby śledzić ich ukończenie w tym wydaniu.",
      add_scope: "Dodaj zakres",
      not_found: {
        title: "Nie znaleziono wydania",
        description: "Wydanie mogło zostać usunięte.",
        primary_button: "Powrót do wydań",
      },
    },
    toast: {
      work_items_added: "{count, plural, one {Dodano element pracy} other {Dodano elementy pracy}}",
      work_items_error: "Nie udało się dodać elementów pracy",
    },
    count_releases: "{count, plural, one {# wydanie} other {# wydania}}",
    actions: {
      delete: "Usuń",
    },
    delete_modal: {
      title: "Usuń wydanie",
      content: 'Czy na pewno chcesz usunąć wydanie "{releaseName}"? Tej akcji nie można cofnąć.',
    },
    settings: {
      heading: {
        title: "Wydania",
        description: "Zarządzaj dostawami projektu precyzyjnie dzięki wydaniom.",
      },
      toggle: {
        title: "Włącz wydania",
        description: "Członkowie przestrzeni roboczej będą mieć dostęp do podglądu zakresu w swoich projektach.",
      },
      toasts: {
        enable: {
          loading: "Włączanie wydań...",
          success: {
            title: "Wydania włączone",
            message: "Wydania zostały włączone w tej przestrzeni roboczej.",
          },
          error: {
            title: "Błąd",
            message: "Nie udało się włączyć wydań. Spróbuj ponownie.",
          },
        },
        disable: {
          loading: "Wyłączanie wydań...",
          success: {
            title: "Wydania wyłączone",
            message: "Wydania zostały wyłączone w tej przestrzeni roboczej.",
          },
          error: {
            title: "Błąd",
            message: "Nie udało się wyłączyć wydań. Spróbuj ponownie.",
          },
        },
      },
      tabs: {
        tags: "Tagi wydań",
        labels: "Etykiety",
      },
      tags: {
        title: "Tagi wydań",
        description: "Kategoryzuj i filtruj swoje wydania za pomocą tagów.",
        add: "Dodaj tag",
        empty_state: "Nie ma jeszcze tagów. Utwórz swój pierwszy tag.",
        errors: {
          version_required: "Wersja jest wymagana.",
          version_already_exists: "Tag z tą wersją już istnieje.",
          generic: "Coś poszło nie tak. Spróbuj ponownie.",
        },
        delete_modal: {
          title: "Usuń tag",
          content: 'Czy na pewno chcesz usunąć tag "{tagVersion}"? Tej akcji nie można cofnąć.',
        },
        actions: {
          edit: "Edytuj tag",
          delete: "Usuń tag",
        },
        toasts: {
          delete: {
            success: "Tag został pomyślnie usunięty.",
            error: "Nie udało się usunąć tagu. Spróbuj ponownie.",
          },
        },
      },
      labels: {
        title: "Etykiety",
        description: "Strukturyzuj i organizuj swoje inicjatywy za pomocą etykiet.",
        add: "Dodaj etykietę",
        empty_state: "Nie ma jeszcze etykiet. Utwórz swoją pierwszą etykietę.",
        errors: {
          name_required: "Nazwa jest wymagana.",
          name_already_exists: "Etykieta o tej nazwie już istnieje.",
          generic: "Coś poszło nie tak. Spróbuj ponownie.",
        },
        modal: {
          name_placeholder: "Nazwa etykiety",
          pick_color: "Wybierz kolor etykiety",
        },
        actions: {
          edit: "Edytuj etykietę",
          delete: "Usuń etykietę",
        },
        drag_to_reorder: "Przeciągnij, aby zmienić kolejność",
        delete_modal: {
          title: "Usuń etykietę",
          content: 'Czy na pewno chcesz usunąć etykietę "{labelName}"? Tej akcji nie można cofnąć.',
        },
        toasts: {
          delete: {
            success: "Etykieta została pomyślnie usunięta.",
            error: "Nie udało się usunąć etykiety. Spróbuj ponownie.",
          },
        },
      },
    },
  },
  work_item_type_hierarchy: {
    settings: {
      title: "Hierarchia",
      tab_label: "Hierarchia",
      description:
        "Skonfiguruj poziomy hierarchii, aby zorganizować swoją pracę. Każdy poziom definiuje relację nadrzędną z elementem bezpośrednio powyżej i relację podrzędną z elementem bezpośrednio poniżej. ",
      sidebar_label: "Hierarchia",
      enable_control: {
        title: "Włącz hierarchię",
        description: "Twórz relacje nadrzędny-podrzędny między różnymi typami elementów roboczych.",
        tooltip: "Nie można wyłączyć hierarchii po jej włączeniu.",
      },
      workspace_work_item_types_disabled_banner: {
        content: "Najpierw zdefiniuj typy elementów roboczych, aby utworzyć nową hierarchię.",
        cta: "Ustawienia typów elementów roboczych",
      },
    },
    levels: {
      max_level_placeholder: "Dodaj poziom hierarchii",
      empty_level_placeholder: "Dodaj typ elementu roboczego do poziomu {level}",
      empty_level_unauthorized: "Nie znaleziono typów elementów roboczych na tym poziomie.",
      drag_tooltip: "Przeciągnij, aby zmienić poziom",
      quick_actions: {
        set_as_default: {
          label: "Ustaw jako domyślny",
          toast: {
            loading: "Ustawianie jako domyślny...",
            success: {
              title: "Sukces!",
              message: "Poziom hierarchii {level} został ustawiony jako domyślny.",
            },
            error: {
              title: "Błąd!",
              message: "Nie udało się ustawić poziomu hierarchii {level} jako domyślnego. Spróbuj ponownie.",
            },
          },
        },
      },
      add_to_level_toast: {
        loading: "Dodawanie {workItemTypeName} do poziomu {level}...",
        success: {
          title: "Sukces!",
          message: "{workItemTypeName} pomyślnie dodano do poziomu {level}.",
        },
        error: {
          title: "Błąd!",
          message: "Nie udało się dodać {workItemTypeName} do poziomu {level}, ponieważ narusza to zasady hierarchii.",
        },
      },
    },
    work_item_modal: {
      invalid_work_item_type_create_toast: {
        title: "Błąd!",
        message:
          "Wybrany typ elementu roboczego nie może być użyty do utworzenia nowego elementu roboczego, ponieważ narusza zasady hierarchii.",
      },
      invalid_work_item_type_update_toast: {
        title: "Błąd!",
        message: "Typ elementu roboczego nie może być zaktualizowany, ponieważ narusza zasady hierarchii.",
      },
    },
    work_item_type_modal: {
      level: "Poziom hierarchii",
      invalid_level_toast: {
        title: "Błąd!",
        message: "Typ elementu pracy nie może zostać zaktualizowany, ponieważ narusza zasady hierarchii.",
      },
    },
  },
  page_actions: {
    move_page: {
      placeholders: {
        project_to_all_with_wiki: "Szukaj kolekcji wiki, projektów i przestrzeni zespołowych",
        project_to_project_with_wiki: "Szukaj kolekcji wiki i projektów",
        teamspace_to_all_with_wiki: "Szukaj kolekcji wiki, projektów i przestrzeni zespołowych",
      },
      toasts: {
        collection_error: {
          title: "Przeniesiono do wiki",
          message:
            "Strona została przeniesiona do wiki, ale nie udało się dodać jej do wybranej kolekcji. Pozostaje w General.",
        },
      },
    },
    remove_from_collection: {
      label: "Usuń z kolekcji",
      success_message: "Strona została usunięta z kolekcji.",
      error_message: "Nie udało się usunąć strony z kolekcji. Spróbuj ponownie.",
    },
  },
  wiki_collections: {
    predefined: {
      general: "Ogólne",
      private: "Prywatne",
      shared: "Udostępnione",
      archived: "Zarchiwizowane",
    },
    fallback_name: "Kolekcja",
    form: {
      name_required: "Tytuł kolekcji jest wymagany",
      name_max_length: "Nazwa kolekcji musi mieć mniej niż 255 znaków",
      name_placeholder_create: "Nadaj kolekcji tytuł",
      name_placeholder_edit: "Nazwa kolekcji",
    },
    create_modal: {
      title: "Utwórz kolekcję",
      submit: "Utwórz kolekcję",
    },
    rename_modal: {
      title: "Zmień nazwę kolekcji",
    },
    delete_modal: {
      title: "Usuń kolekcję",
      page_count: "Ta kolekcja zawiera {pageCount} stron. Wybierz, co ma się z nimi stać.",
      transfer_title: "Przenieś strony i usuń kolekcję",
      transfer_description:
        "Przed usunięciem przenieś wszystkie strony do innej kolekcji. Strony i ich uprawnienia zostaną zachowane.",
      transfer_warning: "Przeniesione strony odziedziczą uprawnienia wybranej kolekcji.",
      transfer_target_label: "Przenieś strony do",
      transfer_target_placeholder: "Wybierz kolekcję",
      delete_with_pages_title: "Usuń kolekcję wraz ze stronami",
      delete_with_pages_description: "Trwale usuwa kolekcję i wszystkie jej strony. Tej operacji nie można cofnąć.",
      submit: "Usuń kolekcję",
    },
    header: {
      add_page: "Dodaj stronę",
    },
    menu: {
      create_new_page: "Utwórz nową stronę",
      add_existing_page: "Dodaj istniejącą stronę",
      rename_collection: "Zmień nazwę kolekcji",
      collection_options: "Opcje kolekcji",
    },
    add_existing_page_modal: {
      search_placeholder: "Szukaj stron",
      success_message: "Dodano {count} stron do kolekcji.",
      error_message: "Nie udało się przenieść stron. Spróbuj ponownie.",
      no_pages_found: "Nie znaleziono stron pasujących do wyszukiwania",
      no_pages_available: "Brak stron dostępnych do przeniesienia",
      submit: "Przenieś",
    },
    list: {
      invite_only: "Tylko na zaproszenie",
      remove_error: "Nie udało się usunąć strony z kolekcji.",
      no_matching_pages: "Brak pasujących stron",
      remove_search_criteria: "Usuń kryteria wyszukiwania, aby zobaczyć wszystkie strony",
      remove_filters: "Usuń filtry, aby zobaczyć wszystkie strony",
      no_pages_title: "Nie ma jeszcze żadnych stron",
      no_pages_description: "Ta kolekcja nie ma jeszcze żadnych stron.",
      untitled: "Bez tytułu",
      restricted_access: "Ograniczony dostęp",
      collapse_page: "Zwiń stronę",
      expand_page: "Rozwiń stronę",
      page_actions: "Akcje strony",
      page_link_copied: "Link do strony skopiowano do schowka.",
      columns: {
        page_name: "Nazwa strony",
        owner: "Właściciel",
        nested_pages: "Zagnieżdżone strony",
        last_activity: "Ostatnia aktywność",
        actions: "Akcje",
      },
    },
    toasts: {
      created: "Kolekcja została utworzona.",
      create_error: "Nie udało się utworzyć kolekcji. Spróbuj ponownie.",
      renamed: "Nazwa kolekcji została zmieniona.",
      rename_error: "Nie udało się zaktualizować kolekcji. Spróbuj ponownie.",
      transferred_deleted: "Strony zostały przeniesione, a kolekcja usunięta.",
      deleted_with_pages: "Kolekcja i jej strony zostały usunięte.",
      delete_error: "Nie udało się usunąć kolekcji. Spróbuj ponownie.",
      target_required: "Wybierz kolekcję, do której chcesz przenieść strony.",
      create_page_error: "Nie udało się utworzyć strony. Spróbuj ponownie.",
      create_page_in_collection_error: "Nie udało się utworzyć strony lub dodać jej do kolekcji. Spróbuj ponownie.",
      collection_link_copied: "Link do kolekcji skopiowano do schowka.",
    },
  },
} as const;
