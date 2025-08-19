// 🖨️ PRINT MODULE - Tlačové funkcie pre systém štítkov

/**
 * Zobrazí náhľad tlače v modálnom okne.
 */
function showPrintPreview() {
    if (labels.length === 0) {
        showToast(translations[currentLanguage]['toast-warning-no-labels'], 'warning');
        return;
    }

    const modal = document.getElementById('printPreviewModal');
    const container = document.getElementById('printPreviewContainer');
    
    if (!modal || !container) {
        console.error('Print preview modal elements not found');
        return;
    }

    container.innerHTML = '';
    
    // Generovanie náhľadu štítkov
    labels.forEach(label => {
        for (let i = 0; i < label.quantity; i++) {
            const labelDiv = createPrintableLabel(label);
            container.appendChild(labelDiv);
        }
    });

    modal.style.display = 'block';
}

/**
 * Vytvorí tlačiteľný štítok.
 * @param {Object} label - Dáta štítka
 * @returns {HTMLElement} Element štítka pre tlač
 */
function createPrintableLabel(label) {
    const labelDiv = document.createElement('div');
    
    // Determine template class based on label type
    let templateClass = `template-${currentTemplate}`;
    if (label.type === 'nametag') {
        templateClass = 'template-nametag';
    } else if (label.type === 'shelf') {
        templateClass = 'template-shelf';
    }
    
    labelDiv.className = `print-label ${templateClass}`;
    
    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'print-content';
    
    // Čiarový kód
    const barcodeDiv = document.createElement('div');
    barcodeDiv.className = 'print-barcode-row';
    const barcodeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    barcodeDiv.appendChild(barcodeSvg);
    
    // Generovanie čiarového kódu
    let barcodeData;
    if (label.type === 'nametag') {
        barcodeData = label.osobneCislo;
    } else if (label.type === 'shelf') {
        barcodeData = `${label.fach}\t${label.policaLocation}`;
    } else {
        barcodeData = formatArtikelForBarcode(label.artikel);
    }
    
    try {
        JsBarcode(barcodeSvg, barcodeData, {
            format: "CODE128",
            width: 1,
            height: 20,
            displayValue: false,
            margin: 0
        });
    } catch (error) {
        console.error('Chyba pri generovaní čiarového kódu pre tlač:', error);
    }
    
    contentDiv.appendChild(barcodeDiv);
    
    // Generate different content based on label type
    if (label.type === 'nametag') {
        // Personal number
        const personalNumberDiv = document.createElement('div');
        personalNumberDiv.className = 'print-personal-number';
        personalNumberDiv.textContent = label.osobneCislo;
        contentDiv.appendChild(personalNumberDiv);
        
        // Full name
        const fullNameDiv = document.createElement('div');
        fullNameDiv.className = 'print-full-name';
        fullNameDiv.textContent = `${label.meno} ${label.priezvisko}`;
        contentDiv.appendChild(fullNameDiv);
        
        // Line
        const lineDiv = document.createElement('div');
        lineDiv.className = 'print-line';
        contentDiv.appendChild(lineDiv);
        
        // Department
        const departmentDiv = document.createElement('div');
        departmentDiv.className = 'print-department';
        departmentDiv.textContent = label.oddelenie || '';
        contentDiv.appendChild(departmentDiv);
        
    } else if (label.type === 'shelf') {
        // Fach
        const fachDiv = document.createElement('div');
        fachDiv.className = 'print-fach';
        fachDiv.textContent = label.fach;
        contentDiv.appendChild(fachDiv);
        
        // Description
        const descDiv = document.createElement('div');
        descDiv.className = 'print-shelf-desc';
        descDiv.textContent = 'Polica štítok';
        contentDiv.appendChild(descDiv);
        
        // Line
        const lineDiv = document.createElement('div');
        lineDiv.className = 'print-line';
        contentDiv.appendChild(lineDiv);
        
        // Location
        const locationDiv = document.createElement('div');
        locationDiv.className = 'print-shelf-location';
        locationDiv.textContent = `${label.fach}\t${label.policaLocation}`;
        contentDiv.appendChild(locationDiv);
        
    } else {
        // Regular label (default behavior)
        // Artikel
        const artikelDiv = document.createElement('div');
        artikelDiv.className = 'print-artikel';
        artikelDiv.textContent = formatArtikel(label.artikel);
        contentDiv.appendChild(artikelDiv);
        
        // Názov
        const nazovDiv = document.createElement('div');
        nazovDiv.className = 'print-nazov';
        nazovDiv.textContent = label.nazov;
        contentDiv.appendChild(nazovDiv);
        
        // Čiara
        const lineDiv = document.createElement('div');
        lineDiv.className = 'print-line';
        contentDiv.appendChild(lineDiv);
        
        // Polica (iba ak je povolená globálne)
        if (showPolica) {
            const policaDiv = document.createElement('div');
            policaDiv.className = 'print-polica';
            policaDiv.textContent = label.polica;
            contentDiv.appendChild(policaDiv);
        }
    }
    
    labelDiv.appendChild(contentDiv);
    return labelDiv;
}

/**
 * Spustí tlač štítkov.
 */
function printLabels() {
    if (labels.length === 0) {
        showToast(translations[currentLanguage]['toast-warning-no-labels'], 'warning');
        return;
    }

    // Aktualizácia histórie tlače
    addToPrintHistory();

    // Príprava tlačovej oblasti
    const printArea = document.getElementById('printArea');
    if (!printArea) {
        console.error('Print area not found');
        return;
    }

    printArea.innerHTML = '';
    
    // Generovanie štítkov pre tlač
    labels.forEach(label => {
        for (let i = 0; i < label.quantity; i++) {
            const labelDiv = createPrintableLabel(label);
            printArea.appendChild(labelDiv);
        }
    });

    // Dočasné zobrazenie tlačovej oblasti
    printArea.classList.remove('hidden');
    
    // Tlač
    window.print();
    
    // Skrytie tlačovej oblasti po tlači
    setTimeout(() => {
        printArea.classList.add('hidden');
    }, 1000);

    showToast(`Tlač spustená pre ${labels.reduce((sum, label) => sum + label.quantity, 0)} štítkov`, 'success');
}

/**
 * Pridá záznam o tlači do histórie.
 */
function addToPrintHistory() {
    const historyEntry = {
        id: uuidv4(),
        date: new Date().toISOString(),
        labels: JSON.parse(JSON.stringify(labels)), // Deep copy
        totalLabels: labels.reduce((sum, label) => sum + label.quantity, 0),
        template: currentTemplate
    };

    printHistory.unshift(historyEntry); // Pridaj na začiatok
    
    // Obmedzenie histórie na posledných 100 záznamov
    if (printHistory.length > 100) {
        printHistory = printHistory.slice(0, 100);
    }

    saveDataToLocalStorage();
    updatePrintHistoryDisplay();
    updatePrintHistoryStats();
}

/**
 * Aktualizuje zobrazenie histórie tlače.
 */
function updatePrintHistoryDisplay() {
    const historyList = document.getElementById('printHistoryList');
    if (!historyList) return;

    const searchTerm = elements.historySearchInput ? elements.historySearchInput.value.toLowerCase() : '';
    
    let filteredHistory = printHistory;
    if (searchTerm) {
        filteredHistory = printHistory.filter(entry => {
            const dateStr = new Date(entry.date).toLocaleDateString();
            const labelsStr = entry.labels.map(l => `${l.artikel} ${l.nazov} ${l.polica}`).join(' ').toLowerCase();
            return dateStr.includes(searchTerm) || labelsStr.includes(searchTerm);
        });
    }

    historyList.innerHTML = '';

    if (filteredHistory.length === 0) {
        historyList.innerHTML = `<div class="no-results">${translations[currentLanguage]['no-history']}</div>`;
        return;
    }

    filteredHistory.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString('sk-SK');
        const formattedTime = date.toLocaleTimeString('sk-SK');
        
        div.innerHTML = `
            <div class="history-header">
                <div class="history-date">${formattedDate} ${formattedTime}</div>
                <div class="history-summary">${entry.totalLabels} štítkov (${entry.template})</div>
            </div>
            <div class="history-labels">
                ${entry.labels.map(label => 
                    `<span class="history-label">${formatArtikel(label.artikel)} - ${label.nazov} (${label.quantity}x)</span>`
                ).join('')}
            </div>
            <div class="history-actions">
                <button class="btn btn-secondary btn-small reprint-btn" data-entry-id="${entry.id}">
                    <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6,9 6,2 18,2 18,9"></polyline>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    Vytlačiť znovu
                </button>
            </div>
        `;
        
        historyList.appendChild(div);
    });

    // Pridaj event listenery pre opätovnú tlač
    historyList.querySelectorAll('.reprint-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const entryId = e.currentTarget.dataset.entryId;
            reprintFromHistory(entryId);
        });
    });
}

/**
 * Vytlačí znovu štítky z histórie.
 * @param {string} entryId - ID záznamu v histórii
 */
function reprintFromHistory(entryId) {
    const entry = printHistory.find(e => e.id === entryId);
    if (!entry) {
        showToast('Záznam z histórie nebol nájdený!', 'error');
        return;
    }

    // Nastavenie štítkov a šablóny
    labels = JSON.parse(JSON.stringify(entry.labels)); // Deep copy
    labels.forEach(label => label.id = uuidv4()); // Nové ID pre aktuálnu reláciu
    
    currentTemplate = entry.template;
    elements.templateSelect.value = currentTemplate;
    
    // Aktualizácia UI
    renderLabelsToPrint();
    switchTab('labels');
    
    showToast(`Načítaných ${entry.totalLabels} štítkov z histórie`, 'success');
}

/**
 * Aktualizuje štatistiky histórie tlače.
 */
function updatePrintHistoryStats() {
    const totalPrintedLabels = document.getElementById('totalPrintedLabels');
    const totalPrintSessions = document.getElementById('totalPrintSessions');
    
    if (totalPrintedLabels) {
        const total = printHistory.reduce((sum, entry) => sum + entry.totalLabels, 0);
        totalPrintedLabels.textContent = total;
    }
    
    if (totalPrintSessions) {
        totalPrintSessions.textContent = printHistory.length;
    }
}

/**
 * Vymaže históriu tlače.
 */
function clearPrintHistory() {
    if (confirm('Naozaj chcete vymazať celú históriu tlače?')) {
        printHistory = [];
        saveDataToLocalStorage();
        updatePrintHistoryDisplay();
        updatePrintHistoryStats();
        showToast('História tlače bola vymazaná!', 'success');
    }
}

/**
 * Exportuje históriu tlače do CSV súboru.
 */
function exportPrintHistory() {
    if (printHistory.length === 0) {
        showToast('Žiadna história na export!', 'warning');
        return;
    }

    const exportData = [];
    printHistory.forEach(entry => {
        const date = new Date(entry.date);
        const baseRow = {
            Datum: date.toLocaleDateString('sk-SK'),
            Cas: date.toLocaleTimeString('sk-SK'),
            Sablona: entry.template,
            CelkemStitkov: entry.totalLabels
        };

        entry.labels.forEach(label => {
            exportData.push({
                ...baseRow,
                Artikel: formatArtikel(label.artikel),
                Nazov: label.nazov,
                Polica: label.polica,
                Mnozstvo: label.quantity
            });
        });
    });

    try {
        const csv = PapaParse.unparse(exportData);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const filename = `historia_tlace_${new Date().toISOString().slice(0, 10)}.csv`;
        downloadBlob(blob, filename);
        showToast('História tlače bola exportovaná!', 'success');
    } catch (error) {
        console.error('Chyba pri exporte histórie:', error);
        showToast('Chyba pri exporte histórie!', 'error');
    }
}

/**
 * Zatvorí náhľad tlače.
 */
function closePrintPreview() {
    const modal = document.getElementById('printPreviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Inicializuje print modul - nastavuje event listenery pre tlačové funkcie.
 */
function initializePrintModule() {
    // Event listener pre zatvorenie náhľadu tlače
    const closePrintPreviewBtn = document.getElementById('closePrintPreview');
    if (closePrintPreviewBtn) {
        closePrintPreviewBtn.addEventListener('click', closePrintPreview);
    }

    // Event listener pre kliknutie mimo modálne okno
    const modal = document.getElementById('printPreviewModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePrintPreview();
            }
        });
    }

    // Aktualizácia štatistík histórie pri inicializácii
    updatePrintHistoryStats();
    updatePrintHistoryDisplay();
}