export default {
  sidebar: {
    projects: "Projekty",
    pages: "Stránky",
    new_work_item: "Nová pracovná položka",
    home: "Domov",
    your_work: "Vaša práca",
    inbox: "Doručená pošta",
    workspace: "Pracovný priestor",
    views: "Pohľady",
    analytics: "Analytika",
    work_items: "Pracovné položky",
    cycles: "Cykly",
    modules: "Moduly",
    intake: "Príjem",
    drafts: "Koncepty",
    favorites: "Obľúbené",
    pro: "Pro",
    upgrade: "Upgrade",
  },
  auth: {
    common: {
      email: {
        label: "E-mail",
        placeholder: "meno@spolocnost.sk",
        errors: {
          required: "E-mail je povinný",
          invalid: "E-mail je neplatný",
        },
      },
      password: {
        label: "Heslo",
        set_password: "Nastaviť heslo",
        placeholder: "Zadajte heslo",
        confirm_password: {
          label: "Potvrďte heslo",
          placeholder: "Potvrďte heslo",
        },
        current_password: {
          label: "Aktuálne heslo",
        },
        new_password: {
          label: "Nové heslo",
          placeholder: "Zadajte nové heslo",
        },
        change_password: {
          label: {
            default: "Zmeniť heslo",
            submitting: "Mení sa heslo",
          },
        },
        errors: {
          match: "Heslá sa nezhodujú",
          empty: "Zadajte prosím svoje heslo",
          length: "Dĺžka hesla by mala byť viac ako 8 znakov",
          strength: {
            weak: "Heslo je slabé",
            strong: "Heslo je silné",
          },
        },
        submit: "Nastaviť heslo",
        toast: {
          change_password: {
            success: {
              title: "Úspech!",
              message: "Heslo bolo úspešne zmenené.",
            },
            error: {
              title: "Chyba!",
              message: "Niečo sa pokazilo. Skúste to prosím znova.",
            },
          },
        },
      },
      unique_code: {
        label: "Jedinečný kód",
        placeholder: "123456",
        paste_code: "Vložte kód zaslaný na váš e-mail",
        requesting_new_code: "Žiadam o nový kód",
        sending_code: "Odosielam kód",
      },
      already_have_an_account: "Už máte účet?",
      login: "Prihlásiť sa",
      create_account: "Vytvoriť účet",
      new_to_plane: "Nový v Plane?",
      back_to_sign_in: "Späť na prihlásenie",
      resend_in: "Znova odoslať za {seconds} sekúnd",
      sign_in_with_unique_code: "Prihlásiť sa pomocou jedinečného kódu",
      forgot_password: "Zabudli ste heslo?",
    },
    sign_up: {
      header: {
        label: "Vytvorte účet a začnite spravovať prácu so svojím tímom.",
        step: {
          email: {
            header: "Registrácia",
            sub_header: "",
          },
          password: {
            header: "Registrácia",
            sub_header: "Zaregistrujte sa pomocou kombinácie e-mailu a hesla.",
          },
          unique_code: {
            header: "Registrácia",
            sub_header: "Zaregistrujte sa pomocou jedinečného kódu zaslaného na vyššie uvedenú e-mailovú adresu.",
          },
        },
      },
      errors: {
        password: {
          strength: "Skúste nastaviť silné heslo, aby ste mohli pokračovať",
        },
      },
    },
    sign_in: {
      header: {
        label: "Prihláste sa a začnite spravovať prácu so svojím tímom.",
        step: {
          email: {
            header: "Prihlásiť sa alebo zaregistrovať",
            sub_header: "",
          },
          password: {
            header: "Prihlásiť sa alebo zaregistrovať",
            sub_header: "Použite svoju kombináciu e-mailu a hesla na prihlásenie.",
          },
          unique_code: {
            header: "Prihlásiť sa alebo zaregistrovať",
            sub_header: "Prihláste sa pomocou jedinečného kódu zaslaného na vyššie uvedenú e-mailovú adresu.",
          },
        },
      },
    },
    forgot_password: {
      title: "Obnovte svoje heslo",
      description:
        "Zadajte overenú e-mailovú adresu vášho používateľského účtu a my vám zašleme odkaz na obnovenie hesla.",
      email_sent: "Odoslali sme odkaz na obnovenie na vašu e-mailovú adresu",
      send_reset_link: "Odoslať odkaz na obnovenie",
      errors: {
        smtp_not_enabled: "Vidíme, že váš správca neaktivoval SMTP, nebudeme môcť odoslať odkaz na obnovenie hesla",
      },
      toast: {
        success: {
          title: "E-mail odoslaný",
          message:
            "Skontrolujte si doručenú poštu pre odkaz na obnovenie hesla. Ak sa neobjaví v priebehu niekoľkých minút, skontrolujte si spam.",
        },
        error: {
          title: "Chyba!",
          message: "Niečo sa pokazilo. Skúste to prosím znova.",
        },
      },
    },
    reset_password: {
      title: "Nastaviť nové heslo",
      description: "Zabezpečte svoj účet silným heslom",
    },
    set_password: {
      title: "Zabezpečte svoj účet",
      description: "Nastavenie hesla vám pomôže bezpečne sa prihlásiť",
    },
    sign_out: {
      toast: {
        error: {
          title: "Chyba!",
          message: "Nepodarilo sa odhlásiť. Skúste to prosím znova.",
        },
      },
    },
  },
  submit: "Odoslať",
  cancel: "Zrušiť",
  loading: "Načítavanie",
  error: "Chyba",
  success: "Úspech",
  warning: "Varovanie",
  info: "Informácia",
  close: "Zatvoriť",
  yes: "Áno",
  no: "Nie",
  ok: "OK",
  name: "Názov",
  description: "Popis",
  search: "Hľadať",
  add_member: "Pridať člena",
  adding_members: "Pridávanie členov",
  remove_member: "Odstrániť člena",
  add_members: "Pridať členov",
  adding_member: "Pridávanie členov",
  remove_members: "Odstrániť členov",
  add: "Pridať",
  adding: "Pridávanie",
  remove: "Odstrániť",
  add_new: "Pridať nový",
  remove_selected: "Odstrániť vybrané",
  first_name: "Krstné meno",
  last_name: "Priezvisko",
  email: "E-mail",
  display_name: "Zobrazované meno",
  role: "Rola",
  timezone: "Časové pásmo",
  avatar: "Profilový obrázok",
  cover_image: "Úvodný obrázok",
  password: "Heslo",
  change_cover: "Zmeniť úvodný obrázok",
  language: "Jazyk",
  saving: "Ukladanie",
  save_changes: "Uložiť zmeny",
  deactivate_account: "Deaktivovať účet",
  deactivate_account_description:
    "Pri deaktivácii účtu budú všetky dáta a prostriedky v rámci tohto účtu trvalo odstránené a nedajú sa obnoviť.",
  profile_settings: "Nastavenia profilu",
  your_account: "Váš účet",
  security: "Zabezpečenie",
  activity: "Aktivita",
  appearance: "Vzhľad",
  notifications: "Oznámenia",
  workspaces: "Pracovné priestory",
  create_workspace: "Vytvoriť pracovný priestor",
  invitations: "Pozvánky",
  summary: "Zhrnutie",
  assigned: "Priradené",
  created: "Vytvorené",
  subscribed: "Odobierané",
  you_do_not_have_the_permission_to_access_this_page: "Nemáte oprávnenie na prístup k tejto stránke.",
  something_went_wrong_please_try_again: "Niečo sa pokazilo. Skúste to prosím znova.",
  load_more: "Načítať viac",
  select_or_customize_your_interface_color_scheme: "Vyberte alebo prispôsobte farebnú schému rozhrania.",
  theme: "Téma",
  system_preference: "Systémové predvoľby",
  light: "Svetlé",
  dark: "Tmavé",
  light_contrast: "Svetlý vysoký kontrast",
  dark_contrast: "Tmavý vysoký kontrast",
  custom: "Vlastná téma",
  select_your_theme: "Vyberte tému",
  customize_your_theme: "Prispôsobte si tému",
  background_color: "Farba pozadia",
  text_color: "Farba textu",
  primary_color: "Hlavná farba (téma)",
  sidebar_background_color: "Farba pozadia bočného panela",
  sidebar_text_color: "Farba textu bočného panela",
  set_theme: "Nastaviť tému",
  enter_a_valid_hex_code_of_6_characters: "Zadajte platný hexadecimálny kód so 6 znakmi",
  background_color_is_required: "Farba pozadia je povinná",
  text_color_is_required: "Farba textu je povinná",
  primary_color_is_required: "Hlavná farba je povinná",
  sidebar_background_color_is_required: "Farba pozadia bočného panela je povinná",
  sidebar_text_color_is_required: "Farba textu bočného panela je povinná",
  updating_theme: "Aktualizácia témy",
  theme_updated_successfully: "Téma bola úspešne aktualizovaná",
  failed_to_update_the_theme: "Aktualizácia témy zlyhala",
  email_notifications: "E-mailové oznámenia",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "Majte prehľad o pracovných položkách, ktoré odoberáte. Aktivujte toto pre zasielanie oznámení.",
  email_notification_setting_updated_successfully: "Nastavenie e-mailových oznámení bolo úspešne aktualizované",
  failed_to_update_email_notification_setting: "Aktualizácia nastavenia e-mailových oznámení zlyhala",
  notify_me_when: "Upozorniť ma, keď",
  property_changes: "Zmeny vlastností",
  property_changes_description:
    "Upozorniť ma, keď sa zmenia vlastnosti pracovných položiek ako priradenie, priorita, odhady alebo čokoľvek iné.",
  state_change: "Zmena stavu",
  state_change_description: "Upozorniť ma, keď sa pracovná položka presunie do iného stavu",
  issue_completed: "Pracovná položka dokončená",
  issue_completed_description: "Upozorniť ma iba pri dokončení pracovnej položky",
  comments: "Komentáre",
  comments_description: "Upozorniť ma, keď niekto pridá komentár k pracovnej položke",
  mentions: "Zmienky",
  mentions_description: "Upozorniť ma iba, keď ma niekto spomenie v komentároch alebo popise",
  old_password: "Staré heslo",
  general_settings: "Všeobecné nastavenia",
  sign_out: "Odhlásiť sa",
  signing_out: "Odhlasovanie",
  active_cycles: "Aktívne cykly",
  active_cycles_description:
    "Sledujte cykly naprieč projektmi, monitorujte vysoko prioritné pracovné položky a zamerajte sa na cykly vyžadujúce pozornosť.",
  on_demand_snapshots_of_all_your_cycles: "Okamžité snapshoty všetkých vašich cyklov",
  upgrade: "Upgradovať",
  "10000_feet_view": "Pohľad z výšky 10 000 stôp na všetky aktívne cykly.",
  "10000_feet_view_description":
    "Priblížte si všetky prebiehajúce cykly naprieč všetkými projektmi naraz, namiesto prepínania medzi cyklami v každom projekte.",
  get_snapshot_of_each_active_cycle: "Získajte snapshot každého aktívneho cyklu.",
  get_snapshot_of_each_active_cycle_description:
    "Sledujte kľúčové metriky pre všetky aktívne cykly, zistite ich priebeh a porovnajte rozsah s termínmi.",
  compare_burndowns: "Porovnajte burndowny.",
  compare_burndowns_description: "Sledujte výkonnosť tímov prostredníctvom prehľadu burndown reportov každého cyklu.",
  quickly_see_make_or_break_issues: "Rýchlo zistite kľúčové pracovné položky.",
  quickly_see_make_or_break_issues_description:
    "Pozrite si vysoko prioritné pracovné položky pre každý cyklus vzhľadom na termíny. Zobrazte všetky jedným kliknutím.",
  zoom_into_cycles_that_need_attention: "Zamerajte sa na cykly vyžadujúce pozornosť.",
  zoom_into_cycles_that_need_attention_description:
    "Preskúmajte stav akéhokoľvek cyklu, ktorý nespĺňa očakávania, jedným kliknutím.",
  stay_ahead_of_blockers: "Buďte o krok pred prekážkami.",
  stay_ahead_of_blockers_description:
    "Identifikujte problémy medzi projektmi a zistite závislosti medzi cyklami, ktoré nie sú z iných pohľadov zrejmé.",
  analytics: "Analytika",
  workspace_invites: "Pozvánky do pracovného priestoru",
  enter_god_mode: "Vstúpiť do božského režimu",
  workspace_logo: "Logo pracovného priestoru",
  new_issue: "Nová pracovná položka",
  your_work: "Vaša práca",
  drafts: "Koncepty",
  projects: "Projekty",
  views: "Pohľady",
  workspace: "Pracovný priestor",
  archives: "Archívy",
  settings: "Nastavenia",
  failed_to_move_favorite: "Presunutie obľúbeného zlyhalo",
  favorites: "Obľúbené",
  no_favorites_yet: "Zatiaľ žiadne obľúbené",
  create_folder: "Vytvoriť priečinok",
  new_folder: "Nový priečinok",
  favorite_updated_successfully: "Obľúbené bolo úspešne aktualizované",
  favorite_created_successfully: "Obľúbené bolo úspešne vytvorené",
  folder_already_exists: "Priečinok už existuje",
  folder_name_cannot_be_empty: "Názov priečinka nemôže byť prázdny",
  something_went_wrong: "Niečo sa pokazilo",
  failed_to_reorder_favorite: "Zmena poradia obľúbeného zlyhala",
  favorite_removed_successfully: "Obľúbené bolo úspešne odstránené",
  failed_to_create_favorite: "Vytvorenie obľúbeného zlyhalo",
  failed_to_rename_favorite: "Premenovanie obľúbeného zlyhalo",
  project_link_copied_to_clipboard: "Odkaz na projekt bol skopírovaný do schránky",
  link_copied: "Odkaz skopírovaný",
  add_project: "Pridať projekt",
  create_project: "Vytvoriť projekt",
  failed_to_remove_project_from_favorites: "Nepodarilo sa odstrániť projekt z obľúbených. Skúste to prosím znova.",
  project_created_successfully: "Projekt bol úspešne vytvorený",
  project_created_successfully_description:
    "Projekt bol úspešne vytvorený. Teraz môžete začať pridávať pracovné položky.",
  project_name_already_taken: "Názov projektu je už použitý.",
  project_identifier_already_taken: "Identifikátor projektu je už použitý.",
  project_cover_image_alt: "Úvodný obrázok projektu",
  name_is_required: "Názov je povinný",
  title_should_be_less_than_255_characters: "Názov by mal byť kratší ako 255 znakov",
  project_name: "Názov projektu",
  project_id_must_be_at_least_1_character: "ID projektu musí mať aspoň 1 znak",
  project_id_must_be_at_most_5_characters: "ID projektu môže mať maximálne 5 znakov",
  project_id: "ID projektu",
  project_id_tooltip_content: "Pomáha jednoznačne identifikovať pracovné položky v projekte. Max. 10 znakov.",
  description_placeholder: "Popis",
  only_alphanumeric_non_latin_characters_allowed: "Sú povolené iba alfanumerické a nelatinské znaky.",
  project_id_is_required: "ID projektu je povinné",
  project_id_allowed_char: "Sú povolené iba alfanumerické a nelatinské znaky.",
  project_id_min_char: "ID projektu musí mať aspoň 1 znak",
  project_id_max_char: "ID projektu môže mať maximálne 10 znakov",
  project_description_placeholder: "Zadajte popis projektu",
  select_network: "Vybrať sieť",
  lead: "Vedúci",
  date_range: "Rozsah dát",
  private: "Súkromný",
  public: "Verejný",
  accessible_only_by_invite: "Prístupné iba na pozvanie",
  anyone_in_the_workspace_except_guests_can_join: "Ktokoľvek v pracovnom priestore okrem hostí sa môže pripojiť",
  creating: "Vytváranie",
  creating_project: "Vytváranie projektu",
  adding_project_to_favorites: "Pridávanie projektu do obľúbených",
  project_added_to_favorites: "Projekt pridaný do obľúbených",
  couldnt_add_the_project_to_favorites: "Nepodarilo sa pridať projekt do obľúbených. Skúste to prosím znova.",
  removing_project_from_favorites: "Odstraňovanie projektu z obľúbených",
  project_removed_from_favorites: "Projekt odstránený z obľúbených",
  couldnt_remove_the_project_from_favorites: "Nepodarilo sa odstrániť projekt z obľúbených. Skúste to prosím znova.",
  add_to_favorites: "Pridať do obľúbených",
  remove_from_favorites: "Odstrániť z obľúbených",
  publish_project: "Publikovať projekt",
  publish: "Publikovať",
  copy_link: "Kopírovať odkaz",
  leave_project: "Opustiť projekt",
  join_the_project_to_rearrange: "Pripojte sa k projektu pre zmenu usporiadania",
  drag_to_rearrange: "Pretiahnite pre usporiadanie",
  congrats: "Gratulujeme!",
  open_project: "Otvoriť projekt",
  issues: "Pracovné položky",
  cycles: "Cykly",
  modules: "Moduly",
  pages: "Stránky",
  intake: "Príjem",
  time_tracking: "Sledovanie času",
  work_management: "Správa práce",
  projects_and_issues: "Projekty a pracovné položky",
  projects_and_issues_description: "Aktivujte alebo deaktivujte tieto funkcie v projekte.",
  cycles_description:
    "Časovo ohraničte prácu podľa projektu a upravte obdobie podľa potreby. Jeden cyklus môže mať 2 týždne, ďalší 1 týždeň.",
  modules_description: "Organizujte prácu do podprojektov s určenými vedúcimi a priradenými osobami.",
  views_description: "Uložte vlastné triedenia, filtre a možnosti zobrazenia alebo ich zdieľajte so svojím tímom.",
  pages_description: "Vytvárajte a upravujte voľne štruktúrovaný obsah – poznámky, dokumenty, čokoľvek.",
  intake_description: "Umožnite nečlenom zdieľať chyby, spätnú väzbu a návrhy bez narušenia vášho pracovného postupu.",
  time_tracking_description: "Zaznamenajte čas strávený na pracovných položkách a projektoch.",
  work_management_description: "Spravujte svoju prácu a projekty jednoducho.",
  documentation: "Dokumentácia",
  message_support: "Kontaktovať podporu",
  contact_sales: "Kontaktovať predaj",
  hyper_mode: "Hyper režim",
  keyboard_shortcuts: "Klávesové skratky",
  whats_new: "Čo je nové?",
  version: "Verzia",
  we_are_having_trouble_fetching_the_updates: "Máme problém s načítaním aktualizácií.",
  our_changelogs: "naše zmenové protokoly",
  for_the_latest_updates: "pre najnovšie aktualizácie.",
  please_visit: "Navštívte",
  docs: "Dokumentáciu",
  full_changelog: "Úplný zmenový protokol",
  support: "Podpora",
  discord: "Discord",
  powered_by_plane_pages: "Poháňa Plane Pages",
  please_select_at_least_one_invitation: "Vyberte aspoň jednu pozvánku.",
  please_select_at_least_one_invitation_description:
    "Vyberte aspoň jednu pozvánku na pripojenie do pracovného priestoru.",
  we_see_that_someone_has_invited_you_to_join_a_workspace: "Vidíme, že vás niekto pozval do pracovného priestoru",
  join_a_workspace: "Pripojiť sa k pracovnému priestoru",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description:
    "Vidíme, že vás niekto pozval do pracovného priestoru",
  join_a_workspace_description: "Pripojiť sa k pracovnému priestoru",
  accept_and_join: "Prijať a pripojiť sa",
  go_home: "Domov",
  no_pending_invites: "Žiadne čakajúce pozvánky",
  you_can_see_here_if_someone_invites_you_to_a_workspace: "Tu uvidíte, ak vás niekto pozve do pracovného priestoru",
  back_to_home: "Späť na domovskú stránku",
  workspace_name: "názov-pracovného-priestoru",
  deactivate_your_account: "Deaktivovať váš účet",
  deactivate_your_account_description:
    "Po deaktivácii nebudete môcť byť priradení k pracovným položkám a nebude vám účtovaný poplatok za pracovný priestor. Na opätovnú aktiváciu účtu budete potrebovať pozvánku do pracovného priestoru na tento e-mail.",
  deactivating: "Deaktivácia",
  confirm: "Potvrdiť",
  confirming: "Potvrdzovanie",
  draft_created: "Koncept vytvorený",
  issue_created_successfully: "Pracovná položka bola úspešne vytvorená",
  draft_creation_failed: "Vytvorenie konceptu zlyhalo",
  issue_creation_failed: "Vytvorenie pracovnej položky zlyhalo",
  draft_issue: "Koncept pracovnej položky",
  issue_updated_successfully: "Pracovná položka bola úspešne aktualizovaná",
  issue_could_not_be_updated: "Aktualizácia pracovnej položky zlyhala",
  create_a_draft: "Vytvoriť koncept",
  save_to_drafts: "Uložiť do konceptov",
  save: "Uložiť",
  update: "Aktualizovať",
  updating: "Aktualizácia",
  create_new_issue: "Vytvoriť novú pracovnú položku",
  editor_is_not_ready_to_discard_changes: "Editor nie je pripravený zahodiť zmeny",
  failed_to_move_issue_to_project: "Presunutie pracovnej položky do projektu zlyhalo",
  create_more: "Vytvoriť viac",
  add_to_project: "Pridať do projektu",
  discard: "Zahodiť",
  duplicate_issue_found: "Nájdená duplicitná pracovná položka",
  duplicate_issues_found: "Nájdené duplicitné pracovné položky",
  no_matching_results: "Žiadne zodpovedajúce výsledky",
  title_is_required: "Názov je povinný",
  title: "Názov",
  state: "Stav",
  priority: "Priorita",
  none: "Žiadna",
  urgent: "Naliehavá",
  high: "Vysoká",
  medium: "Stredná",
  low: "Nízka",
  members: "Členovia",
  assignee: "Priradené",
  assignees: "Priradení",
  you: "Vy",
  labels: "Štítky",
  create_new_label: "Vytvoriť nový štítok",
  start_date: "Dátum začiatku",
  end_date: "Dátum ukončenia",
  due_date: "Termín",
  estimate: "Odhad",
  change_parent_issue: "Zmeniť nadradenú pracovnú položku",
  remove_parent_issue: "Odstrániť nadradenú pracovnú položku",
  add_parent: "Pridať nadradenú",
  loading_members: "Načítavam členov",
  view_link_copied_to_clipboard: "Odkaz na pohľad bol skopírovaný do schránky.",
  required: "Povinné",
  optional: "Voliteľné",
  Cancel: "Zrušiť",
  edit: "Upraviť",
  archive: "Archivovať",
  restore: "Obnoviť",
  open_in_new_tab: "Otvoriť na novej karte",
  delete: "Zmazať",
  deleting: "Mazanie",
  make_a_copy: "Vytvoriť kópiu",
  move_to_project: "Presunúť do projektu",
  good: "Dobrý",
  morning: "ráno",
  afternoon: "popoludnie",
  evening: "večer",
  show_all: "Zobraziť všetko",
  show_less: "Zobraziť menej",
  no_data_yet: "Zatiaľ žiadne dáta",
  syncing: "Synchronizácia",
  add_work_item: "Pridať pracovnú položku",
  advanced_description_placeholder: "Stlačte '/' pre príkazy",
  create_work_item: "Vytvoriť pracovnú položku",
  attachments: "Prílohy",
  declining: "Odmietanie",
  declined: "Odmietnuté",
  decline: "Odmietnuť",
  unassigned: "Nepriradené",
  work_items: "Pracovné položky",
  add_link: "Pridať odkaz",
  points: "Body",
  no_assignee: "Žiadne priradenie",
  no_assignees_yet: "Zatiaľ žiadni priradení",
  no_labels_yet: "Zatiaľ žiadne štítky",
  ideal: "Ideálne",
  current: "Aktuálne",
  no_matching_members: "Žiadni zodpovedajúci členovia",
  leaving: "Opúšťanie",
  removing: "Odstraňovanie",
  leave: "Opustiť",
  refresh: "Obnoviť",
  refreshing: "Obnovovanie",
  refresh_status: "Obnoviť stav",
  prev: "Predchádzajúci",
  next: "Ďalší",
  re_generating: "Znova generovanie",
  re_generate: "Znova generovať",
  re_generate_key: "Znova generovať kľúč",
  export: "Exportovať",
  member: "{count, plural, one{# člen} few{# členovia} other{# členov}}",
  new_password_must_be_different_from_old_password: "Nové heslo musí byť odlišné od starého hesla",
  edited: "Upravené",
  bot: "Bot",
  project_view: {
    sort_by: {
      created_at: "Vytvorené dňa",
      updated_at: "Aktualizované dňa",
      name: "Názov",
    },
  },
  toast: {
    success: "Úspech!",
    error: "Chyba!",
  },
  links: {
    toasts: {
      created: {
        title: "Odkaz vytvorený",
        message: "Odkaz bol úspešne vytvorený",
      },
      not_created: {
        title: "Odkaz nebol vytvorený",
        message: "Odkaz sa nepodarilo vytvoriť",
      },
      updated: {
        title: "Odkaz aktualizovaný",
        message: "Odkaz bol úspešne aktualizovaný",
      },
      not_updated: {
        title: "Odkaz nebol aktualizovaný",
        message: "Odkaz sa nepodarilo aktualizovať",
      },
      removed: {
        title: "Odkaz odstránený",
        message: "Odkaz bol úspešne odstránený",
      },
      not_removed: {
        title: "Odkaz nebol odstránený",
        message: "Odkaz sa nepodarilo odstrániť",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "Váš sprievodca rýchlym štartom",
      not_right_now: "Teraz nie",
      create_project: {
        title: "Vytvoriť projekt",
        description: "Väčšina vecí začína projektom v Plane.",
        cta: "Začať",
      },
      invite_team: {
        title: "Pozvať tím",
        description: "Spolupracujte s kolegami na tvorbe, dodávkach a správe.",
        cta: "Pozvať ich",
      },
      configure_workspace: {
        title: "Nastavte si svoj pracovný priestor.",
        description: "Aktivujte alebo deaktivujte funkcie alebo choďte ďalej.",
        cta: "Konfigurovať tento priestor",
      },
      personalize_account: {
        title: "Prispôsobte si Plane.",
        description: "Vyberte si obrázok, farby a ďalšie.",
        cta: "Prispôsobiť teraz",
      },
      widgets: {
        title: "Je ticho bez widgetov, zapnite ich",
        description: "Vyzerá to, že všetky vaše widgety sú vypnuté. Zapnite ich\npre lepší zážitok!",
        primary_button: {
          text: "Spravovať widgety",
        },
      },
    },
    quick_links: {
      empty: "Uložte si odkazy na dôležité veci, ktoré chcete mať po ruke.",
      add: "Pridať rýchly odkaz",
      title: "Rýchly odkaz",
      title_plural: "Rýchle odkazy",
    },
    recents: {
      title: "Nedávne",
      empty: {
        project: "Vaše nedávne projekty sa zobrazia po návšteve.",
        page: "Vaše nedávne stránky sa zobrazia po návšteve.",
        issue: "Vaše nedávne pracovné položky sa zobrazia po návšteve.",
        default: "Zatiaľ nemáte žiadne nedávne položky.",
      },
      filters: {
        all: "Všetko",
        projects: "Projekty",
        pages: "Stránky",
        issues: "Pracovné položky",
      },
    },
    new_at_plane: {
      title: "Novinky v Plane",
    },
    quick_tutorial: {
      title: "Rýchly tutoriál",
    },
    widget: {
      reordered_successfully: "Widget bol úspešne presunutý.",
      reordering_failed: "Pri presúvaní widgetu došlo k chybe.",
    },
    manage_widgets: "Spravovať widgety",
    title: "Domov",
    star_us_on_github: "Ohodnoťte nás na GitHube",
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "URL je neplatná",
        placeholder: "Zadajte alebo vložte URL",
      },
      title: {
        text: "Zobrazovaný názov",
        placeholder: "Ako chcete tento odkaz vidieť",
      },
    },
  },
  common: {
    all: "Všetko",
    no_items_in_this_group: "V tejto skupine nie sú žiadne položky",
    drop_here_to_move: "Presuňte sem na presunutie",
    states: "Stavy",
    state: "Stav",
    state_groups: "Skupiny stavov",
    state_group: "Skupina stavov",
    priorities: "Priority",
    priority: "Priorita",
    team_project: "Tímový projekt",
    project: "Projekt",
    cycle: "Cyklus",
    cycles: "Cykly",
    module: "Modul",
    modules: "Moduly",
    labels: "Štítky",
    label: "Štítok",
    assignees: "Priradení",
    assignee: "Priradené",
    created_by: "Vytvoril",
    none: "Žiadne",
    link: "Odkaz",
    estimates: "Odhady",
    estimate: "Odhad",
    created_at: "Vytvorené dňa",
    completed_at: "Dokončené dňa",
    layout: "Rozloženie",
    filters: "Filtre",
    display: "Zobrazenie",
    load_more: "Načítať viac",
    activity: "Aktivita",
    analytics: "Analytika",
    dates: "Dáta",
    success: "Úspech!",
    something_went_wrong: "Niečo sa pokazilo",
    error: {
      label: "Chyba!",
      message: "Došlo k chybe. Skúste to prosím znova.",
    },
    group_by: "Zoskupiť podľa",
    epic: "Epika",
    epics: "Epiky",
    work_item: "Pracovná položka",
    work_items: "Pracovné položky",
    sub_work_item: "Podriadená pracovná položka",
    add: "Pridať",
    warning: "Varovanie",
    updating: "Aktualizácia",
    adding: "Pridávanie",
    update: "Aktualizovať",
    creating: "Vytváranie",
    create: "Vytvoriť",
    cancel: "Zrušiť",
    description: "Popis",
    title: "Názov",
    attachment: "Príloha",
    general: "Všeobecné",
    features: "Funkcie",
    automation: "Automatizácia",
    project_name: "Názov projektu",
    project_id: "ID projektu",
    project_timezone: "Časové pásmo projektu",
    created_on: "Vytvorené dňa",
    update_project: "Aktualizovať projekt",
    identifier_already_exists: "Identifikátor už existuje",
    add_more: "Pridať viac",
    defaults: "Predvolené",
    add_label: "Pridať štítok",
    customize_time_range: "Prispôsobiť časový rozsah",
    loading: "Načítavanie",
    attachments: "Prílohy",
    property: "Vlastnosť",
    properties: "Vlastnosti",
    parent: "Nadradený",
    page: "Stránka",
    remove: "Odstrániť",
    archiving: "Archivovanie",
    archive: "Archivovať",
    access: {
      public: "Verejný",
      private: "Súkromný",
    },
    done: "Hotovo",
    sub_work_items: "Podriadené pracovné položky",
    comment: "Komentár",
    workspace_level: "Úroveň pracovného priestoru",
    order_by: {
      label: "Triediť podľa",
      manual: "Manuálne",
      last_created: "Naposledy vytvorené",
      last_updated: "Naposledy aktualizované",
      start_date: "Dátum začiatku",
      due_date: "Termín",
      asc: "Vzostupne",
      desc: "Zostupne",
      updated_on: "Aktualizované dňa",
    },
    sort: {
      asc: "Vzostupne",
      desc: "Zostupne",
      created_on: "Vytvorené dňa",
      updated_on: "Aktualizované dňa",
    },
    comments: "Komentáre",
    updates: "Aktualizácie",
    clear_all: "Vymazať všetko",
    copied: "Skopírované!",
    link_copied: "Odkaz skopírovaný!",
    link_copied_to_clipboard: "Odkaz skopírovaný do schránky",
    copied_to_clipboard: "Odkaz na pracovnú položku bol skopírovaný do schránky",
    is_copied_to_clipboard: "Pracovná položka skopírovaná do schránky",
    no_links_added_yet: "Zatiaľ neboli pridané žiadne odkazy",
    add_link: "Pridať odkaz",
    links: "Odkazy",
    go_to_workspace: "Prejsť do pracovného priestoru",
    progress: "Pokrok",
    optional: "Voliteľné",
    join: "Pripojiť sa",
    go_back: "Späť",
    continue: "Pokračovať",
    resend: "Znova odoslať",
    relations: "Vzťahy",
    errors: {
      default: {
        title: "Chyba!",
        message: "Niečo sa pokazilo. Skúste to prosím znova.",
      },
      required: "Toto pole je povinné",
      entity_required: "{entity} je povinná",
      restricted_entity: "{entity} je obmedzený",
    },
    update_link: "Aktualizovať odkaz",
    attach: "Pripojiť",
    create_new: "Vytvoriť nový",
    add_existing: "Pridať existujúci",
    type_or_paste_a_url: "Zadajte alebo vložte URL",
    url_is_invalid: "URL je neplatná",
    display_title: "Zobrazovaný názov",
    link_title_placeholder: "Ako chcete tento odkaz vidieť",
    url: "URL",
    side_peek: "Bočný náhľad",
    modal: "Modálne okno",
    full_screen: "Celá obrazovka",
    close_peek_view: "Zatvoriť náhľad",
    toggle_peek_view_layout: "Prepnúť rozloženie náhľadu",
    options: "Možnosti",
    duration: "Trvanie",
    today: "Dnes",
    week: "Týždeň",
    month: "Mesiac",
    quarter: "Kvartál",
    press_for_commands: "Stlačte '/' pre príkazy",
    click_to_add_description: "Kliknite pre pridanie popisu",
    search: {
      label: "Hľadať",
      placeholder: "Zadajte hľadaný výraz",
      no_matches_found: "Nenašli sa žiadne zhody",
      no_matching_results: "Žiadne zodpovedajúce výsledky",
    },
    actions: {
      edit: "Upraviť",
      make_a_copy: "Vytvoriť kópiu",
      open_in_new_tab: "Otvoriť na novej karte",
      copy_link: "Kopírovať odkaz",
      archive: "Archivovať",
      restore: "Obnoviť",
      delete: "Zmazať",
      remove_relation: "Odstrániť vzťah",
      subscribe: "Odoberať",
      unsubscribe: "Zrušiť odber",
      clear_sorting: "Vymazať triedenie",
      show_weekends: "Zobraziť víkendy",
      enable: "Povoliť",
      disable: "Zakázať",
    },
    name: "Názov",
    discard: "Zahodiť",
    confirm: "Potvrdiť",
    confirming: "Potvrdzovanie",
    read_the_docs: "Prečítajte si dokumentáciu",
    default: "Predvolené",
    active: "Aktívne",
    enabled: "Povolené",
    disabled: "Zakázané",
    mandate: "Mandát",
    mandatory: "Povinné",
    yes: "Áno",
    no: "Nie",
    please_wait: "Prosím čakajte",
    enabling: "Povoľovanie",
    disabling: "Zakazovanie",
    beta: "Beta",
    or: "alebo",
    next: "Ďalej",
    back: "Späť",
    cancelling: "Rušenie",
    configuring: "Konfigurácia",
    clear: "Vymazať",
    import: "Importovať",
    connect: "Pripojiť",
    authorizing: "Autorizácia",
    processing: "Spracovanie",
    no_data_available: "Nie sú k dispozícii žiadne dáta",
    from: "od {name}",
    authenticated: "Overené",
    select: "Vybrať",
    upgrade: "Upgradovať",
    add_seats: "Pridať miesta",
    projects: "Projekty",
    workspace: "Pracovný priestor",
    workspaces: "Pracovné priestory",
    team: "Tím",
    teams: "Tímy",
    entity: "Entita",
    entities: "Entity",
    task: "Úloha",
    tasks: "Úlohy",
    section: "Sekcia",
    sections: "Sekcie",
    edit: "Upraviť",
    connecting: "Pripájanie",
    connected: "Pripojené",
    disconnect: "Odpojiť",
    disconnecting: "Odpájanie",
    installing: "Inštalácia",
    install: "Nainštalovať",
    reset: "Resetovať",
    live: "Živé",
    change_history: "História zmien",
    coming_soon: "Už čoskoro",
    member: "Člen",
    members: "Členovia",
    you: "Vy",
    upgrade_cta: {
      higher_subscription: "Upgradovať na vyššie predplatné",
      talk_to_sales: "Porozprávajte sa s predajom",
    },
    category: "Kategória",
    categories: "Kategórie",
    saving: "Ukladanie",
    save_changes: "Uložiť zmeny",
    delete: "Zmazať",
    deleting: "Mazanie",
    pending: "Čakajúce",
    invite: "Pozvať",
    view: "Zobraziť",
    deactivated_user: "Deaktivovaný používateľ",
    apply: "Použiť",
    applying: "Používanie",
    users: "Používatelia",
    admins: "Administrátori",
    guests: "Hostia",
    on_track: "Na správnej ceste",
    off_track: "Mimo plán",
    at_risk: "V ohrození",
    timeline: "Časová os",
    completion: "Dokončenie",
    upcoming: "Nadchádzajúce",
    completed: "Dokončené",
    in_progress: "Prebieha",
    planned: "Plánované",
    paused: "Pozastavené",
    no_of: "Počet {entity}",
    resolved: "Vyriešené",
  },
  chart: {
    x_axis: "Os X",
    y_axis: "Os Y",
    metric: "Metrika",
  },
  form: {
    title: {
      required: "Názov je povinný",
      max_length: "Názov by mal byť kratší ako {length} znakov",
    },
  },
  entity: {
    grouping_title: "Zoskupenie {entity}",
    priority: "Priorita {entity}",
    all: "Všetky {entity}",
    drop_here_to_move: "Pretiahnite sem pre presunutie {entity}",
    delete: {
      label: "Zmazať {entity}",
      success: "{entity} bola úspešne zmazaná",
      failed: "Mazanie {entity} zlyhalo",
    },
    update: {
      failed: "Aktualizácia {entity} zlyhala",
      success: "{entity} bola úspešne aktualizovaná",
    },
    link_copied_to_clipboard: "Odkaz na {entity} bol skopírovaný do schránky",
    fetch: {
      failed: "Chyba pri načítaní {entity}",
    },
    add: {
      success: "{entity} bola úspešne pridaná",
      failed: "Chyba pri pridávaní {entity}",
    },
    remove: {
      success: "{entity} bola úspešne odstránená",
      failed: "Chyba pri odstrávaní {entity}",
    },
  },
  epic: {
    all: "Všetky epiky",
    label: "{count, plural, one {Epika} few {Epiky} other {Epík}}",
    new: "Nová epika",
    adding: "Pridávam epiku",
    create: {
      success: "Epika bola úspešne vytvorená",
    },
    add: {
      press_enter: "Pre pridanie ďalšej epiky stlačte 'Enter'",
      label: "Pridať epiku",
    },
    title: {
      label: "Názov epiky",
      required: "Názov epiky je povinný.",
    },
  },
  issue: {
    label: "{count, plural, one {Pracovná položka} few {Pracovné položky} other {Pracovných položiek}}",
    all: "Všetky pracovné položky",
    edit: "Upraviť pracovnú položku",
    title: {
      label: "Názov pracovnej položky",
      required: "Názov pracovnej položky je povinný.",
    },
    add: {
      press_enter: "Stlačte 'Enter' pre pridanie ďalšej pracovnej položky",
      label: "Pridať pracovnú položku",
      cycle: {
        failed: "Pridanie pracovnej položky do cyklu zlyhalo. Skúste to prosím znova.",
        success:
          "{count, plural, one {Pracovná položka} few {Pracovné položky} other {Pracovných položiek}} pridaná do cyklu.",
        loading:
          "Pridávanie {count, plural, one {pracovnej položky} few {pracovných položiek} other {pracovných položiek}} do cyklu",
      },
      assignee: "Pridať priradených",
      start_date: "Pridať dátum začiatku",
      due_date: "Pridať termín",
      parent: "Pridať nadradenú pracovnú položku",
      sub_issue: "Pridať podriadenú pracovnú položku",
      relation: "Pridať vzťah",
      link: "Pridať odkaz",
      existing: "Pridať existujúcu pracovnú položku",
    },
    remove: {
      label: "Odstrániť pracovnú položku",
      cycle: {
        loading: "Odstraňovanie pracovnej položky z cyklu",
        success: "Pracovná položka odstránená z cyklu.",
        failed: "Odstránenie pracovnej položky z cyklu zlyhalo. Skúste to prosím znova.",
      },
      module: {
        loading: "Odstraňovanie pracovnej položky z modulu",
        success: "Pracovná položka odstránená z modulu.",
        failed: "Odstránenie pracovnej položky z modulu zlyhalo. Skúste to prosím znova.",
      },
      parent: {
        label: "Odstrániť nadradenú pracovnú položku",
      },
    },
    new: "Nová pracovná položka",
    adding: "Pridávanie pracovnej položky",
    create: {
      success: "Pracovná položka bola úspešne vytvorená",
    },
    priority: {
      urgent: "Naliehavá",
      high: "Vysoká",
      medium: "Stredná",
      low: "Nízka",
    },
    display: {
      properties: {
        label: "Zobrazované vlastnosti",
        id: "ID",
        issue_type: "Typ pracovnej položky",
        sub_issue_count: "Počet podriadených položiek",
        attachment_count: "Počet príloh",
        created_on: "Vytvorené dňa",
        sub_issue: "Podriadená položka",
        work_item_count: "Počet pracovných položiek",
      },
      extra: {
        show_sub_issues: "Zobraziť podriadené položky",
        show_empty_groups: "Zobraziť prázdne skupiny",
      },
    },
    layouts: {
      ordered_by_label: "Toto rozloženie je triedené podľa",
      list: "Zoznam",
      kanban: "Nástenka",
      calendar: "Kalendár",
      spreadsheet: "Tabuľka",
      gantt: "Časová os",
      title: {
        list: "Zoznamové rozloženie",
        kanban: "Nástenkové rozloženie",
        calendar: "Kalendárové rozloženie",
        spreadsheet: "Tabuľkové rozloženie",
        gantt: "Rozloženie časovej osi",
      },
    },
    states: {
      active: "Aktívne",
      backlog: "Backlog",
    },
    comments: {
      placeholder: "Pridať komentár",
      switch: {
        private: "Prepnúť na súkromný komentár",
        public: "Prepnúť na verejný komentár",
      },
      create: {
        success: "Komentár bol úspešne vytvorený",
        error: "Vytvorenie komentára zlyhalo. Skúste to prosím neskôr.",
      },
      update: {
        success: "Komentár bol úspešne aktualizovaný",
        error: "Aktualizácia komentára zlyhala. Skúste to prosím neskôr.",
      },
      remove: {
        success: "Komentár bol úspešne odstránený",
        error: "Odstránenie komentára zlyhalo. Skúste to prosím neskôr.",
      },
      upload: {
        error: "Nahratie prílohy zlyhalo. Skúste to prosím neskôr.",
      },
      copy_link: {
        success: "Odkaz na komentár bol skopírovaný do schránky",
        error: "Chyba pri kopírovaní odkazu na komentár. Skúste to prosím neskôr.",
      },
    },
    empty_state: {
      issue_detail: {
        title: "Pracovná položka neexistuje",
        description: "Pracovná položka, ktorú hľadáte, neexistuje, bola archivovaná alebo zmazaná.",
        primary_button: {
          text: "Zobraziť ďalšie pracovné položky",
        },
      },
    },
    sibling: {
      label: "Súvisiace pracovné položky",
    },
    archive: {
      description: "Archivovať je možné iba dokončené alebo zrušené\npracovné položky",
      label: "Archivovať pracovnú položku",
      confirm_message:
        "Naozaj chcete archivovať túto pracovnú položku? Všetky archivované položky je možné neskôr obnoviť.",
      success: {
        label: "Archivácia úspešná",
        message: "Vaše archívy nájdete v archívoch projektu.",
      },
      failed: {
        message: "Archivácia pracovnej položky zlyhala. Skúste to prosím znova.",
      },
    },
    restore: {
      success: {
        title: "Obnovenie úspešné",
        message: "Vaša pracovná položka je na nájdenie v pracovných položkách projektu.",
      },
      failed: {
        message: "Obnovenie pracovnej položky zlyhalo. Skúste to prosím znova.",
      },
    },
    relation: {
      relates_to: "Súvisiace s",
      duplicate: "Duplikát",
      blocked_by: "Blokované",
      blocking: "Blokujúce",
    },
    copy_link: "Kopírovať odkaz na pracovnú položku",
    delete: {
      label: "Zmazať pracovnú položku",
      error: "Chyba pri mazaní pracovnej položky",
    },
    subscription: {
      actions: {
        subscribed: "Pracovná položka úspešne prihlásená na odber",
        unsubscribed: "Odber pracovnej položky zrušený",
      },
    },
    select: {
      error: "Vyberte aspoň jednu pracovnú položku",
      empty: "Nie sú vybrané žiadne pracovné položky",
      add_selected: "Pridať vybrané pracovné položky",
      select_all: "Vybrať všetko",
      deselect_all: "Zrušiť výber všetkého",
    },
    open_in_full_screen: "Otvoriť pracovnú položku na celú obrazovku",
  },
  attachment: {
    error: "Súbor sa nedá pripojiť. Skúste to prosím znova.",
    only_one_file_allowed: "Je možné nahrať iba jeden súbor naraz.",
    file_size_limit: "Súbor musí byť menší ako {size}MB.",
    drag_and_drop: "Pretiahnite súbor kamkoľvek pre nahratie",
    delete: "Zmazať prílohu",
  },
  label: {
    select: "Vybrať štítok",
    create: {
      success: "Štítok bol úspešne vytvorený",
      failed: "Vytvorenie štítka zlyhalo",
      already_exists: "Štítok už existuje",
      type: "Zadajte pre vytvorenie nového štítka",
    },
  },
  sub_work_item: {
    update: {
      success: "Podriadená pracovná položka bola úspešne aktualizovaná",
      error: "Chyba pri aktualizácii podriadenej položky",
    },
    remove: {
      success: "Podriadená pracovná položka bola úspešne odstránená",
      error: "Chyba pri odstraňovaní podriadenej položky",
    },
    empty_state: {
      sub_list_filters: {
        title: "Nemáte podriadené pracovné položky, ktoré zodpovedajú použitým filtrom.",
        description: "Pre zobrazenie všetkých podriadených pracovných položiek vymažte všetky použité filtre.",
        action: "Vymazať filtre",
      },
      list_filters: {
        title: "Nemáte pracovné položky, ktoré zodpovedajú použitým filtrom.",
        description: "Pre zobrazenie všetkých pracovných položiek vymažte všetky použité filtre.",
        action: "Vymazať filtre",
      },
    },
  },
  view: {
    label: "{count, plural, one {Pohľad} few {Pohľady} other {Pohľadov}}",
    create: {
      label: "Vytvoriť pohľad",
    },
    update: {
      label: "Aktualizovať pohľad",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "Čakajúce",
        description: "Čakajúce",
      },
      declined: {
        title: "Odmietnuté",
        description: "Odmietnuté",
      },
      snoozed: {
        title: "Odložené",
        description: "Zostáva {days, plural, one{# deň} few{# dni} other{# dní}}",
      },
      accepted: {
        title: "Prijaté",
        description: "Prijaté",
      },
      duplicate: {
        title: "Duplikát",
        description: "Duplikát",
      },
    },
    modals: {
      decline: {
        title: "Odmietnuť pracovnú položku",
        content: "Naozaj chcete odmietnuť pracovnú položku {value}?",
      },
      delete: {
        title: "Zmazať pracovnú položku",
        content: "Naozaj chcete zmazať pracovnú položku {value}?",
        success: "Pracovná položka bola úspešne zmazaná",
      },
    },
    errors: {
      snooze_permission: "Iba správcovia projektu môžu odkladať/zrušiť odloženie pracovných položiek",
      accept_permission: "Iba správcovia projektu môžu prijímať pracovné položky",
      decline_permission: "Iba správcovia projektu môžu odmietnuť pracovné položky",
    },
    actions: {
      accept: "Prijať",
      decline: "Odmietnuť",
      snooze: "Odložiť",
      unsnooze: "Zrušiť odloženie",
      copy: "Kopírovať odkaz na pracovnú položku",
      delete: "Zmazať",
      open: "Otvoriť pracovnú položku",
      mark_as_duplicate: "Označiť ako duplikát",
      move: "Presunúť {value} do pracovných položiek projektu",
    },
    source: {
      "in-app": "v aplikácii",
    },
    order_by: {
      created_at: "Vytvorené dňa",
      updated_at: "Aktualizované dňa",
      id: "ID",
    },
    label: "Príjem",
    page_label: "{workspace} - Príjem",
    modal: {
      title: "Vytvoriť prijatú pracovnú položku",
    },
    tabs: {
      open: "Otvorené",
      closed: "Uzavreté",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "Žiadne otvorené pracovné položky",
        description: "Tu nájdete otvorené pracovné položky. Vytvorte novú.",
      },
      sidebar_closed_tab: {
        title: "Žiadne uzavreté pracovné položky",
        description: "Všetky prijaté alebo odmietnuté pracovné položky nájdete tu.",
      },
      sidebar_filter: {
        title: "Žiadne zodpovedajúce pracovné položky",
        description: "Žiadna položka nezodpovedá filtru v príjme. Vytvorte novú.",
      },
      detail: {
        title: "Vyberte pracovnú položku pre zobrazenie detailov.",
      },
    },
  },
  workspace_creation: {
    heading: "Vytvorte si pracovný priestor",
    subheading: "Na používanie Plane musíte vytvoriť alebo sa pripojiť k pracovnému priestoru.",
    form: {
      name: {
        label: "Pomenujte svoj pracovný priestor",
        placeholder: "Vhodné je použiť niečo známe a rozpoznateľné.",
      },
      url: {
        label: "Nastavte URL vášho priestoru",
        placeholder: "Zadajte alebo vložte URL",
        edit_slug: "Môžete upraviť iba časť URL (slug)",
      },
      organization_size: {
        label: "Koľko ľudí bude tento priestor používať?",
        placeholder: "Vyberte rozsah",
      },
    },
    errors: {
      creation_disabled: {
        title: "Len správca inštancie môže vytvárať pracovné priestory",
        description: "Ak poznáte e-mail správcu inštancie, kliknite na tlačidlo nižšie pre kontakt.",
        request_button: "Požiadať správcu inštancie",
      },
      validation: {
        name_alphanumeric: "Názvy pracovných priestorov môžu obsahovať iba (' '), ('-'), ('_') a alfanumerické znaky.",
        name_length: "Názov je obmedzený na 80 znakov.",
        url_alphanumeric: "URL môžu obsahovať iba ('-') a alfanumerické znaky.",
        url_length: "URL je obmedzená na 48 znakov.",
        url_already_taken: "URL pracovného priestoru je už obsadená!",
      },
    },
    request_email: {
      subject: "Žiadosť o nový pracovný priestor",
      body: "Ahoj správca,\n\nProsím, vytvor nový pracovný priestor s URL [/workspace-name] pre [účel vytvorenia].\n\nVďaka,\n{firstName} {lastName}\n{email}",
    },
    button: {
      default: "Vytvoriť pracovný priestor",
      loading: "Vytváranie pracovného priestoru",
    },
    toast: {
      success: {
        title: "Úspech",
        message: "Pracovný priestor bol úspešne vytvorený",
      },
      error: {
        title: "Chyba",
        message: "Vytvorenie pracovného priestoru zlyhalo. Skúste to prosím znova.",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "Prehľad projektov, aktivít a metrík",
        description:
          "Vitajte v Plane, teší nás, že ste tu. Vytvorte prvý projekt, sledujte pracovné položky a táto stránka sa zmení na priestor pre váš pokrok. Správcovia tu uvidia aj položky pomáhajúce tímu.",
        primary_button: {
          text: "Vytvorte prvý projekt",
          comic: {
            title: "Všetko začína projektom v Plane",
            description: "Projektom môže byť roadmapa produktu, marketingová kampaň alebo uvedenie nového auta.",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "Analytika",
    page_label: "{workspace} - Analytika",
    open_tasks: "Celkovo otvorených úloh",
    error: "Pri načítaní dát došlo k chybe.",
    work_items_closed_in: "Pracovné položky uzavreté v",
    selected_projects: "Vybrané projekty",
    total_members: "Celkovo členov",
    total_cycles: "Celkovo cyklov",
    total_modules: "Celkovo modulov",
    pending_work_items: {
      title: "Čakajúce pracovné položky",
      empty_state: "Tu sa zobrazí analýza čakajúcich položiek podľa spolupracovníkov.",
    },
    work_items_closed_in_a_year: {
      title: "Pracovné položky uzavreté v roku",
      empty_state: "Uzatvárajte položky, aby ste videli analýzu stavov v grafe.",
    },
    most_work_items_created: {
      title: "Najviac vytvorených položiek",
      empty_state: "Zobrazia sa spolupracovníci a počet nimi vytvorených položiek.",
    },
    most_work_items_closed: {
      title: "Najviac uzavretých položiek",
      empty_state: "Zobrazia sa spolupracovníci a počet nimi uzavretých položiek.",
    },
    tabs: {
      scope_and_demand: "Rozsah a dopyt",
      custom: "Vlastná analytika",
    },
    empty_state: {
      customized_insights: {
        description: "Pracovné položky priradené vám, rozdelené podľa stavu, sa zobrazia tu.",
        title: "Zatiaľ žiadne údaje",
      },
      created_vs_resolved: {
        description: "Pracovné položky vytvorené a vyriešené v priebehu času sa zobrazia tu.",
        title: "Zatiaľ žiadne údaje",
      },
      project_insights: {
        title: "Zatiaľ žiadne údaje",
        description: "Pracovné položky priradené vám, rozdelené podľa stavu, sa zobrazia tu.",
      },
      general: {
        title:
          "Sledujte pokrok, pracovné zaťaženie a alokácie. Identifikujte trendy, odstráňte prekážky a urýchlite prácu",
        description:
          "Porovnávajte rozsah s dopytom, odhady a rozširovanie rozsahu. Získajte výkonnosť podľa členov tímu a tímov, a uistite sa, že váš projekt beží načas.",
        primary_button: {
          text: "Začnite svoj prvý projekt",
          comic: {
            title: "Analytika funguje najlepšie s Cyklami + Modulmi",
            description:
              "Najprv časovo ohraničte svoje problémy do Cyklov a, ak môžete, zoskupte problémy, ktoré trvajú viac ako jeden cyklus, do Modulov. Pozrite si oboje v ľavej navigácii.",
          },
        },
      },
    },
    created_vs_resolved: "Vytvorené vs Vyriešené",
    customized_insights: "Prispôsobené prehľady",
    backlog_work_items: "{entity} v backlogu",
    active_projects: "Aktívne projekty",
    trend_on_charts: "Trend na grafoch",
    all_projects: "Všetky projekty",
    summary_of_projects: "Súhrn projektov",
    project_insights: "Prehľad projektu",
    started_work_items: "Spustené {entity}",
    total_work_items: "Celkový počet {entity}",
    total_projects: "Celkový počet projektov",
    total_admins: "Celkový počet administrátorov",
    total_users: "Celkový počet používateľov",
    total_intake: "Celkový príjem",
    un_started_work_items: "Nespustené {entity}",
    total_guests: "Celkový počet hostí",
    completed_work_items: "Dokončené {entity}",
    total: "Celkový počet {entity}",
  },
  workspace_projects: {
    label: "{count, plural, one {Projekt} few {Projekty} other {Projektov}}",
    create: {
      label: "Pridať projekt",
    },
    network: {
      label: "Sieť",
      private: {
        title: "Súkromný",
        description: "Prístupné iba na pozvanie",
      },
      public: {
        title: "Verejný",
        description: "Ktokoľvek v priestore okrem hostí sa môže pripojiť",
      },
    },
    error: {
      permission: "Nemáte oprávnenie na túto akciu.",
      cycle_delete: "Odstránenie cyklu zlyhalo",
      module_delete: "Odstránenie modulu zlyhalo",
      issue_delete: "Odstránenie pracovnej položky zlyhalo",
    },
    state: {
      backlog: "Backlog",
      unstarted: "Nezačaté",
      started: "Začaté",
      completed: "Dokončené",
      cancelled: "Zrušené",
    },
    sort: {
      manual: "Manuálne",
      name: "Názov",
      created_at: "Dátum vytvorenia",
      members_length: "Počet členov",
    },
    scope: {
      my_projects: "Moje projekty",
      archived_projects: "Archivované",
    },
    common: {
      months_count: "{months, plural, one{# mesiac} few{# mesiace} other{# mesiacov}}",
    },
    empty_state: {
      general: {
        title: "Žiadne aktívne projekty",
        description:
          "Projekt je nadradený cieľom. Projekty obsahujú Úlohy, Cykly a Moduly. Vytvorte nový alebo filtrujte archivované.",
        primary_button: {
          text: "Začnite prvý projekt",
          comic: {
            title: "Všetko začína projektom v Plane",
            description: "Projektom môže byť roadmapa produktu, marketingová kampaň alebo uvedenie nového auta.",
          },
        },
      },
      no_projects: {
        title: "Žiadne projekty",
        description: "Na vytváranie pracovných položiek potrebujete vytvoriť alebo byť súčasťou projektu.",
        primary_button: {
          text: "Začnite prvý projekt",
          comic: {
            title: "Všetko začína projektom v Plane",
            description: "Projektom môže byť roadmapa produktu, marketingová kampaň alebo uvedenie nového auta.",
          },
        },
      },
      filter: {
        title: "Žiadne zodpovedajúce projekty",
        description: "Nenašli sa projekty zodpovedajúce kritériám. \n Vytvorte nový.",
      },
      search: {
        description: "Nenašli sa projekty zodpovedajúce kritériám.\nVytvorte nový.",
      },
    },
  },
  workspace_views: {
    add_view: "Pridať pohľad",
    empty_state: {
      "all-issues": {
        title: "Žiadne pracovné položky v projekte",
        description: "Vytvorte prvú položku a sledujte svoj pokrok!",
        primary_button: {
          text: "Vytvoriť pracovnú položku",
        },
      },
      assigned: {
        title: "Žiadne priradené položky",
        description: "Tu uvidíte položky priradené vám.",
        primary_button: {
          text: "Vytvoriť pracovnú položku",
        },
      },
      created: {
        title: "Žiadne vytvorené položky",
        description: "Tu sú položky, ktoré ste vytvorili.",
        primary_button: {
          text: "Vytvoriť pracovnú položku",
        },
      },
      subscribed: {
        title: "Žiadne odoberané položky",
        description: "Prihláste sa na odber položiek, ktoré vás zaujímajú.",
      },
      "custom-view": {
        title: "Žiadne zodpovedajúce položky",
        description: "Zobrazia sa položky zodpovedajúce filtru.",
      },
    },
    delete_view: {
      title: "Ste si istí, že chcete vymazať toto zobrazenie?",
      content:
        "Ak potvrdíte, všetky možnosti triedenia, filtrovania a zobrazenia + rozloženie, ktoré ste vybrali pre toto zobrazenie, budú natrvalo vymazané bez možnosti obnovenia.",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "Zmeniť e-mail",
        description: "Zadajte novú e-mailovú adresu, aby ste dostali overovací odkaz.",
        toasts: {
          success_title: "Úspech!",
          success_message: "E-mail bol úspešne aktualizovaný. Prihláste sa znova.",
        },
        form: {
          email: {
            label: "Nový e-mail",
            placeholder: "Zadajte svoj e-mail",
            errors: {
              required: "E-mail je povinný",
              invalid: "E-mail je neplatný",
              exists: "E-mail už existuje. Použite iný.",
              validation_failed: "Overenie e-mailu zlyhalo. Skúste znova.",
            },
          },
          code: {
            label: "Jedinečný kód",
            placeholder: "123456",
            helper_text: "Overovací kód bol odoslaný na váš nový e-mail.",
            errors: {
              required: "Jedinečný kód je povinný",
              invalid: "Neplatný overovací kód. Skúste znova.",
            },
          },
        },
        actions: {
          continue: "Pokračovať",
          confirm: "Potvrdiť",
          cancel: "Zrušiť",
        },
        states: {
          sending: "Odosielanie…",
        },
      },
    },
  },
  workspace_settings: {
    label: "Nastavenia pracovného priestoru",
    page_label: "{workspace} - Všeobecné nastavenia",
    key_created: "Kľúč vytvorený",
    copy_key:
      "Skopírujte a uložte tento kľúč do Plane Pages. Po zatvorení ho neuvidíte. CSV súbor s kľúčom bol stiahnutý.",
    token_copied: "Token skopírovaný do schránky.",
    settings: {
      general: {
        title: "Všeobecné",
        upload_logo: "Nahrať logo",
        edit_logo: "Upraviť logo",
        name: "Názov pracovného priestoru",
        company_size: "Veľkosť spoločnosti",
        url: "URL pracovného priestoru",
        workspace_timezone: "Časové pásmo pracovného priestoru",
        update_workspace: "Aktualizovať priestor",
        delete_workspace: "Zmazať tento priestor",
        delete_workspace_description: "Zmazaním priestoru odstránite všetky dáta a zdroje. Akcia je nevratná.",
        delete_btn: "Zmazať priestor",
        delete_modal: {
          title: "Naozaj chcete zmazať tento priestor?",
          description: "Máte aktívnu skúšobnú verziu. Najprv ju zrušte.",
          dismiss: "Zatvoriť",
          cancel: "Zrušiť skúšobnú verziu",
          success_title: "Priestor zmazaný.",
          success_message: "Budete presmerovaný na profil.",
          error_title: "Nepodarilo sa.",
          error_message: "Skúste to prosím znova.",
        },
        errors: {
          name: {
            required: "Názov je povinný",
            max_length: "Názov priestoru nesmie presiahnuť 80 znakov",
          },
          company_size: {
            required: "Veľkosť spoločnosti je povinná",
          },
        },
      },
      members: {
        title: "Členovia",
        add_member: "Pridať člena",
        pending_invites: "Čakajúce pozvánky",
        invitations_sent_successfully: "Pozvánky boli úspešne odoslané",
        leave_confirmation: "Naozaj chcete opustiť priestor? Stratíte prístup. Akcia je nevratná.",
        details: {
          full_name: "Celé meno",
          display_name: "Zobrazované meno",
          email_address: "E-mailová adresa",
          account_type: "Typ účtu",
          authentication: "Overovanie",
          joining_date: "Dátum pripojenia",
        },
        modal: {
          title: "Pozvať spolupracovníkov",
          description: "Pozvite ľudí na spoluprácu.",
          button: "Odoslať pozvánky",
          button_loading: "Odosielanie pozvánok",
          placeholder: "meno@spoločnosť.sk",
          errors: {
            required: "Vyžaduje sa e-mailová adresa.",
            invalid: "E-mail je neplatný",
          },
        },
      },
      billing_and_plans: {
        title: "Fakturácia a plány",
        current_plan: "Aktuálny plán",
        free_plan: "Používate bezplatný plán",
        view_plans: "Zobraziť plány",
      },
      exports: {
        title: "Exporty",
        exporting: "Exportovanie",
        previous_exports: "Predchádzajúce exporty",
        export_separate_files: "Exportovať dáta do samostatných súborov",
        filters_info: "Použite filtre na export konkrétnych pracovných položiek podľa vašich kritérií.",
        modal: {
          title: "Exportovať do",
          toasts: {
            success: {
              title: "Export úspešný",
              message: "Exportované {entity} si môžete stiahnuť z predchádzajúceho exportu.",
            },
            error: {
              title: "Export zlyhal",
              message: "Skúste to prosím znova.",
            },
          },
        },
      },
      webhooks: {
        title: "Webhooky",
        add_webhook: "Pridať webhook",
        modal: {
          title: "Vytvoriť webhook",
          details: "Detaily webhooku",
          payload: "URL pre payload",
          question: "Ktoré udalosti majú spustiť tento webhook?",
          error: "URL je povinná",
        },
        secret_key: {
          title: "Tajný kľúč",
          message: "Vygenerujte token na prihlásenie k webhooku",
        },
        options: {
          all: "Posielať všetko",
          individual: "Vybrať jednotlivé udalosti",
        },
        toasts: {
          created: {
            title: "Webhook vytvorený",
            message: "Webhook bol úspešne vytvorený",
          },
          not_created: {
            title: "Webhook nebol vytvorený",
            message: "Vytvorenie webhooku zlyhalo",
          },
          updated: {
            title: "Webhook aktualizovaný",
            message: "Webhook bol úspešne aktualizovaný",
          },
          not_updated: {
            title: "Aktualizácia webhooku zlyhala",
            message: "Webhook sa nepodarilo aktualizovať",
          },
          removed: {
            title: "Webhook odstránený",
            message: "Webhook bol úspešne odstránený",
          },
          not_removed: {
            title: "Odstránenie webhooku zlyhalo",
            message: "Webhook sa nepodarilo odstrániť",
          },
          secret_key_copied: {
            message: "Tajný kľúč skopírovaný do schránky.",
          },
          secret_key_not_copied: {
            message: "Chyba pri kopírovaní kľúča.",
          },
        },
      },
      api_tokens: {
        title: "API Tokeny",
        add_token: "Pridať API token",
        create_token: "Vytvoriť token",
        never_expires: "Nikdy neexpiruje",
        generate_token: "Generovať token",
        generating: "Generovanie",
        delete: {
          title: "Zmazať API token",
          description: "Aplikácie používajúce tento token stratia prístup. Akcia je nevratná.",
          success: {
            title: "Úspech!",
            message: "Token úspešne zmazaný",
          },
          error: {
            title: "Chyba!",
            message: "Mazanie tokenu zlyhalo",
          },
        },
      },
    },
    empty_state: {
      api_tokens: {
        title: "Žiadne API tokeny",
        description: "Používajte API na integráciu Plane s externými systémami.",
      },
      webhooks: {
        title: "Žiadne webhooky",
        description: "Vytvorte webhooky na automatizáciu akcií.",
      },
      exports: {
        title: "Žiadne exporty",
        description: "Tu nájdete históriu exportov.",
      },
      imports: {
        title: "Žiadne importy",
        description: "Tu nájdete históriu importov.",
      },
    },
  },
  profile: {
    label: "Profil",
    page_label: "Vaša práca",
    work: "Práca",
    details: {
      joined_on: "Pripojený dňa",
      time_zone: "Časové pásmo",
    },
    stats: {
      workload: "Vyťaženie",
      overview: "Prehľad",
      created: "Vytvorené položky",
      assigned: "Priradené položky",
      subscribed: "Odobierané položky",
      state_distribution: {
        title: "Položky podľa stavu",
        empty: "Vytvárajte položky pre analýzu stavov.",
      },
      priority_distribution: {
        title: "Položky podľa priority",
        empty: "Vytvárajte položky pre analýzu priorít.",
      },
      recent_activity: {
        title: "Nedávna aktivita",
        empty: "Nebola nájdená žiadna aktivita.",
        button: "Stiahnuť dnešnú aktivitu",
        button_loading: "Sťahovanie",
      },
    },
    actions: {
      profile: "Profil",
      security: "Zabezpečenie",
      activity: "Aktivita",
      appearance: "Vzhľad",
      notifications: "Oznámenia",
    },
    tabs: {
      summary: "Zhrnutie",
      assigned: "Priradené",
      created: "Vytvorené",
      subscribed: "Odobierané",
      activity: "Aktivita",
    },
    empty_state: {
      activity: {
        title: "Žiadna aktivita",
        description: "Vytvorte pracovnú položku pre začiatok.",
      },
      assigned: {
        title: "Žiadne priradené pracovné položky",
        description: "Tu uvidíte priradené pracovné položky.",
      },
      created: {
        title: "Žiadne vytvorené pracovné položky",
        description: "Tu sú pracovné položky, ktoré ste vytvorili.",
      },
      subscribed: {
        title: "Žiadne odoberané pracovné položky",
        description: "Odobierajte pracovné položky, ktoré vás zaujímajú, a sledujte ich tu.",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "Zadajte ID projektu",
      please_select_a_timezone: "Vyberte časové pásmo",
      archive_project: {
        title: "Archivovať projekt",
        description: "Archivácia skryje projekt z menu. Prístup zostane cez stránku projektov.",
        button: "Archivovať projekt",
      },
      delete_project: {
        title: "Zmazať projekt",
        description: "Zmazaním projektu odstránite všetky dáta. Akcia je nevratná.",
        button: "Zmazať projekt",
      },
      toast: {
        success: "Projekt aktualizovaný",
        error: "Aktualizácia zlyhala. Skúste to znova.",
      },
    },
    members: {
      label: "Členovia",
      project_lead: "Vedúci projektu",
      default_assignee: "Predvolené priradenie",
      guest_super_permissions: {
        title: "Udeľovať hosťom prístup ku všetkým položkám:",
        sub_heading: "Hostia uvidia všetky položky v projekte.",
      },
      invite_members: {
        title: "Pozvať členov",
        sub_heading: "Pozvite členov do projektu.",
        select_co_worker: "Vybrať spolupracovníka",
      },
    },
    states: {
      describe_this_state_for_your_members: "Opíšte tento stav členom.",
      empty_state: {
        title: "Žiadne stavy pre skupinu {groupKey}",
        description: "Vytvorte nový stav",
      },
    },
    labels: {
      label_title: "Názov štítka",
      label_title_is_required: "Názov štítka je povinný",
      label_max_char: "Názov štítka nesmie presiahnuť 255 znakov",
      toast: {
        error: "Chyba pri aktualizácii štítka",
      },
    },
    estimates: {
      label: "Odhady",
      title: "Povoliť odhady pre môj projekt",
      description: "Pomáhajú vám komunikovať zložitosť a pracovné zaťaženie tímu.",
      no_estimate: "Bez odhadu",
      new: "Nový systém odhadov",
      create: {
        custom: "Vlastné",
        start_from_scratch: "Začať od nuly",
        choose_template: "Vybrať šablónu",
        choose_estimate_system: "Vybrať systém odhadov",
        enter_estimate_point: "Zadať bod odhadu",
        step: "Krok {step} z {total}",
        label: "Vytvoriť odhad",
      },
      toasts: {
        created: {
          success: {
            title: "Bod odhadu vytvorený",
            message: "Bod odhadu bol úspešne vytvorený",
          },
          error: {
            title: "Vytvorenie bodu odhadu zlyhalo",
            message: "Nepodarilo sa vytvoriť nový bod odhadu, skúste to prosím znova.",
          },
        },
        updated: {
          success: {
            title: "Odhad upravený",
            message: "Bod odhadu bol aktualizovaný vo vašom projekte.",
          },
          error: {
            title: "Úprava odhadu zlyhala",
            message: "Nepodarilo sa upraviť odhad, skúste to prosím znova",
          },
        },
        enabled: {
          success: {
            title: "Úspech!",
            message: "Odhady boli povolené.",
          },
        },
        disabled: {
          success: {
            title: "Úspech!",
            message: "Odhady boli zakázané.",
          },
          error: {
            title: "Chyba!",
            message: "Odhad sa nepodarilo zakázať. Skúste to prosím znova",
          },
        },
      },
      validation: {
        min_length: "Bod odhadu musí byť väčší ako 0.",
        unable_to_process: "Nemôžeme spracovať vašu požiadavku, skúste to prosím znova.",
        numeric: "Bod odhadu musí byť číselná hodnota.",
        character: "Bod odhadu musí byť znakovou hodnotou.",
        empty: "Hodnota odhadu nemôže byť prázdna.",
        already_exists: "Hodnota odhadu už existuje.",
        unsaved_changes: "Máte neuložené zmeny. Prosím, uložte ich pred kliknutím na hotovo",
        remove_empty: "Odhad nemôže byť prázdny. Zadajte hodnotu do každého poľa alebo odstráňte prázdne polia.",
      },
      systems: {
        points: {
          label: "Body",
          fibonacci: "Fibonacci",
          linear: "Lineárne",
          squares: "Štvorce",
          custom: "Vlastné",
        },
        categories: {
          label: "Kategórie",
          t_shirt_sizes: "Veľkosti tričiek",
          easy_to_hard: "Od jednoduchého po náročné",
          custom: "Vlastné",
        },
        time: {
          label: "Čas",
          hours: "Hodiny",
        },
      },
    },
    automations: {
      label: "Automatizácie",
      "auto-archive": {
        title: "Automaticky archivovať uzavreté položky",
        description: "Plane bude archivovať dokončené alebo zrušené položky.",
        duration: "Archivovať položky uzavreté dlhšie ako",
      },
      "auto-close": {
        title: "Automaticky uzatvárať položky",
        description: "Plane uzavrie neaktívne položky.",
        duration: "Uzatvoriť položky neaktívne dlhšie ako",
        auto_close_status: "Stav pre automatické uzatvorenie",
      },
    },
    empty_state: {
      labels: {
        title: "Žiadne štítky",
        description: "Vytvárajte štítky na organizáciu položiek.",
      },
      estimates: {
        title: "Žiadne systémy odhadov",
        description: "Vytvorte systém odhadov na komunikáciu vyťaženia.",
        primary_button: "Pridať systém odhadov",
      },
    },
    features: {
      cycles: {
        title: "Cykly",
        short_title: "Cykly",
        description:
          "Naplánujte prácu v flexibilných obdobiach, ktoré sa prispôsobia jedinečnému rytmu a tempu tohto projektu.",
        toggle_title: "Povoliť cykly",
        toggle_description: "Naplánujte prácu v sústredenej časovej osi.",
      },
      modules: {
        title: "Moduly",
        short_title: "Moduly",
        description: "Organizujte prácu do podprojektov s vyčlenenými vedúcimi a priradenými osobami.",
        toggle_title: "Povoliť moduly",
        toggle_description: "Členovia projektu budú môcť vytvárať a upravovať moduly.",
      },
      views: {
        title: "Zobrazenia",
        short_title: "Zobrazenia",
        description: "Uložte vlastné triedenia, filtre a možnosti zobrazenia alebo ich zdieľajte so svojím tímom.",
        toggle_title: "Povoliť zobrazenia",
        toggle_description: "Členovia projektu budú môcť vytvárať a upravovať zobrazenia.",
      },
      pages: {
        title: "Stránky",
        short_title: "Stránky",
        description: "Vytvárajte a upravujte voľný obsah: poznámky, dokumenty, čokoľvek.",
        toggle_title: "Povoliť stránky",
        toggle_description: "Členovia projektu budú môcť vytvárať a upravovať stránky.",
      },
      intake: {
        title: "Príjem",
        short_title: "Príjem",
        description: "Umožnite nečlenom zdieľať chyby, spätnú väzbu a návrhy; bez narušenia vášho pracovného postupu.",
        toggle_title: "Povoliť príjem",
        toggle_description: "Povoliť členom projektu vytvárať žiadosti o príjem v aplikácii.",
      },
    },
  },
  project_cycles: {
    add_cycle: "Pridať cyklus",
    more_details: "Viac detailov",
    cycle: "Cyklus",
    update_cycle: "Aktualizovať cyklus",
    create_cycle: "Vytvoriť cyklus",
    no_matching_cycles: "Žiadne zodpovedajúce cykly",
    remove_filters_to_see_all_cycles: "Odstráňte filtre pre zobrazenie všetkých cyklov",
    remove_search_criteria_to_see_all_cycles: "Odstráňte kritériá pre zobrazenie všetkých cyklov",
    only_completed_cycles_can_be_archived: "Archivovať je možné iba dokončené cykly",
    start_date: "Dátum začiatku",
    end_date: "Dátum konca",
    in_your_timezone: "Váš časový pásmo",
    transfer_work_items: "Presunúť {count} pracovných položiek",
    date_range: "Dátumový rozsah",
    add_date: "Pridať dátum",
    active_cycle: {
      label: "Aktívny cyklus",
      progress: "Pokrok",
      chart: "Burndown graf",
      priority_issue: "Vysoko prioritné položky",
      assignees: "Priradení",
      issue_burndown: "Burndown pracovných položiek",
      ideal: "Ideálne",
      current: "Aktuálne",
      labels: "Štítky",
    },
    upcoming_cycle: {
      label: "Nadchádzajúci cyklus",
    },
    completed_cycle: {
      label: "Dokončený cyklus",
    },
    status: {
      days_left: "Zostáva dní",
      completed: "Dokončené",
      yet_to_start: "Ešte nezačaté",
      in_progress: "Prebieha",
      draft: "Koncept",
    },
    action: {
      restore: {
        title: "Obnoviť cyklus",
        success: {
          title: "Cyklus obnovený",
          description: "Cyklus bol obnovený.",
        },
        failed: {
          title: "Obnovenie zlyhalo",
          description: "Obnovenie cyklu sa nepodarilo.",
        },
      },
      favorite: {
        loading: "Pridávanie do obľúbených",
        success: {
          description: "Cyklus pridaný do obľúbených.",
          title: "Úspech!",
        },
        failed: {
          description: "Pridanie do obľúbených zlyhalo.",
          title: "Chyba!",
        },
      },
      unfavorite: {
        loading: "Odstraňovanie z obľúbených",
        success: {
          description: "Cyklus odstránený z obľúbených.",
          title: "Úspech!",
        },
        failed: {
          description: "Odstránenie zlyhalo.",
          title: "Chyba!",
        },
      },
      update: {
        loading: "Aktualizácia cyklu",
        success: {
          description: "Cyklus aktualizovaný.",
          title: "Úspech!",
        },
        failed: {
          description: "Aktualizácia zlyhala.",
          title: "Chyba!",
        },
        error: {
          already_exists: "Cyklus s týmito dátami už existuje. Pre koncept odstráňte dáta.",
        },
      },
    },
    empty_state: {
      general: {
        title: "Zoskupujte prácu do cyklov.",
        description: "Časovo ohraničte prácu, sledujte termíny a robte pokroky.",
        primary_button: {
          text: "Vytvorte prvý cyklus",
          comic: {
            title: "Cykly sú opakované časové obdobia.",
            description: "Sprint, iterácia alebo akékoľvek iné časové obdobie na sledovanie práce.",
          },
        },
      },
      no_issues: {
        title: "Žiadne položky v cykle",
        description: "Pridajte položky, ktoré chcete sledovať.",
        primary_button: {
          text: "Vytvoriť položku",
        },
        secondary_button: {
          text: "Pridať existujúcu položku",
        },
      },
      completed_no_issues: {
        title: "Žiadne položky v cykle",
        description: "Položky boli presunuté alebo skryté. Pre zobrazenie upravte vlastnosti.",
      },
      active: {
        title: "Žiadny aktívny cyklus",
        description: "Aktívny cyklus zahŕňa dnešný dátum. Sledujte jeho priebeh tu.",
      },
      archived: {
        title: "Žiadne archivované cykly",
        description: "Archivujte dokončené cykly pre poriadok.",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "Vytvorte a priraďte pracovnú položku",
        description: "Položky sú úlohy, ktoré priraďujete sebe alebo tímu. Sledujte ich postup.",
        primary_button: {
          text: "Vytvoriť prvú položku",
          comic: {
            title: "Položky sú stavebnými kameňmi",
            description: "Príklady: Redizajn UI, Rebranding, Nový systém.",
          },
        },
      },
      no_archived_issues: {
        title: "Žiadne archivované položky",
        description: "Archivujte dokončené alebo zrušené položky. Nastavte automatizáciu.",
        primary_button: {
          text: "Nastaviť automatizáciu",
        },
      },
      issues_empty_filter: {
        title: "Žiadne zodpovedajúce položky",
        secondary_button: {
          text: "Vymazať filtre",
        },
      },
    },
  },
  project_module: {
    add_module: "Pridať modul",
    update_module: "Aktualizovať modul",
    create_module: "Vytvoriť modul",
    archive_module: "Archivovať modul",
    restore_module: "Obnoviť modul",
    delete_module: "Zmazať modul",
    empty_state: {
      general: {
        title: "Zoskupujte míľniky do modulov.",
        description: "Moduly zoskupujú položky pod logického nadradeného. Sledujte termíny a pokrok.",
        primary_button: {
          text: "Vytvorte prvý modul",
          comic: {
            title: "Moduly zoskupujú hierarchicky.",
            description: "Príklady: Modul košíka, podvozku, skladu.",
          },
        },
      },
      no_issues: {
        title: "Žiadne položky v module",
        description: "Pridajte položky do modulu.",
        primary_button: {
          text: "Vytvoriť položky",
        },
        secondary_button: {
          text: "Pridať existujúcu položku",
        },
      },
      archived: {
        title: "Žiadne archivované moduly",
        description: "Archivujte dokončené alebo zrušené moduly.",
      },
      sidebar: {
        in_active: "Modul nie je aktívny.",
        invalid_date: "Neplatný dátum. Zadajte platný.",
      },
    },
    quick_actions: {
      archive_module: "Archivovať modul",
      archive_module_description: "Archivovať je možné iba dokončené/zrušené moduly.",
      delete_module: "Zmazať modul",
    },
    toast: {
      copy: {
        success: "Odkaz na modul bol skopírovaný",
      },
      delete: {
        success: "Modul zmazaný",
        error: "Mazanie zlyhalo",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "Ukladajte filtre ako pohľady.",
        description: "Pohľady sú uložené filtre na jednoduchý prístup. Zdieľajte ich v tíme.",
        primary_button: {
          text: "Vytvoriť prvý pohľad",
          comic: {
            title: "Pohľady pracujú s vlastnosťami položiek.",
            description: "Vytvorte pohľad s požadovanými filtrami.",
          },
        },
      },
      filter: {
        title: "Žiadne zodpovedajúce zobrazenia",
        description: "Vytvorte nové zobrazenie.",
      },
    },
    delete_view: {
      title: "Ste si istí, že chcete vymazať toto zobrazenie?",
      content:
        "Ak potvrdíte, všetky možnosti triedenia, filtrovania a zobrazenia + rozloženie, ktoré ste vybrali pre toto zobrazenie, budú natrvalo vymazané bez možnosti obnovenia.",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title: "Píšte poznámky, dokumenty alebo znalostnú bázu. Využite AI Galileo.",
        description:
          "Stránky sú priestorom pre myšlienky. Píšte, formátujte, vkladajte položky a používajte komponenty.",
        primary_button: {
          text: "Vytvoriť prvú stránku",
        },
      },
      private: {
        title: "Žiadne súkromné stránky",
        description: "Uchovávajte súkromné myšlienky. Zdieľajte ich, až budete pripravení.",
        primary_button: {
          text: "Vytvoriť stránku",
        },
      },
      public: {
        title: "Žiadne verejné stránky",
        description: "Tu uvidíte stránky zdieľané v projekte.",
        primary_button: {
          text: "Vytvoriť stránku",
        },
      },
      archived: {
        title: "Žiadne archivované stránky",
        description: "Archivujte stránky pre neskorší prístup.",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "Nenašli sa žiadne výsledky",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "Žiadne zodpovedajúce položky",
      },
      no_issues: {
        title: "Žiadne položky",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "Žiadne komentáre",
        description: "Komentáre slúžia na diskusiu a sledovanie položiek.",
      },
    },
  },
  notification: {
    label: "Schránka",
    page_label: "{workspace} - Schránka",
    options: {
      mark_all_as_read: "Označiť všetko ako prečítané",
      mark_read: "Označiť ako prečítané",
      mark_unread: "Označiť ako neprečítané",
      refresh: "Obnoviť",
      filters: "Filtre schránky",
      show_unread: "Zobraziť neprečítané",
      show_snoozed: "Zobraziť odložené",
      show_archived: "Zobraziť archivované",
      mark_archive: "Archivovať",
      mark_unarchive: "Zrušiť archiváciu",
      mark_snooze: "Odložiť",
      mark_unsnooze: "Zrušiť odloženie",
    },
    toasts: {
      read: "Oznámenie prečítané",
      unread: "Označené ako neprečítané",
      archived: "Archivované",
      unarchived: "Archivácia zrušená",
      snoozed: "Odložené",
      unsnoozed: "Odloženie zrušené",
    },
    empty_state: {
      detail: {
        title: "Vyberte pre podrobnosti.",
      },
      all: {
        title: "Žiadne priradené položky",
        description: "Aktualizácie k priradeným položkám sa zobrazia tu.",
      },
      mentions: {
        title: "Žiadne zmienky",
        description: "Zobrazia sa tu zmienky o vás.",
      },
    },
    tabs: {
      all: "Všetko",
      mentions: "Zmienky",
    },
    filter: {
      assigned: "Priradené mne",
      created: "Vytvoril som",
      subscribed: "Odobieram",
    },
    snooze: {
      "1_day": "1 deň",
      "3_days": "3 dni",
      "5_days": "5 dní",
      "1_week": "1 týždeň",
      "2_weeks": "2 týždne",
      custom: "Vlastné",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "Pridajte položky pre sledovanie pokroku",
      },
      chart: {
        title: "Pridajte položky pre zobrazenie burndown grafu.",
      },
      priority_issue: {
        title: "Zobrazia sa vysoko prioritné pracovné položky.",
      },
      assignee: {
        title: "Priraďte položky pre prehľad priradení.",
      },
      label: {
        title: "Pridajte štítky pre analýzu podľa štítkov.",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "Príjem nie je povolený",
        description: "Aktivujte príjem v nastaveniach projektu pre správu požiadaviek.",
        primary_button: {
          text: "Spravovať funkcie",
        },
      },
      cycle: {
        title: "Cykly nie sú povolené",
        description: "Aktivujte cykly pre časové ohraničenie práce.",
        primary_button: {
          text: "Spravovať funkcie",
        },
      },
      module: {
        title: "Moduly nie sú povolené",
        description: "Aktivujte moduly v nastaveniach projektu.",
        primary_button: {
          text: "Spravovať funkcie",
        },
      },
      page: {
        title: "Stránky nie sú povolené",
        description: "Aktivujte stránky v nastaveniach projektu.",
        primary_button: {
          text: "Spravovať funkcie",
        },
      },
      view: {
        title: "Pohľady nie sú povolené",
        description: "Aktivujte pohľady v nastaveniach projektu.",
        primary_button: {
          text: "Spravovať funkcie",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "Vytvoriť koncept položky",
    empty_state: {
      title: "Rozpracované položky a komentáre sa zobrazia tu.",
      description: "Začnite vytvárať položku a nechajte ju rozpracovanú.",
      primary_button: {
        text: "Vytvoriť prvý koncept",
      },
    },
    delete_modal: {
      title: "Zmazať koncept",
      description: "Naozaj chcete zmazať tento koncept? Akcia je nevratná.",
    },
    toasts: {
      created: {
        success: "Koncept vytvorený",
        error: "Vytvorenie zlyhalo",
      },
      deleted: {
        success: "Koncept zmazaný",
      },
    },
  },
  stickies: {
    title: "Vaše poznámky",
    placeholder: "kliknutím začnite písať",
    all: "Všetky poznámky",
    "no-data": "Zapisujte nápady a myšlienky. Pridajte prvú poznámku.",
    add: "Pridať poznámku",
    search_placeholder: "Hľadať podľa názvu",
    delete: "Zmazať poznámku",
    delete_confirmation: "Naozaj chcete zmazať túto poznámku?",
    empty_state: {
      simple: "Zapisujte nápady a myšlienky. Pridajte prvú poznámku.",
      general: {
        title: "Poznámky sú rýchle záznamy.",
        description: "Zapisujte myšlienky a pristupujte k nim odkiaľkoľvek.",
        primary_button: {
          text: "Pridať poznámku",
        },
      },
      search: {
        title: "Nenašli sa žiadne poznámky.",
        description: "Skúste iný výraz alebo vytvorte novú.",
        primary_button: {
          text: "Pridať poznámku",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "Názov poznámky môže mať max. 100 znakov.",
        already_exists: "Poznámka bez popisu už existuje",
      },
      created: {
        title: "Poznámka vytvorená",
        message: "Poznámka bola úspešne vytvorená",
      },
      not_created: {
        title: "Vytvorenie zlyhalo",
        message: "Poznámku sa nepodarilo vytvoriť",
      },
      updated: {
        title: "Poznámka aktualizovaná",
        message: "Poznámka bola úspešne aktualizovaná",
      },
      not_updated: {
        title: "Aktualizácia zlyhala",
        message: "Poznámku sa nepodarilo aktualizovať",
      },
      removed: {
        title: "Poznámka zmazaná",
        message: "Poznámka bola úspešne zmazaná",
      },
      not_removed: {
        title: "Mazanie zlyhalo",
        message: "Poznámku sa nepodarilo zmazať",
      },
    },
  },
  role_details: {
    guest: {
      title: "Hosť",
      description: "Externí členovia môžu byť pozvaní ako hostia.",
    },
    member: {
      title: "Člen",
      description: "Môže čítať, písať, upravovať a mazať entity.",
    },
    admin: {
      title: "Správca",
      description: "Má všetky oprávnenia v priestore.",
    },
  },
  user_roles: {
    product_or_project_manager: "Produktový/Projektový manažér",
    development_or_engineering: "Vývoj/Inžinierstvo",
    founder_or_executive: "Zakladateľ/Vedenie",
    freelancer_or_consultant: "Freelancer/Konzultant",
    marketing_or_growth: "Marketing/Rast",
    sales_or_business_development: "Predaj/Business Development",
    support_or_operations: "Podpora/Operácie",
    student_or_professor: "Študent/Profesor",
    human_resources: "Ľudské zdroje",
    other: "Iné",
  },
  importer: {
    github: {
      title: "GitHub",
      description: "Importujte položky z repozitárov GitHub.",
    },
    jira: {
      title: "Jira",
      description: "Importujte položky a epiky z Jira.",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "Exportujte položky do CSV.",
      short_description: "Exportovať ako CSV",
    },
    excel: {
      title: "Excel",
      description: "Exportujte položky do Excelu.",
      short_description: "Exportovať ako Excel",
    },
    xlsx: {
      title: "Excel",
      description: "Exportujte položky do Excelu.",
      short_description: "Exportovať ako Excel",
    },
    json: {
      title: "JSON",
      description: "Exportujte položky do JSON.",
      short_description: "Exportovať ako JSON",
    },
  },
  default_global_view: {
    all_issues: "Všetky položky",
    assigned: "Priradené",
    created: "Vytvorené",
    subscribed: "Odobierané",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "Systémové predvoľby",
      },
      light: {
        label: "Svetlé",
      },
      dark: {
        label: "Tmavé",
      },
      light_contrast: {
        label: "Svetlý vysoký kontrast",
      },
      dark_contrast: {
        label: "Tmavý vysoký kontrast",
      },
      custom: {
        label: "Vlastná téma",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "Backlog",
      planned: "Plánované",
      in_progress: "Prebieha",
      paused: "Pozastavené",
      completed: "Dokončené",
      cancelled: "Zrušené",
    },
    layout: {
      list: "Zoznam",
      board: "Nástenka",
      timeline: "Časová os",
    },
    order_by: {
      name: "Názov",
      progress: "Pokrok",
      issues: "Počet položiek",
      due_date: "Termín",
      created_at: "Dátum vytvorenia",
      manual: "Manuálne",
    },
  },
  cycle: {
    label: "{count, plural, one {Cyklus} few {Cykly} other {Cyklov}}",
    no_cycle: "Žiadny cyklus",
  },
  module: {
    label: "{count, plural, one {Modul} few {Moduly} other {Modulov}}",
    no_module: "Žiadny modul",
  },
  description_versions: {
    last_edited_by: "Naposledy upravené používateľom",
    previously_edited_by: "Predtým upravené používateľom",
    edited_by: "Upravené používateľom",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane sa nespustil. Toto môže byť spôsobené tým, že sa jedna alebo viac služieb Plane nepodarilo spustiť.",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "Vyberte View Logs z setup.sh a Docker logov, aby ste si boli istí.",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "Osnova",
        empty_state: {
          title: "Chýbajú nadpisy",
          description: "Pridajme na túto stránku nejaké nadpisy, aby sa tu zobrazili.",
        },
      },
      info: {
        label: "Info",
        document_info: {
          words: "Slová",
          characters: "Znaky",
          paragraphs: "Odseky",
          read_time: "Čas čítania",
        },
        actors_info: {
          edited_by: "Upravil",
          created_by: "Vytvoril",
        },
        version_history: {
          label: "História verzií",
          current_version: "Aktuálna verzia",
        },
      },
      assets: {
        label: "Prílohy",
        download_button: "Stiahnuť",
        empty_state: {
          title: "Chýbajú obrázky",
          description: "Pridajte obrázky, aby sa tu zobrazili.",
        },
      },
    },
    open_button: "Otvoriť navigačný panel",
    close_button: "Zavrieť navigačný panel",
    outline_floating_button: "Otvoriť osnovu",
  },
} as const;
