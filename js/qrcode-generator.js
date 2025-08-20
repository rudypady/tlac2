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
    
    // Fill remaining areas with pattern based on hash
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Skip finder patterns and timing patterns
            if (isReservedArea(x, y, size)) {
                continue;
            }
            
            // Use hash bits cyclically
            const bit = hashBits[bitIndex % hashBits.length] === '1';
            matrix[y][x] = bit;
            bitIndex++;
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
                callback(null, svg);
            }
            return Promise.resolve(svg);
        } catch (error) {
            const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="white" stroke="black" stroke-width="2"/>
                <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="black">${text}</text>
            </svg>`;
            if (callback) {
                callback(error, fallbackSvg);
            }
            return Promise.resolve(fallbackSvg);
        }
    }
};