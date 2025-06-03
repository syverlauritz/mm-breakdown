# Memory Maker - Shot Breakdown

A visual interface for browsing scenes from the Memory Maker film with advanced video playback features.

## Quick Start

To run the application locally, you can use one of the provided server scripts:

### Option 1: Windows Batch File (Easiest)
Double-click `serve.bat` or run in Command Prompt:
```cmd
serve.bat
```

### Option 2: PowerShell Script
Run in PowerShell:
```powershell
.\serve.ps1
```

### Option 3: Node.js Server
If you have Node.js installed:
```cmd
node serve-node.js
```

### Option 4: Manual Python Command
In PowerShell/Command Prompt:
```powershell
python -m http.server 8000
```

After starting any server, open your browser and go to:
- **http://localhost:8000**

## Features

### Thumbnail Video Previews
- **Hover to Preview**: When you hover over any thumbnail for 300ms, a video preview will appear showing only that specific scene segment
- **Timecode Accurate**: Each preview is strictly confined to the scene's start and end timecodes
- **Seamless Looping**: Previews loop continuously within the scene boundaries
- **Position Tracking**: Preview overlays follow scroll and resize events to stay aligned with thumbnails

### Modal Video Playback
- **Scene-Specific Playback**: Clicking a thumbnail opens a modal with video playback restricted to that scene's segment
- **Automatic Looping**: Modal video automatically loops within the scene boundaries
- **Enhanced Controls**: Navigation arrows and keyboard shortcuts (←/→) to move between scenes
- **Responsive Design**: Modal adapts to different screen sizes

### Technical Implementation
- **Precise Timing**: Uses frame-accurate calculations to ensure video segments are properly trimmed
- **Fallback Handling**: Gracefully handles very short scenes and edge cases
- **Performance Optimized**: Preview videos are muted and use metadata preloading
- **Error Handling**: Robust error handling for video loading and playback issues

## Video Formats Supported
- MP4 (H.264)
- WebM
- Multiple source fallbacks for browser compatibility

## Browser Requirements
- Modern browsers with HTML5 video support
- JavaScript enabled
- Autoplay policies may affect preview functionality (videos are muted to comply with modern browser policies)

## Usage
1. Load the page and wait for thumbnails to appear
2. Hover over any thumbnail to see a video preview of that scene
3. Click any thumbnail to open the full modal with scene-specific video playback
4. Use arrow keys or navigation buttons to move between scenes in the modal
5. Press Escape or click the close button to exit the modal

## Technical Details
- Frame-based calculations ensure precise scene boundaries
- Automatic position updating for preview overlays
- Optimized event handling to prevent memory leaks
- Responsive grid layout adapts to different screen sizes 