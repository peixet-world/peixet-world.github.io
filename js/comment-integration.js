// Comment Integration class for GitHub Discussions-based commenting

class CommentIntegration {
    constructor(repoConfig) {
        this.repoConfig = repoConfig;
        this.isGiscusLoaded = false;
        this.giscusConfig = {
            repo: repoConfig.repo,
            repoId: repoConfig.repoId,
            category: repoConfig.category || 'General',
            categoryId: repoConfig.categoryId,
            mapping: repoConfig.mapping || 'pathname',
            strict: '0',
            reactionsEnabled: '1',
            emitMetadata: '0',
            inputPosition: 'bottom',
            theme: repoConfig.theme || 'light',
            lang: 'en'
        };
        
        // Validate required configuration
        this.validateConfig();
    }

    /**
     * Validates that required Giscus configuration is present
     */
    validateConfig() {
        const missing = [];
        // repo must look like "owner/name"; the IDs must not be the example
        // placeholders from the setup guide
        if (!/^[^/\s]+\/[^/\s]+$/.test(this.giscusConfig.repo || '')) {
            missing.push('repo');
        }
        for (const key of ['repoId', 'categoryId']) {
            const value = this.giscusConfig[key];
            if (!value || /example/i.test(value)) {
                missing.push(key);
            }
        }
        
        if (missing.length > 0) {
            Logger.error('CommentIntegration: Missing or placeholder Giscus configuration', { missing });
            return false;
        }
        
        Logger.info('CommentIntegration: Configuration validated successfully');
        return true;
    }

    /**
     * Loads the Giscus script dynamically
     * @returns {Promise<boolean>} Success status
     */
    async loadGiscusScript() {
        if (this.isGiscusLoaded) {
            Logger.debug('CommentIntegration: Giscus script already loaded');
            return true;
        }

        try {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://giscus.app/client.js';
                script.setAttribute('data-repo', this.giscusConfig.repo);
                script.setAttribute('data-repo-id', this.giscusConfig.repoId);
                script.setAttribute('data-category', this.giscusConfig.category);
                script.setAttribute('data-category-id', this.giscusConfig.categoryId);
                // "specific" mapping requires a term; without one giscus would
                // search for the literal string "undefined" and every PDF would
                // share the same thread, so fall back to pathname in that case
                let mapping = this.giscusConfig.mapping;
                if (mapping === 'specific' && !this.giscusConfig.term) {
                    mapping = 'pathname';
                }

                script.setAttribute('data-mapping', mapping);
                if (mapping === 'specific') {
                    script.setAttribute('data-term', this.giscusConfig.term);
                }
                script.setAttribute('data-strict', this.giscusConfig.strict);
                script.setAttribute('data-reactions-enabled', this.giscusConfig.reactionsEnabled);
                script.setAttribute('data-emit-metadata', this.giscusConfig.emitMetadata);
                script.setAttribute('data-input-position', this.giscusConfig.inputPosition);
                script.setAttribute('data-theme', this.giscusConfig.theme);
                script.setAttribute('data-lang', this.giscusConfig.lang);
                script.crossOrigin = 'anonymous';
                script.async = true;

                script.onload = () => {
                    this.isGiscusLoaded = true;
                    Logger.info('CommentIntegration: Giscus script loaded successfully');
                    resolve(true);
                };

                script.onerror = (error) => {
                    Logger.error('CommentIntegration: Failed to load Giscus script', error);
                    reject(new Error('Failed to load Giscus script'));
                };

                document.head.appendChild(script);
            });
        } catch (error) {
            Logger.error('CommentIntegration: Error loading Giscus script', error);
            return false;
        }
    }

    /**
     * Initializes comments for a specific PDF
     * @param {string} pdfId - Unique identifier for the PDF
     * @returns {Promise<boolean>} Success status
     */
    async initializeComments(pdfId) {
        Logger.info('CommentIntegration: Initializing comments', { pdfId });

        if (!this.validateConfig()) {
            Logger.error('CommentIntegration: Cannot initialize comments - invalid configuration');
            return false;
        }

        try {
            // Update mapping to be PDF-specific
            this.giscusConfig.mapping = 'specific';
            this.giscusConfig.term = `pdf-${pdfId}`;
            
            Logger.debug('CommentIntegration: Comments initialized for PDF', { 
                pdfId, 
                mapping: this.giscusConfig.mapping,
                term: this.giscusConfig.term 
            });
            
            return true;
        } catch (error) {
            Logger.error('CommentIntegration: Failed to initialize comments', error);
            return false;
        }
    }

    /**
     * Sets up Giscus widget in the specified container
     * @param {HTMLElement} container - Container element for comments
     * @returns {Promise<boolean>} Success status
     */
    async setupGiscus(container) {
        if (!container) {
            Logger.error('CommentIntegration: No container provided for Giscus setup');
            return false;
        }

        if (!this.validateConfig()) {
            Logger.error('CommentIntegration: Cannot setup Giscus - invalid configuration');
            this.showFallbackMessage(container);
            return false;
        }

        try {
            Logger.info('CommentIntegration: Setting up Giscus widget');
            
            // Show loading state
            this.showLoadingState(container, 'Loading comments...');
            
            // The target div must be in the DOM before client.js executes:
            // giscus injects the iframe into the first .giscus div present at
            // that moment, otherwise it falls back to inserting one directly
            // after the (head-appended) script tag, where it renders nowhere
            this.clearContainer(container);
            const giscusDiv = document.createElement('div');
            giscusDiv.className = 'giscus';
            container.appendChild(giscusDiv);
            
            // Load Giscus script; client.js then fills our div with the iframe
            const success = await this.loadGiscusScript();
            
            if (success) {
                Logger.info('CommentIntegration: Giscus widget setup completed');
                return true;
            } else {
                throw new Error('Failed to load Giscus script');
            }
        } catch (error) {
            Logger.error('CommentIntegration: Failed to setup Giscus widget', error);
            this.showFallbackMessage(container, 'Failed to load comment system');
            return false;
        }
    }

    /**
     * Shows fallback message when comments are unavailable
     * @param {HTMLElement} container - Container element
     * @param {string} reason - Optional reason for fallback
     */
    showFallbackMessage(container, reason = 'Comments are currently unavailable') {
        container.innerHTML = `
            <div class="comment-fallback">
                <h3>Comments Unavailable</h3>
                <p>${reason}. You can still discuss this document by:</p>
                <ul>
                    <li><a href="https://github.com/${this.giscusConfig.repo}/discussions" target="_blank" rel="noopener">Creating a GitHub Discussion</a></li>
                    <li><a href="https://github.com/${this.giscusConfig.repo}/issues/new" target="_blank" rel="noopener">Opening an Issue</a></li>
                </ul>
            </div>
        `;
        Logger.info('CommentIntegration: Fallback message displayed', { reason });
    }

    /**
     * Shows loading state in container
     * @param {HTMLElement} container - Container element
     * @param {string} message - Loading message
     */
    showLoadingState(container, message = 'Loading comments...') {
        container.innerHTML = `
            <div class="giscus-loading">
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * Clears the container content
     * @param {HTMLElement} container - Container element
     */
    clearContainer(container) {
        if (container) {
            container.innerHTML = '';
        }
    }

    /**
     * Loads comments (placeholder for future implementation)
     */
    loadComments() {
        Logger.debug('CommentIntegration.loadComments() - to be implemented in task 7.2');
    }

    /**
     * Updates the theme of the Giscus widget
     * @param {string} theme - Theme name ('light', 'dark', etc.)
     */
    updateTheme(theme) {
        this.giscusConfig.theme = theme;
        Logger.debug('CommentIntegration: Theme updated', { theme });
        
        // Send message to Giscus iframe to update theme
        if (this.isGiscusLoaded) {
            const iframe = document.querySelector('iframe.giscus-frame');
            if (iframe) {
                iframe.contentWindow.postMessage({
                    giscus: {
                        setConfig: {
                            theme: theme
                        }
                    }
                }, 'https://giscus.app');
            }
        }
    }

    /**
     * Checks if comments are enabled and properly configured
     * @returns {boolean} Whether comments are available
     */
    isCommentsAvailable() {
        return this.validateConfig() && this.repoConfig.features?.comments !== false;
    }
}