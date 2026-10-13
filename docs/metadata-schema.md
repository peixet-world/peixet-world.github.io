# PDF Metadata Schema Documentation

This document describes the JSON schema used for PDF metadata files in the PDF sharing website.

## Overview

Each PDF file can have an associated metadata file that provides additional information for display and search functionality. Metadata files should be placed in the `pdfs/metadata/` directory with the same name as the PDF file but with a `.json` extension.

## Schema Location

The JSON schema is located at `pdfs/metadata/schema.json` and follows JSON Schema Draft 7 specification.

## Required Fields

### title (string, required)
- **Description**: Display title for the PDF
- **Constraints**: 1-200 characters
- **Example**: `"User Manual v2.1"`

### description (string, required)
- **Description**: Brief description of the document content
- **Constraints**: 1-500 characters
- **Example**: `"Complete user manual covering all features and functionality"`

### tags (array, required)
- **Description**: Array of tags for categorization and filtering
- **Constraints**: 1-20 unique strings, each 1-50 characters
- **Example**: `["manual", "user-guide", "instructions", "help"]`

## Optional Fields

### author (string, optional)
- **Description**: Author or creator of the document
- **Constraints**: Maximum 100 characters
- **Example**: `"Documentation Team"`

### featured (boolean, optional)
- **Description**: Whether this PDF should be featured on the homepage
- **Default**: `false`
- **Example**: `true`

### uploadDate (string, optional)
- **Description**: ISO 8601 date when the PDF was uploaded
- **Format**: Date-time string
- **Example**: `"2025-01-15T10:30:00Z"`

### pageCount (integer, optional)
- **Description**: Number of pages in the PDF
- **Constraints**: 1-10,000
- **Example**: `25`

### fileSize (integer, optional)
- **Description**: File size in bytes
- **Constraints**: Minimum 1
- **Example**: `2048576`

### category (string, optional)
- **Description**: Primary category for the document
- **Constraints**: Maximum 50 characters
- **Example**: `"Documentation"`

### language (string, optional)
- **Description**: Primary language of the document (ISO 639-1 code)
- **Format**: Two lowercase letters
- **Example**: `"en"`

### version (string, optional)
- **Description**: Document version number
- **Constraints**: Maximum 20 characters
- **Example**: `"2.1"`

### keywords (array, optional)
- **Description**: Additional keywords for search optimization
- **Constraints**: Maximum 10 unique strings, each maximum 30 characters
- **Example**: `["troubleshooting", "setup", "configuration"]`

### lastModified (string, optional)
- **Description**: ISO 8601 date when the document was last modified
- **Format**: Date-time string
- **Example**: `"2025-01-12T14:20:00Z"`

### downloadCount (integer, optional)
- **Description**: Number of times the PDF has been downloaded
- **Constraints**: Minimum 0
- **Default**: `0`
- **Example**: `42`

### accessLevel (string, optional)
- **Description**: Access level for the document
- **Values**: `"public"` or `"restricted"`
- **Default**: `"public"`
- **Example**: `"public"`

## Complete Example

```json
{
  "title": "Advanced User Guide",
  "description": "Comprehensive guide covering advanced features, customization options, and troubleshooting procedures for experienced users.",
  "tags": ["advanced", "guide", "customization", "troubleshooting"],
  "author": "Technical Writing Team",
  "featured": true,
  "uploadDate": "2025-01-15T10:30:00Z",
  "pageCount": 45,
  "fileSize": 3145728,
  "category": "Documentation",
  "language": "en",
  "version": "3.2",
  "keywords": ["configuration", "api", "integration"],
  "lastModified": "2025-01-14T16:45:00Z",
  "downloadCount": 0,
  "accessLevel": "public"
}
```

## Minimal Example

```json
{
  "title": "Quick Start Guide",
  "description": "Get up and running quickly with this brief introduction.",
  "tags": ["quick-start", "introduction", "beginner"]
}
```

## Validation

### Online Validation
You can validate your metadata files using online JSON Schema validators:
- [JSONSchemaLint](https://jsonschemalint.com/)
- [JSON Schema Validator](https://www.jsonschemavalidator.net/)

### Command Line Validation
Using `ajv-cli` (Node.js):

```bash
npm install -g ajv-cli
ajv validate -s pdfs/metadata/schema.json -d pdfs/metadata/your-file.json
```

### JavaScript Validation
```javascript
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv();
addFormats(ajv);

const schema = require('./pdfs/metadata/schema.json');
const validate = ajv.compile(schema);

const metadata = require('./pdfs/metadata/your-file.json');
const valid = validate(metadata);

if (!valid) {
  console.log(validate.errors);
}
```

## Best Practices

### Tagging Strategy
- Use lowercase tags for consistency
- Include both broad categories and specific keywords
- Consider how users might search for content
- Avoid overly specific tags that won't be reused

### Title Guidelines
- Keep titles descriptive but concise
- Include version numbers when relevant
- Use title case for consistency
- Avoid redundant words like "PDF" or "Document"

### Description Writing
- Write clear, informative descriptions
- Include key topics covered in the document
- Mention the target audience when relevant
- Keep descriptions under 200 characters for better display

### Date Formats
- Always use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
- Include timezone information (Z for UTC)
- Use consistent timezone across all documents

### Category Organization
- Use consistent category names across documents
- Keep categories broad enough to group multiple documents
- Consider creating a category hierarchy if needed

## Common Errors

### Invalid JSON Syntax
```json
// ❌ Wrong - trailing comma
{
  "title": "My Document",
  "tags": ["tag1", "tag2"],
}

// ✅ Correct
{
  "title": "My Document",
  "tags": ["tag1", "tag2"]
}
```

### Missing Required Fields
```json
// ❌ Wrong - missing required fields
{
  "author": "John Doe"
}

// ✅ Correct
{
  "title": "My Document",
  "description": "Document description",
  "tags": ["tag1"],
  "author": "John Doe"
}
```

### Invalid Date Format
```json
// ❌ Wrong - invalid date format
{
  "uploadDate": "2025-01-15"
}

// ✅ Correct
{
  "uploadDate": "2025-01-15T10:30:00Z"
}
```

### Empty Arrays or Strings
```json
// ❌ Wrong - empty required fields
{
  "title": "",
  "description": "Valid description",
  "tags": []
}

// ✅ Correct
{
  "title": "Valid Title",
  "description": "Valid description",
  "tags": ["tag1"]
}
```

## Schema Evolution

### Version History
- **v1.0**: Initial schema with basic fields
- **v1.1**: Added optional fields for enhanced metadata
- **v1.2**: Added validation constraints and examples

### Future Considerations
- Multi-language support for titles and descriptions
- Custom field extensions for specific use cases
- Integration with external metadata standards
- Automated metadata extraction from PDF properties

## Support

For questions about the metadata schema:
1. Check this documentation first
2. Review the example files in `pdfs/metadata/`
3. Validate your JSON using the schema
4. Open an issue in the repository for schema-related bugs or suggestions