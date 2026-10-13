// Quick test for CommentIntegration class (Node.js compatible)

// Mock DOM and Logger for Node.js testing
global.document = {
    createElement: (tag) => ({
        className: '',
        innerHTML: '',
        setAttribute: () => {},
        appendChild: () => {},
        removeChild: () => {},
        onload: null,
        onerror: null
    }),
    head: {
        appendChild: () => {}
    },
    querySelector: () => null
};

const Logger = {
    info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
    error: (message, data) => console.error(`[ERROR] ${message}`, data || ''),
    debug: (message, data) => console.log(`[DEBUG] ${message}`, data || '')
};

// Load the CommentIntegration class
const fs = require('fs');
const path = require('path');

// Read and evaluate the comment integration file
const commentIntegrationCode = fs.readFileSync(path.join(__dirname, '../js/comment-integration.js'), 'utf8');

// Create a proper context for evaluation
const vm = require('vm');
const context = {
    Logger,
    document: global.document,
    console,
    Promise,
    Error
};

vm.createContext(context);
vm.runInContext(commentIntegrationCode, context);

// Extract the CommentIntegration class
const CommentIntegration = context.CommentIntegration;

// Test configurations
const validConfig = {
    repo: 'testuser/test-repo',
    repoId: 'R_test123',
    category: 'General',
    categoryId: 'DIC_test456',
    features: { comments: true }
};

const invalidConfig = {
    repo: 'testuser/test-repo'
    // Missing required fields
};

console.log('🧪 Running Quick Comment Integration Tests...\n');

// Test 1: Valid configuration
try {
    console.log('Test 1: Valid Configuration');
    const commentIntegration = new CommentIntegration(validConfig);
    console.log('✅ CommentIntegration created successfully');
    
    const isValid = commentIntegration.validateConfig();
    console.log(`✅ Configuration validation: ${isValid}`);
    
    const isAvailable = commentIntegration.isCommentsAvailable();
    console.log(`✅ Comments available: ${isAvailable}`);
    console.log('');
} catch (error) {
    console.error('❌ Test 1 failed:', error.message);
}

// Test 2: Invalid configuration
try {
    console.log('Test 2: Invalid Configuration');
    const commentIntegration = new CommentIntegration(invalidConfig);
    console.log('✅ CommentIntegration created (with invalid config)');
    
    const isValid = commentIntegration.validateConfig();
    console.log(`✅ Configuration validation: ${isValid} (should be false)`);
    
    const isAvailable = commentIntegration.isCommentsAvailable();
    console.log(`✅ Comments available: ${isAvailable} (should be false)`);
    console.log('');
} catch (error) {
    console.error('❌ Test 2 failed:', error.message);
}

// Test 3: Initialize comments
try {
    console.log('Test 3: Initialize Comments');
    const commentIntegration = new CommentIntegration(validConfig);
    
    commentIntegration.initializeComments('test-pdf-123').then(result => {
        console.log(`✅ Initialize comments result: ${result}`);
        console.log(`✅ Giscus term set to: ${commentIntegration.giscusConfig.term}`);
        console.log('');
    });
} catch (error) {
    console.error('❌ Test 3 failed:', error.message);
}

// Test 4: Theme update
try {
    console.log('Test 4: Theme Update');
    const commentIntegration = new CommentIntegration(validConfig);
    
    const originalTheme = commentIntegration.giscusConfig.theme;
    commentIntegration.updateTheme('dark');
    const newTheme = commentIntegration.giscusConfig.theme;
    
    console.log(`✅ Theme updated from '${originalTheme}' to '${newTheme}'`);
    console.log('');
} catch (error) {
    console.error('❌ Test 4 failed:', error.message);
}

console.log('🎉 Quick tests completed!');
console.log('\nTo run full browser tests, open: tests/comment-integration-test-runner.html');