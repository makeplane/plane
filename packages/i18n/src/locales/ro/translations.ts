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
    we_are_working_on_this_if_you_need_immediate_assistance: "Lucrăm la asta. Dacă aveți nevoie de asistență imediată,",
    reach_out_to_us: "contactați-ne",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our:
      "Altfel, încercați să reîmprospătați pagina din când în când sau vizitați",
    status_page: "pagina noastră de stare",
  },
  sidebar: {
    projects: "Proiecte",
    pages: "Documentație",
    new_work_item: "Activitate nouă",
    home: "Acasă",
    your_work: "Munca ta",
    inbox: "Căsuță de mesaje",
    workspace: "Spațiu de lucru",
    views: "Perspective",
    analytics: "Statistici",
    work_items: "Activități",
    cycles: "Cicluri",
    modules: "Module",
    intake: "Cereri",
    drafts: "Schițe",
    favorites: "Favorite",
    pro: "Pro",
    upgrade: "Treci la versiunea superioară",
    pi_chat: "Plane AI",
    initiatives: "Inițiative",
    teamspaces: "Spații de echipă",
    epics: "Epice",
    upgrade_plan: "Actualizare plan",
    plane_pro: "Plane Pro",
    business: "Business",
    customers: "Clienți",
    recurring_work_items: "Elemente de lucru repetitive",
  },
  auth: {
    common: {
      email: {
        label: "Email",
        placeholder: "nume@companie.ro",
        errors: {
          required: "Email-ul este obligatoriu",
          invalid: "Email-ul nu este valid",
        },
      },
      password: {
        label: "Parolă",
        set_password: "Setează o parolă",
        placeholder: "Introdu parola",
        confirm_password: {
          label: "Confirmă parola",
          placeholder: "Confirmă parola",
        },
        current_password: {
          label: "Parola curentă",
        },
        new_password: {
          label: "Parolă nouă",
          placeholder: "Introdu parola nouă",
        },
        change_password: {
          label: {
            default: "Schimbă parola",
            submitting: "Se schimbă parola",
          },
        },
        errors: {
          match: "Parolele nu se potrivesc",
          empty: "Te rugăm să introduci parola",
          length: "Parola trebuie să aibă mai mult de 8 caractere",
          strength: {
            weak: "Parola este slabă",
            strong: "Parola este puternică",
          },
        },
        submit: "Setează parola",
        toast: {
          change_password: {
            success: {
              title: "Succes!",
              message: "Parola a fost schimbată cu succes.",
            },
            error: {
              title: "Eroare!",
              message: "Ceva nu a funcționat. Te rugăm să încerci din nou.",
            },
          },
        },
      },
      unique_code: {
        label: "Cod unic",
        placeholder: "exemplu-cod-unic",
        paste_code: "Introdu codul trimis pe email",
        requesting_new_code: "Se solicită un cod nou",
        sending_code: "Se trimite codul",
      },
      already_have_an_account: "Ai deja un cont?",
      login: "Autentificare",
      create_account: "Creează un cont",
      new_to_plane: "Ești nou în Plane?",
      back_to_sign_in: "Înapoi la autentificare",
      resend_in: "Retrimite în {seconds} secunde",
      sign_in_with_unique_code: "Autentificare cu cod unic",
      forgot_password: "Ți-ai uitat parola?",
      username: {
        label: "Nume de utilizator",
        placeholder: "Introduceți numele de utilizator",
      },
    },
    sign_up: {
      header: {
        label: "Creează un cont pentru a începe să-ți gestionezi activitatea împreună cu echipa ta.",
        step: {
          email: {
            header: "Înregistrare",
            sub_header: "",
          },
          password: {
            header: "Înregistrare",
            sub_header: "Înregistrează-te folosind o combinație email-parolă.",
          },
          unique_code: {
            header: "Înregistrare",
            sub_header: "Înregistrează-te folosind un cod unic trimis pe adresa de email de mai sus.",
          },
        },
      },
      errors: {
        password: {
          strength: "Setează o parolă puternică pentru a continua",
        },
      },
    },
    sign_in: {
      header: {
        label: "Autentifică-te pentru a începe să-ți gestionezi activitatea împreună cu echipa ta.",
        step: {
          email: {
            header: "Autentificare sau înregistrare",
            sub_header: "",
          },
          password: {
            header: "Autentificare sau înregistrare",
            sub_header: "Folosește combinația email-parolă pentru a te autentifica.",
          },
          unique_code: {
            header: "Autentificare sau înregistrare",
            sub_header: "Autentifică-te folosind un cod unic trimis pe adresa de email de mai sus.",
          },
        },
      },
    },
    forgot_password: {
      title: "Resetează-ți parola",
      description:
        "Introdu adresa de email verificată a contului tău și îți vom trimite un link pentru resetarea parolei.",
      email_sent: "Am trimis link-ul de resetare pe adresa ta de email",
      send_reset_link: "Trimite link-ul de resetare",
      errors: {
        smtp_not_enabled:
          "Se pare că administratorul nu a activat SMTP, nu putem trimite link-ul de resetare a parolei",
      },
      toast: {
        success: {
          title: "Email trimis",
          message:
            "Verifică-ți căsuța de mesaje pentru link-ul de resetare a parolei. Dacă nu apare în câteva minute, verifică folderul de spam.",
        },
        error: {
          title: "Eroare!",
          message: "Ceva nu a funcționat. Te rugăm să încerci din nou.",
        },
      },
    },
    reset_password: {
      title: "Setează o parolă nouă",
      description: "Protejează-ți contul cu o parolă puternică",
    },
    set_password: {
      title: "Protejează-ți contul",
      description: "Setarea parolei te ajută să te autentifici în siguranță",
    },
    sign_out: {
      toast: {
        error: {
          title: "Eroare!",
          message: "Deconectarea a eșuat. Te rugăm să încerci din nou.",
        },
      },
    },
    ldap: {
      header: {
        label: "Continuați cu {ldapProviderName}",
        sub_header: "Introduceți datele de autentificare {ldapProviderName}",
      },
    },
  },
  submit: "Trimite",
  cancel: "Anulează",
  loading: "Se încarcă",
  error: "Eroare",
  success: "Succes",
  warning: "Avertisment",
  info: "Informații",
  close: "Închide",
  yes: "Da",
  no: "Nu",
  ok: "OK",
  name: "Nume",
  description: "Descriere",
  search: "Caută",
  add_member: "Adaugă membru",
  adding_members: "Se adaugă membri",
  remove_member: "Elimină membru",
  add_members: "Adaugă membri",
  adding_member: "Se adaugă membru",
  remove_members: "Elimină membri",
  add: "Adaugă",
  adding: "Se adaugă",
  remove: "Elimină",
  add_new: "Adaugă nou",
  remove_selected: "Elimină selecția",
  first_name: "Prenume",
  last_name: "Nume de familie",
  email: "Email",
  display_name: "Nume afișat",
  role: "Rol",
  timezone: "Fus orar",
  avatar: "Imagine de profil",
  cover_image: "Copertă",
  password: "Parolă",
  change_cover: "Schimbă coperta",
  language: "Limbă",
  saving: "Se salvează",
  save_changes: "Salvează modificările",
  deactivate_account: "Dezactivează contul",
  deactivate_account_description:
    "Când dezactivezi un cont, toate datele și activitățile din acel cont vor fi șterse permanent și nu pot fi recuperate.",
  profile_settings: "Setări profil",
  your_account: "Contul tău",
  security: "Securitate",
  activity: "Activitate",
  activity_empty_state: {
    no_activity: "Nicio activitate încă",
    no_transitions: "Nicio tranziție încă",
    no_comments: "Niciun comentariu încă",
    no_worklogs: "Niciun jurnal de lucru încă",
    no_history: "Niciun istoric încă",
  },
  appearance: "Aspect",
  notifications: "Notificări",
  workspaces: "Spații de lucru",
  create_workspace: "Creează spațiu de lucru",
  invitations: "Invitații",
  summary: "Rezumat",
  assigned: "Responsabil",
  created: "Creat",
  subscribed: "Abonat",
  you_do_not_have_the_permission_to_access_this_page: "Nu ai permisiunea de a accesa această pagină.",
  something_went_wrong_please_try_again: "Ceva nu a funcționat. Te rugăm să încerci din nou.",
  load_more: "Încarcă mai mult",
  select_or_customize_your_interface_color_scheme: "Selectați sau personalizați schema de culori a interfeței dvs.",
  select_the_cursor_motion_style_that_feels_right_for_you:
    "Selectați stilul de mișcare al cursorului care vi se potrivește.",
  theme: "Temă",
  smooth_cursor: "Cursor lin",
  system_preference: "Preferință sistem",
  light: "Luminos",
  dark: "Întunecat",
  light_contrast: "Luminos - contrast ridicat",
  dark_contrast: "Întunecat - contrast ridicat",
  custom: "Temă personalizată",
  select_your_theme: "Selectează tema",
  customize_your_theme: "Personalizează tema",
  background_color: "Culoare fundal",
  text_color: "Culoare text",
  primary_color: "Culoare principală (temă)",
  sidebar_background_color: "Culoare fundal bară laterală",
  sidebar_text_color: "Culoare text bară laterală",
  set_theme: "Setează tema",
  enter_a_valid_hex_code_of_6_characters: "Introdu un cod hexadecimal valid de 6 caractere",
  background_color_is_required: "Culoarea de fundal este obligatorie",
  text_color_is_required: "Culoarea textului este obligatorie",
  primary_color_is_required: "Culoarea principală este obligatorie",
  sidebar_background_color_is_required: "Culoarea de fundal a barei laterale este obligatorie",
  sidebar_text_color_is_required: "Culoarea textului din bara laterală este obligatorie",
  updating_theme: "Se actualizează tema",
  theme_updated_successfully: "Tema a fost actualizată cu succes",
  failed_to_update_the_theme: "Eroare la actualizarea temei",
  email_notifications: "Notificări prin email",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "Rămâi la curent cu activitățile la care ești abonat. Activează această opțiune pentru a primi notificări.",
  email_notification_setting_updated_successfully: "Setarea notificărilor prin email a fost actualizată cu succes",
  failed_to_update_email_notification_setting: "Eroare la actualizarea setării notificărilor prin email",
  notify_me_when: "Notifică-mă când",
  property_changes: "Se modifică proprietățile",
  property_changes_description:
    "Notifică-mă când proprietăți precum responsabilii, prioritatea, estimările sau altele se modifică.",
  state_change: "Se schimbă starea",
  state_change_description: "Notifică-mă când activitățile trec într-o stare diferită",
  issue_completed: "Activitate finalizată",
  issue_completed_description: "Notifică-mă doar când o activitate este finalizată",
  comments: "Comentarii",
  comments_description: "Notifică-mă când cineva lasă un comentariu la o activitate",
  mentions: "Mențiuni",
  mentions_description: "Notifică-mă doar când cineva mă menționează în comentarii sau descriere",
  old_password: "Parolă veche",
  general_settings: "Setări generale",
  sign_out: "Deconectează-te",
  signing_out: "Se deconectează",
  active_cycles: "Cicluri active",
  active_cycles_description:
    "Monitorizează ciclurile din proiecte, urmărește activitățile prioritare și focalizează-te pe ciclurile care necesită atenție.",
  on_demand_snapshots_of_all_your_cycles: "Instantanee la cerere ale tuturor ciclurilor tale",
  upgrade: "Treci la o versiune superioră",
  "10000_feet_view": "Vedere de ansamblu asupra tuturor ciclurilor active.",
  "10000_feet_view_description":
    "Vezi în ansamblu și simultan toate ciclurile active din proiectele tale, fără a naviga individual la fiecare ciclu.",
  get_snapshot_of_each_active_cycle: "Obține un instantaneu al fiecărui ciclu activ.",
  get_snapshot_of_each_active_cycle_description:
    "Urmărește statisticile generale pentru toate ciclurile active, vezi progresul și estimează volumul de muncă în raport cu termenele limită.",
  compare_burndowns: "Compară graficele de finalizare a activităților ",
  compare_burndowns_description:
    "Monitorizează performanța echipelor tale, analizând graficul de finalizare a activităților ale fiecărui ciclu.",
  quickly_see_make_or_break_issues: "Vezi rapid activitățile critice.",
  quickly_see_make_or_break_issues_description:
    "Previzualizează activitățile prioritare pentru fiecare ciclu în funcție de termene. Vizualizează-le pe toate dintr-un singur click.",
  zoom_into_cycles_that_need_attention: "Concentrează-te pe ciclurile care necesită atenție.",
  zoom_into_cycles_that_need_attention_description:
    "Analizează starea oricărui ciclu care nu corespunde așteptărilor, dintr-un singur click.",
  stay_ahead_of_blockers: "Anticipează blocajele.",
  stay_ahead_of_blockers_description:
    "Identifică provocările între proiecte și vezi dependențele între cicluri care altfel nu sunt evidente.",
  analytics: "Statistici",
  workspace_invites: "Invitațiile din spațiul de lucru",
  enter_god_mode: "Activează modul Dumnezeu",
  workspace_logo: "Sigla spațiului de lucru",
  new_issue: "Activitate nouă",
  your_work: "Munca ta",
  drafts: "Schițe",
  projects: "Proiecte",
  views: "Perspective",
  archives: "Arhive",
  settings: "Setări",
  failed_to_move_favorite: "Nu s-a putut muta favorita",
  favorites: "Favorite",
  no_favorites_yet: "Nicio favorită încă",
  create_folder: "Creează dosar",
  new_folder: "Dosar nou",
  favorite_updated_successfully: "Favorita a fost actualizată cu succes",
  favorite_created_successfully: "Favorita a fost creată cu succes",
  folder_already_exists: "Dosarul există deja",
  folder_name_cannot_be_empty: "Numele dosarului nu poate fi gol",
  something_went_wrong: "Ceva nu a funcționat",
  failed_to_reorder_favorite: "Nu s-a putut reordona favorita",
  favorite_removed_successfully: "Favorita a fost eliminată cu succes",
  failed_to_create_favorite: "Nu s-a putut crea favorita",
  failed_to_rename_favorite: "Nu s-a putut redenumi favorita",
  project_link_copied_to_clipboard: "Link-ul proiectului a fost copiat în memoria temporară",
  link_copied: "Link copiat",
  add_project: "Adaugă proiect",
  create_project: "Creează proiect",
  failed_to_remove_project_from_favorites: "Nu s-a putut elimina proiectul din favorite. Încearcă din nou.",
  project_created_successfully: "Proiect creat cu succes",
  project_created_successfully_description: "Proiect creat cu succes. Poți începe să adaugi activități în el.",
  project_name_already_taken: "Numele proiectului este deja folosit.",
  project_identifier_already_taken: "Identificatorul proiectului este deja folosit.",
  project_cover_image_alt: "Coperta proiectului",
  name_is_required: "Numele este obligatoriu",
  title_should_be_less_than_255_characters: "Titlul trebuie să conțină mai puțin de 255 de caractere",
  project_name: "Numele proiectului",
  project_id_must_be_at_least_1_character: "ID-ul proiectului trebuie să conțină cel puțin 1 caracter",
  project_id_must_be_at_most_5_characters: "ID-ul proiectului trebuie să conțină cel mult 5 caractere",
  project_id: "ID-ul Proiectului",
  project_id_tooltip_content: "Te ajută să identifici unic activitățile din proiect. Maxim 50 caractere.",
  description_placeholder: "Descriere",
  only_alphanumeric_non_latin_characters_allowed: "Sunt permise doar caractere alfanumerice și non-latine.",
  project_id_is_required: "ID-ul proiectului este obligatoriu",
  project_id_allowed_char: "Sunt permise doar caractere alfanumerice și non-latine.",
  project_id_min_char: "ID-ul proiectului trebuie să aibă cel puțin 1 caracter",
  project_id_max_char: "ID-ul proiectului trebuie să aibă cel mult {max} caractere",
  project_description_placeholder: "Introdu descrierea proiectului",
  select_network: "Selectează rețeaua",
  lead: "Lider",
  date_range: "Interval de date",
  private: "Privat",
  public: "Public",
  accessible_only_by_invite: "Accesibil doar prin invitație",
  anyone_in_the_workspace_except_guests_can_join:
    "Oricine din spațiul de lucru, cu excepția celor de tip Invitat, se poate alătura",
  creating: "Se creează",
  creating_project: "Se creează proiectul",
  adding_project_to_favorites: "Se adaugă proiectul la favorite",
  project_added_to_favorites: "Proiectul a fost adăugat la favorite",
  couldnt_add_the_project_to_favorites: "Nu s-a putut adăuga proiectul la favorite. Încearcă din nou.",
  removing_project_from_favorites: "Se elimină proiectul din favorite",
  project_removed_from_favorites: "Proiectul a fost eliminat din favorite",
  couldnt_remove_the_project_from_favorites: "Nu s-a putut elimina proiectul din favorite. Încearcă din nou.",
  add_to_favorites: "Adaugă la favorite",
  remove_from_favorites: "Elimină din favorite",
  publish_project: "Publică proiectul",
  publish: "Publică",
  copy_link: "Copiază link-ul",
  leave_project: "Părăsește proiectul",
  join_the_project_to_rearrange: "Alătură-te proiectului pentru a rearanja",
  drag_to_rearrange: "Trage pentru a rearanja",
  congrats: "Felicitări!",
  open_project: "Deschide proiectul",
  issues: "Activități",
  cycles: "Cicluri",
  modules: "Module",
  pages: {
    link_pages: "Conectează pagini",
    show_wiki_pages: "Afișează pagini Wiki",
    link_pages_to: "Conectează pagini la",
    linked_pages: "Pagini conectate",
    no_description: "Această pagină este goală. Scrie ceva aici și vezi-l aici ca acest spațiu rezervat",
    toasts: {
      link: {
        success: {
          title: "Pagini actualizate",
          message: "Pagini actualizate cu succes",
        },
        error: {
          title: "Pagini năo actualizate",
          message: "Pagini năo pot fi actualizate",
        },
      },
      remove: {
        success: {
          title: "Pagini șterse",
          message: "Pagini șterse cu succes",
        },
        error: {
          title: "Pagini năo șterse",
          message: "Pagini năo pot fi șterse",
        },
      },
    },
  },
  intake: "Cereri",
  renew: "Reînnoiește",
  preview: "Previzualizare",
  time_tracking: "Monitorizare timp",
  work_management: "Gestionare muncă",
  projects_and_issues: "Proiecte și activități",
  projects_and_issues_description: "Activează sau dezactivează aceste opțiuni pentru proiect.",
  cycles_description:
    "Stabilește perioade de timp pentru fiecare proiect și ajustează-le după cum este necesar. Un ciclu poate dura 2 săptămâni, următorul 1 săptămână.",
  modules_description: "Organizează munca în sub-proiecte cu lideri și responsabili dedicați.",
  views_description:
    "Salvează sortările, filtrele și opțiunile de afișare personalizate sau distribuie-le echipei tale.",
  pages_description: "Creează și editează conținut liber: note, documente, orice.",
  intake_description:
    "Permite utilizatorilor care nu sunt membri să trimită erori, feedback și sugestii fără a perturba fluxul de lucru.",
  time_tracking_description: "Înregistrează timpul petrecut pe activități și proiecte.",
  work_management_description: "Gestionează-ți munca și proiectele cu ușurință.",
  documentation: "Documentație",
  message_support: "Trimite mesaj la suport",
  contact_sales: "Contactează vânzările",
  hyper_mode: "Mod Hyper",
  keyboard_shortcuts: "Scurtături tastatură",
  whats_new: "Ce e nou?",
  version: "Versiune",
  we_are_having_trouble_fetching_the_updates: "Avem probleme în a prelua actualizările.",
  our_changelogs: "jurnalele noastre de modificări",
  for_the_latest_updates: "pentru cele mai recente actualizări.",
  please_visit: "Te rugăm să vizitezi",
  docs: "Documentație",
  full_changelog: "Jurnal complet al modificărilor",
  support: "Suport",
  forum: "Forum",
  powered_by_plane_pages: "Oferit de Plane Documentație",
  please_select_at_least_one_invitation: "Te rugăm să selectezi cel puțin o invitație.",
  please_select_at_least_one_invitation_description:
    "Te rugăm să selectezi cel puțin o invitație pentru a te alătura spațiului de lucru.",
  we_see_that_someone_has_invited_you_to_join_a_workspace:
    "Se pare că cineva te-a invitat să te alături unui spațiu de lucru",
  join_a_workspace: "Alătură-te unui spațiu de lucru",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description:
    "Se pare că cineva te-a invitat să te alături unui spațiu de lucru",
  join_a_workspace_description: "Alătură-te unui spațiu de lucru",
  accept_and_join: "Acceptă și alătură-te",
  go_home: "Mergi la început",
  no_pending_invites: "Nicio invitație în așteptare",
  you_can_see_here_if_someone_invites_you_to_a_workspace:
    "Aici vei vedea dacă cineva te-a invitat într-un spațiu de lucru",
  back_to_home: "Înapoi la început",
  workspace_name: "nume-spațiu-de-lucru",
  deactivate_your_account: "Dezactivează-ți contul",
  deactivate_your_account_description:
    "Odată dezactivat, nu vei mai putea primi activități sau fi taxat pentru spațiul tău de lucru. Pentru a-ți reactiva contul, vei avea nevoie de o invitație către un spațiu de lucru la această adresă de email.",
  deactivating: "Se dezactivează",
  confirm: "Confirmă",
  confirming: "Se confirmă",
  draft_created: "Schiță creată",
  issue_created_successfully: "Activitate creată cu succes",
  draft_creation_failed: "Crearea schiței a eșuat",
  issue_creation_failed: "Crearea activității a eșuat",
  draft_issue: "Schiță activitate",
  issue_updated_successfully: "Activitate actualizată cu succes",
  issue_could_not_be_updated: "Activitatea nu a putut fi actualizată",
  create_a_draft: "Creează o schiță",
  save_to_drafts: "Salvează în schițe",
  save: "Salvează",
  update: "Actualizează",
  updating: "Se actualizează",
  create_new_issue: "Creează activate nouă",
  editor_is_not_ready_to_discard_changes: "Editorul nu este pregătit să renunțe la modificări",
  failed_to_move_issue_to_project: "Nu s-a putut muta activitatea în proiect",
  create_more: "Creează mai multe",
  add_to_project: "Adaugă la proiect",
  discard: "Renunță",
  duplicate_issue_found: "Activitate duplicată găsită",
  duplicate_issues_found: "Activități duplicate găsite",
  no_matching_results: "Nu există rezultate potrivite",
  title_is_required: "Titlul este obligatoriu",
  title: "Titlu",
  state: "Stare",
  transition: "Tranziție",
  history: "Istoric",
  priority: "Prioritate",
  none: "Niciuna",
  urgent: "Urgentă",
  high: "Importantă",
  medium: "Medie",
  low: "Scăzută",
  members: "Membri",
  assignee: "Responsabil",
  assignees: "Responsabili",
  subscriber: "{count, plural, one{# Abonat} few{# Abonați} other{# Abonați}}",
  you: "Tu",
  labels: "Etichete",
  create_new_label: "Creează etichetă nouă",
  label_name: "Nume etichetă",
  failed_to_create_label: "Nu s-a putut crea eticheta. Vă rugăm să încercați din nou.",
  start_date: "Data de început",
  end_date: "Data de sfârșit",
  due_date: "Data limită",
  estimate: "Estimare",
  change_parent_issue: "Schimbă activitatea părinte",
  remove_parent_issue: "Elimină activitatea părinte",
  add_parent: "Adaugă părinte",
  loading_members: "Se încarcă membrii",
  view_link_copied_to_clipboard: "Link-ul de perspectivă a fost copiat în memoria temporară.",
  required: "Obligatoriu",
  optional: "Opțional",
  Cancel: "Anulează",
  edit: "Editează",
  archive: "Arhivează",
  restore: "Restaurează",
  open_in_new_tab: "Deschide într-un nou tab",
  delete: "Șterge",
  deleting: "Se șterge",
  make_a_copy: "Creează o copie",
  move_to_project: "Mută în proiect",
  good: "Bună",
  morning: "dimineața",
  afternoon: "după-amiaza",
  evening: "seara",
  show_all: "Arată tot",
  show_less: "Arată mai puțin",
  no_data_yet: "Nicio dată încă",
  syncing: "Se sincronizează",
  add_work_item: "Adaugă activitate",
  advanced_description_placeholder: "Apasă '/' pentru comenzi",
  create_work_item: "Creează activitate",
  attachments: "Atașamente",
  declining: "Se refuză",
  declined: "Refuzat",
  decline: "Refuză",
  unassigned: "Fără responsabil",
  work_items: "Activități",
  add_link: "Adaugă link",
  points: "Puncte",
  no_assignee: "Fără responsabil",
  no_assignees_yet: "Niciun responsabil încă",
  no_labels_yet: "Nicio etichetă încă",
  ideal: "Ideal",
  current: "Curent",
  no_matching_members: "Niciun membru potrivit",
  leaving: "Se părăsește",
  removing: "Se elimină",
  leave: "Părăsește",
  refresh: "Reîncarcă",
  refreshing: "Se reîncarcă",
  refresh_status: "Reîncarcă statusul",
  prev: "Înapoi",
  next: "Înainte",
  re_generating: "Se regenerează",
  re_generate: "Regenerează",
  re_generate_key: "Regenerează cheia",
  export: "Exportă",
  member: "{count, plural, one{# membru} other{# membri}}",
  new_password_must_be_different_from_old_password: "Parola nouă trebuie să fie diferită de parola veche",
  project_view: {
    sort_by: {
      created_at: "Creat la",
      updated_at: "Actualizat la",
      name: "Nume",
    },
  },
  upgrade_request: "Solicitați administratorului spațiului de lucru să facă upgrade.",
  copied_to_clipboard: "Copiat în clipboard",
  copied_to_clipboard_description: "URL-ul a fost copiat cu succes în clipboard",
  toast: {
    success: "Succes!",
    error: "Eroare!",
  },
  links: {
    toasts: {
      created: {
        title: "Link creat",
        message: "Link-ul a fost creat cu succes",
      },
      not_created: {
        title: "Link-ul nu a fost creat",
        message: "Link-ul nu a putut fi creat",
      },
      updated: {
        title: "Link actualizat",
        message: "Link-ul a fost actualizat cu succes",
      },
      not_updated: {
        title: "Link-ul nu a fost actualizat",
        message: "Link-ul nu a putut fi actualizat",
      },
      removed: {
        title: "Link eliminat",
        message: "Link-ul a fost eliminat cu succes",
      },
      not_removed: {
        title: "Link-ul nu a fost eliminat",
        message: "Link-ul nu a putut fi eliminat",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "Ghid de pornire rapidă",
      not_right_now: "Nu acum",
      create_project: {
        title: "Creează un proiect",
        description: "Majoritatea lucrurilor încep cu un proiect în Plane.",
        cta: "Începe acum",
      },
      invite_team: {
        title: "Invită-ți echipa",
        description: "Construiește, livrează și gestionează împreună cu colegii.",
        cta: "Invită-i",
      },
      configure_workspace: {
        title: "Configurează-ți spațiul de lucru.",
        description: "Activează sau dezactivează opțiuni sau mergi mai departe.",
        cta: "Configurează acest spațiu de lucru",
      },
      personalize_account: {
        title: "Personalizează Plane.",
        description: "Alege-ți poza de profil, culorile și multe altele.",
        cta: "Personalizează acum",
      },
      widgets: {
        title: "Este liniște fără mini-aplicații, activează-le",
        description:
          "Se pare că toate mini-aplicațiile tale sunt dezactivate. Activează-le acum pentru a-ți îmbunătăți experiența!",
        primary_button: {
          text: "Gestionează mini-aplicațiile",
        },
      },
    },
    quick_links: {
      empty: "Salvează link-uri către elementele utile pe care vrei să le ai la îndemână.",
      add: "Adaugă link rapid",
      title: "Link rapid",
      title_plural: "Linkuri rapide",
    },
    recents: {
      title: "Recente",
      empty: {
        project: "Proiectele vizitate recent vor apărea aici.",
        page: "Documentele din Documentație vizitate recent vor apărea aici.",
        issue: "Activitățile vizitate recent vor apărea aici.",
        default: "Nu ai nimic recent încă.",
      },
      filters: {
        all: "Toate",
        projects: "Proiecte",
        pages: "Documentație",
        issues: "Activități",
      },
    },
    new_at_plane: {
      title: "Noutăți în Plane",
    },
    quick_tutorial: {
      title: "Tutorial rapid",
    },
    widget: {
      reordered_successfully: "Mini-aplicație reordonată cu succes.",
      reordering_failed: "Eroare la reordonarea mini-aplicației.",
    },
    manage_widgets: "Gestionează mini-aplicațiile",
    title: "Acasă",
    star_us_on_github: "Dă-ne o stea pe GitHub",
    business_trial_banner: {
      title: "Perioada de probă de 14 zile pentru planul Business este activă!",
      description:
        "Explorați toate funcțiile Business. Când sunteți pregătit, alegeți să vă abonați. Nu veți fi facturat automat.",
      trial_ends_today: "Perioada de probă se încheie astăzi",
      trial_ends_in_days: "Perioada de probă se încheie în {days, plural, one {# zi} other {# zile}}",
      start_subscription: "Începe abonamentul",
      explore_business_features: "Explorează funcțiile Business",
    },
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "URL-ul nu este valid",
        placeholder: "Tastează sau lipește un URL",
      },
      title: {
        text: "Titlu afișat",
        placeholder: "Cum vrei să se vadă acest link",
      },
    },
  },
  common: {
    all: "Toate",
    no_items_in_this_group: "Nu există elemente în acest grup",
    drop_here_to_move: "Eliberează aici pentru a muta",
    states: "Stări",
    state: "Stare",
    state_groups: "Grupuri de stări",
    state_group: "Grup de stare",
    priorities: "Priorități",
    priority: "Prioritate",
    team_project: "Proiect de echipă",
    project: "Proiect",
    cycle: "Ciclu",
    cycles: "Cicluri",
    module: "Modul",
    modules: "Module",
    labels: "Etichete",
    label: "Etichetă",
    assignees: "Responsabili",
    assignee: "Responsabil",
    created_by: "Creat de",
    none: "Niciuna",
    link: "Link",
    estimates: "Estimări",
    estimate: "Estimare",
    created_at: "Creat la",
    updated_at: "Actualizat la",
    completed_at: "Finalizat la",
    layout: "Aspect",
    filters: "Filtre",
    display: "Afișare",
    load_more: "Încarcă mai mult",
    activity: "Activitate",
    analytics: "Analitice",
    dates: "Date",
    success: "Succes!",
    something_went_wrong: "Ceva a mers greșit",
    error: {
      label: "Eroare!",
      message: "A apărut o eroare. Te rugăm să încerci din nou.",
    },
    group_by: "Grupează după",
    epic: "Sarcină majoră",
    epics: "Epice",
    work_item: "Activitate",
    work_items: "Activități",
    sub_work_item: "Sub-activitate",
    add: "Adaugă",
    warning: "Avertisment",
    updating: "Se actualizează",
    adding: "Se adaugă",
    update: "Actualizează",
    creating: "Se creează",
    create: "Creează",
    cancel: "Anulează",
    description: "Descriere",
    title: "Titlu",
    attachment: "Atașament",
    general: "General",
    features: "Funcționalități",
    automation: "Automatizare",
    project_name: "Nume proiect",
    project_id: "ID Proiect",
    project_timezone: "Fus orar proiect",
    created_on: "Creat la",
    updated_on: "Actualizat la",
    completed_on: "Completed on",
    update_project: "Actualizează proiectul",
    identifier_already_exists: "Identificatorul există deja",
    add_more: "Adaugă mai mult",
    defaults: "Implicit",
    add_label: "Adaugă etichetă",
    customize_time_range: "Personalizează intervalul de timp",
    loading: "Se încarcă",
    attachments: "Atașamente",
    property: "Proprietate",
    properties: "Proprietăți",
    parent: "Părinte",
    page: "Document",
    remove: "Elimină",
    archiving: "Se arhivează",
    archive: "Arhivează",
    access: {
      public: "Public",
      private: "Privat",
    },
    done: "Gata",
    sub_work_items: "Sub-activități",
    comment: "Comentariu",
    workspace_level: "La nivel de spațiu de lucru",
    order_by: {
      label: "Ordonează după",
      manual: "Manual",
      last_created: "Ultima creată",
      last_updated: "Ultima actualizată",
      start_date: "Data de început",
      due_date: "Data limită",
      asc: "Crescător",
      desc: "Descrescător",
      updated_on: "Actualizat la",
    },
    sort: {
      asc: "Crescător",
      desc: "Descrescător",
      created_on: "Creată la",
      updated_on: "Actualizată la",
    },
    comments: "Comentarii",
    updates: "Actualizări",
    additional_updates: "Actualizări suplimentare",
    clear_all: "Șterge tot",
    copied: "Copiat!",
    link_copied: "Link copiat!",
    link_copied_to_clipboard: "Link-ul a fost copiat în memoria temporară",
    copied_to_clipboard: "Link-ul activității copiat în memoria temporară",
    branch_name_copied_to_clipboard: "Nume de ramură copiat în memoria temporară",
    is_copied_to_clipboard: "Activitatea a fost copiată în memoria temporară",
    no_links_added_yet: "Niciun link adăugat încă",
    add_link: "Adaugă link",
    links: "Linkuri",
    go_to_workspace: "Mergi la spațiul de lucru",
    progress: "Progres",
    optional: "Opțional",
    join: "Alătură-te",
    go_back: "Înapoi",
    continue: "Continuă",
    resend: "Retrimite",
    relations: "Relații",
    errors: {
      default: {
        title: "Eroare!",
        message: "Ceva a funcționat greșit. Te rugăm să încerci din nou.",
      },
      required: "Acest câmp este obligatoriu",
      entity_required: "{entity} este obligatoriu",
      restricted_entity: "{entity} este restricționat",
    },
    update_link: "Actualizează link-ul",
    attach: "Atașează",
    create_new: "Creează nou",
    add_existing: "Adaugă existent",
    type_or_paste_a_url: "Tastează sau lipește un URL",
    url_is_invalid: "URL-ul nu este valid",
    display_title: "Titlu afișat",
    link_title_placeholder: "Cum vrei să se vadă acest link",
    url: "URL",
    side_peek: "Previzualizare laterală",
    modal: "Fereastră modală",
    full_screen: "Ecran complet",
    close_peek_view: "Închide previzualizarea",
    toggle_peek_view_layout: "Comută aspectul previzualizării",
    options: "Opțiuni",
    duration: "Durată",
    today: "Astăzi",
    week: "Săptămână",
    month: "Lună",
    quarter: "Trimestru",
    press_for_commands: "Apasă '/' pentru comenzi",
    click_to_add_description: "Apasă pentru a adăuga descriere",
    search: {
      label: "Caută",
      placeholder: "Tastează pentru a căuta",
      no_matches_found: "Nu s-au găsit rezultate",
      no_matching_results: "Nicio potrivire găsită",
    },
    actions: {
      edit: "Editează",
      make_a_copy: "Fă o copie",
      open_in_new_tab: "Deschide într-un nou tab",
      copy_link: "Copiază link-ul",
      copy_branch_name: "Copiază numele ramurii",
      archive: "Arhivează",
      restore: "Restaurează",
      delete: "Șterge",
      remove_relation: "Elimină relația",
      subscribe: "Abonează-te",
      unsubscribe: "Dezabonează-te",
      clear_sorting: "Șterge sortarea",
      show_weekends: "Arată sfârșiturile de săptămână",
      enable: "Activează",
      disable: "Dezactivează",
    },
    name: "Nume",
    discard: "Renunță",
    confirm: "Confirmă",
    confirming: "Se confirmă",
    read_the_docs: "Citește documentația",
    default: "Implicit",
    active: "Activ",
    enabled: "Activat",
    disabled: "Dezactivat",
    mandate: "Împuternicire",
    mandatory: "Obligatoriu",
    yes: "Da",
    no: "Nu",
    please_wait: "Te rog așteaptă",
    enabling: "Se activează",
    disabling: "Se dezactivează",
    beta: "Testare",
    or: "sau",
    next: "Înainte",
    back: "Înapoi",
    cancelling: "Se anulează",
    configuring: "Se configurează",
    clear: "Șterge",
    import: "Importă",
    connect: "Conectează",
    authorizing: "Se autorizează",
    processing: "Se procesează",
    no_data_available: "Nicio dată disponibilă",
    from: "de la {name}",
    authenticated: "Autentificat",
    select: "Selectează",
    upgrade: "Treci la o versiune superioră",
    add_seats: "Adaugă locuri",
    projects: "Proiecte",
    workspace: "Spațiu de lucru",
    workspaces: "Spații de lucru",
    team: "Echipă",
    teams: "Echipe",
    entity: "Entitate",
    entities: "Entități",
    task: "Sarcină",
    tasks: "Sarcini",
    section: "Secțiune",
    sections: "Secțiuni",
    edit: "Editează",
    connecting: "Se conectează",
    connected: "Conectat",
    disconnect: "Deconectează",
    disconnecting: "Se deconectează",
    installing: "Se instalează",
    install: "Instalează",
    reset: "Resetează",
    live: "Live",
    change_history: "Istoric modificări",
    coming_soon: "În curând",
    member: "Membru",
    members: "Membri",
    you: "Tu",
    upgrade_cta: {
      higher_subscription: "Treci la un abonament superior",
      talk_to_sales: "Discută cu vânzările",
    },
    category: "Categorie",
    categories: "Categorii",
    saving: "Se salvează",
    save_changes: "Salvează modificările",
    delete: "Șterge",
    deleting: "Se șterge",
    pending: "În așteptare",
    invite: "Invită",
    view: "Vizualizează",
    deactivated_user: "Utilizator dezactivat",
    apply: "Aplică",
    applying: "Aplicând",
    users: "Utilizatori",
    admins: "Administratori",
    guests: "Invitați",
    on_track: "Pe drumul cel bun",
    off_track: "În afara traiectoriei",
    at_risk: "În pericol",
    timeline: "Cronologie",
    completion: "Finalizare",
    upcoming: "Viitor",
    completed: "Finalizat",
    in_progress: "În desfășurare",
    planned: "Planificat",
    paused: "Pauzat",
    no_of: "Nr. de {entity}",
    resolved: "Rezolvat",
    worklogs: "Jurnale de lucru",
    project_updates: "Actualizări proiect",
    overview: "Prezentare generală",
    workflows: "Fluxuri de lucru",
    templates: "Șabloane",
    members_and_teamspaces: "Membri și spații de echipă",
    open_in_full_screen: "Deschide {page} pe tot ecranul",
    details: "Detalii",
    project_structure: "Structura proiectului",
    custom_properties: "Proprietăți personalizate",
  },
  chart: {
    x_axis: "axa-X",
    y_axis: "axa-Y",
    metric: "Indicator",
  },
  form: {
    title: {
      required: "Titlul este obligatoriu",
      max_length: "Titlul trebuie să conțină mai puțin de {length} caractere",
    },
  },
  entity: {
    grouping_title: "Grupare {entity}",
    priority: "Prioritate {entity}",
    all: "Toate {entity}",
    drop_here_to_move: "Trage aici pentru a muta {entity}",
    delete: {
      label: "Șterge {entity}",
      success: "{entity} a fost ștearsă cu succes",
      failed: "Ștergerea {entity} a eșuat",
    },
    update: {
      failed: "Actualizarea {entity} a eșuat",
      success: "{entity} a fost actualizată cu succes",
    },
    link_copied_to_clipboard: "Link-ul {entity} a fost copiat în memoria temporară",
    fetch: {
      failed: "Eroare la preluarea {entity}",
    },
    add: {
      success: "{entity} a fost adăugată cu succes",
      failed: "Eroare la adăugarea {entity}",
    },
    remove: {
      success: "{entity} a fost eliminată cu succes",
      failed: "Eroare la eliminarea {entity}",
    },
  },
  epic: {
    all: "Toate Sarcinile majore",
    label: "{count, plural, one {Sarcină majoră} other {Sarcini majore}}",
    new: "Sarcină majoră",
    adding: "Se adaugă sarcină majoră",
    create: {
      success: "Sarcină majoră creată cu succes",
    },
    add: {
      press_enter: "Apasă 'Enter' pentru a adăuga o altă sarcină majoră",
      label: "Adaugă sarcină majoră",
    },
    title: {
      label: "Titlu sarcină majoră",
      required: "Titlul sarcinii majore este obligatoriu.",
    },
    archive: {
      description: `Doar sarcinile majore finalizate sau anulate
pot fi arhivate`,
      label: "Arhivează sarcina majoră",
      confirm_message:
        "Ești sigur că vrei să arhivezi sarcina majoră? Toate sarcinile majore arhivate pot fi restaurate mai târziu.",
      success: {
        label: "Arhivare reușită",
        message: "Arhivele tale se găsesc în arhivele proiectului.",
      },
      failed: {
        message: "Sarcina majoră nu a putut fi arhivată. Te rugăm să încerci din nou.",
      },
    },
  },
  issue: {
    label: "{count, plural, one {Activitate} other {Activități}}",
    all: "Toate activitățile",
    edit: "Editează activitatea",
    title: {
      label: "Titlul activității",
      required: "Titlul activității este obligatoriu.",
    },
    add: {
      press_enter: "Apasă 'Enter' pentru a adăuga o altă activitate",
      label: "Adaugă activitate",
      cycle: {
        failed: "Activitatea nu a putut fi adăugată în ciclu. Te rugăm să încerci din nou.",
        success: "{count, plural, one {Activitate} other {Activități}} adăugată(e) în ciclu cu succes.",
        loading: "Se adaugă {count, plural, one {activitate} other {activități}} în ciclu",
      },
      assignee: "Adaugă responsabili",
      start_date: "Adaugă data de început",
      due_date: "Adaugă termenul limită",
      parent: "Adaugă activitate părinte",
      sub_issue: "Adaugă sub-activitate",
      relation: "Adaugă relație",
      link: "Adaugă link",
      existing: "Adaugă activitate existentă",
    },
    remove: {
      label: "Elimină activitatea",
      cycle: {
        loading: "Se elimină activitatea din ciclu",
        success: "Activitatea a fost eliminată din ciclu cu succes.",
        failed: "Activitatea nu a putut fi eliminată din ciclu. Te rugăm să încerci din nou.",
      },
      module: {
        loading: "Se elimină activitatea din modul",
        success: "Activitatea a fost eliminată din modul cu succes.",
        failed: "Activitatea nu a putut fi eliminată din modul. Te rugăm să încerci din nou.",
      },
      parent: {
        label: "Elimină activitatea părinte",
      },
    },
    new: "Activitate nouă",
    adding: "Se adaugă activitatea",
    create: {
      success: "Activitatea a fost creată cu succes",
    },
    priority: {
      urgent: "Urgentă",
      high: "Ridicată",
      medium: "Medie",
      low: "Scăzută",
    },
    display: {
      properties: {
        label: "Afișează proprietățile",
        id: "ID",
        issue_type: "Tipul activității",
        sub_issue_count: "Număr de sub-activități",
        attachment_count: "Număr de atașamente",
        created_on: "Creată la",
        sub_issue: "Sub-activitate",
        work_item_count: "Număr de activități",
      },
      extra: {
        show_sub_issues: "Afișează sub-activitățile",
        show_empty_groups: "Afișează grupurile goale",
      },
    },
    layouts: {
      ordered_by_label: "Această vizualizare este ordonată după",
      list: "Listă",
      kanban: "Tablă",
      calendar: "Calendar",
      spreadsheet: "Tabel",
      gantt: "Cronologic",
      title: {
        list: "Vizualizare tip Listă",
        kanban: "Vizualizare tip Tablă",
        calendar: "Vizualizare tip Calendar",
        spreadsheet: "Vizualizare tip Tabel",
        gantt: "Vizualizare tip Cronologic",
      },
    },
    states: {
      active: "Active",
      backlog: "Restante",
    },
    comments: {
      placeholder: "Adaugă comentariu",
      switch: {
        private: "Comută pe comentariu privat",
        public: "Comută pe comentariu public",
      },
      create: {
        success: "Comentariu adăugat cu succes",
        error: "Adăugarea comentariului a eșuat. Te rugăm să încerci mai târziu.",
      },
      update: {
        success: "Comentariu actualizat cu succes",
        error: "Actualizarea comentariului a eșuat. Te rugăm să încerci mai târziu.",
      },
      remove: {
        success: "Comentariu șters cu succes",
        error: "Ștergerea comentariului a eșuat. Te rugăm să încerci mai târziu.",
      },
      upload: {
        error: "Încărcarea fișierului a eșuat. Te rugăm să încerci mai târziu.",
      },
      copy_link: {
        success: "Linkul comentariului a fost copiat în clipboard",
        error: "Eroare la copierea linkului comentariului. Încercați din nou mai târziu.",
      },
    },
    empty_state: {
      issue_detail: {
        title: "Activitatea nu există",
        description: "Activitatea căutată nu există, a fost arhivată sau ștearsă.",
        primary_button: {
          text: "Vezi alte activități",
        },
      },
    },
    sibling: {
      label: "Activități înrudite",
    },
    archive: {
      description: `Doar activitățile finalizate sau anulate
pot fi arhivate`,
      label: "Arhivează activitatea",
      confirm_message:
        "Ești sigur că vrei să arhivezi această activitate? Toate activitățile arhivate pot fi restaurate ulterior.",
      success: {
        label: "Arhivare reușită",
        message: "Arhivele tale pot fi găsite în arhiva proiectului.",
      },
      failed: {
        message: "Activitatea nu a putut fi arhivată. Te rugăm să încerci din nou.",
      },
    },
    restore: {
      success: {
        title: "Restaurare reușită",
        message: "Activitatea poate fi găsită în lista de activități ale proiectului.",
      },
      failed: {
        message: "Activitatea nu a putut fi restaurată. Te rugăm să încerci din nou.",
      },
    },
    relation: {
      relates_to: "Este legată de",
      duplicate: "Duplicată a",
      blocked_by: "Blocată de",
      blocking: "Blochează",
      start_before: "Începe înainte",
      start_after: "Începe după",
      finish_before: "Termină înainte",
      finish_after: "Termină după",
      implements: "Implementează",
      implemented_by: "Implementat de",
    },
    copy_link: "Copiază link-ul activității",
    delete: {
      label: "Șterge activitatea",
      error: "Eroare la ștergerea activității",
    },
    subscription: {
      actions: {
        subscribed: "Abonarea la activitate realizată cu succes",
        unsubscribed: "Dezabonarea de la activitate realizată cu succes",
      },
    },
    select: {
      error: "Selectează cel puțin o activitate",
      empty: "Nicio activitate selectată",
      add_selected: "Adaugă activitățile selectate",
      select_all: "Selectează tot",
      deselect_all: "Deselează tot",
    },
    open_in_full_screen: "Deschide activitatea pe tot ecranul",
    vote: {
      click_to_upvote: "Clic pentru a vota pozitiv",
      click_to_downvote: "Clic pentru a vota negativ",
      click_to_view_upvotes: "Clic pentru a vedea voturile pozitive",
      click_to_view_downvotes: "Clic pentru a vedea voturile negative",
    },
  },
  attachment: {
    error: "Fișierul nu a putut fi atașat. Încearcă să încarci din nou.",
    only_one_file_allowed: "Se poate încărca doar un fișier o dată.",
    file_size_limit: "Fișierul trebuie să aibă {size}MB sau mai puțin.",
    drag_and_drop: "Trage și plasează oriunde pentru a încărca",
    delete: "Șterge atașamentul",
  },
  label: {
    select: "Selectează eticheta",
    create: {
      success: "Etichetă creată cu succes",
      failed: "Crearea etichetei a eșuat",
      already_exists: "Eticheta există deja",
      type: "Tastează pentru a adăuga o etichetă nouă",
    },
  },
  sub_work_item: {
    update: {
      success: "Sub-activitatea a fost actualizată cu succes",
      error: "Eroare la actualizarea sub-activității",
    },
    remove: {
      success: "Sub-activitatea a fost eliminată cu succes",
      error: "Eroare la eliminarea sub-activității",
    },
    empty_state: {
      sub_list_filters: {
        title: "Nu ai sub-elemente de lucru care corespund filtrelor pe care le-ai aplicat.",
        description: "Pentru a vedea toate sub-elementele de lucru, șterge toate filtrele aplicate.",
        action: "Șterge filtrele",
      },
      list_filters: {
        title: "Nu ai elemente de lucru care corespund filtrelor pe care le-ai aplicat.",
        description: "Pentru a vedea toate elementele de lucru, șterge toate filtrele aplicate.",
        action: "Șterge filtrele",
      },
    },
  },
  view: {
    label: "{count, plural, one {Perspectivă} other {Perspective}}",
    create: {
      label: "Creează perspectivă",
    },
    update: {
      label: "Actualizează perspectiva",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "În așteptare",
        description: "În așteptare",
      },
      declined: {
        title: "Respinse",
        description: "Respinse",
      },
      snoozed: {
        title: "Amânate",
        description: "{days, plural, one{# zi} other{# zile}} rămase",
      },
      accepted: {
        title: "Acceptate",
        description: "Acceptate",
      },
      duplicate: {
        title: "Duplicate",
        description: "Duplicate",
      },
    },
    modals: {
      decline: {
        title: "Respinge activitatea",
        content: "Ești sigur că vrei să respingi activitatea {value}?",
      },
      delete: {
        title: "Șterge activitatea",
        content: "Ești sigur că vrei să ștergi activitatea {value}?",
        success: "Activitatea a fost ștersă cu succes",
      },
    },
    errors: {
      snooze_permission: "Doar administratorii proiectului pot amâna/dezactiva amânarea activităților",
      accept_permission: "Doar administratorii proiectului pot accepta activități",
      decline_permission: "Doar administratorii proiectului pot respinge activități",
    },
    actions: {
      accept: "Acceptă",
      decline: "Respinge",
      snooze: "Amână",
      unsnooze: "Dezactivează amânarea",
      copy: "Copiază link-ul activității",
      delete: "Șterge",
      open: "Deschide activitatea",
      mark_as_duplicate: "Marchează ca duplicat",
      move: "Mută {value} în activitățile proiectului",
    },
    source: {
      "in-app": "în aplicație",
    },
    order_by: {
      created_at: "Creată la",
      updated_at: "Actualizată la",
      id: "ID",
    },
    label: "Cereri",
    page_label: "{workspace} - Cereri",
    modal: {
      title: "Creează o cerere în Cereri",
    },
    tabs: {
      open: "Deschise",
      closed: "Închise",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "Nicio cerere deschisă",
        description: "Găsește aici cererile primite. Creează o cerere nouă.",
      },
      sidebar_closed_tab: {
        title: "Nicio cerere închisă",
        description: "Toate cererile, fie acceptate, fie respinse, pot fi găsite aici.",
      },
      sidebar_filter: {
        title: "Nicio cerere gasită",
        description: "Nicio cerere nu se potrivește cu filtrul aplicat în Cereri. Creează o cerere nouă.",
      },
      detail: {
        title: "Selectează o cerere pentru a-i vedea detaliile.",
      },
    },
  },
  workspace_creation: {
    heading: "Creează spațiul tău de lucru",
    subheading: "Pentru a începe să folosești Plane, trebuie să creezi sau să te alături unui spațiu de lucru.",
    form: {
      name: {
        label: "Denumește-ți spațiul de lucru",
        placeholder: "Cel mai bine este să alegi ceva familiar și ușor de recunoscut.",
      },
      url: {
        label: "Setează URL-ul spațiului de lucru",
        placeholder: "Tastează sau lipește un URL",
        edit_slug: "Poți edita doar identificatorul URL-ului",
      },
      organization_size: {
        label: "Câți oameni vor folosi acest spațiu de lucru?",
        placeholder: "Selectează un interval",
      },
    },
    errors: {
      creation_disabled: {
        title: "Doar administratorul instanței poate crea spații de lucru",
        description:
          "Dacă știi adresa de email a administratorului instanței tale, apasă butonul de mai jos pentru a-l contacta.",
        request_button: "Solicită administratorul instanței",
      },
      validation: {
        name_alphanumeric: "Numele spațiilor de lucru pot conține doar (' '), ('-'), ('_') și caractere alfanumerice.",
        name_length: "Limitează numele la 80 de caractere.",
        url_alphanumeric: "URL-urile pot conține doar ('-') și caractere alfanumerice.",
        url_length: "Limitează URL-ul la 48 de caractere.",
        url_already_taken: "URL-ul spațiului de lucru este deja folosit!",
      },
    },
    request_email: {
      subject: "Solicitare creare spațiu de lucru nou",
      body: `Salut administrator(i) instanței,

Vă rog să creați un nou spațiu de lucru cu URL-ul [/workspace-name] pentru [scopul creării spațiului de lucru].

Mulțumesc,
{firstName} {lastName}
{email}`,
    },
    button: {
      default: "Creează spațiu de lucru",
      loading: "Se creează spațiul de lucru",
    },
    toast: {
      success: {
        title: "Succes",
        message: "Spațiul de lucru a fost creat cu succes",
      },
      error: {
        title: "Eroare",
        message: "Spațiul de lucru nu a putut fi creat. Te rugăm să încerci din nou.",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "Prezentare generală a proiectelor, activităților și statisticilor tale",
        description:
          "Bine ai venit în Plane, suntem încântați să te avem aici. Creează primul tău proiect și urmărește activitățile, iar această pagină se va transforma într-un spațiu care te ajută să progresezi. Administratorii vor vedea și elementele care ajută echipa lor să progreseze.",
        primary_button: {
          text: "Creează primul tău proiect",
          comic: {
            title: "Totul începe cu un proiect în Plane",
            description:
              "Un proiect poate fi planul de dezvoltare a unui produs, o campanie de marketing sau lansarea unei noi mașini.",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "Statistici",
    page_label: "{workspace} - Statistici",
    open_tasks: "Total activități deschise",
    error: "A apărut o eroare la preluarea datelor.",
    work_items_closed_in: "Activități finalizate în",
    selected_projects: "Proiecte selectate",
    total_members: "Total membri",
    total_cycles: "Total cicluri",
    total_modules: "Total module",
    pending_work_items: {
      title: "Activități în așteptare",
      empty_state: "Aici apare analiza activităților în așteptare atribuite colegilor.",
    },
    work_items_closed_in_a_year: {
      title: "Activități finalizate într-un an",
      empty_state: "Închide activități pentru a vedea statisticile sub formă de grafic.",
    },
    most_work_items_created: {
      title: "Cele mai multe activități create",
      empty_state: "Aici vor apărea colegii și numărul de activități create de aceștia.",
    },
    most_work_items_closed: {
      title: "Cele mai multe activități finalizate",
      empty_state: "Aici vor apărea colegii și numărul de activități finalizate de aceștia.",
    },
    tabs: {
      scope_and_demand: "Activități asumate și cerere",
      custom: "Analitice personalizate",
    },
    empty_state: {
      customized_insights: {
        description: "Elementele de lucru atribuite ție, împărțite pe stări, vor apărea aici.",
        title: "Nu există date încă",
      },
      created_vs_resolved: {
        description: "Elementele de lucru create și rezolvate în timp vor apărea aici.",
        title: "Nu există date încă",
      },
      project_insights: {
        title: "Nu există date încă",
        description: "Elementele de lucru atribuite ție, împărțite pe stări, vor apărea aici.",
      },
      general: {
        title:
          "Urmărește progresul, sarcinile și alocările. Identifică tendințele, elimină blocajele și accelerează munca",
        description:
          "Vezi domeniul versus cererea, estimările și extinderea domeniului. Obține performanțe pe membrii echipei și echipe, și asigură-te că proiectul tău rulează la timp.",
        primary_button: {
          text: "Începe primul tău proiect",
          comic: {
            title: "Analitica funcționează cel mai bine cu Cicluri + Module",
            description:
              "Întâi, limitează-ți problemele în Cicluri și, dacă poți, grupează problemele care durează mai mult de un ciclu în Module. Verifică ambele în navigarea din stânga.",
          },
        },
      },
      cycle_progress: {
        title: "Nu există date încă",
        description:
          "Analizele progresului ciclului vor apărea aici. Adăugați elemente de lucru la cicluri pentru a începe să urmăriți progresul.",
      },
      module_progress: {
        title: "Nu există date încă",
        description:
          "Analizele progresului modulului vor apărea aici. Adăugați elemente de lucru la module pentru a începe să urmăriți progresul.",
      },
      intake_trends: {
        title: "Nu există date încă",
        description:
          "Analizele tendințelor de intake vor apărea aici. Adăugați elemente de lucru la intake pentru a începe să urmăriți tendințele.",
      },
    },
    created_vs_resolved: "Creat vs Rezolvat",
    customized_insights: "Perspective personalizate",
    backlog_work_items: "{entity} din backlog",
    active_projects: "Proiecte active",
    trend_on_charts: "Tendință în grafice",
    all_projects: "Toate proiectele",
    summary_of_projects: "Sumarul proiectelor",
    project_insights: "Informații despre proiect",
    started_work_items: "{entity} începute",
    total_work_items: "Totalul {entity}",
    total_projects: "Total proiecte",
    total_admins: "Total administratori",
    total_users: "Total utilizatori",
    total_intake: "Venit total",
    un_started_work_items: "{entity} neîncepute",
    total_guests: "Total invitați",
    completed_work_items: "{entity} finalizate",
    total: "Totalul {entity}",
    projects_by_status: "Proiecte după statut",
    active_users: "Utilizatori activi",
    intake_trends: "Tendințe de admitere",
    workitem_resolved_vs_pending: "Elemente de lucru rezolvate vs în așteptare",
    upgrade_to_plan: "Upgradează la {plan} pentru a debloca {tab}",
  },
  workspace_projects: {
    label: "{count, plural, one {Proiect} other {Proiecte}}",
    create: {
      label: "Adaugă proiect",
    },
    network: {
      label: "Rețea",
      private: {
        title: "Privat",
        description: "Accesibil doar pe bază de invitație",
      },
      public: {
        title: "Public",
        description: "Oricine din spațiul de lucru, cu excepția celor din categoria Invitați, se poate alătura",
      },
    },
    error: {
      permission: "Nu ai permisiunea să efectuezi această acțiune.",
      cycle_delete: "Ștergerea ciclului a eșuat",
      module_delete: "Ștergerea modulului a eșuat",
      issue_delete: "Ștergerea activității a eșuat",
    },
    state: {
      backlog: "Restante",
      unstarted: "Neîncepute",
      started: "În desfășurare",
      completed: "Finalizate",
      cancelled: "Anulate",
    },
    sort: {
      manual: "Manual",
      name: "Nume",
      created_at: "Data creării",
      members_length: "Număr de membri",
    },
    scope: {
      my_projects: "Proiectele mele",
      archived_projects: "Arhivate",
    },
    common: {
      months_count: "{months, plural, one{# lună} other{# luni}}",
      days_count: "{days, plural, one{# zi} other{# zile}}",
    },
    empty_state: {
      general: {
        title: "Niciun proiect activ",
        description:
          "Gândește-te la fiecare proiect ca la părintele muncii orientate pe obiectiv. Proiectele sunt locul unde trăiesc Activitățile, Ciclurile și Modulele și, împreună cu colegii tăi, te ajută să îți atingi obiectivul. Creează un proiect nou sau filtrează pentru a vedea proiectele arhivate.",
        primary_button: {
          text: "Începe primul tău proiect",
          comic: {
            title: "Totul începe cu un proiect în Plane",
            description:
              "Un proiect poate fi o foaie de parcurs pentru un produs, o campanie de marketing sau lansarea unei noi mașini.",
          },
        },
      },
      no_projects: {
        title: "Niciun proiect",
        description:
          "Pentru a crea activități sau a-ți gestiona activitatea, trebuie să creezi un proiect sau să faci parte dintr-unul.",
        primary_button: {
          text: "Începe primul tău proiect",
          comic: {
            title: "Totul începe cu un proiect în Plane",
            description:
              "Un proiect poate fi o foaie de parcurs pentru un produs, o campanie de marketing sau lansarea unei noi mașini.",
          },
        },
      },
      filter: {
        title: "Niciun proiect care să corespundă filtrului",
        description: `Nu s-au găsit proiecte care să corespundă criteriilor aplicate.
 Creează un proiect nou.`,
      },
      search: {
        description: `Nu s-au găsit proiecte care să corespundă criteriilor.
Creează un proiect nou.`,
      },
    },
  },
  workspace_views: {
    add_view: "Adaugă perspectivă",
    empty_state: {
      "all-issues": {
        title: "Nicio activitate în proiect",
        description:
          "Primul proiect este gata! Acum împarte-ți munca în bucăți gestionabile prin activități. Hai să începem!",
        primary_button: {
          text: "Creează o nouă activitate",
        },
      },
      assigned: {
        title: "Nicio activitate încă",
        description: "Activitățile care ți-au fost atribuite pot fi urmărite de aici.",
        primary_button: {
          text: "Creează o nouă activitate",
        },
      },
      created: {
        title: "Nicio activitate încă",
        description: "Toate activitățile create de tine vor apărea aici. Le poți urmări direct din această pagină.",
        primary_button: {
          text: "Creează o nouă activitate",
        },
      },
      subscribed: {
        title: "Nicio activitate încă",
        description: "Abonează-te la activitățile care te interesează și urmărește-le pe toate aici.",
      },
      "custom-view": {
        title: "Nicio activitate încă",
        description: "Elementele de lucru care corespund filtrelor aplicate vor fi afișate aici.",
      },
    },
    delete_view: {
      title: "Sunteți sigur că doriți să ștergeți această vizualizare?",
      content:
        "Dacă confirmați, toate opțiunile de sortare, filtrare și afișare + aspectul pe care l-ați ales pentru această vizualizare vor fi șterse permanent fără nicio modalitate de a le restaura.",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "Schimbă e-mailul",
        description: "Introduceți o nouă adresă de e-mail pentru a primi un link de verificare.",
        toasts: {
          success_title: "Succes!",
          success_message: "E-mail actualizat cu succes. Conectați-vă din nou.",
        },
        form: {
          email: {
            label: "E-mail nou",
            placeholder: "Introduceți e-mailul",
            errors: {
              required: "E-mailul este obligatoriu",
              invalid: "E-mailul este invalid",
              exists: "E-mailul există deja. Folosiți altul.",
              validation_failed: "Validarea e-mailului a eșuat. Încercați din nou.",
            },
          },
          code: {
            label: "Cod unic",
            placeholder: "123456",
            helper_text: "Codul de verificare a fost trimis la noul e-mail.",
            errors: {
              required: "Codul unic este obligatoriu",
              invalid: "Cod de verificare invalid. Încercați din nou.",
            },
          },
        },
        actions: {
          continue: "Continuă",
          confirm: "Confirmă",
          cancel: "Anulează",
        },
        states: {
          sending: "Se trimite…",
        },
      },
    },
    notifications: {
      select_default_view: "Selectează vizualizarea implicită",
      compact: "Compact",
      full: "Ecran complet",
    },
  },
  workspace_settings: {
    label: "Setări spațiu de lucru",
    page_label: "{workspace} - Setări generale",
    key_created: "Cheie creată",
    copy_key:
      "Copiază și salvează această cheie secretă în Plane Documentație. Nu vei mai putea vedea această cheie după ce închizi. Un fișier CSV care conține cheia a fost descărcat.",
    token_copied: "Token-ul a fost copiat în memoria temporară.",
    settings: {
      general: {
        title: "General",
        upload_logo: "Încarcă siglă",
        edit_logo: "Editează siglă",
        name: "Numele spațiului de lucru",
        company_size: "Dimensiunea companiei",
        url: "URL-ul spațiului de lucru",
        workspace_timezone: "Fusul orar al spațiului de lucru",
        update_workspace: "Actualizează spațiul de lucru",
        delete_workspace: "Șterge acest spațiu de lucru",
        delete_workspace_description:
          "La ștergerea spațiului de lucru, toate datele și resursele din cadrul acestuia vor fi eliminate definitiv și nu vor putea fi recuperate.",
        delete_btn: "Șterge acest spațiu de lucru",
        delete_modal: {
          title: "Ești sigur că vrei să ștergi acest spațiu de lucru?",
          description:
            "Ai o perioadă de probă activă pentru unul dintre planurile noastre plătite. Te rugăm să o anulezi înainte de a continua.",
          dismiss: "Renunță",
          cancel: "Anulează perioadă de probă",
          success_title: "Spațiul de lucru a fost șters.",
          success_message: "Vei fi redirecționat în curând către pagina de profil.",
          error_title: "Ceva nu a funcționat.",
          error_message: "Încearcă din nou, te rog.",
        },
        errors: {
          name: {
            required: "Numele este obligatoriu",
            max_length: "Numele spațiului de lucru nu trebuie să depășească 80 de caractere",
          },
          company_size: {
            required: "Dimensiunea companiei este obligatorie",
            select_a_range: "Selectează dimensiunea companiei",
          },
        },
      },
      members: {
        title: "Membri",
        add_member: "Adaugă membru",
        pending_invites: "Invitații în așteptare",
        invitations_sent_successfully: "Invitațiile au fost trimise cu succes",
        leave_confirmation:
          "Ești sigur că vrei să părăsești spațiul de lucru? Nu vei mai avea acces la acest spațiu. Această acțiune este ireversibilă.",
        details: {
          full_name: "Nume complet",
          display_name: "Nume afișat",
          email_address: "Adresă de email",
          account_type: "Tip cont",
          authentication: "Autentificare",
          joining_date: "Data înscrierii",
        },
        modal: {
          title: "Invită persoane cu care să colaborezi",
          description: "Invită persoane cu care să colaborezi în spațiul tău de lucru.",
          button: "Trimite invitațiile",
          button_loading: "Se trimit invitațiile",
          placeholder: "nume@companie.ro",
          errors: {
            required: "Avem nevoie de o adresă de email pentru a trimite invitația.",
            invalid: "Adresa de email este invalidă",
          },
        },
      },
      billing_and_plans: {
        title: "Facturare și Abonamente",
        current_plan: "Abonament curent",
        free_plan: "Folosești în prezent abonamentul gratuit",
        view_plans: "Vezi abonamentele",
      },
      exports: {
        title: "Exporturi",
        exporting: "Se exportă",
        previous_exports: "Exporturi anterioare",
        export_separate_files: "Exportă datele în fișiere separate",
        filters_info: "Aplică filtre pentru a exporta elemente de lucru specifice în funcție de criteriile tale.",
        modal: {
          title: "Exportă în",
          toasts: {
            success: {
              title: "Export reușit",
              message: "Vei putea descărca exportul {entity} din secțiunea de exporturi anterioare.",
            },
            error: {
              title: "Export eșuat",
              message: "Exportul a eșuat. Te rugăm să încerci din nou.",
            },
          },
        },
      },
      webhooks: {
        title: "Puncte de notificare (Webhooks)",
        add_webhook: "Adaugă punct de notificare (webhook)",
        modal: {
          title: "Creează punct de notificare (webhook)",
          details: "Detalii punct de notificare (webhook)",
          payload: " URL-ul de trimitere a datelor",
          question: "La ce evenimente vrei să activezi acest punct de notificare (webhook)?",
          error: "URL-ul este obligatoriu",
        },
        secret_key: {
          title: "Cheie secretă",
          message: "Generează o cheie de acces pentru a semna datele trimise la punctul de notificare (webhook)",
        },
        options: {
          all: "Trimite-mi tot",
          individual: "Selectează evenimente individuale",
        },
        toasts: {
          created: {
            title: "Punct de notificare (webhook) creat",
            message: "Punctul de notificare (webhook) a fost creat cu succes",
          },
          not_created: {
            title: "Punctul de notificare (webhook) nu a fost creat",
            message: "Punctul de notificare (webhook) nu a putut fi creat",
          },
          updated: {
            title: "Punctul de notificare (webhook) actualizat",
            message: "Punctul de notificare (webhook) a fost actualizat cu succes",
          },
          not_updated: {
            title: "Punctul de notificare (webhook) nu a fost actualizat",
            message: "Punctul de notificare (webhook) nu a putut fi actualizat",
          },
          removed: {
            title: "Punct de notificare (webhook) șters",
            message: "Punctul de notificare (webhook) a fost șters cu succes",
          },
          not_removed: {
            title: "Punctul de notificare (webhook) nu a fost șters",
            message: "Punctul de notificare (webhook) nu a putut fi șters",
          },
          secret_key_copied: {
            message: "Cheia secretă a fost copiată în memoria temporară.",
          },
          secret_key_not_copied: {
            message: "A apărut o eroare la copierea cheii secrete.",
          },
        },
      },
      api_tokens: {
        heading: "Chei secrete API",
        description: "Generează chei secrete API sigure pentru a integra datele tale cu sisteme și aplicații externe.",
        title: "Chei secrete API",
        add_token: "Adaugă token de acces",
        create_token: "Creează cheie secretă",
        never_expires: "Nu expiră niciodată",
        generate_token: "Generează cheie secretă",
        generating: "Se generează",
        delete: {
          title: "Șterge cheia secretă API",
          description:
            "Orice aplicație care folosește această cheie secretă nu va mai avea acces la datele Plane. Această acțiune este ireversibilă.",
          success: {
            title: "Succes!",
            message: "Cheia secretă API a fost ștearsă cu succes",
          },
          error: {
            title: "Eroare!",
            message: "Cheia secretă API nu a putut fi ștearsă",
          },
        },
      },
      integrations: {
        title: "Integrări",
        page_title: "Lucrează cu datele tale Plane în aplicațiile disponibile sau în ale tale proprii.",
        page_description: "Vizualizează toate integrările utilizate de acest spațiu de lucru sau de tine.",
      },
      imports: {
        title: "Importuri",
      },
      worklogs: {
        title: "Jurnale de lucru",
      },
      group_syncing: {
        title: "Sincronizare grupuri",
        heading: "Sincronizare grupuri",
        description:
          "Asociați grupurile furnizorului de identitate cu proiecte și roluri. Accesul utilizatorilor se actualizează automat când apartenența la grup se schimbă în IdP-ul dvs., simplificând onboarding-ul și offboarding-ul.",
        enable: {
          title: "Activați sincronizarea grupurilor",
          description: "Adăugați automat utilizatori la proiecte pe baza grupurilor furnizorului de identitate.",
        },
        config: {
          title: "Configurați sincronizarea grupurilor",
          description: "Setați cum grupurile furnizorului de identitate sunt mapate la proiecte și roluri.",
          sync_on_login: {
            title: "Sincronizare la autentificare",
            description: "Actualizați apartenența la grup și accesul la proiect când un utilizator se autentifică.",
          },
          sync_offline: {
            title: "Sincronizare offline",
            description:
              "Rulează sincronizarea la fiecare șase ore automat, fără a aștepta autentificarea utilizatorilor.",
          },
          auto_remove: {
            title: "Eliminare automată",
            description: "Eliminați automat utilizatorii din proiecte când nu mai corespund grupului.",
          },
          group_attribute_key: {
            title: "Cheie atribut grup",
            description:
              "Atributul furnizorului de identitate folosit pentru identificarea și sincronizarea grupurilor de utilizatori.",
            placeholder: "Grupuri",
          },
        },
        group_mapping: {
          title: "Mapare grupuri",
          description: "Asociați grupurile furnizorului de identitate cu proiecte și roluri.",
          button_text: "Adăugați nouă sincronizare grup",
        },
        toast: {
          updating: "Se actualizează funcția de sincronizare a grupurilor",
          success: "Funcția de sincronizare a grupurilor a fost actualizată cu succes.",
          error: "Actualizarea funcției de sincronizare a grupurilor a eșuat!",
        },
        delete_modal: {
          title: "Ștergeți sincronizarea grupului",
          content:
            "Utilizatorii noi din acest grup de identitate nu vor mai fi adăugați la proiect. Utilizatorii deja adăugați își vor păstra rolul actual.",
        },
        modal: {
          idp_group_name: {
            text: "Grup utilizatori",
            required: "Grupul utilizatori este obligatoriu",
            placeholder: "Introduceți numele grupurilor IdP",
          },
          project: {
            text: "Proiect",
            required: "Proiectul este obligatoriu",
            placeholder: "Selectați un proiect",
          },
          default_role: {
            text: "Rol proiect",
            required: "Rolul proiectului este obligatoriu",
            placeholder: "Selectați un rol de proiect",
          },
        },
      },
      identity: {
        title: "Identitate",
        heading: "Identitate",
        description: "Configurați domeniul dvs. și activați Single sign-on",
      },
      project_states: {
        title: "Stări de proiect",
      },
      projects: {
        title: "Proiecte",
        description: "Gestionează stările proiectelor, activează etichetele proiectelor și alte configurări.",
        tabs: {
          states: "Stări de proiect",
          labels: "Etichete de proiect",
        },
      },
      teamspaces: {
        title: "Spații de echipă",
      },
      initiatives: {
        title: "Inițiative",
      },
      customers: {
        title: "Clienți",
      },
      releases: {
        title: "Lansări",
        update_release: "Actualizează lansarea",
        create_release: "Creează lansarea",
        errors: {
          release_not_found: "Lansarea pe care o cauți nu există.",
          unknown: "Ceva nu a mers bine. Te rugăm să încerci din nou.",
        },
      },

      cancel_trial: {
        title: "Anulează mai întâi perioada de probă.",
        description:
          "Ai o perioadă de probă activă pentru unul dintre planurile noastre plătite. Te rugăm să o anulezi mai întâi pentru a continua.",
        dismiss: "Respinge",
        cancel: "Anulează perioada de probă",
        cancel_success_title: "Perioada de probă anulată.",
        cancel_success_message: "Acum poți șterge workspace-ul.",
        cancel_error_title: "Asta nu a funcționat.",
        cancel_error_message: "Încearcă din nou, te rog.",
      },
      applications: {
        title: "Applications",
        applicationId_copied: "ID-ul aplicației copiat în clipboard",
        clientId_copied: "ID-ul clientului copiat în clipboard",
        clientSecret_copied: "Secretul clientului copiat în clipboard",
        third_party_apps: "Aplicații de terță parte",
        your_apps: "Aplicațiile tale",
        connect: "Conectează",
        connected: "Conectat",
        install: "Instalează",
        installed: "Instalat",
        configure: "Configurează",
        app_available: "Ai făcut această aplicație disponibilă pentru a fi folosită cu un workspace al Plane",
        app_available_description: "Conectează un workspace al Plane pentru a începe să folosesti",
        client_id_and_secret: "ID-ul clientului și Secretul",
        client_id_and_secret_description:
          "Copiază și salvează această cheie secretă în Pagini. Nu poți vedea această cheie din nou după ce închizi.",
        client_id_and_secret_download: "Poți descărca un fișier CSV cu cheia de aici.",
        application_id: "ID-ul aplicației",
        client_id: "ID-ul clientului",
        client_secret: "Secretul clientului",
        export_as_csv: "Exportă ca CSV",
        slug_already_exists: "Slug deja există",
        failed_to_create_application: "Eroare la crearea aplicației",
        upload_logo: "Încarcă Logo",
        app_name_title: "Cum vei numi această aplicație",
        app_name_error: "Numele aplicației este obligatoriu",
        app_short_description_title: "Dați această aplicație o descriere scurtă",
        app_short_description_error: "Descrierea scurtă a aplicației este obligatorie",
        app_description_title: {
          label: "Descriere lungă",
          placeholder: "Scrieți o descriere lungă pentru piață. Apăsați '/' pentru comenzi.",
        },
        authorization_grant_type: {
          title: "Tipul conexiunii",
          description:
            "Alege dacă aplicația ta trebuie instalată o dată pentru spațiul de lucru sau să permită fiecărui utilizator să își conecteze propriul cont",
        },
        app_description_error: "Descrierea aplicației este obligatorie",
        app_slug_title: "Slug-ul aplicației",
        app_slug_error: "Slug-ul aplicației este obligatoriu",
        app_maker_title: "Maker-ul aplicației",
        app_maker_error: "Maker-ul aplicației este obligatoriu",
        webhook_url_title: "URL-ul webhook-ului",
        webhook_url_error: "URL-ul webhook-ului este obligatoriu",
        invalid_webhook_url_error: "URL-ul webhook-ului este invalid",
        redirect_uris_title: "Redirect URIs",
        redirect_uris_error: "Redirect URIs sunt obligatorii",
        invalid_redirect_uris_error: "Redirect URIs sunt inva",
        redirect_uris_description:
          "Introduceți URI-uri separate prin spațiu unde aplicația va fi redirecționată după utilizator e.g https://example.com https://example.com/",
        authorized_javascript_origins_title: "Authorized Javascript Origins",
        authorized_javascript_origins_error: "Authorized Javascript Origins sunt obligatorii",
        invalid_authorized_javascript_origins_error: "Authorized Javascript Origins sunt inva",
        authorized_javascript_origins_description:
          "Introduceți spațiu separat originile unde aplicația va fi permisă să facă cereri e.g app.com example.com",
        create_app: "Creează aplicație",
        update_app: "Actualizează aplicație",
        regenerate_client_secret_description:
          "Regenerate the client secret. If you regenerate the secret, you can copy the key or download it to a CSV file right after.",
        regenerate_client_secret: "Regenerate client secret",
        regenerate_client_secret_confirm_title: "Sigur vrei să regenerezi secretul client?",
        regenerate_client_secret_confirm_description:
          "Aplicația care folosește acest secret va înceta să funcționeze. Trebuie să actualizezi secretul în aplicație.",
        regenerate_client_secret_confirm_cancel: "Anulează",
        regenerate_client_secret_confirm_regenerate: "Regenerate",
        read_only_access_to_workspace: "Acces doar pentru citire la workspace-ul tău",
        write_access_to_workspace: "Acces pentru scriere la workspace-ul tău",
        read_only_access_to_user_profile: "Acces doar pentru citire la profilul tău",
        write_access_to_user_profile: "Acces pentru scriere la profilul tău",
        connect_app_to_workspace: "Conectează {app} la workspace-ul tău {workspace}",
        user_permissions: "Permisiuni pentru utilizator",
        user_permissions_description:
          "Permisiunile pentru utilizator sunt folosite pentru a acorda acces la profilul utilizatorului.",
        workspace_permissions: "Permisiuni pentru workspace",
        workspace_permissions_description:
          "Permisiunile pentru workspace sunt folosite pentru a acorda acces la workspace.",
        with_the_permissions: "cu permisiunile",
        app_consent_title: "{app} cere acces la workspace-ul tău și profilul tău.",
        choose_workspace_to_connect_app_with: "Alege un workspace pentru a conecta aplicația",
        app_consent_workspace_permissions_title: "{app} ar dori să",
        app_consent_user_permissions_title:
          "{app} poate solicita și permisiuni pentru utilizator pentru următoarele resurse. Aceste permisiuni vor fi solicitate și autorizate doar de un utilizator.",
        app_consent_accept_title: "Prin acceptare, tu",
        app_consent_accept_1:
          "Permite aplicației acces la datele Plane în orice loc unde poți folosi aplicația în interior sau în afara Plane",
        app_consent_accept_2: "Apreciază politica de confidențialitate și termenii de utilizare a {app}",
        accepting: "Acceptând...",
        accept: "Acceptă",
        categories: "Categorii",
        select_app_categories: "Selectează categorii de aplicație",
        categories_title: "Categorii",
        categories_error: "Categorii sunt obligatorii",
        invalid_categories_error: "Categorii sunt inva",
        categories_description: "Selectează categorii care descriu cel mai bine aplicația",
        supported_plans: "Planuri Suportate",
        supported_plans_description:
          "Selectează planurile de spațiu de lucru care pot instala această aplicație. Lasă gol pentru a permite toate planurile.",
        select_plans: "Selectează Planuri",
        privacy_policy_url_title: "URL-ul politică de confidențialitate",
        privacy_policy_url_error: "Privacy Policy URL is required",
        invalid_privacy_policy_url_error: "URL-ul politică de confidențialitate este invalid",
        terms_of_service_url_title: "URL-ul termenilor de serviciu",
        terms_of_service_url_error: "URL-ul termenilor de serviciu este obligatoriu",
        invalid_terms_of_service_url_error: "URL-ul termenilor de serviciu este invalid",
        support_url_title: "URL-ul suportului",
        support_url_error: "URL-ul suportului este obligatoriu",
        invalid_support_url_error: "URL-ul suportului este invalid",
        video_url_title: "URL-ul video",
        video_url_error: "URL-ul video este obligatoriu",
        invalid_video_url_error: "URL-ul video este invalid",
        setup_url_title: "URL-ul setup-ului",
        setup_url_error: "URL-ul setup-ului este obligatoriu",
        invalid_setup_url_error: "URL-ul setup-ului este invalid",
        configuration_url_title: "URL-ul configurării",
        configuration_url_error: "URL-ul configurării este obligatoriu",
        invalid_configuration_url_error: "URL-ul configurării este invalid",
        contact_email_title: "Email-ul contactului",
        contact_email_error: "Email-ul contactului este obligatoriu",
        invalid_contact_email_error: "Email-ul contactului este invalid",
        upload_attachments: "Încarcă atașamente",
        uploading_images: "Încarcă {count} imagine{count, plural, one {s} other {s}}",
        drop_images_here: "Aruncă imagini aici",
        click_to_upload_images: "Click pentru a încărca imagini",
        invalid_file_or_exceeds_size_limit: "Fișier invalid sau depășește limita de dimensiune ({size} MB)",
        uploading: "Încarcă...",
        upload_and_save: "Încarcă și salvează",
        app_credentials_regenrated: {
          title: "Acreditările aplicației au fost regenerate cu succes",
          description:
            "Înlocuiți secretul clientului peste tot unde este folosit. Secretul anterior nu mai este valid.",
        },
        app_created: {
          title: "Aplicația a fost creată cu succes",
          description: "Folosiți acreditările pentru a instala aplicația într-un spațiu de lucru Plane",
        },
        installed_apps: "Aplicații instalate",
        all_apps: "Toate aplicațiile",
        internal_apps: "Aplicații interne",
        website: {
          title: "Site web",
          description: "Link către site-ul web al aplicației dvs.",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "Creator de aplicații",
          description: "Persoana sau organizația care creează aplicația.",
        },
        setup_url: {
          label: "URL de configurare",
          description: "Utilizatorii vor fi redirecționați către acest URL atunci când instalează aplicația.",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "URL webhook",
          description:
            "Aici vom trimite evenimente și actualizări webhook din spațiile de lucru unde aplicația dvs. este instalată.",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "URI de redirecționare (separate prin spațiu)",
          description: "Utilizatorii vor fi redirecționați către acest traseu după ce s-au autentificat cu Plane.",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "Această aplicație poate fi instalată doar după ce un administrator al workspace-ului o instalează. Contactați administratorul workspace-ului pentru a continua.",
        enable_app_mentions: "Activează mențiunile aplicației",
        enable_app_mentions_tooltip:
          "Când aceasta este activată, utilizatorii pot menționa sau atribui Work Items acestei aplicații.",
        scopes: "Domenii",
        select_scopes: "Selectați domeniile",
        read_access_to: "Acces doar citire la",
        write_access_to: "Acces scriere la",
        global_permission_expiration:
          "Domeniile globale expiră în curând. Folosiți domenii granulare în schimb. De exemplu, folosiți project:read în loc de citire globală.",
        selected_scopes: "{count} selectate",
        scopes_and_permissions: "Domenii și permisiuni",
        read: "Citire",
        write: "Scriere",
        scope_description: {
          projects: "Acces la proiecte și toate entitățile legate de proiecte",
          wiki: "Acces la wiki și toate entitățile legate de wiki",
          customers: "Acces la clienți și toate entitățile legate de clienți",
          initiatives: "Acces la inițiative și toate entitățile legate de inițiative",
          workspaces: "Acces la spații de lucru și toate entitățile legate",
          stickies: "Acces la stickies și toate entitățile legate",
          teamspaces: "Acces la spații de echipă și toate entitățile legate",
          profile: "Acces la informațiile profilului utilizatorului",
          agents: "Acces la agenți și toate entitățile legate de agenți",
          assets: "Acces la active și toate entitățile legate de active",
        },
        build_your_own_app: "Construiți propria aplicație",
        edit_app_details: "Editează detaliile aplicației",
        internal: "Intern",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description:
          "Vezi-ți munca să devină mai inteligentă și mai rapidă cu AI care este conectată în mod nativ la munca ta și la baza de cunoștințe.",
      },
    },
    empty_state: {
      api_tokens: {
        title: "Nicio cheie secretă API creată",
        description:
          "API-ul Plane poate fi folosit pentru a integra datele tale din Plane cu orice sistem extern. Creează o cheie secretă pentru a începe.",
      },
      webhooks: {
        title: "Niciun punctul de notificare (webhook) adăugat",
        description:
          "Creează puncte de notificare (webhooks) pentru a primi actualizări în timp real și a automatiza acțiuni.",
      },
      exports: {
        title: "Niciun export efectuat",
        description: "Ori de câte ori exporți, vei avea o copie și aici pentru referință.",
      },
      imports: {
        title: "Niciun import efectuat",
        description: "Găsește aici toate importurile anterioare și descarcă-le.",
      },
    },
  },
  profile: {
    label: "Profil",
    page_label: "Munca ta",
    work: "Muncă",
    details: {
      joined_on: "S-a înscris la",
      time_zone: "Fus orar",
    },
    stats: {
      workload: "Volum de muncă",
      overview: "Prezentare generală",
      created: "Activități create",
      assigned: "Activități atribuite",
      subscribed: "Activități urmărite",
      state_distribution: {
        title: "Activități după stare",
        empty: "Creează activități pentru a le vedea distribuite pe stări în grafic, pentru o analiză mai bună.",
      },
      priority_distribution: {
        title: "Activități după prioritate",
        empty: "Creează activități pentru a le vedea distribuite pe priorități în grafic, pentru o analiză mai bună.",
      },
      recent_activity: {
        title: "Activitate recentă",
        empty: "Nu am găsit date. Te rugăm să verifici activitățile tale.",
        button: "Descarcă activitatea de azi",
        button_loading: "Se descarcă",
      },
    },
    actions: {
      profile: "Profil",
      security: "Securitate",
      activity: "Activitate",
      appearance: "Aspect",
      notifications: "Notificări",
      connections: "Conexiuni",
    },
    tabs: {
      summary: "Sumar",
      assigned: "Atribuite",
      created: "Create",
      subscribed: "Urmărite",
      activity: "Activitate",
    },
    empty_state: {
      activity: {
        title: "Nicio activitate încă",
        description:
          "Începe prin a crea o nouă activitate! Adaugă detalii și proprietăți. Explorează mai mult în Plane pentru a-ți vedea activitatea.",
      },
      assigned: {
        title: "Nicio activitate atribuită ție",
        description: "Elementele de lucru care ți-au fost atribuite pot fi urmărite de aici.",
      },
      created: {
        title: "Nicio activitate creată",
        description: "Toate activitățile create de tine vor apărea aici. Le poți urmări direct din această pagină.",
      },
      subscribed: {
        title: "Nicio activitate urmărită",
        description: "Abonează-te la activitățile care te interesează și urmărește-le pe toate aici.",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "Introdu ID-ul proiectului",
      please_select_a_timezone: "Te rugăm să selectezi un fus orar",
      archive_project: {
        title: "Arhivează proiectul",
        description:
          "Arhivarea unui proiect îl va elimina din navigarea laterală, dar vei putea accesa proiectul din pagina ta de proiecte. Poți restaura sau șterge proiectul oricând dorești.",
        button: "Arhivează proiectul",
      },
      delete_project: {
        title: "Șterge proiectul",
        description:
          "La ștergerea unui proiect, toate datele și resursele din cadrul proiectului vor fi eliminate definitiv și nu vor putea fi recuperate.",
        button: "Șterge proiectul meu",
      },
      toast: {
        success: "Proiect actualizat cu succes",
        error: "Proiectul nu a putut fi actualizat. Te rugăm să încerci din nou.",
      },
    },
    members: {
      label: "Membri",
      project_lead: "Lider de proiect",
      default_assignee: "Persoană atribuită implicit",
      guest_super_permissions: {
        title: "Acordă acces la perspectivă pentru toți utilizatorii de tip Invitat:",
        sub_heading: "Aceasta va permite utilizatorilor din categoria Invitați să vadă toate activitățile din proiect.",
      },
      invite_members: {
        title: "Invită membri",
        sub_heading: "Invită membri să lucreze la proiectul tău.",
        select_co_worker: "Selectează colegul de echipă",
      },
      project_lead_description: "Selectați liderul proiectului.",
      default_assignee_description: "Selectați persoana implicită atribuită proiectului.",
      project_subscribers: "Abonații proiectului",
      project_subscribers_description: "Selectați membrii care vor primi notificări pentru acest proiect.",
    },
    states: {
      describe_this_state_for_your_members: "Descrie această stare pentru membrii tăi.",
      empty_state: {
        title: "Nicio stare disponibilă pentru grupul {groupKey}",
        description: "Te rog să creezi o stare nouă",
      },
    },
    labels: {
      label_title: "Titlu etichetă",
      label_title_is_required: "Titlul etichetei este obligatoriu",
      label_max_char: "Numele etichetei nu trebuie să depășească 255 de caractere",
      toast: {
        error: "Eroare la actualizarea etichetei",
      },
    },
    estimates: {
      label: "Estimări",
      title: "Activează estimările pentru proiectul meu",
      description: "Te ajută să comunici complexitatea și volumul de muncă al echipei.",
      no_estimate: "Fără estimare",
      new: "Noul sistem de estimare",
      create: {
        custom: "Personalizat",
        start_from_scratch: "Începe de la zero",
        choose_template: "Alege un șablon",
        choose_estimate_system: "Alege un sistem de estimare",
        enter_estimate_point: "Introdu estimarea",
        step: "Pasul {step} de {total}",
        label: "Creează estimare",
      },
      toasts: {
        created: {
          success: {
            title: "Estimare creată",
            message: "Estimarea a fost creată cu succes",
          },
          error: {
            title: "Crearea estimării a eșuat",
            message: "Nu am putut crea noua estimare, te rugăm să încerci din nou.",
          },
        },
        updated: {
          success: {
            title: "Estimare modificată",
            message: "Estimarea a fost actualizată în proiectul tău.",
          },
          error: {
            title: "Modificarea estimării a eșuat",
            message: "Nu am putut modifica estimarea, te rugăm să încerci din nou",
          },
        },
        enabled: {
          success: {
            title: "Succes!",
            message: "Estimările au fost activate.",
          },
        },
        disabled: {
          success: {
            title: "Succes!",
            message: "Estimările au fost dezactivate.",
          },
          error: {
            title: "Eroare!",
            message: "Estimarea nu a putut fi dezactivată. Te rugăm să încerci din nou",
          },
        },
        reorder: {
          success: {
            title: "Estimări reordonate",
            message: "Estimările au fost reordonate în proiectul tău.",
          },
          error: {
            title: "Reordonarea estimărilor a eșuat",
            message: "Nu am putut reordona estimările, te rugăm să încerci din nou",
          },
        },
      },
      validation: {
        min_length: "Estimarea trebuie să fie mai mare decât 0.",
        unable_to_process: "Nu putem procesa cererea ta, te rugăm să încerci din nou.",
        numeric: "Estimarea trebuie să fie o valoare numerică.",
        character: "Estimarea trebuie să fie o valoare de tip caracter.",
        empty: "Valoarea estimării nu poate fi goală.",
        already_exists: "Valoarea estimării există deja.",
        unsaved_changes: "Ai modificări nesalvate, te rugăm să le salvezi înainte de a finaliza",
        remove_empty:
          "Estimarea nu poate fi goală. Introdu o valoare în fiecare câmp sau elimină câmpurile pentru care nu ai valori.",
        fill: "Te rugăm să completezi acest câmp de estimare",
        repeat: "Valoarea estimării nu poate fi repetată",
      },
      systems: {
        points: {
          label: "Puncte",
          fibonacci: "Fibonacci",
          linear: "Linear",
          squares: "Pătrate",
          custom: "Personalizat",
        },
        categories: {
          label: "Categorii",
          t_shirt_sizes: "Mărimi tricou",
          easy_to_hard: "De la ușor la greu",
          custom: "Personalizat",
        },
        time: {
          label: "Timp",
          hours: "Ore",
        },
      },
      edit: {
        title: "Editează sistemul de estimări",
        add_or_update: {
          title: "Adaugă, actualizează sau elimină estimări",
          description:
            "Gestionează sistemul curent prin adăugarea, actualizarea sau eliminarea punctelor sau categoriilor.",
        },
        switch: {
          title: "Schimbă tipul de estimare",
          description: "Convertește sistemul tău de puncte în sistem de categorii și invers.",
        },
      },
      switch: "Schimbă sistemul de estimări",
      current: "Sistemul de estimări curent",
      select: "Selectează un sistem de estimări",
    },
    automations: {
      label: "Automatizări",
      "auto-archive": {
        title: "Auto-arhivează activitățile finalizate",
        description: "Plane va arhiva automat activitățile care au fost finalizate sau anulate.",
        duration: "Auto-arhivează activitățile finalizate de",
      },
      "auto-close": {
        title: "Închide automat activitățile",
        description: "Plane va închide automat activitățile care nu au fost finalizate sau anulate.",
        duration: "Închide automat activitățile inactive de",
        auto_close_status: "Stare închidere automată",
      },
      "auto-remind": {
        title: "Avertismente automate",
        description:
          "Plane va trimite avertizări automate prin e-mail și notificări în aplicație pentru a menține echipa pe calea termenelor.",
        duration: "Trimite avertizare înainte",
      },
    },
    empty_state: {
      labels: {
        title: "Nicio etichetă încă",
        description: "Creează etichete pentru a organiza și filtra activitățile din proiect.",
      },
      estimates: {
        title: "Nicio estimare configurată",
        description: "Creează un set de estimări pentru a comunica volumul de muncă pentru fiecare activitate.",
        primary_button: "Adaugă sistem de estimare",
      },
      integrations: {
        title: "Nicio integrare configurată",
        description:
          "Configurează GitHub și alte integrări pentru a sincroniza elementele de lucru ale proiectului tău.",
      },
    },
    initiatives: {
      heading: "Inițiative",
      sub_heading: "Deblochează cel mai înalt nivel de organizare pentru tot lucrul tău în Plane.",
      title: "Activează Inițiative",
      description: "Setează obiective mai mari pentru a monitoriza progresul",
      toast: {
        updating: "Actualizarea funcției de inițiative",
        enable_success: "Funcția de inițiative activată cu succes.",
        disable_success: "Funcția de inițiative dezactivată cu succes.",
        error: "Eșec la actualizarea funcției de inițiative!",
      },
    },
    customers: {
      heading: "Clienți",
      settings_heading: "Gestionează munca după ce este important pentru clienții tăi.",
      settings_sub_heading:
        "Aduce cererile clienților la elementele de lucru, atribuie prioritate după cereri și grupează stările elementelor de lucru în înregistrările clienților. În curând, vei putea integra cu CRM-ul tău sau cu instrumentul de suport pentru o gestionare și mai bună a muncii după atributele clientului.",
    },
    epics: {
      properties: {
        title: "Proprietăți",
        description: "Adaugă proprietăți personalizate la epicul tău.",
      },
      disabled: "Dezactivat",
    },
    cycles: {
      auto_schedule: {
        heading: "Programare automată a ciclurilor",
        description: "Mențineți ciclurile în mișcare fără configurare manuală.",
        tooltip: "Creați automat cicluri noi pe baza programului ales.",
        edit_button: "Editează",
        form: {
          cycle_title: {
            label: "Titlul ciclului",
            placeholder: "Titlu",
            tooltip: "Titlul va fi completat cu numere pentru ciclurile următoare. De exemplu: Design - 1/2/3",
            validation: {
              required: "Titlul ciclului este obligatoriu",
              max_length: "Titlul nu trebuie să depășească 255 de caractere",
            },
          },
          cycle_duration: {
            label: "Durata ciclului",
            unit: "Săptămâni",
            validation: {
              required: "Durata ciclului este obligatorie",
              min: "Durata ciclului trebuie să fie de cel puțin 1 săptămână",
              max: "Durata ciclului nu poate depăși 30 de săptămâni",
              positive: "Durata ciclului trebuie să fie pozitivă",
            },
          },
          cooldown_period: {
            label: "Perioadă de răcire",
            unit: "zile",
            tooltip: "Pauză între cicluri înainte de începerea următorului.",
            validation: {
              required: "Perioada de răcire este obligatorie",
              negative: "Perioada de răcire nu poate fi negativă",
            },
          },
          start_date: {
            label: "Ziua de început a ciclului",
            validation: {
              required: "Data de început este obligatorie",
              past: "Data de început nu poate fi în trecut",
            },
          },
          number_of_cycles: {
            label: "Numărul de cicluri viitoare",
            validation: {
              required: "Numărul de cicluri este obligatoriu",
              min: "Este necesar cel puțin 1 ciclu",
              max: "Nu se pot programa mai mult de 3 cicluri",
            },
          },
          auto_rollover: {
            label: "Transfer automat al elementelor de lucru",
            tooltip:
              "În ziua în care se completează un ciclu, mutați toate elementele de lucru nefinalizate în ciclul următor.",
          },
        },
        toast: {
          toggle: {
            loading_enable: "Se activează programarea automată a ciclurilor",
            loading_disable: "Se dezactivează programarea automată a ciclurilor",
            success: {
              title: "Succes!",
              message: "Programarea automată a ciclurilor a fost comutată cu succes.",
            },
            error: {
              title: "Eroare!",
              message: "Nu s-a putut comuta programarea automată a ciclurilor.",
            },
          },
          save: {
            loading: "Se salvează configurația programării automate a ciclurilor",
            success: {
              title: "Succes!",
              message_create: "Configurația programării automate a ciclurilor a fost salvată cu succes.",
              message_update: "Configurația programării automate a ciclurilor a fost actualizată cu succes.",
            },
            error: {
              title: "Eroare!",
              message_create: "Nu s-a putut salva configurația programării automate a ciclurilor.",
              message_update: "Nu s-a putut actualiza configurația programării automate a ciclurilor.",
            },
          },
        },
      },
    },
    features: {
      cycles: {
        title: "Cicluri",
        short_title: "Cicluri",
        description:
          "Programați munca în perioade flexibile care se adaptează ritmului și ritmului unic al acestui proiect.",
        toggle_title: "Activați ciclurile",
        toggle_description: "Planificați munca în intervale de timp concentrate.",
      },
      modules: {
        title: "Module",
        short_title: "Module",
        description: "Organizați munca în subproiecte cu lideri și responsabili dedicați.",
        toggle_title: "Activați modulele",
        toggle_description: "Membrii proiectului vor putea crea și edita module.",
      },
      views: {
        title: "Vizualizări",
        short_title: "Vizualizări",
        description: "Salvați sortări personalizate, filtre și opțiuni de afișare sau partajați-le cu echipa dvs.",
        toggle_title: "Activați vizualizările",
        toggle_description: "Membrii proiectului vor putea crea și edita vizualizări.",
      },
      pages: {
        title: "Pagini",
        short_title: "Pagini",
        description: "Creați și editați conținut liber: note, documente, orice.",
        toggle_title: "Activați paginile",
        toggle_description: "Membrii proiectului vor putea crea și edita pagini.",
      },
      intake: {
        intake_responsibility: "Responsabilitate de primire",
        intake_sources: "Surse de primire",
        title: "Recepție",
        short_title: "Recepție",
        description:
          "Permiteți non-membrilor să partajeze erori, feedback și sugestii; fără a perturba fluxul de lucru.",
        toggle_title: "Activați recepția",
        toggle_description: "Permiteți membrilor proiectului să creeze solicitări de recepție în aplicație.",
        toggle_tooltip_on: "Solicitați administratorului proiectului să activeze.",
        toggle_tooltip_off: "Solicitați administratorului proiectului să dezactiveze.",
        notify_assignee: {
          title: "Notifică persoanele desemnate",
          description: "Pentru o nouă cerere de primire, persoanele desemnate implicit vor fi alertate prin notificări",
        },
        in_app: {
          title: "În aplicație",
          description:
            "Primiți elemente de lucru noi de la membri și invitați în spațiul de lucru fără a perturba cele existente.",
        },
        email: {
          title: "E-mail",
          description: "Colectați elemente de lucru noi de la oricine trimite un e-mail la o adresă Plane.",
          fieldName: "ID e-mail",
        },
        form: {
          title: "Formulare",
          description:
            "Permiteți persoanelor din afara spațiului de lucru să creeze elemente de lucru noi potențiale printr-un formular dedicat și sigur.",
          fieldName: "URL formular implicit",
          create_forms: "Creați formulare folosind tipuri de elemente de lucru",
          manage_forms: "Gestionați formularele",
          manage_forms_tooltip: "Solicitați administratorului spațiului de lucru să gestioneze.",
          create_form: "Creați formular",
          edit_form: "Editați detaliile formularului",
          form_title: "Titlul formularului",
          form_title_required: "Titlul formularului este obligatoriu",
          work_item_type: "Tip element de lucru",
          remove_property: "Eliminați proprietatea",
          select_properties: "Selectați proprietăți",
          search_placeholder: "Căutați proprietăți",
          toasts: {
            success_create: "Formularul de primire a fost creat cu succes",
            success_update: "Formularul de primire a fost actualizat cu succes",
            error_create: "Crearea formularului de primire a eșuat",
            error_update: "Actualizarea formularului de primire a eșuat",
          },
        },
        toasts: {
          set: {
            loading: "Setarea persoanelor desemnate...",
            success: {
              title: "Succes!",
              message: "Persoanele desemnate au fost setate cu succes.",
            },
            error: {
              title: "Eroare!",
              message: "Ceva a mers greșit la setarea persoanelor desemnate. Vă rugăm să încercați din nou.",
            },
          },
        },
      },
      time_tracking: {
        title: "Urmărire timp",
        short_title: "Urmărire timp",
        description: "Înregistrați timpul petrecut pe elemente de lucru și proiecte.",
        toggle_title: "Activați urmărirea timpului",
        toggle_description: "Membrii proiectului vor putea înregistra timpul lucrat.",
      },
      milestones: {
        title: "Etape importante",
        short_title: "Etape importante",
        description:
          "Etapele importante oferă un strat pentru a alinia elementele de lucru către date comune de finalizare.",
        toggle_title: "Activați etapele importante",
        toggle_description: "Organizați elementele de lucru după termenele etapelor importante.",
      },
      toasts: {
        loading: "Se actualizează funcționalitatea proiectului...",
        success: "Funcționalitatea proiectului a fost actualizată cu succes.",
        error: "Ceva a mers greșit la actualizarea funcționalității proiectului. Vă rugăm să încercați din nou.",
      },
    },
  },
  project_cycles: {
    add_cycle: "Adaugă ciclu",
    more_details: "Mai multe detalii",
    cycle: "Ciclu",
    update_cycle: "Actualizează ciclul",
    create_cycle: "Creează ciclu",
    no_matching_cycles: "Niciun ciclu găsit",
    remove_filters_to_see_all_cycles: "Elimină filtrele pentru a vedea toate ciclurile",
    remove_search_criteria_to_see_all_cycles: "Elimină criteriile de căutare pentru a vedea toate ciclurile",
    only_completed_cycles_can_be_archived: "Doar ciclurile finalizate pot fi arhivate",
    transfer_work_items: "Transferați {count} elemente de lucru",
    transfer: {
      no_cycles_available: "Nu există alte cicluri disponibile pentru a transfera elemente de lucru.",
    },
    active_cycle: {
      label: "Ciclu activ",
      progress: "Progres",
      chart: "Ritmul de finalizare a activităților",
      priority_issue: "Activități prioritare",
      assignees: "Persoane atribuite",
      issue_burndown: "Grafic de finalizare a activităților",
      ideal: "Ideal",
      current: "Curent",
      labels: "Etichete",
      trailing: "Întârziat",
      leading: "Avansat",
    },
    upcoming_cycle: {
      label: "Ciclu viitor",
    },
    completed_cycle: {
      label: "Ciclu finalizat",
    },
    status: {
      days_left: "Zile rămase",
      completed: "Finalizat",
      yet_to_start: "Nu a început",
      in_progress: "În desfășurare",
      draft: "Schiță",
    },
    action: {
      restore: {
        title: "Restaurează ciclul",
        success: {
          title: "Ciclu restaurat",
          description: "Ciclul a fost restaurat.",
        },
        failed: {
          title: "Restaurarea ciclului a eșuat",
          description: "Ciclul nu a putut fi restaurat. Te rugăm să încerci din nou.",
        },
      },
      favorite: {
        loading: "Se adaugă ciclul la favorite",
        success: {
          description: "Ciclul a fost adăugat la favorite.",
          title: "Succes!",
        },
        failed: {
          description: "Nu s-a putut adăuga ciclul la favorite. Te rugăm să încerci din nou.",
          title: "Eroare!",
        },
      },
      unfavorite: {
        loading: "Se elimină ciclul din favorite",
        success: {
          description: "Ciclul a fost eliminat din favorite.",
          title: "Succes!",
        },
        failed: {
          description: "Nu s-a putut elimina ciclul din favorite. Te rugăm să încerci din nou.",
          title: "Eroare!",
        },
      },
      update: {
        loading: "Se actualizează ciclul",
        success: {
          description: "Ciclul a fost actualizat cu succes.",
          title: "Succes!",
        },
        failed: {
          description: "Eroare la actualizarea ciclului. Te rugăm să încerci din nou.",
          title: "Eroare!",
        },
        error: {
          already_exists:
            "Ai deja un ciclu în datele selectate. Dacă vrei să creezi o schiță, poți face asta eliminând ambele date.",
        },
      },
    },
    empty_state: {
      general: {
        title: "Grupează și delimitează în timp munca ta în Cicluri.",
        description:
          "Împarte munca în intervale de timp, stabilește datele în funcție de termenul limită al proiectului și progresează vizibil ca echipă.",
        primary_button: {
          text: "Setează primul tău ciclu",
          comic: {
            title: "Ciclurile sunt intervale repetitive de timp.",
            description:
              "O iterație sau orice alt termen folosit pentru urmărirea săptămânală sau bilunară a muncii este un ciclu.",
          },
        },
      },
      no_issues: {
        title: "Nicio activitate adăugată în ciclu",
        description: "Adaugă sau creează activități pe care vrei să le implementezi în acest ciclu",
        primary_button: {
          text: "Creează o activitate nouă",
        },
        secondary_button: {
          text: "Adaugă o activitate existentă",
        },
      },
      completed_no_issues: {
        title: "Nicio activitate în ciclu",
        description:
          "Nu există activități în ciclu. Acestea au fost fie transferate, fie ascunse. Pentru a vedea activitățile ascunse, actualizează proprietățile de afișare.",
      },
      active: {
        title: "Niciun ciclu activ",
        description:
          "Un ciclu activ include orice perioadă care conține data de azi în intervalul său. Progresul și detaliile ciclului activ apar aici.",
      },
      archived: {
        title: "Niciun ciclu arhivat încă",
        description:
          "Pentru a păstra proiectul ordonat, arhivează ciclurile completate. Le vei găsi aici după arhivare.",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "Creează o activitate și atribuie-o cuiva, chiar și ție",
        description:
          "Gândește-te la activități ca la sarcini sau lucruri care trebuie făcute. O activitate și sub-activitățile sale sunt acțiuni care trebuie realizate într-un interval de timp de către membrii echipei tale. Echipa creează, atribuie și finalizează activități pentru a duce proiectul spre obiectivul său.",
        primary_button: {
          text: "Creează prima ta activitate",
          comic: {
            title: "Activitățile sunt elemente de bază în Plane.",
            description:
              "Reproiectarea interfeței Plane, modernizarea imaginii companiei sau lansarea noului sistem de injecție sunt exemple de activități care au, cel mai probabil, sub-activități.",
          },
        },
      },
      no_archived_issues: {
        title: "Nicio activitate arhivată încă",
        description:
          "Manual sau automat, poți arhiva activitățile care sunt finalizate sau anulate. Le vei găsi aici după arhivare.",
        primary_button: {
          text: "Setează automatizarea",
        },
      },
      issues_empty_filter: {
        title: "Nicio activitate găsită conform filtrelor aplicate",
        secondary_button: {
          text: "Șterge toate filtrele",
        },
      },
    },
  },
  project_module: {
    add_module: "Adaugă Modul",
    update_module: "Actualizează Modul",
    create_module: "Creează Modul",
    archive_module: "Arhivează Modul",
    restore_module: "Restaurează Modul",
    delete_module: "Șterge modulul",
    empty_state: {
      general: {
        title: "Mapează etapele proiectului în Module și urmărește munca agregată cu ușurință.",
        description:
          "Un grup de activități care aparțin unui părinte logic și ierarhic formează un modul. Gândește-te la module ca la un mod de a urmări munca în funcție de etapele proiectului. Au propriile perioade, termene limită și statistici pentru a-ți arăta cât de aproape sau departe ești de un reper.",
        primary_button: {
          text: "Construiește primul tău modul",
          comic: {
            title: "Modulele ajută la organizarea muncii pe niveluri ierarhice.",
            description:
              "Un modul pentru caroserie, un modul pentru șasiu sau un modul pentru depozit sunt exemple bune de astfel de grupare.",
          },
        },
      },
      no_issues: {
        title: "Nicio activitate în modul",
        description: "Creează sau adaugă activități pe care vrei să le finalizezi ca parte a acestui modul",
        primary_button: {
          text: "Creează activități noi",
        },
        secondary_button: {
          text: "Adaugă o activitate existentă",
        },
      },
      archived: {
        title: "Niciun modul arhivat încă",
        description:
          "Pentru a păstra proiectul ordonat, arhivează modulele finalizate sau anulate. Le vei găsi aici după arhivare.",
      },
      sidebar: {
        in_active: "Acest modul nu este încă activ.",
        invalid_date: "Dată invalidă. Te rugăm să introduci o dată validă.",
      },
    },
    quick_actions: {
      archive_module: "Arhivează modulul",
      archive_module_description: "Doar modulele finalizate sau anulate pot fi arhivate.",
      delete_module: "Șterge modulul",
    },
    toast: {
      copy: {
        success: "Link-ul modulului a fost copiat în memoria temporară",
      },
      delete: {
        success: "Modulul a fost șters cu succes",
        error: "Ștergerea modulului a eșuat",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "Salvează perspective filtrate pentru proiectul tău. Creează câte ai nevoie",
        description:
          "Perspectivele sunt seturi de filtre salvate pe care le folosești frecvent sau la care vrei acces rapid. Toți colegii tăi dintr-un proiect pot vedea perspectivele tuturor și pot alege ce li se potrivește cel mai bine.",
        primary_button: {
          text: "Creează prima ta perspectivă",
          comic: {
            title: "Perspectivele funcționează pe baza proprietăților activităților.",
            description: "Poți crea o perspectivă de aici, cu oricâte proprietăți și filtre consideri necesare.",
          },
        },
      },
      filter: {
        title: "Nicio perspectivă potrivită",
        description: `Nicio perspectivă nu se potrivește criteriilor de căutare.
 Creează o nouă perspectivă în schimb.`,
      },
    },
    delete_view: {
      title: "Sunteți sigur că doriți să ștergeți această vizualizare?",
      content:
        "Dacă confirmați, toate opțiunile de sortare, filtrare și afișare + aspectul pe care l-ați ales pentru această vizualizare vor fi șterse permanent fără nicio modalitate de a le restaura.",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title:
          "Scrie o notiță, un document sau o bază completă de cunoștințe. Folosește-l pe Galileo, Inteligența Artificială a Plane, ca să te ajute să începi",
        description:
          "Documentația e spațiul în care îți notezi gândurile în Plane. Ia notițe de la ședințe, formatează-le ușor, inserează activități, așază-le folosind o bibliotecă de componente și păstrează-le pe toate în contextul proiectului tău. Pentru a redacta rapid orice document, apelează la Galileo, Inteligența Artificială a Plane, cu un shortcut sau un click.",
        primary_button: {
          text: "Creează primul tău document",
        },
      },
      private: {
        title: "Niciun document privată încă",
        description:
          "Păstrează-ți gândurile private aici. Când ești gata să le împarți, echipa e la un click distanță.",
        primary_button: {
          text: "Creează primul tău document",
        },
      },
      public: {
        title: "Niciun document public încă",
        description: "Vezi aici documentele distribuite cu toată echipa ta din proiect.",
        primary_button: {
          text: "Creează primul tău document",
        },
      },
      archived: {
        title: "Niciun document arhivat încă",
        description: "Arhivează documentele de care nu mai ai nevoie. Le poți accesa de aici oricând.",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "Niciun rezultat găsit",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "Nu au fost găsite activități potrivite",
      },
      no_issues: {
        title: "Nu au fost găsite activități",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "Niciun comentariu încă",
        description: "Comentariile pot fi folosite ca spațiu de discuții și urmărire pentru activități",
      },
    },
  },
  notification: {
    label: "Căsuță de mesaje",
    page_label: "{workspace} - Căsuță de mesaje",
    options: {
      mark_all_as_read: "Marchează toate ca citite",
      mark_read: "Marchează ca citit",
      mark_unread: "Marchează ca necitit",
      refresh: "Reîmprospătează",
      filters: "Filtre Căsuță de mesaje",
      show_unread: "Afișează necitite",
      show_snoozed: "Afișează amânate",
      show_archived: "Afișează arhivate",
      mark_archive: "Arhivează",
      mark_unarchive: "Dezarhivează",
      mark_snooze: "Amână",
      mark_unsnooze: "Dezactivează amânarea",
    },
    toasts: {
      read: "Notificare marcată ca citită",
      unread: "Notificare marcată ca necitită",
      archived: "Notificare arhivată",
      unarchived: "Notificare dezarhivată",
      snoozed: "Notificare amânată",
      unsnoozed: "Notificare reactivată",
    },
    empty_state: {
      detail: {
        title: "Selectează pentru a vedea detalii.",
      },
      all: {
        title: "Nicio activitate atribuită",
        description: `Actualizările pentru activitățile atribuite ție pot fi
văzute aici`,
      },
      mentions: {
        title: "Nicio activitate atribuită",
        description: `Actualizările pentru activitățile atribuite ție pot fi
văzute aici`,
      },
    },
    tabs: {
      all: "Toate",
      mentions: "Mențiuni",
    },
    filter: {
      assigned: "Atribuite mie",
      created: "Create de mine",
      subscribed: "Urmărite de mine",
    },
    snooze: {
      "1_day": "1 zi",
      "3_days": "3 zile",
      "5_days": "5 zile",
      "1_week": "1 săptămână",
      "2_weeks": "2 săptămâni",
      custom: "Personalizat",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "Adaugă activități în ciclu pentru a vedea progresul",
      },
      chart: {
        title: "Adaugă activități în ciclu pentru a vedea graficul de finalizare a activităților.",
      },
      priority_issue: {
        title: "Observă rapid activitățile cu prioritate ridicată abordate în ciclu.",
      },
      assignee: {
        title: "Adaugă responsabili pentru a vedea repartizarea muncii pe persoane.",
      },
      label: {
        title: "Adaugă etichete activităților pentru a vedea repartizarea muncii pe etichete.",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "Funcția Cereri nu este activată pentru proiect.",
        description:
          "Funcția Cereri te ajută să gestionezi cererile care vin în proiectul tău și să le adaugi ca activități în fluxul tău. Activează Cereri din setările proiectului pentru a gestiona cererile.",
        primary_button: {
          text: "Gestionează funcțiile",
        },
      },
      cycle: {
        title: "Funcția Cicluri nu este activată pentru acest proiect.",
        description:
          "Împarte munca în intervale de timp, pleacă de la termenul limită al proiectului pentru a seta date și progresează vizibil ca echipă. Activează funcția de cicluri pentru a începe să o folosești.",
        primary_button: {
          text: "Gestionează funcțiile",
        },
      },
      module: {
        title: "Funcția Module nu este activată pentru proiect.",
        description:
          "Modulele sunt componentele de bază ale proiectului tău. Activează modulele din setările proiectului pentru a începe să le folosești.",
        primary_button: {
          text: "Gestionează funcțiile",
        },
      },
      page: {
        title: "Funcția Documentație nu este activată pentru proiect.",
        description:
          "Paginile sunt componentele de bază ale proiectului tău. Activează paginile din setările proiectului pentru a începe să le folosești.",
        primary_button: {
          text: "Gestionează funcțiile",
        },
      },
      view: {
        title: "Funcția Perspective nu este activată pentru proiect.",
        description:
          "Perspectivele sunt componentele de bază ale proiectului tău. Activează perspectivele din setările proiectului pentru a începe să le folosești.",
        primary_button: {
          text: "Gestionează funcțiile",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "Salvează o activitate ca schiță",
    empty_state: {
      title: "Elementele de lucru scrise pe jumătate, și în curând și comentariile, vor apărea aici.",
      description:
        "Ca să testezi, începe să adaugi o activitate și las-o nefinalizată sau creează prima ta schiță mai jos. 😉",
      primary_button: {
        text: "Creează prima ta schiță",
      },
    },
    delete_modal: {
      title: "Șterge schița",
      description: "Ești sigur că vrei să ștergi această schiță? Această acțiune este ireversibilă.",
    },
    toasts: {
      created: {
        success: "Schiță creată",
        error: "Activitatea nu a putut fi creată. Te rugăm să încerci din nou.",
      },
      deleted: {
        success: "Schiță ștearsă",
      },
    },
  },
  stickies: {
    title: "Notițele tale",
    placeholder: "click pentru a scrie aici",
    all: "Toate notițele",
    "no-data":
      "Notează o idee, surprinde un moment de inspirație sau înregistrează o idee. Adaugă o notiță pentru a începe.",
    add: "Adaugă notiță",
    search_placeholder: "Caută după titlu",
    delete: "Șterge notița",
    delete_confirmation: "Ești sigur că vrei să ștergi această notiță?",
    empty_state: {
      simple:
        "Notează o idee, surprinde un moment de inspirație sau înregistrează o idee. Adaugă o notiță pentru a începe.",
      general: {
        title: "Notițele sunt observații rapide și lucruri de făcut pe care le notezi din mers.",
        description:
          "Surprinde-ți gândurile și ideile fără efort, creând notițe la care poți avea acces oricând și de oriunde.",
        primary_button: {
          text: "Adaugă notiță",
        },
      },
      search: {
        title: "Nu se potrivește cu nicio notiță existentă.",
        description: `Încearcă un alt termen sau anunță-ne
 dacă ești sigur că ai căutat corect.`,
        primary_button: {
          text: "Adaugă notiță",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "Numele notiței nu poate depăși 100 de caractere.",
        already_exists: "Există deja o notiță fără descriere",
      },
      created: {
        title: "Notiță creată",
        message: "Notița a fost creată cu succes",
      },
      not_created: {
        title: "Notiță necreată",
        message: "Notița nu a putut fi creată",
      },
      updated: {
        title: "Notiță actualizată",
        message: "Notița a fost actualizată cu succes",
      },
      not_updated: {
        title: "Notiță neactualizată",
        message: "Notița nu a putut fi actualizată",
      },
      removed: {
        title: "Notiță ștearsă",
        message: "Notița a fost ștearsă cu succes",
      },
      not_removed: {
        title: "Notiță neștearsă",
        message: "Notița nu a putut fi ștearsă",
      },
    },
  },
  role_details: {
    guest: {
      title: "Invitat",
      description: "Membrii externi ai organizațiilor pot fi incluși ca invitați.",
    },
    member: {
      title: "Membru",
      description: "Poate citi, scrie, edita și șterge entități în proiecte, cicluri și module",
    },
    admin: {
      title: "Administrator",
      description: "Toate permisiunile setate pe adevărat în cadrul workspace-ului.",
    },
  },
  user_roles: {
    product_or_project_manager: "Manager de produs / proiect",
    development_or_engineering: "Dezvoltare / Inginerie",
    founder_or_executive: "Fondator / Director executiv",
    freelancer_or_consultant: "Liber profesionist / Consultant",
    marketing_or_growth: "Marketing / Creștere",
    sales_or_business_development: "Vânzări / Dezvoltare afaceri",
    support_or_operations: "Suport / Operațiuni",
    student_or_professor: "Student / Profesor",
    human_resources: "Resurse umane",
    other: "Altceva",
  },
  importer: {
    github: {
      title: "Github",
      description: "Importă activități din arhivele de cod GitHub și sincronizează-le.",
    },
    jira: {
      title: "Jira",
      description: "Importă activități și episoade din proiectele și episoadele Jira.",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "Exportă activitățile într-un fișier CSV.",
      short_description: "Exportă ca CSV",
    },
    excel: {
      title: "Excel",
      description: "Exportă activitățile într-un fișier Excel.",
      short_description: "Exportă ca Excel",
    },
    xlsx: {
      title: "Excel",
      description: "Exportă activitățile într-un fișier Excel.",
      short_description: "Exportă ca Excel",
    },
    json: {
      title: "JSON",
      description: "Exportă activitățile într-un fișier JSON.",
      short_description: "Exportă ca JSON",
    },
  },
  default_global_view: {
    all_issues: "Toate activitățile",
    assigned: "Atribuite",
    created: "Create",
    subscribed: "Urmărite",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "Preferință sistem",
      },
      light: {
        label: "Luminos",
      },
      dark: {
        label: "Întunecat",
      },
      light_contrast: {
        label: "Luminos cu contrast ridicat",
      },
      dark_contrast: {
        label: "Întunecat cu contrast ridicat",
      },
      custom: {
        label: "Temă personalizată",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "Restante",
      planned: "Planificate",
      in_progress: "În desfășurare",
      paused: "În pauză",
      completed: "Finalizat",
      cancelled: "Anulat",
    },
    layout: {
      list: "Aspect listă",
      board: "Aspect galerie",
      timeline: "Aspect cronologic",
    },
    order_by: {
      name: "Nume",
      progress: "Progres",
      issues: "Număr de activități",
      due_date: "Termen limită",
      created_at: "Dată creare",
      manual: "Manual",
    },
  },
  cycle: {
    label: "{count, plural, one {Ciclu} other {Cicluri}}",
    no_cycle: "Niciun ciclu",
  },
  module: {
    label: "{count, plural, one {Modul} other {Module}}",
    no_module: "Niciun modul",
  },
  description_versions: {
    last_edited_by: "Ultima editare de către",
    previously_edited_by: "Editat anterior de către",
    edited_by: "Editat de",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane nu a pornit. Aceasta ar putea fi din cauza că unul sau mai multe servicii Plane au eșuat să pornească.",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "Alegeți View Logs din setup.sh și logurile Docker pentru a fi siguri.",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "Contur",
        empty_state: {
          title: "Titluri lipsă",
          description: "Să punem câteva titluri în această pagină pentru a le vedea aici.",
        },
      },
      info: {
        label: "Info",
        document_info: {
          words: "Cuvinte",
          characters: "Caractere",
          paragraphs: "Paragrafe",
          read_time: "Timp de citire",
        },
        actors_info: {
          edited_by: "Editat de",
          created_by: "Creat de",
        },
        version_history: {
          label: "Istoricul versiunilor",
          current_version: "Versiunea curentă",
          highlight_changes: "Evidențiază modificările",
        },
      },
      assets: {
        label: "Resurse",
        download_button: "Descarcă",
        empty_state: {
          title: "Imagini lipsă",
          description: "Adăugați imagini pentru a le vedea aici.",
        },
      },
    },
    open_button: "Deschide panoul de navigare",
    close_button: "Închide panoul de navigare",
    outline_floating_button: "Deschide conturul",
  },
  workspace_dashboards: "Dashboarduri",
  pi_chat: "Plane AI",
  in_app: "În-app",
  forms: "Formulare",
  choose_workspace_for_integration: "Alegeți un spațiu de lucru pentru a conecta această aplicație",
  integrations_description:
    "Aplicațiile care funcționează cu Plane trebuie să se conecteze la un spațiu de lucru unde sunteți administrator.",
  create_a_new_workspace: "Creați un nou spațiu de lucru",
  no_workspaces_to_connect: "Nu există spații de lucru pentru a conecta",
  no_workspaces_to_connect_description:
    "Trebuie să creați un spațiu de lucru pentru a putea conecta integrări și modele",
  learn_more_about_workspaces: "Află mai multe despre spațiile de lucru",
  updates: {
    add_update: "Adaugă actualizare",
    add_update_placeholder: "Adaugă actualizarea ta aici",
    empty: {
      title: "Încă nu există actualizări",
      description: "Poți vedea actualizările aici.",
    },
    delete: {
      title: "Șterge actualizare",
      confirmation: "Ești sigur că vrei să ștergi această actualizare? Această acțiune este ireversibilă.",
      success: {
        title: "Actualizare ștearsă",
        message: "Actualizarea a fost ștearsă cu succes.",
      },
      error: {
        title: "Actualizare năo ștearsă",
        message: "Actualizarea nu a putut fi ștearsă.",
      },
    },
    update: {
      success: {
        title: "Actualizare actualizată",
        message: "Actualizarea a fost actualizată cu succes.",
      },
      error: {
        title: "Actualizare năo actualizată",
        message: "Actualizarea nu a putut fi actualizată.",
      },
    },
    reaction: {
      create: {
        success: {
          title: "Reacție creată",
          message: "Reacția a fost creată cu succes.",
        },
        error: {
          title: "Reacție năo creată",
          message: "Reacția nu a putut fi creată.",
        },
      },
      remove: {
        success: {
          title: "Reacție ștearsă",
          message: "Reacția a fost ștearsă cu succes.",
        },
        error: {
          title: "Reacție năo ștearsă",
          message: "Reacția nu a putut fi ștearsă.",
        },
      },
    },
    progress: {
      title: "Progres",
      since_last_update: "De la ultima actualizare",
      comments: "{count, plural, one{# comentariu} other{# comentarii}}",
    },
    create: {
      success: {
        title: "Actualizare creată",
        message: "Actualizarea a fost creată cu succes.",
      },
      error: {
        title: "Actualizare năo creată",
        message: "Actualizarea nu a putut fi creată.",
      },
    },
  },
  teamspaces: {
    label: "Spații de echipă",
    empty_state: {
      general: {
        title: "Spațiile de echipă deblochează o mai bună organizare și urmărire în Plane.",
        description:
          "Creează o suprafață dedicată pentru fiecare echipă din lumea reală, separată de toate celelalte suprafețe de lucru din Plane, și personalizează-le pentru a se potrivi cu modul în care lucrează echipa ta.",
        primary_button: {
          text: "Creează un nou spațiu de echipă",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "Nu ai conectat încă niciun spațiu de echipă.",
          description: "Proprietarii spațiului de echipă și ai proiectului pot gestiona accesul la proiecte.",
        },
      },
      primary_button: {
        text: "Conectează un spațiu de echipă",
      },
      secondary_button: {
        text: "Află mai multe",
      },
      table: {
        columns: {
          teamspaceName: "Numele spațiului de echipă",
          members: "Membri",
          accountType: "Tip de cont",
        },
        actions: {
          remove: {
            button: {
              text: "Elimină spațiul de echipă",
            },
            confirm: {
              title: "Elimină {teamspaceName} din {projectName}",
              description:
                "Când elimini acest spațiu de echipă dintr-un proiect conectat, membrii de aici își vor pierde accesul la proiectul conectat.",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "Nu s-au găsit spații de echipă potrivite",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {Ai conectat un spațiu de echipă la acest proiect.} other {Ai conectat # spații de echipă la acest proiect.}}",
            description:
              "{additionalCount, plural, =0 {Spațiul de echipă {firstTeamspaceName} este acum conectat la acest proiect.} other {Spațiul de echipă {firstTeamspaceName} și încă {additionalCount} sunt acum conectate la acest proiect.}}",
          },
          error: {
            title: "Nu a mers.",
            description: "Încearcă din nou sau reîncarcă această pagină înainte de a încerca din nou.",
          },
        },
        remove_teamspace: {
          success: {
            title: "Ai eliminat acel spațiu de echipă din acest proiect.",
            description: "Spațiul de echipă {teamspaceName} a fost eliminat din {projectName}.",
          },
          error: {
            title: "Nu a mers.",
            description: "Încearcă din nou sau reîncarcă această pagină înainte de a încerca din nou.",
          },
        },
      },
      link_teamspace: {
        placeholder: "Caută spații de echipă",
        info: {
          title: "Adăugarea unui spațiu de echipă oferă tuturor membrilor spațiului de echipă acces la acest proiect.",
          link: "Află mai multe",
        },
        empty_state: {
          no_teamspaces: {
            title: "Nu ai niciun spațiu de echipă de conectat.",
            description:
              "Fie nu ești într-un spațiu de echipă pe care îl poți conecta, fie ai conectat deja toate spațiile de echipă disponibile.",
          },
          no_results: {
            title: "Nu se potrivește cu niciunul dintre spațiile tale de echipă.",
            description: "Încearcă un alt termen sau asigură-te că ai spații de echipă de conectat.",
          },
        },
        primary_button: {
          text: "Conectează spațiile de echipă selectate",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "Creează elemente de lucru specifice echipei.",
        description:
          "Elementele de lucru care sunt atribuite membrilor acestei echipe în orice proiect conectat vor apărea automat aici. Dacă te aștepți să vezi anumite elemente de lucru aici, asigură-te că proiectele tale conectate au elemente de lucru atribuite membrilor acestei echipe sau creează elemente de lucru.",
        primary_button: {
          text: "Adaugă elemente de lucru la un proiect conectat",
        },
      },
      work_items_empty_filter: {
        title: "Nu există elemente de lucru specifice echipei pentru filtrele aplicate",
        description:
          "Schimbă unele dintre acele filtre sau șterge-le pe toate pentru a vedea elementele de lucru relevante pentru acest spațiu.",
        secondary_button: {
          text: "Șterge toate filtrele",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "Niciunul dintre proiectele tale conectate nu are un ciclu activ.",
        description:
          "Ciclurile active din proiectele conectate vor apărea automat aici. Dacă te aștepți să vezi un ciclu activ, asigură-te că rulează într-un proiect conectat chiar acum.",
      },
      completed: {
        title: "Niciunul dintre proiectele tale conectate nu are un ciclu finalizat.",
        description:
          "Ciclurile finalizate în proiectele conectate vor apărea automat aici. Dacă te aștepți să vezi un ciclu finalizat, asigură-te că este, de asemenea, finalizat într-un proiect conectat.",
      },
      upcoming: {
        title: "Niciunul dintre proiectele tale conectate nu are un ciclu viitor.",
        description:
          "Ciclurile viitoare în proiectele conectate vor apărea automat aici. Dacă te aștepți să vezi un ciclu viitor, asigură-te că există și într-un proiect conectat.",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title:
          "Vizualizările echipei tale asupra muncii tale fără a perturba alte vizualizări din spațiul tău de lucru",
        description:
          "Vezi munca echipei tale în vizualizări care sunt salvate doar pentru echipa ta și separat de vizualizările unui proiect.",
        primary_button: {
          text: "Creează o vizualizare",
        },
      },
      filter: {
        title: "Nicio vizualizare care să se potrivească",
        description: `Nicio vizualizare nu corespunde criteriilor de căutare.
 Creează o nouă vizualizare în schimb.`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "Găzduiește cunoștințele echipei tale în Paginile Echipei.",
        description:
          "Spre deosebire de paginile dintr-un proiect, poți salva cunoștințe specifice unei echipe într-un set separat de pagini aici. Obține toate funcțiile Paginilor, creează documente cu cele mai bune practici și wiki-uri de echipă cu ușurință.",
        primary_button: {
          text: "Creează prima ta pagină de echipă",
        },
      },
      filter: {
        title: "Nicio pagină care să se potrivească",
        description: "Elimină filtrele pentru a vedea toate paginile",
      },
      search: {
        title: "Nicio pagină care să se potrivească",
        description: "Elimină criteriile de căutare pentru a vedea toate paginile",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "Niciunul dintre proiectele tale conectate nu are elemente de lucru publicate.",
        description:
          "Creează câteva elemente de lucru într-unul sau mai multe dintre acele proiecte pentru a vedea progresul după date, stări și prioritate.",
      },
      relation: {
        blocking: {
          title: "Nu ai niciun element de lucru care să blocheze un coleg de echipă.",
          description: "Bună treabă! Ai eliberat calea pentru echipa ta. Ești un bun jucător de echipă.",
        },
        blocked: {
          title: "Nu ai niciun element de lucru al colegilor tăi care să te blocheze.",
          description: "Vești bune! Poți face progrese în toate elementele de lucru atribuite ție.",
        },
      },
      stats: {
        general: {
          title: "Niciunul dintre proiectele tale conectate nu are elemente de lucru publicate.",
          description:
            "Creează câteva elemente de lucru într-unul sau mai multe dintre acele proiecte pentru a vedea distribuția muncii după proiect și membrii echipei.",
        },
        filter: {
          title: "Nu există statistici de echipă pentru filtrele aplicate.",
          description:
            "Creează câteva elemente de lucru într-unul sau mai multe dintre acele proiecte pentru a vedea distribuția muncii după proiect și membrii echipei.",
        },
      },
    },
  },
  initiatives: {
    overview: "Prezentare generală",
    label: "Inițiative",
    placeholder: "{count, plural, one{# inițiativă} other{# inițiative}}",
    add_initiative: "Adaugă Inițiativă",
    create_initiative: "Creează Inițiativă",
    update_initiative: "Actualizează Inițiativă",
    initiative_name: "Numele inițiativei",
    all_initiatives: "Toate Inițiativele",
    delete_initiative: "Șterge Inițiativă",
    fill_all_required_fields: "Te rugăm să completezi toate câmpurile obligatorii.",
    toast: {
      create_success: "Inițiativa {name} creată cu succes.",
      create_error: "Eșec la crearea inițiativei. Te rugăm să încerci din nou!",
      update_success: "Inițiativa {name} actualizată cu succes.",
      update_error: "Eșec la actualizarea inițiativei. Te rugăm să încerci din nou!",
      delete: {
        success: "Inițiativa ștearsă cu succes.",
        error: "Eșec la ștergerea Inițiativei",
      },
      link_copied: "Link-ul inițiativei copiat în clipboard.",
      project_update_success: "Proiectele inițiativei actualizate cu succes.",
      project_update_error: "Eșec la actualizarea proiectelor inițiativei. Te rugăm să încerci din nou!",
      epic_update_success:
        "Epic{count, plural, one { adăugat la Inițiativă cu succes.} other {e adăugate la Inițiativă cu succes.}}",
      epic_update_error: "Adăugarea Epicului la Inițiativă a eșuat. Te rugăm să încerci din nou mai târziu.",
      state_update_success: "Starea inițiativei a fost actualizată cu succes.",
      state_update_error: "Actualizarea stării inițiativei a eșuat. Vă rugăm să încercați din nou!",
      label_update_error: "Nu s-a reușit actualizarea etichetelor inițiativei. Vă rugăm să încercați din nou!",
    },
    empty_state: {
      general: {
        title: "Organizează munca la cel mai înalt nivel cu Inițiative",
        description:
          "Când ai nevoie să organizezi munca care acoperă mai multe proiecte și echipe, Inițiativele vin în ajutor. Conectează proiecte și epice la inițiative, vezi actualizări automat grupate și vezi pădurea înainte de a ajunge la copaci.",
        primary_button: {
          text: "Creează o inițiativă",
        },
      },
      search: {
        title: "Nicio inițiativă care să se potrivească",
        description: `Nu s-au detectat inițiative cu criteriile de potrivire.
 Creează o nouă inițiativă în schimb.`,
      },
      not_found: {
        title: "Inițiativa nu există",
        description: "Inițiativa pe care o cauți nu există, a fost arhivată sau a fost ștearsă.",
        primary_button: {
          text: "Vezi alte Inițiative",
        },
      },
      epics: {
        title: "Nu ai epice care să se potrivească cu filtrele pe care le-ai aplicat.",
        subHeading: "Pentru a vedea toate epicele, șterge toate filtrele aplicate.",
        action: "Șterge filtrele",
      },
    },
    scope: {
      view_scope: "Vezi domeniu",
      breakdown: "Descompune domeniu",
      add_scope: "Adaugă domeniu",
      label: "Domeniu",
      empty_state: {
        title: "Nu a fost adăugat încă niciun domeniu la această inițiativă",
        description: "Conectează proiecte și epice la inițiativă pentru a începe.",
        primary_button: {
          text: "Adaugă domeniu",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "Etichete",
        description: "Structurați și organizați inițiativele dvs. cu etichete.",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "Șterge eticheta",
        content:
          "Sigur doriți să ștergeți {labelName}? Aceasta va elimina eticheta din toate inițiativele și din orice vizualizare în care eticheta este filtrată.",
      },
      toast: {
        delete_error: "Eticheta inițiativei nu a putut fi ștearsă. Vă rugăm să încercați din nou.",
        label_already_exists: "Eticheta există deja",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title:
          "Scrie o notă, un document sau o bază de cunoștințe completă. Obține ajutorul lui Galileo, asistentul AI al Plane, pentru a începe",
        description:
          "Paginile sunt spații de gândire în Plane. Notează notițe de întâlnire, formatează-le ușor, încorporează elemente de lucru, aranjează-le folosind o bibliotecă de componente și păstrează-le toate în contextul proiectului tău. Pentru a face o muncă scurtă din orice document, invocă Galileo, AI-ul Plane, cu o scurtătură sau click pe un buton.",
        primary_button: {
          text: "Creează prima ta pagină",
        },
      },
      private: {
        title: "Încă nu există pagini private",
        description:
          "Păstrează-ți gândurile private aici. Când ești gata să le împărtășești, echipa este la doar un click distanță.",
        primary_button: {
          text: "Creează prima ta pagină",
        },
      },
      public: {
        title: "Încă nu există pagini spațiu de lucru",
        description: "Vezi paginile împărtășite cu toată lumea din spațiul tău de lucru chiar aici.",
        primary_button: {
          text: "Creează prima ta pagină",
        },
      },
      archived: {
        title: "Încă nu există pagini arhivate",
        description: "Arhivează paginile care nu sunt pe radarul tău. Accesează-le aici când ai nevoie.",
      },
    },
  },
  epics: {
    label: "Epice",
    no_epics_selected: "Niciun epic selectat",
    add_selected_epics: "Adaugă epicele selectate",
    epic_link_copied_to_clipboard: "Link-ul epicului copiat în clipboard.",
    project_link_copied_to_clipboard: "Link-ul proiectului copiat în clipboard",
    empty_state: {
      general: {
        title: "Creează un epic și atribuie-l cuiva, chiar și ție",
        description:
          "Pentru corpuri mai mari de muncă care acoperă mai multe cicluri și pot trăi în mai multe module, creează un epic. Leagă elemente de lucru și sub-elemente de lucru într-un proiect la un epic și sari într-un element de lucru din prezentarea generală.",
        primary_button: {
          text: "Creează un Epic",
        },
      },
      section: {
        title: "Încă nu există epice",
        description: "Începe să adaugi epice pentru a gestiona și urmări progresul.",
        primary_button: {
          text: "Adaugă epice",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "Nu s-au găsit epice care să se potrivească",
      },
      no_epics: {
        title: "Nu s-au găsit epice",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "Niciun ciclu activ",
        description:
          "Ciclurile proiectelor tale care includ orice perioadă care cuprinde data de astăzi în intervalul său. Găsește progresul și detaliile tuturor ciclurilor tale active aici.",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: `Adaugă elemente de lucru la ciclu pentru a-i vedea
 progresul`,
      },
      priority: {
        title: `Observă elementele de lucru cu prioritate ridicată abordate în
 ciclu dintr-o privire.`,
      },
      assignee: {
        title: `Adaugă responsabili la elementele de lucru pentru a vedea o
 defalcare a muncii după responsabili.`,
      },
      label: {
        title: `Adaugă etichete la elementele de lucru pentru a vedea
 defalcarea muncii după etichete.`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "Importă membri din CSV",
      description: "Încărcați un CSV cu coloane: Email, Display Name, First Name, Last Name, Role (5, 15 sau 20)",
      dropzone: {
        active: "Plasați fișierul CSV aici",
        inactive: "Trageți și plasați sau faceți clic pentru a încărca",
        file_type: "Sunt acceptate doar fișiere .csv",
      },
      buttons: {
        cancel: "Anulare",
        import: "Importă",
        try_again: "Încearcă din nou",
        close: "Închide",
        done: "Gata",
      },
      progress: {
        uploading: "Se încarcă...",
        importing: "Se importă...",
      },
      summary: {
        title: {
          failed: "Import eșuat",
          complete: "Import finalizat",
        },
        message: {
          seat_limit: "Nu se pot importa membri din cauza restricțiilor de locuri.",
          success: "{count} membr{plural} adăugat{plural} cu succes în spațiul de lucru.",
          no_imports: "Nu au fost importați membri din fișierul CSV.",
        },
        stats: {
          successful: "Reușit",
          failed: "Eșuat",
        },
        download_errors: "Descarcă erori",
      },
      toast: {
        invalid_file: {
          title: "Fișier invalid",
          message: "Sunt acceptate doar fișiere CSV.",
        },
        import_failed: {
          title: "Import eșuat",
          message: "Ceva nu a funcționat.",
        },
      },
    },
  },
  project: {
    members_import: {
      title: "Importă membri din CSV",
      description:
        "Încărcați un CSV cu coloanele: Email și Rol (5=Invitat, 15=Membru, 20=Administrator). Utilizatorii trebuie să fie deja membri ai spațiului de lucru.",
      download_sample: "Descărcați CSV exemplu",
      dropzone: {
        active: "Plasați fișierul CSV aici",
        inactive: "Trageți și plasați sau faceți clic pentru a încărca",
        file_type: "Sunt acceptate doar fișiere .csv",
      },
      buttons: {
        cancel: "Anulare",
        import: "Importă",
        try_again: "Încearcă din nou",
        close: "Închide",
        done: "Gata",
      },
      progress: {
        uploading: "Se încarcă...",
        importing: "Se importă...",
      },
      summary: {
        title: {
          complete: "Import finalizat",
        },
        message: {
          success: "{count} membr{plural} importat{plural} cu succes în proiect.",
          no_imports: "Nu au fost importați membri noi din fișierul CSV.",
        },
        stats: {
          added: "Adăugate",
          reactivated: "Reactivați",
          already_members: "Deja membri",
          skipped: "Omise",
        },
        download_errors: "Descarcă detaliile omise",
      },
      toast: {
        invalid_file: {
          title: "Fișier invalid",
          message: "Sunt acceptate doar fișiere CSV.",
        },
        import_failed: {
          title: "Import eșuat",
          message: "Ceva nu a funcționat.",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "Imposibil de arhivat elementele de lucru",
        message: "Doar elementele de lucru aparținând grupelor de stare Finalizate sau Anulate pot fi arhivate.",
      },
      invalid_issue_start_date: {
        title: "Imposibil de actualizat elementele de lucru",
        message:
          "Data de început selectată succede data scadentă pentru unele elemente de lucru. Asigură-te că data de început este înainte de data scadentă.",
      },
      invalid_issue_target_date: {
        title: "Imposibil de actualizat elementele de lucru",
        message:
          "Data scadentă selectată precedă data de început pentru unele elemente de lucru. Asigură-te că data scadentă este după data de început.",
      },
      invalid_state_transition: {
        title: "Imposibil de actualizat elementele de lucru",
        message:
          "Schimbarea stării nu este permisă pentru unele elemente de lucru. Asigură-te că schimbarea stării este permisă.",
      },
    },
    workflows: {
      toggle: {
        title: "Activează fluxurile de lucru",
        description: "Setează fluxurile de lucru pentru a controla mișcarea elementelor de lucru",
        no_states_tooltip: "Nicio stare nu a fost adăugată în fluxul de lucru.",
        toast: {
          loading: {
            enabling: "Se activează fluxurile de lucru",
            disabling: "Se dezactivează fluxurile de lucru",
          },
          success: {
            title: "Succes!",
            message: "Fluxurile de lucru au fost activate cu succes.",
          },
          error: {
            title: "Eroare!",
            message: "Fluxurile de lucru nu au putut fi activate. Te rugăm să încerci din nou.",
          },
        },
      },
      heading: "Fluxuri de lucru",
      description:
        "Automatizează tranzițiile elementelor de lucru și stabilește reguli pentru a controla modul în care sarcinile avansează prin fluxul proiectului tău.",
      add_button: "Adaugă un flux de lucru nou",
      search: "Caută fluxuri de lucru",
      detail: {
        define: "Definește fluxul de lucru",
        add_states: "Adaugă stări",
        unmapped_states: {
          title: "Au fost detectate stări nemapate",
          description:
            "Unele elemente de lucru ale tipurilor selectate se află în prezent în stări care nu există în acest flux de lucru.",
          note: "Dacă activezi acest flux de lucru, aceste elemente vor fi mutate automat în starea inițială a acestui flux de lucru.",
          label: "Stări lipsă",
          tooltip:
            "Unele elemente de lucru se află în stări care nu sunt mapate la acest flux de lucru. Deschide fluxul de lucru pentru a-l revizui.",
        },
      },
      select_states: {
        empty_state: {
          title: "Toate stările sunt în uz",
          description: "Toate stările definite pentru acest proiect sunt deja prezente în fluxul de lucru curent.",
        },
      },
      default_footer: {
        fallback_message:
          "Acest flux de lucru se aplică oricărui tip de element de lucru care nu este atribuit unui flux de lucru.",
      },
      create: {
        heading: "Creează un flux de lucru nou",
      },
    },
  },
  work_item_types: {
    label: "Tipuri de Elemente de Lucru",
    label_lowercase: "tipuri de elemente de lucru",
    settings: {
      title: "Tipuri de Elemente de Lucru",
      properties: {
        title: "Proprietăți personalizate",
        tooltip:
          "Fiecare tip de element de lucru vine cu un set implicit de proprietăți precum Titlu, Descriere, Responsabil, Stare, Prioritate, Data de început, Data scadentă, Modul, Ciclu etc. De asemenea, poți personaliza și adăuga propriile proprietăți pentru a le adapta nevoilor echipei tale.",
        add_button: "Adaugă proprietate nouă",
        dropdown: {
          label: "Tip de proprietate",
          placeholder: "Selectează tipul",
        },
        property_type: {
          text: {
            label: "Text",
          },
          number: {
            label: "Număr",
          },
          dropdown: {
            label: "Dropdown",
          },
          boolean: {
            label: "Boolean",
          },
          date: {
            label: "Dată",
          },
          member_picker: {
            label: "Selector de membri",
          },
          release_picker: {
            label: "Selector de lansări",
          },
          formula: {
            label: "Formulă",
          },
        },
        attributes: {
          label: "Atribute",
          text: {
            single_line: {
              label: "Linie unică",
            },
            multi_line: {
              label: "Paragraf",
            },
            readonly: {
              label: "Doar citire",
              header: "Date doar pentru citire",
            },
            invalid_text_format: {
              label: "Format de text invalid",
            },
          },
          number: {
            default: {
              placeholder: "Adaugă număr",
            },
          },
          relation: {
            single_select: {
              label: "Selecție unică",
            },
            multi_select: {
              label: "Selecție multiplă",
            },
            no_default_value: {
              label: "Nicio valoare implicită",
            },
          },
          boolean: {
            label: "Adevărat | Fals",
            no_default: "Nicio valoare implicită",
          },
          option: {
            create_update: {
              label: "Opțiuni",
              form: {
                placeholder: "Adaugă opțiune",
                errors: {
                  name: {
                    required: "Numele opțiunii este obligatoriu.",
                    integrity: "Opțiunea cu același nume există deja.",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "Selectează opțiune",
                multi: {
                  default: "Selectează opțiuni",
                  variable: "{count} opțiuni selectate",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "Succes!",
              message: "Proprietatea {name} a fost creată cu succes.",
            },
            error: {
              title: "Eroare!",
              message: "Nu s-a putut crea proprietatea. Te rugăm să încerci din nou!",
            },
          },
          update: {
            success: {
              title: "Succes!",
              message: "Proprietatea {name} a fost actualizată cu succes.",
            },
            error: {
              title: "Eroare!",
              message: "Nu s-a putut actualiza proprietatea. Te rugăm să încerci din nou!",
            },
          },
          delete: {
            success: {
              title: "Succes!",
              message: "Proprietatea {name} a fost ștearsă cu succes.",
            },
            error: {
              title: "Eroare!",
              message: "Nu s-a putut șterge proprietatea. Te rugăm să încerci din nou!",
            },
          },
          enable_disable: {
            loading: "{action} proprietatea {name}",
            success: {
              title: "Succes!",
              message: "Proprietatea {name} {action} cu succes.",
            },
            error: {
              title: "Eroare!",
              message: "Nu s-a putut {action} proprietatea. Te rugăm să încerci din nou!",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "Titlu",
            },
            description: {
              placeholder: "Descriere",
            },
          },
          errors: {
            name: {
              required: "Trebuie să denumești proprietatea ta.",
              max_length: "Numele proprietății nu trebuie să depășească 255 de caractere.",
            },
            property_type: {
              required: "Trebuie să selectezi un tip de proprietate.",
            },
            options: {
              required: "Trebuie să adaugi cel puțin o opțiune.",
            },
            formula: {
              required: "Expresia formulei este obligatorie.",
              invalid: "Formulă invalidă: {error}",
              circular_reference:
                "Referință circulară detectată. O formulă nu poate face referire la ea însăși direct sau indirect.",
              invalid_reference: "Formula face referire la o proprietate inexistentă.",
            },
          },
        },
        formula: {
          field_label: "Câmp formulă",
          tooltip: "Introduceți o formulă folosind sintaxa '{'Nume câmp'}'. Suportă operatorii +, -, *, / și &.",
          placeholder: "Scrieți formula",
          test_button: "Test",
          validating: "Se validează",
          validation_success: "Formula este validă! Returnează {resultType}",
          validation_success_with_refs:
            "Formula este validă! Returnează {resultType} ({count} câmp(uri) referențiat(e))",
          error: {
            empty: "Vă rugăm introduceți o formulă",
            missing_context: "Lipsește contextul spațiului de lucru, proiectului sau tipului de element de lucru",
            validation_failed: "Validarea a eșuat",
          },
          picker: {
            no_match: "Nicio proprietate corespunzătoare",
            no_available: "Nicio proprietate disponibilă",
          },
        },
        enable_disable: {
          label: "Activ",
          tooltip: {
            disabled: "Click pentru a dezactiva",
            enabled: "Click pentru a activa",
          },
        },
        delete_confirmation: {
          title: "Șterge această proprietate",
          description: "Ștergerea proprietăților poate duce la pierderea datelor existente.",
          secondary_description: "Vrei să dezactivezi proprietatea în schimb?",
          primary_button: "{action}, șterge-o",
          secondary_button: "Da, dezactiveaz-o",
        },
        mandate_confirmation: {
          label: "Proprietate obligatorie",
          content:
            "Se pare că există o opțiune implicită pentru această proprietate. Dacă faci proprietatea obligatorie, aceasta va elimina valoarea implicită, iar utilizatorii vor trebui să adauge o valoare la alegerea lor.",
          tooltip: {
            disabled: "Acest tip de proprietate nu poate fi făcut obligatoriu",
            enabled: "Debifează pentru a marca câmpul ca opțional",
            checked: "Bifează pentru a marca câmpul ca obligatoriu",
          },
        },
        empty_state: {
          title: "Adaugă proprietăți personalizate",
          description: "Noile proprietăți pe care le adaugi pentru acest tip de element de lucru vor apărea aici.",
        },
      },
      item_delete_confirmation: {
        title: "Șterge acest tip",
        description: "Ștergerea tipurilor poate duce la pierderea datelor existente.",
        primary_button: "Da, șterge-l",
        toast: {
          success: {
            title: "Succes!",
            message: "Tipul elementului de lucru a fost șters cu succes.",
          },
          error: {
            title: "Eroare!",
            message: "Ștergerea tipului de element de lucru a eșuat. Vă rugăm să încercați din nou!",
          },
        },
        errors: {
          cannot_delete_default_work_item_type: "Nu se poate șterge tipul implicit de element de lucru",
          cannot_delete_work_item_type_with_associated_work_items:
            "Nu se poate șterge tipul de element de lucru cu elemente de lucru asociate",
        },
        can_disable_warning: "Doriți să dezactivați tipul în schimb?",
      },
      cant_delete_default_message:
        "Nu se poate șterge acest tip de element de lucru deoarece este setat ca tip implicit pentru acest proiect.",
      set_as_default: "Setează ca implicit",
      cant_set_default_inactive_message: "Activează acest tip înainte de a-l seta ca implicit",
      set_default_confirmation: {
        title: "Setează ca tip implicit de element de lucru",
        description:
          "Setarea {name} ca implicit îl va importa în toate proiectele din acest spațiu de lucru. Toate elementele de lucru noi vor folosi acest tip în mod implicit.",
        confirm_button: "Setează ca implicit",
      },
    },
    create: {
      title: "Creează tip de element de lucru",
      button: "Adaugă tip de element de lucru",
      toast: {
        success: {
          title: "Succes!",
          message: "Tipul de element de lucru a fost creat cu succes.",
        },
        error: {
          title: "Eroare!",
          message: {
            conflict: "Tipul {name} există deja. Alegeți un alt nume.",
          },
        },
      },
    },
    update: {
      title: "Actualizează tipul de element de lucru",
      button: "Actualizează tipul de element de lucru",
      toast: {
        success: {
          title: "Succes!",
          message: "Tipul de element de lucru {name} a fost actualizat cu succes.",
        },
        error: {
          title: "Eroare!",
          message: {
            conflict: "Tipul {name} există deja. Alegeți un alt nume.",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "Dă acestui tip de element de lucru un nume unic",
        },
        description: {
          placeholder: "Descrie pentru ce este destinat acest tip de element de lucru și când trebuie utilizat.",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{action} tipul de element de lucru {name}",
        success: {
          title: "Succes!",
          message: "Tipul de element de lucru {name} {action} cu succes.",
        },
        error: {
          title: "Eroare!",
          message: "Nu s-a putut {action} tipul de element de lucru. Te rugăm să încerci din nou!",
        },
      },
      tooltip: "Click pentru a {action}",
    },
    change_confirmation: {
      title: "Schimbați tipul de element de lucru?",
      description:
        "Schimbarea tipului de element de lucru poate duce la pierderea valorilor proprietăților personalizate care sunt specifice tipului curent. Această acțiune nu poate fi anulată.",
      button: {
        loading: "Se schimbă",
        default: "Schimbă tipul",
      },
    },
    empty_state: {
      enable: {
        title: "Activează Tipurile de Elemente de Lucru",
        description:
          "Modelează elementele de lucru pentru munca ta cu Tipuri de elemente de lucru. Personalizează cu pictograme, fundaluri și proprietăți și configurează-le pentru acest proiect.",
        primary_button: {
          text: "Activează",
        },
        confirmation: {
          title: "Odată activate, Tipurile de Elemente de Lucru nu pot fi dezactivate.",
          description:
            "Elementul de Lucru al Plane va deveni tipul implicit de element de lucru pentru acest proiect și va apărea cu pictograma și fundalul său în acest proiect.",
          button: {
            default: "Activează",
            loading: "Se configurează",
          },
        },
      },
      get_pro: {
        title: "Obține Pro pentru a activa Tipurile de Elemente de Lucru.",
        description:
          "Modelează elementele de lucru pentru munca ta cu Tipuri de elemente de lucru. Personalizează cu pictograme, fundaluri și proprietăți și configurează-le pentru acest proiect.",
        primary_button: {
          text: "Obține Pro",
        },
      },
      upgrade: {
        title: "Actualizează pentru a activa Tipurile de Elemente de Lucru.",
        description:
          "Modelează elementele de lucru pentru munca ta cu Tipuri de elemente de lucru. Personalizează cu pictograme, fundaluri și proprietăți și configurează-le pentru acest proiect.",
        primary_button: {
          text: "Actualizează",
        },
      },
    },
  },
  importers: {
    imports: "Importuri",
    logo: "Logo",
    import_message: "Importă datele tale {serviceName} în proiectele plane.",
    deactivate: "Dezactivează",
    deactivating: "Se dezactivează",
    migrating: "Se migrează",
    migrations: "Migrări",
    refreshing: "Se reîmprospătează",
    import: "Importă",
    serial_number: "Nr. Sr.",
    project: "Proiect",
    workspace: "Workspace",
    status: "Status",
    summary: "Sumar",
    total_batches: "Total Loturi",
    imported_batches: "Loturi Importate",
    re_run: "Rulează din nou",
    cancel: "Anulează",
    start_time: "Timp de începere",
    no_jobs_found: "Nu s-au găsit joburi",
    no_project_imports: "Nu ai importat încă niciun proiect {serviceName}.",
    cancel_import_job: "Anulează jobul de import",
    cancel_import_job_confirmation:
      "Ești sigur că vrei să anulezi acest job de import? Acest lucru va opri procesul de import pentru acest proiect.",
    re_run_import_job: "Rerulează jobul de import",
    re_run_import_job_confirmation:
      "Ești sigur că vrei să rerulezi acest job de import? Acest lucru va reporni procesul de import pentru acest proiect.",
    upload_csv_file: "Încarcă un fișier CSV pentru a importa date despre utilizatori.",
    connect_importer: "Conectează {serviceName}",
    migration_assistant: "Asistent de Migrare",
    migration_assistant_description:
      "Migrează fără probleme proiectele tale {serviceName} către Plane cu asistentul nostru puternic.",
    token_helper: "Vei obține acest lucru de la",
    personal_access_token: "Token de Acces Personal",
    source_token_expired: "Token Expirat",
    source_token_expired_description:
      "Tokenul furnizat a expirat. Te rugăm să dezactivezi și să reconectezi cu un nou set de credențiale.",
    user_email: "Email Utilizator",
    select_state: "Selectează Starea",
    select_service_project: "Selectează Proiectul {serviceName}",
    loading_service_projects: "Se încarcă proiectele {serviceName}",
    select_service_workspace: "Selectează Workspace-ul {serviceName}",
    loading_service_workspaces: "Se încarcă Workspace-urile {serviceName}",
    select_priority: "Selectează Prioritatea",
    select_service_team: "Selectează Echipa {serviceName}",
    add_seat_msg_free_trial:
      "Încerci să imporți {additionalUserCount} utilizatori neînregistrați și ai doar {currentWorkspaceSubscriptionAvailableSeats} locuri disponibile în planul curent. Pentru a continua importul, actualizează acum.",
    add_seat_msg_paid:
      "Încerci să imporți {additionalUserCount} utilizatori neînregistrați și ai doar {currentWorkspaceSubscriptionAvailableSeats} locuri disponibile în planul curent. Pentru a continua importul, cumpără cel puțin {extraSeatRequired} locuri suplimentare.",
    skip_user_import_title: "Omite importul datelor utilizatorilor",
    skip_user_import_description:
      "Omiterea importului utilizatorilor va avea ca rezultat crearea elementelor de lucru, a comentariilor și a altor date din {serviceName} de către utilizatorul care efectuează migrarea în Plane. Poți adăuga manual utilizatori mai târziu.",
    invalid_pat: "Token de Acces Personal Invalid",
  },
  integrations: {
    integrations: "Integrări",
    loading: "Se încarcă",
    unauthorized: "Nu ești autorizat să vezi această pagină.",
    configure: "Configurează",
    not_enabled: "{name} nu este activat pentru acest workspace.",
    not_configured: "Neconfigurat",
    disconnect_personal_account: "Deconectează contul personal {providerName}",
    not_configured_message_admin:
      "Integrarea {name} nu este configurată. Te rugăm să contactezi administratorul instanței pentru a o configura.",
    not_configured_message_support:
      "Integrarea {name} nu este configurată. Te rugăm să contactezi suportul pentru a o configura.",
    external_api_unreachable: "Nu se poate accesa API-ul extern. Te rugăm să încerci din nou mai târziu.",
    error_fetching_supported_integrations:
      "Nu se pot prelua integrările suportate. Te rugăm să încerci din nou mai târziu.",
    back_to_integrations: "Înapoi la integrări",
    select_state: "Selectează Starea",
    set_state: "Setează Starea",
    choose_project: "Alege Proiectul...",
    skip_backward_state_movement: "Împiedică mutarea problemelor într-o stare anterioară din cauza actualizărilor PR",
  },
  github_integration: {
    name: "GitHub",
    description: "Conectează și sincronizează elementele tale de lucru GitHub cu Plane",
    connect_org: "Conectează Organizația",
    connect_org_description: "Conectează organizația ta GitHub cu Plane",
    processing: "Se procesează",
    org_added_desc: "GitHub org adăugată de și timp",
    connection_fetch_error: "Eroare la preluarea detaliilor conexiunii de la server",
    personal_account_connected: "Cont personal conectat",
    personal_account_connected_description: "Contul tău GitHub este acum conectat la Plane",
    connect_personal_account: "Conectează Cont Personal",
    connect_personal_account_description: "Conectează contul tău personal GitHub cu Plane.",
    repo_mapping: "Mapare Repozitoriu",
    repo_mapping_description: "Mapează repository-urile tale GitHub cu proiectele Plane.",
    project_issue_sync: "Sincronizare Problema Proiect",
    project_issue_sync_description: "Sincronizează problemele de la GitHub la proiectul tău Plane",
    project_issue_sync_empty_state: "Sincronizările problemelor de proiect mapate vor apărea aici",
    configure_project_issue_sync_state: "Configurează Starea de Sincronizare a Problemei",
    select_issue_sync_direction: "Selectează direcția de sincronizare a problemelor",
    allow_bidirectional_sync:
      "Bidirecional - Sincronizează probleme și comentarii în ambele sensuri între GitHub și Plane",
    allow_unidirectional_sync: "Unidirectional - Sincronizează probleme și comentariile de la GitHub la Plane doar",
    allow_unidirectional_sync_warning:
      "Datele din GitHub Issue vor înlocui datele din Elementul de Lucru Plane Legat (GitHub → Plane doar)",
    remove_project_issue_sync: "Elimină această Sincronizare Problema Proiect",
    remove_project_issue_sync_confirmation: "Ești sigur că vrei să elimiști această sincronizare problema proiect?",
    add_pr_state_mapping: "Adaugă Mapare Stare Pull Request pentru Proiectul Plane",
    edit_pr_state_mapping: "Editare Mapare Stare Pull Request pentru Proiectul Plane",
    pr_state_mapping: "Mapare Stare Pull Request",
    pr_state_mapping_description: "Mapează stările pull request de la GitHub la proiectul tău Plane",
    pr_state_mapping_empty_state: "Stările PR mapate vor apărea aici",
    remove_pr_state_mapping: "Elimină această Mapare Stare Pull Request",
    remove_pr_state_mapping_confirmation: "Ești sigur că vrei să elimiști această mapare de stare pull request?",
    issue_sync_message: "Elementele de lucru sunt sincronizate cu {project}",
    link: "Leagă Repozitoriu GitHub la Proiectul Plane",
    pull_request_automation: "Automatizare Pull Request",
    pull_request_automation_description: "Configurează maparea stării pull request de la GitHub la proiectul tău Plane",
    DRAFT_MR_OPENED: "Draft Deschis",
    MR_OPENED: "Deschis",
    MR_READY_FOR_MERGE: "Gata pentru Fuzionare",
    MR_REVIEW_REQUESTED: "Revizuire Solicitată",
    MR_MERGED: "Fuzionat",
    MR_CLOSED: "Închis",
    ISSUE_OPEN: "Issue Deschis",
    ISSUE_CLOSED: "Issue Închis",
    save: "Salvează",
    start_sync: "Start Sincronizare",
    choose_repository: "Alege Repozitoriu...",
  },
  gitlab_integration: {
    name: "Gitlab",
    description: "Conectează și sincronizează cererile tale de fuzionare Gitlab cu Plane.",
    connection_fetch_error: "Eroare la preluarea detaliilor conexiunii de la server",
    connect_org: "Conectează Organizația",
    connect_org_description: "Conectează organizația ta Gitlab cu Plane.",
    project_connections: "Conexiuni Proiect Gitlab",
    project_connections_description: "Sincronizează cererile de fuzionare de la Gitlab la proiectele Plane.",
    plane_project_connection: "Conexiune Proiect Plane",
    plane_project_connection_description: "Configurează maparea stării cererilor pull de la Gitlab la proiectele Plane",
    remove_connection: "Elimină Conexiunea",
    remove_connection_confirmation: "Ești sigur că vrei să elimini această conexiune?",
    link: "Leagă repozitoriul Gitlab la proiectul Plane",
    pull_request_automation: "Automatizare Pull Request",
    pull_request_automation_description: "Configurează maparea stării pull request de la Gitlab la Plane",
    DRAFT_MR_OPENED: "La deschiderea MR-ului draft, setează starea la",
    MR_OPENED: "La deschiderea MR-ului, setează starea la",
    MR_REVIEW_REQUESTED: "La solicitarea revizuirii MR-ului, setează starea la",
    MR_READY_FOR_MERGE: "Când MR-ul este gata de fuzionare, setează starea la",
    MR_MERGED: "La fuzionarea MR-ului, setează starea la",
    MR_CLOSED: "La închiderea MR-ului, setează starea la",
    integration_enabled_text:
      "Cu integrarea Gitlab activată, poți automatiza fluxurile de lucru ale elementelor de lucru",
    choose_entity: "Alege Entitatea",
    choose_project: "Alege Proiectul",
    link_plane_project: "Leagă proiectul Plane",
    project_issue_sync: "Sincronizare probleme proiect",
    project_issue_sync_description: "Sincronizează problemele din Gitlab în proiectul tău Plane",
    project_issue_sync_empty_state: "Sincronizarea problemelor de proiect mapate va apărea aici",
    configure_project_issue_sync_state: "Configurează starea sincronizării problemelor",
    select_issue_sync_direction: "Selectează direcția de sincronizare a problemelor",
    allow_bidirectional_sync:
      "Bidirecțional - Sincronizează probleme și comentarii în ambele direcții între Gitlab și Plane",
    allow_unidirectional_sync: "Unidirecțional - Sincronizează probleme și comentarii doar din Gitlab în Plane",
    allow_unidirectional_sync_warning:
      "Datele din Gitlab Issue vor înlocui datele din Elementul de lucru Plane legat (doar Gitlab → Plane)",
    remove_project_issue_sync: "Elimină această sincronizare a problemelor de proiect",
    remove_project_issue_sync_confirmation:
      "Ești sigur că vrei să elimini această sincronizare a problemelor de proiect?",
    ISSUE_OPEN: "Problemă deschisă",
    ISSUE_CLOSED: "Problemă închisă",
    save: "Salvează",
    start_sync: "Începe sincronizarea",
    choose_repository: "Alege depozitul...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Conectați și sincronizați instanța dumneavoastră Gitlab Enterprise cu Plane.",
    app_form_title: "Configurare Gitlab Enterprise",
    app_form_description: "Configurați Gitlab Enterprise pentru a se conecta la Plane.",
    base_url_title: "URL de bază",
    base_url_description: "URL-ul de bază al instanței dumneavoastră Gitlab Enterprise.",
    base_url_placeholder: 'ex. "https://glab.plane.town"',
    base_url_error: "URL-ul de bază este obligatoriu",
    invalid_base_url_error: "URL de bază invalid",
    client_id_title: "ID App",
    client_id_description: "ID-ul aplicației pe care ați creat-o în instanța dumneavoastră Gitlab Enterprise.",
    client_id_placeholder: 'ex. "7cd732xxxxxxxxxxxxxx"',
    client_id_error: "ID-ul App este obligatoriu",
    client_secret_title: "Client Secret",
    client_secret_description:
      "Client secret-ul aplicației pe care ați creat-o în instanța dumneavoastră Gitlab Enterprise.",
    client_secret_placeholder: 'ex. "gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "Client secret este obligatoriu",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description:
      "Un webhook secret aleatoriu care va fi folosit pentru a verifica webhook-ul din instanța Gitlab Enterprise.",
    webhook_secret_placeholder: 'ex. "webhook1234567890"',
    webhook_secret_error: "Webhook secret este obligatoriu",
    connect_app: "Conectează App",
  },
  slack_integration: {
    name: "Slack",
    description: "Conectează workspace-ul tău Slack cu Plane.",
    connect_personal_account: "Conectează contul tău personal Slack cu Plane.",
    personal_account_connected: "Contul tău personal {providerName} este acum conectat la Plane.",
    link_personal_account: "Leagă contul tău personal {providerName} de Plane.",
    connected_slack_workspaces: "Workspace-uri Slack conectate",
    connected_on: "Conectat pe {date}",
    disconnect_workspace: "Deconectează workspace-ul {name}",
    alerts: {
      dm_alerts: {
        title:
          "Primește notificări în mesajele directe Slack pentru actualizări importante, memento-uri și alerte doar pentru tine.",
      },
    },
    project_updates: {
      title: "Actualizări Proiect",
      description: "Configurează notificări de actualizări ale proiectelor pentru proiectele tale",
      add_new_project_update: "Adaugă o nouă notificare de actualizări proiect",
      project_updates_empty_state: "Proiectele conectate cu Canale Slack vor apărea aici.",
      project_updates_form: {
        title: "Configurează Actualizări Proiect",
        description: "Primește notificări de actualizări proiect în Slack când sunt create elemente de lucru",
        failed_to_load_channels: "Nu s-au putut încărca canalele din Slack",
        project_dropdown: {
          placeholder: "Selectează un proiect",
          label: "Proiect Plane",
          no_projects: "Nu există proiecte disponibile",
        },
        channel_dropdown: {
          label: "Canal Slack",
          placeholder: "Selectează un canal",
          no_channels: "Nu există canale disponibile",
        },
        all_projects_connected: "Toate proiectele sunt deja conectate la canale Slack.",
        all_channels_connected: "Toate canalele Slack sunt deja conectate la proiecte.",
        project_connection_success: "Conexiunea proiectului a fost creată cu succes",
        project_connection_updated: "Conexiunea proiectului a fost actualizată cu succes",
        project_connection_deleted: "Conexiunea proiectului a fost ștearsă cu succes",
        failed_delete_project_connection: "Nu s-a putut șterge conexiunea proiectului",
        failed_create_project_connection: "Nu s-a putut crea conexiunea proiectului",
        failed_upserting_project_connection: "Nu s-a putut actualiza conexiunea proiectului",
        failed_loading_project_connections:
          "Nu am putut încărca conexiunile proiectelor tale. Acest lucru ar putea fi din cauza unei probleme de rețea sau a unei probleme cu integrarea.",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "Conectează spațiul tău de lucru Sentry cu Plane.",
    connected_sentry_workspaces: "Spații de lucru Sentry conectate",
    connected_on: "Conectat la {date}",
    disconnect_workspace: "Deconectează spațiul de lucru {name}",
    state_mapping: {
      title: "Maparea stărilor",
      description:
        "Mapează stările incidentelor Sentry la stările proiectului tău. Configurează ce stări să folosești când un incident Sentry este rezolvat sau nerezolvat.",
      add_new_state_mapping: "Adaugă mapare nouă de stare",
      empty_state:
        "Nu sunt configurate mapări de stări. Creează prima ta mapare pentru a sincroniza stările incidentelor Sentry cu stările proiectului tău.",
      failed_loading_state_mappings:
        "Nu am putut încărca mapările tale de stări. Aceasta ar putea fi din cauza unei probleme de rețea sau a unei probleme cu integrarea.",
      loading_project_states: "Se încarcă stările proiectului...",
      error_loading_states: "Eroare la încărcarea stărilor",
      no_states_available: "Nu sunt disponibile stări",
      no_permission_states: "Nu ai permisiunea de a accesa stările pentru acest proiect",
      states_not_found: "Stările proiectului nu au fost găsite",
      server_error_states: "Eroare de server la încărcarea stărilor",
    },
  },
  oauth_bridge_integration: {
    name: "OAuth Bridge",
    description: "Validează tokenurile IdP externe pentru accesul la API.",
    header_description:
      "Validați tokenurile OIDC/JWT emise extern de IdP-ul dvs. (Azure AD, Okta etc.) pentru accesul la API-ul Plane.",
    connected: "Conectat",
    connect: "Conectare",
    uninstall: "Dezinstalare",
    uninstalling: "Se dezinstalează...",
    install_success: "OAuth Bridge instalat cu succes.",
    install_error: "Instalarea OAuth Bridge a eșuat.",
    uninstall_success: "OAuth Bridge dezinstalat.",
    uninstall_error: "Dezinstalarea OAuth Bridge a eșuat.",
    token_providers: "Furnizori de tokenuri",
    token_providers_description: "Configurați IdP-urile externe ale căror JWT-uri sunt acceptate ca credențiale API.",
    add_provider: "Adăugare furnizor",
    edit_provider: "Editare furnizor",
    enabled: "Activat",
    disabled: "Dezactivat",
    test: "Test",
    no_providers_title: "Niciun furnizor configurat.",
    no_providers_description: "Adăugați un IdP pentru a activa autentificarea cu tokenuri externe.",
    provider_updated: "Furnizor actualizat.",
    provider_added: "Furnizor adăugat.",
    provider_save_error: "Salvarea furnizorului a eșuat.",
    provider_deleted: "Furnizor șters.",
    provider_delete_error: "Ștergerea furnizorului a eșuat.",
    provider_update_error: "Actualizarea furnizorului a eșuat.",
    jwks_reachable: "JWKS accesibil",
    jwks_unreachable: "JWKS inaccesibil",
    jwks_test_error: "Nu s-a putut obține JWKS de la URL-ul configurat.",
    provider_form: {
      name_label: "Nume",
      name_placeholder: "ex. Azure AD Production",
      name_description: "Etichetă lizibilă pentru acest furnizor de identitate",
      name_required: "Numele este obligatoriu.",
      issuer_label: "Emitent",
      issuer_placeholder: "https://login.microsoftonline.com/tenant-id/v2.0",
      issuer_description: "Valoarea așteptată a claim-ului iss din JWT",
      issuer_required: "Emitentul este obligatoriu.",
      jwks_url_label: "URL JWKS",
      jwks_url_placeholder: "https://login.microsoftonline.com/tenant-id/discovery/v2.0/keys",
      jwks_url_description: "Endpoint HTTPS care furnizează JSON Web Key Set-ul furnizorului",
      jwks_url_required: "URL-ul JWKS este obligatoriu.",
      jwks_url_https: "URL-ul JWKS trebuie să folosească HTTPS.",
      audience_label: "Audiență",
      audience_placeholder: "api://my-app-id",
      audience_description: "Claim-urile aud așteptate din JWT, separate prin virgulă.",
      user_claim_label: "Claim utilizator",
      user_claim_placeholder: "email",
      user_claim_description: "Claim JWT care conține adresa de email a utilizatorului",
      user_claim_required: "Claim-ul utilizator este obligatoriu.",
      allowed_algorithms_label: "Algoritmi de semnare permiși",
      allowed_algorithms_description: "Algoritmi asimetrici acceptați pentru verificarea semnăturii JWT",
      allowed_algorithms_required: "Este necesar cel puțin un algoritm.",
      select_algorithms: "Selectați algoritmi",
      jwks_cache_ttl_label: "TTL cache JWKS (secunde)",
      jwks_cache_ttl_description:
        "Durata stocării în cache a cheilor JWKS ale furnizorului (minim 60s, implicit 24 ore)",
      jwks_cache_ttl_min: "TTL-ul cache-ului trebuie să fie de cel puțin 60 secunde.",
      rate_limit_label: "Limită de rată",
      rate_limit_placeholder: "120/minute",
      rate_limit_description: "Limitare cereri ca număr/perioadă (ex. 120/minute). Lăsați gol pentru limita implicită.",
      enable_provider: "Activează acest furnizor",
      saving: "Se salvează...",
      update: "Actualizare",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "Conectează și sincronizează organizația ta GitHub Enterprise cu Plane.",
    app_form_title: "Configurare GitHub Enterprise",
    app_form_description: "Configurează GitHub Enterprise pentru a se conecta cu Plane.",
    app_id_title: "ID Aplicație",
    app_id_description: "ID-ul aplicației pe care l-ai creat în organizația ta GitHub Enterprise.",
    app_id_placeholder: 'e.g., "1234567890"',
    app_id_error: "ID-ul aplicației este obligatoriu",
    app_name_title: "Slug Aplicație",
    app_name_description: "Slug-ul aplicației pe care l-ai creat în organizația ta GitHub Enterprise.",
    app_name_error: "Slug-ul aplicației este obligatoriu",
    app_name_placeholder: 'e.g., "plane-github-enterprise"',
    base_url_title: "URL de bază",
    base_url_description: "URL-ul de bază al organizației tale GitHub Enterprise.",
    base_url_placeholder: 'e.g., "https://gh.plane.town"',
    base_url_error: "URL-ul de bază este obligatoriu",
    invalid_base_url_error: "URL-ul de bază este invalid",
    client_id_title: "ID Client",
    client_id_description: "ID-ul client al aplicației pe care l-ai creat în organizația ta GitHub Enterprise.",
    client_id_placeholder: 'e.g., "1234567890"',
    client_id_error: "ID-ul client este obligatoriu",
    client_secret_title: "Secret Client",
    client_secret_description: "Secret-ul client al aplicației pe care l-ai creat în organizația ta GitHub Enterprise.",
    client_secret_placeholder: 'e.g., "1234567890"',
    client_secret_error: "Secret-ul client este obligatoriu",
    webhook_secret_title: "Secret Webhook",
    webhook_secret_description:
      "Secret-ul webhook al aplicației pe care l-ai creat în organizația ta GitHub Enterprise.",
    webhook_secret_placeholder: 'e.g., "1234567890"',
    webhook_secret_error: "Secret-ul webhook este obligatoriu",
    private_key_title: "Cheie Privată (Base64 encoded)",
    private_key_description:
      "Cheia privată codificată în Base64 a aplicației pe care l-ai creat în organizația ta GitHub Enterprise.",
    private_key_placeholder: 'e.g., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Cheia privată este obligatorie",
    connect_app: "Conectează Aplicația",
  },
  file_upload: {
    upload_text: "Click aici pentru a încărca fișierul",
    drag_drop_text: "Trage și Plasează",
    processing: "Se procesează",
    invalid: "Tip de fișier invalid",
    missing_fields: "Câmpuri lipsă",
    success: "{fileName} Încărcat!",
  },
  silo_errors: {
    invalid_query_params: "Parametrii de interogare furnizați sunt invalizi sau lipsesc câmpuri obligatorii",
    invalid_installation_account: "Contul de instalare furnizat nu este valid",
    generic_error: "A apărut o eroare neașteptată în timpul procesării cererii tale",
    connection_not_found: "Conexiunea solicitată nu a putut fi găsită",
    multiple_connections_found: "Au fost găsite mai multe conexiuni când se aștepta doar una",
    installation_not_found: "Instalarea solicitată nu a putut fi găsită",
    user_not_found: "Utilizatorul solicitat nu a putut fi găsit",
    error_fetching_token: "Nu s-a putut prelua tokenul de autentificare",
    invalid_app_credentials: "Credențialele aplicației furnizate sunt invalide",
    invalid_app_installation_id: "A apărut o eroare la instalarea aplicației",
  },
  import_status: {
    queued: "În coadă",
    created: "Creat",
    initiated: "Inițiat",
    pulling: "Se extrag",
    timed_out: "Timp expirat",
    pulled: "Extras",
    transforming: "Se transformă",
    transformed: "Transformat",
    pushing: "Se încarcă",
    finished: "Finalizat",
    error: "Eroare",
    cancelled: "Anulat",
  },
  jira_importer: {
    jira_importer_description: "Importă datele tale Jira în proiectele Plane.",
    create_project_automatically: "Creează proiect automat",
    create_project_automatically_description:
      "Vom crea un proiect nou pentru tine pe baza detaliilor proiectului Jira.",
    import_to_existing_project: "Importă într-un proiect existent",
    import_to_existing_project_description: "Alege un proiect existent din meniul derulant de mai jos.",
    state_mapping_automatic_creation: "Toate stările Jira vor fi create automat în Plane.",
    personal_access_token: "Token de Acces Personal",
    user_email: "Email Utilizator",
    atlassian_security_settings: "Setări de Securitate Atlassian",
    email_description: "Acesta este emailul asociat cu tokenul tău de acces personal",
    jira_domain: "Domeniu Jira",
    jira_domain_description: "Acesta este domeniul instanței tale Jira",
    steps: {
      title_configure_plane: "Configurează Plane",
      description_configure_plane:
        "Te rugăm să creezi mai întâi proiectul în Plane unde intenționezi să migrezi datele tale Jira. Odată ce proiectul este creat, selectează-l aici.",
      title_configure_jira: "Configurează Jira",
      description_configure_jira: "Te rugăm să selectezi workspace-ul Jira din care dorești să migrezi datele tale.",
      title_import_users: "Importă Utilizatori",
      description_import_users:
        "Te rugăm să adaugi utilizatorii pe care dorești să-i migrezi de la Jira la Plane. Alternativ, poți sări peste acest pas și adăuga manual utilizatori mai târziu.",
      title_map_states: "Mapează Stările",
      description_map_states:
        "Am potrivit automat statusurile Jira cu stările Plane cât mai bine posibil. Te rugăm să mapezi orice stări rămase înainte de a continua, poți de asemenea să creezi stări și să le mapezi manual.",
      title_map_priorities: "Mapează Prioritățile",
      description_map_priorities:
        "Am potrivit automat prioritățile cât mai bine posibil. Te rugăm să mapezi orice priorități rămase înainte de a continua.",
      title_summary: "Sumar",
      description_summary: "Iată un sumar al datelor care vor fi migrate de la Jira la Plane.",
      custom_jql_filter: "Filtru JQL Personalizat",
      jql_filter_description: "Utilizați JQL pentru a filtra probleme specifice pentru import.",
      project_code: "PROIECT",
      enter_filters_placeholder: "Introduceți filtre (ex. status = 'In Progress')",
      validating_query: "Se validează interogarea...",
      validation_successful_work_items_selected: "Validare reușită, {count} elemente de lucru selectate.",
      run_syntax_check: "Rulați verificarea sintaxei pentru a verifica interogarea",
      refresh: "Reîmprospătare",
      check_syntax: "Verificare Sintaxă",
      no_work_items_selected: "Niciun element de lucru selectat de interogare.",
      validation_error_default: "Ceva nu a mers bine în timpul validării interogării.",
    },
  },
  asana_importer: {
    asana_importer_description: "Importă datele tale Asana în proiectele Plane.",
    select_asana_priority_field: "Selectează Câmpul de Prioritate Asana",
    steps: {
      title_configure_plane: "Configurează Plane",
      description_configure_plane:
        "Te rugăm să creezi mai întâi proiectul în Plane unde intenționezi să migrezi datele tale Asana. Odată ce proiectul este creat, selectează-l aici.",
      title_configure_asana: "Configurează Asana",
      description_configure_asana:
        "Te rugăm să selectezi workspace-ul și proiectul Asana din care dorești să migrezi datele tale.",
      title_map_states: "Mapează Stările",
      description_map_states:
        "Te rugăm să selectezi stările Asana pe care dorești să le mapezi la statusurile proiectului Plane.",
      title_map_priorities: "Mapează Prioritățile",
      description_map_priorities:
        "Te rugăm să selectezi prioritățile Asana pe care dorești să le mapezi la prioritățile proiectului Plane.",
      title_summary: "Sumar",
      description_summary: "Iată un sumar al datelor care vor fi migrate de la Asana la Plane.",
    },
  },
  linear_importer: {
    linear_importer_description: "Importă datele tale Linear în proiectele Plane.",
    steps: {
      title_configure_plane: "Configurează Plane",
      description_configure_plane:
        "Te rugăm să creezi mai întâi proiectul în Plane unde intenționezi să migrezi datele tale Linear. Odată ce proiectul este creat, selectează-l aici.",
      title_configure_linear: "Configurează Linear",
      description_configure_linear: "Te rugăm să selectezi echipa Linear din care dorești să migrezi datele tale.",
      title_map_states: "Mapează Stările",
      description_map_states:
        "Am potrivit automat statusurile Linear cu stările Plane cât mai bine posibil. Te rugăm să mapezi orice stări rămase înainte de a continua, poți de asemenea să creezi stări și să le mapezi manual.",
      title_map_priorities: "Mapează Prioritățile",
      description_map_priorities:
        "Te rugăm să selectezi prioritățile Linear pe care dorești să le mapezi la prioritățile proiectului Plane.",
      title_summary: "Sumar",
      description_summary: "Iată un sumar al datelor care vor fi migrate de la Linear la Plane.",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "Importă datele tale Jira Server/Data Center în proiectele Plane.",
    steps: {
      title_configure_plane: "Configurează Plane",
      description_configure_plane:
        "Te rugăm să creezi mai întâi proiectul în Plane unde intenționezi să migrezi datele tale Jira. Odată ce proiectul este creat, selectează-l aici.",
      title_configure_jira: "Configurează Jira",
      description_configure_jira: "Te rugăm să selectezi workspace-ul Jira din care dorești să migrezi datele tale.",
      title_map_states: "Mapează Stările",
      description_map_states:
        "Te rugăm să selectezi stările Jira pe care dorești să le mapezi la statusurile proiectului Plane.",
      title_map_priorities: "Mapează Prioritățile",
      description_map_priorities:
        "Te rugăm să selectezi prioritățile Jira pe care dorești să le mapezi la prioritățile proiectului Plane.",
      title_summary: "Sumar",
      description_summary: "Iată un sumar al datelor care vor fi migrate de la Jira la Plane.",
    },
    import_epics: {
      title: "Importă Epic-urile ca elemente de lucru",
      description:
        "Cu această opțiune activată, epic-urile tale vor fi importate ca un element de lucru cu tipul de element de lucru epic.",
    },
  },
  notion_importer: {
    notion_importer_description: "Importați datele dvs. Notion în proiectele Plane.",
    steps: {
      title_upload_zip: "Încărcați ZIP-ul exportat din Notion",
      description_upload_zip: "Vă rugăm să încărcați fișierul ZIP care conține datele dvs. Notion.",
    },
    upload: {
      drop_file_here: "Glisați fișierul zip Notion aici",
      upload_title: "Încărcați exportul Notion",
      upload_from_url: "Importă din URL",
      upload_from_url_description: "Lipește adresa URL publică a exportului ZIP pentru a continua.",
      drag_drop_description: "Glisați și plasați fișierul zip de export Notion sau faceți clic pentru a naviga",
      file_type_restriction: "Sunt acceptate doar fișiere .zip exportate din Notion",
      select_file: "Selectați fișier",
      uploading: "Se încarcă...",
      preparing_upload: "Se pregătește încărcarea...",
      confirming_upload: "Se confirmă încărcarea...",
      confirming: "Se confirmă...",
      upload_complete: "Încărcare completă",
      upload_failed: "Încărcarea a eșuat",
      start_import: "Începeți importul",
      retry_upload: "Reîncercați încărcarea",
      upload: "Încărcați",
      ready: "Gata",
      error: "Eroare",
      upload_complete_message: "Încărcare completă!",
      upload_complete_description: 'Faceți clic pe "Începeți importul" pentru a începe procesarea datelor dvs. Notion.',
      upload_progress_message: "Vă rugăm să nu închideți această fereastră.",
    },
  },
  confluence_importer: {
    confluence_importer_description: "Importați datele dvs. Confluence în wiki-ul Plane.",
    steps: {
      title_upload_zip: "Încărcați ZIP-ul exportat din Confluence",
      description_upload_zip: "Vă rugăm să încărcați fișierul ZIP care conține datele dvs. Confluence.",
    },
    upload: {
      drop_file_here: "Glisați fișierul zip Confluence aici",
      upload_title: "Încărcați exportul Confluence",
      upload_from_url: "Importă din URL",
      upload_from_url_description: "Lipește adresa URL publică a exportului ZIP pentru a continua.",
      drag_drop_description: "Glisați și plasați fișierul zip de export Confluence sau faceți clic pentru a naviga",
      file_type_restriction: "Sunt acceptate doar fișiere .zip exportate din Confluence",
      select_file: "Selectați fișier",
      uploading: "Se încarcă...",
      preparing_upload: "Se pregătește încărcarea...",
      confirming_upload: "Se confirmă încărcarea...",
      confirming: "Se confirmă...",
      upload_complete: "Încărcare completă",
      upload_failed: "Încărcarea a eșuat",
      start_import: "Începeți importul",
      retry_upload: "Reîncercați încărcarea",
      upload: "Încărcați",
      ready: "Gata",
      error: "Eroare",
      upload_complete_message: "Încărcare completă!",
      upload_complete_description:
        'Faceți clic pe "Începeți importul" pentru a începe procesarea datelor dvs. Confluence.',
      upload_progress_message: "Vă rugăm să nu închideți această fereastră.",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "Importă datele tale CSV în proiectele Plane.",
    steps: {
      title_configure_plane: "Configurează Plane",
      description_configure_plane:
        "Te rugăm să creezi mai întâi proiectul în Plane unde intenționezi să migrezi datele tale CSV. Odată ce proiectul este creat, selectează-l aici.",
      title_configure_csv: "Configurează CSV",
      description_configure_csv:
        "Te rugăm să încarci fișierul tău CSV și să configurezi câmpurile care vor fi mapate la câmpurile Plane.",
    },
  },
  csv_importer: {
    csv_importer_description: "Importați elemente de lucru din fișiere CSV în proiecte Plane.",
    steps: {
      title_select_project: "Selectați proiectul",
      description_select_project: "Vă rugăm să selectați proiectul Plane unde doriți să importați elementele de lucru.",
      title_upload_csv: "Încărcați CSV",
      description_upload_csv:
        "Încărcați fișierul CSV care conține elemente de lucru. Fișierul ar trebui să includă coloane pentru nume, descriere, prioritate, date și grup de stare.",
    },
  },
  clickup_importer: {
    clickup_importer_description: "Importă datele tale ClickUp în proiectele Plane.",
    select_service_space: "Selectează {serviceName} Spațiu",
    select_service_folder: "Selectează {serviceName} Dosar",
    selected: "Selectat",
    users: "Utilizatori",
    steps: {
      title_configure_plane: "Configurează Plane",
      description_configure_plane:
        "Te rugăm să creezi mai întâi proiectul în Plane unde intenționezi să migrezi datele tale ClickUp. Odată ce proiectul este creat, selectează-l aici.",
      title_configure_clickup: "Configurează ClickUp",
      description_configure_clickup:
        "Te rugăm să selectezi echipa ClickUp, spațiul și dosarul din care dorești să migrezi datele tale.",
      title_map_states: "Mapează Stările",
      description_map_states:
        "Am potrivit automat statusurile ClickUp cu stările Plane cât mai bine posibil. Te rugăm să mapezi orice stări rămase înainte de a continua, poți de asemenea să creezi stări și să le mapezi manual.",
      title_map_priorities: "Mapează Prioritățile",
      description_map_priorities:
        "Te rugăm să selectezi prioritățile ClickUp pe care dorești să le mapezi la prioritățile proiectului Plane.",
      title_summary: "Sumar",
      description_summary: "Iată un sumar al datelor care vor fi migrate de la ClickUp la Plane.",
      pull_additional_data_title: "Importă comentarii și atașamente",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "Bară",
          long_label: "Grafic cu bare",
          chart_models: {
            basic: "De bază",
            stacked: "Stivuit",
            grouped: "Grupat",
          },
          orientation: {
            label: "Orientare",
            horizontal: "Orizontal",
            vertical: "Vertical",
            placeholder: "Adaugă orientare",
          },
          bar_color: "Culoarea barei",
        },
        line_chart: {
          short_label: "Linie",
          long_label: "Grafic cu linii",
          chart_models: {
            basic: "De bază",
            multi_line: "Multi-linie",
          },
          line_color: "Culoarea liniei",
          line_type: {
            label: "Tipul liniei",
            solid: "Solid",
            dashed: "Punctat",
            placeholder: "Adaugă tipul liniei",
          },
        },
        area_chart: {
          short_label: "Arie",
          long_label: "Grafic arie",
          chart_models: {
            basic: "De bază",
            stacked: "Stivuit",
            comparison: "Comparație",
          },
          fill_color: "Culoare de umplere",
        },
        donut_chart: {
          short_label: "Gogoașă",
          long_label: "Grafic gogoașă",
          chart_models: {
            basic: "De bază",
            progress: "Progres",
          },
          center_value: "Valoare centrală",
          completed_color: "Culoare completat",
        },
        pie_chart: {
          short_label: "Plăcintă",
          long_label: "Grafic plăcintă",
          chart_models: {
            basic: "De bază",
          },
          group: {
            label: "Bucăți grupate",
            group_thin_pieces: "Grupează bucățile subțiri",
            minimum_threshold: {
              label: "Prag minim",
              placeholder: "Adaugă prag",
            },
            name_group: {
              label: "Nume grup",
              placeholder: '"Mai puțin de 5%"',
            },
          },
          show_values: "Arată valorile",
          value_type: {
            percentage: "Procentaj",
            count: "Număr",
          },
        },
        text: {
          short_label: "Text",
          long_label: "Text",
          alignment: {
            label: "Aliniere text",
            left: "Stânga",
            center: "Centru",
            right: "Dreapta",
            placeholder: "Adaugă alinierea textului",
          },
          text_color: "Culoare text",
        },
        table_chart: {
          short_label: "Tabel",
          long_label: "Grafic tabel",
          chart_models: {
            basic: {
              short_label: "De bază",
              long_label: "Tabel",
            },
          },
          columns: "Coloane",
          rows: "Rânduri",
          rows_placeholder: "Adaugă rânduri",
          configure_rows_hint: "Selectați o proprietate pentru rânduri pentru a vizualiza acest tabel.",
        },
      },
      color_palettes: {
        modern: "Modern",
        horizon: "Orizont",
        earthen: "Pământiu",
      },
      common: {
        add_widget: "Adaugă widget",
        widget_title: {
          label: "Denumește acest widget",
          placeholder: 'ex., "De făcut ieri", "Toate Completate"',
        },
        chart_type: "Tip grafic",
        visualization_type: {
          label: "Tip vizualizare",
          placeholder: "Adaugă tip vizualizare",
        },
        date_group: {
          label: "Grupare după dată",
          placeholder: "Adaugă grupare după dată",
        },
        group_by: "Grupează după",
        stack_by: "Stivuiește după",
        daily: "Zilnic",
        weekly: "Săptămânal",
        monthly: "Lunar",
        yearly: "Anual",
        work_item_count: "Număr de elemente de lucru",
        estimate_point: "Punct de estimare",
        pending_work_item: "Elemente de lucru în așteptare",
        completed_work_item: "Elemente de lucru completate",
        in_progress_work_item: "Elemente de lucru în progres",
        blocked_work_item: "Elemente de lucru blocate",
        work_item_due_this_week: "Elemente de lucru scadente săptămâna aceasta",
        work_item_due_today: "Elemente de lucru scadente astăzi",
        color_scheme: {
          label: "Schemă de culori",
          placeholder: "Adaugă schemă de culori",
        },
        smoothing: "Netezire",
        markers: "Markeri",
        legends: "Legende",
        tooltips: "Tooltipuri",
        opacity: {
          label: "Opacitate",
          placeholder: "Adaugă opacitate",
        },
        border: "Bordură",
        widget_configuration: "Configurare widget",
        configure_widget: "Configurează widget",
        guides: "Ghiduri",
        style: "Stil",
        area_appearance: "Aspectul ariei",
        comparison_line_appearance: "Aspectul liniei de comparație",
        add_property: "Adaugă proprietate",
        add_metric: "Adaugă metrică",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "Axa x lipsește o valoare.",
            y_axis_metric: "Metrica lipsește o valoare.",
          },
          stacked: {
            x_axis_property: "Axa x lipsește o valoare.",
            y_axis_metric: "Metrica lipsește o valoare.",
            group_by: "Stivuiește după lipsește o valoare.",
          },
          grouped: {
            x_axis_property: "Axa x lipsește o valoare.",
            y_axis_metric: "Metrica lipsește o valoare.",
            group_by: "Grupează după lipsește o valoare.",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "Axa x lipsește o valoare.",
            y_axis_metric: "Metrica lipsește o valoare.",
          },
          multi_line: {
            x_axis_property: "Axa x lipsește o valoare.",
            y_axis_metric: "Metrica lipsește o valoare.",
            group_by: "Grupează după lipsește o valoare.",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "Axa x lipsește o valoare.",
            y_axis_metric: "Metrica lipsește o valoare.",
          },
          stacked: {
            x_axis_property: "Axa x lipsește o valoare.",
            y_axis_metric: "Metrica lipsește o valoare.",
            group_by: "Stivuiește după lipsește o valoare.",
          },
          comparison: {
            x_axis_property: "Axa x lipsește o valoare.",
            y_axis_metric: "Metrica lipsește o valoare.",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "Axa x lipsește o valoare.",
            y_axis_metric: "Metrica lipsește o valoare.",
          },
          progress: {
            y_axis_metric: "Metrica lipsește o valoare.",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "Axa x lipsește o valoare.",
            y_axis_metric: "Metrica lipsește o valoare.",
          },
        },
        text: {
          basic: {
            y_axis_metric: "Metrica lipsește o valoare.",
          },
        },
        table_chart: {
          basic: {
            x_axis_property: "Coloanelor lipsește o valoare.",
            group_by: "Rândurilor lipsește o valoare.",
          },
        },
        ask_admin: "Întreabă administratorul tău pentru a configura acest widget.",
      },
    },
    create_modal: {
      heading: {
        create: "Creează dashboard nou",
        update: "Actualizează dashboard",
      },
      title: {
        label: "Denumește dashboard-ul tău.",
        placeholder: '"Capacitate între proiecte", "Încărcare de lucru pe echipă", "Stare în toate proiectele"',
        required_error: "Titlul este obligatoriu",
      },
      project: {
        label: "Alege proiecte",
        placeholder: "Datele din aceste proiecte vor alimenta acest dashboard.",
        required_error: "Proiectele sunt obligatorii",
      },
      filters_label: "Setează filtre pentru sursele de date de mai sus",
      create_dashboard: "Creează dashboard",
      update_dashboard: "Actualizează dashboard",
    },
    delete_modal: {
      heading: "Șterge dashboard",
    },
    empty_state: {
      feature_flag: {
        title: "Prezintă-ți progresul în dashboard-uri la cerere, pentru totdeauna.",
        description:
          "Construiește orice dashboard de care ai nevoie și personalizează modul în care arată datele tale pentru prezentarea perfectă a progresului tău.",
        coming_soon_to_mobile: "În curând în aplicația mobilă",
        card_1: {
          title: "Pentru toate proiectele tale",
          description:
            "Obține o viziune divină completă a workspace-ului tău cu toate proiectele tale sau segmentează datele de lucru pentru acea vizualizare perfectă a progresului tău.",
        },
        card_2: {
          title: "Pentru orice date din Plane",
          description:
            "Depășește Analiticile predefinite și graficele Ciclurilor gata făcute pentru a privi echipele, inițiativele sau orice altceva așa cum nu ai făcut-o până acum.",
        },
        card_3: {
          title: "Pentru toate nevoile tale de vizualizare de date",
          description:
            "Alege din mai multe grafice personalizabile cu controale fine pentru a vedea și a arăta datele tale de lucru exact așa cum dorești.",
        },
        card_4: {
          title: "La cerere și permanent",
          description:
            "Construiește o dată, păstrează pentru totdeauna cu actualizări automate ale datelor tale, flag-uri contextuale pentru modificări de scop și linkuri permanente partajabile.",
        },
        card_5: {
          title: "Exporturi și comunicări programate",
          description:
            "Pentru acele momente când linkurile nu funcționează, obține dashboard-urile tale în PDF-uri unice sau programează-le să fie trimise automat către părțile interesate.",
        },
        card_6: {
          title: "Auto-aranjate pentru toate dispozitivele",
          description:
            "Redimensionează widget-urile tale pentru aspectul dorit și vezi-l exact la fel pe mobile, tabletă și alte browsere.",
        },
      },
      dashboards_list: {
        title:
          "Vizualizează datele în widget-uri, construiește dashboard-urile tale cu widget-uri și vezi cele mai recente la cerere.",
        description:
          "Construiește dashboard-urile tale cu Widget-uri Personalizate care îți arată datele în domeniul specificat. Obține dashboard-uri pentru tot lucrul tău între proiecte și echipe și distribuie link-uri permanente către părțile interesate pentru urmărire la cerere.",
      },
      dashboards_search: {
        title: "Asta nu se potrivește cu numele unui dashboard.",
        description: "Asigură-te că interogarea ta este corectă sau încearcă o altă interogare.",
      },
      widgets_list: {
        title: "Vizualizează-ți datele așa cum dorești.",
        description: `Folosește linii, bare, plăcinte și alte formate pentru a-ți vedea datele
așa cum dorești din sursele pe care le specifici.`,
      },
      widget_data: {
        title: "Nimic de văzut aici",
        description: "Reîmprospătează sau adaugă date pentru a le vedea aici.",
      },
    },
    common: {
      editing: "Editare",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "Permite elemente noi de lucru",
      work_item_creation_disable_tooltip: "Crearea de elemente de lucru este dezactivată pentru această stare",
      default_state:
        "Starea implicită permite tuturor membrilor să creeze elemente noi de lucru. Acest lucru nu poate fi schimbat",
      state_change_count:
        "{count, plural, one {1 schimbare de stare permisă} other {{count} schimbări de stare permise}}",
      movers_count: "{count, plural, one {1 evaluator listat} other {{count} evaluatori listați}}",
      state_changes: {
        label: {
          default: "Adaugă schimbare de stare permisă",
          loading: "Se adaugă schimbare de stare permisă",
        },
        move_to: "Schimbă starea la",
        movers: {
          label: "Când este evaluat de",
          tooltip: "Evaluatorii sunt persoane care au permisiunea de a muta elemente de lucru dintr-o stare în alta.",
          add: "Adaugă evaluatori",
        },
      },
    },
    workflow_disabled: {
      title: "Nu poți muta acest element de lucru aici.",
    },
    workflow_enabled: {
      label: "Schimbare de stare",
    },
    workflow_tree: {
      label: "Pentru elemente de lucru în",
      state_change_label: "poate să-l mute la",
    },
    empty_state: {
      upgrade: {
        title: "Controlează haosul schimbărilor și evaluărilor cu Fluxuri de lucru.",
        description:
          "Setează reguli pentru unde se mută lucrul tău, de către cine și când cu Fluxuri de lucru în Plane.",
      },
    },
    quick_actions: {
      view_change_history: "Vezi istoricul schimbărilor",
      reset_workflow: "Resetează fluxul de lucru",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "Ești sigur că vrei să resetezi acest flux de lucru?",
        description:
          "Dacă resetezi acest flux de lucru, toate regulile tale de schimbare a stării vor fi șterse și va trebui să le creezi din nou pentru a le rula în acest proiect.",
      },
      delete_state_change: {
        title: "Ești sigur că vrei să ștergi această regulă de schimbare a stării?",
        description:
          "Odată ștearsă, nu poți anula această schimbare și va trebui să setezi regula din nou dacă vrei să o rulezi pentru acest proiect.",
      },
    },
    toasts: {
      enable_disable: {
        loading: "{action} flux de lucru",
        success: {
          title: "Succes",
          message: "Flux de lucru {action} cu succes",
        },
        error: {
          title: "Eroare",
          message: "Fluxul de lucru nu a putut fi {action}. Te rugăm să încerci din nou.",
        },
      },
      reset: {
        success: {
          title: "Succes",
          message: "Fluxul de lucru a fost resetat cu succes",
        },
        error: {
          title: "Eroare la resetarea fluxului de lucru",
          message: "Fluxul de lucru nu a putut fi resetat. Te rugăm să încerci din nou.",
        },
      },
      add_state_change_rule: {
        error: {
          title: "Eroare la adăugarea regulii de schimbare a stării",
          message: "Regula de schimbare a stării nu a putut fi adăugată. Te rugăm să încerci din nou.",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "Eroare la modificarea regulii de schimbare a stării",
          message: "Regula de schimbare a stării nu a putut fi modificată. Te rugăm să încerci din nou.",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "Eroare la eliminarea regulii de schimbare a stării",
          message: "Regula de schimbare a stării nu a putut fi eliminată. Te rugăm să încerci din nou.",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "Eroare la modificarea evaluatorilor regulii de schimbare a stării",
          message: "Evaluatorii regulii de schimbare a stării nu au putut fi modificați. Te rugăm să încerci din nou.",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {Client} other {Clienți}}",
    open: "Deschide client",
    dropdown: {
      placeholder: "Selectează client",
      required: "Te rugăm să selectezi un client",
      no_selection: "Niciun client",
    },
    upgrade: {
      title: "Prioritizează și gestionează munca cu Clienți.",
      description: "Mapează munca ta la clienți și prioritizează după atributele clientului.",
    },
    properties: {
      default: {
        title: "Proprietăți implicite",
        customer_name: {
          name: "Numele clientului",
          placeholder: "Acesta poate fi numele persoanei sau afacerii",
          validation: {
            required: "Numele clientului este obligatoriu.",
            max_length: "Numele clientului nu poate depăși 255 de caractere.",
          },
        },
        description: {
          name: "Descriere",
          validation: {},
        },
        email: {
          name: "Email",
          placeholder: "Introduceți email",
          validation: {
            required: "Email-ul este obligatoriu.",
            pattern: "Adresă de email invalidă.",
          },
        },
        website_url: {
          name: "Website",
          placeholder: "Orice URL cu https:// va funcționa.",
          placeholder_short: "Adaugă website",
          validation: {
            pattern: "URL de website invalid",
          },
        },
        employees: {
          name: "Angajați",
          placeholder: "Numărul de angajați dacă clientul tău este o afacere.",
          validation: {
            min_length: "Angajații nu pot fi mai puțini de 0.",
          },
        },
        size: {
          name: "Dimensiune",
          placeholder: "Adaugă dimensiunea companiei",
          validation: {
            min_length: "Dimensiune invalidă",
          },
        },
        domain: {
          name: "Industrie",
          placeholder: "Retail, e-Commerce, Fintech, Banking",
          placeholder_short: "Adaugă industrie",
          validation: {},
        },
        stage: {
          name: "Etapă",
          placeholder: "Selectează etapa",
          validation: {},
        },
        contract_status: {
          name: "Stare Contract",
          placeholder: "Selectează starea contractului",
          validation: {},
        },
        revenue: {
          name: "Venit",
          placeholder: "Acesta este venitul pe care clientul tău îl generează anual.",
          validation: {
            min_length: "Venitul nu poate fi mai mic de 0.",
          },
        },
      },
      custom: {
        title: "Proprietăți personalizate",
        info: "Adaugă atributele unice ale clienților tăi în Plane astfel încât să poți gestiona mai bine elementele de lucru sau înregistrările clienților.",
      },
      empty_state: {
        title: "Nu ai încă nicio proprietate personalizată.",
        description:
          "Proprietățile personalizate pe care ai dori să le vezi în elementele de lucru, în altă parte din Plane sau în afara Plane într-un CRM sau alt instrument, vor apărea aici când le adaugi.",
      },
      add: {
        primary_button: "Adaugă proprietate nouă",
      },
    },
    stage: {
      lead: "Lead",
      sales_qualified_lead: "Lead calificat pentru vânzări",
      contract_negotiation: "Negociere contract",
      closed_won: "Câștigat închis",
      closed_lost: "Pierdut închis",
    },
    contract_status: {
      active: "Activ",
      pre_contract: "Pre-contract",
      signed: "Semnat",
      inactive: "Inactiv",
    },
    empty_state: {
      detail: {
        title: "Nu am putut găsi acea înregistrare a clientului.",
        description:
          "Link-ul către această înregistrare ar putea fi greșit sau această înregistrare ar fi putut fi ștearsă.",
        primary_button: "Mergi la clienți",
        secondary_button: "Adaugă un client",
      },
      search: {
        title: "Se pare că nu ai înregistrări de clienți care să corespundă acelui termen.",
        description:
          "Încearcă cu un alt termen de căutare sau contactează-ne dacă ești sigur că ar trebui să vezi rezultate pentru acel termen.",
      },
      list: {
        title:
          "Gestionează volumul, cadența și fluxul muncii tale în funcție de ce este important pentru clienții tăi.",
        description:
          "Cu Clienți, o funcție exclusivă Plane, poți crea acum noi clienți de la zero și să-i conectezi la munca ta. În curând, îi vei putea aduce din alte instrumente împreună cu atributele lor personalizate care contează pentru tine.",
        primary_button: "Adaugă primul tău client",
      },
    },
    settings: {
      unauthorized: "Nu ești autorizat să accesezi această pagină.",
      description: "Urmărește și gestionează relațiile cu clienții în fluxul tău de lucru.",
      enable: "Activează Clienți",
      toasts: {
        enable: {
          loading: "Se activează funcția de clienți...",
          success: {
            title: "Ai activat Clienți pentru acest workspace.",
            message: "Nu o poți dezactiva din nou.",
          },
          error: {
            title: "Nu am putut activa Clienți de această dată.",
            message: "Încearcă din nou sau revino la acest ecran mai târziu. Dacă tot nu funcționează.",
            action: "Vorbește cu suportul",
          },
        },
        disable: {
          loading: "Se dezactivează funcția de clienți...",
          success: {
            title: "Clienți dezactivați",
            message: "Funcția de clienți a fost dezactivată cu succes!",
          },
          error: {
            title: "Eroare",
            message: "Nu s-a putut dezactiva funcția de clienți!",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "Nu am putut obține lista ta de clienți.",
          message: "Încearcă din nou sau reîmprospătează această pagină.",
        },
      },
      copy_link: {
        title: "Ai copiat link-ul direct către acest client.",
        message: "Lipește-l oriunde și va duce direct înapoi aici.",
      },
      create: {
        success: {
          title: "{customer_name} este acum disponibil",
          message:
            "Poți face referire la acest client în elementele de lucru și poți urmări, de asemenea, cererile de la ei.",
          actions: {
            view: "Vizualizează",
            copy_link: "Copiază link",
            copied: "Copiat!",
          },
        },
        error: {
          title: "Nu am putut crea acea înregistrare de această dată.",
          message:
            "Încearcă să o salvezi din nou sau copiază textul nesalvat într-o intrare nouă, de preferință într-o altă filă.",
        },
      },
      update: {
        success: {
          title: "Succes!",
          message: "Client actualizat cu succes!",
        },
        error: {
          title: "Eroare!",
          message: "Nu s-a putut actualiza clientul. Încearcă din nou!",
        },
      },
      logo: {
        error: {
          title: "Nu am putut încărca logo-ul clientului.",
          message: "Încearcă să salvezi logo-ul din nou sau începe de la zero.",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "Ai eliminat un element de lucru din înregistrarea acestui client.",
            message: "Am eliminat automat acest client și din elementul de lucru.",
          },
          error: {
            title: "Nu am putut elimina acel element de lucru din înregistrarea acestui client de această dată.",
            message: "Am eliminat automat acest client și din elementul de lucru.",
          },
        },
        add: {
          error: {
            title: "Nu am putut adăuga acel element de lucru la înregistrarea acestui client de această dată.",
            message:
              "Încearcă să adaugi acel element de lucru din nou sau revino la el mai târziu. Dacă tot nu funcționează, contactează-ne.",
          },
          success: {
            title: "Ai adăugat un element de lucru la înregistrarea acestui client.",
            message: "Am adăugat automat acest client și la elementul de lucru.",
          },
        },
      },
    },
    quick_actions: {
      edit: "Editează",
      copy_link: "Copiază link către client",
      delete: "Șterge",
    },
    create: {
      label: "Creează înregistrare client",
      loading: "Se creează",
      cancel: "Anulează",
    },
    update: {
      label: "Actualizează client",
      loading: "Se actualizează",
    },
    delete: {
      title: "Ești sigur că vrei să ștergi înregistrarea clientului {customer_name}?",
      description:
        "Toate datele asociate cu această înregistrare vor fi șterse permanent. Nu poți restaura această înregistrare mai târziu.",
    },
    requests: {
      empty_state: {
        list: {
          title: "Nu există încă cereri de arătat.",
          description: "Creează cereri de la clienții tăi pentru a le putea lega de elementele de lucru.",
          button: "Adaugă cerere nouă",
        },
        search: {
          title: "Se pare că nu ai cereri care să corespundă acelui termen.",
          description:
            "Încearcă cu un alt termen de căutare sau contactează-ne dacă ești sigur că ar trebui să vezi rezultate pentru acel termen.",
        },
      },
      label: "{count, plural, one {Cerere} other {Cereri}}",
      add: "Adaugă cerere",
      create: "Creează cerere",
      update: "Actualizează cerere",
      form: {
        name: {
          placeholder: "Denumește această cerere",
          validation: {
            required: "Numele este obligatoriu.",
            max_length: "Numele cererii nu trebuie să depășească 255 de caractere.",
          },
        },
        description: {
          placeholder: "Descrie natura cererii sau lipește comentariul acestui client din alt instrument.",
        },
        source: {
          add: "Adaugă sursă",
          update: "Actualizează sursă",
          url: {
            label: "URL",
            required: "URL-ul este obligatoriu",
            invalid: "URL de website invalid",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "Link copiat",
          message: "Link-ul cererii clientului a fost copiat în clipboard.",
        },
        attachment: {
          upload: {
            loading: "Se încarcă atașamentul...",
            success: {
              title: "Atașament încărcat",
              message: "Atașamentul a fost încărcat cu succes.",
            },
            error: {
              title: "Atașament neîncărcat",
              message: "Atașamentul nu a putut fi încărcat.",
            },
          },
          size: {
            error: {
              title: "Eroare!",
              message: "Doar un fișier poate fi încărcat la un moment dat.",
            },
          },
          length: {
            message: "Fișierul trebuie să aibă {size}MB sau mai puțin în dimensiune",
          },
          remove: {
            success: {
              title: "Atașament eliminat",
              message: "Atașamentul a fost eliminat cu succes",
            },
            error: {
              title: "Atașament neeliminat",
              message: "Atașamentul nu a putut fi eliminat",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "Succes!",
              message: "Sursă actualizată cu succes!",
            },
            error: {
              title: "Eroare!",
              message: "Nu s-a putut actualiza sursa.",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "Eroare!",
              message: "Nu s-au putut adăuga elemente de lucru la cerere. Încearcă din nou.",
            },
            success: {
              title: "Succes!",
              message: "S-au adăugat elemente de lucru la cerere.",
            },
          },
        },
        update: {
          success: {
            message: "Cerere actualizată cu succes!",
            title: "Succes!",
          },
          error: {
            title: "Eroare!",
            message: "Nu s-a putut actualiza cererea. Încearcă din nou!",
          },
        },
        create: {
          success: {
            message: "Cerere creată cu succes!",
            title: "Succes!",
          },
          error: {
            title: "Eroare!",
            message: "Nu s-a putut crea cererea. Încearcă din nou!",
          },
        },
      },
    },
    linked_work_items: {
      label: "Elemente de lucru legate",
      link: "Leagă elemente de lucru",
      empty_state: {
        list: {
          title: "Se pare că nu ai încă elemente de lucru legate de acest client.",
          description:
            "Leagă elementele de lucru existente din orice proiect aici pentru a le putea urmări după acest client.",
          button: "Leagă element de lucru",
        },
      },
      action: {
        remove_epic: "Elimină epic",
        remove: "Elimină element de lucru",
      },
    },
    sidebar: {
      properties: "Proprietăți",
    },
  },
  templates: {
    settings: {
      title: "Șabloane",
      description:
        "Economisește 80% din timpul petrecut pentru crearea proiectelor, a elementelor de lucru și a paginilor când folosești șabloane.",
      options: {
        project: {
          label: "Șabloane de proiect",
        },
        work_item: {
          label: "Șabloane de elemente de lucru",
        },
        page: {
          label: "Șabloane de pagină",
        },
      },
      create_template: {
        label: "Creează șablon",
        no_permission: {
          project: "Contactează administratorul proiectului pentru a crea șabloane",
          workspace: "Contactează administratorul workspace-ului pentru a crea șabloane",
        },
      },
      use_template: {
        button: {
          default: "Folosește șablon",
          loading: "Folosind",
        },
      },
      template_source: {
        workspace: {
          info: "Derivat din workspace",
        },
        project: {
          info: "Derivat din proiect",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "Denumește șablonul tău de proiect.",
              validation: {
                required: "Numele șablonului este obligatoriu",
                maxLength: "Numele șablonului trebuie să fie mai mic de 255 de caractere",
              },
            },
            description: {
              placeholder: "Descrie când și cum să folosești acest șablon.",
            },
          },
          name: {
            placeholder: "Denumește proiectul tău.",
            validation: {
              required: "Titlul proiectului este obligatoriu",
              maxLength: "Titlul proiectului trebuie să fie mai mic de 255 de caractere",
            },
          },
          description: {
            placeholder: "Descrie scopul și obiectivele acestui proiect.",
          },
          button: {
            create: "Creează șablon de proiect",
            update: "Actualizează șablon de proiect",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "Denumește șablonul tău de element de lucru.",
              validation: {
                required: "Numele șablonului este obligatoriu",
                maxLength: "Numele șablonului trebuie să fie mai mic de 255 de caractere",
              },
            },
            description: {
              placeholder: "Descrie când și cum să folosești acest șablon.",
            },
          },
          name: {
            placeholder: "Dă acestui element de lucru un titlu.",
            validation: {
              required: "Titlul elementului de lucru este obligatoriu",
              maxLength: "Titlul elementului de lucru trebuie să fie mai mic de 255 de caractere",
            },
          },
          description: {
            placeholder: "Descrie acest element de lucru astfel încât să fie clar ce vei realiza când îl vei completa.",
          },
          button: {
            create: "Creează șablon de element de lucru",
            update: "Actualizează șablon de element de lucru",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "Numele șablonului paginii.",
              validation: {
                required: "Numele șablonului este obligatoriu",
                maxLength: "Numele șablonului trebuie să fie mai mic de 255 de caractere",
              },
            },
            description: {
              placeholder: "Descrie când și cum să folosești acest șablon.",
            },
          },
          name: {
            placeholder: "Pagina fără nume",
            validation: {
              maxLength: "Numele paginii trebuie să fie mai mic de 255 de caractere",
            },
          },
          button: {
            create: "Creează șablon de pagină",
            update: "Actualizează șablon de pagină",
          },
        },
        publish: {
          action: "{isPublished, select, true {Setări de publicare} other {Publică pe Marketplace}}",
          unpublish_action: "Elimină din Marketplace",
          title: "Faceți-vă șablonul detectabil și recunoscut.",
          name: {
            label: "Numele șablonului",
            placeholder: "Numele șablonului",
            validation: {
              required: "Numele șablonului este obligatoriu",
              maxLength: "Numele șablonului trebuie să fie mai mic de 255 de caractere",
            },
          },
          short_description: {
            label: "Descriere scurtă",
            placeholder:
              "Acest șablon este excelent pentru managerii proiectelor care gestionează mai multe proiecte în același timp.",
            validation: {
              required: "Descrierea scurtă este obligatorie",
            },
          },
          description: {
            label: "Descriere",
            placeholder: `Îmbunătățiți productivitatea și optimizați comunicarea cu integrarea noastră Vorbire-În-Text.
• Transcriere în timp real: Convertiți cuvintele rostite în text precis instantaneu.
• Crearea sarcinilor și comentariilor: Adăugați sarcini, descrieri și comentarii prin comenzi vocale.`,
            validation: {
              required: "Descrierea este obligatorie",
            },
          },
          category: {
            label: "Categorie",
            placeholder: "Alege unde crezi că acest șablon încalcă cel mai bine. Poți alege mai multe.",
            validation: {
              required: "Cel puțin o categorie este obligatorie",
            },
          },
          keywords: {
            label: "Cuvinte cheie",
            placeholder: "Folosește termeni care crezi că utilizatorii vor căuta atunci când vor căuta acest șablon.",
            helperText:
              "Introduceți cuvinte cheie separate de virgule care vor ajuta oamenii să găsească acest lucru din căutare.",
            validation: {
              required: "Cel puțin un cuvânt cheie este obligatoriu",
            },
          },
          company_name: {
            label: "Numele companiei",
            placeholder: "Plane",
            validation: {
              required: "Numele companiei este obligatoriu",
              maxLength: "Numele companiei trebuie să fie mai mic de 255 de caractere",
            },
          },
          contact_email: {
            label: "Email de suport",
            placeholder: "help@plane.so",
            validation: {
              invalid: "Adresa email-ului este invalidă",
              required: "Adresa email-ului este obligatorie",
              maxLength: "Adresa email-ului trebuie să fie mai mică de 255 de caractere",
            },
          },
          privacy_policy_url: {
            label: "Link către politică de confidențialitate",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "URL-ul este invalid",
              maxLength: "URL-ul trebuie să fie mai mic de 800 de caractere",
            },
          },
          terms_of_service_url: {
            label: "Link către termenii de utilizare",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "URL-ul este invalid",
              maxLength: "URL-ul trebuie să fie mai mic de 800 de caractere",
            },
          },
          cover_image: {
            label: "Adăugați o imagine de copertă care va fi afișată în marketplace",
            upload_title: "Încarcă imagine de copertă",
            upload_placeholder:
              "Faceți clic pentru a încărca sau trageți și plasați pentru a încărca o imagine de copertă",
            drop_here: "Plasați aici",
            click_to_upload: "Faceți clic pentru a încărca",
            invalid_file_or_exceeds_size_limit:
              "Fișier invalid sau depășește limita de dimensiune. Vă rugăm să încercați din nou.",
            upload_and_save: "Încarcă și salvează",
            uploading: "Se încarcă",
            remove: "Elimină",
            removing: "Se elimină",
            validation: {
              required: "Imaginea de copertă este obligatorie",
            },
          },
          attach_screenshots: {
            label:
              "Include documente și capturi de ecran care credeți că vor face vizualizatorii acestui șablon mai interesanți.",
            validation: {
              required: "Cel puțin o captură de ecran este obligatorie",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "Șabloane",
        description:
          "Cu șabloane de proiect, element de lucru și pagină în Plane, nu trebuie să creezi un proiect de la zero sau să setezi manual proprietățile elementelor de lucru.",
        sub_description: "Recuperează 80% din timpul tău administrativ când folosești Șabloane.",
      },
      no_templates: {
        button: "Creează primul tău șablon",
      },
      no_labels: {
        description:
          " Nu există etichete încă. Creează etichete pentru a ajuta la organizarea și filtrarea elementelor de lucru în proiectul tău.",
      },
      no_work_items: {
        description: "Nu există elemente de lucru încă. Adaugă unul pentru a structura mai bine munca ta.",
      },
      no_sub_work_items: {
        description: "Nu există sub-elemente de lucru încă. Adaugă unul pentru a structura mai bine munca ta.",
      },
      page: {
        no_templates: {
          title: "Nu există șabloane la care aveți acces.",
          description: "Vă rugăm să creați un șablon",
        },
        no_results: {
          title: "Aceasta nu se potrivește cu un șablon.",
          description: "Încercați să căutați cu alți termeni.",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "Șablon creat",
          message: "{templateName}, șablonul de {templateType}, este acum disponibil pentru workspace-ul tău.",
        },
        error: {
          title: "Nu am putut crea acel șablon de data aceasta.",
          message:
            "Încearcă să salvezi detaliile din nou sau copiază-le într-un nou șablon, de preferință într-o altă filă.",
        },
      },
      update: {
        success: {
          title: "Șablon modificat",
          message: "{templateName}, șablonul de {templateType}, a fost modificat.",
        },
        error: {
          title: "Nu am putut salva modificările la acest șablon.",
          message:
            "Încearcă să salvezi detaliile din nou sau revino la acest șablon mai târziu. Dacă tot apar probleme, contactează-ne.",
        },
      },
      delete: {
        success: {
          title: "Șablon șters",
          message: "{templateName}, șablonul de {templateType}, a fost acum șters din workspace-ul tău.",
        },
        error: {
          title: "Nu am putut șterge acel șablon.",
          message:
            "Încearcă să-l ștergi din nou sau revino la el mai târziu. Dacă nu îl poți șterge nici atunci, contactează-ne.",
        },
      },
      unpublish: {
        success: {
          title: "Șablon retras",
          message: "{templateName}, șablonul de {templateType}, a fost retras de pe marketplace.",
        },
        error: {
          title: "Nu am putut retrage șablonul.",
          message:
            "Încearcă să-l retragi din nou sau revino la el mai târziu. Dacă nu îl poți retrage nici atunci, contactează-ne.",
        },
      },
    },
    delete_confirmation: {
      title: "Șterge șablon",
      description: {
        prefix: "Ești sigur că vrei să ștergi șablonul-",
        suffix: "? Toate datele legate de șablon vor fi eliminate permanent. Această acțiune nu poate fi anulată.",
      },
    },
    unpublish_confirmation: {
      title: "Retrage șablonul",
      description: {
        prefix: "Ești sigur că vrei să retragi șablonul-",
        suffix: "? Șablonul va fi retras din marketplace și nu va mai fi disponibil pentru alții.",
      },
    },
    dropdown: {
      add: {
        work_item: "Adaugă șablon nou",
        project: "Adaugă șablon nou",
      },
      label: {
        project: "Alege un șablon de proiect",
        page: "Alege un șablon",
      },
      tooltip: {
        work_item: "Alege un șablon de element de lucru",
      },
      no_results: {
        work_item: "Nu s-au găsit șabloane.",
        project: "Nu s-au găsit șabloane.",
      },
    },
  },
  intake_forms: {
    create: {
      title: "Creează un element de lucru",
      "sub-title": "Spune echipei pe ce ai dori să lucreze.",
      name: "Nume",
      email: "E-mail",
      about: "Despre ce este acest element de lucru?",
      description: "Descrie ce ar trebui să se întâmple",
      description_placeholder:
        "Adaugă cât de multe detalii dorești pentru a ajuta echipa să identifice situația și nevoile tale.",
      loading: "Se creează",
      create_work_item: "Creează element de lucru",
      errors: {
        name: "Numele este obligatoriu",
        name_max_length: "Numele trebuie să aibă mai puțin de 255 de caractere",
        email: "E-mailul este obligatoriu",
        email_invalid: "Adresă de e-mail invalidă",
        title: "Titlul este obligatoriu",
        title_max_length: "Titlul trebuie să aibă mai puțin de 255 de caractere",
      },
    },
    success: {
      title: "Elementul tău de lucru este acum în coada echipei.",
      description: "Echipa poate acum aproba sau respinge acest element de lucru din coada de primire.",
      primary_button: {
        text: "Adaugă alt element de lucru",
      },
      secondary_button: {
        text: "Află mai multe despre primire",
      },
    },
    how_it_works: {
      title: "Cum funcționează?",
      heading: "Acesta este un formular de primire.",
      description:
        "Primirea este o funcționalitate Plane care permite administratorilor și managerilor de proiect să primească elemente de lucru din exterior în proiectele lor.",
      steps: {
        step_1: "Acest formular scurt îți permite să creezi un element de lucru nou într-un proiect Plane.",
        step_2: "Când trimiți acest formular, se creează un element de lucru nou în primirea acelui proiect.",
        step_3: "Cineva din acel proiect sau echipă îl va revizui.",
        step_4: "Dacă îl aprobă, acest element va fi mutat în coada de lucru a proiectului. Altfel, va fi respins.",
        step_5:
          "Pentru a verifica starea acelui element, contactează managerul proiectului, administratorul sau persoana care ți-a trimis linkul către această pagină.",
      },
    },
    type_forms: {
      select_types: {
        title: "Selectează tipul de element de lucru",
        search_placeholder: "Caută un tip de element de lucru",
      },
      actions: {
        select_properties: "Selectează proprietăți",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "Elemente de lucru recurente",
      description:
        "Setează munca recurentă o singură dată și noi vom face munca. Vei vedea totul aici când este momentul.",
      new_recurring_work_item: "Element de lucru recurent nou",
      update_recurring_work_item: "Actualizează elementul de lucru recurent",
      form: {
        interval: {
          title: "Programare",
          start_date: {
            validation: {
              required: "Data de început este obligatorie",
            },
          },
          interval_type: {
            validation: {
              required: "Tipul de interval este obligatoriu",
            },
          },
        },
        button: {
          create: "Creează element de lucru recurent",
          update: "Actualizează elementul de lucru recurent",
        },
      },
      create_button: {
        label: "Creează element de lucru recurent",
        no_permission: "Contactează administratorul proiectului pentru a crea elemente de lucru recurente",
      },
    },
    empty_state: {
      upgrade: {
        title: "Munca ta, pe pilot automat",
        description:
          "Setează o dată. Îl readucem când este necesar. Fă upgrade la Business pentru ca munca recurentă să fie fără efort.",
      },
      no_templates: {
        button: "Creează primul tău element de lucru recurent",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Element de lucru recurent creat",
          message: "{name}, elementul de lucru recurent, este acum disponibil în spațiul tău de lucru.",
        },
        error: {
          title: "Nu am putut crea acest element de lucru recurent de data aceasta.",
          message:
            "Încearcă să salvezi din nou detaliile sau copiază-le într-un nou element de lucru recurent, de preferat într-un alt tab.",
        },
      },
      update: {
        success: {
          title: "Element de lucru recurent modificat",
          message: "{name}, elementul de lucru recurent, a fost modificat.",
        },
        error: {
          title: "Nu am putut salva modificările la acest element de lucru recurent.",
          message:
            "Încearcă să salvezi din nou detaliile sau revino la acest element de lucru recurent mai târziu. Dacă problema persistă, contactează-ne.",
        },
      },
      delete: {
        success: {
          title: "Element de lucru recurent șters",
          message: "{name}, elementul de lucru recurent, a fost șters din spațiul tău de lucru.",
        },
        error: {
          title: "Nu am putut șterge acest element de lucru recurent.",
          message:
            "Încearcă să-l ștergi din nou sau revino mai târziu. Dacă nu poți să-l ștergi nici atunci, contactează-ne.",
        },
      },
    },
    delete_confirmation: {
      title: "Șterge elementul de lucru recurent",
      description: {
        prefix: "Ești sigur că vrei să ștergi elementul de lucru recurent-",
        suffix:
          "? Toate datele legate de acest element de lucru recurent vor fi eliminate permanent. Această acțiune nu poate fi anulată.",
      },
    },
  },
  automations: {
    settings: {
      title: "Automatizări personalizate",
      create_automation: "Creează automatizare",
    },
    scope: {
      label: "Domeniu",
      run_on: "Rulează pe",
    },
    trigger: {
      label: "Declanșator",
      add_trigger: "Adaugă declanșator",
      sidebar_header: "Configurarea declanșatorului",
      input_label: "Care este declanșatorul pentru această automatizare?",
      input_placeholder: "Selectează o opțiune",
      section_plane_events: "Evenimente Plane",
      section_time_based: "Bazat pe timp",
      fixed_schedule: "Program fix",
      schedule: {
        frequency: "Frecvență",
        select_day: "Selectează ziua",
        day_of_month: "Ziua din lună",
        monthly_every: "În fiecare",
        monthly_day_aria: "Ziua {day}",
        time: "Oră",
        hour: "Oră",
        minute: "Minut",
        hour_suffix: "h",
        minute_suffix: "min",
        am: "AM",
        pm: "PM",
        timezone: "Fus orar",
        timezone_placeholder: "Selectează un fus orar",
        frequency_daily: "Zilnic",
        frequency_weekly: "Săptămânal",
        frequency_monthly: "Lunar",
        on: "Pe",
        validation_weekly_day_required: "Selectează cel puțin o zi a săptămânii.",
        validation_monthly_date_required: "Selectează o zi din lună.",
        main_content_schedule_summary_daily: "În fiecare zi la {time} ({timezone}).",
        main_content_schedule_summary_weekly: "În fiecare săptămână pe {days} la {time} ({timezone}).",
        main_content_schedule_summary_monthly: "În fiecare lună în ziua {day} la {time} ({timezone}).",
        schedule_mode: "Mod de planificare",
        schedule_mode_fixed: "Fix",
        schedule_mode_cron: "Cron",
        cron_expression_label: "Introduceți expresia Cron",
        cron_expression_placeholder: "0 9 * * 1-5",
        cron_invalid: "Expresie cron invalidă.",
        cron_preview: 'Această expresie Cron execută "{description}".',
        main_content_cron_summary: "{description} ({timezone}).",
      },
      button: {
        previous: "Înapoi",
        next: "Adaugă acțiune",
      },
    },
    condition: {
      label: "Condiție",
      add_condition: "Adaugă condiție",
      adding_condition: "Se adaugă condiția",
    },
    action: {
      label: "Acțiune",
      add_action: "Adaugă acțiune",
      sidebar_header: "Acțiuni",
      input_label: "Ce face automatizarea?",
      input_placeholder: "Selectează o opțiune",
      handler_name: {
        add_comment: "Adaugă comentariu",
        change_property: "Schimbă proprietatea",
      },
      configuration: {
        label: "Configurare",
        change_property: {
          placeholders: {
            property_name: "Selectează o proprietate",
            change_type: "Selectează",
            property_value_select: "{count, plural, one{Selectează valoarea} other{Selectează valorile}}",
            property_value_select_date: "Selectează data",
          },
          validation: {
            property_name_required: "Numele proprietății este obligatoriu",
            change_type_required: "Tipul de schimbare este obligatoriu",
            property_value_required: "Valoarea proprietății este obligatorie",
          },
        },
      },
      comment_block: {
        title: "Adaugă comentariu",
      },
      change_property_block: {
        title: "Schimbă proprietatea",
      },
      validation: {
        delete_only_action: "Dezactivează automatizarea înainte de a-i șterge singura acțiune.",
      },
    },
    conjunctions: {
      and: "Și",
      or: "Sau",
      if: "Dacă",
      then: "Atunci",
    },
    enable: {
      alert:
        "Apasă 'Activează' când automatizarea ta este completă. Odată activată, automatizarea va fi gata să ruleze.",
      validation: {
        required: "Automatizarea trebuie să aibă un declanșator și cel puțin o acțiune pentru a fi activată.",
      },
    },
    delete: {
      validation: {
        enabled: "Automatizarea trebuie dezactivată înainte de a fi ștearsă.",
      },
    },
    table: {
      title: "Titlul automatizării",
      last_run_on: "Ultima rulare pe",
      created_on: "Creată pe",
      last_updated_on: "Ultima actualizare pe",
      last_run_status: "Statusul ultimei rulări",
      average_duration: "Durata medie",
      owner: "Proprietar",
      executions: "Execuții",
    },
    create_modal: {
      heading: {
        create: "Creează automatizare",
        update: "Actualizează automatizarea",
      },
      title: {
        placeholder: "Denumește automatizarea ta.",
        required_error: "Titlul este obligatoriu",
      },
      description: {
        placeholder: "Descrie automatizarea ta.",
      },
      submit_button: {
        create: "Creează automatizare",
        update: "Actualizează automatizarea",
      },
    },
    delete_modal: {
      heading: "Șterge automatizarea",
    },
    activity: {
      filters: {
        show_fails: "Arată eșecurile",
        all: "Toate",
        only_activity: "Doar activitatea",
        only_run_history: "Doar istoricul rulărilor",
      },
      run_history: {
        initiator: "Inițiator",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Succes!",
          message: "Automatizarea a fost creată cu succes.",
        },
        error: {
          title: "Eroare!",
          message: "Crearea automatizării a eșuat.",
        },
      },
      update: {
        success: {
          title: "Succes!",
          message: "Automatizarea a fost actualizată cu succes.",
        },
        error: {
          title: "Eroare!",
          message: "Actualizarea automatizării a eșuat.",
        },
      },
      enable: {
        success: {
          title: "Succes!",
          message: "Automatizarea a fost activată cu succes.",
        },
        error: {
          title: "Eroare!",
          message: "Activarea automatizării a eșuat.",
        },
      },
      disable: {
        success: {
          title: "Succes!",
          message: "Automatizarea a fost dezactivată cu succes.",
        },
        error: {
          title: "Eroare!",
          message: "Dezactivarea automatizării a eșuat.",
        },
      },
      delete: {
        success: {
          title: "Automatizare ștearsă",
          message: "{name}, automatizarea, a fost ștearsă din proiectul tău.",
        },
        error: {
          title: "Nu am putut șterge această automatizare de data aceasta.",
          message:
            "Încearcă să o ștergi din nou sau revino mai târziu. Dacă nu poți să o ștergi nici atunci, contactează-ne.",
        },
      },
      action: {
        create: {
          error: {
            title: "Eroare!",
            message: "Nu s-a putut crea acțiunea. Te rog încearcă din nou!",
          },
        },
        update: {
          error: {
            title: "Eroare!",
            message: "Nu s-a putut actualiza acțiunea. Te rog încearcă din nou!",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "Încă nu există automatizări de afișat.",
        description:
          "Automatizările te ajută să elimini sarcinile repetitive prin stabilirea de declanșatori, condiții și acțiuni. Creează una pentru a economisi timp și a menține munca în mișcare fără efort.",
      },
      upgrade: {
        title: "Automatizări",
        description: "Automatizările sunt o modalitate de a automatiza sarcinile din proiectul tău.",
        sub_description: "Recuperează 80% din timpul tău administrativ când folosești Automatizările.",
      },
    },
  },
  sso: {
    header: "Identitate",
    description: "Configurați domeniul dvs. pentru a accesa funcțiile de securitate, inclusiv autentificarea unică.",
    domain_management: {
      header: "Gestionarea domeniilor",
      verified_domains: {
        header: "Domenii verificate",
        description: "Verificați proprietatea unui domeniu de e-mail pentru a activa autentificarea unică.",
        button_text: "Adăugați domeniu",
        list: {
          domain_name: "Numele domeniului",
          status: "Stare",
          status_verified: "Verificat",
          status_failed: "Eșuat",
          status_pending: "În așteptare",
        },
        add_domain: {
          title: "Adăugați domeniu",
          description: "Adăugați domeniul dvs. pentru a configura SSO și a-l verifica.",
          form: {
            domain_label: "Domeniu",
            domain_placeholder: "plane.so",
            domain_required: "Domeniul este obligatoriu",
            domain_invalid: "Introduceți un nume de domeniu valid (ex. plane.so)",
          },
          primary_button_text: "Adăugați domeniu",
          primary_button_loading_text: "Se adaugă",
          toast: {
            success_title: "Succes!",
            success_message:
              "Domeniul a fost adăugat cu succes. Vă rugăm să-l verificați adăugând înregistrarea DNS TXT.",
            error_message: "Nu s-a putut adăuga domeniul. Vă rugăm să încercați din nou.",
          },
        },
        verify_domain: {
          title: "Verificați domeniul dvs.",
          description: "Urmați acești pași pentru a vă verifica domeniul.",
          instructions: {
            label: "Instrucțiuni",
            step_1: "Accesați setările DNS pentru gazda domeniului dvs.",
            step_2: {
              part_1: "Creați o",
              part_2: "înregistrare TXT",
              part_3: "și lipiți valoarea completă a înregistrării furnizate mai jos.",
            },
            step_3: "Această actualizare durează de obicei câteva minute, dar poate dura până la 72 de ore.",
            step_4:
              'Faceți clic pe "Verificați domeniul" pentru a confirma odată ce înregistrarea DNS a fost actualizată.',
          },
          verification_code_label: "Valoarea înregistrării TXT",
          verification_code_description: "Adăugați această înregistrare la setările DNS",
          domain_label: "Domeniu",
          primary_button_text: "Verificați domeniul",
          primary_button_loading_text: "Se verifică",
          secondary_button_text: "O voi face mai târziu",
          toast: {
            success_title: "Succes!",
            success_message: "Domeniul a fost verificat cu succes.",
            error_message: "Nu s-a putut verifica domeniul. Vă rugăm să încercați din nou.",
          },
        },
        delete_domain: {
          title: "Ștergeți domeniul",
          description: {
            prefix: "Sigur doriți să ștergeți",
            suffix: "? Această acțiune nu poate fi anulată.",
          },
          primary_button_text: "Șterge",
          primary_button_loading_text: "Se șterge",
          secondary_button_text: "Anulează",
          toast: {
            success_title: "Succes!",
            success_message: "Domeniul a fost șters cu succes.",
            error_message: "Nu s-a putut șterge domeniul. Vă rugăm să încercați din nou.",
          },
        },
      },
    },
    providers: {
      header: "Autentificare unică",
      disabled_message: "Adăugați un domeniu verificat pentru a configura SSO",
      configure: {
        create: "Configurați",
        update: "Editați",
      },
      switch_alert_modal: {
        title: "Comutați metoda SSO la {newProviderShortName}?",
        content:
          "Sunteți pe cale să activați {newProviderLongName} ({newProviderShortName}). Această acțiune va dezactiva automat {activeProviderLongName} ({activeProviderShortName}). Utilizatorii care încearcă să se conecteze prin {activeProviderShortName} nu vor mai putea accesa platforma până când nu trec la noua metodă. Sigur doriți să continuați?",
        primary_button_text: "Comutați",
        primary_button_text_loading: "Se comută",
        secondary_button_text: "Anulează",
      },
      form_section: {
        title: "Detalii furnizate de IdP pentru {workspaceName}",
      },
      form_action_buttons: {
        saving: "Se salvează",
        save_changes: "Salvați modificările",
        configure_only: "Doar configurare",
        configure_and_enable: "Configurați și activați",
        default: "Salvați",
      },
      setup_details_section: {
        title: "{workspaceName} detalii furnizate pentru IdP-ul dvs.",
        button_text: "Obțineți detalii de configurare",
      },
      saml: {
        header: "Activați SAML",
        description: "Configurați furnizorul dvs. de identitate SAML pentru a activa autentificarea unică.",
        configure: {
          title: "Activați SAML",
          description:
            "Verificați proprietatea unui domeniu de e-mail pentru a accesa funcțiile de securitate, inclusiv autentificarea unică.",
          toast: {
            success_title: "Succes!",
            create_success_message: "Furnizorul SAML a fost creat cu succes.",
            update_success_message: "Furnizorul SAML a fost actualizat cu succes.",
            error_title: "Eroare!",
            error_message: "Nu s-a putut salva furnizorul SAML. Vă rugăm să încercați din nou.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Detalii web",
            entity_id: {
              label: "ID entitate | Public | Informații metadate",
              description:
                "Vom genera această parte a metadatelor care identifică această aplicație Plane ca un serviciu autorizat pe IdP-ul dvs.",
            },
            callback_url: {
              label: "URL autentificare unică",
              description:
                "Vom genera acest lucru pentru dvs. Adăugați acest lucru în câmpul URL de redirecționare de conectare al IdP-ului dvs.",
            },
            logout_url: {
              label: "URL deconectare unică",
              description:
                "Vom genera acest lucru pentru dvs. Adăugați acest lucru în câmpul URL de redirecționare de deconectare unică al IdP-ului dvs.",
            },
          },
          mobile_details: {
            header: "Detalii mobile",
            entity_id: {
              label: "ID entitate | Public | Informații metadate",
              description:
                "Vom genera această parte a metadatelor care identifică această aplicație Plane ca un serviciu autorizat pe IdP-ul dvs.",
            },
            callback_url: {
              label: "URL autentificare unică",
              description:
                "Vom genera acest lucru pentru dvs. Adăugați acest lucru în câmpul URL de redirecționare de conectare al IdP-ului dvs.",
            },
            logout_url: {
              label: "URL deconectare unică",
              description:
                "Vom genera acest lucru pentru dvs. Adăugați acest lucru în câmpul URL de redirecționare de deconectare al IdP-ului dvs.",
            },
          },
          mapping_table: {
            header: "Detalii mapare",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "Activați OIDC",
        description: "Configurați furnizorul dvs. de identitate OIDC pentru a activa autentificarea unică.",
        configure: {
          title: "Activați OIDC",
          description:
            "Verificați proprietatea unui domeniu de e-mail pentru a accesa funcțiile de securitate, inclusiv autentificarea unică.",
          toast: {
            success_title: "Succes!",
            create_success_message: "Furnizorul OIDC a fost creat cu succes.",
            update_success_message: "Furnizorul OIDC a fost actualizat cu succes.",
            error_title: "Eroare!",
            error_message: "Nu s-a putut salva furnizorul OIDC. Vă rugăm să încercați din nou.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Detalii web",
            origin_url: {
              label: "URL origine",
              description:
                "Vom genera acest lucru pentru această aplicație Plane. Adăugați acest lucru ca origine de încredere în câmpul corespunzător al IdP-ului dvs.",
            },
            callback_url: {
              label: "URL de redirecționare",
              description:
                "Vom genera acest lucru pentru dvs. Adăugați acest lucru în câmpul URL de redirecționare de conectare al IdP-ului dvs.",
            },
            logout_url: {
              label: "URL de deconectare",
              description:
                "Vom genera acest lucru pentru dvs. Adăugați acest lucru în câmpul URL de redirecționare de deconectare al IdP-ului dvs.",
            },
          },
          mobile_details: {
            header: "Detalii mobile",
            origin_url: {
              label: "URL origine",
              description:
                "Vom genera acest lucru pentru această aplicație Plane. Adăugați acest lucru ca origine de încredere în câmpul corespunzător al IdP-ului dvs.",
            },
            callback_url: {
              label: "URL de redirecționare",
              description:
                "Vom genera acest lucru pentru dvs. Adăugați acest lucru în câmpul URL de redirecționare de conectare al IdP-ului dvs.",
            },
            logout_url: {
              label: "URL de deconectare",
              description:
                "Vom genera acest lucru pentru dvs. Adăugați acest lucru în câmpul URL de redirecționare de deconectare al IdP-ului dvs.",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "Numele proiectului nu poate conține caractere speciale.",
  pql: {
    functions: {
      date: {
        now: {
          description: "Data și ora curente",
        },
        today: {
          description: "Data de azi",
        },
        start_of_day: {
          description: "Începutul zilei de azi",
        },
        end_of_day: {
          description: "Sfârșitul zilei de azi",
        },
        start_of_week: {
          description: "Începutul săptămânii curente",
        },
        end_of_week: {
          description: "Sfârșitul săptămânii curente",
        },
        start_of_month: {
          description: "Începutul lunii curente",
        },
        end_of_month: {
          description: "Sfârșitul lunii curente",
        },
        start_of_year: {
          description: "Începutul anului curent",
        },
        end_of_year: {
          description: "Sfârșitul anului curent",
        },
        days_ago: {
          description: "Data cu n zile în trecut",
        },
        days_from_now: {
          description: "Data cu n zile în viitor",
        },
        weeks_ago: {
          description: "Data cu n săptămâni în trecut",
        },
        weeks_from_now: {
          description: "Data cu n săptămâni în viitor",
        },
        months_ago: {
          description: "Data cu n luni în trecut",
        },
        months_from_now: {
          description: "Data cu n luni în viitor",
        },
      },
      user: {
        current_user: {
          description: "Utilizatorul conectat în prezent",
        },
        members_of: {
          description: 'Membri din "project:<id>" sau "teamspace:<id>"',
        },
        workspace_members: {
          description: "Toți membrii spațiului de lucru",
        },
      },
      cycle: {
        active_cycle: {
          description: "Ciclu activ azi",
        },
        completed_cycles: {
          description: "Cicluri a căror dată de sfârșit a trecut",
        },
        upcoming_cycles: {
          description: "Cicluri a căror dată de început este în viitor",
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
          description: "Data scadenței a trecut ȘI starea este deschisă",
        },
        has_no_assignee: {
          description: "Elementul de lucru nu are responsabil",
        },
        has_no_label: {
          description: "Elementul de lucru nu are etichete",
        },
        is_top_level: {
          description: "Nu este un sub-element de lucru (nu are părinte)",
        },
        is_sub_work_item: {
          description: "Este un sub-element de lucru (are părinte)",
        },
        is_epic: {
          description: "Epic",
        },
        is_intake: {
          description: "Este un element de intake",
        },
        is_draft: {
          description: "Este un element în ciornă",
        },
        is_archived: {
          description: "Este arhivat",
        },
        has_children: {
          description: "Are cel puțin un sub-element de lucru",
        },
        has_start_and_due_dates: {
          description: "Are atât dată de început cât și dată scadentă",
        },
      },
      relation: {
        linked_to: {
          description: "Elemente de lucru legate de elementul dat",
        },
        blocked_by: {
          description: "Elemente de lucru blocate de elementul dat",
        },
        blocks: {
          description: "Elemente de lucru care blochează elementul dat",
        },
        child_of: {
          description: "Sub-elementele elementului dat",
        },
        parent_of: {
          description: "Elementul părinte al elementului dat",
        },
        duplicate_of: {
          description: "Elemente de lucru marcate ca duplicate ale elementului dat",
        },
      },
      history: {
        was_ever: {
          description: "Câmpul a fost vreodată setat la această valoare",
        },
        was: {
          description: "Câmpul a fost anterior această valoare (modificat)",
        },
        changed_from: {
          description: "Câmpul a fost modificat din această valoare",
        },
        changed_to: {
          description: "Câmpul a fost modificat la această valoare",
        },
        changed: {
          description: "Câmpul a fost modificat",
        },
        updated_by: {
          description: "Element de lucru actualizat de acest utilizator",
        },
        commented_by: {
          description: "Element de lucru comentat de acest utilizator",
        },
        field_changed_by: {
          description: "Câmp modificat de acest utilizator",
        },
        was_assigned_to: {
          description: "Element de lucru atribuit acestui utilizator",
        },
        changed_after: {
          description: "Câmp modificat după această dată",
        },
        changed_before: {
          description: "Câmp modificat înainte de această dată",
        },
        field_changed_after: {
          description: "Câmp modificat după această dată",
        },
        field_changed_before: {
          description: "Câmp modificat înainte de această dată",
        },
        changed_to_after: {
          description: "Câmp modificat la această valoare după această dată",
        },
        changed_to_before: {
          description: "Câmp modificat la această valoare înainte de această dată",
        },
        field_changed_between: {
          description: "Câmp modificat între aceste date",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "navigați",
      accept: "acceptați",
      close: "închideți",
      pick_date: "Alegeți o dată",
    },
    placeholder: 'Introduceți o interogare și apăsați "ENTER" pentru filtrare...',
    error: "Eroare la trimiterea interogării. Verificați și încercați din nou.",
  },
  releases: {
    label: "{count, plural, one {Lansare} other {Lansări}}",
    no_release: "Nicio lansare",
    unreleased: "Nelansat",
    select_releases: "Selectează lansări",
    overview: "Prezentare generală",
    scope: "Scop",
    page_title: {
      scope: "Lansare - {name} | Scop",
      scope_fallback: "Lansare | Scop",
    },
    properties: "Proprietăți",
    target_date: "Data țintă",
    lead: "Responsabil",
    release_tag: "Tag",
    labels: "Etichete",
    description_placeholder: "Adăugați o descriere...",
    progress: "Progres",
    completed_work_items: "Activități finalizate",
    pending_work_items: "Activități în așteptare",
    cancelled_work_items: "Activități anulate",
    scope_page: {
      work_items: "Activități",
      add_work_items: "Adăugați activități",
      remove_from_release: "Eliminați din lansare",
      empty_state: {
        title: "Fără activități",
        description: "Adăugați activități pentru a defini scopul lansării.",
      },
      confirm_remove: {
        content: "Sigur doriți să eliminați această activitate din lansare? Va rămâne în proiect.",
        primary_button: {
          default: "Elimină",
          loading: "Se elimină",
        },
      },
    },
    empty_state: {
      title: "Încă fără domeniu",
      description: "Adăugați elemente de lucru la lansare pentru a urmări finalizarea lor pentru această lansare.",
      add_scope: "Adaugă domeniu",
      not_found: {
        title: "Lansarea nu a fost găsită",
        description: "Lansarea a putut fi ștearsă.",
        primary_button: "Înapoi la lansări",
      },
    },
    toast: {
      work_items_added: "{count, plural, one {Activitate adăugată} other {Activități adăugate}}",
      work_items_error: "Nu s-au putut adăuga activitățile",
    },
    count_releases: "{count, plural, one {# lansare} other {# lansări}}",
    actions: {
      delete: "Șterge",
    },
    delete_modal: {
      title: "Șterge lansarea",
      content: 'Sigur vrei să ștergi lansarea "{releaseName}"? Această acțiune nu poate fi anulată.',
    },
    settings: {
      heading: {
        title: "Lansări",
        description: "Gestionează cu precizie livrabilele proiectului folosind lansări.",
      },
      toggle: {
        title: "Activează lansările",
        description: "Membrii spațiului de lucru vor avea acces de vizualizare la scop în proiectele lor.",
      },
      toasts: {
        enable: {
          loading: "Se activează lansările...",
          success: {
            title: "Lansări activate",
            message: "Lansările au fost activate pentru acest spațiu de lucru.",
          },
          error: {
            title: "Eroare",
            message: "Activarea lansărilor a eșuat. Te rugăm să încerci din nou.",
          },
        },
        disable: {
          loading: "Se dezactivează lansările...",
          success: {
            title: "Lansări dezactivate",
            message: "Lansările au fost dezactivate pentru acest spațiu de lucru.",
          },
          error: {
            title: "Eroare",
            message: "Dezactivarea lansărilor a eșuat. Te rugăm să încerci din nou.",
          },
        },
      },
      tabs: {
        tags: "Taguri de lansare",
        labels: "Etichete",
      },
      tags: {
        title: "Taguri de lansare",
        description: "Categorizează și filtrează lansările folosind taguri.",
        add: "Adaugă tag",
        empty_state: "Nu există încă taguri. Creează primul tău tag.",
        errors: {
          version_required: "Versiunea este obligatorie.",
          version_already_exists: "Există deja un tag cu această versiune.",
          generic: "Ceva nu a mers bine. Te rugăm să încerci din nou.",
        },
        delete_modal: {
          title: "Șterge tagul",
          content: 'Sigur vrei să ștergi tagul "{tagVersion}"? Această acțiune nu poate fi anulată.',
        },
        actions: {
          edit: "Editează tagul",
          delete: "Șterge tagul",
        },
        toasts: {
          delete: {
            success: "Tagul a fost șters cu succes.",
            error: "Ștergerea tagului a eșuat. Te rugăm să încerci din nou.",
          },
        },
      },
      labels: {
        title: "Etichete",
        description: "Structurează și organizează inițiativele cu etichete.",
        add: "Adaugă etichetă",
        empty_state: "Nu există încă etichete. Creează prima ta etichetă.",
        errors: {
          name_required: "Numele este obligatoriu.",
          name_already_exists: "Există deja o etichetă cu acest nume.",
          generic: "Ceva nu a mers bine. Te rugăm să încerci din nou.",
        },
        modal: {
          name_placeholder: "Numele etichetei",
          pick_color: "Alege culoarea etichetei",
        },
        actions: {
          edit: "Editează eticheta",
          delete: "Șterge eticheta",
        },
        drag_to_reorder: "Trage pentru a reordona",
        delete_modal: {
          title: "Șterge eticheta",
          content: 'Sigur vrei să ștergi eticheta "{labelName}"? Această acțiune nu poate fi anulată.',
        },
        toasts: {
          delete: {
            success: "Eticheta a fost ștearsă cu succes.",
            error: "Ștergerea etichetei a eșuat. Te rugăm să încerci din nou.",
          },
        },
      },
    },
  },
  work_item_type_hierarchy: {
    settings: {
      title: "Ierarhie",
      tab_label: "Ierarhie",
      description:
        "Configurați niveluri de ierarhie pentru a vă organiza munca. Fiecare nivel definește o relație de părinte cu elementul direct deasupra și o relație de copil cu elementul direct dedesubt. ",
      sidebar_label: "Ierarhie",
      enable_control: {
        title: "Activați ierarhia",
        description: "Creați relații părinte-copil între diferite tipuri de elemente de lucru.",
        tooltip: "Nu puteți dezactiva ierarhia odată ce este activată.",
      },
      workspace_work_item_types_disabled_banner: {
        content: "Definiți mai întâi tipurile de elemente de lucru pentru a crea o nouă ierarhie.",
        cta: "Setări tipuri elemente de lucru",
      },
    },
    levels: {
      max_level_placeholder: "Adăugați nivel de ierarhie",
      empty_level_placeholder: "Adăugați un tip de element de lucru la nivelul {level}",
      empty_level_unauthorized: "Nu s-au găsit tipuri de elemente de lucru la acest nivel.",
      drag_tooltip: "Glisați pentru a schimba nivelul",
      quick_actions: {
        set_as_default: {
          label: "Setați ca implicit",
          toast: {
            loading: "Setare ca implicit...",
            success: {
              title: "Succes!",
              message: "Nivelul de ierarhie {level} a fost setat ca implicit cu succes.",
            },
            error: {
              title: "Eroare!",
              message: "Nu s-a putut seta nivelul de ierarhie {level} ca implicit. Vă rugăm să încercați din nou.",
            },
          },
        },
      },
      add_to_level_toast: {
        loading: "Se adaugă {workItemTypeName} la nivelul {level}...",
        success: {
          title: "Succes!",
          message: "{workItemTypeName} a fost adăugat la nivelul {level} cu succes.",
        },
        error: {
          title: "Eroare!",
          message: "Nu s-a putut adăuga {workItemTypeName} la nivelul {level} deoarece încalcă regulile de ierarhie.",
        },
      },
    },
    work_item_modal: {
      invalid_work_item_type_create_toast: {
        title: "Eroare!",
        message:
          "Tipul de element de lucru selectat nu poate fi utilizat pentru a crea un nou element de lucru deoarece încalcă regulile ierarhiei.",
      },
      invalid_work_item_type_update_toast: {
        title: "Eroare!",
        message: "Tipul de element de lucru nu poate fi actualizat deoarece încalcă regulile ierarhiei.",
      },
    },
    work_item_type_modal: {
      level: "Nivel de ierarhie",
      invalid_level_toast: {
        title: "Eroare!",
        message: "Tipul elementului de lucru nu poate fi actualizat deoarece încalcă regulile de ierarhie.",
      },
    },
  },
  page_actions: {
    move_page: {
      placeholders: {
        project_to_all_with_wiki: "Caută colecții wiki, proiecte și spații de echipă",
        project_to_project_with_wiki: "Caută colecții wiki și proiecte",
        teamspace_to_all_with_wiki: "Caută colecții wiki, proiecte și spații de echipă",
      },
      toasts: {
        collection_error: {
          title: "Mutată în wiki",
          message: "Pagina a fost mutată în wiki, dar nu a putut fi adăugată la colecția selectată. Rămâne în General.",
        },
      },
    },
    remove_from_collection: {
      label: "Elimină din colecție",
      success_message: "Pagina a fost eliminată din colecție.",
      error_message: "Pagina nu a putut fi eliminată din colecție. Te rugăm să încerci din nou.",
    },
  },
  wiki_collections: {
    predefined: {
      general: "General",
      private: "Privat",
      shared: "Partajat",
      archived: "Arhivat",
    },
    fallback_name: "Colecție",
    form: {
      name_required: "Titlul colecției este obligatoriu",
      name_max_length: "Numele colecției trebuie să aibă mai puțin de 255 de caractere",
      name_placeholder_create: "Dă un titlu colecției",
      name_placeholder_edit: "Numele colecției",
    },
    create_modal: {
      title: "Creează o colecție",
      submit: "Creează colecția",
    },
    rename_modal: {
      title: "Redenumește colecția",
    },
    delete_modal: {
      title: "Șterge colecția",
      page_count: "Această colecție are {pageCount} pagini. Alege ce se întâmplă cu ele.",
      transfer_title: "Mută paginile și șterge colecția",
      transfer_description:
        "Mută toate paginile într-o altă colecție înainte de ștergere. Paginile și permisiunile lor vor fi păstrate.",
      transfer_warning: "Paginile mutate vor moșteni permisiunile colecției selectate.",
      transfer_target_label: "Mută paginile în",
      transfer_target_placeholder: "Selectează o colecție",
      delete_with_pages_title: "Șterge colecția împreună cu paginile",
      delete_with_pages_description:
        "Șterge definitiv colecția și toate paginile ei. Această acțiune nu poate fi anulată.",
      submit: "Șterge colecția",
    },
    header: {
      add_page: "Adaugă pagină",
    },
    menu: {
      create_new_page: "Creează o pagină nouă",
      add_existing_page: "Adaugă o pagină existentă",
      rename_collection: "Redenumește colecția",
      collection_options: "Opțiuni colecție",
    },
    add_existing_page_modal: {
      search_placeholder: "Caută pagini",
      success_message: "{count} pagini au fost adăugate în colecție.",
      error_message: "Paginile nu au putut fi mutate. Te rugăm să încerci din nou.",
      no_pages_found: "Nu au fost găsite pagini care să corespundă căutării",
      no_pages_available: "Nu există pagini disponibile pentru mutare",
      submit: "Mută",
    },
    list: {
      invite_only: "Doar pe bază de invitație",
      remove_error: "Pagina nu a putut fi eliminată din colecție.",
      no_matching_pages: "Nicio pagină potrivită",
      remove_search_criteria: "Elimină criteriile de căutare pentru a vedea toate paginile",
      remove_filters: "Elimină filtrele pentru a vedea toate paginile",
      no_pages_title: "Încă nu există pagini",
      no_pages_description: "Această colecție nu are momentan nicio pagină.",
      untitled: "Fără titlu",
      restricted_access: "Acces restricționat",
      collapse_page: "Restrânge pagina",
      expand_page: "Extinde pagina",
      page_actions: "Acțiuni pagină",
      page_link_copied: "Linkul paginii a fost copiat în clipboard.",
      columns: {
        page_name: "Nume pagină",
        owner: "Proprietar",
        nested_pages: "Pagini imbricate",
        last_activity: "Ultima activitate",
        actions: "Acțiuni",
      },
    },
    toasts: {
      created: "Colecția a fost creată cu succes.",
      create_error: "Colecția nu a putut fi creată. Te rugăm să încerci din nou.",
      renamed: "Colecția a fost redenumită cu succes.",
      rename_error: "Colecția nu a putut fi actualizată. Te rugăm să încerci din nou.",
      transferred_deleted: "Paginile au fost mutate, iar colecția a fost ștearsă.",
      deleted_with_pages: "Colecția și paginile ei au fost șterse.",
      delete_error: "Colecția nu a putut fi ștearsă. Te rugăm să încerci din nou.",
      target_required: "Te rugăm să selectezi o colecție în care să muți paginile.",
      create_page_error: "Pagina nu a putut fi creată. Te rugăm să încerci din nou.",
      create_page_in_collection_error:
        "Pagina nu a putut fi creată sau adăugată în colecție. Te rugăm să încerci din nou.",
      collection_link_copied: "Linkul colecției a fost copiat în clipboard.",
    },
  },
} as const;
