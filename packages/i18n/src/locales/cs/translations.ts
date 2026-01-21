export default {
  sidebar: {
    projects: "Projekty",
    pages: "Stránky",
    new_work_item: "Nová pracovní položka",
    home: "Domov",
    your_work: "Vaše práce",
    inbox: "Doručená pošta",
    workspace: "Pracovní prostor",
    views: "Pohledy",
    analytics: "Analytika",
    work_items: "Pracovní položky",
    cycles: "Cykly",
    modules: "Moduly",
    intake: "Příjem",
    drafts: "Koncepty",
    favorites: "Oblíbené",
    pro: "Pro",
    upgrade: "Upgrade",
  },
  auth: {
    common: {
      email: {
        label: "E-mail",
        placeholder: "jmeno@spolecnost.cz",
        errors: {
          required: "E-mail je povinný",
          invalid: "E-mail je neplatný",
        },
      },
      password: {
        label: "Heslo",
        set_password: "Nastavit heslo",
        placeholder: "Zadejte heslo",
        confirm_password: {
          label: "Potvrďte heslo",
          placeholder: "Potvrďte heslo",
        },
        current_password: {
          label: "Aktuální heslo",
        },
        new_password: {
          label: "Nové heslo",
          placeholder: "Zadejte nové heslo",
        },
        change_password: {
          label: {
            default: "Změnit heslo",
            submitting: "Mění se heslo",
          },
        },
        errors: {
          match: "Hesla se neshodují",
          empty: "Zadejte prosím své heslo",
          length: "Délka hesla by měla být více než 8 znaků",
          strength: {
            weak: "Heslo je slabé",
            strong: "Heslo je silné",
          },
        },
        submit: "Nastavit heslo",
        toast: {
          change_password: {
            success: {
              title: "Úspěch!",
              message: "Heslo bylo úspěšně změněno.",
            },
            error: {
              title: "Chyba!",
              message: "Něco se pokazilo. Zkuste to prosím znovu.",
            },
          },
        },
      },
      unique_code: {
        label: "Jedinečný kód",
        placeholder: "123456",
        paste_code: "Vložte kód zaslaný na váš e-mail",
        requesting_new_code: "Žádám o nový kód",
        sending_code: "Odesílám kód",
      },
      already_have_an_account: "Už máte účet?",
      login: "Přihlásit se",
      create_account: "Vytvořit účet",
      new_to_plane: "Nový v Plane?",
      back_to_sign_in: "Zpět k přihlášení",
      resend_in: "Znovu odeslat za {seconds} sekund",
      sign_in_with_unique_code: "Přihlásit se pomocí jedinečného kódu",
      forgot_password: "Zapomněli jste heslo?",
    },
    sign_up: {
      header: {
        label: "Vytvořte účet a začněte spravovat práci se svým týmem.",
        step: {
          email: {
            header: "Registrace",
            sub_header: "",
          },
          password: {
            header: "Registrace",
            sub_header: "Zaregistrujte se pomocí kombinace e-mailu a hesla.",
          },
          unique_code: {
            header: "Registrace",
            sub_header: "Zaregistrujte se pomocí jedinečného kódu zaslaného na výše uvedenou e-mailovou adresu.",
          },
        },
      },
      errors: {
        password: {
          strength: "Zkuste nastavit silné heslo, abyste mohli pokračovat",
        },
      },
    },
    sign_in: {
      header: {
        label: "Přihlaste se a začněte spravovat práci se svým týmem.",
        step: {
          email: {
            header: "Přihlásit se nebo zaregistrovat",
            sub_header: "",
          },
          password: {
            header: "Přihlásit se nebo zaregistrovat",
            sub_header: "Použijte svou kombinaci e-mailu a hesla pro přihlášení.",
          },
          unique_code: {
            header: "Přihlásit se nebo zaregistrovat",
            sub_header: "Přihlaste se pomocí jedinečného kódu zaslaného na výše uvedenou e-mailovou adresu.",
          },
        },
      },
    },
    forgot_password: {
      title: "Obnovte své heslo",
      description:
        "Zadejte ověřenou e-mailovou adresu vašeho uživatelského účtu a my vám zašleme odkaz na obnovení hesla.",
      email_sent: "Odeslali jsme odkaz na obnovení na vaši e-mailovou adresu",
      send_reset_link: "Odeslat odkaz na obnovení",
      errors: {
        smtp_not_enabled: "Vidíme, že váš správce neaktivoval SMTP, nebudeme schopni odeslat odkaz na obnovení hesla",
      },
      toast: {
        success: {
          title: "E-mail odeslán",
          message:
            "Zkontrolujte svou doručenou poštu pro odkaz na obnovení hesla. Pokud se neobjeví během několika minut, zkontrolujte svou složku se spamem.",
        },
        error: {
          title: "Chyba!",
          message: "Něco se pokazilo. Zkuste to prosím znovu.",
        },
      },
    },
    reset_password: {
      title: "Nastavit nové heslo",
      description: "Zabezpečte svůj účet silným heslem",
    },
    set_password: {
      title: "Zabezpečte svůj účet",
      description: "Nastavení hesla vám pomůže bezpečně se přihlásit",
    },
    sign_out: {
      toast: {
        error: {
          title: "Chyba!",
          message: "Nepodařilo se odhlásit. Zkuste to prosím znovu.",
        },
      },
    },
  },
  submit: "Odeslat",
  cancel: "Zrušit",
  loading: "Načítání",
  error: "Chyba",
  success: "Úspěch",
  warning: "Varování",
  info: "Informace",
  close: "Zavřít",
  yes: "Ano",
  no: "Ne",
  ok: "OK",
  name: "Název",
  description: "Popis",
  search: "Hledat",
  add_member: "Přidat člena",
  adding_members: "Přidávání členů",
  remove_member: "Odebrat člena",
  add_members: "Přidat členy",
  adding_member: "Přidávání členů",
  remove_members: "Odebrat členy",
  add: "Přidat",
  adding: "Přidávání",
  remove: "Odebrat",
  add_new: "Přidat nový",
  remove_selected: "Odebrat vybrané",
  first_name: "Křestní jméno",
  last_name: "Příjmení",
  email: "E-mail",
  display_name: "Zobrazované jméno",
  role: "Role",
  timezone: "Časové pásmo",
  avatar: "Profilový obrázek",
  cover_image: "Úvodní obrázek",
  password: "Heslo",
  change_cover: "Změnit úvodní obrázek",
  language: "Jazyk",
  saving: "Ukládání",
  save_changes: "Uložit změny",
  deactivate_account: "Deaktivovat účet",
  deactivate_account_description:
    "Při deaktivaci účtu budou všechna data a prostředky v rámci tohoto účtu trvale odstraněny a nelze je obnovit.",
  profile_settings: "Nastavení profilu",
  your_account: "Váš účet",
  security: "Zabezpečení",
  activity: "Aktivita",
  appearance: "Vzhled",
  notifications: "Oznámení",
  workspaces: "Pracovní prostory",
  create_workspace: "Vytvořit pracovní prostor",
  invitations: "Pozvánky",
  summary: "Shrnutí",
  assigned: "Přiřazeno",
  created: "Vytvořeno",
  subscribed: "Odebíráno",
  you_do_not_have_the_permission_to_access_this_page: "Nemáte oprávnění pro přístup k této stránce.",
  something_went_wrong_please_try_again: "Něco se pokazilo. Zkuste to prosím znovu.",
  load_more: "Načíst více",
  select_or_customize_your_interface_color_scheme: "Vyberte nebo přizpůsobte barevné schéma rozhraní.",
  theme: "Téma",
  system_preference: "Systémové předvolby",
  light: "Světlé",
  dark: "Tmavé",
  light_contrast: "Světlý vysoký kontrast",
  dark_contrast: "Tmavý vysoký kontrast",
  custom: "Vlastní téma",
  select_your_theme: "Vyberte téma",
  customize_your_theme: "Přizpůsobte si téma",
  background_color: "Barva pozadí",
  text_color: "Barva textu",
  primary_color: "Hlavní barva (téma)",
  sidebar_background_color: "Barva pozadí postranního panelu",
  sidebar_text_color: "Barva textu postranního panelu",
  set_theme: "Nastavit téma",
  enter_a_valid_hex_code_of_6_characters: "Zadejte platný hexadecimální kód o 6 znacích",
  background_color_is_required: "Barva pozadí je povinná",
  text_color_is_required: "Barva textu je povinná",
  primary_color_is_required: "Hlavní barva je povinná",
  sidebar_background_color_is_required: "Barva pozadí postranního panelu je povinná",
  sidebar_text_color_is_required: "Barva textu postranního panelu je povinná",
  updating_theme: "Aktualizace tématu",
  theme_updated_successfully: "Téma úspěšně aktualizováno",
  failed_to_update_the_theme: "Aktualizace tématu se nezdařila",
  email_notifications: "E-mailová oznámení",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "Zůstaňte v obraze u pracovních položek, které odebíráte. Aktivujte toto pro zasílání oznámení.",
  email_notification_setting_updated_successfully: "Nastavení e-mailových oznámení úspěšně aktualizováno",
  failed_to_update_email_notification_setting: "Aktualizace nastavení e-mailových oznámení se nezdařila",
  notify_me_when: "Upozornit mě, když",
  property_changes: "Změny vlastností",
  property_changes_description:
    "Upozornit mě, když se změní vlastnosti pracovních položek jako přiřazení, priorita, odhady nebo cokoli jiného.",
  state_change: "Změna stavu",
  state_change_description: "Upozornit mě, když se pracovní položka přesune do jiného stavu",
  issue_completed: "Pracovní položka dokončena",
  issue_completed_description: "Upozornit mě pouze při dokončení pracovní položky",
  comments: "Komentáře",
  comments_description: "Upozornit mě, když někdo přidá komentář k pracovní položce",
  mentions: "Zmínky",
  mentions_description: "Upozornit mě pouze, když mě někdo zmíní v komentářích nebo popisu",
  old_password: "Staré heslo",
  general_settings: "Obecná nastavení",
  sign_out: "Odhlásit se",
  signing_out: "Odhlašování",
  active_cycles: "Aktivní cykly",
  active_cycles_description:
    "Sledujte cykly napříč projekty, monitorujte vysoce prioritní pracovní položky a zaměřte se na cykly vyžadující pozornost.",
  on_demand_snapshots_of_all_your_cycles: "Snapshots všech vašich cyklů na vyžádání",
  upgrade: "Upgradovat",
  "10000_feet_view": "Pohled z 10 000 stop na všechny aktivní cykly.",
  "10000_feet_view_description":
    "Přibližte si všechny běžící cykly napříč všemi projekty najednou, místo přepínání mezi cykly v každém projektu.",
  get_snapshot_of_each_active_cycle: "Získejte snapshot každého aktivního cyklu.",
  get_snapshot_of_each_active_cycle_description:
    "Sledujte klíčové metriky pro všechny aktivní cykly, zjistěte jejich průběh a porovnejte rozsah s termíny.",
  compare_burndowns: "Porovnejte burndowny.",
  compare_burndowns_description: "Sledujte výkonnost týmů prostřednictvím přehledu burndown reportů každého cyklu.",
  quickly_see_make_or_break_issues: "Rychle zjistěte kritické pracovní položky.",
  quickly_see_make_or_break_issues_description:
    "Prohlédněte si vysoce prioritní pracovní položky pro každý cyklus vzhledem k termínům. Zobrazte všechny na jedno kliknutí.",
  zoom_into_cycles_that_need_attention: "Zaměřte se na cykly vyžadující pozornost.",
  zoom_into_cycles_that_need_attention_description:
    "Prozkoumejte stav jakéhokoli cyklu, který nesplňuje očekávání, na jedno kliknutí.",
  stay_ahead_of_blockers: "Předvídejte překážky.",
  stay_ahead_of_blockers_description:
    "Identifikujte problémy mezi projekty a zjistěte závislosti mezi cykly, které nejsou z jiných pohledů zřejmé.",
  analytics: "Analytika",
  workspace_invites: "Pozvánky do pracovního prostoru",
  enter_god_mode: "Vstoupit do režimu boha",
  workspace_logo: "Logo pracovního prostoru",
  new_issue: "Nová pracovní položka",
  your_work: "Vaše práce",
  drafts: "Koncepty",
  projects: "Projekty",
  views: "Pohledy",
  workspace: "Pracovní prostor",
  archives: "Archivy",
  settings: "Nastavení",
  failed_to_move_favorite: "Přesunutí oblíbeného se nezdařilo",
  favorites: "Oblíbené",
  no_favorites_yet: "Zatím žádné oblíbené",
  create_folder: "Vytvořit složku",
  new_folder: "Nová složka",
  favorite_updated_successfully: "Oblíbené úspěšně aktualizováno",
  favorite_created_successfully: "Oblíbené úspěšně vytvořeno",
  folder_already_exists: "Složka již existuje",
  folder_name_cannot_be_empty: "Název složky nemůže být prázdný",
  something_went_wrong: "Něco se pokazilo",
  failed_to_reorder_favorite: "Změna pořadí oblíbeného se nezdařila",
  favorite_removed_successfully: "Oblíbené úspěšně odstraněno",
  failed_to_create_favorite: "Vytvoření oblíbeného se nezdařilo",
  failed_to_rename_favorite: "Přejmenování oblíbeného se nezdařilo",
  project_link_copied_to_clipboard: "Odkaz na projekt zkopírován do schránky",
  link_copied: "Odkaz zkopírován",
  add_project: "Přidat projekt",
  create_project: "Vytvořit projekt",
  failed_to_remove_project_from_favorites: "Nepodařilo se odstranit projekt z oblíbených. Zkuste to prosím znovu.",
  project_created_successfully: "Projekt úspěšně vytvořen",
  project_created_successfully_description:
    "Projekt byl úspěšně vytvořen. Nyní můžete začít přidávat pracovní položky.",
  project_name_already_taken: "Název projektu už je zabraný.",
  project_identifier_already_taken: "Identifikátor projektu už je zabraný.",
  project_cover_image_alt: "Úvodní obrázek projektu",
  name_is_required: "Název je povinný",
  title_should_be_less_than_255_characters: "Název by měl být kratší než 255 znaků",
  project_name: "Název projektu",
  project_id_must_be_at_least_1_character: "ID projektu musí mít alespoň 1 znak",
  project_id_must_be_at_most_5_characters: "ID projektu může mít maximálně 5 znaků",
  project_id: "ID projektu",
  project_id_tooltip_content: "Pomáhá jednoznačně identifikovat pracovní položky v projektu. Max. 10 znaků.",
  description_placeholder: "Popis",
  only_alphanumeric_non_latin_characters_allowed: "Jsou povoleny pouze alfanumerické a nelatinské znaky.",
  project_id_is_required: "ID projektu je povinné",
  project_id_allowed_char: "Jsou povoleny pouze alfanumerické a nelatinské znaky.",
  project_id_min_char: "ID projektu musí mít alespoň 1 znak",
  project_id_max_char: "ID projektu může mít maximálně 10 znaků",
  project_description_placeholder: "Zadejte popis projektu",
  select_network: "Vybrat síť",
  lead: "Vedoucí",
  date_range: "Rozsah dat",
  private: "Soukromý",
  public: "Veřejný",
  accessible_only_by_invite: "Přístupné pouze na pozvání",
  anyone_in_the_workspace_except_guests_can_join: "Kdokoli v pracovním prostoru kromě hostů se může připojit",
  creating: "Vytváření",
  creating_project: "Vytváření projektu",
  adding_project_to_favorites: "Přidávání projektu do oblíbených",
  project_added_to_favorites: "Projekt přidán do oblíbených",
  couldnt_add_the_project_to_favorites: "Nepodařilo se přidat projekt do oblíbených. Zkuste to prosím znovu.",
  removing_project_from_favorites: "Odebírání projektu z oblíbených",
  project_removed_from_favorites: "Projekt odstraněn z oblíbených",
  couldnt_remove_the_project_from_favorites: "Nepodařilo se odstranit projekt z oblíbených. Zkuste to prosím znovu.",
  add_to_favorites: "Přidat do oblíbených",
  remove_from_favorites: "Odebrat z oblíbených",
  publish_project: "Publikovat projekt",
  publish: "Publikovat",
  copy_link: "Kopírovat odkaz",
  leave_project: "Opustit projekt",
  join_the_project_to_rearrange: "Připojte se k projektu pro změnu uspořádání",
  drag_to_rearrange: "Přetáhněte pro uspořádání",
  congrats: "Gratulujeme!",
  open_project: "Otevřít projekt",
  issues: "Pracovní položky",
  cycles: "Cykly",
  modules: "Moduly",
  pages: "Stránky",
  intake: "Příjem",
  time_tracking: "Sledování času",
  work_management: "Správa práce",
  projects_and_issues: "Projekty a pracovní položky",
  projects_and_issues_description: "Aktivujte nebo deaktivujte tyto funkce v projektu.",
  cycles_description:
    "Časově vymezte práci podle projektu a podle potřeby upravte období. Jeden cyklus může trvat 2 týdny, další jen 1 týden.",
  modules_description: "Organizujte práci do podprojektů s vyhrazenými vedoucími a přiřazenými osobami.",
  views_description: "Uložte vlastní řazení, filtry a možnosti zobrazení nebo je sdílejte se svým týmem.",
  pages_description: "Vytvářejte a upravujte volně strukturovaný obsah – poznámky, dokumenty, cokoli.",
  intake_description: "Umožněte nečlenům sdílet chyby, zpětnou vazbu a návrhy, aniž by narušili váš pracovní postup.",
  time_tracking_description: "Zaznamenávejte čas strávený na pracovních položkách a projektech.",
  work_management_description: "Spravujte svou práci a projekty snadno.",
  documentation: "Dokumentace",
  message_support: "Kontaktovat podporu",
  contact_sales: "Kontaktovat prodej",
  hyper_mode: "Hyper režim",
  keyboard_shortcuts: "Klávesové zkratky",
  whats_new: "Co je nového?",
  version: "Verze",
  we_are_having_trouble_fetching_the_updates: "Máme potíže s načítáním aktualizací.",
  our_changelogs: "naše změnové protokoly",
  for_the_latest_updates: "pro nejnovější aktualizace.",
  please_visit: "Navštivte",
  docs: "Dokumentace",
  full_changelog: "Úplný změnový protokol",
  support: "Podpora",
  discord: "Discord",
  powered_by_plane_pages: "Poháněno Plane Pages",
  please_select_at_least_one_invitation: "Vyberte alespoň jednu pozvánku.",
  please_select_at_least_one_invitation_description:
    "Vyberte alespoň jednu pozvánku pro připojení k pracovnímu prostoru.",
  we_see_that_someone_has_invited_you_to_join_a_workspace: "Vidíme, že vás někdo pozval do pracovního prostoru",
  join_a_workspace: "Připojit se k pracovnímu prostoru",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description:
    "Vidíme, že vás někdo pozval do pracovního prostoru",
  join_a_workspace_description: "Připojit se k pracovnímu prostoru",
  accept_and_join: "Přijmout a připojit se",
  go_home: "Domů",
  no_pending_invites: "Žádné čekající pozvánky",
  you_can_see_here_if_someone_invites_you_to_a_workspace: "Zde uvidíte, pokud vás někdo pozve do pracovního prostoru",
  back_to_home: "Zpět na domovskou stránku",
  workspace_name: "název-pracovního-prostoru",
  deactivate_your_account: "Deaktivovat váš účet",
  deactivate_your_account_description:
    "Po deaktivaci nebudete moci být přiřazeni k pracovním položkám a nebude vám účtován poplatek za pracovní prostor. Pro opětovnou aktivaci účtu budete potřebovat pozvánku do pracovního prostoru na tento e-mail.",
  deactivating: "Deaktivace",
  confirm: "Potvrdit",
  confirming: "Potvrzování",
  draft_created: "Koncept vytvořen",
  issue_created_successfully: "Pracovní položka úspěšně vytvořena",
  draft_creation_failed: "Vytvoření konceptu se nezdařilo",
  issue_creation_failed: "Vytvoření pracovní položky se nezdařilo",
  draft_issue: "Koncept pracovní položky",
  issue_updated_successfully: "Pracovní položka úspěšně aktualizována",
  issue_could_not_be_updated: "Aktualizace pracovní položky se nezdařila",
  create_a_draft: "Vytvořit koncept",
  save_to_drafts: "Uložit do konceptů",
  save: "Uložit",
  update: "Aktualizovat",
  updating: "Aktualizace",
  create_new_issue: "Vytvořit novou pracovní položku",
  editor_is_not_ready_to_discard_changes: "Editor není připraven zahodit změny",
  failed_to_move_issue_to_project: "Přesunutí pracovní položky do projektu se nezdařilo",
  create_more: "Vytvořit více",
  add_to_project: "Přidat do projektu",
  discard: "Zahodit",
  duplicate_issue_found: "Nalezena duplicitní pracovní položka",
  duplicate_issues_found: "Nalezeny duplicitní pracovní položky",
  no_matching_results: "Žádné odpovídající výsledky",
  title_is_required: "Název je povinný",
  title: "Název",
  state: "Stav",
  priority: "Priorita",
  none: "Žádná",
  urgent: "Naléhavá",
  high: "Vysoká",
  medium: "Střední",
  low: "Nízká",
  members: "Členové",
  assignee: "Přiřazeno",
  assignees: "Přiřazení",
  you: "Vy",
  labels: "Štítky",
  create_new_label: "Vytvořit nový štítek",
  start_date: "Datum začátku",
  end_date: "Datum ukončení",
  due_date: "Termín",
  estimate: "Odhad",
  change_parent_issue: "Změnit nadřazenou pracovní položku",
  remove_parent_issue: "Odebrat nadřazenou pracovní položku",
  add_parent: "Přidat nadřazenou",
  loading_members: "Načítání členů",
  view_link_copied_to_clipboard: "Odkaz na pohled zkopírován do schránky.",
  required: "Povinné",
  optional: "Volitelné",
  Cancel: "Zrušit",
  edit: "Upravit",
  archive: "Archivovat",
  restore: "Obnovit",
  open_in_new_tab: "Otevřít v nové záložce",
  delete: "Smazat",
  deleting: "Mazání",
  make_a_copy: "Vytvořit kopii",
  move_to_project: "Přesunout do projektu",
  good: "Dobrý",
  morning: "ráno",
  afternoon: "odpoledne",
  evening: "večer",
  show_all: "Zobrazit vše",
  show_less: "Zobrazit méně",
  no_data_yet: "Zatím žádná data",
  syncing: "Synchronizace",
  add_work_item: "Přidat pracovní položku",
  advanced_description_placeholder: "Stiskněte '/' pro příkazy",
  create_work_item: "Vytvořit pracovní položku",
  attachments: "Přílohy",
  declining: "Odmítání",
  declined: "Odmítnuto",
  decline: "Odmítnout",
  unassigned: "Nepřiřazeno",
  work_items: "Pracovní položky",
  add_link: "Přidat odkaz",
  points: "Body",
  no_assignee: "Žádné přiřazení",
  no_assignees_yet: "Zatím žádní přiřazení",
  no_labels_yet: "Zatím žádné štítky",
  ideal: "Ideální",
  current: "Aktuální",
  no_matching_members: "Žádní odpovídající členové",
  leaving: "Opouštění",
  removing: "Odebírání",
  leave: "Opustit",
  refresh: "Obnovit",
  refreshing: "Obnovování",
  refresh_status: "Obnovit stav",
  prev: "Předchozí",
  next: "Další",
  re_generating: "Znovu generování",
  re_generate: "Znovu generovat",
  re_generate_key: "Znovu generovat klíč",
  export: "Exportovat",
  member: "{count, plural, one{# člen} few{# členové} other{# členů}}",
  new_password_must_be_different_from_old_password: "Nové heslo musí být odlišné od starého hesla",
  project_view: {
    sort_by: {
      created_at: "Vytvořeno dne",
      updated_at: "Aktualizováno dne",
      name: "Název",
    },
  },
  toast: {
    success: "Úspěch!",
    error: "Chyba!",
  },
  links: {
    toasts: {
      created: {
        title: "Odkaz vytvořen",
        message: "Odkaz byl úspěšně vytvořen",
      },
      not_created: {
        title: "Odkaz nebyl vytvořen",
        message: "Odkaz se nepodařilo vytvořit",
      },
      updated: {
        title: "Odkaz aktualizován",
        message: "Odkaz byl úspěšně aktualizován",
      },
      not_updated: {
        title: "Odkaz nebyl aktualizován",
        message: "Odkaz se nepodařilo aktualizovat",
      },
      removed: {
        title: "Odkaz odstraněn",
        message: "Odkaz byl úspěšně odstraněn",
      },
      not_removed: {
        title: "Odkaz nebyl odstraněn",
        message: "Odkaz se nepodařilo odstranit",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "Váš průvodce rychlým startem",
      not_right_now: "Teď ne",
      create_project: {
        title: "Vytvořit projekt",
        description: "Většina věcí začíná projektem v Plane.",
        cta: "Začít",
      },
      invite_team: {
        title: "Pozvat tým",
        description: "Spolupracujte s kolegy na tvorbě, dodávkách a správě.",
        cta: "Pozvat je",
      },
      configure_workspace: {
        title: "Nastavte svůj pracovní prostor.",
        description: "Aktivujte nebo deaktivujte funkce nebo jděte dále.",
        cta: "Konfigurovat tento prostor",
      },
      personalize_account: {
        title: "Přizpůsobte si Plane.",
        description: "Vyberte si obrázek, barvy a další.",
        cta: "Personalizovat nyní",
      },
      widgets: {
        title: "Je ticho bez widgetů, zapněte je",
        description: "Vypadá to, že všechny vaše widgety jsou vypnuté. Zapněte je\npro lepší zážitek!",
        primary_button: {
          text: "Spravovat widgety",
        },
      },
    },
    quick_links: {
      empty: "Uložte si odkazy na důležité věci, které chcete mít po ruce.",
      add: "Přidat rychlý odkaz",
      title: "Rychlý odkaz",
      title_plural: "Rychlé odkazy",
    },
    recents: {
      title: "Nedávné",
      empty: {
        project: "Vaše nedávné projekty se zde zobrazí po návštěvě.",
        page: "Vaše nedávné stránky se zde zobrazí po návštěvě.",
        issue: "Vaše nedávné pracovní položky se zde zobrazí po návštěvě.",
        default: "Zatím nemáte žádné nedávné položky.",
      },
      filters: {
        all: "Vše",
        projects: "Projekty",
        pages: "Stránky",
        issues: "Úkoly",
      },
    },
    new_at_plane: {
      title: "Novinky v Plane",
    },
    quick_tutorial: {
      title: "Rychlý tutoriál",
    },
    widget: {
      reordered_successfully: "Widget úspěšně přesunut.",
      reordering_failed: "Při přesouvání widgetu došlo k chybě.",
    },
    manage_widgets: "Spravovat widgety",
    title: "Domů",
    star_us_on_github: "Ohodnoťte nás na GitHubu",
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "URL je neplatná",
        placeholder: "Zadejte nebo vložte URL",
      },
      title: {
        text: "Zobrazovaný název",
        placeholder: "Jak chcete tento odkaz vidět",
      },
    },
  },
  common: {
    all: "Vše",
    no_items_in_this_group: "V této skupině nejsou žádné položky",
    drop_here_to_move: "Přetáhněte sem pro přesunutí",
    states: "Stavy",
    state: "Stav",
    state_groups: "Skupiny stavů",
    state_group: "Skupina stavů",
    priorities: "Priority",
    priority: "Priorita",
    team_project: "Týmový projekt",
    project: "Projekt",
    cycle: "Cyklus",
    cycles: "Cykly",
    module: "Modul",
    modules: "Moduly",
    labels: "Štítky",
    label: "Štítek",
    assignees: "Přiřazení",
    assignee: "Přiřazeno",
    created_by: "Vytvořil",
    none: "Žádné",
    link: "Odkaz",
    estimates: "Odhady",
    estimate: "Odhad",
    created_at: "Vytvořeno dne",
    completed_at: "Dokončeno dne",
    layout: "Rozložení",
    filters: "Filtry",
    display: "Zobrazení",
    load_more: "Načíst více",
    activity: "Aktivita",
    analytics: "Analytika",
    dates: "Data",
    success: "Úspěch!",
    something_went_wrong: "Něco se pokazilo",
    error: {
      label: "Chyba!",
      message: "Došlo k chybě. Zkuste to prosím znovu.",
    },
    group_by: "Seskupit podle",
    epic: "Epika",
    epics: "Epiky",
    work_item: "Pracovní položka",
    work_items: "Pracovní položky",
    sub_work_item: "Podřízená pracovní položka",
    add: "Přidat",
    warning: "Varování",
    updating: "Aktualizace",
    adding: "Přidávání",
    update: "Aktualizovat",
    creating: "Vytváření",
    create: "Vytvořit",
    cancel: "Zrušit",
    description: "Popis",
    title: "Název",
    attachment: "Příloha",
    general: "Obecné",
    features: "Funkce",
    automation: "Automatizace",
    project_name: "Název projektu",
    project_id: "ID projektu",
    project_timezone: "Časové pásmo projektu",
    created_on: "Vytvořeno dne",
    update_project: "Aktualizovat projekt",
    identifier_already_exists: "Identifikátor již existuje",
    add_more: "Přidat více",
    defaults: "Výchozí",
    add_label: "Přidat štítek",
    customize_time_range: "Přizpůsobit časový rozsah",
    loading: "Načítání",
    attachments: "Přílohy",
    property: "Vlastnost",
    properties: "Vlastnosti",
    parent: "Nadřazený",
    page: "Stránka",
    remove: "Odebrat",
    archiving: "Archivace",
    archive: "Archivovat",
    access: {
      public: "Veřejný",
      private: "Soukromý",
    },
    done: "Hotovo",
    sub_work_items: "Podřízené pracovní položky",
    comment: "Komentář",
    workspace_level: "Úroveň pracovního prostoru",
    order_by: {
      label: "Řadit podle",
      manual: "Ručně",
      last_created: "Naposledy vytvořené",
      last_updated: "Naposledy aktualizované",
      start_date: "Datum začátku",
      due_date: "Termín",
      asc: "Vzestupně",
      desc: "Sestupně",
      updated_on: "Aktualizováno dne",
    },
    sort: {
      asc: "Vzestupně",
      desc: "Sestupně",
      created_on: "Vytvořeno dne",
      updated_on: "Aktualizováno dne",
    },
    comments: "Komentáře",
    updates: "Aktualizace",
    clear_all: "Vymazat vše",
    copied: "Zkopírováno!",
    link_copied: "Odkaz zkopírován!",
    link_copied_to_clipboard: "Odkaz zkopírován do schránky",
    copied_to_clipboard: "Odkaz na pracovní položku zkopírován do schránky",
    is_copied_to_clipboard: "Pracovní položka zkopírována do schránky",
    no_links_added_yet: "Zatím nejsou přidány žádné odkazy",
    add_link: "Přidat odkaz",
    links: "Odkazy",
    go_to_workspace: "Přejít do pracovního prostoru",
    progress: "Pokrok",
    optional: "Volitelné",
    join: "Připojit se",
    go_back: "Zpět",
    continue: "Pokračovat",
    resend: "Znovu odeslat",
    relations: "Vztahy",
    errors: {
      default: {
        title: "Chyba!",
        message: "Něco se pokazilo. Zkuste to prosím znovu.",
      },
      required: "Toto pole je povinné",
      entity_required: "{entity} je povinná",
      restricted_entity: "{entity} je omezen",
    },
    update_link: "Aktualizovat odkaz",
    attach: "Připojit",
    create_new: "Vytvořit nový",
    add_existing: "Přidat existující",
    type_or_paste_a_url: "Zadejte nebo vložte URL",
    url_is_invalid: "URL je neplatná",
    display_title: "Zobrazovaný název",
    link_title_placeholder: "Jak chcete tento odkaz vidět",
    url: "URL",
    side_peek: "Postranní náhled",
    modal: "Modální okno",
    full_screen: "Celá obrazovka",
    close_peek_view: "Zavřít náhled",
    toggle_peek_view_layout: "Přepnout rozložení náhledu",
    options: "Možnosti",
    duration: "Trvání",
    today: "Dnes",
    week: "Týden",
    month: "Měsíc",
    quarter: "Čtvrtletí",
    press_for_commands: "Stiskněte '/' pro příkazy",
    click_to_add_description: "Klikněte pro přidání popisu",
    search: {
      label: "Hledat",
      placeholder: "Zadejte hledaný výraz",
      no_matches_found: "Nenalezeny žádné shody",
      no_matching_results: "Žádné odpovídající výsledky",
    },
    actions: {
      edit: "Upravit",
      make_a_copy: "Vytvořit kopii",
      open_in_new_tab: "Otevřít v nové záložce",
      copy_link: "Kopírovat odkaz",
      archive: "Archivovat",
      restore: "Obnovit",
      delete: "Smazat",
      remove_relation: "Odebrat vztah",
      subscribe: "Odebírat",
      unsubscribe: "Zrušit odběr",
      clear_sorting: "Vymazat řazení",
      show_weekends: "Zobrazit víkendy",
      enable: "Povolit",
      disable: "Zakázat",
    },
    name: "Název",
    discard: "Zahodit",
    confirm: "Potvrdit",
    confirming: "Potvrzování",
    read_the_docs: "Přečtěte si dokumentaci",
    default: "Výchozí",
    active: "Aktivní",
    enabled: "Povoleno",
    disabled: "Zakázáno",
    mandate: "Mandát",
    mandatory: "Povinné",
    yes: "Ano",
    no: "Ne",
    please_wait: "Prosím čekejte",
    enabling: "Povolování",
    disabling: "Zakazování",
    beta: "Beta",
    or: "nebo",
    next: "Další",
    back: "Zpět",
    cancelling: "Rušení",
    configuring: "Konfigurace",
    clear: "Vymazat",
    import: "Importovat",
    connect: "Připojit",
    authorizing: "Autorizace",
    processing: "Zpracování",
    no_data_available: "Nejsou k dispozici žádná data",
    from: "od {name}",
    authenticated: "Ověřeno",
    select: "Vybrat",
    upgrade: "Upgradovat",
    add_seats: "Přidat místa",
    projects: "Projekty",
    workspace: "Pracovní prostor",
    workspaces: "Pracovní prostory",
    team: "Tým",
    teams: "Týmy",
    entity: "Entita",
    entities: "Entity",
    task: "Úkol",
    tasks: "Úkoly",
    section: "Sekce",
    sections: "Sekce",
    edit: "Upravit",
    connecting: "Připojování",
    connected: "Připojeno",
    disconnect: "Odpojit",
    disconnecting: "Odpojování",
    installing: "Instalace",
    install: "Nainstalovat",
    reset: "Resetovat",
    live: "Živě",
    change_history: "Historie změn",
    coming_soon: "Již brzy",
    member: "Člen",
    members: "Členové",
    you: "Vy",
    upgrade_cta: {
      higher_subscription: "Upgradovat na vyšší předplatné",
      talk_to_sales: "Promluvte si s prodejem",
    },
    category: "Kategorie",
    categories: "Kategorie",
    saving: "Ukládání",
    save_changes: "Uložit změny",
    delete: "Smazat",
    deleting: "Mazání",
    pending: "Čekající",
    invite: "Pozvat",
    view: "Pohled",
    deactivated_user: "Deaktivovaný uživatel",
    apply: "Použít",
    applying: "Používání",
    users: "Uživatelé",
    admins: "Administrátoři",
    guests: "Hosté",
    on_track: "Na správné cestě",
    off_track: "Mimo plán",
    at_risk: "V ohrožení",
    timeline: "Časová osa",
    completion: "Dokončení",
    upcoming: "Nadcházející",
    completed: "Dokončeno",
    in_progress: "Probíhá",
    planned: "Plánováno",
    paused: "Pozastaveno",
    no_of: "Počet {entity}",
    resolved: "Vyřešeno",
  },
  chart: {
    x_axis: "Osa X",
    y_axis: "Osa Y",
    metric: "Metrika",
  },
  form: {
    title: {
      required: "Název je povinný",
      max_length: "Název by měl být kratší než {length} znaků",
    },
  },
  entity: {
    grouping_title: "Seskupení {entity}",
    priority: "Priorita {entity}",
    all: "Všechny {entity}",
    drop_here_to_move: "Přetáhněte sem pro přesunutí {entity}",
    delete: {
      label: "Smazat {entity}",
      success: "{entity} úspěšně smazána",
      failed: "Mazání {entity} se nezdařilo",
    },
    update: {
      failed: "Aktualizace {entity} se nezdařila",
      success: "{entity} úspěšně aktualizována",
    },
    link_copied_to_clipboard: "Odkaz na {entity} zkopírován do schránky",
    fetch: {
      failed: "Chyba při načítání {entity}",
    },
    add: {
      success: "{entity} úspěšně přidána",
      failed: "Chyba při přidávání {entity}",
    },
    remove: {
      success: "{entity} úspěšně odebrána",
      failed: "Chyba při odebírání {entity}",
    },
  },
  epic: {
    all: "Všechny epiky",
    label: "{count, plural, one {Epik} other {Epiky}}",
    new: "Nový epik",
    adding: "Přidávám epik",
    create: {
      success: "Epik úspěšně vytvořen",
    },
    add: {
      press_enter: "Pro přidání dalšího epiku stiskněte 'Enter'",
      label: "Přidat epik",
    },
    title: {
      label: "Název epiku",
      required: "Název epiku je povinný.",
    },
  },
  issue: {
    label: "{count, plural, one {Pracovní položka} few {Pracovní položky} other {Pracovních položek}}",
    all: "Všechny pracovní položky",
    edit: "Upravit pracovní položku",
    title: {
      label: "Název pracovní položky",
      required: "Název pracovní položky je povinný.",
    },
    add: {
      press_enter: "Stiskněte 'Enter' pro přidání další pracovní položky",
      label: "Přidat pracovní položku",
      cycle: {
        failed: "Přidání pracovní položky do cyklu se nezdařilo. Zkuste to prosím znovu.",
        success:
          "{count, plural, one {Pracovní položka} few {Pracovní položky} other {Pracovních položek}} přidána do cyklu.",
        loading:
          "Přidávání {count, plural, one {pracovní položky} few {pracovních položek} other {pracovních položek}} do cyklu",
      },
      assignee: "Přidat přiřazené",
      start_date: "Přidat datum začátku",
      due_date: "Přidat termín",
      parent: "Přidat nadřazenou pracovní položku",
      sub_issue: "Přidat podřízenou pracovní položku",
      relation: "Přidat vztah",
      link: "Přidat odkaz",
      existing: "Přidat existující pracovní položku",
    },
    remove: {
      label: "Odebrat pracovní položku",
      cycle: {
        loading: "Odebírání pracovní položky z cyklu",
        success: "Pracovní položka odebrána z cyklu.",
        failed: "Odebrání pracovní položky z cyklu se nezdařilo. Zkuste to prosím znovu.",
      },
      module: {
        loading: "Odebírání pracovní položky z modulu",
        success: "Pracovní položka odebrána z modulu.",
        failed: "Odebrání pracovní položky z modulu se nezdařilo. Zkuste to prosím znovu.",
      },
      parent: {
        label: "Odebrat nadřazenou pracovní položku",
      },
    },
    new: "Nová pracovní položka",
    adding: "Přidávání pracovní položky",
    create: {
      success: "Pracovní položka úspěšně vytvořena",
    },
    priority: {
      urgent: "Naléhavá",
      high: "Vysoká",
      medium: "Střední",
      low: "Nízká",
    },
    display: {
      properties: {
        label: "Zobrazované vlastnosti",
        id: "ID",
        issue_type: "Typ pracovní položky",
        sub_issue_count: "Počet podřízených položek",
        attachment_count: "Počet příloh",
        created_on: "Vytvořeno dne",
        sub_issue: "Podřízená položka",
        work_item_count: "Počet pracovních položek",
      },
      extra: {
        show_sub_issues: "Zobrazit podřízené položky",
        show_empty_groups: "Zobrazit prázdné skupiny",
      },
    },
    layouts: {
      ordered_by_label: "Toto rozložení je řazeno podle",
      list: "Seznam",
      kanban: "Nástěnka",
      calendar: "Kalendář",
      spreadsheet: "Tabulka",
      gantt: "Časová osa",
      title: {
        list: "Seznamové rozložení",
        kanban: "Nástěnkové rozložení",
        calendar: "Kalendářové rozložení",
        spreadsheet: "Tabulkové rozložení",
        gantt: "Rozložení časové osy",
      },
    },
    states: {
      active: "Aktivní",
      backlog: "Backlog",
    },
    comments: {
      placeholder: "Přidat komentář",
      switch: {
        private: "Přepnout na soukromý komentář",
        public: "Přepnout na veřejný komentář",
      },
      create: {
        success: "Komentář úspěšně vytvořen",
        error: "Vytvoření komentáře se nezdařilo. Zkuste to prosím později.",
      },
      update: {
        success: "Komentář úspěšně aktualizován",
        error: "Aktualizace komentáře se nezdařila. Zkuste to prosím později.",
      },
      remove: {
        success: "Komentář úspěšně odstraněn",
        error: "Odstranění komentáře se nezdařilo. Zkuste to prosím později.",
      },
      upload: {
        error: "Nahrání přílohy se nezdařilo. Zkuste to prosím později.",
      },
      copy_link: {
        success: "Odkaz na komentář byl zkopírován do schránky",
        error: "Chyba při kopírování odkazu na komentář. Zkuste to prosím později.",
      },
    },
    empty_state: {
      issue_detail: {
        title: "Pracovní položka neexistuje",
        description: "Pracovní položka, kterou hledáte, neexistuje, byla archivována nebo smazána.",
        primary_button: {
          text: "Zobrazit další pracovní položky",
        },
      },
    },
    sibling: {
      label: "Související pracovní položky",
    },
    archive: {
      description: "Lze archivovat pouze dokončené nebo zrušené\npracovní položky",
      label: "Archivovat pracovní položku",
      confirm_message:
        "Opravdu chcete archivovat tuto pracovní položku? Všechny archivované položky lze později obnovit.",
      success: {
        label: "Archivace úspěšná",
        message: "Vaše archivy najdete v archivech projektu.",
      },
      failed: {
        message: "Archivace pracovní položky se nezdařila. Zkuste to prosím znovu.",
      },
    },
    restore: {
      success: {
        title: "Obnovení úspěšné",
        message: "Vaše pracovní položka je k nalezení v pracovních položkách projektu.",
      },
      failed: {
        message: "Obnovení pracovní položky se nezdařilo. Zkuste to prosím znovu.",
      },
    },
    relation: {
      relates_to: "Související s",
      duplicate: "Duplikát",
      blocked_by: "Blokováno",
      blocking: "Blokující",
    },
    copy_link: "Kopírovat odkaz na pracovní položku",
    delete: {
      label: "Smazat pracovní položku",
      error: "Chyba při mazání pracovní položky",
    },
    subscription: {
      actions: {
        subscribed: "Pracovní položka úspěšně přihlášena k odběru",
        unsubscribed: "Odběr pracovní položky zrušen",
      },
    },
    select: {
      error: "Vyberte alespoň jednu pracovní položku",
      empty: "Nevybrány žádné pracovní položky",
      add_selected: "Přidat vybrané pracovní položky",
      select_all: "Vybrat vše",
      deselect_all: "Zrušit výběr všeho",
    },
    open_in_full_screen: "Otevřít pracovní položku na celou obrazovku",
  },
  attachment: {
    error: "Soubor nelze připojit. Zkuste to prosím znovu.",
    only_one_file_allowed: "Je možné nahrát pouze jeden soubor najednou.",
    file_size_limit: "Soubor musí být menší než {size}MB.",
    drag_and_drop: "Přetáhněte soubor kamkoli pro nahrání",
    delete: "Smazat přílohu",
  },
  label: {
    select: "Vybrat štítek",
    create: {
      success: "Štítek úspěšně vytvořen",
      failed: "Vytvoření štítku se nezdařilo",
      already_exists: "Štítek již existuje",
      type: "Zadejte pro vytvoření nového štítku",
    },
  },
  sub_work_item: {
    update: {
      success: "Podřízená pracovní položka úspěšně aktualizována",
      error: "Chyba při aktualizaci podřízené položky",
    },
    remove: {
      success: "Podřízená pracovní položka úspěšně odebrána",
      error: "Chyba při odebírání podřízené položky",
    },
    empty_state: {
      sub_list_filters: {
        title: "Nemáte podřízené pracovní položky, které odpovídají použitým filtrům.",
        description: "Chcete-li zobrazit všechny podřízené pracovní položky, odstraňte všechny použité filtry.",
        action: "Odstranit filtry",
      },
      list_filters: {
        title: "Nemáte pracovní položky, které odpovídají použitým filtrům.",
        description: "Chcete-li zobrazit všechny pracovní položky, odstraňte všechny použité filtry.",
        action: "Odstranit filtry",
      },
    },
  },
  view: {
    label: "{count, plural, one {Pohled} few {Pohledy} other {Pohledů}}",
    create: {
      label: "Vytvořit pohled",
    },
    update: {
      label: "Aktualizovat pohled",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "Čekající",
        description: "Čekající",
      },
      declined: {
        title: "Odmítnuto",
        description: "Odmítnuto",
      },
      snoozed: {
        title: "Odloženo",
        description: "Zbývá {days, plural, one{# den} few{# dny} other{# dnů}}",
      },
      accepted: {
        title: "Přijato",
        description: "Přijato",
      },
      duplicate: {
        title: "Duplikát",
        description: "Duplikát",
      },
    },
    modals: {
      decline: {
        title: "Odmítnout pracovní položku",
        content: "Opravdu chcete odmítnout pracovní položku {value}?",
      },
      delete: {
        title: "Smazat pracovní položku",
        content: "Opravdu chcete smazat pracovní položku {value}?",
        success: "Pracovní položka úspěšně smazána",
      },
    },
    errors: {
      snooze_permission: "Pouze správci projektu mohou odkládat/zrušit odložení pracovních položek",
      accept_permission: "Pouze správci projektu mohou přijímat pracovní položky",
      decline_permission: "Pouze správci projektu mohou odmítnout pracovní položky",
    },
    actions: {
      accept: "Přijmout",
      decline: "Odmítnout",
      snooze: "Odložit",
      unsnooze: "Zrušit odložení",
      copy: "Kopírovat odkaz na pracovní položku",
      delete: "Smazat",
      open: "Otevřít pracovní položku",
      mark_as_duplicate: "Označit jako duplikát",
      move: "Přesunout {value} do pracovních položek projektu",
    },
    source: {
      "in-app": "v aplikaci",
    },
    order_by: {
      created_at: "Vytvořeno dne",
      updated_at: "Aktualizováno dne",
      id: "ID",
    },
    label: "Příjem",
    page_label: "{workspace} - Příjem",
    modal: {
      title: "Vytvořit přijatou pracovní položku",
    },
    tabs: {
      open: "Otevřené",
      closed: "Uzavřené",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "Žádné otevřené pracovní položky",
        description: "Zde najdete otevřené pracovní položky. Vytvořte novou.",
      },
      sidebar_closed_tab: {
        title: "Žádné uzavřené pracovní položky",
        description: "Všechny přijaté nebo odmítnuté pracovní položky najdete zde.",
      },
      sidebar_filter: {
        title: "Žádné odpovídající pracovní položky",
        description: "Žádná položka neodpovídá filtru v příjmu. Vytvořte novou.",
      },
      detail: {
        title: "Vyberte pracovní položku pro zobrazení podrobností.",
      },
    },
  },
  workspace_creation: {
    heading: "Vytvořte si pracovní prostor",
    subheading: "Pro používání Plane musíte vytvořit nebo se připojit k pracovnímu prostoru.",
    form: {
      name: {
        label: "Pojmenujte svůj pracovní prostor",
        placeholder: "Vhodné je použít něco známého a rozpoznatelného.",
      },
      url: {
        label: "Nastavte URL vašeho prostoru",
        placeholder: "Zadejte nebo vložte URL",
        edit_slug: "Můžete upravit pouze část URL (slug)",
      },
      organization_size: {
        label: "Kolik lidí bude tento prostor používat?",
        placeholder: "Vyberte rozsah",
      },
    },
    errors: {
      creation_disabled: {
        title: "Pouze správce instance může vytvářet pracovní prostory",
        description: "Pokud znáte e-mail správce instance, klikněte na tlačítko níže pro kontakt.",
        request_button: "Požádat správce instance",
      },
      validation: {
        name_alphanumeric: "Názvy pracovních prostorů mohou obsahovat pouze (' '), ('-'), ('_') a alfanumerické znaky.",
        name_length: "Název omezen na 80 znaků.",
        url_alphanumeric: "URL mohou obsahovat pouze ('-') a alfanumerické znaky.",
        url_length: "URL omezena na 48 znaků.",
        url_already_taken: "URL pracovního prostoru je již obsazena!",
      },
    },
    request_email: {
      subject: "Žádost o nový pracovní prostor",
      body: "Ahoj správci,\n\nProsím vytvořte nový pracovní prostor s URL [/workspace-name] pro [účel vytvoření].\n\nDíky,\n{firstName} {lastName}\n{email}",
    },
    button: {
      default: "Vytvořit pracovní prostor",
      loading: "Vytváření pracovního prostoru",
    },
    toast: {
      success: {
        title: "Úspěch",
        message: "Pracovní prostor úspěšně vytvořen",
      },
      error: {
        title: "Chyba",
        message: "Vytvoření pracovního prostoru se nezdařilo. Zkuste to prosím znovu.",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "Přehled projektů, aktivit a metrik",
        description:
          "Vítejte v Plane, jsme rádi, že jste zde. Vytvořte první projekt, sledujte pracovní položky a tato stránka se promění v prostor pro váš pokrok. Správci zde uvidí i položky pomáhající týmu.",
        primary_button: {
          text: "Vytvořte první projekt",
          comic: {
            title: "Vše začíná projektem v Plane",
            description: "Projektem může být roadmapa produktu, marketingová kampaň nebo uvedení nového auta.",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "Analytika",
    page_label: "{workspace} - Analytika",
    open_tasks: "Celkem otevřených úkolů",
    error: "Při načítání dat došlo k chybě.",
    work_items_closed_in: "Pracovní položky uzavřené v",
    selected_projects: "Vybrané projekty",
    total_members: "Celkem členů",
    total_cycles: "Celkem cyklů",
    total_modules: "Celkem modulů",
    pending_work_items: {
      title: "Čekající pracovní položky",
      empty_state: "Zde se zobrazí analýza čekajících položek podle spolupracovníků.",
    },
    work_items_closed_in_a_year: {
      title: "Pracovní položky uzavřené v roce",
      empty_state: "Uzavírejte položky pro zobrazení analýzy v grafu.",
    },
    most_work_items_created: {
      title: "Nejvíce vytvořených položek",
      empty_state: "Zobrazí se spolupracovníci a počet jimi vytvořených položek.",
    },
    most_work_items_closed: {
      title: "Nejvíce uzavřených položek",
      empty_state: "Zobrazí se spolupracovníci a počet jimi uzavřených položek.",
    },
    tabs: {
      scope_and_demand: "Rozsah a poptávka",
      custom: "Vlastní analytika",
    },
    empty_state: {
      customized_insights: {
        description: "Pracovní položky přiřazené vám, rozdělené podle stavu, se zde zobrazí.",
        title: "Zatím žádná data",
      },
      created_vs_resolved: {
        description: "Pracovní položky vytvořené a vyřešené v průběhu času se zde zobrazí.",
        title: "Zatím žádná data",
      },
      project_insights: {
        title: "Zatím žádná data",
        description: "Pracovní položky přiřazené vám, rozdělené podle stavu, se zde zobrazí.",
      },
      general: {
        title: "Sledujte pokrok, pracovní zátěž a alokace. Odhalte trendy, odstraňte překážky a zrychlete práci",
        description:
          "Porovnávejte rozsah s poptávkou, odhady a rozšiřování rozsahu. Získejte výkonnost podle členů týmu a týmů a zajistěte, aby váš projekt běžel včas.",
        primary_button: {
          text: "Začněte svůj první projekt",
          comic: {
            title: "Analytika funguje nejlépe s Cykly + Moduly",
            description:
              "Nejprve časově ohraničte své problémy do Cyklů a pokud můžete, seskupte problémy, které trvají déle než jeden cyklus, do Modulů. Podívejte se na obojí v levé navigaci.",
          },
        },
      },
    },
    created_vs_resolved: "Vytvořeno vs Vyřešeno",
    customized_insights: "Přizpůsobené přehledy",
    backlog_work_items: "Backlog {entity}",
    active_projects: "Aktivní projekty",
    trend_on_charts: "Trend na grafech",
    all_projects: "Všechny projekty",
    summary_of_projects: "Souhrn projektů",
    project_insights: "Přehled projektu",
    started_work_items: "Zahájené {entity}",
    total_work_items: "Celkový počet {entity}",
    total_projects: "Celkový počet projektů",
    total_admins: "Celkový počet administrátorů",
    total_users: "Celkový počet uživatelů",
    total_intake: "Celkový příjem",
    un_started_work_items: "Nezahájené {entity}",
    total_guests: "Celkový počet hostů",
    completed_work_items: "Dokončené {entity}",
    total: "Celkový počet {entity}",
  },
  workspace_projects: {
    label: "{count, plural, one {Projekt} few {Projekty} other {Projektů}}",
    create: {
      label: "Přidat projekt",
    },
    network: {
      label: "Síť",
      private: {
        title: "Soukromý",
        description: "Přístupné pouze na pozvání",
      },
      public: {
        title: "Veřejný",
        description: "Kdokoli v prostoru kromě hostů se může připojit",
      },
    },
    error: {
      permission: "Nemáte oprávnění k této akci.",
      cycle_delete: "Odstranění cyklu se nezdařilo",
      module_delete: "Odstranění modulu se nezdařilo",
      issue_delete: "Odstranění pracovní položky se nezdařilo",
    },
    state: {
      backlog: "Backlog",
      unstarted: "Nezačato",
      started: "Zahájeno",
      completed: "Dokončeno",
      cancelled: "Zrušeno",
    },
    sort: {
      manual: "Ručně",
      name: "Název",
      created_at: "Datum vytvoření",
      members_length: "Počet členů",
    },
    scope: {
      my_projects: "Moje projekty",
      archived_projects: "Archivované",
    },
    common: {
      months_count: "{months, plural, one{# měsíc} few{# měsíce} other{# měsíců}}",
    },
    empty_state: {
      general: {
        title: "Žádné aktivní projekty",
        description:
          "Projekt je nadřazený cílům. Projekty obsahují Úkoly, Cykly a Moduly. Vytvořte nový nebo filtrujte archivované.",
        primary_button: {
          text: "Začněte první projekt",
          comic: {
            title: "Vše začíná projektem v Plane",
            description: "Projektem může být roadmapa produktu, marketingová kampaň nebo uvedení nového auta.",
          },
        },
      },
      no_projects: {
        title: "Žádné projekty",
        description: "Pro vytváření pracovních položek potřebujete vytvořit nebo být součástí projektu.",
        primary_button: {
          text: "Začněte první projekt",
          comic: {
            title: "Vše začíná projektem v Plane",
            description: "Projektem může být roadmapa produktu, marketingová kampaň nebo uvedení nového auta.",
          },
        },
      },
      filter: {
        title: "Žádné odpovídající projekty",
        description: "Nenalezeny projekty odpovídající kritériím. \n Vytvořte nový.",
      },
      search: {
        description: "Nenalezeny projekty odpovídající kritériím.\nVytvořte nový.",
      },
    },
  },
  workspace_views: {
    add_view: "Přidat pohled",
    empty_state: {
      "all-issues": {
        title: "Žádné pracovní položky v projektu",
        description: "Vytvořte první položku a sledujte svůj pokrok!",
        primary_button: {
          text: "Vytvořit pracovní položku",
        },
      },
      assigned: {
        title: "Žádné přiřazené položky",
        description: "Zde uvidíte položky přiřazené vám.",
        primary_button: {
          text: "Vytvořit pracovní položku",
        },
      },
      created: {
        title: "Žádné vytvořené položky",
        description: "Zde jsou položky, které jste vytvořili.",
        primary_button: {
          text: "Vytvořit pracovní položku",
        },
      },
      subscribed: {
        title: "Žádné odebírané položky",
        description: "Přihlaste se k odběru položek, které vás zajímají.",
      },
      "custom-view": {
        title: "Žádné odpovídající položky",
        description: "Zobrazí se položky odpovídající filtru.",
      },
    },
    delete_view: {
      title: "Opravdu chcete smazat tento pohled?",
      content:
        "Pokud potvrdíte, všechny možnosti řazení, filtrování a zobrazení + rozvržení, které jste vybrali pro tento pohled, budou trvale odstraněny a nelze je obnovit.",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "Změnit e-mail",
        description: "Zadejte novou e-mailovou adresu a obdržíte ověřovací odkaz.",
        toasts: {
          success_title: "Úspěch!",
          success_message: "E-mail byl úspěšně aktualizován. Přihlaste se znovu.",
        },
        form: {
          email: {
            label: "Nový e-mail",
            placeholder: "Zadejte svůj e-mail",
            errors: {
              required: "E-mail je povinný",
              invalid: "E-mail je neplatný",
              exists: "E-mail již existuje. Použijte jiný.",
              validation_failed: "Ověření e-mailu se nezdařilo. Zkuste to znovu.",
            },
          },
          code: {
            label: "Jedinečný kód",
            placeholder: "123456",
            helper_text: "Ověřovací kód byl odeslán na váš nový e-mail.",
            errors: {
              required: "Jedinečný kód je povinný",
              invalid: "Neplatný ověřovací kód. Zkuste to znovu.",
            },
          },
        },
        actions: {
          continue: "Pokračovat",
          confirm: "Potvrdit",
          cancel: "Zrušit",
        },
        states: {
          sending: "Odesílání…",
        },
      },
    },
  },
  workspace_settings: {
    label: "Nastavení pracovního prostoru",
    page_label: "{workspace} - Obecná nastavení",
    key_created: "Klíč vytvořen",
    copy_key:
      "Zkopírujte a uložte tento klíč do Plane Pages. Po zavření jej neuvidíte. CSV soubor s klíčem byl stažen.",
    token_copied: "Token zkopírován do schránky.",
    settings: {
      general: {
        title: "Obecné",
        upload_logo: "Nahrát logo",
        edit_logo: "Upravit logo",
        name: "Název pracovního prostoru",
        company_size: "Velikost společnosti",
        url: "URL pracovního prostoru",
        workspace_timezone: "Časové pásmo pracovního prostoru",
        update_workspace: "Aktualizovat prostor",
        delete_workspace: "Smazat tento prostor",
        delete_workspace_description: "Smazáním prostoru odstraníte všechna data a zdroje. Akce je nevratná.",
        delete_btn: "Smazat prostor",
        delete_modal: {
          title: "Opravdu chcete smazat tento prostor?",
          description: "Máte aktivní zkušební verzi. Nejprve ji zrušte.",
          dismiss: "Zavřít",
          cancel: "Zrušit zkušební verzi",
          success_title: "Prostor smazán.",
          success_message: "Budete přesměrováni na profil.",
          error_title: "Nepodařilo se.",
          error_message: "Zkuste to prosím znovu.",
        },
        errors: {
          name: {
            required: "Název je povinný",
            max_length: "Název prostoru nesmí přesáhnout 80 znaků",
          },
          company_size: {
            required: "Velikost společnosti je povinná",
            select_a_range: "Vyberte velikost organizace",
          },
        },
      },
      members: {
        title: "Členové",
        add_member: "Přidat člena",
        pending_invites: "Čekající pozvánky",
        invitations_sent_successfully: "Pozvánky úspěšně odeslány",
        leave_confirmation: "Opravdu chcete opustit prostor? Ztratíte přístup. Akce je nevratná.",
        details: {
          full_name: "Celé jméno",
          display_name: "Zobrazované jméno",
          email_address: "E-mailová adresa",
          account_type: "Typ účtu",
          authentication: "Ověřování",
          joining_date: "Datum připojení",
        },
        modal: {
          title: "Pozvat spolupracovníky",
          description: "Pozvěte lidi ke spolupráci.",
          button: "Odeslat pozvánky",
          button_loading: "Odesílání pozvánek",
          placeholder: "jmeno@spolecnost.cz",
          errors: {
            required: "Vyžaduje se e-mailová adresa.",
            invalid: "E-mail je neplatný",
          },
        },
      },
      billing_and_plans: {
        title: "Fakturace a plány",
        current_plan: "Aktuální plán",
        free_plan: "Používáte bezplatný plán",
        view_plans: "Zobrazit plány",
      },
      exports: {
        title: "Exporty",
        exporting: "Exportování",
        previous_exports: "Předchozí exporty",
        export_separate_files: "Exportovat data do samostatných souborů",
        filters_info: "Použijte filtry k exportu konkrétních pracovních položek podle vašich kritérií.",
        modal: {
          title: "Exportovat do",
          toasts: {
            success: {
              title: "Export úspěšný",
              message: "Exportované {entity} si můžete stáhnout z předchozího exportu.",
            },
            error: {
              title: "Export selhal",
              message: "Zkuste to prosím znovu.",
            },
          },
        },
      },
      webhooks: {
        title: "Webhooky",
        add_webhook: "Přidat webhook",
        modal: {
          title: "Vytvořit webhook",
          details: "Podrobnosti webhooku",
          payload: "URL pro payload",
          question: "Které události mají spustit tento webhook?",
          error: "URL je povinná",
        },
        secret_key: {
          title: "Tajný klíč",
          message: "Vygenerujte token pro přihlášení k webhooku",
        },
        options: {
          all: "Posílat vše",
          individual: "Vybrat jednotlivé události",
        },
        toasts: {
          created: {
            title: "Webhook vytvořen",
            message: "Webhook úspěšně vytvořen",
          },
          not_created: {
            title: "Webhook nebyl vytvořen",
            message: "Vytvoření webhooku se nezdařilo",
          },
          updated: {
            title: "Webhook aktualizován",
            message: "Webhook úspěšně aktualizován",
          },
          not_updated: {
            title: "Aktualizace webhooku selhala",
            message: "Webhook se nepodařilo aktualizovat",
          },
          removed: {
            title: "Webhook odstraněn",
            message: "Webhook úspěšně odstraněn",
          },
          not_removed: {
            title: "Odstranění webhooku selhalo",
            message: "Webhook se nepodařilo odstranit",
          },
          secret_key_copied: {
            message: "Tajný klíč zkopírován do schránky.",
          },
          secret_key_not_copied: {
            message: "Chyba při kopírování klíče.",
          },
        },
      },
      api_tokens: {
        title: "API Tokeny",
        add_token: "Přidat API token",
        create_token: "Vytvořit token",
        never_expires: "Nikdy neexpiruje",
        generate_token: "Generovat token",
        generating: "Generování",
        delete: {
          title: "Smazat API token",
          description: "Aplikace používající tento token ztratí přístup. Akce je nevratná.",
          success: {
            title: "Úspěch!",
            message: "Token úspěšně smazán",
          },
          error: {
            title: "Chyba!",
            message: "Mazání tokenu selhalo",
          },
        },
      },
    },
    empty_state: {
      api_tokens: {
        title: "Žádné API tokeny",
        description: "Používejte API pro integraci Plane s externími systémy.",
      },
      webhooks: {
        title: "Žádné webhooky",
        description: "Vytvořte webhooky pro automatizaci akcí.",
      },
      exports: {
        title: "Žádné exporty",
        description: "Zde najdete historii exportů.",
      },
      imports: {
        title: "Žádné importy",
        description: "Zde najdete historii importů.",
      },
    },
  },
  profile: {
    label: "Profil",
    page_label: "Vaše práce",
    work: "Práce",
    details: {
      joined_on: "Připojeno dne",
      time_zone: "Časové pásmo",
    },
    stats: {
      workload: "Vytížení",
      overview: "Přehled",
      created: "Vytvořené položky",
      assigned: "Přiřazené položky",
      subscribed: "Odebírané položky",
      state_distribution: {
        title: "Položky podle stavu",
        empty: "Vytvářejte položky pro analýzu stavů.",
      },
      priority_distribution: {
        title: "Položky podle priority",
        empty: "Vytvářejte položky pro analýzu priorit.",
      },
      recent_activity: {
        title: "Nedávná aktivita",
        empty: "Nenalezena žádná aktivita.",
        button: "Stáhnout dnešní aktivitu",
        button_loading: "Stahování",
      },
    },
    actions: {
      profile: "Profil",
      security: "Zabezpečení",
      activity: "Aktivita",
      appearance: "Vzhled",
      notifications: "Oznámení",
    },
    tabs: {
      summary: "Shrnutí",
      assigned: "Přiřazeno",
      created: "Vytvořeno",
      subscribed: "Odebíráno",
      activity: "Aktivita",
    },
    empty_state: {
      activity: {
        title: "Žádná aktivita",
        description: "Vytvořte pracovní položku pro začátek.",
      },
      assigned: {
        title: "Žádné přiřazené pracovní položky",
        description: "Zde uvidíte přiřazené pracovní položky.",
      },
      created: {
        title: "Žádné vytvořené pracovní položky",
        description: "Zde jsou pracovní položky, které jste vytvořili.",
      },
      subscribed: {
        title: "Žádné odebírané pracovní položky",
        description: "Odebírejte pracovní položky, které vás zajímají, a sledujte je zde.",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "Zadejte ID projektu",
      please_select_a_timezone: "Vyberte časové pásmo",
      archive_project: {
        title: "Archivovat projekt",
        description: "Archivace skryje projekt z menu. Přístup zůstane přes stránku projektů.",
        button: "Archivovat projekt",
      },
      delete_project: {
        title: "Smazat projekt",
        description: "Smazáním projektu odstraníte všechna data. Akce je nevratná.",
        button: "Smazat projekt",
      },
      toast: {
        success: "Projekt aktualizován",
        error: "Aktualizace se nezdařila. Zkuste to znovu.",
      },
    },
    members: {
      label: "Členové",
      project_lead: "Vedoucí projektu",
      default_assignee: "Výchozí přiřazení",
      guest_super_permissions: {
        title: "Udělit hostům přístup ke všem položkám:",
        sub_heading: "Hosté uvidí všechny položky v projektu.",
      },
      invite_members: {
        title: "Pozvat členy",
        sub_heading: "Pozvěte členy do projektu.",
        select_co_worker: "Vybrat spolupracovníka",
      },
    },
    states: {
      describe_this_state_for_your_members: "Popište tento stav členům.",
      empty_state: {
        title: "Žádné stavy pro skupinu {groupKey}",
        description: "Vytvořte nový stav",
      },
    },
    labels: {
      label_title: "Název štítku",
      label_title_is_required: "Název štítku je povinný",
      label_max_char: "Název štítku nesmí přesáhnout 255 znaků",
      toast: {
        error: "Chyba při aktualizaci štítku",
      },
    },
    estimates: {
      label: "Odhady",
      title: "Povolit odhady pro můj projekt",
      description: "Pomáhají vám komunikovat složitost a pracovní zátěž týmu.",
      no_estimate: "Bez odhadu",
      new: "Nový systém odhadů",
      create: {
        custom: "Vlastní",
        start_from_scratch: "Začít od nuly",
        choose_template: "Vybrat šablonu",
        choose_estimate_system: "Vybrat systém odhadů",
        enter_estimate_point: "Zadat odhad",
        step: "Krok {step} z {total}",
        label: "Vytvořit odhad",
      },
      toasts: {
        created: {
          success: {
            title: "Odhad vytvořen",
            message: "Odhad byl úspěšně vytvořen",
          },
          error: {
            title: "Vytvoření odhadu selhalo",
            message: "Nepodařilo se vytvořit nový odhad, zkuste to prosím znovu.",
          },
        },
        updated: {
          success: {
            title: "Odhad upraven",
            message: "Odhad byl aktualizován ve vašem projektu.",
          },
          error: {
            title: "Úprava odhadu selhala",
            message: "Nepodařilo se upravit odhad, zkuste to prosím znovu",
          },
        },
        enabled: {
          success: {
            title: "Úspěch!",
            message: "Odhady byly povoleny.",
          },
        },
        disabled: {
          success: {
            title: "Úspěch!",
            message: "Odhady byly zakázány.",
          },
          error: {
            title: "Chyba!",
            message: "Odhad nemohl být zakázán. Zkuste to prosím znovu",
          },
        },
      },
      validation: {
        min_length: "Odhad musí být větší než 0.",
        unable_to_process: "Nemůžeme zpracovat váš požadavek, zkuste to prosím znovu.",
        numeric: "Odhad musí být číselná hodnota.",
        character: "Odhad musí být znakový.",
        empty: "Hodnota odhadu nemůže být prázdná.",
        already_exists: "Hodnota odhadu již existuje.",
        unsaved_changes: "Máte neuložené změny. Před kliknutím na hotovo je prosím uložte",
        remove_empty:
          "Odhad nemůže být prázdný. Zadejte hodnotu do každého pole nebo odstraňte ta, pro která nemáte hodnoty.",
      },
      systems: {
        points: {
          label: "Body",
          fibonacci: "Fibonacci",
          linear: "Lineární",
          squares: "Čtverce",
          custom: "Vlastní",
        },
        categories: {
          label: "Kategorie",
          t_shirt_sizes: "Velikosti triček",
          easy_to_hard: "Od snadného po těžké",
          custom: "Vlastní",
        },
        time: {
          label: "Čas",
          hours: "Hodiny",
        },
      },
    },
    automations: {
      label: "Automatizace",
      "auto-archive": {
        title: "Automaticky archivovat uzavřené pracovní položky",
        description: "Plane bude automaticky archivovat pracovní položky, které byly dokončeny nebo zrušeny.",
        duration: "Automaticky archivovat pracovní položky, které jsou uzavřené po dobu",
      },
      "auto-close": {
        title: "Automaticky uzavírat pracovní položky",
        description: "Plane automaticky uzavře pracovní položky, které nebyly dokončeny nebo zrušeny.",
        duration: "Automaticky uzavřít pracovní položky, které jsou neaktivní po dobu",
        auto_close_status: "Stav automatického uzavření",
      },
    },
    empty_state: {
      labels: {
        title: "Zatím žádné štítky",
        description: "Vytvořte štítky pro organizaci a filtrování pracovních položek ve vašem projektu.",
      },
      estimates: {
        title: "Zatím žádné systémy odhadů",
        description: "Vytvořte sadu odhadů pro komunikaci množství práce na pracovní položku.",
        primary_button: "Přidat systém odhadů",
      },
    },
    features: {
      cycles: {
        title: "Cykly",
        short_title: "Cykly",
        description:
          "Naplánujte práci v flexibilních obdobích, která se přizpůsobí jedinečnému rytmu a tempu tohoto projektu.",
        toggle_title: "Povolit cykly",
        toggle_description: "Naplánujte práci v soustředěných časových rámcích.",
      },
      modules: {
        title: "Moduly",
        short_title: "Moduly",
        description: "Organizujte práci do dílčích projektů s vyhrazenými vedoucími a přiřazenými osobami.",
        toggle_title: "Povolit moduly",
        toggle_description: "Členové projektu budou moci vytvářet a upravovat moduly.",
      },
      views: {
        title: "Zobrazení",
        short_title: "Zobrazení",
        description: "Uložte vlastní řazení, filtry a možnosti zobrazení nebo je sdílejte se svým týmem.",
        toggle_title: "Povolit zobrazení",
        toggle_description: "Členové projektu budou moci vytvářet a upravovat zobrazení.",
      },
      pages: {
        title: "Stránky",
        short_title: "Stránky",
        description: "Vytvářejte a upravujte volný obsah: poznámky, dokumenty, cokoliv.",
        toggle_title: "Povolit stránky",
        toggle_description: "Členové projektu budou moci vytvářet a upravovat stránky.",
      },
      intake: {
        title: "Příjem",
        short_title: "Příjem",
        description: "Umožněte nečlenům sdílet chyby, zpětnou vazbu a návrhy; bez narušení vašeho pracovního postupu.",
        toggle_title: "Povolit příjem",
        toggle_description: "Povolit členům projektu vytvářet žádosti o příjem v aplikaci.",
      },
    },
  },
  project_cycles: {
    add_cycle: "Přidat cyklus",
    more_details: "Více detailů",
    cycle: "Cyklus",
    update_cycle: "Aktualizovat cyklus",
    create_cycle: "Vytvořit cyklus",
    no_matching_cycles: "Žádné odpovídající cykly",
    remove_filters_to_see_all_cycles: "Odeberte filtry pro zobrazení všech cyklů",
    remove_search_criteria_to_see_all_cycles: "Odeberte kritéria pro zobrazení všech cyklů",
    only_completed_cycles_can_be_archived: "Lze archivovat pouze dokončené cykly",
    start_date: "Začátek data",
    end_date: "Konec data",
    in_your_timezone: "V časovém pásmu",
    transfer_work_items: "Převést {count} pracovních položek",
    date_range: "Období data",
    add_date: "Přidat datum",
    active_cycle: {
      label: "Aktivní cyklus",
      progress: "Pokrok",
      chart: "Burndown graf",
      priority_issue: "Vysoce prioritní položky",
      assignees: "Přiřazení",
      issue_burndown: "Burndown pracovních položek",
      ideal: "Ideální",
      current: "Aktuální",
      labels: "Štítky",
    },
    upcoming_cycle: {
      label: "Nadcházející cyklus",
    },
    completed_cycle: {
      label: "Dokončený cyklus",
    },
    status: {
      days_left: "Zbývá dnů",
      completed: "Dokončeno",
      yet_to_start: "Ještě nezačato",
      in_progress: "V průběhu",
      draft: "Koncept",
    },
    action: {
      restore: {
        title: "Obnovit cyklus",
        success: {
          title: "Cyklus obnoven",
          description: "Cyklus byl obnoven.",
        },
        failed: {
          title: "Obnovení selhalo",
          description: "Obnovení cyklu se nezdařilo.",
        },
      },
      favorite: {
        loading: "Přidávání do oblíbených",
        success: {
          description: "Cyklus přidán do oblíbených.",
          title: "Úspěch!",
        },
        failed: {
          description: "Přidání do oblíbených selhalo.",
          title: "Chyba!",
        },
      },
      unfavorite: {
        loading: "Odebírání z oblíbených",
        success: {
          description: "Cyklus odebrán z oblíbených.",
          title: "Úspěch!",
        },
        failed: {
          description: "Odebrání selhalo.",
          title: "Chyba!",
        },
      },
      update: {
        loading: "Aktualizace cyklu",
        success: {
          description: "Cyklus aktualizován.",
          title: "Úspěch!",
        },
        failed: {
          description: "Aktualizace selhala.",
          title: "Chyba!",
        },
        error: {
          already_exists: "Cyklus s těmito daty již existuje. Pro koncept odstraňte data.",
        },
      },
    },
    empty_state: {
      general: {
        title: "Seskupujte práci do cyklů.",
        description: "Časově ohraničte práci, sledujte termíny a dělejte pokroky.",
        primary_button: {
          text: "Vytvořte první cyklus",
          comic: {
            title: "Cykly jsou opakovaná časová období.",
            description: "Sprint, iterace nebo jakékoli jiné časové období pro sledování práce.",
          },
        },
      },
      no_issues: {
        title: "Žádné položky v cyklu",
        description: "Přidejte položky, které chcete sledovat.",
        primary_button: {
          text: "Vytvořit položku",
        },
        secondary_button: {
          text: "Přidat existující položku",
        },
      },
      completed_no_issues: {
        title: "Žádné položky v cyklu",
        description: "Položky byly přesunuty nebo skryty. Pro zobrazení upravte vlastnosti.",
      },
      active: {
        title: "Žádný aktivní cyklus",
        description: "Aktivní cyklus zahrnuje dnešní datum. Sledujte jeho průběh zde.",
      },
      archived: {
        title: "Žádné archivované cykly",
        description: "Archivujte dokončené cykly pro úklid.",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "Vytvořte a přiřaďte pracovní položku",
        description: "Položky jsou úkoly, které přiřazujete sobě nebo týmu. Sledujte jejich postup.",
        primary_button: {
          text: "Vytvořit první položku",
          comic: {
            title: "Položky jsou stavebními kameny",
            description: "Příklady: Redesign UI, Rebranding, Nový systém.",
          },
        },
      },
      no_archived_issues: {
        title: "Žádné archivované položky",
        description: "Archivujte dokončené nebo zrušené položky. Nastavte automatizaci.",
        primary_button: {
          text: "Nastavit automatizaci",
        },
      },
      issues_empty_filter: {
        title: "Žádné odpovídající položky",
        secondary_button: {
          text: "Vymazat filtry",
        },
      },
    },
  },
  project_module: {
    add_module: "Přidat modul",
    update_module: "Aktualizovat modul",
    create_module: "Vytvořit modul",
    archive_module: "Archivovat modul",
    restore_module: "Obnovit modul",
    delete_module: "Smazat modul",
    empty_state: {
      general: {
        title: "Seskupujte milníky do modulů.",
        description: "Moduly seskupují položky pod logického nadřazeného. Sledujte termíny a pokrok.",
        primary_button: {
          text: "Vytvořte první modul",
          comic: {
            title: "Moduly skupinují hierarchicky.",
            description: "Příklady: Modul košíku, podvozku, skladu.",
          },
        },
      },
      no_issues: {
        title: "Žádné položky v modulu",
        description: "Přidejte položky do modulu.",
        primary_button: {
          text: "Vytvořit položky",
        },
        secondary_button: {
          text: "Přidat existující položku",
        },
      },
      archived: {
        title: "Žádné archivované moduly",
        description: "Archivujte dokončené nebo zrušené moduly.",
      },
      sidebar: {
        in_active: "Modul není aktivní.",
        invalid_date: "Neplatné datum. Zadejte platné.",
      },
    },
    quick_actions: {
      archive_module: "Archivovat modul",
      archive_module_description: "Lze archivovat pouze dokončené/zrušené moduly.",
      delete_module: "Smazat modul",
    },
    toast: {
      copy: {
        success: "Odkaz na modul zkopírován",
      },
      delete: {
        success: "Modul smazán",
        error: "Mazání selhalo",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "Ukládejte filtry jako pohledy.",
        description: "Pohledy jsou uložené filtry pro snadný přístup. Sdílejte je v týmu.",
        primary_button: {
          text: "Vytvořit první pohled",
          comic: {
            title: "Pohledy pracují s vlastnostmi položek.",
            description: "Vytvořte pohled s požadovanými filtry.",
          },
        },
      },
      filter: {
        title: "Žádné odpovídající pohledy",
        description: "Vytvořte nový pohled.",
      },
    },
    delete_view: {
      title: "Opravdu chcete smazat tento pohled?",
      content:
        "Pokud potvrdíte, všechny možnosti řazení, filtrování a zobrazení + rozvržení, které jste vybrali pro tento pohled, budou trvale odstraněny a nelze je obnovit.",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title: "Pište poznámky, dokumenty nebo znalostní báze. Využijte AI Galileo.",
        description:
          "Stránky jsou prostorem pro myšlenky. Pište, formátujte, vkládejte položky a využívejte komponenty.",
        primary_button: {
          text: "Vytvořit první stránku",
        },
      },
      private: {
        title: "Žádné soukromé stránky",
        description: "Uchovávejte soukromé myšlenky. Sdílejte, až budete připraveni.",
        primary_button: {
          text: "Vytvořit stránku",
        },
      },
      public: {
        title: "Žádné veřejné stránky",
        description: "Zde uvidíte stránky sdílené v projektu.",
        primary_button: {
          text: "Vytvořit stránku",
        },
      },
      archived: {
        title: "Žádné archivované stránky",
        description: "Archivujte stránky pro pozdější přístup.",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "Nenalezeny výsledky",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "Žádné odpovídající položky",
      },
      no_issues: {
        title: "Žádné položky",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "Žádné komentáře",
        description: "Komentáře slouží k diskusi a sledování položek.",
      },
    },
  },
  notification: {
    label: "Schránka",
    page_label: "{workspace} - Schránka",
    options: {
      mark_all_as_read: "Označit vše jako přečtené",
      mark_read: "Označit jako přečtené",
      mark_unread: "Označit jako nepřečtené",
      refresh: "Obnovit",
      filters: "Filtry schránky",
      show_unread: "Zobrazit nepřečtené",
      show_snoozed: "Zobrazit odložené",
      show_archived: "Zobrazit archivované",
      mark_archive: "Archivovat",
      mark_unarchive: "Zrušit archivaci",
      mark_snooze: "Odložit",
      mark_unsnooze: "Zrušit odložení",
    },
    toasts: {
      read: "Oznámení přečteno",
      unread: "Označeno jako nepřečtené",
      archived: "Archivováno",
      unarchived: "Zrušena archivace",
      snoozed: "Odloženo",
      unsnoozed: "Zrušeno odložení",
    },
    empty_state: {
      detail: {
        title: "Vyberte pro podrobnosti.",
      },
      all: {
        title: "Žádné přiřazené položky",
        description: "Zobrazí se zde aktualizace přiřazených položek.",
      },
      mentions: {
        title: "Žádné zmínky",
        description: "Zobrazí se zde zmínky o vás.",
      },
    },
    tabs: {
      all: "Vše",
      mentions: "Zmínky",
    },
    filter: {
      assigned: "Přiřazeno mě",
      created: "Vytvořil jsem",
      subscribed: "Odebírám",
    },
    snooze: {
      "1_day": "1 den",
      "3_days": "3 dny",
      "5_days": "5 dní",
      "1_week": "1 týden",
      "2_weeks": "2 týdny",
      custom: "Vlastní",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "Přidejte položky pro sledování pokroku",
      },
      chart: {
        title: "Přidejte položky pro zobrazení burndown grafu.",
      },
      priority_issue: {
        title: "Zobrazí se vysoce prioritní položky.",
      },
      assignee: {
        title: "Přiřaďte položky pro přehled přiřazení.",
      },
      label: {
        title: "Přidejte štítky pro analýzu podle štítků.",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "Příjem není povolen",
        description: "Aktivujte příjem v nastavení projektu pro správu požadavků.",
        primary_button: {
          text: "Spravovat funkce",
        },
      },
      cycle: {
        title: "Cykly nejsou povoleny",
        description: "Aktivujte cykly pro časové ohraničení práce.",
        primary_button: {
          text: "Spravovat funkce",
        },
      },
      module: {
        title: "Moduly nejsou povoleny",
        description: "Aktivujte moduly v nastavení projektu.",
        primary_button: {
          text: "Spravovat funkce",
        },
      },
      page: {
        title: "Stránky nejsou povoleny",
        description: "Aktivujte stránky v nastavení projektu.",
        primary_button: {
          text: "Spravovat funkce",
        },
      },
      view: {
        title: "Pohledy nejsou povoleny",
        description: "Aktivujte pohledy v nastavení projektu.",
        primary_button: {
          text: "Spravovat funkce",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "Vytvořit koncept položky",
    empty_state: {
      title: "Rozpracované položky a komentáře se zde zobrazí.",
      description: "Začněte vytvářet položku a nechte ji rozpracovanou.",
      primary_button: {
        text: "Vytvořit první koncept",
      },
    },
    delete_modal: {
      title: "Smazat koncept",
      description: "Opravdu chcete smazat tento koncept? Akce je nevratná.",
    },
    toasts: {
      created: {
        success: "Koncept vytvořen",
        error: "Vytvoření se nezdařilo",
      },
      deleted: {
        success: "Koncept smazán",
      },
    },
  },
  stickies: {
    title: "Vaše poznámky",
    placeholder: "kliknutím začněte psát",
    all: "Všechny poznámky",
    "no-data": "Zapisujte nápady a myšlenky. Přidejte první poznámku.",
    add: "Přidat poznámku",
    search_placeholder: "Hledat podle názvu",
    delete: "Smazat poznámku",
    delete_confirmation: "Opravdu chcete smazat tuto poznámku?",
    empty_state: {
      simple: "Zapisujte nápady a myšlenky. Přidejte první poznámku.",
      general: {
        title: "Poznámky jsou rychlé záznamy.",
        description: "Zapisujte myšlenky a přistupujte k nim odkudkoli.",
        primary_button: {
          text: "Přidat poznámku",
        },
      },
      search: {
        title: "Nenalezeny žádné poznámky.",
        description: "Zkuste jiný termín nebo vytvořte novou.",
        primary_button: {
          text: "Přidat poznámku",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "Název poznámky může mít max. 100 znaků.",
        already_exists: "Poznámka bez popisu již existuje",
      },
      created: {
        title: "Poznámka vytvořena",
        message: "Poznámka úspěšně vytvořena",
      },
      not_created: {
        title: "Vytvoření selhalo",
        message: "Poznámku nelze vytvořit",
      },
      updated: {
        title: "Poznámka aktualizována",
        message: "Poznámka úspěšně aktualizována",
      },
      not_updated: {
        title: "Aktualizace selhala",
        message: "Poznámku nelze aktualizovat",
      },
      removed: {
        title: "Poznámka smazána",
        message: "Poznámka úspěšně smazána",
      },
      not_removed: {
        title: "Mazání selhalo",
        message: "Poznámku nelze smazat",
      },
    },
  },
  role_details: {
    guest: {
      title: "Host",
      description: "Externí členové mohou být pozváni jako hosté.",
    },
    member: {
      title: "Člen",
      description: "Může číst, psát, upravovat a mazat entity.",
    },
    admin: {
      title: "Správce",
      description: "Má všechna oprávnění v prostoru.",
    },
  },
  user_roles: {
    product_or_project_manager: "Produktový/Projektový manažer",
    development_or_engineering: "Vývoj/Inženýrství",
    founder_or_executive: "Zakladatel/Vedoucí pracovník",
    freelancer_or_consultant: "Freelancer/Konzultant",
    marketing_or_growth: "Marketing/Růst",
    sales_or_business_development: "Prodej/Business Development",
    support_or_operations: "Podpora/Operace",
    student_or_professor: "Student/Profesor",
    human_resources: "Lidské zdroje",
    other: "Jiné",
  },
  importer: {
    github: {
      title: "GitHub",
      description: "Importujte položky z repozitářů GitHub.",
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
      short_description: "Exportovat jako CSV",
    },
    excel: {
      title: "Excel",
      description: "Exportujte položky do Excelu.",
      short_description: "Exportovat jako Excel",
    },
    xlsx: {
      title: "Excel",
      description: "Exportujte položky do Excelu.",
      short_description: "Exportovat jako Excel",
    },
    json: {
      title: "JSON",
      description: "Exportujte položky do JSON.",
      short_description: "Exportovat jako JSON",
    },
  },
  default_global_view: {
    all_issues: "Všechny položky",
    assigned: "Přiřazeno",
    created: "Vytvořeno",
    subscribed: "Odebíráno",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "Systémové předvolby",
      },
      light: {
        label: "Světlé",
      },
      dark: {
        label: "Tmavé",
      },
      light_contrast: {
        label: "Světlý vysoký kontrast",
      },
      dark_contrast: {
        label: "Tmavý vysoký kontrast",
      },
      custom: {
        label: "Vlastní téma",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "Backlog",
      planned: "Plánováno",
      in_progress: "V průběhu",
      paused: "Pozastaveno",
      completed: "Dokončeno",
      cancelled: "Zrušeno",
    },
    layout: {
      list: "Seznam",
      board: "Nástěnka",
      timeline: "Časová osa",
    },
    order_by: {
      name: "Název",
      progress: "Pokrok",
      issues: "Počet položek",
      due_date: "Termín",
      created_at: "Datum vytvoření",
      manual: "Ručně",
    },
  },
  cycle: {
    label: "{count, plural, one {Cyklus} few {Cykly} other {Cyklů}}",
    no_cycle: "Žádný cyklus",
  },
  module: {
    label: "{count, plural, one {Modul} few {Moduly} other {Modulů}}",
    no_module: "Žádný modul",
  },
  description_versions: {
    last_edited_by: "Naposledy upraveno uživatelem",
    previously_edited_by: "Dříve upraveno uživatelem",
    edited_by: "Upraveno uživatelem",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane se nespustil. To může být způsobeno tím, že se jeden nebo více služeb Plane nepodařilo spustit.",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "Vyberte View Logs z setup.sh a Docker logů, abyste si byli jisti.",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "Osnova",
        empty_state: {
          title: "Chybí nadpisy",
          description: "Přidejte na tuto stránku nějaké nadpisy, aby se zde zobrazily.",
        },
      },
      info: {
        label: "Info",
        document_info: {
          words: "Slova",
          characters: "Znaky",
          paragraphs: "Odstavce",
          read_time: "Doba čtení",
        },
        actors_info: {
          edited_by: "Upravil",
          created_by: "Vytvořil",
        },
        version_history: {
          label: "Historie verzí",
          current_version: "Aktuální verze",
        },
      },
      assets: {
        label: "Přílohy",
        download_button: "Stáhnout",
        empty_state: {
          title: "Chybí obrázky",
          description: "Přidejte obrázky, aby se zde zobrazily.",
        },
      },
    },
    open_button: "Otevřít navigační panel",
    close_button: "Zavřít navigační panel",
    outline_floating_button: "Otevřít osnovu",
  },
} as const;
