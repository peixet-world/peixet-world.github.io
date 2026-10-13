// Tag System class for managing PDF categorization and filtering

class TagSystem {
    constructor(pdfManager) {
        this.pdfManager = pdfManager;
        this.allTags = new Set();
        this.tagCounts = new Map();
        this.allPDFs = [];
        this.filteredPDFs = [];
        this.initialized = false;
    }

    /**
     * Initialize the tag system by loading all PDFs and extracting tags
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            Logger.debug('Initializing TagSystem');
            
            // Load all PDF metadata
            this.allPDFs = await this.pdfManager.getAllMetadata();
            
            // Extract and count all tags
            this.extractAllTags();
            
            // Initialize filtered list with all PDFs
            this.filteredPDFs = [...this.allPDFs];
            
            this.initialized = true;
            Logger.info('TagSystem initialized', { 
                pdfCount: this.allPDFs.length, 
                tagCount: this.allTags.size 
            });
            
        } catch (error) {
            Logger.error('Failed to initialize TagSystem', error);
            throw new Error(`TagSystem initialization failed: ${error.message}`);
        }
    }

    /**
     * Extract all unique tags from PDF metadata and count their occurrences
     * @private
     */
    extractAllTags() {
        this.allTags.clear();
        this.tagCounts.clear();
        
        this.allPDFs.forEach(pdf => {
            if (Array.isArray(pdf.tags)) {
                pdf.tags.forEach(tag => {
                    if (typeof tag === 'string' && tag.trim().length > 0) {
                        const normalizedTag = tag.trim().toLowerCase();
                        this.allTags.add(normalizedTag);
                        
                        // Count tag occurrences
                        const currentCount = this.tagCounts.get(normalizedTag) || 0;
                        this.tagCounts.set(normalizedTag, currentCount + 1);
                    }
                });
            }
        });
        
        Logger.debug('Tags extracted', { 
            uniqueTags: this.allTags.size,
            tagCounts: Object.fromEntries(this.tagCounts)
        });
    }

    /**
     * Get all unique tags sorted alphabetically
     * @returns {Array<string>} Array of all unique tags
     */
    getAllTags() {
        this.ensureInitialized();
        return Array.from(this.allTags).sort();
    }

    /**
     * Get tag counts for all tags
     * @returns {Map<string, number>} Map of tag names to their occurrence counts
     */
    getTagCounts() {
        this.ensureInitialized();
        return new Map(this.tagCounts);
    }

    /**
     * Get tags sorted by popularity (most used first)
     * @returns {Array<{tag: string, count: number}>} Array of tag objects with counts
     */
    getTagsByPopularity() {
        this.ensureInitialized();
        return Array.from(this.tagCounts.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Filter PDFs by a specific tag
     * @param {string} tag - Tag to filter by
     * @returns {Array<Object>} Array of PDF metadata objects that have the specified tag
     */
    filterByTag(tag) {
        this.ensureInitialized();
        
        if (!tag || typeof tag !== 'string') {
            Logger.error('Invalid tag parameter for filtering', { tag });
            return [];
        }
        
        const normalizedTag = tag.trim().toLowerCase();
        Logger.debug('Filtering PDFs by tag', { tag: normalizedTag });
        
        const filtered = this.allPDFs.filter(pdf => {
            return Array.isArray(pdf.tags) && 
                   pdf.tags.some(pdfTag => 
                       typeof pdfTag === 'string' && 
                       pdfTag.trim().toLowerCase() === normalizedTag
                   );
        });
        
        this.filteredPDFs = filtered;
        Logger.info('PDFs filtered by tag', { 
            tag: normalizedTag, 
            resultCount: filtered.length,
            totalCount: this.allPDFs.length
        });
        
        return filtered;
    }

    /**
     * Filter PDFs by multiple tags (AND operation)
     * @param {Array<string>} tags - Array of tags to filter by
     * @returns {Array<Object>} Array of PDF metadata objects that have all specified tags
     */
    filterByTags(tags) {
        this.ensureInitialized();
        
        if (!Array.isArray(tags) || tags.length === 0) {
            Logger.debug('No tags provided for filtering, returning all PDFs');
            this.filteredPDFs = [...this.allPDFs];
            return this.filteredPDFs;
        }
        
        const normalizedTags = tags
            .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
            .map(tag => tag.trim().toLowerCase());
        
        if (normalizedTags.length === 0) {
            Logger.debug('No valid tags after normalization, returning all PDFs');
            this.filteredPDFs = [...this.allPDFs];
            return this.filteredPDFs;
        }
        
        Logger.debug('Filtering PDFs by multiple tags', { tags: normalizedTags });
        
        const filtered = this.allPDFs.filter(pdf => {
            if (!Array.isArray(pdf.tags)) return false;
            
            const pdfTags = pdf.tags
                .filter(tag => typeof tag === 'string')
                .map(tag => tag.trim().toLowerCase());
            
            // Check if PDF has all required tags
            return normalizedTags.every(requiredTag => 
                pdfTags.includes(requiredTag)
            );
        });
        
        this.filteredPDFs = filtered;
        Logger.info('PDFs filtered by multiple tags', { 
            tags: normalizedTags, 
            resultCount: filtered.length,
            totalCount: this.allPDFs.length
        });
        
        return filtered;
    }

    /**
     * Search PDFs by query string across titles, descriptions, filenames, and tags
     * @param {string} query - Search query
     * @returns {Array<Object>} Array of matching PDF metadata objects
     */
    searchPDFs(query) {
        this.ensureInitialized();
        
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            Logger.debug('Empty search query, returning all PDFs');
            this.filteredPDFs = [...this.allPDFs];
            return this.filteredPDFs;
        }
        
        const normalizedQuery = query.trim().toLowerCase();
        Logger.debug('Searching PDFs', { query: normalizedQuery });
        
        const filtered = this.allPDFs.filter(pdf => {
            // Search in title
            if (pdf.title && pdf.title.toLowerCase().includes(normalizedQuery)) {
                return true;
            }
            
            // Search in description
            if (pdf.description && pdf.description.toLowerCase().includes(normalizedQuery)) {
                return true;
            }
            
            // Search in filename
            if (pdf.filename && pdf.filename.toLowerCase().includes(normalizedQuery)) {
                return true;
            }
            
            // Search in author
            if (pdf.author && pdf.author.toLowerCase().includes(normalizedQuery)) {
                return true;
            }
            
            // Search in tags
            if (Array.isArray(pdf.tags)) {
                return pdf.tags.some(tag => 
                    typeof tag === 'string' && 
                    tag.toLowerCase().includes(normalizedQuery)
                );
            }
            
            return false;
        });
        
        this.filteredPDFs = filtered;
        Logger.info('PDF search completed', { 
            query: normalizedQuery, 
            resultCount: filtered.length,
            totalCount: this.allPDFs.length
        });
        
        return filtered;
    }

    /**
     * Combined search and tag filtering
     * @param {string} query - Search query (optional)
     * @param {Array<string>} tags - Tags to filter by (optional)
     * @returns {Array<Object>} Array of matching PDF metadata objects
     */
    searchAndFilter(query = '', tags = []) {
        this.ensureInitialized();
        
        Logger.debug('Combined search and filter', { query, tags });
        
        let results = [...this.allPDFs];
        
        // Apply tag filtering first
        if (Array.isArray(tags) && tags.length > 0) {
            const normalizedTags = tags
                .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
                .map(tag => tag.trim().toLowerCase());
            
            if (normalizedTags.length > 0) {
                results = results.filter(pdf => {
                    if (!Array.isArray(pdf.tags)) return false;
                    
                    const pdfTags = pdf.tags
                        .filter(tag => typeof tag === 'string')
                        .map(tag => tag.trim().toLowerCase());
                    
                    return normalizedTags.every(requiredTag => 
                        pdfTags.includes(requiredTag)
                    );
                });
            }
        }
        
        // Apply search query
        if (query && typeof query === 'string' && query.trim().length > 0) {
            const normalizedQuery = query.trim().toLowerCase();
            
            results = results.filter(pdf => {
                return (pdf.title && pdf.title.toLowerCase().includes(normalizedQuery)) ||
                       (pdf.description && pdf.description.toLowerCase().includes(normalizedQuery)) ||
                       (pdf.filename && pdf.filename.toLowerCase().includes(normalizedQuery)) ||
                       (pdf.author && pdf.author.toLowerCase().includes(normalizedQuery)) ||
                       (Array.isArray(pdf.tags) && pdf.tags.some(tag => 
                           typeof tag === 'string' && tag.toLowerCase().includes(normalizedQuery)
                       ));
            });
        }
        
        this.filteredPDFs = results;
        Logger.info('Combined search and filter completed', { 
            query, 
            tags, 
            resultCount: results.length,
            totalCount: this.allPDFs.length
        });
        
        return results;
    }

    /**
     * Get the current filtered PDF list
     * @returns {Array<Object>} Current filtered PDF list
     */
    getFilteredPDFs() {
        this.ensureInitialized();
        return [...this.filteredPDFs];
    }

    /**
     * Clear all filters and return to showing all PDFs
     * @returns {Array<Object>} All PDF metadata objects
     */
    clearFilters() {
        this.ensureInitialized();
        Logger.debug('Clearing all filters');
        this.filteredPDFs = [...this.allPDFs];
        return this.filteredPDFs;
    }

    /**
     * Render a tag cloud in the specified container
     * @param {HTMLElement} container - DOM element to render the tag cloud in
     * @param {Object} options - Rendering options
     */
    renderTagCloud(container, options = {}) {
        this.ensureInitialized();
        
        if (!container || !(container instanceof HTMLElement)) {
            Logger.error('Invalid container for tag cloud rendering', { container });
            return;
        }
        
        Logger.debug('Rendering tag cloud', { 
            container: container.id || container.className,
            tagCount: this.allTags.size
        });
        
        // Default options
        const config = {
            sortBy: 'alphabetical', // 'alphabetical' or 'popularity'
            maxTags: 50,
            showCounts: false,
            clickable: true,
            activeTag: null,
            onTagClick: null,
            ...options
        };
        
        // Clear container
        container.innerHTML = '';
        container.setAttribute('role', 'group');
        container.setAttribute('aria-label', 'Tag cloud for filtering documents');
        
        if (this.allTags.size === 0) {
            const noTagsMsg = document.createElement('p');
            noTagsMsg.className = 'no-tags';
            noTagsMsg.textContent = 'No tags available';
            container.appendChild(noTagsMsg);
            return;
        }
        
        // Get tags based on sort preference
        let tagsToRender;
        if (config.sortBy === 'popularity') {
            tagsToRender = this.getTagsByPopularity()
                .slice(0, config.maxTags)
                .map(item => ({ tag: item.tag, count: item.count }));
        } else {
            tagsToRender = this.getAllTags()
                .slice(0, config.maxTags)
                .map(tag => ({ tag, count: this.tagCounts.get(tag) || 0 }));
        }
        
        // Create tag elements
        tagsToRender.forEach(({ tag, count }) => {
            const tagElement = document.createElement(config.clickable ? 'button' : 'span');
            tagElement.className = 'tag';
            tagElement.setAttribute('data-tag', tag);
            
            // Set text content
            if (config.showCounts) {
                tagElement.textContent = `${tag} (${count})`;
            } else {
                tagElement.textContent = tag;
            }
            
            // Mark active tag
            if (config.activeTag && config.activeTag.toLowerCase() === tag) {
                tagElement.classList.add('active');
            }
            
            // Add accessibility attributes for clickable tags
            if (config.clickable) {
                tagElement.setAttribute('type', 'button');
                tagElement.setAttribute('role', 'button');
                tagElement.setAttribute('aria-label', `Filter by tag: ${tag}`);
                tagElement.setAttribute('aria-pressed', 
                    config.activeTag && config.activeTag.toLowerCase() === tag ? 'true' : 'false'
                );
                
                // Add click handler
                tagElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    Logger.debug('Tag clicked', { tag });
                    
                    if (typeof config.onTagClick === 'function') {
                        config.onTagClick(tag, e);
                    } else {
                        // Default behavior: filter by tag
                        this.filterByTag(tag);
                    }
                });
                
                // Add keyboard support
                tagElement.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        tagElement.click();
                    }
                });
            }
            
            container.appendChild(tagElement);
        });
        
        Logger.info('Tag cloud rendered', { 
            renderedTags: tagsToRender.length,
            totalTags: this.allTags.size
        });
    }

    /**
     * Refresh the tag system by reloading PDF data
     * @returns {Promise<void>}
     */
    async refresh() {
        Logger.debug('Refreshing TagSystem');
        this.initialized = false;
        await this.initialize();
    }

    /**
     * Get statistics about the tag system
     * @returns {Object} Statistics object
     */
    getStatistics() {
        this.ensureInitialized();
        
        const stats = {
            totalPDFs: this.allPDFs.length,
            totalTags: this.allTags.size,
            filteredPDFs: this.filteredPDFs.length,
            averageTagsPerPDF: this.allPDFs.length > 0 ? 
                this.allPDFs.reduce((sum, pdf) => sum + (pdf.tags ? pdf.tags.length : 0), 0) / this.allPDFs.length : 0,
            mostPopularTags: this.getTagsByPopularity().slice(0, 5),
            pdfsWithoutTags: this.allPDFs.filter(pdf => !pdf.tags || pdf.tags.length === 0).length
        };
        
        Logger.debug('Tag system statistics', stats);
        return stats;
    }

    /**
     * Ensure the tag system is initialized
     * @private
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('TagSystem not initialized. Call initialize() first.');
        }
    }
}