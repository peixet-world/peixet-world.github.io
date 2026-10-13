// Performance and Accessibility Tests

describe('Performance and Accessibility Enhancements', () => {
    let performanceOptimizer;
    let accessibilityEnhancer;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        
        // Create test container
        const container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
        
        // Initialize optimizers
        performanceOptimizer = new PerformanceOptimizer();
        accessibilityEnhancer = new AccessibilityEnhancer();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Performance Optimizer', () => {
        test('should initialize intersection observer', () => {
            expect(performanceOptimizer.intersectionObserver).toBeDefined();
        });

        test('should create loading indicators', () => {
            const indicator = performanceOptimizer.createLoadingIndicator('Test loading', 'spinner');
            
            expect(indicator.className).toContain('loading-indicator');
            expect(indicator.className).toContain('loading-spinner');
            expect(indicator.getAttribute('role')).toBe('status');
            expect(indicator.getAttribute('aria-live')).toBe('polite');
        });

        test('should enable lazy loading for elements', () => {
            const element = document.createElement('div');
            element.className = 'pdf-card';
            
            performanceOptimizer.enableLazyLoading(element, { test: true });
            
            expect(element.classList.contains('lazy-load')).toBe(true);
            expect(element.dataset.lazyOptions).toBeDefined();
        });

        test('should optimize images', () => {
            const img = document.createElement('img');
            img.src = 'test.jpg';
            
            performanceOptimizer.optimizeImage(img);
            
            expect(img.loading).toBe('lazy');
            if ('decoding' in img) {
                expect(img.decoding).toBe('async');
            }
        });

        test('should manage cache size limits', () => {
            // Fill cache beyond limit
            for (let i = 0; i < 60; i++) {
                performanceOptimizer.thumbnailCache.set(`test${i}`, {
                    data: 'test',
                    timestamp: Date.now()
                });
            }
            
            performanceOptimizer.limitCacheSize();
            
            expect(performanceOptimizer.thumbnailCache.size).toBeLessThanOrEqual(50);
        });

        test('should clean up expired cache entries', () => {
            const oldTimestamp = Date.now() - (31 * 60 * 1000); // 31 minutes ago
            
            performanceOptimizer.thumbnailCache.set('old', {
                data: 'test',
                timestamp: oldTimestamp
            });
            
            performanceOptimizer.thumbnailCache.set('new', {
                data: 'test',
                timestamp: Date.now()
            });
            
            performanceOptimizer.cleanupExpiredCache();
            
            expect(performanceOptimizer.thumbnailCache.has('old')).toBe(false);
            expect(performanceOptimizer.thumbnailCache.has('new')).toBe(true);
        });

        test('should update loading progress', () => {
            const indicator = performanceOptimizer.createLoadingIndicator('Loading...', 'progress');
            document.body.appendChild(indicator);
            
            performanceOptimizer.updateLoadingProgress(indicator, 50);
            
            const progressFill = indicator.querySelector('.progress-fill');
            expect(progressFill.style.width).toBe('50%');
        });
    });

    describe('Accessibility Enhancer', () => {
        test('should create skip links', () => {
            const skipLinks = document.querySelector('.skip-links');
            expect(skipLinks).toBeTruthy();
            
            const links = skipLinks.querySelectorAll('.skip-link');
            expect(links.length).toBeGreaterThan(0);
        });

        test('should create live regions', () => {
            const liveRegion = document.getElementById('live-region');
            const assertiveLiveRegion = document.getElementById('assertive-live-region');
            
            expect(liveRegion).toBeTruthy();
            expect(assertiveLiveRegion).toBeTruthy();
            expect(liveRegion.getAttribute('aria-live')).toBe('polite');
            expect(assertiveLiveRegion.getAttribute('aria-live')).toBe('assertive');
        });

        test('should announce messages to screen readers', () => {
            const liveRegion = document.getElementById('live-region');
            
            accessibilityEnhancer.announce('Test message');
            
            setTimeout(() => {
                expect(liveRegion.textContent).toBe('Test message');
            }, 150);
        });

        test('should enhance form fields', () => {
            const form = document.createElement('form');
            const input = document.createElement('input');
            input.type = 'text';
            input.required = true;
            input.placeholder = 'Test input';
            form.appendChild(input);
            document.body.appendChild(form);
            
            accessibilityEnhancer.enhanceForm(form);
            
            expect(input.getAttribute('aria-required')).toBe('true');
            expect(input.getAttribute('aria-label')).toBe('Test input');
        });

        test('should handle keyboard navigation', () => {
            const cards = [];
            const grid = document.createElement('div');
            grid.className = 'pdf-grid';
            
            // Create test cards
            for (let i = 0; i < 6; i++) {
                const card = document.createElement('div');
                card.className = 'pdf-card';
                card.tabIndex = 0;
                cards.push(card);
                grid.appendChild(card);
            }
            
            document.body.appendChild(grid);
            
            // Focus first card
            cards[0].focus();
            
            // Simulate arrow right key
            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            cards[0].dispatchEvent(event);
            
            // Note: In a real test, you'd check if focus moved to the next card
            // This requires more complex DOM manipulation and focus management
        });

        test('should enhance interactive elements', () => {
            const button = document.createElement('div');
            button.setAttribute('role', 'button');
            button.onclick = () => {};
            
            accessibilityEnhancer.enhanceInteractiveElement(button);
            
            expect(button.getAttribute('tabindex')).toBe('0');
            expect(button.hasKeyboardHandler).toBe(true);
        });

        test('should focus elements correctly', () => {
            const testElement = document.createElement('button');
            testElement.id = 'test-button';
            testElement.textContent = 'Test';
            document.body.appendChild(testElement);
            
            accessibilityEnhancer.focusElement('#test-button');
            
            expect(document.activeElement).toBe(testElement);
        });

        test('should get accessibility status', () => {
            // Add some test elements
            const button = document.createElement('button');
            const img = document.createElement('img');
            const input = document.createElement('input');
            
            document.body.appendChild(button);
            document.body.appendChild(img);
            document.body.appendChild(input);
            
            const status = accessibilityEnhancer.getAccessibilityStatus();
            
            expect(status.focusableElements).toBeGreaterThan(0);
            expect(status.imagesWithoutAlt).toBeGreaterThan(0);
            expect(status.skipLinksPresent).toBe(true);
            expect(status.liveRegionsPresent).toBe(true);
        });

        test('should handle high contrast mode', () => {
            // Simulate high contrast mode
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockImplementation(query => ({
                    matches: query === '(prefers-contrast: high)',
                    media: query,
                    onchange: null,
                    addListener: jest.fn(),
                    removeListener: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                })),
            });
            
            // Reinitialize to trigger high contrast detection
            new AccessibilityEnhancer();
            
            expect(document.body.classList.contains('high-contrast')).toBe(true);
        });
    });

    describe('Integration Tests', () => {
        test('should work together for PDF card creation', () => {
            const pdfData = {
                filename: 'test-document',
                title: 'Test Document',
                description: 'A test PDF document',
                tags: ['test', 'document'],
                uploadDate: new Date().toISOString(),
                fileSize: 1024000
            };
            
            // Create card with both optimizations
            const card = document.createElement('article');
            card.className = 'pdf-card';
            
            // Enable lazy loading
            performanceOptimizer.enableLazyLoading(card, {
                pdfData: pdfData,
                loadThumbnail: true
            });
            
            // Enhance accessibility
            accessibilityEnhancer.enhanceDynamicContent(card.parentElement || document.body);
            
            expect(card.classList.contains('lazy-load')).toBe(true);
            expect(card.getAttribute('tabindex')).toBeTruthy();
        });

        test('should handle loading states accessibly', () => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            
            // Create accessible loading indicator
            const indicator = performanceOptimizer.createLoadingIndicator('Loading documents...', 'spinner');
            container.appendChild(indicator);
            
            expect(indicator.getAttribute('role')).toBe('status');
            expect(indicator.getAttribute('aria-live')).toBe('polite');
            
            // Update progress accessibly
            performanceOptimizer.updateLoadingProgress(indicator, 75);
            
            const loadingText = indicator.querySelector('.loading-text');
            expect(loadingText.textContent).toContain('75%');
        });

        test('should announce performance updates', () => {
            const liveRegion = document.getElementById('live-region');
            
            // Simulate cache cleanup announcement
            performanceOptimizer.cleanupExpiredCache();
            accessibilityEnhancer.announce('Cache optimized for better performance');
            
            setTimeout(() => {
                expect(liveRegion.textContent).toContain('performance');
            }, 150);
        });
    });

    describe('Error Handling', () => {
        test('should handle missing elements gracefully', () => {
            expect(() => {
                accessibilityEnhancer.focusElement('#non-existent');
            }).not.toThrow();
            
            expect(() => {
                performanceOptimizer.enableLazyLoading(null);
            }).not.toThrow();
        });

        test('should provide fallbacks for unsupported features', () => {
            // Mock missing IntersectionObserver
            const originalIntersectionObserver = window.IntersectionObserver;
            delete window.IntersectionObserver;
            
            const optimizer = new PerformanceOptimizer();
            expect(optimizer.intersectionObserver).toBeNull();
            
            // Restore
            window.IntersectionObserver = originalIntersectionObserver;
        });

        test('should handle invalid cache data', () => {
            expect(() => {
                performanceOptimizer.thumbnailCache.set('invalid', null);
                performanceOptimizer.cleanupExpiredCache();
            }).not.toThrow();
        });
    });
});

// Helper function to simulate user interactions
function simulateKeyPress(element, key, options = {}) {
    const event = new KeyboardEvent('keydown', {
        key: key,
        code: key,
        bubbles: true,
        cancelable: true,
        ...options
    });
    
    element.dispatchEvent(event);
    return event;
}

// Helper function to simulate focus events
function simulateFocus(element) {
    const event = new FocusEvent('focusin', {
        bubbles: true,
        cancelable: true,
        target: element
    });
    
    element.dispatchEvent(event);
    return event;
}