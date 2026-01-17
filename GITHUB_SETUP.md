# GitHub Setup Guide for loz.watch

## Step 1: Install Git

You need Git installed to push code to GitHub. Choose one option:

### Option A: Install Git for Windows (Recommended)
1. Download from: https://git-scm.com/download/win
2. Run the installer (use default settings)
3. **Important:** Restart your terminal/VS Code after installation

### Option B: Install via GitHub Desktop (Easier GUI)
1. Download from: https://desktop.github.com/
2. This includes Git and a visual interface
3. Sign in with your GitHub account

### Option C: Install via Winget (if available)
```powershell
winget install --id Git.Git -e --source winget
```

## Step 2: Verify Git Installation

After installing, restart your terminal and run:
```powershell
git --version
```

You should see something like: `git version 2.x.x`

## Step 3: Configure Git (First Time Only)

Set your name and email (used for commits):
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 4: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `loz-watch` (or any name you prefer)
3. Description: "Lake of the Ozarks real-time information dashboard"
4. Choose: **Private** or **Public** (your choice)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 5: Initialize and Push Your Code

Once Git is installed, run these commands in your project directory:

```powershell
# Navigate to your project (if not already there)
cd C:\Watched.loz

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - loz.watch production ready"

# Add GitHub remote (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note:** You'll be prompted for GitHub credentials:
- **Username:** Your GitHub username
- **Password:** Use a Personal Access Token (not your GitHub password)
  - Create one at: https://github.com/settings/tokens
  - Select scope: `repo` (full control of private repositories)

## Alternative: Using GitHub Desktop

If you installed GitHub Desktop:

1. Open GitHub Desktop
2. File → Add Local Repository
3. Choose `C:\Watched.loz`
4. Click "Publish repository" button
5. Choose name and visibility
6. Click "Publish Repository"

## Quick Reference: Commands You'll Need

```powershell
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull latest changes
git pull
```

## Troubleshooting

**"git is not recognized"**
- Git isn't installed or terminal needs restart
- Install Git and restart VS Code/terminal

**"Authentication failed"**
- Use Personal Access Token instead of password
- Create token: https://github.com/settings/tokens

**"Repository not found"**
- Check repository name matches
- Verify you have access to the repository

---

**Once your code is on GitHub, you can proceed with Vercel deployment!** 🚀

See `QUICK_DEPLOY.md` for next steps.

