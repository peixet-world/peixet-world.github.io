# GitHub Pages Setup Guide

This document provides instructions for setting up GitHub Pages deployment for the PDF sharing website.

## Repository Configuration

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** > **Pages**
3. Under "Source", select **GitHub Actions**
4. The deployment workflow will automatically trigger on pushes to `main` (or `master`)

### 2. Repository Settings

Ensure your repository has the following settings:

- **Repository name**: Should be `username.github.io` for user site or any name for project site
- **Visibility**: Public is required if you use the Giscus comment system
- **Branch**: Default branch should contain the website files

### 3. Custom Domain (Optional)

If you want to use a custom domain:

1. In repository **Settings** > **Pages**
2. Enter your custom domain in the "Custom domain" field
3. Create a `CNAME` file in the repository root with your domain
4. Configure DNS records with your domain provider

## Workflow Configuration

The GitHub Actions workflow (`.github/workflows/deploy.yml`) handles:

- **Validation** on pushes and pull requests (JavaScript syntax check, metadata validation)
- **Manifest validation** via `scripts/build-site.py --check` (the committed `pdfs/metadata/manifest.json` is deployed as-is)
- **Artifact upload** and deployment to GitHub Pages (skipped for pull requests)
- **Proper permissions** for GitHub Pages deployment

There is no Jekyll step: the site is plain static files, published as-is from the
repository root (`.git`, `.github` and dotfiles are excluded by the upload action).

## File Structure for Deployment

The following files are essential for GitHub Pages deployment:

```
/
├── .github/workflows/deploy.yml  # GitHub Actions workflow
├── scripts/build-site.py         # Regenerates/validates the manifest
├── index.html                    # Homepage (entry point)
├── directory.html                # Directory listing page
├── viewer.html                   # PDF viewer page
├── css/                          # Stylesheets
├── js/                           # JavaScript files
├── pdfs/                         # PDF files and metadata
└── assets/                       # Static assets
```

## Testing Deployment

### Local Testing

Before deploying, you can test locally:

1. Generate the manifest so the library renders (only needed once, or after adding PDFs):
   ```bash
   python3 scripts/build-site.py
   ```
2. Serve files using a local HTTP server:
   ```bash
   python3 -m http.server 8000
   # or
   npx serve .
   ```

3. Open `http://localhost:8000` in your browser
4. Test all functionality (homepage, directory, PDF viewing)

### Production Testing

After deployment:

1. Visit your GitHub Pages URL (`https://username.github.io` for a user site, `https://username.github.io/repository-name` for a project site)
2. Test all pages and functionality
3. Check browser console for any errors
4. Verify PDF files load correctly
5. Test responsive design on mobile devices

## Troubleshooting

### Common Issues

1. **404 errors**: Check that `index.html` exists in the repository root
2. **CSS/JS not loading**: Verify file paths are relative and correct
3. **PDF files not accessible**: Ensure PDFs are committed to the repository
4. **Workflow failures**: Check the Actions tab for error details

### Deployment Status

Monitor deployment status:

1. Go to **Actions** tab in your repository
2. Check the latest workflow run
3. Review logs if deployment fails
4. Ensure all required files are present

### Cache Issues

If changes don't appear:

1. Hard refresh the browser (Ctrl+F5 or Cmd+Shift+R)
2. Check if deployment completed successfully
3. Wait a few minutes for CDN cache to update
4. Try accessing the site in an incognito/private window

## Security Considerations

- **PDF files**: Only commit PDFs you want to be publicly accessible
- **Metadata**: Ensure metadata files don't contain sensitive information
- **Repository**: Consider repository visibility (public vs private)
- **Comments**: Configure Giscus moderation settings appropriately

## Performance Optimization

- **File sizes**: Keep PDF files reasonably sized for web delivery
- **Images**: Optimize any images in the assets folder
- **Caching**: GitHub Pages automatically handles caching headers
- **CDN**: GitHub Pages uses a global CDN for fast delivery