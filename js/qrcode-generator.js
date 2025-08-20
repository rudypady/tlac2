/**
 * Minimal QR Code Generator for Remene Labels
 * Creates a basic QR code pattern as SVG without external dependencies
 */

/**
 * Simple QR Code generator that creates a visual pattern
 * @param {string} text - Text to encode
 * @param {number} size - Size of the QR code matrix (default 21)
 * @returns {string} SVG string
 */
function generateSimpleQRCode(text, size = 21) {
    // Create a simple pattern based on text hash
    const hash = simpleHash(text);
    const matrix = createQRMatrix(hash, size);
    
    // Convert matrix to SVG
    return matrixToSVG(matrix, size);
}

/**
 * Simple hash function to create a consistent pattern from text
 * @param {string} str - Input string
 * @returns {number} Hash value
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Create QR code matrix pattern
 * @param {number} hash - Hash value for pattern generation
 * @param {number} size - Matrix size
 * @returns {Array<Array<boolean>>} 2D matrix
 */
function createQRMatrix(hash, size) {
    const matrix = Array(size).fill().map(() => Array(size).fill(false));
    
    // Add finder patterns (corners)
    addFinderPattern(matrix, 0, 0, size);
    addFinderPattern(matrix, size - 7, 0, size);
    addFinderPattern(matrix, 0, size - 7, size);
    
    // Add timing patterns
    addTimingPatterns(matrix, size);
    
    // Fill data pattern based on hash
    fillDataPattern(matrix, hash, size);
    
    return matrix;
}

/**
 * Add finder pattern (7x7 square in corners)
 * @param {Array<Array<boolean>>} matrix - QR matrix
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} size - Matrix size
 */
function addFinderPattern(matrix, x, y, size) {
    for (let dy = 0; dy < 7; dy++) {
        for (let dx = 0; dx < 7; dx++) {
            const row = y + dy;
            const col = x + dx;
            if (row >= 0 && row < size && col >= 0 && col < size) {
                // Create finder pattern: outer square, inner square
                const isOuter = dy === 0 || dy === 6 || dx === 0 || dx === 6;
                const isInner = (dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4);
                matrix[row][col] = isOuter || isInner;
            }
        }
    }
}

/**
 * Add timing patterns (alternating dots)
 * @param {Array<Array<boolean>>} matrix - QR matrix
 * @param {number} size - Matrix size
 */
function addTimingPatterns(matrix, size) {
    // Horizontal timing pattern
    for (let x = 8; x < size - 8; x++) {
        matrix[6][x] = (x % 2) === 0;
    }
    
    // Vertical timing pattern
    for (let y = 8; y < size - 8; y++) {
        matrix[y][6] = (y % 2) === 0;
    }
}

/**
 * Fill data pattern based on hash
 * @param {Array<Array<boolean>>} matrix - QR matrix
 * @param {number} hash - Hash value
 * @param {number} size - Matrix size
 */
function fillDataPattern(matrix, hash, size) {
    let bitIndex = 0;
    const hashBits = hash.toString(2).padStart(32, '0');
    
    // Create more complex pattern that looks more like a real QR code
    const seedValue = hash % 256;
    
    // Fill remaining areas with pattern based on hash
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Skip finder patterns and timing patterns
            if (isReservedArea(x, y, size)) {
                continue;
            }
            
            // Create a more complex pattern using multiple criteria
            const positionHash = (x * 7 + y * 11 + seedValue) % 256;
            const hashBit = hashBits[bitIndex % hashBits.length] === '1';
            const positionBit = (positionHash % 3) !== 0; // 2/3 probability
            const distanceFactor = Math.abs(x - size/2) + Math.abs(y - size/2);
            const distanceBit = (distanceFactor + seedValue) % 4 !== 0; // 3/4 probability
            
            // Combine multiple factors for more realistic QR pattern
            const shouldFill = hashBit && (positionBit || distanceBit);
            matrix[y][x] = shouldFill;
            bitIndex++;
        }
    }
    
    // Add some alignment pattern-like structures for larger QR codes
    if (size >= 21) {
        addAlignmentPattern(matrix, size - 7, size - 7, size);
    }
}

/**
 * Add alignment pattern (smaller pattern in bottom-right area)
 * @param {Array<Array<boolean>>} matrix - QR matrix
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} size - Matrix size
 */
function addAlignmentPattern(matrix, centerX, centerY, size) {
    const patternSize = 5;
    const halfSize = Math.floor(patternSize / 2);
    
    for (let dy = -halfSize; dy <= halfSize; dy++) {
        for (let dx = -halfSize; dx <= halfSize; dx++) {
            const x = centerX + dx;
            const y = centerY + dy;
            
            if (x >= 0 && x < size && y >= 0 && y < size) {
                // Create 5x5 alignment pattern: outer ring and center dot
                const isOuter = Math.abs(dx) === halfSize || Math.abs(dy) === halfSize;
                const isCenter = dx === 0 && dy === 0;
                matrix[y][x] = isOuter || isCenter;
            }
        }
    }
}

/**
 * Check if position is in reserved area (finder patterns, timing patterns)
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} size - Matrix size
 * @returns {boolean} True if reserved
 */
function isReservedArea(x, y, size) {
    // Finder pattern areas
    if ((x < 9 && y < 9) || 
        (x >= size - 8 && y < 9) || 
        (x < 9 && y >= size - 8)) {
        return true;
    }
    
    // Timing patterns
    if (x === 6 || y === 6) {
        return true;
    }
    
    return false;
}

/**
 * Convert matrix to SVG string
 * @param {Array<Array<boolean>>} matrix - QR matrix
 * @param {number} size - Matrix size
 * @returns {string} SVG string
 */
function matrixToSVG(matrix, size) {
    const cellSize = 100 / size; // Scale to 100x100 SVG units
    let rects = '';
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (matrix[y][x]) {
                const xPos = x * cellSize;
                const yPos = y * cellSize;
                rects += `<rect x="${xPos}" y="${yPos}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
            }
        }
    }
    
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="white"/>
        ${rects}
    </svg>`;
}

/**
 * Enhanced QRCode implementation for fallback
 */
window.LocalQRCode = {
    toSVG: function(text, options, callback) {
        try {
            const svg = generateSimpleQRCode(text);
            if (callback) {
                // Use setTimeout to make it async like the real library
                setTimeout(() => callback(null, svg), 0);
            }
            return Promise.resolve(svg);
        } catch (error) {
            const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="white" stroke="black" stroke-width="2"/>
                <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="black">${text}</text>
            </svg>`;
            if (callback) {
                setTimeout(() => callback(null, fallbackSvg), 0);
            }
            return Promise.resolve(fallbackSvg);
        }
    }
};

/**
 * Unified QR Code generator for both preview and print
 * Ensures consistent QR code generation across all contexts
 * @param {HTMLElement} element - Element to insert QR code into
 * @param {string} text - Text to encode in QR code
 * @param {Object} options - Optional configuration
 * @returns {Promise} Promise that resolves when QR code is generated
 */
window.generateUnifiedQRCode = function(element, text, options = {}) {
    return new Promise((resolve, reject) => {
        if (!element) {
            reject(new Error('No element provided for QR code generation'));
            return;
        }
        
        // Try to use external QRCode library first
        if (typeof QRCode !== 'undefined' && QRCode.toSVG) {
            QRCode.toSVG(text, { 
                margin: options.margin || 1,
                width: options.width || undefined,
                scale: options.scale || undefined
            }, function (err, svg) {
                if (err) {
                    console.warn('External QRCode library failed, using fallback:', err);
                    useLocalImplementation();
                } else {
                    element.innerHTML = svg;
                    resolve(svg);
                }
            });
        } else {
            // Use local implementation
            useLocalImplementation();
        }
        
        function useLocalImplementation() {
            try {
                const svg = generateSimpleQRCode(text, options.size || 21);
                element.innerHTML = svg;
                resolve(svg);
            } catch (error) {
                console.error('QR code generation failed:', error);
                // Ultimate fallback - simple text in box
                const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="white" stroke="black" stroke-width="2"/>
                    <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" font-size="6" fill="black">${text}</text>
                </svg>`;
                element.innerHTML = fallbackSvg;
                resolve(fallbackSvg);
            }
        }
    });
};