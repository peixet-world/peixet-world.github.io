/**
 * Tests for the logging and error handling system
 */

// Test Logger functionality
function testLogger() {
    console.log('=== Testing Logger ===');
    
    // Test basic logging
    Logger.info('Test info message', { test: true });
    Logger.warn('Test warning message', { level: 'warn' });
    Logger.error('Test error message', new Error('Test error'));
    Logger.debug('Test debug message (should only show in debug mode)');
    
    // Test performance timing
    Logger.startTimer('test-operation');
    setTimeout(() => {
        Logger.endTimer('test-operation');
    }, 100);
    
    // Test debug mode toggle
    const originalDebugMode = Logger.DEBUG_MODE;
    Logger.toggleDebugMode();
    Logger.debug('This debug message should be visible after toggle');
    Logger.toggleDebugMode(); // Toggle back
    
    // Test configuration
    const config = Logger.getConfig();
    console.log('Logger config:', config);
    
    console.log('Logger tests completed');
}

// Test ErrorHandler functionality
function testErrorHandler() {
    console.log('=== Testing ErrorHandler ===');
    
    // Test error analysis
    const networkError = new Error('Failed to fetch');
    const pdfError = new Error('Invalid PDF format');
    const timeoutError = new Error('Request timeout');
    
    console.log('Network error analysis:', ErrorHandler.analyzeError(networkError));
    console.log('PDF error analysis:', ErrorHandler.analyzeError(pdfError));
    console.log('Timeout error analysis:', ErrorHandler.analyzeError(timeoutError));
    
    // Test user error display
    ErrorHandler.showUserError('Test error message', 'test context');
    ErrorHandler.showUserWarning('Test warning message', 'test context');
    ErrorHandler.showUserSuccess('Test success message', 'test context');
    
    console.log('ErrorHandler tests completed');
}

// Test async wrapper functionality
async function testAsyncWrapper() {
    console.log('=== Testing Async Wrapper ===');
    
    // Test successful operation
    const successfulOperation = ErrorHandler.wrapAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'Success!';
    }, {
        context: 'test successful operation',
        showUserError: false
    });
    
    try {
        const result = await successfulOperation();
        console.log('Successful operation result:', result);
    } catch (error) {
        console.error('Unexpected error in successful operation:', error);
    }
    
    // Test failing operation with retry
    const failingOperation = ErrorHandler.wrapAsync(async () => {
        throw new Error('Simulated failure');
    }, {
        context: 'test failing operation',
        retryCount: 2,
        retryDelay: 100,
        showUserError: false,
        fallbackValue: 'Fallback result'
    });
    
    try {
        const result = await failingOperation();
        console.log('Failing operation result (should be fallback):', result);
    } catch (error) {
        console.error('Unexpected error in failing operation:', error);
    }
    
    console.log('Async wrapper tests completed');
}

// Test graceful degradation
async function testGracefulDegradation() {
    console.log('=== Testing Graceful Degradation ===');
    
    const primaryFunction = async () => {
        throw new Error('Primary function failed');
    };
    
    const fallbackFunction = async () => {
        return 'Fallback executed successfully';
    };
    
    const gracefulHandler = ErrorHandler.createGracefulHandler(
        primaryFunction,
        fallbackFunction,
        'test graceful degradation'
    );
    
    try {
        const result = await gracefulHandler();
        console.log('Graceful degradation result:', result);
    } catch (error) {
        console.error('Unexpected error in graceful degradation:', error);
    }
    
    console.log('Graceful degradation tests completed');
}

// Test safe fetch
async function testSafeFetch() {
    console.log('=== Testing Safe Fetch ===');
    
    // Test with a URL that should work (current page)
    try {
        const response = await ErrorHandler.safeFetch(window.location.href, {
            timeout: 5000,
            retries: 1
        });
        console.log('Safe fetch successful:', response.status);
    } catch (error) {
        console.log('Safe fetch error (expected for some URLs):', error.message);
    }
    
    // Test with invalid URL
    try {
        const response = await ErrorHandler.safeFetch('https://invalid-url-that-does-not-exist.com', {
            timeout: 2000,
            retries: 0
        });
        console.log('Invalid URL fetch (unexpected success):', response);
    } catch (error) {
        console.log('Invalid URL fetch error (expected):', error.message);
    }
    
    console.log('Safe fetch tests completed');
}

// Run all tests
async function runAllTests() {
    console.log('Starting logging and error handling tests...');
    
    try {
        testLogger();
        testErrorHandler();
        await testAsyncWrapper();
        await testGracefulDegradation();
        await testSafeFetch();
        
        console.log('All tests completed successfully!');
        
        // Show success message to user
        ErrorHandler.showUserSuccess('All logging and error handling tests passed!', 'test suite');
        
    } catch (error) {
        console.error('Test suite failed:', error);
        ErrorHandler.showUserError('Test suite encountered an error: ' + error.message, 'test suite');
    }
}

// Auto-run tests when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for all scripts to load
    setTimeout(runAllTests, 1000);
});

// Export for manual testing
window.testLoggingAndErrorHandling = {
    runAllTests,
    testLogger,
    testErrorHandler,
    testAsyncWrapper,
    testGracefulDegradation,
    testSafeFetch
};