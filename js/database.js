// 🗃️ DATABASE MODULE - Databázové operácie pre systém tlačenia štítkov

/**
 * Automaticky načíta databázu z Excel súboru 'data.xlsm' zo servera.
 * Volá sa pri štarte aplikácie, ak je databáza prázdna.
 */
async function loadDatabaseFromServer() {
    try {
        console.log('Pokúšam sa načítať data.xlsm zo servera...');
        
        // Stiahnutie súboru zo servera pomocou fetch
        const response = await fetch('data.xlsm');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Konverzia na ArrayBuffer pre spracovanie cez XLSX
        const arrayBuffer = await response.arrayBuffer();
        
        // Spracovanie Excel súboru pomocou SheetJS
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Prvý riadok je hlavička, preskočíme ho
        const dataRows = rawData.slice(1);
        
        // Vynulovanie databázy pred načítaním nových dát
        database = [];
        let loadedCount = 0;
        
        // Spracovanie jednotlivých riadkov
        dataRows.forEach((row, index) => {
            // Podporujeme rôzne varianty názvov stĺpcov (veľké aj malé písmená)
            const artikel = (row[0] || '').toString().trim();
            const nazov = (row[1] || '').toString().trim();
            const polica = (row[2] || '').toString().trim();
            
            // Pridanie len platných záznamov (všetky polia musia byť vyplnené)
            if (artikel && nazov && polica) {
                database.push({
                    id: uuidv4(),
                    artikel: normalizeArtikel(artikel), // Normalizácia artiklu
                    nazov: nazov,
                    polica: polica,
                    addedDate: new Date().toISOString().slice(0, 10)
                });
                loadedCount++;
            }
        });
        
        console.log(`Databáza automaticky načítaná zo servera: ${loadedCount} položiek`);
        
        // Aktualizácia UI po úspešnom načítaní
        renderDatabaseList();
        updateStats();
        
        // Uloženie do localStorage
        saveDataToLocalStorage();
        
        // Zobrazenie úspešnej notifikácie
        showToast(`Databáza automaticky načítaná: ${loadedCount} položiek zo servera`, 'success');
        
    } catch (error) {
        console.error('Chyba pri automatickom načítaní databázy zo servera:', error);
        
        // Zobrazenie chybovej notifikácie
        let errorMessage = 'Chyba pri načítaní databázy zo servera.';
        if (error.message.includes('404')) {
            errorMessage += ' Súbor data.xlsm nebol nájdený.';
        } else if (error.message.includes('network')) {
            errorMessage += ' Problém s pripojením k serveru.';
        }
        
        showToast(errorMessage, 'error');
    }
}

/**
 * Validuje nahrávaný súbor pred spracovaním.
 * @param {File} file - Súbor na validáciu
 * @returns {Object} {isValid: boolean, error?: string}
 */
function validateUploadedFile(file) {
    // Kontrola existencie súboru
    if (!file) {
        return { isValid: false, error: 'Žiadny súbor nebol vybraný' };
    }
    
    // Kontrola veľkosti súboru (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return { isValid: false, error: 'Súbor je príliš veľký (max 10MB)' };
    }
    
    // Kontrola typu súboru
    const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel.sheet.macroEnabled.12',
        'text/csv',
        'application/json'
    ];
    
    const allowedExtensions = ['.xls', '.xlsx', '.xlsm', '.csv', '.json'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        return { isValid: false, error: 'Nepodporovaný typ súboru. Povolené sú len XLS, XLSX, XLSM, CSV a JSON súbory' };
    }
    
    // Kontrola názvu súboru (zabránenie directory traversal)
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
        return { isValid: false, error: 'Neplatný názov súboru' };
    }
    
    return { isValid: true };
}

/**
 * Načíta databázu z Excel súboru data.xlsm nahraného používateľom.
 * @param {File} file - Excel súbor nahratý používateľom
 */
async function loadDatabaseFromUserFile(file) {
    try {
        // Validácia súboru pred spracovaním
        const validation = validateUploadedFile(file);
        if (!validation.isValid) {
            showToast(validation.error, 'error');
            return;
        }
        
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Prvý riadok je hlavička, preskočíme ho
        const dataRows = rawData.slice(1);
        
        database = [];
        let validRowsCount = 0;
        let invalidRowsCount = 0;
        
        dataRows.forEach((row, index) => {
            const artikel = (row[0] || '').toString().trim();
            const nazov = (row[1] || '').toString().trim();
            const polica = (row[2] || '').toString().trim();
            
            // Validácia každého riadku
            const artikelValidation = validateAndSanitizeArtikel(artikel);
            const nazovValidation = validateAndSanitizeName(nazov);
            const policaValidation = validateAndSanitizeShelf(polica);
            
            if (artikelValidation.isValid && nazovValidation.isValid && policaValidation.isValid) {
                database.push({
                    id: uuidv4(),
                    artikel: normalizeArtikel(artikelValidation.sanitized),
                    nazov: nazovValidation.sanitized,
                    polica: policaValidation.sanitized,
                    addedDate: new Date().toISOString().slice(0, 10)
                });
                validRowsCount++;
            } else {
                invalidRowsCount++;
                console.warn(`Neplatný riadok ${index + 2}: ${artikel} - ${nazov} - ${polica}`);
            }
        });
        
        console.log(`Databáza načítaná z používateľského súboru: ${validRowsCount} platných položiek, ${invalidRowsCount} neplatných`);
        
        // Aktualizovať UI
        renderDatabaseList();
        updateStats();
        renderLabelsToPrint();
        
        let message = `Databáza načítaná: ${validRowsCount} položiek z súboru ${sanitizeHtml(file.name)}`;
        if (invalidRowsCount > 0) {
            message += ` (${invalidRowsCount} riadkov preskočených kvôli chybám)`;
        }
        showToast(message, 'success');
        
    } catch (error) {
        console.error('Chyba pri načítaní Excel súboru:', error);
        showToast('Chyba pri načítaní súboru. Skontrolujte formát súboru.', 'error');
    }
}

/**
 * Vykreslí zoznam položiek databázy s možnosťou filtrovania.
 */
function renderDatabaseList() {
    const searchTerm = elements.dbSearchInput.value.toLowerCase();
    const filteredDatabase = database.filter(item => 
        item.artikel.toLowerCase().includes(searchTerm) ||
        item.nazov.toLowerCase().includes(searchTerm) ||
        item.polica.toLowerCase().includes(searchTerm)
    );

    elements.databaseList.innerHTML = '';

    if (filteredDatabase.length === 0) {
        elements.databaseList.innerHTML = `<div class="no-results">${translations[currentLanguage]['no-results']}</div>`;
        return;
    }

    filteredDatabase.forEach(item => {
        const div = document.createElement('div');
        div.className = 'database-item';
        
        // Bezpečné vytvorenie DOM elementov namiesto innerHTML
        const contentDiv = document.createElement('div');
        contentDiv.className = 'database-content';
        
        const artikelDiv = document.createElement('div');
        artikelDiv.className = 'database-artikel';
        artikelDiv.textContent = formatArtikel(item.artikel);
        
        const nazovDiv = document.createElement('div');
        nazovDiv.className = 'database-nazov';
        nazovDiv.textContent = sanitizeHtml(item.nazov);
        
        const policaDiv = document.createElement('div');
        policaDiv.className = 'database-polica';
        policaDiv.textContent = sanitizeHtml(item.polica);
        
        contentDiv.appendChild(artikelDiv);
        contentDiv.appendChild(nazovDiv);
        contentDiv.appendChild(policaDiv);
        
        // Actions sekcia
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'database-actions';
        
        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-primary btn-small add-to-print-btn';
        addBtn.dataset.artikel = item.artikel;
        addBtn.dataset.nazov = item.nazov;
        addBtn.dataset.polica = item.polica;
        addBtn.innerHTML = `
            <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        `;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-small delete-from-db-btn';
        deleteBtn.dataset.id = item.id;
        deleteBtn.innerHTML = `
            <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        `;
        
        actionsDiv.appendChild(addBtn);
        actionsDiv.appendChild(deleteBtn);
        
        div.appendChild(contentDiv);
        div.appendChild(actionsDiv);
        elements.databaseList.appendChild(div);
    });

    // Pridať event listenery pre tlačidlá
    elements.databaseList.querySelectorAll('.add-to-print-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.currentTarget;
            addLabelToPrintList({
                artikel: button.dataset.artikel,
                nazov: button.dataset.nazov,
                polica: button.dataset.polica,
                quantity: 1
            }, button);
        });
    });

    elements.databaseList.querySelectorAll('.delete-from-db-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            deleteFromDatabase(id);
        });
    });
}

/**
 * Pridá novú položku do databázy.
 * @param {Object} item - Položka na pridanie {artikel, nazov, polica}
 */
function addToDatabase(item) {
    if (!item.artikel || !item.nazov || !item.polica) {
        showToast(translations[currentLanguage]['toast-error-db-add'], 'error');
        return;
    }

    const normalizedArtikel = normalizeArtikel(item.artikel);
    
    // Kontrola duplicity
    const existingItem = database.find(dbItem => 
        dbItem.artikel === normalizedArtikel && 
        dbItem.nazov === item.nazov && 
        dbItem.polica === item.polica
    );

    if (existingItem) {
        showToast('Položka už existuje v databáze!', 'warning');
        return;
    }

    database.push({
        id: uuidv4(),
        artikel: normalizedArtikel,
        nazov: item.nazov,
        polica: item.polica,
        addedDate: new Date().toISOString().slice(0, 10)
    });

    renderDatabaseList();
    updateStats();
    saveDataToLocalStorage();
    
    showToast(translations[currentLanguage]['toast-success-db-add'], 'success');
}

/**
 * Vymaže položku z databázy.
 * @param {string} id - ID položky na vymazanie
 */
function deleteFromDatabase(id) {
    if (confirm(translations[currentLanguage]['confirm-delete-item'])) {
        database = database.filter(item => item.id !== id);
        renderDatabaseList();
        updateStats();
        saveDataToLocalStorage();
        showToast(translations[currentLanguage]['toast-success-db-delete'], 'success');
    }
}

/**
 * Vymaže celú databázu.
 */
function clearDatabase() {
    if (confirm(translations[currentLanguage]['confirm-clear-db'])) {
        database = [];
        renderDatabaseList();
        updateStats();
        saveDataToLocalStorage();
        showToast(translations[currentLanguage]['toast-success-clear-db'], 'success');
    }
}

/**
 * Exportuje databázu do zvoleného formátu (CSV, Excel, JSON).
 * @param {string} format - Formát exportu ('csv', 'excel', 'json').
 */
function exportDatabase(format) {
    if (database.length === 0) {
        showToast(translations[currentLanguage]['toast-warning-no-data'], 'warning');
        return;
    }

    const dataToExport = database.map(item => ({
        Artikel: formatArtikel(item.artikel), // Exportovať s pomlčkou pre lepšiu čitateľnosť
        Nazov: item.nazov,
        Polica: item.polica,
        DatumPridania: item.addedDate || ''
    }));

    const filename = `schaffle_database_${new Date().toISOString().slice(0, 10)}`;

    try {
        if (format === 'csv') {
            const csv = PapaParse.unparse(dataToExport);
            const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
            downloadBlob(blob, `${filename}.csv`);
        } else if (format === 'excel') {
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Databáza");
            XLSX.writeFile(wb, `${filename}.xlsx`);
        } else if (format === 'json') {
            const json = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
            downloadBlob(blob, `${filename}.json`);
        }
        showToast(translations[currentLanguage]['toast-success-export'], 'success');
    } catch (e) {
        console.error("Chyba pri exporte:", e);
        showToast("Nastala chyba pri exporte dát.", 'error');
    }
}

/**
 * Aktualizuje štatistiky databázy.
 */
function updateStats() {
    elements.totalCount.textContent = database.length;
}

/**
 * Pridá jednotlivú položku do databázy z formulára.
 */
function addSingleToDatabase() {
    const artikel = elements.newArtikel.value.trim();
    const nazov = elements.newNazov.value.trim();
    const polica = elements.newPolica.value.trim();

    if (!artikel || !nazov || !polica) {
        showToast('Vyplňte všetky polia!', 'error');
        return;
    }

    // Validácia artiklu
    if (!validateArtikel(artikel)) {
        showToast(translations[currentLanguage]['toast-error-invalid-artikel'], 'error');
        return;
    }

    addToDatabase({ artikel, nazov, polica });

    // Vymazať formulár
    elements.newArtikel.value = '';
    elements.newNazov.value = '';
    elements.newPolica.value = '';
}