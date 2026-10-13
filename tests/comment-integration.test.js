// Test suite for CommentIntegration class

// Mock Logger for testing
const Logger = {
    info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
    error: (message, data) => console.error(`[ERROR] ${message}`, data || ''),
    debug: (message, data) => console.log(`[DEBUG] ${message}`, data || '')
};

// Test configuration
const testConfig = {
    repo: 'testuser/test-repo',
    repoId: 'R_test123',
    category: 'General',
    categoryId: 'DIC_test456',
    features: {
        comments: true
    }
};

const invalidConfig = {
    repo: 'testuser/test-repo',
    // Missing required fields
};

// Test suite
function runCommentIntegrationTests() {
    console.log('Running CommentIntegration Tests...\n');
    
    let testsPassed = 0;
    let testsTotal = 0;

    function test(name, testFn) {
        testsTotal++;
        try {
            console.log(`Testing: ${name}`);
            testFn();
            console.log('✅ PASSED\n');
            testsPassed++;
        } catch (error) {
            console.error(`❌ FAILED: ${error.message}\n`);
        }
    }

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    // Test 1: Constructor and configuration validation
    test('Constructor initializes with valid config', () => {
        const commentIntegration = new CommentIntegration(testConfig);
        assert(commentIntegration.repoConfig === testConfig, 'Config should be stored');
        assert(commentIntegration.giscusConfig.repo === testConfig.repo, 'Giscus config should be set');
        assert(commentIntegration.isGiscusLoaded === false, 'Giscus should not be loaded initially');
    });

    // Test 2: Configuration validation
    test('validateConfig returns true for valid config', () => {
        const commentIntegration = new CommentIntegration(testConfig);
        const isValid = commentIntegration.validateConfig();
        assert(isValid === true, 'Valid config should return true');
    });

    test('validateConfig returns false for invalid config', () => {
        const commentIntegration = new CommentIntegration(invalidConfig);
        const isValid = commentIntegration.validateConfig();
        assert(isValid === false, 'Invalid config should return false');
    });

    // Test 3: Comments availability check
    test('isCommentsAvailable returns correct status', () => {
        const commentIntegration = new CommentIntegration(testConfig);
        const isAvailable = commentIntegration.isCommentsAvailable();
        assert(isAvailable === true, 'Comments should be available with valid config');
        
        const commentIntegrationInvalid = new CommentIntegration(invalidConfig);
        const isAvailableInvalid = commentIntegrationInvalid.isCommentsAvailable();
        assert(isAvailableInvalid === false, 'Comments should not be available with invalid config');
    });

    // Test 4: Initialize comments
    test('initializeComments works with valid PDF ID', async () => {
        const commentIntegration = new CommentIntegration(testConfig);
        const result = await commentIntegration.initializeComments('test-pdf-123');
        assert(result === true, 'Initialize comments should succeed with valid config');
        assert(commentIntegration.giscusConfig.term === 'pdf-test-pdf-123', 'Term should be set correctly');
    });

    test('initializeComments fails with invalid config', async () => {
        const commentIntegration = new CommentIntegration(invalidConfig);
        const result = await commentIntegration.initializeComments('test-pdf-123');
        assert(result === false, 'Initialize comments should fail with invalid config');
    });

    // Test 5: Theme update
    test('updateTheme updates configuration', () => {
        const commentIntegration = new CommentIntegration(testConfig);
        commentIntegration.updateTheme('dark');
        assert(commentIntegration.giscusConfig.theme === 'dark', 'Theme should be updated');
    });

    // Test 6: Fallback message
    test('showFallbackMessage creates proper HTML', () => {
        const commentIntegration = new CommentIntegration(testConfig);
        const container = document.createElement('div');
        commentIntegration.showFallbackMessage(container);
        
        assert(container.innerHTML.includes('Comments Unavailable'), 'Should show unavailable message');
        assert(container.innerHTML.includes('GitHub Discussions'), 'Should include discussions link');
        assert(container.innerHTML.includes(testConfig.repo), 'Should include repo name in links');
    });

    // Test 7: Setup Giscus with no container
    test('setupGiscus fails with no container', async () => {
        const commentIntegration = new CommentIntegration(testConfig);
        const result = await commentIntegration.setupGiscus(null);
        assert(result === false, 'Setup should fail with no container');
    });

    // Summary
    console.log(`\n=== Test Results ===`);
    console.log(`Passed: ${testsPassed}/${testsTotal}`);
    console.log(`Success Rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);
    
    if (testsPassed === testsTotal) {
        console.log('🎉 All tests passed!');
        return true;
    } else {
        console.log('❌ Some tests failed');
        return false;
    }
}

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runCommentIntegrationTests };
}