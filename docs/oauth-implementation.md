# Cross-Platform OAuth Implementation

## Overview

This document explains the cross-platform OAuth implementation that opens system browsers for better UX on desktop and mobile platforms.

## Problem Solved

The original OAuth implementation opened OAuth providers (Google, GitHub, Apple) within the app's webview, which created several UX issues:

1. **No way to go back**: Users could get stuck in the OAuth flow with no clear way to return to the app
2. **Poor mobile experience**: Mobile users expect OAuth to open in their system browser
3. **Desktop app limitations**: Desktop apps should use system browsers for OAuth for security and familiarity
4. **Trust issues**: Users are more comfortable entering credentials in their trusted system browser

## Solution Architecture

### Platform Detection

The solution uses a platform detection utility (`src/utils/platform.ts`) to determine the current environment:

- **Web**: Standard browser environment
- **Desktop**: Tauri-based desktop application
- **Mobile**: Capacitor-based mobile application (iOS/Android)

### OAuth Flow by Platform

#### Web Platform

- **Behavior**: Uses in-app OAuth (fallback to original behavior)
- **Reason**: Web apps typically handle OAuth within the same browser context
- **Implementation**: Standard Convex Auth OAuth flow

#### Desktop Platform (Tauri)

1. **OAuth URL Generation**: Convex backend generates proper OAuth URL
2. **System Browser**: Tauri opens the URL in the user's default system browser
3. **Callback Handling**: OAuth callback is handled in the system browser
4. **Event Communication**: Success/failure is communicated back to the desktop app via Tauri events
5. **Window Management**: OAuth window can be closed automatically after completion

#### Mobile Platform (Capacitor)

1. **OAuth URL Generation**: Convex backend generates proper OAuth URL with mobile redirect scheme
2. **System Browser**: Capacitor opens the URL in the system browser
3. **App Scheme Redirect**: OAuth callback redirects to custom app scheme (`com.bootlegmsn.messenger://oauth-callback`)
4. **App Resume**: Mobile app resumes and processes the OAuth result
5. **Seamless Experience**: User returns to the app automatically

## Implementation Details

### Key Components

#### 1. Platform Detection (`src/utils/platform.ts`)

```typescript
export const Platform = {
  isDesktop: () => typeof window !== 'undefined' && '__TAURI__' in window,
  isMobile: () => Capacitor.isNativePlatform(),
  isWeb: () => !Platform.isDesktop() && !Platform.isMobile(),
  supportsSystemBrowser: () => Platform.isDesktop() || Platform.isMobile(),
}
```

#### 2. OAuth Service (`src/services/oauth.ts`)

- Handles OAuth flow for all platforms
- **Uses Convex backend** to generate secure OAuth URLs with proper client IDs
- Manages platform-specific OAuth processes (desktop, mobile, web)
- Provides fallback mechanisms when Convex OAuth generation fails
- Automatically detects platform and uses appropriate redirect URIs

#### 3. Enhanced OAuth Components

- `SignInWithGoogle.tsx`
- `SignInWithGitHub.tsx`
- `SignInWithApple.tsx`

Each component now:

- Shows loading states during OAuth
- Displays helpful instructions
- Handles platform-specific OAuth flows
- Provides better error handling

#### 4. OAuth Callback Handler (`src/components/OAuthCallback.tsx`)

- Processes OAuth callbacks from system browsers
- Handles success and error states
- Provides platform-specific completion flows
- Manages URL cleanup

#### 5. Convex OAuth Functions (`convex/oauth.ts`)

- **`generateOAuthUrl`**: Generates secure OAuth URLs with proper client IDs and redirect URIs
- **`handleOAuthCallback`**: Processes OAuth callbacks and exchanges codes for tokens
- **`getOAuthConfig`**: Provides OAuth configuration for frontend components
- Manages redirect URIs for different platforms (web, desktop, mobile)
- Uses environment variables for secure client ID management

### Tauri Integration

#### New Tauri Command

```rust
#[tauri::command]
async fn open_url(url: String) -> Result<(), String> {
    // Opens URL in system browser with security validation
}
```

#### Event Handling

- `oauth-result`: Communicates OAuth success/failure back to the app
- Automatic window management for OAuth flows

### Mobile Integration

#### App Scheme Configuration

- **iOS**: `com.bootlegmsn.messenger://oauth-callback`
- **Android**: `com.bootlegmsn.messenger://oauth-callback`

#### Capacitor Plugins Used

- `@capacitor/browser`: Opens system browser
- `@capacitor/app`: Handles app URL scheme callbacks

## User Experience Improvements

### Before (In-App OAuth)

- ❌ Users could get stuck in OAuth flow
- ❌ No clear way to go back to app login
- ❌ Poor mobile experience
- ❌ Security concerns with in-app webviews

### After (System Browser OAuth)

- ✅ OAuth opens in trusted system browser
- ✅ Clear instructions and loading states
- ✅ Automatic return to app after completion
- ✅ Better error handling and recovery
- ✅ Platform-appropriate behavior
- ✅ Fallback to in-app OAuth when needed

## Configuration Requirements

### Environment Variables

```bash
# OAuth Provider Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GITHUB_CLIENT_ID=your_github_client_id
APPLE_CLIENT_ID=your_apple_client_id

# Site URL for redirect URIs
SITE_URL=https://your-app-domain.com
```

### Redirect URI Configuration

#### Web

- `https://your-app-domain.com/oauth-callback`

#### Desktop

- `https://your-app-domain.com/oauth-callback` (opens in system browser)

#### Mobile

- `com.bootlegmsn.messenger://oauth-callback`

## Testing the Implementation

### Web Testing

1. Click any OAuth button
2. Should use in-app OAuth (existing behavior)
3. Verify normal OAuth flow works

### Desktop Testing (Tauri)

1. Build and run desktop app: `pnpm dev:tauri`
2. Click any OAuth button
3. Should see "Opening [Provider]..." message
4. System browser should open with OAuth URL
5. Complete OAuth in system browser
6. Desktop app should receive success event
7. OAuth window should close automatically

### Mobile Testing (Capacitor)

1. Build and run mobile app: `pnpm dev:ios` or `pnpm dev:android`
2. Click any OAuth button
3. Should see "Opening [Provider] sign-in..." message
4. System browser should open
5. Complete OAuth in system browser
6. Should redirect back to mobile app
7. App should process OAuth result

## Error Handling

### Common Error Scenarios

1. **OAuth Provider Error**: Handled with user-friendly messages
2. **Network Issues**: Graceful fallback to in-app OAuth
3. **Platform Detection Failure**: Falls back to web behavior
4. **Callback Processing Error**: Clear error messages with retry options

### Recovery Mechanisms

- **Fallback to in-app OAuth**: If system browser OAuth fails
- **Clear error messages**: Users understand what went wrong
- **Retry functionality**: Easy way to try OAuth again
- **Return to sign-in**: Always a way back to the main login screen

## Security Considerations

### Validation

- OAuth URLs are validated before opening
- Only HTTPS URLs are allowed
- State parameters are used for CSRF protection

### Platform Security

- **Desktop**: Uses Tauri's secure shell plugin
- **Mobile**: Uses Capacitor's secure browser plugin
- **Web**: Standard browser security model

## Future Enhancements

### Potential Improvements

1. **OAuth Provider Detection**: Automatically detect available providers
2. **Biometric Integration**: Add biometric authentication on mobile
3. **SSO Support**: Enterprise single sign-on integration
4. **OAuth Token Management**: Better token refresh and management
5. **Multi-Account Support**: Allow multiple OAuth accounts

### Monitoring and Analytics

- Track OAuth success/failure rates by platform
- Monitor user drop-off in OAuth flows
- Analyze platform-specific OAuth performance

## Troubleshooting

### Common Issues

#### Desktop App

- **Browser doesn't open**: Check Tauri shell plugin configuration
- **Events not received**: Verify Tauri event system setup
- **Window doesn't close**: Check window management permissions

#### Mobile App

- **App scheme not working**: Verify URL scheme configuration in Capacitor
- **Browser doesn't return to app**: Check redirect URI configuration
- **App doesn't resume**: Verify app URL listener setup

#### All Platforms

- **OAuth URL generation fails**:
  - Check Convex function deployment (`convex/oauth.ts`)
  - Verify `VITE_CONVEX_URL` environment variable
  - Ensure Convex backend is running
- **Provider configuration missing**:
  - Verify OAuth client ID environment variables in Convex
  - Check `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`, `APPLE_CLIENT_ID`
- **Callback processing fails**: Check OAuth callback handler and redirect URI configuration
- **Fallback URLs used**: Check browser console for Convex connection errors

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed OAuth flow information.

## Conclusion

This cross-platform OAuth implementation significantly improves the user experience by:

1. **Using system browsers** for OAuth on desktop and mobile
2. **Providing clear navigation** and instructions
3. **Handling errors gracefully** with recovery options
4. **Maintaining security** across all platforms
5. **Offering fallback mechanisms** when needed

The implementation respects platform conventions while maintaining a consistent user experience across web, desktop, and mobile applications.
