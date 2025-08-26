// 🚀 MAIN MODULE - Inicializácia systému tlačenia štítkov

// Globálne premenné pre uloženie stavu aplikácie
let database = []; // Pole objektov pre databázu produktov (načítané z data.xlsm, zmeny v localStorage)
let labels = []; // Pole objektov pre štítky pripravené na tlač (lokálne pre aktuálnu reláciu, vždy v localStorage)
let printHistory = []; // História tlače (lokálne v localStorage)
let printSets = {}; // Uložené tlačové sady (lokálne v localStorage)
let labelIdCounter = 1; // Počítadlo pre unikátne ID štítkov
let searchTimeout = null; // Pre debounce funkciu vyhľadávania
let currentTheme = 'light'; // Aktuálna téma ('light', 'dark', 'auto')
let currentLanguage = 'sk'; // Aktuálny jazyk ('sk', 'en', 'de')
let showLogo = false; // Zobraziť logo na štítkoch - NASTAVENÉ NA FALSE
let currentTemplate = 'default'; // Aktuálna šablóna štítka - ŠTANDARDNÁ ako default

// Cache pre DOM elementy
const elements = {};

// Preklady pre rôzne jazyky
const translations = {
    sk: {
        'title': 'Tlačenie štítkov PRO',
        'subtitle': 'Profesionálny systém pre Schaeffler',
        'tab-labels': 'Štítky',
        'tab-bulk-print': 'Hromadná tlač',
        'tab-shelf-print': 'Tlač police',
        'tab-name-tag': 'Tlač menovky',
        'tab-history': 'História tlače',
        'tab-settings': 'Nastavenia',
        'search-title': 'Vyhľadať v databáze',
        'search-placeholder': 'Zadajte artikel, názov alebo policu... (Môžete použiť: polica:A1, nazov:"text", artikel:123)',
        'filter-all': 'Všetko',
        'filter-location': 'Umiestnenie',
        'no-results': 'Žiadne výsledky',
        'quick-label': 'Rýchly štítok',
        'label-artikel': 'Artikel',
        'label-name': 'Názov',
        'label-shelf': 'Polica',
        'btn-add-print': 'Pridať na tlač',
        'btn-save-print': 'Uložiť + tlač',
        'preview-title': 'Náhľad štítka (2" x 1")',
        'template-default': 'Štandardný',
        'template-compact': 'Kompaktný',
        'template-detailed': 'Detailný',
        'labels-title': 'Štítky na tlač',
        'labels-count-suffix': 'štítkov',
        'btn-preview': 'Náhľad tlače',
        'btn-print': 'Tlačiť',
        'btn-silent-print': 'Tlačiť priamo (ZPL)',
        'btn-export-pdf': 'Exportovať PDF',
        'empty-title': 'Zatiaľ žiadne štítky na tlač',
        'empty-desc': 'Vyhľadajte produkt alebo pridajte rýchly štítok',
        'stats-title': 'Štatistiky',
        'stat-total': 'Počet artiklov v databáze',
        'db-management': 'Správa databázy',
        'quick-actions': 'Rýchle akcie',
        'btn-clear': 'Vymazať DB',
        'import-files': 'Import súborov',
        'drop-text': 'Pretiahnite súbory sem alebo kliknite pre výber',
        'btn-import': 'Importovať súbory',
        'add-single': 'Pridať jednotlivo',
        'btn-add-db': 'Pridať do databázy',
        'db-preview': 'Databáza (náhľad)',
        'loading': 'Načítavam...',
        'history-title': 'História tlače',
        'btn-clear-history': 'Vymazať históriu',
        'btn-export-history': 'Exportovať históriu',
        'stat-total-printed': 'Celkom vytlačených štítkov',
        'stat-print-sessions': 'Relácií tlače',
        'no-history': 'Zatiaľ žiadna história tlače...',
        'settings-title': 'Nastavenia',
        'setting-theme': 'Téma vzhľadu',
        'theme-light': 'Svetlá',
        'theme-dark': 'Tmavá',
        'theme-auto': 'Automatická',
        'setting-lang': 'Jazyk',
        'setting-logo': 'Logo na štítkoch',
        'logo-show': 'Zobraziť',
        'logo-hide': 'Skryť',
        'setting-template': 'Predvolená šablóna',
        'btn-save-settings': 'Uložiť nastavenia',
        'btn-print-shelf-labels': 'Tlač police',
        'btn-generate-personal-code': 'Generovať',
        'preview-modal-title': 'Náhľad tlače',
        'btn-print-now': 'Tlačiť teraz',
        'toast-success-add-label': 'Štítok bol úspešne pridaný na tlač!',
        'toast-success-save-label': 'Štítok bol úspešne uložený a pridaný na tlač!',
        'toast-success-db-add': 'Položka bola úspešne pridaná do databázy!',
        'toast-success-db-update': 'Položka bola úspešne aktualizovaná v databáze!',
        'toast-success-db-delete': 'Položka bola úspešne odstránená z databázy!',
        'toast-success-import': 'Dáta boli úspešne importované!',
        'toast-success-export': 'Dáta boli úspešne exportované!',
        'toast-success-clear-db': 'Databáza bola úspešne vymazaná!',
        'toast-success-settings': 'Nastavenia boli úspešne uložené!',
        'toast-error-import': 'Chyba pri importe súboru. Skontrolujte formát.',
        'toast-error-barcode': 'Chyba pri generovaní čiarového kódu. Artikel musí byť platný.',
        'toast-error-invalid-artikel': 'Neplatný artikel! Artikel nesmie byť prázdny.',
        'toast-error-bulk': 'Chyba pri hromadnom nahrávaní. Skontrolujte formát riadkov.',
        'toast-error-db-add': 'Chyba pri pridávaní položky do databázy. Skontrolujte vstupy.',
        'toast-error-db-update': 'Chyba pri aktualizácii položky v databázy.',
        'toast-error-db-delete': 'Chyba pri odstraňovaní položky z databázy.',
        'toast-warning-no-labels': 'Žiadne štítky na tlač!',
        'toast-warning-no-data': 'Žiadne dáta v databáze na export!',
        'confirm-clear-db': 'Naozaj chcete vymazať celú databázu? Táto akcia je nevratná!',
        'confirm-delete-item': 'Naozaj chcete odstrániť túto položku z databázy?',
        'db-filter-placeholder': 'Filtrovať databázu...',
        'quantity-label': 'Množstvo:',
        'select-all-labels': 'Označiť všetky',
        'btn-bulk-delete': 'Zmazať označené',
        'btn-bulk-quantity': 'Zmeniť množstvo',
        'bulk-selected-count': 'označených',
        'bulk-change-quantity': 'Nové množstvo pre označené štítky:',
        'toast-success-bulk-delete': 'Označené štítky boli zmazané!',
        'toast-success-bulk-quantity': 'Množstvo bolo zmenené!',
        'toast-error-no-selection': 'Žiadne štítky nie sú označené!',
        'toast-error-invalid-quantity': 'Zadajte platné množstvo!',
        'confirm-bulk-delete': 'Naozaj chcete zmazať označené štítky?',
        'confirm-delete-set': 'Naozaj chcete zmazať túto tlačovú sadu?',
        'select-print-set': 'Vyberte tlačovú sadu...',
        'btn-save-set': 'Uložiť sadu',
        'btn-load-set': 'Načítať sadu',
        'btn-delete-set': 'Zmazať sadu',
        'toast-error-no-set-selected': 'Vyberte tlačovú sadu na načítanie!',
        'preview-nazov-placeholder': 'Ukážkový produkt s dlhším názvom',
        // Bulk print translations
        'bulk-print-title': 'Hromadná tlač',
        'bulk-input-label': 'Zadajte artikly (každý na nový riadok)',
        'bulk-input-placeholder': '123456789\n987654321\n555666777',
        'btn-bulk-add': 'Pridať všetky na tlač',
        'bulk-status-processed': 'Spracované:',
        'bulk-status-added': 'Pridané:',
        'bulk-status-errors': 'Chyby:',
        'bulk-preview-title': 'Náhľad štítka (štandardný)',
        'bulk-help-title': 'Nápoveda',
        'bulk-help-desc': 'Zadajte jeden artikel na každý riadok. Systém automaticky vyhľadá údaje v databáze.',
        'bulk-help-examples': 'Príklady formátov:',
        'bulk-help-note': 'Ak artikel nie je v databáze, vytvorí sa štítok s číslom artiklu ako názvom.',
        'toast-success-bulk-add': 'Hromadná tlač bola úspešne spracovaná!',
        'toast-error-bulk-empty': 'Zadajte aspoň jeden artikel!',
        // Name tag translations  
        'name-tag-title': 'Tlač menovky',
        'name-tag-name-label': 'Meno',
        'name-tag-surname-label': 'Priezvisko',
        'name-tag-personal-number-label': 'Osobné číslo',
        'name-tag-department-label': 'Oddelenie (voliteľné)',
        'name-tag-name-placeholder': 'Ján',
        'name-tag-surname-placeholder': 'Novák',
        'name-tag-personal-number-placeholder': '1234567890',
        'name-tag-department-placeholder': 'IT Podpora',
        'btn-name-tag-add': 'Pridať menovku na tlač',
        'name-tag-preview-title': 'Náhľad menovky',
        'name-tag-help-title': 'Nápoveda',
        'name-tag-help-desc': 'Zadajte meno, priezvisko a osobné číslo zamestnanca. Čiarový kód sa vygeneruje z osobného čísla.',
        'name-tag-help-example': 'Príklad:',
        'name-tag-example-name': 'Meno',
        'name-tag-example-surname': 'Priezvisko',
        'name-tag-example-personal-number': 'Osobné číslo',
        'name-tag-example-department': 'Oddelenie',
        'name-tag-example-barcode': 'Čiarový kód',
        'name-tag-help-note': 'Osobné číslo slúži ako identifikátor a generuje sa do čiarového kódu. Oddelenie je voliteľné.',
        'toast-success-name-tag-add': 'Menovka bola úspešne pridaná na tlač!',
        'toast-error-name-tag-empty': 'Vyplňte všetky povinné polia pre menovku!',
        // Shelf print translations
        'shelf-print-title': 'Tlač police',
        'shelf-fach-label': 'Fach',
        'shelf-fach-placeholder': '0501',
        'shelf-polica-label': 'Polica',
        'shelf-polica-placeholder': '00-00-00',
        'btn-add-shelf-label': 'Pridať štítok police na tlač',
        'shelf-preview-title': 'Náhľad štítka police',
        'shelf-help-title': 'Nápoveda',
        'shelf-help-desc': 'Manuálne zadajte hodnoty pre Fach a Policu. Čiarový kód sa vygeneruje vo formáte "FACH[TAB]POLICA".',
        'shelf-help-example': 'Príklad:',
        'shelf-example-fach': 'Fach:',
        'shelf-example-polica': 'Polica:',
        'shelf-example-barcode': 'Čiarový kód:',
        'shelf-help-note': 'Údaje sa berú z manuálneho zadania, nie z databázy.'
    },
    en: {
        'title': 'Label Printing System PRO',
        'subtitle': 'Professional System for Schaeffler',
        'tab-labels': 'Labels',
        'tab-history': 'Print History',
        'tab-settings': 'Settings',
        'search-title': 'Search Database',
        'search-placeholder': 'Enter article, name or shelf...',
        'filter-all': 'All',
        'filter-location': 'Location',
        'no-results': 'No results',
        'quick-label': 'Quick Label',
        'label-artikel': 'Article',
        'label-name': 'Name',
        'label-shelf': 'Shelf',
        'btn-add-print': 'Add to Print',
        'preview-title': 'Label Preview (2" x 1")',
        'template-default': 'Standard',
        'template-compact': 'Compact',
        'template-detailed': 'Detailed',
        'labels-title': 'Labels to Print',
        'labels-count-suffix': 'labels',
        'btn-preview': 'Print Preview',
        'btn-print': 'Print',
        'btn-silent-print': 'Direct Print (ZPL)',
        'empty-title': 'No labels to print yet',
        'empty-desc': 'Search for a product or add a quick label',
        'stats-title': 'Statistics',
        'stat-total': 'Articles in database',
        'preview-nazov-placeholder': 'Sample product with a longer name',
        'btn-print-shelf-labels': 'Print Shelves',
        'btn-generate-personal-code': 'Generate',
    },
    de: {
        'title': 'Etikettendruck-System PRO',
        'subtitle': 'Professionelles System für Schaeffler',
        'tab-labels': 'Etiketten',
        'tab-history': 'Druckhistorie',
        'tab-settings': 'Einstellungen',
        'search-title': 'Datenbank durchsuchen',
        'search-placeholder': 'Artikel, Name oder Regal eingeben...',
        'filter-all': 'Alle',
        'filter-location': 'Standort',
        'no-results': 'Keine Ergebnisse',
        'quick-label': 'Schnell-Etikett',
        'label-artikel': 'Artikel',
        'label-name': 'Name',
        'label-shelf': 'Regal',
        'btn-add-print': 'Zum Druck hinzufügen',
        'preview-title': 'Etikettenvorschau (2" x 1")',
        'template-default': 'Standard',
        'template-compact': 'Kompakt',
        'template-detailed': 'Detailliert',
        'labels-title': 'Etiketten zum Drucken',
        'labels-count-suffix': 'Etiketten',
        'btn-preview': 'Druckvorschau',
        'btn-print': 'Drucken',
        'btn-silent-print': 'Direkt drucken (ZPL)',
        'empty-title': 'Noch keine Etiketten zum Drucken',
        'empty-desc': 'Suchen Sie nach einem Produkt oder fügen Sie ein Schnell-Etikett hinzu',
        'stats-title': 'Statistiken',
        'stat-total': 'Artikel in der Datenbank',
        'preview-nazov-placeholder': 'Beispielprodukt mit längerem Namen',
        'btn-print-shelf-labels': 'Regale drucken',
        'btn-generate-personal-code': 'Generieren',
    }
};

/**
 * Inicializuje všetky DOM elementy do cache pre rýchlejší prístup.
 */
function initializeElements() {
    // Vyhľadávanie
    elements.searchInput = document.getElementById('searchInput');
    elements.searchResults = document.getElementById('searchResults');
    elements.resultsList = document.getElementById('resultsList');
    
    // Rýchly štítok
    elements.quickArtikel = document.getElementById('quickArtikel');
    elements.quickNazov = document.getElementById('quickNazov');
    elements.quickPolica = document.getElementById('quickPolica');
    elements.addQuickBtn = document.getElementById('addQuickBtn');
    
    // Náhľad
    elements.previewArtikel = document.getElementById('previewArtikel');
    elements.previewNazov = document.getElementById('previewNazov');
    elements.previewPolica = document.getElementById('previewPolica');
    elements.previewBarcode = document.getElementById('previewBarcode');
    elements.templateSelect = document.getElementById('templateSelect');
    
    // Štítky na tlač
    elements.labelsList = document.getElementById('labelsList');
    elements.labelsCount = document.getElementById('labelsCount');
    elements.emptyState = document.getElementById('emptyState');
    elements.previewBtn = document.getElementById('previewBtn');
    elements.printBtn = document.getElementById('printBtn');
    elements.silentPrintBtn = document.getElementById('silentPrintBtn');
    
    // Hromadná tlač
    elements.bulkArtikelInput = document.getElementById('bulkArtikelInput');
    elements.addBulkLabelsBtn = document.getElementById('addBulkLabelsBtn');
    elements.bulkStatus = document.getElementById('bulkStatus');
    elements.bulkProcessedCount = document.getElementById('bulkProcessedCount');
    elements.bulkAddedCount = document.getElementById('bulkAddedCount');
    elements.bulkErrorCount = document.getElementById('bulkErrorCount');
    elements.bulkPreviewArtikel = document.getElementById('bulkPreviewArtikel');
    elements.bulkPreviewNazov = document.getElementById('bulkPreviewNazov');
    elements.bulkPreviewPolica = document.getElementById('bulkPreviewPolica');
    elements.bulkPreviewBarcode = document.getElementById('bulkPreviewBarcode');
    
    // Tlač menovky
    elements.nameTagMeno = document.getElementById('nameTagMeno');
    elements.nameTagPriezvisko = document.getElementById('nameTagPriezvisko');
    elements.nameTagOsobneCislo = document.getElementById('nameTagOsobneCislo');
    elements.nameTagOddelenie = document.getElementById('nameTagOddelenie');
    elements.addNameTagBtn = document.getElementById('addNameTagBtn');
    elements.nameTagPreviewPersonalNumber = document.getElementById('nameTagPreviewPersonalNumber');
    elements.nameTagPreviewFullName = document.getElementById('nameTagPreviewFullName');
    elements.nameTagPreviewDepartment = document.getElementById('nameTagPreviewDepartment');
    elements.nameTagPreviewBarcode = document.getElementById('nameTagPreviewBarcode');
    
    // Tlač police
    elements.shelfFach = document.getElementById('shelfFach');
    elements.shelfPolica = document.getElementById('shelfPolica');
    elements.addShelfLabelBtn = document.getElementById('addShelfLabelBtn');
    elements.shelfPreviewFach = document.getElementById('shelfPreviewFach');
    elements.shelfPreviewShelfDesc = document.getElementById('shelfPreviewShelfDesc');
    elements.shelfPreviewShelfLocation = document.getElementById('shelfPreviewShelfLocation');
    elements.shelfPreviewBarcode = document.getElementById('shelfPreviewBarcode');
    
    // Hromadné operácie
    elements.printSetsSection = document.getElementById('printSetsSection');
    elements.bulkActionsSection = document.getElementById('bulkActionsSection');
    elements.printSetName = document.getElementById('printSetName');
    elements.printSetsSelect = document.getElementById('printSetsSelect');
    
    // Štatistiky
    elements.totalCount = document.getElementById('totalCount');
    
    // Shelf print elements
    elements.shelfFach = document.getElementById('shelfFach');
    elements.shelfPolica = document.getElementById('shelfPolica');
    elements.addShelfLabelBtn = document.getElementById('addShelfLabelBtn');
    elements.shelfPreviewBarcode = document.getElementById('shelfPreviewBarcode');
    elements.shelfPreviewArtikel = document.getElementById('shelfPreviewArtikel');
    elements.shelfPreviewNazov = document.getElementById('shelfPreviewNazov');
    elements.shelfPreviewPolica = document.getElementById('shelfPreviewPolica');
    
    // Name tag elements (updated)
    elements.nameTagFach = document.getElementById('nameTagFach');
    elements.nameTagPolica = document.getElementById('nameTagPolica');
    elements.addNameTagBtn = document.getElementById('addNameTagBtn');
    elements.nameTagPreviewBarcode = document.getElementById('nameTagPreviewBarcode');
    elements.nameTagPreviewArtikel = document.getElementById('nameTagPreviewArtikel');
    elements.nameTagPreviewNazov = document.getElementById('nameTagPreviewNazov');
    elements.nameTagPreviewPolica = document.getElementById('nameTagPreviewPolica');
    
    // Databáza
    elements.databaseList = document.getElementById('databaseList');
    elements.dbSearchInput = document.getElementById('dbSearchInput');
    elements.newArtikel = document.getElementById('newArtikel');
    elements.newNazov = document.getElementById('newNazov');
    elements.newPolica = document.getElementById('newPolica');
    elements.addDatabaseBtn = document.getElementById('addDatabaseBtn');
    
    // História
    elements.historySearchInput = document.getElementById('historySearchInput');
    
    // Nastavenia
    elements.themeSelect = document.getElementById('themeSelect');
    elements.languageSettingSelect = document.getElementById('languageSettingSelect');
    elements.logoSelect = document.getElementById('logoSelect');
    elements.defaultTemplateSelect = document.getElementById('defaultTemplateSelect');
    elements.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    elements.languageSelect = document.getElementById('languageSelect');
    elements.themeToggle = document.getElementById('themeToggle');
    
    // Toast
    elements.toast = document.getElementById('toast');
}

/**
 * Nastavuje všetky event listenery pre aplikáciu.
 */
function setupEventListeners() {
    // --- Header Event Listenery ---
    if (elements.languageSelect) {
        elements.languageSelect.addEventListener('change', (e) => {
            applyLanguage(e.target.value);
            saveDataToLocalStorage();
        });
    }
    
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    }

    // --- Taby ---
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabId = e.target.dataset.tab;
            switchTab(tabId);
        });
    });

    // --- Štítky (Labels) tab Event Listenery ---
    
    // Vyhľadávanie
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', debounce(filterDatabase, 300));
    }
    
    // Filter tlačidlá
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterDatabase();
        });
    });

    // Rýchly štítok
    if (elements.quickArtikel) {
        elements.quickArtikel.addEventListener('input', updateQuickLabelState);
    }
    if (elements.quickNazov) {
        elements.quickNazov.addEventListener('input', updateQuickLabelState);
    }
    if (elements.quickPolica) {
        elements.quickPolica.addEventListener('input', updateQuickLabelState);
    }
    if (elements.addQuickBtn) {
        elements.addQuickBtn.addEventListener('click', addQuickLabel);
    }

    // Template selector
    if (elements.templateSelect) {
        elements.templateSelect.addEventListener('change', (e) => {
            currentTemplate = e.target.value;
            updatePreview();
            saveDataToLocalStorage();
        });
    }

    // Tlačové funkcie
    if (elements.previewBtn) {
        elements.previewBtn.addEventListener('click', showPrintPreview);
    }
    if (elements.printBtn) {
        elements.printBtn.addEventListener('click', printLabels);
    }
    if (elements.silentPrintBtn) {
        elements.silentPrintBtn.addEventListener('click', startSilentPrint);
    }

    // Tlačové sady
    const savePrintSetBtn = document.getElementById('savePrintSetBtn');
    const loadPrintSetBtn = document.getElementById('loadPrintSetBtn');
    const deletePrintSetBtn = document.getElementById('deletePrintSetBtn');
    
    if (savePrintSetBtn) {
        savePrintSetBtn.addEventListener('click', savePrintSet);
    }
    if (loadPrintSetBtn) {
        loadPrintSetBtn.addEventListener('click', loadPrintSet);
    }
    if (deletePrintSetBtn) {
        deletePrintSetBtn.addEventListener('click', deletePrintSet);
    }

    // Hromadné operácie
    const selectAllLabels = document.getElementById('selectAllLabels');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const bulkQuantityBtn = document.getElementById('bulkQuantityBtn');
    
    if (selectAllLabels) {
        selectAllLabels.addEventListener('change', toggleSelectAll);
    }
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', bulkDeleteLabels);
    }
    if (bulkQuantityBtn) {
        bulkQuantityBtn.addEventListener('click', bulkChangeQuantity);
    }

    // --- Hromadná tlač (Bulk Print) tab Event Listenery ---
    if (elements.bulkArtikelInput) {
        elements.bulkArtikelInput.addEventListener('input', updateBulkPrintState);
    }
    if (elements.addBulkLabelsBtn) {
        elements.addBulkLabelsBtn.addEventListener('click', processBulkPrint);
    }

    // --- Tlač menovky (Name Tag) tab Event Listenery ---
    if (elements.nameTagMeno) {
        elements.nameTagMeno.addEventListener('input', updateNameTagButtons);
        elements.nameTagMeno.addEventListener('input', updateNameTagPreview);
    }
    if (elements.nameTagPriezvisko) {
        elements.nameTagPriezvisko.addEventListener('input', updateNameTagButtons);
        elements.nameTagPriezvisko.addEventListener('input', updateNameTagPreview);
    }
    if (elements.nameTagOsobneCislo) {
        elements.nameTagOsobneCislo.addEventListener('input', updateNameTagButtons);
        elements.nameTagOsobneCislo.addEventListener('input', updateNameTagPreview);
    }
    if (elements.nameTagOddelenie) {
        elements.nameTagOddelenie.addEventListener('input', updateNameTagPreview);
    }
    if (elements.addNameTagBtn) {
        elements.addNameTagBtn.addEventListener('click', addNameTag);
    }

    // --- Tlač police (Shelf Print) tab Event Listenery ---
    if (elements.shelfFach) {
        elements.shelfFach.addEventListener('input', updateShelfButtons);
        elements.shelfFach.addEventListener('input', updateShelfPreview);
    }
    if (elements.shelfPolica) {
        elements.shelfPolica.addEventListener('input', updateShelfButtons);
        elements.shelfPolica.addEventListener('input', updateShelfPreview);
    }
    if (elements.addShelfLabelBtn) {
        elements.addShelfLabelBtn.addEventListener('click', addShelfLabel);
    }

    // --- Databáza (Database) tab Event Listenery ---
    
    // File import
    const fileImport = document.getElementById('fileImport');
    const importFileBtn = document.getElementById('importFileBtn');
    const dropZone = document.getElementById('dropZone');
    
    if (fileImport && importFileBtn && dropZone) {
        setupFileImport(fileImport, importFileBtn, dropZone);
    }

    // Export tlačidlá
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const clearDbBtn = document.getElementById('clearDbBtn');
    
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => exportDatabase('csv'));
    }
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => exportDatabase('excel'));
    }
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', () => exportDatabase('json'));
    }
    if (clearDbBtn) {
        clearDbBtn.addEventListener('click', clearDatabase);
    }

    // Pridať jednotlivo
    if (elements.addDatabaseBtn) {
        elements.addDatabaseBtn.addEventListener('click', addSingleToDatabase);
    }

    // Filtrovanie databázy
    if (elements.dbSearchInput) {
        elements.dbSearchInput.addEventListener('input', debounce(renderDatabaseList, 300));
    }

    // --- História tlače (Print History) tab Event Listenery ---
    if (elements.historySearchInput) {
        elements.historySearchInput.addEventListener('input', debounce(updatePrintHistoryDisplay, 300));
    }
    
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const exportHistoryBtn = document.getElementById('exportHistoryBtn');
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearPrintHistory);
    }
    if (exportHistoryBtn) {
        exportHistoryBtn.addEventListener('click', exportPrintHistory);
    }

    // --- Nastavenia (Settings) tab Event Listenery ---
    if (elements.saveSettingsBtn) {
        elements.saveSettingsBtn.addEventListener('click', saveSettings);
    }
}

/**
 * Nastavuje file import funkcionalitu.
 */
function setupFileImport(fileInput, importBtn, dropZone) {
    // Kliknutie na drop zone otvorí file dialog
    dropZone.addEventListener('click', () => fileInput.click());
    
    // Drag & drop functionality
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = 'var(--bg-primary)';
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.backgroundColor = '';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = '';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            importBtn.disabled = false;
        }
    });
    
    // File selection
    fileInput.addEventListener('change', () => {
        importBtn.disabled = fileInput.files.length === 0;
    });
    
    // Import button
    importBtn.addEventListener('click', () => {
        const files = Array.from(fileInput.files);
        files.forEach(file => {
            if (file.name.toLowerCase().endsWith('.xlsm') || file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
                loadDatabaseFromUserFile(file);
            }
        });
    });
}

/**
 * Aktualizuje stav tlačidla "Pridať na tlač" na základe vyplnených polí.
 */
function updateQuickLabelState() {
    const artikel = elements.quickArtikel.value.trim();
    const nazov = elements.quickNazov.value.trim();
    const polica = elements.quickPolica.value.trim();
    
    elements.addQuickBtn.disabled = !artikel || !nazov || !polica;
    
    // Aktualizovať náhľad
    updatePreview();
}

/**
 * Hlavná inicializačná funkcia aplikácie.
 */
async function initializeApp() {
    console.log('🚀 Inicializujem systém tlačenia štítkov...');
    
    // 1. Inicializácia DOM elementov
    initializeElements();
    
    // 2. Načítanie dát z lokálneho úložiska
    loadDataFromLocalStorage();
    
    // 3. Nastavenie event listenerov
    setupEventListeners();
    
    // 4. Inicializácia modulov
    initializePrintModule();
    initializeSettingsModule();
    
    // 5. Aplikovanie načítaných nastavení
    applyTheme(currentTheme);
    applyLanguage(currentLanguage);
    
    // 6. Aktualizácia dropdown-ov
    updatePrintSetsDropdown();
    
    // 7. Načítanie databázy zo servera ak je prázdna
    if (database.length === 0) {
        await loadDatabaseFromServer();
    } else {
        renderDatabaseList();
        updateStats();
    }
    
    // 8. Počiatočné vykreslovanie UI
    renderLabelsToPrint();
    renderSearchResults();
    updatePreview();
    updateNameTagPreview();
    updateShelfPreview();
    updateNameTagButtons();
    updateShelfButtons();
    
    console.log('✅ Systém tlačenia štítkov je pripravený!');
}

/**
 * --- HROMADNÁ TLAČ (BULK PRINT) FUNKCIE ---
 */

/**
 * Aktualizuje stav tlačidla hromadnej tlače na základe obsahu textarea.
 */
function updateBulkPrintState() {
    const input = elements.bulkArtikelInput.value.trim();
    elements.addBulkLabelsBtn.disabled = !input;
    
    // Aktualizovať náhľad s prvým artiklom ak existuje
    if (input) {
        const firstArtikel = input.split('\n')[0].trim();
        updateBulkPreview(firstArtikel);
    } else {
        // Resetovať náhľad
        updateBulkPreview('123456789');
    }
}

/**
 * Aktualizuje náhľad pre hromadnú tlač.
 * @param {string} artikel - Artikel na zobrazenie v náhľade
 */
function updateBulkPreview(artikel) {
    if (!elements.bulkPreviewBarcode || !elements.bulkPreviewArtikel || 
        !elements.bulkPreviewNazov || !elements.bulkPreviewPolica) return;
        
    const formattedArtikel = formatArtikel(artikel);
    
    // Vyhľadať v databáze
    const dbItem = database.find(item => normalizeArtikel(item.artikel) === normalizeArtikel(artikel));
    
    elements.bulkPreviewArtikel.textContent = formattedArtikel;
    elements.bulkPreviewNazov.textContent = dbItem ? dbItem.nazov : artikel;
    elements.bulkPreviewPolica.textContent = dbItem ? dbItem.polica : 'XX-XX-XX';
    
    // Generovať čiarový kód
    try {
        if (typeof JsBarcode !== 'undefined' && elements.bulkPreviewBarcode) {
            JsBarcode(elements.bulkPreviewBarcode, normalizeArtikel(artikel), {
                format: "CODE128",
                width: 1.2,
                height: 20,
                displayValue: false,
                margin: 0
            });
        }
    } catch (error) {
        console.error('Chyba pri generovaní čiarového kódu:', error);
    }
}

/**
 * Spracuje hromadnú tlač artiklov.
 */
function processBulkPrint() {
    const input = elements.bulkArtikelInput.value.trim();
    if (!input) {
        showToast(translations[currentLanguage]['toast-error-bulk-empty'], 'error');
        return;
    }
    
    const artikels = input.split('\n').map(line => line.trim()).filter(line => line);
    let processed = 0;
    let added = 0;
    let errors = 0;
    
    artikels.forEach(artikel => {
        processed++;
        
        try {
            if (!validateArtikel(artikel)) {
                errors++;
                return;
            }
            
            const normalizedArtikel = normalizeArtikel(artikel);
            const dbItem = database.find(item => normalizeArtikel(item.artikel) === normalizedArtikel);
            
            const label = {
                artikel: normalizedArtikel,
                nazov: dbItem ? dbItem.nazov : artikel,
                polica: dbItem ? dbItem.polica : '',
                quantity: 1
            };
            
            addLabelToPrintList(label);
            added++;
        } catch (error) {
            console.error('Chyba pri spracovaní artiklu:', artikel, error);
            errors++;
        }
    });
    
    // Zobrazenie štatistík
    elements.bulkProcessedCount.textContent = processed;
    elements.bulkAddedCount.textContent = added;
    elements.bulkErrorCount.textContent = errors;
    elements.bulkStatus.style.display = 'block';
    
    // Vymazať formulár
    elements.bulkArtikelInput.value = '';
    elements.addBulkLabelsBtn.disabled = true;
    
    showToast(translations[currentLanguage]['toast-success-bulk-add'], 'success');
    
    // Resetovať náhľad
    updateBulkPreview('123456789');
}

/**
 * --- TLAČ MENOVKY (NAME TAG) FUNKCIE ---
 */

/**
 * Aktualizuje stav tlačidla menovky na základe vyplnených polí.
 */
function updateNameTagState() {
    const fach = elements.nameTagFach.value.trim();
    const polica = elements.nameTagPolica.value.trim();
    
    elements.addNameTagBtn.disabled = !fach || !polica;
    
    // Aktualizovať náhľad
    updateNameTagPreview(fach, polica);
}

/**
 * Aktualizuje náhľad pre menovku.
 * @param {string} fach - Fach hodnota
 * @param {string} polica - Polica hodnota
 */
function updateNameTagPreview(fach, polica) {
    if (!elements.nameTagPreviewBarcode || !elements.nameTagPreviewArtikel || 
        !elements.nameTagPreviewNazov || !elements.nameTagPreviewPolica) return;
        
    const artikel = fach || '0501';
    const barcodeValue = `${fach || '0501'}\t${polica || '00-00-00'}`;
    
    elements.nameTagPreviewArtikel.textContent = artikel;
    elements.nameTagPreviewNazov.textContent = 'Menovka štítok';
    elements.nameTagPreviewPolica.textContent = barcodeValue;
    
    // Generovať čiarový kód
    try {
        if (typeof JsBarcode !== 'undefined' && elements.nameTagPreviewBarcode) {
            JsBarcode(elements.nameTagPreviewBarcode, barcodeValue, {
                format: "CODE128",
                width: 1.2,
                height: 20,
                displayValue: false,
                margin: 0
            });
        }
    } catch (error) {
        console.error('Chyba pri generovaní čiarového kódu:', error);
    }
}

/**
 * Pridá menovku do zoznamu na tlač.
 */
function addNameTag() {
    const meno = elements.nameTagMeno ? elements.nameTagMeno.value.trim() : '';
    const priezvisko = elements.nameTagPriezvisko ? elements.nameTagPriezvisko.value.trim() : '';
    const osobneCislo = elements.nameTagOsobneCislo ? elements.nameTagOsobneCislo.value.trim() : '';
    const oddelenie = elements.nameTagOddelenie ? elements.nameTagOddelenie.value.trim() : '';
    
    if (!meno || !priezvisko || !osobneCislo) {
        showToast(translations[currentLanguage]['toast-error-name-tag-empty'], 'error');
        return;
    }
    
    if (!validatePersonalNumber(osobneCislo)) {
        showToast('Neplatné osobné číslo! Musí obsahovať 6-15 číslic.', 'error');
        if (elements.nameTagOsobneCislo) elements.nameTagOsobneCislo.focus();
        return;
    }
    
    const nameTagItem = {
        artikel: osobneCislo, // Use personal number as artikel for internal processing
        nazov: `${meno} ${priezvisko}`,
        polica: oddelenie,
        quantity: 1,
        type: 'nametag', // Mark as name tag type
        meno: meno,
        priezvisko: priezvisko,
        osobneCislo: osobneCislo,
        oddelenie: oddelenie
    };
    
    addLabelToPrintList(nameTagItem, elements.addNameTagBtn);
    
    // Vymazať formulár
    if (elements.nameTagMeno) elements.nameTagMeno.value = '';
    if (elements.nameTagPriezvisko) elements.nameTagPriezvisko.value = '';
    if (elements.nameTagOsobneCislo) elements.nameTagOsobneCislo.value = '';
    if (elements.nameTagOddelenie) elements.nameTagOddelenie.value = '';
    if (elements.addNameTagBtn) elements.addNameTagBtn.disabled = true;
    
    // Resetovať náhľad
    updateNameTagPreview();
    
    showToast(translations[currentLanguage]['toast-success-name-tag-add'], 'success');
}

/**
 * Generuje a nastaví nové osobné číslo s 8-miestnym kódom
 */
/**
 * Aktualizuje stav tlačidla pre pridanie štítka police.
 */
function updateShelfLabelState() {
    const fach = elements.shelfFach.value.trim();
    const polica = elements.shelfPolica.value.trim();
    
    elements.addShelfLabelBtn.disabled = !fach || !polica;
    
    // Aktualizovať náhľad
    updateShelfLabelPreview(fach, polica);
}

/**
 * Aktualizuje náhľad pre štítok police.
 * @param {string} fach - Fach hodnota
 * @param {string} polica - Polica hodnota
 */
function updateShelfLabelPreview(fach, polica) {
    if (!elements.shelfPreviewBarcode || !elements.shelfPreviewArtikel || 
        !elements.shelfPreviewNazov || !elements.shelfPreviewPolica) return;
        
    const artikel = fach || '0501';
    const barcodeValue = `${fach || '0501'}\t${polica || '00-00-00'}`;
    
    elements.shelfPreviewArtikel.textContent = artikel;
    elements.shelfPreviewNazov.textContent = 'Polica štítok';
    elements.shelfPreviewPolica.textContent = barcodeValue;
    
    // Generovať čiarový kód
    try {
        if (typeof JsBarcode !== 'undefined' && elements.shelfPreviewBarcode) {
            JsBarcode(elements.shelfPreviewBarcode, barcodeValue, {
                format: "CODE128",
                width: 1.2,
                height: 20,
                displayValue: false,
                margin: 0
            });
        }
    } catch (error) {
        console.error('Chyba pri generovaní čiarového kódu:', error);
    }
}

/**
 * Pridá štítok police do zoznamu na tlač.
 */
function addShelfLabel() {
    const fach = elements.shelfFach.value.trim();
    const polica = elements.shelfPolica.value.trim();
    
    if (!fach || !polica) {
        showToast('Vyplňte všetky polia pre štítok police!', 'error');
        return;
    }
    
    const barcodeValue = `${fach}\t${polica}`;
    
    addLabelToPrintList({
        artikel: fach, // Keep for compatibility
        nazov: 'Polica štítok',
        polica: barcodeValue,
        quantity: 1,
        type: 'shelf', // Mark as shelf type
        fach: fach, // Add fach field for ZPL generation
        policaLocation: polica // Add policaLocation field for ZPL generation
    }, elements.addShelfLabelBtn);
    
    // Vymazať formulár
    elements.shelfFach.value = '';
    elements.shelfPolica.value = '';
    elements.addShelfLabelBtn.disabled = true;
    
    // Resetovať náhľad
    updateShelfLabelPreview('', '');
    
    showToast('Štítok police bol úspešne pridaný na tlač!', 'success');
}

/**
 * Tlač štítkov políc - generuje štítky vo formáte "polica00-00-00"
 */
function printShelfLabels() {
    // Získať unikátne police z databázy
    const uniqueShelves = [...new Set(database.map(item => item.polica))].filter(shelf => shelf && shelf.trim());
    
    if (uniqueShelves.length === 0) {
        showToast('Žiadne police v databáze na tlač!', 'warning');
        return;
    }
    
    // Vymazať existujúce štítky pred pridaním štítkov políc
    const confirmClear = confirm('Chcete vymazať aktuálne štítky na tlač a nahradiť ich štítkami políc?');
    if (confirmClear) {
        labels.length = 0; // Vymazať existujúce štítky
    }
    
    // Generovať štítky pre každú policu
    uniqueShelves.forEach(shelf => {
        // Formátovať policu do požadovaného formátu
        let formattedShelf = shelf.trim();
        
        // Ak polica už nie je vo formáte "polica00-00-00", pokúsiť sa ju sformátovať
        if (!formattedShelf.match(/^\d{3}\t\d{2}-\d{2}-\d{2}$/)) {
            // Extrahovania čísel z polica (napr. "A1-B2-C3" -> "051")
            const matches = shelf.match(/\d+/g);
            if (matches && matches.length >= 1) {
                const num = matches[0].padStart(3, '0');
                formattedShelf = `${num}\t00-00-00`;
            } else {
                // Ak nie sú žiadne čísla, použiť predvolenú hodnotu
                formattedShelf = `051\t00-00-00`;
            }
        }
        
        // Vytvoriť unikátny artikel pre policu
        const artikel = `POLICA${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
        
        // Extract fach and location from formatted shelf
        const [fach, location] = formattedShelf.split('\t');
        
        // Pridať štítok polica do zoznamu na tlač
        labels.push({
            id: uuidv4(),
            artikel: artikel,
            nazov: `Polica ${shelf}`,
            polica: formattedShelf,
            quantity: 1,
            type: 'shelf', // Mark as shelf type
            fach: fach || '051', // Add fach field for ZPL generation
            policaLocation: location || '00-00-00' // Add policaLocation field for ZPL generation
        });
    });
    
    renderLabelsToPrint();
    saveDataToLocalStorage();
    showToast(`Pridané ${uniqueShelves.length} štítkov políc na tlač!`, 'success');
}


/**
 * Aktualizuje náhľad menovky na základe vstupov.
 */
function updateNameTagPreview() {
    const meno = elements.nameTagMeno ? elements.nameTagMeno.value || 'Ján' : 'Ján';
    const priezvisko = elements.nameTagPriezvisko ? elements.nameTagPriezvisko.value || 'Novák' : 'Novák';
    const osobneCislo = elements.nameTagOsobneCislo ? elements.nameTagOsobneCislo.value || '1234567890' : '1234567890';
    const oddelenie = elements.nameTagOddelenie ? elements.nameTagOddelenie.value || 'IT Podpora' : 'IT Podpora';

    if (elements.nameTagPreviewPersonalNumber) {
        elements.nameTagPreviewPersonalNumber.textContent = osobneCislo;
    }
    if (elements.nameTagPreviewFullName) {
        elements.nameTagPreviewFullName.textContent = `${meno} ${priezvisko}`;
    }
    if (elements.nameTagPreviewDepartment) {
        elements.nameTagPreviewDepartment.textContent = oddelenie;
    }

    // Generovanie čiarového kódu z osobného čísla
    if (elements.nameTagPreviewBarcode) {
        try {
            JsBarcode("#nameTagPreviewBarcode", osobneCislo, {
                format: "CODE128",
                displayValue: false,
                height: 20,
                width: 1,
                margin: 0
            });
        } catch (e) {
            console.error("Chyba pri generovaní náhľadu čiarového kódu menovky:", e);
            elements.nameTagPreviewBarcode.innerHTML = '<text x="0" y="20" font-size="8" fill="red">Neplatné osobné číslo</text>';
        }
    }
}

/**
 * Aktualizuje náhľad štítka police na základe vstupov.
 */
function updateShelfPreview() {
    const fach = elements.shelfFach ? elements.shelfFach.value || '0501' : '0501';
    const polica = elements.shelfPolica ? elements.shelfPolica.value || '00-00-00' : '00-00-00';

    if (elements.shelfPreviewFach) {
        elements.shelfPreviewFach.textContent = fach;
    }
    if (elements.shelfPreviewShelfDesc) {
        elements.shelfPreviewShelfDesc.textContent = 'Polica štítok';
    }
    if (elements.shelfPreviewShelfLocation) {
        elements.shelfPreviewShelfLocation.textContent = `${fach}\t${polica}`;
    }

    // Generovanie čiarového kódu vo formáte "FACH[TAB]POLICA"
    if (elements.shelfPreviewBarcode) {
        try {
            const barcodeData = `${fach}\t${polica}`;
            JsBarcode("#shelfPreviewBarcode", barcodeData, {
                format: "CODE128",
                displayValue: false,
                height: 20,
                width: 1,
                margin: 0
            });
        } catch (e) {
            console.error("Chyba pri generovaní náhľadu čiarového kódu police:", e);
            elements.shelfPreviewBarcode.innerHTML = '<text x="0" y="20" font-size="8" fill="red">Neplatné údaje</text>';
        }
    }
}

/**
 * Aktualizuje stav tlačidiel pre menovky.
 */
function updateNameTagButtons() {
    const meno = elements.nameTagMeno ? elements.nameTagMeno.value.trim() : '';
    const priezvisko = elements.nameTagPriezvisko ? elements.nameTagPriezvisko.value.trim() : '';
    const osobneCislo = elements.nameTagOsobneCislo ? elements.nameTagOsobneCislo.value.trim() : '';

    const isValid = meno && priezvisko && osobneCislo && validatePersonalNumber(osobneCislo);
    if (elements.addNameTagBtn) {
        elements.addNameTagBtn.disabled = !isValid;
    }
}

/**
 * Aktualizuje stav tlačidiel pre police.
 */
function updateShelfButtons() {
    const fach = elements.shelfFach ? elements.shelfFach.value.trim() : '';
    const polica = elements.shelfPolica ? elements.shelfPolica.value.trim() : '';

    const isValid = fach && polica;
    if (elements.addShelfLabelBtn) {
        elements.addShelfLabelBtn.disabled = !isValid;
    }
}

// Spustenie aplikácie po načítaní DOM
document.addEventListener('DOMContentLoaded', initializeApp);

// Nastaviť predvolený text pre placeholder prekladu, ak nie je definovaný
if (!translations.sk['preview-nazov-placeholder']) {
    translations.sk['preview-nazov-placeholder'] = 'Ukážkový produkt s dlhším názvom';
}
if (!translations.en['preview-nazov-placeholder']) {
    translations.en['preview-nazov-placeholder'] = 'Sample product with a longer name';
}
if (!translations.de['preview-nazov-placeholder']) {
    translations.de['preview-nazov-placeholder'] = 'Beispielprodukt mit längerem Namen';
}