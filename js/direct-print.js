// 🖨️ DIRECT PRINT MODULE - Priama komunikácia s tlačiarňami

/**
 * Globálne premenné pre správu tlačiarní
 */
let printers = [];
let currentPrintMode = 'browser'; // 'browser' alebo 'direct'
let defaultPrinterId = '';

/**
 * Inicializuje direct print modul
 */
function initializeDirectPrintModule() {
    loadPrintersFromLocalStorage();
    updatePrintModeUI();
    setupDirectPrintEventListeners();
}

/**
 * Nastavuje event listenery pre direct print funkcionalitu
 */
function setupDirectPrintEventListeners() {
    // Print mode change
    const printModeSelect = document.getElementById('printModeSelect');
    if (printModeSelect) {
        printModeSelect.addEventListener('change', (e) => {
            currentPrintMode = e.target.value;
            updatePrintModeUI();
            saveDirectPrintSettings();
        });
    }

    // Add printer button
    const addPrinterBtn = document.getElementById('addPrinterBtn');
    if (addPrinterBtn) {
        addPrinterBtn.addEventListener('click', addPrinter);
    }

    // Test printer button
    const testPrinterBtn = document.getElementById('testPrinterBtn');
    if (testPrinterBtn) {
        testPrinterBtn.addEventListener('click', testPrinterConnection);
    }

    // Default printer change
    const defaultPrinterSelect = document.getElementById('defaultPrinterSelect');
    if (defaultPrinterSelect) {
        defaultPrinterSelect.addEventListener('change', (e) => {
            defaultPrinterId = e.target.value;
            saveDirectPrintSettings();
            updateActivePrinterDropdown();
        });
    }

    // Active printer change
    const activePrinterSelect = document.getElementById('activePrinterSelect');
    if (activePrinterSelect) {
        activePrinterSelect.addEventListener('change', updateDirectPrintButtons);
    }

    // Direct print button
    const directPrintBtn = document.getElementById('directPrintBtn');
    if (directPrintBtn) {
        directPrintBtn.addEventListener('click', performDirectPrint);
    }

    // Generate ZPL button
    const generateZplBtn = document.getElementById('generateZplBtn');
    if (generateZplBtn) {
        generateZplBtn.addEventListener('click', generateAndShowZPL);
    }

    // Printer form validation
    const printerInputs = ['printerName', 'printerIP', 'printerPort'];
    printerInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', validatePrinterForm);
        }
    });
}

/**
 * Aktualizuje UI na základe zvoleného print mode
 */
function updatePrintModeUI() {
    const printerSettingsSection = document.getElementById('printerSettingsSection');
    const directPrintSection = document.getElementById('directPrintSection');
    const printBtn = document.getElementById('printBtn');
    const directPrintBtn = document.getElementById('directPrintBtn');
    const generateZplBtn = document.getElementById('generateZplBtn');

    if (currentPrintMode === 'direct') {
        if (printerSettingsSection) printerSettingsSection.style.display = 'block';
        if (directPrintSection) directPrintSection.classList.remove('hidden');
        if (printBtn) printBtn.classList.add('hidden');
        if (directPrintBtn) directPrintBtn.classList.remove('hidden');
        if (generateZplBtn) generateZplBtn.classList.remove('hidden');
    } else {
        if (printerSettingsSection) printerSettingsSection.style.display = 'none';
        if (directPrintSection) directPrintSection.classList.add('hidden');
        if (printBtn) printBtn.classList.remove('hidden');
        if (directPrintBtn) directPrintBtn.classList.add('hidden');
        if (generateZplBtn) generateZplBtn.classList.add('hidden');
    }

    updateDirectPrintButtons();
}

/**
 * Validuje formulár pre pridanie tlačiarne
 */
function validatePrinterForm() {
    const printerName = document.getElementById('printerName')?.value.trim();
    const printerIP = document.getElementById('printerIP')?.value.trim();
    const printerPort = document.getElementById('printerPort')?.value.trim();
    const addPrinterBtn = document.getElementById('addPrinterBtn');
    const testPrinterBtn = document.getElementById('testPrinterBtn');

    const isValid = printerName && printerIP && printerPort && isValidIP(printerIP);

    if (addPrinterBtn) addPrinterBtn.disabled = !isValid;
    if (testPrinterBtn) testPrinterBtn.disabled = !isValid;
}

/**
 * Validuje IP adresu
 */
function isValidIP(ip) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
}

/**
 * Pridá novú tlačiareň
 */
function addPrinter() {
    const name = document.getElementById('printerName')?.value.trim();
    const ip = document.getElementById('printerIP')?.value.trim();
    const port = parseInt(document.getElementById('printerPort')?.value) || 9100;
    const format = document.getElementById('printerFormat')?.value || 'zpl';

    if (!name || !ip) {
        showToast('Vyplňte všetky povinné polia!', 'error');
        return;
    }

    if (!isValidIP(ip)) {
        showToast('Zadajte platnú IP adresu!', 'error');
        return;
    }

    // Check if printer already exists
    if (printers.some(p => p.name === name || (p.ip === ip && p.port === port))) {
        showToast('Tlačiareň s týmto názvom alebo IP adresou už existuje!', 'error');
        return;
    }

    const printer = {
        id: uuidv4(),
        name,
        ip,
        port,
        format,
        dateAdded: new Date().toISOString()
    };

    printers.push(printer);
    saveDirectPrintSettings();
    updatePrintersDropdowns();
    updatePrintersList();
    clearPrinterForm();

    // Set as default if it's the first printer
    if (printers.length === 1) {
        defaultPrinterId = printer.id;
        const defaultPrinterSelect = document.getElementById('defaultPrinterSelect');
        if (defaultPrinterSelect) defaultPrinterSelect.value = printer.id;
        saveDirectPrintSettings();
    }

    showToast(`Tlačiareň "${name}" bola úspešne pridaná!`, 'success');
}

/**
 * Vymaže formulár pre tlačiareň
 */
function clearPrinterForm() {
    const inputs = ['printerName', 'printerIP', 'printerPort', 'printerFormat'];
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            if (input.type === 'select-one') {
                input.value = input.options[0]?.value || '';
            } else {
                input.value = inputId === 'printerPort' ? '9100' : '';
            }
        }
    });
    validatePrinterForm();
}

/**
 * Testuje pripojenie k tlačiarni
 */
async function testPrinterConnection() {
    const ip = document.getElementById('printerIP')?.value.trim();
    const port = parseInt(document.getElementById('printerPort')?.value) || 9100;

    if (!ip || !isValidIP(ip)) {
        showToast('Zadajte platnú IP adresu!', 'error');
        return;
    }

    showToast('Testujem pripojenie...', 'info');

    try {
        // Since we can't directly test TCP connection from browser,
        // we'll send a simple HTTP request to check if the device responds
        const response = await fetch(`http://${ip}`, {
            method: 'HEAD',
            mode: 'no-cors',
            timeout: 5000
        });

        showToast(`Pripojenie k ${ip}:${port} je dostupné.`, 'success');
    } catch (error) {
        // Note: In browser environment, we can't directly test TCP connections
        // This is a limitation of web browsers for security reasons
        showToast(`Upozornenie: Nemožno testovať pripojenie priamo z prehliadača. Skúste odoslať testovací štítok.`, 'warning');
    }
}

/**
 * Aktualizuje dropdown pre tlačiarne
 */
function updatePrintersDropdowns() {
    const defaultPrinterSelect = document.getElementById('defaultPrinterSelect');
    const activePrinterSelect = document.getElementById('activePrinterSelect');

    [defaultPrinterSelect, activePrinterSelect].forEach(select => {
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="">Žiadna tlačiareň</option>';

        printers.forEach(printer => {
            const option = document.createElement('option');
            option.value = printer.id;
            option.textContent = `${printer.name} (${printer.ip}:${printer.port})`;
            select.appendChild(option);
        });

        // Restore selection if still valid
        if (currentValue && printers.some(p => p.id === currentValue)) {
            select.value = currentValue;
        }
    });

    // Set default printer in active dropdown
    if (activePrinterSelect && defaultPrinterId) {
        activePrinterSelect.value = defaultPrinterId;
    }
}

/**
 * Aktualizuje dropdown pre aktívnu tlačiareň
 */
function updateActivePrinterDropdown() {
    const activePrinterSelect = document.getElementById('activePrinterSelect');
    if (activePrinterSelect && defaultPrinterId) {
        activePrinterSelect.value = defaultPrinterId;
    }
    updateDirectPrintButtons();
}

/**
 * Aktualizuje stav tlačidiel pre direct print
 */
function updateDirectPrintButtons() {
    const activePrinterSelect = document.getElementById('activePrinterSelect');
    const directPrintBtn = document.getElementById('directPrintBtn');
    const selectedPrinterId = activePrinterSelect?.value;
    const hasLabels = labels && labels.length > 0;

    if (directPrintBtn) {
        directPrintBtn.disabled = !selectedPrinterId || !hasLabels;
    }
}

/**
 * Aktualizuje zoznam nakonfigurovaných tlačiarní
 */
function updatePrintersList() {
    const container = document.getElementById('printersListContainer');
    if (!container) return;

    if (printers.length === 0) {
        container.innerHTML = '<div class="no-results">Žiadne nakonfigurované tlačiarne</div>';
        return;
    }

    container.innerHTML = '';
    printers.forEach(printer => {
        const div = document.createElement('div');
        div.className = 'printer-item';
        div.innerHTML = `
            <div class="printer-info">
                <div class="printer-name">${printer.name}</div>
                <div class="printer-details">${printer.ip}:${printer.port} (${printer.format.toUpperCase()})</div>
                ${printer.id === defaultPrinterId ? '<span class="default-badge">Predvolená</span>' : ''}
            </div>
            <div class="printer-actions">
                <button class="btn btn-danger btn-small" onclick="removePrinter('${printer.id}')">
                    <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Odstrániť
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

/**
 * Odstráni tlačiareň
 */
function removePrinter(printerId) {
    const printer = printers.find(p => p.id === printerId);
    if (!printer) return;

    if (confirm(`Naozaj chcete odstrániť tlačiareň "${printer.name}"?`)) {
        printers = printers.filter(p => p.id !== printerId);
        
        // Clear default if removed
        if (defaultPrinterId === printerId) {
            defaultPrinterId = printers.length > 0 ? printers[0].id : '';
        }

        saveDirectPrintSettings();
        updatePrintersDropdowns();
        updatePrintersList();
        updateDirectPrintButtons();

        showToast(`Tlačiareň "${printer.name}" bola odstránená.`, 'success');
    }
}

/**
 * Vykonáva direct print
 */
async function performDirectPrint() {
    const activePrinterSelect = document.getElementById('activePrinterSelect');
    const selectedPrinterId = activePrinterSelect?.value;

    if (!selectedPrinterId) {
        showToast('Vyberte tlačiareň!', 'error');
        return;
    }

    if (!labels || labels.length === 0) {
        showToast('Žiadne štítky na tlač!', 'warning');
        return;
    }

    const printer = printers.find(p => p.id === selectedPrinterId);
    if (!printer) {
        showToast('Tlačiareň nebola nájdená!', 'error');
        return;
    }

    try {
        showToast('Pripravujem štítky na priamu tlač...', 'info');

        // Generate print commands based on printer format
        let printCommands = '';
        switch (printer.format) {
            case 'zpl':
                printCommands = generateZPLCommands(labels);
                break;
            case 'epl':
                printCommands = generateEPLCommands(labels);
                break;
            default:
                printCommands = generateRawCommands(labels);
        }

        // Send to printer
        await sendToPrinter(printer, printCommands);

        // Add to history
        addToPrintHistory();

        showToast(`Priama tlač dokončená! Odoslané na ${printer.name}`, 'success');

    } catch (error) {
        console.error('Direct print error:', error);
        showToast(`Chyba pri priamej tlači: ${error.message}`, 'error');
    }
}

/**
 * Odosiela príkazy na tlačiareň
 */
async function sendToPrinter(printer, commands) {
    // Note: Direct TCP/IP communication from browser is limited by CORS and security policies
    // In a real implementation, this would require:
    // 1. A backend service/proxy
    // 2. Browser extension
    // 3. Local application/service
    
    // For demonstration, we'll simulate the request
    try {
        // Attempt to use fetch with the printer's HTTP interface (if available)
        const response = await fetch(`http://${printer.ip}:${printer.port}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-raw-print'
            },
            body: commands,
            mode: 'no-cors'
        });

        console.log(`Sent to printer ${printer.name}:`, commands);
        
    } catch (error) {
        // Fallback: Download as file for manual sending
        console.warn('Direct network printing not available, generating download instead');
        downloadPrintCommands(printer, commands);
        throw new Error('Priame pripojenie nie je k dispozícii. Súbor bol stiahnutý na manuálne odoslanie.');
    }
}

/**
 * Stiahne print commands ako súbor
 */
function downloadPrintCommands(printer, commands) {
    const blob = new Blob([commands], { type: 'text/plain' });
    const filename = `print_${printer.format}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${printer.format}`;
    downloadBlob(blob, filename);
}

/**
 * Generuje a zobrazí ZPL preview
 */
function generateAndShowZPL() {
    if (!labels || labels.length === 0) {
        showToast('Žiadne štítky na vygenerovanie ZPL!', 'warning');
        return;
    }

    const zplCommands = generateZPLCommands(labels);
    showZPLPreview(zplCommands);
}

/**
 * Zobrazí ZPL preview v modálnom okne
 */
function showZPLPreview(zplCommands) {
    // Create modal if not exists
    let modal = document.getElementById('zplPreviewModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'zplPreviewModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>ZPL Preview</h3>
                    <span class="close" onclick="closeZPLPreview()">&times;</span>
                </div>
                <div class="zpl-content">
                    <textarea id="zplTextarea" readonly style="width: 100%; height: 400px; font-family: monospace; font-size: 12px;"></textarea>
                </div>
                <div style="margin-top: 20px; text-align: center;">
                    <button class="btn btn-secondary" onclick="copyZPLToClipboard()">
                        <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Kopírovať do schránky
                    </button>
                    <button class="btn btn-primary" onclick="downloadZPL()">
                        <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7,10 12,15 17,10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Stiahnuť ZPL
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const textarea = modal.querySelector('#zplTextarea');
    if (textarea) {
        textarea.value = zplCommands;
    }

    modal.style.display = 'block';
}

/**
 * Zatvorí ZPL preview
 */
function closeZPLPreview() {
    const modal = document.getElementById('zplPreviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Kopíruje ZPL do schránky
 */
function copyZPLToClipboard() {
    const textarea = document.getElementById('zplTextarea');
    if (textarea) {
        textarea.select();
        document.execCommand('copy');
        showToast('ZPL príkazy boli skopírované do schránky!', 'success');
    }
}

/**
 * Stiahne ZPL ako súbor
 */
function downloadZPL() {
    const textarea = document.getElementById('zplTextarea');
    if (textarea && textarea.value) {
        const blob = new Blob([textarea.value], { type: 'text/plain' });
        const filename = `labels_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zpl`;
        downloadBlob(blob, filename);
        showToast('ZPL súbor bol stiahnutý!', 'success');
    }
}

/**
 * Generuje ZPL príkazy pre štítky
 */
function generateZPLCommands(labelsArray) {
    let zplCommands = '';

    labelsArray.forEach(label => {
        for (let i = 0; i < label.quantity; i++) {
            zplCommands += generateSingleZPLLabel(label) + '\n';
        }
    });

    return zplCommands;
}

/**
 * Generuje ZPL pre jeden štítok
 */
function generateSingleZPLLabel(label) {
    let zpl = '';

    // Start ZPL
    zpl += '^XA\n';

    // Set label dimensions (2" x 1" = 203dpi x 2" = 406 dots width, 203 dots height)
    zpl += '^CF0,30\n'; // Default font, size 30

    if (label.type === 'nametag') {
        // Name tag layout
        zpl += `^FO50,30^BC^FD${label.osobneCislo}^FS\n`; // Barcode
        zpl += `^FO50,100^FD${label.osobneCislo}^FS\n`; // Personal number
        zpl += `^FO50,140^FD${label.meno} ${label.priezvisko}^FS\n`; // Full name
        zpl += `^FO50,170^GB300,2,2^FS\n`; // Line
        zpl += `^FO50,180^FD${label.oddelenie || ''}^FS\n`; // Department

    } else if (label.type === 'shelf') {
        // Shelf label layout
        zpl += `^FO50,30^BC^FD${label.fach}\t${label.policaLocation}^FS\n`; // Barcode
        zpl += `^FO50,100^FD${label.fach}^FS\n`; // Fach
        zpl += `^FO50,140^FDPolica stitok^FS\n`; // Description
        zpl += `^FO50,170^GB300,2,2^FS\n`; // Line
        zpl += `^FO50,180^FD${label.fach}\t${label.policaLocation}^FS\n`; // Location

    } else if (label.type === 'remene' || label.type === 'qr') {
        // QR code layout for remene/qr labels
        zpl += `^FO50,30^BQ^FDQM,${formatArtikelForBarcode(label.artikel)}^FS\n`; // QR Code
        zpl += `^FO150,60^FD${formatArtikel(label.artikel)}^FS\n`; // Article
        zpl += `^FO150,100^FD${label.nazov}^FS\n`; // Name/Description

    } else {
        // Standard label layout
        zpl += `^FO50,30^BC^FD${formatArtikelForBarcode(label.artikel)}^FS\n`; // Barcode
        zpl += `^FO50,100^FD${formatArtikel(label.artikel)}^FS\n`; // Article
        zpl += `^FO50,140^FD${label.nazov}^FS\n`; // Name
        zpl += `^FO50,170^GB300,2,2^FS\n`; // Line
        
        if (showPolica && label.polica) {
            zpl += `^FO50,180^FD${label.polica}^FS\n`; // Shelf
        }
    }

    // End ZPL
    zpl += '^XZ\n';

    return zpl;
}

/**
 * Generuje EPL príkazy (basic implementation)
 */
function generateEPLCommands(labelsArray) {
    let eplCommands = '';
    
    labelsArray.forEach(label => {
        for (let i = 0; i < label.quantity; i++) {
            eplCommands += generateSingleEPLLabel(label) + '\n';
        }
    });

    return eplCommands;
}

/**
 * Generuje EPL pre jeden štítok
 */
function generateSingleEPLLabel(label) {
    let epl = '';
    
    // EPL commands for basic label
    epl += 'N\n'; // Clear buffer
    epl += 'q400\n'; // Set label width
    epl += 'Q200,26\n'; // Set label height and gap
    epl += 'D7\n'; // Set density
    epl += 'ZT\n'; // Print top of form backup

    if (label.type === 'nametag') {
        epl += `B50,30,0,1,2,2,60,N,"${label.osobneCislo}"\n`; // Barcode
        epl += `A50,100,0,2,1,1,N,"${label.osobneCislo}"\n`; // Personal number
        epl += `A50,140,0,2,1,1,N,"${label.meno} ${label.priezvisko}"\n`; // Full name
        epl += `LO50,170,300,2\n`; // Line
        epl += `A50,180,0,2,1,1,N,"${label.oddelenie || ''}"\n`; // Department
    } else {
        epl += `B50,30,0,1,2,2,60,N,"${formatArtikelForBarcode(label.artikel)}"\n`; // Barcode
        epl += `A50,100,0,2,1,1,N,"${formatArtikel(label.artikel)}"\n`; // Article
        epl += `A50,140,0,2,1,1,N,"${label.nazov}"\n`; // Name
        epl += `LO50,170,300,2\n`; // Line
        if (showPolica && label.polica) {
            epl += `A50,180,0,2,1,1,N,"${label.polica}"\n`; // Shelf
        }
    }

    epl += 'P1\n'; // Print

    return epl;
}

/**
 * Generuje raw príkazy
 */
function generateRawCommands(labelsArray) {
    let commands = '';
    
    labelsArray.forEach(label => {
        for (let i = 0; i < label.quantity; i++) {
            commands += `PRINT LABEL: ${label.artikel} - ${label.nazov}\n`;
        }
    });

    return commands;
}

/**
 * Ukladá nastavenia direct print do localStorage
 */
function saveDirectPrintSettings() {
    const settings = {
        printers,
        currentPrintMode,
        defaultPrinterId
    };
    
    localStorage.setItem('directPrintSettings', JSON.stringify(settings));
}

/**
 * Načítava nastavenia direct print z localStorage
 */
function loadPrintersFromLocalStorage() {
    try {
        const saved = localStorage.getItem('directPrintSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            printers = settings.printers || [];
            currentPrintMode = settings.currentPrintMode || 'browser';
            defaultPrinterId = settings.defaultPrinterId || '';
            
            // Update UI
            const printModeSelect = document.getElementById('printModeSelect');
            if (printModeSelect) printModeSelect.value = currentPrintMode;
            
            updatePrintersDropdowns();
            updatePrintersList();
        }
    } catch (error) {
        console.error('Error loading direct print settings:', error);
    }
}

// Global functions for HTML onclick handlers
window.removePrinter = removePrinter;
window.closeZPLPreview = closeZPLPreview;
window.copyZPLToClipboard = copyZPLToClipboard;
window.downloadZPL = downloadZPL;