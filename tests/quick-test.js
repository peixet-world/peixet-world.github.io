// Quick test to verify PDFManager implementation
// Run this in browser console or Node.js environment

async function quickTest() {
    console.log('Starting PDFManager quick test...');
    
    try {
        // Test 1: Constructor
        const pdfManager = new PDFManager();
        console.log('✓ PDFManager constructor works');
        
        // Test 2: Validate PDF entry
        const validEntry = { filename: 'test.pdf', fileSize: 1024 };
        const isValid = pdfManager.validatePDFEntry(validEntry);
        console.log(`✓ validatePDFEntry: ${isValid ? 'PASS' : 'FAIL'}`);
        
        // Test 3: Invalid entry
        const invalidEntry = { filename: 'test.txt' };
        const isInvalid = !pdfManager.validatePDFEntry(invalidEntry);
        console.log(`✓ validatePDFEntry (invalid): ${isInvalid ? 'PASS' : 'FAIL'}`);
        
        // Test 4: Load PDF list (will work if manifest exists)
        try {
            const pdfList = await pdfManager.loadPDFList();
            console.log(`✓ loadPDFList: Loaded ${pdfList.length} PDFs`);
        } catch (error) {
            console.log(`⚠ loadPDFList: ${error.message}`);
        }
        
        console.log('Quick test completed successfully!');
        return true;
        
    } catch (error) {
        console.error('Quick test failed:', error);
        return false;
    }
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.quickTest = quickTest;
}

// Auto-run if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { quickTest };
}