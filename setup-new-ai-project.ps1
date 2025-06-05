# AI Supercharge Project Setup Script
# Run this in your new project directory

param(
    [string]$ProjectName = "ai-supercharge"
)

Write-Host "Setting up AI Supercharge project: $ProjectName" -ForegroundColor Green

# Create project structure
$dirs = @(
    "data-collection",
    "intelligence", 
    "execution",
    "execution/automation-scripts",
    "memory",
    "memory/learning-data",
    "config"
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "Created directory: $dir" -ForegroundColor Yellow
}

# Copy context file
if (Test-Path "../mm-breakdown/ai-supercharge-context.md") {
    Copy-Item "../mm-breakdown/ai-supercharge-context.md" -Destination "."
    Write-Host "Copied context file" -ForegroundColor Green
} else {
    Write-Host "Context file not found - make sure to copy ai-supercharge-context.md manually" -ForegroundColor Red
}

# Initialize git if not already done
if (-not (Test-Path ".git")) {
    git init
    Write-Host "Initialized git repository" -ForegroundColor Green
}

# Create initial files
@"
# AI Supercharge System

This project supercharges AI assistant capabilities by providing broader system access.

## Quick Start
1. Review ai-supercharge-context.md for full background
2. Run setup-new-ai-project.ps1 to initialize structure  
3. Install dependencies: pip install -r requirements.txt
4. Start with basic screenshot capture

## Context Transfer
When working with AI assistant, attach ai-supercharge-context.md to provide full context of our previous discussion and plans.
"@ | Out-File -FilePath "README.md" -Encoding UTF8

# Create requirements.txt
@"
pillow
pytesseract
psutil
keyboard
mouse
watchdog
requests
"@ | Out-File -FilePath "requirements.txt" -Encoding UTF8

# Create initial config
@"
{
    "screenshot_interval": 5,
    "ocr_enabled": true,
    "system_monitoring": true,
    "memory_retention_days": 30,
    "auto_action_enabled": false
}
"@ | Out-File -FilePath "config/settings.json" -Encoding UTF8

Write-Host "`nProject setup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd $ProjectName" -ForegroundColor White
Write-Host "2. Share ai-supercharge-context.md with AI assistant" -ForegroundColor White
Write-Host "3. Say: 'Let's build the AI supercharge system we planned'" -ForegroundColor White 