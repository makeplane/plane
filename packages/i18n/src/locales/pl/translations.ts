export default {
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
  theme: "Motyw",
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
  workspace: "Przestrzeń robocza",
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
  project_id_tooltip_content: "Pomaga jednoznacznie identyfikować elementy pracy w projekcie. Max. 10 znaków.",
  description_placeholder: "Opis",
  only_alphanumeric_non_latin_characters_allowed: "Dozwolone są tylko znaki alfanumeryczne i nielatynowskie.",
  project_id_is_required: "ID projektu jest wymagane",
  project_id_allowed_char: "Dozwolone są tylko znaki alfanumeryczne i nielatynowskie.",
  project_id_min_char: "ID projektu musi mieć co najmniej 1 znak",
  project_id_max_char: "ID projektu może mieć maksymalnie 10 znaków",
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
  pages: "Strony",
  intake: "Zgłoszenia",
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
  discord: "Discord",
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
  priority: "Priorytet",
  none: "Brak",
  urgent: "Pilny",
  high: "Wysoki",
  medium: "Średni",
  low: "Niski",
  members: "Członkowie",
  assignee: "Przypisano",
  assignees: "Przypisani",
  you: "Ty",
  labels: "Etykiety",
  create_new_label: "Utwórz nową etykietę",
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
        description: "Wygląda na to, że wszystkie Twoje widżety są wyłączone. Włącz je\ndla lepszego doświadczenia!",
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
    clear_all: "Wyczyść wszystko",
    copied: "Skopiowano!",
    link_copied: "Link skopiowano!",
    link_copied_to_clipboard: "Link skopiowano do schowka",
    copied_to_clipboard: "Link do elementu pracy skopiowano do schowka",
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
      body: "Cześć Administratorze,\n\nProszę o utworzenie nowej przestrzeni roboczej z adresem [/workspace-name] dla [cel utworzenia].\n\nDziękuję,\n{firstName} {lastName}\n{email}",
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
        description: "Nie znaleziono projektów spełniających kryteria.\nUtwórz nowy.",
      },
      search: {
        description: "Nie znaleziono projektów spełniających kryteria.\nUtwórz nowy.",
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
        title: "Tokeny API",
        add_token: "Dodaj token API",
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
        title: "Odbiór",
        short_title: "Odbiór",
        description:
          "Pozwól osobom niebędącym członkami dzielić się błędami, opiniami i sugestiami; bez zakłócania przepływu pracy.",
        toggle_title: "Włącz odbiór",
        toggle_description: "Pozwól członkom projektu tworzyć żądania odbioru w aplikacji.",
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
} as const;
