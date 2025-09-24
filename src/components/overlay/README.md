# Overlay System

The Overlay System provides a centralized way to manage and render modal dialogs, sheets, and other overlay components in the application. It uses nanostores for state management and provides a React-based rendering system.

## Architecture

The overlay system consists of several key components:

- **OverlayHost**: The main component that renders all active overlays
- **OverlayRenderer**: Handles rendering individual overlay entries based on their type
- **Overlay Components**: Individual overlay implementations (ConfirmOverlay, InfoOverlay, etc.)
- **Overlay Store**: Nanostores-based state management for overlay stack
- **Overlay Hooks**: React hooks for interacting with the overlay system

## Quick Start

### 1. Add OverlayHost to your app

```tsx
import { OverlayHost } from "@/components/overlay";

function App() {
  return (
    <div>
      <main>Your app content</main>
      {/* Add OverlayHost at the root level */}
      <OverlayHost />
    </div>
  );
}
```

### 2. Use overlays in your components

```tsx
import { useOverlays } from "@/hooks/useOverlays";

function MyComponent() {
  const { open } = useOverlays();

  const showConfirmDialog = () => {
    open({
      type: "CONFIRM",
      props: {
        title: "Delete Item",
        message: "Are you sure you want to delete this item?",
        variant: "warning",
        confirmText: "Delete",
        cancelText: "Cancel",
        onConfirm: () => {
          console.log("Item deleted!");
        },
        onCancel: () => {
          console.log("Deletion cancelled");
        },
      },
    });
  };

  return (
    <button onClick={showConfirmDialog}>
      Delete Item
    </button>
  );
}
```

## Available Overlay Types

### CONFIRM
Confirmation dialogs for user actions.

```tsx
open({
  type: "CONFIRM",
  props: {
    title: "Confirm Action",
    message: "Are you sure?",
    variant: "info" | "warning" | "error" | "success",
    confirmText: "Yes",
    cancelText: "No",
    onConfirm: () => void,
    onCancel: () => void,
  },
});
```

### INFO
Information dialogs to display content to users.

```tsx
open({
  type: "INFO",
  props: {
    title: "Information",
    content: "This is important information.",
    buttonText: "Got it",
    onAction: () => void,
  },
});
```

### SETTINGS
Settings dialog overlay.

```tsx
open({
  type: "SETTINGS",
  props: {
    initialTab: "account",
  },
});
```

### SHEET
Drawer/sheet overlays that slide in from edges.

```tsx
open({
  type: "SHEET",
  props: {
    title: "Sheet Title",
    content: "Sheet content",
    side: "bottom" | "top" | "left" | "right",
  },
});
```

### Other Types
- `CREATE_GROUP`: Group creation dialog
- `EDIT_USER`: User profile editing
- `INVITE_USERS`: User invitation dialog
- `FILE_PREVIEW`: File preview modal
- `EMOJI_PICKER`: Emoji selection overlay
- `THEME_SELECTOR`: Theme customization dialog

## Configuration

### OverlayHost Configuration

```tsx
<OverlayHost
  config={{
    debug: true,           // Enable debug logging
    zIndexBase: 1000,      // Base z-index for overlays
    usePortal: true,       // Render in portal
    portalContainer: "body", // Portal container selector
  }}
  className="custom-overlay-host"
/>
```

### Overlay Properties

All overlays support these base properties:

```tsx
{
  title?: string;           // Overlay title
  description?: string;     // Overlay description
  closable?: boolean;       // Whether overlay can be closed
  className?: string;       // Custom CSS classes
  glass?: boolean;          // Glass/blur effect
  animationType?: "scale" | "slideDown" | "fade"; // Animation type
}
```

## Advanced Usage

### URL Synchronization

Use overlay sync hooks for URL integration:

```tsx
import { useBidirectionalSync } from "@/hooks/useOverlaySync";

function MyComponent() {
  const { openFromUrl, updateUrl } = useBidirectionalSync();
  
  // Overlay state will sync with URL parameters
}
```

### Batch Operations

```tsx
import { useOverlayBatch } from "@/hooks/useOverlaySync";

function MyComponent() {
  const { batchOpen, batchClose } = useOverlayBatch();
  
  const openMultiple = () => {
    batchOpen([
      { type: "INFO", props: { title: "First" } },
      { type: "CONFIRM", props: { message: "Second" } }
    ]);
  };
}
```

### Cross-Tab Synchronization

```tsx
import { useOverlayBroadcast } from "@/hooks/useOverlaySync";

function MyComponent() {
  const { isConnected, connectedTabs } = useOverlayBroadcast({
    channelName: "app-overlays"
  });
}
```

## Testing

The overlay system includes comprehensive test coverage:

```bash
# Run overlay tests
pnpm test src/components/overlay/__tests__/

# Run all tests
pnpm test
```

## TypeScript Support

The overlay system is fully typed with TypeScript:

```tsx
import type { 
  OverlayType, 
  OverlayEntry, 
  ConfirmOverlayProps 
} from "@/types/overlay";

// Type-safe overlay usage
const confirmProps: ConfirmOverlayProps = {
  message: "Are you sure?",
  onConfirm: () => console.log("Confirmed"),
};
```

## Best Practices

1. **Use appropriate overlay types**: Choose the right overlay type for your use case
2. **Handle cleanup**: Always provide onClose callbacks for proper cleanup
3. **Limit stack depth**: Avoid opening too many overlays simultaneously
4. **Test interactions**: Test overlay interactions, especially close behaviors
5. **Accessibility**: Ensure overlays are accessible with proper focus management
6. **Performance**: Use lazy loading for heavy overlay content

## Migration from Direct Dialog Usage

If you're currently using dialog components directly, you can migrate to the overlay system:

```tsx
// Before: Direct dialog usage
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogTitle>Confirm</DialogTitle>
    <p>Are you sure?</p>
  </DialogContent>
</Dialog>

// After: Overlay system
const { open } = useOverlays();

const showDialog = () => {
  open({
    type: "CONFIRM",
    props: {
      title: "Confirm",
      message: "Are you sure?",
    },
  });
};
```

This provides better state management, URL synchronization, and centralized overlay handling.
