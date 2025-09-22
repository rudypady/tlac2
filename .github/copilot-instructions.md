# Slovak Label Printing System PRO
Professional web-based label printing system for Schaeffler company that generates barcoded labels with database search functionality, built with vanilla JavaScript, HTML, and CSS.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Run the Application
- **NEVER use build tools** - this is a pure client-side web application
- **Always serve via HTTP server** - the application requires CORS-compliant file serving:
  - `cd /home/runner/work/tlac2/tlac2`
  - `python3 -m http.server 8000` - starts development server
  - **Application URL**: `http://localhost:8000/tlac1.html`
- **NEVER CANCEL SERVER** - let it run for the duration of your session
- **Dependencies are CDN-based** - no installation required (XLSX, JsBarcode, jsPDF libraries)

### Core Validation and Testing - ALWAYS PERFORM
1. **ALWAYS test the complete end-to-end label creation workflow**:
   - Navigate to `http://localhost:8000/tlac1.html`
   - Verify database loads (should show "3" items in statistics)
   - Fill Quick Label form: Artikel: "123456789", Názov: "Test Product", Polica: "A1-B2-C3"
   - Click "Pridať na tlač" - verify label appears in print queue
   - Click "Náhľad tlače" - verify print preview modal opens with barcode
   - Test search functionality by typing "123" in search box
   - Verify search results appear immediately

2. **ALWAYS test multi-tab functionality**:
   - Test all tabs: Štítky, Hromadná tlač, Tlač police, Tlač menovky, História tlače, Nastavenia
   - Verify each tab loads without JavaScript errors
   - Test language switching (Slovak/English/German) in header dropdown

3. **ALWAYS verify application loads correctly**:
   - Console should show: "✅ Systém tlačenia štítkov je pripravený!"
   - Database should auto-load with message: "Databáza automaticky načítaná: 3 položiek zo servera"
   - No red errors in browser console (warnings about CDN libraries are expected and acceptable)

### Performance and Timing Expectations
- **Application startup**: <1 second - loads instantly
- **Database loading**: <1 second - uses mock data when CDN fails
- **Search operations**: Instant - no debouncing needed for testing
- **Print preview generation**: <1 second - creates SVG barcode labels
- **NEVER CANCEL operations** - all operations complete under 2 seconds

### Architecture and Code Organization
- **Entry point**: `tlac1.html` (832 lines)
- **Stylesheets**: `styles.css` (1,767 lines) + 4 label template CSS files
- **JavaScript modules** (2,934 total lines):
  - `js/main.js` - initialization, translations, DOM management
  - `js/database.js` - Excel file processing, data management
  - `js/labels.js` - label creation and queue management
  - `js/print.js` - print preview, PDF generation, print history
  - `js/settings.js` - localStorage, user preferences
  - `js/utils.js` - validation, formatting, utility functions
- **Data file**: `data.xlsm` (2MB Excel file with sample products)

## Common Tasks and Expected Outputs

### Repository Structure
```
/home/runner/work/tlac2/tlac2/
├── tlac1.html              # Main application file
├── styles.css              # Main stylesheet
├── data.xlsm              # Excel database (2MB)
├── css/                   # Label template stylesheets
│   ├── label-standard.css
│   ├── label-compact.css
│   ├── label-detailed.css
│   └── label-nametag-shelf.css
└── js/                    # JavaScript modules
    ├── main.js            # Core application logic
    ├── database.js        # Data management
    ├── labels.js          # Label operations
    ├── print.js           # Print functionality
    ├── settings.js        # Configuration
    └── utils.js           # Utilities
```

### Key Application Features
- **Multi-language support**: Slovak (default), English, German
- **Label templates**: Standard, Compact, Detailed + Name tags + Shelf labels
- **Database operations**: Excel import/export, CSV export, search functionality
- **Print management**: Print queue, batch printing, print history, print sets
- **Theme support**: Light, Dark, Auto modes
- **Barcode generation**: CODE128 format for article numbers
- **Data persistence**: localStorage for session data and user preferences

### Validation Scenarios - ALWAYS TEST AFTER CHANGES
1. **Label Creation Workflow**:
   - Create quick label with valid data
   - Verify preview updates in real-time
   - Add to print queue and verify counter updates
   - Open print preview and verify barcode renders

2. **Database Search**:
   - Search for "123" - should find "Testovací produkt 1"
   - Search for "987" - should find "Testovací produkt 2"
   - Test empty search - should show all 3 items
   - Test non-existent search - should show "Žiadne výsledky"

3. **Settings Persistence**:
   - Change language to English, refresh page
   - Verify language persists across sessions
   - Change theme to Dark, verify UI updates
   - Test default template selection

### File Modification Guidelines
- **NEVER modify** `data.xlsm` - this is the sample database
- **Core files to edit**: JavaScript modules in `js/` directory
- **Style modifications**: `styles.css` and template CSS files in `css/`
- **UI changes**: `tlac1.html` for structural modifications
- **Always test changes** using the validation scenarios above

### Development Workflow
1. **Always start HTTP server**: `python3 -m http.server 8000`
2. **Always open application**: Navigate to `http://localhost:8000/tlac1.html`
3. **Always check console**: Verify no errors during initialization
4. **Always test core functionality**: Quick label creation → Print preview
5. **Always verify search**: Test database search with "123"
6. **Never skip validation**: Run through complete user scenarios

### Common Error Patterns to Watch For
- **CDN library failures**: Expected - application has fallbacks
- **CORS errors**: Use HTTP server, never open file:// directly
- **localStorage quota**: Clear if testing large datasets
- **Excel file loading**: Uses mock data when server/file unavailable
- **Print preview issues**: Usually related to barcode library failures

### Browser Console Output - Expected Messages
```
🚀 Inicializujem systém tlačenia štítkov...
Dáta načítané z localStorage
Pokúšam sa načítať data.xlsm zo servera...
Databáza automaticky načítaná zo servera: 3 položiek
✅ Systém tlačenia štítkov je pripravený!
```

### Testing Different Functionality Areas
- **Database tab**: Search, filtering, article validation
- **Print tab**: Queue management, batch operations, print sets
- **History tab**: Print tracking, export functionality
- **Settings tab**: Theme switching, language changes, template selection
- **Multi-tab navigation**: Ensure state persistence between tabs

Remember: This is a production-ready application - every feature should work correctly after your changes. The application gracefully handles offline scenarios and CDN failures with appropriate fallbacks.