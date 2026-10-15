# PDF Library

A static website for sharing PDF documents, built with vanilla HTML, CSS, and JavaScript, and hosted on GitHub Pages.

## Features

- 📚 Browse PDF documents in a clean, responsive interface
- 🔍 Search and filter PDFs by tags and keywords
- 👀 View PDFs directly in the browser with PDF.js
- 💬 Comment system using GitHub Discussions (Giscus)
- 📱 Mobile-responsive design
- ♿ Accessibility compliant (WCAG 2.1 AA)

## Quick Start

1. **Fork this repository** or use it as a template
2. **Rename it** to `yourusername.github.io` (required for the default `https://yourusername.github.io` domain)
3. **Enable GitHub Pages** in repository Settings → Pages → Source: GitHub Actions
4. **Add your PDF files** to the `pdfs/` directory
5. **Regenerate the manifest** (`python3 scripts/build-site.py`), commit everything and push - your site goes live at `https://yourusername.github.io`

> The file listing (`pdfs/metadata/manifest.json`) is committed to the repository
> and deployed as-is. Regenerate it with `scripts/build-site.py` whenever PDFs
> change; CI fails if it is out of date.

## Detailed Setup Instructions

### 1. Repository Setup

#### Option A: Fork Repository
1. Click "Fork" button on this repository
2. Clone your fork: `git clone https://github.com/yourusername/repository-name.git`
3. Navigate to repository: `cd repository-name`

#### Option B: Use as Template
1. Click "Use this template" → "Create a new repository"
2. Choose repository name (use `yourusername.github.io` for user site)
3. Clone: `git clone https://github.com/yourusername/repository-name.git`

### 2. Enable GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Under "Source", select **GitHub Actions**
3. The site will deploy automatically on pushes to your default branch (`main` or `master`)
4. Visit `https://yourusername.github.io/repository-name` once deployed

### 3. Adding PDF Files

#### Quick Method (GitHub Web Interface)
1. Navigate to `pdfs/` folder in your repository
2. Click "Add file" → "Upload files"
3. Drag and drop PDF files
4. Commit changes

#### Command Line Method
```bash
# Add PDF files
cp /path/to/your/document.pdf pdfs/
git add pdfs/document.pdf
git commit -m "Add new PDF: document.pdf"
git push origin HEAD
```

### 4. Creating Metadata (Recommended)

For each PDF, create a JSON metadata file in `pdfs/metadata/`:

**Example**: For `pdfs/user-guide.pdf`, create `pdfs/metadata/user-guide.json`:

```json
{
  "title": "User Guide v2.1",
  "description": "Complete guide covering all features and functionality",
  "tags": ["guide", "manual", "help", "tutorial"],
  "author": "Documentation Team",
  "featured": true,
  "category": "Documentation"
}
```

**Required fields**: `title`, `description`, `tags`
**Optional fields**: `author`, `featured`, `category`, `uploadDate`, `pageCount`

Metadata files are optional - PDFs without one still appear, with a title derived from the filename.

See [Metadata Schema Documentation](docs/metadata-schema.md) for complete field reference.

> The site reads its file listing from `pdfs/metadata/manifest.json`, which is
> committed to the repository. Run `python3 scripts/build-site.py` after adding or
> removing PDFs and commit the result; CI verifies it is current and fails the
> build otherwise. Invalid metadata also fails the build with an error in the
> Actions log.

### 5. Comment System Setup (Optional)

Enable GitHub Discussions-based comments using Giscus:

1. **Enable Discussions**: Repository Settings → General → Features → Discussions ✓
2. **Install the Giscus app**: Visit [github.com/apps/giscus](https://github.com/apps/giscus) → Install → grant access to this repository (nothing in the repo can do this for you)
3. **Get your IDs**: Visit [giscus.app](https://giscus.app/) and copy the generated `data-repo-id` and `data-category-id`
4. **Store them in `config.json`**: Set `giscus.repoId` and `giscus.categoryId` to the copied values (and `giscus.repo` to `owner/repository`), then commit

The repository must be **public** for Giscus to work.

See [Giscus Setup Guide](docs/giscus-setup-guide.md) for detailed instructions.

### 6. Customization

#### Site Configuration
Edit `config.json` to customize:
- Site title and description
- GitHub repository information
- Feature toggles (comments, search, etc.)

#### Styling
Modify CSS files in the `css/` directory:
- `css/main.css` - Main styles
- `css/responsive.css` - Mobile responsiveness
- `css/pdf-viewer.css` - PDF viewer specific styles

#### Functionality
JavaScript files in the `js/` directory:
- `js/main.js` - Core functionality
- `js/pdf-manager.js` - PDF file management
- `js/tag-system.js` - Search and filtering

## Project Structure

```
/
├── index.html              # Homepage
├── directory.html          # PDF directory listing
├── viewer.html            # PDF viewer page
├── config.json            # Site configuration
├── css/
│   ├── main.css           # Main stylesheet
│   ├── responsive.css     # Mobile responsiveness
│   └── pdf-viewer.css     # PDF viewer styles
├── js/
│   ├── main.js            # Core functionality
│   ├── pdf-manager.js     # PDF file management
│   ├── tag-system.js      # Tagging and filtering
│   └── comment-integration.js # Comment system
├── pdfs/                  # PDF storage directory
│   └── metadata/          # Per-PDF metadata + generated manifest.json
├── scripts/
│   └── build-site.py      # Regenerates/validates the manifest
├── assets/
│   ├── icons/             # UI icons
│   └── images/            # Website images
├── tests/                 # Test runners (published with the site)
├── LICENSE                # MIT License
└── README.md              # This file
```

## Development

The website is plain HTML, CSS and JavaScript with no page build step. The only
build tool is `scripts/build-site.py`, which you run locally to regenerate
`pdfs/metadata/manifest.json` (CI validates it with `--check` and deploys the
committed files as-is). Deployments run automatically on pushes to `main` (or
`master`); pull requests run the same validation without deploying.

### Local Development

1. Clone the repository
2. Generate the manifest: `python3 scripts/build-site.py`
3. Serve the files through a local web server and open `http://localhost:8000`:
   ```bash
   python3 -m http.server 8000
   # or
   npx serve .
   ```
   Opening `index.html` via `file://` does not work - the site fetches JSON files,
   which browsers block on that protocol.

## Browser Support

- Chrome/Chromium 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Documentation

- 📖 [Adding PDFs Guide](docs/adding-pdfs-guide.md) - How to add new PDF files
- 🔧 [GitHub Pages Setup](docs/github-pages-setup.md) - Deployment configuration
- 📋 [Metadata Schema](docs/metadata-schema.md) - Complete metadata reference
- 💬 [Giscus Setup Guide](docs/giscus-setup-guide.md) - Comment system configuration

## Testing

### Local Testing
```bash
# Generate the manifest, then serve locally for testing
python3 scripts/build-site.py
python3 -m http.server 8000
# or
npx serve .

# Open http://localhost:8000
```

### CI Testing
Every push and pull request runs `python3 scripts/build-site.py --check` (validates
all metadata and verifies the committed manifest matches the PDFs in `pdfs/`) plus
`node --check` on every JavaScript file. Pull requests validate only; they do not
deploy.

### Deployment Testing
The test suites are published with the site: run
`/tests/deployment-test-runner.html` after deployment (see `tests/README.md` for
the full list of runners).

## Troubleshooting

### PDFs Not Loading
- ✅ Ensure PDF files are in the `pdfs/` directory
- ✅ Check browser console for error messages  
- ✅ Verify PDF files are not corrupted
- ✅ Confirm GitHub Pages deployment completed successfully
- ✅ Try hard refresh (Ctrl+F5 or Cmd+Shift+R)

### PDF Not Appearing in the List
- ✅ Regenerate the manifest locally (`python3 scripts/build-site.py`) and commit it - CI fails when it is stale
- ✅ Confirm the file is committed (`git status` - untracked files never reach the site)
- ✅ The PDF must sit directly in `pdfs/` (no subfolders) and end in `.pdf`

### Metadata Not Displaying
- ✅ Check JSON file is in `pdfs/metadata/` directory
- ✅ Verify JSON filename matches PDF filename exactly
- ✅ Validate JSON syntax using online validator
- ✅ Ensure required fields (title, description, tags) are present
- ✅ Invalid metadata fails the build - see the Actions log for the exact file and field

### Comments Not Working
- ✅ Ensure GitHub Discussions are enabled in repository settings
- ✅ Ensure `giscus.repo`, `giscus.repoId` and `giscus.categoryId` in `config.json` match your repository
- ✅ Check that repository is public (required for Giscus)
- ✅ Confirm the Giscus app is installed on the repository: https://github.com/apps/giscus
- ✅ The workflow prints a non-blocking warning if Giscus is not installed

### Deployment Issues
- ✅ Check GitHub Actions tab for workflow status
- ✅ Verify GitHub Pages source is set to "GitHub Actions" in Settings → Pages
- ✅ Ensure all files are committed and pushed to your default branch (`main` or `master`)
- ✅ Check for any file size limits (25MB per file, 1GB per repository)

### Mobile/Responsive Issues
- ✅ Test on actual devices when possible
- ✅ Use browser developer tools to simulate mobile devices
- ✅ Check responsive CSS media queries
- ✅ Verify viewport meta tag is present in HTML files

### Performance Issues
- ✅ Optimize PDF file sizes (compress if necessary)
- ✅ Check browser network tab for slow-loading resources
- ✅ Verify CDN caching is working (check response headers)
- ✅ Consider using Git LFS for very large files