// 🏷️ LABELS MODULE - Správa štítkov na tlač

/**
 * Pridá štítok do zoznamu na tlač.
 * @param {Object} item - Štítok na pridanie.
 * @param {HTMLElement} sourceElement - Element pre animáciu (voliteľný).
 */
function addLabelToPrintList(item, sourceElement = null) {
    const normalizedArtikel = normalizeArtikel(item.artikel);
    const existingLabelIndex = labels.findIndex(l => 
        normalizeArtikel(l.artikel) === normalizedArtikel && 
        l.nazov === item.nazov && 
        l.polica === item.polica
    );

    if (existingLabelIndex > -1) {
        labels[existingLabelIndex].quantity += item.quantity || 1;
    } else {
        labels.push({
            id: uuidv4(), // Unikátne ID pre štítok v zozname na tlač
            artikel: normalizedArtikel, // Interné ukladanie bez pomlčky
            nazov: item.nazov,
            polica: item.polica,
            quantity: item.quantity || 1
        });
    }
    
    // Spustenie animácie
    if (sourceElement) {
        animateLabelAddition(sourceElement);
    }
    
    renderLabelsToPrint();
    saveDataToLocalStorage(); // Uložiť zmeny štítkov
}

/**
 * Animácia pridania štítka (vizuálny feedback pre používateľa).
 * @param {HTMLElement} sourceElement - Element, z ktorého sa spustí animácia.
 */
function animateLabelAddition(sourceElement) {
    if (!sourceElement) return;
    
    const animElement = sourceElement.cloneNode(true);
    animElement.style.position = 'fixed';
    animElement.style.zIndex = '9999';
    animElement.style.pointerEvents = 'none';
    animElement.style.transition = 'all 0.6s ease-out';
    
    const sourceRect = sourceElement.getBoundingClientRect();
    animElement.style.left = sourceRect.left + 'px';
    animElement.style.top = sourceRect.top + 'px';
    animElement.style.width = sourceRect.width + 'px';
    animElement.style.height = sourceRect.height + 'px';
    
    document.body.appendChild(animElement);
    
    const targetElement = elements.labelsList.parentElement;
    const targetRect = targetElement.getBoundingClientRect();
    
    // Spustenie animácie
    setTimeout(() => {
        animElement.style.left = targetRect.left + 'px';
        animElement.style.top = targetRect.top + 'px';
        animElement.style.transform = 'scale(0.8)';
        animElement.style.opacity = '0.8';
    }, 50);
    
    // Odstránenie elementu po animácii
    setTimeout(() => {
        if (animElement.parentNode) {
            animElement.parentNode.removeChild(animElement);
        }
    }, 650);
}

/**
 * Vykreslí zoznam štítkov pripravených na tlač.
 */
function renderLabelsToPrint() {
    elements.labelsList.innerHTML = '';
    if (labels.length === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.labelsList.classList.add('hidden');
        elements.previewBtn.classList.add('hidden');
        elements.printBtn.classList.add('hidden');
        if (elements.printSetsSection) {
            elements.printSetsSection.style.display = 'none';
        }
        if (elements.bulkActionsSection) {
            elements.bulkActionsSection.style.display = 'none';
        }
    } else {
        elements.emptyState.classList.add('hidden');
        elements.labelsList.classList.remove('hidden');
        elements.previewBtn.classList.remove('hidden');
        elements.printBtn.classList.remove('hidden');
        if (elements.printSetsSection) {
            elements.printSetsSection.style.display = 'block';
        }
        if (elements.bulkActionsSection) {
            elements.bulkActionsSection.style.display = 'block';
        }

        labels.forEach(label => {
            const div = document.createElement('div');
            div.className = 'label-item';
            div.dataset.id = label.id; // Používame unikátne ID pre SortableJS
            div.innerHTML = `
                <div class="label-content">
                    <div class="label-checkbox">
                        <input type="checkbox" class="label-checkbox-input" data-label-id="${label.id}">
                    </div>
                    <div class="label-info">
                        <div class="label-artikel">${formatArtikel(label.artikel)}</div>
                        <div class="label-nazov">${label.nazov}</div>
                        <div class="label-poznamka">
                            <span class="database-polica">${label.polica}</span>
                        </div>
                    </div>
                    <div class="label-controls">
                        <span class="quantity-label" data-lang="quantity-label">Množstvo:</span>
                        <input type="number" class="quantity-input" value="${label.quantity}" min="1" data-id="${label.id}">
                        <button class="btn btn-danger btn-small remove-label-btn" data-id="${label.id}">
                            ✖️
                        </button>
                    </div>
                </div>
            `;
            elements.labelsList.appendChild(div);
        });

        // Pridanie event listenerov pre checkboxy
        elements.labelsList.querySelectorAll('.label-checkbox-input').forEach(checkbox => {
            checkbox.addEventListener('change', updateBulkSelection);
        });

        // Pridanie event listenerov pre zmenu množstva a odstránenie
        elements.labelsList.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const newQuantity = parseInt(e.target.value, 10);
                const labelIndex = labels.findIndex(l => l.id === id);
                if (labelIndex > -1 && newQuantity >= 1) {
                    labels[labelIndex].quantity = newQuantity;
                    saveDataToLocalStorage(); // Uložiť zmeny štítkov
                } else if (newQuantity < 1) {
                    // Ak je množstvo menej ako 1, odstrániť štítok
                    removeLabelFromPrintList(id);
                }
            });
        });

        elements.labelsList.querySelectorAll('.remove-label-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                removeLabelFromPrintList(id);
            });
        });

        // Inicializácia SortableJS
        new Sortable(elements.labelsList, {
            animation: 150,
            onEnd: function (evt) {
                const movedItem = labels.splice(evt.oldIndex, 1)[0];
                labels.splice(evt.newIndex, 0, movedItem);
                saveDataToLocalStorage(); // Uložiť zmeny štítkov
                renderLabelsToPrint(); // Prekresliť pre správne zobrazenie
            }
        });
    }
    updateLabelsCount();
    updatePrintButtons();
}

/**
 * Odstráni štítok zo zoznamu na tlač.
 * @param {string} id - ID štítka.
 */
function removeLabelFromPrintList(id) {
    labels = labels.filter(label => label.id !== id);
    renderLabelsToPrint();
    saveDataToLocalStorage(); // Uložiť zmeny štítkov
}

/**
 * Aktualizuje počet štítkov na tlač.
 */
function updateLabelsCount() {
    const totalLabels = labels.reduce((sum, label) => sum + label.quantity, 0);
    elements.labelsCount.textContent = `${totalLabels} ${translations[currentLanguage]['labels-count-suffix']}`;
}

/**
 * Aktualizuje viditeľnosť tlačidiel "Náhľad tlače" a "Tlačiť".
 */
function updatePrintButtons() {
    if (labels.length > 0) {
        elements.previewBtn.classList.remove('hidden');
        elements.printBtn.classList.remove('hidden');
    } else {
        elements.previewBtn.classList.add('hidden');
        elements.printBtn.classList.add('hidden');
    }
}

/**
 * Aktualizuje náhľad štítka na základe vstupov alebo vybraného štítka.
 */
function updatePreview() {
    const artikel = elements.quickArtikel.value || '123456789';
    const nazov = elements.quickNazov.value || translations[currentLanguage]['preview-nazov-placeholder'] || 'Ukážkový produkt s dlhším názvom';
    const polica = elements.quickPolica.value || 'A1-B2-C3';

    // Formátovanie artiklu s pomlčkami pre zobrazenie
    const formattedArtikel = formatArtikel(artikel);
    elements.previewArtikel.textContent = formattedArtikel;
    elements.previewNazov.textContent = nazov;
    elements.previewPolica.textContent = polica;

    // Aplikovať šablónu
    const template = elements.templateSelect.value || currentTemplate;
    applyTemplateToPreview(template);

    // Generovanie čiarového kódu (použije normalizovaný artikel pre čiarový kód)
    const normalizedForBarcode = formatArtikelForBarcode(artikel);
    try {
        JsBarcode(elements.previewBarcode, normalizedForBarcode, {
            format: "CODE128",
            width: 1,
            height: 20,
            displayValue: false,
            margin: 0
        });
    } catch (error) {
        console.error('Chyba pri generovaní čiarového kódu:', error);
        showToast(translations[currentLanguage]['toast-error-barcode'], 'error');
    }
}

/**
 * Aplikuje šablónu na náhľad štítka.
 * @param {string} template - Typ šablóny ('default', 'compact', 'detailed').
 */
function applyTemplateToPreview(template) {
    const previewLabel = document.querySelector('.preview-label');
    if (!previewLabel) return;

    // Odstráni všetky existujúce template triedy
    previewLabel.classList.remove('template-default', 'template-compact', 'template-detailed');
    
    // Pridá novú template triedu
    previewLabel.classList.add(`template-${template}`);
    
    // Aktualizuj globálnu premennú
    currentTemplate = template;
}

/**
 * Pridá štítok z formulára "Rýchly štítok".
 */
function addQuickLabel() {
    const artikel = elements.quickArtikel.value.trim();
    const nazov = elements.quickNazov.value.trim();
    const polica = elements.quickPolica.value.trim();

    if (!artikel || !nazov || !polica) {
        showToast('Vyplňte všetky polia!', 'error');
        return;
    }

    // Validácia artiklu
    if (!validateArtikel(artikel)) {
        showToast(translations[currentLanguage]['toast-error-invalid-artikel'], 'error');
        return;
    }

    addLabelToPrintList({
        artikel: artikel,
        nazov: nazov,
        polica: polica,
        quantity: 1
    }, elements.addQuickBtn);

    showToast(translations[currentLanguage]['toast-success-add-label'], 'success');

    // Vymazať formulár
    elements.quickArtikel.value = '';
    elements.quickNazov.value = '';
    elements.quickPolica.value = '';
    
    // Deaktivácia tlačidla
    elements.addQuickBtn.disabled = true;
    
    // Aktualizácia náhľadu
    updatePreview();
}

/**
 * Hromadné operácie so štítkami.
 */
function updateBulkSelection() {
    const checkboxes = elements.labelsList.querySelectorAll('.label-checkbox-input');
    const checked = elements.labelsList.querySelectorAll('.label-checkbox-input:checked');
    
    // Aktualizuj "Označiť všetky" checkbox
    const selectAllCheckbox = document.getElementById('selectAllLabels');
    if (selectAllCheckbox) {
        selectAllCheckbox.indeterminate = checked.length > 0 && checked.length < checkboxes.length;
        selectAllCheckbox.checked = checked.length === checkboxes.length && checkboxes.length > 0;
    }
    
    // Aktualizuj počet označených
    const selectedCount = document.getElementById('selectedCount');
    if (selectedCount) {
        selectedCount.textContent = `${checked.length} ${translations[currentLanguage]['bulk-selected-count'] || 'označených'}`;
    }
    
    // Aktivuj/deaktivuj hromadné tlačidlá
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const bulkQuantityBtn = document.getElementById('bulkQuantityBtn');
    if (bulkDeleteBtn) bulkDeleteBtn.disabled = checked.length === 0;
    if (bulkQuantityBtn) bulkQuantityBtn.disabled = checked.length === 0;
}

/**
 * Označí/odznačí všetky štítky.
 */
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllLabels');
    const checkboxes = elements.labelsList.querySelectorAll('.label-checkbox-input');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
    
    updateBulkSelection();
}

/**
 * Zmaže označené štítky.
 */
function bulkDeleteLabels() {
    const checked = elements.labelsList.querySelectorAll('.label-checkbox-input:checked');
    if (checked.length === 0) {
        showToast(translations[currentLanguage]['toast-error-no-selection'], 'error');
        return;
    }
    
    if (confirm(translations[currentLanguage]['confirm-bulk-delete'])) {
        const idsToDelete = Array.from(checked).map(cb => cb.dataset.labelId);
        labels = labels.filter(label => !idsToDelete.includes(label.id));
        
        renderLabelsToPrint();
        saveDataToLocalStorage();
        showToast(translations[currentLanguage]['toast-success-bulk-delete'], 'success');
    }
}

/**
 * Zmení množstvo označených štítkov.
 */
function bulkChangeQuantity() {
    const checked = elements.labelsList.querySelectorAll('.label-checkbox-input:checked');
    if (checked.length === 0) {
        showToast(translations[currentLanguage]['toast-error-no-selection'], 'error');
        return;
    }
    
    const newQuantity = prompt(translations[currentLanguage]['bulk-change-quantity']);
    if (newQuantity === null) return; // Zrušené
    
    const quantity = parseInt(newQuantity, 10);
    if (isNaN(quantity) || quantity < 1) {
        showToast(translations[currentLanguage]['toast-error-invalid-quantity'], 'error');
        return;
    }
    
    const idsToUpdate = Array.from(checked).map(cb => cb.dataset.labelId);
    labels.forEach(label => {
        if (idsToUpdate.includes(label.id)) {
            label.quantity = quantity;
        }
    });
    
    renderLabelsToPrint();
    saveDataToLocalStorage();
    showToast(translations[currentLanguage]['toast-success-bulk-quantity'], 'success');
}

/**
 * Uloží aktuálne štítky ako tlačovú sadu.
 */
function savePrintSet() {
    const name = elements.printSetName.value.trim();
    if (!name) {
        showToast('Zadajte názov tlačovej sady!', 'error');
        return;
    }
    
    if (labels.length === 0) {
        showToast('Žiadne štítky na uloženie!', 'error');
        return;
    }
    
    printSets[name] = JSON.parse(JSON.stringify(labels)); // Deep copy
    saveDataToLocalStorage();
    
    // Aktualizuj dropdown
    updatePrintSetsDropdown();
    
    showToast(`Tlačová sada "${name}" bola uložená!`, 'success');
    elements.printSetName.value = '';
}

/**
 * Načíta vybranú tlačovú sadu.
 */
function loadPrintSet() {
    const selectedSet = elements.printSetsSelect.value;
    if (!selectedSet) {
        showToast(translations[currentLanguage]['toast-error-no-set-selected'], 'error');
        return;
    }
    
    if (!printSets[selectedSet]) {
        showToast('Tlačová sada nebola nájdená!', 'error');
        return;
    }
    
    labels = JSON.parse(JSON.stringify(printSets[selectedSet])); // Deep copy
    // Regeneruj ID pre štítky aby sa predišlo konfliktom
    labels.forEach(label => label.id = uuidv4());
    
    renderLabelsToPrint();
    saveDataToLocalStorage();
    
    showToast(`Tlačová sada "${selectedSet}" bola načítaná!`, 'success');
}

/**
 * Zmaže vybranú tlačovú sadu.
 */
function deletePrintSet() {
    const selectedSet = elements.printSetsSelect.value;
    if (!selectedSet) {
        showToast('Vyberte tlačovú sadu na zmazanie!', 'error');
        return;
    }
    
    if (confirm(translations[currentLanguage]['confirm-delete-set'])) {
        delete printSets[selectedSet];
        saveDataToLocalStorage();
        updatePrintSetsDropdown();
        showToast('Tlačová sada bola zmazaná!', 'success');
    }
}

/**
 * Aktualizuje dropdown s tlačovými sadami.
 */
function updatePrintSetsDropdown() {
    if (!elements.printSetsSelect) return;
    
    // Zachovaj prvú prázdnu možnosť
    elements.printSetsSelect.innerHTML = `<option value="" data-lang="select-print-set">Vyberte tlačovú sadu...</option>`;
    
    Object.keys(printSets).forEach(setName => {
        const option = document.createElement('option');
        option.value = setName;
        option.textContent = setName;
        elements.printSetsSelect.appendChild(option);
    });
}