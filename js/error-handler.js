/**
 * Comprehensive error handling utilities for the PDF sharing website
 * Provides user-friendly error messages and graceful degradation
 */
class ErrorHandler {
    static ERROR_TYPES = {
        NETWORK: 'network',
        PDF_LOAD: 'pdf_load',
        METADATA: 'metadata',
        VALIDATION: 'validation',
        PERMISSION: 'permission',
        TIMEOUT: 'timeout',
        UNKNOWN: 'unknown'
    };

    static USER_MESSAGES = {
        [ErrorHandler.ERROR_TYPES.NETWORK]: 'Network connection issue. Please check your internet connection and try again.',
        [ErrorHandler.ERROR_TYPES.PDF_LOAD]: 'Unable to load PDF file. The file may be corrupted or unavailable.',
        [ErrorHandler.ERROR_TYPES.METADATA]: 'Unable to load document information. Some features may be limited.',
        [ErrorHandler.ERROR_TYPES.VALIDATION]: 'Invalid data format. Please refresh the page and try again.',
        [ErrorHandler.ERROR_TYPES.PERMISSION]: 'Access denied. You may not have permission to view this content.',
        [ErrorHandler.ERROR_TYPES.TIMEOUT]: 'Request timed out. Please try again later.',
        [ErrorHandler.ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please refresh the page and try again.'
    };

    /**
     * Wrap an async function with comprehensive error handling
     * @param {Function} asyncFn - Async function to wrap
     * @param {Object} options - Error handling options
     * @returns {Function} Wrapped function
     */
    static wrapAsync(asyncFn, options = {}) {
        const {
            context = 'operation',
            fallbackValue = null,
            showUserError = true,
            retryCount = 0,
            retryDelay = 1000
        } = options;

        return async function(...args) {
            let lastError;
            
            for (let attempt = 0; attempt <= retryCount; attempt++) {
                try {
                    Logger.startTimer(`${context}-attempt-${attempt}`);
                    const result = await asyncFn.apply(this, args);
                    Logger.endTimer(`${context}-attempt-${attempt}`);
                    
                    if (attempt > 0) {
                        Logger.info(`${context} succeeded after ${attempt} retries`);
                    }
                    
                    return result;
                } catch (error) {
                    lastError = error;
                    Logger.endTimer(`${context}-attempt-${attempt}`);
                    
                    if (attempt < retryCount) {
                        Logger.warn(`${context} failed, retrying in ${retryDelay}ms`, {
                            attempt: attempt + 1,
                            maxAttempts: retryCount + 1,
                            error: error.message
                        });
                        await ErrorHandler.delay(retryDelay);
                    }
                }
            }

            // All attempts failed
            const errorInfo = ErrorHandler.analyzeError(lastError);
            Logger.error(`${context} failed after ${retryCount + 1} attempts`, {
                error: lastError,
                errorType: errorInfo.type,
                userMessage: errorInfo.userMessage
            });

            if (showUserError) {
                ErrorHandler.showUserError(errorInfo.userMessage, context);
            }

            return fallbackValue;
        };
    }

    /**
     * Analyze an error and determine its type and user-friendly message
     * @param {Error} error - Error to analyze
     * @returns {Object} Error analysis result
     */
    static analyzeError(error) {
        let type = ErrorHandler.ERROR_TYPES.UNKNOWN;
        let userMessage = ErrorHandler.USER_MESSAGES[type];

        if (!error) {
            return { type, userMessage };
        }

        const errorMessage = error.message?.toLowerCase() || '';
        const errorName = error.name?.toLowerCase() || '';

        // Network errors
        if (errorMessage.includes('fetch') || 
            errorMessage.includes('network') ||
            errorMessage.includes('connection') ||
            errorName === 'networkerror') {
            type = ErrorHandler.ERROR_TYPES.NETWORK;
        }
        // PDF loading errors
        else if (errorMessage.includes('pdf') ||
                 errorMessage.includes('invalid pdf') ||
                 errorMessage.includes('corrupted')) {
            type = ErrorHandler.ERROR_TYPES.PDF_LOAD;
        }
        // Metadata errors
        else if (errorMessage.includes('metadata') ||
                 errorMessage.includes('manifest')) {
            type = ErrorHandler.ERROR_TYPES.METADATA;
        }
        // Validation errors
        else if (errorMessage.includes('validation') ||
                 errorMessage.includes('invalid') ||
                 errorMessage.includes('format')) {
            type = ErrorHandler.ERROR_TYPES.VALIDATION;
        }
        // Permission errors
        else if (errorMessage.includes('permission') ||
                 errorMessage.includes('forbidden') ||
                 errorMessage.includes('unauthorized') ||
                 error.status === 403 ||
                 error.status === 401) {
            type = ErrorHandler.ERROR_TYPES.PERMISSION;
        }
        // Timeout errors
        else if (errorMessage.includes('timeout') ||
                 errorMessage.includes('aborted') ||
                 errorName === 'timeouterror') {
            type = ErrorHandler.ERROR_TYPES.TIMEOUT;
        }

        userMessage = ErrorHandler.USER_MESSAGES[type];

        return { type, userMessage, originalError: error };
    }

    /**
     * Show a user-friendly error message
     * @param {string} message - Error message to display
     * @param {string} context - Context where error occurred
     * @param {Object} options - Display options
     */
    static showUserError(message, context = '', options = {}) {
        const {
            duration = 5000,
            type = 'error',
            containerId = null,
            allowDismiss = true
        } = options;

        Logger.debug('Showing user error', { message, context, type });

        // Try to find a specific container first
        let container = null;
        if (containerId) {
            container = document.getElementById(containerId);
        }

        // Fallback to common error containers
        if (!container) {
            container = document.querySelector('.error-container') ||
                       document.querySelector('main') ||
                       document.body;
        }

        if (!container) {
            // Last resort: use alert
            alert(`Error: ${message}`);
            return;
        }

        // Create error element
        const errorEl = document.createElement('div');
        errorEl.className = `user-error user-error-${type}`;
        errorEl.setAttribute('role', 'alert');
        errorEl.setAttribute('aria-live', 'assertive');

        const messageEl = document.createElement('p');
        messageEl.textContent = message;
        errorEl.appendChild(messageEl);

        if (context) {
            const contextEl = document.createElement('small');
            contextEl.textContent = `Context: ${context}`;
            contextEl.className = 'error-context';
            errorEl.appendChild(contextEl);
        }

        if (allowDismiss) {
            const dismissBtn = document.createElement('button');
            dismissBtn.textContent = '×';
            dismissBtn.className = 'error-dismiss';
            dismissBtn.setAttribute('aria-label', 'Dismiss error message');
            dismissBtn.addEventListener('click', () => {
                errorEl.remove();
            });
            errorEl.appendChild(dismissBtn);
        }

        // Insert at the top of the container
        container.insertBefore(errorEl, container.firstChild);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (errorEl.parentNode) {
                    errorEl.remove();
                }
            }, duration);
        }

        // Add CSS if not already present
        ErrorHandler.ensureErrorStyles();
    }

    /**
     * Show a success message to the user
     * @param {string} message - Success message
     * @param {string} context - Context
     * @param {Object} options - Display options
     */
    static showUserSuccess(message, context = '', options = {}) {
        ErrorHandler.showUserError(message, context, { ...options, type: 'success' });
    }

    /**
     * Show a warning message to the user
     * @param {string} message - Warning message
     * @param {string} context - Context
     * @param {Object} options - Display options
     */
    static showUserWarning(message, context = '', options = {}) {
        ErrorHandler.showUserError(message, context, { ...options, type: 'warning' });
    }

    /**
     * Create a graceful degradation handler
     * @param {Function} primaryFn - Primary function to try
     * @param {Function} fallbackFn - Fallback function
     * @param {string} context - Context for logging
     * @returns {Function} Handler function
     */
    static createGracefulHandler(primaryFn, fallbackFn, context = 'operation') {
        return async function(...args) {
            try {
                Logger.debug(`Attempting primary ${context}`);
                return await primaryFn.apply(this, args);
            } catch (error) {
                Logger.warn(`Primary ${context} failed, using fallback`, { error: error.message });
                
                try {
                    return await fallbackFn.apply(this, args);
                } catch (fallbackError) {
                    Logger.error(`Both primary and fallback ${context} failed`, {
                        primaryError: error.message,
                        fallbackError: fallbackError.message
                    });
                    throw fallbackError;
                }
            }
        };
    }

    /**
     * Wrap fetch requests with timeout and error handling
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise} Enhanced fetch promise
     */
    static async safeFetch(url, options = {}) {
        const {
            timeout = 10000,
            retries = 2,
            retryDelay = 1000,
            ...fetchOptions
        } = options;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const fetchWithTimeout = async () => {
            try {
                const response = await fetch(url, {
                    ...fetchOptions,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                
                if (error.name === 'AbortError') {
                    throw new Error('Request timed out');
                }
                
                throw error;
            }
        };

        // Wrap with retry logic
        const wrappedFetch = ErrorHandler.wrapAsync(fetchWithTimeout, {
            context: `fetch ${url}`,
            retryCount: retries,
            retryDelay,
            showUserError: false
        });

        return wrappedFetch();
    }

    /**
     * Ensure error styles are present in the document
     */
    static ensureErrorStyles() {
        if (document.getElementById('error-handler-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'error-handler-styles';
        style.textContent = `
            .user-error {
                padding: 12px 16px;
                margin: 10px 0;
                border-radius: 4px;
                border-left: 4px solid;
                position: relative;
                font-family: inherit;
                line-height: 1.4;
            }
            
            .user-error-error {
                background-color: #fef2f2;
                border-left-color: #ef4444;
                color: #991b1b;
            }
            
            .user-error-warning {
                background-color: #fffbeb;
                border-left-color: #f59e0b;
                color: #92400e;
            }
            
            .user-error-success {
                background-color: #f0fdf4;
                border-left-color: #10b981;
                color: #065f46;
            }
            
            .user-error p {
                margin: 0 0 4px 0;
                font-weight: 500;
            }
            
            .error-context {
                font-size: 0.875em;
                opacity: 0.8;
                display: block;
                margin-top: 4px;
            }
            
            .error-dismiss {
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                padding: 4px;
                line-height: 1;
                opacity: 0.6;
                transition: opacity 0.2s;
            }
            
            .error-dismiss:hover {
                opacity: 1;
            }
            
            @media (max-width: 768px) {
                .user-error {
                    margin: 8px 0;
                    padding: 10px 12px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Utility function to create a delay
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Handle unhandled promise rejections globally
     */
    static setupGlobalErrorHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            Logger.error('Unhandled promise rejection', {
                reason: event.reason,
                promise: event.promise
            });

            const errorInfo = ErrorHandler.analyzeError(event.reason);
            ErrorHandler.showUserError(
                errorInfo.userMessage,
                'Unexpected error',
                { duration: 8000 }
            );

            // Prevent the default browser error handling
            event.preventDefault();
        });

        window.addEventListener('error', (event) => {
            Logger.error('Global JavaScript error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });

            const errorInfo = ErrorHandler.analyzeError(event.error);
            ErrorHandler.showUserError(
                errorInfo.userMessage,
                'JavaScript error',
                { duration: 8000 }
            );
        });

        Logger.info('Global error handling setup complete');
    }
}

// Initialize global error handling when script loads
document.addEventListener('DOMContentLoaded', () => {
    ErrorHandler.setupGlobalErrorHandling();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}