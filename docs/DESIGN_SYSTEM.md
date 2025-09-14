# MSN Messenger Design System

## Overview

This design system combines nostalgic MSN Messenger aesthetics with modern glassmorphism effects and customizable theming. It provides a cohesive visual language that's both familiar and contemporary.

## Core Principles

1. **Nostalgia with Modernity**: Classic MSN blue/purple color schemes with contemporary glass effects
2. **Customization**: Real-time theme customization with live preview
3. **Accessibility**: Proper contrast ratios and keyboard navigation
4. **Responsiveness**: Mobile-first design with touch-friendly interactions

## Color System

### MSN-Inspired Palette

```css
--msn-blue: #0078d4
--msn-blue-light: #4f9eff
--msn-blue-dark: #005a9e
--msn-purple: #8b5cf6
--msn-purple-light: #a78bfa
--msn-purple-dark: #7c3aed
```

### Status Colors

```css
--status-online: #22c55e (green with glow)
--status-away: #eab308 (yellow with glow)
--status-busy: #ef4444 (red with glow)
--status-offline: #6b7280 (gray)
```

## Glassmorphism System

### Utility Classes

- `.glass` - Default glass effect with medium blur
- `.glass-subtle` - Light glass effect
- `.glass-sm` - Small blur (8px)
- `.glass-lg` - Large blur (16px)
- `.glass-xl` - Extra large blur (24px)

### Glass Components

- `<Glass>` - Base glass wrapper component
- `<GlassCard>` - Glass-enhanced card
- `<GlassButton>` - Glass button variant
- `<GlassOverlay>` - Modal/dialog overlay

## Theme Customization

### Available Presets

1. **Classic MSN** - Original blue/purple theme
2. **Modern MSN** - Enhanced contrast version
3. **Retro MSN** - Muted nostalgic tones
4. **MSN Sunset** - Warm gradient theme
5. **Ocean Breeze** - Cool blue tones
6. **Forest Green** - Nature-inspired theme

### Custom Themes

Users can customize:
- Primary, secondary, and accent colors
- Glassmorphism intensity (subtle/medium/strong)
- Blur amount (sm/md/lg/xl)
- Enable/disable glass effects

## Component Enhancements

### Message Bubbles

- Own messages: MSN gradient with shadow
- Other messages: Glass effect with subtle border
- Hover effects: Scale and shadow enhancement
- Actions: Glass-enhanced floating toolbar

### Contact List

- Glass-subtle background for status bar
- Enhanced status indicators with glow effects
- Hover animations with scale and glass effects
- Selected state with MSN gradient

### Chat Interface

- Glass-enhanced header and input areas
- Smooth transitions and micro-interactions
- MSN-inspired rounded corners and spacing

## Animations

### Available Classes

- `.msn-pulse` - Gentle pulsing animation
- `.msn-bounce` - Playful bounce effect
- `.msn-fade-in` - Smooth fade-in transition
- `.msn-slide-up` - Upward slide animation
- `.msn-scale-in` - Scale-in animation
- `.glass-hover` - Enhanced glass hover effect

## Usage Examples

### Basic Glass Card

```tsx
<Card glass={true} glassVariant="subtle">
  <CardContent>
    Your content here
  </CardContent>
</Card>
```

### Custom Glass Component

```tsx
<Glass variant="strong" blur="lg" rounded="xl">
  <div className="p-4">
    Glass content with strong effect
  </div>
</Glass>
```

### Theme Customization

```tsx
import { useThemeCustomization } from '@/hooks/useThemeCustomization';

function MyComponent() {
  const { config, updateConfig, applyPreset } = useThemeCustomization();
  
  // Apply a preset
  applyPreset('modern');
  
  // Custom color
  updateConfig({
    colors: { primary: '#ff6b6b' }
  });
}
```

## Browser Support

- **Glassmorphism**: Modern browsers with `backdrop-filter` support
- **Fallbacks**: Solid backgrounds for unsupported browsers
- **Progressive Enhancement**: Core functionality works everywhere

## Accessibility

- Proper color contrast ratios maintained
- Keyboard navigation support
- Screen reader friendly
- Touch targets meet minimum size requirements (44px)
- Focus indicators with glass effects

## Performance

- CSS-based animations for smooth performance
- Minimal JavaScript for theme switching
- Efficient CSS variables for real-time updates
- Optimized for mobile devices
