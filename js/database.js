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
 * Načíta databázu z Excel súboru data.xlsm nahraného používateľom.
 * @param {File} file - Excel súbor nahratý používateľom
 */
async function loadDatabaseFromUserFile(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Prvý riadok je hlavička, preskočíme ho
        const dataRows = rawData.slice(1);
        
        database = [];
        dataRows.forEach((row, index) => {
            const artikel = (row[0] || '').toString().trim();
            const nazov = (row[1] || '').toString().trim();
            const polica = (row[2] || '').toString().trim();
            
            if (artikel && nazov && polica) {
                database.push({
                    id: uuidv4(),
                    artikel: normalizeArtikel(artikel), // Normalizácia artiklu
                    nazov: nazov,
                    polica: polica,
                    addedDate: new Date().toISOString().slice(0, 10)
                });
            }
        });
        
        console.log(`Databáza načítaná z používateľského súboru: ${database.length} položiek`);
        
        // Aktualizovať UI
        renderDatabaseList();
        updateStats();
        renderLabelsToPrint();
        
        showToast(`Databáza načítaná: ${database.length} položiek z súboru ${file.name}`, 'success');
        
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
        div.innerHTML = `
            <div class="database-content">
                <div class="database-artikel">${formatArtikel(item.artikel)}</div>
                <div class="database-nazov">${item.nazov}</div>
                <div class="database-polica">${item.polica}</div>
            </div>
            <div class="database-actions">
                <button class="btn btn-primary btn-small add-to-print-btn" data-artikel="${item.artikel}" data-nazov="${item.nazov}" data-polica="${item.polica}">
                    <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
                <button class="btn btn-danger btn-small delete-from-db-btn" data-id="${item.id}">
                    <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
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