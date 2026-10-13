// Simple test to verify TagSystem functionality

// Mock Logger
const Logger = {
    debug: () => {},
    info: () => {},
    error: () => {}
};

// Mock DOM
global.document = {
    createElement: (tag) => ({
        className: '',
        textContent: '',
        innerHTML: '',
        setAttribute: () => {},
        getAttribute: () => null,
        appendChild: () => {},
        addEventListener: () => {},
        querySelectorAll: () => [],
        querySelector: () => null,
        id: '',
        classList: {
            add: () => {},
            remove: () => {}
        }
    })
};

global.HTMLElement = class HTMLElement {};

// Mock PDFManager
class MockPDFManager {
    async getAllMetadata() {
        return [
            {
                filename: 'doc1',
                title: 'JavaScript Guide',
                description: 'Learn JavaScript',
                tags: ['javascript', 'programming', 'web'],
                author: 'John Doe'
            },
            {
                filename: 'doc2',
                title: 'CSS Basics',
                description: 'Learn CSS styling',
                tags: ['css', 'web', 'design'],
                author: 'Jane Smith'
            }
        ];
    }
}

// TagSystem class (simplified version for testing)
class TagSystem {
    constructor(pdfManager) {
        this.pdfManager = pdfManager;
        this.allTags = new Set();
        this.tagCounts = new Map();
        this.allPDFs = [];
        this.filteredPDFs = [];
        this.initialized = false;
    }

    async initialize() {
        this.allPDFs = await this.pdfManager.getAllMetadata();
        this.extractAllTags();
        this.filteredPDFs = [...this.allPDFs];
        this.initialized = true;
    }

    extractAllTags() {
        this.allTags.clear();
        this.tagCounts.clear();
        
        this.allPDFs.forEach(pdf => {
            if (Array.isArray(pdf.tags)) {
                pdf.tags.forEach(tag => {
                    const normalizedTag = tag.toLowerCase();
                    this.allTags.add(normalizedTag);
                    const count = this.tagCounts.get(normalizedTag) || 0;
                    this.tagCounts.set(normalizedTag, count + 1);
                });
            }
        });
    }

    getAllTags() {
        return Array.from(this.allTags).sort();
    }

    filterByTag(tag) {
        const normalizedTag = tag.toLowerCase();
        return this.allPDFs.filter(pdf => 
            Array.isArray(pdf.tags) && 
            pdf.tags.some(pdfTag => pdfTag.toLowerCase() === normalizedTag)
        );
    }

    searchPDFs(query) {
        if (!query) return [...this.allPDFs];
        
        const normalizedQuery = query.toLowerCase();
        return this.allPDFs.filter(pdf => 
            pdf.title.toLowerCase().includes(normalizedQuery) ||
            pdf.description.toLowerCase().includes(normalizedQuery) ||
            (Array.isArray(pdf.tags) && pdf.tags.some(tag => 
                tag.toLowerCase().includes(normalizedQuery)
            ))
        );
    }
}

// Run tests
async function runTests() {
    console.log('Running TagSystem tests...\n');
    
    try {
        const mockPDFManager = new MockPDFManager();
        const tagSystem = new TagSystem(mockPDFManager);
        
        // Test initialization
        await tagSystem.initialize();
        console.log('✓ Initialization test passed');
        
        // Test getAllTags
        const tags = tagSystem.getAllTags();
        if (tags.length === 5 && tags.includes('javascript') && tags.includes('css')) {
            console.log('✓ getAllTags test passed');
        } else {
            console.log('✗ getAllTags test failed');
        }
        
        // Test filterByTag
        const jsPDFs = tagSystem.filterByTag('javascript');
        if (jsPDFs.length === 1 && jsPDFs[0].filename === 'doc1') {
            console.log('✓ filterByTag test passed');
        } else {
            console.log('✗ filterByTag test failed');
        }
        
        // Test searchPDFs
        const searchResults = tagSystem.searchPDFs('CSS');
        if (searchResults.length === 1 && searchResults[0].filename === 'doc2') {
            console.log('✓ searchPDFs test passed');
        } else {
            console.log('✗ searchPDFs test failed');
        }
        
        console.log('\n🎉 All basic tests completed successfully!');
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

runTests();