# Deployment Checklist

Use this checklist to ensure your PDF sharing website is properly configured and deployed.

## Pre-Deployment Setup

### Repository Configuration
- [ ] Repository is created and accessible
- [ ] Repository name follows convention (`username.github.io` for user site)
- [ ] Repository visibility is public (required for Giscus)
- [ ] All necessary files are committed to the default branch (`main` or `master`)

### File Structure
- [ ] `index.html` exists in repository root
- [ ] `directory.html` and `viewer.html` are present
- [ ] CSS files are in `css/` directory
- [ ] JavaScript files are in `js/` directory
- [ ] PDF files are in `pdfs/` directory
- [ ] Metadata files are in `pdfs/metadata/` directory (if used)

### Configuration Files
- [ ] `config.json` is configured with correct site information
- [ ] `.github/workflows/deploy.yml` workflow file exists
- [ ] `scripts/build-site.py` exists (regenerates the manifest on every deploy)

## GitHub Pages Setup

### Repository Settings
- [ ] Navigate to repository Settings → Pages
- [ ] Source is set to "GitHub Actions"
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS enforcement enabled

### GitHub Actions
- [ ] Workflow file is in `.github/workflows/deploy.yml`
- [ ] Workflow has proper permissions for Pages deployment
- [ ] No syntax errors in workflow YAML

## Content Preparation

### PDF Files
- [ ] All PDF files are under 25MB (GitHub limit)
- [ ] PDF files have descriptive, web-friendly names
- [ ] Files are not corrupted and open correctly
- [ ] Total repository size is under 1GB

### Metadata Files
- [ ] Metadata JSON files match PDF filenames exactly
- [ ] All metadata files have required fields (title, description, tags)
- [ ] JSON syntax is valid (use validator to check)
- [ ] Tags are consistent and useful for search

### Sample Content
- [ ] At least one sample PDF with metadata for testing
- [ ] Featured PDFs are marked appropriately
- [ ] Categories are defined consistently

## Deployment Process

### Initial Deployment
- [ ] All files committed and pushed to the default branch (`main` or `master`)
- [ ] GitHub Actions workflow triggered automatically
- [ ] Workflow completes without errors
- [ ] Site is accessible at GitHub Pages URL

### Verification Steps
- [ ] Homepage loads correctly
- [ ] Directory listing displays PDFs
- [ ] PDF viewer opens and displays documents
- [ ] Search and filtering work properly
- [ ] Mobile responsive design functions correctly

## Post-Deployment Testing

### Functionality Testing
- [ ] Run deployment test suite (`/tests/deployment-test-runner.html`)
- [ ] Test all navigation links
- [ ] Verify PDF loading and viewing
- [ ] Check search and tag filtering
- [ ] Test comment system (if enabled)

### Cross-Browser Testing
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Performance Testing
- [ ] Page load times under 3 seconds
- [ ] PDF loading is reasonable for file sizes
- [ ] No JavaScript errors in browser console
- [ ] Responsive design works on various screen sizes

## Optional Features

### Comment System (Giscus)
- [ ] GitHub Discussions enabled in repository
- [ ] Giscus GitHub App installed on the repository: https://github.com/apps/giscus
- [ ] `GISCUS_REPO_ID` and `GISCUS_CATEGORY_ID` repository variables set (Settings → Secrets and variables → Variables)
- [ ] Comments display correctly on PDF viewer pages

### Custom Domain
- [ ] DNS records configured with domain provider
- [ ] CNAME file added to repository root
- [ ] SSL certificate provisioned and working
- [ ] Redirects from old URLs working (if applicable)

### Analytics (Optional)
- [ ] Google Analytics or similar service configured
- [ ] Tracking code added to HTML templates
- [ ] Privacy policy updated if required

## Maintenance Tasks

### Regular Updates
- [ ] Keep PDF.js library updated
- [ ] Monitor GitHub Actions for any failures
- [ ] Review and update metadata as needed
- [ ] Check for broken links or missing files

### Content Management
- [ ] Establish process for adding new PDFs
- [ ] Create backup of repository content
- [ ] Document any custom modifications
- [ ] Plan for content organization as library grows

## Troubleshooting Common Issues

### Deployment Failures
- [ ] Check GitHub Actions logs for specific errors
- [ ] Verify all required files are present
- [ ] Ensure workflow YAML syntax is correct
- [ ] Check repository permissions and settings

### Content Issues
- [ ] Validate JSON metadata files
- [ ] Check PDF file integrity
- [ ] Verify file paths and naming conventions
- [ ] Test with minimal content first

### Performance Problems
- [ ] Optimize PDF file sizes
- [ ] Check for large assets or images
- [ ] Monitor repository size limits
- [ ] Consider using Git LFS for large files

## Security Considerations

### Content Security
- [ ] Only commit PDFs intended for public access
- [ ] Review metadata for sensitive information
- [ ] Consider repository visibility settings
- [ ] Set up appropriate comment moderation

### Access Control
- [ ] Configure branch protection rules if needed
- [ ] Review collaborator permissions
- [ ] Monitor repository access logs
- [ ] Keep dependencies updated

## Success Criteria

Your deployment is successful when:
- ✅ Site loads at GitHub Pages URL without errors
- ✅ All PDFs are accessible and viewable
- ✅ Search and navigation work correctly
- ✅ Mobile experience is functional
- ✅ No JavaScript errors in browser console
- ✅ Deployment test suite passes all checks

## Next Steps

After successful deployment:
1. Share the site URL with intended users
2. Monitor usage and gather feedback
3. Plan content additions and updates
4. Consider additional features or customizations
5. Set up regular maintenance schedule

## Support Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Giscus Documentation](https://giscus.app/)
- Repository Issues for specific problems