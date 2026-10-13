// Unit tests for PDFManager class

// Simple test framework for browser testing
class TestFramework {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async runAll() {
        console.log('Running PDF Manager tests...');
        this.results = [];

        for (const test of this.tests) {
            try {
                await test.testFn();
                this.results.push({ name: test.name, status: 'PASS' });
                console.log(`✓ ${test.name}`);
            } catch (error) {
                this.results.push({ name: test.name, status: 'FAIL', error: error.message });
                console.error(`✗ ${test.name}: ${error.message}`);
            }
        }

        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;

        console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
        return this.results;
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }

    assertNotNull(value, message) {
        if (value === null || value === undefined) {
            throw new Error(message || 'Expected non-null value');
        }
    }

    assertTrue(value, message) {
        if (value !== true) {
            throw new Error(message || `Expected true, got ${value}`);
        }
    }

    assertFalse(value, message) {
        if (value !== false) {
            throw new Error(message || `Expected false, got ${value}`);
        }
    }
}

// Test suite for PDFManager
const testFramework = new TestFramework();

// Mock fetch for testing
const originalFetch = window.fetch;
let mockFetchResponses = {};

function mockFetch(url, options = {}) {
    if (mockFetchResponses[url]) {
        const response = mockFetchResponses[url];
        return Promise.resolve({
            ok: response.ok !== false,
            status: response.status || 200,
            statusText: response.statusText || 'OK',
            json: () => Promise.resolve(response.data),
            arrayBuffer: () => Promise.resolve(response.arrayBuffer || new ArrayBuffer(0))
        });
    }

    // Default to 404 for unmocked URLs
    return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found'
    });
}

function setMockResponse(url, response) {
    mockFetchResponses[url] = response;
}

function clearMockResponses() {
    mockFetchResponses = {};
}

// Test: PDFManager constructor
testFramework.test('PDFManager constructor initializes correctly', () => {
    const pdfManager = new PDFManager();

    testFramework.assertEqual(pdfManager.pdfDirectory, './pdfs/');
    testFramework.assertEqual(pdfManager.metadataDirectory, './pdfs/metadata/');
    testFramework.assertEqual(pdfManager.manifestPath, './pdfs/metadata/manifest.json');
    testFramework.assert(Array.isArray(pdfManager.pdfList));
    testFramework.assertEqual(pdfManager.pdfList.length, 0);
});

// Test: PDFManager constructor with custom directory
testFramework.test('PDFManager constructor with custom directory', () => {
    const pdfManager = new PDFManager('./custom/');

    testFramework.assertEqual(pdfManager.pdfDirectory, './custom/');
    testFramework.assertEqual(pdfManager.metadataDirectory, './custom/metadata/');
    testFramework.assertEqual(pdfManager.manifestPath, './custom/metadata/manifest.json');
});

// Test: validatePDFEntry with valid entry
testFramework.test('validatePDFEntry accepts valid entry', () => {
    const pdfManager = new PDFManager();
    const validEntry = {
        filename: 'test.pdf',
        fileSize: 1024,
        uploadDate: '2025-01-22T10:00:00Z'
    };

    testFramework.assertTrue(pdfManager.validatePDFEntry(validEntry));
});

// Test: validatePDFEntry with invalid entries
testFramework.test('validatePDFEntry rejects invalid entries', () => {
    const pdfManager = new PDFManager();

    // Missing filename
    testFramework.assertFalse(pdfManager.validatePDFEntry({}));

    // Invalid filename type
    testFramework.assertFalse(pdfManager.validatePDFEntry({ filename: 123 }));

    // Non-PDF filename
    testFramework.assertFalse(pdfManager.validatePDFEntry({ filename: 'test.txt' }));

    // Filename with path separators
    testFramework.assertFalse(pdfManager.validatePDFEntry({ filename: '../test.pdf' }));
    testFramework.assertFalse(pdfManager.validatePDFEntry({ filename: 'folder/test.pdf' }));

    // Invalid fileSize
    testFramework.assertFalse(pdfManager.validatePDFEntry({ filename: 'test.pdf', fileSize: -1 }));
    testFramework.assertFalse(pdfManager.validatePDFEntry({ filename: 'test.pdf', fileSize: 'invalid' }));
});

// Test: loadPDFList with empty manifest
testFramework.test('loadPDFList handles empty manifest', async () => {
    window.fetch = mockFetch;

    const pdfManager = new PDFManager();
    setMockResponse('./pdfs/metadata/manifest.json', {
        data: { version: '1.0', files: [] }
    });

    const result = await pdfManager.loadPDFList();

    testFramework.assert(Array.isArray(result));
    testFramework.assertEqual(result.length, 0);
    testFramework.assertEqual(pdfManager.getPDFCount(), 0);

    window.fetch = originalFetch;
    clearMockResponses();
});

// Test: loadPDFList with valid manifest
testFramework.test('loadPDFList processes valid manifest', async () => {
    window.fetch = mockFetch;

    const pdfManager = new PDFManager();

    // Mock manifest response
    setMockResponse('./pdfs/metadata/manifest.json', {
        data: {
            version: '1.0',
            files: [
                { filename: 'test1.pdf', fileSize: 1024 },
                { filename: 'test2.pdf', fileSize: 2048 }
            ]
        }
    });

    // Mock PDF file existence checks
    setMockResponse('./pdfs/test1.pdf', { ok: true });
    setMockResponse('./pdfs/test2.pdf', { ok: true });

    const result = await pdfManager.loadPDFList();

    testFramework.assertEqual(result.length, 2);
    testFramework.assertEqual(result[0].filename, 'test1.pdf');
    testFramework.assertEqual(result[0].fullPath, './pdfs/test1.pdf');
    testFramework.assertEqual(result[1].filename, 'test2.pdf');

    window.fetch = originalFetch;
    clearMockResponses();
});

// Test: loadPDFList handles missing manifest
testFramework.test('loadPDFList handles missing manifest', async () => {
    window.fetch = mockFetch;

    const pdfManager = new PDFManager();
    // Don't set mock response, so it will return 404

    const result = await pdfManager.loadPDFList();

    testFramework.assert(Array.isArray(result));
    testFramework.assertEqual(result.length, 0);

    window.fetch = originalFetch;
    clearMockResponses();
});

// Test: validatePDF with valid PDF header
testFramework.test('validatePDF accepts valid PDF', async () => {
    window.fetch = mockFetch;

    const pdfManager = new PDFManager();

    // Create a mock PDF with valid header
    const pdfHeader = '%PDF-1.4\n';
    const encoder = new TextEncoder();
    const headerBytes = encoder.encode(pdfHeader);
    const mockArrayBuffer = new ArrayBuffer(headerBytes.length + 100);
    const view = new Uint8Array(mockArrayBuffer);
    view.set(headerBytes, 0);

    setMockResponse('./test.pdf', {
        ok: true,
        arrayBuffer: mockArrayBuffer
    });

    const result = await pdfManager.validatePDF('./test.pdf');
    testFramework.assertTrue(result);

    window.fetch = originalFetch;
    clearMockResponses();
});

// Test: validatePDF rejects invalid PDF
testFramework.test('validatePDF rejects invalid PDF', async () => {
    window.fetch = mockFetch;

    const pdfManager = new PDFManager();

    // Create a mock file with invalid header
    const invalidHeader = 'NOT A PDF';
    const encoder = new TextEncoder();
    const headerBytes = encoder.encode(invalidHeader);
    const mockArrayBuffer = new ArrayBuffer(headerBytes.length);
    const view = new Uint8Array(mockArrayBuffer);
    view.set(headerBytes, 0);

    setMockResponse('./invalid.pdf', {
        ok: true,
        arrayBuffer: mockArrayBuffer
    });

    const result = await pdfManager.validatePDF('./invalid.pdf');
    testFramework.assertFalse(result);

    window.fetch = originalFetch;
    clearMockResponses();
});

// Test: getPDFByFilename
testFramework.test('getPDFByFilename returns correct PDF', async () => {
    window.fetch = mockFetch;

    const pdfManager = new PDFManager();

    setMockResponse('./pdfs/metadata/manifest.json', {
        data: {
            version: '1.0',
            files: [{ filename: 'test.pdf', fileSize: 1024 }]
        }
    });
    setMockResponse('./pdfs/test.pdf', { ok: true });

    await pdfManager.loadPDFList();

    const pdf = pdfManager.getPDFByFilename('test.pdf');
    testFramework.assertNotNull(pdf);
    testFramework.assertEqual(pdf.filename, 'test.pdf');

    const notFound = pdfManager.getPDFByFilename('nonexistent.pdf');
    testFramework.assertEqual(notFound, null);

    window.fetch = originalFetch;
    clearMockResponses();
});

// Test: refreshPDFList
testFramework.test('refreshPDFList clears cache and reloads', async () => {
    window.fetch = mockFetch;

    const pdfManager = new PDFManager();

    // Initial load
    setMockResponse('./pdfs/metadata/manifest.json', {
        data: { version: '1.0', files: [{ filename: 'test1.pdf' }] }
    });
    setMockResponse('./pdfs/test1.pdf', { ok: true });

    await pdfManager.loadPDFList();
    testFramework.assertEqual(pdfManager.getPDFCount(), 1);

    // Update mock for refresh
    setMockResponse('./pdfs/metadata/manifest.json', {
        data: {
            version: '1.0',
            files: [
                { filename: 'test1.pdf' },
                { filename: 'test2.pdf' }
            ]
        }
    });
    setMockResponse('./pdfs/test2.pdf', { ok: true });

    await pdfManager.refreshPDFList();
    testFramework.assertEqual(pdfManager.getPDFCount(), 2);

    window.fetch = originalFetch;
    clearMockResponses();
});

// Test: getPDFMetadata with existing metadata file
testFramework.test('getPDFMetadata loads existing metadata', async () => {
    window.fetch = mockFetch;

    const pdfManager = new PDFManager();

    // Mock metadata file response
    setMockResponse('./pdfs/metadata/sample-document.json', {
        data: {
            title: 'Sample Document',
            description: 'Test description',
            tags: ['sample', 'test'],
            featured: true
        }
    });

    const metadata = await pdfManager.getPDFMetadata('sample-document.pdf');

    testFramework.assertNotNull(metadata);
    testFramework.assertEqual(metadata.title, 'Sample Document');
    testFramework.assertEqual(metadata.description, 'Test description');
    testFramework.assert(Array.isArray(metadata.tags));
    testFramework.assertTrue(metadata.featured);

    window.fetch = originalFetch;
    clearMockResponses();
});

// Test: getPDFMetadata generates default metadata
testFramework.test('getPDFMetadata generates default metadata for missing file', async () => {
    window.fetch = mockFetch;

    const pdfManager = new PDFManager();
    // Don't set mock response for metadata file (will return 404)

    const metadata = await pdfManager.getPDFMetadata('non-existent.pdf');

    testFramework.assertNotNull(metadata);
    testFramework.assertEqual(metadata.title, 'Non Existent');
    testFramework.assertEqual(metadata.description, '');
    testFramework.assert(Array.isArray(metadata.tags));
    testFramework.assertEqual(metadata.tags.length, 0);
    testFramework.assertFalse(metadata.featured);

    window.fetch = originalFetch;
    clearMockResponses();
});

// Test: generateTitleFromFilename
testFramework.test('generateTitleFromFilename creates proper titles', () => {
    const pdfManager = new PDFManager();

    testFramework.assertEqual(
        pdfManager.generateTitleFromFilename('my-document.pdf'),
        'My Document'
    );
    testFramework.assertEqual(
        pdfManager.generateTitleFromFilename('user_guide.pdf'),
        'User Guide'
    );
    testFramework.assertEqual(
        pdfManager.generateTitleFromFilename('technical-specification-v2.pdf'),
        'Technical Specification V2'
    );
});

// Test: validateAndNormalizeMetadata with valid data
testFramework.test('validateAndNormalizeMetadata processes valid metadata', async () => {
    const pdfManager = new PDFManager();

    const validMetadata = {
        title: 'Test Document',
        description: 'Test description',
        tags: ['tag1', 'tag2'],
        fileSize: 1024,
        pageCount: 5,
        featured: true
    };

    const normalized = await pdfManager.validateAndNormalizeMetadata(validMetadata, 'test.pdf');

    testFramework.assertEqual(normalized.title, 'Test Document');
    testFramework.assertEqual(normalized.description, 'Test description');
    testFramework.assert(Array.isArray(normalized.tags));
    testFramework.assertEqual(normalized.tags.length, 2);
    testFramework.assertEqual(normalized.fileSize, 1024);
    testFramework.assertEqual(normalized.pageCount, 5);
    testFramework.assertTrue(normalized.featured);
});

// Test: validateAndNormalizeMetadata with invalid data
testFramework.test('validateAndNormalizeMetadata handles invalid data', async () => {
    const pdfManager = new PDFManager();

    const invalidMetadata = {
        title: 'Valid Title',
        tags: 'not-an-array',
        fileSize: -1,
        pageCount: 0
    };

    const normalized = await pdfManager.validateAndNormalizeMetadata(invalidMetadata, 'test.pdf');

    testFramework.assertEqual(normalized.title, 'Valid Title');
    testFramework.assert(Array.isArray(normalized.tags));
    testFramework.assertEqual(normalized.tags.length, 0);
    testFramework.assertEqual(normalized.fileSize, null);
    testFramework.assertEqual(normalized.pageCount, null);
});

// Test: metadata caching
testFramework.test('metadata caching works correctly', async () => {
    window.fetch = mockFetch;

    const pdfManager = new PDFManager();

    setMockResponse('./pdfs/metadata/test.json', {
        data: { title: 'Cached Document' }
    });

    // First call should fetch from server
    const metadata1 = await pdfManager.getPDFMetadata('test.pdf');
    testFramework.assertEqual(metadata1.title, 'Cached Document');

    // Clear mock responses to ensure second call uses cache
    clearMockResponses();

    // Second call should use cache
    const metadata2 = await pdfManager.getPDFMetadata('test.pdf');
    testFramework.assertEqual(metadata2.title, 'Cached Document');

    window.fetch = originalFetch;
    clearMockResponses();
});

// Test: getAllMetadata
testFramework.test('getAllMetadata loads all PDF metadata', async () => {
    window.fetch = mockFetch;

    const pdfManager = new PDFManager();

    // Mock manifest with multiple PDFs
    setMockResponse('./pdfs/metadata/manifest.json', {
        data: {
            version: '1.0',
            files: [
                { filename: 'doc1.pdf' },
                { filename: 'doc2.pdf' }
            ]
        }
    });

    // Mock PDF existence checks
    setMockResponse('./pdfs/doc1.pdf', { ok: true });
    setMockResponse('./pdfs/doc2.pdf', { ok: true });

    // Mock metadata files
    setMockResponse('./pdfs/metadata/doc1.json', {
        data: { title: 'Document 1', tags: ['tag1'] }
    });
    setMockResponse('./pdfs/metadata/doc2.json', {
        data: { title: 'Document 2', tags: ['tag2'] }
    });

    await pdfManager.loadPDFList();
    const allMetadata = await pdfManager.getAllMetadata();

    testFramework.assertEqual(allMetadata.length, 2);
    testFramework.assertEqual(allMetadata[0].title, 'Document 1');
    testFramework.assertEqual(allMetadata[1].title, 'Document 2');

    window.fetch = originalFetch;
    clearMockResponses();
});

// Test: error handling in loadPDFList
testFramework.test('loadPDFList handles network errors gracefully', async () => {
    window.fetch = mockFetch;

    const pdfManager = new PDFManager();

    // Mock server error
    setMockResponse('./pdfs/metadata/manifest.json', {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
    });

    try {
        await pdfManager.loadPDFList();
        testFramework.assert(false, 'Should have thrown an error');
    } catch (error) {
        testFramework.assert(error.message.includes('PDF list loading failed'));
    }

    window.fetch = originalFetch;
    clearMockResponses();
});

// Test: validatePDF with File object
testFramework.test('validatePDF works with File objects', async () => {
    const pdfManager = new PDFManager();

    // Create mock File with valid PDF header
    const pdfContent = '%PDF-1.4\nSome PDF content here...';
    const encoder = new TextEncoder();
    const pdfBytes = encoder.encode(pdfContent);
    
    const mockFile = new File([pdfBytes], 'test.pdf', { type: 'application/pdf' });

    const result = await pdfManager.validatePDF(mockFile);
    testFramework.assertTrue(result);
});

// Test: validatePDF with too small file
testFramework.test('validatePDF rejects files that are too small', async () => {
    const pdfManager = new PDFManager();

    // Create very small file
    const smallContent = 'tiny';
    const encoder = new TextEncoder();
    const smallBytes = encoder.encode(smallContent);
    
    const mockFile = new File([smallBytes], 'tiny.pdf', { type: 'application/pdf' });

    const result = await pdfManager.validatePDF(mockFile);
    testFramework.assertFalse(result);
});

// Test: validateAndNormalizeMetadata with missing title
testFramework.test('validateAndNormalizeMetadata handles missing title', async () => {
    const pdfManager = new PDFManager();

    const metadataWithoutTitle = {
        description: 'Test description',
        tags: ['test']
    };

    try {
        await pdfManager.validateAndNormalizeMetadata(metadataWithoutTitle, 'test.pdf');
        testFramework.assert(false, 'Should have thrown an error for missing title');
    } catch (error) {
        testFramework.assert(error.message.includes('Title is required'));
    }
});

// Test: validateAndNormalizeMetadata with invalid date
testFramework.test('validateAndNormalizeMetadata handles invalid dates', async () => {
    const pdfManager = new PDFManager();

    const metadataWithInvalidDate = {
        title: 'Test Document',
        uploadDate: 'not-a-date'
    };

    const normalized = await pdfManager.validateAndNormalizeMetadata(metadataWithInvalidDate, 'test.pdf');
    
    // Should have corrected the invalid date
    const date = new Date(normalized.uploadDate);
    testFramework.assert(!isNaN(date.getTime()), 'Should have valid date after normalization');
});

// Test: concurrent loadPDFList calls
testFramework.test('concurrent loadPDFList calls are handled correctly', async () => {
    window.fetch = mockFetch;

    const pdfManager = new PDFManager();

    setMockResponse('./pdfs/metadata/manifest.json', {
        data: { version: '1.0', files: [] }
    });

    // Start multiple concurrent loads
    const promise1 = pdfManager.loadPDFList();
    const promise2 = pdfManager.loadPDFList();
    const promise3 = pdfManager.loadPDFList();

    const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

    // All should return the same result
    testFramework.assertEqual(result1.length, 0);
    testFramework.assertEqual(result2.length, 0);
    testFramework.assertEqual(result3.length, 0);

    window.fetch = originalFetch;
    clearMockResponses();
});

// Test: clearMetadataCache
testFramework.test('clearMetadataCache clears the cache', async () => {
    const pdfManager = new PDFManager();

    // Add something to cache
    pdfManager.metadataCache.set('test', { title: 'Test' });
    testFramework.assertEqual(pdfManager.metadataCache.size, 1);

    // Clear cache
    pdfManager.clearMetadataCache();
    testFramework.assertEqual(pdfManager.metadataCache.size, 0);
});

// Export for use in browser
if (typeof window !== 'undefined') {
    window.PDFManagerTests = {
        run: () => testFramework.runAll(),
        framework: testFramework
    };
}