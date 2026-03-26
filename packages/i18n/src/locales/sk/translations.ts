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
    we_are_working_on_this_if_you_need_immediate_assistance: "Pracujeme na tom. Ak potrebujete okamžitú pomoc,",
    reach_out_to_us: "kontaktujte nás",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our:
      "Inak skúste občas obnoviť stránku alebo navštívte našu",
    status_page: "stránku stavu",
  },
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
    pi_chat: "AI Čet",
    initiatives: "Iniciatívy",
    teamspaces: "Tímspejsy",
    epics: "Epiky",
    upgrade_plan: "Apgrejd plán",
    plane_pro: "Plejn Pro",
    business: "Biznis",
    customers: "Kastomers",
    recurring_work_items: "Opakujúce sa pracovné položky",
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
      username: {
        label: "Používateľské meno",
        placeholder: "Zadajte svoje používateľské meno",
      },
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
    ldap: {
      header: {
        label: "Pokračovať s {ldapProviderName}",
        sub_header: "Zadajte svoje prihlasovacie údaje {ldapProviderName}",
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
  activity_empty_state: {
    no_activity: "Zatiaľ žiadna aktivita",
    no_transitions: "Zatiaľ žiadne prechody",
  },
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
  select_the_cursor_motion_style_that_feels_right_for_you: "Vyberte štýl pohybu kurzora, ktorý vám vyhovuje.",
  theme: "Téma",
  smooth_cursor: "Plynulý kurzor",
  system_preference: "Systémové preferencie",
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
  project_id_tooltip_content: "Pomáha jednoznačne identifikovať pracovné položky v projekte. Max. 50 znakov.",
  description_placeholder: "Popis",
  only_alphanumeric_non_latin_characters_allowed: "Sú povolené iba alfanumerické a nelatinské znaky.",
  project_id_is_required: "ID projektu je povinné",
  project_id_allowed_char: "Sú povolené iba alfanumerické a nelatinské znaky.",
  project_id_min_char: "ID projektu musí mať aspoň 1 znak",
  project_id_max_char: "ID projektu môže mať maximálne {max} znakov",
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
  pages: {
    link_pages: "Pripojenie stránok",
    show_wiki_pages: "Zobraziť Wiki stránky",
    link_pages_to: "Pripojenie stránok k",
    linked_pages: "Pripojené stránky",
    no_description: "Táto stránka je prázdna. Napíšte niečo sem a pozrite si, ako sa zobrazí tu ako tento placeholder",
    toasts: {
      link: {
        success: {
          title: "Stránky aktualizované",
          message: "Stránky boli úspešne aktualizované",
        },
        error: {
          title: "Stránky neaktualizované",
          message: "Stránky sa nepodarilo aktualizovať",
        },
      },
      remove: {
        success: {
          title: "Stránka odstránená",
          message: "Stránka bola úspešne odstránená",
        },
        error: {
          title: "Stránka neodstránená",
          message: "Stránku sa nepodarilo odstrániť",
        },
      },
    },
  },
  intake: "Príjem",
  renew: "Obnoviť",
  preview: "Náhľad",
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
  forum: "Forum",
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
  transition: "Prechod",
  history: "História",
  priority: "Priorita",
  none: "Žiadna",
  urgent: "Naliehavá",
  high: "Vysoká",
  medium: "Stredná",
  low: "Nízka",
  members: "Členovia",
  assignee: "Priradené",
  assignees: "Priradení",
  subscriber: "{count, plural, one{# Odberateľ} few{# Odberatelia} other{# Odberateľov}}",
  you: "Vy",
  labels: "Štítky",
  create_new_label: "Vytvoriť nový štítok",
  label_name: "Názov štítku",
  failed_to_create_label: "Vytvorenie štítku zlyhalo. Skúste to prosím znova.",
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
  upgrade_request: "Požadujte od správcu pracovného priestoru upgrade.",
  copied_to_clipboard: "Skopírované do schránky",
  copied_to_clipboard_description: "URL bola úspešne skopírovaná do schránky",
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
        description: `Vyzerá to, že všetky vaše widgety sú vypnuté. Zapnite ich
pre lepší zážitok!`,
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
    business_trial_banner: {
      title: "Vaša 14-dňová skúšobná verzia plánu Business je aktívna!",
      description:
        "Preskúmajte všetky funkcie Business. Keď budete pripravení, vyberte si predplatné. Nebudete automaticky účtovaní.",
      trial_ends_today: "Skúšobná verzia končí dnes",
      trial_ends_in_days: "Skúšobná verzia končí za {days, plural, one {# deň} few {# dni} other {# dní}}",
      start_subscription: "Začať predplatné",
      explore_business_features: "Preskúmať funkcie Business",
    },
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
    updated_at: "Aktualizované dňa",
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
    additional_updates: "Ďalšie aktualizácie",
    clear_all: "Vymazať všetko",
    copied: "Skopírované!",
    link_copied: "Odkaz skopírovaný!",
    link_copied_to_clipboard: "Odkaz skopírovaný do schránky",
    copied_to_clipboard: "Odkaz na pracovnú položku bol skopírovaný do schránky",
    branch_name_copied_to_clipboard: "Názov vetvy skopírovaný do schránky",
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
      copy_branch_name: "Kopírovať názov vetvy",
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
    live: "Naživo",
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
    worklogs: "Pracovné záznamy",
    project_updates: "Aktualizácie projektov",
    overview: "Prehľad",
    workflows: "Vorkflou",
    templates: "Šablóny",
    members_and_teamspaces: "Členovia a tímspejse",
    open_in_full_screen: "Otvoriť {page} na celú obrazovku",
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
    archive: {
      description: `Archivovať je možné iba dokončené alebo zrušené
epiky`,
      label: "Archivovať epiku",
      confirm_message: "Naozaj chcete archivovať epiku? Všetky archivované epiky môžete neskôr obnoviť.",
      success: {
        label: "Archivácia úspešná",
        message: "Vaše archívy nájdete v archívoch projektu.",
      },
      failed: {
        message: "Epiku sa nepodarilo archivovať. Skúste to znova.",
      },
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
      description: `Archivovať je možné iba dokončené alebo zrušené
pracovné položky`,
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
      start_before: "Začína pred",
      start_after: "Začína po",
      finish_before: "Končí pred",
      finish_after: "Končí po",
      implements: "Implementuje",
      implemented_by: "Implementované",
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
      body: `Ahoj správca,

Prosím, vytvor nový pracovný priestor s URL [/workspace-name] pre [účel vytvorenia].

Vďaka,
{firstName} {lastName}
{email}`,
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
      cycle_progress: {
        title: "Zatiaľ žiadne údaje",
        description:
          "Analýza postupu cyklu sa zobrazí tu. Pridajte pracovné položky do cyklov, aby ste mohli začať sledovať postup.",
      },
      module_progress: {
        title: "Zatiaľ žiadne údaje",
        description:
          "Analýza postupu modulu sa zobrazí tu. Pridajte pracovné položky do modulov, aby ste mohli začať sledovať postup.",
      },
      intake_trends: {
        title: "Zatiaľ žiadne údaje",
        description:
          "Analýza trendov príjmu sa zobrazí tu. Pridajte pracovné položky do príjmu, aby ste mohli sledovať trendy.",
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
    projects_by_status: "Projekty podľa stavu",
    active_users: "Aktívni používatelia",
    intake_trends: "Trendy prijímania",
    workitem_resolved_vs_pending: "Vyriešené vs. čakajúce pracovné položky",
    upgrade_to_plan: "Inovujte na {plan}, aby ste odomkli kartu {tab}",
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
        description: `Nenašli sa projekty zodpovedajúce kritériám.
 Vytvorte nový.`,
      },
      search: {
        description: `Nenašli sa projekty zodpovedajúce kritériám.
Vytvorte nový.`,
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
    notifications: {
      select_default_view: "Vybrať predvolené zobrazenie",
      compact: "Kompaktné",
      full: "Celá obrazovka",
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
        heading: "API Tokeny",
        description: "Generujte bezpečné API tokeny na integráciu vašich dát s externými systémami a aplikáciami.",
        title: "API Tokeny",
        add_token: "Pridať token prístupu",
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
      integrations: {
        title: "Integrácie",
        page_title: "Pracujte so svojimi údajmi Plane v dostupných aplikáciách alebo vo vlastných.",
        page_description: "Zobraziť všetky integrácie používané týmto pracovným priestorom alebo vami.",
      },
      imports: {
        title: "Importy",
      },
      worklogs: {
        title: "Pracovné záznamy",
      },
      group_syncing: {
        title: "Synchronizácia skupín",
        heading: "Synchronizácia skupín",
        description:
          "Prepojte skupiny poskytovateľa identity s projektami a rolami. Prístup používateľov sa automaticky aktualizuje pri zmene členstva v skupine vo vašom IdP, čím sa zjednodušuje onboarding a offboarding.",
        enable: {
          title: "Povoliť synchronizáciu skupín",
          description: "Automaticky pridávajte používateľov do projektov na základe skupín poskytovateľa identity.",
        },
        config: {
          title: "Konfigurovať synchronizáciu skupín",
          description: "Nastavte, ako sú skupiny poskytovateľa identity mapované na projekty a role.",
          sync_on_login: {
            title: "Synchronizácia pri prihlásení",
            description: "Aktualizujte členstvo v skupine a prístup k projektu pri prihlásení používateľa.",
          },
          sync_offline: {
            title: "Offline synchronizácia",
            description:
              "Spúšťa synchronizáciu každých šesť hodín automaticky, bez čakania na prihlásenie používateľov.",
          },
          auto_remove: {
            title: "Automatické odstránenie",
            description: "Automaticky odstráňte používateľov z projektov, keď už nezodpovedajú skupine.",
          },
          group_attribute_key: {
            title: "Kľúč atribútu skupiny",
            description:
              "Atribút poskytovateľa identity používaný na identifikáciu a synchronizáciu používateľských skupín.",
            placeholder: "Skupiny",
          },
        },
        group_mapping: {
          title: "Mapovanie skupín",
          description: "Prepojte skupiny poskytovateľa identity s projektami a rolami.",
          button_text: "Pridať novú synchronizáciu skupín",
        },
        toast: {
          updating: "Aktualizácia funkcie synchronizácie skupín",
          success: "Funkcia synchronizácie skupín bola úspešne aktualizovaná.",
          error: "Nepodarilo sa aktualizovať funkciu synchronizácie skupín!",
        },
        delete_modal: {
          title: "Zmazať synchronizáciu skupín",
          content:
            "Noví používatelia z tejto skupiny identity už nebudú pridávaní do projektu. Už pridaní používatelia si zachovajú svoju súčasnú rolu.",
        },
        modal: {
          idp_group_name: {
            text: "Používateľská skupina",
            required: "Používateľská skupina je povinná",
            placeholder: "Zadajte názvy skupín IdP",
          },
          project: {
            text: "Projekt",
            required: "Projekt je povinný",
            placeholder: "Vyberte projekt",
          },
          default_role: {
            text: "Rola projektu",
            required: "Rola projektu je povinná",
            placeholder: "Vyberte rolu projektu",
          },
        },
      },
      identity: {
        title: "Identita",
        heading: "Identita",
        description: "Nakonfigurujte svoju doménu a povolte jednotné prihlásenie",
      },
      project_states: {
        title: "Stavy projektu",
      },
      projects: {
        title: "Projekty",
        description: "Spravujte stavy projektov, povoľte štítky projektov a ďalšie konfigurácie.",
        tabs: {
          states: "Stavy projektu",
          labels: "Štítky projektu",
        },
      },
      teamspaces: {
        title: "Tímspejsy",
      },
      initiatives: {
        title: "Iniciatívy",
      },
      customers: {
        title: "Zákazníci",
      },
      releases: {
        title: "Vydania",
        update_release: "Aktualizovať vydanie",
        create_release: "Vytvoriť vydanie",
        errors: {
          release_not_found: "Hľadané vydanie neexistuje.",
          unknown: "Niečo sa pokazilo. Skúste to prosím znova.",
        },
      },

      cancel_trial: {
        title: "Najprv zrušte vašu skúšobnú verziu.",
        description:
          "Máte aktívnu skúšobnú verziu jedného z našich platených plánov. Prosím, najskôr ju zrušte, aby ste mohli pokračovať.",
        dismiss: "Zavrieť",
        cancel: "Zrušiť skúšobnú verziu",
        cancel_success_title: "Skúšobná verzia zrušená.",
        cancel_success_message: "Teraz môžete odstrániť vorkspejs.",
        cancel_error_title: "To nefungovalo.",
        cancel_error_message: "Skúste to znova, prosím.",
      },
      applications: {
        title: "Aplikácie",
        applicationId_copied: "ID aplikácie skopírované do schránky",
        clientId_copied: "ID klienta skopírované do schránky",
        clientSecret_copied: "Tajomstvo klienta skopírované do schránky",
        third_party_apps: "Aplikácie tretích strán",
        your_apps: "Vaše aplikácie",
        connect: "Pripojiť",
        connected: "Pripojené",
        install: "Nainštalovať",
        installed: "Nainštalované",
        configure: "Konfigurovať",
        app_available: "Túto aplikáciu ste sprístupnili na použitie s pracovným priestorom Plane",
        app_available_description: "Pripojte pracovný priestor Plane pre začatie používania",
        client_id_and_secret: "ID a Tajomstvo Klienta",
        client_id_and_secret_description:
          "Skopírujte a uložte tento tajný kľúč. Po kliknutí na Zavrieť tento kľúč už neuvidíte.",
        client_id_and_secret_download: "Môžete si stiahnuť CSV s kľúčom odtiaľto.",
        application_id: "ID Aplikácie",
        client_id: "ID Klienta",
        client_secret: "Tajomstvo Klienta",
        export_as_csv: "Exportovať ako CSV",
        slug_already_exists: "Slug už existuje",
        failed_to_create_application: "Nepodarilo sa vytvoriť aplikáciu",
        upload_logo: "Nahrať Logo",
        app_name_title: "Ako pomenujete túto aplikáciu",
        app_name_error: "Názov aplikácie je povinný",
        app_short_description_title: "Dajte tejto aplikácii krátky popis",
        app_short_description_error: "Krátky popis aplikácie je povinný",
        app_description_title: {
          label: "Dlhý popis",
          placeholder: "Napíšte dlhý popis pre trhovisko. Stlačte '/' pre príkazy.",
        },
        authorization_grant_type: {
          title: "Typ pripojenia",
          description:
            "Vyberte, či má byť vaša aplikácia nainštalovaná raz pre pracovný priestor alebo umožniť každému používateľovi pripojiť svoj vlastný účet",
        },
        app_description_error: "Popis aplikácie je povinný",
        app_slug_title: "Slug aplikácie",
        app_slug_error: "Slug aplikácie je povinný",
        app_maker_title: "Tvorca aplikácie",
        app_maker_error: "Tvorca aplikácie je povinný",
        webhook_url_title: "URL Webhooku",
        webhook_url_error: "URL webhooku je povinné",
        invalid_webhook_url_error: "Neplatné URL webhooku",
        redirect_uris_title: "URI presmerovania",
        redirect_uris_error: "URI presmerovania sú povinné",
        invalid_redirect_uris_error: "Neplatné URI presmerovania",
        redirect_uris_description:
          "Zadajte URI oddelené medzerami, kam aplikácia presmeruje po používateľovi, napr. https://example.com https://example.com/",
        authorized_javascript_origins_title: "Autorizované JavaScript pôvody",
        authorized_javascript_origins_error: "Autorizované JavaScript pôvody sú povinné",
        invalid_authorized_javascript_origins_error: "Neplatné autorizované JavaScript pôvody",
        authorized_javascript_origins_description:
          "Zadajte pôvody oddelené medzerami, odkiaľ bude môcť aplikácia robiť požiadavky, napr. app.com example.com",
        create_app: "Vytvoriť aplikáciu",
        update_app: "Aktualizovať aplikáciu",
        regenerate_client_secret_description:
          "Znovu vygenerovať tajomstvo klienta. Po regenerácii môžete kľúč skopírovať alebo stiahnuť do CSV súboru.",
        regenerate_client_secret: "Znovu vygenerovať tajomstvo klienta",
        regenerate_client_secret_confirm_title: "Ste si istí, že chcete znovu vygenerovať tajomstvo klienta?",
        regenerate_client_secret_confirm_description:
          "Aplikácia používajúca toto tajomstvo prestane fungovať. Budete musieť aktualizovať tajomstvo v aplikácii.",
        regenerate_client_secret_confirm_cancel: "Zrušiť",
        regenerate_client_secret_confirm_regenerate: "Znovu vygenerovať",
        read_only_access_to_workspace: "Prístup len na čítanie k vášmu pracovnému priestoru",
        write_access_to_workspace: "Prístup na zápis k vášmu pracovnému priestoru",
        read_only_access_to_user_profile: "Prístup len na čítanie k vášmu používateľskému profilu",
        write_access_to_user_profile: "Prístup na zápis k vášmu používateľskému profilu",
        connect_app_to_workspace: "Pripojiť {app} k vášmu pracovnému priestoru {workspace}",
        user_permissions: "Používateľské oprávnenia",
        user_permissions_description:
          "Používateľské oprávnenia sa používajú na udelenie prístupu k profilu používateľa.",
        workspace_permissions: "Oprávnenia pracovného priestoru",
        workspace_permissions_description:
          "Oprávnenia pracovného priestoru sa používajú na udelenie prístupu k pracovnému priestoru.",
        with_the_permissions: "s oprávneniami",
        app_consent_title: "{app} žiada o prístup k vášmu pracovnému priestoru a profilu Plane.",
        choose_workspace_to_connect_app_with: "Vyberte pracovný priestor, s ktorým chcete pripojiť aplikáciu",
        app_consent_workspace_permissions_title: "{app} by chcel",
        app_consent_user_permissions_title:
          "{app} môže tiež požiadať o povolenie používateľa pre nasledujúce zdroje. Tieto oprávnenia budú vyžiadané a autorizované iba používateľom.",
        app_consent_accept_title: "Prijatím",
        app_consent_accept_1:
          "Udeľujete aplikácii prístup k vašim údajom Plane kdekoľvek, kde môžete používať aplikáciu v rámci alebo mimo Plane",
        app_consent_accept_2: "Súhlasíte s Pravidlami ochrany súkromia a Podmienkami používania {app}",
        accepting: "Prijímanie...",
        accept: "Prijať",
        categories: "Kategórie",
        select_app_categories: "Vyberte kategórie aplikácie",
        categories_title: "Kategórie",
        categories_error: "Kategórie sú povinné",
        invalid_categories_error: "Neplatné kategórie",
        categories_description: "Vyberte kategórie, ktoré najlepšie opisujú aplikáciu",
        supported_plans: "Podporované Plány",
        supported_plans_description:
          "Vyberte plány pracovného priestoru, ktoré môžu nainštalovať túto aplikáciu. Ponechajte prázdne, ak chcete povoliť všetky plány.",
        select_plans: "Vybrať Plány",
        privacy_policy_url_title: "URL Pravidiel ochrany súkromia",
        privacy_policy_url_error: "URL Pravidiel ochrany súkromia je povinné",
        invalid_privacy_policy_url_error: "Neplatné URL Pravidiel ochrany súkromia",
        terms_of_service_url_title: "URL Podmienok služby",
        terms_of_service_url_error: "URL Podmienok služby je povinné",
        invalid_terms_of_service_url_error: "Neplatné URL Podmienok služby",
        support_url_title: "URL Podpory",
        support_url_error: "URL Podpory je povinné",
        invalid_support_url_error: "Neplatné URL Podpory",
        video_url_title: "URL Video",
        video_url_error: "URL Video je povinné",
        invalid_video_url_error: "Neplatné URL Video",
        setup_url_title: "URL Nastavenia",
        setup_url_error: "URL Nastavenia je povinné",
        invalid_setup_url_error: "Neplatné URL Nastavenia",
        configuration_url_title: "URL Konfigurácie",
        configuration_url_error: "URL Konfigurácie je povinné",
        invalid_configuration_url_error: "Neplatné URL Konfigurácie",
        contact_email_title: "Email Kontaktu",
        contact_email_error: "Email Kontaktu je povinný",
        invalid_contact_email_error: "Neplatný email kontaktu",
        upload_attachments: "Nahrať prílohy",
        uploading_images: "Nahrávanie {count} obrázku{count, plural, one {s} other {s}}",
        drop_images_here: "Presuňte obrázky sem",
        click_to_upload_images: "Kliknite, aby ste nahrávali obrázky",
        invalid_file_or_exceeds_size_limit: "Neplatný súbor alebo presahuje limit veľkosti ({size} MB)",
        uploading: "Nahrávanie...",
        upload_and_save: "Nahrať a uložiť",
        app_credentials_regenrated: {
          title: "Prihlasovacie údaje aplikácie boli úspešne znovu vygenerované",
          description: "Nahraďte klientsky kľúč všade, kde sa používa. Predchádzajúci kľúč už nie je platný.",
        },
        app_created: {
          title: "Aplikácia bola úspešne vytvorená",
          description: "Použite prihlasovacie údaje na inštaláciu aplikácie do pracovného priestoru Plane",
        },
        installed_apps: "Nainštalované aplikácie",
        all_apps: "Všetky aplikácie",
        internal_apps: "Interné aplikácie",
        website: {
          title: "Webová stránka",
          description: "Odkaz na webovú stránku vašej aplikácie.",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "Tvorca aplikácií",
          description: "Osoba alebo organizácia, ktorá vytvára aplikáciu.",
        },
        setup_url: {
          label: "URL nastavenia",
          description: "Používatelia budú po nainštalovaní aplikácie presmerovaní na túto URL.",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "Webhook URL",
          description:
            "Tu budeme posielať udalosti webhook a aktualizácie z pracovných priestorov, kde je vaša aplikácia nainštalovaná.",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "Presmerovacie URI (oddelené medzerou)",
          description: "Používatelia budú po autentifikácii pomocou Plane presmerovaní na túto cestu.",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "Táto aplikácia môže byť nainštalovaná až po jej inštalácii administrátorom pracovného priestoru. Kontaktujte svojho administrátora pracovného priestoru, aby ste mohli pokračovať.",
        enable_app_mentions: "Povoliť zmienky o aplikácii",
        enable_app_mentions_tooltip:
          "Keď je toto povolené, používatelia môžu spomenúť alebo priradiť pracovné položky tejto aplikácii.",
        scopes: "Rozsahy",
        select_scopes: "Vybrať rozsahy",
        read_access_to: "Prístup len na čítanie k",
        write_access_to: "Prístup na zápis k",
        global_permission_expiration:
          "Globálne rozsahy čoskoro vypršia. Namiesto toho použite granulované rozsahy. Napríklad použite project:read namiesto globálneho čítania.",
        selected_scopes: "{count} vybraných",
        scopes_and_permissions: "Rozsahy a oprávnenia",
        read: "Čítanie",
        write: "Zápis",
        scope_description: {
          projects: "Prístup k projektom a všetkým súvisiacim entitám",
          wiki: "Prístup k wiki a všetkým súvisiacim entitám",
          customers: "Prístup k zákazníkom a všetkým súvisiacim entitám",
          initiatives: "Prístup k iniciatívam a všetkým súvisiacim entitám",
          workspaces: "Prístup k pracovným priestorom a všetkým súvisiacim entitám",
          stickies: "Prístup k poznámkam a všetkým súvisiacim entitám",
          teamspaces: "Prístup k tímovým priestorom a všetkým súvisiacim entitám",
          profile: "Prístup k informáciám o profile používateľa",
          agents: "Prístup k agentom a všetkým súvisiacim entitám",
          assets: "Prístup k aktívam a všetkým súvisiacim entitám",
        },
        build_your_own_app: "Vytvorte si vlastnú aplikáciu",
        edit_app_details: "Upraviť detaily aplikácie",
        internal: "Interný",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description:
          "Vidíte, ako sa vaša práca stáva inteligentnejšou a rýchlejšou s pomocou AI, ktorá je natívne pripojená k vašej práci a znalostnej základni.",
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
      connections: "Pripojenia",
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
      project_lead_description: "Vyberte vedúceho projektu.",
      default_assignee_description: "Vyberte predvoleného priradeného pre projekt.",
      project_subscribers: "Odberatelia projektu",
      project_subscribers_description: "Vyberte členov, ktorí budú dostávať upozornenia pre tento projekt.",
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
        reorder: {
          success: {
            title: "Odhady boli preusporiadané",
            message: "Odhady boli preusporiadané vo vašom projekte.",
          },
          error: {
            title: "Preusporiadanie odhadov zlyhalo",
            message: "Nepodarilo sa preusporiadať odhady, skúste to prosím znova",
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
        fill: "Prosím vyplňte toto pole odhadu",
        repeat: "Hodnota odhadu sa nemôže opakovať",
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
      edit: {
        title: "Upraviť systém odhadov",
        add_or_update: {
          title: "Pridať, aktualizovať alebo odstrániť odhady",
          description: "Spravujte aktuálny systém pridávaním, aktualizáciou alebo odstraňovaním bodov alebo kategórií.",
        },
        switch: {
          title: "Zmeniť typ odhadu",
          description: "Konvertujte váš bodový systém na systém kategórií a naopak.",
        },
      },
      switch: "Prepnúť systém odhadov",
      current: "Aktuálny systém odhadov",
      select: "Vyberte systém odhadov",
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
      integrations: {
        title: "Žiadne nakonfigurované integrácie",
        description:
          "Nakonfigurujte GitHub a ďalšie integrácie na synchronizáciu vašich projektových pracovných položiek.",
      },
    },
    initiatives: {
      heading: "Iniciatívy",
      sub_heading: "Odomknite najvyššiu úroveň organizácie pre všetku vašu prácu v Plene.",
      title: "Povoliť Iniciatívy",
      description: "Nastavte väčšie ciele na monitorovanie pokroku",
      toast: {
        updating: "Aktualizácia funkcie iniciatív",
        enable_success: "Funkcia iniciatív bola úspešne povolená.",
        disable_success: "Funkcia iniciatív bola úspešne zakázaná.",
        error: "Nepodarilo sa aktualizovať funkciu iniciatív!",
      },
    },
    customers: {
      heading: "Zákazníci",
      settings_heading: "Spravujte prácu podľa toho, čo je dôležité pre vašich zákazníkov.",
      settings_sub_heading:
        "Preneste požiadavky zákazníkov do pracovných položiek, priraďte prioritu podľa požiadaviek a zlúčte stavy pracovných položiek do záznamov zákazníkov. Čoskoro sa budete môcť integrovať s vašim CRM alebo podporným nástrojom pre ešte lepšiu správu práce podľa atribútov zákazníka.",
    },
    epics: {
      properties: {
        title: "Vlastnosti",
        description: "Pridajte vlastné vlastnosti k vášmu epiku.",
      },
      disabled: "Zakázané",
    },
    cycles: {
      auto_schedule: {
        heading: "Automatické plánovanie cyklov",
        description: "Udržiavajte cykly v pohybe bez manuálneho nastavenia.",
        tooltip: "Automaticky vytvárajte nové cykly na základe zvoleného rozvrhu.",
        edit_button: "Upraviť",
        form: {
          cycle_title: {
            label: "Názov cyklu",
            placeholder: "Názov",
            tooltip: "K názvu budú pridané čísla pre následné cykly. Napríklad: Dizajn - 1/2/3",
            validation: {
              required: "Názov cyklu je povinný",
              max_length: "Názov nesmie presiahnuť 255 znakov",
            },
          },
          cycle_duration: {
            label: "Trvanie cyklu",
            unit: "Týždne",
            validation: {
              required: "Trvanie cyklu je povinné",
              min: "Trvanie cyklu musí byť aspoň 1 týždeň",
              max: "Trvanie cyklu nemôže presiahnuť 30 týždňov",
              positive: "Trvanie cyklu musí byť kladné",
            },
          },
          cooldown_period: {
            label: "Obdobie chladenia",
            unit: "dni",
            tooltip: "Prestávka medzi cyklami pred začiatkom ďalšieho.",
            validation: {
              required: "Obdobie chladenia je povinné",
              negative: "Obdobie chladenia nemôže byť záporné",
            },
          },
          start_date: {
            label: "Deň začiatku cyklu",
            validation: {
              required: "Dátum začiatku je povinný",
              past: "Dátum začiatku nemôže byť v minulosti",
            },
          },
          number_of_cycles: {
            label: "Počet budúcich cyklov",
            validation: {
              required: "Počet cyklov je povinný",
              min: "Je vyžadovaný aspoň 1 cyklus",
              max: "Nie je možné naplánovať viac ako 3 cykly",
            },
          },
          auto_rollover: {
            label: "Automatický prevod pracovných položiek",
            tooltip: "V deň dokončenia cyklu presunúť všetky nedokončené pracovné položky do ďalšieho cyklu.",
          },
        },
        toast: {
          toggle: {
            loading_enable: "Povoľovanie automatického plánovania cyklov",
            loading_disable: "Zakazovanie automatického plánovania cyklov",
            success: {
              title: "Úspech!",
              message: "Automatické plánovanie cyklov bolo úspešne prepnuté.",
            },
            error: {
              title: "Chyba!",
              message: "Nepodarilo sa prepnúť automatické plánovanie cyklov.",
            },
          },
          save: {
            loading: "Ukladanie konfigurácie automatického plánovania cyklov",
            success: {
              title: "Úspech!",
              message_create: "Konfigurácia automatického plánovania cyklov bola úspešne uložená.",
              message_update: "Konfigurácia automatického plánovania cyklov bola úspešne aktualizovaná.",
            },
            error: {
              title: "Chyba!",
              message_create: "Nepodarilo sa uložiť konfiguráciu automatického plánovania cyklov.",
              message_update: "Nepodarilo sa aktualizovať konfiguráciu automatického plánovania cyklov.",
            },
          },
        },
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
        heading: "Zodpovednosť za príjem",
        title: "Príjem",
        short_title: "Príjem",
        description: "Umožnite nečlenom zdieľať chyby, spätnú väzbu a návrhy; bez narušenia vášho pracovného postupu.",
        toggle_title: "Povoliť príjem",
        toggle_description: "Povoliť členom projektu vytvárať žiadosti o príjem v aplikácii.",
        notify_assignee: {
          title: "Upozorniť priradených",
          description: "Pre novú žiadosť o príjem budú predvolení priradení upozornení prostredníctvom oznámení",
        },
        toasts: {
          set: {
            loading: "Nastavovanie priradených...",
            success: {
              title: "Úspech!",
              message: "Priradení úspešne nastavení.",
            },
            error: {
              title: "Chyba!",
              message: "Pri nastavovaní priradených sa niečo pokazilo. Skúste to prosím znova.",
            },
          },
        },
      },
      time_tracking: {
        title: "Sledovanie času",
        short_title: "Sledovanie času",
        description: "Zaznamenávajte čas strávený na pracovných položkách a projektoch.",
        toggle_title: "Povoliť sledovanie času",
        toggle_description: "Členovia projektu budú môcť zaznamenávať odpracovaný čas.",
      },
      milestones: {
        title: "Míľniky",
        short_title: "Míľniky",
        description: "Míľniky poskytujú vrstvu na zladenie pracovných položiek smerom k spoločným termínom dokončenia.",
        toggle_title: "Povoliť míľniky",
        toggle_description: "Organizujte pracovné položky podľa termínov míľnikov.",
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
    transfer: {
      no_cycles_available: "Nie sú k dispozícii žiadne iné cykly na prenos pracovných položiek.",
    },
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
      trailing: "Oneskorenie",
      leading: "Náskok",
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
          highlight_changes: "Zvýrazniť zmeny",
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
  workspace_dashboards: "Dešbordy",
  pi_chat: "AI Čet",
  in_app: "V aplikácii",
  forms: "Formuláre",
  choose_workspace_for_integration: "Vyberte pracovný priestor pre pripojenie tejto aplikácie",
  integrations_description:
    "Aplikácie, ktoré fungujú s Plane, musia byť pripojené k pracovnom priestoru, kde ste správca.",
  create_a_new_workspace: "Vytvoriť nový pracovný priestor",
  learn_more_about_workspaces: "Zjistit více o pracovních prostorech",
  no_workspaces_to_connect: "Žádné pracovní prostory k připojení",
  no_workspaces_to_connect_description: "Musíte vytvořit pracovní prostor, abyste mohli připojit integraci a šablony",
  updates: {
    add_update: "Pridať aktualizáciu",
    add_update_placeholder: "Vložte vašu aktualizáciu tu",
    empty: {
      title: "Ešte nie sú žiadne aktualizácie",
      description: "Tu môžete zobraziť aktualizácie.",
    },
    delete: {
      title: "Odstrániť aktualizáciu",
      confirmation: "Naozaj chcete odstrániť túto aktualizáciu? Táto akcia je neobnoviteľná.",
      success: {
        title: "Aktualizácia odstránená",
        message: "Aktualizácia bola úspešne odstránená.",
      },
      error: {
        title: "Aktualizáciu sa nepodarilo odstrániť",
        message: "Aktualizáciu sa nepodarilo odstrániť.",
      },
    },
    update: {
      success: {
        title: "Aktualizácia aktualizovaná",
        message: "Aktualizácia bola úspešne aktualizovaná.",
      },
      error: {
        title: "Aktualizáciu sa nepodarilo aktualizovať",
        message: "Aktualizáciu sa nepodarilo aktualizovať.",
      },
    },
    reaction: {
      create: {
        success: {
          title: "Reakcia vytvorená",
          message: "Reakcia bola úspešne vytvorená.",
        },
        error: {
          title: "Reakcia sa nepodarila vytvoriť",
          message: "Reakcia sa nepodarila vytvoriť.",
        },
      },
      remove: {
        success: {
          title: "Reakcia odstránená",
          message: "Reakcia bola úspešne odstránená.",
        },
        error: {
          title: "Reakcia sa nepodarila odstrániť",
          message: "Reakcia sa nepodarila odstrániť.",
        },
      },
    },
    progress: {
      title: "Postup",
      since_last_update: "Od poslednej aktualizácie",
      comments: "{count, plural, one{# komentár} few{# komentáre} other{# komentárov}}",
    },
    create: {
      success: {
        title: "Aktualizácia vytvorená",
        message: "Aktualizácia bola úspešne vytvorená.",
      },
      error: {
        title: "Aktualizáciu sa nepodarilo vytvoriť",
        message: "Aktualizáciu sa nepodarilo vytvoriť.",
      },
    },
  },
  teamspaces: {
    label: "Tímspejsy",
    empty_state: {
      general: {
        title: "Tímspejsy odomykajú lepšiu organizáciu a sledovanie v Plene.",
        description:
          "Vytvorte vyhradený priestor pre každý reálny tím, oddelený od všetkých ostatných pracovných priestorov v Plene, a prispôsobte ich tak, aby vyhovovali spôsobu práce vášho tímu.",
        primary_button: {
          text: "Vytvoriť nový tímspejs",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "Zatiaľ ste neprepojili žiadne tímspejsy.",
          description: "Vlastníci tímspejsu a projektu môžu spravovať prístup k projektom.",
        },
      },
      primary_button: {
        text: "Prepojiť tímspejs",
      },
      secondary_button: {
        text: "Dozvedieť sa viac",
      },
      table: {
        columns: {
          teamspaceName: "Názov tímspejsu",
          members: "Členovia",
          accountType: "Typ účtu",
        },
        actions: {
          remove: {
            button: {
              text: "Odstrániť tímspejs",
            },
            confirm: {
              title: "Odstrániť {teamspaceName} z {projectName}",
              description:
                "Keď odstránite tento tímspejs z prepojeného projektu, členovia tu stratia prístup k prepojenému projektu.",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "Neboli nájdené žiadne zodpovedajúce tímspejsy",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {Prepojili ste tímspejs s týmto projektom.} other {Prepojili ste # tímspejsov s týmto projektom.}}",
            description:
              "{additionalCount, plural, =0 {Tímspejs {firstTeamspaceName} je teraz prepojený s týmto projektom.} other {Tímspejs {firstTeamspaceName} a {additionalCount} ďalších je teraz prepojených s týmto projektom.}}",
          },
          error: {
            title: "To sa nepodarilo.",
            description: "Skúste to znova alebo obnovte túto stránku pred opätovným pokusom.",
          },
        },
        remove_teamspace: {
          success: {
            title: "Odstránili ste tento tímspejs z tohto projektu.",
            description: "Tímspejs {teamspaceName} bol odstránený z {projectName}.",
          },
          error: {
            title: "To sa nepodarilo.",
            description: "Skúste to znova alebo obnovte túto stránku pred opätovným pokusom.",
          },
        },
      },
      link_teamspace: {
        placeholder: "Hľadať tímspejsy",
        info: {
          title: "Pridanie tímspejsu poskytuje všetkým členom tímspejsu prístup k tomuto projektu.",
          link: "Dozvedieť sa viac",
        },
        empty_state: {
          no_teamspaces: {
            title: "Nemáte žiadne tímspejsy na prepojenie.",
            description:
              "Buď nie ste v tímspejse, ktorý môžete prepojiť, alebo ste už prepojili všetky dostupné tímspejsy.",
          },
          no_results: {
            title: "To nezodpovedá žiadnemu z vašich tímspejsov.",
            description: "Skúste iný výraz alebo sa uistite, že máte tímspejsy na prepojenie.",
          },
        },
        primary_button: {
          text: "Prepojiť vybrané tímspejsy",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "Vytvorte pracovné položky špecifické pre tím.",
        description:
          "Pracovné položky, ktoré sú priradené členom tohto tímu v akomkoľvek prepojenom projekte, sa tu automaticky zobrazia. Ak očakávate, že tu uvidíte nejaké pracovné položky, uistite sa, že vaše prepojené projekty majú pracovné položky priradené členom tohto tímu alebo vytvorte pracovné položky.",
        primary_button: {
          text: "Pridať pracovné položky do prepojeného projektu",
        },
      },
      work_items_empty_filter: {
        title: "Pre použité filtre neexistujú žiadne pracovné položky špecifické pre tím",
        description:
          "Zmeňte niektoré z týchto filtrov alebo ich všetky vymažte, aby ste videli pracovné položky relevantné pre tento priestor.",
        secondary_button: {
          text: "Vymazať všetky filtre",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "Žiadny z vašich prepojených projektov nemá aktívny cyklus.",
        description:
          "Aktívne cykly v prepojených projektoch sa tu automaticky zobrazia. Ak očakávate, že uvidíte aktívny cyklus, uistite sa, že práve teraz beží v prepojenom projekte.",
      },
      completed: {
        title: "Žiadny z vašich prepojených projektov nemá dokončený cyklus.",
        description:
          "Dokončené cykly v prepojených projektoch sa tu automaticky zobrazia. Ak očakávate, že uvidíte dokončený cyklus, uistite sa, že je taktiež dokončený v prepojenom projekte.",
      },
      upcoming: {
        title: "Žiadny z vašich prepojených projektov nemá nadchádzajúci cyklus.",
        description:
          "Nadchádzajúce cykly v prepojených projektoch sa tu automaticky zobrazia. Ak očakávate, že uvidíte nadchádzajúci cyklus, uistite sa, že je aj v prepojenom projekte.",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title: "Pohľady vášho tímu na vašu prácu bez narušenia akýchkoľvek iných pohľadov vo vašom vorkspejse",
        description:
          "Pozrite si prácu svojho tímu v pohľadoch, ktoré sú uložené len pre váš tím a oddelene od pohľadov projektu.",
        primary_button: {
          text: "Vytvoriť pohľad",
        },
      },
      project_view: {
        title: "Žiadny z vašich prepojených projektov nemá verejné pohľady.",
        description:
          "Verejné pohľady v prepojených projektoch sa tu automaticky zobrazia. Aby ste tu videli verejné pohľady z prepojených projektov, uistite sa, že tieto projekty majú verejné pohľady prístupné všetkým členom projektu.",
      },
      filter: {
        title: "Žiadne zodpovedajúce pohľady",
        description: `Žiadne pohľady nezodpovedajú kritériám vyhľadávania.
 Namiesto toho vytvorte nový pohľad.`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "Umiestnite znalosti svojho tímu na Stránky tímu.",
        description:
          "Na rozdiel od stránok v projekte môžete tu uložiť znalosti špecifické pre tím v samostatnej sade stránok. Získajte všetky funkcie Stránok, vytvárajte dokumenty s osvedčenými postupmi a tímové wiki jednoducho.",
        primary_button: {
          text: "Vytvorte svoju prvú tímovú stránku",
        },
      },
      project_page: {
        title: "Žiadny z vašich prepojených projektov nemá verejné stránky.",
        description:
          "Verejné stránky v prepojených projektoch sa tu automaticky zobrazia. Ak očakávate, že tu uvidíte verejné stránky, uistite sa, že vaše prepojené projekty majú verejné stránky dostupné všetkým členom projektu.",
      },
      filter: {
        title: "Žiadne zodpovedajúce stránky",
        description: "Odstráňte filtre, aby ste videli všetky stránky",
      },
      search: {
        title: "Žiadne zodpovedajúce stránky",
        description: "Odstráňte kritériá vyhľadávania, aby ste videli všetky stránky",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "Žiadny z vašich prepojených projektov nemá zverejnené pracovné položky.",
        description:
          "Vytvorte niekoľko pracovných položiek v jednom alebo viacerých z týchto projektov, aby ste videli pokrok podľa dátumov, stavov a priorít.",
      },
      relation: {
        blocking: {
          title: "Nemáte žiadne pracovné položky, ktoré by blokovali tímového kolegu.",
          description: "Dobrá práca! Vyčistili ste cestu pre svoj tím. Ste dobrý tímový hráč.",
        },
        blocked: {
          title: "Nemáte žiadne pracovné položky tímového kolegu, ktoré by vás blokovali.",
          description: "Dobré správy! Môžete pokročiť vo všetkých vašich priradených pracovných položkách.",
        },
      },
      stats: {
        general: {
          title: "Žiadny z vašich prepojených projektov nemá zverejnené pracovné položky.",
          description:
            "Vytvorte niekoľko pracovných položiek v jednom alebo viacerých z týchto projektov, aby ste videli rozdelenie práce podľa projektu a členov tímu.",
        },
        filter: {
          title: "Pre použité filtre neexistujú žiadne tímové štatistiky.",
          description:
            "Vytvorte niekoľko pracovných položiek v jednom alebo viacerých z týchto projektov, aby ste videli rozdelenie práce podľa projektu a členov tímu.",
        },
      },
    },
  },
  initiatives: {
    overview: "Prehľad",
    label: "Iniciatívy",
    placeholder: "{count, plural, one{# iniciativa} other{# iniciatívy}}",
    add_initiative: "Pridať Iniciatívu",
    create_initiative: "Vytvoriť Iniciatívu",
    update_initiative: "Aktualizovať Iniciatívu",
    initiative_name: "Názov iniciatívy",
    all_initiatives: "Všetky Iniciatívy",
    delete_initiative: "Odstrániť Iniciatívu",
    fill_all_required_fields: "Prosím, vyplňte všetky povinné polia.",
    toast: {
      create_success: "Iniciatíva {name} bola úspešne vytvorená.",
      create_error: "Nepodarilo sa vytvoriť iniciatívu. Skúste to znova!",
      update_success: "Iniciatíva {name} bola úspešne aktualizovaná.",
      update_error: "Nepodarilo sa aktualizovať iniciatívu. Skúste to znova!",
      delete: {
        success: "Iniciatíva bola úspešne odstránená.",
        error: "Nepodarilo sa odstrániť Iniciatívu",
      },
      link_copied: "Odkaz na iniciatívu bol skopírovaný do schránky.",
      project_update_success: "Projekty iniciatívy boli úspešne aktualizované.",
      project_update_error: "Nepodarilo sa aktualizovať projekty iniciatívy. Skúste to znova!",
      epic_update_success:
        "Epik{count, plural, one { bol úspešne pridaný do Iniciatívy.} other {y boli úspešne pridané do Iniciatívy.}}",
      epic_update_error: "Pridanie Epiku do Iniciatívy zlyhalo. Skúste to neskôr znova.",
      state_update_success: "Stav iniciatívy bol úspešne aktualizovaný.",
      state_update_error: "Nepodarilo sa aktualizovať stav iniciatívy. Skúste to prosím znova!",
      label_update_error: "Nepodarilo sa aktualizovať štítky iniciatívy. Skúste to prosím znova!",
    },
    empty_state: {
      general: {
        title: "Organizujte prácu na najvyššej úrovni s Iniciatívami",
        description:
          "Keď potrebujete organizovať prácu zahŕňajúcu niekoľko projektov a tímov, Iniciatívy sú užitočné. Prepojte projekty a epiky s iniciatívami, pozrite si automaticky zosumarizované aktualizácie a uvidíte lesy skôr, než sa dostanete k stromom.",
        primary_button: {
          text: "Vytvoriť iniciatívu",
        },
      },
      search: {
        title: "Žiadne zodpovedajúce iniciatívy",
        description: `Neboli zistené žiadne iniciatívy so zodpovedajúcimi kritériami.
 Namiesto toho vytvorte novú iniciatívu.`,
      },
      not_found: {
        title: "Iniciatíva neexistuje",
        description: "Iniciatíva, ktorú hľadáte, neexistuje, bola archivovaná alebo bola odstránená.",
        primary_button: {
          text: "Zobraziť iné Iniciatívy",
        },
      },
      epics: {
        title: "Nemáte žiadne epiky, ktoré by zodpovedali filtrom, ktoré ste použili.",
        subHeading: "Aby ste videli všetky epiky, vymažte všetky použité filtre.",
        action: "Vymazať filtre",
      },
    },
    scope: {
      view_scope: "Zobraziť rozsah",
      breakdown: "Rozklad rozsahu",
      add_scope: "Pridať rozsah",
      label: "Rozsah",
      empty_state: {
        title: "Zatiaľ nebol pridaný žiadny rozsah do tejto iniciatívy",
        description: "Prepojte projekty a epiky s iniciatívou, aby ste mohli začať.",
        primary_button: {
          text: "Pridať rozsah",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "Štítky",
        description: "Štruktúrujte a organizujte svoje iniciatívy pomocou štítkov.",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "Odstrániť štítok",
        content:
          "Naozaj chcete odstrániť {labelName}? Týmto sa odstráni štítok zo všetkých iniciatív a zo všetkých pohľadov, kde je štítok filtrovaný.",
      },
      toast: {
        delete_error: "Štítok iniciatívy sa nepodarilo odstrániť. Skúste to znova.",
        label_already_exists: "Štítok už existuje",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title:
          "Napíšte poznámku, dokument alebo úplnú znalostnej bázu. Nechajte Galilea, Plenovho AI asistenta, aby vám pomohol začať",
        description:
          "Stránky sú priestor pre myšlienky v Plene. Zapíšte si poznámky zo stretnutí, jednoducho ich formátujte, vložte pracovné položky, rozložte ich pomocou knižnice komponentov a uchovajte ich všetky v kontexte vášho projektu. Aby ste skrátili prácu na akomkoľvek dokumente, vyvolajte Galilea, AI Plena, pomocou skratky alebo kliknutia na tlačidlo.",
        primary_button: {
          text: "Vytvorte svoju prvú stránku",
        },
      },
      private: {
        title: "Zatiaľ žiadne súkromné stránky",
        description:
          "Uchovajte si tu svoje súkromné myšlienky. Keď budete pripravení zdieľať, tím je len na kliknutie.",
        primary_button: {
          text: "Vytvorte svoju prvú stránku",
        },
      },
      public: {
        title: "Zatiaľ žiadne stránky pracovného priestoru",
        description: "Pozrite si stránky zdieľané so všetkými vo vašom pracovnom priestore práve tu.",
        primary_button: {
          text: "Vytvorte svoju prvú stránku",
        },
      },
      archived: {
        title: "Zatiaľ žiadne archivované stránky",
        description:
          "Archivujte stránky, ktoré nie sú vo vašom radare. Keď ich budete potrebovať, pristupujte k nim tu.",
      },
    },
  },
  epics: {
    label: "Epiky",
    no_epics_selected: "Neboli vybrané žiadne epiky",
    add_selected_epics: "Pridať vybrané epiky",
    epic_link_copied_to_clipboard: "Odkaz na epik bol skopírovaný do schránky.",
    project_link_copied_to_clipboard: "Odkaz na projekt bol skopírovaný do schránky",
    empty_state: {
      general: {
        title: "Vytvorte epik a priraďte ho niekomu, aj sebe",
        description:
          "Pre väčšie celky práce, ktoré prechádzajú niekoľkými cyklami a môžu existovať naprieč modulmi, vytvorte epik. Prepojte pracovné položky a podpoložky v projekte s epikom a prejdite do pracovnej položky z prehľadu.",
        primary_button: {
          text: "Vytvoriť Epik",
        },
      },
      section: {
        title: "Zatiaľ žiadne epiky",
        description: "Začnite pridávať epiky na správu a sledovanie pokroku.",
        primary_button: {
          text: "Pridať epiky",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "Nenašli sa žiadne zodpovedajúce epiky",
      },
      no_epics: {
        title: "Nenašli sa žiadne epiky",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "Žiadne aktívne cykly",
        description:
          "Cykly vašich projektov, ktoré zahŕňajú akékoľvek obdobie, ktoré zahŕňa dnešný dátum v rámci svojho rozsahu. Nájdite tu pokrok a detaily všetkých vašich aktívnych cyklov.",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: `Pridajte pracovné položky do cyklu, aby ste videli jeho
 pokrok`,
      },
      priority: {
        title: `Sledujte pracovné položky s vysokou prioritou riešené v
 cykle na prvý pohľad.`,
      },
      assignee: {
        title: `Pridajte priradeným osobám pracovné položky, aby ste videli
 rozdelenie práce podľa priradených osôb.`,
      },
      label: {
        title: `Pridajte štítky k pracovným položkám, aby ste videli
 rozdelenie práce podľa štítkov.`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "Importovať členov z CSV",
      description: "Nahrajte CSV so stĺpcami: Email, Display Name, First Name, Last Name, Role (5, 15 alebo 20)",
      dropzone: {
        active: "Presuňte CSV súbor sem",
        inactive: "Presuňte alebo kliknite pre nahranie",
        file_type: "Podporované są iba súbory .csv",
      },
      buttons: {
        cancel: "Zrušiť",
        import: "Importovať",
        try_again: "Skúsiť znova",
        close: "Zavrieť",
        done: "Hotovo",
      },
      progress: {
        uploading: "Nahrávanie...",
        importing: "Importovanie...",
      },
      summary: {
        title: {
          failed: "Import zlyhal",
          complete: "Import dokončený",
        },
        message: {
          seat_limit: "Nie je možné importovať členov kvôli obmedzeniam počtu miest.",
          success: "Úspešne pridaných {count} člen{plural} do pracovného priestoru.",
          no_imports: "Zo súboru CSV neboli importovaní žiadni členovia.",
        },
        stats: {
          successful: "Úspešné",
          failed: "Neúspešné",
        },
        download_errors: "Stiahnuť chyby",
      },
      toast: {
        invalid_file: {
          title: "Neplatný súbor",
          message: "Podporované sú iba CSV súbory.",
        },
        import_failed: {
          title: "Import zlyhal",
          message: "Niečo sa pokazilo.",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "Nemožno archivovať pracovné položky",
        message: "Archivovať je možné iba pracovné položky patriace do skupín stavov Dokončené alebo Zrušené.",
      },
      invalid_issue_start_date: {
        title: "Nemožno aktualizovať pracovné položky",
        message:
          "Vybraný dátum začiatku nasleduje po termíne dokončenia niektorých pracovných položiek. Zabezpečte, aby dátum začiatku predchádzal termínu dokončenia.",
      },
      invalid_issue_target_date: {
        title: "Nemožno aktualizovať pracovné položky",
        message:
          "Vybraný termín dokončenia predchádza dátumu začiatku niektorých pracovných položiek. Zabezpečte, aby termín dokončenia nasledoval po dátume začiatku.",
      },
      invalid_state_transition: {
        title: "Nemožno aktualizovať pracovné položky",
        message: "Zmena stavu nie je povolená pre niektoré pracovné položky. Uistite sa, že zmena stavu je povolená.",
      },
    },
  },
  work_item_types: {
    label: "Typy pracovných položiek",
    label_lowercase: "typy pracovných položiek",
    settings: {
      title: "Typy pracovných položiek",
      properties: {
        title: "Vlastné vlastnosti",
        tooltip:
          "Každý typ pracovnej položky je dodávaný s predvolenou sadou vlastností ako Názov, Popis, Priradený používateľ, Stav, Priorita, Dátum začiatku, Termín dokončenia, Modul, Cyklus atď. Môžete si tiež prispôsobiť a pridať vlastné vlastnosti, aby vyhovovali potrebám vášho tímu.",
        add_button: "Pridať novú vlastnosť",
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
            label: "Rozbaľovací zoznam",
          },
          boolean: {
            label: "Booleovský",
          },
          date: {
            label: "Dátum",
          },
          member_picker: {
            label: "Výber člena",
          },
          release_picker: {
            label: "Výber vydania",
          },
          formula: {
            label: "Vzorec",
          },
        },
        attributes: {
          label: "Atribúty",
          text: {
            single_line: {
              label: "Jeden riadok",
            },
            multi_line: {
              label: "Odsek",
            },
            readonly: {
              label: "Iba na čítanie",
              header: "Údaje iba na čítanie",
            },
            invalid_text_format: {
              label: "Neplatný formát textu",
            },
          },
          number: {
            default: {
              placeholder: "Pridať číslo",
            },
          },
          relation: {
            single_select: {
              label: "Jediný výber",
            },
            multi_select: {
              label: "Viacnásobný výber",
            },
            no_default_value: {
              label: "Žiadna predvolená hodnota",
            },
          },
          boolean: {
            label: "Pravda | Nepravda",
            no_default: "Žiadna predvolená hodnota",
          },
          option: {
            create_update: {
              label: "Možnosti",
              form: {
                placeholder: "Pridať možnosť",
                errors: {
                  name: {
                    required: "Názov možnosti je povinný.",
                    integrity: "Možnosť s rovnakým názvom už existuje.",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "Vyberte možnosť",
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
              title: "Úspech!",
              message: "Vlastnosť {name} bola úspešne vytvorená.",
            },
            error: {
              title: "Chyba!",
              message: "Nepodarilo sa vytvoriť vlastnosť. Skúste to znova!",
            },
          },
          update: {
            success: {
              title: "Úspech!",
              message: "Vlastnosť {name} bola úspešne aktualizovaná.",
            },
            error: {
              title: "Chyba!",
              message: "Nepodarilo sa aktualizovať vlastnosť. Skúste to znova!",
            },
          },
          delete: {
            success: {
              title: "Úspech!",
              message: "Vlastnosť {name} bola úspešne odstránená.",
            },
            error: {
              title: "Chyba!",
              message: "Nepodarilo sa odstrániť vlastnosť. Skúste to znova!",
            },
          },
          enable_disable: {
            loading: "{action} vlastnosti {name}",
            success: {
              title: "Úspech!",
              message: "Vlastnosť {name} bola úspešne {action}.",
            },
            error: {
              title: "Chyba!",
              message: "Nepodarilo sa {action} vlastnosť. Skúste to znova!",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "Názov",
            },
            description: {
              placeholder: "Popis",
            },
          },
          errors: {
            name: {
              required: "Musíte pomenovať vašu vlastnosť.",
              max_length: "Názov vlastnosti by nemal presiahnuť 255 znakov.",
            },
            property_type: {
              required: "Musíte vybrať typ vlastnosti.",
            },
            options: {
              required: "Musíte pridať aspoň jednu možnosť.",
            },
            formula: {
              required: "Výraz vzorca je povinný.",
              invalid: "Neplatný vzorec: {error}",
              circular_reference:
                "Zistená cyklická referencia. Vzorec nemôže odkazovať sám na seba priamo ani nepriamo.",
              invalid_reference: "Vzorec odkazuje na neexistujúcu vlastnosť.",
            },
          },
        },
        formula: {
          field_label: "Pole vzorca",
          tooltip: "Zadajte vzorec pomocou syntaxe '{'Názov poľa'}'. Podporuje operátory +, -, *, / a &.",
          placeholder: "Napíšte vzorec",
          test_button: "Test",
          validating: "Overovanie",
          validation_success: "Vzorec je platný! Vracia {resultType}",
          validation_success_with_refs: "Vzorec je platný! Vracia {resultType} ({count} odkazovaných polí)",
          error: {
            empty: "Zadajte prosím vzorec",
            missing_context: "Chýba kontext pracovného priestoru, projektu alebo typu pracovnej položky",
            validation_failed: "Overenie zlyhalo",
          },
          picker: {
            no_match: "Žiadne zodpovedajúce vlastnosti",
            no_available: "Žiadne dostupné vlastnosti",
          },
        },
        enable_disable: {
          label: "Aktívne",
          tooltip: {
            disabled: "Kliknite pre deaktiváciu",
            enabled: "Kliknite pre aktiváciu",
          },
        },
        delete_confirmation: {
          title: "Odstrániť túto vlastnosť",
          description: "Odstránenie vlastností môže viesť k strate existujúcich údajov.",
          secondary_description: "Chcete namiesto toho deaktivovať vlastnosť?",
          primary_button: "{action}, odstrániť ju",
          secondary_button: "Áno, deaktivovať ju",
        },
        mandate_confirmation: {
          label: "Povinná vlastnosť",
          content:
            "Zdá sa, že pre túto vlastnosť existuje predvolená možnosť. Nastavenie vlastnosti ako povinnej odstráni predvolenú hodnotu a používatelia budú musieť pridať hodnotu podľa svojho výberu.",
          tooltip: {
            disabled: "Tento typ vlastnosti nemôže byť označený ako povinný",
            enabled: "Odškrtnite, aby ste pole označili ako voliteľné",
            checked: "Zaškrtnite, aby ste pole označili ako povinné",
          },
        },
        empty_state: {
          title: "Pridať vlastné vlastnosti",
          description: "Nové vlastnosti, ktoré pridáte pre tento typ pracovnej položky, sa zobrazia tu.",
        },
      },
      item_delete_confirmation: {
        title: "Odstrániť tento typ",
        description: "Odstránenie typov môže viesť k strate existujúcich údajov.",
        primary_button: "Áno, odstrániť",
        toast: {
          success: {
            title: "Úspech!",
            message: "Typ pracovnej položky bol úspešne odstránený.",
          },
          error: {
            title: "Chyba!",
            message: "Nepodarilo sa odstrániť typ pracovnej položky. Skúste to znova!",
          },
        },
        can_disable_warning: "Chcete namiesto toho zakázať tento typ?",
      },
      cant_delete_default_message:
        "Tento typ pracovnej položky nie je možné odstrániť, pretože je nastavený ako predvolený pre tento projekt.",
    },
    create: {
      title: "Vytvoriť typ pracovnej položky",
      button: "Pridať typ pracovnej položky",
      toast: {
        success: {
          title: "Úspech!",
          message: "Typ pracovnej položky bol úspešne vytvorený.",
        },
        error: {
          title: "Chyba!",
          message: {
            conflict: "Typ {name} už existuje. Zvoľte iný názov.",
          },
        },
      },
    },
    update: {
      title: "Aktualizovať typ pracovnej položky",
      button: "Aktualizovať typ pracovnej položky",
      toast: {
        success: {
          title: "Úspech!",
          message: "Typ pracovnej položky {name} bol úspešne aktualizovaný.",
        },
        error: {
          title: "Chyba!",
          message: {
            conflict: "Typ {name} už existuje. Zvoľte iný názov.",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "Dajte tomuto typu pracovnej položky jedinečný názov",
        },
        description: {
          placeholder: "Popíšte, na čo je tento typ pracovnej položky určený a kedy sa má používať.",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{action} typu pracovnej položky {name}",
        success: {
          title: "Úspech!",
          message: "Typ pracovnej položky {name} bol úspešne {action}.",
        },
        error: {
          title: "Chyba!",
          message: "Nepodarilo sa {action} typ pracovnej položky. Skúste to znova!",
        },
      },
      tooltip: "Kliknite pre {action}",
    },
    change_confirmation: {
      title: "Zmeniť typ pracovnej položky?",
      description:
        "Zmena typu pracovnej položky môže viesť k strate hodnôt vlastných vlastností, ktoré sú špecifické pre aktuálny typ. Túto akciu nie je možné vrátiť späť.",
      button: {
        loading: "Mení sa",
        default: "Zmeniť typ",
      },
    },
    empty_state: {
      enable: {
        title: "Povoliť Typy pracovných položiek",
        description:
          "Formujte pracovné položky podľa vašej práce pomocou Typov pracovných položiek. Prispôsobte ich ikonami, pozadiami a vlastnosťami a nakonfigurujte ich pre tento projekt.",
        primary_button: {
          text: "Povoliť",
        },
        confirmation: {
          title: "Po povolení nemožno Typy pracovných položiek zakázať.",
          description:
            "Pracovná položka Plane sa stane predvoleným typom pracovnej položky pre tento projekt a zobrazí sa so svojou ikonou a pozadím v tomto projekte.",
          button: {
            default: "Povoliť",
            loading: "Nastavuje sa",
          },
        },
      },
      get_pro: {
        title: "Získajte Pro pre povolenie Typov pracovných položiek.",
        description:
          "Formujte pracovné položky podľa vašej práce pomocou Typov pracovných položiek. Prispôsobte ich ikonami, pozadiami a vlastnosťami a nakonfigurujte ich pre tento projekt.",
        primary_button: {
          text: "Získať Pro",
        },
      },
      upgrade: {
        title: "Inovácia pre povolenie Typov pracovných položiek.",
        description:
          "Formujte pracovné položky podľa vašej práce pomocou Typov pracovných položiek. Prispôsobte ich ikonami, pozadiami a vlastnosťami a nakonfigurujte ich pre tento projekt.",
        primary_button: {
          text: "Inovovať",
        },
      },
    },
  },
  importers: {
    imports: "Importy",
    logo: "Logo",
    import_message: "Importujte vaše {serviceName} dáta do projektov plane.",
    deactivate: "Deaktivovať",
    deactivating: "Deaktivuje sa",
    migrating: "Migruje sa",
    migrations: "Migrácie",
    refreshing: "Obnovuje sa",
    import: "Import",
    serial_number: "Por. č.",
    project: "Projekt",
    workspace: "Vorkspejs",
    status: "Stav",
    summary: "Zhrnutie",
    total_batches: "Celkový počet dávok",
    imported_batches: "Importované dávky",
    re_run: "Spustiť znova",
    cancel: "Zrušiť",
    start_time: "Čas začatia",
    no_jobs_found: "Nenašli sa žiadne úlohy",
    no_project_imports: "Ešte ste neimportovali žiadne {serviceName} projekty.",
    cancel_import_job: "Zrušiť importnú úlohu",
    cancel_import_job_confirmation:
      "Ste si istí, že chcete zrušiť túto importnú úlohu? Týmto sa zastaví proces importu pre tento projekt.",
    re_run_import_job: "Opätovne spustiť importnú úlohu",
    re_run_import_job_confirmation:
      "Ste si istí, že chcete opätovne spustiť túto importnú úlohu? Týmto sa reštartuje proces importu pre tento projekt.",
    upload_csv_file: "Nahrajte CSV súbor na import používateľských údajov.",
    connect_importer: "Pripojiť {serviceName}",
    migration_assistant: "Asistent migrácie",
    migration_assistant_description:
      "Bezproblémovo migrujte vaše {serviceName} projekty do Plane s naším výkonným asistentom.",
    token_helper: "Toto získate z vášho",
    personal_access_token: "Osobný prístupový token",
    source_token_expired: "Token vypršal",
    source_token_expired_description:
      "Poskytnutý token vypršal. Prosím, deaktivujte a znovu pripojte s novým súborom prihlasovacích údajov.",
    user_email: "Email používateľa",
    select_state: "Vyberte stav",
    select_service_project: "Vyberte {serviceName} projekt",
    loading_service_projects: "Načítavajú sa {serviceName} projekty",
    select_service_workspace: "Vyberte {serviceName} vorkspejs",
    loading_service_workspaces: "Načítavajú sa {serviceName} vorkspejsy",
    select_priority: "Vyberte prioritu",
    select_service_team: "Vyberte {serviceName} tím",
    add_seat_msg_free_trial:
      "Pokúšate sa importovať {additionalUserCount} neregistrovaných používateľov a máte len {currentWorkspaceSubscriptionAvailableSeats} dostupných miest v aktuálnom pláne. Pre pokračovanie v importovaní inovujte teraz.",
    add_seat_msg_paid:
      "Pokúšate sa importovať {additionalUserCount} neregistrovaných používateľov a máte len {currentWorkspaceSubscriptionAvailableSeats} dostupných miest v aktuálnom pláne. Pre pokračovanie v importovaní kúpte najmenej {extraSeatRequired} extra miest.",
    skip_user_import_title: "Preskočiť import používateľských údajov",
    skip_user_import_description:
      "Preskočenie importu používateľov bude mať za následok, že pracovné položky, komentáre a ďalšie údaje z {serviceName} budú vytvorené používateľom vykonávajúcim migráciu v Plane. Používateľov môžete stále manuálne pridať neskôr.",
    invalid_pat: "Neplatný osobný prístupový token",
  },
  integrations: {
    integrations: "Integrácie",
    loading: "Načítava sa",
    unauthorized: "Nemáte oprávnenie na zobrazenie tejto stránky.",
    configure: "Konfigurovať",
    not_enabled: "{name} nie je povolené pre tento vorkspejs.",
    not_configured: "Nenakonfigurované",
    disconnect_personal_account: "Odpojiť osobný {providerName} účet",
    not_configured_message_admin:
      "Integrácia {name} nie je nakonfigurovaná. Kontaktujte správcu vašej inštancie pre konfiguráciu.",
    not_configured_message_support: "Integrácia {name} nie je nakonfigurovaná. Kontaktujte podporu pre konfiguráciu.",
    external_api_unreachable: "Nie je možné pristupovať k externej API. Skúste to prosím neskôr.",
    error_fetching_supported_integrations: "Nie je možné načítať podporované integrácie. Skúste to prosím neskôr.",
    back_to_integrations: "Späť na integrácie",
    select_state: "Vyberte stav",
    set_state: "Nastaviť stav",
    choose_project: "Vyberte projekt...",
    skip_backward_state_movement: "Zabrániť presunu problémov do skoršieho stavu kvôli aktualizáciám PR",
  },
  github_integration: {
    name: "GitHub",
    description: "Pripojte a synchronizujte vaše pracovné položky z GitHub s Plane",
    connect_org: "Pripojte organizáciu",
    connect_org_description: "Pripojte vašu GitHub organizáciu s Plane",
    processing: "Spracováva sa",
    org_added_desc: "GitHub org pripojená a čas",
    connection_fetch_error: "Chyba pri načítavaní detailov pripojenia zo servera",
    personal_account_connected: "Osobný účet pripojený",
    personal_account_connected_description: "Vaša GitHub účet je teraz pripojená k Plane",
    connect_personal_account: "Pripojte osobný účet",
    connect_personal_account_description: "Pripojte vašu osobnú GitHub účet s Plane.",
    repo_mapping: "Mapovanie repozitárov",
    repo_mapping_description: "Mapujte vaše GitHub repozitáre s projektami Plane.",
    project_issue_sync: "Synchronizácia problémov projektu",
    project_issue_sync_description: "Synchronizujte problémy z GitHub do vašeho projektu Plane",
    project_issue_sync_empty_state: "Zmapované synchronizácie problémov projektu sa zobrazia tu",
    configure_project_issue_sync_state: "Konfigurujte stav synchronizácie problémov",
    select_issue_sync_direction: "Vyberte smer synchronizácie problémov",
    allow_bidirectional_sync:
      "Bidirectional - Synchronizujte problémy a komentáre v oboch smeroch medzi GitHub a Plane",
    allow_unidirectional_sync: "Unidirectional - Synchronizujte problémy a komentáre z GitHub do Plane len",
    allow_unidirectional_sync_warning:
      "Údaje z GitHub Issue nahradia údaje v prepojenom pracovnom prvku Plane (iba GitHub → Plane)",
    remove_project_issue_sync: "Odstrániť túto synchronizáciu problémov projektu",
    remove_project_issue_sync_confirmation: "Ste si istí, že chcete odstrániť túto synchronizáciu problémov projektu?",
    add_pr_state_mapping: "Pridajte mapovanie stavu žiadosti o zlúčenie pre projekt Plane",
    edit_pr_state_mapping: "Edit mapovanie stavu žiadosti o zlúčenie pre projekt Plane",
    pr_state_mapping: "Mapovanie stavu žiadosti o zlúčenie",
    pr_state_mapping_description: "Mapujte stavy žiadostí o zlúčenie z GitHub do vašeho projektu Plane",
    pr_state_mapping_empty_state: "Zmapované stavy PR sa zobrazia tu",
    remove_pr_state_mapping: "Odstrániť toto mapovanie stavu žiadosti o zlúčenie",
    remove_pr_state_mapping_confirmation: "Ste si istí, že chcete odstrániť toto mapovanie stavu žiadosti o zlúčenie?",
    issue_sync_message: "Pracovné položky sú synchronizované do {project}",
    link: "Prepojiť GitHub repozitár s projektom Plane",
    pull_request_automation: "Automatizácia žiadosti o zlúčenie",
    pull_request_automation_description:
      "Nakonfigurujte mapovanie stavu žiadosti o zlúčenie z GitHub do vašeho projektu Plane",
    DRAFT_MR_OPENED: "Otvorený draft",
    MR_OPENED: "Otvorené",
    MR_READY_FOR_MERGE: "Pripravené na zlúčenie",
    MR_REVIEW_REQUESTED: "Kontrola vyžadovaná",
    MR_MERGED: "Zlúčené",
    MR_CLOSED: "Zatvorené",
    ISSUE_OPEN: "Issue Otvorené",
    ISSUE_CLOSED: "Issue Zatvorené",
    save: "Uložiť",
    start_sync: "Spustiť synchronizáciu",
    choose_repository: "Vyberte repozitár...",
  },
  gitlab_integration: {
    name: "Gitlab",
    description: "Pripojte a synchronizujte vaše Gitlab žiadosti o zlúčenie s Plane.",
    connection_fetch_error: "Chyba pri načítavaní detailov pripojenia zo servera",
    connect_org: "Pripojiť organizáciu",
    connect_org_description: "Pripojte vašu Gitlab organizáciu s Plane.",
    project_connections: "Pripojenia Gitlab projektov",
    project_connections_description: "Synchronizujte žiadosti o zlúčenie z Gitlab do projektov Plane.",
    plane_project_connection: "Pripojenie projektu Plane",
    plane_project_connection_description:
      "Nakonfigurujte mapovanie stavov žiadostí o zlúčenie z Gitlab do projektov Plane",
    remove_connection: "Odstrániť pripojenie",
    remove_connection_confirmation: "Ste si istí, že chcete odstrániť toto pripojenie?",
    link: "Prepojiť Gitlab repozitár s projektom Plane",
    pull_request_automation: "Automatizácia žiadostí o zlúčenie",
    pull_request_automation_description: "Nakonfigurujte mapovanie stavov žiadostí o zlúčenie z Gitlab do Plane",
    DRAFT_MR_OPENED: "Pri otvorení konceptu MR nastaviť stav na",
    MR_OPENED: "Pri otvorení MR nastaviť stav na",
    MR_REVIEW_REQUESTED: "Pri vyžiadaní kontroly MR nastaviť stav na",
    MR_READY_FOR_MERGE: "Pri MR pripravenom na zlúčenie nastaviť stav na",
    MR_MERGED: "Pri zlúčení MR nastaviť stav na",
    MR_CLOSED: "Pri uzavretí MR nastaviť stav na",
    integration_enabled_text:
      "S povolenou integráciou Gitlab môžete automatizovať pracovné postupy pracovných položiek",
    choose_entity: "Vyberte entitu",
    choose_project: "Vyberte projekt",
    link_plane_project: "Prepojiť projekt Plane",
    project_issue_sync: "Synchronizácia problémov projektu",
    project_issue_sync_description: "Synchronizujte problémy z Gitlab do vášho projektu Plane",
    project_issue_sync_empty_state: "Mapovaná synchronizácia problémov projektu sa zobrazí tu",
    configure_project_issue_sync_state: "Konfigurovať stav synchronizácie problémov",
    select_issue_sync_direction: "Vyberte smer synchronizácie problémov",
    allow_bidirectional_sync: "Obojsmerná - Synchronizovať problémy a komentáre obojsmerne medzi Gitlab a Plane",
    allow_unidirectional_sync: "Jednosmerná - Synchronizovať problémy a komentáre iba z Gitlab do Plane",
    allow_unidirectional_sync_warning:
      "Údaje z Gitlab Issue nahradia údaje v prepojenom pracovnom prvku Plane (iba Gitlab → Plane)",
    remove_project_issue_sync: "Odstrániť túto synchronizáciu problémov projektu",
    remove_project_issue_sync_confirmation: "Ste si istí, že chcete odstrániť túto synchronizáciu problémov projektu?",
    ISSUE_OPEN: "Problém otvorený",
    ISSUE_CLOSED: "Problém uzavretý",
    save: "Uložiť",
    start_sync: "Spustiť synchronizáciu",
    choose_repository: "Vyberte repozitár...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Pripojte a synchronizujte svoju inštanciu Gitlab Enterprise s Plane.",
    app_form_title: "Konfigurácia Gitlab Enterprise",
    app_form_description: "Nakonfigurujte Gitlab Enterprise pre pripojenie k Plane.",
    base_url_title: "Základná URL",
    base_url_description: "Základná URL vašej inštancie Gitlab Enterprise.",
    base_url_placeholder: 'napr. "https://glab.plane.town"',
    base_url_error: "Základná URL je povinná",
    invalid_base_url_error: "Neplatná základná URL",
    client_id_title: "ID aplikácie",
    client_id_description: "ID aplikácie, ktorú ste vytvorili vo vašej inštancii Gitlab Enterprise.",
    client_id_placeholder: 'napr. "7cd732xxxxxxxxxxxxxx"',
    client_id_error: "ID aplikácie je povinné",
    client_secret_title: "Client Secret",
    client_secret_description: "Client secret aplikácie, ktorú ste vytvorili vo vašej inštancii Gitlab Enterprise.",
    client_secret_placeholder: 'napr. "gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "Client secret je povinný",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description:
      "Náhodný webhook secret, ktorý bude použitý na overenie webhooku z inštancie Gitlab Enterprise.",
    webhook_secret_placeholder: 'napr. "webhook1234567890"',
    webhook_secret_error: "Webhook secret je povinný",
    connect_app: "Pripojiť aplikáciu",
  },
  slack_integration: {
    name: "Slack",
    description: "Pripojte váš Slack vorkspejs s Plane.",
    connect_personal_account: "Pripojte váš osobný Slack účet s Plane.",
    personal_account_connected: "Váš osobný {providerName} účet je teraz pripojený k Plane.",
    link_personal_account: "Prepojte váš osobný {providerName} účet s Plane.",
    connected_slack_workspaces: "Pripojené Slack vorkspejsy",
    connected_on: "Pripojené {date}",
    disconnect_workspace: "Odpojiť {name} vorkspejs",
    alerts: {
      dm_alerts: {
        title:
          "Dostávajte upozornenia v súkromných správach Slack pre dôležité aktualizácie, pripomenutia a upozornenia len pre vás.",
      },
    },
    project_updates: {
      title: "Aktualizácie Projektu",
      description: "Nakonfigurujte notifikácie o aktualizáciách projektov pre vaše projekty",
      add_new_project_update: "Pridať novú notifikáciu o aktualizáciách projektu",
      project_updates_empty_state: "Projekty pripojené s kanálmi Slack sa zobrazia tu.",
      project_updates_form: {
        title: "Konfigurovať Aktualizácie Projektu",
        description: "Dostávajte notifikácie o aktualizáciách projektu v Slack, keď sa vytvoria pracovné položky",
        failed_to_load_channels: "Nepodarilo sa načítať kanály zo Slack",
        project_dropdown: {
          placeholder: "Vyberte projekt",
          label: "Plane Projekt",
          no_projects: "Žiadne dostupné projekty",
        },
        channel_dropdown: {
          label: "Slack Kanál",
          placeholder: "Vyberte kanál",
          no_channels: "Žiadne dostupné kanály",
        },
        all_projects_connected: "Všetky projekty sú už pripojené ku kanálom Slack.",
        all_channels_connected: "Všetky kanály Slack sú už pripojené k projektom.",
        project_connection_success: "Pripojenie projektu úspešne vytvorené",
        project_connection_updated: "Pripojenie projektu úspešne aktualizované",
        project_connection_deleted: "Pripojenie projektu úspešne odstránené",
        failed_delete_project_connection: "Nepodarilo sa odstrániť pripojenie projektu",
        failed_create_project_connection: "Nepodarilo sa vytvoriť pripojenie projektu",
        failed_upserting_project_connection: "Nepodarilo sa aktualizovať pripojenie projektu",
        failed_loading_project_connections:
          "Nepodarilo sa načítať vaše pripojenia projektu. Môže to byť spôsobené problémom so sieťou alebo problémom s integráciou.",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "Pripojte váš Sentry pracovný priestor s Plane.",
    connected_sentry_workspaces: "Pripojené Sentry pracovné priestory",
    connected_on: "Pripojené {date}",
    disconnect_workspace: "Odpojiť pracovný priestor {name}",
    state_mapping: {
      title: "Mapovanie stavov",
      description:
        "Mapujte stavy incidentov Sentry na stavy vášho projektu. Nakonfigurujte, ktoré stavy použiť, keď je incident Sentry vyriešený alebo nevyriešený.",
      add_new_state_mapping: "Pridať nové mapovanie stavu",
      empty_state:
        "Nie sú nakonfigurované žiadne mapovania stavov. Vytvorte svoje prvé mapovanie na synchronizáciu stavov incidentov Sentry so stavmi vášho projektu.",
      failed_loading_state_mappings:
        "Nepodarilo sa nám načítať vaše mapovania stavov. Môže to byť spôsobené problémom so sieťou alebo problémom s integráciou.",
      loading_project_states: "Načítavanie stavov projektu...",
      error_loading_states: "Chyba pri načítavaní stavov",
      no_states_available: "Nie sú dostupné žiadne stavy",
      no_permission_states: "Nemáte povolenie na prístup k stavom pre tento projekt",
      states_not_found: "Stavy projektu sa nenašli",
      server_error_states: "Chyba servera pri načítavaní stavov",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "Pripojte a synchronizujte vašu GitHub Enterprise organizáciu s Plane.",
    app_form_title: "Konfigurácia GitHub Enterprise",
    app_form_description: "Konfigurujte GitHub Enterprise pre pripojenie s Plane.",
    app_id_title: "App ID",
    app_id_description: "ID aplikácie, ktorú ste vytvorili v vašej GitHub Enterprise organizácii.",
    app_id_placeholder: 'e.g., "1234567890"',
    app_id_error: "ID aplikácie je povinný",
    app_name_title: "App Slug",
    app_name_description: "Slug aplikácie, ktorú ste vytvorili v vašej GitHub Enterprise organizácii.",
    app_name_error: "Slug aplikácie je povinný",
    app_name_placeholder: 'e.g., "plane-github-enterprise"',
    base_url_title: "Základná URL",
    base_url_description: "Základná URL vašej GitHub Enterprise organizácie.",
    base_url_placeholder: 'e.g., "https://gh.plane.town"',
    base_url_error: "Základná URL je povinná",
    invalid_base_url_error: "Neplatná základná URL",
    client_id_title: "ID klienta",
    client_id_description: "ID klienta aplikácie, ktorú ste vytvorili v vašej GitHub Enterprise organizácii.",
    client_id_placeholder: 'e.g., "1234567890"',
    client_id_error: "ID klienta je povinný",
    client_secret_title: "Client Secret",
    client_secret_description: "Secret klienta aplikácie, ktorú ste vytvorili v vašej GitHub Enterprise organizácii.",
    client_secret_placeholder: 'e.g., "1234567890"',
    client_secret_error: "Secret klienta je povinný",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description: "Secret webhooku aplikácie, ktorú ste vytvorili v vašej GitHub Enterprise organizácii.",
    webhook_secret_placeholder: 'e.g., "1234567890"',
    webhook_secret_error: "Secret webhooku je povinný",
    private_key_title: "Privátny kľúč (Base64 encoded)",
    private_key_description:
      "Base64 encoded privátny kľúč aplikácie, ktorú ste vytvorili v vašej GitHub Enterprise organizácii.",
    private_key_placeholder: 'e.g., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Privátny kľúč je povinný",
    connect_app: "Pripojiť aplikáciu",
  },
  file_upload: {
    upload_text: "Kliknite sem na nahratie súboru",
    drag_drop_text: "Drag and Drop",
    processing: "Spracováva sa",
    invalid: "Neplatný typ súboru",
    missing_fields: "Chýbajúce polia",
    success: "{fileName} nahraný!",
  },
  silo_errors: {
    invalid_query_params: "Poskytnuté parametre dotazu sú neplatné alebo chýbajú povinné polia",
    invalid_installation_account: "Poskytnutý inštalačný účet nie je platný",
    generic_error: "Pri spracovaní vašej požiadavky sa vyskytla neočakávaná chyba",
    connection_not_found: "Požadované pripojenie nebolo nájdené",
    multiple_connections_found: "Bolo nájdených viacero pripojení, keď sa očakávalo iba jedno",
    installation_not_found: "Požadovaná inštalácia nebola nájdená",
    user_not_found: "Požadovaný používateľ nebol nájdený",
    error_fetching_token: "Zlyhalo načítanie autentifikačného tokenu",
    invalid_app_credentials: "Poskytnuté údaje aplikácie sú neplatné",
    invalid_app_installation_id: "Nepodarilo sa nainštalovať aplikáciu",
  },
  import_status: {
    queued: "V poradí",
    created: "Vytvorené",
    initiated: "Iniciované",
    pulling: "Sťahuje sa",
    timed_out: "Časový limit vypršal",
    pulled: "Stiahnuté",
    transforming: "Transformuje sa",
    transformed: "Transformované",
    pushing: "Nahrávajú sa",
    finished: "Dokončené",
    error: "Chyba",
    cancelled: "Zrušené",
  },
  jira_importer: {
    jira_importer_description: "Importujte vaše Jira dáta do projektov Plane.",
    create_project_automatically: "Vytvoriť projekt automaticky",
    create_project_automatically_description: "Vytvoríme pre vás nový projekt na základe podrobností o projekte Jira.",
    import_to_existing_project: "Importovať do existujúceho projektu",
    import_to_existing_project_description: "Vyberte existujúci projekt z rozbaľovacej ponuky nižšie.",
    state_mapping_automatic_creation: "Všetky stavy Jira sa automaticky vytvoria v Plane.",
    personal_access_token: "Osobný prístupový token",
    user_email: "Email používateľa",
    atlassian_security_settings: "Bezpečnostné nastavenia Atlassian",
    email_description: "Toto je email prepojený s vaším osobným prístupovým tokenom",
    jira_domain: "Jira doména",
    jira_domain_description: "Toto je doména vašej Jira inštancie",
    steps: {
      title_configure_plane: "Nakonfigurovať Plane",
      description_configure_plane:
        "Najprv vytvorte projekt v Plane, kam chcete migrovať vaše Jira dáta. Po vytvorení projektu ho tu vyberte.",
      title_configure_jira: "Nakonfigurovať Jira",
      description_configure_jira: "Vyberte Jira vorkspejs, z ktorého chcete migrovať vaše dáta.",
      title_import_users: "Importovať používateľov",
      description_import_users:
        "Pridajte používateľov, ktorých chcete migrovať z Jira do Plane. Alternatívne môžete tento krok preskočiť a manuálne pridať používateľov neskôr.",
      title_map_states: "Mapovať stavy",
      description_map_states:
        "Automaticky sme priradili Jira stavy k stavom Plane podľa našich najlepších schopností. Pred pokračovaním namapujte všetky zostávajúce stavy, môžete tiež vytvoriť stavy a mapovať ich manuálne.",
      title_map_priorities: "Mapovať priority",
      description_map_priorities:
        "Automaticky sme priradili priority podľa našich najlepších schopností. Pred pokračovaním namapujte všetky zostávajúce priority.",
      title_summary: "Súhrn",
      description_summary: "Tu je súhrn dát, ktoré budú migrované z Jira do Plane.",
      custom_jql_filter: "Vlastný JQL filter",
      jql_filter_description: "Použite JQL na filtrovanie konkrétnych úloh pre import.",
      project_code: "PROJEKT",
      enter_filters_placeholder: "Zadajte filtre (napr. status = 'In Progress')",
      validating_query: "Overovanie dopytu...",
      validation_successful_work_items_selected: "Overenie úspešné, vybraných {count} pracovných položiek.",
      run_syntax_check: "Spustiť kontrolu syntaxe na overenie dopytu",
      refresh: "Obnoviť",
      check_syntax: "Skontrolovať syntax",
      no_work_items_selected: "Dopyt nevybral žiadne pracovné položky.",
      validation_error_default: "Pri overovaní dopytu sa niečo pokazilo.",
    },
  },
  asana_importer: {
    asana_importer_description: "Importujte vaše Asana dáta do projektov Plane.",
    select_asana_priority_field: "Vyberte pole priority Asana",
    steps: {
      title_configure_plane: "Nakonfigurovať Plane",
      description_configure_plane:
        "Najprv vytvorte projekt v Plane, kam chcete migrovať vaše Asana dáta. Po vytvorení projektu ho tu vyberte.",
      title_configure_asana: "Nakonfigurovať Asana",
      description_configure_asana: "Vyberte Asana vorkspejs a projekt, z ktorého chcete migrovať vaše dáta.",
      title_map_states: "Mapovať stavy",
      description_map_states: "Vyberte Asana stavy, ktoré chcete mapovať na stavy projektu Plane.",
      title_map_priorities: "Mapovať priority",
      description_map_priorities: "Vyberte Asana priority, ktoré chcete mapovať na priority projektu Plane.",
      title_summary: "Súhrn",
      description_summary: "Tu je súhrn dát, ktoré budú migrované z Asana do Plane.",
    },
  },
  linear_importer: {
    linear_importer_description: "Importujte vaše Linear dáta do projektov Plane.",
    steps: {
      title_configure_plane: "Nakonfigurovať Plane",
      description_configure_plane:
        "Najprv vytvorte projekt v Plane, kam chcete migrovať vaše Linear dáta. Po vytvorení projektu ho tu vyberte.",
      title_configure_linear: "Nakonfigurovať Linear",
      description_configure_linear: "Vyberte Linear tím, z ktorého chcete migrovať vaše dáta.",
      title_map_states: "Mapovať stavy",
      description_map_states:
        "Automaticky sme priradili Linear stavy k stavom Plane podľa našich najlepších schopností. Pred pokračovaním namapujte všetky zostávajúce stavy, môžete tiež vytvoriť stavy a mapovať ich manuálne.",
      title_map_priorities: "Mapovať priority",
      description_map_priorities: "Vyberte Linear priority, ktoré chcete mapovať na priority projektu Plane.",
      title_summary: "Súhrn",
      description_summary: "Tu je súhrn dát, ktoré budú migrované z Linear do Plane.",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "Importujte vaše Jira Server/Data Center dáta do projektov Plane.",
    steps: {
      title_configure_plane: "Nakonfigurovať Plane",
      description_configure_plane:
        "Najprv vytvorte projekt v Plane, kam chcete migrovať vaše Jira dáta. Po vytvorení projektu ho tu vyberte.",
      title_configure_jira: "Nakonfigurovať Jira",
      description_configure_jira: "Vyberte Jira vorkspejs, z ktorého chcete migrovať vaše dáta.",
      title_map_states: "Mapovať stavy",
      description_map_states: "Vyberte Jira stavy, ktoré chcete mapovať na stavy projektu Plane.",
      title_map_priorities: "Mapovať priority",
      description_map_priorities: "Vyberte Jira priority, ktoré chcete mapovať na priority projektu Plane.",
      title_summary: "Súhrn",
      description_summary: "Tu je súhrn dát, ktoré budú migrované z Jira do Plane.",
    },
    import_epics: {
      title: "Importovať epiky ako pracovné položky",
      description:
        "S touto aktivovanou funkciou budú vaše epiky importované jako pracovné položky s typom pracovnej položky epika.",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "Importujte vaše CSV dáta do projektov Plane.",
    steps: {
      title_configure_plane: "Nakonfigurovať Plane",
      description_configure_plane:
        "Najprv vytvorte projekt v Plane, kam chcete migrovať vaše CSV dáta. Po vytvorení projektu ho tu vyberte.",
      title_configure_csv: "Nakonfigurovať CSV",
      description_configure_csv:
        "Nahrajte váš CSV súbor a nakonfigurujte polia, ktoré majú byť mapované na polia Plane.",
    },
  },
  csv_importer: {
    csv_importer_description: "Importujte pracovné položky zo súborov CSV do projektov Plane.",
    steps: {
      title_select_project: "Vybrať projekt",
      description_select_project: "Vyberte prosím projekt Plane, kam chcete importovat svoje pracovné položky.",
      title_upload_csv: "Nahrať CSV",
      description_upload_csv:
        "Nahrajte svoj súbor CSV obsahujúci pracovné položky. Súbor by mal obsahovat stĺpce pre názov, popis, prioritu, dátumy a skupinu stavov.",
    },
  },
  clickup_importer: {
    clickup_importer_description: "Importujte vaše ClickUp dáta do projektov Plane.",
    select_service_space: "Vyberte {serviceName} priestor",
    select_service_folder: "Vyberte {serviceName} priečinok",
    selected: "Vybrané",
    users: "Používatelia",
    steps: {
      title_configure_plane: "Nakonfigurovať Plane",
      description_configure_plane:
        "Najprv vytvorte projekt v Plane, kam chcete migrovať vaše ClickUp dáta. Po vytvorení projektu ho tu vyberte.",
      title_configure_clickup: "Nakonfigurovať ClickUp",
      description_configure_clickup: "Vyberte ClickUp tím, priestor a priečinok, z ktorého chcete migrovať vaše dáta.",
      title_map_states: "Mapovať stavy",
      description_map_states:
        "Máme automaticky mapované ClickUp stavy na stavy Plane podľa našich najlepších schopností. Pred pokračovaním namapujte všetky zostávajúce stavy, môžete tiež vytvoriť stavy a mapovať ich manuálne.",
      title_map_priorities: "Mapovať priority",
      description_map_priorities: "Vyberte ClickUp priority, ktoré chcete mapovať na priority projektu Plane.",
      title_summary: "Súhrn",
      description_summary: "Tu je súhrn dát, ktoré budú migrované z ClickUp do Plane.",
      pull_additional_data_title: "Importovať komentáre a prílohy",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "Stĺpec",
          long_label: "Stĺpcový graf",
          chart_models: {
            basic: "Základný",
            stacked: "Vrstvený",
            grouped: "Zoskupený",
          },
          orientation: {
            label: "Orientácia",
            horizontal: "Horizontálny",
            vertical: "Vertikálny",
            placeholder: "Pridať orientáciu",
          },
          bar_color: "Farba stĺpca",
        },
        line_chart: {
          short_label: "Čiara",
          long_label: "Čiarový graf",
          chart_models: {
            basic: "Základný",
            multi_line: "Viacčiarový",
          },
          line_color: "Farba čiary",
          line_type: {
            label: "Typ čiary",
            solid: "Plná",
            dashed: "Prerušovaná",
            placeholder: "Pridať typ čiary",
          },
        },
        area_chart: {
          short_label: "Plocha",
          long_label: "Plošný graf",
          chart_models: {
            basic: "Základný",
            stacked: "Vrstvený",
            comparison: "Porovnávací",
          },
          fill_color: "Farba výplne",
        },
        donut_chart: {
          short_label: "Donut",
          long_label: "Donut graf",
          chart_models: {
            basic: "Základný",
            progress: "Pokrok",
          },
          center_value: "Hodnota v strede",
          completed_color: "Farba dokončenia",
        },
        pie_chart: {
          short_label: "Koláč",
          long_label: "Koláčový graf",
          chart_models: {
            basic: "Základný",
          },
          group: {
            label: "Zoskupené časti",
            group_thin_pieces: "Zoskupiť tenké časti",
            minimum_threshold: {
              label: "Minimálna hranica",
              placeholder: "Pridať hranicu",
            },
            name_group: {
              label: "Názov skupiny",
              placeholder: '"Menej ako 5%"',
            },
          },
          show_values: "Zobraziť hodnoty",
          value_type: {
            percentage: "Percentá",
            count: "Počet",
          },
        },
        text: {
          short_label: "Text",
          long_label: "Text",
          alignment: {
            label: "Zarovnanie textu",
            left: "Vľavo",
            center: "V strede",
            right: "Vpravo",
            placeholder: "Pridať zarovnanie textu",
          },
          text_color: "Farba textu",
        },
        table_chart: {
          short_label: "Tabuľka",
          long_label: "Tabuľkový graf",
          chart_models: {
            basic: {
              short_label: "Základný",
              long_label: "Tabuľka",
            },
          },
          columns: "Stĺpce",
          rows: "Riadky",
          rows_placeholder: "Pridať riadky",
          configure_rows_hint: "Vyberte vlastnosť pre riadky na zobrazenie tejto tabuľky.",
        },
      },
      color_palettes: {
        modern: "Moderná",
        horizon: "Horizont",
        earthen: "Zemitá",
      },
      common: {
        add_widget: "Pridať vidžet",
        widget_title: {
          label: "Pomenujte tento vidžet",
          placeholder: 'napr., "Úlohy na včera", "Všetko dokončené"',
        },
        chart_type: "Typ grafu",
        visualization_type: {
          label: "Typ vizualizácie",
          placeholder: "Pridať typ vizualizácie",
        },
        date_group: {
          label: "Skupina dátumov",
          placeholder: "Pridať skupinu dátumov",
        },
        group_by: "Zoskupiť podľa",
        stack_by: "Vrstviť podľa",
        daily: "Denne",
        weekly: "Týždenne",
        monthly: "Mesačne",
        yearly: "Ročne",
        work_item_count: "Počet pracovných položiek",
        estimate_point: "Odhadovaný bod",
        pending_work_item: "Čakajúce pracovné položky",
        completed_work_item: "Dokončené pracovné položky",
        in_progress_work_item: "Rozpracované pracovné položky",
        blocked_work_item: "Blokované pracovné položky",
        work_item_due_this_week: "Pracovné položky splatné tento týždeň",
        work_item_due_today: "Pracovné položky splatné dnes",
        color_scheme: {
          label: "Farebná schéma",
          placeholder: "Pridať farebnú schému",
        },
        smoothing: "Vyhladzovanie",
        markers: "Značky",
        legends: "Legendy",
        tooltips: "Popisky",
        opacity: {
          label: "Priehľadnosť",
          placeholder: "Pridať priehľadnosť",
        },
        border: "Ohraničenie",
        widget_configuration: "Konfigurácia vidžetu",
        configure_widget: "Konfigurovať vidžet",
        guides: "Návody",
        style: "Štýl",
        area_appearance: "Vzhľad plochy",
        comparison_line_appearance: "Vzhľad porovnávacej čiary",
        add_property: "Pridať vlastnosť",
        add_metric: "Pridať metriku",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "Osi x chýba hodnota.",
            y_axis_metric: "Metrike chýba hodnota.",
          },
          stacked: {
            x_axis_property: "Osi x chýba hodnota.",
            y_axis_metric: "Metrike chýba hodnota.",
            group_by: "Vrstveniu podľa chýba hodnota.",
          },
          grouped: {
            x_axis_property: "Osi x chýba hodnota.",
            y_axis_metric: "Metrike chýba hodnota.",
            group_by: "Zoskupovaniu podľa chýba hodnota.",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "Osi x chýba hodnota.",
            y_axis_metric: "Metrike chýba hodnota.",
          },
          multi_line: {
            x_axis_property: "Osi x chýba hodnota.",
            y_axis_metric: "Metrike chýba hodnota.",
            group_by: "Zoskupovaniu podľa chýba hodnota.",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "Osi x chýba hodnota.",
            y_axis_metric: "Metrike chýba hodnota.",
          },
          stacked: {
            x_axis_property: "Osi x chýba hodnota.",
            y_axis_metric: "Metrike chýba hodnota.",
            group_by: "Vrstveniu podľa chýba hodnota.",
          },
          comparison: {
            x_axis_property: "Osi x chýba hodnota.",
            y_axis_metric: "Metrike chýba hodnota.",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "Osi x chýba hodnota.",
            y_axis_metric: "Metrike chýba hodnota.",
          },
          progress: {
            y_axis_metric: "Metrike chýba hodnota.",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "Osi x chýba hodnota.",
            y_axis_metric: "Metrike chýba hodnota.",
          },
        },
        text: {
          basic: {
            y_axis_metric: "Metrike chýba hodnota.",
          },
        },
        table_chart: {
          basic: {
            x_axis_property: "Stĺpcom chýba hodnota.",
            group_by: "Riadkom chýba hodnota.",
          },
        },
        ask_admin: "Požiadajte svojho administrátora o konfiguráciu tohto vidžetu.",
      },
    },
    create_modal: {
      heading: {
        create: "Vytvoriť nový dešbord",
        update: "Aktualizovať dešbord",
      },
      title: {
        label: "Pomenujte svoj dešbord.",
        placeholder: '"Kapacita naprieč projektmi", "Pracovné zaťaženie podľa tímu", "Stav naprieč všetkými projektmi"',
        required_error: "Názov je povinný",
      },
      project: {
        label: "Vyberte projekty",
        placeholder: "Dáta z týchto projektov budú poháňať tento dešbord.",
        required_error: "Projekty sú povinné",
      },
      filters_label: "Nastavte filtre pre vyššie uvedené zdroje údajov",
      create_dashboard: "Vytvoriť dešbord",
      update_dashboard: "Aktualizovať dešbord",
    },
    delete_modal: {
      heading: "Odstrániť dešbord",
    },
    empty_state: {
      feature_flag: {
        title: "Prezentujte svoj pokrok v dešbordoch na vyžiadanie, navždy.",
        description:
          "Vytvorte akýkoľvek dešbord, ktorý potrebujete, a prispôsobte vzhľad vašich dát pre dokonalú prezentáciu vášho pokroku.",
        coming_soon_to_mobile: "Čoskoro aj v mobilnej aplikácii",
        card_1: {
          title: "Pre všetky vaše projekty",
          description:
            "Získajte celkový pohľad na váš vorkspejs so všetkými vašimi projektmi alebo rozdeľte svoje pracovné dáta pre dokonalý pohľad na váš pokrok.",
        },
        card_2: {
          title: "Pre akékoľvek dáta v Plane",
          description:
            "Prejdite za hranice predpripravených Analytík a hotových grafov Cyklov, aby ste sa pozreli na tímy, iniciatívy alebo čokoľvek iné tak, ako nikdy predtým.",
        },
        card_3: {
          title: "Pre všetky vaše potreby vizualizácie dát",
          description:
            "Vyberte si z niekoľkých prispôsobiteľných grafov s podrobnými ovládacími prvkami, aby ste videli a zobrazili vaše pracovné dáta presne tak, ako chcete.",
        },
        card_4: {
          title: "Na vyžiadanie a trvalo",
          description:
            "Vytvorte raz, uchovajte navždy s automatickým obnovovaním vašich dát, kontextovými vlajkami pre zmeny rozsahu a zdieľateľnými permalinkami.",
        },
        card_5: {
          title: "Exporty a plánovaná komunikácia",
          description:
            "Pre tie časy, keď odkazy nefungujú, dostanete vaše dešbordy do jednorazových PDF alebo ich naplánujte na automatické odosielanie zainteresovaným stranám.",
        },
        card_6: {
          title: "Automatické rozloženie pre všetky zariadenia",
          description:
            "Zmeňte veľkosť vašich vidžetov pre požadované rozloženie a vidíte ich presne rovnako na mobiloch, tabletoch a iných prehliadačoch.",
        },
      },
      dashboards_list: {
        title: "Vizualizujte dáta vo vidžetoch, vytvárajte dešbordy s vidžetmi a vidíte najnovšie na vyžiadanie.",
        description:
          "Vytvorte svoje dešbordy s Vlastnými Vidžetmi, ktoré zobrazujú vaše dáta v rozsahu, ktorý špecifikujete. Získajte dešbordy pre všetku vašu prácu naprieč projektmi a tímami a zdieľajte permanentné odkazy so zainteresovanými stranami pre sledovanie na vyžiadanie.",
      },
      dashboards_search: {
        title: "To nezodpovedá názvu dešbordu.",
        description: "Uistite sa, že váš dotaz je správny alebo skúste iný dotaz.",
      },
      widgets_list: {
        title: "Vizualizujte svoje dáta tak, ako chcete.",
        description: `Použite čiary, stĺpce, koláče a iné formáty na zobrazenie vašich dát
takým spôsobom, akým chcete, zo zdrojov, ktoré špecifikujete.`,
      },
      widget_data: {
        title: "Nie je tu nič na zobrazenie",
        description: "Obnovte alebo pridajte dáta, aby ste ich tu videli.",
      },
    },
    common: {
      editing: "Upravuje sa",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "Povoliť nové pracovné položky",
      work_item_creation_disable_tooltip: "Vytváranie pracovných položiek je pre tento stav zakázané",
      default_state: "Predvolený stav umožňuje všetkým členom vytvárať nové pracovné položky. Toto sa nedá zmeniť",
      state_change_count:
        "{count, plural, one {1 povolená zmena stavu} few {{count} povolené zmeny stavu} other {{count} povolených zmien stavu}}",
      movers_count:
        "{count, plural, one {1 uvedený recenzent} few {{count} uvedení recenzenti} other {{count} uvedených recenzentov}}",
      state_changes: {
        label: {
          default: "Pridať povolenú zmenu stavu",
          loading: "Pridáva sa povolená zmena stavu",
        },
        move_to: "Zmeniť stav na",
        movers: {
          label: "Po kontrole používateľom",
          tooltip: "Recenzenti sú ľudia, ktorí majú povolenie presúvať pracovné položky z jedného stavu do druhého.",
          add: "Pridať recenzentov",
        },
      },
    },
    workflow_disabled: {
      title: "Túto pracovnú položku sem nemôžete presunúť.",
    },
    workflow_enabled: {
      label: "Zmena stavu",
    },
    workflow_tree: {
      label: "Pre pracovné položky v",
      state_change_label: "môže ho presunúť do",
    },
    empty_state: {
      upgrade: {
        title: "Ovládajte chaos zmien a recenzií s Vorkflou.",
        description: "Nastavte pravidlá pre to, kam sa vaša práca presúva, kým a kedy s Vorkflou v Plane.",
      },
    },
    quick_actions: {
      view_change_history: "Zobraziť históriu zmien",
      reset_workflow: "Resetovať vorkflou",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "Ste si istí, že chcete resetovať túto vorkflou?",
        description:
          "Ak resetujete túto vorkflou, všetky vaše pravidlá zmien stavu budú odstránené a budete ich musieť vytvoriť znova, aby fungovali v tomto projekte.",
      },
      delete_state_change: {
        title: "Ste si istí, že chcete odstrániť toto pravidlo zmeny stavu?",
        description:
          "Po odstránení nemôžete túto zmenu vrátiť späť a budete musieť nastaviť pravidlo znova, ak chcete, aby fungovalo pre tento projekt.",
      },
    },
    toasts: {
      enable_disable: {
        loading: "{action} vorkflou",
        success: {
          title: "Úspech",
          message: "Vorkflou bola úspešne {action}",
        },
        error: {
          title: "Chyba",
          message: "Vorkflou nemohla byť {action}. Skúste to znova.",
        },
      },
      reset: {
        success: {
          title: "Úspech",
          message: "Vorkflou bola úspešne resetovaná",
        },
        error: {
          title: "Chyba pri resetovaní vorkflou",
          message: "Vorkflou nemohla byť resetovaná. Skúste to znova.",
        },
      },
      add_state_change_rule: {
        error: {
          title: "Chyba pri pridávaní pravidla zmeny stavu",
          message: "Pravidlo zmeny stavu nemohlo byť pridané. Skúste to znova.",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "Chyba pri úprave pravidla zmeny stavu",
          message: "Pravidlo zmeny stavu nemohlo byť upravené. Skúste to znova.",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "Chyba pri odstránení pravidla zmeny stavu",
          message: "Pravidlo zmeny stavu nemohlo byť odstránené. Skúste to znova.",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "Chyba pri úprave recenzentov pravidla zmeny stavu",
          message: "Recenzenti pravidla zmeny stavu nemohli byť upravení. Skúste to znova.",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {Zákazník} few {Zákazníci} other {Zákazníkov}}",
    open: "Otvoriť zákazníka",
    dropdown: {
      placeholder: "Vyberte zákazníka",
      required: "Prosím vyberte zákazníka",
      no_selection: "Žiadni zákazníci",
    },
    upgrade: {
      title: "Prioritizujte a spravujte prácu so Zákazníkmi.",
      description: "Mapujte svoju prácu k zákazníkom a prioritizujte podľa atribútov zákazníka.",
    },
    properties: {
      default: {
        title: "Predvolené vlastnosti",
        customer_name: {
          name: "Meno zákazníka",
          placeholder: "Toto môže byť meno osoby alebo podniku",
          validation: {
            required: "Meno zákazníka je povinné.",
            max_length: "Meno zákazníka nemôže mať viac ako 255 znakov.",
          },
        },
        description: {
          name: "Popis",
          validation: {},
        },
        email: {
          name: "Email",
          placeholder: "Zadajte email",
          validation: {
            required: "Email je povinný.",
            pattern: "Neplatná emailová adresa.",
          },
        },
        website_url: {
          name: "Webstránka",
          placeholder: "Akákoľvek URL s https:// bude fungovať.",
          placeholder_short: "Pridať webstránku",
          validation: {
            pattern: "Neplatná URL webstránky",
          },
        },
        employees: {
          name: "Zamestnanci",
          placeholder: "Počet zamestnancov, ak je váš zákazník podnik.",
          validation: {
            min_length: "Zamestnanci nemôžu byť menej ako 0.",
            max_length: "Zamestnanci nemôžu byť viac ako 2147483647.",
          },
        },
        size: {
          name: "Veľkosť",
          placeholder: "Pridať veľkosť spoločnosti",
          validation: {
            min_length: "Neplatná veľkosť",
          },
        },
        domain: {
          name: "Odvetvie",
          placeholder: "Maloobchod, e-Commerce, Fintech, Bankovníctvo",
          placeholder_short: "Pridať odvetvie",
          validation: {},
        },
        stage: {
          name: "Fáza",
          placeholder: "Vyberte fázu",
          validation: {},
        },
        contract_status: {
          name: "Stav zmluvy",
          placeholder: "Vyberte stav zmluvy",
          validation: {},
        },
        revenue: {
          name: "Príjem",
          placeholder: "Toto je príjem, ktorý váš zákazník generuje ročne.",
          placeholder_short: "Pridať príjem",
          validation: {
            min_length: "Príjem nemôže byť menej ako 0.",
          },
        },
        invalid_value: "Neplatná hodnota vlastnosti.",
      },
      custom: {
        title: "Vlastné vlastnosti",
        info: "Pridajte jedinečné atribúty vašich zákazníkov do Plane, aby ste mohli lepšie spravovať pracovné položky alebo záznamy zákazníkov.",
      },
      empty_state: {
        title: "Zatiaľ nemáte žiadne vlastné vlastnosti.",
        description:
          "Vlastné vlastnosti, ktoré by ste chceli vidieť v pracovných položkách, inde v Plane, alebo mimo Plane v CRM alebo inom nástroji, sa tu zobrazia, keď ich pridáte.",
      },
      add: {
        primary_button: "Pridať novú vlastnosť",
      },
    },
    stage: {
      lead: "Lead",
      sales_qualified_lead: "Kvalifikovaný obchodný lead",
      contract_negotiation: "Vyjednávanie zmluvy",
      closed_won: "Uzavreté získané",
      closed_lost: "Uzavreté stratené",
    },
    contract_status: {
      active: "Aktívna",
      pre_contract: "Pred-zmluvná",
      signed: "Podpísaná",
      inactive: "Neaktívna",
    },
    empty_state: {
      detail: {
        title: "Nemohli sme nájsť tento záznam zákazníka.",
        description: "Odkaz na tento záznam môže byť nesprávny alebo tento záznam mohol byť odstránený.",
        primary_button: "Prejsť na zákazníkov",
        secondary_button: "Pridať zákazníka",
      },
      search: {
        title: "Zdá sa, že nemáte záznamy zákazníkov, ktoré by zodpovedali tomuto výrazu.",
        description:
          "Skúste s iným vyhľadávacím výrazom alebo nás kontaktujte, ak ste si istí, že by ste mali vidieť výsledky pre tento výraz.",
      },
      list: {
        title: "Spravujte objem, kadenciu a tok vašej práce podľa toho, čo je dôležité pre vašich zákazníkov.",
        description:
          "So Zákazníkmi, funkciou exkluzívnou pre Plane, môžete teraz vytvárať nových zákazníkov od základov a prepojiť ich s vašou prácou. Čoskoro ich budete môcť preniesť z iných nástrojov spolu s ich vlastnými atribútmi, ktoré sú pre vás dôležité.",
        primary_button: "Pridajte svojho prvého zákazníka",
      },
    },
    settings: {
      unauthorized: "Nemáte oprávnenie na prístup k tejto stránke.",
      description: "Sledujte a spravujte vzťahy so zákazníkmi vo vašom pracovnom postupe.",
      enable: "Povoliť Zákazníkov",
      toasts: {
        enable: {
          loading: "Povoľuje sa funkcia zákazníkov...",
          success: {
            title: "Zapli ste Zákazníkov pre tento vorkspejs.",
            message: "Nemôžete to znova vypnúť.",
          },
          error: {
            title: "Nemohli sme tentokrát zapnúť Zákazníkov.",
            message: "Skúste znova alebo sa vráťte na túto obrazovku neskôr. Ak to stále nefunguje.",
            action: "Hovoriť s podporou",
          },
        },
        disable: {
          loading: "Zakazuje sa funkcia zákazníkov...",
          success: {
            title: "Zákazníci zakázaní",
            message: "Funkcia zákazníkov úspešne zakázaná!",
          },
          error: {
            title: "Chyba",
            message: "Nepodarilo sa zakázať funkciu zákazníkov!",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "Nemohli sme získať váš zoznam zákazníkov.",
          message: "Skúste znova alebo obnovte túto stránku.",
        },
      },
      copy_link: {
        title: "Skopírovali ste priamy odkaz na tohto zákazníka.",
        message: "Vložte ho kamkoľvek a povedie priamo späť sem.",
      },
      create: {
        success: {
          title: "{customer_name} je teraz k dispozícii",
          message: "Môžete odkazovať na tohto zákazníka v pracovných položkách a sledovať aj požiadavky od neho.",
          actions: {
            view: "Zobraziť",
            copy_link: "Kopírovať odkaz",
            copied: "Skopírované!",
          },
        },
        error: {
          title: "Nemohli sme tento záznam tentokrát vytvoriť.",
          message:
            "Skúste ho uložiť znova alebo skopírujte svoj neuložený text do nového záznamu, najlepšie v inej karte.",
        },
      },
      update: {
        success: {
          title: "Úspech!",
          message: "Zákazník úspešne aktualizovaný!",
        },
        error: {
          title: "Chyba!",
          message: "Nemožné aktualizovať zákazníka. Skúste znova!",
        },
      },
      logo: {
        error: {
          title: "Nemohli sme nahrať logo zákazníka.",
          message: "Skúste logo uložiť znova alebo začnite od začiatku.",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "Odstránili ste pracovnú položku zo záznamu tohto zákazníka.",
            message: "Automaticky sme odstránili tohto zákazníka aj z pracovnej položky.",
          },
          error: {
            title: "Chyba!",
            message: "Nemohli sme tentokrát odstrániť túto pracovnú položku zo záznamu tohto zákazníka.",
          },
        },
        add: {
          error: {
            title: "Nemohli sme tentokrát pridať túto pracovnú položku do záznamu tohto zákazníka.",
            message:
              "Skúste túto pracovnú položku pridať znova alebo sa k nej vráťte neskôr. Ak to stále nefunguje, kontaktujte nás.",
          },
          success: {
            title: "Pridali ste pracovnú položku do záznamu tohto zákazníka.",
            message: "Automaticky sme pridali tohto zákazníka aj do pracovnej položky.",
          },
        },
      },
    },
    quick_actions: {
      edit: "Upraviť",
      copy_link: "Kopírovať odkaz na zákazníka",
      delete: "Odstrániť",
    },
    create: {
      label: "Vytvoriť záznam zákazníka",
      loading: "Vytvára sa",
      cancel: "Zrušiť",
    },
    update: {
      label: "Aktualizovať zákazníka",
      loading: "Aktualizuje sa",
    },
    delete: {
      title: "Ste si istí, že chcete odstrániť záznam zákazníka {customer_name}?",
      description:
        "Všetky údaje spojené s týmto záznamom budú natrvalo odstránené. Tento záznam nemôžete neskôr obnoviť.",
    },
    requests: {
      empty_state: {
        list: {
          title: "Zatiaľ nie sú žiadne požiadavky na zobrazenie.",
          description: "Vytvorte požiadavky od vašich zákazníkov, aby ste ich mohli prepojiť s pracovnými položkami.",
          button: "Pridať novú požiadavku",
        },
        search: {
          title: "Zdá sa, že nemáte požiadavky zodpovedajúce tomuto výrazu.",
          description:
            "Skúste s iným vyhľadávacím výrazom alebo nás kontaktujte, ak ste si istí, že by ste mali vidieť výsledky pre tento výraz.",
        },
      },
      label: "{count, plural, one {Požiadavka} few {Požiadavky} other {Požiadaviek}}",
      add: "Pridať požiadavku",
      create: "Vytvoriť požiadavku",
      update: "Aktualizovať požiadavku",
      form: {
        name: {
          placeholder: "Pomenujte túto požiadavku",
          validation: {
            required: "Názov je povinný.",
            max_length: "Názov požiadavky by nemal presiahnuť 255 znakov.",
          },
        },
        description: {
          placeholder: "Popíšte povahu požiadavky alebo vložte komentár tohto zákazníka z iného nástroja.",
        },
        source: {
          add: "Pridať zdroj",
          update: "Aktualizovať zdroj",
          url: {
            label: "URL",
            required: "URL je povinná",
            invalid: "Neplatná URL webstránky",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "Odkaz skopírovaný",
          message: "Odkaz na požiadavku zákazníka skopírovaný do schránky.",
        },
        attachment: {
          upload: {
            loading: "Nahráva sa príloha...",
            success: {
              title: "Príloha nahraná",
              message: "Príloha bola úspešne nahraná.",
            },
            error: {
              title: "Príloha nebola nahraná",
              message: "Prílohu nebolo možné nahrať.",
            },
          },
          size: {
            error: {
              title: "Chyba!",
              message: "Naraz je možné nahrať iba jeden súbor.",
            },
          },
          length: {
            message: "Súbor musí mať veľkosť {size}MB alebo menej",
          },
          remove: {
            success: {
              title: "Príloha odstránená",
              message: "Príloha bola úspešne odstránená",
            },
            error: {
              title: "Príloha nebola odstránená",
              message: "Prílohu nebolo možné odstrániť",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "Úspech!",
              message: "Zdroj úspešne aktualizovaný!",
            },
            error: {
              title: "Chyba!",
              message: "Nemožné aktualizovať zdroj.",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "Chyba!",
              message: "Nemožné pridať pracovné položky k požiadavke. Skúste znova.",
            },
            success: {
              title: "Úspech!",
              message: "Pracovné položky pridané k požiadavke.",
            },
          },
        },
        update: {
          success: {
            message: "Požiadavka úspešne aktualizovaná!",
            title: "Úspech!",
          },
          error: {
            title: "Chyba!",
            message: "Nemožné aktualizovať požiadavku. Skúste znova!",
          },
        },
        create: {
          success: {
            message: "Požiadavka úspešne vytvorená!",
            title: "Úspech!",
          },
          error: {
            title: "Chyba!",
            message: "Nemožné vytvoriť požiadavku. Skúste znova!",
          },
        },
      },
    },
    linked_work_items: {
      label: "Prepojené pracovné položky",
      link: "Prepojiť pracovné položky",
      empty_state: {
        list: {
          title: "Zdá sa, že zatiaľ nemáte prepojené pracovné položky k tomuto zákazníkovi.",
          description:
            "Prepojte existujúce pracovné položky z akéhokoľvek projektu tu, aby ste ich mohli sledovať podľa tohto zákazníka.",
          button: "Prepojiť pracovnú položku",
        },
      },
      action: {
        remove_epic: "Odstrániť epik",
        remove: "Odstrániť pracovnú položku",
      },
    },
    sidebar: {
      properties: "Vlastnosti",
    },
  },
  templates: {
    settings: {
      title: "Šablóny",
      description:
        "Ušetríte 80% času stráveného vytváraním projektov, pracovných položiek a stránok, keď použijete šablóny.",
      options: {
        project: {
          label: "Šablóny projektov",
        },
        work_item: {
          label: "Šablóny pracovných položiek",
        },
        page: {
          label: "Šablóny stránok",
        },
      },
      create_template: {
        label: "Vytvoriť šablónu",
        no_permission: {
          project: "Kontaktujte administrátora projektu na vytvorenie šablón",
          workspace: "Kontaktujte administrátora workspace na vytvorenie šablón",
        },
      },
      use_template: {
        button: {
          default: "Použiť šablónu",
          loading: "Používa sa",
        },
      },
      template_source: {
        workspace: {
          info: "Odvodené od workspace",
        },
        project: {
          info: "Odvodené od projektu",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "Pomenujte svoju šablónu projektu.",
              validation: {
                required: "Názov šablóny je povinný",
                maxLength: "Názov šablóny by nemal presiahnuť 255 znakov",
              },
            },
            description: {
              placeholder: "Popíšte, kedy a ako použiť túto šablónu.",
            },
          },
          name: {
            placeholder: "Pomenujte svoj projekt.",
            validation: {
              required: "Názov projektu je povinný",
              maxLength: "Názov projektu by nemal presiahnuť 255 znakov",
            },
          },
          description: {
            placeholder: "Popíšte účel a ciele tohto projektu.",
          },
          button: {
            create: "Vytvoriť šablónu projektu",
            update: "Aktualizovať šablónu projektu",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "Pomenujte svoju šablónu pracovnej položky.",
              validation: {
                required: "Názov šablóny je povinný",
                maxLength: "Názov šablóny by nemal presiahnuť 255 znakov",
              },
            },
            description: {
              placeholder: "Popíšte, kedy a ako použiť túto šablónu.",
            },
          },
          name: {
            placeholder: "Pomenujte túto pracovnú položku.",
            validation: {
              required: "Názov pracovnej položky je povinný",
              maxLength: "Názov pracovnej položky by nemal presiahnuť 255 znakov",
            },
          },
          description: {
            placeholder: "Popíšte, čo chcete dosiahnuť, keď dokončíte túto pracovnú položku.",
          },
          button: {
            create: "Vytvoriť šablónu pracovnej položky",
            update: "Aktualizovať šablónu pracovnej položky",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "Pomenujte svoju šablónu stránky.",
              validation: {
                required: "Názov šablóny je povinný",
                maxLength: "Názov šablóny by nemal presiahnuť 255 znakov",
              },
            },
            description: {
              placeholder: "Popíšte, kedy a ako použiť túto šablónu.",
            },
          },
          name: {
            placeholder: "Neznáma stránka",
            validation: {
              maxLength: "Názov stránky by nemal presiahnuť 255 znakov",
            },
          },
          button: {
            create: "Vytvoriť šablónu stránky",
            update: "Aktualizovať šablónu stránky",
          },
        },
        publish: {
          action: "{isPublished, select, true {Nastavenia publikovania} other {Publikovať na Marketplace}}",
          unpublish_action: "Odstrániť z Marketplace",
          title: "Urobte vašu šablónu objaviteľnou a rozpoznateľnou.",
          name: {
            label: "Názov šablóny",
            placeholder: "Pomenujte vašu šablónu",
            validation: {
              required: "Názov šablóny je povinný",
              maxLength: "Názov šablóny by nemal presiahnuť 255 znakov",
            },
          },
          short_description: {
            label: "Krátky popis",
            placeholder: "Táto šablóna je skvelá pre projektových manažérov, ktorí riadia niekoľko projektov súčasne.",
            validation: {
              required: "Krátky popis je povinný",
            },
          },
          description: {
            label: "Popis",
            placeholder: `Zvyšte produktivitu a zefektívnite komunikáciu s našou integráciou Reč-do-Textu.
• Prepis v reálnom čase: Okamžite preveďte hovorené slová do presného textu.
• Vytváranie úloh a komentárov: Pridávajte úlohy, popisy a komentáre pomocou hlasových príkazov.`,
            validation: {
              required: "Popis je povinný",
            },
          },
          category: {
            label: "Kategória",
            placeholder: "Vyberte, kde si myslíte, že to najlepšie zapadá. Môžete vybrať viacero.",
            validation: {
              required: "Je vyžadovaná aspoň jedna kategória",
            },
          },
          keywords: {
            label: "Kľúčové slová",
            placeholder:
              "Použite výrazy, ktoré si myslíte, že vaši používatelia budú hľadať pri hľadaní tejto šablóny.",
            helperText:
              "Zadajte kľúčové slová oddelené čiarkami, ktoré pomôžu ľuďom nájsť túto šablónu z vyhľadávania.",
            validation: {
              required: "Aspoň jedno kľúčové slovo je povinné",
            },
          },
          company_name: {
            label: "Názov spoločnosti",
            placeholder: "Plane",
            validation: {
              required: "Názov spoločnosti je povinný",
              maxLength: "Názov spoločnosti by nemal presiahnuť 255 znakov",
            },
          },
          contact_email: {
            label: "Email podpory",
            placeholder: "help@plane.so",
            validation: {
              invalid: "Neplatná emailová adresa",
              required: "Email podpory je povinný",
              maxLength: "Email podpory by nemal presiahnuť 255 znakov",
            },
          },
          privacy_policy_url: {
            label: "Odkaz na vaše zásady ochrany súkromia",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "Neplatná URL",
              maxLength: "URL by nemala presiahnuť 800 znakov",
            },
          },
          terms_of_service_url: {
            label: "Odkaz na vaše podmienky používania",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "Neplatná URL",
              maxLength: "URL by nemala presiahnuť 800 znakov",
            },
          },
          cover_image: {
            label: "Pridajte obrázok na obálku, ktorý sa zobrazí na trhu",
            upload_title: "Nahrať obrázok na obálku",
            upload_placeholder: "Kliknite na nahranie alebo pretiahnite a pustite pre nahranie obrázka na obálku",
            drop_here: "Pustiť sem",
            click_to_upload: "Kliknite na nahranie",
            invalid_file_or_exceeds_size_limit: "Neplatný súbor alebo prekročený limit veľkosti. Prosím, skúste znova.",
            upload_and_save: "Nahrať a uložiť",
            uploading: "Nahrávanie",
            remove: "Odstrániť",
            removing: "Odstraňovanie",
            validation: {
              required: "Obrázok na obálku je povinný",
            },
          },
          attach_screenshots: {
            label: "Zahrňte dokumenty a obrázky, ktoré si myslíte, že urobia prezeračov tejto šablóny.",
            validation: {
              required: "Je vyžadovaná aspoň jedna snímka obrazovky",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "Šablóny",
        description:
          "S projektmi, pracovnými položkami a stránkami v Plane, nemusíte vytvárať projekty od začiatku alebo nastavovať vlastnosti pracovných položiek ručne.",
        sub_description: "Ušetríte 80% času, keď použijete šablóny.",
      },
      no_templates: {
        button: "Vytvoriť svoju prvú šablónu",
      },
      no_labels: {
        description:
          "Žiadne štítky ešte neexistujú. Vytvorte štítky na pomoc organizácii a filtrovaniu pracovných položiek v projekte.",
      },
      no_work_items: {
        description: "Ešte nemáte pracovné položky. Pridajte jednu, aby ste lepšie struktúrovali svoju prácu.",
      },
      no_sub_work_items: {
        description: "Ešte nemáte pod-pracovné položky. Pridajte jednu, aby ste lepšie struktúrovali svoju prácu.",
      },
      page: {
        no_templates: {
          title: "Neexistujú žiadne šablóny, ku ktorým máte prístup.",
          description: "Prosím, vytvorte šablónu",
        },
        no_results: {
          title: "To sa nezhoduje so žiadnou šablónou.",
          description: "Skúste hľadať pomocou iných výrazov.",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "Šablóna vytvorená",
          message: "{templateName}, šablóna typu {templateType}, je teraz dostupná pre váš workspace.",
        },
        error: {
          title: "Nepodarilo sa vytvoriť túto šablónu.",
          message: "Skúste znova uložiť vaše údaje alebo ich prekopírovať do novej šablóny, preferujúc inú kartu.",
        },
      },
      update: {
        success: {
          title: "Šablóna upravená",
          message: "{templateName}, šablóna typu {templateType}, bola upravená.",
        },
        error: {
          title: "Nepodarilo sa uložiť zmeny do tejto šablóny.",
          message:
            "Skúste znova uložiť vaše údaje alebo sa vráťte k tejto šablóne neskôr. Ak stále existujú problémy, kontaktujte nás.",
        },
      },
      delete: {
        success: {
          title: "Šablóna odstránená",
          message: "{templateName}, šablóna typu {templateType}, bola odstránená z vašeho workspace.",
        },
        error: {
          title: "Nepodarilo sa odstrániť túto šablónu.",
          message: "Skúste odstrániť ju znova alebo sa vráťte k nej neskôr. Ak stále nepodarí, kontaktujte nás.",
        },
      },
      unpublish: {
        success: {
          title: "Šablóna stiahnuta",
          message: "{templateName}, šablóna typu {templateType}, bola stiahnutá z marketplace.",
        },
        error: {
          title: "Nepodarilo sa stiahnuť šablónu.",
          message: "Skúste ju stiahnuť znova alebo sa vráťte k nej neskôr. Ak stále nepodarí, kontaktujte nás.",
        },
      },
    },
    delete_confirmation: {
      title: "Odstrániť šablónu",
      description: {
        prefix: "Ste si istí, že chcete odstrániť šablónu-",
        suffix:
          "? Všetky údaje spojené s touto šablónou budú natrvalo odstránené. Tento krok nie je možné vrátiť späť.",
      },
    },
    unpublish_confirmation: {
      title: "Stiahnuť šablónu",
      description: {
        prefix: "Ste si istí, že chcete stiahnuť šablónu-",
        suffix: "? Šablóna bude stiahnutá z marketplace a nebude viac dostupná pre ostatných.",
      },
    },
    dropdown: {
      add: {
        work_item: "Pridať novú šablónu",
        project: "Pridať novú šablónu",
      },
      label: {
        project: "Vybrať šablónu projektu",
        page: "Vybrať šablónu",
      },
      tooltip: {
        work_item: "Vybrať šablónu pracovnej položky",
      },
      no_results: {
        work_item: "Žiadne šablóny neboli nájdené.",
        project: "Žiadne šablóny neboli nájdené.",
      },
    },
  },
  notion_importer: {
    notion_importer_description: "Importujte vaše Notion dáta do projektov Plane.",
    steps: {
      title_upload_zip: "Nahrať exportovaný ZIP z Notion",
      description_upload_zip: "Prosím nahrajte ZIP súbor obsahujúci vaše Notion dáta.",
    },
    upload: {
      drop_file_here: "Pretiahnite váš Notion zip súbor sem",
      upload_title: "Nahrať Notion export",
      upload_from_url: "Importovať z URL",
      upload_from_url_description: "Pre pokračovanie vložte verejnú URL adresu vášho ZIP exportu.",
      drag_drop_description: "Pretiahnite a pustite váš Notion export zip súbor alebo kliknite na prehľadávanie",
      file_type_restriction: "Podporované sú iba .zip súbory exportované z Notion",
      select_file: "Vybrať súbor",
      uploading: "Nahrávanie...",
      preparing_upload: "Príprava nahrávania...",
      confirming_upload: "Potvrdzovanie nahrávania...",
      confirming: "Potvrdzovanie...",
      upload_complete: "Nahrávanie dokončené",
      upload_failed: "Nahrávanie zlyhalo",
      start_import: "Spustiť import",
      retry_upload: "Opakovať nahrávanie",
      upload: "Nahrať",
      ready: "Pripravené",
      error: "Chyba",
      upload_complete_message: "Nahrávanie dokončené!",
      upload_complete_description: 'Kliknite na "Spustiť import" pre začatie spracovania vašich Notion dát.',
      upload_progress_message: "Prosím nezatvárajte toto okno.",
    },
  },
  confluence_importer: {
    confluence_importer_description: "Importujte vaše Confluence dáta do wiki Plane.",
    steps: {
      title_upload_zip: "Nahrať exportovaný ZIP z Confluence",
      description_upload_zip: "Prosím nahrajte ZIP súbor obsahujúci vaše Confluence dáta.",
    },
    upload: {
      drop_file_here: "Pretiahnite váš Confluence zip súbor sem",
      upload_title: "Nahrať Confluence export",
      upload_from_url: "Importovať z URL",
      upload_from_url_description: "Pre pokračovanie vložte verejnú URL adresu vášho ZIP exportu.",
      drag_drop_description: "Pretiahnite a pustite váš Confluence export zip súbor alebo kliknite na prehľadávanie",
      file_type_restriction: "Podporované sú iba .zip súbory exportované z Confluence",
      select_file: "Vybrať súbor",
      uploading: "Nahrávanie...",
      preparing_upload: "Príprava nahrávania...",
      confirming_upload: "Potvrdzovanie nahrávania...",
      confirming: "Potvrdzovanie...",
      upload_complete: "Nahrávanie dokončené",
      upload_failed: "Nahrávanie zlyhalo",
      start_import: "Spustiť import",
      retry_upload: "Opakovať nahrávanie",
      upload: "Nahrať",
      ready: "Pripravené",
      error: "Chyba",
      upload_complete_message: "Nahrávanie dokončené!",
      upload_complete_description: 'Kliknite na "Spustiť import" pre začatie spracovania vašich Confluence dát.',
      upload_progress_message: "Prosím nezatvárajte toto okno.",
    },
  },
  intake_forms: {
    create: {
      title: "Vytvoriť pracovnú položku",
      "sub-title": "Dajte tímu vedieť, na čom by ste chceli, aby pracoval.",
      name: "Meno",
      email: "E-mail",
      about: "O čom je táto pracovná položka?",
      description: "Opíšte, čo by sa malo stať",
      description_placeholder: "Pridajte toľko detailov, koľko chcete, aby tím identifikoval vašu situáciu a potreby.",
      loading: "Vytváram",
      create_work_item: "Vytvoriť pracovnú položku",
      errors: {
        name: "Meno je povinné",
        name_max_length: "Meno musí mať menej ako 255 znakov",
        email: "E-mail je povinný",
        email_invalid: "Neplatná e-mailová adresa",
        title: "Názov je povinný",
        title_max_length: "Názov musí mať menej ako 255 znakov",
      },
    },
    success: {
      title: "Vaša pracovná položka je teraz v poradníku tímu.",
      description: "Tím môže teraz schváliť alebo zahodiť túto pracovnú položku z fronty príjmov.",
      primary_button: {
        text: "Pridať ďalšiu pracovnú položku",
      },
      secondary_button: {
        text: "Zistiť viac o príjme",
      },
    },
    how_it_works: {
      title: "Ako to funguje?",
      heading: "Toto je formulár príjmu.",
      description:
        "Príjem je funkcia Plane, ktorá umožňuje správcom a manažérom projektov získavať pracovné položky zvonku do svojich projektov.",
      steps: {
        step_1: "Tento krátky formulár vám umožňuje vytvoriť novú pracovnú položku v projekte Plane.",
        step_2: "Keď odošlete tento formulár, vytvorí sa nová pracovná položka v príjme tohto projektu.",
        step_3: "Niekto z tohto projektu alebo tímu to skontroluje.",
        step_4: "Ak to schvália, táto pracovná položka sa presunie do fronty práce projektu. Inak bude odmietnutá.",
        step_5:
          "Ak chcete zistiť stav tejto pracovnej položky, kontaktujte manažéra projektu, správcu alebo toho, kto vám poslal odkaz na túto stránku.",
      },
    },
    type_forms: {
      select_types: {
        title: "Vybrať typ pracovnej položky",
        search_placeholder: "Hľadať typ pracovnej položky",
      },
      actions: {
        select_properties: "Vybrať vlastnosti",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "Opakujúce sa pracovné položky",
      description:
        "Nastavte opakujúce sa pracovné položky raz a my sa postaráme o opakovanie. Všetko sa tu zobrazí, keď bude čas.",
      new_recurring_work_item: "Nová opakujúca sa úloha",
      update_recurring_work_item: "Upraviť opakujúcu sa úlohu",
      form: {
        interval: {
          title: "Plán",
          start_date: {
            validation: {
              required: "Dátum začiatku je povinný",
            },
          },
          interval_type: {
            validation: {
              required: "Typ intervalu je povinný",
            },
          },
        },
        button: {
          create: "Vytvoriť opakujúcu sa úlohu",
          update: "Upraviť opakujúcu sa úlohu",
        },
      },
      create_button: {
        label: "Vytvoriť opakujúcu sa úlohu",
        no_permission: "Kontaktujte správcu projektu pre vytvorenie opakujúcich sa úloh",
      },
    },
    empty_state: {
      upgrade: {
        title: "Vaša práca na autopilote",
        description:
          "Nastavte raz. Pripomenieme vám to, keď bude čas. Upgradujte na Business, aby bola opakovaná práca bez námahy.",
      },
      no_templates: {
        button: "Vytvorte svoju prvú opakujúcu sa úlohu",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Opakujúca sa úloha vytvorená",
          message: "{name}, opakujúca sa úloha, je teraz dostupná vo vašom pracovnom priestore.",
        },
        error: {
          title: "Túto opakujúcu sa úlohu sa tentokrát nepodarilo vytvoriť.",
          message:
            "Skúste znova uložiť detaily alebo ich skopírujte do novej opakujúcej sa úlohy, ideálne v inom okne.",
        },
      },
      update: {
        success: {
          title: "Opakujúca sa úloha upravená",
          message: "{name}, opakujúca sa úloha, bola upravená.",
        },
        error: {
          title: "Zmeny tejto opakujúcej sa úlohy sa nepodarilo uložiť.",
          message:
            "Skúste znova uložiť detaily alebo sa k tejto úlohe vráťte neskôr. Ak problém pretrváva, kontaktujte nás.",
        },
      },
      delete: {
        success: {
          title: "Opakujúca sa úloha odstránená",
          message: "{name}, opakujúca sa úloha, bola odstránená z vášho pracovného priestoru.",
        },
        error: {
          title: "Túto opakujúcu sa úlohu sa nepodarilo odstrániť.",
          message:
            "Skúste ju odstrániť znova alebo sa k nej vráťte neskôr. Ak sa vám ju stále nedarí odstrániť, kontaktujte nás.",
        },
      },
    },
    delete_confirmation: {
      title: "Odstrániť opakujúcu sa úlohu",
      description: {
        prefix: "Naozaj chcete odstrániť opakujúcu sa úlohu-",
        suffix:
          "? Všetky údaje súvisiace s touto opakujúcou sa úlohou budú natrvalo odstránené. Táto akcia je nevratná.",
      },
    },
  },
  automations: {
    settings: {
      title: "Vlastné automatizácie",
      create_automation: "Vytvoriť automatizáciu",
    },
    scope: {
      label: "Rozsah",
      run_on: "Spustiť na",
    },
    trigger: {
      label: "Spúšťač",
      add_trigger: "Pridať spúšťač",
      sidebar_header: "Konfigurácia spúšťača",
      input_label: "Aký je spúšťač pre túto automatizáciu?",
      input_placeholder: "Vyberte možnosť",
      button: {
        previous: "Späť",
        next: "Pridať akciu",
      },
    },
    condition: {
      label: "Podmienka",
      add_condition: "Pridať podmienku",
      adding_condition: "Pridávanie podmienky",
    },
    action: {
      label: "Akcia",
      add_action: "Pridať akciu",
      sidebar_header: "Akcie",
      input_label: "Čo robí automatizácia?",
      input_placeholder: "Vyberte možnosť",
      handler_name: {
        add_comment: "Pridať komentár",
        change_property: "Zmeniť vlastnosť",
      },
      configuration: {
        label: "Konfigurácia",
        change_property: {
          placeholders: {
            property_name: "Vyberte vlastnosť",
            change_type: "Vyberte",
            property_value_select: "{count, plural, one{Vyberte hodnotu} few{Vyberte hodnoty} other{Vyberte hodnoty}}",
            property_value_select_date: "Vyberte dátum",
          },
          validation: {
            property_name_required: "Názov vlastnosti je povinný",
            change_type_required: "Typ zmeny je povinný",
            property_value_required: "Hodnota vlastnosti je povinná",
          },
        },
      },
      comment_block: {
        title: "Pridať komentár",
      },
      change_property_block: {
        title: "Zmeniť vlastnosť",
      },
      validation: {
        delete_only_action: "Pred odstránením jedinej akcie vypnite automatizáciu.",
      },
    },
    conjunctions: {
      and: "A",
      or: "Alebo",
      if: "Ak",
      then: "Potom",
    },
    enable: {
      alert:
        "Stlačte 'Povoliť', keď je vaša automatizácia dokončená. Po povolení bude automatizácia pripravená na spustenie.",
      validation: {
        required: "Automatizácia musí mať spúšťač a aspoň jednu akciu, aby mohla byť povolená.",
      },
    },
    delete: {
      validation: {
        enabled: "Automatizácia musí byť pred odstránením vypnutá.",
      },
    },
    table: {
      title: "Názov automatizácie",
      last_run_on: "Posledné spustenie",
      created_on: "Vytvorené",
      last_updated_on: "Posledná aktualizácia",
      last_run_status: "Stav posledného spustenia",
      average_duration: "Priemerné trvanie",
      owner: "Vlastník",
      executions: "Spustenia",
    },
    create_modal: {
      heading: {
        create: "Vytvoriť automatizáciu",
        update: "Aktualizovať automatizáciu",
      },
      title: {
        placeholder: "Pomenujte svoju automatizáciu.",
        required_error: "Názov je povinný",
      },
      description: {
        placeholder: "Opíšte svoju automatizáciu.",
      },
      submit_button: {
        create: "Vytvoriť automatizáciu",
        update: "Aktualizovať automatizáciu",
      },
    },
    delete_modal: {
      heading: "Odstrániť automatizáciu",
    },
    activity: {
      filters: {
        show_fails: "Zobraziť chyby",
        all: "Všetko",
        only_activity: "Len aktivita",
        only_run_history: "Len história spustení",
      },
      run_history: {
        initiator: "Iniciátor",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Úspech!",
          message: "Automatizácia bola úspešne vytvorená.",
        },
        error: {
          title: "Chyba!",
          message: "Vytvorenie automatizácie zlyhalo.",
        },
      },
      update: {
        success: {
          title: "Úspech!",
          message: "Automatizácia bola úspešne aktualizovaná.",
        },
        error: {
          title: "Chyba!",
          message: "Aktualizácia automatizácie zlyhala.",
        },
      },
      enable: {
        success: {
          title: "Úspech!",
          message: "Automatizácia bola úspešne povolená.",
        },
        error: {
          title: "Chyba!",
          message: "Povolenie automatizácie zlyhalo.",
        },
      },
      disable: {
        success: {
          title: "Úspech!",
          message: "Automatizácia bola úspešne vypnutá.",
        },
        error: {
          title: "Chyba!",
          message: "Vypnutie automatizácie zlyhalo.",
        },
      },
      delete: {
        success: {
          title: "Automatizácia odstránená",
          message: "{name}, automatizácia, bola odstránená z vášho projektu.",
        },
        error: {
          title: "Túto automatizáciu sa tentokrát nepodarilo odstrániť.",
          message:
            "Skúste ju odstrániť znova alebo sa k nej vráťte neskôr. Ak sa vám ju stále nedarí odstrániť, kontaktujte nás.",
        },
      },
      action: {
        create: {
          error: {
            title: "Chyba!",
            message: "Vytvorenie akcie zlyhalo. Skúste to znova!",
          },
        },
        update: {
          error: {
            title: "Chyba!",
            message: "Aktualizácia akcie zlyhala. Skúste to znova!",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "Zatiaľ nie sú žiadne automatizácie na zobrazenie.",
        description:
          "Automatizácie vám pomáhajú eliminovať opakujúce sa úlohy nastavením spúšťačov, podmienok a akcií. Vytvorte jednu, aby ste ušetrili čas a udržali prácu v plynulom chode.",
      },
      upgrade: {
        title: "Automatizácie",
        description: "Automatizácie sú spôsob automatizácie úloh vo vašom projekte.",
        sub_description: "Získajte späť 80% svojho administratívneho času, keď používate automatizácie.",
      },
    },
  },
  sso: {
    header: "Identita",
    description: "Nakonfigurujte svoju doménu pre prístup k bezpečnostným funkciám vrátane jednotného prihlásenia.",
    domain_management: {
      header: "Správa domén",
      verified_domains: {
        header: "Overené domény",
        description: "Overte vlastníctvo e-mailovej domény na povolenie jednotného prihlásenia.",
        button_text: "Pridať doménu",
        list: {
          domain_name: "Názov domény",
          status: "Stav",
          status_verified: "Overené",
          status_failed: "Zlyhalo",
          status_pending: "Čaká sa",
        },
        add_domain: {
          title: "Pridať doménu",
          description: "Pridajte svoju doménu na konfiguráciu SSO a overenie.",
          form: {
            domain_label: "Doména",
            domain_placeholder: "plane.so",
            domain_required: "Doména je povinná",
            domain_invalid: "Zadajte platný názov domény (napr. plane.so)",
          },
          primary_button_text: "Pridať doménu",
          primary_button_loading_text: "Pridáva sa",
          toast: {
            success_title: "Úspech!",
            success_message: "Doména bola úspešne pridaná. Prosím overte ju pridaním DNS TXT záznamu.",
            error_message: "Nepodarilo sa pridať doménu. Skúste to prosím znova.",
          },
        },
        verify_domain: {
          title: "Overte svoju doménu",
          description: "Postupujte podľa týchto krokov na overenie vašej domény.",
          instructions: {
            label: "Pokyny",
            step_1: "Prejdite do nastavení DNS pre váš doménový hostiteľ.",
            step_2: {
              part_1: "Vytvorte",
              part_2: "TXT záznam",
              part_3: "a vložte úplnú hodnotu záznamu uvedenú nižšie.",
            },
            step_3: "Táto aktualizácia zvyčajne trvá niekoľko minút, ale môže trvať až 72 hodín.",
            step_4: 'Kliknite na "Overiť doménu" na potvrdenie po aktualizácii DNS záznamu.',
          },
          verification_code_label: "Hodnota TXT záznamu",
          verification_code_description: "Pridajte tento záznam do nastavení DNS",
          domain_label: "Doména",
          primary_button_text: "Overiť doménu",
          primary_button_loading_text: "Overuje sa",
          secondary_button_text: "Urobím to neskôr",
          toast: {
            success_title: "Úspech!",
            success_message: "Doména bola úspešne overená.",
            error_message: "Nepodarilo sa overiť doménu. Skúste to prosím znova.",
          },
        },
        delete_domain: {
          title: "Zmazať doménu",
          description: {
            prefix: "Naozaj chcete zmazať",
            suffix: "? Túto akciu nemožno vrátiť späť.",
          },
          primary_button_text: "Zmazať",
          primary_button_loading_text: "Maže sa",
          secondary_button_text: "Zrušiť",
          toast: {
            success_title: "Úspech!",
            success_message: "Doména bola úspešne zmazaná.",
            error_message: "Nepodarilo sa zmazať doménu. Skúste to prosím znova.",
          },
        },
      },
    },
    providers: {
      header: "Jednotné prihlásenie",
      disabled_message: "Pridajte overenú doménu na konfiguráciu SSO",
      configure: {
        create: "Nakonfigurovať",
        update: "Upraviť",
      },
      switch_alert_modal: {
        title: "Prepínať metódu SSO na {newProviderShortName}?",
        content:
          "Chystáte sa povoliť {newProviderLongName} ({newProviderShortName}). Táto akcia automaticky zakáže {activeProviderLongName} ({activeProviderShortName}). Používatelia, ktorí sa pokúšajú prihlásiť cez {activeProviderShortName}, už nebudú môcť pristupovať k platforme, kým neprepnu na novú metódu. Naozaj chcete pokračovať?",
        primary_button_text: "Prepínať",
        primary_button_text_loading: "Prepína sa",
        secondary_button_text: "Zrušiť",
      },
      form_section: {
        title: "Detaily poskytnuté IdP pre {workspaceName}",
      },
      form_action_buttons: {
        saving: "Ukladá sa",
        save_changes: "Uložiť zmeny",
        configure_only: "Len nakonfigurovať",
        configure_and_enable: "Nakonfigurovať a povoliť",
        default: "Uložiť",
      },
      setup_details_section: {
        title: "{workspaceName} poskytnuté detaily pre váš IdP",
        button_text: "Získať detaily nastavenia",
      },
      saml: {
        header: "Povoliť SAML",
        description: "Nakonfigurujte svojho poskytovateľa identity SAML na povolenie jednotného prihlásenia.",
        configure: {
          title: "Povoliť SAML",
          description:
            "Overte vlastníctvo e-mailovej domény pre prístup k bezpečnostným funkciám vrátane jednotného prihlásenia.",
          toast: {
            success_title: "Úspech!",
            create_success_message: "Poskytovateľ SAML bol úspešne vytvorený.",
            update_success_message: "Poskytovateľ SAML bol úspešne aktualizovaný.",
            error_title: "Chyba!",
            error_message: "Nepodarilo sa uložiť poskytovateľa SAML. Skúste to prosím znova.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Webové detaily",
            entity_id: {
              label: "Entity ID | Publikum | Informácie o metadátach",
              description:
                "Vygenerujeme túto časť metadátov, ktorá identifikuje túto aplikáciu Plane ako autorizovanú službu na vašom IdP.",
            },
            callback_url: {
              label: "URL jednotného prihlásenia",
              description: "Vygenerujeme toto za vás. Pridajte toto do poľa URL presmerovania prihlásenia vášho IdP.",
            },
            logout_url: {
              label: "URL jednotného odhlásenia",
              description:
                "Vygenerujeme toto za vás. Pridajte toto do poľa URL presmerovania jednotného odhlásenia vášho IdP.",
            },
          },
          mobile_details: {
            header: "Mobilné detaily",
            entity_id: {
              label: "Entity ID | Publikum | Informácie o metadátach",
              description:
                "Vygenerujeme túto časť metadátov, ktorá identifikuje túto aplikáciu Plane ako autorizovanú službu na vašom IdP.",
            },
            callback_url: {
              label: "URL jednotného prihlásenia",
              description: "Vygenerujeme toto za vás. Pridajte toto do poľa URL presmerovania prihlásenia vášho IdP.",
            },
            logout_url: {
              label: "URL jednotného odhlásenia",
              description: "Vygenerujeme toto za vás. Pridajte toto do poľa URL presmerovania odhlásenia vášho IdP.",
            },
          },
          mapping_table: {
            header: "Detaily mapovania",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "Povoliť OIDC",
        description: "Nakonfigurujte svojho poskytovateľa identity OIDC na povolenie jednotného prihlásenia.",
        configure: {
          title: "Povoliť OIDC",
          description:
            "Overte vlastníctvo e-mailovej domény pre prístup k bezpečnostným funkciám vrátane jednotného prihlásenia.",
          toast: {
            success_title: "Úspech!",
            create_success_message: "Poskytovateľ OIDC bol úspešne vytvorený.",
            update_success_message: "Poskytovateľ OIDC bol úspešne aktualizovaný.",
            error_title: "Chyba!",
            error_message: "Nepodarilo sa uložiť poskytovateľa OIDC. Skúste to prosím znova.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Webové detaily",
            origin_url: {
              label: "Origin URL",
              description:
                "Vygenerujeme toto pre túto aplikáciu Plane. Pridajte toto ako dôveryhodný pôvod do zodpovedajúceho poľa vášho IdP.",
            },
            callback_url: {
              label: "URL presmerovania",
              description: "Vygenerujeme toto za vás. Pridajte toto do poľa URL presmerovania prihlásenia vášho IdP.",
            },
            logout_url: {
              label: "URL odhlásenia",
              description: "Vygenerujeme toto za vás. Pridajte toto do poľa URL presmerovania odhlásenia vášho IdP.",
            },
          },
          mobile_details: {
            header: "Mobilné detaily",
            origin_url: {
              label: "Origin URL",
              description:
                "Vygenerujeme toto pre túto aplikáciu Plane. Pridajte toto ako dôveryhodný pôvod do zodpovedajúceho poľa vášho IdP.",
            },
            callback_url: {
              label: "URL presmerovania",
              description: "Vygenerujeme toto za vás. Pridajte toto do poľa URL presmerovania prihlásenia vášho IdP.",
            },
            logout_url: {
              label: "URL odhlásenia",
              description: "Vygenerujeme toto za vás. Pridajte toto do poľa URL presmerovania odhlásenia vášho IdP.",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "Názov projektu nesmie obsahovať špeciálne znaky.",
  pql: {
    functions: {
      date: {
        now: {
          description: "Aktuálny dátum a čas",
        },
        today: {
          description: "Dnešný dátum",
        },
        start_of_day: {
          description: "Začiatok dnes",
        },
        end_of_day: {
          description: "Koniec dnes",
        },
        start_of_week: {
          description: "Začiatok aktuálneho týždňa",
        },
        end_of_week: {
          description: "Koniec aktuálneho týždňa",
        },
        start_of_month: {
          description: "Začiatok aktuálneho mesiaca",
        },
        end_of_month: {
          description: "Koniec aktuálneho mesiaca",
        },
        start_of_year: {
          description: "Začiatok aktuálneho roka",
        },
        end_of_year: {
          description: "Koniec aktuálneho roka",
        },
        days_ago: {
          description: "Dátum pred n dňami",
        },
        days_from_now: {
          description: "Dátum o n dní",
        },
        weeks_ago: {
          description: "Dátum pred n týždňami",
        },
        weeks_from_now: {
          description: "Dátum o n týždňov",
        },
        months_ago: {
          description: "Dátum pred n mesiacmi",
        },
        months_from_now: {
          description: "Dátum o n mesiacov",
        },
      },
      user: {
        current_user: {
          description: "Aktuálne prihlásený používateľ",
        },
        members_of: {
          description: 'Členovia "project:<id>" alebo "teamspace:<id>"',
        },
        workspace_members: {
          description: "Všetci členovia pracovného priestoru",
        },
      },
      cycle: {
        active_cycle: {
          description: "Dnes aktívny cyklus",
        },
        completed_cycles: {
          description: "Cykly, ktorých dátum ukončenia uplynul",
        },
        upcoming_cycles: {
          description: "Cykly, ktorých dátum začatia je v budúcnosti",
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
          description: "Dátum splatnosti uplynul A stav je otvorený",
        },
        has_no_assignee: {
          description: "Pracovná položka nemá priradeného riešiteľa",
        },
        has_no_label: {
          description: "Pracovná položka nemá štítky",
        },
        is_top_level: {
          description: "Nie je podpracovnou položkou (nemá rodiča)",
        },
        is_sub_work_item: {
          description: "Je podpracovnou položkou (má rodiča)",
        },
        is_epic: {
          description: "Epik",
        },
        is_intake: {
          description: "Je vstupnou pracovnou položkou",
        },
        is_draft: {
          description: "Je pracovnou položkou v koncepte",
        },
        is_archived: {
          description: "Je archivovaná",
        },
        has_children: {
          description: "Má aspoň jednu podpracovnú položku",
        },
        has_start_and_due_dates: {
          description: "Má dátum začatia aj dátum splatnosti",
        },
      },
      relation: {
        linked_to: {
          description: "Pracovné položky súvisiace s danou položkou",
        },
        blocked_by: {
          description: "Pracovné položky blokované danou položkou",
        },
        blocks: {
          description: "Pracovné položky, ktoré blokujú danú položku",
        },
        child_of: {
          description: "Podpracovné položky danej položky",
        },
        parent_of: {
          description: "Nadriadená pracovná položka danej položky",
        },
        duplicate_of: {
          description: "Pracovné položky označené ako duplikáty danej položky",
        },
      },
      history: {
        was_ever: {
          description: "Pole malo niekedy túto hodnotu",
        },
        was: {
          description: "Pole malo predtým túto hodnotu (zmenilo sa)",
        },
        changed_from: {
          description: "Pole bolo zmenené z tejto hodnoty",
        },
        changed_to: {
          description: "Pole bolo zmenené na túto hodnotu",
        },
        changed: {
          description: "Pole bolo zmenené",
        },
        updated_by: {
          description: "Pracovná položka aktualizovaná týmto používateľom",
        },
        commented_by: {
          description: "Pracovná položka okomentovaná týmto používateľom",
        },
        field_changed_by: {
          description: "Pole zmenené týmto používateľom",
        },
        was_assigned_to: {
          description: "Pracovná položka bola priradená tomuto používateľovi",
        },
        changed_after: {
          description: "Pole zmenené po tomto dátume",
        },
        changed_before: {
          description: "Pole zmenené pred týmto dátumom",
        },
        field_changed_after: {
          description: "Pole zmenené po tomto dátume",
        },
        field_changed_before: {
          description: "Pole zmenené pred týmto dátumom",
        },
        changed_to_after: {
          description: "Pole zmenené na túto hodnotu po tomto dátume",
        },
        changed_to_before: {
          description: "Pole zmenené na túto hodnotu pred týmto dátumom",
        },
        field_changed_between: {
          description: "Pole zmenené medzi týmito dátumami",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "navigovať",
      accept: "prijať",
      close: "zatvoriť",
      pick_date: "Vybrať dátum",
    },
    placeholder: 'Zadajte dopyt a stlačte "ENTER" na filtrovanie...',
    error: "Chyba pri odosielaní dopytu. Skontrolujte a skúste znova.",
  },
  releases: {
    label: "{count, plural, one {Vydanie} other {Vydania}}",
    no_release: "Žiadne vydanie",
    unreleased: "Nevydané",
    select_releases: "Vybrať vydania",
    overview: "Prehľad",
    scope: "Rozsah",
    page_title: {
      scope: "Vydanie - {name} | Rozsah",
      scope_fallback: "Vydanie | Rozsah",
    },
    properties: "Vlastnosti",
    target_date: "Cieľový dátum",
    lead: "Vedúci",
    release_tag: "Tag",
    labels: "Štítky",
    description_placeholder: "Pridajte popis...",
    progress: "Priebeh",
    completed_work_items: "Dokončené pracovné položky",
    pending_work_items: "Čakajúce pracovné položky",
    cancelled_work_items: "Zrušené pracovné položky",
    scope_page: {
      work_items: "Pracovné položky",
      add_work_items: "Pridať pracovné položky",
      remove_from_release: "Odobrať z vydania",
      empty_state: {
        title: "Žiadne pracovné položky",
        description: "Pridajte pracovné položky na vymedzenie rozsahu vydania.",
      },
      confirm_remove: {
        content: "Naozaj chcete odobrať túto pracovnú položku z vydania? V projekte zostane.",
        primary_button: {
          default: "Odobrať",
          loading: "Odoberá sa",
        },
      },
    },
    empty_state: {
      title: "Zatiaľ žiadny rozsah",
      description: "Pridajte pracovné položky k vydaniu a sledujte ich dokončenie pre toto vydanie.",
      add_scope: "Pridať rozsah",
      not_found: {
        title: "Vydanie sa nenašlo",
        description: "Vydanie mohlo byť odstránené.",
        primary_button: "Späť na vydania",
      },
    },
    toast: {
      work_items_added: "{count, plural, one {Pracovná položka pridaná} other {Pracovné položky pridané}}",
      work_items_error: "Nepodarilo sa pridať pracovné položky",
    },
    count_releases: "{count, plural, one {# vydanie} other {# vydania}}",
    actions: {
      delete: "Odstrániť",
    },
    delete_modal: {
      title: "Odstrániť vydanie",
      content: 'Naozaj chcete odstrániť vydanie "{releaseName}"? Túto akciu nie je možné vrátiť späť.',
    },
    settings: {
      heading: {
        title: "Vydania",
        description: "Spravujte projektové dodávky s presnosťou pomocou vydaní.",
      },
      toggle: {
        title: "Povoliť vydania",
        description: "Členovia pracovného priestoru budú mať prístup na zobrazenie rozsahu vo svojich projektoch.",
      },
      toasts: {
        enable: {
          loading: "Povoľujú sa vydania...",
          success: {
            title: "Vydania povolené",
            message: "Vydania boli pre tento pracovný priestor povolené.",
          },
          error: {
            title: "Chyba",
            message: "Nepodarilo sa povoliť vydania. Skúste to prosím znova.",
          },
        },
        disable: {
          loading: "Zakazujú sa vydania...",
          success: {
            title: "Vydania zakázané",
            message: "Vydania boli pre tento pracovný priestor zakázané.",
          },
          error: {
            title: "Chyba",
            message: "Nepodarilo sa zakázať vydania. Skúste to prosím znova.",
          },
        },
      },
      tabs: {
        tags: "Tagy vydaní",
        labels: "Štítky",
      },
      tags: {
        title: "Tagy vydaní",
        description: "Kategorizujte a filtrujte svoje vydania pomocou tagov.",
        add: "Pridať tag",
        empty_state: "Zatiaľ žiadne tagy. Vytvorte svoj prvý tag.",
        errors: {
          version_required: "Verzia je povinná.",
          version_already_exists: "Tag s touto verziou už existuje.",
          generic: "Niečo sa pokazilo. Skúste to prosím znova.",
        },
        delete_modal: {
          title: "Odstrániť tag",
          content: 'Naozaj chcete odstrániť tag "{tagVersion}"? Túto akciu nie je možné vrátiť späť.',
        },
        actions: {
          edit: "Upraviť tag",
          delete: "Odstrániť tag",
        },
        toasts: {
          delete: {
            success: "Tag bol úspešne odstránený.",
            error: "Tag sa nepodarilo odstrániť. Skúste to prosím znova.",
          },
        },
      },
      labels: {
        title: "Štítky",
        description: "Štrukturujte a organizujte svoje iniciatívy pomocou štítkov.",
        add: "Pridať štítok",
        empty_state: "Zatiaľ žiadne štítky. Vytvorte svoj prvý štítok.",
        errors: {
          name_required: "Názov je povinný.",
          name_already_exists: "Štítok s týmto názvom už existuje.",
          generic: "Niečo sa pokazilo. Skúste to prosím znova.",
        },
        modal: {
          name_placeholder: "Názov štítku",
          pick_color: "Vyberte farbu štítku",
        },
        actions: {
          edit: "Upraviť štítok",
          delete: "Odstrániť štítok",
        },
        drag_to_reorder: "Potiahnutím zmeňte poradie",
        delete_modal: {
          title: "Odstrániť štítok",
          content: 'Naozaj chcete odstrániť štítok "{labelName}"? Túto akciu nie je možné vrátiť späť.',
        },
        toasts: {
          delete: {
            success: "Štítok bol úspešne odstránený.",
            error: "Štítok sa nepodarilo odstrániť. Skúste to prosím znova.",
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
        "Nastavte úrovne hierarchie na organizáciu svojej práce. Každá úroveň definuje nadradenú vzťah s položkou priamo nad ňou a podradenou vzťah s položkou priamo pod ňou. ",
      sidebar_label: "Hierarchia",
      enable_control: {
        title: "Povoliť hierarchiu",
        description: "Vytvorte vzťahy rodič-potomok medzi rôznymi typmi pracovných položiek.",
        tooltip: "Hierarchiu nemôžete deaktivovať po jej aktivácii.",
      },
      workspace_work_item_types_disabled_banner: {
        content: "Najprv definujte typy pracovných položiek na vytvorenie novej hierarchie.",
        cta: "Nastavenia typov pracovných položiek",
      },
    },
    levels: {
      add_level_button: "Pridať úroveň hierarchie",
      empty_level_placeholder: "Pridajte typ pracovnej položky na úroveň {level}",
      empty_level_unauthorized: "Na tejto úrovni sa nenašli žiadne typy pracovných položiek.",
      zero_level_description:
        "Predvolene sú všetky typy pracovných položiek na úrovni 0, kým nie sú priradené k hierarchii.",
    },
    add_level_modal: {
      title: "Pridať úroveň hierarchie",
      description: "Pridajte novú úroveň hierarchie k typu pracovnej položky.",
      work_item_type: "Typ pracovnej položky",
      empty_state: {
        title: "Všetky typy pracovných položiek sú používané",
        description:
          "Každý typ pracovnej položky definovaný v tomto pracovnom priestore je už súčasťou vašej hierarchie.",
      },
      invalid_level_toast: {
        title: "Chyba!",
        message: "{type_name} nie je možné pridať na úroveň {level}, pretože porušuje pravidlá hierarchie.",
      },
      not_found_toast: {
        title: "Chyba",
        message: "Typ pracovnej položky sa nenašiel.",
      },
      error_toast: {
        title: "Chyba",
        message: "Nepodarilo sa pridať typ pracovnej položky do hierarchie.",
      },
    },
    remove_from_level_toast: {
      loading: "Odstraňovanie typu pracovnej položky z úrovne",
      success: {
        title: "Úspech!",
        message: "Typ pracovnej položky bol úspešne odstránený z úrovne.",
      },
      error: {
        title: "Chyba!",
        message: "Nepodarilo sa odstrániť typ pracovnej položky z úrovne.",
      },
    },
    work_item_modal: {
      invalid_work_item_type_create_toast: {
        title: "Chyba!",
        message:
          "Vybraný typ pracovnej položky nie je možné použiť na vytvorenie novej pracovnej položky, pretože porušuje pravidlá hierarchie.",
      },
      invalid_work_item_type_update_toast: {
        title: "Chyba!",
        message: "Typ pracovnej položky nie je možné aktualizovať, pretože porušuje pravidlá hierarchie.",
      },
    },
  },
} as const;
