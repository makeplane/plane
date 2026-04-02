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
      "Stiamo lavorando su questo. Se hai bisogno di assistenza immediata,",
    reach_out_to_us: "contattaci",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our:
      "Altrimenti, prova ad aggiornare la pagina di tanto in tanto o visita la nostra",
    status_page: "pagina di stato",
  },
  sidebar: {
    projects: "Progetti",
    pages: "Pagine",
    new_work_item: "Nuovo elemento di lavoro",
    home: "Home",
    your_work: "Il tuo lavoro",
    inbox: "Posta in arrivo",
    workspace: "workspace",
    views: "Visualizzazioni",
    analytics: "Analisi",
    work_items: "Elementi di lavoro",
    cycles: "Cicli",
    modules: "Moduli",
    intake: "Intake",
    drafts: "Bozze",
    favorites: "Preferiti",
    pro: "Pro",
    upgrade: "Aggiorna",
    pi_chat: "Plane AI",
    initiatives: "Iniziative",
    teamspaces: "Teamspaces",
    epics: "Epiche",
    upgrade_plan: "Piano di aggiornamento",
    plane_pro: "Plane Pro",
    business: "Business",
    recurring_work_items: "Elementi di lavoro ricorrenti",
  },
  auth: {
    common: {
      email: {
        label: "Email",
        placeholder: "nome@azienda.com",
        errors: {
          required: "Email è obbligatoria",
          invalid: "Email non valida",
        },
      },
      password: {
        label: "Password",
        set_password: "Imposta una password",
        placeholder: "Inserisci la password",
        confirm_password: {
          label: "Conferma password",
          placeholder: "Conferma password",
        },
        current_password: {
          label: "Password attuale",
        },
        new_password: {
          label: "Nuova password",
          placeholder: "Inserisci nuova password",
        },
        change_password: {
          label: {
            default: "Cambia password",
            submitting: "Cambiando password",
          },
        },
        errors: {
          match: "Le password non corrispondono",
          empty: "Per favore inserisci la tua password",
          length: "La lunghezza della password deve essere superiore a 8 caratteri",
          strength: {
            weak: "La password è debole",
            strong: "La password è forte",
          },
        },
        submit: "Imposta password",
        toast: {
          change_password: {
            success: {
              title: "Successo!",
              message: "Password cambiata con successo.",
            },
            error: {
              title: "Errore!",
              message: "Qualcosa è andato storto. Per favore riprova.",
            },
          },
        },
      },
      unique_code: {
        label: "Codice unico",
        placeholder: "123456",
        paste_code: "Incolla il codice inviato alla tua email",
        requesting_new_code: "Richiesta di nuovo codice",
        sending_code: "Invio codice",
      },
      already_have_an_account: "Hai già un account?",
      login: "Accedi",
      create_account: "Crea un account",
      new_to_plane: "Nuovo su Plane?",
      back_to_sign_in: "Torna al login",
      resend_in: "Reinvia in {seconds} secondi",
      sign_in_with_unique_code: "Accedi con codice unico",
      forgot_password: "Hai dimenticato la password?",
      username: {
        label: "Nome utente",
        placeholder: "Inserisci il tuo nome utente",
      },
    },
    sign_up: {
      header: {
        label: "Crea un account per iniziare a gestire il lavoro con il tuo team.",
        step: {
          email: {
            header: "Registrati",
            sub_header: "",
          },
          password: {
            header: "Registrati",
            sub_header: "Registrati utilizzando una combinazione email-password.",
          },
          unique_code: {
            header: "Registrati",
            sub_header: "Registrati utilizzando un codice unico inviato all'indirizzo email sopra.",
          },
        },
      },
      errors: {
        password: {
          strength: "Prova a impostare una password forte per procedere",
        },
      },
    },
    sign_in: {
      header: {
        label: "Accedi per iniziare a gestire il lavoro con il tuo team.",
        step: {
          email: {
            header: "Accedi o registrati",
            sub_header: "",
          },
          password: {
            header: "Accedi o registrati",
            sub_header: "Usa la tua combinazione email-password per accedere.",
          },
          unique_code: {
            header: "Accedi o registrati",
            sub_header: "Accedi utilizzando un codice unico inviato all'indirizzo email sopra.",
          },
        },
      },
    },
    forgot_password: {
      title: "Reimposta la tua password",
      description:
        "Inserisci l'indirizzo email verificato del tuo account utente e ti invieremo un link per reimpostare la password.",
      email_sent: "Abbiamo inviato il link di reimpostazione al tuo indirizzo email",
      send_reset_link: "Invia link di reimpostazione",
      errors: {
        smtp_not_enabled:
          "Vediamo che il tuo amministratore non ha abilitato SMTP, non saremo in grado di inviare un link di reimpostazione della password",
      },
      toast: {
        success: {
          title: "Email inviata",
          message:
            "Controlla la tua inbox per un link per reimpostare la tua password. Se non appare entro pochi minuti, controlla la tua cartella spam.",
        },
        error: {
          title: "Errore!",
          message: "Qualcosa è andato storto. Per favore riprova.",
        },
      },
    },
    reset_password: {
      title: "Imposta nuova password",
      description: "Proteggi il tuo account con una password forte",
    },
    set_password: {
      title: "Proteggi il tuo account",
      description: "Impostare una password ti aiuta a accedere in modo sicuro",
    },
    sign_out: {
      toast: {
        error: {
          title: "Errore!",
          message: "Impossibile disconnettersi. Per favore riprova.",
        },
      },
    },
    ldap: {
      header: {
        label: "Continua con {ldapProviderName}",
        sub_header: "Inserisci le tue credenziali {ldapProviderName}",
      },
    },
  },
  submit: "Conferma",
  cancel: "Annulla",
  loading: "Caricamento",
  error: "Errore",
  success: "Successo",
  warning: "Avviso",
  info: "Informazioni",
  close: "Chiudi",
  yes: "Sì",
  no: "No",
  ok: "OK",
  name: "Nome",
  description: "Descrizione",
  search: "Cerca",
  add_member: "Aggiungi membro",
  adding_members: "Aggiungendo membri",
  remove_member: "Rimuovi membro",
  add_members: "Aggiungi membri",
  adding_member: "Aggiungendo membro",
  remove_members: "Rimuovi membri",
  add: "Aggiungi",
  adding: "Aggiungendo",
  remove: "Rimuovi",
  add_new: "Aggiungi nuovo",
  remove_selected: "Rimuovi selezionati",
  first_name: "Nome",
  last_name: "Cognome",
  email: "Email",
  display_name: "Nome visualizzato",
  role: "Ruolo",
  timezone: "Fuso orario",
  avatar: "Avatar",
  cover_image: "Immagine di copertina",
  password: "Password",
  change_cover: "Cambia copertina",
  language: "Lingua",
  saving: "Salvataggio in corso",
  save_changes: "Salva modifiche",
  deactivate_account: "Disattiva account",
  deactivate_account_description:
    "Disattivando un account, tutti i dati e le risorse al suo interno verranno rimossi definitivamente e non potranno essere recuperati.",
  profile_settings: "Impostazioni del profilo",
  your_account: "Il tuo account",
  security: "Sicurezza",
  activity: "Attività",
  activity_empty_state: {
    no_activity: "Nessuna attività",
    no_transitions: "Nessuna transizione",
  },
  appearance: "Aspetto",
  notifications: "Notifiche",
  workspaces: "Spazi di lavoro",
  create_workspace: "Crea spazio di lavoro",
  invitations: "Inviti",
  summary: "Riepilogo",
  assigned: "Assegnato",
  created: "Creato",
  subscribed: "Iscritto",
  you_do_not_have_the_permission_to_access_this_page: "Non hai il permesso di accedere a questa pagina.",
  something_went_wrong_please_try_again: "Qualcosa è andato storto. Per favore, riprova.",
  load_more: "Carica di più",
  select_or_customize_your_interface_color_scheme: "Seleziona o personalizza il tuo schema di colori dell'interfaccia.",
  select_the_cursor_motion_style_that_feels_right_for_you:
    "Seleziona lo stile di movimento del cursore più adatto a te.",
  theme: "Tema",
  smooth_cursor: "Cursore fluido",
  system_preference: "Preferenza di sistema",
  light: "Chiaro",
  dark: "Scuro",
  light_contrast: "Contrasto elevato chiaro",
  dark_contrast: "Contrasto elevato scuro",
  custom: "Tema personalizzato",
  select_your_theme: "Seleziona il tuo tema",
  customize_your_theme: "Personalizza il tuo tema",
  background_color: "Colore di sfondo",
  text_color: "Colore del testo",
  primary_color: "Colore primario (Tema)",
  sidebar_background_color: "Colore di sfondo della barra laterale",
  sidebar_text_color: "Colore del testo della barra laterale",
  set_theme: "Imposta tema",
  enter_a_valid_hex_code_of_6_characters: "Inserisci un codice esadecimale valido di 6 caratteri",
  background_color_is_required: "Il colore di sfondo è obbligatorio",
  text_color_is_required: "Il colore del testo è obbligatorio",
  primary_color_is_required: "Il colore primario è obbligatorio",
  sidebar_background_color_is_required: "Il colore di sfondo della barra laterale è obbligatorio",
  sidebar_text_color_is_required: "Il colore del testo della barra laterale è obbligatorio",
  updating_theme: "Aggiornamento del tema in corso",
  theme_updated_successfully: "Tema aggiornato con successo",
  failed_to_update_the_theme: "Impossibile aggiornare il tema",
  email_notifications: "Notifiche via email",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "Rimani aggiornato sugli elementi di lavoro a cui sei iscritto. Abilita questa opzione per ricevere notifiche.",
  email_notification_setting_updated_successfully: "Impostazioni delle notifiche email aggiornate con successo",
  failed_to_update_email_notification_setting: "Impossibile aggiornare le impostazioni delle notifiche email",
  notify_me_when: "Avvisami quando",
  property_changes: "Modifiche alle proprietà",
  property_changes_description:
    "Avvisami quando le proprietà degli elementi di lavoro, come assegnatari, priorità, stime o altro, cambiano.",
  state_change: "Cambio di stato",
  state_change_description: "Avvisami quando l'elemento di lavoro passa a uno stato diverso",
  issue_completed: "Elemento di lavoro completato",
  issue_completed_description: "Avvisami solo quando un elemento di lavoro è completato",
  comments: "Commenti",
  comments_description: "Avvisami quando qualcuno lascia un commento sull'elemento di lavoro",
  mentions: "Menzioni",
  mentions_description: "Avvisami solo quando qualcuno mi menziona nei commenti o nella descrizione",
  old_password: "Vecchia password",
  general_settings: "Impostazioni generali",
  sign_out: "Esci",
  signing_out: "Uscita in corso",
  active_cycles: "Cicli attivi",
  active_cycles_description:
    "Monitora i cicli attraverso i progetti, segui gli elementi di lavoro ad alta priorità e analizza i cicli che necessitano attenzione.",
  on_demand_snapshots_of_all_your_cycles: "Snapshot on-demand di tutti i tuoi cicli",
  upgrade: "Aggiorna",
  "10000_feet_view": "Vista panoramica (10.000 piedi) di tutti i cicli attivi.",
  "10000_feet_view_description":
    "Effettua uno zoom indietro per vedere i cicli in esecuzione in tutti i tuoi progetti contemporaneamente, invece di passare da un ciclo all'altro in ogni progetto.",
  get_snapshot_of_each_active_cycle: "Ottieni uno snapshot di ogni ciclo attivo.",
  get_snapshot_of_each_active_cycle_description:
    "Monitora metriche di alto livello per tutti i cicli attivi, osserva il loro stato di avanzamento e valuta la portata rispetto alle scadenze.",
  compare_burndowns: "Confronta i burndown.",
  compare_burndowns_description:
    "Monitora le prestazioni di ciascun team con una rapida occhiata al report del burndown di ogni ciclo.",
  quickly_see_make_or_break_issues: "Visualizza rapidamente gli elementi di lavoro critici.",
  quickly_see_make_or_break_issues_description:
    "Visualizza in anteprima gli elementi di lavoro ad alta priorità per ogni ciclo in base alle scadenze. Vedi tutti con un solo clic.",
  zoom_into_cycles_that_need_attention: "Zoom sui cicli che richiedono attenzione.",
  zoom_into_cycles_that_need_attention_description:
    "Esamina lo stato di ogni ciclo che non rispetta le aspettative con un clic.",
  stay_ahead_of_blockers: "Anticipa gli ostacoli.",
  stay_ahead_of_blockers_description:
    "Individua le sfide tra i progetti e visualizza le dipendenze inter-cicliche non evidenti in altre viste.",
  analytics: "Analisi",
  workspace_invites: "Inviti allo spazio di lavoro",
  enter_god_mode: "Entra in modalità dio",
  workspace_logo: "Logo dello spazio di lavoro",
  new_issue: "Nuovo elemento di lavoro",
  your_work: "Il tuo lavoro",
  drafts: "Bozze",
  projects: "Progetti",
  views: "Visualizzazioni",
  archives: "Archivi",
  settings: "Impostazioni",
  failed_to_move_favorite: "Impossibile spostare il preferito",
  favorites: "Preferiti",
  no_favorites_yet: "Nessun preferito ancora",
  create_folder: "Crea cartella",
  new_folder: "Nuova cartella",
  favorite_updated_successfully: "Preferito aggiornato con successo",
  favorite_created_successfully: "Preferito creato con successo",
  folder_already_exists: "La cartella esiste già",
  folder_name_cannot_be_empty: "Il nome della cartella non può essere vuoto",
  something_went_wrong: "Qualcosa è andato storto",
  failed_to_reorder_favorite: "Impossibile riordinare il preferito",
  favorite_removed_successfully: "Preferito rimosso con successo",
  failed_to_create_favorite: "Impossibile creare il preferito",
  failed_to_rename_favorite: "Impossibile rinominare il preferito",
  project_link_copied_to_clipboard: "Link del progetto copiato negli appunti",
  link_copied: "Link copiato",
  add_project: "Aggiungi progetto",
  create_project: "Crea progetto",
  failed_to_remove_project_from_favorites: "Impossibile rimuovere il progetto dai preferiti. Per favore, riprova.",
  project_created_successfully: "Progetto creato con successo",
  project_created_successfully_description:
    "Progetto creato con successo. Ora puoi iniziare ad aggiungere elementi di lavoro.",
  project_name_already_taken: "Il nome del progetto è già stato utilizzato.",
  project_identifier_already_taken: "L'identificatore del progetto è già stato utilizzato.",
  project_cover_image_alt: "Immagine di copertina del progetto",
  name_is_required: "Il nome è obbligatorio",
  title_should_be_less_than_255_characters: "Il titolo deve contenere meno di 255 caratteri",
  project_name: "Nome del progetto",
  project_id_must_be_at_least_1_character: "L'ID del progetto deve contenere almeno 1 carattere",
  project_id_must_be_at_most_5_characters: "L'ID del progetto deve contenere al massimo 5 caratteri",
  project_id: "ID del progetto",
  project_id_tooltip_content:
    "Ti aiuta a identificare in modo univoco gli elementi di lavoro nel progetto. Massimo 50 caratteri.",
  description_placeholder: "Descrizione",
  only_alphanumeric_non_latin_characters_allowed: "Sono ammessi solo caratteri alfanumerici e non latini.",
  project_id_is_required: "L'ID del progetto è obbligatorio",
  project_id_allowed_char: "Sono ammessi solo caratteri alfanumerici e non latini.",
  project_id_min_char: "L'ID del progetto deve contenere almeno 1 carattere",
  project_id_max_char: "L'ID del progetto deve contenere al massimo {max} caratteri",
  project_description_placeholder: "Inserisci la descrizione del progetto",
  select_network: "Seleziona rete",
  lead: "Responsabile",
  date_range: "Intervallo di date",
  private: "Privato",
  public: "Pubblico",
  accessible_only_by_invite: "Accessibile solo su invito",
  anyone_in_the_workspace_except_guests_can_join: "Chiunque nello spazio di lavoro, tranne gli ospiti, può unirsi",
  creating: "Creazione in corso",
  creating_project: "Creazione del progetto in corso",
  adding_project_to_favorites: "Aggiunta del progetto ai preferiti in corso",
  project_added_to_favorites: "Progetto aggiunto ai preferiti",
  couldnt_add_the_project_to_favorites: "Impossibile aggiungere il progetto ai preferiti. Per favore, riprova.",
  removing_project_from_favorites: "Rimozione del progetto dai preferiti in corso",
  project_removed_from_favorites: "Progetto rimosso dai preferiti",
  couldnt_remove_the_project_from_favorites: "Impossibile rimuovere il progetto dai preferiti. Per favore, riprova.",
  add_to_favorites: "Aggiungi ai preferiti",
  remove_from_favorites: "Rimuovi dai preferiti",
  publish_project: "Pubblica progetto",
  publish: "Pubblica",
  copy_link: "Copia link",
  leave_project: "Lascia progetto",
  join_the_project_to_rearrange: "Unisciti al progetto per riorganizzare",
  drag_to_rearrange: "Trascina per riorganizzare",
  congrats: "Congratulazioni!",
  open_project: "Apri progetto",
  issues: "Elementi di lavoro",
  cycles: "Cicli",
  modules: "Moduli",
  pages: {
    link_pages: "Connetti pagine",
    show_wiki_pages: "Mostra pagine wiki",
    link_pages_to: "Connetti pagine a",
    linked_pages: "Pagine collegate",
    no_description: "Questa pagina è vuota. Scrivi qualcosa e vedi qui come questo segnaposto",
    toasts: {
      link: {
        success: {
          title: "Pagine aggiornate",
          message: "Le pagine sono state aggiornate con successo",
        },
        error: {
          title: "Pagine non aggiornate",
          message: "Le pagine non possono essere aggiornate",
        },
      },
      remove: {
        success: {
          title: "Pagina eliminata",
          message: "La pagina è stata eliminata con successo",
        },
        error: {
          title: "Pagina non eliminata",
          message: "La pagina non può essere eliminata",
        },
      },
    },
  },
  intake: "Accoglienza",
  renew: "Rinnova",
  preview: "Anteprima",
  time_tracking: "Tracciamento del tempo",
  work_management: "Gestione del lavoro",
  projects_and_issues: "Progetti ed elementi di lavoro",
  projects_and_issues_description: "Attiva o disattiva queste opzioni per questo progetto.",
  cycles_description:
    "Definisci il tempo di lavoro per progetto e adatta il periodo secondo necessità. Un ciclo può durare 2 settimane, il successivo 1 settimana.",
  modules_description: "Organizza il lavoro in sotto-progetti con responsabili e assegnatari dedicati.",
  views_description:
    "Salva ordinamenti, filtri e opzioni di visualizzazione personalizzati o condividili con il tuo team.",
  pages_description: "Crea e modifica contenuti liberi: appunti, documenti, qualsiasi cosa.",
  intake_description:
    "Consenti ai non membri di segnalare bug, feedback e suggerimenti senza interrompere il tuo flusso di lavoro.",
  time_tracking_description: "Registra il tempo trascorso su elementi di lavoro e progetti.",
  work_management_description: "Gestisci il tuo lavoro e i tuoi progetti con facilità.",
  documentation: "Documentazione",
  message_support: "Contatta il supporto",
  contact_sales: "Contatta le vendite",
  hyper_mode: "Modalità Hyper",
  keyboard_shortcuts: "Scorciatoie da tastiera",
  whats_new: "Novità?",
  version: "Versione",
  we_are_having_trouble_fetching_the_updates: "Stiamo riscontrando problemi nel recuperare gli aggiornamenti.",
  our_changelogs: "i nostri changelog",
  for_the_latest_updates: "per gli ultimi aggiornamenti.",
  please_visit: "Per favore visita",
  docs: "Documentazione",
  full_changelog: "Changelog completo",
  support: "Supporto",
  forum: "Forum",
  powered_by_plane_pages: "Supportato da Plane Pages",
  please_select_at_least_one_invitation: "Seleziona almeno un invito.",
  please_select_at_least_one_invitation_description: "Seleziona almeno un invito per unirti allo spazio di lavoro.",
  we_see_that_someone_has_invited_you_to_join_a_workspace:
    "Abbiamo notato che qualcuno ti ha invitato a unirti a uno spazio di lavoro",
  join_a_workspace: "Unisciti a uno spazio di lavoro",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description:
    "Abbiamo notato che qualcuno ti ha invitato a unirti a uno spazio di lavoro",
  join_a_workspace_description: "Unisciti a uno spazio di lavoro",
  accept_and_join: "Accetta e unisciti",
  go_home: "Vai alla home",
  no_pending_invites: "Nessun invito in sospeso",
  you_can_see_here_if_someone_invites_you_to_a_workspace:
    "Qui puoi vedere se qualcuno ti invita a uno spazio di lavoro",
  back_to_home: "Torna alla home",
  workspace_name: "nome-spazio-di-lavoro",
  deactivate_your_account: "Disattiva il tuo account",
  deactivate_your_account_description:
    "Una volta disattivato, non potrai più essere assegnato a elementi di lavoro né addebitato per il tuo spazio di lavoro. Per riattivare il tuo account, avrai bisogno di un invito a uno spazio di lavoro associato a questo indirizzo email.",
  deactivating: "Disattivazione in corso",
  confirm: "Conferma",
  confirming: "Conferma in corso",
  draft_created: "Bozza creata",
  issue_created_successfully: "Elemento di lavoro creato con successo",
  draft_creation_failed: "Creazione della bozza fallita",
  issue_creation_failed: "Creazione dell'elemento di lavoro fallita",
  draft_issue: "Bozza di elemento di lavoro",
  issue_updated_successfully: "Elemento di lavoro aggiornato con successo",
  issue_could_not_be_updated: "Impossibile aggiornare l'elemento di lavoro",
  create_a_draft: "Crea una bozza",
  save_to_drafts: "Salva nelle bozze",
  save: "Salva",
  update: "Aggiorna",
  updating: "Aggiornamento in corso",
  create_new_issue: "Crea un nuovo elemento di lavoro",
  editor_is_not_ready_to_discard_changes: "L'editor non è pronto per scartare le modifiche",
  failed_to_move_issue_to_project: "Impossibile spostare l'elemento di lavoro nel progetto",
  create_more: "Crea altri",
  add_to_project: "Aggiungi al progetto",
  discard: "Scarta",
  duplicate_issue_found: "Elemento di lavoro duplicato trovato",
  duplicate_issues_found: "Elementi di lavoro duplicati trovati",
  no_matching_results: "Nessun risultato corrispondente",
  title_is_required: "Il titolo è obbligatorio",
  title: "Titolo",
  state: "Stato",
  transition: "Transizione",
  history: "Cronologia",
  priority: "Priorità",
  none: "Nessuna",
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Bassa",
  members: "Membri",
  assignee: "Assegnatario",
  assignees: "Assegnatari",
  subscriber: "{count, plural, one{# Iscritto} other{# Iscritti}}",
  you: "Tu",
  labels: "Etichette",
  create_new_label: "Crea nuova etichetta",
  label_name: "Nome etichetta",
  failed_to_create_label: "Impossibile creare l'etichetta. Riprova.",
  start_date: "Data di inizio",
  end_date: "Data di fine",
  due_date: "Scadenza",
  estimate: "Stima",
  change_parent_issue: "Cambia elemento di lavoro principale",
  remove_parent_issue: "Rimuovi elemento di lavoro principale",
  add_parent: "Aggiungi elemento principale",
  loading_members: "Caricamento membri",
  view_link_copied_to_clipboard: "Link di visualizzazione copiato negli appunti.",
  required: "Obbligatorio",
  optional: "Opzionale",
  Cancel: "Annulla",
  edit: "Modifica",
  archive: "Archivia",
  restore: "Ripristina",
  open_in_new_tab: "Apri in una nuova scheda",
  delete: "Elimina",
  deleting: "Eliminazione in corso",
  make_a_copy: "Crea una copia",
  move_to_project: "Sposta nel progetto",
  good: "Buono",
  morning: "Mattina",
  afternoon: "Pomeriggio",
  evening: "Sera",
  show_all: "Mostra tutto",
  show_less: "Mostra meno",
  no_data_yet: "Nessun dato disponibile",
  syncing: "Sincronizzazione in corso",
  add_work_item: "Aggiungi elemento di lavoro",
  advanced_description_placeholder: "Premi '/' per i comandi",
  create_work_item: "Crea elemento di lavoro",
  attachments: "Allegati",
  declining: "Rifiuto in corso",
  declined: "Rifiutato",
  decline: "Rifiuta",
  unassigned: "Non assegnato",
  work_items: "Elementi di lavoro",
  add_link: "Aggiungi link",
  points: "Punti",
  no_assignee: "Nessun assegnatario",
  no_assignees_yet: "Nessun assegnatario ancora",
  no_labels_yet: "Nessuna etichetta ancora",
  ideal: "Ideale",
  current: "Corrente",
  no_matching_members: "Nessun membro corrispondente",
  leaving: "Uscita in corso",
  removing: "Rimozione in corso",
  leave: "Esci",
  refresh: "Aggiorna",
  refreshing: "Aggiornamento in corso",
  refresh_status: "Stato dell'aggiornamento",
  prev: "Precedente",
  next: "Successivo",
  re_generating: "Rigenerazione in corso",
  re_generate: "Rigenera",
  re_generate_key: "Rigenera chiave",
  export: "Esporta",
  member: "{count, plural, one {# membro} other {# membri}}",
  new_password_must_be_different_from_old_password: "La nuova password deve essere diversa dalla password precedente",
  edited: "Modificato",
  bot: "Bot",
  project_view: {
    sort_by: {
      created_at: "Creato il",
      updated_at: "Aggiornato il",
      name: "Nome",
    },
  },
  upgrade_request: "Chiedi all'admin dello spazio di lavoro di effettuare l'upgrade.",
  copied_to_clipboard: "Copiato negli appunti",
  copied_to_clipboard_description: "L'URL è stato copiato con successo negli appunti",
  toast: {
    success: "Successo!",
    error: "Errore!",
  },
  links: {
    toasts: {
      created: {
        title: "Link creato",
        message: "Il link è stato creato con successo",
      },
      not_created: {
        title: "Link non creato",
        message: "Il link non può essere creato",
      },
      updated: {
        title: "Link aggiornato",
        message: "Il link è stato aggiornato con successo",
      },
      not_updated: {
        title: "Link non aggiornato",
        message: "Il link non può essere aggiornato",
      },
      removed: {
        title: "Link rimosso",
        message: "Il link è stato rimosso con successo",
      },
      not_removed: {
        title: "Link non rimosso",
        message: "Il link non può essere rimosso",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "La tua guida rapida",
      not_right_now: "Non ora",
      create_project: {
        title: "Crea un progetto",
        description: "La maggior parte delle cose inizia con un progetto in Plane.",
        cta: "Inizia",
      },
      invite_team: {
        title: "Invita il tuo team",
        description: "Collabora, lancia e gestisci insieme ai colleghi.",
        cta: "Invitali",
      },
      configure_workspace: {
        title: "Configura il tuo spazio di lavoro.",
        description: "Attiva o disattiva le funzionalità o personalizza ulteriormente.",
        cta: "Configura questo spazio",
      },
      personalize_account: {
        title: "Rendi Plane tuo.",
        description: "Scegli la tua immagine, i colori e altro.",
        cta: "Personalizza ora",
      },
      widgets: {
        title: "È silenzioso senza widget, attivali",
        description: "Sembra che tutti i tuoi widget siano disattivati. Attivali ora per migliorare la tua esperienza!",
        primary_button: {
          text: "Gestisci widget",
        },
      },
    },
    quick_links: {
      empty: "Salva link a elementi di lavoro che ti servono.",
      add: "Aggiungi link rapido",
      title: "Link rapido",
      title_plural: "Link rapidi",
    },
    recents: {
      title: "Recenti",
      empty: {
        project: "I tuoi progetti recenti appariranno qui una volta visitati.",
        page: "Le tue pagine recenti appariranno qui una volta visitate.",
        issue: "I tuoi elementi di lavoro recenti appariranno qui una volta visitati.",
        default: "Non hai ancora elementi recenti.",
      },
      filters: {
        all: "Tutti",
        projects: "Progetti",
        pages: "Pagine",
        issues: "Elementi di lavoro",
      },
    },
    new_at_plane: {
      title: "Novità su Plane",
    },
    quick_tutorial: {
      title: "Tutorial rapido",
    },
    widget: {
      reordered_successfully: "Widget riordinato con successo.",
      reordering_failed: "Si è verificato un errore durante il riordino del widget.",
    },
    manage_widgets: "Gestisci widget",
    title: "Home",
    star_us_on_github: "Metti una stella su GitHub",
    business_trial_banner: {
      title: "Il tuo periodo di prova di 14 giorni del piano Business è attivo!",
      description:
        "Esplora tutte le funzionalità Business. Quando sei pronto, scegli di abbonarti. Non ti verrà addebitato automaticamente.",
      trial_ends_today: "La prova scade oggi",
      trial_ends_in_days: "La prova scade tra {days, plural, one {# giorno} other {# giorni}}",
      start_subscription: "Avvia abbonamento",
      explore_business_features: "Esplora funzionalità Business",
    },
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "L'URL non è valido",
        placeholder: "Digita o incolla un URL",
      },
      title: {
        text: "Titolo di visualizzazione",
        placeholder: "Come vorresti che apparisse questo link",
      },
    },
  },
  common: {
    all: "Tutti",
    no_items_in_this_group: "Nessun elemento in questo gruppo",
    drop_here_to_move: "Rilascia qui per spostare",
    states: "Stati",
    state: "Stato",
    state_groups: "Gruppi di stati",
    priority: "Priorità",
    team_project: "Progetto di squadra",
    project: "Progetto",
    cycle: "Ciclo",
    cycles: "Cicli",
    module: "Modulo",
    modules: "Moduli",
    labels: "Etichette",
    assignees: "Assegnatari",
    assignee: "Assegnatario",
    created_by: "Creato da",
    none: "Nessuno",
    link: "Link",
    estimate: "Stima",
    created_at: "Creato il",
    updated_at: "Aggiornato il",
    completed_at: "Completato il",
    layout: "Layout",
    filters: "Filtri",
    display: "Visualizza",
    load_more: "Carica di più",
    activity: "Attività",
    analytics: "Analisi",
    dates: "Date",
    success: "Successo!",
    something_went_wrong: "Qualcosa è andato storto",
    error: {
      label: "Errore!",
      message: "Si è verificato un errore. Per favore, riprova.",
    },
    group_by: "Raggruppa per",
    epic: "Epic",
    epics: "Epiche",
    work_item: "Elemento di lavoro",
    work_items: "Elementi di lavoro",
    sub_work_item: "Sotto-elemento di lavoro",
    add: "Aggiungi",
    warning: "Avviso",
    updating: "Aggiornamento in corso",
    adding: "Aggiunta in corso",
    update: "Aggiorna",
    creating: "Creazione in corso",
    create: "Crea",
    cancel: "Annulla",
    description: "Descrizione",
    title: "Titolo",
    attachment: "Allegato",
    general: "Generale",
    features: "Funzionalità",
    automation: "Automazione",
    project_name: "Nome del progetto",
    project_id: "ID del progetto",
    project_timezone: "Fuso orario del progetto",
    created_on: "Creato il",
    update_project: "Aggiorna progetto",
    identifier_already_exists: "L'identificatore esiste già",
    add_more: "Aggiungi altro",
    defaults: "Predefiniti",
    add_label: "Aggiungi etichetta",
    estimates: "Stime",
    customize_time_range: "Personalizza intervallo di tempo",
    loading: "Caricamento",
    attachments: "Allegati",
    property: "Proprietà",
    properties: "Proprietà",
    parent: "Principale",
    page: "Pagina",
    remove: "Rimuovi",
    archiving: "Archiviazione in corso",
    archive: "Archivia",
    access: {
      public: "Pubblico",
      private: "Privato",
    },
    done: "Fatto",
    sub_work_items: "Sotto-elementi di lavoro",
    comment: "Commento",
    workspace_level: "Livello dello spazio di lavoro",
    order_by: {
      label: "Ordina per",
      manual: "Manuale",
      last_created: "Ultimo creato",
      last_updated: "Ultimo aggiornato",
      start_date: "Data di inizio",
      due_date: "Scadenza",
      asc: "Ascendente",
      desc: "Discendente",
      updated_on: "Aggiornato il",
    },
    sort: {
      asc: "Ascendente",
      desc: "Discendente",
      created_on: "Creato il",
      updated_on: "Aggiornato il",
    },
    comments: "Commenti",
    updates: "Aggiornamenti",
    additional_updates: "Aggiornamenti aggiuntivi",
    clear_all: "Pulisci tutto",
    copied: "Copiato!",
    link_copied: "Link copiato!",
    link_copied_to_clipboard: "Link copiato negli appunti",
    copied_to_clipboard: "Link dell'elemento di lavoro copiato negli appunti",
    branch_name_copied_to_clipboard: "Nome del branch copiato negli appunti",
    is_copied_to_clipboard: "Elemento di lavoro copiato negli appunti",
    no_links_added_yet: "Nessun link aggiunto ancora",
    add_link: "Aggiungi link",
    links: "Link",
    go_to_workspace: "Vai allo spazio di lavoro",
    progress: "Progresso",
    optional: "Opzionale",
    join: "Unisciti",
    go_back: "Torna indietro",
    continue: "Continua",
    resend: "Reinvia",
    relations: "Relazioni",
    errors: {
      default: {
        title: "Errore!",
        message: "Qualcosa è andato storto. Per favore, riprova.",
      },
      required: "Questo campo è obbligatorio",
      entity_required: "{entity} è obbligatorio",
      restricted_entity: "{entity} è limitato",
    },
    update_link: "Aggiorna link",
    attach: "Allega",
    create_new: "Crea nuovo",
    add_existing: "Aggiungi esistente",
    type_or_paste_a_url: "Digita o incolla un URL",
    url_is_invalid: "L'URL non è valido",
    display_title: "Titolo di visualizzazione",
    link_title_placeholder: "Come vorresti vedere questo link",
    url: "URL",
    side_peek: "Visualizzazione laterale",
    modal: "Modal",
    full_screen: "Schermo intero",
    close_peek_view: "Chiudi la visualizzazione rapida",
    toggle_peek_view_layout: "Alterna layout della visualizzazione rapida",
    options: "Opzioni",
    duration: "Durata",
    today: "Oggi",
    week: "Settimana",
    month: "Mese",
    quarter: "Trimestre",
    press_for_commands: "Premi '/' per i comandi",
    click_to_add_description: "Clicca per aggiungere una descrizione",
    search: {
      label: "Cerca",
      placeholder: "Digita per cercare",
      no_matches_found: "Nessuna corrispondenza trovata",
      no_matching_results: "Nessun risultato corrispondente",
    },
    actions: {
      edit: "Modifica",
      make_a_copy: "Crea una copia",
      open_in_new_tab: "Apri in una nuova scheda",
      copy_link: "Copia link",
      copy_branch_name: "Copia nome del branch",
      archive: "Archivia",
      restore: "Ripristina",
      delete: "Elimina",
      remove_relation: "Rimuovi relazione",
      subscribe: "Iscriviti",
      unsubscribe: "Annulla iscrizione",
      clear_sorting: "Cancella ordinamento",
      show_weekends: "Mostra weekend",
      enable: "Abilita",
      disable: "Disabilita",
    },
    name: "Nome",
    discard: "Scarta",
    confirm: "Conferma",
    confirming: "Conferma in corso",
    read_the_docs: "Leggi la documentazione",
    default: "Predefinito",
    active: "Attivo",
    enabled: "Abilitato",
    disabled: "Disabilitato",
    mandate: "Obbligo",
    mandatory: "Obbligatorio",
    yes: "Sì",
    no: "No",
    please_wait: "Attendere prego",
    enabling: "Abilitazione in corso",
    disabling: "Disabilitazione in corso",
    beta: "Beta",
    or: "o",
    next: "Successivo",
    back: "Indietro",
    cancelling: "Annullamento in corso",
    configuring: "Configurazione in corso",
    clear: "Pulisci",
    import: "Importa",
    connect: "Connetti",
    authorizing: "Autorizzazione in corso",
    processing: "Elaborazione in corso",
    no_data_available: "Nessun dato disponibile",
    from: "da {name}",
    authenticated: "Autenticato",
    select: "Seleziona",
    upgrade: "Aggiorna",
    add_seats: "Aggiungi postazioni",
    label: "Etichetta",
    priorities: "Priorità",
    projects: "Progetti",
    workspace: "Spazio di lavoro",
    workspaces: "Spazi di lavoro",
    team: "Team",
    teams: "Team",
    entity: "Entità",
    entities: "Entità",
    task: "Attività",
    tasks: "Attività",
    section: "Sezione",
    sections: "Sezioni",
    edit: "Modifica",
    connecting: "Connessione in corso",
    connected: "Connesso",
    disconnect: "Disconnetti",
    disconnecting: "Disconnessione in corso",
    installing: "Installazione in corso",
    install: "Installa",
    reset: "Reimposta",
    live: "Live",
    change_history: "Cronologia modifiche",
    coming_soon: "Prossimamente",
    member: "Membro",
    members: "Membri",
    you: "Tu",
    upgrade_cta: {
      higher_subscription: "Passa a un abbonamento superiore",
      talk_to_sales: "Parla con le vendite",
    },
    category: "Categoria",
    categories: "Categorie",
    saving: "Salvataggio in corso",
    save_changes: "Salva modifiche",
    delete: "Elimina",
    deleting: "Eliminazione in corso",
    pending: "In sospeso",
    invite: "Invita",
    view: "Visualizza",
    deactivated_user: "Utente disattivato",
    apply: "Applica",
    applying: "Applicazione",
    users: "Utenti",
    admins: "Amministratori",
    guests: "Ospiti",
    on_track: "In linea",
    off_track: "Fuori rotta",
    at_risk: "A rischio",
    timeline: "Cronologia",
    completion: "Completamento",
    upcoming: "In arrivo",
    completed: "Completato",
    in_progress: "In corso",
    planned: "Pianificato",
    paused: "In pausa",
    no_of: "N. di {entity}",
    resolved: "Risolto",
    worklogs: "Registrazioni di lavoro",
    project_updates: "Aggiornamenti del progetto",
    overview: "Panoramica",
    workflows: "Flussi di lavoro",
    members_and_teamspaces: "Membri e teamspaces",
    open_in_full_screen: "Apri {page} a schermo intero",
  },
  chart: {
    x_axis: "Asse X",
    y_axis: "Asse Y",
    metric: "Metrica",
  },
  form: {
    title: {
      required: "Il titolo è obbligatorio",
      max_length: "Il titolo deve contenere meno di {length} caratteri",
    },
  },
  entity: {
    grouping_title: "Raggruppamento di {entity}",
    priority: "Priorità di {entity}",
    all: "Tutti {entity}",
    drop_here_to_move: "Trascina qui per spostare il {entity}",
    delete: {
      label: "Elimina {entity}",
      success: "{entity} eliminato con successo",
      failed: "Eliminazione di {entity} fallita",
    },
    update: {
      failed: "Aggiornamento di {entity} fallito",
      success: "{entity} aggiornato con successo",
    },
    link_copied_to_clipboard: "Link di {entity} copiato negli appunti",
    fetch: {
      failed: "Errore durante il recupero di {entity}",
    },
    add: {
      success: "{entity} aggiunto con successo",
      failed: "Errore nell'aggiunta di {entity}",
    },
    remove: {
      success: "{entity} rimosso con successo",
      failed: "Errore nella rimozione di {entity}",
    },
  },
  epic: {
    all: "Tutti gli Epic",
    label: "{count, plural, one {Epic} other {Epic}}",
    new: "Nuovo Epic",
    adding: "Aggiungendo Epic",
    create: {
      success: "Epic creato con successo",
    },
    add: {
      press_enter: "Premi 'Invio' per aggiungere un altro Epic",
      label: "Aggiungi Epic",
    },
    title: {
      label: "Titolo Epic",
      required: "Il titolo dell'Epic è obbligatorio.",
    },
    archive: {
      description: `Solo gli epic completati o annullati
possono essere archiviati`,
      label: "Archivia Epic",
      confirm_message:
        "Sei sicuro di voler archiviare l'epic? Tutti i tuoi epic archiviati possono essere ripristinati in seguito.",
      success: {
        label: "Archiviazione riuscita",
        message: "I tuoi archivi si trovano negli archivi del progetto.",
      },
      failed: {
        message: "Impossibile archiviare l'epic. Riprova.",
      },
    },
  },
  issue: {
    label: "{count, plural, one {Elemento di lavoro} other {Elementi di lavoro}}",
    all: "Tutti gli elementi di lavoro",
    edit: "Modifica elemento di lavoro",
    title: {
      label: "Titolo dell'elemento di lavoro",
      required: "Il titolo dell'elemento di lavoro è obbligatorio.",
    },
    add: {
      press_enter: "Premi 'Invio' per aggiungere un altro elemento di lavoro",
      label: "Aggiungi elemento di lavoro",
      cycle: {
        failed: "Impossibile aggiungere l'elemento di lavoro al ciclo. Per favore, riprova.",
        success: "{count, plural, one {Elemento di lavoro} other {Elementi di lavoro}} aggiunto al ciclo con successo.",
        loading: "Aggiungendo {count, plural, one {elemento di lavoro} other {elementi di lavoro}} al ciclo",
      },
      assignee: "Aggiungi assegnatari",
      start_date: "Aggiungi data di inizio",
      due_date: "Aggiungi scadenza",
      parent: "Aggiungi elemento di lavoro principale",
      sub_issue: "Aggiungi sotto-elemento di lavoro",
      relation: "Aggiungi relazione",
      link: "Aggiungi link",
      existing: "Aggiungi elemento di lavoro esistente",
    },
    remove: {
      label: "Rimuovi elemento di lavoro",
      cycle: {
        loading: "Rimuovendo l'elemento di lavoro dal ciclo",
        success: "Elemento di lavoro rimosso dal ciclo con successo.",
        failed: "Impossibile rimuovere l'elemento di lavoro dal ciclo. Per favore, riprova.",
      },
      module: {
        loading: "Rimuovendo l'elemento di lavoro dal modulo",
        success: "Elemento di lavoro rimosso dal modulo con successo.",
        failed: "Impossibile rimuovere l'elemento di lavoro dal modulo. Per favore, riprova.",
      },
      parent: {
        label: "Rimuovi elemento di lavoro principale",
      },
    },
    new: "Nuovo elemento di lavoro",
    adding: "Aggiunta dell'elemento di lavoro in corso",
    create: {
      success: "Elemento di lavoro creato con successo",
    },
    priority: {
      urgent: "Urgente",
      high: "Alta",
      medium: "Media",
      low: "Bassa",
    },
    display: {
      properties: {
        label: "Visualizza proprietà",
        id: "ID",
        issue_type: "Tipo di elemento di lavoro",
        sub_issue_count: "Numero di sotto-elementi di lavoro",
        attachment_count: "Numero di allegati",
        created_on: "Creato il",
        sub_issue: "Sotto-elemento di lavoro",
        work_item_count: "Conteggio degli elementi di lavoro",
      },
      extra: {
        show_sub_issues: "Mostra sotto-elementi di lavoro",
        show_empty_groups: "Mostra gruppi vuoti",
      },
    },
    layouts: {
      ordered_by_label: "Questo layout è ordinato per",
      list: "Lista",
      kanban: "Schede",
      calendar: "Calendario",
      spreadsheet: "Tabella",
      gantt: "Timeline",
      title: {
        list: "Layout a lista",
        kanban: "Layout a schede",
        calendar: "Layout a calendario",
        spreadsheet: "Layout a tabella",
        gantt: "Layout a timeline",
      },
    },
    states: {
      active: "Attivo",
      backlog: "Backlog",
    },
    comments: {
      placeholder: "Aggiungi commento",
      switch: {
        private: "Passa a commento privato",
        public: "Passa a commento pubblico",
      },
      create: {
        success: "Commento creato con successo",
        error: "Creazione del commento fallita. Per favore, riprova più tardi.",
      },
      update: {
        success: "Commento aggiornato con successo",
        error: "Aggiornamento del commento fallito. Per favore, riprova più tardi.",
      },
      remove: {
        success: "Commento rimosso con successo",
        error: "Rimozione del commento fallita. Per favore, riprova più tardi.",
      },
      upload: {
        error: "Caricamento dell'asset fallito. Per favore, riprova più tardi.",
      },
      copy_link: {
        success: "Link del commento copiato negli appunti",
        error: "Errore durante la copia del link del commento. Riprova più tardi.",
      },
    },
    empty_state: {
      issue_detail: {
        title: "L'elemento di lavoro non esiste",
        description: "L'elemento di lavoro che stai cercando non esiste, è stato archiviato o eliminato.",
        primary_button: {
          text: "Visualizza altri elementi di lavoro",
        },
      },
    },
    sibling: {
      label: "Elementi di lavoro correlati",
    },
    archive: {
      description: "Solo gli elementi di lavoro completati o annullati possono essere archiviati",
      label: "Archivia elemento di lavoro",
      confirm_message:
        "Sei sicuro di voler archiviare l'elemento di lavoro? Tutti gli elementi di lavoro archiviati possono essere ripristinati in seguito.",
      success: {
        label: "Archiviazione riuscita",
        message: "I tuoi archivi sono disponibili negli archivi del progetto.",
      },
      failed: {
        message: "Impossibile archiviare l'elemento di lavoro. Per favore, riprova.",
      },
    },
    restore: {
      success: {
        title: "Ripristino riuscito",
        message: "Il tuo elemento di lavoro è disponibile negli elementi del progetto.",
      },
      failed: {
        message: "Impossibile ripristinare l'elemento di lavoro. Per favore, riprova.",
      },
    },
    relation: {
      relates_to: "Collegato a",
      duplicate: "Duplicato di",
      blocked_by: "Bloccato da",
      blocking: "Blocca",
      start_before: "Inizia prima",
      start_after: "Inizia dopo",
      finish_before: "Finisce prima",
      finish_after: "Finisce dopo",
      implements: "Implementa",
      implemented_by: "Implementato da",
    },
    copy_link: "Copia link dell'elemento di lavoro",
    delete: {
      label: "Elimina elemento di lavoro",
      error: "Errore nell'eliminazione dell'elemento di lavoro",
    },
    subscription: {
      actions: {
        subscribed: "Iscrizione all'elemento di lavoro avvenuta con successo",
        unsubscribed: "Disiscrizione dall'elemento di lavoro avvenuta con successo",
      },
    },
    select: {
      error: "Seleziona almeno un elemento di lavoro",
      empty: "Nessun elemento di lavoro selezionato",
      add_selected: "Aggiungi gli elementi di lavoro selezionati",
      select_all: "Seleziona tutto",
      deselect_all: "Deseleziona tutto",
    },
    open_in_full_screen: "Apri l'elemento di lavoro a schermo intero",
    vote: {
      click_to_upvote: "Clicca per votare a favore",
      click_to_downvote: "Clicca per votare contro",
      click_to_view_upvotes: "Clicca per vedere i voti a favore",
      click_to_view_downvotes: "Clicca per vedere i voti contro",
    },
  },
  attachment: {
    error: "Impossibile allegare il file. Riprova a caricarlo.",
    only_one_file_allowed: "È possibile caricare un solo file alla volta.",
    file_size_limit: "Il file deve essere di {size}MB o meno.",
    drag_and_drop: "Trascina e rilascia ovunque per caricare",
    delete: "Elimina allegato",
  },
  label: {
    select: "Seleziona etichetta",
    create: {
      success: "Etichetta creata con successo",
      failed: "Creazione dell'etichetta fallita",
      already_exists: "L'etichetta esiste già",
      type: "Digita per aggiungere una nuova etichetta",
    },
  },
  sub_work_item: {
    update: {
      success: "Sotto-elemento di lavoro aggiornato con successo",
      error: "Errore nell'aggiornamento del sotto-elemento di lavoro",
    },
    remove: {
      success: "Sotto-elemento di lavoro rimosso con successo",
      error: "Errore nella rimozione del sotto-elemento di lavoro",
    },
    empty_state: {
      sub_list_filters: {
        title: "Non hai sotto-elementi di lavoro che corrispondono ai filtri che hai applicato.",
        description: "Per vedere tutti i sotto-elementi di lavoro, cancella tutti i filtri applicati.",
        action: "Cancella filtri",
      },
      list_filters: {
        title: "Non hai elementi di lavoro che corrispondono ai filtri che hai applicato.",
        description: "Per vedere tutti gli elementi di lavoro, cancella tutti i filtri applicati.",
        action: "Cancella filtri",
      },
    },
  },
  view: {
    label: "{count, plural, one {Visualizzazione} other {Visualizzazioni}}",
    create: {
      label: "Crea visualizzazione",
    },
    update: {
      label: "Aggiorna visualizzazione",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "In sospeso",
        description: "In sospeso",
      },
      declined: {
        title: "Rifiutato",
        description: "Rifiutato",
      },
      snoozed: {
        title: "Snoozed",
        description: "{days, plural, one {# giorno} other {# giorni}} rimanenti",
      },
      accepted: {
        title: "Accettato",
        description: "Accettato",
      },
      duplicate: {
        title: "Duplicato",
        description: "Duplicato",
      },
    },
    modals: {
      decline: {
        title: "Rifiuta elemento di lavoro",
        content: "Sei sicuro di voler rifiutare l'elemento di lavoro {value}?",
      },
      delete: {
        title: "Elimina elemento di lavoro",
        content: "Sei sicuro di voler eliminare l'elemento di lavoro {value}?",
        success: "Elemento di lavoro eliminato con successo",
      },
    },
    errors: {
      snooze_permission: "Solo gli amministratori del progetto possono snoozare/non snoozare gli elementi di lavoro",
      accept_permission: "Solo gli amministratori del progetto possono accettare gli elementi di lavoro",
      decline_permission: "Solo gli amministratori del progetto possono rifiutare gli elementi di lavoro",
    },
    actions: {
      accept: "Accetta",
      decline: "Rifiuta",
      snooze: "Snoozed",
      unsnooze: "Annulla snooze",
      copy: "Copia link dell'elemento di lavoro",
      delete: "Elimina",
      open: "Apri elemento di lavoro",
      mark_as_duplicate: "Segna come duplicato",
      move: "Sposta {value} negli elementi di lavoro del progetto",
    },
    source: {
      "in-app": "nell'app",
    },
    order_by: {
      created_at: "Creato il",
      updated_at: "Aggiornato il",
      id: "ID",
    },
    label: "Accoglienza",
    page_label: "{workspace} - Accoglienza",
    modal: {
      title: "Crea elemento di lavoro per l'accoglienza",
    },
    tabs: {
      open: "Aperto",
      closed: "Chiuso",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "Nessun elemento di lavoro aperto",
        description: "Trova qui gli elementi di lavoro aperti. Crea un nuovo elemento di lavoro.",
      },
      sidebar_closed_tab: {
        title: "Nessun elemento di lavoro chiuso",
        description: "Tutti gli elementi di lavoro, siano essi accettati o rifiutati, possono essere trovati qui.",
      },
      sidebar_filter: {
        title: "Nessun elemento di lavoro corrispondente",
        description:
          "Nessun elemento di lavoro corrisponde al filtro applicato in accoglienza. Crea un nuovo elemento di lavoro.",
      },
      detail: {
        title: "Seleziona un elemento di lavoro per visualizzarne i dettagli.",
      },
    },
  },
  workspace_creation: {
    heading: "Crea il tuo spazio di lavoro",
    subheading: "Per iniziare a usare Plane, devi creare o unirti a uno spazio di lavoro.",
    form: {
      name: {
        label: "Dai un nome al tuo spazio di lavoro",
        placeholder: "Qualcosa di familiare e riconoscibile è sempre meglio.",
      },
      url: {
        label: "Imposta l'URL del tuo spazio di lavoro",
        placeholder: "Digita o incolla un URL",
        edit_slug: "Puoi modificare solo lo slug dell'URL",
      },
      organization_size: {
        label: "Quante persone utilizzeranno questo spazio di lavoro?",
        placeholder: "Seleziona una fascia",
      },
    },
    errors: {
      creation_disabled: {
        title: "Solo l'amministratore dell'istanza può creare spazi di lavoro",
        description:
          "Se conosci l'indirizzo email dell'amministratore dell'istanza, clicca il pulsante qui sotto per contattarlo.",
        request_button: "Richiedi all'amministratore dell'istanza",
      },
      validation: {
        name_alphanumeric:
          "I nomi degli spazi di lavoro possono contenere solo (' '), ('-'), ('_') e caratteri alfanumerici.",
        name_length: "Limita il tuo nome a 80 caratteri.",
        url_alphanumeric: "Gli URL possono contenere solo ('-') e caratteri alfanumerici.",
        url_length: "Limita il tuo URL a 48 caratteri.",
        url_already_taken: "L'URL dello spazio di lavoro è già in uso!",
      },
    },
    request_email: {
      subject: "Richiesta per un nuovo spazio di lavoro",
      body: `Ciao amministratore dell'istanza,

Per favore, crea un nuovo spazio di lavoro con l'URL [/nome-spazio] per [scopo del nuovo spazio].

Grazie,
{firstName} {lastName}
{email}`,
    },
    button: {
      default: "Crea spazio di lavoro",
      loading: "Creazione dello spazio di lavoro in corso",
    },
    toast: {
      success: {
        title: "Successo",
        message: "Spazio di lavoro creato con successo",
      },
      error: {
        title: "Errore",
        message: "Impossibile creare lo spazio di lavoro. Per favore, riprova.",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "Panoramica dei tuoi progetti, attività e metriche",
        description:
          "Benvenuto in Plane, siamo entusiasti di averti qui. Crea il tuo primo progetto e traccia i tuoi elementi di lavoro, e questa pagina si trasformerà in uno spazio che ti aiuta a progredire. Gli amministratori vedranno anche elementi che aiutano il team a progredire.",
        primary_button: {
          text: "Crea il tuo primo progetto",
          comic: {
            title: "Tutto inizia con un progetto in Plane",
            description:
              "Un progetto può essere la roadmap di un prodotto, una campagna di marketing o il lancio di una nuova auto.",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "Analisi",
    page_label: "{workspace} - Analisi",
    open_tasks: "Totale attività aperte",
    error: "Si è verificato un errore nel recupero dei dati.",
    work_items_closed_in: "Elementi di lavoro chiusi in",
    selected_projects: "Progetti selezionati",
    total_members: "Totale membri",
    total_cycles: "Totale cicli",
    total_modules: "Totale moduli",
    pending_work_items: {
      title: "Elementi di lavoro in sospeso",
      empty_state: "L'analisi degli elementi di lavoro in sospeso dei colleghi apparirà qui.",
    },
    work_items_closed_in_a_year: {
      title: "Elementi di lavoro chiusi in un anno",
      empty_state: "Chiudi gli elementi di lavoro per visualizzare l'analisi sotto forma di grafico.",
    },
    most_work_items_created: {
      title: "Maggiori elementi di lavoro creati",
      empty_state: "I colleghi e il numero di elementi di lavoro creati da loro appariranno qui.",
    },
    most_work_items_closed: {
      title: "Maggiori elementi di lavoro chiusi",
      empty_state: "I colleghi e il numero di elementi di lavoro chiusi da loro appariranno qui.",
    },
    tabs: {
      scope_and_demand: "Ambito e Domanda",
      custom: "Analisi personalizzata",
    },
    empty_state: {
      customized_insights: {
        description: "Gli elementi di lavoro assegnati a te, suddivisi per stato, verranno visualizzati qui.",
        title: "Nessun dato disponibile",
      },
      created_vs_resolved: {
        description: "Gli elementi di lavoro creati e risolti nel tempo verranno visualizzati qui.",
        title: "Nessun dato disponibile",
      },
      project_insights: {
        title: "Nessun dato disponibile",
        description: "Gli elementi di lavoro assegnati a te, suddivisi per stato, verranno visualizzati qui.",
      },
      general: {
        title:
          "Traccia progressi, carichi di lavoro e allocazioni. Individua tendenze, rimuovi blocchi e lavora più velocemente",
        description:
          "Visualizza ambito vs domanda, stime e scope creep. Ottieni prestazioni per membri del team e squadre, assicurandoti che il tuo progetto si svolga nei tempi previsti.",
        primary_button: {
          text: "Inizia il tuo primo progetto",
          comic: {
            title: "Analytics funziona meglio con Cicli + Moduli",
            description:
              "Prima, incornicia i tuoi elementi di lavoro in Cicli e, se possibile, raggruppa gli elementi che si estendono oltre un ciclo in Moduli. Controlla entrambi nella navigazione sinistra.",
          },
        },
      },
      cycle_progress: {
        title: "Nessun dato disponibile",
        description:
          "Le analisi dei progressi del ciclo verranno visualizzate qui. Aggiungi elementi di lavoro ai cicli per iniziare a monitorare i progressi.",
      },
      module_progress: {
        title: "Nessun dato disponibile",
        description:
          "Le analisi dei progressi del modulo verranno visualizzate qui. Aggiungi elementi di lavoro ai moduli per iniziare a monitorare i progressi.",
      },
      intake_trends: {
        title: "Nessun dato disponibile",
        description:
          "Le analisi delle tendenze di intake verranno visualizzate qui. Aggiungi elementi di lavoro all’intake per iniziare a monitorare le tendenze.",
      },
    },
    created_vs_resolved: "Creato vs Risolto",
    customized_insights: "Approfondimenti personalizzati",
    backlog_work_items: "{entity} nel backlog",
    active_projects: "Progetti attivi",
    trend_on_charts: "Tendenza nei grafici",
    all_projects: "Tutti i progetti",
    summary_of_projects: "Riepilogo dei progetti",
    project_insights: "Approfondimenti sul progetto",
    started_work_items: "{entity} iniziati",
    total_work_items: "Totale {entity}",
    total_projects: "Progetti totali",
    total_admins: "Totale amministratori",
    total_users: "Totale utenti",
    total_intake: "Entrate totali",
    un_started_work_items: "{entity} non avviati",
    total_guests: "Totale ospiti",
    completed_work_items: "{entity} completati",
    total: "Totale {entity}",
    projects_by_status: "Progetti per stato",
    active_users: "Utenti attivi",
    intake_trends: "Tendenze di ammissione",
    workitem_resolved_vs_pending: "Elementi di lavoro risolti vs in sospeso",
    upgrade_to_plan: "Passa a {plan} per sbloccare {tab}",
  },
  workspace_projects: {
    label: "{count, plural, one {Progetto} other {Progetti}}",
    create: {
      label: "Aggiungi progetto",
    },
    network: {
      label: "Rete",
      private: {
        title: "Privato",
        description: "Accessibile solo su invito",
      },
      public: {
        title: "Pubblico",
        description: "Chiunque nello spazio di lavoro, tranne gli ospiti, può unirsi",
      },
    },
    error: {
      permission: "Non hai il permesso di eseguire questa azione.",
      cycle_delete: "Impossibile eliminare il ciclo",
      module_delete: "Impossibile eliminare il modulo",
      issue_delete: "Impossibile eliminare l'elemento di lavoro",
    },
    state: {
      backlog: "Backlog",
      unstarted: "Non iniziato",
      started: "Iniziato",
      completed: "Completato",
      cancelled: "Annullato",
    },
    sort: {
      manual: "Manuale",
      name: "Nome",
      created_at: "Data di creazione",
      members_length: "Numero di membri",
    },
    scope: {
      my_projects: "I miei progetti",
      archived_projects: "Archiviati",
    },
    common: {
      months_count: "{months, plural, one {# mese} other {# mesi}}",
      days_count: "{days, plural, one {# giorno} other {# giorni}}",
    },
    empty_state: {
      general: {
        title: "Nessun progetto attivo",
        description:
          "Considera ogni progetto come la base per un lavoro orientato a obiettivi. I progetti sono dove risiedono Jobs, Cicli e Moduli e, insieme ai tuoi colleghi, ti aiutano a raggiungere quell'obiettivo. Crea un nuovo progetto o filtra per progetti archiviati.",
        primary_button: {
          text: "Inizia il tuo primo progetto",
          comic: {
            title: "Tutto inizia con un progetto in Plane",
            description:
              "Un progetto può essere la roadmap di un prodotto, una campagna di marketing o il lancio di una nuova auto.",
          },
        },
      },
      no_projects: {
        title: "Nessun progetto",
        description: "Per creare elementi di lavoro o gestire il tuo lavoro, devi creare o far parte di un progetto.",
        primary_button: {
          text: "Inizia il tuo primo progetto",
          comic: {
            title: "Tutto inizia con un progetto in Plane",
            description:
              "Un progetto può essere la roadmap di un prodotto, una campagna di marketing o il lancio di una nuova auto.",
          },
        },
      },
      filter: {
        title: "Nessun progetto corrispondente",
        description: `Nessun progetto rilevato con i criteri di ricerca corrispondenti.
 Crea un nuovo progetto invece.`,
      },
      search: {
        description: `Nessun progetto rilevato con i criteri di ricerca corrispondenti.
Crea un nuovo progetto invece`,
      },
    },
  },
  workspace_views: {
    add_view: "Aggiungi visualizzazione",
    empty_state: {
      "all-issues": {
        title: "Nessun elemento di lavoro nel progetto",
        description:
          "Primo progetto fatto! Ora, suddividi il tuo lavoro in parti tracciabili con gli elementi di lavoro. Andiamo!",
        primary_button: {
          text: "Crea un nuovo elemento di lavoro",
        },
      },
      assigned: {
        title: "Nessun elemento di lavoro ancora",
        description: "Gli elementi di lavoro assegnati a te possono essere tracciati da qui.",
        primary_button: {
          text: "Crea un nuovo elemento di lavoro",
        },
      },
      created: {
        title: "Nessun elemento di lavoro ancora",
        description: "Tutti gli elementi di lavoro creati da te appariranno qui. Tracciali direttamente da qui.",
        primary_button: {
          text: "Crea un nuovo elemento di lavoro",
        },
      },
      subscribed: {
        title: "Nessun elemento di lavoro ancora",
        description: "Iscriviti agli elementi di lavoro che ti interessano, tracciali tutti qui.",
      },
      "custom-view": {
        title: "Nessun elemento di lavoro ancora",
        description: "Gli elementi di lavoro che corrispondono ai filtri, tracciali tutti qui.",
      },
    },
    delete_view: {
      title: "Sei sicuro di voler eliminare questa visualizzazione?",
      content:
        "Se confermi, tutte le opzioni di ordinamento, filtro e visualizzazione + il layout che hai scelto per questa visualizzazione saranno eliminate permanentemente senza possibilità di ripristinarle.",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "Cambia email",
        description: "Inserisci un nuovo indirizzo email per ricevere un link di verifica.",
        toasts: {
          success_title: "Successo!",
          success_message: "Email aggiornata con successo. Accedi di nuovo.",
        },
        form: {
          email: {
            label: "Nuova email",
            placeholder: "Inserisci la tua email",
            errors: {
              required: "L’email è obbligatoria",
              invalid: "L’email non è valida",
              exists: "L’email esiste già. Usane un’altra.",
              validation_failed: "La verifica dell’email non è riuscita. Riprova.",
            },
          },
          code: {
            label: "Codice univoco",
            placeholder: "123456",
            helper_text: "Codice di verifica inviato alla tua nuova email.",
            errors: {
              required: "Il codice univoco è obbligatorio",
              invalid: "Codice di verifica non valido. Riprova.",
            },
          },
        },
        actions: {
          continue: "Continua",
          confirm: "Conferma",
          cancel: "Annulla",
        },
        states: {
          sending: "Invio…",
        },
      },
    },
    notifications: {
      select_default_view: "Seleziona vista predefinita",
      compact: "Compatto",
      full: "Schermo intero",
    },
  },
  workspace_settings: {
    label: "Impostazioni dello spazio di lavoro",
    page_label: "{workspace} - Impostazioni generali",
    key_created: "Chiave creata",
    copy_key:
      "Copia e salva questa chiave segreta in Plane Pages. Non potrai vederla dopo aver cliccato Chiudi. È stato scaricato un file CSV contenente la chiave.",
    token_copied: "Token copiato negli appunti.",
    settings: {
      general: {
        title: "Generale",
        upload_logo: "Carica logo",
        edit_logo: "Modifica logo",
        name: "Nome dello spazio di lavoro",
        company_size: "Dimensione aziendale",
        url: "URL dello spazio di lavoro",
        workspace_timezone: "Fuso orario dello spazio di lavoro",
        update_workspace: "Aggiorna spazio di lavoro",
        delete_workspace: "Elimina questo spazio di lavoro",
        delete_workspace_description:
          "Eliminando uno spazio di lavoro, tutti i dati e le risorse all'interno di esso verranno rimossi definitivamente e non potranno essere recuperati.",
        delete_btn: "Elimina questo spazio di lavoro",
        delete_modal: {
          title: "Sei sicuro di voler eliminare questo spazio di lavoro?",
          description:
            "Hai un periodo di prova attivo per uno dei nostri piani a pagamento. Per procedere, annulla prima il periodo di prova.",
          dismiss: "Annulla",
          cancel: "Annulla periodo di prova",
          success_title: "Spazio di lavoro eliminato.",
          success_message: "Presto verrai reindirizzato alla tua pagina del profilo.",
          error_title: "Qualcosa non ha funzionato.",
          error_message: "Riprova, per favore.",
        },
        errors: {
          name: {
            required: "Il nome è obbligatorio",
            max_length: "Il nome dello spazio di lavoro non deve superare gli 80 caratteri",
          },
          company_size: {
            required: "La dimensione aziendale è obbligatoria",
            select_a_range: "Seleziona la dimensione dell'organizzazione",
          },
        },
      },
      members: {
        title: "Membri",
        add_member: "Aggiungi membro",
        pending_invites: "Inviti in sospeso",
        invitations_sent_successfully: "Inviti inviati con successo",
        leave_confirmation:
          "Sei sicuro di voler lasciare lo spazio di lavoro? Non avrai più accesso a questo spazio. Questa azione non può essere annullata.",
        details: {
          full_name: "Nome completo",
          display_name: "Nome visualizzato",
          email_address: "Indirizzo email",
          account_type: "Tipo di account",
          authentication: "Autenticazione",
          joining_date: "Data di ingresso",
        },
        modal: {
          title: "Invita persone a collaborare",
          description: "Invita persone a collaborare nel tuo spazio di lavoro.",
          button: "Invia inviti",
          button_loading: "Invio inviti in corso",
          placeholder: "nome@azienda.com",
          errors: {
            required: "Abbiamo bisogno di un indirizzo email per invitarli.",
            invalid: "L'email non è valida",
          },
        },
      },
      billing_and_plans: {
        title: "Fatturazione e Piani",
        current_plan: "Piano attuale",
        free_plan: "Stai attualmente utilizzando il piano gratuito",
        view_plans: "Visualizza piani",
      },
      exports: {
        title: "Esportazioni",
        exporting: "Esportazione in corso",
        previous_exports: "Esportazioni precedenti",
        export_separate_files: "Esporta i dati in file separati",
        filters_info: "Applica filtri per esportare elementi di lavoro specifici in base ai tuoi criteri.",
        modal: {
          title: "Esporta in",
          toasts: {
            success: {
              title: "Esportazione riuscita",
              message: "Potrai scaricare gli {entity} esportati dall'esportazione precedente.",
            },
            error: {
              title: "Esportazione fallita",
              message: "L'esportazione non è riuscita. Per favore, riprova.",
            },
          },
        },
      },
      webhooks: {
        title: "Webhooks",
        add_webhook: "Aggiungi webhook",
        modal: {
          title: "Crea webhook",
          details: "Dettagli del webhook",
          payload: "URL del payload",
          question: "Quali eventi vuoi attivino questo webhook?",
          error: "L'URL è obbligatorio",
        },
        secret_key: {
          title: "Chiave segreta",
          message: "Genera un token per accedere al payload del webhook",
        },
        options: {
          all: "Inviami tutto",
          individual: "Seleziona eventi individuali",
        },
        toasts: {
          created: {
            title: "Webhook creato",
            message: "Il webhook è stato creato con successo",
          },
          not_created: {
            title: "Webhook non creato",
            message: "Il webhook non può essere creato",
          },
          updated: {
            title: "Webhook aggiornato",
            message: "Il webhook è stato aggiornato con successo",
          },
          not_updated: {
            title: "Webhook non aggiornato",
            message: "Il webhook non può essere aggiornato",
          },
          removed: {
            title: "Webhook rimosso",
            message: "Il webhook è stato rimosso con successo",
          },
          not_removed: {
            title: "Webhook non rimosso",
            message: "Il webhook non può essere rimosso",
          },
          secret_key_copied: {
            message: "Chiave segreta copiata negli appunti.",
          },
          secret_key_not_copied: {
            message: "Errore durante la copia della chiave segreta.",
          },
        },
      },
      api_tokens: {
        heading: "Token API",
        description: "Genera token API sicuri per integrare i tuoi dati con sistemi e applicazioni esterne.",
        title: "Token API",
        add_token: "Aggiungi token di accesso",
        create_token: "Crea token",
        never_expires: "Non scade mai",
        generate_token: "Genera token",
        generating: "Generazione in corso",
        delete: {
          title: "Elimina token API",
          description:
            "Qualsiasi applicazione che utilizza questo token non avrà più accesso ai dati di Plane. Questa azione non può essere annullata.",
          success: {
            title: "Successo!",
            message: "Il token API è stato eliminato con successo",
          },
          error: {
            title: "Errore!",
            message: "Il token API non può essere eliminato",
          },
        },
      },
      integrations: {
        title: "Integrazioni",
        page_title: "Lavora con i tuoi dati Plane nelle app disponibili o nelle tue.",
        page_description: "Visualizza tutte le integrazioni utilizzate da questo workspace o da te.",
      },
      imports: {
        title: "Importazioni",
      },
      worklogs: {
        title: "Registrazioni di lavoro",
      },
      group_syncing: {
        title: "Sincronizzazione gruppi",
        heading: "Sincronizzazione gruppi",
        description:
          "Collega i gruppi del provider di identità a progetti e ruoli. L'accesso degli utenti si aggiorna automaticamente quando cambia l'appartenenza al gruppo nel tuo IdP, semplificando onboarding e offboarding.",
        enable: {
          title: "Abilita sincronizzazione gruppi",
          description: "Aggiungi automaticamente gli utenti ai progetti in base ai gruppi del provider di identità.",
        },
        config: {
          title: "Configura sincronizzazione gruppi",
          description: "Imposta come i gruppi del provider di identità sono mappati a progetti e ruoli.",
          sync_on_login: {
            title: "Sincronizza al login",
            description: "Aggiorna appartenenza al gruppo e accesso al progetto quando un utente accede.",
          },
          sync_offline: {
            title: "Sincronizzazione offline",
            description:
              "Esegue la sincronizzazione ogni sei ore automaticamente, senza attendere il login degli utenti.",
          },
          auto_remove: {
            title: "Rimozione automatica",
            description: "Rimuovi automaticamente gli utenti dai progetti quando non corrispondono più al gruppo.",
          },
          group_attribute_key: {
            title: "Chiave attributo gruppo",
            description: "L'attributo del provider di identità usato per identificare e sincronizzare i gruppi utente.",
            placeholder: "Gruppi",
          },
        },
        group_mapping: {
          title: "Mappatura gruppi",
          description: "Collega i gruppi del provider di identità a progetti e ruoli.",
          button_text: "Aggiungi nuova sincronizzazione gruppo",
        },
        toast: {
          updating: "Aggiornamento funzione sincronizzazione gruppi",
          success: "Funzione sincronizzazione gruppi aggiornata con successo.",
          error: "Impossibile aggiornare la funzione sincronizzazione gruppi!",
        },
        delete_modal: {
          title: "Elimina sincronizzazione gruppo",
          content:
            "I nuovi utenti di questo gruppo di identità non verranno più aggiunti al progetto. Gli utenti già aggiunti conserveranno il loro ruolo attuale.",
        },
        modal: {
          idp_group_name: {
            text: "Gruppo utenti",
            required: "Il gruppo utenti è obbligatorio",
            placeholder: "Inserisci i nomi dei gruppi IdP",
          },
          project: {
            text: "Progetto",
            required: "Il progetto è obbligatorio",
            placeholder: "Seleziona un progetto",
          },
          default_role: {
            text: "Ruolo progetto",
            required: "Il ruolo progetto è obbligatorio",
            placeholder: "Seleziona un ruolo progetto",
          },
        },
      },
      identity: {
        title: "Identità",
        heading: "Identità",
        description: "Configura il tuo dominio e abilita Single sign-on",
      },
      project_states: {
        title: "Stati del progetto",
      },
      projects: {
        title: "Progetti",
        description: "Gestisci gli stati dei progetti, abilita le etichette dei progetti e altre configurazioni.",
        tabs: {
          states: "Stati del progetto",
          labels: "Etichette del progetto",
        },
      },
      teamspaces: {
        title: "Teamspaces",
      },
      initiatives: {
        title: "Iniziative",
      },
      customers: {
        title: "Clienti",
      },
      releases: {
        title: "Rilasci",
        update_release: "Aggiorna rilascio",
        create_release: "Crea rilascio",
        errors: {
          release_not_found: "Il rilascio che stai cercando non esiste.",
          unknown: "Si è verificato un errore. Riprova.",
        },
      },

      cancel_trial: {
        title: "Cancella la tua prova prima.",
        description: "Hai una prova attiva per uno dei nostri piani pagati. Per procedere, per favore cancella prima.",
        dismiss: "Ignora",
        cancel: "Cancella prova",
        cancel_success_title: "Prova cancellata.",
        cancel_success_message: "Ora puoi eliminare lo spazio di lavoro.",
        cancel_error_title: "Non è andato",
        cancel_error_message: "Prova di nuovo, per favore.",
      },
      applications: {
        title: "Applicazioni",
        applicationId_copied: "ID applicazione copiato negli appunti",
        clientId_copied: "ID cliente copiato negli appunti",
        clientSecret_copied: "Secret cliente copiato negli appunti",
        third_party_apps: "App di terze parti",
        your_apps: "Le tue app",
        connect: "Connetti",
        connected: "Connesso",
        install: "Installa",
        installed: "Installato",
        configure: "Configura",
        app_available: "Hai reso questa app disponibile per l'uso con un workspace Plane",
        app_available_description: "Connetti un workspace Plane per iniziare a usarla",
        client_id_and_secret: "ID e Secret Cliente",
        client_id_and_secret_description:
          "Copia e salva questa chiave segreta. Non potrai più vedere questa chiave dopo aver cliccato su Chiudi.",
        client_id_and_secret_download: "Puoi scaricare un CSV con la chiave da qui.",
        application_id: "ID Applicazione",
        client_id: "ID Cliente",
        client_secret: "Secret Cliente",
        export_as_csv: "Esporta come CSV",
        slug_already_exists: "Lo slug esiste già",
        failed_to_create_application: "Impossibile creare l'applicazione",
        upload_logo: "Carica Logo",
        app_name_title: "Come chiamerai questa app",
        app_name_error: "Il nome dell'app è obbligatorio",
        app_short_description_title: "Dai una breve descrizione a questa app",
        app_short_description_error: "La breve descrizione dell'app è obbligatoria",
        app_description_title: {
          label: "Descrizione lunga",
          placeholder: "Scrivi una descrizione lunga per il marketplace. Premi '/' per i comandi.",
        },
        authorization_grant_type: {
          title: "Tipo di connessione",
          description:
            "Scegli se la tua app deve essere installata una volta per il workspace o permettere a ogni utente di collegare il proprio account",
        },
        app_description_error: "La descrizione dell'app è obbligatoria",
        app_slug_title: "Slug dell'app",
        app_slug_error: "Lo slug dell'app è obbligatorio",
        app_maker_title: "Creatore dell'app",
        app_maker_error: "Il creatore dell'app è obbligatorio",
        webhook_url_title: "URL del Webhook",
        webhook_url_error: "L'URL del webhook è obbligatorio",
        invalid_webhook_url_error: "URL del webhook non valido",
        redirect_uris_title: "URI di reindirizzamento",
        redirect_uris_error: "Gli URI di reindirizzamento sono obbligatori",
        invalid_redirect_uris_error: "URI di reindirizzamento non validi",
        redirect_uris_description:
          "Inserisci gli URI separati da spazi dove l'app reindirizzerà dopo l'utente, ad esempio https://example.com https://example.com/",
        authorized_javascript_origins_title: "Origini Javascript autorizzate",
        authorized_javascript_origins_error: "Le origini Javascript autorizzate sono obbligatorie",
        invalid_authorized_javascript_origins_error: "Origini Javascript autorizzate non valide",
        authorized_javascript_origins_description:
          "Inserisci le origini separate da spazi da cui l'app potrà effettuare richieste, ad esempio app.com example.com",
        create_app: "Crea app",
        update_app: "Aggiorna app",
        regenerate_client_secret_description:
          "Rigenera il secret cliente. Se rigeneri il secret, potrai copiare la chiave o scaricarla in un file CSV subito dopo.",
        regenerate_client_secret: "Rigenera secret cliente",
        regenerate_client_secret_confirm_title: "Sei sicuro di voler rigenerare il secret cliente?",
        regenerate_client_secret_confirm_description:
          "L'app che usa questo secret smetterà di funzionare. Dovrai aggiornare il secret nell'app.",
        regenerate_client_secret_confirm_cancel: "Annulla",
        regenerate_client_secret_confirm_regenerate: "Rigenera",
        read_only_access_to_workspace: "Accesso in sola lettura al tuo workspace",
        write_access_to_workspace: "Accesso in scrittura al tuo workspace",
        read_only_access_to_user_profile: "Accesso in sola lettura al tuo profilo utente",
        write_access_to_user_profile: "Accesso in scrittura al tuo profilo utente",
        connect_app_to_workspace: "Connetti {app} al tuo workspace {workspace}",
        user_permissions: "Permessi utente",
        user_permissions_description:
          "I permessi utente sono utilizzati per concedere l'accesso al profilo dell'utente.",
        workspace_permissions: "Permessi del workspace",
        workspace_permissions_description:
          "I permessi del workspace sono utilizzati per concedere l'accesso al workspace.",
        with_the_permissions: "con i permessi",
        app_consent_title: "{app} richiede l'accesso al tuo workspace e profilo Plane.",
        choose_workspace_to_connect_app_with: "Scegli un workspace a cui connettere l'app",
        app_consent_workspace_permissions_title: "{app} vorrebbe",
        app_consent_user_permissions_title:
          "{app} può anche richiedere il permesso di un utente per le seguenti risorse. Questi permessi saranno richiesti e autorizzati solo da un utente.",
        app_consent_accept_title: "Accettando",
        app_consent_accept_1:
          "Concedi all'app l'accesso ai tuoi dati Plane ovunque tu possa utilizzare l'app dentro o fuori Plane",
        app_consent_accept_2: "Accetti la Privacy Policy e i Termini d'Uso di {app}",
        accepting: "Accettazione in corso...",
        accept: "Accetta",
        categories: "Categorie",
        select_app_categories: "Seleziona categorie di app",
        categories_title: "Categorie",
        categories_error: "Le categorie sono obbligatorie",
        invalid_categories_error: "Categorie non valide",
        categories_description: "Seleziona le categorie che meglio descrivono l'app",
        supported_plans: "Piani Supportati",
        supported_plans_description:
          "Seleziona i piani dell'area di lavoro che possono installare questa applicazione. Lascia vuoto per consentire tutti i piani.",
        select_plans: "Seleziona Piani",
        privacy_policy_url_title: "URL della Privacy Policy",
        privacy_policy_url_error: "La URL della Privacy Policy è obbligatoria",
        invalid_privacy_policy_url_error: "URL della Privacy Policy non valido",
        terms_of_service_url_title: "URL dei Termini di Servizio",
        terms_of_service_url_error: "I Termini di Servizio sono obbligatori",
        invalid_terms_of_service_url_error: "URL dei Termini di Servizio non valido",
        support_url_title: "URL di Supporto",
        support_url_error: "L'URL di supporto è obbligatorio",
        invalid_support_url_error: "URL di supporto non valido",
        video_url_title: "URL del Video",
        video_url_error: "Il URL del video è obbligatorio",
        invalid_video_url_error: "URL del video non valido",
        setup_url_title: "URL di Setup",
        setup_url_error: "Il URL di setup è obbligatorio",
        invalid_setup_url_error: "URL di setup non valido",
        configuration_url_title: "URL di configurazione",
        configuration_url_error: "L'URL di configurazione è obbligatorio",
        invalid_configuration_url_error: "URL di configurazione non valido",
        contact_email_title: "Email di contatto",
        contact_email_error: "L'email di contatto è obbligatoria",
        invalid_contact_email_error: "Email di contatto non valida",
        upload_attachments: "Carica allegati",
        uploading_images: "Caricamento di {count} Immagine{count, plural, one {s} other {s}}",
        drop_images_here: "Rilascia le immagini qui",
        click_to_upload_images: "Clicca per caricare le immagini",
        invalid_file_or_exceeds_size_limit: "File non valido o supera il limite di dimensione ({size} MB)",
        uploading: "Caricamento...",
        upload_and_save: "Carica e salva",
        app_credentials_regenrated: {
          title: "Le credenziali dell'app sono state rigenerate con successo",
          description: "Sostituisci il client secret ovunque venga utilizzato. Il secret precedente non è più valido.",
        },
        app_created: {
          title: "App creata con successo",
          description: "Usa le credenziali per installare l'app in uno spazio di lavoro Plane",
        },
        installed_apps: "App installate",
        all_apps: "Tutte le app",
        internal_apps: "App interne",
        website: {
          title: "Sito web",
          description: "Link al sito web della tua app.",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "Creatore di app",
          description: "La persona o l'organizzazione che crea l'app.",
        },
        setup_url: {
          label: "URL di configurazione",
          description: "Gli utenti verranno reindirizzati a questo URL quando installeranno l'app.",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "URL del webhook",
          description: "Qui invieremo eventi e aggiornamenti webhook dagli workspace in cui la tua app è installata.",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "URI di reindirizzamento (separate da spazi)",
          description: "Gli utenti verranno reindirizzati a questo percorso dopo essersi autenticati con Plane.",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "Questa app può essere installata solo dopo che un amministratore del workspace l'ha installata. Contatta l'amministratore del tuo workspace per procedere.",
        enable_app_mentions: "Abilita menzioni dell'app",
        enable_app_mentions_tooltip:
          "Quando è abilitato, gli utenti possono menzionare o assegnare Work Item a questa applicazione.",
        scopes: "Ambiti",
        select_scopes: "Seleziona ambiti",
        read_access_to: "Accesso in sola lettura a",
        write_access_to: "Accesso in scrittura a",
        global_permission_expiration:
          "Gli ambiti globali stanno per scadere. Utilizza ambiti granulari invece. Ad esempio, usa project:read invece di una lettura globale.",
        selected_scopes: "{count} selezionati",
        scopes_and_permissions: "Ambiti e autorizzazioni",
        read: "Lettura",
        write: "Scrittura",
        scope_description: {
          projects: "Accesso ai progetti e a tutte le entità correlate ai progetti",
          wiki: "Accesso al wiki e a tutte le entità correlate al wiki",
          customers: "Accesso ai clienti e a tutte le entità correlate ai clienti",
          initiatives: "Accesso alle iniziative e a tutte le entità correlate",
          workspaces: "Accesso agli spazi di lavoro e a tutte le entità correlate",
          stickies: "Accesso alle note adesive e a tutte le entità correlate",
          teamspaces: "Accesso agli spazi di squadra e a tutte le entità correlate",
          profile: "Accesso alle informazioni del profilo utente",
          agents: "Accesso agli agenti e a tutte le entità correlate",
          assets: "Accesso agli asset e a tutte le entità correlate",
        },
        build_your_own_app: "Crea la tua app",
        edit_app_details: "Modifica i dettagli dell'app",
        internal: "Interno",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description:
          "Vedi il tuo lavoro diventare più intelligente e più veloce con l'IA che è connessa in modo nativo al tuo lavoro e alla tua base di conoscenza.",
      },
    },
    empty_state: {
      api_tokens: {
        title: "Nessun token API creato",
        description:
          "Le API di Plane possono essere utilizzate per integrare i tuoi dati in Plane con qualsiasi sistema esterno. Crea un token per iniziare.",
      },
      webhooks: {
        title: "Nessun webhook aggiunto",
        description: "Crea webhook per ricevere aggiornamenti in tempo reale e automatizzare azioni.",
      },
      exports: {
        title: "Nessuna esportazione ancora",
        description: "Ogni volta che esporti, avrai anche una copia qui per riferimento.",
      },
      imports: {
        title: "Nessuna importazione ancora",
        description: "Trova qui tutte le tue importazioni precedenti e scaricale.",
      },
    },
  },
  profile: {
    label: "Profilo",
    page_label: "Il tuo lavoro",
    work: "Lavoro",
    details: {
      joined_on: "Iscritto il",
      time_zone: "Fuso orario",
    },
    stats: {
      workload: "Carico di lavoro",
      overview: "Panoramica",
      created: "Elementi di lavoro creati",
      assigned: "Elementi di lavoro assegnati",
      subscribed: "Elementi di lavoro iscritti",
      state_distribution: {
        title: "Elementi di lavoro per stato",
        empty: "Crea elementi di lavoro per visualizzarli per stato nel grafico per un'analisi migliore.",
      },
      priority_distribution: {
        title: "Elementi di lavoro per priorità",
        empty: "Crea elementi di lavoro per visualizzarli per priorità nel grafico per un'analisi migliore.",
      },
      recent_activity: {
        title: "Attività recente",
        empty: "Non abbiamo trovato dati. Per favore, controlla i tuoi input",
        button: "Scarica l'attività di oggi",
        button_loading: "Download in corso",
      },
    },
    actions: {
      profile: "Profilo",
      security: "Sicurezza",
      activity: "Attività",
      appearance: "Aspetto",
      notifications: "Notifiche",
      connections: "Connessioni",
    },
    tabs: {
      summary: "Riepilogo",
      assigned: "Assegnati",
      created: "Creati",
      subscribed: "Iscritti",
      activity: "Attività",
    },
    empty_state: {
      activity: {
        title: "Nessuna attività ancora",
        description:
          "Inizia creando un nuovo elemento di lavoro! Aggiungi dettagli e proprietà ad esso. Esplora Plane per vedere la tua attività.",
      },
      assigned: {
        title: "Nessun elemento di lavoro assegnato a te",
        description: "Gli elementi di lavoro assegnati a te possono essere tracciati da qui.",
      },
      created: {
        title: "Nessun elemento di lavoro ancora",
        description: "Tutti gli elementi di lavoro creati da te appariranno qui. Tracciali direttamente da qui.",
      },
      subscribed: {
        title: "Nessun elemento di lavoro ancora",
        description: "Iscriviti agli elementi di lavoro che ti interessano, tracciali tutti qui.",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "Inserisci l'ID del progetto",
      please_select_a_timezone: "Seleziona un fuso orario",
      archive_project: {
        title: "Archivia progetto",
        description:
          "Archiviare un progetto lo rimuoverà dal menu di navigazione laterale, anche se potrai sempre accedervi dalla pagina dei progetti. Potrai ripristinare il progetto o eliminarlo quando vuoi.",
        button: "Archivia progetto",
      },
      delete_project: {
        title: "Elimina progetto",
        description:
          "Eliminando un progetto, tutti i dati e le risorse all'interno di esso verranno rimossi definitivamente e non potranno essere recuperati.",
        button: "Elimina il mio progetto",
      },
      toast: {
        success: "Progetto aggiornato con successo",
        error: "Impossibile aggiornare il progetto. Per favore, riprova.",
      },
    },
    members: {
      label: "Membri",
      project_lead: "Responsabile del progetto",
      default_assignee: "Assegnatario predefinito",
      guest_super_permissions: {
        title: "Concedi accesso in sola lettura a tutti gli elementi di lavoro per gli utenti ospiti:",
        sub_heading: "Questo permetterà agli ospiti di visualizzare tutti gli elementi di lavoro del progetto.",
      },
      invite_members: {
        title: "Invita membri",
        sub_heading: "Invita membri a lavorare sul tuo progetto.",
        select_co_worker: "Seleziona un collega",
      },
      project_lead_description: "Seleziona il responsabile del progetto.",
      default_assignee_description: "Seleziona l’assegnatario predefinito del progetto.",
      project_subscribers: "Iscritti al progetto",
      project_subscribers_description: "Seleziona i membri che riceveranno le notifiche per questo progetto.",
    },
    states: {
      describe_this_state_for_your_members: "Descrivi questo stato per i tuoi membri.",
      empty_state: {
        title: "Nessuno stato disponibile per il gruppo {groupKey}",
        description: "Crea un nuovo stato",
      },
    },
    labels: {
      label_title: "Titolo etichetta",
      label_title_is_required: "Il titolo dell'etichetta è obbligatorio",
      label_max_char: "Il nome dell'etichetta non deve superare i 255 caratteri",
      toast: {
        error: "Errore durante l'aggiornamento dell'etichetta",
      },
    },
    estimates: {
      label: "Stime",
      title: "Abilita le stime per il mio progetto",
      description: "Ti aiutano a comunicare la complessità e il carico di lavoro del team.",
      no_estimate: "Nessuna stima",
      new: "Nuovo sistema di stima",
      create: {
        custom: "Personalizzato",
        start_from_scratch: "Inizia da zero",
        choose_template: "Scegli un modello",
        choose_estimate_system: "Scegli un sistema di stima",
        enter_estimate_point: "Inserisci stima",
        step: "Passo {step} di {total}",
        label: "Crea stima",
      },
      toasts: {
        created: {
          success: {
            title: "Stima creata",
            message: "La stima è stata creata con successo",
          },
          error: {
            title: "Creazione stima fallita",
            message: "Non siamo riusciti a creare la nuova stima, riprova.",
          },
        },
        updated: {
          success: {
            title: "Stima modificata",
            message: "La stima è stata aggiornata nel tuo progetto.",
          },
          error: {
            title: "Modifica stima fallita",
            message: "Non siamo riusciti a modificare la stima, riprova",
          },
        },
        enabled: {
          success: {
            title: "Successo!",
            message: "Le stime sono state abilitate.",
          },
        },
        disabled: {
          success: {
            title: "Successo!",
            message: "Le stime sono state disabilitate.",
          },
          error: {
            title: "Errore!",
            message: "Impossibile disabilitare la stima. Riprova",
          },
        },
        reorder: {
          success: {
            title: "Stime riordinate",
            message: "Le stime sono state riordinate nel tuo progetto.",
          },
          error: {
            title: "Riordinamento stime fallito",
            message: "Non siamo riusciti a riordinare le stime, riprova",
          },
        },
      },
      validation: {
        min_length: "La stima deve essere maggiore di 0.",
        unable_to_process: "Non possiamo elaborare la tua richiesta, riprova.",
        numeric: "La stima deve essere un valore numerico.",
        character: "La stima deve essere un valore di carattere.",
        empty: "Il valore della stima non può essere vuoto.",
        already_exists: "Il valore della stima esiste già.",
        unsaved_changes: "Hai delle modifiche non salvate. Salva prima di cliccare su Fatto",
        remove_empty:
          "La stima non può essere vuota. Inserisci un valore in ogni campo o rimuovi quelli per cui non hai valori.",
        fill: "Compila questo campo di stima",
        repeat: "Il valore della stima non può essere ripetuto",
      },
      systems: {
        points: {
          label: "Punti",
          fibonacci: "Fibonacci",
          linear: "Lineare",
          squares: "Quadrati",
          custom: "Personalizzato",
        },
        categories: {
          label: "Categorie",
          t_shirt_sizes: "Taglie T-Shirt",
          easy_to_hard: "Da facile a difficile",
          custom: "Personalizzato",
        },
        time: {
          label: "Tempo",
          hours: "Ore",
        },
      },
      edit: {
        title: "Modifica sistema di stime",
        add_or_update: {
          title: "Aggiungi, aggiorna o rimuovi stime",
          description: "Gestisci il sistema attuale aggiungendo, aggiornando o rimuovendo punti o categorie.",
        },
        switch: {
          title: "Cambia tipo di stima",
          description: "Converti il tuo sistema a punti in sistema a categorie e viceversa.",
        },
      },
      switch: "Cambia sistema di stime",
      current: "Sistema di stime attuale",
      select: "Seleziona un sistema di stime",
    },
    automations: {
      label: "Automatizzazioni",
      "auto-archive": {
        title: "Archivia automaticamente gli elementi di lavoro chiusi",
        description: "Plane archiverà automaticamente gli elementi di lavoro che sono stati completati o annullati.",
        duration: "Archivia automaticamente gli elementi di lavoro chiusi per",
      },
      "auto-close": {
        title: "Chiudi automaticamente gli elementi di lavoro",
        description: "Plane chiuderà automaticamente gli elementi di lavoro che non sono stati completati o annullati.",
        duration: "Chiudi automaticamente gli elementi di lavoro inattivi per",
        auto_close_status: "Stato di chiusura automatica",
      },
      "auto-remind": {
        title: "Promemoria automatici",
        description:
          "Plane invierà automaticamente promemoria via email e notifiche in-app per mantenere il tuo team in linea con le scadenze.",
        duration: "Invia promemoria prima di",
      },
    },
    empty_state: {
      labels: {
        title: "Nessuna etichetta ancora",
        description: "Crea etichette per aiutare a organizzare e filtrare gli elementi di lavoro nel tuo progetto.",
      },
      estimates: {
        title: "Nessun sistema di stime ancora",
        description: "Crea un set di stime per comunicare la quantità di lavoro per elemento di lavoro.",
        primary_button: "Aggiungi sistema di stime",
      },
      integrations: {
        title: "Nessuna integrazione configurata",
        description: "Configura GitHub e altre integrazioni per sincronizzare i tuoi elementi di lavoro del progetto.",
      },
    },
    initiatives: {
      heading: "Iniziative",
      sub_heading: "Sblocca il livello più alto di organizzazione per tutto il tuo lavoro in Plane.",
      title: "Abilita Iniziative",
      description: "Imposta obiettivi più grandi per monitorare i progressi",
      toast: {
        updating: "Aggiornamento della funzionalità iniziative",
        enable_success: "Funzionalità iniziative abilitata con successo.",
        disable_success: "Funzionalità iniziative disabilitata con successo.",
        error: "Impossibile aggiornare la funzionalità iniziative!",
      },
    },
    customers: {
      heading: "Clienti",
      settings_heading: "Gestisci il lavoro in base a ciò che è importante per i tuoi clienti.",
      settings_sub_heading:
        "Trasforma le richieste dei clienti in elementi di lavoro, assegna priorità in base alle richieste e collega gli stati degli elementi di lavoro ai record dei clienti. Presto potrai integrare il tuo CRM o strumento di supporto per una gestione del lavoro ancora migliore in base agli attributi dei clienti.",
    },
    epics: {
      properties: {
        title: "Proprietà",
        description: "Aggiungi proprietà personalizzate alla tua epica.",
      },
      disabled: "Disabilitato",
    },
    cycles: {
      auto_schedule: {
        heading: "Pianificazione automatica dei cicli",
        description: "Mantieni i cicli in movimento senza configurazione manuale.",
        tooltip: "Crea automaticamente nuovi cicli in base alla pianificazione scelta.",
        edit_button: "Modifica",
        form: {
          cycle_title: {
            label: "Titolo del ciclo",
            placeholder: "Titolo",
            tooltip: "Il titolo sarà seguito da numeri per i cicli successivi. Ad esempio: Design - 1/2/3",
            validation: {
              required: "Il titolo del ciclo è obbligatorio",
              max_length: "Il titolo non deve superare 255 caratteri",
            },
          },
          cycle_duration: {
            label: "Durata del ciclo",
            unit: "Settimane",
            validation: {
              required: "La durata del ciclo è obbligatoria",
              min: "La durata del ciclo deve essere di almeno 1 settimana",
              max: "La durata del ciclo non può superare 30 settimane",
              positive: "La durata del ciclo deve essere positiva",
            },
          },
          cooldown_period: {
            label: "Periodo di raffreddamento",
            unit: "giorni",
            tooltip: "Pausa tra i cicli prima dell'inizio del successivo.",
            validation: {
              required: "Il periodo di raffreddamento è obbligatorio",
              negative: "Il periodo di raffreddamento non può essere negativo",
            },
          },
          start_date: {
            label: "Giorno di inizio del ciclo",
            validation: {
              required: "La data di inizio è obbligatoria",
              past: "La data di inizio non può essere nel passato",
            },
          },
          number_of_cycles: {
            label: "Numero di cicli futuri",
            validation: {
              required: "Il numero di cicli è obbligatorio",
              min: "È richiesto almeno 1 ciclo",
              max: "Non è possibile pianificare più di 3 cicli",
            },
          },
          auto_rollover: {
            label: "Trasferimento automatico degli elementi di lavoro",
            tooltip:
              "Il giorno del completamento di un ciclo, spostare tutti gli elementi di lavoro non completati nel ciclo successivo.",
          },
        },
        toast: {
          toggle: {
            loading_enable: "Attivazione pianificazione automatica dei cicli",
            loading_disable: "Disattivazione pianificazione automatica dei cicli",
            success: {
              title: "Successo!",
              message: "Pianificazione automatica dei cicli attivata con successo.",
            },
            error: {
              title: "Errore!",
              message: "Attivazione della pianificazione automatica dei cicli non riuscita.",
            },
          },
          save: {
            loading: "Salvataggio configurazione pianificazione automatica dei cicli",
            success: {
              title: "Successo!",
              message_create: "Configurazione pianificazione automatica dei cicli salvata con successo.",
              message_update: "Configurazione pianificazione automatica dei cicli aggiornata con successo.",
            },
            error: {
              title: "Errore!",
              message_create: "Salvataggio configurazione pianificazione automatica dei cicli non riuscito.",
              message_update: "Aggiornamento configurazione pianificazione automatica dei cicli non riuscito.",
            },
          },
        },
      },
    },
    features: {
      cycles: {
        title: "Cicli",
        short_title: "Cicli",
        description:
          "Pianifica il lavoro in periodi flessibili che si adattano al ritmo e al tempo unici di questo progetto.",
        toggle_title: "Abilita cicli",
        toggle_description: "Pianifica il lavoro in periodi di tempo mirati.",
      },
      modules: {
        title: "Moduli",
        short_title: "Moduli",
        description: "Organizza il lavoro in sotto-progetti con responsabili e assegnatari dedicati.",
        toggle_title: "Abilita moduli",
        toggle_description: "I membri del progetto potranno creare e modificare moduli.",
      },
      views: {
        title: "Viste",
        short_title: "Viste",
        description:
          "Salva ordinamenti, filtri e opzioni di visualizzazione personalizzati o condividili con il tuo team.",
        toggle_title: "Abilita viste",
        toggle_description: "I membri del progetto potranno creare e modificare viste.",
      },
      pages: {
        title: "Pagine",
        short_title: "Pagine",
        description: "Crea e modifica contenuti liberi: note, documenti, qualsiasi cosa.",
        toggle_title: "Abilita pagine",
        toggle_description: "I membri del progetto potranno creare e modificare pagine.",
      },
      intake: {
        intake_responsibility: "Responsabilità di accettazione",
        intake_sources: "Fonti di accettazione",
        title: "Ricezione",
        short_title: "Ricezione",
        description:
          "Consenti ai non membri di condividere bug, feedback e suggerimenti; senza interrompere il tuo flusso di lavoro.",
        toggle_title: "Abilita ricezione",
        toggle_description: "Consenti ai membri del progetto di creare richieste di ricezione nell'app.",
        toggle_tooltip_on: "Chiedi all'admin del progetto di attivarlo.",
        toggle_tooltip_off: "Chiedi all'admin del progetto di disattivarlo.",
        notify_assignee: {
          title: "Notifica assegnatari",
          description:
            "Per una nuova richiesta di accettazione, gli assegnatari predefiniti saranno avvisati tramite notifiche",
        },
        in_app: {
          title: "In-app",
          description:
            "Ricevi nuovi elementi di lavoro da membri e ospiti nel tuo spazio di lavoro senza disturbare quelli esistenti.",
        },
        email: {
          title: "Email",
          description: "Raccogli nuovi elementi di lavoro da chiunque invii un'email a un indirizzo email Plane.",
          fieldName: "ID email",
        },
        form: {
          title: "Moduli",
          description:
            "Consenti a persone esterne al tuo spazio di lavoro di creare potenziali nuovi elementi di lavoro tramite un modulo dedicato e sicuro.",
          fieldName: "URL modulo predefinito",
          create_forms: "Crea moduli utilizzando i tipi di elementi di lavoro",
          manage_forms: "Gestisci moduli",
          manage_forms_tooltip: "Chiedi all'admin dello spazio di lavoro di gestirlo.",
          create_form: "Crea modulo",
          edit_form: "Modifica dettagli modulo",
          form_title: "Titolo modulo",
          form_title_required: "Il titolo del modulo è obbligatorio",
          work_item_type: "Tipo di elemento di lavoro",
          remove_property: "Rimuovi proprietà",
          select_properties: "Seleziona proprietà",
          search_placeholder: "Cerca proprietà",
          toasts: {
            success_create: "Modulo di accettazione creato con successo",
            success_update: "Modulo di accettazione aggiornato con successo",
            error_create: "Impossibile creare il modulo di accettazione",
            error_update: "Impossibile aggiornare il modulo di accettazione",
          },
        },
        toasts: {
          set: {
            loading: "Impostazione degli assegnatari...",
            success: {
              title: "Successo!",
              message: "Assegnatari impostati con successo.",
            },
            error: {
              title: "Errore!",
              message: "Qualcosa è andato storto durante l'impostazione degli assegnatari. Riprova.",
            },
          },
        },
      },
      time_tracking: {
        title: "Monitoraggio del tempo",
        short_title: "Monitoraggio del tempo",
        description: "Registra il tempo trascorso su elementi di lavoro e progetti.",
        toggle_title: "Abilita monitoraggio del tempo",
        toggle_description: "I membri del progetto potranno registrare il tempo lavorato.",
      },
      milestones: {
        title: "Traguardi",
        short_title: "Traguardi",
        description:
          "I traguardi forniscono un livello per allineare gli elementi di lavoro verso date di completamento condivise.",
        toggle_title: "Abilita traguardi",
        toggle_description: "Organizza gli elementi di lavoro per scadenze dei traguardi.",
      },
      toasts: {
        loading: "Aggiornamento funzionalità progetto...",
        success: "Funzionalità progetto aggiornata con successo.",
        error: "Qualcosa è andato storto durante l'aggiornamento della funzionalità progetto. Riprova.",
      },
    },
  },
  project_cycles: {
    add_cycle: "Aggiungi ciclo",
    more_details: "Altri dettagli",
    cycle: "Ciclo",
    update_cycle: "Aggiorna ciclo",
    create_cycle: "Crea ciclo",
    no_matching_cycles: "Nessun ciclo corrispondente",
    remove_filters_to_see_all_cycles: "Rimuovi i filtri per vedere tutti i cicli",
    remove_search_criteria_to_see_all_cycles: "Rimuovi i criteri di ricerca per vedere tutti i cicli",
    only_completed_cycles_can_be_archived: "Solo i cicli completati possono essere archiviati",
    start_date: "Data di inizio",
    end_date: "Data di fine",
    in_your_timezone: "Nel tuo fuso orario",
    transfer_work_items: "Trasferisci {count} elementi di lavoro",
    transfer: {
      no_cycles_available: "Nessun altro ciclo disponibile per trasferire gli elementi di lavoro.",
    },
    date_range: "Intervallo di date",
    add_date: "Aggiungi data",
    active_cycle: {
      label: "Ciclo attivo",
      progress: "Avanzamento",
      chart: "Grafico di burndown",
      priority_issue: "Elementi di lavoro ad alta priorità",
      assignees: "Assegnatari",
      issue_burndown: "Burndown degli elementi di lavoro",
      ideal: "Ideale",
      current: "Corrente",
      labels: "Etichette",
      trailing: "In ritardo",
      leading: "In anticipo",
    },
    upcoming_cycle: {
      label: "Ciclo in arrivo",
    },
    completed_cycle: {
      label: "Ciclo completato",
    },
    status: {
      days_left: "Giorni rimanenti",
      completed: "Completato",
      yet_to_start: "Non ancora iniziato",
      in_progress: "In corso",
      draft: "Bozza",
    },
    action: {
      restore: {
        title: "Ripristina ciclo",
        success: {
          title: "Ciclo ripristinato",
          description: "Il ciclo è stato ripristinato.",
        },
        failed: {
          title: "Ripristino del ciclo fallito",
          description: "Il ciclo non può essere ripristinato. Per favore, riprova.",
        },
      },
      favorite: {
        loading: "Aggiunta del ciclo ai preferiti in corso",
        success: {
          description: "Ciclo aggiunto ai preferiti.",
          title: "Successo!",
        },
        failed: {
          description: "Impossibile aggiungere il ciclo ai preferiti. Per favore, riprova.",
          title: "Errore!",
        },
      },
      unfavorite: {
        loading: "Rimozione del ciclo dai preferiti in corso",
        success: {
          description: "Ciclo rimosso dai preferiti.",
          title: "Successo!",
        },
        failed: {
          description: "Impossibile rimuovere il ciclo dai preferiti. Per favore, riprova.",
          title: "Errore!",
        },
      },
      update: {
        loading: "Aggiornamento del ciclo in corso",
        success: {
          description: "Ciclo aggiornato con successo.",
          title: "Successo!",
        },
        failed: {
          description: "Errore durante l'aggiornamento del ciclo. Per favore, riprova.",
          title: "Errore!",
        },
        error: {
          already_exists:
            "Hai già un ciclo nelle date indicate, se vuoi creare una bozza di ciclo, puoi farlo rimuovendo entrambe le date.",
        },
      },
    },
    empty_state: {
      general: {
        title: "Raggruppa e definisci il tempo per il tuo lavoro in cicli.",
        description:
          "Suddividi il lavoro in blocchi temporali, lavora a ritroso dalla scadenza del tuo progetto per impostare le date e fai progressi tangibili come team.",
        primary_button: {
          text: "Imposta il tuo primo ciclo",
          comic: {
            title: "I cicli sono intervalli temporali ripetitivi.",
            description:
              "Uno sprint, un'iterazione o qualsiasi altro termine usato per il tracciamento settimanale o bisettimanale del lavoro è un ciclo.",
          },
        },
      },
      no_issues: {
        title: "Nessun elemento di lavoro aggiunto al ciclo",
        description: "Aggiungi o crea gli elementi di lavoro che desideri includere in questo ciclo",
        primary_button: {
          text: "Crea un nuovo elemento di lavoro",
        },
        secondary_button: {
          text: "Aggiungi un elemento di lavoro esistente",
        },
      },
      completed_no_issues: {
        title: "Nessun elemento di lavoro nel ciclo",
        description:
          "Nessun elemento di lavoro presente nel ciclo. Gli elementi di lavoro sono stati trasferiti o nascosti. Per visualizzare gli elementi nascosti, se presenti, aggiorna le proprietà di visualizzazione di conseguenza.",
      },
      active: {
        title: "Nessun ciclo attivo",
        description:
          "Un ciclo attivo è quello che include la data odierna nel suo intervallo. Visualizza qui i dettagli e l'avanzamento del ciclo attivo.",
      },
      archived: {
        title: "Nessun ciclo archiviato ancora",
        description:
          "Per organizzare il tuo progetto, archivia i cicli completati. Li troverai qui una volta archiviati.",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "Crea un elemento di lavoro e assegnalo a qualcuno, anche a te stesso",
        description:
          "Considera gli elementi di lavoro come compiti, attività, lavori o JTBD. Un elemento di lavoro e i suoi sotto-elementi di lavoro sono solitamente attività basate sul tempo assegnate ai membri del team. Il tuo team crea, assegna e completa gli elementi di lavoro per portare il progetto verso il suo obiettivo.",
        primary_button: {
          text: "Crea il tuo primo elemento di lavoro",
          comic: {
            title: "Gli elementi di lavoro sono i mattoni fondamentali in Plane.",
            description:
              "Ridisegna l'interfaccia di Plane, rebranding dell'azienda o lancia il nuovo sistema di iniezione del carburante sono esempi di elementi di lavoro che probabilmente hanno sotto-elementi.",
          },
        },
      },
      no_archived_issues: {
        title: "Nessun elemento di lavoro archiviato ancora",
        description:
          "Manualmente o tramite automazione, puoi archiviare gli elementi di lavoro che sono stati completati o annullati. Li troverai qui una volta archiviati.",
        primary_button: {
          text: "Imposta l'automazione",
        },
      },
      issues_empty_filter: {
        title: "Nessun elemento di lavoro trovato corrispondente ai filtri applicati",
        secondary_button: {
          text: "Cancella tutti i filtri",
        },
      },
    },
  },
  project_module: {
    add_module: "Aggiungi Modulo",
    update_module: "Aggiorna Modulo",
    create_module: "Crea Modulo",
    archive_module: "Archivia Modulo",
    restore_module: "Ripristina Modulo",
    delete_module: "Elimina modulo",
    empty_state: {
      general: {
        title: "Associa i traguardi del tuo progetto ai Moduli e traccia facilmente il lavoro aggregato.",
        description:
          "Un gruppo di elementi di lavoro che appartengono a un genitore logico e gerarchico forma un modulo. Considerali come un modo per tracciare il lavoro in base ai traguardi del progetto. Hanno i propri intervalli temporali e scadenze, oltre ad analisi che ti aiutano a vedere quanto sei vicino o lontano da un traguardo.",
        primary_button: {
          text: "Crea il tuo primo modulo",
          comic: {
            title: "I moduli aiutano a raggruppare il lavoro per gerarchia.",
            description:
              "Un modulo per il carrello, un modulo per il telaio e un modulo per il magazzino sono tutti buoni esempi di questo raggruppamento.",
          },
        },
      },
      no_issues: {
        title: "Nessun elemento di lavoro nel modulo",
        description: "Crea o aggiungi elementi di lavoro che desideri completare come parte di questo modulo",
        primary_button: {
          text: "Crea nuovi elementi di lavoro",
        },
        secondary_button: {
          text: "Aggiungi un elemento di lavoro esistente",
        },
      },
      archived: {
        title: "Nessun modulo archiviato ancora",
        description:
          "Per organizzare il tuo progetto, archivia i moduli completati o annullati. Li troverai qui una volta archiviati.",
      },
      sidebar: {
        in_active: "Questo modulo non è ancora attivo.",
        invalid_date: "Data non valida. Inserisci una data valida.",
      },
    },
    quick_actions: {
      archive_module: "Archivia modulo",
      archive_module_description: "Solo i moduli completati o annullati possono essere archiviati.",
      delete_module: "Elimina modulo",
    },
    toast: {
      copy: {
        success: "Link del modulo copiato negli appunti",
      },
      delete: {
        success: "Modulo eliminato con successo",
        error: "Impossibile eliminare il modulo",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "Salva visualizzazioni filtrate per il tuo progetto. Crea quante ne vuoi",
        description:
          "Le visualizzazioni sono un insieme di filtri salvati che usi frequentemente o a cui vuoi avere accesso rapido. Tutti i tuoi colleghi in un progetto possono vedere tutte le visualizzazioni e scegliere quella che fa per loro.",
        primary_button: {
          text: "Crea la tua prima visualizzazione",
          comic: {
            title: "Le visualizzazioni si basano sulle proprietà degli elementi di lavoro.",
            description: "Puoi creare una visualizzazione da qui con quante proprietà e filtri desideri.",
          },
        },
      },
      filter: {
        title: "Nessuna visualizzazione corrispondente",
        description: `Nessuna visualizzazione corrisponde ai criteri di ricerca.
 Crea una nuova visualizzazione invece.`,
      },
    },
    delete_view: {
      title: "Sei sicuro di voler eliminare questa visualizzazione?",
      content:
        "Se confermi, tutte le opzioni di ordinamento, filtro e visualizzazione + il layout che hai scelto per questa visualizzazione saranno eliminate permanentemente senza possibilità di ripristinarle.",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title:
          "Scrivi una nota, un documento o una vera e propria base di conoscenza. Fai partire Galileo, l'assistente AI di Plane, per aiutarti a iniziare",
        description:
          "Le pagine sono spazi per appunti in Plane. Prendi note durante le riunioni, formattale facilmente, inserisci elementi di lavoro, disponili usando una libreria di componenti e tienili tutti nel contesto del tuo progetto. Per velocizzare qualsiasi documento, invoca Galileo, l'IA di Plane, con una scorciatoia o con il clic di un pulsante.",
        primary_button: {
          text: "Crea la tua prima pagina",
        },
      },
      private: {
        title: "Nessuna pagina privata ancora",
        description:
          "Tieni qui i tuoi appunti privati. Quando sarai pronto a condividerli, il team sarà a portata di clic.",
        primary_button: {
          text: "Crea la tua prima pagina",
        },
      },
      public: {
        title: "Nessuna pagina pubblica ancora",
        description: "Visualizza qui le pagine condivise con tutti nel tuo progetto.",
        primary_button: {
          text: "Crea la tua prima pagina",
        },
      },
      archived: {
        title: "Nessuna pagina archiviata ancora",
        description: "Archivia le pagine che non sono più di tuo interesse. Potrai accedervi quando necessario.",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "Nessun risultato trovato",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "Nessun elemento di lavoro corrispondente trovato",
      },
      no_issues: {
        title: "Nessun elemento di lavoro trovato",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "Nessun commento ancora",
        description: "I commenti possono essere usati come spazio per discussioni e follow-up sugli elementi di lavoro",
      },
    },
  },
  notification: {
    label: "Notifiche",
    page_label: "{workspace} - Notifiche",
    options: {
      mark_all_as_read: "Segna tutto come letto",
      mark_read: "Segna come letto",
      mark_unread: "Segna come non letto",
      refresh: "Aggiorna",
      filters: "Filtri Notifiche",
      show_unread: "Mostra non lette",
      show_snoozed: "Mostra snoozate",
      show_archived: "Mostra archiviate",
      mark_archive: "Archivia",
      mark_unarchive: "Rimuovi da archivio",
      mark_snooze: "Snoozed",
      mark_unsnooze: "Annulla snooze",
    },
    toasts: {
      read: "Notifica segnata come letta",
      unread: "Notifica segnata come non letta",
      archived: "Notifica archiviata",
      unarchived: "Notifica rimossa dall'archivio",
      snoozed: "Notifica snoozata",
      unsnoozed: "Notifica desnoozata",
    },
    empty_state: {
      detail: {
        title: "Seleziona per visualizzare i dettagli.",
      },
      all: {
        title: "Nessun elemento di lavoro assegnato",
        description: "Qui puoi vedere gli aggiornamenti degli elementi di lavoro assegnati a te",
      },
      mentions: {
        title: "Nessun elemento di lavoro assegnato",
        description: "Qui puoi vedere gli aggiornamenti degli elementi di lavoro assegnati a te",
      },
    },
    tabs: {
      all: "Tutti",
      mentions: "Menzioni",
    },
    filter: {
      assigned: "Assegnati a me",
      created: "Creati da me",
      subscribed: "Iscritti da me",
    },
    snooze: {
      "1_day": "1 giorno",
      "3_days": "3 giorni",
      "5_days": "5 giorni",
      "1_week": "1 settimana",
      "2_weeks": "2 settimane",
      custom: "Personalizzato",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "Aggiungi elementi di lavoro al ciclo per visualizzarne l'avanzamento",
      },
      chart: {
        title: "Aggiungi elementi di lavoro al ciclo per visualizzare il grafico di burndown.",
      },
      priority_issue: {
        title: "Visualizza in anteprima gli elementi di lavoro ad alta priorità del ciclo.",
      },
      assignee: {
        title: "Aggiungi assegnatari agli elementi di lavoro per vedere la ripartizione per assegnatario.",
      },
      label: {
        title: "Aggiungi etichette agli elementi di lavoro per vedere la ripartizione per etichette.",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "L'accoglienza non è abilitata per il progetto.",
        description:
          "L'accoglienza ti aiuta a gestire le richieste in entrata per il tuo progetto e ad aggiungerle come elementi di lavoro nel tuo flusso. Abilita l'accoglienza dalle impostazioni del progetto per gestire le richieste.",
        primary_button: {
          text: "Gestisci funzionalità",
        },
      },
      cycle: {
        title: "I cicli non sono abilitati per questo progetto.",
        description:
          "Suddividi il lavoro in blocchi temporali, lavora a ritroso dalla scadenza del tuo progetto per impostare le date e fai progressi tangibili come team. Abilita la funzionalità dei cicli per il tuo progetto per iniziare a usarli.",
        primary_button: {
          text: "Gestisci funzionalità",
        },
      },
      module: {
        title: "I moduli non sono abilitati per il progetto.",
        description:
          "I moduli sono i blocchi costitutivi del tuo progetto. Abilita i moduli dalle impostazioni del progetto per iniziare a usarli.",
        primary_button: {
          text: "Gestisci funzionalità",
        },
      },
      page: {
        title: "Le pagine non sono abilitate per il progetto.",
        description:
          "Le pagine sono i blocchi costitutivi del tuo progetto. Abilita le pagine dalle impostazioni del progetto per iniziare a usarle.",
        primary_button: {
          text: "Gestisci funzionalità",
        },
      },
      view: {
        title: "Le visualizzazioni non sono abilitate per il progetto.",
        description:
          "Le visualizzazioni sono i blocchi costitutivi del tuo progetto. Abilita le visualizzazioni dalle impostazioni del progetto per iniziare a usarle.",
        primary_button: {
          text: "Gestisci funzionalità",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "Bozza di un elemento di lavoro",
    empty_state: {
      title: "Le bozze degli elementi di lavoro e, presto, anche i commenti appariranno qui.",
      description:
        "Per provarlo, inizia ad aggiungere un elemento di lavoro e lascialo a metà o crea la tua prima bozza qui sotto. 😉",
      primary_button: {
        text: "Crea la tua prima bozza",
      },
    },
    delete_modal: {
      title: "Elimina bozza",
      description: "Sei sicuro di voler eliminare questa bozza? Questa azione non può essere annullata.",
    },
    toasts: {
      created: {
        success: "Bozza creata",
        error: "Impossibile creare l'elemento di lavoro. Per favore, riprova.",
      },
      deleted: {
        success: "Bozza eliminata",
      },
    },
  },
  stickies: {
    title: "I tuoi stickies",
    placeholder: "clicca per scrivere qui",
    all: "Tutti gli stickies",
    "no-data": "Annota un'idea, cattura un aha o registra un lampo di genio. Aggiungi uno sticky per iniziare.",
    add: "Aggiungi sticky",
    search_placeholder: "Cerca per titolo",
    delete: "Elimina sticky",
    delete_confirmation: "Sei sicuro di voler eliminare questo sticky?",
    empty_state: {
      simple: "Annota un'idea, cattura un aha o registra un lampo di genio. Aggiungi uno sticky per iniziare.",
      general: {
        title: "Gli stickies sono note rapide e cose da fare che annoti al volo.",
        description:
          "Cattura i tuoi pensieri e idee senza sforzo creando stickies a cui puoi accedere in qualsiasi momento e ovunque.",
        primary_button: {
          text: "Aggiungi sticky",
        },
      },
      search: {
        title: "Non corrisponde a nessuno dei tuoi stickies.",
        description: "Prova con un termine diverso o facci sapere se sei sicuro che la tua ricerca sia corretta.",
        primary_button: {
          text: "Aggiungi sticky",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "Il nome dello sticky non può superare i 100 caratteri.",
        already_exists: "Esiste già uno sticky senza descrizione",
      },
      created: {
        title: "Sticky creato",
        message: "Lo sticky è stato creato con successo",
      },
      not_created: {
        title: "Sticky non creato",
        message: "Lo sticky non può essere creato",
      },
      updated: {
        title: "Sticky aggiornato",
        message: "Lo sticky è stato aggiornato con successo",
      },
      not_updated: {
        title: "Sticky non aggiornato",
        message: "Lo sticky non può essere aggiornato",
      },
      removed: {
        title: "Sticky rimosso",
        message: "Lo sticky è stato rimosso con successo",
      },
      not_removed: {
        title: "Sticky non rimosso",
        message: "Lo sticky non può essere rimosso",
      },
    },
  },
  role_details: {
    guest: {
      title: "Ospite",
      description: "I membri esterni alle organizzazioni possono essere invitati come ospiti.",
    },
    member: {
      title: "Membro",
      description:
        "Permette di leggere, scrivere, modificare ed eliminare entità all'interno di progetti, cicli e moduli.",
    },
    admin: {
      title: "Amministratore",
      description: "Tutti i permessi impostati su true all'interno dello spazio di lavoro.",
    },
  },
  user_roles: {
    product_or_project_manager: "Product / Project Manager",
    development_or_engineering: "Sviluppo / Ingegneria",
    founder_or_executive: "Fondatore / Dirigente",
    freelancer_or_consultant: "Freelance / Consulente",
    marketing_or_growth: "Marketing / Crescita",
    sales_or_business_development: "Vendite / Sviluppo commerciale",
    support_or_operations: "Supporto / Operazioni",
    student_or_professor: "Studente / Professore",
    human_resources: "Risorse umane",
    other: "Altro",
  },
  importer: {
    github: {
      title: "Github",
      description: "Importa elementi di lavoro dai repository GitHub e sincronizzali.",
    },
    jira: {
      title: "Jira",
      description: "Importa elementi di lavoro ed epic dai progetti e dagli epic di Jira.",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "Esporta elementi di lavoro in un file CSV.",
      short_description: "Esporta come CSV",
    },
    excel: {
      title: "Excel",
      description: "Esporta elementi di lavoro in un file Excel.",
      short_description: "Esporta come Excel",
    },
    xlsx: {
      title: "Excel",
      description: "Esporta elementi di lavoro in un file Excel.",
      short_description: "Esporta come Excel",
    },
    json: {
      title: "JSON",
      description: "Esporta elementi di lavoro in un file JSON.",
      short_description: "Esporta come JSON",
    },
  },
  default_global_view: {
    all_issues: "Tutti gli elementi di lavoro",
    assigned: "Assegnati",
    created: "Creati",
    subscribed: "Iscritti",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "Preferenza di sistema",
      },
      light: {
        label: "Chiaro",
      },
      dark: {
        label: "Scuro",
      },
      light_contrast: {
        label: "Contrasto elevato chiaro",
      },
      dark_contrast: {
        label: "Contrasto elevato scuro",
      },
      custom: {
        label: "Tema personalizzato",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "Backlog",
      planned: "Pianificato",
      in_progress: "In corso",
      paused: "In pausa",
      completed: "Completato",
      cancelled: "Annullato",
    },
    layout: {
      list: "Layout a lista",
      board: "Layout a galleria",
      timeline: "Layout a timeline",
    },
    order_by: {
      name: "Nome",
      progress: "Avanzamento",
      issues: "Numero di elementi di lavoro",
      due_date: "Scadenza",
      created_at: "Data di creazione",
      manual: "Manuale",
    },
  },
  cycle: {
    label: "{count, plural, one {Ciclo} other {Cicli}}",
    no_cycle: "Nessun ciclo",
  },
  module: {
    label: "{count, plural, one {Modulo} other {Moduli}}",
    no_module: "Nessun modulo",
  },
  description_versions: {
    last_edited_by: "Ultima modifica di",
    previously_edited_by: "Precedentemente modificato da",
    edited_by: "Modificato da",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane non si è avviato. Questo potrebbe essere dovuto al fatto che uno o più servizi Plane non sono riusciti ad avviarsi.",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "Scegli View Logs da setup.sh e dai log Docker per essere sicuro.",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "Schema",
        empty_state: {
          title: "Intestazioni mancanti",
          description: "Aggiungiamo alcune intestazioni a questa pagina per vederle qui.",
        },
      },
      info: {
        label: "Info",
        document_info: {
          words: "Parole",
          characters: "Caratteri",
          paragraphs: "Paragrafi",
          read_time: "Tempo di lettura",
        },
        actors_info: {
          edited_by: "Modificato da",
          created_by: "Creato da",
        },
        version_history: {
          label: "Cronologia versioni",
          current_version: "Versione corrente",
          highlight_changes: "Evidenzia modifiche",
        },
      },
      assets: {
        label: "Risorse",
        download_button: "Scarica",
        empty_state: {
          title: "Immagini mancanti",
          description: "Aggiungi immagini per vederle qui.",
        },
      },
    },
    open_button: "Apri pannello di navigazione",
    close_button: "Chiudi pannello di navigazione",
    outline_floating_button: "Apri schema",
  },
  workspace_dashboards: "Dashboard",
  pi_chat: "Plane AI",
  in_app: "In-app",
  forms: "Moduli",
  choose_workspace_for_integration: "Scegli uno spazio di lavoro per connettere questa app",
  integrations_description:
    "Le app che funzionano con Plane devono connettersi a uno spazio di lavoro dove sei amministratore.",
  create_a_new_workspace: "Crea uno spazio di lavoro nuovo",
  learn_more_about_workspaces: "Scopri di più sui tuoi spazi di lavoro",
  no_workspaces_to_connect: "Nessuno spazio di lavoro per connettere",
  no_workspaces_to_connect_description:
    "Devi creare uno spazio di lavoro per poter connettere le integrazioni e i modelli",
  updates: {
    add_update: "Aggiungi aggiornamento",
    add_update_placeholder: "Scrivi il tuo aggiornamento qui",
    empty: {
      title: "Nessun aggiornamento",
      description: "Puoi vedere gli aggiornamenti qui.",
    },
    delete: {
      title: "Elimina aggiornamento",
      confirmation: "Sei sicuro di voler eliminare questo aggiornamento? Questa azione è irreversibile.",
      success: {
        title: "Aggiornamento eliminato",
        message: "L'aggiornamento è stato eliminato con successo.",
      },
      error: {
        title: "Aggiornamento non eliminato",
        message: "L'aggiornamento non può essere eliminato.",
      },
    },
    reaction: {
      create: {
        success: {
          title: "Reazione creata",
          message: "Reazione creata con successo.",
        },
        error: {
          title: "Reazione non creata",
          message: "La reazione non può essere creata.",
        },
      },
      remove: {
        success: {
          title: "Reazione eliminata",
          message: "Reazione eliminata con successo.",
        },
        error: {
          title: "Reazione non eliminata",
          message: "La reazione non può essere eliminata.",
        },
      },
    },
    progress: {
      title: "Progresso",
      since_last_update: "Dal ultimo aggiornamento",
      comments: "{count, plural, one {# commento} other {# commenti}}",
    },
    create: {
      success: {
        title: "Aggiornamento creato",
        message: "Aggiornamento creato con successo.",
      },
      error: {
        title: "Aggiornamento non creato",
        message: "L'aggiornamento non può essere creato.",
      },
    },
    update: {
      success: {
        title: "Aggiornamento aggiornato",
        message: "Aggiornamento aggiornato con successo.",
      },
      error: {
        title: "Aggiornamento non aggiornato",
        message: "L'aggiornamento non può essere aggiornato.",
      },
    },
  },
  teamspaces: {
    label: "Teamspaces",
    empty_state: {
      general: {
        title: "I teamspaces sbloccano una migliore organizzazione e tracciamento in Plane.",
        description:
          "Crea una superficie dedicata per ogni team reale, separata da tutte le altre superfici di lavoro in Plane, e personalizzale per adattarle a come lavora il tuo team.",
        primary_button: {
          text: "Crea un nuovo teamspace",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "Non hai ancora collegato alcun teamspace.",
          description: "I proprietari del teamspace e del progetto possono gestire l'accesso ai progetti.",
        },
      },
      primary_button: {
        text: "Collega un teamspace",
      },
      secondary_button: {
        text: "Scopri di più",
      },
      table: {
        columns: {
          teamspaceName: "Nome teamspace",
          members: "Membri",
          accountType: "Tipo di account",
        },
        actions: {
          remove: {
            button: {
              text: "Rimuovi teamspace",
            },
            confirm: {
              title: "Rimuovi {teamspaceName} da {projectName}",
              description:
                "Quando rimuovi questo teamspace da un progetto collegato, i membri qui perderanno l'accesso al progetto collegato.",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "Nessun teamspace corrispondente trovato",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {Hai collegato un teamspace a questo progetto.} other {Hai collegato # teamspace a questo progetto.}}",
            description:
              "{additionalCount, plural, =0 {Il teamspace {firstTeamspaceName} è ora collegato a questo progetto.} other {Il teamspace {firstTeamspaceName} e altri {additionalCount} sono ora collegati a questo progetto.}}",
          },
          error: {
            title: "Non è andato a buon fine.",
            description: "Riprova o ricarica questa pagina prima di riprovare.",
          },
        },
        remove_teamspace: {
          success: {
            title: "Hai rimosso quel teamspace da questo progetto.",
            description: "Il teamspace {teamspaceName} è stato rimosso da {projectName}.",
          },
          error: {
            title: "Non è andato a buon fine.",
            description: "Riprova o ricarica questa pagina prima di riprovare.",
          },
        },
      },
      link_teamspace: {
        placeholder: "Cerca teamspace",
        info: {
          title: "Aggiungere un teamspace concede a tutti i membri del teamspace l'accesso a questo progetto.",
          link: "Scopri di più",
        },
        empty_state: {
          no_teamspaces: {
            title: "Non hai teamspace da collegare.",
            description:
              "O non sei in un teamspace che puoi collegare o hai già collegato tutti i teamspace disponibili.",
          },
          no_results: {
            title: "Non corrisponde a nessuno dei tuoi teamspace.",
            description: "Prova un altro termine o assicurati di avere teamspace da collegare.",
          },
        },
        primary_button: {
          text: "Collega i teamspace selezionati",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "Crea elementi di lavoro specifici per il team.",
        description:
          "Gli elementi di lavoro assegnati ai membri di questo team in qualsiasi progetto collegato appariranno automaticamente qui. Se ti aspetti di vedere alcuni elementi di lavoro qui, assicurati che i tuoi progetti collegati abbiano elementi di lavoro assegnati ai membri di questo team o crea elementi di lavoro.",
        primary_button: {
          text: "Aggiungi elementi di lavoro a un progetto collegato",
        },
      },
      work_items_empty_filter: {
        title: "Non ci sono elementi di lavoro specifici per il team per i filtri applicati",
        description:
          "Cambia alcuni di quei filtri o cancellali tutti per vedere gli elementi di lavoro rilevanti per questo spazio.",
        secondary_button: {
          text: "Cancella tutti i filtri",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "Nessuno dei tuoi progetti collegati ha un ciclo attivo.",
        description:
          "I cicli attivi nei progetti collegati appariranno automaticamente qui. Se ti aspetti di vedere un ciclo attivo, assicurati che sia in esecuzione in un progetto collegato in questo momento.",
      },
      completed: {
        title: "Nessuno dei tuoi progetti collegati ha un ciclo completato.",
        description:
          "I cicli completati nei progetti collegati appariranno automaticamente qui. Se ti aspetti di vedere un ciclo completato, assicurati che sia anche completato in un progetto collegato.",
      },
      upcoming: {
        title: "Nessuno dei tuoi progetti collegati ha un ciclo imminente.",
        description:
          "I cicli imminenti nei progetti collegati appariranno automaticamente qui. Se ti aspetti di vedere un ciclo imminente, assicurati che sia presente in un progetto collegato, anche.",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title: "Le viste del tuo team sul tuo lavoro senza interrompere altre viste nel tuo workspace",
        description:
          "Vedi il lavoro del tuo team in viste salvate solo per il tuo team e separatamente dalle viste di un progetto.",
        primary_button: {
          text: "Crea una vista",
        },
      },
      filter: {
        title: "Nessuna vista corrispondente",
        description: `Nessuna vista corrisponde ai criteri di ricerca.
 Crea una nuova vista invece.`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "Conserva la conoscenza del tuo team nelle Pagine del Team.",
        description:
          "A differenza delle pagine in un progetto, puoi salvare conoscenze specifiche per un team in un insieme separato di pagine qui. Ottieni tutte le funzionalità delle Pagine, crea documenti di best practices e wiki di team facilmente.",
        primary_button: {
          text: "Crea la tua prima pagina del team",
        },
      },
      filter: {
        title: "Nessuna pagina corrispondente",
        description: "Rimuovi i filtri per vedere tutte le pagine",
      },
      search: {
        title: "Nessuna pagina corrispondente",
        description: "Rimuovi i criteri di ricerca per vedere tutte le pagine",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "Nessuno dei tuoi progetti collegati ha pubblicato elementi di lavoro.",
        description:
          "Crea alcuni elementi di lavoro in uno o più di quei progetti per vedere i progressi per date, stati e priorità.",
      },
      relation: {
        blocking: {
          title: "Non hai elementi di lavoro che bloccano un compagno di squadra.",
          description: "Ottimo lavoro! Hai liberato la strada per il tuo team. Sei un buon compagno di squadra.",
        },
        blocked: {
          title: "Non hai elementi di lavoro di un compagno di squadra che ti bloccano.",
          description: "Buone notizie! Puoi fare progressi su tutti i tuoi elementi di lavoro assegnati.",
        },
      },
      stats: {
        general: {
          title: "Nessuno dei tuoi progetti collegati ha pubblicato elementi di lavoro.",
          description:
            "Crea alcuni elementi di lavoro in uno o più di quei progetti per vedere la distribuzione del lavoro per progetto e membri del team.",
        },
        filter: {
          title: "Non ci sono statistiche di squadra per i filtri applicati.",
          description:
            "Crea alcuni elementi di lavoro in uno o più di quei progetti per vedere la distribuzione del lavoro per progetto e membri del team.",
        },
      },
    },
  },
  initiatives: {
    overview: "Panoramica",
    label: "Iniziative",
    placeholder: "{count, plural, one{# iniziativa} other{# iniziative}}",
    add_initiative: "Aggiungi Iniziativa",
    create_initiative: "Crea Iniziativa",
    update_initiative: "Aggiorna Iniziativa",
    initiative_name: "Nome dell'iniziativa",
    all_initiatives: "Tutte le Iniziative",
    delete_initiative: "Elimina Iniziativa",
    fill_all_required_fields: "Si prega di compilare tutti i campi obbligatori.",
    toast: {
      create_success: "Iniziativa {name} creata con successo.",
      create_error: "Impossibile creare l'iniziativa. Si prega di riprovare!",
      update_success: "Iniziativa {name} aggiornata con successo.",
      update_error: "Impossibile aggiornare l'iniziativa. Si prega di riprovare!",
      delete: {
        success: "Iniziativa eliminata con successo.",
        error: "Impossibile eliminare l'iniziativa",
      },
      link_copied: "Link dell'iniziativa copiato negli appunti.",
      project_update_success: "Progetti dell'iniziativa aggiornati con successo.",
      project_update_error: "Impossibile aggiornare i progetti dell'iniziativa. Si prega di riprovare!",
      epic_update_success:
        "Epic{count, plural, one { aggiunto all'iniziativa con successo.} other {s aggiunti all'iniziativa con successo.}}",
      epic_update_error: "Aggiunta dell'epic all'iniziativa fallita. Si prega di riprovare più tardi.",
      state_update_success: "Stato dell'iniziativa aggiornato con successo.",
      state_update_error: "Aggiornamento dello stato dell'iniziativa non riuscito. Per favore riprova!",
      label_update_error: "Impossibile aggiornare le etichette dell'iniziativa. Riprova!",
    },
    empty_state: {
      general: {
        title: "Organizza il lavoro al livello più alto con le Iniziative",
        description:
          "Quando hai bisogno di organizzare il lavoro che attraversa diversi progetti e team, le Iniziative sono utili. Collega progetti ed epiche alle iniziative, vedi aggiornamenti automaticamente aggregati e osserva le foreste prima di arrivare agli alberi.",
        primary_button: {
          text: "Crea un'iniziativa",
        },
      },
      search: {
        title: "Nessuna iniziativa corrispondente",
        description: `Nessuna iniziativa rilevata con i criteri corrispondenti.
 Crea una nuova iniziativa invece.`,
      },
      not_found: {
        title: "L'iniziativa non esiste",
        description: "L'iniziativa che stai cercando non esiste, è stata archiviata o è stata eliminata.",
        primary_button: {
          text: "Visualizza altre iniziative",
        },
      },
      epics: {
        title: "Non hai epiche che corrispondono ai filtri che hai applicato.",
        subHeading: "Per vedere tutte le epiche, cancella tutti i filtri applicati.",
        action: "Cancella filtri",
      },
    },
    scope: {
      view_scope: "Visualizza ambito",
      breakdown: "Scomposizione ambito",
      add_scope: "Aggiungi ambito",
      label: "Ambito",
      empty_state: {
        title: "Nessun ambito aggiunto a questa iniziativa",
        description: "Collega progetti e epiche e traccia quel lavoro in questo spazio.",
        primary_button: {
          text: "Aggiungi ambito",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "Etichette",
        description: "Struttura e organizza le tue iniziative con le etichette.",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "Elimina etichetta",
        content:
          "Sei sicuro di voler eliminare {labelName}? Questo rimuoverà l'etichetta da tutte le iniziative e da tutte le visualizzazioni in cui l'etichetta è filtrata.",
      },
      toast: {
        delete_error: "L'etichetta dell'iniziativa non può essere eliminata. Riprova.",
        label_already_exists: "L'etichetta esiste già",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title:
          "Scrivi una nota, un documento o una base di conoscenza completa. Fai partire Galileo, l'assistente AI di Plane, per aiutarti a iniziare",
        description:
          "Le pagine sono spazi di pensiero in Plane. Prendi appunti durante le riunioni, formattali facilmente, incorpora elementi di lavoro, disponili utilizzando una libreria di componenti e mantienili tutti nel contesto del tuo progetto. Per semplificare qualsiasi documento, invoca Galileo, l'AI di Plane, con una scorciatoia o con un clic di un pulsante.",
        primary_button: {
          text: "Crea la tua prima pagina",
        },
      },
      private: {
        title: "Nessuna pagina privata ancora",
        description:
          "Tieni qui i tuoi pensieri privati. Quando sei pronto a condividere, il team è a un clic di distanza.",
        primary_button: {
          text: "Crea la tua prima pagina",
        },
      },
      public: {
        title: "Nessuna pagina dello spazio di lavoro ancora",
        description: "Vedi le pagine condivise con tutti nel tuo spazio di lavoro proprio qui.",
        primary_button: {
          text: "Crea la tua prima pagina",
        },
      },
      archived: {
        title: "Nessuna pagina archiviata ancora",
        description: "Archivia le pagine che non sono nella tua lista di priorità. Accedile qui quando necessario.",
      },
    },
  },
  epics: {
    label: "Epiche",
    no_epics_selected: "Nessuna epica selezionata",
    add_selected_epics: "Aggiungi epiche selezionate",
    epic_link_copied_to_clipboard: "Link dell'epica copiato negli appunti.",
    project_link_copied_to_clipboard: "Link del progetto copiato negli appunti",
    empty_state: {
      general: {
        title: "Crea un'epica e assegnala a qualcuno, anche a te stesso",
        description:
          "Per corpi di lavoro più grandi che attraversano diversi cicli e possono vivere su più moduli, crea un'epica. Collega elementi di lavoro e elementi di lavoro secondari in un progetto a un'epica e salta in un elemento di lavoro dalla panoramica.",
        primary_button: {
          text: "Crea un'epica",
        },
      },
      section: {
        title: "Nessuna epica ancora",
        description: "Inizia aggiungendo epiche per gestire e tracciare il progresso.",
        primary_button: {
          text: "Aggiungi epiche",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "Nessuna epica corrispondente trovata",
      },
      no_epics: {
        title: "Nessuna epica trovata",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "Nessun ciclo attivo",
        description:
          "I cicli dei tuoi progetti che includono qualsiasi periodo che comprende la data di oggi entro il suo intervallo. Trova il progresso e i dettagli di tutti i tuoi cicli attivi qui.",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: `Aggiungi elementi di lavoro al ciclo per vedere il suo
 progresso`,
      },
      priority: {
        title: `Osserva elementi di lavoro ad alta priorità affrontati in
 il ciclo a colpo d'occhio.`,
      },
      assignee: {
        title: `Aggiungi assegnatari agli elementi di lavoro per vedere una
 distribuzione del lavoro per assegnatari.`,
      },
      label: {
        title: `Aggiungi etichette agli elementi di lavoro per vedere la
 distribuzione del lavoro per etichette.`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "Importa membri da CSV",
      description: "Carica un CSV con colonne: Email, Display Name, First Name, Last Name, Role (5, 15 o 20)",
      dropzone: {
        active: "Rilascia il file CSV qui",
        inactive: "Trascina e rilascia o fai clic per caricare",
        file_type: "Sono supportati solo file .csv",
      },
      buttons: {
        cancel: "Annulla",
        import: "Importa",
        try_again: "Riprova",
        close: "Chiudi",
        done: "Fatto",
      },
      progress: {
        uploading: "Caricamento...",
        importing: "Importazione...",
      },
      summary: {
        title: {
          failed: "Importazione fallita",
          complete: "Importazione completata",
        },
        message: {
          seat_limit: "Impossibile importare membri a causa di restrizioni sui posti disponibili.",
          success: "{count} membr{plural} aggiunt{plural} con successo allo spazio di lavoro.",
          no_imports: "Nessun membro è stato importato dal file CSV.",
        },
        stats: {
          successful: "Riusciti",
          failed: "Falliti",
        },
        download_errors: "Scarica errori",
      },
      toast: {
        invalid_file: {
          title: "File non valido",
          message: "Sono supportati solo file CSV.",
        },
        import_failed: {
          title: "Importazione fallita",
          message: "Qualcosa è andato storto.",
        },
      },
    },
  },
  project: {
    members_import: {
      title: "Importa membri da CSV",
      description:
        "Carica un CSV con colonne: Email e Ruolo (5=Ospite, 15=Membro, 20=Amministratore). Gli utenti devono già essere membri dello spazio di lavoro.",
      download_sample: "Scarica CSV di esempio",
      dropzone: {
        active: "Rilascia il file CSV qui",
        inactive: "Trascina e rilascia o fai clic per caricare",
        file_type: "Sono supportati solo file .csv",
      },
      buttons: {
        cancel: "Annulla",
        import: "Importa",
        try_again: "Riprova",
        close: "Chiudi",
        done: "Fatto",
      },
      progress: {
        uploading: "Caricamento...",
        importing: "Importazione...",
      },
      summary: {
        title: {
          complete: "Importazione completata",
        },
        message: {
          success: "{count} membr{plural} importat{plural} con successo nel progetto.",
          no_imports: "Nessun nuovo membro è stato importato dal file CSV.",
        },
        stats: {
          added: "Aggiunti",
          reactivated: "Riattivati",
          already_members: "Già membri",
          skipped: "Ignorati",
        },
        download_errors: "Scarica dettagli ignorati",
      },
      toast: {
        invalid_file: {
          title: "File non valido",
          message: "Sono supportati solo file CSV.",
        },
        import_failed: {
          title: "Importazione fallita",
          message: "Qualcosa è andato storto.",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "Impossibile archiviare gli elementi di lavoro",
        message:
          "Solo gli elementi di lavoro appartenenti a gruppi di stato completati o annullati possono essere archiviati.",
      },
      invalid_issue_start_date: {
        title: "Impossibile aggiornare gli elementi di lavoro",
        message:
          "La data di inizio selezionata supera la data di scadenza per alcuni elementi di lavoro. Assicurati che la data di inizio sia precedente alla data di scadenza.",
      },
      invalid_issue_target_date: {
        title: "Impossibile aggiornare gli elementi di lavoro",
        message:
          "La data di scadenza selezionata precede la data di inizio per alcuni elementi di lavoro. Assicurati che la data di scadenza sia successiva alla data di inizio.",
      },
      invalid_state_transition: {
        title: "Impossibile aggiornare gli elementi di lavoro",
        message:
          "Il cambiamento di stato non è consentito per alcuni elementi di lavoro. Assicurati che il cambiamento di stato sia consentito.",
      },
    },
  },
  work_item_types: {
    label: "Tipi di elemento di lavoro",
    label_lowercase: "tipi di elementi di lavoro",
    settings: {
      title: "Tipi di elemento di lavoro",
      properties: {
        title: "Proprietà personalizzate",
        tooltip:
          "Ogni tipo di elemento di lavoro viene fornito con un set predefinito di proprietà come Titolo, Descrizione, Assegnatario, Stato, Priorità, Data di inizio, Data di scadenza, Modulo, Ciclo etc. Puoi anche personalizzare e aggiungere le tue proprietà per adattarle alle esigenze del tuo team.",
        add_button: "Aggiungi nuova proprietà",
        dropdown: {
          label: "Tipo di proprietà",
          placeholder: "Seleziona tipo",
        },
        property_type: {
          text: {
            label: "Testo",
          },
          number: {
            label: "Numero",
          },
          dropdown: {
            label: "Dropdown",
          },
          boolean: {
            label: "Booleano",
          },
          date: {
            label: "Data",
          },
          member_picker: {
            label: "Seleziona membro",
          },
          release_picker: {
            label: "Selettore release",
          },
          formula: {
            label: "Formula",
          },
        },
        attributes: {
          label: "Attributi",
          text: {
            single_line: {
              label: "Singola riga",
            },
            multi_line: {
              label: "Paragrafo",
            },
            readonly: {
              label: "Solo lettura",
              header: "Dati solo lettura",
            },
            invalid_text_format: {
              label: "Formato testo non valido",
            },
          },
          number: {
            default: {
              placeholder: "Aggiungi numero",
            },
          },
          relation: {
            single_select: {
              label: "Selezione singola",
            },
            multi_select: {
              label: "Selezione multipla",
            },
            no_default_value: {
              label: "Nessun valore predefinito",
            },
          },
          boolean: {
            label: "Vero | Falso",
            no_default: "Nessun valore predefinito",
          },
          option: {
            create_update: {
              label: "Opzioni",
              form: {
                placeholder: "Aggiungi opzione",
                errors: {
                  name: {
                    required: "Il nome dell'opzione è obbligatorio.",
                    integrity: "Esiste già un'opzione con lo stesso nome.",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "Seleziona opzione",
                multi: {
                  default: "Seleziona opzioni",
                  variable: "{count} opzioni selezionate",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "Successo!",
              message: "Proprietà {name} creata con successo.",
            },
            error: {
              title: "Errore!",
              message: "Impossibile creare la proprietà. Si prega di riprovare!",
            },
          },
          update: {
            success: {
              title: "Successo!",
              message: "Proprietà {name} aggiornata con successo.",
            },
            error: {
              title: "Errore!",
              message: "Impossibile aggiornare la proprietà. Si prega di riprovare!",
            },
          },
          delete: {
            success: {
              title: "Successo!",
              message: "Proprietà {name} eliminata con successo.",
            },
            error: {
              title: "Errore!",
              message: "Impossibile eliminare la proprietà. Si prega di riprovare!",
            },
          },
          enable_disable: {
            loading: "{action} {name} proprietà",
            success: {
              title: "Successo!",
              message: "Proprietà {name} {action} con successo.",
            },
            error: {
              title: "Errore!",
              message: "Impossibile {action} la proprietà. Si prega di riprovare!",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "Titolo",
            },
            description: {
              placeholder: "Descrizione",
            },
          },
          errors: {
            name: {
              required: "Devi nominare la tua proprietà.",
              max_length: "Il nome della proprietà non deve superare i 255 caratteri.",
            },
            property_type: {
              required: "Devi selezionare un tipo di proprietà.",
            },
            options: {
              required: "Devi aggiungere almeno una opzione.",
            },
            formula: {
              required: "L'espressione della formula è obbligatoria.",
              invalid: "Formula non valida: {error}",
              circular_reference:
                "Riferimento circolare rilevato. Una formula non può fare riferimento a se stessa direttamente o indirettamente.",
              invalid_reference: "La formula fa riferimento a una proprietà inesistente.",
            },
          },
        },
        formula: {
          field_label: "Campo formula",
          tooltip: "Inserisci una formula usando la sintassi '{'Nome campo'}'. Supporta gli operatori +, -, *, / e &.",
          placeholder: "Scrivi la formula",
          test_button: "Test",
          validating: "Validazione in corso",
          validation_success: "La formula è valida! Restituisce {resultType}",
          validation_success_with_refs:
            "La formula è valida! Restituisce {resultType} ({count} campo/i referenziato/i)",
          error: {
            empty: "Inserisci una formula",
            missing_context: "Contesto dello spazio di lavoro, del progetto o del tipo di elemento di lavoro mancante",
            validation_failed: "Validazione fallita",
          },
          picker: {
            no_match: "Nessuna proprietà corrispondente",
            no_available: "Nessuna proprietà disponibile",
          },
        },
        enable_disable: {
          label: "Attivo",
          tooltip: {
            disabled: "Clicca per disattivare",
            enabled: "Clicca per attivare",
          },
        },
        delete_confirmation: {
          title: "Elimina questa proprietà",
          description: "La cancellazione delle proprietà può portare alla perdita di dati esistenti.",
          secondary_description: "Vuoi disattivare la proprietà invece?",
          primary_button: "{action}, elimina",
          secondary_button: "Sì, disattiva",
        },
        mandate_confirmation: {
          label: "Proprietà obbligatoria",
          content:
            "Sembra esserci un valore predefinito per questa proprietà. Rendere la proprietà obbligatoria rimuoverà il valore predefinito e gli utenti dovranno aggiungere un valore di loro scelta.",
          tooltip: {
            disabled: "Questo tipo di proprietà non può essere reso obbligatorio",
            enabled: "Deseleziona per marcare il campo come facoltativo",
            checked: "Seleziona per marcare il campo come obbligatorio",
          },
        },
        empty_state: {
          title: "Aggiungi proprietà personalizzate",
          description: "Nuove proprietà che aggiungi per questo tipo di elemento di lavoro appariranno qui.",
        },
      },
      item_delete_confirmation: {
        title: "Elimina questo tipo",
        description: "L'eliminazione dei tipi può comportare la perdita di dati esistenti.",
        primary_button: "Sì, eliminalo",
        toast: {
          success: {
            title: "Successo!",
            message: "Tipo di elemento di lavoro eliminato con successo.",
          },
          error: {
            title: "Errore!",
            message: "Impossibile eliminare il tipo di elemento di lavoro. Per favore riprova!",
          },
        },
        errors: {
          cannot_delete_default_work_item_type: "Impossibile eliminare il tipo di elemento di lavoro predefinito",
          cannot_delete_work_item_type_with_associated_work_items:
            "Impossibile eliminare il tipo di elemento di lavoro con elementi di lavoro associati",
        },
        can_disable_warning: "Vuoi disabilitare il tipo invece?",
      },
      cant_delete_default_message:
        "Il tipo di elemento di lavoro non può essere eliminato perché è impostato come tipo predefinito per questo progetto.",
      set_as_default: "Imposta come predefinito",
      cant_set_default_inactive_message: "Attiva questo tipo prima di impostarlo come predefinito",
      set_default_confirmation: {
        title: "Imposta come tipo di elemento di lavoro predefinito",
        description:
          "Impostando {name} come predefinito, verrà importato in tutti i progetti di questo spazio di lavoro. Tutti i nuovi elementi di lavoro utilizzeranno questo tipo per impostazione predefinita.",
        confirm_button: "Imposta come predefinito",
      },
    },
    create: {
      title: "Crea tipo di elemento di lavoro",
      button: "Aggiungi tipo di elemento di lavoro",
      toast: {
        success: {
          title: "Successo!",
          message: "Tipo di elemento di lavoro creato con successo.",
        },
        error: {
          title: "Errore!",
          message: {
            conflict: "Il tipo {name} esiste già. Scegli un nome diverso.",
          },
        },
      },
    },
    update: {
      title: "Aggiorna tipo di elemento di lavoro",
      button: "Aggiorna tipo di elemento di lavoro",
      toast: {
        success: {
          title: "Successo!",
          message: "Tipo di elemento di lavoro {name} aggiornato con successo.",
        },
        error: {
          title: "Errore!",
          message: {
            conflict: "Il tipo {name} esiste già. Scegli un nome diverso.",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "Dà un nome unico a questo tipo di elemento di lavoro",
        },
        description: {
          placeholder: "Descrivi cosa è destinato questo tipo di elemento di lavoro e quando deve essere utilizzato.",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{action} {name} tipo di elemento di lavoro",
        success: {
          title: "Successo!",
          message: "Tipo di elemento di lavoro {name} {action} con successo.",
        },
        error: {
          title: "Errore!",
          message: "Impossibile {action} il tipo di elemento di lavoro. Si prega di riprovare!",
        },
      },
      tooltip: "Clicca per {action}",
    },
    change_confirmation: {
      title: "Cambiare il tipo di elemento di lavoro?",
      description:
        "La modifica del tipo di elemento di lavoro può comportare la perdita di valori di proprietà personalizzate specifiche del tipo corrente. Questa azione non può essere annullata.",
      button: {
        loading: "Modifica in corso",
        default: "Cambia tipo",
      },
    },
    empty_state: {
      enable: {
        title: "Abilita Tipi di Elementi di Lavoro",
        description:
          "Forma gli elementi di lavoro per il tuo lavoro con i Tipi di Elementi di Lavoro. Personalizza con icone, sfondi e proprietà e configurali per questo progetto.",
        primary_button: {
          text: "Abilita",
        },
        confirmation: {
          title: "Una volta abilitato, i Tipi di Elementi di Lavoro non possono essere disattivati.",
          description:
            "Plane's Elemento di Lavoro diventerà il tipo di elemento di lavoro predefinito per questo progetto e apparirà con la sua icona e sfondo in questo progetto.",
          button: {
            default: "Abilita",
            loading: "Configurazione",
          },
        },
      },
      get_pro: {
        title: "Ottieni Pro per abilitare i Tipi di Elementi di Lavoro.",
        description:
          "Forma gli elementi di lavoro per il tuo lavoro con i Tipi di Elementi di Lavoro. Personalizza con icone, sfondi e proprietà e configurali per questo progetto.",
        primary_button: {
          text: "Ottieni Pro",
        },
      },
      upgrade: {
        title: "Aggiorna per abilitare i Tipi di Elementi di Lavoro.",
        description:
          "Forma gli elementi di lavoro per il tuo lavoro con i Tipi di Elementi di Lavoro. Personalizza con icone, sfondi e proprietà e configurali per questo progetto.",
        primary_button: {
          text: "Aggiorna",
        },
      },
    },
  },
  importers: {
    imports: "Importazioni",
    logo: "Logo",
    import_message: "Importa i tuoi dati {serviceName} nel progetto plane.",
    deactivate: "Disattiva",
    deactivating: "Disattivazione",
    migrating: "Migrando",
    migrations: "Migrazioni",
    refreshing: "Aggiornando",
    import: "Importa",
    serial_number: "Nr. di serie",
    project: "Progetto",
    workspace: "workspace",
    status: "Stato",
    summary: "Sommario",
    total_batches: "Totale batch",
    imported_batches: "Batch importati",
    re_run: "Rerun",
    cancel: "Cancella",
    start_time: "Tempo di inizio",
    no_jobs_found: "Nessun lavoro trovato",
    no_project_imports: "Non hai importato ancora progetti {serviceName}.",
    cancel_import_job: "Cancella lavoro di importazione",
    cancel_import_job_confirmation:
      "Sei sicuro di voler cancellare questo lavoro di importazione? Questo fermerà il processo di importazione per questo progetto.",
    re_run_import_job: "Rerun import job",
    re_run_import_job_confirmation:
      "Are you sure you want to re-run this import job? This will restart the import process for this project.",
    upload_csv_file: "Carica un file CSV per importare i dati utente.",
    connect_importer: "Connetti {serviceName}",
    migration_assistant: "Assistente di migrazione",
    migration_assistant_description:
      "Migra senza sforzo i tuoi progetti {serviceName} su Plane con il nostro potente assistente.",
    token_helper: "Lo ottieni da",
    personal_access_token: "Token di accesso personale",
    source_token_expired: "Token scaduto",
    source_token_expired_description:
      "Il token fornito è scaduto. Per favore disattiva e riconnetti con un nuovo set di credenziali.",
    user_email: "Email utente",
    select_state: "Seleziona stato",
    select_service_project: "Seleziona {serviceName} Progetto",
    loading_service_projects: "Caricamento {serviceName} progetti",
    select_service_workspace: "Seleziona {serviceName} workspace",
    loading_service_workspaces: "Caricamento {serviceName} workspaces",
    select_priority: "Seleziona priorità",
    select_service_team: "Seleziona {serviceName} Team",
    add_seat_msg_free_trial:
      "Stai cercando di importare {additionalUserCount} utenti non registrati e hai solo {currentWorkspaceSubscriptionAvailableSeats} posti disponibili nel piano corrente. Per continuare, aggiorna ora.",
    add_seat_msg_paid:
      "Stai cercando di importare {additionalUserCount} utenti non registrati e hai solo {currentWorkspaceSubscriptionAvailableSeats} posti disponibili nel piano corrente. Per continuare, acquista almeno {extraSeatRequired} posti extra.",
    skip_user_import_title: "Skip importing User data",
    skip_user_import_description:
      "Skipping user import will result in work items, comments, and other data from {serviceName} being created by the user performing the migration in Plane. You can still manually add users later.",
    invalid_pat: "Token di accesso personale non valido",
  },
  integrations: {
    integrations: "Integrazioni",
    loading: "Caricamento",
    unauthorized: "Non sei autorizzato a visualizzare questa pagina.",
    configure: "Configura",
    not_enabled: "{name} non è abilitato per questo workspace.",
    not_configured: "Non configurato",
    disconnect_personal_account: "Disconnetti account {providerName} personale",
    not_configured_message_admin:
      "{name} integrazione non è configurata. Per favore contatta il tuo amministratore di istanza per configurarla.",
    not_configured_message_support:
      "{name} integrazione non è configurata. Per favore contatta il supporto per configurarla.",
    external_api_unreachable: "Non è possibile accedere all'API esterna. Per favore riprova più tardi.",
    error_fetching_supported_integrations:
      "Non è possibile ottenere integrazioni supportate. Per favore riprova più tardi.",
    back_to_integrations: "Torna alle integrazioni",
    select_state: "Seleziona stato",
    set_state: "Imposta stato",
    choose_project: "Scegli progetto...",
    skip_backward_state_movement:
      "Impedisci che le issue tornino a uno stato precedente a causa degli aggiornamenti PR",
  },
  github_integration: {
    name: "GitHub",
    description: "Connetti e sincronizza i tuoi elementi di lavoro GitHub con Plane",
    connect_org: "Connetti Organizzazione",
    connect_org_description: "Connetti la tua organizzazione GitHub con Plane",
    processing: "Elaborazione",
    org_added_desc: "GitHub org aggiunta da e tempo",
    connection_fetch_error: "Errore durante la ricezione dei dettagli della connessione dal server",
    personal_account_connected: "Account personale connesso",
    personal_account_connected_description: "Il tuo account GitHub è ora connesso a Plane",
    connect_personal_account: "Connetti Account Personale",
    connect_personal_account_description: "Connetti il tuo account GitHub personale con Plane.",
    repo_mapping: "Mappatura Repository",
    repo_mapping_description: "Mappa i tuoi repository GitHub con i progetti Plane.",
    project_issue_sync: "Sincronizzazione Problema Progetto",
    project_issue_sync_description: "Sincronizza i problemi da GitHub al tuo progetto Plane",
    project_issue_sync_empty_state: "Le sincronizzazioni dei problemi del progetto mappate appariranno qui",
    configure_project_issue_sync_state: "Configura lo stato di sincronizzazione dei problemi",
    select_issue_sync_direction: "Seleziona la direzione di sincronizzazione dei problemi",
    allow_bidirectional_sync:
      "Bidirectional - Sincronizza problemi e commenti in entrambe le direzioni tra GitHub e Plane",
    allow_unidirectional_sync: "Unidirectional - Sincronizza problemi e commenti da GitHub a Plane solo",
    allow_unidirectional_sync_warning:
      "I dati del GitHub Issue sostituiranno i dati nell'elemento di lavoro Plane collegato (GitHub → Plane solo)",
    remove_project_issue_sync: "Rimuovi questa Sincronizzazione Problema Progetto",
    remove_project_issue_sync_confirmation: "Sei sicuro di voler rimuovere questa sincronizzazione problema progetto?",
    add_pr_state_mapping: "Aggiungi Mappatura Stato Richiesta di Pull per Progetto Plane",
    edit_pr_state_mapping: "Modifica Mappatura Stato Richiesta di Pull per Progetto Plane",
    pr_state_mapping: "Mappatura Stato Richiesta di Pull",
    pr_state_mapping_description: "Mappa gli stati delle richieste di pull da GitHub al tuo progetto Plane",
    pr_state_mapping_empty_state: "Gli stati PR mappati appariranno qui",
    remove_pr_state_mapping: "Rimuovi questa Mappatura Stato Richiesta di Pull",
    remove_pr_state_mapping_confirmation: "Sei sicuro di voler rimuovere questa mappatura stato richiesta di pull?",
    issue_sync_message: "Elementi di lavoro sono sincronizzati con {project}",
    link: "Collega Repository GitHub al Progetto Plane",
    pull_request_automation: "Automazione Richiesta di Pull",
    pull_request_automation_description:
      "Configura la mappatura dello stato della richiesta di pull da GitHub al tuo progetto Plane",
    DRAFT_MR_OPENED: "Draft Aperto",
    MR_OPENED: "Aperto",
    MR_READY_FOR_MERGE: "Pronto per Merge",
    MR_REVIEW_REQUESTED: "Review Richiesto",
    MR_MERGED: "Unito",
    MR_CLOSED: "Chiuso",
    ISSUE_OPEN: "Issue Aperto",
    ISSUE_CLOSED: "Issue Chiuso",
    save: "Salva",
    start_sync: "Start Sincronizzazione",
    choose_repository: "Scegli Repository...",
  },
  gitlab_integration: {
    name: "Gitlab",
    description: "Connetti e sincronizza le richieste di merge Gitlab con Plane.",
    connection_fetch_error: "Errore durante la ricezione dei dettagli della connessione dal server",
    connect_org: "Connetti Organizzazione",
    connect_org_description: "Connetti la tua organizzazione Gitlab con Plane.",
    project_connections: "Connessioni Progetto Gitlab",
    project_connections_description: "Sincronizza richieste di merge da Gitlab a progetti Plane.",
    plane_project_connection: "Connessione Progetto Plane",
    plane_project_connection_description:
      "Configura la mappatura dello stato della richiesta di merge da Gitlab a progetti Plane",
    remove_connection: "Rimuovi Connessione",
    remove_connection_confirmation: "Sei sicuro di voler rimuovere questa connessione?",
    link: "Collega repository Gitlab al progetto Plane",
    pull_request_automation: "Automazione Richiesta di Pull",
    pull_request_automation_description:
      "Configura la mappatura dello stato della richiesta di merge da Gitlab a Plane",
    DRAFT_MR_OPENED: "Su MR aperto in bozza, imposta lo stato su",
    MR_OPENED: "Su MR aperto, imposta lo stato su",
    MR_REVIEW_REQUESTED: "Su MR review richiesto, imposta lo stato su",
    MR_READY_FOR_MERGE: "Su MR pronto per merge, imposta lo stato su",
    MR_MERGED: "Su MR unito, imposta lo stato su",
    MR_CLOSED: "Su MR chiuso, imposta lo stato su",
    integration_enabled_text:
      "Con Gitlab integration Enabled, puoi automatizzare i flussi di lavoro degli elementi di lavoro",
    choose_entity: "Scegli entità",
    choose_project: "Scegli progetto",
    link_plane_project: "Collega progetto Plane",
    project_issue_sync: "Sincronizzazione Issue Progetto",
    project_issue_sync_description: "Sincronizza le issue da Gitlab al tuo progetto Plane",
    project_issue_sync_empty_state: "La sincronizzazione issue del progetto mappata apparirà qui",
    configure_project_issue_sync_state: "Configura Stato Sincronizzazione Issue",
    select_issue_sync_direction: "Seleziona la direzione di sincronizzazione issue",
    allow_bidirectional_sync:
      "Bidirezionale - Sincronizza issue e commenti in entrambe le direzioni tra Gitlab e Plane",
    allow_unidirectional_sync: "Unidirezionale - Sincronizza issue e commenti solo da Gitlab a Plane",
    allow_unidirectional_sync_warning:
      "I dati dalla Issue Gitlab sostituiranno i dati nell'Elemento di Lavoro Plane collegato (solo Gitlab → Plane)",
    remove_project_issue_sync: "Rimuovi questa Sincronizzazione Issue Progetto",
    remove_project_issue_sync_confirmation: "Sei sicuro di voler rimuovere questa sincronizzazione issue del progetto?",
    ISSUE_OPEN: "Issue Aperta",
    ISSUE_CLOSED: "Issue Chiusa",
    save: "Salva",
    start_sync: "Avvia Sincronizzazione",
    choose_repository: "Scegli Repository...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Connetti e sincronizza la tua istanza Gitlab Enterprise con Plane.",
    app_form_title: "Configurazione Gitlab Enterprise",
    app_form_description: "Configura Gitlab Enterprise per connetterti a Plane.",
    base_url_title: "URL Base",
    base_url_description: "L'URL base della tua istanza Gitlab Enterprise.",
    base_url_placeholder: 'es. "https://glab.plane.town"',
    base_url_error: "L'URL base è richiesto",
    invalid_base_url_error: "URL base non valido",
    client_id_title: "ID App",
    client_id_description: "L'ID dell'app che hai creato nella tua istanza Gitlab Enterprise.",
    client_id_placeholder: 'es. "7cd732xxxxxxxxxxxxxx"',
    client_id_error: "L'ID App è richiesto",
    client_secret_title: "Client Secret",
    client_secret_description: "Il client secret dell'app che hai creato nella tua istanza Gitlab Enterprise.",
    client_secret_placeholder: 'es. "gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "Il client secret è richiesto",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description:
      "Un webhook secret casuale che verrà utilizzato per verificare il webhook dall'istanza Gitlab Enterprise.",
    webhook_secret_placeholder: 'es. "webhook1234567890"',
    webhook_secret_error: "Il webhook secret è richiesto",
    connect_app: "Connetti App",
  },
  slack_integration: {
    name: "Slack",
    description: "Connetti il tuo workspace Slack con Plane.",
    connect_personal_account: "Connetti il tuo account Slack personale con Plane.",
    personal_account_connected: "Il tuo account {providerName} personale è ora connesso a Plane.",
    link_personal_account: "Collega il tuo account {providerName} personale a Plane.",
    connected_slack_workspaces: "Spazi di lavoro Slack connessi",
    connected_on: "Connesso su {date}",
    disconnect_workspace: "Disconnetti {name} workspace",
    alerts: {
      dm_alerts: {
        title:
          "Ricevi notifiche nei messaggi diretti di Slack per aggiornamenti importanti, promemoria e avvisi solo per te.",
      },
    },
    project_updates: {
      title: "Aggiornamenti Progetto",
      description: "Configura notifiche di aggiornamenti di progetto per i tuoi progetti",
      add_new_project_update: "Aggiungi nuova notifica di aggiornamenti di progetto",
      project_updates_empty_state: "I progetti connessi ai canali Slack appariranno qui.",
      project_updates_form: {
        title: "Configura Aggiornamenti Progetto",
        description: "Ricevi notifiche di aggiornamenti di progetto in Slack quando vengono creati elementi di lavoro",
        failed_to_load_channels: "Impossibile caricare i canali da Slack",
        project_dropdown: {
          placeholder: "Seleziona un progetto",
          label: "Progetto Plane",
          no_projects: "Nessun progetto disponibile",
        },
        channel_dropdown: {
          label: "Canale Slack",
          placeholder: "Seleziona un canale",
          no_channels: "Nessun canale disponibile",
        },
        all_projects_connected: "Tutti i progetti sono già connessi a canali Slack.",
        all_channels_connected: "Tutti i canali Slack sono già connessi a progetti.",
        project_connection_success: "Connessione progetto creata con successo",
        project_connection_updated: "Connessione progetto aggiornata con successo",
        project_connection_deleted: "Connessione progetto eliminata con successo",
        failed_delete_project_connection: "Impossibile eliminare la connessione progetto",
        failed_create_project_connection: "Impossibile creare la connessione progetto",
        failed_upserting_project_connection: "Impossibile aggiornare la connessione progetto",
        failed_loading_project_connections:
          "Non è stato possibile caricare le tue connessioni progetto. Questo potrebbe essere dovuto a un problema di rete o un problema con l'integrazione.",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "Connetti il tuo spazio di lavoro Sentry con Plane.",
    connected_sentry_workspaces: "Spazi di lavoro Sentry connessi",
    connected_on: "Connesso il {date}",
    disconnect_workspace: "Disconnetti spazio di lavoro {name}",
    state_mapping: {
      title: "Mappatura degli stati",
      description:
        "Mappa gli stati degli incidenti Sentry ai tuoi stati di progetto. Configura quali stati usare quando un incidente Sentry è risolto o non risolto.",
      add_new_state_mapping: "Aggiungi nuova mappatura di stato",
      empty_state:
        "Nessuna mappatura di stato configurata. Crea la tua prima mappatura per sincronizzare gli stati degli incidenti Sentry con i tuoi stati di progetto.",
      failed_loading_state_mappings:
        "Non siamo riusciti a caricare le tue mappature di stato. Questo potrebbe essere dovuto a un problema di rete o un problema con l'integrazione.",
      loading_project_states: "Caricamento stati del progetto...",
      error_loading_states: "Errore nel caricamento degli stati",
      no_states_available: "Nessuno stato disponibile",
      no_permission_states: "Non hai il permesso di accedere agli stati per questo progetto",
      states_not_found: "Stati del progetto non trovati",
      server_error_states: "Errore del server nel caricamento degli stati",
    },
  },
  oauth_bridge_integration: {
    name: "OAuth Bridge",
    description: "Convalida i token IdP esterni per l'accesso API.",
    header_description:
      "Convalida i token OIDC/JWT emessi esternamente dal tuo IdP (Azure AD, Okta, ecc.) per l'accesso all'API di Plane.",
    connected: "Connesso",
    connect: "Connetti",
    uninstall: "Disinstalla",
    uninstalling: "Disinstallazione...",
    install_success: "OAuth Bridge installato con successo.",
    install_error: "Installazione di OAuth Bridge non riuscita.",
    uninstall_success: "OAuth Bridge disinstallato.",
    uninstall_error: "Disinstallazione di OAuth Bridge non riuscita.",
    token_providers: "Provider di token",
    token_providers_description: "Configura gli IdP esterni i cui JWT sono accettati come credenziali API.",
    add_provider: "Aggiungi provider",
    edit_provider: "Modifica provider",
    enabled: "Abilitato",
    disabled: "Disabilitato",
    test: "Test",
    no_providers_title: "Nessun provider configurato.",
    no_providers_description: "Aggiungi un IdP per abilitare l'autenticazione con token esterni.",
    provider_updated: "Provider aggiornato.",
    provider_added: "Provider aggiunto.",
    provider_save_error: "Salvataggio del provider non riuscito.",
    provider_deleted: "Provider eliminato.",
    provider_delete_error: "Eliminazione del provider non riuscita.",
    provider_update_error: "Aggiornamento del provider non riuscito.",
    jwks_reachable: "JWKS raggiungibile",
    jwks_unreachable: "JWKS non raggiungibile",
    jwks_test_error: "Impossibile recuperare il JWKS dall'URL configurato.",
    provider_form: {
      name_label: "Nome",
      name_placeholder: "es. Azure AD Production",
      name_description: "Etichetta leggibile per questo provider di identità",
      name_required: "Il nome è obbligatorio.",
      issuer_label: "Emittente",
      issuer_placeholder: "https://login.microsoftonline.com/tenant-id/v2.0",
      issuer_description: "Valore atteso del claim iss nel JWT",
      issuer_required: "L'emittente è obbligatorio.",
      jwks_url_label: "URL JWKS",
      jwks_url_placeholder: "https://login.microsoftonline.com/tenant-id/discovery/v2.0/keys",
      jwks_url_description: "Endpoint HTTPS che fornisce il JSON Web Key Set del provider",
      jwks_url_required: "L'URL JWKS è obbligatorio.",
      jwks_url_https: "L'URL JWKS deve utilizzare HTTPS.",
      audience_label: "Pubblico",
      audience_placeholder: "api://my-app-id",
      audience_description: "Claim aud attesi nel JWT, separati da virgole.",
      user_claim_label: "Claim utente",
      user_claim_placeholder: "email",
      user_claim_description: "Claim JWT contenente l'indirizzo email dell'utente",
      user_claim_required: "Il claim utente è obbligatorio.",
      allowed_algorithms_label: "Algoritmi di firma consentiti",
      allowed_algorithms_description: "Algoritmi asimmetrici accettati per la verifica della firma JWT",
      allowed_algorithms_required: "È richiesto almeno un algoritmo.",
      select_algorithms: "Seleziona algoritmi",
      jwks_cache_ttl_label: "TTL cache JWKS (secondi)",
      jwks_cache_ttl_description: "Durata della cache delle chiavi JWKS del provider (minimo 60s, predefinito 24 ore)",
      jwks_cache_ttl_min: "Il TTL della cache deve essere di almeno 60 secondi.",
      rate_limit_label: "Limite di frequenza",
      rate_limit_placeholder: "120/minute",
      rate_limit_description:
        "Limitazione delle richieste come quantità/periodo (es. 120/minute). Lasciare vuoto per il limite predefinito.",
      enable_provider: "Abilita questo provider",
      saving: "Salvataggio...",
      update: "Aggiorna",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "Connetti e sincronizza la tua organizzazione GitHub Enterprise con Plane.",
    app_form_title: "Configurazione GitHub Enterprise",
    app_form_description: "Configura GitHub Enterprise per connettersi con Plane.",
    app_id_title: "ID App",
    app_id_description: "L'ID dell'app che hai creato nella tua organizzazione GitHub Enterprise.",
    app_id_placeholder: 'e.g., "1234567890"',
    app_id_error: "App ID è richiesto",
    app_name_title: "Slug App",
    app_name_description: "Il slug dell'app che hai creato nella tua organizzazione GitHub Enterprise.",
    app_name_error: "App slug è richiesto",
    app_name_placeholder: 'e.g., "plane-github-enterprise"',
    base_url_title: "Base URL",
    base_url_description: "L'URL base della tua organizzazione GitHub Enterprise.",
    base_url_placeholder: 'e.g., "https://gh.plane.town"',
    base_url_error: "Base URL è richiesto",
    invalid_base_url_error: "URL base non valido",
    client_id_title: "ID Client",
    client_id_description: "L'ID client dell'app che hai creato nella tua organizzazione GitHub Enterprise.",
    client_id_placeholder: 'e.g., "1234567890"',
    client_id_error: "ID client è richiesto",
    client_secret_title: "Client Secret",
    client_secret_description: "Il client secret dell'app che hai creato nella tua organizzazione GitHub Enterprise.",
    client_secret_placeholder: 'e.g., "1234567890"',
    client_secret_error: "Client secret è richiesto",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description: "Il webhook secret dell'app che hai creato nella tua organizzazione GitHub Enterprise.",
    webhook_secret_placeholder: 'e.g., "1234567890"',
    webhook_secret_error: "Webhook secret è richiesto",
    private_key_title: "Private Key (Base64 encoded)",
    private_key_description:
      "Base64 encoded private key dell'app che hai creato nella tua organizzazione GitHub Enterprise.",
    private_key_placeholder: 'e.g., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Private key è richiesto",
    connect_app: "Connetti App",
  },
  file_upload: {
    upload_text: "Clicca qui per caricare il file",
    drag_drop_text: "Trascina e rilascia",
    processing: "Elaborazione",
    invalid: "Tipo di file non valido",
    missing_fields: "Campi mancanti",
    success: "{fileName} Caricato!",
  },
  silo_errors: {
    invalid_query_params: "I parametri di query forniti sono invalidi o mancano campi obbligatori",
    invalid_installation_account: "Il account di installazione fornito non è valido",
    generic_error: "Si è verificato un errore imprevisto durante la elaborazione della tua richiesta",
    connection_not_found: "La connessione richiesta non è stata trovata",
    multiple_connections_found: "Sono state trovate più connessioni di quanto previsto",
    installation_not_found: "L'installazione richiesta non è stata trovata",
    user_not_found: "L'utente richiesto non è stato trovato",
    error_fetching_token: "Impossibile ottenere il token di autenticazione",
    cannot_create_multiple_connections:
      "Hai già connesso la tua organizzazione con uno spazio di lavoro. Per favore disconnetti la connessione esistente prima di connettere una nuova.",
    invalid_app_credentials: "Le credenziali dell'app fornite non sono valide",
    invalid_app_installation_id: "Impossibile installare l'app",
  },
  import_status: {
    queued: "In coda",
    created: "Creato",
    initiated: "Inizializzato",
    pulling: "Trascinamento",
    timed_out: "Tempo scaduto",
    pulled: "Trascinato",
    transforming: "Trasformazione",
    transformed: "Trasformato",
    pushing: "Inserimento",
    finished: "Completato",
    error: "Errore",
    cancelled: "Annullato",
  },
  jira_importer: {
    jira_importer_description: "Importa i tuoi dati Jira nel progetto Plane.",
    create_project_automatically: "Crea progetto automaticamente",
    create_project_automatically_description:
      "Creeremo un nuovo progetto per te basato sui dettagli del progetto Jira.",
    import_to_existing_project: "Importa in un progetto esistente",
    import_to_existing_project_description: "Scegli un progetto esistente dal menu a discesa qui sotto.",
    state_mapping_automatic_creation: "Tutti gli stati Jira verranno creati automaticamente in Plane.",
    personal_access_token: "Token di accesso personale",
    user_email: "Email utente",
    atlassian_security_settings: "Impostazioni di sicurezza Atlassian",
    email_description: "Questa è l'email collegata al tuo token di accesso personale",
    jira_domain: "Dominio Jira",
    jira_domain_description: "Questo è il dominio della tua istanza Jira",
    steps: {
      title_configure_plane: "Configura Plane",
      description_configure_plane:
        "Per prima cosa crea il progetto in Plane dove intendi migrare i tuoi dati Jira. Una volta creato il progetto, selezionalo qui.",
      title_configure_jira: "Configura Jira",
      description_configure_jira: "Per favore seleziona lo spazio di lavoro Jira da cui vuoi migrare i tuoi dati.",
      title_import_users: "Importa utenti",
      description_import_users:
        "Per favore aggiungi gli utenti che desideri migrare da Jira a Plane. In alternativa, puoi saltare questo passaggio e aggiungere utenti manualmente più tardi.",
      title_map_states: "Mappa stati",
      description_map_states:
        "Abbiamo automaticamente mappato gli stati Jira ai stati Plane in base alla migliore nostra capacità. Per favore mappa qualsiasi stato rimanente prima di procedere, puoi anche creare stati e mapparli manualmente.",
      title_map_priorities: "Mappa priorità",
      description_map_priorities:
        "Abbiamo automaticamente mappato le priorità in base alla migliore nostra capacità. Per favore mappa qualsiasi priorità rimanente prima di procedere.",
      title_summary: "Sommario",
      description_summary: "Questo è un sommario dei dati che verranno migrati da Jira a Plane.",
      custom_jql_filter: "Filtro JQL Personalizzato",
      jql_filter_description: "Usa JQL per filtrare ticket specifici per l'importazione.",
      project_code: "PROGETTO",
      enter_filters_placeholder: "Inserisci filtri (es. status = 'In Progress')",
      validating_query: "Convalida query in corso...",
      validation_successful_work_items_selected: "Convalida riuscita, {count} elementi di lavoro selezionati.",
      run_syntax_check: "Esegui controllo sintassi per verificare la tua query",
      refresh: "Aggiorna",
      check_syntax: "Controlla Sintassi",
      no_work_items_selected: "Nessun elemento di lavoro selezionato dalla query.",
      validation_error_default: "Qualcosa è andato storto durante la convalida della query.",
    },
  },
  asana_importer: {
    asana_importer_description: "Importa i tuoi dati Asana nel progetto Plane.",
    select_asana_priority_field: "Seleziona campo priorità Asana",
    steps: {
      title_configure_plane: "Configura Plane",
      description_configure_plane:
        "Per prima cosa crea il progetto in Plane dove intendi migrare i tuoi dati Asana. Una volta creato il progetto, selezionalo qui.",
      title_configure_asana: "Configura Asana",
      description_configure_asana:
        "Per favore seleziona lo spazio di lavoro e il progetto Asana da cui vuoi migrare i tuoi dati.",
      title_map_states: "Mappa stati",
      description_map_states: "Per favore seleziona gli stati Asana che desideri mappare ai stati del progetto Plane.",
      title_map_priorities: "Mappa priorità",
      description_map_priorities:
        "Per favore seleziona le priorità Asana che desideri mappare ai priorità del progetto Plane.",
      title_summary: "Sommario",
      description_summary: "Questo è un sommario dei dati che verranno migrati da Asana a Plane.",
    },
  },
  linear_importer: {
    linear_importer_description: "Importa i tuoi dati Linear nel progetto Plane.",
    steps: {
      title_configure_plane: "Configura Plane",
      description_configure_plane:
        "Per prima cosa crea il progetto in Plane dove intendi migrare i tuoi dati Linear. Una volta creato il progetto, selezionalo qui.",
      title_configure_linear: "Configura Linear",
      description_configure_linear: "Per favore seleziona il team Linear da cui vuoi migrare i tuoi dati.",
      title_map_states: "Mappa stati",
      description_map_states:
        "Abbiamo automaticamente mappato gli stati Linear ai stati Plane in base alla migliore nostra capacità. Per favore mappa qualsiasi stato rimanente prima di procedere, puoi anche creare stati e mapparli manualmente.",
      title_map_priorities: "Mappa priorità",
      description_map_priorities:
        "Per favore seleziona le priorità Linear che desideri mappare ai priorità del progetto Plane.",
      title_summary: "Sommario",
      description_summary: "Questo è un sommario dei dati che verranno migrati da Linear a Plane.",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "Importa i tuoi dati Jira Server/Data Center nel progetto Plane.",
    steps: {
      title_configure_plane: "Configura Plane",
      description_configure_plane:
        "Per prima cosa crea il progetto in Plane dove intendi migrare i tuoi dati Jira. Una volta creato il progetto, selezionalo qui.",
      title_configure_jira: "Configura Jira",
      description_configure_jira: "Per favore seleziona lo spazio di lavoro Jira da cui vuoi migrare i tuoi dati.",
      title_map_states: "Mappa stati",
      description_map_states: "Per favore seleziona gli stati Jira che desideri mappare ai stati del progetto Plane.",
      title_map_priorities: "Mappa priorità",
      description_map_priorities:
        "Per favore seleziona le priorità Jira che desideri mappare ai priorità del progetto Plane.",
      title_summary: "Sommario",
      description_summary: "Questo è un sommario dei dati che verranno migrati da Jira a Plane.",
    },
    import_epics: {
      title: "Importa epic come elementi di lavoro",
      description:
        "Con questa opzione abilitata, i tuoi epic verranno importati come elementi di lavoro con il tipo di elemento di lavoro epic.",
    },
  },
  notion_importer: {
    notion_importer_description: "Importa i tuoi dati Notion nei progetti Plane.",
    steps: {
      title_upload_zip: "Carica ZIP esportato da Notion",
      description_upload_zip: "Carica il file ZIP contenente i tuoi dati Notion.",
    },
    upload: {
      drop_file_here: "Trascina qui il tuo file zip di Notion",
      upload_title: "Carica esportazione Notion",
      upload_from_url: "Importa da URL",
      upload_from_url_description: "Incolla l'URL pubblico della tua esportazione ZIP per procedere.",
      drag_drop_description: "Trascina e rilascia il tuo file zip di esportazione Notion, o clicca per sfogliare",
      file_type_restriction: "Sono supportati solo file .zip esportati da Notion",
      select_file: "Seleziona file",
      uploading: "Caricamento...",
      preparing_upload: "Preparazione caricamento...",
      confirming_upload: "Conferma caricamento...",
      confirming: "Conferma...",
      upload_complete: "Caricamento completato",
      upload_failed: "Caricamento fallito",
      start_import: "Inizia importazione",
      retry_upload: "Riprova caricamento",
      upload: "Carica",
      ready: "Pronto",
      error: "Errore",
      upload_complete_message: "Caricamento completato!",
      upload_complete_description: 'Clicca su "Inizia importazione" per iniziare l\'elaborazione dei tuoi dati Notion.',
      upload_progress_message: "Non chiudere questa finestra.",
    },
  },
  confluence_importer: {
    confluence_importer_description: "Importa i tuoi dati Confluence nel wiki di Plane.",
    steps: {
      title_upload_zip: "Carica ZIP esportato da Confluence",
      description_upload_zip: "Carica il file ZIP contenente i tuoi dati Confluence.",
    },
    upload: {
      drop_file_here: "Trascina qui il tuo file zip di Confluence",
      upload_title: "Carica esportazione Confluence",
      upload_from_url: "Importa da URL",
      upload_from_url_description: "Incolla l'URL pubblico della tua esportazione ZIP per procedere.",
      drag_drop_description: "Trascina e rilascia il tuo file zip di esportazione Confluence, o clicca per sfogliare",
      file_type_restriction: "Sono supportati solo file .zip esportati da Confluence",
      select_file: "Seleziona file",
      uploading: "Caricamento...",
      preparing_upload: "Preparazione caricamento...",
      confirming_upload: "Conferma caricamento...",
      confirming: "Conferma...",
      upload_complete: "Caricamento completato",
      upload_failed: "Caricamento fallito",
      start_import: "Inizia importazione",
      retry_upload: "Riprova caricamento",
      upload: "Carica",
      ready: "Pronto",
      error: "Errore",
      upload_complete_message: "Caricamento completato!",
      upload_complete_description:
        'Clicca su "Inizia importazione" per iniziare l\'elaborazione dei tuoi dati Confluence.',
      upload_progress_message: "Non chiudere questa finestra.",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "Importa i tuoi dati CSV nel progetto Plane.",
    steps: {
      title_configure_plane: "Configura Plane",
      description_configure_plane:
        "Per prima cosa crea il progetto in Plane dove intendi migrare i tuoi dati CSV. Una volta creato il progetto, selezionalo qui.",
      title_configure_csv: "Configura CSV",
      description_configure_csv: "Per favore carica il tuo file CSV e configura i campi da mappare ai campi Plane.",
    },
  },
  csv_importer: {
    csv_importer_description: "Importa elementi di lavoro da file CSV nei progetti Plane.",
    steps: {
      title_select_project: "Seleziona progetto",
      description_select_project: "Seleziona il progetto Plane in cui desideri importare i tuoi elementi di lavoro.",
      title_upload_csv: "Carica CSV",
      description_upload_csv:
        "Carica il tuo file CSV contenente gli elementi di lavoro. Il file dovrebbe includere colonne per nome, descrizione, priorità, date e gruppo di stato.",
    },
  },
  clickup_importer: {
    clickup_importer_description: "Importa i tuoi dati ClickUp nei progetti Plane.",
    select_service_space: "Seleziona {serviceName} Spazio",
    select_service_folder: "Seleziona {serviceName} Cartella",
    selected: "Selezionato",
    users: "Utenti",
    steps: {
      title_configure_plane: "Configura Plane",
      description_configure_plane:
        "Per prima cosa crea il progetto in Plane dove intendi migrare i tuoi dati ClickUp. Una volta creato il progetto, selezionalo qui.",
      title_configure_clickup: "Configura ClickUp",
      description_configure_clickup:
        "Per favore seleziona il team, lo spazio e la cartella ClickUp da cui vuoi migrare i tuoi dati.",
      title_map_states: "Mappa stati",
      description_map_states:
        "Abbiamo automaticamente mappato gli stati ClickUp ai stati Plane in base alla migliore nostra capacità. Per favore mappa qualsiasi stato rimanente prima di procedere, puoi anche creare stati e mapparli manualmente.",
      title_map_priorities: "Mappa priorità",
      description_map_priorities:
        "Per favore seleziona le priorità ClickUp che desideri mappare ai priorità del progetto Plane.",
      title_summary: "Sommario",
      description_summary: "Questo è un sommario dei dati che verranno migrati da ClickUp a Plane.",
      pull_additional_data_title: "Importa commenti e allegati",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "Barra",
          long_label: "Grafico a barre",
          chart_models: {
            basic: "Base",
            stacked: "Impilato",
            grouped: "Raggruppato",
          },
          orientation: {
            label: "Orientamento",
            horizontal: "Orizzontale",
            vertical: "Verticale",
            placeholder: "Aggiungi orientamento",
          },
          bar_color: "Colore barra",
        },
        line_chart: {
          short_label: "Linea",
          long_label: "Grafico a linee",
          chart_models: {
            basic: "Base",
            multi_line: "Multi-linea",
          },
          line_color: "Colore linea",
          line_type: {
            label: "Tipo di linea",
            solid: "Continua",
            dashed: "Tratteggiata",
            placeholder: "Aggiungi tipo di linea",
          },
        },
        area_chart: {
          short_label: "Area",
          long_label: "Grafico ad area",
          chart_models: {
            basic: "Base",
            stacked: "Impilato",
            comparison: "Confronto",
          },
          fill_color: "Colore riempimento",
        },
        donut_chart: {
          short_label: "Ciambella",
          long_label: "Grafico a ciambella",
          chart_models: {
            basic: "Base",
            progress: "Progresso",
          },
          center_value: "Valore centrale",
          completed_color: "Colore completamento",
        },
        pie_chart: {
          short_label: "Torta",
          long_label: "Grafico a torta",
          chart_models: {
            basic: "Base",
          },
          group: {
            label: "Parti raggruppate",
            group_thin_pieces: "Raggruppa parti sottili",
            minimum_threshold: {
              label: "Soglia minima",
              placeholder: "Aggiungi soglia",
            },
            name_group: {
              label: "Nome gruppo",
              placeholder: '"Meno del 5%"',
            },
          },
          show_values: "Mostra valori",
          value_type: {
            percentage: "Percentuale",
            count: "Conteggio",
          },
        },
        text: {
          short_label: "Testo",
          long_label: "Testo",
          alignment: {
            label: "Allineamento testo",
            left: "Sinistra",
            center: "Centro",
            right: "Destra",
            placeholder: "Aggiungi allineamento testo",
          },
          text_color: "Colore testo",
        },
        table_chart: {
          short_label: "Tabella",
          long_label: "Grafico a tabella",
          chart_models: {
            basic: {
              short_label: "Base",
              long_label: "Tabella",
            },
          },
          columns: "Colonne",
          rows: "Righe",
          rows_placeholder: "Aggiungi righe",
          configure_rows_hint: "Seleziona una proprietà per le righe per visualizzare questa tabella.",
        },
      },
      color_palettes: {
        modern: "Moderno",
        horizon: "Orizzonte",
        earthen: "Terroso",
      },
      common: {
        add_widget: "Aggiungi widget",
        widget_title: {
          label: "Nomina questo widget",
          placeholder: 'es. "Da fare ieri", "Tutto completato"',
        },
        chart_type: "Tipo di grafico",
        visualization_type: {
          label: "Tipo di visualizzazione",
          placeholder: "Aggiungi tipo di visualizzazione",
        },
        date_group: {
          label: "Gruppo data",
          placeholder: "Aggiungi gruppo data",
        },
        group_by: "Raggruppa per",
        stack_by: "Impila per",
        daily: "Giornaliero",
        weekly: "Settimanale",
        monthly: "Mensile",
        yearly: "Annuale",
        work_item_count: "Conteggio elementi di lavoro",
        estimate_point: "Punto di stima",
        pending_work_item: "Elementi di lavoro in attesa",
        completed_work_item: "Elementi di lavoro completati",
        in_progress_work_item: "Elementi di lavoro in corso",
        blocked_work_item: "Elementi di lavoro bloccati",
        work_item_due_this_week: "Elementi di lavoro in scadenza questa settimana",
        work_item_due_today: "Elementi di lavoro in scadenza oggi",
        color_scheme: {
          label: "Schema colori",
          placeholder: "Aggiungi schema colori",
        },
        smoothing: "Smussamento",
        markers: "Marcatori",
        legends: "Legende",
        tooltips: "Suggerimenti",
        opacity: {
          label: "Opacità",
          placeholder: "Aggiungi opacità",
        },
        border: "Bordo",
        widget_configuration: "Configurazione widget",
        configure_widget: "Configura widget",
        guides: "Guide",
        style: "Stile",
        area_appearance: "Aspetto area",
        comparison_line_appearance: "Aspetto linea di confronto",
        add_property: "Aggiungi proprietà",
        add_metric: "Aggiungi metrica",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "L'asse X manca di un valore.",
            y_axis_metric: "La metrica manca di un valore.",
          },
          stacked: {
            x_axis_property: "L'asse X manca di un valore.",
            y_axis_metric: "La metrica manca di un valore.",
            group_by: "Impila per manca di un valore.",
          },
          grouped: {
            x_axis_property: "L'asse X manca di un valore.",
            y_axis_metric: "La metrica manca di un valore.",
            group_by: "Raggruppa per manca di un valore.",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "L'asse X manca di un valore.",
            y_axis_metric: "La metrica manca di un valore.",
          },
          multi_line: {
            x_axis_property: "L'asse X manca di un valore.",
            y_axis_metric: "La metrica manca di un valore.",
            group_by: "Raggruppa per manca di un valore.",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "L'asse X manca di un valore.",
            y_axis_metric: "La metrica manca di un valore.",
          },
          stacked: {
            x_axis_property: "L'asse X manca di un valore.",
            y_axis_metric: "La metrica manca di un valore.",
            group_by: "Impila per manca di un valore.",
          },
          comparison: {
            x_axis_property: "L'asse X manca di un valore.",
            y_axis_metric: "La metrica manca di un valore.",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "L'asse X manca di un valore.",
            y_axis_metric: "La metrica manca di un valore.",
          },
          progress: {
            y_axis_metric: "La metrica manca di un valore.",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "L'asse X manca di un valore.",
            y_axis_metric: "La metrica manca di un valore.",
          },
        },
        text: {
          basic: {
            y_axis_metric: "La metrica manca di un valore.",
          },
        },
        table_chart: {
          basic: {
            x_axis_property: "Alle colonne manca un valore.",
            group_by: "Alle righe manca un valore.",
          },
        },
        ask_admin: "Chiedi al tuo amministratore di configurare questo widget.",
      },
    },
    create_modal: {
      heading: {
        create: "Crea nuova dashboard",
        update: "Aggiorna dashboard",
      },
      title: {
        label: "Dai un nome alla tua dashboard.",
        placeholder: '"Capacità tra progetti", "Carico di lavoro per team", "Stato tra tutti i progetti"',
        required_error: "Il titolo è obbligatorio",
      },
      project: {
        label: "Scegli progetti",
        placeholder: "I dati di questi progetti alimenteranno questa dashboard.",
        required_error: "I progetti sono obbligatori",
      },
      filters_label: "Imposta filtri per le fonti di dati sopra",
      create_dashboard: "Crea dashboard",
      update_dashboard: "Aggiorna dashboard",
    },
    delete_modal: {
      heading: "Elimina dashboard",
    },
    empty_state: {
      feature_flag: {
        title: "Presenta il tuo progresso in dashboard su richiesta e permanenti.",
        description:
          "Costruisci qualsiasi dashboard di cui hai bisogno e personalizza come appaiono i tuoi dati per la presentazione perfetta del tuo progresso.",
        coming_soon_to_mobile: "Presto disponibile nell'app mobile",
        card_1: {
          title: "Per tutti i tuoi progetti",
          description:
            "Ottieni una visione completa del tuo spazio di lavoro con tutti i tuoi progetti o filtra i dati di lavoro per quella visione perfetta del tuo progresso.",
        },
        card_2: {
          title: "Per qualsiasi dato in Plane",
          description:
            "Vai oltre l'Analitica predefinita e i grafici dei Cicli già pronti per guardare ai team, alle iniziative o a qualsiasi altra cosa come non hai mai fatto prima.",
        },
        card_3: {
          title: "Per tutte le tue esigenze di visualizzazione dati",
          description:
            "Scegli tra diversi grafici personalizzabili con controlli di precisione per vedere e mostrare i tuoi dati di lavoro esattamente come vuoi.",
        },
        card_4: {
          title: "Su richiesta e permanenti",
          description:
            "Costruisci una volta, mantieni per sempre con aggiornamenti automatici dei tuoi dati, indicatori contestuali per le modifiche di ambito e link permanenti condivisibili.",
        },
        card_5: {
          title: "Esportazioni e comunicazioni programmate",
          description:
            "Per quei momenti in cui i link non funzionano, esporta le tue dashboard in PDF una tantum o programmane l'invio automatico agli stakeholder.",
        },
        card_6: {
          title: "Layout automatico per tutti i dispositivi",
          description:
            "Ridimensiona i tuoi widget per il layout che desideri e visualizzalo esattamente allo stesso modo su dispositivi mobili, tablet e altri browser.",
        },
      },
      dashboards_list: {
        title:
          "Visualizza i dati nei widget, costruisci le tue dashboard con i widget e vedi le ultime informazioni su richiesta.",
        description:
          "Costruisci le tue dashboard con Widget Personalizzati che mostrano i tuoi dati nell'ambito che specifichi. Ottieni dashboard per tutto il tuo lavoro tra progetti e team e condividi link permanenti con gli stakeholder per il monitoraggio su richiesta.",
      },
      dashboards_search: {
        title: "Questo non corrisponde al nome di una dashboard.",
        description: "Assicurati che la tua query sia corretta o prova un'altra query.",
      },
      widgets_list: {
        title: "Visualizza i tuoi dati come desideri.",
        description:
          "Usa linee, barre, torte e altri formati per vedere i tuoi dati nel modo che preferisci dalle fonti che specifichi.",
      },
      widget_data: {
        title: "Niente da vedere qui",
        description: "Aggiorna o aggiungi dati per vederli qui.",
      },
    },
    common: {
      editing: "Modifica",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "Consenti nuovi elementi di lavoro",
      work_item_creation_disable_tooltip: "La creazione di elementi di lavoro è disabilitata per questo stato",
      default_state:
        "Stato predefinito consente a tutti i membri di creare nuovi elementi di lavoro. Questo non può essere cambiato",
      state_change_count:
        "{count, plural, one {1 cambiamento stato consentito} other {{count} cambiamenti stato consentiti}}",
      movers_count: "{count, plural, one {1 revisore elencato} other {{count} revisori elencati}}",
      state_changes: {
        label: {
          default: "Aggiungi cambiamento stato consentito",
          loading: "Aggiungi cambiamento stato consentito",
        },
        move_to: "Cambia stato su",
        movers: {
          label: "Quando rivisto da",
          tooltip: "Revisori sono persone che sono consentite per spostare elementi di lavoro da uno stato all'altro.",
          add: "Aggiungi revisori",
        },
      },
    },
    workflow_disabled: {
      title: "Non puoi spostare questo elemento di lavoro qui.",
    },
    workflow_enabled: {
      label: "Cambia stato",
    },
    workflow_tree: {
      label: "Per elementi di lavoro in",
      state_change_label: "può spostarlo su",
    },
    empty_state: {
      upgrade: {
        title: "Controlla il caos dei cambiamenti e delle revisioni con i Flussi di Lavoro.",
        description: "Imposta regole su dove il tuo lavoro si sposta, da chi e quando con i Flussi di Lavoro in Plane.",
      },
    },
    quick_actions: {
      view_change_history: "Visualizza cronologia cambiamenti",
      reset_workflow: "Resetta flusso di lavoro",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "Sei sicuro di voler resettare questo flusso di lavoro?",
        description:
          "Se resetti questo flusso di lavoro, tutte le tue regole di cambiamento stato verranno eliminate e dovrai crearle di nuovo per eseguirle in questo progetto.",
      },
      delete_state_change: {
        title: "Sei sicuro di voler eliminare questa regola di cambiamento stato?",
        description:
          "Una volta eliminata, non puoi annullare questo cambiamento e dovrai impostare nuovamente la regola se la vuoi eseguire per questo progetto.",
      },
    },
    toasts: {
      enable_disable: {
        loading: "{action} flusso di lavoro",
        success: {
          title: "Successo",
          message: "Flusso di lavoro {action} con successo",
        },
        error: {
          title: "Errore",
          message: "Flusso di lavoro non può essere {action}. Per favore riprova.",
        },
      },
      reset: {
        success: {
          title: "Successo",
          message: "Flusso di lavoro resettato con successo",
        },
        error: {
          title: "Errore resettando flusso di lavoro",
          message: "Flusso di lavoro non può essere resettato. Per favore riprova.",
        },
      },
      add_state_change_rule: {
        error: {
          title: "Errore aggiungendo regola cambiamento stato",
          message: "Regola cambiamento stato non può essere aggiunta. Per favore riprova.",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "Errore modificando regola cambiamento stato",
          message: "Regola cambiamento stato non può essere modificata. Per favore riprova.",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "Errore rimuovendo regola cambiamento stato",
          message: "Regola cambiamento stato non può essere rimossa. Per favore riprova.",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "Errore modificando revisori cambiamento stato",
          message: "Revisori cambiamento stato non può essere modificato. Per favore riprova.",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {Cliente} other {Clienti}}",
    dropdown: {
      placeholder: "Seleziona cliente",
      required: "Seleziona un cliente",
      no_selection: "Nessun cliente",
    },
    upgrade: {
      title: "Dai priorità e gestisci il lavoro con i clienti.",
      description: "Collega il tuo lavoro ai clienti e assegna priorità in base agli attributi dei clienti.",
    },
    properties: {
      default: {
        title: "Proprietà predefinite",
        customer_name: {
          name: "Nome del cliente",
          placeholder: "Questo potrebbe essere il nome di una persona o di un'azienda",
          validation: {
            required: "Il nome del cliente è obbligatorio.",
            max_length: "Il nome del cliente non può superare i 255 caratteri.",
          },
        },
        description: {
          name: "Descrizione",
          validation: {},
        },
        email: {
          name: "E-mail",
          placeholder: "Inserisci l'e-mail",
          validation: {
            required: "L'e-mail è obbligatoria.",
            pattern: "Indirizzo e-mail non valido.",
          },
        },
        website_url: {
          name: "Sito web",
          placeholder: "Qualsiasi URL con https:// funzionerà.",
          placeholder_short: "Aggiungi sito web",
          validation: {
            pattern: "URL del sito web non valida",
          },
        },
        employees: {
          name: "Dipendenti",
          placeholder: "Numero di dipendenti se il tuo cliente è un'azienda.",
          validation: {
            min_length: "Il numero di dipendenti non può essere inferiore a 0.",
            max_length: "Il numero di dipendenti non può essere superiore a 2147483647.",
          },
        },
        size: {
          name: "Dimensione",
          placeholder: "Aggiungi la dimensione dell'azienda",
          validation: {
            min_length: "Dimensione non valida",
          },
        },
        domain: {
          domain: "Industria",
          placeholder: "Retail, e-Commerce, Fintech, Banca",
          placeholder_short: "Aggiungi settore",
          validation: {},
        },
        stage: {
          name: "Fase",
          placeholder: "Seleziona fase",
          validation: {},
        },
        contract_status: {
          name: "Stato del contratto",
          placeholder: "Seleziona lo stato del contratto",
          validation: {},
        },
        revenue: {
          name: "Fatturato",
          placeholder: "Questo è il fatturato annuale generato dal tuo cliente.",
          placeholder_short: "Aggiungi fatturato",
          validation: {
            min_length: "Il fatturato non può essere inferiore a 0.",
          },
        },
        invalid_value: "Valore proprietà non valido.",
      },
      custom: {
        title: "Proprietà personalizzate",
        info: "Aggiungi gli attributi unici dei tuoi clienti a Plane per gestire meglio gli elementi di lavoro o i record dei clienti.",
      },
      empty_state: {
        title: "Aggiungi proprietà personalizzate",
        description:
          "Le proprietà personalizzate che desideri mappare manualmente o automaticamente al tuo CRM appariranno qui.",
      },
      add: {
        primary_button: "Aggiungi nuova proprietà",
      },
    },
    stage: {
      lead: "Lead",
      sales_qualified_lead: "Lead qualificato",
      contract_negotiation: "Negoziazione del contratto",
      closed_won: "Chiuso vinto",
      closed_lost: "Chiuso perso",
    },
    contract_status: {
      active: "Attivo",
      pre_contract: "Pre-contratto",
      signed: "Firmato",
      inactive: "Inattivo",
    },
    empty_state: {
      detail: {
        title: "Non abbiamo trovato questo record del cliente.",
        description: "Il link a questo record potrebbe essere errato o questo record potrebbe essere stato eliminato.",
        primary_button: "Vai ai clienti",
        secondary_button: "Aggiungi un cliente",
      },
      search: {
        title: "Sembra che non ci siano record di clienti corrispondenti a questo termine.",
        description:
          "Prova con un altro termine di ricerca o contattaci se sei sicuro che dovresti vedere dei risultati per questo termine.",
      },
      list: {
        title:
          "Gestisci il volume, il ritmo e il flusso del tuo lavoro in base a ciò che è importante per i tuoi clienti.",
        description:
          "Con la funzione Clienti, esclusiva di Plane, puoi ora creare nuovi clienti da zero e collegarli al tuo lavoro. Presto potrai importarli da altri strumenti insieme ai loro attributi personalizzati che contano per te.",
        primary_button: "Aggiungi il tuo primo cliente",
      },
    },
    settings: {
      unauthorized: "Non sei autorizzato ad accedere a questa pagina.",
      description: "Monitora e gestisci le relazioni con i clienti nel tuo flusso di lavoro.",
      enable: "Abilita clienti",
      toasts: {
        enable: {
          loading: "Abilitazione della funzione clienti...",
          success: {
            title: "Hai attivato la funzione Clienti per questo spazio di lavoro.",
            message:
              "I membri possono ora aggiungere record clienti, collegarli agli elementi di lavoro e altro ancora.",
          },
          error: {
            title: "Questa volta non siamo riusciti ad attivare la funzione Clienti.",
            message: "Riprova o torna a questa schermata più tardi. Se ancora non funziona.",
            action: "Contatta il supporto",
          },
        },
        disable: {
          loading: "Disabilitazione della funzione clienti...",
          success: {
            title: "Clienti disabilitati",
            message: "La funzione Clienti è stata disabilitata con successo!",
          },
          error: {
            title: "Errore",
            message: "Impossibile disabilitare la funzione Clienti!",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "Non siamo riusciti a ottenere l'elenco dei clienti.",
          message: "Riprova o aggiorna questa pagina.",
        },
      },
      copy_link: {
        title: "Hai copiato il link diretto a questo cliente.",
        message: "Incollalo ovunque e ti riporterà direttamente qui.",
      },
      create: {
        success: {
          title: "{customer_name} è ora disponibile",
          message: "Puoi fare riferimento a questo cliente negli elementi di lavoro e tracciare le richieste da loro.",
          actions: {
            view: "Visualizza",
            copy_link: "Copia link",
            copied: "Copiato!",
          },
        },
        error: {
          title: "Questa volta non siamo riusciti a creare questo record.",
          message:
            "Prova a salvarlo di nuovo o copia il testo non salvato in una nuova voce, preferibilmente in un'altra scheda.",
        },
      },
      update: {
        success: {
          title: "Successo!",
          message: "Cliente aggiornato con successo!",
        },
        error: {
          title: "Errore!",
          message: "Impossibile aggiornare il cliente. Riprova!",
        },
      },
      logo: {
        error: {
          title: "Non siamo riusciti a caricare il logo del cliente.",
          message: "Prova a salvare di nuovo il logo o ricomincia da capo.",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "Hai rimosso un elemento di lavoro da questo record del cliente.",
            message: "Abbiamo anche rimosso automaticamente questo cliente dall'elemento di lavoro.",
          },
          error: {
            title: "Errore!",
            message:
              "Questa volta non siamo riusciti a rimuovere questo elemento di lavoro da questo record del cliente.",
          },
        },
        add: {
          error: {
            title:
              "Questa volta non siamo riusciti ad aggiungere questo elemento di lavoro a questo record del cliente.",
            message:
              "Prova ad aggiungere di nuovo questo elemento di lavoro o torna più tardi. Se ancora non funziona, contattaci.",
          },
          success: {
            title: "Hai aggiunto un elemento di lavoro a questo record del cliente.",
            message: "Abbiamo anche aggiunto automaticamente questo cliente all'elemento di lavoro.",
          },
        },
      },
    },
    quick_actions: {
      edit: "Modifica",
      copy_link: "Copia link al cliente",
      delete: "Elimina",
    },
    create: {
      label: "Crea un record cliente",
      loading: "Creazione in corso",
      cancel: "Annulla",
    },
    update: {
      label: "Aggiorna cliente",
      loading: "Aggiornamento in corso",
    },
    delete: {
      title: "Sei sicuro di voler eliminare il record cliente {customer_name}?",
      description:
        "Tutti i dati associati a questo record verranno eliminati definitivamente. Non potrai ripristinare questo record in seguito.",
    },
    requests: {
      empty_state: {
        list: {
          title: "Non ci sono ancora richieste da mostrare.",
          description: "Crea richieste dai tuoi clienti per poterle collegare agli elementi di lavoro.",
          button: "Aggiungi nuova richiesta",
        },
        search: {
          title: "Sembra che non ci siano richieste corrispondenti a questo termine.",
          description:
            "Prova con un altro termine di ricerca o contattaci se sei sicuro che dovresti vedere dei risultati per questo termine.",
        },
      },
      label: "{count, plural, one {Richiesta} other {Richieste}}",
      add: "Aggiungi richiesta",
      create: "Crea richiesta",
      update: "Aggiorna richiesta",
      form: {
        name: {
          placeholder: "Assegna un nome a questa richiesta",
          validation: {
            required: "Il nome è obbligatorio.",
            max_length: "Il nome della richiesta non deve superare i 255 caratteri.",
          },
        },
        description: {
          placeholder:
            "Descrivi la natura della richiesta o incolla il commento di questo cliente da un altro strumento.",
        },
        source: {
          add: "Aggiungi sorgente",
          update: "Aggiorna sorgente",
          url: {
            label: "URL",
            required: "L'URL è obbligatoria",
            invalid: "URL del sito web non valida",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "Link copiato",
          message: "Il link della richiesta del cliente è stato copiato negli appunti.",
        },
        attachment: {
          upload: {
            loading: "Caricamento dell'allegato...",
            success: {
              title: "Allegato caricato",
              message: "L'allegato è stato caricato con successo.",
            },
            error: {
              title: "Allegato non caricato",
              message: "Impossibile caricare l'allegato.",
            },
          },
          size: {
            error: {
              title: "Errore!",
              message: "È possibile caricare un solo file alla volta.",
            },
          },
          length: {
            message: "Il file deve essere di {size} MB o meno",
          },
          remove: {
            success: {
              title: "Allegato rimosso",
              message: "L'allegato è stato rimosso con successo",
            },
            error: {
              title: "Allegato non rimosso",
              message: "Impossibile rimuovere l'allegato",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "Successo!",
              message: "Sorgente aggiornata con successo!",
            },
            error: {
              title: "Errore!",
              message: "Impossibile aggiornare la sorgente.",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "Errore!",
              message: "Impossibile aggiungere elementi di lavoro alla richiesta. Riprova.",
            },
            success: {
              title: "Successo!",
              message: "Elementi di lavoro aggiunti alla richiesta.",
            },
          },
        },
        update: {
          success: {
            message: "Richiesta aggiornata con successo!",
            title: "Successo!",
          },
          error: {
            title: "Errore!",
            message: "Impossibile aggiornare la richiesta. Riprova!",
          },
        },
        create: {
          success: {
            message: "Richiesta creata con successo!",
            title: "Successo!",
          },
          error: {
            title: "Errore!",
            message: "Impossibile creare la richiesta. Riprova!",
          },
        },
      },
    },
    linked_work_items: {
      label: "Elementi di lavoro collegati",
      link: "Collega elementi di lavoro",
      empty_state: {
        list: {
          title: "Sembra che tu non abbia ancora collegato elementi di lavoro a questo cliente.",
          description:
            "Collega elementi di lavoro esistenti da qualsiasi progetto qui per poterli tracciare per questo cliente.",
          button: "Collega elemento di lavoro",
        },
      },
      action: {
        remove_epic: "Rimuovi epica",
        remove: "Rimuovi elemento di lavoro",
      },
    },
    sidebar: {
      properties: "Proprietà",
    },
  },
  templates: {
    settings: {
      title: "Modelli",
      description:
        "Risparmia l'80% del tempo dedicato alla creazione di progetti, elementi di lavoro e pagine quando utilizzi i modelli.",
      options: {
        project: {
          label: "Modelli di progetto",
        },
        work_item: {
          label: "Modelli di elementi di lavoro",
        },
        page: {
          label: "Modelli di pagina",
        },
      },
      create_template: {
        label: "Crea modello",
        no_permission: {
          project: "Contatta l'amministratore del tuo progetto per creare modelli",
          workspace: "Contatta l'amministratore del tuo spazio di lavoro per creare modelli",
        },
      },
      use_template: {
        button: {
          default: "Usa modello",
          loading: "Usa modello",
        },
      },
      template_source: {
        workspace: {
          info: "Derivato dallo spazio di lavoro",
        },
        project: {
          info: "Derivato dal progetto",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "Dai un nome al tuo modello di progetto.",
              validation: {
                required: "Il nome del modello è obbligatorio",
                maxLength: "Il nome del modello deve contenere meno di 255 caratteri",
              },
            },
            description: {
              placeholder: "Descrivi quando e come utilizzare questo modello.",
            },
          },
          name: {
            placeholder: "Dai un nome al tuo progetto.",
            validation: {
              required: "Il titolo del progetto è obbligatorio",
              maxLength: "Il titolo del progetto deve contenere meno di 255 caratteri",
            },
          },
          description: {
            placeholder: "Descrivi lo scopo e gli obiettivi di questo progetto.",
          },
          button: {
            create: "Crea modello di progetto",
            update: "Aggiorna modello di progetto",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "Dai un nome al tuo modello di elemento di lavoro.",
              validation: {
                required: "Il nome del modello è obbligatorio",
                maxLength: "Il nome del modello deve contenere meno di 255 caratteri",
              },
            },
            description: {
              placeholder: "Descrivi quando e come utilizzare questo modello.",
            },
          },
          name: {
            placeholder: "Dai un titolo a questo elemento di lavoro.",
            validation: {
              required: "Il titolo dell'elemento di lavoro è obbligatorio",
              maxLength: "Il titolo dell'elemento di lavoro deve contenere meno di 255 caratteri",
            },
          },
          description: {
            placeholder:
              "Descrivi questo elemento di lavoro in modo che sia chiaro cosa otterrai quando lo completerai.",
          },
          button: {
            create: "Crea modello di elemento di lavoro",
            update: "Aggiorna modello di elemento di lavoro",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "Nome il tuo modello di pagina.",
              validation: {
                required: "Il nome del modello è obbligatorio",
                maxLength: "Il nome del modello deve contenere meno di 255 caratteri",
              },
            },
            description: {
              placeholder: "Descrivi quando e come utilizzare questo modello.",
            },
          },
          name: {
            placeholder: "Pagina senza titolo",
            validation: {
              maxLength: "Il nome della pagina deve contenere meno di 255 caratteri",
            },
          },
          button: {
            create: "Crea modello di pagina",
            update: "Aggiorna modello di pagina",
          },
        },
        publish: {
          action: "{isPublished, select, true {Impostazioni di pubblicazione} other {Pubblica nel Marketplace}}",
          unpublish_action: "Rimuovi dal Marketplace",
          title: "Rendi il tuo modello scopribile e riconoscibile.",
          name: {
            label: "Nome del modello",
            placeholder: "Dai un nome al tuo modello",
            validation: {
              required: "Il nome del modello è obbligatorio",
              maxLength: "Il nome del modello deve contenere meno di 255 caratteri",
            },
          },
          short_description: {
            label: "Descrizione breve",
            placeholder:
              "Questo modello è ottimo per i Project Managers che gestiscono più progetti contemporaneamente.",
            validation: {
              required: "La descrizione breve è obbligatoria",
            },
          },
          description: {
            label: "Descrizione",
            placeholder: `Migliora la produttività e semplifica la comunicazione con la nostra integrazione di riconoscimento vocale.
• Trascrizione in tempo reale: Converti parole pronunciate in testo preciso istantaneamente.
• Creazione di attività e commenti: Aggiungi attività, descrizioni e commenti tramite comandi vocali.`,
            validation: {
              required: "La descrizione è obbligatoria",
            },
          },
          category: {
            label: "Categoria",
            placeholder: "Scegli dove pensi che questo si adatti meglio. Puoi scegliere più di una.",
            validation: {
              required: "Almeno una categoria è obbligatoria",
            },
          },
          keywords: {
            label: "Parole chiave",
            placeholder: "Usa termini che pensi che i tuoi utenti cercheranno quando cercano questo modello.",
            helperText:
              "Inserisci parole chiave separate da virgole che aiuteranno le persone a trovare questo dalla ricerca.",
            validation: {
              required: "Almeno una parola chiave è obbligatoria",
            },
          },
          company_name: {
            label: "Nome dell'azienda",
            placeholder: "Plane",
            validation: {
              required: "Il nome dell'azienda è obbligatorio",
              maxLength: "Il nome dell'azienda deve contenere meno di 255 caratteri",
            },
          },
          contact_email: {
            label: "Email di supporto",
            placeholder: "help@plane.so",
            validation: {
              invalid: "Indirizzo email non valido",
              required: "L'email di supporto è obbligatoria",
              maxLength: "L'email di supporto deve contenere meno di 255 caratteri",
            },
          },
          privacy_policy_url: {
            label: "Link alla tua politica privacy",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "URL non valido",
              maxLength: "URL deve contenere meno di 800 caratteri",
            },
          },
          terms_of_service_url: {
            label: "Link alla tua politica di utilizzo",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "URL non valido",
              maxLength: "URL deve contenere meno di 800 caratteri",
            },
          },
          cover_image: {
            label: "Aggiungi un'immagine di copertina che verrà visualizzata nel marketplace",
            upload_title: "Carica immagine di copertina",
            upload_placeholder: "Clicca per caricare o trascina e rilascia per caricare un'immagine di copertina",
            drop_here: "Rilascia qui",
            click_to_upload: "Clicca per caricare",
            invalid_file_or_exceeds_size_limit: "File non valido o supera il limite di dimensione. Per favore riprova.",
            upload_and_save: "Carica e salva",
            uploading: "Caricamento",
            remove: "Rimuovi",
            removing: "Rimozione",
            validation: {
              required: "L'immagine di copertina è obbligatoria",
            },
          },
          attach_screenshots: {
            label: "Includi documenti e immagini che pensi aiuti a comprendere meglio questo modello.",
            validation: {
              required: "Almeno una schermata è obbligatoria",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "Modelli",
        description:
          "Con i modelli di progetto, elemento di lavoro e pagina in Plane, non devi creare un progetto da zero o impostare manualmente le proprietà degli elementi di lavoro.",
        sub_description: "Recupera l'80% del tuo tempo di amministrazione quando utilizzi i Modelli.",
      },
      no_templates: {
        button: "Crea il tuo primo modello",
      },
      no_labels: {
        description:
          " Nessuna etichetta ancora. Crea etichette per aiutare a organizzare e filtrare gli elementi di lavoro nel tuo progetto.",
      },
      no_work_items: {
        description: "Nessun elemento di lavoro ancora. Aggiungi uno per strutturare il tuo lavoro meglio.",
      },
      no_sub_work_items: {
        description: "Nessun sotto-elemento di lavoro ancora. Aggiungi uno per strutturare il tuo lavoro meglio.",
      },
      page: {
        no_templates: {
          title: "Non ci sono modelli a cui hai accesso.",
          description: "Per favore crea un modello",
        },
        no_results: {
          title: "Questo non corrisponde a nessun modello.",
          description: "Prova a cercare con altri termini.",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "Modello creato",
          message: "{templateName}, il modello di {templateType}, è ora disponibile per il tuo spazio di lavoro.",
        },
        error: {
          title: "Non è stato possibile creare quel modello questa volta.",
          message:
            "Prova a salvare di nuovo i tuoi dettagli o copiali in un nuovo modello, preferibilmente in un'altra scheda.",
        },
      },
      update: {
        success: {
          title: "Modello modificato",
          message: "{templateName}, il modello di {templateType}, è stato modificato.",
        },
        error: {
          title: "Non è stato possibile salvare le modifiche a questo modello.",
          message:
            "Prova a salvare di nuovo i tuoi dettagli o torna a questo modello più tardi. Se ci sono ancora problemi, contattaci.",
        },
      },
      delete: {
        success: {
          title: "Modello eliminato",
          message: "{templateName}, il modello di {templateType}, è stato eliminato dal tuo spazio di lavoro.",
        },
        error: {
          title: "Non è stato possibile eliminare quel modello questa volta.",
          message: "Prova a eliminarlo di nuovo o torna più tardi. Se non riesci a eliminarlo, contattaci.",
        },
      },
      unpublish: {
        success: {
          title: "Modello rimosso",
          message: "{templateName}, il modello di {templateType}, è stato rimosso.",
        },
        error: {
          title: "Non è stato possibile rimuovere quel modello questa volta.",
          message: "Prova a rimuoverlo di nuovo o torna più tardi. Se non riesci a rimuoverlo, contattaci.",
        },
      },
    },
    delete_confirmation: {
      title: "Elimina modello",
      description: {
        prefix: "Sei sicuro di voler eliminare il modello-",
        suffix:
          "? Tutti i dati relativi al modello saranno rimossi definitivamente. Questa azione non può essere annullata.",
      },
    },
    unpublish_confirmation: {
      title: "Rimuovi modello",
      description: {
        prefix: "Sei sicuro di voler rimuovere il modello-",
        suffix: "? Questo modello non sarà più disponibile per gli utenti nel marketplace.",
      },
    },
    dropdown: {
      add: {
        work_item: "Aggiungi nuovo modello",
        project: "Aggiungi nuovo modello",
      },
      label: {
        project: "Scegli un modello di progetto",
        page: "Scegli dal modello",
      },
      tooltip: {
        work_item: "Scegli un modello di elemento di lavoro",
      },
      no_results: {
        work_item: "Nessun modello trovato.",
        project: "Nessun modello trovato.",
      },
    },
  },
  intake_forms: {
    create: {
      title: "Crea un elemento di lavoro",
      "sub-title": "Fai sapere al team su cosa vorresti che lavorassero.",
      name: "Nome",
      email: "Email",
      about: "Di cosa si tratta questo elemento di lavoro?",
      description: "Descrivi cosa dovrebbe succedere",
      description_placeholder:
        "Aggiungi tutti i dettagli che desideri per aiutare il team a identificare la tua situazione e le tue esigenze.",
      loading: "Creazione",
      create_work_item: "Crea elemento di lavoro",
      errors: {
        name: "Il nome è obbligatorio",
        name_max_length: "Il nome deve essere inferiore a 255 caratteri",
        email: "L'email è obbligatoria",
        email_invalid: "Indirizzo email non valido",
        title: "Il titolo è obbligatorio",
        title_max_length: "Il titolo deve essere inferiore a 255 caratteri",
      },
    },
    success: {
      title: "Il tuo elemento di lavoro è ora nella coda del team.",
      description: "Il team può ora approvare o scartare questo elemento di lavoro dalla coda di accettazione.",
      primary_button: {
        text: "Aggiungi un altro elemento di lavoro",
      },
      secondary_button: {
        text: "Scopri di più sull'accettazione",
      },
    },
    how_it_works: {
      title: "Come funziona?",
      heading: "Questo è un modulo di accettazione.",
      description:
        "L'accettazione è una funzionalità di Plane che consente agli amministratori e ai responsabili di progetto di ricevere elementi di lavoro dall'esterno nei loro progetti.",
      steps: {
        step_1: "Questo breve modulo ti consente di creare un nuovo elemento di lavoro in un progetto Plane.",
        step_2:
          "Quando invii questo modulo, viene creato un nuovo elemento di lavoro nell'accettazione di quel progetto.",
        step_3: "Qualcuno di quel progetto o team lo esaminerà.",
        step_4:
          "Se lo approvano, questo elemento verrà spostato nella coda di lavoro del progetto. Altrimenti, verrà rifiutato.",
        step_5:
          "Per verificare lo stato di quell'elemento, contatta il responsabile del progetto, l'admin o chi ti ha inviato il link a questa pagina.",
      },
    },
    type_forms: {
      select_types: {
        title: "Seleziona tipo di elemento di lavoro",
        search_placeholder: "Cerca un tipo di elemento di lavoro",
      },
      actions: {
        select_properties: "Seleziona proprietà",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "Elementi di lavoro ricorrenti",
      description:
        "Imposta il tuo lavoro ricorrente una volta e noi ci occupiamo delle ripetizioni. Vedrai tutto qui quando sarà il momento.",
      new_recurring_work_item: "Nuovo elemento di lavoro ricorrente",
      update_recurring_work_item: "Aggiorna elemento di lavoro ricorrente",
      form: {
        interval: {
          title: "Pianificazione",
          start_date: {
            validation: {
              required: "La data di inizio è obbligatoria",
            },
          },
          interval_type: {
            validation: {
              required: "Il tipo di intervallo è obbligatorio",
            },
          },
        },
        button: {
          create: "Crea elemento di lavoro ricorrente",
          update: "Aggiorna elemento di lavoro ricorrente",
        },
      },
      create_button: {
        label: "Crea elemento di lavoro ricorrente",
        no_permission: "Contatta l'amministratore del progetto per creare elementi di lavoro ricorrenti",
      },
    },
    empty_state: {
      upgrade: {
        title: "Il tuo lavoro, in automatico",
        description:
          "Impostalo una volta sola. Lo riproporremo quando sarà il momento. Passa a Business per rendere il lavoro ricorrente senza sforzo.",
      },
      no_templates: {
        button: "Crea il tuo primo elemento di lavoro ricorrente",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Elemento di lavoro ricorrente creato",
          message: "{name}, l'elemento di lavoro ricorrente, è ora disponibile nel tuo workspace.",
        },
        error: {
          title: "Non siamo riusciti a creare questo elemento di lavoro ricorrente.",
          message:
            "Prova a salvare di nuovo i tuoi dati o copiali in un nuovo elemento di lavoro ricorrente, preferibilmente in un'altra scheda.",
        },
      },
      update: {
        success: {
          title: "Elemento di lavoro ricorrente aggiornato",
          message: "{name}, l'elemento di lavoro ricorrente, è stato aggiornato.",
        },
        error: {
          title: "Non siamo riusciti a salvare le modifiche a questo elemento di lavoro ricorrente.",
          message:
            "Prova a salvare di nuovo i tuoi dati o torna più tardi su questo elemento di lavoro ricorrente. Se il problema persiste, contattaci.",
        },
      },
      delete: {
        success: {
          title: "Elemento di lavoro ricorrente eliminato",
          message: "{name}, l'elemento di lavoro ricorrente, è stato eliminato dal tuo workspace.",
        },
        error: {
          title: "Non siamo riusciti a eliminare questo elemento di lavoro ricorrente.",
          message: "Prova a eliminarlo di nuovo o torna più tardi. Se non riesci ancora a eliminarlo, contattaci.",
        },
      },
    },
    delete_confirmation: {
      title: "Elimina elemento di lavoro ricorrente",
      description: {
        prefix: "Sei sicuro di voler eliminare l'elemento di lavoro ricorrente-",
        suffix:
          "? Tutti i dati relativi all'elemento di lavoro ricorrente saranno rimossi definitivamente. Questa azione non può essere annullata.",
      },
    },
  },
  automations: {
    settings: {
      title: "Automazioni personalizzate",
      create_automation: "Crea automazione",
    },
    scope: {
      label: "Ambito",
      run_on: "Esegui su",
    },
    trigger: {
      label: "Trigger",
      add_trigger: "Aggiungi trigger",
      sidebar_header: "Configurazione trigger",
      input_label: "Qual è il trigger per questa automazione?",
      input_placeholder: "Seleziona un'opzione",
      section_plane_events: "Eventi Plane",
      section_time_based: "Basato sul tempo",
      fixed_schedule: "Pianificazione fissa",
      schedule: {
        frequency: "Frequenza",
        select_day: "Seleziona giorno",
        day_of_month: "Giorno del mese",
        monthly_every: "Ogni",
        monthly_day_aria: "Giorno {day}",
        time: "Ora",
        hour: "Ora",
        minute: "Minuto",
        hour_suffix: "h",
        minute_suffix: "min",
        am: "AM",
        pm: "PM",
        timezone: "Fuso orario",
        timezone_placeholder: "Seleziona un fuso orario",
        frequency_daily: "Giornaliero",
        frequency_weekly: "Settimanale",
        frequency_monthly: "Mensile",
        on: "Il",
        validation_weekly_day_required: "Seleziona almeno un giorno della settimana.",
        validation_monthly_date_required: "Seleziona un giorno del mese.",
        main_content_schedule_summary_daily: "Ogni giorno alle {time} ({timezone}).",
        main_content_schedule_summary_weekly: "Ogni settimana il {days} alle {time} ({timezone}).",
        main_content_schedule_summary_monthly: "Ogni mese il giorno {day} alle {time} ({timezone}).",
        schedule_mode: "Modalità pianificazione",
        schedule_mode_fixed: "Fisso",
        schedule_mode_cron: "Cron",
        cron_expression_label: "Inserisci espressione Cron",
        cron_expression_placeholder: "0 9 * * 1-5",
        cron_invalid: "Espressione cron non valida.",
        cron_preview: 'Questa espressione Cron esegue "{description}".',
        main_content_cron_summary: "{description} ({timezone}).",
      },
      button: {
        previous: "Indietro",
        next: "Aggiungi azione",
      },
    },
    condition: {
      label: "A condizione che",
      add_condition: "Aggiungi condizione",
      adding_condition: "Aggiungendo condizione",
    },
    action: {
      label: "Azione",
      add_action: "Aggiungi azione",
      sidebar_header: "Azioni",
      input_label: "Cosa fa l'automazione?",
      input_placeholder: "Seleziona un'opzione",
      handler_name: {
        add_comment: "Aggiungi commento",
        change_property: "Cambia proprietà",
      },
      configuration: {
        label: "Configurazione",
        change_property: {
          placeholders: {
            property_name: "Seleziona una proprietà",
            change_type: "Seleziona",
            property_value_select: "{count, plural, one{Seleziona valore} other{Seleziona valori}}",
            property_value_select_date: "Seleziona data",
          },
          validation: {
            property_name_required: "Il nome della proprietà è obbligatorio",
            change_type_required: "Il tipo di modifica è obbligatorio",
            property_value_required: "Il valore della proprietà è obbligatorio",
          },
        },
      },
      comment_block: {
        title: "Aggiungi commento",
      },
      change_property_block: {
        title: "Cambia proprietà",
      },
      validation: {
        delete_only_action: "Disabilita l'automazione prima di eliminare la sua unica azione.",
      },
    },
    conjunctions: {
      and: "E",
      or: "O",
      if: "Se",
      then: "Allora",
    },
    enable: {
      alert:
        "Premi 'Abilita' quando la tua automazione è completa. Una volta abilitata, l'automazione sarà pronta per essere eseguita.",
      validation: {
        required: "L'automazione deve avere un trigger e almeno un'azione per essere abilitata.",
      },
    },
    delete: {
      validation: {
        enabled: "L'automazione deve essere disabilitata prima di eliminarla.",
      },
    },
    table: {
      title: "Titolo automazione",
      last_run_on: "Ultima esecuzione il",
      created_on: "Creata il",
      last_updated_on: "Ultimo aggiornamento il",
      last_run_status: "Stato ultima esecuzione",
      average_duration: "Durata media",
      owner: "Proprietario",
      executions: "Esecuzioni",
    },
    create_modal: {
      heading: {
        create: "Crea automazione",
        update: "Aggiorna automazione",
      },
      title: {
        placeholder: "Dai un nome alla tua automazione.",
        required_error: "Il titolo è obbligatorio",
      },
      description: {
        placeholder: "Descrivi la tua automazione.",
      },
      submit_button: {
        create: "Crea automazione",
        update: "Aggiorna automazione",
      },
    },
    delete_modal: {
      heading: "Elimina automazione",
    },
    activity: {
      filters: {
        show_fails: "Mostra errori",
        all: "Tutto",
        only_activity: "Solo attività",
        only_run_history: "Solo cronologia esecuzioni",
      },
      run_history: {
        initiator: "Iniziatore",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Successo!",
          message: "Automazione creata con successo.",
        },
        error: {
          title: "Errore!",
          message: "Creazione automazione fallita.",
        },
      },
      update: {
        success: {
          title: "Successo!",
          message: "Automazione aggiornata con successo.",
        },
        error: {
          title: "Errore!",
          message: "Aggiornamento automazione fallito.",
        },
      },
      enable: {
        success: {
          title: "Successo!",
          message: "Automazione abilitata con successo.",
        },
        error: {
          title: "Errore!",
          message: "Abilitazione automazione fallita.",
        },
      },
      disable: {
        success: {
          title: "Successo!",
          message: "Automazione disabilitata con successo.",
        },
        error: {
          title: "Errore!",
          message: "Disabilitazione automazione fallita.",
        },
      },
      delete: {
        success: {
          title: "Automazione eliminata",
          message: "{name}, l'automazione, è stata eliminata dal tuo progetto.",
        },
        error: {
          title: "Non siamo riusciti a eliminare quell'automazione questa volta.",
          message: "Prova a eliminarla di nuovo o torna più tardi. Se non riesci a eliminarla, contattaci.",
        },
      },
      action: {
        create: {
          error: {
            title: "Errore!",
            message: "Impossibile creare l'azione. Riprova!",
          },
        },
        update: {
          error: {
            title: "Errore!",
            message: "Impossibile aggiornare l'azione. Riprova!",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "Non ci sono ancora automazioni da mostrare.",
        description:
          "Le automazioni ti aiutano a eliminare le attività ripetitive impostando trigger, condizioni e azioni. Creane una per risparmiare tempo e mantenere il lavoro in movimento senza sforzo.",
      },
      upgrade: {
        title: "Automazioni",
        description: "Le automazioni sono un modo per automatizzare le attività nel tuo progetto.",
        sub_description: "Recupera l'80% del tuo tempo amministrativo quando usi le Automazioni.",
      },
    },
  },
  sso: {
    header: "Identità",
    description:
      "Configura il tuo dominio per accedere alle funzionalità di sicurezza inclusa l&apos;autenticazione singola.",
    domain_management: {
      header: "Gestione domini",
      verified_domains: {
        header: "Domini verificati",
        description: "Verifica la proprietà di un dominio email per abilitare l&apos;autenticazione singola.",
        button_text: "Aggiungi dominio",
        list: {
          domain_name: "Nome dominio",
          status: "Stato",
          status_verified: "Verificato",
          status_failed: "Fallito",
          status_pending: "In attesa",
        },
        add_domain: {
          title: "Aggiungi dominio",
          description: "Aggiungi il tuo dominio per configurare SSO e verificarlo.",
          form: {
            domain_label: "Dominio",
            domain_placeholder: "plane.so",
            domain_required: "Il dominio è obbligatorio",
            domain_invalid: "Inserisci un nome di dominio valido (es. plane.so)",
          },
          primary_button_text: "Aggiungi dominio",
          primary_button_loading_text: "Aggiunta in corso",
          toast: {
            success_title: "Successo!",
            success_message: "Dominio aggiunto con successo. Si prega di verificarlo aggiungendo il record DNS TXT.",
            error_message: "Impossibile aggiungere il dominio. Riprova.",
          },
        },
        verify_domain: {
          title: "Verifica il tuo dominio",
          description: "Segui questi passaggi per verificare il tuo dominio.",
          instructions: {
            label: "Istruzioni",
            step_1: "Vai alle impostazioni DNS per il tuo host di dominio.",
            step_2: {
              part_1: "Crea un",
              part_2: "record TXT",
              part_3: "e incolla il valore completo del record fornito di seguito.",
            },
            step_3:
              "Questo aggiornamento di solito richiede alcuni minuti ma può richiedere fino a 72 ore per essere completato.",
            step_4: 'Clicca su "Verifica dominio" per confermare una volta che il tuo record DNS è stato aggiornato.',
          },
          verification_code_label: "Valore del record TXT",
          verification_code_description: "Aggiungi questo record alle tue impostazioni DNS",
          domain_label: "Dominio",
          primary_button_text: "Verifica dominio",
          primary_button_loading_text: "Verifica in corso",
          secondary_button_text: "Lo farò più tardi",
          toast: {
            success_title: "Successo!",
            success_message: "Dominio verificato con successo.",
            error_message: "Impossibile verificare il dominio. Riprova.",
          },
        },
        delete_domain: {
          title: "Elimina dominio",
          description: {
            prefix: "Sei sicuro di voler eliminare",
            suffix: "? Questa azione non può essere annullata.",
          },
          primary_button_text: "Elimina",
          primary_button_loading_text: "Eliminazione in corso",
          secondary_button_text: "Annulla",
          toast: {
            success_title: "Successo!",
            success_message: "Dominio eliminato con successo.",
            error_message: "Impossibile eliminare il dominio. Riprova.",
          },
        },
      },
    },
    providers: {
      header: "Accesso singolo",
      disabled_message: "Aggiungi un dominio verificato per configurare SSO",
      configure: {
        create: "Configura",
        update: "Modifica",
      },
      switch_alert_modal: {
        title: "Passare al metodo SSO {newProviderShortName}?",
        content:
          "Stai per abilitare {newProviderLongName} ({newProviderShortName}). Questa azione disabiliterà automaticamente {activeProviderLongName} ({activeProviderShortName}). Gli utenti che tentano di accedere tramite {activeProviderShortName} non saranno più in grado di accedere alla piattaforma fino a quando non passeranno al nuovo metodo. Sei sicuro di voler procedere?",
        primary_button_text: "Passa",
        primary_button_text_loading: "Passaggio in corso",
        secondary_button_text: "Annulla",
      },
      form_section: {
        title: "Dettagli forniti da IdP per {workspaceName}",
      },
      form_action_buttons: {
        saving: "Salvataggio in corso",
        save_changes: "Salva modifiche",
        configure_only: "Solo configurazione",
        configure_and_enable: "Configura e abilita",
        default: "Salva",
      },
      setup_details_section: {
        title: "{workspaceName} dettagli forniti per il tuo IdP",
        button_text: "Ottieni dettagli di configurazione",
      },
      saml: {
        header: "Abilita SAML",
        description: "Configura il tuo provider di identità SAML per abilitare l&apos;autenticazione singola.",
        configure: {
          title: "Abilita SAML",
          description:
            "Verifica la proprietà di un dominio email per accedere alle funzionalità di sicurezza inclusa l&apos;autenticazione singola.",
          toast: {
            success_title: "Successo!",
            create_success_message: "Provider SAML creato con successo.",
            update_success_message: "Provider SAML aggiornato con successo.",
            error_title: "Errore!",
            error_message: "Impossibile salvare il provider SAML. Riprova.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Dettagli web",
            entity_id: {
              label: "Entity ID | Audience | Informazioni metadati",
              description:
                "Genereremo questa parte dei metadati che identifica questa app Plane come un servizio autorizzato sul tuo IdP.",
            },
            callback_url: {
              label: "URL di accesso singolo",
              description:
                "Genereremo questo per te. Aggiungilo nel campo URL di reindirizzamento di accesso del tuo IdP.",
            },
            logout_url: {
              label: "URL di logout singolo",
              description:
                "Genereremo questo per te. Aggiungilo nel campo URL di reindirizzamento di logout singolo del tuo IdP.",
            },
          },
          mobile_details: {
            header: "Dettagli mobile",
            entity_id: {
              label: "Entity ID | Audience | Informazioni metadati",
              description:
                "Genereremo questa parte dei metadati che identifica questa app Plane come un servizio autorizzato sul tuo IdP.",
            },
            callback_url: {
              label: "URL di accesso singolo",
              description:
                "Genereremo questo per te. Aggiungilo nel campo URL di reindirizzamento di accesso del tuo IdP.",
            },
            logout_url: {
              label: "URL di logout singolo",
              description:
                "Genereremo questo per te. Aggiungilo nel campo URL di reindirizzamento di logout del tuo IdP.",
            },
          },
          mapping_table: {
            header: "Dettagli di mappatura",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "Abilita OIDC",
        description: "Configura il tuo provider di identità OIDC per abilitare l&apos;autenticazione singola.",
        configure: {
          title: "Abilita OIDC",
          description:
            "Verifica la proprietà di un dominio email per accedere alle funzionalità di sicurezza inclusa l&apos;autenticazione singola.",
          toast: {
            success_title: "Successo!",
            create_success_message: "Provider OIDC creato con successo.",
            update_success_message: "Provider OIDC aggiornato con successo.",
            error_title: "Errore!",
            error_message: "Impossibile salvare il provider OIDC. Riprova.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Dettagli web",
            origin_url: {
              label: "Origin URL",
              description:
                "Genereremo questo per questa app Plane. Aggiungilo come origine attendibile nel campo corrispondente del tuo IdP.",
            },
            callback_url: {
              label: "URL di reindirizzamento",
              description:
                "Genereremo questo per te. Aggiungilo nel campo URL di reindirizzamento di accesso del tuo IdP.",
            },
            logout_url: {
              label: "URL di logout",
              description:
                "Genereremo questo per te. Aggiungilo nel campo URL di reindirizzamento di logout del tuo IdP.",
            },
          },
          mobile_details: {
            header: "Dettagli mobile",
            origin_url: {
              label: "Origin URL",
              description:
                "Genereremo questo per questa app Plane. Aggiungilo come origine attendibile nel campo corrispondente del tuo IdP.",
            },
            callback_url: {
              label: "URL di reindirizzamento",
              description:
                "Genereremo questo per te. Aggiungilo nel campo URL di reindirizzamento di accesso del tuo IdP.",
            },
            logout_url: {
              label: "URL di logout",
              description:
                "Genereremo questo per te. Aggiungilo nel campo URL di reindirizzamento di logout del tuo IdP.",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "Il nome del progetto non può contenere caratteri speciali.",
  pql: {
    functions: {
      date: {
        now: {
          description: "Data e ora attuali",
        },
        today: {
          description: "La data di oggi",
        },
        start_of_day: {
          description: "Inizio di oggi",
        },
        end_of_day: {
          description: "Fine di oggi",
        },
        start_of_week: {
          description: "Inizio della settimana corrente",
        },
        end_of_week: {
          description: "Fine della settimana corrente",
        },
        start_of_month: {
          description: "Inizio del mese corrente",
        },
        end_of_month: {
          description: "Fine del mese corrente",
        },
        start_of_year: {
          description: "Inizio dell'anno corrente",
        },
        end_of_year: {
          description: "Fine dell'anno corrente",
        },
        days_ago: {
          description: "Data n giorni fa",
        },
        days_from_now: {
          description: "Data tra n giorni",
        },
        weeks_ago: {
          description: "Data n settimane fa",
        },
        weeks_from_now: {
          description: "Data tra n settimane",
        },
        months_ago: {
          description: "Data n mesi fa",
        },
        months_from_now: {
          description: "Data tra n mesi",
        },
      },
      user: {
        current_user: {
          description: "Utente attualmente connesso",
        },
        members_of: {
          description: 'Membri di "project:<id>" o "teamspace:<id>"',
        },
        workspace_members: {
          description: "Tutti i membri dell'area di lavoro",
        },
      },
      cycle: {
        active_cycle: {
          description: "Ciclo attivo oggi",
        },
        completed_cycles: {
          description: "Cicli la cui data di fine è passata",
        },
        upcoming_cycles: {
          description: "Cicli la cui data di inizio è nel futuro",
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
          description: "La data di scadenza è passata E lo stato è aperto",
        },
        has_no_assignee: {
          description: "L'elemento di lavoro non ha un assegnatario",
        },
        has_no_label: {
          description: "L'elemento di lavoro non ha etichette",
        },
        is_top_level: {
          description: "Non è un sotto-elemento (nessun genitore)",
        },
        is_sub_work_item: {
          description: "È un sotto-elemento (ha un genitore)",
        },
        is_epic: {
          description: "Epic",
        },
        is_intake: {
          description: "È un elemento di intake",
        },
        is_draft: {
          description: "È una bozza",
        },
        is_archived: {
          description: "È archiviato",
        },
        has_children: {
          description: "Ha almeno un sotto-elemento",
        },
        has_start_and_due_dates: {
          description: "Ha sia la data di inizio che quella di scadenza",
        },
      },
      relation: {
        linked_to: {
          description: "Elementi di lavoro correlati all'elemento dato",
        },
        blocked_by: {
          description: "Elementi di lavoro bloccati dall'elemento dato",
        },
        blocks: {
          description: "Elementi di lavoro che bloccano l'elemento dato",
        },
        child_of: {
          description: "Sotto-elementi dell'elemento dato",
        },
        parent_of: {
          description: "Elemento padre dell'elemento dato",
        },
        duplicate_of: {
          description: "Elementi di lavoro contrassegnati come duplicati dell'elemento dato",
        },
      },
      history: {
        was_ever: {
          description: "Il campo è mai stato impostato su questo valore",
        },
        was: {
          description: "Il campo era precedentemente questo valore (modificato)",
        },
        changed_from: {
          description: "Il campo è stato modificato da questo valore",
        },
        changed_to: {
          description: "Il campo è stato modificato a questo valore",
        },
        changed: {
          description: "Il campo è stato modificato",
        },
        updated_by: {
          description: "Elemento di lavoro aggiornato da questo utente",
        },
        commented_by: {
          description: "Elemento di lavoro commentato da questo utente",
        },
        field_changed_by: {
          description: "Campo modificato da questo utente",
        },
        was_assigned_to: {
          description: "Elemento di lavoro assegnato a questo utente",
        },
        changed_after: {
          description: "Campo modificato dopo questa data",
        },
        changed_before: {
          description: "Campo modificato prima di questa data",
        },
        field_changed_after: {
          description: "Campo modificato dopo questa data",
        },
        field_changed_before: {
          description: "Campo modificato prima di questa data",
        },
        changed_to_after: {
          description: "Campo modificato a questo valore dopo questa data",
        },
        changed_to_before: {
          description: "Campo modificato a questo valore prima di questa data",
        },
        field_changed_between: {
          description: "Campo modificato tra queste date",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "naviga",
      accept: "accetta",
      close: "chiudi",
      pick_date: "Scegli una data",
    },
    placeholder: 'Digita una query e premi "INVIO" per filtrare...',
    error: "Errore durante l'invio della query. Controlla e riprova.",
  },
  releases: {
    label: "{count, plural, one {Rilascio} other {Rilasci}}",
    no_release: "Nessun rilascio",
    unreleased: "Non rilasciato",
    select_releases: "Seleziona rilasci",
    overview: "Panoramica",
    scope: "Ambito",
    page_title: {
      scope: "Rilascio - {name} | Ambito",
      scope_fallback: "Rilascio | Ambito",
    },
    properties: "Proprietà",
    target_date: "Data obiettivo",
    lead: "Responsabile",
    release_tag: "Tag",
    labels: "Etichette",
    description_placeholder: "Aggiungi una descrizione...",
    progress: "Avanzamento",
    completed_work_items: "Elementi di lavoro completati",
    pending_work_items: "Elementi di lavoro in sospeso",
    cancelled_work_items: "Elementi di lavoro annullati",
    scope_page: {
      work_items: "Elementi di lavoro",
      add_work_items: "Aggiungi elementi di lavoro",
      remove_from_release: "Rimuovi dal rilascio",
      empty_state: {
        title: "Nessun elemento di lavoro",
        description: "Aggiungi elementi di lavoro per definire l’ambito del rilascio.",
      },
      confirm_remove: {
        content: "Rimuovere questo elemento di lavoro dal rilascio? Rimarrà nel progetto.",
        primary_button: {
          default: "Rimuovi",
          loading: "Rimozione in corso",
        },
      },
    },
    empty_state: {
      title: "Nessun ambito ancora",
      description: "Aggiungi elementi di lavoro alla release per tracciarne il completamento per questa release.",
      add_scope: "Aggiungi ambito",
      not_found: {
        title: "Rilascio non trovato",
        description: "Il rilascio potrebbe essere stato eliminato.",
        primary_button: "Torna ai rilasci",
      },
    },
    toast: {
      work_items_added: "{count, plural, one {Elemento di lavoro aggiunto} other {Elementi di lavoro aggiunti}}",
      work_items_error: "Impossibile aggiungere gli elementi di lavoro",
    },
    count_releases: "{count, plural, one {# rilascio} other {# rilasci}}",
    actions: {
      delete: "Elimina",
    },
    delete_modal: {
      title: "Elimina rilascio",
      content: 'Sei sicuro di voler eliminare il rilascio "{releaseName}"? Questa azione non può essere annullata.',
    },
    settings: {
      heading: {
        title: "Rilasci",
        description: "Gestisci con precisione le consegne del progetto con i rilasci.",
      },
      toggle: {
        title: "Abilita rilasci",
        description:
          "I membri del workspace avranno accesso in sola visualizzazione all'ambito nei rispettivi progetti.",
      },
      toasts: {
        enable: {
          loading: "Abilitazione dei rilasci...",
          success: {
            title: "Rilasci abilitati",
            message: "I rilasci sono stati abilitati per questo workspace.",
          },
          error: {
            title: "Errore",
            message: "Impossibile abilitare i rilasci. Riprova.",
          },
        },
        disable: {
          loading: "Disabilitazione dei rilasci...",
          success: {
            title: "Rilasci disabilitati",
            message: "I rilasci sono stati disabilitati per questo workspace.",
          },
          error: {
            title: "Errore",
            message: "Impossibile disabilitare i rilasci. Riprova.",
          },
        },
      },
      tabs: {
        tags: "Tag di rilascio",
        labels: "Etichette",
      },
      tags: {
        title: "Tag di rilascio",
        description: "Classifica e filtra i tuoi rilasci usando i tag.",
        add: "Aggiungi tag",
        empty_state: "Nessun tag ancora. Crea il tuo primo tag.",
        errors: {
          version_required: "La versione è obbligatoria.",
          version_already_exists: "Esiste già un tag con questa versione.",
          generic: "Si è verificato un errore. Riprova.",
        },
        delete_modal: {
          title: "Elimina tag",
          content: 'Sei sicuro di voler eliminare il tag "{tagVersion}"? Questa azione non può essere annullata.',
        },
        actions: {
          edit: "Modifica tag",
          delete: "Elimina tag",
        },
        toasts: {
          delete: {
            success: "Tag eliminato con successo.",
            error: "Impossibile eliminare il tag. Riprova.",
          },
        },
      },
      labels: {
        title: "Etichette",
        description: "Struttura e organizza le tue iniziative con le etichette.",
        add: "Aggiungi etichetta",
        empty_state: "Nessuna etichetta ancora. Crea la tua prima etichetta.",
        errors: {
          name_required: "Il nome è obbligatorio.",
          name_already_exists: "Esiste già un'etichetta con questo nome.",
          generic: "Si è verificato un errore. Riprova.",
        },
        modal: {
          name_placeholder: "Nome etichetta",
          pick_color: "Scegli il colore dell'etichetta",
        },
        actions: {
          edit: "Modifica etichetta",
          delete: "Elimina etichetta",
        },
        drag_to_reorder: "Trascina per riordinare",
        delete_modal: {
          title: "Elimina etichetta",
          content: 'Sei sicuro di voler eliminare l\'etichetta "{labelName}"? Questa azione non può essere annullata.',
        },
        toasts: {
          delete: {
            success: "Etichetta eliminata con successo.",
            error: "Impossibile eliminare l'etichetta. Riprova.",
          },
        },
      },
    },
  },
  work_item_type_hierarchy: {
    settings: {
      title: "Gerarchia",
      tab_label: "Gerarchia",
      description:
        "Configura i livelli di gerarchia per organizzare il tuo lavoro. Ogni livello definisce una relazione genitore con l'elemento direttamente sopra e una relazione figlio con l'elemento direttamente sotto. ",
      sidebar_label: "Gerarchia",
      enable_control: {
        title: "Abilita gerarchia",
        description: "Crea relazioni genitore-figlio tra diversi tipi di elementi di lavoro.",
        tooltip: "Non è possibile disabilitare la gerarchia una volta abilitata.",
      },
      workspace_work_item_types_disabled_banner: {
        content: "Definisci prima i tipi di elementi di lavoro per creare una nuova gerarchia.",
        cta: "Impostazioni tipi elementi di lavoro",
      },
    },
    levels: {
      add_level_button: "Aggiungi livello di gerarchia",
      empty_level_placeholder: "Aggiungi un tipo di elemento di lavoro al livello {level}",
      empty_level_unauthorized: "Nessun tipo di elemento di lavoro trovato in questo livello.",
      zero_level_description:
        "Per impostazione predefinita, tutti i tipi di elementi di lavoro sono al livello 0 finché non vengono assegnati a una gerarchia.",
    },
    add_level_modal: {
      title: "Aggiungi livello di gerarchia",
      description: "Aggiungi un nuovo livello di gerarchia al tipo di elemento di lavoro.",
      work_item_type: "Tipo elemento di lavoro",
      select_placeholder: "Seleziona tipi",
      search_placeholder: "Cerca tipi",
      empty_state: {
        title: "Tutti i tipi di elementi di lavoro in uso",
        description:
          "Ogni tipo di elemento di lavoro definito in questo spazio di lavoro fa già parte della tua gerarchia.",
      },
      invalid_level_toast: {
        title: "Errore!",
        message: "{type_name} non può essere aggiunto al livello {level} poiché viola le regole della gerarchia.",
      },
      error_toast: {
        title: "Errore",
        message: "Impossibile aggiungere il tipo di elemento di lavoro alla gerarchia.",
      },
    },
    work_item_modal: {
      invalid_work_item_type_create_toast: {
        title: "Errore!",
        message:
          "Il tipo di elemento di lavoro selezionato non può essere utilizzato per creare un nuovo elemento di lavoro poiché viola le regole della gerarchia.",
      },
      invalid_work_item_type_update_toast: {
        title: "Errore!",
        message: "Il tipo di elemento di lavoro non può essere aggiornato poiché viola le regole della gerarchia.",
      },
    },
  },
} as const;
