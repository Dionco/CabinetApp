# 🚀 CabinetApp Deployment Guide

## Quick Deploy Script

I've created a comprehensive deployment script (`deploy.sh`) that automates your entire deployment workflow.

### Usage

```bash
# Interactive mode (prompts for commit message)
./deploy.sh

# With commit message
./deploy.sh "Add new feature for consumption tracking"

# With debug output for troubleshooting
./deploy.sh --debug "Test deployment with verbose output"

# Show help
./deploy.sh --help
```

### Options

- **`-h, --help`**: Show help message with usage examples
- **`-d, --debug`**: Enable debug output for troubleshooting deployment issues

### What the Script Does

1. **✅ Pre-flight Checks**
   - Verifies you're in the correct directory
   - Checks if there are changes to deploy
   - Validates project structure

2. **🔨 Build Validation**
   - Runs `npm run build` to ensure no build errors
   - Stops deployment if build fails

3. **📝 Git Operations**
   - Adds all changes (`git add .`)
   - Commits with your message
   - Pushes to GitHub main branch

4. **🚀 Vercel Deployment**
   - Deploys to Vercel production
   - Extracts the new deployment URL

5. **🌐 Domain Management**
   - Updates `cabinetapp.vercel.app` to point to new deployment
   - Improved URL parsing with multiple fallback patterns
   - Better error handling with troubleshooting information

### Recent Improvements (June 2025)

- **Enhanced URL Parsing**: Fixed deployment URL extraction with multiple regex patterns
- **Debug Mode**: Added `--debug` flag for verbose output during troubleshooting
- **Better Error Handling**: Fallback to `vercel ls` if URL extraction fails
- **Improved Alias Management**: More robust domain alias updates
- **Detailed Help**: Comprehensive usage examples and options documentation
   - Ensures your custom domain always works

6. **📊 Summary Report**
   - Shows deployment status
   - Provides all relevant URLs
   - Displays commit information

### Examples

```bash
# Deploy with a descriptive commit message
./deploy.sh "Fix Firebase consumption payment error"

# Deploy UI improvements
./deploy.sh "Make settlements collapsible for better UX"

# Deploy analytics enhancements
./deploy.sh "Convert consumption chart to stacked bar chart"

# Quick deploy (will prompt for message)
./deploy.sh
```

### Error Handling

The script will stop and show errors if:
- Build fails (syntax errors, missing dependencies)
- Git operations fail
- Vercel deployment fails
- You're not in the project directory

### Color-Coded Output

- 🔵 **Blue**: Info messages
- 🟢 **Green**: Success messages
- 🟡 **Yellow**: Warnings
- 🔴 **Red**: Errors

### Safety Features

- Builds project first to catch errors early
- Confirms before proceeding if no changes detected
- Provides fallback commit messages
- Shows comprehensive deployment summary

## Troubleshooting

### Domain Alias Issues

If the domain alias fails to update automatically:

```bash
# Check available deployments
npx vercel ls --limit 5

# Manually set the alias
npx vercel alias <deployment-url> cabinetapp.vercel.app
```

### Debug Mode

Use debug mode to see detailed output:

```bash
./deploy.sh --debug "Test deployment"
```

This will show:
- Full Vercel output
- URL parsing attempts
- Debug information for troubleshooting

### Common Issues

1. **"Could not extract deployment URL"**
   - Enable debug mode to see Vercel output
   - Script will attempt to use `vercel ls` as fallback
   - Manually set alias if needed

2. **Build failures**
   - Check for syntax errors in code
   - Ensure all dependencies are installed
   - Review build output for specific errors

3. **Git push failures**
   - Check if you have push permissions
   - Ensure you're on the correct branch
   - Verify remote repository is accessible

## Manual Commands (if needed)

If you prefer to run commands manually:

```bash
# 1. Build and test
npm run build

# 2. Git operations
git add .
git commit -m "Your commit message"
git push origin main

# 3. Deploy to Vercel
npx vercel --prod

# 4. Update domain (replace URL with actual deployment URL)
npx vercel alias house-finance-tracker-XXXXX-dions-projects-96b08087.vercel.app cabinetapp.vercel.app
```

## Live URLs

- **Production Site**: https://cabinetapp.vercel.app
- **GitHub Repo**: https://github.com/Dionco/CabinetApp
- **Vercel Dashboard**: https://vercel.com/dashboard

---

**Pro Tip**: Keep this script in your project root and use it for all deployments to ensure consistency! 🎯
