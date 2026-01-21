export default {
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
  select_or_customize_your_interface_color_scheme: "Selectează sau personalizează schema de culori a interfeței.",
  theme: "Temă",
  system_preference: "Preferință de sistem",
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
  workspace: "Spațiu de lucru",
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
  project_id_tooltip_content: "Te ajută să identifici unic activitățile din proiect. Maxim 10 caractere.",
  description_placeholder: "Descriere",
  only_alphanumeric_non_latin_characters_allowed: "Sunt permise doar caractere alfanumerice și non-latine.",
  project_id_is_required: "ID-ul proiectului este obligatoriu",
  project_id_allowed_char: "Sunt permise doar caractere alfanumerice și non-latine.",
  project_id_min_char: "ID-ul proiectului trebuie să aibă cel puțin 1 caracter",
  project_id_max_char: "ID-ul proiectului trebuie să aibă cel mult 10 caractere",
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
  pages: "Documentație",
  intake: "Cereri",
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
  discord: "Discord",
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
  priority: "Prioritate",
  none: "Niciuna",
  urgent: "Urgentă",
  high: "Importantă",
  medium: "Medie",
  low: "Scăzută",
  members: "Membri",
  assignee: "Responsabil",
  assignees: "Responsabili",
  you: "Tu",
  labels: "Etichete",
  create_new_label: "Creează etichetă nouă",
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
    epics: "Sarcini majore",
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
    clear_all: "Șterge tot",
    copied: "Copiat!",
    link_copied: "Link copiat!",
    link_copied_to_clipboard: "Link-ul a fost copiat în memoria temporară",
    copied_to_clipboard: "Link-ul activității copiat în memoria temporară",
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
    live: "În direct",
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
      description: "Doar activitățile finalizate sau anulate\npot fi arhivate",
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
      body: "Salut administrator(i) instanței,\n\nVă rog să creați un nou spațiu de lucru cu URL-ul [/workspace-name] pentru [scopul creării spațiului de lucru].\n\nMulțumesc,\n{firstName} {lastName}\n{email}",
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
        description: "Nu s-au găsit proiecte care să corespundă criteriilor aplicate.\n Creează un proiect nou.",
      },
      search: {
        description: "Nu s-au găsit proiecte care să corespundă criteriilor.\nCreează un proiect nou.",
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
        title: "Chei secrete API",
        add_token: "Adaugă cheie secretă API",
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
        title: "Recepție",
        short_title: "Recepție",
        description:
          "Permiteți non-membrilor să partajeze erori, feedback și sugestii; fără a perturba fluxul de lucru.",
        toggle_title: "Activați recepția",
        toggle_description: "Permiteți membrilor proiectului să creeze solicitări de recepție în aplicație.",
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
        description:
          "Nicio perspectivă nu se potrivește criteriilor de căutare.\n Creează o nouă perspectivă în schimb.",
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
        description: "Actualizările pentru activitățile atribuite ție pot fi\nvăzute aici",
      },
      mentions: {
        title: "Nicio activitate atribuită",
        description: "Actualizările pentru activitățile atribuite ție pot fi\nvăzute aici",
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
        description: "Încearcă un alt termen sau anunță-ne\n dacă ești sigur că ai căutat corect.",
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
} as const;
