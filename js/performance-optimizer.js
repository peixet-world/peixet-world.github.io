// Performance optimization utilities for PDF sharing website

class PerformanceOptimizer {
    constructor() {
        this.imageCache = new Map();
        this.thumbnailCache = new Map();
        this.intersectionObserver = null;
        this.loadingElements = new Set();
        this.cacheConfig = {
            maxCacheSize: 50, // Maximum number of cached items
            cacheExpiry: 30 * 60 * 1000, // 30 minutes in milliseconds
            thumbnailQuality: 0.7,
            thumbnailMaxWidth: 300,
            thumbnailMaxHeight: 400
        };
        
        this.initializeIntersectionObserver();
        this.setupCacheCleanup();
    }

    /**
     * Initialize Intersection Observer for lazy loading
     */
    initializeIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            Logger.debug('IntersectionObserver not supported, falling back to immediate loading');
            return;
        }

        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadLazyElement(entry.target);
                    this.intersectionObserver.unobserve(entry.target);
                }
            });
        }, options);

        Logger.debug('IntersectionObserver initialized for lazy loading');
    }

    /**
     * Set up periodic cache cleanup
     */
    setupCacheCleanup() {
        // Clean up cache every 10 minutes
        setInterval(() => {
            this.cleanupExpiredCache();
        }, 10 * 60 * 1000);
    }

    /**
     * Enable lazy loading for an element
     * @param {HTMLElement} element - Element to lazy load
     * @param {Object} options - Loading options
     */
    enableLazyLoading(element, options = {}) {
        if (!element) return;

        // Store loading options on the element
        element.dataset.lazyOptions = JSON.stringify(options);
        element.classList.add('lazy-load');

        // Add loading placeholder
        this.addLoadingPlaceholder(element);

        if (this.intersectionObserver) {
            this.intersectionObserver.observe(element);
        } else {
            // Fallback for browsers without IntersectionObserver
            this.loadLazyElement(element);
        }
    }

    /**
     * Add loading placeholder to element
     * @param {HTMLElement} element - Element to add placeholder to
     */
    addLoadingPlaceholder(element) {
        if (element.classList.contains('pdf-card')) {
            const placeholder = document.createElement('div');
            placeholder.className = 'loading-placeholder';
            placeholder.innerHTML = `
                <div class="placeholder-content">
                    <div class="placeholder-title"></div>
                    <div class="placeholder-text"></div>
                    <div class="placeholder-text"></div>
                    <div class="placeholder-actions"></div>
                </div>
            `;
            placeholder.setAttribute('aria-label', 'Loading document information');
            
            // Replace content temporarily
            element.dataset.originalContent = element.innerHTML;
            element.innerHTML = '';
            element.appendChild(placeholder);
        }
    }

    /**
     * Load a lazy element
     * @param {HTMLElement} element - Element to load
     */
    async loadLazyElement(element) {
        if (this.loadingElements.has(element)) return;
        
        this.loadingElements.add(element);
        
        try {
            const options = JSON.parse(element.dataset.lazyOptions || '{}');
            
            if (element.classList.contains('pdf-card')) {
                await this.loadPDFCard(element, options);
            } else if (element.classList.contains('lazy-thumbnail')) {
                await this.loadThumbnail(element, options);
            }
            
            element.classList.remove('lazy-load');
            element.classList.add('lazy-loaded');
            
        } catch (error) {
            Logger.error('Failed to load lazy element', { element, error });
            this.handleLazyLoadError(element);
        } finally {
            this.loadingElements.delete(element);
        }
    }

    /**
     * Load PDF card content
     * @param {HTMLElement} element - PDF card element
     * @param {Object} options - Loading options
     */
    async loadPDFCard(element, options) {
        const { pdfData } = options;
        
        if (!pdfData) {
            throw new Error('PDF data not provided for lazy loading');
        }

        // Restore original content or create new content
        if (element.dataset.originalContent) {
            element.innerHTML = element.dataset.originalContent;
            delete element.dataset.originalContent;
        }

        // Load thumbnail if enabled
        if (options.loadThumbnail && pdfData.filename) {
            const thumbnailContainer = element.querySelector('.pdf-thumbnail');
            if (thumbnailContainer) {
                await this.loadPDFThumbnail(thumbnailContainer, pdfData.filename);
            }
        }

        Logger.debug('PDF card loaded lazily', { filename: pdfData.filename });
    }

    /**
     * Load PDF thumbnail
     * @param {HTMLElement} container - Container for thumbnail
     * @param {string} filename - PDF filename
     */
    async loadPDFThumbnail(container, filename) {
        const cacheKey = `thumbnail_${filename}`;
        
        // Check cache first
        if (this.thumbnailCache.has(cacheKey)) {
            const cached = this.thumbnailCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheConfig.cacheExpiry) {
                this.displayThumbnail(container, cached.data);
                return;
            }
        }

        try {
            // Show loading state
            container.innerHTML = '<div class="thumbnail-loading">Loading preview...</div>';
            
            // Generate thumbnail
            const thumbnailData = await this.generatePDFThumbnail(filename);
            
            if (thumbnailData) {
                // Cache the thumbnail
                this.thumbnailCache.set(cacheKey, {
                    data: thumbnailData,
                    timestamp: Date.now()
                });
                
                this.displayThumbnail(container, thumbnailData);
            } else {
                container.innerHTML = '<div class="thumbnail-placeholder">No preview available</div>';
            }
            
        } catch (error) {
            Logger.error('Failed to load PDF thumbnail', { filename, error });
            container.innerHTML = '<div class="thumbnail-error">Preview unavailable</div>';
        }
    }

    /**
     * Generate PDF thumbnail using PDF.js
     * @param {string} filename - PDF filename
     * @returns {Promise<string>} Base64 encoded thumbnail image
     */
    async generatePDFThumbnail(filename) {
        try {
            if (!window.pdfjsLib) {
                Logger.debug('PDF.js not available for thumbnail generation');
                return null;
            }

            const pdfUrl = `./pdfs/${filename}.pdf`;
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            
            // Get first page
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1 });
            
            // Calculate scale to fit thumbnail dimensions
            const scale = Math.min(
                this.cacheConfig.thumbnailMaxWidth / viewport.width,
                this.cacheConfig.thumbnailMaxHeight / viewport.height
            );
            
            const scaledViewport = page.getViewport({ scale });
            
            // Create canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
            
            // Render page
            await page.render({
                canvasContext: context,
                viewport: scaledViewport
            }).promise;
            
            // Convert to base64
            const thumbnailData = canvas.toDataURL('image/jpeg', this.cacheConfig.thumbnailQuality);
            
            Logger.debug('PDF thumbnail generated', { filename, width: canvas.width, height: canvas.height });
            return thumbnailData;
            
        } catch (error) {
            Logger.error('PDF thumbnail generation failed', { filename, error });
            return null;
        }
    }

    /**
     * Display thumbnail in container
     * @param {HTMLElement} container - Container element
     * @param {string} thumbnailData - Base64 encoded image data
     */
    displayThumbnail(container, thumbnailData) {
        const img = document.createElement('img');
        img.src = thumbnailData;
        img.alt = 'PDF preview';
        img.className = 'pdf-thumbnail-image';
        img.loading = 'lazy';
        
        container.innerHTML = '';
        container.appendChild(img);
    }

    /**
     * Handle lazy loading errors
     * @param {HTMLElement} element - Element that failed to load
     */
    handleLazyLoadError(element) {
        element.classList.add('lazy-load-error');
        
        if (element.classList.contains('pdf-card')) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'card-load-error';
            errorDiv.innerHTML = `
                <p>Failed to load document information</p>
                <button class="retry-btn" onclick="this.closest('.pdf-card').dispatchEvent(new CustomEvent('retry-load'))">
                    Retry
                </button>
            `;
            element.innerHTML = '';
            element.appendChild(errorDiv);
        }
    }

    /**
     * Preload critical resources
     * @param {Array<string>} resources - Array of resource URLs to preload
     */
    preloadCriticalResources(resources) {
        resources.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            
            if (url.endsWith('.css')) {
                link.as = 'style';
            } else if (url.endsWith('.js')) {
                link.as = 'script';
            } else if (url.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
                link.as = 'image';
            } else {
                link.as = 'fetch';
                link.crossOrigin = 'anonymous';
            }
            
            link.href = url;
            document.head.appendChild(link);
        });
        
        Logger.debug('Critical resources preloaded', { count: resources.length });
    }

    /**
     * Optimize images for better performance
     * @param {HTMLImageElement} img - Image element to optimize
     */
    optimizeImage(img) {
        // Add loading attribute for native lazy loading
        if ('loading' in HTMLImageElement.prototype) {
            img.loading = 'lazy';
        }
        
        // Add decode hint
        if ('decoding' in img) {
            img.decoding = 'async';
        }
        
        // Optimize for different screen densities
        if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
        }
    }

    /**
     * Clean up expired cache entries
     */
    cleanupExpiredCache() {
        const now = Date.now();
        let cleanedCount = 0;
        
        // Clean thumbnail cache
        for (const [key, value] of this.thumbnailCache.entries()) {
            if (now - value.timestamp > this.cacheConfig.cacheExpiry) {
                this.thumbnailCache.delete(key);
                cleanedCount++;
            }
        }
        
        // Clean image cache
        for (const [key, value] of this.imageCache.entries()) {
            if (now - value.timestamp > this.cacheConfig.cacheExpiry) {
                this.imageCache.delete(key);
                cleanedCount++;
            }
        }
        
        // Limit cache size
        this.limitCacheSize();
        
        if (cleanedCount > 0) {
            Logger.debug('Cache cleanup completed', { cleanedCount });
        }
    }

    /**
     * Limit cache size to prevent memory issues
     */
    limitCacheSize() {
        // Limit thumbnail cache
        if (this.thumbnailCache.size > this.cacheConfig.maxCacheSize) {
            const entries = Array.from(this.thumbnailCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toRemove = entries.slice(0, entries.length - this.cacheConfig.maxCacheSize);
            toRemove.forEach(([key]) => this.thumbnailCache.delete(key));
        }
        
        // Limit image cache
        if (this.imageCache.size > this.cacheConfig.maxCacheSize) {
            const entries = Array.from(this.imageCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toRemove = entries.slice(0, entries.length - this.cacheConfig.maxCacheSize);
            toRemove.forEach(([key]) => this.imageCache.delete(key));
        }
    }

    /**
     * Create loading indicator
     * @param {string} message - Loading message
     * @param {string} type - Type of loading indicator ('spinner', 'progress', 'skeleton')
     * @returns {HTMLElement} Loading indicator element
     */
    createLoadingIndicator(message = 'Loading...', type = 'spinner') {
        const indicator = document.createElement('div');
        indicator.className = `loading-indicator loading-${type}`;
        indicator.setAttribute('role', 'status');
        indicator.setAttribute('aria-live', 'polite');
        
        switch (type) {
            case 'spinner':
                indicator.innerHTML = `
                    <div class="spinner" aria-hidden="true"></div>
                    <span class="loading-text">${message}</span>
                `;
                break;
                
            case 'progress':
                indicator.innerHTML = `
                    <div class="progress-bar" aria-hidden="true">
                        <div class="progress-fill"></div>
                    </div>
                    <span class="loading-text">${message}</span>
                `;
                break;
                
            case 'skeleton':
                indicator.innerHTML = `
                    <div class="skeleton-content" aria-hidden="true">
                        <div class="skeleton-line skeleton-title"></div>
                        <div class="skeleton-line skeleton-text"></div>
                        <div class="skeleton-line skeleton-text short"></div>
                    </div>
                    <span class="sr-only">${message}</span>
                `;
                break;
        }
        
        return indicator;
    }

    /**
     * Update loading progress
     * @param {HTMLElement} indicator - Loading indicator element
     * @param {number} progress - Progress percentage (0-100)
     */
    updateLoadingProgress(indicator, progress) {
        const progressFill = indicator.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
        }
        
        const loadingText = indicator.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = `Loading... ${Math.round(progress)}%`;
        }
    }

    /**
     * Remove loading indicator
     * @param {HTMLElement} indicator - Loading indicator to remove
     */
    removeLoadingIndicator(indicator) {
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            thumbnailCache: {
                size: this.thumbnailCache.size,
                maxSize: this.cacheConfig.maxCacheSize
            },
            imageCache: {
                size: this.imageCache.size,
                maxSize: this.cacheConfig.maxCacheSize
            },
            cacheExpiry: this.cacheConfig.cacheExpiry,
            loadingElements: this.loadingElements.size
        };
    }

    /**
     * Clear all caches
     */
    clearAllCaches() {
        this.thumbnailCache.clear();
        this.imageCache.clear();
        Logger.info('All caches cleared');
    }
}

// Global performance optimizer instance
window.PerformanceOptimizer = new PerformanceOptimizer();