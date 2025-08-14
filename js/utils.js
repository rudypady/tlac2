// 🔧 UTILS MODULE - Pomocné funkcie pre systém tlačenia štítkov

/**
 * Validuje artikel - teraz akceptuje akýkoľvek neprázdny vstup.
 * @param {string} artikel - Artikel na validáciu.
 * @returns {boolean} True ak artikel nie je prázdny, inak false.
 */
function validateArtikel(artikel) {
    if (!artikel || typeof artikel !== 'string') {
        return false;
    }
    
    const cleaned = artikel.trim();
    
    // Akceptuje akýkoľvek neprázdny text/číslo
    return cleaned.length > 0;
}

/**
 * Normalizuje artikel na interný formát (bez pomlčky).
 * @param {string} artikel - Artikel na normalizáciu.
 * @returns {string} Normalizovaný artikel bez pomlčky.
 */
function normalizeArtikel(artikel) {
    if (!artikel) return '';
    
    // Odstráni všetky pomlčky a medzery
    return artikel.toString().replace(/[-\s]/g, '');
}

/**
 * Formátuje artikel pre zobrazenie (po trojiciach číslic s pomlčkami).
 * @param {string} artikel - Artikel na formátovanie.
 * @returns {string} Formátovaný artikel vo formáte 123-456-789.
 */
function formatArtikel(artikel) {
    if (!artikel) return '';
    
    const cleanArtikel = normalizeArtikel(artikel);
    
    // Formátuje po trojiciach číslic s pomlčkami (123-456-789)
    const formatted = cleanArtikel.replace(/(\d{3})(?=\d)/g, '$1-');
    return formatted;
}

/**
 * Formátuje artikel pre čiarový kód (bez pomlčky).
 * @param {string} artikel - Artikel na formátovanie.
 * @returns {string} Artikel bez pomlčky pre čiarový kód.
 */
function formatArtikelForBarcode(artikel) {
    return normalizeArtikel(artikel);
}

/**
 * Validuje osobné číslo na základe formátu 123456789-0000.
 * @param {string} personalNumber - Osobné číslo na validáciu.
 * @returns {boolean} True ak je osobné číslo platné, inak false.
 */
function validatePersonalNumber(personalNumber) {
    if (!personalNumber || typeof personalNumber !== 'string') {
        return false;
    }
    
    const cleaned = personalNumber.trim();
    
    // Požadovaný formát: 9 číslic + pomlčka + 4 nuly
    const personalNumberFormat = /^\d{9}-0000$/;
    
    return personalNumberFormat.test(cleaned);
}

/**
 * Generuje nové 8-miestne osobné číslo.
 * @returns {string} Nové 8-miestne číslo ako string.
 */
function generatePersonalCode() {
    // Generovanie 8-miestneho číselného kódu
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += Math.floor(Math.random() * 10);
    }
    return code;
}

/**
 * Generuje unikátne ID.
 * @returns {string} Unikátne ID.
 */
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Debounce funkcia pre obmedzenie volania funkcie (napr. pri písaní do vyhľadávania).
 * @param {function} func - Funkcia, ktorá sa má vykonať.
 * @param {number} delay - Oneskorenie v milisekundách.
 * @returns {function} Debounced funkcia.
 */
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * Zobrazí toast notifikáciu.
 * @param {string} message - Správa, ktorá sa má zobraziť.
 * @param {string} type - Typ notifikácie ('success', 'error', 'warning').
 */
function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast show ${type}`;
    setTimeout(() => {
        elements.toast.className = 'toast';
    }, 3000); // Skryť po 3 sekundách
}

/**
 * Zobrazí/skryje spinner (načítavanie).
 * @param {HTMLElement} element - Element, do ktorého sa má spinner pridať/odstrániť.
 * @param {boolean} show - True pre zobrazenie, false pre skrytie.
 */
function showLoading(element, show) {
    if (show) {
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        element.innerHTML = ''; // Vymaže existujúci obsah
        element.appendChild(spinner);
    } else {
        // Obnoví pôvodný obsah alebo ho vymaže
        element.innerHTML = '';
    }
}

/**
 * Pomocná funkcia na stiahnutie súboru (Blob).
 * @param {Blob} blob - Blob, ktorý sa má stiahnuť.
 * @param {string} filename - Názov súboru.
 */
function downloadBlob(blob, filename) {
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

/**
 * Filtruje databázu na základe vyhľadávacieho výrazu.
 */
function filterDatabase() {
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    
    if (searchTerm.length === 0) {
        elements.searchResults.classList.add('hidden');
        elements.resultsList.innerHTML = '<div class="no-results" data-lang="no-results">Začnite písať pre vyhľadávanie...</div>';
        return;
    }

    if (searchTerm.length < 2) {
        elements.searchResults.classList.remove('hidden');
        elements.resultsList.innerHTML = '<div class="no-results">Zadajte aspoň 2 znaky...</div>';
        return;
    }

    // Rozšírené vyhľadávanie s podporou pre špeciálne filtry
    let filteredResults = database.filter(item => {
        // Normalizovať vyhľadávací výraz a artikel položky pre porovnanie
        const normalizedSearchTerm = normalizeArtikel(searchTerm);
        const normalizedItemArtikel = normalizeArtikel(item.artikel);
        
        // Základné vyhľadávanie vo všetkých poliach
        const basicMatch = normalizedItemArtikel.includes(normalizedSearchTerm) ||
                          item.artikel.toLowerCase().includes(searchTerm) ||
                          item.nazov.toLowerCase().includes(searchTerm) ||
                          item.polica.toLowerCase().includes(searchTerm);

        // Pokročilé vyhľadávanie s filtrami (napr. "polica:A1", "nazov:motor")
        if (searchTerm.includes(':')) {
            const [field, value] = searchTerm.split(':');
            const searchValue = value.toLowerCase();
            const normalizedSearchValue = normalizeArtikel(searchValue);
            
            switch (field.toLowerCase()) {
                case 'polica':
                    return item.polica.toLowerCase().includes(searchValue);
                case 'nazov':
                case 'name':
                    return item.nazov.toLowerCase().includes(searchValue);
                case 'artikel':
                case 'article':
                    return normalizedItemArtikel.includes(normalizedSearchValue) ||
                           item.artikel.toLowerCase().includes(searchValue);
                default:
                    return basicMatch;
            }
        }

        return basicMatch;
    });

    // Aplikovanie aktívneho filtra
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    if (activeFilter === 'location') {
        // Filter len na základe polica
        filteredResults = filteredResults.filter(item => 
            item.polica.toLowerCase().includes(searchTerm)
        );
    }

    renderSearchResults(filteredResults);
}

/**
 * Vykreslí výsledky vyhľadávania.
 * @param {Array} results - Pole výsledkov na vykreslenie.
 */
function renderSearchResults(results = null) {
    if (results === null) {
        filterDatabase();
        return;
    }

    elements.searchResults.classList.remove('hidden');
    elements.resultsList.innerHTML = '';

    if (results.length === 0) {
        elements.resultsList.innerHTML = `<div class="no-results">${translations[currentLanguage]['no-results']}</div>`;
        return;
    }

    results.forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `
            <div class="result-content">
                <div class="result-artikel">${formatArtikel(item.artikel)}</div>
                <div class="result-nazov">${item.nazov}</div>
                <div class="result-polica">
                    <span class="database-polica">${item.polica}</span>
                </div>
            </div>
            <button class="btn btn-primary btn-small add-to-print-btn" 
                    data-artikel="${item.artikel}" 
                    data-nazov="${item.nazov}" 
                    data-polica="${item.polica}">
                <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>
        `;
        elements.resultsList.appendChild(div);
    });

    // Pridanie event listenerov pre tlačidlá "Pridať na tlač"
    elements.resultsList.querySelectorAll('.add-to-print-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.currentTarget;
            addLabelToPrintList({
                artikel: button.dataset.artikel,
                nazov: button.dataset.nazov,
                polica: button.dataset.polica,
                quantity: 1
            }, button);
            
            showToast(translations[currentLanguage]['toast-success-add-label'], 'success');
        });
    });
}