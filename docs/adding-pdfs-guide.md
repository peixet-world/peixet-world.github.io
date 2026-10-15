# Adding PDFs to Your Website

This guide explains how to add new PDF documents to your PDF sharing website.

## Quick Start

1. **Add PDF file**: Place your PDF in the `pdfs/` directory
2. **Create metadata** (optional): Add a JSON file in `pdfs/metadata/`
3. **Regenerate the manifest**: `python3 scripts/build-site.py`
4. **Commit and push**: commit the PDF, its metadata and the regenerated manifest - your PDF appears on the website after the next deployment

## How the File List Works (the manifest)

The site renders its library from `pdfs/metadata/manifest.json`, which is committed
to the repository and deployed as-is. Never edit that file by hand - regenerate it
with `scripts/build-site.py` after adding or removing PDFs:

- CI runs `python3 scripts/build-site.py --check` on every push and fails the deploy
  when the committed manifest is out of date, so a forgotten regeneration is caught
  before it reaches the site
- The same check fails with a clear message when a metadata file is invalid
  (missing `title`, `description` or `tags`, or broken JSON), which you can see in
  the Actions log

Each entry gets `uploadDate` from the git commit that added the PDF, so files that
were never committed (`git status` shows them as untracked) never reach the site.

## Step-by-Step Instructions

### 1. Adding PDF Files

#### Via GitHub Web Interface

1. Navigate to your repository on GitHub
2. Click on the `pdfs/` folder
3. Click "Add file" → "Upload files"
4. Drag and drop your PDF files or click "choose your files"
5. Add a commit message like "Add new PDF: [filename]"
6. Click "Commit changes"

#### Via Git Command Line

```bash
# Clone your repository (if not already done)
git clone https://github.com/yourusername/your-repo.git
cd your-repo

# Add PDF files to the pdfs directory
cp /path/to/your/document.pdf pdfs/

# Commit and push
git add pdfs/document.pdf
git commit -m "Add new PDF: document.pdf"
git push origin HEAD
```

### 2. Creating Metadata (Recommended)

Metadata files enhance your PDFs with titles, descriptions, and tags. They should be placed in `pdfs/metadata/` with the same name as your PDF but with a `.json` extension.

#### Metadata File Structure

For a PDF named `my-document.pdf`, create `pdfs/metadata/my-document.json`:

```json
{
  "title": "My Document Title",
  "description": "A brief description of what this document contains",
  "tags": ["category", "keyword1", "keyword2"],
  "author": "Author Name",
  "featured": false,
  "uploadDate": "2025-01-15T10:30:00Z",
  "pageCount": 25,
  "category": "Documentation"
}
```

#### Metadata Fields Explained

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `title` | Yes | Display title for the PDF | "User Manual v2.1" |
| `description` | Yes | Brief description shown in listings | "Complete guide to using the system" |
| `tags` | Yes | Array of searchable keywords | ["manual", "guide", "help"] |
| `author` | No | Document author | "John Smith" |
| `featured` | No | Show on homepage (true/false) | false |
| `uploadDate` | No | ISO date string | "2025-01-15T10:30:00Z" |
| `pageCount` | No | Number of pages | 25 |
| `category` | No | Document category | "Documentation" |

### 3. Best Practices

#### File Naming

- Use descriptive, lowercase filenames
- Replace spaces with hyphens: `user-guide.pdf`
- Avoid special characters: `!@#$%^&*()`
- Keep names reasonably short but descriptive

#### File Organization

```
pdfs/
├── user-guide.pdf
├── technical-manual.pdf
├── getting-started.pdf
└── metadata/
    ├── user-guide.json
    ├── technical-manual.json
    └── getting-started.json
```

#### Tagging Strategy

- Use consistent tag names across documents
- Include both broad categories and specific keywords
- Consider how users might search for content
- Examples:
  - Categories: "manual", "guide", "reference", "tutorial"
  - Topics: "api", "installation", "troubleshooting"
  - Difficulty: "beginner", "advanced", "intermediate"

### 4. File Size Considerations

#### Recommended Limits

- **Optimal**: Under 5MB per PDF
- **Maximum**: 25MB per PDF (GitHub file limit)
- **Repository**: Keep total repository size under 1GB

#### Optimization Tips

1. **Compress PDFs**: Use tools like Adobe Acrobat or online compressors
2. **Reduce image quality**: Lower DPI for images within PDFs
3. **Remove unnecessary elements**: Delete unused pages or embedded files
4. **Use Git LFS**: For files over 100MB (requires additional setup)

### 5. Testing Your Changes

#### Local Testing

Before committing, test locally:

```bash
# Generate the manifest so new PDFs show up in the preview
python3 scripts/build-site.py

# Serve the website locally
python3 -m http.server 8000
# or
npx serve .

# Open http://localhost:8000 in your browser
```

#### Deployment Testing

After pushing changes:

1. Wait for GitHub Actions to complete (check the Actions tab)
2. Visit your GitHub Pages URL
3. Navigate to the directory page
4. Verify your new PDF appears
5. Test opening and viewing the PDF
6. Check that metadata displays correctly

### 6. Troubleshooting

#### PDF Not Appearing

- **Check file location**: Ensure PDF is directly in `pdfs/` (no subfolders)
- **Verify commit**: `git status` - untracked files never reach the site
- **Check the manifest step**: the Actions log shows `Manifest written: N PDF(s)`
- **Check deployment**: Look at GitHub Actions for deployment errors
- **Clear cache**: Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)

#### Metadata Not Showing

- **File naming**: Ensure JSON file matches PDF name exactly
- **JSON syntax**: Validate JSON syntax using online tools
- **Required fields**: Verify title, description, and tags are present
- **File location**: Confirm JSON is in `pdfs/metadata/` directory

#### PDF Won't Open

- **File corruption**: Try opening PDF locally first
- **File size**: Check if file exceeds browser limits
- **PDF version**: Ensure PDF is compatible with PDF.js
- **Browser console**: Check for JavaScript errors

### 7. Advanced Features

#### Featured Documents

Set `"featured": true` in metadata to display PDFs on the homepage.

#### Custom Categories

Use the `category` field to group related documents:

```json
{
  "category": "User Guides",
  "tags": ["guide", "manual", "help"]
}
```

#### Date-based Organization

Use `uploadDate` for chronological sorting:

```json
{
  "uploadDate": "2025-01-15T10:30:00Z"
}
```

### 8. Automation Options

#### Bulk Upload Script

For multiple files, create a script:

```bash
#!/bin/bash
# bulk-upload.sh

for pdf in *.pdf; do
    cp "$pdf" pdfs/
    echo "Added: $pdf"
done

git add pdfs/
git commit -m "Bulk upload: $(date)"
git push origin HEAD
```

#### Metadata Template

Create a template for consistent metadata:

```json
{
  "title": "",
  "description": "",
  "tags": [],
  "author": "Your Name",
  "featured": false,
  "uploadDate": "",
  "category": ""
}
```

## Need Help?

- Check the main [README.md](../README.md) for general setup
- Review [GitHub Pages Setup Guide](github-pages-setup.md) for deployment issues
- Open an issue in the repository for specific problems
- Check browser console for error messages