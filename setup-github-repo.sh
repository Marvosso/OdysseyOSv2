#!/bin/bash
# Bash script to set up and push to new GitHub repository
# Usage: ./setup-github-repo.sh <github-repo-url>

if [ -z "$1" ]; then
    echo "Error: GitHub repository URL required"
    echo "Usage: ./setup-github-repo.sh <github-repo-url>"
    exit 1
fi

REPO_URL=$1

echo "Setting up Git repository and pushing to GitHub..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: Git is not installed. Please install Git first."
    exit 1
fi

# Initialize git repository if not already initialized
if [ ! -d .git ]; then
    echo "Initializing Git repository..."
    git init
else
    echo "Git repository already initialized."
fi

# Add all files
echo "Adding files to Git..."
git add .

# Create initial commit
echo "Creating initial commit..."
git commit -m "Initial commit: OdysseyOS v2 with data integrity features

- Autosave race condition prevention
- Backup and restore system
- Transaction support
- Date serialization fixes
- Import pipeline edge case handling
- Validation layer
- Comprehensive test suite"

# Add remote (remove if exists, then add)
echo "Setting up remote repository..."
git remote remove origin 2>/dev/null
git remote add origin "$REPO_URL"

# Push to GitHub
echo "Pushing to GitHub..."
echo "Note: You may be prompted for GitHub credentials."

# Try to push (user will need to authenticate)
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo "Successfully pushed to GitHub!"
else
    echo "Push failed. You may need to:"
    echo "1. Authenticate with GitHub (use Personal Access Token)"
    echo "2. Or use SSH: git remote set-url origin git@github.com:USERNAME/REPO.git"
    echo "3. Then run: git push -u origin main"
fi
