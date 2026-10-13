/**
 * Centralized logging system for the PDF sharing website
 * Provides structured logging with different levels and performance timing
 */
class Logger {
    static DEBUG_MODE = false;
    static LOG_LEVELS = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    };
    
    static CURRENT_LEVEL = Logger.LOG_LEVELS.INFO;
    static performanceTimers = new Map();
    
    /**
     * Initialize the logger with configuration
     * @param {Object} config - Logger configuration
     */
    static init(config = {}) {
        Logger.DEBUG_MODE = config.debugMode || false;
        Logger.CURRENT_LEVEL = config.logLevel || Logger.LOG_LEVELS.INFO;
        
        // Set debug mode based on URL parameter or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debug') === 'true' || localStorage.getItem('debug') === 'true') {
            Logger.DEBUG_MODE = true;
            Logger.CURRENT_LEVEL = Logger.LOG_LEVELS.DEBUG;
        }
        
        Logger.info('Logger initialized', { 
            debugMode: Logger.DEBUG_MODE, 
            logLevel: Logger.CURRENT_LEVEL 
        });
    }
    
    /**
     * Log debug messages (only in debug mode)
     * @param {string} message - Log message
     * @param {Object} data - Additional data to log
     */
    static debug(message, data = {}) {
        if (Logger.CURRENT_LEVEL <= Logger.LOG_LEVELS.DEBUG) {
            Logger._log('DEBUG', message, data, console.debug);
        }
    }
    
    /**
     * Log informational messages
     * @param {string} message - Log message
     * @param {Object} data - Additional data to log
     */
    static info(message, data = {}) {
        if (Logger.CURRENT_LEVEL <= Logger.LOG_LEVELS.INFO) {
            Logger._log('INFO', message, data, console.log);
        }
    }
    
    /**
     * Log warning messages
     * @param {string} message - Log message
     * @param {Object} data - Additional data to log
     */
    static warn(message, data = {}) {
        if (Logger.CURRENT_LEVEL <= Logger.LOG_LEVELS.WARN) {
            Logger._log('WARN', message, data, console.warn);
        }
    }
    
    /**
     * Log error messages
     * @param {string} message - Log message
     * @param {Error|Object} error - Error object or additional data
     */
    static error(message, error = null) {
        const errorData = error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : error || {};
        
        Logger._log('ERROR', message, errorData, console.error);
    }
    
    /**
     * Start a performance timer
     * @param {string} label - Timer label
     */
    static startTimer(label) {
        Logger.performanceTimers.set(label, performance.now());
        Logger.debug(`Timer started: ${label}`);
    }
    
    /**
     * End a performance timer and log the duration
     * @param {string} label - Timer label
     * @returns {number} Duration in milliseconds
     */
    static endTimer(label) {
        const startTime = Logger.performanceTimers.get(label);
        if (startTime === undefined) {
            Logger.warn(`Timer '${label}' was not started`);
            return 0;
        }
        
        const duration = performance.now() - startTime;
        Logger.performanceTimers.delete(label);
        
        Logger.info(`Performance: ${label}`, { 
            duration: `${duration.toFixed(2)}ms`,
            durationMs: duration
        });
        
        return duration;
    }
    
    /**
     * Log a performance measurement
     * @param {string} operation - Operation name
     * @param {number} duration - Duration in milliseconds
     * @param {Object} additionalData - Additional performance data
     */
    static performance(operation, duration, additionalData = {}) {
        Logger.info(`Performance: ${operation}`, {
            duration: `${duration.toFixed(2)}ms`,
            durationMs: duration,
            ...additionalData
        });
    }
    
    /**
     * Toggle debug mode on/off
     */
    static toggleDebugMode() {
        Logger.DEBUG_MODE = !Logger.DEBUG_MODE;
        Logger.CURRENT_LEVEL = Logger.DEBUG_MODE ? Logger.LOG_LEVELS.DEBUG : Logger.LOG_LEVELS.INFO;
        localStorage.setItem('debug', Logger.DEBUG_MODE.toString());
        
        Logger.info('Debug mode toggled', { debugMode: Logger.DEBUG_MODE });
    }
    
    /**
     * Get current logger configuration
     * @returns {Object} Current configuration
     */
    static getConfig() {
        return {
            debugMode: Logger.DEBUG_MODE,
            logLevel: Logger.CURRENT_LEVEL,
            activeTimers: Array.from(Logger.performanceTimers.keys())
        };
    }
    
    /**
     * Internal logging method with structured format
     * @private
     */
    static _log(level, message, data, consoleFn) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...data
        };
        
        // Format for console output
        const prefix = `[${level}] ${timestamp}`;
        
        if (Object.keys(data).length > 0) {
            consoleFn(`${prefix} ${message}`, data);
        } else {
            consoleFn(`${prefix} ${message}`);
        }
        
        // Store in session for debugging if needed
        if (Logger.DEBUG_MODE) {
            Logger._storeLogEntry(logEntry);
        }
    }
    
    /**
     * Store log entry for debugging purposes
     * @private
     */
    static _storeLogEntry(logEntry) {
        try {
            const logs = JSON.parse(sessionStorage.getItem('pdf-website-logs') || '[]');
            logs.push(logEntry);
            
            // Keep only last 100 log entries
            if (logs.length > 100) {
                logs.splice(0, logs.length - 100);
            }
            
            sessionStorage.setItem('pdf-website-logs', JSON.stringify(logs));
        } catch (error) {
            // Silently fail if sessionStorage is not available
        }
    }
    
    /**
     * Get stored log entries for debugging
     * @returns {Array} Array of log entries
     */
    static getLogs() {
        try {
            return JSON.parse(sessionStorage.getItem('pdf-website-logs') || '[]');
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Clear stored log entries
     */
    static clearLogs() {
        try {
            sessionStorage.removeItem('pdf-website-logs');
            Logger.info('Log history cleared');
        } catch (error) {
            Logger.warn('Could not clear log history');
        }
    }
}

// Initialize logger when script loads
document.addEventListener('DOMContentLoaded', () => {
    Logger.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}