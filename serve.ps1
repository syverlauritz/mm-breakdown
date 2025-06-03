# Memory Maker Shot Breakdown Server
Write-Host "Starting Memory Maker Shot Breakdown server..." -ForegroundColor Green
Write-Host ""
Write-Host "The server will be available at:" -ForegroundColor Yellow
Write-Host "  http://localhost:8000" -ForegroundColor Cyan
Write-Host "  http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

try {
    # Try Python 3 first
    python -m http.server 8000
}
catch {
    try {
        # If Python 3 fails, try Python 2
        Write-Host "Python 3 not found, trying Python 2..." -ForegroundColor Yellow
        python -m SimpleHTTPServer 8000
    }
    catch {
        Write-Host ""
        Write-Host "Error: Python not found or not in PATH" -ForegroundColor Red
        Write-Host "Please install Python 3 and make sure it's in your PATH" -ForegroundColor Yellow
        Write-Host "You can download Python from: https://www.python.org/downloads/" -ForegroundColor Cyan
        Write-Host ""
        Read-Host "Press Enter to exit"
    }
} 