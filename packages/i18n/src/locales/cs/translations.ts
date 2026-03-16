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
    we_are_working_on_this_if_you_need_immediate_assistance: "Pracujeme na tom. Pokud potřebujete okamžitou pomoc,",
    reach_out_to_us: "kontaktujte nás",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our:
      "Jinak zkuste občas obnovit stránku nebo navštivte naši",
    status_page: "stránku stavu",
  },
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
    pi_chat: "Plane AI",
    initiatives: "Iniciativy",
    teamspaces: "Týmové prostory",
    epics: "Epiky",
    upgrade_plan: "Plán upgradu",
    plane_pro: "Plane Pro",
    business: "Byznys",
    customers: "Zákazníci",
    recurring_work_items: "Opakující se pracovní položky",
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
      username: {
        label: "Uživatelské jméno",
        placeholder: "Zadejte své uživatelské jméno",
      },
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
    ldap: {
      header: {
        label: "Pokračovat s {ldapProviderName}",
        sub_header: "Zadejte své přihlašovací údaje {ldapProviderName}",
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
  select_the_cursor_motion_style_that_feels_right_for_you: "Vyberte styl pohybu kurzoru, který vám vyhovuje.",
  theme: "Téma",
  smooth_cursor: "Plynulý kurzor",
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
  pages: {
    link_pages: "Propojit stránky",
    show_wiki_pages: "Zobrazit wikipedií",
    link_pages_to: "Propojit stránky k",
    linked_pages: "Propojené stránky",
    no_description: "Tato stránka je prázdná. Napište něco do ní a uvidíte to zde jako tento placeholder",
    toasts: {
      link: {
        success: {
          title: "Stránky aktualizovány",
          message: "Stránky byly úspěšně aktualizovány",
        },
        error: {
          title: "Stránky nebyly aktualizovány",
          message: "Nepodařilo se aktualizovat stránky",
        },
      },
      remove: {
        success: {
          title: "Stránka odstraněna",
          message: "Stránka byla úspěšně odstraněna",
        },
        error: {
          title: "Stránka nebyla odstraněna",
          message: "Nepodařilo se odstranit stránku",
        },
      },
    },
  },
  intake: "Příjem",
  renew: "Obnovit",
  preview: "Náhled",
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
  forum: "Forum",
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
  subscriber: "{count, plural, one{# Odběratel} few{# Odběratelé} other{# Odběratelů}}",
  you: "Vy",
  labels: "Štítky",
  create_new_label: "Vytvořit nový štítek",
  label_name: "Název štítku",
  failed_to_create_label: "Vytvoření štítku se nezdařilo. Zkuste to prosím znovu.",
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
  upgrade_request: "Požádejte správce pracovního prostoru o upgrade.",
  copied_to_clipboard: "Zkopírováno do schránky",
  copied_to_clipboard_description: "URL byla úspěšně zkopírována do schránky",
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
        description: `Vypadá to, že všechny vaše widgety jsou vypnuté. Zapněte je
pro lepší zážitek!`,
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
    business_trial_banner: {
      title: "Vaše 14denní zkušební verze plánu Business je aktivní!",
      description:
        "Prozkoumejte všechny funkce Business. Až budete připraveni, zvolte předplatné. Nebudete automaticky účtováni.",
      trial_ends_today: "Zkušební verze končí dnes",
      trial_ends_in_days: "Zkušební verze končí za {days, plural, one {# den} few {# dny} other {# dní}}",
      start_subscription: "Zahájit předplatné",
      explore_business_features: "Prozkoumat funkce Business",
    },
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
    updated_at: "Aktualizováno dne",
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
    additional_updates: "Další aktualizace",
    clear_all: "Vymazat vše",
    copied: "Zkopírováno!",
    link_copied: "Odkaz zkopírován!",
    link_copied_to_clipboard: "Odkaz zkopírován do schránky",
    copied_to_clipboard: "Odkaz na pracovní položku zkopírován do schránky",
    branch_name_copied_to_clipboard: "Název větve zkopírován do schránky",
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
      copy_branch_name: "Kopírovat název větve",
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
    worklogs: "Pracovní záznamy",
    project_updates: "Aktualizace projektu",
    overview: "Přehled",
    workflows: "Workflow",
    templates: "Šablony",
    members_and_teamspaces: "Členové a týmové prostory",
    open_in_full_screen: "Otevřít {page} na celou obrazovku",
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
    archive: {
      description: `Lze archivovat pouze dokončené nebo zrušené
epiky`,
      label: "Archivovat epiku",
      confirm_message: "Opravdu chcete archivovat epiku? Všechny archivované epiky lze později obnovit.",
      success: {
        label: "Archivace úspěšná",
        message: "Vaše archivy najdete v archivech projektu.",
      },
      failed: {
        message: "Epiku se nepodařilo archivovat. Zkuste to prosím znovu.",
      },
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
      description: `Lze archivovat pouze dokončené nebo zrušené
pracovní položky`,
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
      start_before: "Začíná před",
      start_after: "Začíná po",
      finish_before: "Končí před",
      finish_after: "Končí po",
      implements: "Implementuje",
      implemented_by: "Implementováno",
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
      body: `Ahoj správci,

Prosím vytvořte nový pracovní prostor s URL [/workspace-name] pro [účel vytvoření].

Díky,
{firstName} {lastName}
{email}`,
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
      cycle_progress: {
        title: "Zatím žádná data",
        description:
          "Analýza postupu cyklu se zobrazí zde. Přidejte pracovní položky do cyklů, abyste mohli sledovat postup.",
      },
      module_progress: {
        title: "Zatím žádná data",
        description:
          "Analýza postupu modulu se zobrazí zde. Přidejte pracovní položky do modulů, abyste mohli sledovat postup.",
      },
      intake_trends: {
        title: "Zatím žádná data",
        description:
          "Analýza trendů příjmu se zobrazí zde. Přidejte pracovní položky do příjmu, abyste mohli sledovat trendy.",
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
    projects_by_status: "Projekty podle stavu",
    active_users: "Aktivní uživatelé",
    intake_trends: "Trendy příjmů",
    workitem_resolved_vs_pending: "Vyřešené vs. čekající pracovní položky",
    upgrade_to_plan: "Přejděte na plán {plan}, abyste odemkli kartu {tab}",
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
        description: `Nenalezeny projekty odpovídající kritériím.
 Vytvořte nový.`,
      },
      search: {
        description: `Nenalezeny projekty odpovídající kritériím.
Vytvořte nový.`,
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
    notifications: {
      select_default_view: "Vybrat výchozí zobrazení",
      compact: "Kompaktní",
      full: "Celá obrazovka",
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
        heading: "API Tokeny",
        description: "Generujte bezpečné API tokeny pro integraci vašich dat s externími systémy a aplikacemi.",
        title: "API Tokeny",
        add_token: "Přidat token přístupu",
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
      integrations: {
        title: "Integrace",
        page_title: "Pracujte se svými daty Plane v dostupných aplikacích nebo ve svých vlastních.",
        page_description: "Zobrazte všechny integrace používané tímto pracovním prostorem nebo vámi.",
      },
      imports: {
        title: "Importy",
      },
      worklogs: {
        title: "Pracovní záznamy",
      },
      group_syncing: {
        title: "Synchronizace skupin",
        heading: "Synchronizace skupin",
        description:
          "Propojte skupiny poskytovatele identity s projekty a rolemi. Přístup uživatelů se automaticky aktualizuje při změnách členství ve skupině ve vašem IdP, což zjednodušuje onboarding a offboarding.",
        enable: {
          title: "Povolit synchronizaci skupin",
          description: "Automaticky přidávejte uživatele do projektů na základě skupin poskytovatele identity.",
        },
        config: {
          title: "Konfigurovat synchronizaci skupin",
          description: "Nastavte, jak jsou skupiny poskytovatele identity mapovány na projekty a role.",
          sync_on_login: {
            title: "Synchronizace při přihlášení",
            description: "Aktualizujte členství ve skupině a přístup k projektu při přihlášení uživatele.",
          },
          sync_offline: {
            title: "Offline synchronizace",
            description: "Spouští synchronizaci každých šest hodin automaticky, bez čekání na přihlášení uživatelů.",
          },
          auto_remove: {
            title: "Automatické odebrání",
            description: "Automaticky odeberte uživatele z projektů, když již neodpovídají skupině.",
          },
          group_attribute_key: {
            title: "Klíč atributu skupiny",
            description:
              "Atribut poskytovatele identity používaný k identifikaci a synchronizaci uživatelských skupin.",
            placeholder: "Skupiny",
          },
        },
        group_mapping: {
          title: "Mapování skupin",
          description: "Propojte skupiny poskytovatele identity s projekty a rolemi.",
          button_text: "Přidat novou synchronizaci skupin",
        },
        toast: {
          updating: "Aktualizace funkce synchronizace skupin",
          success: "Funkce synchronizace skupin byla úspěšně aktualizována.",
          error: "Nepodařilo se aktualizovat funkci synchronizace skupin!",
        },
        delete_modal: {
          title: "Smazat synchronizaci skupin",
          content:
            "Noví uživatelé z této skupiny identity již nebudou přidáváni do projektu. Již přidaní uživatelé si zachovají svou současnou roli.",
        },
        modal: {
          idp_group_name: {
            text: "Uživatelská skupina",
            required: "Uživatelská skupina je povinná",
            placeholder: "Zadejte názvy skupin IdP",
          },
          project: {
            text: "Projekt",
            required: "Projekt je povinný",
            placeholder: "Vyberte projekt",
          },
          default_role: {
            text: "Role projektu",
            required: "Role projektu je povinná",
            placeholder: "Vyberte roli projektu",
          },
        },
      },
      identity: {
        title: "Identita",
        heading: "Identita",
        description: "Nakonfigurujte svou doménu a povolte jednotné přihlašování",
      },
      project_states: {
        title: "Stavy projektů",
      },
      projects: {
        title: "Projekty",
        description: "Správa stavů projektů, povolení štítků projektů a další konfigurace.",
        tabs: {
          states: "Stavy projektů",
          labels: "Štítky projektů",
        },
      },
      teamspaces: {
        title: "Teamspaces",
      },
      initiatives: {
        title: "Iniciativy",
      },
      customers: {
        title: "Zákazníci",
      },
      releases: {
        title: "Vydání",
        update_release: "Aktualizovat vydání",
        create_release: "Vytvořit vydání",
        errors: {
          release_not_found: "Hledané vydání neexistuje.",
          unknown: "Něco se pokazilo. Zkuste to prosím znovu.",
        },
      },

      cancel_trial: {
        title: "Nejprve zrušte svou zkušební verzi.",
        description:
          "Máte aktivní zkušební verzi jednoho z našich placených plánů. Nejprve ji prosím zrušte, abyste mohli pokračovat.",
        dismiss: "Zavřít",
        cancel: "Zrušit zkušební verzi",
        cancel_success_title: "Zkušební verze zrušena.",
        cancel_success_message: "Nyní můžete workspace smazat.",
        cancel_error_title: "To nefungovalo.",
        cancel_error_message: "Zkuste to prosím znovu.",
      },
      applications: {
        title: "Aplikace",
        applicationId_copied: "ID aplikace zkopírováno do schránky",
        clientId_copied: "ID klienta zkopírováno do schránky",
        clientSecret_copied: "Tajemství klienta zkopírováno do schránky",
        third_party_apps: "Aplikace třetích stran",
        your_apps: "Vaše aplikace",
        connect: "Připojit",
        connected: "Připojeno",
        install: "Instalovat",
        installed: "Instalováno",
        configure: "Konfigurovat",
        app_available: "Tuto aplikaci jste zpřístupnili pro použití s pracovním prostorem Plane",
        app_available_description: "Připojte pracovní prostor Plane pro začátek používání",
        client_id_and_secret: "ID a Tajemství Klienta",
        client_id_and_secret_description:
          "Zkopírujte a uložte tento tajný klíč. Po kliknutí na Zavřít tento klíč již neuvidíte.",
        client_id_and_secret_download: "Můžete si stáhnout CSV s klíčem odsud.",
        application_id: "ID Aplikace",
        client_id: "ID Klienta",
        client_secret: "Tajemství Klienta",
        export_as_csv: "Exportovat jako CSV",
        slug_already_exists: "Slug již existuje",
        failed_to_create_application: "Nepodařilo se vytvořit aplikaci",
        upload_logo: "Nahrát Logo",
        app_name_title: "Jak pojmenujete tuto aplikaci",
        app_name_error: "Název aplikace je povinný",
        app_short_description_title: "Dejte této aplikaci krátký popis",
        app_short_description_error: "Krátký popis aplikace je povinný",
        app_description_title: {
          label: "Dlouhý popis",
          placeholder: "Napište dlouhý popis pro tržiště. Stiskněte '/' pro příkazy.",
        },
        authorization_grant_type: {
          title: "Typ připojení",
          description:
            "Vyberte, zda má být vaše aplikace nainstalována jednou pro pracovní prostor nebo zda má každý uživatel připojit svůj vlastní účet",
        },
        app_description_error: "Popis aplikace je povinný",
        app_slug_title: "Slug aplikace",
        app_slug_error: "Slug aplikace je povinný",
        app_maker_title: "Tvůrce aplikace",
        app_maker_error: "Tvůrce aplikace je povinný",
        webhook_url_title: "URL Webhooku",
        webhook_url_error: "URL webhooku je povinné",
        invalid_webhook_url_error: "Neplatné URL webhooku",
        redirect_uris_title: "URI přesměrování",
        redirect_uris_error: "URI přesměrování jsou povinné",
        invalid_redirect_uris_error: "Neplatné URI přesměrování",
        redirect_uris_description:
          "Zadejte URI oddělené mezerami, kam aplikace přesměruje po uživateli, např. https://example.com https://example.com/",
        authorized_javascript_origins_title: "Autorizované JavaScript původy",
        authorized_javascript_origins_error: "Autorizované JavaScript původy jsou povinné",
        invalid_authorized_javascript_origins_error: "Neplatné autorizované JavaScript původy",
        authorized_javascript_origins_description:
          "Zadejte původy oddělené mezerami, odkud bude moci aplikace dělat požadavky, např. app.com example.com",
        create_app: "Vytvořit aplikaci",
        update_app: "Aktualizovat aplikaci",
        regenerate_client_secret_description:
          "Znovu vygenerovat tajemství klienta. Po regeneraci můžete klíč zkopírovat nebo stáhnout do CSV souboru.",
        regenerate_client_secret: "Znovu vygenerovat tajemství klienta",
        regenerate_client_secret_confirm_title: "Jste si jisti, že chcete znovu vygenerovat tajemství klienta?",
        regenerate_client_secret_confirm_description:
          "Aplikace používající toto tajemství přestane fungovat. Budete muset aktualizovat tajemství v aplikaci.",
        regenerate_client_secret_confirm_cancel: "Zrušit",
        regenerate_client_secret_confirm_regenerate: "Znovu vygenerovat",
        read_only_access_to_workspace: "Přístup pouze pro čtení k vašemu pracovnímu prostoru",
        write_access_to_workspace: "Přístup pro zápis k vašemu pracovnímu prostoru",
        read_only_access_to_user_profile: "Přístup pouze pro čtení k vašemu uživatelskému profilu",
        write_access_to_user_profile: "Přístup pro zápis k vašemu uživatelskému profilu",
        connect_app_to_workspace: "Připojit {app} k vašemu pracovnímu prostoru {workspace}",
        user_permissions: "Uživatelská oprávnění",
        user_permissions_description: "Uživatelská oprávnění se používají k udělení přístupu k profilu uživatele.",
        workspace_permissions: "Oprávnění pracovního prostoru",
        workspace_permissions_description:
          "Oprávnění pracovního prostoru se používají k udělení přístupu k pracovnímu prostoru.",
        with_the_permissions: "s oprávněními",
        app_consent_title: "{app} žádá o přístup k vašemu pracovnímu prostoru a profilu Plane.",
        choose_workspace_to_connect_app_with: "Vyberte pracovní prostor pro připojení aplikace",
        app_consent_workspace_permissions_title: "{app} by chtěl",
        app_consent_user_permissions_title:
          "{app} může také požádat o povolení uživatele pro následující zdroje. Tato oprávnění budou vyžádána a autorizována pouze uživatelem.",
        app_consent_accept_title: "Přijetím",
        app_consent_accept_1:
          "Udělujete aplikaci přístup k vašim datům Plane kdekoli, kde můžete používat aplikaci uvnitř nebo mimo Plane",
        app_consent_accept_2: "Souhlasíte s Zásadami ochrany osobních údajů a Podmínkami použití {app}",
        accepting: "Přijímání...",
        accept: "Přijmout",
        categories: "Kategorie",
        select_app_categories: "Vyberte kategorie aplikace",
        categories_title: "Kategorie",
        categories_error: "Kategorie jsou povinné",
        invalid_categories_error: "Neplatné kategorie",
        categories_description: "Vyberte kategorie, které nejlépe popisují aplikaci",
        supported_plans: "Podporované Plány",
        supported_plans_description:
          "Vyberte plány pracovního prostoru, které mohou nainstalovat tuto aplikaci. Ponechte prázdné, chcete-li povolit všechny plány.",
        select_plans: "Vybrat Plány",
        privacy_policy_url_title: "URL Zásad ochrany osobních údajů",
        privacy_policy_url_error: "URL Zásad ochrany osobních údajů je povinné",
        invalid_privacy_policy_url_error: "Neplatné URL Zásad ochrany osobních údajů",
        terms_of_service_url_title: "URL Podmínek služby",
        terms_of_service_url_error: "URL Podmínek služby je povinné",
        invalid_terms_of_service_url_error: "Neplatné URL Podmínek služby",
        support_url_title: "URL Podpory",
        support_url_error: "URL Podpory je povinné",
        invalid_support_url_error: "Neplatné URL Podpory",
        video_url_title: "URL Video",
        video_url_error: "URL Video je povinné",
        invalid_video_url_error: "Neplatné URL Video",
        setup_url_title: "URL Nastavení",
        setup_url_error: "URL Nastavení je povinné",
        invalid_setup_url_error: "Neplatné URL Nastavení",
        configuration_url_title: "URL Konfigurace",
        configuration_url_error: "URL Konfigurace je povinné",
        invalid_configuration_url_error: "Neplatné URL Konfigurace",
        contact_email_title: "Kontaktní email",
        contact_email_error: "Kontaktní email je povinný",
        invalid_contact_email_error: "Neplatný kontaktní email",
        upload_attachments: "Nahrát přílohy",
        uploading_images: "Nahrávání {count} Obrázku{count, plural, one {s} other {s}}",
        drop_images_here: "Přetáhněte obrázky sem",
        click_to_upload_images: "Klikněte pro nahrávání obrázků",
        invalid_file_or_exceeds_size_limit: "Neplatný soubor nebo překračuje limit velikosti ({size} MB)",
        uploading: "Nahrávání...",
        upload_and_save: "Nahrát a uložit",
        app_credentials_regenrated: {
          title: "Přihlašovací údaje aplikace byly úspěšně znovu vygenerovány",
          description: "Nahraďte klientský klíč všude, kde je používán. Předchozí klíč již není platný.",
        },
        app_created: {
          title: "Aplikace byla úspěšně vytvořena",
          description: "Použijte přihlašovací údaje k instalaci aplikace do pracovního prostoru Plane",
        },
        installed_apps: "Nainstalované aplikace",
        all_apps: "Všechny aplikace",
        internal_apps: "Interní aplikace",
        website: {
          title: "Webová stránka",
          description: "Odkaz na webové stránky vaší aplikace.",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "Tvůrce aplikací",
          description: "Osoba nebo organizace, která vytváří aplikaci.",
        },
        setup_url: {
          label: "URL nastavení",
          description: "Uživatelé budou po instalaci aplikace přesměrováni na tuto URL.",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "Webhook URL",
          description:
            "Sem budeme odesílat události webhook a aktualizace z pracovních prostorů, kde je vaše aplikace nainstalována.",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "Přesměrovací URI (oddělené mezerou)",
          description: "Uživatelé budou po ověření pomocí Plane přesměrováni na tuto cestu.",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "Tato aplikace může být nainstalována pouze po jejím nainstalování správcem pracovního prostoru. Kontaktujte svého správce pracovního prostoru, abyste mohli pokračovat.",
        enable_app_mentions: "Povolit zmínky o aplikaci",
        enable_app_mentions_tooltip:
          "Když je tato možnost povolena, uživatelé mohou zmínit nebo přiřadit pracovní položky této aplikaci.",
        scopes: "Rozsahy",
        select_scopes: "Vybrat rozsahy",
        read_access_to: "Přístup pouze pro čtení k",
        write_access_to: "Přístup pro zápis k",
        global_permission_expiration:
          "Globální rozsahy brzy vyprší. Místo toho použijte granulární rozsahy. Například použijte project:read místo globálního čtení.",
        selected_scopes: "{count} vybráno",
        scopes_and_permissions: "Rozsahy a oprávnění",
        read: "Čtení",
        write: "Zápis",
        scope_description: {
          projects: "Přístup k projektům a všem souvisejícím entitám",
          wiki: "Přístup k wiki a všem souvisejícím entitám",
          customers: "Přístup k zákazníkům a všem souvisejícím entitám",
          initiatives: "Přístup k iniciativám a všem souvisejícím entitám",
          workspaces: "Přístup k pracovním prostorům a všem souvisejícím entitám",
          stickies: "Přístup k poznámkám a všem souvisejícím entitám",
          teamspaces: "Přístup k týmovým prostorům a všem souvisejícím entitám",
          profile: "Přístup k informacím o profilu uživatele",
          agents: "Přístup k agentům a všem souvisejícím entitám",
          assets: "Přístup k aktivům a všem souvisejícím entitám",
        },
        build_your_own_app: "Vytvořte si vlastní aplikaci",
        edit_app_details: "Upravit detaily aplikace",
        internal: "Interní",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description:
          "Sledujte, jak se vaše práce stává chytřejší a rychlejší s AI, která je nativně propojena s vaší prací a znalostní základnou.",
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
      connections: "Spojení",
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
      project_lead_description: "Vyberte vedoucího projektu.",
      default_assignee_description: "Vyberte výchozího přiřazeného pro projekt.",
      project_subscribers: "Odběratelé projektu",
      project_subscribers_description: "Vyberte členy, kteří budou dostávat oznámení pro tento projekt.",
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
        reorder: {
          success: {
            title: "Odhady přeuspořádány",
            message: "Odhady byly přeuspořádány ve vašem projektu.",
          },
          error: {
            title: "Přeuspořádání odhadů selhalo",
            message: "Nepodařilo se přeuspořádat odhady, zkuste to prosím znovu",
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
        fill: "Vyplňte prosím toto pole odhadu",
        repeat: "Hodnota odhadu se nemůže opakovat",
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
      edit: {
        title: "Upravit systém odhadů",
        add_or_update: {
          title: "Přidat, upravit nebo odebrat odhady",
          description: "Spravujte aktuální systém přidáním, úpravou nebo odebráním bodů či kategorií.",
        },
        switch: {
          title: "Změnit typ odhadu",
          description: "Převeďte váš bodový systém na systém kategorií a naopak.",
        },
      },
      switch: "Přepnout systém odhadů",
      current: "Aktuální systém odhadů",
      select: "Vyberte systém odhadů",
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
      integrations: {
        title: "Žádné integrace nejsou nakonfigurovány",
        description: "Nakonfigurujte GitHub a další integrace pro synchronizaci vašich pracovních položek projektu.",
      },
    },
    initiatives: {
      heading: "Iniciativy",
      sub_heading: "Odemkněte nejvyšší úroveň organizace pro všechny vaše práce v Plane.",
      title: "Povolit iniciativy",
      description: "Nastavte větší cíle pro sledování pokroku",
      toast: {
        updating: "Aktualizace funkce iniciativ",
        enable_success: "Funkce iniciativ byla úspěšně povolena.",
        disable_success: "Funkce iniciativ byla úspěšně zakázána.",
        error: "Nepodařilo se aktualizovat funkci iniciativ!",
      },
    },
    customers: {
      heading: "Zákazníci",
      settings_heading: "Spravujte práci podle toho, co je důležité pro vaše zákazníky.",
      settings_sub_heading:
        "Převeďte požadavky zákazníků na pracovní položky, přiřaďte prioritu podle požadavků a propojte stavy pracovních položek se záznamy zákazníků. Brzy budete moci integrovat váš CRM nebo nástroj podpory pro ještě lepší správu práce podle atributů zákazníků.",
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
        intake_responsibility: "Odpovědnost za příjem",
        intake_sources: "Zdroje příjmu",
        title: "Příjem",
        short_title: "Příjem",
        description: "Umožněte nečlenům sdílet chyby, zpětnou vazbu a návrhy; bez narušení vašeho pracovního postupu.",
        toggle_title: "Povolit příjem",
        toggle_description: "Povolit členům projektu vytvářet žádosti o příjem v aplikaci.",
        toggle_tooltip_on: "Požádejte správce projektu, aby to zapnul.",
        toggle_tooltip_off: "Požádejte správce projektu, aby to vypnul.",
        notify_assignee: {
          title: "Upozornit přiřazené",
          description: "Pro novou žádost o příjem budou výchozí přiřazení upozorněni prostřednictvím oznámení",
        },
        in_app: {
          title: "V aplikaci",
          description:
            "Získejte nové pracovní položky od členů a hostů ve vašem pracovním prostoru bez narušení stávajících.",
        },
        email: {
          title: "E-mail",
          description: "Sbírejte nové pracovní položky od kohokoli, kdo pošle e-mail na adresu Plane.",
          fieldName: "ID e-mailu",
        },
        form: {
          title: "Formuláře",
          description:
            "Umožněte lidem mimo váš pracovní prostor vytvářet potenciální nové pracovní položky prostřednictvím vyhrazeného a zabezpečeného formuláře.",
          fieldName: "Výchozí URL formuláře",
          create_forms: "Vytvářejte formuláře pomocí typů pracovních položek",
          manage_forms: "Spravovat formuláře",
          manage_forms_tooltip: "Požádejte správce pracovního prostoru o správu.",
          create_form: "Vytvořit formulář",
          edit_form: "Upravit podrobnosti formuláře",
          form_title: "Název formuláře",
          form_title_required: "Název formuláře je povinný",
          work_item_type: "Typ pracovní položky",
          remove_property: "Odebrat vlastnost",
          select_properties: "Vybrat vlastnosti",
          search_placeholder: "Hledat vlastnosti",
          toasts: {
            success_create: "Formulář příjmu byl úspěšně vytvořen",
            success_update: "Formulář příjmu byl úspěšně aktualizován",
            error_create: "Nepodařilo se vytvořit formulář příjmu",
            error_update: "Nepodařilo se aktualizovat formulář příjmu",
          },
        },
        toasts: {
          set: {
            loading: "Nastavování přiřazených...",
            success: {
              title: "Úspěch!",
              message: "Přiřazení úspěšně nastaveno.",
            },
            error: {
              title: "Chyba!",
              message: "Při nastavování přiřazených se něco pokazilo. Zkuste to prosím znovu.",
            },
          },
        },
      },
      time_tracking: {
        title: "Sledování času",
        short_title: "Sledování času",
        description: "Zaznamenávejte čas strávený na pracovních položkách a projektech.",
        toggle_title: "Povolit sledování času",
        toggle_description: "Členové projektu budou moci zaznamenávat odpracovaný čas.",
      },
      milestones: {
        title: "Milníky",
        short_title: "Milníky",
        description: "Milníky poskytují vrstvu pro sladění pracovních položek směrem ke sdíleným termínům dokončení.",
        toggle_title: "Povolit milníky",
        toggle_description: "Organizujte pracovní položky podle termínů milníků.",
      },
      toasts: {
        loading: "Aktualizace funkce projektu...",
        success: "Funkce projektu byla úspěšně aktualizována.",
        error: "Při aktualizaci funkce projektu se něco pokazilo. Zkuste to prosím znovu.",
      },
    },
    epics: {
      properties: {
        title: "Vlastnosti",
        description: "Přidejte vlastní vlastnosti k vaší epice.",
      },
      disabled: "Zakázáno",
    },
    cycles: {
      auto_schedule: {
        heading: "Automatické plánování cyklů",
        description: "Udržujte cykly v pohybu bez manuálního nastavení.",
        tooltip: "Automaticky vytvářejte nové cykly na základě zvoleného rozvrhu.",
        edit_button: "Upravit",
        form: {
          cycle_title: {
            label: "Název cyklu",
            placeholder: "Název",
            tooltip: "K názvu budou přidána čísla pro následné cykly. Například: Design - 1/2/3",
            validation: {
              required: "Název cyklu je povinný",
              max_length: "Název nesmí přesáhnout 255 znaků",
            },
          },
          cycle_duration: {
            label: "Trvání cyklu",
            unit: "Týdny",
            validation: {
              required: "Trvání cyklu je povinné",
              min: "Trvání cyklu musí být alespoň 1 týden",
              max: "Trvání cyklu nemůže přesáhnout 30 týdnů",
              positive: "Trvání cyklu musí být kladné",
            },
          },
          cooldown_period: {
            label: "Období chlazení",
            unit: "dny",
            tooltip: "Pauza mezi cykly před začátkem dalšího.",
            validation: {
              required: "Období chlazení je povinné",
              negative: "Období chlazení nemůže být záporné",
            },
          },
          start_date: {
            label: "Den zahájení cyklu",
            validation: {
              required: "Datum zahájení je povinné",
              past: "Datum zahájení nemůže být v minulosti",
            },
          },
          number_of_cycles: {
            label: "Počet budoucích cyklů",
            validation: {
              required: "Počet cyklů je povinný",
              min: "Je vyžadován alespoň 1 cyklus",
              max: "Nelze naplánovat více než 3 cykly",
            },
          },
          auto_rollover: {
            label: "Automatický převod pracovních položek",
            tooltip: "V den dokončení cyklu přesunout všechny nedokončené pracovní položky do dalšího cyklu.",
          },
        },
        toast: {
          toggle: {
            loading_enable: "Povolování automatického plánování cyklů",
            loading_disable: "Zakazování automatického plánování cyklů",
            success: {
              title: "Úspěch!",
              message: "Automatické plánování cyklů bylo úspěšně přepnuto.",
            },
            error: {
              title: "Chyba!",
              message: "Nepodařilo se přepnout automatické plánování cyklů.",
            },
          },
          save: {
            loading: "Ukládání konfigurace automatického plánování cyklů",
            success: {
              title: "Úspěch!",
              message_create: "Konfigurace automatického plánování cyklů byla úspěšně uložena.",
              message_update: "Konfigurace automatického plánování cyklů byla úspěšně aktualizována.",
            },
            error: {
              title: "Chyba!",
              message_create: "Nepodařilo se uložit konfiguraci automatického plánování cyklů.",
              message_update: "Nepodařilo se aktualizovat konfiguraci automatického plánování cyklů.",
            },
          },
        },
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
    transfer: {
      no_cycles_available: "Žádné jiné cykly nejsou k dispozici pro přenos pracovních položek.",
    },
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
      trailing: "Zpoždění",
      leading: "Předstih",
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
          highlight_changes: "Zvýraznit změny",
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
  workspace_dashboards: "Dashboards",
  pi_chat: "Plane AI",
  in_app: "V aplikaci",
  forms: "Formuláře",
  choose_workspace_for_integration: "Vyberte pracovní prostor pro připojení této aplikace",
  integrations_description:
    "Aplikace, které pracují s Plane, musí být připojeny k pracovnímu prostoru, kde jste správce.",
  create_a_new_workspace: "Vytvořit nový pracovní prostor",
  no_workspaces_to_connect: "Žádné pracovní prostory k připojení",
  no_workspaces_to_connect_description: "Musíte vytvořit pracovní prostor, abyste mohli připojit integraci a šablony",
  learn_more_about_workspaces: "Zjistit více o pracovních prostorech",
  updates: {
    progress: {
      title: "Průběh",
      since_last_update: "Od poslední aktualizace",
      comments: "{count, plural, one{# komentář} other{# komentářů}}",
    },
    add_update: "Přidat aktualizaci",
    add_update_placeholder: "Napište svou aktualizaci zde",
    empty: {
      title: "Zatím žádné aktualizace",
      description: "Můžete zde vidět aktualizace.",
    },
    reaction: {
      create: {
        success: {
          title: "Reakce vytvořena",
          message: "Reakce byla úspěšně vytvořena",
        },
        error: {
          title: "Reakce nebyla vytvořena",
          message: "Reakce se nepodařilo vytvořit",
        },
      },
      remove: {
        success: {
          title: "Reakce odstraněna",
          message: "Reakce byla úspěšně odstraněna",
        },
        error: {
          title: "Reakce nebyla odstraněna",
          message: "Reakce se nepodařilo odstranit",
        },
      },
    },
    create: {
      success: {
        title: "Aktualizace vytvořena",
        message: "Aktualizace byla úspěšně vytvořena",
      },
      error: {
        title: "Aktualizace nebyla vytvořena",
        message: "Aktualizace se nepodařilo vytvořit",
      },
    },
    delete: {
      title: "Smazat aktualizaci",
      confirmation: "Opravdu chcete smazat tuto aktualizaci? Tato akce je nevratná.",
      success: {
        title: "Aktualizace smazána",
        message: "Aktualizace byla úspěšně smazána",
      },
      error: {
        title: "Aktualizace nebyla smazána",
        message: "Aktualizace se nepodařilo smazat",
      },
    },
    update: {
      success: {
        title: "Aktualizace aktualizována",
        message: "Aktualizace byla úspěšně aktualizována",
      },
      error: {
        title: "Aktualizace nebyla aktualizována",
        message: "Aktualizace se nepodařilo aktualizovat",
      },
    },
  },
  teamspaces: {
    label: "Týmové prostory",
    empty_state: {
      general: {
        title: "Týmové prostory odemykají lepší organizaci a sledování v Plane.",
        description:
          "Vytvořte vyhrazený prostor pro každý reálný tým, oddělený od všech ostatních pracovních ploch v Plane, a přizpůsobte je tak, aby vyhovovaly tomu, jak váš tým pracuje.",
        primary_button: {
          text: "Vytvořit nový týmový prostor",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "Zatím jste nepropojili žádné týmové prostory.",
          description: "Vlastníci týmového prostoru a projektu mohou spravovat přístup k projektům.",
        },
      },
      primary_button: {
        text: "Propojit týmový prostor",
      },
      secondary_button: {
        text: "Zjistit více",
      },
      table: {
        columns: {
          teamspaceName: "Název týmového prostoru",
          members: "Členové",
          accountType: "Typ účtu",
        },
        actions: {
          remove: {
            button: {
              text: "Odstranit týmový prostor",
            },
            confirm: {
              title: "Odstranit {teamspaceName} z {projectName}",
              description:
                "Když odstraníte tento týmový prostor z propojeného projektu, členové zde ztratí přístup k propojenému projektu.",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "Nebyly nalezeny žádné odpovídající týmové prostory",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {Propojili jste týmový prostor s tímto projektem.} other {Propojili jste # týmových prostorů s tímto projektem.}}",
            description:
              "{additionalCount, plural, =0 {Týmový prostor {firstTeamspaceName} je nyní propojen s tímto projektem.} other {Týmový prostor {firstTeamspaceName} a {additionalCount} dalších je nyní propojeno s tímto projektem.}}",
          },
          error: {
            title: "To se nepodařilo.",
            description: "Zkuste to znovu nebo obnovte tuto stránku před dalším pokusem.",
          },
        },
        remove_teamspace: {
          success: {
            title: "Odstranili jste tento týmový prostor z projektu.",
            description: "Týmový prostor {teamspaceName} byl odstraněn z {projectName}.",
          },
          error: {
            title: "To se nepodařilo.",
            description: "Zkuste to znovu nebo obnovte tuto stránku před dalším pokusem.",
          },
        },
      },
      link_teamspace: {
        placeholder: "Hledat týmové prostory",
        info: {
          title: "Přidání týmového prostoru poskytne všem členům týmového prostoru přístup k tomuto projektu.",
          link: "Zjistit více",
        },
        empty_state: {
          no_teamspaces: {
            title: "Nemáte žádné týmové prostory k propojení.",
            description:
              "Buď nejste v týmovém prostoru, který můžete propojit, nebo jste již propojili všechny dostupné týmové prostory.",
          },
          no_results: {
            title: "To neodpovídá žádnému z vašich týmových prostorů.",
            description: "Zkuste jiný výraz nebo se ujistěte, že máte týmové prostory k propojení.",
          },
        },
        primary_button: {
          text: "Propojit vybrané týmové prostory",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "Vytvořte pracovní položky specifické pro tým.",
        description:
          "Pracovní položky, které jsou přiřazeny členům tohoto týmu v jakémkoli propojeném projektu, se zde automaticky zobrazí. Pokud očekáváte, že zde uvidíte nějaké pracovní položky, ujistěte se, že vaše propojené projekty mají pracovní položky přiřazené členům tohoto týmu, nebo vytvořte pracovní položky.",
        primary_button: {
          text: "Přidat pracovní položky do propojeného projektu",
        },
      },
      work_items_empty_filter: {
        title: "Pro aplikované filtry nejsou žádné pracovní položky specifické pro tým",
        description:
          "Změňte některé z těchto filtrů nebo je všechny vymažte, abyste viděli pracovní položky relevantní pro tento prostor.",
        secondary_button: {
          text: "Vymazat všechny filtry",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "Žádné z vašich propojených projektů nemají aktivní cyklus.",
        description:
          "Aktivní cykly v propojených projektech se zde automaticky zobrazí. Pokud očekáváte, že uvidíte aktivní cyklus, ujistěte se, že běží v propojeném projektu právě teď.",
      },
      completed: {
        title: "Žádné z vašich propojených projektů nemají dokončený cyklus.",
        description:
          "Dokončené cykly v propojených projektech se zde automaticky zobrazí. Pokud očekáváte, že uvidíte dokončený cyklus, ujistěte se, že je také dokončen v propojeném projektu.",
      },
      upcoming: {
        title: "Žádné z vašich propojených projektů nemají nadcházející cyklus.",
        description:
          "Nadcházející cykly v propojených projektech se zde automaticky zobrazí. Pokud očekáváte, že zde bude nadcházející cyklus, ujistěte se, že je také v propojeném projektu.",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title: "Pohledy vašeho týmu na vaši práci bez narušení jakýchkoli jiných pohledů ve vašem workspace",
        description:
          "Uvidíte práci vašeho týmu v pohledech, které jsou uloženy pouze pro váš tým a odděleně od pohledů projektu.",
        primary_button: {
          text: "Vytvořit pohled",
        },
      },
      filter: {
        title: "Žádné shodné pohledy",
        description: `Žádné pohledy neodpovídají kritériím vyhledávání.
 Vytvořte nový pohled místo toho.`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "Uložte znalosti vašeho týmu na týmových stránkách.",
        description:
          "Na rozdíl od stránek v projektu můžete uložit znalosti specifické pro tým do samostatné sady stránek zde. Získejte všechny funkce stránek, snadno vytvářejte dokumenty s osvědčenými postupy a týmové wiky.",
        primary_button: {
          text: "Vytvořit svou první týmovou stránku",
        },
      },
      filter: {
        title: "Žádné shodné stránky",
        description: "Odstraňte filtry, abyste viděli všechny stránky",
      },
      search: {
        title: "Žádné shodné stránky",
        description: "Odstraňte kritéria vyhledávání, abyste viděli všechny stránky",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "Žádné z vašich propojených projektů nemají publikované pracovní položky.",
        description:
          "Vytvořte nějaké pracovní položky v jednom nebo více z těchto projektů, abyste viděli pokrok podle dat, stavů a priority.",
      },
      relation: {
        blocking: {
          title: "Nemáte žádné pracovní položky blokujícího spoluhráče.",
          description: "Dobrá práce! Uvolnili jste cestu pro svůj tým. Jste dobrý týmový hráč.",
        },
        blocked: {
          title: "Nemáte žádné pracovní položky spoluhráče, které by vás blokovaly.",
          description: "Dobré zprávy! Můžete pokročit ve všech svých přiřazených pracovních položkách.",
        },
      },
      stats: {
        general: {
          title: "Žádné z vašich propojených projektů nemají publikované pracovní položky.",
          description:
            "Vytvořte nějaké pracovní položky v jednom nebo více z těchto projektů, abyste viděli rozložení práce podle projektů a členů týmu.",
        },
        filter: {
          title: "Pro aplikované filtry nejsou žádné týmové statistiky.",
          description:
            "Vytvořte nějaké pracovní položky v jednom nebo více z těchto projektů, abyste viděli rozložení práce podle projektů a členů týmu.",
        },
      },
    },
  },
  initiatives: {
    overview: "Přehled",
    label: "Iniciativy",
    placeholder: "{count, plural, one{# iniciativa} other{# iniciativy}}",
    add_initiative: "Přidat iniciativu",
    create_initiative: "Vytvořit iniciativu",
    update_initiative: "Aktualizovat iniciativu",
    initiative_name: "Název iniciativy",
    all_initiatives: "Všechny iniciativy",
    delete_initiative: "Smazat iniciativu",
    fill_all_required_fields: "Vyplňte prosím všechna povinná pole.",
    toast: {
      create_success: "Iniciativa {name} byla úspěšně vytvořena.",
      create_error: "Nepodařilo se vytvořit iniciativu. Zkuste to prosím znovu!",
      update_success: "Iniciativa {name} byla úspěšně aktualizována.",
      update_error: "Nepodařilo se aktualizovat iniciativu. Zkuste to prosím znovu!",
      delete: {
        success: "Iniciativa byla úspěšně smazána.",
        error: "Nepodařilo se smazat iniciativu",
      },
      link_copied: "Odkaz na iniciativu byl zkopírován do schránky.",
      project_update_success: "Projekty iniciativy byly úspěšně aktualizovány.",
      project_update_error: "Nepodařilo se aktualizovat projekty iniciativy. Zkuste to prosím znovu!",
      epic_update_success:
        "Epic{count, plural, one { byl úspěšně přidán do iniciativy.} other {y byly úspěšně přidány do iniciativy.}}",
      epic_update_error: "Přidání epiku do iniciativy se nezdařilo. Zkuste to prosím znovu později.",
      state_update_success: "Stav iniciativy byl úspěšně aktualizován.",
      state_update_error: "Nepodařilo se aktualizovat stav iniciativy. Zkuste to prosím znovu!",
      label_update_error: "Nepodařilo se aktualizovat štítky iniciativy. Zkuste to prosím znovu!",
    },
    empty_state: {
      general: {
        title: "Organizujte práci na nejvyšší úrovni s iniciativami",
        description:
          "Když potřebujete organizovat práci, která se rozprostírá přes několik projektů a týmů, iniciativy jsou užitečné. Propojte projekty a epiky s iniciativami, sledujte automaticky shrnuté aktualizace a uvidíte lesy, než se dostanete k jednotlivým stromům.",
        primary_button: {
          text: "Vytvořit iniciativu",
        },
      },
      search: {
        title: "Žádné shodné iniciativy",
        description: `Žádné iniciativy nebyly detekovány s odpovídajícími kritérii.
 Vytvořte novou iniciativu místo toho.`,
      },
      not_found: {
        title: "Iniciativa neexistuje",
        description: "Iniciativa, kterou hledáte, neexistuje, byla archivována nebo byla smazána.",
        primary_button: {
          text: "Zobrazit další iniciativy",
        },
      },
      epics: {
        title: "You don't have epics that match the filters you have applied.",
        subHeading: "To see all epics, clear all applied filters.",
        action: "Clear filters",
      },
    },
    scope: {
      view_scope: "Zobrazit rozsah",
      breakdown: "Rozklad rozsahu",
      add_scope: "Přidat rozsah",
      label: "Rozsah",
      empty_state: {
        title: "Zatím nebyl přidán žádný rozsah do této iniciativy",
        description: "Propojte projekty a epiky a sledujte práci v tomto prostoru.",
        primary_button: {
          text: "Přidat rozsah",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "Štítky",
        description: "Strukturalizujte a organizujte své iniciativy pomocí štítků.",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "Smazat štítek",
        content:
          "Opravdu chcete odstranit {labelName}? Tímto odstraníte štítek ze všech iniciativ a ze všech zobrazení, kde je štítek filtrován.",
      },
      toast: {
        delete_error: "Štítek iniciativy nelze odstranit. Zkuste to prosím znovu.",
        label_already_exists: "Štítek již existuje",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title:
          "Napište poznámku, dokument nebo celou znalostní bázi. Získejte pomoc od Galilea, AI asistenta Plane, abyste začali",
        description:
          "Stránky jsou prostor pro myšlenky v Plane. Zaznamenejte si poznámky z jednání, snadno je naformátujte, vložte pracovní položky, uspořádejte je pomocí knihovny komponent a udržujte je všechny v kontextu vašeho projektu. Abychom usnadnili práci s jakýmkoli dokumentem, vyvolejte Galilea, AI Plane, pomocí zkratky nebo kliknutím na tlačítko.",
        primary_button: {
          text: "Vytvořit svou první stránku",
        },
      },
      private: {
        title: "Zatím žádné soukromé stránky",
        description: "Udržujte své soukromé myšlenky zde. Až budete připraveni sdílet, tým je jen na kliknutí daleko.",
        primary_button: {
          text: "Vytvořit svou první stránku",
        },
      },
      public: {
        title: "Zatím žádné stránky pracovního prostoru",
        description: "Zde uvidíte stránky sdílené se všemi ve vašem pracovním prostoru.",
        primary_button: {
          text: "Vytvořit svou první stránku",
        },
      },
      archived: {
        title: "Zatím žádné archivované stránky",
        description:
          "Archivujte stránky, které nejsou na vašem radaru. Zde k nim získáte přístup, když je potřebujete.",
      },
    },
  },
  epics: {
    label: "Epiky",
    no_epics_selected: "Žádné epiky nejsou vybrány",
    add_selected_epics: "Přidat vybrané epiky",
    epic_link_copied_to_clipboard: "Odkaz na epik byl zkopírován do schránky.",
    project_link_copied_to_clipboard: "Odkaz na projekt byl zkopírován do schránky",
    empty_state: {
      general: {
        title: "Vytvořte epik a přiřaďte ho někomu, i sobě",
        description:
          "Pro větší objemy práce, které se rozprostírají přes několik cyklů a mohou žít napříč moduly, vytvořte epik. Propojte pracovní položky a sub-pracovní položky v projektu s epikem a přejděte do pracovní položky z přehledu.",
        primary_button: {
          text: "Vytvořit epik",
        },
      },
      section: {
        title: "Zatím žádné epiky",
        description: "Začněte přidávat epiky pro správu a sledování pokroku.",
        primary_button: {
          text: "Přidat epiky",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "Žádné shodné epiky nenalezeny",
      },
      no_epics: {
        title: "Žádné epiky nenalezeny",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "Žádné aktivní cykly",
        description:
          "Cyklus vašich projektů, který zahrnuje jakékoli období, které zahrnuje dnešní datum ve svém rozsahu. Najděte pokrok a detaily všech vašich aktivních cyklů zde.",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: `Přidejte pracovní položky do cyklu, abyste viděli jeho
 pokrok`,
      },
      priority: {
        title: `Pozorujte vysoce prioritní pracovní položky řešené v
 cyklu na první pohled.`,
      },
      assignee: {
        title: `Přidejte přiřazení k pracovním položkám, abyste viděli
 rozdělení práce podle přiřazení.`,
      },
      label: {
        title: `Přidejte štítky k pracovním položkám, abyste viděli
 rozdělení práce podle štítků.`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "Importovat členy z CSV",
      description: "Nahrajte CSV se sloupci: Email, Display Name, First Name, Last Name, Role (5, 15 nebo 20)",
      dropzone: {
        active: "Přetáhněte CSV soubor sem",
        inactive: "Přetáhněte nebo klikněte pro nahrání",
        file_type: "Podporovány jsou pouze soubory .csv",
      },
      buttons: {
        cancel: "Zrušit",
        import: "Importovat",
        try_again: "Zkusit znovu",
        close: "Zavřít",
        done: "Hotovo",
      },
      progress: {
        uploading: "Nahrávání...",
        importing: "Importování...",
      },
      summary: {
        title: {
          failed: "Import selhal",
          complete: "Import dokončen",
        },
        message: {
          seat_limit: "Nelze importovat členy kvůli omezení počtu míst.",
          success: "Úspěšně přidáno {count} člen{plural} do pracovního prostoru.",
          no_imports: "Ze souboru CSV nebyli importováni žádní členové.",
        },
        stats: {
          successful: "Úspěšné",
          failed: "Neúspěšné",
        },
        download_errors: "Stáhnout chyby",
      },
      toast: {
        invalid_file: {
          title: "Neplatný soubor",
          message: "Podporovány jsou pouze CSV soubory.",
        },
        import_failed: {
          title: "Import selhal",
          message: "Něco se pokazilo.",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "Nelze archivovat pracovní položky",
        message: "Archivovat lze pouze pracovní položky patřící do skupin stavů Dokončeno nebo Zrušeno.",
      },
      invalid_issue_start_date: {
        title: "Nelze aktualizovat pracovní položky",
        message:
          "Vybrané datum zahájení přesahuje datum splatnosti pro některé pracovní položky. Ujistěte se, že datum zahájení je před datem splatnosti.",
      },
      invalid_issue_target_date: {
        title: "Nelze aktualizovat pracovní položky",
        message:
          "Vybrané datum splatnosti předchází datu zahájení pro některé pracovní položky. Ujistěte se, že datum splatnosti je po datu zahájení.",
      },
      invalid_state_transition: {
        title: "Nelze aktualizovat pracovní položky",
        message: "Změna stavu není povolena pro některé pracovní položky. Ujistěte se, že je změna stavu povolena.",
      },
    },
  },
  work_item_types: {
    label: "Typy pracovních položek",
    label_lowercase: "typy pracovních položek",
    settings: {
      title: "Typy pracovních položek",
      properties: {
        title: "Vlastní vlastnosti",
        tooltip:
          "Každý typ pracovních položek má výchozí sadu vlastností jako Název, Popis, Přiřazený, Stav, Priorita, Datum zahájení, Datum splatnosti, Modul, Cyklus atd. Můžete také přizpůsobit a přidat své vlastní vlastnosti, aby vyhovovaly potřebám vašeho týmu.",
        add_button: "Přidat novou vlastnost",
        dropdown: {
          label: "Typ vlastnosti",
          placeholder: "Vyberte typ",
        },
        property_type: {
          text: {
            label: "Text",
          },
          number: {
            label: "Číslo",
          },
          dropdown: {
            label: "Rozbalovací seznam",
          },
          boolean: {
            label: "Boolean",
          },
          date: {
            label: "Datum",
          },
          member_picker: {
            label: "Výběr člena",
          },
          release_picker: {
            label: "Výběr vydání",
          },
          formula: {
            label: "Vzorec",
          },
        },
        attributes: {
          label: "Atributy",
          text: {
            single_line: {
              label: "Jednoduchý řádek",
            },
            multi_line: {
              label: "Odstavec",
            },
            readonly: {
              label: "Pouze pro čtení",
              header: "Data pouze pro čtení",
            },
            invalid_text_format: {
              label: "Neplatný formát textu",
            },
          },
          number: {
            default: {
              placeholder: "Přidat číslo",
            },
          },
          relation: {
            single_select: {
              label: "Jednoduchý výběr",
            },
            multi_select: {
              label: "Vícenásobný výběr",
            },
            no_default_value: {
              label: "Žádná výchozí hodnota",
            },
          },
          boolean: {
            label: "Pravda | Nepravda",
            no_default: "Žádná výchozí hodnota",
          },
          option: {
            create_update: {
              label: "Možnosti",
              form: {
                placeholder: "Přidat možnost",
                errors: {
                  name: {
                    required: "Název možnosti je povinný.",
                    integrity: "Možnost se stejným názvem již existuje.",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "Vyberte možnost",
                multi: {
                  default: "Vyberte možnosti",
                  variable: "{count} vybraných možností",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "Úspěch!",
              message: "Vlastnost {name} byla úspěšně vytvořena.",
            },
            error: {
              title: "Chyba!",
              message: "Nepodařilo se vytvořit vlastnost. Zkuste to prosím znovu!",
            },
          },
          update: {
            success: {
              title: "Úspěch!",
              message: "Vlastnost {name} byla úspěšně aktualizována.",
            },
            error: {
              title: "Chyba!",
              message: "Nepodařilo se aktualizovat vlastnost. Zkuste to prosím znovu!",
            },
          },
          delete: {
            success: {
              title: "Úspěch!",
              message: "Vlastnost {name} byla úspěšně smazána.",
            },
            error: {
              title: "Chyba!",
              message: "Nepodařilo se smazat vlastnost. Zkuste to prosím znovu!",
            },
          },
          enable_disable: {
            loading: "{action} {name} vlastnost",
            success: {
              title: "Úspěch!",
              message: "Vlastnost {name} byla {action} úspěšně.",
            },
            error: {
              title: "Chyba!",
              message: "Nepodařilo se {action} vlastnost. Zkuste to prosím znovu!",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "Název",
            },
            description: {
              placeholder: "Popis",
            },
          },
          errors: {
            name: {
              required: "Musíte pojmenovat svou vlastnost.",
              max_length: "Název vlastnosti by neměl překročit 255 znaků.",
            },
            property_type: {
              required: "Musíte vybrat typ vlastnosti.",
            },
            options: {
              required: "Musíte přidat alespoň jednu možnost.",
            },
            formula: {
              required: "Výraz vzorce je vyžadován.",
              invalid: "Neplatný vzorec: {error}",
              circular_reference: "Zjištěna cyklická reference. Vzorec nemůže odkazovat sám na sebe přímo ani nepřímo.",
              invalid_reference: "Vzorec odkazuje na neexistující vlastnost.",
            },
          },
        },
        formula: {
          field_label: "Pole vzorce",
          tooltip: "Zadejte vzorec pomocí syntaxe '{'Název pole'}'. Podporuje operátory +, -, *, / a &.",
          placeholder: "Napište vzorec",
          test_button: "Test",
          validating: "Ověřování",
          validation_success: "Vzorec je platný! Vrací {resultType}",
          validation_success_with_refs: "Vzorec je platný! Vrací {resultType} ({count} odkazovaných polí)",
          error: {
            empty: "Zadejte prosím vzorec",
            missing_context: "Chybí kontext pracovního prostoru, projektu nebo typu pracovní položky",
            validation_failed: "Ověření se nezdařilo",
          },
          picker: {
            no_match: "Žádné odpovídající vlastnosti",
            no_available: "Žádné dostupné vlastnosti",
          },
        },
        enable_disable: {
          label: "Aktivní",
          tooltip: {
            disabled: "Klikněte pro zakázání",
            enabled: "Klikněte pro povolení",
          },
        },
        delete_confirmation: {
          title: "Smazat tuto vlastnost",
          description: "Smazání vlastností může vést ke ztrátě existujících dat.",
          secondary_description: "Chcete místo toho vlastnost zakázat?",
          primary_button: "{action}, smazat ji",
          secondary_button: "Ano, zakázat ji",
        },
        mandate_confirmation: {
          label: "Povinná vlastnost",
          content:
            "Zdá se, že pro tuto vlastnost existuje výchozí možnost. Učinění vlastnosti povinnou odstraní výchozí hodnotu a uživatelé budou muset přidat hodnotu podle svého výběru.",
          tooltip: {
            disabled: "Tento typ vlastnosti nelze učinit povinným",
            enabled: "Zrušte zaškrtnutí pro označení pole jako volitelného",
            checked: "Zaškrtněte pro označení pole jako povinného",
          },
        },
        empty_state: {
          title: "Přidat vlastní vlastnosti",
          description: "Nové vlastnosti, které přidáte pro tento typ pracovních položek, se zde zobrazí.",
        },
      },
      item_delete_confirmation: {
        title: "Smazat tento typ",
        description: "Odstranění typů může vést ke ztrátě stávajících dat.",
        primary_button: "Ano, smazat",
        toast: {
          success: {
            title: "Úspěch!",
            message: "Typ pracovního položky byl úspěšně odstraněn.",
          },
          error: {
            title: "Chyba!",
            message: "Nepodařilo se odstranit typ pracovního položky. Zkuste to prosím znovu!",
          },
        },
        can_disable_warning: "Chcete místo toho zakázat tento typ?",
      },
      cant_delete_default_message:
        "Tento typ pracovního položky nelze odstranit, protože je nastaven jako výchozí pro tento projekt.",
    },
    create: {
      title: "Vytvořit typ pracovních položek",
      button: "Přidat typ pracovních položek",
      toast: {
        success: {
          title: "Úspěch!",
          message: "Typ pracovních položek byl úspěšně vytvořen.",
        },
        error: {
          title: "Chyba!",
          message: {
            conflict: "Typ {name} již existuje. Zvolte jiné jméno.",
          },
        },
      },
    },
    update: {
      title: "Aktualizovat typ pracovních položek",
      button: "Aktualizovat typ pracovních položek",
      toast: {
        success: {
          title: "Úspěch!",
          message: "Typ pracovních položek {name} byl úspěšně aktualizován.",
        },
        error: {
          title: "Chyba!",
          message: {
            conflict: "Typ {name} již existuje. Zvolte jiné jméno.",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "Dejte tomuto typu pracovních položek jedinečný název",
        },
        description: {
          placeholder: "Popište, k čemu je tento typ pracovních položek určen a kdy se má používat.",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{action} {name} typ pracovních položek",
        success: {
          title: "Úspěch!",
          message: "Typ pracovních položek {name} byl {action} úspěšně.",
        },
        error: {
          title: "Chyba!",
          message: "Nepodařilo se {action} typ pracovních položek. Zkuste to prosím znovu!",
        },
      },
      tooltip: "Klikněte pro {action}",
    },
    change_confirmation: {
      title: "Změnit typ pracovních položek?",
      description:
        "Změna typu pracovních položek může vést ke ztrátě hodnot vlastních vlastností, které jsou specifické pro aktuální typ. Tuto akci nelze vrátit zpět.",
      button: {
        loading: "Mění se",
        default: "Změnit typ",
      },
    },
    empty_state: {
      enable: {
        title: "Povolit typy pracovních položek",
        description:
          "Upravte pracovní položky podle svých potřeb s typy pracovních položek. Přizpůsobte je ikonami, pozadím a vlastnostmi a nakonfigurujte je pro tento projekt.",
        primary_button: {
          text: "Povolit",
        },
        confirmation: {
          title: "Jakmile budou povoleny, typy pracovních položek nelze zakázat.",
          description:
            "Typ pracovních položek Plane se stane výchozím typem pracovních položek pro tento projekt a zobrazí se s ikonou a pozadím v tomto projektu.",
          button: {
            default: "Povolit",
            loading: "Nastavuji",
          },
        },
      },
      get_pro: {
        title: "Získejte Pro pro povolení typů pracovních položek.",
        description:
          "Upravte pracovní položky podle svých potřeb s typy pracovních položek. Přizpůsobte je ikonami, pozadím a vlastnostmi a nakonfigurujte je pro tento projekt.",
        primary_button: {
          text: "Získejte Pro",
        },
      },
      upgrade: {
        title: "Upgradujte pro povolení typů pracovních položek.",
        description:
          "Upravte pracovní položky podle svých potřeb s typy pracovních položek. Přizpůsobte je ikonami, pozadím a vlastnostmi a nakonfigurujte je pro tento projekt.",
        primary_button: {
          text: "Upgradovat",
        },
      },
    },
  },
  importers: {
    imports: "Importy",
    logo: "Logo",
    import_message: "Importujte svá data {serviceName} do projektů Plane.",
    deactivate: "Deaktivovat",
    deactivating: "Deaktivace",
    migrating: "Migrace",
    migrations: "Migrace",
    refreshing: "Obnovování",
    import: "Import",
    serial_number: "Č. poř.",
    project: "Projekt",
    workspace: "workspace",
    status: "Stav",
    summary: "Souhrn",
    total_batches: "Celkové dávky",
    imported_batches: "Importované dávky",
    re_run: "Znovu spustit",
    cancel: "Zrušit",
    start_time: "Čas zahájení",
    no_jobs_found: "Žádné úkoly nenalezeny",
    no_project_imports: "Ještě jste neimportovali žádné projekty {serviceName}.",
    cancel_import_job: "Zrušit úlohu importu",
    cancel_import_job_confirmation:
      "Opravdu chcete zrušit tuto úlohu importu? Tímto zastavíte proces importu pro tento projekt.",
    re_run_import_job: "Znovu spustit úlohu importu",
    re_run_import_job_confirmation:
      "Opravdu chcete znovu spustit tuto úlohu importu? Tímto restartujete proces importu pro tento projekt.",
    upload_csv_file: "Nahrajte CSV soubor pro import uživatelských dat.",
    connect_importer: "Připojit {serviceName}",
    migration_assistant: "Asistent migrace",
    migration_assistant_description:
      "Bezproblémově migrujte své projekty {serviceName} do Plane s naším výkonným asistentem.",
    token_helper: "Toto získáte od svého",
    personal_access_token: "Osobní přístupový token",
    source_token_expired: "Token vypršel",
    source_token_expired_description:
      "Poskytnutý token vypršel. Prosím, deaktivujte a znovu se připojte s novou sadou přihlašovacích údajů.",
    user_email: "Uživatelský e-mail",
    select_state: "Vyberte stav",
    select_service_project: "Vyberte projekt {serviceName}",
    loading_service_projects: "Načítání projektů {serviceName}",
    select_service_workspace: "Vyberte {serviceName} workspace",
    loading_service_workspaces: "Načítání {serviceName} workspace",
    select_priority: "Vyberte prioritu",
    select_service_team: "Vyberte tým {serviceName}",
    add_seat_msg_free_trial:
      "Snažíte se importovat {additionalUserCount} neregistrovaných uživatelů a máte pouze {currentWorkspaceSubscriptionAvailableSeats} dostupných míst v aktuálním plánu. Pro pokračování v importu nyní upgradujte.",
    add_seat_msg_paid:
      "Snažíte se importovat {additionalUserCount} neregistrovaných uživatelů a máte pouze {currentWorkspaceSubscriptionAvailableSeats} dostupných míst v aktuálním plánu. Pro pokračování v importu zakupte alespoň {extraSeatRequired} další místa.",
    skip_user_import_title: "Přeskočit import uživatelských dat",
    skip_user_import_description:
      "Přeskočení importu uživatelů povede k tomu, že pracovní položky, komentáře a další data z {serviceName} budou vytvořeny uživatelem provádějícím migraci v Plane. Uživatelé mohou být později stále přidáni ručně.",
    invalid_pat: "Neplatný osobní přístupový token",
  },
  integrations: {
    integrations: "Integrace",
    loading: "Načítání",
    unauthorized: "Nemáte oprávnění k zobrazení této stránky.",
    configure: "Nastavit",
    not_enabled: "{name} není pro tento workspace povoleno.",
    not_configured: "Není nakonfigurováno",
    disconnect_personal_account: "Odpojit osobní účet {providerName}",
    not_configured_message_admin:
      "Integrace {name} není nakonfigurována. Prosím, kontaktujte správce instance, aby ji nakonfiguroval.",
    not_configured_message_support:
      "Integrace {name} není nakonfigurována. Prosím, kontaktujte podporu, aby ji nakonfigurovala.",
    external_api_unreachable: "Nelze přistupovat k externímu API. Zkuste to prosím znovu později.",
    error_fetching_supported_integrations: "Nelze načíst podporované integrace. Zkuste to prosím znovu později.",
    back_to_integrations: "Zpět k integracím",
    select_state: "Vyberte stav",
    set_state: "Nastavit stav",
    choose_project: "Vyberte projekt...",
  },
  github_integration: {
    name: "GitHub",
    description: "Připojte a synchronizujte svou pracovní položku GitHub s Plane",
    connect_org: "Připojit organizaci",
    connect_org_description: "Připojte svou GitHub organizaci s Plane",
    processing: "Spracovává se",
    org_added_desc: "GitHub org přidána kým a kdy",
    connection_fetch_error: "Chyba při načítání detailů připojení ze serveru",
    personal_account_connected: "Osobní účet připojen",
    personal_account_connected_description: "Váš GitHub účet je nyní připojen k Plane",
    connect_personal_account: "Připojit osobní účet",
    connect_personal_account_description: "Připojte svůj osobní GitHub účet s Plane.",
    repo_mapping: "Mapování repozitářů",
    repo_mapping_description: "Mapujte své GitHub repozitáře s projekty Plane.",
    project_issue_sync: "Synchronizace problémů projektu",
    project_issue_sync_description: "Synchronizujte problémy z GitHub do vašeho projektu Plane",
    project_issue_sync_empty_state: "Namapované synchronizace problémů projektu se zobrazí zde",
    configure_project_issue_sync_state: "Nastavte stav synchronizace problémů",
    select_issue_sync_direction: "Vyberte směr synchronizace problémů",
    allow_bidirectional_sync: "Bidirectional - Synchronizujte problémy a komentáře oběma směry mezi GitHub a Plane",
    allow_unidirectional_sync: "Unidirectional - Synchronizujte problémy a komentáře z GitHub do Plane pouze",
    allow_unidirectional_sync_warning:
      "Data z GitHub Issue nahradí data v propojené Plane pracovní položce (GitHub → Plane pouze)",
    remove_project_issue_sync: "Odstranit tuto synchronizaci problémů projektu",
    remove_project_issue_sync_confirmation: "Jste si jisti, že chcete odstranit tuto synchronizaci problémů projektu?",
    add_pr_state_mapping: "Přidat mapování stavu žádosti o sloučení pro projekt Plane",
    edit_pr_state_mapping: "Upravit mapování stavu žádosti o sloučení pro projekt Plane",
    pr_state_mapping: "Mapování stavu žádosti o sloučení",
    pr_state_mapping_description: "Mapujte stavy žádosti o sloučení z GitHub do vašeho projektu Plane",
    pr_state_mapping_empty_state: "Namapované stavy PR se zobrazí zde",
    remove_pr_state_mapping: "Odstranit toto mapování stavu žádosti o sloučení",
    remove_pr_state_mapping_confirmation: "Jste si jisti, že chcete odstranit tuto mapování stavu žádosti o sloučení?",
    issue_sync_message: "Pracovní položky jsou synchronizovány do {project}",
    link: "Propojit GitHub repozitář s projektem Plane",
    pull_request_automation: "Automatizace žádosti o sloučení",
    pull_request_automation_description: "Nastavte mapování stavu žádosti o sloučení z GitHub do vašeho projektu Plane",
    DRAFT_MR_OPENED: "Při otevření návrhu MR nastavte stav na",
    MR_OPENED: "Při otevření MR nastavte stav na",
    MR_READY_FOR_MERGE: "Při připravenosti MR ke sloučení nastavte stav na",
    MR_REVIEW_REQUESTED: "Při žádosti o revizi MR nastavte stav na",
    MR_MERGED: "Při sloučení MR nastavte stav na",
    MR_CLOSED: "Při uzavření MR nastavte stav na",
    ISSUE_OPEN: "Při otevření problému nastavte stav na",
    ISSUE_CLOSED: "Při uzavření problému nastavte stav na",
    save: "Uložit",
    start_sync: "Spustit synchronizaci",
    choose_repository: "Vyberte repozitář...",
  },
  gitlab_integration: {
    name: "Gitlab",
    description: "Připojte a synchronizujte své žádosti o sloučení Gitlab s Plane.",
    connection_fetch_error: "Chyba při načítání podrobností o připojení ze serveru",
    connect_org: "Připojit organizaci",
    connect_org_description: "Připojte svou organizaci Gitlab k Plane.",
    project_connections: "Připojení projektů Gitlab",
    project_connections_description: "Synchronizujte žádosti o sloučení z Gitlabu do projektů Plane.",
    plane_project_connection: "Připojení projektu Plane",
    plane_project_connection_description: "Nastavte mapování stavu žádosti o sloučení z Gitlabu do projektů Plane",
    remove_connection: "Odstranit připojení",
    remove_connection_confirmation: "Opravdu chcete odstranit toto připojení?",
    link: "Propojit repozitář Gitlab s projektem Plane",
    pull_request_automation: "Automatizace žádosti o sloučení",
    pull_request_automation_description: "Nastavte mapování stavu žádosti o sloučení z Gitlabu do Plane",
    DRAFT_MR_OPENED: "Při otevření návrhu MR nastavte stav na",
    MR_OPENED: "Při otevření MR nastavte stav na",
    MR_REVIEW_REQUESTED: "Při žádosti o revizi MR nastavte stav na",
    MR_READY_FOR_MERGE: "Při připravenosti MR ke sloučení nastavte stav na",
    MR_MERGED: "Při sloučení MR nastavte stav na",
    MR_CLOSED: "Při uzavření MR nastavte stav na",
    integration_enabled_text: "S povolenou integrací Gitlab můžete automatizovat pracovní postupy pracovních položek",
    choose_entity: "Vyberte entitu",
    choose_project: "Vyberte projekt",
    link_plane_project: "Propojit projekt Plane",
    project_issue_sync: "Synchronizace problémů projektu",
    project_issue_sync_description: "Synchronizujte problémy z Gitlab do vašeho projektu Plane",
    project_issue_sync_empty_state: "Mapovaná synchronizace problémů projektu se zobrazí zde",
    configure_project_issue_sync_state: "Konfigurovat stav synchronizace problémů",
    select_issue_sync_direction: "Vyberte směr synchronizace problémů",
    allow_bidirectional_sync: "Obousměrná - Synchronizovat problémy a komentáře oběma směry mezi Gitlab a Plane",
    allow_unidirectional_sync: "Jednosměrná - Synchronizovat problémy a komentáře pouze z Gitlab do Plane",
    allow_unidirectional_sync_warning:
      "Data z Gitlab Issue nahradí data v propojeném pracovním prvku Plane (pouze Gitlab → Plane)",
    remove_project_issue_sync: "Odstranit tuto synchronizaci problémů projektu",
    remove_project_issue_sync_confirmation: "Opravdu chcete odstranit tuto synchronizaci problémů projektu?",
    ISSUE_OPEN: "Problém otevřen",
    ISSUE_CLOSED: "Problém uzavřen",
    save: "Uložit",
    start_sync: "Spustit synchronizaci",
    choose_repository: "Vyberte repozitář...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Připojte a synchronizujte svou instanci Gitlab Enterprise s Plane.",
    app_form_title: "Konfigurace Gitlab Enterprise",
    app_form_description: "Nakonfigurujte Gitlab Enterprise pro připojení k Plane.",
    base_url_title: "Základní URL",
    base_url_description: "Základní URL vaší instance Gitlab Enterprise.",
    base_url_placeholder: 'např. "https://glab.plane.town"',
    base_url_error: "Základní URL je povinné",
    invalid_base_url_error: "Neplatné základní URL",
    client_id_title: "ID aplikace",
    client_id_description: "ID aplikace, kterou jste vytvořili ve své instanci Gitlab Enterprise.",
    client_id_placeholder: 'např. "7cd732xxxxxxxxxxxxxx"',
    client_id_error: "ID aplikace je povinné",
    client_secret_title: "Client Secret",
    client_secret_description: "Client secret aplikace, kterou jste vytvořili ve své instanci Gitlab Enterprise.",
    client_secret_placeholder: 'např. "gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "Client secret je povinný",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description:
      "Náhodný webhook secret, který bude použit k ověření webhooku z instance Gitlab Enterprise.",
    webhook_secret_placeholder: 'např. "webhook1234567890"',
    webhook_secret_error: "Webhook secret je povinný",
    connect_app: "Připojit aplikaci",
  },
  slack_integration: {
    name: "Slack",
    description: "Propojte svůj Slack workspace s Plane.",
    connect_personal_account: "Propojte svůj osobní Slack účet s Plane.",
    personal_account_connected: "Váš osobní účet {providerName} je nyní propojen s Plane.",
    link_personal_account: "Propojte svůj osobní účet {providerName} s Plane.",
    connected_slack_workspaces: "Propojené Slack workspaces",
    connected_on: "Propojeno dne {date}",
    disconnect_workspace: "Odpojit {name} workspace",
    alerts: {
      dm_alerts: {
        title:
          "Získejte upozornění v soukromých zprávách Slack pro důležité aktualizace, připomenutí a výstrahy jen pro vás.",
      },
    },
    project_updates: {
      title: "Aktualizace Projektu",
      description: "Nakonfigurujte oznámení o aktualizacích projektů pro vaše projekty",
      add_new_project_update: "Přidat nové oznámení o aktualizacích projektu",
      project_updates_empty_state: "Projekty propojené s kanály Slack se zobrazí zde.",
      project_updates_form: {
        title: "Konfigurovat Aktualizace Projektu",
        description: "Přijímejte oznámení o aktualizacích projektu ve Slack, když jsou vytvořeny pracovní položky",
        failed_to_load_channels: "Nepodařilo se načíst kanály ze Slack",
        project_dropdown: {
          placeholder: "Vyberte projekt",
          label: "Plane Projekt",
          no_projects: "Žádné dostupné projekty",
        },
        channel_dropdown: {
          label: "Slack Kanál",
          placeholder: "Vyberte kanál",
          no_channels: "Žádné dostupné kanály",
        },
        all_projects_connected: "Všechny projekty jsou již propojeny s kanály Slack.",
        all_channels_connected: "Všechny kanály Slack jsou již propojeny s projekty.",
        project_connection_success: "Propojení projektu úspěšně vytvořeno",
        project_connection_updated: "Propojení projektu úspěšně aktualizováno",
        project_connection_deleted: "Propojení projektu úspěšně odstraněno",
        failed_delete_project_connection: "Nepodařilo se odstranit propojení projektu",
        failed_create_project_connection: "Nepodařilo se vytvořit propojení projektu",
        failed_upserting_project_connection: "Nepodařilo se aktualizovat propojení projektu",
        failed_loading_project_connections:
          "Nemohli jsme načíst vaše propojení projektu. Může to být způsobeno problémem se sítí nebo problémem s integrací.",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "Připojte svůj Sentry pracovní prostor k Plane.",
    connected_sentry_workspaces: "Připojené Sentry pracovní prostory",
    connected_on: "Připojeno {date}",
    disconnect_workspace: "Odpojit pracovní prostor {name}",
    state_mapping: {
      title: "Mapování stavů",
      description:
        "Mapujte stavy incidentů Sentry na stavy vašeho projektu. Nakonfigurujte, které stavy použít, když je incident Sentry vyřešen nebo nevyřešen.",
      add_new_state_mapping: "Přidat nové mapování stavu",
      empty_state:
        "Nejsou nakonfigurována žádná mapování stavů. Vytvořte své první mapování pro synchronizaci stavů incidentů Sentry se stavy vašeho projektu.",
      failed_loading_state_mappings:
        "Nepodařilo se nám načíst vaše mapování stavů. Může to být způsobeno problémem se sítí nebo problémem s integrací.",
      loading_project_states: "Načítání stavů projektu...",
      error_loading_states: "Chyba při načítání stavů",
      no_states_available: "Nejsou dostupné žádné stavy",
      no_permission_states: "Nemáte oprávnění k přístupu ke stavům pro tento projekt",
      states_not_found: "Stavy projektu nebyly nalezeny",
      server_error_states: "Chyba serveru při načítání stavů",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "Připojte a synchronizujte svou organizaci GitHub Enterprise s Plane.",
    app_form_title: "Konfigurace GitHub Enterprise",
    app_form_description: "Konfigurujte GitHub Enterprise pro připojení s Plane.",
    app_id_title: "App ID",
    app_id_description: "ID aplikace, kterou jste vytvořili v organizaci GitHub Enterprise.",
    app_id_placeholder: 'např., "1234567890"',
    app_id_error: "App ID je povinné pole",
    app_name_title: "App Slug",
    app_name_description: "Slug aplikace, kterou jste vytvořili v organizaci GitHub Enterprise.",
    app_name_error: "App slug je povinné pole",
    app_name_placeholder: 'např., "plane-github-enterprise"',
    base_url_title: "Základní URL",
    base_url_description: "Základní URL vaší organizace GitHub Enterprise.",
    base_url_placeholder: 'např., "https://plane.github.com"',
    base_url_error: "Základní URL je povinné pole",
    invalid_base_url_error: "Neplatná základní URL",
    client_id_title: "ID klienta",
    client_id_description: "ID klienta aplikace, kterou jste vytvořili v organizaci GitHub Enterprise.",
    client_id_placeholder: 'např., "1234567890"',
    client_id_error: "ID klienta je povinné pole",
    client_secret_title: "Client Secret",
    client_secret_description: "Secret klienta aplikace, kterou jste vytvořili v organizaci GitHub Enterprise.",
    client_secret_placeholder: 'např., "1234567890"',
    client_secret_error: "Secret klienta je povinné pole",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description: "Secret webhooku aplikace, kterou jste vytvořili v organizaci GitHub Enterprise.",
    webhook_secret_placeholder: 'např., "1234567890"',
    webhook_secret_error: "Secret webhooku je povinné pole",
    private_key_title: "Soukromý klíč (Base64 encoded)",
    private_key_description:
      "Base64 encoded private key of the app you created in your GitHub Enterprise organization.",
    private_key_placeholder: 'např., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Soukromý klíč je povinné pole",
    connect_app: "Připojit aplikaci",
  },
  file_upload: {
    upload_text: "Klikněte zde pro nahrání souboru",
    drag_drop_text: "Přetáhnout a upustit",
    processing: "Zpracovává se",
    invalid: "Neplatný typ souboru",
    missing_fields: "Chybějící pole",
    success: "{fileName} nahráno!",
  },
  silo_errors: {
    invalid_query_params: "Poskytnuté dotazové parametry jsou neplatné nebo chybí povinná pole",
    invalid_installation_account: "Poskytnutý instalační účet není platný",
    generic_error: "Při zpracování vaší žádosti došlo k neočekávané chybě",
    connection_not_found: "Požadované připojení nebylo nalezeno",
    multiple_connections_found: "Bylo nalezeno více připojení, když bylo očekáváno pouze jedno",
    installation_not_found: "Požadovaná instalace nebyla nalezena",
    user_not_found: "Požadovaný uživatel nebyl nalezen",
    error_fetching_token: "Nepodařilo se získat autentizační token",
    cannot_create_multiple_connections:
      "Už jste připojili svou organizaci s pracovním prostorem. Prosím, odpojte existující připojení před připojením nového.",
    invalid_app_credentials: "Poskytnuté přihlašovací údaje aplikace jsou neplatné",
    invalid_app_installation_id: "Nepodařilo se nainstalovat aplikaci",
  },
  import_status: {
    queued: "V pořádku",
    created: "Vytvořeno",
    initiated: "Zahájeno",
    pulling: "Stahování",
    timed_out: "Časový limit vypršel",
    pulled: "Staženo",
    transforming: "Transformace",
    transformed: "Transformováno",
    pushing: "Odesílání",
    finished: "Dokončeno",
    error: "Chyba",
    cancelled: "Zrušeno",
  },
  jira_importer: {
    jira_importer_description: "Importujte svá Jira data do projektů Plane.",
    create_project_automatically: "Vytvořit projekt automaticky",
    create_project_automatically_description: "Vytvoříme pro vás nový projekt na základě podrobností o projektu Jira.",
    import_to_existing_project: "Importovat do existujícího projektu",
    import_to_existing_project_description: "Vyberte existující projekt z rozbalovací nabídky níže.",
    state_mapping_automatic_creation: "Všechny stavy Jira budou v Plane vytvořeny automaticky.",
    personal_access_token: "Osobní přístupový token",
    user_email: "Uživatelský e-mail",
    atlassian_security_settings: "Nastavení zabezpečení Atlassian",
    email_description: "Toto je e-mail spojený s vaším osobním přístupovým tokenem",
    jira_domain: "Jira doména",
    jira_domain_description: "Toto je doména vaší Jira instance",
    steps: {
      title_configure_plane: "Nastavte Plane",
      description_configure_plane:
        "Nejprve vytvořte projekt v Plane, do kterého chcete migrovat svá Jira data. Jakmile je projekt vytvořen, vyberte ho zde.",
      title_configure_jira: "Nastavte Jira",
      description_configure_jira: "Vyberte Jira workspace, ze kterého chcete migrovat svá data.",
      title_import_users: "Importovat uživatele",
      description_import_users:
        "Přidejte uživatele, které chcete migrovat z Jira do Plane. Alternativně můžete tento krok přeskočit a uživatele přidat ručně později.",
      title_map_states: "Mapovat stavy",
      description_map_states:
        "Automaticky jsme přiřadili stavy Jira k stavům Plane co nejlépe. Před pokračováním prosím mapujte jakékoli zbývající stavy, můžete také vytvořit stavy a mapovat je ručně.",
      title_map_priorities: "Mapovat priority",
      description_map_priorities:
        "Automaticky jsme přiřadili priority co nejlépe. Před pokračováním prosím mapujte jakékoli zbývající priority.",
      title_summary: "Shrnutí",
      description_summary: "Zde je shrnutí dat, která budou migrována z Jira do Plane.",
      custom_jql_filter: "Vlastní filtr JQL",
      jql_filter_description: "Použijte JQL pro filtrování konkrétních úkolů pro import.",
      project_code: "PROJEKT",
      enter_filters_placeholder: "Zadejte filtry (např. status = 'In Progress')",
      validating_query: "Ověřování dotazu...",
      validation_successful_work_items_selected: "Ověření úspěšné, vybráno {count} pracovních položek.",
      run_syntax_check: "Spustit kontrolu syntaxe pro ověření dotazu",
      refresh: "Obnovit",
      check_syntax: "Zkontrolovat syntaxi",
      no_work_items_selected: "Dotaz nevybral žádné pracovní položky.",
      validation_error_default: "Při ověřování dotazu se něco pokazilo.",
    },
  },
  asana_importer: {
    asana_importer_description: "Importujte svá Asana data do projektů Plane.",
    select_asana_priority_field: "Vyberte Asana pole priority",
    steps: {
      title_configure_plane: "Nastavte Plane",
      description_configure_plane:
        "Nejprve vytvořte projekt v Plane, do kterého chcete migrovat svá Asana data. Jakmile je projekt vytvořen, vyberte ho zde.",
      title_configure_asana: "Nastavte Asana",
      description_configure_asana: "Vyberte Asana workspace a projekt, ze kterého chcete migrovat svá data.",
      title_map_states: "Mapovat stavy",
      description_map_states: "Vyberte stavy Asana, které chcete mapovat na stavy projektů Plane.",
      title_map_priorities: "Mapovat priority",
      description_map_priorities: "Vyberte priority Asana, které chcete mapovat na priority projektů Plane.",
      title_summary: "Shrnutí",
      description_summary: "Zde je shrnutí dat, která budou migrována z Asana do Plane.",
    },
  },
  linear_importer: {
    linear_importer_description: "Importujte svá Linear data do projektů Plane.",
    steps: {
      title_configure_plane: "Nastavte Plane",
      description_configure_plane:
        "Nejprve vytvořte projekt v Plane, do kterého chcete migrovat svá Linear data. Jakmile je projekt vytvořen, vyberte ho zde.",
      title_configure_linear: "Nastavte Linear",
      description_configure_linear: "Vyberte tým Linear, ze kterého chcete migrovat svá data.",
      title_map_states: "Mapovat stavy",
      description_map_states:
        "Automaticky jsme přiřadili stavy Linear k stavům Plane co nejlépe. Před pokračováním prosím mapujte jakékoli zbývající stavy, můžete také vytvořit stavy a mapovat je ručně.",
      title_map_priorities: "Mapovat priority",
      description_map_priorities: "Vyberte priority Linear, které chcete mapovat na priority projektů Plane.",
      title_summary: "Shrnutí",
      description_summary: "Zde je shrnutí dat, která budou migrována z Linear do Plane.",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "Importujte svá Jira Server/Data Center data do projektů Plane.",
    steps: {
      title_configure_plane: "Nastavte Plane",
      description_configure_plane:
        "Nejprve vytvořte projekt v Plane, do kterého chcete migrovat svá Jira data. Jakmile je projekt vytvořen, vyberte ho zde.",
      title_configure_jira: "Nastavte Jira",
      description_configure_jira: "Vyberte workspace Jira, ze kterého chcete migrovat svá data.",
      title_map_states: "Mapovat stavy",
      description_map_states: "Vyberte stavy Jira, které chcete mapovat na stavy projektů Plane.",
      title_map_priorities: "Mapovat priority",
      description_map_priorities: "Vyberte priority Jira, které chcete mapovat na priority projektů Plane.",
      title_summary: "Shrnutí",
      description_summary: "Zde je shrnutí dat, která budou migrována z Jira do Plane.",
    },
    import_epics: {
      title: "Importovat epiky jako pracovní položky",
      description:
        "S touto aktivovanou funkcí budou vaše epiky importovány jako pracovní položky s typem pracovní položky epika.",
    },
  },
  notion_importer: {
    notion_importer_description: "Importujte svá data z Notion do projektů Plane.",
    steps: {
      title_upload_zip: "Nahrát exportovaný ZIP z Notion",
      description_upload_zip: "Prosím nahrajte ZIP soubor obsahující vaše data z Notion.",
    },
    upload: {
      drop_file_here: "Přetáhněte váš Notion zip soubor sem",
      upload_title: "Nahrát export z Notion",
      upload_from_url: "Importovat z URL",
      upload_from_url_description: "Pro pokračování vložte veřejnou URL adresu vašeho ZIP exportu.",
      drag_drop_description: "Přetáhněte váš Notion export zip soubor nebo klikněte pro procházení",
      file_type_restriction: "Podporovány jsou pouze .zip soubory exportované z Notion",
      select_file: "Vybrat soubor",
      uploading: "Nahrávání...",
      preparing_upload: "Příprava nahrávání...",
      confirming_upload: "Potvrzování nahrávání...",
      confirming: "Potvrzování...",
      upload_complete: "Nahrávání dokončeno",
      upload_failed: "Nahrávání selhalo",
      start_import: "Spustit import",
      retry_upload: "Opakovat nahrávání",
      upload: "Nahrát",
      ready: "Připraveno",
      error: "Chyba",
      upload_complete_message: "Nahrávání dokončeno!",
      upload_complete_description: 'Klikněte na "Spustit import" pro zahájení zpracování vašich dat z Notion.',
      upload_progress_message: "Prosím nezavírejte toto okno.",
    },
  },
  confluence_importer: {
    confluence_importer_description: "Importujte svá data z Confluence do wiki Plane.",
    steps: {
      title_upload_zip: "Nahrát exportovaný ZIP z Confluence",
      description_upload_zip: "Prosím nahrajte ZIP soubor obsahující vaše data z Confluence.",
    },
    upload: {
      drop_file_here: "Přetáhněte váš Confluence zip soubor sem",
      upload_title: "Nahrát export z Confluence",
      upload_from_url: "Importovat z URL",
      upload_from_url_description: "Pro pokračování vložte veřejnou URL adresu vašeho ZIP exportu.",
      drag_drop_description: "Přetáhněte váš Confluence export zip soubor nebo klikněte pro procházení",
      file_type_restriction: "Podporovány jsou pouze .zip soubory exportované z Confluence",
      select_file: "Vybrat soubor",
      uploading: "Nahrávání...",
      preparing_upload: "Příprava nahrávání...",
      confirming_upload: "Potvrzování nahrávání...",
      confirming: "Potvrzování...",
      upload_complete: "Nahrávání dokončeno",
      upload_failed: "Nahrávání selhalo",
      start_import: "Spustit import",
      retry_upload: "Opakovat nahrávání",
      upload: "Nahrát",
      ready: "Připraveno",
      error: "Chyba",
      upload_complete_message: "Nahrávání dokončeno!",
      upload_complete_description: 'Klikněte na "Spustit import" pro zahájení zpracování vašich dat z Confluence.',
      upload_progress_message: "Prosím nezavírejte toto okno.",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "Importujte svá CSV data do projektů Plane.",
    steps: {
      title_configure_plane: "Nastavte Plane",
      description_configure_plane:
        "Nejprve vytvořte projekt v Plane, do kterého chcete migrovat svá CSV data. Jakmile je projekt vytvořen, vyberte ho zde.",
      title_configure_csv: "Nastavte CSV",
      description_configure_csv:
        "Nahrajte svůj CSV soubor a nakonfigurujte pole, která mají být mapována na pole Plane.",
    },
  },
  csv_importer: {
    csv_importer_description: "Importujte pracovní položky ze souborů CSV do projektů Plane.",
    steps: {
      title_select_project: "Vybrat projekt",
      description_select_project: "Vyberte prosím projekt Plane, kam chcete importovat své pracovní položky.",
      title_upload_csv: "Nahrát CSV",
      description_upload_csv:
        "Nahrajte svůj soubor CSV obsahující pracovní položky. Soubor by měl obsahovat sloupce pro název, popis, prioritu, data a skupinu stavů.",
    },
  },
  clickup_importer: {
    clickup_importer_description: "Importujte svá ClickUp data do projektů Plane.",
    select_service_space: "Vyberte {serviceName} Space",
    select_service_folder: "Vyberte {serviceName} Folder",
    selected: "Vybráno",
    users: "Uživatelé",
    steps: {
      title_configure_plane: "Nastavte Plane",
      description_configure_plane:
        "Nejprve vytvořte projekt v Plane, do kterého chcete migrovat svá ClickUp data. Jakmile je projekt vytvořen, vyberte ho zde.",
      title_configure_clickup: "Nastavte ClickUp",
      description_configure_clickup: "Vyberte ClickUp tým, prostor a složku, ze které chcete migrovat svá data.",
      title_map_states: "Mapovat stavy",
      description_map_states:
        "Automaticky jsme přiřadili ClickUp stavy k stavům Plane co nejlépe. Před pokračováním prosím mapujte jakékoli zbývající stavy, můžete také vytvořit stavy a mapovat je ručně.",
      title_map_priorities: "Mapovat priority",
      description_map_priorities: "Vyberte ClickUp priority, kterou chcete mapovat na priority projektů Plane.",
      title_summary: "Shrnutí",
      description_summary: "Zde je shrnutí dat, která budou migrována z ClickUp do Plane.",
      pull_additional_data_title: "Importovat komentáře a přílohy",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "Sloupec",
          long_label: "Graf sloupcový",
          chart_models: {
            basic: "Základní",
            stacked: "Skládaný",
            grouped: "Skupinový",
          },
          orientation: {
            label: "Orientace",
            horizontal: "Horizontální",
            vertical: "Vertikální",
            placeholder: "Přidat orientaci",
          },
          bar_color: "Barva sloupce",
        },
        line_chart: {
          short_label: "Čára",
          long_label: "Graf čárový",
          chart_models: {
            basic: "Základní",
            multi_line: "Více čar",
          },
          line_color: "Barva čáry",
          line_type: {
            label: "Typ čáry",
            solid: "Pevná",
            dashed: "Čárkovaná",
            placeholder: "Přidat typ čáry",
          },
        },
        area_chart: {
          short_label: "Oblast",
          long_label: "Graf oblastní",
          chart_models: {
            basic: "Základní",
            stacked: "Skládaný",
            comparison: "Srovnání",
          },
          fill_color: "Barva výplně",
        },
        donut_chart: {
          short_label: "Donut",
          long_label: "Graf donut",
          chart_models: {
            basic: "Základní",
            progress: "Pokrok",
          },
          center_value: "Hodnota uprostřed",
          completed_color: "Barva dokončeno",
        },
        pie_chart: {
          short_label: "Koláč",
          long_label: "Graf koláčový",
          chart_models: {
            basic: "Základní",
          },
          group: {
            label: "Skupinové kusy",
            group_thin_pieces: "Skupina tenkých kusů",
            minimum_threshold: {
              label: "Minimální práh",
              placeholder: "Přidat práh",
            },
            name_group: {
              label: "Název skupiny",
              placeholder: '"Méně než 5%"',
            },
          },
          show_values: "Zobrazit hodnoty",
          value_type: {
            percentage: "Procento",
            count: "Počet",
          },
        },
        text: {
          short_label: "Text",
          long_label: "Text",
          alignment: {
            label: "Zarovnání textu",
            left: "Vlevo",
            center: "Na střed",
            right: "Vpravo",
            placeholder: "Přidat zarovnání textu",
          },
          text_color: "Barva textu",
        },
      },
      color_palettes: {
        modern_tech: "Moderní technologie",
        ocean_deep: "Hluboký oceán",
        sunset_vibes: "Vibes západu slunce",
      },
      common: {
        add_widget: "Přidat widget",
        widget_title: {
          label: "Pojmenujte tento widget",
          placeholder: 'např. "Úkoly včera", "Vše dokončeno"',
        },
        chart_type: "Typ grafu",
        visualization_type: {
          label: "Typ vizualizace",
          placeholder: "Přidat typ vizualizace",
        },
        date_group: {
          label: "Skupina dat",
          placeholder: "Přidat skupinu dat",
        },
        group_by: "Skupina podle",
        stack_by: "Skládat podle",
        daily: "Denně",
        weekly: "Týdně",
        monthly: "Měsíčně",
        yearly: "Ročně",
        work_item_count: "Počet pracovních položek",
        estimate_point: "Odhadovaný bod",
        pending_work_item: "Čekající pracovní položky",
        completed_work_item: "Dokončené pracovní položky",
        in_progress_work_item: "Pracovní položky v procesu",
        blocked_work_item: "Blokované pracovní položky",
        work_item_due_this_week: "Pracovní položky splatné tento týden",
        work_item_due_today: "Pracovní položky splatné dnes",
        color_scheme: {
          label: "Barevné schéma",
          placeholder: "Přidat barevné schéma",
        },
        smoothing: "Hladkost",
        markers: "Značky",
        legends: "Legendy",
        tooltips: "Nápovědy",
        opacity: {
          label: "Průhlednost",
          placeholder: "Přidat průhlednost",
        },
        border: "Okraj",
        widget_configuration: "Konfigurace widgetu",
        configure_widget: "Konfigurovat widget",
        guides: "Pokyny",
        style: "Styl",
        area_appearance: "Vzhled oblasti",
        comparison_line_appearance: "Vzhled srovnávací čáry",
        add_property: "Přidat vlastnost",
        add_metric: "Přidat metriku",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "Hodnota na ose x chybí.",
            y_axis_metric: "Metrika chybí.",
          },
          stacked: {
            x_axis_property: "Hodnota na ose x chybí.",
            y_axis_metric: "Metrika chybí.",
            group_by: "Skládat podle chybí vlastnost.",
          },
          grouped: {
            x_axis_property: "Hodnota na ose x chybí.",
            y_axis_metric: "Metrika chybí.",
            group_by: "Skupina podle chybí vlastnost.",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "Hodnota na ose x chybí.",
            y_axis_metric: "Metrika chybí.",
          },
          multi_line: {
            x_axis_property: "Hodnota na ose x chybí.",
            y_axis_metric: "Metrika chybí.",
            group_by: "Skupina podle chybí vlastnost.",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "Hodnota na ose x chybí.",
            y_axis_metric: "Metrika chybí.",
          },
          stacked: {
            x_axis_property: "Hodnota na ose x chybí.",
            y_axis_metric: "Metrika chybí.",
            group_by: "Skládat podle chybí vlastnost.",
          },
          comparison: {
            x_axis_property: "Hodnota na ose x chybí.",
            y_axis_metric: "Metrika chybí.",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "Vlastnost chybí.",
            y_axis_metric: "Metrika chybí.",
          },
          progress: {
            y_axis_metric: "Metrika chybí.",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "Vlastnost chybí.",
            y_axis_metric: "Metrika chybí.",
          },
        },
        text: {
          basic: {
            y_axis_metric: "Metrika chybí.",
          },
        },
        ask_admin: "Požádejte svého správce, aby konfiguroval tento widget.",
      },
    },
    create_modal: {
      heading: {
        create: "Vytvořit nový dashboard",
        update: "Aktualizovat dashboard",
      },
      title: {
        label: "Pojmenujte svůj dashboard.",
        placeholder: '"Kapacita napříč projekty", "Zátěž podle týmu", "Stav napříč všemi projekty"',
        required_error: "Název je povinný",
      },
      project: {
        label: "Vyberte projekty",
        placeholder: "Data z těchto projektů budou pohánět tento dashboard.",
        required_error: "Projekty jsou povinné",
      },
      create_dashboard: "Vytvořit dashboard",
      update_dashboard: "Aktualizovat dashboard",
    },
    delete_modal: {
      heading: "Smazat dashboard",
    },
    empty_state: {
      feature_flag: {
        title: "Prezentujte svůj pokrok v on-demand, navždy dashboardech.",
        description:
          "Vytvořte jakýkoli dashboard, který potřebujete, a přizpůsobte, jak vaše data vypadají pro dokonalou prezentaci vašeho pokroku.",
        coming_soon_to_mobile: "Brzy v mobilní aplikaci",
        card_1: {
          title: "Pro všechny vaše projekty",
          description:
            "Získejte celkový přehled o svém workspace s všemi vašimi projekty nebo rozřežte svá pracovní data pro dokonalý pohled na váš pokrok.",
        },
        card_2: {
          title: "Pro jakákoli data v Plane",
          description:
            "Překročte standardní analytiku a hotové cykly a podívejte se na týmy, iniciativy nebo cokoli jiného, jako jste to ještě neudělali.",
        },
        card_3: {
          title: "Pro všechny vaše potřeby vizualizace dat",
          description:
            "Vyberte si z několika přizpůsobitelných grafů s jemně laděnými ovládacími prvky, abyste viděli a ukázali svá pracovní data přesně tak, jak chcete.",
        },
        card_4: {
          title: "Na vyžádání a trvale",
          description:
            "Vytvořte jednou, uchovejte navždy s automatickými aktualizacemi vašich dat, kontextovými vlajkami pro změny rozsahu a sdílenými permalinkami.",
        },
        card_5: {
          title: "Exporty a plánované komunikace",
          description:
            "Pro ty časy, kdy odkazy nefungují, získejte své dashboardy do jednorázových PDF nebo je naplánujte, aby byly automaticky zasílány zúčastněným stranám.",
        },
        card_6: {
          title: "Automaticky uspořádáno pro všechna zařízení",
          description:
            "Změňte velikost svých widgetů pro požadované uspořádání a uvidíte to přesně stejně na mobilu, tabletu a dalších prohlížečích.",
        },
      },
      dashboards_list: {
        title: "Vizualizujte data ve widgetech, vytvářejte své dashboardy s widgety a sledujte nejnovější na vyžádání.",
        description:
          "Vytvářejte své dashboardy s vlastním widgetem, který zobrazuje vaše data v rozsahu, který určíte. Získejte dashboardy pro všechny vaše práce napříč projekty a týmy a sdílejte permalink s zúčastněnými stranami pro sledování na vyžádání.",
      },
      dashboards_search: {
        title: "To neodpovídá názvu dashboardu.",
        description: "Ujistěte se, že váš dotaz je správný, nebo zkuste jiný dotaz.",
      },
      widgets_list: {
        title: "Vizualizujte svá data tak, jak chcete.",
        description:
          "Použijte čáry, sloupce, koláče a další formáty, abyste viděli svá data tak, jak chcete, z zdrojů, které určíte.",
      },
      widget_data: {
        title: "Zde není nic k vidění",
        description: "Obnovte nebo přidejte data, abyste je zde viděli.",
      },
    },
    common: {
      editing: "Úpravy",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "Povolit nové pracovní položky",
      work_item_creation_disable_tooltip: "Vytváření pracovních položek je pro tento stav zakázáno",
      default_state: "Výchozí stav umožňuje všem členům vytvářet nové pracovní položky. To nelze změnit",
      state_change_count: "{count, plural, one {1 povolená změna stavu} other {{count} povolené změny stavu}}",
      movers_count: "{count, plural, one {1 uvedený recenzent} other {{count} uvedení recenzenti}}",
      state_changes: {
        label: {
          default: "Přidat povolenou změnu stavu",
          loading: "Přidávání povolené změny stavu",
        },
        move_to: "Změnit stav na",
        movers: {
          label: "Když je recenzováno",
          tooltip: "Recenzenti jsou lidé, kteří mají povolení přesunout pracovní položky z jednoho stavu do druhého.",
          add: "Přidat recenzenty",
        },
      },
    },
    workflow_disabled: {
      title: "Nemůžete přesunout tuto pracovní položku sem.",
    },
    workflow_enabled: {
      label: "Změna stavu",
    },
    workflow_tree: {
      label: "Pro pracovní položky v",
      state_change_label: "může ji přesunout na",
    },
    empty_state: {
      upgrade: {
        title: "Ovládejte chaos změn a recenzí pomocí pracovních toků.",
        description: "Nastavte pravidla pro to, kam se vaše práce přesouvá, kým a kdy pomocí pracovních toků v Plane.",
      },
    },
    quick_actions: {
      view_change_history: "Zobrazit historii změn",
      reset_workflow: "Resetovat pracovní tok",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "Opravdu chcete resetovat tento pracovní tok?",
        description:
          "Pokud resetujete tento pracovní tok, všechna vaše pravidla pro změnu stavu budou smazána a budete je muset znovu vytvořit, abyste je mohli v tomto projektu používat.",
      },
      delete_state_change: {
        title: "Opravdu chcete smazat toto pravidlo změny stavu?",
        description:
          "Jakmile bude smazáno, tuto změnu nelze vrátit zpět a budete muset pravidlo znovu nastavit, pokud ho chcete mít v tomto projektu.",
      },
    },
    toasts: {
      enable_disable: {
        loading: "{action} pracovní tok",
        success: {
          title: "Úspěch",
          message: "Pracovní tok {action} úspěšně",
        },
        error: {
          title: "Chyba",
          message: "Pracovní tok nemohl být {action}. Zkuste to prosím znovu.",
        },
      },
      reset: {
        success: {
          title: "Úspěch",
          message: "Pracovní tok byl úspěšně resetován",
        },
        error: {
          title: "Chyba při resetování pracovního toku",
          message: "Pracovní tok nemohl být resetován. Zkuste to prosím znovu.",
        },
      },
      add_state_change_rule: {
        error: {
          title: "Chyba při přidávání pravidla změny stavu",
          message: "Pravidlo změny stavu nemohlo být přidáno. Zkuste to prosím znovu.",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "Chyba při úpravě pravidla změny stavu",
          message: "Pravidlo změny stavu nemohlo být upraveno. Zkuste to prosím znovu.",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "Chyba při odstraňování pravidla změny stavu",
          message: "Pravidlo změny stavu nemohlo být odstraněno. Zkuste to prosím znovu.",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "Chyba při úpravě recenzentů pravidla změny stavu",
          message: "Recenzenti pravidla změny stavu nemohli být upraveni. Zkuste to prosím znovu.",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {Zákazník} other {Zákazníci}}",
    drop_down: {
      placeholder: "Vyberte zákazníka",
      required: "Vyberte prosím zákazníka",
      no_selection: "Žádní zákazníci",
    },
    upgrade: {
      title: "Stanovte priority a spravujte práci se zákazníky.",
      description: "Propojte svou práci se zákazníky a určete priority podle jejich atributů.",
    },
    properties: {
      default: {
        title: "Výchozí vlastnosti",
        customer_name: {
          name: "Jméno zákazníka",
          placeholder: "Může to být jméno osoby nebo firmy",
          validation: {
            required: "Jméno zákazníka je povinné.",
            max_length: "Jméno zákazníka nesmí být delší než 255 znaků.",
          },
        },
        description: {
          name: "Popis",
          validation: {},
        },
        email: {
          name: "E-mail",
          placeholder: "Zadejte e-mail",
          validation: {
            required: "E-mail je povinný.",
            pattern: "Neplatná e-mailová adresa.",
          },
        },
        website_url: {
          name: "Webová stránka",
          placeholder: "Jakákoli URL s https:// bude fungovat.",
          placeholder_short: "Přidat webovou stránku",
          validation: {
            pattern: "Neplatná URL webové stránky",
          },
        },
        employees: {
          name: "Zaměstnanci",
          placeholder: "Počet zaměstnanců, pokud je váš zákazník firma.",
          validation: {
            min_length: "Počet zaměstnanců nemůže být menší než 0.",
            max_length: "Počet zaměstnanců nemůže být větší než 2147483647.",
          },
        },
        size: {
          name: "Velikost",
          placeholder: "Přidat velikost firmy",
          validation: {
            min_length: "Neplatná velikost",
          },
        },
        domain: {
          domain: "Průmysl",
          placeholder: "Maloobchod, e-Commerce, Fintech, Bankovnictví",
          placeholder_short: "Přidat odvětví",
          validation: {},
        },
        stage: {
          name: "Fáze",
          placeholder: "Vybrat fázi",
          validation: {},
        },
        contract_status: {
          name: "Stav smlouvy",
          placeholder: "Vybrat stav smlouvy",
          validation: {},
        },
        revenue: {
          name: "Příjem",
          placeholder: "Toto je roční příjem generovaný vaším zákazníkem.",
          placeholder_short: "Přidat příjem",
          validation: {
            min_length: "Příjem nemůže být menší než 0.",
          },
        },
        invalid_value: "Neplatná hodnota vlastnosti.",
      },
      custom: {
        title: "Vlastní vlastnosti",
        info: "Přidejte jedinečné atributy svých zákazníků do Plane, abyste mohli lépe spravovat pracovní položky nebo záznamy zákazníků.",
      },
      empty_state: {
        title: "Přidat vlastní vlastnosti",
        description: "Vlastní vlastnosti, které chcete ručně nebo automaticky mapovat do vašeho CRM, se zobrazí zde.",
      },
      add: {
        primary_button: "Přidat novou vlastnost",
      },
    },
    stage: {
      lead: "Lead",
      sales_qualified_lead: "Kvalifikovaný lead",
      contract_negotiation: "Jednání o smlouvě",
      closed_won: "Uzavřeno - vyhráno",
      closed_lost: "Uzavřeno - prohráno",
    },
    contract_status: {
      active: "Aktivní",
      pre_contract: "Před smlouvou",
      signed: "Podepsáno",
      inactive: "Neaktivní",
    },
    empty_state: {
      detail: {
        title: "Tento záznam zákazníka jsme nenašli.",
        description: "Odkaz na tento záznam může být nesprávný nebo tento záznam mohl být smazán.",
        primary_button: "Přejít na zákazníky",
        secondary_button: "Přidat zákazníka",
      },
      search: {
        title: "Zdá se, že nemáte žádné záznamy zákazníků odpovídající tomuto výrazu.",
        description:
          "Zkuste jiný vyhledávací výraz nebo nás kontaktujte, pokud jste si jisti, že by se měly zobrazit výsledky pro tento výraz.",
      },
      list: {
        title: "Spravujte objem, tempo a tok vaší práce podle toho, co je důležité pro vaše zákazníky.",
        description:
          "S funkcí Zákazníci, která je výhradně v Plane, můžete nyní vytvářet nové zákazníky od nuly a propojit je s vaší prací. Brzy je budete moci importovat z jiných nástrojů spolu s jejich vlastními atributy, které jsou pro vás důležité.",
        primary_button: "Přidejte svého prvního zákazníka",
      },
    },
    settings: {
      unauthorized: "Nemáte oprávnění k přístupu na tuto stránku.",
      description: "Sledujte a spravujte vztahy se zákazníky ve vašem pracovním postupu.",
      enable: "Povolit zákazníky",
      toasts: {
        enable: {
          loading: "Povolování funkce zákazníků...",
          success: {
            title: "Zapnuli jste funkci Zákazníci pro tento pracovní prostor.",
            message:
              "I membri possono ora aggiungere record clienti, collegarli agli elementi di lavoro e altro ancora.",
          },
          error: {
            title: "Tentokrát se nám nepodařilo zapnout funkci Zákazníci.",
            message: "Zkuste to znovu nebo se vraťte na tuto obrazovku později. Pokud to stále nefunguje.",
            action: "Kontaktujte podporu",
          },
        },
        disable: {
          loading: "Vypínání funkce zákazníků...",
          success: {
            title: "Zákazníci vypnuti",
            message: "Funkce Zákazníci byla úspěšně vypnuta!",
          },
          error: {
            title: "Chyba",
            message: "Nepodařilo se vypnout funkci Zákazníci!",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "Nepodařilo se nám získat váš seznam zákazníků.",
          message: "Zkuste to znovu nebo obnovte tuto stránku.",
        },
      },
      copy_link: {
        title: "Zkopírovali jste přímý odkaz na tohoto zákazníka.",
        message: "Vložte jej kamkoli a vrátí vás přímo sem.",
      },
      create: {
        success: {
          title: "{customer_name} je nyní k dispozici",
          message: "Můžete odkazovat na tohoto zákazníka v pracovních položkách a sledovat jejich požadavky.",
          actions: {
            view: "Zobrazit",
            copy_link: "Kopírovat odkaz",
            copied: "Zkopírováno!",
          },
        },
        error: {
          title: "Tentokrát se nám nepodařilo vytvořit tento záznam.",
          message: "Zkuste jej uložit znovu nebo zkopírujte neuložený text do nové položky, nejlépe v jiné záložce.",
        },
      },
      update: {
        success: {
          title: "Úspěch!",
          message: "Zákazník byl úspěšně aktualizován!",
        },
        error: {
          title: "Chyba!",
          message: "Nepodařilo se aktualizovat zákazníka. Zkuste to znovu!",
        },
      },
      logo: {
        error: {
          title: "Nepodařilo se nám nahrát logo zákazníka.",
          message: "Zkuste logo uložit znovu nebo začněte od začátku.",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "Odstranili jste pracovní položku z tohoto záznamu zákazníka.",
            message: "Tento zákazník byl také automaticky odstraněn z pracovní položky.",
          },
          error: {
            title: "Chyba!",
            message: "Tentokrát se nám nepodařilo odstranit tuto pracovní položku ze záznamu zákazníka.",
          },
        },
        add: {
          error: {
            title: "Tentokrát se nám nepodařilo přidat tuto pracovní položku do tohoto záznamu zákazníka.",
            message:
              "Zkuste přidat tuto pracovní položku znovu nebo se k ní vraťte později. Pokud to stále nefunguje, kontaktujte nás.",
          },
          success: {
            title: "Přidali jste pracovní položku do tohoto záznamu zákazníka.",
            message: "Tento zákazník byl také automaticky přidán do pracovní položky.",
          },
        },
      },
    },
    quick_actions: {
      edit: "Upravit",
      copy_link: "Kopírovat odkaz na zákazníka",
      delete: "Smazat",
    },
    create: {
      label: "Crea un record cliente",
      loading: "Vytváření",
      cancel: "Zrušit",
    },
    update: {
      label: "Aktualizovat zákazníka",
      loading: "Aktualizace...",
    },
    delete: {
      title: "Opravdu chcete smazat záznam zákazníka {customer_name}?",
      description:
        "Všechna data spojená s tímto záznamem budou trvale smazána. Tento záznam nebude možné později obnovit.",
    },
    requests: {
      empty_state: {
        list: {
          title: "Zatím nejsou k dispozici žádné požadavky.",
          description: "Vytvářejte požadavky od vašich zákazníků, abyste je mohli propojit s pracovními položkami.",
          button: "Přidat nový požadavek",
        },
        search: {
          title: "Zdá se, že nemáte žádné požadavky odpovídající tomuto výrazu.",
          description:
            "Zkuste jiný vyhledávací výraz nebo nás kontaktujte, pokud jste si jisti, že by se měly zobrazit výsledky pro tento výraz.",
        },
      },
      label: "{count, plural, one {Požadavek} other {Požadavky}}",
      add: "Přidat požadavek",
      create: "Vytvořit požadavek",
      update: "Aktualizovat požadavek",
      form: {
        name: {
          placeholder: "Pojmenujte tento požadavek",
          validation: {
            required: "Název je povinný.",
            max_length: "Název požadavku nesmí přesáhnout 255 znaků.",
          },
        },
        description: {
          placeholder: "Popište povahu požadavku nebo vložte komentář tohoto zákazníka z jiného nástroje.",
        },
        source: {
          add: "Přidat zdroj",
          update: "Aktualizovat zdroj",
          url: {
            label: "URL",
            required: "URL je povinná",
            invalid: "Neplatná URL webové stránky",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "Odkaz zkopírován",
          message: "Odkaz na požadavek zákazníka byl zkopírován do schránky.",
        },
        attachment: {
          upload: {
            loading: "Nahrávání přílohy...",
            success: {
              title: "Příloha nahrána",
              message: "Příloha byla úspěšně nahrána.",
            },
            error: {
              title: "Příloha nebyla nahrána",
              message: "Přílohu se nepodařilo nahrát.",
            },
          },
          size: {
            error: {
              title: "Chyba!",
              message: "Najednou lze nahrát pouze jeden soubor.",
            },
          },
          length: {
            message: "Soubor musí mít velikost {size} MB nebo méně",
          },
          remove: {
            success: {
              title: "Příloha odstraněna",
              message: "Příloha byla úspěšně odstraněna",
            },
            error: {
              title: "Příloha nebyla odstraněna",
              message: "Přílohu se nepodařilo odstranit",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "Úspěch!",
              message: "Zdroj byl úspěšně aktualizován!",
            },
            error: {
              title: "Chyba!",
              message: "Nepodařilo se aktualizovat zdroj.",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "Chyba!",
              message: "Nepodařilo se přidat pracovní položky k požadavku. Zkuste to znovu.",
            },
            success: {
              title: "Úspěch!",
              message: "Pracovní položky byly přidány k požadavku.",
            },
          },
        },
        update: {
          success: {
            message: "Požadavek byl úspěšně aktualizován!",
            title: "Úspěch!",
          },
          error: {
            title: "Chyba!",
            message: "Nepodařilo se aktualizovat požadavek. Zkuste to znovu!",
          },
        },
        create: {
          success: {
            message: "Požadavek byl úspěšně vytvořen!",
            title: "Úspěch!",
          },
          error: {
            title: "Chyba!",
            message: "Nepodařilo se vytvořit požadavek. Zkuste to znovu!",
          },
        },
      },
    },
    linked_work_items: {
      label: "Propojené pracovní položky",
      link: "Propojit pracovní položky",
      empty_state: {
        list: {
          title: "Zdá se, že jste zatím nepropojili žádné pracovní položky s tímto zákazníkem.",
          description:
            "Propojte existující pracovní položky z jakéhokoli projektu zde, abyste je mohli sledovat podle tohoto zákazníka.",
          button: "Propojit pracovní položku",
        },
      },
      action: {
        remove_epic: "Odstranit epiku",
        remove: "Odstranit pracovní položku",
      },
    },
    sidebar: {
      properties: "Vlastnosti",
    },
  },
  templates: {
    settings: {
      title: "Šablony",
      description:
        "Ušetřete 80 % času stráveného vytvářením projektů, pracovních položek a stránek, když používáte šablony.",
      options: {
        project: {
          label: "Šablony projektů",
        },
        work_item: {
          label: "Šablony pracovních položek",
        },
        page: {
          label: "Šablony stránek",
        },
      },
      create_template: {
        label: "Vytvořit šablonu",
        no_permission: {
          project: "Kontaktujte správce projektu, abyste vytvořili šablony",
          workspace: "Kontaktujte správce workspace, abyste vytvořili šablony",
        },
      },
      use_template: {
        button: {
          default: "Použít šablonu",
          loading: "Používání",
        },
      },
      template_source: {
        workspace: {
          info: "Odvozeno z workspace",
        },
        project: {
          info: "Odvozeno z projektu",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "Pojmenujte svou šablonu projektu.",
              validation: {
                required: "Název šablony je povinný",
                maxLength: "Název šablony by měl být kratší než 255 znaků",
              },
            },
            description: {
              placeholder: "Popište, kdy a jak tuto šablonu použít.",
            },
          },
          name: {
            placeholder: "Pojmenujte svůj projekt.",
            validation: {
              required: "Název projektu je povinný",
              maxLength: "Název projektu by měl být kratší než 255 znaků",
            },
          },
          description: {
            placeholder: "Popište účel a cíle tohoto projektu.",
          },
          button: {
            create: "Vytvořit šablonu projektu",
            update: "Aktualizovat šablonu projektu",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "Pojmenujte svou šablonu pracovních položek.",
              validation: {
                required: "Název šablony je povinný",
                maxLength: "Název šablony by měl být kratší než 255 znaků",
              },
            },
            description: {
              placeholder: "Popište, kdy a jak tuto šablonu použít.",
            },
          },
          name: {
            placeholder: "Dejte této pracovní položce název.",
            validation: {
              required: "Název pracovní položky je povinný",
              maxLength: "Název pracovní položky by měl být kratší než 255 znaků",
            },
          },
          description: {
            placeholder: "Popište tuto pracovní položku, aby bylo jasné, co dosáhnete, když ji dokončíte.",
          },
          button: {
            create: "Vytvořit šablonu pracovní položky",
            update: "Aktualizovat šablonu pracovní položky",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "Pojmenujte svou šablonu stránky.",
              validation: {
                required: "Název šablony je povinný",
                maxLength: "Název šablony by měl být kratší než 255 znaků",
              },
            },
            description: {
              placeholder: "Popište, kdy a jak tuto šablonu použít.",
            },
          },
          name: {
            placeholder: "Neznámá stránka",
            validation: {
              maxLength: "Název stránky by měl být kratší než 255 znaků",
            },
          },
          button: {
            create: "Vytvořit šablonu stránky",
            update: "Aktualizovat šablonu stránky",
          },
        },
        publish: {
          action: "{isPublished, select, true {Nastavení publikování} other {Publikovat na Marketplace}}",
          unpublish_action: "Odebrat z Marketplace",
          title: "Uložte svou šablonu, aby byla pro vaše uživatele dostupná.",
          name: {
            label: "Název šablony",
            placeholder: "Pojmenujte svou šablonu",
            validation: {
              required: "Název šablony je povinný",
              maxLength: "Název šablony by měl být kratší než 255 znaků",
            },
          },
          short_description: {
            label: "Kráký popis",
            placeholder: "Tato šablona je skvělá pro manažery projektů, kteří spravují několik projektů najednou.",
            validation: {
              required: "Kráký popis je povinný",
            },
          },
          description: {
            label: "Popis",
            placeholder: `Vylepšete produktivitu a zjednodušte komunikaci s naší integrací rozpoznávání řeči.
• Instantní přepis: Převádí hlas na přesný text okamžitě.
• Vytvoření úkolu a komentáře: Vytvořte úkoly, popisy a komentáře pomocí hlasových příkazů.`,
            validation: {
              required: "Popis je povinný",
            },
          },
          category: {
            label: "Category",
            placeholder: "Choose where you think this fits best. You can choose more than one.",
            validation: {
              required: "Musíte vybrat alespoň jednu kategorii",
            },
          },
          keywords: {
            label: "Klíčová slova",
            placeholder: "Použijte termíny, které si myslíte, že vaši uživatele při hledání této šablony použijí.",
            helperText: "Zadejte klíčová slova oddělená čárkami, která pomůžou lidem najít tuto šablonu z hledání.",
            validation: {
              required: "Alespoň jedno klíčové slovo je povinné",
            },
          },
          company_name: {
            label: "Název společnosti",
            placeholder: "Plane",
            validation: {
              required: "Název společnosti je povinný",
              maxLength: "Název společnosti by měl být kratší než 255 znaků",
            },
          },
          contact_email: {
            label: "Email podpory",
            placeholder: "help@plane.so",
            validation: {
              invalid: "Neplatná emailová adresa",
              required: "Email podpory je povinný",
              maxLength: "Email podpory by měl být kratší než 255 znaků",
            },
          },
          privacy_policy_url: {
            label: "Odkaz na vaši ochranu osobních údajů",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "Neplatná URL",
              maxLength: "URL by měla být kratší než 800 znaků",
            },
          },
          terms_of_service_url: {
            label: "Odkaz na vaše podmínky použití",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "Neplatná URL",
              maxLength: "URL by měla být kratší než 800 znaků",
            },
          },
          cover_image: {
            label: "Přidejte obrázek, který bude zobrazen na Marketplace",
            upload_title: "Nahrát obrázek",
            upload_placeholder: "Klikněte pro nahrání nebo přetáhněte a upustěte obrázek",
            drop_here: "Sem",
            click_to_upload: "Klikněte pro nahrání",
            invalid_file_or_exceeds_size_limit: "Neplatný soubor nebo překročen limit velikosti. Zkuste to znovu.",
            upload_and_save: "Nahrát a uložit",
            uploading: "Nahrávání",
            remove: "Odstranit",
            removing: "Odstraňování",
            validation: {
              required: "Obrázek je povinný",
            },
          },
          attach_screenshots: {
            label: "Připojte dokumenty a obrázky, které si myslíte, že vypadnou při zobrazení této šablony.",
            validation: {
              required: "Musíte přidat alespoň jeden screenshot",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "Šablony",
        description:
          "S šablonami projektů, pracovních položek a stránek v Plane nemusíte vytvářet projekt od nuly nebo nastavovat vlastnosti pracovních položek ručně.",
        sub_description: "Získejte 80 % svého administrativního času zpět, když používáte šablony.",
      },
      no_templates: {
        button: "Vytvořte svou první šablonu",
      },
      no_labels: {
        description:
          "Zatím žádné štítky. Vytvořte štítky, abyste pomohli organizovat a filtrovat pracovní položky v projektu.",
      },
      no_work_items: {
        description: "Zatím žádné pracovní položky. Přidejte jednu, abyste strukturovali svou práci lépe.",
      },
      no_sub_work_items: {
        description: "Zatím žádné podpracovní položky. Přidejte jednu, abyste strukturovali svou práci lépe.",
      },
      page: {
        no_templates: {
          title: "Neexistují žádné šablony, ke kterým máte přístup.",
          description: "Prosím vytvořte šablonu",
        },
        no_results: {
          title: "To neodpovídá žádné šabloně.",
          description: "Zkuste hledat s jinými termíny.",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "Šablona byla úspěšně vytvořena",
          message:
            "{templateName} byla úspěšně vytvořena a je nyní k dispozici pro váš workspace. Můžete ji nyní použít k vytvoření nových pracovních položek.",
        },
        error: {
          title: "Chyba!",
          message: "Nepodařilo se vytvořit šablonu. Zkuste to znovu!",
        },
      },
      update: {
        success: {
          title: "Šablona byla úspěšně aktualizována",
          message:
            "{templateName} byla úspěšně aktualizována. Můžete ji nyní použít k vytvoření nových pracovních položek.",
        },
        error: {
          title: "Chyba!",
          message: "Nepodařilo se aktualizovat šablonu. Zkuste to znovu!",
        },
      },
      delete: {
        success: {
          title: "Úspěch!",
          message: "Šablona byla úspěšně smazána!",
        },
        error: {
          title: "Chyba!",
          message: "Nepodařilo se smazat šablonu. Zkuste to znovu!",
        },
      },
      unpublish: {
        success: {
          title: "Šablona stažena",
          message: "{templateName}, šablona typu {templateType}, byla stažena z marketplace.",
        },
        error: {
          title: "Nepodařilo se stáhnout šablonu.",
          message:
            "Zkuste ji stáhnout znovu nebo se k ní vraťte později. Pokud ji stále nemůžete stáhnout, kontaktujte nás.",
        },
      },
    },
    delete_confirmation: {
      title: "Smazat šablonu",
      description: {
        prefix: "Opravdu chcete smazat šablonu-",
        suffix: "? Všechna data související se šablonou budou trvale odstraněna. Tuto akci nelze vrátit zpět.",
      },
    },
    unpublish_confirmation: {
      title: "Stáhnout šablonu",
      description: {
        prefix: "Opravdu chcete stáhnout šablonu-",
        suffix: "? Šablona bude stažena z marketplace a nebude více dostupná pro ostatní.",
      },
    },
    dropdown: {
      add: {
        work_item: "Přidat novou šablonu",
        project: "Přidat novou šablonu",
      },
      label: {
        project: "Vybrat šablonu projektu",
        page: "Vybrat šablonu",
      },
      tooltip: {
        work_item: "Vybrat šablonu pracovní položky",
      },
      no_results: {
        work_item: "Nebyly nalezeny žádné šablony.",
        project: "Nebyly nalezeny žádné šablony.",
      },
    },
  },
  intake_forms: {
    create: {
      title: "Vytvořit pracovní položku",
      "sub-title": "Dejte týmu vědět, na čem chcete, aby pracoval.",
      name: "Jméno",
      email: "E-mail",
      about: "O čem je tato pracovní položka?",
      description: "Popište, co by se mělo stát",
      description_placeholder: "Přidejte tolik detailů, kolik chcete, aby tým identifikoval vaši situaci a potřeby.",
      loading: "Vytváření",
      create_work_item: "Vytvořit pracovní položku",
      errors: {
        name: "Jméno je povinné",
        name_max_length: "Jméno musí mít méně než 255 znaků",
        email: "E-mail je povinný",
        email_invalid: "Neplatná e-mailová adresa",
        title: "Název je povinný",
        title_max_length: "Název musí mít méně než 255 znaků",
      },
    },
    success: {
      title: "Skvělé! Vaše pracovní položka je nyní ve frontě týmu.",
      description: "Tým nyní může tuto pracovní položku schválit nebo odmítnout z fronty příjmu.",
      primary_button: {
        text: "Přidat další pracovní položku",
      },
      secondary_button: {
        text: "Zjistit více o příjmu",
      },
    },
    how_it_works: {
      title: "Jak to funguje?",
      heading: "Toto je formulář příjmu.",
      description:
        "Příjem je funkce Plane, která umožňuje správcům a manažerům projektu získávat pracovní položky zvenčí do svých projektů.",
      steps: {
        step_1: "Tento krátký formulář umožňuje vytvořit novou pracovní položku v projektu Plane.",
        step_2: "Po odeslání formuláře se v příjmu tohoto projektu vytvoří nová pracovní položka.",
        step_3: "Někdo z projektu nebo týmu to zkontroluje.",
        step_4: "Pokud to schválí, pracovní položka přejde do fronty práce projektu. Jinak bude odmítnuta.",
        step_5:
          "Pro zjištění stavu pracovní položky kontaktujte manažera projektu, správce nebo toho, kdo vám poslal odkaz na tuto stránku.",
      },
    },
    type_forms: {
      select_types: {
        title: "Vybrat typ pracovní položky",
        search_placeholder: "Hledat typ pracovní položky",
      },
      actions: {
        select_properties: "Vybrat vlastnosti",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "Opakující se pracovní položky",
      description:
        "Nastavte to jednou. Připomeneme vám to, až bude čas. Upgradujte na Business a opakující se práce bude bez námahy.",
      new_recurring_work_item: "Nová opakující se pracovní položka",
      update_recurring_work_item: "Upravit opakující se pracovní položku",
      form: {
        interval: {
          title: "Plán",
          start_date: {
            validation: {
              required: "Počáteční datum je povinné",
            },
          },
          interval_type: {
            validation: {
              required: "Typ intervalu je povinný",
            },
          },
        },
        button: {
          create: "Vytvořit opakující se pracovní položku",
          update: "Upravit opakující se pracovní položku",
        },
      },
      create_button: {
        label: "Vytvořit opakující se pracovní položku",
        no_permission: "Kontaktujte správce projektu pro vytvoření opakujících se pracovních položek",
      },
    },
    empty_state: {
      upgrade: {
        title: "Vaše práce na autopilotu",
        description:
          "Nastavte to jednou. Připomeneme vám to, až bude čas. Upgradujte na Business a opakující se práce bude bez námahy.",
      },
      no_templates: {
        button: "Vytvořte svou první opakující se pracovní položku",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Opakující se pracovní položka vytvořena",
          message: "{name}, opakující se pracovní položka, je nyní dostupná pro váš pracovní prostor.",
        },
        error: {
          title: "Tuto opakující se pracovní položku se tentokrát nepodařilo vytvořit.",
          message:
            "Zkuste znovu uložit své údaje nebo je zkopírujte do nové opakující se pracovní položky, ideálně v jiném panelu.",
        },
      },
      update: {
        success: {
          title: "Opakující se pracovní položka změněna",
          message: "{name}, opakující se pracovní položka, byla změněna.",
        },
        error: {
          title: "Změny této opakující se pracovní položky se nepodařilo uložit.",
          message:
            "Zkuste znovu uložit své údaje nebo se k této opakující se pracovní položce vraťte později. Pokud potíže přetrvávají, kontaktujte nás.",
        },
      },
      delete: {
        success: {
          title: "Opakující se pracovní položka smazána",
          message: "{name}, opakující se pracovní položka, byla nyní odstraněna z vašeho pracovního prostoru.",
        },
        error: {
          title: "Tuto opakující se pracovní položku se nepodařilo smazat.",
          message:
            "Zkuste ji smazat znovu nebo se k ní vraťte později. Pokud ji stále nemůžete smazat, kontaktujte nás.",
        },
      },
    },
    delete_confirmation: {
      title: "Smazat opakující se pracovní položku",
      description: {
        prefix: "Opravdu chcete smazat opakující se pracovní položku-",
        suffix:
          "? Všechna data související s touto opakující se pracovní položkou budou trvale odstraněna. Tuto akci nelze vrátit zpět.",
      },
    },
  },
  automations: {
    settings: {
      title: "Vlastní automatizace",
      create_automation: "Vytvořit automatizaci",
    },
    scope: {
      label: "Rozsah",
      run_on: "Spustit na",
    },
    trigger: {
      label: "Spouštěč",
      add_trigger: "Přidat spouštěč",
      sidebar_header: "Konfigurace spouštěče",
      input_label: "Co je spouštěčem této automatizace?",
      input_placeholder: "Vyberte možnost",
      button: {
        previous: "Zpět",
        next: "Přidat akci",
      },
    },
    condition: {
      label: "Za předpokladu",
      add_condition: "Přidat podmínku",
      adding_condition: "Přidávání podmínky",
    },
    action: {
      label: "Akce",
      add_action: "Přidat akci",
      sidebar_header: "Akce",
      input_label: "Co automatizace dělá?",
      input_placeholder: "Vyberte možnost",
      handler_name: {
        add_comment: "Přidat komentář",
        change_property: "Změnit vlastnost",
      },
      configuration: {
        label: "Konfigurace",
        change_property: {
          placeholders: {
            property_name: "Vyberte vlastnost",
            change_type: "Vybrat",
            property_value_select: "{count, plural, one{Vybrat hodnotu} other{Vybrat hodnoty}}",
            property_value_select_date: "Vybrat datum",
          },
          validation: {
            property_name_required: "Název vlastnosti je povinný",
            change_type_required: "Typ změny je povinný",
            property_value_required: "Hodnota vlastnosti je povinná",
          },
        },
      },
      comment_block: {
        title: "Přidat komentář",
      },
      change_property_block: {
        title: "Změnit vlastnost",
      },
      validation: {
        delete_only_action: "Před smazáním jediné akce automatizaci zakažte.",
      },
    },
    conjunctions: {
      and: "A",
      or: "Nebo",
      if: "Pokud",
      then: "Pak",
    },
    enable: {
      alert:
        "Stiskněte 'Povolit', když je vaše automatizace dokončena. Po povolení bude automatizace připravena ke spuštění.",
      validation: {
        required: "Automatizace musí mít spouštěč a alespoň jednu akci, aby mohla být povolena.",
      },
    },
    delete: {
      validation: {
        enabled: "Automatizace musí být před smazáním zakázána.",
      },
    },
    table: {
      title: "Název automatizace",
      last_run_on: "Naposledy spuštěno",
      created_on: "Vytvořeno",
      last_updated_on: "Naposledy aktualizováno",
      last_run_status: "Stav posledního spuštění",
      average_duration: "Průměrná doba trvání",
      owner: "Vlastník",
      executions: "Spuštění",
    },
    create_modal: {
      heading: {
        create: "Vytvořit automatizaci",
        update: "Aktualizovat automatizaci",
      },
      title: {
        placeholder: "Pojmenujte svou automatizaci.",
        required_error: "Název je povinný",
      },
      description: {
        placeholder: "Popište svou automatizaci.",
      },
      submit_button: {
        create: "Vytvořit automatizaci",
        update: "Aktualizovat automatizaci",
      },
    },
    delete_modal: {
      heading: "Smazat automatizaci",
    },
    activity: {
      filters: {
        show_fails: "Zobrazit chyby",
        all: "Vše",
        only_activity: "Pouze aktivita",
        only_run_history: "Pouze historie spuštění",
      },
      run_history: {
        initiator: "Iniciátor",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Úspěch!",
          message: "Automatizace byla úspěšně vytvořena.",
        },
        error: {
          title: "Chyba!",
          message: "Vytvoření automatizace se nezdařilo.",
        },
      },
      update: {
        success: {
          title: "Úspěch!",
          message: "Automatizace byla úspěšně aktualizována.",
        },
        error: {
          title: "Chyba!",
          message: "Aktualizace automatizace se nezdařila.",
        },
      },
      enable: {
        success: {
          title: "Úspěch!",
          message: "Automatizace byla úspěšně povolena.",
        },
        error: {
          title: "Chyba!",
          message: "Povolení automatizace se nezdařilo.",
        },
      },
      disable: {
        success: {
          title: "Úspěch!",
          message: "Automatizace byla úspěšně zakázána.",
        },
        error: {
          title: "Chyba!",
          message: "Zakázání automatizace se nezdařilo.",
        },
      },
      delete: {
        success: {
          title: "Automatizace smazána",
          message: "{name}, automatizace, byla nyní odstraněna z vašeho projektu.",
        },
        error: {
          title: "Tuto automatizaci se tentokrát nepodařilo smazat.",
          message:
            "Zkuste ji smazat znovu nebo se k ní vraťte později. Pokud ji stále nemůžete smazat, kontaktujte nás.",
        },
      },
      action: {
        create: {
          error: {
            title: "Chyba!",
            message: "Vytvoření akce se nezdařilo. Zkuste to znovu!",
          },
        },
        update: {
          error: {
            title: "Chyba!",
            message: "Aktualizace akce se nezdařila. Zkuste to znovu!",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "Zatím nejsou k zobrazení žádné automatizace.",
        description:
          "Automatizace vám pomáhají eliminovat opakující se úkoly nastavením spouštěčů, podmínek a akcí. Vytvořte jednu, abyste ušetřili čas a udrželi práci v plynulém chodu.",
      },
      upgrade: {
        title: "Automatizace",
        description: "Automatizace jsou způsob, jak automatizovat úkoly ve vašem projektu.",
        sub_description: "Získejte zpět 80% svého administrativního času, když používáte automatizace.",
      },
    },
  },
  sso: {
    header: "Identita",
    description: "Nakonfigurujte svou doménu pro přístup k bezpečnostním funkcím včetně jednotného přihlašování.",
    domain_management: {
      header: "Správa domén",
      verified_domains: {
        header: "Ověřené domény",
        description: "Ověřte vlastnictví e-mailové domény pro povolení jednotného přihlašování.",
        button_text: "Přidat doménu",
        list: {
          domain_name: "Název domény",
          status: "Stav",
          status_verified: "Ověřeno",
          status_failed: "Selhalo",
          status_pending: "Čeká na vyřízení",
        },
        add_domain: {
          title: "Přidat doménu",
          description: "Přidejte svou doménu pro konfiguraci SSO a její ověření.",
          form: {
            domain_label: "Doména",
            domain_placeholder: "plane.so",
            domain_required: "Doména je povinná",
            domain_invalid: "Zadejte platný název domény (např. plane.so)",
          },
          primary_button_text: "Přidat doménu",
          primary_button_loading_text: "Přidávání",
          toast: {
            success_title: "Úspěch!",
            success_message: "Doména byla úspěšně přidána. Ověřte ji přidáním DNS TXT záznamu.",
            error_message: "Nepodařilo se přidat doménu. Zkuste to prosím znovu.",
          },
        },
        verify_domain: {
          title: "Ověřte svou doménu",
          description: "Postupujte podle těchto kroků pro ověření vaší domény.",
          instructions: {
            label: "Pokyny",
            step_1: "Přejděte do nastavení DNS pro váš doménový hostitel.",
            step_2: {
              part_1: "Vytvořte",
              part_2: "TXT záznam",
              part_3: "a vložte úplnou hodnotu záznamu uvedenou níže.",
            },
            step_3: "Tato aktualizace obvykle trvá několik minut, ale může trvat až 72 hodin.",
            step_4: 'Klikněte na "Ověřit doménu" pro potvrzení po aktualizaci DNS záznamu.',
          },
          verification_code_label: "Hodnota TXT záznamu",
          verification_code_description: "Přidejte tento záznam do nastavení DNS",
          domain_label: "Doména",
          primary_button_text: "Ověřit doménu",
          primary_button_loading_text: "Ověřování",
          secondary_button_text: "Udělám to později",
          toast: {
            success_title: "Úspěch!",
            success_message: "Doména byla úspěšně ověřena.",
            error_message: "Nepodařilo se ověřit doménu. Zkuste to prosím znovu.",
          },
        },
        delete_domain: {
          title: "Smazat doménu",
          description: {
            prefix: "Opravdu chcete smazat",
            suffix: "? Tuto akci nelze vrátit zpět.",
          },
          primary_button_text: "Smazat",
          primary_button_loading_text: "Mazání",
          secondary_button_text: "Zrušit",
          toast: {
            success_title: "Úspěch!",
            success_message: "Doména byla úspěšně smazána.",
            error_message: "Nepodařilo se smazat doménu. Zkuste to prosím znovu.",
          },
        },
      },
    },
    providers: {
      header: "Jednotné přihlašování",
      disabled_message: "Přidejte ověřenou doménu pro konfiguraci SSO",
      configure: {
        create: "Nakonfigurovat",
        update: "Upravit",
      },
      switch_alert_modal: {
        title: "Přepnout metodu SSO na {newProviderShortName}?",
        content:
          "Chystáte se povolit {newProviderLongName} ({newProviderShortName}). Tato akce automaticky zakáže {activeProviderLongName} ({activeProviderShortName}). Uživatelé, kteří se pokusí přihlásit přes {activeProviderShortName}, již nebudou moci přistupovat k platformě, dokud nepřepnou na novou metodu. Opravdu chcete pokračovat?",
        primary_button_text: "Přepnout",
        primary_button_text_loading: "Přepínání",
        secondary_button_text: "Zrušit",
      },
      form_section: {
        title: "Detaily poskytnuté IdP pro {workspaceName}",
      },
      form_action_buttons: {
        saving: "Ukládání",
        save_changes: "Uložit změny",
        configure_only: "Pouze nakonfigurovat",
        configure_and_enable: "Nakonfigurovat a povolit",
        default: "Uložit",
      },
      setup_details_section: {
        title: "{workspaceName} poskytnuté detaily pro váš IdP",
        button_text: "Získat detaily nastavení",
      },
      saml: {
        header: "Povolit SAML",
        description: "Nakonfigurujte svého poskytovatele identity SAML pro povolení jednotného přihlašování.",
        configure: {
          title: "Povolit SAML",
          description:
            "Ověřte vlastnictví e-mailové domény pro přístup k bezpečnostním funkcím včetně jednotného přihlašování.",
          toast: {
            success_title: "Úspěch!",
            create_success_message: "Poskytovatel SAML byl úspěšně vytvořen.",
            update_success_message: "Poskytovatel SAML byl úspěšně aktualizován.",
            error_title: "Chyba!",
            error_message: "Nepodařilo se uložit poskytovatele SAML. Zkuste to prosím znovu.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Webové detaily",
            entity_id: {
              label: "Entity ID | Audience | Metadata informace",
              description:
                "Vygenerujeme tuto část metadat, která identifikuje tuto aplikaci Plane jako autorizovanou službu na vašem IdP.",
            },
            callback_url: {
              label: "URL jednotného přihlášení",
              description:
                "Vygenerujeme toto za vás. Přidejte toto do pole URL pro přesměrování při přihlášení vašeho IdP.",
            },
            logout_url: {
              label: "URL jednotného odhlášení",
              description:
                "Vygenerujeme toto za vás. Přidejte toto do pole URL pro přesměrování při jednotném odhlášení vašeho IdP.",
            },
          },
          mobile_details: {
            header: "Mobilní detaily",
            entity_id: {
              label: "Entity ID | Audience | Metadata informace",
              description:
                "Vygenerujeme tuto část metadat, která identifikuje tuto aplikaci Plane jako autorizovanou službu na vašem IdP.",
            },
            callback_url: {
              label: "URL jednotného přihlášení",
              description:
                "Vygenerujeme toto za vás. Přidejte toto do pole URL pro přesměrování při přihlášení vašeho IdP.",
            },
            logout_url: {
              label: "URL jednotného odhlášení",
              description:
                "Vygenerujeme toto za vás. Přidejte toto do pole URL pro přesměrování při odhlášení vašeho IdP.",
            },
          },
          mapping_table: {
            header: "Detaily mapování",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "Povolit OIDC",
        description: "Nakonfigurujte svého poskytovatele identity OIDC pro povolení jednotného přihlašování.",
        configure: {
          title: "Povolit OIDC",
          description:
            "Ověřte vlastnictví e-mailové domény pro přístup k bezpečnostním funkcím včetně jednotného přihlašování.",
          toast: {
            success_title: "Úspěch!",
            create_success_message: "Poskytovatel OIDC byl úspěšně vytvořen.",
            update_success_message: "Poskytovatel OIDC byl úspěšně aktualizován.",
            error_title: "Chyba!",
            error_message: "Nepodařilo se uložit poskytovatele OIDC. Zkuste to prosím znovu.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Webové detaily",
            origin_url: {
              label: "Origin URL",
              description:
                "Vygenerujeme toto pro tuto aplikaci Plane. Přidejte toto jako důvěryhodný zdroj do odpovídajícího pole vašeho IdP.",
            },
            callback_url: {
              label: "URL pro přesměrování",
              description:
                "Vygenerujeme toto za vás. Přidejte toto do pole URL pro přesměrování při přihlášení vašeho IdP.",
            },
            logout_url: {
              label: "URL pro odhlášení",
              description:
                "Vygenerujeme toto za vás. Přidejte toto do pole URL pro přesměrování při odhlášení vašeho IdP.",
            },
          },
          mobile_details: {
            header: "Mobilní detaily",
            origin_url: {
              label: "Origin URL",
              description:
                "Vygenerujeme toto pro tuto aplikaci Plane. Přidejte toto jako důvěryhodný zdroj do odpovídajícího pole vašeho IdP.",
            },
            callback_url: {
              label: "URL pro přesměrování",
              description:
                "Vygenerujeme toto za vás. Přidejte toto do pole URL pro přesměrování při přihlášení vašeho IdP.",
            },
            logout_url: {
              label: "URL pro odhlášení",
              description:
                "Vygenerujeme toto za vás. Přidejte toto do pole URL pro přesměrování při odhlášení vašeho IdP.",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "Název projektu nesmí obsahovat speciální znaky.",
  pql: {
    functions: {
      date: {
        now: {
          description: "Aktuální datum a čas",
        },
        today: {
          description: "Dnešní datum",
        },
        start_of_day: {
          description: "Začátek dnes",
        },
        end_of_day: {
          description: "Konec dnes",
        },
        start_of_week: {
          description: "Začátek aktuálního týdne",
        },
        end_of_week: {
          description: "Konec aktuálního týdne",
        },
        start_of_month: {
          description: "Začátek aktuálního měsíce",
        },
        end_of_month: {
          description: "Konec aktuálního měsíce",
        },
        start_of_year: {
          description: "Začátek aktuálního roku",
        },
        end_of_year: {
          description: "Konec aktuálního roku",
        },
        days_ago: {
          description: "Datum před n dny",
        },
        days_from_now: {
          description: "Datum za n dní",
        },
        weeks_ago: {
          description: "Datum před n týdny",
        },
        weeks_from_now: {
          description: "Datum za n týdnů",
        },
        months_ago: {
          description: "Datum před n měsíci",
        },
        months_from_now: {
          description: "Datum za n měsíců",
        },
      },
      user: {
        current_user: {
          description: "Aktuálně přihlášený uživatel",
        },
        members_of: {
          description: 'Členové "project:<id>" nebo "teamspace:<id>"',
        },
        workspace_members: {
          description: "Všichni členové pracovního prostoru",
        },
      },
      cycle: {
        active_cycle: {
          description: "Dnes aktivní cyklus",
        },
        completed_cycles: {
          description: "Cykly, jejichž datum ukončení uplynulo",
        },
        upcoming_cycles: {
          description: "Cykly, jejichž datum zahájení je v budoucnosti",
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
          description: "Datum splatnosti uplynulo A stav je otevřený",
        },
        has_no_assignee: {
          description: "Pracovní položka nemá přiřazeného řešitele",
        },
        has_no_label: {
          description: "Pracovní položka nemá štítky",
        },
        is_top_level: {
          description: "Není podpracovní položkou (nemá rodiče)",
        },
        is_sub_work_item: {
          description: "Je podpracovní položkou (má rodiče)",
        },
        is_epic: {
          description: "Epik",
        },
        is_intake: {
          description: "Je vstupní pracovní položkou",
        },
        is_draft: {
          description: "Je pracovní položkou v konceptu",
        },
        is_archived: {
          description: "Je archivována",
        },
        has_children: {
          description: "Má alespoň jednu podpracovní položku",
        },
        has_start_and_due_dates: {
          description: "Má datum zahájení i datum splatnosti",
        },
      },
      relation: {
        linked_to: {
          description: "Pracovní položky související s danou položkou",
        },
        blocked_by: {
          description: "Pracovní položky blokované danou položkou",
        },
        blocks: {
          description: "Pracovní položky, které blokují danou položku",
        },
        child_of: {
          description: "Podpracovní položky dané položky",
        },
        parent_of: {
          description: "Nadřazená pracovní položka dané položky",
        },
        duplicate_of: {
          description: "Pracovní položky označené jako duplikáty dané položky",
        },
      },
      history: {
        was_ever: {
          description: "Pole mělo někdy tuto hodnotu",
        },
        was: {
          description: "Pole mělo předtím tuto hodnotu (změněno)",
        },
        changed_from: {
          description: "Pole bylo změněno z této hodnoty",
        },
        changed_to: {
          description: "Pole bylo změněno na tuto hodnotu",
        },
        changed: {
          description: "Pole bylo změněno",
        },
        updated_by: {
          description: "Pracovní položka aktualizovaná tímto uživatelem",
        },
        commented_by: {
          description: "Pracovní položka okomentovaná tímto uživatelem",
        },
        field_changed_by: {
          description: "Pole změněné tímto uživatelem",
        },
        was_assigned_to: {
          description: "Pracovní položka byla přiřazena tomuto uživateli",
        },
        changed_after: {
          description: "Pole změněné po tomto datu",
        },
        changed_before: {
          description: "Pole změněné před tímto datem",
        },
        field_changed_after: {
          description: "Pole změněné po tomto datu",
        },
        field_changed_before: {
          description: "Pole změněné před tímto datem",
        },
        changed_to_after: {
          description: "Pole změněné na tuto hodnotu po tomto datu",
        },
        changed_to_before: {
          description: "Pole změněné na tuto hodnotu před tímto datem",
        },
        field_changed_between: {
          description: "Pole změněné mezi těmito daty",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "navigovat",
      accept: "přijmout",
      close: "zavřít",
      pick_date: "Vybrat datum",
    },
    placeholder: 'Zadejte dotaz a stiskněte "ENTER" pro filtrování...',
    error: "Chyba při odesílání dotazu. Zkontrolujte a zkuste znovu.",
  },
  releases: {
    releases: "Vydání",
    release: "Vydání",
    no_release: "Žádné vydání",
    select_releases: "Vyberte vydání",
    count_releases: "{count, plural, one {# vydání} other {# vydání}}",
    actions: {
      delete: "Smazat",
    },
    delete_modal: {
      title: "Smazat vydání",
      content: 'Opravdu chcete smazat vydání "{releaseName}"? Tuto akci nelze vrátit zpět.',
    },
    settings: {
      heading: {
        title: "Vydání",
        description: "Spravujte projektové dodávky s přesností pomocí vydání.",
      },
      toggle: {
        title: "Povolit vydání",
        description:
          "Členové pracovního prostoru budou mít ve svých příslušných projektech přístup k zobrazení rozsahu.",
      },
      toasts: {
        enable: {
          loading: "Povolují se vydání...",
          success: {
            title: "Vydání povolena",
            message: "Vydání byla pro tento pracovní prostor povolena.",
          },
          error: {
            title: "Chyba",
            message: "Nepodařilo se povolit vydání. Zkuste to prosím znovu.",
          },
        },
        disable: {
          loading: "Zakazují se vydání...",
          success: {
            title: "Vydání zakázána",
            message: "Vydání byla pro tento pracovní prostor zakázána.",
          },
          error: {
            title: "Chyba",
            message: "Nepodařilo se zakázat vydání. Zkuste to prosím znovu.",
          },
        },
      },
      tabs: {
        tags: "Tagy vydání",
        labels: "Štítky",
      },
      tags: {
        title: "Tagy vydání",
        description: "Kategorizujte a filtrujte svá vydání pomocí tagů.",
        add: "Přidat tag",
        empty_state: "Zatím žádné tagy. Vytvořte svůj první tag.",
        errors: {
          version_required: "Verze je povinná.",
          version_already_exists: "Tag s touto verzí již existuje.",
          generic: "Něco se pokazilo. Zkuste to prosím znovu.",
        },
        delete_modal: {
          title: "Smazat tag",
          content: 'Opravdu chcete smazat tag "{tagVersion}"? Tuto akci nelze vrátit zpět.',
        },
        actions: {
          edit: "Upravit tag",
          delete: "Smazat tag",
        },
        toasts: {
          delete: {
            success: "Tag byl úspěšně smazán.",
            error: "Tag se nepodařilo smazat. Zkuste to prosím znovu.",
          },
        },
      },
      labels: {
        title: "Štítky",
        description: "Strukturujte a organizujte své iniciativy pomocí štítků.",
        add: "Přidat štítek",
        empty_state: "Zatím žádné štítky. Vytvořte svůj první štítek.",
        errors: {
          name_required: "Název je povinný.",
          name_already_exists: "Štítek s tímto názvem již existuje.",
          generic: "Něco se pokazilo. Zkuste to prosím znovu.",
        },
        modal: {
          name_placeholder: "Název štítku",
          pick_color: "Vyberte barvu štítku",
        },
        actions: {
          edit: "Upravit štítek",
          delete: "Smazat štítek",
        },
        drag_to_reorder: "Přetažením změňte pořadí",
        delete_modal: {
          title: "Smazat štítek",
          content: 'Opravdu chcete smazat štítek "{labelName}"? Tuto akci nelze vrátit zpět.',
        },
        toasts: {
          delete: {
            success: "Štítek byl úspěšně smazán.",
            error: "Štítek se nepodařilo smazat. Zkuste to prosím znovu.",
          },
        },
      },
    },
  },
} as const;
