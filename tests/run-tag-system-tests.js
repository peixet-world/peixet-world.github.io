#!/usr/bin/env node

// Simple Node.js test runner for TagSystem
// This simulates the browser environment for testing

// Mock DOM elements for testing
global.document = {
    createElement: (tag) => ({
        className: '',
        textContent: '',
        innerHTML: '',
        setAttribute: () => {},
        getAttribute: () => null,
        appendChild: () => {},
        addEventListener: () => {},
        querySelectorAll: () => [],
        querySelector: () => null
    })
};

global.HTMLElement = class HTMLElement {};

// Load the TagSystem implementation
const fs = require('fs');
const path = require('path');

// Read and evaluate the TagSystem code
const tagSystemCode = fs.readFileSync(path.join(__dirname, '../js/tag-system.js'), 'utf8');
eval(tagSystemCode);

// Read and evaluate the test code
const testCode = fs.readFileSync(path.join(__dirname, 'tag-system.test.js'), 'utf8');
eval(testCode);

// Run the tests
async function runTests() {
    console.log('Running TagSystem tests in Node.js environment...\n');
    
    try {
        const testSuite = new TagSystemTests();
        await testSuite.runAllTests();
        
        if (testSuite.failed === 0) {
            console.log('\n🎉 All tests passed successfully!');
            process.exit(0);
        } else {
            console.log(`\n❌ ${testSuite.failed} test(s) failed.`);
            process.exit(1);
        }
    } catch (error) {
        console.error('\n💥 Test execution failed:', error.message);
        process.exit(1);
    }
}

runTests();