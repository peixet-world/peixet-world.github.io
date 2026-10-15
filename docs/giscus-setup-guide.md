# Giscus Setup Guide

This guide explains how to configure Giscus for the PDF sharing website's comment system.

## Prerequisites

1. **GitHub Repository**: Your website must be hosted in a public GitHub repository
2. **GitHub Discussions**: Must be enabled in your repository
3. **Giscus GitHub App**: Must be installed on your repository (see Step 2)
4. **GitHub Pages**: Your site should be deployed via GitHub Pages

## Step 1: Enable Discussions

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Scroll down to **Features** section
4. Check the box for **Discussions**
5. Click **Set up discussions** if prompted
6. Add a category for comments (e.g. "General") if one does not exist - Giscus needs
   an existing category to attach threads to

## Step 2: Install the Giscus GitHub App

This is a one-time, account-level action that **only the repository owner can do** -
nothing inside the repository declares it, and no build can detect or set it.

1. Visit [github.com/apps/giscus](https://github.com/apps/giscus)
2. Click **Install** (or **Configure** if you already have the app on your account)
3. Select the account that owns the repository
4. Choose **All repositories** or **Only select repositories** and pick this repository
5. Approve the permissions: read `metadata`, write `discussions`

Verify it worked (no browser needed):

```bash
curl -sG https://giscus.app/api/discussions \
  --data-urlencode "repo=owner/repository-name" \
  --data-urlencode "category=General" \
  --data-urlencode "term=/" \
  -d "number=0&strict=true&first=1"
```

- A payload containing `"discussion"` → installed and working
- `{"error":"giscus is not installed on this repository"}` → still missing

The deploy workflow runs this check on every push and prints a warning if the app
is missing. Note that a fork does **not** inherit the app installation: the new
owner must install it again after a repository transfer.

## Step 3: Configure Giscus

1. Visit [giscus.app](https://giscus.app)
2. Enter your repository name in the format `username/repository-name`
3. Choose your preferred settings:
   - **Page ↔️ Discussions Mapping**: Select "Discussion title contains page pathname"
   - **Discussion Category**: Choose "General" or the category you created in Step 1
   - **Features**: Enable reactions, metadata, etc. as desired
   - **Theme**: Choose light/dark theme

> The mapping chosen here only affects the preview on giscus.app. The website
> overrides it at runtime: each PDF gets its own discussion thread, matched by the
> term `pdf-<filename>` (e.g. `pdf-cv`).

## Step 4: Get Configuration Values

After configuring on giscus.app, you'll get a script tag like this:

```html
<script src="https://giscus.app/client.js"
        data-repo="username/repository-name"
        data-repo-id="R_kgDOExample123"
        data-category="General"
        data-category-id="DIC_kwDOExample456"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="bottom"
        data-theme="light"
        data-lang="en"
        crossorigin="anonymous"
        async>
</script>
```

Copy `data-repo-id` and `data-category-id`.

## Step 5: Store the Values

Edit `config.json` in the repository and commit the result:

1. Set `giscus.repo` to `owner/repository`
2. Set `giscus.repoId` to the `data-repo-id` value
3. Set `giscus.categoryId` to the `data-category-id` value

The committed `config.json` is the single source of truth - the deploy publishes
the repository as-is, so the values take effect on the next push.

## Step 6: Test the Integration

1. Open `tests/giscus-demo.html` in your browser
2. Click "Load Configuration" to load your settings
3. Click "Test Validation" to verify configuration
4. Click "Setup Comments" to test the Giscus widget

## Important Configuration Values

- **repo**: `owner/repository` - set in `config.json`
- **repoId**: Unique identifier for your repository (get from giscus.app, set as `giscus.repoId` in `config.json`)
- **categoryId**: Unique identifier for the discussion category (get from giscus.app, set as `giscus.categoryId` in `config.json`)

## Troubleshooting

### Comments Not Loading
- Verify GitHub Discussions are enabled
- Check that repository is public
- Verify the Giscus app is installed (Step 2, or run the `curl` check)
- Ensure `giscus.repoId` / `giscus.categoryId` in `config.json` are set and
  do not still contain the example values (`R_kgDOExample123`, `DIC_kwDOExample456`) -
  the site treats placeholder values as "not configured"

### Fallback Message Appears
- This is normal for invalid configurations
- Check browser console for messages logged by `CommentIntegration`
- Verify all required configuration values are present

### Testing Locally
- Giscus requires the page to be served from the configured domain
- For local testing, the fallback message will appear
- Full functionality works only when deployed to GitHub Pages

## Security Considerations

- Giscus uses GitHub OAuth for authentication
- Comments are stored in GitHub Discussions
- Repository owner has full moderation control
- No external database or API keys required

## Next Steps

After completing this setup:
1. Deploy your site to GitHub Pages
2. Test comments on the live site
3. Configure moderation settings in GitHub Discussions
4. Customize the comment theme to match your site