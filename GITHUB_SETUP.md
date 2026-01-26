# GitHub Repository Setup Guide

## Quick Setup

### Option 1: Use the Setup Script (Recommended)

**Windows (PowerShell):**
```powershell
.\setup-github-repo.ps1 https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**macOS/Linux (Bash):**
```bash
chmod +x setup-github-repo.sh
./setup-github-repo.sh https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Option 2: Manual Setup

#### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (don't initialize with README)
3. Copy the repository URL

#### Step 2: Initialize Git (if not already done)

```bash
git init
```

#### Step 3: Add All Files

```bash
git add .
```

#### Step 4: Create Initial Commit

```bash
git commit -m "Initial commit: OdysseyOS v2 with data integrity features

- Autosave race condition prevention
- Backup and restore system
- Transaction support
- Date serialization fixes
- Import pipeline edge case handling
- Validation layer
- Comprehensive test suite"
```

#### Step 5: Add Remote and Push

```bash
# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Authentication

### Option 1: Personal Access Token (HTTPS)

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` scope
3. When prompted for password, use the token instead

### Option 2: SSH (Recommended for frequent pushes)

1. Generate SSH key (if you don't have one):
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. Add SSH key to GitHub:
   - Copy public key: `cat ~/.ssh/id_ed25519.pub`
   - Add to GitHub Settings → SSH and GPG keys

3. Use SSH URL:
```bash
git remote set-url origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## What Gets Pushed

The repository includes:
- ✅ All source code (`src/`)
- ✅ Test suite (`tests/`)
- ✅ Documentation (`.md` files)
- ✅ Configuration files

Excluded (via `.gitignore`):
- ❌ `node_modules/`
- ❌ `.next/` (build output)
- ❌ `.env` files
- ❌ IDE files
- ❌ OS files

## After Pushing

### Recommended Next Steps

1. **Add README.md** (if not present):
   ```bash
   # Create a README describing the project
   ```

2. **Set up GitHub Actions** (optional):
   - Add CI/CD for tests
   - Automated testing on PRs

3. **Add License** (optional):
   ```bash
   # Add LICENSE file
   ```

4. **Protect Main Branch** (recommended):
   - Require PR reviews
   - Require status checks
   - Prevent force pushes

## Troubleshooting

### "Permission denied" Error

- Use Personal Access Token instead of password
- Or set up SSH authentication

### "Repository not found" Error

- Check repository URL is correct
- Verify you have push access
- Check authentication

### "Large files" Warning

- Files > 100MB may need Git LFS
- Check `.gitignore` is working

## Repository Structure

```
OdysseyOS/
├── src/              # Source code
├── tests/            # Test suite
├── .gitignore       # Git ignore rules
├── README.md        # Project documentation
└── ...              # Other files
```

---

**Ready to push! Run the setup script or follow manual steps above.** 🚀
