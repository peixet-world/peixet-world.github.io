// Main JavaScript functionality for PDF sharing website

// Configuration
const CONFIG = {
    pdfDirectory: './pdfs/',
    metadataDirectory: './pdfs/metadata/',
    siteName: 'PDF Library',
    debug: true
};

// Import centralized logger (will be loaded via script tag)
// Logger class is defined in logger.js

// DOM utility functions
const DOM = {
    ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    },

    createElement(tag, className = '', textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }
};

// Initialize application
DOM.ready(() => {
    Logger.info('PDF sharing website initialized');

    // Initialize performance optimizer
    if (window.PerformanceOptimizer) {
        Logger.debug('Performance optimizer initialized');
        
        // Preload critical resources
        const criticalResources = [
            'css/main.css',
            'css/responsive.css',
            'js/pdf-manager.js',
            'js/tag-system.js'
        ];
        window.PerformanceOptimizer.preloadCriticalResources(criticalResources);
    }

    // Initialize accessibility enhancer
    if (window.AccessibilityEnhancer) {
        Logger.debug('Accessibility enhancer initialized');
        
        // Add keyboard navigation class to body
        document.body.classList.add('keyboard-navigation');
        
        // Announce page load
        setTimeout(() => {
            const currentPage = getCurrentPage();
            const pageNames = {
                'home': 'Homepage',
                'directory': 'PDF Directory',
                'viewer': 'PDF Viewer'
            };
            window.AccessibilityEnhancer.announce(`${pageNames[currentPage] || 'Page'} loaded`);
        }, 1000);
    }

    // Set up navigation
    setupNavigation();

    // Initialize page-specific functionality
    const currentPage = getCurrentPage();
    Logger.debug('Current page detected', { page: currentPage });

    switch (currentPage) {
        case 'home':
            initHomepage();
            break;
        case 'directory':
            initDirectoryPage();
            break;
        case 'viewer':
            initViewerPage();
            break;
    }
});

function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('directory.html')) return 'directory';
    if (path.includes('viewer.html')) return 'viewer';
    return 'home';
}

function setupNavigation() {
    // Add active class to current page navigation
    const currentPage = getCurrentPage();
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if ((currentPage === 'home' && href === 'index.html') ||
            (currentPage === 'directory' && href === 'directory.html') ||
            (currentPage === 'viewer' && href === 'viewer.html')) {
            link.classList.add('active');
        }
    });
}

async function initHomepage() {
    Logger.info('Initializing homepage');
    Logger.startTimer('homepage-initialization');

    const safeInitHomepage = ErrorHandler.wrapAsync(async () => {
        // Initialize PDF manager
        const pdfManager = new PDFManager(CONFIG.pdfDirectory);

        // Load PDF list with error handling
        await pdfManager.loadPDFList();
        Logger.info('PDF list loaded for homepage', { count: pdfManager.getPDFCount() });

        // Load featured PDFs with graceful degradation
        const loadFeaturedSafe = ErrorHandler.createGracefulHandler(
            () => loadFeaturedPDFs(pdfManager),
            () => showEmptyFeaturedSection(),
            'featured PDFs loading'
        );
        await loadFeaturedSafe();

        // Load recent PDFs with graceful degradation
        const loadRecentSafe = ErrorHandler.createGracefulHandler(
            () => loadRecentPDFs(pdfManager),
            () => showEmptyRecentSection(),
            'recent PDFs loading'
        );
        await loadRecentSafe();

    }, {
        context: 'homepage initialization',
        retryCount: 1,
        retryDelay: 2000,
        showUserError: true
    });

    try {
        await safeInitHomepage();
        Logger.endTimer('homepage-initialization');
    } catch (error) {
        Logger.endTimer('homepage-initialization');
        Logger.error('Homepage initialization failed completely', error);
        showHomepageError('Unable to load PDF content. Please check your connection and try refreshing the page.');
    }
}

async function loadFeaturedPDFs(pdfManager) {
    const featuredContainer = document.getElementById('featured-container');
    if (!featuredContainer) {
        Logger.error('Featured container not found');
        throw new Error('Featured container element not found');
    }

    Logger.debug('Loading featured PDFs');
    Logger.startTimer('load-featured-pdfs');

    try {
        // Show loading state
        showLoadingState(featuredContainer, 'Loading featured documents...');

        // Get all metadata with error handling
        const safeGetMetadata = ErrorHandler.wrapAsync(
            () => pdfManager.getAllMetadata(),
            {
                context: 'featured PDFs metadata loading',
                retryCount: 2,
                retryDelay: 1000,
                showUserError: false
            }
        );

        const allMetadata = await safeGetMetadata();
        
        if (!allMetadata || allMetadata.length === 0) {
            showEmptyState(featuredContainer, 'No documents available', 'Add some PDF files to get started.');
            return;
        }

        // Filter for featured PDFs
        const featuredPDFs = allMetadata.filter(pdf => pdf && pdf.featured);

        // If no featured PDFs, show most recent ones
        if (featuredPDFs.length === 0) {
            Logger.debug('No featured PDFs found, showing recent ones');
            const sortedPDFs = allMetadata
                .filter(pdf => pdf && pdf.uploadDate) // Ensure valid PDFs
                .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
                .slice(0, 3);

            if (sortedPDFs.length > 0) {
                renderPDFCards(featuredContainer, sortedPDFs, 'No featured documents available. Showing recent uploads:');
            } else {
                showEmptyState(featuredContainer, 'No documents available', 'Add some PDF files to get started.');
            }
        } else {
            Logger.info('Rendering featured PDFs', { count: featuredPDFs.length });
            renderPDFCards(featuredContainer, featuredPDFs.slice(0, 6));
        }

        Logger.endTimer('load-featured-pdfs');

    } catch (error) {
        Logger.endTimer('load-featured-pdfs');
        Logger.error('Failed to load featured PDFs', error);
        
        const errorInfo = ErrorHandler.analyzeError(error);
        showErrorState(featuredContainer, errorInfo.userMessage || 'Failed to load featured documents.');
        
        throw error; // Re-throw for graceful handler
    }
}

async function loadRecentPDFs(pdfManager) {
    const recentContainer = document.getElementById('recent-container');
    if (!recentContainer) {
        Logger.error('Recent container not found');
        throw new Error('Recent container element not found');
    }

    Logger.debug('Loading recent PDFs');
    Logger.startTimer('load-recent-pdfs');

    try {
        // Show loading state
        showLoadingState(recentContainer, 'Loading recent documents...');

        // Get all metadata with error handling
        const safeGetMetadata = ErrorHandler.wrapAsync(
            () => pdfManager.getAllMetadata(),
            {
                context: 'recent PDFs metadata loading',
                retryCount: 2,
                retryDelay: 1000,
                showUserError: false
            }
        );

        const allMetadata = await safeGetMetadata();

        if (!allMetadata || allMetadata.length === 0) {
            showEmptyState(recentContainer, 'No documents available', 'Add some PDF files to get started.');
            return;
        }

        // Sort by upload date and take the most recent
        const recentPDFs = allMetadata
            .filter(pdf => pdf && pdf.uploadDate) // Ensure valid PDFs with dates
            .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
            .slice(0, 6);

        if (recentPDFs.length === 0) {
            showEmptyState(recentContainer, 'No recent documents', 'No documents with valid dates found.');
            return;
        }

        Logger.info('Rendering recent PDFs', { count: recentPDFs.length });
        renderPDFCards(recentContainer, recentPDFs);

        Logger.endTimer('load-recent-pdfs');

    } catch (error) {
        Logger.endTimer('load-recent-pdfs');
        Logger.error('Failed to load recent PDFs', error);
        
        const errorInfo = ErrorHandler.analyzeError(error);
        showErrorState(recentContainer, errorInfo.userMessage || 'Failed to load recent documents.');
        
        throw error; // Re-throw for graceful handler
    }
}

function renderPDFCards(container, pdfs, message = null, enableLazyLoading = true) {
    // Clear container
    container.innerHTML = '';

    // Add optional message
    if (message) {
        const messageEl = DOM.createElement('p', 'section-message', message);
        container.appendChild(messageEl);
    }

    // Create PDF cards with performance optimization
    pdfs.forEach((pdf, index) => {
        // Enable lazy loading for cards beyond the first few
        const shouldLazyLoad = enableLazyLoading && index > 2;
        const card = createPDFCard(pdf, shouldLazyLoad);
        container.appendChild(card);
    });

    // Optimize images in the container
    if (window.PerformanceOptimizer) {
        const images = container.querySelectorAll('img');
        images.forEach(img => window.PerformanceOptimizer.optimizeImage(img));
    }

    // Enhance accessibility for dynamic content
    if (window.AccessibilityEnhancer) {
        window.AccessibilityEnhancer.enhanceDynamicContent(container);
        
        // Announce content update
        const count = pdfs.length;
        window.AccessibilityEnhancer.announce(`${count} document${count !== 1 ? 's' : ''} displayed`);
    }
}

function createPDFCard(pdf, enableLazyLoading = false) {
    const card = DOM.createElement('article', 'pdf-card');
    card.setAttribute('role', 'article');
    card.setAttribute('aria-labelledby', `pdf-title-${pdf.filename}`);

    // Add thumbnail container if performance optimizer is available
    if (window.PerformanceOptimizer && enableLazyLoading) {
        const thumbnailContainer = DOM.createElement('div', 'pdf-thumbnail');
        card.appendChild(thumbnailContainer);
        
        // Enable lazy loading for the card
        window.PerformanceOptimizer.enableLazyLoading(card, {
            pdfData: pdf,
            loadThumbnail: true
        });
        
        return card; // Return early, content will be loaded lazily
    }

    // Standard card creation (non-lazy)
    return createStandardPDFCard(pdf);
}

function createStandardPDFCard(pdf) {
    const card = DOM.createElement('article', 'pdf-card');
    card.setAttribute('role', 'article');
    card.setAttribute('aria-labelledby', `pdf-title-${pdf.filename}`);

    // Title
    const title = DOM.createElement('h3', '', pdf.title);
    title.id = `pdf-title-${pdf.filename}`;
    card.appendChild(title);

    // Description
    if (pdf.description) {
        const description = DOM.createElement('p', '', pdf.description);
        card.appendChild(description);
    }

    // Metadata
    const metadata = DOM.createElement('div', 'metadata');
    const uploadDate = new Date(pdf.uploadDate).toLocaleDateString();
    let metadataText = `Added: ${uploadDate}`;

    if (pdf.fileSize) {
        const fileSize = formatFileSize(pdf.fileSize);
        metadataText += ` • Size: ${fileSize}`;
    }

    if (pdf.pageCount) {
        metadataText += ` • Pages: ${pdf.pageCount}`;
    }

    metadata.textContent = metadataText;
    card.appendChild(metadata);

    // Tags
    if (pdf.tags && pdf.tags.length > 0) {
        const tagsContainer = DOM.createElement('div', 'tags');
        tagsContainer.setAttribute('aria-label', 'Document tags');

        pdf.tags.forEach(tag => {
            const tagEl = DOM.createElement('span', 'tag', tag);
            tagEl.setAttribute('role', 'button');
            tagEl.setAttribute('tabindex', '0');
            tagEl.setAttribute('aria-label', `Filter by tag: ${tag}`);

            // Add click handler for tag filtering
            tagEl.addEventListener('click', () => navigateToDirectoryWithTag(tag));
            tagEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateToDirectoryWithTag(tag);
                }
            });

            tagsContainer.appendChild(tagEl);
        });

        card.appendChild(tagsContainer);
    }

    // Actions
    const actions = DOM.createElement('div', 'actions');

    // View button
    const viewBtn = DOM.createElement('a', 'btn btn-primary btn-small', 'View PDF');
    viewBtn.href = `viewer.html?file=${encodeURIComponent(pdf.filename)}.pdf`;
    viewBtn.setAttribute('role', 'button');
    viewBtn.setAttribute('aria-label', `View ${pdf.title}`);
    actions.appendChild(viewBtn);

    // Download button
    const downloadBtn = DOM.createElement('a', 'btn btn-secondary btn-small', 'Download');
    downloadBtn.href = `${CONFIG.pdfDirectory}${pdf.filename}.pdf`;
    downloadBtn.download = `${pdf.filename}.pdf`;
    downloadBtn.setAttribute('role', 'button');
    downloadBtn.setAttribute('aria-label', `Download ${pdf.title}`);
    actions.appendChild(downloadBtn);

    card.appendChild(actions);

    // Add keyboard navigation
    card.setAttribute('tabindex', '0');
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            viewBtn.click();
        }
    });

    return card;
}

function showLoadingState(container, message = 'Loading...', type = 'spinner') {
    if (window.PerformanceOptimizer) {
        const loadingIndicator = window.PerformanceOptimizer.createLoadingIndicator(message, type);
        container.innerHTML = '';
        container.appendChild(loadingIndicator);
    } else {
        // Fallback for when performance optimizer is not available
        container.innerHTML = `
            <div class="loading-state" aria-live="polite">
                <p>${message}</p>
            </div>
        `;
    }
}

function showErrorState(container, message = 'An error occurred') {
    container.innerHTML = `
        <div class="error-state" role="alert">
            <h3>Error</h3>
            <p>${message}</p>
            <button class="btn btn-secondary" onclick="location.reload()">Retry</button>
        </div>
    `;
}

function showEmptyState(container, title = 'No content', message = '') {
    container.innerHTML = `
        <div class="empty-state">
            <h3>${title}</h3>
            ${message ? `<p>${message}</p>` : ''}
        </div>
    `;
}

function showHomepageError(message) {
    const main = document.querySelector('main');
    if (main) {
        const errorDiv = DOM.createElement('div', 'error-state');
        errorDiv.setAttribute('role', 'alert');
        errorDiv.innerHTML = `
            <h2>Error Loading Content</h2>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        `;
        main.insertBefore(errorDiv, main.firstChild);
    }
}

function showEmptyFeaturedSection() {
    const featuredContainer = document.getElementById('featured-container');
    if (featuredContainer) {
        showEmptyState(featuredContainer, 'Featured content unavailable', 'Unable to load featured documents at this time.');
    }
}

function showEmptyRecentSection() {
    const recentContainer = document.getElementById('recent-container');
    if (recentContainer) {
        showEmptyState(recentContainer, 'Recent content unavailable', 'Unable to load recent documents at this time.');
    }
}

function navigateToDirectoryWithTag(tag) {
    Logger.debug('Navigating to directory with tag filter', { tag });
    window.location.href = `directory.html?tag=${encodeURIComponent(tag)}`;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function initDirectoryPage() {
    Logger.info('Initializing directory page');
    Logger.startTimer('directory-initialization');

    const safeInitDirectory = ErrorHandler.wrapAsync(async () => {
        // Initialize PDF manager
        const pdfManager = new PDFManager(CONFIG.pdfDirectory);

        // Initialize directory controller with error handling
        const directoryController = new DirectoryController(pdfManager);
        await directoryController.initialize();

        return directoryController;
    }, {
        context: 'directory page initialization',
        retryCount: 1,
        retryDelay: 2000,
        showUserError: true
    });

    try {
        await safeInitDirectory();
        Logger.endTimer('directory-initialization');
    } catch (error) {
        Logger.endTimer('directory-initialization');
        Logger.error('Directory page initialization failed completely', error);
        showDirectoryError('Unable to load PDF directory. Please check your connection and try refreshing the page.');
    }
}

function showDirectoryError(message) {
    const main = document.querySelector('main');
    if (main) {
        const errorDiv = DOM.createElement('div', 'error-state');
        errorDiv.setAttribute('role', 'alert');
        errorDiv.innerHTML = `
            <h2>Directory Loading Error</h2>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        `;
        main.insertBefore(errorDiv, main.firstChild);
    }
}

// Directory Controller class for managing directory page functionality
class DirectoryController {
    constructor(pdfManager) {
        this.pdfManager = pdfManager;
        this.tagSystem = new TagSystem(pdfManager);
        this.allPDFs = [];
        this.filteredPDFs = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentSort = 'name';
        this.currentSearchQuery = '';
        this.currentTagFilter = null;
        this.selectedTags = new Set(); // Support for multiple tag selection

        // DOM elements
        this.pdfListContainer = document.getElementById('pdf-list');
        this.searchInput = document.getElementById('search-input');
        this.searchBtn = document.getElementById('search-btn');
        this.sortSelect = document.getElementById('sort-select');
        this.tagCloud = document.getElementById('tag-cloud');
        this.paginationContainer = document.getElementById('pagination');
    }

    async initialize() {
        Logger.debug('Initializing directory controller');

        // Load PDF data
        await this.loadPDFData();

        // Set up event listeners
        this.setupEventListeners();

        // Check for URL parameters
        this.handleURLParameters();

        // Apply initial filters and sort based on URL parameters
        this.applyFiltersAndSort();

        // Initial render
        this.renderDirectory();

        Logger.info('Directory controller initialized successfully');
    }

    async loadPDFData() {
        try {
            Logger.debug('Loading PDF data for directory');

            // Show loading state
            this.showLoadingState();

            // Load PDF list
            await this.pdfManager.loadPDFList();

            // Initialize tag system
            await this.tagSystem.initialize();

            // Get all metadata
            this.allPDFs = await this.pdfManager.getAllMetadata();

            // Initialize filtered list
            this.filteredPDFs = [...this.allPDFs];

            Logger.info('PDF data loaded for directory', {
                pdfCount: this.allPDFs.length,
                tagCount: this.tagSystem.getAllTags().length
            });

        } catch (error) {
            Logger.error('Failed to load PDF data', error);
            throw error;
        }
    }

    setupEventListeners() {
        Logger.debug('Setting up directory event listeners');

        // Search functionality
        if (this.searchInput && this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.handleSearch());
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });

            // Real-time search with debouncing
            let searchTimeout;
            this.searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => this.handleSearch(), 300);
            });
        }

        // Sort functionality
        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.applyFiltersAndSort();
                this.renderDirectory();
            });
        }
    }

    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);

        // Handle tag filters from URL (support multiple tags)
        const tagParam = urlParams.get('tag');
        const tagsParam = urlParams.get('tags');

        if (tagsParam) {
            // Multiple tags separated by commas
            const tags = tagsParam.split(',').map(tag => decodeURIComponent(tag.trim()));
            tags.forEach(tag => this.selectedTags.add(tag));
            this.currentTagFilter = tags[0]; // For backward compatibility
            Logger.debug('Multiple tag filters from URL', { tags });
        } else if (tagParam) {
            // Single tag for backward compatibility
            const tag = decodeURIComponent(tagParam);
            this.selectedTags.add(tag);
            this.currentTagFilter = tag;
            Logger.debug('Single tag filter from URL', { tag });
        }

        // Handle search query from URL
        const searchParam = urlParams.get('search');
        if (searchParam) {
            this.currentSearchQuery = decodeURIComponent(searchParam);
            if (this.searchInput) {
                this.searchInput.value = this.currentSearchQuery;
            }
            Logger.debug('Search query from URL', { query: this.currentSearchQuery });
        }

        // Handle sort from URL
        const sortParam = urlParams.get('sort');
        if (sortParam && ['name', 'date', 'size'].includes(sortParam)) {
            this.currentSort = sortParam;
            if (this.sortSelect) {
                this.sortSelect.value = this.currentSort;
            }
            Logger.debug('Sort parameter from URL', { sort: this.currentSort });
        }

        // Handle page from URL
        const pageParam = urlParams.get('page');
        if (pageParam) {
            const page = parseInt(pageParam, 10);
            if (page > 0) {
                this.currentPage = page;
                Logger.debug('Page parameter from URL', { page: this.currentPage });
            }
        }
    }

    updateURL() {
        const urlParams = new URLSearchParams();

        // Add search query
        if (this.currentSearchQuery) {
            urlParams.set('search', this.currentSearchQuery);
        }

        // Add tag filters
        if (this.selectedTags.size > 0) {
            const tags = Array.from(this.selectedTags);
            if (tags.length === 1) {
                urlParams.set('tag', tags[0]);
            } else {
                urlParams.set('tags', tags.join(','));
            }
        }

        // Add sort
        if (this.currentSort !== 'name') {
            urlParams.set('sort', this.currentSort);
        }

        // Add page if not first page
        if (this.currentPage > 1) {
            urlParams.set('page', this.currentPage.toString());
        }

        // Update URL without page reload
        const newURL = urlParams.toString() ?
            `${window.location.pathname}?${urlParams.toString()}` :
            window.location.pathname;

        window.history.replaceState({}, '', newURL);

        Logger.debug('URL updated', {
            search: this.currentSearchQuery,
            tags: Array.from(this.selectedTags),
            sort: this.currentSort,
            page: this.currentPage
        });
    }

    handleSearch() {
        const query = this.searchInput ? this.searchInput.value.trim() : '';
        this.currentSearchQuery = query;
        this.currentPage = 1; // Reset to first page

        Logger.debug('Handling search', { query });

        this.applyFiltersAndSort();
        this.renderDirectory();
        this.updateURL();
    }

    handleTagFilter(tag) {
        Logger.debug('Handling tag filter', { tag });

        if (this.selectedTags.has(tag)) {
            // Remove tag if already selected
            this.selectedTags.delete(tag);
        } else {
            // Add tag to selection
            this.selectedTags.add(tag);
        }

        // Update current tag filter for backward compatibility
        this.currentTagFilter = this.selectedTags.size > 0 ? Array.from(this.selectedTags)[0] : null;

        this.currentPage = 1; // Reset to first page
        this.applyFiltersAndSort();
        this.renderDirectory();
        this.updateURL();
    }

    clearTagFilters() {
        Logger.debug('Clearing tag filters');
        this.selectedTags.clear();
        this.currentTagFilter = null;
        this.currentPage = 1;
        this.applyFiltersAndSort();
        this.renderDirectory();
        this.updateURL();
    }

    applyFiltersAndSort() {
        Logger.debug('Applying filters and sort', {
            search: this.currentSearchQuery,
            selectedTags: Array.from(this.selectedTags),
            sort: this.currentSort
        });

        // Use TagSystem for combined search and filtering
        const selectedTagsArray = Array.from(this.selectedTags);
        this.filteredPDFs = this.tagSystem.searchAndFilter(this.currentSearchQuery, selectedTagsArray);

        // Apply sorting
        this.filteredPDFs.sort((a, b) => {
            switch (this.currentSort) {
                case 'date':
                    return new Date(b.uploadDate) - new Date(a.uploadDate);
                case 'size':
                    const sizeA = a.fileSize || 0;
                    const sizeB = b.fileSize || 0;
                    return sizeB - sizeA;
                case 'name':
                default:
                    return a.title.localeCompare(b.title);
            }
        });

        Logger.debug('Filters and sort applied', {
            resultCount: this.filteredPDFs.length,
            totalCount: this.allPDFs.length
        });
    }

    renderDirectory() {
        Logger.debug('Rendering directory', {
            totalPDFs: this.allPDFs.length,
            filteredPDFs: this.filteredPDFs.length,
            currentPage: this.currentPage
        });

        // Render tag cloud
        this.renderTagCloud();

        // Render PDF list
        this.renderPDFList();

        // Render pagination
        this.renderPagination();

        // Update results count
        this.updateResultsCount();

        // Update filter state indicators
        this.updateFilterIndicators();
    }

    renderTagCloud() {
        if (!this.tagCloud) return;

        Logger.debug('Rendering tag cloud with TagSystem');

        // Use TagSystem to render the tag cloud
        this.tagSystem.renderTagCloud(this.tagCloud, {
            sortBy: 'popularity',
            showCounts: true,
            clickable: true,
            activeTag: this.currentTagFilter,
            onTagClick: (tag, event) => {
                event.preventDefault();
                this.handleTagFilter(tag);
            }
        });

        // Add clear filters button if any tags are selected
        if (this.selectedTags.size > 0) {
            const clearBtn = DOM.createElement('button', 'tag clear-filters', 'Clear All');
            clearBtn.setAttribute('type', 'button');
            clearBtn.setAttribute('aria-label', 'Clear all tag filters');
            clearBtn.addEventListener('click', () => this.clearTagFilters());

            this.tagCloud.appendChild(clearBtn);
        }

        // Update active states for selected tags
        const tagElements = this.tagCloud.querySelectorAll('.tag:not(.clear-filters)');
        tagElements.forEach(tagEl => {
            const tag = tagEl.getAttribute('data-tag');
            if (this.selectedTags.has(tag)) {
                tagEl.classList.add('active');
                tagEl.setAttribute('aria-pressed', 'true');
            } else {
                tagEl.classList.remove('active');
                tagEl.setAttribute('aria-pressed', 'false');
            }
        });
    }

    renderPDFList() {
        if (!this.pdfListContainer) return;

        Logger.debug('Rendering PDF list');

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedPDFs = this.filteredPDFs.slice(startIndex, endIndex);

        // Clear container
        this.pdfListContainer.innerHTML = '';

        // Handle empty state
        if (this.filteredPDFs.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Render PDF cards with lazy loading for better performance
        paginatedPDFs.forEach((pdf, index) => {
            // Enable lazy loading for cards beyond the first 3
            const enableLazyLoading = index > 2;
            const card = this.createDirectoryPDFCard(pdf, enableLazyLoading);
            this.pdfListContainer.appendChild(card);
        });

        // Optimize images if performance optimizer is available
        if (window.PerformanceOptimizer) {
            const images = this.pdfListContainer.querySelectorAll('img');
            images.forEach(img => window.PerformanceOptimizer.optimizeImage(img));
        }

        Logger.debug('PDF list rendered', {
            displayed: paginatedPDFs.length,
            total: this.filteredPDFs.length
        });
    }

    createDirectoryPDFCard(pdf, enableLazyLoading = false) {
        const card = DOM.createElement('article', 'pdf-card');
        card.setAttribute('role', 'article');
        card.setAttribute('aria-labelledby', `pdf-title-${pdf.filename}`);

        // Add thumbnail container if performance optimizer is available and lazy loading is enabled
        if (window.PerformanceOptimizer && enableLazyLoading) {
            const thumbnailContainer = DOM.createElement('div', 'pdf-thumbnail');
            card.appendChild(thumbnailContainer);
            
            // Enable lazy loading for the card
            window.PerformanceOptimizer.enableLazyLoading(card, {
                pdfData: pdf,
                loadThumbnail: true
            });
            
            return card; // Return early, content will be loaded lazily
        }

        // Standard card creation (non-lazy)
        return this.createStandardDirectoryPDFCard(pdf);
    }

    createStandardDirectoryPDFCard(pdf) {
        const card = DOM.createElement('article', 'pdf-card');
        card.setAttribute('role', 'article');
        card.setAttribute('aria-labelledby', `pdf-title-${pdf.filename}`);

        // Title
        const title = DOM.createElement('h3', '', pdf.title);
        title.id = `pdf-title-${pdf.filename}`;
        card.appendChild(title);

        // Description
        if (pdf.description) {
            const description = DOM.createElement('p', '', pdf.description);
            card.appendChild(description);
        }

        // Metadata
        const metadata = DOM.createElement('div', 'metadata');
        const uploadDate = new Date(pdf.uploadDate).toLocaleDateString();
        let metadataText = `Added: ${uploadDate}`;

        if (pdf.fileSize) {
            const fileSize = formatFileSize(pdf.fileSize);
            metadataText += ` • Size: ${fileSize}`;
        }

        if (pdf.pageCount) {
            metadataText += ` • Pages: ${pdf.pageCount}`;
        }

        metadata.textContent = metadataText;
        card.appendChild(metadata);

        // Tags
        if (pdf.tags && pdf.tags.length > 0) {
            const tagsContainer = DOM.createElement('div', 'tags');
            tagsContainer.setAttribute('aria-label', 'Document tags');

            pdf.tags.forEach(tag => {
                const tagEl = DOM.createElement('button', 'tag', tag);
                tagEl.setAttribute('type', 'button');
                tagEl.setAttribute('aria-label', `Filter by tag: ${tag}`);

                // Mark active tag
                if (this.currentTagFilter === tag) {
                    tagEl.classList.add('active');
                }

                // Add click handler for tag filtering
                tagEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleTagFilter(tag);
                });

                tagsContainer.appendChild(tagEl);
            });

            card.appendChild(tagsContainer);
        }

        // Actions
        const actions = DOM.createElement('div', 'actions');

        // View button
        const viewBtn = DOM.createElement('a', 'btn btn-primary btn-small', 'View PDF');
        viewBtn.href = `viewer.html?file=${encodeURIComponent(pdf.filename)}.pdf`;
        viewBtn.setAttribute('role', 'button');
        viewBtn.setAttribute('aria-label', `View ${pdf.title}`);
        actions.appendChild(viewBtn);

        // Download button
        const downloadBtn = DOM.createElement('a', 'btn btn-secondary btn-small', 'Download');
        downloadBtn.href = `${CONFIG.pdfDirectory}${pdf.filename}.pdf`;
        downloadBtn.download = `${pdf.filename}.pdf`;
        downloadBtn.setAttribute('role', 'button');
        downloadBtn.setAttribute('aria-label', `Download ${pdf.title}`);
        actions.appendChild(downloadBtn);

        card.appendChild(actions);

        // Add keyboard navigation
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                viewBtn.click();
            }
        });

        return card;
    }

    renderEmptyState() {
        let title, message, showClearButton = false;

        if (this.currentSearchQuery || this.selectedTags.size > 0) {
            title = 'No matching documents found';
            message = 'Try adjusting your search terms or filters.';
            showClearButton = true;
        } else {
            title = 'No documents available';
            message = 'No PDF files have been added to the library yet.';
        }

        const emptyState = DOM.createElement('div', 'no-results');
        emptyState.innerHTML = `
            <h3>${title}</h3>
            <p>${message}</p>
            ${showClearButton ? '<button class="clear-filters-btn btn btn-secondary" type="button">Clear All Filters</button>' : ''}
        `;

        if (showClearButton) {
            const clearBtn = emptyState.querySelector('.clear-filters-btn');
            clearBtn.addEventListener('click', () => this.clearAllFilters());
        }

        this.pdfListContainer.appendChild(emptyState);
    }

    clearAllFilters() {
        Logger.debug('Clearing all filters');
        this.currentSearchQuery = '';
        this.selectedTags.clear();
        this.currentTagFilter = null;
        this.currentPage = 1;

        // Clear search input
        if (this.searchInput) {
            this.searchInput.value = '';
        }

        this.applyFiltersAndSort();
        this.renderDirectory();
        this.updateURL();
    }

    renderPagination() {
        if (!this.paginationContainer) return;

        const totalPages = Math.ceil(this.filteredPDFs.length / this.itemsPerPage);

        // Clear container
        this.paginationContainer.innerHTML = '';

        // Don't show pagination if only one page or no results
        if (totalPages <= 1) {
            return;
        }

        Logger.debug('Rendering pagination', { currentPage: this.currentPage, totalPages });

        // Previous button
        const prevBtn = DOM.createElement('button', '', 'Previous');
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        this.paginationContainer.appendChild(prevBtn);

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            const firstBtn = DOM.createElement('button', '', '1');
            firstBtn.addEventListener('click', () => this.goToPage(1));
            this.paginationContainer.appendChild(firstBtn);

            if (startPage > 2) {
                const ellipsis = DOM.createElement('span', 'pagination-ellipsis', '...');
                this.paginationContainer.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = DOM.createElement('button', '', i.toString());
            if (i === this.currentPage) {
                pageBtn.classList.add('current-page');
                pageBtn.setAttribute('aria-current', 'page');
            }
            pageBtn.addEventListener('click', () => this.goToPage(i));
            this.paginationContainer.appendChild(pageBtn);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = DOM.createElement('span', 'pagination-ellipsis', '...');
                this.paginationContainer.appendChild(ellipsis);
            }

            const lastBtn = DOM.createElement('button', '', totalPages.toString());
            lastBtn.addEventListener('click', () => this.goToPage(totalPages));
            this.paginationContainer.appendChild(lastBtn);
        }

        // Next button
        const nextBtn = DOM.createElement('button', '', 'Next');
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        this.paginationContainer.appendChild(nextBtn);

        // Page info
        const pageInfo = DOM.createElement('div', 'pagination-info');
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredPDFs.length);
        pageInfo.textContent = `Showing ${startItem}-${endItem} of ${this.filteredPDFs.length}`;
        this.paginationContainer.appendChild(pageInfo);
    }

    updateResultsCount() {
        // Add or update results count display
        let resultsCount = document.querySelector('.results-count');
        if (!resultsCount) {
            resultsCount = DOM.createElement('div', 'results-count');
            if (this.pdfListContainer && this.pdfListContainer.parentNode) {
                this.pdfListContainer.parentNode.insertBefore(resultsCount, this.pdfListContainer);
            }
        }

        const total = this.filteredPDFs.length;
        const totalAll = this.allPDFs.length;

        if (this.currentSearchQuery || this.currentTagFilter) {
            resultsCount.textContent = `Found ${total} of ${totalAll} documents`;
        } else {
            resultsCount.textContent = `${total} documents available`;
        }
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredPDFs.length / this.itemsPerPage);

        if (page < 1 || page > totalPages) {
            return;
        }

        this.currentPage = page;
        this.renderPDFList();
        this.renderPagination();
        this.updateURL();

        // Scroll to top of results
        if (this.pdfListContainer) {
            this.pdfListContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    updateFilterIndicators() {
        // Create or update filter indicators container
        let filterIndicators = document.querySelector('.filter-indicators');
        if (!filterIndicators) {
            filterIndicators = DOM.createElement('div', 'filter-indicators');

            // Insert after search container
            const searchContainer = document.querySelector('.search-filters');
            if (searchContainer && searchContainer.parentNode) {
                searchContainer.parentNode.insertBefore(filterIndicators, searchContainer.nextSibling);
            }
        }

        // Clear existing indicators
        filterIndicators.innerHTML = '';

        const hasFilters = this.currentSearchQuery || this.selectedTags.size > 0;

        if (!hasFilters) {
            filterIndicators.style.display = 'none';
            return;
        }

        filterIndicators.style.display = 'block';

        // Add title
        const title = DOM.createElement('h4', 'filter-title', 'Active Filters:');
        filterIndicators.appendChild(title);

        const filtersContainer = DOM.createElement('div', 'active-filters');

        // Add search query indicator
        if (this.currentSearchQuery) {
            const searchIndicator = DOM.createElement('span', 'filter-indicator search-filter');
            searchIndicator.innerHTML = `
                Search: "${this.currentSearchQuery}"
                <button type="button" class="remove-filter" aria-label="Remove search filter">×</button>
            `;

            const removeBtn = searchIndicator.querySelector('.remove-filter');
            removeBtn.addEventListener('click', () => {
                this.currentSearchQuery = '';
                if (this.searchInput) {
                    this.searchInput.value = '';
                }
                this.currentPage = 1;
                this.applyFiltersAndSort();
                this.renderDirectory();
                this.updateURL();
            });

            filtersContainer.appendChild(searchIndicator);
        }

        // Add tag filter indicators
        this.selectedTags.forEach(tag => {
            const tagIndicator = DOM.createElement('span', 'filter-indicator tag-filter');
            tagIndicator.innerHTML = `
                Tag: ${tag}
                <button type="button" class="remove-filter" aria-label="Remove tag filter: ${tag}">×</button>
            `;

            const removeBtn = tagIndicator.querySelector('.remove-filter');
            removeBtn.addEventListener('click', () => {
                this.selectedTags.delete(tag);
                this.currentTagFilter = this.selectedTags.size > 0 ? Array.from(this.selectedTags)[0] : null;
                this.currentPage = 1;
                this.applyFiltersAndSort();
                this.renderDirectory();
                this.updateURL();
            });

            filtersContainer.appendChild(tagIndicator);
        });

        // Add clear all button
        if (hasFilters) {
            const clearAllBtn = DOM.createElement('button', 'clear-all-filters btn btn-small btn-secondary', 'Clear All');
            clearAllBtn.setAttribute('type', 'button');
            clearAllBtn.addEventListener('click', () => this.clearAllFilters());
            filtersContainer.appendChild(clearAllBtn);
        }

        filterIndicators.appendChild(filtersContainer);
    }

    showLoadingState() {
        if (this.pdfListContainer) {
            this.pdfListContainer.innerHTML = `
                <div class="loading-state" aria-live="polite">
                    <p>Loading PDF directory...</p>
                </div>
            `;
        }
    }

    clearFilters() {
        Logger.debug('Clearing all filters');

        this.currentSearchQuery = '';
        this.currentTagFilter = null;
        this.currentPage = 1;

        if (this.searchInput) {
            this.searchInput.value = '';
        }

        this.applyFiltersAndSort();
        this.renderDirectory();
        this.updateURL();
    }

    updateURL() {
        const params = new URLSearchParams();

        if (this.currentSearchQuery) {
            params.set('search', this.currentSearchQuery);
        }

        if (this.currentTagFilter) {
            params.set('tag', this.currentTagFilter);
        }

        if (this.currentSort !== 'name') {
            params.set('sort', this.currentSort);
        }

        if (this.currentPage > 1) {
            params.set('page', this.currentPage.toString());
        }

        const newURL = params.toString() ?
            `${window.location.pathname}?${params.toString()}` :
            window.location.pathname;

        window.history.replaceState({}, '', newURL);
    }

    showLoadingState() {
        if (this.pdfListContainer) {
            showLoadingState(this.pdfListContainer, 'Loading PDF directory...');
        }
    }
}

function showDirectoryError(message) {
    const main = document.querySelector('main');
    if (main) {
        const errorDiv = DOM.createElement('div', 'error-state');
        errorDiv.setAttribute('role', 'alert');
        errorDiv.innerHTML = `
            <h2>Error Loading Directory</h2>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        `;
        main.insertBefore(errorDiv, main.firstChild);
    }
}

async function initViewerPage() {
    Logger.info('Initializing viewer page');

    try {
        // Get PDF filename from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const pdfFile = urlParams.get('file');

        if (!pdfFile) {
            Logger.error('No PDF file specified in URL');
            showViewerError('No PDF file specified. Please select a document from the directory.');
            return;
        }

        Logger.debug('Initializing PDF viewer', { file: pdfFile });

        // Initialize PDF manager
        const pdfManager = new PDFManager(CONFIG.pdfDirectory);

        // Initialize PDF viewer
        const canvas = document.getElementById('pdf-canvas');
        if (!canvas) {
            throw new Error('PDF canvas element not found');
        }

        const pdfViewer = new PDFViewer(canvas);

        // Load the PDF
        const pdfUrl = `${CONFIG.pdfDirectory}${pdfFile}`;
        await pdfViewer.loadPDF(pdfUrl);

        // Set up viewer controls
        setupViewerControls(pdfViewer);

        // Set up touch gestures for mobile
        setupTouchGestures(pdfViewer);

        // Load PDF metadata for display
        await loadPDFMetadataForViewer(pdfManager, pdfFile);

        // Initialize comment system
        await initializeCommentSystem(pdfFile);

        Logger.info('PDF viewer initialized successfully', { file: pdfFile });

    } catch (error) {
        Logger.error('Failed to initialize PDF viewer', error);
        showViewerError(`Failed to load PDF viewer: ${error.message}`);
    }
}

// Initialize comment system for PDF viewer
async function initializeCommentSystem(pdfFile) {
    Logger.info('Initializing comment system', { pdfFile });

    try {
        // Load configuration
        const config = await loadConfiguration();
        
        if (!config || !config.giscus) {
            Logger.error('Comment system: No Giscus configuration found');
            showCommentFallback('Configuration not available');
            return;
        }

        // Check if comments are enabled
        if (config.features && config.features.comments === false) {
            Logger.info('Comment system: Comments disabled in configuration');
            hideCommentsSection();
            return;
        }

        // Create comment integration instance
        const commentIntegration = new CommentIntegration(config.giscus);

        // Check if comments are available
        if (!commentIntegration.isCommentsAvailable()) {
            Logger.error('Comment system: Comments not available');
            showCommentFallback('Comments not available');
            return;
        }

        // Extract PDF ID from filename (remove .pdf extension)
        const pdfId = pdfFile.replace(/\.pdf$/i, '');

        // Initialize comments for this specific PDF
        const initResult = await commentIntegration.initializeComments(pdfId);
        
        if (!initResult) {
            Logger.error('Comment system: Failed to initialize comments');
            showCommentFallback('Failed to initialize comments');
            return;
        }

        // Get comments container
        const commentsContainer = document.getElementById('comments-container');
        
        if (!commentsContainer) {
            Logger.error('Comment system: Comments container not found');
            return;
        }

        // Setup Giscus widget
        const setupResult = await commentIntegration.setupGiscus(commentsContainer);
        
        if (setupResult) {
            Logger.info('Comment system: Successfully initialized', { pdfId });
            showCommentsSection();
        } else {
            Logger.error('Comment system: Failed to setup Giscus widget');
            showCommentFallback('Failed to load comments');
        }

    } catch (error) {
        Logger.error('Comment system: Initialization failed', error);
        showCommentFallback('Error loading comments');
    }
}

// Load configuration from config.json
async function loadConfiguration() {
    try {
        const response = await fetch('./config.json');
        if (!response.ok) {
            throw new Error(`Failed to load configuration: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        Logger.error('Failed to load configuration', error);
        return null;
    }
}

// Show comments section
function showCommentsSection() {
    const commentsSection = document.getElementById('comments-section');
    if (commentsSection) {
        commentsSection.style.display = 'block';
        commentsSection.setAttribute('aria-hidden', 'false');
    }
}

// Hide comments section
function hideCommentsSection() {
    const commentsSection = document.getElementById('comments-section');
    if (commentsSection) {
        commentsSection.style.display = 'none';
        commentsSection.setAttribute('aria-hidden', 'true');
    }
}

// Show fallback message in comments container
async function showCommentFallback(message) {
    const commentsContainer = document.getElementById('comments-container');
    if (commentsContainer) {
        // Repository links come from config.json (overwritten at build time with
        // the real repository) so they follow the repo when it is renamed/moved
        let repo = '';
        try {
            const config = await loadConfiguration();
            repo = (config && (config.github?.repo || config.giscus?.repo)) || '';
        } catch (error) {
            Logger.debug('Comment fallback: configuration unavailable', { error });
        }

        const discussionLinks = repo ? `
                <p>You can still discuss this document by:</p>
                <ul>
                    <li><a href="https://github.com/${repo}/discussions" target="_blank" rel="noopener">Creating a GitHub Discussion</a></li>
                    <li><a href="https://github.com/${repo}/issues/new" target="_blank" rel="noopener">Opening an Issue</a></li>
                </ul>` : '';

        commentsContainer.innerHTML = `
            <div class="comment-fallback">
                <p>${message}</p>${discussionLinks}
            </div>
        `;
    }
    showCommentsSection(); // Still show the section with fallback
}

// PDFViewer class for rendering PDFs with PDF.js
class PDFViewer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pdfDoc = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.0;
        this.renderTask = null;
        this.pdfUrl = null;

        // Configure PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        Logger.debug('PDFViewer initialized', { canvas: !!canvas });
    }

    /**
     * Load and display a PDF file
     * @param {string} url - URL to the PDF file
     * @returns {Promise<void>}
     */
    async loadPDF(url) {
        try {
            Logger.info('Loading PDF', { url });

            // Show loading indicator
            this.showLoadingIndicator(true);
            this.hideErrorMessage();

            // Store URL for download functionality
            this.pdfUrl = url;

            // Load the PDF document
            const loadingTask = pdfjsLib.getDocument(url);
            this.pdfDoc = await loadingTask.promise;

            this.totalPages = this.pdfDoc.numPages;
            this.currentPage = 1;

            Logger.info('PDF loaded successfully', {
                url,
                pages: this.totalPages
            });

            // Render the first page
            await this.renderPage(this.currentPage);

            // Update UI
            this.updatePageInfo();
            this.updateControls();

            // Hide loading indicator
            this.showLoadingIndicator(false);

        } catch (error) {
            Logger.error('Failed to load PDF', { url, error });
            this.showLoadingIndicator(false);
            this.showErrorMessage(`Failed to load PDF: ${error.message}`);
            throw error;
        }
    }

    /**
     * Render a specific page of the PDF
     * @param {number} pageNum - Page number to render (1-based)
     * @returns {Promise<void>}
     */
    async renderPage(pageNum) {
        try {
            if (!this.pdfDoc) {
                throw new Error('No PDF document loaded');
            }

            if (pageNum < 1 || pageNum > this.totalPages) {
                throw new Error(`Invalid page number: ${pageNum}`);
            }

            Logger.debug('Rendering page', { pageNum, scale: this.scale });

            // Cancel any ongoing render task
            if (this.renderTask) {
                this.renderTask.cancel();
            }

            // Get the page
            const page = await this.pdfDoc.getPage(pageNum);

            // Calculate viewport
            const viewport = page.getViewport({ scale: this.scale });

            // Set canvas dimensions
            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;

            // Render the page
            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };

            this.renderTask = page.render(renderContext);
            await this.renderTask.promise;

            this.currentPage = pageNum;

            Logger.debug('Page rendered successfully', { pageNum });

        } catch (error) {
            if (error.name === 'RenderingCancelledException') {
                Logger.debug('Page rendering cancelled', { pageNum });
                return;
            }

            Logger.error('Failed to render page', { pageNum, error });
            throw error;
        }
    }

    /**
     * Navigate to the next page
     * @returns {Promise<void>}
     */
    async nextPage() {
        if (this.currentPage < this.totalPages) {
            await this.renderPage(this.currentPage + 1);
            this.updatePageInfo();
            this.updateControls();
        }
    }

    /**
     * Navigate to the previous page
     * @returns {Promise<void>}
     */
    async prevPage() {
        if (this.currentPage > 1) {
            await this.renderPage(this.currentPage - 1);
            this.updatePageInfo();
            this.updateControls();
        }
    }

    /**
     * Go to a specific page
     * @param {number} pageNum - Page number to navigate to (1-based)
     * @returns {Promise<void>}
     */
    async goToPage(pageNum) {
        const page = parseInt(pageNum, 10);
        if (page >= 1 && page <= this.totalPages) {
            await this.renderPage(page);
            this.updatePageInfo();
            this.updateControls();
        }
    }

    /**
     * Set zoom level
     * @param {number} scale - Scale factor (1.0 = 100%)
     * @returns {Promise<void>}
     */
    async setZoom(scale) {
        if (scale > 0 && scale <= 5.0) { // Limit zoom to reasonable range
            this.scale = scale;
            await this.renderPage(this.currentPage);
            this.updateZoomDisplay();
        }
    }

    /**
     * Zoom in
     * @returns {Promise<void>}
     */
    async zoomIn() {
        const newScale = Math.min(this.scale * 1.25, 5.0);
        await this.setZoom(newScale);
    }

    /**
     * Zoom out
     * @returns {Promise<void>}
     */
    async zoomOut() {
        const newScale = Math.max(this.scale / 1.25, 0.25);
        await this.setZoom(newScale);
    }

    /**
     * Fit PDF to canvas width
     * @returns {Promise<void>}
     */
    async fitToWidth() {
        if (!this.pdfDoc) return;

        try {
            const page = await this.pdfDoc.getPage(this.currentPage);
            const viewport = page.getViewport({ scale: 1.0 });

            const container = this.canvas.parentElement;
            const containerWidth = container.clientWidth - 40; // Account for padding

            const scale = containerWidth / viewport.width;
            await this.setZoom(scale);

        } catch (error) {
            Logger.error('Failed to fit to width', error);
        }
    }

    /**
     * Fit PDF to canvas height
     * @returns {Promise<void>}
     */
    async fitToHeight() {
        if (!this.pdfDoc) return;

        try {
            const page = await this.pdfDoc.getPage(this.currentPage);
            const viewport = page.getViewport({ scale: 1.0 });

            const container = this.canvas.parentElement;
            const containerHeight = window.innerHeight - 200; // Account for header and controls

            const scale = containerHeight / viewport.height;
            await this.setZoom(scale);

        } catch (error) {
            Logger.error('Failed to fit to height', error);
        }
    }

    /**
     * Get download URL for the PDF
     * @returns {string|null} Download URL or null if no PDF loaded
     */
    getDownloadUrl() {
        return this.pdfUrl;
    }

    /**
     * Update page information display
     */
    updatePageInfo() {
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }

        const pageInput = document.getElementById('page-input');
        if (pageInput) {
            pageInput.value = this.currentPage;
            pageInput.max = this.totalPages;
        }

        // Update canvas accessibility label
        if (this.canvas) {
            this.canvas.setAttribute('aria-label',
                `PDF document page ${this.currentPage} of ${this.totalPages}`);
        }
    }

    /**
     * Update control button states
     */
    updateControls() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages;
        }
    }

    /**
     * Update zoom level display
     */
    updateZoomDisplay() {
        const zoomLevel = document.getElementById('zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.scale * 100)}%`;
        }
    }

    /**
     * Show or hide loading indicator
     * @param {boolean} show - Whether to show the loading indicator
     */
    showLoadingIndicator(show) {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showErrorMessage(message) {
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.querySelector('p').textContent = message;
            errorEl.style.display = 'block';
        }
    }

    /**
     * Hide error message
     */
    hideErrorMessage() {
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }
}

/**
 * Set up event listeners for PDF viewer controls
 * @param {PDFViewer} pdfViewer - The PDF viewer instance
 */
function setupViewerControls(pdfViewer) {
    Logger.debug('Setting up PDF viewer controls');

    // Page navigation controls
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageInput = document.getElementById('page-input');
    const goToPageBtn = document.getElementById('go-to-page');

    if (prevBtn) {
        prevBtn.addEventListener('click', async () => {
            try {
                await pdfViewer.prevPage();
            } catch (error) {
                Logger.error('Error navigating to previous page', error);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            try {
                await pdfViewer.nextPage();
            } catch (error) {
                Logger.error('Error navigating to next page', error);
            }
        });
    }

    if (pageInput && goToPageBtn) {
        const goToPage = async () => {
            try {
                const pageNum = parseInt(pageInput.value, 10);
                await pdfViewer.goToPage(pageNum);
            } catch (error) {
                Logger.error('Error navigating to page', error);
            }
        };

        goToPageBtn.addEventListener('click', goToPage);
        pageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                goToPage();
            }
        });
    }

    // Zoom controls
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const fitWidthBtn = document.getElementById('fit-width');
    const fitHeightBtn = document.getElementById('fit-height');

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', async () => {
            try {
                await pdfViewer.zoomIn();
            } catch (error) {
                Logger.error('Error zooming in', error);
            }
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', async () => {
            try {
                await pdfViewer.zoomOut();
            } catch (error) {
                Logger.error('Error zooming out', error);
            }
        });
    }

    if (fitWidthBtn) {
        fitWidthBtn.addEventListener('click', async () => {
            try {
                await pdfViewer.fitToWidth();
            } catch (error) {
                Logger.error('Error fitting to width', error);
            }
        });
    }

    if (fitHeightBtn) {
        fitHeightBtn.addEventListener('click', async () => {
            try {
                await pdfViewer.fitToHeight();
            } catch (error) {
                Logger.error('Error fitting to height', error);
            }
        });
    }

    // Download control
    const downloadBtn = document.getElementById('download-pdf');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const downloadUrl = pdfViewer.getDownloadUrl();
            if (downloadUrl) {
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = downloadUrl.split('/').pop();
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                Logger.info('PDF download initiated', { url: downloadUrl });
            }
        });
    }

    // Back to directory control
    const backBtn = document.getElementById('back-to-directory');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'directory.html';
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', async (e) => {
        // Only handle shortcuts when not in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        try {
            switch (e.key) {
                case 'ArrowLeft':
                case 'PageUp':
                    e.preventDefault();
                    await pdfViewer.prevPage();
                    // Announce page change to screen readers
                    announcePageChange(pdfViewer.currentPage, pdfViewer.totalPages);
                    break;
                case 'ArrowRight':
                case 'PageDown':
                    e.preventDefault();
                    await pdfViewer.nextPage();
                    // Announce page change to screen readers
                    announcePageChange(pdfViewer.currentPage, pdfViewer.totalPages);
                    break;
                case 'Home':
                    e.preventDefault();
                    await pdfViewer.goToPage(1);
                    announcePageChange(pdfViewer.currentPage, pdfViewer.totalPages);
                    break;
                case 'End':
                    e.preventDefault();
                    await pdfViewer.goToPage(pdfViewer.totalPages);
                    announcePageChange(pdfViewer.currentPage, pdfViewer.totalPages);
                    break;
                case '+':
                case '=':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        await pdfViewer.zoomIn();
                        announceZoomChange(pdfViewer.scale);
                    }
                    break;
                case '-':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        await pdfViewer.zoomOut();
                        announceZoomChange(pdfViewer.scale);
                    }
                    break;
                case '0':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        await pdfViewer.setZoom(1.0);
                        announceZoomChange(pdfViewer.scale);
                    }
                    break;
                case 'Escape':
                    // Return focus to canvas for screen reader navigation
                    if (pdfViewer.canvas) {
                        pdfViewer.canvas.focus();
                    }
                    break;
            }
        } catch (error) {
            Logger.error('Error handling keyboard shortcut', error);
        }
    });

    Logger.info('PDF viewer controls set up successfully');
}

/**
 * Load and display PDF metadata in the viewer
 * @param {PDFManager} pdfManager - PDF manager instance
 * @param {string} pdfFile - PDF filename
 */
async function loadPDFMetadataForViewer(pdfManager, pdfFile) {
    try {
        Logger.debug('Loading PDF metadata for viewer', { pdfFile });

        const metadata = await pdfManager.getPDFMetadata(pdfFile);

        // Update page title
        document.title = `${metadata.title} - PDF Library`;

        // Update any metadata display elements if they exist
        const titleEl = document.querySelector('.pdf-title');
        if (titleEl) {
            titleEl.textContent = metadata.title;
        }

        const descriptionEl = document.querySelector('.pdf-description');
        if (descriptionEl && metadata.description) {
            descriptionEl.textContent = metadata.description;
        }

        Logger.info('PDF metadata loaded for viewer', { title: metadata.title });

    } catch (error) {
        Logger.error('Failed to load PDF metadata for viewer', error);
        // Don't throw error as this is not critical for PDF viewing
    }
}

/**
 * Show viewer error message
 * @param {string} message - Error message to display
 */
function showViewerError(message) {
    const main = document.querySelector('main');
    if (main) {
        const errorDiv = DOM.createElement('div', 'error-state');
        errorDiv.setAttribute('role', 'alert');
        errorDiv.innerHTML = `
            <h2>PDF Viewer Error</h2>
            <p>${message}</p>
            <div class="error-actions">
                <a href="directory.html" class="btn btn-primary">Back to Directory</a>
                <button class="btn btn-secondary" onclick="location.reload()">Retry</button>
            </div>
        `;
        main.insertBefore(errorDiv, main.firstChild);
    }
}
/**
 
* Announce page changes to screen readers
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 */
function announcePageChange(currentPage, totalPages) {
    const announcement = `Page ${currentPage} of ${totalPages}`;
    announceToScreenReader(announcement);
}

/**
 * Announce zoom changes to screen readers
 * @param {number} scale - Current zoom scale
 */
function announceZoomChange(scale) {
    const percentage = Math.round(scale * 100);
    const announcement = `Zoom level ${percentage} percent`;
    announceToScreenReader(announcement);
}

/**
 * Announce messages to screen readers using aria-live region
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
    // Create or get existing announcement region
    let announcer = document.getElementById('screen-reader-announcer');
    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'screen-reader-announcer';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        document.body.appendChild(announcer);
    }

    // Clear and set new message
    announcer.textContent = '';
    setTimeout(() => {
        announcer.textContent = message;
    }, 100);
}/**

 * Set up touch gestures for mobile PDF navigation
 * @param {PDFViewer} pdfViewer - The PDF viewer instance
 */
function setupTouchGestures(pdfViewer) {
    const canvas = pdfViewer.canvas;
    if (!canvas) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }
    }, { passive: true });

    canvas.addEventListener('touchend', async (e) => {
        if (e.changedTouches.length === 1) {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndTime = Date.now();

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const deltaTime = touchEndTime - touchStartTime;

            // Only process swipes that are quick and primarily horizontal
            if (deltaTime < 300 && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                try {
                    if (deltaX > 0) {
                        // Swipe right - previous page
                        await pdfViewer.prevPage();
                        announcePageChange(pdfViewer.currentPage, pdfViewer.totalPages);
                    } else {
                        // Swipe left - next page
                        await pdfViewer.nextPage();
                        announcePageChange(pdfViewer.currentPage, pdfViewer.totalPages);
                    }
                } catch (error) {
                    Logger.error('Error handling touch gesture', error);
                }
            }
        }
    }, { passive: true });

    Logger.debug('Touch gestures set up for PDF viewer');
}