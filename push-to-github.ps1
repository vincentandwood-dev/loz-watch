# GitHub Push Script for loz.watch
# Run this script AFTER installing Git

Write-Host "🚀 GitHub Push Script for loz.watch" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed!" -ForegroundColor Red
    Write-Host "Please install Git first: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Or use GitHub Desktop: https://desktop.github.com/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Create a new repository on GitHub (https://github.com/new)" -ForegroundColor White
Write-Host "2. Copy the repository URL (e.g., https://github.com/username/repo-name.git)" -ForegroundColor White
Write-Host "3. Run the commands below, replacing YOUR_USERNAME and YOUR_REPO_NAME" -ForegroundColor White
Write-Host ""

Write-Host "Commands to run:" -ForegroundColor Yellow
Write-Host "----------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "# Initialize repository" -ForegroundColor Gray
Write-Host "git init" -ForegroundColor White
Write-Host ""
Write-Host "# Add all files" -ForegroundColor Gray
Write-Host "git add ." -ForegroundColor White
Write-Host ""
Write-Host "# Create initial commit" -ForegroundColor Gray
Write-Host "git commit -m 'Initial commit - loz.watch production ready'" -ForegroundColor White
Write-Host ""
Write-Host "# Add GitHub remote (replace with your actual URL)" -ForegroundColor Gray
Write-Host "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git" -ForegroundColor White
Write-Host ""
Write-Host "# Push to GitHub" -ForegroundColor Gray
Write-Host "git branch -M main" -ForegroundColor White
Write-Host "git push -u origin main" -ForegroundColor White
Write-Host ""

Write-Host "💡 Tip: You'll need a Personal Access Token for authentication" -ForegroundColor Cyan
Write-Host "   Create one at: https://github.com/settings/tokens" -ForegroundColor Cyan
Write-Host "   Select scope: 'repo' (full control of private repositories)" -ForegroundColor Cyan
Write-Host ""

$response = Read-Host "Would you like to initialize the repository now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host ""
    Write-Host "Initializing repository..." -ForegroundColor Cyan
    
    # Check if already initialized
    if (Test-Path .git) {
        Write-Host "⚠️  Repository already initialized" -ForegroundColor Yellow
    } else {
        git init
        Write-Host "✅ Repository initialized" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Adding files..." -ForegroundColor Cyan
    git add .
    Write-Host "✅ Files added" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Creating commit..." -ForegroundColor Cyan
    git commit -m "Initial commit - loz.watch production ready"
    Write-Host "✅ Commit created" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📝 Next: Add your GitHub remote and push:" -ForegroundColor Cyan
    Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git" -ForegroundColor White
    Write-Host "   git branch -M main" -ForegroundColor White
    Write-Host "   git push -u origin main" -ForegroundColor White
    Write-Host ""
}

