# Tauri Icons

This directory contains placeholder icons for the MSN Messenger Tauri application.

## Current Status
- ✅ Placeholder SVG icons generated
- ❌ Need proper PNG conversion
- ❌ Need proper ICO file
- ❌ Need proper ICNS file

## Required Icons
- 32x32.png - Small icon for Windows taskbar
- 128x128.png - Standard icon
- 128x128@2x.png - High-DPI icon for Retina displays
- icon.ico - Windows icon bundle
- icon.icns - macOS icon bundle

## TODO
1. Design proper MSN Messenger icon
2. Convert SVG to PNG using a tool like Inkscape or online converter
3. Generate proper ICO file using a tool like ImageMagick
4. Generate proper ICNS file using iconutil (macOS) or online converter

## Commands to Convert (when you have proper source image)

### Convert SVG to PNG
```bash
# Using Inkscape
inkscape --export-type=png --export-width=32 --export-height=32 icon.svg --export-filename=32x32.png
inkscape --export-type=png --export-width=128 --export-height=128 icon.svg --export-filename=128x128.png
inkscape --export-type=png --export-width=256 --export-height=256 icon.svg --export-filename=128x128@2x.png
```

### Create ICO file
```bash
# Using ImageMagick
magick 32x32.png 128x128.png icon.ico
```

### Create ICNS file (macOS)
```bash
# Create iconset directory
mkdir icon.iconset
cp 32x32.png icon.iconset/icon_32x32.png
cp 128x128.png icon.iconset/icon_128x128.png
cp 128x128@2x.png icon.iconset/icon_128x128@2x.png

# Generate ICNS
iconutil -c icns icon.iconset
```
