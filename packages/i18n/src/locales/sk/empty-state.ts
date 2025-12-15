export default {
  common_empty_state: {
    progress: {
      title: "Zatiaľ nie sú k dispozícii žiadne metriky pokroku.",
      description: "Začnite nastavovať hodnoty vlastností v pracovných položkách, aby ste tu videli metriky pokroku.",
    },
    updates: {
      title: "Zatiaľ žiadne aktualizácie.",
      description: "Akonáhle členovia projektu pridajú aktualizácie, zobrazia sa tu",
    },
    search: {
      title: "Žiadne zodpovedajúce výsledky.",
      description: "Neboli nájdené žiadne výsledky. Skúste upraviť vyhľadávacie výrazy.",
    },
    not_found: {
      title: "Ojej! Niečo sa zdá byť v neporiadku",
      description: "Momentálne sa nám nedarí načítať váš účet plane. Môže ísť o chybu siete.",
      cta_primary: "Skúste znovu načítať",
    },
    server_error: {
      title: "Chyba servera",
      description: "Nemôžeme sa pripojiť a načítať údaje z nášho servera. Nebojte sa, pracujeme na tom.",
      cta_primary: "Skúste znovu načítať",
    },
  },
  project_empty_state: {
    no_access: {
      title: "Zdá sa, že nemáte prístup k tomuto projektu",
      restricted_description: "Kontaktujte administrátora, aby ste požiadali o prístup, a potom tu môžete pokračovať.",
      join_description: "Kliknite na tlačidlo nižšie, aby ste sa pripojili.",
      cta_primary: "Pripojiť sa k projektu",
      cta_loading: "Pripájanie k projektu",
    },
    invalid_project: {
      title: "Projekt nebol nájdený",
      description: "Projekt, ktorý hľadáte, neexistuje.",
    },
    work_items: {
      title: "Začnite s vašou prvou pracovnou položkou.",
      description:
        "Pracovné položky sú stavebnými kameňmi vášho projektu — priraďujte vlastníkov, nastavujte priority a jednoducho sledujte pokrok.",
      cta_primary: "Vytvorte svoju prvú pracovnú položku",
    },
    cycles: {
      title: "Zoskupujte a časovo obmedzte svoju prácu v cykloch.",
      description:
        "Rozdeľte prácu do časovo obmedzených blokov, pracujte spätne od termínu projektu na nastavenie dátumov a dosahujte hmatateľný pokrok ako tým.",
      cta_primary: "Nastavte svoj prvý cyklus",
    },
    cycle_work_items: {
      title: "V tomto cykle nie sú žiadne pracovné položky na zobrazenie",
      description:
        "Vytvorte pracovné položky na začatie sledovania pokroku vášho tímu v tomto cykle a dosiahnutie vašich cieľov včas.",
      cta_primary: "Vytvoriť pracovnú položku",
      cta_secondary: "Pridať existujúcu pracovnú položku",
    },
    modules: {
      title: "Namapujte ciele vášho projektu na moduly a jednoducho sledujte.",
      description:
        "Moduly sa skladajú z prepojených pracovných položiek. Pomáhajú sledovať pokrok prostredníctvom fáz projektu, z ktorých každá má špecifické termíny a analytiku, ktorá ukazuje, ako blízko ste dosiahnutiu týchto fáz.",
      cta_primary: "Nastavte svoj prvý modul",
    },
    module_work_items: {
      title: "V tomto module nie sú žiadne pracovné položky na zobrazenie",
      description: "Vytvorte pracovné položky na začatie sledovania tohto modulu.",
      cta_primary: "Vytvoriť pracovnú položku",
      cta_secondary: "Pridať existujúcu pracovnú položku",
    },
    views: {
      title: "Uložte vlastné pohľady pre váš projekt",
      description:
        "Pohľady sú uložené filtre, ktoré vám pomáhajú rýchlo pristupovať k informáciám, ktoré používate najčastejšie. Spolupracujte bez námahy, zatiaľ čo spolupracovníci zdieľajú a prispôsobujú pohľady svojim špecifickým potrebám.",
      cta_primary: "Vytvoriť pohľad",
    },
    no_work_items_in_project: {
      title: "V projekte zatiaľ nie sú žiadne pracovné položky",
      description:
        "Pridajte pracovné položky do svojho projektu a rozdeľte svoju prácu na sledovateľné časti pomocou pohľadov.",
      cta_primary: "Pridať pracovnú položku",
    },
    work_item_filter: {
      title: "Neboli nájdené žiadne pracovné položky",
      description: "Váš aktuálny filter nevrátil žiadne výsledky. Skúste zmeniť filtre.",
      cta_primary: "Pridať pracovnú položku",
    },
    pages: {
      title: "Dokumentujte všetko — od poznámok po PRD",
      description:
        "Stránky vám umožňujú zachytiť a organizovať informácie na jednom mieste. Píšte poznámky zo stretnutí, projektovú dokumentáciu a PRD, vkladajte pracovné položky a štruktúrujte ich pomocou pripravených komponentov.",
      cta_primary: "Vytvorte svoju prvú stránku",
    },
    archive_pages: {
      title: "Zatiaľ žiadne archivované stránky",
      description: "Archivujte stránky, ktoré nie sú na vašom radare. Pristúpte k nim tu, keď budete potrebovať.",
    },
    intake_sidebar: {
      title: "Zaznamenajte príchodzí požiadavky",
      description:
        "Odosielajte nové požiadavky na preskúmanie, stanovenie priorít a sledovanie v rámci pracovného postupu vášho projektu.",
      cta_primary: "Vytvoriť príchodzí požiadavku",
    },
    intake_main: {
      title: "Vyberte príchodzí pracovnú položku na zobrazenie jej podrobností",
    },
  },
  workspace_empty_state: {
    archive_work_items: {
      title: "Zatiaľ žiadne archivované pracovné položky",
      description:
        "Ručne alebo pomocou automatizácie môžete archivovať dokončené alebo zrušené pracovné položky. Nájdete ich tu, akonáhle budú archivované.",
      cta_primary: "Nastaviť automatizáciu",
    },
    archive_cycles: {
      title: "Zatiaľ žiadne archivované cykly",
      description:
        "Pre upratanie vášho projektu archivujte dokončené cykly. Nájdete ich tu, akonáhle budú archivované.",
    },
    archive_modules: {
      title: "Zatiaľ žiadne archivované moduly",
      description:
        "Pre upratanie vášho projektu archivujte dokončené alebo zrušené moduly. Nájdete ich tu, akonáhle budú archivované.",
    },
    home_widget_quick_links: {
      title: "Majte po ruke dôležité odkazy, zdroje alebo dokumenty pre vašu prácu",
    },
    inbox_sidebar_all: {
      title: "Aktualizácie pre vaše odoberané pracovné položky sa zobrazia tu",
    },
    inbox_sidebar_mentions: {
      title: "Zmienky o vašich pracovných položkách sa zobrazia tu",
    },
    your_work_by_priority: {
      title: "Zatiaľ nie je priradená žiadna pracovná položka",
    },
    your_work_by_state: {
      title: "Zatiaľ nie je priradená žiadna pracovná položka",
    },
    views: {
      title: "Zatiaľ žiadne pohľady",
      description:
        "Pridajte pracovné položky do svojho projektu a používajte pohľady na jednoduché filtrovanie, triedenie a sledovanie pokroku.",
      cta_primary: "Pridať pracovnú položku",
    },
    drafts: {
      title: "Napoly napísané pracovné položky",
      description:
        "Ak to chcete vyskúšať, začnite pridávať pracovnú položku a nechajte ju nedokončenú alebo vytvorte svoj prvý koncept nižšie. 😉",
      cta_primary: "Vytvoriť koncept pracovnej položky",
    },
    projects_archived: {
      title: "Žiadne archivované projekty",
      description: "Vyzerá to, že všetky vaše projekty sú stále aktívne—skvelá práca!",
    },
    analytics_projects: {
      title: "Vytvorte projekty na vizualizáciu metrík projektu tu.",
    },
    analytics_work_items: {
      title:
        "Vytvorte projekty s pracovnými položkami a priradenými osobami na začatie sledovania výkonu, pokroku a dopadu tímu tu.",
    },
    analytics_no_cycle: {
      title: "Vytvorte cykly na organizáciu práce do časovo obmedzených fáz a sledovanie pokroku naprieč šprintmi.",
    },
    analytics_no_module: {
      title: "Vytvorte moduly na organizáciu svojej práce a sledovanie pokroku naprieč rôznymi fázami.",
    },
    analytics_no_intake: {
      title: "Nastavte príjem na správu prichádzajúcich požiadaviek a sledovanie, ako sú prijímané a odmietané",
    },
  },
  settings_empty_state: {
    estimates: {
      title: "Zatiaľ žiadne odhady",
      description:
        "Definujte, ako váš tím meria úsilie, a sledujte to konzistentne naprieč všetkými pracovnými položkami.",
      cta_primary: "Pridať systém odhadov",
    },
    labels: {
      title: "Zatiaľ žiadne štítky",
      description: "Vytvorte personalizované štítky na efektívnu kategorizáciu a správu vašich pracovných položiek.",
      cta_primary: "Vytvorte svoj prvý štítok",
    },
    exports: {
      title: "Zatiaľ žiadne exporty",
      description:
        "Momentálne nemáte žiadne záznamy exportu. Akonáhle exportujete údaje, všetky záznamy sa zobrazia tu.",
    },
    tokens: {
      title: "Zatiaľ žiadny osobný token",
      description:
        "Generujte bezpečné API tokeny na pripojenie vášho pracovného priestoru s externými systémami a aplikáciami.",
      cta_primary: "Pridať API token",
    },
    webhooks: {
      title: "Zatiaľ nebol pridaný žiadny Webhook",
      description: "Automatizujte oznámenia externým službám pri výskyte udalostí projektu.",
      cta_primary: "Pridať webhook",
    },
  },
} as const;
