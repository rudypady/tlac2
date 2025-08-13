// ⚙️ SETTINGS MODULE - Správa nastavení aplikácie

/**
 * Uloží nastavenia do lokálneho úložiska.
 */
function saveDataToLocalStorage() {
    try {
        // Uložiť dočasné zmeny databázy (budú prepísané po refreshi)
        localStorage.setItem('schaffleLabelDatabase', JSON.stringify(database));
        localStorage.setItem('schaffleLabelsToPrint', JSON.stringify(labels));
        localStorage.setItem('schafflePrintHistory', JSON.stringify(printHistory));
        localStorage.setItem('schafflePrintSets', JSON.stringify(printSets));
        
        // Uložiť nastavenia (zostanú aj po refreshi)
        const settings = {
            theme: currentTheme,
            language: currentLanguage,
            showLogo: showLogo,
            currentTemplate: currentTemplate
        };
        localStorage.setItem('schaffleLabelSettings', JSON.stringify(settings));
        
        console.log('Dáta uložené do localStorage');
    } catch (error) {
        console.error('Chyba pri ukladaní do localStorage:', error);
        showToast('Chyba pri ukladaní nastavení!', 'error');
    }
}

/**
 * Načíta nastavenia z lokálneho úložiska.
 */
function loadDataFromLocalStorage() {
    try {
        // Načítať nastavenia
        const savedSettings = localStorage.getItem('schaffleLabelSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            currentTheme = settings.theme || 'light';
            currentLanguage = settings.language || 'sk';
            showLogo = settings.showLogo !== undefined ? settings.showLogo : false;
            currentTemplate = settings.currentTemplate || 'default'; // Nastavenie "standard" ako default
        }
        
        // Načítať dočasné zmeny databázy
        const savedDatabase = localStorage.getItem('schaffleLabelDatabase');
        if (savedDatabase) {
            database = JSON.parse(savedDatabase);
        }
        
        // Načítať štítky na tlač
        const savedLabels = localStorage.getItem('schaffleLabelsToPrint');
        if (savedLabels) {
            labels = JSON.parse(savedLabels);
        }
        
        // Načítať históriu tlače
        const savedHistory = localStorage.getItem('schafflePrintHistory');
        if (savedHistory) {
            printHistory = JSON.parse(savedHistory);
        }
        
        // Načítať tlačové sady
        const savedPrintSets = localStorage.getItem('schafflePrintSets');
        if (savedPrintSets) {
            printSets = JSON.parse(savedPrintSets);
        }
        
        console.log('Dáta načítané z localStorage');
        
        // Aplikovať načítané nastavenia
        applyTheme(currentTheme);
        applyLanguage(currentLanguage);
        
        // Aktualizovať UI formuláre nastavení
        updateSettingsUI();
        
    } catch (error) {
        console.error('Chyba pri načítaní z localStorage:', error);
        // Ak sa nepodarilo načítať, použiť predvolené nastavenia
        currentTheme = 'light';
        currentLanguage = 'sk';
        showLogo = false;
        currentTemplate = 'default';
    }
}

/**
 * Aktualizuje UI formuláre nastavení podľa aktuálnych hodnôt.
 */
function updateSettingsUI() {
    // Aktualizácia dropdown pre tému
    if (elements.themeSelect) {
        elements.themeSelect.value = currentTheme;
    }
    
    // Aktualizácia dropdown pre jazyk
    if (elements.languageSettingSelect) {
        elements.languageSettingSelect.value = currentLanguage;
    }
    
    // Aktualizácia dropdown pre logo
    if (elements.logoSelect) {
        elements.logoSelect.value = showLogo ? 'show' : 'hide';
    }
    
    // Aktualizácia dropdown pre predvolenú šablónu
    if (elements.defaultTemplateSelect) {
        elements.defaultTemplateSelect.value = currentTemplate;
    }
    
    // Aktualizácia template selector v náhľade
    if (elements.templateSelect) {
        elements.templateSelect.value = currentTemplate;
    }
    
    // Aktualizácia header jazykového selectu
    if (elements.languageSelect) {
        elements.languageSelect.value = currentLanguage;
    }
}

/**
 * Aplikuje jazykové nastavenia na celú aplikáciu.
 * @param {string} lang - Kód jazyka ('sk', 'en', 'de').
 */
function applyLanguage(lang) {
    currentLanguage = lang;
    
    // Aktualizácia textových elementov s data-lang atribútom
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Aktualizácia placeholder textov
    document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
        const key = element.getAttribute('data-lang-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    // Aktualizácia option textov v select elementoch
    document.querySelectorAll('option[data-lang]').forEach(option => {
        const key = option.getAttribute('data-lang');
        if (translations[lang] && translations[lang][key]) {
            option.textContent = translations[lang][key];
        }
    });
    
    // Aktualizácia náhľadu
    updatePreview();
}

/**
 * Aplikuje tému na celú aplikáciu.
 * @param {string} theme - Typ témy ('light', 'dark', 'auto').
 */
function applyTheme(theme) {
    currentTheme = theme;
    const root = document.documentElement;
    
    if (theme === 'auto') {
        // Automatické prepínanie podľa systémových preferencií
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        root.setAttribute('data-theme', theme);
    }
    
    // Aktualizácia ikony v header-i
    updateThemeIcon();
}

/**
 * Aktualizuje ikonu témy v hlavičke.
 */
function updateThemeIcon() {
    const themeIcon = document.getElementById('themeIcon');
    if (!themeIcon) return;
    
    const currentAppliedTheme = document.documentElement.getAttribute('data-theme');
    
    if (currentAppliedTheme === 'dark') {
        // Slnko pre tmavú tému (prepnutie na svetlú)
        themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    } else {
        // Mesiac pre svetlú tému (prepnutie na tmavú)
        themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
}

/**
 * Prepne tému medzi svetlou a tmavou.
 */
function toggleTheme() {
    const currentAppliedTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentAppliedTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    saveDataToLocalStorage();
}

/**
 * Prepne tab na zadaný.
 * @param {string} tabId - ID tabu na aktiváciu.
 */
function switchTab(tabId) {
    // Odstráni active triedu zo všetkých tabov a ich obsahu
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Pridá active triedu k vybranému tabu a jeho obsahu
    const selectedTab = document.querySelector(`[data-tab="${tabId}"]`);
    const selectedContent = document.getElementById(`${tabId}-tab`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
    
    // Aktualizácia obsahu pri prepnutí na konkrétne taby
    if (tabId === 'history') {
        updatePrintHistoryDisplay();
        updatePrintHistoryStats();
    }
    if (tabId === 'labels') {
        updatePreview();
    }
}

/**
 * Uloží všetky nastavenia z formulára nastavení.
 */
function saveSettings() {
    // Získanie hodnôt z formulára
    const newTheme = elements.themeSelect.value;
    const newLanguage = elements.languageSettingSelect.value;
    const newShowLogo = elements.logoSelect.value === 'show';
    const newDefaultTemplate = elements.defaultTemplateSelect.value;
    
    // Aplikovanie nových nastavení
    if (newTheme !== currentTheme) {
        applyTheme(newTheme);
    }
    
    if (newLanguage !== currentLanguage) {
        applyLanguage(newLanguage);
        // Aktualizácia header jazykového selectu
        if (elements.languageSelect) {
            elements.languageSelect.value = newLanguage;
        }
    }
    
    showLogo = newShowLogo;
    currentTemplate = newDefaultTemplate;
    
    // Aktualizácia template selectu v náhľade
    if (elements.templateSelect) {
        elements.templateSelect.value = currentTemplate;
    }
    
    // Aktualizácia náhľadu
    updatePreview();
    
    // Uloženie do localStorage
    saveDataToLocalStorage();
    
    showToast(translations[currentLanguage]['toast-success-settings'], 'success');
}

/**
 * Inicializuje settings modul - nastavuje listener pre system theme changes.
 */
function initializeSettingsModule() {
    // Listener pre zmeny systémovej témy (pri nastavení "auto")
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener((e) => {
            if (currentTheme === 'auto') {
                applyTheme('auto');
            }
        });
    }
}