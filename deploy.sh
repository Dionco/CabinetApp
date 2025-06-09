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
        
        # Extract the deployment URL from the output
        DEPLOYMENT_URL=$(echo "$DEPLOY_OUTPUT" | grep -E "https://house-finance-tracker-[a-zA-Z0-9]+-dions-projects-[a-zA-Z0-9]+\.vercel\.app" | tail -1)
        
        if [[ -n "$DEPLOYMENT_URL" ]]; then
            print_status "Deployment URL: $DEPLOYMENT_URL"
            return 0
        else
            print_warning "Could not extract deployment URL from Vercel output"
            print_status "Vercel output:"
            echo "$DEPLOY_OUTPUT"
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
        
        # Extract just the hostname from the URL
        DEPLOYMENT_HOST=$(echo "$DEPLOYMENT_URL" | sed 's|https://||')
        
        if npx vercel alias "$DEPLOYMENT_HOST" "$DOMAIN"; then
            print_success "Domain alias updated successfully!"
            print_success "🌐 Your app is now live at: https://$DOMAIN"
        else
            print_error "Failed to update domain alias!"
            print_warning "You may need to update it manually:"
            print_warning "npx vercel alias $DEPLOYMENT_HOST $DOMAIN"
        fi
    else
        print_warning "Skipping domain update - no deployment URL available"
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
    echo "  ./deploy.sh [commit_message]"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh                                    # Interactive mode"
    echo "  ./deploy.sh \"Fix payment toggle bug\"           # With commit message"
    echo "  ./deploy.sh \"Add new analytics features\""
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
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
    # Check for help flag
    if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
        show_help
        exit 0
    fi
    
    print_header
    
    # Pre-flight checks
    check_directory
    check_changes
    
    # Get commit message
    get_commit_message "$1"
    
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
