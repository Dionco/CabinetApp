#!/bin/bash

# CabinetApp Deployment Script
# This script automates the complete deployment process:
# 1. Checks for changes
# 2. Builds the project locally
# 3. Commits and pushes to GitHub
# 4. Deploys to Vercel
# 5. Updates the domain alias

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="cabinetapp.vercel.app"
BRANCH="main"
DEBUG_MODE=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_debug() {
    if [[ "$DEBUG_MODE" == "true" ]]; then
        echo -e "${YELLOW}[DEBUG]${NC} $1"
    fi
}

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  🚀 CabinetApp Deployment Script${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to check if we're in the right directory
check_directory() {
    if [[ ! -f "package.json" ]] || [[ ! -d "src" ]]; then
        print_error "Not in the correct project directory. Please run this script from the house-finance-tracker root."
        exit 1
    fi
}

# Function to check if there are any changes to commit
check_changes() {
    if git diff --quiet && git diff --staged --quiet; then
        print_warning "No changes detected in the repository."
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deployment cancelled."
            exit 0
        fi
    fi
}

# Function to get commit message
get_commit_message() {
    if [[ -n "$1" ]]; then
        COMMIT_MESSAGE="$1"
    else
        print_status "Enter a commit message:"
        read -r COMMIT_MESSAGE
        if [[ -z "$COMMIT_MESSAGE" ]]; then
            COMMIT_MESSAGE="Update: $(date '+%Y-%m-%d %H:%M:%S')"
            print_warning "Using default commit message: $COMMIT_MESSAGE"
        fi
    fi
}

# Function to build the project
build_project() {
    print_status "Building the project locally..."
    if npm run build; then
        print_success "Build completed successfully!"
    else
        print_error "Build failed! Please fix the errors before deploying."
        exit 1
    fi
}

# Function to commit and push to GitHub
git_operations() {
    print_status "Adding all changes to git..."
    git add .
    
    if git diff --staged --quiet; then
        print_warning "No staged changes to commit."
    else
        print_status "Committing changes..."
        git commit -m "$COMMIT_MESSAGE"
        print_success "Changes committed successfully!"
    fi
    
    print_status "Pushing to GitHub ($BRANCH branch)..."
    if git push origin "$BRANCH"; then
        print_success "Successfully pushed to GitHub!"
    else
        print_error "Failed to push to GitHub!"
        exit 1
    fi
}

# Function to deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    # Deploy and capture the deployment URL
    DEPLOY_OUTPUT=$(npx vercel --prod 2>&1)
    
    if [[ $? -eq 0 ]]; then
        print_success "Successfully deployed to Vercel!"
        
        print_debug "Vercel output:"
        print_debug "$DEPLOY_OUTPUT"
        
        # Extract the deployment URL from the output using multiple patterns
        # Try to find the production URL line
        DEPLOYMENT_URL=$(echo "$DEPLOY_OUTPUT" | grep -E "✅.*Production.*https://" | grep -oE "https://[a-zA-Z0-9\-]+\.vercel\.app" | tail -1)
        print_debug "Pattern 1 result: $DEPLOYMENT_URL"
        
        # If that doesn't work, try alternative patterns
        if [[ -z "$DEPLOYMENT_URL" ]]; then
            DEPLOYMENT_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE "https://house-finance-tracker-[a-zA-Z0-9\-]+\.vercel\.app" | tail -1)
            print_debug "Pattern 2 result: $DEPLOYMENT_URL"
        fi
        
        # Last resort: look for any vercel.app URL
        if [[ -z "$DEPLOYMENT_URL" ]]; then
            DEPLOYMENT_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE "https://[a-zA-Z0-9\-]+\.vercel\.app" | tail -1)
            print_debug "Pattern 3 result: $DEPLOYMENT_URL"
        fi
        
        if [[ -n "$DEPLOYMENT_URL" ]]; then
            print_status "Deployment URL: $DEPLOYMENT_URL"
            return 0
        else
            print_warning "Could not extract deployment URL from Vercel output"
            if [[ "$DEBUG_MODE" != "true" ]]; then
                print_status "Vercel output:"
                echo "$DEPLOY_OUTPUT"
            fi
            
            # Try to get the latest deployment URL using vercel ls
            print_status "Attempting to get latest deployment URL..."
            LATEST_DEPLOYMENT=$(npx vercel ls --limit 1 2>/dev/null | grep -oE "https://[a-zA-Z0-9\-]+\.vercel\.app" | head -1)
            if [[ -n "$LATEST_DEPLOYMENT" ]]; then
                DEPLOYMENT_URL="$LATEST_DEPLOYMENT"
                print_status "Found latest deployment: $DEPLOYMENT_URL"
                return 0
            fi
            
            return 1
        fi
    else
        print_error "Vercel deployment failed!"
        echo "$DEPLOY_OUTPUT"
        exit 1
    fi
}

# Function to update domain alias
update_domain() {
    if [[ -n "$DEPLOYMENT_URL" ]]; then
        print_status "Updating domain alias to point to new deployment..."
        
        # Extract just the hostname from the URL (remove https://)
        DEPLOYMENT_HOST=$(echo "$DEPLOYMENT_URL" | sed 's|https://||' | sed 's|/.*||')
        
        print_status "Setting alias: $DOMAIN -> $DEPLOYMENT_HOST"
        
        if npx vercel alias "$DEPLOYMENT_HOST" "$DOMAIN"; then
            print_success "Domain alias updated successfully!"
            print_success "🌐 Your app is now live at: https://$DOMAIN"
        else
            print_error "Failed to update domain alias!"
            print_warning "You may need to update it manually:"
            print_warning "npx vercel alias $DEPLOYMENT_HOST $DOMAIN"
            
            # Show troubleshooting info
            print_status "Available deployments:"
            npx vercel ls --limit 5 2>/dev/null || true
        fi
    else
        print_warning "Skipping domain update - no deployment URL available"
        print_status "You can manually set the alias later with:"
        print_status "npx vercel alias <deployment-url> $DOMAIN"
    fi
}

# Function to show deployment summary
show_summary() {
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}📦 Commit:${NC} $COMMIT_MESSAGE"
    echo -e "${GREEN}🌐 Live URL:${NC} https://$DOMAIN"
    echo -e "${GREEN}📱 GitHub:${NC} https://github.com/Dionco/CabinetApp"
    
    if [[ -n "$DEPLOYMENT_URL" ]]; then
        echo -e "${GREEN}🔗 Vercel URL:${NC} $DEPLOYMENT_URL"
    fi
    
    echo -e "${GREEN}========================================${NC}\n"
}

# Function to show help
show_help() {
    echo "CabinetApp Deployment Script"
    echo ""
    echo "Usage:"
    echo "  ./deploy.sh [commit_message] [options]"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh                                    # Interactive mode"
    echo "  ./deploy.sh \"Fix payment toggle bug\"           # With commit message"
    echo "  ./deploy.sh \"Add new analytics features\""
    echo "  ./deploy.sh --debug \"Test deployment\"          # With debug output"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -d, --debug    Enable debug output for troubleshooting"
    echo ""
    echo "What this script does:"
    echo "  1. ✅ Checks for changes in the repository"
    echo "  2. 🔨 Builds the project locally"
    echo "  3. 📝 Commits and pushes changes to GitHub"
    echo "  4. 🚀 Deploys to Vercel production"
    echo "  5. 🌐 Updates the cabinetapp.vercel.app domain"
    echo ""
}

# Main execution
main() {
    # Parse arguments
    COMMIT_MESSAGE_ARG=""
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -d|--debug)
                DEBUG_MODE=true
                print_status "Debug mode enabled"
                shift
                ;;
            *)
                if [[ -z "$COMMIT_MESSAGE_ARG" ]]; then
                    COMMIT_MESSAGE_ARG="$1"
                fi
                shift
                ;;
        esac
    done
    
    print_header
    
    # Pre-flight checks
    check_directory
    check_changes
    
    # Get commit message
    get_commit_message "$COMMIT_MESSAGE_ARG"
    
    # Build project
    build_project
    
    # Git operations
    git_operations
    
    # Deploy to Vercel
    deploy_vercel
    
    # Update domain
    update_domain
    
    # Show summary
    show_summary
}

# Run main function with all arguments
main "$@"
