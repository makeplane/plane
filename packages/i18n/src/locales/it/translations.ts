export default {
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
  select_or_customize_your_interface_color_scheme: "Seleziona o personalizza lo schema dei colori dell'interfaccia.",
  theme: "Tema",
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
  workspace: "Spazio di lavoro",
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
    "Ti aiuta a identificare in modo univoco gli elementi di lavoro nel progetto. Massimo 10 caratteri.",
  description_placeholder: "Descrizione",
  only_alphanumeric_non_latin_characters_allowed: "Sono ammessi solo caratteri alfanumerici e non latini.",
  project_id_is_required: "L'ID del progetto è obbligatorio",
  project_id_allowed_char: "Sono ammessi solo caratteri alfanumerici e non latini.",
  project_id_min_char: "L'ID del progetto deve contenere almeno 1 carattere",
  project_id_max_char: "L'ID del progetto deve contenere al massimo 10 caratteri",
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
  pages: "Pagine",
  intake: "Accoglienza",
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
  discord: "Discord",
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
  priority: "Priorità",
  none: "Nessuna",
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Bassa",
  members: "Membri",
  assignee: "Assegnatario",
  assignees: "Assegnatari",
  you: "Tu",
  labels: "Etichette",
  create_new_label: "Crea nuova etichetta",
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
    epics: "Epic",
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
    clear_all: "Pulisci tutto",
    copied: "Copiato!",
    link_copied: "Link copiato!",
    link_copied_to_clipboard: "Link copiato negli appunti",
    copied_to_clipboard: "Link dell'elemento di lavoro copiato negli appunti",
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
      body: "Ciao amministratore dell'istanza,\n\nPer favore, crea un nuovo spazio di lavoro con l'URL [/nome-spazio] per [scopo del nuovo spazio].\n\nGrazie,\n{firstName} {lastName}\n{email}",
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
        description:
          "Nessun progetto rilevato con i criteri di ricerca corrispondenti. \n Crea un nuovo progetto invece.",
      },
      search: {
        description: "Nessun progetto rilevato con i criteri di ricerca corrispondenti.\nCrea un nuovo progetto invece",
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
        title: "Token API",
        add_token: "Aggiungi token API",
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
        title: "Ricezione",
        short_title: "Ricezione",
        description:
          "Consenti ai non membri di condividere bug, feedback e suggerimenti; senza interrompere il tuo flusso di lavoro.",
        toggle_title: "Abilita ricezione",
        toggle_description: "Consenti ai membri del progetto di creare richieste di ricezione nell'app.",
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
        description:
          "Nessuna visualizzazione corrisponde ai criteri di ricerca. \n Crea una nuova visualizzazione invece.",
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
} as const;
