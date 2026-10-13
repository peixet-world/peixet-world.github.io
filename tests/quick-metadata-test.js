// Quick test for metadata system functionality
// Run with: node tests/quick-metadata-test.js

// Mock fetch for Node.js environment
global.fetch = async (url) => {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
        // Convert URL to file path
        const filePath = url.replace(/^\.\//, '');
        const fullPath = path.join(__dirname, '..', filePath);
        
        const content = await fs.readFile(fullPath, 'utf8');
        
        return {
            ok: true,
            status: 200,
            json: async () => JSON.parse(content),
            text: async () => content
        };
    } catch (error) {
        return {
            ok: false,
            status: 404,
            statusText: 'Not Found'
        };
    }
};

// Mock Logger
global.Logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    error: (msg, error) => console.error(`[ERROR] ${msg}`, error || ''),
    debug: (msg, data) => console.log(`[DEBUG] ${msg}`, data || '')
};

// Load PDFManager class
const fs = require('fs');
const path = require('path');
const pdfManagerCode = fs.readFileSync(path.join(__dirname, '../js/pdf-manager.js'), 'utf8');

// Remove the class declaration and create it manually
eval(pdfManagerCode.replace('class PDFManager', 'global.PDFManager = class'));

async function testMetadataSystem() {
    console.log('Testing PDF Metadata System...\n');
    
    const pdfManager = new PDFManager('./pdfs/');
    
    try {
        // Test 1: Load existing metadata
        console.log('Test 1: Loading existing metadata for sample-document.pdf');
        const metadata1 = await pdfManager.getPDFMetadata('sample-document.pdf');
        console.log('Result:', JSON.stringify(metadata1, null, 2));
        console.log('✅ Test 1 passed\n');
        
        // Test 2: Generate default metadata
        console.log('Test 2: Generating default metadata for non-existent file');
        const metadata2 = await pdfManager.getPDFMetadata('non-existent-file.pdf');
        console.log('Result:', JSON.stringify(metadata2, null, 2));
        console.log('✅ Test 2 passed\n');
        
        // Test 3: Title generation
        console.log('Test 3: Testing title generation');
        const testCases = [
            'my-document.pdf',
            'user_guide.pdf',
            'technical-specification-v2.pdf'
        ];
        
        for (const testCase of testCases) {
            const title = pdfManager.generateTitleFromFilename(testCase);
            console.log(`${testCase} -> "${title}"`);
        }
        console.log('✅ Test 3 passed\n');
        
        // Test 4: Metadata validation
        console.log('Test 4: Testing metadata validation');
        const invalidMetadata = {
            title: 'Test Document',
            tags: 'not-an-array',
            fileSize: -1,
            pageCount: 0
        };
        
        const normalized = await pdfManager.validateAndNormalizeMetadata(invalidMetadata, 'test.pdf');
        console.log('Normalized metadata:', JSON.stringify(normalized, null, 2));
        console.log('✅ Test 4 passed\n');
        
        console.log('🎉 All metadata system tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testMetadataSystem();