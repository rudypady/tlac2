// 🖨️ DIRECT PRINT MODULE - ZPL Generation and Silent Printing

/**
 * Generates ZPL for a single label based on its type
 * @param {Object} label - Label object
 * @returns {string} ZPL string
 */
function generateZPL(label) {
    let zpl = '^XA'; // Start ZPL
    
    if (label.type === 'nametag') {
        // Nametag ZPL generation
        const barcode = label.osobneCislo;
        const fullName = `${label.meno} ${label.priezvisko}`;
        const department = label.oddelenie || '';
        
        zpl += '^FO50,20^BY2^BCN,50,Y,N,N^FD' + barcode + '^FS'; // Barcode
        zpl += '^FO50,80^A0N,20,20^FD' + label.osobneCislo + '^FS'; // Personal number
        zpl += '^FO50,110^A0N,25,25^FD' + fullName + '^FS'; // Full name
        zpl += '^FO50,140^A0N,15,15^FD' + department + '^FS'; // Department
        
    } else if (label.type === 'shelf') {
        // Shelf ZPL generation
        const barcode = `${label.fach}\t${label.policaLocation}`;
        
        zpl += '^FO50,20^BY2^BCN,50,Y,N,N^FD' + barcode + '^FS'; // Barcode
        zpl += '^FO50,80^A0N,25,25^FD' + label.fach + '^FS'; // Fach
        zpl += '^FO50,110^A0N,20,20^FDPolica stitok^FS'; // Description
        zpl += '^FO50,140^A0N,15,15^FD' + barcode + '^FS'; // Location
        
    } else {
        // Default label ZPL generation
        const barcode = formatArtikelForBarcode(label.artikel);
        
        zpl += '^FO50,20^BY2^BCN,50,Y,N,N^FD' + barcode + '^FS'; // Barcode
        zpl += '^FO50,80^A0N,25,25^FD' + formatArtikel(label.artikel) + '^FS'; // Artikel
        zpl += '^FO50,110^A0N,20,20^FD' + label.nazov + '^FS'; // Name
        zpl += '^FO50,140^A0N,15,15^FD' + label.polica + '^FS'; // Shelf
    }
    
    zpl += '^XZ'; // End ZPL
    return zpl;
}

/**
 * Builds ZPL for all labels in the current print queue
 * @returns {string} Combined ZPL string for all labels
 */
function buildLabelsZPL() {
    if (!labels || labels.length === 0) {
        throw new Error('No labels to print');
    }
    
    let combinedZPL = '';
    
    labels.forEach(label => {
        // Generate ZPL for each quantity
        for (let i = 0; i < label.quantity; i++) {
            combinedZPL += generateZPL(label);
        }
    });
    
    return combinedZPL;
}

/**
 * Sends ZPL to the print proxy service
 * @param {string} zpl - ZPL string to send
 * @returns {Promise} Response from print service
 */
async function sendZPLToPrinter(zpl) {
    const apiUrl = '/api/print'; // Relative URL for production deployment
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Add API key if configured
    if (window.PRINT_API_KEY) {
        headers['X-API-Key'] = window.PRINT_API_KEY;
    }
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ zpl: zpl })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
}

/**
 * Main function to start silent printing
 */
async function startSilentPrint() {
    try {
        // Check if there are labels to print
        if (!labels || labels.length === 0) {
            showToast(translations[currentLanguage]['toast-warning-no-labels'] || 'No labels to print', 'warning');
            return;
        }
        
        // Show loading state
        showToast('Generating ZPL...', 'info');
        
        // Generate ZPL for all labels
        const zpl = buildLabelsZPL();
        
        // Send to printer
        showToast('Sending to printer...', 'info');
        const result = await sendZPLToPrinter(zpl);
        
        // Success - add to print history like standard print
        addToPrintHistory();
        
        // Show success message
        showToast(result.message || 'Labels printed successfully!', 'success');
        
    } catch (error) {
        console.error('Silent print error:', error);
        showToast(`Print failed: ${error.message}`, 'error');
    }
}

// Make functions available globally
window.startSilentPrint = startSilentPrint;
window.generateZPL = generateZPL;
window.buildLabelsZPL = buildLabelsZPL;