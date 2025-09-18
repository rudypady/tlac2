// 🛡️ ERROR HANDLING MODULE - Centralizované ošetrenie chýb a fallback mechanizmy

/**
 * Globálny error handler pre zachytenie všetkých JavaScript chýb.
 */
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
    
    // Logovanie chyby (v budúcnosti možno poslať na server)
    const errorInfo = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    };
    
    // Uloženie chyby do localStorage pre debugging
    try {
        const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
        errors.push(errorInfo);
        // Udržiavať len posledných 10 chýb
        if (errors.length > 10) {
            errors.splice(0, errors.length - 10);
        }
        localStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (e) {
        console.warn('Nemožno uložiť chybu do localStorage:', e);
    }
    
    // Zobrazenie user-friendly správy len pre kritické chyby
    if (event.error && !event.error.message?.includes('Script error')) {
        showToast('Vyskytla sa neočakávaná chyba. Aplikácia pokračuje v práci.', 'warning');
    }
});

/**
 * Handler pre nespracované Promise rejections.
 */
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Zabrániť default browser správe
    event.preventDefault();
    
    // Zobrazenie user-friendly správy
    showToast('Vyskytol sa problém pri spracovaní dát. Skúste operáciu znovu.', 'error');
});

/**
 * Kontroluje dostupnosť kritických funkcií a zobrazuje varovania.
 */
function checkCriticalDependencies() {
    const warnings = [];
    
    // Kontrola XLSX knižnice
    if (typeof XLSX === 'undefined' || !XLSX.read) {
        warnings.push('Excel import môže byť obmedzený - XLSX knižnica nie je dostupná');
    }
    
    // Kontrola JsBarcode knižnice
    if (typeof JsBarcode === 'undefined') {
        warnings.push('Čiarové kódy budú zobrazené ako text - JsBarcode knižnica nie je dostupná');
    }
    
    // Kontrola jsPDF knižnice
    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
        warnings.push('PDF export nie je dostupný - jsPDF knižnica nie je dostupná');
    }
    
    // Zobrazenie varovaní používateľovi
    if (warnings.length > 0) {
        console.warn('Dependency warnings:', warnings);
        // Zobrazíme len prvé varovanie, aby sme nezahlcovali UI
        showToast(warnings[0], 'warning');
    }
}

/**
 * Bezpečné volanie funkcie s error handling.
 * @param {Function} fn - Funkcia na vykonanie
 * @param {Array} args - Argumenty funkcie
 * @param {Function} fallback - Fallback funkcia pri chybe
 * @returns {*} Výsledok funkcie alebo fallback
 */
function safeCall(fn, args = [], fallback = null) {
    try {
        if (typeof fn === 'function') {
            return fn.apply(null, args);
        } else {
            throw new Error('Provided argument is not a function');
        }
    } catch (error) {
        console.error('Error in safeCall:', error);
        if (typeof fallback === 'function') {
            try {
                return fallback.apply(null, args);
            } catch (fallbackError) {
                console.error('Error in fallback function:', fallbackError);
                return null;
            }
        }
        return null;
    }
}

/**
 * Retry mechanizmus pre operácie, ktoré môžu zlyhať.
 * @param {Function} fn - Funkcia na vykonanie
 * @param {number} maxRetries - Maximálny počet pokusov
 * @param {number} delay - Oneskorenie medzi pokusmi (ms)
 * @returns {Promise} Promise s výsledkom
 */
async function retryOperation(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            console.warn(`Pokus ${i + 1} zlyhal:`, error.message);
            
            if (i < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
            }
        }
    }
    
    throw lastError;
}

/**
 * Validuje integrity critical DOM elementov.
 * @returns {boolean} True ak sú všetky elementy prítomne
 */
function validateDOMIntegrity() {
    const criticalElements = [
        'quickArtikel', 'quickNazov', 'quickPolica', 'addQuickBtn',
        'searchInput', 'labelsList', 'previewArtikel', 'previewNazov', 'previewPolica'
    ];
    
    const missingElements = [];
    
    for (const elementId of criticalElements) {
        const element = document.getElementById(elementId);
        if (!element) {
            missingElements.push(elementId);
        }
    }
    
    if (missingElements.length > 0) {
        console.error('Chýbajúce DOM elementy:', missingElements);
        showToast('Vyskytol sa problém s načítaním stránky. Obnovte stránku.', 'error');
        return false;
    }
    
    return true;
}

/**
 * Inicializuje error handling systém.
 */
function initializeErrorHandling() {
    // Kontrola závislostí po načítaní stránky
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            checkCriticalDependencies();
            validateDOMIntegrity();
        }, 2000); // Dáme čas external knižniciam na načítanie
    });
    
    // Periodická kontrola health aplikácie
    setInterval(() => {
        try {
            // Základná kontrola funkčnosti
            if (!validateDOMIntegrity()) {
                console.warn('DOM integrity check failed');
            }
            
            // Kontrola localStorage dostupnosti
            localStorage.setItem('health_check', Date.now().toString());
            localStorage.removeItem('health_check');
            
        } catch (error) {
            console.error('Health check failed:', error);
        }
    }, 60000); // Každú minútu
}

// Automatická inicializácia
initializeErrorHandling();