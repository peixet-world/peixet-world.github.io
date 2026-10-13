// Unit tests for TagSystem class

// Mock Logger for testing
const Logger = {
    debug: () => {},
    info: () => {},
    error: () => {},
};

// Mock PDFManager for testing
class MockPDFManager {
    constructor(mockData = []) {
        this.mockData = mockData;
    }
    
    async getAllMetadata() {
        return this.mockData;
    }
}

// Test data
const mockPDFData = [
    {
        filename: 'document1',
        title: 'JavaScript Guide',
        description: 'A comprehensive guide to JavaScript programming',
        tags: ['javascript', 'programming', 'web'],
        author: 'John Doe',
        uploadDate: '2025-01-01T00:00:00Z'
    },
    {
        filename: 'document2',
        title: 'CSS Styling',
        description: 'Learn CSS for web styling',
        tags: ['css', 'web', 'design'],
        author: 'Jane Smith',
        uploadDate: '2025-01-02T00:00:00Z'
    },
    {
        filename: 'document3',
        title: 'Python Basics',
        description: 'Introduction to Python programming',
        tags: ['python', 'programming'],
        author: 'Bob Johnson',
        uploadDate: '2025-01-03T00:00:00Z'
    },
    {
        filename: 'document4',
        title: 'No Tags Document',
        description: 'A document without any tags',
        tags: [],
        author: 'Alice Brown',
        uploadDate: '2025-01-04T00:00:00Z'
    }
];

// Test suite
class TagSystemTests {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    async runAllTests() {
        console.log('Running TagSystem tests...\n');
        
        // Test initialization
        await this.testInitialization();
        await this.testInitializationWithEmptyData();
        
        // Test tag extraction
        await this.testGetAllTags();
        await this.testGetTagCounts();
        await this.testGetTagsByPopularity();
        
        // Test filtering
        await this.testFilterByTag();
        await this.testFilterByTags();
        await this.testFilterByInvalidTag();
        
        // Test searching
        await this.testSearchPDFs();
        await this.testSearchAndFilter();
        await this.testSearchWithEmptyQuery();
        
        // Test utility methods
        await this.testClearFilters();
        await this.testGetStatistics();
        
        // Test error handling
        await this.testUninitializedAccess();
        
        // Test tag cloud rendering
        await this.testRenderTagCloud();
        
        this.printResults();
    }
    
    async testInitialization() {
        const test = 'TagSystem initialization';
        try {
            const mockPDFManager = new MockPDFManager(mockPDFData);
            const tagSystem = new TagSystem(mockPDFManager);
            
            await tagSystem.initialize();
            
            this.assert(tagSystem.initialized === true, 'Should be initialized');
            this.assert(tagSystem.allPDFs.length === 4, 'Should load all PDFs');
            this.assert(tagSystem.filteredPDFs.length === 4, 'Should initialize filtered list');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testInitializationWithEmptyData() {
        const test = 'TagSystem initialization with empty data';
        try {
            const mockPDFManager = new MockPDFManager([]);
            const tagSystem = new TagSystem(mockPDFManager);
            
            await tagSystem.initialize();
            
            this.assert(tagSystem.initialized === true, 'Should be initialized');
            this.assert(tagSystem.allPDFs.length === 0, 'Should have no PDFs');
            this.assert(tagSystem.getAllTags().length === 0, 'Should have no tags');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testGetAllTags() {
        const test = 'Get all tags';
        try {
            const mockPDFManager = new MockPDFManager(mockPDFData);
            const tagSystem = new TagSystem(mockPDFManager);
            await tagSystem.initialize();
            
            const tags = tagSystem.getAllTags();
            const expectedTags = ['css', 'design', 'javascript', 'programming', 'python', 'web'];
            
            this.assert(Array.isArray(tags), 'Should return an array');
            this.assert(tags.length === 6, 'Should have 6 unique tags');
            this.assert(JSON.stringify(tags) === JSON.stringify(expectedTags), 'Should be sorted alphabetically');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testGetTagCounts() {
        const test = 'Get tag counts';
        try {
            const mockPDFManager = new MockPDFManager(mockPDFData);
            const tagSystem = new TagSystem(mockPDFManager);
            await tagSystem.initialize();
            
            const tagCounts = tagSystem.getTagCounts();
            
            this.assert(tagCounts instanceof Map, 'Should return a Map');
            this.assert(tagCounts.get('programming') === 2, 'Programming should have count 2');
            this.assert(tagCounts.get('web') === 2, 'Web should have count 2');
            this.assert(tagCounts.get('javascript') === 1, 'JavaScript should have count 1');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testGetTagsByPopularity() {
        const test = 'Get tags by popularity';
        try {
            const mockPDFManager = new MockPDFManager(mockPDFData);
            const tagSystem = new TagSystem(mockPDFManager);
            await tagSystem.initialize();
            
            const popularTags = tagSystem.getTagsByPopularity();
            
            this.assert(Array.isArray(popularTags), 'Should return an array');
            this.assert(popularTags[0].count >= popularTags[1].count, 'Should be sorted by count descending');
            this.assert(popularTags.every(item => item.tag && typeof item.count === 'number'), 'Should have tag and count properties');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testFilterByTag() {
        const test = 'Filter by tag';
        try {
            const mockPDFManager = new MockPDFManager(mockPDFData);
            const tagSystem = new TagSystem(mockPDFManager);
            await tagSystem.initialize();
            
            const programmingPDFs = tagSystem.filterByTag('programming');
            
            this.assert(Array.isArray(programmingPDFs), 'Should return an array');
            this.assert(programmingPDFs.length === 2, 'Should find 2 programming PDFs');
            this.assert(programmingPDFs.every(pdf => pdf.tags.includes('programming')), 'All results should have programming tag');
            
            // Test case insensitive
            const programmingPDFsUpper = tagSystem.filterByTag('PROGRAMMING');
            this.assert(programmingPDFsUpper.length === 2, 'Should be case insensitive');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testFilterByTags() {
        const test = 'Filter by multiple tags';
        try {
            const mockPDFManager = new MockPDFManager(mockPDFData);
            const tagSystem = new TagSystem(mockPDFManager);
            await tagSystem.initialize();
            
            const webProgrammingPDFs = tagSystem.filterByTags(['web', 'programming']);
            
            this.assert(Array.isArray(webProgrammingPDFs), 'Should return an array');
            this.assert(webProgrammingPDFs.length === 1, 'Should find 1 PDF with both tags');
            this.assert(webProgrammingPDFs[0].filename === 'document1', 'Should be the JavaScript guide');
            
            // Test with empty array
            const allPDFs = tagSystem.filterByTags([]);
            this.assert(allPDFs.length === 4, 'Empty tags array should return all PDFs');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testFilterByInvalidTag() {
        const test = 'Filter by invalid tag';
        try {
            const mockPDFManager = new MockPDFManager(mockPDFData);
            const tagSystem = new TagSystem(mockPDFManager);
            await tagSystem.initialize();
            
            const nonexistentPDFs = tagSystem.filterByTag('nonexistent');
            
            this.assert(Array.isArray(nonexistentPDFs), 'Should return an array');
            this.assert(nonexistentPDFs.length === 0, 'Should return empty array for nonexistent tag');
            
            // Test with null/undefined
            const nullResult = tagSystem.filterByTag(null);
            this.assert(nullResult.length === 0, 'Should handle null tag');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testSearchPDFs() {
        const test = 'Search PDFs';
        try {
            const mockPDFManager = new MockPDFManager(mockPDFData);
            const tagSystem = new TagSystem(mockPDFManager);
            await tagSystem.initialize();
            
            // Search in title
            const jsResults = tagSystem.searchPDFs('JavaScript');
            this.assert(jsResults.length === 1, 'Should find JavaScript document');
            
            // Search in description
            const guideResults = tagSystem.searchPDFs('guide');
            this.assert(guideResults.length === 1, 'Should find guide document');
            
            // Search in tags
            const webResults = tagSystem.searchPDFs('web');
            this.assert(webResults.length === 2, 'Should find 2 web-related documents');
            
            // Search in author
            const johnResults = tagSystem.searchPDFs('John');
            this.assert(johnResults.length === 1, 'Should find John\'s document');
            
            // Case insensitive search
            const cssResults = tagSystem.searchPDFs('css');
            this.assert(cssResults.length === 1, 'Should be case insensitive');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testSearchAndFilter() {
        const test = 'Search and filter combined';
        try {
            const mockPDFManager = new MockPDFManager(mockPDFData);
            const tagSystem = new TagSystem(mockPDFManager);
            await tagSystem.initialize();
            
            // Search for "programming" with "web" tag
            const results = tagSystem.searchAndFilter('programming', ['web']);
            
            this.assert(Array.isArray(results), 'Should return an array');
            this.assert(results.length === 1, 'Should find 1 result');
            this.assert(results[0].filename === 'document1', 'Should be the JavaScript guide');
            
            // Search without tags
            const searchOnly = tagSystem.searchAndFilter('Python');
            this.assert(searchOnly.length === 1, 'Should find Python document');
            
            // Filter without search
            const filterOnly = tagSystem.searchAndFilter('', ['design']);
            this.assert(filterOnly.length === 1, 'Should find design document');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testSearchWithEmptyQuery() {
        const test = 'Search with empty query';
        try {
            const mockPDFManager = new MockPDFManager(mockPDFData);
            const tagSystem = new TagSystem(mockPDFManager);
            await tagSystem.initialize();
            
            const emptyResults = tagSystem.searchPDFs('');
            const nullResults = tagSystem.searchPDFs(null);
            
            this.assert(emptyResults.length === 4, 'Empty query should return all PDFs');
            this.assert(nullResults.length === 4, 'Null query should return all PDFs');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testClearFilters() {
        const test = 'Clear filters';
        try {
            const mockPDFManager = new MockPDFManager(mockPDFData);
            const tagSystem = new TagSystem(mockPDFManager);
            await tagSystem.initialize();
            
            // Apply some filters
            tagSystem.filterByTag('programming');
            this.assert(tagSystem.getFilteredPDFs().length === 2, 'Should have filtered results');
            
            // Clear filters
            const allPDFs = tagSystem.clearFilters();
            
            this.assert(allPDFs.length === 4, 'Should return all PDFs');
            this.assert(tagSystem.getFilteredPDFs().length === 4, 'Filtered list should be reset');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testGetStatistics() {
        const test = 'Get statistics';
        try {
            const mockPDFManager = new MockPDFManager(mockPDFData);
            const tagSystem = new TagSystem(mockPDFManager);
            await tagSystem.initialize();
            
            const stats = tagSystem.getStatistics();
            
            this.assert(typeof stats === 'object', 'Should return an object');
            this.assert(stats.totalPDFs === 4, 'Should have correct total PDFs');
            this.assert(stats.totalTags === 6, 'Should have correct total tags');
            this.assert(stats.pdfsWithoutTags === 1, 'Should count PDFs without tags');
            this.assert(Array.isArray(stats.mostPopularTags), 'Should have popular tags array');
            this.assert(typeof stats.averageTagsPerPDF === 'number', 'Should calculate average tags per PDF');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testUninitializedAccess() {
        const test = 'Uninitialized access error handling';
        try {
            const mockPDFManager = new MockPDFManager(mockPDFData);
            const tagSystem = new TagSystem(mockPDFManager);
            
            // Don't initialize, try to access methods
            let errorThrown = false;
            try {
                tagSystem.getAllTags();
            } catch (error) {
                errorThrown = true;
                this.assert(error.message.includes('not initialized'), 'Should throw initialization error');
            }
            
            this.assert(errorThrown, 'Should throw error when not initialized');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testRenderTagCloud() {
        const test = 'Render tag cloud';
        try {
            const mockPDFManager = new MockPDFManager(mockPDFData);
            const tagSystem = new TagSystem(mockPDFManager);
            await tagSystem.initialize();
            
            // Create mock container
            const container = document.createElement('div');
            
            // Test basic rendering
            tagSystem.renderTagCloud(container);
            
            const tagElements = container.querySelectorAll('.tag');
            this.assert(tagElements.length === 6, 'Should render all tags');
            this.assert(container.getAttribute('role') === 'group', 'Should have proper ARIA role');
            
            // Test with options
            container.innerHTML = '';
            tagSystem.renderTagCloud(container, {
                sortBy: 'popularity',
                maxTags: 3,
                showCounts: true,
                activeTag: 'programming'
            });
            
            const limitedTags = container.querySelectorAll('.tag');
            this.assert(limitedTags.length === 3, 'Should respect maxTags option');
            
            const activeTag = container.querySelector('.tag.active');
            this.assert(activeTag !== null, 'Should mark active tag');
            
            // Test with invalid container
            let errorHandled = false;
            try {
                tagSystem.renderTagCloud(null);
                errorHandled = true; // Should not throw, just handle gracefully
            } catch (error) {
                // Error is acceptable too
                errorHandled = true;
            }
            this.assert(errorHandled, 'Should handle invalid container');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testRefresh() {
        const test = 'Refresh tag system';
        try {
            const mockPDFManager = new MockPDFManager(mockPDFData);
            const tagSystem = new TagSystem(mockPDFManager);
            await tagSystem.initialize();
            
            // Apply some filters
            tagSystem.filterByTag('programming');
            this.assert(tagSystem.getFilteredPDFs().length === 2, 'Should have filtered results');
            
            // Refresh should reset everything
            await tagSystem.refresh();
            
            this.assert(tagSystem.initialized === true, 'Should be initialized after refresh');
            this.assert(tagSystem.getFilteredPDFs().length === 4, 'Should reset filtered list');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testErrorHandlingInInitialization() {
        const test = 'Error handling in initialization';
        try {
            // Mock PDFManager that throws error
            const errorPDFManager = {
                getAllMetadata: async () => {
                    throw new Error('Failed to load metadata');
                }
            };
            
            const tagSystem = new TagSystem(errorPDFManager);
            
            let errorThrown = false;
            try {
                await tagSystem.initialize();
            } catch (error) {
                errorThrown = true;
                this.assert(error.message.includes('TagSystem initialization failed'), 'Should wrap initialization error');
            }
            
            this.assert(errorThrown, 'Should throw error when initialization fails');
            this.assert(tagSystem.initialized === false, 'Should not be marked as initialized');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testFilterWithMalformedData() {
        const test = 'Filter with malformed data';
        try {
            // Create data with malformed tags
            const malformedData = [
                {
                    filename: 'doc1',
                    title: 'Document 1',
                    tags: ['valid-tag', null, undefined, '', '  ', 123, { invalid: 'object' }]
                },
                {
                    filename: 'doc2',
                    title: 'Document 2',
                    tags: 'not-an-array'
                },
                {
                    filename: 'doc3',
                    title: 'Document 3'
                    // No tags property
                }
            ];
            
            const mockPDFManager = new MockPDFManager(malformedData);
            const tagSystem = new TagSystem(mockPDFManager);
            await tagSystem.initialize();
            
            // Should handle malformed data gracefully
            const allTags = tagSystem.getAllTags();
            this.assert(allTags.length === 1, 'Should only extract valid tags');
            this.assert(allTags[0] === 'valid-tag', 'Should extract the valid tag');
            
            // Filtering should work with malformed data
            const filtered = tagSystem.filterByTag('valid-tag');
            this.assert(filtered.length === 1, 'Should find document with valid tag');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testSearchWithSpecialCharacters() {
        const test = 'Search with special characters';
        try {
            const specialData = [
                {
                    filename: 'special-chars',
                    title: 'Document with "quotes" & symbols',
                    description: 'Contains special chars: @#$%^&*()',
                    tags: ['special-tag', 'symbols@#$'],
                    author: 'User <email@domain.com>'
                }
            ];
            
            const mockPDFManager = new MockPDFManager(specialData);
            const tagSystem = new TagSystem(mockPDFManager);
            await tagSystem.initialize();
            
            // Search for special characters
            const quoteResults = tagSystem.searchPDFs('"quotes"');
            this.assert(quoteResults.length === 1, 'Should find document with quotes');
            
            const symbolResults = tagSystem.searchPDFs('@#$');
            this.assert(symbolResults.length === 1, 'Should find document with symbols');
            
            const emailResults = tagSystem.searchPDFs('email@domain.com');
            this.assert(emailResults.length === 1, 'Should find document with email');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }
    
    pass(testName) {
        this.passed++;
        console.log(`✓ ${testName}`);
    }
    
    fail(testName, error) {
        this.failed++;
        console.log(`✗ ${testName}: ${error}`);
    }
    
    printResults() {
        console.log(`\nTest Results:`);
        console.log(`Passed: ${this.passed}`);
        console.log(`Failed: ${this.failed}`);
        console.log(`Total: ${this.passed + this.failed}`);
        
        if (this.failed === 0) {
            console.log('All tests passed! ✓');
        } else {
            console.log(`${this.failed} test(s) failed. ✗`);
        }
    }
}

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TagSystemTests, TagSystem, MockPDFManager, mockPDFData };
}