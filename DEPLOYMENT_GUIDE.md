# 🚀 CabinetApp Deployment Guide

## Quick Deploy Script

I've created a comprehensive deployment script (`deploy.sh`) that automates your entire deployment workflow.

### Usage

```bash
# Interactive mode (prompts for commit message)
./deploy.sh

# With commit message
./deploy.sh "Add new feature for consumption tracking"

# Show help
./deploy.sh --help
```

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
