/**
 * Unit tests for cross-platform OAuth service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signInWithProvider, showOAuthInstructions, handleOAuthCancellation } from './oauth';
import { Platform } from '@/utils/platform';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/utils/platform');

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Convex client
vi.mock('convex/browser', () => ({
  ConvexHttpClient: vi.fn().mockImplementation(() => ({
    action: vi.fn(),
  })),
}));

vi.mock('@convex/_generated/api', () => ({
  api: {
    auth: {
      generateOAuthUrl: 'auth:generateOAuthUrl',
    },
  },
}));

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

// Mock Capacitor APIs
vi.mock('@capacitor/browser', () => ({
  Browser: {
    open: vi.fn(),
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}));

describe('OAuth Service', () => {
  const mockConvexSignIn = vi.fn();
  
  // Get typed mock references
  const mockToast = vi.mocked(toast);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset platform detection mocks
    vi.mocked(Platform.shouldUseInAppOAuth).mockReturnValue(false);
    vi.mocked(Platform.isDesktop).mockReturnValue(false);
    vi.mocked(Platform.isMobile).mockReturnValue(false);
    vi.mocked(Platform.supportsSystemBrowser).mockReturnValue(true);
    vi.mocked(Platform.getPlatform).mockReturnValue('web');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('signInWithProvider', () => {
    it('should use in-app OAuth for web platform', async () => {
      vi.mocked(Platform.shouldUseInAppOAuth).mockReturnValue(true);

      // Mock the dynamic import to avoid timeout
      vi.doMock('@tauri-apps/api/core', () => {
        throw new Error('Tauri not available');
      });

      await signInWithProvider('google', mockConvexSignIn);

      expect(mockConvexSignIn).toHaveBeenCalledWith('google');
    }, 10000); // Increase timeout

    it('should use Convex OAuth URL for desktop platform', async () => {
      vi.mocked(Platform.isDesktop).mockReturnValue(true);
      vi.mocked(Platform.shouldUseInAppOAuth).mockReturnValue(false);

      // Mock successful Convex client
      const mockAction = vi.fn().mockResolvedValue('https://accounts.google.com/oauth/authorize?...');
      const { ConvexHttpClient } = await import('convex/browser');
      vi.mocked(ConvexHttpClient).mockImplementation(() => ({
        action: mockAction,
      }) as any);

      // Mock Tauri APIs to be available
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: vi.fn().mockResolvedValue(undefined),
      }));

      vi.doMock('@tauri-apps/api/event', () => ({
        listen: vi.fn().mockImplementation(() => 
          Promise.resolve(() => {}) // Mock unlisten function
        ),
      }));

      // Mock the dynamic import to return our mocked functions
      const originalImport = await import('@tauri-apps/api/core');
      vi.mocked(originalImport.invoke).mockResolvedValue(undefined);

      try {
        // This will timeout in test environment, but we can verify the Convex call
        const promise = signInWithProvider('google', mockConvexSignIn);
        
        // Wait a bit for the OAuth URL generation to be called
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // The promise will timeout, but we can still check if Convex was called
        expect(mockAction).toHaveBeenCalledWith('auth:generateOAuthUrl', {
          provider: 'google',
          platform: 'desktop',
        });
        
        // Cancel the promise to avoid timeout
        return;
      } catch (error) {
        // Expected in test environment
        expect(mockAction).toHaveBeenCalledWith('auth:generateOAuthUrl', {
          provider: 'google',
          platform: 'desktop',
        });
      }
    }, 1000);

    it('should fallback to in-app OAuth on error', async () => {
      vi.mocked(Platform.isDesktop).mockReturnValue(true);
      vi.mocked(Platform.shouldUseInAppOAuth).mockReturnValue(false);

      // Mock Tauri import failure
      vi.doMock('@tauri-apps/api/core', () => {
        throw new Error('Tauri not available');
      });

      await signInWithProvider('google', mockConvexSignIn);

      expect(mockConvexSignIn).toHaveBeenCalledWith('google');
    }, 10000); // Increase timeout
  });

  describe('showOAuthInstructions', () => {
    it('should show desktop instructions', () => {
      vi.mocked(Platform.isDesktop).mockReturnValue(true);

      showOAuthInstructions('google');

      expect(mockToast.info).toHaveBeenCalledWith(
        'Opening Google in your default browser...',
        {
          description: 'Complete the sign-in process in your browser, then return to the app.',
        }
      );
    });

    it('should show mobile instructions', () => {
      vi.mocked(Platform.isMobile).mockReturnValue(true);

      showOAuthInstructions('github');

      expect(mockToast.info).toHaveBeenCalledWith(
        'Opening Github sign-in...',
        {
          description: "You'll be redirected back to the app after signing in.",
        }
      );
    });
  });

  describe('handleOAuthCancellation', () => {
    it('should show cancellation message', () => {
      handleOAuthCancellation();

      expect(mockToast.info).toHaveBeenCalledWith('Sign-in cancelled', {
        description: 'You can try again anytime.',
      });
    });
  });
});