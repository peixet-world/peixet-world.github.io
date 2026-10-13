# PDF Manager Tests

This directory contains unit tests for the PDFManager class implementation.

## Files

- `pdf-manager.test.js` - Comprehensive unit tests for PDFManager class
- `test-runner.html` - Browser-based test runner interface
- `quick-test.js` - Simple verification script
- `README.md` - This documentation file

## Running Tests

### Browser Tests

1. Open `test-runner.html` in a web browser
2. Click the "Run Tests" button
3. View results in the browser

### Quick Verification

1. Open browser developer console
2. Load the quick test script:
   ```javascript
   // In browser console, after loading the page with PDFManager
   quickTest();
   ```

## Test Coverage

The tests cover the following PDFManager functionality:

### Constructor Tests
- ✅ Default directory initialization
- ✅ Custom directory initialization
- ✅ Property initialization

### Validation Tests
- ✅ `validatePDFEntry()` with valid entries
- ✅ `validatePDFEntry()` with invalid entries
- ✅ `validatePDF()` with valid PDF files
- ✅ `validatePDF()` with invalid files

### File Loading Tests
- ✅ `loadPDFList()` with empty manifest
- ✅ `loadPDFList()` with valid manifest
- ✅ `loadPDFList()` with missing manifest
- ✅ Error handling for network failures

### Utility Tests
- ✅ `getPDFByFilename()` functionality
- ✅ `getAllPDFs()` functionality
- ✅ `getPDFCount()` functionality
- ✅ `refreshPDFList()` functionality

## Test Framework

The tests use a custom lightweight testing framework designed for browser compatibility:

- `TestFramework` class provides basic assertion methods
- Mock fetch functionality for testing network requests
- Async/await support for testing promises
- Clear pass/fail reporting

## Requirements Coverage

These tests verify implementation of the following requirements:

- **Requirement 1.1**: PDF files available on website when committed to repository
- **Requirement 1.3**: Graceful handling of corrupted or invalid PDF files
- **Requirement 9.1**: Automatic inclusion of PDF files added to repository
- **Requirement 10.4**: Meaningful error logging and debugging information

## Adding New Tests

To add new tests:

1. Add test cases to `pdf-manager.test.js`
2. Use the `testFramework.test()` method
3. Include appropriate assertions
4. Update this README with new test coverage

Example:
```javascript
testFramework.test('New test description', async () => {
    // Test implementation
    testFramework.assertEqual(actual, expected);
});
```