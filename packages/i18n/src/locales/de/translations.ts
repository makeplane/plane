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
  unknown_user: "Unbekannter Benutzer",
  cloud_maintenance_message: {
    we_are_working_on_this_if_you_need_immediate_assistance: "Wir arbeiten daran. Wenn Sie sofortige Hilfe benötigen,",
    reach_out_to_us: "kontaktieren Sie uns",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our:
      "Andernfalls versuchen Sie gelegentlich die Seite zu aktualisieren oder besuchen Sie unsere",
    status_page: "Statusseite",
  },
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
    pi_chat: "Plane AI",
    initiatives: "Initiativen",
    teamspaces: "Teamspaces",
    epics: "Epics",
    upgrade_plan: "Plan upgraden",
    plane_pro: "Plane Pro",
    business: "Business",
    customers: "Kunden",
    stickies: "Notizen",
    releases: "Releases",
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
      username: {
        label: "Benutzername",
        placeholder: "Geben Sie Ihren Benutzernamen ein",
      },
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
    ldap: {
      header: {
        label: "Mit {ldapProviderName} fortfahren",
        sub_header: "Geben Sie Ihre {ldapProviderName}-Anmeldedaten ein",
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
  activity_empty_state: {
    no_activity: "Noch keine Aktivität",
    no_transitions: "Noch keine Übergänge",
  },
  preferences: "Einstellungen",
  language_and_time: "Sprache und Zeit",
  notifications: "Benachrichtigungen",
  timezone_setting: "Aktuelle Zeitzoneneinstellung.",
  language_setting: "Wählen Sie die in der Benutzeroberfläche verwendete Sprache.",
  settings_moved_to_preferences: "Zeitzonen- und Spracheinstellungen wurden in die Einstellungen verschoben.",
  go_to_preferences: "Zu den Einstellungen",
  pages: "Seiten",
  target_date: "Zieldatum",
  settings_description:
    "Verwalten Sie Ihre Konto-, Arbeitsbereichs- und Projekteinstellungen an einem Ort. Wechseln Sie zwischen den Tabs, um sie einfach zu konfigurieren.",
  back_to_workspace: "Zurück zum Arbeitsbereich",
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
  select_or_customize_your_interface_color_scheme: "Wählen Sie Ihr Interface-Farbschema aus oder passen Sie es an.",
  select_the_cursor_motion_style_that_feels_right_for_you:
    "Wählen Sie den Cursorbewegungsstil, der sich für Sie richtig anfühlt.",
  theme: "Thema",
  smooth_cursor: "Sanfter Cursor",
  system_preference: "Systemeinstellung",
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
  project_id_tooltip_content: "Hilft, Arbeitselemente im Projekt eindeutig zu identifizieren. Max. 50 Zeichen.",
  description_placeholder: "Beschreibung",
  only_alphanumeric_non_latin_characters_allowed: "Es sind nur alphanumerische und nicht-lateinische Zeichen erlaubt.",
  project_id_is_required: "Projekt-ID ist erforderlich",
  project_id_allowed_char: "Es sind nur alphanumerische und nicht-lateinische Zeichen erlaubt.",
  project_id_min_char: "Projekt-ID muss mindestens 1 Zeichen lang sein",
  project_id_max_char: "Projekt-ID darf maximal {max} Zeichen lang sein",
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
  intake: "Eingang",
  renew: "Erneuern",
  preview: "Vorschau",
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
  forum: "Forum",
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
  transition: "Übergang",
  history: "Verlauf",
  priority: "Priorität",
  none: "Keine",
  urgent: "Dringend",
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
  members: "Mitglieder",
  assignee: "Zugewiesen",
  assignees: "Zugewiesene",
  subscriber: "{count, plural, one{# Abonnent} other{# Abonnenten}}",
  you: "Sie",
  labels: "Labels",
  create_new_label: "Neues Label erstellen",
  label_name: "Label-Name",
  failed_to_create_label: "Label konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
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
  edited: "Bearbeitet",
  bot: "Bot",
  project_view: {
    sort_by: {
      created_at: "Erstellt am",
      updated_at: "Aktualisiert am",
      name: "Name",
    },
  },
  upgrade_request: "Bitten Sie Ihren Arbeitsbereichs-Admin um ein Upgrade.",
  copied_to_clipboard: "In die Zwischenablage kopiert",
  copied_to_clipboard_description: "Die URL wurde erfolgreich in Ihre Zwischenablage kopiert",
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
        cta: "Los geht's",
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
    business_trial_banner: {
      title: "Ihre 14-tägige Business-Testversion ist aktiv!",
      description:
        "Entdecken Sie alle Business-Funktionen. Wenn Sie bereit sind, können Sie ein Abonnement abschließen. Es erfolgt keine automatische Abrechnung.",
      trial_ends_today: "Testversion endet heute",
      trial_ends_in_days: "Testversion endet in {days, plural, one {# Tag} other {# Tagen}}",
      start_subscription: "Abonnement starten",
      explore_business_features: "Business-Funktionen entdecken",
    },
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
    updated_at: "Aktualisiert am",
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
    epic: "Epic",
    epics: "Epics",
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
    additional_updates: "Zusätzliche Aktualisierungen",
    clear_all: "Alles löschen",
    copied: "Kopiert!",
    link_copied: "Link kopiert!",
    link_copied_to_clipboard: "Link in die Zwischenablage kopiert",
    copied_to_clipboard: "Link zum Arbeitselement in die Zwischenablage kopiert",
    branch_name_copied_to_clipboard: "Branch-Name in die Zwischenablage kopiert",
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
    actions: {
      edit: "Bearbeiten",
      make_a_copy: "Kopie erstellen",
      open_in_new_tab: "In neuem Tab öffnen",
      copy_link: "Link kopieren",
      copy_markdown: "Markdown kopieren",
      reply: "Antworten",
      copy_branch_name: "Branch-Name kopieren",
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
    worklogs: "Arbeitsberichte",
    project_updates: "Projektaktualisierungen",
    overview: "Übersicht",
    workflows: "Arbeitsabläufe",
    templates: "Vorlagen",
    members_and_teamspaces: "Mitglieder & Teamspaces",
    open_in_full_screen: "{page} im Vollbild öffnen",
    views: "Ansichten",
    pages: "Seiten",
    dependencies: "Abhängigkeiten",
    search: {
      label: "Suchen",
      placeholder: "Zum Suchen tippen",
      no_matches_found: "Keine Treffer gefunden",
      no_matching_results: "Keine passenden Ergebnisse",
      min_chars: "Geben Sie mindestens {count} Zeichen ein, um zu suchen",
      error: "Fehler beim Abrufen der Suchergebnisse",
      no_results: {
        title: "Keine passenden Ergebnisse",
        description: "Entfernen Sie die Suchkriterien, um alle Ergebnisse zu sehen",
      },
    },
    global: "Global",
    retry: "Erneut versuchen",
    get_started: "Loslegen",
    business: "Business",
    recurring_work_items: "Wiederkehrende Arbeitselemente",
    milestones: "Meilensteine",
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
    all: "Alle Epics",
    label: "{count, plural, one {Epic} other {Epics}}",
    new: "Neues Epic",
    adding: "Epic wird hinzugefügt",
    create: {
      success: "Epic erfolgreich erstellt",
    },
    add: {
      press_enter: "Drücken Sie 'Enter', um ein weiteres Epic hinzuzufügen",
      label: "Epic hinzufügen",
    },
    title: {
      label: "Epic-Titel",
      required: "Ein Titel für das Epic ist erforderlich.",
    },
    archive: {
      description: `Nur abgeschlossene oder abgebrochene
Epics können archiviert werden`,
      label: "Epic archivieren",
      confirm_message:
        "Sind Sie sicher, dass Sie das Epic archivieren möchten? Alle archivierten Epics können später wiederhergestellt werden.",
      success: {
        label: "Archivierung erfolgreich",
        message: "Ihre Archive finden Sie in den Projektarchiven.",
      },
      failed: {
        message: "Epic konnte nicht archiviert werden. Bitte versuchen Sie es erneut.",
      },
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
      dependency: "Abhängigkeit hinzufügen",
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
        customer_count: "Kundenanzahl",
        customer_request_count: "Kundenanfragenanzahl",
        customer: "Kunde",
        requests: "Kundenanfrage",
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
      replies: {
        create: {
          submit_button: "Antwort hinzufügen",
          placeholder: "Antwort hinzufügen",
        },
        toast: {
          fetch: {
            error: {
              message: "Antworten konnten nicht geladen werden",
            },
          },
          create: {
            success: {
              message: "Antwort erfolgreich erstellt",
            },
            error: {
              message: "Antwort konnte nicht erstellt werden",
            },
          },
          update: {
            success: {
              message: "Antwort erfolgreich aktualisiert",
            },
            error: {
              message: "Antwort konnte nicht aktualisiert werden",
            },
          },
          delete: {
            success: {
              message: "Antwort erfolgreich gelöscht",
            },
            error: {
              message: "Antwort konnte nicht gelöscht werden",
            },
          },
        },
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
      start_before: "Beginnt Vor",
      start_after: "Beginnt Nach",
      finish_before: "Endet Vor",
      finish_after: "Endet Nach",
      implements: "Implementiert",
      implemented_by: "Implementiert von",
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
    duplicate: {
      modal: {
        title: "Eine Kopie in ein anderes Projekt erstellen",
        description1: "Dies erstellt eine Kopie des Arbeitselements.",
        description2: "Alle Eigenschaftsdaten werden beim Duplizieren entfernt.",
        placeholder: "Projekt auswählen",
      },
    },
    toast: {
      duplicate: {
        success: {
          message: "Arbeitselement erfolgreich dupliziert",
        },
        error: {
          message: "Arbeitselement konnte nicht dupliziert werden",
        },
      },
    },
    pages: {
      link_pages: "Seiten verknüpfen",
      show_wiki_pages: "Wiki-Seiten anzeigen",
      link_pages_to: "Seiten verknüpfen mit",
      linked_pages: "Verknüpfte Seiten",
      no_description:
        "Diese Seite ist leer. Schreiben Sie etwas hinein und sehen Sie es hier anstelle dieses Platzhalters",
      toasts: {
        link: {
          success: {
            title: "Seiten aktualisiert",
            message: "Seiten wurden erfolgreich aktualisiert",
          },
          error: {
            title: "Seiten nicht aktualisiert",
            message: "Seiten konnten nicht aktualisiert werden",
          },
        },
        remove: {
          success: {
            title: "Seite entfernt",
            message: "Seite wurde erfolgreich entfernt",
          },
          error: {
            title: "Seite nicht entfernt",
            message: "Seite konnte nicht entfernt werden",
          },
        },
      },
    },
    vote: {
      click_to_upvote: "Klicken zum Hochstimmen",
      click_to_downvote: "Klicken zum Runterstimmen",
      click_to_view_upvotes: "Klicken um Hochstimmen anzuzeigen",
      click_to_view_downvotes: "Klicken um Runterstimmen anzuzeigen",
    },
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
      body: `Hallo Admin,

Bitte erstellen Sie einen neuen Arbeitsbereich mit der URL [/workspace-name] für [Zweck].

Danke,
{firstName} {lastName}
{email}`,
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
      cycle_progress: {
        title: "Noch keine Daten",
        description:
          "Analyse des Zyklusfortschritts wird hier angezeigt. Fügen Sie Arbeitsaufgaben zu Zyklen hinzu, um den Fortschritt zu verfolgen.",
      },
      module_progress: {
        title: "Noch keine Daten",
        description:
          "Analyse des Modulfortschritts wird hier angezeigt. Fügen Sie Arbeitsaufgaben zu Modulen hinzu, um den Fortschritt zu verfolgen.",
      },
      intake_trends: {
        title: "Noch keine Daten",
        description:
          "Analyse der Intake-Trends wird hier angezeigt. Fügen Sie Arbeitsaufgaben zum Intake hinzu, um Trends zu verfolgen.",
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
    un_started_work_items: "Nicht begonnene {entity}",
    completed_work_items: "Abgeschlossene {entity}",
    total: "Gesamte {entity}",
    projects_by_status: "Projekte nach Status",
    active_users: "Aktive Nutzer",
    intake_trends: "Aufnahmetrends",
    workitem_resolved_vs_pending: "Gelöste vs. ausstehende Arbeitsaufgaben",
    upgrade_to_plan: "Upgrade auf {plan}, um {tab} freizuschalten",
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
      days_count: "{days, plural, one{# Tag} few{# Tage} other{# Tagen}}",
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
        description: `Keine Projekte entsprechen Ihren Kriterien.
Erstellen Sie ein neues.`,
      },
      search: {
        description: `Keine Projekte entsprechen Ihren Suchkriterien.
Erstellen Sie ein neues.`,
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
    notifications: {
      heading: "E-Mail-Benachrichtigungen",
      description:
        "Bleiben Sie bei Arbeitselementen auf dem Laufenden, die Sie abonniert haben. Aktivieren Sie dies, um benachrichtigt zu werden.",
      select_default_view: "Standardansicht auswählen",
      compact: "Kompakt",
      full: "Vollbild",
    },
    preferences: {
      heading: "Einstellungen",
      description: "Passen Sie Ihre App-Erfahrung an Ihre Arbeitsweise an",
    },
    security: {
      heading: "Sicherheit",
    },
    api_tokens: {
      title: "Persönliche Zugriffstoken",
      description:
        "Generieren Sie sichere API-Token, um Ihre Daten mit externen Systemen und Anwendungen zu integrieren.",
    },
    activity: {
      heading: "Aktivität",
      description: "Verfolgen Sie Ihre letzten Aktionen und Änderungen über alle Projekte und Arbeitselemente hinweg.",
    },
    connections: {
      title: "Verbindungen",
      heading: "Verbindungen",
      description: "Verwalten Sie Ihre Arbeitsbereich-Verbindungseinstellungen.",
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
            select_a_range: "Organisationsgröße auswählen",
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
        heading: "Abrechnung und Pläne",
        description: "Wählen Sie Ihren Plan, verwalten Sie Abonnements und führen Sie bei Bedarf ein Upgrade durch.",
        title: "Abrechnung und Pläne",
        current_plan: "Aktueller Plan",
        free_plan: "Sie nutzen den kostenlosen Plan",
        view_plans: "Pläne anzeigen",
      },
      exports: {
        heading: "Exporte",
        description:
          "Exportieren Sie Ihre Projektdaten in verschiedenen Formaten und greifen Sie auf Ihre Exporthistorie mit Download-Links zu.",
        exporting_projects: "Projekt wird exportiert",
        format: "Format",
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
        heading: "Webhooks",
        description: "Automatisieren Sie Benachrichtigungen an externe Dienste, wenn Projektereignisse auftreten.",
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
        heading: "API-Tokens",
        description:
          "Generieren Sie sichere API-Tokens, um Ihre Daten mit externen Systemen und Anwendungen zu integrieren.",
        title: "API-Tokens",
        add_token: "Zugriffstoken hinzufügen",
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
      integrations: {
        heading: "Integrationen",
        description:
          "Verbinden Sie sich mit beliebten Tools und Diensten, um Ihre Arbeit über Ihr gesamtes Workflow-Ökosystem zu synchronisieren.",
        title: "Integrationen",
        page_title: "Arbeiten Sie mit Ihren Plane-Daten in verfügbaren Apps oder in Ihren eigenen.",
        page_description:
          "Sehen Sie sich alle Integrationen an, die von diesem Workspace oder von Ihnen verwendet werden.",
      },
      imports: {
        heading: "Importe",
        description:
          "Verbinden und importieren Sie Daten aus Ihren bestehenden Projektmanagement-Tools, um Ihre Workflow-Integration zu optimieren.",
        title: "Importe",
      },
      worklogs: {
        heading: "Arbeitsberichte",
        description: "Laden Sie Arbeitsberichte (Zeiterfassungen) für jeden in jedem Projekt herunter.",
        title: "Arbeitsberichte",
      },
      group_syncing: {
        title: "Gruppensynchronisation",
        heading: "Gruppensynchronisation",
        description:
          "Verknüpfen Sie Identity-Provider-Gruppen mit Projekten und Rollen. Der Benutzerzugriff wird automatisch aktualisiert, wenn sich die Gruppenzugehörigkeit in Ihrem IdP ändert – für einfacheres Onboarding und Offboarding.",
        enable: {
          title: "Gruppensynchronisation aktivieren",
          description: "Benutzer werden automatisch basierend auf Identity-Provider-Gruppen zu Projekten hinzugefügt.",
        },
        config: {
          title: "Gruppensync konfigurieren",
          description: "Richten Sie ein, wie Identity-Provider-Gruppen Projekten und Rollen zugeordnet werden.",
          sync_on_login: {
            title: "Sync bei Anmeldung",
            description: "Gruppenzugehörigkeit und Projektzugriff bei Benutzeranmeldung aktualisieren.",
          },
          sync_offline: {
            title: "Offline-Sync",
            description:
              "Führt alle sechs Stunden automatisch einen Sync durch, ohne auf Benutzeranmeldungen zu warten.",
          },
          auto_remove: {
            title: "Automatische Entfernung",
            description: "Benutzer werden automatisch aus Projekten entfernt, wenn sie nicht mehr zur Gruppe passen.",
          },
          group_attribute_key: {
            title: "Gruppenattributschlüssel",
            description: "Das IdP-Attribut zur Identifikation und Synchronisation von Benutzergruppen.",
            placeholder: "Gruppen",
          },
        },
        group_mapping: {
          title: "Gruppenzuordnung",
          description: "Identity-Provider-Gruppen mit Projekten und Rollen verknüpfen.",
          button_text: "Neuen Gruppensync hinzufügen",
        },
        toast: {
          updating: "Gruppensynchronisation wird aktualisiert",
          success: "Gruppensynchronisation wurde erfolgreich aktualisiert.",
          error: "Aktualisierung der Gruppensynchronisation fehlgeschlagen!",
        },
        delete_modal: {
          title: "Gruppensync löschen",
          content:
            "Neue Benutzer aus dieser Identity-Gruppe werden nicht mehr zum Projekt hinzugefügt. Bereits hinzugefügte Benutzer behalten ihre aktuelle Rolle.",
        },
        modal: {
          idp_group_name: {
            text: "Benutzergruppe",
            required: "Benutzergruppe ist erforderlich",
            placeholder: "IdP-Gruppennamen eingeben",
          },
          project: {
            text: "Projekt",
            required: "Projekt ist erforderlich",
            placeholder: "Projekt auswählen",
          },
          default_role: {
            text: "Projektrolle",
            required: "Projektrolle ist erforderlich",
            placeholder: "Projektrolle auswählen",
          },
        },
      },
      identity: {
        title: "Identität",
        heading: "Identität",
        description: "Konfigurieren Sie Ihre Domain und aktivieren Sie Single Sign-On",
      },
      project_states: {
        heading: "Fortschrittsübersicht für alle Projekte anzeigen.",
        description:
          "Projektstatus ist eine Plane-exklusive Funktion zur Verfolgung des Fortschritts aller Ihrer Projekte nach beliebiger Projekteigenschaft.",
        title: "Projektstatus",
      },
      projects: {
        title: "Projekte",
        description: "Projektstatus verwalten, Projektlabels aktivieren und weitere Konfiguration.",
        tabs: {
          states: "Projektstatus",
          labels: "Projektlabels",
        },
      },
      teamspaces: {
        heading: "Teamspaces",
        description:
          "Sehen Sie die Arbeit Ihres Teams in einem separaten Bereich mit verknüpften Projekten, Aufgaben, Team-Diagrammen, Seiten und Ansichten.",
        title: "Teamspaces",
      },
      initiatives: {
        heading: "Initiativen",
        description: "Erschließen Sie die höchste Organisationsebene für Ihre gesamte Arbeit in Plane.",
        title: "Initiativen",
      },
      customers: {
        heading: "Arbeit nach dem verwalten, was für Ihre Kunden wichtig ist.",
        description:
          "Bringen Sie Kundenanfragen zu Arbeitselementen, priorisieren Sie nach Anfragen und fassen Sie den Status von Arbeitselementen in Kundendatensätzen zusammen. Bald können Sie Ihr CRM- oder Support-Tool für noch besseres Arbeitsmanagement nach Kundenattributen integrieren.",
        title: "Kunden",
      },
      releases: {
        title: "Releases",
        update_release: "Release aktualisieren",
        create_release: "Release erstellen",
        errors: {
          release_not_found: "Der gesuchte Release existiert nicht.",
          unknown: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
        },
      },

      templates: {
        title: "Vorlagen",
        heading: "Vorlagen",
        description:
          "Sparen Sie 80% der Zeit beim Erstellen von Projekten, Arbeitselementen und Seiten, wenn Sie Vorlagen verwenden.",
      },
      relations: {
        title: "Beziehungen",
        heading: "Beziehungen",
        description:
          "Erstellen und verwalten Sie Beziehungstypen, die Arbeitselemente in Ihrem Arbeitsbereich verbinden.",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description:
          "Lassen Sie Ihre Arbeit intelligenter und schneller werden mit KI, die nativ mit Ihrer Arbeit und Wissensbasis verbunden ist.",
      },
      runners: {
        title: "Plane Runner",
        heading: "Skripte",
        new_script: "Neues Skript",
        description: "Automatisieren Sie Ihre Workflows mit benutzerdefinierten Skripten und Automatisierungsregeln.",
      },
      cancel_trial: {
        title: "Kündigen Sie zuerst Ihre Testphase.",
        description:
          "Sie haben eine aktive Testphase für einen unserer kostenpflichtigen Pläne. Bitte kündigen Sie diese zuerst, um fortzufahren.",
        dismiss: "Schließen",
        cancel: "Testphase kündigen",
        cancel_success_title: "Testphase gekündigt.",
        cancel_success_message: "Sie können jetzt den Workspace löschen.",
        cancel_error_title: "Das hat nicht funktioniert.",
        cancel_error_message: "Bitte versuchen Sie es erneut.",
      },
      applications: {
        title: "Anwendungen",
        webhook_secret: {
          label: "Webhook-Secret",
          description: "Secret zur Überprüfung eingehender Webhook-Anfragen.",
          placeholder: "Geben Sie einen zufälligen geheimen Schlüssel ein",
        },
        invalid_website_error: "Ungültige Website",
        app_consent_no_access_title: "Installationsanfrage",
        app_consent_unapproved_title: "Diese App wurde noch nicht von Plane überprüft oder genehmigt.",
        app_consent_unapproved_description:
          "Stellen Sie sicher, dass Sie dieser App vertrauen, bevor Sie sie mit Ihrem Arbeitsbereich verbinden.",
        go_to_app: "Zur App",
        applicationId_copied: "Anwendungs-ID in die Zwischenablage kopiert",
        clientId_copied: "Client-ID in die Zwischenablage kopiert",
        clientSecret_copied: "Client-Secret in die Zwischenablage kopiert",
        third_party_apps: "Drittanbieter-Apps",
        your_apps: "Ihre Apps",
        connect: "Verbinden",
        connected: "Verbunden",
        install: "Installieren",
        installed: "Installiert",
        configure: "Konfigurieren",
        app_available: "Sie haben diese App für die Verwendung mit einem Plane-Workspace verfügbar gemacht",
        app_available_description: "Verbinden Sie einen Plane-Workspace, um die Nutzung zu beginnen",
        client_id_and_secret: "Client-ID und Secret",
        client_id_and_secret_description:
          "Kopieren und speichern Sie diesen geheimen Schlüssel. Sie können diesen Schlüssel nach dem Schließen nicht mehr sehen.",
        client_id_and_secret_download: "Sie können eine CSV-Datei mit dem Schlüssel von hier herunterladen.",
        application_id: "Anwendungs-ID",
        client_id: "Client-ID",
        client_secret: "Client-Secret",
        export_as_csv: "Als CSV exportieren",
        slug_already_exists: "Slug existiert bereits",
        failed_to_create_application: "Erstellen der Anwendung fehlgeschlagen",
        upload_logo: "Logo hochladen",
        app_name_title: "Wie möchten Sie diese App nennen",
        app_name_error: "App-Name ist erforderlich",
        app_short_description_title: "Geben Sie dieser App eine kurze Beschreibung",
        app_short_description_error: "Kurze App-Beschreibung ist erforderlich",
        app_description_title: {
          label: "Lange Beschreibung",
          placeholder: "Schreiben Sie eine lange Beschreibung für den Marktplatz. Drücken Sie '/' für Befehle.",
        },
        authorization_grant_type: {
          title: "Verbindungstyp",
          description:
            "Wählen Sie, ob Ihre App einmal für den Arbeitsbereich installiert werden soll oder ob jeder Benutzer sein eigenes Konto verbinden soll",
        },
        app_description_error: "App-Beschreibung ist erforderlich",
        app_slug_title: "App-Slug",
        app_slug_error: "App-Slug ist erforderlich",
        app_maker_error: "App-Entwickler ist erforderlich",
        webhook_url_title: "Webhook-URL",
        webhook_url_error: "Webhook-URL ist erforderlich",
        invalid_webhook_url_error: "Ungültige Webhook-URL",
        redirect_uris_title: "Weiterleitungs-URIs",
        redirect_uris_error: "Weiterleitungs-URIs sind erforderlich",
        invalid_redirect_uris_error: "Ungültige Weiterleitungs-URIs",
        redirect_uris_description:
          "Geben Sie durch Leerzeichen getrennte URIs ein, zu denen die App nach dem Benutzer weiterleitet, z.B. https://example.com https://example.com/",
        authorized_javascript_origins_title: "Autorisierte Javascript-Ursprünge",
        authorized_javascript_origins_error: "Autorisierte Javascript-Ursprünge sind erforderlich",
        invalid_authorized_javascript_origins_error: "Ungültige autorisierte Javascript-Ursprünge",
        authorized_javascript_origins_description:
          "Geben Sie durch Leerzeichen getrennte Ursprünge ein, von denen aus die App Anfragen stellen darf, z.B. app.com example.com",
        create_app: "App erstellen",
        update_app: "App aktualisieren",
        build_your_own_app: "Erstelle deine eigene App",
        edit_app_details: "App-Details bearbeiten",
        regenerate_client_secret_description:
          "Client-Secret neu generieren. Wenn Sie das Secret neu generieren, können Sie den Schlüssel kopieren oder direkt danach als CSV-Datei herunterladen.",
        regenerate_client_secret: "Client-Secret neu generieren",
        regenerate_client_secret_confirm_title: "Sind Sie sicher, dass Sie das Client-Secret neu generieren möchten?",
        regenerate_client_secret_confirm_description:
          "Apps, die dieses Secret verwenden, werden nicht mehr funktionieren. Sie müssen das Secret in der App aktualisieren.",
        regenerate_client_secret_confirm_cancel: "Abbrechen",
        regenerate_client_secret_confirm_regenerate: "Neu generieren",
        read_only_access_to_workspace: "Nur-Lese-Zugriff auf Ihren Workspace",
        write_access_to_workspace: "Schreibzugriff auf Ihren Workspace",
        read_only_access_to_user_profile: "Nur-Lese-Zugriff auf Ihr Benutzerprofil",
        write_access_to_user_profile: "Schreibzugriff auf Ihr Benutzerprofil",
        connect_app_to_workspace: "Verbinden Sie {app} mit Ihrem Workspace {workspace}",
        user_permissions: "Benutzerberechtigungen",
        user_permissions_description:
          "Benutzerberechtigungen werden verwendet, um Zugriff auf das Benutzerprofil zu gewähren.",
        workspace_permissions: "Workspace-Berechtigungen",
        workspace_permissions_description:
          "Workspace-Berechtigungen werden verwendet, um Zugriff auf den Workspace zu gewähren.",
        with_the_permissions: "mit den Berechtigungen",
        app_consent_title: "{app} fordert Zugriff auf Ihren Plane-Workspace und Ihr Profil an.",
        choose_workspace_to_connect_app_with: "Wählen Sie einen Workspace aus, mit dem die App verbunden werden soll",
        app_consent_workspace_permissions_title: "{app} möchte",
        app_consent_user_permissions_title:
          "{app} kann auch die Berechtigung eines Benutzers für die folgenden Ressourcen anfordern. Diese Berechtigungen werden nur von einem Benutzer angefordert und autorisiert.",
        app_consent_accept_title: "Durch die Annahme",
        app_consent_accept_1:
          "Gewähren Sie der App Zugriff auf Ihre Plane-Daten, wo immer Sie die App innerhalb oder außerhalb von Plane verwenden können",
        app_consent_accept_2: "Stimmen Sie der Datenschutzerklärung und den Nutzungsbedingungen von {app} zu",
        accepting: "Wird akzeptiert...",
        accept: "Akzeptieren",
        categories: "Kategorien",
        select_app_categories: "App-Kategorien auswählen",
        categories_title: "Kategorien",
        categories_error: "Kategorien sind erforderlich",
        invalid_categories_error: "Ungültige Kategorien",
        categories_description: "Wählen Sie die Kategorien, die am besten zu der App passen",
        supported_plans: "Unterstützte Pläne",
        supported_plans_description:
          "Wählen Sie die Workspace-Pläne aus, die diese Anwendung installieren können. Leer lassen, um alle Pläne zu erlauben.",
        select_plans: "Pläne Auswählen",
        privacy_policy_url_title: "Datenschutzerklärung URL",
        privacy_policy_url_error: "Datenschutzerklärung URL ist erforderlich",
        invalid_privacy_policy_url_error: "Ungültige Datenschutzerklärung URL",
        terms_of_service_url_title: "Nutzungsbedingungen URL",
        terms_of_service_url_error: "Nutzungsbedingungen URL ist erforderlich",
        invalid_terms_of_service_url_error: "Ungültige Nutzungsbedingungen URL",
        support_url_title: "Support-URL",
        support_url_error: "Support-URL ist erforderlich",
        invalid_support_url_error: "Ungültige Support-URL",
        video_url_title: "Video-URL",
        video_url_error: "Video-URL ist erforderlich",
        invalid_video_url_error: "Ungültige Video-URL",
        setup_url_error: "Setup-URL ist erforderlich",
        invalid_setup_url_error: "Ungültige Setup-URL",
        configuration_url_title: "Konfigurations-URL",
        configuration_url_error: "Konfigurations-URL ist erforderlich",
        invalid_configuration_url_error: "Ungültige Konfigurations-URL",
        contact_email_title: "Kontakt-Email",
        contact_email_error: "Kontakt-Email ist erforderlich",
        invalid_contact_email_error: "Ungültige Kontakt-Email",
        upload_attachments: "Dateien hochladen",
        uploading_images: "{count, plural, one {Ein Bild wird} other {{count} Bilder werden}} hochgeladen",
        drop_images_here: "Dateien hier ablegen",
        click_to_upload_images: "Dateien hochladen",
        invalid_file_or_exceeds_size_limit: "Ungültige Datei oder überschreitet die Größe ({size} MB)",
        uploading: "Hochladen...",
        upload_and_save: "Hochladen und speichern",
        app_credentials_regenrated: {
          title: "App-Anmeldedaten wurden erfolgreich neu generiert",
          description:
            "Ersetzen Sie das Client-Secret überall, wo es verwendet wird. Das vorherige Secret ist nicht mehr gültig.",
        },
        app_created: {
          title: "App wurde erfolgreich erstellt",
          description: "Verwenden Sie die Anmeldedaten, um die App in einem Plane-Arbeitsbereich zu installieren",
        },
        installed_apps: "Installierte Apps",
        all_apps: "Alle Apps",
        internal_apps: "Interne Apps",
        website: {
          title: "Webseite",
          description: "Link zur Website Ihrer App.",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "App-Entwickler",
          description: "Die Person oder Organisation, die die App erstellt.",
        },
        setup_url: {
          label: "Setup-URL",
          description: "Benutzer werden zu dieser URL weitergeleitet, wenn sie die App installieren.",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "Webhook-URL",
          description:
            "Hier werden wir Webhook-Ereignisse und Updates von den Arbeitsbereichen senden, in denen Ihre App installiert ist.",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "Redirect-URIs (durch Leerzeichen getrennt)",
          description: "Benutzer werden nach der Authentifizierung mit Plane auf diesen Pfad weitergeleitet.",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "Diese App kann nur installiert werden, nachdem ein Workspace-Administrator sie installiert hat. Wenden Sie sich an Ihren Workspace-Administrator, um fortzufahren.",
        enable_app_mentions: "App-Erwähnungen aktivieren",
        enable_app_mentions_tooltip:
          "Wenn dies aktiviert ist, können Benutzer Arbeitsaufgaben an diese Anwendung erwähnen oder zuweisen.",
        scopes: "Bereiche",
        select_scopes: "Bereiche auswählen",
        read_access_to: "Schreibgeschützter Zugriff auf",
        write_access_to: "Schreibzugriff auf",
        global_permission_expiration:
          "Globale Bereiche laufen bald ab. Verwenden Sie stattdessen granulare Bereiche. Verwenden Sie z. B. project:read anstelle eines globalen Lesezugriffs.",
        selected_scopes: "{count} ausgewählt",
        scopes_and_permissions: "Bereiche & Berechtigungen",
        read: "Lesen",
        write: "Schreiben",
        scope_description: {
          projects: "Zugriff auf Projekte und alle projektbezogenen Entitäten",
          wiki: "Zugriff auf Wiki und alle wiki-bezogenen Entitäten",
          customers: "Zugriff auf Kunden und alle kundenbezogenen Entitäten",
          initiatives: "Zugriff auf Initiativen und alle initiativenbezogenen Entitäten",
          workspaces: "Zugriff auf Workspaces und alle workspace-bezogenen Entitäten",
          stickies: "Zugriff auf Stickies und alle sticky-bezogenen Entitäten",
          teamspaces: "Zugriff auf Teamspaces und alle teamspace-bezogenen Entitäten",
          profile: "Zugriff auf Benutzerprofilinformationen",
          agents: "Zugriff auf Agenten und alle agentenbezogenen Entitäten",
          assets: "Zugriff auf Assets und alle asset-bezogenen Entitäten",
        },
        internal: "Intern",
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
      preferences: "Einstellungen",
      "api-tokens": "Persönliche Zugriffstoken",
      notifications: "Benachrichtigungen",
      connections: "Verbindungen",
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
      project_lead_description: "Wählen Sie den Projektleiter für das Projekt aus.",
      default_assignee_description: "Wählen Sie den Standard-Zuständigen für das Projekt aus.",
      project_subscribers: "Projektabonnenten",
      project_subscribers_description: "Wählen Sie Mitglieder aus, die Benachrichtigungen für dieses Projekt erhalten.",
    },
    states: {
      heading: "Status",
      description:
        "Definieren und passen Sie Workflow-Status an, um den Fortschritt Ihrer Arbeitselemente zu verfolgen.",
      describe_this_state_for_your_members: "Beschreiben Sie diesen Status für Ihre Mitglieder.",
      empty_state: {
        title: "Keine Status für die Gruppe {groupKey}",
        description: "Erstellen Sie einen neuen Status",
      },
    },
    labels: {
      heading: "Labels",
      description:
        "Erstellen Sie benutzerdefinierte Labels, um Ihre Arbeitselemente zu kategorisieren und zu organisieren",
      label_title: "Labelname",
      label_title_is_required: "Ein Labelname ist erforderlich",
      label_max_char: "Der Labelname darf nicht mehr als 255 Zeichen enthalten",
      toast: {
        error: "Fehler beim Aktualisieren des Labels",
      },
    },
    estimates: {
      heading: "Schätzungen",
      enable_description: "Sie helfen Ihnen, die Komplexität und Arbeitsbelastung des Teams zu kommunizieren.",
      label: "Schätzungen",
      title: "Schätzungen für mein Projekt aktivieren",
      description: "Sie helfen Ihnen, die Komplexität und Arbeitsbelastung des Teams zu kommunizieren.",
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
        switch: {
          success: {
            title: "Schätzungssystem erstellt",
            message: "Erfolgreich erstellt und aktiviert",
          },
          error: {
            title: "Fehler",
            message: "Etwas ist schiefgelaufen",
          },
        },
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
        reorder: {
          success: {
            title: "Schätzungen neu geordnet",
            message: "Die Schätzungen wurden in Ihrem Projekt neu geordnet.",
          },
          error: {
            title: "Neuordnung der Schätzungen fehlgeschlagen",
            message: "Die Schätzungen konnten nicht neu geordnet werden, bitte versuchen Sie es erneut",
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
        unsaved_changes: "Sie haben ungespeicherte Änderungen. Bitte speichern Sie diese, bevor Sie auf Fertig klicken",
        remove_empty:
          "Die Schätzung darf nicht leer sein. Geben Sie einen Wert in jedes Feld ein oder entfernen Sie die Felder, für die Sie keine Werte haben.",
        fill: "Bitte füllen Sie dieses Schätzungsfeld aus",
        repeat: "Schätzungswert darf nicht wiederholt werden",
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
      edit: {
        title: "Schätzsystem bearbeiten",
        add_or_update: {
          title: "Schätzungen hinzufügen, aktualisieren oder entfernen",
          description:
            "Verwalten Sie das aktuelle System durch Hinzufügen, Aktualisieren oder Entfernen von Punkten oder Kategorien.",
        },
        switch: {
          title: "Schätzungstyp ändern",
          description: "Konvertieren Sie Ihr Punktesystem in ein Kategoriesystem und umgekehrt.",
        },
      },
      switch: "Schätzsystem wechseln",
      current: "Aktuelles Schätzsystem",
      select: "Wählen Sie ein Schätzsystem",
    },
    automations: {
      heading: "Automatisierungen",
      description:
        "Konfigurieren Sie automatisierte Aktionen, um Ihren Projektmanagement-Workflow zu optimieren und manuelle Aufgaben zu reduzieren.",
      label: "Automatisierungen",
      "auto-archive": {
        title: "Geschlossene Arbeitselemente automatisch archivieren",
        description: "Plane archiviert automatisch Arbeitselemente, die abgeschlossen oder abgebrochen wurden.",
        duration: "Arbeitselemente automatisch archivieren, die geschlossen sind seit",
      },
      "auto-close": {
        title: "Arbeitselemente automatisch schließen",
        description: "Plane schließt automatisch Arbeitselemente, die nicht abgeschlossen oder abgebrochen wurden.",
        duration: "Arbeitselemente automatisch schließen, die inaktiv sind seit",
        auto_close_status: "Auto-Schließ-Status",
      },
      "auto-remind": {
        title: "Automatische Erinnerungen",
        description:
          "Plane wird automatische Erinnerungen via E-Mail und in-App-Benachrichtigungen senden, um Ihr Team auf den Lauf der Dinge zu halten.",
        duration: "Erinnerung vor",
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
      integrations: {
        title: "Keine Integrationen konfiguriert",
        description:
          "Konfigurieren Sie GitHub und andere Integrationen, um Ihre Projektarbeitsaufgaben zu synchronisieren.",
      },
    },
    initiatives: {
      heading: "Initiativen",
      sub_heading: "Erschließen Sie die höchste Organisationsebene für alle Ihre Arbeiten in Plane.",
      title: "Initiativen Aktivieren",
      description: "Setzen Sie größere Ziele, um den Fortschritt zu überwachen",
      toast: {
        updating: "Initiativenfunktion wird aktualisiert",
        enable_success: "Initiativenfunktion erfolgreich aktiviert.",
        disable_success: "Initiativenfunktion erfolgreich deaktiviert.",
        error: "Aktualisierung der Initiativenfunktion fehlgeschlagen!",
      },
    },
    cycles: {
      auto_schedule: {
        heading: "Automatische Zyklusplanung",
        description: "Halten Sie Zyklen ohne manuelle Einrichtung in Bewegung.",
        tooltip: "Erstellen Sie automatisch neue Zyklen basierend auf Ihrem gewählten Zeitplan.",
        edit_button: "Bearbeiten",
        form: {
          cycle_title: {
            label: "Zyklustitel",
            placeholder: "Titel",
            tooltip: "Der Titel wird für nachfolgende Zyklen mit Nummern ergänzt. Zum Beispiel: Design - 1/2/3",
            validation: {
              required: "Zyklustitel ist erforderlich",
              max_length: "Der Titel darf 255 Zeichen nicht überschreiten",
            },
          },
          cycle_duration: {
            label: "Zyklusdauer",
            unit: "Wochen",
            validation: {
              required: "Zyklusdauer ist erforderlich",
              min: "Die Zyklusdauer muss mindestens 1 Woche betragen",
              max: "Die Zyklusdauer darf 30 Wochen nicht überschreiten",
              positive: "Die Zyklusdauer muss positiv sein",
            },
          },
          cooldown_period: {
            label: "Abkühlungsphase",
            unit: "Tage",
            tooltip: "Pause zwischen Zyklen, bevor der nächste beginnt.",
            validation: {
              required: "Abkühlungsphase ist erforderlich",
              negative: "Die Abkühlungsphase darf nicht negativ sein",
            },
          },
          start_date: {
            label: "Zyklus-Starttag",
            validation: {
              required: "Startdatum ist erforderlich",
              past: "Das Startdatum darf nicht in der Vergangenheit liegen",
            },
          },
          number_of_cycles: {
            label: "Anzahl zukünftiger Zyklen",
            validation: {
              required: "Anzahl der Zyklen ist erforderlich",
              min: "Mindestens 1 Zyklus ist erforderlich",
              max: "Es können nicht mehr als 3 Zyklen geplant werden",
            },
          },
          auto_rollover: {
            label: "Automatische Übertragung von Arbeitselementen",
            tooltip:
              "Am Tag der Zyklusbeendigung werden alle unvollendeten Arbeitselemente in den nächsten Zyklus verschoben.",
          },
        },
        toast: {
          toggle: {
            loading_enable: "Automatische Zyklusplanung wird aktiviert",
            loading_disable: "Automatische Zyklusplanung wird deaktiviert",
            success: {
              title: "Erfolg!",
              message: "Automatische Zyklusplanung erfolgreich aktiviert.",
            },
            error: {
              title: "Fehler!",
              message: "Aktivierung der automatischen Zyklusplanung fehlgeschlagen.",
            },
          },
          save: {
            loading: "Konfiguration der automatischen Zyklusplanung wird gespeichert",
            success: {
              title: "Erfolg!",
              message_create: "Konfiguration der automatischen Zyklusplanung erfolgreich gespeichert.",
              message_update: "Konfiguration der automatischen Zyklusplanung erfolgreich aktualisiert.",
            },
            error: {
              title: "Fehler!",
              message_create: "Speichern der Konfiguration der automatischen Zyklusplanung fehlgeschlagen.",
              message_update: "Aktualisierung der Konfiguration der automatischen Zyklusplanung fehlgeschlagen.",
            },
          },
        },
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
        intake_responsibility: "Intake-Verantwortung",
        intake_sources: "Intake-Quellen",
        title: "Aufnahme",
        short_title: "Aufnahme",
        description:
          "Ermöglichen Sie Nicht-Mitgliedern, Fehler, Feedback und Vorschläge zu teilen, ohne Ihren Workflow zu unterbrechen.",
        toggle_title: "Aufnahme aktivieren",
        toggle_description: "Projektmitgliedern erlauben, In-App-Aufnahmeanfragen zu erstellen.",
        toggle_tooltip_on: "Bitten Sie Ihren Projekt-Admin, dies zu aktivieren.",
        toggle_tooltip_off: "Bitten Sie Ihren Projekt-Admin, dies zu deaktivieren.",
        notify_assignee: {
          title: "Zuständige benachrichtigen",
          description:
            "Für eine neue Intake-Anfrage werden die Standard-Zuständigen über Benachrichtigungen informiert",
        },
        in_app: {
          title: "In der App",
          description:
            "Erhalten Sie neue Arbeitselemente von Mitgliedern und Gästen in Ihrem Arbeitsbereich, ohne Ihre bestehenden Arbeitselemente zu stören.",
        },
        email: {
          title: "E-Mail",
          description:
            "Sammeln Sie neue Arbeitselemente von allen, die eine E-Mail an eine Plane-E-Mail-Adresse senden.",
          fieldName: "E-Mail-ID",
        },
        form: {
          title: "Formulare",
          description:
            "Ermöglichen Sie Personen außerhalb Ihres Arbeitsbereichs, über ein dediziertes und sicheres Formular potenzielle neue Arbeitselemente zu erstellen.",
          fieldName: "Standard-Formular-URL",
          create_forms: "Formulare mit Arbeitselementtypen erstellen",
          manage_forms: "Formulare verwalten",
          manage_forms_tooltip: "Bitten Sie Ihren Arbeitsbereichs-Admin, dies zu verwalten.",
          create_form: "Formular erstellen",
          edit_form: "Formulardetails bearbeiten",
          form_title: "Formulartitel",
          form_title_required: "Formulartitel ist erforderlich",
          work_item_type: "Arbeitselementtyp",
          remove_property: "Eigenschaft entfernen",
          select_properties: "Eigenschaften auswählen",
          search_placeholder: "Nach Eigenschaften suchen",
          toasts: {
            success_create: "Intake-Formular erfolgreich erstellt",
            success_update: "Intake-Formular erfolgreich aktualisiert",
            error_create: "Intake-Formular konnte nicht erstellt werden",
            error_update: "Intake-Formular konnte nicht aktualisiert werden",
          },
        },
        toasts: {
          set: {
            loading: "Zuständige werden festgelegt...",
            success: {
              title: "Erfolg!",
              message: "Zuständige erfolgreich festgelegt.",
            },
            error: {
              title: "Fehler!",
              message: "Beim Festlegen der Zuständigen ist etwas schiefgelaufen. Bitte versuchen Sie es erneut.",
            },
          },
        },
      },
      time_tracking: {
        title: "Zeiterfassung",
        short_title: "Zeiterfassung",
        description: "Erfassen Sie die für Arbeitselemente und Projekte aufgewendete Zeit.",
        toggle_title: "Zeiterfassung aktivieren",
        toggle_description: "Projektmitglieder können die geleistete Arbeit protokollieren.",
      },
      milestones: {
        title: "Meilensteine",
        short_title: "Meilensteine",
        description:
          "Meilensteine bieten eine Ebene, um Arbeitselemente auf gemeinsame Fertigstellungstermine auszurichten.",
        toggle_title: "Meilensteine aktivieren",
        toggle_description: "Organisieren Sie Arbeitselemente nach Meilenstein-Fristen.",
      },
      toasts: {
        loading: "Projektfunktion wird aktualisiert...",
        success: "Projektfunktion erfolgreich aktualisiert.",
        error: "Beim Aktualisieren der Projektfunktion ist etwas schiefgelaufen. Bitte versuchen Sie es erneut.",
      },
    },
    workflows: {
      toggle: {
        title: "Workflows aktivieren",
        description: "Legen Sie Workflows fest, um die Bewegung von Arbeitselementen zu steuern",
        no_states_tooltip: "Keine Status wurden dem Workflow hinzugefügt.",
        toast: {
          loading: {
            enabling: "Workflows werden aktiviert",
            disabling: "Workflows werden deaktiviert",
          },
          success: {
            title: "Erfolg!",
            message: "Workflows erfolgreich aktiviert.",
          },
          error: {
            title: "Fehler!",
            message: "Workflows konnten nicht aktiviert werden. Bitte versuchen Sie es erneut.",
          },
        },
      },
      heading: "Workflows",
      description:
        "Automatisieren Sie Übergänge von Arbeitselementen und legen Sie Regeln fest, um zu steuern, wie Aufgaben durch Ihre Projektpipeline fließen.",
      add_button: "Neuen Workflow hinzufügen",
      search: "Workflows suchen",
      detail: {
        define: "Workflow definieren",
        add_states: "Status hinzufügen",
        unmapped_states: {
          title: "Nicht zugeordnete Status erkannt",
          description:
            "Einige Arbeitselemente der ausgewählten Typen befinden sich derzeit in Status, die in diesem Workflow nicht vorhanden sind.",
          note: "Wenn Sie diesen Workflow aktivieren, werden diese Elemente automatisch in den Anfangsstatus dieses Workflows verschoben.",
          label: "Fehlende Status",
          tooltip:
            "Einige Arbeitselemente befinden sich in Status, die diesem Workflow nicht zugeordnet sind. Öffnen Sie den Workflow zur Überprüfung.",
        },
      },
      select_states: {
        empty_state: {
          title: "Alle Status werden verwendet",
          description: "Alle für dieses Projekt definierten Status sind bereits in Ihrem aktuellen Workflow vorhanden.",
        },
      },
      default_footer: {
        fallback_message: "Dieser Workflow gilt für jeden Arbeitselementtyp, der keinem Workflow zugeordnet ist.",
      },
      create: {
        heading: "Neuen Workflow erstellen",
        name: {
          placeholder: "Einen eindeutigen Namen hinzufügen",
          validation: {
            max_length: "Der Name darf nicht mehr als 255 Zeichen haben",
            required: "Name ist erforderlich",
            invalid: "Der Name darf nur Buchstaben, Zahlen, Leerzeichen, Bindestriche und Apostrophe enthalten",
          },
        },
        description: {
          placeholder: "Eine kurze Beschreibung hinzufügen",
          validation: {
            invalid: "Die Beschreibung darf nur Buchstaben, Zahlen, Leerzeichen, Bindestriche und Apostrophe enthalten",
          },
        },
        work_item_type: {
          label: "Arbeitselementtyp",
        },
        success: {
          title: "Erfolg!",
          message: "Workflow erfolgreich erstellt.",
        },
        error: {
          title: "Fehler!",
          message: "Workflow konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
        },
      },
      update: {
        success: {
          title: "Erfolg!",
          message: "Workflow erfolgreich aktualisiert.",
        },
        error: {
          title: "Fehler!",
          message: "Workflow konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.",
        },
      },
      delete: {
        loading: "Workflow wird gelöscht",
        success: {
          title: "Erfolg!",
          message: "Workflow erfolgreich gelöscht.",
        },
        error: {
          title: "Fehler!",
          message: "Workflow konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.",
        },
      },
      add_states: {
        success: {
          title: "Erfolg!",
          message: "Status erfolgreich hinzugefügt.",
        },
        error: {
          title: "Fehler!",
          message: "Status konnten nicht hinzugefügt werden. Bitte versuchen Sie es erneut.",
        },
      },
    },
    work_item_types: {
      heading: "Arbeitselementtypen",
      description:
        "Erstellen und passen Sie verschiedene Typen von Arbeitselementen mit einzigartigen Eigenschaften an",
    },
    customers: {
      heading: "Kunden",
      settings_heading: "Arbeit nach dem verwalten, was für Ihre Kunden wichtig ist.",
      settings_sub_heading:
        "Bringen Sie Kundenanfragen zu Arbeitselementen, priorisieren Sie nach Anfragen und fassen Sie den Status von Arbeitselementen in Kundendatensätzen zusammen. Bald können Sie Ihr CRM- oder Support-Tool für noch besseres Arbeitsmanagement nach Kundenattributen integrieren.",
      description:
        "Bringen Sie Kundenanfragen zu Arbeitselementen, priorisieren Sie nach Anfragen und fassen Sie den Status von Arbeitselementen in Kundendatensätzen zusammen. Bald können Sie Ihr CRM- oder Support-Tool für noch besseres Arbeitsmanagement nach Kundenattributen integrieren.",
    },
    epics: {
      heading: "Epics",
      description:
        "Für größere Arbeitsmengen, die sich über mehrere Zyklen erstrecken und in verschiedenen Modulen existieren können",
      properties: {
        title: "Eigenschaften",
        description: "Fügen Sie benutzerdefinierte Eigenschaften zu Ihrem Epic hinzu.",
      },
      disabled: "Deaktiviert",
    },
    project_updates: {
      heading: "Projektaktualisierungen",
      description: "Konsolidierte Nachverfolgung und Fortschrittsüberwachung für dieses Projekt",
    },
    templates: {
      heading: "Vorlagen",
      description:
        "Sparen Sie 80% der Zeit beim Erstellen von Projekten, Arbeitselementen und Seiten, wenn Sie Vorlagen verwenden.",
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
    transfer: {
      no_cycles_available: "Keine anderen Zyklen verfügbar, um Arbeitselemente zu übertragen.",
    },
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
      trailing: "Rückstand",
      leading: "Vorsprung",
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
        filter: {
          title: "Keine passenden Ansichten",
          description: "Keine Ansichten entsprechen den Suchkriterien.\n Erstellen Sie stattdessen eine neue Ansicht.",
        },
      },
      no_archived_issues: {
        title: "Noch keine archivierten Arbeitselemente",
        description:
          "Manuell oder durch Automatisierung können Sie abgeschlossene oder abgebrochene Arbeitselemente archivieren. Finden Sie sie hier, sobald sie archiviert sind.",
        primary_button: {
          text: "Automatisierung einrichten",
        },
      },
      issues_empty_filter: {
        title: "Keine Arbeitselemente gefunden, die den angewendeten Filtern entsprechen",
        secondary_button: {
          text: "Alle Filter löschen",
        },
      },
      public: {
        title: "Noch keine öffentlichen Seiten",
        description: "Sehen Sie hier Seiten, die mit allen in Ihrem Projekt geteilt wurden.",
        primary_button: {
          text: "Ihre erste Seite erstellen",
        },
      },
      archived: {
        title: "Noch keine archivierten Seiten",
        description: "Archivieren Sie Seiten, die nicht auf Ihrem Radar sind. Greifen Sie hier bei Bedarf darauf zu.",
      },
      shared: {
        title: "Noch keine geteilten Seiten",
        description: "Seiten, die andere mit Ihnen geteilt haben, werden hier angezeigt.",
      },
    },
    delete_view: {
      title: "Sind Sie sicher, dass Sie diese Ansicht löschen möchten?",
      content:
        "Wenn Sie bestätigen, werden alle Sortier-, Filter- und Anzeigeoptionen + das Layout, das Sie für diese Ansicht gewählt haben, dauerhaft gelöscht und können nicht wiederhergestellt werden.",
    },
  },
  project_members: {
    full_name: "Vollständiger Name",
    display_name: "Anzeigename",
    email: "E-Mail",
    joining_date: "Beitrittsdatum",
    role: "Rolle",
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
      description: "Arbeitselemente und Epics aus Jira importieren.",
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
          highlight_changes: "Änderungen hervorheben",
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
      comments: {
        label: "Kommentare",
        empty_state: {
          title: "Keine Kommentare",
          description: "Fügen Sie Kommentare hinzu, um sie hier zu sehen.",
        },
      },
    },
    open_button: "Navigationsbereich öffnen",
    close_button: "Navigationsbereich schließen",
    outline_floating_button: "Gliederung öffnen",
    toasts: {
      errors: {
        wrong_name: "Der Notizname darf nicht länger als 100 Zeichen sein.",
        already_exists: "Es existiert bereits eine Notiz ohne Beschreibung",
      },
      created: {
        title: "Notiz erstellt",
        message: "Die Notiz wurde erfolgreich erstellt",
      },
      not_created: {
        title: "Notiz nicht erstellt",
        message: "Die Notiz konnte nicht erstellt werden",
      },
      updated: {
        title: "Notiz aktualisiert",
        message: "Die Notiz wurde erfolgreich aktualisiert",
      },
      not_updated: {
        title: "Notiz nicht aktualisiert",
        message: "Die Notiz konnte nicht aktualisiert werden",
      },
      removed: {
        title: "Notiz entfernt",
        message: "Die Notiz wurde erfolgreich entfernt",
      },
      not_removed: {
        title: "Notiz nicht entfernt",
        message: "Die Notiz konnte nicht entfernt werden",
      },
    },
  },
  workspace_dashboards: "Däschbords",
  pi_chat: "AI Tschät",
  customize_navigation: "Navigation anpassen",
  personal: "Persönlich",
  accordion_navigation_control: "Akkordeon-Seitenleistennavigation",
  horizontal_navigation_bar: "Tab-Navigation",
  show_limited_projects_on_sidebar: "Begrenzte Anzahl von Projekten in der Seitenleiste anzeigen",
  enter_number_of_projects: "Anzahl der Projekte eingeben",
  pin: "Anheften",
  unpin: "Lösen",
  milestones: "Meilensteine",
  milestones_description:
    "Meilensteine bieten eine Ebene, um Arbeitselemente auf gemeinsame Fertigstellungstermine auszurichten.",
  in_app: "In-App",
  forms: "Forms",
  updates: {
    add_update: "Aktualisieren",
    add_update_placeholder: "Schreiben Sie Ihre Aktualisierung hier",
    empty: {
      title: "Noch keine Aktualisierungen",
      description: "Sie können hier Aktualisierungen sehen.",
    },
    delete: {
      title: "Aktualisierung löschen",
      confirmation: "Sie sind dabei, diese Aktualisierung zu löschen. Diese Aktion ist unumkehrbar.",
      success: {
        title: "Aktualisierung gelöscht",
        message: "Die Aktualisierung wurde erfolgreich gelöscht",
      },
      error: {
        title: "Aktualisierung nicht gelöscht",
        message: "Die Aktualisierung konnte nicht gelöscht werden",
      },
    },
    reaction: {
      create: {
        success: {
          title: "Reaktion erstellt",
          message: "Reaktion wurde erfolgreich erstellt",
        },
        error: {
          title: "Reaktion nicht erstellt",
          message: "Reaktion konnte nicht erstellt werden",
        },
      },
      remove: {
        success: {
          title: "Reaktion entfernt",
          message: "Reaktion wurde erfolgreich entfernt",
        },
        error: {
          title: "Reaktion nicht entfernt",
          message: "Reaktion konnte nicht entfernt werden",
        },
      },
    },
    progress: {
      title: "Fortschritt",
      since_last_update: "Seit der letzten Aktualisierung",
      comments: "{count, plural, one{# Kommentar} few{# Kommentare} other{# Kommentare}}",
    },
    create: {
      success: {
        title: "Aktualisierung erstellt",
        message: "Aktualisierung wurde erfolgreich erstellt",
      },
      error: {
        title: "Aktualisierung nicht erstellt",
        message: "Aktualisierung konnte nicht erstellt werden",
      },
    },
    update: {
      success: {
        title: "Aktualisierung aktualisiert",
        message: "Aktualisierung wurde erfolgreich aktualisiert",
      },
      error: {
        title: "Aktualisierung nicht aktualisiert",
        message: "Aktualisierung konnte nicht aktualisiert werden",
      },
    },
  },
  teamspaces: {
    label: "Teamspaces",
    empty_state: {
      general: {
        title: "Teamspaces ermöglichen bessere Organisation und Nachverfolgung in Plane.",
        description:
          "Erstellen Sie eine dedizierte Oberfläche für jedes reale Team, getrennt von allen anderen Arbeitsoberflächen in Plane, und passen Sie sie an die Arbeitsweise Ihres Teams an.",
        primary_button: {
          text: "Neuen Teamspace erstellen",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "Sie haben noch keine Teamspaces verknüpft.",
          description: "Teamspace- und Projektbesitzer können den Zugriff auf Projekte verwalten.",
        },
      },
      primary_button: {
        text: "Teamspace verknüpfen",
      },
      secondary_button: {
        text: "Mehr erfahren",
      },
      table: {
        columns: {
          teamspaceName: "Teamspace-Name",
          members: "Mitglieder",
          accountType: "Kontotyp",
        },
        actions: {
          remove: {
            button: {
              text: "Teamspace entfernen",
            },
            confirm: {
              title: "{teamspaceName} aus {projectName} entfernen",
              description:
                "Wenn Sie diesen Teamspace aus einem verknüpften Projekt entfernen, verlieren die Mitglieder hier den Zugriff auf das verknüpfte Projekt.",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "Keine passenden Teamspaces gefunden",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {Sie haben einen Teamspace mit diesem Projekt verknüpft.} other {Sie haben # Teamspaces mit diesem Projekt verknüpft.}}",
            description:
              "{additionalCount, plural, =0 {Teamspace {firstTeamspaceName} ist jetzt mit diesem Projekt verknüpft.} other {Teamspace {firstTeamspaceName} und {additionalCount} weitere sind jetzt mit diesem Projekt verknüpft.}}",
          },
          error: {
            title: "Das hat nicht funktioniert.",
            description: "Versuchen Sie es erneut oder laden Sie diese Seite neu, bevor Sie es erneut versuchen.",
          },
        },
        remove_teamspace: {
          success: {
            title: "Sie haben diesen Teamspace aus diesem Projekt entfernt.",
            description: "Teamspace {teamspaceName} wurde aus {projectName} entfernt.",
          },
          error: {
            title: "Das hat nicht funktioniert.",
            description: "Versuchen Sie es erneut oder laden Sie diese Seite neu, bevor Sie es erneut versuchen.",
          },
        },
      },
      link_teamspace: {
        placeholder: "Nach Teamspaces suchen",
        info: {
          title: "Durch das Hinzufügen eines Teamspaces erhalten alle Teamspace-Mitglieder Zugriff auf dieses Projekt.",
          link: "Mehr erfahren",
        },
        empty_state: {
          no_teamspaces: {
            title: "Sie haben keine Teamspaces zum Verknüpfen.",
            description:
              "Entweder sind Sie nicht in einem Teamspace, den Sie verknüpfen können, oder Sie haben bereits alle verfügbaren Teamspaces verknüpft.",
          },
          no_results: {
            title: "Das entspricht keinem Ihrer Teamspaces.",
            description:
              "Versuchen Sie einen anderen Begriff oder stellen Sie sicher, dass Sie Teamspaces zum Verknüpfen haben.",
          },
        },
        primary_button: {
          text: "Ausgewählte Teamspace(s) verknüpfen",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "Erstellen Sie teamspezifische Arbeitsaufgaben.",
        description:
          "Arbeitsaufgaben, die Mitgliedern dieses Teams in einem verknüpften Projekt zugewiesen sind, werden hier automatisch angezeigt. Wenn Sie erwarten, hier einige Arbeitsaufgaben zu sehen, stellen Sie sicher, dass Ihre verknüpften Projekte Arbeitsaufgaben haben, die Mitgliedern dieses Teams zugewiesen sind, oder erstellen Sie Arbeitsaufgaben.",
        primary_button: {
          text: "Arbeitsaufgaben zu einem verknüpften Projekt hinzufügen",
        },
      },
      work_items_empty_filter: {
        title: "Es gibt keine teamspezifischen Arbeitsaufgaben für die angewendeten Filter",
        description:
          "Ändern Sie einige dieser Filter oder löschen Sie sie alle, um Arbeitsaufgaben zu sehen, die für diesen Bereich relevant sind.",
        secondary_button: {
          text: "Alle Filter löschen",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "Keines Ihrer verknüpften Projekte hat einen aktiven Zyklus.",
        description:
          "Aktive Zyklen in verknüpften Projekten werden hier automatisch angezeigt. Wenn Sie erwarten, einen aktiven Zyklus zu sehen, stellen Sie sicher, dass er gerade in einem verknüpften Projekt läuft.",
      },
      completed: {
        title: "Keines Ihrer verknüpften Projekte hat einen abgeschlossenen Zyklus.",
        description:
          "Abgeschlossene Zyklen in verknüpften Projekten werden hier automatisch angezeigt. Wenn Sie erwarten, einen abgeschlossenen Zyklus zu sehen, stellen Sie sicher, dass er auch in einem verknüpften Projekt abgeschlossen ist.",
      },
      upcoming: {
        title: "Keines Ihrer verknüpften Projekte hat einen bevorstehenden Zyklus.",
        description:
          "Bevorstehende Zyklen in verknüpften Projekten werden hier automatisch angezeigt. Wenn Sie erwarten, einen bevorstehenden Zyklus zu sehen, stellen Sie sicher, dass er auch in einem verknüpften Projekt vorhanden ist.",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title: "Die Ansichten Ihres Teams auf Ihre Arbeit, ohne andere Ansichten in Ihrem Workspace zu stören",
        description:
          "Sehen Sie die Arbeit Ihres Teams in Ansichten, die nur für Ihr Team gespeichert werden und getrennt von den Ansichten eines Projekts sind.",
        primary_button: {
          text: "Ansicht erstellen",
        },
      },
      filter: {
        title: "Keine passenden Ansichten",
        description: `Keine Ansichten entsprechen den Suchkriterien.
 Erstellen Sie stattdessen eine neue Ansicht.`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "Bewahren Sie das Wissen Ihres Teams in Team-Seiten auf.",
        description:
          "Im Gegensatz zu Seiten in einem Projekt können Sie hier teamspezifisches Wissen in einem separaten Satz von Seiten speichern. Nutzen Sie alle Funktionen von Seiten, erstellen Sie Best-Practices-Dokumente und Team-Wikis ganz einfach.",
        primary_button: {
          text: "Erstellen Sie Ihre erste Team-Seite",
        },
      },
      filter: {
        title: "Keine passenden Seiten",
        description: "Entfernen Sie die Filter, um alle Seiten zu sehen",
      },
      search: {
        title: "Keine passenden Seiten",
        description: "Entfernen Sie die Suchkriterien, um alle Seiten zu sehen",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "Keines Ihrer verknüpften Projekte hat veröffentlichte Arbeitsaufgaben.",
        description:
          "Erstellen Sie einige Arbeitsaufgaben in einem oder mehreren dieser Projekte, um den Fortschritt nach Datum, Status und Priorität zu sehen.",
      },
      relation: {
        blocking: {
          title: "Sie haben keine Arbeitsaufgaben, die einen Teamkollegen blockieren.",
          description: "Gut gemacht! Sie haben den Weg für Ihr Team freigemacht. Sie sind ein guter Teamplayer.",
        },
        blocked: {
          title: "Sie haben keine Arbeitsaufgaben von Teamkollegen, die Sie blockieren.",
          description:
            "Gute Nachrichten! Sie können bei allen Ihnen zugewiesenen Arbeitsaufgaben Fortschritte erzielen.",
        },
      },
      stats: {
        general: {
          title: "Keines Ihrer verknüpften Projekte hat veröffentlichte Arbeitsaufgaben.",
          description:
            "Erstellen Sie einige Arbeitsaufgaben in einem oder mehreren dieser Projekte, um die Verteilung der Arbeit nach Projekt und Teammitgliedern zu sehen.",
        },
        filter: {
          title: "Es gibt keine Team-Statistiken für die angewendeten Filter.",
          description:
            "Erstellen Sie einige Arbeitsaufgaben in einem oder mehreren dieser Projekte, um die Verteilung der Arbeit nach Projekt und Teammitgliedern zu sehen.",
        },
      },
    },
  },
  initiatives: {
    overview: "Übersicht",
    label: "Initiativen",
    placeholder: "{count, plural, one{# Initiative} other{# Initiativen}}",
    add_initiative: "Initiative Hinzufügen",
    create_initiative: "Initiative Erstellen",
    update_initiative: "Initiative Aktualisieren",
    initiative_name: "Initiativenname",
    all_initiatives: "Alle Initiativen",
    delete_initiative: "Initiative Löschen",
    fill_all_required_fields: "Bitte füllen Sie alle erforderlichen Felder aus.",
    toast: {
      create_success: "Initiative {name} erfolgreich erstellt.",
      create_error: "Fehler beim Erstellen der Initiative. Bitte versuchen Sie es erneut!",
      update_success: "Initiative {name} erfolgreich aktualisiert.",
      update_error: "Fehler beim Aktualisieren der Initiative. Bitte versuchen Sie es erneut!",
      delete: {
        success: "Initiative erfolgreich gelöscht.",
        error: "Fehler beim Löschen der Initiative",
      },
      link_copied: "Initiativenlink in die Zwischenablage kopiert.",
      project_update_success: "Initiativenprojekte erfolgreich aktualisiert.",
      project_update_error: "Fehler beim Aktualisieren der Initiativenprojekte. Bitte versuchen Sie es erneut!",
      epic_update_success:
        "{count, plural, one {Epic erfolgreich zur Initiative hinzugefügt.} other {{count} Epics erfolgreich zur Initiative hinzugefügt.}}",
      epic_update_error: "Epic-Hinzufügung zur Initiative fehlgeschlagen. Bitte versuchen Sie es später erneut.",
      state_update_success: "Initiativenstatus wurde erfolgreich aktualisiert.",
      state_update_error: "Aktualisierung des Initiativenstatus fehlgeschlagen. Bitte versuchen Sie es erneut!",
      label_update_error: "Fehler beim Aktualisieren der Initiativenbezeichner. Bitte versuchen Sie es erneut!",
    },
    empty_state: {
      general: {
        title: "Organisieren Sie Arbeit auf höchster Ebene mit Initiativen",
        description:
          "Wenn Sie Arbeit organisieren müssen, die sich über mehrere Projekte und Teams erstreckt, sind Initiativen praktisch. Verbinden Sie Projekte und Epics mit Initiativen, sehen Sie automatisch zusammengefasste Updates und sehen Sie den Wald, bevor Sie zu den Bäumen kommen.",
        primary_button: {
          text: "Eine Initiative erstellen",
        },
      },
      search: {
        title: "Keine passenden Initiativen",
        description: `Keine Initiativen mit den passenden Kriterien gefunden.
 Erstellen Sie stattdessen eine neue Initiative.`,
      },
      not_found: {
        title: "Initiative existiert nicht",
        description: "Die Initiative, nach der Sie suchen, existiert nicht, wurde archiviert oder wurde gelöscht.",
        primary_button: {
          text: "Andere Initiativen anzeigen",
        },
      },
      epics: {
        title: "Sie haben keine Epics, die den von Ihnen angewendeten Filtern entsprechen.",
        subHeading: "Um alle Epics zu sehen, löschen Sie alle angewendeten Filter.",
        action: "Alle Filter löschen",
      },
    },
    scope: {
      view_scope: "Umfang anzeigen",
      breakdown: "Umfangaufschlagung",
      add_scope: "Umfang hinzufügen",
      label: "Umfang",
      empty_state: {
        title: "Noch kein Umfang zu dieser Initiative hinzugefügt",
        description: "Verknüpfen Sie Projekte und Epics und verfolgen Sie diese Arbeit in diesem Raum.",
        primary_button: {
          text: "Umfang hinzufügen",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "Etiketten",
        description: "Strukturieren und organisieren Sie Ihre Initiativen mit Labels.",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "Label löschen",
        content:
          "Möchten Sie {labelName} wirklich löschen? Dadurch wird das Label aus allen Initiativen und aus allen Ansichten entfernt, in denen das Label gefiltert wird.",
      },
      toast: {
        delete_error: "Das Initiativen-Label konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.",
        label_already_exists: "Label existiert bereits",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title:
          "Schreiben Sie eine Notiz, ein Dokument oder eine vollständige Wissensdatenbank. Holen Sie sich Galileo, Planes KI-Assistent, um Ihnen den Einstieg zu erleichtern",
        description:
          "Seiten sind Gedankenspeicher in Plane. Notieren Sie Meeting-Notizen, formatieren Sie sie einfach, betten Sie Arbeitsaufgaben ein, gestalten Sie sie mit einer Bibliothek von Komponenten und behalten Sie sie alle im Kontext Ihres Projekts. Um die Arbeit an einem Dokument zu verkürzen, rufen Sie Galileo, Planes KI, mit einer Tastenkombination oder einem Knopfdruck auf.",
        primary_button: {
          text: "Erstellen Sie Ihre erste Seite",
        },
      },
      private: {
        title: "Noch keine privaten Seiten",
        description:
          "Bewahren Sie hier Ihre privaten Gedanken auf. Wenn Sie bereit sind zu teilen, ist das Team nur einen Klick entfernt.",
        primary_button: {
          text: "Erstellen Sie Ihre erste Seite",
        },
      },
      public: {
        title: "Noch keine Arbeitsbereich-Seiten",
        description: "Sehen Sie hier Seiten, die mit allen in Ihrem Arbeitsbereich geteilt werden.",
        primary_button: {
          text: "Erstellen Sie Ihre erste Seite",
        },
      },
      archived: {
        title: "Noch keine archivierten Seiten",
        description: "Archivieren Sie Seiten, die nicht auf Ihrem Radar sind. Greifen Sie bei Bedarf hier darauf zu.",
      },
      shared: {
        title: "Noch keine geteilten Seiten",
        description: "Seiten, die andere mit Ihnen geteilt haben, werden hier angezeigt.",
      },
    },
  },
  epics: {
    label: "Epics",
    no_epics_selected: "Keine Epics ausgewählt",
    add_selected_epics: "Ausgewählte Epics hinzufügen",
    epic_link_copied_to_clipboard: "Epic-Link in die Zwischenablage kopiert.",
    project_link_copied_to_clipboard: "Projektlink in die Zwischenablage kopiert",
    empty_state: {
      general: {
        title: "Erstellen Sie ein Epic und weisen Sie es jemandem zu, auch sich selbst",
        description:
          "Für größere Arbeitsmengen, die sich über mehrere Zyklen erstrecken und in verschiedenen Modulen existieren können, erstellen Sie ein Epic. Verknüpfen Sie Arbeitsaufgaben und Unterarbeitsaufgaben in einem Projekt mit einem Epic und springen Sie von der Übersicht aus in eine Arbeitsaufgabe.",
        primary_button: {
          text: "Ein Epic erstellen",
        },
      },
      section: {
        title: "Noch keine Epics",
        description: "Beginnen Sie mit dem Hinzufügen von Epics, um den Fortschritt zu verwalten und zu verfolgen.",
        primary_button: {
          text: "Epics hinzufügen",
        },
      },
    },
    duplicate: {
      modal: {
        description1: "Dies erstellt eine Kopie des Epics.",
        description2: "Alle Eigenschaftsdaten werden beim Duplizieren entfernt.",
        epics_not_enabled: "Epics nicht aktiviert",
      },
    },
    toast: {
      duplicate: {
        success: {
          message: "Epic erfolgreich dupliziert",
        },
        error: {
          message: "Epic konnte nicht dupliziert werden",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "Keine passenden Epics gefunden",
      },
      no_epics: {
        title: "Keine Epics gefunden",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "Keine aktiven Zyklen",
        description:
          "Zyklen Ihrer Projekte, die einen Zeitraum einschließen, der das heutige Datum umfasst. Finden Sie hier den Fortschritt und Details zu all Ihren aktiven Zyklen.",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: `Fügen Sie Arbeitsaufgaben zum Zyklus hinzu, um
 seinen Fortschritt zu sehen`,
      },
      priority: {
        title: `Beobachten Sie hochprioritäre Arbeitsaufgaben, die
 im Zyklus auf einen Blick bearbeitet werden.`,
      },
      assignee: {
        title: `Fügen Sie Arbeitsaufgaben Bearbeitern hinzu, um eine
 Aufschlüsselung der Arbeit nach Bearbeitern zu sehen.`,
      },
      label: {
        title: `Fügen Sie Arbeitsaufgaben Labels hinzu, um die
 Aufschlüsselung der Arbeit nach Labels zu sehen.`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "Mitglieder aus CSV importieren",
      description:
        "Laden Sie eine CSV mit Spalten hoch: Email, Display Name, First Name, Last Name, Role (5, 15 oder 20)",
      dropzone: {
        active: "CSV-Datei hier ablegen",
        inactive: "Ziehen Sie eine Datei hierher oder klicken Sie zum Hochladen",
        file_type: "Nur .csv-Dateien werden unterstützt",
      },
      buttons: {
        cancel: "Abbrechen",
        import: "Importieren",
        try_again: "Erneut versuchen",
        close: "Schließen",
        done: "Fertig",
      },
      progress: {
        uploading: "Hochladen...",
        importing: "Importieren...",
      },
      summary: {
        title: {
          failed: "Import fehlgeschlagen",
          complete: "Import abgeschlossen",
        },
        message: {
          seat_limit: "Mitglieder können aufgrund von Platzbeschränkungen nicht importiert werden.",
          success: "{count} Mitglied{plural} erfolgreich zum Arbeitsbereich hinzugefügt.",
          no_imports: "Es wurden keine Mitglieder aus der CSV-Datei importiert.",
        },
        stats: {
          successful: "Erfolgreich",
          failed: "Fehlgeschlagen",
        },
        download_errors: "Fehler herunterladen",
      },
      toast: {
        invalid_file: {
          title: "Ungültige Datei",
          message: "Nur CSV-Dateien werden unterstützt.",
        },
        import_failed: {
          title: "Import fehlgeschlagen",
          message: "Etwas ist schief gelaufen.",
        },
      },
    },
  },
  project: {
    members_import: {
      title: "Mitglieder aus CSV importieren",
      description:
        "Laden Sie eine CSV mit den Spalten E-Mail und Rolle hoch (5=Gast, 15=Mitglied, 20=Admin). Benutzer müssen bereits Mitglieder des Arbeitsbereichs sein.",
      download_sample: "Beispiel-CSV herunterladen",
      dropzone: {
        active: "CSV-Datei hier ablegen",
        inactive: "Ziehen Sie eine Datei hierher oder klicken Sie zum Hochladen",
        file_type: "Nur .csv-Dateien werden unterstützt",
      },
      buttons: {
        cancel: "Abbrechen",
        import: "Importieren",
        try_again: "Erneut versuchen",
        close: "Schließen",
        done: "Fertig",
      },
      progress: {
        uploading: "Hochladen...",
        importing: "Importieren...",
      },
      summary: {
        title: {
          complete: "Import abgeschlossen",
        },
        message: {
          success: "{count} Mitglied{plural} erfolgreich ins Projekt importiert.",
          no_imports: "Aus der CSV-Datei wurden keine neuen Mitglieder importiert.",
        },
        stats: {
          added: "Hinzugefügt",
          reactivated: "Reaktiviert",
          already_members: "Bereits Mitglieder",
          skipped: "Übersprungen",
        },
        download_errors: "Übersprungene Details herunterladen",
      },
      toast: {
        invalid_file: {
          title: "Ungültige Datei",
          message: "Nur CSV-Dateien werden unterstützt.",
        },
        import_failed: {
          title: "Import fehlgeschlagen",
          message: "Etwas ist schief gelaufen.",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "Arbeitsaufgaben können nicht archiviert werden",
        message:
          "Nur Arbeitsaufgaben, die zu den Statusgruppen Abgeschlossen oder Abgebrochen gehören, können archiviert werden.",
      },
      invalid_issue_start_date: {
        title: "Arbeitsaufgaben können nicht aktualisiert werden",
        message:
          "Das ausgewählte Startdatum liegt nach dem Fälligkeitsdatum für einige Arbeitsaufgaben. Stellen Sie sicher, dass das Startdatum vor dem Fälligkeitsdatum liegt.",
      },
      invalid_issue_target_date: {
        title: "Arbeitsaufgaben können nicht aktualisiert werden",
        message:
          "Das ausgewählte Fälligkeitsdatum liegt vor dem Startdatum für einige Arbeitsaufgaben. Stellen Sie sicher, dass das Fälligkeitsdatum nach dem Startdatum liegt.",
      },
      invalid_state_transition: {
        title: "Arbeitsaufgaben können nicht aktualisiert werden",
        message:
          "Statusänderung ist für einige Arbeitsaufgaben nicht erlaubt. Stellen Sie sicher, dass die Statusänderung zulässig ist.",
      },
    },
  },
  power_k: {
    actions_commands: {
      bulk_delete_work_items: "Arbeitselemente massenweise löschen",
    },
    contextual_actions: {
      work_item: {
        title: "Arbeitselement-Aktionen",
        indicator: "Arbeitselement",
        change_state: "Status ändern",
        change_priority: "Priorität ändern",
        change_assignees: "Zuweisen an",
        assign_to_me: "Mir zuweisen",
        unassign_from_me: "Zuweisung aufheben",
        change_estimate: "Schätzung ändern",
        add_to_cycle: "Zum Zyklus hinzufügen",
        add_to_modules: "Zu Modulen hinzufügen",
        add_labels: "Labels hinzufügen",
        subscribe: "Benachrichtigungen abonnieren",
        unsubscribe: "Benachrichtigungen abbestellen",
        delete: "Löschen",
        copy_id: "ID kopieren",
        copy_id_toast_success: "Arbeitselement-ID in die Zwischenablage kopiert.",
        copy_id_toast_error: "Fehler beim Kopieren der Arbeitselement-ID in die Zwischenablage.",
        copy_title: "Titel kopieren",
        copy_title_toast_success: "Arbeitselement-Titel in die Zwischenablage kopiert.",
        copy_title_toast_error: "Fehler beim Kopieren des Arbeitselement-Titels in die Zwischenablage.",
        copy_url: "URL kopieren",
        copy_url_toast_success: "Arbeitselement-URL in die Zwischenablage kopiert.",
        copy_url_toast_error: "Fehler beim Kopieren der Arbeitselement-URL in die Zwischenablage.",
      },
      cycle: {
        title: "Zyklus-Aktionen",
        indicator: "Zyklus",
        add_to_favorites: "Zu Favoriten hinzufügen",
        remove_from_favorites: "Aus Favoriten entfernen",
        copy_url: "URL kopieren",
        copy_url_toast_success: "Zyklus-URL in die Zwischenablage kopiert.",
        copy_url_toast_error: "Fehler beim Kopieren der Zyklus-URL in die Zwischenablage.",
      },
      module: {
        title: "Modul-Aktionen",
        indicator: "Modul",
        add_remove_members: "Mitglieder hinzufügen/entfernen",
        change_status: "Status ändern",
        add_to_favorites: "Zu Favoriten hinzufügen",
        remove_from_favorites: "Aus Favoriten entfernen",
        copy_url: "URL kopieren",
        copy_url_toast_success: "Modul-URL in die Zwischenablage kopiert.",
        copy_url_toast_error: "Fehler beim Kopieren der Modul-URL in die Zwischenablage.",
      },
      page: {
        title: "Seiten-Aktionen",
        indicator: "Seite",
        lock: "Sperren",
        unlock: "Entsperren",
        make_private: "Privat machen",
        make_public: "Öffentlich machen",
        archive: "Archivieren",
        restore: "Wiederherstellen",
        add_to_favorites: "Zu Favoriten hinzufügen",
        remove_from_favorites: "Aus Favoriten entfernen",
        copy_url: "URL kopieren",
        copy_url_toast_success: "Seiten-URL in die Zwischenablage kopiert.",
        copy_url_toast_error: "Fehler beim Kopieren der Seiten-URL in die Zwischenablage.",
      },
      initiative: {
        title: "Initiativen-Aktionen",
        indicator: "Initiative",
        change_state: "Status ändern",
        change_lead: "Leitung ändern",
        copy_url: "URL kopieren",
        copy_url_toast_success: "Initiativen-URL in die Zwischenablage kopiert.",
        copy_url_toast_error: "Fehler beim Kopieren der Initiativen-URL in die Zwischenablage.",
      },
    },
    creation_actions: {
      create_work_item: "Neues Arbeitselement",
      create_page: "Neue Seite",
      create_view: "Neue Ansicht",
      create_cycle: "Neuer Zyklus",
      create_module: "Neues Modul",
      create_project: "Neues Projekt",
      create_workspace: "Neuer Arbeitsbereich",
      create_teamspace: "Neuer Teamspace",
      create_teamspace_view: "Neue Teamspace-Ansicht",
      create_initiative: "Neue Initiative",
      create_workspace_dashboard: "Neues Dashboard",
      create_customer: "Neuer Kunde",
      create_project_automation: "Neue Automatisierung",
    },
    navigation_actions: {
      open_workspace: "Arbeitsbereich öffnen",
      nav_home: "Zur Startseite",
      nav_inbox: "Zum Posteingang",
      nav_your_work: "Zu Ihrer Arbeit",
      nav_account_settings: "Zu Kontoeinstellungen",
      open_project: "Projekt öffnen",
      nav_projects_list: "Zur Projektliste",
      nav_all_workspace_work_items: "Zu allen Arbeitselementen",
      nav_assigned_workspace_work_items: "Zu zugewiesenen Arbeitselementen",
      nav_created_workspace_work_items: "Zu erstellten Arbeitselementen",
      nav_subscribed_workspace_work_items: "Zu abonnierten Arbeitselementen",
      nav_workspace_analytics: "Zu Arbeitsbereich-Analysen",
      nav_workspace_drafts: "Zu Arbeitsbereich-Entwürfen",
      nav_workspace_archives: "Zu Arbeitsbereich-Archiven",
      open_workspace_setting: "Arbeitsbereichseinstellung öffnen",
      nav_workspace_settings: "Zu Arbeitsbereichseinstellungen",
      nav_project_work_items: "Zu Arbeitselementen",
      open_project_cycle: "Zyklus öffnen",
      nav_project_cycles: "Zu Zyklen",
      open_project_module: "Modul öffnen",
      nav_project_modules: "Zu Modulen",
      open_project_view: "Projektansicht öffnen",
      nav_project_views: "Zu Projektansichten",
      nav_project_pages: "Zu Seiten",
      nav_project_intake: "Zum Intake",
      nav_project_archives: "Zu Projektarchiven",
      open_project_setting: "Projekteinstellung öffnen",
      nav_project_settings: "Zu Projekteinstellungen",
      nav_workspace_active_cycle: "Zu allen aktiven Zyklen",
      open_teamspace: "Teamspace öffnen",
      nav_teamspaces_list: "Zu Teamspaces",
      open_initiative: "Initiative öffnen",
      nav_initiatives_list: "Zu Initiativen",
      open_customer: "Kundendatensatz öffnen",
      nav_customers_list: "Zu Kundendatensätzen",
      nav_workspace_dashboards: "Zu Dashboards",
      nav_project_overview: "Zur Projektübersicht",
      nav_project_epics: "Zu Epics",
    },
    account_actions: {
      sign_out: "Abmelden",
      workspace_invites: "Arbeitsbereich-Einladungen",
    },
    miscellaneous_actions: {
      toggle_app_sidebar: "App-Seitenleiste umschalten",
      copy_current_page_url: "Aktuelle Seiten-URL kopieren",
      copy_current_page_url_toast_success: "Aktuelle Seiten-URL in die Zwischenablage kopiert.",
      copy_current_page_url_toast_error: "Fehler beim Kopieren der aktuellen Seiten-URL in die Zwischenablage.",
      focus_top_nav_search: "Suchfeld fokussieren",
      open_ai_assistant: "AI-Assistent öffnen",
    },
    preferences_actions: {
      update_theme: "Erscheinungsbild ändern",
      update_timezone: "Zeitzone ändern",
      update_start_of_week: "Ersten Wochentag ändern",
      update_language: "Sprache der Benutzeroberfläche ändern",
      toast: {
        theme: {
          success: "Erscheinungsbild erfolgreich aktualisiert.",
          error: "Erscheinungsbild konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.",
        },
        timezone: {
          success: "Zeitzone erfolgreich aktualisiert.",
          error: "Zeitzone konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.",
        },
        generic: {
          success: "Einstellungen erfolgreich aktualisiert.",
          error: "Einstellungen konnten nicht aktualisiert werden. Bitte versuchen Sie es erneut.",
        },
      },
    },
    help_actions: {
      open_keyboard_shortcuts: "Tastenkombinationen öffnen",
      open_plane_documentation: "Plane-Dokumentation öffnen",
      join_forum: "Forum beitreten",
      report_bug: "Fehler melden",
      chat_with_us: "Chat mit uns",
    },
    page_placeholders: {
      default: "Befehl eingeben oder suchen",
      open_workspace: "Arbeitsbereich öffnen",
      open_project: "Projekt öffnen",
      open_workspace_setting: "Arbeitsbereichseinstellung öffnen",
      open_project_cycle: "Zyklus öffnen",
      open_project_module: "Modul öffnen",
      open_project_view: "Projektansicht öffnen",
      open_project_setting: "Projekteinstellung öffnen",
      update_work_item_state: "Status ändern",
      update_work_item_priority: "Priorität ändern",
      update_work_item_assignee: "Zuweisen an",
      update_work_item_estimate: "Schätzung ändern",
      update_work_item_cycle: "Zum Zyklus hinzufügen",
      update_work_item_module: "Zu Modulen hinzufügen",
      update_work_item_labels: "Labels hinzufügen",
      update_module_member: "Mitglieder ändern",
      update_module_status: "Status ändern",
      update_theme: "Erscheinungsbild ändern",
      update_timezone: "Zeitzone ändern",
      update_start_of_week: "Ersten Wochentag ändern",
      update_language: "Sprache ändern",
      open_teamspace: "Teamspace öffnen",
      open_initiative: "Initiative öffnen",
      open_customer: "Kundendatensatz öffnen",
      change_initiative_state: "Initiativenstatus ändern",
      change_initiative_lead: "Initiativenleitung ändern",
    },
    search_menu: {
      no_results: "Keine Ergebnisse gefunden",
      clear_search: "Suche löschen",
      go_to_advanced_search: "Zur erweiterten Suche",
    },
    footer: {
      workspace_level: "Arbeitsbereich-Ebene",
    },
    group_titles: {
      actions: "Aktionen",
      contextual: "Kontextbezogen",
      navigation: "Navigieren",
      create: "Erstellen",
      general: "Allgemein",
      settings: "Einstellungen",
      account: "Konto",
      miscellaneous: "Sonstiges",
      preferences: "Einstellungen",
      help: "Hilfe",
    },
  },
  work_item_types: {
    label: "Arbeitsaufgabentypen",
    label_lowercase: "arbeitsaufgabentypen",
    settings: {
      description:
        "Passen Sie eigene Eigenschaften an und fügen Sie sie hinzu, um sie an die Bedürfnisse Ihres Teams anzupassen.",
      properties: {
        title: "Benutzerdefinierte Eigenschaften",
        description: "Erstellen und passen Sie Eigenschaften an.",
        project: {
          add_button: {
            import_from_workspace: "Aus Arbeitsbereich importieren",
          },
        },
        tooltip:
          "Jeder Arbeitsaufgabentyp wird mit einem Standardsatz von Eigenschaften wie Titel, Beschreibung, Bearbeiter, Status, Priorität, Startdatum, Fälligkeitsdatum, Modul, Zyklus usw. geliefert. Sie können auch Ihre eigenen Eigenschaften anpassen und hinzufügen, um sie an die Bedürfnisse Ihres Teams anzupassen.",
        add_button: "Neue Eigenschaft hinzufügen",
        dropdown: {
          label: "Eigenschaftstyp",
          placeholder: "Typ auswählen",
        },
        property_type: {
          text: {
            label: "Text",
          },
          number: {
            label: "Zahl",
          },
          dropdown: {
            label: "Dropdown",
          },
          boolean: {
            label: "Boolean",
          },
          date: {
            label: "Datum",
          },
          member_picker: {
            label: "Mitgliederauswahl",
          },
          release_picker: {
            label: "Release-Auswahl",
          },
          formula: {
            label: "Formel",
          },
        },
        attributes: {
          label: "Attribute",
          text: {
            single_line: {
              label: "Einzeilig",
            },
            multi_line: {
              label: "Absatz",
            },
            readonly: {
              label: "Schreibgeschützt",
              header: "Schreibgeschützte Daten",
            },
            invalid_text_format: {
              label: "Ungültiges Textformat",
            },
          },
          number: {
            default: {
              placeholder: "Zahl hinzufügen",
            },
          },
          relation: {
            single_select: {
              label: "Einzelauswahl",
            },
            multi_select: {
              label: "Mehrfachauswahl",
            },
            no_default_value: {
              label: "Kein Standardwert",
            },
          },
          boolean: {
            label: "Wahr | Falsch",
            no_default: "Kein Standardwert",
          },
          option: {
            create_update: {
              label: "Optionen",
              form: {
                placeholder: "Option hinzufügen",
                errors: {
                  name: {
                    required: "Optionsname ist erforderlich.",
                    integrity: "Option mit gleichem Namen existiert bereits.",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "Option auswählen",
                multi: {
                  default: "Optionen auswählen",
                  variable: "{count} Optionen ausgewählt",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "Erfolg!",
              message: "Eigenschaft {name} erfolgreich erstellt.",
            },
            error: {
              title: "Fehler!",
              message: "Fehler beim Erstellen der Eigenschaft. Bitte versuchen Sie es erneut!",
            },
          },
          update: {
            success: {
              title: "Erfolg!",
              message: "Eigenschaft {name} erfolgreich aktualisiert.",
            },
            error: {
              title: "Fehler!",
              message: "Fehler beim Aktualisieren der Eigenschaft. Bitte versuchen Sie es erneut!",
            },
          },
          delete: {
            success: {
              title: "Erfolg!",
              message: "Eigenschaft {name} erfolgreich gelöscht.",
            },
            error: {
              title: "Fehler!",
              message: "Fehler beim Löschen der Eigenschaft. Bitte versuchen Sie es erneut!",
            },
          },
          enable_disable: {
            loading: "{action} der Eigenschaft {name}",
            success: {
              title: "Erfolg!",
              message: "Eigenschaft {name} erfolgreich {action}.",
            },
            error: {
              title: "Fehler!",
              message: "Fehler beim {action} der Eigenschaft. Bitte versuchen Sie es erneut!",
            },
          },
        },
        create_update: {
          title: {
            create: "Neue benutzerdefinierte Eigenschaft erstellen",
            update: "Benutzerdefinierte Eigenschaft aktualisieren",
          },
          form: {
            display_name: {
              placeholder: "Titel",
            },
            description: {
              placeholder: "Beschreibung",
            },
          },
          errors: {
            name: {
              required: "Sie müssen Ihre Eigenschaft benennen.",
              max_length: "Eigenschaftsname sollte 255 Zeichen nicht überschreiten.",
            },
            property_type: {
              required: "Sie müssen einen Eigenschaftstyp auswählen.",
            },
            options: {
              required: "Sie müssen mindestens eine Option hinzufügen.",
            },
            formula: {
              required: "Formelausdruck ist erforderlich.",
              invalid: "Ungültige Formel: {error}",
              circular_reference:
                "Zirkuläre Referenz erkannt. Eine Formel kann nicht direkt oder indirekt auf sich selbst verweisen.",
              invalid_reference: "Formel verweist auf eine nicht existierende Eigenschaft.",
            },
          },
        },
        formula: {
          field_label: "Formelfeld",
          tooltip: "Geben Sie eine Formel mit der Syntax '{'Feldname'}' ein. Unterstützt +, -, *, / und & Operatoren.",
          placeholder: "Formel eingeben",
          test_button: "Test",
          validating: "Wird überprüft",
          validation_success: "Formel ist gültig! Gibt {resultType} zurück",
          validation_success_with_refs: "Formel ist gültig! Gibt {resultType} zurück ({count} Feld(er) referenziert)",
          error: {
            empty: "Bitte geben Sie eine Formel ein",
            missing_context: "Fehlender Workspace-, Projekt- oder Arbeitsaufgabentyp-Kontext",
            validation_failed: "Validierung fehlgeschlagen",
          },
          picker: {
            no_match: "Keine passenden Eigenschaften",
            no_available: "Keine verfügbaren Eigenschaften",
          },
        },
        enable_disable: {
          label: "Aktiv",
          tooltip: {
            disabled: "Klicken zum Deaktivieren",
            enabled: "Klicken zum Aktivieren",
          },
        },
        delete_confirmation: {
          title: "Diese Eigenschaft löschen",
          description: "Das Löschen von Eigenschaften kann zum Verlust vorhandener Daten führen.",
          secondary_description: "Möchten Sie die Eigenschaft stattdessen deaktivieren?",
          primary_button: "{action}, löschen",
          secondary_button: "Ja, deaktivieren",
        },
        mandate_confirmation: {
          label: "Pflichtfeld",
          content:
            "Es scheint eine Standardoption für diese Eigenschaft zu geben. Wenn Sie die Eigenschaft als Pflichtfeld festlegen, wird der Standardwert entfernt und die Benutzer müssen einen Wert ihrer Wahl hinzufügen.",
          tooltip: {
            disabled: "Dieser Eigenschaftstyp kann nicht als Pflichtfeld festgelegt werden",
            enabled: "Deaktivieren, um das Feld als optional zu markieren",
            checked: "Aktivieren, um das Feld als Pflichtfeld zu markieren",
          },
        },
        empty_state: {
          title: "Benutzerdefinierte Eigenschaften hinzufügen",
          description: "Neue Eigenschaften, die Sie für diesen Arbeitsaufgabentyp hinzufügen, werden hier angezeigt.",
        },
      },
      item_delete_confirmation: {
        title: "Diesen Typ löschen",
        description: "Das Löschen von Typen kann zum Verlust vorhandener Daten führen.",
        primary_button: "Ja, löschen",
        toast: {
          success: {
            title: "Erfolg!",
            message: "Arbeitselementtyp wurde erfolgreich gelöscht.",
          },
          error: {
            title: "Fehler!",
            message: "Löschen des Arbeitselementtyps fehlgeschlagen. Bitte versuchen Sie es erneut!",
          },
        },
        errors: {
          cannot_delete_default_work_item_type: "Der Standard-Arbeitselementtyp kann nicht gelöscht werden",
          cannot_delete_work_item_type_with_associated_work_items:
            "Arbeitselementtyp mit zugeordneten Arbeitselementen kann nicht gelöscht werden",
        },
        can_disable_warning: "Möchten Sie stattdessen den Typ deaktivieren?",
      },
      cant_delete_default_message:
        "Dieser Arbeitselementtyp kann nicht gelöscht werden, da er als Standard für dieses Projekt festgelegt ist.",
      set_as_default: "Als Standard festlegen",
      cant_set_default_inactive_message: "Aktivieren Sie diesen Typ, bevor Sie ihn als Standard festlegen",
      set_default_confirmation: {
        title: "Als Standard-Arbeitselementtyp festlegen",
        description:
          "Wenn Sie {name} als Standard festlegen, wird er in alle Projekte in diesem Arbeitsbereich importiert. Alle neuen Arbeitselemente verwenden dann standardmäßig diesen Typ.",
        confirm_button: "Als Standard festlegen",
      },
      types: {
        title: "Typen",
        description: "Erstellen und passen Sie Arbeitselementtypen mit Eigenschaften an.",
        sort_options: {
          project_count: "Anzahl der zugehörigen Projekte",
        },
        filter_options: {
          show_active: "Aktive anzeigen",
          show_inactive: "Inaktive anzeigen",
        },
        project: {
          add_button: {
            create_new: "Neu erstellen",
            import_from_workspace: "Aus Arbeitsbereich importieren",
          },
        },
      },
      linked_properties: {
        title: "Benutzerdefinierte Eigenschaften",
        add_button: "Eigenschaften hinzufügen",
        modal: {
          title: "Eigenschaften hinzufügen",
          empty: {
            title: "Keine Eigenschaften verfügbar",
            description: "Alle Eigenschaften wurden bereits mit diesem Typ verknüpft.",
          },
        },
        unlink_confirmation: {
          title: "Eigenschaft trennen",
          description:
            "Das Trennen dieser Eigenschaft löscht dauerhaft alle ihre Werte in jedem Arbeitselement dieses Typs. Diese Aktion kann nicht rückgängig gemacht werden.",
          input_label: "Geben Sie",
          input_label_suffix: "zum Fortfahren ein:",
          confirm: "Eigenschaft trennen",
          loading: "Wird getrennt",
        },
      },
    },
    create: {
      title: "Arbeitsaufgabentyp erstellen",
      button: "Arbeitsaufgabentyp hinzufügen",
      toast: {
        success: {
          title: "Erfolg!",
          message: "Arbeitsaufgabentyp erfolgreich erstellt.",
        },
        error: {
          title: "Fehler!",
          message: {
            default: "Arbeitselementtyp konnte nicht erstellt werden. Bitte versuchen Sie es erneut!",
            conflict: "Der Typ {name} existiert bereits. Bitte wählen Sie einen anderen Namen.",
          },
        },
      },
    },
    update: {
      title: "Arbeitsaufgabentyp aktualisieren",
      button: "Arbeitsaufgabentyp aktualisieren",
      toast: {
        success: {
          title: "Erfolg!",
          message: "Arbeitsaufgabentyp {name} erfolgreich aktualisiert.",
        },
        error: {
          title: "Fehler!",
          message: {
            default: "Arbeitselementtyp konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut!",
            conflict: "Der Typ {name} existiert bereits. Bitte wählen Sie einen anderen Namen.",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "Geben Sie diesem Arbeitsaufgabentyp einen eindeutigen Namen",
        },
        description: {
          placeholder:
            "Beschreiben Sie, wofür dieser Arbeitsaufgabentyp gedacht ist und wann er verwendet werden soll.",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{action} des Arbeitsaufgabentyps {name}",
        success: {
          title: "Erfolg!",
          message: "Arbeitsaufgabentyp {name} erfolgreich {action}.",
        },
        error: {
          title: "Fehler!",
          message: "Fehler beim {action} des Arbeitsaufgabentyps. Bitte versuchen Sie es erneut!",
        },
      },
      tooltip: "Klicken zum {action}",
    },
    change_confirmation: {
      title: "Arbeitsaufgabentyp ändern?",
      description:
        "Das Ändern des Arbeitsaufgabentyps kann zum Verlust von benutzerdefinierten Eigenschaftswerten führen, die spezifisch für den aktuellen Typ sind. Diese Aktion kann nicht rückgängig gemacht werden.",
      button: {
        loading: "Wird geändert",
        default: "Typ ändern",
      },
    },
    empty_state: {
      enable: {
        title: "Arbeitsaufgabentypen aktivieren",
        description:
          "Gestalten Sie Arbeitsaufgaben an Ihre Arbeit mit Arbeitsaufgabentypen an. Passen Sie sie mit Icons, Hintergründen und Eigenschaften an und konfigurieren Sie sie für dieses Projekt.",
        primary_button: {
          text: "Aktivieren",
        },
        confirmation: {
          title: "Einmal aktiviert, können Arbeitsaufgabentypen nicht deaktiviert werden.",
          description:
            "Planes Arbeitsaufgabe wird zum Standard-Arbeitsaufgabentyp für dieses Projekt und wird mit seinem Icon und Hintergrund in diesem Projekt angezeigt.",
          button: {
            default: "Aktivieren",
            loading: "Einrichten",
          },
        },
      },
      get_pro: {
        title: "Holen Sie sich Pro, um Arbeitsaufgabentypen zu aktivieren.",
        description:
          "Gestalten Sie Arbeitsaufgaben an Ihre Arbeit mit Arbeitsaufgabentypen an. Passen Sie sie mit Icons, Hintergründen und Eigenschaften an und konfigurieren Sie sie für dieses Projekt.",
        primary_button: {
          text: "Pro holen",
        },
      },
      upgrade: {
        title: "Upgrade durchführen, um Arbeitsaufgabentypen zu aktivieren.",
        description:
          "Gestalten Sie Arbeitsaufgaben an Ihre Arbeit mit Arbeitsaufgabentypen an. Passen Sie sie mit Icons, Hintergründen und Eigenschaften an und konfigurieren Sie sie für dieses Projekt.",
        primary_button: {
          text: "Upgrade",
        },
      },
    },
  },
  importers: {
    teamspace: "Teamspace",
    destination: "Ziel",
    imports: "Importe",
    logo: "Logo",
    import_message: "Importieren Sie Ihre {serviceName}-Daten in Plane-Projekte.",
    deactivate: "Deaktivieren",
    deactivating: "Deaktiviere",
    migrating: "Migriere",
    migrations: "Migrationen",
    refreshing: "Aktualisiere",
    import: "Importieren",
    serial_number: "Nr.",
    project: "Projekt",
    workspace: "Workspace",
    status: "Status",
    summary: "Zusammenfassung",
    total_batches: "Gesamt-Batches",
    imported_batches: "Importierte Batches",
    re_run: "Neu starten",
    cancel: "Abbrechen",
    start_time: "Startzeit",
    no_jobs_found: "Keine Jobs gefunden",
    no_project_imports: "Sie haben noch keine {serviceName}-Projekte importiert.",
    cancel_import_job: "Import-Job abbrechen",
    cancel_import_job_confirmation:
      "Sind Sie sicher, dass Sie diesen Import-Job abbrechen möchten? Dies wird den Importvorgang für dieses Projekt stoppen.",
    re_run_import_job: "Import-Job neu starten",
    re_run_import_job_confirmation:
      "Sind Sie sicher, dass Sie diesen Import-Job neu starten möchten? Dies wird den Importvorgang für dieses Projekt neu starten.",
    upload_csv_file: "Laden Sie eine CSV-Datei hoch, um Benutzerdaten zu importieren.",
    connect_importer: "{serviceName} verbinden",
    migration_assistant: "Migrations-Assistent",
    migration_assistant_description:
      "Migrieren Sie Ihre {serviceName}-Projekte nahtlos zu Plane mit unserem leistungsstarken Assistenten.",
    token_helper: "Sie erhalten dies von Ihrem",
    personal_access_token: "Persönlichen Zugriffstoken",
    source_token_expired: "Token abgelaufen",
    source_token_expired_description:
      "Das bereitgestellte Token ist abgelaufen. Bitte deaktivieren Sie und verbinden Sie mit neuen Anmeldedaten.",
    user_email: "Benutzer-E-Mail",
    select_state: "Status auswählen",
    select_service_project: "{serviceName}-Projekt auswählen",
    loading_service_projects: "Lade {serviceName}-Projekte",
    select_service_workspace: "{serviceName}-Workspace auswählen",
    loading_service_workspaces: "Lade {serviceName}-Workspaces",
    select_priority: "Priorität auswählen",
    select_service_team: "{serviceName}-Team auswählen",
    add_seat_msg_free_trial:
      "Sie versuchen, {additionalUserCount} nicht registrierte Benutzer zu importieren und Sie haben nur {currentWorkspaceSubscriptionAvailableSeats} Plätze in Ihrem aktuellen Plan verfügbar. Um mit dem Import fortzufahren, führen Sie jetzt ein Upgrade durch.",
    add_seat_msg_paid:
      "Sie versuchen, {additionalUserCount} nicht registrierte Benutzer zu importieren und Sie haben nur {currentWorkspaceSubscriptionAvailableSeats} Plätze in Ihrem aktuellen Plan verfügbar. Um mit dem Import fortzufahren, kaufen Sie mindestens {extraSeatRequired} zusätzliche Plätze.",
    skip_user_import_title: "Import von Benutzerdaten überspringen",
    skip_user_import_description:
      "Das Überspringen des Benutzerimports führt dazu, dass Arbeitsaufgaben, Kommentare und andere Daten von {serviceName} vom Benutzer erstellt werden, der die Migration in Plane durchführt. Sie können später immer noch manuell Benutzer hinzufügen.",
    invalid_pat: "Ungültiger persönlicher Zugriffstoken",
  },
  integrations: {
    integrations: "Integrationen",
    loading: "Lade",
    unauthorized: "Sie sind nicht berechtigt, diese Seite anzuzeigen.",
    configure: "Konfigurieren",
    not_enabled: "{name} ist für diesen Workspace nicht aktiviert.",
    not_configured: "Nicht konfiguriert",
    disconnect_personal_account: "Persönliches {providerName}-Konto trennen",
    not_configured_message_admin:
      "{name}-Integration ist nicht konfiguriert. Bitte kontaktieren Sie Ihren Instanz-Administrator, um sie zu konfigurieren.",
    not_configured_message_support:
      "{name}-Integration ist nicht konfiguriert. Bitte kontaktieren Sie den Support, um sie zu konfigurieren.",
    external_api_unreachable: "Zugriff auf die externe API nicht möglich. Bitte versuchen Sie es später erneut.",
    error_fetching_supported_integrations:
      "Unterstützte Integrationen können nicht abgerufen werden. Bitte versuchen Sie es später erneut.",
    back_to_integrations: "Zurück zu Integrationen",
    select_state: "Status auswählen",
    set_state: "Status setzen",
    choose_project: "Projekt auswählen...",
    skip_backward_state_movement: "Verhindern, dass Issues durch PR-Updates in einen früheren Status verschoben werden",
  },
  github_integration: {
    name: "GitHub",
    description: "Verbinden und synchronisieren Sie Ihre GitHub-Arbeitsaufgaben mit Plane",
    connect_org: "Organisation verbinden",
    connect_org_description: "Verbinden Sie Ihre GitHub-Organisation mit Plane",
    processing: "Wird verarbeitet",
    org_added_desc: "GitHub-Organisation hinzugefügt von und Zeit",
    connection_fetch_error: "Fehler beim Abrufen der Verbindungsdetails vom Server",
    personal_account_connected: "Persönliches Konto verbunden",
    personal_account_connected_description: "Ihr persönliches GitHub-Konto ist jetzt mit Plane verbunden",
    connect_personal_account: "Persönliches Konto verbinden",
    connect_personal_account_description: "Verbinden Sie Ihr persönliches GitHub-Konto mit Plane.",
    repo_mapping: "Repository-Zuordnung",
    repo_mapping_description: "Ordnen Sie Ihre GitHub-Repositories Plane-Projekten zu.",
    project_issue_sync: "Projekt-Issue-Synchronisierung",
    project_issue_sync_description: "Synchronisieren Sie Issues von GitHub mit Ihrem Plane-Projekt",
    project_issue_sync_empty_state: "Zugeordnete Projekt-Issue-Synchronisierungen werden hier angezeigt",
    configure_project_issue_sync_state: "Issue-Synchronisierungsstatus konfigurieren",
    select_issue_sync_direction: "Richtung der Issue-Synchronisierung auswählen",
    allow_bidirectional_sync:
      "Bidirektional – Synchronisieren Sie Issues und Kommentare in beide Richtungen zwischen GitHub und Plane",
    allow_unidirectional_sync: "Unidirektional – Synchronisieren Sie Issues und Kommentare nur von GitHub zu Plane",
    allow_unidirectional_sync_warning:
      "Daten aus GitHub Issue ersetzen Daten im verknüpften Plane-Arbeitselement (GitHub → Plane nur)",
    remove_project_issue_sync: "Diese Projekt-Issue-Synchronisierung entfernen",
    remove_project_issue_sync_confirmation:
      "Sind Sie sicher, dass Sie diese Projekt-Issue-Synchronisierung entfernen möchten?",
    add_pr_state_mapping: "Pull-Request-Status-Mapping für Plane-Projekt hinzufügen",
    edit_pr_state_mapping: "Pull-Request-Status-Mapping für Plane-Projekt bearbeiten",
    pr_state_mapping: "Pull-Request-Status-Mapping",
    pr_state_mapping_description: "Ordnen Sie GitHub-Pull-Request-Status Ihrem Plane-Projekt zu",
    pr_state_mapping_empty_state: "Zugeordnete PR-Status werden hier angezeigt",
    remove_pr_state_mapping: "Dieses Pull-Request-Status-Mapping entfernen",
    remove_pr_state_mapping_confirmation:
      "Sind Sie sicher, dass Sie dieses Pull-Request-Status-Mapping entfernen möchten?",
    issue_sync_message: "Arbeitsaufgaben werden mit {project} synchronisiert",
    link: "GitHub-Repository mit einem Plane-Projekt verknüpfen",
    pull_request_automation: "Pull-Request-Automatisierung",
    pull_request_automation_description:
      "Konfigurieren Sie das Pull-Request-Status-Mapping von GitHub zu Ihrem Plane-Projekt",
    DRAFT_MR_OPENED: "Entwurf geöffnet",
    MR_OPENED: "Geöffnet",
    MR_READY_FOR_MERGE: "Bereit zum Zusammenführen",
    MR_REVIEW_REQUESTED: "Review angefordert",
    MR_MERGED: "Zusammengeführt",
    MR_CLOSED: "Geschlossen",
    ISSUE_OPEN: "Issue geöffnet",
    ISSUE_CLOSED: "Issue geschlossen",
    save: "Speichern",
    start_sync: "Synchronisierung starten",
    choose_repository: "Repository auswählen...",
  },
  gitlab_integration: {
    name: "Gitlab",
    description: "Verbinden und synchronisieren Sie Ihre Gitlab-Merge-Requests mit Plane.",
    connection_fetch_error: "Fehler beim Abrufen der Verbindungsdetails vom Server",
    connect_org: "Organisation verbinden",
    connect_org_description: "Verbinden Sie Ihre Gitlab-Organisation mit Plane.",
    project_connections: "Gitlab-Projektverbindungen",
    project_connections_description: "Synchronisieren Sie Merge-Requests von Gitlab zu Plane-Projekten.",
    plane_project_connection: "Plane-Projektverbindung",
    plane_project_connection_description:
      "Konfigurieren Sie die Pull-Request-Status-Zuordnung von Gitlab zu Plane-Projekten",
    remove_connection: "Verbindung entfernen",
    remove_connection_confirmation: "Sind Sie sicher, dass Sie diese Verbindung entfernen möchten?",
    link: "Gitlab-Repository mit Plane-Projekt verknüpfen",
    pull_request_automation: "Pull-Request-Automatisierung",
    pull_request_automation_description: "Konfigurieren Sie die Pull-Request-Status-Zuordnung von Gitlab zu Plane",
    DRAFT_MR_OPENED: "Bei Erstellung eines Entwurf-MRs, setze den Status auf",
    MR_OPENED: "Bei MR-Erstellung, setze den Status auf",
    MR_REVIEW_REQUESTED: "Bei MR-Review-Anfrage, setze den Status auf",
    MR_READY_FOR_MERGE: "Wenn MR bereit zum Zusammenführen ist, setze den Status auf",
    MR_MERGED: "Bei MR-Zusammenführung, setze den Status auf",
    MR_CLOSED: "Bei MR-Schließung, setze den Status auf",
    integration_enabled_text: "Mit aktivierter Gitlab-Integration können Sie Arbeitsaufgaben-Workflows automatisieren",
    choose_entity: "Element auswählen",
    choose_project: "Projekt auswählen",
    link_plane_project: "Plane-Projekt verknüpfen",
    project_issue_sync: "Projekt-Issue-Synchronisierung",
    project_issue_sync_description: "Synchronisieren Sie Issues von Gitlab zu Ihrem Plane-Projekt",
    project_issue_sync_empty_state: "Zugeordnete Projekt-Issue-Synchronisierung wird hier angezeigt",
    configure_project_issue_sync_state: "Issue-Synchronisierungsstatus konfigurieren",
    select_issue_sync_direction: "Issue-Synchronisierungsrichtung auswählen",
    allow_bidirectional_sync:
      "Bidirektional - Issues und Kommentare in beide Richtungen zwischen Gitlab und Plane synchronisieren",
    allow_unidirectional_sync: "Unidirektional - Issues und Kommentare nur von Gitlab zu Plane synchronisieren",
    allow_unidirectional_sync_warning:
      "Daten vom Gitlab Issue ersetzen Daten im verknüpften Plane-Arbeitselement (nur Gitlab → Plane)",
    remove_project_issue_sync: "Diese Projekt-Issue-Synchronisierung entfernen",
    remove_project_issue_sync_confirmation:
      "Sind Sie sicher, dass Sie diese Projekt-Issue-Synchronisierung entfernen möchten?",
    ISSUE_OPEN: "Issue Offen",
    ISSUE_CLOSED: "Issue Geschlossen",
    save: "Speichern",
    start_sync: "Synchronisierung starten",
    choose_repository: "Repository auswählen...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Verbinden und synchronisieren Sie Ihre Gitlab Enterprise-Instanz mit Plane.",
    app_form_title: "Gitlab Enterprise-Konfiguration",
    app_form_description: "Konfigurieren Sie Gitlab Enterprise für die Verbindung mit Plane.",
    base_url_title: "Basis-URL",
    base_url_description: "Die Basis-URL Ihrer Gitlab Enterprise-Instanz.",
    base_url_placeholder: 'z.B. "https://glab.plane.town"',
    base_url_error: "Basis-URL ist erforderlich",
    invalid_base_url_error: "Ungültige Basis-URL",
    client_id_title: "App-ID",
    client_id_description: "Die App-ID der App, die Sie in Ihrer Gitlab Enterprise-Instanz erstellt haben.",
    client_id_placeholder: 'z.B. "7cd732xxxxxxxxxxxxxx"',
    client_id_error: "App-ID ist erforderlich",
    client_secret_title: "Client Secret",
    client_secret_description: "Das Client Secret der App, die Sie in Ihrer Gitlab Enterprise-Instanz erstellt haben.",
    client_secret_placeholder: 'z.B. "gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "Client Secret ist erforderlich",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description:
      "Ein zufälliges Webhook Secret, das zur Überprüfung des Webhooks von der Gitlab Enterprise-Instanz verwendet wird.",
    webhook_secret_placeholder: 'z.B. "webhook1234567890"',
    webhook_secret_error: "Webhook Secret ist erforderlich",
    connect_app: "App verbinden",
  },
  bitbucket_dc_integration: {
    name: "Bitbucket Data Center",
    description: "Verbinden und synchronisieren Sie Ihre Bitbucket Data Center-Repositories mit Plane.",
  },
  slack_integration: {
    name: "Slack",
    description: "Verbinden Sie Ihren Slack-Workspace mit Plane.",
    connect_personal_account: "Verbinden Sie Ihr persönliches Slack-Konto mit Plane.",
    personal_account_connected: "Ihr persönliches {providerName}-Konto ist jetzt mit Plane verbunden.",
    link_personal_account: "Verknüpfen Sie Ihr persönliches {providerName}-Konto mit Plane.",
    connected_slack_workspaces: "Verbundene Slack-Workspaces",
    connected_on: "Verbunden am {date}",
    disconnect_workspace: "{name}-Workspace trennen",
    alerts: {
      dm_alerts: {
        title:
          "Erhalten Sie Benachrichtigungen in Slack-Direktnachrichten für wichtige Updates, Erinnerungen und Benachrichtigungen nur für Sie.",
      },
    },
    project_updates: {
      title: "Projekt-Updates",
      description: "Konfigurieren Sie Projekt-Update-Benachrichtigungen für Ihre Projekte",
      add_new_project_update: "Neue Projekt-Update-Benachrichtigung hinzufügen",
      project_updates_empty_state: "Mit Slack-Kanälen verbundene Projekte werden hier angezeigt.",
      project_updates_form: {
        title: "Projekt-Updates konfigurieren",
        description: "Erhalten Sie Projekt-Update-Benachrichtigungen in Slack, wenn Arbeitselemente erstellt werden",
        failed_to_load_channels: "Fehler beim Laden von Kanälen aus Slack",
        project_dropdown: {
          placeholder: "Wählen Sie ein Projekt",
          label: "Plane-Projekt",
          no_projects: "Keine Projekte verfügbar",
        },
        channel_dropdown: {
          label: "Slack-Kanal",
          placeholder: "Wählen Sie einen Kanal",
          no_channels: "Keine Kanäle verfügbar",
        },
        all_projects_connected: "Alle Projekte sind bereits mit Slack-Kanälen verbunden.",
        all_channels_connected: "Alle Slack-Kanäle sind bereits mit Projekten verbunden.",
        project_connection_success: "Projektverbindung erfolgreich erstellt",
        project_connection_updated: "Projektverbindung erfolgreich aktualisiert",
        project_connection_deleted: "Projektverbindung erfolgreich gelöscht",
        failed_delete_project_connection: "Fehler beim Löschen der Projektverbindung",
        failed_create_project_connection: "Fehler beim Erstellen der Projektverbindung",
        failed_upserting_project_connection: "Fehler beim Aktualisieren der Projektverbindung",
        failed_loading_project_connections:
          "Wir konnten Ihre Projektverbindungen nicht laden. Dies könnte auf ein Netzwerkproblem oder ein Problem mit der Integration zurückzuführen sein.",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "Verbinden Sie Ihren Sentry-Arbeitsbereich mit Plane.",
    connected_sentry_workspaces: "Verbundene Sentry-Arbeitsbereiche",
    connected_on: "Verbunden am {date}",
    disconnect_workspace: "Arbeitsbereich {name} trennen",
    state_mapping: {
      title: "Status-Zuordnung",
      description:
        "Ordnen Sie Sentry-Incident-Status Ihren Projekt-Status zu. Konfigurieren Sie, welche Status verwendet werden sollen, wenn ein Sentry-Incident gelöst oder ungelöst ist.",
      add_new_state_mapping: "Neue Status-Zuordnung hinzufügen",
      empty_state:
        "Keine Status-Zuordnungen konfiguriert. Erstellen Sie Ihre erste Zuordnung, um Sentry-Incident-Status mit Ihren Projekt-Status zu synchronisieren.",
      failed_loading_state_mappings:
        "Wir konnten Ihre Status-Zuordnungen nicht laden. Dies könnte an einem Netzwerkproblem oder einem Problem mit der Integration liegen.",
      loading_project_states: "Projekt-Status werden geladen...",
      error_loading_states: "Fehler beim Laden der Status",
      no_states_available: "Keine Status verfügbar",
      no_permission_states: "Sie haben keine Berechtigung, auf Status für dieses Projekt zuzugreifen",
      states_not_found: "Projekt-Status nicht gefunden",
      server_error_states: "Serverfehler beim Laden der Status",
    },
  },
  oauth_bridge_integration: {
    name: "OAuth Bridge",
    description: "Externe IdP-Token für API-Zugriff validieren.",
    header_description:
      "Validieren Sie extern ausgestellte OIDC/JWT-Token von Ihrem IdP (Azure AD, Okta usw.) für den Plane-API-Zugriff.",
    connected: "Verbunden",
    connect: "Verbinden",
    uninstall: "Deinstallieren",
    uninstalling: "Wird deinstalliert...",
    install_success: "OAuth Bridge erfolgreich installiert.",
    install_error: "OAuth Bridge konnte nicht installiert werden.",
    uninstall_success: "OAuth Bridge deinstalliert.",
    uninstall_error: "OAuth Bridge konnte nicht deinstalliert werden.",
    token_providers: "Token-Anbieter",
    token_providers_description: "Konfigurieren Sie externe IdPs, deren JWTs als API-Anmeldedaten akzeptiert werden.",
    add_provider: "Anbieter hinzufügen",
    edit_provider: "Anbieter bearbeiten",
    enabled: "Aktiviert",
    disabled: "Deaktiviert",
    test: "Testen",
    no_providers_title: "Keine Anbieter konfiguriert.",
    no_providers_description: "Fügen Sie einen IdP hinzu, um die externe Token-Authentifizierung zu aktivieren.",
    provider_updated: "Anbieter aktualisiert.",
    provider_added: "Anbieter hinzugefügt.",
    provider_save_error: "Anbieter konnte nicht gespeichert werden.",
    provider_deleted: "Anbieter gelöscht.",
    provider_delete_error: "Anbieter konnte nicht gelöscht werden.",
    provider_update_error: "Anbieter konnte nicht aktualisiert werden.",
    jwks_reachable: "JWKS erreichbar",
    jwks_unreachable: "JWKS nicht erreichbar",
    jwks_test_error: "JWKS konnte nicht von der konfigurierten URL abgerufen werden.",
    provider_form: {
      name_label: "Name",
      name_placeholder: "z.B. Azure AD Produktion",
      name_description: "Lesbarer Name für diesen Identitätsanbieter",
      name_required: "Name ist erforderlich.",
      issuer_label: "Aussteller",
      issuer_placeholder: "https://login.microsoftonline.com/tenant-id/v2.0",
      issuer_description: "Erwarteter iss-Claim-Wert im JWT",
      issuer_required: "Aussteller ist erforderlich.",
      jwks_url_label: "JWKS-URL",
      jwks_url_placeholder: "https://login.microsoftonline.com/tenant-id/discovery/v2.0/keys",
      jwks_url_description: "HTTPS-Endpunkt, der das JSON Web Key Set des Anbieters bereitstellt",
      jwks_url_required: "JWKS-URL ist erforderlich.",
      jwks_url_https: "JWKS-URL muss HTTPS verwenden.",
      audience_label: "Zielgruppe",
      audience_placeholder: "api://my-app-id",
      audience_description: "Erwartete(r) aud-Claim(s) im JWT, kommagetrennt.",
      user_claim_label: "Benutzer-Claim",
      user_claim_placeholder: "email",
      user_claim_description: "JWT-Claim mit der E-Mail-Adresse des Benutzers",
      user_claim_required: "Benutzer-Claim ist erforderlich.",
      allowed_algorithms_label: "Erlaubte Signaturalgorithmen",
      allowed_algorithms_description: "Asymmetrische Algorithmen für die JWT-Signaturprüfung",
      allowed_algorithms_required: "Mindestens ein Algorithmus ist erforderlich.",
      select_algorithms: "Algorithmen auswählen",
      jwks_cache_ttl_label: "JWKS-Cache-TTL (Sekunden)",
      jwks_cache_ttl_description:
        "Wie lange die JWKS-Schlüssel des Anbieters gecacht werden (mindestens 60s, Standard 24 Stunden)",
      jwks_cache_ttl_min: "Cache-TTL muss mindestens 60 Sekunden betragen.",
      rate_limit_label: "Ratenlimit",
      rate_limit_placeholder: "120/minute",
      rate_limit_description:
        "Anfragedrosselung als Anzahl/Zeitraum (z.B. 120/minute). Leer lassen für das Standard-Ratenlimit.",
      enable_provider: "Diesen Anbieter aktivieren",
      saving: "Wird gespeichert...",
      update: "Aktualisieren",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "Verbinden und synchronisieren Sie Ihre GitHub Enterprise-Organisation mit Plane.",
    app_form_title: "GitHub Enterprise-Konfiguration",
    app_form_description: "Konfigurieren Sie GitHub Enterprise, um mit Plane zu verbinden.",
    app_id_title: "App-ID",
    app_id_description: "Die ID der App, die Sie in Ihrer GitHub Enterprise-Organisation erstellt haben.",
    app_id_placeholder: 'z.B., "1234567890"',
    app_id_error: "App ID ist erforderlich",
    app_name_title: "App-Slug",
    app_name_description: "Der Slug der App, die Sie in Ihrer GitHub Enterprise-Organisation erstellt haben.",
    app_name_error: "App-Slug ist erforderlich",
    app_name_placeholder: 'z.B., "plane-github-enterprise"',
    base_url_title: "Basis-URL",
    base_url_description: "Die Basis-URL Ihrer GitHub Enterprise-Organisation.",
    base_url_placeholder: 'z.B., "https://gh.plane.town"',
    base_url_error: "Base URL ist erforderlich",
    invalid_base_url_error: "Ungültige Basis-URL",
    client_id_title: "Client-ID",
    client_id_description: "Die Client-ID der App, die Sie in Ihrer GitHub Enterprise-Organisation erstellt haben.",
    client_id_placeholder: 'z.B., "1234567890"',
    client_id_error: "Client-ID ist erforderlich",
    client_secret_title: "Client-Secret",
    client_secret_description:
      "Das Client-Secret der App, die Sie in Ihrer GitHub Enterprise-Organisation erstellt haben.",
    client_secret_placeholder: 'z.B., "1234567890"',
    client_secret_error: "Client-Secret ist erforderlich",
    webhook_secret_title: "Webhook-Secret",
    webhook_secret_description:
      "Das Webhook-Secret der App, die Sie in Ihrer GitHub Enterprise-Organisation erstellt haben.",
    webhook_secret_placeholder: 'z.B., "1234567890"',
    webhook_secret_error: "Webhook-Secret ist erforderlich",
    private_key_title: "Privater Schlüssel (Base64-kodiert)",
    private_key_description:
      "Base64-kodierter privater Schlüssel der App, die Sie in Ihrer GitHub Enterprise-Organisation erstellt haben.",
    private_key_placeholder: 'z.B., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Privater Schlüssel ist erforderlich",
    connect_app: "App verbinden",
  },
  file_upload: {
    upload_text: "Klicken Sie hier, um Datei hochzuladen",
    drag_drop_text: "Drag and Drop",
    processing: "Verarbeite",
    invalid_file_type: "Ungültiger Dateityp",
    missing_fields: "Fehlende Felder",
    success: "{fileName} hochgeladen!",
  },
  silo_errors: {
    cannot_create_multiple_connections:
      "Sie haben Ihre Organisation bereits mit einem Arbeitsbereich verbunden. Bitte trennen Sie die bestehende Verbindung, bevor Sie eine neue herstellen.",
    invalid_query_params:
      "Die angegebenen Abfrageparameter sind ungültig oder enthalten nicht die erforderlichen Felder",
    invalid_installation_account: "Das angegebene Installationskonto ist nicht gültig",
    generic_error: "Bei der Verarbeitung Ihrer Anfrage ist ein unerwarteter Fehler aufgetreten",
    connection_not_found: "Die angeforderte Verbindung konnte nicht gefunden werden",
    multiple_connections_found: "Es wurden mehrere Verbindungen gefunden, obwohl nur eine erwartet wurde",
    installation_not_found: "Die angeforderte Installation konnte nicht gefunden werden",
    user_not_found: "Der angeforderte Benutzer konnte nicht gefunden werden",
    error_fetching_token: "Fehler beim Abrufen des Authentifizierungstokens",
    invalid_app_credentials: "Die bereitgestellten App-Anmeldeinformationen sind ungültig",
    invalid_app_installation_id: "Fehler beim Installieren der App",
  },
  import_status: {
    progressing: "In Bearbeitung",
    queued: "In Warteschlange",
    created: "Erstellt",
    initiated: "Eingeleitet",
    pulling: "Abrufen",
    timed_out: "Zeitüberschreitung",
    pulled: "Abgerufen",
    transforming: "Umwandeln",
    transformed: "Umgewandelt",
    pushing: "Hochladen",
    finished: "Abgeschlossen",
    error: "Fehler",
    cancelled: "Abgebrochen",
  },
  jira_importer: {
    jira_importer_description: "Importieren Sie Ihre Jira-Daten in Plane-Projekte.",
    create_project_automatically: "Projekt automatisch erstellen",
    create_project_automatically_description:
      "Wir erstellen für Sie ein neues Projekt basierend auf den Jira-Projektdetails.",
    import_to_existing_project: "In bestehendes Projekt importieren",
    import_to_existing_project_description: "Wählen Sie ein bestehendes Projekt aus dem folgenden Dropdown-Menü aus.",
    state_mapping_automatic_creation: "Alle Jira-Status werden automatisch in Plane erstellt.",
    personal_access_token: "Persönlicher Zugriffstoken",
    user_email: "Benutzer-E-Mail",
    email_description: "Dies ist die E-Mail, die mit Ihrem persönlichen Zugriffstoken verknüpft ist",
    jira_domain: "Jira-Domain",
    jira_domain_description: "Dies ist die Domain Ihrer Jira-Instanz",
    steps: {
      title_configure_plane: "Plane konfigurieren",
      description_configure_plane:
        "Bitte erstellen Sie zuerst das Projekt in Plane, in das Sie Ihre Jira-Daten migrieren möchten. Sobald das Projekt erstellt wurde, wählen Sie es hier aus.",
      title_configure_jira: "Jira konfigurieren",
      description_configure_jira: "Bitte wählen Sie den Jira-Workspace aus, von dem Sie Ihre Daten migrieren möchten.",
      title_import_users: "Benutzer importieren",
      description_import_users:
        "Bitte fügen Sie die Benutzer hinzu, die Sie von Jira zu Plane migrieren möchten. Alternativ können Sie diesen Schritt überspringen und später manuell Benutzer hinzufügen.",
      title_map_states: "Status zuordnen",
      description_map_states:
        "Wir haben die Jira-Status nach bestem Wissen automatisch den Plane-Status zugeordnet. Bitte ordnen Sie vor dem Fortfahren alle verbleibenden Status zu. Sie können auch Status erstellen und manuell zuordnen.",
      title_map_priorities: "Prioritäten zuordnen",
      description_map_priorities:
        "Wir haben die Prioritäten nach bestem Wissen automatisch zugeordnet. Bitte ordnen Sie vor dem Fortfahren alle verbleibenden Prioritäten zu.",
      title_summary: "Zusammenfassung",
      description_summary: "Hier ist eine Zusammenfassung der Daten, die von Jira zu Plane migriert werden.",
      custom_jql_filter: "Benutzerdefinierter JQL-Filter",
      jql_filter_description: "Verwenden Sie JQL, um spezifische Aufgaben für den Import zu filtern.",
      project_code: "PROJEKT",
      enter_filters_placeholder: "Filter eingeben (z. B. status = 'In Progress')",
      validating_query: "Abfrage wird validiert...",
      validation_successful_work_items_selected: "Validierung erfolgreich, {count} Arbeitselemente ausgewählt.",
      run_syntax_check: "Syntaxprüfung ausführen, um Ihre Abfrage zu verifizieren",
      refresh: "Aktualisieren",
      check_syntax: "Syntax prüfen",
      no_work_items_selected: "Keine Arbeitselemente durch die Abfrage ausgewählt.",
      validation_error_default: "Bei der Validierung der Abfrage ist ein Fehler aufgetreten.",
    },
  },
  asana_importer: {
    asana_importer_description: "Importieren Sie Ihre Asana-Daten in Plane-Projekte.",
    select_asana_priority_field: "Asana-Prioritätsfeld auswählen",
    steps: {
      title_configure_plane: "Plane konfigurieren",
      description_configure_plane:
        "Bitte erstellen Sie zuerst das Projekt in Plane, in das Sie Ihre Asana-Daten migrieren möchten. Sobald das Projekt erstellt wurde, wählen Sie es hier aus.",
      title_configure_asana: "Asana konfigurieren",
      description_configure_asana:
        "Bitte wählen Sie den Asana-Workspace und das Projekt aus, von dem Sie Ihre Daten migrieren möchten.",
      title_map_states: "Status zuordnen",
      description_map_states:
        "Bitte wählen Sie die Asana-Status aus, die Sie den Plane-Projektstatus zuordnen möchten.",
      title_map_priorities: "Prioritäten zuordnen",
      description_map_priorities:
        "Bitte wählen Sie die Asana-Prioritäten aus, die Sie den Plane-Projektprioritäten zuordnen möchten.",
      title_summary: "Zusammenfassung",
      description_summary: "Hier ist eine Zusammenfassung der Daten, die von Asana zu Plane migriert werden.",
    },
  },
  linear_importer: {
    linear_importer_description: "Importieren Sie Ihre Linear-Daten in Plane-Projekte.",
    steps: {
      title_configure_plane: "Plane konfigurieren",
      description_configure_plane:
        "Bitte erstellen Sie zuerst das Projekt in Plane, in das Sie Ihre Linear-Daten migrieren möchten. Sobald das Projekt erstellt wurde, wählen Sie es hier aus.",
      title_configure_linear: "Linear konfigurieren",
      description_configure_linear: "Bitte wählen Sie das Linear-Team aus, von dem Sie Ihre Daten migrieren möchten.",
      title_map_states: "Status zuordnen",
      description_map_states:
        "Wir haben die Linear-Status nach bestem Wissen automatisch den Plane-Status zugeordnet. Bitte ordnen Sie vor dem Fortfahren alle verbleibenden Status zu. Sie können auch Status erstellen und manuell zuordnen.",
      title_map_priorities: "Prioritäten zuordnen",
      description_map_priorities:
        "Bitte wählen Sie die Linear-Prioritäten aus, die Sie den Plane-Projektprioritäten zuordnen möchten.",
      title_summary: "Zusammenfassung",
      description_summary: "Hier ist eine Zusammenfassung der Daten, die von Linear zu Plane migriert werden.",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "Importieren Sie Ihre Jira-Server-Daten in Plane-Projekte.",
    steps: {
      title_configure_plane: "Plane konfigurieren",
      description_configure_plane:
        "Bitte erstellen Sie zuerst das Projekt in Plane, in das Sie Ihre Jira-Daten migrieren möchten. Sobald das Projekt erstellt wurde, wählen Sie es hier aus.",
      title_configure_jira: "Jira konfigurieren",
      description_configure_jira: "Bitte wählen Sie den Jira-Workspace aus, von dem Sie Ihre Daten migrieren möchten.",
      title_map_states: "Status zuordnen",
      description_map_states: "Bitte wählen Sie die Jira-Status aus, die Sie den Plane-Projektstatus zuordnen möchten.",
      title_map_priorities: "Prioritäten zuordnen",
      description_map_priorities:
        "Bitte wählen Sie die Jira-Prioritäten aus, die Sie den Plane-Projektprioritäten zuordnen möchten.",
      title_summary: "Zusammenfassung",
      description_summary: "Hier ist eine Zusammenfassung der Daten, die von Jira zu Plane migriert werden.",
    },
    import_epics: {
      title: "Epics als Arbeitselemente importieren",
      description:
        "Wenn dies aktiviert ist, werden Ihre Epics als Arbeitselement mit dem Arbeitselementtyp 'Epic' importiert.",
    },
  },
  notion_importer: {
    notion_importer_description: "Importieren Sie Ihre Notion-Daten in Plane-Projekte.",
    steps: {
      title_upload_zip: "Notion-Export ZIP hochladen",
      description_upload_zip: "Bitte laden Sie die ZIP-Datei mit Ihren Notion-Daten hoch.",
      title_select_destination: "Ziel auswählen",
      description_select_destination: "Bitte wählen Sie das Ziel für Ihre Notion-Daten.",
    },
    select_destination: {
      destination_type: "Zieltyp",
      select_destination_type: "Zieltyp auswählen",
      select_project: "Projekt auswählen",
      no_projects_found: "Keine Projekte gefunden",
      select_teamspace: "Teamspace auswählen",
      no_teamspaces_found: "Keine Teamspaces gefunden",
      unknown_project: "Unbekanntes Projekt",
      unknown_teamspace: "Unbekannter Teamspace",
    },
    upload: {
      drop_file_here: "Lassen Sie Ihre Notion zip-Datei hier fallen",
      upload_title: "Notion-Export hochladen",
      upload_from_url: "Über URL importieren",
      upload_from_url_description: "Fügen Sie die öffentliche URL Ihres ZIP-Exports ein, um fortzufahren.",
      drag_drop_description: "Ziehen Sie Ihre Notion-Export zip-Datei hierher oder klicken Sie zum Durchsuchen",
      file_type_restriction: "Nur von Notion exportierte .zip-Dateien werden unterstützt",
      select_file: "Datei auswählen",
      uploading: "Hochladen...",
      preparing_upload: "Upload vorbereiten...",
      confirming_upload: "Upload bestätigen...",
      confirming: "Bestätigen...",
      upload_complete: "Upload abgeschlossen",
      upload_failed: "Upload fehlgeschlagen",
      start_import: "Import starten",
      retry_upload: "Upload wiederholen",
      upload: "Hochladen",
      ready: "Bereit",
      error: "Fehler",
      upload_complete_message: "Upload abgeschlossen!",
      upload_complete_description:
        'Klicken Sie auf "Import starten", um mit der Verarbeitung Ihrer Notion-Daten zu beginnen.',
      upload_progress_message: "Bitte schließen Sie dieses Fenster nicht.",
    },
  },
  confluence_importer: {
    confluence_importer_description: "Importieren Sie Ihre Confluence-Daten in das Plane-Wiki.",
    steps: {
      title_upload_zip: "Confluence-Export ZIP hochladen",
      description_upload_zip: "Bitte laden Sie die ZIP-Datei mit Ihren Confluence-Daten hoch.",
      title_select_destination: "Ziel auswählen",
      description_select_destination: "Bitte wählen Sie das Ziel für Ihre Confluence-Daten.",
    },
    select_destination: {
      destination_type: "Zieltyp",
      select_destination_type: "Zieltyp auswählen",
      select_project: "Projekt auswählen",
      no_projects_found: "Keine Projekte gefunden",
      select_teamspace: "Teamspace auswählen",
      no_teamspaces_found: "Keine Teamspaces gefunden",
      unknown_project: "Unbekanntes Projekt",
      unknown_teamspace: "Unbekannter Teamspace",
    },
    upload: {
      drop_file_here: "Lassen Sie Ihre Confluence zip-Datei hier fallen",
      upload_title: "Confluence-Export hochladen",
      upload_from_url: "Über URL importieren",
      upload_from_url_description: "Fügen Sie die öffentliche URL Ihres ZIP-Exports ein, um fortzufahren.",
      drag_drop_description: "Ziehen Sie Ihre Confluence-Export zip-Datei hierher oder klicken Sie zum Durchsuchen",
      file_type_restriction: "Nur von Confluence exportierte .zip-Dateien werden unterstützt",
      select_file: "Datei auswählen",
      uploading: "Hochladen...",
      preparing_upload: "Upload vorbereiten...",
      confirming_upload: "Upload bestätigen...",
      confirming: "Bestätigen...",
      upload_complete: "Upload abgeschlossen",
      upload_failed: "Upload fehlgeschlagen",
      start_import: "Import starten",
      retry_upload: "Upload wiederholen",
      upload: "Hochladen",
      ready: "Bereit",
      error: "Fehler",
      upload_complete_message: "Upload abgeschlossen!",
      upload_complete_description:
        'Klicken Sie auf "Import starten", um mit der Verarbeitung Ihrer Confluence-Daten zu beginnen.',
      upload_progress_message: "Bitte schließen Sie dieses Fenster nicht.",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "Importieren Sie Ihre CSV-Daten in Plane-Projekte.",
    steps: {
      title_configure_plane: "Plane konfigurieren",
      description_configure_plane:
        "Bitte erstellen Sie zuerst das Projekt in Plane, in das Sie Ihre CSV-Daten migrieren möchten. Sobald das Projekt erstellt wurde, wählen Sie es hier aus.",
      title_configure_csv: "CSV konfigurieren",
      description_configure_csv:
        "Bitte laden Sie Ihre CSV-Datei hoch und konfigurieren Sie die Felder, die den Plane-Feldern zugeordnet werden sollen.",
    },
  },
  csv_importer: {
    csv_importer_description: "Importieren Sie Arbeitselemente aus CSV-Dateien in Plane-Projekte.",
    steps: {
      title_select_project: "Projekt auswählen",
      description_select_project:
        "Bitte wählen Sie das Plane-Projekt aus, in das Sie Ihre Arbeitselemente importieren möchten.",
      title_upload_csv: "CSV hochladen",
      description_upload_csv:
        "Laden Sie Ihre CSV-Datei mit Arbeitselementen hoch. Die Datei sollte Spalten für Name, Beschreibung, Priorität, Daten und Statusgruppe enthalten.",
    },
  },
  clickup_importer: {
    clickup_importer_description: "Importieren Sie Ihre ClickUp-Daten in Plane-Projekte.",
    select_service_space: "Wählen Sie {serviceName} Space",
    select_service_folder: "Wählen Sie {serviceName} Ordner",
    selected: "Ausgewählt",
    users: "Benutzer",
    steps: {
      title_configure_plane: "Plane konfigurieren",
      description_configure_plane:
        "Bitte erstellen Sie zuerst das Projekt in Plane, in das Sie Ihre ClickUp-Daten migrieren möchten. Sobald das Projekt erstellt wurde, wählen Sie es hier aus.",
      title_configure_clickup: "ClickUp konfigurieren",
      description_configure_clickup:
        "Bitte wählen Sie das ClickUp-Team, den Space und den Ordner aus, von dem Sie Ihre Daten migrieren möchten.",
      title_map_states: "Status zuordnen",
      description_map_states:
        "Wir haben die ClickUp-Status nach bestem Wissen automatisch den Plane-Status zugeordnet. Bitte ordnen Sie vor dem Fortfahren alle verbleibenden Status zu. Sie können auch Status erstellen und manuell zuordnen.",
      title_map_priorities: "Prioritäten zuordnen",
      description_map_priorities:
        "Bitte wählen Sie die ClickUp-Prioritäten aus, die Sie den Plane-Projektprioritäten zuordnen möchten.",
      title_summary: "Zusammenfassung",
      description_summary: "Hier ist eine Zusammenfassung der Daten, die von ClickUp zu Plane migriert werden.",
      pull_additional_data_title: "Kommentare und Anhänge importieren",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "Balken",
          long_label: "Balkendiagramm",
          chart_models: {
            basic: {
              short_label: "Standard",
              long_label: "Standard-Balken",
            },
            stacked: {
              short_label: "Gestapelt",
              long_label: "Gestapelter Balken",
            },
            grouped: {
              short_label: "Gruppiert",
              long_label: "Gruppierter Balken",
            },
          },
          orientation: {
            label: "Ausrichtung",
            horizontal: "Horizontal",
            vertical: "Vertikal",
            placeholder: "Ausrichtung hinzufügen",
          },
          bar_color: "Balkenfarbe",
        },
        line_chart: {
          short_label: "Linie",
          long_label: "Liniendiagramm",
          chart_models: {
            basic: {
              short_label: "Standard",
              long_label: "Standard-Linie",
            },
            multi_line: {
              short_label: "Mehrere Linien",
              long_label: "Mehrere Linien",
            },
          },
          line_color: "Linienfarbe",
          line_type: {
            label: "Linientyp",
            solid: "Durchgezogen",
            dashed: "Gestrichelt",
            placeholder: "Linientyp hinzufügen",
          },
        },
        area_chart: {
          short_label: "Fläche",
          long_label: "Flächendiagramm",
          chart_models: {
            basic: {
              short_label: "Standard",
              long_label: "Standard-Fläche",
            },
            stacked: {
              short_label: "Gestapelt",
              long_label: "Gestapelte Fläche",
            },
            comparison: {
              short_label: "Vergleich",
              long_label: "Vergleichsfläche",
            },
          },
          fill_color: "Füllfarbe",
        },
        donut_chart: {
          short_label: "Donut",
          long_label: "Donutdiagramm",
          chart_models: {
            basic: {
              short_label: "Standard",
              long_label: "Standard-Donut",
            },
            progress: {
              short_label: "Fortschritt",
              long_label: "Fortschritts-Donut",
            },
          },
          center_value: "Mittenwert",
          completed_color: "Farbe für Abgeschlossen",
        },
        pie_chart: {
          short_label: "Kreis",
          long_label: "Kreisdiagramm",
          chart_models: {
            basic: {
              short_label: "Standard",
              long_label: "Kreis",
            },
          },
          group: {
            label: "Gruppierte Stücke",
            group_thin_pieces: "Dünne Stücke gruppieren",
            minimum_threshold: {
              label: "Mindestschwelle",
              placeholder: "Schwelle hinzufügen",
            },
            name_group: {
              label: "Gruppenname",
              placeholder: '"Weniger als 5%"',
            },
          },
          show_values: "Werte anzeigen",
          value_type: {
            percentage: "Prozentsatz",
            count: "Anzahl",
          },
        },
        number: {
          short_label: "Zahl",
          long_label: "Zahl",
          chart_models: {
            basic: {
              short_label: "Standard",
              long_label: "Zahl",
            },
          },
          alignment: {
            label: "Textausrichtung",
            left: "Links",
            center: "Zentriert",
            right: "Rechts",
            placeholder: "Textausrichtung hinzufügen",
          },
          text_color: "Textfarbe",
        },
        table_chart: {
          short_label: "Tabelle",
          long_label: "Tabellendiagramm",
          chart_models: {
            basic: {
              short_label: "Standard",
              long_label: "Tabelle",
            },
          },
          columns: "Spalten",
          rows: "Zeilen",
          rows_placeholder: "Zeilen hinzufügen",
          configure_rows_hint: "Wählen Sie eine Eigenschaft für Zeilen aus, um diese Tabelle anzuzeigen.",
        },
      },
      color_palettes: {
        modern: "Modern",
        horizon: "Horizont",
        earthen: "Erdtöne",
      },
      sections: {
        charts: "Diagramme",
        text: "Text",
      },
      common: {
        add_widget: "Widget hinzufügen",
        widget_title: {
          label: "Widget benennen",
          placeholder: 'z.B. "Zu erledigen gestern", "Alle Abgeschlossen"',
        },
        widget_type: "Widget-Typ",
        date_group: {
          label: "Datumsgruppe",
          placeholder: "Datumsgruppe hinzufügen",
        },
        group_by: "Gruppieren nach",
        stack_by: "Stapeln nach",
        daily: "Täglich",
        weekly: "Wöchentlich",
        monthly: "Monatlich",
        yearly: "Jährlich",
        work_item_count: "Anzahl der Arbeitsaufgaben",
        estimate_point: "Schätzpunkt",
        pending_work_item: "Ausstehende Arbeitsaufgaben",
        completed_work_item: "Abgeschlossene Arbeitsaufgaben",
        in_progress_work_item: "Arbeitsaufgaben in Bearbeitung",
        blocked_work_item: "Blockierte Arbeitsaufgaben",
        work_item_due_this_week: "Diese Woche fällige Arbeitsaufgaben",
        work_item_due_today: "Heute fällige Arbeitsaufgaben",
        color_scheme: {
          label: "Farbschema",
          placeholder: "Farbschema hinzufügen",
        },
        smoothing: "Glättung",
        markers: "Markierungen",
        legends: "Legenden",
        tooltips: "Tooltips",
        opacity: {
          label: "Deckkraft",
          placeholder: "Deckkraft hinzufügen",
        },
        border: "Rahmen",
        widget_configuration: "Widget-Konfiguration",
        configure_widget: "Widget konfigurieren",
        guides: "Hilfslinien",
        style: "Stil",
        area_appearance: "Flächenerscheinung",
        comparison_line_appearance: "Erscheinung der Vergleichslinie",
        add_property: "Eigenschaft hinzufügen",
        add_metric: "Metrik hinzufügen",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "Der X-Achse fehlt ein Wert.",
            y_axis_metric: "Der Metrik fehlt ein Wert.",
          },
          stacked: {
            x_axis_property: "Der X-Achse fehlt ein Wert.",
            y_axis_metric: "Der Metrik fehlt ein Wert.",
            group_by: "Stapeln nach fehlt ein Wert.",
          },
          grouped: {
            x_axis_property: "Der X-Achse fehlt ein Wert.",
            y_axis_metric: "Der Metrik fehlt ein Wert.",
            group_by: "Gruppieren nach fehlt ein Wert.",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "Der X-Achse fehlt ein Wert.",
            y_axis_metric: "Der Metrik fehlt ein Wert.",
          },
          multi_line: {
            x_axis_property: "Der X-Achse fehlt ein Wert.",
            y_axis_metric: "Der Metrik fehlt ein Wert.",
            group_by: "Gruppieren nach fehlt ein Wert.",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "Der X-Achse fehlt ein Wert.",
            y_axis_metric: "Der Metrik fehlt ein Wert.",
          },
          stacked: {
            x_axis_property: "Der X-Achse fehlt ein Wert.",
            y_axis_metric: "Der Metrik fehlt ein Wert.",
            group_by: "Stapeln nach fehlt ein Wert.",
          },
          comparison: {
            x_axis_property: "Der X-Achse fehlt ein Wert.",
            y_axis_metric: "Der Metrik fehlt ein Wert.",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "Der X-Achse fehlt ein Wert.",
            y_axis_metric: "Der Metrik fehlt ein Wert.",
          },
          progress: {
            y_axis_metric: "Der Metrik fehlt ein Wert.",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "Der X-Achse fehlt ein Wert.",
            y_axis_metric: "Der Metrik fehlt ein Wert.",
          },
        },
        number: {
          basic: {
            y_axis_metric: "Der Metrik fehlt ein Wert.",
          },
        },
        table_chart: {
          basic: {
            x_axis_property: "Spalten fehlt ein Wert.",
            group_by: "Zeilen fehlt ein Wert.",
          },
        },
        ask_admin: "Bitten Sie Ihren Administrator, dieses Widget zu konfigurieren.",
      },
      upgrade_required: {
        title: "Dieser Widget-Typ ist in Ihrem Plan nicht enthalten.",
      },
    },
    create_modal: {
      heading: {
        create: "Neues Dashboard erstellen",
        update: "Dashboard aktualisieren",
      },
      title: {
        label: "Benennen Sie Ihr Dashboard.",
        placeholder: '"Kapazität über Projekte", "Arbeitsbelastung nach Team", "Status über alle Projekte"',
        required_error: "Titel ist erforderlich",
      },
      project: {
        label: "Projekte auswählen",
        placeholder: "Daten aus diesen Projekten werden dieses Dashboard antreiben.",
        required_error: "Projekte sind erforderlich",
      },
      filters_label: "Legen Sie Filter für die oben genannten Datenquellen fest",
      create_dashboard: "Dashboard erstellen",
      update_dashboard: "Dashboard aktualisieren",
    },
    delete_modal: {
      heading: "Dashboard löschen",
    },
    empty_state: {
      feature_flag: {
        title: "Präsentieren Sie Ihren Fortschritt in Dashboards, die auf Abruf und für immer verfügbar sind.",
        description:
          "Erstellen Sie jedes benötigte Dashboard und passen Sie das Aussehen Ihrer Daten für die perfekte Darstellung Ihres Fortschritts an.",
        coming_soon_to_mobile: "Bald auch in der mobilen App verfügbar",
        card_1: {
          title: "Für alle Ihre Projekte",
          description:
            "Erhalten Sie einen vollständigen Überblick über Ihren Workspace mit allen Projekten oder segmentieren Sie Ihre Arbeitsdaten für die perfekte Ansicht Ihres Fortschritts.",
        },
        card_2: {
          title: "Für alle Daten in Plane",
          description:
            "Gehen Sie über die vordefinierten Analysen und vorgefertigten Zyklusdiagramme hinaus, um Teams, Initiativen oder andere Dinge so zu betrachten, wie Sie es noch nie zuvor getan haben.",
        },
        card_3: {
          title: "Für alle Ihre Visualisierungsbedürfnisse",
          description:
            "Wählen Sie aus mehreren anpassbaren Diagrammen mit feingranularen Steuerungen, um Ihre Arbeitsdaten genau so zu sehen und zu zeigen, wie Sie es wünschen.",
        },
        card_4: {
          title: "Auf Abruf und dauerhaft",
          description:
            "Einmal erstellen, für immer behalten mit automatischen Aktualisierungen Ihrer Daten, kontextbezogenen Kennzeichnungen für Umfangsänderungen und teilbaren Permalinks.",
        },
        card_5: {
          title: "Exporte und geplante Kommunikation",
          description:
            "Für die Fälle, in denen Links nicht funktionieren, exportieren Sie Ihre Dashboards als einmalige PDFs oder planen Sie, dass sie automatisch an Stakeholder gesendet werden.",
        },
        card_6: {
          title: "Automatisch angepasstes Layout für alle Geräte",
          description:
            "Passen Sie die Größe Ihrer Widgets für das gewünschte Layout an und sehen Sie es auf Mobilgeräten, Tablets und anderen Browsern genau gleich.",
        },
      },
      dashboards_list: {
        title:
          "Visualisieren Sie Daten in Widgets, erstellen Sie Ihre Dashboards mit Widgets und sehen Sie die neuesten Informationen auf Abruf.",
        description:
          "Erstellen Sie Ihre Dashboards mit benutzerdefinierten Widgets, die Ihre Daten im angegebenen Umfang anzeigen. Erhalten Sie Dashboards für alle Ihre Arbeiten über Projekte und Teams hinweg und teilen Sie Permalinks mit Stakeholdern für die Nachverfolgung auf Abruf.",
      },
      dashboards_search: {
        title: "Das stimmt nicht mit einem Dashboard-Namen überein.",
        description: "Stellen Sie sicher, dass Ihre Abfrage korrekt ist, oder versuchen Sie eine andere Abfrage.",
      },
      widgets_list: {
        title: "Visualisieren Sie Ihre Daten, wie Sie es wünschen.",
        description: `Verwenden Sie Linien, Balken, Kreise und andere Formate, um Ihre Daten
so zu sehen, wie Sie es von den angegebenen Quellen wünschen.`,
      },
      widget_data: {
        title: "Hier gibt es nichts zu sehen",
        description: "Aktualisieren Sie oder fügen Sie Daten hinzu, um sie hier zu sehen.",
      },
    },
    common: {
      editing: "Bearbeitung",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "Neue Arbeitsaufgaben erlauben",
      work_item_creation_disable_tooltip: "Erstellung von Arbeitsaufgaben ist für diesen Status deaktiviert",
      default_state:
        "Der Standardstatus erlaubt allen Mitgliedern, neue Arbeitsaufgaben zu erstellen. Dies kann nicht geändert werden",
      state_change_count: "{count, plural, one {1 erlaubte Statusänderung} other {{count} erlaubte Statusänderungen}}",
      movers_count: "{count, plural, one {1 aufgelisteter Prüfer} other {{count} aufgelistete Prüfer}}",
      state_changes: {
        label: {
          default: "Erlaubte Statusänderung hinzufügen",
          loading: "Erlaubte Statusänderung wird hinzugefügt",
        },
        move_to: "Status ändern zu",
        movers: {
          label: "Bei Prüfung durch",
          tooltip:
            "Prüfer sind Personen, die berechtigt sind, Arbeitsaufgaben von einem Status in einen anderen zu verschieben.",
          add: "Prüfer hinzufügen",
        },
      },
    },
    workflow_disabled: {
      title: "Sie können diese Arbeitsaufgabe nicht hierher verschieben.",
    },
    workflow_enabled: {
      label: "Statusänderung",
    },
    workflow_tree: {
      label: "Für Arbeitsaufgaben in",
      state_change_label: "kann es verschieben nach",
    },
    empty_state: {
      upgrade: {
        title: "Kontrollieren Sie das Chaos von Änderungen und Überprüfungen mit Workflows.",
        description: "Legen Sie Regeln fest, wohin sich Ihre Arbeit bewegt, durch wen und wann mit Workflows in Plane.",
      },
    },
    quick_actions: {
      view_change_history: "Änderungsverlauf anzeigen",
      reset_workflow: "Workflow zurücksetzen",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "Sind Sie sicher, dass Sie diesen Workflow zurücksetzen möchten?",
        description:
          "Wenn Sie diesen Workflow zurücksetzen, werden alle Ihre Statusänderungsregeln gelöscht und Sie müssen sie erneut erstellen, um sie in diesem Projekt auszuführen.",
      },
      delete_state_change: {
        title: "Sind Sie sicher, dass Sie diese Statusänderungsregel löschen möchten?",
        description:
          "Einmal gelöscht, können Sie diese Änderung nicht rückgängig machen und müssen die Regel erneut festlegen, wenn Sie möchten, dass sie für dieses Projekt gilt.",
      },
    },
    toasts: {
      enable_disable: {
        loading: "Workflow wird {action}",
        success: {
          title: "Erfolg",
          message: "Workflow erfolgreich {action}",
        },
        error: {
          title: "Fehler",
          message: "Workflow konnte nicht {action} werden. Bitte versuchen Sie es erneut.",
        },
      },
      reset: {
        success: {
          title: "Erfolg",
          message: "Workflow erfolgreich zurückgesetzt",
        },
        error: {
          title: "Fehler beim Zurücksetzen des Workflows",
          message: "Workflow konnte nicht zurückgesetzt werden. Bitte versuchen Sie es erneut.",
        },
      },
      add_state_change_rule: {
        error: {
          title: "Fehler beim Hinzufügen der Statusänderungsregel",
          message: "Statusänderungsregel konnte nicht hinzugefügt werden. Bitte versuchen Sie es erneut.",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "Fehler beim Ändern der Statusänderungsregel",
          message: "Statusänderungsregel konnte nicht geändert werden. Bitte versuchen Sie es erneut.",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "Fehler beim Entfernen der Statusänderungsregel",
          message: "Statusänderungsregel konnte nicht entfernt werden. Bitte versuchen Sie es erneut.",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "Fehler beim Ändern der Prüfer der Statusänderungsregel",
          message: "Prüfer der Statusänderungsregel konnten nicht geändert werden. Bitte versuchen Sie es erneut.",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {Kunde} other {Kunden}}",
    open: "Kunde öffnen",
    dropdown: {
      placeholder: "Kunde auswählen",
      required: "Bitte wählen Sie einen Kunden aus",
      no_selection: "Keine Kunden",
    },
    upgrade: {
      title: "Priorisieren und verwalten Sie Arbeit mit Kunden.",
      description: "Ordnen Sie Ihre Arbeit Kunden zu und priorisieren Sie nach Kundenattributen.",
    },
    properties: {
      default: {
        title: "Standardeigenschaften",
        customer_name: {
          name: "Kundenname",
          placeholder: "Dies könnte der Name der Person oder des Unternehmens sein",
          validation: {
            required: "Kundenname ist erforderlich.",
            max_length: "Kundenname darf nicht mehr als 255 Zeichen enthalten.",
          },
        },
        description: {
          name: "Beschreibung",
          validation: {},
        },
        email: {
          name: "E-Mail",
          placeholder: "E-Mail eingeben",
          validation: {
            required: "E-Mail ist erforderlich.",
            pattern: "Ungültige E-Mail-Adresse.",
          },
        },
        website_url: {
          name: "Website",
          placeholder: "Jede URL mit https:// funktioniert.",
          placeholder_short: "Website hinzufügen",
          validation: {
            pattern: "Ungültige Website-URL",
          },
        },
        employees: {
          name: "Mitarbeiter",
          placeholder: "Anzahl der Mitarbeiter, wenn Ihr Kunde ein Unternehmen ist.",
          validation: {
            min_length: "Mitarbeiteranzahl kann nicht weniger als 0 sein.",
            max_length: "Mitarbeiteranzahl darf nicht mehr als 2147483647 betragen.",
          },
        },
        size: {
          name: "Größe",
          placeholder: "Unternehmensgröße hinzufügen",
          validation: {
            min_length: "Ungültige Größe",
          },
        },
        domain: {
          name: "Branche",
          placeholder: "Einzelhandel, E-Commerce, Fintech, Banking",
          placeholder_short: "Branche hinzufügen",
          validation: {},
        },
        stage: {
          name: "Phase",
          placeholder: "Phase auswählen",
          validation: {},
        },
        contract_status: {
          name: "Vertragsstatus",
          placeholder: "Vertragsstatus auswählen",
          validation: {},
        },
        revenue: {
          name: "Umsatz",
          placeholder: "Dies ist der Umsatz, den Ihr Kunde jährlich generiert.",
          placeholder_short: "Umsatz hinzufügen",
          validation: {
            min_length: "Umsatz kann nicht weniger als 0 sein.",
          },
        },
        requests: {
          name: "Anz. Anfragen",
        },
        invalid_value: "Ungültige Eigenschaftswert.",
      },
      custom: {
        title: "Benutzerdefinierte Eigenschaften",
        info: "Fügen Sie die einzigartigen Attribute Ihrer Kunden zu Plane hinzu, damit Sie Arbeitsaufgaben oder Kundendatensätze besser verwalten können.",
      },
      empty_state: {
        title: "Sie haben noch keine benutzerdefinierten Eigenschaften.",
        description:
          "Benutzerdefinierte Eigenschaften, die Sie in Arbeitsaufgaben, an anderer Stelle in Plane oder außerhalb von Plane in einem CRM oder einem anderen Tool sehen möchten, werden hier angezeigt, wenn Sie sie hinzufügen.",
      },
      add: {
        primary_button: "Neue Eigenschaft hinzufügen",
      },
    },
    stage: {
      lead: "Lead",
      sales_qualified_lead: "Qualifizierter Verkaufslead",
      contract_negotiation: "Vertragsverhandlung",
      closed_won: "Abgeschlossen gewonnen",
      closed_lost: "Abgeschlossen verloren",
    },
    contract_status: {
      active: "Aktiv",
      pre_contract: "Vor Vertragsabschluss",
      signed: "Unterzeichnet",
      inactive: "Inaktiv",
    },
    empty_state: {
      detail: {
        title: "Wir konnten diesen Kundendatensatz nicht finden.",
        description:
          "Der Link zu diesem Datensatz könnte falsch sein oder dieser Datensatz wurde möglicherweise gelöscht.",
        primary_button: "Zu Kunden gehen",
        secondary_button: "Einen Kunden hinzufügen",
      },
      search: {
        title: "Sie scheinen keine Kundendatensätze zu haben, die diesem Begriff entsprechen.",
        description:
          "Versuchen Sie es mit einem anderen Suchbegriff oder kontaktieren Sie uns, wenn Sie sicher sind, dass Ergebnisse für diesen Begriff angezeigt werden sollten.",
      },
      list: {
        title: "Verwalten Sie Volumen, Rhythmus und Fluss Ihrer Arbeit nach dem, was für Ihre Kunden wichtig ist.",
        description:
          "Mit Kunden, einer Plane-exklusiven Funktion, können Sie jetzt neue Kunden von Grund auf erstellen und mit Ihrer Arbeit verbinden. Bald können Sie sie auch aus anderen Tools zusammen mit den für Sie wichtigen benutzerdefinierten Attributen importieren.",
        primary_button: "Fügen Sie Ihren ersten Kunden hinzu",
      },
    },
    settings: {
      unauthorized: "Sie sind nicht berechtigt, auf diese Seite zuzugreifen.",
      description: "Verfolgen und verwalten Sie Kundenbeziehungen in Ihrem Workflow.",
      enable: "Kunden aktivieren",
      toasts: {
        enable: {
          loading: "Kundenfunktion wird aktiviert...",
          success: {
            title: "Sie haben Kunden für diesen Workspace aktiviert.",
            message: "Sie können es nicht wieder ausschalten.",
          },
          error: {
            title: "Wir konnten Kunden diesmal nicht aktivieren.",
            message:
              "Versuchen Sie es erneut oder kehren Sie später zu diesem Bildschirm zurück. Wenn es immer noch nicht funktioniert.",
            action: "Support kontaktieren",
          },
        },
        disable: {
          loading: "Kundenfunktion wird deaktiviert...",
          success: {
            title: "Kunden deaktiviert",
            message: "Kundenfunktion erfolgreich deaktiviert!",
          },
          error: {
            title: "Fehler",
            message: "Kundenfunktion konnte nicht deaktiviert werden!",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "Wir konnten Ihre Kundenliste nicht abrufen.",
          message: "Versuchen Sie es erneut oder aktualisieren Sie diese Seite.",
        },
      },
      copy_link: {
        title: "Sie haben den direkten Link zu diesem Kunden kopiert.",
        message: "Fügen Sie ihn überall ein und er wird direkt hierher zurückführen.",
      },
      create: {
        success: {
          title: "{customer_name} ist jetzt verfügbar",
          message: "Sie können auf diesen Kunden in Arbeitsaufgaben verweisen und auch Anfragen von ihm verfolgen.",
          actions: {
            view: "Anzeigen",
            copy_link: "Link kopieren",
            copied: "Kopiert!",
          },
        },
        error: {
          title: "Wir konnten diesen Datensatz diesmal nicht erstellen.",
          message:
            "Versuchen Sie, ihn erneut zu speichern, oder kopieren Sie Ihren nicht gespeicherten Text in einen neuen Eintrag, vorzugsweise in einem anderen Tab.",
        },
      },
      update: {
        success: {
          title: "Erfolg!",
          message: "Kunde erfolgreich aktualisiert!",
        },
        error: {
          title: "Fehler!",
          message: "Kunde konnte nicht aktualisiert werden. Versuchen Sie es erneut!",
        },
      },
      logo: {
        error: {
          title: "Wir konnten das Logo des Kunden nicht hochladen.",
          message: "Versuchen Sie, das Logo erneut zu speichern oder von vorne zu beginnen.",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "Sie haben eine Arbeitsaufgabe aus dem Datensatz dieses Kunden entfernt.",
            message: "Wir haben diesen Kunden auch automatisch aus der Arbeitsaufgabe entfernt.",
          },
          error: {
            title: "Fehler!",
            message: "Wir konnten diese Arbeitsaufgabe diesmal nicht aus dem Datensatz dieses Kunden entfernen.",
          },
        },
        add: {
          error: {
            title: "Wir konnten diese Arbeitsaufgabe diesmal nicht zum Datensatz dieses Kunden hinzufügen.",
            message:
              "Versuchen Sie, diese Arbeitsaufgabe erneut hinzuzufügen oder kommen Sie später darauf zurück. Wenn es immer noch nicht funktioniert, kontaktieren Sie uns.",
          },
          success: {
            title: "Sie haben eine Arbeitsaufgabe zum Datensatz dieses Kunden hinzugefügt.",
            message: "Wir haben diesen Kunden auch automatisch zur Arbeitsaufgabe hinzugefügt.",
          },
        },
      },
    },
    quick_actions: {
      edit: "Bearbeiten",
      copy_link: "Link zum Kunden kopieren",
      delete: "Löschen",
    },
    create: {
      label: "Kundendatensatz erstellen",
      loading: "Erstelle",
      cancel: "Abbrechen",
    },
    update: {
      label: "Kunden aktualisieren",
      loading: "Aktualisiere",
    },
    delete: {
      title: "Sind Sie sicher, dass Sie den Kundendatensatz {customer_name} löschen möchten?",
      description:
        "Alle mit diesem Datensatz verknüpften Daten werden dauerhaft gelöscht. Sie können diesen Datensatz später nicht wiederherstellen.",
    },
    requests: {
      empty_state: {
        list: {
          title: "Es gibt noch keine Anfragen zum Anzeigen.",
          description: "Erstellen Sie Anfragen von Ihren Kunden, damit Sie sie mit Arbeitsaufgaben verknüpfen können.",
          button: "Neue Anfrage hinzufügen",
        },
        search: {
          title: "Sie scheinen keine Anfragen zu haben, die diesem Begriff entsprechen.",
          description:
            "Versuchen Sie es mit einem anderen Suchbegriff oder kontaktieren Sie uns, wenn Sie sicher sind, dass Ergebnisse für diesen Begriff angezeigt werden sollten.",
        },
      },
      label: "{count, plural, one {Anfrage} other {Anfragen}}",
      add: "Anfrage hinzufügen",
      create: "Anfrage erstellen",
      update: "Anfrage aktualisieren",
      form: {
        name: {
          placeholder: "Benennen Sie diese Anfrage",
          validation: {
            required: "Name ist erforderlich.",
            max_length: "Anfragename sollte 255 Zeichen nicht überschreiten.",
          },
        },
        description: {
          placeholder:
            "Beschreiben Sie die Art der Anfrage oder fügen Sie den Kommentar dieses Kunden aus einem anderen Tool ein.",
        },
        source: {
          add: "Quelle hinzufügen",
          update: "Quelle aktualisieren",
          url: {
            label: "URL",
            required: "URL ist erforderlich",
            invalid: "Ungültige Website-URL",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "Link kopiert",
          message: "Kundenanfrage-Link in die Zwischenablage kopiert.",
        },
        attachment: {
          upload: {
            loading: "Anhang wird hochgeladen...",
            success: {
              title: "Anhang hochgeladen",
              message: "Der Anhang wurde erfolgreich hochgeladen.",
            },
            error: {
              title: "Anhang nicht hochgeladen",
              message: "Der Anhang konnte nicht hochgeladen werden.",
            },
          },
          size: {
            error: {
              title: "Fehler!",
              message: "Es kann nur eine Datei gleichzeitig hochgeladen werden.",
            },
          },
          length: {
            message: "Datei muss {size}MB oder kleiner sein",
          },
          remove: {
            success: {
              title: "Anhang entfernt",
              message: "Der Anhang wurde erfolgreich entfernt",
            },
            error: {
              title: "Anhang nicht entfernt",
              message: "Der Anhang konnte nicht entfernt werden",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "Erfolg!",
              message: "Quelle erfolgreich aktualisiert!",
            },
            error: {
              title: "Fehler!",
              message: "Quelle konnte nicht aktualisiert werden.",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "Fehler!",
              message: "Arbeitsaufgaben konnten der Anfrage nicht hinzugefügt werden. Versuchen Sie es erneut.",
            },
            success: {
              title: "Erfolg!",
              message: "Arbeitsaufgaben zur Anfrage hinzugefügt.",
            },
          },
        },
        update: {
          success: {
            message: "Anfrage erfolgreich aktualisiert!",
            title: "Erfolg!",
          },
          error: {
            title: "Fehler!",
            message: "Anfrage konnte nicht aktualisiert werden. Versuchen Sie es erneut!",
          },
        },
        create: {
          success: {
            message: "Anfrage erfolgreich erstellt!",
            title: "Erfolg!",
          },
          error: {
            title: "Fehler!",
            message: "Anfrage konnte nicht erstellt werden. Versuchen Sie es erneut!",
          },
        },
      },
    },
    linked_work_items: {
      label: "Verknüpfte Arbeitsaufgaben",
      link: "Arbeitsaufgaben verknüpfen",
      empty_state: {
        list: {
          title: "Sie scheinen noch keine Arbeitsaufgaben mit diesem Kunden verknüpft zu haben.",
          description:
            "Verknüpfen Sie hier vorhandene Arbeitsaufgaben aus beliebigen Projekten, damit Sie sie nach diesem Kunden verfolgen können.",
          button: "Arbeitsaufgabe verknüpfen",
        },
      },
      action: {
        remove_epic: "Epic entfernen",
        remove: "Arbeitsaufgabe entfernen",
      },
    },
    sidebar: {
      properties: "Eigenschaften",
    },
  },
  templates: {
    settings: {
      title: "Vorlagen",
      new_project_template: "Neue Projektvorlage",
      new_work_item_template: "Neue Arbeitselementvorlage",
      new_page_template: "Neue Seitenvorlage",
      description:
        "Sparen Sie 80% der Zeit, die für die Erstellung von Projekten, Arbeitsaufgaben und Seiten aufgewendet wird, wenn Sie Vorlagen verwenden.",
      options: {
        project: {
          label: "Projektvorlagen",
        },
        work_item: {
          label: "Arbeitsaufgabenvorlagen",
        },
        page: {
          label: "Seitenvorlagen",
        },
      },
      create_template: {
        label: "Vorlage erstellen",
        no_permission: {
          project: "Kontaktieren Sie Ihren Projektadministrator, um Vorlagen zu erstellen",
          workspace: "Kontaktieren Sie Ihren Workspace-Administrator, um Vorlagen zu erstellen",
        },
      },
      use_template: {
        button: {
          default: "Vorlage verwenden",
          loading: "Verwenden",
        },
      },
      template_source: {
        workspace: {
          info: "Vom Workspace abgeleitet",
        },
        project: {
          info: "Vom Projekt abgeleitet",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "Benennen Sie Ihre Projektvorlage.",
              validation: {
                required: "Vorlagenname ist erforderlich",
                maxLength: "Vorlagenname sollte weniger als 255 Zeichen enthalten",
              },
            },
            description: {
              placeholder: "Beschreiben Sie, wann und wie diese Vorlage verwendet werden soll.",
            },
          },
          name: {
            placeholder: "Benennen Sie Ihr Projekt.",
            validation: {
              required: "Projekttitel ist erforderlich",
              maxLength: "Projekttitel sollte weniger als 255 Zeichen enthalten",
            },
          },
          description: {
            placeholder: "Beschreiben Sie den Zweck und die Ziele dieses Projekts.",
          },
          button: {
            create: "Projektvorlage erstellen",
            update: "Projektvorlage aktualisieren",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "Benennen Sie Ihre Arbeitsaufgabenvorlage.",
              validation: {
                required: "Vorlagenname ist erforderlich",
                maxLength: "Vorlagenname sollte weniger als 255 Zeichen enthalten",
              },
            },
            description: {
              placeholder: "Beschreiben Sie, wann und wie diese Vorlage verwendet werden soll.",
            },
          },
          name: {
            placeholder: "Geben Sie dieser Arbeitsaufgabe einen Titel.",
            validation: {
              required: "Arbeitsaufgabentitel ist erforderlich",
              maxLength: "Arbeitsaufgabentitel sollte weniger als 255 Zeichen enthalten",
            },
          },
          description: {
            placeholder:
              "Beschreiben Sie diese Arbeitsaufgabe so, dass klar ist, was Sie erreichen werden, wenn Sie diese abschließen.",
          },
          button: {
            create: "Arbeitsaufgabenvorlage erstellen",
            update: "Arbeitsaufgabenvorlage aktualisieren",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "Benennen Sie Ihre Seitenvorlage.",
              validation: {
                required: "Vorlagenname ist erforderlich",
                maxLength: "Vorlagenname sollte weniger als 255 Zeichen enthalten",
              },
            },
            description: {
              placeholder: "Beschreiben Sie, wann und wie diese Vorlage verwendet werden soll.",
            },
          },
          name: {
            placeholder: "Unbenannte Seite",
            validation: {
              maxLength: "Seitentitel sollte weniger als 255 Zeichen enthalten",
            },
          },
          button: {
            create: "Seitenvorlage erstellen",
            update: "Seitenvorlage aktualisieren",
          },
        },
        publish: {
          action: "{isPublished, select, true {Veröffentlichungseinstellungen} other {Im Marketplace veröffentlichen}}",
          unpublish_action: "Vom Marketplace zurückziehen",
          title: "Machen Sie Ihre Vorlage entdeckbar und erkennbar.",
          name: {
            label: "Vorlagenname",
            placeholder: "Benennen Sie Ihre Vorlage",
            validation: {
              required: "Vorlagenname ist erforderlich",
              maxLength: "Vorlagenname sollte weniger als 255 Zeichen enthalten",
            },
          },
          short_description: {
            label: "Kurze Beschreibung",
            placeholder: "Diese Vorlage ist ideal für Projektmanager, die mehrere Projekte gleichzeitig verwalten.",
            validation: {
              required: "Kurze Beschreibung ist erforderlich",
            },
          },
          description: {
            label: "Beschreibung",
            placeholder: `Steigern Sie die Produktivität und optimieren Sie die Kommunikation mit unserer Sprach-zu-Text-Integration.
• Echtzeit-Transkription: Konvertieren Sie gesprochene Wörter sofort in präzisen Text.
• Aufgaben- und Kommentarerstellung: Fügen Sie Aufgaben, Beschreibungen und Kommentare über Sprachbefehle hinzu.`,
            validation: {
              required: "Beschreibung ist erforderlich",
            },
          },
          category: {
            label: "Kategorie",
            placeholder: "Wählen Sie, wo Sie denken, dass dies am besten passt. Sie können mehrere auswählen.",
            validation: {
              required: "Mindestens eine Kategorie ist erforderlich",
            },
          },
          keywords: {
            label: "Schlüsselwörter",
            placeholder:
              "Verwenden Sie Begriffe, die Sie denken, dass Ihre Benutzer beim Suchen nach dieser Vorlage verwenden werden.",
            helperText: "Geben Sie Schlüsselwörter ein, die wahrscheinlich helfen, diese von der Suche zu finden.",
            validation: {
              required: "Mindestens ein Schlüsselwort ist erforderlich",
            },
          },
          company_name: {
            label: "Unternehmensname",
            placeholder: "Plane",
            validation: {
              required: "Unternehmensname ist erforderlich",
              maxLength: "Unternehmensname sollte weniger als 255 Zeichen enthalten",
            },
          },
          website: {
            label: "Website-URL",
            placeholder: "https://plane.so",
            validation: {
              invalid: "Ungültige URL",
              maxLength: "URL sollte weniger als 800 Zeichen enthalten",
            },
          },
          contact_email: {
            label: "Support-E-Mail",
            placeholder: "help@plane.so",
            validation: {
              invalid: "Ungültige E-Mail-Adresse",
              maxLength: "Support-E-Mail sollte weniger als 255 Zeichen enthalten",
            },
          },
          privacy_policy_url: {
            label: "Link zu Ihrer Datenschutzerklärung",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "Ungültige URL",
              maxLength: "URL sollte weniger als 800 Zeichen enthalten",
            },
          },
          terms_of_service_url: {
            label: "Link zu Ihren Nutzungsbedingungen",
            placeholder: "https://planes.so/terms-of-service",
            validation: {
              invalid: "Ungültige URL",
              maxLength: "URL sollte weniger als 800 Zeichen enthalten",
            },
          },
          cover_image: {
            label: "Fügen Sie ein Cover-Bild hinzu, das im Marketplace angezeigt wird",
            upload_title: "Cover-Bild hochladen",
            upload_placeholder: "Klicken Sie, um ein Cover-Bild hochzuladen, oder ziehen Sie es hierher",
            drop_here: "Hier ablegen",
            click_to_upload: "Klicken Sie, um ein Cover-Bild hochzuladen",
            invalid_file_or_exceeds_size_limit:
              "Ungültige Datei oder Überschreitung der Größe. Bitte versuchen Sie es erneut.",
            upload_and_save: "Hochladen und speichern",
            uploading: "Hochladen",
            remove: "Entfernen",
            removing: "Entfernen",
            validation: {
              required: "Cover-Bild ist erforderlich",
            },
          },
          attach_screenshots: {
            label:
              "Dokumente und Bilder einfügen, die Sie denken, dass die Anzeigende dieser Vorlage hilfreich sein können.",
            validation: {
              required: "Mindestens ein Screenshot ist erforderlich",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "Vorlagen",
        description:
          "Mit Projekt-, Arbeitsaufgaben- und Seitenvorlagen in Plane müssen Sie kein Projekt von Grund auf neu erstellen oder Arbeitsaufgabeneigenschaften manuell festlegen.",
        sub_description: "Sparen Sie 80% Ihrer Administrationszeit, wenn Sie Vorlagen verwenden.",
      },
      no_templates: {
        button: "Erstellen Sie Ihre erste Vorlage",
      },
      no_labels: {
        description:
          "Noch keine Labels vorhanden. Erstellen Sie Labels, um Arbeitsaufgaben in Ihrem Projekt zu organisieren und zu filtern.",
      },
      no_work_items: {
        description: "Noch keine Arbeitsaufgaben. Fügen Sie eine hinzu, um Ihre Arbeit besser zu strukturieren.",
      },
      no_sub_work_items: {
        description: "Noch keine Unterarbeitsaufgaben. Fügen Sie eine hinzu, um Ihre Arbeit besser zu strukturieren.",
      },
      page: {
        no_templates: {
          title: "Es gibt keine Vorlagen, auf die Sie Zugriff haben.",
          description: "Bitte erstellen Sie eine Vorlage",
        },
        no_results: {
          title: "Das entspricht keiner Vorlage.",
          description: "Versuchen Sie es mit anderen Suchbegriffen.",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "Vorlage erstellt",
          message: "{templateName}, die {templateType}-Vorlage, ist jetzt für Ihren Workspace verfügbar.",
        },
        error: {
          title: "Wir konnten diese Vorlage diesmal nicht erstellen.",
          message:
            "Versuchen Sie, Ihre Details erneut zu speichern oder kopieren Sie sie in eine neue Vorlage, vorzugsweise in einem anderen Tab.",
        },
      },
      update: {
        success: {
          title: "Vorlage geändert",
          message: "{templateName}, die {templateType}-Vorlage, wurde geändert.",
        },
        error: {
          title: "Wir konnten Änderungen an dieser Vorlage nicht speichern.",
          message:
            "Versuchen Sie, Ihre Details erneut zu speichern oder kommen Sie später zu dieser Vorlage zurück. Wenn es immer noch Probleme gibt, kontaktieren Sie uns.",
        },
      },
      delete: {
        success: {
          title: "Vorlage gelöscht",
          message: "{templateName}, die {templateType}-Vorlage, wurde jetzt aus Ihrem Workspace gelöscht.",
        },
        error: {
          title: "Wir konnten diese Vorlage nicht löschen.",
          message:
            "Versuchen Sie, sie erneut zu löschen oder kommen Sie später darauf zurück. Wenn Sie sie dann nicht löschen können, kontaktieren Sie uns.",
        },
      },
      unpublish: {
        success: {
          title: "Vorlage zurückgezogen",
          message: "{templateName}, die {templateType}-Vorlage, wurde jetzt zurückgezogen.",
        },
        error: {
          title: "Wir konnten diese Vorlage nicht zurückziehen.",
          message:
            "Versuchen Sie, sie erneut zurückzuziehen oder kommen Sie später darauf zurück. Wenn Sie sie dann nicht zurückziehen können, kontaktieren Sie uns.",
        },
      },
    },
    delete_confirmation: {
      title: "Vorlage löschen",
      description: {
        prefix: "Sind Sie sicher, dass Sie die Vorlage löschen möchten-",
        suffix:
          "? Alle mit der Vorlage verbundenen Daten werden dauerhaft entfernt. Diese Aktion kann nicht rückgängig gemacht werden.",
      },
    },
    unpublish_confirmation: {
      title: "Vorlage zurückziehen",
      description: {
        prefix: "Sind Sie sicher, dass Sie die Vorlage zurückziehen möchten-",
        suffix: "? Diese Vorlage wird den Benutzern im Marketplace nicht mehr zur Verfügung stehen.",
      },
    },
    dropdown: {
      add: {
        work_item: "Neue Vorlage hinzufügen",
        project: "Neue Vorlage hinzufügen",
      },
      label: {
        project: "Projektvorlage auswählen",
        page: "Aus Vorlage wählen",
      },
      tooltip: {
        work_item: "Arbeitselement-Vorlage auswählen",
      },
      no_results: {
        work_item: "Keine Vorlagen gefunden.",
        project: "Keine Vorlagen gefunden.",
      },
    },
  },
  intake_forms: {
    create: {
      title: "Arbeitselement erstellen",
      "sub-title": "Lassen Sie das Team wissen, woran Sie arbeiten möchten.",
      name: "Name",
      email: "E-Mail",
      description_placeholder:
        "Fügen Sie so viele Details hinzu, wie Sie möchten, damit das Team Ihre Situation und Bedürfnisse erkennt.",
      loading: "Wird erstellt",
      create_work_item: "Arbeitselement erstellen",
      errors: {
        name: "Name ist erforderlich",
        name_max_length: "Name darf maximal 255 Zeichen haben",
        email: "E-Mail ist erforderlich",
        email_invalid: "Ungültige E-Mail-Adresse",
        title: "Titel ist erforderlich",
        title_max_length: "Titel darf maximal 255 Zeichen haben",
      },
    },
    success: {
      title: "Super! Ihr Arbeitselement ist jetzt in der Team-Warteschlange.",
      description: "Das Team kann dieses Arbeitselement jetzt aus der Intake-Warteschlange genehmigen oder verwerfen.",
      primary_button: {
        text: "Weiteres Arbeitselement hinzufügen",
      },
      secondary_button: {
        text: "Mehr über Intake erfahren",
      },
    },
    how_it_works: {
      title: "Wie funktioniert es?",
      heading: "Dies ist ein Intake-Formular.",
      description:
        "Intake ist eine Plane-Funktion, mit der Projekt-Admins und Manager Arbeitselemente von außen in ihre Projekte holen können.",
      steps: {
        step_1: "Dieses kurze Formular ermöglicht die Erstellung eines neuen Arbeitselements in einem Plane-Projekt.",
        step_2: "Wenn Sie dieses Formular absenden, wird ein neues Arbeitselement im Intake dieses Projekts erstellt.",
        step_3: "Jemand aus diesem Projekt oder Team wird es prüfen.",
        step_4:
          "Wenn sie es genehmigen, wird dieses Arbeitselement in die Projekt-Warteschlange verschoben. Andernfalls wird es abgelehnt.",
        step_5:
          "Um den Status dieses Arbeitselements zu erfahren, wenden Sie sich an den Projektmanager, Admin oder die Person, die Ihnen den Link zu dieser Seite geschickt hat.",
      },
    },
    type_forms: {
      select_types: {
        title: "Arbeitselementtyp auswählen",
        search_placeholder: "Nach Arbeitselementtyp suchen",
      },
      actions: {
        select_properties: "Eigenschaften auswählen",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "Wiederkehrende Arbeitsaufgaben",
      description:
        "Setzen Sie Ihre wiederkehrende Arbeit einmalig und wir kümmern uns um die Wiederholungen. Sie sehen alles hier, wenn es Zeit ist.",
      new_recurring_work_item: "Neue wiederkehrende Arbeitsaufgabe",
      update_recurring_work_item: "Wiederkehrende Arbeitsaufgabe aktualisieren",
      form: {
        interval: {
          title: "Zeitplan",
          start_date: {
            validation: {
              required: "Startdatum ist erforderlich",
            },
          },
          interval_type: {
            validation: {
              required: "Intervalltyp ist erforderlich",
            },
          },
        },
        button: {
          create: "Wiederkehrende Arbeitsaufgabe erstellen",
          update: "Wiederkehrende Arbeitsaufgabe aktualisieren",
        },
      },
      create_button: {
        label: "Wiederkehrende Arbeitsaufgabe erstellen",
        no_permission: "Wenden Sie sich an Ihren Projektadministrator, um wiederkehrende Arbeitsaufgaben zu erstellen",
      },
    },
    empty_state: {
      upgrade: {
        title: "Ihre Arbeit, auf Autopilot",
        description:
          "Einmal einstellen. Wir erinnern Sie daran, wenn es fällig ist. Upgrade auf Business, um wiederkehrende Arbeit mühelos zu machen.",
      },
      no_templates: {
        button: "Erstellen Sie Ihre erste wiederkehrende Arbeitsaufgabe",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Wiederkehrende Arbeitsaufgabe erstellt",
          message: "{name}, die wiederkehrende Arbeitsaufgabe, ist jetzt für Ihren Arbeitsbereich verfügbar.",
        },
        error: {
          title: "Wir konnten diese wiederkehrende Arbeitsaufgabe diesmal nicht erstellen.",
          message:
            "Versuchen Sie, Ihre Angaben erneut zu speichern oder kopieren Sie sie in eine neue wiederkehrende Arbeitsaufgabe, vorzugsweise in einem anderen Tab.",
        },
      },
      update: {
        success: {
          title: "Wiederkehrende Arbeitsaufgabe geändert",
          message: "{name}, die wiederkehrende Arbeitsaufgabe, wurde geändert.",
        },
        error: {
          title: "Wir konnten die Änderungen an dieser wiederkehrenden Arbeitsaufgabe nicht speichern.",
          message:
            "Versuchen Sie, Ihre Angaben erneut zu speichern oder kommen Sie später zu dieser wiederkehrenden Arbeitsaufgabe zurück. Wenn weiterhin Probleme auftreten, kontaktieren Sie uns.",
        },
      },
      delete: {
        success: {
          title: "Wiederkehrende Arbeitsaufgabe gelöscht",
          message: "{name}, die wiederkehrende Arbeitsaufgabe, wurde aus Ihrem Arbeitsbereich gelöscht.",
        },
        error: {
          title: "Wir konnten diese wiederkehrende Arbeitsaufgabe nicht löschen.",
          message:
            "Versuchen Sie es erneut oder kommen Sie später darauf zurück. Wenn Sie sie dann immer noch nicht löschen können, kontaktieren Sie uns.",
        },
      },
    },
    delete_confirmation: {
      title: "Wiederkehrende Arbeitsaufgabe löschen",
      description: {
        prefix: "Sind Sie sicher, dass Sie die wiederkehrende Arbeitsaufgabe löschen möchten-",
        suffix:
          "? Alle mit der wiederkehrenden Arbeitsaufgabe verbundenen Daten werden dauerhaft entfernt. Diese Aktion kann nicht rückgängig gemacht werden.",
      },
    },
  },
  page_actions: {
    move_page: {
      submit_button: {
        default: "Verschieben",
        loading: "Wird verschoben",
      },
      cannot_move_to_teamspace: "Private und geteilte Seiten können nicht in einen Teamspace verschoben werden.",
      placeholders: {
        workspace_to_all: "Nach Projekten und Teamspaces suchen",
        workspace_to_project: "Nach Projekten suchen",
        project_to_all: "Nach Projekten und Teamspaces suchen",
        project_to_project: "Nach Projekten suchen",
        teamspace_to_all: "Nach Projekten und Teamspaces suchen",
      },
      toasts: {
        success: {
          title: "Erfolg!",
          message: "Seite erfolgreich verschoben.",
        },
        error: {
          title: "Fehler!",
          message: "Seite konnte nicht verschoben werden. Bitte versuchen Sie es später erneut.",
        },
      },
    },
  },
  wiki: {
    upgrade_flow: {
      title: "Upgrade zum Freischalten von Wiki",
      description:
        "Schalten Sie öffentliche Seiten, Versionsverlauf, geteilte Seiten, Echtzeit-Zusammenarbeit und Arbeitsbereichsseiten für Wikis, unternehmensweite Dokumente und Wissensdatenbanken mit Plane Pro frei.",
      upgrade_button: {
        text: "Upgrade",
      },
      learn_more_button: {
        text: "Mehr erfahren",
      },
      download_button: {
        text: "Daten herunterladen",
        loading: "Wird heruntergeladen",
      },
      tabs: {
        nested_pages: "Verschachtelte Seiten",
        add_embeds: "Einbettungen hinzufügen",
        publish_pages: "Seiten veröffentlichen",
        comments: "Kommentare",
      },
    },
    nested_pages_download_banner: {
      title:
        "Verschachtelte Seiten erfordern einen kostenpflichtigen Plan. Führen Sie ein Upgrade durch, um sie freizuschalten.",
    },
  },
  automations: {
    settings: {
      title: "Benutzerdefinierte Automatisierungen",
      create_automation: "Automatisierung erstellen",
    },
    scope: {
      label: "Bereich",
      run_on: "Ausführen auf",
    },
    trigger: {
      label: "Auslöser",
      add_trigger: "Auslöser hinzufügen",
      sidebar_header: "Auslöser-Konfiguration",
      input_label: "Was ist der Auslöser für diese Automatisierung?",
      input_placeholder: "Option auswählen",
      section_plane_events: "Plane-Ereignisse",
      section_time_based: "Zeitbasiert",
      fixed_schedule: "Fester Zeitplan",
      schedule: {
        frequency: "Häufigkeit",
        select_day: "Tag auswählen",
        day_of_month: "Tag des Monats",
        monthly_every: "Jeden",
        monthly_day_aria: "Tag {day}",
        time: "Uhrzeit",
        hour: "Stunde",
        minute: "Minute",
        hour_suffix: "Std.",
        minute_suffix: "Min.",
        am: "AM",
        pm: "PM",
        timezone: "Zeitzone",
        timezone_placeholder: "Zeitzone auswählen",
        frequency_daily: "Täglich",
        frequency_weekly: "Wöchentlich",
        frequency_monthly: "Monatlich",
        on: "Am",
        validation_weekly_day_required: "Wähle mindestens einen Wochentag aus.",
        validation_monthly_date_required: "Wähle einen Tag des Monats aus.",
        main_content_schedule_summary_daily: "Jeden Tag um {time} ({timezone}).",
        main_content_schedule_summary_weekly: "Jede Woche am {days} um {time} ({timezone}).",
        main_content_schedule_summary_monthly: "Jeden Monat am {day}. um {time} ({timezone}).",
        schedule_mode: "Zeitplanmodus",
        schedule_mode_fixed: "Fest",
        schedule_mode_cron: "Cron",
        cron_expression_label: "Cron-Ausdruck eingeben",
        cron_expression_placeholder: "0 9 * * 1-5",
        cron_invalid: "Ungültiger Cron-Ausdruck.",
        cron_preview: 'Dieser Cron-Ausdruck führt aus: „{description}".',
        main_content_cron_summary: "{description} ({timezone}).",
      },
      button: {
        previous: "Zurück",
        next: "Aktion hinzufügen",
      },
    },
    condition: {
      label: "Vorausgesetzt",
      add_condition: "Bedingung hinzufügen",
      adding_condition: "Bedingung hinzufügen",
    },
    action: {
      label: "Aktion",
      add_action: "Aktion hinzufügen",
      sidebar_header: "Aktionen",
      input_label: "Was macht die Automatisierung?",
      input_placeholder: "Option auswählen",
      handler_name: {
        add_comment: "Kommentar hinzufügen",
        change_property: "Eigenschaft ändern",
        run_script: "Skript ausführen",
      },
      run_script_block: {
        title: "Skript ausführen",
      },
      configuration: {
        label: "Konfiguration",
        change_property: {
          placeholders: {
            property_name: "Eigenschaft auswählen",
            change_type: "Auswählen",
            property_value_select: "{count, plural, one{Wert auswählen} other{Werte auswählen}}",
            property_value_select_date: "Datum auswählen",
          },
          validation: {
            property_name_required: "Eigenschaftsname ist erforderlich",
            change_type_required: "Änderungstyp ist erforderlich",
            property_value_required: "Eigenschaftswert ist erforderlich",
          },
        },
      },
      comment_block: {
        title: "Kommentar hinzufügen",
      },
      change_property_block: {
        title: "Eigenschaft ändern",
      },
      validation: {
        delete_only_action: "Deaktivieren Sie die Automatisierung, bevor Sie ihre einzige Aktion löschen.",
      },
    },
    conjunctions: {
      and: "Und",
      or: "Oder",
      if: "Wenn",
      then: "Dann",
    },
    enable: {
      alert:
        "Klicken Sie auf 'Aktivieren', wenn Ihre Automatisierung vollständig ist. Nach der Aktivierung ist die Automatisierung bereit zur Ausführung.",
      validation: {
        required: "Automatisierung muss einen Auslöser und mindestens eine Aktion haben, um aktiviert zu werden.",
      },
    },
    delete: {
      validation: {
        enabled: "Automatisierung muss vor dem Löschen deaktiviert werden.",
      },
    },
    table: {
      title: "Automatisierungstitel",
      last_run_on: "Zuletzt ausgeführt am",
      created_on: "Erstellt am",
      last_updated_on: "Zuletzt aktualisiert am",
      last_run_status: "Status der letzten Ausführung",
      average_duration: "Durchschnittliche Dauer",
      owner: "Besitzer",
      executions: "Ausführungen",
    },
    create_modal: {
      heading: {
        create: "Automatisierung erstellen",
        update: "Automatisierung aktualisieren",
      },
      title: {
        placeholder: "Benennen Sie Ihre Automatisierung.",
        required_error: "Titel ist erforderlich",
      },
      description: {
        placeholder: "Beschreiben Sie Ihre Automatisierung.",
      },
      submit_button: {
        create: "Automatisierung erstellen",
        update: "Automatisierung aktualisieren",
      },
    },
    delete_modal: {
      heading: "Automatisierung löschen",
    },
    activity: {
      filters: {
        show_fails: "Fehler anzeigen",
        all: "Alle",
        only_activity: "Nur Aktivität",
        only_run_history: "Nur Ausführungsverlauf",
      },
      run_history: {
        initiator: "Initiator",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Erfolg!",
          message: "Automatisierung erfolgreich erstellt.",
        },
        error: {
          title: "Fehler!",
          message: "Erstellung der Automatisierung fehlgeschlagen.",
        },
      },
      update: {
        success: {
          title: "Erfolg!",
          message: "Automatisierung erfolgreich aktualisiert.",
        },
        error: {
          title: "Fehler!",
          message: "Aktualisierung der Automatisierung fehlgeschlagen.",
        },
      },
      enable: {
        success: {
          title: "Erfolg!",
          message: "Automatisierung erfolgreich aktiviert.",
        },
        error: {
          title: "Fehler!",
          message: "Aktivierung der Automatisierung fehlgeschlagen.",
        },
      },
      disable: {
        success: {
          title: "Erfolg!",
          message: "Automatisierung erfolgreich deaktiviert.",
        },
        error: {
          title: "Fehler!",
          message: "Deaktivierung der Automatisierung fehlgeschlagen.",
        },
      },
      delete: {
        success: {
          title: "Automatisierung gelöscht",
          message: "{name}, die Automatisierung, wurde aus Ihrem Projekt gelöscht.",
        },
        error: {
          title: "Wir konnten diese Automatisierung diesmal nicht löschen.",
          message:
            "Versuchen Sie es erneut oder kommen Sie später darauf zurück. Wenn Sie sie dann immer noch nicht löschen können, kontaktieren Sie uns.",
        },
      },
      action: {
        create: {
          error: {
            title: "Fehler!",
            message: "Erstellung der Aktion fehlgeschlagen. Bitte versuchen Sie es erneut!",
          },
        },
        update: {
          error: {
            title: "Fehler!",
            message: "Aktualisierung der Aktion fehlgeschlagen. Bitte versuchen Sie es erneut!",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "Es gibt noch keine Automatisierungen anzuzeigen.",
        description:
          "Automatisierungen helfen Ihnen, sich wiederholende Aufgaben zu eliminieren, indem Sie Auslöser, Bedingungen und Aktionen festlegen. Erstellen Sie eine, um Zeit zu sparen und die Arbeit mühelos am Laufen zu halten.",
      },
      upgrade: {
        title: "Automatisierungen",
        description: "Automatisierungen sind eine Möglichkeit, Aufgaben in Ihrem Projekt zu automatisieren.",
        sub_description: "Gewinnen Sie 80% Ihrer Verwaltungszeit zurück, wenn Sie Automatisierungen verwenden.",
      },
    },
  },
  sso: {
    header: "Identität",
    description:
      "Konfigurieren Sie Ihre Domain, um auf Sicherheitsfunktionen einschließlich Single Sign-On zuzugreifen.",
    domain_management: {
      header: "Domain-Verwaltung",
      verified_domains: {
        header: "Verifizierte Domains",
        description: "Überprüfen Sie den Besitz einer E-Mail-Domain, um Single Sign-On zu aktivieren.",
        button_text: "Domain hinzufügen",
        list: {
          domain_name: "Domainname",
          status: "Status",
          status_verified: "Verifiziert",
          status_failed: "Fehlgeschlagen",
          status_pending: "Ausstehend",
        },
        add_domain: {
          title: "Domain hinzufügen",
          description: "Fügen Sie Ihre Domain hinzu, um SSO zu konfigurieren und zu verifizieren.",
          form: {
            domain_label: "Domain",
            domain_placeholder: "plane.so",
            domain_required: "Domain ist erforderlich",
            domain_invalid: "Geben Sie einen gültigen Domainnamen ein (z. B. plane.so)",
          },
          primary_button_text: "Domain hinzufügen",
          primary_button_loading_text: "Hinzufügen",
          toast: {
            success_title: "Erfolg!",
            success_message:
              "Domain wurde erfolgreich hinzugefügt. Bitte verifizieren Sie sie, indem Sie den DNS TXT-Eintrag hinzufügen.",
            error_message: "Domain konnte nicht hinzugefügt werden. Bitte versuchen Sie es erneut.",
          },
        },
        verify_domain: {
          title: "Verifizieren Sie Ihre Domain",
          description: "Befolgen Sie diese Schritte, um Ihre Domain zu verifizieren.",
          instructions: {
            label: "Anweisungen",
            step_1: "Gehen Sie zu den DNS-Einstellungen für Ihren Domain-Host.",
            step_2: {
              part_1: "Erstellen Sie einen",
              part_2: "TXT-Eintrag",
              part_3: "und fügen Sie den vollständigen Eintragswert ein, der unten bereitgestellt wird.",
            },
            step_3: "Diese Aktualisierung dauert normalerweise einige Minuten, kann aber bis zu 72 Stunden dauern.",
            step_4:
              'Klicken Sie auf "Domain verifizieren", um zu bestätigen, sobald Ihr DNS-Eintrag aktualisiert wurde.',
          },
          verification_code_label: "Wert des TXT-Eintrags",
          verification_code_description: "Fügen Sie diesen Eintrag zu Ihren DNS-Einstellungen hinzu",
          domain_label: "Domain",
          primary_button_text: "Domain verifizieren",
          primary_button_loading_text: "Verifizieren",
          secondary_button_text: "Ich mache es später",
          toast: {
            success_title: "Erfolg!",
            success_message: "Domain wurde erfolgreich verifiziert.",
            error_message: "Domain konnte nicht verifiziert werden. Bitte versuchen Sie es erneut.",
          },
        },
        delete_domain: {
          title: "Domain löschen",
          description: {
            prefix: "Möchten Sie wirklich",
            suffix: " löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
          },
          primary_button_text: "Löschen",
          primary_button_loading_text: "Löschen",
          secondary_button_text: "Abbrechen",
          toast: {
            success_title: "Erfolg!",
            success_message: "Domain wurde erfolgreich gelöscht.",
            error_message: "Domain konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.",
          },
        },
      },
    },
    providers: {
      header: "Single Sign-On",
      disabled_message: "Fügen Sie eine verifizierte Domain hinzu, um SSO zu konfigurieren",
      configure: {
        create: "Konfigurieren",
        update: "Bearbeiten",
      },
      switch_alert_modal: {
        title: "SSO-Methode auf {newProviderShortName} umstellen?",
        content:
          "Sie sind dabei, {newProviderLongName} ({newProviderShortName}) zu aktivieren. Diese Aktion deaktiviert automatisch {activeProviderLongName} ({activeProviderShortName}). Benutzer, die sich über {activeProviderShortName} anmelden möchten, können nicht mehr auf die Plattform zugreifen, bis sie zur neuen Methode wechseln. Möchten Sie wirklich fortfahren?",
        primary_button_text: "Umstellen",
        primary_button_text_loading: "Umstellen",
        secondary_button_text: "Abbrechen",
      },
      form_section: {
        title: "Von IdP bereitgestellte Details für {workspaceName}",
      },
      form_action_buttons: {
        saving: "Speichern",
        save_changes: "Änderungen speichern",
        configure_only: "Nur konfigurieren",
        configure_and_enable: "Konfigurieren und aktivieren",
        default: "Speichern",
      },
      setup_details_section: {
        title: "{workspaceName} bereitgestellte Details für Ihren IdP",
        button_text: "Einrichtungsdetails abrufen",
      },
      saml: {
        header: "SAML aktivieren",
        description: "Konfigurieren Sie Ihren SAML-Identitätsanbieter, um Single Sign-On zu aktivieren.",
        configure: {
          title: "SAML aktivieren",
          description:
            "Überprüfen Sie den Besitz einer E-Mail-Domain, um auf Sicherheitsfunktionen einschließlich Single Sign-On zuzugreifen.",
          toast: {
            success_title: "Erfolg!",
            create_success_message: "SAML-Anbieter wurde erfolgreich erstellt.",
            update_success_message: "SAML-Anbieter wurde erfolgreich aktualisiert.",
            error_title: "Fehler!",
            error_message: "SAML-Anbieter konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Web-Details",
            entity_id: {
              label: "Entity ID | Audience | Metadaten-Informationen",
              description:
                "Wir generieren diesen Teil der Metadaten, der diese Plane-App als autorisierten Dienst auf Ihrem IdP identifiziert.",
            },
            callback_url: {
              label: "URL für Single Sign-On",
              description:
                "Wir generieren dies für Sie. Fügen Sie dies in das Feld für die Anmelde-Weiterleitungs-URL Ihres IdP ein.",
            },
            logout_url: {
              label: "URL für Single Logout",
              description:
                "Wir generieren dies für Sie. Fügen Sie dies in das Feld für die Single-Logout-Weiterleitungs-URL Ihres IdP ein.",
            },
          },
          mobile_details: {
            header: "Mobile Details",
            entity_id: {
              label: "Entity ID | Audience | Metadaten-Informationen",
              description:
                "Wir generieren diesen Teil der Metadaten, der diese Plane-App als autorisierten Dienst auf Ihrem IdP identifiziert.",
            },
            callback_url: {
              label: "URL für Single Sign-On",
              description:
                "Wir generieren dies für Sie. Fügen Sie dies in das Feld für die Anmelde-Weiterleitungs-URL Ihres IdP ein.",
            },
            logout_url: {
              label: "URL für Single Logout",
              description:
                "Wir generieren dies für Sie. Fügen Sie dies in das Feld für die Abmelde-Weiterleitungs-URL Ihres IdP ein.",
            },
          },
          mapping_table: {
            header: "Zuordnungsdetails",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "OIDC aktivieren",
        description: "Konfigurieren Sie Ihren OIDC-Identitätsanbieter, um Single Sign-On zu aktivieren.",
        configure: {
          title: "OIDC aktivieren",
          description:
            "Überprüfen Sie den Besitz einer E-Mail-Domain, um auf Sicherheitsfunktionen einschließlich Single Sign-On zuzugreifen.",
          toast: {
            success_title: "Erfolg!",
            create_success_message: "OIDC-Anbieter wurde erfolgreich erstellt.",
            update_success_message: "OIDC-Anbieter wurde erfolgreich aktualisiert.",
            error_title: "Fehler!",
            error_message: "OIDC-Anbieter konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Web-Details",
            origin_url: {
              label: "Origin-URL",
              description:
                "Wir generieren dies für diese Plane-App. Fügen Sie dies als vertrauenswürdigen Ursprung in das entsprechende Feld Ihres IdP ein.",
            },
            callback_url: {
              label: "Weiterleitungs-URL",
              description:
                "Wir generieren dies für Sie. Fügen Sie dies in das Feld für die Anmelde-Weiterleitungs-URL Ihres IdP ein.",
            },
            logout_url: {
              label: "Abmelde-URL",
              description:
                "Wir generieren dies für Sie. Fügen Sie dies in das Feld für die Abmelde-Weiterleitungs-URL Ihres IdP ein.",
            },
          },
          mobile_details: {
            header: "Mobile Details",
            origin_url: {
              label: "Origin-URL",
              description:
                "Wir generieren dies für diese Plane-App. Fügen Sie dies als vertrauenswürdigen Ursprung in das entsprechende Feld Ihres IdP ein.",
            },
            callback_url: {
              label: "Weiterleitungs-URL",
              description:
                "Wir generieren dies für Sie. Fügen Sie dies in das Feld für die Anmelde-Weiterleitungs-URL Ihres IdP ein.",
            },
            logout_url: {
              label: "Abmelde-URL",
              description:
                "Wir generieren dies für Sie. Fügen Sie dies in das Feld für die Abmelde-Weiterleitungs-URL Ihres IdP ein.",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "Der Projektname darf keine Sonderzeichen enthalten.",
  pql: {
    functions: {
      date: {
        now: {
          description: "Aktuelles Datum und Uhrzeit",
        },
        today: {
          description: "Heutiges Datum",
        },
        start_of_day: {
          description: "Beginn des heutigen Tages",
        },
        end_of_day: {
          description: "Ende des heutigen Tages",
        },
        start_of_week: {
          description: "Beginn der aktuellen Woche",
        },
        end_of_week: {
          description: "Ende der aktuellen Woche",
        },
        start_of_month: {
          description: "Beginn des aktuellen Monats",
        },
        end_of_month: {
          description: "Ende des aktuellen Monats",
        },
        start_of_year: {
          description: "Beginn des aktuellen Jahres",
        },
        end_of_year: {
          description: "Ende des aktuellen Jahres",
        },
        days_ago: {
          description: "Datum vor n Tagen",
        },
        days_from_now: {
          description: "Datum in n Tagen",
        },
        weeks_ago: {
          description: "Datum vor n Wochen",
        },
        weeks_from_now: {
          description: "Datum in n Wochen",
        },
        months_ago: {
          description: "Datum vor n Monaten",
        },
        months_from_now: {
          description: "Datum in n Monaten",
        },
      },
      user: {
        current_user: {
          description: "Aktuell angemeldeter Benutzer",
        },
        members_of: {
          description: 'Mitglieder von "project:<id>" oder "teamspace:<id>"',
        },
        workspace_members: {
          description: "Alle Arbeitsbereich-Mitglieder",
        },
      },
      cycle: {
        active_cycle: {
          description: "Heute aktiver Zyklus",
        },
        completed_cycles: {
          description: "Zyklen, deren Enddatum vergangen ist",
        },
        upcoming_cycles: {
          description: "Zyklen, deren Startdatum in der Zukunft liegt",
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
          description: "Fälligkeitsdatum ist vergangen UND Status ist offen",
        },
        has_no_assignee: {
          description: "Arbeitselement hat keinen Verantwortlichen",
        },
        has_no_label: {
          description: "Arbeitselement hat keine Etiketten",
        },
        is_top_level: {
          description: "Kein Unter-Arbeitselement (kein übergeordnetes Element)",
        },
        is_sub_work_item: {
          description: "Ist ein Unter-Arbeitselement (hat ein übergeordnetes Element)",
        },
        is_epic: {
          description: "Epic",
        },
        is_intake: {
          description: "Ist ein Eingangs-Arbeitselement",
        },
        is_draft: {
          description: "Ist ein Entwurf",
        },
        is_archived: {
          description: "Ist archiviert",
        },
        has_children: {
          description: "Hat mindestens ein Unter-Arbeitselement",
        },
        has_start_and_due_dates: {
          description: "Hat sowohl Start- als auch Fälligkeitsdatum",
        },
      },
      relation: {
        linked_to: {
          description: "Arbeitselemente, die mit dem gegebenen Element verknüpft sind",
        },
        blocked_by: {
          description: "Arbeitselemente, die durch das gegebene Element blockiert werden",
        },
        blocks: {
          description: "Arbeitselemente, die das gegebene Element blockieren",
        },
        child_of: {
          description: "Unter-Arbeitselemente des gegebenen Elements",
        },
        parent_of: {
          description: "Übergeordnetes Arbeitselement des gegebenen Elements",
        },
        duplicate_of: {
          description: "Arbeitselemente, die als Duplikate des gegebenen Elements markiert sind",
        },
      },
      history: {
        was_ever: {
          description: "Feld wurde jemals auf diesen Wert gesetzt",
        },
        was: {
          description: "Feld hatte zuvor diesen Wert (wurde geändert)",
        },
        changed_from: {
          description: "Feld wurde von diesem Wert geändert",
        },
        changed_to: {
          description: "Feld wurde auf diesen Wert geändert",
        },
        changed: {
          description: "Feld wurde geändert",
        },
        updated_by: {
          description: "Arbeitselement von diesem Benutzer aktualisiert",
        },
        commented_by: {
          description: "Arbeitselement von diesem Benutzer kommentiert",
        },
        field_changed_by: {
          description: "Feld von diesem Benutzer geändert",
        },
        was_assigned_to: {
          description: "Arbeitselement wurde diesem Benutzer zugewiesen",
        },
        changed_after: {
          description: "Feld nach diesem Datum geändert",
        },
        changed_before: {
          description: "Feld vor diesem Datum geändert",
        },
        field_changed_after: {
          description: "Feld nach diesem Datum geändert",
        },
        field_changed_before: {
          description: "Feld vor diesem Datum geändert",
        },
        changed_to_after: {
          description: "Feld nach diesem Datum auf diesen Wert geändert",
        },
        changed_to_before: {
          description: "Feld vor diesem Datum auf diesen Wert geändert",
        },
        field_changed_between: {
          description: "Feld zwischen diesen Daten geändert",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "navigieren",
      accept: "akzeptieren",
      close: "schließen",
      pick_date: "Datum auswählen",
    },
    placeholder: 'Geben Sie eine Abfrage ein und drücken Sie "ENTER" zum Filtern...',
    error: "Fehler beim Senden der Abfrage. Bitte überprüfen Sie und versuchen Sie es erneut.",
  },
  releases: {
    label: "{count, plural, one {Release} other {Releases}}",
    no_release: "Kein Release",
    unreleased: "Nicht veröffentlicht",
    select_releases: "Releases auswählen",
    overview: "Übersicht",
    scope: "Umfang",
    page_title: {
      scope: "Release – {name} | Umfang",
      scope_fallback: "Release | Umfang",
    },
    properties: "Eigenschaften",
    target_date: "Zieltermin",
    lead: "Verantwortlich",
    release_tag: "Tag",
    labels: "Labels",
    description_placeholder: "Beschreibung hinzufügen...",
    progress: "Fortschritt",
    completed_work_items: "Abgeschlossene Arbeitselemente",
    pending_work_items: "Ausstehende Arbeitselemente",
    cancelled_work_items: "Abgebrochene Arbeitselemente",
    scope_page: {
      work_items: "Arbeitselemente",
      add_work_items: "Arbeitselemente hinzufügen",
      remove_from_release: "Aus Release entfernen",
      empty_state: {
        title: "Keine Arbeitselemente",
        description: "Fügen Sie Arbeitselemente hinzu, um den Umfang des Releases festzulegen.",
      },
      confirm_remove: {
        content: "Möchten Sie dieses Arbeitselement wirklich aus dem Release entfernen? Es bleibt im Projekt.",
        primary_button: {
          default: "Entfernen",
          loading: "Wird entfernt",
        },
      },
    },
    empty_state: {
      title: "Noch kein Umfang",
      description: "Fügen Sie Arbeitselemente zum Release hinzu, um deren Abschluss für dieses Release zu verfolgen.",
      add_scope: "Umfang hinzufügen",
      not_found: {
        title: "Release nicht gefunden",
        description: "Das Release wurde möglicherweise gelöscht.",
        primary_button: "Zurück zu Releases",
      },
    },
    toast: {
      work_items_added: "{count, plural, one {Arbeitselement hinzugefügt} other {Arbeitselemente hinzugefügt}}",
      work_items_error: "Arbeitselemente konnten nicht hinzugefügt werden.",
    },
    count_releases: "{count, plural, one {# Release} other {# Releases}}",
    actions: {
      delete: "Löschen",
    },
    delete_modal: {
      title: "Release löschen",
      content:
        'Möchten Sie den Release "{releaseName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
    },
    settings: {
      heading: {
        title: "Releases",
        description: "Verwalten Sie Projektlieferungen präzise mit Releases.",
      },
      toggle: {
        title: "Releases aktivieren",
        description:
          "Mitglieder des Arbeitsbereichs haben in ihren jeweiligen Projekten Ansichtszugriff auf den Umfang.",
      },
      toasts: {
        enable: {
          loading: "Releases werden aktiviert...",
          success: {
            title: "Releases aktiviert",
            message: "Releases wurden für diesen Arbeitsbereich aktiviert.",
          },
          error: {
            title: "Fehler",
            message: "Releases konnten nicht aktiviert werden. Bitte versuchen Sie es erneut.",
          },
        },
        disable: {
          loading: "Releases werden deaktiviert...",
          success: {
            title: "Releases deaktiviert",
            message: "Releases wurden für diesen Arbeitsbereich deaktiviert.",
          },
          error: {
            title: "Fehler",
            message: "Releases konnten nicht deaktiviert werden. Bitte versuchen Sie es erneut.",
          },
        },
      },
      tabs: {
        tags: "Release-Tags",
        labels: "Labels",
      },
      tags: {
        title: "Release-Tags",
        description: "Kategorisieren und filtern Sie Ihre Releases mit Tags.",
        add: "Tag hinzufügen",
        empty_state: "Noch keine Tags. Erstellen Sie Ihren ersten Tag.",
        errors: {
          version_required: "Version ist erforderlich.",
          version_already_exists: "Ein Tag mit dieser Version existiert bereits.",
          generic: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
        },
        delete_modal: {
          title: "Tag löschen",
          content:
            'Möchten Sie den Tag "{tagVersion}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
        },
        actions: {
          edit: "Tag bearbeiten",
          delete: "Tag löschen",
        },
        toasts: {
          delete: {
            success: "Tag erfolgreich gelöscht.",
            error: "Tag konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.",
          },
        },
      },
      labels: {
        title: "Labels",
        description: "Strukturieren und organisieren Sie Ihre Initiativen mit Labels.",
        add: "Label hinzufügen",
        empty_state: "Noch keine Labels. Erstellen Sie Ihr erstes Label.",
        errors: {
          name_required: "Name ist erforderlich.",
          name_already_exists: "Ein Label mit diesem Namen existiert bereits.",
          generic: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
        },
        modal: {
          name_placeholder: "Labelname",
          pick_color: "Labelfarbe auswählen",
        },
        actions: {
          edit: "Label bearbeiten",
          delete: "Label löschen",
        },
        drag_to_reorder: "Zum Neuordnen ziehen",
        delete_modal: {
          title: "Label löschen",
          content:
            'Möchten Sie das Label "{labelName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
        },
        toasts: {
          delete: {
            success: "Label erfolgreich gelöscht.",
            error: "Label konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.",
          },
        },
      },
    },
  },
  work_item_type_hierarchy: {
    settings: {
      title: "Hierarchie",
      tab_label: "Hierarchie",
      description:
        "Richten Sie Hierarchieebenen ein, um Ihre Arbeit zu organisieren. Jede Ebene definiert eine Eltern-Beziehung mit dem Element direkt darüber und eine Kind-Beziehung mit dem Element direkt darunter. ",
      sidebar_label: "Hierarchie",
      enable_control: {
        title: "Hierarchie aktivieren",
        description: "Erstellen Sie Eltern-Kind-Beziehungen zwischen verschiedenen Arbeitselement-Typen.",
        tooltip: "Sie können die Hierarchie nach der Aktivierung nicht mehr deaktivieren.",
      },
      workspace_work_item_types_disabled_banner: {
        content: "Definieren Sie zuerst Arbeitselement-Typen, um eine neue Hierarchie zu erstellen.",
        cta: "Einstellungen für Arbeitselement-Typen",
      },
    },
    levels: {
      add_level_button: "Hierarchieebene hinzufügen",
      empty_level_placeholder: "Arbeitselement-Typ zu Ebene {level} hinzufügen",
      empty_level_unauthorized: "Keine Arbeitselement-Typen in dieser Ebene gefunden.",
      quick_actions: {
        set_as_default: {
          label: "Als Standard festlegen",
          toast: {
            loading: "Als Standard festlegen...",
            success: {
              title: "Erfolg!",
              message: "Hierarchieebene {level} erfolgreich als Standard festgelegt.",
            },
            error: {
              title: "Fehler!",
              message:
                "Hierarchieebene {level} konnte nicht als Standard festgelegt werden. Bitte versuchen Sie es erneut.",
            },
          },
        },
      },
    },
    add_level_modal: {
      title: "Hierarchieebene hinzufügen",
      description: "Fügen Sie dem Arbeitselement-Typ eine neue Hierarchieebene hinzu.",
      work_item_type: "Arbeitselement-Typ",
      select_placeholder: "Typen auswählen",
      search_placeholder: "Typen suchen",
      empty_state: {
        title: "Alle Arbeitselement-Typen werden verwendet",
        description: "Jeder in diesem Arbeitsbereich definierte Arbeitselement-Typ ist bereits Teil Ihrer Hierarchie.",
      },
      invalid_level_toast: {
        title: "Fehler!",
        message: "{type_name} kann nicht zur Ebene {level} hinzugefügt werden, da dies die Hierarchieregeln verletzt.",
      },
      error_toast: {
        title: "Fehler",
        message: "Arbeitselement-Typ konnte nicht zur Hierarchie hinzugefügt werden.",
      },
    },
    work_item_modal: {
      invalid_work_item_type_create_toast: {
        title: "Fehler!",
        message:
          "Der ausgewählte Arbeitselement-Typ kann nicht zum Erstellen eines neuen Arbeitselements verwendet werden, da dies die Hierarchieregeln verletzt.",
      },
      invalid_work_item_type_update_toast: {
        title: "Fehler!",
        message: "Der Arbeitselement-Typ kann nicht aktualisiert werden, da dies die Hierarchieregeln verletzt.",
      },
    },
    work_item_type_modal: {
      level: "Hierarchieebene",
    },
  },
} as const;
