// PDF Viewer Tests

// Mock Logger for testing
const Logger = {
    debug: () => {},
    info: () => {},
    error: () => {},
};

// Mock PDF.js for testing
const mockPdfjsLib = {
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: (url) => {
        if (url.includes('invalid')) {
            return {
                promise: Promise.reject(new Error('Invalid PDF'))
            };
        }
        if (url.includes('network-error')) {
            return {
                promise: Promise.reject(new Error('Network error'))
            };
        }
        return {
            promise: Promise.resolve({
                numPages: 3,
                getPage: (pageNum) => {
                    if (pageNum < 1 || pageNum > 3) {
                        return Promise.reject(new Error('Invalid page number'));
                    }
                    return Promise.resolve({
                        getViewport: ({ scale }) => ({
                            width: 612 * scale,
                            height: 792 * scale
                        }),
                        render: (context) => {
                            if (context.shouldFail) {
                                return {
                                    promise: Promise.reject(new Error('Render failed'))
                                };
                            }
                            return {
                                promise: Promise.resolve()
                            };
                        }
                    });
                }
            })
        };
    }
};

// Make pdfjsLib available globally for tests
if (typeof window !== 'undefined') {
    window.pdfjsLib = mockPdfjsLib;
} else {
    global.pdfjsLib = mockPdfjsLib;
}

// Test suite for PDFViewer
class PDFViewerTests {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    async runAllTests() {
        console.log('Running PDFViewer tests...\n');
        
        // Basic functionality tests
        await this.testConstructor();
        await this.testLoadPDF();
        await this.testLoadInvalidPDF();
        await this.testRenderPage();
        await this.testPageNavigation();
        await this.testZoomFunctionality();
        await this.testFitToWidth();
        await this.testFitToHeight();
        await this.testErrorHandling();
        await this.testUIUpdates();
        await this.testDownloadURL();
        await this.testConcurrentOperations();
        
        this.printResults();
    }
    
    async testConstructor() {
        const test = 'PDFViewer constructor';
        try {
            const canvas = this.createMockCanvas();
            const pdfViewer = new PDFViewer(canvas);
            
            this.assert(pdfViewer.canvas === canvas, 'Should store canvas reference');
            this.assert(pdfViewer.ctx !== null, 'Should get canvas context');
            this.assert(pdfViewer.currentPage === 1, 'Should initialize current page to 1');
            this.assert(pdfViewer.totalPages === 0, 'Should initialize total pages to 0');
            this.assert(pdfViewer.scale === 1.0, 'Should initialize scale to 1.0');
            this.assert(pdfViewer.pdfDoc === null, 'Should initialize pdfDoc to null');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testLoadPDF() {
        const test = 'Load PDF successfully';
        try {
            const canvas = this.createMockCanvas();
            const pdfViewer = new PDFViewer(canvas);
            
            await pdfViewer.loadPDF('test.pdf');
            
            this.assert(pdfViewer.pdfDoc !== null, 'Should load PDF document');
            this.assert(pdfViewer.totalPages === 3, 'Should set correct total pages');
            this.assert(pdfViewer.currentPage === 1, 'Should start at page 1');
            this.assert(pdfViewer.pdfUrl === 'test.pdf', 'Should store PDF URL');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testLoadInvalidPDF() {
        const test = 'Handle invalid PDF loading';
        try {
            const canvas = this.createMockCanvas();
            const pdfViewer = new PDFViewer(canvas);
            
            let errorThrown = false;
            try {
                await pdfViewer.loadPDF('invalid.pdf');
            } catch (error) {
                errorThrown = true;
                this.assert(error.message.includes('Invalid PDF'), 'Should throw appropriate error');
            }
            
            this.assert(errorThrown, 'Should throw error for invalid PDF');
            this.assert(pdfViewer.pdfDoc === null, 'Should not set pdfDoc on error');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testRenderPage() {
        const test = 'Render PDF page';
        try {
            const canvas = this.createMockCanvas();
            const pdfViewer = new PDFViewer(canvas);
            
            await pdfViewer.loadPDF('test.pdf');
            await pdfViewer.renderPage(2);
            
            this.assert(pdfViewer.currentPage === 2, 'Should update current page');
            this.assert(canvas.width > 0, 'Should set canvas width');
            this.assert(canvas.height > 0, 'Should set canvas height');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testPageNavigation() {
        const test = 'Page navigation';
        try {
            const canvas = this.createMockCanvas();
            const pdfViewer = new PDFViewer(canvas);
            
            await pdfViewer.loadPDF('test.pdf');
            
            // Test next page
            await pdfViewer.nextPage();
            this.assert(pdfViewer.currentPage === 2, 'Should navigate to next page');
            
            // Test previous page
            await pdfViewer.prevPage();
            this.assert(pdfViewer.currentPage === 1, 'Should navigate to previous page');
            
            // Test go to specific page
            await pdfViewer.goToPage(3);
            this.assert(pdfViewer.currentPage === 3, 'Should go to specific page');
            
            // Test boundary conditions
            await pdfViewer.nextPage(); // Should not go beyond last page
            this.assert(pdfViewer.currentPage === 3, 'Should not go beyond last page');
            
            await pdfViewer.goToPage(1);
            await pdfViewer.prevPage(); // Should not go before first page
            this.assert(pdfViewer.currentPage === 1, 'Should not go before first page');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testZoomFunctionality() {
        const test = 'Zoom functionality';
        try {
            const canvas = this.createMockCanvas();
            const pdfViewer = new PDFViewer(canvas);
            
            await pdfViewer.loadPDF('test.pdf');
            
            // Test zoom in
            await pdfViewer.zoomIn();
            this.assert(pdfViewer.scale === 1.25, 'Should zoom in correctly');
            
            // Test zoom out
            await pdfViewer.zoomOut();
            this.assert(pdfViewer.scale === 1.0, 'Should zoom out correctly');
            
            // Test set zoom
            await pdfViewer.setZoom(2.0);
            this.assert(pdfViewer.scale === 2.0, 'Should set zoom level');
            
            // Test zoom limits
            await pdfViewer.setZoom(10.0); // Should be capped
            this.assert(pdfViewer.scale === 5.0, 'Should cap maximum zoom');
            
            await pdfViewer.setZoom(0); // Should be ignored
            this.assert(pdfViewer.scale === 5.0, 'Should ignore invalid zoom');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testFitToWidth() {
        const test = 'Fit to width';
        try {
            const canvas = this.createMockCanvas();
            const pdfViewer = new PDFViewer(canvas);
            
            await pdfViewer.loadPDF('test.pdf');
            await pdfViewer.fitToWidth();
            
            // Should calculate appropriate scale based on container width
            const expectedScale = (800 - 40) / 612; // container width - padding / PDF width
            this.assert(Math.abs(pdfViewer.scale - expectedScale) < 0.01, 'Should fit to width correctly');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testFitToHeight() {
        const test = 'Fit to height';
        try {
            const canvas = this.createMockCanvas();
            const pdfViewer = new PDFViewer(canvas);
            
            await pdfViewer.loadPDF('test.pdf');
            await pdfViewer.fitToHeight();
            
            // Should calculate appropriate scale based on window height
            this.assert(pdfViewer.scale > 0, 'Should set positive scale for fit to height');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testErrorHandling() {
        const test = 'Error handling';
        try {
            const canvas = this.createMockCanvas();
            const pdfViewer = new PDFViewer(canvas);
            
            // Test rendering without loaded PDF
            let errorThrown = false;
            try {
                await pdfViewer.renderPage(1);
            } catch (error) {
                errorThrown = true;
                this.assert(error.message.includes('No PDF document loaded'), 'Should handle no PDF error');
            }
            this.assert(errorThrown, 'Should throw error when no PDF loaded');
            
            // Test invalid page number
            await pdfViewer.loadPDF('test.pdf');
            errorThrown = false;
            try {
                await pdfViewer.renderPage(10);
            } catch (error) {
                errorThrown = true;
                this.assert(error.message.includes('Invalid page number'), 'Should handle invalid page number');
            }
            this.assert(errorThrown, 'Should throw error for invalid page number');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testUIUpdates() {
        const test = 'UI updates';
        try {
            const canvas = this.createMockCanvas();
            const pdfViewer = new PDFViewer(canvas);
            
            // Mock DOM elements
            const mockElements = this.createMockDOMElements();
            
            await pdfViewer.loadPDF('test.pdf');
            
            // Test page info update
            pdfViewer.updatePageInfo();
            this.assert(mockElements.pageInfo.textContent === 'Page 1 of 3', 'Should update page info');
            
            // Test controls update
            pdfViewer.updateControls();
            this.assert(mockElements.prevBtn.disabled === true, 'Should disable prev button on first page');
            this.assert(mockElements.nextBtn.disabled === false, 'Should enable next button when not on last page');
            
            // Test zoom display update
            pdfViewer.scale = 1.5;
            pdfViewer.updateZoomDisplay();
            this.assert(mockElements.zoomLevel.textContent === '150%', 'Should update zoom display');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testDownloadURL() {
        const test = 'Download URL';
        try {
            const canvas = this.createMockCanvas();
            const pdfViewer = new PDFViewer(canvas);
            
            // Should return null when no PDF loaded
            this.assert(pdfViewer.getDownloadUrl() === null, 'Should return null when no PDF loaded');
            
            await pdfViewer.loadPDF('test.pdf');
            
            // Should return PDF URL after loading
            this.assert(pdfViewer.getDownloadUrl() === 'test.pdf', 'Should return PDF URL after loading');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    async testConcurrentOperations() {
        const test = 'Concurrent operations';
        try {
            const canvas = this.createMockCanvas();
            const pdfViewer = new PDFViewer(canvas);
            
            await pdfViewer.loadPDF('test.pdf');
            
            // Start multiple render operations
            const renderPromises = [
                pdfViewer.renderPage(1),
                pdfViewer.renderPage(2),
                pdfViewer.renderPage(3)
            ];
            
            // Should handle concurrent renders gracefully
            await Promise.all(renderPromises);
            
            // Final page should be the last one rendered
            this.assert(pdfViewer.currentPage >= 1 && pdfViewer.currentPage <= 3, 'Should handle concurrent renders');
            
            this.pass(test);
        } catch (error) {
            this.fail(test, error.message);
        }
    }
    
    // Helper methods
    createMockCanvas() {
        return {
            getContext: () => ({
                clearRect: () => {},
                drawImage: () => {}
            }),
            width: 0,
            height: 0,
            parentElement: {
                clientWidth: 800
            },
            setAttribute: () => {}
        };
    }
    
    createMockDOMElements() {
        const elements = {
            pageInfo: { textContent: '' },
            pageInput: { value: 1, max: 1 },
            zoomLevel: { textContent: '' },
            prevBtn: { disabled: false },
            nextBtn: { disabled: false },
            loadingIndicator: { style: { display: 'none' } },
            errorMessage: { 
                style: { display: 'none' },
                querySelector: () => ({ textContent: '' })
            }
        };
        
        // Mock document.getElementById
        const originalGetElementById = document.getElementById;
        document.getElementById = (id) => {
            const elementMap = {
                'page-info': elements.pageInfo,
                'page-input': elements.pageInput,
                'zoom-level': elements.zoomLevel,
                'prev-page': elements.prevBtn,
                'next-page': elements.nextBtn,
                'loading-indicator': elements.loadingIndicator,
                'error-message': elements.errorMessage
            };
            return elementMap[id] || null;
        };
        
        return elements;
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
        console.log(`\nPDFViewer Test Results:`);
        console.log(`Passed: ${this.passed}`);
        console.log(`Failed: ${this.failed}`);
        console.log(`Total: ${this.passed + this.failed}`);
        
        if (this.failed === 0) {
            console.log('All PDFViewer tests passed! ✓');
        } else {
            console.log(`${this.failed} PDFViewer test(s) failed. ✗`);
        }
    }
}
    
// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PDFViewerTests };
}

console.log('Enhanced PDF Viewer tests loaded successfully');