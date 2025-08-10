# Mobile Development Setup

This guide covers setting up the MSN Messenger app for mobile development using Capacitor.

## Prerequisites

### Required Software

- **Node.js 18+** and **pnpm** (for the web app)
- **Java 21+** (any version - the build will auto-download Java 21 if needed)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### Java Version Compatibility

The project is configured to work with **any Java version 21 or higher** (as required by Capacitor 7.0). If you have Java 23, 21, or any newer version, it will work automatically thanks to Gradle's toolchain auto-download feature.

**No need to downgrade your Java version!**

## Quick Setup

### Option 1: Full Mobile Setup (Recommended)

```bash
# Set up both Android and iOS platforms
pnpm run setup:mobile
```

This command will:

1. Add Android platform (`npx cap add android`)
2. Add iOS platform (`npx cap add ios`)
3. Configure Android for Java compatibility
4. Set up toolchain auto-download

### Option 2: Android Only

```bash
# Add Android platform
npx cap add android

# Configure Android for Java compatibility
pnpm run setup:android
```

### Option 3: Manual Setup

```bash
# Add platforms manually
npx cap add android
npx cap add ios

# Then run the Android setup script
node scripts/setup-android.js
```

## Development Workflow

### Building and Running

```bash
# Build web app and sync to mobile platforms
pnpm run build:mobile

# Run on Android (builds automatically)
pnpm run dev:android

# Run on iOS (builds automatically)
pnpm run dev:ios

# Build for production
pnpm run build:android  # Android APK
pnpm run build:ios      # iOS app
```

### Development Commands

```bash
# Start web development server
pnpm run dev

# Build web app only
pnpm run build

# Sync web build to mobile platforms
npx cap sync

# Open in Android Studio
npx cap open android

# Open in Xcode
npx cap open ios
```

## Platform-Specific Setup

### Android Development

#### Android Studio Setup

1. **Install Android Studio** from [developer.android.com](https://developer.android.com/studio)
2. **Install Android SDK** (API level 35 recommended)
3. **Create Virtual Device** or connect physical device
4. **Enable Developer Options** on physical device

#### Building for Android

```bash
# Development build and run
pnpm run dev:android

# Production build
pnpm run build:android

# Open in Android Studio for debugging
npx cap open android
```

#### Troubleshooting Android

**Java Version Issues:**

- The project auto-downloads Java 21 for builds
- Your system Java version doesn't matter
- If you see Java errors, run `npm run setup:android`

**Build Failures:**

```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
pnpm run build:mobile
```

**Emulator Issues:**

- Ensure Android Virtual Device is running
- Check `adb devices` to see connected devices
- Restart Android Studio if needed

### iOS Development (macOS Only)

#### Xcode Setup

1. **Install Xcode** from Mac App Store
2. **Install Xcode Command Line Tools**: `xcode-select --install`
3. **Accept Xcode License**: `sudo xcodebuild -license accept`

#### Building for iOS

```bash
# Development build and run
pnpm run dev:ios

# Production build
pnpm run build:ios

# Open in Xcode for debugging
npx cap open ios
```

#### iOS Simulator

```bash
# List available simulators
xcrun simctl list devices

# Boot specific simulator
xcrun simctl boot "iPhone 15 Pro"

# Run on specific simulator
npx cap run ios --target="iPhone 15 Pro"
```

## Project Structure

```
├── android/                 # Android platform (auto-generated)
├── ios/                     # iOS platform (auto-generated)
├── src/
│   ├── lib/
│   │   ├── capacitor.ts     # Capacitor utilities
│   │   └── mobile-notifications.ts
│   ├── hooks/
│   │   └── useMobile.ts     # Mobile-specific hooks
│   └── components/
│       └── CapacitorIntegration.tsx
├── scripts/
│   └── setup-android.js     # Android setup automation
└── capacitor.config.ts      # Capacitor configuration
```

## Configuration

### Capacitor Configuration

The `capacitor.config.ts` file contains platform-specific settings:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.msnmessenger.bootleg',
  appName: 'Bootleg MSN Messenger',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
```

### Android Configuration

The setup script automatically configures:

- **Java 21 compatibility** as required by Capacitor 7.0
- **Automatic toolchain download** for missing Java versions
- **Gradle optimization** for faster builds

### iOS Configuration

iOS configuration is handled automatically by Capacitor and Xcode.

## Features

### Implemented Mobile Features

- ✅ **Real-time messaging** with native performance
- ✅ **Push notifications** (local notifications working)
- ✅ **File sharing** with native file picker
- ✅ **Responsive design** optimized for mobile
- ✅ **Native navigation** with proper back button handling
- ✅ **Haptic feedback** for better UX
- ✅ **Status bar** integration
- ✅ **Splash screen** configuration

### Planned Mobile Features

- 🔄 **Push notifications** (remote notifications via FCM)
- 🔄 **Background sync** for offline message delivery
- 🔄 **Native sharing** integration
- 🔄 **Camera integration** for photo sharing
- 🔄 **Contact integration** for easy friend adding

## Testing

### Testing on Devices

```bash
# Android - USB debugging
adb devices
pnpm run dev:android

# iOS - Xcode required for device testing
pnpm run dev:ios
```

### Testing Notifications

```bash
# Test local notifications
# Open app and trigger notification from settings

# Test push notifications (when implemented)
# Will require Firebase setup
```

## Deployment

### Android Deployment

1. **Generate signed APK** in Android Studio
2. **Upload to Google Play Console**
3. **Configure app signing** and metadata

### iOS Deployment

1. **Archive in Xcode** (Product → Archive)
2. **Upload to App Store Connect**
3. **Configure app metadata** and screenshots

## Troubleshooting

### Common Issues

**"Java installation not found":**

```bash
pnpm run setup:android
```

**"Android platform not found":**

```bash
npx cap add android
pnpm run setup:android
```

**"Build failed with Gradle error":**

```bash
cd android
./gradlew clean
cd ..
pnpm run build:mobile
```

**"iOS build failed":**

```bash
# Clean Xcode build
npx cap open ios
# In Xcode: Product → Clean Build Folder
```

### Getting Help

1. **Check the logs** in Android Studio or Xcode
2. **Verify prerequisites** are installed correctly
3. **Run setup scripts** to ensure proper configuration
4. **Check Capacitor docs** at [capacitorjs.com](https://capacitorjs.com)

## Development Tips

### Hot Reload

For faster development, use the web version with mobile viewport:

```bash
pnpm run dev
# Open browser dev tools and toggle device toolbar
```

### Debugging

- **Android**: Use Chrome DevTools via `chrome://inspect`
- **iOS**: Use Safari Web Inspector
- **Both**: Console logs appear in platform IDEs

### Performance

- **Optimize images** for mobile bandwidth
- **Use lazy loading** for heavy components
- **Test on real devices** for accurate performance
- **Monitor memory usage** in platform tools

This setup ensures a smooth mobile development experience with automatic Java version management and comprehensive tooling support, fully compliant with Capacitor 7.0 requirements.
