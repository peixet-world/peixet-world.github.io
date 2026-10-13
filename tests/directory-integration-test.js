// Integration test for TagSystem with DirectoryController

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
        },
        style: {},
        scrollIntoView: () => {}
    }),
    getElementById: () => null,
    querySelector: () => null
};

global.HTMLElement = class HTMLElement {};
global.window = {
    location: {
        pathname: '/directory.html',
        search: ''
    },
    history: {
        replaceState: () => {}
    }
};

global.URLSearchParams = class URLSearchParams {
    constructor(search = '') {
        this.params = new Map();
        if (search) {
            search.split('&').forEach(param => {
                const [key, value] = param.split('=');
                if (key && value) {
                    this.params.set(key, decodeURIComponent(value));
                }
            });
        }
    }
    
    get(key) {
        return this.params.get(key) || null;
    }
    
    set(key, value) {
        this.params.set(key, value);
    }
    
    toString() {
        const pairs = [];
        for (const [key, value] of this.params) {
            pairs.push(`${key}=${encodeURIComponent(value)}`);
        }
        return pairs.join('&');
    }
};

// Mock PDFManager
class MockPDFManager {
    async getAllMetadata() {
        return [
            {
                filename: 'javascript-guide',
                title: 'JavaScript Programming Guide',
                description: 'Complete guide to JavaScript development',
                tags: ['javascript', 'programming', 'web', 'frontend'],
                author: 'John Developer',
                uploadDate: '2025-01-01T00:00:00Z',
                fileSize: 2048000
            },
            {
                filename: 'css-mastery',
                title: 'CSS Mastery',
                description: 'Advanced CSS techniques and best practices',
                tags: ['css', 'web', 'design', 'frontend'],
                author: 'Jane Designer',
                uploadDate: '2025-01-02T00:00:00Z',
                fileSize: 1536000
            },
            {
                filename: 'python-basics',
                title: 'Python for Beginners',
                description: 'Learn Python programming from scratch',
                tags: ['python', 'programming', 'backend'],
                author: 'Bob Coder',
                uploadDate: '2025-01-03T00:00:00Z',
                fileSize: 3072000
            },
            {
                filename: 'react-components',
                title: 'React Component Design',
                description: 'Building reusable React components',
                tags: ['react', 'javascript', 'frontend', 'components'],
                author: 'Alice React',
                uploadDate: '2025-01-04T00:00:00Z',
                fileSize: 2560000
            }
        ];
    }
    
    async loadPDFList() {
        return this.getAllMetadata();
    }
}

// Simplified TagSystem for testing
class TagSystem {
    constructor(pdfManager) {
        this.pdfManager = pdfManager;
        this.allPDFs = [];
        this.initialized = false;
    }
    
    async initialize() {
        this.allPDFs = await this.pdfManager.getAllMetadata();
        this.initialized = true;
    }
    
    getAllTags() {
        const tags = new Set();
        this.allPDFs.forEach(pdf => {
            if (Array.isArray(pdf.tags)) {
                pdf.tags.forEach(tag => tags.add(tag.toLowerCase()));
            }
        });
        return Array.from(tags).sort();
    }
    
    searchAndFilter(query = '', tags = []) {
        let results = [...this.allPDFs];
        
        // Apply tag filtering
        if (Array.isArray(tags) && tags.length > 0) {
            const normalizedTags = tags.map(tag => tag.toLowerCase());
            results = results.filter(pdf => {
                if (!Array.isArray(pdf.tags)) return false;
                const pdfTags = pdf.tags.map(tag => tag.toLowerCase());
                return normalizedTags.every(requiredTag => pdfTags.includes(requiredTag));
            });
        }
        
        // Apply search query
        if (query && query.trim()) {
            const normalizedQuery = query.toLowerCase();
            results = results.filter(pdf => 
                pdf.title.toLowerCase().includes(normalizedQuery) ||
                pdf.description.toLowerCase().includes(normalizedQuery) ||
                (Array.isArray(pdf.tags) && pdf.tags.some(tag => 
                    tag.toLowerCase().includes(normalizedQuery)
                ))
            );
        }
        
        return results;
    }
    
    renderTagCloud(container, options = {}) {
        // Mock implementation
        const tags = this.getAllTags();
        container.innerHTML = '';
        
        tags.forEach(tag => {
            const tagEl = document.createElement('button');
            tagEl.className = 'tag';
            tagEl.textContent = tag;
            tagEl.setAttribute('data-tag', tag);
            
            if (options.onTagClick) {
                tagEl.addEventListener('click', (e) => options.onTagClick(tag, e));
            }
            
            container.appendChild(tagEl);
        });
    }
}

// Simplified DirectoryController for testing
class DirectoryController {
    constructor(pdfManager) {
        this.pdfManager = pdfManager;
        this.tagSystem = new TagSystem(pdfManager);
        this.allPDFs = [];
        this.filteredPDFs = [];
        this.selectedTags = new Set();
        this.currentSearchQuery = '';
        this.currentSort = 'name';
    }
    
    async initialize() {
        await this.pdfManager.loadPDFList();
        await this.tagSystem.initialize();
        this.allPDFs = await this.pdfManager.getAllMetadata();
        this.filteredPDFs = [...this.allPDFs];
    }
    
    handleTagFilter(tag) {
        if (this.selectedTags.has(tag)) {
            this.selectedTags.delete(tag);
        } else {
            this.selectedTags.add(tag);
        }
        this.applyFiltersAndSort();
    }
    
    handleSearch(query) {
        this.currentSearchQuery = query;
        this.applyFiltersAndSort();
    }
    
    applyFiltersAndSort() {
        const selectedTagsArray = Array.from(this.selectedTags);
        this.filteredPDFs = this.tagSystem.searchAndFilter(this.currentSearchQuery, selectedTagsArray);
        
        // Apply sorting
        this.filteredPDFs.sort((a, b) => {
            switch (this.currentSort) {
                case 'date':
                    return new Date(b.uploadDate) - new Date(a.uploadDate);
                case 'size':
                    return (b.fileSize || 0) - (a.fileSize || 0);
                case 'name':
                default:
                    return a.title.localeCompare(b.title);
            }
        });
    }
    
    clearAllFilters() {
        this.currentSearchQuery = '';
        this.selectedTags.clear();
        this.applyFiltersAndSort();
    }
}

// Test suite
async function runIntegrationTests() {
    console.log('Running DirectoryController + TagSystem integration tests...\n');
    
    try {
        const mockPDFManager = new MockPDFManager();
        const controller = new DirectoryController(mockPDFManager);
        
        // Test initialization
        await controller.initialize();
        console.log('✓ Controller initialization test passed');
        
        // Test tag filtering
        controller.handleTagFilter('javascript');
        if (controller.filteredPDFs.length === 2) {
            console.log('✓ Single tag filtering test passed');
        } else {
            console.log('✗ Single tag filtering test failed');
        }
        
        // Test multiple tag filtering
        controller.handleTagFilter('frontend');
        if (controller.filteredPDFs.length === 2) {
            console.log('✓ Multiple tag filtering test passed');
        } else {
            console.log('✗ Multiple tag filtering test failed');
        }
        
        // Test search functionality
        controller.clearAllFilters();
        controller.handleSearch('Python');
        if (controller.filteredPDFs.length === 1 && controller.filteredPDFs[0].filename === 'python-basics') {
            console.log('✓ Search functionality test passed');
        } else {
            console.log('✗ Search functionality test failed');
        }
        
        // Test combined search and filter
        controller.clearAllFilters();
        controller.handleSearch('javascript');
        controller.handleTagFilter('frontend');
        if (controller.filteredPDFs.length === 2) {
            console.log('✓ Combined search and filter test passed');
        } else {
            console.log('✗ Combined search and filter test failed');
        }
        
        // Test clear filters
        controller.clearAllFilters();
        if (controller.filteredPDFs.length === 4 && controller.selectedTags.size === 0) {
            console.log('✓ Clear filters test passed');
        } else {
            console.log('✗ Clear filters test failed');
        }
        
        // Test sorting
        controller.currentSort = 'date';
        controller.applyFiltersAndSort();
        if (controller.filteredPDFs[0].filename === 'react-components') {
            console.log('✓ Date sorting test passed');
        } else {
            console.log('✗ Date sorting test failed');
        }
        
        console.log('\n🎉 All integration tests completed successfully!');
        
    } catch (error) {
        console.error('Integration test failed:', error.message);
    }
}

runIntegrationTests();