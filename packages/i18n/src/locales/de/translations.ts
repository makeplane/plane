export default {
  sidebar: {
    projects: "Projekte",
    pages: "Seiten",
    new_work_item: "Neues Arbeitselement",
    home: "Startseite",
    your_work: "Ihre Arbeit",
    inbox: "Posteingang",
    workspace: "Arbeitsbereich",
    views: "Ansichten",
    analytics: "Analysen",
    work_items: "Arbeitselemente",
    cycles: "Zyklen",
    modules: "Module",
    intake: "Eingang",
    drafts: "Entwürfe",
    favorites: "Favoriten",
    pro: "Pro",
    upgrade: "Upgrade",
  },
  auth: {
    common: {
      email: {
        label: "E-Mail",
        placeholder: "name@unternehmen.de",
        errors: {
          required: "E-Mail ist erforderlich",
          invalid: "E-Mail ist ungültig",
        },
      },
      password: {
        label: "Passwort",
        set_password: "Passwort festlegen",
        placeholder: "Passwort eingeben",
        confirm_password: {
          label: "Passwort bestätigen",
          placeholder: "Passwort bestätigen",
        },
        current_password: {
          label: "Aktuelles Passwort",
        },
        new_password: {
          label: "Neues Passwort",
          placeholder: "Neues Passwort eingeben",
        },
        change_password: {
          label: {
            default: "Passwort ändern",
            submitting: "Passwort wird geändert",
          },
        },
        errors: {
          match: "Passwörter stimmen nicht überein",
          empty: "Bitte geben Sie Ihr Passwort ein",
          length: "Das Passwort sollte länger als 8 Zeichen sein",
          strength: {
            weak: "Das Passwort ist schwach",
            strong: "Das Passwort ist stark",
          },
        },
        submit: "Passwort festlegen",
        toast: {
          change_password: {
            success: {
              title: "Erfolg!",
              message: "Das Passwort wurde erfolgreich geändert.",
            },
            error: {
              title: "Fehler!",
              message: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
            },
          },
        },
      },
      unique_code: {
        label: "Einmaliger Code",
        placeholder: "123456",
        paste_code: "Fügen Sie den an Ihre E-Mail gesendeten Code ein",
        requesting_new_code: "Neuen Code anfordern",
        sending_code: "Code wird gesendet",
      },
      already_have_an_account: "Haben Sie bereits ein Konto?",
      login: "Anmelden",
      create_account: "Konto erstellen",
      new_to_plane: "Neu bei Plane?",
      back_to_sign_in: "Zurück zur Anmeldung",
      resend_in: "Erneut senden in {seconds} Sekunden",
      sign_in_with_unique_code: "Mit einmaligem Code anmelden",
      forgot_password: "Passwort vergessen?",
    },
    sign_up: {
      header: {
        label: "Erstellen Sie ein Konto und beginnen Sie, Ihre Arbeit mit Ihrem Team zu verwalten.",
        step: {
          email: {
            header: "Registrierung",
            sub_header: "",
          },
          password: {
            header: "Registrierung",
            sub_header: "Registrieren Sie sich mit einer Kombination aus E-Mail und Passwort.",
          },
          unique_code: {
            header: "Registrierung",
            sub_header:
              "Registrieren Sie sich mit einem einmaligen Code, der an die oben angegebene E-Mail-Adresse gesendet wurde.",
          },
        },
      },
      errors: {
        password: {
          strength: "Versuchen Sie, ein starkes Passwort zu wählen, um fortzufahren",
        },
      },
    },
    sign_in: {
      header: {
        label: "Melden Sie sich an und beginnen Sie, Ihre Arbeit mit Ihrem Team zu verwalten.",
        step: {
          email: {
            header: "Anmelden oder registrieren",
            sub_header: "",
          },
          password: {
            header: "Anmelden oder registrieren",
            sub_header: "Verwenden Sie Ihre E-Mail-Passwort-Kombination, um sich anzumelden.",
          },
          unique_code: {
            header: "Anmelden oder registrieren",
            sub_header:
              "Melden Sie sich mit einem einmaligen Code an, der an die oben angegebene E-Mail-Adresse gesendet wurde.",
          },
        },
      },
    },
    forgot_password: {
      title: "Passwort zurücksetzen",
      description:
        "Geben Sie die verifizierte E-Mail-Adresse Ihres Benutzerkontos ein, und wir senden Ihnen einen Link zum Zurücksetzen des Passworts.",
      email_sent: "Wir haben Ihnen einen Link zum Zurücksetzen an Ihre E-Mail-Adresse gesendet.",
      send_reset_link: "Link zum Zurücksetzen senden",
      errors: {
        smtp_not_enabled:
          "Wir sehen, dass Ihr Administrator SMTP nicht aktiviert hat; wir können keinen Link zum Zurücksetzen des Passworts senden.",
      },
      toast: {
        success: {
          title: "E-Mail gesendet",
          message:
            "Überprüfen Sie Ihren Posteingang auf den Link zum Zurücksetzen des Passworts. Sollte er innerhalb einiger Minuten nicht ankommen, sehen Sie bitte in Ihrem Spam-Ordner nach.",
        },
        error: {
          title: "Fehler!",
          message: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
        },
      },
    },
    reset_password: {
      title: "Neues Passwort festlegen",
      description: "Sichern Sie Ihr Konto mit einem starken Passwort",
    },
    set_password: {
      title: "Sichern Sie Ihr Konto",
      description: "Das Festlegen eines Passworts hilft Ihnen, sich sicher anzumelden",
    },
    sign_out: {
      toast: {
        error: {
          title: "Fehler!",
          message: "Abmelden fehlgeschlagen. Bitte versuchen Sie es erneut.",
        },
      },
    },
  },
  submit: "Senden",
  cancel: "Abbrechen",
  loading: "Wird geladen",
  error: "Fehler",
  success: "Erfolg",
  warning: "Warnung",
  info: "Information",
  close: "Schließen",
  yes: "Ja",
  no: "Nein",
  ok: "OK",
  name: "Name",
  description: "Beschreibung",
  search: "Suchen",
  add_member: "Mitglied hinzufügen",
  adding_members: "Mitglieder werden hinzugefügt",
  remove_member: "Mitglied entfernen",
  add_members: "Mitglieder hinzufügen",
  adding_member: "Mitglieder werden hinzugefügt",
  remove_members: "Mitglieder entfernen",
  add: "Hinzufügen",
  adding: "Wird hinzugefügt",
  remove: "Entfernen",
  add_new: "Neu hinzufügen",
  remove_selected: "Ausgewählte entfernen",
  first_name: "Vorname",
  last_name: "Nachname",
  email: "E-Mail",
  display_name: "Anzeigename",
  role: "Rolle",
  timezone: "Zeitzone",
  avatar: "Profilbild",
  cover_image: "Titelbild",
  password: "Passwort",
  change_cover: "Titelbild ändern",
  language: "Sprache",
  saving: "Wird gespeichert",
  save_changes: "Änderungen speichern",
  deactivate_account: "Konto deaktivieren",
  deactivate_account_description:
    "Wenn Sie Ihr Konto deaktivieren, werden alle damit verbundenen Daten und Ressourcen dauerhaft gelöscht und können nicht wiederhergestellt werden.",
  profile_settings: "Profileinstellungen",
  your_account: "Ihr Konto",
  security: "Sicherheit",
  activity: "Aktivität",
  appearance: "Aussehen",
  notifications: "Benachrichtigungen",
  workspaces: "Arbeitsbereiche",
  create_workspace: "Arbeitsbereich erstellen",
  invitations: "Einladungen",
  summary: "Zusammenfassung",
  assigned: "Zugewiesen",
  created: "Erstellt",
  subscribed: "Abonniert",
  you_do_not_have_the_permission_to_access_this_page: "Sie haben keine Berechtigung zum Zugriff auf diese Seite.",
  something_went_wrong_please_try_again: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
  load_more: "Mehr laden",
  select_or_customize_your_interface_color_scheme:
    "Wählen oder gestalten Sie Ihr Farbdesign für die Benutzeroberfläche.",
  theme: "Theme",
  system_preference: "Systemeinstellungen",
  light: "Hell",
  dark: "Dunkel",
  light_contrast: "Heller hoher Kontrast",
  dark_contrast: "Dunkler hoher Kontrast",
  custom: "Benutzerdefiniertes Theme",
  select_your_theme: "Wählen Sie ein Theme",
  customize_your_theme: "Passen Sie Ihr Theme an",
  background_color: "Hintergrundfarbe",
  text_color: "Textfarbe",
  primary_color: "Primärfarbe (Theme)",
  sidebar_background_color: "Seitenleisten-Hintergrundfarbe",
  sidebar_text_color: "Seitenleisten-Textfarbe",
  set_theme: "Theme festlegen",
  enter_a_valid_hex_code_of_6_characters: "Geben Sie einen gültigen 6-stelligen Hex-Code ein",
  background_color_is_required: "Die Hintergrundfarbe ist erforderlich",
  text_color_is_required: "Die Textfarbe ist erforderlich",
  primary_color_is_required: "Die Primärfarbe ist erforderlich",
  sidebar_background_color_is_required: "Die Hintergrundfarbe der Seitenleiste ist erforderlich",
  sidebar_text_color_is_required: "Die Textfarbe der Seitenleiste ist erforderlich",
  updating_theme: "Theme wird aktualisiert",
  theme_updated_successfully: "Theme erfolgreich aktualisiert",
  failed_to_update_the_theme: "Aktualisierung des Themes fehlgeschlagen",
  email_notifications: "E-Mail-Benachrichtigungen",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "Bleiben Sie informiert über Arbeitselemente, die Sie abonniert haben. Aktivieren Sie diese Option, um Benachrichtigungen zu erhalten.",
  email_notification_setting_updated_successfully: "E-Mail-Benachrichtigungseinstellung erfolgreich aktualisiert",
  failed_to_update_email_notification_setting: "Aktualisierung der E-Mail-Benachrichtigungseinstellung fehlgeschlagen",
  notify_me_when: "Benachrichtige mich, wenn",
  property_changes: "Eigenschaften ändern",
  property_changes_description:
    "Benachrichtigen Sie mich, wenn sich Eigenschaften von Arbeitselementen wie Zuweisung, Priorität, Schätzungen oder Ähnliches ändern.",
  state_change: "Statusänderung",
  state_change_description: "Benachrichtigen Sie mich, wenn ein Arbeitselement in einen anderen Status wechselt.",
  issue_completed: "Arbeitselement abgeschlossen",
  issue_completed_description: "Benachrichtigen Sie mich nur, wenn ein Arbeitselement abgeschlossen ist.",
  comments: "Kommentare",
  comments_description: "Benachrichtigen Sie mich, wenn jemand einen Kommentar zu einem Arbeitselement hinzufügt.",
  mentions: "Erwähnungen",
  mentions_description:
    "Benachrichtigen Sie mich nur, wenn mich jemand in einem Kommentar oder in einer Beschreibung erwähnt.",
  old_password: "Altes Passwort",
  general_settings: "Allgemeine Einstellungen",
  sign_out: "Abmelden",
  signing_out: "Wird abgemeldet",
  active_cycles: "Aktive Zyklen",
  active_cycles_description:
    "Verfolgen Sie Zyklen in allen Projekten, überwachen Sie hochpriorisierte Arbeitselemente und konzentrieren Sie sich auf Zyklen, die Aufmerksamkeit erfordern.",
  on_demand_snapshots_of_all_your_cycles: "Snapshots aller Ihrer Zyklen auf Abruf",
  upgrade: "Upgrade",
  "10000_feet_view": "Überblick aus 10.000 Fuß über alle aktiven Zyklen.",
  "10000_feet_view_description":
    "Verschaffen Sie sich einen Überblick über alle laufenden Zyklen in allen Projekten auf einmal, anstatt zwischen den Zyklen in jedem Projekt zu wechseln.",
  get_snapshot_of_each_active_cycle: "Erhalten Sie einen Snapshot jedes aktiven Zyklus.",
  get_snapshot_of_each_active_cycle_description:
    "Behalten Sie wichtige Kennzahlen für alle aktiven Zyklen im Blick, verfolgen Sie deren Fortschritt und vergleichen Sie den Umfang mit den Fristen.",
  compare_burndowns: "Vergleichen Sie Burndown-Charts.",
  compare_burndowns_description:
    "Überwachen Sie die Teamleistung, indem Sie sich die Burndown-Berichte jedes Zyklus ansehen.",
  quickly_see_make_or_break_issues: "Erkennen Sie schnell kritische Arbeitselemente.",
  quickly_see_make_or_break_issues_description:
    "Sehen Sie sich hochpriorisierte Arbeitselemente für jeden Zyklus in Bezug auf Fristen an. Alle auf einen Klick anzeigen.",
  zoom_into_cycles_that_need_attention: "Fokussieren Sie sich auf Zyklen, die besondere Aufmerksamkeit erfordern.",
  zoom_into_cycles_that_need_attention_description:
    "Untersuchen Sie den Status jedes Zyklus, der nicht den Erwartungen entspricht, mit nur einem Klick.",
  stay_ahead_of_blockers: "Erkennen Sie frühzeitig Blocker.",
  stay_ahead_of_blockers_description:
    "Identifizieren Sie projektübergreifende Probleme und erkennen Sie Abhängigkeiten zwischen Zyklen, die sonst nicht offensichtlich wären.",
  analytics: "Analysen",
  workspace_invites: "Einladungen zum Arbeitsbereich",
  enter_god_mode: "God-Mode betreten",
  workspace_logo: "Arbeitsbereichslogo",
  new_issue: "Neues Arbeitselement",
  your_work: "Ihre Arbeit",
  drafts: "Entwürfe",
  projects: "Projekte",
  views: "Ansichten",
  workspace: "Arbeitsbereich",
  archives: "Archive",
  settings: "Einstellungen",
  failed_to_move_favorite: "Verschieben des Favoriten fehlgeschlagen",
  favorites: "Favoriten",
  no_favorites_yet: "Noch keine Favoriten",
  create_folder: "Ordner erstellen",
  new_folder: "Neuer Ordner",
  favorite_updated_successfully: "Favorit erfolgreich aktualisiert",
  favorite_created_successfully: "Favorit erfolgreich erstellt",
  folder_already_exists: "Ordner existiert bereits",
  folder_name_cannot_be_empty: "Der Ordnername darf nicht leer sein",
  something_went_wrong: "Etwas ist schiefgelaufen",
  failed_to_reorder_favorite: "Umsortieren des Favoriten fehlgeschlagen",
  favorite_removed_successfully: "Favorit erfolgreich entfernt",
  failed_to_create_favorite: "Erstellen des Favoriten fehlgeschlagen",
  failed_to_rename_favorite: "Umbenennen des Favoriten fehlgeschlagen",
  project_link_copied_to_clipboard: "Projektlink in die Zwischenablage kopiert",
  link_copied: "Link kopiert",
  add_project: "Projekt hinzufügen",
  create_project: "Projekt erstellen",
  failed_to_remove_project_from_favorites:
    "Projekt konnte nicht aus den Favoriten entfernt werden. Bitte versuchen Sie es erneut.",
  project_created_successfully: "Projekt erfolgreich erstellt",
  project_created_successfully_description:
    "Das Projekt wurde erfolgreich erstellt. Sie können nun Arbeitselemente hinzufügen.",
  project_name_already_taken: "Der Projektname ist bereits vergeben.",
  project_identifier_already_taken: "Der Projekt-Identifier ist bereits vergeben.",
  project_cover_image_alt: "Titelbild des Projekts",
  name_is_required: "Name ist erforderlich",
  title_should_be_less_than_255_characters: "Der Titel sollte weniger als 255 Zeichen enthalten",
  project_name: "Projektname",
  project_id_must_be_at_least_1_character: "Projekt-ID muss mindestens 1 Zeichen lang sein",
  project_id_must_be_at_most_5_characters: "Projekt-ID darf maximal 5 Zeichen lang sein",
  project_id: "Projekt-ID",
  project_id_tooltip_content: "Hilft, Arbeitselemente im Projekt eindeutig zu identifizieren. Max. 10 Zeichen.",
  description_placeholder: "Beschreibung",
  only_alphanumeric_non_latin_characters_allowed: "Es sind nur alphanumerische und nicht-lateinische Zeichen erlaubt.",
  project_id_is_required: "Projekt-ID ist erforderlich",
  project_id_allowed_char: "Es sind nur alphanumerische und nicht-lateinische Zeichen erlaubt.",
  project_id_min_char: "Projekt-ID muss mindestens 1 Zeichen lang sein",
  project_id_max_char: "Projekt-ID darf maximal 10 Zeichen lang sein",
  project_description_placeholder: "Geben Sie eine Projektbeschreibung ein",
  select_network: "Netzwerk auswählen",
  lead: "Leitung",
  date_range: "Datumsbereich",
  private: "Privat",
  public: "Öffentlich",
  accessible_only_by_invite: "Nur auf Einladung zugänglich",
  anyone_in_the_workspace_except_guests_can_join: "Jeder im Arbeitsbereich außer Gästen kann beitreten",
  creating: "Wird erstellt",
  creating_project: "Projekt wird erstellt",
  adding_project_to_favorites: "Projekt wird zu Favoriten hinzugefügt",
  project_added_to_favorites: "Projekt zu Favoriten hinzugefügt",
  couldnt_add_the_project_to_favorites:
    "Projekt konnte nicht zu den Favoriten hinzugefügt werden. Bitte versuchen Sie es erneut.",
  removing_project_from_favorites: "Projekt wird aus Favoriten entfernt",
  project_removed_from_favorites: "Projekt aus Favoriten entfernt",
  couldnt_remove_the_project_from_favorites:
    "Projekt konnte nicht aus den Favoriten entfernt werden. Bitte versuchen Sie es erneut.",
  add_to_favorites: "Zu Favoriten hinzufügen",
  remove_from_favorites: "Aus Favoriten entfernen",
  publish_project: "Projekt veröffentlichen",
  publish: "Veröffentlichen",
  copy_link: "Link kopieren",
  leave_project: "Projekt verlassen",
  join_the_project_to_rearrange: "Treten Sie dem Projekt bei, um die Anordnung zu ändern",
  drag_to_rearrange: "Ziehen, um neu anzuordnen",
  congrats: "Herzlichen Glückwunsch!",
  open_project: "Projekt öffnen",
  issues: "Arbeitselemente",
  cycles: "Zyklen",
  modules: "Module",
  pages: "Seiten",
  intake: "Eingang",
  time_tracking: "Zeiterfassung",
  work_management: "Arbeitsverwaltung",
  projects_and_issues: "Projekte und Arbeitselemente",
  projects_and_issues_description: "Aktivieren oder deaktivieren Sie diese Funktionen im Projekt.",
  cycles_description:
    "Zeitlich begrenzen Sie die Arbeit pro Projekt und passen Sie den Zeitraum bei Bedarf an. Ein Zyklus kann 2 Wochen dauern, der nächste nur 1 Woche.",
  modules_description: "Organisieren Sie die Arbeit in Unterprojekte mit eigenen Leitern und Zuständigen.",
  views_description:
    "Speichern Sie benutzerdefinierte Sortierungen, Filter und Anzeigeoptionen oder teilen Sie sie mit Ihrem Team.",
  pages_description: "Erstellen und bearbeiten Sie frei formulierte Inhalte – Notizen, Dokumente, alles Mögliche.",
  intake_description:
    "Erlauben Sie Nicht-Mitgliedern, Bugs, Feedback und Vorschläge zu teilen – ohne Ihren Arbeitsablauf zu stören.",
  time_tracking_description: "Erfassen Sie die auf Arbeitselemente und Projekte verwendete Zeit.",
  work_management_description: "Verwalten Sie Ihre Arbeit und Projekte mühelos.",
  documentation: "Dokumentation",
  message_support: "Support kontaktieren",
  contact_sales: "Vertrieb kontaktieren",
  hyper_mode: "Hyper-Modus",
  keyboard_shortcuts: "Tastaturkürzel",
  whats_new: "Was ist neu?",
  version: "Version",
  we_are_having_trouble_fetching_the_updates: "Wir haben Probleme beim Abrufen der Updates.",
  our_changelogs: "unsere Changelogs",
  for_the_latest_updates: "für die neuesten Updates.",
  please_visit: "Bitte besuchen Sie",
  docs: "Dokumentation",
  full_changelog: "Vollständiges Änderungsprotokoll",
  support: "Support",
  discord: "Discord",
  powered_by_plane_pages: "Bereitgestellt von Plane Pages",
  please_select_at_least_one_invitation: "Bitte wählen Sie mindestens eine Einladung aus.",
  please_select_at_least_one_invitation_description:
    "Wählen Sie mindestens eine Einladung aus, um dem Arbeitsbereich beizutreten.",
  we_see_that_someone_has_invited_you_to_join_a_workspace:
    "Wir sehen, dass Sie jemand in einen Arbeitsbereich eingeladen hat",
  join_a_workspace: "Einem Arbeitsbereich beitreten",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description:
    "Wir sehen, dass Sie jemand in einen Arbeitsbereich eingeladen hat",
  join_a_workspace_description: "Einem Arbeitsbereich beitreten",
  accept_and_join: "Akzeptieren und beitreten",
  go_home: "Zur Startseite",
  no_pending_invites: "Keine ausstehenden Einladungen",
  you_can_see_here_if_someone_invites_you_to_a_workspace:
    "Hier sehen Sie, falls Sie jemand in einen Arbeitsbereich einlädt",
  back_to_home: "Zurück zur Startseite",
  workspace_name: "arbeitsbereich-name",
  deactivate_your_account: "Ihr Konto deaktivieren",
  deactivate_your_account_description:
    "Nach der Deaktivierung können Ihnen keine Arbeitselemente mehr zugewiesen werden, und es fallen keine Gebühren für den Arbeitsbereich an. Um Ihr Konto wieder zu aktivieren, benötigen Sie eine Einladung zu einem Arbeitsbereich an diese E-Mail-Adresse.",
  deactivating: "Wird deaktiviert",
  confirm: "Bestätigen",
  confirming: "Wird bestätigt",
  draft_created: "Entwurf erstellt",
  issue_created_successfully: "Arbeitselement erfolgreich erstellt",
  draft_creation_failed: "Erstellung des Entwurfs fehlgeschlagen",
  issue_creation_failed: "Erstellung des Arbeitselements fehlgeschlagen",
  draft_issue: "Entwurf eines Arbeitselements",
  issue_updated_successfully: "Arbeitselement erfolgreich aktualisiert",
  issue_could_not_be_updated: "Arbeitselement konnte nicht aktualisiert werden",
  create_a_draft: "Einen Entwurf erstellen",
  save_to_drafts: "Als Entwurf speichern",
  save: "Speichern",
  update: "Aktualisieren",
  updating: "Wird aktualisiert",
  create_new_issue: "Neues Arbeitselement erstellen",
  editor_is_not_ready_to_discard_changes: "Der Editor ist nicht bereit, Änderungen zu verwerfen",
  failed_to_move_issue_to_project: "Verschieben des Arbeitselements in das Projekt fehlgeschlagen",
  create_more: "Mehr erstellen",
  add_to_project: "Zum Projekt hinzufügen",
  discard: "Verwerfen",
  duplicate_issue_found: "Doppeltes Arbeitselement gefunden",
  duplicate_issues_found: "Doppelte Arbeitselemente gefunden",
  no_matching_results: "Keine übereinstimmenden Ergebnisse",
  title_is_required: "Ein Titel ist erforderlich",
  title: "Titel",
  state: "Status",
  priority: "Priorität",
  none: "Keine",
  urgent: "Dringend",
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
  members: "Mitglieder",
  assignee: "Zugewiesen",
  assignees: "Zugewiesene",
  you: "Sie",
  labels: "Labels",
  create_new_label: "Neues Label erstellen",
  start_date: "Startdatum",
  end_date: "Enddatum",
  due_date: "Fälligkeitsdatum",
  estimate: "Schätzung",
  change_parent_issue: "Übergeordnetes Arbeitselement ändern",
  remove_parent_issue: "Übergeordnetes Arbeitselement entfernen",
  add_parent: "Übergeordnetes Element hinzufügen",
  loading_members: "Mitglieder werden geladen",
  view_link_copied_to_clipboard: "Ansichtslink in die Zwischenablage kopiert.",
  required: "Erforderlich",
  optional: "Optional",
  Cancel: "Abbrechen",
  edit: "Bearbeiten",
  archive: "Archivieren",
  restore: "Wiederherstellen",
  open_in_new_tab: "In neuem Tab öffnen",
  delete: "Löschen",
  deleting: "Wird gelöscht",
  make_a_copy: "Kopie erstellen",
  move_to_project: "In Projekt verschieben",
  good: "Guten",
  morning: "Morgen",
  afternoon: "Nachmittag",
  evening: "Abend",
  show_all: "Alle anzeigen",
  show_less: "Weniger anzeigen",
  no_data_yet: "Noch keine Daten",
  syncing: "Wird synchronisiert",
  add_work_item: "Arbeitselement hinzufügen",
  advanced_description_placeholder: "Drücken Sie '/' für Befehle",
  create_work_item: "Arbeitselement erstellen",
  attachments: "Anhänge",
  declining: "Wird abgelehnt",
  declined: "Abgelehnt",
  decline: "Ablehnen",
  unassigned: "Nicht zugewiesen",
  work_items: "Arbeitselemente",
  add_link: "Link hinzufügen",
  points: "Punkte",
  no_assignee: "Keine Zuweisung",
  no_assignees_yet: "Noch keine Zuweisungen",
  no_labels_yet: "Noch keine Labels",
  ideal: "Ideal",
  current: "Aktuell",
  no_matching_members: "Keine passenden Mitglieder",
  leaving: "Wird verlassen",
  removing: "Wird entfernt",
  leave: "Verlassen",
  refresh: "Aktualisieren",
  refreshing: "Wird aktualisiert",
  refresh_status: "Status aktualisieren",
  prev: "Zurück",
  next: "Weiter",
  re_generating: "Wird neu generiert",
  re_generate: "Neu generieren",
  re_generate_key: "Schlüssel neu generieren",
  export: "Exportieren",
  member: "{count, plural, one{# Mitglied} few{# Mitglieder} other{# Mitglieder}}",
  new_password_must_be_different_from_old_password: "Das neue Passwort muss von dem alten Passwort abweichen",
  project_view: {
    sort_by: {
      created_at: "Erstellt am",
      updated_at: "Aktualisiert am",
      name: "Name",
    },
  },
  toast: {
    success: "Erfolg!",
    error: "Fehler!",
  },
  links: {
    toasts: {
      created: {
        title: "Link erstellt",
        message: "Link wurde erfolgreich erstellt",
      },
      not_created: {
        title: "Link nicht erstellt",
        message: "Link konnte nicht erstellt werden",
      },
      updated: {
        title: "Link aktualisiert",
        message: "Link wurde erfolgreich aktualisiert",
      },
      not_updated: {
        title: "Link nicht aktualisiert",
        message: "Link konnte nicht aktualisiert werden",
      },
      removed: {
        title: "Link entfernt",
        message: "Link wurde erfolgreich entfernt",
      },
      not_removed: {
        title: "Link nicht entfernt",
        message: "Link konnte nicht entfernt werden",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "Ihr Schnellstartleitfaden",
      not_right_now: "Jetzt nicht",
      create_project: {
        title: "Projekt erstellen",
        description: "Die meisten Dinge beginnen mit einem Projekt in Plane.",
        cta: "Los geht’s",
      },
      invite_team: {
        title: "Team einladen",
        description: "Arbeiten Sie mit Kollegen zusammen, um zu gestalten, bereitzustellen und zu verwalten.",
        cta: "Einladen",
      },
      configure_workspace: {
        title: "Konfigurieren Sie Ihren Arbeitsbereich.",
        description: "Aktivieren oder deaktivieren Sie Funktionen oder gehen Sie weiter ins Detail.",
        cta: "Diesen Bereich konfigurieren",
      },
      personalize_account: {
        title: "Personalisieren Sie Plane.",
        description: "Wählen Sie ein Profilbild, Farben und mehr.",
        cta: "Jetzt personalisieren",
      },
      widgets: {
        title: "Ohne Widgets ist es ruhig, schalten Sie sie ein",
        description:
          "Es scheint, als seien alle Ihre Widgets deaktiviert. Aktivieren Sie sie für ein besseres Erlebnis!",
        primary_button: {
          text: "Widgets verwalten",
        },
      },
    },
    quick_links: {
      empty: "Speichern Sie hier Links zu wichtigen Dingen, auf die Sie schnell zugreifen möchten.",
      add: "Schnelllink hinzufügen",
      title: "Schnelllink",
      title_plural: "Schnelllinks",
    },
    recents: {
      title: "Zuletzt verwendet",
      empty: {
        project: "Ihre kürzlich aufgerufenen Projekte erscheinen hier, nachdem Sie sie geöffnet haben.",
        page: "Ihre kürzlich aufgerufenen Seiten erscheinen hier, nachdem Sie sie geöffnet haben.",
        issue: "Ihre kürzlich aufgerufenen Arbeitselemente erscheinen hier, nachdem Sie sie geöffnet haben.",
        default: "Sie haben noch keine kürzlichen Elemente.",
      },
      filters: {
        all: "Alle",
        projects: "Projekte",
        pages: "Seiten",
        issues: "Arbeitselemente",
      },
    },
    new_at_plane: {
      title: "Neu in Plane",
    },
    quick_tutorial: {
      title: "Schnelles Tutorial",
    },
    widget: {
      reordered_successfully: "Widget erfolgreich verschoben.",
      reordering_failed: "Beim Verschieben des Widgets ist ein Fehler aufgetreten.",
    },
    manage_widgets: "Widgets verwalten",
    title: "Startseite",
    star_us_on_github: "Geben Sie uns einen Stern auf GitHub",
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "URL ist ungültig",
        placeholder: "Geben Sie eine URL ein oder fügen Sie sie ein",
      },
      title: {
        text: "Anzeigename",
        placeholder: "Wie soll dieser Link angezeigt werden",
      },
    },
  },
  common: {
    all: "Alle",
    no_items_in_this_group: "Keine Elemente in dieser Gruppe",
    drop_here_to_move: "Hier ablegen zum Verschieben",
    states: "Status",
    state: "Status",
    state_groups: "Statusgruppen",
    state_group: "Statusgruppe",
    priorities: "Prioritäten",
    priority: "Priorität",
    team_project: "Teamprojekt",
    project: "Projekt",
    cycle: "Zyklus",
    cycles: "Zyklen",
    module: "Modul",
    modules: "Module",
    labels: "Labels",
    label: "Label",
    assignees: "Zugewiesene",
    assignee: "Zugewiesen",
    created_by: "Erstellt von",
    none: "Keine",
    link: "Link",
    estimates: "Schätzungen",
    estimate: "Schätzung",
    created_at: "Erstellt am",
    completed_at: "Abgeschlossen am",
    layout: "Layout",
    filters: "Filter",
    display: "Anzeigen",
    load_more: "Mehr laden",
    activity: "Aktivität",
    analytics: "Analysen",
    dates: "Daten",
    success: "Erfolg!",
    something_went_wrong: "Etwas ist schiefgelaufen",
    error: {
      label: "Fehler!",
      message: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
    },
    group_by: "Gruppieren nach",
    epic: "Epik",
    epics: "Epiks",
    work_item: "Arbeitselement",
    work_items: "Arbeitselemente",
    sub_work_item: "Untergeordnetes Arbeitselement",
    add: "Hinzufügen",
    warning: "Warnung",
    updating: "Wird aktualisiert",
    adding: "Wird hinzugefügt",
    update: "Aktualisieren",
    creating: "Wird erstellt",
    create: "Erstellen",
    cancel: "Abbrechen",
    description: "Beschreibung",
    title: "Titel",
    attachment: "Anhang",
    general: "Allgemein",
    features: "Funktionen",
    automation: "Automatisierung",
    project_name: "Projektname",
    project_id: "Projekt-ID",
    project_timezone: "Projektzeitzone",
    created_on: "Erstellt am",
    update_project: "Projekt aktualisieren",
    identifier_already_exists: "Der Bezeichner existiert bereits",
    add_more: "Mehr hinzufügen",
    defaults: "Standardwerte",
    add_label: "Label hinzufügen",
    customize_time_range: "Zeitraum anpassen",
    loading: "Wird geladen",
    attachments: "Anhänge",
    property: "Eigenschaft",
    properties: "Eigenschaften",
    parent: "Übergeordnet",
    page: "Seite",
    remove: "Entfernen",
    archiving: "Wird archiviert",
    archive: "Archivieren",
    access: {
      public: "Öffentlich",
      private: "Privat",
    },
    done: "Fertig",
    sub_work_items: "Untergeordnete Arbeitselemente",
    comment: "Kommentar",
    workspace_level: "Arbeitsbereichsebene",
    order_by: {
      label: "Sortieren nach",
      manual: "Manuell",
      last_created: "Zuletzt erstellt",
      last_updated: "Zuletzt aktualisiert",
      start_date: "Startdatum",
      due_date: "Fälligkeitsdatum",
      asc: "Aufsteigend",
      desc: "Absteigend",
      updated_on: "Aktualisiert am",
    },
    sort: {
      asc: "Aufsteigend",
      desc: "Absteigend",
      created_on: "Erstellt am",
      updated_on: "Aktualisiert am",
    },
    comments: "Kommentare",
    updates: "Aktualisierungen",
    clear_all: "Alles löschen",
    copied: "Kopiert!",
    link_copied: "Link kopiert!",
    link_copied_to_clipboard: "Link in die Zwischenablage kopiert",
    copied_to_clipboard: "Link zum Arbeitselement in die Zwischenablage kopiert",
    is_copied_to_clipboard: "Arbeitselement in die Zwischenablage kopiert",
    no_links_added_yet: "Noch keine Links hinzugefügt",
    add_link: "Link hinzufügen",
    links: "Links",
    go_to_workspace: "Zum Arbeitsbereich",
    progress: "Fortschritt",
    optional: "Optional",
    join: "Beitreten",
    go_back: "Zurück",
    continue: "Fortfahren",
    resend: "Erneut senden",
    relations: "Beziehungen",
    errors: {
      default: {
        title: "Fehler!",
        message: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
      },
      required: "Dieses Feld ist erforderlich",
      entity_required: "{entity} ist erforderlich",
      restricted_entity: "{entity} ist eingeschränkt",
    },
    update_link: "Link aktualisieren",
    attach: "Anhängen",
    create_new: "Neu erstellen",
    add_existing: "Vorhandenes hinzufügen",
    type_or_paste_a_url: "Geben Sie eine URL ein oder fügen Sie sie ein",
    url_is_invalid: "URL ist ungültig",
    display_title: "Anzeigename",
    link_title_placeholder: "Wie soll dieser Link angezeigt werden",
    url: "URL",
    side_peek: "Seitenvorschau",
    modal: "Modal",
    full_screen: "Vollbild",
    close_peek_view: "Vorschau schließen",
    toggle_peek_view_layout: "Vorschau-Layout umschalten",
    options: "Optionen",
    duration: "Dauer",
    today: "Heute",
    week: "Woche",
    month: "Monat",
    quarter: "Quartal",
    press_for_commands: "Drücken Sie '/' für Befehle",
    click_to_add_description: "Klicken Sie, um eine Beschreibung hinzuzufügen",
    search: {
      label: "Suchen",
      placeholder: "Suchbegriff eingeben",
      no_matches_found: "Keine Übereinstimmungen gefunden",
      no_matching_results: "Keine übereinstimmenden Ergebnisse",
    },
    actions: {
      edit: "Bearbeiten",
      make_a_copy: "Kopie erstellen",
      open_in_new_tab: "In neuem Tab öffnen",
      copy_link: "Link kopieren",
      archive: "Archivieren",
      restore: "Wiederherstellen",
      delete: "Löschen",
      remove_relation: "Beziehung entfernen",
      subscribe: "Abonnieren",
      unsubscribe: "Abo beenden",
      clear_sorting: "Sortierung löschen",
      show_weekends: "Wochenenden anzeigen",
      enable: "Aktivieren",
      disable: "Deaktivieren",
    },
    name: "Name",
    discard: "Verwerfen",
    confirm: "Bestätigen",
    confirming: "Wird bestätigt",
    read_the_docs: "Lesen Sie die Dokumentation",
    default: "Standard",
    active: "Aktiv",
    enabled: "Aktiviert",
    disabled: "Deaktiviert",
    mandate: "Mandat",
    mandatory: "Verpflichtend",
    yes: "Ja",
    no: "Nein",
    please_wait: "Bitte warten",
    enabling: "Wird aktiviert",
    disabling: "Wird deaktiviert",
    beta: "Beta",
    or: "oder",
    next: "Weiter",
    back: "Zurück",
    cancelling: "Wird abgebrochen",
    configuring: "Wird konfiguriert",
    clear: "Löschen",
    import: "Importieren",
    connect: "Verbinden",
    authorizing: "Wird autorisiert",
    processing: "Wird verarbeitet",
    no_data_available: "Keine Daten verfügbar",
    from: "von {name}",
    authenticated: "Authentifiziert",
    select: "Auswählen",
    upgrade: "Upgrade",
    add_seats: "Sitze hinzufügen",
    projects: "Projekte",
    workspace: "Arbeitsbereich",
    workspaces: "Arbeitsbereiche",
    team: "Team",
    teams: "Teams",
    entity: "Entität",
    entities: "Entitäten",
    task: "Aufgabe",
    tasks: "Aufgaben",
    section: "Abschnitt",
    sections: "Abschnitte",
    edit: "Bearbeiten",
    connecting: "Wird verbunden",
    connected: "Verbunden",
    disconnect: "Trennen",
    disconnecting: "Wird getrennt",
    installing: "Wird installiert",
    install: "Installieren",
    reset: "Zurücksetzen",
    live: "Live",
    change_history: "Änderungsverlauf",
    coming_soon: "Demnächst verfügbar",
    member: "Mitglied",
    members: "Mitglieder",
    you: "Sie",
    upgrade_cta: {
      higher_subscription: "Auf ein höheres Abonnement upgraden",
      talk_to_sales: "Mit Vertrieb sprechen",
    },
    category: "Kategorie",
    categories: "Kategorien",
    saving: "Wird gespeichert",
    save_changes: "Änderungen speichern",
    delete: "Löschen",
    deleting: "Wird gelöscht",
    pending: "Ausstehend",
    invite: "Einladen",
    view: "Ansicht",
    deactivated_user: "Deaktivierter Benutzer",
    apply: "Anwenden",
    applying: "Wird angewendet",
    users: "Benutzer",
    admins: "Administratoren",
    guests: "Gäste",
    on_track: "Im Plan",
    off_track: "Außer Plan",
    at_risk: "Gefährdet",
    timeline: "Zeitleiste",
    completion: "Fertigstellung",
    upcoming: "Bevorstehend",
    completed: "Abgeschlossen",
    in_progress: "In Bearbeitung",
    planned: "Geplant",
    paused: "Pausiert",
    no_of: "Anzahl {entity}",
    resolved: "Gelöst",
  },
  chart: {
    x_axis: "X-Achse",
    y_axis: "Y-Achse",
    metric: "Metrik",
  },
  form: {
    title: {
      required: "Ein Titel ist erforderlich",
      max_length: "Der Titel sollte weniger als {length} Zeichen enthalten",
    },
  },
  entity: {
    grouping_title: "Gruppierung von {entity}",
    priority: "Priorität {entity}",
    all: "Alle {entity}",
    drop_here_to_move: "Hier ablegen, um {entity} zu verschieben",
    delete: {
      label: "{entity} löschen",
      success: "{entity} erfolgreich gelöscht",
      failed: "{entity} konnte nicht gelöscht werden",
    },
    update: {
      failed: "{entity} konnte nicht aktualisiert werden",
      success: "{entity} erfolgreich aktualisiert",
    },
    link_copied_to_clipboard: "Link zu {entity} in die Zwischenablage kopiert",
    fetch: {
      failed: "Fehler beim Laden von {entity}",
    },
    add: {
      success: "{entity} erfolgreich hinzugefügt",
      failed: "Fehler beim Hinzufügen von {entity}",
    },
    remove: {
      success: "{entity} erfolgreich entfernt",
      failed: "Fehler beim Entfernen von {entity}",
    },
  },
  epic: {
    all: "Alle Epiks",
    label: "{count, plural, one {Epik} other {Epiks}}",
    new: "Neuer Epik",
    adding: "Epik wird hinzugefügt",
    create: {
      success: "Epik erfolgreich erstellt",
    },
    add: {
      press_enter: "Drücken Sie 'Enter', um einen weiteren Epik hinzuzufügen",
      label: "Epik hinzufügen",
    },
    title: {
      label: "Epik-Titel",
      required: "Ein Titel für den Epik ist erforderlich.",
    },
  },
  issue: {
    label: "{count, plural, one {Arbeitselement} few {Arbeitselemente} other {Arbeitselemente}}",
    all: "Alle Arbeitselemente",
    edit: "Arbeitselement bearbeiten",
    title: {
      label: "Titel des Arbeitselements",
      required: "Ein Titel für das Arbeitselement ist erforderlich.",
    },
    add: {
      press_enter: "Drücken Sie 'Enter', um ein weiteres Arbeitselement hinzuzufügen",
      label: "Arbeitselement hinzufügen",
      cycle: {
        failed: "Hinzufügen des Arbeitselements zum Zyklus fehlgeschlagen. Bitte versuchen Sie es erneut.",
        success:
          "{count, plural, one {Arbeitselement} few {Arbeitselemente} other {Arbeitselemente}} zum Zyklus hinzugefügt.",
        loading: "{count, plural, one {Arbeitselement} other {Arbeitselemente}} werden zum Zyklus hinzugefügt",
      },
      assignee: "Zugewiesene hinzufügen",
      start_date: "Startdatum hinzufügen",
      due_date: "Fälligkeitsdatum hinzufügen",
      parent: "Übergeordnetes Arbeitselement hinzufügen",
      sub_issue: "Untergeordnetes Arbeitselement hinzufügen",
      relation: "Beziehung hinzufügen",
      link: "Link hinzufügen",
      existing: "Vorhandenes Arbeitselement hinzufügen",
    },
    remove: {
      label: "Arbeitselement entfernen",
      cycle: {
        loading: "Arbeitselement wird aus dem Zyklus entfernt",
        success: "Arbeitselement aus dem Zyklus entfernt.",
        failed: "Das Entfernen des Arbeitselements aus dem Zyklus ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
      },
      module: {
        loading: "Arbeitselement wird aus dem Modul entfernt",
        success: "Arbeitselement aus dem Modul entfernt.",
        failed: "Das Entfernen des Arbeitselements aus dem Modul ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
      },
      parent: {
        label: "Übergeordnetes Arbeitselement entfernen",
      },
    },
    new: "Neues Arbeitselement",
    adding: "Arbeitselement wird hinzugefügt",
    create: {
      success: "Arbeitselement erfolgreich erstellt",
    },
    priority: {
      urgent: "Dringend",
      high: "Hoch",
      medium: "Mittel",
      low: "Niedrig",
    },
    display: {
      properties: {
        label: "Anzuzeigende Eigenschaften",
        id: "ID",
        issue_type: "Typ des Arbeitselements",
        sub_issue_count: "Anzahl untergeordneter Elemente",
        attachment_count: "Anzahl Anhänge",
        created_on: "Erstellt am",
        sub_issue: "Untergeordnetes Element",
        work_item_count: "Anzahl Arbeitselemente",
      },
      extra: {
        show_sub_issues: "Untergeordnete Elemente anzeigen",
        show_empty_groups: "Leere Gruppen anzeigen",
      },
    },
    layouts: {
      ordered_by_label: "Dieses Layout wird sortiert nach",
      list: "Liste",
      kanban: "Kanban",
      calendar: "Kalender",
      spreadsheet: "Tabellenansicht",
      gantt: "Zeitachsenansicht",
      title: {
        list: "Listenlayout",
        kanban: "Kanban-Layout",
        calendar: "Kalenderlayout",
        spreadsheet: "Tabellenlayout",
        gantt: "Zeitachsenlayout",
      },
    },
    states: {
      active: "Aktiv",
      backlog: "Backlog",
    },
    comments: {
      placeholder: "Kommentar hinzufügen",
      switch: {
        private: "Zu privatem Kommentar wechseln",
        public: "Zu öffentlichem Kommentar wechseln",
      },
      create: {
        success: "Kommentar erfolgreich erstellt",
        error: "Kommentar konnte nicht erstellt werden. Bitte versuchen Sie es später erneut.",
      },
      update: {
        success: "Kommentar erfolgreich aktualisiert",
        error: "Kommentar konnte nicht aktualisiert werden. Bitte versuchen Sie es später erneut.",
      },
      remove: {
        success: "Kommentar erfolgreich entfernt",
        error: "Kommentar konnte nicht entfernt werden. Bitte versuchen Sie es später erneut.",
      },
      upload: {
        error: "Anhang konnte nicht hochgeladen werden. Bitte versuchen Sie es später erneut.",
      },
      copy_link: {
        success: "Kommentar-Link in die Zwischenablage kopiert",
        error: "Fehler beim Kopieren des Kommentar-Links. Bitte versuchen Sie es später erneut.",
      },
    },
    empty_state: {
      issue_detail: {
        title: "Arbeitselement existiert nicht",
        description: "Das gesuchte Arbeitselement existiert nicht, wurde archiviert oder gelöscht.",
        primary_button: {
          text: "Weitere Arbeitselemente anzeigen",
        },
      },
    },
    sibling: {
      label: "Verwandte Arbeitselemente",
    },
    archive: {
      description: "Nur abgeschlossene oder abgebrochene Arbeitselemente können archiviert werden",
      label: "Arbeitselement archivieren",
      confirm_message:
        "Möchten Sie dieses Arbeitselement wirklich archivieren? Alle archivierten Elemente können später wiederhergestellt werden.",
      success: {
        label: "Erfolgreich archiviert",
        message: "Ihre archivierten Elemente finden Sie in den Projektarchiven.",
      },
      failed: {
        message: "Archivierung des Arbeitselements fehlgeschlagen. Bitte versuchen Sie es erneut.",
      },
    },
    restore: {
      success: {
        title: "Wiederherstellung erfolgreich",
        message: "Ihr Arbeitselement ist jetzt wieder in den Arbeitselementen des Projekts zu finden.",
      },
      failed: {
        message: "Wiederherstellung des Arbeitselements fehlgeschlagen. Bitte versuchen Sie es erneut.",
      },
    },
    relation: {
      relates_to: "Steht in Beziehung zu",
      duplicate: "Duplikat",
      blocked_by: "Blockiert durch",
      blocking: "Blockiert",
    },
    copy_link: "Link zum Arbeitselement kopieren",
    delete: {
      label: "Arbeitselement löschen",
      error: "Fehler beim Löschen des Arbeitselements",
    },
    subscription: {
      actions: {
        subscribed: "Arbeitselement erfolgreich abonniert",
        unsubscribed: "Abo für Arbeitselement beendet",
      },
    },
    select: {
      error: "Wählen Sie mindestens ein Arbeitselement aus",
      empty: "Keine Arbeitselemente ausgewählt",
      add_selected: "Ausgewählte Arbeitselemente hinzufügen",
      select_all: "Alle auswählen",
      deselect_all: "Alle abwählen",
    },
    open_in_full_screen: "Arbeitselement im Vollbild öffnen",
  },
  attachment: {
    error: "Datei konnte nicht angehängt werden. Bitte versuchen Sie es erneut.",
    only_one_file_allowed: "Es kann jeweils nur eine Datei hochgeladen werden.",
    file_size_limit: "Die Datei muss kleiner als {size} MB sein.",
    drag_and_drop: "Datei hierher ziehen, um sie hochzuladen",
    delete: "Anhang löschen",
  },
  label: {
    select: "Label auswählen",
    create: {
      success: "Label erfolgreich erstellt",
      failed: "Label konnte nicht erstellt werden",
      already_exists: "Label existiert bereits",
      type: "Eingeben, um ein neues Label zu erstellen",
    },
  },
  sub_work_item: {
    update: {
      success: "Untergeordnetes Arbeitselement erfolgreich aktualisiert",
      error: "Fehler beim Aktualisieren des untergeordneten Elements",
    },
    remove: {
      success: "Untergeordnetes Arbeitselement erfolgreich entfernt",
      error: "Fehler beim Entfernen des untergeordneten Elements",
    },
    empty_state: {
      sub_list_filters: {
        title: "Sie haben keine untergeordneten Arbeitselemente, die den von Ihnen angewendeten Filtern entsprechen.",
        description: "Um alle untergeordneten Arbeitselemente anzuzeigen, entfernen Sie alle angewendeten Filter.",
        action: "Filter entfernen",
      },
      list_filters: {
        title: "Sie haben keine Arbeitselemente, die den von Ihnen angewendeten Filtern entsprechen.",
        description: "Um alle Arbeitselemente anzuzeigen, entfernen Sie alle angewendeten Filter.",
        action: "Filter entfernen",
      },
    },
  },
  view: {
    label: "{count, plural, one {Ansicht} few {Ansichten} other {Ansichten}}",
    create: {
      label: "Ansicht erstellen",
    },
    update: {
      label: "Ansicht aktualisieren",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "Ausstehend",
        description: "Ausstehend",
      },
      declined: {
        title: "Abgelehnt",
        description: "Abgelehnt",
      },
      snoozed: {
        title: "Verschoben",
        description: "Noch {days, plural, one{# Tag} few{# Tage} other{# Tage}}",
      },
      accepted: {
        title: "Angenommen",
        description: "Angenommen",
      },
      duplicate: {
        title: "Duplikat",
        description: "Duplikat",
      },
    },
    modals: {
      decline: {
        title: "Arbeitselement ablehnen",
        content: "Möchten Sie das Arbeitselement {value} wirklich ablehnen?",
      },
      delete: {
        title: "Arbeitselement löschen",
        content: "Möchten Sie das Arbeitselement {value} wirklich löschen?",
        success: "Arbeitselement erfolgreich gelöscht",
      },
    },
    errors: {
      snooze_permission: "Nur Projektadministratoren können Arbeitselemente verschieben/wiederherstellen",
      accept_permission: "Nur Projektadministratoren können Arbeitselemente annehmen",
      decline_permission: "Nur Projektadministratoren können Arbeitselemente ablehnen",
    },
    actions: {
      accept: "Annehmen",
      decline: "Ablehnen",
      snooze: "Verschieben",
      unsnooze: "Wiederherstellen",
      copy: "Link zum Arbeitselement kopieren",
      delete: "Löschen",
      open: "Arbeitselement öffnen",
      mark_as_duplicate: "Als Duplikat markieren",
      move: "{value} in die Arbeitselemente des Projekts verschieben",
    },
    source: {
      "in-app": "in der App",
    },
    order_by: {
      created_at: "Erstellt am",
      updated_at: "Aktualisiert am",
      id: "ID",
    },
    label: "Eingang",
    page_label: "{workspace} - Eingang",
    modal: {
      title: "Angenommenes Arbeitselement erstellen",
    },
    tabs: {
      open: "Offen",
      closed: "Geschlossen",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "Keine offenen Arbeitselemente",
        description: "Offene Arbeitselemente werden hier angezeigt. Erstellen Sie ein neues.",
      },
      sidebar_closed_tab: {
        title: "Keine geschlossenen Arbeitselemente",
        description: "Alle angenommenen oder abgelehnten Arbeitselemente erscheinen hier.",
      },
      sidebar_filter: {
        title: "Keine passenden Arbeitselemente",
        description: "Kein Element passt zum Eingang-Filter. Erstellen Sie ein neues.",
      },
      detail: {
        title: "Wählen Sie ein Arbeitselement, um Details anzuzeigen.",
      },
    },
  },
  workspace_creation: {
    heading: "Erstellen Sie einen Arbeitsbereich",
    subheading: "Um Plane verwenden zu können, müssen Sie einen Arbeitsbereich erstellen oder beitreten.",
    form: {
      name: {
        label: "Geben Sie Ihrem Arbeitsbereich einen Namen",
        placeholder: "Etwas Bekanntes und Wiedererkennbares wäre sinnvoll.",
      },
      url: {
        label: "Legen Sie die URL Ihres Arbeitsbereichs fest",
        placeholder: "Geben Sie eine URL ein oder fügen Sie sie ein",
        edit_slug: "Sie können nur den Slug-Teil der URL bearbeiten",
      },
      organization_size: {
        label: "Wie viele Personen werden diesen Bereich nutzen?",
        placeholder: "Wählen Sie einen Bereich",
      },
    },
    errors: {
      creation_disabled: {
        title: "Nur der Instanzadministrator kann Arbeitsbereiche erstellen",
        description:
          "Wenn Sie die E-Mail Ihres Instanzadministrators kennen, klicken Sie unten, um ihn zu kontaktieren.",
        request_button: "Instanzadministrator bitten",
      },
      validation: {
        name_alphanumeric: "Arbeitsbereichsnamen dürfen nur (' '), ('-'), ('_') und alphanumerische Zeichen enthalten.",
        name_length: "Name ist auf 80 Zeichen begrenzt.",
        url_alphanumeric: "URLs dürfen nur ('-') und alphanumerische Zeichen enthalten.",
        url_length: "URL ist auf 48 Zeichen begrenzt.",
        url_already_taken: "Die Arbeitsbereichs-URL ist bereits vergeben!",
      },
    },
    request_email: {
      subject: "Anfrage für einen neuen Arbeitsbereich",
      body: "Hallo Admin,\n\nBitte erstellen Sie einen neuen Arbeitsbereich mit der URL [/workspace-name] für [Zweck].\n\nDanke,\n{firstName} {lastName}\n{email}",
    },
    button: {
      default: "Arbeitsbereich erstellen",
      loading: "Arbeitsbereich wird erstellt",
    },
    toast: {
      success: {
        title: "Erfolg",
        message: "Arbeitsbereich erfolgreich erstellt",
      },
      error: {
        title: "Fehler",
        message: "Arbeitsbereich konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "Übersicht über Projekte, Aktivitäten und Kennzahlen",
        description:
          "Willkommen bei Plane, wir freuen uns, dass Sie hier sind. Erstellen Sie Ihr erstes Projekt, verfolgen Sie Arbeitselemente und diese Seite verwandelt sich in einen Ort für Ihren Fortschritt. Administratoren sehen hier zusätzlich teamrelevante Elemente.",
        primary_button: {
          text: "Erstes Projekt erstellen",
          comic: {
            title: "Alles beginnt mit einem Projekt in Plane",
            description:
              "Ein Projekt kann eine Produkt-Roadmap, eine Marketingkampagne oder die Markteinführung eines neuen Autos sein.",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "Analysen",
    page_label: "{workspace} - Analysen",
    open_tasks: "Insgesamt offene Aufgaben",
    error: "Fehler beim Laden der Daten.",
    work_items_closed_in: "Arbeitselemente, die abgeschlossen wurden in",
    selected_projects: "Ausgewählte Projekte",
    total_members: "Gesamtmitglieder",
    total_cycles: "Zyklen insgesamt",
    total_modules: "Module insgesamt",
    pending_work_items: {
      title: "Ausstehende Arbeitselemente",
      empty_state: "Hier wird eine Analyse der ausstehenden Elemente nach Mitarbeitern angezeigt.",
    },
    work_items_closed_in_a_year: {
      title: "Arbeitselemente, die in einem Jahr abgeschlossen wurden",
      empty_state: "Schließen Sie Elemente ab, um eine Analyse im Diagramm zu sehen.",
    },
    most_work_items_created: {
      title: "Die meisten erstellten Elemente",
      empty_state: "Zeigt die Mitarbeiter und die Anzahl der von ihnen erstellten Elemente.",
    },
    most_work_items_closed: {
      title: "Die meisten abgeschlossenen Elemente",
      empty_state: "Zeigt die Mitarbeiter und die Anzahl der von ihnen abgeschlossenen Elemente.",
    },
    tabs: {
      scope_and_demand: "Umfang und Nachfrage",
      custom: "Benutzerdefinierte Analysen",
    },
    empty_state: {
      customized_insights: {
        description: "Ihnen zugewiesene Arbeitselemente, aufgeschlüsselt nach Status, werden hier angezeigt.",
        title: "Noch keine Daten",
      },
      created_vs_resolved: {
        description: "Im Laufe der Zeit erstellte und gelöste Arbeitselemente werden hier angezeigt.",
        title: "Noch keine Daten",
      },
      project_insights: {
        title: "Noch keine Daten",
        description: "Ihnen zugewiesene Arbeitselemente, aufgeschlüsselt nach Status, werden hier angezeigt.",
      },
      general: {
        title:
          "Verfolgen Sie Fortschritt, Arbeitsbelastung und Zuweisungen. Erkennen Sie Trends, beseitigen Sie Hindernisse und arbeiten Sie schneller",
        description:
          "Sehen Sie Umfang vs. Nachfrage, Schätzungen und Scope Creep. Messen Sie die Leistung von Teammitgliedern und Teams und stellen Sie sicher, dass Ihr Projekt rechtzeitig abgeschlossen wird.",
        primary_button: {
          text: "Erstes Projekt starten",
          comic: {
            title: "Analytics funktioniert am besten mit Zyklen + Modulen",
            description:
              "Begrenzen Sie zunächst Ihre Arbeitselemente zeitlich in Zyklen und gruppieren Sie, wenn möglich, Arbeitselemente, die mehr als einen Zyklus umfassen, in Module. Schauen Sie sich beide in der linken Navigation an.",
          },
        },
      },
    },
    created_vs_resolved: "Erstellt vs Gelöst",
    customized_insights: "Individuelle Einblicke",
    backlog_work_items: "Backlog-{entity}",
    active_projects: "Aktive Projekte",
    trend_on_charts: "Trend in Diagrammen",
    all_projects: "Alle Projekte",
    summary_of_projects: "Projektübersicht",
    project_insights: "Projekteinblicke",
    started_work_items: "Begonnene {entity}",
    total_work_items: "Gesamte {entity}",
    total_projects: "Gesamtprojekte",
    total_admins: "Gesamtanzahl der Admins",
    total_users: "Gesamtanzahl der Benutzer",
    total_intake: "Gesamteinnahmen",
    un_started_work_items: "Nicht begonnene {entity}",
    total_guests: "Gesamtanzahl der Gäste",
    completed_work_items: "Abgeschlossene {entity}",
    total: "Gesamte {entity}",
  },
  workspace_projects: {
    label: "{count, plural, one {Projekt} few {Projekte} other {Projekte}}",
    create: {
      label: "Projekt hinzufügen",
    },
    network: {
      label: "Netzwerk",
      private: {
        title: "Privat",
        description: "Nur auf Einladung zugänglich",
      },
      public: {
        title: "Öffentlich",
        description: "Jeder im Arbeitsbereich außer Gästen kann beitreten",
      },
    },
    error: {
      permission: "Sie haben keine Berechtigung für diese Aktion.",
      cycle_delete: "Löschen des Zyklus fehlgeschlagen",
      module_delete: "Löschen des Moduls fehlgeschlagen",
      issue_delete: "Löschen des Arbeitselements fehlgeschlagen",
    },
    state: {
      backlog: "Backlog",
      unstarted: "Nicht begonnen",
      started: "Gestartet",
      completed: "Abgeschlossen",
      cancelled: "Abgebrochen",
    },
    sort: {
      manual: "Manuell",
      name: "Name",
      created_at: "Erstellungsdatum",
      members_length: "Mitgliederanzahl",
    },
    scope: {
      my_projects: "Meine Projekte",
      archived_projects: "Archiviert",
    },
    common: {
      months_count: "{months, plural, one{# Monat} few{# Monate} other{# Monate}}",
    },
    empty_state: {
      general: {
        title: "Keine aktiven Projekte",
        description:
          "Ein Projekt ist einem übergeordneten Ziel zugeordnet. Projekte enthalten Aufgaben, Zyklen und Module. Erstellen Sie ein neues oder filtern Sie archivierte.",
        primary_button: {
          text: "Erstes Projekt erstellen",
          comic: {
            title: "Alles beginnt mit einem Projekt in Plane",
            description:
              "Ein Projekt kann eine Produkt-Roadmap, eine Marketingkampagne oder die Markteinführung eines neuen Autos sein.",
          },
        },
      },
      no_projects: {
        title: "Keine Projekte",
        description: "Um Arbeitselemente zu erstellen, müssen Sie ein Projekt erstellen oder Teil eines Projekts sein.",
        primary_button: {
          text: "Erstes Projekt erstellen",
          comic: {
            title: "Alles beginnt mit einem Projekt in Plane",
            description:
              "Ein Projekt kann eine Produkt-Roadmap, eine Marketingkampagne oder die Markteinführung eines neuen Autos sein.",
          },
        },
      },
      filter: {
        title: "Keine passenden Projekte",
        description: "Keine Projekte entsprechen Ihren Kriterien.\nErstellen Sie ein neues.",
      },
      search: {
        description: "Keine Projekte entsprechen Ihren Suchkriterien.\nErstellen Sie ein neues.",
      },
    },
  },
  workspace_views: {
    add_view: "Ansicht hinzufügen",
    empty_state: {
      "all-issues": {
        title: "Keine Arbeitselemente im Projekt",
        description: "Erstellen Sie Ihr erstes Element und verfolgen Sie Ihren Fortschritt!",
        primary_button: {
          text: "Arbeitselement erstellen",
        },
      },
      assigned: {
        title: "Keine zugewiesenen Elemente",
        description: "Hier werden Ihnen zugewiesene Elemente angezeigt.",
        primary_button: {
          text: "Arbeitselement erstellen",
        },
      },
      created: {
        title: "Keine erstellten Elemente",
        description: "Hier werden von Ihnen erstellte Elemente angezeigt.",
        primary_button: {
          text: "Arbeitselement erstellen",
        },
      },
      subscribed: {
        title: "Keine abonnierten Elemente",
        description: "Abonnieren Sie Elemente, die Sie interessieren.",
      },
      "custom-view": {
        title: "Keine passenden Elemente",
        description: "Hier werden Elemente angezeigt, die den Filterkriterien entsprechen.",
      },
    },
    delete_view: {
      title: "Sind Sie sicher, dass Sie diese Ansicht löschen möchten?",
      content:
        "Wenn Sie bestätigen, werden alle Sortier-, Filter- und Anzeigeoptionen + das Layout, das Sie für diese Ansicht gewählt haben, dauerhaft gelöscht und können nicht wiederhergestellt werden.",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "E-Mail ändern",
        description: "Gib eine neue E-Mail-Adresse ein, um einen Verifizierungslink zu erhalten.",
        toasts: {
          success_title: "Erfolg!",
          success_message: "E-Mail erfolgreich aktualisiert. Bitte melde dich erneut an.",
        },
        form: {
          email: {
            label: "Neue E-Mail",
            placeholder: "Gib deine E-Mail ein",
            errors: {
              required: "E-Mail ist erforderlich",
              invalid: "E-Mail ist ungültig",
              exists: "E-Mail existiert bereits. Bitte nutze eine andere.",
              validation_failed: "E-Mail-Verifizierung fehlgeschlagen. Bitte versuche es erneut.",
            },
          },
          code: {
            label: "Einmaliger Code",
            placeholder: "123456",
            helper_text: "Verifizierungscode wurde an deine neue E-Mail gesendet.",
            errors: {
              required: "Einmaliger Code ist erforderlich",
              invalid: "Ungültiger Verifizierungscode. Bitte versuche es erneut.",
            },
          },
        },
        actions: {
          continue: "Weiter",
          confirm: "Bestätigen",
          cancel: "Abbrechen",
        },
        states: {
          sending: "Wird gesendet…",
        },
      },
    },
  },
  workspace_settings: {
    label: "Arbeitsbereich-Einstellungen",
    page_label: "{workspace} - Allgemeine Einstellungen",
    key_created: "Schlüssel erstellt",
    copy_key:
      "Kopieren Sie diesen Schlüssel und fügen Sie ihn in Plane Pages ein. Nach dem Schließen können Sie ihn nicht mehr sehen. Eine CSV-Datei mit dem Schlüssel wurde heruntergeladen.",
    token_copied: "Token in die Zwischenablage kopiert.",
    settings: {
      general: {
        title: "Allgemein",
        upload_logo: "Logo hochladen",
        edit_logo: "Logo bearbeiten",
        name: "Name des Arbeitsbereichs",
        company_size: "Unternehmensgröße",
        url: "URL des Arbeitsbereichs",
        workspace_timezone: "Zeitzone des Arbeitsbereichs",
        update_workspace: "Arbeitsbereich aktualisieren",
        delete_workspace: "Diesen Arbeitsbereich löschen",
        delete_workspace_description:
          "Das Löschen des Arbeitsbereichs entfernt alle Daten und Ressourcen. Diese Aktion ist nicht umkehrbar.",
        delete_btn: "Arbeitsbereich löschen",
        delete_modal: {
          title: "Möchten Sie diesen Arbeitsbereich wirklich löschen?",
          description: "Sie haben eine aktive Testversion. Bitte kündigen Sie diese zuerst.",
          dismiss: "Schließen",
          cancel: "Testversion kündigen",
          success_title: "Arbeitsbereich gelöscht.",
          success_message: "Sie werden auf Ihr Profil umgeleitet.",
          error_title: "Fehlgeschlagen.",
          error_message: "Bitte versuchen Sie es erneut.",
        },
        errors: {
          name: {
            required: "Name ist erforderlich",
            max_length: "Der Name des Arbeitsbereichs darf 80 Zeichen nicht überschreiten",
          },
          company_size: {
            required: "Die Unternehmensgröße ist erforderlich",
          },
        },
      },
      members: {
        title: "Mitglieder",
        add_member: "Mitglied hinzufügen",
        pending_invites: "Ausstehende Einladungen",
        invitations_sent_successfully: "Einladungen erfolgreich versendet",
        leave_confirmation:
          "Möchten Sie diesen Arbeitsbereich wirklich verlassen? Sie verlieren den Zugriff. Diese Aktion ist nicht umkehrbar.",
        details: {
          full_name: "Vollständiger Name",
          display_name: "Anzeigename",
          email_address: "E-Mail-Adresse",
          account_type: "Kontotyp",
          authentication: "Authentifizierung",
          joining_date: "Beitrittsdatum",
        },
        modal: {
          title: "Mitarbeiter einladen",
          description: "Laden Sie Personen zur Zusammenarbeit ein.",
          button: "Einladungen senden",
          button_loading: "Einladungen werden gesendet",
          placeholder: "name@unternehmen.de",
          errors: {
            required: "Eine E-Mail-Adresse ist erforderlich.",
            invalid: "E-Mail ist ungültig",
          },
        },
      },
      billing_and_plans: {
        title: "Abrechnung und Pläne",
        current_plan: "Aktueller Plan",
        free_plan: "Sie nutzen den kostenlosen Plan",
        view_plans: "Pläne anzeigen",
      },
      exports: {
        title: "Exporte",
        exporting: "Wird exportiert",
        previous_exports: "Bisherige Exporte",
        export_separate_files: "Daten in separaten Dateien exportieren",
        filters_info:
          "Wenden Sie Filter an, um bestimmte Arbeitselemente basierend auf Ihren Kriterien zu exportieren.",
        modal: {
          title: "Exportieren nach",
          toasts: {
            success: {
              title: "Export erfolgreich",
              message: "Die exportierten {entity} können aus dem vorherigen Export heruntergeladen werden.",
            },
            error: {
              title: "Export fehlgeschlagen",
              message: "Bitte versuchen Sie es erneut.",
            },
          },
        },
      },
      webhooks: {
        title: "Webhooks",
        add_webhook: "Webhook hinzufügen",
        modal: {
          title: "Webhook erstellen",
          details: "Webhook-Details",
          payload: "Payload-URL",
          question: "Bei welchen Ereignissen soll dieser Webhook ausgelöst werden?",
          error: "URL ist erforderlich",
        },
        secret_key: {
          title: "Geheimer Schlüssel",
          message: "Generieren Sie ein Token, um sich bei Webhooks anzumelden",
        },
        options: {
          all: "Alles senden",
          individual: "Einzelne Ereignisse auswählen",
        },
        toasts: {
          created: {
            title: "Webhook erstellt",
            message: "Webhook wurde erfolgreich erstellt",
          },
          not_created: {
            title: "Webhook nicht erstellt",
            message: "Webhook konnte nicht erstellt werden",
          },
          updated: {
            title: "Webhook aktualisiert",
            message: "Webhook wurde erfolgreich aktualisiert",
          },
          not_updated: {
            title: "Webhook-Aktualisierung fehlgeschlagen",
            message: "Webhook konnte nicht aktualisiert werden",
          },
          removed: {
            title: "Webhook entfernt",
            message: "Webhook wurde erfolgreich entfernt",
          },
          not_removed: {
            title: "Webhook konnte nicht entfernt werden",
            message: "Webhook konnte nicht entfernt werden",
          },
          secret_key_copied: {
            message: "Geheimer Schlüssel in die Zwischenablage kopiert.",
          },
          secret_key_not_copied: {
            message: "Fehler beim Kopieren des Schlüssels.",
          },
        },
      },
      api_tokens: {
        title: "API-Tokens",
        add_token: "API-Token hinzufügen",
        create_token: "Token erstellen",
        never_expires: "Läuft nie ab",
        generate_token: "Token generieren",
        generating: "Wird generiert",
        delete: {
          title: "API-Token löschen",
          description:
            "Alle Anwendungen, die diesen Token verwenden, verlieren den Zugriff. Diese Aktion ist nicht umkehrbar.",
          success: {
            title: "Erfolg!",
            message: "Token erfolgreich gelöscht",
          },
          error: {
            title: "Fehler!",
            message: "Löschen des Tokens fehlgeschlagen",
          },
        },
      },
    },
    empty_state: {
      api_tokens: {
        title: "Keine API-Tokens",
        description: "Verwenden Sie die API, um Plane mit externen Systemen zu integrieren.",
      },
      webhooks: {
        title: "Keine Webhooks",
        description: "Erstellen Sie Webhooks, um Aktionen zu automatisieren.",
      },
      exports: {
        title: "Keine Exporte",
        description: "Hier finden Sie Ihre Exporthistorie.",
      },
      imports: {
        title: "Keine Importe",
        description: "Hier finden Sie Ihre Importhistorie.",
      },
    },
  },
  profile: {
    label: "Profil",
    page_label: "Ihre Arbeit",
    work: "Arbeit",
    details: {
      joined_on: "Beigetreten am",
      time_zone: "Zeitzone",
    },
    stats: {
      workload: "Auslastung",
      overview: "Übersicht",
      created: "Erstellte Elemente",
      assigned: "Zugewiesene Elemente",
      subscribed: "Abonnierte Elemente",
      state_distribution: {
        title: "Elemente nach Status",
        empty: "Erstellen Sie Arbeitselemente, um eine Statusanalyse zu sehen.",
      },
      priority_distribution: {
        title: "Elemente nach Priorität",
        empty: "Erstellen Sie Arbeitselemente, um eine Prioritätsanalyse zu sehen.",
      },
      recent_activity: {
        title: "Letzte Aktivität",
        empty: "Keine Aktivität gefunden.",
        button: "Heutige Aktivität herunterladen",
        button_loading: "Wird heruntergeladen",
      },
    },
    actions: {
      profile: "Profil",
      security: "Sicherheit",
      activity: "Aktivität",
      appearance: "Aussehen",
      notifications: "Benachrichtigungen",
    },
    tabs: {
      summary: "Zusammenfassung",
      assigned: "Zugewiesen",
      created: "Erstellt",
      subscribed: "Abonniert",
      activity: "Aktivität",
    },
    empty_state: {
      activity: {
        title: "Keine Aktivität",
        description: "Erstellen Sie ein Arbeitselement, um zu beginnen.",
      },
      assigned: {
        title: "Keine zugewiesenen Arbeitselemente",
        description: "Hier werden Ihnen zugewiesene Arbeitselemente angezeigt.",
      },
      created: {
        title: "Keine erstellten Arbeitselemente",
        description: "Hier werden von Ihnen erstellte Arbeitselemente angezeigt.",
      },
      subscribed: {
        title: "Keine abonnierten Arbeitselemente",
        description: "Abonnieren Sie die Arbeitselemente, die Sie interessieren, und verfolgen Sie sie hier.",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "Geben Sie eine Projekt-ID ein",
      please_select_a_timezone: "Bitte wählen Sie eine Zeitzone aus",
      archive_project: {
        title: "Projekt archivieren",
        description:
          "Durch das Archivieren wird das Projekt im Menü ausgeblendet. Der Zugriff bleibt über die Projektseite bestehen.",
        button: "Projekt archivieren",
      },
      delete_project: {
        title: "Projekt löschen",
        description:
          "Durch das Löschen des Projekts werden alle zugehörigen Daten entfernt. Diese Aktion ist nicht umkehrbar.",
        button: "Projekt löschen",
      },
      toast: {
        success: "Projekt aktualisiert",
        error: "Aktualisierung fehlgeschlagen. Bitte versuchen Sie es erneut.",
      },
    },
    members: {
      label: "Mitglieder",
      project_lead: "Projektleitung",
      default_assignee: "Standardzuweisung",
      guest_super_permissions: {
        title: "Gastbenutzern Zugriff auf alle Elemente gewähren:",
        sub_heading: "Gäste sehen alle Elemente im Projekt.",
      },
      invite_members: {
        title: "Mitglieder einladen",
        sub_heading: "Laden Sie Mitglieder in das Projekt ein.",
        select_co_worker: "Wählen Sie einen Mitarbeiter",
      },
    },
    states: {
      describe_this_state_for_your_members: "Beschreiben Sie diesen Status für Ihre Mitglieder.",
      empty_state: {
        title: "Keine Status für die Gruppe {groupKey}",
        description: "Erstellen Sie einen neuen Status",
      },
    },
    labels: {
      label_title: "Labelname",
      label_title_is_required: "Ein Labelname ist erforderlich",
      label_max_char: "Der Labelname darf nicht mehr als 255 Zeichen enthalten",
      toast: {
        error: "Fehler beim Aktualisieren des Labels",
      },
    },
    estimates: {
      label: "Schätzungen",
      title: "Schätzungen für mein Projekt aktivieren",
      description: "Sie helfen dir, die Komplexität und Arbeitsbelastung des Teams zu kommunizieren.",
      no_estimate: "Keine Schätzung",
      new: "Neues Schätzungssystem",
      create: {
        custom: "Benutzerdefiniert",
        start_from_scratch: "Von Grund auf neu",
        choose_template: "Vorlage wählen",
        choose_estimate_system: "Schätzungssystem wählen",
        enter_estimate_point: "Schätzung eingeben",
        step: "Schritt {step} von {total}",
        label: "Schätzung erstellen",
      },
      toasts: {
        created: {
          success: {
            title: "Schätzung erstellt",
            message: "Die Schätzung wurde erfolgreich erstellt",
          },
          error: {
            title: "Schätzungserstellung fehlgeschlagen",
            message: "Wir konnten die neue Schätzung nicht erstellen, bitte versuche es erneut.",
          },
        },
        updated: {
          success: {
            title: "Schätzung geändert",
            message: "Die Schätzung wurde in deinem Projekt aktualisiert.",
          },
          error: {
            title: "Schätzungsänderung fehlgeschlagen",
            message: "Wir konnten die Schätzung nicht ändern, bitte versuche es erneut",
          },
        },
        enabled: {
          success: {
            title: "Erfolg!",
            message: "Schätzungen wurden aktiviert.",
          },
        },
        disabled: {
          success: {
            title: "Erfolg!",
            message: "Schätzungen wurden deaktiviert.",
          },
          error: {
            title: "Fehler!",
            message: "Schätzung konnte nicht deaktiviert werden. Bitte versuche es erneut",
          },
        },
      },
      validation: {
        min_length: "Die Schätzung muss größer als 0 sein.",
        unable_to_process: "Wir können deine Anfrage nicht verarbeiten, bitte versuche es erneut.",
        numeric: "Die Schätzung muss ein numerischer Wert sein.",
        character: "Die Schätzung muss ein Zeichenwert sein.",
        empty: "Der Schätzungswert darf nicht leer sein.",
        already_exists: "Der Schätzungswert existiert bereits.",
        unsaved_changes: "Du hast ungespeicherte Änderungen. Bitte speichere sie, bevor du auf Fertig klickst",
        remove_empty:
          "Die Schätzung darf nicht leer sein. Gib einen Wert in jedes Feld ein oder entferne die Felder, für die du keine Werte hast.",
      },
      systems: {
        points: {
          label: "Punkte",
          fibonacci: "Fibonacci",
          linear: "Linear",
          squares: "Quadrate",
          custom: "Benutzerdefiniert",
        },
        categories: {
          label: "Kategorien",
          t_shirt_sizes: "T-Shirt-Größen",
          easy_to_hard: "Einfach bis schwer",
          custom: "Benutzerdefiniert",
        },
        time: {
          label: "Zeit",
          hours: "Stunden",
        },
      },
    },
    automations: {
      label: "Automatisierungen",
      "auto-archive": {
        title: "Geschlossene Arbeitselemente automatisch archivieren",
        description: "Plane wird Arbeitselemente automatisch archivieren, die abgeschlossen oder abgebrochen wurden.",
        duration: "Arbeitselemente automatisch archivieren, die seit",
      },
      "auto-close": {
        title: "Arbeitselemente automatisch schließen",
        description:
          "Plane wird Arbeitselemente automatisch schließen, die nicht abgeschlossen oder abgebrochen wurden.",
        duration: "Inaktive Arbeitselemente automatisch schließen seit",
        auto_close_status: "Status der automatischen Schließung",
      },
    },
    empty_state: {
      labels: {
        title: "Keine Labels",
        description: "Erstellen Sie Labels, um Elemente zu organisieren.",
      },
      estimates: {
        title: "Keine Schätzungssysteme",
        description: "Erstellen Sie ein Schätzungssystem, um den Aufwand zu kommunizieren.",
        primary_button: "Schätzungssystem hinzufügen",
      },
    },
    features: {
      cycles: {
        title: "Zyklen",
        short_title: "Zyklen",
        description:
          "Planen Sie die Arbeit in flexiblen Zeiträumen, die sich dem einzigartigen Rhythmus und Tempo dieses Projekts anpassen.",
        toggle_title: "Zyklen aktivieren",
        toggle_description: "Planen Sie die Arbeit in fokussierten Zeiträumen.",
      },
      modules: {
        title: "Module",
        short_title: "Module",
        description: "Organisieren Sie die Arbeit in Teilprojekte mit engagierten Leitern und Verantwortlichen.",
        toggle_title: "Module aktivieren",
        toggle_description: "Projektmitglieder können Module erstellen und bearbeiten.",
      },
      views: {
        title: "Ansichten",
        short_title: "Ansichten",
        description:
          "Speichern Sie benutzerdefinierte Sortierungen, Filter und Anzeigeoptionen oder teilen Sie sie mit Ihrem Team.",
        toggle_title: "Ansichten aktivieren",
        toggle_description: "Projektmitglieder können Ansichten erstellen und bearbeiten.",
      },
      pages: {
        title: "Seiten",
        short_title: "Seiten",
        description: "Erstellen und bearbeiten Sie freie Inhalte: Notizen, Dokumente, alles.",
        toggle_title: "Seiten aktivieren",
        toggle_description: "Projektmitglieder können Seiten erstellen und bearbeiten.",
      },
      intake: {
        title: "Aufnahme",
        short_title: "Aufnahme",
        description:
          "Ermöglichen Sie Nicht-Mitgliedern, Fehler, Feedback und Vorschläge zu teilen, ohne Ihren Workflow zu unterbrechen.",
        toggle_title: "Aufnahme aktivieren",
        toggle_description: "Projektmitgliedern erlauben, In-App-Aufnahmeanfragen zu erstellen.",
      },
    },
  },
  project_cycles: {
    add_cycle: "Zyklus hinzufügen",
    more_details: "Weitere Details",
    cycle: "Zyklus",
    update_cycle: "Zyklus aktualisieren",
    create_cycle: "Zyklus erstellen",
    no_matching_cycles: "Keine passenden Zyklen",
    remove_filters_to_see_all_cycles: "Entfernen Sie Filter, um alle Zyklen anzuzeigen",
    remove_search_criteria_to_see_all_cycles: "Entfernen Sie Suchkriterien, um alle Zyklen anzuzeigen",
    only_completed_cycles_can_be_archived: "Nur abgeschlossene Zyklen können archiviert werden",
    start_date: "Startdatum",
    end_date: "Enddatum",
    in_your_timezone: "In Ihrer Zeitzone",
    transfer_work_items: "Übertragen von {count} Arbeitselementen",
    date_range: "Datumsbereich",
    add_date: "Datum hinzufügen",
    active_cycle: {
      label: "Aktiver Zyklus",
      progress: "Fortschritt",
      chart: "Burndown-Diagramm",
      priority_issue: "Hochpriorisierte Elemente",
      assignees: "Zuweisungen",
      issue_burndown: "Burndown für Arbeitselemente",
      ideal: "Ideal",
      current: "Aktuell",
      labels: "Labels",
    },
    upcoming_cycle: {
      label: "Bevorstehender Zyklus",
    },
    completed_cycle: {
      label: "Abgeschlossener Zyklus",
    },
    status: {
      days_left: "Tage übrig",
      completed: "Abgeschlossen",
      yet_to_start: "Noch nicht begonnen",
      in_progress: "In Bearbeitung",
      draft: "Entwurf",
    },
    action: {
      restore: {
        title: "Zyklus wiederherstellen",
        success: {
          title: "Zyklus wiederhergestellt",
          description: "Zyklus wurde wiederhergestellt.",
        },
        failed: {
          title: "Wiederherstellung fehlgeschlagen",
          description: "Zyklus konnte nicht wiederhergestellt werden.",
        },
      },
      favorite: {
        loading: "Wird zu Favoriten hinzugefügt",
        success: {
          description: "Zyklus zu Favoriten hinzugefügt.",
          title: "Erfolg!",
        },
        failed: {
          description: "Zu Favoriten hinzufügen fehlgeschlagen.",
          title: "Fehler!",
        },
      },
      unfavorite: {
        loading: "Wird aus Favoriten entfernt",
        success: {
          description: "Zyklus aus Favoriten entfernt.",
          title: "Erfolg!",
        },
        failed: {
          description: "Entfernen fehlgeschlagen.",
          title: "Fehler!",
        },
      },
      update: {
        loading: "Zyklus wird aktualisiert",
        success: {
          description: "Zyklus aktualisiert.",
          title: "Erfolg!",
        },
        failed: {
          description: "Aktualisierung fehlgeschlagen.",
          title: "Fehler!",
        },
        error: {
          already_exists: "Ein Zyklus mit diesen Daten existiert bereits. Entfernen Sie das Datum für einen Entwurf.",
        },
      },
    },
    empty_state: {
      general: {
        title: "Gruppieren Sie Arbeit in Zyklen.",
        description: "Begrenzen Sie Arbeit zeitlich, verfolgen Sie Fristen und bleiben Sie auf Kurs.",
        primary_button: {
          text: "Ersten Zyklus erstellen",
          comic: {
            title: "Zyklen sind wiederkehrende Zeitspannen.",
            description: "Sprint, Iteration oder jedes andere Zeitfenster, um Arbeit zu verfolgen.",
          },
        },
      },
      no_issues: {
        title: "Keine Elemente im Zyklus",
        description: "Fügen Sie die Elemente hinzu, die Sie verfolgen möchten.",
        primary_button: {
          text: "Element erstellen",
        },
        secondary_button: {
          text: "Vorhandenes Element hinzufügen",
        },
      },
      completed_no_issues: {
        title: "Keine Elemente im Zyklus",
        description:
          "Die Elemente wurden verschoben oder ausgeblendet. Bearbeiten Sie die Eigenschaften, um sie anzuzeigen.",
      },
      active: {
        title: "Kein aktiver Zyklus",
        description: "Ein aktiver Zyklus umfasst das heutige Datum. Verfolgen Sie seinen Fortschritt hier.",
      },
      archived: {
        title: "Keine archivierten Zyklen",
        description: "Archivieren Sie abgeschlossene Zyklen, um Ordnung zu halten.",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "Erstellen und zuweisen eines Arbeitselements",
        description:
          "Arbeitselemente sind Aufgaben, die Sie sich selbst oder dem Team zuweisen. Verfolgen Sie deren Fortschritt.",
        primary_button: {
          text: "Erstes Element erstellen",
          comic: {
            title: "Arbeitselemente sind die Bausteine",
            description: "Beispiele: UI-Redesign, Rebranding, neues System.",
          },
        },
      },
      no_archived_issues: {
        title: "Keine archivierten Elemente",
        description: "Archivieren Sie abgeschlossene oder abgebrochene Elemente. Richten Sie Automatisierungen ein.",
        primary_button: {
          text: "Automatisierung einrichten",
        },
      },
      issues_empty_filter: {
        title: "Keine passenden Elemente",
        secondary_button: {
          text: "Filter löschen",
        },
      },
    },
  },
  project_module: {
    add_module: "Modul hinzufügen",
    update_module: "Modul aktualisieren",
    create_module: "Modul erstellen",
    archive_module: "Modul archivieren",
    restore_module: "Modul wiederherstellen",
    delete_module: "Modul löschen",
    empty_state: {
      general: {
        title: "Gruppieren Sie Meilensteine in Modulen.",
        description:
          "Module fassen Elemente unter einer logischen Einheit zusammen. Verfolgen Sie Fristen und Fortschritt.",
        primary_button: {
          text: "Erstes Modul erstellen",
          comic: {
            title: "Module gruppieren hierarchisch.",
            description: "Beispiele: Warenkorbmodul, Chassis, Lager.",
          },
        },
      },
      no_issues: {
        title: "Keine Elemente im Modul",
        description: "Fügen Sie dem Modul Elemente hinzu.",
        primary_button: {
          text: "Elemente erstellen",
        },
        secondary_button: {
          text: "Vorhandenes Element hinzufügen",
        },
      },
      archived: {
        title: "Keine archivierten Module",
        description: "Archivieren Sie abgeschlossene oder abgebrochene Module.",
      },
      sidebar: {
        in_active: "Modul ist nicht aktiv.",
        invalid_date: "Ungültiges Datum. Bitte geben Sie ein gültiges Datum ein.",
      },
    },
    quick_actions: {
      archive_module: "Modul archivieren",
      archive_module_description: "Nur abgeschlossene/abgebrochene Module können archiviert werden.",
      delete_module: "Modul löschen",
    },
    toast: {
      copy: {
        success: "Link zum Modul kopiert",
      },
      delete: {
        success: "Modul gelöscht",
        error: "Löschen fehlgeschlagen",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "Speichern Sie Filter als Ansichten.",
        description:
          "Ansichten sind gespeicherte Filter, auf die Sie schnell zugreifen und die Sie im Team teilen können.",
        primary_button: {
          text: "Erste Ansicht erstellen",
          comic: {
            title: "Ansichten funktionieren mit den Eigenschaften der Arbeitselemente.",
            description: "Erstellen Sie eine Ansicht mit den gewünschten Filtern.",
          },
        },
      },
      filter: {
        title: "Keine passenden Ansichten",
        description: "Erstellen Sie eine neue Ansicht.",
      },
    },
    delete_view: {
      title: "Sind Sie sicher, dass Sie diese Ansicht löschen möchten?",
      content:
        "Wenn Sie bestätigen, werden alle Sortier-, Filter- und Anzeigeoptionen + das Layout, das Sie für diese Ansicht gewählt haben, dauerhaft gelöscht und können nicht wiederhergestellt werden.",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title: "Notieren Sie Ideen, Dokumente oder Wissensdatenbanken. Nutzen Sie AI Galileo.",
        description:
          "Seiten sind Orte für Ihre Gedanken. Schreiben, formatieren, fügen Sie Arbeitselemente ein und verwenden Sie Komponenten.",
        primary_button: {
          text: "Erste Seite erstellen",
        },
      },
      private: {
        title: "Keine privaten Seiten",
        description: "Bewahren Sie private Gedanken auf. Teilen Sie sie, wenn Sie bereit sind.",
        primary_button: {
          text: "Seite erstellen",
        },
      },
      public: {
        title: "Keine öffentlichen Seiten",
        description: "Hier sehen Sie die im Projekt geteilten Seiten.",
        primary_button: {
          text: "Seite erstellen",
        },
      },
      archived: {
        title: "Keine archivierten Seiten",
        description: "Archivieren Sie Seiten für den späteren Zugriff.",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "Keine Ergebnisse gefunden",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "Keine passenden Elemente",
      },
      no_issues: {
        title: "Keine Elemente",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "Keine Kommentare",
        description: "Kommentare dienen der Diskussion und der Nachverfolgung von Elementen.",
      },
    },
  },
  notification: {
    label: "Posteingang",
    page_label: "{workspace} - Posteingang",
    options: {
      mark_all_as_read: "Alle als gelesen markieren",
      mark_read: "Als gelesen markieren",
      mark_unread: "Als ungelesen markieren",
      refresh: "Aktualisieren",
      filters: "Posteingangsfilter",
      show_unread: "Ungelesene anzeigen",
      show_snoozed: "Verschobene anzeigen",
      show_archived: "Archivierte anzeigen",
      mark_archive: "Archivieren",
      mark_unarchive: "Archivierung aufheben",
      mark_snooze: "Verschieben",
      mark_unsnooze: "Wiederherstellen",
    },
    toasts: {
      read: "Benachrichtigung gelesen",
      unread: "Als ungelesen markiert",
      archived: "Archiviert",
      unarchived: "Archivierung aufgehoben",
      snoozed: "Verschoben",
      unsnoozed: "Wiederhergestellt",
    },
    empty_state: {
      detail: {
        title: "Wählen Sie ein Element, um Details anzuzeigen.",
      },
      all: {
        title: "Keine zugewiesenen Elemente",
        description: "Hier sehen Sie Aktualisierungen zu Ihnen zugewiesenen Elementen.",
      },
      mentions: {
        title: "Keine Erwähnungen",
        description: "Hier sehen Sie Erwähnungen über Sie.",
      },
    },
    tabs: {
      all: "Alle",
      mentions: "Erwähnungen",
    },
    filter: {
      assigned: "Mir zugewiesen",
      created: "Von mir erstellt",
      subscribed: "Abonniert",
    },
    snooze: {
      "1_day": "1 Tag",
      "3_days": "3 Tage",
      "5_days": "5 Tage",
      "1_week": "1 Woche",
      "2_weeks": "2 Wochen",
      custom: "Benutzerdefiniert",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "Fügen Sie Elemente hinzu, um den Fortschritt zu verfolgen",
      },
      chart: {
        title: "Fügen Sie Elemente hinzu, um ein Burndown-Diagramm anzuzeigen.",
      },
      priority_issue: {
        title: "Hochpriorisierte Arbeitselemente werden hier angezeigt.",
      },
      assignee: {
        title: "Weisen Sie Elemente zu, um eine Übersicht der Zuweisungen zu sehen.",
      },
      label: {
        title: "Fügen Sie Labels hinzu, um eine Analyse nach Labels zu erhalten.",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "Eingang ist nicht aktiviert",
        description: "Aktivieren Sie den Eingang in den Projekteinstellungen, um Anfragen zu verwalten.",
        primary_button: {
          text: "Funktionen verwalten",
        },
      },
      cycle: {
        title: "Zyklen sind nicht aktiviert",
        description: "Aktivieren Sie Zyklen, um Arbeit zeitlich zu begrenzen.",
        primary_button: {
          text: "Funktionen verwalten",
        },
      },
      module: {
        title: "Module sind nicht aktiviert",
        description: "Aktivieren Sie Module in den Projekteinstellungen.",
        primary_button: {
          text: "Funktionen verwalten",
        },
      },
      page: {
        title: "Seiten sind nicht aktiviert",
        description: "Aktivieren Sie Seiten in den Projekteinstellungen.",
        primary_button: {
          text: "Funktionen verwalten",
        },
      },
      view: {
        title: "Ansichten sind nicht aktiviert",
        description: "Aktivieren Sie Ansichten in den Projekteinstellungen.",
        primary_button: {
          text: "Funktionen verwalten",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "Einen Entwurf für ein Element erstellen",
    empty_state: {
      title: "Entwürfe für Elemente und Kommentare werden hier angezeigt.",
      description: "Beginnen Sie mit dem Erstellen eines Arbeitselements und lassen Sie es als Entwurf.",
      primary_button: {
        text: "Ersten Entwurf erstellen",
      },
    },
    delete_modal: {
      title: "Entwurf löschen",
      description: "Möchten Sie diesen Entwurf wirklich löschen? Diese Aktion ist nicht umkehrbar.",
    },
    toasts: {
      created: {
        success: "Entwurf erstellt",
        error: "Erstellung fehlgeschlagen",
      },
      deleted: {
        success: "Entwurf gelöscht",
      },
    },
  },
  stickies: {
    title: "Ihre Notizen",
    placeholder: "Klicken, um zu schreiben",
    all: "Alle Notizen",
    "no-data": "Halten Sie Ideen und Gedanken fest. Fügen Sie die erste Notiz hinzu.",
    add: "Notiz hinzufügen",
    search_placeholder: "Nach Name suchen",
    delete: "Notiz löschen",
    delete_confirmation: "Möchten Sie diese Notiz wirklich löschen?",
    empty_state: {
      simple: "Halten Sie Ideen und Gedanken fest. Fügen Sie die erste Notiz hinzu.",
      general: {
        title: "Notizen sind schnelle Aufzeichnungen.",
        description: "Schreiben Sie Ihre Ideen auf und greifen Sie von überall darauf zu.",
        primary_button: {
          text: "Notiz hinzufügen",
        },
      },
      search: {
        title: "Keine Notizen gefunden.",
        description: "Versuchen Sie einen anderen Begriff oder erstellen Sie eine neue.",
        primary_button: {
          text: "Notiz hinzufügen",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "Der Name der Notiz darf max. 100 Zeichen haben.",
        already_exists: "Eine Notiz ohne Beschreibung existiert bereits",
      },
      created: {
        title: "Notiz erstellt",
        message: "Notiz erfolgreich erstellt",
      },
      not_created: {
        title: "Erstellung fehlgeschlagen",
        message: "Notiz konnte nicht erstellt werden",
      },
      updated: {
        title: "Notiz aktualisiert",
        message: "Notiz erfolgreich aktualisiert",
      },
      not_updated: {
        title: "Aktualisierung fehlgeschlagen",
        message: "Notiz konnte nicht aktualisiert werden",
      },
      removed: {
        title: "Notiz gelöscht",
        message: "Notiz erfolgreich gelöscht",
      },
      not_removed: {
        title: "Löschen fehlgeschlagen",
        message: "Notiz konnte nicht gelöscht werden",
      },
    },
  },
  role_details: {
    guest: {
      title: "Gast",
      description: "Externe Mitglieder können als Gäste eingeladen werden.",
    },
    member: {
      title: "Mitglied",
      description: "Kann Entitäten lesen, schreiben, bearbeiten und löschen.",
    },
    admin: {
      title: "Administrator",
      description: "Besitzt alle Berechtigungen im Arbeitsbereich.",
    },
  },
  user_roles: {
    product_or_project_manager: "Produkt-/Projektmanager",
    development_or_engineering: "Entwicklung/Ingenieurwesen",
    founder_or_executive: "Gründer/Führungskraft",
    freelancer_or_consultant: "Freiberufler/Berater",
    marketing_or_growth: "Marketing/Wachstum",
    sales_or_business_development: "Vertrieb/Business Development",
    support_or_operations: "Support/Betrieb",
    student_or_professor: "Student/Professor",
    human_resources: "Personalwesen",
    other: "Andere",
  },
  importer: {
    github: {
      title: "GitHub",
      description: "Arbeitselemente aus GitHub-Repositories importieren.",
    },
    jira: {
      title: "Jira",
      description: "Arbeitselemente und Epiks aus Jira importieren.",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "Arbeitselemente in CSV exportieren.",
      short_description: "Als CSV exportieren",
    },
    excel: {
      title: "Excel",
      description: "Arbeitselemente in Excel exportieren.",
      short_description: "Als Excel exportieren",
    },
    xlsx: {
      title: "Excel",
      description: "Arbeitselemente in Excel exportieren.",
      short_description: "Als Excel exportieren",
    },
    json: {
      title: "JSON",
      description: "Arbeitselemente in JSON exportieren.",
      short_description: "Als JSON exportieren",
    },
  },
  default_global_view: {
    all_issues: "Alle Elemente",
    assigned: "Zugewiesen",
    created: "Erstellt",
    subscribed: "Abonniert",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "Systemeinstellungen",
      },
      light: {
        label: "Hell",
      },
      dark: {
        label: "Dunkel",
      },
      light_contrast: {
        label: "Heller hoher Kontrast",
      },
      dark_contrast: {
        label: "Dunkler hoher Kontrast",
      },
      custom: {
        label: "Benutzerdefiniertes Theme",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "Backlog",
      planned: "Geplant",
      in_progress: "In Bearbeitung",
      paused: "Pausiert",
      completed: "Abgeschlossen",
      cancelled: "Abgebrochen",
    },
    layout: {
      list: "Liste",
      board: "Board",
      timeline: "Zeitachse",
    },
    order_by: {
      name: "Name",
      progress: "Fortschritt",
      issues: "Anzahl Elemente",
      due_date: "Fälligkeitsdatum",
      created_at: "Erstellungsdatum",
      manual: "Manuell",
    },
  },
  cycle: {
    label: "{count, plural, one {Zyklus} few {Zyklen} other {Zyklen}}",
    no_cycle: "Kein Zyklus",
  },
  module: {
    label: "{count, plural, one {Modul} few {Module} other {Module}}",
    no_module: "Kein Modul",
  },
  description_versions: {
    last_edited_by: "Zuletzt bearbeitet von",
    previously_edited_by: "Zuvor bearbeitet von",
    edited_by: "Bearbeitet von",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane ist nicht gestartet. Dies könnte daran liegen, dass einer oder mehrere Plane-Services nicht starten konnten.",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "Wählen Sie View Logs aus setup.sh und Docker-Logs, um sicherzugehen.",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "Gliederung",
        empty_state: {
          title: "Fehlende Überschriften",
          description: "Fügen Sie einige Überschriften zu dieser Seite hinzu, um sie hier zu sehen.",
        },
      },
      info: {
        label: "Info",
        document_info: {
          words: "Wörter",
          characters: "Zeichen",
          paragraphs: "Absätze",
          read_time: "Lesezeit",
        },
        actors_info: {
          edited_by: "Bearbeitet von",
          created_by: "Erstellt von",
        },
        version_history: {
          label: "Versionsverlauf",
          current_version: "Aktuelle Version",
        },
      },
      assets: {
        label: "Assets",
        download_button: "Herunterladen",
        empty_state: {
          title: "Fehlende Bilder",
          description: "Fügen Sie Bilder hinzu, um sie hier zu sehen.",
        },
      },
    },
    open_button: "Navigationsbereich öffnen",
    close_button: "Navigationsbereich schließen",
    outline_floating_button: "Gliederung öffnen",
  },
} as const;
