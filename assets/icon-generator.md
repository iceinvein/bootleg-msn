# App Icon Generation Guide

## Required Icon Sizes

### iOS Icons

- 20x20 (iPhone Notification iOS 7-13)
- 29x29 (iPhone Settings iOS 7-13)
- 40x40 (iPhone Spotlight iOS 7-13)
- 58x58 (iPhone Settings @2x iOS 7-13)
- 60x60 (iPhone App iOS 7-13)
- 80x80 (iPhone Spotlight @2x iOS 7-13)
- 87x87 (iPhone Settings @3x iOS 7-13)
- 120x120 (iPhone App @2x iOS 7-13)
- 180x180 (iPhone App @3x iOS 7-13)
- 1024x1024 (App Store)

### Android Icons

- 36x36 (ldpi)
- 48x48 (mdpi)
- 72x72 (hdpi)
- 96x96 (xhdpi)
- 144x144 (xxhdpi)
- 192x192 (xxxhdpi)
- 512x512 (Google Play Store)

## Design Guidelines

### MSN Messenger Theme

- Primary Color: #0078d4 (MSN Blue)
- Secondary Color: #106ebe (Darker Blue)
- Background: White or transparent
- Style: Modern, clean, recognizable

### Icon Content

- MSN Messenger logo or stylized "M"
- Chat bubble or message icon
- Nostalgic but modern design
- High contrast for visibility

## Generation Tools

### Automated Tools

```bash
# Install capacitor-assets for automatic generation
npm install -g @capacitor/assets

# Generate icons from a single source (1024x1024)
npx @capacitor/assets generate --iconBackgroundColor '#0078d4' --iconBackgroundColorDark '#106ebe'
```

### Manual Creation

1. Create a 1024x1024 master icon
2. Use design tools (Figma, Sketch, Photoshop) to create all sizes
3. Export as PNG with transparent background
4. Place in appropriate platform directories

## Splash Screen Assets

### Design Requirements

- Background: MSN Blue gradient (#0078d4 to #106ebe)
- Logo: Centered, white or light colored
- Size: Various resolutions for different devices
- Format: PNG with proper DPI

### Automated Generation

```bash
# Generate splash screens from source image
npx @capacitor/assets generate --splashBackgroundColor '#0078d4'
```

## Implementation Steps

1. Create master icon (1024x1024) in `assets/icons/icon.png`
2. Create splash screen source in `assets/splash/splash.png`
3. Run generation command
4. Sync with native projects: `npx cap sync`
5. Test on devices to verify appearance

## Platform-Specific Notes

### iOS

- Icons are automatically rounded by the system
- No need to add rounded corners manually
- Ensure icon works well with iOS dark mode

### Android

- Adaptive icons supported (foreground + background)
- Consider creating adaptive icon layers
- Test on various Android launchers

## Quality Checklist

- [ ] Icon is clearly visible at small sizes (16x16)
- [ ] Icon maintains brand consistency
- [ ] Splash screen loads quickly and smoothly
- [ ] All required sizes are generated
- [ ] Icons work well in light and dark themes
- [ ] No pixelation or artifacts at any size
- [ ] Proper file formats (PNG for transparency)
- [ ] Optimized file sizes for app bundle
