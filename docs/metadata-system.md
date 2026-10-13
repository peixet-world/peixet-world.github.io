# PDF Metadata System

The PDF metadata system provides comprehensive functionality for managing PDF file metadata, including automatic generation of default metadata for files without explicit metadata files.

## Overview

The metadata system is implemented in the `PDFManager` class and provides the following features:

- **Metadata Loading**: Load metadata from JSON files in the `pdfs/metadata/` directory
- **Default Generation**: Automatically generate metadata for PDFs without metadata files
- **Validation**: Validate and normalize metadata according to the JSON schema
- **Caching**: Cache metadata for improved performance
- **Error Handling**: Graceful handling of missing or invalid metadata files

## Metadata File Format

Metadata files should be placed in `pdfs/metadata/` with the same name as the PDF file but with a `.json` extension.

### Example: `pdfs/metadata/sample-document.json`

```json
{
  "title": "Sample Document",
  "description": "This is a sample PDF document used for testing.",
  "tags": ["sample", "test", "documentation"],
  "uploadDate": "2025-01-22T10:00:00Z",
  "fileSize": 329,
  "pageCount": 1,
  "author": "PDF Library System",
  "featured": true
}
```

### Schema Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Display title for the PDF |
| `description` | string | No | Brief description of the document content |
| `tags` | array | No | Array of tags for categorization and filtering |
| `uploadDate` | string | No | ISO 8601 date when the PDF was uploaded |
| `fileSize` | integer | No | File size in bytes |
| `pageCount` | integer | No | Number of pages in the PDF |
| `author` | string | No | Author of the document |
| `featured` | boolean | No | Whether this PDF should be featured on the homepage |

## Usage

### Loading Metadata

```javascript
const pdfManager = new PDFManager();

// Load metadata for a specific PDF
const metadata = await pdfManager.getPDFMetadata('sample-document.pdf');
console.log(metadata.title); // "Sample Document"

// Load metadata for all PDFs
const allMetadata = await pdfManager.getAllMetadata();
```

### Default Metadata Generation

If no metadata file exists for a PDF, the system automatically generates default metadata:

```javascript
// For a file named "user-guide.pdf" without metadata
const metadata = await pdfManager.getPDFMetadata('user-guide.pdf');
// Result:
// {
//   filename: "user-guide",
//   title: "User Guide",
//   description: "",
//   tags: [],
//   uploadDate: "2025-01-22T10:00:00Z",
//   fileSize: null,
//   pageCount: null,
//   author: "",
//   featured: false
// }
```

### Title Generation

The system automatically generates human-readable titles from filenames:

- `my-document.pdf` → "My Document"
- `user_guide.pdf` → "User Guide"
- `technical-specification-v2.pdf` → "Technical Specification V2"

### Metadata Validation

All metadata is validated and normalized:

- **Required fields**: Only `title` is required (generated from filename if missing)
- **Type validation**: Ensures correct data types for all fields
- **Tag normalization**: Converts tags to lowercase, removes duplicates
- **Error handling**: Invalid values are set to appropriate defaults

### Caching

Metadata is automatically cached for performance:

```javascript
// First call loads from file/generates default
const metadata1 = await pdfManager.getPDFMetadata('document.pdf');

// Second call uses cached version
const metadata2 = await pdfManager.getPDFMetadata('document.pdf');

// Clear cache if needed
pdfManager.clearMetadataCache();
```

## Error Handling

The metadata system includes comprehensive error handling:

- **Missing metadata files**: Automatically generates default metadata
- **Invalid JSON**: Falls back to default metadata generation
- **Invalid field values**: Normalizes to appropriate defaults
- **Network errors**: Graceful degradation with logging

## Logging

All metadata operations are logged for debugging:

- **Info level**: Successful operations, cache hits
- **Error level**: Validation failures, file access errors
- **Debug level**: Detailed operation information

## Best Practices

1. **Always provide a title**: While the system can generate titles from filenames, explicit titles are more user-friendly
2. **Use consistent tags**: Establish a tagging convention for better organization
3. **Include descriptions**: Help users understand document content
4. **Set featured flag**: Highlight important documents on the homepage
5. **Keep metadata files in sync**: Update metadata when PDFs are modified

## Testing

The metadata system includes comprehensive tests:

```bash
# Run in browser
open tests/metadata-test-runner.html

# Run quick Node.js test
node tests/quick-metadata-test.js
```

## Integration

The metadata system integrates with other components:

- **Tag System**: Uses metadata tags for filtering and search
- **Homepage**: Uses `featured` flag to highlight documents
- **Directory Listing**: Displays metadata information
- **PDF Viewer**: Shows document information