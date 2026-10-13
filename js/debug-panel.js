/**
 * Debug panel for development and troubleshooting
 * Provides a UI for viewing logs and system information
 */
class DebugPanel {
    constructor() {
        this.isVisible = false;
        this.panel = null;
        this.logContainer = null;
        this.autoRefresh = false;
        this.refreshInterval = null;
        
        this.init();
    }
    
    /**
     * Initialize the debug panel
     */
    init() {
        this.createPanel();
        this.bindKeyboardShortcuts();
        
        // Show panel if debug mode is enabled
        if (Logger.DEBUG_MODE) {
            this.show();
        }
    }
    
    /**
     * Create the debug panel HTML structure
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'debug-panel';
        this.panel.innerHTML = `
            <div class="debug-header">
                <h3>Debug Panel</h3>
                <div class="debug-controls">
                    <button id="debug-toggle-mode">Toggle Debug Mode</button>
                    <button id="debug-clear-logs">Clear Logs</button>
                    <button id="debug-auto-refresh">Auto Refresh: OFF</button>
                    <button id="debug-close">×</button>
                </div>
            </div>
            <div class="debug-content">
                <div class="debug-info">
                    <div class="debug-section">
                        <h4>System Info</h4>
                        <div id="debug-system-info"></div>
                    </div>
                    <div class="debug-section">
                        <h4>Performance Timers</h4>
                        <div id="debug-timers"></div>
                    </div>
                </div>
                <div class="debug-logs">
                    <h4>Recent Logs</h4>
                    <div id="debug-log-container"></div>
                </div>
            </div>
        `;
        
        this.addStyles();
        document.body.appendChild(this.panel);
        
        this.logContainer = document.getElementById('debug-log-container');
        this.bindEvents();
        this.updateSystemInfo();
    }
    
    /**
     * Add CSS styles for the debug panel
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #debug-panel {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 400px;
                max-height: 80vh;
                background: rgba(0, 0, 0, 0.9);
                color: #fff;
                border: 1px solid #333;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                z-index: 10000;
                display: none;
                overflow: hidden;
            }
            
            .debug-header {
                background: #333;
                padding: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #555;
            }
            
            .debug-header h3 {
                margin: 0;
                font-size: 14px;
            }
            
            .debug-controls {
                display: flex;
                gap: 5px;
            }
            
            .debug-controls button {
                background: #555;
                color: #fff;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 10px;
            }
            
            .debug-controls button:hover {
                background: #666;
            }
            
            .debug-content {
                max-height: calc(80vh - 60px);
                overflow-y: auto;
                padding: 10px;
            }
            
            .debug-section {
                margin-bottom: 15px;
            }
            
            .debug-section h4 {
                margin: 0 0 5px 0;
                color: #4CAF50;
                font-size: 12px;
            }
            
            .debug-info {
                border-bottom: 1px solid #333;
                padding-bottom: 10px;
                margin-bottom: 10px;
            }
            
            .debug-logs {
                max-height: 300px;
                overflow-y: auto;
            }
            
            .log-entry {
                margin-bottom: 5px;
                padding: 5px;
                border-left: 3px solid #666;
                background: rgba(255, 255, 255, 0.05);
            }
            
            .log-entry.debug { border-left-color: #2196F3; }
            .log-entry.info { border-left-color: #4CAF50; }
            .log-entry.warn { border-left-color: #FF9800; }
            .log-entry.error { border-left-color: #F44336; }
            
            .log-timestamp {
                color: #888;
                font-size: 10px;
            }
            
            .log-message {
                font-weight: bold;
                margin: 2px 0;
            }
            
            .log-data {
                color: #ccc;
                font-size: 10px;
                white-space: pre-wrap;
            }
            
            @media (max-width: 768px) {
                #debug-panel {
                    width: calc(100vw - 20px);
                    right: 10px;
                    left: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Bind event handlers
     */
    bindEvents() {
        document.getElementById('debug-close').addEventListener('click', () => this.hide());
        document.getElementById('debug-toggle-mode').addEventListener('click', () => {
            Logger.toggleDebugMode();
            this.updateSystemInfo();
        });
        document.getElementById('debug-clear-logs').addEventListener('click', () => {
            Logger.clearLogs();
            this.refreshLogs();
        });
        document.getElementById('debug-auto-refresh').addEventListener('click', () => {
            this.toggleAutoRefresh();
        });
    }
    
    /**
     * Bind keyboard shortcuts
     */
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+D to toggle debug panel
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggle();
            }
            
            // Ctrl+Shift+L to toggle debug mode
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                Logger.toggleDebugMode();
                this.updateSystemInfo();
            }
        });
    }
    
    /**
     * Show the debug panel
     */
    show() {
        this.panel.style.display = 'block';
        this.isVisible = true;
        this.refreshLogs();
        this.updateSystemInfo();
        Logger.debug('Debug panel shown');
    }
    
    /**
     * Hide the debug panel
     */
    hide() {
        this.panel.style.display = 'none';
        this.isVisible = false;
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        Logger.debug('Debug panel hidden');
    }
    
    /**
     * Toggle debug panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Update system information display
     */
    updateSystemInfo() {
        const config = Logger.getConfig();
        const systemInfo = document.getElementById('debug-system-info');
        const timersInfo = document.getElementById('debug-timers');
        
        systemInfo.innerHTML = `
            <div>Debug Mode: ${config.debugMode ? 'ON' : 'OFF'}</div>
            <div>Log Level: ${Object.keys(Logger.LOG_LEVELS)[config.logLevel]}</div>
            <div>User Agent: ${navigator.userAgent.substring(0, 50)}...</div>
            <div>Viewport: ${window.innerWidth}x${window.innerHeight}</div>
            <div>URL: ${window.location.pathname}</div>
        `;
        
        timersInfo.innerHTML = config.activeTimers.length > 0 
            ? config.activeTimers.map(timer => `<div>• ${timer}</div>`).join('')
            : '<div>No active timers</div>';
    }
    
    /**
     * Refresh the logs display
     */
    refreshLogs() {
        const logs = Logger.getLogs();
        const recentLogs = logs.slice(-20); // Show last 20 logs
        
        this.logContainer.innerHTML = recentLogs.length > 0
            ? recentLogs.map(log => this.formatLogEntry(log)).join('')
            : '<div>No logs available</div>';
        
        // Scroll to bottom
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }
    
    /**
     * Format a log entry for display
     */
    formatLogEntry(log) {
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        const dataStr = Object.keys(log).filter(key => 
            !['timestamp', 'level', 'message'].includes(key)
        ).length > 0 
            ? JSON.stringify(
                Object.fromEntries(
                    Object.entries(log).filter(([key]) => 
                        !['timestamp', 'level', 'message'].includes(key)
                    )
                ), null, 2
            )
            : '';
        
        return `
            <div class="log-entry ${log.level.toLowerCase()}">
                <div class="log-timestamp">${timestamp}</div>
                <div class="log-message">[${log.level}] ${log.message}</div>
                ${dataStr ? `<div class="log-data">${dataStr}</div>` : ''}
            </div>
        `;
    }
    
    /**
     * Toggle auto-refresh of logs
     */
    toggleAutoRefresh() {
        this.autoRefresh = !this.autoRefresh;
        const button = document.getElementById('debug-auto-refresh');
        
        if (this.autoRefresh) {
            button.textContent = 'Auto Refresh: ON';
            this.refreshInterval = setInterval(() => {
                if (this.isVisible) {
                    this.refreshLogs();
                    this.updateSystemInfo();
                }
            }, 1000);
        } else {
            button.textContent = 'Auto Refresh: OFF';
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
        }
    }
}

// Initialize debug panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.debugPanel = new DebugPanel();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugPanel;
}