/*!
 * Local minimal implementation of svg2pdf functionality
 * This provides basic SVG to PDF conversion capabilities when CDN libraries are blocked
 */

(function(global) {
    'use strict';
    
    // Check if jsPDF is available (either real or fallback)
    if (typeof global.jspdf !== 'undefined' && global.jspdf.jsPDF) {
        console.log('svg2pdf-local: Extending jsPDF with enhanced SVG support');
        
        // Store the original jsPDF constructor
        const originalJsPDF = global.jspdf.jsPDF;
        
        // Create enhanced jsPDF constructor
        global.jspdf.jsPDF = function(options) {
            const pdfInstance = new originalJsPDF(options);
            
            // Enhanced svg method that replaces the basic fallback
            pdfInstance.svg = async function(svgElement, options) {
                console.log('svg2pdf-local: Converting SVG to PDF with enhanced method', options);
                
                try {
                    const opts = options || {};
                    const x = opts.x || 0;
                    const y = opts.y || 0;
                    const width = opts.width || 2; // Default label width in inches
                    const height = opts.height || 1; // Default label height in inches
                    
                    if (svgElement) {
                        // Extract text content from SVG for better conversion
                        const texts = svgElement.querySelectorAll('text');
                        let textY = y + 0.2;
                        
                        // Set default font size
                        this.setFontSize(10);
                        
                        // Process each text element
                        texts.forEach((textElement, index) => {
                            const text = textElement.textContent || textElement.innerText || '';
                            if (text.trim()) {
                                // Adjust font size based on text position/importance
                                if (index === 0) {
                                    this.setFontSize(12); // Larger for first text (usually artikel)
                                } else {
                                    this.setFontSize(8);
                                }
                                
                                this.text(text.trim(), x + width/2, textY, { align: 'center' });
                                textY += 0.15;
                            }
                        });
                        
                        // If no text found, try to extract from data attributes or title
                        if (texts.length === 0 && svgElement.getAttribute) {
                            const title = svgElement.getAttribute('data-text') || 
                                         svgElement.getAttribute('title') || 
                                         'No text content';
                            this.setFontSize(10);
                            this.text(title, x + width/2, y + height/2, { align: 'center' });
                        }
                        
                        // Draw bounding rectangle
                        this.setDrawColor(0, 0, 0);
                        this.setLineWidth(0.01);
                        this.rect(x, y, width, height);
                        
                        console.log('svg2pdf-local: SVG converted successfully to PDF');
                    } else {
                        console.warn('svg2pdf-local: No SVG element provided');
                    }
                } catch (error) {
                    console.error('svg2pdf-local: Error converting SVG:', error);
                    // Fallback to simple text if SVG processing fails
                    this.text('SVG Conversion Error', x + (opts.width || 2)/2, y + (opts.height || 1)/2, { align: 'center' });
                }
            };
            
            return pdfInstance;
        };
        
        // Copy static properties from original constructor
        Object.keys(originalJsPDF).forEach(key => {
            if (typeof originalJsPDF[key] !== 'function') {
                global.jspdf.jsPDF[key] = originalJsPDF[key];
            }
        });
        
        console.log('svg2pdf-local: jsPDF successfully extended with SVG support');
        
    } else {
        console.warn('svg2pdf-local: jsPDF not available, cannot add SVG support');
    }
    
    // Provide global svg2pdf object for direct usage
    global.svg2pdf = {
        svg2pdf: function(svgElement, pdf, options) {
            console.log('svg2pdf-local: Global svg2pdf function called');
            if (pdf && typeof pdf.svg === 'function') {
                return pdf.svg(svgElement, options);
            } else {
                console.warn('svg2pdf-local: PDF instance does not have svg method');
                return Promise.resolve();
            }
        }
    };
    
    console.log('svg2pdf-local: Library initialization complete - svg2pdf is now available');
    
})(window);