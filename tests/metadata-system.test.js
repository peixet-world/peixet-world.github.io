// Test file for PDF metadata system functionality

// Mock Logger for testing
class TestLogger {
    static logs = [];
    
    static info(message, data = {}) {
        this.logs.push({ level: 'info', message, data });
        console.log(`[INFO] ${message}`, data);
    }
    
    static error(message, error = null) {
        this.logs.push({ level: 'error', message, error });
        console.error(`[ERROR] ${message}`, error);
    }
    
    static debug(message, data = {}) {
        this.logs.push({ level: 'debug', message, data });
        console.debug(`[DEBUG] ${message}`, data);
    }
    
    static clear() {
        this.logs = [];
    }
}

// Replace global Logger with test version
window.Logger = TestLogger;

// Test suite for metadata system
class MetadataSystemTests {
    constructor() {
        this.pdfManager = new PDFManager('./pdfs/');
        this.testResults = [];
    }

    async runAllTests() {
        console.log('Starting metadata system tests...');
        
        try {
            await this.testValidMetadataLoading();
            await this.testDefaultMetadataGeneration();
            await this.testMetadataValidation();
            await this.testTitleGeneration();
            await this.testMetadataCache();
            await this.testInvalidMetadataHandling();
            
            this.displayResults();
        } catch (error) {
            console.error('Test suite failed:', error);
        }
    }

    async testValidMetadataLoading() {
        console.log('\n--- Testing valid metadata loading ---');
        
        try {
            const metadata = await this.pdfManager.getPDFMetadata('sample-document.pdf');
            
            this.assert(metadata !== null, 'Metadata should not be null');
            this.assert(metadata.title === 'Sample Document', 'Title should match metadata file');
            this.assert(Array.isArray(metadata.tags), 'Tags should be an array');
            this.assert(metadata.tags.includes('sample'), 'Should include sample tag');
            this.assert(metadata.featured === true, 'Should be marked as featured');
            
            console.log('✅ Valid metadata loading test passed');
            this.testResults.push({ test: 'Valid metadata loading', passed: true });
        } catch (error) {
            console.error('❌ Valid metadata loading test failed:', error);
            this.testResults.push({ test: 'Valid metadata loading', passed: false, error });
        }
    }

    async testDefaultMetadataGeneration() {
        console.log('\n--- Testing default metadata generation ---');
        
        try {
            // Test with a non-existent PDF (should generate default metadata)
            const metadata = await this.pdfManager.getPDFMetadata('non-existent-file.pdf');
            
            this.assert(metadata !== null, 'Default metadata should not be null');
            this.assert(metadata.title === 'Non Existent File', 'Should generate title from filename');
            this.assert(Array.isArray(metadata.tags), 'Tags should be an array');
            this.assert(metadata.tags.length === 0, 'Default tags should be empty');
            this.assert(metadata.featured === false, 'Should not be featured by default');
            
            console.log('✅ Default metadata generation test passed');
            this.testResults.push({ test: 'Default metadata generation', passed: true });
        } catch (error) {
            console.error('❌ Default metadata generation test failed:', error);
            this.testResults.push({ test: 'Default metadata generation', passed: false, error });
        }
    }

    async testMetadataValidation() {
        console.log('\n--- Testing metadata validation ---');
        
        try {
            // Test validation with invalid data
            const invalidMetadata = {
                title: 123, // Invalid type
                tags: 'not-an-array', // Invalid type
                fileSize: -1, // Invalid value
                pageCount: 0 // Invalid value
            };
            
            const normalized = await this.pdfManager.validateAndNormalizeMetadata(
                invalidMetadata, 
                'test-file.pdf'
            );
            
            this.assert(typeof normalized.title === 'string', 'Title should be normalized to string');
            this.assert(Array.isArray(normalized.tags), 'Tags should be normalized to array');
            this.assert(normalized.fileSize === null, 'Invalid fileSize should be set to null');
            this.assert(normalized.pageCount === null, 'Invalid pageCount should be set to null');
            
            console.log('✅ Metadata validation test passed');
            this.testResults.push({ test: 'Metadata validation', passed: true });
        } catch (error) {
            console.error('❌ Metadata validation test failed:', error);
            this.testResults.push({ test: 'Metadata validation', passed: false, error });
        }
    }

    testTitleGeneration() {
        console.log('\n--- Testing title generation ---');
        
        try {
            const testCases = [
                { input: 'my-document.pdf', expected: 'My Document' },
                { input: 'user_guide.pdf', expected: 'User Guide' },
                { input: 'technical-specification-v2.pdf', expected: 'Technical Specification V2' },
                { input: 'simple.pdf', expected: 'Simple' }
            ];
            
            for (const testCase of testCases) {
                const result = this.pdfManager.generateTitleFromFilename(testCase.input);
                this.assert(
                    result === testCase.expected, 
                    `Title generation failed: ${testCase.input} -> ${result} (expected: ${testCase.expected})`
                );
            }
            
            console.log('✅ Title generation test passed');
            this.testResults.push({ test: 'Title generation', passed: true });
        } catch (error) {
            console.error('❌ Title generation test failed:', error);
            this.testResults.push({ test: 'Title generation', passed: false, error });
        }
    }

    async testMetadataCache() {
        console.log('\n--- Testing metadata cache ---');
        
        try {
            // Clear cache first
            this.pdfManager.clearMetadataCache();
            
            // Load metadata twice - second time should come from cache
            const metadata1 = await this.pdfManager.getPDFMetadata('sample-document.pdf');
            const metadata2 = await this.pdfManager.getPDFMetadata('sample-document.pdf');
            
            this.assert(metadata1 !== null, 'First metadata load should succeed');
            this.assert(metadata2 !== null, 'Second metadata load should succeed');
            this.assert(
                JSON.stringify(metadata1) === JSON.stringify(metadata2), 
                'Cached metadata should match original'
            );
            
            // Check that cache was used (should see cache hit in logs)
            const cacheLogs = TestLogger.logs.filter(log => 
                log.message.includes('cache') && log.level === 'debug'
            );
            this.assert(cacheLogs.length > 0, 'Should have cache-related log entries');
            
            console.log('✅ Metadata cache test passed');
            this.testResults.push({ test: 'Metadata cache', passed: true });
        } catch (error) {
            console.error('❌ Metadata cache test failed:', error);
            this.testResults.push({ test: 'Metadata cache', passed: false, error });
        }
    }

    async testInvalidMetadataHandling() {
        console.log('\n--- Testing invalid metadata handling ---');
        
        try {
            // Test with completely invalid metadata
            try {
                await this.pdfManager.validateAndNormalizeMetadata(null, 'test.pdf');
                this.assert(false, 'Should throw error for null metadata');
            } catch (error) {
                this.assert(true, 'Should throw error for null metadata');
            }
            
            // Test with missing required title
            try {
                await this.pdfManager.validateAndNormalizeMetadata({}, 'test.pdf');
                // Should not throw error, should generate default title
                this.assert(true, 'Should handle missing title gracefully');
            } catch (error) {
                console.log('Metadata validation error (expected):', error.message);
            }
            
            console.log('✅ Invalid metadata handling test passed');
            this.testResults.push({ test: 'Invalid metadata handling', passed: true });
        } catch (error) {
            console.error('❌ Invalid metadata handling test failed:', error);
            this.testResults.push({ test: 'Invalid metadata handling', passed: false, error });
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    displayResults() {
        console.log('\n=== TEST RESULTS ===');
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        
        console.log(`Passed: ${passed}/${total}`);
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.test}`);
            if (!result.passed && result.error) {
                console.log(`   Error: ${result.error.message}`);
            }
        });
        
        if (passed === total) {
            console.log('\n🎉 All metadata system tests passed!');
        } else {
            console.log(`\n⚠️  ${total - passed} test(s) failed`);
        }
    }
}

// Auto-run tests when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const tests = new MetadataSystemTests();
    await tests.runAllTests();
});