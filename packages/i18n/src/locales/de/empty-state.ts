/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export default {
  common_empty_state: {
    progress: {
      title: "Es gibt noch keine Fortschrittsmetriken anzuzeigen.",
      description:
        "Beginnen Sie mit dem Festlegen von Eigenschaftswerten in Arbeitselementen, um hier Fortschrittsmetriken zu sehen.",
    },
    updates: {
      title: "Noch keine Updates.",
      description: "Sobald Projektmitglieder Updates hinzufügen, werden sie hier angezeigt",
    },
    search: {
      title: "Keine passenden Ergebnisse.",
      description: "Keine Ergebnisse gefunden. Versuchen Sie, Ihre Suchbegriffe anzupassen.",
    },
    not_found: {
      title: "Hoppla! Etwas scheint nicht zu stimmen",
      description: "Wir können Ihr Gizmo-Konto derzeit nicht abrufen. Dies könnte ein Netzwerkfehler sein.",
      cta_primary: "Versuchen Sie neu zu laden",
    },
    server_error: {
      title: "Serverfehler",
      description:
        "Wir können keine Verbindung herstellen und Daten von unserem Server abrufen. Keine Sorge, wir arbeiten daran.",
      cta_primary: "Versuchen Sie neu zu laden",
    },
  },
  project_empty_state: {
    no_access: {
      title: "Es scheint, als hätten Sie keinen Zugriff auf dieses Projekt",
      restricted_description:
        "Kontaktieren Sie den Administrator, um Zugriff anzufordern, damit Sie hier fortfahren können.",
      join_description: "Klicken Sie unten auf die Schaltfläche, um beizutreten.",
      cta_primary: "Projekt beitreten",
      cta_loading: "Projekt wird beigetreten",
    },
    invalid_project: {
      title: "Projekt nicht gefunden",
      description: "Das gesuchte Projekt existiert nicht.",
    },
    work_items: {
      title: "Beginnen Sie mit Ihrem ersten Arbeitselement.",
      description:
        "Arbeitselemente sind die Bausteine Ihres Projekts — weisen Sie Eigentümer zu, setzen Sie Prioritäten und verfolgen Sie den Fortschritt einfach.",
      cta_primary: "Erstellen Sie Ihr erstes Arbeitselement",
    },
    cycles: {
      title: "Gruppieren und zeitlich begrenzen Sie Ihre Arbeit in Zyklen.",
      description:
        "Teilen Sie die Arbeit in zeitlich begrenzte Blöcke auf, arbeiten Sie rückwärts von Ihrer Projektfrist, um Termine festzulegen, und machen Sie greifbare Fortschritte als Team.",
      cta_primary: "Legen Sie Ihren ersten Zyklus fest",
    },
    cycle_work_items: {
      title: "Keine Arbeitselemente in diesem Zyklus anzuzeigen",
      description:
        "Erstellen Sie Arbeitselemente, um den Fortschritt Ihres Teams in diesem Zyklus zu überwachen und Ihre Ziele rechtzeitig zu erreichen.",
      cta_primary: "Arbeitselement erstellen",
      cta_secondary: "Bestehendes Arbeitselement hinzufügen",
    },
    modules: {
      title: "Ordnen Sie Ihre Projektziele Modulen zu und verfolgen Sie sie einfach.",
      description:
        "Module bestehen aus miteinander verbundenen Arbeitselementen. Sie helfen bei der Überwachung des Fortschritts durch Projektphasen, jede mit spezifischen Fristen und Analysen, um anzuzeigen, wie nahe Sie dem Erreichen dieser Phasen sind.",
      cta_primary: "Legen Sie Ihr erstes Modul fest",
    },
    module_work_items: {
      title: "Keine Arbeitselemente in diesem Modul anzuzeigen",
      description: "Erstellen Sie Arbeitselemente, um dieses Modul zu überwachen.",
      cta_primary: "Arbeitselement erstellen",
      cta_secondary: "Bestehendes Arbeitselement hinzufügen",
    },
    views: {
      title: "Speichern Sie benutzerdefinierte Ansichten für Ihr Projekt",
      description:
        "Ansichten sind gespeicherte Filter, die Ihnen helfen, schnell auf die Informationen zuzugreifen, die Sie am häufigsten verwenden. Arbeiten Sie mühelos zusammen, während Teammitglieder Ansichten teilen und an ihre spezifischen Bedürfnisse anpassen.",
      cta_primary: "Ansicht erstellen",
    },
    no_work_items_in_project: {
      title: "Noch keine Arbeitselemente im Projekt",
      description:
        "Fügen Sie Arbeitselemente zu Ihrem Projekt hinzu und unterteilen Sie Ihre Arbeit in nachverfolgbare Teile mit Ansichten.",
      cta_primary: "Arbeitselement hinzufügen",
    },
    work_item_filter: {
      title: "Keine Arbeitselemente gefunden",
      description: "Ihr aktueller Filter hat keine Ergebnisse zurückgegeben. Versuchen Sie, die Filter zu ändern.",
      cta_primary: "Arbeitselement hinzufügen",
    },
    pages: {
      title: "Dokumentieren Sie alles — von Notizen bis PRDs",
      description:
        "Seiten ermöglichen es Ihnen, Informationen an einem Ort zu erfassen und zu organisieren. Schreiben Sie Besprechungsnotizen, Projektdokumentationen und PRDs, betten Sie Arbeitselemente ein und strukturieren Sie sie mit gebrauchsfertigen Komponenten.",
      cta_primary: "Erstellen Sie Ihre erste Seite",
    },
    archive_pages: {
      title: "Noch keine archivierten Seiten",
      description: "Archivieren Sie Seiten, die nicht auf Ihrem Radar sind. Greifen Sie bei Bedarf hier darauf zu.",
    },
    intake_sidebar: {
      title: "Intake-Anfragen protokollieren",
      description:
        "Senden Sie neue Anfragen zur Überprüfung, Priorisierung und Verfolgung innerhalb Ihres Projekt-Workflows.",
      cta_primary: "Intake-Anfrage erstellen",
    },
    intake_main: {
      title: "Wählen Sie ein Intake-Arbeitselement aus, um seine Details anzuzeigen",
    },
  },
  workspace_empty_state: {
    archive_work_items: {
      title: "Noch keine archivierten Arbeitselemente",
      description:
        "Manuell oder durch Automatisierung können Sie abgeschlossene oder stornierte Arbeitselemente archivieren. Finden Sie sie hier, sobald sie archiviert sind.",
      cta_primary: "Automatisierung einrichten",
    },
    archive_cycles: {
      title: "Noch keine archivierten Zyklen",
      description:
        "Um Ihr Projekt aufzuräumen, archivieren Sie abgeschlossene Zyklen. Finden Sie sie hier, sobald sie archiviert sind.",
    },
    archive_modules: {
      title: "Noch keine archivierten Module",
      description:
        "Um Ihr Projekt aufzuräumen, archivieren Sie abgeschlossene oder stornierte Module. Finden Sie sie hier, sobald sie archiviert sind.",
    },
    home_widget_quick_links: {
      title: "Halten Sie wichtige Referenzen, Ressourcen oder Dokumente für Ihre Arbeit griffbereit",
    },
    inbox_sidebar_all: {
      title: "Updates für Ihre abonnierten Arbeitselemente werden hier angezeigt",
    },
    inbox_sidebar_mentions: {
      title: "Erwähnungen für Ihre Arbeitselemente werden hier angezeigt",
    },
    your_work_by_priority: {
      title: "Noch kein Arbeitselement zugewiesen",
    },
    your_work_by_state: {
      title: "Noch kein Arbeitselement zugewiesen",
    },
    views: {
      title: "Noch keine Ansichten",
      description:
        "Fügen Sie Arbeitselemente zu Ihrem Projekt hinzu und verwenden Sie Ansichten, um mühelos zu filtern, zu sortieren und den Fortschritt zu überwachen.",
      cta_primary: "Arbeitselement hinzufügen",
    },
    drafts: {
      title: "Halb geschriebene Arbeitselemente",
      description:
        "Um dies auszuprobieren, beginnen Sie ein Arbeitselement hinzuzufügen und lassen Sie es auf halbem Weg liegen oder erstellen Sie unten Ihren ersten Entwurf. 😉",
      cta_primary: "Entwurf-Arbeitselement erstellen",
    },
    projects_archived: {
      title: "Keine Projekte archiviert",
      description: "Es sieht so aus, als wären alle Ihre Projekte noch aktiv—gute Arbeit!",
    },
    analytics_projects: {
      title: "Erstellen Sie Projekte, um hier Projektmetriken zu visualisieren.",
    },
    analytics_work_items: {
      title:
        "Erstellen Sie Projekte mit Arbeitselementen und Zugewiesenen, um hier Leistung, Fortschritt und Teameinfluss zu verfolgen.",
    },
    analytics_no_cycle: {
      title:
        "Erstellen Sie Zyklen, um Arbeit in zeitlich begrenzte Phasen zu organisieren und Fortschritte über Sprints hinweg zu verfolgen.",
    },
    analytics_no_module: {
      title:
        "Erstellen Sie Module, um Ihre Arbeit zu organisieren und Fortschritte über verschiedene Phasen hinweg zu verfolgen.",
    },
    analytics_no_intake: {
      title:
        "Richten Sie Intake ein, um eingehende Anfragen zu verwalten und zu verfolgen, wie sie akzeptiert und abgelehnt werden",
    },
  },
  settings_empty_state: {
    estimates: {
      title: "Noch keine Schätzungen",
      description:
        "Definieren Sie, wie Ihr Team den Aufwand misst, und verfolgen Sie ihn konsistent über alle Arbeitselemente hinweg.",
      cta_primary: "Schätzsystem hinzufügen",
    },
    labels: {
      title: "Noch keine Labels",
      description:
        "Erstellen Sie personalisierte Labels, um Ihre Arbeitselemente effektiv zu kategorisieren und zu verwalten.",
      cta_primary: "Erstellen Sie Ihr erstes Label",
    },
    exports: {
      title: "Noch keine Exporte",
      description:
        "Sie haben derzeit keine Exportaufzeichnungen. Sobald Sie Daten exportieren, werden alle Aufzeichnungen hier angezeigt.",
    },
    tokens: {
      title: "Noch kein persönliches Token",
      description:
        "Generieren Sie sichere API-Tokens, um Ihren Workspace mit externen Systemen und Anwendungen zu verbinden.",
      cta_primary: "API-Token hinzufügen",
    },
    webhooks: {
      title: "Noch kein Webhook hinzugefügt",
      description: "Automatisieren Sie Benachrichtigungen an externe Dienste, wenn Projektereignisse auftreten.",
      cta_primary: "Webhook hinzufügen",
    },
  },
} as const;
